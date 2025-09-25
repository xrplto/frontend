import { useContext, useState, useEffect } from 'react';

import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import styled from '@emotion/styled';
import ClearIcon from '@mui/icons-material/Clear';
import { AccountBalanceWallet as AccountBalanceWalletIcon, Security as SecurityIcon, Warning as WarningIcon, OpenInNew as OpenInNewIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';


import { AppContext } from 'src/AppContext';

// Lazy load heavy dependencies
let startRegistration, startAuthentication, Wallet, CryptoJS;

// Base64url encoding helper
const base64urlEncode = (buffer) => {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

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
  const [showDeviceLogin, setShowDeviceLogin] = useState(false);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [walletInfo, setWalletInfo] = useState(null);
  const [isLoadingDeps, setIsLoadingDeps] = useState(false);

  const {
    openWalletModal,
    setOpenWalletModal,
    doLogIn
  } = useContext(AppContext);

  // Lazy load heavy dependencies
  const loadDependencies = async () => {
    if (!startRegistration || !startAuthentication || !Wallet || !CryptoJS) {
      setIsLoadingDeps(true);
      const [webauthnModule, xrplModule, cryptoModule] = await Promise.all([
        import('@simplewebauthn/browser'),
        import('xrpl'),
        import('crypto-js')
      ]);

      startRegistration = webauthnModule.startRegistration;
      startAuthentication = webauthnModule.startAuthentication;
      Wallet = xrplModule.Wallet;
      CryptoJS = cryptoModule.default;
      setIsLoadingDeps(false);
    }
  };

  const generateWallet = (passkeyId, accountIndex = 0) => {
    const baseHash = CryptoJS.SHA256(passkeyId).toString();
    const indexedHash = CryptoJS.SHA256(baseHash + accountIndex.toString()).toString();
    const entropy = [];
    for (let i = 0; i < 32; i++) {
      entropy.push(parseInt(indexedHash.substr(i * 2, 2), 16));
    }
    const wallet = Wallet.fromEntropy(entropy);
    return wallet;
  };

  const discoverAllAccounts = async (passkeyId) => {
    const accounts = [];
    const batchSize = 10;
    const totalAccounts = 100;

    for (let batch = 0; batch < Math.ceil(totalAccounts / batchSize); batch++) {
      const batchStart = batch * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, totalAccounts);

      for (let i = batchStart; i < batchEnd; i++) {
        const wallet = generateWallet(passkeyId, i);
        accounts.push({
          account: wallet.address,
          address: wallet.address,
          publicKey: wallet.publicKey,
          wallet_type: 'device',
          xrp: '0'
        });
      }

      if (batch < Math.ceil(totalAccounts / batchSize) - 1) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    return accounts;
  };

  const handleClose = () => {
    setOpenWalletModal(false);
    setShowDeviceLogin(false);
    setStatus('idle');
    setError('');
    setWalletInfo(null);
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
          },
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
        const wallet = generateWallet(registrationResponse.id);

        setWalletInfo({
          address: wallet.address,
          seed: wallet.seed,
          publicKey: wallet.publicKey
        });

        const profile = {
          account: wallet.address,
          address: wallet.address,
          publicKey: wallet.publicKey,
          wallet_type: 'device',
          xrp: '0'
        };

        doLogIn(profile);
        setStatus('success');

        setTimeout(() => {
          handleClose();
        }, 5000);
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

        let allAccounts;
        try {
          allAccounts = await discoverAllAccounts(authResponse.id);
        } catch (discoveryError) {
          const wallet = generateWallet(authResponse.id, 0);
          allAccounts = [{
            account: wallet.address,
            address: wallet.address,
            publicKey: wallet.publicKey,
            wallet_type: 'device',
            xrp: '0'
          }];
        }

        if (allAccounts.length === 0) {
          const wallet = generateWallet(authResponse.id, 0);
          const firstAccount = {
            account: wallet.address,
            address: wallet.address,
            publicKey: wallet.publicKey,
            wallet_type: 'device',
            xrp: '0'
          };
          allAccounts.push(firstAccount);
        }

        doLogIn(allAccounts[0]);
        setStatus('success');
        setTimeout(() => {
          handleClose();
        }, 2000);
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

  // Preload dependencies when device login is shown
  useEffect(() => {
    if (showDeviceLogin) {
      loadDependencies();
    }
  }, [showDeviceLogin]);



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
        {!showDeviceLogin ? (
          <>
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
          </>
        ) : (
          <>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 3,
              p: 2,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.light, 0.04)} 100%)`,
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`
            }}>
              <ActionButton onClick={handleGoBack} aria-label="Go back" sx={{ mr: 2, flexShrink: 0 }}>
                <ArrowBackIcon />
              </ActionButton>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    mb: 0.5,
                    color: theme.palette.primary.main,
                    fontSize: '1.1rem'
                  }}
                >
                  Device Authentication
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.secondary,
                    lineHeight: 1.4
                  }}
                >
                  Secure wallet access using your device's biometric authentication
                </Typography>
              </Box>
              <SecurityIcon sx={{
                fontSize: 28,
                color: theme.palette.primary.main,
                opacity: 0.7,
                ml: 1
              }} />
            </Box>

            <Box sx={{
              mb: 3,
              p: 2,
              textAlign: 'left',
              background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.08)} 0%, ${alpha(theme.palette.info.light, 0.04)} 100%)`,
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
              borderRadius: 2
            }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <SecurityIcon sx={{ fontSize: 22, mt: 0.25, color: theme.palette.info.main }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: theme.palette.info.main }}>
                    Important: One Passkey = One Set of Wallets
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, lineHeight: 1.5 }}>
                    Each passkey creates different XRPL accounts. Use the same passkey across devices to access the same wallets.
                  </Typography>
                </Box>
              </Box>
            </Box>

            {error && (
              <Alert severity={error === 'setup_required' ? 'info' : 'error'} sx={{ mb: 2 }}>
                {error === 'setup_required' ? (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Windows Hello Setup Required</strong>
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1.5 }}>
                      Please enable Windows Hello, Touch ID, or Face ID to use device login:
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      1. Go to <strong>Settings → Accounts → Sign-in options</strong>
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1.5 }}>
                      2. Set up PIN, Fingerprint, or Face recognition
                    </Typography>
                    <Link
                      href="https://www.microsoft.com/en-us/windows/tips/windows-hello"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                    >
                      Learn how to set up Windows Hello
                      <OpenInNewIcon fontSize="small" />
                    </Link>
                  </Box>
                ) : (
                  error
                )}
              </Alert>
            )}

            {status === 'success' && walletInfo && (
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Wallet Created Successfully!
                </Typography>
                <Typography variant="body2" sx={{ wordBreak: 'break-all', mb: 1 }}>
                  <strong>Address:</strong> {walletInfo.address}
                </Typography>
                <Typography variant="body2" sx={{ wordBreak: 'break-all', mb: 1 }}>
                  <strong>Seed:</strong> {walletInfo.seed}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Save this information! Modal closes in 5 seconds.
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

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
              {/* Primary Action - Sign In */}
              <Box sx={{
                p: 2,
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.08)} 0%, ${alpha(theme.palette.success.light, 0.04)} 100%)`,
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`
              }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: theme.palette.success.main }}>
                  Returning User
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary', lineHeight: 1.4 }}>
                  Use your existing passkey to access your XRPL accounts
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={handleAuthenticate}
                  disabled={status !== 'idle' || isLoadingDeps}
                  startIcon={status === 'authenticating' || status === 'discovering' ? <CircularProgress size={20} color="inherit" /> : <SecurityIcon />}
                  sx={{
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                    boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.3)}`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 100%)`,
                      boxShadow: `0 6px 16px ${alpha(theme.palette.success.main, 0.4)}`
                    }
                  }}
                >
                  {status === 'authenticating' ? 'Authenticating...' : status === 'discovering' ? 'Discovering Accounts...' : 'Sign In with Existing Passkey'}
                </Button>
              </Box>

              {/* Secondary Action - Create New */}
              <Box sx={{
                p: 2,
                background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.08)} 0%, ${alpha(theme.palette.warning.light, 0.04)} 100%)`,
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.warning.main, 0.15)}`
              }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: theme.palette.warning.main }}>
                  New User
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary', lineHeight: 1.4 }}>
                  Create a new passkey to generate fresh XRPL accounts
                </Typography>
                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  onClick={handleRegister}
                  disabled={status !== 'idle' || isLoadingDeps}
                  startIcon={status === 'registering' ? <CircularProgress size={20} color="inherit" /> : <SecurityIcon />}
                  sx={{
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    borderColor: theme.palette.warning.main,
                    color: theme.palette.warning.main,
                    borderWidth: 2,
                    '&:hover': {
                      borderColor: theme.palette.warning.dark,
                      backgroundColor: alpha(theme.palette.warning.main, 0.08),
                      borderWidth: 2
                    }
                  }}
                >
                  {status === 'registering' ? 'Creating Passkey...' : 'Create New Passkey'}
                </Button>
              </Box>

              {/* Security Notice */}
              <Box sx={{
                p: 2,
                background: alpha(theme.palette.background.paper, 0.6),
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                textAlign: 'center'
              }}>
                <SecurityIcon sx={{ fontSize: 24, color: theme.palette.text.secondary, mb: 1, opacity: 0.7 }} />
                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.4 }}>
                  Your private keys are generated locally and never leave your device
                </Typography>
              </Box>
            </Box>
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
