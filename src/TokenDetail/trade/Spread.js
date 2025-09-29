import React, { useMemo, useState, useEffect } from 'react';
// Material UI components
import { Box, Chip, Tooltip, Typography, IconButton } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { styled } from '@mui/material/styles';

// Material Icons
import InfoIcon from '@mui/icons-material/Info';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

// Utils
import { calculateSpread } from 'src/utils/parseUtils';

// Styled Components
const SpreadContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1.5, 2),
  borderRadius: '10px',
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.6)} 0%, ${alpha(
    theme.palette.background.paper,
    0.3
  )} 100%)`,
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  marginBottom: theme.spacing(2),
  transition: 'all 0.2s ease',
  '&:hover': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(
      theme.palette.background.paper,
      0.5
    )} 100%)`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`
  }
}));

const SpreadChip = styled(Chip)(({ theme }) => ({
  height: '24px',
  fontSize: '0.75rem',
  fontWeight: 600,
  borderRadius: '12px',
  '& .MuiChip-label': {
    padding: theme.spacing(0, 1)
  }
}));

const CompactTooltip = styled(Tooltip)(({ theme }) => ({
  '& .MuiTooltip-tooltip': {
    backgroundColor: alpha(theme.palette.background.paper, 0.95),
    color: theme.palette.text.primary,
    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
    borderRadius: '8px',
    fontSize: '0.75rem',
    maxWidth: 280,
    padding: theme.spacing(1.5),
    backdropFilter: 'blur(10px)',
    boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.1)}`
  },
  '& .MuiTooltip-arrow': {
    color: alpha(theme.palette.background.paper, 0.95)
  }
}));

// Function to format numbers in 'en-US' locale
const formatNumber = (number) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8
  }).format(number);

const Spread = ({ bids, asks, sx }) => {
  const theme = useTheme();
  const [displayValues, setDisplayValues] = useState({
    spreadAmount: '0',
    spreadPercentage: '0.00',
    direction: 'up'
  });

  // Calculate spread values
  const calculatedValues = useMemo(() => {
    const spread = calculateSpread(bids, asks);

    if (spread.spreadAmount === 0) {
      return {
        spreadAmount: '0',
        spreadPercentage: '0.00',
        direction: 'up'
      };
    }

    return {
      spreadAmount: formatNumber(spread.spreadAmount),
      spreadPercentage: spread.spreadPercentage.toFixed(2),
      direction: spread.lowestAsk > spread.highestBid ? 'up' : 'down'
    };
  }, [bids, asks]);

  // Update display values with a small delay to prevent flickering
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayValues(calculatedValues);
    }, 100);

    return () => clearTimeout(timer);
  }, [calculatedValues]);

  const { spreadAmount, spreadPercentage, direction } = displayValues;

  const getSpreadColor = () => {
    const percentage = parseFloat(spreadPercentage);
    if (percentage < 0.1) return theme.palette.success.main;
    if (percentage < 0.5) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  return (
    <SpreadContainer sx={sx}>
      {direction === 'up' ? (
        <TrendingUpIcon
          sx={{
            fontSize: '1rem',
            color: theme.palette.success.main
          }}
        />
      ) : (
        <TrendingDownIcon
          sx={{
            fontSize: '1rem',
            color: theme.palette.error.main
          }}
        />
      )}
      <Typography
        variant="caption"
        sx={{
          fontWeight: 500,
          fontSize: '0.75rem',
          color: theme.palette.text.secondary,
          flex: 1
        }}
      >
        Spread:
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 600,
          color: theme.palette.text.primary,
          fontSize: '0.875rem',
          minWidth: '60px',
          textAlign: 'right'
        }}
      >
        {spreadAmount}
      </Typography>

      <SpreadChip
        label={`${spreadPercentage}%`}
        size="small"
        sx={{
          backgroundColor: alpha(getSpreadColor(), 0.1),
          color: getSpreadColor(),
          border: `1px solid ${alpha(getSpreadColor(), 0.3)}`,
          fontWeight: 600,
          minWidth: '60px'
        }}
      />

      <CompactTooltip
        title={
          <>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Bid-Ask Spread
            </Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.4 }}>
              The bid-ask spread represents the difference between the quoted prices for an
              immediate sale (ask) and an immediate purchase (bid) of financial instruments. A
              smaller spread typically indicates better liquidity and lower trading costs.
            </Typography>
          </>
        }
        arrow
        placement="top"
      >
        <IconButton
          size="small"
          sx={{
            padding: '2px',
            color: alpha(theme.palette.text.secondary, 0.6),
            '&:hover': {
              color: theme.palette.primary.main,
              backgroundColor: alpha(theme.palette.primary.main, 0.08)
            }
          }}
        >
          <InfoIcon sx={{ fontSize: '0.875rem' }} />
        </IconButton>
      </CompactTooltip>
    </SpreadContainer>
  );
};

export default React.memo(Spread);
