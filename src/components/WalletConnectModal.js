import { useContext, useState } from 'react';

import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Skeleton from '@mui/material/Skeleton';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import styled from '@emotion/styled';
import ClearIcon from '@mui/icons-material/Clear';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import { AccountBalanceWallet as AccountBalanceWalletIcon } from '@mui/icons-material';
import { enqueueSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';

import { isInstalled, getPublicKey, signMessage } from '@gemwallet/api';
import sdk from '@crossmarkio/sdk';

import { AppContext } from 'src/AppContext';
import axios from 'axios';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  '& .MuiBackdrop-root': {
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.5)'
  },
  '& .MuiDialog-paper': {
    borderRadius: '16px',
    background:
      theme.walletDialog?.background ||
      (theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.95)' : '#FFFFFF'),
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${theme.walletDialog?.border || alpha(theme.palette.divider, 0.2)}`,
    boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.25)}`,
    overflow: 'hidden',
    width: '100%',
    maxWidth: '420px',
    position: 'relative'
  }
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  padding: theme.spacing(2, 2.5),
  background:
    theme.walletDialog?.backgroundSecondary ||
    (theme.palette.mode === 'dark'
      ? 'rgba(0, 0, 0, 0.6)'
      : alpha(theme.palette.background.default, 0.6)),
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  borderBottom: `1px solid ${theme.walletDialog?.border || alpha(theme.palette.divider, 0.15)}`,
  position: 'relative'
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(2.5),
  background: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'transparent',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  position: 'relative'
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: 'transparent',
  border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
  borderRadius: '8px',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: 'transparent',
    border: `1px solid ${alpha(theme.palette.text.primary, 0.2)}`
  },
  '& .MuiSvgIcon-root': {
    color: theme.palette.text.secondary,
    fontSize: '1.2rem'
  }
}));

const WalletItem = styled(Stack)(({ theme }) => ({
  padding: theme.spacing(1.5, 2),
  cursor: 'pointer',
  borderRadius: '12px',
  background:
    theme.palette.mode === 'dark'
      ? alpha(theme.palette.background.paper, 0.4)
      : alpha(theme.palette.background.paper, 0.6),
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
  transition: 'all 0.2s ease',
  '&:hover': {
    background:
      theme.palette.mode === 'dark'
        ? alpha(theme.palette.background.paper, 0.6)
        : alpha(theme.palette.background.paper, 0.8),
    border: `1px solid ${alpha(theme.palette.primary.main, 0.4)}`,
    transform: 'translateY(-1px)',
    '& .wallet-name': {
      color: theme.palette.primary.main
    }
  }
}));

const WalletIcon = styled('img')(({ theme }) => ({
  width: '36px',
  height: '36px',
  borderRadius: '8px',
  transition: 'transform 0.2s ease'
}));

const DownloadButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: 'transparent',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  borderRadius: '6px',
  padding: theme.spacing(0.5),
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: 'transparent',
    border: `1px solid ${alpha(theme.palette.primary.main, 0.4)}`
  },
  '& .MuiSvgIcon-root': {
    color: theme.palette.primary.main,
    fontSize: '1rem'
  }
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
  borderColor: alpha(theme.palette.divider, 0.06),
  margin: theme.spacing(0.5, 0)
}));

const ModalTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '1.25rem',
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(1.5)
}));

const FeeTag = styled('div')(({ theme, isFree }) => ({
  padding: theme.spacing(0.25, 0.5),
  borderRadius: '4px',
  fontSize: '0.7rem',
  fontWeight: 500,
  textTransform: 'uppercase',
  display: 'inline-block',
  background: 'transparent',
  color: isFree ? theme.palette.success.main : theme.palette.warning.main,
  border: `1px solid ${alpha(isFree ? theme.palette.success.main : theme.palette.warning.main, 0.2)}`
}));

const RecommendedChip = styled('div')(({ theme }) => ({
  padding: theme.spacing(0.25, 0.5),
  borderRadius: '4px',
  fontSize: '0.7rem',
  fontWeight: 500,
  textTransform: 'uppercase',
  display: 'inline-block',
  background: 'transparent',
  color: theme.palette.info.main,
  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
}));

const QRContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(2, 0)
}));

const StyledQRImage = styled('img')({
  maxWidth: '200px',
  width: '100%',
  height: 'auto',
  borderRadius: '8px'
});

const OpenXamanButton = styled(Link)(({ theme }) => ({
  borderRadius: '8px',
  border: `1px solid ${theme.palette.primary.main}`,
  padding: theme.spacing(1.5, 3),
  marginTop: theme.spacing(1),
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  textDecoration: 'none',
  display: 'inline-block',
  color: theme.palette.primary.main,
  fontWeight: 500,
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    transform: 'translateY(-1px)'
  }
}));

const WalletConnectModal = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const BASE_URL = process.env.API_URL;

  const {
    darkMode,
    openWalletModal,
    setOpenWalletModal,
    openLogin,
    qrUrl,
    nextUrl,
    connecting,
    handleLoginClose,
    handleLogin,
    onLogoutXumm,
    doLogIn
  } = useContext(AppContext);

  const handleClose = () => {
    setOpenWalletModal(false);
  };

  const handleConnectGem = () => {
    isInstalled().then((response) => {
      if (response.result.isInstalled) {
        getPublicKey().then(async (response) => {
          const pubkey = response.result?.publicKey;
          //fetch nonce from /api/gem/nonce?pubkey=pubkey
          await axios
            .get(
              `${BASE_URL}/account/auth/gem/nonce?pubkey=${pubkey}&address=${response.result?.address}`
            )
            .then((res) => {
              const nonceToken = res.data.token;
              const opts = {
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${nonceToken}`
                }
              };
              signMessage(nonceToken).then(async (response) => {
                const signedMessage = response.result?.signedMessage;
                if (signedMessage !== undefined) {
                  await axios
                    .post(
                      `${BASE_URL}/account/auth/gem/check-sign?signature=${signedMessage}`,
                      {},
                      opts
                    )
                    .then((res) => {
                      const { profile } = res.data;
                      doLogIn({ ...profile, wallet_type: 'gem' });
                      setOpenWalletModal(false);
                    });
                }
              });
            });
        });
      } else {
        enqueueSnackbar('GemWallet is not installed', { variant: 'error' });
      }
    });
  };

  const handleConnectCrossmark = async () => {
    try {
      // if (!window.xrpl) {
      //   enqueueSnackbar("CrossMark wallet is not installed", { variant: "error" });
      //   return;
      // }
      // const { isCrossmark } = window.xrpl;
      // if (isCrossmark) {
      const hashR = await axios.get(`${BASE_URL}/account/auth/crossmark/hash`);
      const hashJson = hashR.data;
      const hash = hashJson.hash;
      const id = await sdk.methods.signInAndWait(hash);
      const address = id.response.data.address;
      const pubkey = id.response.data.publicKey;
      const signature = id.response.data.signature;
      await axios
        .post(
          `${BASE_URL}/account/auth/crossmark/check-sign?signature=${signature}`,
          {
            pubkey: pubkey,
            address: address
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${hash}`
            }
          }
        )
        .then((res) => {
          const { profile } = res.data;
          doLogIn({ ...profile, wallet_type: 'crossmark' });
          setOpenWalletModal(false);
        })
        .catch((err) => {});
      // }
    } catch (err) {
    }
  };

  return (
    <StyledDialog
      open={openWalletModal}
      onClose={handleClose}
      aria-labelledby="scroll-dialog-title"
      aria-describedby="scroll-dialog-description"
      sx={{ zIndex: 9999 }}
    >
      <StyledDialogTitle>
        <Stack direction="row" justifyContent={openLogin ? 'space-between' : 'end'}>
          {openLogin && (
            <ActionButton onClick={onLogoutXumm}>
              <ArrowBackIcon />
            </ActionButton>
          )}
          <ActionButton onClick={handleClose}>
            <ClearIcon />
          </ActionButton>
        </Stack>
      </StyledDialogTitle>

      <StyledDialogContent>
        {openLogin ? (
          <>
            <ModalTitle variant="modal">Xaman Wallet</ModalTitle>
            <Typography
              variant="body1"
              align="center"
              sx={{ mb: 2, color: theme.palette.text.secondary }}
            >
              Please log in with your Xaman (Xumm) app
            </Typography>
            <QRContainer>
              <Box
                sx={{
                  width: '200px',
                  height: '200px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                {connecting ? (
                  <Skeleton
                    variant="rectangular"
                    width={200}
                    height={200}
                    sx={{ borderRadius: '8px' }}
                  />
                ) : (
                  <StyledQRImage alt="Xaman QR" src={qrUrl} />
                )}
              </Box>
              <OpenXamanButton href={nextUrl} target="_blank" rel="noreferrer noopener nofollow">
                Open in Xaman
              </OpenXamanButton>
            </QRContainer>
          </>
        ) : (
          <>
            <ModalTitle variant="modal">Connect Wallet</ModalTitle>
            <Stack spacing={1.5}>
              <WalletItem direction="row" spacing={2} alignItems="center" onClick={handleLogin}>
                <WalletIcon src="/static/xaman.webp" alt="Xaman Wallet" className="wallet-icon" />
                <Stack sx={{ flexGrow: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={0.8}>
                    <Typography
                      variant="subtitle1"
                      component="div"
                      className="wallet-name"
                      sx={{
                        fontWeight: 500,
                        transition: 'color 0.2s ease'
                      }}
                    >
                      Xaman
                    </Typography>
                    <RecommendedChip>Recommended</RecommendedChip>
                    <FeeTag isFree={false}>Fee</FeeTag>
                  </Stack>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontSize: '0.8rem'
                    }}
                  >
                    Mobile Wallet
                  </Typography>
                </Stack>
                <DownloadButton
                  component="a"
                  href="https://xaman.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Download Xaman Wallet"
                >
                  <DownloadIcon />
                </DownloadButton>
              </WalletItem>

              <WalletItem
                direction="row"
                spacing={2}
                alignItems="center"
                onClick={handleConnectGem}
              >
                <WalletIcon src="/static/gem.svg" alt="GemWallet" className="wallet-icon" />
                <Stack sx={{ flexGrow: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={0.8}>
                    <Typography
                      variant="subtitle1"
                      component="div"
                      className="wallet-name"
                      sx={{
                        fontWeight: 500,
                        transition: 'color 0.2s ease'
                      }}
                    >
                      GemWallet
                    </Typography>
                    <RecommendedChip>Recommended</RecommendedChip>
                    <FeeTag isFree={true}>Free</FeeTag>
                  </Stack>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontSize: '0.8rem'
                    }}
                  >
                    Browser Wallet
                  </Typography>
                </Stack>
                <DownloadButton
                  component="a"
                  href="https://gemwallet.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Download GemWallet"
                >
                  <DownloadIcon />
                </DownloadButton>
              </WalletItem>

              <WalletItem
                direction="row"
                spacing={2}
                alignItems="center"
                onClick={handleConnectCrossmark}
              >
                <WalletIcon
                  src="/static/crossmark.webp"
                  alt="CrossMark Wallet"
                  className="wallet-icon"
                />
                <Stack sx={{ flexGrow: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={0.8}>
                    <Typography
                      variant="subtitle1"
                      component="div"
                      className="wallet-name"
                      sx={{
                        fontWeight: 500,
                        transition: 'color 0.2s ease'
                      }}
                    >
                      CrossMark
                    </Typography>
                    <FeeTag isFree={true}>Free</FeeTag>
                  </Stack>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontSize: '0.8rem'
                    }}
                  >
                    Browser Wallet
                  </Typography>
                </Stack>
                <DownloadButton
                  component="a"
                  href="https://crossmark.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Download CrossMark Wallet"
                >
                  <DownloadIcon />
                </DownloadButton>
              </WalletItem>

              <WalletItem
                direction="row"
                spacing={2}
                alignItems="center"
                onClick={() => window.open('/device-login', '_blank')}
              >
                <WalletIcon
                  src="/static/device-login.svg"
                  alt="Device Login"
                  className="wallet-icon"
                />
                <Stack sx={{ flexGrow: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={0.8}>
                    <Typography
                      variant="subtitle1"
                      component="div"
                      className="wallet-name"
                      sx={{
                        fontWeight: 500,
                        transition: 'color 0.2s ease'
                      }}
                    >
                      Device Login
                    </Typography>
                    <FeeTag isFree={true}>Free</FeeTag>
                  </Stack>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontSize: '0.8rem'
                    }}
                  >
                    Hardware Device
                  </Typography>
                </Stack>
              </WalletItem>
            </Stack>
          </>
        )}
      </StyledDialogContent>
    </StyledDialog>
  );
};

export const ConnectWallet = () => {
  const { setOpenWalletModal } = useContext(AppContext);
  const { t } = useTranslation();

  return (
    <Button
      variant="contained"
      onClick={() => setOpenWalletModal(true)}
      startIcon={<AccountBalanceWalletIcon />}
      sx={{
        mt: 1.5,
        px: 3,
        py: 1,
        fontWeight: 600,
        borderRadius: '12px',
        position: 'relative',
        overflow: 'hidden',
        background: (theme) => `linear-gradient(45deg,
          ${theme.palette.primary.main} 0%,
          ${alpha(theme.palette.primary.main, 0.8)} 25%,
          ${alpha(theme.palette.primary.light, 0.9)} 50%,
          ${alpha(theme.palette.primary.main, 0.8)} 75%,
          ${theme.palette.primary.main} 100%)`,
        backgroundSize: '200% 200%',
        animation: 'gradient 5s ease infinite',
        boxShadow: (theme) => `
          0 0 10px ${alpha(theme.palette.primary.main, 0.5)},
          0 0 20px ${alpha(theme.palette.primary.main, 0.3)},
          0 0 30px ${alpha(theme.palette.primary.main, 0.2)}
        `,
        transition: 'all 0.3s ease',
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
              0.15
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
          boxShadow: (theme) => `
            0 0 15px ${alpha(theme.palette.primary.main, 0.6)},
            0 0 30px ${alpha(theme.palette.primary.main, 0.4)},
            0 0 45px ${alpha(theme.palette.primary.main, 0.3)}
          `,
          '&::before': {
            opacity: 1
          }
        },
        '& .MuiButton-startIcon': {
          mr: 1.5,
          animation: 'pulse 2s infinite'
        },
        '@keyframes pulse': {
          '0%': {
            transform: 'scale(1)'
          },
          '50%': {
            transform: 'scale(1.1)'
          },
          '100%': {
            transform: 'scale(1)'
          }
        }
      }}
    >
      {t('Connect Wallet')}
    </Button>
  );
};

export default WalletConnectModal;
