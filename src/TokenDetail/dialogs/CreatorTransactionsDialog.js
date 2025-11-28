import React, { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import { X, RefreshCw, ArrowUpRight, ArrowDownLeft, Repeat, Tag } from 'lucide-react';
import { Client } from 'xrpl';
import { fNumber } from 'src/utils/formatters';
import { parseAmount, normalizeCurrencyCode } from 'src/utils/parseUtils';
import Decimal from 'decimal.js-light';
import { cn } from 'src/utils/cn';

const XRPL_WEBSOCKET_URL = 'wss://s1.ripple.com';

// Format time ago
const formatTimeAgo = (date) => {
  if (!date) return 'Pending';
  const txDate = new Date((date + 946684800) * 1000);
  const diffMs = Date.now() - txDate;
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  return `${Math.floor(days / 30)}mo`;
};

// Format amount helper
const formatValue = (val) => {
  if (typeof val === 'string' && val.includes('e')) {
    return new Decimal(val).toString();
  }
  return val;
};

const TransactionRow = memo(({ transaction, isNew, creatorAddress, onSelectTransaction, isDark }) => {
  const { tx, meta, validated } = transaction;
  const txType = tx.TransactionType;
  const isIncoming = tx.Destination === creatorAddress;
  const isFailed = meta?.TransactionResult && meta.TransactionResult !== 'tesSUCCESS';

  // Detect conversion types
  const isCurrencyConversion = txType === 'Payment' && tx.Account === tx.Destination && (tx.SendMax || tx.Paths?.length > 0);

  const isTokenToXrpConversion = useMemo(() => {
    if (!isCurrencyConversion) return false;
    const delivered = meta?.delivered_amount || meta?.DeliveredAmount;
    const sent = tx.SendMax || tx.Amount;
    return typeof delivered === 'string' && typeof sent === 'object' && sent.currency !== 'XRP';
  }, [isCurrencyConversion, meta, tx]);

  const isXrpToTokenConversion = useMemo(() => {
    if (!isCurrencyConversion) return false;
    const delivered = meta?.delivered_amount || meta?.DeliveredAmount;
    const sent = tx.SendMax || tx.Amount;
    return typeof sent === 'string' && typeof delivered === 'object' && delivered.currency !== 'XRP';
  }, [isCurrencyConversion, meta, tx]);

  const isSell = isTokenToXrpConversion;
  const isBuy = isXrpToTokenConversion;

  // Determine transaction category for consistent styling
  const txCategory = useMemo(() => {
    if (isFailed) return 'failed';
    if (isSell) return 'sell';
    if (isBuy) return 'buy';
    if (txType === 'Payment') return isIncoming ? 'receive' : 'send';
    if (txType?.startsWith('NFToken')) return 'nft';
    if (txType?.startsWith('AMM')) return 'amm';
    if (txType === 'TrustSet') return 'trust';
    return 'default';
  }, [isFailed, isSell, isBuy, txType, isIncoming]);

  // Consistent color mapping
  const colors = {
    failed: { text: 'text-red-500', bg: 'bg-red-500/10', icon: 'bg-red-500/10' },
    sell: { text: 'text-red-500', bg: 'bg-red-500/5 hover:bg-red-500/8', icon: 'bg-red-500/10' },
    send: { text: 'text-red-500', bg: 'bg-white/[0.02] hover:bg-white/[0.04]', icon: 'bg-red-500/10' },
    buy: { text: 'text-emerald-500', bg: 'bg-emerald-500/5 hover:bg-emerald-500/8', icon: 'bg-emerald-500/10' },
    receive: { text: 'text-emerald-500', bg: 'bg-white/[0.02] hover:bg-white/[0.04]', icon: 'bg-emerald-500/10' },
    nft: { text: 'text-purple-400', bg: 'bg-white/[0.02] hover:bg-white/[0.04]', icon: 'bg-purple-500/10' },
    amm: { text: 'text-blue-400', bg: 'bg-white/[0.02] hover:bg-white/[0.04]', icon: 'bg-blue-500/10' },
    trust: { text: 'text-blue-400', bg: 'bg-white/[0.02] hover:bg-white/[0.04]', icon: 'bg-blue-500/10' },
    default: { text: 'text-gray-400', bg: 'bg-white/[0.02] hover:bg-white/[0.04]', icon: 'bg-gray-500/10' }
  };

  const { text: colorClass, bg: bgClass, icon: iconBg } = colors[txCategory];

  // Get icon
  const Icon = useMemo(() => {
    if (isSell || (txType === 'Payment' && !isIncoming)) return ArrowUpRight;
    if (isBuy || (txType === 'Payment' && isIncoming)) return ArrowDownLeft;
    if (txType === 'OfferCreate' || txType === 'OfferCancel') return Tag;
    return Repeat;
  }, [isSell, isBuy, txType, isIncoming]);

  // Get label
  const label = useMemo(() => {
    if (isSell) return 'Sell';
    if (isBuy) return 'Buy';
    if (isCurrencyConversion) return 'Swap';
    if (txType === 'Payment') return isIncoming ? 'Received' : 'Sent';
    if (txType === 'OfferCreate') return 'Offer';
    if (txType === 'OfferCancel') return 'Cancel';
    if (txType === 'TrustSet') return 'Trust';
    if (txType?.startsWith('NFToken')) return 'NFT';
    if (txType?.startsWith('AMM')) return 'AMM';
    return txType?.slice(0, 8) || 'Tx';
  }, [isSell, isBuy, isCurrencyConversion, txType, isIncoming]);

  // Format amount
  const amount = useMemo(() => {
    try {
      if (txType === 'Payment') {
        if (isCurrencyConversion) {
          if (isFailed) return 'Failed';
          const delivered = parseAmount(meta?.delivered_amount || meta?.DeliveredAmount);
          const sent = parseAmount(tx.SendMax || tx.Amount);
          if (!delivered || !sent) return 'N/A';
          const sentVal = formatValue(sent.value);
          const deliveredVal = formatValue(delivered.value);
          const sentCur = sent.currency === 'XRP' ? 'XRP' : normalizeCurrencyCode(sent.currency);
          const deliveredCur = delivered.currency === 'XRP' ? 'XRP' : normalizeCurrencyCode(delivered.currency);
          return `${fNumber(sentVal)} ${sentCur} → ${fNumber(deliveredVal)} ${deliveredCur}`;
        }
        const amt = parseAmount(meta?.delivered_amount || meta?.DeliveredAmount || tx.Amount);
        if (!amt) return 'N/A';
        const val = formatValue(amt.value);
        const cur = amt.currency === 'XRP' ? 'XRP' : normalizeCurrencyCode(amt.currency);
        return `${fNumber(val)} ${cur}`;
      }
      if (txType === 'OfferCreate' && tx.TakerGets && tx.TakerPays) {
        const gets = parseAmount(tx.TakerGets);
        const pays = parseAmount(tx.TakerPays);
        if (!gets || !pays) return 'N/A';
        const getsCur = gets.currency === 'XRP' ? 'XRP' : normalizeCurrencyCode(gets.currency);
        const paysCur = pays.currency === 'XRP' ? 'XRP' : normalizeCurrencyCode(pays.currency);
        return `${fNumber(formatValue(gets.value))} ${getsCur}`;
      }
      if (txType === 'TrustSet' && tx.LimitAmount) {
        const limit = parseAmount(tx.LimitAmount);
        if (!limit) return 'N/A';
        const cur = normalizeCurrencyCode(limit.currency);
        return new Decimal(limit.value).isZero() ? `Remove ${cur}` : `${fNumber(formatValue(limit.value))} ${cur}`;
      }
      if (txType === 'OfferCancel') return `#${tx.OfferSequence || 'N/A'}`;
      if (txType === 'NFTokenAcceptOffer') return 'Accepted';
      if (txType === 'NFTokenCreateOffer') return 'Created';
      if (txType === 'NFTokenMint') return 'Minted';
      if (txType === 'NFTokenBurn') return 'Burned';
      if (txType === 'NFTokenCancelOffer') return 'Canceled';
      if (txType?.startsWith('NFToken')) return txType.replace('NFToken', '');
      if (txType?.startsWith('AMM')) return txType.replace('AMM', '');
      return txType?.slice(0, 10) || 'N/A';
    } catch { return 'N/A'; }
  }, [tx, meta, txType, isCurrencyConversion, isFailed]);

  return (
    <div
      onClick={() => onSelectTransaction?.(tx.hash)}
      className={cn(
        'flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors border',
        bgClass,
        isFailed ? 'border-red-500/20' : 'border-white/[0.06]',
        isNew && 'border-blue-500/30'
      )}
    >
      {/* Icon */}
      <div className={cn('w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0', iconBg)}>
        <Icon size={14} className={colorClass} />
      </div>

      {/* Label & Time */}
      <div className="min-w-[50px] flex-shrink-0">
        <div className="flex items-center gap-1">
          <span className={cn('text-[12px]', isFailed ? 'text-red-500' : isDark ? 'text-white' : 'text-gray-900')}>
            {label}
          </span>
          {isNew && (
            <span className="px-1 py-0.5 text-[9px] bg-blue-500 text-white rounded">NEW</span>
          )}
          {!validated && (
            <span className="px-1 py-0.5 text-[9px] bg-amber-500 text-white rounded">...</span>
          )}
        </div>
        <span className={cn('text-[10px]', isDark ? 'text-white/50' : 'text-black/50')}>
          {formatTimeAgo(tx.date)}
        </span>
      </div>

      {/* Amount */}
      <div className="flex-1 text-right min-w-0">
        <span className={cn('text-[12px] truncate block', colorClass)}>
          {txType === 'Payment' && !isIncoming && !isCurrencyConversion && '-'}{amount}
        </span>
      </div>
    </div>
  );
});

TransactionRow.displayName = 'TransactionRow';

const CreatorTransactionsDialog = memo(
  ({ open, onClose, creatorAddress, onLatestTransaction, onSelectTransaction, isDark = false }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [newTxCount, setNewTxCount] = useState(0);

    const clientRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);

    const fetchTransactionHistory = useCallback(async () => {
      if (!creatorAddress) return;
      setLoading(true);
      setError(null);

      try {
        const client = new Client(XRPL_WEBSOCKET_URL, { connectionTimeout: 10000 });
        await client.connect();

        const response = await client.request({
          command: 'account_tx',
          account: creatorAddress,
          ledger_index_min: -1,
          ledger_index_max: -1,
          limit: 30,
          forward: false
        });

        await client.disconnect();

        if (response?.result?.transactions) {
          const validTxs = response.result.transactions
            .map(txData => txData.tx_json && !txData.tx ? { ...txData, tx: txData.tx_json } : txData)
            .filter(txData => txData?.tx?.TransactionType)
            .slice(0, 15);

          setTransactions(validTxs);
          if (validTxs.length > 0) onLatestTransaction?.(validTxs[0]);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch');
      } finally {
        setLoading(false);
      }
    }, [creatorAddress, onLatestTransaction]);

    const subscribeToTransactions = useCallback(async () => {
      if (!creatorAddress || clientRef.current) return;

      try {
        const client = new Client(XRPL_WEBSOCKET_URL, { connectionTimeout: 10000 });
        clientRef.current = client;

        client.on('error', () => {
          setError('Connection error');
          handleReconnect();
        });

        client.on('disconnected', () => {
          setIsSubscribed(false);
          handleReconnect();
        });

        await client.connect();

        const res = await client.request({ command: 'subscribe', accounts: [creatorAddress] });

        if (res.result.status === 'success') {
          setIsSubscribed(true);
          reconnectAttemptsRef.current = 0;

          client.on('transaction', (txEvent) => {
            const txn = txEvent.transaction;
            if (txn && (txn.Account === creatorAddress || txn.Destination === creatorAddress)) {
              if (txn.TransactionType === 'Payment' && typeof txn.Amount === 'string') {
                if (parseInt(txn.Amount) / 1000000 < 1) return;
              }

              setTransactions(prev => {
                const newTx = { tx: txn, meta: txEvent.meta, validated: txEvent.validated };
                setNewTxCount(c => c + 1);
                onLatestTransaction?.(newTx);
                return [newTx, ...prev].slice(0, 15);
              });
            }
          });
        }
      } catch {
        setError('Subscribe failed');
        handleReconnect();
      }
    }, [creatorAddress, onLatestTransaction]);

    const handleReconnect = useCallback(() => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectAttemptsRef.current += 1;
      const backoff = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
      reconnectTimeoutRef.current = setTimeout(() => {
        clientRef.current?.removeAllListeners();
        clientRef.current = null;
        subscribeToTransactions();
      }, backoff);
    }, [subscribeToTransactions]);

    const unsubscribe = useCallback(async () => {
      if (!clientRef.current?.isConnected()) return;
      try {
        await clientRef.current.request({ command: 'unsubscribe', accounts: [creatorAddress] });
      } catch {}
      await clientRef.current?.disconnect();
      clientRef.current?.removeAllListeners();
      clientRef.current = null;
      setIsSubscribed(false);
    }, [creatorAddress]);

    useEffect(() => {
      if (creatorAddress) {
        fetchTransactionHistory();
        subscribeToTransactions();
        const interval = setInterval(fetchTransactionHistory, 10000);
        return () => {
          clearInterval(interval);
          clearTimeout(reconnectTimeoutRef.current);
          clientRef.current?.removeAllListeners();
          unsubscribe();
        };
      }
    }, [creatorAddress, fetchTransactionHistory, subscribeToTransactions, unsubscribe]);

    useEffect(() => {
      if (open && newTxCount > 0) {
        const timer = setTimeout(() => setNewTxCount(0), 3000);
        return () => clearTimeout(timer);
      }
    }, [open, newTxCount]);

    return (
      <div
        className={cn(
          'fixed top-14 left-0 w-60 h-[calc(100vh-56px)] z-[1200] flex flex-col transition-transform duration-300',
          isDark ? 'bg-black border-r border-white/10' : 'bg-white border-r border-black/10',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className={cn('p-3 pb-2 flex-shrink-0 border-b', isDark ? 'border-white/10' : 'border-black/10')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className={cn('text-[15px] font-normal', isDark ? 'text-white' : 'text-gray-900')}>
                Creator Activity
              </span>
              {isSubscribed && (
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Live" />
              )}
              {newTxCount > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] bg-blue-500 text-white rounded-full">
                  {newTxCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={fetchTransactionHistory}
                disabled={loading}
                className={cn(
                  'p-1.5 rounded-md transition-colors',
                  isDark ? 'hover:bg-white/10' : 'hover:bg-black/5',
                  loading && 'opacity-50'
                )}
              >
                <RefreshCw size={16} className={cn(isDark ? 'text-white' : 'text-gray-700', loading && 'animate-spin')} />
              </button>
              <button
                onClick={onClose}
                className={cn('p-1.5 rounded-md transition-colors', isDark ? 'hover:bg-white/10' : 'hover:bg-black/5')}
              >
                <X size={16} className={isDark ? 'text-white' : 'text-gray-700'} />
              </button>
            </div>
          </div>
          <span className={cn('text-[11px] block mt-0.5', isDark ? 'text-white/50' : 'text-black/50')}>
            {creatorAddress ? `${creatorAddress.slice(0, 8)}...${creatorAddress.slice(-4)}` : 'Loading...'}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {loading && transactions.length === 0 ? (
            <div className="py-8 text-center">
              <div className={cn(
                'w-6 h-6 mx-auto border-2 rounded-full animate-spin',
                isDark ? 'border-white/20 border-t-blue-500' : 'border-black/10 border-t-blue-500'
              )} />
              <p className={cn('text-[13px] mt-3', isDark ? 'text-white/60' : 'text-black/60')}>
                Loading...
              </p>
            </div>
          ) : error ? (
            <div className="p-3 rounded-lg bg-red-500/10 text-red-500 text-[13px]">
              {error}
            </div>
          ) : transactions.length === 0 ? (
            <div className={cn(
              'py-8 text-center rounded-lg',
              isDark ? 'bg-white/[0.02]' : 'bg-black/[0.02]'
            )}>
              <p className={cn('text-[13px]', isDark ? 'text-white/60' : 'text-black/60')}>
                No transactions
              </p>
            </div>
          ) : (
            transactions.map((tx, i) => (
              <TransactionRow
                key={tx.tx?.hash || i}
                transaction={tx}
                isNew={i < newTxCount}
                creatorAddress={creatorAddress}
                onSelectTransaction={onSelectTransaction}
                isDark={isDark}
              />
            ))
          )}
        </div>
      </div>
    );
  }
);

CreatorTransactionsDialog.displayName = 'CreatorTransactionsDialog';

export default CreatorTransactionsDialog;
