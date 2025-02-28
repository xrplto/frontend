import React, { useState, useEffect } from 'react';
import {
  useTheme,
  Box,
  Container,
  Stack,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Chip,
  Avatar,
  Typography,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Skeleton,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Verified as VerifiedIcon } from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';
import styled from '@emotion/styled';
import { getHashIcon } from 'src/utils/extra';
import TrustLines from './TrustLines';
import Offer from './Offer';
import { TabContext, TabPanel } from '@mui/lab';
import NFTs from './NFTs';
import History from './History';
import { alpha } from '@mui/material/styles';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import Ranks from './Ranks';
import { activeRankColors, rankGlowEffect } from 'src/components/Chatbox/RankStyles';
import axios from 'axios';
import { useRouter } from 'next/router';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

const OverviewWrapper = styled(Box)(
  ({ theme }) => `
    flex: 1;
`
);

const Balance = styled('div')(({ theme, sx }) => ({
  fontSize: '20px',
  color: '#fff',
  ...sx
}));

const tradesData = [
  {
    id: 1,
    type: 'Swap',
    asset: 'XRP/ETH',
    amount: '100 XRP',
    date: '2024-06-01',
    hash: 'abcdef1234567890'
  },
  {
    id: 2,
    type: 'Buy NFT',
    asset: 'Dragon NFT',
    amount: '200 XRP',
    date: '2024-06-02',
    hash: '1234567890abcdef'
  },
  {
    id: 3,
    type: 'Swap',
    asset: 'XRP/BTC',
    amount: '50 XRP',
    date: '2024-06-03',
    hash: '0987654321fedcba'
  },
  {
    id: 4,
    type: 'Buy NFT',
    asset: 'Space NFT',
    amount: '150 XRP',
    date: '2024-06-04',
    hash: 'fedcba0987654321'
  },
  {
    id: 5,
    type: 'Swap',
    asset: 'XRP/USDT',
    amount: '300 XRP',
    date: '2024-06-05',
    hash: '0abcdef123456789'
  }
];

const volumeData = {
  labels: ['Jun 1', 'Jun 8', 'Jun 15', 'Jun 22', 'Jun 29', 'Jul 6', 'Jul 13'],
  datasets: [
    {
      label: 'Portfolio Worth',
      data: [5000, 5200, 5300, 15400, 15500, 15600, 15700],
      fill: false,
      backgroundColor: 'rgba(75,192,192,0.2)',
      borderColor: 'rgba(75,192,192,1)',
      tension: 0.4,
      yAxisID: 'y'
    },
    {
      label: 'Token Volume',
      data: [100, 150, 200, 250, 300, 350, 400],
      fill: false,
      backgroundColor: 'rgba(255,99,132,0.2)',
      borderColor: 'rgba(255,99,132,1)',
      tension: 0.4,
      yAxisID: 'y1'
    },
    {
      label: 'NFT Volume',
      data: [50, 400, 1500, 20, 2500, 300, 350],
      fill: false,
      backgroundColor: 'rgba(153,102,255,0.2)',
      borderColor: 'rgba(153,102,255,1)',
      tension: 0.4,
      yAxisID: 'y1'
    }
  ]
};

export default function Portfolio({ account, limit, collection, type }) {
  const theme = useTheme();
  const [activeRanks, setActiveRanks] = useState({});
  const router = useRouter();
  const [traderStats, setTraderStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fallback value for theme.palette.divider
  const dividerColor = theme?.palette?.divider || '#ccc';

  const [activeTab, setActiveTab] = useState(collection ? '1' : '0');
  const [filter, setFilter] = useState('All');
  const [collections, setCollections] = useState([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [totalValue, setTotalValue] = useState(0);
  const [selectedInterval, setSelectedInterval] = useState('24h');

  useEffect(() => {
    const fetchTraderStats = async () => {
      try {
        const response = await axios.get(
          `https://api.xrpl.to/api/analytics/trader-stats/${account}`
        );
        setTraderStats(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching trader stats:', error);
        setLoading(false);
      }
    };

    if (account) {
      fetchTraderStats();
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
      labels: sortedHistory.map((item) =>
        new Date(item.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      ),
      datasets: [
        {
          label: 'Daily ROI',
          data: sortedHistory.map((item) => item.dailyRoi),
          fill: false,
          backgroundColor: theme.palette.primary.light,
          borderColor: theme.palette.primary.main,
          tension: 0.4,
          yAxisID: 'y',
          type: 'line',
          pointRadius: 2,
          pointHoverRadius: 4
        },
        {
          label: 'Cumulative ROI',
          data: sortedHistory.map((item) => item.cumulativeRoi),
          fill: false,
          backgroundColor: theme.palette.success.light,
          borderColor: theme.palette.success.main,
          tension: 0.4,
          yAxisID: 'y1',
          type: 'line',
          pointRadius: 2,
          pointHoverRadius: 4
        },
        {
          label: 'Volume',
          data: sortedHistory.map((item) => item.volume),
          fill: true,
          backgroundColor: alpha(theme.palette.info.main, 0.1),
          borderColor: theme.palette.info.main,
          tension: 0.4,
          yAxisID: 'y2',
          type: 'bar'
        }
      ]
    };
  };

  // Process trade history data for the chart
  const processTradeHistoryData = () => {
    if (!traderStats?.tradeHistory) return null;

    const sortedHistory = [...traderStats.tradeHistory].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    return {
      labels: sortedHistory.map((item) =>
        new Date(item.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })
      ),
      datasets: [
        {
          label: 'Daily Trades',
          data: sortedHistory.map((item) => item.trades),
          fill: false,
          backgroundColor: theme.palette.primary.light,
          borderColor: theme.palette.primary.main,
          tension: 0.4,
          yAxisID: 'y',
          type: 'bar'
        },
        {
          label: 'Cumulative Trades',
          data: sortedHistory.map((item) => item.cumulativeTrades),
          fill: false,
          backgroundColor: theme.palette.success.light,
          borderColor: theme.palette.success.main,
          tension: 0.4,
          yAxisID: 'y1',
          type: 'line',
          pointRadius: 2,
          pointHoverRadius: 4
        }
      ]
    };
  };

  const processVolumeHistoryData = () => {
    if (!traderStats?.volumeHistory) return null;

    const sortedHistory = [...traderStats.volumeHistory].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    return {
      labels: sortedHistory.map((item) =>
        new Date(item.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })
      ),
      datasets: [
        {
          label: 'Daily Volume',
          data: sortedHistory.map((item) => item.volume),
          backgroundColor: alpha(theme.palette.primary.main, 0.2),
          borderColor: theme.palette.primary.main,
          type: 'bar',
          yAxisID: 'y'
        },
        {
          label: 'Cumulative Volume',
          data: sortedHistory.map((item) => item.cumulativeVolume),
          fill: false,
          backgroundColor: theme.palette.success.light,
          borderColor: theme.palette.success.main,
          tension: 0.4,
          type: 'line',
          yAxisID: 'y1',
          pointRadius: 2,
          pointHoverRadius: 4
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      title: {
        display: true,
        text: 'Trading Performance',
        color: theme.palette.text.primary,
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: 20
      },
      legend: {
        position: 'bottom',
        labels: {
          color: theme.palette.text.primary,
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: alpha(theme.palette.background.paper, 0.9),
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.dataset.yAxisID === 'y2') {
              label += context.parsed.y.toLocaleString() + ' XRP';
            } else {
              label += context.parsed.y.toFixed(2) + '%';
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          color: theme.palette.text.secondary,
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Daily ROI (%)',
          color: theme.palette.text.secondary
        },
        ticks: {
          color: theme.palette.text.secondary,
          callback: (value) => `${value.toFixed(2)}%`
        },
        grid: {
          color: alpha(theme.palette.divider, 0.1)
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Cumulative ROI (%)',
          color: theme.palette.text.secondary
        },
        ticks: {
          color: theme.palette.text.secondary,
          callback: (value) => `${value.toFixed(2)}%`
        },
        grid: {
          display: false
        }
      }
    }
  };

  const tradeHistoryOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      title: {
        display: true,
        text: 'Trading Activity',
        color: theme.palette.text.primary,
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: 20
      },
      legend: {
        position: 'bottom',
        labels: {
          color: theme.palette.text.primary,
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: alpha(theme.palette.background.paper, 0.9),
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        padding: 12
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: theme.palette.text.secondary
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Daily Trades',
          color: theme.palette.text.secondary
        },
        ticks: {
          color: theme.palette.text.secondary,
          stepSize: 1
        },
        grid: {
          color: alpha(theme.palette.divider, 0.1)
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Cumulative Trades',
          color: theme.palette.text.secondary
        },
        ticks: {
          color: theme.palette.text.secondary
        },
        grid: {
          display: false
        }
      }
    }
  };

  const volumeHistoryOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      title: {
        display: true,
        text: 'Volume History',
        color: theme.palette.text.primary,
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: 20
      },
      legend: {
        position: 'bottom',
        labels: {
          color: theme.palette.text.primary,
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: alpha(theme.palette.background.paper, 0.9),
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            return label + context.parsed.y.toLocaleString() + ' XRP';
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: theme.palette.text.secondary
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Daily Volume (XRP)',
          color: theme.palette.text.secondary
        },
        ticks: {
          color: theme.palette.text.secondary,
          callback: (value) => value.toLocaleString()
        },
        grid: {
          color: alpha(theme.palette.divider, 0.1)
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Cumulative Volume (XRP)',
          color: theme.palette.text.secondary
        },
        ticks: {
          color: theme.palette.text.secondary,
          callback: (value) => value.toLocaleString()
        },
        grid: {
          display: false
        }
      }
    }
  };

  const OuterBorderContainer = styled(Box)(({ theme }) => ({
    padding: '16px',
    borderRadius: '10px',
    border: `1px solid ${dividerColor}`,
    marginBottom: '16px'
  }));

  const nftIcons = [
    // Add your icon URLs or paths here
    '/icons/nft1.png',
    '/icons/nft2.png',
    '/icons/nft3.png',
    '/icons/nft4.png',
    '/icons/nft5.png',
    '/icons/nft6.png',
    '/icons/nft7.png',
    '/icons/nft8.png',
    '/icons/nft9.png',
    '/icons/nft10.png',
    '/icons/nft11.png',
    '/icons/nft12.png',
    '/icons/nft13.png',
    '/icons/nft14.png',
    '/icons/nft15.png',
    '/icons/nft16.png'
  ];

  useEffect(() => {
    async function fetchActiveRanks() {
      try {
        const res = await axios.get('http://37.27.134.126:5000/api/fetch-active-ranks');
        setActiveRanks(res.data);
      } catch (error) {
        console.error('Error fetching active ranks:', error);
      }
    }

    fetchActiveRanks();
  }, []);

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

  return (
    <OverviewWrapper>
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          <Grid item md={4} xs={12}>
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
                  </Box>

                  <Box sx={{ textAlign: 'center', my: 3 }}>
                    <Typography sx={{ color: theme.palette.text.secondary, mb: 1 }} variant="h6">
                      Total Trading Volume
                    </Typography>
                    <Typography sx={{ color: theme.palette.success.main, mt: 1 }} variant="h4">
                      {loading ? (
                        <Skeleton width="100%" />
                      ) : (
                        `${traderStats?.totalVolume?.toLocaleString() || 0} XRP`
                      )}
                    </Typography>
                  </Box>

                  <Card sx={{ p: 2, mb: 3 }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        ROI Performance
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {`Trading Period: ${new Date(
                          traderStats?.firstTradeDate
                        ).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })} - ${new Date(traderStats?.lastTradeDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}`}
                      </Typography>
                    </Box>
                    <Box sx={{ height: 400 }}>
                      {loading ? (
                        <Skeleton variant="rectangular" height={400} />
                      ) : (
                        <Line data={processChartData()} options={chartOptions} />
                      )}
                    </Box>
                  </Card>

                  <Card sx={{ p: 2, mb: 3 }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        Trading Activity
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Daily and Cumulative Trade Count
                      </Typography>
                    </Box>
                    <Box sx={{ height: 400 }}>
                      {loading ? (
                        <Skeleton variant="rectangular" height={400} />
                      ) : (
                        <Line data={processTradeHistoryData()} options={tradeHistoryOptions} />
                      )}
                    </Box>
                  </Card>

                  <Card sx={{ p: 2, mb: 3 }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        Volume History
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Daily and Cumulative Trading Volume
                      </Typography>
                    </Box>
                    <Box sx={{ height: 400 }}>
                      {loading ? (
                        <Skeleton variant="rectangular" height={400} />
                      ) : (
                        <Line data={processVolumeHistoryData()} options={volumeHistoryOptions} />
                      )}
                    </Box>
                  </Card>

                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Average ROI
                      </Typography>
                      <Typography color={traderStats?.avgROI >= 0 ? 'success.main' : 'error.main'}>
                        {`${(traderStats?.avgROI || 0).toFixed(2)}%`}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Average Holding Time
                      </Typography>
                      <Typography>
                        {`${Math.round((traderStats?.avgHoldingTime || 0) / 3600)} hours`}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Total Volume
                      </Typography>
                      <Typography>
                        {`${(traderStats?.totalVolume || 0).toLocaleString()} XRP`}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Win Rate
                      </Typography>
                      <Typography>
                        {`${(
                          (traderStats?.profitableTrades / (traderStats?.totalTrades || 1)) *
                          100
                        ).toFixed(2)}%`}
                      </Typography>
                    </Grid>
                  </Grid>

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

                  <Accordion
                    sx={{
                      borderRadius: '10px',
                      '&.Mui-expanded': {
                        mt: 3
                      },
                      flex: '0 0 auto',
                      color: theme.palette.text.primary,
                      border: `1px solid ${dividerColor}`
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon sx={{ color: theme.palette.text.primary }} />}
                      aria-controls="panel1d-content"
                      id="panel1d-header"
                      sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}
                    >
                      Trading Statistics
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={1}>
                        <Box display="flex" justifyContent="space-between">
                          <Typography>Total Trades</Typography>
                          <Typography>{traderStats?.totalTrades || 0}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography>Profitable Trades</Typography>
                          <Typography sx={{ color: theme.palette.success.main }}>
                            {traderStats?.profitableTrades || 0}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography>Losing Trades</Typography>
                          <Typography sx={{ color: theme.palette.error.main }}>
                            {traderStats?.losingTrades || 0}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography>Best Trade</Typography>
                          <Typography sx={{ color: theme.palette.success.main }}>
                            {traderStats?.maxProfitTrade?.toFixed(2) || 0} XRP
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography>Worst Trade</Typography>
                          <Typography sx={{ color: theme.palette.error.main }}>
                            {traderStats?.maxLossTrade?.toFixed(2) || 0} XRP
                          </Typography>
                        </Box>
                      </Stack>
                    </AccordionDetails>
                  </Accordion>

                  <Offer account={account} />
                </Stack>
              </Stack>
            </OuterBorderContainer>
          </Grid>

          <Grid item md={8} xs={12}>
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

            <Card sx={{ flex: 1, mb: 2, color: theme.palette.text.primary }}>
              <CardContent sx={{ px: 0 }}>
                <TabContext value={activeTab}>
                  <Box>
                    <ToggleButtonGroup
                      value={activeTab}
                      exclusive
                      onChange={(e, newValue) => newValue && handleChange(e, newValue)}
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
                          minWidth: '80px',
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
                      <ToggleButton value="0">Tokens</ToggleButton>
                      <ToggleButton value="1">NFTs</ToggleButton>
                      <ToggleButton value="2">Ranks</ToggleButton>
                    </ToggleButtonGroup>
                  </Box>

                  <TabPanel sx={{ p: 0 }} value="0">
                    <Paper
                      sx={{ width: '100%', overflow: 'hidden', color: theme.palette.text.primary }}
                    >
                      <TrustLines
                        account={account}
                        onUpdateTotalValue={(value) => setTotalValue(value)}
                      />
                    </Paper>
                  </TabPanel>
                  <TabPanel sx={{ p: 0 }} value="1">
                    <Paper
                      sx={{ width: '100%', overflow: 'hidden', color: theme.palette.text.primary }}
                    >
                      <Table>
                        <TableHead>
                          <TableRow></TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            <TableCell sx={{ width: '100%' }} colSpan={4}>
                              <NFTs
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
                    <Ranks profileAccount={account} />
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
