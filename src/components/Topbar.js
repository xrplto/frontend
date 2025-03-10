import React, { useState, useContext, useEffect } from 'react';
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
  FormControl
} from '@mui/material';
import SmartToy from '@mui/icons-material/SmartToy';

import { useDispatch, useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';
import { useTranslation } from 'react-i18next';
import { AppContext } from 'src/AppContext';
import { fIntNumber, fNumber } from 'src/utils/formatNumber';
import CurrencySwithcer from './CurrencySwitcher';
import ThemeSwitcher from './ThemeSwitcher';
import { currencySymbols, getTokenImageUrl, decodeCurrency } from 'src/utils/constants';
import { toggleChatOpen } from 'src/redux/chatSlice';
import useSWR from 'swr';
import axios from 'axios';

const TopWrapper = styled(Box)(
  ({ theme }) => `
    width: 100%;
    display: flex;
    align-items: center;
    height: ${theme.spacing(5)};
    border-radius: 0px;
    border-bottom: 1px solid ${alpha('#CBCCD2', 0.2)};
`
);

const ContentWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: 1,
  py: 1,
  overflow: 'auto',
  width: '100%',
  justifyContent: 'space-between',
  alignItems: 'center',
  '& > *': {
    scrollSnapAlign: 'center'
  },
  '::-webkit-scrollbar': { display: 'none' }
}));

const Separator = styled('span')(({ theme }) => ({
  fontSize: '1rem', // Increase font size
  padding: '0 10px', // Add padding to make it longer
  color: theme.palette.text.primary // Adjust color as needed
}));

const APILabel = styled('a')(({ theme }) => ({
  fontSize: '13px',
  color: theme.palette.text.primary,
  textDecoration: 'none',
  marginLeft: theme.spacing(1),
  backgroundColor: alpha(theme.palette.primary.main, 0.3),
  padding: '4px 12px',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  minHeight: '32px',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.2),
    textDecoration: 'none',
    cursor: 'pointer',
    transform: 'translateY(-1px)'
  },
  '&:active': {
    transform: 'translateY(0)'
  }
}));

const MobileMetric = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  gap: theme.spacing(1),
  width: '100%',
  paddingLeft: 0
}));

const H24Style = styled('div')(({ theme }) => ({
  cursor: 'pointer',
  paddingLeft: theme.spacing(0.5),
  paddingRight: theme.spacing(0.5),
  paddingTop: theme.spacing(0.07),
  paddingBottom: theme.spacing(0.07),
  backgroundColor: '#5569ff !important',
  borderRadius: 8,
  transition: theme.transitions.create('opacity'),
  opacity: 1,
  '&:hover': { opacity: 1 }
}));

const SWITCH_INTERVAL = 3000; // 3 seconds between switches

const StyledContainer = styled(Container)(({ theme }) => ({
  [theme.breakpoints.down('md')]: {
    paddingLeft: 0,
    paddingRight: 0
  }
}));

const TradeButton = styled(IconButton)(({ theme }) => ({
  marginLeft: theme.spacing(1),
  padding: theme.spacing(1),
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  borderRadius: '8px',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.2)
  }
}));

// Add this styled component after other styled components
const PulsatingCircle = styled('div')(({ theme }) => ({
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  backgroundColor: theme.palette.success.main,
  animation: 'pulse 1.5s infinite',
  '@keyframes pulse': {
    '0%': {
      transform: 'scale(0.9)',
      opacity: 0.7
    },
    '50%': {
      transform: 'scale(1.1)',
      opacity: 1
    },
    '100%': {
      transform: 'scale(0.9)',
      opacity: 0.7
    }
  }
}));

// Add this styled component after other styled components
const LiveIndicator = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(0.5, 1),
  borderRadius: '16px',
  backgroundColor: alpha(theme.palette.error.main, 0.1)
}));

const LiveCircle = styled('div')(({ theme }) => ({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  backgroundColor: theme.palette.error.main,
  animation: 'pulse 1.5s infinite',
  '@keyframes pulse': {
    '0%': {
      transform: 'scale(0.9)',
      opacity: 0.7
    },
    '50%': {
      transform: 'scale(1.1)',
      opacity: 1
    },
    '100%': {
      transform: 'scale(0.9)',
      opacity: 0.7
    }
  }
}));

const ProgressBar = styled('div')(({ theme, width, color }) => ({
  position: 'absolute',
  left: 0,
  top: 0,
  height: '100%',
  width: `${width}%`,
  backgroundColor: color,
  opacity: 0.15,
  transition: 'width 0.3s ease-in-out'
}));

const ProgressBarContainer = styled('div')(({ theme }) => ({
  position: 'absolute',
  left: 0,
  top: 0,
  height: '100%',
  width: '100%',
  overflow: 'hidden'
}));

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
  if (xrpValue >= 500 && xrpValue < 5000) return '🐬';
  if (xrpValue >= 5000 && xrpValue < 10000) return '🐋';
  if (xrpValue >= 10000) return '🐳';
  return '';
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
  const xrpValue =
    trade.paid.currency === 'XRP'
      ? parseValue(trade.paid.value)
      : trade.got.currency === 'XRP'
      ? parseValue(trade.got.value)
      : 0;
  return xrpValue;
};

const parseValue = (value) => {
  if (typeof value === 'string' && value.includes('e')) {
    const converted = parseFloat(Number(value).toFixed(8));
    console.log(`Converted ${value} to ${converted}`);
    return converted;
  }
  return parseFloat(value);
};

const filterTrades = (trades, selectedFilter) => {
  if (!trades?.hists) return [];

  const filters = {
    All: () => true,
    '🦐 <500 XRP': (trade) => {
      const xrpAmount = getXRPAmount(trade);
      return xrpAmount > 0 && xrpAmount < 500;
    },
    '🐬 500-5000 XRP': (trade) => {
      const xrpAmount = getXRPAmount(trade);
      return xrpAmount >= 500 && xrpAmount < 5000;
    },
    '🐋 5000-10000 XRP': (trade) => {
      const xrpAmount = getXRPAmount(trade);
      return xrpAmount >= 5000 && xrpAmount < 10000;
    },
    '🐳 10000+ XRP': (trade) => {
      const xrpAmount = getXRPAmount(trade);
      return xrpAmount >= 10000;
    }
  };

  const filteredTrades = trades.hists.filter(filters[selectedFilter]);

  // Sort by timestamp in descending order (most recent first)
  return filteredTrades.sort((a, b) => b.time - a.time);
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
  const totalAddresses = metrics.H24.totalAddresses;
  const activeAddresses = metrics.H24.activeAddresses24H;
  let percentAddress = 0;
  if (totalAddresses > 0)
    percentAddress = new Decimal(activeAddresses).mul(100).div(totalAddresses).toString();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { darkMode, activeFiatCurrency } = useContext(AppContext);
  const iconColor = darkMode ? '#FFFFFF' : '#000000';
  const [fullSearch, setFullSearch] = useState(false);
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const [currentMetricIndex, setCurrentMetricIndex] = useState(0);
  const [tradeDrawerOpen, setTradeDrawerOpen] = useState(false);
  const { data: trades, error } = useSWR(
    tradeDrawerOpen
      ? 'https://api.xrpl.to/api//history?md5=84e5efeb89c4eae8f68188982dc290d8&page=0&limit=50' //supports only 50 it seems
      : null,
    fetcher,
    {
      refreshInterval: tradeDrawerOpen ? 5000 : 0, // Refresh every 5 seconds when drawer is open
      dedupingInterval: 2000, // Dedupe requests within 2 seconds
      revalidateOnFocus: false // Don't revalidate on window focus
    }
  );
  const [filter, setFilter] = useState('All');

  const mobileMetrics = [
    {
      label: 'Tokens',
      value: abbreviateNumber(metrics.total),
      color: 'inherit'
    },
    {
      label: 'Addresses',
      value: abbreviateNumber(metrics.H24.totalAddresses),
      color: '#54D62C'
    },
    {
      label: 'Offers',
      value: abbreviateNumber(metrics.H24.totalOffers),
      color: '#FFC107'
    },
    {
      label: 'Trustlines',
      value: abbreviateNumber(metrics.H24.totalTrustLines),
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
    }
  ];

  // Add useEffect for auto-switching
  useEffect(() => {
    if (!isMobile) return;

    const interval = setInterval(() => {
      setCurrentMetricIndex((prev) => (prev + 1) % mobileMetrics.length);
    }, SWITCH_INTERVAL);

    return () => clearInterval(interval);
  }, [isMobile, mobileMetrics.length]);

  const handleTradeDrawerOpen = () => {
    setTradeDrawerOpen(true);
  };

  const handleTradeDrawerClose = () => {
    setTradeDrawerOpen(false);
  };

  return (
    <TopWrapper>
      <StyledContainer maxWidth={false}>
        <ContentWrapper>
          {isMobile ? (
            <MobileMetric>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" color="#a1a7bb" sx={{ fontWeight: 500 }}>
                  {t(mobileMetrics[currentMetricIndex].label)}:
                </Typography>
                <Typography variant="body2" color={mobileMetrics[currentMetricIndex].color}>
                  {mobileMetrics[currentMetricIndex].value}
                </Typography>
                {currentMetricIndex === 0 && (
                  <H24Style>
                    <Typography variant="body2" color="#ececec">
                      24h
                    </Typography>
                  </H24Style>
                )}
              </Stack>
            </MobileMetric>
          ) : (
            <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
              <Typography variant="body2" color="#a1a7bb" sx={{ fontWeight: 500 }}>
                {t('Tokens')}:
              </Typography>
              <Typography variant="body2">{abbreviateNumber(metrics.total)}</Typography>
              <Typography variant="body2" noWrap color="#a1a7bb" sx={{ fontWeight: 500 }}>
                {t('Addresses')}:
              </Typography>
              <Typography align="center" color="#54D62C" variant="body2">
                {abbreviateNumber(metrics.H24.totalAddresses)}
              </Typography>
              <Typography variant="body2" noWrap color="#a1a7bb" sx={{ fontWeight: 500 }}>
                {t('Offers')}:
              </Typography>
              <Typography align="center" color="#FFC107" variant="body2">
                {abbreviateNumber(metrics.H24.totalOffers)}
              </Typography>
              <Typography variant="body2" noWrap color="#a1a7bb" sx={{ fontWeight: 500 }}>
                {t('Trustlines')}:
              </Typography>
              <Typography align="center" color="#FFA48D" variant="body2">
                {abbreviateNumber(metrics.H24.totalTrustLines)}
              </Typography>
              <H24Style>
                <Tooltip title="Statistics from the past 24 hours.">
                  <Stack spacing={0} alignItems="center">
                    <Typography
                      align="center"
                      style={{ wordWrap: 'break-word' }}
                      variant="body2"
                      color="#ececec"
                    >
                      24h
                    </Typography>
                  </Stack>
                </Tooltip>
              </H24Style>
              <Typography variant="body2" color="#a1a7bb" sx={{ fontWeight: 500 }}>
                {t('Trades')}:
              </Typography>
              <Typography align="center" color="#74CAFF" variant="body2">
                {abbreviateNumber(metrics.H24.transactions24H)}
              </Typography>
              <Typography variant="body2" color="#a1a7bb" sx={{ fontWeight: 500 }}>
                {t('Vol')}:
              </Typography>
              <Typography align="center" variant="body2">
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Typography>{currencySymbols[activeFiatCurrency]}</Typography>
                  <Typography align="center" color={theme.palette.error.main} variant="body2">
                    {abbreviateNumber(
                      metrics?.H24?.tradedXRP24H && metrics[activeFiatCurrency]
                        ? new Decimal(metrics.H24.tradedXRP24H || 0)
                            .div(new Decimal(metrics[activeFiatCurrency] || 1))
                            .toNumber()
                        : 0
                    )}
                  </Typography>
                </Stack>
              </Typography>
              <Typography variant="body2" noWrap color="#a1a7bb" sx={{ fontWeight: 500 }}>
                {t('Tokens Traded')}:
              </Typography>
              <Typography align="center" color="#3366FF" variant="body2">
                {abbreviateNumber(metrics.H24.tradedTokens24H)}
              </Typography>
              <Typography variant="body2" noWrap color="#a1a7bb" sx={{ fontWeight: 500 }}>
                {t('Active Addresses')}:
              </Typography>
              <Typography align="center" color="#54D62C" variant="body2">
                {abbreviateNumber(metrics.H24.activeAddresses24H)}
              </Typography>
            </Stack>
          )}
          {!isMobile && (
            <Box sx={{ paddingLeft: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CurrencySwithcer />
              <ThemeSwitcher />
              <Separator>|</Separator>
              <APILabel onClick={handleTradeDrawerOpen}>
                <PulsatingCircle />
                Global Trades
              </APILabel>
              {!fullSearch && isDesktop && <Wallet style={{ marginRight: '9px' }} />}
            </Box>
          )}
        </ContentWrapper>
      </StyledContainer>
      <Drawer
        anchor="right"
        open={tradeDrawerOpen}
        onClose={handleTradeDrawerClose}
        sx={{
          '& .MuiDrawer-paper': {
            width: isMobile ? '100%' : '400px',
            padding: 0 // Remove padding from drawer paper
          }
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6">Global Trades</Typography>
            <LiveIndicator>
              <LiveCircle />
              <Typography variant="body2" color="error.main">
                LIVE
              </Typography>
            </LiveIndicator>
          </Box>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              displayEmpty
              inputProps={{ 'aria-label': 'Filter trades' }}
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="🦐 <500 XRP">🦐 &lt;500 XRP</MenuItem>
              <MenuItem value="🐬 500-5000 XRP">🐬 500-5000 XRP</MenuItem>
              <MenuItem value="🐋 5000-10000 XRP">🐋 5000-10000 XRP</MenuItem>
              <MenuItem value="🐳 10000+ XRP">🐳 10000+ XRP</MenuItem>
            </Select>
          </FormControl>
        </Box>
        {error ? (
          <Box p={2}>
            <Typography color="error">Failed to load trades</Typography>
            <Typography variant="body2" color="textSecondary">
              Error: {error.message}
            </Typography>
          </Box>
        ) : !trades ? (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress />
          </Box>
        ) : (
          <List sx={{ width: '100%', padding: 0 }}>
            {filterTrades(trades, filter).map((trade, index) => (
              <ListItem
                key={index}
                sx={{
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  position: 'relative',
                  overflow: 'hidden',
                  padding: '8px 12px',
                  width: '100%'
                }}
              >
                <ProgressBarContainer>
                  <ProgressBar
                    width={(() => {
                      const xrpValue = getXRPAmount(trade);

                      // Calculate relative width based on XRP amount
                      if (xrpValue < 500) return Math.max(5, (xrpValue / 500) * 25);
                      if (xrpValue < 5000) return Math.max(25, (xrpValue / 5000) * 50);
                      if (xrpValue < 10000) return Math.max(50, (xrpValue / 10000) * 75);
                      return Math.min(100, 75 + (xrpValue / 50000) * 25);
                    })()}
                    color={trade.paid.currency === 'XRP' ? '#4CAF50' : '#F44336'}
                  />
                </ProgressBarContainer>
                <Box sx={{ width: '100%', position: 'relative', zIndex: 1 }}>
                  <ListItemText
                    primary={
                      <>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              {formatRelativeTime(trade.time)}
                            </Typography>
                            {trade.paid.currency === 'XRP' ? (
                              <Typography component="span" variant="caption" color="success.main">
                                BUY{' '}
                              </Typography>
                            ) : (
                              <Typography component="span" variant="caption" color="error.main">
                                SELL{' '}
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <img
                              src={getTokenImageUrl(trade.paid.issuer, trade.paid.currency)}
                              alt={decodeCurrency(trade.paid.currency)}
                              style={{ width: 14, height: 14, borderRadius: '50%' }}
                            />
                            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                              {formatTradeValue(trade.paid.value)}{' '}
                              {decodeCurrency(trade.paid.currency)}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ mx: 0.5 }}>
                            ↔
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <img
                              src={getTokenImageUrl(trade.got.issuer, trade.got.currency)}
                              alt={decodeCurrency(trade.got.currency)}
                              style={{ width: 14, height: 14, borderRadius: '50%' }}
                            />
                            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                              {formatTradeValue(trade.got.value)}{' '}
                              {decodeCurrency(trade.got.currency)}
                            </Typography>
                          </Box>
                          <Typography component="span" sx={{ ml: 0.5 }}>
                            {getTradeSizeEmoji(getXRPAmount(trade))}
                            {(BOT_ADDRESSES.includes(trade.maker) ||
                              BOT_ADDRESSES.includes(trade.taker)) && (
                              <SmartToy
                                style={{
                                  color: theme.palette.warning.main,
                                  fontSize: '0.9rem',
                                  marginLeft: '2px',
                                  verticalAlign: 'middle'
                                }}
                              />
                            )}
                          </Typography>
                        </Box>
                      </>
                    }
                  />
                </Box>
              </ListItem>
            ))}
          </List>
        )}
      </Drawer>
    </TopWrapper>
  );
};

export default Topbar;
