// Material
import { Divider, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';

// Components
import BearBullChip from './BearBullChip';
import LowHighBar24H from './LowHighBar24H';

// Utils
import { fNumberWithCurreny } from 'src/utils/formatNumber';

import NumberTooltip from 'src/components/NumberTooltip';
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';
import { currencySymbols } from 'src/utils/constants';
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';
import LoadChart from 'src/components/LoadChart';

// ----------------------------------------------------------------------
export default function PriceDesc({ token }) {
  const BASE_URL = process.env.API_URL;
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const metrics = useSelector(selectMetrics);
  const { activeFiatCurrency } = useContext(AppContext);

  const { name, exch, pro7d, pro24h, pro5m, pro1h, md5 } = token;

  let user = token.user;
  if (!user) user = name;

  const tooltipStyles = {
    bgcolor: theme.palette.background.paper,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
    boxShadow: theme.shadows[4],
    borderRadius: 1.5,
    p: 1.5,
    '& .MuiTooltip-arrow': {
      color: theme.palette.background.paper
    }
  };

  return (
    <Stack spacing={0.75} sx={{ position: 'relative' }}>
      <Typography
        variant="h1"
        sx={{
          color: theme.palette.primary.main,
          fontSize: '0.875rem',
          fontWeight: 600,
          letterSpacing: '0.015em',
          transition: 'color 0.2s ease-in-out',
          mb: -0.5
        }}
      >
        {user}{' '}
        <Typography component="span" color="text.secondary" fontSize="inherit">
          ({name})
        </Typography>
      </Typography>

      <Stack direction="row" spacing={1} alignItems="center">
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Typography
            variant="price"
            noWrap
            sx={{
              fontSize: { xs: '1.5rem', md: '1.75rem' },
              fontWeight: 700,
              letterSpacing: '-0.02em',
              transition: 'all 0.3s ease'
            }}
          >
            <NumberTooltip
              prepend={currencySymbols[activeFiatCurrency]}
              number={fNumberWithCurreny(exch, metrics[activeFiatCurrency])}
            />
          </Typography>
        </Stack>

        <Stack
          direction="row"
          spacing={0.5}
          alignItems="center"
          sx={{
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
            gap: { xs: 0.25, sm: 0 }
          }}
        >
          {[
            { value: pro5m, label: '5m' },
            { value: pro1h, label: '1h' },
            { value: pro24h, label: '24h' },
            { value: pro7d, label: '7d' }
          ].map((item) => (
            <BearBullChip
              key={item.label}
              value={item.value}
              tooltip={
                <Stack alignItems="center" spacing={0.5} sx={{ minWidth: 160 }}>
                  <Typography variant="caption">{item.label} Change</Typography>
                  <LoadChart
                    url={`${BASE_URL}/sparkline/${md5}?${item.label.toLowerCase()}=${item.value}`}
                    sx={{ width: '100%', height: 50 }}
                  />
                </Stack>
              }
              label={item.label}
              size="small"
              sx={{
                height: 24,
                '& .MuiChip-label': {
                  fontWeight: 600,
                  px: 0.75,
                  fontSize: '0.75rem'
                },
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: theme.shadows[1]
                }
              }}
              componentsProps={{
                tooltip: {
                  sx: {
                    ...tooltipStyles,
                    p: 1
                  }
                }
              }}
            />
          ))}
        </Stack>
      </Stack>

      <LowHighBar24H token={token} />

      {isTablet && <Divider sx={{ mt: 1 }} />}
    </Stack>
  );
}
