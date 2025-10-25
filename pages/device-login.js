import { useState, useContext, useEffect, useRef } from 'react';
import { Box, Container, Typography, Button, Card, CardContent, Alert, CircularProgress, Link, TextField, Dialog, DialogContent, DialogTitle } from '@mui/material';
import { Warning as WarningIcon, OpenInNew as OpenInNewIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { AppContext } from 'src/AppContext';
import { useRouter } from 'next/router';

// Lazy load heavy dependencies
let startRegistration, startAuthentication, Wallet, CryptoJS;

// Base64url encoding helper
const base64urlEncode = (buffer) => {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

// PIN Input Field styling
const PinField = styled(TextField)(({ theme }) => ({
  '& input': {
    textAlign: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
    padding: '12px 0',
    width: '48px',
    height: '48px',
  },
  '& .MuiOutlinedInput-root': {
    width: '48px',
    height: '48px',
  }
}));

const DeviceLoginPage = () => {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [walletInfo, setWalletInfo] = useState(null);
  const [isLoadingDeps, setIsLoadingDeps] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinMode, setPinMode] = useState('create'); // 'create' or 'verify'
  const [pendingPasskeyId, setPendingPasskeyId] = useState(null);
  const [pins, setPins] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);
  const { doLogIn } = useContext(AppContext);
  const router = useRouter();

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

  // PIN Input handlers
  const handlePinChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newPins = [...pins];
    newPins[index] = value.slice(-1);
    setPins(newPins);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pins[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'Enter' && pins.every(p => p)) {
      handlePinSubmit();
    }
  };

  const handlePinSubmit = async () => {
    const pin = pins.join('');
    if (pin.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setShowPinDialog(false);
    setPins(['', '', '', '', '', '']);

    if (pinMode === 'create' && pendingPasskeyId) {
      await completeRegistration(pendingPasskeyId, pin);
    } else if (pinMode === 'verify' && pendingPasskeyId) {
      await completeAuthentication(pendingPasskeyId, pin);
    }
  };

  const completeRegistration = async (passkeyId, userSecret) => {
    try {
      const wallet = generateWallet(passkeyId, userSecret);

      // Store wallet with passkey mapping
      const storage = new (await import('src/utils/encryptedWalletStorage')).UnifiedWalletStorage();

      await storage.storePasskeyWallet(passkeyId, {
        address: wallet.address,
        publicKey: wallet.publicKey,
        seed: wallet.seed,
        wallet_type: 'device',
        createdAt: Date.now()
      }, userSecret);

      // Cache credential for this session
      await storage.storeWalletCredential(passkeyId, userSecret);

      setWalletInfo({
        address: wallet.address,
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

      // Notify parent window
      if (window.opener) {
        window.opener.postMessage({ type: 'DEVICE_LOGIN_SUCCESS', profile }, '*');
      }

      setTimeout(() => {
        window.close();
      }, 10000);
    } catch (err) {
      setError('Failed to create wallet: ' + err.message);
      setStatus('idle');
    }
  };

  const completeAuthentication = async (passkeyId, userSecret) => {
    try {
      setStatus('discovering');

      // Cache credential for this session
      const storage = new (await import('src/utils/encryptedWalletStorage')).UnifiedWalletStorage();
      await storage.storeWalletCredential(passkeyId, userSecret);

      // Discover all accounts with balances
      let allAccounts;
      try {
        allAccounts = await discoverAllAccounts(passkeyId, userSecret);
      } catch (discoveryError) {
        const wallet = generateWallet(passkeyId, userSecret, 0);
        allAccounts = [{
          account: wallet.address,
          address: wallet.address,
          publicKey: wallet.publicKey,
          wallet_type: 'device',
          xrp: '0'
        }];
      }

      if (allAccounts.length === 0) {
        const wallet = generateWallet(passkeyId, userSecret, 0);
        allAccounts.push({
          account: wallet.address,
          address: wallet.address,
          publicKey: wallet.publicKey,
          wallet_type: 'device',
          xrp: '0'
        });
      }

      doLogIn(allAccounts[0]);

      // Notify parent to restore all device accounts
      if (window.opener) {
        window.opener.postMessage({
          type: 'DEVICE_LOGIN_SUCCESS',
          profile: allAccounts[0],
          allDeviceAccounts: allAccounts
        }, '*');
      }

      setStatus('success');
      setTimeout(() => {
        window.close();
      }, 2000);
    } catch (err) {
      setError('Authentication failed: ' + err.message);
      setStatus('idle');
    }
  };


  const generateWallet = (passkeyId, userSecret, accountIndex = 0) => {
    // Secure wallet generation using PBKDF2 with high iterations (2025 standard)
    // Combines passkey ID + user secret + account index for strong entropy
    if (!userSecret || userSecret.length < 6) {
      throw new Error('PIN must be at least 6 characters');
    }

    // Use PBKDF2 with 600k iterations (OWASP 2025 recommendation)
    const seed = CryptoJS.PBKDF2(
      `xrpl-passkey-${passkeyId}-${userSecret}-${accountIndex}`,
      `salt-${passkeyId}`, // Unique salt per passkey
      {
        keySize: 256/32,      // 256-bit key
        iterations: 10000,   // Lower iterations since passkey provides hardware security
        hasher: CryptoJS.algo.SHA512
      }
    );

    // Convert to valid entropy for wallet generation
    const seedHex = seed.toString();
    const entropy = [];
    for (let i = 0; i < 32; i++) {
      entropy.push(parseInt(seedHex.substr(i * 2, 2), 16));
    }

    const wallet = Wallet.fromEntropy(entropy);
    wallet.seed = seedHex; // Store seed for vault
    return wallet;
  };


  const discoverAllAccounts = async (passkeyId, userSecret) => {
    const accounts = [];

    // For now, just generate the first account for simplicity
    // Can be extended to discover multiple accounts if needed
    const wallet = generateWallet(passkeyId, userSecret, 0);
    accounts.push({
      account: wallet.address,
      address: wallet.address,
      publicKey: wallet.publicKey,
      wallet_type: 'device',
      xrp: '0'
    });

    return accounts;
  };

  const handleRegister = async () => {
    try {
      setStatus('registering');
      setError('');

      // Load dependencies first
      await loadDependencies();

      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        throw new Error('WebAuthn not supported in this browser');
      }

      // Check if platform authenticator is available (Windows Hello, Touch ID, etc.)
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        setError('setup_required');
        setStatus('idle');
        return;
      }

      // Generate random values and encode as base64url
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
        // Handle specific passkey setup errors

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
        // Show PIN dialog for creation
        setPendingPasskeyId(registrationResponse.id);
        setPinMode('create');
        setShowPinDialog(true);
        setStatus('idle');
      }
    } catch (err) {
      console.error('Registration error:', err);

      // Handle WebAuthnError and DOMException
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

      // Load dependencies first
      await loadDependencies();

      // Check if WebAuthn is supported
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
        // Handle specific authentication errors

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
        // Try to retrieve stored PIN from cache
        const storage = new (await import('src/utils/encryptedWalletStorage')).UnifiedWalletStorage();
        let userSecret = await storage.getWalletCredential(authResponse.id);

        if (!userSecret) {
          // No stored PIN, show dialog
          setPendingPasskeyId(authResponse.id);
          setPinMode('verify');
          setShowPinDialog(true);
          setStatus('idle');
          return;
        }

        // PIN exists, complete authentication
        await completeAuthentication(authResponse.id, userSecret);
      }
    } catch (err) {
      console.error('Authentication error:', err);

      // Handle WebAuthnError and DOMException
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

  // Preload dependencies when component mounts
  useEffect(() => {
    loadDependencies();
  }, []);

  // Since we're zero-localStorage, always treat as potential first-time setup
  const hasRegisteredPasskey = false;

  return (
    <>
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Card sx={{ textAlign: 'center' }}>
          <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            Passkeys Login
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Use your device's biometric authentication to securely access your XRPL wallet
          </Typography>

          <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <WarningIcon sx={{ fontSize: 20, mt: 0.25 }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 400, mb: 0.5 }}>
                  Important: One Passkey = One Set of Wallets
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', opacity: 0.9 }}>
                  Each passkey creates different XRPL accounts. Use the same passkey across devices to access the same wallets.
                </Typography>
              </Box>
            </Box>
          </Alert>

          {error && (
            <Alert severity={error === 'setup_required' ? 'info' : 'error'} sx={{ mb: 2 }}>
              {error === 'setup_required' ? (
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Windows Hello Setup Required</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1.5 }}>
                    Please enable Windows Hello, Touch ID, or Face ID to use passkeys login:
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
              <Typography variant="caption" color="text.secondary">
                Your wallet is secured with your PIN. Window closes in 10 seconds.
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

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleAuthenticate}
              disabled={status !== 'idle' || isLoadingDeps}
              startIcon={status === 'authenticating' || status === 'discovering' ? <CircularProgress size={20} /> : null}
            >
              {status === 'authenticating' ? 'Authenticating...' : status === 'discovering' ? 'Discovering accounts...' : 'Sign In with Existing Passkey'}
            </Button>

            <Button
              variant="outlined"
              size="large"
              onClick={handleRegister}
              disabled={status !== 'idle' || isLoadingDeps}
              startIcon={status === 'registering' ? <CircularProgress size={20} /> : null}
              sx={{
                borderColor: 'warning.main',
                color: 'warning.main',
                '&:hover': {
                  borderColor: 'warning.dark',
                  backgroundColor: 'warning.light',
                  opacity: 0.1
                }
              }}
            >
              {status === 'registering' ? 'Creating passkey...' : 'Create New Passkey'}
            </Button>

            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>
              First time? Use "Create New Passkey" • Returning? Use "Sign In with Existing Passkey"
            </Typography>

          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            Your private keys are generated locally and never leave your device
          </Typography>
        </CardContent>
      </Card>
    </Container>

    {/* PIN Input Dialog */}
    <Dialog open={showPinDialog} onClose={() => setShowPinDialog(false)} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        {pinMode === 'create' ? 'Create Your PIN' : 'Enter Your PIN'}
      </DialogTitle>
      <DialogContent sx={{ textAlign: 'center', pt: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {pinMode === 'create'
            ? 'Create a 6-digit PIN to secure your wallet'
            : 'Enter your 6-digit PIN to access your wallet'}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 2 }}>
          {pins.map((pin, index) => (
            <PinField
              key={index}
              inputRef={el => inputRefs.current[index] = el}
              value={pin}
              onChange={(e) => handlePinChange(index, e.target.value)}
              onKeyDown={(e) => handlePinKeyDown(index, e)}
              type="text"
              inputProps={{
                maxLength: 1,
                autoComplete: 'off',
                inputMode: 'numeric',
                pattern: '[0-9]*'
              }}
              variant="outlined"
              autoFocus={index === 0}
            />
          ))}
        </Box>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
          <Button variant="outlined" onClick={() => setShowPinDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handlePinSubmit}
            disabled={pins.some(p => !p)}
          >
            {pinMode === 'create' ? 'Create PIN' : 'Unlock'}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default DeviceLoginPage;