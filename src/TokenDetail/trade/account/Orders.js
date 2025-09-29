import axios from 'axios';
import PropTypes from 'prop-types';
import { useState, useEffect, useMemo } from 'react';
import Decimal from 'decimal.js-light';
// Material
import { styled, alpha, useTheme } from '@mui/material';

import {
  Avatar,
  Box,
  IconButton,
  Link,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Card,
  CardContent
} from '@mui/material';
import { tableCellClasses } from '@mui/material/TableCell';
import CancelIcon from '@mui/icons-material/Cancel';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ShowChartIcon from '@mui/icons-material/ShowChart';

// Loader
import { PuffLoader } from 'react-spinners';

// Utils
import { checkExpiration } from 'src/utils/helpers';
import { normalizeCurrencyCode } from 'src/utils/parseUtils';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Lazy load XRPL dependencies for device authentication
let Client, Wallet, CryptoJS;

// Load dependencies dynamically
const loadXRPLDependencies = async () => {
  if (!Client) {
    const xrpl = await import('xrpl');
    Client = xrpl.Client;
    Wallet = xrpl.Wallet;
  }
  if (!CryptoJS) {
    CryptoJS = await import('crypto-js');
  }
};

// Device authentication wallet helpers
const generateSecureDeterministicWallet = (credentialId, accountIndex, userEntropy = '') => {
  const entropyString = `passkey-wallet-${credentialId}-${accountIndex}-${userEntropy}`;
  const seedHash = CryptoJS.PBKDF2(entropyString, `salt-${credentialId}`, {
    keySize: 256/32,
    iterations: 100000
  }).toString();
  const privateKeyHex = seedHash.substring(0, 64);
  return new Wallet(privateKeyHex);
};

const getDeviceWallet = (accountProfile) => {
  if (accountProfile?.wallet_type === 'device' && accountProfile?.deviceKeyId && typeof accountProfile?.accountIndex === 'number') {
    return generateSecureDeterministicWallet(accountProfile.deviceKeyId, accountProfile.accountIndex);
  }
  return null;
};

// Components
import QRDialog from 'src/components/QRDialog';
import { useRef } from 'react';

// ----------------------------------------------------------------------

const ModernTable = styled(Table)(({ theme }) => ({
  borderRadius: '12px',
  overflow: 'hidden',
  backgroundColor: theme.palette.background.paper,
  boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.08)}`,
  tableLayout: 'fixed',
  width: '100%',
  '& .MuiTableCell-root': {
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    padding: theme.spacing(1, 0.5),
    fontSize: '0.75rem'
  },
  '& .MuiTableHead-root': {
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
    '& .MuiTableCell-root': {
      fontWeight: 600,
      color: theme.palette.text.primary,
      textTransform: 'uppercase',
      fontSize: '0.7rem',
      letterSpacing: '0.3px'
    }
  },
  '& .MuiTableRow-root': {
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: alpha(theme.palette.action.hover, 0.08)
    }
  }
}));

const OrderTypeChip = styled(Chip)(({ theme, ordertype }) => ({
  height: '24px',
  fontSize: '0.7rem',
  fontWeight: 600,
  borderRadius: '12px',
  minWidth: '50px',
  backgroundColor:
    ordertype === 'buy'
      ? alpha(theme.palette.success.main, 0.1)
      : alpha(theme.palette.error.main, 0.1),
  color: ordertype === 'buy' ? theme.palette.success.main : theme.palette.error.main,
  border: `1px solid ${
    ordertype === 'buy'
      ? alpha(theme.palette.success.main, 0.3)
      : alpha(theme.palette.error.main, 0.3)
  }`,
  '& .MuiChip-label': {
    padding: theme.spacing(0, 1),
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5)
  }
}));

const PriceCell = styled(TableCell)(({ theme, ordertype }) => ({
  color: ordertype === 'buy' ? theme.palette.success.main : theme.palette.error.main,
  fontWeight: 600,
  fontSize: '0.9rem'
}));

const ValueTypography = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '0.875rem',
  color: theme.palette.text.primary
}));

const TokenNameChip = styled(Chip)(({ theme }) => ({
  height: '20px',
  fontSize: '0.65rem',
  fontWeight: 500,
  backgroundColor: alpha(theme.palette.primary.main, 0.08),
  color: theme.palette.primary.main,
  marginLeft: theme.spacing(0.5),
  '& .MuiChip-label': {
    padding: theme.spacing(0, 0.5)
  }
}));

const CancelButton = styled(IconButton)(({ theme }) => ({
  padding: theme.spacing(0.75),
  backgroundColor: alpha(theme.palette.error.main, 0.08),
  color: theme.palette.error.main,
  border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
  borderRadius: '8px',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: alpha(theme.palette.error.main, 0.15),
    border: `1px solid ${alpha(theme.palette.error.main, 0.4)}`,
    transform: 'translateY(-1px)'
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
  boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.04)}`
}));

const StickyTableCell = styled(TableCell)(({ theme, scrollleft, darkmode }) => ({
  position: 'sticky',
  zIndex: 1001,
  left: 0,
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

// Format number with proper decimal places
const formatNumber = (number) => {
  const num = parseFloat(number);
  if (num === 0) return '0';
  if (num < 0.0001) return num.toExponential(2);
  if (num < 1) return num.toFixed(4);
  if (num < 1000) return num.toFixed(2);
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

// Truncate function with better formatting
function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.substr(0, n - 1) + '...' : str;
}

export default function Orders({ pair }) {
  const theme = useTheme();
  const BASE_URL = process.env.API_URL;

  const { accountProfile, sync, setSync, darkMode, openSnackbar } = useContext(AppContext);
  const accountAddress = accountProfile?.account;

  const [openScanQR, setOpenScanQR] = useState(false);
  const [uuid, setUuid] = useState(null);
  const [qrUrl, setQrUrl] = useState(null);
  const [nextUrl, setNextUrl] = useState(null);

  const [loading, setLoading] = useState(false);
  const [offers, setOffers] = useState([]);

  const curr1 = pair.curr1;
  const curr2 = pair.curr2;

  // Memoize currency names to prevent unnecessary recalculations
  const curr1Name = useMemo(
    () => curr1?.name || normalizeCurrencyCode(curr1?.currency),
    [curr1?.name, curr1?.currency]
  );
  const curr2Name = useMemo(
    () => curr2?.name || normalizeCurrencyCode(curr2?.currency),
    [curr2?.name, curr2?.currency]
  );

  // Store all offers and filter them when needed
  const [allOffers, setAllOffers] = useState([]);

  // Fetch offers only when account or sync changes
  useEffect(() => {
    function getOffers() {
      const accountAddress = accountProfile?.account;
      if (!accountAddress) return;
      setLoading(true);
      axios
        .get(`${BASE_URL}/account/offers/${accountAddress}`)
        .then((res) => {
          let ret = res.status === 200 ? res.data : undefined;
          if (ret && ret.offers) {
            setAllOffers(ret.offers);
          } else {
            setAllOffers([]);
          }
        })
        .catch((err) => {
          console.error('Error on getting account orders:', err);
          setAllOffers([]);
        })
        .then(function () {
          setLoading(false);
        });
    }
    getOffers();
  }, [accountProfile?.account, sync, BASE_URL]);

  // Filter offers when pair changes or when all offers are updated
  useEffect(() => {
    if (!curr1 || !curr2) {
      setOffers([]);
      return;
    }

    // Filter offers for the current trading pair
    const filteredOffers = allOffers.filter((offer) => {
      // Normalize currency names for comparison
      const offerPaysName = offer.pays.name;
      const offerGetsName = offer.gets.name;

      // For XRP, issuer should be undefined or 'XRPL'
      const compareIssuer = (issuer1, issuer2) => {
        if (issuer1 === 'XRPL' || issuer2 === 'XRPL') {
          return (issuer1 === 'XRPL' || !issuer1) && (issuer2 === 'XRPL' || !issuer2);
        }
        return issuer1 === issuer2;
      };

      // Match either direction of the pair
      const matchesPair =
        (offerPaysName === curr1Name &&
          compareIssuer(offer.pays.issuer, curr1.issuer) &&
          offerGetsName === curr2Name &&
          compareIssuer(offer.gets.issuer, curr2.issuer)) ||
        (offerPaysName === curr2Name &&
          compareIssuer(offer.pays.issuer, curr2.issuer) &&
          offerGetsName === curr1Name &&
          compareIssuer(offer.gets.issuer, curr1.issuer));

      return matchesPair;
    });

    setOffers(filteredOffers);
  }, [allOffers, curr1Name, curr2Name, curr1?.issuer, curr2?.issuer]);

  const handleCancel = (event, seq) => {
    const wallet_type = accountProfile?.wallet_type;
    if (wallet_type === 'device') {
      onOfferCancelDevice(seq);
    } else {
      // Legacy wallet support
      openSnackbar('Device authentication required', 'error');
    }
  };

  useEffect(() => {
    var timer = null;
    var isRunning = false;
    var counter = 150;
    async function getPayload() {
      if (isRunning) return;
      isRunning = true;
      try {
        const ret = await axios.get(`${BASE_URL}/xumm/payload/${uuid}`);
        const res = ret.data.data.response;

        const resolved_at = res.resolved_at;
        const dispatched_result = res.dispatched_result;
        if (resolved_at) {
          setOpenScanQR(false);
          if (dispatched_result === 'tesSUCCESS') {
            setSync(sync + 1);
          }
          return;
        }
      } catch (err) {}
      isRunning = false;
      counter--;
      if (counter <= 0) {
        setOpenScanQR(false);
      }
    }
    if (openScanQR) {
      timer = setInterval(getPayload, 2000);
    }
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [openScanQR, uuid]);

  const onOfferCancelDevice = async (seq) => {
    setLoading(true);
    try {
      if (accountProfile?.wallet_type === 'device') {
        await loadXRPLDependencies();
        const deviceWallet = getDeviceWallet(accountProfile);

        if (!deviceWallet) {
          openSnackbar('Device wallet not available', 'error');
          setLoading(false);
          return;
        }

        const transaction = {
          TransactionType: 'OfferCancel',
          Account: accountProfile.account,
          OfferSequence: seq,
          Fee: '12'
        };

        // Connect to XRPL network
        const client = new Client('wss://xrplcluster.com');
        await client.connect();

        try {
          // Autofill and submit transaction
          const preparedTx = await client.autofill(transaction);
          const signedTx = deviceWallet.sign(preparedTx);
          const result = await client.submitAndWait(signedTx.tx_blob);

          if (result.result?.meta?.TransactionResult === 'tesSUCCESS') {
            setSync(sync + 1);
            openSnackbar('Offer cancelled successfully', 'success');
          } else {
            openSnackbar('Failed to cancel offer: ' + result.result?.meta?.TransactionResult, 'error');
          }
        } finally {
          await client.disconnect();
        }
      } else {
        openSnackbar('Device authentication required', 'error');
      }
    } catch (err) {
      console.error('Error cancelling offer:', err);
      openSnackbar(err.message || 'Failed to cancel offer', 'error');
    }
    setLoading(false);
  };

  const handleScanQRClose = () => {
    setOpenScanQR(false);
  };

  const tableRef = useRef(null);

  return (
    <Stack spacing={2}>
      <QRDialog
        open={openScanQR}
        type="OfferCancel"
        onClose={handleScanQRClose}
        qrUrl={qrUrl}
        nextUrl={nextUrl}
      />

      {!accountAddress ? (
        <EmptyStateContainer>
          <ErrorOutlineIcon
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
            Connect your wallet to view and manage your open orders
          </Typography>
        </EmptyStateContainer>
      ) : loading ? (
        <LoadingContainer>
          <Stack alignItems="center" spacing={2}>
            <PuffLoader color={theme.palette.primary.main} size={40} />
            <Typography variant="body2" color="text.secondary">
              Loading your orders...
            </Typography>
          </Stack>
        </LoadingContainer>
      ) : offers.length === 0 ? (
        <EmptyStateContainer>
          <ErrorOutlineIcon
            sx={{
              fontSize: '3rem',
              color: theme.palette.text.secondary,
              mb: 2,
              opacity: 0.5
            }}
          />
          <Typography variant="h6" color="text.primary" gutterBottom>
            No Open Orders
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            You don't have any active orders for this trading pair
          </Typography>
        </EmptyStateContainer>
      ) : (
        <TableContainer>
          <Box
            ref={tableRef}
            sx={{
              overflow: 'visible',
              width: '100%'
            }}
          >
            <ModernTable size="small">
              <TableHead>
                <TableRow>
                  <TableCell align="left" width="15%">
                    Type
                  </TableCell>
                  <TableCell align="left" width="14%">
                    Price
                  </TableCell>
                  <TableCell align="left" width="22%">
                    Gets
                  </TableCell>
                  <TableCell align="left" width="22%">
                    Pays
                  </TableCell>
                  <TableCell align="left" width="15%">
                    Expires
                  </TableCell>
                  <TableCell align="center" width="12%">
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {offers.map((row) => {
                  const {
                    _id,
                    account,
                    seq,
                    flags,
                    gets,
                    pays,
                    expire,
                    chash,
                    ctime,
                    mhash,
                    mtime
                  } = row;

                  const expired = checkExpiration(expire);
                  let exch = 0;
                  let buy;

                  // Compare using normalized names instead of raw currency codes
                  const paysName = pays.name;
                  const compareIssuer = (issuer1, issuer2) => {
                    if (issuer1 === 'XRPL' || issuer2 === 'XRPL') {
                      return (issuer1 === 'XRPL' || !issuer1) && (issuer2 === 'XRPL' || !issuer2);
                    }
                    return issuer1 === issuer2;
                  };

                  if (paysName === curr1Name && compareIssuer(pays.issuer, curr1.issuer)) {
                    buy = true;
                    exch = new Decimal(gets.value).div(pays.value).toNumber();
                  } else {
                    buy = false;
                    exch = new Decimal(pays.value).div(gets.value).toNumber();
                  }

                  return (
                    <TableRow key={_id}>
                      <TableCell align="left">
                        <OrderTypeChip
                          ordertype={buy ? 'buy' : 'sell'}
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {buy ? (
                                <TrendingUpIcon sx={{ fontSize: '0.875rem' }} />
                              ) : (
                                <TrendingDownIcon sx={{ fontSize: '0.875rem' }} />
                              )}
                              {buy ? 'BUY' : 'SELL'}
                            </Box>
                          }
                          size="small"
                        />
                      </TableCell>
                      <PriceCell align="left" ordertype={buy ? 'buy' : 'sell'}>
                        {formatNumber(exch)}
                      </PriceCell>
                      <TableCell align="left">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ValueTypography>{formatNumber(gets.value)}</ValueTypography>
                          <TokenNameChip label={truncate(gets.name, 8)} size="small" />
                        </Box>
                      </TableCell>
                      <TableCell align="left">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ValueTypography>{formatNumber(pays.value)}</ValueTypography>
                          <TokenNameChip label={truncate(pays.name, 8)} size="small" />
                        </Box>
                      </TableCell>
                      <TableCell align="left">
                        {expire ? (
                          <Chip
                            label={(() => {
                              // XRPL uses Ripple Epoch (Jan 1, 2000 00:00 UTC)
                              const RIPPLE_EPOCH = 946684800;
                              const expirationDate = new Date((expire + RIPPLE_EPOCH) * 1000);
                              const now = new Date();
                              const diffMs = expirationDate - now;

                              if (diffMs <= 0) {
                                return 'Expired';
                              }

                              const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                              const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                              if (diffHours < 1) {
                                const diffMinutes = Math.floor(diffMs / (1000 * 60));
                                return `${diffMinutes}m`;
                              } else if (diffHours < 24) {
                                return `${diffHours}h`;
                              } else if (diffDays < 7) {
                                return `${diffDays}d`;
                              } else {
                                return expirationDate.toLocaleDateString();
                              }
                            })()}
                            size="small"
                            sx={{
                              height: '20px',
                              fontSize: '0.7rem',
                              backgroundColor: expired
                                ? alpha(theme.palette.error.main, 0.1)
                                : expire && (expire + 946684800) * 1000 - Date.now() < 3600000 // Less than 1 hour
                                  ? alpha(theme.palette.warning.main, 0.1)
                                  : alpha(theme.palette.info.main, 0.1),
                              color: expired
                                ? theme.palette.error.main
                                : expire && (expire + 946684800) * 1000 - Date.now() < 3600000
                                  ? theme.palette.warning.main
                                  : theme.palette.info.main,
                              border: `1px solid ${
                                expired
                                  ? alpha(theme.palette.error.main, 0.3)
                                  : expire && (expire + 946684800) * 1000 - Date.now() < 3600000
                                    ? alpha(theme.palette.warning.main, 0.3)
                                    : alpha(theme.palette.info.main, 0.3)
                              }`
                            }}
                          />
                        ) : (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontSize: '0.75rem' }}
                          >
                            Never
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <CancelButton
                          onClick={(e) => handleCancel(e, seq)}
                          aria-label="cancel order"
                          size="small"
                        >
                          <CancelIcon fontSize="small" />
                        </CancelButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </ModernTable>
          </Box>
        </TableContainer>
      )}
    </Stack>
  );
}
