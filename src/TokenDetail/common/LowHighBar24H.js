import * as React from 'react';

// Material
import {
  styled,
  Box,
  Slider,
  Stack,
  Typography,
  useTheme,
  useMediaQuery,
  Divider
} from '@mui/material';

// Components

// Redux
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';

// Utils
import { fNumber, fNumberWithCurreny } from 'src/utils/formatNumber';

import NumberTooltip from 'src/components/NumberTooltip';
import { currencySymbols } from 'src/utils/constants';
import Decimal from 'decimal.js';
import { AppContext } from 'src/AppContext';
import { alpha } from '@mui/material/styles';

// ----------------------------------------------------------------------
const LowhighBarSlider = styled(Slider)(({ theme }) => ({
  '& .MuiSlider-track': {
    border: 'none',
    height: 6,
    background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.primary.main}, ${theme.palette.info.main})`,
    borderRadius: '3px',
    boxShadow: `0 1px 4px ${alpha(theme.palette.primary.main, 0.25)}`
  },
  '& .MuiSlider-rail': {
    height: 6,
    borderRadius: '3px',
    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(
      theme.palette.background.paper,
      0.4
    )} 100%)`,
    backdropFilter: 'blur(10px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    opacity: 1
  },
  '& .MuiSlider-thumb': {
    height: 16,
    width: 16,
    background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(
      theme.palette.background.paper,
      0.9
    )} 100%)`,
    border: `2px solid ${theme.palette.primary.main}`,
    boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.25)}`,
    backdropFilter: 'blur(10px)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
      boxShadow: `0 0 0 6px ${alpha(theme.palette.primary.main, 0.12)}, 0 2px 12px ${alpha(
        theme.palette.primary.main,
        0.3
      )}`,
      transform: 'scale(1.05)'
    },
    '&:before': {
      display: 'none'
    }
  },
  '& .MuiSlider-valueLabel': {
    display: 'none'
  }
}));

export default function LowHighBar24H({ token, sx = {} }) {
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const metrics = useSelector(selectMetrics);
  const { activeFiatCurrency } = React.useContext(AppContext);

  // Return early if token or maxMin24h is not available
  if (!token || !token.maxMin24h) {
    return null;
  }

  const { maxMin24h, usd } = token;
  const min = maxMin24h[1];
  const max = maxMin24h[0];
  const delta = max - min;
  let percent = 0;
  if (delta > 0) percent = ((usd - min) / delta) * 100;

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      sx={{
        py: 0.75,
        px: 1,
        borderRadius: '6px',
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.background.paper,
          0.6
        )} 0%, ${alpha(theme.palette.background.paper, 0.3)} 100%)`,
        backdropFilter: 'blur(8px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        boxShadow: `0 1px 4px ${alpha(theme.palette.common.black, 0.04)}`,
        ...sx
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          minWidth: 'fit-content'
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.625rem',
            fontWeight: 500,
            color: alpha(theme.palette.text.secondary, 0.8),
            mb: 0.125
          }}
        >
          Low
        </Typography>
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.65rem',
            fontWeight: 600,
            color: theme.palette.success.main
          }}
        >
          <NumberTooltip
            prepend={currencySymbols[activeFiatCurrency]}
            number={fNumber(
              Decimal.mul(Decimal.mul(min, metrics.USD), 1 / metrics[activeFiatCurrency])
            )}
          />
        </Typography>
      </Box>

      <Box sx={{ flexGrow: 1, px: 0.75 }}>
        <LowhighBarSlider
          aria-label="24h Price Range"
          value={percent}
          disabled
          sx={{
            mt: 0.25,
            '& .MuiSlider-thumb': {
              '&:hover, &.Mui-focusVisible': {
                boxShadow: `0 0 0 6px ${alpha(
                  theme.palette.primary.main,
                  0.12
                )}, 0 2px 12px ${alpha(theme.palette.primary.main, 0.3)}`
              }
            }
          }}
        />
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          minWidth: 'fit-content'
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.625rem',
            fontWeight: 500,
            color: alpha(theme.palette.text.secondary, 0.8),
            mb: 0.125
          }}
        >
          High
        </Typography>
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.65rem',
            fontWeight: 600,
            color: theme.palette.info.main
          }}
        >
          <NumberTooltip
            prepend={currencySymbols[activeFiatCurrency]}
            number={fNumber(
              Decimal.mul(Decimal.mul(max, metrics.USD), 1 / metrics[activeFiatCurrency])
            )}
          />
        </Typography>
      </Box>
    </Stack>
  );
}
