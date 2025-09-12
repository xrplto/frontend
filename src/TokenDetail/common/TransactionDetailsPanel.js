import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  useTheme,
  Fade,
  Tooltip,
  Badge,
  Divider,
  Avatar,
  Drawer
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import axios from 'axios';
import { fNumber } from 'src/utils/formatNumber';
import { formatDistanceToNow } from 'date-fns';
import { parseAmount } from 'src/utils/parse/amount';
import Decimal from 'decimal.js';
import { normalizeCurrencyCode, rippleTimeToISO8601, dropsToXrp } from 'src/utils/parse/utils';
import { Client } from 'xrpl';

const TransactionDetailsPanel = memo(({ open, onClose, transactionHash, onSelectTransaction }) => {
  const theme = useTheme();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  
  // Fetch transaction details
  const fetchTransactionDetails = useCallback(async () => {
    if (!transactionHash || !open) return;

    setLoading(true);
    setError(null);

    try {
      const client = new Client('wss://s1.ripple.com');
      await client.connect();

      const txResponse = await client.request({
        command: 'tx',
        transaction: transactionHash
      });

      await client.disconnect();

      if (txResponse.result) {
        setTransaction(txResponse.result);
      } else {
        setError('Transaction not found');
      }
    } catch (err) {
      console.error('Error fetching transaction details:', err);
      setError(err.message || 'Failed to fetch transaction');
    } finally {
      setLoading(false);
    }
  }, [transactionHash, open]);

  // Initialize when panel opens
  useEffect(() => {
    if (open && transactionHash) {
      fetchTransactionDetails();
    }
  }, [transactionHash, open, fetchTransactionDetails]);

  const copyToClipboard = () => {
    if (transactionHash) {
      navigator.clipboard.writeText(transactionHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAmount = (amount) => {
    if (!amount) return 'N/A';
    
    if (typeof amount === 'string') {
      // XRP amount in drops
      return `${dropsToXrp(amount)} XRP`;
    }
    
    if (typeof amount === 'object' && amount.value) {
      const value = new Decimal(amount.value).toString();
      const currency = normalizeCurrencyCode(amount.currency);
      return `${value} ${currency}`;
    }
    
    return 'N/A';
  };

  const formatTime = (date) => {
    if (!date) return 'Unknown';
    const txDate = new Date(rippleTimeToISO8601(date));
    return formatDistanceToNow(txDate, { addSuffix: true });
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'Payment':
        return 'mdi:cash-fast';
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
      default:
        return 'mdi:transfer';
    }
  };

  const getTransactionColor = (result) => {
    if (result === 'tesSUCCESS') {
      return theme.palette.success.main;
    }
    return theme.palette.error.main;
  };

  const getPlatformFromSourceTag = (sourceTag) => {
    const platformMap = {
      74920348: 'First Ledger',
      10011010: 'Magnetic',
      101102979: 'xrp.cafe',
      20221212: 'XPMarket',
      69420589: 'Bidds',
      110100111: 'Sologenic',
      19089388: 'N/A',
      20102305: 'Opulence',
      13888813: 'Zerpmon',
      11782013: 'ANODEX',
      100010010: 'Xrpl Daddy',
      123321: 'BearBull Scalper',
      494456745: 'N/A',
      42697468: 'Bithomp',
      4152544945: 'ArtDept.fun',
      411555: 'N/A',
      80085: 'Zerpaay',
      510162502: 'Sonar Muse',
      80008000: 'Orchestra'
    };
    
    return platformMap[sourceTag] || null;
  };

  if (!open) return null;

  return (
    <Drawer
      anchor="right"
      variant="persistent"
      open={open}
      hideBackdrop
      PaperProps={{
        sx: {
          width: { md: 240, lg: 256, xl: 272 },
          minWidth: { md: 236 },
          top: { xs: 56, sm: 56, md: 56 },
          height: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 56px)', md: 'calc(100vh - 56px)' },
          borderLeft: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          backgroundColor: theme.palette.background.paper,
          boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.08)}, 0 1px 2px ${alpha(
            theme.palette.common.black,
            0.04
          )}`,
          overflow: 'hidden'
        }
      }}
      ModalProps={{ keepMounted: true }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          p: 1.5,
          pb: 1,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          flexShrink: 0
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
              Transaction Details
            </Typography>
          </Stack>
          
          <Stack direction="row" spacing={0.5}>
            {transactionHash && (
              <>
                <Tooltip title={copied ? 'Copied!' : 'Copy Hash'}>
                  <IconButton 
                    size="small" 
                    onClick={copyToClipboard}
                    sx={{ 
                      '&:hover': { 
                        background: alpha(theme.palette.primary.main, 0.1) 
                      }
                    }}
                  >
                    <ContentCopyIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="View on XRPL">
                  <IconButton 
                    size="small" 
                    onClick={() => window.open(`https://xrpl.to/tx/${transactionHash}`, '_blank')}
                    sx={{ 
                      '&:hover': { 
                        background: alpha(theme.palette.primary.main, 0.1) 
                      }
                    }}
                  >
                    <OpenInNewIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </>
            )}
            <Tooltip title="Refresh">
              <IconButton 
                size="small" 
                onClick={fetchTransactionDetails}
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
        
        {transactionHash && (
          <Typography 
            variant="caption" 
            sx={{ 
              color: alpha(theme.palette.text.secondary, 0.7),
              fontSize: '0.7rem',
              display: 'block',
              mt: 0.25,
              fontFamily: 'monospace',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {transactionHash.slice(0, 16)}...{transactionHash.slice(-8)}
          </Typography>
        )}
      </Box>
      
      <Box sx={{ p: 1.5, flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <CircularProgress size={32} />
            <Typography variant="body2" sx={{ mt: 2, color: alpha(theme.palette.text.secondary, 0.7) }}>
              Loading transaction...
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
        ) : transaction ? (
          <Stack spacing={2}>
            {/* Transaction Status */}
            <Box 
              sx={{ 
                p: 1.5, 
                borderRadius: '8px',
                background: alpha(
                  transaction.meta?.TransactionResult === 'tesSUCCESS' 
                    ? theme.palette.success.main 
                    : theme.palette.error.main, 
                  0.1
                ),
                border: `1px solid ${alpha(
                  transaction.meta?.TransactionResult === 'tesSUCCESS' 
                    ? theme.palette.success.main 
                    : theme.palette.error.main, 
                  0.2
                )}`
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                {transaction.meta?.TransactionResult === 'tesSUCCESS' ? (
                  <CheckCircleIcon sx={{ fontSize: 20, color: theme.palette.success.main }} />
                ) : (
                  <ErrorIcon sx={{ fontSize: 20, color: theme.palette.error.main }} />
                )}
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {transaction.meta?.TransactionResult === 'tesSUCCESS' ? 'Success' : 'Failed'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.7) }}>
                    {transaction.meta?.TransactionResult || 'Unknown'}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {/* Transaction Type */}
            <Box>
              <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.7), mb: 0.5, display: 'block' }}>
                Type
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: alpha(getTransactionColor(transaction.meta?.TransactionResult), 0.1),
                    border: `1px solid ${alpha(getTransactionColor(transaction.meta?.TransactionResult), 0.2)}`
                  }}
                >
                  <SwapHorizIcon 
                    sx={{ 
                      fontSize: '16px', 
                      color: getTransactionColor(transaction.meta?.TransactionResult)
                    }} 
                  />
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {transaction.TransactionType}
                </Typography>
              </Stack>
            </Box>

            <Divider />

            {/* Ledger Info */}
            <Box>
              <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.7), mb: 0.5, display: 'block' }}>
                Ledger Information
              </Typography>
              <Stack spacing={0.5}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">Ledger</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 500 }}>
                    #{transaction.ledger_index}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">Time</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 500 }}>
                    {formatTime(transaction.date)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">Fee</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 500 }}>
                    {dropsToXrp(transaction.Fee)} XRP
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Divider />

            {/* Platform Info */}
            {transaction.SourceTag && getPlatformFromSourceTag(transaction.SourceTag) && getPlatformFromSourceTag(transaction.SourceTag) !== 'N/A' && (
              <>
                <Box>
                  <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.7), mb: 0.5, display: 'block' }}>
                    Platform
                  </Typography>
                  <Chip 
                    label={getPlatformFromSourceTag(transaction.SourceTag)} 
                    size="small"
                    sx={{ 
                      fontSize: '0.75rem',
                      height: '22px',
                      background: alpha(theme.palette.primary.main, 0.1),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      color: theme.palette.primary.main
                    }}
                  />
                </Box>
                <Divider />
              </>
            )}

            {/* Account Info */}
            <Box>
              <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.7), mb: 0.5, display: 'block' }}>
                Accounts
              </Typography>
              <Stack spacing={1}>
                <Box>
                  <Typography variant="caption" color="text.secondary">From</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <Avatar 
                      src={`https://s1.xrpl.to/account/${transaction.Account}`} 
                      sx={{ width: 20, height: 20, mr: 0.5 }} 
                    />
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontFamily: 'monospace',
                        color: theme.palette.primary.main,
                        cursor: 'pointer',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                      onClick={() => window.open(`https://xrpl.to/profile/${transaction.Account}`, '_blank')}
                    >
                      {transaction.Account.slice(0, 8)}...{transaction.Account.slice(-4)}
                    </Typography>
                  </Box>
                </Box>
                {transaction.Destination && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">To</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      <Avatar 
                        src={`https://s1.xrpl.to/account/${transaction.Destination}`} 
                        sx={{ width: 20, height: 20, mr: 0.5 }} 
                      />
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontFamily: 'monospace',
                          color: theme.palette.primary.main,
                          cursor: 'pointer',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                        onClick={() => window.open(`https://xrpl.to/profile/${transaction.Destination}`, '_blank')}
                      >
                        {transaction.Destination.slice(0, 8)}...{transaction.Destination.slice(-4)}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Stack>
            </Box>

            {/* Amount Info */}
            {(transaction.Amount || transaction.meta?.delivered_amount || transaction.meta?.DeliveredAmount) && (
              <>
                <Divider />
                <Box>
                  <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.7), mb: 0.5, display: 'block' }}>
                    Amount
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatAmount(transaction.meta?.delivered_amount || transaction.meta?.DeliveredAmount || transaction.Amount)}
                  </Typography>
                  {transaction.SendMax && (
                    <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.7), display: 'block' }}>
                      Max: {formatAmount(transaction.SendMax)}
                    </Typography>
                  )}
                </Box>
              </>
            )}

            {/* Offer Details */}
            {transaction.TransactionType === 'OfferCreate' && (
              <>
                <Divider />
                <Box>
                  <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.7), mb: 0.5, display: 'block' }}>
                    Offer Details
                  </Typography>
                  <Stack spacing={0.5}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Offering</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatAmount(transaction.TakerGets)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Requesting</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatAmount(transaction.TakerPays)}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </>
            )}

            {/* Trust Line Details */}
            {transaction.TransactionType === 'TrustSet' && transaction.LimitAmount && (
              <>
                <Divider />
                <Box>
                  <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.7), mb: 0.5, display: 'block' }}>
                    Trust Line
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {formatAmount(transaction.LimitAmount)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.7) }}>
                    {new Decimal(transaction.LimitAmount.value).eq(0) ? 'Removed' : 'Active'}
                  </Typography>
                </Box>
              </>
            )}

            {/* NFT Details */}
            {transaction.NFTokenID && (
              <>
                <Divider />
                <Box>
                  <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.7), mb: 0.5, display: 'block' }}>
                    NFT ID
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontFamily: 'monospace',
                      wordBreak: 'break-all',
                      fontSize: '0.7rem'
                    }}
                  >
                    {transaction.NFTokenID}
                  </Typography>
                </Box>
              </>
            )}

            {/* Memos */}
            {transaction.Memos && transaction.Memos.length > 0 && (
              <>
                <Divider />
                <Box>
                  <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.7), mb: 0.5, display: 'block' }}>
                    Memos
                  </Typography>
                  <Chip 
                    label="Has Memos" 
                    size="small" 
                    variant="outlined"
                    sx={{ fontSize: '0.65rem', height: '18px' }}
                  />
                </Box>
              </>
            )}

            {/* Related Transactions */}
            {transaction.meta?.AffectedNodes && (
              <>
                <Divider />
                <Box>
                  <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.7), mb: 0.5, display: 'block' }}>
                    Affected Nodes
                  </Typography>
                  <Typography variant="caption">
                    {transaction.meta.AffectedNodes.length} ledger entries affected
                  </Typography>
                </Box>
              </>
            )}
          </Stack>
        ) : (
          <Box 
            sx={{ 
              py: 4, 
              textAlign: 'center',
              borderRadius: '8px',
              background: alpha(theme.palette.background.default, 0.5)
            }}
          >
            <Typography variant="body2" sx={{ color: alpha(theme.palette.text.secondary, 0.7) }}>
              Select a transaction to view details
            </Typography>
          </Box>
        )}
      </Box>
      </Box>
    </Drawer>
  );
});

TransactionDetailsPanel.displayName = 'TransactionDetailsPanel';

export default TransactionDetailsPanel;
