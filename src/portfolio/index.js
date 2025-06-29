import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  useTheme,
  Box,
  Container,
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
import Offer from './Offer';
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
import {
  extractDominantColor,
  rgbToHex,
  getTokenImageUrl,
  getTokenFallbackColor
} from 'src/utils/colorExtractor';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const OverviewWrapper = styled(Box)(
  ({ theme }) => `
    flex: 1;
`
);

const StyledModal = styled(Modal)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(2)
}));

const ModalContent = styled(Paper)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  maxWidth: 1000,
  maxHeight: '90vh',
  overflow: 'auto',
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[24]
}));

export default function Portfolio({ account, limit, collection, type }) {
  const theme = useTheme();
  const [activeRanks, setActiveRanks] = useState({});
  const [traderStats, setTraderStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedChart, setSelectedChart] = useState(null);
  const [assetDistribution, setAssetDistribution] = useState(null);
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
        const response = await axios.get(
          `https://api.xrpl.to/api/analytics/trader-stats/${account}`
        );
        setTraderStats(response.data);
        // Set AMM status based on response
        setIsAmm(!!response.data?.AMM);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching trader stats:', error);
        setLoading(false);
      }
    };

    const fetchXrpBalance = async () => {
      try {
        setLoadingBalance(true);
        const response = await axios.post('https://xrplcluster.com/', {
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
        setLoadingBalance(false);
      } catch (error) {
        console.error('Error fetching XRP balance:', error);
        setXrpBalance(0);
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
    if (!traderStats?.roiHistory) return null;

    const sortedHistory = [...traderStats.roiHistory].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    return {
      series: [
        {
          name: 'Daily ROI',
          type: 'line',
          data: sortedHistory.map((item) => item.dailyRoi)
        },
        {
          name: 'Cumulative ROI',
          type: 'line',
          data: sortedHistory.map((item) => item.cumulativeRoi)
        },
        {
          name: 'Volume',
          type: 'bar',
          data: sortedHistory.map((item) => item.volume)
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
    if (!traderStats?.tradeHistory) return null;

    const sortedHistory = [...traderStats.tradeHistory].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    return {
      series: [
        {
          name: 'Daily Trades',
          type: 'bar',
          data: sortedHistory.map((item) => item.trades)
        },
        {
          name: 'Cumulative Trades',
          type: 'line',
          data: sortedHistory.map((item) => item.cumulativeTrades)
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
    if (!traderStats?.volumeHistory) return null;

    const sortedHistory = [...traderStats.volumeHistory].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    return {
      series: [
        {
          name: 'Daily Volume',
          type: 'bar',
          data: sortedHistory.map((item) => item.h24Volume)
        },
        {
          name: 'Cumulative Volume',
          type: 'line',
          data: sortedHistory.map((item) => item.cumulativeVolume)
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
    chart: {
      stacked: false,
      toolbar: { show: false },
      background: 'transparent'
    },
    stroke: {
      width: [2, 2, 0],
      curve: 'smooth'
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      markers: {
        radius: 12
      },
      itemMargin: {
        horizontal: 10
      },
      labels: {
        colors: theme.palette.text.primary
      }
    },
    tooltip: {
      theme: theme.palette.mode,
      shared: true,
      intersect: false,
      y: {
        formatter: (val, { seriesIndex }) => {
          if (typeof val === 'undefined' || val === null) return '0';
          if (seriesIndex === 2) {
            return `${val.toLocaleString()} XRP`;
          }
          return `${val.toFixed(2)}%`;
        }
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
      strokeDashArray: 0
    },
    colors: [
      theme.palette.primary.main,
      theme.palette.success.main,
      alpha(theme.palette.info.main, 0.4)
    ],
    plotOptions: {
      bar: {
        columnWidth: '20%',
        borderRadius: 4
      }
    },
    dataLabels: {
      enabled: false
    }
  };

  const tradeHistoryOptions = {
    chart: {
      stacked: false,
      toolbar: { show: false },
      background: 'transparent'
    },
    stroke: {
      width: [0, 2.5],
      curve: 'smooth'
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      markers: {
        radius: 12
      },
      itemMargin: {
        horizontal: 10
      },
      labels: {
        colors: theme.palette.text.primary
      }
    },
    tooltip: {
      theme: theme.palette.mode,
      shared: true,
      intersect: false,
      y: {
        formatter: (val) => (val ? val.toLocaleString() : '0')
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
      borderColor: alpha(theme.palette.divider, 0.08)
    },
    colors: [theme.palette.primary.main, theme.palette.success.main],
    plotOptions: {
      bar: {
        columnWidth: '30%',
        borderRadius: 4
      }
    },
    dataLabels: {
      enabled: false
    }
  };

  const volumeHistoryOptions = {
    chart: {
      stacked: false,
      toolbar: { show: false },
      background: 'transparent'
    },
    stroke: {
      width: [0, 2.5],
      curve: 'smooth'
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      markers: {
        radius: 12
      },
      itemMargin: {
        horizontal: 10
      },
      labels: {
        colors: theme.palette.text.primary
      }
    },
    tooltip: {
      theme: theme.palette.mode,
      shared: true,
      intersect: false,
      y: {
        formatter: (val) => `${val ? val.toLocaleString() : '0'} XRP`
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
      borderColor: alpha(theme.palette.divider, 0.08)
    },
    colors: [alpha(theme.palette.primary.main, 0.6), theme.palette.success.main],
    plotOptions: {
      bar: {
        columnWidth: '30%',
        borderRadius: 4
      }
    },
    dataLabels: {
      enabled: false
    }
  };

  const OuterBorderContainer = styled(Box)(({ theme }) => ({
    padding: '16px',
    borderRadius: '10px',
    border: `1px solid ${dividerColor}`,
    marginBottom: '16px'
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
      const response = await axios.post('https://api.xrpnft.com/api/account/collectedCreated', {
        account,
        filter: 0,
        limit: 16,
        page: 0,
        search: '',
        subFilter: 'pricexrpasc',
        type: 'collected'
      });
      setCollections(response.data.nfts);
      setTotalValue(response.data.totalValue);
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
    setLoadingCollections(false);
  };

  const handleExpandChart = (chartType) => {
    setSelectedChart(chartType);
  };

  const handleCloseModal = () => {
    setSelectedChart(null);
  };

  const renderChart = (chartData, options, type = 'line') => {
    if (!chartData || !chartData.series) {
      return <Box>Loading chart data...</Box>;
    }

    const finalOptions = {
      ...options,
      xaxis: {
        ...options.xaxis,
        categories: chartData.xaxis.categories
      }
    };

    return <Chart options={finalOptions} series={chartData.series} type={type} height="100%" />;
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

  // Add function to process asset distribution data for pie chart
  const processAssetDistribution = async (trustlines) => {
    if (!trustlines || trustlines.length === 0) return null;

    // Filter out assets with no value and sort by value
    const sortedTrustlines = trustlines
      .filter((asset) => asset.value && parseFloat(asset.value) > 0)
      .sort((a, b) => b.value - a.value);

    // If no assets have value, return null
    if (sortedTrustlines.length === 0) return null;

    // Take top 10 assets and group the rest as "Others"
    const topAssets = sortedTrustlines.slice(0, 10);
    const otherAssets = sortedTrustlines.slice(10);

    // Ensure we have valid numeric values
    const labels = topAssets.map((asset) => asset.currency);
    const data = topAssets.map((asset) => parseFloat(asset.value) || 0);

    // Add "Others" category if there are more than 10 assets
    if (otherAssets.length > 0) {
      const othersValue = otherAssets.reduce(
        (sum, asset) => sum + (parseFloat(asset.value) || 0),
        0
      );
      labels.push('Others');
      data.push(othersValue);
    }

    // Verify we have valid data
    const totalValue = data.reduce((sum, value) => sum + value, 0);

    // Extract colors from token icons
    const backgroundColors = [];

    for (let i = 0; i < topAssets.length; i++) {
      const asset = topAssets[i];
      let color = getTokenFallbackColor(asset.currency, i);

      if (asset.currency === 'XRP') {
        color = theme.palette.primary.main; // Use a specific color for XRP
      } else {
        try {
          // Try to extract color from token icon if md5 exists
          if (asset.md5) {
            const imageUrl = getTokenImageUrl(asset.md5);
            const extractedColor = await extractDominantColor(imageUrl);
            color = rgbToHex(extractedColor);
          }
        } catch (error) {
          console.warn(`Failed to extract color for ${asset.currency}:`, error);
          // Keep the fallback color
        }
      }

      backgroundColors.push(alpha(color, 0.8));
    }

    // Add color for "Others" category
    if (otherAssets.length > 0) {
      backgroundColors.push(alpha(theme.palette.grey[500], 0.8));
    }

    return {
      series: data,
      labels,
      colors: backgroundColors
    };
  };

  // Update pie chart options
  const pieChartOptions = {
    chart: {
      type: 'donut',
      background: 'transparent'
    },
    plotOptions: {
      pie: {
        donut: {
          size: '60%'
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    legend: {
      show: false
    },
    tooltip: {
      theme: theme.palette.mode,
      y: {
        formatter: (value, { series, seriesIndex, dataPointIndex, w }) => {
          if (!w || !w.globals || !w.globals.seriesTotals) {
            return `${value.toLocaleString()} XRP`;
          }
          const total = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
          return `${w.globals.labels[dataPointIndex]}: ${value.toLocaleString()} XRP (${percentage}%)`;
        }
      }
    }
  };

  // Update the TrustLines component to pass data to parent
  const handleTrustlinesData = async (trustlines) => {
    const pieData = await processAssetDistribution(trustlines);
    setAssetDistribution(pieData);
  };

  // Render loading state or error state
  if (loading) {
    return <Box>Loading...</Box>;
  }

  return (
    <OverviewWrapper>
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          <Grid item md={3} xs={12}>
            <OuterBorderContainer>
              <Stack sx={{ height: '100%', justifyContent: 'space-between' }}>
                <Stack
                  sx={{
                    borderRadius: '10px',
                    p: 2,
                    color: theme.palette.text.primary,
                    flex: '1 1 auto',
                    mb: 2
                  }}
                  spacing={2}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1,
                      borderRadius: '8px',
                      border: `1px solid ${dividerColor}`
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        avatar={
                          <Avatar
                            src={getHashIcon(account)}
                            sx={{
                              border: `3px solid ${
                                activeRankColors[activeRanks[account]] || '#808080'
                              }`,
                              boxShadow: `0 0 15px ${
                                activeRankColors[activeRanks[account]] || '#808080'
                              }`
                            }}
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {account}
                            {activeRanks[account] === 'verified' && (
                              <VerifiedIcon
                                sx={{
                                  fontSize: '1.2rem',
                                  ml: 0.5,
                                  color: '#1DA1F2'
                                }}
                              />
                            )}
                          </Box>
                        }
                        sx={{
                          fontSize: '1rem',
                          color: activeRankColors[activeRanks[account]] || '#808080',
                          bgcolor: 'transparent',
                          '& .MuiChip-label': {
                            color: activeRankColors[activeRanks[account]] || '#808080'
                          }
                        }}
                      />
                      {isAmm && (
                        <Chip
                          label="AMM"
                          size="small"
                          sx={{
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                            fontWeight: 500,
                            fontSize: '0.75rem'
                          }}
                        />
                      )}
                    </Box>
                  </Box>

                  <Card
                    sx={{
                      p: 1.5, // Reduced from 2
                      borderRadius: '16px',
                      background: `linear-gradient(135deg, ${alpha(
                        theme.palette.success.main,
                        0.08
                      )} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
                      backdropFilter: 'blur(20px)',
                      border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`,
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: `0 8px 32px ${alpha(theme.palette.success.main, 0.12)}`,
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.primary.main}, ${theme.palette.info.main})`
                      },
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: -50,
                        right: -50,
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${alpha(
                          theme.palette.success.main,
                          0.1
                        )} 0%, transparent 70%)`,
                        filter: 'blur(20px)'
                      }
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 0.5 // Reduced from 1
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        {' '}
                        {/* Reduced gap from 1 */}
                        <Box
                          sx={{
                            p: 0.7, // Reduced from 1
                            borderRadius: '8px', // Reduced from 10px
                            background: `linear-gradient(135deg, ${alpha(
                              theme.palette.success.main,
                              0.15
                            )} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
                            backdropFilter: 'blur(10px)',
                            border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <TrendingUpIcon
                            sx={{
                              fontSize: '1rem', // Reduced from 1.1rem
                              color: theme.palette.success.main,
                              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                            }}
                          />
                        </Box>
                        <Typography
                          variant="h6"
                          color="text.primary"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.8rem', // Reduced from 0.9rem
                            letterSpacing: '-0.02em'
                          }}
                        >
                          Total Trading Volume
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ textAlign: 'center', py: 0.5 }}>
                      {' '}
                      {/* Reduced from py: 1 */}
                      {loading ? (
                        <Skeleton
                          width={160} // Reduced from 200
                          height={24} // Reduced from 32
                          sx={{ mx: 'auto', borderRadius: '8px' }}
                        />
                      ) : (
                        <Typography
                          variant="h3"
                          sx={{
                            color: theme.palette.success.main,
                            fontWeight: 700,
                            fontSize: '1.5rem', // Reduced from 1.8rem
                            letterSpacing: '-0.02em',
                            textShadow: `0 4px 8px ${alpha(theme.palette.success.main, 0.25)}`,
                            mb: 0.1, // Reduced from 0.3
                            background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.primary.main} 100%)`,
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                          }}
                        >
                          {`${traderStats?.totalVolume?.toLocaleString() || 0}`}
                        </Typography>
                      )}
                      <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{
                          fontWeight: 500,
                          letterSpacing: '0.1em',
                          fontSize: '0.65rem', // Reduced from 0.75rem
                          textTransform: 'uppercase'
                        }}
                      >
                        XRP
                      </Typography>
                    </Box>
                  </Card>

                  {/* XRP Balance Display */}
                  <Box
                    sx={{
                      p: 2,
                      mb: 2,
                      background: `linear-gradient(135deg, ${alpha(
                        theme.palette.primary.main,
                        0.08
                      )} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
                      backdropFilter: 'blur(10px)',
                      borderRadius: '12px',
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Typography
                      variant="body1"
                      color="text.primary"
                      display="flex"
                      alignItems="center"
                      sx={{ fontWeight: 500 }}
                    >
                      <AccountBalanceWalletIcon
                        sx={{ fontSize: '1.2rem', mr: 1, color: theme.palette.primary.main }}
                      />
                      XRP Balance
                    </Typography>
                    {loadingBalance ? (
                      <Skeleton width={100} height={24} sx={{ borderRadius: '6px' }} />
                    ) : (
                      <Typography
                        variant="h6"
                        color="primary.main"
                        fontWeight="600"
                        sx={{ letterSpacing: '-0.01em' }}
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

                  <Grid container spacing={1.5}>
                    <Grid item xs={6}>
                      <Box
                        sx={{
                          p: 2,
                          background: `linear-gradient(135deg, ${alpha(
                            theme.palette.success.main,
                            0.06
                          )} 0%, ${alpha(theme.palette.success.main, 0.02)} 100%)`,
                          backdropFilter: 'blur(10px)',
                          borderRadius: '12px',
                          border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 4px 16px ${alpha(theme.palette.success.main, 0.15)}`
                          }
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          noWrap
                          sx={{ fontWeight: 500, mb: 0.5 }}
                        >
                          Buy Volume
                        </Typography>
                        <Typography
                          variant="body1"
                          color="success.main"
                          noWrap
                          sx={{ fontWeight: 600, fontSize: '0.95rem' }}
                        >
                          {`${(traderStats?.buyVolume || 0).toLocaleString()} XRP`}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box
                        sx={{
                          p: 2,
                          background: `linear-gradient(135deg, ${alpha(
                            theme.palette.error.main,
                            0.06
                          )} 0%, ${alpha(theme.palette.error.main, 0.02)} 100%)`,
                          backdropFilter: 'blur(10px)',
                          borderRadius: '12px',
                          border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 4px 16px ${alpha(theme.palette.error.main, 0.15)}`
                          }
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          noWrap
                          sx={{ fontWeight: 500, mb: 0.5 }}
                        >
                          Sell Volume
                        </Typography>
                        <Typography
                          variant="body1"
                          color="error.main"
                          noWrap
                          sx={{ fontWeight: 600, fontSize: '0.95rem' }}
                        >
                          {`${(traderStats?.sellVolume || 0).toLocaleString()} XRP`}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box
                        sx={{
                          p: 2,
                          background: `linear-gradient(135deg, ${alpha(
                            theme.palette.info.main,
                            0.06
                          )} 0%, ${alpha(theme.palette.info.main, 0.02)} 100%)`,
                          backdropFilter: 'blur(10px)',
                          borderRadius: '12px',
                          border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 4px 16px ${alpha(theme.palette.info.main, 0.15)}`
                          }
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          noWrap
                          sx={{ fontWeight: 500, mb: 0.5 }}
                        >
                          Holding Time
                        </Typography>
                        <Typography
                          variant="body1"
                          noWrap
                          sx={{ fontWeight: 600, fontSize: '0.95rem' }}
                        >
                          {`${Math.round((traderStats?.avgHoldingTime || 0) / 3600)}h`}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box
                        sx={{
                          p: 2,
                          background: `linear-gradient(135deg, ${alpha(
                            theme.palette.warning.main,
                            0.06
                          )} 0%, ${alpha(theme.palette.warning.main, 0.02)} 100%)`,
                          backdropFilter: 'blur(10px)',
                          borderRadius: '12px',
                          border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 4px 16px ${alpha(theme.palette.warning.main, 0.15)}`
                          }
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          noWrap
                          sx={{ fontWeight: 500, mb: 0.5 }}
                        >
                          Win Rate
                        </Typography>
                        <Typography
                          variant="body1"
                          noWrap
                          sx={{ fontWeight: 600, fontSize: '0.95rem' }}
                        >
                          {traderStats?.profitableTrades && traderStats?.losingTrades
                            ? `${(
                                (traderStats.profitableTrades /
                                  (traderStats.profitableTrades + traderStats.losingTrades)) *
                                100
                              ).toFixed(1)}%`
                            : '0.0%'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Stack>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Token Performance
                  </Typography>
                  {loading ? (
                    <Skeleton variant="rectangular" height={200} />
                  ) : (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Token</TableCell>
                          <TableCell align="right">ROI</TableCell>
                          <TableCell align="right">Profit</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {traderStats?.tokenPerformance?.map((token) => (
                          <TableRow key={token.tokenId}>
                            <TableCell>{token.name}</TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                color:
                                  token.roi >= 0
                                    ? theme.palette.success.main
                                    : theme.palette.error.main
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
                                    : theme.palette.error.main
                              }}
                            >
                              {token.profit.toFixed(2)} XRP
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </Box>

                <Card
                  sx={{
                    borderRadius: '16px',
                    mt: 3,
                    p: 3,
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.background.paper,
                      0.8
                    )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}`,
                    color: theme.palette.text.primary
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                      mb: 3,
                      fontSize: '1.1rem',
                      letterSpacing: '-0.02em'
                    }}
                  >
                    Trading Statistics
                  </Typography>
                  <Stack spacing={2}>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{
                        p: 1.5,
                        borderRadius: '8px',
                        background: alpha(theme.palette.primary.main, 0.04),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`
                      }}
                    >
                      <Typography sx={{ fontWeight: 500 }}>Total Trades</Typography>
                      <Typography sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                        {traderStats?.totalTrades || 0}
                      </Typography>
                    </Box>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{
                        p: 1.5,
                        borderRadius: '8px',
                        background: alpha(theme.palette.success.main, 0.04),
                        border: `1px solid ${alpha(theme.palette.success.main, 0.08)}`
                      }}
                    >
                      <Typography sx={{ fontWeight: 500 }}>Profitable Trades</Typography>
                      <Typography
                        sx={{
                          color: theme.palette.success.main,
                          fontWeight: 600,
                          fontSize: '1.1rem'
                        }}
                      >
                        {traderStats?.profitableTrades || 0}
                      </Typography>
                    </Box>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{
                        p: 1.5,
                        borderRadius: '8px',
                        background: alpha(theme.palette.error.main, 0.04),
                        border: `1px solid ${alpha(theme.palette.error.main, 0.08)}`
                      }}
                    >
                      <Typography sx={{ fontWeight: 500 }}>Losing Trades</Typography>
                      <Typography
                        sx={{
                          color: theme.palette.error.main,
                          fontWeight: 600,
                          fontSize: '1.1rem'
                        }}
                      >
                        {traderStats?.losingTrades || 0}
                      </Typography>
                    </Box>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{
                        p: 1.5,
                        borderRadius: '8px',
                        background: alpha(theme.palette.success.main, 0.04),
                        border: `1px solid ${alpha(theme.palette.success.main, 0.08)}`
                      }}
                    >
                      <Typography sx={{ fontWeight: 500 }}>Best Trade</Typography>
                      <Typography
                        sx={{
                          color: theme.palette.success.main,
                          fontWeight: 600,
                          fontSize: '1.1rem'
                        }}
                      >
                        {traderStats?.maxProfitTrade?.toFixed(2) || 0} XRP
                      </Typography>
                    </Box>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{
                        p: 1.5,
                        borderRadius: '8px',
                        background: alpha(theme.palette.error.main, 0.04),
                        border: `1px solid ${alpha(theme.palette.error.main, 0.08)}`
                      }}
                    >
                      <Typography sx={{ fontWeight: 500 }}>Worst Trade</Typography>
                      <Typography
                        sx={{
                          color: theme.palette.error.main,
                          fontWeight: 600,
                          fontSize: '1.1rem'
                        }}
                      >
                        {traderStats?.maxLossTrade?.toFixed(2) || 0} XRP
                      </Typography>
                    </Box>
                  </Stack>
                </Card>

                <Offer account={account} defaultExpanded={false} />
              </Stack>
            </OuterBorderContainer>
          </Grid>

          <Grid item md={9} xs={12}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: theme.palette.text.secondary, mr: 2 }}>
                      Time Period Statistics
                    </Typography>
                    <ToggleButtonGroup
                      value={selectedInterval}
                      exclusive
                      onChange={(e, newValue) => newValue && setSelectedInterval(newValue)}
                      size="small"
                      sx={{
                        bgcolor: theme.palette.action.hover,
                        borderRadius: '8px',
                        padding: '2px',
                        '& .MuiToggleButton-root': {
                          border: 'none',
                          borderRadius: '6px !important',
                          color: theme.palette.text.secondary,
                          fontSize: '0.875rem',
                          fontWeight: 'normal',
                          textTransform: 'none',
                          px: 2,
                          py: 0.5,
                          minWidth: '60px',
                          '&.Mui-selected': {
                            bgcolor: theme.palette.background.paper,
                            color: theme.palette.primary.main,
                            fontWeight: 500,
                            boxShadow: theme.shadows[1]
                          },
                          '&:hover': {
                            bgcolor: theme.palette.background.paper,
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
                  <Card
                    elevation={3}
                    sx={{
                      position: 'relative',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: '100%',
                        height: '2px',
                        backgroundColor: theme.palette.primary.main
                      }
                    }}
                  >
                    <CardContent>
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Box>
                            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                              Volume
                            </Typography>
                            <Typography variant="h6">
                              {loading ? (
                                <Skeleton width={100} />
                              ) : (
                                `${(traderStats?.[`volume${selectedInterval}`] || 0).toFixed(
                                  2
                                )} XRP`
                              )}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Box>
                            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                              Trades
                            </Typography>
                            <Typography variant="h6">
                              {loading ? (
                                <Skeleton width={60} />
                              ) : (
                                traderStats?.[`trades${selectedInterval}`] || 0
                              )}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Box>
                            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                              Profit/Loss
                            </Typography>
                            <Typography
                              variant="h6"
                              sx={{
                                color:
                                  (traderStats?.[`profit${selectedInterval}`] || 0) >= 0
                                    ? theme.palette.success.main
                                    : theme.palette.error.main
                              }}
                            >
                              {loading ? (
                                <Skeleton width={100} />
                              ) : (
                                `${(traderStats?.[`profit${selectedInterval}`] || 0).toFixed(
                                  2
                                )} XRP`
                              )}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Box>
                            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                              Active Tokens
                            </Typography>
                            <Typography variant="h6">
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

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <Card
                  sx={{
                    p: 3,
                    height: '100%',
                    borderRadius: '20px',
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.background.paper,
                      0.9
                    )} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    boxShadow: `0 8px 32px ${alpha(
                      theme.palette.common.black,
                      0.08
                    )}, 0 2px 8px ${alpha(theme.palette.primary.main, 0.05)}`,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 16px 48px ${alpha(
                        theme.palette.common.black,
                        0.12
                      )}, 0 4px 16px ${alpha(theme.palette.primary.main, 0.1)}`,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main}, ${theme.palette.info.main})`,
                      opacity: 0.8
                    }
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 2
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        color: theme.palette.text.primary,
                        fontWeight: 600,
                        fontSize: '1.1rem',
                        letterSpacing: '-0.02em'
                      }}
                    >
                      ROI Performance
                    </Typography>
                    <IconButton
                      onClick={() => handleExpandChart('roi')}
                      size="small"
                      sx={{
                        color: theme.palette.primary.main,
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        borderRadius: '12px',
                        p: 1,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.15),
                          transform: 'scale(1.05)'
                        }
                      }}
                    >
                      <OpenInFullIcon sx={{ fontSize: '1.1rem' }} />
                    </IconButton>
                  </Box>
                  <Box sx={{ height: 350, position: 'relative' }}>
                    {loading ? (
                      <Skeleton variant="rectangular" height={350} sx={{ borderRadius: '12px' }} />
                    ) : (
                      renderChart(processChartData(), chartOptions)
                    )}
                  </Box>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card
                  sx={{
                    p: 3,
                    height: '100%',
                    borderRadius: '20px',
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.background.paper,
                      0.9
                    )} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                    boxShadow: `0 8px 32px ${alpha(
                      theme.palette.common.black,
                      0.08
                    )}, 0 2px 8px ${alpha(theme.palette.success.main, 0.05)}`,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 16px 48px ${alpha(
                        theme.palette.common.black,
                        0.12
                      )}, 0 4px 16px ${alpha(theme.palette.success.main, 0.1)}`,
                      border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.primary.main}, ${theme.palette.warning.main})`,
                      borderRadius: '20px 20px 0 0'
                    }
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 2
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        color: theme.palette.text.primary,
                        fontWeight: 600,
                        fontSize: '1.1rem',
                        letterSpacing: '-0.02em'
                      }}
                    >
                      Trading Activity
                    </Typography>
                    <IconButton
                      onClick={() => handleExpandChart('activity')}
                      size="small"
                      sx={{
                        color: theme.palette.success.main,
                        bgcolor: alpha(theme.palette.success.main, 0.08),
                        borderRadius: '12px',
                        p: 1,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: alpha(theme.palette.success.main, 0.15),
                          transform: 'scale(1.05)'
                        }
                      }}
                    >
                      <OpenInFullIcon sx={{ fontSize: '1.1rem' }} />
                    </IconButton>
                  </Box>
                  <Box sx={{ height: 350, position: 'relative' }}>
                    {loading ? (
                      <Skeleton variant="rectangular" height={350} sx={{ borderRadius: '12px' }} />
                    ) : (
                      renderChart(processTradeHistoryData(), tradeHistoryOptions)
                    )}
                  </Box>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card
                  sx={{
                    p: 3,
                    height: '100%',
                    borderRadius: '20px',
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.background.paper,
                      0.9
                    )} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                    boxShadow: `0 8px 32px ${alpha(
                      theme.palette.common.black,
                      0.08
                    )}, 0 2px 8px ${alpha(theme.palette.info.main, 0.05)}`,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 16px 48px ${alpha(
                        theme.palette.common.black,
                        0.12
                      )}, 0 4px 16px ${alpha(theme.palette.info.main, 0.1)}`,
                      border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: `linear-gradient(90deg, ${theme.palette.info.main}, ${theme.palette.primary.main}, ${theme.palette.success.main})`,
                      borderRadius: '20px 20px 0 0'
                    }
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 2
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        color: theme.palette.text.primary,
                        fontWeight: 600,
                        fontSize: '1.1rem',
                        letterSpacing: '-0.02em'
                      }}
                    >
                      Volume History
                    </Typography>
                    <IconButton
                      onClick={() => handleExpandChart('volume')}
                      size="small"
                      sx={{
                        color: theme.palette.info.main,
                        bgcolor: alpha(theme.palette.info.main, 0.08),
                        borderRadius: '12px',
                        p: 1,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: alpha(theme.palette.info.main, 0.15),
                          transform: 'scale(1.05)'
                        }
                      }}
                    >
                      <OpenInFullIcon sx={{ fontSize: '1.1rem' }} />
                    </IconButton>
                  </Box>
                  <Box sx={{ height: 350, position: 'relative' }}>
                    {loading ? (
                      <Skeleton variant="rectangular" height={350} sx={{ borderRadius: '12px' }} />
                    ) : (
                      renderChart(processVolumeHistoryData(), volumeHistoryOptions)
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
                mb: 2,
                color: theme.palette.text.primary,
                borderRadius: '24px',
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.background.paper,
                  0.95
                )} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
                backdropFilter: 'blur(20px)',
                border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                boxShadow: `0 8px 32px ${alpha(
                  theme.palette.common.black,
                  0.06
                )}, 0 2px 8px ${alpha(theme.palette.primary.main, 0.04)}`,
                overflow: 'hidden',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main}, ${theme.palette.info.main})`,
                  opacity: 0.8
                }
              }}
            >
              <CardContent sx={{ p: 0 }}>
                <TabContext value={activeTab}>
                  <Box
                    sx={{
                      px: 4,
                      py: 3,
                      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
                      background: `linear-gradient(135deg, ${alpha(
                        theme.palette.background.paper,
                        0.8
                      )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: '16px',
                          background: `linear-gradient(135deg, ${alpha(
                            theme.palette.primary.main,
                            0.15
                          )} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
                        }}
                      >
                        <AccountBalanceWalletIcon
                          sx={{
                            color: theme.palette.primary.main,
                            fontSize: '1.5rem',
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                          }}
                        />
                      </Box>
                      <Box>
                        <Typography
                          sx={{
                            color: theme.palette.text.primary,
                            fontSize: '1.4rem',
                            fontWeight: 700,
                            lineHeight: 1.2,
                            letterSpacing: '-0.02em',
                            background: `linear-gradient(135deg, ${
                              theme.palette.text.primary
                            } 0%, ${alpha(theme.palette.primary.main, 0.8)} 100%)`,
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                          }}
                          variant="h5"
                        >
                          Portfolio Assets
                        </Typography>
                      </Box>
                    </Stack>

                    <ToggleButtonGroup
                      value={activeTab}
                      exclusive
                      onChange={(e, newValue) => newValue && handleChange(e, newValue)}
                      size="medium"
                      sx={{
                        bgcolor: alpha(theme.palette.background.paper, 0.6),
                        borderRadius: '16px',
                        padding: '4px',
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        boxShadow: `inset 0 2px 4px ${alpha(theme.palette.common.black, 0.06)}`,
                        '& .MuiToggleButton-root': {
                          border: 'none',
                          borderRadius: '12px !important',
                          color: alpha(theme.palette.text.secondary, 0.8),
                          fontSize: '0.95rem',
                          fontWeight: 500,
                          textTransform: 'none',
                          px: 3,
                          py: 1.5,
                          minWidth: '100px',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          position: 'relative',
                          '&.Mui-selected': {
                            bgcolor: theme.palette.background.paper,
                            color: theme.palette.primary.main,
                            fontWeight: 600,
                            boxShadow: `0 4px 12px ${alpha(
                              theme.palette.primary.main,
                              0.15
                            )}, 0 2px 4px ${alpha(theme.palette.common.black, 0.1)}`,
                            transform: 'translateY(-1px)',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              height: '2px',
                              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`,
                              borderRadius: '12px 12px 0 0'
                            }
                          },
                          '&:hover': {
                            bgcolor: alpha(theme.palette.background.paper, 0.8),
                            color: theme.palette.primary.main,
                            transform: 'translateY(-1px)'
                          }
                        }
                      }}
                    >
                      <ToggleButton value="0">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: theme.palette.primary.main,
                              opacity: activeTab === '0' ? 1 : 0.4
                            }}
                          />
                          Tokens
                        </Box>
                      </ToggleButton>
                      <ToggleButton value="1">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: theme.palette.success.main,
                              opacity: activeTab === '1' ? 1 : 0.4
                            }}
                          />
                          NFTs
                        </Box>
                      </ToggleButton>
                      <ToggleButton value="2">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: theme.palette.warning.main,
                              opacity: activeTab === '2' ? 1 : 0.4
                            }}
                          />
                          Ranks
                        </Box>
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>

                  <TabPanel sx={{ p: 0 }} value="0">
                    <Grid container spacing={0}>
                      {/* Add pie chart section */}
                      <Grid item xs={12} md={4}>
                        <Box
                          sx={{
                            height: '100%',
                            p: 3,
                            background: `linear-gradient(135deg, ${alpha(
                              theme.palette.primary.main,
                              0.04
                            )} 0%, ${alpha(theme.palette.primary.main, 0.01)} 100%)`,
                            borderRadius: '0 0 0 24px',
                            borderRight: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              width: '2px',
                              height: '100%',
                              background: `linear-gradient(180deg, ${alpha(
                                theme.palette.primary.main,
                                0.2
                              )} 0%, transparent 50%, ${alpha(
                                theme.palette.primary.main,
                                0.2
                              )} 100%)`
                            }
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5,
                              mb: 3,
                              p: 2,
                              borderRadius: '12px',
                              background: alpha(theme.palette.background.paper, 0.6),
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                            }}
                          >
                            <Box
                              sx={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                bgcolor: theme.palette.primary.main,
                                boxShadow: `0 0 8px ${alpha(theme.palette.primary.main, 0.4)}`
                              }}
                            />
                            <Typography
                              variant="subtitle1"
                              sx={{
                                color: theme.palette.primary.main,
                                fontWeight: 600,
                                fontSize: '1rem',
                                letterSpacing: '-0.01em'
                              }}
                            >
                              Asset Distribution
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              position: 'relative',
                              minHeight: 220,
                              maxHeight: 240
                            }}
                          >
                            {assetDistribution ? (
                              <>
                                <Box
                                  sx={{
                                    position: 'relative',
                                    width: '100%',
                                    height: '100%',
                                    zIndex: 1
                                  }}
                                >
                                  <Chart
                                    options={{
                                      ...pieChartOptions,
                                      labels: assetDistribution.labels,
                                      colors: assetDistribution.colors,
                                      stroke: {
                                        width: 2,
                                        colors: [theme.palette.background.paper]
                                      }
                                    }}
                                    series={assetDistribution.series}
                                    type="donut"
                                    height="100%"
                                  />
                                </Box>
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    textAlign: 'center',
                                    pointerEvents: 'none',
                                    zIndex: 0,
                                    p: 2,
                                    borderRadius: '50%',
                                    background: `radial-gradient(circle, ${alpha(
                                      theme.palette.background.paper,
                                      0.9
                                    )} 0%, transparent 70%)`
                                  }}
                                >
                                  <Typography
                                    variant="h6"
                                    color="text.primary"
                                    sx={{
                                      fontWeight: 700,
                                      fontSize: '1.1rem',
                                      letterSpacing: '-0.02em'
                                    }}
                                  >
                                    {(totalValue || 0).toLocaleString()}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                      fontSize: '0.75rem',
                                      fontWeight: 500,
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.05em'
                                    }}
                                  >
                                    XRP Value
                                  </Typography>
                                </Box>
                              </>
                            ) : (
                              <Box
                                sx={{
                                  textAlign: 'center',
                                  p: 3,
                                  borderRadius: '12px',
                                  background: alpha(theme.palette.background.paper, 0.4),
                                  border: `1px dashed ${alpha(theme.palette.divider, 0.3)}`
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ fontWeight: 500 }}
                                >
                                  No asset data available
                                </Typography>
                              </Box>
                            )}
                          </Box>

                          {assetDistribution && assetDistribution.labels && (
                            <Box sx={{ mt: 2 }}>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {assetDistribution.labels.slice(0, 3).map((label, index) => (
                                  <Box
                                    key={index}
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      p: 1.5,
                                      borderRadius: '10px',
                                      background: `linear-gradient(135deg, ${alpha(
                                        theme.palette.background.paper,
                                        0.8
                                      )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
                                      border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                                      transition: 'all 0.2s ease',
                                      '&:hover': {
                                        transform: 'translateX(4px)',
                                        boxShadow: `0 4px 12px ${alpha(
                                          theme.palette.common.black,
                                          0.08
                                        )}`
                                      }
                                    }}
                                  >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                      <Box
                                        sx={{
                                          width: 12,
                                          height: 12,
                                          borderRadius: '50%',
                                          bgcolor: assetDistribution.colors[index],
                                          boxShadow: `0 0 8px ${alpha(
                                            assetDistribution.colors[index],
                                            0.4
                                          )}`
                                        }}
                                      />
                                      <Typography
                                        variant="body2"
                                        noWrap
                                        sx={{
                                          maxWidth: 100,
                                          fontWeight: 500,
                                          fontSize: '0.85rem'
                                        }}
                                      >
                                        {label}
                                      </Typography>
                                    </Box>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{
                                        fontWeight: 600,
                                        fontSize: '0.8rem'
                                      }}
                                    >
                                      {assetDistribution.series[index].toLocaleString()} XRP
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
                            </Box>
                          )}
                        </Box>
                      </Grid>

                      {/* Trustlines table */}
                      <Grid item xs={12} md={8}>
                        <Paper
                          sx={{
                            width: '100%',
                            overflow: 'hidden',
                            color: theme.palette.text.primary,
                            borderRadius: '0 0 24px 0',
                            boxShadow: 'none',
                            background: 'transparent',
                            border: 'none'
                          }}
                        >
                          <TrustLines
                            account={account}
                            xrpBalance={xrpBalance}
                            onUpdateTotalValue={(value) => setTotalValue(value)}
                            onTrustlinesData={handleTrustlinesData}
                          />
                        </Paper>
                      </Grid>
                    </Grid>
                  </TabPanel>
                  <TabPanel sx={{ p: 0 }} value="1">
                    <Paper
                      sx={{
                        width: '100%',
                        overflow: 'hidden',
                        color: theme.palette.text.primary,
                        background: 'transparent',
                        boxShadow: 'none',
                        borderRadius: '0 0 24px 24px'
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
                  <TabPanel sx={{ p: 0 }} value="2">
                    <Box
                      sx={{
                        borderRadius: '0 0 24px 24px',
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
