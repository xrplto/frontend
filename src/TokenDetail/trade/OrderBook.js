import Decimal from 'decimal.js';
import React, { useEffect, useState } from 'react';

// Material
import {
  styled,
  useTheme,
  Box,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  Chip,
  Card
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { tableCellClasses } from '@mui/material/TableCell';

// Material Icons
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

// Components
import Spread from './Spread';

// Utils
import { fNumber } from 'src/utils/formatNumber';
import NumberTooltip from 'src/components/NumberTooltip';

// Styled Components
const OrderBookContainer = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.6)} 0%, ${alpha(
    theme.palette.background.paper,
    0.3
  )} 100%)`,
  backdropFilter: 'blur(10px)',
  borderRadius: '12px',
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  overflow: 'hidden',
  position: 'relative'
}));

const SectionHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1.5, 2),
  background: alpha(theme.palette.background.paper, 0.4),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
}));

const ModernTable = styled(Table)(({ theme }) => ({
  [`& .${tableCellClasses.root}`]: {
    borderBottom: 'none',
    padding: theme.spacing(0.5, 1),
    fontSize: '0.75rem',
    lineHeight: 1.2
  },
  [`& .${tableCellClasses.head}`]: {
    backgroundColor: alpha(theme.palette.background.paper, 0.6),
    fontWeight: 600,
    fontSize: '0.7rem',
    color: alpha(theme.palette.text.secondary, 0.8),
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
    padding: theme.spacing(1)
  }
}));

const OrderRow = styled(TableRow)(({ theme, ordertype, isselected, isnew, depth, depthbg }) => {
  const isBid = ordertype === 'bid';
  const baseColor = isBid ? theme.palette.success.main : theme.palette.error.main;

  let background = 'transparent';

  // Priority: new orders first, then selected, then depth gradient
  if (isnew) {
    background = alpha(baseColor, 0.25);
  } else if (isselected) {
    background = alpha(baseColor, 0.2);
  } else if (depth && depth > 0) {
    // Create gradient based on depth percentage and order type
    const gradientColor = alpha(baseColor, 0.15);
    const direction = isBid ? 'to right' : 'to left';
    background = `linear-gradient(${direction}, ${gradientColor} 0%, ${gradientColor} ${depth}%, transparent ${depth}%, transparent 100%)`;
  }

  return {
    cursor: 'pointer',
    background,
    transition: 'all 0.2s ease',
    borderRadius: theme.spacing(0.5),
    margin: theme.spacing(0, 0.5),
    position: 'relative',
    '&:hover': {
      background: `${alpha(baseColor, 0.25)} !important`,
      transform: 'translateX(2px)',
      zIndex: 1
    },
    '& .MuiTableCell-root': {
      borderRadius: theme.spacing(0.5),
      position: 'relative',
      zIndex: 2,
      '&:first-of-type': {
        borderTopLeftRadius: theme.spacing(0.5),
        borderBottomLeftRadius: theme.spacing(0.5)
      },
      '&:last-of-type': {
        borderTopRightRadius: theme.spacing(0.5),
        borderBottomRightRadius: theme.spacing(0.5)
      }
    }
  };
});

const OrderCountChip = styled(Chip)(({ theme }) => ({
  height: '20px',
  fontSize: '0.65rem',
  fontWeight: 600,
  borderRadius: '10px',
  '& .MuiChip-label': {
    padding: theme.spacing(0, 0.5)
  }
}));

const CompactTooltip = styled(Tooltip)(({ theme }) => ({
  '& .MuiTooltip-tooltip': {
    backgroundColor: alpha(theme.palette.background.paper, 0.95),
    color: theme.palette.text.primary,
    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
    borderRadius: '8px',
    fontSize: '0.75rem',
    padding: theme.spacing(1.5),
    backdropFilter: 'blur(10px)',
    boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.1)}`
  },
  '& .MuiTooltip-arrow': {
    color: alpha(theme.palette.background.paper, 0.95)
  }
}));

const LoaderContainer = styled('div')({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '200px',
  color: '#999'
});

const ORDER_TYPE_BIDS = 1;
const ORDER_TYPE_ASKS = 2;

export default function OrderBook({ pair, asks, bids, onAskClick, onBidClick }) {
  const theme = useTheme();
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [selected, setSelected] = useState([0, 0]);

  // Page Visibility detection
  useEffect(() => {
    let hidden = '';
    let visibilityChange = '';

    if (typeof document.hidden !== 'undefined') {
      hidden = 'hidden';
      visibilityChange = 'visibilitychange';
    } else {
      if (typeof document.msHidden !== 'undefined') {
        hidden = 'msHidden';
        visibilityChange = 'msvisibilitychange';
      } else {
        if (typeof document.webkitHidden !== 'undefined') {
          hidden = 'webkitHidden';
          visibilityChange = 'webkitvisibilitychange';
        }
      }
    }

    const handleVisibilityChange = () => {
      const isHidden = document['hidden'];
      setIsPageVisible(!isHidden);
    };

    if (typeof document.addEventListener === 'undefined' || hidden === '') {
      console.log('Browser does not support Page Visibility API');
    } else {
      document.addEventListener(visibilityChange, handleVisibilityChange, false);
    }

    return () => {
      if (visibilityChange) {
        document.removeEventListener(visibilityChange, handleVisibilityChange);
      }
    };
  }, []);

  const getIndicatorProgress = (value) => {
    if (isNaN(value)) return 0;

    let totA = 0,
      avgA = 0,
      totB = 0,
      avgB = 0;

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

  const onBidMouseOver = (e, idx) => {
    setSelected([idx + 1, 0]);
  };

  const onAskMouseOver = (e, idx) => {
    setSelected([0, idx + 1]);
  };

  const onMouseLeave = (e, idx) => {
    setSelected([0, 0]);
  };

  const buildPriceLevels = (levels, orderType = ORDER_TYPE_BIDS) => {
    return levels.slice(0, 25).map((level, idx) => {
      const price = fNumber(level.price);
      const avgPrice = fNumber(level.avgPrice);
      const amount = fNumber(level.amount);
      const sumAmount = fNumber(level.sumAmount);
      const sumValue = fNumber(level.sumValue);
      const isNew = level.isNew;
      const isBid = orderType === ORDER_TYPE_BIDS;
      const depth = getIndicatorProgress(level.amount);
      const currName1 = pair?.curr1.name;
      const currName2 = pair?.curr2.name;

      const isSelected = isBid ? idx < selected[0] : idx < selected[1];
      const priceColor =
        isNew || isSelected
          ? isBid
            ? theme.palette.success.main
            : theme.palette.error.main
          : theme.palette.text.primary;

      return (
        <CompactTooltip
          key={`${orderType}-${price}-${amount}-${idx}`}
          title={
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Order Details
              </Typography>
              <Box sx={{ display: 'grid', gap: 0.5, fontSize: '0.75rem' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Avg Price:</span>
                  <span style={{ fontWeight: 600 }}>≈ {avgPrice}</span>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Sum {currName1}:</span>
                  <span style={{ fontWeight: 600 }}>{sumAmount}</span>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Sum {currName2}:</span>
                  <span style={{ fontWeight: 600 }}>{sumValue}</span>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Depth:</span>
                  <span
                    style={{
                      fontWeight: 600,
                      color: isBid ? theme.palette.success.main : theme.palette.error.main
                    }}
                  >
                    {depth}%
                  </span>
                </Box>
              </Box>
            </Box>
          }
          placement="right"
          arrow
        >
          <OrderRow
            ordertype={isBid ? 'bid' : 'ask'}
            isselected={isSelected ? 1 : 0}
            isnew={isNew ? 1 : 0}
            depth={depth}
            onMouseOver={(e) => (isBid ? onBidMouseOver(e, idx) : onAskMouseOver(e, idx))}
            onMouseLeave={(e) => onMouseLeave(e, idx)}
            onClick={(e) => (isBid ? onBidClick(e, idx) : onAskClick(e, idx))}
          >
            {isBid ? (
              <>
                <TableCell align="right" sx={{ fontWeight: 500 }}>
                  {sumAmount}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  {amount}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 600,
                    color: priceColor
                  }}
                >
                  <NumberTooltip number={price} pos="bottom" />
                </TableCell>
              </>
            ) : (
              <>
                <TableCell
                  align="left"
                  sx={{
                    fontWeight: 600,
                    color: priceColor
                  }}
                >
                  <NumberTooltip number={price} pos="bottom" />
                </TableCell>
                <TableCell align="left" sx={{ fontWeight: 600 }}>
                  {amount}
                </TableCell>
                <TableCell align="left" sx={{ fontWeight: 500 }}>
                  {sumAmount}
                </TableCell>
              </>
            )}
          </OrderRow>
        </CompactTooltip>
      );
    });
  };

  if (!isPageVisible) {
    return (
      <Box sx={{ textAlign: 'center', p: 4, color: 'text.secondary' }}>
        OrderBook Paused (Page Hidden)
      </Box>
    );
  }

  return (
    <OrderBookContainer>
      {/* Spread Component */}
      <Box sx={{ p: 2, pb: 0 }}>
        <Spread bids={bids} asks={asks} />
      </Box>

      <Grid container spacing={0}>
        {/* Buy Orders */}
        <Grid item xs={12} md={6}>
          <SectionHeader>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon
                sx={{
                  fontSize: '1rem',
                  color: theme.palette.success.main
                }}
              />
              <Typography
                variant="subtitle2"
                sx={{
                  color: theme.palette.success.main,
                  fontWeight: 600,
                  fontSize: '0.875rem'
                }}
              >
                Buy Orders
              </Typography>
              <OrderCountChip
                label={bids.length}
                size="small"
                sx={{
                  backgroundColor: alpha(theme.palette.success.main, 0.1),
                  color: theme.palette.success.main,
                  border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`
                }}
              />
            </Box>
          </SectionHeader>

          <ModernTable size="small">
            <TableHead>
              <TableRow>
                <TableCell align="right">Sum</TableCell>
                <TableCell align="right">Amount ({pair.curr1.name})</TableCell>
                <TableCell align="right">Bid ({pair.curr2.name})</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>{buildPriceLevels(bids, ORDER_TYPE_BIDS)}</TableBody>
          </ModernTable>
        </Grid>

        {/* Sell Orders */}
        <Grid item xs={12} md={6}>
          <SectionHeader>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingDownIcon
                sx={{
                  fontSize: '1rem',
                  color: theme.palette.error.main
                }}
              />
              <Typography
                variant="subtitle2"
                sx={{
                  color: theme.palette.error.main,
                  fontWeight: 600,
                  fontSize: '0.875rem'
                }}
              >
                Sell Orders
              </Typography>
              <OrderCountChip
                label={asks.length}
                size="small"
                sx={{
                  backgroundColor: alpha(theme.palette.error.main, 0.1),
                  color: theme.palette.error.main,
                  border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`
                }}
              />
            </Box>
          </SectionHeader>

          <ModernTable size="small">
            <TableHead>
              <TableRow>
                <TableCell align="left">Ask ({pair.curr2.name})</TableCell>
                <TableCell align="left">Amount ({pair.curr1.name})</TableCell>
                <TableCell align="left">Sum</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>{buildPriceLevels(asks, ORDER_TYPE_ASKS)}</TableBody>
          </ModernTable>
        </Grid>
      </Grid>

      {/* Empty State */}
      {bids.length === 0 && asks.length === 0 && (
        <LoaderContainer>
          <Typography variant="body2" color="text.secondary">
            No orders available
          </Typography>
        </LoaderContainer>
      )}
    </OrderBookContainer>
  );
}
