import React, { useState, useContext, useEffect, useMemo, useCallback } from 'react';
import Decimal from 'decimal.js';
import Wallet from 'src/components/Wallet';
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
import { useRouter } from 'next/router';

import { useDispatch, useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';
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
    height: ${theme.spacing(6)};
    border-radius: 0px;
    background: ${
      theme.palette.mode === 'dark'
        ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.85)} 100%)`
        : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.98)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`
    };
    backdrop-filter: blur(20px);
    border-bottom: 1px solid ${alpha(theme.palette.divider, 0.08)};
    box-shadow: 0 4px 20px 0 ${alpha(theme.palette.common.black, theme.palette.mode === 'dark' ? 0.3 : 0.08)};
    position: relative;
    overflow: hidden;
    z-index: 1100;
    
    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(to right, 
        ${alpha(theme.palette.primary.main, 0)}, 
        ${alpha(theme.palette.primary.main, 0.6)}, 
        ${alpha(theme.palette.secondary.main, 0.6)}, 
        ${alpha(theme.palette.primary.main, 0)}
      );
      opacity: 0.7;
    }
    
    &::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(to right, 
        ${alpha(theme.palette.divider, 0)}, 
        ${alpha(theme.palette.divider, 0.3)}, 
        ${alpha(theme.palette.divider, 0)}
      );
    }
`
);

const ContentWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  py: theme.spacing(1.5),
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

const Separator = styled('span')(({ theme }) => ({
  fontSize: '1.1rem',
  padding: `0 ${theme.spacing(1.5)}`,
  color: alpha(theme.palette.text.primary, 0.3),
  fontWeight: 300,
  '&::before': {
    content: '""',
    display: 'inline-block',
    width: '1px',
    height: '16px',
    background: `linear-gradient(to bottom, ${alpha(theme.palette.divider, 0)}, ${alpha(theme.palette.divider, 0.5)}, ${alpha(theme.palette.divider, 0)})`,
    verticalAlign: 'middle'
  }
}));

const APILabel = styled('a')(({ theme }) => ({
  fontSize: '13px',
  fontWeight: 600,
  color: theme.palette.text.primary,
  textDecoration: 'none',
  marginLeft: theme.spacing(1),
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(
    theme.palette.primary.main,
    0.06
  )} 100%)`,
  backdropFilter: 'blur(12px)',
  padding: '8px 16px',
  borderRadius: '16px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  minHeight: '36px',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.1)}, transparent)`,
    transition: 'left 0.6s ease-in-out'
  },
  '&:hover': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(
      theme.palette.primary.main,
      0.12
    )} 100%)`,
    transform: 'translateY(-2px) scale(1.02)',
    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.25)}`,
    '&::before': {
      left: '100%'
    }
  },
  '&:active': {
    transform: 'translateY(-1px) scale(1.01)'
  }
}));

const MobileMetric = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  gap: theme.spacing(1),
  width: '100%',
  paddingLeft: theme.spacing(1),
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(
    theme.palette.background.paper,
    0.6
  )} 100%)`,
  backdropFilter: 'blur(8px)',
  borderRadius: theme.spacing(2),
  padding: theme.spacing(1, 1.5),
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.1)}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.15)}`
  }
}));

const H24Style = styled('div')(({ theme }) => ({
  cursor: 'pointer',
  paddingLeft: theme.spacing(1),
  paddingRight: theme.spacing(1),
  paddingTop: theme.spacing(0.5),
  paddingBottom: theme.spacing(0.5),
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  borderRadius: theme.spacing(1.5),
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  opacity: 0.9,
  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
  border: `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '1px',
    background: `linear-gradient(to right, transparent, ${alpha(theme.palette.primary.light, 0.5)}, transparent)`
  },
  '&:hover': {
    opacity: 1,
    transform: 'translateY(-2px) scale(1.05)',
    boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.4)}`
  }
}));

const SWITCH_INTERVAL = 4000; // 4 seconds between switches

const StyledContainer = styled(Container)(({ theme }) => ({
  [theme.breakpoints.down('md')]: {
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1)
  }
}));

const TradeButton = styled(IconButton)(({ theme }) => ({
  marginLeft: theme.spacing(1),
  padding: theme.spacing(1.5),
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(
    theme.palette.primary.main,
    0.08
  )} 100%)`,
  backdropFilter: 'blur(12px)',
  borderRadius: theme.spacing(1.5),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.25)} 0%, ${alpha(
      theme.palette.primary.main,
      0.15
    )} 100%)`,
    transform: 'translateY(-2px) scale(1.05)',
    boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.25)}`
  }
}));

const PulsatingCircle = styled('div')(({ theme }) => ({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.main,
  position: 'relative',
  boxShadow: `0 0 8px ${alpha(theme.palette.primary.main, 0.6)}`,
  '&::before, &::after': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    backgroundColor: 'inherit',
    animation: 'pulse-modern 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
  },
  '&::after': {
    animationDelay: '-1.25s'
  },
  '@keyframes pulse-modern': {
    '0%, 100%': {
      transform: 'translate(-50%, -50%) scale(1)',
      opacity: 0.8
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
  background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.15)} 0%, ${alpha(
    theme.palette.success.main,
    0.08
  )} 100%)`,
  border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.2)}`,
  '&:hover': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.2)} 0%, ${alpha(
      theme.palette.success.main,
      0.12
    )} 100%)`,
    transform: 'translateY(-1px)',
    boxShadow: `0 6px 16px ${alpha(theme.palette.success.main, 0.3)}`
  }
}));

const LiveCircle = styled('div')(({ theme }) => ({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  backgroundColor: theme.palette.success.main,
  position: 'relative',
  boxShadow: `0 0 8px ${alpha(theme.palette.success.main, 0.6)}`,
  '&::before, &::after': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    backgroundColor: 'inherit',
    animation: 'ripple-modern 2s cubic-bezier(0.4, 0, 0.2, 1) infinite'
  },
  '&::after': {
    animationDelay: '-1s'
  },
  '@keyframes ripple-modern': {
    '0%': {
      transform: 'translate(-50%, -50%) scale(1)',
      opacity: 0.9
    },
    '100%': {
      transform: 'translate(-50%, -50%) scale(4)',
      opacity: 0
    }
  }
}));

const ProgressBar = styled('div')(({ theme, width, color }) => ({
  position: 'absolute',
  left: 0,
  top: 0,
  height: '100%',
  width: `${width}%`,
  background: `linear-gradient(90deg, ${alpha(color, 0.3)}, ${alpha(color, 0.1)})`,
  transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
  borderRadius: 'inherit'
}));

const ProgressBarContainer = styled('div')(({ theme }) => ({
  position: 'absolute',
  left: 0,
  top: 0,
  height: '100%',
  width: '100%',
  overflow: 'hidden',
  borderRadius: 'inherit'
}));

const MetricContainer = styled(Stack)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  borderRadius: theme.spacing(2),
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(
    theme.palette.background.paper,
    0.6
  )} 100%)`,
  backdropFilter: 'blur(12px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.08)}`,
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '2px',
    background: `linear-gradient(to right, ${alpha(theme.palette.primary.main, 0)}, ${alpha(
      theme.palette.primary.main,
      0.3
    )}, ${alpha(theme.palette.primary.main, 0)})`,
    opacity: 0,
    transition: 'opacity 0.3s ease'
  },
  '&:hover': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(
      theme.palette.background.paper,
      0.7
    )} 100%)`,
    transform: 'translateY(-3px) scale(1.02)',
    boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.15)}`,
    '&::before': {
      opacity: 1
    }
  }
}));

const MetricLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontWeight: 500,
  fontSize: '0.8rem',
  letterSpacing: '0.5px',
  textTransform: 'uppercase'
}));

const MetricValue = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '0.95rem',
  letterSpacing: '-0.5px'
}));

const TradeCard = styled(Card)(({ theme }) => ({
  margin: theme.spacing(0.5, 1),
  borderRadius: theme.spacing(2),
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(
    theme.palette.background.paper,
    0.7
  )} 100%)`,
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.15)}`
  }
}));

const TokenImage = styled('img')(({ theme }) => ({
  width: 20,
  height: 20,
  borderRadius: '50%',
  border: `2px solid ${alpha(theme.palette.background.paper, 0.8)}`,
  boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.1)}`
}));

const TradeTypeChip = styled(Chip)(({ theme, tradetype }) => ({
  height: 24,
  fontSize: '0.75rem',
  fontWeight: 600,
  borderRadius: '12px',
  ...(tradetype === 'BUY' && {
    backgroundColor: alpha(theme.palette.success.main, 0.15),
    color: theme.palette.success.main,
    border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`
  }),
  ...(tradetype === 'SELL' && {
    backgroundColor: alpha(theme.palette.error.main, 0.15),
    color: theme.palette.error.main,
    border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`
  })
}));

const DrawerHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2, 3),
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(
    theme.palette.background.paper,
    0.85
  )} 100%)`,
  backdropFilter: 'blur(20px)',
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
  position: 'sticky',
  top: 0,
  zIndex: 1
}));

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.background.default, 0.98)} 0%, ${alpha(
      theme.palette.background.default,
      0.95
    )} 100%)`,
    backdropFilter: 'blur(20px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`
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

// Remove this function since we're not using different URLs based on filters
const getTradeApiUrl = () => {
  return 'https://api.xrpl.to/api/history?md5=84e5efeb89c4eae8f68188982dc290d8&page=0&limit=5000';
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

  // Memoize the mobile metrics to prevent recreation on every render
  const mobileMetrics = useMemo(
    () => [
      {
        label: 'Addresses',
        value: abbreviateNumber(metrics.global.totalAddresses),
        color: '#54D62C'
      },
      {
        label: 'Tokens',
        value: abbreviateNumber(metrics.global.total || 0),
        color: '#FF6B6B'
      },
      {
        label: 'Offers',
        value: abbreviateNumber(metrics.global.totalOffers),
        color: '#FFC107'
      },
      {
        label: 'Trustlines',
        value: abbreviateNumber(metrics.global.totalTrustLines),
        color: '#FFA48D'
      },
      {
        label: 'Trades',
        value: abbreviateNumber(metrics.H24.transactions24H),
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
        value: abbreviateNumber(metrics.H24.tradedTokens24H),
        color: '#3366FF'
      },
      {
        label: 'Active Addresses',
        value: abbreviateNumber(metrics.H24.activeAddresses24H),
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
        color: '#8E44AD' // Purple color for TVL
      }
    ],
    [metrics, activeFiatCurrency, theme.palette.error.main]
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
    setTradeFilter(event.target.value);
  }, []);

  useEffect(() => {
    if (!tradeDrawerOpen) {
      return;
    }

    setIsWsLoading(true);
    setTrades([]);
    setWsError(null);

    const ws = new WebSocket('wss://api.xrpl.to/ws/sync');

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsWsLoading(false);
    };

    const throttledSetTrades = throttle((newTrades) => {
      setTrades(newTrades);
    }, 200); // Throttle to update every 200ms

    const throttledAddTrade = throttle((newTrade) => {
      setTrades((prevTrades) => [newTrade, ...prevTrades].slice(0, 500));
    }, 200); // Throttle to update every 200ms

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (Array.isArray(data)) {
          throttledSetTrades(data.slice(0, 500));
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
  }, [tradeDrawerOpen]);

  // Fix the filtering logic in the useMemo
  const filteredTrades = useMemo(() => {
    if (!trades) return [];

    // First sort by time
    const sortedTrades = [...trades].sort((a, b) => b.time - a.time);

    // Then filter by XRP amount if needed
    if (tradeFilter === 'All') {
      return sortedTrades;
    }

    // Extract the minimum XRP value from the filter
    const minXrp = parseInt(tradeFilter.replace('+', ''));

    return sortedTrades.filter((trade) => {
      // Get the XRP amount and ensure it's a number
      const xrpAmount = parseFloat(getXRPAmount(trade));

      // Compare numeric values
      return !isNaN(xrpAmount) && xrpAmount >= minXrp;
    });
  }, [trades, tradeFilter]);

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
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1,
                    borderRadius: 1,
                    background: alpha(mobileMetrics[currentMetricIndex].color, 0.1),
                    border: `1px solid ${alpha(mobileMetrics[currentMetricIndex].color, 0.2)}`
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {t(mobileMetrics[currentMetricIndex].label)}
                  </Typography>
                  <Typography
                    variant="body2"
                    color={mobileMetrics[currentMetricIndex].color}
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.9rem'
                    }}
                  >
                    {mobileMetrics[currentMetricIndex].value}
                  </Typography>
                </Box>
                {currentMetricIndex >= 3 && (
                  <H24Style>
                    <Typography
                      variant="body2"
                      color="#ffffff"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.8rem'
                      }}
                    >
                      24h
                    </Typography>
                  </H24Style>
                )}
              </Stack>
            </MobileMetric>
          ) : (
            <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
              <MetricContainer direction="row" spacing={1} alignItems="center">
                <MetricLabel>{t('Addresses')}</MetricLabel>
                <MetricValue sx={{ color: '#54D62C' }}>
                  {abbreviateNumber(metrics.global.totalAddresses)}
                </MetricValue>
              </MetricContainer>

              <MetricContainer direction="row" spacing={1} alignItems="center">
                <MetricLabel>{t('Tokens')}</MetricLabel>
                <MetricValue sx={{ color: '#FF6B6B' }}>
                  {abbreviateNumber(metrics.global.total || 0)}
                </MetricValue>
              </MetricContainer>

              <MetricContainer direction="row" spacing={1} alignItems="center">
                <MetricLabel>{t('Offers')}</MetricLabel>
                <MetricValue sx={{ color: '#FFC107' }}>
                  {abbreviateNumber(metrics.global.totalOffers)}
                </MetricValue>
              </MetricContainer>

              <MetricContainer direction="row" spacing={1} alignItems="center">
                <MetricLabel>{t('Trustlines')}</MetricLabel>
                <MetricValue sx={{ color: '#FFA48D' }}>
                  {abbreviateNumber(metrics.global.totalTrustLines)}
                </MetricValue>
              </MetricContainer>

              <H24Style>
                <Tooltip title="Statistics from the past 24 hours" arrow>
                  <Typography
                    variant="body2"
                    color="#ffffff"
                    sx={{
                      px: 1,
                      fontWeight: 600,
                      fontSize: '0.85rem'
                    }}
                  >
                    24h
                  </Typography>
                </Tooltip>
              </H24Style>

              <MetricContainer direction="row" spacing={1} alignItems="center">
                <MetricLabel>{t('Trades')}</MetricLabel>
                <MetricValue sx={{ color: '#74CAFF' }}>
                  {abbreviateNumber(metrics.H24.transactions24H)}
                </MetricValue>
              </MetricContainer>

              <MetricContainer direction="row" spacing={1} alignItems="center">
                <MetricLabel>{t('Vol')}</MetricLabel>
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
              </MetricContainer>

              <MetricContainer direction="row" spacing={1} alignItems="center">
                <MetricLabel>{t('Tokens Traded')}</MetricLabel>
                <MetricValue sx={{ color: '#3366FF' }}>
                  {abbreviateNumber(metrics.H24.tradedTokens24H)}
                </MetricValue>
              </MetricContainer>

              <MetricContainer direction="row" spacing={1} alignItems="center">
                <MetricLabel>{t('Active Addresses')}</MetricLabel>
                <MetricValue sx={{ color: '#54D62C' }}>
                  {abbreviateNumber(metrics.H24.activeAddresses24H)}
                </MetricValue>
              </MetricContainer>

              <MetricContainer direction="row" spacing={1} alignItems="center">
                <MetricLabel>{t('Unique Traders')}</MetricLabel>
                <MetricValue sx={{ color: '#2196F3' }}>
                  {abbreviateNumber(metrics?.H24?.uniqueTraders24H || 0)}
                </MetricValue>
              </MetricContainer>

              <MetricContainer direction="row" spacing={1} alignItems="center">
                <MetricLabel>{t('Total TVL')}</MetricLabel>
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
              </MetricContainer>
            </Stack>
          )}
          {!isMobile && (
            <Box sx={{ paddingLeft: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CurrencySwithcer />
              <ThemeSwitcher />
              <Separator />
              <APILabel
                onClick={(e) => {
                  e.preventDefault();
                  handleTradeDrawerOpen();
                }}
              >
                <PulsatingCircle />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Global Trades
                </Typography>
              </APILabel>
              {!fullSearch && isDesktop && <Wallet style={{ marginRight: '9px' }} />}
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
            width: isMobile ? '100%' : '420px',
            padding: 0
          }
        }}
      >
        <DrawerHeader>
          <Box display="flex" alignItems="center" gap={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Global Trades
              </Typography>
              <LiveIndicator>
                <LiveCircle />
                <Typography
                  variant="caption"
                  color="success.main"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  LIVE
                </Typography>
              </LiveIndicator>
            </Box>
            {tradeFilter !== 'All' && (
              <Chip
                size="small"
                label={`${filteredTrades.length} matches`}
                color="primary"
                variant="outlined"
                sx={{ borderRadius: 2 }}
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {FilterSelect}
            <IconButton
              onClick={handleTradeDrawerClose}
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  color: 'text.primary',
                  backgroundColor: alpha(theme.palette.text.primary, 0.1)
                }
              }}
            >
              <CloseIcon />
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
            {filteredTrades.map((trade, index) => (
              <ListItem
                key={`${trade.time}-${trade.maker}-${trade.taker}-${trade.paid?.value}-${trade.got?.value}-${index}`}
                sx={{
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                  position: 'relative',
                  overflow: 'hidden',
                  padding: '12px 16px',
                  width: '100%',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.text.primary, 0.03),
                    transform: 'translateX(4px)'
                  }
                }}
              >
                <ProgressBarContainer>
                  <ProgressBar
                    width={(() => {
                      try {
                        const xrpValue = parseFloat(getXRPAmount(trade));
                        if (isNaN(xrpValue)) return 5;
                        if (xrpValue < 500) return Math.max(5, (xrpValue / 500) * 25);
                        if (xrpValue < 5000) return Math.max(25, (xrpValue / 5000) * 50);
                        if (xrpValue < 10000) return Math.max(50, (xrpValue / 10000) * 75);
                        return Math.min(100, 75 + (xrpValue / 50000) * 25);
                      } catch (error) {
                        return 5;
                      }
                    })()}
                    color={trade.paid && trade.paid.currency === 'XRP' ? '#4CAF50' : '#F44336'}
                  />
                </ProgressBarContainer>

                <Box sx={{ width: '100%', position: 'relative', zIndex: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 1
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          fontSize: '0.75rem',
                          fontWeight: 500
                        }}
                      >
                        {formatRelativeTime(trade.time)}
                      </Typography>
                      <TradeTypeChip
                        size="small"
                        label={trade.paid.currency === 'XRP' ? 'BUY' : 'SELL'}
                        tradetype={trade.paid.currency === 'XRP' ? 'BUY' : 'SELL'}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography component="span" sx={{ fontSize: '1rem' }}>
                        {getTradeSizeEmoji(getXRPAmount(trade))}
                      </Typography>
                      {(BOT_ADDRESSES.includes(trade.maker) ||
                        BOT_ADDRESSES.includes(trade.taker)) && (
                        <Tooltip title="Bot Trade" arrow>
                          <SmartToy
                            sx={{
                              color: theme.palette.warning.main,
                              fontSize: '1rem'
                            }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                  </Box>

                  <Box
                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TokenImage
                        src={getTokenImageUrl(trade.paid.issuer, trade.paid.currency)}
                        alt={decodeCurrency(trade.paid.currency)}
                      />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          {formatTradeValue(trade.paid.value)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {decodeCurrency(trade.paid.currency)}
                        </Typography>
                      </Box>
                    </Box>

                    <SwapHorizIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          {formatTradeValue(trade.got.value)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {decodeCurrency(trade.got.currency)}
                        </Typography>
                      </Box>
                      <TokenImage
                        src={getTokenImageUrl(trade.got.issuer, trade.got.currency)}
                        alt={decodeCurrency(trade.got.currency)}
                      />
                    </Box>
                  </Box>
                </Box>
              </ListItem>
            ))}
          </List>
        )}
      </StyledDrawer>
    </TopWrapper>
  );
};

export default Topbar;
