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
  Typography,
  Box
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
import { alpha } from '@mui/material/styles';

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
  const voldivmarket = marketcap > 0 ? Decimal.div(vol24hxrp || 0, marketcap).toNumber() : 0; // .toFixed(5, Decimal.ROUND_DOWN)
  const convertedMarketCap =
    marketcap && metrics[activeFiatCurrency]
      ? Decimal.div(marketcap, metrics[activeFiatCurrency]).toNumber()
      : 0; // .toFixed(5, Decimal.ROUND_DOWN)
  const convertedVolume =
    vol24hxrp && metrics[activeFiatCurrency]
      ? Decimal.div(vol24hxrp, metrics[activeFiatCurrency]).toNumber()
      : 0; // .toFixed(5, Decimal.ROUND_DOWN)

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

  return (
    <Box
      sx={{
        p: { xs: 1.5, sm: 2 },
        borderRadius: '12px',
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.background.paper,
          0.8
        )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
        boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.04)}`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: `linear-gradient(90deg, ${alpha(theme.palette.success.main, 0.6)}, ${alpha(
            theme.palette.primary.main,
            0.6
          )}, ${alpha(theme.palette.info.main, 0.6)})`,
          opacity: 0.8
        }
      }}
    >
      <Grid container spacing={2}>
        {/* Market Cap */}
        <Grid item xs={12} md={3}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: '8px',
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.success.main,
                0.08
              )} 0%, ${alpha(theme.palette.success.main, 0.04)} 100%)`,
              backdropFilter: 'blur(8px)',
              border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`,
              boxShadow: `0 2px 8px ${alpha(theme.palette.success.main, 0.1)}`,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <Stack direction="row" alignItems="center" gap={0.5} sx={{ mb: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.75rem',
                  color: alpha(theme.palette.text.secondary, 0.9),
                  fontWeight: 500
                }}
              >
                Market Cap
              </Typography>
              <Tooltip
                title={
                  <Typography style={{ display: 'inline-block' }} variant="body2">
                    The total market value of {name} token's circulating supply represents its
                    overall worth. This concept is similar to free-float capitalization in the stock
                    market.
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
                      background: `linear-gradient(135deg, ${alpha(
                        theme.palette.background.paper,
                        0.95
                      )} 0%, ${alpha(theme.palette.background.paper, 0.85)} 100%)`,
                      backdropFilter: 'blur(20px)',
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      borderRadius: '8px',
                      boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.15)}`,
                      '& .MuiTooltip-arrow': {
                        color: alpha(theme.palette.background.paper, 0.9)
                      }
                    }
                  }
                }}
              >
                <Icon
                  icon={infoFilled}
                  width={12}
                  height={12}
                  style={{ color: theme.palette.success.main }}
                />
              </Tooltip>
              {isAdmin && (
                <FormGroup sx={{ ml: 0.5 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={omcf === 'yes'}
                        onClick={onChangeMarketCalculation}
                        inputProps={{ 'aria-label': 'controlled' }}
                        sx={{
                          p: 0.25,
                          color: theme.palette.success.main,
                          '&.Mui-checked': {
                            color: theme.palette.success.main
                          }
                        }}
                      />
                    }
                    label={
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '0.7rem',
                          color: alpha(theme.palette.text.secondary, 0.8)
                        }}
                      >
                        Use original formula
                      </Typography>
                    }
                  />
                </FormGroup>
              )}
            </Stack>
            <Typography
              variant="h6"
              sx={{
                fontSize: '1.1rem',
                fontWeight: 700,
                background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${alpha(
                  theme.palette.success.main,
                  0.8
                )} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '0.02em',
                textAlign: 'center'
              }}
            >
              {currencySymbols[activeFiatCurrency]}{' '}
              {convertedMarketCap >= 1000000
                ? `${(convertedMarketCap / 1000000).toFixed(1)}M`
                : convertedMarketCap >= 1000
                ? `${(convertedMarketCap / 1000).toFixed(1)}K`
                : fNumber(convertedMarketCap)}
            </Typography>
          </Box>
        </Grid>

        {/* TVL */}
        <Grid item xs={12} md={3}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: '8px',
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.secondary.main,
                0.08
              )} 0%, ${alpha(theme.palette.secondary.main, 0.04)} 100%)`,
              backdropFilter: 'blur(8px)',
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
              boxShadow: `0 2px 8px ${alpha(theme.palette.secondary.main, 0.1)}`,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <Stack direction="row" alignItems="center" gap={0.5} sx={{ mb: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.75rem',
                  color: alpha(theme.palette.text.secondary, 0.9),
                  fontWeight: 500
                }}
              >
                TVL
              </Typography>
              <Tooltip
                title={
                  <Typography variant="body2">
                    Total Value Locked (TVL) represents the total value of {name} tokens locked in
                    the protocol, providing a measure of the overall economic activity and security
                    of the token.
                  </Typography>
                }
                componentsProps={{
                  tooltip: {
                    sx: {
                      background: `linear-gradient(135deg, ${alpha(
                        theme.palette.background.paper,
                        0.95
                      )} 0%, ${alpha(theme.palette.background.paper, 0.85)} 100%)`,
                      backdropFilter: 'blur(20px)',
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      borderRadius: '8px',
                      boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.15)}`,
                      '& .MuiTooltip-arrow': {
                        color: alpha(theme.palette.background.paper, 0.9)
                      }
                    }
                  }
                }}
              >
                <Icon
                  icon={infoFilled}
                  width={12}
                  height={12}
                  style={{ color: theme.palette.secondary.main }}
                />
              </Tooltip>
            </Stack>
            <Typography
              variant="h6"
              sx={{
                fontSize: '1.1rem',
                fontWeight: 700,
                background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${alpha(
                  theme.palette.secondary.main,
                  0.8
                )} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '0.02em',
                textAlign: 'center'
              }}
            >
              {currencySymbols[activeFiatCurrency]}{' '}
              {token.tvl >= 1000000
                ? `${(token.tvl / 1000000).toFixed(1)}M`
                : token.tvl >= 1000
                ? `${(token.tvl / 1000).toFixed(1)}K`
                : fNumber(token.tvl)}
            </Typography>
          </Box>
        </Grid>

        {/* Volume (24h) */}
        <Grid item xs={12} md={3}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: '8px',
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.error.main,
                0.08
              )} 0%, ${alpha(theme.palette.error.main, 0.04)} 100%)`,
              backdropFilter: 'blur(8px)',
              border: `1px solid ${alpha(theme.palette.error.main, 0.15)}`,
              boxShadow: `0 2px 8px ${alpha(theme.palette.error.main, 0.1)}`,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <Stack direction="row" alignItems="center" gap={0.5} sx={{ mb: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.75rem',
                  color: alpha(theme.palette.text.secondary, 0.9),
                  fontWeight: 500
                }}
              >
                Volume (24h)
              </Typography>
              <Tooltip
                title={
                  <Typography variant="body2">
                    Trading volume of {name} tokens within the past 24 hours.
                  </Typography>
                }
                componentsProps={{
                  tooltip: {
                    sx: {
                      background: `linear-gradient(135deg, ${alpha(
                        theme.palette.background.paper,
                        0.95
                      )} 0%, ${alpha(theme.palette.background.paper, 0.85)} 100%)`,
                      backdropFilter: 'blur(20px)',
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      borderRadius: '8px',
                      boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.15)}`,
                      '& .MuiTooltip-arrow': {
                        color: alpha(theme.palette.background.paper, 0.9)
                      }
                    }
                  }
                }}
              >
                <Icon
                  icon={infoFilled}
                  width={12}
                  height={12}
                  style={{ color: theme.palette.error.main }}
                />
              </Tooltip>
            </Stack>
            <Tooltip
              title={
                <Typography variant="body2">
                  {volume} {name}
                </Typography>
              }
              componentsProps={{
                tooltip: {
                  sx: {
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.background.paper,
                      0.95
                    )} 0%, ${alpha(theme.palette.background.paper, 0.85)} 100%)`,
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    borderRadius: '8px',
                    boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.15)}`,
                    '& .MuiTooltip-arrow': {
                      color: alpha(theme.palette.background.paper, 0.9)
                    }
                  }
                }
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${alpha(
                    theme.palette.error.main,
                    0.8
                  )} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '0.02em',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
              >
                {currencySymbols[activeFiatCurrency]}{' '}
                {convertedVolume >= 1000000
                  ? `${(convertedVolume / 1000000).toFixed(1)}M`
                  : convertedVolume >= 1000
                  ? `${(convertedVolume / 1000).toFixed(1)}K`
                  : fNumber(convertedVolume)}
              </Typography>
            </Tooltip>
          </Box>
        </Grid>

        {/* Supply */}
        <Grid item xs={12} md={3}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: '8px',
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.primary.main,
                0.08
              )} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
              backdropFilter: 'blur(8px)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
              boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.1)}`,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <Stack direction="row" alignItems="center" gap={0.5} sx={{ mb: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.75rem',
                  color: alpha(theme.palette.text.secondary, 0.9),
                  fontWeight: 500
                }}
              >
                Supply
              </Typography>
              <Tooltip
                title={
                  <Typography variant="body2">
                    Circulating Supply: The number of {name} tokens in circulation within the market
                    and held by the public.
                    <br />
                    Total Supply: Total number of {name} tokens that have been issued, including
                    those not currently active in the market.
                  </Typography>
                }
                componentsProps={{
                  tooltip: {
                    sx: {
                      background: `linear-gradient(135deg, ${alpha(
                        theme.palette.background.paper,
                        0.95
                      )} 0%, ${alpha(theme.palette.background.paper, 0.85)} 100%)`,
                      backdropFilter: 'blur(20px)',
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      borderRadius: '8px',
                      boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.15)}`,
                      '& .MuiTooltip-arrow': {
                        color: alpha(theme.palette.background.paper, 0.9)
                      }
                    }
                  }
                }}
              >
                <Icon
                  icon={infoFilled}
                  width={12}
                  height={12}
                  style={{ color: theme.palette.primary.main }}
                />
              </Tooltip>
            </Stack>
            <Typography
              variant="h6"
              sx={{
                fontSize: '1.1rem',
                fontWeight: 700,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${alpha(
                  theme.palette.primary.main,
                  0.8
                )} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '0.02em',
                textAlign: 'center'
              }}
            >
              {supply >= 1000000000000
                ? `${(supply / 1000000000000).toFixed(2)}T`
                : supply >= 1000000000
                ? `${(supply / 1000000000).toFixed(2)}B`
                : supply >= 1000000
                ? `${(supply / 1000000).toFixed(2)}M`
                : supply >= 1000
                ? `${(supply / 1000).toFixed(1)}K`
                : fNumber(supply)}{' '}
              /{' '}
              {amount >= 1000000000000
                ? `${(amount / 1000000000000).toFixed(2)}T`
                : amount >= 1000000000
                ? `${(amount / 1000000000).toFixed(2)}B`
                : amount >= 1000000
                ? `${(amount / 1000000).toFixed(2)}M`
                : amount >= 1000
                ? `${(amount / 1000).toFixed(1)}K`
                : fNumber(amount)}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
