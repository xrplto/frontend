import PropTypes from 'prop-types';

// Material
import { useTheme } from '@mui/material/styles';
import { Stack, Typography } from '@mui/material';

// Iconify
import { Icon } from '@iconify/react';
import caretDown from '@iconify/icons-bx/caret-down';
import caretUp from '@iconify/icons-bx/caret-up';

// ----------------------------------------------------------------------

BearBullLabel.propTypes = {
  value: PropTypes.number,
  variant: PropTypes.string
};

function abs(num) {
  if (num < 0) return -num;
  return num;
}

export default function BearBullLabel({ value, variant }) {
  const theme = useTheme();

  // Handle undefined, null, or NaN values
  if (value === undefined || value === null || isNaN(value)) {
    return (
      <Typography
        variant={variant}
        noWrap
        align="right"
        sx={{ color: theme.palette.text.secondary }}
      >
        -
      </Typography>
    );
  }

  const formattedValue = parseFloat(value).toFixed(2); // Format to two decimal places
  const isBearish = formattedValue < 0;
  const strPro = `${isBearish ? -formattedValue : formattedValue} %`;

  return (
    <>
      {isBearish ? (
        <Stack direction="row" spacing={0.1} justifyContent="flex-end" alignItems="center">
          <Icon icon={caretDown} color={theme.palette.error.main} />
          <Typography variant={variant} noWrap sx={{ color: theme.palette.error.main }}>
            {strPro}
          </Typography>
        </Stack>
      ) : (
        <Stack direction="row" spacing={0.1} justifyContent="flex-end" alignItems="center">
          <Icon icon={caretUp} color={theme.palette.primary.light} />
          <Typography variant={variant} noWrap sx={{ color: theme.palette.primary.light }}>
            {strPro}
          </Typography>
        </Stack>
      )}
    </>
  );
}
