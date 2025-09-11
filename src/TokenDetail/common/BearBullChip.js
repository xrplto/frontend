import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { Chip, Tooltip, Typography, Stack } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { fPercent } from 'src/utils/formatNumber';

export default function BearBullChip({ value, tooltip, label, componentsProps }) {
  const formattedPro = parseFloat(value).toFixed(2); // Format to two decimal places
  const isBearish = formattedPro < 0;
  const strPro = `${isBearish ? -formattedPro : formattedPro} %`;

  const ChipComponent = isBearish ? BearishChip : BullishChip;

  return (
    <Tooltip title={tooltip} arrow componentsProps={componentsProps}>
      <Stack direction="row" spacing={0.25} alignItems="center">
        {label && (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
            {label}
          </Typography>
        )}
        <ChipComponent
          icon={isBearish ? <KeyboardArrowDownIcon sx={{ width: 16, height: 16, color: '#fff' }} /> : <KeyboardArrowUpIcon sx={{ width: 16, height: 16, color: '#fff' }} />}
          size="small"
          label={
            <WhiteTextTypography variant="caption" style={{ color: '#FFFFFF !important' }}>
              {strPro}
            </WhiteTextTypography>
          }
          sx={{ height: '24px', '& .MuiChip-label': { px: 1 } }}
        />
      </Stack>
    </Tooltip>
  );
}

BearBullChip.propTypes = {
  value: PropTypes.number,
  tooltip: PropTypes.any,
  label: PropTypes.string,
  componentsProps: PropTypes.object
};

const BearishChip = styled(Chip)({
  backgroundColor: '#B72136 !important',
  borderRadius: '4px !important',
  '& .MuiChip-label': {
    padding: '0 4px'
  }
});

const BullishChip = styled(Chip)({
  backgroundColor: '#007B55 !important',
  borderRadius: '4px !important',
  '& .MuiChip-label': {
    padding: '0 4px'
  }
});

const WhiteTextTypography = styled(Typography)({
  color: '#FFFFFF !important',
  fontSize: '0.85rem !important',
  lineHeight: 1.2,
  fontWeight: 500
});
