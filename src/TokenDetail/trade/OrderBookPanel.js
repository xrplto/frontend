import React, { memo } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Stack,
  Divider,
  useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import OrderBookTable from './OrderBookTable';

const OrderBookPanel = memo(({ open, onClose, pair, asks, bids, limitPrice, isBuyOrder, onAskClick, onBidClick, isSecondary = false, autoShiftContent = false }) => {
  const theme = useTheme();

  // When used standalone (e.g., inside Swap), shift the main content to the left
  // by adding padding-right to the Next.js root element. In TokenDetail, layout
  // padding is already managed, so this should be disabled via autoShiftContent={false}.
  React.useEffect(() => {
    if (!autoShiftContent) return;
    const root = typeof document !== 'undefined' ? document.getElementById('__next') : null;
    if (!root) return;

    const calcPanelWidth = () => {
      if (typeof window === 'undefined') return 0;
      const w = window.innerWidth || 0;
      const { md, lg, xl } = theme.breakpoints.values || { md: 900, lg: 1200, xl: 1536 };
      if (w >= xl) return 360;
      if (w >= lg) return 320;
      if (w >= md) return 280;
      return 0;
    };

    if (open) {
      const width = calcPanelWidth();
      if (width > 0) {
        // Preserve any existing inline paddingRight set by others
        const prev = root.style.paddingRight;
        root.setAttribute('data-prev-pr', prev);
        root.style.paddingRight = `${width}px`;
      }
    } else {
      // Restore previous padding when closing
      const prev = root.getAttribute('data-prev-pr');
      if (prev !== null) root.style.paddingRight = prev;
      else root.style.removeProperty('padding-right');
      root.removeAttribute('data-prev-pr');
    }

    return () => {
      // Cleanup on unmount
      const prev = root?.getAttribute('data-prev-pr');
      if (root) {
        if (prev !== null) root.style.paddingRight = prev;
        else root.style.removeProperty('padding-right');
        root.removeAttribute('data-prev-pr');
      }
    };
  }, [open, autoShiftContent, theme.breakpoints.values]);

  const getIndicatorProgress = (value) => {
    if (isNaN(value)) return 0;
    let totA = 0, avgA = 0, totB = 0, avgB = 0;
    if (asks.length >= 1) {
      totA = Number(asks[asks.length - 1].sumAmount);
      avgA = totA / asks.length;
    }
    if (bids.length >= 1) {
      totB = Number(bids[bids.length - 1].sumAmount);
      avgB = totB / bids.length;
    }
    const avg = (Number(avgA) + Number(avgB)) / 2;
    const max100 = (avg / 50) * 100;
    const progress = value / max100 > 1 ? 1 : value / max100;
    return (progress * 100).toFixed(0);
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: { xs: 56, sm: 56, md: 56 },
        right: isSecondary ? { md: '240px', lg: '256px', xl: '272px' } : 0,
        width: { md: 280, lg: 320, xl: 360 },
        height: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 56px)', md: 'calc(100vh - 56px)' },
        borderLeft: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        backgroundColor: theme.palette.background.paper,
        boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.08)}, 0 1px 2px ${alpha(
          theme.palette.common.black,
          0.04
        )}`,
        overflow: 'hidden',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s ease-in-out',
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        zIndex: theme.zIndex.drawer - 1 // Ensure it's below the TransactionDetailsPanel Drawer
      }}
    >
        {/* Header */}
        <Box
          sx={{
            p: 1.5,
            pb: 1,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            flexShrink: 0
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                Order Book
              </Typography>
            </Stack>
            
            <IconButton 
              size="small" 
              onClick={onClose}
              sx={{ 
                '&:hover': { 
                  background: alpha(theme.palette.error.main, 0.1) 
                }
              }}
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Stack>
          
          {pair && (
            <Typography 
              variant="caption" 
              sx={{ 
                color: alpha(theme.palette.text.secondary, 0.7),
                fontSize: '0.7rem',
                display: 'block',
                mt: 0.25
              }}
            >
              {pair.curr1?.name || pair.curr1?.currency}/{pair.curr2?.name || pair.curr2?.currency}
            </Typography>
          )}
        </Box>
        
        {/* Content */}
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {/* Asks Section */}
          <Box sx={{ borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <Box sx={{ p: 1, backgroundColor: alpha(theme.palette.error.main, 0.02) }}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <TrendingDownIcon sx={{ fontSize: '0.8rem', color: theme.palette.error.main }} />
                <Typography variant="caption" sx={{ color: theme.palette.error.main, fontWeight: 600, fontSize: '0.75rem' }}>
                  Sell Orders ({asks.length})
                </Typography>
              </Stack>
            </Box>
            <OrderBookTable
              levels={asks}
              orderType={2} // ORDER_TYPE_ASKS
              pair={pair}
              selected={[0, 0]}
              limitPrice={limitPrice}
              isBuyOrder={isBuyOrder}
              onMouseOver={() => {}}
              onMouseLeave={() => {}}
              onClick={(e, idx) => {
                if (onAskClick && asks && asks[idx]) {
                  onAskClick(e, idx);
                }
              }}
              getIndicatorProgress={getIndicatorProgress}
              allBids={bids}
              allAsks={asks}
            />
          </Box>

          <Divider />

          {/* Bids Section */}
          <Box>
            <Box sx={{ p: 1, backgroundColor: alpha(theme.palette.success.main, 0.02) }}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <TrendingUpIcon sx={{ fontSize: '0.8rem', color: theme.palette.success.main }} />
                <Typography variant="caption" sx={{ color: theme.palette.success.main, fontWeight: 600, fontSize: '0.75rem' }}>
                  Buy Orders ({bids.length})
                </Typography>
              </Stack>
            </Box>
            <OrderBookTable
              levels={bids}
              orderType={1} // ORDER_TYPE_BIDS
              pair={pair}
              selected={[0, 0]}
              limitPrice={limitPrice}
              isBuyOrder={isBuyOrder}
              onMouseOver={() => {}}
              onMouseLeave={() => {}}
              onClick={(e, idx) => {
                if (onBidClick && bids && bids[idx]) {
                  onBidClick(e, idx);
                }
              }}
              getIndicatorProgress={getIndicatorProgress}
              allBids={bids}
              allAsks={asks}
            />
          </Box>

          {/* Empty State */}
          {bids.length === 0 && asks.length === 0 && (
            <Box 
              sx={{ 
                py: 4, 
                textAlign: 'center',
                borderRadius: '8px',
                background: alpha(theme.palette.background.default, 0.5),
                m: 2
              }}
            >
              <Typography variant="body2" sx={{ color: alpha(theme.palette.text.secondary, 0.7) }}>
                No orders available
              </Typography>
            </Box>
          )}
        </Box>
    </Box>
  );
});

OrderBookPanel.displayName = 'OrderBookPanel';

export default OrderBookPanel;
