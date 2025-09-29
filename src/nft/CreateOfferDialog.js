import axios from 'axios';
import { useState, useEffect } from 'react';
import Decimal from 'decimal.js-light';

// Material
import {
  alpha,
  useTheme,
  useMediaQuery,
  styled,
  Backdrop,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Select,
  Stack,
  Typography,
  TextField,
  CircularProgress,
  Box,
  Divider,
  Avatar
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleIcon from '@mui/icons-material/AddCircle';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Loader
import { PulseLoader } from '../components/Spinners';

// Constants
const XRP_TOKEN = { currency: 'XRP', issuer: 'XRPL' };

// Components
import QRDialog from 'src/components/QRDialog';
import { configureMemos } from 'src/utils/parseUtils';
import { selectProcess, updateProcess, updateTxHash } from 'src/redux/transactionSlice';
import { useDispatch, useSelector } from 'react-redux';

// ----------------------------------------------------------------------
const OfferDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    margin: 0,
    width: '100%',
    maxWidth: 'sm',
    borderRadius: '24px',
    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(
      theme.palette.background.paper,
      0.8
    )} 100%)`,
    backdropFilter: 'blur(20px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
    boxShadow: `0 12px 40px ${alpha(theme.palette.common.black, 0.15)}`,
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '3px',
      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main}, ${theme.palette.info.main})`,
      opacity: 0.8
    }
  },
  '& .MuiDialogContent-root': {
    padding: theme.spacing(3),
    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.6)} 0%, ${alpha(
      theme.palette.background.paper,
      0.3
    )} 100%)`,
    backdropFilter: 'blur(10px)'
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(2)
  }
}));

const OfferDialogTitle = (props) => {
  const { children, onClose, ...other } = props;
  const theme = useTheme();

  return (
    <DialogTitle
      sx={{
        m: 0,
        p: 3,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(
          theme.palette.primary.main,
          0.03
        )} 100%)`,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
        borderRadius: '24px 24px 0 0'
      }}
      {...other}
    >
      <Typography
        variant="h6"
        component="span"
        sx={{
          fontWeight: 600,
          color: theme.palette.primary.main,
          fontSize: '1.2rem'
        }}
      >
        {children}
      </Typography>
      {onClose ? (
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 12,
            top: 12,
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.background.paper,
              0.95
            )} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
            backdropFilter: 'blur(12px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            borderRadius: '10px',
            color: theme.palette.text.secondary,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.error.main,
                0.12
              )} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
              border: `1px solid ${alpha(theme.palette.error.main, 0.25)}`,
              color: theme.palette.error.main,
              transform: 'scale(1.05)'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      ) : null}
    </DialogTitle>
  );
};

const CustomSelect = styled(Select)(({ theme }) => ({
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none'
  }
}));

function GetNum(amount) {
  let num = 0;
  try {
    num = new Decimal(amount).toNumber();
    if (num < 0) num = 0;
  } catch (err) {}
  return num;
}

export default function CreateOfferDialog({ open, setOpen, nft, isSellOffer, nftImageUrl }) {
  // "costs": [
  //     {
  //         "md5": "0413ca7cfc258dfaf698c02fe304e607",
  //         "name": "SOLO",
  //         "issuer": "rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz",
  //         "currency": "534F4C4F00000000000000000000000000000000",
  //         "ext": "jpg",
  //         "exch": 0.29431199670355546,
  //         "cost": "100"
  //     }
  // ]
  const theme = useTheme();
  const dispatch = useDispatch();
  const isProcessing = useSelector(selectProcess);
  const BASE_URL = 'https://api.xrpnft.com/api';
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const { accountProfile, openSnackbar, sync, setSync } = useContext(AppContext);
  const account = accountProfile?.account;
  const accountToken = accountProfile?.token;

  const [token, setToken] = useState(XRP_TOKEN);
  const [amount, setAmount] = useState('');

  const [openScanQR, setOpenScanQR] = useState(false);
  const [uuid, setUuid] = useState(null);
  const [qrUrl, setQrUrl] = useState(null);
  const [nextUrl, setNextUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    var timer = null;
    var isRunning = false;
    var counter = 150;

    var dispatchTimer = null;

    async function getDispatchResult() {
      try {
        const ret = await axios.get(`${BASE_URL}/offers/create/${uuid}?account=${account}`, {
          headers: { 'x-access-token': accountToken }
        });
        const res = ret.data.data.response;
        // const account = res.account;
        const dispatched_result = res.dispatched_result;

        return dispatched_result;
      } catch (err) {}
    }

    const startInterval = () => {
      let times = 0;

      dispatchTimer = setInterval(async () => {
        const dispatched_result = await getDispatchResult();

        if (dispatched_result && dispatched_result === 'tesSUCCESS') {
          setSync(sync + 1);
          openSnackbar('Create Offer successful!', 'success');
          stopInterval();
          return;
        }

        times++;

        if (times >= 10) {
          openSnackbar('Create Offer rejected!', 'error');
          stopInterval();
          return;
        }
      }, 1000);
    };

    // Stop the interval
    const stopInterval = () => {
      clearInterval(dispatchTimer);
      setOpenScanQR(false);
      handleClose();
    };

    async function getPayload() {
      if (isRunning) return;
      isRunning = true;
      try {
        const ret = await axios.get(`${BASE_URL}/offers/create/${uuid}?account=${account}`, {
          headers: { 'x-access-token': accountToken }
        });
        const resolved_at = ret.data?.resolved_at;
        const dispatched_result = ret.data?.dispatched_result;
        if (resolved_at) {
          startInterval();
          return;
          // setOpenScanQR(false);
          // if (dispatched_result === 'tesSUCCESS') {
          //     // const newMints = ret.data.mints;
          //     handleClose();
          //     setSync(sync + 1);
          //     openSnackbar('Create Offer successful!', 'success');
          // }
          // else
          //     openSnackbar('Create Offer rejected!', 'error');

          // return;
        }
      } catch (err) {
      }
      isRunning = false;
      counter--;
      if (counter <= 0) {
        openSnackbar('Create Offer timeout!', 'error');
        handleScanQRClose();
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
  }, [openScanQR, uuid, sync]);

  const onCreateOfferXumm = async () => {
    if (!account || !accountToken) {
      openSnackbar('Please login', 'error');
      return;
    }

    try {
      const user_token = accountProfile?.user_token;
      const wallet_type = accountProfile.wallet_type;

      const issuer = token.issuer;
      const currency = token.currency;

      const owner = nft.account;
      const NFTokenID = nft.NFTokenID;

      const body = { account, issuer, currency, amount, isSellOffer, NFTokenID, owner, user_token };

      let Amount = {};
      if (currency === 'XRP') {
        Amount = new Decimal(amount).mul(1000000).toString();
      } else {
        Amount.issuer = issuer;
        Amount.currency = currency;
        Amount.value = new Decimal(amount).toString();
      }

      let offerTxData = {
        TransactionType: 'NFTokenCreateOffer',
        Account: account,
        NFTokenID,
        Amount,
        Memos: configureMemos(
          isSellOffer ? 'XRPNFT-nft-create-sell-offer' : 'XRPNFT-nft-create-buy-offer',
          '',
          `https://xrpnft.com/nft/${NFTokenID}`
        )
      };

      if (isSellOffer) {
        offerTxData.Flags = 1;
      } else {
        offerTxData.Owner = owner;
      }

      if (wallet_type === 'device') {
        // Device authentication required for NFT operations
        openSnackbar('Device authentication for NFT offers coming soon', 'info');
      } else {
        openSnackbar('Device authentication required', 'error');
      }
    } catch (err) {
      console.error(err);
      openSnackbar('Network error!', 'error');
      dispatch(updateProcess(0));
    }
    setLoading(false);
  };

  const handleScanQRClose = () => {
    setOpenScanQR(false);
  };

  const handleClose = () => {
    setOpen(false);
    setToken(XRP_TOKEN);
    setAmount('');
  };

  const handleChangeAmount = (e) => {
    const value = e.target.value;
    const newAmount = value ? value.replace(/[^0-9.]/g, '') : '';
    setAmount(newAmount);
  };

  const handleCreateOffer = () => {
    if (amount > 0) {
      onCreateOfferXumm();
    } else {
      openSnackbar('Invalid value!', 'error');
    }
  };

  const handleMsg = () => {
    if (isProcessing === 1) return 'Pending Creating';
    if (!amount) return 'Enter an Amount';
    else return 'Create';
  };

  return (
    <>
      <Backdrop
        sx={{
          color: theme.palette.text.primary,
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: alpha(theme.palette.common.black, 0.7),
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}
        open={loading}
      >
        <PulseLoader color={theme.palette.primary.main} size={10} />
      </Backdrop>

      <OfferDialog
        fullScreen={fullScreen}
        onClose={handleClose}
        open={open}
        disableScrollLock
        disablePortal={false}
        keepMounted
        TransitionProps={{
          enter: true,
          exit: true
        }}
      >
        <OfferDialogTitle id="customized-dialog-title" onClose={handleClose}>
          Create {isSellOffer ? 'Sell' : 'Buy'} Offer
        </OfferDialogTitle>

        <Divider sx={{ borderColor: alpha(theme.palette.divider, 0.08) }} />

        <DialogContent>
          <Box sx={{ p: 2 }}>
            <Box
              sx={{
                p: 3,
                borderRadius: '16px',
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.background.paper,
                  0.8
                )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.04)}`,
                mb: 3
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                {nftImageUrl && (
                  <Avatar
                    src={nftImageUrl}
                    variant="rounded"
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: '12px',
                      border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.1)}`
                    }}
                  />
                )}
                <Box>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.text.primary,
                      fontSize: '1.1rem'
                    }}
                  >
                    {nft?.name}
                  </Typography>
                  {nft?.collection && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        fontWeight: 500
                      }}
                    >
                      Collection: {nft.collection}
                    </Typography>
                  )}
                  {nft?.rarity_rank && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.warning.main,
                        fontWeight: 600
                      }}
                    >
                      Rank: {nft.rarity_rank} / {nft.total}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Box>

            <Box
              sx={{
                p: 3,
                borderRadius: '16px',
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.background.paper,
                  0.8
                )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.04)}`,
                mb: 3,
                position: 'relative',
                zIndex: 9999,
                '& .MuiPopover-root': {
                  zIndex: 10000
                },
                '& .MuiMenu-root': {
                  zIndex: 10000
                },
                '& .MuiSelect-root': {
                  zIndex: 10000
                }
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 2,
                  border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.background.paper, 0.5)
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {token?.name || 'XRP'}
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                p: 3,
                borderRadius: '16px',
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.background.paper,
                  0.8
                )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.04)}`,
                mb: 3
              }}
            >
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  mb: 2
                }}
              >
                Cost{' '}
                <Typography
                  component="span"
                  sx={{
                    color: theme.palette.error.main,
                    fontWeight: 700
                  }}
                >
                  *
                </Typography>
              </Typography>

              <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                  id="id_txt_costamount"
                  variant="outlined"
                  placeholder="Enter amount"
                  onChange={handleChangeAmount}
                  autoComplete="new-password"
                  value={amount}
                  onFocus={(event) => {
                    event.target.select();
                  }}
                  onKeyDown={(e) => e.stopPropagation()}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      background: `linear-gradient(135deg, ${alpha(
                        theme.palette.background.paper,
                        0.95
                      )} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`
                      },
                      '&.Mui-focused': {
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.5)}`,
                        boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.2)}`
                      }
                    }
                  }}
                />
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.primary.main,
                    minWidth: 'fit-content'
                  }}
                >
                  {token?.name}
                </Typography>
              </Stack>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                startIcon={
                  isProcessing === 1 ? (
                    <CircularProgress disableShrink size={20} color="inherit" />
                  ) : (
                    <AddCircleIcon />
                  )
                }
                onClick={handleCreateOffer}
                disabled={isProcessing === 1 || !amount}
                sx={{
                  minWidth: 200,
                  height: '52px',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: '12px',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`
                  },
                  '&:disabled': {
                    background: alpha(theme.palette.action.disabled, 0.12),
                    color: theme.palette.action.disabled,
                    transform: 'none',
                    boxShadow: 'none'
                  }
                }}
              >
                {handleMsg()}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </OfferDialog>

      <QRDialog
        open={openScanQR}
        type="NFTokenCreateOffer"
        onClose={handleScanQRClose}
        qrUrl={qrUrl}
        nextUrl={nextUrl}
      />
    </>
  );
}
