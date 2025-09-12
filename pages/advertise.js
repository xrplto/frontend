import React, { useState, useEffect, useCallback, useContext } from 'react';
import styled from '@emotion/styled';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  Button,
  TextField,
  Alert,
  Chip,
  alpha,
  useTheme,
  Divider,
  Stack,
  Paper,
  IconButton,
  Tooltip,
  Fade,
  Grow,
  Autocomplete,
  CircularProgress
} from '@mui/material';
import axios from 'axios';
import {
  ContentCopy as CopyIcon,
  CheckCircle as CheckIcon,
  TrendingUp as TrendingIcon,
  Speed as SpeedIcon,
  Visibility as ViewIcon,
  AccountBalanceWallet as WalletIcon,
  Timer as TimerIcon,
  Info as InfoIcon,
  Calculate as CalculateIcon,
  Campaign as CampaignIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';
import Topbar from 'src/components/Topbar';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import useDebounce from 'src/hooks/useDebounce';
import { AppContext } from 'src/AppContext';
import ConnectWallet from 'src/components/ConnectWallet';
import { useDispatch, useSelector } from 'react-redux';
import { selectProcess, updateProcess, updateTxHash } from 'src/redux/transactionSlice';
import { isInstalled, submitTransaction } from '@gemwallet/api';
import sdk from '@crossmarkio/sdk';
import { enqueueSnackbar } from 'notistack';
import QRDialog from 'src/components/QRDialog';
import Decimal from 'decimal.js';

const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${props => props.theme.palette.mode === 'dark' 
    ? 'linear-gradient(180deg, #000000 0%, #0a0a0a 100%)'
    : 'linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%)'};
`;

const MainContent = styled.main`
  flex: 1;
  padding: 60px 0;
  @media (max-width: 768px) {
    padding: 40px 0;
  }
`;

const HeroSection = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  marginBottom: 48,
  padding: '48px 0',
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(135deg, ${alpha('#147DFE', 0.1)} 0%, ${alpha('#147DFE', 0.05)} 100%)`
    : `linear-gradient(135deg, ${alpha('#147DFE', 0.05)} 0%, ${alpha('#147DFE', 0.02)} 100%)`,
  borderRadius: 16,
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at top right, rgba(20, 125, 254, 0.15) 0%, transparent 50%)',
    pointerEvents: 'none'
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at bottom left, rgba(156, 39, 176, 0.1) 0%, transparent 50%)',
    pointerEvents: 'none'
  }
}));

const PriceTag = styled(Typography)`
  font-size: 3rem;
  font-weight: bold;
  color: #1976d2;
  margin: 20px 0;
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 20px 0;
  li {
    padding: 8px 0;
    &:before {
      content: "✓ ";
      color: #4caf50;
      font-weight: bold;
    }
  }
`;

const ContactForm = styled(Box)(({ theme }) => ({
  background: theme.palette.mode === 'dark' 
    ? `linear-gradient(135deg, 
        ${alpha('#111827', 0.5)} 0%, 
        ${alpha('#111827', 0.3)} 50%,
        ${alpha('#111827', 0.4)} 100%)`
    : '#f5f5f5',
  border: `1px solid ${theme.palette.mode === 'dark' 
    ? alpha('#1F2937', 0.15) 
    : 'transparent'}`,
  backdropFilter: theme.palette.mode === 'dark' ? 'blur(60px) saturate(180%)' : 'none',
  borderRadius: 8,
  padding: 32,
  marginTop: 48
}));

const API_URL = process.env.API_URL || 'https://api.xrpl.to/api';

export default function Advertise() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { accountProfile, openSnackbar, sync, setSync, setOpenWalletModal, setLoading } = useContext(AppContext);
  const process = useSelector(selectProcess);
  
  const [impressionInput, setImpressionInput] = useState('');
  const [customImpressions, setCustomImpressions] = useState('');
  const [copied, setCopied] = useState(false);
  const [tokens, setTokens] = useState([]);
  const [selectedToken, setSelectedToken] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [xrpRate, setXrpRate] = useState(0.65); // Default fallback rate
  const [totalTokens, setTotalTokens] = useState(0);
  
  // Payment states
  const [openScanQR, setOpenScanQR] = useState(false);
  const [uuid, setUuid] = useState(null);
  const [qrUrl, setQrUrl] = useState(null);
  const [nextUrl, setNextUrl] = useState(null);
  const [destinationTag, setDestinationTag] = useState(Math.floor(Math.random() * 1000000) + 100000);
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Load top tokens initially
  useEffect(() => {
    fetchTopTokens();
  }, []);

  // Search tokens when query changes
  useEffect(() => {
    if (debouncedSearchQuery) {
      searchTokens(debouncedSearchQuery);
    } else {
      fetchTopTokens();
    }
  }, [debouncedSearchQuery]);

  const fetchTopTokens = async () => {
    setLocalLoading(true);
    try {
      const response = await axios.get(`${API_URL}/tokens?limit=100&sortBy=vol24hxrp&sortType=desc`);
      
      // Get total tokens count
      if (response.data.total) {
        setTotalTokens(response.data.total);
      }
      
      // Get XRP rate from the API response
      if (response.data.exch && response.data.exch.USD) {
        setXrpRate(1 / response.data.exch.USD); // Convert USD to XRP rate
      }
      
      const tokenList = response.data.tokens.map(token => ({
        label: `${token.name || token.currencyCode} - ${token.issuer?.substring(0, 8)}...`,
        value: token.md5,
        currency: token.currencyCode,
        name: token.name,
        issuer: token.issuer,
        marketcap: parseFloat(token.marketcap) || 0,
        price: parseFloat(token.exch) || parseFloat(token.price) || 0,
        volume24h: parseFloat(token.vol24hxrp) || 0,
        change24h: parseFloat(token.pro24h) || 0,
        trustlines: token.trustlines || 0
      }));
      setTokens(tokenList);
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
    } finally {
      setLocalLoading(false);
    }
  };

  const searchTokens = async (query) => {
    setLocalLoading(true);
    try {
      const response = await axios.post(`${API_URL}/search`, { search: query });
      if (response.data?.tokens) {
        const tokenList = response.data.tokens.map(token => ({
          label: `${token.user || token.name} - ${token.name || ''}`,
          value: token.md5,
          currency: token.currency,
          name: token.name,
          user: token.user,
          marketcap: parseFloat(token.marketcap) || 0,
          price: parseFloat(token.exch) || 0,
          volume24h: parseFloat(token.vol24hxrp) || 0,
          change24h: parseFloat(token.pro24h) || 0,
          verified: token.verified || false
        }));
        setTokens(tokenList);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLocalLoading(false);
    }
  };

  // Fixed pricing tiers for quick selection
  const pricingTiers = [
    { impressions: 10000, price: 299, label: '10k views' },
    { impressions: 25000, price: 699, label: '25k views' },
    { impressions: 50000, price: 999, label: '50k views' },
    { impressions: 100000, price: 1999, label: '100k views' },
    { impressions: 200000, price: 3999, label: '200k views' },
    { impressions: 400000, price: 6999, label: '400k views' }
  ];

  const calculatePrice = (impressions) => {
    // Check if it matches a tier exactly
    const tier = pricingTiers.find(t => t.impressions === impressions);
    if (tier) return tier.price;
    
    // For custom amounts, use progressive pricing
    if (impressions <= 0) return 0;
    
    // Calculate based on volume brackets
    let price = 0;
    let remaining = impressions;
    
    // Pricing structure (per 1000 impressions)
    const brackets = [
      { max: 10000, rate: 29.9 },     // $29.9 per 1k for first 10k
      { max: 25000, rate: 27.96 },    // $27.96 per 1k for 10k-25k
      { max: 50000, rate: 19.98 },    // $19.98 per 1k for 25k-50k  
      { max: 100000, rate: 19.99 },   // $19.99 per 1k for 50k-100k
      { max: 200000, rate: 19.995 },  // $19.995 per 1k for 100k-200k
      { max: 400000, rate: 17.495 },  // $17.495 per 1k for 200k-400k
      { max: Infinity, rate: 15 }     // $15 per 1k above 400k
    ];
    
    let prevMax = 0;
    for (const bracket of brackets) {
      const bracketSize = Math.min(remaining, bracket.max - prevMax);
      if (bracketSize > 0) {
        price += (bracketSize / 1000) * bracket.rate;
        remaining -= bracketSize;
        prevMax = bracket.max;
      }
      if (remaining <= 0) break;
    }
    
    return Math.round(price);
  };

  const getCPMRate = (impressions) => {
    const price = calculatePrice(impressions);
    return price ? (price / (impressions / 1000)) : 0;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const handleImpressionChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setImpressionInput(value ? formatNumber(value) : '');
    setCustomImpressions(value);
  };

  // Handle wallet payment
  const handlePayment = async () => {
    if (!accountProfile || !accountProfile.account) {
      setOpenWalletModal(true);
      return;
    }

    const Account = accountProfile.account;
    const user_token = accountProfile.user_token;
    const wallet_type = accountProfile.wallet_type;
    const xrpAmount = (calculatePrice(parseInt(customImpressions)) / xrpRate).toFixed(6);
    const xrpDrops = new Decimal(xrpAmount).mul(1000000).toString();

    const transactionData = {
      TransactionType: 'Payment',
      Account,
      Destination: 'rN7n7otQDd6FczFgLdAtqCSVvUV6jGUMxt',
      Amount: xrpDrops,
      DestinationTag: destinationTag,
      Fee: '12',
      Memos: [
        {
          Memo: {
            MemoType: Buffer.from('advertising', 'utf8').toString('hex').toUpperCase(),
            MemoData: Buffer.from(JSON.stringify({
              token: selectedToken?.name || selectedToken?.currency,
              impressions: customImpressions,
              price: calculatePrice(parseInt(customImpressions))
            }), 'utf8').toString('hex').toUpperCase()
          }
        }
      ]
    };

    try {
      switch (wallet_type) {
        case 'xaman':
          setLocalLoading(true);
          const body = {
            ...transactionData,
            user_token
          };

          console.log('Sending Xaman payment request:', body);
          const res = await axios.post(`${API_URL}/offer/payment`, body);

          if (res.status === 200 && res.data?.data) {
            const uuid = res.data.data.uuid;
            const qrlink = res.data.data.qrUrl;
            const nextlink = res.data.data.next;

            setUuid(uuid);
            setQrUrl(qrlink);
            setNextUrl(nextlink);
            setOpenScanQR(true);
            setLocalLoading(false);
          } else {
            throw new Error('Invalid response from payment API');
          }
          break;

        case 'gem':
          isInstalled().then(async (response) => {
            if (response.result.isInstalled) {
              dispatch(updateProcess(1));

              await submitTransaction({
                transaction: transactionData
              }).then(({ type, result }) => {
                if (type == 'response') {
                  dispatch(updateProcess(2));
                  dispatch(updateTxHash(result?.hash));
                  setTimeout(() => {
                    setSync(sync + 1);
                    dispatch(updateProcess(0));
                    openSnackbar('Payment successful! Your advertising campaign will start shortly.', 'success');
                    // Reset form
                    setCustomImpressions('');
                    setImpressionInput('');
                    setSelectedToken(null);
                    setInputValue('');
                  }, 1500);
                } else {
                  dispatch(updateProcess(3));
                  openSnackbar('Payment cancelled', 'error');
                }
              });
            } else {
              enqueueSnackbar('GemWallet is not installed', { variant: 'error' });
            }
          });
          break;

        case 'crossmark':
          dispatch(updateProcess(1));
          await sdk.methods.signAndSubmitAndWait(transactionData).then(({ response }) => {
            if (response.data.meta.isSuccess) {
              dispatch(updateProcess(2));
              dispatch(updateTxHash(response.data.resp.result?.hash));
              setTimeout(() => {
                setSync(sync + 1);
                dispatch(updateProcess(0));
                openSnackbar('Payment successful! Your advertising campaign will start shortly.', 'success');
                // Reset form
                setCustomImpressions('');
                setImpressionInput('');
                setSelectedToken(null);
                setInputValue('');
              }, 1500);
            } else {
              dispatch(updateProcess(3));
              openSnackbar('Payment cancelled', 'error');
            }
          });
          break;
      }
    } catch (err) {
      console.error('Payment error:', err);
      console.error('Error details:', err.response?.data || err.message);
      dispatch(updateProcess(0));
      setLocalLoading(false);
      const errorMessage = err.response?.data?.message || 'Payment failed. Please try again.';
      openSnackbar(errorMessage, 'error');
    }
  };

  // Handle QR scan completion for Xaman
  useEffect(() => {
    if (!openScanQR || !uuid) return;

    const checkPayment = setInterval(async () => {
      try {
        const ret = await axios.get(`${API_URL}/xumm/payload/${uuid}`);
        const res = ret.data.data.response;
        const resolved_at = res.resolved_at;
        const dispatched_result = res.dispatched_result;

        if (resolved_at && dispatched_result === 'tesSUCCESS') {
          setOpenScanQR(false);
          openSnackbar('Payment successful! Your advertising campaign will start shortly.', 'success');
          // Reset form
          setCustomImpressions('');
          setImpressionInput('');
          setSelectedToken(null);
          setInputValue('');
          clearInterval(checkPayment);
        }
      } catch (err) {
        console.log('Error checking payment status:', err);
      }
    }, 2000);

    return () => clearInterval(checkPayment);
  }, [openScanQR, uuid]);

  const handleScanQRClose = () => {
    setOpenScanQR(false);
  };

  return (
    <PageWrapper>
      <Topbar />
      <Header />
      <MainContent>
        <Container maxWidth="lg">
          <Fade in timeout={600}>
            <HeroSection>
              <Stack spacing={2} alignItems="center" position="relative" zIndex={1}>
                <Chip 
                  icon={<CampaignIcon />}
                  label="Token Advertising Platform" 
                  color="primary" 
                  sx={{ 
                    fontWeight: 600,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.8)})`,
                    color: 'white'
                  }}
                />
                <Typography 
                  variant="h3" 
                  fontWeight={700}
                  sx={{
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, #fff 0%, #b3b3b3 100%)'
                      : 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 2
                  }}
                >
                  Reach Millions on XRPL
                </Typography>
                <Typography 
                  variant="h6" 
                  color="text.secondary" 
                  maxWidth={600}
                  sx={{ lineHeight: 1.6 }}
                >
                  Promote your token to our engaged community of traders and investors.
                  Simple pricing, instant activation, real-time analytics.
                </Typography>
                <Stack direction="row" spacing={2} mt={3}>
                  <Chip 
                    icon={<ViewIcon />}
                    label="40K+ Monthly Users" 
                    variant="outlined"
                    sx={{ fontWeight: 500 }}
                  />
                  <Chip 
                    icon={<TrendingIcon />}
                    label={totalTokens > 0 ? `${totalTokens.toLocaleString()} Tokens` : "Loading..."} 
                    variant="outlined"
                    sx={{ fontWeight: 500 }}
                  />
                  <Chip 
                    icon={<SpeedIcon />}
                    label="Instant Activation" 
                    variant="outlined"
                    sx={{ fontWeight: 500 }}
                  />
                </Stack>
              </Stack>
            </HeroSection>
          </Fade>

          <Grow in timeout={800}>
            <Paper 
              elevation={theme.palette.mode === 'dark' ? 0 : 3}
              sx={{ 
                maxWidth: 700, 
                mx: 'auto', 
                mb: 6,
                overflow: 'hidden',
                background: theme.palette.mode === 'dark' 
                  ? `linear-gradient(135deg, 
                      ${alpha('#111827', 0.5)} 0%, 
                      ${alpha('#111827', 0.3)} 50%,
                      ${alpha('#111827', 0.4)} 100%)`
                  : theme.palette.background.paper,
                border: `1px solid ${theme.palette.mode === 'dark' 
                  ? alpha('#1F2937', 0.15) 
                  : 'transparent'}`,
                backdropFilter: theme.palette.mode === 'dark' ? 'blur(60px) saturate(180%)' : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              <Box 
                sx={{ 
                  p: 3, 
                  background: `linear-gradient(135deg, 
                    ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.15 : 0.08)} 0%, 
                    ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.08 : 0.03)} 100%)`,
                  borderBottom: `3px solid ${theme.palette.primary.main}`,
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 1,
                    background: `linear-gradient(90deg, transparent, ${theme.palette.primary.main}, transparent)`,
                    animation: 'shimmer 3s infinite'
                  }
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.5}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.7)})`,
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
                    }}
                  >
                    <CalculateIcon sx={{ color: 'white' }} />
                  </Box>
                  <Typography variant="h5" fontWeight={700}>
                    Advertising Calculator
                  </Typography>
                </Stack>
              </Box>
              
              <Box p={4}>
                <Grid container spacing={3} mb={3}>
                  <Grid item xs={12}>
                    <Autocomplete
                      value={selectedToken}
                      onChange={(event, newValue) => setSelectedToken(newValue)}
                      inputValue={inputValue}
                      onInputChange={(event, newInputValue, reason) => {
                        setInputValue(newInputValue);
                        if (reason === 'input') {
                          setSearchQuery(newInputValue);
                        }
                      }}
                      options={tokens}
                      localLoading={localLoading}
                      filterOptions={(x) => x}
                      getOptionLabel={(option) => option.label}
                      noOptionsText={searchQuery ? "No tokens found" : "Start typing to search"}
                      renderOption={(props, option) => (
                        <Box 
                          component="li" 
                          {...props}
                          sx={{
                            '&:hover': {
                              background: alpha(theme.palette.primary.main, 0.08)
                            }
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={2} width="100%">
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                overflow: 'hidden',
                                border: `2px solid ${option.change24h >= 0 ? alpha('#4caf50', 0.3) : alpha('#f44336', 0.3)}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: option.change24h >= 0 
                                  ? `linear-gradient(135deg, ${alpha('#4caf50', 0.1)}, ${alpha('#4caf50', 0.05)})`
                                  : `linear-gradient(135deg, ${alpha('#f44336', 0.1)}, ${alpha('#f44336', 0.05)})`
                              }}
                            >
                              <img 
                                src={`https://s1.xrpl.to/token/${option.value}`}
                                alt={option.name || option.currency}
                                style={{ 
                                  width: '100%', 
                                  height: '100%', 
                                  objectFit: 'cover' 
                                }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentElement.innerHTML = `<span style="font-weight: 700; font-size: 0.875rem; color: ${option.change24h >= 0 ? '#4caf50' : '#f44336'}">${(option.name || option.currency)?.charAt(0)?.toUpperCase() || '?'}</span>`;
                                }}
                              />
                            </Box>
                            <Box flex={1}>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography variant="body2" fontWeight={600}>
                                  {option.user || option.name || option.currency}
                                </Typography>
                                {option.verified && (
                                  <Chip 
                                    label="Verified" 
                                    size="small" 
                                    color="primary" 
                                    sx={{ height: 18, fontSize: '0.7rem' }}
                                  />
                                )}
                                {option.volume24h > 10000 && (
                                  <Chip 
                                    label="High Volume" 
                                    size="small" 
                                    color="success" 
                                    sx={{ height: 18, fontSize: '0.7rem' }}
                                  />
                                )}
                              </Stack>
                              <Stack direction="row" spacing={2}>
                                <Typography variant="caption" color="text.secondary">
                                  Vol: {option.volume24h > 1000000 
                                    ? `${(option.volume24h / 1000000).toFixed(1)}M` 
                                    : option.volume24h > 1000 
                                    ? `${(option.volume24h / 1000).toFixed(1)}K`
                                    : option.volume24h.toFixed(0)} XRP
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {option.price < 0.00000001 
                                    ? option.price.toFixed(12)
                                    : option.price < 0.0000001
                                    ? option.price.toFixed(10)
                                    : option.price < 0.000001
                                    ? option.price.toFixed(8)
                                    : option.price < 0.0001
                                    ? option.price.toFixed(6)
                                    : option.price < 1
                                    ? option.price.toFixed(4)
                                    : option.price.toFixed(2)} XRP
                                </Typography>
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    color: option.change24h >= 0 ? '#4caf50' : '#f44336',
                                    fontWeight: 600
                                  }}
                                >
                                  {option.change24h >= 0 ? '+' : ''}{option.change24h?.toFixed(2)}%
                                </Typography>
                              </Stack>
                            </Box>
                          </Stack>
                        </Box>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Select Token to Advertise"
                          placeholder={searchQuery ? "Searching all tokens..." : "Type to search tokens or select from top 100..."}
                          helperText={
                            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <TrendingIcon sx={{ fontSize: 14 }} />
                              {searchQuery 
                                ? `Searching for "${searchQuery}"...` 
                                : totalTokens > 0 
                                  ? `Showing top ${tokens.length} of ${totalTokens.toLocaleString()} total tokens by 24h volume`
                                  : "Showing top 100 most traded tokens - type to search all tokens"}
                            </Typography>
                          }
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {localLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
                
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={7}>
                    <TextField
                      fullWidth
                      label="Number of Impressions"
                      value={impressionInput}
                      onChange={handleImpressionChange}
                      placeholder="Enter any amount"
                      variant="outlined"
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          fontSize: '1.2rem',
                          fontWeight: 500,
                          transition: 'all 0.3s',
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: `0 4px 8px ${alpha(theme.palette.primary.main, 0.1)}`
                          },
                          '&.Mui-focused': {
                            transform: 'translateY(-1px)',
                            boxShadow: `0 6px 12px ${alpha(theme.palette.primary.main, 0.15)}`
                          }
                        }
                      }}
                      InputProps={{
                        startAdornment: (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              mr: 1,
                              animation: 'pulse 2s infinite'
                            }}
                          >
                            <AutoAwesomeIcon sx={{ color: 'primary.main' }} />
                          </Box>
                        )
                      }}
                      helperText={
                        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <InfoIcon sx={{ fontSize: 14 }} />
                          Enter any amount or click packages below for popular options
                        </Typography>
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={5}>
                    {customImpressions && parseInt(customImpressions) > 0 ? (
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2.5,
                          background: `linear-gradient(135deg, 
                            ${alpha(theme.palette.primary.main, 0.08)} 0%, 
                            ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
                          border: `2px solid ${theme.palette.primary.main}`,
                          borderRadius: 3,
                          textAlign: 'center',
                          position: 'relative',
                          overflow: 'hidden',
                          transition: 'all 0.3s',
                          animation: 'slideInRight 0.5s ease-out',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: -2,
                            left: -2,
                            right: -2,
                            bottom: -2,
                            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.3)})`,
                            borderRadius: 3,
                            opacity: 0,
                            transition: 'opacity 0.3s',
                            zIndex: -1
                          },
                          '&:hover::before': {
                            opacity: 0.1
                          }
                        }}
                      >
                        <Stack spacing={1} alignItems="center">
                          <Typography variant="overline" color="text.secondary" fontWeight={600}>
                            Total Cost
                          </Typography>
                          <Typography 
                            variant="h3" 
                            fontWeight={800} 
                            sx={{
                              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.7)})`,
                              backgroundClip: 'text',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              textShadow: `0 2px 4px ${alpha(theme.palette.primary.main, 0.1)}`
                            }}
                          >
                            {formatPrice(calculatePrice(parseInt(customImpressions)))}
                          </Typography>
                          <Chip
                            icon={<AutoAwesomeIcon />}
                            label={`≈ ${(calculatePrice(parseInt(customImpressions)) / xrpRate).toFixed(2)} XRP`}
                            color="primary"
                            variant="outlined"
                            sx={{ fontWeight: 600 }}
                          />
                        </Stack>
                        <Button
                          variant="contained"
                          color="primary"
                          fullWidth
                          sx={{ mt: 2 }}
                          startIcon={<WalletIcon />}
                          disabled={!selectedToken}
                          onClick={() => {
                            document.getElementById('payment-section')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          {selectedToken ? 'Pay with XRP' : 'Select Token First'}
                        </Button>
                      </Paper>
                    ) : (
                      <Box sx={{ 
                        p: 4, 
                        border: '2px dashed',
                        borderColor: 'divider',
                        borderRadius: 2,
                        textAlign: 'center'
                      }}>
                        <Typography variant="body2" color="text.secondary">
                          Enter impressions to see price
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                </Grid>

                
                <Box 
                  sx={{ 
                    mt: 3, 
                    p: 2.5, 
                    bgcolor: theme.palette.mode === 'dark' 
                      ? alpha('#1F2937', 0.2)
                      : 'grey.50', 
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.mode === 'dark' 
                      ? alpha('#1F2937', 0.15) 
                      : alpha('#000', 0.05)}`
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingIcon fontSize="small" />
                      Quick Buy Packages
                    </Typography>
                    <Chip 
                      label="Best Value" 
                      size="small" 
                      color="success" 
                      sx={{ fontWeight: 600 }}
                    />
                  </Stack>
                  <Grid container spacing={1}>
                    {pricingTiers.map((tier, index) => (
                      <Grid item xs={12} sm={6} key={index}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            bgcolor: theme.palette.mode === 'dark' 
                              ? alpha('#1F2937', 0.1)
                              : 'grey.50',
                            border: '2px solid',
                            borderColor: theme.palette.mode === 'dark' 
                              ? alpha('#1F2937', 0.2)
                              : 'divider',
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative',
                            overflow: 'hidden',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: -100,
                              width: '100%',
                              height: '100%',
                              background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.1)}, transparent)`,
                              transition: 'left 0.5s'
                            },
                            '&:hover': {
                              borderColor: theme.palette.primary.main,
                              bgcolor: alpha(theme.palette.primary.main, 0.08),
                              transform: 'translateY(-2px) scale(1.02)',
                              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                              '&::before': {
                                left: '100%'
                              }
                            },
                            '&:active': {
                              transform: 'translateY(0) scale(1)'
                            }
                          }}
                          onClick={() => {
                            setImpressionInput(formatNumber(tier.impressions));
                            setCustomImpressions(tier.impressions.toString());
                          }}
                        >
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" fontWeight={500}>
                              {tier.label}
                            </Typography>
                            <Typography variant="body2" fontWeight={700} color="primary">
                              ${formatNumber(tier.price)}
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                  <Box mt={2} textAlign="center">
                    <Typography variant="caption" color="text.secondary">
                      💡 Custom amounts welcome • Flexible pricing for any budget
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Grow>

          {selectedToken && customImpressions && parseInt(customImpressions) > 0 && (
            <Fade in timeout={1000}>
              <Paper
                id="payment-section"
                elevation={theme.palette.mode === 'dark' ? 0 : 3}
                sx={{
                  maxWidth: 700,
                  mx: 'auto',
                  overflow: 'hidden',
                  background: theme.palette.mode === 'dark' 
                    ? `linear-gradient(135deg, 
                        ${alpha('#111827', 0.5)} 0%, 
                        ${alpha('#111827', 0.3)} 50%,
                        ${alpha('#111827', 0.4)} 100%)`
                    : theme.palette.background.paper,
                  border: `1px solid ${theme.palette.mode === 'dark' 
                    ? alpha('#1F2937', 0.15) 
                    : 'transparent'}`,
                  backdropFilter: theme.palette.mode === 'dark' ? 'blur(60px) saturate(180%)' : 'none'
                }}
              >
                <Box 
                  sx={{ 
                    p: 2, 
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.7)})`,
                    color: 'white'
                  }}
                >
                  <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                    <WalletIcon />
                    <Typography variant="h5" fontWeight={600}>
                      Complete Your Order
                    </Typography>
                  </Stack>
                </Box>
                
                <Box p={4}>
                  <Paper
                    elevation={0}
                    sx={{ 
                      p: 3, 
                      mb: 4,
                      background: `linear-gradient(135deg, 
                        ${alpha(theme.palette.primary.main, 0.05)} 0%, 
                        ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                      border: `2px solid ${theme.palette.primary.main}`,
                      borderRadius: 2,
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 4,
                        background: `linear-gradient(90deg, 
                          ${theme.palette.primary.main} 0%, 
                          ${alpha(theme.palette.primary.main, 0.5)} 50%,
                          ${theme.palette.primary.main} 100%)`,
                        animation: 'pulse 2s infinite'
                      }
                    }}
                  >
                    <Stack spacing={2} alignItems="center">
                      {selectedToken && (
                        <Box mb={2} textAlign="center">
                          <Typography variant="overline" color="text.secondary">
                            Advertising for
                          </Typography>
                          <Stack direction="row" alignItems="center" justifyContent="center" spacing={2} mt={1}>
                            <Box
                              sx={{
                                width: 56,
                                height: 56,
                                borderRadius: '50%',
                                overflow: 'hidden',
                                border: `3px solid ${theme.palette.primary.main}`,
                                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
                              }}
                            >
                              <img 
                                src={`https://s1.xrpl.to/token/${selectedToken.value}`}
                                alt={selectedToken.name || selectedToken.currency}
                                style={{ 
                                  width: '100%', 
                                  height: '100%', 
                                  objectFit: 'cover' 
                                }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentElement.innerHTML = `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)}, ${alpha(theme.palette.primary.main, 0.1)}); font-weight: 700; font-size: 1.5rem; color: ${theme.palette.primary.main}">${(selectedToken.name || selectedToken.currency)?.charAt(0)?.toUpperCase() || '?'}</div>`;
                                }}
                              />
                            </Box>
                            <Box>
                              <Typography variant="h6" fontWeight={700}>
                                {selectedToken.name || selectedToken.currency}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Vol: {selectedToken.volume24h > 1000000 
                                  ? `${(selectedToken.volume24h / 1000000).toFixed(1)}M` 
                                  : selectedToken.volume24h > 1000 
                                  ? `${(selectedToken.volume24h / 1000).toFixed(1)}K`
                                  : selectedToken.volume24h?.toFixed(0) || '0'} XRP
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>
                      )}
                      <Typography variant="overline" color="primary" fontWeight={600}>
                        Total Amount Due
                      </Typography>
                      <Typography variant="h2" fontWeight={700}>
                        {formatPrice(calculatePrice(parseInt(customImpressions)))}
                      </Typography>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Chip 
                          icon={<AutoAwesomeIcon />}
                          label={`≈ ${(calculatePrice(parseInt(customImpressions)) / xrpRate).toFixed(2)} XRP`}
                          color="primary"
                          size="large"
                          sx={{ fontWeight: 600, fontSize: '1.1rem' }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          @ ${xrpRate.toFixed(2)}/XRP
                        </Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {formatNumber(customImpressions)} impressions • ${getCPMRate(parseInt(customImpressions)).toFixed(2)} CPM
                      </Typography>
                    </Stack>
                  </Paper>

                  <Stack spacing={3}>
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                        <WalletIcon color="primary" />
                        <Typography variant="h6" fontWeight={600}>
                          Payment Information
                        </Typography>
                      </Stack>
                      
                      <Stack spacing={2}>
                        <Paper
                          elevation={0}
                          sx={{ 
                            p: 2.5, 
                            bgcolor: theme.palette.mode === 'dark' 
                              ? alpha('#000', 0.2)
                              : 'grey.50', 
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            position: 'relative'
                          }}
                        >
                          <Stack direction="row" justifyContent="space-between" alignItems="start">
                            <Box flex={1}>
                              <Typography variant="overline" color="text.secondary" fontWeight={600}>
                                XRP Address
                              </Typography>
                              <Typography 
                                variant="body1" 
                                sx={{ 
                                  fontFamily: 'monospace',
                                  fontSize: '1.1rem',
                                  fontWeight: 600,
                                  wordBreak: 'break-all'
                                }}
                              >
                                rN7n7otQDd6FczFgLdAtqCSVvUV6jGUMxt
                              </Typography>
                            </Box>
                            <Tooltip title={copied ? "Copied!" : "Copy address"}>
                              <IconButton 
                                color="primary"
                                onClick={() => {
                                  navigator.clipboard.writeText('rN7n7otQDd6FczFgLdAtqCSVvUV6jGUMxt');
                                  setCopied(true);
                                  setTimeout(() => setCopied(false), 2000);
                                }}
                              >
                                {copied ? <CheckIcon /> : <CopyIcon />}
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Paper>

                        <Paper
                          elevation={0}
                          sx={{ 
                            p: 2.5, 
                            bgcolor: theme.palette.mode === 'dark' 
                              ? alpha('#000', 0.2)
                              : 'grey.50', 
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2
                          }}
                        >
                          <Typography variant="overline" color="text.secondary" fontWeight={600}>
                            Destination Tag (Required)
                          </Typography>
                          <Typography 
                            variant="h5" 
                            sx={{ 
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              color: 'primary.main'
                            }}
                          >
                            {destinationTag}
                          </Typography>
                        </Paper>
                      </Stack>
                    </Box>

                    <Alert 
                      severity="warning" 
                      icon={<InfoIcon />}
                      sx={{ 
                        borderRadius: 2,
                        '& .MuiAlert-icon': {
                          fontSize: 28
                        }
                      }}
                    >
                      <Typography variant="body2" fontWeight={500}>
                        Include the destination tag in your transaction to ensure proper order processing
                      </Typography>
                    </Alert>

                    {accountProfile && accountProfile.account ? (
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            fullWidth
                            startIcon={<WalletIcon />}
                            sx={{ 
                              py: 1.5, 
                              fontWeight: 600,
                              boxShadow: 3,
                              '&:hover': {
                                boxShadow: 5
                              }
                            }}
                            onClick={handlePayment}
                            disabled={process.status === 'processing'}
                          >
                            {process.status === 'processing' ? 'Processing...' : 'Pay with Wallet'}
                          </Button>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Button
                            variant="outlined"
                            size="large"
                            fullWidth
                            onClick={() => {
                              setCustomImpressions('');
                              setImpressionInput('');
                            }}
                            sx={{ py: 1.5, fontWeight: 600 }}
                          >
                            Change Amount
                          </Button>
                        </Grid>
                      </Grid>
                    ) : (
                      <Box>
                        <ConnectWallet />
                        <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={1}>
                          Connect your wallet to complete payment
                        </Typography>
                      </Box>
                    )}

                    <Paper
                      elevation={0}
                      sx={{ 
                        p: 3, 
                        bgcolor: alpha(theme.palette.success.main, 0.05), 
                        border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                        borderRadius: 2
                      }}
                    >
                      <Stack direction="row" spacing={2}>
                        <SpeedIcon color="success" sx={{ mt: 0.5 }} />
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                            What Happens Next?
                          </Typography>
                          <Stack spacing={1}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <CheckIcon fontSize="small" color="success" />
                              <Typography variant="body2">
                                Send XRP to the address with destination tag
                              </Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={1}>
                              <CheckIcon fontSize="small" color="success" />
                              <Typography variant="body2" fontWeight={600}>
                                Campaign starts instantly
                              </Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={1}>
                              <CheckIcon fontSize="small" color="success" />
                              <Typography variant="body2">
                                Receive analytics dashboard access
                              </Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={1}>
                              <CheckIcon fontSize="small" color="success" />
                              <Typography variant="body2">
                                Track impressions in real-time
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>
                      </Stack>
                    </Paper>
                  </Stack>
                </Box>
              </Paper>
            </Fade>
          )}
        </Container>
      </MainContent>
      <Footer />
      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </PageWrapper>
  );
}
