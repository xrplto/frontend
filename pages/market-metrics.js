import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import axios from 'axios';
import moment from 'moment';
import {
  Box,
  Typography,
  Container,
  Paper,
  Tabs,
  Tab,
  Portal,
  TextField,
  Autocomplete,
  Chip
} from '@mui/material';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import Topbar from 'src/components/Topbar';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

// Chart theme colors
const chartColors = {
  primary: {
    main: '#3B82F6',
    light: 'rgba(59, 130, 246, 0.1)',
    dark: '#2563EB'
  },
  secondary: {
    main: '#10B981',
    light: 'rgba(16, 185, 129, 0.1)',
    dark: '#059669'
  },
  tertiary: {
    main: '#F59E0B',
    light: 'rgba(245, 158, 11, 0.1)',
    dark: '#D97706'
  },
  background: 'rgba(0, 0, 0, 0.3)',
  cardBg: 'rgba(0, 0, 0, 0.5)',
  text: '#E5E7EB',
  grid: 'rgba(255, 255, 255, 0.03)'
};

// Add theme-aware colors
const getThemeColors = (theme) => {
  const isDarkMode = theme.palette.mode === 'dark';

  return {
    background: isDarkMode ? 'transparent' : '#ffffff',
    backgroundGradient: isDarkMode
      ? 'linear-gradient(to bottom, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.3))'
      : 'linear-gradient(to bottom, rgba(255, 255, 255, 1), rgba(245, 245, 250, 1))',
    cardBg: isDarkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 1)',
    cardBorder: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    cardHoverBorder: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    text: isDarkMode ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.87)',
    textSecondary: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
    grid: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)'
  };
};

// Add theme-aware colors for chart elements
const getChartColors = (theme) => {
  const isDarkMode = theme.palette.mode === 'dark';

  return {
    totalLine: isDarkMode ? '#FFFFFF' : '#000000',
    totalLineFill: isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)',
    cursorColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
    legendBg: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
    scrollThumb: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
    // Add these color sets
    primary: {
      main: '#3B82F6',
      light: 'rgba(59, 130, 246, 0.1)',
      dark: '#2563EB'
    },
    secondary: {
      main: '#10B981',
      light: 'rgba(16, 185, 129, 0.1)',
      dark: '#059669'
    },
    tertiary: {
      main: '#F59E0B',
      light: 'rgba(245, 158, 11, 0.1)',
      dark: '#D97706'
    }
  };
};

// Custom tooltip styles
const CustomTooltip = ({ active, payload, label }) => {
  const [tooltipRoot, setTooltipRoot] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Create tooltip root element
  useEffect(() => {
    // Create a div for the portal if it doesn't exist
    if (!document.getElementById('tooltip-root')) {
      const div = document.createElement('div');
      div.id = 'tooltip-root';
      div.style.position = 'fixed';
      div.style.zIndex = '9999';
      div.style.pointerEvents = 'none';
      document.body.appendChild(div);
      setTooltipRoot(div);
    } else {
      setTooltipRoot(document.getElementById('tooltip-root'));
    }

    // Cleanup function
    return () => {
      const div = document.getElementById('tooltip-root');
      if (div && div.childElementCount === 0) {
        document.body.removeChild(div);
      }
    };
  }, []);

  // Track mouse position
  useEffect(() => {
    const updateTooltipPosition = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    document.addEventListener('mousemove', updateTooltipPosition);
    return () => {
      document.removeEventListener('mousemove', updateTooltipPosition);
    };
  }, []);

  // Update tooltip position
  useEffect(() => {
    if (tooltipRoot) {
      tooltipRoot.style.top = `${mousePosition.y - 10}px`;
      tooltipRoot.style.left = `${mousePosition.x + 20}px`;
    }
  }, [mousePosition, tooltipRoot]);

  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  if (active && payload && payload.length && tooltipRoot) {
    // Sort payload by value in descending order
    const sortedPayload = [...payload].sort((a, b) => b.value - a.value);

    return (
      <Portal container={tooltipRoot}>
        <Paper
          elevation={6}
          sx={{
            backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'}`,
            p: { xs: 1, sm: 2 }, // Reduced padding on mobile
            borderRadius: 2,
            boxShadow: isDarkMode
              ? '0 8px 32px 0 rgba(0, 0, 0, 0.5)'
              : '0 4px 20px 0 rgba(0, 0, 0, 0.15)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            maxWidth: { xs: 250, sm: 300 }, // Smaller width on mobile
            maxHeight: '80vh',
            overflow: 'auto'
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              color: isDarkMode ? '#E5E7EB' : 'rgba(0, 0, 0, 0.87)',
              mb: 1,
              fontWeight: 600,
              fontSize: { xs: '0.7rem', sm: '0.8rem' }, // Smaller font on mobile
              borderBottom: `1px solid ${
                isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
              }`,
              pb: 1
            }}
          >
            {label}
          </Typography>
          {sortedPayload.map((entry, index) => {
            // Check if this is a token marketcap entry and if there's a corresponding avgPrice entry
            const isTokenMarketcap = entry.dataKey && entry.dataKey.endsWith('_marketcap');
            const tokenName = isTokenMarketcap ? entry.dataKey.replace('_marketcap', '') : '';
            const avgPriceKey = `${tokenName}_avgPrice`;
            const volumeKey = `${tokenName}_volume`;
            const tradesKey = `${tokenName}_trades`;

            const hasAvgPrice =
              isTokenMarketcap &&
              payload.some((p) => p.dataKey === avgPriceKey) &&
              payload.find((p) => p.dataKey === avgPriceKey).value > 0;
            const hasVolume =
              isTokenMarketcap &&
              payload.some((p) => p.dataKey === volumeKey) &&
              payload.find((p) => p.dataKey === volumeKey).value > 0;
            const hasTrades =
              isTokenMarketcap &&
              payload.some((p) => p.dataKey === tradesKey) &&
              payload.find((p) => p.dataKey === tradesKey).value > 0;

            const avgPrice = hasAvgPrice
              ? payload.find((p) => p.dataKey === avgPriceKey).value
              : null;
            const volume = hasVolume ? payload.find((p) => p.dataKey === volumeKey).value : null;
            const trades = hasTrades ? payload.find((p) => p.dataKey === tradesKey).value : null;

            return (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  mb: 0.5,
                  justifyContent: 'space-between'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: entry.color || entry.stroke,
                      mr: 1,
                      boxShadow: '0 0 10px rgba(255, 255, 255, 0.1)'
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      color: isDarkMode ? '#E5E7EB' : 'rgba(0, 0, 0, 0.87)',
                      fontWeight: 500,
                      mr: 1
                    }}
                  >
                    {entry.name}:
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: isDarkMode ? '#E5E7EB' : 'rgba(0, 0, 0, 0.87)',
                      fontWeight: 600,
                      textAlign: 'right'
                    }}
                  >
                    {entry.value.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                    {entry.name.includes('Volume') ? ' XRP' : ''}
                  </Typography>
                  {hasAvgPrice && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                        textAlign: 'right'
                      }}
                    >
                      Avg Price:{' '}
                      {avgPrice.toLocaleString(undefined, {
                        minimumFractionDigits: 6,
                        maximumFractionDigits: 6
                      })}
                    </Typography>
                  )}
                  {hasVolume && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                        textAlign: 'right'
                      }}
                    >
                      Volume:{' '}
                      {volume.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}{' '}
                      XRP
                    </Typography>
                  )}
                  {hasTrades && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                        textAlign: 'right'
                      }}
                    >
                      Trades: {trades.toLocaleString()}
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          })}
        </Paper>
      </Portal>
    );
  }
  return null;
};

// Custom Legend Item Component
const CustomLegendItem = ({ entry, visible, onClick }) => {
  const theme = useTheme();
  const themeColors = getThemeColors(theme);

  return (
    <Box
      onClick={() => onClick(entry)}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        mr: 2,
        mb: 1,
        cursor: 'pointer',
        opacity: visible ? 1 : 0.4,
        transition: 'all 0.2s ease-in-out',
        padding: '2px 8px',
        borderRadius: '4px',
        backgroundColor: visible
          ? theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(0, 0, 0, 0.05)'
          : 'transparent',
        '&:hover': {
          opacity: 0.8,
          backgroundColor:
            theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        }
      }}
    >
      <Box
        sx={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: entry.color || entry.stroke,
          mr: 1,
          boxShadow: visible ? '0 0 10px rgba(0, 0, 0, 0.1)' : 'none'
        }}
      />
      <Typography
        variant="body2"
        sx={{
          color: themeColors.text,
          fontWeight: visible ? 500 : 400,
          fontSize: '0.75rem'
        }}
      >
        {entry.value}
      </Typography>
    </Box>
  );
};

// Custom Legend Container Component
const CustomLegend = ({ payload, visibleLines, handleLegendClick }) => {
  const theme = useTheme();
  const chartColors = getChartColors(theme);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        mt: 2
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          maxHeight: '80px',
          overflowY: 'auto',
          padding: '4px',
          backgroundColor: chartColors.legendBg,
          borderRadius: '4px',
          '&::-webkit-scrollbar': {
            width: '6px',
            height: '6px'
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(0, 0, 0, 0.1)'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: chartColors.scrollThumb,
            borderRadius: '3px'
          }
        }}
      >
        {payload.map((entry) => (
          <CustomLegendItem
            key={entry.value}
            entry={entry}
            visible={visibleLines[entry.dataKey]}
            onClick={handleLegendClick}
          />
        ))}
      </Box>
    </Box>
  );
};

// Chart Container Component
const ChartContainer = ({ title, children, showFilter, onFilterChange, filterActive }) => {
  const theme = useTheme();
  const themeColors = getThemeColors(theme);

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3, md: 4 }, // Reduced padding on mobile
        mb: { xs: 2, sm: 3, md: 4 }, // Reduced margin on mobile
        backgroundColor: themeColors.cardBg,
        border: `1px solid ${themeColors.cardBorder}`,
        borderRadius: 2,
        backdropFilter: theme.palette.mode === 'dark' ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: theme.palette.mode === 'dark' ? 'blur(16px)' : 'none',
        boxShadow:
          theme.palette.mode === 'dark'
            ? '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
            : '0 4px 12px 0 rgba(0, 0, 0, 0.05)',
        '&:hover': {
          boxShadow:
            theme.palette.mode === 'dark'
              ? '0 8px 32px 0 rgba(0, 0, 0, 0.4)'
              : '0 6px 16px 0 rgba(0, 0, 0, 0.08)',
          border: `1px solid ${themeColors.cardHoverBorder}`,
          transition: 'all 0.3s ease-in-out'
        }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: { xs: 1.5, sm: 2, md: 3 }
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: themeColors.text,
            fontWeight: 600,
            fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' }, // Smaller font on mobile
            letterSpacing: '0.025em',
            textShadow: theme.palette.mode === 'dark' ? '0 2px 4px rgba(0, 0, 0, 0.2)' : 'none'
          }}
        >
          {title}
        </Typography>

        {showFilter && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography
              variant="body2"
              sx={{
                mr: 1,
                color: themeColors.textSecondary,
                fontSize: { xs: '0.7rem', sm: '0.8rem' }
              }}
            >
              Hide PLR, XRPS, mula, XAH
            </Typography>
            <Box
              onClick={onFilterChange}
              sx={{
                width: { xs: 36, sm: 42 },
                height: { xs: 20, sm: 24 },
                backgroundColor: filterActive
                  ? theme.palette.mode === 'dark'
                    ? 'rgba(59, 130, 246, 0.8)'
                    : '#3B82F6'
                  : theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.2)'
                  : 'rgba(0, 0, 0, 0.2)',
                borderRadius: 12,
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                padding: '0 2px'
              }}
            >
              <Box
                sx={{
                  width: { xs: 16, sm: 20 },
                  height: { xs: 16, sm: 20 },
                  backgroundColor: theme.palette.mode === 'dark' ? '#FFFFFF' : '#FFFFFF',
                  borderRadius: '50%',
                  position: 'absolute',
                  left: filterActive ? 'calc(100% - 22px)' : '2px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
                }}
              />
            </Box>
          </Box>
        )}
      </Box>
      {children}
    </Paper>
  );
};

const MarketMetricsContent = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleLines, setVisibleLines] = useState({
    volumeAMM: true,
    volumeNonAMM: true,
    tradesAMM: false,
    tradesNonAMM: false,
    totalMarketcap: true,
    tokenCount: true,
    firstLedgerMarketcap: true,
    magneticXMarketcap: true,
    xpMarketMarketcap: true,
    firstLedgerTokens: true,
    magneticXTokens: true,
    xpMarketTokens: true,
    uniqueActiveAddressesAMM: true,
    uniqueActiveAddressesNonAMM: true
  });

  // Add state to track available tokens
  const [availableTokens, setAvailableTokens] = useState([]);

  // Token color map - will be used to assign consistent colors to tokens
  const tokenColorMap = {
    SOLO: '#FF6B6B',
    BTC: '#F7931A',
    CORE: '#4BC0C0',
    ETH: '#627EEA',
    USD: '#26A17B',
    CNY: '#E91E63',
    XCORE: '#9C27B0'
    // Add more colors as needed
  };

  // Function to get a color for a token (either from map or generate one)
  const getTokenColor = (tokenName, index) => {
    if (tokenColorMap[tokenName]) {
      return tokenColorMap[tokenName];
    }

    // Generate colors for tokens not in the map
    const colors = [
      '#8884d8',
      '#82ca9d',
      '#ffc658',
      '#ff7300',
      '#0088FE',
      '#00C49F',
      '#FFBB28',
      '#FF8042',
      '#a4de6c',
      '#d0ed57',
      '#8dd1e1',
      '#83a6ed'
    ];

    return colors[index % colors.length];
  };

  const handleLegendClick = (entry) => {
    setVisibleLines((prev) => ({
      ...prev,
      [entry.dataKey]: !prev[entry.dataKey]
    }));
  };

  // Add a new state for the active tab
  const [activeTab, setActiveTab] = useState(0);

  // Add tab change handler
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Add state for selected tokens to display
  const [selectedTokens, setSelectedTokens] = useState([]);

  // Add state for max tokens to display
  const [maxTokensToDisplay, setMaxTokensToDisplay] = useState(10);

  // Add this function to handle token selection
  const handleTokenSelection = (event, newValue) => {
    setSelectedTokens(newValue);
  };

  // Add state for data sampling and time range
  const [sampledData, setSampledData] = useState([]);
  const [timeRange, setTimeRange] = useState('all'); // 'all', '5y', '1y', '6m', '1m'

  // Function to sample data based on time range
  const sampleDataByTimeRange = useCallback((fullData, range) => {
    if (!fullData || fullData.length === 0) return [];

    let filteredData = [...fullData];
    const now = moment();

    // Filter data based on selected time range
    if (range !== 'all') {
      const rangeMap = {
        '5y': 5,
        '1y': 1,
        '6m': 0.5,
        '1m': 1 / 12
      };

      const cutoffDate = now.clone().subtract(rangeMap[range], 'years');
      filteredData = fullData.filter((item) =>
        moment(item.date, 'MMM DD YYYY').isAfter(cutoffDate)
      );
    }

    // Return all data points without sampling to ensure daily data
    return filteredData;
  }, []);

  // Handle time range change
  const handleTimeRangeChange = useCallback(
    (newRange) => {
      setTimeRange(newRange);
      setSampledData(sampleDataByTimeRange(data, newRange));
    },
    [data, sampleDataByTimeRange]
  );

  // Add a new state to track the selected data point
  const [selectedDataPoint, setSelectedDataPoint] = useState(null);

  // Add a function to handle data point click
  const handleDataPointClick = (data) => {
    setSelectedDataPoint(data);
  };

  // Add this state and ref at the top
  const [animationComplete, setAnimationComplete] = useState(false);
  const chartRef = useRef(null);

  // Add this function to handle animation completion
  const handleAnimationEnd = () => {
    setAnimationComplete(true);
  };

  // Add this state to preprocess data and prepare chart rendering
  const [chartReady, setChartReady] = useState(false);

  // Add this state for progressive data loading
  const [progressiveData, setProgressiveData] = useState([]);

  // Modify the useLayoutEffect implementation to load data all at once
  useLayoutEffect(() => {
    if (sampledData.length > 0) {
      // Clear any existing progressive data
      setProgressiveData([]);

      // Use a short timeout to allow the component to render first
      setTimeout(() => {
        // Load all data at once without animation
        setProgressiveData(sampledData);
        setAnimationComplete(true);
      }, 10); // Shorter timeout for faster loading
    }
  }, [sampledData]);

  // Add theme hook
  const theme = useTheme();
  const themeColors = getThemeColors(theme);
  const chartColors = getChartColors(theme);

  // Move the useMediaQuery hook to the top level, not inside a conditional
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Add this after the visibleLines state declaration
  const [hideSpecificTokens, setHideSpecificTokens] = useState(false);
  const tokensToFilter = ['PLR', 'XRPS', 'mula', 'XAH']; // Tokens to potentially hide

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current date
        const endDate = moment().format('YYYY-MM-DD');
        // Get date 10 years ago
        const startDate = moment().subtract(14, 'years').format('YYYY-MM-DD');

        console.log('Fetching data from', startDate, 'to', endDate); // Debug log

        const response = await axios.get('https://api.xrpl.to/api/analytics/market-metrics', {
          params: {
            startDate,
            endDate
          }
        });

        // Ensure response.data is an array
        const marketData = Array.isArray(response.data) ? response.data : response.data.data || [];

        if (!marketData.length) {
          console.warn('No market metrics data received');
          return;
        }

        // Track all unique tokens across all data points
        const uniqueTokens = new Set();

        const formattedData = marketData
          .sort((a, b) => new Date(a.date) - new Date(b.date)) // Sort by date ascending
          .map((item) => {
            // Process token-specific market caps
            const tokenMarketcaps = {};
            const tokenAvgPrices = {}; // Add object to store average prices
            const tokenVolumes = {}; // Add object to store token volumes
            const tokenTrades = {}; // Add object to store token trades

            if (item.dailyTokenMarketcaps && Array.isArray(item.dailyTokenMarketcaps)) {
              item.dailyTokenMarketcaps.forEach((token) => {
                if (token.name && token.marketcap) {
                  const tokenKey = `${token.name}_marketcap`;
                  const priceKey = `${token.name}_avgPrice`; // Create key for average price
                  const volumeKey = `${token.name}_volume`; // Create key for volume
                  const tradesKey = `${token.name}_trades`; // Create key for trades

                  tokenMarketcaps[tokenKey] = Number(token.marketcap.toFixed(2));
                  tokenAvgPrices[priceKey] = Number(token.avgPrice?.toFixed(6) || 0); // Store average price with 6 decimal places
                  tokenVolumes[volumeKey] = Number(token.volume?.toFixed(2) || 0); // Store volume with 2 decimal places
                  tokenTrades[tradesKey] = Number(token.trades || 0); // Store trades count
                  uniqueTokens.add(token.name);
                }
              });
            }

            return {
              ...item,
              ...tokenMarketcaps, // Add token-specific market caps to the data object
              ...tokenAvgPrices, // Add token-specific average prices to the data object
              ...tokenVolumes, // Add token-specific volumes to the data object
              ...tokenTrades, // Add token-specific trades to the data object
              // Fix the date format to match the API response format
              date: moment.utc(item.date).format('MMM DD YYYY'), // Use UTC to avoid timezone issues
              totalMarketcap: Number(item.totalMarketcap.toFixed(2)), // Remove the division by 1000000
              firstLedgerMarketcap: Number(item.firstLedgerMarketcap?.toFixed(2) || 0),
              magneticXMarketcap: Number(item.magneticXMarketcap?.toFixed(2) || 0),
              xpMarketMarketcap: Number(item.xpMarketMarketcap?.toFixed(2) || 0),
              volumeNonAMM: Number(item.volumeNonAMM.toFixed(2)), // Remove division by 1000
              volumeAMM: Number(item.volumeAMM.toFixed(2)), // Remove division by 1000
              totalVolume: Number((item.volumeAMM + item.volumeNonAMM).toFixed(2)), // Remove division by 1000
              tokenCount: Number(item.tokenCount), // Add tokenCount to formatted data
              firstLedgerTokens: Number(item.firstLedgerTokenCount || 0),
              magneticXTokens: Number(item.magneticXTokenCount || 0),
              xpMarketTokens: Number(item.xpMarketTokenCount || 0),
              tradesAMM: Number(item.tradesAMM),
              tradesNonAMM: Number(item.tradesNonAMM),
              totalTrades: Number(item.totalTrades),
              uniqueActiveAddresses: Number(item.uniqueActiveAddresses || 0),
              uniqueActiveAddressesAMM: Number(item.uniqueActiveAddressesAMM || 0),
              uniqueActiveAddressesNonAMM: Number(item.uniqueActiveAddressesNonAMM || 0)
            };
          });

        // Convert Set to Array and sort alphabetically
        const tokenArray = Array.from(uniqueTokens).sort();

        // Initialize visibility state for all tokens (default to true)
        const tokenVisibility = {};
        tokenArray.forEach((token) => {
          tokenVisibility[`${token}_marketcap`] = true;
        });

        // Update state with the token list and visibility
        setAvailableTokens(tokenArray);
        setVisibleLines((prev) => ({
          ...prev,
          ...tokenVisibility
        }));

        // Initialize with top tokens by market cap (if available)
        if (tokenArray.length > 0) {
          // Get the most recent data point
          const latestData = formattedData[formattedData.length - 1];

          // Sort tokens by market cap
          const sortedTokens = tokenArray
            .filter((token) => latestData[`${token}_marketcap`])
            .sort(
              (a, b) => (latestData[`${b}_marketcap`] || 0) - (latestData[`${a}_marketcap`] || 0)
            )
            .slice(0, maxTokensToDisplay);

          setSelectedTokens(sortedTokens);
        }

        setData(formattedData);
        // Initialize sampled data with the full dataset
        setSampledData(sampleDataByTimeRange(formattedData, timeRange));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange, sampleDataByTimeRange]);

  if (loading) {
    return <Container></Container>;
  }

  const chartConfig = {
    margin: {
      top: 20,
      right: 40,
      left: 30,
      bottom: 20
    },
    mobileMargin: {
      // Add mobile-specific margins
      top: 10,
      right: 20,
      left: 20,
      bottom: 20
    },
    gridStyle: {
      strokeDasharray: '3 3',
      stroke: themeColors.grid
    },
    axisStyle: {
      fontSize: 12,
      fontWeight: 500,
      fill: themeColors.text
    },
    mobileAxisStyle: {
      // Add mobile-specific axis style
      fontSize: 10,
      fontWeight: 500,
      fill: themeColors.text
    }
  };

  return (
    <Box
      sx={{
        flex: 1,
        py: { xs: 1, sm: 2, md: 3 }, // Reduced padding on mobile
        backgroundColor: themeColors.background,
        backgroundImage: themeColors.backgroundGradient,
        minHeight: '100vh'
      }}
    >
      <Container maxWidth="xl" sx={{ mt: { xs: 2, sm: 3, md: 4 }, mb: { xs: 2, sm: 3, md: 4 } }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            color: themeColors.text,
            fontWeight: 700,
            mb: { xs: 2, sm: 3, md: 4 }, // Reduced margin on mobile
            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }, // Smaller font on mobile
            textAlign: 'center',
            letterSpacing: '0.025em',
            textShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0, 0, 0, 0.3)' : 'none'
          }}
        >
          XRPL Market Analytics
        </Typography>

        {/* Add tabs for chart categories */}
        <Paper
          elevation={0}
          sx={{
            mb: { xs: 2, sm: 3, md: 4 }, // Reduced margin on mobile
            backgroundColor: themeColors.cardBg,
            border: `1px solid ${themeColors.cardBorder}`,
            borderRadius: 2,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow:
              theme.palette.mode === 'dark'
                ? '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
                : '0 4px 12px 0 rgba(0, 0, 0, 0.05)'
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: { xs: '40px', sm: '48px' }, // Smaller height on mobile
              '& .MuiTabs-indicator': {
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.8)'
                    : theme.palette.primary.main,
                height: '2px'
              },
              '& .MuiTab-root': {
                color:
                  theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                minHeight: { xs: '40px', sm: '48px' }, // Smaller height on mobile
                padding: { xs: '8px 12px', sm: '12px 16px' }, // Reduced padding on mobile
                fontSize: { xs: '0.7rem', sm: '0.8rem' }, // Smaller font on mobile
                '&.Mui-selected': {
                  color:
                    theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.95)'
                      : theme.palette.primary.main,
                  fontWeight: 600
                },
                '&:hover': {
                  color:
                    theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.8)'
                      : theme.palette.primary.dark,
                  opacity: 0.8
                }
              }
            }}
          >
            <Tab label="Market Cap by DEX" />
            <Tab label="Token Market Caps" />
            <Tab label="Active Tokens by DEX" />
            <Tab label="Trading Activity" />
            <Tab label="Unique Active Addresses" />
          </Tabs>
        </Paper>

        {/* Tab Panel 0: Market Cap by DEX */}
        {activeTab === 0 && (
          <ChartContainer
            title="Market Cap by DEX (XRP)"
            showFilter={true}
            onFilterChange={() => setHideSpecificTokens(!hideSpecificTokens)}
            filterActive={hideSpecificTokens}
          >
            {/* Add time range selector */}
            <Box
              sx={{
                mb: { xs: 1, sm: 2 },
                display: 'flex',
                justifyContent: 'flex-end',
                // Make the container smaller on mobile
                maxWidth: { xs: '100%', sm: 'auto' },
                overflow: 'auto'
              }}
            >
              <Tabs
                value={timeRange}
                onChange={(e, newValue) => handleTimeRangeChange(newValue)}
                variant="scrollable"
                scrollButtons={isMobile ? false : 'auto'} // Hide scroll buttons on mobile
                sx={{
                  minHeight: { xs: '28px', sm: '36px' }, // Even smaller height on mobile
                  '& .MuiTabs-indicator': {
                    backgroundColor:
                      theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.8)'
                        : theme.palette.primary.main,
                    height: '2px'
                  },
                  '& .MuiTabs-root': {
                    maxWidth: { xs: '100%', sm: 'auto' } // Constrain width on mobile
                  },
                  '& .MuiTabs-flexContainer': {
                    justifyContent: isMobile ? 'space-between' : 'flex-start' // Space evenly on mobile
                  },
                  '& .MuiTab-root': {
                    color:
                      theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.6)'
                        : 'rgba(0, 0, 0, 0.6)',
                    minHeight: { xs: '28px', sm: '36px' }, // Smaller height on mobile
                    padding: { xs: '2px 6px', sm: '6px 12px' }, // Further reduced padding on mobile
                    minWidth: { xs: '40px', sm: '60px' }, // Smaller width on mobile
                    fontSize: { xs: '0.6rem', sm: '0.75rem' }, // Smaller font on mobile
                    '&.Mui-selected': {
                      color:
                        theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.95)'
                          : theme.palette.primary.main,
                      fontWeight: 600
                    }
                  }
                }}
              >
                <Tab label={isMobile ? 'All' : 'All Time'} value="all" />
                <Tab label="5Y" value="5y" />
                <Tab label="1Y" value="1y" />
                <Tab label="6M" value="6m" />
                <Tab label="1M" value="1m" />
              </Tabs>
            </Box>

            <Box sx={{ height: { xs: 300, sm: 350, md: 400 } }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  ref={chartRef}
                  data={progressiveData.map((dataPoint) => {
                    if (hideSpecificTokens) {
                      // Create a filtered copy of the data point
                      const filteredDataPoint = { ...dataPoint };

                      // Calculate the total marketcap excluding filtered tokens
                      let filteredTotalMarketcap = dataPoint.totalMarketcap;

                      // Subtract the marketcap of filtered tokens
                      tokensToFilter.forEach((token) => {
                        const tokenMarketcapKey = `${token}_marketcap`;
                        if (filteredDataPoint[tokenMarketcapKey]) {
                          filteredTotalMarketcap -= filteredDataPoint[tokenMarketcapKey];
                          // Remove the token's marketcap from the data point
                          delete filteredDataPoint[tokenMarketcapKey];
                        }
                      });

                      // Update the total marketcap
                      filteredDataPoint.totalMarketcap = filteredTotalMarketcap;

                      return filteredDataPoint;
                    }
                    return dataPoint;
                  })}
                  margin={isMobile ? chartConfig.mobileMargin : chartConfig.margin}
                  isAnimationActive={false}
                  onClick={(data) => {
                    if (data && data.activePayload && data.activePayload.length > 0) {
                      handleDataPointClick(data.activePayload[0].payload);
                    }
                  }}
                >
                  <CartesianGrid {...chartConfig.gridStyle} />
                  <XAxis
                    dataKey="date"
                    angle={-45}
                    textAnchor="end"
                    height={isMobile ? 40 : 60} // Smaller height on mobile
                    interval={
                      isMobile
                        ? timeRange === 'all'
                          ? 60
                          : timeRange === '5y'
                          ? 40
                          : timeRange === '1y'
                          ? 20
                          : 10
                        : timeRange === 'all'
                        ? 30
                        : timeRange === '5y'
                        ? 20
                        : timeRange === '1y'
                        ? 10
                        : 5
                    }
                    tick={
                      isMobile ? { ...chartConfig.mobileAxisStyle } : { ...chartConfig.axisStyle }
                    }
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tickFormatter={
                      (value) =>
                        value.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        }) + (isMobile ? '' : ' XRP') // Remove "XRP" text on mobile to save space
                    }
                    tick={
                      isMobile ? { ...chartConfig.mobileAxisStyle } : { ...chartConfig.axisStyle }
                    }
                    width={isMobile ? 60 : 80} // Smaller width on mobile
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ stroke: chartColors.cursorColor, strokeWidth: 1 }}
                  />
                  <Legend
                    content={({ payload }) => (
                      <CustomLegend
                        payload={payload}
                        visibleLines={visibleLines}
                        handleLegendClick={handleLegendClick}
                      />
                    )}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalMarketcap"
                    stroke={chartColors.totalLine}
                    name="Total"
                    strokeWidth={3}
                    dot={false}
                    hide={!visibleLines.totalMarketcap}
                    isAnimationActive={false}
                    activeDot={{
                      r: 8,
                      strokeWidth: 2,
                      stroke: chartColors.totalLine,
                      fill: themeColors.background,
                      onClick: (data) => handleDataPointClick(data.payload)
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="firstLedgerMarketcap"
                    stroke={chartColors.primary.main}
                    name="FirstLedger"
                    strokeWidth={2}
                    dot={false}
                    hide={!visibleLines.firstLedgerMarketcap}
                    isAnimationActive={false}
                    activeDot={{
                      r: 6,
                      strokeWidth: 2,
                      stroke: chartColors.primary.main,
                      fill: themeColors.background,
                      onClick: (data) => handleDataPointClick(data.payload)
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="magneticXMarketcap"
                    stroke={chartColors.secondary.main}
                    name="Magnetic X"
                    strokeWidth={2}
                    dot={false}
                    hide={!visibleLines.magneticXMarketcap}
                    isAnimationActive={false}
                    activeDot={{
                      r: 6,
                      strokeWidth: 2,
                      stroke: chartColors.secondary.main,
                      fill: themeColors.background,
                      onClick: (data) => handleDataPointClick(data.payload)
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="xpMarketMarketcap"
                    stroke={chartColors.tertiary.main}
                    name="XPMarket"
                    strokeWidth={2}
                    dot={false}
                    hide={!visibleLines.xpMarketMarketcap}
                    isAnimationActive={false}
                    activeDot={{
                      r: 6,
                      strokeWidth: 2,
                      stroke: chartColors.tertiary.main,
                      fill: themeColors.background,
                      onClick: (data) => handleDataPointClick(data.payload)
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>

            {/* Token breakdown section - appears when a data point is clicked */}
            {selectedDataPoint && (
              <Box
                sx={{
                  mt: { xs: 1.5, sm: 2, md: 3 }, // Reduced margin on mobile
                  p: { xs: 1, sm: 1.5, md: 2 }, // Reduced padding on mobile
                  backgroundColor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(0, 0, 0, 0.4)'
                      : 'rgba(240, 240, 245, 0.8)',
                  borderRadius: 2,
                  border: `1px solid ${
                    theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(0, 0, 0, 0.1)'
                  }`
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2
                  }}
                >
                  <Typography variant="h6" sx={{ color: themeColors.text }}>
                    Token Breakdown for {selectedDataPoint.date}
                  </Typography>
                  <Box
                    sx={{
                      cursor: 'pointer',
                      color: themeColors.textSecondary,
                      '&:hover': { color: themeColors.text }
                    }}
                    onClick={() => setSelectedDataPoint(null)}
                  >
                    ✕
                  </Box>
                </Box>

                <Typography variant="body2" sx={{ color: themeColors.textSecondary, mb: 2 }}>
                  Total Market Cap:{' '}
                  {selectedDataPoint.totalMarketcap.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}{' '}
                  XRP
                  {hideSpecificTokens && (
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{
                        ml: 1,
                        color:
                          theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.6)'
                            : 'rgba(0, 0, 0, 0.6)',
                        fontStyle: 'italic'
                      }}
                    >
                      (excluding PLR, XRPS, mula, XAH)
                    </Typography>
                  )}
                </Typography>

                <Box>
                  {Object.keys(selectedDataPoint)
                    .filter(
                      (key) =>
                        key.endsWith('_marketcap') &&
                        selectedDataPoint[key] > 0 &&
                        (!hideSpecificTokens ||
                          !tokensToFilter.includes(key.replace('_marketcap', '')))
                    )
                    .sort((a, b) => selectedDataPoint[b] - selectedDataPoint[a])
                    .map((key) => {
                      const tokenName = key.replace('_marketcap', '');
                      const marketCap = selectedDataPoint[key];
                      const percentage = (marketCap / selectedDataPoint.totalMarketcap) * 100;

                      return (
                        <Box
                          key={key}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            mb: 1,
                            p: 1,
                            borderRadius: 1,
                            backgroundColor:
                              theme.palette.mode === 'dark'
                                ? 'rgba(255, 255, 255, 0.05)'
                                : 'rgba(0, 0, 0, 0.05)',
                            '&:hover': {
                              backgroundColor:
                                theme.palette.mode === 'dark'
                                  ? 'rgba(255, 255, 255, 0.1)'
                                  : 'rgba(0, 0, 0, 0.1)'
                            }
                          }}
                        >
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              backgroundColor: getTokenColor(
                                tokenName,
                                availableTokens.indexOf(tokenName)
                              ),
                              mr: 1.5
                            }}
                          />
                          <Typography
                            variant="body2"
                            sx={{
                              color: themeColors.text,
                              fontWeight: 500,
                              flex: 1
                            }}
                          >
                            {tokenName}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: themeColors.text,
                              mr: 2,
                              textAlign: 'right'
                            }}
                          >
                            {marketCap.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}{' '}
                            XRP
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: themeColors.textSecondary,
                              width: '60px',
                              textAlign: 'right'
                            }}
                          >
                            {percentage.toFixed(2)}%
                          </Typography>
                        </Box>
                      );
                    })}
                </Box>
              </Box>
            )}
          </ChartContainer>
        )}

        {/* Tab Panel 1: Token Market Caps */}
        {activeTab === 1 && (
          <ChartContainer
            title="Token Market Caps (XRP)"
            showFilter={true}
            onFilterChange={() => setHideSpecificTokens(!hideSpecificTokens)}
            filterActive={hideSpecificTokens}
          >
            {/* Add time range selector and token selector in a more compact layout */}
            <Box
              sx={{
                mb: { xs: 1, sm: 2 },
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'stretch', sm: 'center' },
                gap: 1
              }}
            >
              <Box
                sx={{
                  flex: 1,
                  maxWidth: { xs: '100%', sm: '60%' }
                }}
              >
                <Autocomplete
                  multiple
                  id="token-selector"
                  options={
                    hideSpecificTokens
                      ? availableTokens.filter((token) => !tokensToFilter.includes(token))
                      : availableTokens
                  }
                  value={selectedTokens.filter(
                    (token) => !hideSpecificTokens || !tokensToFilter.includes(token)
                  )}
                  onChange={handleTokenSelection}
                  size={isMobile ? 'small' : 'medium'} // Use smaller input on mobile
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="outlined"
                      label={isMobile ? 'Select Tokens' : 'Select Tokens (max 10 recommended)'}
                      placeholder={isMobile ? 'Add' : 'Add token'}
                      sx={{
                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                        borderRadius: 1,
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.1)'
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.2)'
                          }
                        },
                        '& .MuiInputLabel-root': {
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontSize: isMobile ? '0.75rem' : 'inherit'
                        },
                        '& .MuiInputBase-input': {
                          color: 'rgba(255, 255, 255, 0.9)',
                          padding: isMobile ? '8px 14px' : undefined
                        }
                      }}
                    />
                  )}
                  renderTags={(selected, getTagProps) =>
                    selected.map((option, index) => (
                      <Chip
                        key={option}
                        label={option}
                        {...getTagProps({ index })}
                        size={isMobile ? 'small' : 'medium'} // Smaller chips on mobile
                        sx={{
                          backgroundColor: getTokenColor(option, availableTokens.indexOf(option)),
                          color: 'white',
                          fontSize: isMobile ? '0.65rem' : '0.75rem',
                          height: isMobile ? '20px' : '32px'
                        }}
                      />
                    ))
                  }
                />
              </Box>
              <Tabs
                value={timeRange}
                onChange={(e, newValue) => handleTimeRangeChange(newValue)}
                variant="scrollable"
                scrollButtons={isMobile ? false : 'auto'} // Hide scroll buttons on mobile
                sx={{
                  minHeight: { xs: '28px', sm: '36px' }, // Smaller height on mobile
                  '& .MuiTabs-indicator': {
                    backgroundColor:
                      theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.8)'
                        : theme.palette.primary.main,
                    height: '2px'
                  },
                  '& .MuiTab-root': {
                    color:
                      theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.6)'
                        : 'rgba(0, 0, 0, 0.6)',
                    minHeight: { xs: '28px', sm: '36px' }, // Smaller height on mobile
                    padding: { xs: '2px 6px', sm: '6px 12px' }, // Reduced padding on mobile
                    minWidth: { xs: '40px', sm: '60px' }, // Smaller width on mobile
                    fontSize: { xs: '0.6rem', sm: '0.75rem' }, // Smaller font on mobile
                    '&.Mui-selected': {
                      color:
                        theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.95)'
                          : theme.palette.primary.main,
                      fontWeight: 600
                    }
                  }
                }}
              >
                <Tab label={isMobile ? 'All' : 'All Time'} value="all" />
                <Tab label="5Y" value="5y" />
                <Tab label="1Y" value="1y" />
                <Tab label="6M" value="6m" />
                <Tab label="1M" value="1m" />
              </Tabs>
            </Box>
            {isMobile ? (
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  display: 'block',
                  mt: 0.5,
                  mb: 1,
                  fontSize: '0.6rem'
                }}
              >
                Showing {selectedTokens.length} of {availableTokens.length} tokens
              </Typography>
            ) : (
              <Typography
                variant="caption"
                sx={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block', mt: 1, mb: 2 }}
              >
                Showing {selectedTokens.length} of {availableTokens.length} available tokens. Select
                fewer tokens for better performance.
              </Typography>
            )}

            {/* Add the missing chart content */}
            <Box sx={{ height: { xs: 300, sm: 350, md: 400 } }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={progressiveData}
                  margin={isMobile ? chartConfig.mobileMargin : chartConfig.margin}
                  isAnimationActive={false}
                  onClick={(data) => {
                    if (data && data.activePayload && data.activePayload.length > 0) {
                      handleDataPointClick(data.activePayload[0].payload);
                    }
                  }}
                >
                  <CartesianGrid {...chartConfig.gridStyle} />
                  <XAxis
                    dataKey="date"
                    angle={-45}
                    textAnchor="end"
                    height={isMobile ? 40 : 60}
                    interval={
                      isMobile
                        ? timeRange === 'all'
                          ? 60
                          : timeRange === '5y'
                          ? 40
                          : timeRange === '1y'
                          ? 20
                          : 10
                        : timeRange === 'all'
                        ? 30
                        : timeRange === '5y'
                        ? 20
                        : timeRange === '1y'
                        ? 10
                        : 5
                    }
                    tick={
                      isMobile ? { ...chartConfig.mobileAxisStyle } : { ...chartConfig.axisStyle }
                    }
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tickFormatter={(value) =>
                      value.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      }) + (isMobile ? '' : ' XRP')
                    }
                    tick={
                      isMobile ? { ...chartConfig.mobileAxisStyle } : { ...chartConfig.axisStyle }
                    }
                    width={isMobile ? 60 : 80}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ stroke: chartColors.cursorColor, strokeWidth: 1 }}
                  />
                  <Legend
                    content={({ payload }) => (
                      <CustomLegend
                        payload={payload}
                        visibleLines={visibleLines}
                        handleLegendClick={handleLegendClick}
                      />
                    )}
                  />

                  {/* Dynamically render lines for selected tokens */}
                  {selectedTokens.map((token, index) => {
                    const tokenKey = `${token}_marketcap`;
                    return (
                      <Line
                        key={tokenKey}
                        type="monotone"
                        dataKey={tokenKey}
                        stroke={getTokenColor(token, index)}
                        name={token}
                        strokeWidth={2}
                        dot={false}
                        hide={!visibleLines[tokenKey]}
                        isAnimationActive={false}
                        activeDot={{
                          r: 6,
                          strokeWidth: 2,
                          stroke: getTokenColor(token, index),
                          fill: themeColors.background,
                          onClick: (data) => handleDataPointClick(data.payload)
                        }}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </Box>

            {/* Token breakdown section - appears when a data point is clicked */}
            {selectedDataPoint && (
              <Box
                sx={{
                  mt: { xs: 1.5, sm: 2, md: 3 }, // Reduced margin on mobile
                  p: { xs: 1, sm: 1.5, md: 2 }, // Reduced padding on mobile
                  backgroundColor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(0, 0, 0, 0.4)'
                      : 'rgba(240, 240, 245, 0.8)',
                  borderRadius: 2,
                  border: `1px solid ${
                    theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(0, 0, 0, 0.1)'
                  }`
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2
                  }}
                >
                  <Typography variant="h6" sx={{ color: themeColors.text }}>
                    Token Details for {selectedDataPoint.date}
                  </Typography>
                  <Box
                    sx={{
                      cursor: 'pointer',
                      color: themeColors.textSecondary,
                      '&:hover': { color: themeColors.text }
                    }}
                    onClick={() => setSelectedDataPoint(null)}
                  >
                    ✕
                  </Box>
                </Box>

                <Box>
                  {selectedTokens
                    .filter((token) => selectedDataPoint[`${token}_marketcap`] > 0)
                    .sort(
                      (a, b) =>
                        selectedDataPoint[`${b}_marketcap`] - selectedDataPoint[`${a}_marketcap`]
                    )
                    .map((token) => {
                      const marketCapKey = `${token}_marketcap`;
                      const avgPriceKey = `${token}_avgPrice`;
                      const volumeKey = `${token}_volume`;
                      const tradesKey = `${token}_trades`;

                      const marketCap = selectedDataPoint[marketCapKey] || 0;
                      const avgPrice = selectedDataPoint[avgPriceKey] || 0;
                      const volume = selectedDataPoint[volumeKey] || 0;
                      const trades = selectedDataPoint[tradesKey] || 0;

                      return (
                        <Box
                          key={token}
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            mb: 1,
                            p: 1,
                            borderRadius: 1,
                            backgroundColor:
                              theme.palette.mode === 'dark'
                                ? 'rgba(255, 255, 255, 0.05)'
                                : 'rgba(0, 0, 0, 0.05)',
                            '&:hover': {
                              backgroundColor:
                                theme.palette.mode === 'dark'
                                  ? 'rgba(255, 255, 255, 0.1)'
                                  : 'rgba(0, 0, 0, 0.1)'
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                backgroundColor: getTokenColor(
                                  token,
                                  availableTokens.indexOf(token)
                                ),
                                mr: 1.5
                              }}
                            />
                            <Typography
                              variant="body2"
                              sx={{
                                color: themeColors.text,
                                fontWeight: 600,
                                flex: 1
                              }}
                            >
                              {token}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: themeColors.text,
                                fontWeight: 500
                              }}
                            >
                              {marketCap.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}{' '}
                              XRP
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                              gap: 1,
                              ml: 3.5
                            }}
                          >
                            {avgPrice > 0 && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: themeColors.textSecondary
                                }}
                              >
                                Avg Price:{' '}
                                {avgPrice.toLocaleString(undefined, {
                                  minimumFractionDigits: 6,
                                  maximumFractionDigits: 6
                                })}
                              </Typography>
                            )}
                            {volume > 0 && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: themeColors.textSecondary
                                }}
                              >
                                Volume:{' '}
                                {volume.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}{' '}
                                XRP
                              </Typography>
                            )}
                            {trades > 0 && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: themeColors.textSecondary
                                }}
                              >
                                Trades: {trades.toLocaleString()}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      );
                    })}
                </Box>
              </Box>
            )}
          </ChartContainer>
        )}

        {/* Tab Panel 2: Active Tokens by DEX */}
        {activeTab === 2 && (
          <ChartContainer title="Active Tokens by DEX">
            {/* Add time range selector */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Tabs
                value={timeRange}
                onChange={(e, newValue) => handleTimeRangeChange(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  minHeight: '36px',
                  '& .MuiTabs-indicator': {
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    height: '2px'
                  },
                  '& .MuiTab-root': {
                    color: 'rgba(255, 255, 255, 0.6)',
                    minHeight: '36px',
                    padding: '6px 12px',
                    minWidth: '60px',
                    fontSize: '0.75rem',
                    '&.Mui-selected': {
                      color: 'rgba(255, 255, 255, 0.95)',
                      fontWeight: 600
                    }
                  }
                }}
              >
                <Tab label="All Time" value="all" />
                <Tab label="5Y" value="5y" />
                <Tab label="1Y" value="1y" />
                <Tab label="6M" value="6m" />
                <Tab label="1M" value="1m" />
              </Tabs>
            </Box>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={progressiveData}
                  margin={chartConfig.margin}
                  isAnimationActive={false}
                  onClick={(data) => {
                    if (data && data.activePayload && data.activePayload.length > 0) {
                      handleDataPointClick(data.activePayload[0].payload);
                    }
                  }}
                >
                  <CartesianGrid {...chartConfig.gridStyle} />
                  <XAxis
                    dataKey="date"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={
                      timeRange === 'all'
                        ? 30
                        : timeRange === '5y'
                        ? 20
                        : timeRange === '1y'
                        ? 10
                        : 5
                    }
                    tick={{ ...chartConfig.axisStyle }}
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tickFormatter={(value) => value.toLocaleString()}
                    tick={{ ...chartConfig.axisStyle }}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ stroke: chartColors.cursorColor, strokeWidth: 1 }}
                  />
                  <Legend
                    content={({ payload }) => (
                      <CustomLegend
                        payload={payload}
                        visibleLines={visibleLines}
                        handleLegendClick={handleLegendClick}
                      />
                    )}
                  />
                  <Line
                    type="monotone"
                    dataKey="tokenCount"
                    stroke={chartColors.totalLine}
                    name="Total Active Tokens"
                    strokeWidth={3}
                    dot={false}
                    hide={!visibleLines.tokenCount}
                    isAnimationActive={false}
                    activeDot={{
                      r: 8,
                      strokeWidth: 2,
                      stroke: chartColors.totalLine,
                      fill: themeColors.background,
                      onClick: (data) => handleDataPointClick(data.payload)
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="firstLedgerTokens"
                    stroke={chartColors.primary.main}
                    name="FirstLedger"
                    strokeWidth={2}
                    dot={false}
                    hide={!visibleLines.firstLedgerTokens}
                    isAnimationActive={false}
                    activeDot={{
                      r: 6,
                      strokeWidth: 2,
                      stroke: chartColors.primary.main,
                      fill: themeColors.background,
                      onClick: (data) => handleDataPointClick(data.payload)
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="magneticXTokens"
                    stroke={chartColors.secondary.main}
                    name="Magnetic X"
                    strokeWidth={2}
                    dot={false}
                    hide={!visibleLines.magneticXTokens}
                    isAnimationActive={false}
                    activeDot={{
                      r: 6,
                      strokeWidth: 2,
                      stroke: chartColors.secondary.main,
                      fill: themeColors.background,
                      onClick: (data) => handleDataPointClick(data.payload)
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="xpMarketTokens"
                    stroke={chartColors.tertiary.main}
                    name="XPMarket"
                    strokeWidth={2}
                    dot={false}
                    hide={!visibleLines.xpMarketTokens}
                    isAnimationActive={false}
                    activeDot={{
                      r: 6,
                      strokeWidth: 2,
                      stroke: chartColors.tertiary.main,
                      fill: themeColors.background,
                      onClick: (data) => handleDataPointClick(data.payload)
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>

            {/* Token count breakdown section - appears when a data point is clicked */}
            {selectedDataPoint && (
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  backgroundColor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(0, 0, 0, 0.4)'
                      : 'rgba(240, 240, 245, 0.8)',
                  borderRadius: 2,
                  border: `1px solid ${
                    theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(0, 0, 0, 0.1)'
                  }`
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2
                  }}
                >
                  <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    Token Count Details for {selectedDataPoint.date}
                  </Typography>
                  <Box
                    sx={{
                      cursor: 'pointer',
                      color: 'rgba(255, 255, 255, 0.6)',
                      '&:hover': { color: 'rgba(255, 255, 255, 0.9)' }
                    }}
                    onClick={() => setSelectedDataPoint(null)}
                  >
                    ✕
                  </Box>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}
                  >
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Total Active Tokens
                    </Typography>
                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
                      {selectedDataPoint.tokenCount.toLocaleString()}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}
                  >
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      FirstLedger Tokens
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{ color: chartColors.primary.main, fontWeight: 600 }}
                    >
                      {selectedDataPoint.firstLedgerTokens.toLocaleString()}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}
                  >
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Magnetic X Tokens
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{ color: chartColors.secondary.main, fontWeight: 600 }}
                    >
                      {selectedDataPoint.magneticXTokens.toLocaleString()}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}
                  >
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      XPMarket Tokens
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{ color: chartColors.tertiary.main, fontWeight: 600 }}
                    >
                      {selectedDataPoint.xpMarketTokens.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </ChartContainer>
        )}

        {/* Tab Panel 3: Trading Activity */}
        {activeTab === 3 && (
          <ChartContainer title="Trading Activity">
            {/* Add time range selector */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Tabs
                value={timeRange}
                onChange={(e, newValue) => handleTimeRangeChange(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  minHeight: '36px',
                  '& .MuiTabs-indicator': {
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    height: '2px'
                  },
                  '& .MuiTab-root': {
                    color: 'rgba(255, 255, 255, 0.6)',
                    minHeight: '36px',
                    padding: '6px 12px',
                    minWidth: '60px',
                    fontSize: '0.75rem',
                    '&.Mui-selected': {
                      color: 'rgba(255, 255, 255, 0.95)',
                      fontWeight: 600
                    }
                  }
                }}
              >
                <Tab label="All Time" value="all" />
                <Tab label="5Y" value="5y" />
                <Tab label="1Y" value="1y" />
                <Tab label="6M" value="6m" />
                <Tab label="1M" value="1m" />
              </Tabs>
            </Box>
            <Box sx={{ height: 400, backgroundColor: 'transparent' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={progressiveData}
                  margin={chartConfig.margin}
                  style={{
                    backgroundColor: 'transparent'
                  }}
                  isAnimationActive={false}
                  onClick={(data) => {
                    if (data && data.activePayload && data.activePayload.length > 0) {
                      handleDataPointClick(data.activePayload[0].payload);
                    }
                  }}
                >
                  <CartesianGrid {...chartConfig.gridStyle} opacity={0.1} />
                  <XAxis
                    dataKey="date"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={
                      timeRange === 'all'
                        ? 30
                        : timeRange === '5y'
                        ? 20
                        : timeRange === '1y'
                        ? 10
                        : 5
                    }
                    tick={{ ...chartConfig.axisStyle }}
                  />
                  <YAxis
                    yAxisId="volume"
                    orientation="left"
                    domain={['dataMin - 1000', 'dataMax + 1000']}
                    tickFormatter={(value) => value.toLocaleString() + ' XRP'}
                    tick={{ ...chartConfig.axisStyle }}
                  />
                  <YAxis
                    yAxisId="trades"
                    orientation="right"
                    domain={['dataMin - 100', 'dataMax + 100']}
                    tickFormatter={(value) => value.toLocaleString()}
                    tick={{ ...chartConfig.axisStyle }}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ stroke: chartColors.cursorColor, strokeWidth: 1 }}
                  />
                  <Legend
                    content={({ payload }) => (
                      <CustomLegend
                        payload={payload}
                        visibleLines={visibleLines}
                        handleLegendClick={handleLegendClick}
                      />
                    )}
                  />
                  <Line
                    yAxisId="volume"
                    type="monotone"
                    dataKey="volumeAMM"
                    stroke={chartColors.primary.main}
                    name="AMM Volume"
                    strokeWidth={2}
                    dot={false}
                    hide={!visibleLines.volumeAMM}
                    isAnimationActive={false}
                    activeDot={{
                      r: 8,
                      strokeWidth: 2,
                      stroke: chartColors.primary.main,
                      fill: themeColors.background,
                      onClick: (data) => handleDataPointClick(data.payload)
                    }}
                  />
                  <Line
                    yAxisId="volume"
                    type="monotone"
                    dataKey="volumeNonAMM"
                    stroke={chartColors.secondary.main}
                    name="Non-AMM Volume"
                    strokeWidth={2}
                    dot={false}
                    hide={!visibleLines.volumeNonAMM}
                    isAnimationActive={false}
                    activeDot={{
                      r: 6,
                      strokeWidth: 2,
                      stroke: chartColors.secondary.main,
                      fill: themeColors.background,
                      onClick: (data) => handleDataPointClick(data.payload)
                    }}
                  />
                  <Line
                    yAxisId="trades"
                    type="monotone"
                    dataKey="tradesAMM"
                    stroke={`${chartColors.primary.main}80`}
                    name="AMM Trades"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    dot={false}
                    hide={!visibleLines.tradesAMM}
                    isAnimationActive={false}
                    activeDot={{
                      r: 6,
                      strokeWidth: 2,
                      stroke: chartColors.primary.main,
                      fill: themeColors.background,
                      onClick: (data) => handleDataPointClick(data.payload)
                    }}
                  />
                  <Line
                    yAxisId="trades"
                    type="monotone"
                    dataKey="tradesNonAMM"
                    stroke={`${chartColors.secondary.main}80`}
                    name="Non-AMM Trades"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    dot={false}
                    hide={!visibleLines.tradesNonAMM}
                    isAnimationActive={false}
                    activeDot={{
                      r: 6,
                      strokeWidth: 2,
                      stroke: chartColors.secondary.main,
                      fill: themeColors.background,
                      onClick: (data) => handleDataPointClick(data.payload)
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>

            {/* Trading activity breakdown section - appears when a data point is clicked */}
            {selectedDataPoint && (
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  backgroundColor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(0, 0, 0, 0.4)'
                      : 'rgba(240, 240, 245, 0.8)',
                  borderRadius: 2,
                  border: `1px solid ${
                    theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(0, 0, 0, 0.1)'
                  }`
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2
                  }}
                >
                  <Typography variant="h6" sx={{ color: themeColors.text }}>
                    Trading Activity for {selectedDataPoint.date}
                  </Typography>
                  <Box
                    sx={{
                      cursor: 'pointer',
                      color: themeColors.textSecondary,
                      '&:hover': { color: themeColors.text }
                    }}
                    onClick={() => setSelectedDataPoint(null)}
                  >
                    ✕
                  </Box>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <Typography variant="body2" sx={{ color: themeColors.textSecondary, mb: 1 }}>
                      Volume
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: chartColors.primary.main }}>
                        AMM:
                      </Typography>
                      <Typography variant="body2" sx={{ color: themeColors.text, fontWeight: 500 }}>
                        {selectedDataPoint.volumeAMM.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}{' '}
                        XRP
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: chartColors.secondary.main }}>
                        Non-AMM:
                      </Typography>
                      <Typography variant="body2" sx={{ color: themeColors.text, fontWeight: 500 }}>
                        {selectedDataPoint.volumeNonAMM.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}{' '}
                        XRP
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        pt: 1,
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      <Typography variant="body2" sx={{ color: 'white' }}>
                        Total:
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                        {selectedDataPoint.totalVolume.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}{' '}
                        XRP
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                      Trades
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: chartColors.primary.main }}>
                        AMM:
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                        {selectedDataPoint.tradesAMM.toLocaleString()}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: chartColors.secondary.main }}>
                        Non-AMM:
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                        {selectedDataPoint.tradesNonAMM.toLocaleString()}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        pt: 1,
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      <Typography variant="body2" sx={{ color: 'white' }}>
                        Total:
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                        {(
                          selectedDataPoint.totalTrades ||
                          0 ||
                          (selectedDataPoint.tradesAMM || 0) + (selectedDataPoint.tradesNonAMM || 0)
                        ).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}
          </ChartContainer>
        )}

        {/* Tab Panel 4: Unique Active Addresses */}
        {activeTab === 4 && (
          <ChartContainer title="Unique Active Addresses">
            {/* Add time range selector */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Tabs
                value={timeRange}
                onChange={(e, newValue) => handleTimeRangeChange(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  minHeight: '36px',
                  '& .MuiTabs-indicator': {
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    height: '2px'
                  },
                  '& .MuiTab-root': {
                    color: 'rgba(255, 255, 255, 0.6)',
                    minHeight: '36px',
                    padding: '6px 12px',
                    minWidth: '60px',
                    fontSize: '0.75rem',
                    '&.Mui-selected': {
                      color: 'rgba(255, 255, 255, 0.95)',
                      fontWeight: 600
                    }
                  }
                }}
              >
                <Tab label="All Time" value="all" />
                <Tab label="5Y" value="5y" />
                <Tab label="1Y" value="1y" />
                <Tab label="6M" value="6m" />
                <Tab label="1M" value="1m" />
              </Tabs>
            </Box>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={progressiveData}
                  margin={chartConfig.margin}
                  isAnimationActive={false}
                  onClick={(data) => {
                    if (data && data.activePayload && data.activePayload.length > 0) {
                      handleDataPointClick(data.activePayload[0].payload);
                    }
                  }}
                >
                  <CartesianGrid {...chartConfig.gridStyle} />
                  <XAxis
                    dataKey="date"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={
                      timeRange === 'all'
                        ? 30
                        : timeRange === '5y'
                        ? 20
                        : timeRange === '1y'
                        ? 10
                        : 5
                    }
                    tick={{ ...chartConfig.axisStyle }}
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tickFormatter={(value) => value.toLocaleString()}
                    tick={{ ...chartConfig.axisStyle }}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ stroke: chartColors.cursorColor, strokeWidth: 1 }}
                  />
                  <Legend
                    content={({ payload }) => (
                      <CustomLegend
                        payload={payload}
                        visibleLines={visibleLines}
                        handleLegendClick={handleLegendClick}
                      />
                    )}
                  />
                  <Line
                    type="monotone"
                    dataKey="uniqueActiveAddressesAMM"
                    stroke={chartColors.primary.main}
                    name="AMM Active Addresses"
                    strokeWidth={2}
                    dot={false}
                    hide={!visibleLines.uniqueActiveAddressesAMM}
                    isAnimationActive={false}
                    activeDot={{
                      r: 8,
                      strokeWidth: 2,
                      stroke: chartColors.primary.main,
                      fill: themeColors.background,
                      onClick: (data) => handleDataPointClick(data.payload)
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="uniqueActiveAddressesNonAMM"
                    stroke={chartColors.secondary.main}
                    name="Non-AMM Active Addresses"
                    strokeWidth={2}
                    dot={false}
                    hide={!visibleLines.uniqueActiveAddressesNonAMM}
                    isAnimationActive={false}
                    activeDot={{
                      r: 6,
                      strokeWidth: 2,
                      stroke: chartColors.secondary.main,
                      fill: themeColors.background,
                      onClick: (data) => handleDataPointClick(data.payload)
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>

            {/* Active addresses breakdown section - appears when a data point is clicked */}
            {selectedDataPoint && (
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  backgroundColor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(0, 0, 0, 0.4)'
                      : 'rgba(240, 240, 245, 0.8)',
                  borderRadius: 2,
                  border: `1px solid ${
                    theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(0, 0, 0, 0.1)'
                  }`
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2
                  }}
                >
                  <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    Active Addresses for {selectedDataPoint.date}
                  </Typography>
                  <Box
                    sx={{
                      cursor: 'pointer',
                      color: 'rgba(255, 255, 255, 0.6)',
                      '&:hover': { color: 'rgba(255, 255, 255, 0.9)' }
                    }}
                    onClick={() => setSelectedDataPoint(null)}
                  >
                    ✕
                  </Box>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}
                  >
                    <Typography variant="body2" sx={{ color: chartColors.primary.main }}>
                      AMM Active Addresses
                    </Typography>
                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
                      {selectedDataPoint.uniqueActiveAddressesAMM.toLocaleString()}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}
                  >
                    <Typography variant="body2" sx={{ color: chartColors.secondary.main }}>
                      Non-AMM Active Addresses
                    </Typography>
                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
                      {selectedDataPoint.uniqueActiveAddressesNonAMM.toLocaleString()}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}
                  >
                    <Typography variant="body2" sx={{ color: 'white' }}>
                      Total Active Addresses
                    </Typography>
                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
                      {(
                        selectedDataPoint.uniqueActiveAddresses ||
                        selectedDataPoint.uniqueActiveAddressesAMM +
                          selectedDataPoint.uniqueActiveAddressesNonAMM
                      ).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </ChartContainer>
        )}
      </Container>
    </Box>
  );
};

const MarketMetricsPage = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Topbar />
      <Header />
      <Box sx={{ flex: 1 }}>
        <MarketMetricsContent />
      </Box>
      <Footer />
    </Box>
  );
};

export default MarketMetricsPage;
