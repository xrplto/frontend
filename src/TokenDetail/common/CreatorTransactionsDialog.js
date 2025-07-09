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

const TransactionRow = memo(({ transaction, isNew }) => {
  const theme = useTheme();
  const { tx, meta, validated, ledger_index } = transaction;
  
  const txType = tx.TransactionType;
  const isIncoming = tx.Destination === tx.Account;
  
  const formatTxAmount = () => {
    if (tx.Amount && txType === 'Payment') {
      const amount = parseAmount(tx.Amount);
      if (amount.currency === 'XRP') {
        return `${fNumber(amount.value)} XRP`;
      }
      const readableCurrency = normalizeCurrencyCode(amount.currency);
      return `${fNumber(amount.value)} ${readableCurrency}`;
    }
    
    if (txType === 'OfferCreate' && tx.TakerGets && tx.TakerPays) {
      const takerGets = parseAmount(tx.TakerGets);
      const takerPays = parseAmount(tx.TakerPays);
      
      const getsCurrency = takerGets.currency === 'XRP' ? 'XRP' : normalizeCurrencyCode(takerGets.currency);
      const paysCurrency = takerPays.currency === 'XRP' ? 'XRP' : normalizeCurrencyCode(takerPays.currency);
      
      return `${fNumber(takerGets.value)} ${getsCurrency} → ${fNumber(takerPays.value)} ${paysCurrency}`;
    }
    
    if (txType === 'TrustSet' && tx.LimitAmount) {
      const limit = parseAmount(tx.LimitAmount);
      const limitCurrency = normalizeCurrencyCode(limit.currency);
      return `${fNumber(limit.value)} ${limitCurrency}`;
    }
    
    return 'N/A';
  };

  const formatTime = () => {
    if (tx.date) {
      const date = new Date((tx.date + 946684800) * 1000);
      return formatDistanceToNow(date, { addSuffix: true });
    }
    return 'Pending';
  };

  const getTxIcon = () => {
    switch (txType) {
      case 'Payment':
        return isIncoming ? 'mdi:arrow-down-circle' : 'mdi:arrow-up-circle';
      case 'OfferCreate':
        return 'mdi:swap-horizontal';
      case 'TrustSet':
        return 'mdi:link-variant';
      case 'NFTokenCreateOffer':
      case 'NFTokenAcceptOffer':
        return 'mdi:image-outline';
      default:
        return 'mdi:transfer';
    }
  };

  const getTxColor = () => {
    if (!validated) return theme.palette.warning.main;
    switch (txType) {
      case 'Payment':
        return isIncoming ? theme.palette.success.main : theme.palette.error.main;
      case 'OfferCreate':
        return theme.palette.info.main;
      case 'TrustSet':
        return theme.palette.primary.main;
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
          background: isNew 
            ? alpha(theme.palette.primary.main, 0.08)
            : alpha(theme.palette.background.default, 0.5),
          border: `1px solid ${alpha(theme.palette.divider, isNew ? 0.2 : 0.1)}`,
          transition: 'all 0.2s ease',
          '&:hover': {
            background: alpha(theme.palette.background.paper, 0.8),
            borderColor: alpha(getTxColor(), 0.3)
          }
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
              background: alpha(getTxColor(), 0.1),
              border: `1px solid ${alpha(getTxColor(), 0.2)}`
            }}
          >
            <Icon 
              icon={getTxIcon()} 
              style={{ 
                fontSize: '18px', 
                color: getTxColor()
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
                {txType}
              </Typography>
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

          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: getTxColor(),
              fontSize: '0.875rem',
              minWidth: '100px',
              textAlign: 'right'
            }}
          >
            {txType === 'Payment' && !isIncoming && '-'}
            {formatTxAmount()}
          </Typography>

          <Tooltip title="View on Explorer">
            <IconButton
              size="small"
              onClick={() => window.open(`https://livenet.xrpl.org/transactions/${tx.hash}`, '_blank')}
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

const CreatorTransactionsDialog = memo(({ open, onClose, creatorAddress, tokenName }) => {
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
        limit: 20,
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
        
        setTransactions(filteredTransactions);
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
              return [newTx, ...prev].slice(0, 20);
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
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      unsubscribe();
    };
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
      
      <DialogContent sx={{ p: 2, maxHeight: '60vh', overflowY: 'auto' }}>
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