import { useContext } from 'react';
import { Button, alpha } from '@mui/material';
import { AccountBalanceWallet as AccountBalanceWalletIcon } from '@mui/icons-material';
import { AppContext } from 'src/AppContext';
import { useTranslation } from 'react-i18next';

const ConnectWallet = () => {
  const { setOpenWalletModal } = useContext(AppContext);
  const { t } = useTranslation();

  return (
    <>
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
    </>
  );
};

export default ConnectWallet;
