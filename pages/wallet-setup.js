import { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
  Stack,
  CircularProgress,
  alpha,
  useTheme
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { AppContext } from 'src/AppContext';
import { EncryptedWalletStorage } from 'src/utils/encryptedWalletStorage';
import { Wallet as XRPLWallet } from 'xrpl';

// Generate random wallet for OAuth
const generateRandomWallet = () => {
  const entropy = crypto.getRandomValues(new Uint8Array(32));
  return XRPLWallet.fromEntropy(Array.from(entropy));
};

const WalletSetupPage = () => {
  const router = useRouter();
  const theme = useTheme();
  const { doLogIn, setProfiles, profiles, openSnackbar } = useContext(AppContext);

  const [importMethod, setImportMethod] = useState('new'); // 'new', 'seed', or 'import'
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [importSeeds, setImportSeeds] = useState(['']);
  const [importFile, setImportFile] = useState(null);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [walletStorage] = useState(new EncryptedWalletStorage());

  // OAuth data from session
  const [oauthData, setOauthData] = useState(null);

  useEffect(() => {
    console.log('🔧 [SETUP PAGE] Mounted');

    // Get OAuth data from sessionStorage
    const token = sessionStorage.getItem('oauth_temp_token');
    const provider = sessionStorage.getItem('oauth_temp_provider');
    const userStr = sessionStorage.getItem('oauth_temp_user');
    const action = sessionStorage.getItem('oauth_action');

    console.log('🔧 [SETUP PAGE] OAuth session data:');
    console.log('  - token:', token ? 'EXISTS' : 'MISSING');
    console.log('  - provider:', provider);
    console.log('  - action:', action);

    if (!token || !provider || !userStr) {
      console.log('🔧 [SETUP PAGE] Missing OAuth data, redirecting to home');
      openSnackbar('No OAuth session found. Please sign in again.', 'error');
      router.push('/');
      return;
    }

    const user = JSON.parse(userStr);
    setOauthData({ token, provider, user, action });
  }, []);

  const handleCreateWallet = async () => {
    console.log('🔧 [SETUP PAGE] handleCreateWallet called');

    // Validate password
    if (importMethod === 'new') {
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    } else if (!password) {
      setError('Please enter your wallet password');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      if (!oauthData) {
        throw new Error('Missing OAuth data');
      }

      const { token, provider, user, action } = oauthData;

      // Create 25 wallets
      setError('Creating wallets...');
      const wallets = [];
      const batchSize = 5;

      for (let batch = 0; batch < 5; batch++) {
        const batchWallets = [];

        for (let i = 0; i < batchSize; i++) {
          const index = batch * batchSize + i;
          const wallet = generateRandomWallet();

          const walletData = {
            provider,
            provider_id: user.id,
            accountIndex: index,
            account: wallet.address,
            address: wallet.address,
            publicKey: wallet.publicKey,
            seed: wallet.seed,
            wallet_type: 'oauth',
            xrp: '0',
            createdAt: Date.now()
          };

          batchWallets.push(walletData);
          wallets.push(walletData);
        }

        // Store batch
        await Promise.all(
          batchWallets.map(walletData =>
            walletStorage.storeWallet(walletData, password)
          )
        );

        setError(`Creating wallets... ${(batch + 1) * 5}/25`);
      }

      setError(''); // Clear progress

      console.log('🔧 [SETUP PAGE] Wallets created successfully');

      // Clear OAuth session data
      console.log('🔧 [SETUP PAGE] Clearing OAuth session data');
      sessionStorage.removeItem('oauth_temp_token');
      sessionStorage.removeItem('oauth_temp_provider');
      sessionStorage.removeItem('oauth_temp_user');
      sessionStorage.removeItem('oauth_action');

      // Store permanent auth data
      await walletStorage.setSecureItem('jwt', token);
      await walletStorage.setSecureItem('authMethod', provider);
      await walletStorage.setSecureItem('user', user);

      // Store password for provider
      const walletId = `${provider}_${user.id}`;
      await walletStorage.setSecureItem(`wallet_pwd_${walletId}`, password);
      console.log('🔧 [SETUP PAGE] Password saved for provider:', walletId);

      // Mark wallet as needing backup
      if (action === 'create') {
        localStorage.setItem(`wallet_needs_backup_${wallets[0].address}`, 'true');
      }

      // Add all wallets to profiles
      const allProfiles = [...profiles];
      wallets.forEach(w => {
        if (!allProfiles.find(p => p.account === w.address)) {
          allProfiles.push({ ...w, tokenCreatedAt: Date.now() });
        }
      });

      setProfiles(allProfiles);

      // Login with first wallet
      doLogIn(wallets[0], allProfiles);

      console.log('🔧 [SETUP PAGE] Login complete, redirecting to home');
      openSnackbar(`25 accounts created successfully!`, 'success');

      // Redirect to home
      setTimeout(() => {
        router.push('/');
      }, 1000);

    } catch (err) {
      console.error('🔧 [SETUP PAGE] Error:', err);
      setError(err.message || 'Failed to create wallet');
    } finally {
      setIsCreating(false);
    }
  };

  if (!oauthData) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 500, mb: 1 }}>
            Setup Your Wallet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Signed in with {oauthData.provider}. Create a password to secure your wallet.
          </Typography>

          {/* Import/New Wallet Toggle */}
          <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
            <Button
              variant={importMethod === 'new' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setImportMethod('new')}
              sx={{ flex: 1, textTransform: 'none' }}
            >
              New
            </Button>
            <Button
              variant={importMethod === 'seed' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setImportMethod('seed')}
              sx={{ flex: 1, textTransform: 'none' }}
            >
              Seed
            </Button>
            <Button
              variant={importMethod === 'import' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setImportMethod('import')}
              sx={{ flex: 1, textTransform: 'none' }}
            >
              File
            </Button>
          </Stack>

          {/* Password Fields */}
          <Stack spacing={2} sx={{ mb: 3 }}>
            <TextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={importMethod === 'new' ? 'Create password' : 'Enter password'}
              label={importMethod === 'new' ? 'Password' : 'Wallet Password'}
              helperText={importMethod === 'new' ? 'Minimum 8 characters' : ''}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            {importMethod === 'new' && (
              <TextField
                fullWidth
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                label="Confirm Password"
              />
            )}

            {importMethod === 'seed' && (
              <TextField
                fullWidth
                multiline
                rows={3}
                value={importSeeds[0]}
                onChange={(e) => setImportSeeds([e.target.value])}
                placeholder="Enter seed phrase"
                label="Seed Phrase"
              />
            )}

            {importMethod === 'import' && (
              <Button
                variant="outlined"
                component="label"
                fullWidth
              >
                {importFile ? importFile.name : 'Choose Backup File'}
                <input
                  type="file"
                  hidden
                  accept=".json"
                  onChange={(e) => setImportFile(e.target.files[0])}
                />
              </Button>
            )}
          </Stack>

          {error && (
            <Alert severity={error.startsWith('Creating') ? 'info' : 'error'} sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Action Buttons */}
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => router.push('/')}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              fullWidth
              onClick={handleCreateWallet}
              disabled={isCreating || !password ||
                (importMethod === 'new' && !confirmPassword) ||
                (importMethod === 'seed' && !importSeeds[0]) ||
                (importMethod === 'import' && !importFile)}
            >
              {isCreating ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  {error.startsWith('Creating') ? error.replace('Creating wallets...', '') : 'Creating...'}
                </>
              ) : (
                importMethod === 'new' ? 'Create Wallet' : 'Import Wallet'
              )}
            </Button>
          </Stack>

          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="caption">
              <strong>Important:</strong> You don't create a wallet for each provider - you'll have 25 wallets to access with this {oauthData.provider} account and password combination.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Container>
  );
};

export default WalletSetupPage;
