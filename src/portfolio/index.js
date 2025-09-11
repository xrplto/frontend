import React, { useState, useEffect, useRef } from 'react';
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
import { activeRankColors, rankGlowEffect } from 'src/components/Chatbox/RankStyles';
import axios from 'axios';

// Get base URL from environment
const BASE_URL = process.env.API_URL;

// Configure axios defaults with timeout
const axiosInstance = axios.create({
  timeout: 30000 // 30 second timeout for analytics calls
});

// Lazy load chart library only when needed
let createChart, LineSeries, HistogramSeries;
// Dynamically import chart libraries when component mounts
const loadChartLibraries = async () => {
  if (!createChart) {
    const charts = await import('lightweight-charts');
    createChart = charts.createChart;
    LineSeries = charts.LineSeries;
    HistogramSeries = charts.HistogramSeries;
  }
};

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
  padding: theme.spacing(1),
  backdropFilter: 'none',
  backgroundColor: alpha(theme.palette.common.black, 0.5)
}));

const ModalContent = styled(Paper)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  maxWidth: 1000,
  maxHeight: '90vh',
  overflow: 'auto',
  padding: theme.spacing(3),
  background: 'transparent',
  backdropFilter: 'none',
  borderRadius: '24px',
  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
  boxShadow: `
    0 24px 48px ${alpha(theme.palette.common.black, 0.2)}, 
    0 4px 8px ${alpha(theme.palette.common.black, 0.1)},
    inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`
}));

// Styled container for consistent glass-morphism effect
const OuterBorderContainer = styled(Box)(({ theme }) => ({
  background: 'transparent',
  backdropFilter: 'none',
  WebkitBackdropFilter: 'none',
  borderRadius: '16px',
  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
  padding: theme.spacing(2),
  boxShadow: `
    0 8px 32px ${alpha(theme.palette.common.black, 0.12)}, 
    0 1px 2px ${alpha(theme.palette.common.black, 0.04)},
    inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    display: 'none'
  },
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `
      0 12px 40px ${alpha(theme.palette.common.black, 0.15)}, 
      0 2px 4px ${alpha(theme.palette.common.black, 0.05)},
      inset 0 1px 1px ${alpha(theme.palette.common.white, 0.15)}`,
    border: `1px solid ${alpha(theme.palette.divider, 0.25)}`
  }
}));

// Component extracted to avoid nested component definition
const LightweightChartComponent = React.memo(({ chartData, isMobile, theme }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const isDark = theme.palette.mode === 'dark';

  useEffect(() => {
    if (!chartContainerRef.current || !chartData || !chartData.series) return;

    const initChart = async () => {
      // Load chart libraries first
      await loadChartLibraries();
      
      if (!createChart) {
        console.error('Chart library failed to load');
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
          console.error('Error removing chart:', e);
        }
        chartRef.current = null;
      }

      // Create new chart
      const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: isMobile ? 180 : 200,
      layout: {
        background: { type: 'solid', color: 'transparent' },
        textColor: theme.palette.text.primary,
        fontSize: 11,
      },
      grid: {
        vertLines: {
          color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        },
        horzLines: {
          color: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
        },
      },
      crosshair: {
        mode: 0,
        vertLine: {
          color: theme.palette.primary.main,
          width: 1,
          labelBackgroundColor: theme.palette.primary.main,
        },
        horzLine: {
          color: theme.palette.primary.main,
          width: 1,
          labelBackgroundColor: theme.palette.primary.main,
        },
      },
      rightPriceScale: {
        borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      timeScale: {
        borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Add series
    const seriesRefs = [];
    chartData.series.forEach((serie, index) => {
      let series;
      if (serie.type === 'column') {
        series = chart.addSeries(HistogramSeries, {
          color: index === 0 ? theme.palette.primary.main : theme.palette.info.main,
          priceFormat: { type: 'volume' },
        });
      } else {
        series = chart.addSeries(LineSeries, {
          color: index === 0 ? theme.palette.primary.main : theme.palette.success.main,
          lineWidth: 2,
        });
      }

      // Convert data to lightweight-charts format and sort by time
      const data = serie.data
        .map((value, idx) => {
          const timestamp = new Date(chartData.xaxis.categories[idx]).getTime() / 1000;
          // Validate timestamp
          if (isNaN(timestamp) || !isFinite(timestamp)) {
            return null;
          }
          return {
            time: Math.floor(timestamp),
            value: value || 0
          };
        })
        .filter(item => item !== null) // Remove invalid entries
        .sort((a, b) => a.time - b.time) // Sort in ascending order by time
        .filter((item, index, array) => {
          // Remove duplicates - keep only the first occurrence of each timestamp
          return index === 0 || item.time !== array[index - 1].time;
        });
      
      if (data.length > 0) {
        series.setData(data);
      }
      seriesRefs.push(series);
    });

    // Add tooltip
    const toolTip = document.createElement('div');
    toolTip.style = `position: absolute; display: none; padding: 8px; font-size: 12px; z-index: 1000; top: 12px; left: 12px; pointer-events: none; border-radius: 4px; background: ${isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.95)'}; color: ${theme.palette.text.primary}; border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`;
    chartContainerRef.current.appendChild(toolTip);

    chart.subscribeCrosshairMove(param => {
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
          else if (seriesName.includes('Volume')) formattedValue = value.toLocaleString() + ' XRP';
          else if (seriesName.includes('Trades')) formattedValue = value.toLocaleString();
          
          html += `<div>${seriesName}: ${formattedValue}</div>`;
        }
      });

      toolTip.innerHTML = html;
      toolTip.style.display = 'block';
      toolTip.style.left = Math.min(param.point.x + 10, chartContainerRef.current.clientWidth - 150) + 'px';
      toolTip.style.top = '12px';
    });

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartContainerRef.current) {
        const tooltips = chartContainerRef.current.querySelectorAll('div[style*="position: absolute"]');
        tooltips.forEach(tooltip => tooltip.remove());
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
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: isMobile ? 180 : 200,
        color: theme.palette.text.secondary
      }}>
        <Typography variant="body2">Loading chart data...</Typography>
      </Box>
    );
  }

  return <div ref={chartContainerRef} style={{ width: '100%', height: isMobile ? 180 : 200 }} />;
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
    const [xrpBalance, setXrpBalance] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [isAmm, setIsAmm] = useState(false);

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
      try {
        const response = await axiosInstance.get(
          `${BASE_URL}/analytics/trader-stats/${account}`
        );
        setTraderStats(response.data);
        // Set AMM status based on response
        setIsAmm(!!response.data?.AMM);
      } catch (error) {
        console.warn('Error fetching trader stats:', error.message || error);
        // Set empty data on error - prevent runtime crashes
        setTraderStats({});
        setIsAmm(false);
      } finally {
        setLoading(false);
      }
    };

    const fetchXrpBalance = async () => {
      setLoadingBalance(true);
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
          const balanceInXrp = parseInt(balanceInDrops) / 1000000;
          setXrpBalance(balanceInXrp);
        } else {
          setXrpBalance(0);
        }
      } catch (error) {
        console.warn('Error fetching XRP balance:', error.message || error);
        setXrpBalance(0);
      } finally {
        setLoadingBalance(false);
      }
    };

    if (account) {
      fetchTraderStats();
      fetchXrpBalance();
    }
  }, [account]);

  const handleChange = (_, newValue) => {
    setActiveTab(newValue);
  };

  // Process ROI history data for the chart
  const processChartData = () => {
    if (!traderStats?.roiHistory || traderStats.roiHistory.length === 0) {
      return null;
    }

    const sortedHistory = [...traderStats.roiHistory].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    return {
      series: [
        {
          name: 'Daily ROI',
          type: 'line',
          data: sortedHistory.map((item) => item.dailyRoi || 0)
        },
        {
          name: 'Cumulative ROI',
          type: 'line',
          data: sortedHistory.map((item) => item.cumulativeRoi || 0)
        },
        {
          name: 'Volume',
          type: 'column',
          data: sortedHistory.map((item) => item.volume || 0)
        }
      ],
      xaxis: {
        categories: sortedHistory.map((item) =>
          new Date(item.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
        )
      }
    };
  };

  // Process trade history data for the chart
  const processTradeHistoryData = () => {
    if (!traderStats?.tradeHistory || traderStats.tradeHistory.length === 0) {
      return null;
    }

    const sortedHistory = [...traderStats.tradeHistory].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    return {
      series: [
        {
          name: 'Daily Trades',
          type: 'column',
          data: sortedHistory.map((item) => item.trades || 0)
        },
        {
          name: 'Cumulative Trades',
          type: 'line',
          data: sortedHistory.map((item) => item.cumulativeTrades || 0)
        }
      ],
      xaxis: {
        categories: sortedHistory.map((item) =>
          new Date(item.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          })
        )
      }
    };
  };

  const processVolumeHistoryData = () => {
    if (!traderStats?.volumeHistory || traderStats.volumeHistory.length === 0) {
      return null;
    }

    const sortedHistory = [...traderStats.volumeHistory].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    return {
      series: [
        {
          name: 'Daily Volume',
          type: 'column',
          data: sortedHistory.map((item) => item.h24Volume || 0)
        },
        {
          name: 'Cumulative Volume',
          type: 'line',
          data: sortedHistory.map((item) => item.cumulativeVolume || 0)
        }
      ],
      xaxis: {
        categories: sortedHistory.map((item) =>
          new Date(item.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          })
        )
      }
    };
  };

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
          formatter: function() {
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
          formatter: function() {
            return (this.value / 1000).toFixed(0) + 'K';
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
          formatter: function() {
            return (this.value / 1000).toFixed(0) + 'K';
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

  const OuterBorderContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(1),
    borderRadius: '12px',
    background: 'transparent',
    backdropFilter: 'none',
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    marginBottom: theme.spacing(1),
    boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.04)}`,
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(0.75),
      marginBottom: theme.spacing(0.5),
      borderRadius: '8px'
    }
  }));

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
    try {
      const response = await axiosInstance.post('https://api.xrpnft.com/api/account/collectedCreated', {
        account,
        filter: 0,
        limit: 16,
        page: 0,
        search: '',
        subFilter: 'pricexrpasc',
        type: 'collected'
      });
      if (response.data) {
        setCollections(response.data.nfts || []);
        setTotalValue(response.data.totalValue || 0);
      }
    } catch (error) {
      // Silently handle the error - NFT collections are optional
      console.warn('Could not fetch NFT collections:', error.message);
      setCollections([]);
      setTotalValue(0);
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
    return <LightweightChartComponent chartData={chartData} isMobile={isMobile} theme={theme} />;
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
    <OverviewWrapper>
      <Container maxWidth="xl" sx={{ mt: { xs: 1, sm: 3 }, px: { xs: 1, sm: 3 } }}>
        <Grid container spacing={{ xs: 1.5, sm: 3 }}>
          <Grid item xs={12} md={3} order={{ xs: 2, md: 1 }}>
            <OuterBorderContainer>
              <Stack sx={{ height: '100%', justifyContent: 'space-between' }}>
                <Stack
                  sx={{
                    color: theme.palette.text.primary,
                    flex: '1 1 auto'
                  }}
                  spacing={{ xs: 1, sm: 1.5 }}
                >
                  {/* XRP Address Section - removed nested container */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, p: { xs: 1.5, sm: 2 } }}>
                    <Box sx={{ position: 'relative' }}>
                      <Avatar
                        src={getHashIcon(account)}
                        sx={{
                          width: { xs: 32, sm: 40 },
                          height: { xs: 32, sm: 40 },
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
                            fontSize: { xs: '0.75rem', sm: '0.85rem' },
                            letterSpacing: '-0.01em',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            maxWidth: { xs: '140px', sm: '100%' }
                          }}
                        >
                          {isMobile ? `${account.substring(0, 8)}...${account.substring(account.length - 6)}` : account}
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
                          <ContentCopyIcon sx={{ fontSize: '0.75rem' }} />
                        </IconButton>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Chip
                          label={
                            activeRanks[account] === 'verified' ? 'Verified' : 'Trader'
                          }
                          size="small"
                          sx={{
                            bgcolor: alpha(
                              activeRankColors[activeRanks[account]] || theme.palette.primary.main,
                              0.08
                            ),
                            color:
                              activeRankColors[activeRanks[account]] ||
                              theme.palette.primary.main,
                            border: 'none',
                            fontWeight: 600,
                            fontSize: '0.65rem',
                            height: 20,
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
                              fontSize: '0.65rem',
                              height: 20,
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
                      borderRadius: '10px',
                      background: 'transparent',
                      backdropFilter: 'none',
                      WebkitBackdropFilter: 'none',
                      border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                      boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.08)}`,
                      overflow: 'hidden',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.1)}`
                      }
                    }}
                  >
                    <Box sx={{ p: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
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
                      borderRadius: '10px',
                      background: 'transparent',
                      backdropFilter: 'none',
                      WebkitBackdropFilter: 'none',
                      border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                      boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.08)}`,
                      overflow: 'hidden',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.1)}`
                      }
                    }}
                  >
                    <Box sx={{ p: 1.5 }}>
                      {/* Main Balance Row */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1 }}>
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
                              fontSize: '0.75rem',
                              textTransform: 'uppercase',
                              letterSpacing: '0.3px'
                            }}
                          >
                            XRP Balance
                          </Typography>
                        </Box>
                        {loadingBalance ? (
                          <Skeleton width={80} height={20} sx={{ borderRadius: '4px' }} />
                        ) : (
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              color: theme.palette.primary.main,
                              fontSize: '0.95rem'
                            }}
                          >
                            {xrpBalance !== null
                              ? xrpBalance.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })
                              : '0.00'}{' '}
                            XRP
                          </Typography>
                        )}
                      </Box>

                      {/* Buy/Sell Volume Row */}
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Box
                          sx={{
                            flex: 1,
                            p: 1,
                            borderRadius: '6px',
                            background: alpha(theme.palette.success.main, 0.05),
                            border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: alpha(theme.palette.text.secondary, 0.8),
                              fontSize: '0.65rem',
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
                              fontSize: '0.75rem'
                            }}
                          >
                            {(traderStats?.buyVolume || 0).toLocaleString()}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            flex: 1,
                            p: 1,
                            borderRadius: '6px',
                            background: alpha(theme.palette.error.main, 0.05),
                            border: `1px solid ${alpha(theme.palette.error.main, 0.15)}`
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: alpha(theme.palette.text.secondary, 0.8),
                              fontSize: '0.65rem',
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
                              fontSize: '0.75rem'
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
                      borderRadius: '10px',
                      background: 'transparent',
                      border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
                      boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.08)}`,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.1)}`
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
                          fontSize: '0.75rem',
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
                          fontSize: '0.95rem'
                        }}
                      >
                        {formatHoldingTime(traderStats?.avgHoldingTime || 0)}
                      </Typography>
                    </Box>
                  </Box>

                <Box sx={{ mt: 1 }}>
                  <Card
                    sx={{
                      borderRadius: '10px',
                      background: 'transparent',
                      backdropFilter: 'none',
                      WebkitBackdropFilter: 'none',
                      border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                      boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.08)}`,
                      overflow: 'hidden',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.1)}`
                      }
                    }}
                  >
                    <Box sx={{ p: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
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
                          Token Performance
                        </Typography>
                      </Box>

                      {loading ? (
                        <Skeleton
                          variant="rectangular"
                          height={100}
                          sx={{ borderRadius: '6px' }}
                        />
                      ) : (
                        <Box
                          sx={{
                            background: 'transparent',
                            borderRadius: '6px',
                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                          }}
                        >
                          <Table
                            size="small"
                            sx={{
                              '& .MuiTableCell-root': {
                                fontSize: '0.7rem',
                                padding: '6px 8px',
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
                                    fontSize: '0.65rem',
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
                                .slice(tokenPage * tokenRowsPerPage, tokenPage * tokenRowsPerPage + tokenRowsPerPage)
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
                                      <Typography sx={{ fontWeight: 500, fontSize: '0.7rem' }}>{token.name}</Typography>
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
                                      fontSize: '0.7rem'
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
                                      fontSize: '0.7rem'
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
                                '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
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
                    borderRadius: '10px',
                    mt: 1,
                    background: 'transparent',
                    backdropFilter: 'none',
                    WebkitBackdropFilter: 'none',
                    border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                    boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.08)}`,
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.1)}`
                    }
                  }}
                >
                  <Box sx={{ p: 1.5 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: alpha(theme.palette.text.secondary, 0.9),
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                        display: 'block',
                        mb: 1
                      }}
                    >
                      Trading Statistics
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Box
                        sx={{
                          flex: 1,
                          p: 0.75,
                          borderRadius: '6px',
                          background: alpha(theme.palette.primary.main, 0.05),
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: alpha(theme.palette.text.secondary, 0.8),
                            fontSize: '0.65rem',
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
                            fontSize: '0.75rem'
                          }}
                        >
                          {traderStats?.totalTrades || 0}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          flex: 1,
                          p: 0.75,
                          borderRadius: '6px',
                          background: alpha(theme.palette.success.main, 0.05),
                          border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: alpha(theme.palette.text.secondary, 0.8),
                            fontSize: '0.65rem',
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
                            fontSize: '0.75rem'
                          }}
                        >
                          {(traderStats?.maxProfitTrade || 0).toFixed(0)}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          flex: 1,
                          p: 0.75,
                          borderRadius: '6px',
                          background: alpha(theme.palette.error.main, 0.05),
                          border: `1px solid ${alpha(theme.palette.error.main, 0.15)}`
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: alpha(theme.palette.text.secondary, 0.8),
                            fontSize: '0.65rem',
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
                            fontSize: '0.75rem'
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

          <Grid item xs={12} md={9} order={{ xs: 1, md: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                {/* Minimalist Time Period Statistics */}
                <Box sx={{ mb: 1.5 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: '4px',
                      background: theme.palette.mode === 'dark' 
                        ? 'linear-gradient(135deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0.02) 100%)'
                        : 'linear-gradient(135deg, rgba(0,0,0,0.01) 0%, rgba(0,0,0,0.02) 100%)',
                      border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                      transition: 'all 0.2s ease',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Header with Time Toggle */}
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
                          color: theme.palette.text.secondary,
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}
                      >
                        Performance
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 0.5,
                          p: 0.25,
                          borderRadius: '6px',
                          background: alpha(theme.palette.background.paper, 0.3),
                          border: `1px solid ${alpha(theme.palette.divider, 0.05)}`
                        }}
                      >
                        {['24h', '7d', '1m', '3m'].map((period) => (
                          <Box
                            key={period}
                            onClick={() => setSelectedInterval(period)}
                            sx={{
                              px: 1,
                              py: 0.25,
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              color: selectedInterval === period 
                                ? theme.palette.primary.main 
                                : alpha(theme.palette.text.secondary, 0.6),
                              background: selectedInterval === period
                                ? alpha(theme.palette.primary.main, 0.1)
                                : 'transparent',
                              transition: 'all 0.15s ease',
                              '&:hover': {
                                color: theme.palette.primary.main
                              }
                            }}
                          >
                            {period.toUpperCase()}
                          </Box>
                        ))}
                      </Box>
                    </Box>

                    {/* Compact Stats Grid */}
                    <Grid container spacing={1}>
                      <Grid item xs={3}>
                        <Box>
                          <Typography
                            sx={{
                              fontSize: '0.55rem',
                              color: alpha(theme.palette.text.secondary, 0.7),
                              mb: 0.25
                            }}
                          >
                            Volume
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              color: theme.palette.text.primary
                            }}
                          >
                            {loading ? '-' : `${(traderStats?.[`volume${selectedInterval}`] || 0).toFixed(0)}`}
                            <Typography
                              component="span"
                              sx={{
                                fontSize: '0.55rem',
                                color: alpha(theme.palette.text.secondary, 0.6),
                                ml: 0.25
                              }}
                            >
                              XRP
                            </Typography>
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={3}>
                        <Box>
                          <Typography
                            sx={{
                              fontSize: '0.55rem',
                              color: alpha(theme.palette.text.secondary, 0.7),
                              mb: 0.25
                            }}
                          >
                            Trades
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              color: theme.palette.text.primary
                            }}
                          >
                            {loading ? '-' : (traderStats?.[`trades${selectedInterval}`] || 0)}
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={3}>
                        <Box>
                          <Typography
                            sx={{
                              fontSize: '0.55rem',
                              color: alpha(theme.palette.text.secondary, 0.7),
                              mb: 0.25
                            }}
                          >
                            P/L
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              color: (traderStats?.[`profit${selectedInterval}`] || 0) >= 0
                                ? theme.palette.success.main
                                : theme.palette.error.main
                            }}
                          >
                            {loading ? '-' : `${(traderStats?.[`profit${selectedInterval}`] || 0) >= 0 ? '+' : ''}${(traderStats?.[`profit${selectedInterval}`] || 0).toFixed(0)}`}
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={3}>
                        <Box>
                          <Typography
                            sx={{
                              fontSize: '0.55rem',
                              color: alpha(theme.palette.text.secondary, 0.7),
                              mb: 0.25
                            }}
                          >
                            Tokens
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              color: theme.palette.text.primary
                            }}
                          >
                            {loading ? '-' : (traderStats?.[`activeTokens${selectedInterval}`] || 0)}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 1.5, sm: 2 } }}>
              <Grid item xs={12}>
                <Card
                  sx={{
                    p: { xs: 1, sm: 1.5 },
                    height: '100%',
                    borderRadius: '4px',
                    background: theme.palette.mode === 'dark' 
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0.02) 100%)'
                      : 'linear-gradient(135deg, rgba(0,0,0,0.01) 0%, rgba(0,0,0,0.02) 100%)',
                    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`
                    }
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 1
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        color: theme.palette.text.primary,
                        fontWeight: 600,
                        fontSize: { xs: '0.95rem', sm: '1rem' },
                        letterSpacing: '-0.02em'
                      }}
                    >
                      Performance Analytics
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <ToggleButtonGroup
                        value={chartView}
                        exclusive
                        onChange={handleChartViewChange}
                        size="small"
                        sx={{
                          bgcolor: alpha(theme.palette.background.default, 0.5),
                          '& .MuiToggleButton-root': {
                            px: 1.5,
                            py: 0.25,
                            border: 'none',
                            borderRadius: '6px',
                            mx: 0.25,
                            color: theme.palette.text.secondary,
                            fontSize: '0.75rem',
                            fontWeight: 500,
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
                        <ToggleButton value="roi">ROI</ToggleButton>
                        <ToggleButton value="activity">Activity</ToggleButton>
                        <ToggleButton value="volume">Volume</ToggleButton>
                      </ToggleButtonGroup>
                      <IconButton
                        onClick={() => handleExpandChart(chartView)}
                        size="small"
                        sx={{
                          color: chartView === 'roi' ? theme.palette.primary.main : 
                                 chartView === 'activity' ? theme.palette.success.main : 
                                 theme.palette.info.main,
                          bgcolor: alpha(
                            chartView === 'roi' ? theme.palette.primary.main : 
                            chartView === 'activity' ? theme.palette.success.main : 
                            theme.palette.info.main, 
                            0.08
                          ),
                          borderRadius: '8px',
                          p: 0.5,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: alpha(
                              chartView === 'roi' ? theme.palette.primary.main : 
                              chartView === 'activity' ? theme.palette.success.main : 
                              theme.palette.info.main, 
                              0.15
                            ),
                            transform: 'scale(1.05)'
                          }
                        }}
                      >
                        <OpenInFullIcon sx={{ fontSize: '0.9rem' }} />
                      </IconButton>
                    </Box>
                  </Box>
                  {/* Legend Section */}
                  <Box sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 2, 
                    mb: 2,
                    justifyContent: 'center',
                    px: 1
                  }}>
                    {chartView === 'roi' && (
                      <>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Box sx={{ 
                            width: 12, 
                            height: 12, 
                            bgcolor: theme.palette.primary.main, 
                            borderRadius: '2px' 
                          }} />
                          <Typography variant="caption" color="text.secondary">
                            Daily ROI
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Box sx={{ 
                            width: 12, 
                            height: 2, 
                            bgcolor: theme.palette.secondary.main, 
                            borderRadius: '1px' 
                          }} />
                          <Typography variant="caption" color="text.secondary">
                            Cumulative ROI
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Box sx={{ 
                            width: 12, 
                            height: 12, 
                            bgcolor: theme.palette.info.main, 
                            borderRadius: '2px' 
                          }} />
                          <Typography variant="caption" color="text.secondary">
                            Volume
                          </Typography>
                        </Box>
                      </>
                    )}
                    {chartView === 'activity' && (
                      <>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Box sx={{ 
                            width: 12, 
                            height: 12, 
                            bgcolor: theme.palette.primary.main, 
                            borderRadius: '2px' 
                          }} />
                          <Typography variant="caption" color="text.secondary">
                            Daily Trades
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Box sx={{ 
                            width: 12, 
                            height: 2, 
                            bgcolor: theme.palette.secondary.main, 
                            borderRadius: '1px' 
                          }} />
                          <Typography variant="caption" color="text.secondary">
                            Cumulative Trades
                          </Typography>
                        </Box>
                      </>
                    )}
                    {chartView === 'volume' && (
                      <>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Box sx={{ 
                            width: 12, 
                            height: 12, 
                            bgcolor: theme.palette.info.main, 
                            borderRadius: '2px' 
                          }} />
                          <Typography variant="caption" color="text.secondary">
                            Daily Volume
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Box sx={{ 
                            width: 12, 
                            height: 2, 
                            bgcolor: theme.palette.warning.main, 
                            borderRadius: '1px' 
                          }} />
                          <Typography variant="caption" color="text.secondary">
                            Cumulative Volume
                          </Typography>
                        </Box>
                      </>
                    )}
                  </Box>
                  
                  {/* Chart Section */}
                  <Box sx={{ height: { xs: 160, sm: 220 }, position: 'relative', minHeight: { xs: 160, sm: 220 } }}>
                    {loading ? (
                      <Skeleton variant="rectangular" height="100%" sx={{ borderRadius: '12px' }} />
                    ) : (
                      <>
                        {chartView === 'roi' && renderChart(processChartData(), { ...chartOptions, legend: { enabled: false } })}
                        {chartView === 'activity' && renderChart(processTradeHistoryData(), { ...tradeHistoryOptions, legend: { enabled: false } })}
                        {chartView === 'volume' && renderChart(processVolumeHistoryData(), { ...volumeHistoryOptions, legend: { enabled: false } })}
                      </>
                    )}
                  </Box>
                </Card>
              </Grid>
            </Grid>

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
                  {selectedChart === 'roi' && renderChart(processChartData(), chartOptions)}
                  {selectedChart === 'activity' &&
                    renderChart(processTradeHistoryData(), tradeHistoryOptions)}
                  {selectedChart === 'volume' &&
                    renderChart(processVolumeHistoryData(), volumeHistoryOptions)}
                </Box>
              </ModalContent>
            </StyledModal>

            <TabContext value={activeTab}>
              <Box
                sx={{
                  px: 3,
                  py: 2,
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
                  background: 'transparent'
                }}
              >
                <ToggleButtonGroup
                  value={activeTab}
                  exclusive
                  onChange={(e, newValue) => newValue !== null && handleChange(e, newValue)}
                  size="medium"
                  sx={{
                    bgcolor: 'transparent',
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
                  <ToggleButton value="0">
                    Tokens
                  </ToggleButton>
                  <ToggleButton value="1">
                    NFTs
                  </ToggleButton>
                  <ToggleButton value="2">
                    Ranks
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <TabPanel sx={{ p: 0 }} value="0">
                <TrustLines
                  account={account}
                  xrpBalance={xrpBalance}
                  onUpdateTotalValue={(value) => setTotalValue(value)}
                />
              </TabPanel>
              
              <TabPanel sx={{ p: 0 }} value="1">
                <NFTPortfolio
                  account={account}
                  limit={limit}
                  collection={collection}
                  type={type}
                />
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
  );
}
