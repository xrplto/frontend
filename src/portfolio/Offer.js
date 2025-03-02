import React, { useContext, useEffect, useRef, useState } from 'react';
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
  alpha,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { AppContext } from 'src/AppContext';
import { PulseLoader } from 'react-spinners';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CancelIcon from '@mui/icons-material/Cancel';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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
  borderRadius: theme.shape.borderRadius * 2
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

const StyledAccordion = styled(Accordion)(({ theme }) => ({
  borderRadius: '10px !important',
  '&.Mui-expanded': {
    margin: '8px 0'
  },
  flex: '0 0 auto',
  color: theme.palette.text.primary,
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  background: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(8px)',
  '&:before': {
    display: 'none'
  }
}));

const StyledAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
  minHeight: '48px !important',
  padding: theme.spacing(0, 2),
  '& .MuiAccordionSummary-content': {
    margin: '8px 0',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1)
  }
}));

function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.substr(0, n - 1) + '...' : str;
}

const formatNumber = (value) => {
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const Offer = ({ account }) => {
  const theme = useTheme();
  const BASE_URL = process.env.API_URL;
  const dispatch = useDispatch();
  const { accountProfile, openSnackbar, sync, setSync, darkMode } = useContext(AppContext);
  const isLoggedIn = accountProfile && accountProfile.account;
  const [openScanQR, setOpenScanQR] = useState(false);
  const [uuid, setUuid] = useState(null);
  const [qrUrl, setQrUrl] = useState(null);
  const [nextUrl, setNextUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(10);
  const [total, setTotal] = useState(0);
  const [offers, setOffers] = useState([]);

  const tableRef = useRef(null);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    function getOffers() {
      if (!account) return;

      setLoading(true);
      axios
        .get(`${BASE_URL}/account/offers/${account}?page=${page}&limit=${rows}`, {
          signal: controller.signal
        })
        .then((res) => {
          if (!isMounted) return;

          let ret = res.status === 200 ? res.data : undefined;
          if (ret) {
            setTotal(ret.total);
            setOffers(ret.offers);
          }
        })
        .catch((err) => {
          if (axios.isCancel(err)) {
            console.log('Request canceled');
          } else {
            console.log('Error on getting account offers!!!', err);
          }
        })
        .finally(() => {
          if (isMounted) {
            setLoading(false);
          }
        });
    }

    // Debounce the API call
    const timeoutId = setTimeout(() => {
      getOffers();
    }, 300); // 300ms debounce

    return () => {
      isMounted = false;
      controller.abort(); // Cancel any in-flight requests
      clearTimeout(timeoutId); // Clear the timeout if component unmounts
    };
  }, [account, sync, page, rows, BASE_URL]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollLeft(tableRef?.current?.scrollLeft > 0);
    };

    tableRef?.current?.addEventListener('scroll', handleScroll);

    return () => {
      tableRef?.current?.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleCancel = (event, account, seq) => {
    if (!isLoggedIn) {
      openSnackbar('Please connect wallet!', 'error');
    } else if (accountProfile.account !== account) {
      openSnackbar('You are not the owner of this offer!', 'error');
    } else {
      onOfferCancelXumm(seq);
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

  const onOfferCancelXumm = async (seq) => {
    const wallet_type = accountProfile?.wallet_type;
    try {
      const OfferSequence = seq;

      const user_token = accountProfile.user_token;

      const body = {
        OfferSequence,
        user_token,
        Account: accountProfile?.account,
        TransactionType: 'OfferCancel'
      };

      switch (wallet_type) {
        case 'xaman':
          setLoading(true);
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
          break;
        case 'gem':
          dispatch(updateProcess(1));
          isInstalled().then(async (response) => {
            if (response.result.isInstalled) {
              await submitTransaction({
                transaction: body
              }).then(({ type, result }) => {
                if (type == 'response') {
                  dispatch(updateProcess(2));
                  dispatch(updateTxHash(result?.hash));
                } else {
                  dispatch(updateProcess(3));
                }
              });
            } else {
              enqueueSnackbar('GemWallet is not installed', { variant: 'error' });
            }
          });
          break;
        case 'crossmark':
          dispatch(updateProcess(1));
          await sdk.methods.signAndSubmitAndWait(body).then(({ response }) => {
            if (response.data.meta.isSuccess) {
              dispatch(updateProcess(2));
              dispatch(updateTxHash(response.data.resp.result?.hash));
            } else {
              dispatch(updateProcess(3));
            }
          });
          break;
      }
    } catch (err) {
      alert(err);
    } finally {
      dispatch(updateProcess(0));
      setSync(!sync);
      setLoading(false);
    }
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

  return (
    <StyledAccordion>
      <StyledAccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color: theme.palette.text.primary }} />}
        aria-controls="offer-content"
        id="offer-header"
      >
        <SwapHorizIcon sx={{ color: theme.palette.primary.main }} />
        <Typography sx={{ fontWeight: 'bold' }}>Active Offers</Typography>
      </StyledAccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        {loading ? (
          <Stack alignItems="center" spacing={1} sx={{ py: 2 }}>
            <PulseLoader color={theme.palette.primary.main} size={8} />
            <Typography variant="body2" color="text.secondary">
              Loading offers...
            </Typography>
          </Stack>
        ) : offers && offers.length === 0 ? (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            spacing={1}
            sx={{
              py: 2,
              opacity: 0.8
            }}
          >
            <ErrorOutlineIcon fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              No active offers found
            </Typography>
          </Stack>
        ) : (
          <StyledTableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <StyledTableCell>Taker Gets</StyledTableCell>
                  <StyledTableCell>Taker Pays</StyledTableCell>
                  <StyledTableCell></StyledTableCell>
                  {account && accountProfile?.account === account && (
                    <StyledTableCell align="center" sx={{ width: '60px' }}>
                      Actions
                    </StyledTableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {offers.map((row) => {
                  const { _id, account, seq, gets, pays, chash } = row;
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
                              '& .MuiChip-label': {
                                px: 1
                              }
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
                              '& .MuiChip-label': {
                                px: 1
                              }
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
                              '&:hover': {
                                textDecoration: 'underline'
                              }
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
                              onClick={(e) => handleCancel(e, account, seq)}
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
        )}

        <QRDialog
          open={openScanQR}
          type="OfferCancel"
          onClose={handleScanQRClose}
          qrUrl={qrUrl}
          nextUrl={nextUrl}
        />
      </AccordionDetails>
    </StyledAccordion>
  );
};

export default Offer;
