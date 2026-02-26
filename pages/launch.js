import React, { useState, useRef, useContext, useEffect, useMemo } from 'react';
import api from 'src/utils/api';
import * as xrpl from 'xrpl';
import { ThemeContext, WalletContext, AppContext } from 'src/context/AppContext';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import { UnifiedWalletStorage, deviceFingerprint } from 'src/utils/encryptedWalletStorage';
import { cn } from 'src/utils/cn';
import {
  Twitter,
  Send,
  Globe,
  Upload,
  CheckCircle,
  Info,
  Copy,
  ExternalLink,
  Loader2,
  Wallet as WalletIcon
} from 'lucide-react';

// Reusable InputField component
const InputField = ({
  label,
  value,
  onChange,
  placeholder,
  error,
  helperText,
  counter,
  counterError,
  isDark,
  multiline,
  rows,
  type = 'text',
  min,
  max,
  className,
  inputMode
}) => (
  <div className={cn('flex-1', className)}>
    <label className="block text-[11px] opacity-60 mb-1">{label}</label>
    {multiline ? (
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows || 2}
        className={cn(
          'w-full px-2.5 py-2 rounded-lg border text-[13px] max-sm:text-base bg-transparent resize-none transition-colors',
          error
            ? 'border-red-500/40'
            : isDark
              ? 'border-white/10 hover:border-white/20'
              : 'border-gray-200 hover:border-gray-300',
          'focus:outline-none focus:border-[#3b82f6] placeholder:opacity-40'
        )}
      />
    ) : (
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        max={max}
        className={cn(
          'w-full px-2.5 py-2 rounded-lg border text-[13px] max-sm:text-base bg-transparent transition-colors',
          error
            ? 'border-red-500/40'
            : isDark
              ? 'border-white/10 hover:border-white/20'
              : 'border-gray-200 hover:border-gray-300',
          'focus:outline-none focus:border-[#3b82f6] placeholder:opacity-40'
        )}
      />
    )}
    {(helperText || counter) && (
      <div className="flex justify-between mt-0.5">
        <span className={cn('text-[10px] opacity-50', error && 'text-red-500 opacity-100')}>
          {helperText}
        </span>
        {counter && (
          <span className={cn('text-[10px]', counterError ? 'text-red-500' : 'opacity-40')}>
            {counter}
          </span>
        )}
      </div>
    )}
  </div>
);

// Reusable Button component
const Button = ({
  children,
  onClick,
  disabled,
  variant = 'outline',
  size = 'default',
  fullWidth,
  className
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      'rounded-lg font-normal transition-colors flex items-center justify-center gap-2',
      size === 'small' ? 'px-3 py-1.5 text-[12px]' : 'px-4 py-2.5 text-[13px]',
      variant === 'primary'
        ? 'bg-[#3b82f6] text-white border border-[#3b82f6] hover:bg-[#2563eb]'
        : 'bg-transparent text-[#3b82f6] border border-[#3b82f6]/20 hover:border-[#3b82f6]/40 hover:bg-[#3b82f6]/5',
      fullWidth && 'w-full',
      disabled && 'opacity-40 cursor-not-allowed',
      className
    )}
  >
    {children}
  </button>
);

// Alert component
const Alert = ({ severity = 'info', children, className }) => {
  const styles = {
    error: 'border-red-500/20 bg-red-500/5 text-red-400',
    warning: 'border-yellow-500/20 bg-yellow-500/5 text-yellow-500',
    success: 'border-green-500/20 bg-green-500/5 text-green-400',
    info: 'border-[#3b82f6]/20 bg-[#3b82f6]/5 text-[#3b82f6]'
  };
  return (
    <div
      className={cn(
        'px-3 py-2 rounded-lg border flex items-start gap-2 text-[12px]',
        styles[severity],
        className
      )}
    >
      {children}
    </div>
  );
};

// Spinner component
const Spinner = ({ size = 24 }) => <Loader2 size={size} className="animate-spin text-[#3b82f6]" />;

function CreatePage() {
  const { themeName } = useContext(ThemeContext);
  const { accountProfile, profiles } = useContext(WalletContext);
  const { openSnackbar } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    tokenName: '',
    ticker: '',
    description: '',
    twitter: '',
    telegram: '',
    website: '',
    image: null,
    ammXrpAmount: 10,
    tokenSupply: 1000000000,
    userCheckPercent: 0,
    antiSnipe: false,
    platformRetentionPercent: 3,
    bundleRecipients: []
  });
  const [fileName, setFileName] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [errors, setErrors] = useState({});
  const [dragging, setDragging] = useState(false);
  const [launchStep, setLaunchStep] = useState('');
  const [isRestoring, setIsRestoring] = useState(true); // true until session restore check completes
  const [sessionData, setSessionData] = useState(null);
  const [launchError, setLaunchError] = useState('');
  const [userWallet, setUserWallet] = useState('');
  const [fundingBalance, setFundingBalance] = useState(0);
  const [fundingProgress, setFundingProgress] = useState(0);
  const [fundingAmount, setFundingAmount] = useState({ received: 0, required: 0 });
  const [checkClaimed, setCheckClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimStep, setClaimStep] = useState(null); // 'connecting' | 'trustline' | 'cashing' | null
  const [showSummary, setShowSummary] = useState(false);
  const decryptedSeedRef = useRef(null);
  const [costBreakdown, setCostBreakdown] = useState(null);
  const [loadingCost, setLoadingCost] = useState(false);
  const [walletBalance, setWalletBalance] = useState(null);
  const [fundingSending, setFundingSending] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [fundConfirm, setFundConfirm] = useState(false);
  const [fundingStep, setFundingStep] = useState(null); // 'connecting' | 'signing' | 'submitted' | 'confirmed'
  const [fundingTxHash, setFundingTxHash] = useState(null);
  const [antiSnipeRemaining, setAntiSnipeRemaining] = useState(null); // seconds remaining
  const [bundleClaimed, setBundleClaimed] = useState({}); // { [checkId]: boolean }
  const [bundleClaiming, setBundleClaiming] = useState({}); // { [checkId]: 'connecting' | 'trustline' | 'cashing' }
  const [bundleBalances, setBundleBalances] = useState({}); // { [address]: number | null }

  // Stable key for bundle percent changes — avoids JSON.stringify in useEffect deps
  const bundlePercentKey = useMemo(
    () => formData.bundleRecipients.map(b => b.percent).join(','),
    [formData.bundleRecipients]
  );

  // Get signing wallet from cached credentials (no password prompt needed)
  const safeParseSeed = (seed) => {
    const trimmed = seed.trim();
    const algorithm = trimmed.startsWith('sEd') ? 'ed25519' : 'secp256k1';
    return xrpl.Wallet.fromSeed(trimmed, { algorithm });
  };

  const getSigningWalletForProfile = async (profile) => {
    if (!profile) return null;
    try {
      if (profile.seed) return safeParseSeed(profile.seed);
      const walletStorage = new UnifiedWalletStorage();
      const address = profile.account || profile.address;
      if (profile.wallet_type === 'oauth' || profile.wallet_type === 'social') {
        const walletId = `${profile.provider}_${profile.provider_id}`;
        const pwd = await walletStorage.getSecureItem(`wallet_pwd_${walletId}`);
        if (pwd) {
          const data = await walletStorage.findWalletBySocialId(walletId, pwd, address);
          if (data?.seed) return safeParseSeed(data.seed);
        }
      } else if (profile.wallet_type === 'device') {
        const dkId = await deviceFingerprint.getDeviceId();
        if (dkId) {
          const pwd = await walletStorage.getWalletCredential(dkId);
          if (pwd) {
            const data = await walletStorage.getWalletByAddress(address, pwd);
            if (data?.seed) return safeParseSeed(data.seed);
          }
        }
      }
      return null;
    } catch (err) {
      console.error('[getSigningWalletForProfile] Error:', err.message, err.stack);
      throw err;
    }
  };

  const getSigningWallet = async () => {
    if (!accountProfile) return null;
    if (decryptedSeedRef.current) return safeParseSeed(decryptedSeedRef.current);
    const w = await getSigningWalletForProfile(accountProfile);
    if (w) decryptedSeedRef.current = w.seed; // Cache for next time
    return w;
  };

  // Fetch balance for connected wallet or entered address
  useEffect(() => {
    const addr = accountProfile?.account || accountProfile?.address || userWallet;
    if (!addr || !addr.startsWith('r') || addr.length < 25) {
      setWalletBalance(null);
      return;
    }
    let cancelled = false;
    let activeClient = null;
    const fetchBalance = async () => {
      try {
        const client = new xrpl.Client('wss://s.altnet.rippletest.net:51233', { connectionTimeout: 10000 });
        activeClient = client;
        await client.connect();
        if (cancelled) { try { await client.disconnect(); } catch {} return; }
        const info = await client.request({
          command: 'account_info',
          account: addr,
          ledger_index: 'validated'
        });
        if (!cancelled) {
          setWalletBalance(parseInt(info.result.account_data.Balance) / 1000000);
        }
        try { await client.disconnect(); } catch {}
        activeClient = null;
      } catch {
        if (!cancelled) setWalletBalance(null);
      }
    };
    fetchBalance();
    // Poll on form page (10s) and funding page (6s) so balance updates without reload
    const pollMs = launchStep === 'funding' ? 6000 : !launchStep ? 10000 : null;
    const interval = pollMs ? setInterval(fetchBalance, pollMs) : null;
    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      if (activeClient) { try { activeClient.disconnect(); } catch {} }
    };
  }, [accountProfile, userWallet, launchStep]);

  // Fetch balances for bundle recipient addresses
  useEffect(() => {
    const addresses = formData.bundleRecipients
      .map(r => r.address)
      .filter(addr => addr && addr.startsWith('r') && addr.length >= 25);

    if (addresses.length === 0) {
      setBundleBalances({});
      return;
    }

    let cancelled = false;
    let activeClient = null;
    const fetchBalances = async () => {
      const balances = {};
      const client = new xrpl.Client('wss://s.altnet.rippletest.net:51233', { connectionTimeout: 10000 });
      activeClient = client;
      try {
        await client.connect();
        if (cancelled) { try { await client.disconnect(); } catch {} return; }
        for (const addr of addresses) {
          if (cancelled) break;
          try {
            const info = await client.request({
              command: 'account_info',
              account: addr,
              ledger_index: 'validated'
            });
            balances[addr] = parseInt(info.result.account_data.Balance) / 1000000;
          } catch {
            balances[addr] = null;
          }
        }
        try { await client.disconnect(); } catch {}
        activeClient = null;
        if (!cancelled) setBundleBalances(balances);
      } catch {
        if (!cancelled) setBundleBalances({});
      }
    };

    fetchBalances();
    return () => {
      cancelled = true;
      if (activeClient) { try { activeClient.disconnect(); } catch {} }
    };
  }, [formData.bundleRecipients]);

  // Clear stale launch session when account changes
  useEffect(() => {
    if (!accountProfile) return;
    const currentAddr = accountProfile.account || accountProfile.address;
    const saved = localStorage.getItem('tokenLaunchSession');
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (parsed.userWallet && currentAddr && parsed.userWallet !== currentAddr) {
        localStorage.removeItem('tokenLaunchSession');
        setLaunchStep('');
        setLaunchError('');
        setFundingProgress(0);
        setFundingAmount({ received: 0, required: 0 });
        setSessionData(null);
        setFundingStep(null);
        setFundingTxHash(null);
        setAntiSnipeRemaining(null);
      }
    } catch {}
  }, [accountProfile]);

  // Remove bundle recipients that match the active wallet when account changes
  useEffect(() => {
    const activeAddr = accountProfile?.account || accountProfile?.address;
    if (!activeAddr || formData.bundleRecipients.length === 0) return;
    const filtered = formData.bundleRecipients.filter((r) => r.address !== activeAddr);
    if (filtered.length !== formData.bundleRecipients.length) {
      setFormData((prev) => ({ ...prev, bundleRecipients: filtered }));
    }
  }, [accountProfile]);

  // Decrypt seed on mount if OAuth wallet
  useEffect(() => {
    const decryptSeed = async () => {
      if (!accountProfile) {
        decryptedSeedRef.current = null;
        return;
      }

      if (accountProfile.seed) {
        decryptedSeedRef.current = accountProfile.seed;
        return;
      }

      if (accountProfile.wallet_type === 'oauth' || accountProfile.wallet_type === 'social') {
        try {
          const walletStorage = new UnifiedWalletStorage();
          const walletId = `${accountProfile.provider}_${accountProfile.provider_id}`;

          const storedPassword = await walletStorage.getSecureItem(`wallet_pwd_${walletId}`);

          if (storedPassword) {
            try {
              // Pass known address for fast lookup (only decrypts 1 wallet instead of 25!)
              const wallet = await walletStorage.findWalletBySocialId(
                walletId,
                storedPassword,
                accountProfile.account || accountProfile.address
              );

              if (wallet?.seed) {
                decryptedSeedRef.current = wallet.seed;
              }
            } catch (walletError) {
              // Password exists but decryption failed - likely device fingerprint changed
              // Don't set decryptedSeed, user will need to use the manual "Decrypt" button
            }
          }
        } catch (error) {
          // Failed to decrypt seed
        }
      } else if (accountProfile.wallet_type === 'device') {
        try {
          const walletStorage = new UnifiedWalletStorage();
          const deviceKeyId = await deviceFingerprint.getDeviceId();
          if (deviceKeyId) {
            const storedPassword = await walletStorage.getWalletCredential(deviceKeyId);
            if (storedPassword) {
              const walletData = await walletStorage.getWalletByAddress(
                accountProfile.account || accountProfile.address,
                storedPassword
              );
              if (walletData?.seed) {
                decryptedSeedRef.current = walletData.seed;
              }
            }
          }
        } catch {
          // Credential cache expired or device fingerprint unavailable
        }
      }
    };

    decryptSeed();
  }, [accountProfile]);

  // Fetch cost breakdown when ammXrpAmount or antiSnipe changes
  useEffect(() => {
    let cancelled = false;
    const fetchCost = async (retries = 2) => {
      if (formData.ammXrpAmount < 10) return;
      setLoadingCost(true);
      try {
        const userCheckAmount = Math.floor(formData.tokenSupply * (formData.userCheckPercent / 100));
        const res = await api.get(
          `https://api.xrpl.to/v1/launch-token/calculate-funding?ammXrpAmount=${formData.ammXrpAmount}&antiSnipe=${formData.antiSnipe}&tokenSupply=${formData.tokenSupply}&userCheckAmount=${userCheckAmount}&platformRetentionPercent=${formData.platformRetentionPercent}&bundleCount=${formData.bundleRecipients.length}`
        );
        if (!cancelled) setCostBreakdown(res.data);
      } catch (e) {
        if (!cancelled && retries > 0) {
          await new Promise((r) => setTimeout(r, 1500));
          return fetchCost(retries - 1);
        }
        if (!cancelled) setCostBreakdown(null);
      } finally {
        if (!cancelled) setLoadingCost(false);
      }
    };
    const timeout = setTimeout(fetchCost, 300);
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [formData.ammXrpAmount, formData.antiSnipe, formData.tokenSupply, formData.userCheckPercent, formData.platformRetentionPercent, formData.bundleRecipients.length, bundlePercentKey]);

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('tokenLaunchSession');
    if (!savedSession) {
      setIsRestoring(false);
      return;
    }
    try {
      const parsed = JSON.parse(savedSession);
      setSessionData(parsed);
      setUserWallet(parsed.userWallet || '');

      // Restore form data if available
      if (parsed.formData) {
        setFormData((prev) => ({ ...prev, ...parsed.formData, bundleRecipients: parsed.formData.bundleRecipients || [] }));
        if (parsed.formData.image) {
          setFileName(parsed.formData.image.name || 'uploaded-file');
        }
      }

      // Poll status to get current state
      (async () => {
        try {
          const response = await api.get(
            `https://api.xrpl.to/v1/launch-token/status/${parsed.sessionId}`
          );
          const status = response.data;

          // Update to current step
          if (['success', 'completed'].includes(status.status)) {
            setLaunchStep('completed');
            setSessionData((prev) => ({
              ...prev,
              ...status,
              bundleCheckIds: status.bundleCheckIds?.length ? status.bundleCheckIds : prev.bundleCheckIds,
              userCheckId: status.userCheckId || prev.userCheckId || prev.data?.userCheckId,
            }));
            // Restore claim states from API (explicit set, not conditional)
            setCheckClaimed(!!status.userCheckClaimed);
            const claimedMap = {};
            if (status.bundleCheckIds?.length) {
              for (const b of status.bundleCheckIds) {
                if (b.claimed) claimedMap[b.checkId] = true;
              }
            }
            setBundleClaimed(claimedMap);
          } else if (['failed', 'funding_timeout', 'cancelled'].includes(status.status)) {
            setLaunchStep('error');
            setLaunchError(status.error || 'Launch failed');
          } else if (
            [
              'funded',
              'configuring_issuer',
              'registering_token',
              'creating_trustline',
              'sending_tokens',
              'creating_checks',
              'creating_bundle_checks',
              'creating_amm',
              'scheduling_blackhole',
              'resuming'
            ].includes(status.status)
          ) {
            setLaunchStep('processing');
            setSessionData((prev) => ({
              ...prev,
              ...status,
              bundleCheckIds: status.bundleCheckIds?.length ? status.bundleCheckIds : prev.bundleCheckIds,
              userCheckId: status.userCheckId || prev.userCheckId || prev.data?.userCheckId,
            }));
          } else {
            setLaunchStep('funding');
          }
        } catch {
          // Status fetch failed — clear stale session and show form
          localStorage.removeItem('tokenLaunchSession');
          setSessionData(null);
        } finally {
          setIsRestoring(false);
        }
      })();
    } catch (e) {
      console.error('Failed to restore session:', e);
      localStorage.removeItem('tokenLaunchSession');
      setIsRestoring(false);
    }
  }, []);

  const validateField = (field, value) => {
    const newErrors = { ...errors };

    switch (field) {
      case 'tokenName':
        if (!value) newErrors.tokenName = 'Token name is required';
        else if (value.length > 50) newErrors.tokenName = 'Maximum 50 characters';
        else delete newErrors.tokenName;
        break;
      case 'ticker':
        if (!value) newErrors.ticker = 'Ticker is required';
        else if (value.length < 3) newErrors.ticker = 'Minimum 3 characters';
        else if (value.length > 20) newErrors.ticker = 'Maximum 20 characters';
        else if (!/^[A-Z0-9]+$/i.test(value)) newErrors.ticker = 'Only letters and numbers';
        else if (value.toUpperCase() === 'XRP') newErrors.ticker = 'XRP is reserved';
        else delete newErrors.ticker;
        break;
      case 'description':
        if (value.length > 1000) newErrors.description = 'Maximum 1000 characters';
        else delete newErrors.description;
        break;
      case 'website':
        if (value && !/^https?:\/\/.+\..+/.test(value)) newErrors.website = 'Enter a valid URL';
        else delete newErrors.website;
        break;
      default:
        break;
    }

    setErrors(newErrors);
  };

  const handleInputChange = (field) => (event) => {
    let value = event.target.value;

    if (field === 'ticker') {
      value = value.toUpperCase();
    } else if (field === 'ammXrpAmount') {
      value = parseInt(value) || 1;
    } else if (field === 'tokenSupply') {
      value = parseInt(value) || 1000000000;
    } else if (field === 'userCheckPercent') {
      value = Math.min(90, Math.max(0, parseInt(value) || 0));
    } else if (field === 'platformRetentionPercent') {
      value = Math.min(10, Math.max(0, parseInt(value) || 0));
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
    validateField(field, value);
  };

  // Helper to convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = (file) => {
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 500 * 1024; // 500KB — matches API server-side limit

    if (!validTypes.includes(file.type)) {
      setErrors((prev) => ({ ...prev, file: 'Invalid file type. Use PNG, JPG, GIF, or WEBP' }));
      return;
    }

    if (file.size > maxSize) {
      setErrors((prev) => ({ ...prev, file: 'File too large (max 500KB)' }));
      return;
    }

    setFileName(file.name);
    setFormData((prev) => ({ ...prev, image: file }));
    setErrors((prev) => {
      const { file: _, ...rest } = prev;
      return rest;
    });

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setImagePreview('');
    }
  };

  const handleFileInputChange = (event) => {
    handleFileUpload(event.target.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFileUpload(e.dataTransfer.files[0]);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const isFormValid = () => {
    if (
      !formData.tokenName ||
      !formData.ticker ||
      formData.ticker.length < 3 ||
      formData.ticker.length > 20 ||
      formData.tokenSupply < 1000 ||
      formData.ammXrpAmount < 10 ||
      Object.keys(errors).length
    ) return false;

    // Must have a connected wallet
    if (!accountProfile && !userWallet) return false;

    // Check wallet has sufficient balance for launch cost
    const requiredFunding = costBreakdown?.requiredFunding || Math.ceil(9 + formData.ammXrpAmount);
    if (walletBalance !== null && (isNaN(walletBalance) || walletBalance < requiredFunding)) return false;

    // Validate bundle recipients if any
    if (formData.bundleRecipients.length > 0) {
      const totalBundlePercent = formData.bundleRecipients.reduce((s, r) => s + r.percent, 0);
      const totalAllocated = formData.userCheckPercent + totalBundlePercent + formData.platformRetentionPercent;
      if (totalAllocated > 92) return false;
      const seen = new Set();
      for (const r of formData.bundleRecipients) {
        if (!r.address || !/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(r.address)) return false;
        if (r.percent <= 0 || r.percent > 50) return false;
        if (seen.has(r.address)) return false;
        // Check if account exists on-chain (null = account not found, undefined = still loading)
        if (bundleBalances[r.address] === null || bundleBalances[r.address] === undefined) return false;
        seen.add(r.address);
      }
    }

    return true;
  };

  // Poll session status (used by both funding and processing pollers)
  const pollSessionStatus = async (sessionId) => {
    try {
      const response = await api.get(`https://api.xrpl.to/v1/launch-token/status/${sessionId}`);
      return response.data;
    } catch (error) {
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;

    // Use connected wallet address if available
    if (accountProfile) {
      setUserWallet(accountProfile.account || accountProfile.address);
    }

    // Show summary first
    setShowSummary(true);
    window.scrollTo(0, 0);
  };

  const confirmLaunch = async () => {
    setShowSummary(false);
    setLaunchStep('initializing');
    setLaunchError('');
    setFundingProgress(0);
    setCheckClaimed(false);
    setClaiming(false);
    setClaimStep(null);
    setBundleClaimed({});
    setBundleClaiming({});

    try {
      // Get user wallet address
      const walletAddress = accountProfile
        ? accountProfile.account || accountProfile.address
        : userWallet;

      // Convert image to base64 if available
      let imageData = null;
      if (formData.image) {
        try {
          imageData = await fileToBase64(formData.image);
        } catch (error) {
          // Failed to convert image
        }
      }

      // Build payload according to new API spec
      const payload = {
        // Required fields (6 total)
        currencyCode: formData.ticker, // e.g., "DOGE"
        name: formData.tokenName, // e.g., "Dogecoin" (display name)
        tokenSupply: String(formData.tokenSupply),
        ammXrpAmount: formData.ammXrpAmount,
        origin: 'xrpl.to',
        user: formData.tokenName // e.g., "Dogecoin" (creator/team name - same as display name)
      };

      // Required field - userAddress
      if (!walletAddress) {
        setLaunchError('Please connect a wallet or enter your wallet address first');
        setLaunchStep('error');
        return;
      }
      payload.userAddress = walletAddress;

      // Optional fields
      if (formData.userCheckPercent > 0) {
        payload.userCheckAmount = String(
          Math.floor(formData.tokenSupply * (formData.userCheckPercent / 100))
        );
      }
      if (formData.description) payload.description = formData.description;
      if (formData.website) payload.domain = formData.website.replace(/^https?:\/\//, '');
      if (formData.telegram) payload.telegram = formData.telegram;
      if (formData.twitter) payload.twitter = formData.twitter;
      if (formData.antiSnipe) payload.antiSnipe = true;
      payload.platformRetentionPercent = formData.platformRetentionPercent;
      if (formData.bundleRecipients.length > 0) {
        payload.bundleRecipients = formData.bundleRecipients.map((r) => ({
          address: r.address,
          percent: r.percent
        }));
      }

      // Step 1: Initialize token launch (no image - keeps payload small)
      const response = await api.post('https://api.xrpl.to/v1/launch-token', payload);

      // Extract the actual data from response
      const data = response.data.data || response.data;
      setSessionData(data);

      // Step 1b: Upload image separately if provided
      if (imageData && data.sessionId) {
        try {
          await api.post(
            `https://api.xrpl.to/v1/launch-token/${data.sessionId}/image`,
            { imageData }
          );
        } catch {
          // Image upload failure is non-fatal - launch continues without icon
        }
      }

      // Save to localStorage with form data
      localStorage.setItem(
        'tokenLaunchSession',
        JSON.stringify({
          ...data,
          step: 'funding',
          userWallet: walletAddress,
          formData: {
            tokenName: formData.tokenName,
            ticker: formData.ticker,
            description: formData.description,
            tokenSupply: formData.tokenSupply,
            ammXrpAmount: formData.ammXrpAmount,
            userCheckPercent: formData.userCheckPercent,
            twitter: formData.twitter,
            telegram: formData.telegram,
            website: formData.website,
            bundleRecipients: formData.bundleRecipients
          }
        })
      );

      // Set required funding amount from API
      if (data.requiredFunding) {
        setFundingAmount({ received: 0, required: data.requiredFunding });
      }

      setLaunchStep('funding');
      window.scrollTo(0, 0);
    } catch (error) {
      const errorMsg =
        typeof error.response?.data?.error === 'string'
          ? error.response.data.error
          : error.response?.data?.error?.message || 'Failed to initialize token launch';
      setLaunchError(errorMsg);
      setLaunchStep('error');
    }
  };

  const openInExplorer = (address, network) => {
    const baseUrl = network === 'mainnet' ? 'https://xrpl.org' : 'https://testnet.xrpl.org';
    window.open(`${baseUrl}/accounts/${address}`, '_blank');
  };

  // Reset all state when closing
  const resetLaunchState = () => {
    localStorage.removeItem('tokenLaunchSession');
    setLaunchStep('');
    setLaunchError('');
    setFundingProgress(0);
    setFundingAmount({ received: 0, required: 0 });
    setSessionData(null);
    setFundingStep(null);
    setFundingTxHash(null);
    setAntiSnipeRemaining(null);
    setCheckClaimed(false);
    setClaiming(false);
    setClaimStep(null);
    setBundleClaimed({});
    setBundleClaiming({});
  };

  // Polling effect for funding status
  useEffect(() => {
    if (launchStep !== 'funding' || !sessionData?.sessionId) return;
    let cleared = false;

    const pollInterval = setInterval(async () => {
      // Guard: if launchStep changed since this interval was created, stop polling
      if (cleared) return;

      const status = await pollSessionStatus(sessionData.sessionId);

      if (!status) {
        return;
      }

      // Check funding status
      if (status.fundingStatus) {
        const { currentBalance, requiredBalance, sufficient, partiallyFunded } =
          status.fundingStatus;

        // Update balance states
        setFundingBalance(currentBalance);
        setFundingAmount({ received: currentBalance, required: requiredBalance });

        if (partiallyFunded && !sufficient) {
          // Partial funding - show warning
          const progress = (currentBalance / requiredBalance) * 100;
          setFundingProgress(progress);
        } else if (sufficient) {
          // Fully funded - just show progress, backend handles continuation
          setFundingProgress(100);
        }
      }

      // Check if status changed to processing/success/failed/completed
      if (
        [
          'funded',
          'configuring_issuer',
          'registering_token',
          'creating_trustline',
          'sending_tokens',
          'creating_checks',
          'creating_bundle_checks',
          'creating_amm',
          'scheduling_blackhole',
          'resuming'
        ].includes(status.status)
      ) {
        // Backend is processing - transition to processing view and stop this poll
        clearInterval(pollInterval);
        cleared = true;
        setLaunchStep('processing');
        return;
      }

      if (['success', 'completed', 'failed', 'funding_timeout'].includes(status.status)) {
        clearInterval(pollInterval);
        cleared = true;
        if (status.status === 'success' || status.status === 'completed') {
          setLaunchStep('completed');
          // Don't let empty API fields overwrite existing populated data
          setSessionData((prev) => ({
            ...prev,
            ...status,
            bundleCheckIds: status.bundleCheckIds?.length ? status.bundleCheckIds : prev.bundleCheckIds,
            userCheckId: status.userCheckId || prev.userCheckId || prev.data?.userCheckId,
          }));
          setCheckClaimed(!!status.userCheckClaimed);
          const fundingClaimedMap = {};
          if (status.bundleCheckIds?.length) {
            for (const b of status.bundleCheckIds) {
              if (b.claimed) fundingClaimedMap[b.checkId] = true;
            }
          }
          setBundleClaimed(fundingClaimedMap);
        } else {
          setLaunchError(status.error || `Launch ${status.status}`);
          setLaunchStep('error');
        }
      }
    }, 3000); // Poll every 3 seconds

    return () => { cleared = true; clearInterval(pollInterval); };
  }, [launchStep, sessionData?.sessionId]);

  // Polling effect for processing status
  useEffect(() => {
    if (launchStep !== 'processing' || !sessionData?.sessionId) return;

    const pollInterval = setInterval(async () => {
      const status = await pollSessionStatus(sessionData.sessionId);
      if (!status) return;

      // Update status and session data — preserve existing fields the API may not have yet
      setSessionData((prev) => ({
        ...prev,
        ...status,
        bundleCheckIds: status.bundleCheckIds?.length ? status.bundleCheckIds : prev.bundleCheckIds,
        userCheckId: status.userCheckId || prev.userCheckId || prev.data?.userCheckId,
      }));

      // Check completion
      if (status.status === 'success' || status.status === 'completed') {
        clearInterval(pollInterval);
        setLaunchStep('completed');
        setSessionData((prev) => ({
          ...prev,
          ...status,
          bundleCheckIds: status.bundleCheckIds?.length ? status.bundleCheckIds : prev.bundleCheckIds,
          userCheckId: status.userCheckId || prev.userCheckId || prev.data?.userCheckId,
        }));
        setCheckClaimed(!!status.userCheckClaimed);
        const processingClaimedMap = {};
        if (status.bundleCheckIds?.length) {
          for (const b of status.bundleCheckIds) {
            if (b.claimed) processingClaimedMap[b.checkId] = true;
          }
        }
        setBundleClaimed(processingClaimedMap);
      } else if (status.status === 'failed') {
        clearInterval(pollInterval);
        setLaunchError(status.error || 'Launch failed');
        setLaunchStep('error');
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [launchStep, sessionData?.sessionId]);

  // Anti-snipe countdown: sync from poll, tick locally every second
  useEffect(() => {
    const aw = sessionData?.authWindow;
    if (!aw || !aw.open || !aw.remainingSec) {
      setAntiSnipeRemaining(null);
      return;
    }
    setAntiSnipeRemaining(aw.remainingSec);
    const tick = setInterval(() => {
      setAntiSnipeRemaining((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(tick);
  }, [sessionData?.authWindow?.remainingSec]);

  // On completed, verify on-chain which checks still exist (unclaimed).
  // entryNotFound is ambiguous (could be "not yet propagated" OR "already cashed"),
  // so we only use positive lookups: if check exists on-chain → definitely unclaimed.
  // We poll periodically so claimed checks eventually get detected.
  useEffect(() => {
    if (launchStep !== 'completed' || !sessionData) return;
    const userCheck = sessionData.data?.userCheckId || sessionData.userCheckId;
    const bundleChecks = sessionData.bundleCheckIds || [];
    const allCheckIds = [
      ...(userCheck ? [{ id: userCheck, type: 'user' }] : []),
      ...bundleChecks.map((b) => ({ id: b.checkId, type: 'bundle', checkId: b.checkId }))
    ];
    if (allCheckIds.length === 0) return;

    let cancelled = false;
    // Track which checks we've confirmed exist on-chain at least once
    const confirmedOnChain = new Set();

    const checkOnChain = async () => {
      if (cancelled) return;
      const wsUrl = sessionData?.network === 'mainnet'
        ? 'wss://xrplcluster.com'
        : 'wss://s.altnet.rippletest.net:51233';
      const client = new xrpl.Client(wsUrl, { connectionTimeout: 10000 });
      try {
        await client.connect();
        for (const entry of allCheckIds) {
          if (cancelled) break;
          try {
            await client.request({ command: 'ledger_entry', check: entry.id, ledger_index: 'validated' });
            // Check exists on-chain — confirmed unclaimed
            confirmedOnChain.add(entry.id);
          } catch (err) {
            const errCode = err?.data?.error || err?.message || '';
            // Only mark claimed if we previously confirmed this check existed on-chain
            // (so entryNotFound means it was cashed, not that it hasn't propagated yet)
            if (!cancelled && errCode === 'entryNotFound' && confirmedOnChain.has(entry.id)) {
              if (entry.type === 'user') {
                setCheckClaimed(true);
              } else {
                setBundleClaimed((prev) => ({ ...prev, [entry.checkId]: true }));
              }
            }
          }
        }
      } catch {
        // Connection failed — leave states as-is
      } finally {
        try { await client.disconnect(); } catch {}
      }
    };

    // Initial check after 10s, then poll every 30s to detect claimed checks
    let intervalRef = null;
    const timeout = setTimeout(() => {
      if (cancelled) return;
      checkOnChain();
      intervalRef = setInterval(checkOnChain, 30000);
    }, 10000);
    return () => { cancelled = true; clearTimeout(timeout); if (intervalRef) clearInterval(intervalRef); };
  }, [launchStep, sessionData?.sessionId, sessionData?.userCheckId, sessionData?.data?.userCheckId]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <h1 className="sr-only">Launch Token on XRPL</h1>

      {/* Restoring session */}
      {isRestoring && (
        <div className="max-w-[640px] mx-auto px-5 py-20 w-full flex-1 flex flex-col items-center gap-3">
          <Spinner size={28} />
          <p className="text-[13px] opacity-50">Restoring session...</p>
        </div>
      )}

      {/* Main Form */}
      {!isRestoring && !launchStep && !showSummary && (
        <div className="max-w-[1060px] mx-auto px-5 py-6 w-full flex-1 flex gap-6">
         {/* Left: Form */}
         <div className="max-w-[640px] w-full flex-1">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-normal mb-0.5">Launch Token</h2>
              <p className="text-[12px] opacity-50">Deploy your token on the XRP Ledger</p>
            </div>
            <div className="flex items-center gap-2">
              {['Basic', 'Social', 'Media'].map((step, i) => (
                <span
                  key={step}
                  className={cn(
                    'text-[11px] px-2 py-0.5 rounded',
                    i === 0 ||
                      (i === 1 && (formData.twitter || formData.telegram || formData.website)) ||
                      (i === 2 && formData.image)
                      ? 'text-[#3b82f6] bg-[#3b82f6]/10'
                      : 'opacity-30'
                  )}
                >
                  {step}
                </span>
              ))}
            </div>
          </div>

          {/* Connected wallet debug */}
          <div className={cn(
            'mb-3 px-3 py-2 rounded-lg flex items-center gap-2 text-[11px] font-mono',
            accountProfile
              ? isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-700'
              : isDark ? 'bg-white/5 text-white/40' : 'bg-gray-50 text-gray-400'
          )}>
            <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', accountProfile ? 'bg-green-500' : 'bg-gray-400')} />
            {accountProfile
              ? `${accountProfile.account || accountProfile.address}`
              : 'No wallet connected'}
            {profiles?.length > 1 && (
              <span className="opacity-50 ml-auto text-[10px]">{profiles.length} wallets</span>
            )}
          </div>

          {/* Token Information */}
          <div
            className={cn(
              'rounded-xl border p-4 mb-4 transition-colors',
              isDark
                ? 'border-[rgba(59,130,246,0.1)] hover:border-[rgba(59,130,246,0.2)]'
                : 'border-[rgba(59,130,246,0.15)] hover:border-[rgba(59,130,246,0.25)]'
            )}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-[13px] font-normal">Token Information</h3>
              <span className="text-[10px] opacity-40">Required</span>
            </div>

            <div className="space-y-3">
              <div className="flex gap-3">
                <InputField
                  label="Token name"
                  placeholder="My Token"
                  value={formData.tokenName}
                  onChange={handleInputChange('tokenName')}
                  error={errors.tokenName || !formData.tokenName}
                  helperText={errors.tokenName || (!formData.tokenName ? 'Required' : null)}
                  counter={`${formData.tokenName.length}/50`}
                  counterError={formData.tokenName.length > 50}
                  isDark={isDark}
                />
                <InputField
                  label="Ticker"
                  placeholder="TKN"
                  value={formData.ticker}
                  onChange={handleInputChange('ticker')}
                  error={errors.ticker || !formData.ticker || formData.ticker.length < 3}
                  helperText={errors.ticker || (!formData.ticker ? 'Required' : formData.ticker.length < 3 ? 'Min 3 characters' : null)}
                  counter={`${formData.ticker.length}/20`}
                  counterError={formData.ticker.length < 3 || formData.ticker.length > 20}
                  isDark={isDark}
                  className="max-w-[140px]"
                />
              </div>

              <InputField
                label="Description"
                placeholder="What makes your token special..."
                value={formData.description}
                onChange={handleInputChange('description')}
                error={errors.description}
                counter={`${formData.description.length}/1000`}
                counterError={formData.description.length > 1000}
                isDark={isDark}
                multiline
                rows={2}
              />

              <div className="flex gap-3">
                <InputField
                  label="Total supply"
                  type="number"
                  inputMode="numeric"
                  value={formData.tokenSupply}
                  onChange={handleInputChange('tokenSupply')}
                  error={formData.tokenSupply < 1000}
                  helperText={formData.tokenSupply < 1000 ? 'Minimum 1,000' : null}
                  isDark={isDark}
                  min={1000}
                />
                <InputField
                  label="Your allocation %"
                  type="number"
                  inputMode="numeric"
                  placeholder="0-90"
                  value={formData.userCheckPercent === 0 ? '' : formData.userCheckPercent}
                  onChange={handleInputChange('userCheckPercent')}
                  helperText={
                    formData.userCheckPercent > 0
                      ? `${Math.floor(formData.tokenSupply * (formData.userCheckPercent / 100)).toLocaleString()} tokens`
                      : null
                  }
                  isDark={isDark}
                  className="max-w-[140px]"
                  min={0}
                  max={90}
                />
              </div>

              {formData.userCheckPercent === 0 && (
                <div
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-[11px]',
                    isDark ? 'bg-yellow-500/10 text-yellow-400' : 'bg-yellow-50 text-yellow-700'
                  )}
                >
                  <Info size={14} className="flex-shrink-0" />
                  <span>
                    You'll receive <strong>0 tokens</strong>. Set allocation above to reserve some
                    for yourself.
                  </span>
                </div>
              )}

              {/* Anti-snipe toggle */}
              <div
                onClick={() => setFormData((prev) => ({ ...prev, antiSnipe: !prev.antiSnipe }))}
                className={cn(
                  'flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors border',
                  formData.antiSnipe
                    ? isDark
                      ? 'border-[#3b82f6]/40 bg-[#3b82f6]/10'
                      : 'border-[#3b82f6]/30 bg-[#3b82f6]/5'
                    : isDark
                      ? 'border-white/10 hover:border-white/20'
                      : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[12px]">Anti-snipe protection</span>
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded',
                      isDark ? 'bg-white/10' : 'bg-gray-100'
                    )}
                  >
                    2 min window
                  </span>
                </div>
                <div
                  className={cn(
                    'w-8 h-4 rounded-full transition-colors relative',
                    formData.antiSnipe ? 'bg-[#3b82f6]' : isDark ? 'bg-white/20' : 'bg-gray-300'
                  )}
                >
                  <div
                    className={cn(
                      'absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform',
                      formData.antiSnipe ? 'translate-x-4' : 'translate-x-0.5'
                    )}
                  />
                </div>
              </div>

              {/* Platform token retention */}
              <div
                className={cn(
                  'flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors',
                  formData.platformRetentionPercent > 0
                    ? isDark
                      ? 'border-[#3b82f6]/40 bg-[#3b82f6]/10'
                      : 'border-[#3b82f6]/30 bg-[#3b82f6]/5'
                    : isDark
                      ? 'border-white/10 hover:border-white/20'
                      : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div
                  className="flex items-center gap-2 cursor-pointer flex-1"
                  onClick={() => setFormData((prev) => ({
                    ...prev,
                    platformRetentionPercent: prev.platformRetentionPercent > 0 ? 0 : 3
                  }))}
                >
                  <span className="text-[12px]">Platform token share</span>
                </div>
                <div className="flex items-center gap-2">
                  {formData.platformRetentionPercent > 0 && (
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={10}
                      value={formData.platformRetentionPercent}
                      onChange={handleInputChange('platformRetentionPercent')}
                      className={cn(
                        'w-12 text-center text-[12px] max-sm:text-base font-medium py-0.5 rounded border outline-none',
                        isDark
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-white border-gray-200 text-gray-900'
                      )}
                    />
                  )}
                  {formData.platformRetentionPercent > 0 && (
                    <span className={cn('text-[11px]', isDark ? 'text-white/40' : 'text-gray-400')}>%</span>
                  )}
                  <div
                    className={cn(
                      'w-8 h-4 rounded-full transition-colors relative cursor-pointer',
                      formData.platformRetentionPercent > 0 ? 'bg-[#3b82f6]' : isDark ? 'bg-white/20' : 'bg-gray-300'
                    )}
                    onClick={() => setFormData((prev) => ({
                      ...prev,
                      platformRetentionPercent: prev.platformRetentionPercent > 0 ? 0 : 3
                    }))}
                  >
                    <div
                      className={cn(
                        'absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform',
                        formData.platformRetentionPercent > 0 ? 'translate-x-4' : 'translate-x-0.5'
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Bundle Distribution */}
              <div
                className={cn(
                  'rounded-lg border overflow-hidden transition-colors',
                  formData.bundleRecipients.length > 0
                    ? isDark
                      ? 'border-[#3b82f6]/40 bg-[#3b82f6]/10'
                      : 'border-[#3b82f6]/30 bg-[#3b82f6]/5'
                    : isDark
                      ? 'border-white/10 hover:border-white/20'
                      : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div
                  className="flex items-center justify-between px-3 py-2.5 cursor-pointer"
                  onClick={() => {
                    if (formData.bundleRecipients.length === 0) {
                      setFormData((prev) => ({
                        ...prev,
                        bundleRecipients: [{ address: '', percent: 5 }]
                      }));
                    } else {
                      setFormData((prev) => ({ ...prev, bundleRecipients: [] }));
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[12px]">Bundle distribution</span>
                    <span
                      className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded',
                        isDark ? 'bg-white/10' : 'bg-gray-100'
                      )}
                    >
                      1 XRP/recipient
                    </span>
                  </div>
                  <div
                    className={cn(
                      'w-8 h-4 rounded-full transition-colors relative',
                      formData.bundleRecipients.length > 0 ? 'bg-[#3b82f6]' : isDark ? 'bg-white/20' : 'bg-gray-300'
                    )}
                  >
                    <div
                      className={cn(
                        'absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform',
                        formData.bundleRecipients.length > 0 ? 'translate-x-4' : 'translate-x-0.5'
                      )}
                    />
                  </div>
                </div>

                {formData.bundleRecipients.length > 0 && (
                  <div className="px-3 pb-3 space-y-2">
                    {formData.bundleRecipients.map((r, idx) => {
                      const activeAddr = accountProfile?.account || accountProfile?.address;
                      const usedAddrs = new Set(formData.bundleRecipients.filter((_, j) => j !== idx).map((x) => x.address));
                      const availableProfiles = (profiles || []).filter(
                        (p) => (p.account || p.address) && (p.account || p.address) !== activeAddr && !usedAddrs.has(p.account || p.address)
                      );
                      const dupeAddr = r.address && formData.bundleRecipients.some(
                        (x, j) => j !== idx && x.address === r.address
                      );
                      return (
                        <div key={idx} className="flex items-start gap-2">
                          <div className="flex-1">
                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                placeholder="rAddress..."
                                value={r.address}
                                onChange={(e) => {
                                  const updated = [...formData.bundleRecipients];
                                  updated[idx] = { ...updated[idx], address: e.target.value.trim() };
                                  setFormData((prev) => ({ ...prev, bundleRecipients: updated }));
                                }}
                                className={cn(
                                  'flex-1 px-2.5 py-2 rounded-lg border text-[12px] max-sm:text-base bg-transparent transition-colors font-mono',
                                  dupeAddr
                                    ? 'border-red-500/40'
                                    : r.address && /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(r.address)
                                      ? 'border-green-500/40'
                                      : isDark
                                        ? 'border-white/10 hover:border-white/20'
                                        : 'border-gray-200 hover:border-gray-300',
                                  'focus:outline-none focus:border-[#3b82f6] placeholder:opacity-40'
                                )}
                              />
                              {availableProfiles.length > 0 && (
                                <select
                                  value=""
                                  onChange={(e) => {
                                    if (!e.target.value) return;
                                    const updated = [...formData.bundleRecipients];
                                    updated[idx] = { ...updated[idx], address: e.target.value };
                                    setFormData((prev) => ({ ...prev, bundleRecipients: updated }));
                                  }}
                                  className={cn(
                                    'px-1.5 py-2 rounded-lg border text-[11px] bg-transparent transition-colors cursor-pointer',
                                    isDark
                                      ? 'border-white/10 hover:border-white/20'
                                      : 'border-gray-200 hover:border-gray-300',
                                    'focus:outline-none focus:border-[#3b82f6]'
                                  )}
                                  title="Pick from connected wallets"
                                >
                                  <option value="" className={isDark ? 'bg-[#111]' : 'bg-white'}>My wallets</option>
                                  {availableProfiles.map((p) => {
                                    const addr = p.account || p.address;
                                    const typeLabel = p.wallet_type === 'oauth' || p.wallet_type === 'social'
                                      ? p.provider || 'social'
                                      : p.wallet_type || 'wallet';
                                    return (
                                      <option key={addr} value={addr} className={isDark ? 'bg-[#111]' : 'bg-white'}>
                                        {addr.slice(0, 8)}...{addr.slice(-4)} ({typeLabel})
                                      </option>
                                    );
                                  })}
                                </select>
                              )}
                            </div>
                            {dupeAddr && (
                              <span className="text-[10px] text-red-500">Duplicate address</span>
                            )}
                            {r.address && bundleBalances[r.address] !== undefined && (
                              <span className={cn(
                                'text-[10px] mt-0.5',
                                bundleBalances[r.address] === null
                                  ? 'text-red-400'
                                  : bundleBalances[r.address] >= 1
                                    ? 'text-green-500'
                                    : 'text-orange-400'
                              )}>
                                {bundleBalances[r.address] === null
                                  ? 'Account not found'
                                  : `${bundleBalances[r.address].toFixed(2)} XRP`}
                              </span>
                            )}
                          </div>
                          <div className="w-[72px] flex-shrink-0">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                inputMode="decimal"
                                min={0.01}
                                max={50}
                                step={0.1}
                                value={r.percent}
                                onChange={(e) => {
                                  const updated = [...formData.bundleRecipients];
                                  const val = Math.min(50, Math.max(0, parseFloat(e.target.value) || 0));
                                  updated[idx] = { ...updated[idx], percent: val };
                                  setFormData((prev) => ({ ...prev, bundleRecipients: updated }));
                                }}
                                className={cn(
                                  'w-full px-2 py-2 rounded-lg border text-[12px] max-sm:text-base bg-transparent text-center transition-colors',
                                  r.percent <= 0 || r.percent > 50
                                    ? 'border-red-500/40'
                                    : isDark
                                      ? 'border-white/10 hover:border-white/20'
                                      : 'border-gray-200 hover:border-gray-300',
                                  'focus:outline-none focus:border-[#3b82f6]'
                                )}
                              />
                              <span className={cn('text-[11px]', isDark ? 'text-white/40' : 'text-gray-400')}>%</span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const updated = formData.bundleRecipients.filter((_, j) => j !== idx);
                              setFormData((prev) => ({ ...prev, bundleRecipients: updated }));
                            }}
                            className={cn(
                              'mt-2 text-[14px] leading-none opacity-40 hover:opacity-80 transition-opacity',
                              isDark ? 'text-white' : 'text-gray-600'
                            )}
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}

                    {(() => {
                      const totalBundlePercent = formData.bundleRecipients.reduce((s, x) => s + x.percent, 0);
                      const totalAllocated = formData.userCheckPercent + totalBundlePercent + formData.platformRetentionPercent;
                      const canAddMore = formData.bundleRecipients.length < 10;
                      return (
                        <>
                          {totalAllocated > 92 && (
                            <div className="flex items-center gap-1.5 text-[10px] text-red-500">
                              <Info size={12} className="flex-shrink-0" />
                              Total allocation {totalAllocated.toFixed(1)}% exceeds 92% max
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            {canAddMore && (
                              <button
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    bundleRecipients: [...prev.bundleRecipients, { address: '', percent: 5 }]
                                  }));
                                }}
                                className="text-[11px] text-[#3b82f6] hover:underline"
                              >
                                + Add wallet
                              </button>
                            )}
                            <span className="text-[10px] opacity-40 ml-auto">
                              {formData.bundleRecipients.length}/10 · {totalBundlePercent.toFixed(1)}% total
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Liquidity + Social Links - Combined Row */}
          <div className="flex gap-4 mb-4">
            <div
              className={cn(
                'rounded-xl border p-4 flex-1 transition-colors',
                isDark
                  ? 'border-[rgba(59,130,246,0.1)] hover:border-[rgba(59,130,246,0.2)]'
                  : 'border-[rgba(59,130,246,0.15)] hover:border-[rgba(59,130,246,0.25)]'
              )}
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-[13px] font-normal">Initial Liquidity</h3>
                <span className="text-[10px] opacity-40">Required</span>
              </div>
              <InputField
                label="XRP for AMM pool"
                type="number"
                inputMode="decimal"
                value={formData.ammXrpAmount}
                onChange={handleInputChange('ammXrpAmount')}
                error={formData.ammXrpAmount < 10}
                helperText={formData.ammXrpAmount < 10 ? 'Minimum 10 XRP' : null}
                isDark={isDark}
                min={10}
              />
            </div>

            {/* Social Links */}
            <div
              className={cn(
                'rounded-xl border p-4 flex-[2] transition-colors',
                isDark
                  ? 'border-[rgba(59,130,246,0.1)] hover:border-[rgba(59,130,246,0.2)]'
                  : 'border-[rgba(59,130,246,0.15)] hover:border-[rgba(59,130,246,0.25)]'
              )}
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-[13px] font-normal">Social Links</h3>
                <span className="text-[10px] opacity-40">Optional</span>
              </div>
              <div className="space-y-2">
                <InputField
                  label="Website"
                  placeholder="https://example.com"
                  value={formData.website}
                  onChange={handleInputChange('website')}
                  error={errors.website}
                  helperText={errors.website}
                  isDark={isDark}
                />
                <div className="flex gap-3">
                  <InputField
                    label="Telegram"
                    placeholder="t.me/channel"
                    value={formData.telegram}
                    onChange={handleInputChange('telegram')}
                    isDark={isDark}
                  />
                  <InputField
                    label="Twitter/X"
                    placeholder="@handle"
                    value={formData.twitter}
                    onChange={handleInputChange('twitter')}
                    isDark={isDark}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cost Summary */}
          {(() => {
            const bd = costBreakdown?.breakdown;
            const total = costBreakdown?.requiredFunding || Math.ceil(9 + formData.ammXrpAmount);
            const fmt = (v) => { const n = Number(v); return isNaN(n) ? v : n % 1 === 0 ? n : n.toFixed(2); };
            const hasFunds = walletBalance !== null && walletBalance >= total;
            const lowFunds = walletBalance !== null && walletBalance < total;
            return (
              <div
                className={cn(
                  'rounded-xl border mb-4 overflow-hidden transition-colors',
                  isDark
                    ? 'border-white/[0.06] bg-white/[0.02]'
                    : 'border-gray-200 bg-gray-50/50'
                )}
              >
                {/* Total header */}
                <div className={cn(
                  'px-4 py-3 flex items-center justify-between',
                  isDark ? 'bg-white/[0.03]' : 'bg-gray-100/60'
                )}>
                  <span className="text-[13px] font-medium">Launch Cost</span>
                  <div className="flex items-center gap-2">
                    {loadingCost && <Loader2 size={12} className="animate-spin opacity-40" />}
                    <span className="text-[18px] font-semibold text-[#137DFE]">
                      {loadingCost ? '—' : `${total} XRP`}
                    </span>
                  </div>
                </div>

                {/* Breakdown rows */}
                <div className="px-4 py-2.5 space-y-0">
                  {/* Main cost - AMM liquidity (largest portion, highlighted) */}
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-[12px] opacity-50">AMM liquidity</span>
                    <span className="text-[12px]">{fmt(bd?.ammLiquidity ?? formData.ammXrpAmount)} XRP</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-[12px] opacity-50">Platform fee</span>
                    <span className="text-[12px]">{fmt(bd?.platformFee ?? '~5')} XRP</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-[12px] opacity-50">Reserves + fees</span>
                    <span className="text-[12px]">
                      {fmt(bd
                        ? (bd.issuerReserve || 0) + (bd.holderReserve || 0) + (bd.ownerReserves || 0) + (bd.transactionFees || 0)
                        : '~3'
                      )} XRP
                    </span>
                  </div>
                  {bd?.antiSnipeFee > 0 && (
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-[12px] opacity-50">Anti-snipe fee</span>
                      <span className="text-[12px]">{fmt(bd.antiSnipeFee)} XRP</span>
                    </div>
                  )}
                  {bd?.bundleFee > 0 && (
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-[12px] opacity-50">Bundle fee</span>
                      <span className="text-[12px]">{fmt(bd.bundleFee + (bd.bundleReserves || 0))} XRP</span>
                    </div>
                  )}
                  {bd?.devAllocationPercent > 0 && (
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-[12px] opacity-50">Dev allocation</span>
                      <span className="text-[12px] text-[#137DFE]">{bd.devAllocationPercent}%</span>
                    </div>
                  )}
                  {bd?.platformTokenRetentionPercent > 0 && (
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-[12px] opacity-50">Platform token share</span>
                      <span className="text-[12px] opacity-40">{bd.platformTokenRetentionPercent}% of supply</span>
                    </div>
                  )}
                </div>

                {/* Wallet balance bar */}
                {walletBalance !== null && (
                  <div className={cn(
                    'px-4 py-2.5 flex items-center justify-between',
                    hasFunds
                      ? isDark ? 'bg-green-500/[0.06]' : 'bg-green-50'
                      : isDark ? 'bg-red-500/[0.06]' : 'bg-red-50'
                  )}>
                    <span className={cn('text-[12px]', hasFunds ? 'text-green-500' : 'text-red-400')}>
                      {hasFunds ? 'Sufficient balance' : 'Insufficient balance'}
                    </span>
                    <span className={cn('text-[12px] font-medium', hasFunds ? 'text-green-500' : 'text-red-400')}>
                      {walletBalance.toFixed(2)} XRP
                    </span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Token Image */}
          <div
            className={cn(
              'rounded-xl border p-4 mb-5 transition-colors',
              isDark
                ? 'border-[rgba(59,130,246,0.1)] hover:border-[rgba(59,130,246,0.2)]'
                : 'border-[rgba(59,130,246,0.15)] hover:border-[rgba(59,130,246,0.25)]'
            )}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-[13px] font-normal">Token Image</h3>
              <span className="text-[10px] opacity-40">Recommended</span>
            </div>

            <div
              onClick={handleUploadClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                'border border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors',
                dragging
                  ? 'border-[#3b82f6] bg-[#3b82f6]/5'
                  : imagePreview
                    ? 'border-green-500/30'
                    : isDark
                      ? 'border-white/15 hover:border-white/25'
                      : 'border-gray-300 hover:border-gray-400'
              )}
            >
              {imagePreview ? (
                <div className="flex items-center gap-3 justify-center">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="text-left">
                    <p className="text-green-500 text-[12px]">{fileName}</p>
                    <p className="text-[10px] opacity-50">Click to replace</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 justify-center">
                  <Upload size={20} className="opacity-20" />
                  <div className="text-left">
                    <p className="text-[12px] opacity-60">Drop image or click to browse</p>
                    <p className="text-[10px] opacity-40">PNG, JPG, GIF, WEBP • Max 500KB</p>
                  </div>
                </div>
              )}
            </div>
            {errors.file && <p className="text-red-500 text-[10px] mt-1">{errors.file}</p>}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          {/* Bundle recipient balance warning */}
          {formData.bundleRecipients.length > 0 && formData.bundleRecipients.some(r => r.address && bundleBalances[r.address] === null) && (
            <Alert severity="error" className="mb-3">
              <Info size={14} className="flex-shrink-0" />
              <span>
                Bundle recipients must have active accounts. Fund missing addresses on testnet or remove them.
              </span>
            </Alert>
          )}

          {/* Submit */}
          <Button
            fullWidth
            variant={isFormValid() ? 'primary' : 'outline'}
            disabled={!isFormValid()}
            onClick={handleSubmit}
          >
            {isFormValid()
              ? 'Launch Token'
              : (() => {
                  const missing = [];
                  if (!formData.tokenName) missing.push('Token name');
                  if (!formData.ticker || formData.ticker.length < 3 || formData.ticker.length > 20) missing.push('Ticker');
                  if (formData.tokenSupply < 1000) missing.push('Total supply');
                  if (formData.ammXrpAmount < 10) missing.push('AMM amount (min 10 XRP)');
                  if (!accountProfile && !userWallet) missing.push('Connect wallet');
                  const requiredFunding = costBreakdown?.requiredFunding || Math.ceil(9 + formData.ammXrpAmount);
                  if (walletBalance !== null && walletBalance < requiredFunding) {
                    missing.push(`Insufficient balance (need ${requiredFunding} XRP)`);
                  }
                  if (Object.keys(errors).length > 0) {
                    for (const key of Object.keys(errors)) {
                      const label = { tokenName: 'Token name', ticker: 'Ticker', website: 'Website', description: 'Description', file: 'Image' }[key] || key;
                      if (!missing.includes(label)) missing.push(label);
                    }
                  }
                  if (formData.bundleRecipients.some(r => r.address && bundleBalances[r.address] === null)) {
                    missing.push('Bundle recipient not found');
                  }
                  if (formData.bundleRecipients.some(r => r.address && bundleBalances[r.address] === undefined)) {
                    missing.push('Checking bundle recipients...');
                  }
                  return missing.length > 0
                    ? `Fix: ${missing.join(', ')}`
                    : 'Launch Token';
                })()}
          </Button>
         </div>

         {/* Right: Live Preview */}
         <div className="hidden lg:block w-[340px] flex-shrink-0">
          <div className="sticky top-6 flex flex-col gap-3">
            <div className={cn(
              'rounded-2xl border overflow-hidden transition-[border-color] duration-200',
              isDark ? 'border-white/[0.06] bg-transparent' : 'border-black/[0.06] bg-transparent'
            )}>
              {/* Preview header */}
              <div className={cn(
                'px-4 py-2 text-[10px] uppercase tracking-widest',
                isDark ? 'text-white/25' : 'text-black/25'
              )}>
                Preview
              </div>

              {/* Token identity */}
              <div className="px-4 pb-4">
                <div className="flex items-center gap-3 mb-3">
                  {imagePreview ? (
                    <img src={imagePreview} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-semibold flex-shrink-0 transition-colors duration-200',
                      isDark ? 'bg-white/[0.06] text-white/20' : 'bg-black/[0.04] text-black/20'
                    )}>
                      {formData.ticker ? formData.ticker.charAt(0) : '?'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className={cn('text-[14px] font-medium truncate block', !formData.tokenName && 'opacity-20')}>
                      {formData.tokenName || 'Token Name'}
                    </span>
                    <span className={cn('text-[12px] font-mono', !formData.ticker ? 'opacity-15' : 'text-[#137DFE]')}>
                      {formData.ticker || 'TKR'}
                    </span>
                  </div>
                </div>

                {formData.description && (
                  <p className={cn('text-[11px] leading-relaxed mb-3 line-clamp-3', isDark ? 'text-white/40' : 'text-black/40')}>{formData.description}</p>
                )}

                {(formData.website || formData.twitter || formData.telegram) && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {formData.website && (
                      <span className={cn('flex items-center gap-1 text-[10px] px-2 py-[3px] rounded-[8px]', isDark ? 'bg-white/[0.04] text-white/40' : 'bg-black/[0.03] text-black/40')}>
                        <Globe size={9} /> Website
                      </span>
                    )}
                    {formData.twitter && (
                      <span className={cn('flex items-center gap-1 text-[10px] px-2 py-[3px] rounded-[8px]', isDark ? 'bg-white/[0.04] text-white/40' : 'bg-black/[0.03] text-black/40')}>
                        <Twitter size={9} /> {formData.twitter}
                      </span>
                    )}
                    {formData.telegram && (
                      <span className={cn('flex items-center gap-1 text-[10px] px-2 py-[3px] rounded-[8px]', isDark ? 'bg-white/[0.04] text-white/40' : 'bg-black/[0.03] text-black/40')}>
                        <Send size={9} /> Telegram
                      </span>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className={cn(
                  'rounded-[10px] border p-3 space-y-[7px] transition-colors duration-200',
                  isDark ? 'bg-white/[0.025] border-white/[0.06]' : 'bg-black/[0.015] border-black/[0.06]'
                )}>
                  <div className="flex items-center justify-between">
                    <span className={cn('text-[11px]', isDark ? 'text-white/30' : 'text-black/35')}>Supply</span>
                    <span className="text-[12px] font-mono">{formData.tokenSupply.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={cn('text-[11px]', isDark ? 'text-white/30' : 'text-black/35')}>Liquidity</span>
                    <span className="text-[12px] font-mono">{formData.ammXrpAmount} XRP</span>
                  </div>
                  {formData.userCheckPercent > 0 && (
                    <div className="flex items-center justify-between">
                      <span className={cn('text-[11px]', isDark ? 'text-white/30' : 'text-black/35')}>Your allocation</span>
                      <span className="text-[12px] font-mono text-[#08AA09]">{formData.userCheckPercent}%</span>
                    </div>
                  )}
                  {formData.platformRetentionPercent > 0 && (
                    <div className="flex items-center justify-between">
                      <span className={cn('text-[11px]', isDark ? 'text-white/30' : 'text-black/35')}>Platform share</span>
                      <span className={cn('text-[12px] font-mono', isDark ? 'text-white/20' : 'text-black/25')}>{formData.platformRetentionPercent}%</span>
                    </div>
                  )}
                  {formData.bundleRecipients.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={cn('text-[11px]', isDark ? 'text-white/30' : 'text-black/35')}>Bundle</span>
                        <span className="text-[12px] font-mono text-[#650CD4]">
                          {formData.bundleRecipients.length} addr · {formData.bundleRecipients.reduce((s, r) => s + r.percent, 0)}%
                        </span>
                      </div>
                      {formData.bundleRecipients.some(r => !r.address) && (
                        <span className="text-[10px] text-red-400 mt-0.5 block">Missing wallet address</span>
                      )}
                    </div>
                  )}
                  {formData.antiSnipe && (
                    <div className="flex items-center justify-between">
                      <span className={cn('text-[11px]', isDark ? 'text-white/30' : 'text-black/35')}>Anti-snipe</span>
                      <span className="text-[12px] text-[#137DFE]">2 min</span>
                    </div>
                  )}
                </div>

                {/* Distribution bar */}
                {(() => {
                  const userPct = formData.userCheckPercent;
                  const platPct = formData.platformRetentionPercent;
                  const bundlePct = formData.bundleRecipients.reduce((s, r) => s + r.percent, 0);
                  const ammPct = Math.max(0, 100 - userPct - platPct - bundlePct);
                  return (
                    <div className="mt-3">
                      <div className="flex h-[6px] rounded-full overflow-hidden gap-[1px]">
                        {ammPct > 0 && <div className="bg-[#137DFE] transition-all duration-300" style={{ width: `${ammPct}%` }} />}
                        {userPct > 0 && <div className="bg-[#08AA09] transition-all duration-300" style={{ width: `${userPct}%` }} />}
                        {platPct > 0 && <div className={cn('transition-all duration-300', isDark ? 'bg-white/15' : 'bg-black/10')} style={{ width: `${platPct}%` }} />}
                        {bundlePct > 0 && <div className="bg-[#650CD4] transition-all duration-300" style={{ width: `${bundlePct}%` }} />}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0 mt-1.5">
                        {ammPct > 0 && <span className={cn('flex items-center gap-1 text-[10px]', isDark ? 'text-white/30' : 'text-black/30')}><span className="w-1.5 h-1.5 rounded-full bg-[#137DFE]" />AMM {ammPct}%</span>}
                        {userPct > 0 && <span className={cn('flex items-center gap-1 text-[10px]', isDark ? 'text-white/30' : 'text-black/30')}><span className="w-1.5 h-1.5 rounded-full bg-[#08AA09]" />You {userPct}%</span>}
                        {platPct > 0 && <span className={cn('flex items-center gap-1 text-[10px]', isDark ? 'text-white/30' : 'text-black/30')}><span className={cn('w-1.5 h-1.5 rounded-full', isDark ? 'bg-white/15' : 'bg-black/10')} />Platform {platPct}%</span>}
                        {bundlePct > 0 && <span className={cn('flex items-center gap-1 text-[10px]', isDark ? 'text-white/30' : 'text-black/30')}><span className="w-1.5 h-1.5 rounded-full bg-[#650CD4]" />Bundle {bundlePct}%</span>}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Unused optional settings */}
            {(() => {
              const unused = [];
              if (!formData.description) unused.push('Description');
              if (!formData.website) unused.push('Website');
              if (!formData.twitter) unused.push('Twitter');
              if (!formData.telegram) unused.push('Telegram');
              if (!formData.image) unused.push('Image');
              if (!formData.antiSnipe) unused.push('Anti-snipe');
              if (formData.userCheckPercent === 0) unused.push('Allocation');
              if (formData.platformRetentionPercent === 0) unused.push('Platform share');
              if (formData.bundleRecipients.length === 0) unused.push('Bundle');
              // Warn about bundle recipients with missing addresses
              const bundleMissing = formData.bundleRecipients.length > 0 && formData.bundleRecipients.some(r => !r.address);
              if (unused.length === 0 && !bundleMissing) return null;
              return (
                <div className={cn(
                  'rounded-[10px] border px-3 py-2.5 transition-colors duration-200',
                  isDark ? 'border-white/[0.04] bg-white/[0.015]' : 'border-black/[0.04] bg-black/[0.01]'
                )}>
                  {bundleMissing && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                      <span className="text-[10px] text-red-400">Bundle recipient needs a wallet address</span>
                    </div>
                  )}
                  {unused.length > 0 && (
                    <>
                      <span className={cn('text-[10px] block mb-1.5', isDark ? 'text-white/20' : 'text-black/20')}>Not configured</span>
                      <div className="flex flex-wrap gap-1.5">
                        {unused.map(item => (
                          <span key={item} className={cn(
                            'text-[10px] px-2 py-[2px] rounded-[6px] transition-colors duration-200',
                            isDark ? 'bg-white/[0.03] text-white/15' : 'bg-black/[0.025] text-black/20'
                          )}>
                            {item}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })()}
          </div>
         </div>
        </div>
      )}

      {/* Summary Confirmation */}
      {!isRestoring && showSummary && (
        <div className="max-w-[640px] mx-auto px-5 py-10 w-full flex-1">
          <div className="mb-6">
            <h2 className="text-xl font-normal mb-1">Review Details</h2>
            <p className="text-[13px] opacity-50">Confirm before launching</p>
          </div>

          <div className="space-y-3">
            {/* Token Identity */}
            <div className={cn(
              'rounded-xl border overflow-hidden',
              isDark ? 'border-white/10' : 'border-gray-200'
            )}>
              <div className={cn(
                'px-4 py-3 flex items-center justify-between',
                isDark ? 'bg-white/[0.03]' : 'bg-gray-100/60'
              )}>
                <span className="text-[13px] font-medium">Token</span>
              </div>
              <div className="px-4 py-3 flex items-center gap-3">
                {imagePreview && (
                  <img src={imagePreview} alt="Token" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-medium truncate">{formData.tokenName}</span>
                    <span className="text-[12px] opacity-40">{formData.ticker}</span>
                  </div>
                  {formData.description && (
                    <p className="text-[12px] opacity-50 mt-0.5 line-clamp-2">{formData.description}</p>
                  )}
                </div>
              </div>
              {(formData.website || formData.twitter || formData.telegram) && (
                <div className={cn(
                  'px-4 py-2.5 flex flex-wrap gap-3 text-[11px]',
                  isDark ? 'border-t border-white/5' : 'border-t border-gray-100'
                )}>
                  {formData.website && (
                    <span className="flex items-center gap-1 opacity-50"><Globe size={11} /> {formData.website}</span>
                  )}
                  {formData.twitter && (
                    <span className="flex items-center gap-1 opacity-50"><Twitter size={11} /> {formData.twitter}</span>
                  )}
                  {formData.telegram && (
                    <span className="flex items-center gap-1 opacity-50"><Send size={11} /> {formData.telegram}</span>
                  )}
                </div>
              )}
            </div>

            {/* Token Economics */}
            <div className={cn(
              'rounded-xl border overflow-hidden',
              isDark ? 'border-white/10' : 'border-gray-200'
            )}>
              <div className={cn(
                'px-4 py-3 flex items-center justify-between',
                isDark ? 'bg-white/[0.03]' : 'bg-gray-100/60'
              )}>
                <span className="text-[13px] font-medium">Economics</span>
                <span className="text-[12px] opacity-40">{formData.tokenSupply.toLocaleString()} supply</span>
              </div>
              <div className="px-4 py-2.5 space-y-0">
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-[12px] opacity-50">AMM pool</span>
                  <span className="text-[12px]">
                    {(100 - formData.userCheckPercent - formData.platformRetentionPercent - formData.bundleRecipients.reduce((s, r) => s + r.percent, 0))}% · {formData.ammXrpAmount} XRP
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-[12px] opacity-50">Your allocation</span>
                  <span className={cn('text-[12px]', formData.userCheckPercent > 0 ? 'text-green-500' : 'opacity-40')}>
                    {formData.userCheckPercent > 0
                      ? `${formData.userCheckPercent}% · ${Math.floor(formData.tokenSupply * (formData.userCheckPercent / 100)).toLocaleString()} tokens`
                      : 'None'}
                  </span>
                </div>
                {formData.platformRetentionPercent > 0 && (
                  <div className="py-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] opacity-50">Platform share</span>
                      <span className="text-[12px] opacity-40">{formData.platformRetentionPercent}%</span>
                    </div>
                    <p className="text-[11px] opacity-40 mt-0.5">
                      All platform share supply will be distributed to users who tweet about your token. You can turn this off above if you wish.
                    </p>
                  </div>
                )}
                {formData.antiSnipe && (
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-[12px] opacity-50">Anti-snipe</span>
                    <span className="text-[12px] text-[#137DFE]">Enabled</span>
                  </div>
                )}
                {formData.bundleRecipients.length > 0 && (
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-[12px] opacity-50">Bundle distribution</span>
                    <span className="text-[12px] text-[#137DFE]">
                      {formData.bundleRecipients.length} recipient{formData.bundleRecipients.length > 1 ? 's' : ''} · {formData.bundleRecipients.reduce((s, r) => s + r.percent, 0).toFixed(1)}%
                    </span>
                  </div>
                )}
                {formData.bundleRecipients.length > 0 && formData.bundleRecipients.map((r, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1 pl-3">
                    {r.address ? (
                      <span className="text-[11px] opacity-40 font-mono truncate max-w-[200px]">{r.address}</span>
                    ) : (
                      <span className="text-[11px] text-red-400">No wallet selected</span>
                    )}
                    <span className="text-[11px] opacity-40">
                      {r.percent}% · {Math.floor(formData.tokenSupply * (r.percent / 100)).toLocaleString()} tokens
                    </span>
                  </div>
                ))}
              </div>
              {formData.bundleRecipients.length > 0 && formData.bundleRecipients.some(r => !r.address) && (
                <div className={cn(
                  'px-4 py-2 text-[11px]',
                  isDark ? 'bg-red-500/[0.06] text-red-400' : 'bg-red-50 text-red-500'
                )}>
                  Bundle recipient missing wallet address — go back and select one.
                </div>
              )}
              {formData.userCheckPercent === 0 && (
                <div className={cn(
                  'px-4 py-2 text-[11px]',
                  isDark ? 'bg-amber-500/[0.06] text-amber-400' : 'bg-amber-50 text-amber-600'
                )}>
                  {formData.platformRetentionPercent > 0
                    ? `${100 - formData.platformRetentionPercent}% of supply goes to AMM pool`
                    : '100% of supply goes to AMM pool'}
                </div>
              )}
            </div>

            {/* Wallet */}
            <div className={cn(
              'rounded-xl border overflow-hidden',
              isDark ? 'border-white/10' : 'border-gray-200'
            )}>
              <div className={cn(
                'px-4 py-3 flex items-center justify-between',
                isDark ? 'bg-white/[0.03]' : 'bg-gray-100/60'
              )}>
                <span className="text-[13px] font-medium">Wallet</span>
                {walletBalance !== null && (
                  <span className="text-[12px] text-[#137DFE]">{walletBalance.toFixed(2)} XRP</span>
                )}
              </div>
              <div className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {accountProfile && (
                    <CheckCircle size={13} className="text-green-500 flex-shrink-0" />
                  )}
                  <input
                    type="text"
                    placeholder="rXXX..."
                    value={
                      userWallet ||
                      (accountProfile ? accountProfile.account || accountProfile.address : '')
                    }
                    onChange={(e) => setUserWallet(e.target.value)}
                    disabled={!!accountProfile}
                    className={cn(
                      'flex-1 px-3 py-2 rounded-lg border text-[13px] max-sm:text-base bg-transparent font-mono',
                      isDark ? 'border-white/10' : 'border-gray-200'
                    )}
                  />
                </div>
                <p className="text-[11px] opacity-40 mt-1.5">
                  {accountProfile ? 'Connected wallet' : 'Enter your XRPL address to receive tokens'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button fullWidth onClick={() => setShowSummary(false)}>
                Edit
              </Button>
              <Button
                fullWidth
                variant="primary"
                onClick={confirmLaunch}
                disabled={!accountProfile && !userWallet}
              >
                {!accountProfile && !userWallet ? 'Enter wallet address' : 'Launch'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Launch Status */}
      {!isRestoring && launchStep && (
        <div className="max-w-[640px] mx-auto px-5 py-4 w-full flex-1">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-normal">
              {launchStep === 'initializing' && 'Initializing...'}
              {launchStep === 'funding' && 'Fund Issuer'}
              {launchStep === 'processing' && 'Launching Token'}
              {launchStep === 'completed' && 'Launch Complete'}
              {launchStep === 'error' && 'Launch Failed'}
            </h2>
            {sessionData?.network === 'testnet' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-500 border border-yellow-500/20">
                Testnet
              </span>
            )}
          </div>

          <div>
            {launchStep === 'initializing' && (
              <div className={cn(
                'rounded-xl border p-4 text-center py-8',
                isDark ? 'border-white/10' : 'border-gray-200'
              )}>
                <Spinner />
                <p className="mt-4 text-[13px] opacity-60">Setting up...</p>
              </div>
            )}

            {(launchStep === 'funding' || launchStep === 'processing') && sessionData && (
              <div className="space-y-3">
                {/* Unified Progress */}
                <div className={cn(
                  'rounded-xl border overflow-hidden',
                  isDark ? 'border-white/10' : 'border-gray-200'
                )}>
                  <div className={cn(
                    'px-4 py-3 flex items-center justify-between',
                    isDark ? 'bg-white/[0.03]' : 'bg-gray-100/60'
                  )}>
                    {launchStep === 'processing' ? (
                      <>
                        <span className="text-[13px] font-medium text-[#3b82f6]">
                          {sessionData?.status === 'scheduling_blackhole' && sessionData?.antiSnipe && antiSnipeRemaining > 0
                            ? `Anti-snipe · ${Math.floor(antiSnipeRemaining / 60)}:${String(antiSnipeRemaining % 60).padStart(2, '0')}`
                            : sessionData?.progressMessage || {
                                funded: 'Starting launch...',
                                configuring_issuer: 'Configuring issuer...',
                                registering_token: 'Registering token...',
                                creating_trustline: 'Creating trustline...',
                                sending_tokens: 'Minting tokens...',
                                creating_checks: 'Creating check...',
                                creating_bundle_checks: 'Creating bundle checks...',
                                creating_amm: 'Creating AMM pool...',
                                scheduling_blackhole: 'Finalizing...',
                                resuming: 'Resuming launch...'
                              }[sessionData?.status] || 'Processing...'}
                        </span>
                        <span className="text-[13px] text-[#3b82f6]">{sessionData?.progress || 0}%</span>
                      </>
                    ) : (
                      <>
                        <span className={cn('text-[13px] font-medium', fundingProgress === 100 ? 'text-green-500' : '')}>
                          {fundingProgress === 100 ? 'Funded!' : 'Awaiting Funding'}
                        </span>
                        <span className="text-[13px] opacity-60">
                          {fundingBalance} / {fundingAmount.required} XRP
                        </span>
                      </>
                    )}
                  </div>
                  <div className="px-4 py-3">
                    <div className={cn(
                      'h-1.5 rounded-full overflow-hidden',
                      isDark ? 'bg-white/10' : 'bg-gray-200'
                    )}>
                      <div
                        className="h-full bg-[#3b82f6] transition-all duration-500"
                        style={{ width: `${launchStep === 'processing' ? (sessionData?.progress || 0) : fundingProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Processing step indicators */}
                  {launchStep === 'processing' && (() => {
                    const hasBundles = sessionData?.bundleRecipients?.length > 0 || formData.bundleRecipients?.length > 0;
                    const hasUserCheck = sessionData?.userCheckId || formData.userCheckPercent > 0;
                    const allSteps = [
                      { key: 'funded', label: 'Funded' },
                      { key: 'configuring_issuer', label: 'Configuring issuer' },
                      { key: 'registering_token', label: 'Registering token' },
                      { key: 'creating_trustline', label: 'Creating trustline' },
                      { key: 'sending_tokens', label: 'Minting tokens' },
                      ...(hasUserCheck ? [{ key: 'creating_checks', label: 'Creating check' }] : []),
                      ...(hasBundles ? [{ key: 'creating_bundle_checks', label: 'Creating bundle checks' }] : []),
                      { key: 'creating_amm', label: 'Creating AMM pool' },
                      { key: 'scheduling_blackhole', label: 'Finalizing' }
                    ];
                    const currentIdx = allSteps.findIndex(s => s.key === sessionData?.status);
                    const showCountdown = sessionData?.status === 'scheduling_blackhole'
                      && sessionData?.antiSnipe
                      && antiSnipeRemaining !== null
                      && antiSnipeRemaining > 0;
                    return (
                      <div className="px-4 pb-3 space-y-1">
                        {allSteps.map((s, i) => {
                          const isDone = i < currentIdx;
                          const isActive = i === currentIdx;
                          if (!isDone && !isActive) return null;
                          return (
                            <div key={s.key} className={cn(
                              'flex items-center gap-2 text-[12px]',
                              isDone ? 'opacity-40' : 'opacity-100'
                            )}>
                              {isDone ? (
                                <CheckCircle size={12} className="text-green-500" />
                              ) : (
                                <Loader2 size={12} className="animate-spin text-[#3b82f6]" />
                              )}
                              {s.label}
                            </div>
                          );
                        })}
                        {showCountdown && (() => {
                          const tokenIssuer = sessionData.issuer || sessionData.issuerAddress;
                          const tokenCurrency = sessionData.originalCurrencyCode || sessionData.currencyCode || formData.ticker;
                          const tokenSlug = tokenIssuer && tokenCurrency ? `${tokenIssuer}-${tokenCurrency}` : null;
                          const tokenUrl = tokenSlug ? `https://xrpl.to/token/${tokenSlug}` : null;
                          return (
                            <>
                              <div className={cn(
                                'mt-2 px-3 py-2.5 rounded-lg border flex items-center justify-between',
                                isDark ? 'border-yellow-500/20 bg-yellow-500/[0.06]' : 'border-yellow-500/20 bg-yellow-50'
                              )}>
                                <div>
                                  <span className={cn('text-[12px] font-medium', isDark ? 'text-yellow-400' : 'text-yellow-600')}>
                                    Anti-snipe window
                                  </span>
                                  <p className={cn('text-[10px] mt-0.5', isDark ? 'text-yellow-400/60' : 'text-yellow-600/60')}>
                                    Issuer locked until window closes
                                  </p>
                                </div>
                                <span className={cn(
                                  'text-[20px] font-semibold tabular-nums',
                                  antiSnipeRemaining <= 30
                                    ? isDark ? 'text-green-400' : 'text-green-600'
                                    : isDark ? 'text-yellow-400' : 'text-yellow-600'
                                )}>
                                  {Math.floor(antiSnipeRemaining / 60)}:{String(antiSnipeRemaining % 60).padStart(2, '0')}
                                </span>
                              </div>
                              {tokenUrl && (
                                <div className="mt-2 flex gap-2">
                                  <a
                                    href={`/token/${tokenSlug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn(
                                      'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[12px] font-medium transition-colors',
                                      'bg-[#137DFE] text-white hover:opacity-90'
                                    )}
                                  >
                                    View Token <ExternalLink size={11} />
                                  </a>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(tokenUrl);
                                      openSnackbar?.('Link copied!', 'success');
                                    }}
                                    className={cn(
                                      'flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12px] transition-colors border',
                                      isDark
                                        ? 'border-white/10 hover:bg-white/5'
                                        : 'border-gray-200 hover:bg-gray-50'
                                    )}
                                  >
                                    <Copy size={11} /> Copy Link
                                  </button>
                                  <a
                                    href={`https://x.com/intent/tweet?text=${encodeURIComponent(`Check out $${formData.ticker || tokenCurrency} on XRPL!`)}&url=${encodeURIComponent(tokenUrl)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn(
                                      'flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors',
                                      isDark
                                        ? 'bg-white text-black hover:bg-white/90'
                                        : 'bg-black text-white hover:bg-black/90'
                                    )}
                                  >
                                    <svg width={11} height={11} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                                    Share
                                  </a>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    );
                  })()}
                </div>

                {/* Issuer Address */}
                <div className={cn(
                  'rounded-xl border overflow-hidden',
                  isDark ? 'border-white/10' : 'border-gray-200'
                )}>
                  <div className={cn(
                    'px-4 py-3 flex items-center justify-between',
                    isDark ? 'bg-white/[0.03]' : 'bg-gray-100/60'
                  )}>
                    <span className="text-[13px] font-medium">Issuer Address</span>
                  </div>
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <code className={cn(
                        'flex-1 px-3 py-2 rounded-lg text-[12px] font-mono truncate',
                        isDark ? 'bg-black/30' : 'bg-gray-50'
                      )}>
                        {sessionData?.issuerAddress || 'Loading...'}
                      </code>
                      {sessionData?.issuerAddress && (
                        <Button
                          size="small"
                          onClick={() => {
                            navigator.clipboard.writeText(sessionData.issuerAddress);
                            openSnackbar?.('Copied!', 'success');
                          }}
                        >
                          <Copy size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Wallet */}
                {launchStep === 'funding' && (
                <div className={cn(
                  'rounded-xl border overflow-hidden',
                  isDark ? 'border-white/10' : 'border-gray-200'
                )}>
                  <div className={cn(
                    'px-4 py-3 flex items-center justify-between',
                    isDark ? 'bg-white/[0.03]' : 'bg-gray-100/60'
                  )}>
                    <span className="text-[13px] font-medium">Wallet</span>
                    {walletBalance !== null && (
                      <span className={cn(
                        'text-[12px]',
                        walletBalance >= (sessionData?.requiredFunding || fundingAmount.required)
                          ? 'text-green-500'
                          : 'text-red-400'
                      )}>
                        {walletBalance.toFixed(2)} XRP
                      </span>
                    )}
                  </div>
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {accountProfile && <CheckCircle size={13} className="text-green-500 flex-shrink-0" />}
                      <input
                        type="text"
                        placeholder="rXXX..."
                        value={
                          userWallet ||
                          (accountProfile ? accountProfile.account || accountProfile.address : '')
                        }
                        onChange={(e) => setUserWallet(e.target.value)}
                        disabled={!!accountProfile}
                        className={cn(
                          'flex-1 px-3 py-2 rounded-lg border text-[13px] max-sm:text-base bg-transparent font-mono',
                          isDark ? 'border-white/10' : 'border-gray-200'
                        )}
                      />
                    </div>
                    <p className="text-[11px] opacity-40 mt-1.5">
                      {accountProfile ? 'Connected wallet' : 'Enter your XRPL address'}
                    </p>
                  </div>
                </div>
                )}

                {launchStep === 'funding' && sessionData?.fundingBreakdown && (() => {
                  const b = sessionData.fundingBreakdown;
                  const fmt = (v) => { const n = Number(v); return n % 1 === 0 ? `${n}` : `${n.toFixed(2)}`; };
                  const fees = (b.platformFee || 0) + (b.antiSnipeFee || 0);
                  const setup = (b.issuerReserve || 0) + (b.holderReserve || 0) + (b.ownerReserves || 0) + (b.transactionFees || 0) + (b.bundleFee || 0) + (b.bundleReserves || 0);
                  return (
                    <div className={cn(
                      'rounded-xl border overflow-hidden',
                      isDark ? 'border-white/10' : 'border-gray-200'
                    )}>
                      <div className={cn(
                        'px-4 py-2.5 flex items-center justify-between',
                        isDark ? 'bg-white/[0.03]' : 'bg-gray-100/60'
                      )}>
                        <span className="text-[13px] font-medium">Cost</span>
                        <span className="text-[16px] font-semibold text-[#137DFE]">
                          {b.total || sessionData.requiredFunding} XRP
                        </span>
                      </div>
                      <div className="px-4 py-1.5 flex items-center justify-between text-[12px]">
                        <span className="opacity-50">AMM liquidity</span>
                        <span>{fmt(b.ammLiquidity)} XRP</span>
                      </div>
                      <div className="px-4 py-1.5 flex items-center justify-between text-[12px]">
                        <span className="opacity-50">Fees{b.antiSnipeFee > 0 ? ' + anti-snipe' : ''}</span>
                        <span>{fmt(fees)} XRP</span>
                      </div>
                      <div className="px-4 py-1.5 pb-2.5 flex items-center justify-between text-[12px]">
                        <span className="opacity-50">Reserves{b.bundleFee > 0 ? ' + bundle' : ''}</span>
                        <span>{fmt(setup)} XRP</span>
                      </div>
                    </div>
                  );
                })()}



                {/* Fund with connected wallet */}
                {launchStep === 'funding' && accountProfile && fundingProgress < 100 && (
                  <div className={cn(
                    'rounded-xl border overflow-hidden',
                    fundingStep
                      ? fundingStep === 'confirmed'
                        ? 'border-green-500/20 bg-green-500/5'
                        : 'border-[#3b82f6]/20 bg-[#3b82f6]/5'
                      : isDark ? 'border-white/10' : 'border-gray-200'
                  )}>
                    {fundingStep && (
                      <div className="px-4 py-3 space-y-1.5">
                        {['connecting', 'signing', 'submitted', 'confirmed'].map((step, i) => {
                          const labels = {
                            connecting: 'Connecting to XRPL',
                            signing: 'Signing transaction',
                            submitted: 'Confirming on ledger',
                            confirmed: 'Payment confirmed'
                          };
                          const steps = ['connecting', 'signing', 'submitted', 'confirmed'];
                          const currentIdx = steps.indexOf(fundingStep);
                          const isDone = i < currentIdx;
                          const isActive = step === fundingStep;
                          if (!isDone && !isActive) return null;
                          return (
                            <div key={step} className={cn(
                              'flex items-center gap-2 text-[12px] transition-opacity',
                              isDone ? 'opacity-50' : 'opacity-100'
                            )}>
                              {isDone ? (
                                <CheckCircle size={12} className="text-green-500" />
                              ) : isActive && step !== 'confirmed' ? (
                                <Loader2 size={12} className="animate-spin text-[#3b82f6]" />
                              ) : (
                                <CheckCircle size={12} className="text-green-500" />
                              )}
                              {labels[step]}
                            </div>
                          );
                        })}
                        {fundingStep === 'confirmed' && (
                          <div className="flex items-center gap-2 text-[12px] mt-1">
                            <Loader2 size={12} className="animate-spin text-[#3b82f6]" />
                            <span className="text-[#3b82f6]">Backend processing...</span>
                          </div>
                        )}
                        {fundingTxHash && (
                          <a
                            href={`${sessionData?.network === 'mainnet' ? 'https://xrpl.org' : 'https://testnet.xrpl.org'}/transactions/${fundingTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[10px] text-[#3b82f6] hover:underline mt-1"
                          >
                            View transaction <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    )}
                    {!fundingStep && !fundConfirm && (
                      <button
                        disabled={fundingSending}
                        onClick={() => setFundConfirm(true)}
                        className={cn(
                          'w-full flex items-center justify-center gap-2 py-2.5 text-[13px] font-medium transition-colors',
                          'hover:opacity-90 cursor-pointer',
                          'bg-[#137DFE] text-white'
                        )}
                      >
                        <WalletIcon size={14} />
                        Fund with Wallet ({sessionData.requiredFunding || fundingAmount.required} XRP)
                      </button>
                    )}
                    {!fundingStep && fundConfirm && (
                      <div className="p-4 space-y-3">
                        <p className={cn(
                          'text-[12px] text-center',
                          isDark ? 'text-white/60' : 'text-gray-600'
                        )}>
                          Send <span className="font-semibold text-white">{sessionData.requiredFunding || fundingAmount.required} XRP</span> to launch <span className="font-semibold text-white">{formData.tokenName || sessionData?.formData?.tokenName || 'your token'}</span>?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setFundConfirm(false)}
                            className={cn(
                              'flex-1 py-2 rounded-lg text-[12px] font-medium transition-colors',
                              isDark
                                ? 'bg-white/[0.06] text-white/60 hover:bg-white/10'
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            )}
                          >
                            Go Back
                          </button>
                          <button
                            disabled={fundingSending}
                            onClick={async () => {
                              if (!sessionData?.issuerAddress || !accountProfile) return;
                              setFundConfirm(false);
                              setFundingSending(true);
                              setFundingStep('connecting');
                              setFundingTxHash(null);
                              try {
                                const wallet = await getSigningWallet();
                                if (!wallet) {
                                  openSnackbar?.('Wallet locked - please reconnect your wallet', 'error');
                                  setFundingSending(false);
                                  setFundingStep(null);
                                  return;
                                }
                                const wsUrl = sessionData?.network === 'mainnet'
                                  ? 'wss://xrplcluster.com'
                                  : 'wss://s.altnet.rippletest.net:51233';
                                const client = new xrpl.Client(wsUrl, { connectionTimeout: 10000 });
                                await client.connect();

                                setFundingStep('signing');
                                const amountDrops = String(
                                  Math.ceil((sessionData.requiredFunding || fundingAmount.required) * 1000000)
                                );
                                const paymentTx = {
                                  TransactionType: 'Payment',
                                  Account: wallet.address,
                                  Destination: sessionData.issuerAddress,
                                  Amount: amountDrops,
                                  SourceTag: 161803
                                };

                                setFundingStep('submitted');
                                const result = await client.submitAndWait(paymentTx, {
                                  autofill: true,
                                  wallet
                                });

                                if (result.result.meta.TransactionResult === 'tesSUCCESS') {
                                  setFundingTxHash(result.result.hash);
                                  setFundingStep('confirmed');
                                } else {
                                  openSnackbar?.(
                                    'Payment failed: ' + result.result.meta.TransactionResult,
                                    'error'
                                  );
                                  setFundingStep(null);
                                }
                                try { await client.disconnect(); } catch {}
                              } catch (error) {
                                console.error('[FundWallet] Error:', error.message, error.stack);
                                openSnackbar?.(error.message || 'Failed to send funding', 'error');
                                setFundingStep(null);
                              } finally {
                                setFundingSending(false);
                              }
                            }}
                            className="flex-1 py-2 rounded-lg text-[12px] font-medium bg-[#137DFE] text-white hover:opacity-90 transition-colors"
                          >
                            Confirm & Pay
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Cancel — only before any payment is sent */}
                {launchStep === 'funding' && fundingProgress === 0 && !fundingStep && !fundingSending && (
                  <div className="pt-4 mt-2">
                    {cancelConfirm ? (
                      <div className={cn(
                        'rounded-xl border p-4 space-y-3',
                        isDark ? 'border-red-500/20 bg-red-500/[0.04]' : 'border-red-200 bg-red-50/50'
                      )}>
                        <p className={cn(
                          'text-[12px] text-center',
                          isDark ? 'text-white/60' : 'text-gray-600'
                        )}>
                          Are you sure? The session will expire and you'll need to start over.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setCancelConfirm(false)}
                            className={cn(
                              'flex-1 py-2 rounded-lg text-[12px] font-medium transition-colors',
                              isDark
                                ? 'bg-white/[0.06] text-white/60 hover:bg-white/10'
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            )}
                          >
                            Keep Going
                          </button>
                          <button
                            onClick={() => { setCancelConfirm(false); resetLaunchState(); }}
                            className="flex-1 py-2 rounded-lg text-[12px] font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
                          >
                            Yes, Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setCancelConfirm(true)}
                        className={cn(
                          'w-full py-2 text-[11px] transition-colors',
                          isDark
                            ? 'text-white/20 hover:text-white/40'
                            : 'text-gray-300 hover:text-gray-400'
                        )}
                      >
                        Cancel launch
                      </button>
                    )}
                  </div>
                )}

              </div>
            )}


            {launchStep === 'completed' && sessionData && (
              <div className={cn(
                'rounded-xl border p-4 space-y-4',
                isDark ? 'border-white/10' : 'border-gray-200'
              )}>
                <Alert severity="success">
                  <CheckCircle size={14} />
                  Token launched on XRPL {sessionData.network === 'mainnet' ? 'Mainnet' : 'Testnet'}
                  !
                </Alert>

                {imagePreview && (
                  <div className="flex justify-center">
                    <img src={imagePreview} alt={formData.tokenName || 'Token'} className="w-20 h-20 rounded-xl object-cover" />
                  </div>
                )}

                <div
                  className={cn(
                    'p-4 rounded-lg space-y-2 text-[13px]',
                    isDark ? 'bg-white/5' : 'bg-gray-50'
                  )}
                >
                  <div className="flex justify-between">
                    <span className="opacity-60">Token</span>
                    <span>
                      {formData.tokenName || sessionData.originalCurrencyCode} (
                      {sessionData.originalCurrencyCode || formData.ticker})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">Supply</span>
                    <span>
                      {Number(sessionData.tokenSupply || formData.tokenSupply).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">AMM Pool</span>
                    <span>{sessionData.ammXrpAmount || formData.ammXrpAmount} XRP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">Issuer</span>
                    <span className="font-mono text-[11px]">
                      {(sessionData.issuer || sessionData.issuerAddress)?.slice(0, 8)}...{(sessionData.issuer || sessionData.issuerAddress)?.slice(-4)}
                    </span>
                  </div>
                </div>

                {(sessionData.data?.userCheckId || sessionData.userCheckId) && (
                  <div
                    className={cn(
                      'p-4 rounded-lg border',
                      checkClaimed
                        ? 'border-green-500/20 bg-green-500/5'
                        : 'border-[#3b82f6]/20 bg-[#3b82f6]/5'
                    )}
                  >
                    <p className="text-[14px] font-medium mb-2">
                      {checkClaimed ? 'Claimed' : 'Claim Tokens'}
                    </p>
                    <p className="text-[12px] opacity-70 mb-3">
                      {checkClaimed
                        ? `Claimed ${Math.floor(formData.tokenSupply * (formData.userCheckPercent / 100)).toLocaleString()} ${formData.ticker}`
                        : `${Math.floor(formData.tokenSupply * (formData.userCheckPercent / 100)).toLocaleString()} ${formData.ticker} available`}
                    </p>
                    {!checkClaimed && !claiming && (
                      <Alert severity="info" className="mb-3">
                        <Info size={14} />
                        {accountProfile
                          ? 'Sign a CheckCash transaction to claim'
                          : 'Connect wallet to claim'}
                      </Alert>
                    )}
                    {claiming && (
                      <div className="mb-3 space-y-1.5">
                        {['connecting', 'trustline', 'cashing'].map((step, i) => {
                          const labels = { connecting: 'Connecting to XRPL', trustline: 'Setting trustline', cashing: 'Claiming tokens' };
                          const steps = ['connecting', 'trustline', 'cashing'];
                          const currentIdx = steps.indexOf(claimStep);
                          const stepIdx = i;
                          const isDone = stepIdx < currentIdx;
                          const isActive = step === claimStep;
                          return (
                            <div key={step} className={cn(
                              'flex items-center gap-2 text-[12px] transition-opacity',
                              isDone ? 'opacity-50' : isActive ? 'opacity-100' : 'opacity-30'
                            )}>
                              {isDone ? (
                                <CheckCircle size={12} className="text-green-500" />
                              ) : isActive ? (
                                <Loader2 size={12} className="animate-spin text-[#3b82f6]" />
                              ) : (
                                <div className="w-3 h-3 rounded-full border border-current opacity-30" />
                              )}
                              {labels[step]}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {checkClaimed && (
                      <Alert severity="success">
                        <CheckCircle size={14} /> Tokens claimed!
                      </Alert>
                    )}
                    <Button
                      variant="primary"
                      fullWidth
                      disabled={!accountProfile || checkClaimed || claiming}
                      onClick={async () => {
                        if (!(accountProfile?.account || accountProfile?.address)) {
                          openSnackbar?.('Connect your wallet', 'error');
                          return;
                        }
                        setClaiming(true);
                        setClaimStep('connecting');
                        let client;
                        try {
                          const ticker =
                            formData.ticker ||
                            sessionData.originalCurrencyCode ||
                            sessionData.data?.originalCurrencyCode ||
                            sessionData.currencyCode ||
                            sessionData.data?.currencyCode;
                          const supply =
                            formData.tokenSupply ||
                            sessionData.tokenSupply ||
                            sessionData.data?.tokenSupply;
                          const checkPercent =
                            formData.userCheckPercent ||
                            sessionData.userCheckPercent ||
                            sessionData.data?.userCheckPercent ||
                            0;
                          const apiCheckAmount =
                            sessionData.userCheckAmount ||
                            sessionData.data?.userCheckAmount;
                          if (!ticker) {
                            openSnackbar?.('Currency code not found', 'error');
                            setClaiming(false);
                            setClaimStep(null);
                            return;
                          }
                          const wallet = await getSigningWallet();
                          if (!wallet) {
                            openSnackbar?.('Wallet locked - please reconnect your wallet', 'error');
                            setClaiming(false);
                            setClaimStep(null);
                            return;
                          }
                          const wsUrl =
                            sessionData?.network === 'mainnet'
                              ? 'wss://xrplcluster.com'
                              : 'wss://s.altnet.rippletest.net:51233';
                          client = new xrpl.Client(wsUrl);
                          await Promise.race([
                            client.connect(),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('WebSocket connection timed out')), 15000))
                          ]);
                          // Use hex from API if already 40 chars, otherwise convert
                          const currencyCode =
                            (sessionData.currencyCode && sessionData.currencyCode.length === 40)
                              ? sessionData.currencyCode
                              : ticker.length === 3
                                ? ticker
                                : xrpl.convertStringToHex(ticker).padEnd(40, '0');
                          const issuerAddr =
                            sessionData.issuerAddress ||
                            sessionData.issuer ||
                            sessionData.data?.issuer;
                          const claimAmount = apiCheckAmount
                            ? String(apiCheckAmount)
                            : String(Math.floor(supply * (checkPercent / 100)));

                          // Step 1: Create trustline to issuer (required before CheckCash)
                          // Use total supply as limit so wallet can receive more tokens later via trading
                          setClaimStep('trustline');
                          const trustSetTx = {
                            TransactionType: 'TrustSet',
                            Account: wallet.address,
                            LimitAmount: {
                              currency: currencyCode,
                              issuer: issuerAddr,
                              value: String(supply)
                            },
                            SourceTag: 161803
                          };
                          const trustResult = await client.submitAndWait(trustSetTx, {
                            autofill: true,
                            wallet
                          });
                          if (trustResult.result.meta.TransactionResult !== 'tesSUCCESS') {
                            openSnackbar?.(
                              'Trustline failed: ' + trustResult.result.meta.TransactionResult,
                              'error'
                            );
                            try { await client?.disconnect(); } catch {}
                            setClaiming(false);
                            setClaimStep(null);
                            return;
                          }

                          // Step 2: Cash the check
                          setClaimStep('cashing');
                          const checkCashTx = {
                            TransactionType: 'CheckCash',
                            Account: wallet.address,
                            CheckID: sessionData.data?.userCheckId || sessionData.userCheckId,
                            Amount: {
                              currency: currencyCode,
                              issuer: issuerAddr,
                              value: claimAmount
                            },
                            SourceTag: 161803
                          };
                          const tx = await client.submitAndWait(checkCashTx, {
                            autofill: true,
                            wallet
                          });
                          if (tx.result.meta.TransactionResult === 'tesSUCCESS') {
                            setCheckClaimed(true);
                            openSnackbar?.('Tokens claimed!', 'success');
                          } else {
                            openSnackbar?.('Failed: ' + tx.result.meta.TransactionResult, 'error');
                          }
                        } catch (error) {
                          if (error.message?.includes('tecNO_ENTRY')) {
                            setCheckClaimed(true);
                            openSnackbar?.('Already claimed', 'warning');
                          } else {
                            openSnackbar?.('Error: ' + error.message, 'error');
                          }
                        } finally {
                          try { await client?.disconnect(); } catch {}
                          setClaiming(false);
                          setClaimStep(null);
                        }
                      }}
                      className="mt-2"
                    >
                      {claiming ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 size={14} className="animate-spin" />
                          {claimStep === 'connecting' && 'Connecting...'}
                          {claimStep === 'trustline' && 'Setting trustline...'}
                          {claimStep === 'cashing' && 'Claiming tokens...'}
                          {!claimStep && 'Claiming...'}
                        </span>
                      ) : checkClaimed
                          ? 'Claimed'
                          : accountProfile
                            ? 'Claim Tokens'
                            : 'Connect Wallet'}
                    </Button>
                    <p className="text-[10px] opacity-40 mt-2">
                      ID:{' '}
                      {(sessionData.data?.userCheckId || sessionData.userCheckId)?.substring(0, 16)}
                      ...
                    </p>
                  </div>
                )}

                {/* Bundle check claiming */}
                {(sessionData.bundleCheckIds || []).length > 0 && (() => {
                  const allBundleChecks = sessionData.bundleCheckIds || [];
                  return (
                    <div
                      className={cn(
                        'p-4 rounded-lg border space-y-3',
                        isDark ? 'border-white/10' : 'border-gray-200'
                      )}
                    >
                      <p className="text-[14px] font-medium">Bundle Checks</p>
                      <p className="text-[12px] opacity-70">
                        {allBundleChecks.length} check{allBundleChecks.length > 1 ? 's' : ''}
                      </p>
                      {allBundleChecks.map((b) => {
                        const isClaimed = b.claimed || bundleClaimed[b.checkId];
                        const claimingStep = bundleClaiming[b.checkId];
                        const profile = (profiles || []).find((p) => (p.account || p.address) === b.address);
                        const canClaim = !!profile;
                        const typeLabel = profile?.wallet_type === 'oauth' || profile?.wallet_type === 'social'
                          ? profile.provider || 'social'
                          : profile?.wallet_type || 'wallet';
                        return (
                          <div
                            key={b.checkId}
                            className={cn(
                              'p-3 rounded-lg border',
                              isClaimed
                                ? 'border-green-500/20 bg-green-500/5'
                                : 'border-[#3b82f6]/20 bg-[#3b82f6]/5'
                            )}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px]">
                                  {b.address.slice(0, 8)}...{b.address.slice(-4)}
                                </span>
                                <span className={cn(
                                  'text-[9px] px-1.5 py-0.5 rounded',
                                  isDark ? 'bg-white/10' : 'bg-gray-100'
                                )}>
                                  {typeLabel}
                                </span>
                              </div>
                              <span className="text-[12px]">
                                {b.percent}% · {Number(b.amount).toLocaleString()} tokens
                              </span>
                            </div>
                            {claimingStep && (
                              <div className="mb-2 space-y-1">
                                {['connecting', 'trustline', 'cashing'].map((step, i) => {
                                  const labels = { connecting: 'Connecting to XRPL', trustline: 'Setting trustline', cashing: 'Claiming tokens' };
                                  const steps = ['connecting', 'trustline', 'cashing'];
                                  const currentIdx = steps.indexOf(claimingStep);
                                  const isDone = i < currentIdx;
                                  const isActive = step === claimingStep;
                                  return (
                                    <div key={step} className={cn(
                                      'flex items-center gap-2 text-[11px] transition-opacity',
                                      isDone ? 'opacity-50' : isActive ? 'opacity-100' : 'opacity-30'
                                    )}>
                                      {isDone ? (
                                        <CheckCircle size={10} className="text-green-500" />
                                      ) : isActive ? (
                                        <Loader2 size={10} className="animate-spin text-[#3b82f6]" />
                                      ) : (
                                        <div className="w-2.5 h-2.5 rounded-full border border-current opacity-30" />
                                      )}
                                      {labels[step]}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            {isClaimed && (
                              <Alert severity="success" className="mb-2">
                                <CheckCircle size={12} /> Claimed
                              </Alert>
                            )}
                            {!canClaim && !isClaimed && (
                              <p className="text-[10px] opacity-50 mb-1">
                                This wallet is not connected on this device. The recipient must claim from their own device.
                              </p>
                            )}
                            <Button
                              variant="primary"
                              fullWidth
                              size="small"
                              disabled={isClaimed || !!claimingStep || !canClaim}
                              onClick={async () => {
                                setBundleClaiming((prev) => ({ ...prev, [b.checkId]: 'connecting' }));
                                let client;
                                try {
                                  const ticker =
                                    formData.ticker ||
                                    sessionData.originalCurrencyCode ||
                                    sessionData.data?.originalCurrencyCode ||
                                    sessionData.currencyCode ||
                                    sessionData.data?.currencyCode;
                                  if (!ticker) {
                                    openSnackbar?.('Currency code not found', 'error');
                                    setBundleClaiming((prev) => { const n = { ...prev }; delete n[b.checkId]; return n; });
                                    return;
                                  }
                                  const wallet = await getSigningWalletForProfile(profile);
                                  if (!wallet) {
                                    openSnackbar?.('Cannot sign for this wallet', 'error');
                                    setBundleClaiming((prev) => { const n = { ...prev }; delete n[b.checkId]; return n; });
                                    return;
                                  }
                                  const wsUrl =
                                    sessionData?.network === 'mainnet'
                                      ? 'wss://xrplcluster.com'
                                      : 'wss://s.altnet.rippletest.net:51233';
                                  client = new xrpl.Client(wsUrl);
                                  await Promise.race([
                                    client.connect(),
                                    new Promise((_, reject) => setTimeout(() => reject(new Error('WebSocket connection timed out')), 15000))
                                  ]);
                                  // Use hex from API if already 40 chars, otherwise convert
                                  const currencyCode =
                                    (sessionData.currencyCode && sessionData.currencyCode.length === 40)
                                      ? sessionData.currencyCode
                                      : ticker.length === 3
                                        ? ticker
                                        : xrpl.convertStringToHex(ticker).padEnd(40, '0');
                                  const issuerAddr =
                                    sessionData.issuerAddress ||
                                    sessionData.issuer ||
                                    sessionData.data?.issuer;

                                  // Use total supply as limit so wallet can receive more tokens later via trading
                                  const totalSupply = sessionData.tokenSupply || sessionData.data?.tokenSupply || formData.tokenSupply;
                                  setBundleClaiming((prev) => ({ ...prev, [b.checkId]: 'trustline' }));
                                  const trustSetTx = {
                                    TransactionType: 'TrustSet',
                                    Account: wallet.address,
                                    LimitAmount: {
                                      currency: currencyCode,
                                      issuer: issuerAddr,
                                      value: String(totalSupply)
                                    },
                                    SourceTag: 161803
                                  };
                                  const trustResult = await client.submitAndWait(trustSetTx, {
                                    autofill: true,
                                    wallet
                                  });
                                  if (trustResult.result.meta.TransactionResult !== 'tesSUCCESS') {
                                    openSnackbar?.('Trustline failed: ' + trustResult.result.meta.TransactionResult, 'error');
                                    try { await client?.disconnect(); } catch {}
                                    setBundleClaiming((prev) => { const n = { ...prev }; delete n[b.checkId]; return n; });
                                    return;
                                  }

                                  setBundleClaiming((prev) => ({ ...prev, [b.checkId]: 'cashing' }));
                                  const checkCashTx = {
                                    TransactionType: 'CheckCash',
                                    Account: wallet.address,
                                    CheckID: b.checkId,
                                    Amount: {
                                      currency: currencyCode,
                                      issuer: issuerAddr,
                                      value: String(b.amount)
                                    },
                                    SourceTag: 161803
                                  };
                                  const tx = await client.submitAndWait(checkCashTx, {
                                    autofill: true,
                                    wallet
                                  });
                                  if (tx.result.meta.TransactionResult === 'tesSUCCESS') {
                                    setBundleClaimed((prev) => ({ ...prev, [b.checkId]: true }));
                                    openSnackbar?.(`Bundle claimed for ${b.address.slice(0, 8)}...`, 'success');
                                  } else {
                                    openSnackbar?.('Failed: ' + tx.result.meta.TransactionResult, 'error');
                                  }
                                } catch (error) {
                                  if (error.message?.includes('tecNO_ENTRY')) {
                                    setBundleClaimed((prev) => ({ ...prev, [b.checkId]: true }));
                                    openSnackbar?.('Already claimed', 'warning');
                                  } else {
                                    openSnackbar?.('Error: ' + error.message, 'error');
                                  }
                                } finally {
                                  try { await client?.disconnect(); } catch {}
                                  setBundleClaiming((prev) => { const n = { ...prev }; delete n[b.checkId]; return n; });
                                }
                              }}
                            >
                              {claimingStep ? (
                                <span className="flex items-center justify-center gap-2">
                                  <Loader2 size={12} className="animate-spin" />
                                  {claimingStep === 'connecting' && 'Connecting...'}
                                  {claimingStep === 'trustline' && 'Setting trustline...'}
                                  {claimingStep === 'cashing' && 'Claiming...'}
                                </span>
                              ) : isClaimed ? 'Claimed' : canClaim ? 'Claim' : 'Connect wallet'}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                <a
                  href={`/token/${(sessionData.issuer || sessionData.issuerAddress)}-${sessionData.originalCurrencyCode || formData.ticker}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-medium transition-colors',
                    'bg-[#137DFE] text-white hover:opacity-90'
                  )}
                >
                  View Token <ExternalLink size={12} />
                </a>

                {(() => {
                  const launchIssuer = sessionData.issuer || sessionData.issuerAddress;
                  const launchCurrency = sessionData.originalCurrencyCode || formData.ticker;
                  if (launchIssuer && launchCurrency) {
                    const tokenSlug = `${launchIssuer}-${launchCurrency}`;
                    const tokenPageUrl = `https://xrpl.to/token/${tokenSlug}`;
                    const tweetText = `Check out $${formData.ticker || formData.tokenName} on XRPL!`;
                    const tweetIntentUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(tokenPageUrl)}`;
                    return (
                      <a
                        href={tweetIntentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-semibold transition-colors',
                          isDark
                            ? 'bg-white text-black hover:bg-white/90'
                            : 'bg-black text-white hover:bg-black/90'
                        )}
                      >
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                        Share on X
                      </a>
                    );
                  }
                  return null;
                })()}

                {(() => {
                  const hasDevCheck = !!(sessionData.data?.userCheckId || sessionData.userCheckId);
                  const devDone = !hasDevCheck || checkClaimed;
                  const allBundles = sessionData.bundleCheckIds || [];
                  const allBundlesDone = allBundles.every((b) => b.claimed || bundleClaimed[b.checkId]);
                  const allDone = devDone && allBundlesDone;
                  const pendingBundles = allBundles.filter((b) => !b.claimed && !bundleClaimed[b.checkId]);
                  const hasPending = (hasDevCheck && !checkClaimed) || pendingBundles.length > 0;
                  return (
                    <Button
                      variant={allDone ? 'primary' : 'outline'}
                      fullWidth
                      disabled={hasPending}
                      onClick={() => {
                        resetLaunchState();
                        setFormData({
                          tokenName: '',
                          ticker: '',
                          description: '',
                          twitter: '',
                          telegram: '',
                          website: '',
                          image: null,
                          ammXrpAmount: 10,
                          tokenSupply: 1000000000,
                          userCheckPercent: 0,
                          antiSnipe: false,
                          platformRetentionPercent: 3,
                          bundleRecipients: []
                        });
                        setFileName('');
                        setImagePreview('');
                      }}
                    >
                      {allDone ? 'Done' : `Claim ${(hasDevCheck && !checkClaimed ? 1 : 0) + pendingBundles.length} remaining`}
                    </Button>
                  );
                })()}
              </div>
            )}

            {launchStep === 'error' && (
              <div className={cn(
                'rounded-xl border p-4 space-y-4',
                isDark ? 'border-white/10' : 'border-gray-200'
              )}>
                <Alert severity="error">{launchError || 'An error occurred'}</Alert>
                <Button fullWidth onClick={resetLaunchState}>
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default CreatePage;

export async function getStaticProps() {
  return {
    props: {
      ogp: {
        canonical: 'https://xrpl.to/launch',
        title: 'Token Launch | Launch Your Token on XRPL',
        url: 'https://xrpl.to/launch',
        imgUrl: 'https://xrpl.to/api/og/launch',
        imgType: 'image/png',
        desc: 'Launch your token on the XRP Ledger with automated trustline setup, AMM pool creation, and listing.'
      }
    }
  };
}
