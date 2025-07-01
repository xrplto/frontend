import React, { useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  styled,
  IconButton,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import { AppContext } from 'src/AppContext';
import { PulseLoader } from 'react-spinners';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CancelIcon from '@mui/icons-material/Cancel';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import axios from 'axios';
import QRDialog from 'src/components/QRDialog';
import { useDispatch } from 'react-redux';
import { updateProcess, updateTxHash } from 'src/redux/transactionSlice';
import { enqueueSnackbar } from 'notistack';
import { isInstalled, submitTransaction } from '@gemwallet/api';
import sdk from '@crossmarkio/sdk';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'transform 0.3s, box-shadow 0.3s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4]
  },
  background: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(8px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: theme.shape.borderRadius
}));

const StyledCardHeader = styled(CardHeader)(({ theme }) => ({
  padding: theme.spacing(3),
  '& .MuiCardHeader-title': {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: theme.palette.text.primary,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1)
  }
}));

const StyledTableContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  '& .MuiTable-root': {
    borderCollapse: 'separate',
    borderSpacing: 0
  }
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: theme.spacing(0.75),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  whiteSpace: 'nowrap',
  '&:last-child': {
    paddingRight: theme.spacing(2)
  },
  '&:first-of-type': {
    paddingLeft: theme.spacing(2)
  }
}));

// Utility functions
const truncate = (str, n) => {
  if (!str) return '';
  return str.length > n ? str.substr(0, n - 1) + '...' : str;
};

const formatNumber = (value) => {
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const loadingAccounts = new Set();

const Offer = React.memo(({ account }) => {
  const theme = useTheme();
  const BASE_URL = process.env.API_URL || 'https://api.xrpl.to/api';
  const dispatch = useDispatch();
  const { accountProfile, openSnackbar, setSync } = useContext(AppContext);

  // State
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // QR Dialog state
  const [openScanQR, setOpenScanQR] = useState(false);
  const [uuid, setUuid] = useState(null);
  const [qrUrl, setQrUrl] = useState(null);
  const [nextUrl, setNextUrl] = useState(null);

  const isLoggedIn = useMemo(() => accountProfile && accountProfile.account, [accountProfile]);

  // Fetch offers function with caching and duplicate prevention
  const fetchOffers = useCallback(async (accountAddress) => {
    if (!accountAddress) {
      setOffers([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `https://api.xrpl.to/api/account/offers/${accountAddress}?page=0&limit=10`,
        { timeout: 10000 }
      );

      if (response.status === 200 && response.data) {
        const newOffers = response.data.offers || [];
        setOffers(newOffers);
      }
    } catch (err) {
      console.error('Error fetching offers:', err);
      setError('Failed to load offers');
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load offers when account changes
  useEffect(() => {
    fetchOffers(account);
  }, [account, fetchOffers]);

  // QR Dialog polling effect
  useEffect(() => {
    if (!openScanQR || !uuid) return;

    let timer;
    let counter = 150;
    let isRunning = false;

    const checkPayload = async () => {
      if (isRunning || counter <= 0) return;

      isRunning = true;
      try {
        const response = await axios.get(`${BASE_URL}/xumm/payload/${uuid}`);
        const data = response.data.data.response;

        if (data.resolved_at) {
          setOpenScanQR(false);
          if (data.dispatched_result === 'tesSUCCESS') {
            setSync((prev) => prev + 1);
            // Invalidate cache to refresh data
            if (account) {
              fetchOffers(account);
            }
          }
          return;
        }
      } catch (err) {
        console.error('Error checking payload:', err);
      }

      isRunning = false;
      counter--;

      if (counter <= 0) {
        setOpenScanQR(false);
      }
    };

    timer = setInterval(checkPayload, 2000);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [openScanQR, uuid, BASE_URL, setSync, account, fetchOffers]);

  // Cancel offer handler
  const handleCancel = useCallback(
    async (event, offerAccount, seq) => {
      event.preventDefault();

      if (!isLoggedIn) {
        openSnackbar('Please connect wallet!', 'error');
        return;
      }

      if (accountProfile.account !== offerAccount) {
        openSnackbar('You are not the owner of this offer!', 'error');
        return;
      }

      const walletType = accountProfile?.wallet_type;

      try {
        const body = {
          OfferSequence: seq,
          user_token: accountProfile.user_token,
          Account: accountProfile.account,
          TransactionType: 'OfferCancel'
        };

        switch (walletType) {
          case 'xaman': {
            setLoading(true);
            const response = await axios.post(`${BASE_URL}/offer/cancel`, body);

            if (response.status === 200) {
              setUuid(response.data.data.uuid);
              setQrUrl(response.data.data.qrUrl);
              setNextUrl(response.data.data.next);
              setOpenScanQR(true);
            }
            break;
          }

          case 'gem': {
            dispatch(updateProcess(1));
            const gemResponse = await isInstalled();

            if (gemResponse.result.isInstalled) {
              const result = await submitTransaction({ transaction: body });

              if (result.type === 'response') {
                dispatch(updateProcess(2));
                dispatch(updateTxHash(result.result?.hash));
              } else {
                dispatch(updateProcess(3));
              }
            } else {
              enqueueSnackbar('GemWallet is not installed', { variant: 'error' });
            }
            break;
          }

          case 'crossmark': {
            dispatch(updateProcess(1));
            const result = await sdk.methods.signAndSubmitAndWait(body);

            if (result.response.data.meta.isSuccess) {
              dispatch(updateProcess(2));
              dispatch(updateTxHash(result.response.data.resp.result?.hash));
            } else {
              dispatch(updateProcess(3));
            }
            break;
          }

          default:
            openSnackbar('Unsupported wallet type', 'error');
        }
      } catch (err) {
        console.error('Error canceling offer:', err);
        openSnackbar('Failed to cancel offer', 'error');
      } finally {
        dispatch(updateProcess(0));
        setLoading(false);
        // Invalidate cache and refresh
        if (account) {
          fetchOffers(account);
        }
      }
    },
    [isLoggedIn, accountProfile, openSnackbar, BASE_URL, dispatch, account, fetchOffers]
  );

  const handleScanQRClose = useCallback(async () => {
    setOpenScanQR(false);

    if (uuid) {
      try {
        await axios.delete(`${BASE_URL}/offer/logout/${uuid}`);
        setUuid(null);
      } catch (err) {
        console.error('Error disconnecting XUMM:', err);
      }
    }
  }, [uuid, BASE_URL]);

  // Memoized content
  const content = useMemo(() => {
    if (!account) {
      return (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={1}
          sx={{ py: 2, opacity: 0.8 }}
        >
          <ErrorOutlineIcon fontSize="small" />
          <Typography variant="body2" color="text.secondary">
            No account provided
          </Typography>
        </Stack>
      );
    }

    if (loading) {
      return (
        <Stack alignItems="center" spacing={1} sx={{ py: 2 }}>
          <PulseLoader color={theme.palette.primary.main} size={8} />
          <Typography variant="body2" color="text.secondary">
            Loading offers...
          </Typography>
        </Stack>
      );
    }

    if (error) {
      return (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={1}
          sx={{ py: 2, opacity: 0.8 }}
        >
          <ErrorOutlineIcon fontSize="small" />
          <Typography variant="body2" color="text.secondary">
            {error}
          </Typography>
        </Stack>
      );
    }

    if (offers.length === 0) {
      return (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={1}
          sx={{ py: 2, opacity: 0.8 }}
        >
          <ErrorOutlineIcon fontSize="small" />
          <Typography variant="body2" color="text.secondary">
            No active offers found
          </Typography>
        </Stack>
      );
    }

    return (
      <StyledTableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <StyledTableCell>Taker Gets</StyledTableCell>
              <StyledTableCell>Taker Pays</StyledTableCell>
              <StyledTableCell>Transaction</StyledTableCell>
              {account && accountProfile?.account === account && (
                <StyledTableCell align="center" sx={{ width: '60px' }}>
                  Actions
                </StyledTableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {offers.map((offer) => {
              const { _id, account: offerAccount, seq, gets, pays, chash } = offer;

              return (
                <TableRow
                  key={_id}
                  sx={{
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.action.hover, 0.1)
                    },
                    '&:last-child td': {
                      borderBottom: 0
                    }
                  }}
                >
                  <StyledTableCell>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Chip
                        label={gets.name}
                        size="small"
                        sx={{
                          height: '20px',
                          backgroundColor: alpha(theme.palette.success.main, 0.1),
                          color: theme.palette.success.main,
                          fontWeight: 500,
                          '& .MuiChip-label': { px: 1 }
                        }}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatNumber(gets.value)}
                      </Typography>
                    </Stack>
                  </StyledTableCell>

                  <StyledTableCell>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Chip
                        label={pays.name}
                        size="small"
                        sx={{
                          height: '20px',
                          backgroundColor: alpha(theme.palette.error.main, 0.1),
                          color: theme.palette.error.main,
                          fontWeight: 500,
                          '& .MuiChip-label': { px: 1 }
                        }}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatNumber(pays.value)}
                      </Typography>
                    </Stack>
                  </StyledTableCell>

                  <StyledTableCell>
                    {chash && (
                      <Link
                        href={`https://bithomp.com/explorer/${chash}`}
                        target="_blank"
                        rel="noreferrer noopener nofollow"
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          color: theme.palette.primary.main,
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        {truncate(chash, 16)}
                      </Link>
                    )}
                  </StyledTableCell>

                  {account && accountProfile?.account === account && (
                    <StyledTableCell align="center">
                      <Tooltip title="Cancel Offer">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={(e) => handleCancel(e, offerAccount, seq)}
                          disabled={loading}
                          sx={{
                            padding: '4px',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.error.main, 0.1)
                            }
                          }}
                        >
                          <CancelIcon sx={{ fontSize: '18px' }} />
                        </IconButton>
                      </Tooltip>
                    </StyledTableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </StyledTableContainer>
    );
  }, [account, loading, error, offers, theme, accountProfile, handleCancel]);

  return (
    <StyledCard>
      <StyledCardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SwapHorizIcon sx={{ color: theme.palette.primary.main }} />
            <Typography sx={{ fontWeight: 'bold' }}>
              Active Offers {account && `(${account.slice(0, 8)}...)`}
            </Typography>
            {process.env.NODE_ENV === 'development' && (
              <Typography variant="caption" sx={{ ml: 1, opacity: 0.7 }}>
                {loading ? 'Loading...' : `${offers.length} offers`}
              </Typography>
            )}
          </Box>
        }
      />

      <CardContent sx={{ p: 0 }}>
        {content}

        <QRDialog
          open={openScanQR}
          type="OfferCancel"
          onClose={handleScanQRClose}
          qrUrl={qrUrl}
          nextUrl={nextUrl}
        />
      </CardContent>
    </StyledCard>
  );
});

Offer.displayName = 'Offer';

export default Offer;
