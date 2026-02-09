import React, { useState, useRef, useContext, useEffect } from 'react';
import api from 'src/utils/api';
import * as xrpl from 'xrpl';
import { AppContext } from 'src/context/AppContext';
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
  className
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
          'w-full px-2.5 py-2 rounded-lg border text-[13px] bg-transparent resize-none transition-colors',
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
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        max={max}
        className={cn(
          'w-full px-2.5 py-2 rounded-lg border text-[13px] bg-transparent transition-colors',
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
  const { themeName, accountProfile, openSnackbar } = useContext(AppContext);
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
    platformRetentionPercent: 3
  });
  const [fileName, setFileName] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [errors, setErrors] = useState({});
  const [dragging, setDragging] = useState(false);
  const [launchStep, setLaunchStep] = useState('');
  const [sessionData, setSessionData] = useState(null);
  const [launchError, setLaunchError] = useState('');
  const [userWallet, setUserWallet] = useState('');
  const [launchLogs, setLaunchLogs] = useState([]);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [fundingBalance, setFundingBalance] = useState(0);
  const [fundingProgress, setFundingProgress] = useState(0);
  const [fundingAmount, setFundingAmount] = useState({ received: 0, required: 0 });
  const [checkClaimed, setCheckClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimStep, setClaimStep] = useState(null); // 'connecting' | 'trustline' | 'cashing' | null
  const [showSummary, setShowSummary] = useState(false);
  const [decryptedSeed, setDecryptedSeed] = useState(null);
  const [costBreakdown, setCostBreakdown] = useState(null);
  const [loadingCost, setLoadingCost] = useState(false);
  const [walletBalance, setWalletBalance] = useState(null);
  const [fundingSending, setFundingSending] = useState(false);
  const [seedDebugInfo, setSeedDebugInfo] = useState(null);

  // Debug: load seed info for display
  useEffect(() => {
    if (!accountProfile) { setSeedDebugInfo(null); return; }
    (async () => {
      const info = { wallet_type: accountProfile.wallet_type, account: accountProfile.account || accountProfile.address, walletKeyId: null, seed: 'N/A', deviceKeyRaw: null };
      try {
        const walletStorage = new UnifiedWalletStorage();
        if (accountProfile.seed) {
          info.seed = accountProfile.seed;
          info.walletKeyId = 'profile-direct';
        } else if (accountProfile.wallet_type === 'oauth' || accountProfile.wallet_type === 'social') {
          const walletId = `${accountProfile.provider}_${accountProfile.provider_id}`;
          info.walletKeyId = walletId;
          const storedPassword = await walletStorage.getSecureItem(`wallet_pwd_${walletId}`);
          info.hasPassword = !!storedPassword;
          if (storedPassword) {
            const walletData = await walletStorage.findWalletBySocialId(walletId, storedPassword, accountProfile.account || accountProfile.address);
            info.seed = walletData?.seed || 'not-found';
          }
        } else if (accountProfile.wallet_type === 'device') {
          const raw = localStorage.getItem('device_key_id');
          info.deviceKeyRaw = raw ? `${raw.substring(0, 20)}... (len=${raw.length})` : 'null';
          const dkId = await deviceFingerprint.getDeviceId();
          info.walletKeyId = dkId;
          info.hasPassword = false;
          if (dkId) {
            // Check if encrypted key exists in localStorage
            const encKey = `device_pwd_${dkId}_enc`;
            const encExists = localStorage.getItem(encKey);
            info.encKeyExists = !!encExists;
            info.encKeyName = encKey.substring(0, 30) + '...';
            if (encExists) {
              info.encKeyLen = encExists.length;
              // Try decryption separately to catch specific errors
              try {
                const decrypted = await walletStorage.getSecureItem(`device_pwd_${dkId}`);
                info.decryptOk = !!decrypted;
                info.hasPassword = !!decrypted;
              } catch (decErr) {
                info.decryptError = decErr.message;
              }
            } else {
              // Check all localStorage keys for any device_pwd entries
              const allDevicePwdKeys = [];
              for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith('device_pwd_')) allDevicePwdKeys.push(k);
              }
              info.otherDevicePwdKeys = allDevicePwdKeys.length > 0 ? allDevicePwdKeys.join(', ') : 'none';
            }
            if (info.hasPassword) {
              const storedPassword = await walletStorage.getWalletCredential(dkId);
              const walletData = await walletStorage.getWalletByAddress(accountProfile.account || accountProfile.address, storedPassword);
              info.seed = walletData?.seed || 'not-found';
            }
            // Also check if wallet exists in IndexedDB
            try {
              const walletByPasskey = await walletStorage.getWalletByPasskey(dkId);
              info.walletInDB = !!walletByPasskey;
            } catch (e) {
              info.walletInDB = 'error: ' + e.message;
            }
          }
        }
        if (info.seed && info.seed.length > 10) {
          info.seedLen = info.seed.length;
          info.seedTrimmed = info.seed.trim() !== info.seed ? 'HAS WHITESPACE!' : 'clean';
          info.seed = `${info.seed.substring(0, 4)}...(${info.seed.length} chars)`;
        }
      } catch (e) {
        info.error = e.message;
      }
      setSeedDebugInfo(info);
    })();
  }, [accountProfile]);

  // Get signing wallet from cached credentials (no password prompt needed)
  const getSigningWallet = async () => {
    if (!accountProfile) {
      console.log('[getSigningWallet] No accountProfile');
      return null;
    }
    console.log('[getSigningWallet] wallet_type:', accountProfile.wallet_type, 'account:', accountProfile.account || accountProfile.address);

    const safeParseSeed = (seed, source) => {
      console.log(`[getSigningWallet] Seed from ${source}: length=${seed?.length}, algo=${seed?.startsWith('sEd') ? 'ed25519' : 'secp256k1'}`);
      const trimmed = seed.trim();
      if (trimmed !== seed) {
        console.warn(`[getSigningWallet] Seed had whitespace! original=${seed.length} trimmed=${trimmed.length}`);
      }
      const algorithm = trimmed.startsWith('sEd') ? 'ed25519' : 'secp256k1';
      console.log(`[getSigningWallet] Using algorithm: ${algorithm}`);
      return xrpl.Wallet.fromSeed(trimmed, { algorithm });
    };

    try {
      // 1. Use pre-decrypted seed (set by decryptSeed useEffect)
      if (decryptedSeed) {
        return safeParseSeed(decryptedSeed, 'decryptedSeed');
      }

      // 2. Direct seed on profile
      if (accountProfile.seed) {
        return safeParseSeed(accountProfile.seed, 'accountProfile.seed');
      }

      // 3. Try auto-unlock from credential cache
      const walletStorage = new UnifiedWalletStorage();
      let seed = null;

      if (accountProfile.wallet_type === 'oauth' || accountProfile.wallet_type === 'social') {
        const walletId = `${accountProfile.provider}_${accountProfile.provider_id}`;
        console.log('[getSigningWallet] OAuth wallet, walletId:', walletId);
        const storedPassword = await walletStorage.getSecureItem(`wallet_pwd_${walletId}`);
        console.log('[getSigningWallet] storedPassword found:', !!storedPassword);
        if (storedPassword) {
          const walletData = await walletStorage.findWalletBySocialId(
            walletId, storedPassword, accountProfile.account || accountProfile.address
          );
          console.log('[getSigningWallet] walletData found:', !!walletData, 'has seed:', !!walletData?.seed);
          seed = walletData?.seed;
        }
      } else if (accountProfile.wallet_type === 'device') {
        const deviceKeyId = await deviceFingerprint.getDeviceId();
        console.log('[getSigningWallet] Device wallet, deviceKeyId:', !!deviceKeyId);
        if (deviceKeyId) {
          const storedPassword = await walletStorage.getWalletCredential(deviceKeyId);
          console.log('[getSigningWallet] storedPassword found:', !!storedPassword);
          if (storedPassword) {
            const walletData = await walletStorage.getWalletByAddress(
              accountProfile.account || accountProfile.address, storedPassword
            );
            console.log('[getSigningWallet] walletData found:', !!walletData, 'has seed:', !!walletData?.seed);
            seed = walletData?.seed;
          }
        }
      } else {
        console.log('[getSigningWallet] Unknown wallet_type:', accountProfile.wallet_type);
      }

      if (seed) {
        const w = safeParseSeed(seed, 'credential-cache');
        setDecryptedSeed(seed.trim()); // Cache trimmed for next time
        return w;
      }

      console.log('[getSigningWallet] No seed found from any source');
      return null;
    } catch (err) {
      console.error('[getSigningWallet] Error:', err.message, err.stack);
      throw err;
    }
  };

  // Fetch testnet balance for connected wallet or entered address
  useEffect(() => {
    const addr = accountProfile?.account || accountProfile?.address || userWallet;
    if (!addr || !addr.startsWith('r') || addr.length < 25) {
      setWalletBalance(null);
      return;
    }
    let cancelled = false;
    const fetchBalance = async () => {
      try {
        const client = new xrpl.Client('wss://s.altnet.rippletest.net:51233');
        await client.connect();
        const info = await client.request({
          command: 'account_info',
          account: addr,
          ledger_index: 'validated'
        });
        await client.disconnect();
        if (!cancelled) {
          setWalletBalance(parseInt(info.result.account_data.Balance) / 1000000);
        }
      } catch {
        if (!cancelled) setWalletBalance(null);
      }
    };
    fetchBalance();
    return () => { cancelled = true; };
  }, [accountProfile, userWallet]);

  // Decrypt seed on mount if OAuth wallet
  useEffect(() => {
    const decryptSeed = async () => {
      if (!accountProfile) {
        setDecryptedSeed(null);
        return;
      }

      if (accountProfile.seed) {
        setDecryptedSeed(accountProfile.seed);
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
                setDecryptedSeed(wallet.seed);
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
                setDecryptedSeed(walletData.seed);
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
      if (formData.ammXrpAmount < 1) return;
      setLoadingCost(true);
      try {
        const userCheckAmount = Math.floor(formData.tokenSupply * (formData.userCheckPercent / 100));
        const res = await api.get(
          `https://api.xrpl.to/v1/launch-token/calculate-funding?ammXrpAmount=${formData.ammXrpAmount}&antiSnipe=${formData.antiSnipe}&tokenSupply=${formData.tokenSupply}&userCheckAmount=${userCheckAmount}&platformRetentionPercent=${formData.platformRetentionPercent}`
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
  }, [formData.ammXrpAmount, formData.antiSnipe, formData.tokenSupply, formData.userCheckPercent, formData.platformRetentionPercent]);

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('tokenLaunchSession');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setSessionData(parsed);
        setUserWallet(parsed.userWallet || '');

        // Restore form data if available
        if (parsed.formData) {
          setFormData(parsed.formData);
          if (parsed.formData.image) {
            setFileName(parsed.formData.image.name || 'uploaded-file');
          }
        }

        // Poll status to get current state
        (async () => {
          const response = await api.get(
            `https://api.xrpl.to/v1/launch-token/status/${parsed.sessionId}`
          );
          const status = response.data;

          // Update to current step
          if (['success', 'completed'].includes(status.status)) {
            setLaunchStep('completed');
            setSessionData((prev) => ({ ...prev, ...status }));
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
              'creating_amm',
              'scheduling_blackhole'
            ].includes(status.status)
          ) {
            setLaunchStep('processing');
            setSessionData((prev) => ({ ...prev, ...status }));
          } else {
            setLaunchStep('funding');
          }
        })();
      } catch (e) {
        console.error('Failed to restore session:', e);
        localStorage.removeItem('tokenLaunchSession');
      }
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
    const maxSize = 15 * 1024 * 1024; // 15MB for images

    if (!validTypes.includes(file.type)) {
      setErrors((prev) => ({ ...prev, file: 'Invalid file type. Use PNG, JPG, GIF, or WEBP' }));
      return;
    }

    if (file.size > maxSize) {
      setErrors((prev) => ({ ...prev, file: 'File too large (max 15MB)' }));
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
    return (
      formData.tokenName &&
      formData.ticker &&
      formData.ticker.length >= 3 &&
      formData.ticker.length <= 20 &&
      formData.tokenSupply >= 1000 &&
      formData.ammXrpAmount >= 1 &&
      !Object.keys(errors).length
    );
  };

  // Polling function to check funding status
  const checkFundingStatus = async (sessionId) => {
    try {
      const response = await api.get(`https://api.xrpl.to/v1/launch-token/status/${sessionId}`);
      return response.data;
    } catch (error) {
      return null;
    }
  };

  // Polling function to check launch status
  const pollLaunchStatus = async (sessionId) => {
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
    setLaunchLogs([]);
    setFundingProgress(0);

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
            website: formData.website
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
    setLaunchLogs([]);
    setFundingProgress(0);
    setFundingAmount({ received: 0, required: 0 });
    setShowDebugPanel(false);
    setSessionData(null);
  };

  // Polling effect for funding status
  useEffect(() => {
    if (launchStep !== 'funding' || !sessionData?.sessionId) return;

    const pollInterval = setInterval(async () => {
      const status = await checkFundingStatus(sessionData.sessionId);

      if (!status) {
        return;
      }

      // Update logs if available
      if (status.logs && status.logs.length > 0) {
        setLaunchLogs(status.logs);
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
          setLaunchLogs((prev) => [
            ...prev,
            {
              timestamp: new Date().toISOString(),
              level: 'success',
              message: 'Funding complete! Waiting for backend to continue...'
            }
          ]);
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
          'creating_amm',
          'scheduling_blackhole'
        ].includes(status.status)
      ) {
        // Backend is processing - transition to processing view
        if (launchStep === 'funding') {
          setLaunchStep('processing');
        }
      }

      if (['success', 'completed', 'failed', 'funding_timeout'].includes(status.status)) {
        clearInterval(pollInterval);
        if (status.status === 'success' || status.status === 'completed') {
          setLaunchStep('completed');
          setSessionData((prev) => ({ ...prev, ...status }));
        } else {
          setLaunchError(status.error || `Launch ${status.status}`);
          setLaunchStep('error');
        }
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [launchStep, sessionData?.sessionId]);

  // Polling effect for processing status
  useEffect(() => {
    if (launchStep !== 'processing' || !sessionData?.sessionId) return;

    const pollInterval = setInterval(async () => {
      const status = await pollLaunchStatus(sessionData.sessionId);
      if (!status) return;

      // Update logs
      if (status.logs) {
        setLaunchLogs(status.logs);
      }

      // Update status and session data
      setSessionData((prev) => ({ ...prev, ...status }));

      // Check completion
      if (status.status === 'success' || status.status === 'completed') {
        clearInterval(pollInterval);
        setLaunchStep('completed');
        setSessionData((prev) => ({ ...prev, ...status }));
      } else if (status.status === 'failed') {
        clearInterval(pollInterval);
        setLaunchError(status.error || 'Launch failed');
        setLaunchStep('error');
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [launchStep, sessionData?.sessionId]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <h1 className="sr-only">Launch Token on XRPL</h1>

      {/* Main Form */}
      {!launchStep && !showSummary && (
        <div className="max-w-[640px] mx-auto px-5 py-6 w-full flex-1">
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
                  error={errors.tokenName}
                  helperText={errors.tokenName}
                  counter={`${formData.tokenName.length}/50`}
                  counterError={formData.tokenName.length > 50}
                  isDark={isDark}
                />
                <InputField
                  label="Ticker"
                  placeholder="TKN"
                  value={formData.ticker}
                  onChange={handleInputChange('ticker')}
                  error={errors.ticker}
                  helperText={errors.ticker}
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
                  value={formData.tokenSupply}
                  onChange={handleInputChange('tokenSupply')}
                  isDark={isDark}
                  min={1000}
                />
                <InputField
                  label="Your allocation %"
                  type="number"
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
                    5 min window
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
                      min={0}
                      max={10}
                      value={formData.platformRetentionPercent}
                      onChange={handleInputChange('platformRetentionPercent')}
                      className={cn(
                        'w-12 text-center text-[12px] font-medium py-0.5 rounded border outline-none',
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
                value={formData.ammXrpAmount}
                onChange={handleInputChange('ammXrpAmount')}
                error={formData.ammXrpAmount < 1}
                helperText={formData.ammXrpAmount < 1 ? 'Minimum 1 XRP' : null}
                isDark={isDark}
                min={1}
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
                        : '~3.8'
                      )} XRP
                    </span>
                  </div>
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
                    <p className="text-[10px] opacity-40">PNG, JPG, GIF, WEBP • Max 15MB</p>
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

          {/* Submit */}
          <Button
            fullWidth
            variant={isFormValid() ? 'primary' : 'outline'}
            disabled={!isFormValid()}
            onClick={handleSubmit}
          >
            {isFormValid()
              ? 'Launch Token'
              : `Complete ${4 - (formData.tokenName ? 1 : 0) - (formData.ticker ? 1 : 0) - (formData.tokenSupply > 0 ? 1 : 0) - (formData.ammXrpAmount >= 1 ? 1 : 0)} required fields`}
          </Button>
        </div>
      )}

      {/* Summary Confirmation */}
      {showSummary && (
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
                    {(100 - formData.userCheckPercent - formData.platformRetentionPercent)}% · {formData.ammXrpAmount} XRP
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
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-[12px] opacity-50">Platform share</span>
                    <span className="text-[12px] opacity-40">{formData.platformRetentionPercent}%</span>
                  </div>
                )}
                {formData.antiSnipe && (
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-[12px] opacity-50">Anti-snipe</span>
                    <span className="text-[12px] text-[#137DFE]">Enabled</span>
                  </div>
                )}
              </div>
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
                      'flex-1 px-3 py-2 rounded-lg border text-[13px] bg-transparent font-mono',
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
      {launchStep && (
        <div className="max-w-[640px] mx-auto px-5 py-4 w-full flex-1">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-normal">
              {launchStep === 'initializing' && 'Initializing...'}
              {launchStep === 'funding' && 'Fund Issuer'}
              {launchStep === 'processing' && 'Creating Token'}
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

            {launchStep === 'funding' && sessionData && (
              <div className="space-y-3">
                {/* Funding Progress */}
                <div className={cn(
                  'rounded-xl border overflow-hidden',
                  isDark ? 'border-white/10' : 'border-gray-200'
                )}>
                  <div className={cn(
                    'px-4 py-3 flex items-center justify-between',
                    isDark ? 'bg-white/[0.03]' : 'bg-gray-100/60'
                  )}>
                    <span className={cn('text-[13px] font-medium', fundingProgress === 100 ? 'text-green-500' : '')}>
                      {fundingProgress === 100 ? 'Funded!' : 'Awaiting Funding'}
                    </span>
                    <span className="text-[13px] opacity-60">
                      {fundingBalance} / {fundingAmount.required} XRP
                    </span>
                  </div>
                  <div className="px-4 py-3">
                    <div className={cn(
                      'h-1.5 rounded-full overflow-hidden',
                      isDark ? 'bg-white/10' : 'bg-gray-200'
                    )}>
                      <div
                        className="h-full bg-[#3b82f6] transition-all"
                        style={{ width: `${fundingProgress}%` }}
                      />
                    </div>
                  </div>
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
                          'flex-1 px-3 py-2 rounded-lg border text-[13px] bg-transparent font-mono',
                          isDark ? 'border-white/10' : 'border-gray-200'
                        )}
                      />
                    </div>
                    <p className="text-[11px] opacity-40 mt-1.5">
                      {accountProfile ? 'Connected wallet' : 'Enter your XRPL address'}
                    </p>
                  </div>
                </div>

                {sessionData?.fundingBreakdown && (() => {
                  const b = sessionData.fundingBreakdown;
                  const reserves = (b.issuerReserve || 0) + (b.holderReserve || 0) + (b.ownerReserves || 0);
                  const txFees = b.transactionFees ?? (b.fees ? b.fees - (b.ownerReserves || 0) : 1);
                  const fmt = (v) => { const n = Number(v); return n % 1 === 0 ? `${n}` : `${n.toFixed(2)}`; };
                  const rows = [
                    { label: 'AMM liquidity', value: b.ammLiquidity },
                    { label: 'Platform fee', value: b.platformFee },
                    { label: 'Account reserves', value: reserves },
                    { label: 'Transaction fees', value: txFees },
                  ];
                  if (b.bundleFee > 0) rows.push({ label: 'Bundle fee', value: b.bundleFee });
                  if (b.bundleReserves > 0) rows.push({ label: 'Bundle reserves', value: b.bundleReserves });
                  if (b.devAllocationPercent > 0) rows.push({ label: 'Dev allocation', value: `${b.devAllocationPercent}%`, isPercent: true });
                  if (b.platformTokenRetentionPercent > 0) rows.push({ label: 'Platform token share', value: `${b.platformTokenRetentionPercent}% of supply`, isPercent: true });
                  return (
                    <div className={cn(
                      'rounded-xl border overflow-hidden',
                      isDark ? 'border-white/10' : 'border-gray-200'
                    )}>
                      <div className={cn(
                        'px-4 py-3 flex items-center justify-between',
                        isDark ? 'bg-white/[0.03]' : 'bg-gray-100/60'
                      )}>
                        <span className="text-[13px] font-medium">Cost Breakdown</span>
                        <span className="text-[18px] font-semibold text-[#137DFE]">
                          {b.total || sessionData.requiredFunding} XRP
                        </span>
                      </div>
                      <div className="px-4 py-2.5 space-y-0">
                        {rows.map((r) => (
                          <div key={r.label} className="flex items-center justify-between py-1.5">
                            <span className="text-[12px] opacity-50">{r.label}</span>
                            <span className={cn('text-[12px]', r.isPercent ? 'opacity-40' : '')}>
                              {r.isPercent ? r.value : `${fmt(r.value)} XRP`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Seed Debug Panel */}
                {seedDebugInfo && (
                  <div className={cn(
                    'rounded-xl border overflow-hidden font-mono text-[9px]',
                    'border-yellow-500/30',
                    isDark ? 'bg-yellow-500/10' : 'bg-yellow-50'
                  )}>
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-yellow-600">Debug: Seed</div>
                    <div className="px-3 pb-2 space-y-0.5">
                      <div>wallet_type: <span className="text-blue-400">{seedDebugInfo.wallet_type || 'undefined'}</span></div>
                      <div>account: <span className="opacity-60">{seedDebugInfo.account || 'undefined'}</span></div>
                      {seedDebugInfo.deviceKeyRaw && (
                        <div>device_key_id (raw): <span className="opacity-60">{seedDebugInfo.deviceKeyRaw}</span></div>
                      )}
                      <div>walletKeyId: <span className={seedDebugInfo.walletKeyId ? 'text-green-500' : 'text-red-500'}>{seedDebugInfo.walletKeyId || 'undefined'}</span></div>
                      <div>localStorage encrypted key: <span className={seedDebugInfo.encKeyExists ? 'text-green-500' : 'text-red-500'}>{seedDebugInfo.encKeyExists ? `YES (${seedDebugInfo.encKeyLen} chars)` : 'MISSING'}</span></div>
                      {!seedDebugInfo.encKeyExists && seedDebugInfo.otherDevicePwdKeys && (
                        <div>other device_pwd_* keys: <span className="text-yellow-500">{seedDebugInfo.otherDevicePwdKeys}</span></div>
                      )}
                      {seedDebugInfo.encKeyExists && (
                        <div>decryption: <span className={seedDebugInfo.decryptOk ? 'text-green-500' : 'text-red-500'}>{seedDebugInfo.decryptOk ? 'OK' : seedDebugInfo.decryptError || 'FAILED'}</span></div>
                      )}
                      <div>hasPassword: <span className={seedDebugInfo.hasPassword ? 'text-green-500' : 'text-red-500'}>{String(seedDebugInfo.hasPassword ?? 'N/A')}</span></div>
                      <div>walletInDB: <span className={seedDebugInfo.walletInDB === true ? 'text-green-500' : 'text-red-500'}>{String(seedDebugInfo.walletInDB ?? 'N/A')}</span></div>
                      <div>seed: <span className="text-green-500 break-all">{seedDebugInfo.seed}</span></div>
                      {seedDebugInfo.seedLen && (
                        <div>seedLen: {seedDebugInfo.seedLen} | trimmed: <span className={seedDebugInfo.seedTrimmed === 'clean' ? 'text-green-500' : 'text-red-500'}>{seedDebugInfo.seedTrimmed}</span></div>
                      )}
                      {seedDebugInfo.error && (
                        <div className="text-red-500">error: {seedDebugInfo.error}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Fund with connected wallet */}
                {accountProfile && fundingProgress < 100 && (
                  <button
                    disabled={fundingSending}
                    onClick={async () => {
                      if (!sessionData?.issuerAddress || !accountProfile) return;
                      setFundingSending(true);
                      console.log('[FundWallet] Starting. issuerAddress:', sessionData.issuerAddress, 'required:', sessionData.requiredFunding || fundingAmount.required);
                      try {
                        console.log('[FundWallet] Getting signing wallet...');
                        const wallet = await getSigningWallet();
                        if (!wallet) {
                          console.log('[FundWallet] No wallet returned');
                          openSnackbar?.('Wallet locked - please reconnect your wallet', 'error');
                          setFundingSending(false);
                          return;
                        }
                        console.log('[FundWallet] Wallet address:', wallet.address);

                        const wsUrl = sessionData?.network === 'mainnet'
                          ? 'wss://xrplcluster.com'
                          : 'wss://s.altnet.rippletest.net:51233';
                        console.log('[FundWallet] Connecting to:', wsUrl);
                        const client = new xrpl.Client(wsUrl);
                        await client.connect();
                        console.log('[FundWallet] Connected');

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
                        console.log('[FundWallet] Submitting payment:', JSON.stringify(paymentTx));

                        const result = await client.submitAndWait(paymentTx, {
                          autofill: true,
                          wallet
                        });
                        await client.disconnect();
                        console.log('[FundWallet] Result:', result.result.meta.TransactionResult);

                        if (result.result.meta.TransactionResult === 'tesSUCCESS') {
                          openSnackbar?.('Funding sent! Waiting for confirmation...', 'success');
                        } else {
                          openSnackbar?.(
                            'Payment failed: ' + result.result.meta.TransactionResult,
                            'error'
                          );
                        }
                      } catch (error) {
                        console.error('[FundWallet] Error:', error.message, error.stack);
                        openSnackbar?.(error.message || 'Failed to send funding', 'error');
                      } finally {
                        setFundingSending(false);
                      }
                    }}
                    className={cn(
                      'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-medium transition-colors',
                      fundingSending
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:opacity-90 cursor-pointer',
                      'bg-[#137DFE] text-white'
                    )}
                  >
                    {fundingSending ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Sending {sessionData.requiredFunding || fundingAmount.required} XRP...
                      </>
                    ) : (
                      <>
                        <WalletIcon size={14} />
                        Fund with Wallet ({sessionData.requiredFunding || fundingAmount.required} XRP)
                      </>
                    )}
                  </button>
                )}

                {sessionData?.faucetUrl && (
                  <a
                    href={sessionData.faucetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-[12px] text-[#3b82f6] hover:underline"
                  >
                    Get testnet XRP from faucet <ExternalLink size={12} />
                  </a>
                )}

                <button
                  onClick={async () => {
                    if (!sessionData?.sessionId) return;
                    try {
                      const walletAddress =
                        userWallet || accountProfile?.account || accountProfile?.address;
                      await api.delete(
                        `https://api.xrpl.to/v1/launch-token/${sessionData.sessionId}`,
                        {
                          data: { refundAddress: walletAddress }
                        }
                      );
                      openSnackbar?.('Launch cancelled', 'success');
                    } catch (error) {
                      openSnackbar?.(error.response?.data?.error || 'Cancel failed', 'error');
                    }
                    resetLaunchState();
                  }}
                  className={cn(
                    'w-full py-2 rounded-xl text-[12px] transition-colors',
                    isDark
                      ? 'text-white/50 hover:text-white/80 hover:bg-white/5'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  )}
                >
                  Cancel
                </button>
              </div>
            )}

            {launchStep === 'processing' && (
              <div className={cn(
                'rounded-xl border p-4 space-y-4',
                isDark ? 'border-white/10' : 'border-gray-200'
              )}>
                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="opacity-60">
                      {sessionData?.progressMessage || 'Processing...'}
                    </span>
                    <span className="text-[#3b82f6]">{sessionData?.progress || 0}%</span>
                  </div>
                  <div
                    className={cn(
                      'h-1.5 rounded-full overflow-hidden',
                      isDark ? 'bg-white/10' : 'bg-gray-200'
                    )}
                  >
                    <div
                      className="h-full bg-[#3b82f6] transition-all duration-500"
                      style={{ width: `${sessionData?.progress || 0}%` }}
                    />
                  </div>
                </div>

                <div className="text-center py-4">
                  <Spinner />
                  <p className="mt-3 text-[13px]">
                    {sessionData?.progressMessage || {
                      funded: 'Starting launch...',
                      configuring_issuer: 'Configuring issuer...',
                      registering_token: 'Registering token...',
                      creating_trustline: 'Creating trustline...',
                      sending_tokens: 'Minting tokens...',
                      creating_checks: 'Creating check...',
                      creating_amm: 'Creating AMM pool...',
                      scheduling_blackhole: 'Finalizing...'
                    }[sessionData?.status] || 'Processing...'}
                  </p>
                </div>

                {launchLogs.some((log) => log.message?.includes('Insufficient')) && (
                  <Alert severity="error">Insufficient funding - add more XRP</Alert>
                )}

                <button
                  onClick={() => setShowDebugPanel(!showDebugPanel)}
                  className="text-[12px] text-[#3b82f6] w-full"
                >
                  {showDebugPanel ? 'Hide' : 'Show'} logs ({launchLogs.length})
                </button>

                {showDebugPanel && launchLogs.length > 0 && (
                  <div
                    className={cn(
                      'p-3 max-h-[200px] overflow-auto rounded-lg font-mono text-[10px]',
                      isDark ? 'bg-black/50' : 'bg-gray-100'
                    )}
                  >
                    {launchLogs.map((log, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          log.level === 'error'
                            ? 'text-red-500'
                            : log.level === 'warn'
                              ? 'text-yellow-500'
                              : log.level === 'success'
                                ? 'text-green-500'
                                : 'opacity-70'
                        )}
                      >
                        [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
                      </div>
                    ))}
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
                      {sessionData.originalCurrencyCode || formData.tokenName} (
                      {sessionData.currencyCode || formData.ticker})
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
                      {sessionData.issuer?.slice(0, 8)}...{sessionData.issuer?.slice(-4)}
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
                        if (!accountProfile?.account) {
                          openSnackbar?.('Connect your wallet', 'error');
                          return;
                        }
                        setClaiming(true);
                        setClaimStep('connecting');
                        try {
                          const ticker =
                            formData.ticker ||
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
                          const client = new xrpl.Client(wsUrl);
                          await client.connect();
                          const currencyCode =
                            ticker.length === 3
                              ? ticker
                              : xrpl.convertStringToHex(ticker).padEnd(40, '0');
                          const issuerAddr =
                            sessionData.issuerAddress ||
                            sessionData.issuer ||
                            sessionData.data?.issuer;
                          const claimAmount = String(Math.floor(supply * (checkPercent / 100)));

                          // Step 1: Create trustline to issuer (required before CheckCash)
                          setClaimStep('trustline');
                          const trustSetTx = {
                            TransactionType: 'TrustSet',
                            Account: wallet.address,
                            LimitAmount: {
                              currency: currencyCode,
                              issuer: issuerAddr,
                              value: claimAmount
                            }
                          };
                          const trustResult = await client.submitAndWait(trustSetTx, {
                            autofill: true,
                            wallet
                          });
                          if (trustResult.result.meta.TransactionResult !== 'tesSUCCESS') {
                            await client.disconnect();
                            openSnackbar?.(
                              'Trustline failed: ' + trustResult.result.meta.TransactionResult,
                              'error'
                            );
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
                            }
                          };
                          const tx = await client.submitAndWait(checkCashTx, {
                            autofill: true,
                            wallet
                          });
                          await client.disconnect();
                          if (tx.result.meta.TransactionResult === 'tesSUCCESS') {
                            setCheckClaimed(true);
                            localStorage.removeItem('tokenLaunchSession');
                            openSnackbar?.('Tokens claimed!', 'success');
                          } else {
                            openSnackbar?.('Failed: ' + tx.result.meta.TransactionResult, 'error');
                          }
                        } catch (error) {
                          if (error.message.includes('tecNO_ENTRY')) {
                            setCheckClaimed(true);
                            openSnackbar?.('Already claimed', 'warning');
                          } else {
                            openSnackbar?.('Error: ' + error.message, 'error');
                          }
                        } finally {
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

                {(!(sessionData.data?.userCheckId || sessionData.userCheckId) || checkClaimed) && (
                  <Button
                    variant="primary"
                    fullWidth
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
                        platformRetentionPercent: 3
                      });
                      setFileName('');
                      setImagePreview('');
                    }}
                  >
                    Done
                  </Button>
                )}
              </div>
            )}

            {launchStep === 'error' && (
              <div className={cn(
                'rounded-xl border p-4 space-y-4',
                isDark ? 'border-white/10' : 'border-gray-200'
              )}>
                <Alert severity="error">{launchError || 'An error occurred'}</Alert>
                {launchLogs.length > 0 && (
                  <div
                    className={cn(
                      'p-3 max-h-[200px] overflow-auto rounded-lg font-mono text-[10px]',
                      isDark ? 'bg-black/30' : 'bg-gray-100'
                    )}
                  >
                    {launchLogs.map((log, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          log.level === 'error'
                            ? 'text-red-500'
                            : log.level === 'warn'
                              ? 'text-yellow-500'
                              : 'opacity-60'
                        )}
                      >
                        [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
                      </div>
                    ))}
                  </div>
                )}
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
