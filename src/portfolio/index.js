import React, { useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  useTheme,
  Box,
  Container,
  useMediaQuery,
  Stack,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Modal,
  TablePagination
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Verified as VerifiedIcon } from '@mui/icons-material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import styled from '@emotion/styled';
import { getHashIcon } from 'src/utils/extra';
import TrustLines from './TrustLines';
import { TabContext, TabPanel } from '../components/TabComponents';
import NFTPortfolio from './NFTPortfolio';
import DeFiHistory from './DeFi';
import { alpha } from '@mui/material/styles';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import Ranks from './Ranks';
import LightweightChart from '../components/LightweightChart';
// Temporary inline rank colors (previously from Chatbox/RankStyles)
const activeRankColors = {
  verified: '#1DA1F2'
};
const rankGlowEffect = {};
import axios from 'axios';
import { memoryMonitor, performanceTracker, TokenDetailProfiler, useTokenDetailPerformance } from '../performance/setup';

// Get base URL from environment
const BASE_URL = process.env.API_URL;

// Configure axios defaults with timeout
const axiosInstance = axios.create({
  timeout: 30000 // 30 second timeout for analytics calls
});

// Chart libraries loaded on-demand via LightweightChart component

// Format holding time from seconds to human readable format
const formatHoldingTime = (seconds) => {
  if (!seconds || seconds === 0) return '0m';

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    if (hours > 0) {
      return `${days}d ${hours}h`;
    }
    return `${days}d`;
  }

  if (hours > 0) {
    if (minutes > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${hours}h`;
  }

  return `${minutes}m`;
};

// Format large numbers with appropriate units
const formatNumber = (value, type = 'number') => {
  if (type === 'roi' || type === 'percentage') {
    return `${value.toFixed(2)}%`;
  }

  if (type === 'volume' || type === 'currency') {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(0);
  }

  if (type === 'trades') {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  }

  return value.toLocaleString();
};

// Calculate accurate metrics from historical data for given interval
const calculateIntervalMetrics = (traderStats, interval) => {
  if (!traderStats) return null;

  const now = new Date();
  const intervalMs = {
    '24h': 1 * 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '1m': 30 * 24 * 60 * 60 * 1000,
    '3m': 90 * 24 * 60 * 60 * 1000
  };

  const cutoffTime = new Date(now.getTime() - intervalMs[interval]);

  // Calculate volume from volumeHistory
  let intervalVolume = 0;
  if (traderStats.volumeHistory) {
    intervalVolume = traderStats.volumeHistory
      .filter((item) => new Date(item.date) >= cutoffTime)
      .reduce((sum, item) => sum + (item.h24Volume || 0), 0);
  }

  // Calculate trades from tradeHistory
  let intervalTrades = 0;
  if (traderStats.tradeHistory) {
    intervalTrades = traderStats.tradeHistory
      .filter((item) => new Date(item.date) >= cutoffTime)
      .reduce((sum, item) => sum + (item.trades || 0), 0);
  }

  // Calculate ROI from roiHistory (average of daily ROIs in the period)
  let intervalROI = 0;
  if (traderStats.roiHistory) {
    const roiData = traderStats.roiHistory
      .filter((item) => new Date(item.date) >= cutoffTime)
      .filter(
        (item) =>
          (item.dailyRoi !== null && item.dailyRoi !== undefined) ||
          (item.dailyroi !== null && item.dailyroi !== undefined)
      );

    if (roiData.length > 0) {
      intervalROI =
        roiData.reduce((sum, item) => sum + (item.dailyRoi || item.dailyroi || 0), 0) /
        roiData.length;
    }
  }

  // Calculate profit from interval ROI and volume
  const intervalProfit = intervalVolume > 0 ? (intervalVolume * intervalROI) / 100 : 0;

  // Count unique tokens traded in the interval
  let intervalActiveTokens = 0;
  if (traderStats.volumeHistory) {
    const tradedTokensSet = new Set();
    traderStats.volumeHistory
      .filter((item) => new Date(item.date) >= cutoffTime)
      .forEach((item) => {
        if (item.tradedTokens && Array.isArray(item.tradedTokens)) {
          item.tradedTokens.forEach((token) =>
            tradedTokensSet.add(token.tokenId || token.currency)
          );
        }
      });
    intervalActiveTokens = tradedTokensSet.size;
  }

  return {
    volume: intervalVolume,
    trades: intervalTrades,
    roi: intervalROI,
    profit: intervalProfit,
    activeTokens: intervalActiveTokens
  };
};

const OverviewWrapper = styled(Box)(
  ({ theme }) => `
    flex: 1;
    overflow-x: hidden;
    overflow-y: auto;
    min-height: 100vh;
    background: transparent;
`
);

const StyledModal = styled(Modal)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(1.5),
  '& .MuiBackdrop-root': {
    backdropFilter: 'blur(5px)',
    backgroundColor: alpha(theme.palette.common.black, 0.5)
  }
}));

const ModalContent = styled(Paper)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  maxWidth: 1000,
  maxHeight: '90vh',
  overflow: 'auto',
  padding: theme.spacing(2),
  background:
    theme.palette.mode === 'dark'
      ? alpha(theme.palette.background.paper, 0.95)
      : theme.palette.background.paper,
  backdropFilter: 'blur(20px)',
  borderRadius: '24px',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: theme.shadows[24]
}));

// Styled container for consistent glass-morphism effect
const OuterBorderContainer = styled(Box)(({ theme }) => ({
  background:
    theme.palette.mode === 'dark'
      ? alpha(theme.palette.background.paper, 0.6)
      : alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  borderRadius: '16px',
  border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
  padding: theme.spacing(1.5),
  boxShadow:
    theme.palette.mode === 'dark'
      ? `0 8px 32px ${alpha(theme.palette.common.black, 0.3)}`
      : `0 4px 20px ${alpha(theme.palette.common.black, 0.08)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow:
      theme.palette.mode === 'dark'
        ? `0 12px 40px ${alpha(theme.palette.common.black, 0.4)}`
        : `0 8px 30px ${alpha(theme.palette.common.black, 0.12)}`,
    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
  }
}));

// Component extracted to avoid nested component definition
const LightweightChartComponent = React.memo(({ chartData, isMobile, theme }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const isDark = theme.palette.mode === 'dark';

  useEffect(() => {

    if (
      !chartContainerRef.current ||
      !chartData ||
      !chartData.series ||
      chartData.series.length === 0
    ) {
      return;
    }

    const initChart = async () => {
      // Load chart libraries first
      await loadChartLibraries();

      if (!createChart) {
        return;
      }

      // Check if container still exists after async operation
      if (!chartContainerRef.current) {
        return;
      }

      // Clean up existing chart
      if (chartRef.current) {
        try {
          chartRef.current.remove();
        } catch (e) {
          // Error removing chart
        }
        chartRef.current = null;
      }

      // Create new chart
      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight || (isMobile ? 300 : 400),
        layout: {
          background: { type: 'solid', color: 'transparent' },
          textColor: theme.palette.text.primary,
          fontSize: 11
        },
        grid: {
          vertLines: {
            color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
          },
          horzLines: {
            color: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'
          }
        },
        crosshair: {
          mode: 0,
          vertLine: {
            color: theme.palette.primary.main,
            width: 1,
            labelBackgroundColor: theme.palette.primary.main
          },
          horzLine: {
            color: theme.palette.primary.main,
            width: 1,
            labelBackgroundColor: theme.palette.primary.main
          }
        },
        rightPriceScale: {
          borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
          scaleMargins: { top: 0.1, bottom: 0.2 }
        },
        timeScale: {
          borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
          timeVisible: true,
          secondsVisible: false
        }
      });

      chartRef.current = chart;

      // Add series
      const seriesRefs = [];
      chartData.series.forEach((serie, index) => {

        let series;
        if (serie.type === 'column') {
          series = chart.addSeries(HistogramSeries, {
            color: index === 0 ? theme.palette.primary.main : alpha(theme.palette.info.main, 0.6),
            priceFormat: {
              type: 'volume',
              precision: 0,
              minMove: 1
            }
          });
        } else {
          series = chart.addSeries(LineSeries, {
            color: index === 0 ? theme.palette.primary.main : theme.palette.success.main,
            lineWidth: 2,
            crosshairMarkerVisible: true,
            crosshairMarkerRadius: 4,
            priceFormat: {
              type: 'price',
              precision: 2,
              minMove: 0.01
            }
          });
        }

        // Convert data to lightweight-charts format and sort by time
        const allDataPoints = serie.data
          .map((value, idx) => {
            const dateStr = chartData.xaxis.categories[idx];
            // Parse date more carefully
            const date = new Date(dateStr);
            const timestamp = date.getTime() / 1000;

            // Validate timestamp
            if (isNaN(timestamp) || !isFinite(timestamp)) {
              return null;
            }

            const parsedValue = parseFloat(value);
            return {
              time: Math.floor(timestamp),
              value: isNaN(parsedValue) ? null : parsedValue,
              originalIndex: idx
            };
          })
          .filter((item) => item !== null) // Remove invalid entries
          .sort((a, b) => a.time - b.time) // Sort in ascending order by time
          .filter((item, index, array) => {
            // Remove duplicates - keep only the first occurrence of each timestamp
            return index === 0 || item.time !== array[index - 1].time;
          });

        // Fill gaps with appropriate values for trading data
        const data = allDataPoints.map((item, idx) => {
          if (item.value !== null) {
            return {
              time: item.time,
              value: item.value
            };
          }

          // For trading data, missing values should typically be 0 (no trading activity)
          // Only interpolate for cumulative metrics that should maintain their value
          let fillValue = 0;

          // Check if this is a cumulative metric (should maintain previous value)
          const serieName = serie.name.toLowerCase();
          const isCumulative = serieName.includes('cumulative');

          if (isCumulative) {
            // For cumulative metrics, carry forward the last known value
            let prevValue = null;
            for (let i = idx - 1; i >= 0; i--) {
              if (allDataPoints[i].value !== null) {
                prevValue = allDataPoints[i].value;
                break;
              }
            }
            fillValue = prevValue !== null ? prevValue : 0;
          } else {
            // For daily metrics (ROI, Volume, Trades), missing data means 0 activity
            fillValue = 0;
          }

          return {
            time: item.time,
            value: fillValue
          };
        });


        if (data.length > 0) {
          series.setData(data);
          series.priceScale().applyOptions({
            scaleMargins: {
              top: 0.1,
              bottom: 0.2
            }
          });
        }
        seriesRefs.push(series);
      });

      // Add tooltip
      const toolTip = document.createElement('div');
      toolTip.style = `position: absolute; display: none; padding: 8px; font-size: 12px; z-index: 1000; top: 12px; left: 12px; pointer-events: none; border-radius: 4px; background: ${isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.95)'}; color: ${theme.palette.text.primary}; border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`;
      chartContainerRef.current.appendChild(toolTip);

      chart.subscribeCrosshairMove((param) => {
        if (!param.time || param.point.x < 0 || param.point.y < 0) {
          toolTip.style.display = 'none';
          return;
        }

        const dateStr = new Date(param.time * 1000).toLocaleDateString();
        let html = `<div style="font-weight: 500; margin-bottom: 4px">${dateStr}</div>`;

        seriesRefs.forEach((series, idx) => {
          const data = param.seriesData.get(series);
          if (data) {
            const seriesName = chartData.series[idx].name;
            const value = data.value;
            let formattedValue = value.toFixed(2);
            if (seriesName.includes('ROI')) formattedValue += '%';
            else if (seriesName.includes('Volume'))
              formattedValue = value.toLocaleString() + ' XRP';
            else if (seriesName.includes('Trades')) formattedValue = value.toLocaleString();

            html += `<div>${seriesName}: ${formattedValue}</div>`;
          }
        });

        toolTip.innerHTML = html;
        toolTip.style.display = 'block';
        toolTip.style.left =
          Math.min(param.point.x + 10, chartContainerRef.current.clientWidth - 150) + 'px';
        toolTip.style.top = '12px';
      });

      chart.timeScale().fitContent();

      const handleResize = () => {
        if (chartContainerRef.current && chart) {
          chart.applyOptions({ width: chartContainerRef.current.clientWidth });
        }
      };
      window.addEventListener('resize', handleResize, { passive: true });

      return () => {
        window.removeEventListener('resize', handleResize);
        if (chartContainerRef.current) {
          const tooltips = chartContainerRef.current.querySelectorAll(
            'div[style*="position: absolute"]'
          );
          tooltips.forEach((tooltip) => tooltip.remove());
        }
        if (chartRef.current) {
          try {
            chartRef.current.remove();
          } catch (e) {}
          chartRef.current = null;
        }
      };
    };

    initChart();
  }, [chartData, isDark, theme]);

  if (!chartData || !chartData.series) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          width: '100%',
          color: theme.palette.text.secondary
        }}
      >
        <Typography variant="body2">Loading chart data...</Typography>
      </Box>
    );
  }

  return <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />;
});

export default function Portfolio({ account, limit, collection, type }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [activeRanks, setActiveRanks] = useState({});
  const [traderStats, setTraderStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedChart, setSelectedChart] = useState(null);
  const [chartView, setChartView] = useState('roi');
  const [xrpBalance, setXrpBalance] = useState({ total: 0, reserved: 0, available: 0 });
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [isAmm, setIsAmm] = useState(false);

  // Performance monitoring hooks
  const { startOperation, endOperation } = useTokenDetailPerformance();

  // Fallback value for theme.palette.divider
  const dividerColor = theme?.palette?.divider || '#ccc';

  const [activeTab, setActiveTab] = useState(collection ? '1' : '0');
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [collections, setCollections] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [selectedInterval, setSelectedInterval] = useState('24h');
  const [pageSize, setPageSize] = useState(10);
  const [tokenPage, setTokenPage] = useState(0);
  const [tokenRowsPerPage, setTokenRowsPerPage] = useState(20);

  useEffect(() => {
    const fetchTraderStats = async () => {
      startOperation();
      try {
        const response = await axiosInstance.get(`${BASE_URL}/analytics/trader-stats/${account}`);
        setTraderStats(response.data);
        // Set AMM status based on response
        setIsAmm(!!response.data?.AMM);
        endOperation('api', {
          endpoint: '/analytics/trader-stats',
          dataSize: JSON.stringify(response.data).length
        });
      } catch (error) {
        // Set empty data on error - prevent runtime crashes
        setTraderStats({});
        setIsAmm(false);
        endOperation('api', {
          endpoint: '/analytics/trader-stats',
          dataSize: 0
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchXrpBalance = async () => {
      setLoadingBalance(true);
      startOperation();
      try {
        const response = await axiosInstance.post('https://xrplcluster.com/', {
          method: 'account_info',
          params: [
            {
              account: account,
              strict: true,
              ledger_index: 'current',
              queue: true
            }
          ]
        });

        if (response.data && response.data.result && response.data.result.account_data) {
          // XRP balance is stored in drops (1 XRP = 1,000,000 drops)
          const balanceInDrops = response.data.result.account_data.Balance;
          const totalBalance = parseInt(balanceInDrops) / 1000000;

          // Calculate reserve requirements
          // Base reserve: 1 XRP per account
          // Owner reserve: 0.2 XRP per owned object (trustlines, offers, escrows, etc.)
          const ownerCount = response.data.result.account_data.OwnerCount || 0;
          const baseReserve = 1; // 1 XRP base reserve
          const ownerReserve = 0.2; // 0.2 XRP per object
          const totalReserve = baseReserve + (ownerCount * ownerReserve);
          const availableBalance = Math.max(0, totalBalance - totalReserve);

          // Store both total and available balance
          setXrpBalance({
            total: totalBalance,
            reserved: totalReserve,
            available: availableBalance
          });
        } else {
          setXrpBalance({ total: 0, reserved: 0, available: 0 });
        }
        endOperation('api', {
          endpoint: 'xrplcluster.com/account_info',
          dataSize: JSON.stringify(response.data).length
        });
      } catch (error) {
        setXrpBalance({ total: 0, reserved: 0, available: 0 });
        endOperation('api', {
          endpoint: 'xrplcluster.com/account_info',
          dataSize: 0
        });
      } finally {
        setLoadingBalance(false);
      }
    };

    if (account) {
      fetchTraderStats();
      fetchXrpBalance();
    }
  }, [account]);

  // Performance monitoring lifecycle - simplified to reduce overhead
  useEffect(() => {
    // Only monitor in development mode
    if (process.env.NODE_ENV === 'development' && memoryMonitor) {
      memoryMonitor.start();
    }

    return () => {
      // Stop memory monitoring on unmount
      if (memoryMonitor) {
        memoryMonitor.stop();
      }
    };
  }, []);

  const handleChange = (_, newValue) => {
    setActiveTab(newValue);
  };

  // Process ROI history data for the chart
  const processChartData = useMemo(() => {
    if (!traderStats?.roiHistory || traderStats.roiHistory.length === 0) {
      return null;
    }

    const sortedHistory = [...traderStats.roiHistory].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    // Generate complete date range from first to last date
    const firstDate = new Date(sortedHistory[0].date);
    const lastDate = new Date(sortedHistory[sortedHistory.length - 1].date);
    const allDates = [];

    for (let d = new Date(firstDate); d <= lastDate; d.setDate(d.getDate() + 1)) {
      allDates.push(new Date(d));
    }

    // Create a map of existing data for quick lookup
    const dataMap = new Map();
    sortedHistory.forEach(item => {
      const dateKey = new Date(item.date).toISOString().split('T')[0];
      dataMap.set(dateKey, item);
    });

    // Fill complete timeline with data or defaults
    let lastCumulativeRoi = 0;
    const completeData = allDates.map(date => {
      const dateKey = date.toISOString().split('T')[0];
      const existingData = dataMap.get(dateKey);

      if (existingData) {
        lastCumulativeRoi = existingData.cumulativeRoi || lastCumulativeRoi;
        return {
          date: date,
          dailyRoi: existingData.dailyRoi || 0,
          cumulativeRoi: lastCumulativeRoi,
          volume: existingData.volume || 0
        };
      } else {
        // Missing data - user didn't trade this day
        return {
          date: date,
          dailyRoi: 0, // No trading = 0 daily ROI
          cumulativeRoi: lastCumulativeRoi, // Carry forward cumulative
          volume: 0 // No trading = 0 volume
        };
      }
    });

    const chartData = {
      series: [
        {
          name: 'Daily ROI',
          type: 'line',
          data: completeData.map((item) => item.dailyRoi)
        },
        {
          name: 'Cumulative ROI',
          type: 'line',
          data: completeData.map((item) => item.cumulativeRoi)
        },
        {
          name: 'Volume',
          type: 'column',
          // Scale down volume to make bars smaller relative to ROI lines
          data: completeData.map((item) => (item.volume || 0) * 0.0001) // Scale factor for visual balance
        }
      ],
      xaxis: {
        categories: completeData.map((item) =>
          item.date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
        )
      }
    };

    return chartData;
  }, [traderStats?.roiHistory]);

  // Process trade history data for the chart
  const processTradeHistoryData = useMemo(() => {
    if (!traderStats?.tradeHistory || traderStats.tradeHistory.length === 0) {
      return null;
    }

    const sortedHistory = [...traderStats.tradeHistory].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    // Generate complete date range from first to last date
    const firstDate = new Date(sortedHistory[0].date);
    const lastDate = new Date(sortedHistory[sortedHistory.length - 1].date);
    const allDates = [];

    for (let d = new Date(firstDate); d <= lastDate; d.setDate(d.getDate() + 1)) {
      allDates.push(new Date(d));
    }

    // Create a map of existing data for quick lookup
    const dataMap = new Map();
    sortedHistory.forEach(item => {
      const dateKey = new Date(item.date).toISOString().split('T')[0];
      dataMap.set(dateKey, item);
    });

    // Fill complete timeline with data or defaults
    let lastCumulativeTrades = 0;
    const completeData = allDates.map(date => {
      const dateKey = date.toISOString().split('T')[0];
      const existingData = dataMap.get(dateKey);

      if (existingData) {
        lastCumulativeTrades = existingData.cumulativeTrades || lastCumulativeTrades;
        return {
          date: date,
          trades: existingData.trades || 0,
          cumulativeTrades: lastCumulativeTrades
        };
      } else {
        return {
          date: date,
          trades: 0, // No trading = 0 trades
          cumulativeTrades: lastCumulativeTrades // Carry forward cumulative
        };
      }
    });

    const chartData = {
      series: [
        {
          name: 'Daily Trades',
          type: 'column',
          data: completeData.map((item) => item.trades)
        },
        {
          name: 'Cumulative Trades',
          type: 'line',
          data: completeData.map((item) => item.cumulativeTrades)
        }
      ],
      xaxis: {
        categories: completeData.map((item) =>
          item.date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          })
        )
      }
    };

    return chartData;
  }, [traderStats?.tradeHistory]);

  const processVolumeHistoryData = useMemo(() => {
    if (!traderStats?.volumeHistory || traderStats.volumeHistory.length === 0) {
      return null;
    }

    const sortedHistory = [...traderStats.volumeHistory].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    // Generate complete date range from first to last date
    const firstDate = new Date(sortedHistory[0].date);
    const lastDate = new Date(sortedHistory[sortedHistory.length - 1].date);
    const allDates = [];

    for (let d = new Date(firstDate); d <= lastDate; d.setDate(d.getDate() + 1)) {
      allDates.push(new Date(d));
    }

    // Create a map of existing data for quick lookup
    const dataMap = new Map();
    sortedHistory.forEach(item => {
      const dateKey = new Date(item.date).toISOString().split('T')[0];
      dataMap.set(dateKey, item);
    });

    // Fill complete timeline with data or defaults
    let lastCumulativeVolume = 0;
    const completeData = allDates.map(date => {
      const dateKey = date.toISOString().split('T')[0];
      const existingData = dataMap.get(dateKey);

      if (existingData) {
        lastCumulativeVolume = existingData.cumulativeVolume || lastCumulativeVolume;
        return {
          date: date,
          h24Volume: existingData.h24Volume || 0,
          cumulativeVolume: lastCumulativeVolume
        };
      } else {
        return {
          date: date,
          h24Volume: 0, // No trading = 0 volume
          cumulativeVolume: lastCumulativeVolume // Carry forward cumulative
        };
      }
    });

    const chartData = {
      series: [
        {
          name: 'Daily Volume',
          type: 'column',
          data: completeData.map((item) => item.h24Volume)
        },
        {
          name: 'Cumulative Volume',
          type: 'line',
          data: completeData.map((item) => item.cumulativeVolume)
        }
      ],
      xaxis: {
        categories: completeData.map((item) =>
          item.date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          })
        )
      }
    };

    return chartData;
  }, [traderStats?.volumeHistory]);

  const chartOptions = {
    yAxis: [
      {
        title: {
          text: 'ROI (%)',
          style: {
            color: theme.palette.text.secondary,
            fontSize: '11px'
          }
        },
        labels: {
          style: {
            color: theme.palette.text.secondary,
            fontSize: '10px'
          },
          formatter: function () {
            return this.value + '%';
          }
        }
      },
      {
        title: {
          text: 'Volume (XRP)',
          style: {
            color: theme.palette.text.secondary,
            fontSize: '11px'
          }
        },
        opposite: true,
        labels: {
          style: {
            color: theme.palette.text.secondary,
            fontSize: '10px'
          }
        }
      }
    ],
    plotOptions: {
      column: {
        borderRadius: 6,
        borderWidth: 0,
        pointPadding: 0.2,
        groupPadding: 0.1
      },
      line: {
        lineWidth: 2,
        states: {
          hover: {
            lineWidth: 3
          }
        },
        marker: {
          enabled: false,
          states: {
            hover: {
              enabled: true,
              radius: 4
            }
          }
        }
      }
    }
  };

  /* Old ApexCharts options removed - now handled in renderChart
      custom: function ({ series, seriesIndex, dataPointIndex, w }) {
        const data = w.globals.initialSeries;
        const categories = w.globals.categoryLabels || w.globals.labels;

        return `
          <div style="
            background: transparent;
            backdrop-filter: none;
            border: 1px solid ${alpha(theme.palette.divider, 0.2)};
            border-radius: 12px;
            padding: 12px 16px;
            box-shadow: 0 8px 32px ${alpha(theme.palette.common.black, 0.12)};
            min-width: 200px;
          ">
            <div style="
              color: ${theme.palette.text.secondary};
              font-size: 12px;
              font-weight: 500;
              margin-bottom: 8px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            ">${categories[dataPointIndex] || ''}</div>
            ${series
              .map((val, index) => {
                const color = w.globals.colors[index];
                const seriesName = w.globals.seriesNames[index];
                const value = val[dataPointIndex];
                const formattedValue =
                  index === 2
                    ? `${(value || 0).toLocaleString()} XRP`
                    : `${(value || 0).toFixed(2)}%`;

                return `
                <div style="
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  margin: 4px 0;
                ">
                  <div style="display: flex; align-items: center;">
                    <div style="
                      width: 8px;
                      height: 8px;
                      border-radius: 50%;
                      background: ${color};
                      margin-right: 8px;
                      box-shadow: 0 0 6px ${alpha(color, 0.4)};
                    "></div>
                    <span style="
                      color: ${theme.palette.text.primary};
                      font-weight: 500;
                      font-size: 13px;
                    ">${seriesName}</span>
                  </div>
                  <span style="
                    color: ${color};
                    font-weight: 600;
                    font-size: 13px;
                    margin-left: 12px;
                  ">${formattedValue}</span>
                </div>
              `;
              })
              .join('')}
          </div>
        `;
      }
    },
    xaxis: {
      type: 'category',
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          colors: alpha(theme.palette.text.secondary, 0.8),
          fontSize: '11px',
          fontWeight: '500'
        },
        rotate: -45
      }
    },
    yaxis: [
      {
        seriesName: 'Daily ROI',
        title: {
          text: 'Daily ROI (%)',
          style: {
            color: alpha(theme.palette.text.secondary, 0.9),
            fontSize: '11px',
            fontWeight: '600'
          }
        },
        labels: {
          style: {
            colors: alpha(theme.palette.text.secondary, 0.8),
            fontSize: '10px',
            fontWeight: '500'
          },
          formatter: (val) => `${val.toFixed(1)}%`
        }
      },
      {
        seriesName: 'Cumulative ROI',
        opposite: true,
        title: {
          text: 'Cumulative ROI (%)',
          style: {
            color: alpha(theme.palette.text.secondary, 0.9),
            fontSize: '11px',
            fontWeight: '600'
          }
        },
        labels: {
          style: {
            colors: alpha(theme.palette.text.secondary, 0.8),
            fontSize: '10px',
            fontWeight: '500'
          },
          formatter: (val) => `${val.toFixed(1)}%`
        }
      },
      {
        seriesName: 'Volume',
        opposite: true,
        title: {
          text: 'Volume (XRP)',
          style: {
            color: alpha(theme.palette.text.secondary, 0.9),
            fontSize: '11px',
            fontWeight: '600'
          }
        },
        labels: {
          show: false
        }
      }
    ],
    grid: {
      borderColor: alpha(theme.palette.divider, 0.08),
      strokeDashArray: 0,
      padding: {
        top: 10,
        right: 10,
        bottom: 10,
        left: 10
      }
    },
    colors: [
      theme.palette.primary.main,
      theme.palette.success.main,
      alpha(theme.palette.info.main, 0.4)
    ],
    plotOptions: {
      bar: {
        columnWidth: '25%',
        borderRadius: 6,
        borderRadiusApplication: 'end',
        borderRadiusWhenStacked: 'last'
      }
    },
    dataLabels: {
      enabled: false
    },
    states: {
      hover: {
        filter: {
          type: 'lighten',
          value: 0.15
        }
      },
      active: {
        allowMultipleDataPointsSelection: false,
        filter: {
          type: 'darken',
          value: 0.7
        }
      }
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          legend: {
            position: 'bottom',
            offsetY: 0
          },
          plotOptions: {
            bar: {
              columnWidth: '35%'
            }
          }
        }
      }
    ]
  }; */

  const tradeHistoryOptions = {
    yAxis: [
      {
        title: {
          text: 'Daily Trades',
          style: {
            color: theme.palette.text.secondary,
            fontSize: '11px'
          }
        },
        labels: {
          style: {
            color: theme.palette.text.secondary,
            fontSize: '10px'
          },
          formatter: function () {
            return formatNumber(this.value, 'trades');
          }
        }
      },
      {
        title: {
          text: 'Cumulative Trades',
          style: {
            color: theme.palette.text.secondary,
            fontSize: '11px'
          }
        },
        opposite: true,
        labels: {
          style: {
            color: theme.palette.text.secondary,
            fontSize: '10px'
          },
          formatter: function () {
            return formatNumber(this.value, 'trades');
          }
        }
      }
    ],
    plotOptions: {
      column: {
        borderRadius: 6,
        borderWidth: 0,
        pointPadding: 0.2,
        groupPadding: 0.1
      },
      line: {
        lineWidth: 2,
        states: {
          hover: {
            lineWidth: 3
          }
        },
        marker: {
          enabled: false,
          states: {
            hover: {
              enabled: true,
              radius: 4
            }
          }
        }
      }
    }
  };

  /* Old ApexCharts options
    chart: {
      stacked: false,
      toolbar: { show: false },
      background: 'transparent',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      }
    },
    stroke: {
      width: [0, 3],
      curve: 'smooth',
      lineCap: 'round'
    },
    legend: {
      position: 'top',
      horizontalAlign: 'center',
      offsetY: -30,
      markers: {
        radius: 12,
        strokeWidth: 2,
        strokeColor: theme.palette.background.paper
      },
      itemMargin: {
        horizontal: 15,
        vertical: 5
      },
      labels: {
        colors: theme.palette.text.primary,
        useSeriesColors: false
      },
      onItemHover: {
        highlightDataSeries: true
      }
    },
    tooltip: {
      theme: theme.palette.mode,
      shared: true,
      intersect: false,
      followCursor: true,
      fillSeriesColor: false,
      style: {
        fontSize: '13px',
        fontFamily: theme.typography.fontFamily
      },
      x: {
        show: false
      },
      marker: {
        show: false
      },
      custom: function ({ series, seriesIndex, dataPointIndex, w }) {
        const categories = w.globals.categoryLabels || w.globals.labels;

        return `
          <div style="
            background: transparent;
            backdrop-filter: none;
            border: 1px solid ${alpha(theme.palette.divider, 0.2)};
            border-radius: 12px;
            padding: 12px 16px;
            box-shadow: 0 8px 32px ${alpha(theme.palette.common.black, 0.12)};
            min-width: 200px;
          ">
            <div style="
              color: ${theme.palette.text.secondary};
              font-size: 12px;
              font-weight: 500;
              margin-bottom: 8px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            ">${categories[dataPointIndex] || ''}</div>
            ${series
              .map((val, index) => {
                const color = w.globals.colors[index];
                const seriesName = w.globals.seriesNames[index];
                const value = val[dataPointIndex];
                const formattedValue = (value || 0).toLocaleString();

                return `
                <div style="
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  margin: 4px 0;
                ">
                  <div style="display: flex; align-items: center;">
                    <div style="
                      width: 8px;
                      height: 8px;
                      border-radius: 50%;
                      background: ${color};
                      margin-right: 8px;
                      box-shadow: 0 0 6px ${alpha(color, 0.4)};
                    "></div>
                    <span style="
                      color: ${theme.palette.text.primary};
                      font-weight: 500;
                      font-size: 13px;
                    ">${seriesName}</span>
                  </div>
                  <span style="
                    color: ${color};
                    font-weight: 600;
                    font-size: 13px;
                    margin-left: 12px;
                  ">${formattedValue}</span>
                </div>
              `;
              })
              .join('')}
          </div>
        `;
      }
    },
    xaxis: {
      type: 'category',
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          colors: alpha(theme.palette.text.secondary, 0.8),
          fontSize: '11px',
          fontWeight: '500'
        }
      }
    },
    yaxis: [
      {
        seriesName: 'Daily Trades',
        title: {
          text: 'Daily Trades',
          style: {
            color: alpha(theme.palette.text.secondary, 0.9),
            fontSize: '11px',
            fontWeight: '600'
          }
        },
        labels: {
          style: {
            colors: alpha(theme.palette.text.secondary, 0.8),
            fontSize: '10px',
            fontWeight: '500'
          }
        }
      },
      {
        seriesName: 'Cumulative Trades',
        opposite: true,
        title: {
          text: 'Cumulative Trades',
          style: {
            color: alpha(theme.palette.text.secondary, 0.9),
            fontSize: '11px',
            fontWeight: '600'
          }
        },
        labels: {
          style: {
            colors: alpha(theme.palette.text.secondary, 0.8),
            fontSize: '10px',
            fontWeight: '500'
          }
        }
      }
    ],
    grid: {
      borderColor: alpha(theme.palette.divider, 0.08),
      padding: {
        top: 10,
        right: 10,
        bottom: 10,
        left: 10
      }
    },
    colors: [theme.palette.primary.main, theme.palette.success.main],
    plotOptions: {
      bar: {
        columnWidth: '35%',
        borderRadius: 6,
        borderRadiusApplication: 'end',
        borderRadiusWhenStacked: 'last'
      }
    },
    dataLabels: {
      enabled: false
    },
    states: {
      hover: {
        filter: {
          type: 'lighten',
          value: 0.15
        }
      },
      active: {
        allowMultipleDataPointsSelection: false,
        filter: {
          type: 'darken',
          value: 0.7
        }
      }
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          legend: {
            position: 'bottom',
            offsetY: 0
          },
          plotOptions: {
            bar: {
              columnWidth: '45%'
            }
          }
        }
      }
    ]
  }; */

  const volumeHistoryOptions = {
    yAxis: [
      {
        title: {
          text: 'Daily Volume (XRP)',
          style: {
            color: theme.palette.text.secondary,
            fontSize: '11px'
          }
        },
        labels: {
          style: {
            color: theme.palette.text.secondary,
            fontSize: '10px'
          },
          formatter: function () {
            return formatNumber(this.value, 'volume');
          }
        }
      },
      {
        title: {
          text: 'Cumulative Volume (XRP)',
          style: {
            color: theme.palette.text.secondary,
            fontSize: '11px'
          }
        },
        opposite: true,
        labels: {
          style: {
            color: theme.palette.text.secondary,
            fontSize: '10px'
          },
          formatter: function () {
            return formatNumber(this.value, 'volume');
          }
        }
      }
    ],
    plotOptions: {
      column: {
        borderRadius: 6,
        borderWidth: 0,
        pointPadding: 0.2,
        groupPadding: 0.1
      },
      line: {
        lineWidth: 2,
        states: {
          hover: {
            lineWidth: 3
          }
        },
        marker: {
          enabled: false,
          states: {
            hover: {
              enabled: true,
              radius: 4
            }
          }
        }
      }
    }
  };

  /* Old ApexCharts volume options
    chart: {
      stacked: false,
      toolbar: { show: false },
      background: 'transparent',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      }
    },
    stroke: {
      width: [0, 3],
      curve: 'smooth',
      lineCap: 'round'
    },
    legend: {
      position: 'top',
      horizontalAlign: 'center',
      offsetY: -30,
      markers: {
        radius: 12,
        strokeWidth: 2,
        strokeColor: theme.palette.background.paper
      },
      itemMargin: {
        horizontal: 15,
        vertical: 5
      },
      labels: {
        colors: theme.palette.text.primary,
        useSeriesColors: false
      },
      onItemHover: {
        highlightDataSeries: true
      }
    },
    tooltip: {
      theme: theme.palette.mode,
      shared: true,
      intersect: false,
      followCursor: true,
      fillSeriesColor: false,
      style: {
        fontSize: '13px',
        fontFamily: theme.typography.fontFamily
      },
      x: {
        show: false
      },
      marker: {
        show: false
      },
      custom: function ({ series, seriesIndex, dataPointIndex, w }) {
        const categories = w.globals.categoryLabels || w.globals.labels;

        return `
          <div style="
            background: transparent;
            backdrop-filter: none;
            border: 1px solid ${alpha(theme.palette.divider, 0.2)};
            border-radius: 12px;
            padding: 12px 16px;
            box-shadow: 0 8px 32px ${alpha(theme.palette.common.black, 0.12)};
            min-width: 200px;
          ">
            <div style="
              color: ${theme.palette.text.secondary};
              font-size: 12px;
              font-weight: 500;
              margin-bottom: 8px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            ">${categories[dataPointIndex] || ''}</div>
            ${series
              .map((val, index) => {
                const color = w.globals.colors[index];
                const seriesName = w.globals.seriesNames[index];
                const value = val[dataPointIndex];
                const formattedValue = `${(value || 0).toLocaleString()} XRP`;

                return `
                <div style="
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  margin: 4px 0;
                ">
                  <div style="display: flex; align-items: center;">
                    <div style="
                      width: 8px;
                      height: 8px;
                      border-radius: 50%;
                      background: ${color};
                      margin-right: 8px;
                      box-shadow: 0 0 6px ${alpha(color, 0.4)};
                    "></div>
                    <span style="
                      color: ${theme.palette.text.primary};
                      font-weight: 500;
                      font-size: 13px;
                    ">${seriesName}</span>
                  </div>
                  <span style="
                    color: ${color};
                    font-weight: 600;
                    font-size: 13px;
                    margin-left: 12px;
                  ">${formattedValue}</span>
                </div>
              `;
              })
              .join('')}
          </div>
        `;
      }
    },
    xaxis: {
      type: 'category',
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          colors: alpha(theme.palette.text.secondary, 0.8),
          fontSize: '11px',
          fontWeight: '500'
        }
      }
    },
    yaxis: [
      {
        seriesName: 'Daily Volume',
        title: {
          text: 'Daily Volume (XRP)',
          style: {
            color: alpha(theme.palette.text.secondary, 0.9),
            fontSize: '11px',
            fontWeight: '600'
          }
        },
        labels: {
          style: {
            colors: alpha(theme.palette.text.secondary, 0.8),
            fontSize: '10px',
            fontWeight: '500'
          },
          formatter: (val) => val.toLocaleString()
        }
      },
      {
        seriesName: 'Cumulative Volume',
        opposite: true,
        title: {
          text: 'Cumulative Volume (XRP)',
          style: {
            color: alpha(theme.palette.text.secondary, 0.9),
            fontSize: '11px',
            fontWeight: '600'
          }
        },
        labels: {
          style: {
            colors: alpha(theme.palette.text.secondary, 0.8),
            fontSize: '10px',
            fontWeight: '500'
          },
          formatter: (val) => val.toLocaleString()
        }
      }
    ],
    grid: {
      borderColor: alpha(theme.palette.divider, 0.08),
      padding: {
        top: 10,
        right: 10,
        bottom: 10,
        left: 10
      }
    },
    colors: [alpha(theme.palette.primary.main, 0.6), theme.palette.success.main],
    plotOptions: {
      bar: {
        columnWidth: '35%',
        borderRadius: 6,
        borderRadiusApplication: 'end',
        borderRadiusWhenStacked: 'last'
      }
    },
    dataLabels: {
      enabled: false
    },
    states: {
      hover: {
        filter: {
          type: 'lighten',
          value: 0.15
        }
      },
      active: {
        allowMultipleDataPointsSelection: false,
        filter: {
          type: 'darken',
          value: 0.7
        }
      }
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          legend: {
            position: 'bottom',
            offsetY: 0
          },
          plotOptions: {
            bar: {
              columnWidth: '45%'
            }
          }
        }
      }
    ]
  }; */

  // Remove duplicate OuterBorderContainer definition

  // useEffect(() => {
  //   async function fetchActiveRanks() {
  //     try {
  //       const res = await axios.get('http://37.27.134.126:5000/api/fetch-active-ranks');
  //       setActiveRanks(res.data);
  //     } catch (error) {
  //       // Silently fail for active ranks as it's not critical
  //       setActiveRanks({});
  //     }
  //   }

  //   fetchActiveRanks();
  // }, []);

  useEffect(() => {
    if (account) {
      fetchCollections();
    }
  }, [account]);

  const fetchCollections = async () => {
    setLoadingCollections(true);
    startOperation();
    try {
      const response = await axiosInstance.post(
        'https://api.xrpnft.com/api/account/collectedCreated',
        {
          account,
          filter: 0,
          limit: 16,
          page: 0,
          search: '',
          subFilter: 'pricexrpasc',
          type: 'collected'
        }
      );
      if (response.data) {
        setCollections(response.data.nfts || []);
        setTotalValue(response.data.totalValue || 0);
      }
      endOperation('api', {
        endpoint: 'api.xrpnft.com/collectedCreated',
        dataSize: JSON.stringify(response.data).length
      });
    } catch (error) {
      // Silently handle the error - NFT collections are optional
      setCollections([]);
      setTotalValue(0);
      endOperation('api', {
        endpoint: 'api.xrpnft.com/collectedCreated',
        dataSize: 0
      });
    } finally {
      setLoadingCollections(false);
    }
  };

  const handleExpandChart = (chartType) => {
    setSelectedChart(chartType);
  };

  const handleCloseModal = () => {
    setSelectedChart(null);
  };

  const handleChartViewChange = (event, newView) => {
    if (newView !== null) {
      setChartView(newView);
    }
  };

  const renderChart = (chartData, options, type = 'line') => {
    startOperation();

    // Need to get the original date data for proper timestamps
    let dateSource;
    if (chartView === 'roi' && traderStats?.roiHistory) {
      dateSource = [...traderStats.roiHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (chartView === 'activity' && traderStats?.tradeHistory) {
      // Use the same logic as processTradeHistoryData - full history
      const sortedHistory = [...traderStats.tradeHistory].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );
      dateSource = sortedHistory;
    } else if (chartView === 'volume' && traderStats?.volumeHistory) {
      // Use the same logic as processVolumeHistoryData - full history
      const sortedHistory = [...traderStats.volumeHistory].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );
      dateSource = sortedHistory;
    }


    // Convert chartData format to LightweightChart component format with proper dates
    const data = chartData.xaxis.categories.map((dateStr, index) => {
      const item = {};
      // Use the actual date from source data for proper timestamp
      if (dateSource && dateSource[index]) {
        item.date = dateSource[index].date;
      } else {

        // Fallback: try to parse the formatted date string
        // For dates without year, we need to determine the correct year based on context
        // The data is historical, starting from Dec 2024
        let parsedDate;

        // Check if dateStr already contains a year
        if (/\d{4}/.test(dateStr)) {
          parsedDate = new Date(dateStr);
        } else {
          // For month-day format without year, assume 2024 or 2025 based on month
          const monthMatch = dateStr.match(/^(\w+)/);
          if (monthMatch) {
            const month = monthMatch[1];
            const monthsIn2024 = ['Dec'];
            const year = monthsIn2024.includes(month) ? 2024 : 2025;
            parsedDate = new Date(`${dateStr}, ${year}`);
          } else {
            parsedDate = new Date(dateStr);
          }
        }

        item.date = parsedDate.toISOString();
      }

      chartData.series.forEach((serie) => {
        item[serie.name.toLowerCase().replace(/\s+/g, '')] = serie.data[index];
      });
      return item;
    });

    const series = chartData.series.map((serie, index) => ({
      name: serie.name,
      dataKey: serie.name.toLowerCase().replace(/\s+/g, ''),
      type: serie.type,
      color:
        chartView === 'roi' && serie.name === 'Volume'
          ? alpha(theme.palette.info.main, 0.5) // Lighter color for volume bars in ROI view
          : index === 0
            ? theme.palette.primary.main
            : index === 1
              ? theme.palette.success.main
              : alpha(theme.palette.info.main, 0.8),
      visible: true,
      isVolumeInRoi: chartView === 'roi' && serie.name === 'Volume',
      lineWidth: chartView === 'roi' && serie.type === 'line' ? 2.5 : 2, // Thicker lines for ROI
      valueFormatter: (value) => {
        if (chartView === 'roi') {
          // Volume in ROI view is scaled down, so multiply back for display
          return serie.name.includes('Volume')
            ? formatNumber(value * 10000, 'volume') + ' XRP'
            : formatNumber(value, 'roi');
        } else if (chartView === 'activity') {
          return formatNumber(value, 'trades');
        } else if (chartView === 'volume') {
          return formatNumber(value, 'volume') + ' XRP';
        }
        return value.toLocaleString();
      }
    }));

    const chartComponent = <LightweightChart data={data} series={series} height={isMobile ? 300 : 400} />;

    endOperation('chart', {
      chartType: chartView,
      dataPoints: data.length
    });

    return chartComponent;
  };

  // Commented out empty useEffect that was causing infinite reloads
  // useEffect(() => {
  //   // Fetch data
  //   const fetchData = async () => {
  //     try {
  //       // Your data fetching logic
  //       // const result = await fetchChartData(); // This line caused the error
  //       // setChartData({ labels: [], datasets: [] }); // Ensure chartData is initialized
  //     } catch (error) {
  //       console.warn('Error fetching chart data:', error.message || error);
  //       // Set empty but valid chart data structure
  //       // setChartData({ labels: [], datasets: [] });
  //     } finally {
  //       // setIsLoading(false);
  //     }
  //   };

  //   // fetchData(); // Commenting out or removing this call
  // }, [account, collection, type]);

  // Render loading state or error state
  if (loading) {
    return <Box>Loading...</Box>;
  }

  return (
    <TokenDetailProfiler componentName="Portfolio">
      <OverviewWrapper>
      <Container
        maxWidth={false}
        sx={{ mt: { xs: 1, sm: 3 }, px: { xs: 1, sm: 2 }, maxWidth: '100%' }}
      >
        <Grid container spacing={{ xs: 1, sm: 2 }}>
          <Grid size={{ xs: 12, lg: 3 }} order={{ xs: 2, lg: 1 }}>
            <OuterBorderContainer>
              <Stack sx={{ height: '100%', justifyContent: 'space-between' }}>
                <Stack
                  sx={{
                    color: theme.palette.text.primary,
                    flex: '1 1 auto'
                  }}
                  spacing={{ xs: 0.75, sm: 1 }}
                >
                  {/* XRP Address Section - removed nested container */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: { xs: 1, sm: 1.5 },
                      p: { xs: 1.5, sm: 2 }
                    }}
                  >
                    <Box sx={{ position: 'relative' }}>
                      <Avatar
                        src={getHashIcon(account)}
                        sx={{
                          width: { xs: 48, sm: 56 },
                          height: { xs: 48, sm: 56 },
                          boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.15)}`,
                          transition: 'all 0.3s ease'
                        }}
                      />
                      {activeRanks[account] === 'verified' && (
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: -2,
                            right: -2,
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #1DA1F2 0%, #0d8bd9 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 2px 6px ${alpha('#1DA1F2', 0.3)}`
                          }}
                        >
                          <VerifiedIcon
                            sx={{
                              fontSize: { xs: '0.6rem', sm: '0.65rem' },
                              color: 'white'
                            }}
                          />
                        </Box>
                      )}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            color: theme.palette.text.primary,
                            fontWeight: 600,
                            fontSize: { xs: '0.9rem', sm: '1rem' },
                            letterSpacing: '-0.01em',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            maxWidth: { xs: '160px', sm: '100%' }
                          }}
                        >
                          {isMobile
                            ? `${account.substring(0, 8)}...${account.substring(account.length - 6)}`
                            : account}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => navigator.clipboard.writeText(account)}
                          sx={{
                            p: 0.25,
                            color: alpha(theme.palette.text.secondary, 0.6),
                            '&:hover': {
                              color: theme.palette.primary.main,
                              bgcolor: alpha(theme.palette.primary.main, 0.08)
                            }
                          }}
                        >
                          <ContentCopyIcon sx={{ fontSize: '1rem' }} />
                        </IconButton>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Chip
                          label={activeRanks[account] === 'verified' ? 'Verified' : 'Trader'}
                          size="small"
                          sx={{
                            bgcolor: alpha(
                              activeRankColors[activeRanks[account]] || theme.palette.primary.main,
                              0.08
                            ),
                            color:
                              activeRankColors[activeRanks[account]] || theme.palette.primary.main,
                            border: 'none',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            height: 24,
                            '& .MuiChip-label': {
                              px: 1
                            }
                          }}
                        />
                        {isAmm && (
                          <Chip
                            label="AMM"
                            size="small"
                            sx={{
                              bgcolor: alpha(theme.palette.warning.main, 0.08),
                              color: theme.palette.warning.main,
                              border: 'none',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              height: 24,
                              '& .MuiChip-label': {
                                px: 1
                              }
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Stack>

                <Card
                  sx={{
                    borderRadius: '12px',
                    background:
                      theme.palette.mode === 'dark'
                        ? alpha(theme.palette.background.paper, 0.4)
                        : alpha(theme.palette.background.paper, 0.9),
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    boxShadow: theme.shadows[2],
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4]
                    }
                  }}
                >
                  <Box sx={{ p: 1.5 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrendingUpIcon
                          sx={{
                            fontSize: '1rem',
                            color: theme.palette.success.main
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            color: alpha(theme.palette.text.secondary, 0.9),
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.3px'
                          }}
                        >
                          Trading Volume
                        </Typography>
                      </Box>
                      {loading ? (
                        <Skeleton width={80} height={20} sx={{ borderRadius: '4px' }} />
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{
                            color: theme.palette.success.main,
                            fontWeight: 700,
                            fontSize: '0.95rem'
                          }}
                        >
                          {`${(traderStats?.totalVolume || 0).toLocaleString()} XRP`}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Card>

                {/* XRP Balance Display */}
                <Card
                  sx={{
                    mt: 1,
                    borderRadius: '12px',
                    background:
                      theme.palette.mode === 'dark'
                        ? alpha(theme.palette.background.paper, 0.4)
                        : alpha(theme.palette.background.paper, 0.9),
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    boxShadow: theme.shadows[2],
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4]
                    }
                  }}
                >
                  <Box sx={{ p: 2 }}>
                    {/* Main Balance Row */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                        mb: 1.5
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccountBalanceWalletIcon
                          sx={{
                            fontSize: '1rem',
                            color: theme.palette.primary.main
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            color: alpha(theme.palette.text.secondary, 0.9),
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.3px'
                          }}
                        >
                          XRP Balance
                        </Typography>
                      </Box>
                      {loadingBalance ? (
                        <Skeleton width={80} height={60} sx={{ borderRadius: '4px' }} />
                      ) : (
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              color: theme.palette.text.primary,
                              fontSize: '1.1rem',
                              lineHeight: 1.2
                            }}
                          >
                            {xrpBalance?.total !== undefined
                              ? xrpBalance.total.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })
                              : '0.00'}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: alpha(theme.palette.error.main, 0.8),
                              fontSize: '0.7rem',
                              display: 'block',
                              lineHeight: 1.1
                            }}
                          >
                            Reserved {xrpBalance?.reserved !== undefined
                              ? xrpBalance.reserved.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })
                              : '0.00'}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: theme.palette.primary.main,
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              display: 'block',
                              lineHeight: 1.1
                            }}
                          >
                            Available {xrpBalance?.available !== undefined
                              ? xrpBalance.available.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })
                              : '0.00'}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Buy/Sell Volume Row */}
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      <Box
                        sx={{
                          flex: 1,
                          p: 1.5,
                          borderRadius: '8px',
                          background: alpha(theme.palette.success.main, 0.05),
                          border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: alpha(theme.palette.text.secondary, 0.8),
                            fontSize: '0.7rem',
                            display: 'block'
                          }}
                        >
                          Buy
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: theme.palette.success.main,
                            fontWeight: 600,
                            fontSize: '0.85rem'
                          }}
                        >
                          {(traderStats?.buyVolume || 0).toLocaleString()}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          flex: 1,
                          p: 1.5,
                          borderRadius: '8px',
                          background: alpha(theme.palette.error.main, 0.05),
                          border: `1px solid ${alpha(theme.palette.error.main, 0.15)}`
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: alpha(theme.palette.text.secondary, 0.8),
                            fontSize: '0.7rem',
                            display: 'block'
                          }}
                        >
                          Sell
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: theme.palette.error.main,
                            fontWeight: 600,
                            fontSize: '0.85rem'
                          }}
                        >
                          {(traderStats?.sellVolume || 0).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Card>

                {/* Additional Stats - Compact card */}
                <Box
                  sx={{
                    mt: 1,
                    p: 1.5,
                    borderRadius: '12px',
                    background: alpha(theme.palette.info.main, 0.08),
                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                    boxShadow: theme.shadows[1],
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: theme.shadows[2]
                    }
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: alpha(theme.palette.text.secondary, 0.9),
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px'
                      }}
                    >
                      Avg Holding Time
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.info.main,
                        fontWeight: 700,
                        fontSize: '1.1rem'
                      }}
                    >
                      {formatHoldingTime(traderStats?.avgHoldingTime || 0)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mt: 1 }}>
                  <Card
                    sx={{
                      borderRadius: '12px',
                      background:
                        theme.palette.mode === 'dark'
                          ? alpha(theme.palette.background.paper, 0.4)
                          : alpha(theme.palette.background.paper, 0.9),
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      boxShadow: theme.shadows[2],
                      overflow: 'hidden',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[4]
                      }
                    }}
                  >
                    <Box sx={{ p: 2 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mb: 1.5
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: alpha(theme.palette.text.secondary, 0.9),
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.3px'
                          }}
                        >
                          Token Performance
                        </Typography>
                      </Box>

                      {loading ? (
                        <Skeleton variant="rectangular" height={100} sx={{ borderRadius: '6px' }} />
                      ) : (
                        <Box
                          sx={{
                            background:
                              theme.palette.mode === 'dark'
                                ? alpha(theme.palette.background.default, 0.3)
                                : alpha(theme.palette.background.default, 0.5),
                            borderRadius: '8px',
                            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                            overflow: 'hidden'
                          }}
                        >
                          <Table
                            size="small"
                            sx={{
                              '& .MuiTableCell-root': {
                                fontSize: '0.8rem',
                                padding: '8px 10px',
                                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`
                              }
                            }}
                          >
                            <TableHead>
                              <TableRow
                                sx={{
                                  '& .MuiTableCell-root': {
                                    fontWeight: 600,
                                    color: theme.palette.text.secondary,
                                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                    fontSize: '0.75rem',
                                    textTransform: 'uppercase'
                                  }
                                }}
                              >
                                <TableCell>Token</TableCell>
                                <TableCell align="right">ROI</TableCell>
                                <TableCell align="right">Profit</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {traderStats?.tokenPerformance
                                ?.sort((a, b) => b.profit - a.profit)
                                .slice(0, 25)
                                .slice(
                                  tokenPage * tokenRowsPerPage,
                                  tokenPage * tokenRowsPerPage + tokenRowsPerPage
                                )
                                .map((token, index) => (
                                  <TableRow
                                    key={token.tokenId}
                                    sx={{
                                      '&:hover': {
                                        background: alpha(theme.palette.primary.main, 0.02)
                                      }
                                    }}
                                  >
                                    <TableCell>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Box
                                          sx={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: '50%',
                                            bgcolor:
                                              token.roi >= 0
                                                ? theme.palette.success.main
                                                : theme.palette.error.main
                                          }}
                                        />
                                        <Typography sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                                          {token.name}
                                        </Typography>
                                      </Box>
                                    </TableCell>
                                    <TableCell
                                      align="right"
                                      sx={{
                                        color:
                                          token.roi >= 0
                                            ? theme.palette.success.main
                                            : theme.palette.error.main,
                                        fontWeight: 600,
                                        fontSize: '0.8rem'
                                      }}
                                    >
                                      {token.roi.toFixed(2)}%
                                    </TableCell>
                                    <TableCell
                                      align="right"
                                      sx={{
                                        color:
                                          token.profit >= 0
                                            ? theme.palette.success.main
                                            : theme.palette.error.main,
                                        fontWeight: 600,
                                        fontSize: '0.8rem'
                                      }}
                                    >
                                      {token.profit.toFixed(0)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                          {traderStats?.tokenPerformance?.length > 5 && (
                            <TablePagination
                              component="div"
                              count={Math.min(traderStats.tokenPerformance.length, 25)}
                              page={tokenPage}
                              onPageChange={(event, newPage) => setTokenPage(newPage)}
                              rowsPerPage={tokenRowsPerPage}
                              onRowsPerPageChange={(event) => {
                                setTokenRowsPerPage(parseInt(event.target.value, 10));
                                setTokenPage(0);
                              }}
                              rowsPerPageOptions={[5, 10, 20, 25]}
                              sx={{
                                '.MuiTablePagination-toolbar': {
                                  minHeight: 36,
                                  paddingLeft: 1,
                                  paddingRight: 1
                                },
                                '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows':
                                  {
                                    fontSize: '0.65rem'
                                  },
                                '.MuiTablePagination-select': {
                                  fontSize: '0.65rem'
                                },
                                '.MuiTablePagination-actions': {
                                  marginLeft: 0.5
                                },
                                '.MuiIconButton-root': {
                                  padding: 0.5
                                }
                              }}
                            />
                          )}
                        </Box>
                      )}
                    </Box>
                  </Card>
                </Box>

                <Card
                  sx={{
                    borderRadius: '12px',
                    mt: 1,
                    background:
                      theme.palette.mode === 'dark'
                        ? alpha(theme.palette.background.paper, 0.4)
                        : alpha(theme.palette.background.paper, 0.9),
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    boxShadow: theme.shadows[2],
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4]
                    }
                  }}
                >
                  <Box sx={{ p: 2 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: alpha(theme.palette.text.secondary, 0.9),
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                        display: 'block',
                        mb: 1.5
                      }}
                    >
                      Trading Statistics
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      <Box
                        sx={{
                          flex: 1,
                          p: 1,
                          borderRadius: '8px',
                          background: alpha(theme.palette.primary.main, 0.05),
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: alpha(theme.palette.text.secondary, 0.8),
                            fontSize: '0.7rem',
                            display: 'block'
                          }}
                        >
                          Trades
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: theme.palette.primary.main,
                            fontWeight: 600,
                            fontSize: '0.85rem'
                          }}
                        >
                          {traderStats?.totalTrades || 0}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          flex: 1,
                          p: 1,
                          borderRadius: '8px',
                          background: alpha(theme.palette.success.main, 0.05),
                          border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: alpha(theme.palette.text.secondary, 0.8),
                            fontSize: '0.7rem',
                            display: 'block'
                          }}
                        >
                          Best
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: theme.palette.success.main,
                            fontWeight: 600,
                            fontSize: '0.85rem'
                          }}
                        >
                          {(traderStats?.maxProfitTrade || 0).toFixed(0)}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          flex: 1,
                          p: 1,
                          borderRadius: '8px',
                          background: alpha(theme.palette.error.main, 0.05),
                          border: `1px solid ${alpha(theme.palette.error.main, 0.15)}`
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: alpha(theme.palette.text.secondary, 0.8),
                            fontSize: '0.7rem',
                            display: 'block'
                          }}
                        >
                          Worst
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: theme.palette.error.main,
                            fontWeight: 600,
                            fontSize: '0.85rem'
                          }}
                        >
                          {(traderStats?.maxLossTrade || 0).toFixed(0)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Card>
              </Stack>
            </OuterBorderContainer>
          </Grid>

          <Grid size={{ xs: 12, lg: 9 }} order={{ xs: 1, lg: 2 }}>
            {/* Compact Performance Section */}
            <Box sx={{ mb: 2, width: '100%' }}>
              <Box
                sx={{
                  p: { xs: 1.25, sm: 1.5 },
                  borderRadius: '12px',
                  background:
                    theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.paper, 0.6)
                      : alpha(theme.palette.background.paper, 0.9),
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  boxShadow: theme.shadows[1],
                  transition: 'all 0.3s ease',
                  width: '100%'
                }}
              >
                {/* Compact Header with inline Time Toggle */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 1.5,
                    gap: 1
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      color: theme.palette.text.primary,
                      fontWeight: 700,
                      fontSize: { xs: '1rem', sm: '1.1rem' },
                      letterSpacing: '-0.01em'
                    }}
                  >
                    Performance
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 0.5,
                      p: 0.25,
                      borderRadius: '8px',
                      background: alpha(theme.palette.background.default, 0.5),
                      border: `1px solid ${alpha(theme.palette.divider, 0.08)}`
                    }}
                  >
                    {['24h', '7d', '1m', '3m'].map((period) => (
                      <Box
                        key={period}
                        onClick={() => setSelectedInterval(period)}
                        sx={{
                          px: { xs: 1, sm: 1.5 },
                          py: 0.5,
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: { xs: '0.7rem', sm: '0.75rem' },
                          fontWeight: 600,
                          color:
                            selectedInterval === period
                              ? theme.palette.primary.contrastText
                              : theme.palette.text.secondary,
                          background:
                            selectedInterval === period
                              ? theme.palette.primary.main
                              : 'transparent',
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            background:
                              selectedInterval === period
                                ? theme.palette.primary.dark
                                : alpha(theme.palette.primary.main, 0.08)
                          }
                        }}
                      >
                        {period.toUpperCase()}
                      </Box>
                    ))}
                  </Box>
                </Box>

                {/* Compact Stats Grid */}
                <Grid container spacing={0.5}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Box
                      sx={{
                        p: 0.75,
                        borderRadius: '6px',
                        background: alpha(
                          (() => {
                            let roiValue;
                            if (selectedInterval === '24h') {
                              // For 24h, calculate ROI from API profit and volume fields
                              const profit24h = traderStats?.profit24h || 0;
                              const volume24h = traderStats?.volume24h || 0;
                              roiValue = volume24h > 0 ? (profit24h / volume24h) * 100 : 0;
                            } else {
                              // Use calculated interval metrics from historical data
                              const intervalMetrics = calculateIntervalMetrics(
                                traderStats,
                                selectedInterval
                              );
                              roiValue = intervalMetrics?.roi || 0;
                            }
                            return roiValue >= 0
                              ? theme.palette.success.main
                              : theme.palette.error.main;
                          })(),
                          0.05
                        ),
                        border: `1px solid ${alpha(
                          (() => {
                            let roiValue;
                            if (selectedInterval === '24h') {
                              // For 24h, calculate ROI from API profit and volume fields
                              const profit24h = traderStats?.profit24h || 0;
                              const volume24h = traderStats?.volume24h || 0;
                              roiValue = volume24h > 0 ? (profit24h / volume24h) * 100 : 0;
                            } else {
                              // Use calculated interval metrics from historical data
                              const intervalMetrics = calculateIntervalMetrics(
                                traderStats,
                                selectedInterval
                              );
                              roiValue = intervalMetrics?.roi || 0;
                            }
                            return roiValue >= 0
                              ? theme.palette.success.main
                              : theme.palette.error.main;
                          })(),
                          0.12
                        )}`,
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          background: alpha(
                            (() => {
                              let roiValue;
                              if (selectedInterval === 'all') {
                                roiValue = traderStats?.avgROI || 0;
                              } else {
                                // Calculate ROI from interval profit and volume
                                const profitKey = `profit${selectedInterval === '7d' ? '7d' : selectedInterval === '1m' ? '1m' : selectedInterval === '3m' ? '3m' : '24h'}`;
                                const volumeKey = `volume${selectedInterval === '7d' ? '7d' : selectedInterval === '1m' ? '1m' : selectedInterval === '3m' ? '3m' : '24h'}`;

                                const profit = traderStats?.[profitKey] || 0;
                                const volume = traderStats?.[volumeKey] || 0;

                                if (volume > 0) {
                                  roiValue = (profit / volume) * 100;
                                } else {
                                  roiValue = 0;
                                }
                              }
                              return roiValue >= 0
                                ? theme.palette.success.main
                                : theme.palette.error.main;
                            })(),
                            0.07
                          )
                        }
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '0.6rem',
                          color: alpha(theme.palette.text.secondary, 0.8),
                          fontWeight: 600,
                          mb: 0.125,
                          textTransform: 'uppercase',
                          letterSpacing: '0.2px'
                        }}
                      >
                        ROI
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: { xs: '0.85rem', sm: '0.95rem' },
                          fontWeight: 700,
                          color: (() => {
                            let roiValue;
                            if (selectedInterval === '24h') {
                              // For 24h, calculate ROI from API profit and volume fields
                              const profit24h = traderStats?.profit24h || 0;
                              const volume24h = traderStats?.volume24h || 0;
                              roiValue = volume24h > 0 ? (profit24h / volume24h) * 100 : 0;
                            } else {
                              // Use calculated interval metrics from historical data
                              const intervalMetrics = calculateIntervalMetrics(
                                traderStats,
                                selectedInterval
                              );
                              roiValue = intervalMetrics?.roi || 0;
                            }
                            return roiValue >= 0
                              ? theme.palette.success.main
                              : theme.palette.error.main;
                          })(),
                          lineHeight: 1
                        }}
                      >
                        {loading
                          ? '-'
                          : (() => {
                              if (selectedInterval === '24h') {
                                // For 24h, calculate ROI from API profit and volume fields
                                const profit24h = traderStats?.profit24h || 0;
                                const volume24h = traderStats?.volume24h || 0;
                                const roi24h = volume24h > 0 ? (profit24h / volume24h) * 100 : 0;
                                return formatNumber(roi24h, 'roi');
                              }
                              // Use calculated interval metrics from historical data for other periods
                              const intervalMetrics = calculateIntervalMetrics(
                                traderStats,
                                selectedInterval
                              );
                              return formatNumber(intervalMetrics?.roi || 0, 'roi');
                            })()}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Box
                      sx={{
                        p: 0.75,
                        borderRadius: '6px',
                        background: alpha(theme.palette.primary.main, 0.05),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          background: alpha(theme.palette.primary.main, 0.07)
                        }
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '0.6rem',
                          color: alpha(theme.palette.text.secondary, 0.8),
                          fontWeight: 600,
                          mb: 0.125,
                          textTransform: 'uppercase',
                          letterSpacing: '0.2px'
                        }}
                      >
                        Volume
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: { xs: '0.85rem', sm: '0.95rem' },
                          fontWeight: 700,
                          color: theme.palette.primary.main,
                          lineHeight: 1
                        }}
                      >
                        {loading
                          ? '-'
                          : (() => {
                              if (selectedInterval === '24h') {
                                // For 24h, use API volume field
                                return formatNumber(traderStats?.volume24h || 0, 'volume');
                              }
                              // Use calculated interval metrics from historical data for other periods
                              const intervalMetrics = calculateIntervalMetrics(
                                traderStats,
                                selectedInterval
                              );
                              return formatNumber(intervalMetrics?.volume || 0, 'volume');
                            })()}
                        <Typography
                          component="span"
                          sx={{
                            fontSize: '0.6rem',
                            color: theme.palette.text.secondary,
                            ml: 0.2,
                            fontWeight: 500
                          }}
                        >
                          XRP
                        </Typography>
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Box
                      sx={{
                        p: 0.75,
                        borderRadius: '6px',
                        background: alpha(theme.palette.success.main, 0.05),
                        border: `1px solid ${alpha(theme.palette.success.main, 0.12)}`,
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          background: alpha(theme.palette.success.main, 0.07)
                        }
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '0.6rem',
                          color: alpha(theme.palette.text.secondary, 0.8),
                          fontWeight: 600,
                          mb: 0.125,
                          textTransform: 'uppercase',
                          letterSpacing: '0.2px'
                        }}
                      >
                        Trades
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: { xs: '0.85rem', sm: '0.95rem' },
                          fontWeight: 700,
                          color: theme.palette.success.main,
                          lineHeight: 1
                        }}
                      >
                        {loading
                          ? '-'
                          : (() => {
                              if (selectedInterval === '24h') {
                                // For 24h, use API trades field
                                return formatNumber(traderStats?.trades24h || 0, 'trades');
                              }
                              // Use calculated interval metrics from historical data for other periods
                              const intervalMetrics = calculateIntervalMetrics(
                                traderStats,
                                selectedInterval
                              );
                              return formatNumber(intervalMetrics?.trades || 0, 'trades');
                            })()}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Box
                      sx={{
                        p: 0.75,
                        borderRadius: '6px',
                        background: alpha(
                          (() => {
                            let profitValue;
                            if (selectedInterval === '24h') {
                              // For 24h, use API profit field
                              profitValue = traderStats?.profit24h || 0;
                            } else {
                              // Use calculated interval metrics from historical data
                              const intervalMetrics = calculateIntervalMetrics(
                                traderStats,
                                selectedInterval
                              );
                              profitValue = intervalMetrics?.profit || 0;
                            }
                            return profitValue >= 0
                              ? theme.palette.success.main
                              : theme.palette.error.main;
                          })(),
                          0.05
                        ),
                        border: `1px solid ${alpha(
                          (() => {
                            let profitValue;
                            if (selectedInterval === '24h') {
                              // For 24h, use API profit field
                              profitValue = traderStats?.profit24h || 0;
                            } else {
                              // Use calculated interval metrics from historical data
                              const intervalMetrics = calculateIntervalMetrics(
                                traderStats,
                                selectedInterval
                              );
                              profitValue = intervalMetrics?.profit || 0;
                            }
                            return profitValue >= 0
                              ? theme.palette.success.main
                              : theme.palette.error.main;
                          })(),
                          0.12
                        )}`,
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          background: alpha(
                            (() => {
                              let profitValue;
                              if (selectedInterval === 'all') {
                                profitValue = traderStats?.totalProfit || 0;
                              } else {
                                const profitKey = `profit${selectedInterval === '7d' ? '7d' : selectedInterval === '1m' ? '1m' : selectedInterval === '3m' ? '3m' : '24h'}`;
                                profitValue = traderStats?.[profitKey] || 0;
                              }
                              return profitValue >= 0
                                ? theme.palette.success.main
                                : theme.palette.error.main;
                            })(),
                            0.07
                          )
                        }
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '0.6rem',
                          color: alpha(theme.palette.text.secondary, 0.8),
                          fontWeight: 600,
                          mb: 0.125,
                          textTransform: 'uppercase',
                          letterSpacing: '0.2px'
                        }}
                      >
                        Profit/Loss
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: { xs: '0.85rem', sm: '0.95rem' },
                          fontWeight: 700,
                          color: (() => {
                            let profitValue;
                            if (selectedInterval === '24h') {
                              // For 24h, use API profit field
                              profitValue = traderStats?.profit24h || 0;
                            } else {
                              // Use calculated interval metrics from historical data
                              const intervalMetrics = calculateIntervalMetrics(
                                traderStats,
                                selectedInterval
                              );
                              profitValue = intervalMetrics?.profit || 0;
                            }
                            return profitValue >= 0
                              ? theme.palette.success.main
                              : theme.palette.error.main;
                          })(),
                          lineHeight: 1
                        }}
                      >
                        {loading
                          ? '-'
                          : (() => {
                              if (selectedInterval === '24h') {
                                // For 24h, use API profit field
                                const profitValue = traderStats?.profit24h || 0;
                                return `${profitValue >= 0 ? '+' : ''}${formatNumber(profitValue, 'currency')} XRP`;
                              }
                              // Use calculated interval metrics from historical data for other periods
                              const intervalMetrics = calculateIntervalMetrics(
                                traderStats,
                                selectedInterval
                              );
                              const profitValue = intervalMetrics?.profit || 0;
                              return `${profitValue >= 0 ? '+' : ''}${formatNumber(profitValue, 'currency')} XRP`;
                            })()}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: '8px',
                        background: alpha(theme.palette.info.main, 0.06),
                        border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          background: alpha(theme.palette.info.main, 0.08)
                        }
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '0.65rem',
                          color: alpha(theme.palette.text.secondary, 0.8),
                          fontWeight: 600,
                          mb: 0.25,
                          textTransform: 'uppercase',
                          letterSpacing: '0.3px'
                        }}
                      >
                        Tokens
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: { xs: '0.95rem', sm: '1.1rem' },
                          fontWeight: 700,
                          color: theme.palette.info.main,
                          lineHeight: 1
                        }}
                      >
                        {loading
                          ? '-'
                          : (() => {
                              if (selectedInterval === '24h') {
                                // For 24h, use API active tokens field
                                return traderStats?.activeTokens24h || 0;
                              }
                              // Use calculated interval metrics from historical data for other periods
                              const intervalMetrics = calculateIntervalMetrics(
                                traderStats,
                                selectedInterval
                              );
                              return intervalMetrics?.activeTokens || 0;
                            })()}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Box>

            {/* Full Width Chart Section */}
            <Box sx={{ mb: 2, width: '100%' }}>
              <Box
                sx={{
                  p: { xs: 2, sm: 3 },
                  borderRadius: '16px',
                  background:
                    theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.paper, 0.6)
                      : alpha(theme.palette.background.paper, 0.9),
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  boxShadow: theme.shadows[2],
                  transition: 'all 0.3s ease',
                  width: '100%'
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2,
                    flexWrap: 'wrap',
                    gap: 2
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      color: theme.palette.text.primary,
                      fontWeight: 700,
                      fontSize: { xs: '1.2rem', sm: '1.4rem' },
                      letterSpacing: '-0.02em'
                    }}
                  >
                    Performance Analytics
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ToggleButtonGroup
                      value={chartView}
                      exclusive
                      onChange={handleChartViewChange}
                      size="small"
                      sx={{
                        bgcolor: alpha(theme.palette.background.default, 0.6),
                        borderRadius: '12px',
                        '& .MuiToggleButton-root': {
                          px: 2,
                          py: 1,
                          border: 'none',
                          borderRadius: '8px',
                          mx: 0.5,
                          color: theme.palette.text.secondary,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.08)
                          },
                          '&.Mui-selected': {
                            bgcolor: theme.palette.primary.main,
                            color: theme.palette.primary.contrastText,
                            '&:hover': {
                              bgcolor: theme.palette.primary.dark
                            }
                          }
                        }
                      }}
                    >
                      <ToggleButton value="roi" title="Return on Investment">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TrendingUpIcon sx={{ fontSize: '0.9rem' }} />
                          ROI
                        </Box>
                      </ToggleButton>
                      <ToggleButton value="activity" title="Trading Activity">
                        Activity
                      </ToggleButton>
                      <ToggleButton value="volume" title="Trading Volume">
                        Volume
                      </ToggleButton>
                    </ToggleButtonGroup>
                    <IconButton
                      onClick={() => handleExpandChart(chartView)}
                      size="small"
                      title="Expand chart"
                      sx={{
                        color:
                          chartView === 'roi'
                            ? theme.palette.primary.main
                            : chartView === 'activity'
                              ? theme.palette.success.main
                              : theme.palette.info.main,
                        bgcolor: alpha(
                          chartView === 'roi'
                            ? theme.palette.primary.main
                            : chartView === 'activity'
                              ? theme.palette.success.main
                              : theme.palette.info.main,
                          0.1
                        ),
                        borderRadius: '8px',
                        p: 1,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: alpha(
                            chartView === 'roi'
                              ? theme.palette.primary.main
                              : chartView === 'activity'
                                ? theme.palette.success.main
                                : theme.palette.info.main,
                            0.2
                          ),
                          transform: 'scale(1.05)'
                        }
                      }}
                    >
                      <OpenInFullIcon sx={{ fontSize: '1rem' }} />
                    </IconButton>
                  </Box>
                </Box>

                {/* Chart Summary Section */}
                {!loading &&
                  (() => {
                    const chartData =
                      chartView === 'roi'
                        ? processChartData
                        : chartView === 'activity'
                          ? processTradeHistoryData
                          : processVolumeHistoryData;

                    if (chartData && chartData.series && chartData.series.length > 0) {
                      const lastValues = chartData.series.map((s) => s.data[s.data.length - 1]);

                      return (
                        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                          {chartData.series.map((serie, index) => {
                            const lastValue = lastValues[index];

                            return (
                              <Box
                                key={index}
                                sx={{
                                  flex: '1 1 150px',
                                  p: 1.5,
                                  borderRadius: '8px',
                                  background: alpha(theme.palette.background.default, 0.5),
                                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{ color: theme.palette.text.secondary, fontSize: '0.7rem' }}
                                >
                                  {serie.name}
                                </Typography>
                                <Typography
                                  variant="h6"
                                  sx={{ fontWeight: 700, fontSize: '1.1rem', mb: 0.5 }}
                                >
                                  {chartView === 'roi'
                                    ? formatNumber(
                                        lastValue,
                                        serie.name.includes('Volume') ? 'volume' : 'roi'
                                      )
                                    : chartView === 'activity'
                                      ? formatNumber(lastValue, 'trades')
                                      : formatNumber(lastValue, 'volume') + ' XRP'}
                                </Typography>
                              </Box>
                            );
                          })}
                        </Box>
                      );
                    }
                    return null;
                  })()}

                {/* Chart Section */}
                <Box
                  sx={{
                    height: { xs: 300, sm: 400 },
                    width: '100%',
                    position: 'relative',
                    minHeight: { xs: 300, sm: 400 }
                  }}
                >
                  {loading ? (
                    <Skeleton variant="rectangular" height="100%" sx={{ borderRadius: '12px' }} />
                  ) : (
                    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
                      {(() => {
                        let chartData = null;
                        if (chartView === 'roi') {
                          chartData = processChartData;
                        } else if (chartView === 'activity') {
                          chartData = processTradeHistoryData;
                        } else if (chartView === 'volume') {
                          chartData = processVolumeHistoryData;
                        }

                        if (!chartData || !chartData.series || chartData.series.length === 0) {
                          return (
                            <Box
                              sx={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column',
                                gap: 1
                              }}
                            >
                              <Typography
                                variant="h6"
                                color="text.secondary"
                                sx={{ fontWeight: 600 }}
                              >
                                No {chartView.toUpperCase()} Data
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {chartView === 'roi' && 'No ROI history available for this account'}
                                {chartView === 'activity' && 'No trading activity data available'}
                                {chartView === 'volume' && 'No volume history available'}
                              </Typography>
                            </Box>
                          );
                        }

                        return (
                          <Box sx={{ width: '100%', height: '100%' }}>
                            {renderChart(chartData, {
                              ...(chartView === 'roi'
                                ? chartOptions
                                : chartView === 'activity'
                                  ? tradeHistoryOptions
                                  : volumeHistoryOptions),
                              legend: { enabled: false }
                            })}
                          </Box>
                        );
                      })()}
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>

            <StyledModal
              open={Boolean(selectedChart)}
              onClose={handleCloseModal}
              aria-labelledby="chart-modal"
            >
              <ModalContent>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 3
                  }}
                >
                  <Typography variant="h6">
                    {selectedChart === 'roi' && 'ROI Performance'}
                    {selectedChart === 'activity' && 'Trading Activity'}
                    {selectedChart === 'volume' && 'Volume History'}
                  </Typography>
                  <IconButton onClick={handleCloseModal} size="small">
                    <ExpandMoreIcon />
                  </IconButton>
                </Box>
                <Box sx={{ height: 600, width: '100%' }}>
                  {selectedChart === 'roi' && renderChart(processChartData, chartOptions)}
                  {selectedChart === 'activity' &&
                    renderChart(processTradeHistoryData, tradeHistoryOptions)}
                  {selectedChart === 'volume' &&
                    renderChart(processVolumeHistoryData, volumeHistoryOptions)}
                </Box>
              </ModalContent>
            </StyledModal>

            <Box sx={{ mt: 3, mb: 1 }}>
              <Typography
                variant="h5"
                sx={{
                  color: theme.palette.text.primary,
                  fontWeight: 700,
                  fontSize: { xs: '1.2rem', sm: '1.4rem' },
                  letterSpacing: '-0.02em',
                  mb: 2
                }}
              >
                Portfolio Details
              </Typography>
            </Box>

            <TabContext value={activeTab}>
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                  background:
                    theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.default, 0.4)
                      : alpha(theme.palette.background.default, 0.6),
                  backdropFilter: 'blur(5px)',
                  borderRadius: '12px 12px 0 0'
                }}
              >
                <ToggleButtonGroup
                  value={activeTab}
                  exclusive
                  onChange={(e, newValue) => newValue !== null && handleChange(e, newValue)}
                  size="medium"
                  sx={{
                    bgcolor: alpha(theme.palette.background.default, 0.5),
                    borderRadius: '8px',
                    padding: 0,
                    border: 'none',
                    '& .MuiToggleButton-root': {
                      border: 'none',
                      borderRadius: '6px',
                      color: theme.palette.text.secondary,
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      textTransform: 'none',
                      px: 1.5,
                      py: 0.75,
                      minWidth: '70px',
                      transition: 'all 0.2s ease',
                      '&.Mui-selected': {
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        fontWeight: 600
                      },
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        color: theme.palette.primary.main
                      }
                    }
                  }}
                >
                  <ToggleButton value="0">Portfolio</ToggleButton>
                  <ToggleButton value="1">NFTs</ToggleButton>
                  <ToggleButton value="2">Ranks</ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <TabPanel sx={{ p: 0 }} value="0">
                <TrustLines
                  account={account}
                  xrpBalance={xrpBalance?.available || 0}
                  onUpdateTotalValue={(value) => setTotalValue(value)}
                  onTrustlinesData={(data) => {}}
                />
              </TabPanel>

              <TabPanel sx={{ p: 0 }} value="1">
                <NFTPortfolio account={account} limit={limit} collection={collection} type={type} />
              </TabPanel>

              <TabPanel sx={{ p: 0 }} value="2">
                <Ranks profileAccount={account} />
              </TabPanel>
            </TabContext>
            <Box sx={{ mt: 2 }}>
              <DeFiHistory account={account} />
            </Box>
          </Grid>
        </Grid>
      </Container>
    </OverviewWrapper>
    </TokenDetailProfiler>
  );
}
