import axios from 'axios';
import { useState, useContext, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Typography,
  Stack,
  IconButton,
  useMediaQuery,
  useTheme,
  styled,
  alpha,
  Backdrop
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { AppContext } from 'src/AppContext';
import { PulseLoader } from '../components/Spinners';


const BASE_URL = 'https://api.xrpl.to/api';

const OfferDialog = styled(Dialog)(({ theme }) => ({
  backdropFilter: 'blur(1px)',
  WebkitBackdropFilter: 'blur(1px)',
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2)
  },
  '& .MuiPaper-root': {
    borderColor: theme.palette.primary.main,
    borderWidth: 2,
    borderStyle: 'solid'
  }
}));

const OfferDialogTitle = styled(DialogTitle)(({ theme }) => ({
  margin: 0,
  padding: theme.spacing(2),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText
}));

export default function CreateOfferXRPCafe({
  open,
  setOpen,
  nft,
  isSellOffer,
  initialAmount,
  brokerFeePercentage,
  onOfferCreated
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { accountProfile, openSnackbar, sync, setSync } = useContext(AppContext);
  const account = accountProfile?.account;
  const accountToken = accountProfile?.token;

  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const isAmountFixed = Boolean(initialAmount);

  useEffect(() => {
    if (open && initialAmount) {
      setAmount(initialAmount.toString());
    }
  }, [open, initialAmount]);

  useEffect(() => {
    // TODO: Fix XRPCafe integration - broken axios calls need proper implementation
    // let timer = null;
    // let isRunning = false;
    // let counter = 150;
    // let dispatchTimer = null;

    // async function getDispatchResult() {
    //   try {
    //     // const ret = await axios.get(MISSING_ENDPOINT, {
    //     //   headers: { 'x-access-token': accountToken }
    //     // });
    //     // const res = ret.data.data.response;
    //     // const dispatched_result = res.dispatched_result;
    //     // return dispatched_result;
    //   } catch (err) {}
    // }

    const startInterval = () => {
      let times = 0;
      dispatchTimer = setInterval(async () => {
        const dispatched_result = await getDispatchResult();
        if (dispatched_result && dispatched_result === 'tesSUCCESS') {
          if (onOfferCreated) {
            onOfferCreated();
          }
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
    };

    // async function getPayload() {
    //   if (isRunning) return;
    //   isRunning = true;
    //   try {
    //     // const ret = await axios.get(MISSING_ENDPOINT, {
    //     //   headers: { 'x-access-token': accountToken }
    //     // });
    //     // const resolved_at = ret.data?.resolved_at;
    //     // if (resolved_at) {
    //     //   startInterval();
    //     //   return;
    //     // }
    //   } catch (err) {
    //   }
    //   // isRunning = false;
    //   // counter--;
    //   // if (counter <= 0) {
    //   //   openSnackbar('Create Offer timeout!', 'error');
    //   //   handleScanQRClose();
    //   // }
    // }

    // if (condition) {  // TODO: Add proper condition
    //   timer = setInterval(getPayload, 2000);
    // }

    return () => {
      // if (timer) {
      //   clearInterval(timer);
      // }
    };
  }, []); // Added missing useEffect closing

  const handleClose = () => {
    setOpen(false);
    setAmount('');
  };

  const handleChangeAmount = (e) => {
    const value = e.target.value;
    const newAmount = value ? value.replace(/[^0-9.]/g, '') : '';
    setAmount(newAmount);
  };

  const handleCreateOffer = async () => {
    if (!account || !accountToken) {
      openSnackbar('Please login', 'error');
      return;
    }

    if (parseFloat(amount) <= 0) {
      openSnackbar('Invalid amount', 'error');
      return;
    }

    setLoading(true);
    try {
      const body = {
        account,
        issuer: 'XRPL',
        currency: 'XRP',
        amount,
        isSellOffer,
        NFTokenID: nft.NFTokenID,
        owner: nft.account,
        user_token: accountProfile?.user_token,
        brokerFeePercentage // Add this line
      };


      const res = await axios.post(`${BASE_URL}/offers/create`, body, {
        headers: { 'x-access-token': accountToken }
      });


      if (res.status === 200) {
        const nextlink = res.data.data.next;

      }
    } catch (err) {
      console.error(err);
      openSnackbar('Failed to create offer', 'error');
    }
    setLoading(false);
  };

  const handleScanQRClose = () => {
  };

  return (
    <>
      <Backdrop sx={{ color: '#000', zIndex: 1303 }} open={loading}>
        <PulseLoader color={theme.palette.primary.main} size={10} />
      </Backdrop>

      <OfferDialog
        fullScreen={fullScreen}
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
      >
        <OfferDialogTitle>
          <Typography variant="h6">Create {isSellOffer ? 'Sell' : 'Buy'} Offer (XRP)</Typography>
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'inherit'
            }}
          >
            <CloseIcon />
          </IconButton>
        </OfferDialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Stack spacing={2}>
              <Typography variant="subtitle1" color="text.primary">
                Amount (XRP)
                <Typography component="span" color="error">
                  *
                </Typography>
              </Typography>
              <TextField
                variant="outlined"
                label="Amount"
                placeholder="Enter amount in XRP"
                onChange={handleChangeAmount}
                value={amount}
                onFocus={(event) => event.target.select()}
                fullWidth
                disabled={isAmountFixed}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main'
                    }
                  }
                }}
              />
              {isAmountFixed && (
                <Typography variant="body2" color="text.secondary">
                  This amount includes the broker fee of {(brokerFeePercentage * 100).toFixed(3)}%
                  and cannot be changed.
                </Typography>
              )}
            </Stack>
            <Button
              variant="contained"
              startIcon={<AddCircleIcon />}
              onClick={handleCreateOffer}
              disabled={loading}
              sx={{
                px: 4,
                py: 1,
                borderRadius: 2,
                boxShadow: (theme) => `0px 4px 8px ${alpha(theme.palette.primary.main, 0.24)}`
              }}
            >
              {loading ? <PulseLoader color="#ffffff" size={10} /> : 'Create Offer'}
            </Button>
          </Stack>
        </DialogContent>
      </OfferDialog>

      {/* QRDialog removed - Xaman no longer used */}
    </>
  );
}
