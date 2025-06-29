import axios from 'axios';
import { useState, useEffect, useRef } from 'react';

import Tooltip from '@mui/material/Tooltip';
import InfoIcon from '@mui/icons-material/Info';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'; // Make sure this is imported
import LinkIcon from '@mui/icons-material/Link'; // Add Link icon import
import BarChartIcon from '@mui/icons-material/BarChart';
import ContentCopyIcon from '@mui/icons-material/ContentCopy'; // Add this import

// Material
import {
  Avatar,
  Box,
  Checkbox,
  IconButton,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableSortLabel,
  TableRow,
  Typography,
  CircularProgress,
  Modal,
  useMediaQuery,
  useTheme,
  styled
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Redux
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';

// Components
import RichListToolbar from './RichListToolbar';

// Iconify
import { Icon } from '@iconify/react';

import checkIcon from '@iconify/icons-akar-icons/check';
import caretDown from '@iconify/icons-bx/caret-down';
import caretUp from '@iconify/icons-bx/caret-up';

// Utils
import { fNumber, fPercent } from 'src/utils/formatNumber';

import NumberTooltip from 'src/components/NumberTooltip';
import { currencySymbols } from 'src/utils/constants';

// Recharts
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

// Exchange address mapping
const EXCHANGE_ADDRESSES = {
  rNU4eAowPuixS5ZCWaRL72UUeKgxcKExpK: 'Binance',
  rDAE53VfMvftPB4ogpWGWvzkQxfht6JPxr: 'Binance',
  rfQ9EcLkU6WnNmkS3EwUkFeXeN47Rk8Cvi: 'Binance',
  rarG6FaeYhnzSKSS5EEPofo4gFsPn2bZKk: 'Binance',
  rBtttd61FExHC68vsZ8dqmS3DfjFEceA1A: 'Binance',
  rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh: 'Binance',
  rJb5KsHsDHF1YS5B5DU6QCkH5NsPaKQTcy: 'Binance',
  rhWj9gaovwu2hZxYW7p388P8GRbuXFLQkK: 'Binance',
  rK7D3QnTrYdkp1fGKKzHFNXZpqN8dUCfaf: 'Coinfield',
  rLoD9U2ghXP2xUYbtML6G6v1p8LhM9mSnc: 'Bitstamp',
  rUzWJkXyEtT8ekSSxkBYPqCvHpngcy6Fks: 'OKX',
  rnW8je5SsuFjkMSWkgfXvqZH3gLTpXxfFH: 'Mercado Bitcoin',
  rEeEWeP88cpKUddKk37B2EZeiHBGiBXY3: 'Binance.US',
  rnd8KJ4qeip6FPJvC1fyv82nW2Lm8C8KjQ: 'Snapswap',
  rBRVqcXrm1YAbanngTxDfH15LNb6TjNmxk: 'Snapswap',
  rDCgaaSBAWYfsxUYhCk1n26Na7x8PQGmkq: 'Poloniex',
  rKKbNYZRqwPgZYkFWvqNUFBuscEyiFyCE: 'Changenow',
  rhotcWYdfn6qxhVMbPKGDF3XCKqwXar5J4: 'Gatehub',
  rD4G6gtD2KwHqsRf7pcyA8r1neUzXT61ix: 'Bitgo',
  r3ztejgGSdZNTXiUUMGYLLq93ibpRquQwM: 'Bitgo',
  r3S8AV7DQ6URd9qhKkDc2vD6XCaNU34328: 'NEXO',
  rwADc5YVbAfDmRyjbqPoG48H5jmnbD2xV5: 'NEXO',
  rbrCJQZVk6jYra1MPuSvX3Vpe4to9fAvh: 'Bitpanda',
  rrpNnNLKrartuEqfJGpqyDwPj1AFPg9vn1: 'Bitstamp',
  rDsbeomae4FXwgQTJp9Rs64Qg9vDiTCdBv: 'Bitstamp',
  rGFuMiw48HdbnrUbkRYuitXTmfrDBNTCnX: 'Bitstamp',
  rPVMhWBsfF9iMXYj3aAzJVkPDTFNSyWdKy: 'Bittrex',
  rBgnUKAEiFhCRLPoYNPPe3JUWayRjP6Ayg: 'CoinSpot',
  rfNLrtuCRys9wMUAvQDTvBoQ9wQzsQBbGn: 'Bitgo',
  rEW8BjpMyFZfGMjqbykbhpnr4KEb2qr6PC: 'Kucoin',
  rhSmsXurfnFV4gpaqP6eJHAm9m2afrgL7h: 'Kucoin',
  rLpvuHZFE46NUyZH5XaMvmYRJZF7aory7t: 'Kucoin',
  r3ch8xGMeegCAJrCYiZe47GdnYVvKMfpdr: 'Coinsquare',
  rBxszqhQkhPALtkSpGuVeqR6hNtZ8xTH3T: 'Kucoin',
  rp4gqz1XdqMsWRZbzPdPAQWw1tg5LuwUVP: 'Kucoin',
  rpVTz6jPYE3HbXX7RmCUMCirBYcfJU2q4j: 'Thodex',
  rHcFoo6a9qT5NHiVn1THQRhsEGcxtYCV4d: 'Gate.io',
  rDKsbvy9uaNpPtvVFraJyNGfjvTw8xivgK: 'HitBTC',
  rwpMvfxoodXggJ1g4qv6MWAPQqWDwQyHUW: 'HitBTC',
  rLCmrXtyLNSma1g4YPpnwWF664zGaUhMc8: 'HitBTC',
  rNUyxNugxv67vhQZZCif2Ru1Hb4APNmwUS: 'HitBTC',
  rnvV2fcH4LK2mnHQaeAus7RvRXUxijVBnT: 'Coinbase',
  rKrYJvto1MH2QT3KV8MiZdc2NaSZztDSf: 'Coinbase',
  rJXrgcmqaqKZnCE4TqEdbMxwJUbFVcpy27: 'Coinbase',
  rPPBKe3eUjPNer5FUrEVJDK7kofTjYSS1v: 'Coinbase',
  rLHzPsX6oXkzU2qL12kHCH8G8cnZv1rBJh: 'Kraken',
  rfexLLNpC6dqyLagjV439EyvfqdYNHsWSH: 'Huobi',
  raTQAD4isuvnGERc1jBhiFBpoTYMwQG7Yi: 'Huobi',
  rMvCasZ9cohYrSZRNYPTZfoaaSUQMfgQ8G: 'Bybit',
  rfKsmLP6sTfVGDvga6rW6XbmSFUzc3G9f3: 'Bitrue',
  raLPjTYeGezfdb6crXZzcC8RkLBEwbBHJ5: 'Bitrue',
  rs2dgzYeqYqsk8bvkQR5YPyqsXYcA24MP2: 'MXC',
  rMdG3ju8pgyVh29ELPWaDuA74CpWW6Fxns: 'Uphold',
  rQrQMKhcw3WnptGeWiYSwX5Tz3otyJqPnq: 'Uphold',
  rKfzfrk1RsUxWmHimWyNwk8AoWHoFneu4m: 'Uphold',
  r4DymtkgUAh2wqRxVfdd3Xtswzim6eC6c5: 'Crypto.com',
  rRmgo6NW1W7GHjC5qEpcpQnq8NE74ZS1P: 'Coinbase',
  r4sRyacXpbh4HbagmgfoQq8Q3j8ZJzbZ1J: 'Coinbase',
  rLNaPoKeeBjZe2qs6x52yVPZpZ8td4dc6w: 'Coinbase',
  rwpTh9DDa52XkM9nTKp2QrJuCGV5d1mQVP: 'Coinbase',
  rw2ciyaNshpHe7bCHo4bRWq6pqqynnWKQg: 'Coinbase',
  rUjfTQpvBr6wsGGxMw6sRmRQGG76nvp8Ln: 'Coinbase',
  rwWr7KUZ3ZFwzgaDGjKBysADByzxvohQ3C: 'Bitcoin.co.id',
  rffGCKC7Mk4cQ5aUGg8pfRe3MPC7Cy8gfe: 'FixedFloat',
  rKwWsi1XWCevQmVL9VhPD8DuYF4dobFdoT: 'Unknown Exchange'
};

// ----------------------------------------------------------------------
function truncate(str, n) {
  if (!str) return '';
  //return (str.length > n) ? str.substr(0, n-1) + '&hellip;' : str;
  return str.length > n ? str.substr(0, n - 1) + ' ...' : str;
}

// Add modern color scheme matching Donut.js
function getModernColors(darkMode) {
  return darkMode
    ? [
        '#FF6B8A',
        '#FF8F6B',
        '#FFB366',
        '#FFD93D',
        '#BCEB5F',
        '#7ED957',
        '#4ECDC4',
        '#45B7D1',
        '#96CEB4',
        '#FFEAA7',
        '#6C5CE7'
      ]
    : [
        '#FF6B8A',
        '#FF8F6B',
        '#FFB366',
        '#FFD93D',
        '#BCEB5F',
        '#7ED957',
        '#4ECDC4',
        '#45B7D1',
        '#96CEB4',
        '#FFEAA7',
        '#6C5CE7'
      ];
}

// Add DailyVolumeChart component
const DailyVolumeChart = ({ data }) => {
  const [interval, setInterval] = useState('all');

  // Filter data based on selected interval
  const filterDataByInterval = (data, interval) => {
    if (!data || !data.length) return [];
    const now = new Date();
    const filteredData = data.filter((item) => {
      const date = new Date(item.date);
      const diffHours = (now - date) / (1000 * 60 * 60);
      switch (interval) {
        case '24h':
          return diffHours <= 24;
        case '7d':
          return diffHours <= 24 * 7;
        case '30d':
          return diffHours <= 24 * 30;
        default:
          return true;
      }
    });
    return filteredData;
  };

  // Process and sort data by date
  const chartData = filterDataByInterval(data, interval)
    .map((item) => ({
      date: new Date(item.date),
      Buy: item.buyVolume || 0,
      Sell: item.sellVolume || 0,
      Profit: item.profit,
      fullDate: new Date(item.date)
    }))
    .sort((a, b) => a.fullDate - b.fullDate);

  // Calculate date range and determine appropriate interval
  const dateRange =
    chartData.length > 1
      ? (chartData[chartData.length - 1].date - chartData[0].date) / (1000 * 60 * 60 * 24)
      : 0;

  // Format date based on range
  const formatDate = (date) => {
    if (dateRange > 365) {
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    } else if (dateRange > 30) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Calculate interval based on data length
  const calculateInterval = () => {
    if (chartData.length <= 30) return 0;
    if (dateRange > 365) return Math.ceil(chartData.length / 12);
    if (dateRange > 180) return Math.ceil(chartData.length / 8);
    if (dateRange > 90) return Math.ceil(chartData.length / 6);
    return Math.ceil(chartData.length / 10);
  };

  return (
    <>
      <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
        {['24h', '7d', '30d', 'all'].map((option) => (
          <Box
            key={option}
            onClick={() => setInterval(option)}
            sx={{
              px: 1.5,
              py: 0.25,
              borderRadius: 1,
              cursor: 'pointer',
              bgcolor: interval === option ? 'primary.main' : 'action.hover',
              color: interval === option ? 'primary.contrastText' : 'text.primary',
              '&:hover': {
                bgcolor: interval === option ? 'primary.dark' : 'action.selected'
              }
            }}
          >
            <Typography variant="caption" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
              {option === 'all' ? 'All Time' : option}
            </Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ width: '100%', height: 250 }}>
        <ResponsiveContainer>
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              angle={-45}
              textAnchor="end"
              height={60}
              interval={calculateInterval()}
              tickFormatter={formatDate}
              tick={{ fontSize: 9 }}
            />
            <YAxis tick={{ fontSize: 9 }} tickFormatter={(value) => value.toFixed(0)} width={60} />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                border: 'none',
                borderRadius: '4px',
                fontSize: '11px',
                padding: '4px 8px'
              }}
              formatter={(value, name, props) => [
                fNumber(value),
                name,
                `Date: ${props.payload.fullDate.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}`
              ]}
            />
            <Legend wrapperStyle={{ fontSize: '9px' }} />
            <Bar dataKey="Buy" fill="#54D62C" stackId="stack" />
            <Bar dataKey="Sell" fill="#FF6C40" stackId="stack" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </>
  );
};

// Add StatsModal component
const StatsModal = ({ open, onClose, account, traderStats }) => {
  if (!traderStats || !traderStats[account]) return null;
  const stats = traderStats[account];

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="trader-stats-modal"
      aria-describedby="trader-statistics-details"
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: 1000,
          bgcolor: 'background.paper',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.16)',
          borderRadius: '16px',
          border: '1px solid rgba(145, 158, 171, 0.12)',
          p: 3,
          maxHeight: '90vh',
          overflow: 'auto',
          backdropFilter: 'blur(20px)',
          '&::-webkit-scrollbar': {
            width: '8px'
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(145, 158, 171, 0.08)',
            borderRadius: '4px'
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(145, 158, 171, 0.24)',
            borderRadius: '4px',
            '&:hover': {
              background: 'rgba(145, 158, 171, 0.4)'
            }
          }
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" sx={{ fontWeight: '700', fontSize: '20px' }}>
            Trader Statistics for {truncate(account, 20)}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="View on Bithomp" placement="bottom">
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: '12px',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: '1px solid rgba(145, 158, 171, 0.12)',
                  '&:hover': {
                    backgroundColor: 'rgba(145, 158, 171, 0.08)',
                    transform: 'scale(1.05)',
                    borderColor: 'rgba(145, 158, 171, 0.24)'
                  }
                }}
              >
                <Link
                  underline="none"
                  color="inherit"
                  target="_blank"
                  href={`https://bithomp.com/explorer/${account}`}
                  rel="noreferrer noopener nofollow"
                >
                  <LinkIcon sx={{ fontSize: '20px', color: 'primary.main' }} />
                </Link>
              </Box>
            </Tooltip>
            <CopyButton text={account} />
          </Stack>
        </Stack>

        {/* Grid layout for all stats */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3, mt: 2 }}>
          {/* Performance Overview */}
          <Box
            sx={{
              p: 2.5,
              borderRadius: '12px',
              border: '1px solid rgba(145, 158, 171, 0.12)',
              backgroundColor: 'rgba(145, 158, 171, 0.04)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                borderColor: 'rgba(145, 158, 171, 0.24)',
                backgroundColor: 'rgba(145, 158, 171, 0.08)'
              }
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                mb: 2,
                fontWeight: '700',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: 'text.secondary'
              }}
            >
              PERFORMANCE OVERVIEW
            </Typography>
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: '500' }}>
                  Win Rate:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: '600' }}>
                  {(
                    (stats.profitableTrades / (stats.profitableTrades + stats.losingTrades)) *
                    100
                  ).toFixed(1)}
                  %
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: '500' }}>
                  Total Trades:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: '600' }}>
                  {fNumber(stats.profitableTrades + stats.losingTrades)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: '500' }}>
                  Total Volume:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: '600' }}>
                  {fNumber(stats.totalVolume)} {name}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: '500' }}>
                  ROI:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: '600',
                    color: stats.roi * 100 >= 0 ? '#54D62C' : '#FF6C40'
                  }}
                >
                  {fNumber(Math.abs(stats.roi * 100))}%
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: '500' }}>
                  Best Trade:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: '600', color: '#54D62C' }}>
                  {fNumber(stats.maxProfitTrade)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: '500' }}>
                  Worst Trade:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: '600', color: '#FF6C40' }}>
                  {fNumber(Math.abs(stats.maxLossTrade))}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Trade Breakdown */}
          <Box
            sx={{
              p: 2.5,
              borderRadius: '12px',
              border: '1px solid rgba(145, 158, 171, 0.12)',
              backgroundColor: 'rgba(145, 158, 171, 0.04)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                borderColor: 'rgba(145, 158, 171, 0.24)',
                backgroundColor: 'rgba(145, 158, 171, 0.08)'
              }
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                mb: 2,
                fontWeight: '700',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: 'text.secondary'
              }}
            >
              TRADE BREAKDOWN
            </Typography>
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: '500' }}>
                  Buy Volume:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: '600', color: '#54D62C' }}>
                  {fNumber(stats.buyVolume)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: '500' }}>
                  Sell Volume:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: '600', color: '#FF6C40' }}>
                  {fNumber(stats.sellVolume)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: '500' }}>
                  Profitable Trades:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: '600', color: '#54D62C' }}>
                  {fNumber(stats.profitableTrades)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: '500' }}>
                  Losing Trades:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: '600', color: '#FF6C40' }}>
                  {fNumber(stats.losingTrades)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: '500' }}>
                  24h Volume:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: '600' }}>
                  {fNumber(stats.volume24h)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: '500' }}>
                  7d Volume:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: '600' }}>
                  {fNumber(stats.volume7d)}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Activity Metrics */}
          <Box
            sx={{
              p: 2.5,
              borderRadius: '12px',
              border: '1px solid rgba(145, 158, 171, 0.12)',
              backgroundColor: 'rgba(145, 158, 171, 0.04)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                borderColor: 'rgba(145, 158, 171, 0.24)',
                backgroundColor: 'rgba(145, 158, 171, 0.08)'
              }
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                mb: 2,
                fontWeight: '700',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: 'text.secondary'
              }}
            >
              ACTIVITY METRICS
            </Typography>
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: '500' }}>
                  24h Trades:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: '600' }}>
                  {fNumber(stats.trades24h)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: '500' }}>
                  7d Trades:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: '600' }}>
                  {fNumber(stats.trades7d)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: '500' }}>
                  24h Profit:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: '600',
                    color: stats.profit24h >= 0 ? '#54D62C' : '#FF6C40'
                  }}
                >
                  {fNumber(Math.abs(stats.profit24h))}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: '500' }}>
                  7d Profit:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: '600',
                    color: stats.profit7d >= 0 ? '#54D62C' : '#FF6C40'
                  }}
                >
                  {fNumber(Math.abs(stats.profit7d))}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption">Avg Holding Time:</Typography>
                <Typography variant="body2" sx={{ fontWeight: '600' }}>
                  {Math.round(stats.avgHoldingTime / 3600)}h
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: '500' }}>
                  Trade Frequency:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: '600' }}>
                  {Math.round(stats.trades24h / 24)} /hr
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Box>

        {/* Trading History */}
        <Box
          sx={{
            mt: 3,
            pt: 3,
            borderTop: '1px solid rgba(145, 158, 171, 0.12)',
            p: 2.5,
            borderRadius: '12px',
            border: '1px solid rgba(145, 158, 171, 0.12)',
            backgroundColor: 'rgba(145, 158, 171, 0.04)'
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              mb: 2,
              fontWeight: '700',
              fontSize: '14px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: 'text.secondary'
            }}
          >
            TRADING HISTORY
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Stack direction="row" spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant="body2" sx={{ fontWeight: '500' }}>
                    First Trade:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: '600' }}>
                    {new Date(stats.firstTradeDate).toLocaleDateString()}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mt: 1
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: '500' }}>
                    Last Trade:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: '600' }}>
                    {new Date(stats.lastTradeDate).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant="body2" sx={{ fontWeight: '500' }}>
                    Avg Holding:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: '600' }}>
                    {Math.round(stats.avgHoldingTime / 3600)}h
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mt: 1
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: '500' }}>
                    Trade Frequency:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: '600' }}>
                    {Math.round(stats.trades24h / 24)} /hr
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </Box>
        </Box>

        {/* Volume Chart */}
        <Box
          sx={{
            mt: 3,
            pt: 3,
            borderTop: '1px solid rgba(145, 158, 171, 0.12)',
            p: 2.5,
            borderRadius: '12px',
            border: '1px solid rgba(145, 158, 171, 0.12)',
            backgroundColor: 'rgba(145, 158, 171, 0.04)'
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              mb: 2,
              fontWeight: '700',
              fontSize: '14px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: 'text.secondary'
            }}
          >
            TRADING HISTORY
          </Typography>
          {stats.dailyVolumes && stats.dailyVolumes.length > 0 && (
            <Typography
              variant="body2"
              sx={{
                display: 'block',
                mb: 2,
                fontWeight: '500',
                color: 'text.secondary'
              }}
            >
              {new Date(stats.firstTradeDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
              {' - '}
              {new Date(stats.lastTradeDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Typography>
          )}
          <DailyVolumeChart data={stats.dailyVolumes || []} />
        </Box>
      </Box>
    </Modal>
  );
};

// Add this function before the RichListData component
const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <Tooltip title={copied ? 'Copied!' : 'Copy Address'}>
      <IconButton
        size="small"
        onClick={handleCopy}
        sx={{
          ml: 1,
          color: copied ? 'primary.main' : 'text.secondary',
          '&:hover': { color: 'primary.main' }
        }}
      >
        <ContentCopyIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
};

// Add styled components after imports
const StickyTableCell = styled(TableCell)({
  position: 'sticky',
  zIndex: 1000,
  top: 0,
  fontWeight: '600',
  fontSize: '13px',
  letterSpacing: '0.02em',
  textTransform: 'uppercase'
});

const SmallInfoIcon = (props) => (
  <InfoIcon
    {...props}
    sx={{
      fontSize: '14px',
      ml: 0.5,
      opacity: 0.7,
      transition: 'opacity 0.2s ease',
      '&:hover': {
        opacity: 1
      }
    }}
  />
);

export default function RichListData({ token }) {
  const BASE_URL = process.env.API_URL;
  const metrics = useSelector(selectMetrics);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { accountProfile, setLoading, openSnackbar, darkMode, activeFiatCurrency } =
    useContext(AppContext);
  const isAdmin = accountProfile && accountProfile.account && accountProfile.admin;

  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(20);
  const [frozen, setFrozen] = useState(false);
  const [count, setCount] = useState(0);
  const [richList, setRichList] = useState([]);
  const [wallets, setWallets] = useState([]); // Team Wallets

  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('');

  const { name, exch } = token;

  const [traderStats, setTraderStats] = useState({});
  const [selectedAccount, setSelectedAccount] = useState(null);

  const fetchTraderStats = async (address, md5) => {
    try {
      const response = await axios.get(`${BASE_URL}/analytics/trader/${address}/${md5}`);
      if (response.status === 200) {
        setTraderStats((prev) => ({
          ...prev,
          [address]: {
            ...response.data,
            isLoaded: true,
            hasData:
              response.data &&
              (response.data.totalTrades > 0 || response.data.dailyVolumes?.length > 0)
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching trader stats:', error);
      setTraderStats((prev) => ({
        ...prev,
        [address]: {
          isLoaded: true,
          hasData: false,
          error: error.message
        }
      }));
    }
  };

  useEffect(() => {
    function getRichList() {
      // https://api.xrpl.to/api/richlist/0413ca7cfc258dfaf698c02fe304e607?start=0&limit=100&freeze=false
      axios
        .get(
          `${BASE_URL}/richlist/${token.md5}?start=${
            page * rows
          }&limit=${rows}&freeze=${frozen}&sortBy=${orderBy}&sortType=${order}`
        )
        .then((res) => {
          let ret = res.status === 200 ? res.data : undefined;
          if (ret) {
            setCount(ret.length);
            setRichList(ret.richList);
          }
        })
        .catch((err) => {
          console.log('Error on getting richlist!', err);
        })
        .then(function () {
          // always executed
        });
    }
    getRichList();
  }, [page, rows, frozen, orderBy, order]);

  useEffect(() => {
    function getTeamWallets() {
      const accountAdmin = accountProfile.account;
      const accountToken = accountProfile.token;
      // https://api.xrpl.to/api/admin/get_team_wallets/0413ca7cfc258dfaf698c02fe304e607
      axios
        .get(`${BASE_URL}/admin/get_team_wallets/${token.md5}`, {
          headers: {
            'x-access-account': accountAdmin,
            'x-access-token': accountToken
          }
        })
        .then((res) => {
          let ret = res.status === 200 ? res.data : undefined;
          if (ret) {
            setWallets(ret.wallets);
          }
        })
        .catch((err) => {
          console.log('Error on getting team wallets!', err);
        })
        .then(function () {
          // always executed
        });
    }
    if (isAdmin) getTeamWallets();
  }, [isAdmin]);

  const onChangeTeamWallet = async (account) => {
    setLoading(true);
    try {
      let res;

      const accountAdmin = accountProfile.account;
      const accountToken = accountProfile.token;

      let action = 'add';

      if (wallets.includes(account)) {
        action = 'remove';
      }

      const body = { md5: token.md5, account, action };

      res = await axios.post(`${BASE_URL}/admin/update_team_wallets`, body, {
        headers: {
          'x-access-account': accountAdmin,
          'x-access-token': accountToken
        }
      });

      if (res.status === 200) {
        const ret = res.data;
        if (ret.status) {
          setWallets(ret.wallets);
          openSnackbar('Successful!', 'success');
        } else {
          const err = ret.err;
          openSnackbar(err, 'error');
        }
      }
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  const onChangeFrozen = (e) => {
    setFrozen(!frozen);
  };
  const createSortHandler = (id) => (event) => {
    const isDesc = orderBy === id && order === 'desc';
    setOrder(isDesc ? 'asc' : 'desc');
    setOrderBy(id);
  };

  const tableRef = useRef(null);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollLeft(tableRef?.current?.scrollLeft > 0);
    };

    tableRef?.current?.addEventListener('scroll', handleScroll);

    return () => {
      tableRef?.current?.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const [hoveredHeader, setHoveredHeader] = useState(null);

  // Get modern colors for top 10 indicators
  const modernColors = getModernColors(darkMode);

  const handleOpenStats = (account) => {
    if (!traderStats[account]?.isLoaded) {
      fetchTraderStats(account, token.md5);
    }
    setSelectedAccount(account);
  };

  const handleCloseStats = () => {
    setSelectedAccount(null);
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          py: 1,
          overflow: 'auto',
          width: '100%',
          '& > *': {
            scrollSnapAlign: 'center'
          },
          '::-webkit-scrollbar': { display: 'none' }
        }}
        ref={tableRef}
      >
        <Table
          stickyHeader
          sx={{
            '& .MuiTableCell-root': {
              borderBottom: 'none',
              boxShadow: darkMode
                ? 'inset 0 -1px 0 rgba(145, 158, 171, 0.12)'
                : 'inset 0 -1px 0 rgba(145, 158, 171, 0.24)'
            }
          }}
        >
          <TableHead
            sx={{
              position: 'sticky',
              zIndex: 999,
              background: darkMode ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderBottom: `1px solid ${
                darkMode ? 'rgba(145, 158, 171, 0.12)' : 'rgba(145, 158, 171, 0.24)'
              }`,
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '1px',
                background: `linear-gradient(90deg, transparent, ${
                  darkMode ? 'rgba(145, 158, 171, 0.12)' : 'rgba(145, 158, 171, 0.24)'
                }, transparent)`
              }
            }}
          >
            <TableRow
              sx={{
                '& .MuiTableCell-root': {
                  fontSize: '13px',
                  fontWeight: '600',
                  padding: '20px 12px',
                  height: 'auto',
                  whiteSpace: 'nowrap',
                  color: darkMode ? '#919EAB' : '#637381',
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em',
                  borderBottom: 'none',
                  '&:not(:first-of-type)': {
                    paddingLeft: '8px'
                  }
                },
                '& .MuiTableSortLabel-root': {
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'inherit',
                  '&:hover': {
                    color: darkMode ? '#fff' : '#212B36'
                  },
                  '&.Mui-active': {
                    color: darkMode ? '#fff' : '#212B36',
                    '& .MuiTableSortLabel-icon': {
                      color: 'inherit'
                    }
                  },
                  '& .MuiTableSortLabel-icon': {
                    fontSize: '16px'
                  }
                }
              }}
            >
              <StickyTableCell
                align="left"
                sx={{
                  position: 'sticky',
                  zIndex: 998,
                  left: 0,
                  background: darkMode ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  '&:before': scrollLeft
                    ? {
                        content: "''",
                        boxShadow: 'inset 10px 0 8px -8px rgba(145, 158, 171, 0.24)',
                        position: 'absolute',
                        top: '0',
                        right: '0',
                        bottom: '-1px',
                        width: '30px',
                        transform: 'translate(100%)',
                        transition: 'box-shadow .3s',
                        pointerEvents: 'none'
                      }
                    : {}
                }}
              >
                #
              </StickyTableCell>

              <StickyTableCell align="left">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="inherit" sx={{ fontWeight: '600' }}>
                    Address
                  </Typography>
                </Box>
              </StickyTableCell>

              <StickyTableCell align="left">
                <TableSortLabel
                  hideSortIcon
                  active={orderBy === 'frozen'}
                  direction={orderBy === 'frozen' ? order : 'desc'}
                  onClick={onChangeFrozen}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <SmallInfoIcon />
                    <Typography variant="inherit" sx={{ fontWeight: '600', ml: 0.5 }}>
                      Frozen ({frozen ? 'YES' : 'ALL'})
                    </Typography>
                  </Box>
                  {orderBy === 'frozen' ? (
                    <Box sx={{ ...visuallyHidden }}>
                      {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                    </Box>
                  ) : null}
                </TableSortLabel>
              </StickyTableCell>

              <StickyTableCell align="left">
                <TableSortLabel
                  hideSortIcon
                  active={orderBy === 'balance'}
                  direction={orderBy === 'balance' ? order : 'desc'}
                  onClick={createSortHandler('balance')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <SmallInfoIcon />
                    <Typography variant="inherit" sx={{ fontWeight: '600', ml: 0.5 }}>
                      Balance({name})
                    </Typography>
                  </Box>
                  {orderBy === 'balance' ? (
                    <Box sx={{ ...visuallyHidden }}>
                      {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                    </Box>
                  ) : null}
                </TableSortLabel>
              </StickyTableCell>

              <StickyTableCell align="left">
                <TableSortLabel
                  hideSortIcon
                  active={orderBy === 'balance24h'}
                  direction={orderBy === 'balance24h' ? order : 'desc'}
                  onClick={createSortHandler('balance24h')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <SmallInfoIcon />
                    <Typography variant="inherit" sx={{ fontWeight: '600', ml: 0.5 }}>
                      Change
                    </Typography>
                    <Box
                      component="span"
                      sx={{
                        display: 'inline-block',
                        marginLeft: '4px',
                        fontSize: '10px',
                        fontWeight: '600',
                        lineHeight: '16px',
                        backgroundColor: 'rgba(99, 115, 129, 0.12)',
                        backdropFilter: 'blur(6px)',
                        borderRadius: '6px',
                        padding: '2px 6px',
                        border: '1px solid rgba(145, 158, 171, 0.08)'
                      }}
                    >
                      24h
                    </Box>
                  </Box>
                  {orderBy === 'balance24h' ? (
                    <Box sx={{ ...visuallyHidden }}>
                      {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                    </Box>
                  ) : null}
                </TableSortLabel>
              </StickyTableCell>

              <StickyTableCell align="left">
                <TableSortLabel
                  hideSortIcon
                  active={orderBy === 'holding'}
                  direction={orderBy === 'holding' ? order : 'desc'}
                  onClick={createSortHandler('holding')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <SmallInfoIcon />
                    <Typography variant="inherit" sx={{ fontWeight: '600', ml: 0.5 }}>
                      Holding
                    </Typography>
                  </Box>
                  {orderBy === 'holding' ? (
                    <Box sx={{ ...visuallyHidden }}>
                      {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                    </Box>
                  ) : null}
                </TableSortLabel>
              </StickyTableCell>

              <StickyTableCell align="left">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="inherit" sx={{ fontWeight: '600' }}>
                    Value
                  </Typography>
                </Box>
              </StickyTableCell>

              {isAdmin && (
                <StickyTableCell align="left">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="inherit" sx={{ fontWeight: '600' }}>
                      Team Wallet
                    </Typography>
                  </Box>
                </StickyTableCell>
              )}

              <StickyTableCell align="left"></StickyTableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {
              // exchs.slice(page * rows, page * rows + rows)
              richList.map((row) => {
                const { id, account, freeze, balance, holding } = row;

                var balance24h = false;
                if (row.balance24h) {
                  var change = balance - row.balance24h;
                  var percentChange = Math.abs((change / row.balance24h) * 100).toFixed(2);
                  var color24h, icon24h;
                  if (change >= 0) {
                    color24h = '#54D62C';
                    icon24h = caretUp;
                  } else {
                    color24h = '#FF6C40';
                    icon24h = caretDown;
                  }
                  balance24h = true;
                }

                return (
                  <TableRow
                    key={id}
                    sx={{
                      borderBottom: '1px solid rgba(145, 158, 171, 0.08)',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        '& .MuiTableCell-root': {
                          backgroundColor: darkMode
                            ? 'rgba(255, 255, 255, 0.04)'
                            : 'rgba(145, 158, 171, 0.04)',
                          backdropFilter: 'blur(6px)'
                        },
                        cursor: 'pointer',
                        transform: 'translateY(-1px)',
                        boxShadow: darkMode
                          ? '0 4px 16px rgba(0, 0, 0, 0.24)'
                          : '0 4px 16px rgba(145, 158, 171, 0.16)'
                      },
                      '& .MuiTypography-root': {
                        fontSize: '14px',
                        fontWeight: '500'
                      },
                      '& .MuiTableCell-root': {
                        padding: '16px 12px',
                        whiteSpace: 'nowrap',
                        borderBottom: 'none',
                        '&:not(:first-of-type)': {
                          paddingLeft: '8px'
                        }
                      }
                    }}
                  >
                    <TableCell
                      align="left"
                      sx={{
                        position: 'sticky',
                        zIndex: 998,
                        left: 0,
                        background: darkMode ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        '&:before': scrollLeft
                          ? {
                              content: "''",
                              boxShadow: 'inset 10px 0 8px -8px rgba(145, 158, 171, 0.24)',
                              position: 'absolute',
                              top: '0',
                              right: '0',
                              bottom: '-1px',
                              width: '30px',
                              transform: 'translate(100%)',
                              transition: 'box-shadow .3s',
                              pointerEvents: 'none'
                            }
                          : {}
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {id <= 10 && (
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              backgroundColor: modernColors[id - 1],
                              boxShadow: `0 2px 8px ${modernColors[id - 1]}40`,
                              flexShrink: 0
                            }}
                          />
                        )}
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: '600', fontSize: '14px' }}
                        >
                          {id}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="left">
                      <Stack direction="row" alignItems="center">
                        <Tooltip
                          title={
                            !traderStats[account] ? (
                              <Box sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CircularProgress size={16} />
                                <Typography variant="body2">Loading trader stats...</Typography>
                              </Box>
                            ) : !traderStats[account].hasData ? (
                              <Box sx={{ p: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                  No trading activity found for this address
                                </Typography>
                              </Box>
                            ) : (
                              <Box sx={{ p: 1, maxWidth: 600 }}>
                                <Typography
                                  variant="subtitle2"
                                  gutterBottom
                                  sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 1 }}
                                >
                                  Trader Statistics
                                </Typography>

                                {/* Two-column layout for stats */}
                                <Box
                                  sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}
                                >
                                  {/* Left column */}
                                  <Box>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{ display: 'block', mb: 1 }}
                                    >
                                      PERFORMANCE OVERVIEW
                                    </Typography>
                                    <Stack spacing={0.5}>
                                      <Box
                                        sx={{ display: 'flex', justifyContent: 'space-between' }}
                                      >
                                        <Typography variant="caption">Win Rate:</Typography>
                                        <Typography variant="caption">
                                          {(
                                            (traderStats[account].profitableTrades /
                                              (traderStats[account].profitableTrades +
                                                traderStats[account].losingTrades)) *
                                            100
                                          ).toFixed(1)}
                                          %
                                        </Typography>
                                      </Box>
                                      <Box
                                        sx={{ display: 'flex', justifyContent: 'space-between' }}
                                      >
                                        <Typography variant="caption">Total Trades:</Typography>
                                        <Typography variant="caption">
                                          {fNumber(
                                            traderStats[account].profitableTrades +
                                              traderStats[account].losingTrades
                                          )}
                                        </Typography>
                                      </Box>
                                      <Box
                                        sx={{ display: 'flex', justifyContent: 'space-between' }}
                                      >
                                        <Typography variant="caption">Total Volume:</Typography>
                                        <Typography variant="caption">
                                          {fNumber(traderStats[account].totalVolume)} {name}
                                        </Typography>
                                      </Box>
                                      <Box
                                        sx={{ display: 'flex', justifyContent: 'space-between' }}
                                      >
                                        <Typography variant="caption">ROI:</Typography>
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            color:
                                              traderStats[account].roi * 100 >= 0
                                                ? '#54D62C'
                                                : '#FF6C40'
                                          }}
                                        >
                                          {fNumber(Math.abs(traderStats[account].roi * 100))}%
                                        </Typography>
                                      </Box>
                                    </Stack>

                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{ display: 'block', mt: 2, mb: 1 }}
                                    >
                                      TRADE BREAKDOWN
                                    </Typography>
                                    <Stack spacing={0.5}>
                                      <Box
                                        sx={{ display: 'flex', justifyContent: 'space-between' }}
                                      >
                                        <Typography variant="caption">Buy Volume:</Typography>
                                        <Typography variant="caption" sx={{ color: '#54D62C' }}>
                                          {fNumber(traderStats[account].buyVolume)}
                                        </Typography>
                                      </Box>
                                      <Box
                                        sx={{ display: 'flex', justifyContent: 'space-between' }}
                                      >
                                        <Typography variant="caption">Sell Volume:</Typography>
                                        <Typography variant="caption" sx={{ color: '#FF6C40' }}>
                                          {fNumber(traderStats[account].sellVolume)}
                                        </Typography>
                                      </Box>
                                      <Box
                                        sx={{ display: 'flex', justifyContent: 'space-between' }}
                                      >
                                        <Typography variant="caption">
                                          Profitable/Losing:
                                        </Typography>
                                        <Typography variant="caption">
                                          <span style={{ color: '#54D62C' }}>
                                            {fNumber(traderStats[account].profitableTrades)}
                                          </span>
                                          {' / '}
                                          <span style={{ color: '#FF6C40' }}>
                                            {fNumber(traderStats[account].losingTrades)}
                                          </span>
                                        </Typography>
                                      </Box>
                                    </Stack>
                                  </Box>

                                  {/* Right column */}
                                  <Box>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{ display: 'block', mb: 1 }}
                                    >
                                      PROFIT METRICS
                                    </Typography>
                                    <Stack spacing={0.5}>
                                      <Box
                                        sx={{ display: 'flex', justifyContent: 'space-between' }}
                                      >
                                        <Typography variant="caption">Best Trade:</Typography>
                                        <Typography variant="caption" sx={{ color: '#54D62C' }}>
                                          {fNumber(traderStats[account].maxProfitTrade)}
                                        </Typography>
                                      </Box>
                                      <Box
                                        sx={{ display: 'flex', justifyContent: 'space-between' }}
                                      >
                                        <Typography variant="caption">Worst Trade:</Typography>
                                        <Typography variant="caption" sx={{ color: '#FF6C40' }}>
                                          {fNumber(Math.abs(traderStats[account].maxLossTrade))}
                                        </Typography>
                                      </Box>
                                      <Box
                                        sx={{ display: 'flex', justifyContent: 'space-between' }}
                                      >
                                        <Typography variant="caption">24h Profit:</Typography>
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            color:
                                              traderStats[account].profit24h >= 0
                                                ? '#54D62C'
                                                : '#FF6C40'
                                          }}
                                        >
                                          {fNumber(Math.abs(traderStats[account].profit24h))}
                                        </Typography>
                                      </Box>
                                      <Box
                                        sx={{ display: 'flex', justifyContent: 'space-between' }}
                                      >
                                        <Typography variant="caption">7d Profit:</Typography>
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            color:
                                              traderStats[account].profit7d >= 0
                                                ? '#54D62C'
                                                : '#FF6C40'
                                          }}
                                        >
                                          {fNumber(Math.abs(traderStats[account].profit7d))}
                                        </Typography>
                                      </Box>
                                    </Stack>

                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{ display: 'block', mt: 2, mb: 1 }}
                                    >
                                      ACTIVITY METRICS
                                    </Typography>
                                    <Stack spacing={0.5}>
                                      <Box
                                        sx={{ display: 'flex', justifyContent: 'space-between' }}
                                      >
                                        <Typography variant="caption">24h Volume:</Typography>
                                        <Typography variant="caption">
                                          {fNumber(traderStats[account].volume24h)}
                                        </Typography>
                                      </Box>
                                      <Box
                                        sx={{ display: 'flex', justifyContent: 'space-between' }}
                                      >
                                        <Typography variant="caption">7d Volume:</Typography>
                                        <Typography variant="caption">
                                          {fNumber(traderStats[account].volume7d)}
                                        </Typography>
                                      </Box>
                                      <Box
                                        sx={{ display: 'flex', justifyContent: 'space-between' }}
                                      >
                                        <Typography variant="caption">24h Trades:</Typography>
                                        <Typography variant="caption">
                                          {fNumber(traderStats[account].trades24h)}
                                        </Typography>
                                      </Box>
                                      <Box
                                        sx={{ display: 'flex', justifyContent: 'space-between' }}
                                      >
                                        <Typography variant="caption">7d Trades:</Typography>
                                        <Typography variant="caption">
                                          {fNumber(traderStats[account].trades7d)}
                                        </Typography>
                                      </Box>
                                    </Stack>
                                  </Box>
                                </Box>

                                {/* Trading History */}
                                <Box
                                  sx={{
                                    mt: 2,
                                    pt: 2,
                                    borderTop: '1px solid rgba(255,255,255,0.1)'
                                  }}
                                >
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ display: 'block', mb: 1 }}
                                  >
                                    TRADING HISTORY
                                  </Typography>
                                  <Box
                                    sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}
                                  >
                                    <Stack spacing={0.5}>
                                      <Box
                                        sx={{ display: 'flex', justifyContent: 'space-between' }}
                                      >
                                        <Typography variant="caption">First Trade:</Typography>
                                        <Typography variant="caption">
                                          {new Date(
                                            traderStats[account].firstTradeDate
                                          ).toLocaleDateString()}
                                        </Typography>
                                      </Box>
                                      <Box
                                        sx={{ display: 'flex', justifyContent: 'space-between' }}
                                      >
                                        <Typography variant="caption">Last Trade:</Typography>
                                        <Typography variant="caption">
                                          {new Date(
                                            traderStats[account].lastTradeDate
                                          ).toLocaleDateString()}
                                        </Typography>
                                      </Box>
                                    </Stack>
                                    <Stack spacing={0.5}>
                                      <Box
                                        sx={{ display: 'flex', justifyContent: 'space-between' }}
                                      >
                                        <Typography variant="caption">Avg Holding:</Typography>
                                        <Typography variant="caption">
                                          {Math.round(traderStats[account].avgHoldingTime / 3600)}h
                                        </Typography>
                                      </Box>
                                      <Box
                                        sx={{ display: 'flex', justifyContent: 'space-between' }}
                                      >
                                        <Typography variant="caption">Trade Frequency:</Typography>
                                        <Typography variant="caption">
                                          {Math.round(traderStats[account].trades24h / 24)} /hr
                                        </Typography>
                                      </Box>
                                    </Stack>
                                  </Box>
                                </Box>

                                {/* Volume Chart */}
                                <Box
                                  sx={{
                                    mt: 2,
                                    pt: 2,
                                    borderTop: '1px solid rgba(255,255,255,0.1)'
                                  }}
                                >
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ display: 'block', mb: 1 }}
                                  >
                                    TRADING HISTORY
                                  </Typography>
                                  {traderStats[account].dailyVolumes &&
                                    traderStats[account].dailyVolumes.length > 0 && (
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ display: 'block', mb: 1 }}
                                      >
                                        {new Date(
                                          traderStats[account].firstTradeDate
                                        ).toLocaleDateString('en-US', {
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric'
                                        })}
                                        {' - '}
                                        {new Date(
                                          traderStats[account].lastTradeDate
                                        ).toLocaleDateString('en-US', {
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric'
                                        })}
                                      </Typography>
                                    )}
                                  <DailyVolumeChart
                                    data={traderStats[account].dailyVolumes || []}
                                  />
                                </Box>
                              </Box>
                            )
                          }
                          onOpen={() =>
                            !traderStats[account]?.isLoaded && fetchTraderStats(account, token.md5)
                          }
                          PopperProps={{
                            sx: {
                              '& .MuiTooltip-tooltip': {
                                bgcolor: darkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(32, 32, 32, 0.9)',
                                maxWidth: 'none'
                              }
                            }
                          }}
                        >
                          <Link
                            underline="none"
                            color="inherit"
                            target="_blank"
                            href={`https://bithomp.com/explorer/${account}`}
                            rel="noreferrer noopener nofollow"
                          >
                            <Typography
                              variant="subtitle1"
                              color="primary"
                              sx={{ fontWeight: '500', fontSize: '14px' }}
                            >
                              {truncate(account, 20)}
                              {EXCHANGE_ADDRESSES[account] && (
                                <Box
                                  component="span"
                                  sx={{
                                    ml: 1,
                                    px: 1,
                                    py: 0.25,
                                    borderRadius: 1,
                                    fontSize: '0.75rem',
                                    bgcolor: 'primary.main',
                                    color: 'primary.contrastText'
                                  }}
                                >
                                  {EXCHANGE_ADDRESSES[account]}
                                </Box>
                              )}
                            </Typography>
                          </Link>
                        </Tooltip>
                        <CopyButton text={account} />
                      </Stack>
                    </TableCell>
                    <TableCell align="left">{freeze && <Icon icon={checkIcon} />}</TableCell>
                    <TableCell align="left">
                      <Typography variant="subtitle1" sx={{ fontWeight: '500', fontSize: '14px' }}>
                        {fNumber(balance)}
                      </Typography>
                    </TableCell>
                    <TableCell align="left">
                      {balance24h && (
                        <Stack direction="row" spacing={0.1} alignItems="center">
                          <Icon icon={icon24h} color={color24h} />
                          <Typography
                            sx={{ color: color24h, fontWeight: '500', fontSize: '14px' }}
                            variant="subtitle1"
                          >
                            <NumberTooltip number={Math.abs(change)} /> (
                            <NumberTooltip append="%" number={percentChange} />)
                          </Typography>
                        </Stack>
                      )}
                    </TableCell>
                    <TableCell align="left">
                      <Typography variant="subtitle1" sx={{ fontWeight: '500', fontSize: '14px' }}>
                        {holding} %
                      </Typography>
                    </TableCell>
                    <TableCell align="left">
                      <Stack>
                        <Typography
                          variant="h4"
                          noWrap
                          sx={{ fontWeight: '600', fontSize: '16px' }}
                        >
                          {currencySymbols[activeFiatCurrency]}{' '}
                          {fNumber((exch * balance) / metrics[activeFiatCurrency])}
                        </Typography>
                      </Stack>
                    </TableCell>

                    {isAdmin && (
                      <TableCell align="left">
                        <Checkbox
                          checked={wallets.includes(account)}
                          // onChange={onChangeTeamWallet(account)}
                          onClick={() => {
                            onChangeTeamWallet(account);
                          }}
                          inputProps={{ 'aria-label': 'controlled' }}
                        />
                      </TableCell>
                    )}

                    <TableCell align="left">
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Tooltip title="View on Bithomp">
                          <Box
                            sx={{
                              p: 1,
                              borderRadius: '8px',
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              '&:hover': {
                                backgroundColor: darkMode
                                  ? 'rgba(255, 255, 255, 0.08)'
                                  : 'rgba(145, 158, 171, 0.08)',
                                transform: 'scale(1.1)'
                              }
                            }}
                          >
                            <Link
                              underline="none"
                              color="inherit"
                              target="_blank"
                              href={`https://bithomp.com/explorer/${account}`}
                              rel="noreferrer noopener nofollow"
                            >
                              <LinkIcon
                                sx={{ fontSize: '20px', color: darkMode ? '#919EAB' : '#637381' }}
                              />
                            </Link>
                          </Box>
                        </Tooltip>
                        <Tooltip title="View Trader Statistics">
                          <Box
                            sx={{
                              p: 1,
                              borderRadius: '8px',
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              '&:hover': {
                                backgroundColor: darkMode
                                  ? 'rgba(255, 255, 255, 0.08)'
                                  : 'rgba(145, 158, 171, 0.08)',
                                transform: 'scale(1.1)'
                              }
                            }}
                          >
                            <BarChartIcon
                              onClick={() => handleOpenStats(account)}
                              sx={{
                                cursor: 'pointer',
                                fontSize: '20px',
                                color: darkMode ? '#919EAB' : '#637381',
                                '&:hover': {
                                  color: 'primary.main'
                                }
                              }}
                            />
                          </Box>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            }
          </TableBody>
        </Table>
      </Box>

      <RichListToolbar count={count} rows={rows} setRows={setRows} page={page} setPage={setPage} />

      <StatsModal
        open={Boolean(selectedAccount)}
        onClose={handleCloseStats}
        account={selectedAccount}
        traderStats={traderStats}
      />
    </>
  );
}
