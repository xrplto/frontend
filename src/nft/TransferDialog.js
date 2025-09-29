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
  Avatar,
  Divider,
  Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Loader
import { PulseLoader } from 'react-spinners';

// Utils
import { XRP_TOKEN } from 'src/utils/constants';

// Components
import QRDialog from 'src/components/QRDialog';
import { isValidClassicAddress } from 'ripple-address-codec';
import { configureMemos } from 'src/utils/OfferChanges';
import { selectProcess, updateProcess, updateTxHash } from 'src/redux/transactionSlice';
import { useDispatch, useSelector } from 'react-redux';

// ----------------------------------------------------------------------
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    margin: 0,
    width: '100%',
    maxWidth: 'sm',
    borderRadius: theme.shape.borderRadius
  },
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2)
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1)
  }
}));

const StyledDialogTitle = (props) => {
  const { children, onClose, ...other } = props;

  return (
    <DialogTitle sx={{ m: 0, p: 2 }} {...other}>
      {children}
      {onClose ? (
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500]
          }}
        >
          <CloseIcon />
        </IconButton>
      ) : null}
    </DialogTitle>
  );
};

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(4)
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 12,
    '&.Mui-focused': {
      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`
    }
  }
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: 25,
  padding: theme.spacing(1.5, 4),
  textTransform: 'none',
  fontWeight: 600
}));

const StyledBackdrop = styled(Backdrop)(({ theme }) => ({
  color: '#000',
  zIndex: theme.zIndex.drawer + 1,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
  transition: 'opacity 0.3s ease-in-out'
}));

const NFTPreview = styled('div')(({ theme }) => ({
  width: '100%',
  marginBottom: theme.spacing(3),
  borderRadius: 12,
  overflow: 'hidden',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  '& img': {
    width: '100%',
    height: 'auto',
    display: 'block',
    objectFit: 'contain'
  }
}));

const NFTName = styled(Typography)(({ theme }) => ({
  textAlign: 'center',
  fontWeight: 600,
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(3),
  marginTop: theme.spacing(-1)
}));

export default function TransferDialog({ open, setOpen, nft, nftImageUrl }) {
  const theme = useTheme();
  const BASE_URL = 'https://api.xrpnft.com/api';
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const dispatch = useDispatch();
  const isProcessing = useSelector(selectProcess);

  const { accountProfile, openSnackbar, sync, setSync } = useContext(AppContext);
  const account = accountProfile?.account;
  const accountToken = accountProfile?.token;

  const [destination, setDestination] = useState('');

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

    const stopInterval = () => {
      clearInterval(dispatchTimer);
      handleClose();
      handleScanQRClose();
    };

    async function getPayload() {
      if (isRunning) return;
      isRunning = true;
      try {
        const ret = await axios.get(`${BASE_URL}/offers/create/${uuid}?account=${account}`, {
          headers: { 'x-access-token': accountToken }
        });
        const resolved_at = ret.data?.resolved_at;
        if (resolved_at) {
          startInterval();
          return;
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

    setLoading(true);
    try {
      const user_token = accountProfile?.user_token;
      const wallet_type = accountProfile?.wallet_type;

      const uuid = nft.uuid;

      const NFTokenID = nft.NFTokenID;
      const owner = nft.account;

      const transferTxData = {
        TransactionType: 'NFTokenCreateOffer',
        Account: account,
        NFTokenID,
        Amount: '0',
        Flags: 1,
        Destination: destination,
        Memos: configureMemos(
          'XRPNFT-nft-create-sell-offer',
          '',
          `https://xrpnft.com/nft/${NFTokenID}`
        )
      };

      if (wallet_type === 'device') {
        // Device authentication required for NFT operations
        openSnackbar('Device authentication for NFT transfers coming soon', 'info');
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
    setDestination('');
  };

  const handleChangeAccount = (e) => {
    setDestination(e.target.value);
  };

  const handleTransferNFT = () => {
    const isValid = isValidClassicAddress(destination) && account !== destination;
    if (isValid) {
      onCreateOfferXumm();
    } else {
      openSnackbar('Invalid value!', 'error');
    }
  };

  const handleMsg = () => {
    if (isProcessing === 1) return 'Pending Transferring';
    if (!destination) return 'Enter an Account';
    else return 'Transfer';
  };

  const isLoading = loading || isProcessing === 1;

  return (
    <>
      <Backdrop sx={{ color: '#000', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={isLoading}>
        <PulseLoader color={'#FF4842'} size={10} />
      </Backdrop>

      <StyledDialog
        fullScreen={fullScreen}
        onClose={!isLoading ? handleClose : undefined}
        open={open}
        disableScrollLock
        disablePortal={false}
        keepMounted
        TransitionProps={{
          enter: true,
          exit: true
        }}
      >
        <StyledDialogTitle onClose={!isLoading ? handleClose : undefined}>
          <Typography variant="h6" component="span">Transfer NFT</Typography>
        </StyledDialogTitle>

        <Divider />

        <DialogContent>
          <Box sx={{ p: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
              {nftImageUrl && (
                <Avatar
                  src={nftImageUrl}
                  variant="rounded"
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: 1,
                    boxShadow: (theme) => theme.shadows[1]
                  }}
                />
              )}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {nft?.name}
                </Typography>
                {nft?.collection && (
                  <Typography variant="body2" color="text.secondary">
                    Collection: {nft.collection}
                  </Typography>
                )}
                {nft?.rarity_rank && (
                  <Typography variant="body2" color="text.secondary">
                    Rank: {nft.rarity_rank} / {nft.total}
                  </Typography>
                )}
              </Box>
            </Stack>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 3, opacity: isLoading ? 0.7 : 1 }}
            >
              For this transfer to be completed, the recipient must accept it through their wallet.
            </Typography>

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Destination Account{' '}
                <Typography component="span" color="error">
                  *
                </Typography>
              </Typography>

              <TextField
                fullWidth
                variant="outlined"
                placeholder="Enter destination account"
                onChange={handleChangeAccount}
                value={destination}
                onFocus={(event) => event.target.select()}
                onKeyDown={(e) => e.stopPropagation()}
                disabled={isLoading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1
                  }
                }}
              />
            </Box>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                startIcon={
                  isLoading ? (
                    <CircularProgress disableShrink size={20} color="inherit" />
                  ) : (
                    <SendIcon />
                  )
                }
                onClick={handleTransferNFT}
                disabled={isLoading || !destination}
                sx={{
                  minWidth: 200,
                  borderRadius: 1,
                  textTransform: 'none'
                }}
              >
                {handleMsg()}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </StyledDialog>

      <QRDialog
        open={openScanQR}
        type="NFTokenCreateOffer"
        onClose={!isLoading ? handleScanQRClose : undefined}
        qrUrl={qrUrl}
        nextUrl={nextUrl}
      />
    </>
  );
}
