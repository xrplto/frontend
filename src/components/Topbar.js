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

const H24Style = styled('div')(({ theme }) => ({
  cursor: 'pointer',
  paddingLeft: theme.spacing(0.5),
  paddingRight: theme.spacing(0.5),
  paddingTop: theme.spacing(0.07),
  paddingBottom: theme.spacing(0.07),
  backgroundColor: darkMode ? 'green !important  ' : 'blue !important',
  borderRadius: 8,
  transition: theme.transitions.create('opacity'),
  opacity: 1,
  '&:hover': { opacity: 1 }
}));
  return (
    <TopWrapper>
      <Container maxWidth="xl">
        <ContentWrapper>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2">Tokens:</Typography>
            <Typography variant="body2">{fIntNumber(metrics.total)}</Typography>
            <Typography variant="body2" noWrap>
              Addresses:
            </Typography>
            <Typography align="center" color="#54D62C" variant="body2">
              {fIntNumber(metrics.H24.totalAddresses)}
            </Typography>
            <Typography variant="body2" noWrap>
              Offers:
            </Typography>
            <Typography align="center" color="#FFC107" variant="body2">
              {fIntNumber(metrics.H24.totalOffers)}
            </Typography>
            <Typography variant="body2" noWrap>
              Trustlines:
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
                    color="#FFF"
                  >
                    24h
                  </Typography>
                </Stack>
              </Tooltip>
            </H24Style>
            <Typography variant="body2">Trades:</Typography>
            <Typography align="center" color="#74CAFF" variant="body2">
              {fIntNumber(metrics.H24.transactions24H)}
            </Typography>
            <Typography variant="body2">Vol:</Typography>
            <Typography align="center" color="#FF6C40" variant="body2">
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Icon icon={rippleSolid} color="#FF6C40" />
                <Typography align="center" color="#FF6C40" variant="body2">
                  {fNumber(metrics.H24.tradedXRP24H)}
                </Typography>
              </Stack>
            </Typography>
            <Typography variant="body2" noWrap>
              Tokens Traded:
            </Typography>
            <Typography align="center" color="#3366FF" variant="body2">
              {fIntNumber(metrics.H24.tradedTokens24H)}
            </Typography>
            <Typography variant="body2" noWrap>
              Active Addresses:
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
