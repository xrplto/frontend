import React, { useState, useRef, useContext } from 'react';
import styled from '@emotion/styled';
import { useTheme, alpha } from '@mui/material/styles';
import { Button, TextField, Stack, InputAdornment, Box, Typography, LinearProgress, Chip, Dialog, DialogTitle, DialogContent, CircularProgress, Alert, Paper } from '@mui/material';
import { Twitter, Telegram, Language, CloudUpload, CheckCircle, Info, ContentCopy, OpenInNew, AccountBalanceWallet } from '@mui/icons-material';
import axios from 'axios';
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
  padding: 24px;
  background: ${props => props.theme?.palette?.mode === 'dark'
    ? alpha(props.theme?.palette?.background?.paper, 0.3)
    : 'rgba(255, 255, 255, 0.6)'};
  border: 1.5px solid ${props => alpha(props.theme?.palette?.divider, 0.12)};
  border-radius: 12px;
  margin-bottom: 20px;
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
  margin-bottom: 20px;
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
  const { accountProfile } = useContext(AppContext);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    tokenName: '',
    ticker: '',
    description: '',
    twitter: '',
    telegram: '',
    website: '',
    image: null
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
        else if (value.length > 10) newErrors.ticker = 'Maximum 10 characters';
        else if (!/^[A-Z0-9]+$/.test(value.toUpperCase())) newErrors.ticker = 'Only letters and numbers allowed';
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
    const value = field === 'ticker' ? event.target.value.toUpperCase() : event.target.value;
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
    setErrors(prev => ({ ...prev, file: null }));

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
    return formData.tokenName && formData.ticker && !Object.keys(errors).length;
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

  const handleSubmit = async () => {
    if (!isFormValid()) return;

    // Use connected wallet address if available, otherwise prompt in dialog
    if (accountProfile) {
      setUserWallet(accountProfile.account || accountProfile.address);
    }

    setLaunchDialog(true);
    setLaunchStep('initializing');
    setLaunchError('');

    try {
      // Step 1: Initialize token launch
      const response = await axios.post('https://api.xrpl.to/api/launch-token', {
        currencyCode: formData.ticker,
        tokenSupply: '1000000000',  // 1 billion tokens
        userCheckAmount: '100000000',  // 100M tokens for user
        ammXrpAmount: 500,  // 500 XRP for AMM
        ammTokenAmount: '500000000',  // 500M tokens for AMM
        metadata: {
          name: formData.tokenName,
          description: formData.description,
          twitter: formData.twitter,
          telegram: formData.telegram,
          website: formData.website
        }
      });

      setSessionData(response.data);
      setLaunchStep('funding');

    } catch (error) {
      console.error('Launch error:', error);
      setLaunchError(error.response?.data?.error || 'Failed to initialize token launch');
      setLaunchStep('error');
    }
  };

  const handleContinueLaunch = async () => {
    if (!sessionData?.sessionId || !userWallet) return;

    setLaunchStep('processing');
    setLaunchError('');

    try {
      const response = await axios.post('https://api.xrpl.to/api/launch-token/continue', {
        sessionId: sessionData.sessionId,
        userAddress: userWallet
      });

      if (response.data.status === 'completed') {
        setLaunchStep('completed');
        setSessionData(response.data);
      } else {
        // Poll for status
        pollLaunchStatus(sessionData.sessionId);
      }
    } catch (error) {
      console.error('Continue error:', error);
      setLaunchError(error.response?.data?.error || 'Failed to continue launch');
      setLaunchStep('error');
    }
  };

  const pollLaunchStatus = async (sessionId) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`https://api.xrpl.to/api/launch-token/status/${sessionId}`);

        if (response.data.status === 'completed') {
          clearInterval(interval);
          setLaunchStep('completed');
          setSessionData(response.data);
        } else if (response.data.status === 'error') {
          clearInterval(interval);
          setLaunchError(response.data.error || 'Launch failed');
          setLaunchStep('error');
        }
      } catch (error) {
        clearInterval(interval);
        setLaunchError('Failed to check status');
        setLaunchStep('error');
      }
    }, 3000);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const openInExplorer = (address) => {
    window.open(`https://testnet.xrpl.org/accounts/${address}`, '_blank');
  };

  return (
    <PageWrapper>
      <Header />

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

          <Stack spacing={2}>
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
              fullWidth
              label="Add a token ticker (e.g. SCRAP)"
              variant="outlined"
              placeholder="TICKER"
              value={formData.ticker}
              onChange={handleInputChange('ticker')}
              error={!!errors.ticker}
              helperText={
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{errors.ticker || 'Required'}</span>
                  <CharCounter error={formData.ticker.length > 10} theme={theme}>
                    {formData.ticker.length}/10
                  </CharCounter>
                </Box>
              }
              size="small"
              required
            />

            <StyledTextField
              theme={theme}
              fullWidth
              label="Write a short description"
              variant="outlined"
              placeholder="Tell people what makes your token special..."
              multiline
              rows={3}
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
          </Stack>
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

          <Stack spacing={2}>
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
          {isFormValid() ? 'Create Token' : `Complete Required Fields (${2 - (formData.tokenName ? 1 : 0) - (formData.ticker ? 1 : 0)} remaining)`}
        </Button>
      </Container>

      <Footer />

      {/* Launch Dialog */}
      <Dialog open={launchDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {launchStep === 'initializing' && 'Initializing Token Launch'}
          {launchStep === 'funding' && 'Fund Issuer Account'}
          {launchStep === 'processing' && 'Creating Your Token'}
          {launchStep === 'completed' && 'Token Launch Complete!'}
          {launchStep === 'error' && 'Launch Failed'}
        </DialogTitle>
        <DialogContent>
          {launchStep === 'initializing' && (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography>Setting up token parameters...</Typography>
            </Box>
          )}

          {launchStep === 'funding' && sessionData && (
            <Stack spacing={2}>
              <Alert severity="info">
                Please fund the issuer account with at least 15 XRP to continue
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  • 1 XRP base reserve + 0.2 XRP per object (trustline, AMM, etc.)
                </Typography>
              </Alert>

              <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">Issuer Address</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {sessionData.issuerAddress}
                  </Typography>
                  <Button size="small" onClick={() => copyToClipboard(sessionData.issuerAddress)}>
                    <ContentCopy fontSize="small" />
                  </Button>
                </Box>
              </Box>

              <Button
                variant="contained"
                href={`https://faucet.altnet.rippletest.net/?destination=${sessionData.issuerAddress}`}
                target="_blank"
                sx={{ mb: 2 }}
              >
                Open XRP Testnet Faucet
                <OpenInNew sx={{ ml: 1, fontSize: 18 }} />
              </Button>

              <TextField
                fullWidth
                label="Your XRPL Wallet Address"
                placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                value={userWallet || (accountProfile ? (accountProfile.account || accountProfile.address) : '')}
                onChange={(e) => setUserWallet(e.target.value)}
                helperText={accountProfile ? "Using connected wallet address" : "Enter your wallet address to receive tokens"}
                size="small"
                disabled={!!accountProfile}
              />

              <Button
                variant="outlined"
                fullWidth
                onClick={handleContinueLaunch}
                disabled={!userWallet || userWallet.length < 25}
              >
                Continue Launch
              </Button>
            </Stack>
          )}

          {launchStep === 'processing' && (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Stack spacing={1}>
                <Typography>Processing token launch...</Typography>
                <Typography variant="caption" color="text.secondary">
                  • Setting up issuer account<br/>
                  • Creating trustlines<br/>
                  • Distributing tokens<br/>
                  • Creating AMM pool<br/>
                  • Blackholing accounts
                </Typography>
              </Stack>
            </Box>
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
                  <strong>Total Supply:</strong> 1,000,000,000
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>AMM Pool:</strong> 500M {formData.ticker} / 500 XRP
                </Typography>
                {sessionData.checkId && (
                  <Typography variant="body2">
                    <strong>Check ID:</strong> {sessionData.checkId.substring(0, 8)}...
                  </Typography>
                )}
              </Box>

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
                  setLaunchDialog(false);
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
              <Button
                variant="outlined"
                fullWidth
                onClick={() => setLaunchDialog(false)}
              >
                Close
              </Button>
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}

export default CreatePage;