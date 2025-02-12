import React, { useState, useEffect } from 'react';
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
  Pagination
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

const TradingHistory = ({ tokenId }) => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  useEffect(() => {
    const fetchTradingHistory = async () => {
      if (!tokenId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `http://37.27.134.126/api//history?md5=${tokenId}&page=${page - 1}&limit=${limit}`
        );
        const data = await response.json();
        if (data.result === 'success') {
          setTrades(data.hists);
          // Calculate total pages based on count
          setTotalPages(Math.ceil(data.count / limit));
        }
      } catch (error) {
        console.error('Error fetching trading history:', error);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    fetchTradingHistory();
  }, [tokenId, page]); // Add page to dependencies

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const formatTimestamp = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;

    // Convert to seconds
    const seconds = Math.floor(diff / 1000);

    // Less than a minute
    if (seconds < 60) {
      return `${seconds}s ago`;
    }

    // Less than an hour
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    // Less than a day
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours}h ago`;
    }

    // More than a day, show date
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const formatValue = (value) => {
    return Number(value).toFixed(6);
  };

  const getBithompUrl = (hash) => {
    return `https://bithomp.com/explorer/${hash}`;
  };

  const getTradeType = (trade) => {
    // If taker got token (non-XRP), it's a buy
    const isBuy = trade.got.currency !== 'XRP';
    const tokenCurrency = isBuy ? trade.got.currency : trade.paid.currency;

    return {
      type: isBuy ? 'BUY' : 'SELL',
      color: isBuy ? 'success' : 'error',
      icon: isBuy ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />,
      tokenCurrency
    };
  };

  const getTokenName = (currency) => {
    if (!currency || currency === 'XRP') return 'XRP';

    try {
      // Handle hex-encoded currency names (e.g. "534F4C4F00000000000000000000000000000000" -> "SOLO")
      if (currency.length === 40) {
        // Take first 3 bytes (6 characters) and convert to ASCII
        const bytes = [];
        for (let i = 0; i < currency.length; i += 2) {
          const byte = parseInt(currency.substr(i, 2), 16);
          // Stop at first null byte
          if (byte === 0) break;
          bytes.push(byte);
        }
        return String.fromCharCode(...bytes);
      }
      return currency;
    } catch (error) {
      console.error('Error decoding currency:', error);
      return currency;
    }
  };

  // Get token currency from first trade
  const tokenCurrency =
    trades[0]?.paid.currency === 'XRP' ? trades[0]?.got.currency : trades[0]?.paid.currency;
  const tokenName = getTokenName(tokenCurrency);

  if (loading) {
    return (
      <Stack spacing={2} alignItems="center">
        <Typography
          variant="h2"
          fontSize="1.5rem"
          fontWeight="bold"
          sx={{
            background: (theme) =>
              theme.palette.mode === 'dark'
                ? 'linear-gradient(45deg, #22B14C 30%, #2ecc71 90%)'
                : 'linear-gradient(45deg, #3366FF 30%, #4d79ff 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '0.5px'
          }}
        >
          Recent Trades
        </Typography>
        <CircularProgress />
      </Stack>
    );
  }

  if (!trades || trades.length === 0) {
    return (
      <Stack spacing={2}>
        <Typography
          variant="h2"
          fontSize="1.5rem"
          fontWeight="bold"
          sx={{
            background: (theme) =>
              theme.palette.mode === 'dark'
                ? 'linear-gradient(45deg, #22B14C 30%, #2ecc71 90%)'
                : 'linear-gradient(45deg, #3366FF 30%, #4d79ff 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '0.5px'
          }}
        >
          Recent Trades
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          No recent trades found
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography
            variant="h2"
            fontSize="1.5rem"
            fontWeight="bold"
            sx={{
              background: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(45deg, #22B14C 30%, #2ecc71 90%)'
                  : 'linear-gradient(45deg, #3366FF 30%, #4d79ff 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '0.5px'
            }}
          >
            Recent Trades
          </Typography>
        </Stack>
      </Stack>

      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Price ({tokenName}/XRP)</TableCell>
              <TableCell>Amount {tokenName}</TableCell>
              <TableCell>Total XRP</TableCell>
              <TableCell align="right">Explorer</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trades.map((trade) => {
              const price = Number(trade.got.value) / Number(trade.paid.value);
              const tradeType = getTradeType(trade);
              return (
                <TableRow key={trade._id}>
                  <TableCell>{formatTimestamp(trade.time)}</TableCell>
                  <TableCell>
                    <Chip
                      icon={tradeType.icon}
                      label={tradeType.type}
                      size="small"
                      color={tradeType.color}
                      variant="outlined"
                      sx={{ minWidth: '80px' }}
                    />
                  </TableCell>
                  <TableCell>{formatValue(price)}</TableCell>
                  <TableCell>{formatValue(trade.paid.value)}</TableCell>
                  <TableCell>{formatValue(trade.got.value)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="View on Bithomp">
                      <IconButton
                        size="small"
                        component={Link}
                        href={getBithompUrl(trade.hash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          color: (theme) => (theme.palette.mode === 'dark' ? '#22B14C' : '#3366FF'),
                          '&:hover': {
                            color: (theme) =>
                              theme.palette.mode === 'dark' ? '#2ecc71' : '#4d79ff'
                          }
                        }}
                      >
                        <OpenInNewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add pagination controls */}
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
