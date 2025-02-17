import axios from 'axios';
import { useState, useEffect, useRef } from 'react';
import Decimal from 'decimal.js';
import CryptoJS from 'crypto-js';
// Material
import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
// Loader
import { PulseLoader } from 'react-spinners';
// Utils
import { normalizeCurrencyCodeXummImpl } from 'src/utils/normalizers';
// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';
// Components
import ListToolbar from 'src/account/ListToolbar';
import TrustLineRow from './TrustLineRow';
import useWebSocket from 'react-use-websocket';
import { selectMetrics, update_metrics } from 'src/redux/statusSlice';
import { useDispatch, useSelector } from 'react-redux';

function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.substr(0, n - 1) + ' ...' : str;
}

function truncateAccount(str) {
  if (!str) return '';
  return str.slice(0, 9) + '...' + str.slice(-9);
}

const trustlineFlags = {
  lsfLowReserve: 0x00010000,
  lsfHighReserve: 0x00020000,
  lsfLowAuth: 0x00040000,
  lsfHighAuth: 0x00080000,
  lsfLowNoRipple: 0x00100000,
  lsfHighNoRipple: 0x00200000,
  lsfLowFreeze: 0x00400000,
  lsfHighFreeze: 0x00800000
};

export default function TrustLines({ account, onUpdateTotalValue }) {
  const BASE_URL = process.env.API_URL;

  const theme = useTheme();
  const { accountProfile, openSnackbar, sync, activeFiatCurrency, darkMode } =
    useContext(AppContext);
  const isLoggedIn = accountProfile && accountProfile.account;
  const isMobile = useMediaQuery('(max-width:600px)');
  const dispatch = useDispatch();
  const metrics = useSelector(selectMetrics);
  const exchRate = metrics[activeFiatCurrency];

  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(50);
  const [total, setTotal] = useState(0);
  const [lines, setLines] = useState([]);
  const [totalValue, setTotalValue] = useState(0);

  const WSS_FEED_URL = 'wss://api.xrpl.to/ws/sync';

  const { sendJsonMessage, getWebSocket } = useWebSocket(WSS_FEED_URL, {
    onOpen: () => {},
    onClose: () => {},
    shouldReconnect: (closeEvent) => true,
    onMessage: (event) => processMessages(event)
  });

  const processMessages = (event) => {
    try {
      var t1 = Date.now();
      const json = JSON.parse(event.data);
      dispatch(update_metrics(json));
    } catch (err) {
      console.error(err);
    }
  };

  const getLines = () => {
    setLoading(true);
    axios
      .get(`https://api.xrpl.to/api/trustlines?account=${account}&includeRates=true`)
      .then((res) => {
        let ret = res.status === 200 ? res.data : undefined;
        if (ret && ret.success) {
          setTotal(ret.total);
          setLines(ret.trustlines);
          const totalValue = ret.trustlines.reduce((acc, line) => {
            const value = parseFloat(line.value) || 0;
            return acc + value;
          }, 0);
          setTotalValue(totalValue);
        }
      })
      .catch((err) => {
        console.log('Error on getting account lines!!!', err);
      })
      .then(function () {
        setLoading(false);
      });
  };

  useEffect(() => {
    getLines();
  }, [account, sync, page, rows]);

  useEffect(() => {
    if (lines.length > 0) {
      const sum = lines.reduce((acc, line) => {
        const value = parseFloat(line.value) || 0;
        return acc + value;
      }, 0);
      setTotalValue(sum);
      if (typeof onUpdateTotalValue === 'function') {
        onUpdateTotalValue(sum);
      }
    } else {
      setTotalValue(0);
      if (typeof onUpdateTotalValue === 'function') {
        onUpdateTotalValue(0);
      }
    }
  }, [lines, onUpdateTotalValue]);

  const tableRef = useRef(null);

  return (
    <Box>
      {loading ? (
        <Stack alignItems="center">
          <PulseLoader color={darkMode ? '#007B55' : '#5569ff'} size={10} />
        </Stack>
      ) : (
        lines &&
        lines.length === 0 && (
          <Stack alignItems="center" sx={{ mt: 2, mb: 1 }}>
            <Typography variant="s6" color="primary">
              <ErrorOutlineIcon fontSize="small" sx={{ mr: '5px' }} />[ No TrustLines ]
            </Typography>
          </Stack>
        )
      )}

      {total > 0 && (
        <Box
          sx={{
            display: 'flex',
            gap: 0.5,
            overflow: 'auto',
            width: '100%',
            '& > *': {
              scrollSnapAlign: 'center'
            },
            '::-webkit-scrollbar': { display: 'none' },
            mt: 1
          }}
          ref={tableRef}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    py: 1,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    borderBottom: `1px solid ${
                      darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'
                    }`
                  }}
                >
                  Currency
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    display: { xs: 'none', sm: 'table-cell' },
                    py: 1,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    borderBottom: `1px solid ${
                      darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'
                    }`
                  }}
                >
                  Balance
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    py: 1,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    borderBottom: `1px solid ${
                      darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'
                    }`
                  }}
                >
                  Value
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    display: { xs: 'none', md: 'table-cell' },
                    py: 1,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    borderBottom: `1px solid ${
                      darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'
                    }`
                  }}
                >
                  % Owned
                </TableCell>
                {isLoggedIn && accountProfile?.account === account && (
                  <TableCell
                    align="center"
                    sx={{
                      py: 1,
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      borderBottom: `1px solid ${
                        darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'
                      }`
                    }}
                  >
                    Action
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {lines.map((row, idx) => {
                const {
                  currency,
                  issuer,
                  balance,
                  limit,
                  rate,
                  value,
                  md5,
                  percentOwned,
                  verified,
                  origin,
                  user
                } = row;
                const currencyName = normalizeCurrencyCodeXummImpl(currency);

                return (
                  <TrustLineRow
                    key={idx}
                    currencyName={currencyName}
                    currency={currency}
                    balance={balance}
                    md5={md5}
                    exchRate={exchRate}
                    issuer={issuer}
                    account={account}
                    limit={limit}
                    percentOwned={percentOwned}
                    verified={verified}
                    rate={rate}
                    value={value}
                    origin={origin}
                    user={user}
                  />
                );
              })}
            </TableBody>
          </Table>
        </Box>
      )}
      {total > 0 && (
        <Box sx={{ px: 0.5, mt: 0.5 }}>
          <ListToolbar count={total} rows={rows} setRows={setRows} page={page} setPage={setPage} />
        </Box>
      )}
    </Box>
  );
}
