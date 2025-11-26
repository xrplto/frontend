import { useState, useContext, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { cn } from 'src/utils/cn';
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
  const { themeName, doLogIn, setProfiles, profiles, openSnackbar } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  const [importMethod, setImportMethod] = useState('new'); // 'new', 'seed', or 'import'
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [importSeeds, setImportSeeds] = useState(['']);
  const [importFile, setImportFile] = useState(null);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const walletStorage = useMemo(() => new EncryptedWalletStorage(), []);

  // OAuth data from session
  const [oauthData, setOauthData] = useState(null);

  useEffect(() => {
    // Get OAuth data from sessionStorage
    const token = sessionStorage.getItem('oauth_temp_token');
    const provider = sessionStorage.getItem('oauth_temp_provider');
    const userStr = sessionStorage.getItem('oauth_temp_user');
    const action = sessionStorage.getItem('oauth_action');

    if (!token || !provider || !userStr) {
      openSnackbar('No OAuth session found. Please sign in again.', 'error');
      router.push('/');
      return;
    }

    const user = JSON.parse(userStr);
    setOauthData({ token, provider, user, action });
  }, []);

  const handleCreateWallet = async () => {
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

      // Create 1 wallet
      setError('Creating wallet...');
      const wallet = generateRandomWallet();

      const walletData = {
        provider,
        provider_id: user.id,
        accountIndex: 0,
        account: wallet.address,
        address: wallet.address,
        publicKey: wallet.publicKey,
        seed: wallet.seed,
        wallet_type: 'oauth',
        xrp: '0',
        createdAt: Date.now()
      };

      await walletStorage.storeWallet(walletData, password);
      const wallets = [walletData];

      setError(''); // Clear progress

      // Clear OAuth session data
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

      openSnackbar(`Wallet created successfully!`, 'success');

      // Redirect to home
      setTimeout(() => {
        router.push('/');
      }, 1000);

    } catch (err) {
      setError(err.message || 'Failed to create wallet');
    } finally {
      setIsCreating(false);
    }
  };

  if (!oauthData) {
    return (
      <div className="flex min-h-screen items-center justify-center py-16">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 animate-spin" size={40} />
          <p className={cn("text-sm", isDark ? "text-white/60" : "text-gray-600")}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className={cn(
        "w-full max-w-md rounded-xl border-[1.5px] p-8",
        isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-white"
      )}>
        <h1 className={cn(
          "mb-2 text-xl font-normal",
          isDark ? "text-white" : "text-gray-900"
        )}>
          Setup Your Wallet
        </h1>
        <p className={cn(
          "mb-6 text-[13px]",
          isDark ? "text-white/60" : "text-gray-600"
        )}>
          Signed in with {oauthData.provider}. Create a password to secure your wallet.
        </p>

        {/* Import/New Wallet Toggle */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setImportMethod('new')}
            className={cn(
              "flex-1 rounded-lg border-[1.5px] px-3 py-2 text-[13px] font-normal transition-colors",
              importMethod === 'new'
                ? "border-primary bg-primary text-white"
                : isDark
                ? "border-white/15 text-white hover:border-primary/50"
                : "border-gray-300 text-gray-900 hover:bg-gray-100"
            )}
          >
            New
          </button>
          <button
            onClick={() => setImportMethod('seed')}
            className={cn(
              "flex-1 rounded-lg border-[1.5px] px-3 py-2 text-[13px] font-normal transition-colors",
              importMethod === 'seed'
                ? "border-primary bg-primary text-white"
                : isDark
                ? "border-white/15 text-white hover:border-primary/50"
                : "border-gray-300 text-gray-900 hover:bg-gray-100"
            )}
          >
            Seed
          </button>
          <button
            onClick={() => setImportMethod('import')}
            className={cn(
              "flex-1 rounded-lg border-[1.5px] px-3 py-2 text-[13px] font-normal transition-colors",
              importMethod === 'import'
                ? "border-primary bg-primary text-white"
                : isDark
                ? "border-white/15 text-white hover:border-primary/50"
                : "border-gray-300 text-gray-900 hover:bg-gray-100"
            )}
          >
            File
          </button>
        </div>

        {/* Password Fields */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="relative">
            <label className={cn(
              "mb-2 block text-[11px] font-medium uppercase tracking-wide",
              isDark ? "text-white/60" : "text-gray-600"
            )}>
              {importMethod === 'new' ? 'Password' : 'Wallet Password'}
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={importMethod === 'new' ? 'Create password' : 'Enter password'}
              className={cn(
                "w-full rounded-lg border-[1.5px] px-4 py-2 text-[13px] font-normal outline-none transition-colors",
                isDark
                  ? "border-white/15 bg-transparent text-white placeholder:text-white/40 focus:border-primary"
                  : "border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-primary"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={cn(
                "absolute right-3 top-[38px] text-gray-400 hover:text-gray-600",
                isDark && "hover:text-white/80"
              )}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            {importMethod === 'new' && (
              <p className={cn("mt-1 text-[11px]", isDark ? "text-white/40" : "text-gray-500")}>
                Minimum 8 characters
              </p>
            )}
          </div>

          {importMethod === 'new' && (
            <div>
              <label className={cn(
                "mb-2 block text-[11px] font-medium uppercase tracking-wide",
                isDark ? "text-white/60" : "text-gray-600"
              )}>
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className={cn(
                  "w-full rounded-lg border-[1.5px] px-4 py-2 text-[13px] font-normal outline-none transition-colors",
                  isDark
                    ? "border-white/15 bg-transparent text-white placeholder:text-white/40 focus:border-primary"
                    : "border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-primary"
                )}
              />
            </div>
          )}

          {importMethod === 'seed' && (
            <div>
              <label className={cn(
                "mb-2 block text-[11px] font-medium uppercase tracking-wide",
                isDark ? "text-white/60" : "text-gray-600"
              )}>
                Seed Phrase
              </label>
              <textarea
                rows={3}
                value={importSeeds[0]}
                onChange={(e) => setImportSeeds([e.target.value])}
                placeholder="Enter seed phrase"
                className={cn(
                  "w-full rounded-lg border-[1.5px] px-4 py-2 text-[13px] font-normal outline-none transition-colors",
                  isDark
                    ? "border-white/15 bg-transparent text-white placeholder:text-white/40 focus:border-primary"
                    : "border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-primary"
                )}
              />
            </div>
          )}

          {importMethod === 'import' && (
            <label className={cn(
              "flex w-full cursor-pointer items-center justify-center rounded-lg border-[1.5px] px-4 py-2 text-[13px] font-normal transition-colors",
              isDark
                ? "border-white/15 text-white hover:border-primary/50"
                : "border-gray-300 text-gray-900 hover:bg-gray-100"
            )}>
              {importFile ? importFile.name : 'Choose Backup File'}
              <input
                type="file"
                hidden
                accept=".json"
                onChange={(e) => setImportFile(e.target.files[0])}
              />
            </label>
          )}
        </div>

        {error && (
          <div className={cn(
            "mb-4 rounded-lg border-[1.5px] p-3 text-[13px]",
            error.startsWith('Creating')
              ? isDark
                ? "border-blue-500/20 bg-blue-500/10 text-blue-400"
                : "border-blue-500/20 bg-blue-50 text-blue-700"
              : isDark
              ? "border-red-500/20 bg-red-500/10 text-red-400"
              : "border-red-500/20 bg-red-50 text-red-700"
          )}>
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/')}
            disabled={isCreating}
            className={cn(
              "flex-1 rounded-lg border-[1.5px] px-4 py-2 text-[13px] font-normal transition-colors",
              isCreating
                ? "cursor-not-allowed opacity-50"
                : isDark
                ? "border-white/15 text-white hover:border-primary/50"
                : "border-gray-300 text-gray-900 hover:bg-gray-100"
            )}
          >
            Cancel
          </button>
          <button
            onClick={handleCreateWallet}
            disabled={isCreating || !password ||
              (importMethod === 'new' && !confirmPassword) ||
              (importMethod === 'seed' && !importSeeds[0]) ||
              (importMethod === 'import' && !importFile)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg border-[1.5px] px-4 py-2 text-[13px] font-normal transition-colors",
              isCreating || !password ||
              (importMethod === 'new' && !confirmPassword) ||
              (importMethod === 'seed' && !importSeeds[0]) ||
              (importMethod === 'import' && !importFile)
                ? "cursor-not-allowed border-gray-400 bg-gray-400 text-white opacity-50"
                : "border-primary bg-primary text-white hover:bg-primary/90"
            )}
          >
            {isCreating ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                {error.startsWith('Creating') ? error.replace('Creating wallets...', '') : 'Creating...'}
              </>
            ) : (
              importMethod === 'new' ? 'Create Wallet' : 'Import Wallet'
            )}
          </button>
        </div>

        <div className={cn(
          "mt-6 rounded-lg border-[1.5px] p-3 text-[11px]",
          isDark
            ? "border-blue-500/20 bg-blue-500/10 text-blue-400"
            : "border-blue-500/20 bg-blue-50 text-blue-700"
        )}>
          <strong>Important:</strong> You don't create a wallet for each provider - you'll have 25 wallets to access with this {oauthData.provider} account and password combination.
        </div>
      </div>
    </div>
  );
};

export default WalletSetupPage;
