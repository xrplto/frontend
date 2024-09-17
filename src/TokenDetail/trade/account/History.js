import axios from 'axios';
import { useState, useEffect } from 'react';
import Decimal from 'decimal.js';
import { MD5 } from 'crypto-js';

// Material
import { withStyles } from '@mui/styles';
import {
  styled,
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
  alpha,
  Chip,
  Tooltip
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LaunchIcon from '@mui/icons-material/Launch';

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
const CancelTypography = withStyles((theme) => ({
  root: {
    color: theme.palette.error.main,
    borderRadius: '6px',
    border: `0.05em solid ${theme.palette.error.main}`,
    //fontSize: '0.5rem',
    lineHeight: '1',
    paddingLeft: '3px',
    paddingRight: '3px'
  }
}))(Typography);



const BuyTypography = withStyles({
  root: {
    color: '#007B55',
    borderRadius: '6px',
    border: '0.05em solid #007B55',
    //fontSize: '0.5rem',
    lineHeight: '1',
    paddingLeft: '3px',
    paddingRight: '3px'
  }
})(Typography);

const SellTypography = withStyles({
  root: {
    color: '#B72136',
    borderRadius: '6px',
    border: '0.05em solid #B72136',
    //fontSize: '0.5rem',
    lineHeight: '1',
    paddingLeft: '3px',
    paddingRight: '3px'
  }
})(Typography);

const ConnectWalletContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-end',
  height: '10vh'
});

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  fontWeight: 'bold',
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: alpha(theme.palette.action.hover, 0.04),
  },
  '&:hover': {
    backgroundColor: alpha(theme.palette.action.hover, 0.08),
  },
}));

// ----------------------------------------------------------------------

function truncate(str, n) {
  if (!str) return '';
  //return (str.length > n) ? str.substr(0, n-1) + '&hellip;' : str;
  return str.length > n ? str.substr(0, n - 1) + ' ...' : str;
}

function getMD5(issuer, currency) {
  return MD5(issuer + '_' + currency).toString();
}

export default function History({ token }) {
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
      // https://api.xrpl.to/api/history?md5=c9ac9a6c44763c1bd9ccc6e47572fd26&page=0&limit=10
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
          // always executed
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
    <Box sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: 3 }}>
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          py: 1,
          overflow: 'auto',
          width: '100%',
          '& > *': {
            scrollSnapAlign: 'center'
          },
          '::-webkit-scrollbar': { display: 'none' }
        }}
        ref={tableRef}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <StyledTableCell align="left" sx={{ position: 'sticky', zIndex: 1001, left: 0 }}>
                #
              </StyledTableCell>
              <StyledTableCell align="left" sx={{ position: 'sticky', zIndex: 1002, left: hists.length > 0 ? 48 : 40 }}>
                Time
              </StyledTableCell>
              <StyledTableCell align="left">Price</StyledTableCell>
              <StyledTableCell align="left">Taker Paid</StyledTableCell>
              <StyledTableCell align="left">Taker Got</StyledTableCell>
              <StyledTableCell align="left">Taker</StyledTableCell>
              <StyledTableCell align="left">Maker</StyledTableCell>
              <StyledTableCell align="left">Ledger</StyledTableCell>
              <StyledTableCell align="left">Hash</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {hists.map((row, idx) => {
              const {
                _id,
                maker,
                taker,
                seq,
                paid,
                got,
                ledger,
                hash,
                time
              } = row;

              const paidName = normalizeCurrencyCodeXummImpl(paid.currency);
              const gotName = normalizeCurrencyCodeXummImpl(got.currency);
              const md51 = getMD5(paid.issuer, paid.currency);
              // const md52 = getMD5(got.issuer, got.currency);

              let exch;
              let name;

              if (md51 === token.md5) {
                // volume = got.value;
                exch = Decimal.div(got.value, paid.value).toNumber();
                name = gotName;
              } else {
                // volume = paid.value;
                exch = Decimal.div(paid.value, got.value).toNumber();
                name = paidName;
              }

              const strDateTime = formatDateTime(time);

              return (
                <StyledTableRow key={_id}>
                  <TableCell align="left" sx={{ position: 'sticky', zIndex: 1001, left: 0 }}>
                    <Typography variant="subtitle2">{idx + page * rows + 1}</Typography>
                  </TableCell>
                  <TableCell align="left" sx={{ position: 'sticky', zIndex: 1002, left: 48 }}>
                    <Tooltip title={strDateTime}>
                      <Typography variant="caption">{formatDateTime(time, 'short')}</Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="left">
                    <Chip
                      label={`${fNumber(exch)} ${name}`}
                      color={exch > 0 ? 'success' : 'error'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="left">
                    {fNumber(paid.value)}{' '}
                    <Typography variant="caption">{paidName}</Typography>
                  </TableCell>

                  <TableCell align="left">
                    {fNumber(got.value)}{' '}
                    <Typography variant="caption">{gotName}</Typography>
                  </TableCell>

                  <TableCell align="left">
                    <Link
                      // underline="none"
                      // color="inherit"
                      target="_blank"
                      href={`https://bithomp.com/explorer/${taker}`}
                      rel="noreferrer noopener nofollow"
                    >
                      {truncate(taker, 12)}
                    </Link>
                  </TableCell>

                  <TableCell align="left">
                    <Link
                      // underline="none"
                      // color="inherit"
                      target="_blank"
                      href={`https://bithomp.com/explorer/${maker}`}
                      rel="noreferrer noopener nofollow"
                    >
                      {truncate(maker, 12)}
                    </Link>
                  </TableCell>
                  <TableCell align="left">{ledger}</TableCell>
                  <TableCell align="left">
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="View transaction details">
                        <IconButton
                          size="small"
                          href={`https://xrpscan.com/tx/${hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <LaunchIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Typography variant="caption">
                        {truncate(hash, 8)}
                      </Typography>
                    </Stack>
                  </TableCell>
                </StyledTableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
      {!accountAddress ? (
        <ConnectWalletContainer>
          <ErrorOutlineIcon fontSize='small' sx={{ mr: '5px' }} color="error"/>
          <Typography variant="subtitle2" color="error">
            Connect your wallet to access data.
          </Typography>
        </ConnectWalletContainer>
      ) : count > 0 ? (
        <HistoryToolbar
          count={count}
          rows={rows}
          setRows={setRows}
          page={page}
          setPage={setPage}
        />
      ) : loading ? (
        <Stack alignItems="center" sx={{ mt: 5, mb: 5 }}>
          <PuffLoader color={darkMode ? '#007B55' : '#5569ff'} size={35} sx={{ mt: 5, mb: 5 }} />

        </Stack>
      ) : (
        <ConnectWalletContainer>
          <ErrorOutlineIcon fontSize="small" sx={{ mr: '5px' }} color="error" />
          <Typography variant="subtitle2" color="error">
            No Trading History
          </Typography>
        </ConnectWalletContainer>
      )}
    </Box>
  );
}
