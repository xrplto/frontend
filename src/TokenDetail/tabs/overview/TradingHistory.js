import React, { useState, useEffect, useCallback, useRef, memo, useMemo, Suspense } from 'react';
import useWebSocket from 'react-use-websocket';
import { MD5 } from 'crypto-js';
import styled from '@emotion/styled';
import TopTraders from 'src/TokenDetail/tabs/holders/TopTraders';
import RichList from 'src/TokenDetail/tabs/holders/RichList';
import { ExternalLink, X, Plus, Fish, Waves, Anchor, Ship, Loader2 } from 'lucide-react';

// Custom styled components
const Box = styled.div``;
const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.spacing ? `${props.spacing * 8}px` : '0'};
`;
const Spinner = styled(Loader2)`
  animation: spin 1s linear infinite;
  color: #147DFE;
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
const Typography = styled.div`
  font-size: ${props => props.variant === 'h6' ? '14px' : props.variant === 'caption' ? '11px' : '12px'};
  font-weight: ${props => props.fontWeight || 400};
  color: ${props =>
    props.color === 'text.secondary' ? (props.isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)') :
    props.color === 'success.main' ? '#22c55e' :
    (props.isDark ? '#fff' : '#1a1a1a')};
`;

// Constants
const getTokenImageUrl = (issuer, currency) => {
  // XRP has a special MD5
  if (currency === 'XRP') {
    return 'https://s1.xrpl.to/token/84e5efeb89c4eae8f68188982dc290d8';
  }
  // Calculate MD5 for the token
  const tokenIdentifier = issuer + '_' + currency;
  const md5Hash = MD5(tokenIdentifier).toString();
  return `https://s1.xrpl.to/token/${md5Hash}`;
};
const decodeCurrency = (currency) => {
  if (!currency || currency === 'XRP') return currency || 'XRP';
  // Only decode if it's a 40-character hex string (standard currency code format)
  if (currency.length === 40 && /^[0-9A-F]+$/i.test(currency)) {
    try {
      return Buffer.from(currency, 'hex').toString('utf8').replace(/\x00/g, '');
    } catch {
      return currency;
    }
  }
  // Already plain text (e.g., "DROP", "GDROP", "BTC")
  return currency;
};

// Performance utilities
const throttle = (func, delay) => {
  let lastCall = 0;
  let timeout;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return func(...args);
    }
    clearTimeout(timeout);
    timeout = setTimeout(
      () => {
        lastCall = Date.now();
        func(...args);
      },
      delay - (now - lastCall)
    );
  };
};

// Define the highlight animation with softer colors
const highlightAnimation = (isDark) => `
  @keyframes highlight {
    0% {
      background-color: ${isDark ? 'rgba(20, 125, 254, 0.08)' : 'rgba(20, 125, 254, 0.08)'};
    }
    50% {
      background-color: ${isDark ? 'rgba(20, 125, 254, 0.04)' : 'rgba(20, 125, 254, 0.04)'};
    }
    100% {
      background-color: transparent;
    }
  }
`;

// Styled components with improved design
const LiveIndicator = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 4px;
  background: ${props => props.isDark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.08)'};
`;

const LiveCircle = styled.div`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #3b82f6;
  animation: pulse 2s infinite;
  @keyframes pulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }
`;

const Card = styled.div`
  background: transparent;
  border-bottom: 1px solid ${props => props.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'};
  position: relative;
  animation: ${props => props.isNew ? 'highlight 0.8s ease-out' : 'none'};
  &:hover { background: ${props => props.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'}; }
  ${props => props.isNew && highlightAnimation(props.isDark)}
`;

const CardContent = styled.div`
  padding: 8px 0;
`;

const TradeTypeChip = styled.div`
  font-size: 11px;
  font-weight: 500;
  color: ${props => props.tradetype === 'BUY' ? '#22c55e' : '#ef4444'};
  width: 32px;
`;

const VolumeIndicator = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: ${props => props.volume}%;
  background: ${props => props.isDark ? 'rgba(59,130,246,0.04)' : 'rgba(59,130,246,0.03)'};
  transition: width 0.2s;
`;

const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
`;

const PaginationButton = styled.button`
  color: ${props => props.selected ? '#fff' : (props.isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)')};
  background: ${props => props.selected ? '#3b82f6' : 'transparent'};
  border: 1.5px solid ${props => props.selected ? '#3b82f6' : (props.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')};
  border-radius: 6px;
  font-size: 12px;
  font-weight: 400;
  min-width: 28px;
  height: 28px;
  cursor: pointer;
  transition: border-color 0.15s;
  &:hover { border-color: #3b82f6; }
  &:disabled { opacity: 0.4; cursor: default; }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  color: ${props => props.isDark ? '#FFFFFF' : '#212B36'};
`;

const TableHeader = styled.div`
  display: flex;
  padding: 10px 0;
  border-bottom: 1px solid ${props => props.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
  & > div {
    font-size: 10px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${props => props.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'};
  }
`;

const TableHead = styled.thead``;
const TableBody = styled.tbody``;
const TableRow = styled.tr`
  &:hover {
    background-color: ${props => props.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'};
  }
  border-bottom: 1px solid ${props => props.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
`;

const TableCell = styled.td`
  padding: 12px;
  font-size: ${props => props.size === 'small' ? '13px' : '14px'};
  text-align: ${props => props.align || 'left'};
  font-weight: ${props => props.fontWeight || 400};
  opacity: ${props => props.opacity || 1};
  text-transform: ${props => props.textTransform || 'none'};
`;

const TableContainer = styled.div`
  border-radius: 12px;
  border: 1.5px solid ${props => props.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'};
  overflow: auto;
`;

const Link = styled.a`
  text-decoration: none;
  color: ${props => props.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'};
  font-size: 11px;
  &:hover { color: #3b82f6; }
`;

const Tooltip = ({ title, children, arrow }) => {
  const [show, setShow] = useState(false);
  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '4px 8px',
          background: 'rgba(0,0,0,0.9)',
          color: '#fff',
          borderRadius: '4px',
          fontSize: '12px',
          whiteSpace: 'pre-line',
          zIndex: 1000,
          marginBottom: '4px'
        }}>
          {title}
        </div>
      )}
    </div>
  );
};

const IconButton = styled.button`
  padding: 4px;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: ${props => props.isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s;
  &:hover { color: #3b82f6; }
`;

const FormControlLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 400;
  color: ${props => props.isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)'};
  cursor: pointer;
`;

const Tabs = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
`;

const Tab = styled.button`
  font-size: 12px;
  font-weight: 400;
  padding: 6px 12px;
  background: ${props => props.selected ? (props.isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.1)') : 'transparent'};
  border: 1.5px solid ${props => props.selected ? '#3b82f6' : 'transparent'};
  border-radius: 6px;
  color: ${props => props.selected ? '#3b82f6' : (props.isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)')};
  cursor: pointer;
  transition: all 0.15s;
  &:hover { color: ${props => props.isDark ? '#fff' : '#1a1a1a'}; }
`;

const Button = styled.button`
  padding: ${props => props.size === 'small' ? '4px 10px' : '8px 16px'};
  font-size: 11px;
  font-weight: 400;
  border-radius: 6px;
  border: 1.5px solid ${props => props.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'};
  background: transparent;
  color: ${props => props.isDark ? 'rgba(255,255,255,0.8)' : '#374151'};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: border-color 0.15s;
  &:hover { border-color: #3b82f6; }
`;

const Dialog = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.8);
  display: ${props => props.open ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const DialogPaper = styled.div`
  background: #000;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  max-width: 400px;
  width: 90%;
  max-height: 90vh;
  overflow: auto;
`;

const DialogTitle = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  font-size: 14px;
  font-weight: 500;
  color: #fff;
`;

const DialogContent = styled.div`
  padding: 20px;
  color: #fff;
`;

const TextField = styled.input`
  width: 100%;
  padding: 10px 12px;
  font-size: 13px;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 8px;
  background: rgba(255,255,255,0.05);
  color: #fff;
  &:focus { outline: none; border-color: #3b82f6; }
  &::placeholder { color: rgba(255,255,255,0.3); }
`;

const FormControl = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const RadioGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Radio = styled.input`
  width: 14px;
  height: 14px;
  cursor: pointer;
  accent-color: #3b82f6;
`;

// Helper functions
const formatRelativeTime = (timestamp) => {
  const now = Date.now();
  const diffInSeconds = Math.floor((now - timestamp) / 1000);

  if (diffInSeconds < 0) {
    return 'just now';
  } else if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}min ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
};

// Trade size indicator - returns icon component and color based on XRP value
const getTradeSizeInfo = (value) => {
  const xrpValue = parseFloat(value);
  if (xrpValue < 500) return { Icon: Fish, size: 12, opacity: 0.4 };
  if (xrpValue < 1000) return { Icon: Fish, size: 13, opacity: 0.5 };
  if (xrpValue < 2500) return { Icon: Waves, size: 13, opacity: 0.6 };
  if (xrpValue < 5000) return { Icon: Anchor, size: 14, opacity: 0.7 };
  if (xrpValue < 10000) return { Icon: Ship, size: 14, opacity: 0.8 };
  return { Icon: Ship, size: 16, opacity: 1 };
};

const formatTradeValue = (value) => {
  const numValue = typeof value === 'string' ? Number(value) : value;

  if (Math.abs(numValue) < 0.0001) {
    return numValue.toFixed(8);
  }

  if (Math.abs(numValue) < 1) {
    return numValue.toFixed(4);
  }

  return abbreviateNumber(numValue);
};

const formatPrice = (value) => {
  const numValue = typeof value === 'string' ? Number(value) : value;

  if (Math.abs(numValue) < 0.000001) {
    return numValue.toFixed(12);
  }

  if (Math.abs(numValue) < 0.00001) {
    return numValue.toFixed(10);
  }

  if (Math.abs(numValue) < 0.0001) {
    return numValue.toFixed(8);
  }

  if (Math.abs(numValue) < 0.01) {
    return numValue.toFixed(8);
  }

  if (Math.abs(numValue) < 1) {
    return numValue.toFixed(6);
  }

  if (Math.abs(numValue) < 100) {
    return numValue.toFixed(6);
  }

  return numValue.toFixed(4);
};

const abbreviateNumber = (num) => {
  if (Math.abs(num) < 1000) return num.toFixed(1);
  const suffixes = ['', 'k', 'M', 'B', 'T'];
  const magnitude = Math.floor(Math.log10(Math.abs(num)) / 3);
  const scaled = num / Math.pow(10, magnitude * 3);
  return scaled.toFixed(2).replace(/\.?0+$/, '') + suffixes[magnitude];
};

const getXRPAmount = (trade) => {
  const xrpValue =
    trade.paid.currency === 'XRP'
      ? parseValue(trade.paid.value)
      : trade.got.currency === 'XRP'
        ? parseValue(trade.got.value)
        : 0;
  return xrpValue;
};

const parseValue = (value) => {
  if (typeof value === 'string' && value.includes('e')) {
    return parseFloat(Number(value).toFixed(8));
  }
  return parseFloat(value);
};

const filterTrades = (trades, selectedFilter) => {
  if (!trades || !Array.isArray(trades)) return [];

  const filters = {
    All: () => true,
    '<500': (trade) => {
      const xrpAmount = getXRPAmount(trade);
      return xrpAmount > 0 && xrpAmount < 500;
    },
    '500-1k': (trade) => {
      const xrpAmount = getXRPAmount(trade);
      return xrpAmount >= 500 && xrpAmount < 1000;
    },
    '1k-2.5k': (trade) => {
      const xrpAmount = getXRPAmount(trade);
      return xrpAmount >= 1000 && xrpAmount < 2500;
    },
    '2.5k-5k': (trade) => {
      const xrpAmount = getXRPAmount(trade);
      return xrpAmount >= 2500 && xrpAmount < 5000;
    },
    '5k-10k': (trade) => {
      const xrpAmount = getXRPAmount(trade);
      return xrpAmount >= 5000 && xrpAmount < 10000;
    },
    '10k+': (trade) => {
      const xrpAmount = getXRPAmount(trade);
      return xrpAmount >= 10000;
    }
  };

  const filteredTrades = trades.filter(filters[selectedFilter]);
  return filteredTrades.sort((a, b) => b.time - a.time);
};

// OrderBook helper functions
const ORDER_TYPE_BIDS = 1;
const ORDER_TYPE_ASKS = 2;

function getXRPPair(issuer, currency) {
  const t1 = 'XRPL_XRP';
  const t2 = issuer + '_' + currency;
  let pair = t1 + t2;
  if (t1.localeCompare(t2) > 0) pair = t2 + t1;
  return MD5(pair).toString();
}

function getInitPair(token) {
  const issuer = token.issuer;
  const currency = token.currency;
  const name = token.name;
  const pairMD5 = getXRPPair(issuer, currency);
  const curr1 = { currency, name, issuer, value: 0, ...token };
  const curr2 = {
    currency: 'XRP',
    issuer: 'XRPL',
    name: 'XRP',
    value: 0,
    md5: '84e5efeb89c4eae8f68188982dc290d8'
  };
  const pair = { id: 1, pair: pairMD5, curr1, curr2, count: 0 };
  return pair;
}

const formatOrderBook = (offers, orderType = ORDER_TYPE_BIDS, arrOffers = []) => {
  if (!offers || offers.length < 1) return [];

  // Cache first offer checks
  const firstOffer = offers[0];
  const getCurrency = firstOffer.TakerGets?.currency || 'XRP';
  const payCurrency = firstOffer.TakerPays?.currency || 'XRP';

  // Pre-calculate multiplier
  const isBID = orderType === ORDER_TYPE_BIDS;
  const multiplier = getCurrency === 'XRP' ? 1_000_000 :
                    payCurrency === 'XRP' ? 0.000_001 : 1;

  // Create old offers set more efficiently
  const oldOfferIds = new Set(arrOffers.map(offer => offer.id));

  // Process offers with single pass
  const array = [];
  let sumAmount = 0;
  let sumValue = 0;

  // Use for...of for better performance
  for (const offer of offers) {
    const id = `${offer.Account}:${offer.Sequence}`;
    const gets = offer.taker_gets_funded || offer.TakerGets;
    const pays = offer.taker_pays_funded || offer.TakerPays;

    const takerPays = pays.value || pays;
    const takerGets = gets.value || gets;

    const amount = Number(isBID ? takerPays : takerGets);

    // Skip zero amounts early
    if (amount <= 0) continue;

    // Optimize power calculation
    const price = isBID ? 1 / (offer.quality * multiplier) : offer.quality * multiplier;
    const value = amount * price;

    sumAmount += amount;
    sumValue += value;

    // Create object with calculated values
    array.push({
      id,
      price,
      amount,
      value,
      sumAmount,
      sumValue,
      avgPrice: sumValue / sumAmount,
      sumGets: 0,
      sumPays: 0,
      isNew: !oldOfferIds.has(id)
    });
  }

  // Sort in place for better performance
  array.sort((a, b) => {
    return orderType === ORDER_TYPE_BIDS ? b.price - a.price : a.price - b.price;
  });

  // Limit to 30 entries to prevent memory growth
  return array.slice(0, 30);
};

const TradingHistory = ({ tokenId, amm, token, pairs, onTransactionClick, isDark = false }) => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [newTradeIds, setNewTradeIds] = useState(new Set());
  const [xrpOnly, setXrpOnly] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const previousTradesRef = useRef(new Set());
  const limit = 20;

  // OrderBook state
  const [orderBookData, setOrderBookData] = useState({ bids: [], asks: [] });
  const [clearNewFlag, setClearNewFlag] = useState(false);
  const [wsReady, setWsReady] = useState(false);
  const [bidId, setBidId] = useState(-1);
  const [askId, setAskId] = useState(-1);
  const [selectedPair, setSelectedPair] = useState(() => (token ? getInitPair(token) : null));
  const [ammPools, setAmmPools] = useState([]);
  const [ammLoading, setAmmLoading] = useState(false);
  const [addLiquidityDialog, setAddLiquidityDialog] = useState({ open: false, pool: null });
  const [depositAmount1, setDepositAmount1] = useState('');
  const [depositAmount2, setDepositAmount2] = useState('');
  const [depositMode, setDepositMode] = useState('double'); // 'double', 'single1', 'single2'

  const WSS_URL = 'wss://s1.ripple.com';

  // WebSocket for OrderBook - optimized handlers
  const { sendJsonMessage } = useWebSocket(WSS_URL, {
    onOpen: () => {
      requestAnimationFrame(() => setWsReady(true));
    },
    onClose: () => {
      requestAnimationFrame(() => setWsReady(false));
    },
    shouldReconnect: (closeEvent) => true,
    onMessage: (event) => processOrderBookMessages(event)
  });



  const handleXrpOnlyChange = (event) => {
    setXrpOnly(event.target.checked);
    setPage(1);
  };

  const handleTxClick = (hash) => {
    if (onTransactionClick) {
      onTransactionClick(hash);
    }
  };

  const handleTabChange = async (event, newValue) => {
    setTabValue(newValue);
    if (newValue === 1 && token && ammPools.length === 0) {
      setAmmLoading(true);
      try {
        const res = await fetch(
          `https://api.xrpl.to/api/amm-pools?issuer=${token.issuer}&currency=${token.currency}&sortBy=fees`
        );
        const data = await res.json();
        setAmmPools(data.pools || []);
      } catch (error) {
        console.error('Error fetching AMM pools:', error);
      } finally {
        setAmmLoading(false);
      }
    }
  };

  const fetchTradingHistory = useCallback(async () => {
    if (!tokenId) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `https://api.xrpl.to/api/history?md5=${tokenId}&page=${page - 1}&limit=${limit}${
          xrpOnly ? '&xrpOnly=true' : ''
        }`
      );
      const data = await response.json();
      if (data.result === 'success') {
        const currentTradeIds = previousTradesRef.current;
        const newTrades = data.hists.filter((trade) => !currentTradeIds.has(trade._id));

        if (newTrades.length > 0) {
          setNewTradeIds(new Set(newTrades.map((trade) => trade._id)));
          previousTradesRef.current = new Set(data.hists.map((trade) => trade._id));
          setTimeout(() => {
            setNewTradeIds(new Set());
          }, 1000);
        }

        setTrades(data.hists.slice(0, 50));
        setTotalPages(Math.ceil(data.count / limit));
      }
    } catch (error) {
      console.error('Error fetching trading history:', error);
    } finally {
      setLoading(false);
    }
  }, [tokenId, page, xrpOnly]);

  // Batch updates for better performance
  const pendingUpdatesRef = useRef({ asks: null, bids: null });
  const updateTimerRef = useRef(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Cancel any pending animation frames
      if (updateTimerRef.current) {
        cancelAnimationFrame(updateTimerRef.current);
      }
    };
  }, []);

  // Apply batched updates
  const applyBatchedUpdates = useCallback(() => {
    const updates = pendingUpdatesRef.current;
    if (updates.asks || updates.bids) {
      setOrderBookData(prev => ({
        asks: updates.asks || prev.asks,
        bids: updates.bids || prev.bids
      }));
      pendingUpdatesRef.current = { asks: null, bids: null };
    }
  }, []);

  // WebSocket message processor - heavily optimized
  const processOrderBookMessages = useMemo(
    () =>
      throttle((event) => {
        // Parse in a try-catch to handle errors gracefully
        let orderBook;
        try {
          orderBook = JSON.parse(event.data);
        } catch (error) {
          console.error('Failed to parse orderbook message:', error);
          return;
        }

        if (!orderBook?.result || orderBook.status !== 'success') return;

        const req = orderBook.id % 2;
        const offers = orderBook.result.offers;

        // Process in microtask to avoid blocking
        queueMicrotask(() => {
          try {
            if (req === 1) {
              // Process asks
              const parsed = formatOrderBook(offers, ORDER_TYPE_ASKS, pendingUpdatesRef.current.asks || orderBookData.asks);
              pendingUpdatesRef.current.asks = parsed;
            } else if (req === 0) {
              // Process bids
              const parsed = formatOrderBook(offers, ORDER_TYPE_BIDS, pendingUpdatesRef.current.bids || orderBookData.bids);
              pendingUpdatesRef.current.bids = parsed;
            }

            // Batch updates using RAF for smooth rendering
            if (updateTimerRef.current) cancelAnimationFrame(updateTimerRef.current);
            updateTimerRef.current = requestAnimationFrame(applyBatchedUpdates);
          } catch (error) {
            console.error('Error processing orderbook data:', error);
          }
        });
      }, 300), // Increased throttle for better batching
    [applyBatchedUpdates]
  );

  // OrderBook WebSocket request
  const requestOrderBook = useCallback(() => {
    if (!wsReady || !selectedPair) return;

    const pair = selectedPair;
    const curr1 = pair.curr1;
    const curr2 = pair.curr2;
    let reqID = 1;

    const cmdAsk = {
      id: reqID,
      command: 'book_offers',
      taker_gets: {
        currency: curr1.currency,
        issuer: curr1.currency === 'XRP' ? undefined : curr1.issuer
      },
      taker_pays: {
        currency: curr2.currency,
        issuer: curr2.currency === 'XRP' ? undefined : curr2.issuer
      },
      ledger_index: 'validated',
      limit: 60
    };
    const cmdBid = {
      id: reqID + 1,
      command: 'book_offers',
      taker_gets: {
        currency: curr2.currency,
        issuer: curr2.currency === 'XRP' ? undefined : curr2.issuer
      },
      taker_pays: {
        currency: curr1.currency,
        issuer: curr1.currency === 'XRP' ? undefined : curr1.issuer
      },
      ledger_index: 'validated',
      limit: 60
    };
    sendJsonMessage(cmdAsk);
    sendJsonMessage(cmdBid);
  }, [wsReady, selectedPair, sendJsonMessage]);

  // Clear new flags effect - optimized with RAF
  useEffect(() => {
    if (clearNewFlag) {
      requestAnimationFrame(() => {
        setClearNewFlag(false);
        setOrderBookData((prev) => ({
          asks: prev.asks.map((ask) => ({ ...ask, isNew: false })),
          bids: prev.bids.map((bid) => ({ ...bid, isNew: false }))
        }));
      });
    }
  }, [clearNewFlag]);

  useEffect(() => {
    previousTradesRef.current = new Set();
    setLoading(true);
    fetchTradingHistory();

    // Sync with ledger updates every 4 seconds
    const intervalId = setInterval(fetchTradingHistory, 4000);

    return () => clearInterval(intervalId);
  }, [fetchTradingHistory]);

  // OrderBook WebSocket effect - optimized polling
  useEffect(() => {
    if (!wsReady || !selectedPair) return;

    // Initial request
    requestOrderBook();

    // Sync orderbook requests with ledger updates
    const timer = setInterval(() => requestOrderBook(), 4000);

    return () => {
      clearInterval(timer);
      if (updateTimerRef.current) {
        cancelAnimationFrame(updateTimerRef.current);
      }
    };
  }, [wsReady, selectedPair, requestOrderBook]);


  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleAddLiquidity = (pool) => {
    setAddLiquidityDialog({ open: true, pool });
    setDepositAmount1('');
    setDepositAmount2('');
    setDepositMode('double');
  };

  const handleCloseDialog = () => {
    setAddLiquidityDialog({ open: false, pool: null });
  };

  const handleAmount1Change = (value) => {
    setDepositAmount1(value);
    if (depositMode === 'double') {
      if (!value) {
        setDepositAmount2('');
      } else if (addLiquidityDialog.pool?.currentLiquidity) {
        const pool = addLiquidityDialog.pool;
        const ratio = pool.currentLiquidity.asset2Amount / pool.currentLiquidity.asset1Amount;
        setDepositAmount2((parseFloat(value) * ratio).toFixed(6));
      }
    }
  };

  const handleAmount2Change = (value) => {
    setDepositAmount2(value);
    if (depositMode === 'double') {
      if (!value) {
        setDepositAmount1('');
      } else if (addLiquidityDialog.pool?.currentLiquidity) {
        const pool = addLiquidityDialog.pool;
        const ratio = pool.currentLiquidity.asset1Amount / pool.currentLiquidity.asset2Amount;
        setDepositAmount1((parseFloat(value) * ratio).toFixed(6));
      }
    }
  };

  const handleSubmitDeposit = async () => {
    const { pool } = addLiquidityDialog;
    if (!pool) return;

    try {
      const xrpl = await import('xrpl');
      const wallet = xrpl.Wallet.fromSeed(process.env.WALLET_SEED); // Replace with actual wallet
      const client = new xrpl.Client('wss://s1.ripple.com');
      await client.connect();

      const tx = {
        TransactionType: 'AMMDeposit',
        Account: wallet.address,
        Asset: pool.asset1.currency === 'XRP'
          ? { currency: 'XRP' }
          : { currency: pool.asset1.currency, issuer: pool.asset1.issuer },
        Asset2: pool.asset2.currency === 'XRP'
          ? { currency: 'XRP' }
          : { currency: pool.asset2.currency, issuer: pool.asset2.issuer }
      };

      if (depositMode === 'double') {
        tx.Amount = pool.asset1.currency === 'XRP'
          ? xrpl.xrpToDrops(depositAmount1)
          : { currency: pool.asset1.currency, issuer: pool.asset1.issuer, value: depositAmount1 };
        tx.Amount2 = pool.asset2.currency === 'XRP'
          ? xrpl.xrpToDrops(depositAmount2)
          : { currency: pool.asset2.currency, issuer: pool.asset2.issuer, value: depositAmount2 };
      } else if (depositMode === 'single1') {
        tx.Amount = pool.asset1.currency === 'XRP'
          ? xrpl.xrpToDrops(depositAmount1)
          : { currency: pool.asset1.currency, issuer: pool.asset1.issuer, value: depositAmount1 };
      } else {
        tx.Amount = pool.asset2.currency === 'XRP'
          ? xrpl.xrpToDrops(depositAmount2)
          : { currency: pool.asset2.currency, issuer: pool.asset2.issuer, value: depositAmount2 };
      }

      await client.submitAndWait(tx, { wallet });
      handleCloseDialog();
      await client.disconnect();
    } catch (error) {
      console.error('Deposit failed:', error);
    }
  };

  const calculatePrice = useCallback((trade) => {
    const xrpAmount = trade.got.currency === 'XRP' ? trade.got.value : trade.paid.value;
    const tokenAmount = trade.got.currency === 'XRP' ? trade.paid.value : trade.got.value;
    return parseFloat(xrpAmount) / parseFloat(tokenAmount);
  }, []);

  // Memoized trade list rendering
  const renderedTrades = useMemo(() => {
    return trades.map((trade, index) => {
      const isBuy = trade.paid.currency === 'XRP';
      const xrpAmount = getXRPAmount(trade);
      const price = calculatePrice(trade);
      const volumePercentage = Math.min(100, Math.max(5, (xrpAmount / 50000) * 100));

      const amountData = isBuy ? trade.got : trade.paid;
      const totalData = isBuy ? trade.paid : trade.got;

      let addressToShow = trade.maker;
      if (amm) {
        if (trade.maker === amm) {
          addressToShow = trade.taker;
        } else if (trade.taker === amm) {
          addressToShow = trade.maker;
        }
      }

      return (
        <Card key={trade._id} isNew={newTradeIds.has(trade._id)} isDark={isDark}>
          <VolumeIndicator volume={volumePercentage} isDark={isDark} />
          <CardContent>
            <Box style={{ display: 'grid', gridTemplateColumns: '0.9fr 0.8fr 1.4fr 1.4fr 0.8fr 0.2fr', gap: '8px', alignItems: 'center' }}>
              <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', width: '52px' }}>
                  {formatRelativeTime(trade.time)}
                </span>
                <TradeTypeChip tradetype={isBuy ? 'BUY' : 'SELL'}>{isBuy ? 'BUY' : 'SELL'}</TradeTypeChip>
              </Box>

              <span style={{ fontSize: '12px', fontFamily: 'monospace', color: isDark ? '#fff' : '#1a1a1a' }}>
                {formatPrice(price)}
              </span>

              <Box style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <img src={getTokenImageUrl(amountData.issuer, amountData.currency)} alt="" style={{ width: '14px', height: '14px', borderRadius: '50%' }} />
                <span style={{ fontSize: '12px', color: isDark ? '#fff' : '#1a1a1a' }}>
                  {formatTradeValue(amountData.value)} <span style={{ opacity: 0.5 }}>{decodeCurrency(amountData.currency)}</span>
                </span>
              </Box>

              <Box style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <img src={getTokenImageUrl(totalData.issuer, totalData.currency)} alt="" style={{ width: '14px', height: '14px', borderRadius: '50%' }} />
                <span style={{ fontSize: '12px', color: isDark ? '#fff' : '#1a1a1a' }}>
                  {formatTradeValue(totalData.value)} <span style={{ opacity: 0.5 }}>{decodeCurrency(totalData.currency)}</span>
                </span>
                {(() => {
                  const val = totalData.currency === 'XRP' ? parseFloat(totalData.value) : xrpAmount;
                  const { Icon, size, opacity } = getTradeSizeInfo(val);
                  return <Icon size={size} style={{ opacity, color: '#3b82f6', marginLeft: '4px' }} />;
                })()}
              </Box>

              <Link href={`/profile/${addressToShow}`} isDark={isDark}>
                {addressToShow ? `${addressToShow.slice(0, 4)}...${addressToShow.slice(-4)}` : ''}
              </Link>

              <IconButton onClick={() => handleTxClick(trade.hash)} isDark={isDark}>
                <ExternalLink size={12} />
              </IconButton>
            </Box>
          </CardContent>
        </Card>
      );
    });
  }, [trades, newTradeIds, amm, calculatePrice, handleTxClick]);


  if (loading) {
    return (
      <Stack spacing={1}>
        <Box style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
          <Spinner size={32} />
        </Box>
      </Stack>
    );
  }

  if (!trades || trades.length === 0) {
    return (
      <Stack spacing={1}>
        <Box
          style={{
            textAlign: 'center',
            padding: '24px',
            backgroundColor: 'transparent',
            borderRadius: '12px',
            border: `1.5px dashed ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`,
          }}
        >
          <Typography variant="h6" color="text.secondary" isDark={isDark} style={{ marginBottom: '8px' }}>
            No Recent Trades
          </Typography>
          <Typography variant="body2" color="text.secondary" isDark={isDark}>
            Trading activity will appear here when available
          </Typography>
        </Box>
      </Stack>
    );
  }

  return (
    <Stack spacing={1} style={{ width: '100%' }}>
      <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <Tabs isDark={isDark}>
          <Tab selected={tabValue === 0} onClick={(e) => handleTabChange(e, 0)} isDark={isDark}>Trades</Tab>
          <Tab selected={tabValue === 1} onClick={(e) => handleTabChange(e, 1)} isDark={isDark}>Pools</Tab>
          <Tab selected={tabValue === 2} onClick={(e) => handleTabChange(e, 2)} isDark={isDark}>Traders</Tab>
          <Tab selected={tabValue === 3} onClick={(e) => handleTabChange(e, 3)} isDark={isDark}>Holders</Tab>
        </Tabs>
        {tabValue === 0 && (
          <button
            onClick={() => { setXrpOnly(!xrpOnly); setPage(1); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              fontSize: '11px',
              fontWeight: 500,
              borderRadius: '6px',
              border: `1.5px solid ${xrpOnly ? '#3b82f6' : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)')}`,
              background: xrpOnly ? (isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.1)') : 'transparent',
              color: xrpOnly ? '#3b82f6' : (isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'),
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <img src="https://s1.xrpl.to/token/84e5efeb89c4eae8f68188982dc290d8" alt="" style={{ width: 14, height: 14, borderRadius: '50%' }} />
            XRP pairs
          </button>
        )}
      </Box>

      {tabValue === 0 && (
        <>
          <TableHeader isDark={isDark}>
            <div style={{ flex: '0.9', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Time
              <LiveIndicator isDark={isDark}>
                <LiveCircle />
                <span style={{ color: '#3b82f6', fontSize: '9px', fontWeight: 500 }}>LIVE</span>
              </LiveIndicator>
            </div>
            <div style={{ flex: '0.8' }}>Price</div>
            <div style={{ flex: '1.4' }}>Amount</div>
            <div style={{ flex: '1.4' }}>Total</div>
            <div style={{ flex: '0.8' }}>Account</div>
            <div style={{ flex: '0.2' }}></div>
          </TableHeader>

          <Stack spacing={0.25}>
            {renderedTrades}
          </Stack>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
              <Pagination isDark={isDark}>
                <PaginationButton onClick={() => handlePageChange(null, 1)} disabled={page === 1} isDark={isDark}>≪</PaginationButton>
                <PaginationButton onClick={() => handlePageChange(null, page - 1)} disabled={page === 1} isDark={isDark}>‹</PaginationButton>
                {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <PaginationButton key={pageNum} onClick={() => handlePageChange(null, pageNum)} selected={page === pageNum} isDark={isDark}>
                      {pageNum}
                    </PaginationButton>
                  );
                })}
                <PaginationButton onClick={() => handlePageChange(null, page + 1)} disabled={page === totalPages} isDark={isDark}>›</PaginationButton>
                <PaginationButton onClick={() => handlePageChange(null, totalPages)} disabled={page === totalPages} isDark={isDark}>≫</PaginationButton>
              </Pagination>
            </div>
          )}
        </>
      )}


      {tabValue === 1 && (
        <Box>
          {ammLoading ? (
            <Box style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
              <Spinner size={20} />
            </Box>
          ) : ammPools.length === 0 ? (
            <Box style={{ textAlign: 'center', padding: '20px', border: `1px dashed ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, borderRadius: '8px' }}>
              <span style={{ fontSize: '12px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>No pools found</span>
            </Box>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.7fr 0.7fr 0.8fr 0.8fr 1fr 0.5fr', gap: '8px', padding: '8px 0', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                <span style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>Pool</span>
                <span style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', textAlign: 'right' }}>Fee</span>
                <span style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', textAlign: 'right' }}>APY</span>
                <span style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', textAlign: 'right' }}>Fees</span>
                <span style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', textAlign: 'right' }}>Volume</span>
                <span style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', textAlign: 'right' }}>Liquidity</span>
                <span></span>
              </div>
              {/* Rows */}
              {ammPools.map((pool) => {
                const asset1 = pool.asset1?.currency === 'XRP' ? 'XRP' : decodeCurrency(pool.asset1?.currency);
                const asset2 = pool.asset2?.currency === 'XRP' ? 'XRP' : decodeCurrency(pool.asset2?.currency);
                const feePercent = pool.tradingFee ? (pool.tradingFee / 100000).toFixed(3) : '-';
                const hasApy = pool.apy7d?.apy > 0;
                return (
                  <div key={pool._id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.7fr 0.7fr 0.8fr 0.8fr 1fr 0.5fr', gap: '8px', padding: '10px 0', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`, alignItems: 'center' }}>
                    {/* Pool pair */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex' }}>
                        <img src={getTokenImageUrl(pool.asset1.issuer, pool.asset1.currency)} alt="" style={{ width: 18, height: 18, borderRadius: '50%' }} />
                        <img src={getTokenImageUrl(pool.asset2.issuer, pool.asset2.currency)} alt="" style={{ width: 18, height: 18, borderRadius: '50%', marginLeft: -6 }} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 500, color: isDark ? '#fff' : '#1a1a1a' }}>{asset1}/{asset2}</span>
                    </div>
                    {/* Fee */}
                    <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', textAlign: 'right' }}>{feePercent}%</span>
                    {/* APY */}
                    <span style={{ fontSize: '11px', fontWeight: hasApy ? 500 : 400, color: hasApy ? '#22c55e' : (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'), textAlign: 'right' }}>
                      {hasApy ? `${pool.apy7d.apy.toFixed(1)}%` : '-'}
                    </span>
                    {/* Fees */}
                    <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)', textAlign: 'right' }}>
                      {pool.apy7d?.fees > 0 ? abbreviateNumber(pool.apy7d.fees) : '-'}
                    </span>
                    {/* Volume */}
                    <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)', textAlign: 'right' }}>
                      {pool.apy7d?.volume > 0 ? abbreviateNumber(pool.apy7d.volume) : '-'}
                    </span>
                    {/* Liquidity */}
                    <div style={{ textAlign: 'right' }}>
                      {pool.apy7d?.liquidity > 0 ? (
                        <span style={{ fontSize: '11px', color: isDark ? '#fff' : '#1a1a1a' }}>{abbreviateNumber(pool.apy7d.liquidity)} <span style={{ opacity: 0.5 }}>XRP</span></span>
                      ) : pool.currentLiquidity ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.3 }}>
                          <span style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>{abbreviateNumber(pool.currentLiquidity.asset1Amount)} {asset1}</span>
                          <span style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>{abbreviateNumber(pool.currentLiquidity.asset2Amount)} {asset2}</span>
                        </div>
                      ) : <span style={{ fontSize: '11px', opacity: 0.3 }}>-</span>}
                    </div>
                    {/* Action */}
                    <button
                      onClick={() => handleAddLiquidity(pool)}
                      style={{
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: 500,
                        borderRadius: '6px',
                        border: 'none',
                        background: '#3b82f6',
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginLeft: 'auto'
                      }}
                    >
                      <Plus size={12} /> Add
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Box>
      )}

      {tabValue === 2 && token && <TopTraders token={token} />}

      {tabValue === 3 && token && (
        <Suspense fallback={<Spinner size={32} />}>
          <RichList token={token} amm={amm} />
        </Suspense>
      )}

      {/* Add Liquidity Dialog */}
      <Dialog open={addLiquidityDialog.open} onClick={(e) => e.target === e.currentTarget && handleCloseDialog()}>
        <DialogPaper isDark={isDark} maxWidth="sm">
        <DialogTitle isDark={isDark} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Add Liquidity
          <IconButton onClick={handleCloseDialog} size="small" isDark={isDark}>
            <X size={16} />
          </IconButton>
        </DialogTitle>
        <DialogContent isDark={isDark}>
          {addLiquidityDialog.pool && (
            <Stack spacing={2.5} style={{ marginTop: '8px' }}>
              <Box>
                <Typography variant="body2" isDark={isDark} style={{ marginBottom: '8px', fontSize: '13px', opacity: 0.7 }}>
                  Pool: {decodeCurrency(addLiquidityDialog.pool.asset1.currency)}/{decodeCurrency(addLiquidityDialog.pool.asset2.currency)}
                </Typography>
              </Box>

              <FormControl>
                <Typography variant="body2" isDark={isDark} style={{ marginBottom: '8px', fontSize: '13px', fontWeight: 500 }}>Deposit Mode</Typography>
                <RadioGroup>
                  <FormControlLabel isDark={isDark}>
                    <Radio type="radio" value="double" checked={depositMode === 'double'} onChange={(e) => setDepositMode(e.target.value)} />
                    <span style={{ marginLeft: '4px', color: isDark ? '#FFFFFF' : '#212B36' }}>Double-asset (both tokens, no fee)</span>
                  </FormControlLabel>
                  <FormControlLabel isDark={isDark}>
                    <Radio type="radio" value="single1" checked={depositMode === 'single1'} onChange={(e) => setDepositMode(e.target.value)} />
                    <span style={{ marginLeft: '4px', color: isDark ? '#FFFFFF' : '#212B36' }}>Single-asset ({decodeCurrency(addLiquidityDialog.pool.asset1.currency)} only)</span>
                  </FormControlLabel>
                  <FormControlLabel isDark={isDark}>
                    <Radio type="radio" value="single2" checked={depositMode === 'single2'} onChange={(e) => setDepositMode(e.target.value)} />
                    <span style={{ marginLeft: '4px', color: isDark ? '#FFFFFF' : '#212B36' }}>Single-asset ({decodeCurrency(addLiquidityDialog.pool.asset2.currency)} only)</span>
                  </FormControlLabel>
                </RadioGroup>
              </FormControl>

              {(depositMode === 'double' || depositMode === 'single1') && (
                <div>
                  <label style={{ fontSize: '13px', marginBottom: '4px', display: 'block', color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>
                    {decodeCurrency(addLiquidityDialog.pool.asset1.currency)}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TextField
                      value={depositAmount1}
                      onChange={(e) => handleAmount1Change(e.target.value)}
                      type="number"
                      placeholder="0.00"
                      isDark={isDark}
                    />
                    <span style={{ fontSize: '13px', opacity: 0.7, color: isDark ? '#FFFFFF' : '#212B36' }}>{decodeCurrency(addLiquidityDialog.pool.asset1.currency)}</span>
                  </div>
                </div>
              )}

              {(depositMode === 'double' || depositMode === 'single2') && (
                <div>
                  <label style={{ fontSize: '13px', marginBottom: '4px', display: 'block', color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>
                    {decodeCurrency(addLiquidityDialog.pool.asset2.currency)}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TextField
                      value={depositAmount2}
                      onChange={(e) => handleAmount2Change(e.target.value)}
                      type="number"
                      placeholder="0.00"
                      isDark={isDark}
                    />
                    <span style={{ fontSize: '13px', opacity: 0.7, color: isDark ? '#FFFFFF' : '#212B36' }}>{decodeCurrency(addLiquidityDialog.pool.asset2.currency)}</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleSubmitDeposit}
                style={{
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: 500,
                  width: '100%',
                  background: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Add Liquidity
              </button>
            </Stack>
          )}
        </DialogContent>
        </DialogPaper>
      </Dialog>
    </Stack>
  );
};

export default memo(TradingHistory);
