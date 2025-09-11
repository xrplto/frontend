import { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Box,
  Typography,
  Modal,
  Stack,
  Link,
  IconButton,
  Divider,
  Chip,
  Paper,
  useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';

// Icons
import LinkIcon from '@mui/icons-material/Link';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import StarIcon from '@mui/icons-material/Star';
import HistoryIcon from '@mui/icons-material/History';
import CloseIcon from '@mui/icons-material/Close';

// Utils
import { fNumber, fPercent } from 'src/utils/formatNumber';
import { format } from 'date-fns';

// Import lightweight chart component
const LightweightChart = dynamic(
  () => import('src/components/LightweightChart'),
  { ssr: false }
);

// Removed recharts - will use lightweight-charts instead
/*
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
*/

export const DailyVolumeChart = ({ data }) => {
  const theme = useTheme();
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

  const intervalOptions = [
    { value: '24h', label: '24H', color: theme.palette.error.main },
    { value: '7d', label: '7D', color: theme.palette.success.main },
    { value: '30d', label: '30D', color: theme.palette.primary.main },
    { value: 'all', label: 'ALL', color: theme.palette.info.main }
  ];

  return (
    <Box>
      {/* Enhanced Time Interval Selector */}
      <Box sx={{ display: 'flex', gap: 0.75, mb: 2, justifyContent: 'center' }}>
        {intervalOptions.map((option) => (
          <Box
            key={option.value}
            onClick={() => setInterval(option.value)}
            sx={{
              px: 2,
              py: 1,
              borderRadius: 2,
              cursor: 'pointer',
              position: 'relative',
              background:
                interval === option.value
                  ? `linear-gradient(135deg, ${alpha(option.color, 0.15)} 0%, ${alpha(
                      option.color,
                      0.08
                    )} 100%)`
                  : `linear-gradient(135deg, ${alpha(
                      theme.palette.background.paper,
                      0.8
                    )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
              backdropFilter: 'blur(10px)',
              border: '2px solid',
              borderColor:
                interval === option.value ? option.color : alpha(theme.palette.divider, 0.2),
              color: interval === option.value ? option.color : theme.palette.text.secondary,
              fontWeight: interval === option.value ? 700 : 500,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: interval === option.value ? 'scale(1.05)' : 'scale(1)',
              boxShadow:
                interval === option.value
                  ? `0 4px 16px ${alpha(option.color, 0.25)}`
                  : `0 2px 8px ${alpha(theme.palette.common.black, 0.04)}`,
              '&:hover': {
                transform: 'scale(1.05)',
                borderColor: option.color,
                color: option.color,
                background: `linear-gradient(135deg, ${alpha(option.color, 0.12)} 0%, ${alpha(
                  option.color,
                  0.06
                )} 100%)`,
                boxShadow: `0 4px 16px ${alpha(option.color, 0.2)}`
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 2,
                background:
                  interval === option.value
                    ? `linear-gradient(135deg, ${alpha(option.color, 0.08)} 0%, transparent 100%)`
                    : 'transparent',
                zIndex: -1
              }
            }}
          >
            <Typography
              variant="caption"
              sx={{
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                fontWeight: 'inherit',
                letterSpacing: '0.5px'
              }}
            >
              {option.label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Enhanced Chart Container */}
      <Box
        sx={{
          width: '100%',
          height: 260,
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.background.paper,
            0.8
          )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
          backdropFilter: 'blur(20px)',
          borderRadius: 2,
          padding: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.06)}`
        }}
      >
        {/* Recharts chart removed - TODO: Replace with lightweight-charts */}
        {false && (
        <ResponsiveContainer>
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            {/* Enhanced Grid */}
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={alpha(theme.palette.divider, 0.15)}
              strokeWidth={1}
            />

            {/* Enhanced X-Axis */}
            <XAxis
              dataKey="date"
              angle={-45}
              textAnchor="end"
              height={80}
              interval={calculateInterval()}
              tickFormatter={formatDate}
              tick={{
                fontSize: 10,
                fill: alpha(theme.palette.text.secondary, 0.8),
                fontWeight: 500
              }}
              axisLine={{ stroke: alpha(theme.palette.text.secondary, 0.8), strokeWidth: 1 }}
              tickLine={{ stroke: alpha(theme.palette.text.secondary, 0.8), strokeWidth: 1 }}
            />

            {/* Enhanced Y-Axes */}
            <YAxis
              yAxisId="left"
              tick={{
                fontSize: 10,
                fill: alpha(theme.palette.text.secondary, 0.8),
                fontWeight: 500
              }}
              tickFormatter={(value) => `${fNumber(value)}`}
              width={80}
              axisLine={{ stroke: alpha(theme.palette.text.secondary, 0.8), strokeWidth: 1 }}
              tickLine={{ stroke: alpha(theme.palette.text.secondary, 0.8), strokeWidth: 1 }}
              label={{
                value: 'Volume (XRP)',
                angle: -90,
                position: 'insideLeft',
                offset: 10,
                style: {
                  fontSize: '11px',
                  fill: alpha(theme.palette.text.secondary, 0.9),
                  fontWeight: 600
                }
              }}
            />

            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{
                fontSize: 10,
                fill: alpha(theme.palette.text.secondary, 0.8),
                fontWeight: 500
              }}
              tickFormatter={(value) => `${fNumber(value)}`}
              width={80}
              axisLine={{ stroke: alpha(theme.palette.text.secondary, 0.8), strokeWidth: 1 }}
              tickLine={{ stroke: alpha(theme.palette.text.secondary, 0.8), strokeWidth: 1 }}
              label={{
                value: 'Profit (XRP)',
                angle: 90,
                position: 'insideRight',
                offset: 10,
                style: {
                  fontSize: '11px',
                  fill: alpha(theme.palette.text.secondary, 0.9),
                  fontWeight: 600
                }
              }}
            />

            <YAxis
              yAxisId="price"
              orientation="right"
              tick={{
                fontSize: 10,
                fill: alpha(theme.palette.text.secondary, 0.8),
                fontWeight: 500
              }}
              tickFormatter={(value) => `${fNumber(value, 6)}`}
              width={90}
              axisLine={{ stroke: alpha(theme.palette.text.secondary, 0.8), strokeWidth: 1 }}
              tickLine={{ stroke: alpha(theme.palette.text.secondary, 0.8), strokeWidth: 1 }}
              label={{
                value: 'Price (XRP)',
                angle: 90,
                position: 'insideRight',
                offset: 25,
                style: {
                  fontSize: '11px',
                  fill: alpha(theme.palette.text.secondary, 0.9),
                  fontWeight: 600
                }
              }}
            />

            {/* Enhanced Tooltip */}
            <RechartsTooltip
              contentStyle={{
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.background.paper,
                  0.95
                )} 0%, ${alpha(theme.palette.background.paper, 0.85)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                borderRadius: '12px',
                fontSize: '12px',
                padding: '16px',
                boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, 0.15)}`,
                backdropFilter: 'blur(20px)',
                color: theme.palette.text.primary
              }}
              labelStyle={{
                color: theme.palette.text.primary,
                fontWeight: 600,
                marginBottom: '8px',
                fontSize: '13px'
              }}
              formatter={(value, name, props) => {
                const colors = {
                  Buy: theme.palette.success.main,
                  Sell: theme.palette.error.main,
                  Profit: value >= 0 ? theme.palette.success.main : theme.palette.error.main,
                  cumulativeProfit: theme.palette.info.main,
                  avgPrice: theme.palette.primary.main
                };

                return [
                  <span
                    key={`${name}-value`}
                    style={{
                      color: colors[name] || theme.palette.text.primary,
                      fontWeight: 600,
                      fontSize: '12px'
                    }}
                  >
                    {name === 'avgPrice' ? fNumber(value, 6) : fNumber(value)} XRP
                  </span>,
                  <span
                    key={`${name}-label`}
                    style={{
                      color: colors[name] || theme.palette.text.primary,
                      fontWeight: 500,
                      fontSize: '11px'
                    }}
                  >
                    {name === 'cumulativeProfit' ? 'Cumulative P&L' : name}
                  </span>
                ];
              }}
              labelFormatter={(label) => (
                <div
                  style={{
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    paddingBottom: '4px',
                    marginBottom: '8px',
                    color: theme.palette.text.primary
                  }}
                >
                  📅{' '}
                  {new Date(label).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              )}
            />

            {/* Enhanced Legend */}
            <Legend
              wrapperStyle={{
                fontSize: '11px',
                paddingTop: '20px',
                color: theme.palette.text.primary
              }}
              iconType="rect"
              payload={[
                {
                  value: 'Buy Volume',
                  type: 'rect',
                  color: theme.palette.success.main,
                  payload: { strokeDasharray: '0' }
                },
                {
                  value: 'Sell Volume',
                  type: 'rect',
                  color: theme.palette.error.main,
                  payload: { strokeDasharray: '0' }
                },
                {
                  value: 'Daily P&L',
                  type: 'rect',
                  color: theme.palette.warning.main,
                  payload: { strokeDasharray: '0' }
                },
                {
                  value: 'Cumulative P&L',
                  type: 'line',
                  color: theme.palette.info.main,
                  payload: { strokeDasharray: '5 5' }
                },
                {
                  value: 'Avg Price',
                  type: 'line',
                  color: theme.palette.primary.main,
                  payload: { strokeDasharray: '3 3' }
                }
              ]}
            />

            {/* Enhanced Bars with Gradients */}
            <defs>
              <linearGradient id="buyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.palette.success.main} stopOpacity={0.8} />
                <stop offset="100%" stopColor={theme.palette.success.main} stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id="sellGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.palette.error.main} stopOpacity={0.8} />
                <stop offset="100%" stopColor={theme.palette.error.main} stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.palette.warning.main} stopOpacity={0.8} />
                <stop offset="100%" stopColor={theme.palette.warning.main} stopOpacity={0.3} />
              </linearGradient>
            </defs>

            <Bar
              dataKey="Buy"
              fill="url(#buyGradient)"
              stackId="stack"
              yAxisId="left"
              radius={[2, 2, 0, 0]}
            />
            <Bar
              dataKey="Sell"
              fill="url(#sellGradient)"
              stackId="stack"
              yAxisId="left"
              radius={[2, 2, 0, 0]}
            />
            <Bar
              dataKey="Profit"
              fill="url(#profitGradient)"
              yAxisId="right"
              opacity={0.7}
              radius={[2, 2, 2, 2]}
            />

            {/* Enhanced Lines */}
            <Line
              type="monotone"
              dataKey="cumulativeProfit"
              stroke={theme.palette.info.main}
              strokeWidth={3}
              dot={{
                fill: theme.palette.info.main,
                strokeWidth: 2,
                stroke: theme.palette.background.paper,
                r: 4
              }}
              activeDot={{
                r: 6,
                fill: theme.palette.info.main,
                stroke: theme.palette.background.paper,
                strokeWidth: 2,
                filter: `drop-shadow(0 2px 4px ${alpha(theme.palette.info.main, 0.3)})`
              }}
              yAxisId="right"
            />
            <Line
              type="monotone"
              dataKey="avgPrice"
              stroke={theme.palette.primary.main}
              strokeWidth={2}
              strokeDasharray="3 3"
              dot={{
                fill: theme.palette.primary.main,
                strokeWidth: 2,
                stroke: theme.palette.background.paper,
                r: 3
              }}
              activeDot={{
                r: 5,
                fill: theme.palette.primary.main,
                stroke: theme.palette.background.paper,
                strokeWidth: 2,
                filter: `drop-shadow(0 2px 4px ${alpha(theme.palette.primary.main, 0.3)})`
              }}
              yAxisId="price"
            />
          </ComposedChart>
        </ResponsiveContainer>
        )}
        <LightweightChart
          data={chartData}
          height={400}
          series={[
            {
              dataKey: "cumulativeProfit",
              name: "Cumulative Profit",
              color: theme.palette.success.main,
              lineWidth: 3,
              visible: true
            }
          ]}
          showLegend={true}
        />
      </Box>
    </Box>
  );
};

export const StatsModal = ({ open, onClose, account, traderStats }) => {
  const theme = useTheme();

  if (!traderStats || !traderStats[account]) return null;
  const stats = traderStats[account];

  const formatDuration = (seconds) => {
    if (seconds === 0 || seconds === null || seconds === undefined) return '-';
    const hours = Math.floor(seconds / 3600);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);

    if (months > 0) {
      return `${months}m`;
    } else if (days > 0) {
      return `${days}d`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      const minutes = Math.floor((seconds % 3600) / 60);
      if (minutes > 0) {
        return `${minutes}min`;
      } else {
        return `<1min`;
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const StatCard = ({ title, icon, children, gradient = false }) => (
    <Paper
      elevation={2}
      sx={{
        p: 1.5,
        borderRadius: 2,
        background: gradient
          ? `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.08)} 0%, ${alpha(
              theme.palette.success.main,
              0.03
            )} 100%)`
          : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(
              theme.palette.background.paper,
              0.7
            )} 100%)`,
        backdropFilter: 'blur(20px)',
        border: '1px solid',
        borderColor: alpha(theme.palette.divider, 0.1),
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.12)}`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
        }
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.75} mb={1.5}>
        {icon}
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            color: theme.palette.text.primary,
            textTransform: 'uppercase',
            letterSpacing: '0.3px',
            fontSize: '0.75rem'
          }}
        >
          {title}
        </Typography>
      </Stack>
      <Stack spacing={1}>{children}</Stack>
    </Paper>
  );

  const StatRow = ({ label, value, color, isPercentage = false, isCurrency = true }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 600,
          fontSize: '0.8rem',
          color: color || theme.palette.text.primary
        }}
      >
        {isCurrency ? fNumber(value) : isPercentage ? fPercent(value) : value}
      </Typography>
    </Box>
  );

  const ProfitChip = ({ value, label }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
        {label}
      </Typography>
      <Chip
        label={fNumber(value)}
        size="small"
        icon={
          value >= 0 ? (
            <TrendingUpIcon sx={{ fontSize: 14 }} />
          ) : (
            <TrendingDownIcon sx={{ fontSize: 14 }} />
          )
        }
        sx={{
          bgcolor:
            value >= 0
              ? alpha(theme.palette.success.main, 0.1)
              : alpha(theme.palette.error.main, 0.1),
          color: value >= 0 ? theme.palette.success.main : theme.palette.error.main,
          fontWeight: 600,
          height: 22,
          fontSize: '0.7rem',
          border: `1px solid ${alpha(
            value >= 0 ? theme.palette.success.main : theme.palette.error.main,
            0.2
          )}`,
          '& .MuiChip-icon': {
            color: value >= 0 ? theme.palette.success.main : theme.palette.error.main
          }
        }}
      />
    </Box>
  );

  const winRate =
    stats.profitableTrades + stats.losingTrades > 0
      ? (stats.profitableTrades / (stats.profitableTrades + stats.losingTrades)) * 100
      : 0;

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
          width: '95%',
          maxWidth: 1200,
          bgcolor: theme.palette.background.paper,
          boxShadow: `0 24px 48px ${alpha(theme.palette.common.black, 0.2)}`,
          borderRadius: 3,
          maxHeight: '95vh',
          overflow: 'auto',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}
      >
        {/* Compact Header */}
        <Box
          sx={{
            p: 2,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.info.main} 100%)`,
            color: 'white',
            borderRadius: '12px 12px 0 0',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(135deg, ${alpha(
                'rgb(255,255,255)',
                0.1
              )} 0%, transparent 50%, ${alpha('rgb(255,255,255)', 0.05)} 100%)`,
              pointerEvents: 'none'
            }
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.25 }}>
                Trader Analytics
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  opacity: 0.9,
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  wordBreak: 'break-all'
                }}
              >
                {account}
              </Typography>
            </Box>
            <Stack direction="row" spacing={0.5}>
              <Link
                underline="none"
                color="inherit"
                target="_blank"
                href={`https://bithomp.com/explorer/${account}`}
                rel="noreferrer noopener nofollow"
              >
                <IconButton
                  size="small"
                  sx={{
                    color: 'white',
                    bgcolor: alpha('rgb(255,255,255)', 0.15),
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${alpha('rgb(255,255,255)', 0.2)}`,
                    '&:hover': {
                      bgcolor: alpha('rgb(255,255,255)', 0.25),
                      transform: 'scale(1.05)'
                    }
                  }}
                >
                  <LinkIcon fontSize="small" />
                </IconButton>
              </Link>
              <IconButton
                onClick={onClose}
                size="small"
                sx={{
                  color: 'white',
                  bgcolor: alpha('rgb(255,255,255)', 0.15),
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha('rgb(255,255,255)', 0.2)}`,
                  '&:hover': {
                    bgcolor: alpha('rgb(255,255,255)', 0.25),
                    transform: 'scale(1.05)'
                  }
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>
        </Box>

        <Box sx={{ p: 2 }}>
          {/* Compact KPI Cards */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 1.5,
              mb: 2
            }}
          >
            <Paper
              elevation={2}
              sx={{
                p: 1.5,
                borderRadius: 2,
                background:
                  stats.roi >= 0
                    ? `linear-gradient(135deg, ${alpha(
                        theme.palette.success.main,
                        0.15
                      )} 0%, ${alpha(theme.palette.success.main, 0.08)} 100%)`
                    : `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.15)} 0%, ${alpha(
                        theme.palette.error.main,
                        0.08
                      )} 100%)`,
                backdropFilter: 'blur(20px)',
                border: '1px solid',
                borderColor:
                  stats.roi >= 0
                    ? alpha(theme.palette.success.main, 0.2)
                    : alpha(theme.palette.error.main, 0.2),
                boxShadow: `0 8px 32px ${alpha(
                  stats.roi >= 0 ? theme.palette.success.main : theme.palette.error.main,
                  0.12
                )}`
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 600, fontSize: '0.65rem' }}
              >
                ROI
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.5} mt={0.5}>
                {stats.roi >= 0 ? (
                  <TrendingUpIcon sx={{ color: theme.palette.success.main, fontSize: 18 }} />
                ) : (
                  <TrendingDownIcon sx={{ color: theme.palette.error.main, fontSize: 18 }} />
                )}
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: stats.roi >= 0 ? theme.palette.success.main : theme.palette.error.main,
                    fontSize: '1.1rem'
                  }}
                >
                  {fPercent(stats.roi)}
                </Typography>
              </Stack>
            </Paper>

            <Paper
              elevation={2}
              sx={{
                p: 1.5,
                borderRadius: 2,
                background:
                  winRate >= 50
                    ? `linear-gradient(135deg, ${alpha(
                        theme.palette.success.main,
                        0.15
                      )} 0%, ${alpha(theme.palette.success.main, 0.08)} 100%)`
                    : `linear-gradient(135deg, ${alpha(
                        theme.palette.warning.main,
                        0.15
                      )} 0%, ${alpha(theme.palette.warning.main, 0.08)} 100%)`,
                backdropFilter: 'blur(20px)',
                border: '1px solid',
                borderColor:
                  winRate >= 50
                    ? alpha(theme.palette.success.main, 0.2)
                    : alpha(theme.palette.warning.main, 0.2),
                boxShadow: `0 8px 32px ${alpha(
                  winRate >= 50 ? theme.palette.success.main : theme.palette.warning.main,
                  0.12
                )}`
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 600, fontSize: '0.65rem' }}
              >
                WIN RATE
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.5} mt={0.5}>
                <StarIcon
                  sx={{
                    color: winRate >= 50 ? theme.palette.success.main : theme.palette.warning.main,
                    fontSize: 18
                  }}
                />
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: winRate >= 50 ? theme.palette.success.main : theme.palette.warning.main,
                    fontSize: '1.1rem'
                  }}
                >
                  {winRate > 0 ? winRate.toFixed(1) + '%' : '-'}
                </Typography>
              </Stack>
            </Paper>

            <Paper
              elevation={2}
              sx={{
                p: 1.5,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.primary.main,
                  0.15
                )} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
                backdropFilter: 'blur(20px)',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.12)}`
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 600, fontSize: '0.65rem' }}
              >
                VOLUME
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.5} mt={0.5}>
                <ShowChartIcon sx={{ color: theme.palette.primary.main, fontSize: 18 }} />
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: theme.palette.primary.main, fontSize: '1.1rem' }}
                >
                  {fNumber(stats.totalVolume)}
                </Typography>
              </Stack>
            </Paper>

            <Paper
              elevation={2}
              sx={{
                p: 1.5,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.info.main,
                  0.15
                )} 0%, ${alpha(theme.palette.info.main, 0.08)} 100%)`,
                backdropFilter: 'blur(20px)',
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                boxShadow: `0 8px 32px ${alpha(theme.palette.info.main, 0.12)}`
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 600, fontSize: '0.65rem' }}
              >
                MARKET SHARE
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.5} mt={0.5}>
                <AssessmentIcon sx={{ color: theme.palette.info.main, fontSize: 18 }} />
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: theme.palette.info.main, fontSize: '1.1rem' }}
                >
                  {fPercent(stats.tradePercentage)}
                </Typography>
              </Stack>
            </Paper>
          </Box>

          {/* Compact Statistics Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 1.5,
              mb: 2
            }}
          >
            <StatCard
              title="Trade Summary"
              icon={<AssessmentIcon sx={{ color: theme.palette.primary.main, fontSize: 16 }} />}
            >
              <StatRow label="Total Trades" value={stats.totalTrades} isCurrency={false} />
              <StatRow
                label="Profitable"
                value={stats.profitableTrades}
                color={theme.palette.success.main}
                isCurrency={false}
              />
              <StatRow
                label="Losing"
                value={stats.losingTrades}
                color={theme.palette.error.main}
                isCurrency={false}
              />
              <StatRow
                label="Avg Hold"
                value={formatDuration(stats.avgHoldingTime)}
                isCurrency={false}
              />
            </StatCard>

            <StatCard
              title="P&L Analysis"
              icon={<TrendingUpIcon sx={{ color: theme.palette.success.main, fontSize: 16 }} />}
            >
              <ProfitChip value={stats.profit24h} label="24h" />
              <ProfitChip value={stats.profit7d} label="7d" />
              <ProfitChip value={stats.profit1m || 0} label="1m" />
              <ProfitChip value={stats.profit2m || 0} label="2m" />
              <ProfitChip value={stats.profit3m || 0} label="3m" />
            </StatCard>

            <StatCard
              title="Volume"
              icon={<ShowChartIcon sx={{ color: theme.palette.info.main, fontSize: 16 }} />}
            >
              <StatRow label="24h" value={stats.volume24h} />
              <StatRow label="7d" value={stats.volume7d} />
              <StatRow label="1m" value={stats.volume1m || 0} />
              <StatRow label="2m" value={stats.volume2m || 0} />
              <StatRow label="Total" value={stats.totalVolume} />
            </StatCard>

            <StatCard
              title="Activity"
              icon={<TimelineIcon sx={{ color: theme.palette.warning.main, fontSize: 16 }} />}
            >
              <StatRow label="24h Trades" value={stats.trades24h} isCurrency={false} />
              <StatRow label="7d Trades" value={stats.trades7d} isCurrency={false} />
              <StatRow label="1m Trades" value={stats.trades1m || 0} isCurrency={false} />
              <StatRow label="2m Trades" value={stats.trades2m || 0} isCurrency={false} />
              <StatRow label="Total" value={stats.totalTrades} isCurrency={false} />
            </StatCard>

            <StatCard
              title="Extremes"
              icon={<StarIcon sx={{ color: theme.palette.warning.main, fontSize: 16 }} />}
            >
              <StatRow
                label="Best Trade"
                value={stats.maxProfitTrade}
                color={theme.palette.success.main}
              />
              <StatRow
                label="Worst Trade"
                value={Math.abs(stats.maxLossTrade)}
                color={theme.palette.error.main}
              />
              <StatRow
                label="Buy Volume"
                value={stats.buyVolume}
                color={theme.palette.success.main}
              />
              <StatRow
                label="Sell Volume"
                value={stats.sellVolume}
                color={theme.palette.error.main}
              />
            </StatCard>

            <StatCard
              title="Timeline"
              icon={<HistoryIcon sx={{ color: theme.palette.text.secondary, fontSize: 16 }} />}
            >
              <StatRow
                label="First Trade"
                value={formatDate(stats.firstTradeDate)}
                isCurrency={false}
              />
              <StatRow
                label="Last Trade"
                value={formatDate(stats.lastTradeDate)}
                isCurrency={false}
              />
              <StatRow label="Updated" value={formatDate(stats.updatedAt)} isCurrency={false} />
            </StatCard>
          </Box>

          {/* Compact Chart */}
          <Paper
            elevation={2}
            sx={{
              p: 2,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.background.paper,
                0.9
              )} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}`
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
              <ShowChartIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, color: theme.palette.text.primary }}
              >
                Trading History
              </Typography>
            </Stack>
            {stats.dailyVolumes && stats.dailyVolumes.length > 0 && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 1.5, fontSize: '0.75rem', display: 'block' }}
              >
                📅 {formatDate(stats.firstTradeDate)} → {formatDate(stats.lastTradeDate)}
              </Typography>
            )}
            <DailyVolumeChart data={stats.dailyVolumes || []} />
          </Paper>
        </Box>
      </Box>
    </Modal>
  );
};
