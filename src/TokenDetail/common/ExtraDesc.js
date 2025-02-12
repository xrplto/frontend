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

  const TvlTypography = withStyles({
    root: {
      color: '#A64AEE'
    }
  })(Typography);

  return (
    <Stack spacing={1}>
      <Grid item container>
        <Grid
          item
          xs={12}
          md={3}
          sx={{
            display: { xs: 'none', md: 'block' },
            borderRight: '1px solid',
            borderRightColor: theme.palette.divider
          }}
        >
          <Stack direction="row" alignItems="center" gap={0.5} sx={{ pl: 1 }}>
            <Typography variant="body2">Market cap</Typography>
            <Tooltip
              title={
                <Typography style={{ display: 'inline-block' }} variant="body2">
                  The total market value of {name} token's circulating supply represents its overall
                  worth. This concept is similar to free-float capitalization in the stock market.
                  <br />
                  {omcf === 'yes'
                    ? 'Price x Circulating Supply'
                    : '(Price x Circulating Supply) x (Average daily trading volume / Average daily trading volume for all tokens)'}
                  .
                </Typography>
              }
              componentsProps={{
                tooltip: {
                  sx: {
                    bgcolor: 'black',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    '& .MuiTooltip-arrow': {
                      color: 'black'
                    }
                  }
                }
              }}
            >
              <Icon icon={infoFilled} width={16} height={16} />
            </Tooltip>
            {isAdmin && (
              <FormGroup sx={{ ml: 1 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={omcf === 'yes'}
                      onClick={onChangeMarketCalculation}
                      inputProps={{ 'aria-label': 'controlled' }}
                    />
                  }
                  label={<Typography variant="body2">Use original formula</Typography>}
                />
              </FormGroup>
            )}
          </Stack>
          <Stack alignItems="center">
            <MarketTypography variant="desc" sx={{ mt: 1, mb: 1 }}>
              {currencySymbols[activeFiatCurrency]}{' '}
              {convertedMarketCap >= 1000000
                ? `${(convertedMarketCap / 1000000).toFixed(1)}M`
                : convertedMarketCap >= 1000
                ? `${(convertedMarketCap / 1000).toFixed(1)}K`
                : fNumber(convertedMarketCap)}
            </MarketTypography>
          </Stack>
        </Grid>

        <Grid
          item
          xs={12}
          md={3}
          sx={{
            display: { xs: 'none', md: 'block' },
            borderRight: '1px solid',
            borderRightColor: theme.palette.divider
          }}
        >
          <Stack direction="row" alignItems="center" gap={0.5} sx={{ pl: 1 }}>
            <Typography variant="body2">TVL</Typography>
            <Tooltip
              title={
                <Typography variant="body2">
                  Total Value Locked (TVL) represents the total value of {name} tokens locked in the
                  protocol, providing a measure of the overall economic activity and security of the
                  token.
                </Typography>
              }
              componentsProps={{
                tooltip: {
                  sx: {
                    bgcolor: 'black',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    '& .MuiTooltip-arrow': {
                      color: 'black'
                    }
                  }
                }
              }}
            >
              <Icon icon={infoFilled} width={16} height={16} />
            </Tooltip>
          </Stack>
          <Stack alignItems="center">
            <TvlTypography variant="desc" sx={{ mt: 1, mb: 1 }}>
              {currencySymbols[activeFiatCurrency]}{' '}
              {token.tvl >= 1000000
                ? `${(token.tvl / 1000000).toFixed(1)}M`
                : token.tvl >= 1000
                ? `${(token.tvl / 1000).toFixed(1)}K`
                : fNumber(token.tvl)}
            </TvlTypography>
          </Stack>
        </Grid>

        <Grid
          item
          xs={12}
          md={3}
          sx={{
            display: { xs: 'none', md: 'block' },
            borderRight: '1px solid',
            borderRightColor: theme.palette.divider
          }}
        >
          <Stack direction="row" alignItems="center" gap={0.5} sx={{ pl: 1 }}>
            <Typography variant="body2">Volume (24h)</Typography>
            <Tooltip
              title={
                <Typography variant="body2">
                  Trading volume of {name} tokens within the past 24 hours.
                </Typography>
              }
              componentsProps={{
                tooltip: {
                  sx: {
                    bgcolor: 'black',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    '& .MuiTooltip-arrow': {
                      color: 'black'
                    }
                  }
                }
              }}
            >
              <Icon icon={infoFilled} width={16} height={16} />
            </Tooltip>
          </Stack>
          <Stack alignItems="center">
            <VolumeTypography variant="desc" sx={{ mt: 1, mb: 1 }}>
              <Tooltip
                title={
                  <Typography variant="body2">
                    {volume} {name}
                  </Typography>
                }
                componentsProps={{
                  tooltip: {
                    sx: {
                      bgcolor: 'black',
                      border: '1px solid rgba(255, 255, 255, 0.5)',
                      '& .MuiTooltip-arrow': {
                        color: 'black'
                      }
                    }
                  }
                }}
              >
                <span>
                  {currencySymbols[activeFiatCurrency]}{' '}
                  {convertedVolume >= 1000000
                    ? `${(convertedVolume / 1000000).toFixed(1)}M`
                    : convertedVolume >= 1000
                    ? `${(convertedVolume / 1000).toFixed(1)}K`
                    : fNumber(convertedVolume)}
                </span>
              </Tooltip>
            </VolumeTypography>
          </Stack>
        </Grid>

        <Grid item xs={12} md={3} sx={{ display: { xs: 'none', md: 'block' } }}>
          <Stack direction="row" alignItems="center" gap={0.5} sx={{ pl: 1 }}>
            <Typography variant="body2">Supply</Typography>
            <Tooltip
              title={
                <Typography variant="body2">
                  Circulating Supply: The number of {name} tokens in circulation within the market
                  and held by the public.
                  <br />
                  Total Supply: Total number of {name} tokens that have been issued, including those
                  not currently active in the market.
                </Typography>
              }
              componentsProps={{
                tooltip: {
                  sx: {
                    bgcolor: 'black',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    '& .MuiTooltip-arrow': {
                      color: 'black'
                    }
                  }
                }
              }}
            >
              <Icon icon={infoFilled} width={16} height={16} />
            </Tooltip>
          </Stack>
          <Stack alignItems="center">
            <SupplyTypography color="primary" variant="desc" sx={{ mt: 1, mb: 1 }}>
              {supply >= 1000000000000
                ? `${(supply / 1000000000000).toFixed(2)}T`
                : supply >= 1000000000
                ? `${(supply / 1000000000).toFixed(2)}B`
                : supply >= 1000000
                ? `${(supply / 1000000).toFixed(2)}M`
                : supply >= 1000
                ? `${(supply / 1000).toFixed(1)}K`
                : fNumber(supply)}{' '}
              /
              {amount >= 1000000000000
                ? `${(amount / 1000000000000).toFixed(2)}T`
                : amount >= 1000000000
                ? `${(amount / 1000000000).toFixed(2)}B`
                : amount >= 1000000
                ? `${(amount / 1000000).toFixed(2)}M`
                : amount >= 1000
                ? `${(amount / 1000).toFixed(1)}K`
                : fNumber(amount)}
            </SupplyTypography>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
