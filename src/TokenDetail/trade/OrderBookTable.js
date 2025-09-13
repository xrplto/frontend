import Decimal from 'decimal.js-light';
import React, { memo } from 'react';

// Material
import {
  styled,
  useTheme,
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { tableCellClasses } from '@mui/material/TableCell';

// Utils
import { fNumber } from 'src/utils/formatNumber';
import NumberTooltip from 'src/components/NumberTooltip';
import { calculateSpread } from 'src/utils/orderbookService';

// Styled Components
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

const OrderBookTable = memo(function OrderBookTable({ 
  levels, 
  orderType, 
  pair, 
  selected, 
  limitPrice, 
  isBuyOrder,
  onMouseOver, 
  onMouseLeave, 
  onClick,
  getIndicatorProgress,
  allBids = [],
  allAsks = []
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Calculate spread (currently displayed in parent panel)
  const spread = calculateSpread(allBids, allAsks);

  const isBid = orderType === ORDER_TYPE_BIDS;
  // For UI: display asks in descending order so the lowest ask is at the bottom
  const visibleLevels = React.useMemo(() => (isBid ? levels : [...levels].slice().reverse()), [isBid, levels]);
  const formatNumber = (number) => new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8
  }).format(number);

  const buildPriceLevels = () => {
    // Display all offers without limiting
    return visibleLevels.map((level, idx) => {
      const price = fNumber(level.price);
      const avgPrice = fNumber(level.avgPrice);
      const amount = fNumber(level.amount);
      const sumAmount = fNumber(level.sumAmount);
      const sumValue = fNumber(level.sumValue);
      const isNew = level.isNew;
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
      // With both sides displayed in descending order, insertion logic is uniform:
      // place marker where prev.price >= limitPrice > curr.price
      const showInsertionPoint = Boolean(
        limitPrice && limitPrice > 0 && ((isBuyOrder && isBid) || (!isBuyOrder && !isBid)) && (
          (idx === 0 && limitPrice > level.price) ||
          (idx > 0 && visibleLevels[idx - 1] && visibleLevels[idx - 1].price >= limitPrice && limitPrice > level.price)
        )
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
                → Your {isBuyOrder ? 'buy' : 'sell'} order @ {limitPrice || '0'}
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
            onMouseOver={(e) => onMouseOver(e, idx)}
            onMouseLeave={(e) => onMouseLeave(e, idx)}
            onClick={(e) => onClick(e, idx)}
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

  return (
    <Box>
      <ModernTable size="small">
        <TableHead>
          <TableRow>
            {isBid ? (
              <>
                <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Sum</TableCell>
                <TableCell align="right">Amt</TableCell>
                <TableCell align="right">Bid</TableCell>
              </>
            ) : (
              <>
                <TableCell align="left">Ask</TableCell>
                <TableCell align="left">Amt</TableCell>
                <TableCell align="left" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Sum</TableCell>
              </>
            )}
          </TableRow>
        </TableHead>
        <TableBody>{buildPriceLevels()}</TableBody>
      </ModernTable>
    </Box>
  );
});

export default OrderBookTable;
