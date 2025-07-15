import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Stack,
  Box,
  Chip,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  Fade,
  Tooltip,
  Badge
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Icon } from '@iconify/react';
import { Client } from 'xrpl';
import { fNumber } from 'src/utils/formatNumber';
import { formatDistanceToNow } from 'date-fns';
import { parseAmount } from 'src/utils/parse/amount';
import Decimal from 'decimal.js';
import { normalizeCurrencyCode } from 'src/utils/parse/utils';

const XRPL_WEBSOCKET_URL = 'wss://s1.ripple.com';

const TransactionRow = memo(({ transaction, isNew, creatorAddress }) => {
  const theme = useTheme();
  const { tx, meta, validated, ledger_index } = transaction;
  
  const txType = tx.TransactionType;
  const isIncoming = tx.Destination === creatorAddress;
  
  // Check if this is a currency conversion (self-payment with different currencies)
  const isCurrencyConversion = txType === 'Payment' && 
    tx.Account === tx.Destination && 
    (tx.SendMax || (tx.Paths && tx.Paths.length > 0));
  
  // Check if this is a token-to-XRP conversion
  const isTokenToXrpConversion = isCurrencyConversion && (() => {
    const deliveredAmount = meta?.delivered_amount || meta?.DeliveredAmount;
    const sentAmount = tx.SendMax || tx.Amount;
    
    if (!deliveredAmount || !sentAmount) return false;
    
    // Check if received XRP and sent token
    const isReceivedXRP = typeof deliveredAmount === 'string'; // XRP amounts are strings
    const isSentToken = typeof sentAmount === 'object' && sentAmount.currency && sentAmount.currency !== 'XRP';
    
    return isReceivedXRP && isSentToken;
  })();
  
  // Check if this is an XRP-to-token conversion (creator buying)
  const isXrpToTokenConversion = isCurrencyConversion && (() => {
    const deliveredAmount = meta?.delivered_amount || meta?.DeliveredAmount;
    const sentAmount = tx.SendMax || tx.Amount;
    
    if (!deliveredAmount || !sentAmount) return false;
    
    // Check if sent XRP and received token
    const isSentXRP = typeof sentAmount === 'string'; // XRP amounts are strings
    const isReceivedToken = typeof deliveredAmount === 'object' && deliveredAmount.currency && deliveredAmount.currency !== 'XRP';
    
    return isSentXRP && isReceivedToken;
  })();
  
  const formatTxAmount = () => {
    try {
      // Payment transactions
      if (txType === 'Payment') {
        // Currency conversion - show both sides
        if (isCurrencyConversion) {
          const deliveredAmount = meta?.delivered_amount || meta?.DeliveredAmount;
          const sentAmount = tx.SendMax || tx.Amount;
          
          if (!deliveredAmount || !sentAmount) return 'N/A';
          
          const delivered = parseAmount(deliveredAmount);
          const sent = parseAmount(sentAmount);
          
          if (!delivered || !sent || typeof delivered !== 'object' || typeof sent !== 'object') return 'N/A';
          
          // Format sent amount
          let sentValue = sent.value;
          if (typeof sentValue === 'string' && sentValue.includes('e')) {
            sentValue = new Decimal(sentValue).toString();
          }
          const sentCurrency = sent.currency === 'XRP' ? 'XRP' : normalizeCurrencyCode(sent.currency);
          
          // Format received amount
          let deliveredValue = delivered.value;
          if (typeof deliveredValue === 'string' && deliveredValue.includes('e')) {
            deliveredValue = new Decimal(deliveredValue).toString();
          }
          const deliveredCurrency = delivered.currency === 'XRP' ? 'XRP' : normalizeCurrencyCode(delivered.currency);
          
          return `${fNumber(sentValue)} ${sentCurrency} → ${fNumber(deliveredValue)} ${deliveredCurrency}`;
        }
        
        // Regular payment
        const deliveredAmount = meta?.delivered_amount || meta?.DeliveredAmount;
        const amountToFormat = deliveredAmount || tx.Amount;
        
        if (!amountToFormat) return 'N/A';
        
        const amount = parseAmount(amountToFormat);
        if (!amount || typeof amount !== 'object') return 'N/A';
        
        if (amount.currency === 'XRP') {
          return `${fNumber(amount.value)} XRP`;
        }
        
        let value = amount.value;
        if (typeof value === 'string' && value.includes('e')) {
          value = new Decimal(value).toString();
        }
        
        const readableCurrency = normalizeCurrencyCode(amount.currency);
        return `${fNumber(value)} ${readableCurrency}`;
      }
      
      // Offer transactions
      if (txType === 'OfferCreate' && tx.TakerGets && tx.TakerPays) {
        const takerGets = parseAmount(tx.TakerGets);
        const takerPays = parseAmount(tx.TakerPays);
        
        if (!takerGets || !takerPays || typeof takerGets !== 'object' || typeof takerPays !== 'object') {
          return 'N/A';
        }
        
        let getsValue = takerGets.value;
        let paysValue = takerPays.value;
        if (typeof getsValue === 'string' && getsValue.includes('e')) {
          getsValue = new Decimal(getsValue).toString();
        }
        if (typeof paysValue === 'string' && paysValue.includes('e')) {
          paysValue = new Decimal(paysValue).toString();
        }
        
        const getsCurrency = takerGets.currency === 'XRP' ? 'XRP' : normalizeCurrencyCode(takerGets.currency);
        const paysCurrency = takerPays.currency === 'XRP' ? 'XRP' : normalizeCurrencyCode(takerPays.currency);
        
        const isSellOrder = tx.Flags & 0x00080000;
        return `${isSellOrder ? 'Sell' : 'Buy'} ${fNumber(getsValue)} ${getsCurrency} for ${fNumber(paysValue)} ${paysCurrency}`;
      }
      
      // Trust line transactions
      if (txType === 'TrustSet' && tx.LimitAmount) {
        const limit = parseAmount(tx.LimitAmount);
        if (!limit || typeof limit !== 'object') return 'N/A';
        
        let value = limit.value;
        if (typeof value === 'string' && value.includes('e')) {
          value = new Decimal(value).toString();
        }
        
        const limitCurrency = normalizeCurrencyCode(limit.currency);
        const isRemoval = new Decimal(value).isZero();
        return isRemoval ? `Remove ${limitCurrency}` : `${fNumber(value)} ${limitCurrency}`;
      }
      
      // NFT transactions
      if (txType === 'NFTokenMint') {
        return `Mint NFT${tx.NFTokenTaxon ? ` (Taxon: ${tx.NFTokenTaxon})` : ''}`;
      }
      
      if (txType === 'NFTokenCreateOffer' && tx.Amount) {
        const amount = parseAmount(tx.Amount);
        if (!amount || typeof amount !== 'object') return 'NFT Offer';
        
        const isBuyOffer = !(tx.Flags & 1);
        const currency = amount.currency === 'XRP' ? 'XRP' : normalizeCurrencyCode(amount.currency);
        return `${isBuyOffer ? 'Buy' : 'Sell'} NFT for ${fNumber(amount.value)} ${currency}`;
      }
      
      if (txType === 'NFTokenAcceptOffer') {
        return 'Accept NFT Offer';
      }
      
      if (txType === 'NFTokenCancelOffer') {
        return 'Cancel NFT Offer';
      }
      
      // AMM transactions
      if (txType === 'AMMDeposit') {
        if (tx.Amount) {
          const amount = parseAmount(tx.Amount);
          if (amount && typeof amount === 'object') {
            const currency = amount.currency === 'XRP' ? 'XRP' : normalizeCurrencyCode(amount.currency);
            return `Deposit ${fNumber(amount.value)} ${currency}`;
          }
        }
        return 'AMM Deposit';
      }
      
      if (txType === 'AMMWithdraw') {
        return 'AMM Withdraw';
      }
      
      // Offer cancel
      if (txType === 'OfferCancel') {
        return `Cancel Offer #${tx.OfferSequence || 'N/A'}`;
      }
      
      // Check transactions
      if (txType === 'CheckCash' && tx.Amount) {
        const amount = parseAmount(tx.Amount);
        if (!amount || typeof amount !== 'object') return 'Claim Check';
        
        let value = amount.value;
        if (typeof value === 'string' && value.includes('e')) {
          value = new Decimal(value).toString();
        }
        
        const currency = amount.currency === 'XRP' ? 'XRP' : normalizeCurrencyCode(amount.currency);
        return `${fNumber(value)} ${currency}`;
      }
      
      if (txType === 'CheckCreate' && tx.SendMax) {
        const amount = parseAmount(tx.SendMax);
        if (!amount || typeof amount !== 'object') return 'Create Check';
        
        let value = amount.value;
        if (typeof value === 'string' && value.includes('e')) {
          value = new Decimal(value).toString();
        }
        
        const currency = amount.currency === 'XRP' ? 'XRP' : normalizeCurrencyCode(amount.currency);
        return `${fNumber(value)} ${currency}`;
      }
      
      if (txType === 'CheckCancel') {
        return 'Cancel Check';
      }
      
      return 'N/A';
    } catch (error) {
      console.error('Error formatting transaction amount:', error);
      return 'N/A';
    }
  };

  const formatTime = () => {
    if (tx.date) {
      const date = new Date((tx.date + 946684800) * 1000);
      return formatDistanceToNow(date, { addSuffix: true });
    }
    return 'Pending';
  };

  const getTxIcon = () => {
    if (isCurrencyConversion) {
      return 'mdi:currency-exchange';
    }
    
    switch (txType) {
      case 'Payment':
        return isIncoming ? 'mdi:arrow-down-circle' : 'mdi:arrow-up-circle';
      case 'OfferCreate':
        return 'mdi:swap-horizontal';
      case 'OfferCancel':
        return 'mdi:close-circle-outline';
      case 'TrustSet':
        return 'mdi:link-variant';
      case 'NFTokenMint':
        return 'mdi:creation';
      case 'NFTokenCreateOffer':
        return 'mdi:tag-outline';
      case 'NFTokenAcceptOffer':
        return 'mdi:check-circle-outline';
      case 'NFTokenCancelOffer':
        return 'mdi:cancel';
      case 'NFTokenBurn':
        return 'mdi:fire';
      case 'AMMDeposit':
        return 'mdi:bank-plus';
      case 'AMMWithdraw':
        return 'mdi:bank-minus';
      case 'OracleSet':
        return 'mdi:database-sync';
      case 'CheckCash':
        return 'mdi:cash-check';
      case 'CheckCreate':
        return 'mdi:checkbook';
      case 'CheckCancel':
        return 'mdi:check-bold';
      default:
        return 'mdi:transfer';
    }
  };

  const getTxColor = () => {
    if (!validated) return theme.palette.warning.main;
    
    // Check if transaction failed
    if (meta?.TransactionResult && meta.TransactionResult !== 'tesSUCCESS') {
      return theme.palette.error.main;
    }
    
    if (isCurrencyConversion) {
      return theme.palette.info.main;
    }
    
    switch (txType) {
      case 'Payment':
        return isIncoming ? theme.palette.success.main : theme.palette.error.main;
      case 'OfferCreate':
        return theme.palette.info.main;
      case 'OfferCancel':
        return theme.palette.warning.main;
      case 'TrustSet':
        return theme.palette.primary.main;
      case 'NFTokenMint':
      case 'NFTokenCreateOffer':
      case 'NFTokenAcceptOffer':
      case 'NFTokenCancelOffer':
      case 'NFTokenBurn':
        return theme.palette.secondary.main;
      case 'AMMDeposit':
      case 'AMMWithdraw':
        return theme.palette.info.main;
      case 'OracleSet':
        return theme.palette.primary.main;
      case 'CheckCash':
      case 'CheckCreate':
      case 'CheckCancel':
        return theme.palette.success.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  return (
    <Fade in timeout={300}>
      <Box
        sx={{
          p: 1.5,
          borderRadius: '8px',
          position: 'relative',
          overflow: 'hidden',
          background: isTokenToXrpConversion
            ? 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)'
            : isXrpToTokenConversion
              ? 'linear-gradient(135deg, #0a0a2a 0%, #1a1a3a 100%)'
              : isNew 
                ? alpha(theme.palette.primary.main, 0.08)
                : alpha(theme.palette.background.default, 0.5),
          border: `1px solid ${alpha(theme.palette.divider, isNew ? 0.2 : 0.1)}`,
          transition: 'all 0.2s ease',
          '&:hover': {
            background: isTokenToXrpConversion
              ? 'linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 100%)'
              : isXrpToTokenConversion
                ? 'linear-gradient(135deg, #1a1a3a 0%, #2a2a4a 100%)'
                : alpha(theme.palette.background.paper, 0.8),
            borderColor: alpha(getTxColor(), 0.3)
          },
          // Lava flow holographic effect for token-to-XRP conversions
          ...(isTokenToXrpConversion && {
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-200%',
              width: '200%',
              height: '100%',
              background: `linear-gradient(
                105deg,
                transparent 40%,
                ${alpha('#ff4500', 0.3)} 45%,
                ${alpha('#ff6347', 0.4)} 50%,
                ${alpha('#ff8c00', 0.3)} 55%,
                transparent 60%
              )`,
              animation: 'lavaFlow 3s linear infinite',
              pointerEvents: 'none'
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(
                45deg,
                ${alpha('#ff4500', 0.1)} 0%,
                ${alpha('#ff6347', 0.15)} 25%,
                ${alpha('#ffa500', 0.1)} 50%,
                ${alpha('#ff8c00', 0.15)} 75%,
                ${alpha('#ff4500', 0.1)} 100%
              )`,
              backgroundSize: '400% 400%',
              animation: 'holographic 8s ease infinite',
              pointerEvents: 'none',
              mixBlendMode: 'overlay'
            },
            '@keyframes lavaFlow': {
              '0%': { transform: 'translateX(0) skewX(-20deg)' },
              '100%': { transform: 'translateX(200%) skewX(-20deg)' }
            },
            '@keyframes holographic': {
              '0%': { backgroundPosition: '0% 50%' },
              '50%': { backgroundPosition: '100% 50%' },
              '100%': { backgroundPosition: '0% 50%' }
            }
          }),
          // Aurora holographic effect for XRP-to-token conversions
          ...(isXrpToTokenConversion && {
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-200%',
              width: '200%',
              height: '100%',
              background: `linear-gradient(
                105deg,
                transparent 40%,
                ${alpha('#00bfff', 0.3)} 45%,
                ${alpha('#4169e1', 0.4)} 50%,
                ${alpha('#9370db', 0.3)} 55%,
                transparent 60%
              )`,
              animation: 'auroraFlow 3s linear infinite',
              pointerEvents: 'none'
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(
                45deg,
                ${alpha('#00bfff', 0.1)} 0%,
                ${alpha('#4169e1', 0.15)} 25%,
                ${alpha('#9370db', 0.1)} 50%,
                ${alpha('#00ffff', 0.15)} 75%,
                ${alpha('#00bfff', 0.1)} 100%
              )`,
              backgroundSize: '400% 400%',
              animation: 'auroraShimmer 8s ease infinite',
              pointerEvents: 'none',
              mixBlendMode: 'overlay'
            },
            '@keyframes auroraFlow': {
              '0%': { transform: 'translateX(0) skewX(-20deg)' },
              '100%': { transform: 'translateX(200%) skewX(-20deg)' }
            },
            '@keyframes auroraShimmer': {
              '0%': { backgroundPosition: '0% 50%' },
              '50%': { backgroundPosition: '100% 50%' },
              '100%': { backgroundPosition: '0% 50%' }
            }
          })
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isTokenToXrpConversion
                ? `linear-gradient(135deg, ${alpha('#ff4500', 0.2)}, ${alpha('#ffa500', 0.2)})`
                : isXrpToTokenConversion
                  ? `linear-gradient(135deg, ${alpha('#00bfff', 0.2)}, ${alpha('#9370db', 0.2)})`
                  : alpha(getTxColor(), 0.1),
              border: `1px solid ${isTokenToXrpConversion ? alpha('#ff6347', 0.4) : isXrpToTokenConversion ? alpha('#4169e1', 0.4) : alpha(getTxColor(), 0.2)}`,
              position: 'relative',
              zIndex: 1,
              ...(isTokenToXrpConversion && {
                boxShadow: `0 0 20px ${alpha('#ff4500', 0.4)}`,
                animation: 'pulse 2s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': { boxShadow: `0 0 20px ${alpha('#ff4500', 0.4)}` },
                  '50%': { boxShadow: `0 0 30px ${alpha('#ffa500', 0.6)}` }
                }
              }),
              ...(isXrpToTokenConversion && {
                boxShadow: `0 0 20px ${alpha('#00bfff', 0.4)}`,
                animation: 'auraPulse 2s ease-in-out infinite',
                '@keyframes auraPulse': {
                  '0%, 100%': { boxShadow: `0 0 20px ${alpha('#00bfff', 0.4)}` },
                  '50%': { boxShadow: `0 0 30px ${alpha('#9370db', 0.6)}` }
                }
              })
            }}
          >
            <Icon 
              icon={getTxIcon()} 
              style={{ 
                fontSize: '18px', 
                color: isTokenToXrpConversion ? '#ff6347' : isXrpToTokenConversion ? '#4169e1' : getTxColor(),
                filter: isTokenToXrpConversion ? 'drop-shadow(0 0 3px rgba(255, 99, 71, 0.6))' : isXrpToTokenConversion ? 'drop-shadow(0 0 3px rgba(65, 105, 225, 0.6))' : 'none'
              }} 
            />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 600,
                  fontSize: '0.875rem'
                }}
              >
                {isCurrencyConversion ? 'Currency Conversion' : txType}
              </Typography>
              {isTokenToXrpConversion && (
                <Chip
                  label="🔥 Sold"
                  size="small"
                  sx={{
                    height: '16px',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #ff4500, #ffa500)',
                    color: 'white',
                    border: 'none',
                    animation: 'shimmer 2s linear infinite',
                    '@keyframes shimmer': {
                      '0%': { backgroundPosition: '0% 50%' },
                      '100%': { backgroundPosition: '200% 50%' }
                    },
                    backgroundSize: '200% 100%'
                  }}
                />
              )}
              {isXrpToTokenConversion && (
                <Chip
                  label="💎 Bought"
                  size="small"
                  sx={{
                    height: '16px',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #00bfff, #9370db)',
                    color: 'white',
                    border: 'none',
                    animation: 'shimmer 2s linear infinite',
                    '@keyframes shimmer': {
                      '0%': { backgroundPosition: '0% 50%' },
                      '100%': { backgroundPosition: '200% 50%' }
                    },
                    backgroundSize: '200% 100%'
                  }}
                />
              )}
              {isNew && (
                <Chip
                  label="NEW"
                  size="small"
                  sx={{
                    height: '16px',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    background: theme.palette.primary.main,
                    color: 'white'
                  }}
                />
              )}
              {!validated && (
                <Chip
                  label="PENDING"
                  size="small"
                  color="warning"
                  sx={{
                    height: '16px',
                    fontSize: '0.65rem'
                  }}
                />
              )}
              {validated && meta?.TransactionResult && meta.TransactionResult !== 'tesSUCCESS' && (
                <Chip
                  label="FAILED"
                  size="small"
                  color="error"
                  sx={{
                    height: '16px',
                    fontSize: '0.65rem'
                  }}
                />
              )}
            </Stack>
            
            <Typography 
              variant="caption" 
              sx={{ 
                color: alpha(theme.palette.text.secondary, 0.7),
                fontSize: '0.75rem'
              }}
            >
              {formatTime()}
            </Typography>
          </Box>

          <Box sx={{ minWidth: '100px', textAlign: 'right' }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: getTxColor(),
                fontSize: '0.875rem'
              }}
            >
              {txType === 'Payment' && !isIncoming && !isCurrencyConversion && '-'}
              {formatTxAmount()}
            </Typography>
            {txType === 'Payment' && tx.SendMax && tx.SendMax !== tx.Amount && !isCurrencyConversion && (
              <Typography
                variant="caption"
                sx={{
                  color: alpha(theme.palette.text.secondary, 0.7),
                  fontSize: '0.7rem',
                  display: 'block'
                }}
              >
                Max: {(() => {
                  const sendMax = parseAmount(tx.SendMax);
                  if (!sendMax || typeof sendMax !== 'object') return 'N/A';
                  const currency = sendMax.currency === 'XRP' ? 'XRP' : normalizeCurrencyCode(sendMax.currency);
                  return `${fNumber(sendMax.value)} ${currency}`;
                })()}
              </Typography>
            )}
          </Box>

          <Tooltip title="View Transaction">
            <IconButton
              size="small"
              onClick={() => window.open(`/tx/${tx.hash}`, '_blank')}
              sx={{
                width: 24,
                height: 24,
                '&:hover': {
                  background: alpha(theme.palette.primary.main, 0.1)
                }
              }}
            >
              <OpenInNewIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>
    </Fade>
  );
});

const CreatorTransactionsDialog = memo(({ open, onClose, creatorAddress, tokenName, onLatestTransaction }) => {
  const theme = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [newTxCount, setNewTxCount] = useState(0);
  
  const clientRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  // Fetch historical transactions
  const fetchTransactionHistory = useCallback(async () => {
    if (!creatorAddress || !open) return;

    setLoading(true);
    setError(null);

    try {
      const client = new Client(XRPL_WEBSOCKET_URL);
      await client.connect();

      const accountTxResponse = await client.request({
        command: 'account_tx',
        account: creatorAddress,
        ledger_index_min: -1,
        ledger_index_max: -1,
        limit: 50,
        forward: false
      });

      await client.disconnect();

      if (accountTxResponse.result.transactions) {
        // Filter out small XRP payments (less than 1 XRP)
        const filteredTransactions = accountTxResponse.result.transactions.filter(txData => {
          const tx = txData.tx;
          
          // Keep all non-payment transactions
          if (tx.TransactionType !== 'Payment') return true;
          
          // For payments, check if amount is XRP and >= 1 XRP
          if (typeof tx.Amount === 'string') {
            // XRP amount (in drops)
            const xrpAmount = parseInt(tx.Amount) / 1000000; // Convert drops to XRP
            return xrpAmount >= 1;
          }
          
          // Keep issued currency payments
          return true;
        });
        
        setTransactions(filteredTransactions.slice(0, 20));
        // Pass latest transaction to parent
        if (filteredTransactions.length > 0 && onLatestTransaction) {
          onLatestTransaction(filteredTransactions[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching transaction history:', err);
      setError(err.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [creatorAddress, open]);

  // Subscribe to real-time transactions
  const subscribeToTransactions = useCallback(async () => {
    if (!creatorAddress || !open || clientRef.current) return;

    try {
      const client = new Client(XRPL_WEBSOCKET_URL, {
        connectionTimeout: 10000
      });

      clientRef.current = client;

      client.on('error', (error) => {
        console.error('WebSocket error:', error);
        setError('WebSocket connection error');
        handleReconnect();
      });

      client.on('disconnected', () => {
        console.log('WebSocket disconnected');
        setIsSubscribed(false);
        handleReconnect();
      });

      await client.connect();

      // Subscribe to account transactions
      const subscribeResponse = await client.request({
        command: 'subscribe',
        accounts: [creatorAddress]
      });

      if (subscribeResponse.result.status === 'success') {
        setIsSubscribed(true);
        reconnectAttemptsRef.current = 0;

        // Listen for transaction stream
        client.on('transaction', (tx) => {
          if (tx.transaction && 
              (tx.transaction.Account === creatorAddress || 
               tx.transaction.Destination === creatorAddress)) {
            
            // Filter out small XRP payments (less than 1 XRP)
            const transaction = tx.transaction;
            if (transaction.TransactionType === 'Payment' && typeof transaction.Amount === 'string') {
              const xrpAmount = parseInt(transaction.Amount) / 1000000; // Convert drops to XRP
              if (xrpAmount < 1) {
                return; // Skip small XRP payments
              }
            }
            
            // Add new transaction to the beginning of the list
            setTransactions(prev => {
              const newTx = {
                tx: tx.transaction,
                meta: tx.meta,
                validated: tx.validated,
                ledger_index: tx.ledger_index
              };
              
              setNewTxCount(prevCount => prevCount + 1);
              
              // Keep only the most recent transactions up to limit
              const updatedTxs = [newTx, ...prev].slice(0, 20);
              
              // Pass latest transaction to parent
              if (onLatestTransaction) {
                onLatestTransaction(newTx);
              }
              
              return updatedTxs;
            });
          }
        });
      }
    } catch (err) {
      console.error('Error subscribing to transactions:', err);
      setError('Failed to subscribe to real-time updates');
      handleReconnect();
    }
  }, [creatorAddress, open]);

  // Handle reconnection logic
  const handleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectAttemptsRef.current += 1;
    const backoffTime = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`Attempting to reconnect (attempt ${reconnectAttemptsRef.current})...`);
      if (clientRef.current) {
        clientRef.current.removeAllListeners();
        clientRef.current = null;
      }
      subscribeToTransactions();
    }, backoffTime);
  }, [subscribeToTransactions]);

  // Unsubscribe from transactions
  const unsubscribe = useCallback(async () => {
    if (!clientRef.current || !clientRef.current.isConnected()) return;

    try {
      await clientRef.current.request({
        command: 'unsubscribe',
        accounts: [creatorAddress]
      });
    } catch (err) {
      console.error('Error unsubscribing:', err);
    } finally {
      if (clientRef.current) {
        await clientRef.current.disconnect();
        clientRef.current.removeAllListeners();
        clientRef.current = null;
      }
      setIsSubscribed(false);
    }
  }, [creatorAddress]);

  // Initialize when dialog opens
  useEffect(() => {
    if (open && creatorAddress) {
      fetchTransactionHistory();
      subscribeToTransactions();
      
      // Auto-refresh every 5 seconds
      const refreshInterval = setInterval(() => {
        fetchTransactionHistory();
      }, 5000);
      
      return () => {
        clearInterval(refreshInterval);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        unsubscribe();
      };
    }
  }, [creatorAddress, open]);

  // Reset new transaction count after delay
  useEffect(() => {
    if (open && newTxCount > 0) {
      const timer = setTimeout(() => {
        setNewTxCount(0);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [open, newTxCount]);

  // Manual refresh
  const refresh = () => {
    fetchTransactionHistory();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          background: theme.palette.background.paper,
          backgroundImage: 'none'
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          p: 2,
          pb: 1,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
              Creator Activity
            </Typography>
            {isSubscribed && (
              <Tooltip title="Live monitoring active">
                <FiberManualRecordIcon 
                  sx={{ 
                    fontSize: 8, 
                    color: theme.palette.success.main,
                    animation: 'pulse 2s ease-in-out infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.3 }
                    }
                  }} 
                />
              </Tooltip>
            )}
            {newTxCount > 0 && (
              <Badge 
                badgeContent={newTxCount} 
                color="primary"
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.7rem',
                    height: '16px',
                    minWidth: '16px'
                  }
                }}
              />
            )}
          </Stack>
          
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Refresh">
              <IconButton 
                size="small" 
                onClick={refresh}
                disabled={loading}
                sx={{ 
                  '&:hover': { 
                    background: alpha(theme.palette.primary.main, 0.1) 
                  }
                }}
              >
                <RefreshIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <IconButton 
              size="small" 
              onClick={onClose}
              sx={{ 
                '&:hover': { 
                  background: alpha(theme.palette.error.main, 0.1) 
                }
              }}
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Stack>
        </Stack>
        
        <Typography 
          variant="caption" 
          sx={{ 
            color: alpha(theme.palette.text.secondary, 0.7),
            fontSize: '0.75rem',
            display: 'block',
            mt: 0.5
          }}
        >
          Monitoring transactions from {creatorAddress?.slice(0, 6)}...{creatorAddress?.slice(-4)} (XRP payments ≥ 1 XRP)
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ p: 2, maxHeight: '70vh', overflowY: 'auto' }}>
        {loading && transactions.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <CircularProgress size={32} />
            <Typography variant="body2" sx={{ mt: 2, color: alpha(theme.palette.text.secondary, 0.7) }}>
              Loading transactions...
            </Typography>
          </Box>
        ) : error ? (
          <Alert 
            severity="error" 
            sx={{ 
              borderRadius: '8px',
              background: alpha(theme.palette.error.main, 0.1)
            }}
          >
            {error}
          </Alert>
        ) : transactions.length === 0 ? (
          <Box 
            sx={{ 
              py: 4, 
              textAlign: 'center',
              borderRadius: '8px',
              background: alpha(theme.palette.background.default, 0.5)
            }}
          >
            <Typography variant="body2" sx={{ color: alpha(theme.palette.text.secondary, 0.7) }}>
              No transactions found
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1}>
            {transactions.slice(0, 20).map((tx, index) => (
              <TransactionRow 
                key={tx.tx?.hash || index} 
                transaction={tx} 
                isNew={index < newTxCount}
                creatorAddress={creatorAddress}
              />
            ))}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
});

CreatorTransactionsDialog.displayName = 'CreatorTransactionsDialog';
TransactionRow.displayName = 'TransactionRow';

export default CreatorTransactionsDialog;