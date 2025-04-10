import axios from 'axios';
import { useState, useEffect } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';

// Material
import { withStyles } from '@mui/styles';
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
import { fNumber } from 'src/utils/formatNumber';
import Decimal from 'decimal.js';

// Iconify
import { Icon } from '@iconify/react';
import copyIcon from '@iconify/icons-fad/copy';
import ConnectWallet from './ConnectWallet';
import { isInstalled, setTrustline, submitTransaction } from '@gemwallet/api';
import { enqueueSnackbar } from 'notistack';
import sdk from '@crossmarkio/sdk';
import { updateProcess, updateTxHash } from 'src/redux/transactionSlice';
import CustomDialog from './Dialog';

// ----------------------------------------------------------------------
const TrustDialog = styled(Dialog)(({ theme }) => ({
  backdropFilter: 'blur(1px)',
  WebkitBackdropFilter: 'blur(1px)', // Fix on Mobile
  '& .MuiDialogContent-root': {
    padding: theme.spacing(3),
    minWidth: { xs: '100%', sm: 400 } // Add minimum width
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1)
  },
  '& .MuiPaper-root': {
    borderRadius: theme.spacing(2) // More rounded corners
  }
}));

const TrustDialogTitle = (props) => {
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

const Label = withStyles({
  root: {
    color: alpha('#637381', 0.99)
  }
})(Typography);

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
      // console.log(counter + " " + isRunning, uuid);
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
          console.log('Error on getting account lines!!!', err);
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

      switch (wallet_type) {
        case 'xaman':
          setLoading(true);
          const res = await axios.post(`${BASE_URL}/xumm/trustset`, body);

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
              const trustSet = {
                flags: Flags,
                limitAmount: LimitAmount
              };

              dispatch(updateProcess(1));
              await setTrustline(trustSet).then(({ type, result }) => {
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
          // if (!window.xrpl) {
          //   enqueueSnackbar("CrossMark wallet is not installed", { variant: "error" });
          //   return;
          // }
          // const { isCrossmark } = window.xrpl;
          // if (isCrossmark) {
          const trustSet = {
            Flags: Flags,
            LimitAmount: LimitAmount
          };

          dispatch(updateProcess(1));
          await sdk.methods
            .signAndSubmitAndWait({
              ...trustSet,
              Account: accountProfile.account,
              TransactionType: 'TrustSet'
            })
            .then(({ response }) => {
              if (response.data.meta.isSuccess) {
                dispatch(updateProcess(2));
                dispatch(updateTxHash(response.data.resp.result?.hash));
              } else {
                dispatch(updateProcess(3));
              }
            });
          // }
          break;
      }
    } catch (err) {
      console.log(err);
      dispatch(updateProcess(0));
      openSnackbar('Network error!', 'error');
    }
    setLoading(false);
  };

  const onDisconnectXumm = async (uuid) => {
    setLoading(true);
    try {
      const res = await axios.delete(`${BASE_URL}/xumm/logout/${uuid}`);
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
      console.log(err);
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

        body = { LimitAmount, Flags, user_token, TransactionType: 'TrustSet' };
        if (wallet_type == 'xaman') {
          const res1 = await axios.post(`${BASE_URL}/xumm/trustset`, body);
          if (res1.status === 200) {
            const uuid = res1.data.data.uuid;
            const qrlink = res1.data.data.qrUrl;
            const nextlink = res1.data.data.next;

            setOpenConfirm(false);
            setUuid(uuid);
            setQrUrl(qrlink);
            setNextUrl(nextlink);
            setOpenScanQR(true);
          }
        } else if (wallet_type == 'gem') {
          isInstalled().then(async (response) => {
            if (response.result.isInstalled) {
              await submitTransaction({
                transaction: body
              }).then(({ type, result }) => {
                if (type === 'response') {
                  setXamanStep(4);
                } else {
                  handleConfirmClose();
                }
              });
            } else {
              enqueueSnackbar('GemWallet is not installed', { variant: 'error' });
              handleConfirmClose();
            }
          });
        } else if (wallet_type == 'crossmark') {
          await sdk.methods.signAndSubmitAndWait(body).then(({ response }) => {
            if (response.data.meta.isSuccess) {
              setXamanStep(4);
            } else {
              handleConfirmClose();
            }
          });
        }
        break;
      case 2:
        setXamanStep(3);
        break;
      case 1:
        body = {
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
        if (wallet_type == 'xaman') {
          const res2 = await axios.post(`${BASE_URL}/xumm/transfer`, body);
          if (res2.status === 200) {
            const uuid = res2.data.data.uuid;
            const qrlink = res2.data.data.qrUrl;
            const nextlink = res2.data.data.next;

            setXamanStep(2);
            setUuid(uuid);
            setQrUrl(qrlink);
            setNextUrl(nextlink);
            setOpenScanQR(true);
          }
        } else if (wallet_type == 'gem') {
          isInstalled().then(async (response) => {
            if (response.result.isInstalled) {
              await submitTransaction({
                transaction: body
              }).then(({ type, result }) => {
                if (type === 'response') {
                  setXamanStep(2);
                } else {
                  handleConfirmClose();
                }
              });
            } else {
              enqueueSnackbar('GemWallet is not installed', { variant: 'error' });
              handleConfirmClose();
            }
          });
        } else if (wallet_type == 'crossmark') {
          await sdk.methods.signAndSubmitAndWait(body).then(({ response }) => {
            if (response.data.meta.isSuccess) {
              setXamanStep(2);
            } else {
              handleConfirmClose();
            }
          });
        }

        break;
    }

    setSync(!sync);
  };

  return (
    <>
      <Backdrop sx={{ color: '#000', zIndex: 1303 }} open={loading}>
        <PulseLoader color={darkMode ? '#007B55' : '#5569ff'} size={10} />
      </Backdrop>

      <TrustDialog
        fullScreen={fullScreen}
        onClose={handleClose}
        open={true}
        sx={{ zIndex: 1302 }}
        // hideBackdrop={true}
      >
        <TrustDialogTitle id="customized-dialog-title" onClose={handleClose}>
          <Stack direction="row" alignItems="center">
            <Avatar
              alt={`${user} ${name} Logo`}
              src={imgUrl}
              variant="rounded"
              sx={{
                mr: 1,
                width: 40,
                height: 40,
                borderRadius: 2
              }}
            />
            <Stack>
              <Typography variant="token" color="primary">
                {name}
              </Typography>
              <Typography variant="caption">{user}</Typography>
            </Stack>
          </Stack>
        </TrustDialogTitle>

        <DialogContent>
          <Stack spacing={2.5} sx={{ px: 1 }}>
            {' '}
            {/* Increased spacing between elements */}
            <Stack direction="row" alignItems="center" spacing={1}>
              <Label variant="subtitle2" noWrap sx={{ color: 'text.secondary' }}>
                Issuer:
              </Label>
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flex: 1 }}>
                <Link
                  underline="hover"
                  target="_blank"
                  href={`https://bithomp.com/explorer/${issuer}`}
                  rel="noreferrer noopener nofollow"
                  sx={{
                    flex: 1,
                    fontFamily: 'monospace',
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                    p: 0.5,
                    borderRadius: 0.5,
                    color: 'text.secondary',
                    '&:hover': {
                      color: 'primary.main'
                    }
                  }}
                >
                  <Typography variant="body2" noWrap>
                    {issuer}
                  </Typography>
                </Link>
                <CopyToClipboard
                  text={issuer}
                  onCopy={() => openSnackbar('Address copied!', 'success')}
                >
                  <Tooltip title="Copy address">
                    <IconButton size="small">
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </CopyToClipboard>
              </Stack>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Label variant="subtitle2" noWrap sx={{ color: 'text.secondary' }}>
                Currency:
              </Label>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Label
                  variant="body2"
                  noWrap
                  sx={{
                    fontWeight: 600,
                    color: 'primary.main',
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                    p: 0.5,
                    borderRadius: 0.5
                  }}
                >
                  {currency}
                </Label>
                <CopyToClipboard
                  text={currency}
                  onCopy={() => openSnackbar('Currency code copied!', 'success')}
                >
                  <Tooltip title="Copy currency code">
                    <IconButton size="small">
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </CopyToClipboard>
              </Stack>
            </Stack>
            <TextField
              fullWidth
              label="Trust Amount"
              value={amount}
              onChange={handleChangeAmount}
              variant="outlined" // Changed to outlined
              disabled={isRemove}
              InputProps={{
                sx: {
                  borderRadius: 1.5,
                  bgcolor: (theme) =>
                    isRemove ? alpha(theme.palette.action.disabled, 0.08) : 'transparent'
                }
              }}
            />
            <Stack
              direction="row"
              alignItems="center"
              sx={{
                bgcolor: (theme) => alpha(theme.palette.grey[200], 0.4),
                borderRadius: 1,
                p: 1.5
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  flex: 1,
                  color: 'text.secondary',
                  fontSize: '0.85rem'
                }}
              >
                {`https://xrpl.to/trustset/${slug}`}
              </Typography>
              <CopyToClipboard
                text={`https://xrpl.to/trustset/${slug}`}
                onCopy={() => openSnackbar('Copied!', 'success')}
              >
                <Tooltip title={'Click to copy'}>
                  <IconButton size="small">
                    <Icon icon={copyIcon} width={18} />
                  </IconButton>
                </Tooltip>
              </CopyToClipboard>
            </Stack>
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ pt: 1 }}>
              {isLoggedIn ? (
                <Button
                  variant="contained"
                  onClick={isRemove ? handleRemoveTrust : handleSetTrust}
                  color={isRemove ? 'error' : 'primary'}
                  size="large"
                  sx={{
                    minWidth: '120px',
                    height: '44px',
                    borderRadius: 1.5,
                    textTransform: 'none',
                    fontWeight: 600,
                    padding: '8px 22px'
                  }}
                >
                  {`${isRemove ? 'Remove' : 'Set'} Trustline`}
                </Button>
              ) : (
                <ConnectWallet />
              )}

              <CopyToClipboard
                text={`https://xrpl.to/trustset/${slug}`}
                onCopy={() => openSnackbar('Copied!', 'success')}
              >
                <Button
                  variant="outlined"
                  color="primary"
                  size="large"
                  sx={{
                    minWidth: '120px',
                    height: '44px',
                    borderRadius: '12px',
                    textTransform: 'none',
                    padding: '8px 22px',
                    position: 'relative',
                    overflow: 'hidden',
                    background: (theme) => `linear-gradient(45deg, 
                      ${theme.palette.mode === 'dark' ? '#000000' : '#ffffff'} 0%, 
                      ${alpha(theme.palette.mode === 'dark' ? '#000000' : '#ffffff', 0.9)} 25%,
                      ${alpha(theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5', 0.95)} 50%,
                      ${alpha(theme.palette.mode === 'dark' ? '#000000' : '#ffffff', 0.9)} 75%,
                      ${theme.palette.mode === 'dark' ? '#000000' : '#ffffff'} 100%)`,
                    backgroundSize: '200% 200%',
                    animation: 'gradient 5s ease infinite',
                    border: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.5)}`,
                    color: (theme) =>
                      theme.palette.mode === 'dark' ? '#fff' : theme.palette.primary.main,
                    boxShadow: (theme) => `
                      0 0 5px ${alpha(theme.palette.primary.main, 0.2)},
                      0 0 10px ${alpha(theme.palette.primary.main, 0.1)}
                    `,
                    '@keyframes gradient': {
                      '0%': {
                        backgroundPosition: '0% 50%'
                      },
                      '50%': {
                        backgroundPosition: '100% 50%'
                      },
                      '100%': {
                        backgroundPosition: '0% 50%'
                      }
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '-50%',
                      left: '-50%',
                      width: '200%',
                      height: '200%',
                      background: (theme) =>
                        `radial-gradient(circle, ${alpha(
                          theme.palette.primary.light,
                          0.1
                        )} 0%, transparent 70%)`,
                      animation: 'rotate 4s linear infinite',
                      opacity: 0,
                      transition: 'opacity 0.3s ease'
                    },
                    '@keyframes rotate': {
                      '0%': {
                        transform: 'rotate(0deg)'
                      },
                      '100%': {
                        transform: 'rotate(360deg)'
                      }
                    },
                    '&:hover': {
                      transform: 'translateY(-2px) scale(1.02)',
                      background: (theme) => `linear-gradient(45deg, 
                        ${theme.palette.mode === 'dark' ? '#000000' : '#ffffff'} 0%, 
                        ${alpha(theme.palette.mode === 'dark' ? '#000000' : '#ffffff', 0.95)} 25%,
                        ${alpha(theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5', 1)} 50%,
                        ${alpha(theme.palette.mode === 'dark' ? '#000000' : '#ffffff', 0.95)} 75%,
                        ${theme.palette.mode === 'dark' ? '#000000' : '#ffffff'} 100%)`,
                      border: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.7)}`,
                      boxShadow: (theme) => `
                        0 0 8px ${alpha(theme.palette.primary.main, 0.3)},
                        0 0 15px ${alpha(theme.palette.primary.main, 0.15)}
                      `,
                      '&::before': {
                        opacity: 1
                      }
                    },
                    '&:active': {
                      transform: 'translateY(0)'
                    },
                    '&.Mui-disabled': {
                      background: (theme) =>
                        theme.palette.mode === 'dark'
                          ? alpha('#000000', 0.5)
                          : alpha('#ffffff', 0.5),
                      border: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
                      boxShadow: 'none'
                    }
                  }}
                >
                  Copy Link
                </Button>
              </CopyToClipboard>
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

      <CustomDialog
        open={openConfirm}
        content={content}
        title={stepTitle}
        handleClose={handleConfirmClose}
        handleContinue={handleConfirmContinue}
      />
    </>
  );
}
