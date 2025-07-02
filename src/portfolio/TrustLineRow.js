import {
  Avatar,
  Stack,
  TableCell,
  TableRow,
  Typography,
  useMediaQuery,
  Box,
  Chip,
  Tooltip,
  SvgIcon
} from '@mui/material';

// Function to get color based on percentage
const getPercentageColor = (percentage) => {
  if (percentage <= 20) {
    // Green for low percentages (0-20%)
    return '#007B55';
  } else if (percentage <= 50) {
    // Transition from green to yellow (20-50%)
    const ratio = (percentage - 20) / 30;
    const r = Math.round(0 + (255 - 0) * ratio);
    const g = Math.round(123 + (193 - 123) * ratio);
    const b = Math.round(85 + (7 - 85) * ratio);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Transition from yellow to red (50%+)
    const ratio = Math.min((percentage - 50) / 30, 1);
    const r = Math.round(255 + (244 - 255) * ratio);
    const g = Math.round(193 + (67 - 193) * ratio);
    const b = Math.round(7 + (54 - 7) * ratio);
    return `rgb(${r}, ${g}, ${b})`;
  }
};
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
import VerifiedIcon from '@mui/icons-material/Verified';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Icon } from '@iconify/react';
import chartLineUp from '@iconify/icons-ph/chart-line-up';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LockIcon from '@mui/icons-material/Lock';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';

// Add XPMarket icon component
const XPMarketIcon = (props) => {
  // Filter out non-DOM props that might cause warnings
  const { darkMode, ...otherProps } = props;

  return (
    <SvgIcon {...otherProps} viewBox="0 0 32 32">
      <path
        d="M17.7872 2.625H4.41504L7.67032 7.88327H14.5L17.9149 13.4089H24.4574L17.7872 2.625Z"
        fill="inherit"
      />
      <path
        d="M1 18.6667L7.67014 29.4506L10.9573 24.1627L7.54248 18.6667L10.9573 13.1708L7.67014 7.88281L1 18.6667Z"
        fill="inherit"
      />
      <path
        d="M24.3292 24.1931L30.9994 13.4092H24.4569L21.042 18.9051H14.2123L10.957 24.1931H24.3292Z"
        fill="inherit"
      />
    </SvgIcon>
  );
};

const getOriginIcon = (origin) => {
  switch (origin) {
    case 'FirstLedger':
      return <OpenInNewIcon sx={{ fontSize: '1rem', color: '#0C53B7' }} />;
    case 'Magnetic X':
      return (
        <Box
          component="img"
          src="/magneticx-logo.webp"
          alt="Magnetic X"
          sx={{
            width: '16px',
            height: '16px',
            objectFit: 'contain'
          }}
        />
      );
    case 'xrp.fun':
      return (
        <Icon
          icon={chartLineUp}
          style={{
            fontSize: '16px',
            color: '#B72136'
          }}
        />
      );
    case 'XPmarket':
      return <XPMarketIcon sx={{ fontSize: '1rem', color: '#6D1FEE' }} />;
    case null:
    default:
      return <AutoAwesomeIcon sx={{ fontSize: '16px', color: '#637381' }} />;
  }
};

const TrustLineRow = ({ line }) => {
  const {
    limit,
    currencyName,
    balance,
    md5,
    exchRate,
    issuer,
    account,
    currency,
    percentOwned,
    verified,
    rate,
    value,
    origin,
    user
  } = line;
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

  const computedBalance = useMemo(() => {
    const num = Number(balance);
    if (num === 0) return '0';
    if (num < 0.000001) return num.toExponential(2);
    if (num < 1) return num.toFixed(6).replace(/\.?0+$/, '');
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: num < 1000 ? 4 : 2
    });
  }, [balance]);

  const computedValue = useMemo(() => {
    if (!balance || !token.exch || !exchRate) return '0.00';
    const value = Number(balance) * Number(token.exch) * Number(exchRate);
    if (isNaN(value) || value === 0) return '0.00';
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }, [balance, token.exch, exchRate]);

  return (
    <>
      <TableRow
        sx={{
          position: 'relative',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: (theme) =>
              `0 0 8px 0 ${
                theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'
              }`,
            '& .MuiTableCell-root': {
              backgroundColor: (theme) =>
                theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)'
            }
          },
          '& .MuiTableCell-root': {
            padding: '8px 16px',
            height: '60px',
            borderBottom: (theme) =>
              `1px solid ${
                theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'
              }`,
            transition: 'all 0.2s ease-in-out'
          }
        }}
      >
        <TableCell>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar
              src={`https://s1.xrpl.to/token/${md5}`}
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                boxShadow: '0 2px 8px 0 rgba(0,0,0,0.1)',
                backgroundColor: (theme) =>
                  theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#fff',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.1)'
                },
                '& img': {
                  objectFit: 'contain',
                  width: '100%',
                  height: '100%',
                  borderRadius: '8px',
                  padding: '2px'
                }
              }}
            />
            <Box>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Typography
                  variant="subtitle2"
                  noWrap
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    letterSpacing: '0.015em'
                  }}
                >
                  {currencyName}
                </Typography>
                {verified && (
                  <Tooltip title="Verified Token">
                    <VerifiedIcon
                      sx={{
                        fontSize: '1rem',
                        color: '#007B55',
                        transition: 'transform 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'scale(1.2)'
                        }
                      }}
                    />
                  </Tooltip>
                )}
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Tooltip title={origin || 'Standard Launch'}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'transform 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'scale(1.2)'
                        }
                      }}
                    >
                      {getOriginIcon(origin)}
                    </Box>
                  </Tooltip>
                  {origin && (
                    <>
                      <Tooltip title="Blackholed Issuer">
                        <LockIcon
                          sx={{
                            fontSize: '1rem',
                            color: '#007B55',
                            transition: 'transform 0.2s ease-in-out',
                            '&:hover': {
                              transform: 'scale(1.2)'
                            }
                          }}
                        />
                      </Tooltip>
                      {origin === 'xrp.fun' ? (
                        <Tooltip title="Liquidity Pool Not Burned">
                          <ElectricBoltIcon
                            sx={{
                              fontSize: '1rem',
                              color: '#B72136',
                              transition: 'transform 0.2s ease-in-out',
                              '&:hover': {
                                transform: 'scale(1.2)'
                              }
                            }}
                          />
                        </Tooltip>
                      ) : (
                        <Tooltip title="Burned Liquidity Pool">
                          <LocalFireDepartmentIcon
                            sx={{
                              fontSize: '1rem',
                              color: '#2065D1',
                              transition: 'transform 0.2s ease-in-out',
                              '&:hover': {
                                transform: 'scale(1.2)'
                              }
                            }}
                          />
                        </Tooltip>
                      )}
                    </>
                  )}
                </Stack>
              </Stack>
              <Typography
                variant="caption"
                color="text.secondary"
                noWrap
                sx={{
                  lineHeight: 1.2,
                  fontSize: '0.75rem',
                  opacity: 0.9,
                  mt: 0.5
                }}
              >
                <Tooltip title={issuer}>
                  <span>
                    {user ||
                      (issuer
                        ? `${issuer.substring(0, 6)}...${issuer.substring(issuer.length - 4)}`
                        : '')}
                  </span>
                </Tooltip>
              </Typography>
            </Box>
          </Stack>
        </TableCell>

        <TableCell
          align="right"
          sx={{
            display: { xs: 'none', sm: 'table-cell' }
          }}
        >
          <Typography
            variant="subtitle2"
            noWrap
            sx={{
              fontWeight: 600,
              fontSize: '0.9rem',
              fontFamily: 'monospace'
            }}
          >
            {computedBalance}
          </Typography>
        </TableCell>

        <TableCell align="right">
          <Typography
            variant="subtitle2"
            noWrap
            sx={{
              fontWeight: 600,
              fontSize: '0.9rem',
              color: (theme) => theme.palette.primary.main
            }}
          >
            {currencySymbols[activeFiatCurrency]}
            {computedValue}
          </Typography>
        </TableCell>

        <TableCell
          align="right"
          sx={{
            display: { xs: 'none', md: 'table-cell' }
          }}
        >
          <Typography
            variant="subtitle2"
            noWrap
            sx={{
              fontWeight: 600,
              fontSize: '0.9rem',
              color: getPercentageColor(parseFloat(percentOwned) || 0)
            }}
          >
            {parseFloat(percentOwned).toFixed(6)}%
          </Typography>
        </TableCell>

        {isLoggedIn && accountProfile?.account === account && (
          <TableCell align="center">
            <Chip
              icon={<DeleteOutlineIcon />}
              label="Remove"
              color="error"
              variant="outlined"
              onClick={handleCancel}
              sx={{
                cursor: 'pointer',
                height: '24px',
                borderRadius: '12px',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.05)',
                  backgroundColor: (theme) => theme.palette.error.light,
                  color: (theme) => theme.palette.error.contrastText,
                  '& .MuiSvgIcon-root': {
                    color: (theme) => theme.palette.error.contrastText
                  }
                },
                '& .MuiChip-label': {
                  px: 1,
                  fontSize: '0.75rem',
                  fontWeight: 500
                },
                '& .MuiSvgIcon-root': {
                  fontSize: '1rem',
                  transition: 'color 0.2s ease-in-out'
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
