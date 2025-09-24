import { useState, useContext, useEffect } from 'react';
import { Box, Container, Typography, Button, Card, CardContent, Alert, CircularProgress } from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

// Base64url encoding helper
const base64urlEncode = (buffer) => {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};
import { Wallet, Client } from 'xrpl';
import CryptoJS from 'crypto-js';
import { AppContext } from 'src/AppContext';
import { useRouter } from 'next/router';

const DeviceLoginPage = () => {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [walletInfo, setWalletInfo] = useState(null);
  const { doLogIn } = useContext(AppContext);
  const router = useRouter();


  const generateWallet = (passkeyId, accountIndex = 0) => {
    // Create entropy array from passkey ID hash with account index
    const baseHash = CryptoJS.SHA256(passkeyId).toString();
    const indexedHash = CryptoJS.SHA256(baseHash + accountIndex.toString()).toString();
    const entropy = [];
    for (let i = 0; i < 32; i++) {
      entropy.push(parseInt(indexedHash.substr(i * 2, 2), 16));
    }
    const wallet = Wallet.fromEntropy(entropy);
    return wallet;
  };

  const checkAccountBalance = async (address) => {
    try {
      const client = new Client('wss://xrplcluster.com');
      await client.connect();
      const response = await client.request({
        command: 'account_info',
        account: address,
        ledger_index: 'validated'
      });
      await client.disconnect();
      return parseFloat(response.result.account_data.Balance) / 1000000; // Convert drops to XRP
    } catch (err) {
      return 0; // Account doesn't exist or has 0 balance
    }
  };

  const checkAccountActivity = async (address) => {
    try {
      const client = new Client('wss://xrplcluster.com');
      await client.connect();

      // Check if account exists (has been created/activated)
      const accountInfo = await client.request({
        command: 'account_info',
        account: address,
        ledger_index: 'validated'
      });

      await client.disconnect();
      return accountInfo.result.account_data !== undefined; // Account exists
    } catch (err) {
      return false; // Account doesn't exist
    }
  };

  const discoverAllAccounts = async (passkeyId) => {
    const accounts = [];

    // Zero-knowledge approach: Check accounts 0-9 for any activity
    // Include accounts that have either:
    // 1. Current balance > 0
    // 2. Transaction history (account exists on ledger)
    for (let i = 0; i < 10; i++) {
      const wallet = generateWallet(passkeyId, i);
      const balance = await checkAccountBalance(wallet.address);
      const hasActivity = await checkAccountActivity(wallet.address);

      // Include account if it has balance OR transaction history OR is first 3 accounts
      if (balance > 0 || hasActivity || i < 3) {
        accounts.push({
          account: wallet.address,
          address: wallet.address,
          publicKey: wallet.publicKey,
          wallet_type: 'device',
          xrp: balance.toString()
        });
      }
    }

    // Always include at least the first account
    if (accounts.length === 0) {
      const wallet = generateWallet(passkeyId, 0);
      accounts.push({
        account: wallet.address,
        address: wallet.address,
        publicKey: wallet.publicKey,
        wallet_type: 'device',
        xrp: '0'
      });
    }

    return accounts;
  };

  const handleRegister = async () => {
    try {
      setStatus('registering');
      setError('');

      console.log('Starting passkey registration...');

      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        throw new Error('WebAuthn not supported in this browser');
      }

      // Generate random values and encode as base64url
      const userIdBuffer = crypto.getRandomValues(new Uint8Array(32));
      const challengeBuffer = crypto.getRandomValues(new Uint8Array(32));
      const userId = base64urlEncode(userIdBuffer);
      const challenge = base64urlEncode(challengeBuffer);

      console.log('Calling startRegistration directly...');

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
        // Handle cancellation directly here
        console.log('User cancelled registration:', innerErr);
        setError('Cancelled. Please try again and allow the security prompt.');
        setStatus('idle');
        return;
      }

      console.log('Registration response:', registrationResponse);

      if (registrationResponse.id) {
        const wallet = generateWallet(registrationResponse.id);

        // Store passkey ID for this session only (will be cleared on logout)

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

        // Notify parent window
        if (window.opener) {
          window.opener.postMessage({ type: 'DEVICE_LOGIN_SUCCESS', profile }, '*');
        }

        setTimeout(() => {
          window.close();
        }, 10000);
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

      console.log('Starting WebAuthn authentication...');

      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        throw new Error('WebAuthn not supported in this browser');
      }

      const challengeBuffer = crypto.getRandomValues(new Uint8Array(32));
      const challenge = base64urlEncode(challengeBuffer);

      console.log('Trying authentication only...');

      let authResponse;
      try {
        authResponse = await startAuthentication({
          challenge: challenge,
          timeout: 60000,
          userVerification: 'required'
        });
      } catch (innerErr) {
        // Handle cancellation directly here
        console.log('User cancelled authentication:', innerErr);
        setError('Cancelled. Please try again and allow the security prompt.');
        setStatus('idle');
        return;
      }

      console.log('Authentication successful:', authResponse);

      if (authResponse.id) {
        setStatus('discovering');

        // Discover all accounts with balances
        const allAccounts = await discoverAllAccounts(authResponse.id);

        if (allAccounts.length === 0) {
          // No accounts with balance found, create first one
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

        // Login with the first account
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

  // Since we're zero-localStorage, always treat as potential first-time setup
  const hasRegisteredPasskey = false;

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Card sx={{ textAlign: 'center' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            Device Login
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Use your device's biometric authentication to securely access your XRPL wallet
          </Typography>

          <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <WarningIcon sx={{ fontSize: 20, mt: 0.25 }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                  Important: One Passkey = One Set of Wallets
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', opacity: 0.9 }}>
                  Each passkey creates different XRPL accounts. Use the same passkey across devices to access the same wallets.
                </Typography>
              </Box>
            </Box>
          </Alert>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
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
                Save this information! Window closes in 10 seconds.
              </Typography>
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleAuthenticate}
              disabled={status !== 'idle'}
              startIcon={status === 'authenticating' || status === 'discovering' ? <CircularProgress size={20} /> : null}
            >
              {status === 'authenticating' ? 'Authenticating...' : status === 'discovering' ? 'Discovering accounts...' : 'Sign In with Existing Passkey'}
            </Button>

            <Button
              variant="outlined"
              size="large"
              onClick={handleRegister}
              disabled={status !== 'idle'}
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
  );
};

export default DeviceLoginPage;