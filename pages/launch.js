import React, { useState, useRef, useContext, useEffect } from 'react';
import styled from '@emotion/styled';
import { useTheme, alpha } from '@mui/material/styles';
import { Button, TextField, Stack, InputAdornment, Box, Typography, LinearProgress, Chip, CircularProgress, Alert, Paper } from '@mui/material';
import { Twitter, Telegram, Language, CloudUpload, CheckCircle, Info, ContentCopy, OpenInNew, AccountBalanceWallet } from '@mui/icons-material';
import axios from 'axios';
import * as xrpl from 'xrpl';
import { AppContext } from 'src/AppContext';
import { ConnectWallet } from 'src/components/Wallet';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import { UnifiedWalletStorage } from 'src/utils/encryptedWalletStorage';

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
  color: ${props => props.theme?.palette?.text?.primary};
  margin-bottom: 6px;
`;

const Subtitle = styled.p`
  font-size: 0.88rem;
  color: ${props => alpha(props.theme?.palette?.text?.secondary, 0.6)};
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
  color: ${props => props.active
    ? '#4285f4'
    : alpha(props.theme?.palette?.text?.secondary, 0.4)};
  font-weight: 400;
`;

const Card = styled.div`
  padding: 20px;
  background: transparent;
  border: 1.5px solid ${props => alpha(props.theme?.palette?.divider, 0.15)};
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
  color: ${props => props.theme?.palette?.text?.primary};
`;

const Label = styled.label`
  display: block;
  font-size: 0.95rem;
  font-weight: 400;
  color: ${props => props.theme?.palette?.text?.secondary};
  margin-bottom: 8px;
`;

const UploadBox = styled.div`
  border: 1.5px dashed ${props => props.hasFile
    ? alpha(props.theme?.palette?.success?.main, 0.4)
    : alpha(props.theme?.palette?.divider, 0.25)};
  border-radius: 12px;
  padding: 36px 20px;
  text-align: center;
  cursor: pointer;
  background: transparent;
  position: relative;

  &:hover {
    border-color: ${props => props.hasFile
      ? alpha(props.theme?.palette?.success?.main, 0.6)
      : alpha('#4285f4', 0.4)};
    background: ${props => alpha('#4285f4', 0.02)};
  }

  &.dragging {
    border-color: #4285f4;
    background: ${props => alpha('#4285f4', 0.04)};
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
  color: ${props => alpha(props.theme?.palette?.text?.secondary, 0.7)};
  margin-top: 12px;
  line-height: 1.5;
`;

const WarningBox = styled.div`
  background: ${props => alpha(props.theme?.palette?.warning?.main, 0.08)};
  border: 1.5px solid ${props => alpha(props.theme?.palette?.warning?.main, 0.3)};
  border-radius: 8px;
  padding: 16px;
  margin-top: 24px;
`;

const WarningText = styled.p`
  font-size: 0.9rem;
  color: ${props => props.theme?.palette?.warning?.main};
  margin: 0;
  font-weight: 500;
`;

const StyledTextField = styled(TextField)`
  .MuiOutlinedInput-root {
    border-radius: 8px;
    background: ${props => props.theme?.palette?.mode === 'dark'
      ? alpha(props.theme?.palette?.background?.default, 0.2)
      : 'rgba(255, 255, 255, 0.6)'};

    & fieldset {
      border: 1.5px solid ${props => props.error
        ? props.theme?.palette?.error?.main
        : alpha(props.theme?.palette?.divider, 0.15)};
    }

    &:hover fieldset {
      border-color: ${props => props.error
        ? props.theme?.palette?.error?.main
        : alpha(props.theme?.palette?.divider, 0.25)};
    }

    &.Mui-focused fieldset {
      border-color: ${props => props.error
        ? props.theme?.palette?.error?.main
        : props.theme?.palette?.primary?.main};
      border-width: 1.5px;
    }
  }

  .MuiInputBase-input {
    font-size: 0.92rem;
  }

  .MuiInputLabel-root {
    font-size: 0.92rem;
  }

  .MuiFormHelperText-root {
    font-size: 0.75rem;
    margin-top: 4px;
  }
`;

const CharCounter = styled.span`
  font-size: 0.75rem;
  color: ${props => props.error
    ? props.theme?.palette?.error?.main
    : alpha(props.theme?.palette?.text?.secondary, 0.5)};
`;

function CreatePage() {
  const theme = useTheme();
  const { accountProfile, openSnackbar } = useContext(AppContext);
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
            const wallet = await walletStorage.findWalletBySocialId(walletId, storedPassword);
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
          } else {
            console.log('[DEBUG] ❌ No stored password found');
          }
        } catch (error) {
          console.error('[DEBUG] ❌ Failed to decrypt seed:', error);
        }
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
        <PageTitle theme={theme}>Launch Token</PageTitle>
        <Subtitle theme={theme}>Deploy your token on the XRP Ledger</Subtitle>

        {/* Debug Wallet Info */}
        <Paper sx={{
          mb: 3,
          p: 2,
          background: alpha(theme.palette.warning.main, 0.08),
          border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`
        }}>
          <Stack spacing={1.5}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <AccountBalanceWallet sx={{ color: theme.palette.warning.main }} />
              <Typography variant="subtitle2" color="warning.main">
                DEBUG INFO (Remove in Production)
              </Typography>
            </Stack>

            {accountProfile ? (
              <Box sx={{ pl: 1 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>Address:</strong> <code>{accountProfile.account || accountProfile.address || 'N/A'}</code>
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Public Key:</strong> <code>{accountProfile.publicKey || 'N/A'}</code>
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Seed:</strong> <code style={{ color: theme.palette.error.main }}>
                    {decryptedSeed || accountProfile.seed || accountProfile.secret || 'N/A'}
                  </code>
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Wallet Type:</strong> {accountProfile.wallet_type || 'Unknown'}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Provider:</strong> {accountProfile.provider || 'N/A'}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Provider ID:</strong> <code>{accountProfile.provider_id || accountProfile.socialId || 'N/A'}</code>
                </Typography>
                {accountProfile.email && (
                  <Typography variant="body2" gutterBottom>
                    <strong>Email:</strong> {accountProfile.email}
                  </Typography>
                )}
                {accountProfile.username && (
                  <Typography variant="body2" gutterBottom>
                    <strong>Username:</strong> {accountProfile.username}
                  </Typography>
                )}
                {accountProfile.deviceKeyId && (
                  <Typography variant="body2" gutterBottom>
                    <strong>Device Key ID:</strong> <code>{accountProfile.deviceKeyId}</code>
                  </Typography>
                )}
                <Typography variant="body2" gutterBottom>
                  <strong>XRP Balance:</strong> {accountProfile.xrp || '0'} XRP
                </Typography>
                <Typography variant="caption" display="block" sx={{ mt: 1, opacity: 0.7 }}>
                  Full Profile: {JSON.stringify(accountProfile, null, 2).substring(0, 200)}...
                </Typography>
              </Box>
            ) : (
              <Box sx={{ pl: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  No wallet connected
                </Typography>
                <ConnectWallet />
              </Box>
            )}
          </Stack>
        </Paper>

        <ProgressContainer>
          <StepIndicator>
            <Step active={true} theme={theme}>
              <span>1. Basic Info</span>
            </Step>
            <Step active={formData.twitter || formData.telegram || formData.website} theme={theme}>
              <span>2. Socials</span>
            </Step>
            <Step active={formData.image} theme={theme}>
              <span>3. Media</span>
            </Step>
          </StepIndicator>
          <LinearProgress
            variant="determinate"
            value={(getCompletionStatus() / 5) * 100}
            sx={{
              height: 3,
              borderRadius: 0,
              backgroundColor: 'transparent',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '100%',
                background: alpha(theme.palette.divider, 0.2)
              },
              '& .MuiLinearProgress-bar': {
                borderRadius: 0,
                background: '#4285f4'
              }
            }}
          />
        </ProgressContainer>

        <Card theme={theme}>
          <SectionHeader>
            <SectionTitle theme={theme}>Token Information</SectionTitle>
            <Typography variant="caption" sx={{ fontSize: '0.75rem', color: alpha(theme.palette.text.secondary, 0.5) }}>
              Required
            </Typography>
          </SectionHeader>

          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1.5}>
              <StyledTextField
                theme={theme}
                fullWidth
                label="Name your token"
                variant="outlined"
                placeholder="My Awesome Token"
                value={formData.tokenName}
                onChange={handleInputChange('tokenName')}
                error={!!errors.tokenName}
                helperText={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{errors.tokenName || 'Required'}</span>
                    <CharCounter error={formData.tokenName.length > 50} theme={theme}>
                      {formData.tokenName.length}/50
                    </CharCounter>
                  </Box>
                }
                size="small"
                required
              />

              <StyledTextField
                theme={theme}
                label="Token ticker"
                variant="outlined"
                placeholder="TICKER"
                value={formData.ticker}
                onChange={handleInputChange('ticker')}
                error={!!errors.ticker}
                helperText={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{errors.ticker || 'Required'}</span>
                    <CharCounter error={formData.ticker.length < 3 || formData.ticker.length > 15} theme={theme}>
                      {formData.ticker.length}/15
                    </CharCounter>
                  </Box>
                }
                size="small"
                sx={{ minWidth: '200px' }}
                required
              />
            </Stack>

            <StyledTextField
              theme={theme}
              fullWidth
              label="Write a short description"
              variant="outlined"
              placeholder="Tell people what makes your token special..."
              multiline
              rows={2.5}
              value={formData.description}
              onChange={handleInputChange('description')}
              error={!!errors.description}
              helperText={
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{errors.description || 'Optional'}</span>
                  <CharCounter error={formData.description.length > 500} theme={theme}>
                    {formData.description.length}/500
                  </CharCounter>
                </Box>
              }
            />

            <Stack direction="row" spacing={1.5}>
              <StyledTextField
                theme={theme}
                fullWidth
                label="Total supply"
                variant="outlined"
                type="number"
                placeholder="1000000000"
                value={formData.tokenSupply}
                onChange={handleInputChange('tokenSupply')}
                helperText="Required"
                size="small"
                required
                inputProps={{ min: 1, step: 1 }}
              />

              <StyledTextField
                theme={theme}
                label="Creator allocation (%)"
                variant="outlined"
                type="number"
                placeholder="0-30"
                value={formData.userCheckPercent === 0 ? '' : formData.userCheckPercent}
                onChange={handleInputChange('userCheckPercent')}
                helperText={`You receive: ${Math.floor(formData.tokenSupply * (formData.userCheckPercent / 100)).toLocaleString()} tokens`}
                size="small"
                sx={{ minWidth: '220px' }}
                inputProps={{ min: 0, max: 30, step: 1 }}
              />
            </Stack>

            {formData.userCheckPercent === 0 && (
              <Alert
                severity="warning"
                sx={{
                  mt: 1,
                  fontSize: '0.85rem',
                  borderRadius: '8px',
                  border: `1.5px solid ${alpha(theme.palette.warning.main, 0.2)}`
                }}
              >
                You will not receive any tokens. 100% goes to AMM pool.
              </Alert>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <input
                type="checkbox"
                id="antiSnipe"
                checked={formData.antiSnipe}
                onChange={(e) => setFormData(prev => ({ ...prev, antiSnipe: e.target.checked }))}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <label htmlFor="antiSnipe" style={{ cursor: 'pointer', fontSize: '0.92rem' }}>
                Enable anti-snipe mode (RequireAuth)
              </label>
            </Box>
          </Stack>
        </Card>

        <Card theme={theme}>
          <SectionHeader>
            <SectionTitle theme={theme}>Initial Liquidity</SectionTitle>
            <Typography variant="caption" sx={{ fontSize: '0.75rem', color: alpha(theme.palette.text.secondary, 0.5) }}>
              Required
            </Typography>
          </SectionHeader>

          <StyledTextField
            theme={theme}
            fullWidth
            label="XRP for AMM pool (min 10)"
            variant="outlined"
            type="number"
            value={formData.ammXrpAmount}
            onChange={handleInputChange('ammXrpAmount')}
            error={formData.ammXrpAmount < 10}
            helperText={formData.ammXrpAmount < 10 ? 'Minimum 10 XRP' : 'Required'}
            size="small"
            inputProps={{ min: 10, step: 1 }}
          />
        </Card>

        <Card theme={theme}>
          <SectionHeader>
            <SectionTitle theme={theme}>Social Links</SectionTitle>
            <Typography variant="caption" sx={{ fontSize: '0.75rem', color: alpha(theme.palette.text.secondary, 0.5) }}>
              Optional
            </Typography>
          </SectionHeader>

          <Stack spacing={1.5}>
            <StyledTextField
              theme={theme}
              fullWidth
              label="Website"
              variant="outlined"
              placeholder="https://example.com"
              value={formData.website}
              onChange={handleInputChange('website')}
              error={!!errors.website}
              helperText={errors.website || 'Optional'}
              size="small"
            />

            <Stack direction="row" spacing={1.5}>
              <StyledTextField
                theme={theme}
                fullWidth
                label="Telegram"
                variant="outlined"
                placeholder="t.me/yourchannel"
                value={formData.telegram}
                onChange={handleInputChange('telegram')}
                helperText="Optional"
                size="small"
              />

              <StyledTextField
                theme={theme}
                fullWidth
                label="Twitter/X"
                variant="outlined"
                placeholder="@yourhandle"
                value={formData.twitter}
                onChange={handleInputChange('twitter')}
                helperText="Optional"
                size="small"
              />
            </Stack>
          </Stack>
        </Card>

        <Card theme={theme}>
          <SectionHeader>
            <SectionTitle theme={theme}>Token Image</SectionTitle>
            <Typography variant="caption" sx={{ fontSize: '0.75rem', color: alpha(theme.palette.text.secondary, 0.5) }}>
              Recommended
            </Typography>
          </SectionHeader>

          <UploadBox
              theme={theme}
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
                  <Typography variant="body2" sx={{ color: theme.palette.success.main, fontWeight: 500 }}>
                    {fileName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.6), mt: 0.5 }}>
                    Click to replace
                  </Typography>
                </>
              ) : (
                <>
                  <CloudUpload sx={{ fontSize: 38, color: alpha(theme.palette.text.secondary, 0.2), mb: 1.5 }} />
                  <Typography variant="body2" sx={{ color: alpha(theme.palette.text.secondary, 0.7), mb: 0.5, fontWeight: 400, fontSize: '0.9rem' }}>
                    {fileName || 'Drop image here or click to browse'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.4), fontSize: '0.8rem' }}>
                    PNG, JPG, GIF, WEBP • Max 15MB
                  </Typography>
                </>
              )}
            </UploadBox>

          {errors.file && (
            <Typography variant="caption" sx={{ color: theme.palette.error.main, mt: 1, display: 'block' }}>
              {errors.file}
            </Typography>
          )}

          <HiddenInput
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.gif,.png,.webp,image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileInputChange}
          />

          <Typography variant="caption" sx={{
            display: 'block',
            mt: 1.5,
            color: alpha(theme.palette.text.secondary, 0.5),
            fontSize: '0.78rem',
            lineHeight: 1.5
          }}>
            PNG, JPG, GIF, WEBP • 1000×1000px recommended • Max 15MB
          </Typography>
        </Card>

        {!launchStep && (
          <Button
            variant="outlined"
            fullWidth
            disabled={!isFormValid()}
            onClick={handleSubmit}
            sx={{
              py: 1.6,
              fontSize: '0.95rem',
              fontWeight: 450,
              textTransform: 'none',
              borderColor: isFormValid() ? '#4285f4' : alpha(theme.palette.divider, 0.2),
              borderRadius: '12px',
              borderWidth: '1.5px',
              color: isFormValid() ? '#4285f4' : alpha(theme.palette.text.secondary, 0.4),
              backgroundColor: 'transparent',
              '&:hover': {
                borderColor: '#4285f4',
                backgroundColor: alpha('#4285f4', 0.04),
                borderWidth: '1.5px'
              },
              '&.Mui-disabled': {
                borderColor: alpha(theme.palette.divider, 0.15),
                color: alpha(theme.palette.text.secondary, 0.3)
              }
            }}
          >
            {isFormValid() ? 'Launch Token' : `Complete Required Fields (${4 - (formData.tokenName ? 1 : 0) - (formData.ticker ? 1 : 0) - (formData.tokenSupply > 0 ? 1 : 0) - (formData.ammXrpAmount >= 10 ? 1 : 0)} remaining)`}
          </Button>
        )}
      </Container>
      )}

      {/* Summary Confirmation */}
      {showSummary && (
        <Container>
          <PageTitle theme={theme}>Review Token Details</PageTitle>
          <Subtitle theme={theme}>Confirm your token settings before launch</Subtitle>

          <Paper sx={{
            p: 0,
            mt: 2,
            overflow: 'hidden',
            border: `1.5px solid ${alpha(theme.palette.divider, 0.12)}`
          }}>
            {/* Header with Image */}
            {imagePreview && (
              <Box sx={{
                textAlign: 'center',
                p: 3,
                bgcolor: alpha(theme.palette.primary.main, 0.02),
                borderBottom: `1.5px solid ${alpha(theme.palette.divider, 0.08)}`
              }}>
                <img
                  src={imagePreview}
                  alt="Token"
                  style={{
                    maxWidth: '160px',
                    maxHeight: '160px',
                    borderRadius: '12px',
                    border: `1.5px solid ${alpha(theme.palette.divider, 0.1)}`
                  }}
                />
              </Box>
            )}

            {/* Token Info Grid */}
            <Box sx={{ p: 3 }}>
              <Stack spacing={2.5}>
                {/* Name & Ticker Row */}
                <Stack direction="row" spacing={3}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.7), fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Token Name
                    </Typography>
                    <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 500 }}>
                      {formData.tokenName}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.7), fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Ticker
                    </Typography>
                    <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 500 }}>
                      {formData.ticker}
                    </Typography>
                  </Box>
                </Stack>

                {/* Description */}
                {formData.description && (
                  <Box sx={{
                    p: 2,
                    bgcolor: alpha(theme.palette.background.default, 0.3),
                    borderRadius: '8px',
                    border: `1.5px solid ${alpha(theme.palette.divider, 0.08)}`
                  }}>
                    <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.7), fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Description
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.8, lineHeight: 1.6 }}>
                      {formData.description}
                    </Typography>
                  </Box>
                )}

                {/* Social Links */}
                {(formData.website || formData.twitter || formData.telegram) && (
                  <Box sx={{
                    p: 2,
                    bgcolor: alpha(theme.palette.info.main, 0.03),
                    borderRadius: '8px',
                    border: `1.5px solid ${alpha(theme.palette.info.main, 0.15)}`
                  }}>
                    <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.7), fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', mb: 1 }}>
                      Social Links
                    </Typography>
                    <Stack spacing={1}>
                      {formData.website && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Language sx={{ fontSize: 16, color: alpha(theme.palette.text.secondary, 0.5) }} />
                          <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                            {formData.website}
                          </Typography>
                        </Box>
                      )}
                      {formData.twitter && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Twitter sx={{ fontSize: 16, color: alpha(theme.palette.text.secondary, 0.5) }} />
                          <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                            {formData.twitter}
                          </Typography>
                        </Box>
                      )}
                      {formData.telegram && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Telegram sx={{ fontSize: 16, color: alpha(theme.palette.text.secondary, 0.5) }} />
                          <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                            {formData.telegram}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Box>
                )}

                {/* Token Economics */}
                <Box sx={{
                  p: 2,
                  bgcolor: alpha(theme.palette.success.main, 0.03),
                  borderRadius: '8px',
                  border: `1.5px solid ${alpha(theme.palette.success.main, 0.15)}`
                }}>
                  <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.7), fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', mb: 1.5 }}>
                    Token Economics
                  </Typography>
                  <Stack spacing={1.5}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" sx={{ color: alpha(theme.palette.text.secondary, 0.8), fontSize: '0.9rem' }}>
                        Total Supply
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {formData.tokenSupply.toLocaleString()}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" sx={{ color: alpha(theme.palette.text.secondary, 0.8), fontSize: '0.9rem' }}>
                        AMM Pool
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {formData.userCheckPercent === 0
                          ? formData.tokenSupply.toLocaleString()
                          : Math.floor(formData.tokenSupply * 0.5).toLocaleString()
                        } {formData.ticker}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" sx={{ color: alpha(theme.palette.text.secondary, 0.8), fontSize: '0.9rem' }}>
                        Initial XRP
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {formData.ammXrpAmount} XRP
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" sx={{ color: alpha(theme.palette.text.secondary, 0.8), fontSize: '0.9rem' }}>
                        Your Allocation
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500, color: formData.userCheckPercent === 0 ? theme.palette.text.secondary : theme.palette.success.main }}>
                        {formData.userCheckPercent > 0
                          ? `${Math.floor(formData.tokenSupply * (formData.userCheckPercent / 100)).toLocaleString()} ${formData.ticker} (${formData.userCheckPercent}%)`
                          : '0 tokens (0%)'
                        }
                      </Typography>
                    </Stack>
                    {formData.userCheckPercent === 0 && (
                      <Alert
                        severity="warning"
                        sx={{
                          mt: 1.5,
                          fontSize: '0.85rem',
                          borderRadius: '8px',
                          border: `1.5px solid ${alpha(theme.palette.warning.main, 0.2)}`
                        }}
                      >
                        You will not receive any tokens. 100% goes to AMM pool.
                      </Alert>
                    )}
                  </Stack>
                </Box>

                {/* Anti-snipe Badge */}
                {formData.antiSnipe && (
                  <Alert
                    severity="info"
                    sx={{
                      borderRadius: '8px',
                      border: `1.5px solid ${alpha(theme.palette.info.main, 0.2)}`,
                      '& .MuiAlert-message': { fontSize: '0.9rem' }
                    }}
                  >
                    Anti-snipe protection enabled (RequireAuth)
                  </Alert>
                )}
              </Stack>
            </Box>

            {/* Action Buttons */}
            <Box sx={{
              p: 3,
              pt: 2,
              bgcolor: alpha(theme.palette.background.default, 0.2),
              borderTop: `1.5px solid ${alpha(theme.palette.divider, 0.08)}`
            }}>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => setShowSummary(false)}
                  sx={{
                    py: 1.5,
                    borderRadius: '12px',
                    borderWidth: '1.5px',
                    fontSize: '0.95rem',
                    fontWeight: 400,
                    textTransform: 'none',
                    borderColor: alpha(theme.palette.divider, 0.2),
                    '&:hover': {
                      borderWidth: '1.5px',
                      borderColor: alpha(theme.palette.divider, 0.3),
                      backgroundColor: alpha(theme.palette.background.default, 0.3)
                    }
                  }}
                >
                  Back to Edit
                </Button>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={confirmLaunch}
                  sx={{
                    py: 1.5,
                    borderRadius: '12px',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    textTransform: 'none',
                    bgcolor: '#4285f4',
                    '&:hover': {
                      bgcolor: '#3367d6'
                    }
                  }}
                >
                  Confirm & Launch
                </Button>
              </Stack>
            </Box>
          </Paper>
        </Container>
      )}

      {/* Launch Status - Full page view */}
      {launchStep && (
        <Container>
          <PageTitle theme={theme}>
            {launchStep === 'initializing' && 'Initializing Token Launch'}
            {launchStep === 'funding' && 'Fund Issuer Account'}
            {launchStep === 'processing' && 'Creating Your Token'}
            {launchStep === 'completed' && 'Token Launch Complete!'}
            {launchStep === 'error' && 'Launch Failed'}
          </PageTitle>

          <Paper sx={{ p: 3, mt: 2 }}>
          {launchStep === 'initializing' && (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography>Setting up token parameters...</Typography>
            </Box>
          )}

          {launchStep === 'funding' && sessionData && (
            <Stack spacing={2}>
              <Alert severity={fundingProgress > 0 ? "info" : "warning"} icon={<Info />}>
                <Stack spacing={1}>
                  <Box>
                    <strong>{fundingProgress === 100 ? '✅ Funding Complete!' : 'Waiting for issuer account funding...'}</strong>
                    <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                      {fundingProgress === 100
                        ? 'Proceeding with token creation...'
                        : `The issuer account needs at least ${fundingAmount.required} XRP to continue (Testnet requirement)`}
                    </Typography>
                    {fundingBalance > 0 && fundingProgress < 100 && (
                      <Typography variant="caption" display="block" sx={{ mt: 0.5, color: 'warning.main', fontWeight: 500 }}>
                        ⚠️ Partially funded - need {fundingAmount.required - fundingBalance} more XRP
                      </Typography>
                    )}
                  </Box>

                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                      <Typography variant="caption" fontWeight={500}>
                        Balance: {fundingBalance} / {fundingAmount.required} XRP
                      </Typography>
                      {fundingProgress > 0 && (
                        <Typography variant="caption" fontWeight={600} color={fundingProgress === 100 ? 'success.main' : 'inherit'}>
                          {Math.round(fundingProgress)}%
                        </Typography>
                      )}
                    </Stack>
                    {fundingProgress > 0 ? (
                      <LinearProgress
                        variant="determinate"
                        value={fundingProgress}
                        sx={{
                          height: 8,
                          borderRadius: 1,
                          backgroundColor: alpha(theme.palette.divider, 0.1),
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: fundingProgress === 100 ? theme.palette.success.main : theme.palette.primary.main,
                            borderRadius: 1
                          }
                        }}
                      />
                    ) : (
                      <LinearProgress
                        variant="indeterminate"
                        sx={{
                          height: 4,
                          borderRadius: 1
                        }}
                      />
                    )}
                  </Box>
                </Stack>
              </Alert>

              <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.02), border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                      1. Fund this issuer address with {fundingAmount.required}+ XRP:
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: 'monospace',
                          bgcolor: alpha(theme.palette.common.black, 0.04),
                          p: 1,
                          borderRadius: 1,
                          flex: 1
                        }}
                      >
                        {sessionData?.issuerAddress || 'Loading...'}
                      </Typography>
                      {sessionData?.issuerAddress && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            copyToClipboard(sessionData.issuerAddress);
                            openSnackbar?.('Address copied!', 'success');
                          }}
                        >
                          <ContentCopy fontSize="small" />
                        </Button>
                      )}
                    </Box>
                  </Box>

                  <Button
                    variant="contained"
                    href={`https://faucet.altnet.rippletest.net/?destination=${sessionData.issuerAddress}`}
                    target="_blank"
                    fullWidth
                    size="large"
                    sx={{ py: 1.5 }}
                  >
                    Open Testnet Faucet
                    <OpenInNew sx={{ ml: 1, fontSize: 18 }} />
                  </Button>

                  <Box>
                    <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                      2. Your wallet address (for receiving tokens):
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                      value={userWallet || (accountProfile ? (accountProfile.account || accountProfile.address) : '')}
                      onChange={(e) => setUserWallet(e.target.value)}
                      helperText={accountProfile ? "Using connected wallet" : "Enter your wallet address"}
                      size="small"
                      disabled={!!accountProfile}
                      InputProps={{
                        startAdornment: accountProfile && (
                          <InputAdornment position="start">
                            <CheckCircle sx={{ color: 'success.main', fontSize: 18 }} />
                          </InputAdornment>
                        )
                      }}
                    />
                  </Box>
                </Stack>
              </Paper>

              {/* Debug Info (collapsible) */}
              <details open>
                <summary style={{ cursor: 'pointer', fontSize: '0.8rem', color: theme.palette.text.secondary }}>
                  Session Debug Info
                </summary>
                <Paper sx={{ mt: 1, p: 1.5, bgcolor: alpha(theme.palette.warning.main, 0.05) }}>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', fontSize: '0.7rem' }}>
                    Session ID: {sessionData?.sessionId || 'N/A'}{'\n'}
                    Status: {sessionData?.status || 'awaiting_funding'}{'\n'}
                    Issuer: {sessionData?.issuerAddress || 'N/A'}{'\n'}
                    {sessionData?.holderAddress && `Holder: ${sessionData.holderAddress}\n`}
                    {sessionData?.ammAddress && `AMM: ${sessionData.ammAddress}\n`}
                    {sessionData?.message && `Message: ${sessionData.message}\n`}
                    Funding: {fundingBalance} / {fundingAmount.required} XRP ({Math.round(fundingProgress)}%)
                  </Typography>
                </Paper>
              </details>
            </Stack>
          )}

          {launchStep === 'processing' && (
            <Stack spacing={3}>
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <CircularProgress size={48} sx={{ mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 500, mb: 0.5 }}>
                  Processing token launch...
                </Typography>
                <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.7) }}>
                  This may take a few moments
                </Typography>
              </Box>

              {/* Current Step Alert */}
              {sessionData?.status && (
                <Alert
                  severity="info"
                  icon={<Info />}
                  sx={{
                    borderRadius: '8px',
                    border: `1.5px solid ${alpha(theme.palette.info.main, 0.2)}`,
                    bgcolor: alpha(theme.palette.info.main, 0.05)
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
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
                  </Typography>
                </Alert>
              )}

              {/* Progress Steps List */}
              <Box sx={{
                p: 2,
                bgcolor: alpha(theme.palette.background.default, 0.3),
                borderRadius: '8px',
                border: `1.5px solid ${alpha(theme.palette.divider, 0.08)}`
              }}>
                <Stack spacing={1}>
                  <Typography variant="caption" sx={{ fontSize: '0.85rem', color: alpha(theme.palette.text.secondary, 0.8) }}>
                    • Setting up issuer account
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.85rem', color: alpha(theme.palette.text.secondary, 0.8) }}>
                    • Creating trustlines
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.85rem', color: alpha(theme.palette.text.secondary, 0.8) }}>
                    • Distributing tokens
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.85rem', color: alpha(theme.palette.text.secondary, 0.8) }}>
                    • Creating AMM pool
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.85rem', color: alpha(theme.palette.text.secondary, 0.8) }}>
                    • Blackholing accounts
                  </Typography>
                </Stack>
              </Box>

              {/* Insufficient Funding Warning */}
              {launchLogs.some(log => log.message?.includes('Insufficient')) && (
                <Alert severity="error" sx={{ borderRadius: '8px' }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Insufficient Funding!
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                    The issuer account needs more XRP. Please add at least 15 XRP to continue.
                  </Typography>
                </Alert>
              )}

              {/* Debug Logs Toggle */}
              <Box sx={{ textAlign: 'center' }}>
                <Button
                  size="small"
                  onClick={() => setShowDebugPanel(!showDebugPanel)}
                  sx={{
                    fontSize: '0.85rem',
                    textTransform: 'none',
                    color: theme.palette.primary.main
                  }}
                >
                  {showDebugPanel ? 'Hide' : 'Show'} Debug Logs ({launchLogs.length})
                </Button>
              </Box>

              {/* Debug Logs Panel */}
              {showDebugPanel && launchLogs.length > 0 && (
                <Paper sx={{
                  p: 2,
                  maxHeight: 300,
                  overflow: 'auto',
                  bgcolor: theme.palette.mode === 'dark' ? '#0a0a0a' : '#1a1a1a',
                  border: `1.5px solid ${alpha(theme.palette.divider, 0.1)}`,
                  borderRadius: '8px',
                  fontFamily: 'monospace'
                }}>
                  <Stack spacing={0.3}>
                    {launchLogs.map((log, idx) => (
                      <Typography
                        key={idx}
                        variant="caption"
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          display: 'block',
                          color: log.level === 'error' ? theme.palette.error.main :
                                 log.level === 'warn' ? theme.palette.warning.main :
                                 log.level === 'success' ? theme.palette.success.main :
                                 alpha(theme.palette.common.white, 0.7),
                          lineHeight: 1.8
                        }}
                      >
                        <span style={{ opacity: 0.5 }}>
                          [{new Date(log.timestamp).toLocaleTimeString()}]
                        </span>
                        {' '}
                        <span style={{ fontWeight: 600 }}>
                          [{log.level?.toUpperCase() || 'LOG'}]
                        </span>
                        {' '}
                        {log.message}
                      </Typography>
                    ))}
                  </Stack>
                </Paper>
              )}

              {/* Session ID */}
              {sessionData?.sessionId && (
                <Typography variant="caption" sx={{ textAlign: 'center', color: alpha(theme.palette.text.secondary, 0.6) }}>
                  Session ID: {sessionData.sessionId}
                </Typography>
              )}
            </Stack>
          )}

          {launchStep === 'completed' && sessionData && (
            <Stack spacing={2}>
              <Alert severity="success">
                Your token has been successfully launched on XRPL Testnet!
              </Alert>

              <Box sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.05), borderRadius: 1 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>Token:</strong> {formData.tokenName} ({formData.ticker})
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Total Supply:</strong> {formData.tokenSupply.toLocaleString()}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>AMM Pool:</strong> {Math.floor(formData.tokenSupply * 0.5).toLocaleString()} {formData.ticker} / {formData.ammXrpAmount} XRP
                </Typography>
              </Box>

              {(sessionData.data?.userCheckId || sessionData.userCheckId) && (
                <Paper sx={{ p: 2, bgcolor: checkClaimed ? alpha(theme.palette.success.main, 0.05) : alpha(theme.palette.info.main, 0.05), border: `1px solid ${checkClaimed ? alpha(theme.palette.success.main, 0.2) : alpha(theme.palette.info.main, 0.2)}` }}>
                  <Typography variant="body2" fontWeight={500} gutterBottom>
                    {checkClaimed ? '✅ Tokens Claimed' : '💰 Claim Your Tokens'}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mb: 2, color: alpha(theme.palette.text.secondary, 0.8) }}>
                    {checkClaimed
                      ? `You have successfully claimed ${Math.floor(formData.tokenSupply * (formData.userCheckPercent / 100)).toLocaleString()} ${formData.ticker} tokens`
                      : `You have ${Math.floor(formData.tokenSupply * (formData.userCheckPercent / 100)).toLocaleString()} ${formData.ticker} tokens available to claim`
                    }
                  </Typography>
                  {!checkClaimed && (
                    <Alert severity="info" sx={{ mb: 2, fontSize: '0.85rem' }}>
                      {accountProfile
                        ? 'Click the button below to claim your tokens. You will need to sign a CheckCash transaction.'
                        : 'Connect your wallet to claim your tokens. You need to sign a CheckCash transaction.'
                      }
                    </Alert>
                  )}
                  {checkClaimed && (
                    <Alert severity="success" sx={{ mb: 2, fontSize: '0.85rem' }}>
                      Your tokens have been successfully claimed and are now in your wallet.
                    </Alert>
                  )}
                  <Button
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
                        // Get currency code from formData or sessionData
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

                        // Check if seed is already in profile (session)
                        if (accountProfile.seed) {
                          // Seed available in session
                          wallet = xrpl.Wallet.fromSeed(accountProfile.seed);
                        } else if (accountProfile.wallet_type === 'oauth' || accountProfile.wallet_type === 'social') {
                          // OAuth wallet - need password to decrypt seed
                          const password = prompt('Enter your wallet password to sign the transaction:');
                          if (!password) {
                            setClaiming(false);
                            return;
                          }

                          // Find wallet by social ID
                          const walletId = `${accountProfile.provider}_${accountProfile.provider_id}`;
                          const walletData = await walletStorage.findWalletBySocialId(walletId, password);

                          if (!walletData || !walletData.seed) {
                            openSnackbar?.('Incorrect password or wallet not found', 'error');
                            setClaiming(false);
                            return;
                          }

                          wallet = xrpl.Wallet.fromSeed(walletData.seed);
                        } else if (accountProfile.wallet_type === 'device') {
                          // Device wallet - need password
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

                        const checkCash = {
                          TransactionType: 'CheckCash',
                          Account: wallet.address,
                          CheckID: sessionData.data?.userCheckId || sessionData.userCheckId,
                          Amount: {
                            currency: ticker.length === 3 ? ticker : xrpl.convertStringToHex(ticker).padEnd(40, '0'),
                            issuer: sessionData.issuerAddress || sessionData.data?.issuer,
                            value: String(Math.floor(supply * (checkPercent / 100)))
                          }
                        };

                        const tx = await client.submitAndWait(checkCash, { autofill: true, wallet });
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
                  >
                    {claiming ? 'Claiming...' : checkClaimed ? 'Already Claimed' : accountProfile ? 'Cash Check & Claim Tokens' : 'Connect Wallet to Claim'}
                  </Button>
                  <Typography variant="caption" display="block" sx={{ mt: 1, color: alpha(theme.palette.text.secondary, 0.6) }}>
                    Check ID: {(sessionData.data?.userCheckId || sessionData.userCheckId)?.substring(0, 16)}...
                  </Typography>
                </Paper>
              )}

              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => openInExplorer(sessionData.issuerAddress)}
                  fullWidth
                >
                  View Issuer
                  <OpenInNew sx={{ ml: 0.5, fontSize: 16 }} />
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => openInExplorer(sessionData.ammAddress)}
                  fullWidth
                >
                  View AMM
                  <OpenInNew sx={{ ml: 0.5, fontSize: 16 }} />
                </Button>
              </Stack>

              <Button
                variant="contained"
                fullWidth
                onClick={() => {
                  resetLaunchState();
                  // Reset form
                  setFormData({
                    tokenName: '',
                    ticker: '',
                    description: '',
                    twitter: '',
                    telegram: '',
                    website: '',
                    image: null
                  });
                  setFileName('');
                  setImagePreview('');
                }}
              >
                Done
              </Button>
            </Stack>
          )}

          {launchStep === 'error' && (
            <Stack spacing={2}>
              <Alert severity="error">
                {launchError || 'An error occurred during token launch'}
              </Alert>

              {/* Show debug logs on error */}
              {launchLogs.length > 0 && (
                <Paper sx={{
                  p: 1.5,
                  maxHeight: 300,
                  overflow: 'auto',
                  bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.default, 0.6) : alpha(theme.palette.background.default, 0.9),
                  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
                }}>
                  <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 500 }}>
                    Error Logs:
                  </Typography>
                  <Stack spacing={0.5}>
                    {launchLogs.map((log, idx) => (
                      <Box key={idx} sx={{
                        p: 0.5,
                        borderRadius: 0.5,
                        bgcolor: log.level === 'error' ? alpha(theme.palette.error.main, 0.05) :
                                 log.level === 'warn' ? alpha(theme.palette.warning.main, 0.05) :
                                 'transparent'
                      }}>
                        <Typography variant="caption" sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.7rem',
                          display: 'block',
                          color: log.level === 'error' ? theme.palette.error.main :
                                 log.level === 'warn' ? theme.palette.warning.main :
                                 theme.palette.text.secondary
                        }}>
                          <span style={{ opacity: 0.6 }}>
                            [{new Date(log.timestamp).toLocaleTimeString()}]
                          </span>
                          {' '}
                          {log.message}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              )}

              <Button
                variant="outlined"
                fullWidth
                onClick={() => resetLaunchState()}
              >
                Close
              </Button>
            </Stack>
          )}
          </Paper>
        </Container>
      )}

      <Footer />
    </PageWrapper>
  );
}

export default CreatePage;