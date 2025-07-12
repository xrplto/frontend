import axios from 'axios';
import PropTypes from 'prop-types';
import { useState, useEffect, useMemo } from 'react';
import Decimal from 'decimal.js';
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
import { checkExpiration } from 'src/utils/extra';
import { normalizeCurrencyCode } from 'src/utils/parse/utils';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Components
import QRDialog from 'src/components/QRDialog';
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

const OrderTypeChip = styled(Chip)(({ theme, ordertype }) => ({
  height: '28px',
  fontSize: '0.75rem',
  fontWeight: 600,
  borderRadius: '14px',
  minWidth: '60px',
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

export default function Orders({ pair }) {
  const theme = useTheme();
  const BASE_URL = process.env.API_URL;

  const { accountProfile, sync, setSync, darkMode } = useContext(AppContext);
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
  const curr1Name = useMemo(() => curr1?.name || normalizeCurrencyCode(curr1?.currency), [curr1?.name, curr1?.currency]);
  const curr2Name = useMemo(() => curr2?.name || normalizeCurrencyCode(curr2?.currency), [curr2?.name, curr2?.currency]);

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
    const filteredOffers = allOffers.filter(offer => {
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
    onOfferCancelXumm(seq);
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

  const onOfferCancelXumm = async (seq) => {
    setLoading(true);
    try {
      const OfferSequence = seq;
      const user_token = accountProfile.user_token;
      const body = { OfferSequence, user_token };

      const res = await axios.post(`${BASE_URL}/offer/cancel`, body);

      if (res.status === 200) {
        const uuid = res.data.data.uuid;
        const qrlink = res.data.data.qrUrl;
        const nextlink = res.data.data.next;

        setUuid(uuid);
        setQrUrl(qrlink);
        setNextUrl(nextlink);
        setOpenScanQR(true);
      }
    } catch (err) {
      alert(err);
    }
    setLoading(false);
  };

  const onDisconnectXumm = async (uuid) => {
    setLoading(true);
    try {
      const res = await axios.delete(`${BASE_URL}/offer/logout/${uuid}`);
      if (res.status === 200) {
        setUuid(null);
      }
    } catch (err) {}
    setLoading(false);
  };

  const handleScanQRClose = () => {
    setOpenScanQR(false);
    onDisconnectXumm(uuid);
  };

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
            <ModernTable stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <StickyTableCell align="left" scrollleft={scrollLeft} darkmode={darkMode}>
                    Type
                  </StickyTableCell>
                  <TableCell align="left">Price</TableCell>
                  <TableCell align="left">Taker Gets</TableCell>
                  <TableCell align="left">Taker Pays</TableCell>
                  <TableCell align="center">Action</TableCell>
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
                      <StickyTableCell align="left" scrollleft={scrollLeft} darkmode={darkMode}>
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
                      </StickyTableCell>
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
