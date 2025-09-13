import React, { memo } from 'react';

// Material
import {
  styled,
  useTheme,
  Box,
  Typography
} from '@mui/material';
import { alpha } from '@mui/material/styles';



// Styled Components
const OrderBookContainer = styled(Box)(({ theme }) => ({
  background: 'transparent',
  borderRadius: '8px',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  overflow: 'hidden',
  position: 'relative',
  [theme.breakpoints.down('sm')]: {
    borderRadius: '6px',
    margin: 0
  }
}));


const OrderBook = memo(function OrderBook({ pair, asks, bids }) {
  const theme = useTheme();

  return (
    <OrderBookContainer>
      {/* Empty State */}
      {bids.length === 0 && asks.length === 0 && (
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: 50,
            fontSize: '0.65rem',
            color: '#999'
          }}
        >
          No orders available
        </Typography>
      )}
    </OrderBookContainer>
  );
});

export default OrderBook;
