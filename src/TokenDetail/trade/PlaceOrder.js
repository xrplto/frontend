import axios from 'axios';
import { useState, useEffect } from 'react';
import Decimal from 'decimal.js-light';

// Material
import { Button, Stack, Typography, styled, useTheme, useMediaQuery, Box } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ShoppingCart, LocalOffer } from '@mui/icons-material';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Redux
import { useDispatch } from 'react-redux';

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
import { ConnectWallet } from 'src/components/WalletConnectModal';
import QRDialog from 'src/components/QRDialog';
import { enqueueSnackbar } from 'notistack';
import { updateProcess, updateTxHash } from 'src/redux/transactionSlice';
// ----------------------------------------------------------------------
const DisabledButton = styled(Button)({
  '&.Mui-disabled': {
    pointerEvents: 'unset', // allow :hover styles to be triggered
    cursor: 'not-allowed' // and custom cursor can be defined without :hover state
  }
});

const OrderButton = styled(Button)(({ theme, ordertype }) => ({
  minHeight: '44px',
  fontWeight: 600,
  fontSize: '0.875rem',
  borderRadius: '10px',
  transition: 'all 0.3s ease',
  textTransform: 'none',
  gap: theme.spacing(1),
  ...(ordertype === 'buy' && {
    backgroundColor: alpha(theme.palette.success.main, 0.1),
    color: theme.palette.success.main,
    borderColor: alpha(theme.palette.success.main, 0.3),
    '&:hover': {
      backgroundColor: theme.palette.success.main,
      color: theme.palette.common.white,
      borderColor: theme.palette.success.main,
      transform: 'translateY(-2px)',
      boxShadow: `0 8px 16px ${alpha(theme.palette.success.main, 0.3)}`
    }
  }),
  ...(ordertype === 'sell' && {
    backgroundColor: alpha(theme.palette.error.main, 0.1),
    color: theme.palette.error.main,
    borderColor: alpha(theme.palette.error.main, 0.3),
    '&:hover': {
      backgroundColor: theme.palette.error.main,
      color: theme.palette.common.white,
      borderColor: theme.palette.error.main,
      transform: 'translateY(-2px)',
      boxShadow: `0 8px 16px ${alpha(theme.palette.error.main, 0.3)}`
    }
  }),
  '&.Mui-disabled': {
    backgroundColor: alpha(theme.palette.action.disabled, 0.1),
    color: theme.palette.action.disabled,
    borderColor: alpha(theme.palette.action.disabled, 0.2)
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.75rem',
    minHeight: '40px'
  }
}));

const ErrorMessage = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  color: theme.palette.error.main,
  textAlign: 'center',
  marginBottom: theme.spacing(1),
  fontWeight: 500,
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.7rem'
  }
}));

export default function PlaceOrder({
  marketLimit,
  buySell,
  pair,
  amount,
  value,
  accountPairBalance
}) {
  const BASE_URL = process.env.API_URL;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch = useDispatch();
  const { accountProfile, setLoading, openSnackbar, sync, setSync } = useContext(AppContext);
  const [openScanQR, setOpenScanQR] = useState(false);
  const [uuid, setUuid] = useState(null);
  const [qrUrl, setQrUrl] = useState(null);
  const [nextUrl, setNextUrl] = useState(null);

  const isLoggedIn = accountProfile && accountProfile.account && accountPairBalance;
  let isSufficientBalance = false;
  let errMsg = '';

  if (isLoggedIn && amount && value) {
    /* accountPairBalance
        {
            "curr1": {
                "currency": "534F4C4F00000000000000000000000000000000",
                "issuer": "rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz",
                "value": "0.00000383697235788"
            },
            "curr2": {
                "currency": "XRP",
                "issuer": "XRPL",
                "value": 26.733742000000007
            }
        }
        */
    const fAmount = Number(amount); // SOLO
    const fValue = Number(value); // XRP

    if (fAmount > 0 && fValue > 0) {
      const accountAmount = new Decimal(accountPairBalance.curr1.value).toNumber();
      const accountValue = new Decimal(accountPairBalance.curr2.value).toNumber();
      if (buySell === 'BUY') {
        if (accountValue >= fValue) {
          isSufficientBalance = true;
          errMsg = '';
        } else {
          isSufficientBalance = false;
          errMsg = 'Insufficient wallet balance';
        }
      } else {
        if (accountAmount >= fAmount) {
          isSufficientBalance = true;
          errMsg = '';
        } else {
          isSufficientBalance = false;
          errMsg = 'Insufficient wallet balance';
        }
      }
    }
  } else {
    errMsg = '';
    isSufficientBalance = false;
    if (!isLoggedIn) {
      errMsg = 'Connect your wallet!';
    }
  }

  const canPlaceOrder = isLoggedIn && isSufficientBalance;

  useEffect(() => {
    var timer = null;
    var isRunning = false;
    var counter = 150;
    var dispatchTimer = null;

    async function getDispatchResult() {
      try {
        const ret = await axios.get(`${BASE_URL}/xumm/payload/${uuid}`);
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
          openSnackbar('Successfully submitted the order!', 'success');
          stopInterval();
          return;
        }

        times++;

        if (times >= 10) {
          openSnackbar('Transaction signing rejected!', 'error');
          stopInterval();
          return;
        }
      }, 1000);
    };

    // Stop the interval
    const stopInterval = () => {
      clearInterval(dispatchTimer);
      setOpenScanQR(false);
    };

    async function getPayload() {
      if (isRunning) return;
      isRunning = true;
      try {
        const ret = await axios.get(`${BASE_URL}/xumm/payload/${uuid}`);
        const res = ret.data.data.response;
        // const account = res.account;
        const resolved_at = res.resolved_at;
        if (resolved_at) {
          startInterval();
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
  }, [dispatch, openScanQR, uuid]);

  const onOfferCreateXumm = async () => {
    try {
      const curr1 = pair.curr1;
      const curr2 = pair.curr2;
      // const Account = accountProfile.account;
      const user_token = accountProfile.user_token;
      const wallet_type = accountProfile.wallet_type;
      let TakerGets, TakerPays;
      if (buySell === 'BUY') {
        // BUY logic
        // TakerGets: curr2(value) TakerPays: curr1(amount)
        if (curr2.currency === 'XRP') {
          TakerGets = Decimal.mul(value, 1000000).toString();
          TakerPays = {
            currency: curr1.currency,
            issuer: curr1.issuer,
            value: amount.toString()
          };
        } else {
          TakerGets = {
            currency: curr2.currency,
            issuer: curr2.issuer,
            value: value.toString()
          };
          TakerPays = {
            currency: curr1.currency,
            issuer: curr1.issuer,
            value: amount.toString()
          };
        }
      } else {
        // SELL logic
        // TakerGets: curr1(amount) TakerPays: curr2(value)
        if (curr2.currency === 'XRP') {
          TakerGets = {
            currency: curr1.currency,
            issuer: curr1.issuer,
            value: amount.toString()
          };
          TakerPays = Decimal.mul(value, 1000000).toString();
        } else {
          TakerGets = {
            currency: curr1.currency,
            issuer: curr1.issuer,
            value: amount.toString()
          };
          TakerPays = {
            currency: curr2.currency,
            issuer: curr2.issuer,
            value: value.toString()
          };
        }
      }

      const OfferCreate = {
        tfPassive: 0x00010000,
        tfImmediateOrCancel: 0x00020000,
        tfFillOrKill: 0x00040000,
        tfSell: 0x00080000
      };

      let Flags = 0;
      if (marketLimit === 'limit') {
        Flags = OfferCreate.tfSell;
      } else {
        if (buySell === 'BUY') Flags = OfferCreate.tfImmediateOrCancel;
        else Flags = OfferCreate.tfSell | OfferCreate.tfImmediateOrCancel;
      }
      // Prepare transaction data for device authentication
      const transactionData = {
        Account: accountProfile.account,
        TransactionType: 'OfferCreate',
        TakerGets,
        TakerPays,
        Flags
      };

      if (wallet_type === 'device') {
        // Device authentication wallet
        try {
          await loadXRPLDependencies();
          const deviceWallet = getDeviceWallet(accountProfile);

          if (!deviceWallet) {
            enqueueSnackbar('Device wallet not available', { variant: 'error' });
            return;
          }

          dispatch(updateProcess(1));

          // Connect to XRPL network
          const client = new Client('wss://xrplcluster.com');
          await client.connect();

          try {
            // Autofill and submit transaction
            const preparedTx = await client.autofill(transactionData);
            const signedTx = deviceWallet.sign(preparedTx);
            const result = await client.submitAndWait(signedTx.tx_blob);

            if (result.result?.meta?.TransactionResult === 'tesSUCCESS') {
              dispatch(updateProcess(2));
              dispatch(updateTxHash(result.result?.hash));
              setTimeout(() => {
                setSync(sync + 1);
                dispatch(updateProcess(0));
              }, 1500);
              enqueueSnackbar('Order placed successfully!', { variant: 'success' });
            } else {
              enqueueSnackbar('Transaction failed: ' + result.result?.meta?.TransactionResult, { variant: 'error' });
              dispatch(updateProcess(0));
            }
          } finally {
            await client.disconnect();
          }
        } catch (error) {
          console.error('Device wallet order error:', error);
          enqueueSnackbar('Failed to place order: ' + error.message, { variant: 'error' });
          dispatch(updateProcess(0));
        }
      } else {
        // Legacy wallet support message
        enqueueSnackbar('Device authentication required', { variant: 'error' });
      }
    } catch (err) {
      console.error(err);
      dispatch(updateProcess(0));
      enqueueSnackbar('Failed to place order', { variant: 'error' });
    }
    setLoading(false);
  };

  const handleScanQRClose = () => {
    setOpenScanQR(false);
  };

  const handlePlaceOrder = (e) => {
    const fAmount = Number(amount);
    const fValue = Number(value);
    if (fAmount > 0 && fValue > 0) onOfferCreateXumm();
    else {
      openSnackbar('Invalid values!', 'error');
    }

    // if (accountProfile && accountProfile.account) {
    //     // Create offer
    //     /*{
    //         "TransactionType": "OfferCreate",
    //         "Account": "ra5nK24KXen9AHvsdFTKHSANinZseWnPcX",
    //         "Fee": "12",
    //         "Flags": 0,
    //         "LastLedgerSequence": 7108682,
    //         "Sequence": 8,
    //         "TakerGets": "6000000",
    //         "TakerPays": {
    //           "currency": "GKO",
    //           "issuer": "ruazs5h1qEsqpke88pcqnaseXdm6od2xc",
    //           "value": "2"
    //         }
    //     }*/
    //     onOfferCreateXumm();

    // } else {
    //     setShowAccountAlert(true);
    //     setTimeout(() => {
    //         setShowAccountAlert(false);
    //     }, 2000);
    // }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {accountProfile && accountProfile.account ? (
        <Stack alignItems="stretch" spacing={1}>
          {errMsg && <ErrorMessage>{errMsg}</ErrorMessage>}
          {canPlaceOrder ? (
            <OrderButton
              variant="outlined"
              onClick={handlePlaceOrder}
              ordertype={buySell.toLowerCase()}
              fullWidth
              startIcon={!isMobile && (buySell === 'BUY' ? <ShoppingCart /> : <LocalOffer />)}
            >
              {buySell === 'BUY' ? 'Place Buy Order' : 'Place Sell Order'}
            </OrderButton>
          ) : (
            <OrderButton variant="outlined" disabled fullWidth ordertype="disabled">
              Place Order
            </OrderButton>
          )}
        </Stack>
      ) : (
        <ConnectWallet pair={pair} />
      )}

      <QRDialog
        open={openScanQR}
        type="OfferCreate"
        onClose={handleScanQRClose}
        qrUrl={qrUrl}
        nextUrl={nextUrl}
      />
    </Box>
  );
}
