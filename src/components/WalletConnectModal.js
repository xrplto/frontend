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

const WalletItem = styled(Stack, {
  shouldForwardProp: (prop) => !['component'].includes(prop)
})(({ theme }) => ({
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
  '&:hover, &:focus': {
    background:
      theme.palette.mode === 'dark'
        ? alpha(theme.palette.background.paper, 0.6)
        : alpha(theme.palette.background.paper, 0.8),
    border: `1px solid ${alpha(theme.palette.primary.main, 0.4)}`,
    transform: 'translateY(-1px)',
    outline: 'none',
    '& .wallet-name': {
      color: theme.palette.primary.main
    }
  }
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
                  sx={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(45deg, #2196F3 0%, #21CBF3 100%)',
                    color: 'white'
                  }}
                >
                  <SecurityIcon />
                </Box>
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
