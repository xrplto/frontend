import React, { useState, useEffect } from 'react';
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
  Modal
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Verified as VerifiedIcon } from '@mui/icons-material';
import styled from '@emotion/styled';
import { getHashIcon } from 'src/utils/extra';
import TrustLines from './TrustLines';
import { TabContext, TabPanel } from '@mui/lab';
import NFTPortfolio from './NFTPortfolio';
import History from './History';
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

import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

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
        console.error('Error fetching trader stats:', error);
        // Set empty data on error
        setTraderStats(null);
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
        console.warn('Error fetching XRP balance:', error.message);
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
      position: 'bottom',
      horizontalAlign: 'center',
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
      position: 'bottom',
      horizontalAlign: 'center',
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
    try {
      if (!chartData || !chartData.series) {
        return (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
            color: theme.palette.text.secondary
          }}>
            <Typography variant="body2">Loading chart data...</Typography>
          </Box>
        );
      }

      // Convert ApexCharts series to Highcharts format
      const highchartsSeries = chartData.series.map((serie) => {
        const seriesData = serie.data.map((value, index) => {
          const timestamp = new Date(chartData.xaxis.categories[index]).getTime();
          return [
            timestamp,
            value
          ];
        });

        const seriesConfig = {
          name: serie.name,
          type: serie.type || type,
          data: seriesData,
          ...(serie.type === 'column' && {
            borderRadius: 6,
            borderWidth: 0
          })
        };

        // Map series to correct yAxis based on series name
        if (options.yAxis && Array.isArray(options.yAxis) && options.yAxis.length > 1) {
          if (serie.name === 'Volume' || serie.name === 'Cumulative Volume' || serie.name === 'Cumulative Trades' || serie.name === 'Cumulative ROI') {
            seriesConfig.yAxis = 1;
          } else {
            seriesConfig.yAxis = 0;
          }
        }

        return seriesConfig;
      });

      // Ensure basic Highcharts configuration
      const highchartsOptions = {
        chart: {
          type: type,
          backgroundColor: 'transparent',
          height: isMobile ? 180 : 200,
          margin: [10, 10, 70, isMobile ? 35 : 45],
          spacing: [5, 5, 5, 5],
          animation: {
            duration: 800
          }
        },
        title: {
          text: null
        },
        credits: {
          enabled: false
        },
        xAxis: {
          type: 'datetime',
          labels: {
            style: {
              color: theme.palette.text.secondary,
              fontSize: '10px'
            },
            rotation: -45,
            align: 'right',
            y: 40,
            formatter: function() {
              // Format based on data range
              const range = this.axis.max - this.axis.min;
              const days = range / (24 * 3600 * 1000);
              
              if (days > 180) {
                return Highcharts.dateFormat('%b %Y', this.value);
              } else if (days > 60) {
                return Highcharts.dateFormat('%b %d', this.value);
              } else {
                return Highcharts.dateFormat('%m/%d', this.value);
              }
            }
          },
          tickPixelInterval: 80, // Dynamic spacing based on chart width
          minPadding: 0.05,
          maxPadding: 0.05
        },
        yAxis: options.yAxis || {
          title: {
            text: null
          },
          labels: {
            style: {
              color: theme.palette.text.secondary,
              fontSize: '10px'
            }
          },
          gridLineWidth: 1,
          gridLineColor: alpha(theme.palette.divider, 0.1)
        },
        tooltip: {
          shared: true,
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)',
          borderColor: theme.palette.divider,
          borderRadius: 8,
          style: {
            color: theme.palette.text.primary,
            fontSize: '11px'
          },
          formatter: function() {
            let tooltip = '<b>' + Highcharts.dateFormat('%b %d, %Y', this.x) + '</b><br/>';
            
            this.points.forEach(point => {
              const value = point.y;
              let formattedValue;
              
              if (point.series.name.includes('ROI') || point.series.name.includes('%')) {
                formattedValue = value.toFixed(2) + '%';
              } else if (point.series.name.includes('Volume')) {
                formattedValue = value.toLocaleString(undefined, { maximumFractionDigits: 0 }) + ' XRP';
              } else if (point.series.name.includes('Trades')) {
                formattedValue = value.toLocaleString();
              } else {
                formattedValue = value.toLocaleString();
              }
              
              tooltip += '<span style="color:' + point.color + '">●</span> ' + 
                        point.series.name + ': <b>' + formattedValue + '</b><br/>';
            });
            
            return tooltip;
          }
        },
        plotOptions: options.plotOptions || {},
        legend: options.legend || {
          enabled: true,
          itemStyle: {
            color: theme.palette.text.primary,
            fontSize: '11px'
          },
          margin: 5,
          padding: 2,
          itemMarginTop: 2,
          itemMarginBottom: 2
        },
        colors: [
          theme.palette.primary.main,
          theme.palette.success.main,
          alpha(theme.palette.info.main, 0.6),
          theme.palette.warning.main,
          theme.palette.error.main
        ],
        ...options,
        series: highchartsSeries
      };

      return <HighchartsReact highcharts={Highcharts} options={highchartsOptions} />;
    } catch (error) {
      console.error('Error rendering chart:', error);
      return (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: { xs: 200, sm: 300 },
          color: theme.palette.error.main,
          flexDirection: 'column',
          gap: 1
        }}>
          <Typography variant="body2">Error loading chart</Typography>
          <Typography variant="caption" color="text.secondary">
            {error.message || 'Please try again later'}
          </Typography>
        </Box>
      );
    }
  };

  useEffect(() => {
    // Fetch data
    const fetchData = async () => {
      try {
        // Your data fetching logic
        // const result = await fetchChartData(); // This line caused the error
        // setChartData({ labels: [], datasets: [] }); // Ensure chartData is initialized
      } catch (error) {
        console.error('Error fetching chart data:', error);
        // Set empty but valid chart data structure
        // setChartData({ labels: [], datasets: [] });
      } finally {
        // setIsLoading(false);
      }
    };

    // fetchData(); // Commenting out or removing this call
  }, [account, collection, type]);




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
                  <Box
                    sx={{
                      p: { xs: 1.5, sm: 2 },
                      borderRadius: { xs: '12px', sm: '16px' },
                      background: 'transparent',
                      backdropFilter: 'none',
                      WebkitBackdropFilter: 'none',
                      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                      boxShadow: `
                        0 8px 32px ${alpha(theme.palette.common.black, 0.12)}, 
                        0 1px 2px ${alpha(theme.palette.common.black, 0.04)},
                        inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`,
                      mb: { xs: 1, sm: 2 },
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'none',
                        pointerEvents: 'none'
                      },
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `
                          0 12px 40px ${alpha(theme.palette.common.black, 0.15)}, 
                          0 2px 4px ${alpha(theme.palette.common.black, 0.05)},
                          inset 0 1px 1px ${alpha(theme.palette.common.white, 0.15)}`,
                        border: `1px solid ${alpha(theme.palette.divider, 0.25)}`
                      }
                    }}
                  >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 2 } }}>
                        <Box sx={{ position: 'relative' }}>
                          <Avatar
                            src={getHashIcon(account)}
                            sx={{
                              width: { xs: 36, sm: 56 },
                              height: { xs: 36, sm: 56 },
                              border: `3px solid ${activeRankColors[activeRanks[account]] || '#808080'}`,
                              boxShadow: `0 0 20px ${alpha(activeRankColors[activeRanks[account]] || '#808080', 0.4)}, 0 8px 32px ${alpha(theme.palette.common.black, 0.12)}`,
                              transition: 'all 0.3s ease'
                            }}
                          />
                          {activeRanks[account] === 'verified' && (
                            <Box
                              sx={{
                                position: 'absolute',
                                bottom: -2,
                                right: -2,
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #1DA1F2 0%, #0d8bd9 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: `0 2px 8px ${alpha('#1DA1F2', 0.3)}`
                              }}
                            >
                              <VerifiedIcon
                                sx={{
                                  fontSize: { xs: '0.7rem', sm: '0.8rem' },
                                  color: 'white'
                                }}
                              />
                            </Box>
                          )}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="h6"
                            sx={{
                              color:
                                activeRankColors[activeRanks[account]] ||
                                theme.palette.text.primary,
                              fontWeight: 700,
                              fontSize: { xs: '0.8rem', sm: '1.1rem' },
                              letterSpacing: '-0.01em',
                              mb: 0.5,
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {account}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={
                                activeRanks[account] === 'verified' ? 'Verified Account' : 'Trader'
                              }
                              size="small"
                              sx={{
                                bgcolor: 'transparent',
                                color:
                                  activeRankColors[activeRanks[account]] ||
                                  theme.palette.primary.main,
                                border: `1px solid ${activeRankColors[activeRanks[account]] || theme.palette.primary.main}`,
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                height: 24,
                                '& .MuiChip-label': {
                                  px: 1.5
                                }
                              }}
                            />
                            {isAmm && (
                              <Chip
                                label="AMM"
                                size="small"
                                sx={{
                                  bgcolor: 'transparent',
                                  color: theme.palette.warning.main,
                                  border: `1px solid ${theme.palette.warning.main}`,
                                  fontWeight: 600,
                                  fontSize: '0.7rem',
                                  height: 24,
                                  '& .MuiChip-label': {
                                    px: 1.5
                                  }
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                      </Box>
                  </Box>
                </Stack>

                <Card
                    sx={{
                      borderRadius: { xs: '12px', sm: '16px' },
                      background: 'transparent',
                      backdropFilter: 'none',
                      WebkitBackdropFilter: 'none',
                      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                      boxShadow: `
                        0 8px 32px ${alpha(theme.palette.common.black, 0.12)}, 
                        0 1px 2px ${alpha(theme.palette.common.black, 0.04)},
                        inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`,
                      overflow: 'hidden',
                      position: 'relative',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `linear-gradient(
                          135deg,
                          ${alpha(theme.palette.success.main, 0.05)} 0%,
                          transparent 50%,
                          ${alpha(theme.palette.success.light, 0.05)} 100%
                        )`,
                        pointerEvents: 'none'
                      },
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `
                          0 12px 40px ${alpha(theme.palette.common.black, 0.15)}, 
                          0 2px 4px ${alpha(theme.palette.common.black, 0.05)},
                          inset 0 1px 1px ${alpha(theme.palette.common.white, 0.15)}`,
                        border: `1px solid ${alpha(theme.palette.divider, 0.25)}`
                      }
                    }}
                  >
                    <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 2 }, mb: { xs: 1, sm: 2 } }}>
                        <Box
                          sx={{
                            p: { xs: 0.8, sm: 1.2 },
                            borderRadius: '14px',
                            background: 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 6px 20px ${alpha(theme.palette.success.main, 0.3)}`,
                            position: 'relative',
                            '&::after': {
                              content: '""',
                              position: 'absolute',
                              inset: 0,
                              borderRadius: '14px',
                              background: 'transparent',
                              pointerEvents: 'none'
                            }
                          }}
                        >
                          <TrendingUpIcon
                            sx={{
                              fontSize: '1.4rem',
                              color: 'white',
                              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                            }}
                          />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="h6"
                            sx={{
                              color: theme.palette.text.primary,
                              fontWeight: 700,
                              fontSize: '1.1rem',
                              letterSpacing: '-0.01em',
                              mb: 0.5
                            }}
                          >
                            Total Trading Volume
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: alpha(theme.palette.text.secondary, 0.8),
                              fontSize: '0.8rem'
                            }}
                          >
                            Lifetime trading activity
                          </Typography>
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          p: 2,
                          borderRadius: '12px',
                          background: 'transparent',
                          border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                          textAlign: 'center'
                        }}
                      >
                        {loading ? (
                          <Skeleton
                            width={120}
                            height={32}
                            sx={{ mx: 'auto', borderRadius: '8px' }}
                          />
                        ) : (
                          <Typography
                            variant="h4"
                            sx={{
                              color: theme.palette.success.main,
                              fontWeight: 800,
                              fontSize: { xs: '1.4rem', sm: '1.8rem' },
                              letterSpacing: '-0.02em',
                              mb: 0.5
                            }}
                          >
                            {`${traderStats?.totalVolume?.toLocaleString() || 0} `}
                            <Typography
                              component="span"
                              variant="caption"
                              sx={{
                                color: alpha(theme.palette.success.main, 0.7),
                                fontWeight: 600,
                                fontSize: { xs: '0.7rem', sm: '0.8rem' },
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}
                            >
                              XRP
                            </Typography>
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Card>

                  {/* XRP Balance Display */}
                  <Card
                    sx={{
                      mt: { xs: 0.75, sm: 1.5 },
                      borderRadius: { xs: '12px', sm: '16px' },
                      background: 'transparent',
                      backdropFilter: 'blur(40px) saturate(150%)',
                      WebkitBackdropFilter: 'blur(40px) saturate(150%)',
                      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                      boxShadow: `
                        0 8px 32px ${alpha(theme.palette.common.black, 0.12)}, 
                        0 1px 2px ${alpha(theme.palette.common.black, 0.04)},
                        inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`,
                      overflow: 'hidden',
                      position: 'relative',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `linear-gradient(
                          135deg,
                          ${alpha(theme.palette.primary.main, 0.05)} 0%,
                          transparent 50%,
                          ${alpha(theme.palette.warning.main, 0.05)} 100%
                        )`,
                        pointerEvents: 'none'
                      },
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `
                          0 12px 40px ${alpha(theme.palette.common.black, 0.15)}, 
                          0 2px 4px ${alpha(theme.palette.common.black, 0.05)},
                          inset 0 1px 1px ${alpha(theme.palette.common.white, 0.15)}`,
                        border: `1px solid ${alpha(theme.palette.divider, 0.25)}`
                      }
                    }}
                  >
                    {/* Header Section */}
                    <Box
                      sx={{
                        p: 2.5,
                        background: 'transparent',
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box
                            sx={{
                              p: 1,
                              borderRadius: '12px',
                              background: 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
                            }}
                          >
                            <AccountBalanceWalletIcon
                              sx={{
                                fontSize: '1.2rem',
                                color: 'white',
                                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
                              }}
                            />
                          </Box>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 600,
                              color: theme.palette.text.primary,
                              fontSize: '1.1rem',
                              letterSpacing: '-0.01em'
                            }}
                          >
                            XRP Balance
                          </Typography>
                        </Box>
                        {loadingBalance ? (
                          <Skeleton width={120} height={32} sx={{ borderRadius: '8px' }} />
                        ) : (
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography
                              variant="h5"
                              sx={{
                                fontWeight: 700,
                                color: theme.palette.primary.main,
                                fontSize: '1.4rem',
                                letterSpacing: '-0.02em',
                                lineHeight: 1.2
                              }}
                            >
                              {xrpBalance !== null
                                ? xrpBalance.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                  })
                                : '0.00'}{' '}
                              <Typography
                                component="span"
                                variant="caption"
                                sx={{
                                  color: alpha(theme.palette.text.secondary, 0.8),
                                  fontWeight: 500,
                                  fontSize: '0.75rem',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px'
                                }}
                              >
                                XRP
                              </Typography>
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>

                    {/* Stats Section */}
                    <Box sx={{ p: 2.5 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Box
                            sx={{
                              p: 2,
                              borderRadius: '12px',
                              background: 'transparent',
                              border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.15)}`
                              }
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                color: alpha(theme.palette.text.secondary, 0.9),
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                textTransform: 'uppercase',
                                letterSpacing: { xs: '0.3px', sm: '0.4px' },
                                mb: 0.5,
                                display: 'block'
                              }}
                            >
                              Buy Volume
                            </Typography>
                            <Typography
                              variant="h6"
                              sx={{
                                color: theme.palette.success.main,
                                fontWeight: 700,
                                fontSize: '1rem',
                                letterSpacing: '-0.01em'
                              }}
                            >
                              {`${(traderStats?.buyVolume || 0).toLocaleString()} `}
                              <Typography
                                component="span"
                                variant="caption"
                                sx={{
                                  color: alpha(theme.palette.success.main, 0.7),
                                  fontWeight: 500,
                                  fontSize: '0.7rem'
                                }}
                              >
                                XRP
                              </Typography>
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box
                            sx={{
                              p: 2,
                              borderRadius: '12px',
                              background: 'transparent',
                              border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`,
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.15)}`
                              }
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                color: alpha(theme.palette.text.secondary, 0.9),
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                textTransform: 'uppercase',
                                letterSpacing: { xs: '0.3px', sm: '0.4px' },
                                mb: 0.5,
                                display: 'block'
                              }}
                            >
                              Sell Volume
                            </Typography>
                            <Typography
                              variant="h6"
                              sx={{
                                color: theme.palette.error.main,
                                fontWeight: 700,
                                fontSize: '1rem',
                                letterSpacing: '-0.01em'
                              }}
                            >
                              {`${(traderStats?.sellVolume || 0).toLocaleString()} `}
                              <Typography
                                component="span"
                                variant="caption"
                                sx={{
                                  color: alpha(theme.palette.error.main, 0.7),
                                  fontWeight: 500,
                                  fontSize: '0.7rem'
                                }}
                              >
                                XRP
                              </Typography>
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12}>
                          <Box
                            sx={{
                              p: 2,
                              borderRadius: '12px',
                              background: 'transparent',
                              border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.15)}`
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
                                  fontSize: '0.7rem',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px'
                                }}
                              >
                                Avg Holding Time
                              </Typography>
                              <Box sx={{ textAlign: 'right' }}>
                                <Typography
                                  variant="h6"
                                  sx={{
                                    color: theme.palette.info.main,
                                    fontWeight: 700,
                                    fontSize: '1.1rem',
                                    letterSpacing: '-0.01em'
                                  }}
                                >
                                  {formatHoldingTime(traderStats?.avgHoldingTime || 0)}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  </Card>

                <Box sx={{ mt: { xs: 0.75, sm: 1.5 } }}>
                  <Card
                    sx={{
                      borderRadius: { xs: '12px', sm: '16px' },
                      background: 'transparent',
                      backdropFilter: 'none',
                      WebkitBackdropFilter: 'none',
                      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                      boxShadow: `
                        0 8px 32px ${alpha(theme.palette.common.black, 0.12)}, 
                        0 1px 2px ${alpha(theme.palette.common.black, 0.04)},
                        inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`,
                      overflow: 'hidden',
                      position: 'relative',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `linear-gradient(
                          135deg,
                          ${alpha(theme.palette.warning.main, 0.05)} 0%,
                          transparent 50%,
                          ${alpha(theme.palette.success.main, 0.05)} 100%
                        )`,
                        pointerEvents: 'none'
                      },
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `
                          0 12px 40px ${alpha(theme.palette.common.black, 0.15)}, 
                          0 2px 4px ${alpha(theme.palette.common.black, 0.05)},
                          inset 0 1px 1px ${alpha(theme.palette.common.white, 0.15)}`,
                        border: `1px solid ${alpha(theme.palette.divider, 0.25)}`
                      }
                    }}
                  >
                    <Box sx={{ p: 2.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
                        <Box
                          sx={{
                            p: { xs: 0.8, sm: 1.2 },
                            borderRadius: '14px',
                            background: 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 6px 20px ${alpha(theme.palette.warning.main, 0.3)}`,
                            position: 'relative',
                            '&::after': {
                              content: '""',
                              position: 'absolute',
                              inset: 0,
                              borderRadius: '14px',
                              background: 'transparent',
                              pointerEvents: 'none'
                            }
                          }}
                        >
                          <TrendingUpIcon
                            sx={{
                              fontSize: '1.4rem',
                              color: 'white',
                              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                            }}
                          />
                        </Box>
                        <Box>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              color: theme.palette.text.primary,
                              fontSize: '1.1rem',
                              letterSpacing: '-0.01em',
                              mb: 0.5
                            }}
                          >
                            Token Performance
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: alpha(theme.palette.text.secondary, 0.8),
                              fontSize: '0.8rem'
                            }}
                          >
                            Individual token results
                          </Typography>
                        </Box>
                      </Box>

                      {loading ? (
                        <Skeleton
                          variant="rectangular"
                          height={200}
                          sx={{ borderRadius: '12px' }}
                        />
                      ) : (
                        <Box
                          sx={{
                            background: 'transparent',
                            borderRadius: '12px',
                            overflow: 'auto',
                            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                            maxWidth: '100%',
                            maxHeight: { xs: '150px', sm: '200px' },
                            '&::-webkit-scrollbar': {
                              height: '6px'
                            },
                            '&::-webkit-scrollbar-track': {
                              background: alpha(theme.palette.divider, 0.1)
                            },
                            '&::-webkit-scrollbar-thumb': {
                              background: alpha(theme.palette.primary.main, 0.3),
                              borderRadius: '3px'
                            }
                          }}
                        >
                          <Table
                            size="small"
                            sx={{
                              minWidth: 'auto',
                              '& .MuiTableCell-root': {
                                fontSize: { xs: '0.75rem', sm: '0.85rem' },
                                padding: { xs: '8px 12px', sm: '12px 16px' },
                                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}`
                              }
                            }}
                          >
                            <TableHead>
                              <TableRow
                                sx={{
                                  background: 'transparent',
                                  '& .MuiTableCell-root': {
                                    fontWeight: 700,
                                    color: theme.palette.text.primary,
                                    borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`
                                  }
                                }}
                              >
                                <TableCell>Token</TableCell>
                                <TableCell align="right">ROI</TableCell>
                                <TableCell align="right">Profit</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {traderStats?.tokenPerformance?.map((token, index) => (
                                <TableRow
                                  key={token.tokenId}
                                  sx={{
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.04)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                                      transform: 'translateX(2px)'
                                    }
                                  }}
                                >
                                  <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Box
                                        sx={{
                                          width: 8,
                                          height: 8,
                                          borderRadius: '50%',
                                          bgcolor:
                                            token.roi >= 0
                                              ? theme.palette.success.main
                                              : theme.palette.error.main,
                                          boxShadow: `0 0 8px ${alpha(token.roi >= 0 ? theme.palette.success.main : theme.palette.error.main, 0.4)}`
                                        }}
                                      />
                                      <Typography sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>{token.name}</Typography>
                                    </Box>
                                  </TableCell>
                                  <TableCell
                                    align="right"
                                    sx={{
                                      color:
                                        token.roi >= 0
                                          ? theme.palette.success.main
                                          : theme.palette.error.main,
                                      fontWeight: 700,
                                      fontSize: '0.9rem'
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
                                      fontWeight: 700,
                                      fontSize: '0.9rem'
                                    }}
                                  >
                                    {token.profit.toFixed(2)} XRP
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </Box>
                      )}
                    </Box>
                  </Card>
                </Box>

                <Card
                  sx={{
                    borderRadius: { xs: '12px', sm: '16px' },
                    mt: { xs: 0.75, sm: 1.5 },
                    background: 'transparent',
                    backdropFilter: 'blur(40px) saturate(150%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(150%)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    boxShadow: `
                      0 8px 32px ${alpha(theme.palette.common.black, 0.12)}, 
                      0 1px 2px ${alpha(theme.palette.common.black, 0.04)},
                      inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`,
                    overflow: 'hidden',
                    position: 'relative',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: `linear-gradient(
                        135deg,
                        ${alpha(theme.palette.info.main, 0.05)} 0%,
                        transparent 50%,
                        ${alpha(theme.palette.primary.main, 0.05)} 100%
                      )`,
                      pointerEvents: 'none'
                    },
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `
                        0 12px 40px ${alpha(theme.palette.common.black, 0.15)}, 
                        0 2px 4px ${alpha(theme.palette.common.black, 0.05)},
                        inset 0 1px 1px ${alpha(theme.palette.common.white, 0.15)}`,
                      border: `1px solid ${alpha(theme.palette.divider, 0.25)}`
                    }
                  }}
                >
                  <Box sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
                      <Box
                        sx={{
                          p: 1.2,
                          borderRadius: '14px',
                          background: 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: `0 6px 20px ${alpha(theme.palette.info.main, 0.3)}`,
                          position: 'relative',
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '14px',
                            background: `linear-gradient(135deg, ${alpha(theme.palette.common.white, 0.2)} 0%, transparent 100%)`,
                            pointerEvents: 'none'
                          }
                        }}
                      >
                        <TrendingUpIcon
                          sx={{
                            fontSize: '1.4rem',
                            color: 'white',
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                          }}
                        />
                      </Box>
                      <Box>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            color: theme.palette.text.primary,
                            fontSize: '1.1rem',
                            letterSpacing: '-0.01em',
                            mb: 0.5
                          }}
                        >
                          Trading Statistics
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: alpha(theme.palette.text.secondary, 0.8),
                            fontSize: '0.8rem'
                          }}
                        >
                          Performance metrics
                        </Typography>
                      </Box>
                    </Box>
                    <Stack spacing={2}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: '12px',
                          background: 'transparent',
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
                          }
                        }}
                      >
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography
                            sx={{
                              fontWeight: 600,
                              color: alpha(theme.palette.text.primary, 0.9),
                              fontSize: '0.9rem'
                            }}
                          >
                            Total Trades
                          </Typography>
                          <Typography
                            sx={{
                              fontWeight: 700,
                              fontSize: '1.2rem',
                              color: theme.palette.primary.main
                            }}
                          >
                            {traderStats?.totalTrades || 0}
                          </Typography>
                        </Box>
                      </Box>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: '12px',
                          background: 'transparent',
                          border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.15)}`
                          }
                        }}
                      >
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography
                            sx={{
                              fontWeight: 600,
                              color: alpha(theme.palette.text.primary, 0.9),
                              fontSize: '0.9rem'
                            }}
                          >
                            Best Trade
                          </Typography>
                          <Typography
                            sx={{
                              color: theme.palette.success.main,
                              fontWeight: 700,
                              fontSize: '1.2rem'
                            }}
                          >
                            {traderStats?.maxProfitTrade?.toFixed(2) || 0} XRP
                          </Typography>
                        </Box>
                      </Box>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: '12px',
                          background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.08)} 0%, ${alpha(theme.palette.error.main, 0.03)} 100%)`,
                          border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.15)}`
                          }
                        }}
                      >
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography
                            sx={{
                              fontWeight: 600,
                              color: alpha(theme.palette.text.primary, 0.9),
                              fontSize: '0.9rem'
                            }}
                          >
                            Worst Trade
                          </Typography>
                          <Typography
                            sx={{
                              color: theme.palette.error.main,
                              fontWeight: 700,
                              fontSize: '1.2rem'
                            }}
                          >
                            {traderStats?.maxLossTrade?.toFixed(2) || 0} XRP
                          </Typography>
                        </Box>
                      </Box>
                    </Stack>
                  </Box>
                </Card>
              </Stack>
            </OuterBorderContainer>
          </Grid>

          <Grid item xs={12} md={9} order={{ xs: 1, md: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Card
                    sx={{
                      borderRadius: { xs: '12px', sm: '16px' },
                      background: 'transparent',
                      backdropFilter: 'none',
                      WebkitBackdropFilter: 'none',
                      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                      boxShadow: `
                        0 8px 32px ${alpha(theme.palette.common.black, 0.12)}, 
                        0 1px 2px ${alpha(theme.palette.common.black, 0.04)},
                        inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`,
                      overflow: 'hidden',
                      position: 'relative',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `linear-gradient(
                          135deg,
                          ${alpha(theme.palette.primary.main, 0.05)} 0%,
                          transparent 50%,
                          ${alpha(theme.palette.info.main, 0.05)} 100%
                        )`,
                        pointerEvents: 'none'
                      },
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `
                          0 12px 40px ${alpha(theme.palette.common.black, 0.15)}, 
                          0 2px 4px ${alpha(theme.palette.common.black, 0.05)},
                          inset 0 1px 1px ${alpha(theme.palette.common.white, 0.15)}`,
                        border: `1px solid ${alpha(theme.palette.divider, 0.25)}`
                      }
                    }}
                  >
                    <CardContent sx={{ p: { xs: 0.25, sm: 1.5 } }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mb: { xs: 0.25, sm: 1.5 },
                          flexDirection: { xs: 'column', sm: 'row' },
                          gap: { xs: 0.25, sm: 0 }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
                          <Box
                            sx={{
                              p: { xs: 0.4, sm: 0.8 },
                              borderRadius: { xs: '8px', sm: '10px' },
                              background: 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                              position: 'relative',
                              '&::after': {
                                content: '""',
                                position: 'absolute',
                                inset: 0,
                                borderRadius: '14px',
                                background: 'transparent',
                                pointerEvents: 'none'
                              }
                            }}
                          >
                            <TrendingUpIcon
                              sx={{
                                fontSize: { xs: '0.9rem', sm: '1.4rem' },
                                color: 'white',
                                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                              }}
                            />
                          </Box>
                          <Box>
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 700,
                                color: theme.palette.text.primary,
                                fontSize: { xs: '0.65rem', sm: '0.95rem' },
                                letterSpacing: '-0.01em',
                                mb: { xs: 0.1, sm: 0.3 }
                              }}
                            >
                              Time Period Statistics
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: alpha(theme.palette.text.secondary, 0.8),
                                fontSize: { xs: '0.7rem', sm: '0.8rem' },
                                display: { xs: 'none', sm: 'block' }
                              }}
                            >
                              Performance by time period
                            </Typography>
                          </Box>
                        </Box>
                        <ToggleButtonGroup
                          value={selectedInterval}
                          exclusive
                          onChange={(e, newValue) => newValue && setSelectedInterval(newValue)}
                          size="small"
                          sx={{
                            bgcolor: `${alpha(theme.palette.background.paper, 0.6)}`,
                            backdropFilter: 'none',
                            borderRadius: { xs: '6px', sm: '12px' },
                            padding: { xs: '0px', sm: '2px' },
                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                            boxShadow: `inset 0 2px 4px ${alpha(theme.palette.common.black, 0.06)}`,
                            '& .MuiToggleButton-root': {
                              border: 'none',
                              borderRadius: { xs: '4px !important', sm: '8px !important' },
                              color: alpha(theme.palette.text.secondary, 0.8),
                              fontSize: { xs: '0.55rem', sm: '0.65rem' },
                              fontWeight: 600,
                              textTransform: 'none',
                              px: { xs: 0.3, sm: 1.2 },
                              py: { xs: 0, sm: 0.15 },
                              minWidth: { xs: '24px', sm: '45px' },
                              transition: 'all 0.2s ease',
                              '&.Mui-selected': {
                                bgcolor: theme.palette.primary.main,
                                color: theme.palette.primary.contrastText,
                                fontWeight: 700,
                                boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
                                transform: 'translateY(-1px)'
                              },
                              '&:hover': {
                                bgcolor: `${alpha(theme.palette.primary.main, 0.08)}`,
                                color: theme.palette.primary.main
                              }
                            }
                          }}
                        >
                          <ToggleButton value="24h">24H</ToggleButton>
                          <ToggleButton value="7d">7D</ToggleButton>
                          <ToggleButton value="1m">1M</ToggleButton>
                          <ToggleButton value="2m">2M</ToggleButton>
                          <ToggleButton value="3m">3M</ToggleButton>
                        </ToggleButtonGroup>
                      </Box>
                      <Grid container spacing={{ xs: 0.25, sm: 1 }}>
                        <Grid item xs={6} sm={6} md={3}>
                          <Box
                            sx={{
                              p: { xs: 0.5, sm: 1.2 },
                              borderRadius: { xs: '4px', sm: '12px' },
                              background: 'transparent',
                              border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.15)}`
                              }
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                color: alpha(theme.palette.text.secondary, 0.9),
                                fontWeight: 600,
                                fontSize: { xs: '0.5rem', sm: '0.6rem' },
                                textTransform: 'uppercase',
                                letterSpacing: { xs: '0.3px', sm: '0.4px' },
                                mb: { xs: 0.2, sm: 0.4 },
                                display: 'block'
                              }}
                            >
                              Volume
                            </Typography>
                            <Typography
                              variant="h6"
                              sx={{
                                color: theme.palette.info.main,
                                fontWeight: 700,
                                fontSize: { xs: '0.7rem', sm: '0.9rem' }
                              }}
                            >
                              {loading ? (
                                <Skeleton width={100} />
                              ) : (
                                <>
                                  {`${(traderStats?.[`volume${selectedInterval}`] || 0).toFixed(2)} `}
                                  <Typography
                                    component="span"
                                    variant="caption"
                                    sx={{
                                      color: alpha(theme.palette.info.main, 0.7),
                                      fontWeight: 500,
                                      fontSize: { xs: '0.45rem', sm: '0.65rem' }
                                    }}
                                  >
                                    XRP
                                  </Typography>
                                </>
                              )}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={6} md={3}>
                          <Box
                            sx={{
                              p: { xs: 0.5, sm: 1.2 },
                              borderRadius: { xs: '4px', sm: '12px' },
                              background: 'transparent',
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
                              }
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                color: alpha(theme.palette.text.secondary, 0.9),
                                fontWeight: 600,
                                fontSize: { xs: '0.5rem', sm: '0.6rem' },
                                textTransform: 'uppercase',
                                letterSpacing: { xs: '0.3px', sm: '0.4px' },
                                mb: { xs: 0.2, sm: 0.4 },
                                display: 'block'
                              }}
                            >
                              Trades
                            </Typography>
                            <Typography
                              variant="h6"
                              sx={{
                                color: theme.palette.primary.main,
                                fontWeight: 700,
                                fontSize: { xs: '0.7rem', sm: '0.9rem' }
                              }}
                            >
                              {loading ? (
                                <Skeleton width={60} />
                              ) : (
                                traderStats?.[`trades${selectedInterval}`] || 0
                              )}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={6} md={3}>
                          <Box
                            sx={{
                              p: { xs: 0.5, sm: 1.2 },
                              borderRadius: { xs: '4px', sm: '12px' },
                              background: 'transparent',
                              border: `1px solid ${alpha(
                                (traderStats?.[`profit${selectedInterval}`] || 0) >= 0
                                  ? theme.palette.success.main
                                  : theme.palette.error.main,
                                0.1
                              )}`,
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: `0 4px 12px ${alpha(
                                  (traderStats?.[`profit${selectedInterval}`] || 0) >= 0
                                    ? theme.palette.success.main
                                    : theme.palette.error.main,
                                  0.15
                                )}`
                              }
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                color: alpha(theme.palette.text.secondary, 0.9),
                                fontWeight: 600,
                                fontSize: { xs: '0.5rem', sm: '0.6rem' },
                                textTransform: 'uppercase',
                                letterSpacing: { xs: '0.3px', sm: '0.4px' },
                                mb: { xs: 0.2, sm: 0.4 },
                                display: 'block'
                              }}
                            >
                              Profit/Loss
                            </Typography>
                            <Typography
                              variant="h6"
                              sx={{
                                color:
                                  (traderStats?.[`profit${selectedInterval}`] || 0) >= 0
                                    ? theme.palette.success.main
                                    : theme.palette.error.main,
                                fontWeight: 700,
                                fontSize: { xs: '0.7rem', sm: '0.9rem' }
                              }}
                            >
                              {loading ? (
                                <Skeleton width={100} />
                              ) : (
                                <>
                                  {`${(traderStats?.[`profit${selectedInterval}`] || 0).toFixed(2)} `}
                                  <Typography
                                    component="span"
                                    variant="caption"
                                    sx={{
                                      color: alpha(
                                        (traderStats?.[`profit${selectedInterval}`] || 0) >= 0
                                          ? theme.palette.success.main
                                          : theme.palette.error.main,
                                        0.7
                                      ),
                                      fontWeight: 500,
                                      fontSize: { xs: '0.45rem', sm: '0.65rem' }
                                    }}
                                  >
                                    XRP
                                  </Typography>
                                </>
                              )}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={6} md={3}>
                          <Box
                            sx={{
                              p: { xs: 0.5, sm: 1.2 },
                              borderRadius: { xs: '4px', sm: '12px' },
                              background: 'transparent',
                              border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.15)}`
                              }
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                color: alpha(theme.palette.text.secondary, 0.9),
                                fontWeight: 600,
                                fontSize: { xs: '0.5rem', sm: '0.6rem' },
                                textTransform: 'uppercase',
                                letterSpacing: { xs: '0.3px', sm: '0.4px' },
                                mb: { xs: 0.2, sm: 0.4 },
                                display: 'block'
                              }}
                            >
                              Active Tokens
                            </Typography>
                            <Typography
                              variant="h6"
                              sx={{
                                color: theme.palette.warning.main,
                                fontWeight: 700,
                                fontSize: { xs: '0.7rem', sm: '0.9rem' }
                              }}
                            >
                              {loading ? (
                                <Skeleton width={60} />
                              ) : (
                                traderStats?.[`activeTokens${selectedInterval}`] || 0
                              )}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Box>
              </Grid>
            </Grid>

            <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 1.5, sm: 2 } }}>
              <Grid item xs={12}>
                <Card
                  sx={{
                    p: { xs: 1, sm: 1.5 },
                    height: '100%',
                    borderRadius: { xs: '12px', sm: '16px' },
                    background: 'transparent',
                    backdropFilter: 'none',
                    WebkitBackdropFilter: 'none',
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    boxShadow: `
                      0 8px 32px ${alpha(theme.palette.common.black, 0.12)}, 
                      0 1px 2px ${alpha(theme.palette.common.black, 0.04)},
                      inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `
                        0 12px 40px ${alpha(theme.palette.common.black, 0.15)}, 
                        0 2px 4px ${alpha(theme.palette.common.black, 0.05)},
                        inset 0 1px 1px ${alpha(theme.palette.common.white, 0.15)}`,
                      border: `1px solid ${alpha(theme.palette.divider, 0.25)}`
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
                  <Box sx={{ height: { xs: 180, sm: 250 }, position: 'relative', minHeight: { xs: 180, sm: 250 } }}>
                    {loading ? (
                      <Skeleton variant="rectangular" height="100%" sx={{ borderRadius: '12px' }} />
                    ) : (
                      <>
                        {chartView === 'roi' && renderChart(processChartData(), chartOptions)}
                        {chartView === 'activity' && renderChart(processTradeHistoryData(), tradeHistoryOptions)}
                        {chartView === 'volume' && renderChart(processVolumeHistoryData(), volumeHistoryOptions)}
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

            <Card
              sx={{
                flex: 1,
                mb: 1.5,
                color: theme.palette.text.primary,
                borderRadius: { xs: '12px', sm: '16px' },
                background: 'transparent',
                backdropFilter: 'blur(40px) saturate(150%)',
                WebkitBackdropFilter: 'blur(40px) saturate(150%)',
                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                boxShadow: `
                  0 8px 32px ${alpha(theme.palette.common.black, 0.12)}, 
                  0 1px 2px ${alpha(theme.palette.common.black, 0.04)},
                  inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`,
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `
                    0 12px 40px ${alpha(theme.palette.common.black, 0.15)}, 
                    0 2px 4px ${alpha(theme.palette.common.black, 0.05)},
                    inset 0 1px 1px ${alpha(theme.palette.common.white, 0.15)}`,
                  border: `1px solid ${alpha(theme.palette.divider, 0.25)}`
                }
              }}
            >
              <CardContent sx={{ p: 0, overflow: 'hidden' }}>
                <TabContext value={activeTab}>
                  <Box
                    sx={{
                      px: 3,
                      py: 2,
                      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
                      background: 'transparent',
                      backdropFilter: 'blur(10px)'
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

                  <TabPanel sx={{ p: 0, maxHeight: { xs: 'calc(100vh - 250px)', sm: 'auto' }, overflow: { xs: 'auto', sm: 'visible' } }} value="0">
                        <Paper
                          sx={{
                            width: '100%',
                            overflow: 'hidden',
                            color: theme.palette.text.primary,
                            borderRadius: '0 0 16px 0',
                            boxShadow: 'none',
                            background: 'transparent',
                            border: 'none'
                          }}
                        >
                          <TrustLines
                            account={account}
                            xrpBalance={xrpBalance}
                            onUpdateTotalValue={(value) => setTotalValue(value)}
                          />
                        </Paper>
                  </TabPanel>
                  <TabPanel sx={{ p: 0, maxHeight: { xs: 'calc(100vh - 250px)', sm: 'auto' }, overflow: { xs: 'auto', sm: 'visible' } }} value="1">
                    <Paper
                      sx={{
                        width: '100%',
                        overflow: 'hidden',
                        color: theme.palette.text.primary,
                        background: 'transparent',
                        boxShadow: 'none',
                        borderRadius: '0 0 16px 16px'
                      }}
                    >
                      <Table>
                        <TableHead>
                          <TableRow></TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            <TableCell sx={{ width: '100%', border: 'none', p: 0 }} colSpan={4}>
                              <NFTPortfolio
                                account={account}
                                limit={limit}
                                collection={collection}
                                type={type}
                              />
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </Paper>
                  </TabPanel>
                  <TabPanel sx={{ p: 0, maxHeight: { xs: 'calc(100vh - 250px)', sm: 'auto' }, overflow: { xs: 'auto', sm: 'visible' } }} value="2">
                    <Box
                      sx={{
                        borderRadius: '0 0 16px 16px',
                        overflow: 'hidden'
                      }}
                    >
                      <Ranks profileAccount={account} />
                    </Box>
                  </TabPanel>
                </TabContext>
              </CardContent>
            </Card>
            <History account={account} />
          </Grid>
        </Grid>
      </Container>
    </OverviewWrapper>
  );
}
