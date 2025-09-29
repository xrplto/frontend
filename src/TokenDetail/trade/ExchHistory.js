import axios from 'axios';
import { MD5 } from 'crypto-js';
import Decimal from 'decimal.js-light';
import { useState, useEffect } from 'react';

// Material
import {
  styled,
  useTheme,
  alpha,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Box,
  Chip,
  useMediaQuery
} from '@mui/material';
import { tableCellClasses } from '@mui/material/TableCell';

// Material Icons
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

// Utils
import { fNumber } from 'src/utils/formatters';
import { normalizeCurrencyCode } from 'src/utils/normalizers';
import NumberTooltip from 'src/components/NumberTooltip';

// Styled Components
const HistoryContainer = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.6)} 0%, ${alpha(
    theme.palette.background.paper,
    0.3
  )} 100%)`,
  backdropFilter: 'blur(10px)',
  borderRadius: '8px',
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  overflow: 'hidden',
  position: 'relative',
  height: '100%',
  display: 'flex',
  flexDirection: 'column'
}));

const CompactHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1, 1.5),
  background: alpha(theme.palette.background.paper, 0.4),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  flexShrink: 0,
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(0.75, 1)
  }
}));

const TableContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  overflow: 'auto',
  '&::-webkit-scrollbar': {
    width: '4px',
    height: '4px'
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: alpha(theme.palette.background.paper, 0.1)
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: alpha(theme.palette.divider, 0.3),
    borderRadius: '2px'
  }
}));

const ModernTable = styled(Table)(({ theme }) => ({
  [`& .${tableCellClasses.root}`]: {
    borderBottom: 'none',
    padding: theme.spacing(0.5, 0.75),
    fontSize: '0.7rem',
    lineHeight: 1.2,
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(0.4, 0.5),
      fontSize: '0.65rem'
    }
  },
  [`& .${tableCellClasses.head}`]: {
    backgroundColor: alpha(theme.palette.background.paper, 0.6),
    fontWeight: 600,
    fontSize: '0.65rem',
    color: alpha(theme.palette.text.secondary, 0.8),
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
    padding: theme.spacing(0.75, 0.75),
    position: 'sticky',
    top: 0,
    zIndex: 1,
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.6rem',
      padding: theme.spacing(0.5, 0.5)
    }
  }
}));

const TradeRow = styled(TableRow)(({ theme, tradetype }) => {
  const isUp = tradetype === 'up';
  const baseColor = isUp ? theme.palette.success.main : theme.palette.error.main;

  return {
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    borderRadius: theme.spacing(0.5),
    margin: theme.spacing(0, 0.5),
    '&:hover': {
      background: alpha(baseColor, 0.1),
      transform: 'translateX(1px)'
    },
    '& .MuiTableCell-root': {
      color: baseColor,
      fontWeight: 500,
      borderRadius: theme.spacing(0.5)
    }
  };
});

const TradeCountChip = styled(Chip)(({ theme }) => ({
  height: '18px',
  fontSize: '0.6rem',
  fontWeight: 600,
  borderRadius: '9px',
  '& .MuiChip-label': {
    padding: theme.spacing(0, 0.5)
  }
}));

const PriceCell = styled(TableCell)(({ theme, tradetype }) => {
  const isUp = tradetype === 'up';
  const color = isUp ? theme.palette.success.main : theme.palette.error.main;

  return {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    color: `${color} !important`,
    fontWeight: '600 !important',
    fontSize: '0.75rem !important'
  };
});

const TimeCell = styled(TableCell)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  color: `${alpha(theme.palette.text.secondary, 0.8)} !important`,
  fontSize: '0.65rem !important'
}));

// ----------------------------------------------------------------------

function getMD5(issuer, currency) {
  return MD5(issuer + '_' + currency).toString();
}

function convertTrade(md5, trades) {
  if (!trades || trades.length < 1) return [];

  let prevLedger = 0;
  let prevExch = 0;
  let ctrades = [];
  let d1 = 0;
  let d2 = 0;

  for (var i = trades.length - 1; i >= 0; i--) {
    const t = trades[i];
    const { _id, paid, got, time, ledger } = t;
    const md51 = getMD5(paid.issuer, paid.currency);

    let exch;
    let amount;
    let direction = 'up';

    if (ledger !== prevLedger) {
      if (ledger > 0) {
        prevExch = new Decimal(d1).div(d2).toNumber();
      }
      d1 = 0;
      d2 = 0;
    }

    if (md5 === md51) {
      exch = new Decimal(got.value).div(paid.value).toNumber();
      amount = fNumber(paid.value);
      d1 = Decimal.add(got.value, d1).toString();
      d2 = Decimal.add(paid.value, d2).toString();
    } else {
      exch = new Decimal(paid.value).div(got.value).toNumber();
      amount = fNumber(got.value);
      d1 = Decimal.add(paid.value, d1).toString();
      d2 = Decimal.add(got.value, d2).toString();
    }

    direction = exch > prevExch ? 'up' : 'down';
    prevLedger = ledger;

    const data = {
      _id,
      exch,
      amount,
      direction,
      time
    };

    ctrades.push(data);
  }

  return ctrades.reverse();
}

export default function ExchHistory({ pair, md5 }) {
  const BASE_URL = process.env.API_URL;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [tradeExchs, setTradeExchs] = useState([]);

  useEffect(() => {
    function getTradeExchanges() {
      if (!pair) return;

      axios
        .get(
          `${BASE_URL}/last_trades?md5=${md5}&issuer=${pair.curr2.issuer}&currency=${pair.curr2.currency}&limit=40`
        )
        .then((res) => {
          let ret = res.status === 200 ? res.data : undefined;
          if (ret) {
            setTradeExchs(convertTrade(md5, ret.trades));
          }
        })
        .catch((err) => {
        });
    }

    getTradeExchanges();
    const timer = setInterval(getTradeExchanges, 10000);

    return () => {
      clearInterval(timer);
    };
  }, [pair, md5, BASE_URL]);

  return (
    <HistoryContainer>
      {/* Compact Header */}
      <CompactHeader>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
          <AccessTimeIcon
            sx={{
              fontSize: { xs: '0.8rem', sm: '0.9rem' },
              color: theme.palette.info.main
            }}
          />
          <Typography
            variant="subtitle2"
            sx={{
              color: theme.palette.text.primary,
              fontWeight: 600,
              fontSize: { xs: '0.7rem', sm: '0.8rem' }
            }}
          >
            Recent Trades
          </Typography>
          <TradeCountChip
            label={tradeExchs.length}
            size="small"
            sx={{
              backgroundColor: alpha(theme.palette.info.main, 0.1),
              color: theme.palette.info.main,
              border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`
            }}
          />
        </Box>
      </CompactHeader>

      {/* Trade History Table */}
      <TableContainer>
        <ModernTable size="small">
          <TableHead>
            <TableRow>
              <TableCell align="left">Price</TableCell>
              <TableCell align="left">Amt</TableCell>
              <TableCell align="left">Time</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tradeExchs.slice(0, 30).map((row) => {
              const { _id, exch, amount, direction, time } = row;
              const nDate = new Date(time);
              const hour = nDate.getHours().toLocaleString('en-US', {
                minimumIntegerDigits: 2,
                useGrouping: false
              });
              const min = nDate.getMinutes().toLocaleString('en-US', {
                minimumIntegerDigits: 2,
                useGrouping: false
              });
              const sec = nDate.getSeconds().toLocaleString('en-US', {
                minimumIntegerDigits: 2,
                useGrouping: false
              });
              const strTime = `${hour}:${min}:${sec}`;

              return (
                <TradeRow key={_id} tradetype={direction}>
                  <PriceCell align="left" tradetype={direction}>
                    {direction === 'up' ? (
                      <TrendingUpIcon sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }} />
                    ) : (
                      <TrendingDownIcon sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }} />
                    )}
                    <span>{fNumber(exch)}</span>
                  </PriceCell>
                  <TableCell
                    align="left"
                    sx={{ fontWeight: 500, fontSize: { xs: '0.65rem', sm: '0.7rem' } }}
                  >
                    {amount}
                  </TableCell>
                  <TimeCell align="left">
                    {!isMobile && <AccessTimeIcon sx={{ fontSize: '0.6rem' }} />}
                    {strTime}
                  </TimeCell>
                </TradeRow>
              );
            })}
          </TableBody>
        </ModernTable>
      </TableContainer>

      {/* Empty State */}
      {tradeExchs.length === 0 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '120px',
            color: 'text.secondary'
          }}
        >
          <Typography variant="body2" color="text.secondary">
            No recent trades
          </Typography>
        </Box>
      )}
    </HistoryContainer>
  );
}
