import React, { memo, useState } from 'react';
import {
  Box,
  Typography,
  Modal,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  useTheme,
  styled,
  alpha,
  CircularProgress,
  Tooltip
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { visuallyHidden } from '@mui/utils';

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

// Utils
import { fNumber, fPercent } from 'src/utils/formatNumber';
import { formatDistanceToNowStrict } from 'date-fns';

// Memoized DailyVolumeChart component
export const DailyVolumeChart = memo(({ data }) => {
  const theme = useTheme();

  const formatYAxis = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const formatTooltipValue = (value) => {
    return fNumber(value);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            backgroundColor: alpha(theme.palette.background.paper, 0.95),
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            borderRadius: 1,
            p: 1.5,
            boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.1)}`
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            {label}
          </Typography>
          {payload.map((entry, index) => (
            <Typography
              key={index}
              variant="body2"
              sx={{
                color: entry.color,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: entry.color
                }}
              />
              {entry.name}: {formatTooltipValue(entry.value)}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5
        }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={alpha(theme.palette.divider, 0.1)}
          vertical={false}
        />
        <XAxis
          dataKey="date"
          stroke={theme.palette.text.secondary}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: alpha(theme.palette.divider, 0.2) }}
        />
        <YAxis
          stroke={theme.palette.text.secondary}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatYAxis}
        />
        <RechartsTooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{
            paddingTop: '20px',
            fontSize: '12px'
          }}
          iconType="circle"
        />
        <Bar
          dataKey="buyVolume"
          name="Buy Volume"
          fill={theme.palette.success.main}
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
        />
        <Bar
          dataKey="sellVolume"
          name="Sell Volume"
          fill={theme.palette.error.main}
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
        />
      </BarChart>
    </ResponsiveContainer>
  );
});

DailyVolumeChart.displayName = 'DailyVolumeChart';

// Styled components for StatsModal
const ModalBox = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[24],
  padding: theme.spacing(4),
  maxWidth: '90vw',
  maxHeight: '90vh',
  overflow: 'auto',
  width: 800,
  '&::-webkit-scrollbar': {
    width: '8px',
    height: '8px'
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: alpha(theme.palette.divider, 0.1),
    borderRadius: '4px'
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: alpha(theme.palette.primary.main, 0.2),
    borderRadius: '4px',
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.3)
    }
  }
}));

const StatCard = styled(Box)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.background.default, 0.5),
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: alpha(theme.palette.background.default, 0.8),
    borderColor: alpha(theme.palette.primary.main, 0.2)
  }
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  '&:first-of-type': {
    paddingLeft: 0
  },
  '&:last-of-type': {
    paddingRight: 0
  }
}));

// Memoized StatsModal component
export const StatsModal = memo(({ open, onClose, account, traderStats }) => {
  const theme = useTheme();

  if (!traderStats || !open) return null;

  const { stats, history } = traderStats;

  // Prepare data for daily volume chart
  const dailyVolumeData = history?.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    buyVolume: item.buy_volume || 0,
    sellVolume: item.sell_volume || 0
  })) || [];

  const recentTrades = history?.slice(0, 10) || [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="trader-stats-modal"
      aria-describedby="trader-statistics-and-history"
    >
      <ModalBox>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
            Trader Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {account}
          </Typography>
        </Box>

        {/* Summary Stats */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 4 }}>
          <StatCard>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Total Trades
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {fNumber(stats?.trade_count || 0)}
            </Typography>
          </StatCard>
          <StatCard>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Total Volume
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              ${fNumber(stats?.total_volume || 0)}
            </Typography>
          </StatCard>
          <StatCard>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Win Rate
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600,
                color: stats?.win_rate > 50 ? theme.palette.success.main : theme.palette.error.main
              }}
            >
              {fPercent(stats?.win_rate || 0)}
            </Typography>
          </StatCard>
          <StatCard>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Avg Trade Size
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              ${fNumber(stats?.avg_trade_size || 0)}
            </Typography>
          </StatCard>
        </Box>

        {/* Daily Volume Chart */}
        {dailyVolumeData.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Daily Trading Volume (Last 30 Days)
            </Typography>
            <DailyVolumeChart data={dailyVolumeData} />
          </Box>
        )}

        {/* Recent Trades */}
        {recentTrades.length > 0 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Recent Trades
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <StyledTableCell>Date</StyledTableCell>
                  <StyledTableCell>Type</StyledTableCell>
                  <StyledTableCell align="right">Amount</StyledTableCell>
                  <StyledTableCell align="right">Price</StyledTableCell>
                  <StyledTableCell align="right">Value</StyledTableCell>
                  <StyledTableCell align="right">P&L</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentTrades.map((trade, index) => (
                  <TableRow key={index} hover>
                    <StyledTableCell>
                      {formatDistanceToNowStrict(new Date(trade.date))} ago
                    </StyledTableCell>
                    <StyledTableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          color: trade.type === 'buy' 
                            ? theme.palette.success.main 
                            : theme.palette.error.main,
                          fontWeight: 500
                        }}
                      >
                        {trade.type.toUpperCase()}
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      {fNumber(trade.amount)}
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      ${trade.price}
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      ${fNumber(trade.value)}
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      {trade.pnl && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: trade.pnl > 0 
                              ? theme.palette.success.main 
                              : theme.palette.error.main,
                            fontWeight: 500
                          }}
                        >
                          {trade.pnl > 0 ? '+' : ''}{fPercent(trade.pnl)}
                        </Typography>
                      )}
                    </StyledTableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}

        {/* Loading State */}
        {!stats && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <CircularProgress />
          </Box>
        )}
      </ModalBox>
    </Modal>
  );
});

StatsModal.displayName = 'StatsModal';

// Memoized CopyButton component
export const CopyButton = memo(({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'} placement="top">
      <IconButton
        size="small"
        onClick={handleCopy}
        sx={{
          ml: 0.5,
          p: 0.5,
          color: 'text.secondary',
          '&:hover': {
            color: 'primary.main',
            backgroundColor: alpha('#000', 0.04)
          }
        }}
      >
        <ContentCopyIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Tooltip>
  );
});

CopyButton.displayName = 'CopyButton';