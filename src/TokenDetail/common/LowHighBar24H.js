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
import { fNumber } from 'src/utils/formatNumber';

import NumberTooltip from 'src/components/NumberTooltip';

// ----------------------------------------------------------------------
const LowhighBarSlider = styled(Slider)(({ theme, darkMode }) => ({
  '& .MuiSlider-track': {
    border: 'none'
  },
  '& .MuiSlider-thumb': {
    height: 24,
    width: 24,
    backgroundColor: 'unset',
    border: '0px solid currentColor',
    '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
      boxShadow: 'inherit'
    },
    '&:before': {
      display: 'none'
    }
  },
  '& .MuiSlider-valueLabel': {
    lineHeight: 1.2,
    fontSize: 0,
    background: 'unset',
    padding: 0,
    width: 13,
    height: 13,
    borderRadius: '0 50% 50% 50%',
    backgroundColor: darkMode ? '#fff' : '#007B55', // Set background color based on darkMode
    transformOrigin: 'bottom left',
    transform: 'translate(-20%, 180%) rotate(45deg) scale(0)',
    '&:before': { display: 'none' },
    '&.MuiSlider-valueLabelOpen': {
      transform: 'translate(-20%, 180%) rotate(45deg) scale(1)'
    },
    '& > *': {
      transform: 'rotate(45deg)'
    }
  }
}));

export default function LowHighBar24H({ token, darkMode }) {
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const metrics = useSelector(selectMetrics);
  const { exch, maxMin24h } = token;
  const price = fNumber(exch / metrics.USD);
  const min = maxMin24h[1];
  const max = maxMin24h[0];
  const delta = max - min;
  let percent = 0;
  if (delta > 0) percent = ((price - min) / delta) * 100;

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      justifyContent={isTablet ? 'space-between' : 'flex-start'}
    >
      <Typography variant="caption">Low: <NumberTooltip prepend='$' number={fNumber(min)}/></Typography>
      <Box sx={{ width: isTablet ? 360 : 160 }}>
        <LowhighBarSlider
          valueLabelDisplay="on"
          aria-label="Low High Bar Slider"
          value={percent}
          sx={{ mt: 1 }}
          darkMode={darkMode} // Pass darkMode as a prop
        />
      </Box>
      <Typography variant="caption">High: <NumberTooltip prepend='$' number={fNumber(max)}/></Typography>
    </Stack>
  );
}
