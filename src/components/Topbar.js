import React, { useState } from 'react';
import Decimal from 'decimal.js';

// Material-UI
import {
  alpha,
  styled,
  Box,
  Container,
  Stack,
  Tooltip,
  Typography,
  Button,
  Menu,
  MenuItem
} from '@mui/material';

// Redux
import { useSelector, useDispatch } from 'react-redux';
import { selectMetrics, update_metrics } from 'src/redux/statusSlice';

// Iconify Icons
import { Icon } from '@iconify/react';
import rippleSolid from '@iconify/icons-teenyicons/ripple-solid';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Utils
import {
  fIntNumber,
  fCurrency3,
  fNumber,
  fPercent
} from 'src/utils/formatNumber';

import { useRouter } from "next/router";

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
  '& > *': {
    scrollSnapAlign: 'center'
  },
  '::-webkit-scrollbar': { display: 'none' }
}));

const H24Style = styled('div')(({ theme }) => ({
  cursor: 'pointer',
  paddingLeft: theme.spacing(0.5),
  paddingRight: theme.spacing(0.5),
  paddingTop: theme.spacing(0.07),
  paddingBottom: theme.spacing(0.07),
  backgroundColor: '#0C53B7',
  borderRadius: 8,
  transition: theme.transitions.create('opacity'),
  opacity: 1,
  '&:hover': { opacity: 1 }
}));

const Separator = styled('span')(({ theme }) => ({
  fontSize: '0.4rem'
}));

// Utility function to calculate rate
function Rate(num) {
  if (num === 0) return 0;
  return fCurrency3(1 / num);
}

const currencies = [
  { label: 'USD', value: 'USD' },
  { label: 'EUR', value: 'EUR' },
  { label: 'JPY', value: 'JPY' }
];

const Topbar = () => {
  const metrics = useSelector(selectMetrics);
  const dispatch = useDispatch();

  const totalAddresses = metrics.H24.totalAddresses;
  const activeAddresses = metrics.H24.activeAddresses24H;
  let percentAddress = 0;
  if (totalAddresses > 0)
    percentAddress = new Decimal(activeAddresses)
      .mul(100)
      .div(totalAddresses)
      .toString();

  const [anchorEl, setAnchorEl] = useState(null);
  const [rate, setRate] = useState(metrics.USD);
  const [currentCurrency, setCurrentCurrency] = useState('USD');

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleCurrencyChange = (currency) => {
    setCurrentCurrency(currency);
    setRate(metrics[currency]);
    handleClose();
  };

  const handleCurrencyClick = (currency) => () => {
    handleCurrencyChange(currency);
  };
const { darkMode } = useContext(AppContext);
const iconColor = darkMode ? '#FFFFFF' : '#000000';
const iconStyle = {
  marginRight: '5px', // Adjust the value as needed
};

const router = useRouter();
  return (
    <TopWrapper>
      <Container maxWidth="xl">
        <ContentWrapper>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2">
              {/* Tokens: */}
              {router.locale === 'en' ? 'Tokens:' : router.locale === 'es' ? 'Fichas:' : 'Tokens:'}
              </Typography>
            <Typography variant="body2">{fIntNumber(metrics.total)}</Typography>
            <Typography variant="body2" noWrap>
              {/* Addresses: */}
              {router.locale === 'en' ? 'Addresses:' : router.locale === 'es' ? 'Direcciones:' : 'Addresses:'}
            </Typography>
            <Typography align="center" color="#54D62C" variant="body2">
              {fIntNumber(metrics.H24.totalAddresses)}
            </Typography>
            <Typography variant="body2" noWrap>
              {/* Offers: */}
              {router.locale === 'en' ? 'Offers:' : router.locale === 'es' ? 'Ofertas:' : 'Offers:'}
            </Typography>
            <Typography align="center" color="#FFC107" variant="body2">
              {fIntNumber(metrics.H24.totalOffers)}
            </Typography>
            <Typography variant="body2" noWrap>
              {/* Trustlines: */}
              {router.locale === 'en' ? 'Trustlines:' : router.locale === 'es' ? 'Líneas de confianza:' : 'Trustlines:'}
            </Typography>
            <Typography align="center" color="#FFA48D" variant="body2">
              {fIntNumber(metrics.H24.totalTrustLines)}
            </Typography>
            <H24Style>
              <Tooltip title="Metrics on 24 hours">
                <Stack spacing={0} alignItems="center">
                  <Typography
                    align="center"
                    style={{ wordWrap: 'break-word' }}
                    variant="body2"
                    >
                    24h
                  </Typography>
                </Stack>
              </Tooltip>
            </H24Style>
            <Typography variant="body2">
              {/* Trades: */}
              {router.locale === 'en' ? 'Trades:' : router.locale === 'es' ? 'Vientos_alisios:' : 'Trades:'}
              </Typography>
            <Typography align="center" color="#74CAFF" variant="body2">
              {fIntNumber(metrics.H24.transactions24H)}
            </Typography>
            <Typography variant="body2">
              {/* Vol: */}
              {router.locale === 'en' ? 'Vol:' : router.locale === 'es' ? 'volumen:' : 'Vol:'}
              </Typography>
            <Typography align="center" color="#FF6C40" variant="body2">
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Icon icon={rippleSolid} color="#FF6C40" />
                <Typography align="center" color="#FF6C40" variant="body2">
                  {fNumber(metrics.H24.tradedXRP24H)}
                </Typography>
              </Stack>
            </Typography>
            <Typography variant="body2" noWrap>
              {/* Tokens Traded: */}
              {router.locale === 'en' ? 'Tokens Traded:' : router.locale === 'es' ? 'Tokens negociados:' : 'Tokens Traded:'}
            </Typography>
            <Typography align="center" color="#3366FF" variant="body2">
              {fIntNumber(metrics.H24.tradedTokens24H)}
            </Typography>
            <Typography variant="body2" noWrap>
              {/* Active Addresses: */}
              {router.locale === 'en' ? 'Active Addresses:' : router.locale === 'es' ? 'Direcciones activas:' : 'Active Addresses:'}
            </Typography>
            <Typography align="center" color="#54D62C" variant="body2">
              {fIntNumber(metrics.H24.activeAddresses24H)}
            </Typography>
          </Stack>
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{ ml: 5, mr: 2 }}
          >
            <Button onClick={handleClick}>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Icon icon={rippleSolid} width="12" height="12"  color={iconColor} style={iconStyle} />
              </Stack>
              <Typography variant="body2" noWrap>
                 {Rate(rate)} {currentCurrency}
              </Typography>
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              {currencies.map((currency) => (
                <MenuItem
                  key={currency.value}
                  onClick={handleCurrencyClick(currency.value)}
                >
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Icon icon={rippleSolid} width="12" height="12"  style={iconStyle}/>
                  </Stack>
                  <Typography variant="body2" noWrap>
                     {Rate(metrics[currency.value])} {currency.label}
                  </Typography>
                </MenuItem>
              ))}
            </Menu>
          </Stack>
        </ContentWrapper>
      </Container>
    </TopWrapper>
  );
};

export default Topbar;
