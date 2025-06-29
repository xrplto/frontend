import { useContext, useState } from 'react';

import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { Divider, IconButton, Stack, Typography, Tooltip, useTheme } from '@mui/material';
import styled from '@emotion/styled';
import ClearIcon from '@mui/icons-material/Clear';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import { enqueueSnackbar } from 'notistack';
import { alpha } from '@mui/material/styles';

import { isInstalled, getPublicKey, signMessage } from '@gemwallet/api';
import sdk from '@crossmarkio/sdk';

import LoginDialog from '../LoginDialog';
import { AppContext } from 'src/AppContext';
import axios from 'axios';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  '& .MuiBackdrop-root': {
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.3)'
  },
  '& .MuiDialog-paper': {
    borderRadius: '16px',
    background: alpha(theme.palette.background.paper, 0.85),
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
    boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.12)}`,
    overflow: 'hidden',
    width: '100%',
    maxWidth: '420px',
    position: 'relative'
  }
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  padding: theme.spacing(2, 2.5),
  background: 'transparent',
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  position: 'relative'
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(2.5),
  background: 'transparent',
  position: 'relative'
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.text.primary, 0.08),
  borderRadius: '8px',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: alpha(theme.palette.text.primary, 0.12)
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
  background: alpha(theme.palette.background.paper, 0.6),
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  transition: 'all 0.2s ease',
  '&:hover': {
    background: alpha(theme.palette.background.paper, 0.8),
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
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
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  borderRadius: '6px',
  padding: theme.spacing(0.5),
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.15)
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
  background: alpha(isFree ? theme.palette.success.main : theme.palette.warning.main, 0.1),
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
  background: alpha(theme.palette.info.main, 0.1),
  color: theme.palette.info.main,
  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
}));

const WalletConnectModal = () => {
  const theme = useTheme();
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
            </Stack>
          </>
        )}
      </StyledDialogContent>
    </StyledDialog>
  );
};

export default WalletConnectModal;
