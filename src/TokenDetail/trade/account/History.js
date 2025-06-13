import axios from 'axios';
import { useState, useEffect } from 'react';
import Decimal from 'decimal.js';
import { MD5 } from 'crypto-js';

// Material
import {
  styled,
  alpha,
  useTheme,
  Avatar,
  Box,
  IconButton,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Card,
  CardContent,
  Tooltip
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import HistoryIcon from '@mui/icons-material/History';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

// Loader
import { PuffLoader } from 'react-spinners';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Utils
import { fNumber } from 'src/utils/formatNumber';
import { normalizeCurrencyCodeXummImpl } from 'src/utils/normalizers';
import { formatDateTime } from 'src/utils/formatTime';

// Components
import HistoryToolbar from './HistoryToolbar';
import { useRef } from 'react';

// ----------------------------------------------------------------------

const ModernTable = styled(Table)(({ theme }) => ({
  borderRadius: '12px',
  overflow: 'hidden',
  backgroundColor: theme.palette.background.paper,
  boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.08)}`,
  '& .MuiTableCell-root': {
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    padding: theme.spacing(1.5, 2),
    fontSize: '0.875rem'
  },
  '& .MuiTableHead-root': {
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
    '& .MuiTableCell-root': {
      fontWeight: 600,
      color: theme.palette.text.primary,
      textTransform: 'uppercase',
      fontSize: '0.75rem',
      letterSpacing: '0.5px'
    }
  },
  '& .MuiTableRow-root': {
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: alpha(theme.palette.action.hover, 0.08)
    }
  }
}));

const PriceCell = styled(TableCell)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontWeight: 600,
  fontSize: '0.9rem'
}));

const ValueTypography = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '0.875rem',
  color: theme.palette.text.primary,
  display: 'inline'
}));

const TokenNameChip = styled(Chip)(({ theme }) => ({
  height: '20px',
  fontSize: '0.65rem',
  fontWeight: 500,
  backgroundColor: alpha(theme.palette.secondary.main, 0.08),
  color: theme.palette.secondary.main,
  marginLeft: theme.spacing(0.5),
  '& .MuiChip-label': {
    padding: theme.spacing(0, 0.5)
  }
}));

const AddressLink = styled(Link)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  padding: theme.spacing(0.5, 1),
  borderRadius: '8px',
  backgroundColor: alpha(theme.palette.info.main, 0.08),
  color: theme.palette.info.main,
  textDecoration: 'none',
  fontSize: '0.75rem',
  fontWeight: 500,
  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: alpha(theme.palette.info.main, 0.15),
    border: `1px solid ${alpha(theme.palette.info.main, 0.4)}`,
    textDecoration: 'none',
    transform: 'translateY(-1px)'
  }
}));

const HashLinkContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1)
}));

const HashLink = styled(Link)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  padding: theme.spacing(0.5, 0.75),
  borderRadius: '6px',
  backgroundColor: alpha(theme.palette.primary.main, 0.08),
  color: theme.palette.primary.main,
  textDecoration: 'none',
  fontSize: '0.75rem',
  fontWeight: 500,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.15),
    border: `1px solid ${alpha(theme.palette.primary.main, 0.4)}`,
    textDecoration: 'none'
  }
}));

const ExplorerIconButton = styled(IconButton)(({ theme }) => ({
  padding: theme.spacing(0.25),
  backgroundColor: alpha(theme.palette.background.default, 0.8),
  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
  borderRadius: '4px',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
  }
}));

const EmptyStateContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(4),
  minHeight: '200px',
  backgroundColor: alpha(theme.palette.background.paper, 0.6),
  borderRadius: '12px',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
}));

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(4),
  minHeight: '200px'
}));

const TableContainer = styled(Box)(({ theme }) => ({
  borderRadius: '12px',
  overflow: 'hidden',
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.04)}`,
  marginBottom: theme.spacing(2)
}));

const StickyTableCell = styled(TableCell)(({ theme, scrollleft, darkmode, zindex, leftpos }) => ({
  position: 'sticky',
  zIndex: zindex || 1001,
  left: leftpos || 0,
  backgroundColor: theme.palette.background.paper,
  '&:before': scrollleft
    ? {
        content: '""',
        boxShadow: `inset 10px 0 8px -8px ${alpha(theme.palette.common.black, 0.15)}`,
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: '-1px',
        width: '30px',
        transform: 'translate(100%)',
        transition: 'box-shadow 0.3s ease',
        pointerEvents: 'none'
      }
    : {}
}));

const IndexChip = styled(Chip)(({ theme }) => ({
  height: '24px',
  fontSize: '0.75rem',
  fontWeight: 600,
  backgroundColor: alpha(theme.palette.grey[500], 0.1),
  color: theme.palette.text.secondary,
  '& .MuiChip-label': {
    padding: theme.spacing(0, 0.75)
  }
}));

const TimeChip = styled(Chip)(({ theme }) => ({
  height: '24px',
  fontSize: '0.7rem',
  fontWeight: 500,
  backgroundColor: alpha(theme.palette.info.main, 0.08),
  color: theme.palette.info.main,
  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
  '& .MuiChip-label': {
    padding: theme.spacing(0, 0.75)
  }
}));

// Format number with proper decimal places
const formatNumber = (number) => {
  const num = parseFloat(number);
  if (num === 0) return '0';
  if (num < 0.0001) return num.toExponential(4);
  if (num < 1) return num.toFixed(6);
  if (num < 1000) return num.toFixed(4);
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  }).format(num);
};

// Truncate function with better formatting
function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.substr(0, n - 1) + '...' : str;
}

function getMD5(issuer, currency) {
  return MD5(issuer + '_' + currency).toString();
}

export default function History({ token }) {
  const theme = useTheme();
  const BASE_URL = process.env.API_URL;

  const { accountProfile, darkMode } = useContext(AppContext);
  const accountAddress = accountProfile?.account;

  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(10);
  const [count, setCount] = useState(0);
  const [hists, setHists] = useState([]);

  useEffect(() => {
    function getHistories() {
      const accountAddress = accountProfile?.account;
      if (!accountAddress) return;
      setLoading(true);
      axios
        .get(
          `${BASE_URL}/history?account=${accountAddress}&md5=${token.md5}&page=${page}&limit=${rows}`
        )
        .then((res) => {
          let ret = res.status === 200 ? res.data : undefined;
          if (ret) {
            setCount(ret.count);
            setHists(ret.hists);
          }
        })
        .catch((err) => {
          console.log('Error on getting exchanges!!!', err);
        })
        .then(function () {
          setLoading(false);
        });
    }
    getHistories();
  }, [accountProfile, page, rows]);

  const tableRef = useRef(null);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollLeft(tableRef?.current?.scrollLeft > 0);
    };

    tableRef?.current?.addEventListener('scroll', handleScroll);

    return () => {
      tableRef?.current?.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <Stack spacing={2}>
      {!accountAddress ? (
        <EmptyStateContainer>
          <AccountBalanceWalletIcon
            sx={{
              fontSize: '3rem',
              color: theme.palette.error.main,
              mb: 2,
              opacity: 0.7
            }}
          />
          <Typography variant="h6" color="error" gutterBottom>
            Wallet Not Connected
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Connect your wallet to view your trading history
          </Typography>
        </EmptyStateContainer>
      ) : loading ? (
        <LoadingContainer>
          <Stack alignItems="center" spacing={2}>
            <PuffLoader color={theme.palette.primary.main} size={40} />
            <Typography variant="body2" color="text.secondary">
              Loading trading history...
            </Typography>
          </Stack>
        </LoadingContainer>
      ) : count === 0 ? (
        <EmptyStateContainer>
          <HistoryIcon
            sx={{
              fontSize: '3rem',
              color: theme.palette.text.secondary,
              mb: 2,
              opacity: 0.5
            }}
          />
          <Typography variant="h6" color="text.primary" gutterBottom>
            No Trading History
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            You haven't made any trades with this token yet
          </Typography>
        </EmptyStateContainer>
      ) : (
        <>
          <TableContainer>
            <Box
              ref={tableRef}
              sx={{
                overflow: 'auto',
                maxHeight: '600px',
                '&::-webkit-scrollbar': {
                  width: '8px',
                  height: '8px'
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: alpha(theme.palette.divider, 0.1),
                  borderRadius: '4px'
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: alpha(theme.palette.text.secondary, 0.3),
                  borderRadius: '4px',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.text.secondary, 0.5)
                  }
                }
              }}
            >
              <ModernTable stickyHeader>
                <TableHead>
                  <TableRow>
                    <StickyTableCell
                      align="left"
                      scrollleft={scrollLeft}
                      darkmode={darkMode}
                      zindex={1001}
                      leftpos={0}
                    >
                      #
                    </StickyTableCell>
                    <StickyTableCell
                      align="left"
                      scrollleft={scrollLeft}
                      darkmode={darkMode}
                      zindex={1002}
                      leftpos={hists.length > 0 ? 48 : 40}
                    >
                      Time
                    </StickyTableCell>
                    <TableCell align="left">Price</TableCell>
                    <TableCell align="left">Taker Paid</TableCell>
                    <TableCell align="left">Taker Got</TableCell>
                    <TableCell align="left">Taker</TableCell>
                    <TableCell align="left">Maker</TableCell>
                    <TableCell align="left">Ledger</TableCell>
                    <TableCell align="left">Hash</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {hists.map((row, idx) => {
                    const { _id, maker, taker, seq, paid, got, ledger, hash, time } = row;

                    const paidName = normalizeCurrencyCodeXummImpl(paid.currency);
                    const gotName = normalizeCurrencyCodeXummImpl(got.currency);
                    const md51 = getMD5(paid.issuer, paid.currency);

                    let exch;
                    let name;

                    if (md51 === token.md5) {
                      exch = Decimal.div(got.value, paid.value).toNumber();
                      name = gotName;
                    } else {
                      exch = Decimal.div(paid.value, got.value).toNumber();
                      name = paidName;
                    }

                    const strDateTime = formatDateTime(time);

                    return (
                      <TableRow key={_id}>
                        <StickyTableCell
                          align="left"
                          scrollleft={scrollLeft}
                          darkmode={darkMode}
                          zindex={1001}
                          leftpos={0}
                        >
                          <IndexChip label={idx + page * rows + 1} size="small" />
                        </StickyTableCell>
                        <StickyTableCell
                          align="left"
                          scrollleft={scrollLeft}
                          darkmode={darkMode}
                          zindex={1002}
                          leftpos={48}
                        >
                          <TimeChip label={strDateTime} size="small" />
                        </StickyTableCell>
                        <PriceCell align="left">
                          <ValueTypography>{formatNumber(exch)}</ValueTypography>
                          <TokenNameChip label={truncate(name, 8)} size="small" />
                        </PriceCell>
                        <TableCell align="left">
                          <ValueTypography>{formatNumber(paid.value)}</ValueTypography>
                          <TokenNameChip label={truncate(paidName, 8)} size="small" />
                        </TableCell>
                        <TableCell align="left">
                          <ValueTypography>{formatNumber(got.value)}</ValueTypography>
                          <TokenNameChip label={truncate(gotName, 8)} size="small" />
                        </TableCell>
                        <TableCell align="left">
                          <AddressLink
                            target="_blank"
                            href={`https://bithomp.com/explorer/${taker}`}
                            rel="noreferrer noopener nofollow"
                          >
                            {truncate(taker, 12)}
                            <OpenInNewIcon sx={{ fontSize: '0.75rem' }} />
                          </AddressLink>
                        </TableCell>
                        <TableCell align="left">
                          <AddressLink
                            target="_blank"
                            href={`https://bithomp.com/explorer/${maker}`}
                            rel="noreferrer noopener nofollow"
                          >
                            {truncate(maker, 12)}
                            <OpenInNewIcon sx={{ fontSize: '0.75rem' }} />
                          </AddressLink>
                        </TableCell>
                        <TableCell align="left">
                          <Chip
                            label={ledger}
                            size="small"
                            variant="outlined"
                            sx={{
                              fontSize: '0.75rem',
                              height: '24px'
                            }}
                          />
                        </TableCell>
                        <TableCell align="left">
                          <HashLinkContainer>
                            <HashLink
                              target="_blank"
                              href={`https://bithomp.com/explorer/${hash}`}
                              rel="noreferrer noopener nofollow"
                            >
                              {truncate(hash, 16)}
                            </HashLink>
                            <Tooltip title="View on Bithomp Explorer" arrow>
                              <ExplorerIconButton
                                component="a"
                                href={`https://bithomp.com/explorer/${hash}`}
                                target="_blank"
                                rel="noreferrer noopener nofollow"
                                size="small"
                              >
                                <Avatar
                                  alt="Bithomp Explorer"
                                  src="/static/bithomp.ico"
                                  sx={{ width: 16, height: 16 }}
                                />
                              </ExplorerIconButton>
                            </Tooltip>
                            <Tooltip title="View on XRPL Explorer" arrow>
                              <ExplorerIconButton
                                component="a"
                                href={`https://livenet.xrpl.org/transactions/${hash}`}
                                target="_blank"
                                rel="noreferrer noopener nofollow"
                                size="small"
                              >
                                <Avatar
                                  alt="XRPL Explorer"
                                  src="/static/livenetxrplorg.ico"
                                  sx={{ width: 16, height: 16 }}
                                />
                              </ExplorerIconButton>
                            </Tooltip>
                          </HashLinkContainer>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </ModernTable>
            </Box>
          </TableContainer>

          {count > 0 && (
            <HistoryToolbar
              count={count}
              rows={rows}
              setRows={setRows}
              page={page}
              setPage={setPage}
            />
          )}
        </>
      )}
    </Stack>
  );
}
