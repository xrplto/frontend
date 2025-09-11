import React, { useState, useEffect, useCallback, useRef, useLayoutEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
// Removed recharts - will use lightweight-charts instead
/*
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
*/
import axios from 'axios';
import { format, subYears, isAfter, parse } from 'date-fns';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Portal from '@mui/material/Portal';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import Topbar from 'src/components/Topbar';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles'; // Add alpha import
import useMediaQuery from '@mui/material/useMediaQuery';
import Link from 'next/link'; // Import Link
import useWebSocket from 'react-use-websocket'; // Add WebSocket import
import { useDispatch } from 'react-redux'; // Add Redux dispatch import
import { update_metrics } from 'src/redux/statusSlice'; // Add Redux action import

// Import lightweight chart component
const LightweightChart = dynamic(
  () => import('src/components/LightweightChart'),
  { ssr: false }
);

// Updated theme-aware colors with portfolio styling
const getThemeColors = (theme) => {
  const isDarkMode = theme.palette.mode === 'dark';

  return {
    background: theme.palette.background.default, // Use default background
    backgroundGradient: 'none', // Remove gradient
    cardBg: isDarkMode
      ? `rgba(255, 255, 255, 0.05)` // Subtle glass effect
      : `rgba(255, 255, 255, 0.6)`,
    cardBorder: isDarkMode ? alpha(theme.palette.divider, 0.1) : alpha(theme.palette.divider, 0.1),
    cardHoverBorder: isDarkMode
      ? alpha(theme.palette.primary.main, 0.3)
      : alpha(theme.palette.primary.main, 0.2),
    text: theme.palette.text.primary,
    textSecondary: theme.palette.text.secondary,
    grid: isDarkMode ? alpha(theme.palette.divider, 0.1) : alpha(theme.palette.divider, 0.1)
  };
};

// Add theme-aware colors for chart elements
const getChartColors = (theme) => {
  const isDarkMode = theme.palette.mode === 'dark';

  // A more professional and harmonious color palette
  const platformColors = {
    firstLedger: '#4E79A7', // Muted Blue
    magneticX: '#59A14F', // Muted Green
    xpMarket: '#F28E2B', // Muted Orange
    ledgerMeme: '#B07AA1' // Muted Purple
  };

  return {
    totalLine: theme.palette.primary.main, // Use primary color for main line
    totalLineFill: isDarkMode
      ? alpha(theme.palette.primary.main, 0.1)
      : alpha(theme.palette.primary.main, 0.1),
    cursorColor: isDarkMode
      ? alpha(theme.palette.text.primary, 0.1)
      : alpha(theme.palette.text.primary, 0.05),
    legendBg: `transparent`, // Transparent legend background
    scrollThumb: alpha(theme.palette.text.secondary, 0.3),
    // Updated color sets for platforms
    primary: {
      main: platformColors.firstLedger,
      light: alpha(platformColors.firstLedger, 0.1),
      dark: alpha(platformColors.firstLedger, 0.8)
    },
    secondary: {
      main: platformColors.magneticX,
      light: alpha(platformColors.magneticX, 0.1),
      dark: alpha(platformColors.magneticX, 0.8)
    },
    tertiary: {
      main: platformColors.xpMarket,
      light: alpha(platformColors.xpMarket, 0.1),
      dark: alpha(platformColors.xpMarket, 0.8)
    },
    quaternary: {
      main: platformColors.ledgerMeme,
      light: alpha(platformColors.ledgerMeme, 0.1),
      dark: alpha(platformColors.ledgerMeme, 0.8)
    }
  };
};

// Custom tooltip styles
const CustomTooltip = ({ active, payload, label }) => {
  const [tooltipRoot, setTooltipRoot] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const contentRef = useRef(null);

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
  useLayoutEffect(() => {
    if (tooltipRoot) {
      let top = mousePosition.y - 10;
      let left = mousePosition.x + 20;

      if (contentRef.current) {
        const { clientWidth: tooltipWidth, clientHeight: tooltipHeight } = contentRef.current;
        const { innerWidth: windowWidth, innerHeight: windowHeight } = window;

        // Adjust horizontal position
        if (left + tooltipWidth > windowWidth) {
          left = mousePosition.x - tooltipWidth - 20;
        }

        // Adjust vertical position
        if (top + tooltipHeight > windowHeight) {
          top = windowHeight - tooltipHeight - 10;
        }

        // Ensure it doesn't go off the top of the screen
        if (top < 0) {
          top = 10;
        }
      }

      tooltipRoot.style.left = `${left}px`;
      tooltipRoot.style.top = `${top}px`;
    }
  }, [mousePosition, tooltipRoot, active, payload]);

  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  if (active && payload && payload.length && tooltipRoot) {
    // Sort payload by value in descending order
    const sortedPayload = [...payload].sort((a, b) => b.value - a.value);

    return (
      <Portal container={tooltipRoot}>
        <Paper
          ref={contentRef}
          elevation={6}
          sx={{
            background: alpha(theme.palette.background.paper, 0.9),
            border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
            p: { xs: 1, sm: 2 },
            borderRadius: '16px',
            boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.1)}`,
            maxWidth: { xs: 250, sm: 300 },
            maxHeight: '80vh',
            overflow: 'auto',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`,
              borderRadius: '16px 16px 0 0',
              opacity: 0
            }
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              color: theme.palette.text.primary,
              mb: 1,
              fontWeight: 600,
              fontSize: { xs: '0.7rem', sm: '0.8rem' },
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
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
                key={entry.dataKey || `${entry.name}-${index}`}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  mb: 0.5,
                  justifyContent: 'space-between',
                  p: 1,
                  borderRadius: '8px',
                  background: alpha(theme.palette.background.paper, 0.4),
                  border: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: alpha(theme.palette.primary.main, 0.05),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                  }
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
                      boxShadow: `0 0 8px ${alpha(entry.color || entry.stroke, 0.4)}`
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.primary,
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
                      color: theme.palette.text.primary,
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
                        color: theme.palette.text.secondary,
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
                        color: theme.palette.text.secondary,
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
                        color: theme.palette.text.secondary,
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
          width: 12,
          height: 12,
          minWidth: 12,
          backgroundColor: entry.color,
          mr: 1,
          opacity: visible ? 1 : 0.4,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'scale(1.1)'
          }
        }}
      />
      <Box sx={{ display: 'flex', alignItems: 'center' }}>{entry.value}</Box>
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

// Chart Container Component with updated styling
const ChartContainer = ({ title, children, showFilter, onFilterChange, filterActive }) => {
  const theme = useTheme();
  const themeColors = getThemeColors(theme);
  const chartColors = getChartColors(theme);

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        mb: { xs: 2, sm: 3, md: 4 },
        borderRadius: '24px',
        background: 'transparent',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${themeColors.cardBorder}`,
        boxShadow: `none`,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'none',
          boxShadow: `none`,
          border: `1px solid ${themeColors.cardHoverBorder}`
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
            fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' },
            letterSpacing: '-0.02em',
            background: 'none',
            WebkitBackgroundClip: 'unset',
            WebkitTextFillColor: 'unset'
          }}
        >
          {title}
        </Typography>

        {showFilter && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              onClick={onFilterChange}
              sx={{
                width: { xs: 36, sm: 42 },
                height: { xs: 20, sm: 24 },
                backgroundColor: filterActive
                  ? alpha(theme.palette.primary.main, 0.8)
                  : alpha(theme.palette.text.secondary, 0.2),
                borderRadius: 12,
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                padding: '0 2px',
                border: `1px solid ${alpha(theme.palette.primary.main, filterActive ? 0.3 : 0.1)}`,
                boxShadow: filterActive
                  ? `0 0 12px ${alpha(theme.palette.primary.main, 0.3)}`
                  : 'none'
              }}
            >
              <Box
                sx={{
                  width: { xs: 16, sm: 20 },
                  height: { xs: 16, sm: 20 },
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: '50%',
                  position: 'absolute',
                  left: filterActive ? 'calc(100% - 22px)' : '2px',
                  transition: 'all 0.3s ease',
                  boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.15)}`
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

const tokenColorMap = {};

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
    ledgerMemeMarketcap: true,
    firstLedgerTokens: true,
    magneticXTokens: true,
    xpMarketTokens: true,
    ledgerMemeTokens: true,
    uniqueActiveAddressesAMM: true,
    uniqueActiveAddressesNonAMM: true
  });

  // Add state to track available tokens
  const [availableTokens, setAvailableTokens] = useState([]);

  // Function to get a color for a token (either from map or generate one)
  const getTokenColor = (tokenName) => {
    if (tokenColorMap[tokenName]) {
      return tokenColorMap[tokenName];
    }
    // Using a more minimalist and programmatic color generation
    const colors = [
      '#e6194B',
      '#3cb44b',
      '#ffe119',
      '#4363d8',
      '#f58231',
      '#911eb4',
      '#42d4f4',
      '#f032e6',
      '#bfef45',
      '#fabed4',
      '#469990',
      '#dcbeff',
      '#9A6324',
      '#fffac8',
      '#800000',
      '#aaffc3',
      '#808000',
      '#ffd8b1',
      '#000075',
      '#a9a9a9'
    ];

    // Use the token's index in the master list of available tokens for a consistent color.
    const tokenIndex = availableTokens.indexOf(tokenName);

    // Use modulo to wrap around the color list if there are more tokens than colors.
    // Fallback to 0 if token is not found (should not happen in normal flow).
    const colorIndex = tokenIndex !== -1 ? tokenIndex % colors.length : 0;

    const color = colors[colorIndex];
    tokenColorMap[tokenName] = color;
    return color;
  };

  // Helper function to generate series for different chart types
  const getChartSeries = (type) => {
    switch (type) {
      case 'marketcap':
        return [
          {
            dataKey: "totalMarketcap",
            name: "Total",
            color: chartColors.totalLine,
            lineWidth: 3,
            visible: visibleLines.totalMarketcap
          },
          {
            dataKey: "firstLedgerMarketcap", 
            name: "FirstLedger",
            color: chartColors.primary.main,
            lineWidth: 2,
            visible: visibleLines.firstLedgerMarketcap
          },
          {
            dataKey: "magneticXMarketcap",
            name: "Magnetic X", 
            color: chartColors.secondary.main,
            lineWidth: 2,
            visible: visibleLines.magneticXMarketcap
          },
          {
            dataKey: "xpMarketMarketcap",
            name: "XPMarket",
            color: chartColors.tertiary.main,
            lineWidth: 2,
            visible: visibleLines.xpMarketMarketcap
          },
          {
            dataKey: "ledgerMemeMarketcap",
            name: "LedgerMeme",
            color: chartColors.quaternary.main,
            lineWidth: 2,
            visible: visibleLines.ledgerMemeMarketcap
          }
        ];
      case 'tokens':
        return selectedTokens.map(token => ({
          dataKey: `${token}_marketcap`,
          name: token,
          color: getTokenColor(token),
          lineWidth: 2,
          visible: visibleLines[`${token}_marketcap`]
        }));
      case 'activity':
        return [
          {
            dataKey: "tokenCount",
            name: "Active Tokens",
            color: chartColors.primary.main,
            lineWidth: 2,
            visible: visibleLines.tokenCount
          }
        ];
      case 'trading':
        return [
          {
            dataKey: "volumeAMM",
            name: "AMM Volume",
            color: chartColors.primary.main,
            lineWidth: 2,
            visible: visibleLines.volumeAMM
          },
          {
            dataKey: "volumeNonAMM",
            name: "Non-AMM Volume",
            color: chartColors.secondary.main,
            lineWidth: 2,
            visible: visibleLines.volumeNonAMM
          }
        ];
      case 'addresses':
        return [
          {
            dataKey: "uniqueActiveAddressesAMM",
            name: "AMM Addresses",
            color: chartColors.primary.main,
            lineWidth: 2,
            visible: visibleLines.uniqueActiveAddressesAMM
          },
          {
            dataKey: "uniqueActiveAddressesNonAMM",
            name: "Non-AMM Addresses",
            color: chartColors.secondary.main,
            lineWidth: 2,
            visible: visibleLines.uniqueActiveAddressesNonAMM
          }
        ];
      default:
        return [];
    }
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
    // Check if the input is a string (a new token)
    if (typeof newValue === 'string') {
      // Find the corresponding token object from available tokens
      const tokenObject = availableTokens.find((token) => token.name === newValue);
      if (tokenObject) {
        setSelectedTokens((prev) =>
          prev.find((t) => t.name === tokenObject.name) ? prev : [...prev, tokenObject]
        );
      }
    } else if (Array.isArray(newValue)) {
      setSelectedTokens(newValue);
    }

    // Set filter active state based on whether there are any selected tokens
    setFilterActive(newValue.length > 0);
  };

  const handleFilterChange = (isActive) => {
    if (!isActive) {
      setSelectedTokens([]); // Clear selected tokens when filter is deactivated
    }
    setFilterActive(isActive);
  };

  const handleDataPointClick = (data) => {
    if (data && data.activePayload) {
      const date = data.activeLabel;
      const now = new Date();
      // Additional logic for handling clicks
    }
  };

  const handleAnimationEnd = () => {
    setIsChartReady(true); // Chart is ready after initial animation
  };

  useEffect(() => {
    const activeLines = Object.keys(visibleLines).filter((key) => visibleLines[key]);
    if (activeLines.length === 0) {
      const initialVisible = {};
      const initialTokens = availableTokens.slice(0, 5).map((token) => token.name);
      availableTokens.forEach((token) => {
        initialVisible[token.name] = initialTokens.includes(token.name);
      });
      setVisibleLines(initialVisible);
    }
  }, [availableTokens, visibleLines]);

  // Add state for data sampling and time range
  const [sampledData, setSampledData] = useState([]);
  const [timeRange, setTimeRange] = useState('all'); // 'all', '5y', '1y', '6m', '1m'

  // Function to sample data based on time range
  const sampleDataByTimeRange = useCallback(
    (fullData, range) => {
      if (!fullData || fullData.length === 0) return [];

      let filteredData = [...fullData];
      const now = new Date();

      // Filter data based on selected time range
      if (range !== 'all') {
        let cutoffDate = new Date();
        
        switch (range) {
          case '5y':
            cutoffDate = subYears(new Date(), 5);
            break;
          case '1y':
            cutoffDate = subYears(new Date(), 1);
            break;
          case '6m':
            cutoffDate = new Date();
            cutoffDate.setMonth(cutoffDate.getMonth() - 6);
            break;
          case '1m':
            cutoffDate = new Date();
            cutoffDate.setMonth(cutoffDate.getMonth() - 1);
            break;
        }
        
        filteredData = filteredData.filter((item) => {
          try {
            const itemDate = parse(item.date, 'MMM dd yyyy', new Date());
            return isAfter(itemDate, cutoffDate);
          } catch (e) {
            // If date parsing fails, try other formats or skip
            try {
              const itemDate = new Date(item.date);
              return isAfter(itemDate, cutoffDate);
            } catch (e2) {
              return true; // Include item if date can't be parsed
            }
          }
        });
      }

      // Further filter by token names if any are selected
      if (selectedTokens.length > 0) {
        filteredData = filteredData.filter((item) =>
          selectedTokens.some((token) => item[`${token}_marketcap`] > 0)
        );
      }

      // Return all data points without sampling to ensure daily data
      return filteredData;
    },
    [selectedTokens]
  );

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

  // Add this state and ref at the top
  const [animationComplete, setAnimationComplete] = useState(false);
  const chartRef = useRef(null);

  // Add this state for progressive data loading
  const [progressiveData, setProgressiveData] = useState([]);

  // Set progressive data without flickering
  useLayoutEffect(() => {
    setProgressiveData(sampledData);
    setAnimationComplete(true);
  }, [sampledData]);

  // Add theme hook
  const theme = useTheme();
  const themeColors = getThemeColors(theme);
  const chartColors = getChartColors(theme);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    setSampledData(sampleDataByTimeRange(data, timeRange));
  }, [data, timeRange, selectedTokens, sampleDataByTimeRange]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get current date
        const endDate = format(new Date(), 'yyyy-MM-dd');
        // Get date 10 years ago
        const startDate = format(subYears(new Date(), 14), 'yyyy-MM-dd');

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
              date: format(new Date(item.date), 'MMM dd yyyy'), // Use UTC to avoid timezone issues
              totalMarketcap: Number(item.totalMarketcap.toFixed(2)), // Use filtered marketcap
              firstLedgerMarketcap: Number((item.firstLedgerMarketcap || 0).toFixed(2)), // Use filtered FirstLedger marketcap
              magneticXMarketcap: Number(item.magneticXMarketcap?.toFixed(2) || 0),
              xpMarketMarketcap: Number(item.xpMarketMarketcap?.toFixed(2) || 0),
              ledgerMemeMarketcap: Number(item.ledgerMemeMarketcap?.toFixed(2) || 0),
              volumeNonAMM: Number(item.volumeNonAMM.toFixed(2)),
              volumeAMM: Number(item.volumeAMM.toFixed(2)),
              totalVolume: Number((item.volumeAMM + item.volumeNonAMM).toFixed(2)),
              tokenCount: Number(item.tokenCount),
              firstLedgerTokens: Number(item.firstLedgerTokenCount || 0),
              magneticXTokens: Number(item.magneticXTokenCount || 0),
              xpMarketTokens: Number(item.xpMarketTokenCount || 0),
              ledgerMemeTokens: Number(item.ledgerMemeTokenCount || 0),
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

        let topTokensForDescription = []; // Initialize here

        // Initialize with top tokens by market cap (if available)
        if (tokenArray.length > 0) {
          // Get the most recent data point
          const latestData = formattedData[formattedData.length - 1];

          // Sort tokens by market cap
          const sortedTokens = tokenArray
            .filter((token) => latestData[`${token}_marketcap`])
            .sort(
              (a, b) => (latestData[`${b}_marketcap`] || 0) - (latestData[`${a}_marketcap`] || 0)
            );

          // Select top N tokens for display and description
          const topTokensToDisplay = sortedTokens.slice(0, maxTokensToDisplay);
          topTokensForDescription = sortedTokens.slice(0, 5); // Get top 5 for description

          setSelectedTokens(topTokensToDisplay);
        }

        setData(formattedData);
        // Initialize sampled data with the full dataset
        setSampledData(sampleDataByTimeRange(formattedData, timeRange));

        // Set the dynamic description *after* top tokens are determined
        // (This part is moved outside useEffect for clarity, see below)
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [maxTokensToDisplay]);

  // Generate dynamic description text
  const generateDescription = () => {
    if (loading || selectedTokens.length === 0) {
      // Default text while loading or if no tokens
      return 'Stay updated on the latest XRPL token market trends, including top performers, overall market activity, and DEX-specific insights, all conveniently accessible here.';
    }

    // Get the top N tokens (up to 5) from the initially selected/sorted list
    // Note: selectedTokens might change later due to user interaction,
    // so we rely on the initial sort order from useEffect or re-sort if needed.
    // For simplicity, we'll use the current selectedTokens, assuming the top ones are still there.
    const topTokens = selectedTokens.slice(0, 5); // Take the first 5 from the current selection

    let tokenListString = '';
    if (topTokens.length > 0) {
      tokenListString = topTokens.join(', ');
      if (selectedTokens.length > topTokens.length) {
        tokenListString += ', and more';
      }
    } else {
      tokenListString = 'various tokens';
    }

    return `Stay updated on the latest XRPL token market trends, including top performers like ${tokenListString}, overall market activity, and DEX-specific insights, all conveniently accessible here.`;
  };

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

  // Add this function to fetch token images
  const fetchTokenImage = async (tokenId) => {
    try {
      // Only attempt to fetch if we have a valid tokenId (not 'Unknown')
      if (tokenId && tokenId !== 'Unknown') {
        const response = await axios.get(`https://s1.xrpl.to/token/${tokenId}`);
        if (response.data && response.data.image) {
          return response.data.image;
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching token image:', error);
      return null;
    }
  };

  // This is where the error occurred in the previous attempt.
  // Let's replace the whole useMemo.
  const processedChartData = useMemo(() => {
    let filteredData = [...data];
    const now = new Date();

    const rangeMap = {
      '5y': 5,
      '1y': 1,
      '6m': 0.5,
      '1m': 1 / 12
    };

    // Filter data based on selected time range
    if (rangeMap[timeRange]) {
      const cutoffDate = subYears(now, rangeMap[timeRange]);
      filteredData = data.filter((item) =>
        isAfter(parse(item.date, 'MMM dd yyyy', new Date()), cutoffDate)
      );
    }

    // Further filter by token names if any are selected
    if (selectedTokens.length > 0) {
      filteredData = filteredData.filter((item) =>
        selectedTokens.some((token) => item[`${token}_marketcap`] > 0)
      );
    }

    // Return all data points without sampling to ensure daily data
    return filteredData;
  }, [data, timeRange, selectedTokens]);

  return (
    <Box
      sx={{
        flex: 1,
        py: { xs: 1, sm: 2, md: 3 },
        backgroundColor: 'transparent',
        backgroundImage: `linear-gradient(135deg, ${alpha(
          theme.palette.background.default,
          0.95
        )} 0%, ${alpha(theme.palette.background.default, 0.8)} 100%)`,
        minHeight: '100vh',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 20% 50%, ${alpha(
            theme.palette.primary.main,
            0.03
          )} 0%, transparent 50%), radial-gradient(circle at 80% 20%, ${alpha(
            theme.palette.success.main,
            0.03
          )} 0%, transparent 50%)`,
          pointerEvents: 'none'
        }
      }}
    >
      <Container
        maxWidth="xl"
        sx={{
          mt: { xs: 2, sm: 3, md: 4 },
          mb: { xs: 2, sm: 3, md: 4 },
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Add the new overview section */}
        <Box sx={{ mb: { xs: 3, sm: 4, md: 5 } }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1,
              mb: 1.5,
              p: 3,
              borderRadius: '20px',
              background: 'transparent',
              border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              boxShadow: 'none',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h4"
                sx={{
                  color: themeColors.text,
                  fontWeight: 700,
                  fontSize: { xs: '1.6rem', sm: '1.8rem', md: '2.1rem' },
                  letterSpacing: '-0.02em',
                  background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${alpha(
                    theme.palette.primary.main,
                    0.8
                  )} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1
                }}
              >
                Token Market Overview
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: themeColors.textSecondary,
                  fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
                  maxWidth: '600px',
                  lineHeight: 1.6
                }}
              >
                {/* Use the dynamic description */}
                {generateDescription()}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Add tabs for chart categories */}
        <Paper
          elevation={0}
          sx={{
            mb: { xs: 2, sm: 3, md: 4 },
            borderRadius: '20px',
            background: 'transparent',
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            boxShadow: 'none',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: { xs: '40px', sm: '48px' },
              '& .MuiTabs-indicator': {
                backgroundColor: theme.palette.primary.main,
                height: '3px',
                borderRadius: '2px'
              },
              '& .MuiTab-root': {
                color: alpha(theme.palette.text.secondary, 0.8),
                minHeight: { xs: '40px', sm: '48px' },
                padding: { xs: '8px 12px', sm: '12px 16px' },
                fontSize: { xs: '0.7rem', sm: '0.8rem' },
                fontWeight: 500,
                textTransform: 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.primary.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
                  borderRadius: '12px 12px 0 0'
                },
                '&:hover': {
                  color: theme.palette.primary.main,
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.primary.main,
                    0.05
                  )} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                  borderRadius: '12px 12px 0 0'
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
          <ChartContainer title="Market Cap by DEX (XRP)">
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
                scrollButtons={isMobile ? false : 'auto'}
                sx={{
                  minHeight: { xs: '32px', sm: '40px' },
                  bgcolor: alpha(theme.palette.background.paper, 0.6),
                  borderRadius: '12px',
                  padding: '4px',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  boxShadow: `inset 0 2px 4px ${alpha(theme.palette.common.black, 0.06)}`,
                  '& .MuiTabs-indicator': {
                    display: 'none'
                  },
                  '& .MuiTabs-root': {
                    maxWidth: { xs: '100%', sm: 'auto' }
                  },
                  '& .MuiTabs-flexContainer': {
                    justifyContent: isMobile ? 'space-between' : 'flex-start',
                    gap: '4px'
                  },
                  '& .MuiTab-root': {
                    color: alpha(theme.palette.text.secondary, 0.8),
                    minHeight: { xs: '24px', sm: '32px' },
                    padding: { xs: '4px 8px', sm: '6px 12px' },
                    minWidth: { xs: '36px', sm: '50px' },
                    fontSize: { xs: '0.65rem', sm: '0.75rem' },
                    fontWeight: 500,
                    textTransform: 'none',
                    borderRadius: '8px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    '&.Mui-selected': {
                      color: theme.palette.primary.main,
                      fontWeight: 600,
                      bgcolor: theme.palette.background.paper,
                      boxShadow: `0 2px 8px ${alpha(
                        theme.palette.primary.main,
                        0.15
                      )}, 0 1px 3px ${alpha(theme.palette.common.black, 0.1)}`,
                      transform: 'translateY(-1px)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`,
                        borderRadius: '8px 8px 0 0'
                      }
                    },
                    '&:hover': {
                      color: theme.palette.primary.main,
                      bgcolor: alpha(theme.palette.background.paper, 0.8),
                      transform: 'translateY(-1px)'
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
              {/* Recharts LineChart removed - TODO: Replace with lightweight-charts */}
              {false && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  ref={chartRef}
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
                  <Line
                    type="monotone"
                    dataKey="ledgerMemeMarketcap"
                    stroke={chartColors.quaternary.main}
                    name="LedgerMeme"
                    strokeWidth={2}
                    dot={false}
                    hide={!visibleLines.ledgerMemeMarketcap}
                    isAnimationActive={false}
                    activeDot={{
                      r: 6,
                      strokeWidth: 2,
                      stroke: chartColors.quaternary.main,
                      fill: themeColors.background,
                      onClick: (data) => handleDataPointClick(data.payload)
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
              )}
              <LightweightChart
                data={progressiveData}
                height={isMobile ? 300 : 400}
                series={getChartSeries('marketcap')}
                onClick={(data) => handleDataPointClick(data)}
                showLegend={true}
              />
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
                  {(selectedDataPoint.totalMarketcap || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}{' '}
                  XRP
                </Typography>

                <Box>
                  {/* Filter out the tokens from the breakdown display */}
                  {selectedDataPoint.dailyTokenMarketcaps &&
                    selectedDataPoint.dailyTokenMarketcaps
                      .filter((token) => token.marketcap > 0)
                      .sort((a, b) => b.marketcap - a.marketcap)
                      .map((token) => {
                        const tokenName = token.name;
                        const marketCap = token.marketcap;
                        // Calculate percentage based on the filtered total market cap
                        const percentage = (marketCap / selectedDataPoint.totalMarketcap) * 100;
                        const tokenId = token.tokenId || 'Unknown';

                        return (
                          <Box
                            key={tokenName}
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
                            {/* Rest of the token display code remains the same */}
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {tokenId !== 'Unknown' && (
                                <Box
                                  component="img"
                                  src={`https://s1.xrpl.to/token/${tokenId}`}
                                  alt={tokenName}
                                  sx={{
                                    width: 24,
                                    height: 24,
                                    mr: 1,
                                    objectFit: 'cover',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)'
                                  }}
                                  onError={(e) => {
                                    // If image fails to load, show color circle instead
                                    e.target.style.display = 'none';
                                  }}
                                />
                              )}
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: '50%',
                                  backgroundColor: getTokenColor(tokenName),
                                  mr: 1.5,
                                  display: tokenId !== 'Unknown' ? 'none' : 'block'
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

                            <Typography
                              variant="caption"
                              sx={{
                                color: themeColors.textSecondary,
                                ml: 3.5,
                                mt: 0.5,
                                fontSize: '0.7rem'
                              }}
                            >
                              Token ID: {tokenId}
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
          <ChartContainer title="Token Market Caps (XRP)">
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
                  options={availableTokens}
                  value={selectedTokens}
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
                          backgroundColor: getTokenColor(option),
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
                scrollButtons={isMobile ? false : 'auto'}
                sx={{
                  minHeight: { xs: '32px', sm: '40px' },
                  bgcolor: alpha(theme.palette.background.paper, 0.6),
                  borderRadius: '12px',
                  padding: '4px',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  boxShadow: `inset 0 2px 4px ${alpha(theme.palette.common.black, 0.06)}`,
                  '& .MuiTabs-indicator': {
                    display: 'none'
                  },
                  '& .MuiTabs-root': {
                    maxWidth: { xs: '100%', sm: 'auto' }
                  },
                  '& .MuiTabs-flexContainer': {
                    justifyContent: isMobile ? 'space-between' : 'flex-start',
                    gap: '4px'
                  },
                  '& .MuiTab-root': {
                    color: alpha(theme.palette.text.secondary, 0.8),
                    minHeight: { xs: '24px', sm: '32px' },
                    padding: { xs: '4px 8px', sm: '6px 12px' },
                    minWidth: { xs: '36px', sm: '50px' },
                    fontSize: { xs: '0.65rem', sm: '0.75rem' },
                    fontWeight: 500,
                    textTransform: 'none',
                    borderRadius: '8px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    '&.Mui-selected': {
                      color: theme.palette.primary.main,
                      fontWeight: 600,
                      bgcolor: theme.palette.background.paper,
                      boxShadow: `0 2px 8px ${alpha(
                        theme.palette.primary.main,
                        0.15
                      )}, 0 1px 3px ${alpha(theme.palette.common.black, 0.1)}`,
                      transform: 'translateY(-1px)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`,
                        borderRadius: '8px 8px 0 0'
                      }
                    },
                    '&:hover': {
                      color: theme.palette.primary.main,
                      bgcolor: alpha(theme.palette.background.paper, 0.8),
                      transform: 'translateY(-1px)'
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
              {/* Recharts LineChart removed - TODO: Replace with lightweight-charts */}
              {false && (
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
                        stroke={getTokenColor(token)}
                        name={token}
                        strokeWidth={2}
                        dot={false}
                        hide={!visibleLines[tokenKey]}
                        isAnimationActive={false}
                        activeDot={{
                          r: 6,
                          strokeWidth: 2,
                          stroke: getTokenColor(token),
                          fill: themeColors.background,
                          onClick: (data) => handleDataPointClick(data.payload)
                        }}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
              )}
              <LightweightChart
                data={progressiveData}
                height={isMobile ? 300 : 400}
                series={getChartSeries('tokens')}
                onClick={(data) => handleDataPointClick(data)}
                showLegend={true}
              />
            </Box>

            {/* Token breakdown section - appears when a data point is clicked */}
            {selectedDataPoint && (
              <Box
                sx={{
                  mt: { xs: 2, sm: 3, md: 4 },
                  p: { xs: 2, sm: 3, md: 4 },
                  borderRadius: '20px',
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.background.paper,
                    0.95
                  )} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                  boxShadow: `0 8px 32px ${alpha(
                    theme.palette.common.black,
                    0.06
                  )}, 0 2px 8px ${alpha(theme.palette.primary.main, 0.04)}`,
                  position: 'relative',
                  overflow: 'hidden',
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
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                    p: 2,
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.primary.main,
                      0.08
                    )} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      color: theme.palette.text.primary,
                      fontWeight: 600,
                      background: `linear-gradient(135deg, ${
                        theme.palette.text.primary
                      } 0%, ${alpha(theme.palette.primary.main, 0.8)} 100%)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    Token Details for {selectedDataPoint.date}
                  </Typography>
                  <Box
                    sx={{
                      cursor: 'pointer',
                      color: theme.palette.text.secondary,
                      p: 1,
                      borderRadius: '8px',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        color: theme.palette.text.primary,
                        bgcolor: alpha(theme.palette.error.main, 0.1),
                        transform: 'scale(1.1)'
                      }
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

                      // Get tokenId if available in the dailyTokenMarketcaps array
                      const tokenData = selectedDataPoint.dailyTokenMarketcaps?.find(
                        (t) => t.name === token
                      );
                      const tokenId = tokenData?.tokenId || 'Unknown';

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
                            {/* Add token image display */}
                            {tokenId !== 'Unknown' && (
                              <Box
                                component="img"
                                src={`https://s1.xrpl.to/token/${tokenId}`}
                                alt={token}
                                sx={{
                                  width: 24,
                                  height: 24,
                                  mr: 1,
                                  objectFit: 'cover',
                                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                  border: '1px solid rgba(255, 255, 255, 0.2)'
                                }}
                                onError={(e) => {
                                  // If image fails to load, show color circle instead
                                  e.target.style.display = 'none';
                                }}
                              />
                            )}
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                backgroundColor: getTokenColor(token),
                                mr: 1.5,
                                display: tokenId !== 'Unknown' ? 'none' : 'block'
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

                          {/* Add Token ID display */}
                          <Typography
                            variant="caption"
                            sx={{
                              color: themeColors.textSecondary,
                              ml: 3.5,
                              mb: 0.5,
                              fontSize: '0.7rem'
                            }}
                          >
                            Token ID: {tokenId}
                          </Typography>

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
              {/* Recharts LineChart removed - TODO: Replace with lightweight-charts */}
              {false && (
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
              )}
              <LightweightChart
                data={progressiveData}
                height={isMobile ? 300 : 400}
                series={getChartSeries('activity')}
                onClick={(data) => handleDataPointClick(data)}
                showLegend={true}
              />
            </Box>

            {/* Token count breakdown section - appears when a data point is clicked */}
            {selectedDataPoint && (
              <Box
                sx={{
                  mt: { xs: 2, sm: 3, md: 4 },
                  p: { xs: 2, sm: 3, md: 4 },
                  borderRadius: '20px',
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.background.paper,
                    0.95
                  )} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                  boxShadow: `0 8px 32px ${alpha(
                    theme.palette.common.black,
                    0.06
                  )}, 0 2px 8px ${alpha(theme.palette.primary.main, 0.04)}`,
                  position: 'relative',
                  overflow: 'hidden',
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
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                    p: 2,
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.primary.main,
                      0.08
                    )} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      color: theme.palette.text.primary,
                      fontWeight: 600,
                      background: `linear-gradient(135deg, ${
                        theme.palette.text.primary
                      } 0%, ${alpha(theme.palette.primary.main, 0.8)} 100%)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    Token Count Details for {selectedDataPoint.date}
                  </Typography>
                  <Box
                    sx={{
                      cursor: 'pointer',
                      color: theme.palette.text.secondary,
                      p: 1,
                      borderRadius: '8px',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        color: theme.palette.text.primary,
                        bgcolor: alpha(theme.palette.error.main, 0.1),
                        transform: 'scale(1.1)'
                      }
                    }}
                    onClick={() => setSelectedDataPoint(null)}
                  >
                    ✕
                  </Box>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3 }}>
                  <Box
                    sx={{
                      p: 3,
                      borderRadius: '16px',
                      background: `linear-gradient(135deg, ${alpha(
                        theme.palette.background.paper,
                        0.8
                      )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
                      border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 8px 24px ${alpha(
                          theme.palette.common.black,
                          0.1
                        )}, 0 4px 12px ${alpha(theme.palette.text.primary, 0.08)}`
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: '4px',
                        background: `linear-gradient(180deg, ${
                          theme.palette.text.primary
                        } 0%, ${alpha(theme.palette.text.primary, 0.3)} 100%)`,
                        borderRadius: '0 4px 4px 0'
                      }
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        mb: 2,
                        textTransform: 'uppercase',
                        fontWeight: 500,
                        fontSize: '0.75rem'
                      }}
                    >
                      Total Active Tokens
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        color: theme.palette.text.primary,
                        fontWeight: 700,
                        fontSize: '2rem',
                        background: `linear-gradient(135deg, ${
                          theme.palette.text.primary
                        } 0%, ${alpha(theme.palette.text.primary, 0.7)} 100%)`,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}
                    >
                      {selectedDataPoint.tokenCount.toLocaleString()}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      p: 3,
                      borderRadius: '16px',
                      background: `linear-gradient(135deg, ${alpha(
                        chartColors.primary.main,
                        0.15
                      )} 0%, ${alpha(chartColors.primary.main, 0.05)} 100%)`,
                      border: `1px solid ${alpha(chartColors.primary.main, 0.2)}`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 8px 24px ${alpha(
                          theme.palette.common.black,
                          0.1
                        )}, 0 4px 12px ${alpha(chartColors.primary.main, 0.15)}`
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: '4px',
                        background: `linear-gradient(180deg, ${
                          chartColors.primary.main
                        } 0%, ${alpha(chartColors.primary.main, 0.3)} 100%)`,
                        borderRadius: '0 4px 4px 0'
                      }
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        mb: 2,
                        textTransform: 'uppercase',
                        fontWeight: 500,
                        fontSize: '0.75rem'
                      }}
                    >
                      FirstLedger Tokens
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        color: chartColors.primary.main,
                        fontWeight: 700,
                        fontSize: '2rem'
                      }}
                    >
                      {selectedDataPoint.firstLedgerTokens.toLocaleString()}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      p: 3,
                      borderRadius: '16px',
                      background: `linear-gradient(135deg, ${alpha(
                        chartColors.secondary.main,
                        0.15
                      )} 0%, ${alpha(chartColors.secondary.main, 0.05)} 100%)`,
                      border: `1px solid ${alpha(chartColors.secondary.main, 0.2)}`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 8px 24px ${alpha(
                          theme.palette.common.black,
                          0.1
                        )}, 0 4px 12px ${alpha(chartColors.secondary.main, 0.15)}`
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: '4px',
                        background: `linear-gradient(180deg, ${
                          chartColors.secondary.main
                        } 0%, ${alpha(chartColors.secondary.main, 0.3)} 100%)`,
                        borderRadius: '0 4px 4px 0'
                      }
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        mb: 2,
                        textTransform: 'uppercase',
                        fontWeight: 500,
                        fontSize: '0.75rem'
                      }}
                    >
                      Magnetic X Tokens
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        color: chartColors.secondary.main,
                        fontWeight: 700,
                        fontSize: '2rem'
                      }}
                    >
                      {selectedDataPoint.magneticXTokens.toLocaleString()}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      p: 3,
                      borderRadius: '16px',
                      background: `linear-gradient(135deg, ${alpha(
                        chartColors.tertiary.main,
                        0.15
                      )} 0%, ${alpha(chartColors.tertiary.main, 0.05)} 100%)`,
                      border: `1px solid ${alpha(chartColors.tertiary.main, 0.2)}`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 8px 24px ${alpha(
                          theme.palette.common.black,
                          0.1
                        )}, 0 4px 12px ${alpha(chartColors.tertiary.main, 0.15)}`
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: '4px',
                        background: `linear-gradient(180deg, ${
                          chartColors.tertiary.main
                        } 0%, ${alpha(chartColors.tertiary.main, 0.3)} 100%)`,
                        borderRadius: '0 4px 4px 0'
                      }
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        mb: 2,
                        textTransform: 'uppercase',
                        fontWeight: 500,
                        fontSize: '0.75rem'
                      }}
                    >
                      XPMarket Tokens
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        color: chartColors.tertiary.main,
                        fontWeight: 700,
                        fontSize: '2rem'
                      }}
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
                scrollButtons={isMobile ? false : 'auto'}
                sx={{
                  minHeight: { xs: '32px', sm: '40px' },
                  bgcolor: alpha(theme.palette.background.paper, 0.6),
                  borderRadius: '12px',
                  padding: '4px',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  boxShadow: `inset 0 2px 4px ${alpha(theme.palette.common.black, 0.06)}`,
                  '& .MuiTabs-indicator': {
                    display: 'none'
                  },
                  '& .MuiTabs-root': {
                    maxWidth: { xs: '100%', sm: 'auto' }
                  },
                  '& .MuiTabs-flexContainer': {
                    justifyContent: isMobile ? 'space-between' : 'flex-start',
                    gap: '4px'
                  },
                  '& .MuiTab-root': {
                    color: alpha(theme.palette.text.secondary, 0.8),
                    minHeight: { xs: '24px', sm: '32px' },
                    padding: { xs: '4px 8px', sm: '6px 12px' },
                    minWidth: { xs: '36px', sm: '50px' },
                    fontSize: { xs: '0.65rem', sm: '0.75rem' },
                    fontWeight: 500,
                    textTransform: 'none',
                    borderRadius: '8px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&.Mui-selected': {
                      color: theme.palette.primary.main,
                      fontWeight: 600,
                      bgcolor: theme.palette.background.paper,
                      boxShadow: `0 2px 8px ${alpha(
                        theme.palette.primary.main,
                        0.15
                      )}, 0 1px 3px ${alpha(theme.palette.common.black, 0.1)}`,
                      transform: 'translateY(-1px)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`,
                        borderRadius: '8px 8px 0 0'
                      }
                    },
                    '&:hover': {
                      color: theme.palette.primary.main,
                      bgcolor: alpha(theme.palette.background.paper, 0.8),
                      transform: 'translateY(-1px)'
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
              {/* Recharts LineChart removed - TODO: Replace with lightweight-charts */}
              {false && (
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
              )}
              <LightweightChart
                data={progressiveData}
                height={isMobile ? 300 : 400}
                series={getChartSeries('trading')}
                onClick={(data) => handleDataPointClick(data)}
                showLegend={true}
              />
            </Box>

            {/* Trading activity breakdown section - appears when a data point is clicked */}
            {selectedDataPoint && (
              <Box
                sx={{
                  mt: { xs: 2, sm: 3, md: 4 },
                  p: { xs: 2, sm: 3, md: 4 },
                  borderRadius: '20px',
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.background.paper,
                    0.95
                  )} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                  boxShadow: `0 8px 32px ${alpha(
                    theme.palette.common.black,
                    0.06
                  )}, 0 2px 8px ${alpha(theme.palette.primary.main, 0.04)}`,
                  position: 'relative',
                  overflow: 'hidden',
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
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                    p: 2,
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.primary.main,
                      0.08
                    )} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      color: theme.palette.text.primary,
                      fontWeight: 600,
                      background: `linear-gradient(135deg, ${
                        theme.palette.text.primary
                      } 0%, ${alpha(theme.palette.primary.main, 0.8)} 100%)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    Trading Activity for {selectedDataPoint.date}
                  </Typography>
                  <Box
                    sx={{
                      cursor: 'pointer',
                      color: theme.palette.text.secondary,
                      p: 1,
                      borderRadius: '8px',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        color: theme.palette.text.primary,
                        bgcolor: alpha(theme.palette.error.main, 0.1),
                        transform: 'scale(1.1)'
                      }
                    }}
                    onClick={() => setSelectedDataPoint(null)}
                  >
                    ✕
                  </Box>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3 }}>
                  <Box
                    sx={{
                      p: 3,
                      borderRadius: '16px',
                      background: `linear-gradient(135deg, ${alpha(
                        theme.palette.background.paper,
                        0.8
                      )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
                      border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 8px 24px ${alpha(
                          theme.palette.common.black,
                          0.1
                        )}, 0 4px 12px ${alpha(theme.palette.text.primary, 0.08)}`
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: '4px',
                        background: `linear-gradient(180deg, ${
                          theme.palette.text.primary
                        } 0%, ${alpha(theme.palette.text.primary, 0.3)} 100%)`,
                        borderRadius: '0 4px 4px 0'
                      }
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        mb: 2,
                        textTransform: 'uppercase',
                        fontWeight: 500,
                        fontSize: '0.75rem'
                      }}
                    >
                      Volume
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: chartColors.primary.main }}>
                        AMM:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: theme.palette.text.primary, fontWeight: 500 }}
                      >
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
                      <Typography
                        variant="body2"
                        sx={{ color: theme.palette.text.primary, fontWeight: 500 }}
                      >
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
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        Total:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: theme.palette.text.primary, fontWeight: 600 }}
                      >
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
                      p: 3,
                      borderRadius: '16px',
                      background: `linear-gradient(135deg, ${alpha(
                        theme.palette.background.paper,
                        0.8
                      )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
                      border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 8px 24px ${alpha(
                          theme.palette.common.black,
                          0.1
                        )}, 0 4px 12px ${alpha(theme.palette.text.primary, 0.08)}`
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: '4px',
                        background: `linear-gradient(180deg, ${
                          theme.palette.text.primary
                        } 0%, ${alpha(theme.palette.text.primary, 0.3)} 100%)`,
                        borderRadius: '0 4px 4px 0'
                      }
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        mb: 2,
                        textTransform: 'uppercase',
                        fontWeight: 500,
                        fontSize: '0.75rem'
                      }}
                    >
                      Trades
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: chartColors.primary.main }}>
                        AMM:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: theme.palette.text.primary, fontWeight: 500 }}
                      >
                        {selectedDataPoint.tradesAMM.toLocaleString()}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: chartColors.secondary.main }}>
                        Non-AMM:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: theme.palette.text.primary, fontWeight: 500 }}
                      >
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
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        Total:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: theme.palette.text.primary, fontWeight: 600 }}
                      >
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
                scrollButtons={isMobile ? false : 'auto'}
                sx={{
                  minHeight: { xs: '32px', sm: '40px' },
                  bgcolor: alpha(theme.palette.background.paper, 0.6),
                  borderRadius: '12px',
                  padding: '4px',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  boxShadow: `inset 0 2px 4px ${alpha(theme.palette.common.black, 0.06)}`,
                  '& .MuiTabs-indicator': {
                    display: 'none'
                  },
                  '& .MuiTabs-root': {
                    maxWidth: { xs: '100%', sm: 'auto' }
                  },
                  '& .MuiTabs-flexContainer': {
                    justifyContent: isMobile ? 'space-between' : 'flex-start',
                    gap: '4px'
                  },
                  '& .MuiTab-root': {
                    color: alpha(theme.palette.text.secondary, 0.8),
                    minHeight: { xs: '24px', sm: '32px' },
                    padding: { xs: '4px 8px', sm: '6px 12px' },
                    minWidth: { xs: '36px', sm: '50px' },
                    fontSize: { xs: '0.65rem', sm: '0.75rem' },
                    fontWeight: 500,
                    textTransform: 'none',
                    borderRadius: '8px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&.Mui-selected': {
                      color: theme.palette.primary.main,
                      fontWeight: 600,
                      bgcolor: theme.palette.background.paper,
                      boxShadow: `0 2px 8px ${alpha(
                        theme.palette.primary.main,
                        0.15
                      )}, 0 1px 3px ${alpha(theme.palette.common.black, 0.1)}`,
                      transform: 'translateY(-1px)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`,
                        borderRadius: '8px 8px 0 0'
                      }
                    },
                    '&:hover': {
                      color: theme.palette.primary.main,
                      bgcolor: alpha(theme.palette.background.paper, 0.8),
                      transform: 'translateY(-1px)'
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
              {/* Recharts LineChart removed - TODO: Replace with lightweight-charts */}
              {false && (
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
              )}
              <LightweightChart
                data={progressiveData}
                height={isMobile ? 300 : 400}
                series={getChartSeries('addresses')}
                onClick={(data) => handleDataPointClick(data)}
                showLegend={true}
              />
            </Box>

            {/* Active addresses breakdown section - appears when a data point is clicked */}
            {selectedDataPoint && (
              <Box
                sx={{
                  mt: { xs: 2, sm: 3, md: 4 },
                  p: { xs: 2, sm: 3, md: 4 },
                  borderRadius: '20px',
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.background.paper,
                    0.95
                  )} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                  boxShadow: `0 8px 32px ${alpha(
                    theme.palette.common.black,
                    0.06
                  )}, 0 2px 8px ${alpha(theme.palette.primary.main, 0.04)}`,
                  position: 'relative',
                  overflow: 'hidden',
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
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                    p: 2,
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.primary.main,
                      0.08
                    )} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      color: theme.palette.text.primary,
                      fontWeight: 600,
                      background: `linear-gradient(135deg, ${
                        theme.palette.text.primary
                      } 0%, ${alpha(theme.palette.primary.main, 0.8)} 100%)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    Active Addresses for {selectedDataPoint.date}
                  </Typography>
                  <Box
                    sx={{
                      cursor: 'pointer',
                      color: theme.palette.text.secondary,
                      p: 1,
                      borderRadius: '8px',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        color: theme.palette.text.primary,
                        bgcolor: alpha(theme.palette.error.main, 0.1),
                        transform: 'scale(1.1)'
                      }
                    }}
                    onClick={() => setSelectedDataPoint(null)}
                  >
                    ✕
                  </Box>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
                  <Box
                    sx={{
                      p: 3,
                      borderRadius: '16px',
                      background: `linear-gradient(135deg, ${alpha(
                        chartColors.primary.main,
                        0.15
                      )} 0%, ${alpha(chartColors.primary.main, 0.05)} 100%)`,
                      border: `1px solid ${alpha(chartColors.primary.main, 0.2)}`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 8px 24px ${alpha(
                          theme.palette.common.black,
                          0.1
                        )}, 0 4px 12px ${alpha(chartColors.primary.main, 0.15)}`
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: '4px',
                        background: `linear-gradient(180deg, ${
                          chartColors.primary.main
                        } 0%, ${alpha(chartColors.primary.main, 0.3)} 100%)`,
                        borderRadius: '0 4px 4px 0'
                      }
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        mb: 2,
                        textTransform: 'uppercase',
                        fontWeight: 500,
                        fontSize: '0.75rem'
                      }}
                    >
                      AMM Active Addresses
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        color: chartColors.primary.main,
                        fontWeight: 700,
                        fontSize: '2rem'
                      }}
                    >
                      {selectedDataPoint.uniqueActiveAddressesAMM.toLocaleString()}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      p: 3,
                      borderRadius: '16px',
                      background: `linear-gradient(135deg, ${alpha(
                        chartColors.secondary.main,
                        0.15
                      )} 0%, ${alpha(chartColors.secondary.main, 0.05)} 100%)`,
                      border: `1px solid ${alpha(chartColors.secondary.main, 0.2)}`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 8px 24px ${alpha(
                          theme.palette.common.black,
                          0.1
                        )}, 0 4px 12px ${alpha(chartColors.secondary.main, 0.15)}`
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: '4px',
                        background: `linear-gradient(180deg, ${
                          chartColors.secondary.main
                        } 0%, ${alpha(chartColors.secondary.main, 0.3)} 100%)`,
                        borderRadius: '0 4px 4px 0'
                      }
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        mb: 2,
                        textTransform: 'uppercase',
                        fontWeight: 500,
                        fontSize: '0.75rem'
                      }}
                    >
                      Non-AMM Active Addresses
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        color: chartColors.secondary.main,
                        fontWeight: 700,
                        fontSize: '2rem'
                      }}
                    >
                      {selectedDataPoint.uniqueActiveAddressesNonAMM.toLocaleString()}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      p: 3,
                      borderRadius: '16px',
                      background: `linear-gradient(135deg, ${alpha(
                        theme.palette.background.paper,
                        0.8
                      )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
                      border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 8px 24px ${alpha(
                          theme.palette.common.black,
                          0.1
                        )}, 0 4px 12px ${alpha(theme.palette.text.primary, 0.08)}`
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: '4px',
                        background: `linear-gradient(180deg, ${
                          theme.palette.text.primary
                        } 0%, ${alpha(theme.palette.text.primary, 0.3)} 100%)`,
                        borderRadius: '0 4px 4px 0'
                      }
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        mb: 2,
                        textTransform: 'uppercase',
                        fontWeight: 500,
                        fontSize: '0.75rem'
                      }}
                    >
                      Total Active Addresses
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        color: theme.palette.text.primary,
                        fontWeight: 700,
                        fontSize: '2rem',
                        background: `linear-gradient(135deg, ${
                          theme.palette.text.primary
                        } 0%, ${alpha(theme.palette.text.primary, 0.7)} 100%)`,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}
                    >
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
  const dispatch = useDispatch();

  // Add WebSocket connection
  const WSS_FEED_URL = 'wss://api.xrpl.to/ws/sync';
  useWebSocket(WSS_FEED_URL, {
    shouldReconnect: () => true,
    onMessage: (event) => {
      try {
        const json = JSON.parse(event.data);
        dispatch(update_metrics(json));
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    }
  });

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
