import { useState, useContext, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Eye, EyeOff, Loader2, Plus, X, Copy, Check } from 'lucide-react';
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
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFundScreen, setShowFundScreen] = useState(false);
  const [agreedToExport, setAgreedToExport] = useState(false);
  const [createdWallet, setCreatedWallet] = useState(null);
  const [copied, setCopied] = useState(false);
  const walletStorage = useMemo(() => new EncryptedWalletStorage(), []);

  // OAuth data - start as undefined to indicate "not yet loaded"
  const [oauthData, setOauthData] = useState(undefined);

  // Load OAuth data only on client side (single useEffect to prevent flicker)
  useEffect(() => {
    // Prevent Wallet modal from appearing
    sessionStorage.removeItem('wallet_modal_open');

    const token = sessionStorage.getItem('oauth_temp_token');
    const provider = sessionStorage.getItem('oauth_temp_provider');
    const userStr = sessionStorage.getItem('oauth_temp_user');
    const action = sessionStorage.getItem('oauth_action');

    if (!token || !provider || !userStr) {
      window.location.href = '/';
      return;
    }

    try {
      setOauthData({ token, provider, user: JSON.parse(userStr), action });
    } catch {
      window.location.href = '/';
    }
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
      // Use same ID format as callback.js: id || sub || 'unknown'
      const userId = user.id || user.sub || 'unknown';
      const walletId = `${provider}_${userId}`;
      const isPasskey = provider === 'passkey';
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
          const walletData = isPasskey ? {
            ...wallet,
            deviceKeyId: token,
            wallet_type: 'device',
            restoredAt: Date.now()
          } : {
            ...wallet,
            provider,
            provider_id: userId,
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
            const walletData = isPasskey ? {
              deviceKeyId: token,
              accountIndex: i,
              account: wallet.address,
              address: wallet.address,
              publicKey: wallet.publicKey,
              seed: wallet.seed,
              wallet_type: 'device',
              xrp: '0',
              importedAt: Date.now()
            } : {
              provider,
              provider_id: userId,
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
        const walletData = isPasskey ? {
          // Passkey wallet uses deviceKeyId
          deviceKeyId: token, // token is the passkey credential ID
          accountIndex: 0,
          account: wallet.address,
          address: wallet.address,
          publicKey: wallet.publicKey,
          seed: wallet.seed,
          wallet_type: 'device',
          xrp: '0',
          createdAt: Date.now()
        } : {
          // OAuth wallet uses provider_id
          provider,
          provider_id: userId,
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

      // Store permanent auth data (skip for passkey - no JWT needed)
      if (!isPasskey) {
        await walletStorage.setSecureItem('jwt', token);
        await walletStorage.setSecureItem('authMethod', provider);
        await walletStorage.setSecureItem('user', user);
      }

      // Store password for provider (different method for passkey)
      if (isPasskey) {
        await walletStorage.storeWalletCredential(token, password);
      } else {
        await walletStorage.setSecureItem(`wallet_pwd_${walletId}`, password);
      }

      // Backup entropy to IndexedDB for recovery if localStorage is cleared
      const currentEntropy = localStorage.getItem('__wk_entropy__');
      if (currentEntropy) {
        await walletStorage.backupEntropyToIndexedDB(currentEntropy);
      }

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

      // Store wallet info and show success screen
      setCreatedWallet({ wallet: wallets[0], allProfiles });
      setShowSuccess(true);
      setIsCreating(false);

    } catch (err) {
      setError(err.message || 'Failed to create wallet');
    } finally {
      setIsCreating(false);
    }
  };

  const handleContinue = () => {
    setShowSuccess(false);
    setShowFundScreen(true);
  };

  const handleStartTrading = () => {
    if (createdWallet) {
      doLogIn(createdWallet.wallet, createdWallet.allProfiles);
      openSnackbar('Wallet ready!', 'success');
      window.location.href = '/';
    }
  };

  const copyAddress = () => {
    if (createdWallet?.wallet?.address) {
      navigator.clipboard.writeText(createdWallet.wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSignOut = () => {
    sessionStorage.removeItem('oauth_temp_token');
    sessionStorage.removeItem('oauth_temp_provider');
    sessionStorage.removeItem('oauth_temp_user');
    sessionStorage.removeItem('oauth_action');
    window.location.href = '/';
  };

  // Show loading while OAuth data is being loaded
  if (oauthData === undefined || oauthData === null) {
    return (
      <div className="flex min-h-screen items-center justify-center py-16">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 animate-spin" size={40} />
          <p className={cn("text-sm", isDark ? "text-white/60" : "text-gray-600")}>Loading...</p>
        </div>
      </div>
    );
  }

  // Success screen after wallet creation
  if (showSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="w-full max-w-md text-center">
          <h1 className="mb-8 text-[22px] font-normal text-[#22c55e]">
            Password ready
          </h1>

          <div className={cn(
            "mb-8 rounded-[10px] border p-4 text-left",
            "border-[rgba(255,152,0,0.3)] bg-transparent"
          )}>
            <div className="flex gap-3">
              <span className="text-[20px]">⚠️</span>
              <div className="text-[12px] leading-relaxed">
                <p className={isDark ? "text-white" : "text-[#212B36]"}>
                  This password is the only way to use your wallets via the xrpl.to app. If you lose your password, it cannot be recovered.
                </p>
                <p className={cn("mt-3", isDark ? "text-[rgba(255,255,255,0.6)]" : "text-[rgba(33,43,54,0.6)]")}>
                  We recommend exporting your private keys to mitigate the risk of permanently losing access to your funds.
                </p>
              </div>
            </div>
          </div>

          <label className={cn(
            "mb-8 flex cursor-pointer items-start gap-3 text-left",
            isDark ? "text-[rgba(255,255,255,0.7)]" : "text-[rgba(33,43,54,0.7)]"
          )}>
            <input
              type="checkbox"
              checked={agreedToExport}
              onChange={(e) => setAgreedToExport(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-[rgba(255,255,255,0.2)] bg-transparent"
            />
            <span className="text-[12px]">
              I will export and safely store my private keys before depositing funds
            </span>
          </label>

          <button
            onClick={handleContinue}
            disabled={!agreedToExport}
            className={cn(
              "w-full rounded-full px-6 py-3 text-[13px] font-normal transition-colors",
              agreedToExport
                ? isDark
                  ? "bg-[rgba(255,255,255,0.15)] text-white hover:bg-[rgba(255,255,255,0.2)]"
                  : "bg-[#22c55e] text-white hover:bg-[#1ea34b]"
                : isDark
                ? "cursor-not-allowed bg-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.3)]"
                : "cursor-not-allowed bg-gray-200 text-gray-400"
            )}
          >
            Continue
          </button>

          <p className="mt-6">
            <span className={cn("text-[12px]", isDark ? "text-[rgba(255,255,255,0.4)]" : "text-[rgba(33,43,54,0.4)]")}>or </span>
            <button
              onClick={handleSignOut}
              className="text-[12px] text-[#3b82f6] hover:underline"
            >
              Sign out
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Fund wallet screen
  if (showFundScreen && createdWallet) {
    const walletAddress = createdWallet.wallet.address || createdWallet.wallet.account;
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="w-full max-w-md text-center">
          <h1 className="mb-8 text-[22px] font-normal text-[#22c55e]">
            Wallet ready. Fund to activate
          </h1>

          {/* Chain selector (XRPL only) */}
          <div className={cn(
            "mb-6 flex items-center gap-3 rounded-[10px] border px-4 py-3",
            isDark ? "border-[rgba(255,255,255,0.12)] bg-transparent" : "border-[rgba(0,0,0,0.08)] bg-white"
          )}>
            <img src="/xrp.webp" alt="XRP" className="h-5 w-5" />
            <span className={cn("text-[13px]", isDark ? "text-white" : "text-[#212B36]")}>
              XRP Ledger
            </span>
          </div>

          {/* QR Code section */}
          <div className={cn(
            "mb-6 rounded-[10px] border p-6",
            isDark ? "border-[rgba(255,255,255,0.12)]" : "border-[rgba(0,0,0,0.08)]"
          )}>
            <p className={cn("mb-4 text-[12px]", isDark ? "text-[rgba(255,255,255,0.6)]" : "text-[rgba(33,43,54,0.6)]")}>
              Top up your wallet
            </p>
            <div className="mx-auto w-fit rounded-lg bg-white p-3">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${walletAddress}`}
                alt="Wallet QR Code"
                width={140}
                height={140}
              />
            </div>
          </div>

          {/* Address with copy */}
          <div className="mb-2 flex items-center justify-center gap-2">
            <span className={cn("font-mono text-[12px]", isDark ? "text-[rgba(255,255,255,0.7)]" : "text-[rgba(33,43,54,0.7)]")}>
              {walletAddress}
            </span>
            <button onClick={copyAddress} className="text-[rgba(255,255,255,0.5)] hover:text-white">
              {copied ? <Check size={14} className="text-[#22c55e]" /> : <Copy size={14} />}
            </button>
          </div>

          <p className={cn("mb-8 text-[11px]", "text-[#FF9800]")}>
            Send at least 1 XRP to activate this wallet
          </p>

          {/* Start trading button */}
          <button
            onClick={handleStartTrading}
            className="w-full rounded-full bg-[#22c55e] px-6 py-3 text-[13px] font-normal text-black transition-colors hover:bg-[#1ea34b]"
          >
            Start trading
          </button>

          <p className="mt-6">
            <span className={cn("text-[12px]", isDark ? "text-[rgba(255,255,255,0.4)]" : "text-[rgba(33,43,54,0.4)]")}>or </span>
            <button
              onClick={() => { setShowFundScreen(false); setShowSuccess(false); }}
              className="text-[12px] text-[#3b82f6] hover:underline"
            >
              Import wallet
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className={cn(
        "w-full max-w-md rounded-[10px] border p-8",
        isDark ? "border-[rgba(59,130,246,0.1)] bg-transparent" : "border-[rgba(0,0,0,0.08)] bg-white"
      )}>
        <h1 className={cn(
          "mb-2 text-[15px] font-normal",
          isDark ? "text-white" : "text-[#212B36]"
        )}>
          Setup Your Wallet
        </h1>
        <p className={cn(
          "mb-6 text-[11px]",
          isDark ? "text-[rgba(255,255,255,0.5)]" : "text-[rgba(33,43,54,0.5)]"
        )}>
          Signed in with {oauthData.provider}. Create a password to secure your wallet.
        </p>

        {/* Import/New Wallet Toggle */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setImportMethod('new')}
            className={cn(
              "flex-1 rounded-[8px] border-[1.5px] px-3 py-2 text-[11px] font-normal transition-colors",
              importMethod === 'new'
                ? "border-[rgba(59,130,246,0.4)] bg-[rgba(59,130,246,0.15)] text-[#3b82f6]"
                : isDark
                ? "border-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.5)] hover:border-[rgba(59,130,246,0.3)]"
                : "border-[rgba(0,0,0,0.12)] text-[rgba(33,43,54,0.5)] hover:bg-gray-50"
            )}
          >
            New
          </button>
          <button
            onClick={() => setImportMethod('seed')}
            className={cn(
              "flex-1 rounded-[8px] border-[1.5px] px-3 py-2 text-[11px] font-normal transition-colors",
              importMethod === 'seed'
                ? "border-[rgba(59,130,246,0.4)] bg-[rgba(59,130,246,0.15)] text-[#3b82f6]"
                : isDark
                ? "border-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.5)] hover:border-[rgba(59,130,246,0.3)]"
                : "border-[rgba(0,0,0,0.12)] text-[rgba(33,43,54,0.5)] hover:bg-gray-50"
            )}
          >
            Seed
          </button>
          <button
            onClick={() => setImportMethod('import')}
            className={cn(
              "flex-1 rounded-[8px] border-[1.5px] px-3 py-2 text-[11px] font-normal transition-colors",
              importMethod === 'import'
                ? "border-[rgba(59,130,246,0.4)] bg-[rgba(59,130,246,0.15)] text-[#3b82f6]"
                : isDark
                ? "border-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.5)] hover:border-[rgba(59,130,246,0.3)]"
                : "border-[rgba(0,0,0,0.12)] text-[rgba(33,43,54,0.5)] hover:bg-gray-50"
            )}
          >
            File
          </button>
        </div>

        {/* Password Fields */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="relative">
            <label className={cn(
              "mb-2 block text-[10px] font-medium uppercase tracking-[0.5px]",
              isDark ? "text-[rgba(255,255,255,0.4)]" : "text-[rgba(33,43,54,0.4)]"
            )}>
              {importMethod === 'new' ? 'Password' : 'Wallet Password'}
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={importMethod === 'new' ? 'Create password' : 'Enter password'}
              className={cn(
                "w-full rounded-[8px] border-[1.5px] px-4 py-2 text-[12px] font-normal outline-none transition-colors",
                isDark
                  ? "border-[rgba(255,255,255,0.12)] bg-transparent text-white placeholder:text-[rgba(255,255,255,0.3)] focus:border-[rgba(59,130,246,0.4)]"
                  : "border-[rgba(0,0,0,0.12)] bg-white text-gray-900 placeholder:text-gray-400 focus:border-[#3b82f6]"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={cn(
                "absolute right-3 top-[38px]",
                isDark ? "text-[rgba(255,255,255,0.3)] hover:text-[rgba(255,255,255,0.6)]" : "text-[rgba(33,43,54,0.3)] hover:text-[rgba(33,43,54,0.6)]"
              )}
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            {importMethod === 'new' && (
              <p className={cn("mt-1 text-[10px]", isDark ? "text-[rgba(255,255,255,0.3)]" : "text-[rgba(33,43,54,0.4)]")}>
                8+ chars, mix letters/numbers/symbols
              </p>
            )}
          </div>

          {importMethod === 'new' && (
            <div>
              <label className={cn(
                "mb-2 block text-[10px] font-medium uppercase tracking-[0.5px]",
                isDark ? "text-[rgba(255,255,255,0.4)]" : "text-[rgba(33,43,54,0.4)]"
              )}>
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className={cn(
                  "w-full rounded-[8px] border-[1.5px] px-4 py-2 text-[12px] font-normal outline-none transition-colors",
                  isDark
                    ? "border-[rgba(255,255,255,0.12)] bg-transparent text-white placeholder:text-[rgba(255,255,255,0.3)] focus:border-[rgba(59,130,246,0.4)]"
                    : "border-[rgba(0,0,0,0.12)] bg-white text-gray-900 placeholder:text-gray-400 focus:border-[#3b82f6]"
                )}
              />
            </div>
          )}

          {importMethod === 'seed' && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className={cn(
                  "text-[10px] font-medium uppercase tracking-[0.5px]",
                  isDark ? "text-[rgba(255,255,255,0.4)]" : "text-[rgba(33,43,54,0.4)]"
                )}>
                  Seed{importSeeds.length > 1 ? 's' : ''} ({importSeeds.length})
                </label>
                {importSeeds.length < 10 && (
                  <button
                    type="button"
                    onClick={() => setImportSeeds([...importSeeds, ''])}
                    className={cn(
                      "flex items-center gap-1 rounded-[8px] px-2 py-0.5 text-[10px] transition-colors",
                      "text-[#3b82f6] hover:bg-[rgba(59,130,246,0.08)]"
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
                            "w-full rounded-[8px] border-[1.5px] px-4 py-2 pr-8 text-[11px] font-mono outline-none transition-colors",
                            hasInput && !validation.valid
                              ? "border-[rgba(244,67,54,0.3)] focus:border-[#f44336]"
                              : hasInput && validation.valid
                              ? "border-[rgba(34,197,94,0.3)] focus:border-[#22c55e]"
                              : isDark
                              ? "border-[rgba(255,255,255,0.12)] bg-transparent text-white placeholder:text-[rgba(255,255,255,0.3)] focus:border-[rgba(59,130,246,0.4)]"
                              : "border-[rgba(0,0,0,0.12)] bg-white text-gray-900 placeholder:text-gray-400 focus:border-[#3b82f6]",
                            isDark ? "bg-transparent text-white" : "bg-white text-gray-900"
                          )}
                        />
                        {importSeeds.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setImportSeeds(importSeeds.filter((_, i) => i !== idx))}
                            className={cn(
                              "absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 transition-colors",
                              isDark ? "text-[rgba(255,255,255,0.3)] hover:text-[#f44336]" : "text-[rgba(33,43,54,0.3)] hover:text-[#f44336]"
                            )}
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      {hasInput && validation.error && (
                        <p className="mt-1 text-[10px] text-[#f44336]">{validation.error}</p>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className={cn("mt-1.5 text-[10px]", isDark ? "text-[rgba(255,255,255,0.3)]" : "text-[rgba(33,43,54,0.4)]")}>
                Add multiple seeds to import several wallets at once
              </p>
            </div>
          )}

          {importMethod === 'import' && (
            <div>
              <label className={cn(
                "flex w-full cursor-pointer items-center justify-center rounded-[8px] border-[1.5px] px-4 py-2 text-[11px] font-normal transition-colors",
                isDark
                  ? "border-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.5)] hover:border-[rgba(59,130,246,0.3)]"
                  : "border-[rgba(0,0,0,0.12)] text-[rgba(33,43,54,0.5)] hover:bg-gray-50"
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
                <p className={cn("mt-2 text-[10px]", isDark ? "text-[rgba(255,255,255,0.4)]" : "text-[rgba(33,43,54,0.5)]")}>
                  {importFileData.wallets?.length || 0} wallet(s) • Exported {new Date(importFileData.exported).toLocaleDateString()}
                </p>
              )}
              <p className={cn("mt-1 text-[10px]", isDark ? "text-[#FF9800]" : "text-[#FF9800]")}>
                Enter the original password used when creating this backup
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className={cn(
            "mb-4 rounded-[8px] border p-3 text-[11px]",
            (error.startsWith('Creating') || error.startsWith('Decrypting') || error.startsWith('Restoring') || error.startsWith('Importing'))
              ? "border-[rgba(59,130,246,0.2)] bg-[rgba(59,130,246,0.08)] text-[#3b82f6]"
              : "border-[rgba(244,67,54,0.2)] bg-[rgba(244,67,54,0.08)] text-[#f44336]"
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
              "flex-1 rounded-[8px] border-[1.5px] px-4 py-2 text-[11px] font-normal transition-colors",
              isCreating
                ? "cursor-not-allowed opacity-50"
                : isDark
                ? "border-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.5)] hover:border-[rgba(59,130,246,0.3)]"
                : "border-[rgba(0,0,0,0.12)] text-[rgba(33,43,54,0.5)] hover:bg-gray-50"
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
              "flex flex-1 items-center justify-center gap-2 rounded-[8px] border-[1.5px] px-4 py-2 text-[11px] font-normal transition-colors",
              isCreating || !password ||
              (importMethod === 'new' && !confirmPassword) ||
              (importMethod === 'seed' && (!importSeeds.some(s => s.trim()) || !importSeeds.filter(s => s.trim()).every(s => validateSeed(s).valid))) ||
              (importMethod === 'import' && !importFileData)
                ? "cursor-not-allowed border-[rgba(0,0,0,0.12)] bg-[rgba(0,0,0,0.08)] text-[rgba(255,255,255,0.3)] opacity-50"
                : "border-[rgba(59,130,246,0.4)] bg-[rgba(59,130,246,0.15)] text-[#3b82f6] hover:bg-[rgba(59,130,246,0.25)]"
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
          "mt-6 rounded-[8px] border p-3 text-[10px]",
          "border-[rgba(255,152,0,0.2)] bg-[rgba(255,152,0,0.08)] text-[#FF9800]"
        )}>
          <strong>Important:</strong> Back up your wallet after creation. XRPL.to cannot recover lost wallets or passwords.
        </div>
      </div>
    </div>
  );
};

export default WalletSetupPage;
