import React, { useState, useContext } from 'react';
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
  useMediaQuery
} from '@mui/material';
import { Icon } from '@iconify/react';
import rippleSolid from '@iconify/icons-teenyicons/ripple-solid';
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';
import { useTranslation } from 'react-i18next';
import { AppContext } from 'src/AppContext';
import {
  fIntNumber,
  fNumber
} from 'src/utils/formatNumber';
import CurrencySwithcer from './CurrencySwitcher';
import ThemeSwitcher from './ThemeSwitcher';

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
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  padding: '5px 10px',
  borderRadius: '5px',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.2),
    textDecoration: 'underline'
  }
}));

const Topbar = () => {
  const { t } = useTranslation();
  const metrics = useSelector(selectMetrics);
  const totalAddresses = metrics.H24.totalAddresses;
  const activeAddresses = metrics.H24.activeAddresses24H;
  let percentAddress = 0;
  if (totalAddresses > 0)
    percentAddress = new Decimal(activeAddresses)
      .mul(100)
      .div(totalAddresses)
      .toString();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { darkMode } = useContext(AppContext);
  const iconColor = darkMode ? '#FFFFFF' : '#000000';

  const H24Style = styled('div')(({ theme }) => ({
    cursor: 'pointer',
    paddingLeft: theme.spacing(0.5),
    paddingRight: theme.spacing(0.5),
    paddingTop: theme.spacing(0.07),
    paddingBottom: theme.spacing(0.07),
    backgroundColor: darkMode ? '#007B55 !important' : '#5569ff !important',
    borderRadius: 8,
    transition: theme.transitions.create('opacity'),
    opacity: 1,
    '&:hover': { opacity: 1 }
  }));

  return (
    <TopWrapper>
      <Container maxWidth={false}>
        <ContentWrapper>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
            <Typography
              variant="body2"
              color="#a1a7bb"
              sx={{ fontWeight: 500 }}
            >
              {t('Tokens')}:
            </Typography>
            <Typography variant="body2">{fIntNumber(metrics.total)}</Typography>
            <Typography
              variant="body2"
              noWrap
              color="#a1a7bb"
              sx={{ fontWeight: 500 }}
            >
              {t('Addresses')}:
            </Typography>
            <Typography align="center" color="#54D62C" variant="body2">
              {fIntNumber(metrics.H24.totalAddresses)}</Typography>
            <Typography
              variant="body2"
              noWrap
              color="#a1a7bb"
              sx={{ fontWeight: 500 }}
            >
              {t('Offers')}:
            </Typography>
            <Typography align="center" color="#FFC107" variant="body2">
              {fIntNumber(metrics.H24.totalOffers)}</Typography>
            <Typography
              variant="body2"
              noWrap
              color="#a1a7bb"
              sx={{ fontWeight: 500 }}
            >
              {t('Trustlines')}:
            </Typography>
            <Typography align="center" color="#FFA48D" variant="body2">
              {fIntNumber(metrics.H24.totalTrustLines)}</Typography>
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
            <Typography
              variant="body2"
              color="#a1a7bb"
              sx={{ fontWeight: 500 }}
            >
              {t('Trades')}:
            </Typography>
            <Typography align="center" color="#74CAFF" variant="body2">
              {fIntNumber(metrics.H24.transactions24H)}</Typography>
            <Typography
              variant="body2"
              color="#a1a7bb"
              sx={{ fontWeight: 500 }}
            >
              {t('Vol')}:
            </Typography>
            <Typography align="center" color="#FF6C40" variant="body2">
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Icon icon={rippleSolid} color={iconColor} />
                <Typography align="center" color="#FF6C40" variant="body2">
                  {fNumber(metrics.H24.tradedXRP24H)}
                </Typography>
              </Stack>
            </Typography>
            <Typography
              variant="body2"
              noWrap
              color="#a1a7bb"
              sx={{ fontWeight: 500 }}
            >
              {t('Tokens Traded')}:
            </Typography>
            <Typography align="center" color="#3366FF" variant="body2">
              {fIntNumber(metrics.H24.tradedTokens24H)}</Typography>
            <Typography
              variant="body2"
              noWrap
              color="#a1a7bb"
              sx={{ fontWeight: 500 }}
            >
              {t('Active Addresses')}:
            </Typography>
            <Typography align="center" color="#54D62C" variant="body2">
              {fIntNumber(metrics.H24.activeAddresses24H)}</Typography>
          </Stack>
          {!isMobile && (
            <Box sx={{ paddingLeft: 2, display: 'flex', alignItems: 'center' }}>
              <CurrencySwithcer />
              <ThemeSwitcher />
              <Separator>|</Separator> {/* Add separator */}
              <APILabel href="https://docs.xrpl.to" target="_blank" rel="noopener noreferrer">API</APILabel> {/* Add API label with new window */}
            </Box>
          )}
        </ContentWrapper>
      </Container>
    </TopWrapper>
  );
};

export default Topbar;
