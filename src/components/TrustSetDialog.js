import axios from 'axios';
import { useState, useEffect, forwardRef } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';

// Material
import {
  alpha,
  useTheme,
  useMediaQuery,
  styled,
  Avatar,
  Backdrop,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  Stack,
  Tooltip,
  Typography,
  TextField
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Redux
import { useDispatch } from 'react-redux';

// Components
import QRDialog from './QRDialog';

// Loader
import { PulseLoader } from 'react-spinners';

// Utils
import { fNumber } from 'src/utils/formatters';
import Decimal from 'decimal.js-light';

import { ConnectWallet } from './WalletConnectModal';
import { enqueueSnackbar } from 'notistack';
import { updateProcess, updateTxHash } from 'src/redux/transactionSlice';
// Removed import of Dialog.js - component inlined below
import Slide from '@mui/material/Slide';
import DialogActions from '@mui/material/DialogActions';
import Grid from '@mui/material/Grid';

// Inline Dialog Transition component
const DialogTransition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

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

// ----------------------------------------------------------------------
const TrustDialog = styled(Dialog)(({ theme }) => ({
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  '& .MuiBackdrop-root': {
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.4)'
  },
  '& .MuiDialog-paper': {
    borderRadius: '16px',
    background:
      theme.palette.mode === 'dark'
        ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(
            theme.palette.background.paper,
            0.8
          )} 100%)`
        : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(
            theme.palette.background.paper,
            0.8
          )} 100%)`,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
    boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.06)}, 0 2px 8px ${alpha(
      theme.palette.primary.main,
      0.04
    )}`,
    overflow: 'hidden',
    position: 'relative'
  },
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2),
    minWidth: { xs: '100%', sm: 360 },
    background: 'transparent',
    position: 'relative'
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1.5)
  },
  '@media (max-width: 600px)': {
    '& .MuiDialog-paper': {
      margin: theme.spacing(1.5),
      borderRadius: '12px'
    },
    '& .MuiDialogContent-root': {
      padding: theme.spacing(1.5),
      minWidth: 320
    }
  }
}));

const TrustDialogTitle = styled(DialogTitle)(({ theme }) => ({
  margin: 0,
  padding: theme.spacing(1.5, 2),
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(
    theme.palette.background.paper,
    0.4
  )} 100%)`,
  backdropFilter: 'blur(10px)',
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
  position: 'relative'
}));

const CloseButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  right: theme.spacing(1),
  top: theme.spacing(1),
  backgroundColor: alpha(theme.palette.background.paper, 0.6),
  borderRadius: '12px',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    backgroundColor: alpha(theme.palette.background.paper, 0.8),
    transform: 'scale(1.05)',
    boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.08)}`
  },
  '& .MuiSvgIcon-root': {
    color: theme.palette.text.primary
  }
}));

const TokenAvatar = styled(Avatar)(({ theme }) => ({
  width: 32,
  height: 32,
  borderRadius: theme.spacing(0.75),
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.08)}`,
  transition: 'all 0.3s ease'
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.spacing(1.5),
    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(
      theme.palette.background.paper,
      0.7
    )} 100%)`,
    backdropFilter: 'blur(20px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
    transition: 'all 0.3s ease',
    '&:hover': {
      background: `linear-gradient(135deg, ${alpha(
        theme.palette.background.paper,
        0.95
      )} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
      border: `1px solid ${alpha(theme.palette.divider, 0.12)}`
    },
    '&.Mui-focused': {
      background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 1)} 0%, ${alpha(
        theme.palette.background.paper,
        0.9
      )} 100%)`,
      border: `1px solid ${alpha(theme.palette.primary.main, 0.5)}`,
      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`
    },
    '&.Mui-disabled': {
      background: alpha(theme.palette.action.disabled, 0.08)
    }
  },
  '& .MuiInputLabel-root': {
    color: alpha(theme.palette.text.secondary, 0.8),
    '&.Mui-focused': {
      color: theme.palette.primary.main
    }
  }
}));

const InfoCard = styled(Stack)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(
    theme.palette.background.paper,
    0.7
  )} 100%)`,
  backdropFilter: 'blur(20px)',
  borderRadius: theme.spacing(0.75),
  padding: theme.spacing(1),
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.06)}`,
  transition: 'all 0.2s ease'
}));

const StyledLink = styled(Link)(({ theme }) => ({
  fontFamily: 'monospace',
  background: alpha(theme.palette.primary.main, 0.08),
  padding: theme.spacing(0.5),
  borderRadius: theme.spacing(0.5),
  color: alpha(theme.palette.text.secondary, 0.8),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  transition: 'all 0.2s ease',
  '&:hover': {
    color: theme.palette.primary.main,
    background: alpha(theme.palette.primary.main, 0.12),
    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
  }
}));

const CurrencyChip = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.primary.main,
  background: alpha(theme.palette.primary.main, 0.08),
  padding: theme.spacing(0.5),
  borderRadius: theme.spacing(0.5),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
}));

const ActionButton = styled(Button)(({ theme }) => ({
  minWidth: '100px',
  height: '36px',
  borderRadius: theme.spacing(1),
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '0.875rem',
  padding: '6px 16px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&.MuiButton-contained': {
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${alpha(
      theme.palette.primary.main,
      0.9
    )} 100%)`,
    boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.25)}`,
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.35)}`
    },
    '&.MuiButton-colorError': {
      background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${alpha(
        theme.palette.error.main,
        0.9
      )} 100%)`,
      boxShadow: `0 2px 8px ${alpha(theme.palette.error.main, 0.25)}`,
      '&:hover': {
        boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.35)}`
      }
    }
  }
}));

const CopyButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.background.paper, 0.6),
  borderRadius: '8px',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: alpha(theme.palette.background.paper, 0.8),
    transform: 'scale(1.05)',
    boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.08)}`
  },
  '& .MuiSvgIcon-root': {
    color: theme.palette.text.primary
  }
}));

export default function TrustSetDialog({ limit, token, setToken, balance }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const BASE_URL = process.env.API_URL;
  const { accountProfile, openSnackbar, darkMode, sync, setSync } = useContext(AppContext);

  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const isLoggedIn = accountProfile && accountProfile.account;

  const [openScanQR, setOpenScanQR] = useState(false);
  const [uuid, setUuid] = useState(null);
  const [qrUrl, setQrUrl] = useState(null);
  const [nextUrl, setNextUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(fNumber(token.amount));
  const [content, setContent] = useState('');
  const [openConfirm, setOpenConfirm] = useState(false);
  const [xamanStep, setXamanStep] = useState(0);
  const [xamanTitle, setXamanTitle] = useState(0);
  const [stepTitle, setStepTitle] = useState('');

  const [isRemove, setIsRemove] = useState(false);

  const { issuer, name, user, currency, md5, ext, slug } = token;

  // const imgUrl = `/static/tokens/${md5}.${ext}`;
  const imgUrl = `https://s1.xrpl.to/token/${md5}`;

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
          openSnackbar(`Successfully ${isRemove ? 'removed' : 'set'} trustline!`, 'success');
          stopInterval();
          return;
        }

        times++;

        if (times >= 10) {
          openSnackbar('Operation rejected!', 'error');
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
        openSnackbar('Timeout!', 'error');
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
  }, [openScanQR, uuid]);

  useEffect(() => {
    const getLines = () => {
      if (!isLoggedIn) return;

      setLoading(true);
      // https://api.xrpl.to/api/account/lines/r22G1hNbxBVapj2zSmvjdXyKcedpSDKsm
      axios
        .get(`${BASE_URL}/account/lines/${accountProfile.account}`)
        .then((res) => {
          let ret = res.status === 200 ? res.data : undefined;
          if (ret) {
            const trustlines = ret.lines;

            const trustlineToRemove = trustlines.find((trustline) => {
              return (
                (trustline.LowLimit.issuer === issuer || trustline.HighLimit.issuer) &&
                trustline.LowLimit.currency === currency
              );
            });

            setIsRemove(trustlineToRemove);

            if (trustlineToRemove) {
              setAmount(0);
            }
          }
        })
        .catch((err) => {
        })
        .then(function () {
          // always executed
          setLoading(false);
        });
    };
    getLines();
  }, [token, openScanQR]);

  const onTrustSetXumm = async (value) => {
    /*{
            "TransactionType": "TrustSet",
            "Account": "ra5nK24KXen9AHvsdFTKHSANinZseWnPcX",
            "Fee": "12",
            "Flags": 262144,
            "LastLedgerSequence": 8007750,
            "LimitAmount": {
              "currency": "USD",
              "issuer": "rsP3mgGb2tcYUrxiLFiHJiQXhsziegtwBc",
              "value": "100"
            },
            "Sequence": 12
        }*/
    try {
      const { issuer, currency } = token;
      const wallet_type = accountProfile.wallet_type;
      const user_token = accountProfile?.user_token;

      const Flags = 0x00020000;

      let LimitAmount = {};
      LimitAmount.issuer = issuer;
      LimitAmount.currency = currency;
      LimitAmount.value = value.toString();

      const body = { LimitAmount, Flags, user_token };

      // Device authentication - show connection required message
      enqueueSnackbar('Device authentication required for transactions', { variant: 'info' });
      handleConfirmClose();
    } catch (err) {
      dispatch(updateProcess(0));
      openSnackbar('Network error!', 'error');
    }
    setLoading(false);
  };

  const handleScanQRClose = () => {
    setOpenScanQR(false);
  };

  const handleClose = () => {
    setToken(null);
  };

  const handleChangeAmount = (e) => {
    const amt = e.target.value;
    setAmount(amt);
  };

  const isNumber = (num) => {
    return /^[0-9.,]*$/.test(num.toString());
  };

  const handleSetTrust = (e) => {
    let fAmount = 0;
    try {
      if (isNumber(amount)) {
        fAmount = new Decimal(amount.replaceAll(',', '')).toNumber();
      }
    } catch (e) {}

    if (fAmount > 0) {
      onTrustSetXumm(fAmount);
    } else {
      openSnackbar('Invalid value!', 'error');
    }
  };

  useEffect(() => {
    switch (xamanStep) {
      case 1:
        setContent(
          `This TrustLine still contains ${balance} ${currency}. If you continue, it will be sent back to the issuer before your TrustLine is deleted.`
        );
        setXamanTitle('Refund to Issuer');
        setStepTitle('Warning');
        setOpenConfirm(true);
        break;
      case 2:
        setContent(
          'Your dust balance has been sent back to the issuer. The TrustLine can now be eliminated'
        );
        setStepTitle('Success');
        setOpenConfirm(true);
        break;
      case 3:
        setContent('You are removing this token from your XRP ledger account. Are you sure?');
        setXamanTitle('Trust Set');
        setStepTitle('Warning');
        setOpenConfirm(true);
        break;
      case 4:
        openSnackbar('You removed trustline', 'success');
        handleConfirmClose();
        break;
    }
  }, [xamanStep]);

  const handleRemoveTrust = async () => {
    try {
      if (balance > 0) {
        setXamanStep(1);
      } else {
        setXamanStep(3);
      }
    } catch (err) {
      openSnackbar('Network error!', 'error');
    }
  };
  const handleConfirmClose = () => {
    setOpenConfirm(false);
    setXamanStep(0);
  };

  const handleConfirmContinue = async () => {
    const user_token = accountProfile?.user_token;
    const wallet_type = accountProfile?.wallet_type;

    let body;
    switch (xamanStep) {
      case 3:
        const Flags = 0x00020000;
        let LimitAmount = {};
        LimitAmount.issuer = issuer;
        LimitAmount.currency = currency;
        LimitAmount.value = '0';

        // Prepare transaction for device authentication
        const trustSetTransaction = {
          Account: accountProfile.account,
          TransactionType: 'TrustSet',
          LimitAmount,
          Flags
        };

        if (wallet_type === 'device') {
          try {
            await loadXRPLDependencies();
            const deviceWallet = getDeviceWallet(accountProfile);

            if (!deviceWallet) {
              enqueueSnackbar('Device wallet not available', { variant: 'error' });
              handleConfirmClose();
              return;
            }

            setLoading(true);
            setOpenConfirm(false);

            // Connect to XRPL network
            const client = new Client('wss://xrplcluster.com');
            await client.connect();

            try {
              // Autofill and submit transaction
              const preparedTx = await client.autofill(trustSetTransaction);
              const signedTx = deviceWallet.sign(preparedTx);
              const result = await client.submitAndWait(signedTx.tx_blob);

              if (result.result?.meta?.TransactionResult === 'tesSUCCESS') {
                setXamanStep(4);
                enqueueSnackbar('Trustline removed successfully!', { variant: 'success' });
              } else {
                enqueueSnackbar('Transaction failed: ' + result.result?.meta?.TransactionResult, { variant: 'error' });
                handleConfirmClose();
              }
            } finally {
              await client.disconnect();
              setLoading(false);
            }
          } catch (error) {
            console.error('Device wallet trustset error:', error);
            enqueueSnackbar('Failed to remove trustline: ' + error.message, { variant: 'error' });
            handleConfirmClose();
            setLoading(false);
          }
        } else {
          // Legacy wallet support message
          enqueueSnackbar('Device authentication required', { variant: 'error' });
          handleConfirmClose();
        }
        break;
      case 2:
        setXamanStep(3);
        break;
      case 1:
        // Prepare payment transaction for device authentication
        const paymentTransaction = {
          TransactionType: 'Payment',
          Account: accountProfile.account,
          Amount: {
            currency: currency,
            value: balance,
            issuer: issuer
          },
          Destination: issuer,
          Fee: '12',
          SourceTag: 20221212,
          DestinationTag: 20221212
        };

        if (wallet_type === 'device') {
          try {
            await loadXRPLDependencies();
            const deviceWallet = getDeviceWallet(accountProfile);

            if (!deviceWallet) {
              enqueueSnackbar('Device wallet not available', { variant: 'error' });
              handleConfirmClose();
              return;
            }

            setLoading(true);
            setOpenConfirm(false);

            // Connect to XRPL network
            const client = new Client('wss://xrplcluster.com');
            await client.connect();

            try {
              // Autofill and submit transaction
              const preparedTx = await client.autofill(paymentTransaction);
              const signedTx = deviceWallet.sign(preparedTx);
              const result = await client.submitAndWait(signedTx.tx_blob);

              if (result.result?.meta?.TransactionResult === 'tesSUCCESS') {
                setXamanStep(2);
                enqueueSnackbar('Balance returned to issuer', { variant: 'success' });
              } else {
                enqueueSnackbar('Transaction failed: ' + result.result?.meta?.TransactionResult, { variant: 'error' });
                handleConfirmClose();
              }
            } finally {
              await client.disconnect();
              setLoading(false);
            }
          } catch (error) {
            console.error('Device wallet payment error:', error);
            enqueueSnackbar('Failed to return balance: ' + error.message, { variant: 'error' });
            handleConfirmClose();
            setLoading(false);
          }
        } else {
          // Legacy wallet support message
          enqueueSnackbar('Device authentication required', { variant: 'error' });
          handleConfirmClose();
        }

        break;
    }

    setSync(!sync);
  };

  return (
    <>
      <Backdrop sx={{ color: '#000', zIndex: 1303 }} open={loading}>
        <PulseLoader color={theme.palette.primary.main} size={10} />
      </Backdrop>

      <TrustDialog fullScreen={fullScreen} onClose={handleClose} open={true} sx={{ zIndex: 1302 }}>
        <TrustDialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <TokenAvatar alt={`${user} ${name} Logo`} src={imgUrl} variant="rounded" />
            <Stack spacing={0}>
              <Typography
                variant="subtitle2"
                sx={{
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  lineHeight: 1.2
                }}
              >
                {name}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: alpha(theme.palette.text.secondary, 0.7),
                  fontSize: '0.7rem',
                  lineHeight: 1.2
                }}
              >
                {user}
              </Typography>
            </Stack>
          </Stack>
          <CloseButton onClick={handleClose} sx={{ padding: '6px' }}>
            <CloseIcon sx={{ fontSize: '18px' }} />
          </CloseButton>
        </TrustDialogTitle>

        <DialogContent>
          <Stack spacing={1.5}>
            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: '60px' }}>
                  Issuer:
                </Typography>
                <StyledLink
                  underline="hover"
                  target="_blank"
                  href={`https://bithomp.com/explorer/${issuer}`}
                  rel="noreferrer noopener nofollow"
                  sx={{ flex: 1, fontSize: '0.75rem' }}
                >
                  {issuer.slice(0, 8)}...{issuer.slice(-6)}
                </StyledLink>
                <CopyToClipboard text={issuer} onCopy={() => openSnackbar('Copied!', 'success')}>
                  <CopyButton size="small" sx={{ padding: '4px' }}>
                    <ContentCopyIcon sx={{ fontSize: '14px' }} />
                  </CopyButton>
                </CopyToClipboard>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: '60px' }}>
                  Currency:
                </Typography>
                <CurrencyChip variant="caption" sx={{ fontSize: '0.75rem', padding: '2px 6px' }}>
                  {currency}
                </CurrencyChip>
              </Stack>
            </Stack>

            {!isRemove && (
              <StyledTextField
                fullWidth
                size="small"
                label="Trust Amount"
                value={amount}
                onChange={handleChangeAmount}
                variant="outlined"
                disabled={isRemove}
                InputProps={{ style: { height: '36px' } }}
                InputLabelProps={{ style: { fontSize: '0.875rem' } }}
              />
            )}

            <Stack direction="row" spacing={1} justifyContent="center">
              {isLoggedIn ? (
                <ActionButton
                  variant="contained"
                  onClick={isRemove ? handleRemoveTrust : handleSetTrust}
                  color={isRemove ? 'error' : 'primary'}
                  fullWidth
                >
                  {`${isRemove ? 'Remove' : 'Set'} Trustline`}
                </ActionButton>
              ) : (
                <ConnectWallet />
              )}
            </Stack>
          </Stack>
        </DialogContent>
      </TrustDialog>

      <QRDialog
        open={openScanQR}
        type={xamanTitle}
        onClose={handleScanQRClose}
        qrUrl={qrUrl}
        nextUrl={nextUrl}
      />

      {/* Inline Dialog implementation (previously CustomDialog) */}
      <Dialog
        open={openConfirm}
        TransitionComponent={DialogTransition}
        keepMounted
        onClose={handleConfirmClose}
        aria-describedby="alert-dialog-slide-description"
        PaperProps={{
          sx: {
            maxWidth: '300px'
          }
        }}
        sx={{
          zIndex: 1304
        }}
      >
        <DialogTitle sx={{ textAlign: 'center' }}>{stepTitle}</DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>{content}</DialogContent>
        <DialogActions>
          <Grid container>
            <Grid size={{ xs: 6 }}>
              <Button fullWidth onClick={handleConfirmClose}>
                Cancel
              </Button>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Button fullWidth onClick={handleConfirmContinue} color="error">
                Continue
              </Button>
            </Grid>
          </Grid>
        </DialogActions>
      </Dialog>
    </>
  );
}
