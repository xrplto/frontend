import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';
import { Chip, Tooltip, Typography, Stack } from '@mui/material';
import { Icon } from '@iconify/react';
import caretDown from '@iconify/icons-bx/caret-down';
import caretUp from '@iconify/icons-bx/caret-up';
import { fPercent } from 'src/utils/formatNumber';

export default function BearBullChip({ value, tooltip, label }) {
  const formattedPro = parseFloat(value).toFixed(2); // Format to two decimal places
  const isBearish = formattedPro < 0;
  const strPro = `${isBearish ? -formattedPro : formattedPro} %`;

  const ChipComponent = isBearish ? BearishChip : BullishChip;

  return (
    <Tooltip title={tooltip} arrow>
      <Stack direction="row" spacing={0.25} alignItems="center">
        {label && (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
            {label}
          </Typography>
        )}
        <ChipComponent
          icon={<Icon icon={isBearish ? caretDown : caretUp} width="14" height="14" color="#fff" />}
          size="small"
          label={
            <WhiteTextTypography variant="caption" style={{ color: '#FFFFFF !important' }}>
              {strPro}
            </WhiteTextTypography>
          }
          sx={{ height: '22px', '& .MuiChip-label': { px: 0.75 } }}
        />
      </Stack>
    </Tooltip>
  );
}

BearBullChip.propTypes = {
  value: PropTypes.number,
  tooltip: PropTypes.any,
  label: PropTypes.string
};

const BearishChip = withStyles({
  root: {
    backgroundColor: '#B72136 !important',
    borderRadius: '4px !important',
    '& .MuiChip-label': {
      padding: '0 4px'
    }
  }
})(Chip);

const BullishChip = withStyles({
  root: {
    backgroundColor: '#007B55 !important',
    borderRadius: '4px !important',
    '& .MuiChip-label': {
      padding: '0 4px'
    }
  }
})(Chip);

const WhiteTextTypography = withStyles({
  root: {
    color: '#FFFFFF !important',
    fontSize: '0.75rem !important',
    lineHeight: 1.2
  }
})(Typography);
