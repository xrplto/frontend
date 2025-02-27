import { useState } from 'react';
import { Box, Typography, Modal, Stack, Link, IconButton } from '@mui/material';

// Icons
import LinkIcon from '@mui/icons-material/Link';

// Utils
import { fNumber, fPercent } from 'src/utils/formatNumber';

// Recharts
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  Line,
  ComposedChart
} from 'recharts';

export const DailyVolumeChart = ({ data }) => {
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

  // Calculate cumulative profit
  const chartData = filterDataByInterval(data, interval)
    .map((item, index, array) => {
      const cumulativeProfit = array
        .slice(0, index + 1)
        .reduce((sum, entry) => sum + (entry.profit || 0), 0);

      return {
        date: new Date(item.date),
        Buy: item.buyVolume || 0,
        Sell: item.sellVolume || 0,
        Profit: item.profit || 0,
        avgPrice: item.avgPrice || 0,
        cumulativeProfit,
        fullDate: new Date(item.date)
      };
    })
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
          <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 20 }}>
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
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 9 }}
              tickFormatter={(value) => `${value.toFixed(0)} XRP`}
              width={70}
              label={{
                value: 'Volume (XRP)',
                angle: -90,
                position: 'insideLeft',
                offset: 10,
                style: { fontSize: '10px' }
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 9 }}
              tickFormatter={(value) => `${value.toFixed(0)} XRP`}
              width={70}
              label={{
                value: 'Profit (XRP)',
                angle: 90,
                position: 'insideRight',
                offset: 10,
                style: { fontSize: '10px' }
              }}
            />
            <YAxis
              yAxisId="price"
              orientation="right"
              tick={{ fontSize: 9 }}
              tickFormatter={(value) => `${value.toFixed(6)} XRP`}
              width={90}
              label={{
                value: 'Price (XRP)',
                angle: 90,
                position: 'insideRight',
                offset: 25,
                style: { fontSize: '10px' }
              }}
            />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                border: 'none',
                borderRadius: '4px',
                fontSize: '11px',
                padding: '4px 8px'
              }}
              formatter={(value, name, props) => [
                `${
                  name === 'avgPrice'
                    ? fNumber(value, 6)
                    : name === 'cumulativeProfit'
                    ? fNumber(value, 2)
                    : fNumber(value)
                } XRP`,
                name === 'cumulativeProfit' ? 'Cumulative Profit' : name,
                `Date: ${props.payload.fullDate.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}`
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: '9px' }}
              payload={[
                { value: 'Buy Volume (XRP)', type: 'rect', color: '#54D62C' },
                { value: 'Sell Volume (XRP)', type: 'rect', color: '#FF6C40' },
                { value: 'Daily Profit (XRP)', type: 'rect', color: '#8884d8' },
                { value: 'Cumulative Profit (XRP)', type: 'line', color: '#82ca9d' },
                { value: 'Avg Price (XRP)', type: 'line', color: '#2196F3' }
              ]}
            />
            <Bar dataKey="Buy" fill="#54D62C" stackId="stack" yAxisId="left" />
            <Bar dataKey="Sell" fill="#FF6C40" stackId="stack" yAxisId="left" />
            <Bar
              dataKey="Profit"
              fill={chartData.map((entry) => (entry.Profit >= 0 ? '#54D62C' : '#FF6C40'))}
              yAxisId="right"
              opacity={0.7}
            />
            <Line
              type="monotone"
              dataKey="cumulativeProfit"
              stroke="#82ca9d"
              strokeWidth={2}
              dot={false}
              yAxisId="right"
            />
            <Line
              type="monotone"
              dataKey="avgPrice"
              stroke="#2196F3"
              strokeWidth={1}
              dot={false}
              yAxisId="price"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </>
  );
};

export const StatsModal = ({ open, onClose, account, traderStats }) => {
  if (!traderStats || !traderStats[account]) return null;
  const stats = traderStats[account];

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);

    if (months > 0) {
      return `${months}m`;
    } else if (days > 0) {
      return `${days}d`;
    } else {
      return `${hours}h`;
    }
  };

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
          boxShadow: 24,
          p: 1.5,
          borderRadius: 2,
          maxHeight: '90vh',
          overflow: 'auto'
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
          <Typography variant="subtitle1">
            Trader Statistics for {account.substring(0, 20)}...
          </Typography>
          <Link
            underline="none"
            color="inherit"
            target="_blank"
            href={`https://bithomp.com/explorer/${account}`}
            rel="noreferrer noopener nofollow"
          >
            <IconButton size="small" sx={{ p: 0.5 }}>
              <LinkIcon fontSize="small" />
            </IconButton>
          </Link>
        </Stack>

        {/* Grid layout for all stats */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 2,
            mb: 2
          }}
        >
          {/* Performance Overview */}
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 0.25, display: 'block', fontWeight: 600 }}
            >
              PERFORMANCE OVERVIEW
            </Typography>
            <Stack spacing={0.25}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption">Win Rate:</Typography>
                <Typography variant="caption">
                  {(
                    (stats.profitableTrades / (stats.profitableTrades + stats.losingTrades)) *
                    100
                  ).toFixed(1)}
                  %
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption">Total Trades:</Typography>
                <Typography variant="caption">{fNumber(stats.totalTrades)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption">Total Volume:</Typography>
                <Typography variant="caption">{fNumber(stats.totalVolume)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption">ROI:</Typography>
                <Typography
                  variant="caption"
                  sx={{ color: stats.roi >= 0 ? '#54D62C' : '#FF6C40' }}
                >
                  {fPercent(stats.roi)}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Trade Breakdown */}
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 0.25, display: 'block', fontWeight: 600 }}
            >
              TRADE BREAKDOWN
            </Typography>
            <Stack spacing={0.25}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption">Buy Volume:</Typography>
                <Typography variant="caption" sx={{ color: '#54D62C' }}>
                  {fNumber(stats.buyVolume)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption">Sell Volume:</Typography>
                <Typography variant="caption" sx={{ color: '#FF6C40' }}>
                  {fNumber(stats.sellVolume)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption">Profitable Trades:</Typography>
                <Typography variant="caption" sx={{ color: '#54D62C' }}>
                  {fNumber(stats.profitableTrades)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption">Losing Trades:</Typography>
                <Typography variant="caption" sx={{ color: '#FF6C40' }}>
                  {fNumber(stats.losingTrades)}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Activity Metrics */}
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 0.25, display: 'block', fontWeight: 600 }}
            >
              ACTIVITY METRICS
            </Typography>
            <Stack spacing={0.25}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption">24h Volume:</Typography>
                <Typography variant="caption">{fNumber(stats.volume24h)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption">7d Volume:</Typography>
                <Typography variant="caption">{fNumber(stats.volume7d)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption">2m Volume:</Typography>
                <Typography variant="caption">{fNumber(stats.volume2m)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption">Avg Hold Time:</Typography>
                <Typography variant="caption">{formatDuration(stats.avgHoldingTime)}</Typography>
              </Box>
            </Stack>
          </Box>

          {/* Profit Metrics */}
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 0.25, display: 'block', fontWeight: 600 }}
            >
              PROFIT METRICS
            </Typography>
            <Stack spacing={0.25}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption">24h Profit:</Typography>
                <Typography
                  variant="caption"
                  sx={{ color: stats.profit24h >= 0 ? '#54D62C' : '#FF6C40' }}
                >
                  {fNumber(stats.profit24h)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption">7d Profit:</Typography>
                <Typography
                  variant="caption"
                  sx={{ color: stats.profit7d >= 0 ? '#54D62C' : '#FF6C40' }}
                >
                  {fNumber(stats.profit7d)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption">2m Profit:</Typography>
                <Typography
                  variant="caption"
                  sx={{ color: stats.profit2m >= 0 ? '#54D62C' : '#FF6C40' }}
                >
                  {fNumber(stats.profit2m)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption">Best Trade:</Typography>
                <Typography variant="caption" sx={{ color: '#54D62C' }}>
                  {fNumber(stats.maxProfitTrade)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption">Worst Trade:</Typography>
                <Typography variant="caption" sx={{ color: '#FF6C40' }}>
                  {fNumber(Math.abs(stats.maxLossTrade))}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Trade Activity */}
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 0.25, display: 'block', fontWeight: 600 }}
            >
              TRADE ACTIVITY
            </Typography>
            <Stack spacing={0.25}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption">24h Trades:</Typography>
                <Typography variant="caption">{fNumber(stats.trades24h)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption">7d Trades:</Typography>
                <Typography variant="caption">{fNumber(stats.trades7d)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption">2m Trades:</Typography>
                <Typography variant="caption">{fNumber(stats.trades2m)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption">Market Share:</Typography>
                <Typography variant="caption">{fPercent(stats.tradePercentage)}</Typography>
              </Box>
            </Stack>
          </Box>

          {/* Trading History */}
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 0.25, display: 'block', fontWeight: 600 }}
            >
              TRADING HISTORY
            </Typography>
            <Stack spacing={0.25}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption">First Trade:</Typography>
                <Typography variant="caption">
                  {new Date(stats.firstTradeDate).toLocaleDateString()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption">Last Trade:</Typography>
                <Typography variant="caption">
                  {new Date(stats.lastTradeDate).toLocaleDateString()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption">Updated:</Typography>
                <Typography variant="caption">
                  {new Date(stats.updatedAt).toLocaleDateString()}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Box>

        {/* Volume Chart */}
        <Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: 0.25, display: 'block', fontWeight: 600 }}
          >
            TRADING HISTORY
          </Typography>
          {stats.dailyVolumes && stats.dailyVolumes.length > 0 && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mb: 0.25, fontSize: '0.7rem' }}
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
