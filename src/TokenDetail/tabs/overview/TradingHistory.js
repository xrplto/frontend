import React, { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import useWebSocket from 'react-use-websocket';
import { MD5 } from 'crypto-js';
import Decimal from 'decimal.js-light';
import { alpha } from '@mui/material/styles';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Stack,
  Link,
  Tooltip,
  IconButton,
  Chip,
  CircularProgress,
  Box,
  Pagination,
  keyframes,
  List,
  ListItem,
  ListItemText,
  FormControl,
  Select,
  MenuItem,
  styled,
  useTheme,
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import { TextField, InputAdornment, RadioGroup, Radio } from '@mui/material';
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
import PairsList from 'src/TokenDetail/tabs/market/PairsList';
import TopTraders from 'src/TokenDetail/tabs/holders/TopTraders';
import { lazy, Suspense } from 'react';
import RichList from 'src/TokenDetail/tabs/holders/RichList';

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
const highlightAnimation = (theme) => keyframes`
  0% {
    background-color: ${alpha(theme.palette.primary.main, 0.08)};
  }
  50% {
    background-color: ${alpha(theme.palette.primary.main, 0.04)};
  }
  100% {
    background-color: transparent;
  }
`;

// Styled components with improved design
const LiveIndicator = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(0.25, 0.75),
  borderRadius: '12px',
  backgroundColor: 'transparent',
  backdropFilter: 'none',
  WebkitBackdropFilter: 'none',
  border: `1.5px solid ${alpha(theme.palette.divider, 0.2)}`,
  boxShadow: 'none'
}));

const LiveCircle = styled('div')(({ theme }) => ({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.main,
  animation: 'pulse 2s infinite',
  boxShadow: 'none',
  '@keyframes pulse': {
    '0%': {
      transform: 'scale(0.95)',
      opacity: 0.8
    },
    '50%': {
      transform: 'scale(1.1)',
      opacity: 1
    },
    '100%': {
      transform: 'scale(0.95)',
      opacity: 0.8
    }
  }
}));

const TradeCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'isNew' && prop !== 'tradetype'
})(({ theme, isNew, tradetype }) => ({
  marginBottom: '1px',
  borderRadius: '0',
  background: 'transparent',
  backdropFilter: 'none',
  WebkitBackdropFilter: 'none',
  border: 'none',
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  boxShadow: 'none',
  position: 'relative',
  overflow: 'hidden',
  animation: isNew ? `${highlightAnimation(theme)} 1s ease-in-out` : 'none',
  '&:hover': {
    boxShadow: 'none',
    backgroundColor: alpha(theme.palette.action.hover, 0.02)
  }
}));

const TradeTypeChip = styled(Chip)(({ theme, tradetype }) => ({
  fontSize: '13px',
  height: '20px',
  fontWeight: 400,
  borderRadius: '4px',
  background: 'transparent',
  color: tradetype === 'BUY' ? '#4caf50' : '#f44336',
  border: 'none',
  padding: '0 6px',
  boxShadow: 'none',
  '& .MuiChip-label': {
    padding: '0 2px'
  }
}));

const VolumeIndicator = styled('div')(({ theme, volume }) => ({
  position: 'absolute',
  left: 0,
  top: 0,
  height: '100%',
  width: `${volume}%`,
  background: theme.palette.mode === 'dark'
    ? 'rgba(33, 150, 243, 0.04)'
    : 'rgba(33, 150, 243, 0.02)',
  transition: 'width 0.3s ease-in-out',
  borderRadius: '12px'
}));

const StyledPagination = styled(Pagination)(({ theme }) => ({
  '& .MuiPaginationItem-root': {
    color: theme.palette.text.primary,
    borderRadius: '12px',
    margin: '0 3px',
    fontWeight: 400,
    minWidth: '32px',
    height: '32px',
    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
    }
  },
  '& .Mui-selected': {
    backgroundColor: `${theme.palette.primary.main} !important`,
    color: '#fff !important',
    fontWeight: 500,
    borderRadius: '12px',
    '&:hover': {
      backgroundColor: `${theme.palette.primary.dark} !important`
    }
  }
}));

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

const getTradeSizeIcon = (value) => {
  const xrpValue = parseFloat(value);
  if (xrpValue < 500) return 'game-icons:shrimp';
  if (xrpValue < 1000) return 'ph:fish-fill';
  if (xrpValue < 2500) return 'game-icons:dolphin';
  if (xrpValue < 5000) return 'game-icons:octopus';
  if (xrpValue < 10000) return 'game-icons:shark-fin';
  return 'game-icons:sperm-whale';
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
    '🦐 <500 XRP': (trade) => {
      const xrpAmount = getXRPAmount(trade);
      return xrpAmount > 0 && xrpAmount < 500;
    },
    '🐟 500-1000 XRP': (trade) => {
      const xrpAmount = getXRPAmount(trade);
      return xrpAmount >= 500 && xrpAmount < 1000;
    },
    '🐬 1000-2500 XRP': (trade) => {
      const xrpAmount = getXRPAmount(trade);
      return xrpAmount >= 1000 && xrpAmount < 2500;
    },
    '🐙 2500-5000 XRP': (trade) => {
      const xrpAmount = getXRPAmount(trade);
      return xrpAmount >= 2500 && xrpAmount < 5000;
    },
    '🦈 5000-10000 XRP': (trade) => {
      const xrpAmount = getXRPAmount(trade);
      return xrpAmount >= 5000 && xrpAmount < 10000;
    },
    '🐋 10000+ XRP': (trade) => {
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

  return array;
};

const TradingHistory = ({ tokenId, amm, token, pairs, onTransactionClick }) => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [newTradeIds, setNewTradeIds] = useState(new Set());
  const [xrpOnly, setXrpOnly] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const previousTradesRef = useRef(new Set());
  const theme = useTheme();
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

        setTrades(data.hists);
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
      }, 150), // Increased throttle for better batching
    [applyBatchedUpdates, orderBookData.asks, orderBookData.bids]
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

    return () => clearInterval(timer);
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

      const result = await client.submitAndWait(tx, { wallet });
      console.log('Deposit successful:', result);
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
        <TradeCard
          key={trade._id}
          isNew={newTradeIds.has(trade._id)}
          tradetype={isBuy ? 'BUY' : 'SELL'}
        >
          <VolumeIndicator volume={volumePercentage} />
          <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr 1fr',
                  sm: '1fr 0.8fr 1.5fr',
                  md: '1fr 0.8fr 1.5fr 1.5fr 1fr 0.3fr'
                },
                gap: 1,
                alignItems: 'center'
              }}
            >
              {/* Time and Type */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  fontWeight="400"
                  sx={{
                    width: '65px',
                    fontSize: '12px',
                    opacity: 0.7,
                    flexShrink: 0
                  }}
                >
                  {formatRelativeTime(trade.time)}
                </Typography>
                <TradeTypeChip
                  label={isBuy ? 'BUY' : 'SELL'}
                  tradetype={isBuy ? 'BUY' : 'SELL'}
                  size="small"
                />
              </Box>

              {/* Price */}
              <Box sx={{ textAlign: { xs: 'left', md: 'left' } }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: '12px', display: { xs: 'block', md: 'none' } }}
                >
                  Price (XRP)
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight="600"
                  color="text.primary"
                  sx={{ fontSize: '14px' }}
                >
                  {formatPrice(price)}
                </Typography>
              </Box>

              {/* Amount */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <img
                  src={getTokenImageUrl(amountData.issuer, amountData.currency)}
                  alt={decodeCurrency(amountData.currency)}
                  style={{ width: 18, height: 18, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.1)' }}
                />
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: '12px', display: { xs: 'block', md: 'none' } }}
                  >
                    Amount
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight="600"
                    color="text.primary"
                    sx={{ fontSize: '14px' }}
                  >
                    {formatTradeValue(amountData.value)}{' '}
                    {decodeCurrency(amountData.currency)}
                  </Typography>
                </Box>
              </Box>

              {/* Total */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <img
                  src={getTokenImageUrl(totalData.issuer, totalData.currency)}
                  alt={decodeCurrency(totalData.currency)}
                  style={{ width: 18, height: 18, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.1)' }}
                />
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: '12px', display: { xs: 'block', md: 'none' } }}
                  >
                    Total
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight="600"
                    color="text.primary"
                    sx={{ fontSize: '14px' }}
                  >
                    {formatTradeValue(totalData.value)} {decodeCurrency(totalData.currency)}
                  </Typography>
                </Box>
                <Box component="span" sx={{ fontSize: '13px', ml: 0.5, opacity: 0.7 }}>
                  {(() => {
                    const val = totalData.currency === 'XRP' ? parseFloat(totalData.value) : xrpAmount;
                    if (val < 500) return '🦐';
                    if (val < 1000) return '🐟';
                    if (val < 2500) return '🐬';
                    if (val < 5000) return '🐙';
                    if (val < 10000) return '🦈';
                    return '🐋';
                  })()}
                </Box>
              </Box>

              {/* Maker/Taker */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Tooltip title={`Maker: ${trade.maker}\nTaker: ${trade.taker}`} arrow>
                  <Link
                    href={`/profile/${addressToShow}`}
                    sx={{
                      textDecoration: 'none',
                      color: 'primary.main',
                      fontWeight: 400,
                      '&:hover': {
                        textDecoration: 'underline',
                        color: 'primary.dark'
                      }
                    }}
                  >
                    <Typography
                      variant="body2"
                      fontWeight="400"
                      sx={{ fontSize: '12px', color: 'primary.main', opacity: 0.9 }}
                    >
                      {addressToShow
                        ? `${addressToShow.slice(0, 4)}...${addressToShow.slice(-4)}`
                        : ''}
                    </Typography>
                  </Link>
                </Tooltip>
              </Box>

              {/* Actions */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Tooltip title="View Transaction" arrow>
                  <IconButton
                    size="small"
                    onClick={() => handleTxClick(trade.hash)}
                    sx={{
                      color: theme.palette.primary.main,
                      padding: '4px',
                      border: `1.5px solid transparent`,
                      borderRadius: '6px',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.04),
                        borderColor: alpha(theme.palette.primary.main, 0.2)
                      }
                    }}
                  >
                    <OpenInNewIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </CardContent>
        </TradeCard>
      );
    });
  }, [trades, newTradeIds, amm, calculatePrice, theme, handleTxClick]);


  if (loading) {
    return (
      <Stack spacing={1}>
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress size={40} thickness={4} />
        </Box>
      </Stack>
    );
  }

  if (!trades || trades.length === 0) {
    return (
      <Stack spacing={1}>
        <Box
          sx={{
            textAlign: 'center',
            py: 3,
            backgroundColor: 'transparent',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            borderRadius: '12px',
            border: `1.5px dashed ${alpha(theme.palette.divider, 0.2)}`,
            boxShadow: 'none'
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Recent Trades
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Trading activity will appear here when available
          </Typography>
        </Box>
      </Stack>
    );
  }

  return (
    <Stack spacing={1} sx={{ mx: 0, width: '100%' }}>
      <Box
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="trading tabs"
          sx={{
            '& .MuiTab-root': {
              fontSize: '13px',
              fontWeight: 400,
              textTransform: 'none',
              minHeight: 36,
              py: 1
            },
            '& .MuiTabs-indicator': {
              height: 2,
              borderRadius: '2px 2px 0 0'
            }
          }}
        >
          <Tab label="Trading History" />
          <Tab label="AMM Pools" />
          <Tab label="Top Traders" />
          <Tab label="Rich List" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={xrpOnly}
                  onChange={handleXrpOnlyChange}
                  size="small"
                />
              }
              label="XRP Trades Only"
              sx={{
                '& .MuiFormControlLabel-label': {
                  fontSize: '13px',
                  fontWeight: 400,
                  opacity: 0.8
                }
              }}
            />
          </Box>
          {/* Table Headers with integrated title */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
                md: '1fr 0.8fr 1.5fr 1.5fr 1fr 0.3fr'
              },
              gap: 1,
              p: 1,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              backgroundColor: alpha(theme.palette.background.default, 0.3),
              borderRadius: '12px 12px 0 0',
              border: `1.5px solid ${alpha(theme.palette.divider, 0.15)}`,
              boxShadow: 'none',
              '& > *': {
                fontWeight: 400,
                color: theme.palette.text.secondary,
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                opacity: 0.7
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ display: { xs: 'none', md: 'block' }, fontSize: '11px' }}>TIME / TYPE</Typography>
              <LiveIndicator sx={{ display: { xs: 'none', md: 'flex' }, ml: 1 }}>
                <LiveCircle />
                <Typography
                  variant="caption"
                  fontWeight="600"
                  sx={{ color: 'primary.main', fontSize: '10px' }}
                >
                  LIVE
                </Typography>
              </LiveIndicator>
            </Box>
            <Typography sx={{ display: { xs: 'none', md: 'block' }, fontSize: '11px' }}>PRICE (XRP)</Typography>
            <Typography sx={{ display: { xs: 'none', md: 'block' }, fontSize: '11px' }}>AMOUNT</Typography>
            <Typography sx={{ display: { xs: 'none', md: 'block' }, fontSize: '11px' }}>TOTAL</Typography>
            <Typography sx={{ display: { xs: 'none', md: 'block' }, fontSize: '11px' }}>BY</Typography>
            <Typography sx={{ display: { xs: 'none', md: 'block' }, fontSize: '11px' }}></Typography>
          </Box>

          <Stack spacing={0.25} sx={{ mt: 0.5 }}>
            {renderedTrades}
          </Stack>

          {totalPages > 1 && (
            <Stack direction="row" justifyContent="center" sx={{ mt: 2 }}>
              <StyledPagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                size="large"
                showFirstButton
                showLastButton
              />
            </Stack>
          )}
        </>
      )}


      {tabValue === 1 && (
        <Box sx={{ mt: 2 }}>
          {ammLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress size={40} />
            </Box>
          ) : ammPools.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 3, border: `1.5px dashed ${alpha(theme.palette.divider, 0.2)}`, borderRadius: '12px' }}>
              <Typography variant="body2" color="text.secondary">No AMM pools found</Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ boxShadow: 'none', border: `1.5px solid ${alpha(theme.palette.divider, 0.15)}`, borderRadius: '12px' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: alpha(theme.palette.background.default, 0.3) }}>
                    <TableCell sx={{ fontWeight: 400, fontSize: '11px', opacity: 0.7, textTransform: 'uppercase', py: 1.5 }}>Pool Pair</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 400, fontSize: '11px', opacity: 0.7, textTransform: 'uppercase', py: 1.5 }}>Trading Fee</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 400, fontSize: '11px', opacity: 0.7, textTransform: 'uppercase', py: 1.5 }}>7d APY</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 400, fontSize: '11px', opacity: 0.7, textTransform: 'uppercase', py: 1.5 }}>7d Fees Earned</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 400, fontSize: '11px', opacity: 0.7, textTransform: 'uppercase', py: 1.5 }}>7d Volume</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 400, fontSize: '11px', opacity: 0.7, textTransform: 'uppercase', py: 1.5 }}>Liquidity</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 400, fontSize: '11px', opacity: 0.7, textTransform: 'uppercase', py: 1.5 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ammPools.map((pool) => {
                    const asset1 = pool.asset1?.currency === 'XRP' ? 'XRP' : decodeCurrency(pool.asset1?.currency);
                    const asset2 = pool.asset2?.currency === 'XRP' ? 'XRP' : decodeCurrency(pool.asset2?.currency);
                    const feePercent = pool.tradingFee ? (pool.tradingFee / 100000).toFixed(3) : '-';
                    return (
                      <TableRow
                        key={pool._id}
                        sx={{
                          '&:hover': { backgroundColor: alpha(theme.palette.action.hover, 0.02) },
                          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`
                        }}
                      >
                        <TableCell sx={{ py: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5 }}>
                              <img
                                src={getTokenImageUrl(pool.asset1.issuer, pool.asset1.currency)}
                                alt={asset1}
                                style={{ width: 20, height: 20, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.1)' }}
                              />
                              <img
                                src={getTokenImageUrl(pool.asset2.issuer, pool.asset2.currency)}
                                alt={asset2}
                                style={{ width: 20, height: 20, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.1)', marginLeft: -8 }}
                              />
                            </Box>
                            <Typography variant="body2" fontWeight="500" sx={{ fontSize: '13px' }}>
                              {asset1}/{asset2}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ py: 1.5 }}>
                          <Typography variant="body2" sx={{ fontSize: '13px', opacity: 0.8 }}>
                            {feePercent}%
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ py: 1.5 }}>
                          <Typography
                            variant="body2"
                            color={pool.apy7d?.apy > 0 ? 'success.main' : 'text.secondary'}
                            sx={{ fontSize: '13px', fontWeight: pool.apy7d?.apy > 0 ? 500 : 400 }}
                          >
                            {pool.apy7d?.apy ? `${pool.apy7d.apy.toFixed(2)}%` : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ py: 1.5 }}>
                          <Typography variant="body2" sx={{ fontSize: '13px' }}>
                            {pool.apy7d?.fees > 0 ? abbreviateNumber(pool.apy7d.fees) : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ py: 1.5 }}>
                          <Typography variant="body2" sx={{ fontSize: '13px' }}>
                            {pool.apy7d?.volume > 0 ? abbreviateNumber(pool.apy7d.volume) : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ py: 1.5 }}>
                          <Typography variant="body2" sx={{ fontSize: '13px' }}>
                            {pool.apy7d?.liquidity > 0
                              ? `${abbreviateNumber(pool.apy7d.liquidity)} XRP`
                              : pool.currentLiquidity
                                ? `${abbreviateNumber(pool.currentLiquidity.asset1Amount)} ${asset1} / ${abbreviateNumber(pool.currentLiquidity.asset2Amount)} ${asset2}`
                                : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ py: 1.5 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => handleAddLiquidity(pool)}
                            sx={{
                              py: 0.5,
                              px: 1.5,
                              fontSize: '12px',
                              fontWeight: 400,
                              textTransform: 'none',
                              borderRadius: '8px',
                              borderWidth: '1.5px',
                              borderColor: alpha(theme.palette.divider, 0.2),
                              '&:hover': {
                                borderWidth: '1.5px',
                                borderColor: theme.palette.primary.main,
                                backgroundColor: alpha(theme.palette.primary.main, 0.04)
                              }
                            }}
                          >
                            Add
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {tabValue === 2 && token && <TopTraders token={token} />}

      {tabValue === 3 && token && (
        <Suspense fallback={<CircularProgress />}>
          <RichList token={token} amm={amm} />
        </Suspense>
      )}

      {/* Add Liquidity Dialog */}
      <Dialog open={addLiquidityDialog.open} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Add Liquidity
          <IconButton onClick={handleCloseDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {addLiquidityDialog.pool && (
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontSize: '13px', opacity: 0.7 }}>
                  Pool: {decodeCurrency(addLiquidityDialog.pool.asset1.currency)}/{decodeCurrency(addLiquidityDialog.pool.asset2.currency)}
                </Typography>
              </Box>

              <FormControl component="fieldset">
                <Typography variant="body2" sx={{ mb: 1, fontSize: '13px', fontWeight: 500 }}>Deposit Mode</Typography>
                <RadioGroup value={depositMode} onChange={(e) => setDepositMode(e.target.value)}>
                  <FormControlLabel value="double" control={<Radio size="small" />} label={<Typography sx={{ fontSize: '13px' }}>Double-asset (both tokens, no fee)</Typography>} />
                  <FormControlLabel value="single1" control={<Radio size="small" />} label={<Typography sx={{ fontSize: '13px' }}>Single-asset ({decodeCurrency(addLiquidityDialog.pool.asset1.currency)} only)</Typography>} />
                  <FormControlLabel value="single2" control={<Radio size="small" />} label={<Typography sx={{ fontSize: '13px' }}>Single-asset ({decodeCurrency(addLiquidityDialog.pool.asset2.currency)} only)</Typography>} />
                </RadioGroup>
              </FormControl>

              {(depositMode === 'double' || depositMode === 'single1') && (
                <TextField
                  label={decodeCurrency(addLiquidityDialog.pool.asset1.currency)}
                  value={depositAmount1}
                  onChange={(e) => setDepositAmount1(e.target.value)}
                  type="number"
                  fullWidth
                  size="small"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">{decodeCurrency(addLiquidityDialog.pool.asset1.currency)}</InputAdornment>
                  }}
                />
              )}

              {(depositMode === 'double' || depositMode === 'single2') && (
                <TextField
                  label={decodeCurrency(addLiquidityDialog.pool.asset2.currency)}
                  value={depositAmount2}
                  onChange={(e) => setDepositAmount2(e.target.value)}
                  type="number"
                  fullWidth
                  size="small"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">{decodeCurrency(addLiquidityDialog.pool.asset2.currency)}</InputAdornment>
                  }}
                />
              )}

              <Button
                variant="outlined"
                onClick={handleSubmitDeposit}
                fullWidth
                sx={{
                  py: 1.5,
                  fontSize: '14px',
                  fontWeight: 400,
                  textTransform: 'none',
                  borderRadius: '12px',
                  borderWidth: '1.5px',
                  '&:hover': { borderWidth: '1.5px' }
                }}
              >
                Add Liquidity
              </Button>
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </Stack>
  );
};

export default memo(TradingHistory);
