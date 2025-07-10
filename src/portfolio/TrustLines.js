import axios from 'axios';
import { useState, useEffect, useRef, useContext, useMemo, useCallback } from 'react';
import Decimal from 'decimal.js';
import {
  Box,
  Stack,
  Card,
  Typography,
  useMediaQuery,
  useTheme,
  IconButton,
  Avatar,
  alpha,
  Tooltip,
  Chip,
  Button,
  CircularProgress,
  Fade
} from '@mui/material';
import {
  DeleteOutline as DeleteIcon,
  Verified as VerifiedIcon,
  AccountBalanceWallet as WalletIcon,
  TrendingUp as TrendingIcon,
  Warning as WarningIcon,
  KeyboardArrowUp as CollapseIcon
} from '@mui/icons-material';
import { PulseLoader } from 'react-spinners';
import { AppContext } from 'src/AppContext';
import { currencySymbols } from 'src/utils/constants';
import { isInstalled, submitTransaction } from '@gemwallet/api';
import sdk from '@crossmarkio/sdk';
import CustomQRDialog from 'src/components/QRDialog';
import CustomDialog from 'src/components/Dialog';
import useWebSocket from 'react-use-websocket';
import { selectMetrics, update_metrics } from 'src/redux/statusSlice';
import { useDispatch, useSelector } from 'react-redux';

// Helper function to format balance
const formatBalance = (balance) => {
  const num = Number(balance);
  if (num === 0) return '0';
  if (num < 0.000001) return num.toExponential(2);
  if (num < 1) return num.toFixed(6).replace(/\.?0+$/, '');
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: num < 1000 ? 4 : 2
  });
};

// Token Card Component
const TokenCard = ({ token, account, isXRP = false, exchRate }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { darkMode, activeFiatCurrency, openSnackbar, accountProfile, setSync } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const BASE_URL = process.env.API_URL;
  
  // Dialog state
  const [dialogState, setDialogState] = useState({
    openScanQR: false,
    openConfirm: false,
    xamanStep: 0,
    xamanTitle: '',
    stepTitle: '',
    content: '',
    uuid: null,
    qrUrl: null,
    nextUrl: null
  });

  // Remove trustline logic
  const handleRemove = async () => {
    if (!accountProfile?.account) {
      openSnackbar('Please connect wallet!', 'error');
      return;
    }
    if (accountProfile.account !== account) {
      openSnackbar('You are not the owner of this account!', 'error');
      return;
    }
    setDialogState(prev => ({ ...prev, xamanStep: token.balance > 0 ? 1 : 3 }));
  };

  const handleConfirmClose = () => {
    setDialogState(prev => ({ ...prev, openConfirm: false, xamanStep: 0 }));
    setSync(prev => !prev);
  };

  const handleScanQRClose = () => {
    setDialogState(prev => ({ ...prev, openScanQR: false }));
    if (dialogState.uuid) {
      axios.delete(`${BASE_URL}/xumm/logout/${dialogState.uuid}`);
      setDialogState(prev => ({ ...prev, uuid: null }));
    }
  };

  // Calculate value
  const value = useMemo(() => {
    const tokenName = isXRP ? 'XRP' : (token.currencyName || token.currency);
    // exchRate is XRP per 1 USD (e.g., 0.415021 XRP = 1 USD)
    // To get USD per XRP, we need 1 / exchRate
    const xrpToFiat = exchRate ? 1 / exchRate : 0;
    
    if (isXRP) {
      // For XRP, value = balance * (1 / exchRate) to get fiat value
      const xrpValue = (token.balance || 0) * xrpToFiat;
      console.log(`[TokenCard] ${tokenName} value calculation:`, {
        balance: token.balance,
        exchRate,
        xrpToFiat,
        value: xrpValue
      });
      return xrpValue;
    }
    
    // Debug log token data
    console.log(`[TokenCard] ${tokenName} token data:`, {
      balance: token.balance,
      exch: token.exch,
      value: token.value,
      exchRate,
      xrpToFiat,
      fullToken: token
    });
    
    // Check if we have a pre-calculated value in XRP from the API
    if (token.value !== undefined && token.value !== null) {
      // The API provides value in XRP, convert to fiat
      const calcValue = Number(token.value) * xrpToFiat;
      console.log(`[TokenCard] ${tokenName} using API value: ${token.value} XRP * ${xrpToFiat} = ${calcValue}`);
      return calcValue;
    }
    
    // Fallback: calculate from balance and exch
    if (!token.balance || !token.exch) {
      console.log(`[TokenCard] ${tokenName} missing balance or exch, returning 0`);
      return 0;
    }
    
    const calcValue = Number(token.balance) * Number(token.exch) * xrpToFiat;
    console.log(`[TokenCard] ${tokenName} calculated: ${token.balance} * ${token.exch} * ${xrpToFiat} = ${calcValue}`);
    return calcValue;
  }, [token, isXRP, exchRate]);

  const percentOwned = useMemo(() => {
    if (isXRP) {
      return ((parseFloat(token.balance) / 99_990_000_000) * 100).toFixed(8);
    }
    return token.percentOwned || '0';
  }, [token, isXRP]);

  return (
    <>
      <Card
        sx={{
          background: theme.palette.mode === 'dark' 
            ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`
            : `linear-gradient(135deg, ${alpha('#ffffff', 0.9)} 0%, ${alpha('#f5f5f5', 0.5)} 100%)`,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          borderRadius: 2,
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[4],
            borderColor: alpha(theme.palette.primary.main, 0.2)
          }
        }}
      >
        <Box sx={{ p: { xs: 1, sm: 1.5 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 2 }} alignItems={{ xs: 'stretch', sm: 'center' }}>
            {/* Left side - Token info */}
            <Stack direction="row" spacing={1.5} alignItems="center" flex={1}>
              <Avatar
                src={isXRP ? '/xrp.svg' : `https://s1.xrpl.to/token/${token.md5}`}
                sx={{
                  width: { xs: 36, sm: 40 },
                  height: { xs: 36, sm: 40 },
                  borderRadius: 1,
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#fff',
                  boxShadow: theme.shadows[1],
                  '& img': {
                    objectFit: 'contain',
                    padding: 0.5
                  }
                }}
              />
              
              <Box flex={1} minWidth={0}>
                <Stack direction="row" alignItems="center" spacing={0.5} mb={0.25}>
                  <Typography
                    variant="body1"
                    sx={{
                      fontSize: { xs: '0.8rem', sm: '0.9rem' },
                      fontWeight: 700,
                      color: theme.palette.text.primary,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {isXRP ? 'XRP' : (token.currencyName || token.currency)}
                  </Typography>
                  {(isXRP || token.verified) && (
                    <VerifiedIcon sx={{ fontSize: { xs: 14, sm: 16 }, color: theme.palette.success.main }} />
                  )}
                  {token.origin && (
                    <Chip 
                      label={token.origin} 
                      size="small" 
                      sx={{ 
                        height: 16, 
                        fontSize: '0.6rem',
                        '& .MuiChip-label': { px: 0.75 }
                      }}
                    />
                  )}
                </Stack>
                
                {!isXRP && token.issuer && (
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontSize: { xs: '0.6rem', sm: '0.65rem' },
                      color: theme.palette.text.secondary,
                      fontFamily: 'monospace'
                    }}
                  >
                    {token.user || `${token.issuer.slice(0, 8)}...${token.issuer.slice(-4)}`}
                  </Typography>
                )}
              </Box>
            </Stack>

            {/* Right side - Stats grid */}
            <Stack 
              direction="row" 
              spacing={{ xs: 2, sm: 3 }} 
              alignItems="center"
              sx={{ 
                ml: { xs: 0, sm: 'auto' },
                pl: { xs: 0, sm: 2 }
              }}
            >
              <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', sm: '0.65rem' }, display: 'block' }}>
                  Balance
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>
                  {formatBalance(token.balance)}
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', sm: '0.65rem' }, display: 'block' }}>
                  Value
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 700, 
                    fontSize: { xs: '0.75rem', sm: '0.85rem' },
                    color: theme.palette.primary.main 
                  }}
                >
                  {currencySymbols[activeFiatCurrency]}{value.toFixed(2)}
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, display: { xs: isMobile ? 'none' : 'block', sm: 'block' } }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', sm: '0.65rem' }, display: 'block' }}>
                  % Owned
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 600, 
                    fontSize: { xs: '0.75rem', sm: '0.85rem' },
                    color: percentOwned > 50 ? theme.palette.error.main : 
                           percentOwned > 20 ? theme.palette.warning.main : 
                           theme.palette.success.main
                  }}
                >
                  {percentOwned}%
                </Typography>
              </Box>

              {!isXRP && accountProfile?.account === account && (
                <IconButton
                  size="small"
                  onClick={handleRemove}
                  sx={{
                    p: 0.5,
                    color: theme.palette.error.main,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.error.main, 0.1)
                    }
                  }}
                >
                  <DeleteIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
                </IconButton>
              )}
            </Stack>
          </Stack>
        </Box>
      </Card>

      {/* Dialogs */}
      <CustomQRDialog
        open={dialogState.openScanQR}
        type={dialogState.xamanTitle}
        onClose={handleScanQRClose}
        qrUrl={dialogState.qrUrl}
        nextUrl={dialogState.nextUrl}
      />
      
      <CustomDialog
        open={dialogState.openConfirm}
        content={dialogState.content}
        title={dialogState.stepTitle}
        handleClose={handleConfirmClose}
        handleContinue={() => {/* Add continue logic */}}
      />
    </>
  );
};

// Main TrustLines Component
export default function TrustLines({ account, xrpBalance, onUpdateTotalValue, onTrustlinesData }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { sync, activeFiatCurrency } = useContext(AppContext);
  const metrics = useSelector(selectMetrics);
  const exchRate = metrics[activeFiatCurrency];
  
  console.log('[TrustLines] Component state:', {
    activeFiatCurrency,
    exchRate,
    metrics,
    xrpBalance
  });
  
  const [loading, setLoading] = useState(false);
  const [lines, setLines] = useState([]);
  const [showAll, setShowAll] = useState(false);
  
  const WSS_FEED_URL = 'wss://api.xrpl.to/ws/sync';
  
  useWebSocket(WSS_FEED_URL, {
    onMessage: (event) => {
      try {
        const json = JSON.parse(event.data);
        dispatch(update_metrics(json));
      } catch (err) {
        console.error(err);
      }
    },
    shouldReconnect: () => true
  });

  // Fetch trustlines
  useEffect(() => {
    const fetchLines = async () => {
      setLoading(true);
      try {
        console.log(`[TrustLines] Fetching trustlines for account: ${account}`);
        const res = await axios.get(`https://api.xrpl.to/api/trustlines?account=${account}&includeRates=true&limit=400`);
        if (res.data?.success) {
          console.log('[TrustLines] API response:', res.data);
          console.log('[TrustLines] First 3 trustlines:', res.data.trustlines.slice(0, 3));
          setLines(res.data.trustlines);
        }
      } catch (err) {
        console.error('[TrustLines] Error fetching trustlines:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (account) {
      fetchLines();
    }
  }, [account, sync]);

  // Calculate total value
  useEffect(() => {
    // exchRate is XRP per 1 USD, so we need to invert it
    const xrpToFiat = exchRate ? 1 / exchRate : 0;
    
    // Calculate total value using the same logic as individual tokens
    const trustlinesSum = lines.reduce((acc, line) => {
      // If API provides a pre-calculated value in XRP, use it
      if (line.value !== undefined && line.value !== null) {
        return acc + (Number(line.value) * xrpToFiat);
      }
      // Otherwise calculate from balance * exch
      const balance = parseFloat(line.balance) || 0;
      const exch = parseFloat(line.exch) || 0;
      return acc + (balance * exch * xrpToFiat);
    }, 0);
    const xrpValue = (xrpBalance || 0) * xrpToFiat;
    const totalSum = trustlinesSum + xrpValue;
    
    if (onUpdateTotalValue) {
      onUpdateTotalValue(totalSum);
    }
    
    if (onTrustlinesData) {
      const allAssets = xrpBalance
        ? [{ currency: 'XRP', balance: xrpBalance, value: xrpValue, exch: 1, exchRate }, ...lines]
        : lines;
      onTrustlinesData(allAssets);
    }
  }, [lines, xrpBalance, exchRate, onUpdateTotalValue, onTrustlinesData]);

  const displayedLines = showAll ? lines : lines.slice(0, 6);
  const hasMore = lines.length > 6;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!loading && lines.length === 0 && !xrpBalance) {
    return (
      <Card sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
        <WalletIcon sx={{ fontSize: 48, color: theme.palette.text.secondary, mb: 2 }} />
        <Typography variant="h6" gutterBottom>No Assets Found</Typography>
        <Typography variant="body2" color="text.secondary">
          This account doesn't have any tokens yet
        </Typography>
      </Card>
    );
  }

  return (
    <Stack spacing={1}>
      {/* Summary Card */}
      <Card
        sx={{
          p: { xs: 1, sm: 1.5 },
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.04)} 100%)`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
          borderRadius: 1.5
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <TrendingIcon sx={{ fontSize: { xs: 24, sm: 28 }, color: theme.palette.primary.main }} />
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 700, fontSize: { xs: '0.85rem', sm: '1rem' } }}>
                Portfolio Overview
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                {lines.length + (xrpBalance ? 1 : 0)} assets
              </Typography>
            </Box>
          </Stack>
          
          <Box textAlign="right">
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>Total Value</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              {currencySymbols[activeFiatCurrency]}
              {(() => {
                const xrpToFiat = exchRate ? 1 / exchRate : 0;
                return ((lines.reduce((acc, line) => {
                  // Use the same calculation as in the useEffect
                  if (line.value !== undefined && line.value !== null) {
                    return acc + (Number(line.value) * xrpToFiat);
                  }
                  const balance = parseFloat(line.balance) || 0;
                  const exch = parseFloat(line.exch) || 0;
                  return acc + (balance * exch * xrpToFiat);
                }, 0) + 
                  ((xrpBalance || 0) * xrpToFiat))).toFixed(2);
              })()}
            </Typography>
          </Box>
        </Stack>
      </Card>

      {/* Token List */}
      <Stack spacing={0.75}>
        {xrpBalance > 0 && (
          <Fade in timeout={300}>
            <Box>
              <TokenCard
                token={{ balance: xrpBalance }}
                account={account}
                isXRP
                exchRate={exchRate}
              />
            </Box>
          </Fade>
        )}
        
        {displayedLines.map((line, index) => (
          <Fade in timeout={300 + index * 50} key={`${line.currency}-${line.issuer}`}>
            <Box>
              <TokenCard token={line} account={account} exchRate={exchRate} />
            </Box>
          </Fade>
        ))}
      </Stack>

      {/* Show More Button */}
      {hasMore && (
        <Box sx={{ textAlign: 'center', mt: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setShowAll(!showAll)}
            sx={{
              borderRadius: 1,
              textTransform: 'none',
              fontSize: { xs: '0.7rem', sm: '0.8rem' },
              py: 0.5,
              px: 2,
              borderColor: alpha(theme.palette.primary.main, 0.3),
              '&:hover': {
                borderColor: theme.palette.primary.main,
                backgroundColor: alpha(theme.palette.primary.main, 0.05)
              }
            }}
          >
            {showAll ? 'Show Less' : `Show ${lines.length - 6} More`}
          </Button>
        </Box>
      )}
    </Stack>
  );
}