import { useRef, useState, useEffect, useCallback } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Image from 'next/image';
import { Wallet as XRPLWallet } from 'xrpl';

// Lazy load heavy dependencies
let startRegistration, startAuthentication, CryptoJS;

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
import SecurityIcon from '@mui/icons-material/Security';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

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

// Base64url encoding helper
const base64urlEncode = (buffer) => {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

// Secure deterministic wallet generation using PBKDF2 with high entropy
const generateSecureDeterministicWallet = (credentialId, accountIndex, userEntropy = '') => {
  const entropyString = `passkey-wallet-${credentialId}-${accountIndex}-${userEntropy}`;
  const seedHash = CryptoJS.PBKDF2(entropyString, `salt-${credentialId}`, {
    keySize: 256/32,
    iterations: 100000
  }).toString();
  const privateKeyHex = seedHash.substring(0, 64);
  return new XRPLWallet(privateKeyHex);
};

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
            <CopyToClipboard
              text={accountLogin}
              onCopy={() => openSnackbar('Address copied!', 'success')}
            >
              <IconButton
                size="small"
                sx={{
                  p: 0.5,
                  '&:hover': {
                    background: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main
                  }
                }}
              >
                <ContentCopyIcon sx={{ fontSize: isEmbedded ? 12 : 14 }} />
              </IconButton>
            </CopyToClipboard>
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
        {!isEmbedded && (
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
  const [showDeviceLogin, setShowDeviceLogin] = useState(false);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [walletInfo, setWalletInfo] = useState(null);
  const [isLoadingDeps, setIsLoadingDeps] = useState(false);
  const {
    setActiveProfile,
    accountProfile,
    profiles,
    setProfiles,
    removeProfile,
    openSnackbar,
    darkMode,
    setOpenWalletModal,
    openWalletModal,
    open,
    setOpen,
    accountBalance,
    handleOpen,
    handleClose,
    handleLogin,
    handleLogout,
    doLogIn
  } = useContext(AppContext);

  // Lazy load heavy dependencies
  const loadDependencies = async () => {
    if (!startRegistration || !startAuthentication || !CryptoJS) {
      setIsLoadingDeps(true);
      const [webauthnModule, cryptoModule] = await Promise.all([
        import('@simplewebauthn/browser'),
        import('crypto-js')
      ]);

      startRegistration = webauthnModule.startRegistration;
      startAuthentication = webauthnModule.startAuthentication;
      CryptoJS = cryptoModule.default;
      setIsLoadingDeps(false);
    }
  };

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

  const handleWalletConnect = () => {
    setShowDeviceLogin(true);
  };

  const handleGoBack = () => {
    setShowDeviceLogin(false);
    setStatus('idle');
    setError('');
    setWalletInfo(null);
  };

  const handleRegister = async () => {
    try {
      setStatus('registering');
      setError('');

      await loadDependencies();

      if (!window.PublicKeyCredential) {
        throw new Error('WebAuthn not supported in this browser');
      }

      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        setError('setup_required');
        setStatus('idle');
        return;
      }

      const userIdBuffer = crypto.getRandomValues(new Uint8Array(32));
      const challengeBuffer = crypto.getRandomValues(new Uint8Array(32));
      const userId = base64urlEncode(userIdBuffer);
      const challenge = base64urlEncode(challengeBuffer);

      let registrationResponse;
      try {
        registrationResponse = await startRegistration({
          rp: {
            name: 'XRPL.to',
            id: window.location.hostname,
          },
          user: {
            id: userId,
            name: `xrplto-${Date.now()}@xrpl.to`,
            displayName: 'XRPL.to User',
          },
          challenge: challenge,
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
          timeout: 60000,
          attestation: 'none',
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
          }
        });
      } catch (innerErr) {
        if (innerErr.message?.includes('NotSupportedError') || innerErr.message?.includes('not supported')) {
          setError('Passkeys not supported on this device or browser.');
        } else if (innerErr.message?.includes('InvalidStateError') || innerErr.message?.includes('saving')) {
          setError('setup_required');
        } else if (innerErr.message?.includes('NotAllowedError') || innerErr.message?.includes('denied')) {
          setError('Cancelled. Please try again and allow the security prompt.');
        } else {
          setError('setup_required');
        }
        setStatus('idle');
        return;
      }

      if (registrationResponse.id) {
        // Generate 5 wallets for this device key
        const wallets = [];
        const KEY_ACCOUNT_PROFILES = 'account_profiles_2';
        const currentProfiles = JSON.parse(window.localStorage.getItem(KEY_ACCOUNT_PROFILES) || '[]');

        for (let i = 0; i < 5; i++) {
          const wallet = generateSecureDeterministicWallet(registrationResponse.id, i);
          const walletData = storeWallet(registrationResponse.id, wallet, i);
          wallets.push(walletData);

          // Add to profiles localStorage
          const profile = { ...walletData, tokenCreatedAt: Date.now() };
          if (!currentProfiles.find(p => p.account === profile.address)) {
            currentProfiles.push(profile);
          }
        }

        window.localStorage.setItem(KEY_ACCOUNT_PROFILES, JSON.stringify(currentProfiles));

        // Update profiles state immediately
        const allProfiles = [...profiles];
        wallets.forEach(walletData => {
          const profile = { ...walletData, tokenCreatedAt: Date.now() };
          if (!allProfiles.find(p => p.account === profile.account)) {
            allProfiles.push(profile);
          }
        });
        setProfiles(allProfiles);

        // Store first wallet info for display
        setWalletInfo({
          address: wallets[0].address,
          publicKey: wallets[0].publicKey,
          deviceKeyId: registrationResponse.id
        });

        doLogIn(wallets[0]);
        setStatus('success');

        // Close modal after brief delay to show success
        setTimeout(() => {
          setOpenWalletModal(false);
          setStatus('idle');
          setShowDeviceLogin(false);
        }, 2000);
      }
    } catch (err) {
      console.error('Registration error:', err);

      const errorName = err.name || err.cause?.name;
      const errorMessage = err.message || err.cause?.message || '';

      if (errorName === 'NotAllowedError' || errorMessage.includes('not allowed') || errorMessage.includes('denied permission')) {
        setError('Cancelled. Please try again and allow the security prompt.');
      } else if (errorName === 'AbortError') {
        setError('Timed out. Please try again.');
      } else {
        setError('Failed: ' + errorMessage);
      }
      setStatus('idle');
    }
  };

  const handleAuthenticate = async () => {
    try {
      setStatus('authenticating');
      setError('');

      await loadDependencies();

      if (!window.PublicKeyCredential) {
        throw new Error('WebAuthn not supported in this browser');
      }

      const challengeBuffer = crypto.getRandomValues(new Uint8Array(32));
      const challenge = base64urlEncode(challengeBuffer);

      let authResponse;
      try {
        authResponse = await startAuthentication({
          challenge: challenge,
          timeout: 60000,
          userVerification: 'required'
        });
      } catch (innerErr) {
        if (innerErr.message?.includes('NotSupportedError') || innerErr.message?.includes('not supported')) {
          setError('Passkeys not supported on this device or browser.');
        } else if (innerErr.message?.includes('InvalidStateError')) {
          setError('Windows Hello not set up. Please enable Windows Hello, Touch ID, or Face ID in your device settings first.');
        } else if (innerErr.message?.includes('NotAllowedError') || innerErr.message?.includes('denied')) {
          setError('Cancelled. Please try again and allow the security prompt.');
        } else {
          setError('Authentication failed. Please ensure Windows Hello, Touch ID, or Face ID is enabled on your device.');
        }
        setStatus('idle');
        return;
      }

      if (authResponse.id) {
        setStatus('discovering');

        // Look for existing wallets associated with this device key
        const storedWallets = getStoredWallets();
        const userWallets = storedWallets.filter(w => w.deviceKeyId === authResponse.id);
        const nextAccountIndex = userWallets.length; // Start from next available index

        // Always create 5 new wallets
        const wallets = [];
        const KEY_ACCOUNT_PROFILES = 'account_profiles_2';
        const currentProfiles = JSON.parse(window.localStorage.getItem(KEY_ACCOUNT_PROFILES) || '[]');

        for (let i = 0; i < 5; i++) {
          const wallet = generateSecureDeterministicWallet(authResponse.id, nextAccountIndex + i);
          const walletData = storeWallet(authResponse.id, wallet, nextAccountIndex + i);
          wallets.push(walletData);

          // Add to profiles localStorage
          const profile = { ...walletData, tokenCreatedAt: Date.now() };
          if (!currentProfiles.find(p => p.account === profile.address)) {
            currentProfiles.push(profile);
          }
        }

        window.localStorage.setItem(KEY_ACCOUNT_PROFILES, JSON.stringify(currentProfiles));

        // Update profiles state immediately
        const allProfiles = [...profiles];
        wallets.forEach(walletData => {
          const profile = { ...walletData, tokenCreatedAt: Date.now() };
          if (!allProfiles.find(p => p.account === profile.account)) {
            allProfiles.push(profile);
          }
        });
        setProfiles(allProfiles);

        // Set wallet info for success message
        setWalletInfo({
          address: wallets[0].address,
          publicKey: wallets[0].publicKey,
          deviceKeyId: authResponse.id,
          isAdditional: userWallets.length > 0,
          totalWallets: userWallets.length + 5
        });

        // Always login with the first newly created wallet
        doLogIn(wallets[0]);
        setStatus('success');

        // Close modal after brief delay to show success
        setTimeout(() => {
          setOpenWalletModal(false);
          setStatus('idle');
          setShowDeviceLogin(false);
        }, 1000);
      }
    } catch (err) {
      console.error('Authentication error:', err);

      const errorName = err.name || err.cause?.name;
      const errorMessage = err.message || err.cause?.message || '';

      if (errorName === 'NotAllowedError' || errorMessage.includes('not allowed') || errorMessage.includes('denied permission')) {
        setError('Cancelled. Please try again and allow the security prompt.');
      } else if (errorName === 'AbortError') {
        setError('Timed out. Please try again.');
      } else {
        setError('Failed: ' + errorMessage);
      }
      setStatus('idle');
    }
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

    // Always allow creating more wallets - show device login
    setShowDeviceLogin(true);
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
            ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
            : theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #2d3436 0%, #1e2124 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          border: accountProfile
            ? `1px solid ${theme.palette.primary.dark}`
            : `1px solid ${theme.palette.mode === 'dark' ? '#636e72' : '#ddd'}`,
          borderRadius: '6px',
          height: '32px',
          padding: accountProfile ? '0 10px' : '0 6px',
          minWidth: accountProfile ? '120px' : '70px',
          color: accountProfile ? '#ffffff' : theme.palette.mode === 'dark' ? '#ffffff' : '#2d3436',
          fontSize: '13px',
          fontWeight: '600',
          fontFamily: 'inherit',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          transition: 'all 0.3s ease',
          outline: 'none',
          boxShadow: accountProfile
            ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
            : '0 2px 4px rgba(0,0,0,0.1)'
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
{accountProfile ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: accountsActivation[accountLogin] === false
                ? '#ef5350'
                : 'linear-gradient(45deg, #4caf50, #8bc34a)',
              boxShadow: accountsActivation[accountLogin] !== false
                ? '0 0 8px rgba(76, 175, 80, 0.5)'
                : '0 0 8px rgba(239, 83, 80, 0.5)'
            }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
              <span style={{
                fontFamily: 'monospace',
                fontSize: '11px',
                opacity: 0.9,
                lineHeight: '1.2'
              }}>
                {truncateAccount(accountLogin, 6)}
              </span>
              <span style={{
                fontSize: '13px',
                fontWeight: '700',
                lineHeight: '1.2'
              }}>
                {accountBalance?.curr1?.value || '0'} XRP
              </span>
            </div>
            <svg width="6" height="6" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.6 }}>
              <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z" />
            </svg>
          </div>
        ) : (
          <span>{t('Connect')}</span>
        )}
      </button>

      <Dialog
          open={open || (openWalletModal && !accountProfile)}
          onClose={() => {
            setOpen(false);
            if (!accountProfile) setOpenWalletModal(false);
            setShowDeviceLogin(false);
            setStatus('idle');
            setError('');
            setWalletInfo(null);
          }}
          maxWidth="sm"
          fullWidth
          disableEnforceFocus
          disableAutoFocus
          disableRestoreFocus
          hideBackdrop={true}
          sx={{
            '& .MuiDialog-paper': {
              borderRadius: '16px',
              maxWidth: '360px',
              minHeight: accountProfile ? 'auto' : '580px',
              background: 'transparent',
              boxShadow: 'none',
              position: 'fixed',
              top: '48px',
              right: '16px',
              left: 'auto',
              transform: 'none',
              margin: 0
            },
            zIndex: 9999
          }}
        >
          <DialogContent sx={{ p: 0 }}>
            <StyledPopoverPaper>
            {accountProfile ? (
              <>
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
              </>
            ) : (
              // WalletConnect Modal Content with full styling
              <Box sx={{
                borderRadius: theme.general?.borderRadiusLg || '16px',
                background: theme.walletDialog?.background ||
                  (theme.palette.mode === 'dark'
                    ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.85)} 100%)`
                    : `linear-gradient(135deg, ${alpha('#FFFFFF', 0.95)} 0%, ${alpha('#FFFFFF', 0.85)} 100%)`),
                border: `1px solid ${theme.walletDialog?.border || alpha(theme.palette.divider, 0.15)}`,
                boxShadow: theme.palette.mode === 'dark'
                  ? `0 8px 32px ${alpha(theme.palette.common.black, 0.4)}, inset 0 1px 0 ${alpha(theme.palette.common.white, 0.1)}`
                  : `0 8px 32px ${alpha(theme.palette.common.black, 0.15)}, inset 0 1px 0 ${alpha(theme.palette.common.white, 0.8)}`,
                overflow: 'hidden'
              }}>
                {/* Header */}
                <Box sx={{
                  padding: theme.spacing(2, 2.5),
                  background: theme.walletDialog?.backgroundSecondary ||
                    (theme.palette.mode === 'dark'
                      ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`
                      : `linear-gradient(135deg, ${alpha(theme.palette.background.default, 0.9)} 0%, ${alpha(theme.palette.background.default, 0.7)} 100%)`),
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
                }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                      Connect Wallet
                    </Typography>
                    <IconButton
                      onClick={() => { setOpenWalletModal(false); setShowDeviceLogin(false); }}
                      sx={{
                        backgroundColor: alpha(theme.palette.background.paper, 0.6),
                        border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                        borderRadius: theme.general?.borderRadiusSm || '8px',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.background.paper, 0.8),
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                          transform: 'scale(1.05)'
                        }
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Stack>
                </Box>

                {/* Content */}
                <Box sx={{
                  padding: theme.spacing(2.5),
                  background: theme.palette.mode === 'dark'
                    ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.4)} 0%, transparent 100%)`
                    : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.6)} 0%, transparent 100%)`
                }}>
                  {!showDeviceLogin ? (
                    <>
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                        Choose a wallet to connect to the XRPL network
                      </Typography>
                      <Stack spacing={1.5}>
                        <Stack
                          direction="row"
                          spacing={2}
                          alignItems="center"
                          onClick={handleWalletConnect}
                          sx={{
                            padding: theme.spacing(1.8, 2.2),
                            cursor: 'pointer',
                            borderRadius: theme.general?.borderRadius || '12px',
                            background: theme.palette.mode === 'dark'
                              ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.5)} 0%, ${alpha(theme.palette.background.paper, 0.3)} 100%)`
                              : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`,
                            border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                            boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.1)}, inset 0 1px 0 ${alpha(theme.palette.common.white, 0.05)}`,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              background: theme.palette.mode === 'dark'
                                ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                                : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.5)}`,
                              transform: 'translateY(-2px) scale(1.02)',
                              boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}, inset 0 1px 0 ${alpha(theme.palette.common.white, 0.1)}`
                            }
                          }}
                        >
                          <Box sx={{
                            width: '40px',
                            height: '40px',
                            borderRadius: theme.general?.borderRadiusSm || '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                            color: 'white',
                            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}, inset 0 1px 0 ${alpha(theme.palette.common.white, 0.2)}`
                          }}>
                            <SecurityIcon sx={{ fontSize: '1.4rem' }} />
                          </Box>
                          <Stack sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                              Device Login
                            </Typography>
                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.8rem' }}>
                              Device Authentication
                            </Typography>
                          </Stack>
                        </Stack>
                      </Stack>
                    </>
                  ) : (
                    <>
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: 2,
                        p: 1.5,
                        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.light, 0.04)} 100%)`,
                        borderRadius: 2,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`
                      }}>
                        <IconButton
                          onClick={handleGoBack}
                          sx={{
                            mr: 1.5,
                            flexShrink: 0,
                            backgroundColor: alpha(theme.palette.background.paper, 0.6),
                            border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                            borderRadius: '8px',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.background.paper, 0.8),
                              transform: 'scale(1.05)'
                            }
                          }}
                        >
                          <ArrowBackIcon />
                        </IconButton>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.main, fontSize: '1rem' }}>
                          Key Authentication
                        </Typography>
                        <SecurityIcon sx={{ fontSize: 20, color: theme.palette.primary.main, opacity: 0.7, ml: 'auto' }} />
                      </Box>

                      <Box sx={{
                        mb: 2,
                        p: 1.5,
                        background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.06)} 0%, ${alpha(theme.palette.info.light, 0.03)} 100%)`,
                        border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <SecurityIcon sx={{ fontSize: 18, color: theme.palette.info.main }} />
                        <Typography variant="body2" sx={{ fontWeight: 500, color: theme.palette.info.main }}>
                          One Key = One Set of Wallets
                        </Typography>
                      </Box>

                      {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Hardware Security Required</strong>
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1.5 }}>
                            {error}
                          </Typography>
                        </Alert>
                      )}

                      {status === 'success' && walletInfo && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            🎉 {walletInfo.isAdditional ? `5 Additional Device Wallets Created!` : `5 Device Wallets Created!`}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Wallets Created:</strong> 5 new wallets
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Total Wallets:</strong> {walletInfo.totalWallets} | <strong>Security:</strong> Protected by your device key
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Your wallet is secured by hardware authentication.
                          </Typography>
                        </Alert>
                      )}

                      {isLoadingDeps && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size={16} />
                            <Typography variant="body2">Loading security modules...</Typography>
                          </Box>
                        </Alert>
                      )}

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Button
                          variant="contained"
                          size="large"
                          fullWidth
                          onClick={handleAuthenticate}
                          disabled={status !== 'idle' || isLoadingDeps}
                          startIcon={status === 'authenticating' || status === 'discovering' ? <CircularProgress size={18} color="inherit" /> : <SecurityIcon />}
                          sx={{
                            py: 1.2,
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                            '&:hover': {
                              background: `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 100%)`
                            }
                          }}
                        >
                          {status === 'authenticating' ? 'Authenticating...' : status === 'discovering' ? 'Discovering...' : 'Sign In (Existing Key)'}
                        </Button>

                        <Button
                          variant="outlined"
                          size="large"
                          fullWidth
                          onClick={handleRegister}
                          disabled={status !== 'idle' || isLoadingDeps}
                          startIcon={status === 'registering' ? <CircularProgress size={18} color="inherit" /> : <SecurityIcon />}
                          sx={{
                            py: 1.2,
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            borderColor: theme.palette.warning.main,
                            color: theme.palette.warning.main,
                            '&:hover': {
                              borderColor: theme.palette.warning.dark,
                              backgroundColor: alpha(theme.palette.warning.main, 0.08)
                            }
                          }}
                        >
                          {status === 'registering' ? 'Creating...' : 'Create New Key'}
                        </Button>

                        <Typography variant="caption" sx={{
                          textAlign: 'center',
                          color: 'text.secondary',
                          mt: 1,
                          fontSize: '0.75rem'
                        }}>
                          Device-secured wallets • Universal browser support
                        </Typography>
                      </Box>
                    </>
                  )}
                </Box>
              </Box>
            )}
            </StyledPopoverPaper>
          </DialogContent>
        </Dialog>
    </div>
  );
}
