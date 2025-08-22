import React, { useState } from 'react';
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
  Grow
} from '@mui/material';
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

const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const MainContent = styled.main`
  flex: 1;
  padding: 40px 0;
`;

const PricingCard = styled(Card)`
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s, box-shadow 0.3s;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0,0,0,0.15);
  }
  ${props => props.featured && `
    border: 2px solid #1976d2;
    position: relative;
  `}
`;

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

export default function Advertise() {
  const theme = useTheme();
  const [impressionInput, setImpressionInput] = useState('');
  const [customImpressions, setCustomImpressions] = useState('');
  const [copied, setCopied] = useState(false);

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

  return (
    <PageWrapper>
      <Topbar />
      <Header />
      <MainContent>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={6}>
            <Typography 
              variant="h3" 
              component="h1" 
              fontWeight="bold"
              mb={2}
            >
              Token Advertising
            </Typography>
          </Box>

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
                  p: 2, 
                  background: theme.palette.mode === 'dark'
                    ? alpha(theme.palette.primary.main, 0.1)
                    : alpha(theme.palette.primary.main, 0.05),
                  borderBottom: `2px solid ${theme.palette.primary.main}`
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                  <CalculateIcon />
                  <Typography variant="h5" fontWeight={600}>
                    Token Advertising Calculator
                  </Typography>
                </Stack>
              </Box>
              
              <Box p={4}>
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
                          fontWeight: 500
                        }
                      }}
                      InputProps={{
                        startAdornment: <AutoAwesomeIcon sx={{ mr: 1, color: 'primary.main' }} />
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
                          p: 2,
                          background: `linear-gradient(135deg, 
                            ${alpha(theme.palette.primary.main, 0.05)} 0%, 
                            ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                          border: `2px solid ${theme.palette.primary.main}`,
                          borderRadius: 2,
                          textAlign: 'center'
                        }}
                      >
                        <Typography variant="overline" color="text.secondary">
                          Total Cost
                        </Typography>
                        <Typography variant="h4" fontWeight={700} color="primary">
                          {formatPrice(calculatePrice(parseInt(customImpressions)))}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ≈ {(calculatePrice(parseInt(customImpressions)) / 0.65).toFixed(2)} XRP
                        </Typography>
                        <Button
                          variant="contained"
                          color="primary"
                          fullWidth
                          sx={{ mt: 2 }}
                          startIcon={<WalletIcon />}
                          onClick={() => {
                            document.getElementById('payment-section')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          Pay with XRP
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
                            p: 1.5,
                            bgcolor: theme.palette.mode === 'dark' 
                              ? alpha('#1F2937', 0.1)
                              : 'grey.50',
                            border: '1px solid',
                            borderColor: theme.palette.mode === 'dark' 
                              ? alpha('#1F2937', 0.2)
                              : 'divider',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: 'primary.main',
                              bgcolor: alpha(theme.palette.primary.main, 0.05)
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

          {customImpressions && parseInt(customImpressions) > 0 && (
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
                      <Typography variant="overline" color="primary" fontWeight={600}>
                        Total Amount Due
                      </Typography>
                      <Typography variant="h2" fontWeight={700}>
                        {formatPrice(calculatePrice(parseInt(customImpressions)))}
                      </Typography>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Chip 
                          icon={<AutoAwesomeIcon />}
                          label={`≈ ${(calculatePrice(parseInt(customImpressions)) / 0.65).toFixed(2)} XRP`}
                          color="primary"
                          size="large"
                          sx={{ fontWeight: 600, fontSize: '1.1rem' }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          @ $0.65/XRP
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
                            {Math.floor(Math.random() * 1000000) + 100000}
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
                          onClick={() => window.open('https://xrpl.org/xrp-wallets.html', '_blank')}
                        >
                          Open Wallet
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
    </PageWrapper>
  );
}