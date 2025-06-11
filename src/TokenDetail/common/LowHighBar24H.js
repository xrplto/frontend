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
    boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.25)}`
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
    height: 18,
    width: 18,
    background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(
      theme.palette.background.paper,
      0.9
    )} 100%)`,
    border: `2px solid ${theme.palette.primary.main}`,
    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
    backdropFilter: 'blur(10px)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
      boxShadow: `0 0 0 8px ${alpha(theme.palette.primary.main, 0.12)}, 0 4px 16px ${alpha(
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
    lineHeight: 1.2,
    fontSize: 11,
    background: 'unset',
    padding: '4px 8px',
    width: 'auto',
    height: 'auto',
    borderRadius: '6px',
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.95)} 0%, ${alpha(
      theme.palette.primary.main,
      0.85
    )} 100%)`,
    backdropFilter: 'blur(10px)',
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    color: theme.palette.primary.contrastText,
    fontWeight: 500,
    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
    transformOrigin: 'bottom center',
    transform: 'translateY(-100%) scale(0)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
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
      spacing={1.5}
      sx={{
        py: 1,
        px: { xs: 1.5, sm: 2 },
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
        },
        ...sx
      }}
    >
      <Typography
        variant="caption"
        sx={{
          minWidth: 'max-content',
          fontSize: '0.75rem',
          fontWeight: 500,
          color: alpha(theme.palette.text.secondary, 0.9)
        }}
      >
        Low:{' '}
        <Box
          component="span"
          sx={{
            color: theme.palette.success.main,
            fontWeight: 600
          }}
        >
          <NumberTooltip
            prepend={currencySymbols[activeFiatCurrency]}
            number={fNumber(
              Decimal.mul(Decimal.mul(min, metrics.USD), 1 / metrics[activeFiatCurrency])
            )}
          />
        </Box>
      </Typography>

      <Box sx={{ flexGrow: 1, px: 1 }}>
        <LowhighBarSlider
          valueLabelDisplay="auto"
          aria-label="Low High Bar Slider"
          value={percent}
          sx={{ mt: 0.5 }}
        />
      </Box>

      <Typography
        variant="caption"
        sx={{
          minWidth: 'max-content',
          fontSize: '0.75rem',
          fontWeight: 500,
          color: alpha(theme.palette.text.secondary, 0.9)
        }}
      >
        High:{' '}
        <Box
          component="span"
          sx={{
            color: theme.palette.info.main,
            fontWeight: 600
          }}
        >
          <NumberTooltip
            prepend={currencySymbols[activeFiatCurrency]}
            number={fNumber(
              Decimal.mul(Decimal.mul(max, metrics.USD), 1 / metrics[activeFiatCurrency])
            )}
          />
        </Box>
      </Typography>
    </Stack>
  );
}
