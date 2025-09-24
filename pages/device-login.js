import { useState, useContext, useEffect } from 'react';
import { Box, Container, Typography, Button, Card, CardContent, Alert, CircularProgress } from '@mui/material';
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

  const discoverAllAccounts = async (passkeyId) => {
    const accounts = [];

    // Check if we have a stored account count for this passkey
    const storedCount = localStorage.getItem(`passkey-count-${passkeyId}`);
    const minAccounts = storedCount ? parseInt(storedCount) : 5; // Default to 5 wallets

    // Always check at least the minimum number of accounts, plus a few extra for funded discovery
    const maxCheck = Math.max(minAccounts, 10);

    for (let i = 0; i < maxCheck; i++) {
      const wallet = generateWallet(passkeyId, i);
      const balance = await checkAccountBalance(wallet.address);

      // Include account if:
      // 1. It's within the minimum count (always show these)
      // 2. It has a balance > 0 (funded accounts)
      if (i < minAccounts || balance > 0) {
        accounts.push({
          account: wallet.address,
          address: wallet.address,
          publicKey: wallet.publicKey,
          wallet_type: 'device',
          xrp: balance.toString()
        });
      }
    }

    return accounts;
  };

  const handleRegister = async () => {
    try {
      setStatus('registering');
      setError('');

      // Generate random values and encode as base64url
      const userIdBuffer = crypto.getRandomValues(new Uint8Array(32));
      const challengeBuffer = crypto.getRandomValues(new Uint8Array(32));
      const userId = base64urlEncode(userIdBuffer);
      const challenge = base64urlEncode(challengeBuffer);

      const registrationResponse = await startRegistration({
        rp: {
          name: 'XRPL.to',
          id: window.location.hostname,
        },
        user: {
          id: userId,
          name: `user-${Date.now()}@xrpl.to`,
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

      if (registrationResponse.id) {
        const wallet = generateWallet(registrationResponse.id);

        localStorage.setItem('passkey-id', registrationResponse.id);
        localStorage.setItem('wallet-address', wallet.address);

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
      setError('Registration failed: ' + err.message);
      setStatus('idle');
    }
  };

  const handleAuthenticate = async () => {
    try {
      setStatus('authenticating');
      setError('');

      const passkeyId = localStorage.getItem('passkey-id');
      if (!passkeyId) {
        throw new Error('No passkey registered. Please register first.');
      }

      const challengeBuffer = crypto.getRandomValues(new Uint8Array(32));
      const challenge = base64urlEncode(challengeBuffer);

      const authResponse = await startAuthentication({
        challenge: challenge,
        timeout: 60000,
        userVerification: 'required',
        allowCredentials: [{
          id: passkeyId,
          type: 'public-key',
        }],
      });

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
      setError('Authentication failed: ' + err.message);
      setStatus('idle');
    }
  };

  const hasRegisteredPasskey = localStorage.getItem('passkey-id');

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Card sx={{ textAlign: 'center' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            Device Login
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Use your device's biometric authentication to securely access your XRPL wallet
          </Typography>

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
            {!hasRegisteredPasskey ? (
              <Button
                variant="contained"
                size="large"
                onClick={handleRegister}
                disabled={status !== 'idle'}
                startIcon={status === 'registering' ? <CircularProgress size={20} /> : null}
              >
                {status === 'registering' ? 'Setting up...' : 'Setup Device Login'}
              </Button>
            ) : (
              <Button
                variant="contained"
                size="large"
                onClick={handleAuthenticate}
                disabled={status !== 'idle'}
                startIcon={status === 'authenticating' || status === 'discovering' ? <CircularProgress size={20} /> : null}
              >
                {status === 'authenticating' ? 'Authenticating...' : status === 'discovering' ? 'Discovering accounts...' : 'Sign In'}
              </Button>
            )}

            {!hasRegisteredPasskey && (
              <Button
                variant="text"
                size="small"
                onClick={handleRegister}
                disabled={status !== 'idle'}
                sx={{ mt: 1 }}
              >
                Register This Device
              </Button>
            )}
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