import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Popover
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SmartToy from '@mui/icons-material/SmartToy';
import { getTokenImageUrl, decodeCurrency } from 'src/utils/constants';

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
  backgroundColor:
    theme.palette.mode === 'dark'
      ? `${theme.palette.primary.main}30`
      : `${theme.palette.primary.main}20`,
  border:
    theme.palette.mode === 'dark'
      ? `1px solid ${theme.palette.primary.main}60`
      : `1px solid ${theme.palette.primary.main}40`,
  boxShadow:
    theme.palette.mode === 'dark'
      ? `0 2px 8px ${theme.palette.primary.main}30`
      : `0 2px 4px ${theme.palette.primary.main}20`
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
  backgroundColor:
    theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.9)',
  border: `1px solid ${
    theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'
  }`,
  transition: 'all 0.3s ease-in-out',
  position: 'relative',
  overflow: 'hidden',
  animation: isNew ? `${highlightAnimation(theme)} 1s ease-in-out` : 'none',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0 4px 12px rgba(0, 0, 0, 0.3)'
        : '0 4px 12px rgba(0, 0, 0, 0.1)',
    border: `1px solid ${theme.palette.primary.main}60`
  }
}));

const TradeTypeChip = styled(Chip)(({ theme, tradetype }) => ({
  fontSize: '0.7rem',
  height: '24px',
  fontWeight: 'bold',
  borderRadius: '12px',
  backgroundColor:
    tradetype === 'BUY'
      ? theme.palette.mode === 'dark'
        ? `${theme.palette.primary.main}40`
        : `${theme.palette.primary.main}30`
      : theme.palette.mode === 'dark'
      ? 'rgba(244, 67, 54, 0.2)'
      : 'rgba(244, 67, 54, 0.15)',
  color: tradetype === 'BUY' ? theme.palette.primary.main : '#F44336',
  border:
    tradetype === 'BUY'
      ? `1px solid ${theme.palette.primary.main}80`
      : `1px solid rgba(244, 67, 54, 0.4)`
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

  if (Math.abs(numValue) < 0.00001) {
    return numValue.toFixed(10);
  }

  if (Math.abs(numValue) < 0.0001) {
    return numValue.toFixed(8);
  }

  if (Math.abs(numValue) < 0.01) {
    return numValue.toFixed(6);
  }

  if (Math.abs(numValue) < 1) {
    return numValue.toFixed(4);
  }

  if (Math.abs(numValue) < 100) {
    return numValue.toFixed(4);
  }

  return numValue.toFixed(2);
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

const TradingHistory = ({ tokenId, amm }) => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [newTradeIds, setNewTradeIds] = useState(new Set());
  const [xrpOnly, setXrpOnly] = useState(true);
  const previousTradesRef = useRef(new Set());
  const theme = useTheme();
  const limit = 20;

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

  useEffect(() => {
    previousTradesRef.current = new Set();
    setLoading(true);
    fetchTradingHistory();
    const intervalId = setInterval(fetchTradingHistory, 3000);
    return () => clearInterval(intervalId);
  }, [fetchTradingHistory]);

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
                <strong>Type:</strong> {wt.detectionType}
              </Typography>
              <Typography variant="caption" component="div">
                <strong>Time Window:</strong> {wt.timeWindowSeconds}s
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
            backgroundColor:
              theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
            borderRadius: '12px',
            border: `1px dashed ${theme.palette.divider}`
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
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor:
            theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
          borderRadius: '8px 8px 0 0',
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
                    <Tooltip title="View on Bithomp" arrow>
                      <IconButton
                        size="small"
                        component={Link}
                        href={`https://bithomp.com/explorer/${trade.hash}`}
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
        <Box sx={{ p: 2, maxWidth: 320, border: `1px solid ${theme.palette.divider}` }}>
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
    </Stack>
  );
};

export default TradingHistory;
