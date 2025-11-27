import React, { useState, useRef, useContext, useEffect } from 'react';
import axios from 'axios';
import * as xrpl from 'xrpl';
import { AppContext } from 'src/AppContext';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import { UnifiedWalletStorage } from 'src/utils/encryptedWalletStorage';
import { cn } from 'src/utils/cn';
import { Twitter, Send, Globe, Upload, CheckCircle, Info, Copy, ExternalLink, Loader2 } from 'lucide-react';

// Reusable InputField component
const InputField = ({ label, value, onChange, placeholder, error, helperText, counter, counterError, isDark, multiline, rows, type = 'text', min, max, className }) => (
  <div className={cn("flex-1", className)}>
    <label className="block text-[11px] opacity-60 mb-1">{label}</label>
    {multiline ? (
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows || 2}
        className={cn(
          "w-full px-2.5 py-2 rounded-lg border text-[13px] bg-transparent resize-none transition-colors",
          error ? "border-red-500/40" : isDark ? "border-white/10 hover:border-white/20" : "border-gray-200 hover:border-gray-300",
          "focus:outline-none focus:border-[#4285f4] placeholder:opacity-40"
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
          "w-full px-2.5 py-2 rounded-lg border text-[13px] bg-transparent transition-colors",
          error ? "border-red-500/40" : isDark ? "border-white/10 hover:border-white/20" : "border-gray-200 hover:border-gray-300",
          "focus:outline-none focus:border-[#4285f4] placeholder:opacity-40"
        )}
      />
    )}
    {(helperText || counter) && (
      <div className="flex justify-between mt-0.5">
        <span className={cn("text-[10px] opacity-50", error && "text-red-500 opacity-100")}>{helperText}</span>
        {counter && <span className={cn("text-[10px]", counterError ? "text-red-500" : "opacity-40")}>{counter}</span>}
      </div>
    )}
  </div>
);

// Reusable Button component
const Button = ({ children, onClick, disabled, variant = 'outline', size = 'default', fullWidth, className }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "rounded-lg font-normal transition-colors flex items-center justify-center gap-2",
      size === 'small' ? "px-3 py-1.5 text-[12px]" : "px-4 py-2.5 text-[13px]",
      variant === 'primary'
        ? "bg-[#4285f4] text-white border border-[#4285f4] hover:bg-[#3b78e7]"
        : "bg-transparent text-[#4285f4] border border-[#4285f4]/20 hover:border-[#4285f4]/40 hover:bg-[#4285f4]/5",
      fullWidth && "w-full",
      disabled && "opacity-40 cursor-not-allowed",
      className
    )}
  >
    {children}
  </button>
);

// Alert component
const Alert = ({ severity = 'info', children, className }) => {
  const styles = {
    error: "border-red-500/20 bg-red-500/5 text-red-400",
    warning: "border-yellow-500/20 bg-yellow-500/5 text-yellow-500",
    success: "border-green-500/20 bg-green-500/5 text-green-400",
    info: "border-[#4285f4]/20 bg-[#4285f4]/5 text-[#4285f4]"
  };
  return (
    <div className={cn("px-3 py-2 rounded-lg border flex items-start gap-2 text-[12px]", styles[severity], className)}>
      {children}
    </div>
  );
};

// Spinner component
const Spinner = ({ size = 24 }) => (
  <Loader2 size={size} className="animate-spin text-[#4285f4]" />
);

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
    antiSnipe: false
  });
  const [fileName, setFileName] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [errors, setErrors] = useState({});
  const [dragging, setDragging] = useState(false);
  const [launchDialog, setLaunchDialog] = useState(false);
  const [launchStep, setLaunchStep] = useState('');
  const [sessionData, setSessionData] = useState(null);
  const [launchError, setLaunchError] = useState('');
  const [userWallet, setUserWallet] = useState('');
  const [launchLogs, setLaunchLogs] = useState([]);
  const [showDebugPanel, setShowDebugPanel] = useState(true);
  const [fundingBalance, setFundingBalance] = useState(0);
  const [fundingProgress, setFundingProgress] = useState(0);
  const [fundingAmount, setFundingAmount] = useState({ received: 0, required: 0 });
  const [checkClaimed, setCheckClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [decryptedSeed, setDecryptedSeed] = useState(null);
  const [costBreakdown, setCostBreakdown] = useState(null);
  const [loadingCost, setLoadingCost] = useState(false);

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
              const wallet = await walletStorage.findWalletBySocialId(walletId, storedPassword, accountProfile.account || accountProfile.address);

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
        // Device wallets always require password on-demand
        setDecryptedSeed(null);
      }
    };

    decryptSeed();
  }, [accountProfile]);

  // Fetch cost breakdown when ammXrpAmount or antiSnipe changes
  useEffect(() => {
    const fetchCost = async () => {
      if (formData.ammXrpAmount < 1) return;
      setLoadingCost(true);
      try {
        const res = await axios.get(`https://api.xrpl.to/api/launch-token/calculate-funding?ammXrpAmount=${formData.ammXrpAmount}&antiSnipe=${formData.antiSnipe}`);
        setCostBreakdown(res.data);
      } catch (e) {
        // Fallback to estimate
        setCostBreakdown(null);
      } finally {
        setLoadingCost(false);
      }
    };
    const timeout = setTimeout(fetchCost, 300); // Debounce
    return () => clearTimeout(timeout);
  }, [formData.ammXrpAmount, formData.antiSnipe]);

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
          const response = await axios.get(`https://api.xrpl.to/api/launch-token/status/${parsed.sessionId}`);
          const status = response.data;

          // Update to current step
          if (['success', 'completed'].includes(status.status)) {
            setLaunchStep('completed');
            setSessionData(prev => ({ ...prev, ...status }));
          } else if (['failed', 'funding_timeout'].includes(status.status)) {
            setLaunchStep('error');
            setLaunchError(status.error || 'Launch failed');
          } else if (['funded', 'configuring_issuer', 'creating_trustline', 'sending_tokens', 'creating_checks', 'creating_amm', 'scheduling_blackhole'].includes(status.status)) {
            setLaunchStep('processing');
            setSessionData(prev => ({ ...prev, ...status }));
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

    switch(field) {
      case 'tokenName':
        if (!value) newErrors.tokenName = 'Token name is required';
        else if (value.length > 50) newErrors.tokenName = 'Maximum 50 characters';
        else delete newErrors.tokenName;
        break;
      case 'ticker':
        if (!value) newErrors.ticker = 'Ticker is required';
        else if (value.length < 3 || value.length > 15) newErrors.ticker = '3-15 characters';
        else if (!/^[A-Z0-9]+$/i.test(value)) newErrors.ticker = 'Only letters and numbers';
        else if (value.toUpperCase() === 'XRP') newErrors.ticker = 'XRP is reserved';
        else delete newErrors.ticker;
        break;
      case 'description':
        if (value.length > 500) newErrors.description = 'Maximum 500 characters';
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
      value = parseInt(value) || 10;
    } else if (field === 'tokenSupply') {
      value = parseInt(value) || 1000000000;
    } else if (field === 'userCheckPercent') {
      value = Math.min(30, Math.max(0, parseInt(value) || 0));
    }

    setFormData(prev => ({
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
      setErrors(prev => ({ ...prev, file: 'Invalid file type. Use PNG, JPG, GIF, or WEBP' }));
      return;
    }

    if (file.size > maxSize) {
      setErrors(prev => ({ ...prev, file: 'File too large (max 15MB)' }));
      return;
    }

    setFileName(file.name);
    setFormData(prev => ({ ...prev, image: file }));
    setErrors(prev => {
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
    return formData.tokenName && formData.ticker && formData.tokenSupply > 0 && formData.ammXrpAmount >= 10 && !Object.keys(errors).length;
  };

  const getCompletionStatus = () => {
    const fields = [
      formData.tokenName,
      formData.ticker,
      formData.description,
      formData.twitter || formData.telegram || formData.website,
      formData.image
    ];
    return fields.filter(Boolean).length;
  };

  // Polling function to check funding status
  const checkFundingStatus = async (sessionId) => {
    try {
      const response = await axios.get(`https://api.xrpl.to/api/launch-token/status/${sessionId}`);
      return response.data;
    } catch (error) {
      return null;
    }
  };

  // Polling function to check launch status
  const pollLaunchStatus = async (sessionId) => {
    try {
      const response = await axios.get(`https://api.xrpl.to/api/launch-token/status/${sessionId}`);
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
      const walletAddress = accountProfile ? (accountProfile.account || accountProfile.address) : userWallet;

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
        payload.userCheckAmount = String(Math.floor(formData.tokenSupply * (formData.userCheckPercent / 100)));
      }
      if (formData.description) payload.description = formData.description;
      if (formData.website) payload.domain = formData.website.replace(/^https?:\/\//, '');
      if (formData.telegram) payload.telegram = formData.telegram;
      if (formData.twitter) payload.twitter = formData.twitter;
      if (imageData) payload.imageData = imageData;
      if (formData.antiSnipe) payload.antiSnipe = true;

      // Step 1: Initialize token launch
      const response = await axios.post('https://api.xrpl.to/api/launch-token', payload);

      // Extract the actual data from response
      const data = response.data.data || response.data;
      setSessionData(data);

      // Save to localStorage with form data
      localStorage.setItem('tokenLaunchSession', JSON.stringify({
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
      }));

      // Set required funding amount from API
      if (data.requiredFunding) {
        setFundingAmount({ received: 0, required: data.requiredFunding });
      }

      setLaunchStep('funding');
      window.scrollTo(0, 0);

    } catch (error) {
      const errorMsg = typeof error.response?.data?.error === 'string'
        ? error.response.data.error
        : error.response?.data?.error?.message || 'Failed to initialize token launch';
      setLaunchError(errorMsg);
      setLaunchStep('error');
    }
  };

  const handleContinueLaunch = async () => {
    if (!sessionData?.sessionId) return;

    // Use connected wallet or provided wallet address
    const walletAddress = userWallet || (accountProfile ? (accountProfile.account || accountProfile.address) : '');

    if (!walletAddress) {
      setLaunchError('Please connect a wallet or enter your wallet address');
      return;
    }

    setLaunchError('');

    try {
      // Send continue request with user address
      await axios.post('https://api.xrpl.to/api/launch-token/continue', {
        sessionId: sessionData.sessionId,
        userAddress: walletAddress
      });

    } catch (error) {
      const errorMsg = typeof error.response?.data?.error === 'string'
        ? error.response.data.error
        : error.response?.data?.error?.message || 'Failed to continue launch';
      setLaunchError(errorMsg);
      setLaunchStep('error');
    }
  };

  const fetchDebugInfo = async () => {
    try {
      const response = await axios.get('https://api.xrpl.to/api/launch-token/debug');
      return response.data;
    } catch (error) {
      return null;
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const openInExplorer = (address) => {
    window.open(`https://testnet.xrpl.org/accounts/${address}`, '_blank');
  };

  // Reset all state when closing
  const resetLaunchState = () => {
    localStorage.removeItem('tokenLaunchSession');
    setLaunchStep('');
    setLaunchError('');
    setLaunchLogs([]);
    setFundingProgress(0);
    setFundingAmount({ received: 0, required: 20 });
    setShowDebugPanel(true);
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
        const { currentBalance, requiredBalance, sufficient, partiallyFunded } = status.fundingStatus;

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
          setLaunchLogs(prev => [...prev, {
            timestamp: new Date().toISOString(),
            level: 'success',
            message: 'Funding complete! Waiting for backend to continue...'
          }]);
        }
      }

      // Check if status changed to processing/success/failed/completed
      if (['funded', 'configuring_issuer', 'creating_trustline', 'sending_tokens', 'creating_checks', 'creating_amm', 'scheduling_blackhole'].includes(status.status)) {
        // Backend is processing - transition to processing view
        if (launchStep === 'funding') {
          setLaunchStep('processing');
        }
      }

      if (['success', 'completed', 'failed', 'funding_timeout'].includes(status.status)) {
        clearInterval(pollInterval);
        if (status.status === 'success' || status.status === 'completed') {
          setLaunchStep('completed');
          setSessionData(prev => ({ ...prev, ...status }));
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
      setSessionData(prev => ({ ...prev, ...status }));

      // Check completion
      if (status.status === 'success' || status.status === 'completed') {
        clearInterval(pollInterval);
        setLaunchStep('completed');
        setSessionData(prev => ({ ...prev, ...status }));
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
              <span key={step} className={cn(
                "text-[11px] px-2 py-0.5 rounded",
                (i === 0 || (i === 1 && (formData.twitter || formData.telegram || formData.website)) || (i === 2 && formData.image))
                  ? "text-[#4285f4] bg-[#4285f4]/10" : "opacity-30"
              )}>{step}</span>
            ))}
          </div>
        </div>

        {/* Token Information */}
        <div className={cn("rounded-xl border p-4 mb-4", isDark ? "border-white/10" : "border-gray-200")}>
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
                counter={`${formData.ticker.length}/15`}
                counterError={formData.ticker.length < 3 || formData.ticker.length > 15}
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
              counter={`${formData.description.length}/500`}
              counterError={formData.description.length > 500}
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
                min={1}
              />
              <InputField
                label="Your allocation %"
                type="number"
                placeholder="0-30"
                value={formData.userCheckPercent === 0 ? '' : formData.userCheckPercent}
                onChange={handleInputChange('userCheckPercent')}
                helperText={formData.userCheckPercent > 0 ? `${Math.floor(formData.tokenSupply * (formData.userCheckPercent / 100)).toLocaleString()} tokens` : null}
                isDark={isDark}
                className="max-w-[140px]"
                min={0}
                max={30}
              />
            </div>

            {formData.userCheckPercent === 0 && (
              <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-[11px]", isDark ? "bg-yellow-500/10 text-yellow-400" : "bg-yellow-50 text-yellow-700")}>
                <Info size={14} className="flex-shrink-0" />
                <span>You'll receive <strong>0 tokens</strong>. Set allocation above to reserve some for yourself.</span>
              </div>
            )}
            <div className="flex items-center justify-end">
              <label className="flex items-center gap-2 cursor-pointer text-[12px]">
                <input
                  type="checkbox"
                  checked={formData.antiSnipe}
                  onChange={(e) => setFormData(prev => ({ ...prev, antiSnipe: e.target.checked }))}
                  className="w-3.5 h-3.5 rounded"
                />
                Anti-snipe
              </label>
            </div>
          </div>
        </div>

        {/* Liquidity + Social Links - Combined Row */}
        <div className="flex gap-4 mb-4">
          <div className={cn("rounded-xl border p-4 flex-1", isDark ? "border-white/10" : "border-gray-200")}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-[13px] font-normal">Initial Liquidity</h3>
              <span className="text-[10px] opacity-40">Required</span>
            </div>
            <InputField
              label="XRP for AMM pool"
              type="number"
              value={formData.ammXrpAmount}
              onChange={handleInputChange('ammXrpAmount')}
              error={formData.ammXrpAmount < 10}
              helperText={formData.ammXrpAmount < 10 ? 'Minimum 10 XRP' : null}
              isDark={isDark}
              min={10}
            />
          </div>

          {/* Social Links */}
          <div className={cn("rounded-xl border p-4 flex-[2]", isDark ? "border-white/10" : "border-gray-200")}>
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
        <div className={cn("rounded-xl border p-4 mb-4", isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-gray-50")}>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-[13px] font-normal">Cost Breakdown</h3>
            <span className="text-[13px] font-medium text-[#4285f4]">
              {loadingCost ? '...' : `~${costBreakdown?.requiredFunding || Math.ceil(9 + formData.ammXrpAmount)} XRP`}
            </span>
          </div>
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between opacity-60">
              <span>Platform fee</span><span>{costBreakdown?.breakdown?.platformFee || 5} XRP</span>
            </div>
            <div className="flex justify-between opacity-60">
              <span>Account reserves</span><span>{costBreakdown ? (costBreakdown.breakdown.issuerReserve + costBreakdown.breakdown.holderReserve + costBreakdown.breakdown.ownerReserves).toFixed(1) : '~2.4'} XRP</span>
            </div>
            <div className="flex justify-between opacity-60">
              <span>AMM liquidity</span><span>{costBreakdown?.breakdown?.ammLiquidity || formData.ammXrpAmount} XRP</span>
            </div>
            <div className="flex justify-between opacity-60">
              <span>Tx fees + buffer</span><span>{costBreakdown?.breakdown?.transactionFees || '~1.4'} XRP</span>
            </div>
          </div>
          <p className="text-[10px] opacity-40 mt-2">
            {costBreakdown?.antiSnipe && costBreakdown?.antiSnipeNote ? costBreakdown.antiSnipeNote : 'Excess XRP refunded after launch'}
          </p>
        </div>

        {/* Token Image */}
        <div className={cn("rounded-xl border p-4 mb-5", isDark ? "border-white/10" : "border-gray-200")}>
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
              "border border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
              dragging ? "border-[#4285f4] bg-[#4285f4]/5" : imagePreview ? "border-green-500/30" : isDark ? "border-white/15 hover:border-white/25" : "border-gray-300 hover:border-gray-400"
            )}
          >
            {imagePreview ? (
              <div className="flex items-center gap-3 justify-center">
                <img src={imagePreview} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />
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
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileInputChange} className="hidden" />
        </div>

        {/* Submit */}
        <Button
          fullWidth
          variant={isFormValid() ? 'primary' : 'outline'}
          disabled={!isFormValid()}
          onClick={handleSubmit}
        >
          {isFormValid() ? 'Launch Token' : `Complete ${4 - (formData.tokenName ? 1 : 0) - (formData.ticker ? 1 : 0) - (formData.tokenSupply > 0 ? 1 : 0) - (formData.ammXrpAmount >= 10 ? 1 : 0)} required fields`}
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

          <div className={cn("rounded-xl border overflow-hidden", isDark ? "border-white/10" : "border-gray-200")}>
            {/* Header */}
            <div className={cn("p-5 flex items-center gap-4", isDark ? "border-b border-white/10" : "border-b border-gray-200")}>
              {imagePreview && <img src={imagePreview} alt="Token" className="w-14 h-14 rounded-lg object-cover" />}
              <div>
                <h3 className="text-lg font-normal">{formData.tokenName}</h3>
                <span className="text-[13px] opacity-60">{formData.ticker}</span>
              </div>
            </div>

            {/* Details */}
            <div className="p-5 space-y-4">
              {formData.description && (
                <p className="text-[13px] opacity-70 leading-relaxed">{formData.description}</p>
              )}

              {/* Social Links */}
              {(formData.website || formData.twitter || formData.telegram) && (
                <div className="flex flex-wrap gap-3 text-[12px]">
                  {formData.website && <span className="flex items-center gap-1 opacity-60"><Globe size={12} /> {formData.website}</span>}
                  {formData.twitter && <span className="flex items-center gap-1 opacity-60"><Twitter size={12} /> {formData.twitter}</span>}
                  {formData.telegram && <span className="flex items-center gap-1 opacity-60"><Send size={12} /> {formData.telegram}</span>}
                </div>
              )}

              {/* Economics */}
              <div className={cn("p-4 rounded-lg space-y-2 text-[13px]", isDark ? "bg-white/5" : "bg-gray-50")}>
                <div className="flex justify-between"><span className="opacity-60">Supply</span><span>{formData.tokenSupply.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="opacity-60">AMM Liquidity</span><span>{formData.ammXrpAmount} XRP</span></div>
                <div className="flex justify-between">
                  <span className="opacity-60">Your Allocation</span>
                  <span className={formData.userCheckPercent > 0 ? "text-green-500" : "opacity-50"}>
                    {formData.userCheckPercent > 0 ? `${formData.userCheckPercent}% (${Math.floor(formData.tokenSupply * (formData.userCheckPercent / 100)).toLocaleString()})` : 'None'}
                  </span>
                </div>
              </div>

              {formData.userCheckPercent === 0 && <Alert severity="warning">100% goes to AMM pool</Alert>}
              {formData.antiSnipe && <Alert severity="info"><Info size={14} /> Anti-snipe enabled</Alert>}

              {/* Wallet Address */}
              <div className={cn("p-4 rounded-lg", isDark ? "bg-white/5" : "bg-gray-50")}>
                <p className="text-[12px] opacity-60 mb-2">Your wallet address (required)</p>
                <div className="flex items-center gap-2">
                  {accountProfile && <CheckCircle size={14} className="text-green-500 flex-shrink-0" />}
                  <input
                    type="text"
                    placeholder="rXXX..."
                    value={userWallet || (accountProfile ? (accountProfile.account || accountProfile.address) : '')}
                    onChange={(e) => setUserWallet(e.target.value)}
                    disabled={!!accountProfile}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-lg border text-[13px] bg-transparent",
                      isDark ? "border-white/10" : "border-gray-200"
                    )}
                  />
                </div>
                <p className="text-[11px] opacity-40 mt-1">
                  {accountProfile ? "Connected wallet" : "Enter your XRPL address to receive tokens"}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className={cn("p-5 flex gap-3", isDark ? "border-t border-white/10" : "border-t border-gray-200")}>
              <Button fullWidth onClick={() => setShowSummary(false)}>Edit</Button>
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
          <h2 className="text-lg font-normal mb-3">
            {launchStep === 'initializing' && 'Initializing...'}
            {launchStep === 'funding' && 'Fund Issuer'}
            {launchStep === 'processing' && 'Creating Token'}
            {launchStep === 'completed' && 'Launch Complete'}
            {launchStep === 'error' && 'Launch Failed'}
          </h2>

          <div className={cn("rounded-xl border p-4", isDark ? "border-white/10" : "border-gray-200")}>
          {launchStep === 'initializing' && (
            <div className="text-center py-8">
              <Spinner />
              <p className="mt-4 text-[13px] opacity-60">Setting up...</p>
            </div>
          )}

          {launchStep === 'funding' && sessionData && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[12px]">
                <span className={fundingProgress === 100 ? 'text-green-500' : 'text-yellow-500'}>
                  {fundingProgress === 100 ? 'Funded!' : 'Awaiting funding'}
                </span>
                <span className="opacity-60">{fundingBalance} / {fundingAmount.required} XRP</span>
              </div>
              <div className={cn("h-1.5 rounded-full overflow-hidden", isDark ? "bg-white/10" : "bg-gray-200")}>
                <div className="h-full bg-[#4285f4] transition-all" style={{ width: `${fundingProgress}%` }} />
              </div>

              <div className={cn("p-3 rounded-lg space-y-3", isDark ? "bg-white/5" : "bg-gray-50")}>
                <div>
                  <p className="text-[11px] opacity-50 mb-1">Fund this address:</p>
                  <div className="flex items-center gap-2">
                    <code className={cn("flex-1 p-2 rounded text-[11px] font-mono truncate", isDark ? "bg-black/30" : "bg-white")}>
                      {sessionData?.issuerAddress || 'Loading...'}
                    </code>
                    {sessionData?.issuerAddress && (
                      <Button size="small" onClick={() => { navigator.clipboard.writeText(sessionData.issuerAddress); openSnackbar?.('Copied!', 'success'); }}>
                        <Copy size={14} />
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] opacity-50 mb-1">Your wallet: {accountProfile && <span className="text-green-500">Connected</span>}</p>
                  <div className="flex items-center gap-2">
                    {accountProfile && <CheckCircle size={14} className="text-green-500" />}
                    <input
                      type="text"
                      placeholder="rXXX..."
                      value={userWallet || (accountProfile ? (accountProfile.account || accountProfile.address) : '')}
                      onChange={(e) => setUserWallet(e.target.value)}
                      disabled={!!accountProfile}
                      className={cn("flex-1 px-2 py-1.5 rounded-lg border text-[12px] bg-transparent", isDark ? "border-white/10" : "border-gray-200")}
                    />
                  </div>
                </div>
              </div>

              <Button
                fullWidth
                onClick={async () => {
                  if (!sessionData?.sessionId) return;
                  try {
                    const walletAddress = userWallet || accountProfile?.account || accountProfile?.address;
                    await axios.delete(`https://api.xrpl.to/api/launch-token/${sessionData.sessionId}`, {
                      data: { refundAddress: walletAddress }
                    });
                    openSnackbar?.('Launch cancelled', 'success');
                  } catch (error) {
                    openSnackbar?.(error.response?.data?.error || 'Cancel failed', 'error');
                  }
                  resetLaunchState();
                }}
              >
                Cancel
              </Button>
            </div>
          )}

          {launchStep === 'processing' && (
            <div className="space-y-4">
              <div className="text-center py-6">
                <Spinner />
                <p className="mt-3 text-[14px]">Processing...</p>
                <p className="text-[12px] opacity-50">This may take a moment</p>
              </div>

              {sessionData?.status && (
                <Alert severity="info">
                  <Info size={14} />
                  {sessionData.status === 'funded' ? 'Starting launch...' :
                   sessionData.status === 'configuring_issuer' ? 'Configuring issuer...' :
                   sessionData.status === 'creating_trustline' ? 'Creating trustline...' :
                   sessionData.status === 'sending_tokens' ? 'Minting tokens...' :
                   sessionData.status === 'creating_checks' ? 'Creating check...' :
                   sessionData.status === 'creating_amm' ? 'Creating AMM...' :
                   sessionData.status === 'scheduling_blackhole' ? 'Finalizing...' : 'Processing...'}
                </Alert>
              )}

              {launchLogs.some(log => log.message?.includes('Insufficient')) && (
                <Alert severity="error">Insufficient funding - add more XRP</Alert>
              )}

              <button onClick={() => setShowDebugPanel(!showDebugPanel)} className="text-[12px] text-[#4285f4] w-full">
                {showDebugPanel ? 'Hide' : 'Show'} logs ({launchLogs.length})
              </button>

              {showDebugPanel && launchLogs.length > 0 && (
                <div className={cn("p-3 max-h-[200px] overflow-auto rounded-lg font-mono text-[10px]", isDark ? "bg-black/50" : "bg-gray-100")}>
                  {launchLogs.map((log, idx) => (
                    <div key={idx} className={cn(
                      log.level === 'error' ? 'text-red-500' :
                      log.level === 'warn' ? 'text-yellow-500' :
                      log.level === 'success' ? 'text-green-500' : 'opacity-70'
                    )}>
                      [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {launchStep === 'completed' && sessionData && (
            <div className="space-y-4">
              <Alert severity="success">
                <CheckCircle size={14} />
                Token launched on XRPL Testnet!
              </Alert>

              <div className={cn("p-4 rounded-lg space-y-2 text-[13px]", isDark ? "bg-white/5" : "bg-gray-50")}>
                <div className="flex justify-between"><span className="opacity-60">Token</span><span>{formData.tokenName} ({formData.ticker})</span></div>
                <div className="flex justify-between"><span className="opacity-60">Supply</span><span>{formData.tokenSupply.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="opacity-60">AMM Pool</span><span>{formData.ammXrpAmount} XRP</span></div>
              </div>

              {(sessionData.data?.userCheckId || sessionData.userCheckId) && (
                <div className={cn("p-4 rounded-lg border", checkClaimed ? "border-green-500/20 bg-green-500/5" : "border-[#4285f4]/20 bg-[#4285f4]/5")}>
                  <p className="text-[14px] font-medium mb-2">{checkClaimed ? 'Claimed' : 'Claim Tokens'}</p>
                  <p className="text-[12px] opacity-70 mb-3">
                    {checkClaimed
                      ? `Claimed ${Math.floor(formData.tokenSupply * (formData.userCheckPercent / 100)).toLocaleString()} ${formData.ticker}`
                      : `${Math.floor(formData.tokenSupply * (formData.userCheckPercent / 100)).toLocaleString()} ${formData.ticker} available`
                    }
                  </p>
                  {!checkClaimed && (
                    <Alert severity="info" className="mb-3">
                      <Info size={14} />
                      {accountProfile ? 'Sign a CheckCash transaction to claim' : 'Connect wallet to claim'}
                    </Alert>
                  )}
                  {checkClaimed && <Alert severity="success"><CheckCircle size={14} /> Tokens claimed!</Alert>}
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
                      try {
                        const ticker = formData.ticker || sessionData.currencyCode || sessionData.data?.currencyCode;
                        const supply = formData.tokenSupply || sessionData.tokenSupply || sessionData.data?.tokenSupply;
                        const checkPercent = formData.userCheckPercent || sessionData.userCheckPercent || sessionData.data?.userCheckPercent || 0;
                        if (!ticker) {
                          openSnackbar?.('Currency code not found', 'error');
                          setClaiming(false);
                          return;
                        }
                        let wallet;
                        const walletStorage = new UnifiedWalletStorage();
                        if (accountProfile.seed) {
                          wallet = xrpl.Wallet.fromSeed(accountProfile.seed);
                        } else if (accountProfile.wallet_type === 'oauth' || accountProfile.wallet_type === 'social') {
                          const password = prompt('Enter wallet password:');
                          if (!password) { setClaiming(false); return; }
                          const walletId = `${accountProfile.provider}_${accountProfile.provider_id}`;
                          const walletData = await walletStorage.findWalletBySocialId(walletId, password);
                          if (!walletData?.seed) { openSnackbar?.('Incorrect password', 'error'); setClaiming(false); return; }
                          wallet = xrpl.Wallet.fromSeed(walletData.seed);
                        } else if (accountProfile.wallet_type === 'device') {
                          const password = prompt('Enter wallet password:');
                          if (!password) { setClaiming(false); return; }
                          const wallets = await walletStorage.getWallets(password);
                          const walletData = wallets.find(w => w.address === accountProfile.account);
                          if (!walletData?.seed) { openSnackbar?.('Incorrect password', 'error'); setClaiming(false); return; }
                          wallet = xrpl.Wallet.fromSeed(walletData.seed);
                        } else {
                          openSnackbar?.('Wallet type not supported', 'error');
                          setClaiming(false);
                          return;
                        }
                        const client = new xrpl.Client('wss://s.altnet.rippletest.net:51233');
                        await client.connect();
                        const checkCashTx = {
                          TransactionType: 'CheckCash',
                          Account: wallet.address,
                          CheckID: sessionData.data?.userCheckId || sessionData.userCheckId,
                          Amount: {
                            currency: ticker.length === 3 ? ticker : xrpl.convertStringToHex(ticker).padEnd(40, '0'),
                            issuer: sessionData.issuerAddress || sessionData.data?.issuer,
                            value: String(Math.floor(supply * (checkPercent / 100)))
                          }
                        };
                        const tx = await client.submitAndWait(checkCashTx, { autofill: true, wallet });
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
                      }
                    }}
                    className="mt-2"
                  >
                    {claiming ? 'Claiming...' : checkClaimed ? 'Claimed' : accountProfile ? 'Claim Tokens' : 'Connect Wallet'}
                  </Button>
                  <p className="text-[10px] opacity-40 mt-2">ID: {(sessionData.data?.userCheckId || sessionData.userCheckId)?.substring(0, 16)}...</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button size="small" fullWidth onClick={() => openInExplorer(sessionData.issuerAddress)}>Issuer <ExternalLink size={12} /></Button>
                <Button size="small" fullWidth onClick={() => openInExplorer(sessionData.ammAddress)}>AMM <ExternalLink size={12} /></Button>
              </div>

              <Button variant="primary" fullWidth onClick={() => {
                resetLaunchState();
                setFormData({ tokenName: '', ticker: '', description: '', twitter: '', telegram: '', website: '', image: null, ammXrpAmount: 10, tokenSupply: 1000000000, userCheckPercent: 0, antiSnipe: false });
                setFileName('');
                setImagePreview('');
              }}>
                Done
              </Button>
            </div>
          )}

          {launchStep === 'error' && (
            <div className="space-y-4">
              <Alert severity="error">{launchError || 'An error occurred'}</Alert>
              {launchLogs.length > 0 && (
                <div className={cn("p-3 max-h-[200px] overflow-auto rounded-lg font-mono text-[10px]", isDark ? "bg-black/30" : "bg-gray-100")}>
                  {launchLogs.map((log, idx) => (
                    <div key={idx} className={cn(log.level === 'error' ? 'text-red-500' : log.level === 'warn' ? 'text-yellow-500' : 'opacity-60')}>
                      [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
                    </div>
                  ))}
                </div>
              )}
              <Button fullWidth onClick={resetLaunchState}>Close</Button>
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