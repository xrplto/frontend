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
  font-size: 1.75rem;
  font-weight: 500;
  color: ${props => props.theme?.palette?.text?.primary};
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  font-size: 0.9rem;
  color: ${props => alpha(props.theme?.palette?.text?.secondary, 0.7)};
  margin-bottom: 32px;
`;

const ProgressContainer = styled.div`
  margin-bottom: 32px;
`;

const StepIndicator = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const Step = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: ${props => props.active
    ? props.theme?.palette?.primary?.main
    : alpha(props.theme?.palette?.text?.secondary, 0.5)};
  font-weight: ${props => props.active ? 500 : 400};
`;

const Card = styled.div`
  padding: 18px;
  background: ${props => props.theme?.palette?.mode === 'dark'
    ? alpha(props.theme?.palette?.background?.paper, 0.3)
    : 'rgba(255, 255, 255, 0.6)'};
  border: 1.5px solid ${props => alpha(props.theme?.palette?.divider, 0.12)};
  border-radius: 12px;
  margin-bottom: 16px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: ${props => props.completed
      ? 'linear-gradient(90deg, #4caf50, #45a049)'
      : 'transparent'};
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
`;

const SectionTitle = styled.h3`
  font-size: 1rem;
  font-weight: 500;
  color: ${props => props.theme?.palette?.text?.primary};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Label = styled.label`
  display: block;
  font-size: 0.95rem;
  font-weight: 400;
  color: ${props => props.theme?.palette?.text?.secondary};
  margin-bottom: 8px;
`;

const UploadBox = styled.div`
  border: 2px dashed ${props => props.hasFile
    ? alpha(props.theme?.palette?.success?.main, 0.5)
    : alpha(props.theme?.palette?.divider, 0.25)};
  border-radius: 12px;
  padding: 32px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: ${props => props.hasFile
    ? alpha(props.theme?.palette?.success?.main, 0.05)
    : props.theme?.palette?.mode === 'dark'
      ? alpha(props.theme?.palette?.background?.default, 0.2)
      : alpha(props.theme?.palette?.background?.default, 0.3)};
  position: relative;

  &:hover {
    border-color: ${props => props.hasFile
      ? props.theme?.palette?.success?.main
      : props.theme?.palette?.primary?.main};
    background: ${props => props.hasFile
      ? alpha(props.theme?.palette?.success?.main, 0.08)
      : alpha(props.theme?.palette?.primary?.main, 0.04)};
  }

  &.dragging {
    border-color: ${props => props.theme?.palette?.primary?.main};
    background: ${props => alpha(props.theme?.palette?.primary?.main, 0.08)};
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

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('tokenLaunchSession');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setSessionData(parsed);
        setUserWallet(parsed.userWallet || '');

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

  const handleFileUpload = (file) => {
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
    const maxSize = file.type.startsWith('video/') ? 30 * 1024 * 1024 : 15 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, file: 'Invalid file type' }));
      return;
    }

    if (file.size > maxSize) {
      setErrors(prev => ({ ...prev, file: `File too large (max ${file.type.startsWith('video/') ? '30MB' : '15MB'})` }));
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

      const payload = {
        tokenSupply: String(formData.tokenSupply),
        ammTokenAmount: String(Math.floor(formData.tokenSupply * 0.5)),
        currencyCode: formData.ticker,
        ammXrpAmount: formData.ammXrpAmount
      };

      // Only add optional fields if they have values
      if (walletAddress) payload.userAddress = walletAddress;
      if (formData.userCheckPercent > 0) {
        payload.userCheckAmount = String(Math.floor(formData.tokenSupply * (formData.userCheckPercent / 100)));
      }
      if (formData.website) payload.domain = formData.website.replace(/^https?:\/\//, '');
      if (formData.antiSnipe) payload.antiSnipe = true;

      console.log('[DEBUG] Launch payload:', payload);

      // Step 1: Initialize token launch
      const response = await axios.post('https://api.xrpl.to/api/launch-token', payload);

      // Extract the actual data from response
      const data = response.data.data || response.data;
      setSessionData(data);

      // Save to localStorage
      localStorage.setItem('tokenLaunchSession', JSON.stringify({
        ...data,
        step: 'funding',
        userWallet: walletAddress
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

      {!launchStep && !showSummary && (
      <Container>
        <PageTitle theme={theme}>Create Token</PageTitle>
        <Subtitle theme={theme}>Launch your token on the XRP Ledger</Subtitle>

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
                    {accountProfile.seed || accountProfile.secret || 'N/A'}
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
              height: 4,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.divider, 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 2,
                background: 'linear-gradient(90deg, #4285f4, #66a6ff)'
              }
            }}
          />
        </ProgressContainer>

        <Card theme={theme} completed={formData.tokenName && formData.ticker}>
          <SectionHeader>
            <SectionTitle theme={theme}>
              Token Information
              {formData.tokenName && formData.ticker && (
                <CheckCircle sx={{ fontSize: 18, color: theme.palette.success.main }} />
              )}
            </SectionTitle>
            <Chip
              label="Required"
              size="small"
              sx={{
                fontSize: '0.7rem',
                height: 20,
                backgroundColor: alpha(theme.palette.error.main, 0.1),
                color: theme.palette.error.main
              }}
            />
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

        <Card theme={theme} completed={formData.ammXrpAmount >= 10}>
          <SectionHeader>
            <SectionTitle theme={theme}>
              Initial Liquidity
              {formData.ammXrpAmount >= 10 && (
                <CheckCircle sx={{ fontSize: 18, color: theme.palette.success.main }} />
              )}
            </SectionTitle>
            <Chip
              label="Required"
              size="small"
              sx={{
                fontSize: '0.7rem',
                height: 20,
                backgroundColor: alpha(theme.palette.error.main, 0.1),
                color: theme.palette.error.main
              }}
            />
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

        <Card theme={theme} completed={formData.twitter || formData.telegram || formData.website}>
          <SectionHeader>
            <SectionTitle theme={theme}>
              Social Links
              {(formData.twitter || formData.telegram || formData.website) && (
                <CheckCircle sx={{ fontSize: 18, color: theme.palette.success.main }} />
              )}
            </SectionTitle>
            <Chip
              label="Optional"
              size="small"
              sx={{
                fontSize: '0.7rem',
                height: 20,
                backgroundColor: alpha(theme.palette.info.main, 0.1),
                color: theme.palette.info.main
              }}
            />
          </SectionHeader>

          <Stack spacing={1.5}>
            <StyledTextField
              theme={theme}
              fullWidth
              label="Add your project website"
              variant="outlined"
              placeholder="https://example.com"
              value={formData.website}
              onChange={handleInputChange('website')}
              error={!!errors.website}
              helperText={errors.website || 'Optional'}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Language sx={{ fontSize: 18, color: alpha(theme.palette.text.secondary, 0.4) }} />
                  </InputAdornment>
                ),
              }}
            />

            <Stack direction="row" spacing={1.5}>
              <StyledTextField
                theme={theme}
                fullWidth
                label="Connect your Telegram community"
                variant="outlined"
                placeholder="t.me/yourchannel"
                value={formData.telegram}
                onChange={handleInputChange('telegram')}
                helperText="Optional"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Telegram sx={{ fontSize: 18, color: alpha(theme.palette.text.secondary, 0.4) }} />
                    </InputAdornment>
                  ),
                }}
              />

              <StyledTextField
                theme={theme}
                fullWidth
                label="Link your Twitter/X account"
                variant="outlined"
                placeholder="@yourhandle"
                value={formData.twitter}
                onChange={handleInputChange('twitter')}
                helperText="Optional"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Twitter sx={{ fontSize: 18, color: alpha(theme.palette.text.secondary, 0.4) }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Stack>
          </Stack>
        </Card>

        <Card theme={theme} completed={!!formData.image}>
          <SectionHeader>
            <SectionTitle theme={theme}>
              Upload Media
              {formData.image && (
                <CheckCircle sx={{ fontSize: 18, color: theme.palette.success.main }} />
              )}
            </SectionTitle>
            <Chip
              label="Recommended"
              size="small"
              sx={{
                fontSize: '0.7rem',
                height: 20,
                backgroundColor: alpha(theme.palette.success.main, 0.1),
                color: theme.palette.success.main
              }}
            />
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
                  <CloudUpload sx={{ fontSize: 40, color: alpha(theme.palette.text.secondary, 0.25), mb: 1.5 }} />
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.5, fontWeight: 450 }}>
                    {fileName || 'Drop your file here, or click to browse'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.5) }}>
                    JPG, PNG, GIF or MP4 • Max 15MB (images) / 30MB (video)
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
            accept=".jpg,.jpeg,.gif,.png,.mp4"
            onChange={handleFileInputChange}
          />

          <InfoText theme={theme} style={{ marginTop: 16 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
              <Info sx={{ fontSize: 14, color: alpha(theme.palette.text.secondary, 0.5) }} />
              <strong style={{ fontSize: '0.8rem' }}>Media Requirements</strong>
            </Box>
            <span style={{ fontSize: '0.78rem', lineHeight: 1.4 }}>
              • Images: 1000x1000px minimum, 1:1 ratio recommended<br/>
              • Videos: 1080p+, 16:9 or 9:16 aspect ratio
            </span>
          </InfoText>

          <WarningBox theme={theme}>
            <WarningText theme={theme}>
              ⚠️ Token data cannot be edited after creation
            </WarningText>
          </WarningBox>
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
            {isFormValid() ? 'Create Token' : `Complete Required Fields (${4 - (formData.tokenName ? 1 : 0) - (formData.ticker ? 1 : 0) - (formData.tokenSupply > 0 ? 1 : 0) - (formData.ammXrpAmount >= 10 ? 1 : 0)} remaining)`}
          </Button>
        )}
      </Container>
      )}

      {/* Summary Confirmation */}
      {showSummary && (
        <Container>
          <PageTitle theme={theme}>Review Token Details</PageTitle>
          <Subtitle theme={theme}>Confirm your token settings before launch</Subtitle>

          <Paper sx={{ p: 3, mt: 2 }}>
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="caption" color="text.secondary">Token Name</Typography>
                <Typography variant="h6">{formData.tokenName}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Ticker</Typography>
                <Typography variant="h6">{formData.ticker}</Typography>
              </Box>
              {formData.description && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Description</Typography>
                  <Typography variant="body2">{formData.description}</Typography>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary">Total Supply</Typography>
                <Typography variant="body1">{formData.tokenSupply.toLocaleString()}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">AMM Liquidity</Typography>
                <Typography variant="body1">{Math.floor(formData.tokenSupply * 0.5).toLocaleString()} {formData.ticker} / {formData.ammXrpAmount} XRP</Typography>
              </Box>
              {formData.userCheckPercent > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Your Allocation</Typography>
                  <Typography variant="body1">{Math.floor(formData.tokenSupply * (formData.userCheckPercent / 100)).toLocaleString()} {formData.ticker} ({formData.userCheckPercent}%)</Typography>
                </Box>
              )}
              {formData.antiSnipe && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  Anti-snipe mode enabled (RequireAuth)
                </Alert>
              )}
            </Stack>

            <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => setShowSummary(false)}
                sx={{ py: 1.5, borderRadius: '12px', borderWidth: '1.5px' }}
              >
                Back to Edit
              </Button>
              <Button
                variant="contained"
                fullWidth
                onClick={confirmLaunch}
                sx={{ py: 1.5, borderRadius: '12px' }}
              >
                Confirm & Launch
              </Button>
            </Stack>
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
            <Stack spacing={2}>
              <Box sx={{ textAlign: 'center' }}>
                <CircularProgress sx={{ mb: 2 }} />
                <Typography>Processing token launch...</Typography>
              </Box>

              {/* Progress Steps */}
              <Box sx={{ px: 2 }}>
                {sessionData?.status && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Current Step: <strong>
                      {sessionData.status === 'funded' && 'Funding received, starting launch...'}
                      {sessionData.status === 'configuring_issuer' && 'Configuring issuer account...'}
                      {sessionData.status === 'creating_trustline' && 'Creating trustline...'}
                      {sessionData.status === 'sending_tokens' && 'Minting tokens...'}
                      {sessionData.status === 'creating_checks' && 'Creating user check...'}
                      {sessionData.status === 'creating_amm' && 'Creating AMM pool...'}
                      {sessionData.status === 'scheduling_blackhole' && 'Finalizing and blackholing...'}
                      {!['funded', 'configuring_issuer', 'creating_trustline', 'sending_tokens', 'creating_checks', 'creating_amm', 'scheduling_blackhole'].includes(sessionData.status) && 'Processing...'}
                    </strong>
                  </Alert>
                )}

                <Typography variant="caption" color="text.secondary">
                  • Setting up issuer account<br/>
                  • Creating trustlines<br/>
                  • Distributing tokens<br/>
                  • Creating AMM pool<br/>
                  • Blackholing accounts
                </Typography>
              </Box>

              {/* Check for insufficient funding warning */}
              {launchLogs.some(log => log.message?.includes('Insufficient')) && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <strong>Insufficient Funding!</strong>
                  <Typography variant="caption" display="block">
                    The issuer account needs more XRP. Please add at least 15 XRP to continue.
                  </Typography>
                </Alert>
              )}

              {/* Debug Panel Toggle */}
              <Button
                size="small"
                onClick={() => setShowDebugPanel(!showDebugPanel)}
                sx={{ alignSelf: 'center' }}
              >
                {showDebugPanel ? 'Hide' : 'Show'} Debug Logs ({launchLogs.length})
              </Button>

              {/* Debug Logs - Always visible by default */}
              {showDebugPanel && launchLogs.length > 0 && (
                <Paper sx={{
                  p: 1.5,
                  maxHeight: 300,
                  overflow: 'auto',
                  bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.default, 0.6) : alpha(theme.palette.background.default, 0.9),
                  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
                }}>
                  <Stack spacing={0.5}>
                    {launchLogs.map((log, idx) => (
                      <Box key={idx} sx={{
                        p: 0.5,
                        borderRadius: 0.5,
                        bgcolor: log.level === 'error' ? alpha(theme.palette.error.main, 0.05) :
                                 log.level === 'warn' ? alpha(theme.palette.warning.main, 0.05) :
                                 log.level === 'success' ? alpha(theme.palette.success.main, 0.05) :
                                 'transparent'
                      }}>
                        <Typography variant="caption" sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.7rem',
                          display: 'block',
                          color: log.level === 'error' ? theme.palette.error.main :
                                 log.level === 'warn' ? theme.palette.warning.main :
                                 log.level === 'success' ? theme.palette.success.main :
                                 theme.palette.text.secondary
                        }}>
                          <span style={{ opacity: 0.6 }}>
                            [{new Date(log.timestamp).toLocaleTimeString()}]
                          </span>
                          {' '}
                          <span style={{ fontWeight: 500 }}>
                            [{log.level?.toUpperCase() || 'LOG'}]
                          </span>
                          {' '}
                          {log.message}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              )}

              {/* Session ID for debugging */}
              {sessionData?.sessionId && (
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Session ID: <code>{sessionData.sessionId}</code>
                  </Typography>
                </Box>
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
                      Connect your wallet to claim your tokens. You need to sign a CheckCash transaction.
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
                      if (!accountProfile?.seed) {
                        openSnackbar?.('Wallet seed not available', 'error');
                        return;
                      }
                      setClaiming(true);
                      try {
                        const client = new xrpl.Client('wss://s.altnet.rippletest.net:51233');
                        await client.connect();

                        const wallet = xrpl.Wallet.fromSeed(accountProfile.seed);
                        const checkCash = {
                          TransactionType: 'CheckCash',
                          Account: wallet.address,
                          CheckID: sessionData.data?.userCheckId || sessionData.userCheckId,
                          Amount: {
                            currency: formData.ticker.length === 3 ? formData.ticker : xrpl.convertStringToHex(formData.ticker).padEnd(40, '0'),
                            issuer: sessionData.issuerAddress || sessionData.data.issuer,
                            value: String(Math.floor(formData.tokenSupply * (formData.userCheckPercent / 100)))
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