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

import { useDispatch, useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';
import { useTranslation } from 'react-i18next';
import { AppContext } from 'src/AppContext';
import { fIntNumber, fNumber } from 'src/utils/formatNumber';
import CurrencySwithcer from './CurrencySwitcher';
import ThemeSwitcher from './ThemeSwitcher';
import { currencySymbols } from 'src/utils/constants';
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
  fontSize: '14px', // Adjust font size as needed
  color: theme.palette.text.primary, // Adjust color as needed
  textDecoration: 'none',
  marginLeft: theme.spacing(2),
  backgroundColor: alpha(theme.palette.primary.main, 0.3),
  padding: '5px 10px',
  borderRadius: '5px',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.2),
    textDecoration: 'none',
    cursor: 'pointer'
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
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.2)
  }
}));

// Create a fetcher function for useSWR
const fetcher = (url) => axios.get(url).then((res) => res.data);

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
      ? 'http://37.27.134.126/api/history?md5=84e5efeb89c4eae8f68188982dc290d8&page=0&limit=10'
      : null,
    fetcher
  );
  const [filter, setFilter] = useState('All');

  const mobileMetrics = [
    {
      label: 'Tokens',
      value: fIntNumber(metrics.total),
      color: 'inherit'
    },
    {
      label: 'Addresses',
      value: fIntNumber(metrics.H24.totalAddresses),
      color: '#54D62C'
    },
    {
      label: 'Offers',
      value: fIntNumber(metrics.H24.totalOffers),
      color: '#FFC107'
    },
    {
      label: 'Trustlines',
      value: fIntNumber(metrics.H24.totalTrustLines),
      color: '#FFA48D'
    },
    {
      label: 'Trades',
      value: fIntNumber(metrics.H24.transactions24H),
      color: '#74CAFF'
    },
    {
      label: 'Vol',
      value: `${currencySymbols[activeFiatCurrency]}${fNumber(
        Decimal.div(metrics.H24.tradedXRP24H, metrics[activeFiatCurrency]).toNumber()
      )}`,
      color: theme.palette.error.main
    },
    {
      label: 'Tokens Traded',
      value: fIntNumber(metrics.H24.tradedTokens24H),
      color: '#3366FF'
    },
    {
      label: 'Active Addresses',
      value: fIntNumber(metrics.H24.activeAddresses24H),
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

  const filterTrades = (trades) => {
    if (!trades?.hists) return [];

    const filters = {
      All: () => true,
      '250+ XRP': (trade) => trade.paid.currency === 'XRP' && parseFloat(trade.paid.value) >= 250,
      '1250+ XRP': (trade) => trade.paid.currency === 'XRP' && parseFloat(trade.paid.value) >= 1250,
      '2500+ XRP': (trade) => trade.paid.currency === 'XRP' && parseFloat(trade.paid.value) >= 2500,
      '5000+ XRP': (trade) => trade.paid.currency === 'XRP' && parseFloat(trade.paid.value) >= 5000,
      '10000+ XRP': (trade) =>
        trade.paid.currency === 'XRP' && parseFloat(trade.paid.value) >= 10000
    };

    return trades.hists.filter(filters[filter]);
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
              <Typography variant="body2">{fIntNumber(metrics.total)}</Typography>
              <Typography variant="body2" noWrap color="#a1a7bb" sx={{ fontWeight: 500 }}>
                {t('Addresses')}:
              </Typography>
              <Typography align="center" color="#54D62C" variant="body2">
                {fIntNumber(metrics.H24.totalAddresses)}
              </Typography>
              <Typography variant="body2" noWrap color="#a1a7bb" sx={{ fontWeight: 500 }}>
                {t('Offers')}:
              </Typography>
              <Typography align="center" color="#FFC107" variant="body2">
                {fIntNumber(metrics.H24.totalOffers)}
              </Typography>
              <Typography variant="body2" noWrap color="#a1a7bb" sx={{ fontWeight: 500 }}>
                {t('Trustlines')}:
              </Typography>
              <Typography align="center" color="#FFA48D" variant="body2">
                {fIntNumber(metrics.H24.totalTrustLines)}
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
                {fIntNumber(metrics.H24.transactions24H)}
              </Typography>
              <Typography variant="body2" color="#a1a7bb" sx={{ fontWeight: 500 }}>
                {t('Vol')}:
              </Typography>
              <Typography align="center" variant="body2">
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Typography>{currencySymbols[activeFiatCurrency]}</Typography>
                  <Typography align="center" color={theme.palette.error.main} variant="body2">
                    {fNumber(
                      Decimal.div(metrics.H24.tradedXRP24H, metrics[activeFiatCurrency]).toNumber()
                    )}
                  </Typography>
                </Stack>
              </Typography>
              <Typography variant="body2" noWrap color="#a1a7bb" sx={{ fontWeight: 500 }}>
                {t('Tokens Traded')}:
              </Typography>
              <Typography align="center" color="#3366FF" variant="body2">
                {fIntNumber(metrics.H24.tradedTokens24H)}
              </Typography>
              <Typography variant="body2" noWrap color="#a1a7bb" sx={{ fontWeight: 500 }}>
                {t('Active Addresses')}:
              </Typography>
              <Typography align="center" color="#54D62C" variant="body2">
                {fIntNumber(metrics.H24.activeAddresses24H)}
              </Typography>
            </Stack>
          )}
          {!isMobile && (
            <Box sx={{ paddingLeft: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CurrencySwithcer />
              <ThemeSwitcher />
              <Separator>|</Separator> {/* Add separator */}
              {/* <APILabel onClick={() => dispatch(toggleChatOpen())}>Chatbox</APILabel> */}
              <APILabel href="/api-docs" target="_blank" rel="noopener noreferrer">
                API
              </APILabel>{' '}
              {/* Add API label with new window */}
              {!fullSearch && isDesktop && <Wallet style={{ marginRight: '9px' }} />}
              <TradeButton onClick={handleTradeDrawerOpen} title="Global Trades">
                <Typography variant="body2">Global Trades</Typography>
              </TradeButton>
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
            padding: theme.spacing(2)
          }
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Global Trades</Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              displayEmpty
              inputProps={{ 'aria-label': 'Filter trades' }}
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="250+ XRP">250+ XRP</MenuItem>
              <MenuItem value="1250+ XRP">1250+ XRP</MenuItem>
              <MenuItem value="2500+ XRP">2500+ XRP</MenuItem>
              <MenuItem value="5000+ XRP">5000+ XRP</MenuItem>
              <MenuItem value="10000+ XRP">10000+ XRP</MenuItem>
            </Select>
          </FormControl>
        </Box>
        {error ? (
          <Box>
            <Typography color="error">Failed to load trades</Typography>
            <Typography variant="body2" color="textSecondary">
              Error: {error.message}
            </Typography>
          </Box>
        ) : !trades ? (
          <Box display="flex" justifyContent="center" mt={2}>
            <CircularProgress />
          </Box>
        ) : (
          <List>
            {filterTrades(trades).map((trade, index) => (
              <ListItem key={index} sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                <ListItemText
                  primary={`${trade.paid.value} ${trade.paid.currency} ↔ ${trade.got.value} ${trade.got.currency}`}
                  secondary={
                    <>
                      <Typography variant="body2">
                        {new Date(trade.time).toLocaleString()}
                      </Typography>
                      <Typography variant="caption">Maker: {trade.maker}</Typography>
                      <Typography variant="caption">Taker: {trade.taker}</Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Drawer>
    </TopWrapper>
  );
};

export default Topbar;
