import React, { useState, useEffect, useCallback, useRef } from 'react';
import useWebSocket from 'react-use-websocket';
import { MD5 } from 'crypto-js';
import Decimal from 'decimal.js';
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
  Popover,
  Tabs,
  Tab,
  Grid
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SmartToy from '@mui/icons-material/SmartToy';
import { getTokenImageUrl, decodeCurrency } from 'src/utils/constants';
import PairsList from 'src/TokenDetail/market/PairsList';
import TopTraders from 'src/TokenDetail/toptraders';
import OrderBook from 'src/TokenDetail/trade/OrderBook';
import TradePanel from 'src/TokenDetail/trade/TradePanel';
import BidAskChart from 'src/TokenDetail/trade/BidAskChart';
import PairsSelect from 'src/TokenDetail/trade/PairsSelect';
import { lazy, Suspense } from 'react';

const RichListData = lazy(() => import('src/TokenDetail/richlist/RichListData'));

// Define the highlight animation with softer colors
const highlightAnimation = (theme) => keyframes`
  0% {
    background-color: ${theme.palette.primary.main}30;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px ${theme.palette.primary.main}40;
  }
  50% {
    background-color: ${theme.palette.primary.main}15;
    transform: translateY(0);
    box-shadow: 0 2px 4px ${theme.palette.primary.main}20;
  }
  100% {
    background-color: transparent;
    transform: translateY(0);
    box-shadow: none;
  }
`;

// Styled components with improved design
const LiveIndicator = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(0.5, 1.5),
  borderRadius: '20px',
  backgroundColor: 'transparent',
  backdropFilter: 'none',
  WebkitBackdropFilter: 'none',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
  boxShadow: `
    0 4px 16px ${alpha(theme.palette.primary.main, 0.15)}, 
    0 1px 2px ${alpha(theme.palette.primary.main, 0.05)},
    inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`
}));

const LiveCircle = styled('div')(({ theme }) => ({
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.main,
  animation: 'pulse 2s infinite',
  boxShadow: `0 0 8px ${theme.palette.primary.main}80`,
  '@keyframes pulse': {
    '0%': {
      transform: 'scale(0.95)',
      opacity: 0.8,
      boxShadow: `0 0 8px ${theme.palette.primary.main}80`
    },
    '50%': {
      transform: 'scale(1.1)',
      opacity: 1,
      boxShadow: `0 0 12px ${theme.palette.primary.main}A0`
    },
    '100%': {
      transform: 'scale(0.95)',
      opacity: 0.8,
      boxShadow: `0 0 8px ${theme.palette.primary.main}80`
    }
  }
}));

const TradeCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'isNew'
})(({ theme, isNew }) => ({
  marginBottom: theme.spacing(0.5),
  borderRadius: '8px',
  backgroundColor: 'transparent',
  backdropFilter: 'none',
  WebkitBackdropFilter: 'none',
  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
  boxShadow: `
    0 8px 32px ${alpha(theme.palette.common.black, 0.12)}, 
    0 1px 2px ${alpha(theme.palette.common.black, 0.04)},
    inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`,
  transition: 'all 0.3s ease-in-out',
  position: 'relative',
  overflow: 'hidden',
  animation: isNew ? `${highlightAnimation(theme)} 1s ease-in-out` : 'none',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: `
      0 12px 40px ${alpha(theme.palette.common.black, 0.15)}, 
      0 2px 4px ${alpha(theme.palette.common.black, 0.05)},
      inset 0 1px 1px ${alpha(theme.palette.common.white, 0.15)}`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
  }
}));

const TradeTypeChip = styled(Chip)(({ theme, tradetype }) => ({
  fontSize: '0.7rem',
  height: '24px',
  fontWeight: 'bold',
  borderRadius: '12px',
  backgroundColor: 'transparent',
  color: tradetype === 'BUY' ? theme.palette.primary.main : '#F44336',
  border:
    tradetype === 'BUY'
      ? `1px solid ${alpha(theme.palette.primary.main, 0.5)}`
      : `1px solid ${alpha('#F44336', 0.4)}`,
  boxShadow: `
    0 2px 8px ${alpha(tradetype === 'BUY' ? theme.palette.primary.main : '#F44336', 0.15)},
    inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`
}));

const VolumeIndicator = styled('div')(({ theme, volume }) => ({
  position: 'absolute',
  left: 0,
  top: 0,
  height: '100%',
  width: `${volume}%`,
  background: `linear-gradient(90deg, 
    ${theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.08)' : 'rgba(33, 150, 243, 0.05)'} 0%, 
    ${
      theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.02)' : 'rgba(33, 150, 243, 0.01)'
    } 100%)`,
  transition: 'width 0.3s ease-in-out',
  borderRadius: '12px'
}));

const StyledPagination = styled(Pagination)(({ theme }) => ({
  '& .MuiPaginationItem-root': {
    color: theme.palette.text.primary,
    borderRadius: '8px',
    margin: '0 2px',
    fontWeight: '500',
    '&:hover': {
      backgroundColor:
        theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
    }
  },
  '& .Mui-selected': {
    backgroundColor: `${theme.palette.primary.main} !important`,
    color: '#fff !important',
    fontWeight: 'bold',
    borderRadius: '8px',
    '&:hover': {
      backgroundColor: `${theme.palette.primary.dark} !important`
    }
  }
}));

// Helper functions
const formatRelativeTime = (timestamp) => {
  const now = Date.now();
  const diffInSeconds = Math.floor((now - timestamp) / 1000);

  if (diffInSeconds < 60) {
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

const getTradeSizeEmoji = (value) => {
  const xrpValue = parseFloat(value);
  if (xrpValue < 500) return '🦐';
  if (xrpValue >= 500 && xrpValue < 5000) return '🐬';
  if (xrpValue >= 5000 && xrpValue < 10000) return '🐋';
  if (xrpValue >= 10000) return '🐳';
  return '';
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
    '🐬 500-5000 XRP': (trade) => {
      const xrpAmount = getXRPAmount(trade);
      return xrpAmount >= 500 && xrpAmount < 5000;
    },
    '🐋 5000-10000 XRP': (trade) => {
      const xrpAmount = getXRPAmount(trade);
      return xrpAmount >= 5000 && xrpAmount < 10000;
    },
    '🐳 10000+ XRP': (trade) => {
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

const formatOrderBook = (offers, orderType = ORDER_TYPE_BIDS, arrOffers) => {
  if (offers.length < 1) return [];

  const getCurrency = offers[0].TakerGets?.currency || 'XRP';
  const payCurrency = offers[0].TakerPays?.currency || 'XRP';

  let multiplier = 1;
  const isBID = orderType === ORDER_TYPE_BIDS;

  if (isBID) {
    if (getCurrency === 'XRP') multiplier = 1_000_000;
    else if (payCurrency === 'XRP') multiplier = 0.000_001;
  } else {
    if (getCurrency === 'XRP') multiplier = 1_000_000;
    else if (payCurrency === 'XRP') multiplier = 0.000_001;
  }

  const array = [];
  let sumAmount = 0;
  let sumValue = 0;

  let mapOldOffers = new Map();
  for (var offer of arrOffers) {
    mapOldOffers.set(offer.id, true);
  }

  for (let i = 0; i < offers.length; i++) {
    const offer = offers[i];
    const obj = {
      id: '',
      price: 0,
      amount: 0,
      value: 0,
      sumAmount: 0,
      sumValue: 0,
      avgPrice: 0,
      sumGets: 0,
      sumPays: 0,
      isNew: false
    };

    const id = `${offer.Account}:${offer.Sequence}`;
    const gets = offer.taker_gets_funded || offer.TakerGets;
    const pays = offer.taker_pays_funded || offer.TakerPays;

    const takerPays = pays.value || pays;
    const takerGets = gets.value || gets;

    const amount = Number(isBID ? takerPays : takerGets);
    const price = isBID ? Math.pow(offer.quality * multiplier, -1) : offer.quality * multiplier;
    const value = amount * price;

    sumAmount += amount;
    sumValue += value;
    obj.id = id;
    obj.price = price;
    obj.amount = amount;
    obj.value = value;
    obj.sumAmount = sumAmount;
    obj.sumValue = sumValue;

    if (sumAmount > 0) obj.avgPrice = sumValue / sumAmount;
    else obj.avgPrice = 0;

    obj.isNew = !mapOldOffers.has(id);

    if (amount > 0) array.push(obj);
  }

  const sortedArrayByPrice = [...array].sort((a, b) => {
    let result = 0;
    if (orderType === ORDER_TYPE_BIDS) {
      result = b.price - a.price;
    } else {
      result = a.price - b.price;
    }
    return result;
  });

  return sortedArrayByPrice;
};

const TradingHistory = ({ tokenId, amm, token, pairs }) => {
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
  const [selectedPair, setSelectedPair] = useState(() => token ? getInitPair(token) : null);
  
  const WSS_URL = 'wss://xrplcluster.com';
  
  // WebSocket for OrderBook
  const { sendJsonMessage } = useWebSocket(WSS_URL, {
    onOpen: () => {
      setWsReady(true);
    },
    onClose: () => {
      setWsReady(false);
    },
    shouldReconnect: (closeEvent) => true,
    onMessage: (event) => processOrderBookMessages(event)
  });

  const [washTradingData, setWashTradingData] = useState({});
  const checkedAddressesRef = useRef(new Set());

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTrade, setSelectedTrade] = useState(null);

  const handleIconClick = (event, trade) => {
    setAnchorEl(event.currentTarget);
    setSelectedTrade(trade);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
    setSelectedTrade(null);
  };

  const openPopover = Boolean(anchorEl);

  const handleXrpOnlyChange = (event) => {
    setXrpOnly(event.target.checked);
    setPage(1);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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

  // WebSocket message processor for OrderBook
  const processOrderBookMessages = (event) => {
    const orderBook = JSON.parse(event.data);

    if (orderBook.hasOwnProperty('result') && orderBook.status === 'success') {
      const req = orderBook.id % 2;
      if (req === 1) {
        const parsed = formatOrderBook(orderBook.result.offers, ORDER_TYPE_ASKS, orderBookData.asks);
        setOrderBookData(prev => ({ ...prev, asks: parsed }));
      }
      if (req === 0) {
        const parsed = formatOrderBook(orderBook.result.offers, ORDER_TYPE_BIDS, orderBookData.bids);
        setOrderBookData(prev => ({ ...prev, bids: parsed }));
        setTimeout(() => {
          setClearNewFlag(true);
        }, 2000);
      }
    }
  };

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

  // Clear new flags effect
  useEffect(() => {
    if (clearNewFlag) {
      setClearNewFlag(false);
      setOrderBookData(prev => ({
        asks: prev.asks.map(ask => ({ ...ask, isNew: false })),
        bids: prev.bids.map(bid => ({ ...bid, isNew: false }))
      }));
    }
  }, [clearNewFlag]);

  useEffect(() => {
    previousTradesRef.current = new Set();
    setLoading(true);
    fetchTradingHistory();
    const intervalId = setInterval(fetchTradingHistory, 3000);
    return () => clearInterval(intervalId);
  }, [fetchTradingHistory]);

  // OrderBook WebSocket effect
  useEffect(() => {
    if (!wsReady || !selectedPair) return;

    requestOrderBook();
    const timer = setInterval(() => requestOrderBook(), 4000);
    return () => clearInterval(timer);
  }, [wsReady, selectedPair, requestOrderBook]);

  useEffect(() => {
    if (trades.length === 0) return;

    const addressesToCheck = [];
    const allAddresses = new Set();
    trades.forEach((trade) => {
      if (trade.maker) allAddresses.add(trade.maker);
      if (trade.taker) allAddresses.add(trade.taker);
    });

    allAddresses.forEach((address) => {
      if (address && !checkedAddressesRef.current.has(address)) {
        addressesToCheck.push(address);
        checkedAddressesRef.current.add(address);
      }
    });

    if (addressesToCheck.length === 0) return;

    const fetchWashTradingData = async () => {
      const newWashTradingData = {};
      await Promise.all(
        addressesToCheck.map(async (address) => {
          try {
            const response = await fetch(
              `https://api.xrpl.to/api/analytics/wash-trading?address=${address}`
            );
            const result = await response.json();
            if (result && result.data && result.data.length > 0) {
              newWashTradingData[address] = result.data;
            }
          } catch (error) {
            console.error(`Failed to fetch wash trading data for ${address}`, error);
          }
        })
      );

      if (Object.keys(newWashTradingData).length > 0) {
        setWashTradingData((prev) => ({ ...prev, ...newWashTradingData }));
      }
    };

    fetchWashTradingData();
  }, [trades]);

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const calculatePrice = (trade) => {
    const xrpAmount = trade.got.currency === 'XRP' ? trade.got.value : trade.paid.value;
    const tokenAmount = trade.got.currency === 'XRP' ? trade.paid.value : trade.got.value;
    return parseFloat(xrpAmount) / parseFloat(tokenAmount);
  };

  const renderWashTradeDetails = (address, trades, abbreviateNumber) => {
    if (!trades || trades.length === 0) return null;

    const highConfidenceTrades = trades.filter((t) => t.confidence >= 0.8);
    if (highConfidenceTrades.length === 0) return null;

    return (
      <Box sx={{ mt: 1 }}>
        <Typography variant="subtitle2" component="div">
          {address.slice(0, 6)}...
          <Typography variant="caption" sx={{ color: 'warning.main', ml: 1 }}>
            (wash trader)
          </Typography>
        </Typography>
        {highConfidenceTrades.map((wt) => {
          const otherAddress = wt.addresses.find((a) => a !== address);
          return (
            <Box
              key={wt._id}
              sx={{ pl: 1.5, py: 1, borderLeft: '2px solid', borderColor: 'warning.main', my: 1 }}
            >
              {otherAddress && (
                <Typography variant="caption" component="div">
                  <strong>Counterparty:</strong>{' '}
                  {`${otherAddress.slice(0, 4)}...${otherAddress.slice(-4)}`}
                </Typography>
              )}
              <Typography variant="caption" component="div">
                <strong>Volume:</strong> {abbreviateNumber(wt.totalVolume)}
              </Typography>
              <Typography variant="caption" component="div">
                <strong>Confidence:</strong> {(wt.confidence * 100).toFixed(0)}%
              </Typography>
              <Typography variant="caption" component="div">
                <strong>Net Profit:</strong> {wt.netProfit.toFixed(2)}
              </Typography>
              <Typography variant="caption" component="div">
                <strong>Detected:</strong>{' '}
                {formatRelativeTime(new Date(wt.firstDetected).getTime())}
              </Typography>
            </Box>
          );
        })}
      </Box>
    );
  };

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
            py: 6,
            backgroundColor: 'transparent',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            borderRadius: '12px',
            border: `1px dashed ${alpha(theme.palette.divider, 0.3)}`,
            boxShadow: `
              0 8px 32px ${alpha(theme.palette.common.black, 0.12)}, 
              0 1px 2px ${alpha(theme.palette.common.black, 0.04)},
              inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`
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
    <Stack spacing={1}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="trading tabs">
          <Tab label="Trading History" />
          <Tab label="Order Book" />
          <Tab label="Trading Pairs" />
          <Tab label="Top Traders" />
          <Tab label="Rich List" />
        </Tabs>
      </Box>
      
      {tabValue === 0 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <FormControlLabel
              control={<Switch checked={xrpOnly} onChange={handleXrpOnlyChange} />}
              label="XRP Trades Only"
            />
          </Box>
      {/* Table Headers with integrated title */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: '1fr 1fr',
            md: '2fr 1fr 2fr 2fr 1.5fr 0.5fr'
          },
          gap: 2,
          p: 2,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          backgroundColor: 'transparent',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          borderRadius: '8px 8px 0 0',
          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          boxShadow: `
            0 8px 32px ${alpha(theme.palette.common.black, 0.12)}, 
            0 1px 2px ${alpha(theme.palette.common.black, 0.04)},
            inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`,
          '& > *': {
            fontWeight: 'bold',
            color: theme.palette.text.secondary,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ display: { xs: 'none', md: 'block' } }}>Time / Type</Typography>
          <LiveIndicator sx={{ display: { xs: 'none', md: 'flex' }, ml: 1 }}>
            <LiveCircle />
            <Typography
              variant="caption"
              fontWeight="600"
              sx={{ color: 'primary.main', fontSize: '0.6rem' }}
            >
              LIVE
            </Typography>
          </LiveIndicator>
        </Box>
        <Typography sx={{ display: { xs: 'none', md: 'block' } }}>Price</Typography>
        <Typography sx={{ display: { xs: 'none', md: 'block' } }}>Amount</Typography>
        <Typography sx={{ display: { xs: 'none', md: 'block' } }}>Total</Typography>
        <Typography sx={{ display: { xs: 'none', md: 'block' } }}>Maker/Taker</Typography>
        <Typography sx={{ display: { xs: 'none', md: 'block' } }}></Typography>
      </Box>

      <Stack spacing={0.5}>
        {trades.map((trade, index) => {
          const isBuy = trade.paid.currency === 'XRP';
          const xrpAmount = getXRPAmount(trade);
          const price = calculatePrice(trade);
          const volumePercentage = Math.min(100, Math.max(5, (xrpAmount / 50000) * 100));

          const amountData = isBuy ? trade.got : trade.paid;
          const totalData = isBuy ? trade.paid : trade.got;

          const makerDetails = renderWashTradeDetails(
            trade.maker,
            washTradingData[trade.maker],
            abbreviateNumber
          );
          const takerDetails = renderWashTradeDetails(
            trade.taker,
            washTradingData[trade.taker],
            abbreviateNumber
          );

          const makerIsWashTrader = !!makerDetails;
          const takerIsWashTrader = !!takerDetails;

          let addressToShow = trade.maker;
          if (amm) {
            if (trade.maker === amm) {
              addressToShow = trade.taker;
            } else if (trade.taker === amm) {
              addressToShow = trade.maker;
            }
          }

          return (
            <TradeCard key={trade._id} isNew={newTradeIds.has(trade._id)}>
              <VolumeIndicator volume={volumePercentage} />
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: '1fr 1fr',
                      md: '2fr 1fr 2fr 2fr 1.5fr 0.5fr'
                    },
                    gap: 1.5,
                    alignItems: 'center'
                  }}
                >
                  {/* Time and Type */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight="500"
                      sx={{ minWidth: 'fit-content', fontSize: '0.8rem' }}
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
                      sx={{ fontSize: '0.7rem', display: { xs: 'block', md: 'none' } }}
                    >
                      Price
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight="600"
                      color="text.primary"
                      sx={{ fontSize: '0.85rem' }}
                    >
                      {formatPrice(price)} XRP
                    </Typography>
                  </Box>

                  {/* Amount */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <img
                      src={getTokenImageUrl(amountData.issuer, amountData.currency)}
                      alt={decodeCurrency(amountData.currency)}
                      style={{ width: 16, height: 16, borderRadius: '50%' }}
                    />
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: '0.7rem', display: { xs: 'block', md: 'none' } }}
                      >
                        Amount
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight="600"
                        color="text.primary"
                        sx={{ fontSize: '0.85rem' }}
                      >
                        {formatTradeValue(amountData.value)} {decodeCurrency(amountData.currency)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Total */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <img
                      src={getTokenImageUrl(totalData.issuer, totalData.currency)}
                      alt={decodeCurrency(totalData.currency)}
                      style={{ width: 16, height: 16, borderRadius: '50%' }}
                    />
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: '0.7rem', display: { xs: 'block', md: 'none' } }}
                      >
                        Total
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight="600"
                        color="text.primary"
                        sx={{ fontSize: '0.85rem' }}
                      >
                        {formatTradeValue(totalData.value)} {decodeCurrency(totalData.currency)}
                      </Typography>
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
                          fontWeight: '500',
                          '&:hover': {
                            textDecoration: 'underline',
                            color: 'primary.dark'
                          }
                        }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight="500"
                          sx={{ fontSize: '0.8rem', color: 'primary.main' }}
                        >
                          {addressToShow
                            ? `${addressToShow.slice(0, 4)}...${addressToShow.slice(-4)}`
                            : ''}
                        </Typography>
                      </Link>
                    </Tooltip>
                    <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                      {getTradeSizeEmoji(xrpAmount)}
                    </Typography>
                    {(makerIsWashTrader || takerIsWashTrader) && (
                      <SmartToy
                        fontSize="small"
                        sx={{ color: theme.palette.warning.main, fontSize: '0.9rem' }}
                      />
                    )}
                  </Box>

                  {/* Actions */}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    {(makerIsWashTrader || takerIsWashTrader) && (
                      <IconButton
                        onClick={(e) => handleIconClick(e, trade)}
                        size="small"
                        sx={{ padding: '4px' }}
                      >
                        <SmartToy fontSize="small" sx={{ color: theme.palette.warning.main }} />
                      </IconButton>
                    )}
                    <Tooltip title="View Transaction" arrow>
                      <IconButton
                        size="small"
                        component={Link}
                        href={`/tx/${trade.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          color: `${theme.palette.primary.main} !important`,
                          padding: '4px',
                          '&:hover': {
                            color: `${theme.palette.primary.dark} !important`,
                            backgroundColor:
                              theme.palette.mode === 'dark'
                                ? 'rgba(255, 255, 255, 0.08)'
                                : 'rgba(0, 0, 0, 0.04)',
                            transform: 'scale(1.1)'
                          },
                          '& .MuiSvgIcon-root': {
                            color: `${theme.palette.primary.main} !important`
                          },
                          '&:hover .MuiSvgIcon-root': {
                            color: `${theme.palette.primary.dark} !important`
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
        })}
      </Stack>

      {totalPages > 1 && (
        <Stack direction="row" justifyContent="center" sx={{ mt: 4 }}>
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
      <Popover
        open={openPopover}
        anchorEl={anchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center'
        }}
      >
        <Box sx={{ 
          p: 2, 
          maxWidth: 320, 
          backgroundColor: 'transparent',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          borderRadius: '8px',
          boxShadow: `
            0 8px 32px ${alpha(theme.palette.common.black, 0.12)}, 
            0 1px 2px ${alpha(theme.palette.common.black, 0.04)},
            inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`
        }}>
          {selectedTrade && (
            <React.Fragment>
              {renderWashTradeDetails(
                selectedTrade.maker,
                washTradingData[selectedTrade.maker],
                abbreviateNumber
              )}
              {renderWashTradeDetails(
                selectedTrade.taker,
                washTradingData[selectedTrade.taker],
                abbreviateNumber
              )}
            </React.Fragment>
          )}
        </Box>
      </Popover>
        </>
      )}
      
      {tabValue === 1 && token && (
        <Stack spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 1.5, 
            backgroundColor: 'transparent',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            borderRadius: 1, 
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            boxShadow: `
              0 8px 32px ${alpha(theme.palette.common.black, 0.12)}, 
              0 1px 2px ${alpha(theme.palette.common.black, 0.04)},
              inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`,
            position: 'relative',
            zIndex: 1000,
            '& .MuiSelect-root': {
              zIndex: 1001
            },
            '& .MuiPopper-root': {
              zIndex: 1002
            }
          }}>
            <Typography variant="body1" fontWeight="600" sx={{ minWidth: 'fit-content' }}>Trading Pair:</Typography>
            <Box sx={{ minWidth: 200, maxWidth: 300 }}>
              <PairsSelect 
                token={token}
                pair={selectedPair}
                setPair={setSelectedPair}
              />
            </Box>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <OrderBook 
                pair={selectedPair}
                asks={orderBookData.asks}
                bids={orderBookData.bids}
                onAskClick={(e, idx) => setAskId(idx)}
                onBidClick={(e, idx) => setBidId(idx)}
              />
            </Grid>
          <Grid item xs={12} md={4}>
            <Stack spacing={2}>
              <TradePanel 
                pair={selectedPair}
                asks={orderBookData.asks}
                bids={orderBookData.bids}
                bidId={bidId}
                askId={askId}
              />
              <Box>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Depth Chart (Bids: {orderBookData.bids.length}, Asks: {orderBookData.asks.length})
                </Typography>
                {(orderBookData.bids.length > 0 || orderBookData.asks.length > 0) ? (
                  <BidAskChart 
                    asks={orderBookData.asks}
                    bids={orderBookData.bids}
                  />
                ) : (
                  <Box sx={{ 
                    height: 256, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    backgroundColor: 'transparent',
                    backdropFilter: 'none',
                    WebkitBackdropFilter: 'none',
                    border: `1px dashed ${alpha(theme.palette.divider, 0.3)}`,
                    borderRadius: 1,
                    boxShadow: `
                      0 8px 32px ${alpha(theme.palette.common.black, 0.12)}, 
                      0 1px 2px ${alpha(theme.palette.common.black, 0.04)},
                      inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`
                  }}>
                    <Typography color="text.secondary">
                      Waiting for order book data...
                    </Typography>
                  </Box>
                )}
              </Box>
            </Stack>
          </Grid>
        </Grid>
        </Stack>
      )}
      
      {tabValue === 2 && token && pairs && (
        <PairsList token={token} pairs={pairs} />
      )}
      
      {tabValue === 3 && token && (
        <TopTraders token={token} />
      )}
      
      {tabValue === 4 && token && (
        <Suspense fallback={<CircularProgress />}>
          <RichListData token={token} />
        </Suspense>
      )}
    </Stack>
  );
};

export default TradingHistory;
