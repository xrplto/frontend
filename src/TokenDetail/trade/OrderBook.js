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
  Card,
  useMediaQuery
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

const SectionHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0.75, 1),
  background: 'transparent',
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(0.5, 0.75),
    '& .MuiTypography-root': {
      fontSize: '0.7rem'
    }
  }
}));

const ModernTable = styled(Table)(({ theme }) => ({
  [`& .${tableCellClasses.root}`]: {
    borderBottom: 'none',
    padding: theme.spacing(0.25, 0.5),
    fontSize: '0.7rem',
    lineHeight: 1.1,
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(0.2, 0.4),
      fontSize: '0.65rem'
    }
  },
  [`& .${tableCellClasses.head}`]: {
    backgroundColor: 'transparent',
    fontWeight: 600,
    fontSize: '0.65rem',
    color: alpha(theme.palette.text.secondary, 0.7),
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    padding: theme.spacing(0.5, 0.5),
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.6rem',
      padding: theme.spacing(0.4, 0.4)
    }
  }
}));

const OrderRow = styled(TableRow)(({ theme, ordertype, isselected, isnew, depth }) => {
  const isBid = ordertype === 'bid';
  const baseColor = isBid ? theme.palette.success.main : theme.palette.error.main;

  let background = 'transparent';

  if (isnew) {
    background = alpha(baseColor, 0.15);
  } else if (isselected) {
    background = alpha(baseColor, 0.1);
  } else if (depth && depth > 0) {
    const gradientColor = alpha(baseColor, 0.08);
    const direction = isBid ? 'to right' : 'to left';
    background = `linear-gradient(${direction}, ${gradientColor} 0%, ${gradientColor} ${depth}%, transparent ${depth}%, transparent 100%)`;
  }

  return {
    cursor: 'pointer',
    background,
    transition: 'background 0.15s ease',
    margin: 0,
    position: 'relative',
    '&:hover': {
      background: `${alpha(baseColor, 0.15)} !important`
    },
    '& .MuiTableCell-root': {
      position: 'relative',
      zIndex: 2
    }
  };
});

const OrderCountChip = styled(Chip)(({ theme }) => ({
  height: '16px',
  fontSize: '0.6rem',
  fontWeight: 600,
  borderRadius: '8px',
  '& .MuiChip-label': {
    padding: theme.spacing(0, 0.4)
  }
}));

const CompactTooltip = styled(Tooltip)(({ theme }) => ({
  '& .MuiTooltip-tooltip': {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
    borderRadius: '4px',
    fontSize: '0.7rem',
    padding: theme.spacing(1),
    boxShadow: theme.shadows[2]
  }
}));


const ORDER_TYPE_BIDS = 1;
const ORDER_TYPE_ASKS = 2;

export default function OrderBook({ pair, asks, bids, onAskClick, onBidClick }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
    // Display all offers without limiting
    return levels.map((level, idx) => {
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
          disableHoverListener={isMobile}
          title={
            <Box sx={{ fontSize: '0.7rem' }}>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'auto 1fr',
                gap: '2px 8px'
              }}>
                <span>Avg:</span>
                <span style={{ fontWeight: 600, textAlign: 'right' }}>{avgPrice}</span>
                <span>Sum:</span>
                <span style={{ fontWeight: 600, textAlign: 'right' }}>{sumAmount}</span>
                <span>Total:</span>
                <span style={{ fontWeight: 600, textAlign: 'right' }}>{sumValue}</span>
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
                <TableCell align="right" sx={{ fontWeight: 400, display: { xs: 'none', sm: 'table-cell' } }}>
                  {sumAmount}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 500 }}>
                  {amount}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 500,
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
                    fontWeight: 500,
                    color: priceColor
                  }}
                >
                  <NumberTooltip number={price} pos="bottom" />
                </TableCell>
                <TableCell align="left" sx={{ fontWeight: 500 }}>
                  {amount}
                </TableCell>
                <TableCell align="left" sx={{ fontWeight: 400, display: { xs: 'none', sm: 'table-cell' } }}>
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
      <Spread bids={bids} asks={asks} sx={{ p: { xs: 1, sm: 1.5 }, pb: 0 }} />

      <Grid container spacing={0}>
        {/* Buy Orders */}
        <Grid item xs={12} md={6} sx={{ 
          borderRight: { md: `1px solid ${alpha(theme.palette.divider, 0.1)}` },
          borderBottom: { xs: `1px solid ${alpha(theme.palette.divider, 0.1)}`, md: 'none' }
        }}>
          <SectionHeader>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TrendingUpIcon
                sx={{
                  fontSize: '0.75rem',
                  color: theme.palette.success.main
                }}
              />
              <Typography
                variant="subtitle2"
                sx={{
                  color: theme.palette.success.main,
                  fontWeight: 600,
                  fontSize: '0.75rem'
                }}
              >
                Buy Orders
              </Typography>
              <OrderCountChip
                label={bids.length}
                size="small"
                sx={{
                  backgroundColor: alpha(theme.palette.success.main, 0.1),
                  color: theme.palette.success.main
                }}
              />
            </Box>
          </SectionHeader>

          <ModernTable size="small">
            <TableHead>
              <TableRow>
                <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Sum</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">Bid</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>{buildPriceLevels(bids, ORDER_TYPE_BIDS)}</TableBody>
          </ModernTable>
        </Grid>

        {/* Sell Orders */}
        <Grid item xs={12} md={6}>
          <SectionHeader>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TrendingDownIcon
                sx={{
                  fontSize: '0.75rem',
                  color: theme.palette.error.main
                }}
              />
              <Typography
                variant="subtitle2"
                sx={{
                  color: theme.palette.error.main,
                  fontWeight: 600,
                  fontSize: '0.75rem'
                }}
              >
                Sell Orders
              </Typography>
              <OrderCountChip
                label={asks.length}
                size="small"
                sx={{
                  backgroundColor: alpha(theme.palette.error.main, 0.1),
                  color: theme.palette.error.main
                }}
              />
            </Box>
          </SectionHeader>

          <ModernTable size="small">
            <TableHead>
              <TableRow>
                <TableCell align="left">Ask</TableCell>
                <TableCell align="left">Amount</TableCell>
                <TableCell align="left" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Sum</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>{buildPriceLevels(asks, ORDER_TYPE_ASKS)}</TableBody>
          </ModernTable>
        </Grid>
      </Grid>

      {/* Empty State */}
      {bids.length === 0 && asks.length === 0 && (
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: 100,
            fontSize: '0.75rem',
            color: '#999'
          }}
        >
          No orders available
        </Typography>
      )}
    </OrderBookContainer>
  );
}
