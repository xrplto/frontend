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
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.4)'
  },
  '& .MuiDialog-paper': {
    borderRadius: '24px',
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
    border:
      theme.palette.mode === 'dark'
        ? `1px solid ${alpha(theme.palette.divider, 0.08)}`
        : `1px solid ${alpha(theme.palette.divider, 0.08)}`,
    boxShadow:
      theme.palette.mode === 'dark'
        ? `0 8px 32px ${alpha(theme.palette.common.black, 0.06)}, 0 2px 8px ${alpha(
            theme.palette.primary.main,
            0.04
          )}`
        : `0 8px 32px ${alpha(theme.palette.common.black, 0.06)}, 0 2px 8px ${alpha(
            theme.palette.primary.main,
            0.04
          )}`,
    overflow: 'hidden',
    width: '100%',
    maxWidth: '450px',
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '2px',
      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main}, ${theme.palette.info.main})`,
      opacity: 0.8
    }
  }
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  background:
    theme.palette.mode === 'dark'
      ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(
          theme.palette.background.paper,
          0.4
        )} 100%)`
      : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(
          theme.palette.background.paper,
          0.4
        )} 100%)`,
  backdropFilter: 'blur(10px)',
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
  position: 'relative'
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(3),
  paddingBottom: theme.spacing(4),
  background: 'transparent',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '60px',
    height: '4px',
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`,
    borderRadius: '2px',
    opacity: 0.8
  }
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
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

const WalletItem = styled(Stack)(({ theme }) => ({
  padding: theme.spacing(2),
  cursor: 'pointer',
  borderRadius: '16px',
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(
    theme.palette.background.paper,
    0.7
  )} 100%)`,
  backdropFilter: 'blur(20px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}`,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(
      theme.palette.success.main,
      0.05
    )} 100%)`,
    opacity: 0,
    transition: 'opacity 0.3s ease',
    zIndex: -1
  },
  '&:hover': {
    transform: 'translateY(-4px)',
    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(
      theme.palette.background.paper,
      0.8
    )} 100%)`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    boxShadow: `0 16px 48px ${alpha(theme.palette.common.black, 0.12)}, 0 4px 16px ${alpha(
      theme.palette.primary.main,
      0.1
    )}`,
    '&::before': {
      opacity: 1
    },
    '& .wallet-name': {
      color: theme.palette.primary.main
    },
    '& .wallet-icon': {
      transform: 'scale(1.1)',
      filter: `drop-shadow(0 0 8px ${alpha(theme.palette.primary.main, 0.3)})`
    }
  },
  '&:active': {
    transform: 'translateY(-2px) scale(0.98)'
  }
}));

const WalletIcon = styled('img')(({ theme }) => ({
  width: '40px',
  height: '40px',
  borderRadius: '12px',
  border: `2px solid ${alpha(theme.palette.divider, 0.1)}`,
  transition: 'all 0.3s ease',
  boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.1)}`
}));

const DownloadButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  borderRadius: '8px',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.2),
    transform: 'scale(1.1)',
    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
  },
  '& .MuiSvgIcon-root': {
    color: theme.palette.primary.main,
    fontSize: 'inherit'
  }
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
  borderColor: alpha(theme.palette.divider, 0.08),
  margin: theme.spacing(1, 0),
  '&::before, &::after': {
    borderColor: 'inherit'
  }
}));

const ModalTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '1.5rem',
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.success.main} 100%)`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  marginBottom: theme.spacing(2)
}));

const FeeTag = styled('div')(({ theme, isFree }) => ({
  padding: theme.spacing(0.25, 0.75),
  borderRadius: '8px',
  fontSize: '0.65rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  display: 'inline-block',
  background: isFree
    ? `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.15)} 0%, ${alpha(
        theme.palette.success.main,
        0.08
      )} 100%)`
    : `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.15)} 0%, ${alpha(
        theme.palette.warning.main,
        0.08
      )} 100%)`,
  color: isFree ? theme.palette.success.main : theme.palette.warning.main,
  border: `1px solid ${
    isFree ? alpha(theme.palette.success.main, 0.3) : alpha(theme.palette.warning.main, 0.3)
  }`,
  boxShadow: isFree
    ? `0 1px 4px ${alpha(theme.palette.success.main, 0.2)}`
    : `0 1px 4px ${alpha(theme.palette.warning.main, 0.2)}`,
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'scale(1.02)',
    boxShadow: isFree
      ? `0 2px 8px ${alpha(theme.palette.success.main, 0.3)}`
      : `0 2px 8px ${alpha(theme.palette.warning.main, 0.3)}`
  }
}));

const RecommendedChip = styled('div')(({ theme }) => ({
  padding: theme.spacing(0.25, 0.75),
  borderRadius: '8px',
  fontSize: '0.65rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  display: 'inline-block',
  background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.15)} 0%, ${alpha(
    theme.palette.info.main,
    0.08
  )} 100%)`,
  color: theme.palette.info.main,
  border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
  boxShadow: `0 1px 4px ${alpha(theme.palette.info.main, 0.2)}`,
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'scale(1.02)',
    boxShadow: `0 2px 8px ${alpha(theme.palette.info.main, 0.3)}`
  }
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
            <Stack spacing={2}>
              <WalletItem direction="row" spacing={2} alignItems="center" onClick={handleLogin}>
                <WalletIcon src="/static/xaman.webp" alt="Xaman Wallet" className="wallet-icon" />
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
                    <RecommendedChip>Recommended</RecommendedChip>
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
                      color: alpha(theme.palette.text.secondary, 0.8)
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
                    color: alpha(theme.palette.text.secondary, 0.7),
                    transition: 'color 0.2s ease',
                    '&:hover': { color: theme.palette.primary.main }
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
                <WalletIcon src="/static/gem.svg" alt="GemWallet" className="wallet-icon" />
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
                    <RecommendedChip>Recommended</RecommendedChip>
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
                      color: alpha(theme.palette.text.secondary, 0.8)
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
                    color: alpha(theme.palette.text.secondary, 0.7),
                    transition: 'color 0.2s ease',
                    '&:hover': { color: theme.palette.primary.main }
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
                  src="/static/crossmark.webp"
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
                      color: alpha(theme.palette.text.secondary, 0.8)
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
                    color: alpha(theme.palette.text.secondary, 0.7),
                    transition: 'color 0.2s ease',
                    '&:hover': { color: theme.palette.primary.main }
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
