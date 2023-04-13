import React, { useState } from 'react';
import Decimal from 'decimal.js';

// Material
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
import { useSelector, useDispatch } from "react-redux";
import { selectMetrics, update_metrics } from "src/redux/statusSlice";

// Iconify Icons
import { Icon } from '@iconify/react';
import rippleSolid from '@iconify/icons-teenyicons/ripple-solid';

// Utils
import { fIntNumber, fCurrency3, fNumber, fPercent } from 'src/utils/formatNumber';

const TopWrapper = styled(Box)(({ theme }) => `
    width: 100%;
    display: flex;
    align-items: center;
    height: ${theme.spacing(3)};
    border-radius: 0px;
    border-bottom: 1px solid ${alpha('#CBCCD2', 0.2)};
`);

const ContentWrapper = styled(Box)(({ theme }) => ({
    display: "flex",
    gap: 1,
    py: 1,
    overflow: "auto",
    width: "100%",
    justifyContent: 'space-between',
    "& > *": {
        scrollSnapAlign: "center",
    },
    "::-webkit-scrollbar": { display: "none" },
}));

const H24Style = styled('div')(({ theme }) => ({
    cursor: 'pointer',
    paddingLeft: theme.spacing(0.5),
    paddingRight: theme.spacing(0.5),
    paddingTop: theme.spacing(0.07),
    paddingBottom: theme.spacing(0.07),
    // boxShadow: theme.customShadows.z20,
    // color: theme.palette.text.widget,
    backgroundColor: '#0C53B7',
    borderRadius: 8,
    transition: theme.transitions.create('opacity'),
    opacity: 1,
    '&:hover': { opacity: 1 }
}));

const Separator = styled('span')(({ theme }) => ({
    fontSize: '0.4rem'
}));

// ----------------------------------------------------------------------

function Rate(num) {
    if (num === 0)
        return 0;
    return fCurrency3(1 / num);
}

export default function Topbar() {
    const metrics = useSelector(selectMetrics);
    const dispatch = useDispatch();

    const totalAddresses = metrics.H24.totalAddresses;
    const activeAddresses = metrics.H24.activeAddresses24H;
    let percentAddress = 0;
    if (totalAddresses > 0)
        percentAddress = new Decimal(activeAddresses).mul(100).div(totalAddresses).toString();

    const [anchorEl, setAnchorEl] = useState(null);

    const [rate, setRate] = useState(metrics.USD);


    const handleClick = (event) => {
      setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
      setAnchorEl(null);
    };

    // New function to handle currency change
    const handleCurrencyChange = (currency) => {
        setCurrentCurrency(currency);
        setRate(metrics[currency]);
        handleClose();
      };
      
    const [currentCurrency, setCurrentCurrency] = useState("USD");

    

    // Modified event handlers
    const handleUSDClick = () => {
        handleCurrencyChange("USD");
    };
    
    const handleEuroClick = () => {
        handleCurrencyChange("EUR");
    };
    
    const handleJPYClick = () => {
        handleCurrencyChange("JPY");
    };
    
    

         
    return (
        <TopWrapper>
          <Container maxWidth="xl">
            <ContentWrapper>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="small">Tokens: </Typography>
                <Typography variant="small">{fIntNumber(metrics.total)}</Typography>
                <Typography variant="small" noWrap>Addresses:</Typography>
                <Typography align="center" color="#54D62C" variant="small">{fIntNumber(metrics.H24.totalAddresses)}</Typography>
                <Typography variant="small" noWrap>Offers:</Typography>
                <Typography align="center" color="#FFC107" variant="small">{fIntNumber(metrics.H24.totalOffers)}</Typography>
                <Typography variant="small" noWrap>Trustlines:</Typography>
                <Typography align="center" color="#FFA48D" variant="small">{fIntNumber(metrics.H24.totalTrustLines)}</Typography>
                <H24Style>
                  <Tooltip title="Metrics on 24 hours">
                    <Stack spacing={0} alignItems='center'>
                      <Typography align="center" style={{ wordWrap: "break-word" }} variant="small" >
                        24h
                      </Typography>
                    </Stack>
                  </Tooltip>
                </H24Style>
                <Typography variant="small">Trades:</Typography>
                <Typography align="center" color="#74CAFF" variant="small">{fIntNumber(metrics.H24.transactions24H)}</Typography>
                {/* <Typography variant="small">|</Typography> */}
                <Typography variant="small">Vol:</Typography>
                <Typography align="center" color="#FF6C40" variant="small">
                  <Stack direction="row" spacing={0.5} alignItems='center'>
                    <Icon icon={rippleSolid} color="#FF6C40"/>
                    <Typography align="center" color="#FF6C40" variant="small">
                      {fNumber(metrics.H24.tradedXRP24H)}
                    </Typography>
                  </Stack>
                </Typography>
                {/* <Typography variant="small">|</Typography> */}
                <Typography variant="small" noWrap>Tokens Traded:</Typography>
                <Typography align="center" color="#3366FF" variant="small">{fIntNumber(metrics.H24.tradedTokens24H)}</Typography>
                <Typography variant="small" noWrap>Active Addresses:</Typography>
                <Typography align="center" color="#54D62C" variant="small">{fIntNumber(metrics.H24.activeAddresses24H)}</Typography>
              </Stack>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ ml: 5, mr: 2 }}>
                {/* Currency Button */}
                <Button onClick={handleClick}>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    {/* Ripple Icon */}
                    <Icon icon={rippleSolid} width="12" height="12" />
                  </Stack>
                  {/* Currency Rate */}
                  <Typography variant="small" noWrap>
                    {currentCurrency === "USD" && "$"}
                    {currentCurrency === "EUR" && "€"}
                    {currentCurrency === "JPY" && "¥"} {Rate(rate)}
                  </Typography>
                </Button>
                    {/* Currency Menu */}
<Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
  {/* USD */}
  <MenuItem onClick={handleUSDClick}>
    <Stack direction="row" spacing={0.5} alignItems="center">
      <Icon icon={rippleSolid} width="12" height="12" />
    </Stack>
    <Typography variant="small" noWrap>$ {Rate(metrics.USD)}</Typography>
  </MenuItem>
  {/* EUR */}
  <MenuItem onClick={handleEuroClick}>
    <Stack direction="row" spacing={0.5} alignItems="center">
      <Icon icon={rippleSolid} width="12" height="12" />
    </Stack>
    <Typography variant="small" noWrap>€ {Rate(metrics.EUR)}</Typography>
  </MenuItem>
  {/* JPY */}
  <MenuItem onClick={handleJPYClick}>
    <Stack direction="row" spacing={0.5} alignItems="center">
      <Icon icon={rippleSolid} width="12" height="12" />
    </Stack>
    <Typography variant="small" noWrap>¥ {Rate(metrics.JPY)}</Typography>
  </MenuItem>
</Menu>
</Stack>
</ContentWrapper>
</Container>
</TopWrapper>
);

}

