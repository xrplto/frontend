import {
  Avatar,
  Stack,
  TableCell,
  TableRow,
  Typography,
  useMediaQuery,
  Box,
  Chip
} from '@mui/material';
import { useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { AppContext } from 'src/AppContext';
import { fNumberWithCurreny } from 'src/utils/formatNumber';
import { currencySymbols } from 'src/utils/constants';
import axios from 'axios';
import { isInstalled, submitTransaction } from '@gemwallet/api';
import sdk from '@crossmarkio/sdk';
import CustomQRDialog from 'src/components/QRDialog';
import CustomDialog from 'src/components/Dialog';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

const TrustLineRow = ({
  limit,
  currencyName,
  balance,
  md5,
  exchRate,
  issuer,
  account,
  currency
}) => {
  const BASE_URL = process.env.API_URL;
  const { darkMode, activeFiatCurrency, openSnackbar, accountProfile, setSync } =
    useContext(AppContext);
  const isMobile = useMediaQuery('(max-width:600px)');
  const isLoggedIn = accountProfile?.account;

  const [token, setToken] = useState({});
  const [dialogState, setDialogState] = useState({
    openScanQR: false,
    openConfirm: false,
    xamanStep: 0,
    xamanTitle: '',
    stepTitle: '',
    content: '',
    uuid: null,
    qrUrl: null,
    nextUrl: null
  });

  const fetchToken = useCallback(async () => {
    if (md5) {
      const res = await axios.get(`${BASE_URL}/token/get-by-hash/${md5}`);
      setToken(res.data.token);
    }
  }, [md5]);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  useEffect(() => {
    if (!dialogState.openScanQR || !dialogState.uuid) return;

    const timer = setInterval(async () => {
      const ret = await axios.get(`${BASE_URL}/xumm/payload/${dialogState.uuid}`);
      const res = ret.data.data.response;
      if (res.resolved_at) {
        clearInterval(timer);
        startDispatchInterval();
      }
    }, 2000);

    return () => clearInterval(timer);
  }, [dialogState.openScanQR, dialogState.uuid]);

  const startDispatchInterval = () => {
    let times = 0;
    const dispatchTimer = setInterval(async () => {
      const ret = await axios.get(`${BASE_URL}/xumm/payload/${dialogState.uuid}`);
      const res = ret.data.data.response;

      if (res.dispatched_result === 'tesSUCCESS') {
        setDialogState((prev) => ({ ...prev, xamanStep: prev.xamanStep + 1, openScanQR: false }));
        clearInterval(dispatchTimer);
      } else if (++times >= 20) {
        openSnackbar('Operation rejected!', 'error');
        clearInterval(dispatchTimer);
        handleConfirmClose();
      }
    }, 1000);
  };

  useEffect(() => {
    const stepsContent = [
      {
        title: 'Refund to Issuer',
        content: `This TrustLine still contains ${balance} ${currencyName}. If you continue, it will be sent back to the issuer before your TrustLine is deleted.`
      },
      {
        title: 'Success',
        content:
          'Your dust balance has been sent back to the issuer. The TrustLine can now be eliminated'
      },
      {
        title: 'Trust Set',
        content: 'You are removing this token from your XRP ledger account. Are you sure?'
      }
    ];

    if (dialogState.xamanStep > 0 && dialogState.xamanStep < 4) {
      const { title, content } = stepsContent[dialogState.xamanStep - 1];
      setDialogState((prev) => ({
        ...prev,
        xamanTitle: title,
        content,
        stepTitle: dialogState.xamanStep === 1 ? 'Warning' : 'Success',
        openConfirm: true
      }));
    } else if (dialogState.xamanStep === 4) {
      openSnackbar('You removed trustline', 'success');
      handleConfirmClose();
    }
  }, [dialogState.xamanStep]);

  const handleCancel = async () => {
    if (!isLoggedIn) {
      openSnackbar('Please connect wallet!', 'error');
    } else if (accountProfile.account !== account) {
      openSnackbar('You are not the owner of this offer!', 'error');
    } else {
      setDialogState((prev) => ({ ...prev, xamanStep: balance > 0 ? 1 : 3 }));
    }
  };

  const handleScanQRClose = () => {
    setDialogState((prev) => ({ ...prev, openScanQR: false }));
    onDisconnectXumm(dialogState.uuid);
  };

  const onDisconnectXumm = async (uuid) => {
    await axios.delete(`${BASE_URL}/xumm/logout/${uuid}`);
    setDialogState((prev) => ({ ...prev, uuid: null }));
  };

  const handleConfirmClose = () => {
    setDialogState((prev) => ({ ...prev, openConfirm: false, xamanStep: 0 }));
    setSync((prev) => !prev);
  };

  const handleConfirmContinue = async () => {
    const { user_token, wallet_type } = accountProfile;
    let body;

    if (dialogState.xamanStep === 3) {
      if (limit === 0) {
        setDialogState((prev) => ({ ...prev, xamanStep: 4 }));
        return;
      }
      body = {
        LimitAmount: { issuer, currency, value: '0' },
        Flags: 0x00020000,
        user_token,
        TransactionType: 'TrustSet'
      };
    } else if (dialogState.xamanStep === 1) {
      body = {
        TransactionType: 'Payment',
        Account: accountProfile.account,
        Amount: { currency, value: balance, issuer },
        Destination: issuer,
        Fee: '12',
        SourceTag: 20221212,
        DestinationTag: 20221212
      };
    }

    try {
      if (wallet_type === 'xaman') {
        const res = await axios.post(
          `${BASE_URL}/xumm/${dialogState.xamanStep === 3 ? 'trustset' : 'transfer'}`,
          body
        );
        if (res.status === 200) {
          const { uuid, qrUrl, next } = res.data.data;
          setDialogState((prev) => ({ ...prev, uuid, qrUrl, nextUrl: next, openScanQR: true }));
        }
      } else if (wallet_type === 'gem') {
        const { isInstalled: installed } = await isInstalled();
        if (installed) {
          const { type } = await submitTransaction({ transaction: body });
          if (type === 'response') {
            setDialogState((prev) => ({ ...prev, xamanStep: prev.xamanStep + 1 }));
          } else {
            handleConfirmClose();
          }
        } else {
          openSnackbar('GemWallet is not installed', 'error');
          handleConfirmClose();
        }
      } else if (wallet_type === 'crossmark') {
        const { response } = await sdk.methods.signAndSubmitAndWait(body);
        if (response.data.meta.isSuccess) {
          setDialogState((prev) => ({ ...prev, xamanStep: prev.xamanStep + 1 }));
        } else {
          handleConfirmClose();
        }
      }
    } catch (error) {
      openSnackbar('Transaction failed', 'error');
      handleConfirmClose();
    }
  };

  const computedBalance = useMemo(
    () => parseFloat(parseFloat(balance).toFixed(2)).toString(),
    [balance]
  );
  const computedValue = useMemo(() => {
    const value = token.exch ? balance * fNumberWithCurreny(token.exch, exchRate) : 0;
    return value.toFixed(2);
  }, [balance, token.exch, exchRate]);

  return (
    <>
      <TableRow
        sx={{
          '&:hover': {
            '& .MuiTableCell-root': {
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)'
            }
          },
          '& .MuiTableCell-root': {
            padding: '4px',
            borderBottom: `1px solid ${
              darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'
            }`
          }
        }}
      >
        <TableCell>
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar
              src={`https://s1.xrpl.to/token/${md5}`}
              sx={{
                width: 28,
                height: 28,
                borderRadius: '4px',
                '& img': {
                  objectFit: 'contain',
                  width: '100%',
                  height: '100%',
                  borderRadius: '4px'
                }
              }}
            />
            <Box>
              <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                {currencyName}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                noWrap
                sx={{
                  lineHeight: 1,
                  fontSize: '0.7rem',
                  opacity: 0.8
                }}
              >
                {issuer.substring(0, 6)}...{issuer.substring(issuer.length - 4)}
              </Typography>
            </Box>
          </Stack>
        </TableCell>

        <TableCell align="right" sx={{ display: isMobile ? 'none' : 'table-cell' }}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
            {computedBalance}
          </Typography>
        </TableCell>

        <TableCell align="right">
          <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
            {currencySymbols[activeFiatCurrency]}
            {computedValue}
          </Typography>
        </TableCell>

        {isLoggedIn && accountProfile?.account === account && (
          <TableCell align="center">
            <Chip
              icon={<DeleteOutlineIcon sx={{ fontSize: '1rem' }} />}
              label="Remove"
              color="error"
              variant="outlined"
              size="small"
              onClick={handleCancel}
              sx={{
                cursor: 'pointer',
                height: '24px',
                '& .MuiChip-label': {
                  px: 1,
                  fontSize: '0.75rem'
                }
              }}
            />
          </TableCell>
        )}
      </TableRow>

      <CustomQRDialog
        open={dialogState.openScanQR}
        type={dialogState.xamanTitle}
        onClose={handleScanQRClose}
        qrUrl={dialogState.qrUrl}
        nextUrl={dialogState.nextUrl}
      />

      <CustomDialog
        open={dialogState.openConfirm}
        content={dialogState.content}
        title={dialogState.stepTitle}
        handleClose={handleConfirmClose}
        handleContinue={handleConfirmContinue}
      />
    </>
  );
};

export default TrustLineRow;
