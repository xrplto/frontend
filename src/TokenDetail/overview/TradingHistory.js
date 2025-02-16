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
  useTheme
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SmartToy from '@mui/icons-material/SmartToy';
import { getTokenImageUrl, decodeCurrency } from 'src/utils/constants';

// Define the highlight animation
const highlightAnimation = keyframes`
  0% {
    background-color: rgba(51, 102, 255, 0.2);
    transform: translateY(-3px);
  }
  50% {
    background-color: rgba(51, 102, 255, 0.1);
    transform: translateY(0);
  }
  100% {
    background-color: transparent;
    transform: translateY(0);
  }
`;

// Styled components
const LiveIndicator = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(0.5, 1),
  borderRadius: '16px',
  backgroundColor:
    theme.palette.mode === 'dark' ? 'rgba(255, 72, 66, 0.1)' : 'rgba(255, 72, 66, 0.1)'
}));

const LiveCircle = styled('div')(({ theme }) => ({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  backgroundColor: theme.palette.error.main,
  animation: 'pulse 1.5s infinite',
  '@keyframes pulse': {
    '0%': {
      transform: 'scale(0.9)',
      opacity: 0.7
    },
    '50%': {
      transform: 'scale(1.1)',
      opacity: 1
    },
    '100%': {
      transform: 'scale(0.9)',
      opacity: 0.7
    }
  }
}));

const ProgressBarContainer = styled('div')(({ theme }) => ({
  position: 'absolute',
  left: 0,
  top: 0,
  height: '100%',
  width: '100%',
  overflow: 'hidden'
}));

const ProgressBar = styled('div')(({ theme, width, color }) => ({
  position: 'absolute',
  left: 0,
  top: 0,
  height: '100%',
  width: `${width}%`,
  backgroundColor: color,
  opacity: 0.15,
  transition: 'width 0.3s ease-in-out'
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
  const [filter, setFilter] = useState('All');
  const theme = useTheme();
  const limit = 20;

  const fetchTradingHistory = useCallback(async () => {
    if (!tokenId) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `http://api.xrpl.to/api//history?md5=${tokenId}&page=${page - 1}&limit=${limit}`
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
          }, 800);
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

  // Add new helper function to get price
  const calculatePrice = (trade) => {
    const xrpAmount = trade.got.currency === 'XRP' ? trade.got.value : trade.paid.value;
    const tokenAmount = trade.got.currency === 'XRP' ? trade.paid.value : trade.got.value;
    return parseFloat(xrpAmount) / parseFloat(tokenAmount);
  };

  if (loading) {
    return (
      <Stack spacing={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6">Recent Trades</Typography>
            <LiveIndicator>
              <LiveCircle />
              <Typography variant="body2" color="error.main">
                LIVE
              </Typography>
            </LiveIndicator>
          </Box>
        </Box>
        <Box display="flex" justifyContent="center" p={2}>
          <CircularProgress />
        </Box>
      </Stack>
    );
  }

  if (!trades || trades.length === 0) {
    return (
      <Stack spacing={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6">Recent Trades</Typography>
            <LiveIndicator>
              <LiveCircle />
              <Typography variant="body2" color="error.main">
                LIVE
              </Typography>
            </LiveIndicator>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" align="center">
          No recent trades found
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h6">Recent Trades</Typography>
          <LiveIndicator>
            <LiveCircle />
            <Typography variant="body2" color="error.main">
              LIVE
            </Typography>
          </LiveIndicator>
        </Box>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            displayEmpty
            inputProps={{ 'aria-label': 'Filter trades' }}
          >
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="🦐 <500 XRP">🦐 &lt;500 XRP</MenuItem>
            <MenuItem value="🐬 500-5000 XRP">🐬 500-5000 XRP</MenuItem>
            <MenuItem value="🐋 5000-10000 XRP">🐋 5000-10000 XRP</MenuItem>
            <MenuItem value="🐳 10000+ XRP">🐳 10000+ XRP</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Add table header */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 2fr 2fr 1fr 0.5fr',
          gap: 1,
          p: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          '& > *': {
            fontWeight: 'bold',
            color: theme.palette.text.secondary,
            fontSize: '0.75rem'
          }
        }}
      >
        <Typography>Time / Type</Typography>
        <Typography>Price</Typography>
        <Typography>Amount</Typography>
        <Typography>Total</Typography>
        <Typography>Maker/Taker</Typography>
        <Typography></Typography>
      </Box>

      <List sx={{ width: '100%', padding: 0 }}>
        {filterTrades(trades, filter).map((trade, index) => (
          <ListItem
            key={trade._id}
            sx={{
              borderBottom: `1px solid ${theme.palette.divider}`,
              position: 'relative',
              overflow: 'hidden',
              padding: '8px 12px',
              width: '100%',
              animation: newTradeIds.has(trade._id)
                ? `${highlightAnimation} 0.8s ease-in-out`
                : 'none'
            }}
          >
            <ProgressBarContainer>
              <ProgressBar
                width={(() => {
                  const xrpValue = getXRPAmount(trade);
                  if (xrpValue < 500) return Math.max(5, (xrpValue / 500) * 25);
                  if (xrpValue < 5000) return Math.max(25, (xrpValue / 5000) * 50);
                  if (xrpValue < 10000) return Math.max(50, (xrpValue / 10000) * 75);
                  return Math.min(100, 75 + (xrpValue / 50000) * 25);
                })()}
                color={trade.paid.currency === 'XRP' ? '#4CAF50' : '#F44336'}
              />
            </ProgressBarContainer>
            <Box
              sx={{
                width: '100%',
                position: 'relative',
                zIndex: 1,
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 2fr 2fr 1fr 0.5fr',
                gap: 1,
                alignItems: 'center'
              }}
            >
              {/* Time and Type */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  {formatRelativeTime(trade.time)}
                </Typography>
                {trade.paid.currency === 'XRP' ? (
                  <Typography component="span" variant="caption" color="success.main">
                    BUY{' '}
                  </Typography>
                ) : (
                  <Typography component="span" variant="caption" color="error.main">
                    SELL{' '}
                  </Typography>
                )}
              </Box>

              {/* Price */}
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                {formatTradeValue(calculatePrice(trade))} XRP
              </Typography>

              {/* Amount */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <img
                  src={getTokenImageUrl(trade.paid.issuer, trade.paid.currency)}
                  alt={decodeCurrency(trade.paid.currency)}
                  style={{ width: 14, height: 14, borderRadius: '50%' }}
                />
                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                  {formatTradeValue(trade.paid.value)} {decodeCurrency(trade.paid.currency)}
                </Typography>
              </Box>

              {/* Total */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <img
                  src={getTokenImageUrl(trade.got.issuer, trade.got.currency)}
                  alt={decodeCurrency(trade.got.currency)}
                  style={{ width: 14, height: 14, borderRadius: '50%' }}
                />
                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                  {formatTradeValue(trade.got.value)} {decodeCurrency(trade.got.currency)}
                </Typography>
              </Box>

              {/* Maker/Taker */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Tooltip title={`Maker: ${trade.maker}\nTaker: ${trade.taker}`}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography
                      component="span"
                      sx={{
                        fontSize: '0.8rem',
                        color: theme.palette.text.secondary
                      }}
                    >
                      {`${trade.maker.slice(0, 4)}...${trade.maker.slice(-4)}`}
                      {getTradeSizeEmoji(getXRPAmount(trade))}
                      {(BOT_ADDRESSES.includes(trade.maker) ||
                        BOT_ADDRESSES.includes(trade.taker)) && (
                        <SmartToy
                          style={{
                            color: theme.palette.warning.main,
                            fontSize: '0.9rem',
                            marginLeft: '2px',
                            verticalAlign: 'middle'
                          }}
                        />
                      )}
                    </Typography>
                  </Box>
                </Tooltip>
              </Box>

              {/* Actions */}
              <Box>
                <Tooltip title="View on Bithomp">
                  <IconButton
                    size="small"
                    component={Link}
                    href={`https://bithomp.com/explorer/${trade.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: theme.palette.mode === 'dark' ? '#22B14C' : '#3366FF',
                      '&:hover': {
                        color: theme.palette.mode === 'dark' ? '#2ecc71' : '#4d79ff'
                      }
                    }}
                  >
                    <OpenInNewIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </ListItem>
        ))}
      </List>

      {totalPages > 1 && (
        <Stack direction="row" justifyContent="center" sx={{ mt: 2 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
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
