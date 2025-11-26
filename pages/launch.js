import React, { useState, useRef, useContext, useEffect } from 'react';
import styled from '@emotion/styled';
import axios from 'axios';
import * as xrpl from 'xrpl';
import { AppContext } from 'src/AppContext';
import { ConnectWallet } from 'src/components/Wallet';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import { UnifiedWalletStorage } from 'src/utils/encryptedWalletStorage';
import { cn } from 'src/utils/cn';
import { Twitter, Send, Globe, Upload, CheckCircle, Info, Copy, ExternalLink, Wallet as WalletIcon } from 'lucide-react';

// Styled components
const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Container = styled.div`
  max-width: 700px;
  margin: 0 auto;
  padding: 40px 24px;
  width: 100%;
  flex: 1;
`;

const PageTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 400;
  margin-bottom: 6px;
`;

const Subtitle = styled.p`
  font-size: 0.88rem;
  opacity: 0.6;
  margin-bottom: 28px;
`;

const ProgressContainer = styled.div`
  margin-bottom: 24px;
`;

const StepIndicator = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const Step = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: ${props => props.active ? '#4285f4' : 'rgba(150, 150, 150, 0.4)'};
  font-weight: 400;
`;

const Card = styled.div`
  padding: 20px;
  background: transparent;
  border: 1.5px solid rgba(150, 150, 150, 0.15);
  border-radius: 12px;
  margin-bottom: 14px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const SectionTitle = styled.h3`
  font-size: 0.95rem;
  font-weight: 400;
`;

const Label = styled.label`
  display: block;
  font-size: 0.95rem;
  font-weight: 400;
  opacity: 0.7;
  margin-bottom: 8px;
`;

const UploadBox = styled.div`
  border: 1.5px dashed ${props => props.hasFile ? 'rgba(16, 185, 129, 0.4)' : 'rgba(150, 150, 150, 0.25)'};
  border-radius: 12px;
  padding: 36px 20px;
  text-align: center;
  cursor: pointer;
  background: transparent;
  position: relative;

  &:hover {
    border-color: ${props => props.hasFile ? 'rgba(16, 185, 129, 0.6)' : 'rgba(66, 133, 244, 0.4)'};
    background: rgba(66, 133, 244, 0.02);
  }

  &.dragging {
    border-color: #4285f4;
    background: rgba(66, 133, 244, 0.04);
  }
`;

const ImagePreview = styled.img`
  max-width: 120px;
  max-height: 120px;
  border-radius: 8px;
  margin-bottom: 12px;
  object-fit: cover;
`;

const HiddenInput = styled.input`
  display: none;
`;

const InfoText = styled.div`
  font-size: 0.85rem;
  opacity: 0.7;
  margin-top: 12px;
  line-height: 1.5;
`;

const WarningBox = styled.div`
  background: rgba(245, 158, 11, 0.08);
  border: 1.5px solid rgba(245, 158, 11, 0.3);
  border-radius: 8px;
  padding: 16px;
  margin-top: 24px;
`;

const WarningText = styled.p`
  font-size: 0.9rem;
  color: #f59e0b;
  margin: 0;
  font-weight: 400;
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  font-size: 0.92rem;
  border-radius: 8px;
  border: 1.5px solid ${props => props.error ? '#ef4444' : 'rgba(150, 150, 150, 0.15)'};
  background: transparent;
  font-family: inherit;

  &:hover {
    border-color: ${props => props.error ? '#ef4444' : 'rgba(150, 150, 150, 0.25)'};
  }

  &:focus {
    outline: none;
    border-color: ${props => props.error ? '#ef4444' : '#4285f4'};
  }

  &::placeholder {
    opacity: 0.5;
  }
`;

const StyledTextarea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  font-size: 0.92rem;
  border-radius: 8px;
  border: 1.5px solid ${props => props.error ? '#ef4444' : 'rgba(150, 150, 150, 0.15)'};
  background: transparent;
  font-family: inherit;
  resize: vertical;

  &:hover {
    border-color: ${props => props.error ? '#ef4444' : 'rgba(150, 150, 150, 0.25)'};
  }

  &:focus {
    outline: none;
    border-color: ${props => props.error ? '#ef4444' : '#4285f4'};
  }

  &::placeholder {
    opacity: 0.5;
  }
`;

const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const InputLabel = styled.label`
  font-size: 0.92rem;
  opacity: 0.7;
`;

const HelperText = styled.div`
  font-size: 0.75rem;
  margin-top: 4px;
  opacity: 0.7;
  color: ${props => props.error ? '#ef4444' : 'inherit'};
`;

const CharCounter = styled.span`
  font-size: 0.75rem;
  color: ${props => props.error ? '#ef4444' : 'rgba(150, 150, 150, 0.5)'};
`;

const StyledButton = styled.button`
  padding: ${props => props.size === 'small' ? '6px 12px' : '12px 24px'};
  font-size: ${props => props.size === 'small' ? '13px' : '15px'};
  font-weight: 400;
  border-radius: ${props => props.size === 'small' ? '8px' : '12px'};
  border: 1.5px solid ${props => props.variant === 'contained' ? '#4285f4' : 'rgba(66, 133, 244, 0.2)'};
  background: ${props => props.variant === 'contained' ? '#4285f4' : 'transparent'};
  color: ${props => props.variant === 'contained' ? '#fff' : '#4285f4'};
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: ${props => props.fullWidth ? '100%' : 'auto'};

  &:hover:not(:disabled) {
    background: ${props => props.variant === 'contained' ? '#3367d6' : 'rgba(66, 133, 244, 0.04)'};
    border-color: #4285f4;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const AlertBox = styled.div`
  padding: 12px 16px;
  border-radius: 8px;
  border: 1.5px solid ${props =>
    props.severity === 'error' ? 'rgba(239, 68, 68, 0.3)' :
    props.severity === 'warning' ? 'rgba(245, 158, 11, 0.3)' :
    props.severity === 'success' ? 'rgba(16, 185, 129, 0.3)' :
    'rgba(66, 133, 244, 0.3)'
  };
  background: ${props =>
    props.severity === 'error' ? 'rgba(239, 68, 68, 0.08)' :
    props.severity === 'warning' ? 'rgba(245, 158, 11, 0.08)' :
    props.severity === 'success' ? 'rgba(16, 185, 129, 0.08)' :
    'rgba(66, 133, 244, 0.08)'
  };
  color: ${props =>
    props.severity === 'error' ? '#ef4444' :
    props.severity === 'warning' ? '#f59e0b' :
    props.severity === 'success' ? '#10b981' :
    '#4285f4'
  };
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 14px;
`;

const ProgressBar = styled.div`
  height: ${props => props.height || '3px'};
  background: rgba(150, 150, 150, 0.2);
  border-radius: 2px;
  overflow: hidden;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${props => props.value || 0}%;
    background: #4285f4;
    transition: width 0.3s ease;
  }
`;

const Spinner = styled.div`
  width: ${props => props.size === 'small' ? '16px' : '24px'};
  height: ${props => props.size === 'small' ? '16px' : '24px'};
  border: 2px solid rgba(66, 133, 244, 0.2);
  border-top-color: #4285f4;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

// Simple InputField component
const InputField = ({ label, value, onChange, placeholder, error, helperText, counter, counterError, isDark, multiline, rows, type = 'text', min, max, className, required }) => (
  <div className={cn("flex-1", className)}>
    <label className="block text-[13px] opacity-70 mb-2">{label}</label>
    {multiline ? (
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows || 3}
        className={cn(
          "w-full px-3 py-2 rounded-lg border-[1.5px] text-[14px] bg-transparent resize-none",
          error ? "border-red-500/50" : isDark ? "border-white/15" : "border-gray-300",
          "focus:outline-none focus:border-[#4285f4]"
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
          "w-full px-3 py-2 rounded-lg border-[1.5px] text-[14px] bg-transparent",
          error ? "border-red-500/50" : isDark ? "border-white/15" : "border-gray-300",
          "focus:outline-none focus:border-[#4285f4]"
        )}
      />
    )}
    <div className="flex justify-between mt-1">
      <span className={cn("text-[12px] opacity-70", error && "text-red-500")}>{helperText}</span>
      {counter && <span className={cn("text-[12px]", counterError ? "text-red-500" : "opacity-50")}>{counter}</span>}
    </div>
  </div>
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

  // Decrypt seed on mount if OAuth wallet
  useEffect(() => {
    const decryptSeed = async () => {
      console.log('[DEBUG] Decrypt seed effect triggered', {
        hasProfile: !!accountProfile,
        walletType: accountProfile?.wallet_type,
        provider: accountProfile?.provider,
        providerId: accountProfile?.provider_id,
        hasSeedInProfile: !!accountProfile?.seed
      });

      if (!accountProfile) {
        setDecryptedSeed(null);
        return;
      }

      if (accountProfile.seed) {
        console.log('[DEBUG] Seed already in profile');
        setDecryptedSeed(accountProfile.seed);
        return;
      }

      if (accountProfile.wallet_type === 'oauth' || accountProfile.wallet_type === 'social') {
        try {
          const walletStorage = new UnifiedWalletStorage();
          const walletId = `${accountProfile.provider}_${accountProfile.provider_id}`;
          console.log('[DEBUG] Looking for wallet with ID:', walletId);

          const storedPassword = await walletStorage.getSecureItem(`wallet_pwd_${walletId}`);
          console.log('[DEBUG] Stored password found:', !!storedPassword);

          if (storedPassword) {
            console.log('[DEBUG] Attempting to decrypt wallet...');
            try {
              // Pass known address for fast lookup (only decrypts 1 wallet instead of 25!)
              const wallet = await walletStorage.findWalletBySocialId(walletId, storedPassword, accountProfile.account || accountProfile.address);
              console.log('[DEBUG] Wallet decrypted:', {
                found: !!wallet,
                hasSeed: !!wallet?.seed,
                address: wallet?.address
              });

              if (wallet?.seed) {
                setDecryptedSeed(wallet.seed);
                console.log('[DEBUG] ✅ Seed decrypted successfully');
              } else {
                console.log('[DEBUG] ❌ Wallet found but no seed');
              }
            } catch (walletError) {
              console.error('[DEBUG] ❌ Failed to decrypt wallet with stored password:', walletError);
              // Password exists but decryption failed - likely device fingerprint changed
              // Don't set decryptedSeed, user will need to use the manual "Decrypt" button
            }
          } else {
            console.log('[DEBUG] ❌ No stored password found for key:', `wallet_pwd_${walletId}`);
            console.log('[DEBUG] 💡 User may need to re-login to restore password');
          }
        } catch (error) {
          console.error('[DEBUG] ❌ Failed to decrypt seed:', error);
          console.error('[DEBUG] Error details:', {
            message: error.message,
            stack: error.stack
          });
        }
      } else if (accountProfile.wallet_type === 'device') {
        console.log('[DEBUG] Device wallet - seed requires password prompt');
        // Device wallets always require password on-demand
        setDecryptedSeed(null);
      } else {
        console.log('[DEBUG] Unknown wallet type:', accountProfile.wallet_type);
      }
    };

    decryptSeed();
  }, [accountProfile]);

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
      console.error('Failed to check funding status:', error);
      return null;
    }
  };

  // Polling function to check launch status
  const pollLaunchStatus = async (sessionId) => {
    try {
      const response = await axios.get(`https://api.xrpl.to/api/launch-token/status/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to poll launch status:', error);
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
          console.error('[ERROR] Failed to convert image to base64:', error);
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

      // Conditionally required
      if (walletAddress) {
        payload.userAddress = walletAddress;
      }

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

      console.log('[DEBUG] Launch payload:', { ...payload, imageData: imageData ? `${imageData.substring(0, 50)}...` : null });

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

    } catch (error) {
      console.error('Launch error:', error);
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
      const response = await axios.post('https://api.xrpl.to/api/launch-token/continue', {
        sessionId: sessionData.sessionId,
        userAddress: walletAddress
      });

      console.log('Continue request sent');

    } catch (error) {
      console.error('Continue error:', error);
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
      console.error('Failed to fetch debug info:', error);
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
    console.log('[DEBUG] Resetting launch state');
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
      console.log('[POLL] Checking funding status for session:', sessionData.sessionId);
      const status = await checkFundingStatus(sessionData.sessionId);

      if (!status) {
        console.log('[POLL] No status received');
        return;
      }

      console.log('[POLL] Status received:', status);

      // Update logs if available
      if (status.logs && status.logs.length > 0) {
        console.log('[POLL] Updating logs, count:', status.logs.length);
        setLaunchLogs(status.logs);
      }

      // Check funding status
      if (status.fundingStatus) {
        const { currentBalance, requiredBalance, sufficient, partiallyFunded, message } = status.fundingStatus;

        console.log('[POLL] Funding status:', {
          currentBalance,
          requiredBalance,
          sufficient,
          partiallyFunded,
          message
        });

        // Update balance states
        setFundingBalance(currentBalance);
        setFundingAmount({ received: currentBalance, required: requiredBalance });

        if (partiallyFunded && !sufficient) {
          // Partial funding - show warning
          const progress = (currentBalance / requiredBalance) * 100;
          setFundingProgress(progress);
          console.log('[POLL] Partial funding detected:', currentBalance, '/', requiredBalance, 'XRP (', Math.round(progress), '%)');
        } else if (sufficient) {
          // Fully funded - just show progress, backend handles continuation
          console.log('[POLL] ✅ Fully funded! Backend will continue automatically...');
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
          console.log('[POLL] Status changed to processing:', status.status);
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
    <PageWrapper>
      <Header />
      <h1 style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
        Launch Token on XRPL
      </h1>

      {!launchStep && !showSummary && (
      <Container>
        <PageTitle>Launch Token</PageTitle>
        <Subtitle>Deploy your token on the XRP Ledger</Subtitle>

        <ProgressContainer>
          <StepIndicator>
            <Step active={true}>
              <span>1. Basic Info</span>
            </Step>
            <Step active={formData.twitter || formData.telegram || formData.website}>
              <span>2. Socials</span>
            </Step>
            <Step active={formData.image}>
              <span>3. Media</span>
            </Step>
          </StepIndicator>
          <div className="h-[3px] w-full bg-gray-200/20 relative">
            <div
              className="h-full bg-[#4285f4] transition-all"
              style={{ width: `${(getCompletionStatus() / 5) * 100}%` }}
            />
          </div>
        </ProgressContainer>

        <Card>
          <SectionHeader>
            <SectionTitle>Token Information</SectionTitle>
            <span className="text-[12px] opacity-50">Required</span>
          </SectionHeader>

          <div className="space-y-4">
            <div className="flex gap-4">
              <InputField
                label="Name your token"
                placeholder="My Awesome Token"
                value={formData.tokenName}
                onChange={handleInputChange('tokenName')}
                error={errors.tokenName}
                helperText={errors.tokenName || 'Required'}
                counter={`${formData.tokenName.length}/50`}
                counterError={formData.tokenName.length > 50}
                isDark={isDark}
                required
              />
              <InputField
                label="Token ticker"
                placeholder="TICKER"
                value={formData.ticker}
                onChange={handleInputChange('ticker')}
                error={errors.ticker}
                helperText={errors.ticker || 'Required'}
                counter={`${formData.ticker.length}/15`}
                counterError={formData.ticker.length < 3 || formData.ticker.length > 15}
                isDark={isDark}
                className="min-w-[200px]"
                required
              />
            </div>

            <InputField
              label="Write a short description"
              placeholder="Tell people what makes your token special..."
              value={formData.description}
              onChange={handleInputChange('description')}
              error={errors.description}
              helperText={errors.description || 'Optional'}
              counter={`${formData.description.length}/500`}
              counterError={formData.description.length > 500}
              isDark={isDark}
              multiline
              rows={3}
            />

            <div className="flex gap-4">
              <InputField
                label="Total supply"
                type="number"
                placeholder="1000000000"
                value={formData.tokenSupply}
                onChange={handleInputChange('tokenSupply')}
                helperText="Required"
                isDark={isDark}
                min={1}
                required
              />
              <InputField
                label="Creator allocation (%)"
                type="number"
                placeholder="0-30"
                value={formData.userCheckPercent === 0 ? '' : formData.userCheckPercent}
                onChange={handleInputChange('userCheckPercent')}
                helperText={`You receive: ${Math.floor(formData.tokenSupply * (formData.userCheckPercent / 100)).toLocaleString()} tokens`}
                isDark={isDark}
                className="min-w-[220px]"
                min={0}
                max={30}
              />
            </div>

            {formData.userCheckPercent === 0 && (
              <div className="mt-2 p-3 rounded-lg border-[1.5px] border-yellow-500/20 bg-yellow-500/5 text-[14px]">
                You will not receive any tokens. 100% goes to AMM pool.
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="antiSnipe"
                checked={formData.antiSnipe}
                onChange={(e) => setFormData(prev => ({ ...prev, antiSnipe: e.target.checked }))}
                className="w-[18px] h-[18px] cursor-pointer"
              />
              <label htmlFor="antiSnipe" className="cursor-pointer text-[15px]">
                Enable anti-snipe mode (RequireAuth)
              </label>
            </div>
          </div>
        </Card>

        <Card>
          <SectionHeader>
            <SectionTitle>Initial Liquidity</SectionTitle>
            <span className="text-[12px] opacity-50">Required</span>
          </SectionHeader>

          <InputField
            label="XRP for AMM pool (min 10)"
            type="number"
            value={formData.ammXrpAmount}
            onChange={handleInputChange('ammXrpAmount')}
            error={formData.ammXrpAmount < 10}
            helperText={formData.ammXrpAmount < 10 ? 'Minimum 10 XRP' : 'Required'}
            isDark={isDark}
            min={10}
          />
        </Card>

        <Card>
          <SectionHeader>
            <SectionTitle>Social Links</SectionTitle>
            <span className="text-[12px] opacity-50">Optional</span>
          </SectionHeader>

          <div className="space-y-4">
            <InputField
              label="Website"
              placeholder="https://example.com"
              value={formData.website}
              onChange={handleInputChange('website')}
              error={errors.website}
              helperText={errors.website || 'Optional'}
              isDark={isDark}
            />

            <div className="flex gap-4">
              <InputField
                label="Telegram"
                placeholder="t.me/yourchannel"
                value={formData.telegram}
                onChange={handleInputChange('telegram')}
                helperText="Optional"
                isDark={isDark}
              />
              <InputField
                label="Twitter/X"
                placeholder="@yourhandle"
                value={formData.twitter}
                onChange={handleInputChange('twitter')}
                helperText="Optional"
                isDark={isDark}
              />
            </div>
          </div>
        </Card>

        <Card>
          <SectionHeader>
            <SectionTitle>Token Image</SectionTitle>
            <span className="text-[12px] opacity-50">Recommended</span>
          </SectionHeader>

          <UploadBox
              hasFile={!!formData.image}
              className={dragging ? 'dragging' : ''}
              onClick={handleUploadClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {imagePreview ? (
                <>
                  <ImagePreview src={imagePreview} alt="Preview" />
                  <p className="text-green-500 font-normal">{fileName}</p>
                  <p className="text-[13px] opacity-60 mt-1">Click to replace</p>
                </>
              ) : (
                <>
                  <Upload size={38} className="opacity-20 mb-4" />
                  <p className="text-[14px] opacity-70 mb-1">{fileName || 'Drop image here or click to browse'}</p>
                  <p className="text-[13px] opacity-40">PNG, JPG, GIF, WEBP • Max 15MB</p>
                </>
              )}
            </UploadBox>

          {errors.file && (
            <p className="text-red-500 text-[12px] mt-2">{errors.file}</p>
          )}

          <HiddenInput
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.gif,.png,.webp,image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileInputChange}
          />

          <p className="text-[12px] opacity-50 mt-3 leading-relaxed">
            PNG, JPG, GIF, WEBP • 1000×1000px recommended • Max 15MB
          </p>
        </Card>

        {!launchStep && (
          <StyledButton
            fullWidth
            disabled={!isFormValid()}
            onClick={handleSubmit}
          >
            {isFormValid() ? 'Launch Token' : `Complete Required Fields (${4 - (formData.tokenName ? 1 : 0) - (formData.ticker ? 1 : 0) - (formData.tokenSupply > 0 ? 1 : 0) - (formData.ammXrpAmount >= 10 ? 1 : 0)} remaining)`}
          </StyledButton>
        )}
      </Container>
      )}

      {/* Summary Confirmation */}
      {showSummary && (
        <Container>
          <PageTitle>Review Token Details</PageTitle>
          <Subtitle>Confirm your token settings before launch</Subtitle>

          <Card>
            {/* Header with Image */}
            {imagePreview && (
              <div className="text-center p-6 border-b border-white/10">
                <img
                  src={imagePreview}
                  alt="Token"
                  className="max-w-[160px] max-h-[160px] rounded-xl border-[1.5px] border-white/10 mx-auto"
                />
              </div>
            )}

            {/* Token Info Grid */}
            <div className="p-6 space-y-5">
              {/* Name & Ticker Row */}
              <div className="flex gap-6">
                <div className="flex-1">
                  <p className="text-[11px] uppercase tracking-wide opacity-70">Token Name</p>
                  <p className="text-lg mt-1">{formData.tokenName}</p>
                </div>
                <div className="flex-1">
                  <p className="text-[11px] uppercase tracking-wide opacity-70">Ticker</p>
                  <p className="text-lg mt-1">{formData.ticker}</p>
                </div>
              </div>

              {/* Description */}
              {formData.description && (
                <div className="p-4 rounded-lg border-[1.5px] border-white/10">
                  <p className="text-[11px] uppercase tracking-wide opacity-70">Description</p>
                  <p className="text-[14px] mt-2 leading-relaxed">{formData.description}</p>
                </div>
              )}

              {/* Social Links */}
              {(formData.website || formData.twitter || formData.telegram) && (
                <div className="p-4 rounded-lg border-[1.5px] border-blue-500/15 bg-blue-500/5">
                  <p className="text-[11px] uppercase tracking-wide opacity-70 mb-2">Social Links</p>
                  <div className="space-y-2">
                    {formData.website && (
                      <div className="flex items-center gap-2">
                        <Globe size={16} className="opacity-50" />
                        <span className="text-[14px]">{formData.website}</span>
                      </div>
                    )}
                    {formData.twitter && (
                      <div className="flex items-center gap-2">
                        <Twitter size={16} className="opacity-50" />
                        <span className="text-[14px]">{formData.twitter}</span>
                      </div>
                    )}
                    {formData.telegram && (
                      <div className="flex items-center gap-2">
                        <Send size={16} className="opacity-50" />
                        <span className="text-[14px]">{formData.telegram}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Token Economics */}
              <div className="p-4 rounded-lg border-[1.5px] border-green-500/15 bg-green-500/5">
                <p className="text-[11px] uppercase tracking-wide opacity-70 mb-3">Token Economics</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[14px] opacity-80">Total Supply</span>
                    <span>{formData.tokenSupply.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[14px] opacity-80">AMM Pool</span>
                    <span>
                      {formData.userCheckPercent === 0
                        ? formData.tokenSupply.toLocaleString()
                        : Math.floor(formData.tokenSupply * 0.5).toLocaleString()
                      } {formData.ticker}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[14px] opacity-80">Initial XRP</span>
                    <span>{formData.ammXrpAmount} XRP</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[14px] opacity-80">Your Allocation</span>
                    <span className={formData.userCheckPercent === 0 ? 'opacity-60' : 'text-green-500'}>
                      {formData.userCheckPercent > 0
                        ? `${Math.floor(formData.tokenSupply * (formData.userCheckPercent / 100)).toLocaleString()} ${formData.ticker} (${formData.userCheckPercent}%)`
                        : '0 tokens (0%)'
                      }
                    </span>
                  </div>
                  {formData.userCheckPercent === 0 && (
                    <AlertBox severity="warning">
                      You will not receive any tokens. 100% goes to AMM pool.
                    </AlertBox>
                  )}
                </div>
              </div>

              {/* Anti-snipe Badge */}
              {formData.antiSnipe && (
                <AlertBox severity="info">
                  <Info size={16} />
                  Anti-snipe protection enabled (RequireAuth)
                </AlertBox>
              )}
            </div>

            {/* Action Buttons */}
            <div className="p-6 pt-4 border-t border-white/10 flex gap-3">
              <StyledButton fullWidth onClick={() => setShowSummary(false)}>
                Back to Edit
              </StyledButton>
              <StyledButton fullWidth variant="contained" onClick={confirmLaunch}>
                Confirm & Launch
              </StyledButton>
            </div>
          </Card>
        </Container>
      )}

      {/* Launch Status - Full page view */}
      {launchStep && (
        <Container>
          <PageTitle>
            {launchStep === 'initializing' && 'Initializing Token Launch'}
            {launchStep === 'funding' && 'Fund Issuer Account'}
            {launchStep === 'processing' && 'Creating Your Token'}
            {launchStep === 'completed' && 'Token Launch Complete!'}
            {launchStep === 'error' && 'Launch Failed'}
          </PageTitle>

          <Card>
          {launchStep === 'initializing' && (
            <div className="text-center py-6">
              <Spinner />
              <p className="mt-4">Setting up token parameters...</p>
            </div>
          )}

          {launchStep === 'funding' && sessionData && (
            <div className="space-y-4">
              <AlertBox severity={fundingProgress > 0 ? "info" : "warning"}>
                <Info size={16} />
                <div className="flex-1">
                  <strong>{fundingProgress === 100 ? 'Funding Complete!' : 'Waiting for issuer account funding...'}</strong>
                  <p className="text-[12px] mt-1 opacity-80">
                    {fundingProgress === 100
                      ? 'Proceeding with token creation...'
                      : `The issuer account needs at least ${fundingAmount.required} XRP to continue (Testnet requirement)`}
                  </p>
                  {fundingBalance > 0 && fundingProgress < 100 && (
                    <p className="text-[12px] mt-1 text-yellow-500">
                      Partially funded - need {fundingAmount.required - fundingBalance} more XRP
                    </p>
                  )}
                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-1 text-[12px]">
                      <span>Balance: {fundingBalance} / {fundingAmount.required} XRP</span>
                      {fundingProgress > 0 && (
                        <span className={fundingProgress === 100 ? 'text-green-500' : ''}>
                          {Math.round(fundingProgress)}%
                        </span>
                      )}
                    </div>
                    <ProgressBar value={fundingProgress} height="8px" />
                  </div>
                </div>
              </AlertBox>

              <div className="p-4 rounded-lg border-[1.5px] border-white/10 space-y-4">
                <div>
                  <p className="text-[12px] opacity-70 mb-2">
                    1. Fund this issuer address with {fundingAmount.required}+ XRP:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 rounded-lg bg-white/5 text-[13px] font-mono">
                      {sessionData?.issuerAddress || 'Loading...'}
                    </code>
                    {sessionData?.issuerAddress && (
                      <StyledButton
                        size="small"
                        onClick={() => {
                          navigator.clipboard.writeText(sessionData.issuerAddress);
                          openSnackbar?.('Address copied!', 'success');
                        }}
                      >
                        <Copy size={14} />
                      </StyledButton>
                    )}
                  </div>
                </div>

                <a
                  href={`https://faucet.altnet.rippletest.net/?destination=${sessionData.issuerAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-[#4285f4] text-white text-[15px]"
                >
                  Open Testnet Faucet
                  <ExternalLink size={16} />
                </a>

                <div>
                  <p className="text-[12px] opacity-70 mb-2">
                    2. Your wallet address (for receiving tokens):
                  </p>
                  <div className="flex items-center gap-2">
                    {accountProfile && <CheckCircle size={16} className="text-green-500" />}
                    <input
                      type="text"
                      placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                      value={userWallet || (accountProfile ? (accountProfile.account || accountProfile.address) : '')}
                      onChange={(e) => setUserWallet(e.target.value)}
                      disabled={!!accountProfile}
                      className={cn(
                        "flex-1 px-3 py-2 rounded-lg border-[1.5px] text-[14px] bg-transparent",
                        isDark ? "border-white/15" : "border-gray-300"
                      )}
                    />
                  </div>
                  <p className="text-[11px] opacity-50 mt-1">
                    {accountProfile ? "Using connected wallet" : "Enter your wallet address"}
                  </p>
                </div>
              </div>

              {/* Debug Info (collapsible) */}
              <details open>
                <summary className="cursor-pointer text-[13px] opacity-70">
                  Session Debug Info
                </summary>
                <div className="mt-2 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                  <pre className="font-mono text-[11px] whitespace-pre-wrap">
                    Session ID: {sessionData?.sessionId || 'N/A'}{'\n'}
                    Status: {sessionData?.status || 'awaiting_funding'}{'\n'}
                    Issuer: {sessionData?.issuerAddress || 'N/A'}{'\n'}
                    {sessionData?.holderAddress && `Holder: ${sessionData.holderAddress}\n`}
                    {sessionData?.ammAddress && `AMM: ${sessionData.ammAddress}\n`}
                    {sessionData?.message && `Message: ${sessionData.message}\n`}
                    Funding: {fundingBalance} / {fundingAmount.required} XRP ({Math.round(fundingProgress)}%)
                  </pre>
                </div>
              </details>
            </div>
          )}

          {launchStep === 'processing' && (
            <div className="space-y-6">
              <div className="text-center py-4">
                <Spinner />
                <h3 className="text-lg mt-4 mb-1">Processing token launch...</h3>
                <p className="text-[13px] opacity-60">This may take a few moments</p>
              </div>

              {/* Current Step Alert */}
              {sessionData?.status && (
                <AlertBox severity="info">
                  <Info size={16} />
                  <span>
                    Current Step: {
                      sessionData.status === 'funded' ? 'Funding received, starting launch...' :
                      sessionData.status === 'configuring_issuer' ? 'Configuring issuer account...' :
                      sessionData.status === 'creating_trustline' ? 'Creating trustline...' :
                      sessionData.status === 'sending_tokens' ? 'Minting tokens...' :
                      sessionData.status === 'creating_checks' ? 'Creating user check...' :
                      sessionData.status === 'creating_amm' ? 'Creating AMM pool...' :
                      sessionData.status === 'scheduling_blackhole' ? 'Finalizing and blackholing...' :
                      'Processing...'
                    }
                  </span>
                </AlertBox>
              )}

              {/* Progress Steps List */}
              <div className="p-4 rounded-lg border-[1.5px] border-white/10 space-y-2">
                <p className="text-[14px] opacity-80">• Setting up issuer account</p>
                <p className="text-[14px] opacity-80">• Creating trustlines</p>
                <p className="text-[14px] opacity-80">• Distributing tokens</p>
                <p className="text-[14px] opacity-80">• Creating AMM pool</p>
                <p className="text-[14px] opacity-80">• Blackholing accounts</p>
              </div>

              {/* Insufficient Funding Warning */}
              {launchLogs.some(log => log.message?.includes('Insufficient')) && (
                <AlertBox severity="error">
                  <strong>Insufficient Funding!</strong>
                  <p className="text-[12px] mt-1">The issuer account needs more XRP. Please add at least 15 XRP to continue.</p>
                </AlertBox>
              )}

              {/* Debug Logs Toggle */}
              <div className="text-center">
                <button
                  onClick={() => setShowDebugPanel(!showDebugPanel)}
                  className="text-[14px] text-[#4285f4]"
                >
                  {showDebugPanel ? 'Hide' : 'Show'} Debug Logs ({launchLogs.length})
                </button>
              </div>

              {/* Debug Logs Panel */}
              {showDebugPanel && launchLogs.length > 0 && (
                <div className="p-4 max-h-[300px] overflow-auto bg-black/50 rounded-lg border-[1.5px] border-white/10 font-mono">
                  {launchLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "text-[12px] leading-relaxed",
                        log.level === 'error' ? 'text-red-500' :
                        log.level === 'warn' ? 'text-yellow-500' :
                        log.level === 'success' ? 'text-green-500' :
                        'text-white/70'
                      )}
                    >
                      <span className="opacity-50">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                      {' '}
                      <span>[{log.level?.toUpperCase() || 'LOG'}]</span>
                      {' '}
                      {log.message}
                    </div>
                  ))}
                </div>
              )}

              {/* Session ID */}
              {sessionData?.sessionId && (
                <p className="text-center text-[12px] opacity-60">
                  Session ID: {sessionData.sessionId}
                </p>
              )}
            </div>
          )}

          {launchStep === 'completed' && sessionData && (
            <div className="space-y-4">
              <AlertBox severity="success">
                <CheckCircle size={16} />
                Your token has been successfully launched on XRPL Testnet!
              </AlertBox>

              <div className="p-4 rounded-lg bg-green-500/5 border-[1.5px] border-green-500/20 space-y-2">
                <p><strong>Token:</strong> {formData.tokenName} ({formData.ticker})</p>
                <p><strong>Total Supply:</strong> {formData.tokenSupply.toLocaleString()}</p>
                <p><strong>AMM Pool:</strong> {Math.floor(formData.tokenSupply * 0.5).toLocaleString()} {formData.ticker} / {formData.ammXrpAmount} XRP</p>
              </div>

              {(sessionData.data?.userCheckId || sessionData.userCheckId) && (
                <div className={cn(
                  "p-4 rounded-lg border-[1.5px]",
                  checkClaimed ? "bg-green-500/5 border-green-500/20" : "bg-blue-500/5 border-blue-500/20"
                )}>
                  <p className="font-medium mb-2">
                    {checkClaimed ? 'Tokens Claimed' : 'Claim Your Tokens'}
                  </p>
                  <p className="text-[13px] opacity-80 mb-3">
                    {checkClaimed
                      ? `You have successfully claimed ${Math.floor(formData.tokenSupply * (formData.userCheckPercent / 100)).toLocaleString()} ${formData.ticker} tokens`
                      : `You have ${Math.floor(formData.tokenSupply * (formData.userCheckPercent / 100)).toLocaleString()} ${formData.ticker} tokens available to claim`
                    }
                  </p>
                  {!checkClaimed && (
                    <AlertBox severity="info">
                      <Info size={16} />
                      {accountProfile
                        ? 'Click the button below to claim your tokens. You will need to sign a CheckCash transaction.'
                        : 'Connect your wallet to claim your tokens. You need to sign a CheckCash transaction.'
                      }
                    </AlertBox>
                  )}
                  {checkClaimed && (
                    <AlertBox severity="success">
                      <CheckCircle size={16} />
                      Your tokens have been successfully claimed and are now in your wallet.
                    </AlertBox>
                  )}
                  <StyledButton
                    variant="contained"
                    fullWidth
                    disabled={!accountProfile || checkClaimed || claiming}
                    onClick={async () => {
                      if (!accountProfile?.account) {
                        openSnackbar?.('Please connect your wallet', 'error');
                        return;
                      }

                      setClaiming(true);
                      try {
                        const ticker = formData.ticker || sessionData.currencyCode || sessionData.data?.currencyCode;
                        const supply = formData.tokenSupply || sessionData.tokenSupply || sessionData.data?.tokenSupply;
                        const checkPercent = formData.userCheckPercent || sessionData.userCheckPercent || sessionData.data?.userCheckPercent || 0;

                        if (!ticker) {
                          openSnackbar?.('Currency code not found. Please try launching again.', 'error');
                          setClaiming(false);
                          return;
                        }

                        let wallet;
                        const walletStorage = new UnifiedWalletStorage();

                        if (accountProfile.seed) {
                          wallet = xrpl.Wallet.fromSeed(accountProfile.seed);
                        } else if (accountProfile.wallet_type === 'oauth' || accountProfile.wallet_type === 'social') {
                          const password = prompt('Enter your wallet password to sign the transaction:');
                          if (!password) {
                            setClaiming(false);
                            return;
                          }
                          const walletId = `${accountProfile.provider}_${accountProfile.provider_id}`;
                          const walletData = await walletStorage.findWalletBySocialId(walletId, password);
                          if (!walletData || !walletData.seed) {
                            openSnackbar?.('Incorrect password or wallet not found', 'error');
                            setClaiming(false);
                            return;
                          }
                          wallet = xrpl.Wallet.fromSeed(walletData.seed);
                        } else if (accountProfile.wallet_type === 'device') {
                          const password = prompt('Enter your wallet password to sign the transaction:');
                          if (!password) {
                            setClaiming(false);
                            return;
                          }
                          const wallets = await walletStorage.getWallets(password);
                          const walletData = wallets.find(w => w.address === accountProfile.account);
                          if (!walletData || !walletData.seed) {
                            openSnackbar?.('Incorrect password or wallet not found', 'error');
                            setClaiming(false);
                            return;
                          }
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
                          openSnackbar?.('Tokens claimed successfully!', 'success');
                        } else {
                          openSnackbar?.('Failed to claim tokens: ' + tx.result.meta.TransactionResult, 'error');
                        }
                      } catch (error) {
                        console.error('Cash check error:', error);
                        if (error.message.includes('tecNO_ENTRY')) {
                          setCheckClaimed(true);
                          openSnackbar?.('Check already claimed or expired', 'warning');
                        } else if (error.message.includes('Incorrect password')) {
                          openSnackbar?.('Incorrect password. Please try again.', 'error');
                        } else {
                          openSnackbar?.('Error cashing check: ' + error.message, 'error');
                        }
                      } finally {
                        setClaiming(false);
                      }
                    }}
                    className="mt-3"
                  >
                    {claiming ? 'Claiming...' : checkClaimed ? 'Already Claimed' : accountProfile ? 'Cash Check & Claim Tokens' : 'Connect Wallet to Claim'}
                  </StyledButton>
                  <p className="text-[11px] opacity-50 mt-2">
                    Check ID: {(sessionData.data?.userCheckId || sessionData.userCheckId)?.substring(0, 16)}...
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <StyledButton size="small" fullWidth onClick={() => openInExplorer(sessionData.issuerAddress)}>
                  View Issuer <ExternalLink size={14} className="ml-1" />
                </StyledButton>
                <StyledButton size="small" fullWidth onClick={() => openInExplorer(sessionData.ammAddress)}>
                  View AMM <ExternalLink size={14} className="ml-1" />
                </StyledButton>
              </div>

              <StyledButton
                variant="contained"
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
                    antiSnipe: false
                  });
                  setFileName('');
                  setImagePreview('');
                }}
              >
                Done
              </StyledButton>
            </div>
          )}

          {launchStep === 'error' && (
            <div className="space-y-4">
              <AlertBox severity="error">
                {launchError || 'An error occurred during token launch'}
              </AlertBox>

              {launchLogs.length > 0 && (
                <div className="p-3 max-h-[300px] overflow-auto rounded-lg border-[1.5px] border-white/10">
                  <p className="text-[12px] font-medium mb-2">Error Logs:</p>
                  {launchLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "p-1 rounded text-[11px] font-mono",
                        log.level === 'error' ? 'bg-red-500/5 text-red-500' :
                        log.level === 'warn' ? 'bg-yellow-500/5 text-yellow-500' :
                        'opacity-70'
                      )}
                    >
                      <span className="opacity-60">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                      {' '}{log.message}
                    </div>
                  ))}
                </div>
              )}

              <StyledButton fullWidth onClick={() => resetLaunchState()}>
                Close
              </StyledButton>
            </div>
          )}
          </Card>
        </Container>
      )}

      <Footer />
    </PageWrapper>
  );
}

export default CreatePage;