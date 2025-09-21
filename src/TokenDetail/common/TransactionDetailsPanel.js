import React, { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  useTheme,
  Tooltip,
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
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { fNumber } from 'src/utils/formatNumber';
import { formatDistanceToNow } from 'date-fns';
import Decimal from 'decimal.js-light';
import { normalizeCurrencyCode, rippleTimeToISO8601, dropsToXrp } from 'src/utils/parse/utils';
import { Client } from 'xrpl';
import { calculateSpread } from 'src/utils/orderbookService';

const TransactionDetailsPanel = memo(
  ({
    open,
    onClose,
    transactionHash,
    onSelectTransaction,
    mode = 'transaction', // 'transaction' | 'orderbook'
    // Orderbook props (when mode === 'orderbook')
    pair,
    asks = [],
    bids = [],
    limitPrice,
    isBuyOrder,
    onAskClick,
    onBidClick
  }) => {
    const theme = useTheme();
    const panelIdRef = useRef(Math.random().toString(36).slice(2));
    const [transaction, setTransaction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const spread = useMemo(
      () =>
        mode === 'orderbook'
          ? calculateSpread(bids, asks)
          : { spreadAmount: 0, spreadPercentage: 0 },
      [mode, bids, asks]
    );
    const bestAsk = useMemo(
      () => (mode === 'orderbook' && asks && asks[0] ? Number(asks[0].price) : null),
      [mode, asks]
    );
    const bestBid = useMemo(
      () => (mode === 'orderbook' && bids && bids[0] ? Number(bids[0].price) : null),
      [mode, bids]
    );

    // Fetch transaction details
    const fetchTransactionDetails = useCallback(async () => {
      if (mode !== 'transaction' || !transactionHash || !open) return;

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
    }, [transactionHash, open, mode]);

    // Initialize when panel opens
    useEffect(() => {
      if (open && transactionHash && mode === 'transaction') {
        fetchTransactionDetails();
      }
    }, [transactionHash, open, mode, fetchTransactionDetails]);

    // Ensure only one right-side drawer is open at a time across the app
    useEffect(() => {
      const handler = (e) => {
        const otherId = e?.detail?.id;
        if (!otherId) return;
        if (otherId !== panelIdRef.current && open) {
          onClose?.();
        }
      };
      if (typeof window !== 'undefined') {
        window.addEventListener('XRPLTO_RIGHT_DRAWER_OPEN', handler);
      }
      return () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener('XRPLTO_RIGHT_DRAWER_OPEN', handler);
        }
      };
    }, [open, onClose]);

    useEffect(() => {
      if (open && typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('XRPLTO_RIGHT_DRAWER_OPEN', { detail: { id: panelIdRef.current } })
        );
      }
    }, [open]);

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

    const getIndicatorProgress = (value) => {
      if (isNaN(value)) return 0;
      let totA = 0,
        avgA = 0,
        totB = 0,
        avgB = 0;
      if (asks.length >= 1) {
        totA = Number(asks[asks.length - 1].sumAmount);
        avgA = totA / asks.length;
      }
      if (bids.length >= 1) {
        totB = Number(bids[bids.length - 1].sumAmount);
        avgB = totB / bids.length;
      }
      const avg = (Number(avgA) + Number(avgB)) / 2;
      const max100 = (avg / 50) * 100;
      const progress = value / max100 > 1 ? 1 : value / max100;
      return (progress * 100).toFixed(0);
    };

    return (
      <Drawer
        anchor="right"
        variant="persistent"
        open={open}
        hideBackdrop
        PaperProps={{
          sx: {
            width:
              mode === 'orderbook' ? { md: 280, lg: 320, xl: 360 } : { md: 240, lg: 256, xl: 272 },
            minWidth: { md: 236 },
            top: { xs: 56, sm: 56, md: 56 },
            height: {
              xs: 'calc(100vh - 56px)',
              sm: 'calc(100vh - 56px)',
              md: 'calc(100vh - 56px)'
            },
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
                  {mode === 'orderbook' ? 'Order Book' : 'Transaction Details'}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={0.5}>
                {mode !== 'orderbook' && transactionHash && (
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
                        onClick={() =>
                          window.open(`https://xrpl.to/tx/${transactionHash}`, '_blank')
                        }
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
                {mode !== 'orderbook' && (
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
                )}
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

            {mode !== 'orderbook' && transactionHash && (
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

            {mode === 'orderbook' && pair && (
              <>
                <Typography
                  variant="caption"
                  sx={{
                    color: alpha(theme.palette.text.secondary, 0.7),
                    fontSize: '0.7rem',
                    display: 'block',
                    mt: 0.25
                  }}
                >
                  {pair.curr1?.name || pair.curr1?.currency}/
                  {pair.curr2?.name || pair.curr2?.currency}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                  <Tooltip title="Highest price buyers are willing to pay">
                    <Chip
                      size="small"
                      color="success"
                      variant="outlined"
                      label={bestBid != null ? `Best Bid ${fNumber(bestBid)}` : 'No bids'}
                      sx={{ height: 22, fontSize: '0.7rem' }}
                    />
                  </Tooltip>
                  <Tooltip title="Lowest price sellers are willing to accept">
                    <Chip
                      size="small"
                      color="error"
                      variant="outlined"
                      label={bestAsk != null ? `Best Ask ${fNumber(bestAsk)}` : 'No asks'}
                      sx={{ height: 22, fontSize: '0.7rem' }}
                    />
                  </Tooltip>
                  <Typography
                    variant="caption"
                    sx={{ color: alpha(theme.palette.text.secondary, 0.7), fontSize: '0.7rem' }}
                  >
                    Tip: Click a row to set price
                  </Typography>
                </Stack>
              </>
            )}
          </Box>

          <Box
            sx={{ p: 1.5, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
          >
            {mode !== 'orderbook' && loading ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <CircularProgress size={32} />
                <Typography
                  variant="body2"
                  sx={{ mt: 2, color: alpha(theme.palette.text.secondary, 0.7) }}
                >
                  Loading transaction...
                </Typography>
              </Box>
            ) : mode !== 'orderbook' && error ? (
              <Alert
                severity="error"
                sx={{
                  borderRadius: '8px',
                  background: alpha(theme.palette.error.main, 0.1)
                }}
              >
                {error}
              </Alert>
            ) : mode !== 'orderbook' && transaction ? (
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
                        {transaction.meta?.TransactionResult === 'tesSUCCESS'
                          ? 'Success'
                          : 'Failed'}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: alpha(theme.palette.text.secondary, 0.7) }}
                      >
                        {transaction.meta?.TransactionResult || 'Unknown'}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                {/* Transaction Type */}
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: alpha(theme.palette.text.secondary, 0.7),
                      mb: 0.5,
                      display: 'block'
                    }}
                  >
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
                        background: alpha(
                          getTransactionColor(transaction.meta?.TransactionResult),
                          0.1
                        ),
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
                  <Typography
                    variant="caption"
                    sx={{
                      color: alpha(theme.palette.text.secondary, 0.7),
                      mb: 0.5,
                      display: 'block'
                    }}
                  >
                    Ledger Information
                  </Typography>
                  <Stack spacing={0.5}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">
                        Ledger
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 500 }}>
                        #{transaction.ledger_index}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">
                        Time
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 500 }}>
                        {formatTime(transaction.date)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">
                        Fee
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 500 }}>
                        {dropsToXrp(transaction.Fee)} XRP
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                <Divider />

                {/* Platform Info */}
                {transaction.SourceTag &&
                  getPlatformFromSourceTag(transaction.SourceTag) &&
                  getPlatformFromSourceTag(transaction.SourceTag) !== 'N/A' && (
                    <>
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: alpha(theme.palette.text.secondary, 0.7),
                            mb: 0.5,
                            display: 'block'
                          }}
                        >
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
                  <Typography
                    variant="caption"
                    sx={{
                      color: alpha(theme.palette.text.secondary, 0.7),
                      mb: 0.5,
                      display: 'block'
                    }}
                  >
                    Accounts
                  </Typography>
                  <Stack spacing={1}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        From
                      </Typography>
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
                          onClick={() =>
                            window.open(`https://xrpl.to/profile/${transaction.Account}`, '_blank')
                          }
                        >
                          {transaction.Account.slice(0, 8)}...{transaction.Account.slice(-4)}
                        </Typography>
                      </Box>
                    </Box>
                    {transaction.Destination && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          To
                        </Typography>
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
                            onClick={() =>
                              window.open(
                                `https://xrpl.to/profile/${transaction.Destination}`,
                                '_blank'
                              )
                            }
                          >
                            {transaction.Destination.slice(0, 8)}...
                            {transaction.Destination.slice(-4)}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Stack>
                </Box>

                {/* Amount Info */}
                {(transaction.Amount ||
                  transaction.meta?.delivered_amount ||
                  transaction.meta?.DeliveredAmount) && (
                  <>
                    <Divider />
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: alpha(theme.palette.text.secondary, 0.7),
                          mb: 0.5,
                          display: 'block'
                        }}
                      >
                        Amount
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatAmount(
                          transaction.meta?.delivered_amount ||
                            transaction.meta?.DeliveredAmount ||
                            transaction.Amount
                        )}
                      </Typography>
                      {transaction.SendMax && (
                        <Typography
                          variant="caption"
                          sx={{ color: alpha(theme.palette.text.secondary, 0.7), display: 'block' }}
                        >
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
                      <Typography
                        variant="caption"
                        sx={{
                          color: alpha(theme.palette.text.secondary, 0.7),
                          mb: 0.5,
                          display: 'block'
                        }}
                      >
                        Offer Details
                      </Typography>
                      <Stack spacing={0.5}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Offering
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {formatAmount(transaction.TakerGets)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Requesting
                          </Typography>
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
                      <Typography
                        variant="caption"
                        sx={{
                          color: alpha(theme.palette.text.secondary, 0.7),
                          mb: 0.5,
                          display: 'block'
                        }}
                      >
                        Trust Line
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatAmount(transaction.LimitAmount)}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: alpha(theme.palette.text.secondary, 0.7) }}
                      >
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
                      <Typography
                        variant="caption"
                        sx={{
                          color: alpha(theme.palette.text.secondary, 0.7),
                          mb: 0.5,
                          display: 'block'
                        }}
                      >
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
                      <Typography
                        variant="caption"
                        sx={{
                          color: alpha(theme.palette.text.secondary, 0.7),
                          mb: 0.5,
                          display: 'block'
                        }}
                      >
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
                      <Typography
                        variant="caption"
                        sx={{
                          color: alpha(theme.palette.text.secondary, 0.7),
                          mb: 0.5,
                          display: 'block'
                        }}
                      >
                        Affected Nodes
                      </Typography>
                      <Typography variant="caption">
                        {transaction.meta.AffectedNodes.length} ledger entries affected
                      </Typography>
                    </Box>
                  </>
                )}
              </Stack>
            ) : null}

            {mode === 'orderbook' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                {/* Top half: Asks */}
                <Box
                  sx={{
                    flex: 1,
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                  }}
                >
                  <Box
                    sx={{
                      p: 1,
                      mx: 0.5,
                      borderRadius: '8px',
                      background: alpha(theme.palette.error.main, 0.06)
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <TrendingDownIcon
                        sx={{ fontSize: '0.85rem', color: theme.palette.error.main }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          color: theme.palette.error.main,
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}
                      >
                        Sell Orders ({asks.length})
                      </Typography>
                    </Stack>
                  </Box>
                  <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                    {asks.length > 0 ? (
                      <>
                        <Box
                          sx={{
                            position: 'sticky',
                            top: 0,
                            zIndex: 2,
                            px: 1,
                            py: 0.5,
                            background: theme.palette.background.paper,
                            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography
                              variant="caption"
                              sx={{ color: theme.palette.error.main, fontWeight: 600 }}
                            >
                              Price
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: alpha(theme.palette.text.secondary, 0.7) }}
                            >
                              Amount
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: alpha(theme.palette.text.secondary, 0.7),
                                display: { xs: 'none', sm: 'inline' }
                              }}
                            >
                              Cum
                            </Typography>
                          </Box>
                        </Box>
                        <Stack spacing={0.5} sx={{ p: 1 }}>
                          {(() => {
                            const askSlice = asks.slice(0, 30);
                            const displayAsks = askSlice.slice().reverse();
                            const lp = typeof limitPrice === 'number' ? limitPrice : null;
                            return displayAsks.map((level, idx) => {
                              const origIdx = askSlice.length - 1 - idx;
                              const prev = idx > 0 ? displayAsks[idx - 1] : null;
                              const showMarker = Boolean(
                                lp != null &&
                                  isBuyOrder &&
                                  ((idx === 0 && Number(level.price) <= lp) ||
                                    (prev && Number(prev.price) > lp && Number(level.price) <= lp))
                              );
                              return (
                                <React.Fragment
                                  key={`ask-${origIdx}-${level.price}-${level.amount}`}
                                >
                                  {showMarker && (
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        px: 0.5,
                                        py: 0.25
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          flex: 1,
                                          height: '1px',
                                          background: alpha(theme.palette.primary.main, 0.35)
                                        }}
                                      />
                                      <Typography
                                        variant="caption"
                                        sx={{ color: theme.palette.primary.main, fontWeight: 600 }}
                                      >
                                        Your buy limit
                                      </Typography>
                                      <Box
                                        sx={{
                                          flex: 1,
                                          height: '1px',
                                          background: alpha(theme.palette.primary.main, 0.35)
                                        }}
                                      />
                                    </Box>
                                  )}
                                  <Box
                                    onClick={(e) => {
                                      if (onAskClick) onAskClick(e, origIdx);
                                    }}
                                    sx={{
                                      position: 'relative',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      fontSize: '0.75rem',
                                      cursor: 'pointer',
                                      px: 0.5,
                                      py: 0.25,
                                      borderRadius: '4px',
                                      background: showMarker
                                        ? alpha(theme.palette.primary.main, 0.06)
                                        : 'transparent',
                                      '&:hover': {
                                        background: alpha(theme.palette.error.main, 0.06)
                                      }
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        position: 'absolute',
                                        left: 0,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        height: '70%',
                                        width: `${getIndicatorProgress(level.amount)}%`,
                                        background: alpha(theme.palette.error.main, 0.08),
                                        borderRadius: '4px',
                                        pointerEvents: 'none'
                                      }}
                                    />
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: theme.palette.error.main,
                                        position: 'relative',
                                        zIndex: 1
                                      }}
                                    >
                                      {fNumber(level.price)}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      sx={{ position: 'relative', zIndex: 1 }}
                                    >
                                      {fNumber(level.amount)}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        display: { xs: 'none', sm: 'inline' },
                                        color: alpha(theme.palette.text.secondary, 0.8),
                                        position: 'relative',
                                        zIndex: 1
                                      }}
                                    >
                                      {fNumber(level.sumAmount)}
                                    </Typography>
                                  </Box>
                                </React.Fragment>
                              );
                            });
                          })()}
                        </Stack>
                      </>
                    ) : (
                      <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography
                          variant="caption"
                          sx={{ color: alpha(theme.palette.text.secondary, 0.8) }}
                        >
                          No sell orders
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>

                {/* Middle spread bar */}
                {spread.spreadAmount > 0 ? (
                  <Box
                    sx={{
                      px: 1,
                      py: 0.75,
                      mx: 0.5,
                      background: alpha(theme.palette.warning.main, 0.06),
                      borderTop: `1px dashed ${alpha(theme.palette.warning.main, 0.3)}`,
                      borderBottom: `1px dashed ${alpha(theme.palette.warning.main, 0.3)}`
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 600,
                          color: theme.palette.text.secondary,
                          fontSize: '0.7rem'
                        }}
                      >
                        Spread
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography
                          variant="caption"
                          sx={{
                            color: theme.palette.text.secondary,
                            fontSize: '0.7rem',
                            fontWeight: 500
                          }}
                        >
                          {fNumber(spread.spreadAmount)}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: theme.palette.warning.main,
                            fontSize: '0.7rem',
                            fontWeight: 600
                          }}
                        >
                          ({Number(spread.spreadPercentage).toFixed(2)}%)
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      height: '1px',
                      background: `linear-gradient(90deg, transparent 0%, ${alpha(theme.palette.divider, 0.3)} 50%, transparent 100%)`,
                      m: 1
                    }}
                  />
                )}

                {/* Bottom half: Bids */}
                <Box
                  sx={{
                    flex: 1,
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                  }}
                >
                  <Box
                    sx={{
                      p: 1,
                      mx: 0.5,
                      borderRadius: '8px',
                      background: alpha(theme.palette.success.main, 0.06)
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <TrendingUpIcon
                        sx={{ fontSize: '0.85rem', color: theme.palette.success.main }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          color: theme.palette.success.main,
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}
                      >
                        Buy Orders ({bids.length})
                      </Typography>
                    </Stack>
                  </Box>
                  <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                    {bids.length > 0 ? (
                      <>
                        <Box
                          sx={{
                            position: 'sticky',
                            top: 0,
                            zIndex: 2,
                            px: 1,
                            py: 0.5,
                            background: theme.palette.background.paper,
                            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography
                              variant="caption"
                              sx={{ color: theme.palette.success.main, fontWeight: 600 }}
                            >
                              Price
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: alpha(theme.palette.text.secondary, 0.7) }}
                            >
                              Amount
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: alpha(theme.palette.text.secondary, 0.7),
                                display: { xs: 'none', sm: 'inline' }
                              }}
                            >
                              Cum
                            </Typography>
                          </Box>
                        </Box>
                        <Stack spacing={0.5} sx={{ p: 1 }}>
                          {(() => {
                            const bidSlice = bids.slice(0, 30);
                            const lp = typeof limitPrice === 'number' ? limitPrice : null;
                            return bidSlice.map((level, idx) => {
                              const prev = idx > 0 ? bidSlice[idx - 1] : null;
                              const showMarker = Boolean(
                                lp != null &&
                                  !isBuyOrder &&
                                  ((idx === 0 && Number(level.price) < lp) ||
                                    (prev && Number(prev.price) >= lp && Number(level.price) < lp))
                              );
                              return (
                                <React.Fragment key={`bid-${idx}-${level.price}-${level.amount}`}>
                                  {showMarker && (
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        px: 0.5,
                                        py: 0.25
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          flex: 1,
                                          height: '1px',
                                          background: alpha(theme.palette.primary.main, 0.35)
                                        }}
                                      />
                                      <Typography
                                        variant="caption"
                                        sx={{ color: theme.palette.primary.main, fontWeight: 600 }}
                                      >
                                        Your sell limit
                                      </Typography>
                                      <Box
                                        sx={{
                                          flex: 1,
                                          height: '1px',
                                          background: alpha(theme.palette.primary.main, 0.35)
                                        }}
                                      />
                                    </Box>
                                  )}
                                  <Box
                                    onClick={(e) => {
                                      if (onBidClick) onBidClick(e, idx);
                                    }}
                                    sx={{
                                      position: 'relative',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      fontSize: '0.75rem',
                                      cursor: 'pointer',
                                      px: 0.5,
                                      py: 0.25,
                                      borderRadius: '4px',
                                      background: showMarker
                                        ? alpha(theme.palette.primary.main, 0.06)
                                        : 'transparent',
                                      '&:hover': {
                                        background: alpha(theme.palette.success.main, 0.06)
                                      }
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        position: 'absolute',
                                        left: 0,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        height: '70%',
                                        width: `${getIndicatorProgress(level.amount)}%`,
                                        background: alpha(theme.palette.success.main, 0.08),
                                        borderRadius: '4px',
                                        pointerEvents: 'none'
                                      }}
                                    />
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: theme.palette.success.main,
                                        position: 'relative',
                                        zIndex: 1
                                      }}
                                    >
                                      {fNumber(level.price)}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      sx={{ position: 'relative', zIndex: 1 }}
                                    >
                                      {fNumber(level.amount)}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        display: { xs: 'none', sm: 'inline' },
                                        color: alpha(theme.palette.text.secondary, 0.8),
                                        position: 'relative',
                                        zIndex: 1
                                      }}
                                    >
                                      {fNumber(level.sumAmount)}
                                    </Typography>
                                  </Box>
                                </React.Fragment>
                              );
                            });
                          })()}
                        </Stack>
                      </>
                    ) : (
                      <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography
                          variant="caption"
                          sx={{ color: alpha(theme.palette.text.secondary, 0.8) }}
                        >
                          No buy orders
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>

                {/* Empty State */}
                {bids.length === 0 && asks.length === 0 && (
                  <Box
                    sx={{
                      py: 3,
                      textAlign: 'center',
                      borderRadius: '12px',
                      background: alpha(theme.palette.background.paper, 0.1),
                      border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                      m: 1.5
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: alpha(theme.palette.text.secondary, 0.8),
                        fontSize: '0.85rem',
                        fontWeight: 500
                      }}
                    >
                      No orders available
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Drawer>
    );
  }
);

TransactionDetailsPanel.displayName = 'TransactionDetailsPanel';

export default TransactionDetailsPanel;
