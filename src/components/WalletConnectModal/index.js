import { useContext, useState } from 'react';

import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { Divider, IconButton, Stack, Typography, Tooltip } from '@mui/material';
import styled from '@emotion/styled';
import ClearIcon from '@mui/icons-material/Clear';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import { enqueueSnackbar } from 'notistack';

import { isInstalled, getPublicKey, signMessage } from '@gemwallet/api';
import sdk from '@crossmarkio/sdk';

import LoginDialog from '../LoginDialog';
import { AppContext } from 'src/AppContext';
import axios from 'axios';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  '& .MuiBackdrop-root': {
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.4)'
  },
  '& .MuiDialog-paper': {
    borderRadius: '20px',
    background:
      theme.palette.mode === 'dark'
        ? 'linear-gradient(145deg, rgba(0, 0, 0, 0.98) 0%, rgba(10, 10, 10, 0.98) 50%, rgba(0, 0, 0, 0.98) 100%)'
        : 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border:
      theme.palette.mode === 'dark'
        ? '1px solid rgba(255, 255, 255, 0.08)'
        : '1px solid rgba(255, 255, 255, 0.8)',
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0 32px 64px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
        : '0 24px 48px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.8)',
    overflow: 'hidden',
    width: '100%',
    maxWidth: '450px'
  }
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  background:
    theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(20, 20, 20, 0.9) 50%, rgba(0, 0, 0, 0.8) 100%)'
      : 'linear-gradient(135deg, rgba(85, 105, 255, 0.05) 0%, rgba(0, 123, 85, 0.05) 100%)',
  borderBottom: `1px solid ${
    theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : theme.palette.divider
  }`,
  position: 'relative'
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(3),
  paddingBottom: theme.spacing(4),
  background: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'transparent',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '60px',
    height: '4px',
    background:
      theme.palette.mode === 'dark'
        ? 'linear-gradient(90deg, #00C853 0%, #5569ff 100%)'
        : 'linear-gradient(90deg, #5569ff 0%, #00C853 100%)',
    borderRadius: '2px',
    opacity: theme.palette.mode === 'dark' ? 0.8 : 0.6
  }
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.04)',
  borderRadius: '10px',
  border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.08)',
    transform: 'scale(1.05)',
    boxShadow: theme.palette.mode === 'dark' ? '0 4px 12px rgba(0, 0, 0, 0.5)' : 'none'
  },
  '& .MuiSvgIcon-root': {
    color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'inherit'
  }
}));

const WalletItem = styled(Stack)(({ theme }) => ({
  padding: theme.spacing(2),
  cursor: 'pointer',
  borderRadius: '16px',
  background: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.8)',
  border:
    theme.palette.mode === 'dark'
      ? '1px solid rgba(255, 255, 255, 0.08)'
      : '1px solid rgba(0, 0, 0, 0.06)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background:
      theme.palette.mode === 'dark'
        ? 'linear-gradient(135deg, rgba(0, 123, 85, 0.1) 0%, rgba(85, 105, 255, 0.1) 100%)'
        : 'linear-gradient(135deg, rgba(85, 105, 255, 0.05) 0%, rgba(0, 123, 85, 0.05) 100%)',
    opacity: 0,
    transition: 'opacity 0.3s ease',
    zIndex: -1
  },
  '&:hover': {
    transform: 'translateY(-2px) scale(1.02)',
    background: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.95)',
    border:
      theme.palette.mode === 'dark'
        ? '1px solid rgba(0, 123, 85, 0.3)'
        : '1px solid rgba(85, 105, 255, 0.3)',
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 123, 85, 0.2)'
        : '0 8px 32px rgba(85, 105, 255, 0.15)',
    '&::before': {
      opacity: 1
    },
    '& .wallet-name': {
      color: theme.palette.mode === 'dark' ? '#00C853' : '#5569ff'
    },
    '& .wallet-icon': {
      transform: 'scale(1.1)',
      filter:
        theme.palette.mode === 'dark'
          ? 'drop-shadow(0 0 8px rgba(0, 123, 85, 0.3))'
          : 'drop-shadow(0 0 8px rgba(85, 105, 255, 0.3))'
    }
  },
  '&:active': {
    transform: 'translateY(0) scale(0.98)'
  }
}));

const WalletIcon = styled('img')(({ theme }) => ({
  width: '40px',
  height: '40px',
  borderRadius: '12px',
  border:
    theme.palette.mode === 'dark'
      ? '2px solid rgba(255, 255, 255, 0.1)'
      : '2px solid rgba(0, 0, 0, 0.05)',
  transition: 'all 0.3s ease',
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 4px 12px rgba(0, 0, 0, 0.4)'
      : '0 4px 12px rgba(0, 0, 0, 0.1)'
}));

const DownloadButton = styled(IconButton)(({ theme }) => ({
  backgroundColor:
    theme.palette.mode === 'dark' ? 'rgba(0, 123, 85, 0.1)' : 'rgba(85, 105, 255, 0.1)',
  borderRadius: '8px',
  border: theme.palette.mode === 'dark' ? '1px solid rgba(0, 123, 85, 0.2)' : 'none',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor:
      theme.palette.mode === 'dark' ? 'rgba(0, 123, 85, 0.2)' : 'rgba(85, 105, 255, 0.2)',
    transform: 'scale(1.1)',
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0 4px 12px rgba(0, 123, 85, 0.3)'
        : '0 4px 12px rgba(85, 105, 255, 0.3)'
  },
  '& .MuiSvgIcon-root': {
    color: theme.palette.mode === 'dark' ? '#00C853' : '#5569ff',
    fontSize: 'inherit'
  }
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
  borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
  margin: theme.spacing(1, 0),
  '&::before, &::after': {
    borderColor: 'inherit'
  }
}));

const ModalTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '1.5rem',
  background:
    theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, #00C853 0%, #5569ff 100%)'
      : 'linear-gradient(135deg, #5569ff 0%, #00C853 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  marginBottom: theme.spacing(2)
}));

const FeeTag = styled('div')(({ theme, isFree }) => ({
  padding: theme.spacing(0.5, 1),
  borderRadius: '12px',
  fontSize: '0.75rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  display: 'inline-block',
  background: isFree
    ? theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, rgba(0, 123, 85, 0.2) 0%, rgba(0, 200, 83, 0.2) 100%)'
      : 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(139, 195, 74, 0.1) 100%)'
    : theme.palette.mode === 'dark'
    ? 'linear-gradient(135deg, rgba(255, 152, 0, 0.2) 0%, rgba(255, 193, 7, 0.2) 100%)'
    : 'linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 193, 7, 0.1) 100%)',
  color: isFree
    ? theme.palette.mode === 'dark'
      ? '#00C853'
      : '#4CAF50'
    : theme.palette.mode === 'dark'
    ? '#FFB74D'
    : '#FF9800',
  border: `1px solid ${
    isFree
      ? theme.palette.mode === 'dark'
        ? 'rgba(0, 123, 85, 0.3)'
        : 'rgba(76, 175, 80, 0.3)'
      : theme.palette.mode === 'dark'
      ? 'rgba(255, 152, 0, 0.3)'
      : 'rgba(255, 152, 0, 0.3)'
  }`,
  boxShadow: isFree
    ? theme.palette.mode === 'dark'
      ? '0 2px 8px rgba(0, 123, 85, 0.2)'
      : '0 2px 8px rgba(76, 175, 80, 0.2)'
    : theme.palette.mode === 'dark'
    ? '0 2px 8px rgba(255, 152, 0, 0.2)'
    : '0 2px 8px rgba(255, 152, 0, 0.2)',
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: isFree
      ? theme.palette.mode === 'dark'
        ? '0 4px 12px rgba(0, 123, 85, 0.3)'
        : '0 4px 12px rgba(76, 175, 80, 0.3)'
      : theme.palette.mode === 'dark'
      ? '0 4px 12px rgba(255, 152, 0, 0.3)'
      : '0 4px 12px rgba(255, 152, 0, 0.3)'
  }
}));

const WalletConnectModal = () => {
  const BASE_URL = process.env.API_URL;

  const {
    darkMode,
    openWalletModal,
    setOpenWalletModal,
    openLogin,
    qrUrl,
    nextUrl,
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
          // console.log(`${response.result?.address} - ${response.result?.publicKey}`);
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
      console.log(err);
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
          <LoginDialog
            open={openLogin}
            handleClose={handleLoginClose}
            qrUrl={qrUrl}
            nextUrl={nextUrl}
          />
        ) : (
          <>
            <ModalTitle variant="modal">Connect Wallet</ModalTitle>
            <Stack spacing={2}>
              <WalletItem direction="row" spacing={2} alignItems="center" onClick={handleLogin}>
                <WalletIcon src="/icons/xaman.png" alt="Xaman Wallet" className="wallet-icon" />
                <Stack sx={{ flexGrow: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography
                      variant="h6"
                      component="div"
                      className="wallet-name"
                      sx={{
                        fontWeight: 600,
                        transition: 'color 0.3s ease'
                      }}
                    >
                      Xaman
                    </Typography>
                    <Tooltip
                      title="Xaman charges fees for trading (0.8%) and some transactions (0.09 XRP). Most basic transfers remain free."
                      arrow
                      placement="top"
                      enterDelay={0}
                      leaveDelay={0}
                      PopperProps={{
                        sx: {
                          zIndex: 10000 // Higher than dialog
                        }
                      }}
                    >
                      <div style={{ display: 'inline-block' }}>
                        <FeeTag
                          isFree={false}
                          title="Xaman charges fees for trading (0.8%) and some transactions (0.09 XRP). Most basic transfers remain free."
                        >
                          Fee
                        </FeeTag>
                      </div>
                    </Tooltip>
                  </Stack>
                  <Typography
                    variant="body2"
                    sx={{
                      color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary'
                    }}
                  >
                    Mobile Wallet
                  </Typography>
                </Stack>
                <Typography
                  component="a"
                  href="https://xaman.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    marginLeft: 'auto',
                    color: 'text.secondary',
                    '&:hover': { color: 'primary.main' }
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <DownloadButton size="small" aria-label="Download Xaman Wallet">
                    <DownloadIcon />
                  </DownloadButton>
                </Typography>
              </WalletItem>

              <StyledDivider />

              <WalletItem
                direction="row"
                spacing={2}
                alignItems="center"
                onClick={handleConnectGem}
              >
                <WalletIcon src="/icons/gem.svg" alt="GemWallet" className="wallet-icon" />
                <Stack sx={{ flexGrow: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography
                      variant="h6"
                      component="div"
                      className="wallet-name"
                      sx={{
                        fontWeight: 600,
                        transition: 'color 0.3s ease'
                      }}
                    >
                      GemWallet
                    </Typography>
                    <Tooltip
                      title="GemWallet is completely free to use with no additional fees beyond standard XRPL network fees"
                      arrow
                      placement="top"
                      enterDelay={0}
                      leaveDelay={0}
                      PopperProps={{
                        sx: {
                          zIndex: 10000 // Higher than dialog
                        }
                      }}
                    >
                      <div style={{ display: 'inline-block' }}>
                        <FeeTag
                          isFree={true}
                          title="GemWallet is completely free to use with no additional fees beyond standard XRPL network fees"
                        >
                          Free
                        </FeeTag>
                      </div>
                    </Tooltip>
                  </Stack>
                  <Typography
                    variant="body2"
                    sx={{
                      color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary'
                    }}
                  >
                    Browser Wallet
                  </Typography>
                </Stack>
                <Typography
                  component="a"
                  href="https://gemwallet.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    marginLeft: 'auto',
                    color: 'text.secondary',
                    '&:hover': { color: 'primary.main' }
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <DownloadButton size="small" aria-label="Download GemWallet">
                    <DownloadIcon />
                  </DownloadButton>
                </Typography>
              </WalletItem>

              <StyledDivider />

              <WalletItem
                direction="row"
                spacing={2}
                alignItems="center"
                onClick={handleConnectCrossmark}
              >
                <WalletIcon
                  src="/icons/crossmark.png"
                  alt="CrossMark Wallet"
                  className="wallet-icon"
                />
                <Stack sx={{ flexGrow: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography
                      variant="h6"
                      component="div"
                      className="wallet-name"
                      sx={{
                        fontWeight: 600,
                        transition: 'color 0.3s ease'
                      }}
                    >
                      CrossMark
                    </Typography>
                    <Tooltip
                      title="CrossMark is free to use with no wallet fees, only standard XRPL network transaction fees apply"
                      arrow
                      placement="top"
                      enterDelay={0}
                      leaveDelay={0}
                      PopperProps={{
                        sx: {
                          zIndex: 10000 // Higher than dialog
                        }
                      }}
                    >
                      <div style={{ display: 'inline-block' }}>
                        <FeeTag
                          isFree={true}
                          title="CrossMark is free to use with no wallet fees, only standard XRPL network transaction fees apply"
                        >
                          Free
                        </FeeTag>
                      </div>
                    </Tooltip>
                  </Stack>
                  <Typography
                    variant="body2"
                    sx={{
                      color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary'
                    }}
                  >
                    Browser Wallet
                  </Typography>
                </Stack>
                <Typography
                  component="a"
                  href="https://crossmark.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    marginLeft: 'auto',
                    color: 'text.secondary',
                    '&:hover': { color: 'primary.main' }
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <DownloadButton size="small" aria-label="Download CrossMark Wallet">
                    <DownloadIcon />
                  </DownloadButton>
                </Typography>
              </WalletItem>
            </Stack>
          </>
        )}
      </StyledDialogContent>
    </StyledDialog>
  );
};

export default WalletConnectModal;
