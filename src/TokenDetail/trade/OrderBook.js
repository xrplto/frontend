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
  padding: theme.spacing(0.25, 0.5),
  background: 'transparent',
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(0.25, 0.4),
    '& .MuiTypography-root': {
      fontSize: '0.65rem'
    }
  }
}));

const ModernTable = styled(Table)(({ theme }) => ({
  [`& .${tableCellClasses.root}`]: {
    borderBottom: 'none',
    padding: '2px 4px',
    fontSize: '0.65rem',
    lineHeight: 1,
    [theme.breakpoints.down('sm')]: {
      padding: '1px 3px',
      fontSize: '0.6rem'
    }
  },
  [`& .${tableCellClasses.head}`]: {
    backgroundColor: 'transparent',
    fontWeight: 600,
    fontSize: '0.6rem',
    color: alpha(theme.palette.text.secondary, 0.6),
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
    padding: '3px 4px',
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.55rem',
      padding: '2px 3px'
    }
  }
}));

const OrderRow = styled(TableRow)(({ theme, ordertype, isselected, isnew, islimitprice, depth }) => {
  const isBid = ordertype === 'bid';
  const baseColor = isBid ? theme.palette.success.main : theme.palette.error.main;

  let background = 'transparent';
  let borderStyle = {};

  if (islimitprice) {
    // Highlight limit price match with a border and subtle background
    background = alpha(theme.palette.warning.main, 0.1);
    borderStyle = {
      borderLeft: `3px solid ${theme.palette.warning.main}`,
      borderRight: `3px solid ${theme.palette.warning.main}`,
    };
  } else if (isnew) {
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
    ...borderStyle,
    '&:hover': {
      background: islimitprice 
        ? `${alpha(theme.palette.warning.main, 0.15)} !important`
        : `${alpha(baseColor, 0.15)} !important`
    },
    '& .MuiTableCell-root': {
      position: 'relative',
      zIndex: 2
    }
  };
});

const OrderCountChip = styled(Chip)(({ theme }) => ({
  height: '14px',
  fontSize: '0.55rem',
  fontWeight: 600,
  borderRadius: '6px',
  '& .MuiChip-label': {
    padding: '0 3px'
  }
}));

const CompactTooltip = styled(Tooltip)(({ theme }) => ({
  '& .MuiTooltip-tooltip': {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
    borderRadius: '4px',
    fontSize: '0.6rem',
    padding: '4px 6px',
    boxShadow: theme.shadows[1]
  }
}));


const ORDER_TYPE_BIDS = 1;
const ORDER_TYPE_ASKS = 2;

export default function OrderBook({ pair, asks, bids, onAskClick, onBidClick, limitPrice, isBuyOrder }) {
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
      
      // Highlight orders in the price range
      const isInPriceRange = limitPrice && (
        (isBuyOrder && isBid && level.price >= limitPrice) || // Buy orders: highlight bids >= limit price
        (!isBuyOrder && !isBid && level.price <= limitPrice)   // Sell orders: highlight asks <= limit price
      );
      
      // Show insertion point for limit orders
      const showInsertionPoint = limitPrice && (
        (isBuyOrder && isBid && 
          idx === 0 && level.price < limitPrice) || // Insert at top if limit > best bid
        (isBuyOrder && isBid && 
          idx > 0 && levels[idx-1] && levels[idx-1].price >= limitPrice && level.price < limitPrice) || // Insert between orders
        (!isBuyOrder && !isBid && 
          idx === 0 && level.price > limitPrice) || // Insert at top if limit < best ask  
        (!isBuyOrder && !isBid && 
          idx > 0 && levels[idx-1] && levels[idx-1].price <= limitPrice && level.price > limitPrice) // Insert between orders
      );
      const priceColor =
        isNew || isSelected
          ? isBid
            ? theme.palette.success.main
            : theme.palette.error.main
          : theme.palette.text.primary;

      return (
        <React.Fragment key={`${orderType}-${price}-${amount}-${idx}`}>
          {showInsertionPoint && (
            <TableRow>
              <TableCell 
                colSpan={3} 
                sx={{ 
                  padding: '2px 8px',
                  background: alpha(theme.palette.warning.main, 0.1),
                  borderTop: `2px dashed ${theme.palette.warning.main}`,
                  borderBottom: `2px dashed ${theme.palette.warning.main}`,
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  color: theme.palette.warning.main
                }}
              >
                → Your {isBuyOrder ? 'buy' : 'sell'} order @ {limitPrice}
              </TableCell>
            </TableRow>
          )}
          <CompactTooltip
          disableHoverListener={isMobile}
          title={
            <Box sx={{ fontSize: '0.6rem', whiteSpace: 'nowrap' }}>
              <div>Avg: <b>{avgPrice}</b></div>
              <div>Sum: <b>{sumAmount}</b></div>
              <div>Val: <b>{sumValue}</b></div>
            </Box>
          }
          placement="right"
          arrow
        >
          <OrderRow
            ordertype={isBid ? 'bid' : 'ask'}
            isselected={isSelected ? 1 : 0}
            isnew={isNew ? 1 : 0}
            islimitprice={isInPriceRange ? 1 : 0}
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
        </React.Fragment>
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
      <Spread bids={bids} asks={asks} sx={{ p: { xs: 0.5, sm: 0.75 }, pb: 0 }} />

      <Grid container spacing={0}>
        {/* Buy Orders */}
        <Grid item xs={12} md={6} sx={{ 
          borderRight: { md: `1px solid ${alpha(theme.palette.divider, 0.1)}` },
          borderBottom: { xs: `1px solid ${alpha(theme.palette.divider, 0.1)}`, md: 'none' }
        }}>
          <SectionHeader>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
              <TrendingUpIcon
                sx={{
                  fontSize: '0.65rem',
                  color: theme.palette.success.main
                }}
              />
              <Typography
                variant="subtitle2"
                sx={{
                  color: theme.palette.success.main,
                  fontWeight: 600,
                  fontSize: '0.65rem'
                }}
              >
                Buy
              </Typography>
              <OrderCountChip
                label={bids.length}
                size="small"
                sx={{
                  backgroundColor: alpha(theme.palette.success.main, 0.08),
                  color: theme.palette.success.main
                }}
              />
            </Box>
          </SectionHeader>

          <ModernTable size="small">
            <TableHead>
              <TableRow>
                <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Sum</TableCell>
                <TableCell align="right">Amt</TableCell>
                <TableCell align="right">Bid</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>{buildPriceLevels(bids, ORDER_TYPE_BIDS)}</TableBody>
          </ModernTable>
        </Grid>

        {/* Sell Orders */}
        <Grid item xs={12} md={6}>
          <SectionHeader>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
              <TrendingDownIcon
                sx={{
                  fontSize: '0.65rem',
                  color: theme.palette.error.main
                }}
              />
              <Typography
                variant="subtitle2"
                sx={{
                  color: theme.palette.error.main,
                  fontWeight: 600,
                  fontSize: '0.65rem'
                }}
              >
                Sell
              </Typography>
              <OrderCountChip
                label={asks.length}
                size="small"
                sx={{
                  backgroundColor: alpha(theme.palette.error.main, 0.08),
                  color: theme.palette.error.main
                }}
              />
            </Box>
          </SectionHeader>

          <ModernTable size="small">
            <TableHead>
              <TableRow>
                <TableCell align="left">Ask</TableCell>
                <TableCell align="left">Amt</TableCell>
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
}
