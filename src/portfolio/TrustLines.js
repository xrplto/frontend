import axios from 'axios';
import { useState, useEffect, useRef } from 'react';
import Decimal from 'decimal.js';
import CryptoJS from 'crypto-js';
// Material
import { withStyles } from '@mui/styles';

import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery
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
  //return (str.length > n) ? str.substr(0, n-1) + '&hellip;' : str;
  return str.length > n ? str.substr(0, n - 1) + ' ...' : str;
}

function truncateAccount(str) {
  if (!str) return '';
  return str.slice(0, 9) + '...' + str.slice(-9);
}

const trustlineFlags = {
  // Flag Name	 Hex Value	Corresponding TrustSet Flag	Description
  lsfLowReserve: 0x00010000, // [NONE],         This RippleState object contributes to the low account's owner reserve.
  lsfHighReserve: 0x00020000, // [NONE],         This RippleState object contributes to the high account's owner reserve.
  lsfLowAuth: 0x00040000, // tfSetAuth,      The low account has authorized the high account to hold tokens issued by the low account.
  lsfHighAuth: 0x00080000, // tfSetAuth,      The high account has authorized the low account to hold tokens issued by the high account.
  lsfLowNoRipple: 0x00100000, // tfSetNoRipple,	The low account has disabled rippling from this trust line.
  lsfHighNoRipple: 0x00200000, // tfSetNoRipple,	The high account has disabled rippling from this trust line.
  lsfLowFreeze: 0x00400000, // tfSetFreeze,	The low account has frozen the trust line, preventing the high account from transferring the asset.
  lsfHighFreeze: 0x00800000 // tfSetFreeze,	The high account has frozen the trust line, preventing the low account from transferring the asset.
};

export default function TrustLines({ account }) {
  const BASE_URL = 'https://api.xrpl.to/api';

  const { accountProfile, openSnackbar, sync, activeFiatCurrency, darkMode } =
    useContext(AppContext);
  const isLoggedIn = accountProfile && accountProfile.account;
  const isMobile = useMediaQuery('(max-width:600px)');
  const dispatch = useDispatch();
  const metrics = useSelector(selectMetrics);
  const exchRate = metrics[activeFiatCurrency];


  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(10);
  const [total, setTotal] = useState(0);
  const [lines, setLines] = useState([]);

  const WSS_FEED_URL = 'wss://api.xrpl.to/ws/sync';

  const { sendJsonMessage, getWebSocket } = useWebSocket(WSS_FEED_URL, {
        onOpen: () => {},
        onClose: () => {},
        shouldReconnect: (closeEvent) => true,
        onMessage: (event) =>  processMessages(event),
        // reconnectAttempts: 10,
        // reconnectInterval: 3000,
    });

    const processMessages = (event) => {
        try {
            var t1 = Date.now();

            const json = JSON.parse(event.data);

            dispatch(update_metrics(json));
            // console.log(`${dt} ms`);
        } catch(err) {
            console.error(err);
        }
    };

  const getLines = () => {
    setLoading(true);
    // https://api.xrpl.to/api/account/lines/r22G1hNbxBVapj2zSmvjdXyKcedpSDKsm
    axios
      .get(`${BASE_URL}/account/lines/${account}?page=${page}&limit=${rows}`)
      .then((res) => {
        let ret = res.status === 200 ? res.data : undefined;
        if (ret) {
          setTotal(ret.total);
          setLines(ret.lines);
        }
      })
      .catch((err) => {
        console.log('Error on getting account lines!!!', err);
      })
      .then(function () {
        // always executed
        setLoading(false);
      });
  };

  useEffect(() => {
    getLines();
  }, [account, sync, page, rows]);

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
              <ErrorOutlineIcon fontSize="small" sx={{ mr: '5px' }} />
              [ No TrustLines ]
            </Typography>
          </Stack>
        )
      )}

      {total > 0 && (
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
            '::-webkit-scrollbar': { display: 'none' },
            mt: 2
          }}
          ref={tableRef}
        >
          <Table
            stickyHeader
            size={'small'}
            sx={{
              '& .MuiTableCell-root': {
                borderBottom: 'none',
                boxShadow: darkMode
                  ? 'inset 0 -1px 0 rgba(68 67 67), inset 0 -1px 0 rgba(255, 255, 255, 0.1)'
                  : 'inset 0 -1px 0 #dadee3'
              }
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell
                  align="left"
                >
                  #
                </TableCell>
                <TableCell align="left">Currency</TableCell>
                <TableCell align="left" sx={{ display: isMobile ? "none" : "table-cell" }}>Balance</TableCell>
                <TableCell align="right">Estimated Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lines.map((row, idx) => {
                const { _id, Balance, HighLimit, LowLimit } = row;
                const currency = Balance.currency;
                const currencyName = normalizeCurrencyCodeXummImpl(currency);
                let balance = 0;
                if (account === HighLimit.issuer) {
                  balance = Decimal.abs(Balance.value).toString();
                } else {
                  balance = Balance.value;
                }

                // const strCreatedTime = formatDateTime(ctime);
                // peer, currency, peer limit, owner limit, balance, rippling
                let issuer = null;
                let _balance = Number.parseFloat(Balance.value);
                let highLimit = Number.parseFloat(HighLimit.value);
                let lowLimit = Number.parseFloat(LowLimit.value);
                if (_balance > 0) {
                  issuer = HighLimit.issuer;
                  account = LowLimit.issuer;
                } else if (_balance < 0) {
                  issuer = LowLimit.issuer;
                  account = HighLimit.issuer;
                } else {
                  // balance is zero. check who has a limit set
                  if (highLimit > 0 && lowLimit == 0) {
                    issuer = LowLimit.issuer;
                    account = HighLimit.issuer;
                  } else if (lowLimit > 0 && highLimit == 0) {
                    issuer = HighLimit.issuer;
                    account = LowLimit.issuer;
                  } else {
                    // can not determine issuer!
                    issuer = null;
                    account = null;
                  }
                }

                let md5 = null;

                if (issuer && currency)
                  md5 = CryptoJS.MD5(issuer + "_" + currency).toString();
                return (
                  <TrustLineRow
                    key={_id}
                    idx={idx + page * rows + 1}
                    currencyName={currencyName}
                    balance={balance}
                    md5={md5}
                    exchRate={exchRate}
                  />
                );
              })}
            </TableBody>
          </Table>
        </Box>
      )}
      {total > 0 && (
        <Box sx={{ px: 1 }}>
          <ListToolbar
            count={total}
            rows={rows}
            setRows={setRows}
            page={page}
            setPage={setPage}
          />
        </Box>
      )}
    </Box>
  );
}
