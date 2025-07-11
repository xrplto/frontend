import React, { useState, useContext, useEffect, useMemo, useCallback } from 'react';
import Decimal from 'decimal.js';
import 'src/utils/i18n';
import {
  alpha,
  styled,
  Box,
  Container,
  Stack,
  Tooltip,
  Typography,
  useTheme,
  useMediaQuery,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  Chip,
  Divider,
  Card,
  CardContent,
  Skeleton
} from '@mui/material';
import SmartToy from '@mui/icons-material/SmartToy';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CloseIcon from '@mui/icons-material/Close';
import LinkIcon from '@mui/icons-material/Link';
import { useRouter } from 'next/router';

import { useDispatch, useSelector } from 'react-redux';
import { selectMetrics, update_metrics } from 'src/redux/statusSlice';
import { useTranslation } from 'react-i18next';
import { AppContext } from 'src/AppContext';
import { fIntNumber, fNumber } from 'src/utils/formatNumber';
import CurrencySwithcer from './CurrencySwitcher';
import ThemeSwitcher from './ThemeSwitcher';
import { currencySymbols, getTokenImageUrl, decodeCurrency } from 'src/utils/constants';
import useSWR from 'swr';
import axios from 'axios';
import { throttle } from 'lodash';

const TopWrapper = styled(Box)(
  ({ theme }) => `
    width: 100%;
    display: flex;
    align-items: center;
    height: ${theme.spacing(5)};
    background: transparent;
    backdrop-filter: none;
    border-bottom: 1px solid ${alpha(theme.palette.divider, 0.05)};
    position: relative;
    z-index: 1099;
    box-shadow: 0 1px 3px ${alpha(theme.palette.common.black, 0.05)};
`
);

const ContentWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(0.5),
  paddingTop: 0,
  paddingBottom: 0,
  overflow: 'auto',
  width: '100%',
  justifyContent: 'space-between',
  alignItems: 'center',
  '& > *': {
    scrollSnapAlign: 'center'
  },
  '::-webkit-scrollbar': { display: 'none' },
  scrollbarWidth: 'none'
}));


const APILabel = styled('a')(({ theme }) => ({
  fontSize: '12px',
  fontWeight: 600,
  color: theme.palette.text.primary,
  textDecoration: 'none',
  marginLeft: theme.spacing(1),
  background: theme.palette.mode === 'dark' && theme.palette.primary.main === '#00ffff'
    ? alpha('#030310', 0.7)
    : theme.palette.primary.main === '#0080ff'
      ? alpha(theme.palette.primary.main, 0.1)
      : theme.palette.mode === 'dark'
        ? alpha(theme.palette.success.dark, 0.15)
        : alpha(theme.palette.success.light, 0.15),
  padding: '6px 12px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  minHeight: '32px',
  border: `1px solid ${theme.palette.primary.main === '#0080ff' ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.success.main, 0.2)}`,
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  '&:hover': {
    background: theme.palette.mode === 'dark' && theme.palette.primary.main === '#00ffff'
      ? alpha(theme.palette.primary.main, 0.04)
      : theme.palette.primary.main === '#0080ff'
        ? alpha(theme.palette.primary.main, 0.15)
        : alpha(theme.palette.success.main, 0.2),
    transform: 'translateY(-1px)',
    boxShadow: `0 4px 12px ${theme.palette.primary.main === '#0080ff' ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.success.main, 0.2)}`
  }
}));

const MobileMetric = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(0.5),
  width: '100%',
  padding: theme.spacing(0.5, 1),
  borderRadius: theme.spacing(1),
  background: theme.palette.mode === 'dark' && theme.palette.primary.main === '#00ffff'
    ? alpha('#030310', 0.5)
    : 'transparent',
  border: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
  minHeight: theme.spacing(4)
}));

const H24Style = styled('div')(({ theme }) => ({
  cursor: 'pointer',
  padding: theme.spacing(0.25, 0.5),
  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
  borderRadius: theme.spacing(0.75),
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  minWidth: '28px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: `0 1px 4px ${alpha(theme.palette.primary.main, 0.25)}`,
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.35)}`
  }
}));

const SWITCH_INTERVAL = 3000; // 3 seconds between switches

const StyledContainer = styled(Container)(({ theme }) => ({
  paddingTop: 0,
  paddingBottom: 0,
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  [theme.breakpoints.down('md')]: {
    paddingLeft: theme.spacing(0.5),
    paddingRight: theme.spacing(0.5)
  }
}));

const TradeButton = styled(IconButton)(({ theme }) => ({
  marginLeft: theme.spacing(1),
  padding: theme.spacing(1.5),
  background: theme.palette.mode === 'dark' && theme.palette.primary.main === '#00ffff'
    ? alpha('#030310', 0.7)
    : alpha(theme.palette.primary.main, 0.1),
  borderRadius: theme.spacing(1.5),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  transition: 'all 0.2s ease',
  '&:hover': {
    background: theme.palette.mode === 'dark' && theme.palette.primary.main === '#00ffff'
      ? alpha(theme.palette.primary.main, 0.04)
      : alpha(theme.palette.primary.main, 0.15),
    transform: 'translateY(-1px)'
  }
}));

const PulsatingCircle = styled('div')(({ theme }) => ({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.main === '#0080ff' ? theme.palette.primary.main : theme.palette.success.main,
  position: 'relative',
  boxShadow: `0 0 10px ${alpha(theme.palette.primary.main === '#0080ff' ? theme.palette.primary.main : theme.palette.success.main, 0.5)}`,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    backgroundColor: 'inherit',
    animation: 'pulse-simple 2s ease-in-out infinite'
  },
  '@keyframes pulse-simple': {
    '0%, 100%': {
      transform: 'translate(-50%, -50%) scale(1)',
      opacity: 1
    },
    '50%': {
      transform: 'translate(-50%, -50%) scale(2.5)',
      opacity: 0
    }
  }
}));

const LiveIndicator = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(0.5, 1.5),
  borderRadius: '20px',
  background: theme.palette.mode === 'dark' && theme.palette.primary.main === '#00ffff'
    ? alpha('#030310', 0.7)
    : theme.palette.primary.main === '#0080ff'
      ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`
      : `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.15)} 0%, ${alpha(theme.palette.success.main, 0.08)} 100%)`,
  border: `1px solid ${theme.palette.primary.main === '#0080ff' ? alpha(theme.palette.primary.main, 0.25) : alpha(theme.palette.success.main, 0.25)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: `0 4px 12px ${theme.palette.primary.main === '#0080ff' ? alpha(theme.palette.primary.main, 0.15) : alpha(theme.palette.success.main, 0.15)}`,
  '&:hover': {
    background: theme.palette.mode === 'dark' && theme.palette.primary.main === '#00ffff'
      ? alpha(theme.palette.primary.main, 0.04)
      : theme.palette.primary.main === '#0080ff'
        ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.primary.main, 0.12)} 100%)`
        : `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.2)} 0%, ${alpha(theme.palette.success.main, 0.12)} 100%)`,
    transform: 'translateY(-1px)'
  }
}));

const LiveCircle = styled('div')(({ theme }) => ({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.main === '#0080ff' ? theme.palette.primary.main : theme.palette.success.main,
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    backgroundColor: 'inherit',
    animation: 'ripple-simple 2s ease-in-out infinite'
  },
  '@keyframes ripple-simple': {
    '0%': {
      transform: 'translate(-50%, -50%) scale(1)',
      opacity: 0.9
    },
    '100%': {
      transform: 'translate(-50%, -50%) scale(3)',
      opacity: 0
    }
  }
}));


const MetricContainer = styled(Stack)(({ theme }) => ({
  padding: theme.spacing(0.75, 1.25),
  borderRadius: theme.spacing(1),
  background: 'transparent',
  minWidth: 'auto',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  '&:hover': {
    background: theme.palette.mode === 'dark' && theme.palette.primary.main === '#00ffff'
      ? alpha(theme.palette.primary.main, 0.04)
      : alpha(theme.palette.action.hover, 0.05),
    transform: 'translateY(-1px)'
  }
}));

const MetricLabel = styled(Typography)(({ theme }) => ({
  color: alpha(theme.palette.text.secondary, 0.7),
  fontWeight: 600,
  fontSize: '0.65rem',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  lineHeight: 1,
  fontFamily: 'Inter, sans-serif'
}));

const MetricValue = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '0.95rem',
  lineHeight: 1,
  fontFamily: 'Inter, sans-serif',
  letterSpacing: '-0.01em'
}));

const TradeCard = styled(Card)(({ theme }) => ({
  margin: theme.spacing(0.5, 1),
  borderRadius: theme.spacing(2),
  background: theme.palette.mode === 'dark' && theme.palette.primary.main === '#00ffff'
    ? alpha('#030310', 0.7)
    : theme.palette.background.paper,
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  transition: 'all 0.2s ease',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.1)}`
  }
}));

const TokenImage = styled('img')(({ theme }) => ({
  width: 24,
  height: 24,
  borderRadius: '50%',
  backgroundColor: theme.palette.mode === 'dark'
    ? alpha(theme.palette.grey[800], 0.5)
    : alpha(theme.palette.grey[100], 0.8),
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  objectFit: 'cover'
}));

const TradeTypeChip = styled(Chip)(({ theme, tradetype }) => ({
  height: 22,
  fontSize: '0.7rem',
  fontWeight: 600,
  borderRadius: '6px',
  minWidth: '24px',
  fontFamily: 'Inter, sans-serif',
  ...(tradetype === 'BUY' && {
    background: alpha(theme.palette.success.main, 0.15),
    color: theme.palette.success.dark,
    border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
    '& .MuiChip-label': {
      paddingLeft: '6px',
      paddingRight: '6px'
    }
  }),
  ...(tradetype === 'SELL' && {
    background: alpha(theme.palette.error.main, 0.15),
    color: theme.palette.error.dark,
    border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
    '& .MuiChip-label': {
      paddingLeft: '6px',
      paddingRight: '6px'
    }
  })
}));

const DrawerHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2.5, 3),
  background: theme.palette.mode === 'dark' && theme.palette.primary.main === '#00ffff'
    ? alpha('#030310', 0.9)
    : 'transparent',
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
  position: 'sticky',
  top: 0,
  zIndex: 1,
  backdropFilter: 'blur(20px)',
  boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.05)}`
}));

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    background: 'transparent',
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    backdropFilter: 'none',
    boxShadow: 'none'
  }
}));

// Add filter state and filter options - move this outside the component to prevent recreation
const FILTER_OPTIONS = [
  { value: 'All', label: 'All Trades', icon: '🔄' },
  { value: '500+', label: '500+ XRP', icon: '🐟' },
  { value: '1000+', label: '1000+ XRP', icon: '🐬' },
  { value: '2500+', label: '2500+ XRP', icon: '🦈' },
  { value: '5000+', label: '5000+ XRP', icon: '🐋' },
  { value: '10000+', label: '10000+ XRP', icon: '🐳' }
];

// Create a fetcher function for useSWR
const fetcher = (url) => axios.get(url).then((res) => res.data);

// Add this utility function at the top of the file
const formatRelativeTime = (timestamp) => {
  const now = Date.now();
  const diffInSeconds = Math.floor((now - timestamp) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}min ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
};

// Add this helper function
const getTradeSizeEmoji = (value) => {
  const xrpValue = parseFloat(value);
  if (xrpValue < 500) return '🦐';
  if (xrpValue < 1000) return '🐟';
  if (xrpValue < 2500) return '🐬';
  if (xrpValue < 5000) return '🦈';
  if (xrpValue < 10000) return '🐋';
  return '🐳';
};

// Add this helper function near the top of the file
const abbreviateNumber = (num) => {
  if (Math.abs(num) < 1000) return num.toFixed(1);
  const suffixes = ['', 'k', 'M', 'B', 'T'];
  const magnitude = Math.floor(Math.log10(Math.abs(num)) / 3);
  const scaled = num / Math.pow(10, magnitude * 3);
  return scaled.toFixed(2).replace(/\.?0+$/, '') + suffixes[magnitude];
};

// Update formatTradeValue function
const formatTradeValue = (value) => {
  // Convert to number if it's a string
  const numValue = typeof value === 'string' ? Number(value) : value;

  // Very small numbers (use 8 decimal places)
  if (Math.abs(numValue) < 0.0001) {
    return numValue.toFixed(8);
  }

  // Small numbers (use 4 decimal places)
  if (Math.abs(numValue) < 1) {
    return numValue.toFixed(4);
  }

  return abbreviateNumber(numValue);
};

// Add this helper function near the top of the file
const getTradeColor = (xrpValue) => {
  if (xrpValue < 500) return '#4CAF50'; // Green for small trades
  if (xrpValue >= 500 && xrpValue < 5000) return '#2196F3'; // Blue for medium trades
  if (xrpValue >= 5000 && xrpValue < 10000) return '#FFC107'; // Yellow for large trades
  return '#F44336'; // Red for whale trades
};

const getXRPAmount = (trade) => {
  if (!trade || (!trade.paid && !trade.got)) {
    return 0;
  }

  let xrpValue = 0;
  try {
    if (trade.paid && trade.paid.currency === 'XRP') {
      xrpValue = parseValue(trade.paid.value);
    } else if (trade.got && trade.got.currency === 'XRP') {
      xrpValue = parseValue(trade.got.value);
    }
  } catch (error) {
    console.error('Error parsing XRP amount:', error);
    return 0;
  }

  return xrpValue;
};

const parseValue = (value) => {
  if (!value && value !== 0) {
    return 0;
  }

  try {
    if (typeof value === 'string' && value.includes('e')) {
      // Handle scientific notation
      return parseFloat(Number(value).toFixed(8));
    }

    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  } catch (error) {
    console.error('Error parsing value:', error);
    return 0;
  }
};

// Get API URL based on filter
const getTradeApiUrl = (filter) => {
  const baseUrl = 'https://api.xrpl.to/api/history?md5=84e5efeb89c4eae8f68188982dc290d8&page=0&limit=200';
  
  if (filter === 'All') {
    return baseUrl;
  }
  
  // Extract XRP amount from filter (e.g., "500+" -> "500")
  const xrpAmount = filter.replace('+', '');
  return `${baseUrl}&xrpAmount=${xrpAmount}`;
};

// Add this constant before the Topbar component
const BOT_ADDRESSES = [
  'rogue5HnPRSszD9CWGSUz8UGHMVwSSKF6',
  'rfmdBKhtJw2J22rw1JxQcchQTM68qzE4N2',
  'rpiFwLYi6Gb1ESHYorn2QG1WU5vw2u4exQ',
  'rpP3jobib3bCGbK1EHUsyeFJF1LXcUBymq',
  'rhubarbMVC2nzASf3qSGQcUKtLnAzqcBjp',
  'rBYuQZgRnsSNTuGsxz7wmGt53GYDEg1qzf',
  'rippLE4uy7r898MzuHTeTe7sPfuUDafLB',
  'raKT8yExRhuK9xAqYeWezH8RAp6vNoU3Jo',
  'rhB5snxAxsZ2cKf8iDJYiBpX8nrTxJfHoH',
  'rN7SthSu7RZXo2LNmsh4QPgXcBzhTgmDDg',
  'raKTPwoUnGbdSquoiZLX5bLZwY2JAvS5o9'
];

const Topbar = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const metrics = useSelector(selectMetrics);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { darkMode, activeFiatCurrency } = useContext(AppContext);
  const iconColor = darkMode ? '#FFFFFF' : '#000000';
  const [fullSearch, setFullSearch] = useState(false);
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const [currentMetricIndex, setCurrentMetricIndex] = useState(0);
  const [tradeDrawerOpen, setTradeDrawerOpen] = useState(false);
  const router = useRouter();

  const [trades, setTrades] = useState([]);
  const [wsError, setWsError] = useState(null);
  const [isWsLoading, setIsWsLoading] = useState(false);

  // Check if metrics are properly loaded
  const metricsLoaded = useMemo(() => {
    return metrics?.global?.total !== undefined && 
           metrics?.global?.totalAddresses !== undefined &&
           metrics?.H24?.transactions24H !== undefined &&
           metrics?.global?.total > 0; // Ensure we have actual data, not just default zeros
  }, [metrics]);

  // Fetch metrics if not loaded
  useEffect(() => {
    console.log('Topbar metrics state:', metrics);
    console.log('Topbar metrics loaded:', metricsLoaded);
    
    if (!metricsLoaded) {
      const fetchMetrics = async () => {
        try {
          console.log('Fetching metrics in Topbar...');
          const response = await axios.get('https://api.xrpl.to/api/tokens?start=0&limit=100&sortBy=vol24hxrp&sortType=desc&filter=');
          if (response.status === 200 && response.data) {
            console.log('Metrics fetched successfully:', response.data);
            dispatch(update_metrics(response.data));
          }
        } catch (error) {
          console.error('Error fetching metrics in Topbar:', error);
        }
      };
      fetchMetrics();
    }
  }, [metricsLoaded, dispatch]);

  // Memoize the mobile metrics to prevent recreation on every render
  const mobileMetrics = useMemo(
    () => {
      if (!metricsLoaded) {
        return [
          { label: 'Addresses', value: '...', color: '#54D62C', loading: true },
          { label: 'Tokens', value: '...', color: '#FF6B6B', loading: true },
          { label: 'Offers', value: '...', color: '#FFC107', loading: true },
          { label: 'Trustlines', value: '...', color: '#FFA48D', loading: true },
          { label: 'Trades', value: '...', color: '#74CAFF', loading: true },
          { label: 'Vol', value: '...', color: theme.palette.error.main, loading: true },
          { label: 'Tokens Traded', value: '...', color: '#3366FF', loading: true },
          { label: 'Active Addresses', value: '...', color: '#54D62C', loading: true },
          { label: 'Unique Traders', value: '...', color: '#2196F3', loading: true },
          { label: 'Total TVL', value: '...', color: '#8E44AD', loading: true }
        ];
      }

      return [
        {
          label: 'Addresses',
          value: abbreviateNumber(metrics.global?.totalAddresses || 0),
          color: '#54D62C'
        },
        {
          label: 'Tokens',
          value: abbreviateNumber(metrics.global?.total || 0),
          color: '#FF6B6B'
        },
        {
          label: 'Offers',
          value: abbreviateNumber(metrics.global?.totalOffers || 0),
          color: '#FFC107'
        },
        {
          label: 'Trustlines',
          value: abbreviateNumber(metrics.global?.totalTrustLines || 0),
          color: '#FFA48D'
        },
        {
          label: 'Trades',
          value: abbreviateNumber(metrics.H24?.transactions24H || 0),
          color: '#74CAFF'
        },
        {
          label: 'Vol',
          value: `${currencySymbols[activeFiatCurrency]}${abbreviateNumber(
            metrics?.H24?.tradedXRP24H && metrics[activeFiatCurrency]
              ? new Decimal(metrics.H24.tradedXRP24H || 0)
                  .div(new Decimal(metrics[activeFiatCurrency] || 1))
                  .toNumber()
              : 0
          )}`,
          color: theme.palette.error.main
        },
        {
          label: 'Tokens Traded',
          value: abbreviateNumber(metrics.H24?.tradedTokens24H || 0),
          color: '#3366FF'
        },
        {
          label: 'Active Addresses',
          value: abbreviateNumber(metrics.H24?.activeAddresses24H || 0),
          color: '#54D62C'
        },
        {
          label: 'Unique Traders',
          value: abbreviateNumber(metrics?.H24?.uniqueTraders24H || 0),
          color: '#2196F3'
        },
        {
          label: 'Total TVL',
          value: `${currencySymbols[activeFiatCurrency]}${abbreviateNumber(
            metrics?.H24?.totalTVL && metrics[activeFiatCurrency]
              ? new Decimal(metrics.H24.totalTVL || 0)
                  .div(new Decimal(metrics[activeFiatCurrency] || 1))
                  .toNumber()
              : 0
          )}`,
          color: '#8E44AD'
        }
      ];
    },
    [metrics, activeFiatCurrency, theme.palette.error.main, metricsLoaded]
  );

  // Add useEffect for auto-switching
  useEffect(() => {
    if (!isMobile) return;

    const interval = setInterval(() => {
      setCurrentMetricIndex((prev) => (prev + 1) % mobileMetrics.length);
    }, SWITCH_INTERVAL);

    return () => clearInterval(interval);
  }, [isMobile, mobileMetrics.length]);

  const handleTradeDrawerOpen = () => {
    if (!tradeDrawerOpen) {
      setTradeDrawerOpen(true);
    }
  };

  const handleTradeDrawerClose = () => {
    if (tradeDrawerOpen) {
      setTradeDrawerOpen(false);
    }
  };

  // Add filter state - use useCallback to prevent recreation
  const [tradeFilter, setTradeFilter] = useState('All');

  const handleFilterChange = useCallback((event) => {
    setTrades([]);
    setIsWsLoading(true);
    setTradeFilter(event.target.value);
  }, []);

  useEffect(() => {
    if (!tradeDrawerOpen) {
      return;
    }

    setIsWsLoading(true);
    setTrades([]);
    setWsError(null);

    // First, load initial data from REST API
    const loadInitialData = async () => {
      try {
        const apiUrl = getTradeApiUrl(tradeFilter);
        const response = await axios.get(apiUrl);
        if (response.data && response.data.hists) {
          setTrades(response.data.hists.slice(0, 200));
        }
      } catch (error) {
        console.error('Failed to load initial trades:', error);
      }
    };

    loadInitialData();

    const ws = new WebSocket('wss://api.xrpl.to/ws/sync');

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsWsLoading(false);
    };

    const throttledSetTrades = throttle((newTrades) => {
      setTrades(newTrades);
    }, 200); // Throttle to update every 200ms

    const throttledAddTrade = throttle((newTrade) => {
      setTrades((prevTrades) => [newTrade, ...prevTrades].slice(0, 200));
    }, 200); // Throttle to update every 200ms

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (Array.isArray(data)) {
          throttledSetTrades(data.slice(0, 200));
        } else if (typeof data === 'object' && data !== null) {
          if (data.time) {
            throttledAddTrade(data);
          }
        }
      } catch (e) {
        console.error('Error parsing websocket message', e);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsError('WebSocket connection error.');
      setIsWsLoading(false);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      ws.close();
      throttledSetTrades.cancel(); // Cancel any pending throttled calls
      throttledAddTrade.cancel(); // Cancel any pending throttled calls
    };
  }, [tradeDrawerOpen, tradeFilter]);

  // Since API filtering is now handled server-side, just sort trades
  const filteredTrades = useMemo(() => {
    if (!trades) return [];
    // Just sort by time since filtering is handled by API
    return [...trades].sort((a, b) => b.time - a.time);
  }, [trades]);

  // Memoize the filter select component to prevent re-renders
  const FilterSelect = useMemo(
    () => (
      <FormControl
        size="small"
        sx={{
          minWidth: 140,
          '& .MuiSelect-select': {
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }
        }}
      >
        <Select
          value={tradeFilter}
          onChange={handleFilterChange}
          displayEmpty
          inputProps={{ 'aria-label': 'Filter trades' }}
          sx={{
            borderRadius: 2,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: alpha(theme.palette.divider, 0.3)
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: alpha(theme.palette.primary.main, 0.5)
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main
            }
          }}
        >
          {FILTER_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography component="span">{option.icon}</Typography>
                <Typography variant="body2">{option.label}</Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    ),
    [tradeFilter, handleFilterChange]
  );

  return (
    <TopWrapper>
      <StyledContainer maxWidth={false}>
        <ContentWrapper>
          {isMobile ? (
            <MobileMetric>
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ width: '100%' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    p: 0.25,
                    borderRadius: 0.5,
                    background: alpha(mobileMetrics[currentMetricIndex].color, 0.08),
                    flex: 1
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      fontWeight: 500,
                      fontSize: '0.7rem',
                      textTransform: 'uppercase'
                    }}
                  >
                    {t(mobileMetrics[currentMetricIndex].label)}
                  </Typography>
                  {mobileMetrics[currentMetricIndex].loading ? (
                    <Skeleton 
                      variant="text" 
                      width={50} 
                      height={16} 
                      sx={{ bgcolor: alpha(theme.palette.action.hover, 0.1) }} 
                    />
                  ) : (
                    <Typography
                      variant="caption"
                      color={mobileMetrics[currentMetricIndex].color}
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.8rem'
                      }}
                    >
                      {mobileMetrics[currentMetricIndex].value}
                    </Typography>
                  )}
                </Box>
                {currentMetricIndex >= 3 && (
                  <H24Style>
                    <Typography
                      variant="caption"
                      color="#ffffff"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.6rem',
                        lineHeight: 1
                      }}
                    >
                      24h
                    </Typography>
                  </H24Style>
                )}
                <APILabel
                  onClick={(e) => {
                    e.preventDefault();
                    handleTradeDrawerOpen();
                  }}
                >
                  <PulsatingCircle />
                  <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem', fontFamily: 'Inter, sans-serif' }}>
                    Live
                  </Typography>
                </APILabel>
              </Stack>
            </MobileMetric>
          ) : (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
              <MetricContainer direction="row" spacing={1} alignItems="center">
                <MetricLabel>{t('Addresses')}</MetricLabel>
                {metricsLoaded ? (
                  <MetricValue sx={{ color: '#54D62C' }}>
                    {abbreviateNumber(metrics.global?.totalAddresses || 0)}
                  </MetricValue>
                ) : (
                  <Skeleton variant="text" width={60} height={20} sx={{ bgcolor: alpha(theme.palette.action.hover, 0.1) }} />
                )}
              </MetricContainer>

              <MetricContainer direction="row" spacing={1} alignItems="center">
                <MetricLabel>{t('Tokens')}</MetricLabel>
                {metricsLoaded ? (
                  <MetricValue sx={{ color: '#FF6B6B' }}>
                    {abbreviateNumber(metrics.global?.total || 0)}
                  </MetricValue>
                ) : (
                  <Skeleton variant="text" width={60} height={20} sx={{ bgcolor: alpha(theme.palette.action.hover, 0.1) }} />
                )}
              </MetricContainer>

              <MetricContainer direction="row" spacing={1} alignItems="center">
                <MetricLabel>{t('Offers')}</MetricLabel>
                {metricsLoaded ? (
                  <MetricValue sx={{ color: '#FFC107' }}>
                    {abbreviateNumber(metrics.global?.totalOffers || 0)}
                  </MetricValue>
                ) : (
                  <Skeleton variant="text" width={60} height={20} sx={{ bgcolor: alpha(theme.palette.action.hover, 0.1) }} />
                )}
              </MetricContainer>

              <MetricContainer direction="row" spacing={1} alignItems="center">
                <MetricLabel>{t('Trustlines')}</MetricLabel>
                {metricsLoaded ? (
                  <MetricValue sx={{ color: '#FFA48D' }}>
                    {abbreviateNumber(metrics.global?.totalTrustLines || 0)}
                  </MetricValue>
                ) : (
                  <Skeleton variant="text" width={60} height={20} sx={{ bgcolor: alpha(theme.palette.action.hover, 0.1) }} />
                )}
              </MetricContainer>

              <H24Style>
                <Tooltip title="Statistics from the past 24 hours" arrow>
                  <Typography
                    variant="body2"
                    color="#ffffff"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      lineHeight: 1
                    }}
                  >
                    24h
                  </Typography>
                </Tooltip>
              </H24Style>

              <MetricContainer direction="row" spacing={1} alignItems="center">
                <MetricLabel>{t('Trades')}</MetricLabel>
                {metricsLoaded ? (
                  <MetricValue sx={{ color: '#74CAFF' }}>
                    {abbreviateNumber(metrics.H24?.transactions24H || 0)}
                  </MetricValue>
                ) : (
                  <Skeleton variant="text" width={60} height={20} sx={{ bgcolor: alpha(theme.palette.action.hover, 0.1) }} />
                )}
              </MetricContainer>

              <MetricContainer direction="row" spacing={1} alignItems="center">
                <MetricLabel>{t('Vol')}</MetricLabel>
                {metricsLoaded ? (
                  <MetricValue sx={{ color: theme.palette.error.main }}>
                    {currencySymbols[activeFiatCurrency]}
                    {abbreviateNumber(
                      metrics?.H24?.tradedXRP24H && metrics[activeFiatCurrency]
                        ? new Decimal(metrics.H24.tradedXRP24H || 0)
                            .div(new Decimal(metrics[activeFiatCurrency] || 1))
                            .toNumber()
                        : 0
                    )}
                  </MetricValue>
                ) : (
                  <Skeleton variant="text" width={80} height={20} sx={{ bgcolor: alpha(theme.palette.action.hover, 0.1) }} />
                )}
              </MetricContainer>

              <MetricContainer direction="row" spacing={1} alignItems="center">
                <MetricLabel>{t('Tokens Traded')}</MetricLabel>
                {metricsLoaded ? (
                  <MetricValue sx={{ color: '#3366FF' }}>
                    {abbreviateNumber(metrics.H24?.tradedTokens24H || 0)}
                  </MetricValue>
                ) : (
                  <Skeleton variant="text" width={60} height={20} sx={{ bgcolor: alpha(theme.palette.action.hover, 0.1) }} />
                )}
              </MetricContainer>

              <MetricContainer direction="row" spacing={1} alignItems="center">
                <MetricLabel>{t('Active Addresses')}</MetricLabel>
                {metricsLoaded ? (
                  <MetricValue sx={{ color: '#54D62C' }}>
                    {abbreviateNumber(metrics.H24?.activeAddresses24H || 0)}
                  </MetricValue>
                ) : (
                  <Skeleton variant="text" width={60} height={20} sx={{ bgcolor: alpha(theme.palette.action.hover, 0.1) }} />
                )}
              </MetricContainer>

              <MetricContainer direction="row" spacing={1} alignItems="center">
                <MetricLabel>{t('Unique Traders')}</MetricLabel>
                {metricsLoaded ? (
                  <MetricValue sx={{ color: '#2196F3' }}>
                    {abbreviateNumber(metrics?.H24?.uniqueTraders24H || 0)}
                  </MetricValue>
                ) : (
                  <Skeleton variant="text" width={60} height={20} sx={{ bgcolor: alpha(theme.palette.action.hover, 0.1) }} />
                )}
              </MetricContainer>

              <MetricContainer direction="row" spacing={1} alignItems="center">
                <MetricLabel>{t('Total TVL')}</MetricLabel>
                {metricsLoaded ? (
                  <MetricValue sx={{ color: '#8E44AD' }}>
                    {currencySymbols[activeFiatCurrency]}
                    {abbreviateNumber(
                      metrics?.H24?.totalTVL && metrics[activeFiatCurrency]
                        ? new Decimal(metrics.H24.totalTVL || 0)
                            .div(new Decimal(metrics[activeFiatCurrency] || 1))
                            .toNumber()
                        : 0
                    )}
                  </MetricValue>
                ) : (
                  <Skeleton variant="text" width={80} height={20} sx={{ bgcolor: alpha(theme.palette.action.hover, 0.1) }} />
                )}
              </MetricContainer>
            </Stack>
          )}
          {!isMobile && (
            <Box sx={{ paddingLeft: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CurrencySwithcer />
              <ThemeSwitcher />
              <APILabel
                onClick={(e) => {
                  e.preventDefault();
                  handleTradeDrawerOpen();
                }}
              >
                <PulsatingCircle />
                <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem', fontFamily: 'Inter, sans-serif' }}>
                  Live Trades
                </Typography>
              </APILabel>
            </Box>
          )}
        </ContentWrapper>
      </StyledContainer>
      <StyledDrawer
        anchor="right"
        open={Boolean(tradeDrawerOpen)}
        onClose={handleTradeDrawerClose}
        keepMounted={false}
        sx={{
          '& .MuiDrawer-paper': {
            width: isMobile ? '100%' : '400px',
            padding: 0
          }
        }}
      >
        <DrawerHeader>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
              Global Trades
            </Typography>
            <LiveCircle />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {FilterSelect}
            <IconButton
              onClick={handleTradeDrawerClose}
              size="small"
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  color: 'text.primary',
                  backgroundColor: alpha(theme.palette.text.primary, 0.08)
                }
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DrawerHeader>

        {wsError ? (
          <Box p={3} textAlign="center">
            <Typography color="error" variant="h6" gutterBottom>
              Failed to load trades
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {wsError}
            </Typography>
          </Box>
        ) : isWsLoading ? (
          <Box p={3}>
            <Box display="flex" justifyContent="center" mb={2}>
              <CircularProgress size={40} />
            </Box>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Connecting to live trades...
            </Typography>
            <Box mt={2}>
              {[...Array(5)].map((_, i) => (
                <Box key={i} sx={{ mb: 1 }}>
                  <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 2 }} />
                </Box>
              ))}
            </Box>
          </Box>
        ) : (
          <List
            sx={{
              width: '100%',
              padding: 0,
              maxHeight: 'calc(100vh - 100px)',
              overflow: 'auto',
              '&::-webkit-scrollbar': {
                width: '6px'
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: alpha(theme.palette.divider, 0.1)
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: alpha(theme.palette.text.secondary, 0.3),
                borderRadius: '3px',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.text.secondary, 0.5)
                }
              }
            }}
          >
            {filteredTrades.map((trade, index) => {
              // Determine which currency is not XRP to link to
              const tokenCurrency = trade.paid?.currency === 'XRP' ? trade.got : trade.paid;
              const tokenPath = tokenCurrency?.issuer && tokenCurrency?.currency 
                ? `/token/${tokenCurrency.issuer}-${tokenCurrency.currency}` 
                : '#';
              const txPath = trade.hash ? `/tx/${trade.hash}` : '#';
              
              // Calculate background opacity based on XRP volume
              const xrpAmount = getXRPAmount(trade);
              const maxXrp = Math.max(...filteredTrades.map(t => getXRPAmount(t)));
              const minOpacity = 0.02;
              const maxOpacity = 0.15;
              const opacityRatio = maxXrp > 0 ? Math.min(xrpAmount / maxXrp, 1) : 0;
              const backgroundOpacity = minOpacity + (opacityRatio * (maxOpacity - minOpacity));
              
              return (
              <ListItem
                key={`${trade.time}-${trade.maker}-${trade.taker}-${trade.paid?.value}-${trade.got?.value}-${index}`}
                component="a"
                href={tokenPath}
                sx={{
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
                  position: 'relative',
                  overflow: 'hidden',
                  padding: '12px 16px',
                  width: '100%',
                  margin: '0 8px',
                  width: 'calc(100% - 16px)',
                  borderRadius: '8px',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  textDecoration: 'none',
                  color: 'inherit',
                  background: theme.palette.mode === 'dark' && theme.palette.primary.main === '#00ffff'
                    ? alpha('#030310', 0.5)
                    : theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.default, 0.3)
                      : alpha(theme.palette.grey[50], 0.5),
                  cursor: 'pointer',
                  '&:hover': {
                    background: theme.palette.mode === 'dark' && theme.palette.primary.main === '#00ffff'
                      ? alpha(theme.palette.primary.main, 0.04)
                      : theme.palette.mode === 'dark'
                        ? alpha(theme.palette.background.default, 0.6)
                        : alpha(theme.palette.grey[100], 0.8),
                    transform: 'translateY(-1px)',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.08)}`
                  }
                }}
              >

                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flex: 1 }}>
                    <TokenImage
                      src={getTokenImageUrl(trade.paid.issuer, trade.paid.currency)}
                      alt={decodeCurrency(trade.paid.currency)}
                    />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', lineHeight: 1.2, fontFamily: 'Inter, sans-serif' }}>
                        {formatTradeValue(trade.paid.value)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', lineHeight: 1.2, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.3px', opacity: 0.8 }}>
                        {decodeCurrency(trade.paid.currency)}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.5 }}>
                    <SwapHorizIcon sx={{ color: alpha(theme.palette.text.secondary, 0.4), fontSize: '1rem' }} />
                    <Typography component="span" sx={{ fontSize: '1rem' }}>
                      {getTradeSizeEmoji(getXRPAmount(trade))}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1, justifyContent: 'flex-end' }}>
                    <Box sx={{ textAlign: 'right', minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.75rem', lineHeight: 1, fontFamily: 'monospace' }}>
                        {formatTradeValue(trade.got.value)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', lineHeight: 1, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {decodeCurrency(trade.got.currency)}
                      </Typography>
                    </Box>
                    <TokenImage
                      src={getTokenImageUrl(trade.got.issuer, trade.got.currency)}
                      alt={decodeCurrency(trade.got.currency)}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1, minWidth: 120, justifyContent: 'flex-end' }}>
                    {trade.hash && (
                      <IconButton
                        component="a"
                        href={txPath}
                        size="small"
                        sx={{
                          width: 16,
                          height: 16,
                          color: 'text.secondary',
                          '&:hover': {
                            color: 'primary.main'
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <LinkIcon sx={{ fontSize: '0.7rem' }} />
                      </IconButton>
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                      {formatRelativeTime(trade.time)}
                    </Typography>
                    <TradeTypeChip
                      size="small"
                      label={trade.paid?.currency === 'XRP' ? 'B' : 'S'}
                      tradetype={trade.paid?.currency === 'XRP' ? 'BUY' : 'SELL'}
                    />
                  </Box>
                </Box>
              </ListItem>
              );
            })}
          </List>
        )}
      </StyledDrawer>
    </TopWrapper>
  );
};

export default Topbar;
