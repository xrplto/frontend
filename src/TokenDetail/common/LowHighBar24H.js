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
    height: 4
  },
  '& .MuiSlider-rail': {
    height: 4,
    opacity: 0.2
  },
  '& .MuiSlider-thumb': {
    height: 16,
    width: 16,
    backgroundColor: theme.palette.background.paper,
    border: `2px solid ${theme.palette.primary.main}`,
    boxShadow: theme.shadows[1],
    '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
      boxShadow: `0 0 0 8px ${alpha(theme.palette.primary.main, 0.16)}`
    },
    '&:before': {
      display: 'none'
    }
  },
  '& .MuiSlider-valueLabel': {
    lineHeight: 1.2,
    fontSize: 12,
    background: 'unset',
    padding: '4px 8px',
    width: 'auto',
    height: 'auto',
    borderRadius: 1,
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    transformOrigin: 'bottom center',
    transform: 'translateY(-100%) scale(0)',
    '&:before': {
      display: 'none'
    },
    '&.MuiSlider-valueLabelOpen': {
      transform: 'translateY(-100%) scale(1)'
    },
    '& > *': {
      transform: 'none'
    }
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
        py: 0.25,
        px: { xs: 0, sm: 0.75 },
        borderRadius: 1,
        bgcolor: alpha(theme.palette.primary.main, 0.04),
        ...sx
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ minWidth: 'max-content', fontSize: '0.75rem' }}
      >
        Low:{' '}
        <NumberTooltip
          prepend={currencySymbols[activeFiatCurrency]}
          number={fNumber(
            Decimal.mul(Decimal.mul(min, metrics.USD), 1 / metrics[activeFiatCurrency])
          )}
        />
      </Typography>

      <Box sx={{ flexGrow: 1 }}>
        <LowhighBarSlider
          valueLabelDisplay="auto"
          aria-label="Low High Bar Slider"
          value={percent}
          sx={{ mt: 0.25 }}
        />
      </Box>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ minWidth: 'max-content', fontSize: '0.75rem' }}
      >
        High:{' '}
        <NumberTooltip
          prepend={currencySymbols[activeFiatCurrency]}
          number={fNumber(
            Decimal.mul(Decimal.mul(max, metrics.USD), 1 / metrics[activeFiatCurrency])
          )}
        />
      </Typography>
    </Stack>
  );
}
