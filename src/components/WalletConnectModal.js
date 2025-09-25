import { useContext } from 'react';

import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import styled from '@emotion/styled';
import ClearIcon from '@mui/icons-material/Clear';
import { AccountBalanceWallet as AccountBalanceWalletIcon, Security as SecurityIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';


import { AppContext } from 'src/AppContext';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  '& .MuiBackdrop-root': {
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.5)'
  },
  '& .MuiDialog-paper': {
    borderRadius: theme.general?.borderRadiusLg || '16px',
    background: theme.walletDialog?.background ||
      (theme.palette.mode === 'dark'
        ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.85)} 100%)`
        : `linear-gradient(135deg, ${alpha('#FFFFFF', 0.95)} 0%, ${alpha('#FFFFFF', 0.85)} 100%)`),
    backdropFilter: 'blur(40px) saturate(200%)',
    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
    border: `1px solid ${theme.walletDialog?.border || alpha(theme.palette.divider, 0.15)}`,
    boxShadow: theme.palette.mode === 'dark'
      ? `0 8px 32px ${alpha(theme.palette.common.black, 0.4)}, inset 0 1px 0 ${alpha(theme.palette.common.white, 0.1)}`
      : `0 8px 32px ${alpha(theme.palette.common.black, 0.15)}, inset 0 1px 0 ${alpha(theme.palette.common.white, 0.8)}`,
    overflow: 'hidden',
    width: '100%',
    maxWidth: '420px',
    position: 'relative',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    willChange: 'transform'
  }
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  padding: theme.spacing(2, 2.5),
  background: theme.walletDialog?.backgroundSecondary ||
    (theme.palette.mode === 'dark'
      ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`
      : `linear-gradient(135deg, ${alpha(theme.palette.background.default, 0.9)} 0%, ${alpha(theme.palette.background.default, 0.7)} 100%)`),
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  borderBottom: `1px solid ${theme.walletDialog?.border || alpha(theme.palette.divider, 0.12)}`,
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '1px',
    background: `linear-gradient(90deg, transparent 0%, ${alpha(theme.palette.primary.main, 0.3)} 50%, transparent 100%)`
  }
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(2.5),
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.4)} 0%, transparent 100%)`
    : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.6)} 0%, transparent 100%)`,
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  position: 'relative'
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.background.paper, 0.6),
  border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
  borderRadius: theme.general?.borderRadiusSm || '8px',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: alpha(theme.palette.background.paper, 0.8),
    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
    transform: 'scale(1.05)',
    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
  },
  '& .MuiSvgIcon-root': {
    color: theme.palette.text.secondary,
    fontSize: '1.2rem',
    transition: 'color 0.2s ease'
  },
  '&:hover .MuiSvgIcon-root': {
    color: theme.palette.primary.main
  }
}));

const WalletItem = styled(Stack, {
  shouldForwardProp: (prop) => !['component'].includes(prop)
})(({ theme }) => ({
  padding: theme.spacing(1.8, 2.2),
  cursor: 'pointer',
  borderRadius: theme.general?.borderRadius || '12px',
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.5)} 0%, ${alpha(theme.palette.background.paper, 0.3)} 100%)`
    : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`,
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
  boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.1)}, inset 0 1px 0 ${alpha(theme.palette.common.white, 0.05)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  willChange: 'transform',
  '&:hover, &:focus': {
    background: theme.palette.mode === 'dark'
      ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
      : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.5)}`,
    transform: 'translateY(-2px) scale(1.02)',
    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}, inset 0 1px 0 ${alpha(theme.palette.common.white, 0.1)}`,
    outline: 'none',
    '& .wallet-name': {
      color: theme.palette.primary.main
    },
    '& .wallet-icon': {
      transform: 'scale(1.1)',
      filter: 'brightness(1.2)'
    }
  },
  '&:active': {
    transform: 'translateY(-1px) scale(1.01)'
  }
}));



const FeeTag = styled('div')(({ theme, isFree }) => ({
  padding: theme.spacing(0.3, 0.8),
  borderRadius: theme.general?.borderRadiusSm || '6px',
  fontSize: '0.7rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  display: 'inline-block',
  background: isFree
    ? `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.15)} 0%, ${alpha(theme.palette.success.main, 0.08)} 100%)`
    : `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.15)} 0%, ${alpha(theme.palette.warning.main, 0.08)} 100%)`,
  color: isFree ? theme.palette.success.main : theme.palette.warning.main,
  border: `1px solid ${alpha(isFree ? theme.palette.success.main : theme.palette.warning.main, 0.3)}`,
  boxShadow: `0 1px 3px ${alpha(isFree ? theme.palette.success.main : theme.palette.warning.main, 0.2)}`,
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)'
}));



const WalletConnectModal = () => {
  const theme = useTheme();

  const {
    openWalletModal,
    setOpenWalletModal
  } = useContext(AppContext);

  const handleClose = () => {
    setOpenWalletModal(false);
  };

  const handleWalletConnect = () => {
    const popup = window.open('/device-login', 'device-login', 'width=500,height=600,scrollbars=yes,resizable=yes');
    if (!popup) return;

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        setOpenWalletModal(false);
      }
    }, 1000);
  };



  return (
    <StyledDialog
      open={openWalletModal}
      onClose={handleClose}
      aria-labelledby="wallet-connect-title"
      aria-describedby="wallet-connect-description"
      maxWidth={false}
      sx={{ zIndex: 9999 }}
    >
      <StyledDialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography
            id="wallet-connect-title"
            variant="h6"
            component="h2"
            sx={{ fontWeight: 600, color: theme.palette.text.primary }}
          >
            Connect Wallet
          </Typography>
          <ActionButton onClick={handleClose} aria-label="Close dialog">
            <ClearIcon />
          </ActionButton>
        </Stack>
      </StyledDialogTitle>

      <StyledDialogContent>
        <Typography
          id="wallet-connect-description"
          variant="body2"
          sx={{ color: theme.palette.text.secondary, mb: 2 }}
        >
          Choose a wallet to connect to the XRPL network
        </Typography>
        <Stack spacing={1.5} component="nav" role="list">

              <WalletItem
                direction="row"
                spacing={2}
                alignItems="center"
                onClick={handleWalletConnect}
                component="button"
                role="listitem"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleWalletConnect();
                  }
                }}
                sx={{ border: 'none', textAlign: 'left', width: '100%' }}
              >
                <Box
                  className="wallet-icon"
                  sx={{
                    width: '40px',
                    height: '40px',
                    borderRadius: theme => theme.general?.borderRadiusSm || '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: theme => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                    color: 'white',
                    boxShadow: theme => `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}, inset 0 1px 0 ${alpha(theme.palette.common.white, 0.2)}`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    willChange: 'transform'
                  }}
                >
                  <SecurityIcon sx={{ fontSize: '1.4rem' }} />
                </Box>
                <Stack sx={{ flexGrow: 1 }}>
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
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontSize: '0.8rem'
                    }}
                  >
                    Passkey/Biometric
                  </Typography>
                </Stack>
              </WalletItem>
            </Stack>
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
        py: 1.2,
        fontWeight: 600,
        borderRadius: (theme) => theme.general?.borderRadius || '12px',
        position: 'relative',
        overflow: 'hidden',
        background: (theme) => `linear-gradient(135deg,
          ${theme.palette.primary.main} 0%,
          ${theme.palette.primary.light} 50%,
          ${theme.palette.primary.main} 100%)`,
        backgroundSize: '200% 200%',
        animation: 'gradient 4s ease infinite',
        border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
        boxShadow: (theme) => `
          0 4px 20px ${alpha(theme.palette.primary.main, 0.3)},
          0 2px 10px ${alpha(theme.palette.primary.main, 0.2)},
          inset 0 1px 0 ${alpha(theme.palette.common.white, 0.2)}
        `,
        backdropFilter: 'blur(10px) saturate(150%)',
        WebkitBackdropFilter: 'blur(10px) saturate(150%)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: 'transform',
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
          transform: 'translateY(-3px) scale(1.03)',
          boxShadow: (theme) => `
            0 8px 32px ${alpha(theme.palette.primary.main, 0.4)},
            0 4px 16px ${alpha(theme.palette.primary.main, 0.3)},
            inset 0 1px 0 ${alpha(theme.palette.common.white, 0.3)}
          `,
          borderColor: (theme) => alpha(theme.palette.primary.light, 0.6),
          '&::before': {
            opacity: 1
          }
        },
        '&:active': {
          transform: 'translateY(-1px) scale(1.01)'
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
