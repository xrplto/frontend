import axios from 'axios';
import Decimal from 'decimal.js';
import { useState, useEffect, useContext } from 'react';

// Material
import { withStyles } from '@mui/styles';
import {
  useTheme,
  Checkbox,
  Divider,
  FormControlLabel,
  FormGroup,
  Grid,
  Stack,
  Tooltip,
  Typography
} from '@mui/material';

// Iconify
import { Icon } from '@iconify/react';
import infoFilled from '@iconify/icons-ep/info-filled';

// Context
import { AppContext } from 'src/AppContext';

// Utils
import { fNumber } from 'src/utils/formatNumber';

// Redux
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';

import NumberTooltip from 'src/components/NumberTooltip';
import { currencySymbols } from 'src/utils/constants';

// ----------------------------------------------------------------------

export default function ExtraDesc({ token }) {
  const BASE_URL = process.env.API_URL;
  const theme = useTheme();
  const metrics = useSelector(selectMetrics);

  const { accountProfile, setLoading, openSnackbar, activeFiatCurrency } = useContext(AppContext);
  const isAdmin = accountProfile && accountProfile.account && accountProfile.admin;

  const {
    md5,
    name,
    amount,
    supply,
    exch,
    vol24h,
    marketcap,
    vol24htx,
    vol24hx,
    vol24hxrp,
    holders,
    offers,
    id,
    issuer,
    currency,
    date,
    trustlines
  } = token;

  const [omcf, setOMCF] = useState(token.isOMCF || 'no'); // is Old Market Cap Formula

  let user = token.user;
  if (!user) user = name;

  const circulatingSupply = fNumber(supply);
  const totalSupply = fNumber(amount);
  const volume = fNumber(vol24hx);
  const voldivmarket = marketcap > 0 ? Decimal.div(vol24hxrp, marketcap).toNumber() : 0; // .toFixed(5, Decimal.ROUND_DOWN)
  const convertedMarketCap = Decimal.div(marketcap, metrics[activeFiatCurrency]).toNumber(); // .toFixed(5, Decimal.ROUND_DOWN)
  const convertedVolume = Decimal.div(vol24hxrp, metrics[activeFiatCurrency]).toNumber(); // .toFixed(5, Decimal.ROUND_DOWN)

  const onChangeMarketCalculation = async () => {
    setLoading(true);
    try {
      const accountAdmin = accountProfile.account;
      const accountToken = accountProfile.token;

      const body = { md5 };

      const res = await axios.post(`${BASE_URL}/admin/toggle_marketcap_formula`, body, {
        headers: { 'x-access-account': accountAdmin, 'x-access-token': accountToken }
      });

      if (res.status === 200) {
        const ret = res.data;
        if (ret.status) {
          setOMCF(ret.isOMCF);
          openSnackbar('Successful!', 'success');
        } else {
          const err = ret.err;
          openSnackbar(err, 'error');
        }
      }
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  const MarketTypography = withStyles({
    root: {
      color: '#2CD9C5'
    }
  })(Typography);

  const VolumeTypography = withStyles({
    root: {
      color: theme.palette.error.main
    }
  })(Typography);

  const SupplyTypography = withStyles({
    root: {
      color: '#3366FF'
    }
  })(Typography);

  const TotalSupplyTypography = withStyles({
    root: {
      color: theme.palette.warning.main
    }
  })(Typography);

  return (
    <Stack spacing={1}>
      <Grid container spacing={0.5}>
        <Grid
          item
          xs={12}
          md={4}
          sx={{
            display: { xs: 'none', md: 'block' },
            borderRight: '1px solid',
            borderRightColor: theme.palette.divider,
            p: 2
          }}
        >
          <Stack spacing={2}>
            <Stack>
              <Stack direction="row" alignItems="center" gap={1}>
                <Typography variant="body2" color="text.secondary">
                  Market cap
                </Typography>
                <Tooltip
                  title={
                    <Typography style={{ display: 'inline-block' }} variant="body2">
                      The total market value of {name} token's circulating supply represents its
                      overall worth. This concept is similar to free-float capitalization in the
                      stock market.
                      <br />
                      <br />
                      {omcf === 'yes'
                        ? 'Price x Circulating Supply'
                        : '(Price x Circulating Supply) x (Average daily trading volume / Average daily trading volume for all tokens)'}
                      .
                    </Typography>
                  }
                >
                  <Icon
                    icon={infoFilled}
                    width={16}
                    style={{ color: theme.palette.text.secondary }}
                  />
                </Tooltip>
                {isAdmin && (
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={omcf === 'yes'}
                          onClick={onChangeMarketCalculation}
                          inputProps={{ 'aria-label': 'controlled' }}
                        />
                      }
                      label={<Typography variant="caption">Use original formula</Typography>}
                    />
                  </FormGroup>
                )}
              </Stack>
              <MarketTypography variant="h6" sx={{ mt: 0.5 }}>
                {currencySymbols[activeFiatCurrency]} {fNumber(convertedMarketCap)}
              </MarketTypography>
            </Stack>

            <Stack>
              <Stack direction="row" alignItems="center" gap={1}>
                <Typography variant="body2" color="text.secondary">
                  Volume / Marketcap
                </Typography>
                <Tooltip
                  title={
                    <Typography variant="body2">
                      This metric represents the ratio of trading volume within the past 24 hours to
                      the market capitalization of {name} token. It provides insights into the
                      token's liquidity and trading activity relative to its overall market value.
                    </Typography>
                  }
                >
                  <Icon
                    icon={infoFilled}
                    width={16}
                    style={{ color: theme.palette.text.secondary }}
                  />
                </Tooltip>
              </Stack>
              <VolumeTypography variant="h6" sx={{ mt: 0.5 }}>
                {fNumber(voldivmarket)}
              </VolumeTypography>
            </Stack>
          </Stack>
        </Grid>

        <Grid
          item
          xs={12}
          md={4}
          sx={{
            display: { xs: 'none', md: 'block' },
            borderRight: '1px solid',
            borderRightColor: theme.palette.divider,
            p: 2
          }}
        >
          <Stack spacing={2}>
            <Stack>
              <Stack direction="row" alignItems="center" gap={1}>
                <Typography variant="body2" color="text.secondary">
                  Volume (24h)
                </Typography>
                <Tooltip
                  title={
                    <Typography variant="body2">
                      Trading volume of {name} tokens within the past 24 hours.
                    </Typography>
                  }
                >
                  <Icon
                    icon={infoFilled}
                    width={16}
                    style={{ color: theme.palette.text.secondary }}
                  />
                </Tooltip>
              </Stack>
              <VolumeTypography variant="h6" sx={{ mt: 0.5 }}>
                {currencySymbols[activeFiatCurrency]} {fNumber(convertedVolume)}
              </VolumeTypography>
              <VolumeTypography variant="body2" sx={{ mt: 0.5 }}>
                <NumberTooltip number={volume} /> {name}
              </VolumeTypography>
            </Stack>
          </Stack>
        </Grid>

        <Grid
          item
          xs={12}
          md={4}
          sx={{
            display: { xs: 'none', md: 'block' },
            p: 2
          }}
        >
          <Stack spacing={2}>
            <Stack>
              <Stack direction="row" alignItems="center" gap={1}>
                <Typography variant="body2" color="text.secondary">
                  Circulating Supply
                </Typography>
                <Tooltip
                  title={
                    <Typography variant="body2">
                      The number of {name} tokens in circulation within the market and held by the
                      public is comparable to the concept of outstanding shares in the stock market.
                    </Typography>
                  }
                >
                  <Icon
                    icon={infoFilled}
                    width={16}
                    style={{ color: theme.palette.text.secondary }}
                  />
                </Tooltip>
              </Stack>
              <SupplyTypography variant="h6" sx={{ mt: 0.5 }}>
                {circulatingSupply}
              </SupplyTypography>
            </Stack>

            <Stack>
              <Stack direction="row" alignItems="center" gap={1}>
                <Typography variant="body2" color="text.secondary">
                  Total Supply
                </Typography>
                <Tooltip
                  title={
                    <Typography variant="body2">
                      Total number of {name} tokens that have been issued. This includes tokens that
                      are in circulation as well as those that are not currently active in the
                      market.
                    </Typography>
                  }
                >
                  <Icon
                    icon={infoFilled}
                    width={16}
                    style={{ color: theme.palette.text.secondary }}
                  />
                </Tooltip>
              </Stack>
              <TotalSupplyTypography variant="h6" sx={{ mt: 0.5 }}>
                {totalSupply}
              </TotalSupplyTypography>
            </Stack>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
