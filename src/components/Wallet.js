import { useRef, useState, useEffect, useCallback } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Image from 'next/image';
import { startAuthentication } from '@simplewebauthn/browser';
import { Wallet as XRPLWallet } from 'xrpl';
import CryptoJS from 'crypto-js';

// Material
import {
  alpha,
  styled,
  Avatar,
  // Badge,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  Link,
  MenuItem,
  Dialog,
  DialogContent,
  Stack,
  Tooltip,
  Typography,
  useTheme,
  Chip,
  Fade
  // useMediaQuery
} from '@mui/material';
// import GridOnIcon from '@mui/icons-material/GridOn';
// import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
// import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
// import AccountBoxIcon from '@mui/icons-material/AccountBox';
import SettingsIcon from '@mui/icons-material/Settings';
// import AssignmentReturnedIcon from '@mui/icons-material/AssignmentReturned';
// import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
// import ImportExportIcon from '@mui/icons-material/ImportExport';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import LogoutIcon from '@mui/icons-material/Logout';
// import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import HelpIcon from '@mui/icons-material/Help';
import { AccountBalanceWallet as AccountBalanceWalletIcon } from '@mui/icons-material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import KeyIcon from '@mui/icons-material/Key';
import WarningIcon from '@mui/icons-material/Warning';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Internationalization
import { useTranslation } from 'react-i18next';

// Iconify
// import { Icon } from '@iconify/react';
// import userLock from '@iconify/icons-fa-solid/user-lock';
// import link45deg from '@iconify/icons-bi/link-45deg';
// import linkExternal from '@iconify/icons-charm/link-external';
// import externalLinkLine from '@iconify/icons-ri/external-link-line';
// import paperIcon from '@iconify/icons-akar-icons/paper';
// import copyIcon from '@iconify/icons-fad/copy';

// Utils
import { getHashIcon } from 'src/utils/extra';

// const pair = {
//   '534F4C4F00000000000000000000000000000000': 'SOLO',
//   XRP: 'XRP'
// };

const ActiveIndicator = styled(Box)(({ theme }) => ({
  width: 6,
  height: 6,
  borderRadius: '50%',
  flexShrink: 0,
  background: `linear-gradient(45deg, ${theme.palette.success.light}, ${theme.palette.success.main})`,
  boxShadow: `0 0 12px ${alpha(theme.palette.success.main, 0.5)}`,
  animation: 'glow 2s ease-in-out infinite',
  '@keyframes glow': {
    '0%, 100%': {
      opacity: 1,
      transform: 'scale(1)'
    },
    '50%': {
      opacity: 0.7,
      transform: 'scale(1.2)'
    }
  }
}));

const TokenImage = styled(Image)(({ theme }) => ({
  borderRadius: '50%',
  overflow: 'hidden'
}));

const StyledPopoverPaper = styled(Box)(({ theme }) => ({
  background:
    theme.palette.mode === 'dark'
      ? `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.default, 0.98)} 100%)`
      : `linear-gradient(145deg, ${theme.palette.common.white} 0%, ${alpha(theme.palette.grey[50], 0.95)} 100%)`,
  border: `1px solid ${theme.palette.mode === 'dark'
    ? alpha(theme.palette.common.white, 0.05)
    : alpha(theme.palette.common.black, 0.05)}`,
  borderRadius: 24,
  boxShadow: theme.palette.mode === 'dark'
    ? `0 20px 60px ${alpha(theme.palette.common.black, 0.5)}`
    : `0 20px 60px ${alpha(theme.palette.common.black, 0.1)}`,
  overflow: 'hidden',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.common.white, 0.2)}, transparent)`
  }
}));

const BalanceCard = styled(Card)(({ theme }) => ({
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.15)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`
    : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.08)} 0%, ${theme.palette.common.white} 100%)`,
  border: 'none',
  borderRadius: 20,
  boxShadow: 'none',
  position: 'relative',
  overflow: 'visible',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&::after': {
    content: '""',
    position: 'absolute',
    inset: 0,
    borderRadius: 20,
    padding: 1,
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)}, transparent)`,
    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'xor',
    maskComposite: 'exclude'
  },
  '&:hover': {
    transform: 'translateY(-2px) scale(1.02)',
    '&::after': {
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.4)}, transparent)`
    }
  }
}));

const ReserveCard = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.08)} 0%, ${alpha(theme.palette.warning.light, 0.04)} 100%)`,
  border: 'none',
  borderRadius: 16,
  padding: theme.spacing(2),
  position: 'relative',
  transition: 'all 0.3s ease',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 16,
    width: 3,
    height: '100%',
    background: theme.palette.warning.main,
    borderRadius: 2
  }
}));

// function truncate(str, n) {
//   if (!str) return '';
//   //return (str.length > n) ? str.substr(0, n-1) + '&hellip;' : str;
//   return str.length > n ? str.substr(0, n - 1) + ' ...' : str;
// }

function truncateAccount(str, length = 9) {
  if (!str) return '';
  return str.slice(0, length) + '...' + str.slice(length * -1);
}

// Shared component for consistent wallet content across both modes
const WalletContent = ({
  theme,
  accountLogin,
  accountBalance,
  accountTotalXrp,
  accountsActivation,
  profiles,
  onClose,
  onAccountSwitch,
  onMoreAccounts,
  onLogout,
  onRemoveProfile,
  openSnackbar,
  isEmbedded = false
}) => {
  return (
    <>
      {/* Header */}
      <Box sx={{
        p: 2,
        background: theme.palette.mode === 'dark'
          ? 'rgba(0,0,0,0.3)'
          : 'rgba(255,255,255,0.7)',
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        position: 'relative',
        zIndex: 1
      }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={isEmbedded ? 1.5 : 2} alignItems="center">
            <Box sx={{
              width: isEmbedded ? 8 : 10,
              height: isEmbedded ? 8 : 10,
              borderRadius: '2px',
              background: accountsActivation[accountLogin] === false
                ? theme.palette.error.main
                : `linear-gradient(45deg, #00ff88, #00ffff)`,
              boxShadow: accountsActivation[accountLogin] !== false
                ? isEmbedded ? '0 0 15px rgba(0,255,136,0.4)' : '0 0 20px rgba(0,255,136,0.5)'
                : 'none'
            }} />
            <Typography sx={{
              fontFamily: 'monospace',
              fontSize: isEmbedded ? '0.8rem' : '0.85rem',
              fontWeight: 600,
              letterSpacing: '0.5px'
            }}>
              {truncateAccount(accountLogin, 8)}
            </Typography>
          </Stack>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Stack>
      </Box>

      {/* Balance Display */}
      <Box sx={{
        p: isEmbedded ? 3 : 4,
        textAlign: 'center',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, transparent 100%)'
          : 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, transparent 100%)'
      }}>
        <Typography sx={{
          fontSize: isEmbedded ? '2.5rem' : '3.5rem',
          fontWeight: 900,
          lineHeight: 1,
          fontFamily: 'system-ui',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: isEmbedded ? 0.5 : 1
        }}>
          {accountBalance?.curr1?.value || '0'}
        </Typography>
        <Typography sx={{
          fontSize: isEmbedded ? '0.7rem' : '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: isEmbedded ? '1.5px' : '2px',
          opacity: 0.5,
          fontWeight: 600
        }}>
          XRP Balance
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Box sx={{ px: isEmbedded ? 2 : 3, pb: isEmbedded ? 2 : 3 }}>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1,
          mb: isEmbedded ? 2 : 3
        }}>
          <Box sx={{
            p: isEmbedded ? 1.5 : 2,
            borderRadius: isEmbedded ? '8px' : '12px',
            background: alpha(theme.palette.primary.main, 0.05),
            textAlign: 'center'
          }}>
            <Typography sx={{ fontSize: isEmbedded ? '1rem' : '1.2rem', fontWeight: 700 }}>
              {accountBalance?.curr1?.value || '0'}
            </Typography>
            <Typography sx={{ fontSize: isEmbedded ? '0.6rem' : '0.65rem', opacity: 0.7 }}>Available</Typography>
          </Box>
          <Box sx={{
            p: isEmbedded ? 1.5 : 2,
            borderRadius: isEmbedded ? '8px' : '12px',
            background: alpha(theme.palette.warning.main, 0.05),
            textAlign: 'center'
          }}>
            <Typography sx={{ fontSize: isEmbedded ? '1rem' : '1.2rem', fontWeight: 700, color: theme.palette.warning.main }}>
              {Number(accountTotalXrp) - Number(accountBalance?.curr1?.value) || '0'}
            </Typography>
            <Typography sx={{ fontSize: isEmbedded ? '0.6rem' : '0.65rem', opacity: 0.7 }}>Reserved</Typography>
          </Box>
          <Box sx={{
            p: isEmbedded ? 1.5 : 2,
            borderRadius: isEmbedded ? '8px' : '12px',
            background: alpha(theme.palette.success.main, 0.05),
            textAlign: 'center'
          }}>
            <Typography sx={{ fontSize: isEmbedded ? '1rem' : '1.2rem', fontWeight: 700 }}>
              {accountTotalXrp || '0'}
            </Typography>
            <Typography sx={{ fontSize: isEmbedded ? '0.6rem' : '0.65rem', opacity: 0.7 }}>Total</Typography>
          </Box>
        </Box>

        {/* Action Buttons - Only show for popover mode */}
        {!isEmbedded && (
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2 }}>
            <Link
              underline="none"
              color="inherit"
              href={`/profile/${accountLogin}`}
              rel="noreferrer noopener nofollow"
            >
              <Button
                fullWidth
                onClick={onClose}
                sx={{
                  py: 2,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)'
                  }
                }}
              >
                <Stack spacing={0.5} alignItems="center">
                  <AccountBalanceWalletIcon />
                  <Typography sx={{ fontSize: '0.75rem' }}>Wallet</Typography>
                </Stack>
              </Button>
            </Link>

            <CopyToClipboard
              text={accountLogin}
              onCopy={() => openSnackbar('Address copied!', 'success')}
            >
              <Button
                fullWidth
                sx={{
                  py: 2,
                  borderRadius: '12px',
                  background: alpha(theme.palette.text.primary, 0.05),
                  color: theme.palette.text.primary,
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': {
                    background: alpha(theme.palette.text.primary, 0.1)
                  }
                }}
              >
                <Stack spacing={0.5} alignItems="center">
                  <ContentCopyIcon />
                  <Typography sx={{ fontSize: '0.75rem' }}>Copy</Typography>
                </Stack>
              </Button>
            </CopyToClipboard>
          </Box>
        )}
      </Box>

      {/* Accounts List */}
      {profiles.filter((profile) => profile.account !== accountLogin).length > 0 && (
        <Box sx={{
          maxHeight: isEmbedded ? 'none' : 200,
          overflowY: isEmbedded ? 'visible' : 'auto',
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          borderBottom: isEmbedded ? 'none' : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          flex: isEmbedded ? 1 : 'none'
        }}>
          <Typography sx={{
            px: 2,
            py: 1,
            fontSize: isEmbedded ? '0.65rem' : '0.7rem',
            fontWeight: 600,
            opacity: 0.5,
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Switch Account
          </Typography>
          {profiles
            .filter((profile) => profile.account !== accountLogin)
            .slice(0, isEmbedded ? 6 : undefined)
            .map((profile, idx) => {
              const account = profile.account;
              return (
                <Box
                  key={'account' + idx}
                  onClick={() => onAccountSwitch(account)}
                  sx={{
                    px: 2,
                    py: isEmbedded ? 1.2 : 1.5,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background 0.2s',
                    '&:hover': {
                      background: alpha(theme.palette.primary.main, 0.05)
                    }
                  }}
                >
                  <Stack direction="row" spacing={isEmbedded ? 1 : 1.5} alignItems="center">
                    <Box sx={{
                      width: isEmbedded ? 6 : 8,
                      height: isEmbedded ? 6 : 8,
                      borderRadius: '50%',
                      background: accountsActivation[account] === false
                        ? theme.palette.error.main
                        : theme.palette.success.main
                    }} />
                    <Typography sx={{
                      fontFamily: 'monospace',
                      fontSize: isEmbedded ? '0.75rem' : '0.8rem'
                    }}>
                      {truncateAccount(account, 8)}
                    </Typography>
                  </Stack>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveProfile(account);
                    }}
                    sx={{ opacity: isEmbedded ? 0.3 : 0.5, '&:hover': { opacity: 1 } }}
                  >
                    <CloseIcon sx={{ fontSize: isEmbedded ? 12 : 14 }} />
                  </IconButton>
                </Box>
              );
            })}
        </Box>
      )}

      {/* Bottom Actions */}
      <Box sx={{
        p: 2,
        borderTop: isEmbedded ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none',
        display: 'flex',
        gap: 1
      }}>
        {isEmbedded ? (
          <>
            <Link
              underline="none"
              color="inherit"
              href={`/profile/${accountLogin}`}
              rel="noreferrer noopener nofollow"
              sx={{ flex: 1 }}
            >
              <Button
                fullWidth
                onClick={onClose}
                sx={{
                  py: 1.2,
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  textTransform: 'none',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                  }
                }}
              >
                <Stack spacing={0.3} alignItems="center">
                  <AccountBalanceWalletIcon sx={{ fontSize: 16 }} />
                  <Typography sx={{ fontSize: '0.65rem' }}>Wallet</Typography>
                </Stack>
              </Button>
            </Link>

            <CopyToClipboard
              text={accountLogin}
              onCopy={() => openSnackbar('Address copied!', 'success')}
            >
              <Button
                sx={{
                  px: 2,
                  py: 1.2,
                  borderRadius: '8px',
                  background: alpha(theme.palette.text.primary, 0.05),
                  color: theme.palette.text.primary,
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  textTransform: 'none',
                  '&:hover': {
                    background: alpha(theme.palette.text.primary, 0.1)
                  }
                }}
              >
                <ContentCopyIcon sx={{ fontSize: 16 }} />
              </Button>
            </CopyToClipboard>
          </>
        ) : (
          <Button
            fullWidth
            onClick={onMoreAccounts}
            sx={{
              py: 1.5,
              borderRadius: '10px',
              background: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              fontWeight: 600,
              fontSize: '0.85rem',
              textTransform: 'none',
              '&:hover': {
                background: alpha(theme.palette.primary.main, 0.15)
              }
            }}
          >
            <AddCircleOutlineIcon sx={{ fontSize: 18, mr: 1 }} />
            Add Account
          </Button>
        )}

        <Button
          onClick={isEmbedded ? onMoreAccounts : undefined}
          sx={{
            px: isEmbedded ? 2 : 3,
            py: isEmbedded ? 1.2 : 1.5,
            borderRadius: isEmbedded ? '8px' : '10px',
            background: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main,
            fontWeight: 600,
            fontSize: isEmbedded ? '0.8rem' : '0.85rem',
            textTransform: 'none',
            '&:hover': {
              background: alpha(theme.palette.primary.main, 0.15)
            }
          }}
        >
          <AddCircleOutlineIcon sx={{ fontSize: isEmbedded ? 16 : 18 }} />
        </Button>

        <Button
          onClick={onLogout}
          sx={{
            px: isEmbedded ? 2 : 3,
            py: isEmbedded ? 1.2 : 1.5,
            borderRadius: isEmbedded ? '8px' : '10px',
            background: alpha(theme.palette.error.main, 0.1),
            color: theme.palette.error.main,
            fontWeight: 600,
            fontSize: isEmbedded ? '0.8rem' : '0.85rem',
            textTransform: 'none',
            '&:hover': {
              background: alpha(theme.palette.error.main, 0.15)
            }
          }}
        >
          <LogoutIcon sx={{ fontSize: isEmbedded ? 16 : 18 }} />
        </Button>
      </Box>
    </>
  );
};

export default function Wallet({ style, embedded = false, onClose, buttonOnly = false }) {
  const theme = useTheme();
  const { t } = useTranslation();
  // const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const anchorRef = useRef(null);
  const [showingSeed, setShowingSeed] = useState(false);
  const [currentSeed, setCurrentSeed] = useState('');
  const [seedBlurred, setSeedBlurred] = useState(true);
  const [showAllAccounts, setShowAllAccounts] = useState(false);
  const [accountsActivation, setAccountsActivation] = useState({});
  const [visibleAccountCount, setVisibleAccountCount] = useState(5);
  const [isCheckingActivation, setIsCheckingActivation] = useState(false);
  const {
    setActiveProfile,
    accountProfile,
    profiles,
    setProfiles,
    removeProfile,
    openSnackbar,
    darkMode,
    setOpenWalletModal,
    open,
    setOpen,
    accountBalance,
    handleOpen,
    handleClose,
    handleLogin,
    handleLogout,
    doLogIn
  } = useContext(AppContext);

  const checkAccountActivity = useCallback(async (address) => {
    try {
      const response = await fetch(`https://api.xrpl.to/api/account/account_info/${address}`);
      const data = await response.json();
      if (data.account_data && data.account_data.Balance) {
        const balance = parseFloat(data.account_data.Balance) / 1000000;
        return balance >= 1;
      }
      return false;
    } catch (err) {
      return false;
    }
  }, []);

  useEffect(() => {
    const checkVisibleAccountsActivation = async () => {
      if (profiles.length === 0) return;

      setIsCheckingActivation(true);
      const startTime = performance.now();

      // Get visible accounts (exclude current account, then take first visibleAccountCount)
      const otherAccounts = profiles.filter(profile => profile.account !== accountProfile?.account);
      const visibleAccounts = otherAccounts.slice(0, visibleAccountCount);
      const uncheckedAccounts = visibleAccounts.filter(
        profile => !(profile.account in accountsActivation)
      );

      // Also check current account if not already checked
      if (accountProfile?.account && !(accountProfile.account in accountsActivation)) {
        uncheckedAccounts.unshift({ account: accountProfile.account });
      }

      if (uncheckedAccounts.length === 0) {
        setIsCheckingActivation(false);
        return;
      }

      console.log(`🔍 Checking ${uncheckedAccounts.length} accounts...`);

      // Process in smaller batches to avoid rate limiting
      const batchSize = 3;
      const newActivationStatus = { ...accountsActivation };
      let activeCount = 0;

      for (let i = 0; i < uncheckedAccounts.length; i += batchSize) {
        const batch = uncheckedAccounts.slice(i, i + batchSize);
        const batchPromises = batch.map(async (profile) => {
          const isActive = await checkAccountActivity(profile.account);
          return { account: profile.account, isActive };
        });

        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(({ account, isActive }) => {
          newActivationStatus[account] = isActive;
          if (isActive) activeCount++;
        });

        // Add delay between batches to avoid rate limiting
        if (i + batchSize < uncheckedAccounts.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const totalActive = Object.values(newActivationStatus).filter(Boolean).length;

      console.log(`✅ Checked ${uncheckedAccounts.length} accounts: ${totalActive}/${Object.keys(newActivationStatus).length} active (${duration.toFixed(0)}ms)`);

      setAccountsActivation(newActivationStatus);
      setIsCheckingActivation(false);
    };

    checkVisibleAccountsActivation();
  }, [profiles, visibleAccountCount, accountsActivation, checkAccountActivity]);

  const getStoredWallets = () => {
    const storedWallets = localStorage.getItem('deviceWallets');
    if (!storedWallets) return [];
    try {
      return JSON.parse(storedWallets);
    } catch (error) {
      console.error('Error parsing stored wallets:', error);
      return [];
    }
  };

  const storeWallet = (deviceKeyId, wallet, accountIndex = 0) => {
    const walletData = {
      deviceKeyId,
      accountIndex,
      account: wallet.address,  // AppContext expects 'account' field
      address: wallet.address,
      publicKey: wallet.publicKey,
      wallet_type: 'device',
      xrp: '0',
      createdAt: Date.now()
    };

    const storedWallets = getStoredWallets();
    // Check if wallet already exists
    if (!storedWallets.find(w => w.address === wallet.address)) {
      storedWallets.push(walletData);
      localStorage.setItem('deviceWallets', JSON.stringify(storedWallets));
    }
    return walletData;
  };


  const handleShowSeed = async () => {
    openSnackbar('Seed display not available for device wallets - seeds are stored securely and not accessible', 'info');
  };

  const handleMoreAccounts = async () => {
    // First check if we already have device wallets stored
    const storedWallets = getStoredWallets();
    const deviceWallets = storedWallets.filter(w => w.wallet_type === 'device');
    const deviceWalletsInProfiles = profiles.filter(p => p.wallet_type === 'device');

    // If we have stored wallets but they're not in profiles, load them first
    if (deviceWalletsInProfiles.length < deviceWallets.length) {
      const allProfiles = [...profiles];
      deviceWallets.forEach(deviceWallet => {
        if (!allProfiles.find(p => p.account === deviceWallet.account)) {
          allProfiles.push(deviceWallet);
        }
      });
      setProfiles(allProfiles);
      window.localStorage.setItem('account_profiles_2', JSON.stringify(allProfiles));
      openSnackbar(`Loaded ${deviceWallets.length} device wallets`, 'success');
      return;
    }

    // Always allow creating more wallets - open the modal
    setOpenWalletModal(true);
  };

  const handleAddPasskeyAccount = async () => {
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const challengeB64 = btoa(String.fromCharCode(...challenge))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

      // Authenticate with any available passkey
      const authResponse = await startAuthentication({
        challenge: challengeB64,
        timeout: 60000,
        userVerification: 'required'
      });

      if (authResponse.id) {
        // Check if this device key already has a wallet
        const storedWallets = getStoredWallets();
        const existingWallets = storedWallets.filter(w => w.deviceKeyId === authResponse.id);


        if (existingWallets.length > 0) {
          // Use existing wallets - update profiles directly
          doLogIn(existingWallets[0]);

          // Directly update profiles state with all existing wallets
          const allProfiles = [...profiles];
          existingWallets.forEach(deviceProfile => {
            if (!allProfiles.find(p => p.account === deviceProfile.account)) {
              allProfiles.push(deviceProfile);
            }
          });
          setProfiles(allProfiles);
          window.localStorage.setItem('account_profiles_2', JSON.stringify(allProfiles));

          openSnackbar(`Switched to device wallet ${existingWallets[0].address.slice(0, 8)}... (${existingWallets.length} total)`, 'success');
        } else {
          // Create 5 new random wallets for this device key
          const wallets = [];
          const KEY_ACCOUNT_PROFILES = 'account_profiles_2';
          const currentProfiles = JSON.parse(window.localStorage.getItem(KEY_ACCOUNT_PROFILES) || '[]');


          for (let i = 0; i < 5; i++) {
            const wallet = XRPLWallet.generate();
            const walletData = storeWallet(authResponse.id, wallet, i);
            wallets.push(walletData);

            // Add to profiles localStorage for compatibility
            const profile = { ...walletData, tokenCreatedAt: Date.now() };
            if (!currentProfiles.find(p => p.account === profile.address)) {
              currentProfiles.push(profile);
            }
          }

          window.localStorage.setItem(KEY_ACCOUNT_PROFILES, JSON.stringify(currentProfiles));

          // Directly update profiles state with all new wallets
          const allProfiles = [...profiles];
          wallets.forEach(deviceProfile => {
            if (!allProfiles.find(p => p.account === deviceProfile.account)) {
              allProfiles.push(deviceProfile);
            }
          });
          setProfiles(allProfiles);

          // Also post message as backup
          window.postMessage({
            type: 'DEVICE_LOGIN_SUCCESS',
            profile: wallets[0],
            allDeviceAccounts: wallets
          }, '*');

          openSnackbar(`5 device wallets created: ${wallets.map(w => w.address.slice(0, 6)).join(', ')}...`, 'success');
        }

        setOpen(false);
      }
    } catch (err) {
      openSnackbar('Failed to create/access device wallet: ' + err.message, 'error');
    }
  };
  const accountLogin = accountProfile?.account;
  const accountLogo = accountProfile?.logo;
  const accountTotalXrp = accountProfile?.xrp;
  // const isAdmin = accountProfile?.admin;

  let logoImageUrl = null;
  if (accountProfile) {
    logoImageUrl = accountLogo
      ? `https://s1.xrpl.to/profile/${accountLogo}`
      : getHashIcon(accountLogin);
  }


  // Default button mode with popover
  return (
    <div style={style}>
      <button
        onClick={() => {
          if (accountProfile) {
            setOpen(!open);
          } else {
            setOpenWalletModal(true);
          }
        }}
        ref={anchorRef}
        aria-label={
          accountProfile
            ? `Wallet menu for ${truncateAccount(accountProfile.account)}`
            : 'Connect wallet'
        }
        style={{
          background: accountProfile
            ? theme.palette.primary.main
            : theme.palette.mode === 'dark'
              ? '#2d3436'
              : '#ffffff',
          border: accountProfile
            ? `1px solid ${theme.palette.primary.dark}`
            : `1px solid ${theme.palette.mode === 'dark' ? '#636e72' : '#ddd'}`,
          borderRadius: '6px',
          height: '32px',
          padding: '0 12px',
          color: accountProfile ? '#ffffff' : theme.palette.mode === 'dark' ? '#ffffff' : '#2d3436',
          fontSize: '14px',
          fontWeight: '500',
          fontFamily: 'inherit',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.2s ease',
          outline: 'none'
        }}
        onMouseEnter={(e) => {
          e.target.style.opacity = '0.9';
          e.target.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.target.style.opacity = '1';
          e.target.style.transform = 'translateY(0)';
        }}
        title={accountProfile ? 'Account Details' : t('Connect Wallet')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21,18V19A2,2 0 0,1 19,21H5C3.89,21 3,20.1 3,19V5A2,2 0 0,1 5,3H19A2,2 0 0,1 21,5V6H12C10.89,6 10,6.9 10,8V16A2,2 0 0,0 12,18M12,16H22V8H12M16,13.5A1.5,1.5 0 0,1 14.5,12A1.5,1.5 0 0,1 16,10.5A1.5,1.5 0 0,1 17.5,12A1.5,1.5 0 0,1 16,13.5Z" />
        </svg>
        {accountProfile && (
          <span style={{ fontFamily: 'monospace' }}>{truncateAccount(accountLogin, 6)}</span>
        )}
        {!accountProfile && <span>{t('Connect')}</span>}
      </button>

      {accountProfile && (
        <Dialog
          open={open}
          onClose={handleClose}
          maxWidth="sm"
          fullWidth
          disableEnforceFocus
          disableAutoFocus
          disableRestoreFocus
          hideBackdrop
          sx={{
            '& .MuiDialog-paper': {
              borderRadius: '16px',
              maxWidth: '420px',
              background: 'transparent',
              boxShadow: 'none',
              position: 'fixed',
              top: '48px',
              right: '16px',
              left: 'auto',
              transform: 'none',
              margin: 0
            }
          }}
        >
          <DialogContent sx={{ p: 0 }}>
            <StyledPopoverPaper>
            {/* Animated Background Pattern */}
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.03,
              backgroundImage: `repeating-linear-gradient(
                45deg,
                ${theme.palette.primary.main} 0px,
                ${theme.palette.primary.main} 1px,
                transparent 1px,
                transparent 15px
              )`,
              animation: 'slide 20s linear infinite',
              '@keyframes slide': {
                '0%': { transform: 'translate(0, 0)' },
                '100%': { transform: 'translate(15px, 15px)' }
              },
              pointerEvents: 'none'
            }} />

            <WalletContent
              theme={theme}
              accountLogin={accountLogin}
              accountBalance={accountBalance}
              accountTotalXrp={accountTotalXrp}
              accountsActivation={accountsActivation}
              profiles={profiles}
              onClose={() => setOpen(false)}
              onAccountSwitch={(account) => {
                setActiveProfile(account);
                setOpen(false);
              }}
              onMoreAccounts={handleMoreAccounts}
              onLogout={handleLogout}
              onRemoveProfile={removeProfile}
              openSnackbar={openSnackbar}
              isEmbedded={false}
            />
            </StyledPopoverPaper>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
