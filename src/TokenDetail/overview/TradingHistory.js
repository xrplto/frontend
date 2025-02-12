import React from 'react';
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
  Chip
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

const TradingHistory = ({ trades }) => {
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
    // If taker paid XRP, it's a buy
    const isBuy = trade.got.currency === '534F4C4F00000000000000000000000000000000';
    return {
      type: isBuy ? 'BUY' : 'SELL',
      color: isBuy ? 'success' : 'error',
      icon: isBuy ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />
    };
  };

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

      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Price (SOLO/XRP)</TableCell>
              <TableCell>Amount SOLO</TableCell>
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
    </Stack>
  );
};

export default TradingHistory;
