import { useState, useContext, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Eye, EyeOff, Loader2, Plus, X } from 'lucide-react';
import { cn } from 'src/utils/cn';
import { AppContext } from 'src/AppContext';
import { EncryptedWalletStorage, securityUtils } from 'src/utils/encryptedWalletStorage';
import { Wallet as XRPLWallet } from 'xrpl';

// Generate random wallet for OAuth
const generateRandomWallet = () => {
  const entropy = crypto.getRandomValues(new Uint8Array(32));
  return XRPLWallet.fromEntropy(Array.from(entropy));
};

// Validate XRPL seed format
const BASE58_ALPHABET = 'rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz';
const validateSeed = (seed) => {
  const trimmed = seed.trim();
  if (!trimmed) return { valid: false, error: '' };
  if (!trimmed.startsWith('s')) return { valid: false, error: 'Seed must start with "s"' };
  if (trimmed.length < 20 || trimmed.length > 35) return { valid: false, error: 'Invalid seed length' };
  const invalidChar = [...trimmed].find(c => !BASE58_ALPHABET.includes(c));
  if (invalidChar) return { valid: false, error: `Invalid character "${invalidChar}"` };
  return { valid: true, error: '' };
};

// Detect algorithm from seed prefix: "sEd" = ed25519, otherwise secp256k1
const getAlgorithmFromSeed = (seed) => seed.startsWith('sEd') ? 'ed25519' : 'secp256k1';

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
  const [importFileData, setImportFileData] = useState(null);
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
      const strengthCheck = securityUtils.validatePasswordStrength(password);
      if (!strengthCheck.valid) {
        setError(strengthCheck.error);
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

    // Rate limiting check
    const rateLimitKey = `wallet_setup_${oauthData?.user?.id || 'unknown'}`;
    const rateCheck = securityUtils.rateLimiter.check(rateLimitKey);
    if (!rateCheck.allowed) {
      setError(rateCheck.error);
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      if (!oauthData) {
        throw new Error('Missing OAuth data');
      }

      const { token, provider, user, action } = oauthData;
      const walletId = `${provider}_${user.id}`;
      let wallets = [];

      // Handle file import - MUST decrypt with original password first
      if (importMethod === 'import' && importFileData) {
        setError('Decrypting backup...');

        // Try to decrypt each wallet with provided password
        const decryptedWallets = [];
        for (const encWallet of importFileData.wallets) {
          try {
            const decrypted = await walletStorage.decryptData(encWallet.data, password);
            decryptedWallets.push(decrypted);
          } catch (decryptErr) {
            securityUtils.rateLimiter.recordFailure(rateLimitKey);
            throw new Error('Incorrect password - cannot decrypt backup');
          }
        }

        if (decryptedWallets.length === 0) {
          throw new Error('No wallets found in backup');
        }

        // Re-store decrypted wallets with SAME password (security: no password change)
        setError('Restoring wallets...');
        for (const wallet of decryptedWallets) {
          const walletData = {
            ...wallet,
            provider,
            provider_id: user.id,
            walletKeyId: walletId,
            wallet_type: 'oauth',
            restoredAt: Date.now()
          };
          await walletStorage.storeWallet(walletData, password);
          wallets.push(walletData);
        }

        openSnackbar(`${wallets.length} wallet(s) restored!`, 'success');
      }
      // Handle seed import (multiple seeds)
      else if (importMethod === 'seed' && importSeeds.some(s => s.trim())) {
        const validSeeds = importSeeds.filter(s => s.trim());
        setError(`Importing ${validSeeds.length} wallet(s)...`);

        for (let i = 0; i < validSeeds.length; i++) {
          try {
            const seedTrimmed = validSeeds[i].trim();
            const algorithm = getAlgorithmFromSeed(seedTrimmed);
            const wallet = XRPLWallet.fromSeed(seedTrimmed, { algorithm });
            const walletData = {
              provider,
              provider_id: user.id,
              walletKeyId: walletId,
              accountIndex: i,
              account: wallet.address,
              address: wallet.address,
              publicKey: wallet.publicKey,
              seed: wallet.seed,
              wallet_type: 'oauth',
              xrp: '0',
              importedAt: Date.now()
            };
            await walletStorage.storeWallet(walletData, password);
            wallets.push(walletData);
          } catch (seedErr) {
            throw new Error(`Invalid seed #${i + 1}: ${seedErr.message}`);
          }
        }
        openSnackbar(`${wallets.length} wallet(s) imported!`, 'success');
      }
      // Create new wallet
      else {
        setError('Creating wallet...');
        const wallet = generateRandomWallet();
        const walletData = {
          provider,
          provider_id: user.id,
          walletKeyId: walletId,
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
        wallets = [walletData];
      }

      setError('');

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
      await walletStorage.setSecureItem(`wallet_pwd_${walletId}`, password);

      // Mark wallet as needing backup (only for new wallets)
      if (importMethod === 'new' && action === 'create') {
        localStorage.setItem(`wallet_needs_backup_${wallets[0].address}`, 'true');
      }

      // Add all wallets to profiles
      const allProfiles = [...profiles];
      wallets.forEach(w => {
        if (!allProfiles.find(p => p.account === (w.address || w.account))) {
          allProfiles.push({ ...w, account: w.address || w.account, tokenCreatedAt: Date.now() });
        }
      });

      setProfiles(allProfiles);

      // Login with first wallet
      doLogIn(wallets[0], allProfiles);

      if (importMethod === 'new') {
        openSnackbar('Wallet created successfully!', 'success');
      }

      // Redirect to home
      setTimeout(() => {
        window.location.href = '/';
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
                8+ chars, mix letters/numbers/symbols
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
              <div className="mb-2 flex items-center justify-between">
                <label className={cn(
                  "text-[11px] font-medium uppercase tracking-wide",
                  isDark ? "text-white/60" : "text-gray-600"
                )}>
                  Seed{importSeeds.length > 1 ? 's' : ''} ({importSeeds.length})
                </label>
                {importSeeds.length < 10 && (
                  <button
                    type="button"
                    onClick={() => setImportSeeds([...importSeeds, ''])}
                    className={cn(
                      "flex items-center gap-1 rounded px-2 py-0.5 text-[11px] transition-colors",
                      isDark ? "text-primary hover:bg-primary/10" : "text-primary hover:bg-primary/10"
                    )}
                  >
                    <Plus size={12} /> Add
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {importSeeds.map((seed, idx) => {
                  const validation = validateSeed(seed);
                  const hasInput = seed.trim().length > 0;
                  return (
                    <div key={idx}>
                      <div className="relative">
                        <input
                          type="text"
                          value={seed}
                          onChange={(e) => {
                            const newSeeds = [...importSeeds];
                            newSeeds[idx] = e.target.value;
                            setImportSeeds(newSeeds);
                          }}
                          placeholder={`Seed ${idx + 1} (starts with "s")`}
                          className={cn(
                            "w-full rounded-lg border-[1.5px] px-4 py-2 pr-8 text-[13px] font-mono outline-none transition-colors",
                            hasInput && !validation.valid
                              ? "border-red-500/50 focus:border-red-500"
                              : hasInput && validation.valid
                              ? "border-green-500/50 focus:border-green-500"
                              : isDark
                              ? "border-white/15 bg-transparent text-white placeholder:text-white/40 focus:border-primary"
                              : "border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-primary",
                            isDark ? "bg-transparent text-white" : "bg-white text-gray-900"
                          )}
                        />
                        {importSeeds.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setImportSeeds(importSeeds.filter((_, i) => i !== idx))}
                            className={cn(
                              "absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 transition-colors",
                              isDark ? "text-white/40 hover:text-red-400" : "text-gray-400 hover:text-red-500"
                            )}
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      {hasInput && validation.error && (
                        <p className="mt-1 text-[11px] text-red-500">{validation.error}</p>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className={cn("mt-1.5 text-[11px]", isDark ? "text-white/40" : "text-gray-500")}>
                Add multiple seeds to import several wallets at once
              </p>
            </div>
          )}

          {importMethod === 'import' && (
            <div>
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
                  onChange={(e) => {
                    const file = e.target.files[0];
                    setImportFile(file);
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        try {
                          const data = JSON.parse(ev.target.result);
                          if (data.type !== 'xrpl-wallet-backup') {
                            setError('Invalid backup file format');
                            setImportFileData(null);
                          } else {
                            setImportFileData(data);
                            setError('');
                          }
                        } catch {
                          setError('Could not read backup file');
                          setImportFileData(null);
                        }
                      };
                      reader.readAsText(file);
                    }
                  }}
                />
              </label>
              {importFileData && (
                <p className={cn("mt-2 text-[11px]", isDark ? "text-white/50" : "text-gray-500")}>
                  {importFileData.wallets?.length || 0} wallet(s) • Exported {new Date(importFileData.exported).toLocaleDateString()}
                </p>
              )}
              <p className={cn("mt-1 text-[11px]", isDark ? "text-amber-400/80" : "text-amber-600")}>
                Enter the original password used when creating this backup
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className={cn(
            "mb-4 rounded-lg border-[1.5px] p-3 text-[13px]",
            (error.startsWith('Creating') || error.startsWith('Decrypting') || error.startsWith('Restoring') || error.startsWith('Importing'))
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
            onClick={() => {
              sessionStorage.removeItem('oauth_temp_token');
              sessionStorage.removeItem('oauth_temp_provider');
              sessionStorage.removeItem('oauth_temp_user');
              sessionStorage.removeItem('oauth_action');
              window.location.href = '/';
            }}
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
              (importMethod === 'seed' && (!importSeeds.some(s => s.trim()) || !importSeeds.filter(s => s.trim()).every(s => validateSeed(s).valid))) ||
              (importMethod === 'import' && !importFileData)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg border-[1.5px] px-4 py-2 text-[13px] font-normal transition-colors",
              isCreating || !password ||
              (importMethod === 'new' && !confirmPassword) ||
              (importMethod === 'seed' && (!importSeeds.some(s => s.trim()) || !importSeeds.filter(s => s.trim()).every(s => validateSeed(s).valid))) ||
              (importMethod === 'import' && !importFileData)
                ? "cursor-not-allowed border-gray-400 bg-gray-400 text-white opacity-50"
                : "border-primary bg-primary text-white hover:bg-primary/90"
            )}
          >
            {isCreating ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                {importMethod === 'import' ? 'Restoring...' : importMethod === 'seed' ? 'Importing...' : 'Creating...'}
              </>
            ) : (
              importMethod === 'new' ? 'Create Wallet' :
              importMethod === 'import' ? 'Restore Wallet' :
              `Import ${importSeeds.filter(s => validateSeed(s).valid).length || 1} Wallet${importSeeds.filter(s => validateSeed(s).valid).length > 1 ? 's' : ''}`
            )}
          </button>
        </div>

        <div className={cn(
          "mt-6 rounded-lg border-[1.5px] p-3 text-[11px]",
          isDark
            ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
            : "border-amber-500/20 bg-amber-50 text-amber-700"
        )}>
          <strong>Important:</strong> Back up your wallet after creation. XRPL.to cannot recover lost wallets or passwords.
        </div>
      </div>
    </div>
  );
};

export default WalletSetupPage;
