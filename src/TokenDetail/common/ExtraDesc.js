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

  const formatValue = (value) => {
    if (value >= 1000000000000) return `${(value / 1000000000000).toFixed(2)}T`;
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(2)}B`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return fNumber(value);
  };

  const metrics_data = [
    {
      title: 'Market Cap',
      value: `${currencySymbols[activeFiatCurrency]} ${formatValue(convertedMarketCap)}`,
      color: theme.palette.success.main,
      tooltip: `The total market value of ${name} token's circulating supply represents its overall worth. This concept is similar to free-float capitalization in the stock market. ${
        omcf === 'yes'
          ? 'Price x Circulating Supply'
          : '(Price x Circulating Supply) x (Average daily trading volume / Average daily trading volume for all tokens)'
      }.`,
      admin: isAdmin && (
        <FormGroup sx={{ ml: 0.125 }}>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={omcf === 'yes'}
                onClick={onChangeMarketCalculation}
                inputProps={{ 'aria-label': 'controlled' }}
                sx={{
                  p: 0.0625,
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
                  fontSize: '0.55rem',
                  color: alpha(theme.palette.text.secondary, 0.8)
                }}
              >
                Use original formula
              </Typography>
            }
          />
        </FormGroup>
      )
    },
    {
      title: 'TVL',
      value: `${currencySymbols[activeFiatCurrency]} ${formatValue(token.tvl || 0)}`,
      color: theme.palette.secondary.main,
      tooltip: `Total Value Locked (TVL) represents the total value of ${name} tokens locked in the protocol, providing a measure of the overall economic activity and security of the token.`
    },
    {
      title: 'Volume (24h)',
      value: `${currencySymbols[activeFiatCurrency]} ${formatValue(convertedVolume)}`,
      color: theme.palette.error.main,
      tooltip: `Trading volume of ${name} tokens within the past 24 hours.`,
      subValue: `${volume} ${name}`
    },
    {
      title: 'Supply',
      value: `${formatValue(supply)} / ${formatValue(amount)}`,
      color: theme.palette.primary.main,
      tooltip: `Circulating Supply: The number of ${name} tokens in circulation within the market and held by the public. Total Supply: Total number of ${name} tokens that have been issued, including those not currently active in the market.`
    }
  ];

  return (
    <Box
      sx={{
        p: 0.75,
        borderRadius: '6px',
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.background.paper,
          0.8
        )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
        backdropFilter: 'blur(8px)',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.06)}`,
        boxShadow: `0 1px 6px ${alpha(theme.palette.common.black, 0.03)}`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: `linear-gradient(90deg, ${alpha(theme.palette.success.main, 0.5)}, ${alpha(
            theme.palette.primary.main,
            0.5
          )}, ${alpha(theme.palette.info.main, 0.5)})`,
          opacity: 0.7
        }
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 0.75
        }}
      >
        {metrics_data.map((metric, index) => (
          <Box
            key={metric.title}
            sx={{
              p: 0.75,
              borderRadius: '4px',
              background: `linear-gradient(135deg, ${alpha(metric.color, 0.08)} 0%, ${alpha(
                metric.color,
                0.04
              )} 100%)`,
              backdropFilter: 'blur(6px)',
              border: `1px solid ${alpha(metric.color, 0.12)}`,
              boxShadow: `0 1px 3px ${alpha(metric.color, 0.08)}`,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: `0 2px 6px ${alpha(metric.color, 0.15)}`
              }
            }}
          >
            <Stack direction="row" alignItems="center" gap={0.125} sx={{ mb: 0.25 }}>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.55rem',
                  color: alpha(theme.palette.text.secondary, 0.9),
                  fontWeight: 500
                }}
              >
                {metric.title}
              </Typography>
              <Tooltip
                title={
                  <Typography variant="body2" sx={{ fontSize: '0.65rem' }}>
                    {metric.tooltip}
                  </Typography>
                }
                componentsProps={{
                  tooltip: {
                    sx: {
                      background: `linear-gradient(135deg, ${alpha(
                        theme.palette.background.paper,
                        0.95
                      )} 0%, ${alpha(theme.palette.background.paper, 0.85)} 100%)`,
                      backdropFilter: 'blur(16px)',
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                      borderRadius: '4px',
                      boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.12)}`,
                      p: 0.75,
                      '& .MuiTooltip-arrow': {
                        color: alpha(theme.palette.background.paper, 0.9)
                      }
                    }
                  }
                }}
              >
                <Icon icon={infoFilled} width={8} height={8} style={{ color: metric.color }} />
              </Tooltip>
              {metric.admin}
            </Stack>

            <Box>
              {metric.subValue ? (
                <Tooltip
                  title={
                    <Typography variant="body2" sx={{ fontSize: '0.65rem' }}>
                      {metric.subValue}
                    </Typography>
                  }
                  componentsProps={{
                    tooltip: {
                      sx: {
                        background: `linear-gradient(135deg, ${alpha(
                          theme.palette.background.paper,
                          0.95
                        )} 0%, ${alpha(theme.palette.background.paper, 0.85)} 100%)`,
                        backdropFilter: 'blur(16px)',
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                        borderRadius: '4px',
                        boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.12)}`,
                        p: 0.75,
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
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: `linear-gradient(135deg, ${metric.color} 0%, ${alpha(
                        metric.color,
                        0.8
                      )} 100%)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      letterSpacing: '0.01em',
                      textAlign: 'center',
                      cursor: 'pointer',
                      lineHeight: 1.1
                    }}
                  >
                    {metric.value}
                  </Typography>
                </Tooltip>
              ) : (
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: `linear-gradient(135deg, ${metric.color} 0%, ${alpha(
                      metric.color,
                      0.8
                    )} 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '0.01em',
                    textAlign: 'center',
                    lineHeight: 1.1
                  }}
                >
                  {metric.value}
                </Typography>
              )}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
