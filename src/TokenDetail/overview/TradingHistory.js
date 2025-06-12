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
  CardContent
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

const TradeCard = styled(Card)(({ theme, isNew }) => ({
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

const BOT_ADDRESSES = [
  'rogue5HnPRSszD9CWGSUz8UGHMVwSSKF6',
  'rfmdBKhtJw2J22rw1JxQcchQTM68qzE4N2',
  'rpiFwLYi6Gb1ESHYorn2QG1WU5vw2u4exQ',
  'rpP3jobib3bCGbK1EHUsyeFJF1LXcUBymq',
  'rhubarbMVC2nzASf3qSGQcUKtLnAzqcBjp',
  'rBYuQZgRnsSNTuGsxz7wmGt53GYDEg1qzf',
  'rippLE4uy7r898MzuHTeTe7sPfuUDafLB',
  'raKT8yExRhuK9xAqYeWezH8RAp6vNoU3Jo',
  'rhB5snxAxsZ2cKf8iDJYiBpX8nrTxJfHoH',
  'rN7SthSu7RZXo2LNmsh4QPgXcBzhTgmDDg',
  'raKTPwoUnGbdSquoiZLX5bLZwY2JAvS5o9'
];

const TradingHistory = ({ tokenId }) => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [newTradeIds, setNewTradeIds] = useState(new Set());
  const previousTradesRef = useRef(new Set());
  const theme = useTheme();
  const limit = 20;

  const fetchTradingHistory = useCallback(async () => {
    if (!tokenId) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `https://api.xrpl.to/api/history?md5=${tokenId}&page=${page - 1}&limit=${limit}`
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
  }, [tokenId, page]);

  useEffect(() => {
    previousTradesRef.current = new Set();
    setLoading(true);
    fetchTradingHistory();
    const intervalId = setInterval(fetchTradingHistory, 3000);
    return () => clearInterval(intervalId);
  }, [fetchTradingHistory]);

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const calculatePrice = (trade) => {
    const xrpAmount = trade.got.currency === 'XRP' ? trade.got.value : trade.paid.value;
    const tokenAmount = trade.got.currency === 'XRP' ? trade.paid.value : trade.got.value;
    return parseFloat(xrpAmount) / parseFloat(tokenAmount);
  };

  if (loading) {
    return (
      <Stack spacing={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h5" fontWeight="600" color="text.primary">
              Recent Trades
            </Typography>
            <LiveIndicator>
              <LiveCircle />
              <Typography variant="body2" fontWeight="600" sx={{ color: 'primary.main' }}>
                LIVE
              </Typography>
            </LiveIndicator>
          </Box>
        </Box>
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress size={40} thickness={4} />
        </Box>
      </Stack>
    );
  }

  if (!trades || trades.length === 0) {
    return (
      <Stack spacing={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h5" fontWeight="600" color="text.primary">
              Recent Trades
            </Typography>
            <LiveIndicator>
              <LiveCircle />
              <Typography variant="body2" fontWeight="600" sx={{ color: 'primary.main' }}>
                LIVE
              </Typography>
            </LiveIndicator>
          </Box>
        </Box>
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
    <Stack spacing={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h5" fontWeight="600" color="text.primary">
            Recent Trades
          </Typography>
          <LiveIndicator>
            <LiveCircle />
            <Typography variant="body2" fontWeight="600" sx={{ color: 'primary.main' }}>
              LIVE
            </Typography>
          </LiveIndicator>
        </Box>
      </Box>

      {/* Table Headers */}
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
        <Typography sx={{ display: { xs: 'none', md: 'block' } }}>Time / Type</Typography>
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
                      {formatTradeValue(price)} XRP
                    </Typography>
                  </Box>

                  {/* Amount */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <img
                      src={getTokenImageUrl(trade.paid.issuer, trade.paid.currency)}
                      alt={decodeCurrency(trade.paid.currency)}
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
                        {formatTradeValue(trade.paid.value)} {decodeCurrency(trade.paid.currency)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Total */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <img
                      src={getTokenImageUrl(trade.got.issuer, trade.got.currency)}
                      alt={decodeCurrency(trade.got.currency)}
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
                        {formatTradeValue(trade.got.value)} {decodeCurrency(trade.got.currency)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Maker/Taker */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Tooltip title={`Maker: ${trade.maker}\nTaker: ${trade.taker}`} arrow>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Link
                          href={`/profile/${trade.maker}`}
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
                            {`${trade.maker.slice(0, 4)}...${trade.maker.slice(-4)}`}
                          </Typography>
                        </Link>
                        <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                          {getTradeSizeEmoji(xrpAmount)}
                        </Typography>
                        {(BOT_ADDRESSES.includes(trade.maker) ||
                          BOT_ADDRESSES.includes(trade.taker)) && (
                          <SmartToy
                            sx={{
                              color: theme.palette.warning.main,
                              fontSize: '0.9rem'
                            }}
                          />
                        )}
                      </Box>
                    </Tooltip>
                  </Box>

                  {/* Actions */}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
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
                          borderRadius: '6px',
                          backgroundColor:
                            theme.palette.mode === 'dark'
                              ? `${theme.palette.primary.main}20`
                              : `${theme.palette.primary.main}15`,
                          border:
                            theme.palette.mode === 'dark'
                              ? `1px solid ${theme.palette.primary.main}40`
                              : `1px solid ${theme.palette.primary.main}30`,
                          '&:hover': {
                            color: '#fff !important',
                            backgroundColor: theme.palette.primary.main,
                            border: `1px solid ${theme.palette.primary.main}`,
                            transform: 'scale(1.05)'
                          },
                          '& .MuiSvgIcon-root': {
                            color: `${theme.palette.primary.main} !important`
                          },
                          '&:hover .MuiSvgIcon-root': {
                            color: '#fff !important'
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
    </Stack>
  );
};

export default TradingHistory;
