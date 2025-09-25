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
      const body = { /*Account,*/ TakerGets, TakerPays, Flags, user_token };

      switch (wallet_type) {
        case 'xaman':
          setLoading(true);
          const res = await axios.post(`${BASE_URL}/offer/create`, body);

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
          isInstalled().then(async (response) => {
            if (response.result.isInstalled) {
              if (TakerGets.currency === 'XRP') {
                TakerGets = Decimal.mul(TakerGets.value, 1000000).toString();
              }

              if (TakerPays.currency === 'XRP') {
                TakerPays = Decimal.mul(TakerPays.value, 1000000).toString();
              }
              const offer = {
                flags: Flags,
                takerGets: TakerGets,
                takerPays: TakerPays
              };

              dispatch(updateProcess(1));

              await createOffer(offer).then(({ type, result }) => {
                if (type === 'response') {
                  dispatch(updateProcess(2));
                  dispatch(updateTxHash(result?.hash));
                } else {
                  dispatch(updateProcess(3));
                }

                setSync(sync + 1);
              });
            } else {
              enqueueSnackbar('GemWallet is not installed', { variant: 'error' });
            }
          });
          break;
        case 'crossmark':
          // if (!window.xrpl) {
          //   enqueueSnackbar("CrossMark wallet is not installed", { variant: "error" });
          //   return;
          // }
          // const { isCrossmark } = window.xrpl;
          // if (isCrossmark) {
          if (TakerGets.currency === 'XRP') {
            TakerGets = Decimal.mul(TakerGets.value, 1000000).toString();
          }

          if (TakerPays.currency === 'XRP') {
            TakerPays = Decimal.mul(TakerPays.value, 1000000).toString();
          }
          const offer = {
            Flags: Flags,
            TakerGets: TakerGets,
            TakerPays: TakerPays,
            Account: accountProfile?.account
          };

          dispatch(updateProcess(1));
          await sdk.methods
            .signAndSubmitAndWait({
              ...offer,
              TransactionType: 'OfferCreate'
            })
            .then(({ response }) => {
              if (response.data.meta.isSuccess) {
                dispatch(updateProcess(2));
                dispatch(updateTxHash(response.data.resp.result?.hash));
              } else {
                dispatch(updateProcess(3));
              }
              setSync(sync + 1);
            });
          // }
          break;
      }
    } catch (err) {
      alert(err);
      dispatch(updateProcess(0));
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
