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
import { fNumber } from 'src/utils/formatters';
import { formatDistanceToNow } from 'date-fns';
import Decimal from 'decimal.js-light';
import { normalizeCurrencyCode, rippleTimeToISO8601, dropsToXrp } from 'src/utils/parseUtils';
import { Client } from 'xrpl';
import { calculateSpread } from 'src/utils/parseUtils';

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
    onBidClick,
    embedded = false
  }) => {
    const theme = useTheme();
    const panelIdRef = useRef(Math.random().toString(36).slice(2));
    const asksScrollRef = useRef(null);
    const [transaction, setTransaction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [showDepth, setShowDepth] = useState(false);
    const [tooltip, setTooltip] = useState(null);
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

    // Scroll asks to bottom on open/update
    useEffect(() => {
      if (mode === 'orderbook' && open && asksScrollRef.current && asks.length > 0) {
        requestAnimationFrame(() => {
          if (asksScrollRef.current) {
            asksScrollRef.current.scrollTop = asksScrollRef.current.scrollHeight;
          }
        });
      }
    }, [mode, open, asks]);

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
          // Flatten tx_json into result for easier access
          const flattenedResult = {
            ...txResponse.result,
            ...txResponse.result.tx_json
          };

          console.log('=== TRANSACTION RESPONSE ===');
          console.log('Full response:', JSON.stringify(txResponse.result, null, 2));
          console.log('Transaction type:', flattenedResult.TransactionType);
          console.log('Account (From):', flattenedResult.Account);
          console.log('Destination (To):', flattenedResult.Destination);
          console.log('Amount:', flattenedResult.Amount);
          console.log('Date:', flattenedResult.date);
          console.log('Date type:', typeof flattenedResult.date);
          console.log('Fee:', flattenedResult.Fee);
          console.log('Ledger Index:', flattenedResult.ledger_index);
          console.log('Meta:', flattenedResult.meta);
          console.log('Transaction Result:', flattenedResult.meta?.TransactionResult);
          console.log('Delivered Amount:', flattenedResult.meta?.delivered_amount);
          console.log('DeliveredAmount:', flattenedResult.meta?.DeliveredAmount);
          console.log('Source Tag:', flattenedResult.SourceTag);
          console.log('Memos:', flattenedResult.Memos);
          console.log('NFTokenID:', flattenedResult.NFTokenID);
          console.log('TakerGets:', flattenedResult.TakerGets);
          console.log('TakerPays:', flattenedResult.TakerPays);
          console.log('LimitAmount:', flattenedResult.LimitAmount);
          console.log('SendMax:', flattenedResult.SendMax);
          console.log('Affected Nodes:', flattenedResult.meta?.AffectedNodes);
          console.log('Close Time ISO:', flattenedResult.close_time_iso);
          console.log('========================');

          setTransaction(flattenedResult);
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

    const decodeMemo = (hexString) => {
      try {
        if (!hexString) return null;
        // Convert hex to string
        let str = '';
        for (let i = 0; i < hexString.length; i += 2) {
          const byte = parseInt(hexString.substr(i, 2), 16);
          if (byte === 0) break; // Stop at null terminator
          str += String.fromCharCode(byte);
        }
        return str || hexString; // Return decoded or original if empty
      } catch (err) {
        console.error('Error decoding memo:', err);
        return hexString; // Return original hex if decode fails
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

    const content = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box
            sx={{
              p: 1.5,
              pb: 1,
              borderBottom: `1.5px solid ${alpha(theme.palette.divider, 0.12)}`,
              flexShrink: 0
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Typography variant="h6" sx={{ fontWeight: 400, fontSize: '0.875rem' }}>
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
                  fontSize: '9px',
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
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 0.25 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: alpha(theme.palette.text.secondary, 0.7),
                      fontSize: '9px'
                    }}
                  >
                    {pair.curr1?.name || pair.curr1?.currency}/
                    {pair.curr2?.name || pair.curr2?.currency}
                  </Typography>
                  <Chip
                    size="small"
                    label={showDepth ? 'Book' : 'Depth'}
                    onClick={() => setShowDepth(!showDepth)}
                    sx={{
                      height: 18,
                      fontSize: '9px',
                      fontWeight: 400,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      backgroundColor: 'transparent',
                      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.04),
                        borderColor: theme.palette.primary.main
                      }
                    }}
                  />
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5, flexWrap: 'wrap' }}>
                  <Chip
                    size="small"
                    variant="outlined"
                    label={bestBid != null ? `${fNumber(bestBid)}` : 'No bids'}
                    sx={{
                      height: 18,
                      fontSize: '9px',
                      fontWeight: 400,
                      borderRadius: '6px',
                      borderWidth: '1.5px',
                      borderColor: alpha(theme.palette.success.main, 0.25),
                      color: theme.palette.success.main,
                      backgroundColor: 'transparent',
                      '& .MuiChip-label': { px: 0.5, py: 0 }
                    }}
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    label={bestAsk != null ? `${fNumber(bestAsk)}` : 'No asks'}
                    sx={{
                      height: 18,
                      fontSize: '9px',
                      fontWeight: 400,
                      borderRadius: '6px',
                      borderWidth: '1.5px',
                      borderColor: alpha(theme.palette.error.main, 0.25),
                      color: theme.palette.error.main,
                      backgroundColor: 'transparent',
                      '& .MuiChip-label': { px: 0.5, py: 0 }
                    }}
                  />
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
                  borderRadius: '12px',
                  background: alpha(theme.palette.error.main, 0.1)
                }}
              >
                {error}
              </Alert>
            ) : mode !== 'orderbook' && transaction ? (
              <Stack spacing={2}>
                {/* Human-Readable Summary */}
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: '12px',
                    background: 'transparent',
                    border: `1.5px solid ${alpha(theme.palette.divider, 0.15)}`
                  }}
                >
                  <Typography variant="body2" sx={{ lineHeight: 1.5, fontSize: '14px' }}>
                    {(() => {
                      const { TransactionType, Account, Destination, Amount, SendMax, Flags, meta } = transaction;
                      const formatAcc = (acc) => `${acc?.slice(0, 6)}...${acc?.slice(-3)}`;
                      const formatAmt = (amt) => {
                        if (typeof amt === 'string') return `${dropsToXrp(amt)} XRP`;
                        if (amt?.value) return `${new Decimal(amt.value).toFixed(2)} ${normalizeCurrencyCode(amt.currency)}`;
                        return '';
                      };
                      const delivered = meta?.delivered_amount || meta?.DeliveredAmount || Amount;

                      switch (TransactionType) {
                        case 'Payment':
                          return Account === Destination
                            ? `${formatAcc(Account)} swapped for ${formatAmt(delivered)}`
                            : `${formatAcc(Account)} sent ${formatAmt(delivered)} to ${formatAcc(Destination)}`;
                        case 'OfferCreate':
                          return `${formatAcc(Account)} placed ${Flags & 0x00080000 ? 'sell' : 'buy'} order`;
                        case 'OfferCancel':
                          return `${formatAcc(Account)} cancelled order`;
                        case 'TrustSet':
                          return `${formatAcc(Account)} ${transaction.LimitAmount && new Decimal(transaction.LimitAmount.value).isZero() ? 'removed' : 'created'} trust line`;
                        case 'NFTokenMint':
                          return `${formatAcc(Account)} minted NFT`;
                        case 'NFTokenCreateOffer':
                          return `${formatAcc(Account)} created NFT offer`;
                        case 'NFTokenAcceptOffer':
                          return `${formatAcc(Account)} completed NFT trade`;
                        case 'NFTokenBurn':
                          return `${formatAcc(Account)} burned NFT`;
                        case 'AMMDeposit':
                          return `${formatAcc(Account)} added liquidity`;
                        case 'AMMWithdraw':
                          return `${formatAcc(Account)} removed liquidity`;
                        default:
                          return `${TransactionType} by ${formatAcc(Account)}`;
                      }
                    })()}
                  </Typography>
                </Box>

                {/* Transaction Status */}
                <Stack direction="row" spacing={1}>
                  <Chip
                    icon={transaction.meta?.TransactionResult === 'tesSUCCESS' ? <CheckCircleIcon /> : <ErrorIcon />}
                    label={transaction.meta?.TransactionResult === 'tesSUCCESS' ? 'Success' : 'Failed'}
                    color={transaction.meta?.TransactionResult === 'tesSUCCESS' ? 'success' : 'error'}
                    variant="outlined"
                    size="small"
                    sx={{ fontSize: '9px' }}
                  />
                  <Chip
                    label={transaction.TransactionType}
                    variant="outlined"
                    size="small"
                    sx={{ fontSize: '9px' }}
                  />
                </Stack>

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
                      <Typography variant="caption" sx={{ fontWeight: 400 }}>
                        #{transaction.ledger_index}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">
                        Time
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 400 }}>
                        {formatTime(transaction.date)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">
                        Fee
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 400 }}>
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
                            fontSize: '9px',
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
                            transaction.Account && window.open(`https://xrpl.to/profile/${transaction.Account}`, '_blank')
                          }
                        >
                          {transaction.Account
                            ? `${transaction.Account.slice(0, 8)}...${transaction.Account.slice(-4)}`
                            : 'Unknown'}
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
                              transaction.Destination && window.open(
                                `https://xrpl.to/profile/${transaction.Destination}`,
                                '_blank'
                              )
                            }
                          >
                            {transaction.Destination
                              ? `${transaction.Destination.slice(0, 8)}...${transaction.Destination.slice(-4)}`
                              : 'Unknown'}
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
                      <Typography variant="body2" sx={{ fontWeight: 400 }}>
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
                          mb: 1,
                          display: 'block'
                        }}
                      >
                        {transaction.Flags & 0x00080000 ? 'Selling' : 'Buying'}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 400, mb: 1.5 }}>
                        {formatAmount(transaction.TakerGets)}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: alpha(theme.palette.text.secondary, 0.7),
                          mb: 0.5,
                          display: 'block'
                        }}
                      >
                        For
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 400 }}>
                        {formatAmount(transaction.TakerPays)}
                      </Typography>
                      {(() => {
                        try {
                          const getsVal = typeof transaction.TakerGets === 'string'
                            ? new Decimal(dropsToXrp(transaction.TakerGets))
                            : new Decimal(transaction.TakerGets.value);
                          const paysVal = typeof transaction.TakerPays === 'string'
                            ? new Decimal(dropsToXrp(transaction.TakerPays))
                            : new Decimal(transaction.TakerPays.value);
                          const rate = getsVal.div(paysVal);
                          const getCurr = (amt) => typeof amt === 'string' ? 'XRP' : normalizeCurrencyCode(amt.currency);

                          return (
                            <Typography
                              variant="caption"
                              sx={{
                                color: alpha(theme.palette.text.secondary, 0.6),
                                display: 'block',
                                mt: 1
                              }}
                            >
                              @ {rate.toFixed(rate.lt(0.01) ? 6 : 4)} {getCurr(transaction.TakerGets)}/{getCurr(transaction.TakerPays)}
                            </Typography>
                          );
                        } catch {
                          return null;
                        }
                      })()}
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
                      <Typography variant="body2" sx={{ fontWeight: 400 }}>
                        {formatAmount(transaction.LimitAmount)}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: alpha(theme.palette.text.secondary, 0.7), fontSize: '9px' }}
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
                          fontSize: '9px'
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
                      <Stack spacing={1}>
                        {transaction.Memos.map((memoObj, idx) => {
                          const memo = memoObj.Memo || {};
                          const decodedData = memo.MemoData ? decodeMemo(memo.MemoData) : null;
                          const decodedType = memo.MemoType ? decodeMemo(memo.MemoType) : null;
                          const decodedFormat = memo.MemoFormat ? decodeMemo(memo.MemoFormat) : null;

                          return (
                            <Box
                              key={idx}
                              sx={{
                                p: 1,
                                borderRadius: '12px',
                                background: alpha(theme.palette.info.main, 0.05),
                                border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
                              }}
                            >
                              {decodedType && (
                                <Box sx={{ mb: 0.5 }}>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: alpha(theme.palette.text.secondary, 0.6),
                                      fontSize: '13px'
                                    }}
                                  >
                                    Type:
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      ml: 0.5,
                                      fontSize: '9px',
                                      fontWeight: 400
                                    }}
                                  >
                                    {decodedType}
                                  </Typography>
                                </Box>
                              )}
                              {decodedFormat && (
                                <Box sx={{ mb: 0.5 }}>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: alpha(theme.palette.text.secondary, 0.6),
                                      fontSize: '13px'
                                    }}
                                  >
                                    Format:
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      ml: 0.5,
                                      fontSize: '9px',
                                      fontWeight: 400
                                    }}
                                  >
                                    {decodedFormat}
                                  </Typography>
                                </Box>
                              )}
                              {decodedData && (
                                <Box>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: alpha(theme.palette.text.secondary, 0.6),
                                      fontSize: '13px',
                                      display: 'block',
                                      mb: 0.25
                                    }}
                                  >
                                    Data:
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      fontSize: '9px',
                                      wordBreak: 'break-word',
                                      fontFamily: 'monospace',
                                      display: 'block'
                                    }}
                                  >
                                    {decodedData}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          );
                        })}
                      </Stack>
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

            {mode === 'orderbook' && !showDepth && (
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
                      px: 1.5,
                      py: 0.75,
                      background: 'transparent'
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: alpha(theme.palette.text.secondary, 0.6),
                        fontWeight: 400,
                        fontSize: '0.75rem',
                        textTransform: 'none'
                      }}
                    >
                      Sell Orders ({asks.length})
                    </Typography>
                  </Box>
                  <Box ref={asksScrollRef} sx={{ flex: 1, minHeight: 0, overflowY: 'auto', '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}>
                    {asks.length > 0 ? (
                      <>
                        <Box
                          sx={{
                            position: 'sticky',
                            top: 0,
                            zIndex: 2,
                            px: 1.5,
                            py: 0.5,
                            background: theme.palette.background.paper,
                            borderBottom: `1.5px solid ${alpha(theme.palette.divider, 0.12)}`
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography
                              variant="caption"
                              sx={{ color: theme.palette.error.main, fontWeight: 400, fontSize: '0.75rem' }}
                            >
                              Price
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: alpha(theme.palette.text.secondary, 0.7), fontSize: '0.75rem' }}
                            >
                              Amount
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: alpha(theme.palette.text.secondary, 0.7),
                                fontSize: '0.75rem',
                                display: { xs: 'none', sm: 'inline' }
                              }}
                            >
                              Total
                            </Typography>
                          </Box>
                        </Box>
                        <Stack spacing={0.25} sx={{ px: 1.5, py: 1 }}>
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
                                        sx={{ color: theme.palette.primary.main, fontWeight: 400 }}
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
                                      cursor: 'pointer',
                                      px: 1,
                                      py: 0.5,
                                      borderRadius: '4px',
                                      background: showMarker
                                        ? alpha(theme.palette.primary.main, 0.06)
                                        : 'transparent',
                                      '&:hover': {
                                        background: alpha(theme.palette.error.main, 0.04)
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
                                        borderRadius: '6px',
                                        pointerEvents: 'none'
                                      }}
                                    />
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        fontSize: '0.75rem',
                                        fontWeight: 400,
                                        color: theme.palette.error.main,
                                        position: 'relative',
                                        zIndex: 1
                                      }}
                                    >
                                      {fNumber(level.price)}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        fontSize: '0.75rem',
                                        fontWeight: 400,
                                        position: 'relative',
                                        zIndex: 1
                                      }}
                                    >
                                      {fNumber(level.amount)}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        fontSize: '0.75rem',
                                        fontWeight: 400,
                                        display: { xs: 'none', sm: 'inline' },
                                        color: alpha(theme.palette.text.secondary, 0.7),
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
                <Box
                  sx={{
                    px: 1.5,
                    py: 0.75,
                    background: 'transparent',
                    borderTop: `1.5px solid ${alpha(theme.palette.divider, 0.12)}`,
                    borderBottom: `1.5px solid ${alpha(theme.palette.divider, 0.12)}`
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 400,
                        color: alpha(theme.palette.text.secondary, 0.7),
                        fontSize: '0.75rem'
                      }}
                    >
                      Spread
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.75rem',
                        fontWeight: 400,
                        color: theme.palette.text.primary
                      }}
                    >
                      {fNumber(spread.spreadAmount)} ({Number(spread.spreadPercentage).toFixed(2)}%)
                    </Typography>
                  </Stack>
                </Box>

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
                      px: 1.5,
                      py: 0.75,
                      background: 'transparent'
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: alpha(theme.palette.text.secondary, 0.6),
                        fontWeight: 400,
                        fontSize: '0.75rem',
                        textTransform: 'none'
                      }}
                    >
                      Buy Orders ({bids.length})
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}>
                    {bids.length > 0 ? (
                      <>
                        <Box
                          sx={{
                            position: 'sticky',
                            top: 0,
                            zIndex: 2,
                            px: 1.5,
                            py: 0.5,
                            background: theme.palette.background.paper,
                            borderBottom: `1.5px solid ${alpha(theme.palette.divider, 0.12)}`
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography
                              variant="caption"
                              sx={{ color: theme.palette.success.main, fontWeight: 400, fontSize: '0.75rem' }}
                            >
                              Price
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: alpha(theme.palette.text.secondary, 0.7), fontSize: '0.75rem' }}
                            >
                              Amount
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: alpha(theme.palette.text.secondary, 0.7),
                                fontSize: '0.75rem',
                                display: { xs: 'none', sm: 'inline' }
                              }}
                            >
                              Total
                            </Typography>
                          </Box>
                        </Box>
                        <Stack spacing={0.25} sx={{ px: 1.5, py: 1 }}>
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
                                        sx={{ color: theme.palette.primary.main, fontWeight: 400 }}
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
                                      cursor: 'pointer',
                                      px: 1,
                                      py: 0.5,
                                      borderRadius: '4px',
                                      background: showMarker
                                        ? alpha(theme.palette.primary.main, 0.06)
                                        : 'transparent',
                                      '&:hover': {
                                        background: alpha(theme.palette.success.main, 0.04)
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
                                        borderRadius: '6px',
                                        pointerEvents: 'none'
                                      }}
                                    />
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        fontSize: '0.75rem',
                                        fontWeight: 400,
                                        color: theme.palette.success.main,
                                        position: 'relative',
                                        zIndex: 1
                                      }}
                                    >
                                      {fNumber(level.price)}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        fontSize: '0.75rem',
                                        fontWeight: 400,
                                        position: 'relative',
                                        zIndex: 1
                                      }}
                                    >
                                      {fNumber(level.amount)}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        fontSize: '0.75rem',
                                        fontWeight: 400,
                                        display: { xs: 'none', sm: 'inline' },
                                        color: alpha(theme.palette.text.secondary, 0.7),
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
                        fontSize: '14px',
                        fontWeight: 400
                      }}
                    >
                      No orders available
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {mode === 'orderbook' && showDepth && (
              <Box sx={{ p: 1.5, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Typography variant="caption" sx={{ mb: 0.5, fontSize: '0.75rem', color: 'text.secondary' }}>
                  Market Depth
                </Typography>
                {(() => {
                  const bidData = bids.slice(0, 60);
                  const askData = asks.slice(0, 60);
                  const totalOrders = bidData.length + askData.length;
                  const buyDepth = bidData.reduce((sum, bid) => sum + Number(bid.amount || 0), 0);
                  const sellDepth = askData.reduce((sum, ask) => sum + Number(ask.amount || 0), 0);

                  return (
                    <Box sx={{ mb: 1.5, p: 1.5, background: alpha(theme.palette.background.paper, 0.05), borderRadius: '8px', border: `1.5px solid ${alpha(theme.palette.divider, 0.12)}` }}>
                      <Stack spacing={1}>
                        <Stack direction="row" spacing={2.5} sx={{ justifyContent: 'space-between' }}>
                          <Box>
                            <Typography variant="caption" sx={{ fontSize: '10px', color: 'text.secondary', display: 'block', mb: 0.25 }}>
                              Total Orders
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: '13px', fontWeight: 500, color: 'text.primary' }}>
                              {totalOrders}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ fontSize: '10px', color: 'text.secondary', display: 'block', mb: 0.25 }}>
                              Depth Ratio
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: '13px', fontWeight: 500, color: 'text.primary' }}>
                              {buyDepth > 0 && sellDepth > 0 ? (buyDepth / sellDepth).toFixed(2) : '-'}
                            </Typography>
                          </Box>
                        </Stack>
                        <Stack direction="row" spacing={2.5} sx={{ justifyContent: 'space-between' }}>
                          <Box>
                            <Typography variant="caption" sx={{ fontSize: '10px', color: theme.palette.success.main, display: 'block', mb: 0.25 }}>
                              Buy Depth ({pair?.curr1?.name || pair?.curr1?.currency})
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: '13px', fontWeight: 500, color: theme.palette.success.main }}>
                              {buyDepth >= 1000 ? `${(buyDepth / 1000).toFixed(1)}k` : fNumber(buyDepth)}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ fontSize: '10px', color: theme.palette.error.main, display: 'block', mb: 0.25 }}>
                              Sell Depth ({pair?.curr2?.name || pair?.curr2?.currency})
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: '13px', fontWeight: 500, color: theme.palette.error.main }}>
                              {sellDepth >= 1000 ? `${(sellDepth / 1000).toFixed(1)}k` : fNumber(sellDepth)}
                            </Typography>
                          </Box>
                        </Stack>
                      </Stack>
                    </Box>
                  );
                })()}
                {(() => {
                  const bidsByAccount = {};
                  const asksByAccount = {};

                  bids.slice(0, 60).forEach(bid => {
                    if (bid.Account) {
                      bidsByAccount[bid.Account] = (bidsByAccount[bid.Account] || 0) + Number(bid.amount || 0);
                    }
                  });

                  asks.slice(0, 60).forEach(ask => {
                    if (ask.Account) {
                      asksByAccount[ask.Account] = (asksByAccount[ask.Account] || 0) + Number(ask.amount || 0);
                    }
                  });

                  const topBuyers = Object.entries(bidsByAccount).sort((a, b) => b[1] - a[1]).slice(0, 5);
                  const topSellers = Object.entries(asksByAccount).sort((a, b) => b[1] - a[1]).slice(0, 5);

                  if (topBuyers.length === 0 && topSellers.length === 0) return null;

                  return (
                    <Stack spacing={1.5} sx={{ mb: 2 }}>
                      {topBuyers.length > 0 && (
                        <Box sx={{ p: 1.5, background: alpha(theme.palette.success.main, 0.05), borderRadius: '8px', border: `1.5px solid ${alpha(theme.palette.success.main, 0.2)}` }}>
                          <Typography variant="caption" sx={{ fontSize: '11px', color: theme.palette.success.main, mb: 1, display: 'block', fontWeight: 500 }}>
                            Top Buyers
                          </Typography>
                          <Stack spacing={0.75}>
                            {topBuyers.map(([account, amount], i) => (
                              <Box key={account} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontSize: '10px',
                                    fontFamily: 'monospace',
                                    color: 'text.secondary',
                                    cursor: 'pointer',
                                    '&:hover': { color: theme.palette.primary.main }
                                  }}
                                  onClick={() => window.open(`https://xrpl.to/profile/${account}`, '_blank')}
                                >
                                  {i + 1}. {account.slice(0, 10)}...{account.slice(-6)}
                                </Typography>
                                <Typography variant="caption" sx={{ fontSize: '10px', fontWeight: 500, color: 'text.primary' }}>
                                  {fNumber(amount)}
                                </Typography>
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                      )}
                      {topSellers.length > 0 && (
                        <Box sx={{ p: 1.5, background: alpha(theme.palette.error.main, 0.05), borderRadius: '8px', border: `1.5px solid ${alpha(theme.palette.error.main, 0.2)}` }}>
                          <Typography variant="caption" sx={{ fontSize: '11px', color: theme.palette.error.main, mb: 1, display: 'block', fontWeight: 500 }}>
                            Top Sellers
                          </Typography>
                          <Stack spacing={0.75}>
                            {topSellers.map(([account, amount], i) => (
                              <Box key={account} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontSize: '10px',
                                    fontFamily: 'monospace',
                                    color: 'text.secondary',
                                    cursor: 'pointer',
                                    '&:hover': { color: theme.palette.primary.main }
                                  }}
                                  onClick={() => window.open(`https://xrpl.to/profile/${account}`, '_blank')}
                                >
                                  {i + 1}. {account.slice(0, 10)}...{account.slice(-6)}
                                </Typography>
                                <Typography variant="caption" sx={{ fontSize: '10px', fontWeight: 500, color: 'text.primary' }}>
                                  {fNumber(amount)}
                                </Typography>
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                      )}
                    </Stack>
                  );
                })()}
                <Box sx={{ flex: 1, position: 'relative' }}>
                  {tooltip && (
                    <Box sx={{
                      position: 'absolute',
                      left: tooltip.x,
                      top: tooltip.y,
                      background: alpha(theme.palette.background.paper, 0.98),
                      border: `1.5px solid ${alpha(theme.palette.divider, 0.2)}`,
                      borderRadius: '8px',
                      p: 1.25,
                      pointerEvents: 'none',
                      zIndex: 10,
                      boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.15)}`,
                      minWidth: 140
                    }}>
                      <Stack spacing={0.5}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" sx={{ fontSize: '11px', color: 'text.secondary' }}>
                            Price
                          </Typography>
                          <Typography variant="caption" sx={{ fontSize: '11px', fontWeight: 500, color: 'text.primary' }}>
                            {fNumber(tooltip.price)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" sx={{ fontSize: '11px', color: 'text.secondary' }}>
                            Depth
                          </Typography>
                          <Typography variant="caption" sx={{ fontSize: '11px', fontWeight: 500, color: 'text.primary' }}>
                            {fNumber(tooltip.depth)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" sx={{ fontSize: '11px', color: 'text.secondary' }}>
                            Orders
                          </Typography>
                          <Typography variant="caption" sx={{ fontSize: '11px', fontWeight: 500, color: 'text.primary' }}>
                            {tooltip.orders}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  )}
                  <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 300 700"
                    preserveAspectRatio="xMidYMid meet"
                    style={{ display: 'block' }}
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = ((e.clientX - rect.left) / rect.width) * 300;

                      const bidData = bids.slice(0, 60).map(b => ({ price: Number(b.price), sum: Number(b.sumAmount), amount: Number(b.amount) }));
                      const askData = asks.slice(0, 60).map(a => ({ price: Number(a.price), sum: Number(a.sumAmount), amount: Number(a.amount) }));
                      const allPrices = [...bidData.map(d => d.price), ...askData.map(d => d.price)];
                      const minPrice = Math.min(...allPrices);
                      const maxPrice = Math.max(...allPrices);

                      const padding = { top: 20, right: 15, bottom: 40, left: 15 };
                      const price = minPrice + ((x - padding.left) / (300 - padding.left - padding.right)) * (maxPrice - minPrice);

                      const bidsAtPrice = bidData.filter(b => b.price >= price);
                      const asksAtPrice = askData.filter(a => a.price <= price);
                      const totalOrders = bidsAtPrice.length + asksAtPrice.length;
                      const depth = bidsAtPrice.reduce((sum, b) => sum + b.amount, 0) + asksAtPrice.reduce((sum, a) => sum + a.amount, 0);

                      setTooltip({ x: e.clientX - rect.left + 10, y: e.clientY - rect.top - 40, price, depth, orders: totalOrders });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    {(() => {
                      const width = 300;
                      const height = 700;
                      const padding = { top: 20, right: 15, bottom: 40, left: 15 };

                      const bidData = bids.slice(0, 60).map(b => ({ price: Number(b.price), sum: Number(b.sumAmount) }));
                      const askData = asks.slice(0, 60).map(a => ({ price: Number(a.price), sum: Number(a.sumAmount) }));

                      if (!bidData.length && !askData.length) return null;

                      const allPrices = [...bidData.map(d => d.price), ...askData.map(d => d.price)];
                      const allSums = [...bidData.map(d => d.sum), ...askData.map(d => d.sum)];
                      const minPrice = Math.min(...allPrices);
                      const maxPrice = Math.max(...allPrices);
                      const maxSum = Math.max(...allSums);

                      const scaleX = (price) => padding.left + ((price - minPrice) / (maxPrice - minPrice)) * (width - padding.left - padding.right);
                      const scaleY = (sum) => height - padding.bottom - (sum / maxSum) * (height - padding.top - padding.bottom);

                      const bidPath = bidData.map((d, i) => `${i === 0 ? 'M' : 'L'}${scaleX(d.price)},${scaleY(d.sum)}`).join(' ');
                      const askPath = askData.map((d, i) => `${i === 0 ? 'M' : 'L'}${scaleX(d.price)},${scaleY(d.sum)}`).join(' ');

                      const bidFillPath = bidPath + ` L${scaleX(bidData[bidData.length - 1].price)},${height - padding.bottom} L${scaleX(bidData[0].price)},${height - padding.bottom} Z`;
                      const askFillPath = askPath + ` L${scaleX(askData[askData.length - 1].price)},${height - padding.bottom} L${scaleX(askData[0].price)},${height - padding.bottom} Z`;

                      const midPrice = (minPrice + maxPrice) / 2;

                      return (
                        <>
                          {/* Grid lines */}
                          {[0.25, 0.5, 0.75].map(pct => (
                            <line
                              key={pct}
                              x1={padding.left}
                              y1={scaleY(maxSum * pct)}
                              x2={width - padding.right}
                              y2={scaleY(maxSum * pct)}
                              stroke={alpha(theme.palette.divider, 0.08)}
                              strokeWidth="1"
                            />
                          ))}
                          {/* Filled areas */}
                          <path d={bidFillPath} fill={alpha(theme.palette.success.main, 0.2)} stroke="none" />
                          <path d={askFillPath} fill={alpha(theme.palette.error.main, 0.2)} stroke="none" />
                          {/* Lines */}
                          <path d={bidPath} fill="none" stroke={theme.palette.success.main} strokeWidth="2" />
                          <path d={askPath} fill="none" stroke={theme.palette.error.main} strokeWidth="2" />
                          {/* Mid price line */}
                          <line
                            x1={scaleX(midPrice)}
                            y1={padding.top}
                            x2={scaleX(midPrice)}
                            y2={height - padding.bottom}
                            stroke={alpha(theme.palette.text.secondary, 0.4)}
                            strokeWidth="1.5"
                            strokeDasharray="3 3"
                          />
                        </>
                      );
                    })()}
                  </svg>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
    );

    if (embedded) {
      return (
        <Box
          sx={{
            height: '100%',
            border: `1.5px solid ${alpha(theme.palette.divider, 0.12)}`,
            borderRadius: '8px',
            backgroundColor: 'transparent',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'none'
          }}
        >
          {content}
        </Box>
      );
    }

    return (
      <Drawer
        anchor="right"
        variant="persistent"
        open={open}
        hideBackdrop
        PaperProps={{
          sx: {
            width: mode === 'orderbook' ? { md: 280, lg: 300, xl: 320 } : { md: 240, lg: 256, xl: 272 },
            minWidth: { md: 220 },
            top: { xs: 56, sm: 56, md: 56 },
            height: {
              xs: 'calc(100vh - 56px)',
              sm: 'calc(100vh - 56px)',
              md: 'calc(100vh - 56px)'
            },
            borderLeft: `1.5px solid ${alpha(theme.palette.divider, 0.12)}`,
            backgroundColor: theme.palette.background.paper,
            boxShadow: 'none',
            overflow: 'hidden'
          }
        }}
        ModalProps={{ keepMounted: true }}
      >
        {content}
      </Drawer>
    );
  }
);

TransactionDetailsPanel.displayName = 'TransactionDetailsPanel';

export default TransactionDetailsPanel;
