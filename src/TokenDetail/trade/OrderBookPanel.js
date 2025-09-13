import React, { memo } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Stack,
  Divider,
  useTheme,
  Paper,
  Tooltip,
  Chip,
  Modal
} from '@mui/material';
import { alpha, styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import OrderBookTable from './OrderBookTable';
import { calculateSpread } from 'src/utils/orderbookService';
import { fNumber } from 'src/utils/formatNumber';

const StyledPanel = styled(Paper)(({ theme }) => ({
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
  backdropFilter: 'blur(32px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}, 0 2px 8px ${alpha(theme.palette.common.black, 0.04)}`,
  width: { xs: '92%', sm: 420, md: 280, lg: 320, xl: 360 },
  maxWidth: '92vw',
  height: { xs: '80vh', md: 'calc(100vh - 56px)' },
  borderRadius: { xs: 2, md: 2 }
}));

const HeaderSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5),
  paddingBottom: theme.spacing(1),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
  flexShrink: 0,
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.1)} 0%, ${alpha(theme.palette.background.paper, 0.05)} 100%)`,
  backdropFilter: 'blur(20px)'
}));

const SectionHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  flexShrink: 0,
  borderRadius: '8px',
  margin: theme.spacing(0.5),
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.08)} 0%, ${alpha(theme.palette.background.paper, 0.04)} 100%)`,
  backdropFilter: 'blur(16px)',
  transition: 'all 0.2s ease'
}));

const SpreadSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(0.75, 1),
  flex: '0 0 auto',
  background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.08)} 0%, ${alpha(theme.palette.warning.main, 0.04)} 100%)`,
  backdropFilter: 'blur(16px)',
  borderTop: `1px dashed ${alpha(theme.palette.warning.main, 0.3)}`,
  borderBottom: `1px dashed ${alpha(theme.palette.warning.main, 0.3)}`,
  margin: theme.spacing(0, 0.5)
}));

const OrderBookPanel = memo(({ open, onClose, pair, asks, bids, limitPrice, isBuyOrder, onAskClick, onBidClick, isSecondary = false, autoShiftContent = false }) => {
  const theme = useTheme();
  const spread = React.useMemo(() => calculateSpread(bids, asks), [bids, asks]);
  const bestAsk = React.useMemo(() => (asks && asks[0] ? Number(asks[0].price) : null), [asks]);
  const bestBid = React.useMemo(() => (bids && bids[0] ? Number(bids[0].price) : null), [bids]);

  // Deprecated: previously shifted layout when as a fixed panel. No-op for modal.

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

  const modalSx = {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    pt: '56px',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    backgroundColor: alpha(theme.palette.background.default, 0.5)
  };

  return (
    <Modal open={!!open} onClose={onClose} keepMounted sx={modalSx}>
      <StyledPanel>
        {/* Header */}
        <HeaderSection>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', color: theme.palette.text.primary }}>
                Order Book
              </Typography>
            </Stack>
            
            <IconButton 
              size="small" 
              onClick={onClose}
              sx={{ 
                borderRadius: '8px',
                padding: '6px',
                background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.1)} 0%, ${alpha(theme.palette.background.paper, 0.05)} 100%)`,
                backdropFilter: 'blur(16px)',
                transition: 'all 0.2s ease',
                '&:hover': { 
                  background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.15)} 0%, ${alpha(theme.palette.error.main, 0.08)} 100%)`,
                  transform: 'scale(1.05)'
                }
              }}
              aria-label="Close order book"
            >
              <CloseIcon sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
            </IconButton>
          </Stack>

          {pair && (
            <Typography 
              variant="caption" 
              sx={{ 
                color: alpha(theme.palette.text.secondary, 0.8),
                fontSize: '0.75rem',
                display: 'block',
                mt: 0.5,
                fontWeight: 500
              }}
            >
              {pair.curr1?.name || pair.curr1?.currency}/{pair.curr2?.name || pair.curr2?.currency}
            </Typography>
          )}

          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
            <Tooltip title="Highest price buyers are willing to pay">
              <Chip
                size="small"
                color="success"
                variant="outlined"
                label={bestBid != null ? `Best Bid ${fNumber(bestBid)}` : 'No bids'}
                sx={{ height: 22, fontSize: '0.7rem' }}
              />
            </Tooltip>
            <Tooltip title="Lowest price sellers are willing to accept">
              <Chip
                size="small"
                color="error"
                variant="outlined"
                label={bestAsk != null ? `Best Ask ${fNumber(bestAsk)}` : 'No asks'}
                sx={{ height: 22, fontSize: '0.7rem' }}
              />
            </Tooltip>
            <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.8), fontSize: '0.7rem' }}>
              Tip: Click a row to set price
            </Typography>
          </Stack>
        </HeaderSection>
        
        {/* Content split into equal halves */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Top half: Asks */}
          <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <SectionHeader sx={{ 
              background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.08)} 0%, ${alpha(theme.palette.error.main, 0.04)} 100%)`,
              '&:hover': {
                background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.12)} 0%, ${alpha(theme.palette.error.main, 0.06)} 100%)`,
              }
            }}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <TrendingDownIcon sx={{ fontSize: '0.85rem', color: theme.palette.error.main }} />
                <Typography variant="caption" sx={{ color: theme.palette.error.main, fontWeight: 600, fontSize: '0.75rem' }}>
                  Sell Orders ({asks.length})
                </Typography>
              </Stack>
            </SectionHeader>
            <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
              {asks.length > 0 ? (
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
              ) : (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.8) }}>
                    No sell orders
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Middle spread bar */}
          {spread.spreadAmount > 0 ? (
            <SpreadSection>
              <Stack direction='row' spacing={1} justifyContent='space-between' alignItems='center'>
                <Typography variant='caption' sx={{ fontWeight: 600, color: theme.palette.text.secondary, fontSize: '0.7rem' }}>
                  Spread
                </Typography>
                <Stack direction='row' spacing={1} alignItems='center'>
                  <Typography variant='caption' sx={{ color: theme.palette.text.secondary, fontSize: '0.7rem', fontWeight: 500 }}>
                    {fNumber(spread.spreadAmount)}
                  </Typography>
                  <Typography variant='caption' sx={{ color: theme.palette.warning.main, fontSize: '0.7rem', fontWeight: 600 }}>
                    ({Number(spread.spreadPercentage).toFixed(2)}%)
                  </Typography>
                </Stack>
              </Stack>
            </SpreadSection>
          ) : (
            <Box sx={{ 
              height: '1px', 
              background: `linear-gradient(90deg, transparent 0%, ${alpha(theme.palette.divider, 0.3)} 50%, transparent 100%)`,
              margin: theme.spacing(0.5, 1)
            }} />
          )}

          {/* Bottom half: Bids */}
          <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <SectionHeader sx={{ 
              background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.08)} 0%, ${alpha(theme.palette.success.main, 0.04)} 100%)`,
              '&:hover': {
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.12)} 0%, ${alpha(theme.palette.success.main, 0.06)} 100%)`,
              }
            }}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <TrendingUpIcon sx={{ fontSize: '0.85rem', color: theme.palette.success.main }} />
                <Typography variant="caption" sx={{ color: theme.palette.success.main, fontWeight: 600, fontSize: '0.75rem' }}>
                  Buy Orders ({bids.length})
                </Typography>
              </Stack>
            </SectionHeader>
            <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
              {bids.length > 0 ? (
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
              ) : (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.8) }}>
                    No buy orders
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Empty State */}
          {bids.length === 0 && asks.length === 0 && (
            <Box 
              sx={{ 
                py: 3, 
                textAlign: 'center',
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.1)} 0%, ${alpha(theme.palette.background.paper, 0.05)} 100%)`,
                backdropFilter: 'blur(16px)',
                border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                m: 1.5,
                transition: 'all 0.2s ease'
              }}
            >
              <Typography variant="body2" sx={{ 
                color: alpha(theme.palette.text.secondary, 0.8),
                fontSize: '0.85rem',
                fontWeight: 500
              }}>
                No orders available
              </Typography>
            </Box>
          )}
        </Box>
      </StyledPanel>
    </Modal>
  );
});

OrderBookPanel.displayName = 'OrderBookPanel';

export default OrderBookPanel;
