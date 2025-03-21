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
  ToggleButtonGroup,
  IconButton,
  Modal
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Verified as VerifiedIcon } from '@mui/icons-material';
import { Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement
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
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
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
  Legend,
  ArcElement
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
  const router = useRouter();
  const [traderStats, setTraderStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedChart, setSelectedChart] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState(null);
  const [assetDistribution, setAssetDistribution] = useState(null);
  const [xrpBalance, setXrpBalance] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [isAmm, setIsAmm] = useState(false);

  // Fallback value for theme.palette.divider
  const dividerColor = theme?.palette?.divider || '#ccc';

  const [activeTab, setActiveTab] = useState(collection ? '1' : '0');
  const [filter, setFilter] = useState('All');
  const [collections, setCollections] = useState([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [totalValue, setTotalValue] = useState(0);
  const [selectedInterval, setSelectedInterval] = useState('24h');
  const [pageSize, setPageSize] = useState(10);

  // Add state for chart data filtering
  const [chartDateRange, setChartDateRange] = useState('all');
  const [chartDataLimit, setChartDataLimit] = useState(30);

  useEffect(() => {
    const fetchTraderStats = async () => {
      try {
        const response = await axios.get(
          `https://api.xrpl.to/api/analytics/trader-stats/${account}`
        );
        setTraderStats(response.data);
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

    // Sort history by date to ensure chronological order
    const sortedHistory = [...traderStats.roiHistory].sort(
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
        },
        {
          label: 'Profit',
          data: sortedHistory.map((item) => item.profit),
          fill: false,
          backgroundColor: theme.palette.warning.light,
          borderColor: theme.palette.warning.main,
          tension: 0.4,
          yAxisID: 'y3',
          type: 'line',
          pointRadius: 0,
          pointHoverRadius: 4,
          borderDash: [5, 5]
        }
      ]
    };
  };

  // Process trade history data for the chart
  const processTradeHistoryData = () => {
    if (!traderStats?.tradeHistory) return null;

    // Sort history by date to ensure chronological order
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
        },
        {
          label: 'Profitable Trades',
          data: sortedHistory.map((item) => item.profitableTrades),
          fill: false,
          backgroundColor: theme.palette.success.main,
          borderColor: theme.palette.success.main,
          tension: 0,
          yAxisID: 'y',
          type: 'bar',
          stack: 'trades'
        },
        {
          label: 'Losing Trades',
          data: sortedHistory.map((item) => item.losingTrades),
          fill: false,
          backgroundColor: theme.palette.error.main,
          borderColor: theme.palette.error.main,
          tension: 0,
          yAxisID: 'y',
          type: 'bar',
          stack: 'trades'
        }
      ]
    };
  };

  // Process volume history data for the chart
  const processVolumeHistoryData = () => {
    if (!traderStats?.volumeHistory) return null;

    // Sort history by date to ensure chronological order
    const sortedHistory = [...traderStats.volumeHistory].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    // Calculate true cumulative volume
    let runningTotal = 0;
    let runningBuyTotal = 0;
    let runningSellTotal = 0;

    const volumeData = sortedHistory.map((item) => {
      // Add daily volume to running totals
      runningTotal += item.h24Volume;
      runningBuyTotal += item.h24BuyVolume;
      runningSellTotal += item.h24SellVolume;

      return {
        date: item.date,
        h24Volume: item.h24Volume,
        h24BuyVolume: item.h24BuyVolume,
        h24SellVolume: item.h24SellVolume,
        trueCumulativeVolume: runningTotal,
        trueCumulativeBuyVolume: runningBuyTotal,
        trueCumulativeSellVolume: runningSellTotal
      };
    });

    return {
      labels: volumeData.map((item) =>
        new Date(item.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })
      ),
      datasets: [
        {
          label: 'Daily Volume',
          data: volumeData.map((item) => item.h24Volume),
          backgroundColor: theme.palette.primary.light,
          borderColor: theme.palette.primary.main,
          borderWidth: 1,
          yAxisID: 'y',
          type: 'bar'
        },
        {
          label: 'Buy Volume',
          data: volumeData.map((item) => item.h24BuyVolume),
          backgroundColor: theme.palette.success.light,
          borderColor: theme.palette.success.main,
          borderWidth: 1,
          yAxisID: 'y',
          type: 'bar',
          stack: 'volume'
        },
        {
          label: 'Sell Volume',
          data: volumeData.map((item) => item.h24SellVolume),
          backgroundColor: theme.palette.error.light,
          borderColor: theme.palette.error.main,
          borderWidth: 1,
          yAxisID: 'y',
          type: 'bar',
          stack: 'volume'
        },
        {
          label: 'Cumulative Volume',
          data: volumeData.map((item) => item.trueCumulativeVolume),
          fill: false,
          backgroundColor: theme.palette.info.main,
          borderColor: theme.palette.info.main,
          borderWidth: 2,
          tension: 0.4,
          yAxisID: 'y1',
          type: 'line',
          pointRadius: 0,
          pointHoverRadius: 4
        }
      ]
    };
  };

  // Update chart options for ROI chart
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
          pointStyle: 'circle',
          boxWidth: 8,
          boxHeight: 8,
          font: {
            size: 11
          }
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
            const value = context.parsed?.y;
            if (value === undefined || value === null) return label + '0';

            if (context.dataset.yAxisID === 'y2') {
              return label + value.toLocaleString() + ' XRP';
            } else if (context.dataset.yAxisID === 'y3') {
              return label + value.toLocaleString() + ' XRP';
            } else {
              return label + value.toFixed(2) + '%';
            }
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
          minRotation: 45,
          font: {
            size: 10
          },
          autoSkip: true,
          maxTicksLimit: 15
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
          callback: (value) => `${value.toFixed(0)}%`
        },
        grid: {
          color: alpha(theme.palette.divider, 0.1)
        },
        min: -100,
        max: 100,
        suggestedMin: -100,
        suggestedMax: 100
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
          callback: (value) => `${value.toFixed(0)}%`
        },
        grid: {
          display: false
        }
      },
      y2: {
        type: 'linear',
        display: false,
        min: 0,
        grid: {
          display: false
        }
      },
      y3: {
        type: 'linear',
        display: false,
        grid: {
          display: false
        }
      }
    }
  };

  // Update trade history options
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
          pointStyle: 'circle',
          boxWidth: 8,
          boxHeight: 8,
          font: {
            size: 11
          }
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
            const value = context.parsed?.y;
            return label + (value !== undefined && value !== null ? value.toLocaleString() : '0');
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
          color: theme.palette.text.secondary,
          font: {
            size: 10
          },
          autoSkip: true,
          maxTicksLimit: 15
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
          stepSize: 5
        },
        grid: {
          color: alpha(theme.palette.divider, 0.1)
        },
        stacked: true
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

  // Define chart options for volume history
  const volumeHistoryOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: theme.palette.text.primary
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', {
                style: 'decimal',
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: theme.palette.divider
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
          color: theme.palette.divider
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

  const handleExpandChart = (chartType) => {
    setSelectedChart(chartType);
  };

  const handleCloseModal = () => {
    setSelectedChart(null);
  };

  // Update the renderChart function to handle different chart types
  const renderChart = (chartData, chartType) => {
    if (!chartData || !chartData.labels || chartData.labels.length === 0) {
      return (
        <Box
          sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Typography variant="body2" color="text.secondary">
            No data available
          </Typography>
        </Box>
      );
    }

    const options =
      chartType === 'activity'
        ? tradeHistoryOptions
        : chartType === 'volume'
        ? volumeHistoryOptions
        : chartOptions;

    return <Line data={chartData} options={{ ...options, maintainAspectRatio: false }} />;
  };

  useEffect(() => {
    // Fetch data
    const fetchData = async () => {
      try {
        // Your data fetching logic
        const result = await fetchChartData();
        setChartData(result);
      } catch (error) {
        console.error('Error fetching chart data:', error);
        // Set empty but valid chart data structure
        setChartData({ labels: [], datasets: [] });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [account, collection, type]);

  // Add function to process asset distribution data for pie chart
  const processAssetDistribution = (trustlines) => {
    if (!trustlines || trustlines.length === 0) return null;

    // Sort trustlines by value (descending)
    const sortedTrustlines = [...trustlines].sort((a, b) => b.value - a.value);

    // Take top 5 assets and group the rest as "Others"
    const topAssets = sortedTrustlines.slice(0, 5);
    const otherAssets = sortedTrustlines.slice(5);

    // Ensure we have valid numeric values
    const labels = topAssets.map((asset) => asset.currency);
    const data = topAssets.map((asset) => parseFloat(asset.value) || 0);

    // Add "Others" category if there are more than 5 assets
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
    console.log('Pie chart data:', { labels, data, totalValue });

    // Generate colors for each segment
    const backgroundColors = [
      alpha(theme.palette.primary.main, 0.8),
      alpha(theme.palette.success.main, 0.8),
      alpha(theme.palette.warning.main, 0.8),
      alpha(theme.palette.error.main, 0.8),
      alpha(theme.palette.info.main, 0.8),
      alpha(theme.palette.grey[500], 0.8)
    ];

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors,
          borderColor: theme.palette.background.paper,
          borderWidth: 2,
          hoverOffset: 15
        }
      ]
    };
  };

  // Update pie chart options
  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%', // Make it a donut chart for better aesthetics
    plugins: {
      legend: {
        display: false // Hide the legend since we're showing custom labels below
      },
      tooltip: {
        backgroundColor: alpha(theme.palette.background.paper, 0.9),
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        padding: 12,
        position: 'nearest',
        z: 9999, // Add high z-index to ensure tooltip appears above other elements
        callbacks: {
          label: function (context) {
            const value = context.raw;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
            return `${context.label}: ${value.toLocaleString()} XRP (${percentage}%)`;
          },
          title: function (context) {
            return 'XRP Value';
          }
        }
      }
    }
  };

  // Update the TrustLines component to pass data to parent
  const handleTrustlinesData = (trustlines) => {
    const pieData = processAssetDistribution(trustlines);
    setAssetDistribution(pieData);
  };

  // Add filtering function for chart data
  const filterChartData = (data, dateRange, limit) => {
    if (!data || !data.labels) return data;

    let filteredData = { ...data };
    let filteredIndices = [];

    // Apply date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();

      switch (dateRange) {
        case '1m':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case '3m':
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
        case '6m':
          cutoffDate.setMonth(now.getMonth() - 6);
          break;
        case '1y':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          break;
      }

      // Get original dates from the data
      const dates = data.labels.map((label) => {
        // Parse the date from the label (assuming format like "Mar 19")
        const parts = label.split(' ');
        const month = [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec'
        ].indexOf(parts[0]);
        const day = parseInt(parts[1]);
        const year = now.getFullYear(); // Assume current year if not provided
        return new Date(year, month, day);
      });

      // Filter indices based on date range
      filteredIndices = dates
        .map((date, index) => (date >= cutoffDate ? index : -1))
        .filter((idx) => idx !== -1);
    } else {
      // If no date filter, include all indices
      filteredIndices = Array.from({ length: data.labels.length }, (_, i) => i);
    }

    // Apply limit filter (take the most recent N entries)
    if (limit > 0 && filteredIndices.length > limit) {
      filteredIndices = filteredIndices.slice(-limit);
    }

    // Create filtered datasets
    filteredData.labels = filteredIndices.map((i) => data.labels[i]);
    filteredData.datasets = data.datasets.map((dataset) => ({
      ...dataset,
      data: filteredIndices.map((i) => dataset.data[i])
    }));

    return filteredData;
  };

  // Render loading state or error state
  if (isLoading) {
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

                  <Card sx={{ p: 1, borderRadius: '8px' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ flex: 1 }}>
                        Trading Overview
                      </Typography>
                      <Typography variant="h6" sx={{ color: theme.palette.success.main }}>
                        {loading ? (
                          <Skeleton width={100} height={24} />
                        ) : (
                          `${traderStats?.totalVolume?.toLocaleString() || 0} XRP`
                        )}
                      </Typography>
                    </Box>

                    {/* XRP Balance Display */}
                    <Box
                      sx={{
                        p: 0.75,
                        mb: 1.5,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Typography
                        variant="body2"
                        color="text.primary"
                        display="flex"
                        alignItems="center"
                      >
                        <AccountBalanceWalletIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
                        XRP Balance
                      </Typography>
                      {loadingBalance ? (
                        <Skeleton width={80} height={20} />
                      ) : (
                        <Typography variant="body2" color="primary.main" fontWeight="medium">
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

                    <Grid container spacing={0.5}>
                      <Grid item xs={6}>
                        <Box
                          sx={{
                            p: 0.75,
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                            borderRadius: 1
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            noWrap
                          >
                            Buy Volume
                          </Typography>
                          <Typography variant="body2" color="success.main" noWrap>
                            {`${(traderStats?.buyVolume || 0).toLocaleString()} XRP`}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box
                          sx={{
                            p: 0.75,
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                            borderRadius: 1
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            noWrap
                          >
                            Sell Volume
                          </Typography>
                          <Typography variant="body2" color="error.main" noWrap>
                            {`${(traderStats?.sellVolume || 0).toLocaleString()} XRP`}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box
                          sx={{
                            p: 0.75,
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                            borderRadius: 1
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            noWrap
                          >
                            Holding Time
                          </Typography>
                          <Typography variant="body2" noWrap>
                            {`${Math.round((traderStats?.avgHoldingTime || 0) / 3600)}h`}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box
                          sx={{
                            p: 0.75,
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                            borderRadius: 1
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            noWrap
                          >
                            Win Rate
                          </Typography>
                          <Typography variant="body2" noWrap>
                            {`${(
                              (traderStats?.profitableTrades /
                                (traderStats?.profitableTrades + traderStats?.losingTrades || 1)) *
                              100
                            ).toFixed(1)}%`}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Card>

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
                    defaultExpanded={true}
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

                  <Offer account={account} defaultExpanded={false} />
                </Stack>
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
                <Card sx={{ p: 2, height: '100%' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 1
                    }}
                  >
                    <Typography variant="h6" color="text.secondary">
                      ROI Performance
                    </Typography>
                    <IconButton
                      onClick={() => handleExpandChart('roi')}
                      size="small"
                      sx={{
                        color: 'primary.main',
                        '&:hover': {
                          color: 'primary.dark'
                        }
                      }}
                    >
                      <OpenInFullIcon />
                    </IconButton>
                  </Box>
                  <Box sx={{ height: 350 }}>
                    {loading ? (
                      <Skeleton variant="rectangular" height={350} />
                    ) : (
                      renderChart(
                        filterChartData(processChartData(), chartDateRange, chartDataLimit),
                        'roi'
                      )
                    )}
                  </Box>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card sx={{ p: 2, height: '100%' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 1
                    }}
                  >
                    <Typography variant="h6" color="text.secondary">
                      Trading Activity
                    </Typography>
                    <IconButton
                      onClick={() => handleExpandChart('activity')}
                      size="small"
                      sx={{
                        color: 'primary.main',
                        '&:hover': {
                          color: 'primary.dark'
                        }
                      }}
                    >
                      <OpenInFullIcon />
                    </IconButton>
                  </Box>
                  <Box sx={{ height: 350 }}>
                    {loading ? (
                      <Skeleton variant="rectangular" height={350} />
                    ) : (
                      renderChart(
                        filterChartData(processTradeHistoryData(), chartDateRange, chartDataLimit),
                        'activity'
                      )
                    )}
                  </Box>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card sx={{ p: 2, height: '100%' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 1
                    }}
                  >
                    <Typography variant="h6" color="text.secondary">
                      Volume History
                    </Typography>
                    <IconButton
                      onClick={() => handleExpandChart('volume')}
                      size="small"
                      sx={{
                        color: 'primary.main',
                        '&:hover': {
                          color: 'primary.dark'
                        }
                      }}
                    >
                      <OpenInFullIcon />
                    </IconButton>
                  </Box>
                  <Box sx={{ height: 350 }}>
                    {loading ? (
                      <Skeleton variant="rectangular" height={350} />
                    ) : (
                      renderChart(
                        filterChartData(processVolumeHistoryData(), chartDateRange, chartDataLimit),
                        'volume'
                      )
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
                  {selectedChart === 'roi' &&
                    renderChart(
                      filterChartData(processChartData(), chartDateRange, chartDataLimit),
                      'roi'
                    )}
                  {selectedChart === 'activity' &&
                    renderChart(
                      filterChartData(processTradeHistoryData(), chartDateRange, chartDataLimit),
                      'activity'
                    )}
                  {selectedChart === 'volume' &&
                    renderChart(
                      filterChartData(processVolumeHistoryData(), chartDateRange, chartDataLimit),
                      'volume'
                    )}
                </Box>
              </ModalContent>
            </StyledModal>

            <Card sx={{ flex: 1, mb: 2, color: theme.palette.text.primary }}>
              <CardContent sx={{ p: 0 }}>
                <TabContext value={activeTab}>
                  <Box
                    sx={{
                      px: 2.5,
                      py: 2,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      bgcolor: theme.palette.background.paper
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                      <AccountBalanceWalletIcon
                        sx={{ color: theme.palette.primary.main, fontSize: '1.3rem' }}
                      />
                      <Typography
                        sx={{
                          color: theme.palette.text.primary,
                          fontSize: '1.1rem',
                          fontWeight: 500,
                          lineHeight: 1
                        }}
                        variant="h6"
                      >
                        Portfolio Assets
                      </Typography>
                    </Stack>

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
                    <Grid container spacing={0}>
                      {/* Add pie chart section */}
                      <Grid item xs={12} md={4}>
                        <Box
                          sx={{
                            height: '100%',
                            p: { xs: 1.5, md: 1.5 },
                            background: alpha(theme.palette.primary.main, 0.02),
                            borderRadius: '10px 0 0 10px',
                            borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                            display: 'flex',
                            flexDirection: 'column'
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{
                              mb: 1,
                              color: theme.palette.primary.main,
                              fontWeight: 500,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.75,
                              fontSize: '0.8rem'
                            }}
                          >
                            <Box
                              component="span"
                              sx={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                bgcolor: theme.palette.primary.main,
                                display: 'inline-block'
                              }}
                            />
                            Asset Distribution
                          </Typography>

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
                                  <Pie data={assetDistribution} options={pieChartOptions} />
                                </Box>
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    textAlign: 'center',
                                    pointerEvents: 'none',
                                    zIndex: 0 // Lower z-index than the chart
                                  }}
                                >
                                  <Typography
                                    variant="subtitle1"
                                    color="text.primary"
                                    sx={{ fontWeight: 500 }}
                                  >
                                    {(totalValue || 0).toLocaleString()}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ fontSize: '0.7rem' }}
                                  >
                                    XRP Value
                                  </Typography>
                                </Box>
                              </>
                            ) : (
                              <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                  No asset data
                                </Typography>
                              </Box>
                            )}
                          </Box>

                          {assetDistribution && assetDistribution.labels && (
                            <Box sx={{ mt: 1 }}>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                {assetDistribution.labels.slice(0, 3).map((label, index) => (
                                  <Box
                                    key={index}
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      p: 0.5,
                                      borderRadius: 1,
                                      bgcolor: alpha(theme.palette.background.paper, 0.5),
                                      fontSize: '0.75rem'
                                    }}
                                  >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                      <Box
                                        sx={{
                                          width: 8,
                                          height: 8,
                                          borderRadius: '50%',
                                          bgcolor:
                                            assetDistribution.datasets[0].backgroundColor[index]
                                        }}
                                      />
                                      <Typography variant="caption" noWrap sx={{ maxWidth: 100 }}>
                                        {label}
                                      </Typography>
                                    </Box>
                                    <Typography variant="caption" color="text.secondary">
                                      {assetDistribution.datasets[0].data[index].toLocaleString()}{' '}
                                      XRP
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
                            borderRadius: { md: '0 10px 10px 0' },
                            boxShadow: 'none',
                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                          }}
                        >
                          <TrustLines
                            account={account}
                            onUpdateTotalValue={(value) => setTotalValue(value)}
                            onTrustlinesData={handleTrustlinesData}
                          />
                        </Paper>
                      </Grid>
                    </Grid>
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
