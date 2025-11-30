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
const SOURCE_TAGS = {
  101102979: 'xrp.cafe',
  10011010: 'Magnetic',
  74920348: 'First Ledger',
  20221212: 'XPMarket',
  69420589: 'Bidds',
  110100111: 'Sologenic',
  80085: 'Zerpaay',
  11782013: 'ANODEX',
  13888813: 'Zerpmon',
  20102305: 'Opulence',
  42697468: 'Bithomp',
  123321: 'BearBull',
  4152544945: 'ArtDept',
  100010010: 'StaticBit',
  80008000: 'Orchestra'
};

const getSourceTagName = (sourceTag) => SOURCE_TAGS[sourceTag] || (sourceTag ? 'Unknown' : null);

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
    return 'now';
  } else if (diffInSeconds < 60) {
    return `${diffInSeconds}s`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d`;
  }
};

// Trade size indicator - returns icon and opacity based on XRP value
const getTradeSizeInfo = (value) => {
  const xrpValue = parseFloat(value);
  if (xrpValue < 500) return { Icon: Fish, opacity: 0.3 };
  if (xrpValue < 1000) return { Icon: Fish, opacity: 0.5 };
  if (xrpValue < 2500) return { Icon: Fish, opacity: 0.7 };
  if (xrpValue < 5000) return { Icon: Anchor, opacity: 0.8 };
  if (xrpValue < 10000) return { Icon: Ship, opacity: 0.9 };
  return { Icon: Ship, opacity: 1 };
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
  const [newTradeIds, setNewTradeIds] = useState(new Set());
  const [pairType, setPairType] = useState('xrp'); // xrp, token, or empty for all
  const [xrpAmount, setXrpAmount] = useState(''); // Filter by minimum XRP amount
  const [historyType, setHistoryType] = useState('trades'); // trades, liquidity, all
  const [timeRange, setTimeRange] = useState(''); // 1h, 24h, 7d, 30d, or empty for all
  const [accountFilter, setAccountFilter] = useState('');
  const [liquidityType, setLiquidityType] = useState(''); // deposit, withdraw, create, or empty for all
  const [tabValue, setTabValue] = useState(0);
  const previousTradesRef = useRef(new Set());
  const limit = 20;

  // Cursor-based pagination state
  const [cursor, setCursor] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [cursorHistory, setCursorHistory] = useState([]); // Stack of cursors for back navigation
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [direction, setDirection] = useState('desc'); // 'desc' = newest first, 'asc' = oldest first
  const [isLastPage, setIsLastPage] = useState(false); // True when we've reached the end of records

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

  const handleTxClick = (hash, tradeAccount) => {
    if (onTransactionClick) {
      onTransactionClick(hash, tradeAccount);
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

  const fetchTradingHistory = useCallback(async (useCursor = null, isRefresh = false, useDirection = 'desc') => {
    if (!tokenId) {
      setLoading(false);
      return;
    }

    try {
      // Build query params
      const params = new URLSearchParams({
        md5: tokenId,
        limit: String(limit),
        type: historyType,
        direction: useDirection
      });

      // Add cursor for pagination (but not for refresh which should get latest)
      if (useCursor && !isRefresh) {
        params.set('cursor', String(useCursor));
      }

      // Add optional filters
      if (pairType) {
        params.set('pairType', pairType);
      }

      if (xrpAmount && pairType === 'xrp' && historyType === 'trades') {
        params.set('xrpAmount', xrpAmount);
      }

      if (accountFilter) {
        params.set('account', accountFilter);
      }

      // Add time range params
      if (timeRange) {
        const now = Date.now();
        const ranges = {
          '1h': 60 * 60 * 1000,
          '24h': 24 * 60 * 60 * 1000,
          '7d': 7 * 24 * 60 * 60 * 1000,
          '30d': 30 * 24 * 60 * 60 * 1000
        };
        if (ranges[timeRange]) {
          params.set('startTime', String(now - ranges[timeRange]));
          params.set('endTime', String(now));
        }
      }

      const response = await fetch(`https://api.xrpl.to/api/history?${params}`);
      const data = await response.json();

      if (data.result === 'success') {
        // Client-side filter for liquidity type (API doesn't support this filter)
        let filteredHists = data.hists;
        if (liquidityType && historyType !== 'trades') {
          filteredHists = data.hists.filter(h => h.isLiquidity && h.type === liquidityType);
        }

        const currentTradeIds = previousTradesRef.current;
        const newTrades = filteredHists.filter((trade) => !currentTradeIds.has(trade._id));

        if (newTrades.length > 0 && isRefresh) {
          setNewTradeIds(new Set(newTrades.map((trade) => trade._id)));
          previousTradesRef.current = new Set(data.hists.map((trade) => trade._id));
          setTimeout(() => {
            setNewTradeIds(new Set());
          }, 1000);
        }

        setTrades(filteredHists.slice(0, 50));
        setNextCursor(data.nextCursor || null);
        setTotalRecords(data.totalRecords || 0);

        // Determine if we've reached the end of records in the current direction
        // For direction=asc with no cursor (first request), we're viewing the oldest records
        // which IS the last page - nextCursor in this case points BACK toward page 1
        // Only set isLastPage=false if we're navigating forward and there's more data
        const recordsReturned = data.recordsReturned || filteredHists.length;

        if (useDirection === 'asc' && !useCursor) {
          // First page of asc = last page of records (oldest), this is the end
          setIsLastPage(true);
        } else {
          // Normal pagination - check if there are more records
          const hasMoreRecords = recordsReturned >= limit && data.nextCursor;
          setIsLastPage(!hasMoreRecords);
        }
      }
    } catch (error) {
      console.error('Error fetching trading history:', error);
    } finally {
      setLoading(false);
    }
  }, [tokenId, pairType, xrpAmount, historyType, timeRange, accountFilter, liquidityType]);

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

  // Reset pagination when filters change
  useEffect(() => {
    setCursor(null);
    setNextCursor(null);
    setCursorHistory([]);
    setCurrentPage(1);
    setDirection('desc');
    setIsLastPage(false);
    previousTradesRef.current = new Set();
    setLoading(true);
    fetchTradingHistory(null, false, 'desc');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenId, pairType, xrpAmount, historyType, timeRange, accountFilter, liquidityType]);

  // Auto-refresh interval (only for page 1 with desc direction)
  useEffect(() => {
    if (currentPage !== 1 || direction !== 'desc') return;

    // Sync with ledger updates every 4 seconds
    const intervalId = setInterval(() => {
      fetchTradingHistory(null, true, 'desc');
    }, 4000);

    return () => clearInterval(intervalId);
  }, [fetchTradingHistory, currentPage, direction]);

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


  // Cursor-based pagination handlers
  const handleNextPage = useCallback(() => {
    if (!nextCursor) return;

    // Save current cursor to history for back navigation
    setCursorHistory(prev => [...prev, cursor]);
    setCursor(nextCursor);

    // Update page number based on direction
    if (direction === 'desc') {
      setCurrentPage(prev => prev + 1);
    } else {
      setCurrentPage(prev => prev - 1);
    }

    setLoading(true);
    fetchTradingHistory(nextCursor, false, direction);
  }, [nextCursor, cursor, direction, fetchTradingHistory]);

  const handlePrevPage = useCallback(() => {
    if (cursorHistory.length === 0) return;

    // Pop the last cursor from history
    const newHistory = [...cursorHistory];
    const prevCursor = newHistory.pop();

    setCursorHistory(newHistory);
    setCursor(prevCursor);

    // Update page number based on direction
    if (direction === 'desc') {
      setCurrentPage(prev => prev - 1);
    } else {
      setCurrentPage(prev => prev + 1);
    }

    setLoading(true);
    fetchTradingHistory(prevCursor, false, direction);
  }, [cursorHistory, direction, fetchTradingHistory]);

  const handleFirstPage = useCallback(() => {
    if (currentPage === 1 && direction === 'desc') return;

    setCursor(null);
    setNextCursor(null);
    setCursorHistory([]);
    setCurrentPage(1);
    setDirection('desc');
    setLoading(true);
    fetchTradingHistory(null, false, 'desc');
  }, [currentPage, direction, fetchTradingHistory]);

  // Jump back multiple pages at once
  const handleJumpBack = useCallback((steps) => {
    if (steps <= 0 || steps > cursorHistory.length) return;

    const newHistory = [...cursorHistory];
    let targetCursor = null;

    // Pop 'steps' cursors from history
    for (let i = 0; i < steps; i++) {
      targetCursor = newHistory.pop();
    }

    setCursorHistory(newHistory);
    setCursor(targetCursor);

    if (direction === 'desc') {
      setCurrentPage(prev => prev - steps);
    } else {
      setCurrentPage(prev => prev + steps);
    }

    setLoading(true);
    fetchTradingHistory(targetCursor, false, direction);
  }, [cursorHistory, direction, fetchTradingHistory]);

  // Jump to last page (oldest records)
  const handleLastPage = useCallback(() => {
    if (!tokenId || totalRecords <= limit) return;

    const totalPages = Math.ceil(totalRecords / limit);

    // Use direction=asc with no cursor to get oldest records
    // This IS the last page - there are no older records beyond this
    setCursor(null);
    setNextCursor(null);
    setCursorHistory([]);
    setCurrentPage(totalPages);
    setDirection('asc');
    setIsLastPage(true); // We're at the true last page (oldest records)
    setLoading(true);
    fetchTradingHistory(null, false, 'asc');
  }, [tokenId, totalRecords, limit, fetchTradingHistory]);

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
      const isLiquidity = trade.isLiquidity;
      const isBuy = trade.paid.currency === 'XRP';
      const xrpAmount = getXRPAmount(trade);
      const price = isLiquidity ? null : calculatePrice(trade);
      const volumePercentage = Math.min(100, Math.max(5, (xrpAmount / 50000) * 100));

      const amountData = isBuy ? trade.got : trade.paid;
      const totalData = isBuy ? trade.paid : trade.got;

      // For liquidity events, show the account; for trades show taker (or maker if taker is AMM)
      let addressToShow = isLiquidity ? trade.account : trade.taker;
      if (!isLiquidity && amm && trade.taker === amm) {
        addressToShow = trade.maker;
      }

      // Liquidity type label
      const getLiquidityLabel = (type) => {
        if (type === 'deposit') return 'ADD';
        if (type === 'withdraw') return 'REMOVE';
        if (type === 'create') return 'CREATE';
        return type?.toUpperCase() || 'LIQ';
      };

      return (
        <Card key={trade._id} isNew={newTradeIds.has(trade._id)} isDark={isDark}>
          <VolumeIndicator volume={volumePercentage} isDark={isDark} />
          <CardContent>
            <Box style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.8fr 1.4fr 1.4fr 0.6fr 0.5fr 0.2fr', gap: '4px', alignItems: 'center' }}>
              <Box style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', minWidth: '28px', whiteSpace: 'nowrap' }}>
                  {formatRelativeTime(trade.time)}
                </span>
                {isLiquidity ? (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    color: trade.type === 'deposit' || trade.type === 'create' ? '#8b5cf6' : '#f59e0b',
                    width: '48px'
                  }}>
                    {getLiquidityLabel(trade.type)}
                  </span>
                ) : (
                  <TradeTypeChip tradetype={isBuy ? 'BUY' : 'SELL'}>{isBuy ? 'BUY' : 'SELL'}</TradeTypeChip>
                )}
              </Box>

              <span style={{ fontSize: '12px', fontFamily: 'monospace', color: isDark ? '#fff' : '#1a1a1a' }}>
                {isLiquidity ? (trade.lpTokens ? `${formatTradeValue(trade.lpTokens)} LP` : '-') : formatPrice(price)}
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
                  const { Icon, opacity } = getTradeSizeInfo(val);
                  return <Icon size={13} style={{ opacity, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', marginLeft: '4px' }} />;
                })()}
              </Box>

              <Link href={`/profile/${addressToShow}`} isDark={isDark}>
                {addressToShow ? `${addressToShow.slice(0, 4)}...${addressToShow.slice(-4)}` : ''}
              </Link>

              <span style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {isLiquidity ? 'AMM' : (getSourceTagName(trade.sourceTag) || '')}
              </span>

              <IconButton onClick={() => handleTxClick(trade.hash, addressToShow)} isDark={isDark}>
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

  const emptyState = (
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
        {historyType === 'liquidity' ? 'No Liquidity Events' : historyType === 'all' ? 'No Activity' : 'No Recent Trades'}
      </Typography>
      <Typography variant="body2" color="text.secondary" isDark={isDark}>
        {historyType === 'liquidity' ? 'AMM liquidity events will appear here' : 'Trading activity will appear here when available'}
      </Typography>
    </Box>
  );

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <select
              value={pairType}
              onChange={(e) => { setPairType(e.target.value); setPage(1); }}
              style={{
                padding: '5px 8px',
                fontSize: '11px',
                fontWeight: 500,
                borderRadius: '6px',
                border: `1px solid ${pairType ? '#3b82f6' : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)')}`,
                background: isDark ? (pairType ? 'rgba(59,130,246,0.15)' : 'rgba(0,0,0,0.8)') : (pairType ? 'rgba(59,130,246,0.1)' : '#fff'),
                color: pairType ? '#3b82f6' : (isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'),
                cursor: 'pointer',
                outline: 'none',
                colorScheme: isDark ? 'dark' : 'light',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                appearance: 'none'
              }}
            >
              <option value="" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>All Pairs</option>
              <option value="xrp" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>XRP Pairs</option>
              <option value="token" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>Token Pairs</option>
            </select>
            <select
              value={historyType}
              onChange={(e) => { setHistoryType(e.target.value); setPage(1); }}
              style={{
                padding: '5px 8px',
                fontSize: '11px',
                fontWeight: 500,
                borderRadius: '6px',
                border: `1px solid ${historyType !== 'trades' ? '#3b82f6' : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)')}`,
                background: isDark ? (historyType !== 'trades' ? 'rgba(59,130,246,0.15)' : 'rgba(0,0,0,0.8)') : (historyType !== 'trades' ? 'rgba(59,130,246,0.1)' : '#fff'),
                color: historyType !== 'trades' ? '#3b82f6' : (isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'),
                cursor: 'pointer',
                outline: 'none',
                colorScheme: isDark ? 'dark' : 'light',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                appearance: 'none'
              }}
            >
              <option value="trades" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>Trades</option>
              <option value="liquidity" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>Liquidity</option>
              <option value="all" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>All</option>
            </select>
            {historyType !== 'trades' && (
              <select
                value={liquidityType}
                onChange={(e) => { setLiquidityType(e.target.value); setPage(1); }}
                style={{
                  padding: '5px 8px',
                  fontSize: '11px',
                  fontWeight: 500,
                  borderRadius: '6px',
                  border: `1px solid ${liquidityType ? '#8b5cf6' : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)')}`,
                  background: isDark ? (liquidityType ? 'rgba(139,92,246,0.15)' : 'rgba(0,0,0,0.8)') : (liquidityType ? 'rgba(139,92,246,0.1)' : '#fff'),
                  color: liquidityType ? '#8b5cf6' : (isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'),
                  cursor: 'pointer',
                  outline: 'none',
                  colorScheme: isDark ? 'dark' : 'light',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  appearance: 'none'
                }}
              >
                <option value="" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>All Events</option>
                <option value="deposit" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>Deposits</option>
                <option value="withdraw" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>Withdrawals</option>
                <option value="create" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>Pool Creates</option>
              </select>
            )}
            <select
              value={xrpAmount}
              onChange={(e) => { setXrpAmount(e.target.value); setPage(1); }}
              style={{
                padding: '5px 8px',
                fontSize: '11px',
                fontWeight: 500,
                borderRadius: '6px',
                border: `1px solid ${xrpAmount ? '#3b82f6' : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)')}`,
                background: isDark ? (xrpAmount ? 'rgba(59,130,246,0.15)' : 'rgba(0,0,0,0.8)') : (xrpAmount ? 'rgba(59,130,246,0.1)' : '#fff'),
                color: xrpAmount ? '#3b82f6' : (isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'),
                cursor: 'pointer',
                outline: 'none',
                colorScheme: isDark ? 'dark' : 'light',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                appearance: 'none'
              }}
            >
              <option value="" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>Min XRP</option>
              <option value="100" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>100+</option>
              <option value="500" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>500+</option>
              <option value="1000" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>1k+</option>
              <option value="2500" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>2.5k+</option>
              <option value="5000" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>5k+</option>
              <option value="10000" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>10k+</option>
            </select>
            <select
              value={timeRange}
              onChange={(e) => { setTimeRange(e.target.value); setPage(1); }}
              style={{
                padding: '5px 8px',
                fontSize: '11px',
                fontWeight: 500,
                borderRadius: '6px',
                border: `1px solid ${timeRange ? '#3b82f6' : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)')}`,
                background: isDark ? (timeRange ? 'rgba(59,130,246,0.15)' : 'rgba(0,0,0,0.8)') : (timeRange ? 'rgba(59,130,246,0.1)' : '#fff'),
                color: timeRange ? '#3b82f6' : (isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'),
                cursor: 'pointer',
                outline: 'none',
                colorScheme: isDark ? 'dark' : 'light',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                appearance: 'none'
              }}
            >
              <option value="" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>All Time</option>
              <option value="1h" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>1h</option>
              <option value="24h" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>24h</option>
              <option value="7d" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>7d</option>
              <option value="30d" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>30d</option>
            </select>
            <input
              type="text"
              value={accountFilter}
              onChange={(e) => { setAccountFilter(e.target.value); setPage(1); }}
              placeholder="Filter account..."
              style={{
                padding: '5px 8px',
                fontSize: '11px',
                fontWeight: 500,
                borderRadius: '6px',
                border: `1px solid ${accountFilter ? '#3b82f6' : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)')}`,
                background: isDark ? (accountFilter ? 'rgba(59,130,246,0.15)' : 'rgba(0,0,0,0.8)') : (accountFilter ? 'rgba(59,130,246,0.1)' : '#fff'),
                color: isDark ? '#fff' : '#1a1a1a',
                outline: 'none',
                width: '120px'
              }}
            />
          </div>
        )}
      </Box>

      {tabValue === 0 && (
        <>
          <TableHeader isDark={isDark}>
            <div style={{ flex: '1.05', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Time
              <LiveIndicator isDark={isDark}>
                <LiveCircle />
                <span style={{ color: '#3b82f6', fontSize: '9px', fontWeight: 500 }}>LIVE</span>
              </LiveIndicator>
            </div>
            <div style={{ flex: '0.8' }}>{historyType === 'liquidity' ? 'LP Tokens' : historyType === 'all' ? 'Price/LP' : 'Price'}</div>
            <div style={{ flex: '1.4' }}>Amount</div>
            <div style={{ flex: '1.4' }}>Total</div>
            <div style={{ flex: '0.6' }}>Account</div>
            <div style={{ flex: '0.5' }}>Source</div>
            <div style={{ flex: '0.2' }}></div>
          </TableHeader>

          {trades.length === 0 ? emptyState : (
            <Stack spacing={0.25}>
              {renderedTrades}
            </Stack>
          )}

          {/* Cursor-based pagination */}
          {(totalRecords > limit || currentPage > 1) && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '16px', gap: '12px' }}>
              <Pagination isDark={isDark}>
                <PaginationButton onClick={handleFirstPage} disabled={currentPage === 1} isDark={isDark}>≪</PaginationButton>
                <PaginationButton onClick={handlePrevPage} disabled={currentPage === 1} isDark={isDark}>‹</PaginationButton>

                {/* Page number buttons */}
                {(() => {
                  const totalPages = Math.ceil(totalRecords / limit);
                  const buttons = [];

                  // Always show page 1
                  if (currentPage > 3) {
                    buttons.push(
                      <PaginationButton key={1} onClick={handleFirstPage} isDark={isDark}>1</PaginationButton>
                    );
                    if (currentPage > 4) {
                      buttons.push(
                        <span key="dots1" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', padding: '0 4px' }}>...</span>
                      );
                    }
                  }

                  // Show pages around current page (that we can navigate to via history)
                  for (let i = Math.max(1, currentPage - 2); i <= currentPage; i++) {
                    if (i === currentPage) {
                      buttons.push(
                        <PaginationButton key={i} selected isDark={isDark}>{i}</PaginationButton>
                      );
                    } else if (i >= currentPage - cursorHistory.length) {
                      // Can navigate back to this page via history
                      const stepsBack = currentPage - i;
                      buttons.push(
                        <PaginationButton
                          key={i}
                          onClick={() => handleJumpBack(stepsBack)}
                          isDark={isDark}
                        >
                          {i}
                        </PaginationButton>
                      );
                    }
                  }

                  // Show next page indicator if available and not at the last page
                  // For desc: show higher page numbers (older records)
                  // For asc: show lower page numbers (newer records)
                  const hasMorePages = nextCursor && !isLastPage;

                  if (hasMorePages && direction === 'desc') {
                    buttons.push(
                      <PaginationButton key={currentPage + 1} onClick={handleNextPage} isDark={isDark}>
                        {currentPage + 1}
                      </PaginationButton>
                    );
                    if (totalPages > currentPage + 1) {
                      buttons.push(
                        <span key="dots2" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', padding: '0 4px' }}>...</span>
                      );
                      // Show total pages estimate
                      buttons.push(
                        <Tooltip key="total" title={`~${totalPages.toLocaleString()} pages`}>
                          <span style={{
                            fontSize: '11px',
                            color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                            padding: '0 6px'
                          }}>
                            {totalPages.toLocaleString()}
                          </span>
                        </Tooltip>
                      );
                    }
                  } else if (hasMorePages && direction === 'asc' && currentPage > 1) {
                    // When viewing from last page (asc), show path back to page 1
                    buttons.push(
                      <PaginationButton key={currentPage - 1} onClick={handleNextPage} isDark={isDark}>
                        {currentPage - 1}
                      </PaginationButton>
                    );
                    if (currentPage > 2) {
                      buttons.push(
                        <span key="dots2" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', padding: '0 4px' }}>...</span>
                      );
                      buttons.push(
                        <span key="page1" style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', padding: '0 6px' }}>1</span>
                      );
                    }
                  }

                  return buttons;
                })()}

                <PaginationButton onClick={handleNextPage} disabled={isLastPage} isDark={isDark}>›</PaginationButton>
                <PaginationButton onClick={handleLastPage} disabled={isLastPage && direction === 'asc'} isDark={isDark}>≫</PaginationButton>
              </Pagination>
              <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                {totalRecords > 0 ? `${totalRecords.toLocaleString()} records` : ''}
              </span>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.7fr 0.7fr 0.8fr 0.8fr 0.9fr 0.6fr 0.5fr', gap: '8px', padding: '8px 0', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                <span style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>Pool</span>
                <span style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', textAlign: 'right' }}>Fee</span>
                <span style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', textAlign: 'right' }}>APY</span>
                <span style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', textAlign: 'right' }}>Fees</span>
                <span style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', textAlign: 'right' }}>Volume</span>
                <span style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', textAlign: 'right' }}>Liquidity</span>
                <span style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', textAlign: 'right' }}>Last Trade</span>
                <span></span>
              </div>
              {/* Rows */}
              {ammPools.map((pool) => {
                const asset1 = pool.asset1?.currency === 'XRP' ? 'XRP' : decodeCurrency(pool.asset1?.currency);
                const asset2 = pool.asset2?.currency === 'XRP' ? 'XRP' : decodeCurrency(pool.asset2?.currency);
                const feePercent = pool.tradingFee ? (pool.tradingFee / 100000).toFixed(3) : '-';
                const hasApy = pool.apy7d?.apy > 0;
                // Check if this is the main XRP/TOKEN pool
                const isMainPool = (pool.asset1?.currency === 'XRP' && pool.asset2?.issuer === token?.issuer && pool.asset2?.currency === token?.currency) ||
                                   (pool.asset2?.currency === 'XRP' && pool.asset1?.issuer === token?.issuer && pool.asset1?.currency === token?.currency);
                return (
                  <div key={pool._id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.7fr 0.7fr 0.8fr 0.8fr 0.9fr 0.6fr 0.5fr', gap: '8px', padding: '10px 0', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`, alignItems: 'center', background: isMainPool ? (isDark ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.06)') : 'transparent', borderRadius: isMainPool ? '6px' : '0', marginLeft: isMainPool ? '-4px' : '0', marginRight: isMainPool ? '-4px' : '0', paddingLeft: isMainPool ? '4px' : '0', paddingRight: isMainPool ? '4px' : '0' }}>
                    {/* Pool pair */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex' }}>
                        <img src={getTokenImageUrl(pool.asset1.issuer, pool.asset1.currency)} alt="" style={{ width: 18, height: 18, borderRadius: '50%' }} />
                        <img src={getTokenImageUrl(pool.asset2.issuer, pool.asset2.currency)} alt="" style={{ width: 18, height: 18, borderRadius: '50%', marginLeft: -6 }} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 500, color: isDark ? '#fff' : '#1a1a1a' }}>{asset1}/{asset2}</span>
                      {isMainPool && (
                        <span style={{ fontSize: '9px', fontWeight: 500, padding: '2px 5px', borderRadius: '4px', background: '#3b82f6', color: '#fff' }}>MAIN</span>
                      )}
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
                    {/* Last Trade */}
                    <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', textAlign: 'right' }}>
                      {pool.lastTraded ? formatRelativeTime(pool.lastTraded) : '-'}
                    </span>
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
