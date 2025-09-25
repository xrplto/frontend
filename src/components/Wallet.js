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
  Popover,
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
  backdropFilter: 'blur(30px) saturate(150%)',
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
  backdropFilter: 'blur(20px)',
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
  backdropFilter: 'blur(10px)',
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

  // Embedded panel mode - positioned by PageLayout
  if (embedded && accountProfile && open) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          background: theme.palette.background.default,
          borderLeft: `1px solid ${alpha(theme.palette.divider, 0.1)} !important`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Animated Background */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.02,
          backgroundImage: `repeating-linear-gradient(
            45deg,
            ${theme.palette.primary.main} 0px,
            ${theme.palette.primary.main} 1px,
            transparent 1px,
            transparent 12px
          )`,
          animation: 'slide 15s linear infinite',
          '@keyframes slide': {
            '0%': { transform: 'translate(0, 0)' },
            '100%': { transform: 'translate(12px, 12px)' }
          },
          pointerEvents: 'none'
        }} />

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
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{
                width: 8,
                height: 8,
                borderRadius: '2px',
                background: accountsActivation[accountLogin] === false
                  ? theme.palette.error.main
                  : `linear-gradient(45deg, #00ff88, #00ffff)`,
                boxShadow: accountsActivation[accountLogin] !== false
                  ? '0 0 15px rgba(0,255,136,0.4)'
                  : 'none'
              }} />
              <Typography sx={{
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                fontWeight: 600
              }}>
                {truncateAccount(accountLogin, 8)}
              </Typography>
            </Stack>
            <IconButton size="small" onClick={onClose || handleClose}>
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Stack>
        </Box>

        {/* Giant Balance */}
        <Box sx={{
          p: 3,
          textAlign: 'center',
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, transparent 100%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, transparent 100%)'
        }}>
          <Typography sx={{
            fontSize: '2.5rem',
            fontWeight: 900,
            lineHeight: 1,
            fontFamily: 'system-ui',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 0.5
          }}>
            {accountBalance?.curr1?.value || '0'}
          </Typography>
          <Typography sx={{
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            opacity: 0.5,
            fontWeight: 600
          }}>
            XRP Balance
          </Typography>
        </Box>

        {/* Stats */}
        <Box sx={{ px: 2, pb: 2 }}>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1,
            mb: 2
          }}>
            <Box sx={{
              p: 1.5,
              borderRadius: '8px',
              background: alpha(theme.palette.primary.main, 0.05),
              textAlign: 'center'
            }}>
              <Typography sx={{ fontSize: '1rem', fontWeight: 700 }}>
                {accountBalance?.curr1?.value || '0'}
              </Typography>
              <Typography sx={{ fontSize: '0.6rem', opacity: 0.7 }}>Available</Typography>
            </Box>
            <Box sx={{
              p: 1.5,
              borderRadius: '8px',
              background: alpha(theme.palette.warning.main, 0.05),
              textAlign: 'center'
            }}>
              <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: theme.palette.warning.main }}>
                {Number(accountTotalXrp) - Number(accountBalance?.curr1?.value) || '0'}
              </Typography>
              <Typography sx={{ fontSize: '0.6rem', opacity: 0.7 }}>Reserved</Typography>
            </Box>
            <Box sx={{
              p: 1.5,
              borderRadius: '8px',
              background: alpha(theme.palette.success.main, 0.05),
              textAlign: 'center'
            }}>
              <Typography sx={{ fontSize: '1rem', fontWeight: 700 }}>
                {accountTotalXrp || '0'}
              </Typography>
              <Typography sx={{ fontSize: '0.6rem', opacity: 0.7 }}>Total</Typography>
            </Box>
          </Box>
        </Box>


        {/* Account List */}
        <Box sx={{
          flex: 1,
          overflowY: 'auto',
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}>
          <Typography sx={{
            px: 2,
            py: 1,
            fontSize: '0.65rem',
            fontWeight: 600,
            opacity: 0.5,
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Switch Account
          </Typography>
          {profiles
            .filter((profile) => profile.account !== accountLogin)
            .slice(0, 6)
            .map((profile, idx) => {
              const account = profile.account;
              return (
                <Box
                  key={'account' + idx}
                  onClick={() => {
                    setActiveProfile(account);
                    setOpen(false);
                  }}
                  sx={{
                    px: 2,
                    py: 1.2,
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
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: accountsActivation[account] === false
                        ? theme.palette.error.main
                        : theme.palette.success.main
                    }} />
                    <Typography sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.75rem'
                    }}>
                      {truncateAccount(account, 8)}
                    </Typography>
                  </Stack>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeProfile(account);
                    }}
                    sx={{ opacity: 0.3, '&:hover': { opacity: 1 } }}
                  >
                    <CloseIcon sx={{ fontSize: 12 }} />
                  </IconButton>
                </Box>
              );
            })}
        </Box>

        {/* Bottom Actions */}
        <Box sx={{
          p: 2,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          display: 'flex',
          gap: 1
        }}>
          <Link
            underline="none"
            color="inherit"
            href={`/profile/${accountLogin}`}
            rel="noreferrer noopener nofollow"
            sx={{ flex: 1 }}
          >
            <Button
              fullWidth
              onClick={() => setOpen(false)}
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

          <Button
            onClick={handleMoreAccounts}
            sx={{
              px: 2,
              py: 1.2,
              borderRadius: '8px',
              background: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              fontWeight: 600,
              fontSize: '0.8rem',
              textTransform: 'none',
              '&:hover': {
                background: alpha(theme.palette.primary.main, 0.15)
              }
            }}
          >
            <AddCircleOutlineIcon sx={{ fontSize: 16 }} />
          </Button>

          <Button
            onClick={handleLogout}
            sx={{
              px: 2,
              py: 1.2,
              borderRadius: '8px',
              background: alpha(theme.palette.error.main, 0.1),
              color: theme.palette.error.main,
              fontWeight: 600,
              fontSize: '0.8rem',
              textTransform: 'none',
              '&:hover': {
                background: alpha(theme.palette.error.main, 0.15)
              }
            }}
          >
            <LogoutIcon sx={{ fontSize: 16 }} />
          </Button>
        </Box>
      </Box>
    );
  }

  // Default button mode with popover
  return (
    <div style={style}>
      <button
        onClick={() => {
          if (accountProfile) {
            // If buttonOnly, don't open popover, just toggle the embedded panel
            if (buttonOnly) {
              // Just toggle the embedded panel state
              setOpen(!open);
            } else {
              handleOpen();
            }
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

      {accountProfile && !buttonOnly && (
        <Popover
          open={open}
          onClose={handleClose}
          anchorEl={anchorRef.current}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          TransitionComponent={Fade}
          transitionDuration={300}
          PaperProps={{
            sx: {
              mt: 1,
              ml: 0.5,
              background: 'transparent',
              boxShadow: 'none',
              border: 'none',
              minWidth: 420,
              maxWidth: 420
            }
          }}
        >
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

            {/* Minimal Header */}
            <Box sx={{
              p: 2,
              background: theme.palette.mode === 'dark'
                ? 'rgba(0,0,0,0.4)'
                : 'rgba(255,255,255,0.8)',
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '2px',
                    background: accountsActivation[accountLogin] === false
                      ? theme.palette.error.main
                      : `linear-gradient(45deg, #00ff88, #00ffff)`,
                    boxShadow: accountsActivation[accountLogin] !== false
                      ? '0 0 20px rgba(0,255,136,0.5)'
                      : 'none'
                  }} />
                  <Typography sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    letterSpacing: '0.5px'
                  }}>
                    {truncateAccount(accountLogin, 8)}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.5}>
                  <IconButton size="small" onClick={() => setOpen(false)}>
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Stack>
              </Stack>
            </Box>

            {/* Main Content Area */}
            <Box sx={{ p: 0 }}>
              {/* Giant Balance Display */}
              <Box sx={{
                p: 4,
                textAlign: 'center',
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, transparent 100%)'
                  : 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, transparent 100%)'
              }}>
                <Typography sx={{
                  fontSize: '3.5rem',
                  fontWeight: 900,
                  lineHeight: 1,
                  fontFamily: 'system-ui',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1
                }}>
                  {accountBalance?.curr1?.value || '0'}
                </Typography>
                <Typography sx={{
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  opacity: 0.5,
                  fontWeight: 600
                }}>
                  XRP Balance
                </Typography>
              </Box>

              {/* Stats Grid */}
              <Box sx={{ px: 3, pb: 3 }}>
                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: 1,
                  mb: 3
                }}>
                  <Box sx={{
                    p: 2,
                    borderRadius: '12px',
                    background: alpha(theme.palette.primary.main, 0.05),
                    textAlign: 'center'
                  }}>
                    <Typography sx={{ fontSize: '1.2rem', fontWeight: 700 }}>
                      {accountBalance?.curr1?.value || '0'}
                    </Typography>
                    <Typography sx={{ fontSize: '0.65rem', opacity: 0.7 }}>Available</Typography>
                  </Box>
                  <Box sx={{
                    p: 2,
                    borderRadius: '12px',
                    background: alpha(theme.palette.warning.main, 0.05),
                    textAlign: 'center'
                  }}>
                    <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, color: theme.palette.warning.main }}>
                      {Number(accountTotalXrp) - Number(accountBalance?.curr1?.value) || '0'}
                    </Typography>
                    <Typography sx={{ fontSize: '0.65rem', opacity: 0.7 }}>Reserved</Typography>
                  </Box>
                  <Box sx={{
                    p: 2,
                    borderRadius: '12px',
                    background: alpha(theme.palette.success.main, 0.05),
                    textAlign: 'center'
                  }}>
                    <Typography sx={{ fontSize: '1.2rem', fontWeight: 700 }}>
                      {accountTotalXrp || '0'}
                    </Typography>
                    <Typography sx={{ fontSize: '0.65rem', opacity: 0.7 }}>Total</Typography>
                  </Box>
                </Box>

                {/* Action Buttons Grid */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2 }}>
                  <Link
                    underline="none"
                    color="inherit"
                    href={`/profile/${accountLogin}`}
                    rel="noreferrer noopener nofollow"
                  >
                    <Button
                      fullWidth
                      onClick={() => setOpen(false)}
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
              </Box>
            </Box>


            {/* Accounts List - Minimal */}
            {profiles.filter((profile) => profile.account !== accountLogin).length > 0 && (
              <Box sx={{
                maxHeight: 200,
                overflowY: 'auto',
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}>
                <Typography sx={{
                  px: 2,
                  py: 1,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  opacity: 0.5,
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  Switch Account
                </Typography>
                {profiles
                  .filter((profile) => profile.account !== accountLogin)
                  .map((profile, idx) => {
                    const account = profile.account;
                    return (
                      <Box
                        key={'account' + idx}
                        onClick={() => {
                          setActiveProfile(account);
                          setOpen(false);
                        }}
                        sx={{
                          px: 2,
                          py: 1.5,
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
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: accountsActivation[account] === false
                              ? theme.palette.error.main
                              : theme.palette.success.main
                          }} />
                          <Typography sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.8rem'
                          }}>
                            {truncateAccount(account, 8)}
                          </Typography>
                        </Stack>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeProfile(account);
                          }}
                          sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}
                        >
                          <CloseIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Box>
                    );
                  })}
              </Box>
            )}


            {/* Bottom Actions - Ultra Minimal */}
            <Box sx={{
              p: 2,
              display: 'flex',
              gap: 1
            }}>
              <Button
                fullWidth
                onClick={handleMoreAccounts}
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

              <Button
                onClick={handleLogout}
                sx={{
                  px: 3,
                  py: 1.5,
                  borderRadius: '10px',
                  background: alpha(theme.palette.error.main, 0.1),
                  color: theme.palette.error.main,
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  textTransform: 'none',
                  '&:hover': {
                    background: alpha(theme.palette.error.main, 0.15)
                  }
                }}
              >
                <LogoutIcon sx={{ fontSize: 18 }} />
              </Button>
            </Box>
          </StyledPopoverPaper>
        </Popover>
      )}
    </div>
  );
}
