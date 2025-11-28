import React, { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import { X, RefreshCw, ChevronDown, Zap, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Client } from 'xrpl';
import { fNumber } from 'src/utils/formatters';
import { parseAmount, normalizeCurrencyCode } from 'src/utils/parseUtils';
import Decimal from 'decimal.js-light';
import { cn } from 'src/utils/cn';

const BASE_URL = 'https://api.xrpl.to';
const XRPL_WEBSOCKET_URL = 'wss://s1.ripple.com';

const formatTimeAgo = (date) => {
  if (!date) return '...';
  const diffMs = Date.now() - new Date((date + 946684800) * 1000);
  const secs = Math.floor(diffMs / 1000);
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (secs < 60) return `${secs}s`;
  if (mins < 60) return `${mins}m`;
  if (hours < 24) return `${hours}h`;
  return days < 7 ? `${days}d` : `${Math.floor(days / 7)}w`;
};

const formatValue = (val) => (typeof val === 'string' && val.includes('e') ? new Decimal(val).toString() : val);

const TransactionRow = memo(({ transaction, creatorAddress, onSelectTransaction, isDark, isNew }) => {
  const { tx, meta } = transaction;
  const txType = tx.TransactionType;
  const isIncoming = tx.Destination === creatorAddress;
  const isFailed = meta?.TransactionResult && meta.TransactionResult !== 'tesSUCCESS';
  const isCurrencyConversion = txType === 'Payment' && tx.Account === tx.Destination && (tx.SendMax || tx.Paths?.length > 0);

  const isTokenToXrp = useMemo(() => {
    if (!isCurrencyConversion) return false;
    const delivered = meta?.delivered_amount || meta?.DeliveredAmount;
    const sent = tx.SendMax || tx.Amount;
    return typeof delivered === 'string' && typeof sent === 'object';
  }, [isCurrencyConversion, meta, tx]);

  const isXrpToToken = useMemo(() => {
    if (!isCurrencyConversion) return false;
    const delivered = meta?.delivered_amount || meta?.DeliveredAmount;
    const sent = tx.SendMax || tx.Amount;
    return typeof sent === 'string' && typeof delivered === 'object';
  }, [isCurrencyConversion, meta, tx]);

  const isSell = isTokenToXrp;
  const isBuy = isXrpToToken;

  const bgColor = isFailed ? 'bg-red-500/8' : isSell ? 'bg-red-500/8' : isBuy ? 'bg-emerald-500/8' :
    (txType === 'Payment' && !isIncoming) ? 'bg-orange-500/8' : 'bg-emerald-500/8';

  const textColor = isFailed ? 'text-red-400' : isSell ? 'text-red-400' : isBuy ? 'text-emerald-400' :
    (txType === 'Payment' && !isIncoming) ? 'text-orange-400' : 'text-emerald-400';

  const label = isSell ? 'SELL' : isBuy ? 'BUY' : isCurrencyConversion ? 'SWAP' :
    txType === 'Payment' ? (isIncoming ? 'IN' : 'OUT') : txType?.slice(0, 4).toUpperCase() || 'TX';

  const Icon = isIncoming || isBuy ? ArrowDownLeft : ArrowUpRight;

  const amount = useMemo(() => {
    try {
      if (txType === 'Payment') {
        const amt = parseAmount(meta?.delivered_amount || meta?.DeliveredAmount || tx.Amount);
        if (!amt) return { value: '-', currency: '' };
        return {
          value: fNumber(formatValue(amt.value)),
          currency: amt.currency === 'XRP' ? 'XRP' : normalizeCurrencyCode(amt.currency)
        };
      }
      return { value: '-', currency: '' };
    } catch { return { value: '-', currency: '' }; }
  }, [tx, meta, txType]);

  return (
    <div
      onClick={() => onSelectTransaction?.(tx.hash)}
      className={cn(
        'group flex items-center gap-3 px-3 py-2 cursor-pointer transition-all rounded-lg mx-1 mb-1',
        bgColor,
        isDark ? 'hover:bg-white/[0.08]' : 'hover:bg-black/[0.06]',
        isNew && 'animate-pulse-once'
      )}
    >
      <div className={cn('flex items-center justify-center w-6 h-6 rounded-full', bgColor)}>
        <Icon size={12} className={textColor} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn('text-[10px] font-semibold tracking-wide', textColor)}>{label}</span>
          <span className={cn('text-[9px] tabular-nums', isDark ? 'text-white/30' : 'text-black/30')}>
            {formatTimeAgo(tx.date)} ago
          </span>
        </div>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className={cn('text-[13px] font-medium tabular-nums', isDark ? 'text-white/90' : 'text-gray-900')}>
            {amount.value}
          </span>
          <span className={cn('text-[10px]', isDark ? 'text-white/40' : 'text-black/40')}>
            {amount.currency}
          </span>
        </div>
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
    const [expanded, setExpanded] = useState(true);
    const [newTxHashes, setNewTxHashes] = useState(new Set());

    const clientRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);

    const fetchTransactionHistory = useCallback(async () => {
      if (!creatorAddress) return;
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${BASE_URL}/api/account_tx/${creatorAddress}?limit=20`);
        const data = await response.json();

        if (data?.result === 'success' && data?.transactions) {
          const validTxs = data.transactions
            .map(txData => txData.tx_json && !txData.tx ? { ...txData, tx: txData.tx_json } : txData)
            .filter(txData => txData?.tx?.TransactionType)
            .slice(0, 10);

          setTransactions(validTxs);
          if (validTxs.length > 0) onLatestTransaction?.(validTxs[0]);
        }
      } catch (err) {
        setError(err.message || 'Failed');
      } finally {
        setLoading(false);
      }
    }, [creatorAddress, onLatestTransaction]);

    const subscribeToTransactions = useCallback(async () => {
      if (!creatorAddress || clientRef.current) return;

      try {
        const client = new Client(XRPL_WEBSOCKET_URL, { connectionTimeout: 10000 });
        clientRef.current = client;

        client.on('error', () => handleReconnect());
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
              const newTx = { tx: txn, meta: txEvent.meta, validated: txEvent.validated };
              onLatestTransaction?.(newTx);
              setNewTxHashes(prev => new Set([...prev, txn.hash]));
              setTransactions(prev => [newTx, ...prev].slice(0, 10));
              setTimeout(() => setNewTxHashes(prev => {
                const next = new Set(prev);
                next.delete(txn.hash);
                return next;
              }), 2000);
            }
          });
        }
      } catch {
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
        const interval = setInterval(fetchTransactionHistory, 15000);
        return () => {
          clearInterval(interval);
          clearTimeout(reconnectTimeoutRef.current);
          clientRef.current?.removeAllListeners();
          unsubscribe();
        };
      }
    }, [creatorAddress, fetchTransactionHistory, subscribeToTransactions, unsubscribe]);

    if (!open) return null;

    return (
      <div
        className={cn(
          'fixed bottom-3 left-3 z-[60] pointer-events-auto',
          isDark ? 'text-white' : 'text-gray-900'
        )}
        style={{ width: 300 }}
      >
        {/* Header */}
        <div
          className={cn(
            'flex items-center justify-between px-4 py-2.5 cursor-pointer backdrop-blur-xl',
            expanded ? 'rounded-t-2xl' : 'rounded-2xl',
            isDark ? 'bg-black/80 border border-white/[0.08]' : 'bg-white/80 border border-black/[0.08]',
            expanded && 'border-b-0'
          )}
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2.5">
            <div className={cn(
              'relative flex items-center justify-center w-6 h-6 rounded-lg',
              isDark ? 'bg-cyan-500/10' : 'bg-cyan-500/10'
            )}>
              <Zap size={13} className="text-cyan-400" />
              {isSubscribed && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              )}
            </div>
            <span className={cn('text-[12px] font-medium', isDark ? 'text-white/90' : 'text-gray-900')}>
              Activity
            </span>
            {transactions.length > 0 && (
              <span className={cn(
                'px-1.5 py-0.5 text-[9px] font-medium rounded-full tabular-nums',
                isDark ? 'bg-white/[0.06] text-white/50' : 'bg-black/[0.06] text-black/50'
              )}>
                {transactions.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={(e) => { e.stopPropagation(); fetchTransactionHistory(); }}
              disabled={loading}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.06]'
              )}
            >
              <RefreshCw size={13} className={cn(
                loading && 'animate-spin',
                isDark ? 'text-white/40' : 'text-black/40'
              )} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onClose?.(); }}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.06]'
              )}
            >
              <X size={13} className={isDark ? 'text-white/40' : 'text-black/40'} />
            </button>
            <div className={cn(
              'p-1 rounded-lg transition-transform',
              expanded ? 'rotate-0' : 'rotate-180'
            )}>
              <ChevronDown size={14} className={isDark ? 'text-white/40' : 'text-black/40'} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div
          className={cn(
            'overflow-hidden transition-all duration-300 ease-out backdrop-blur-xl rounded-b-2xl',
            isDark ? 'bg-black/80 border border-t-0 border-white/[0.08]' : 'bg-white/80 border border-t-0 border-black/[0.08]',
            expanded ? 'opacity-100' : 'max-h-0 opacity-0 border-0'
          )}
        >
          <div className="py-2" style={{ height: 320 }}>
            {loading && transactions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center">
                <div className={cn(
                  'w-5 h-5 border-2 rounded-full animate-spin',
                  isDark ? 'border-white/10 border-t-cyan-400' : 'border-black/10 border-t-cyan-500'
                )} />
                <p className={cn('mt-2 text-[10px]', isDark ? 'text-white/30' : 'text-black/30')}>
                  Loading activity...
                </p>
              </div>
            ) : error ? (
              <div className="mx-3 p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 text-[11px]">
                {error}
              </div>
            ) : transactions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center">
                <Zap size={20} className={isDark ? 'text-white/10' : 'text-black/10'} />
                <p className={cn('mt-2 text-[11px]', isDark ? 'text-white/30' : 'text-black/30')}>
                  No recent activity
                </p>
              </div>
            ) : (
              transactions.slice(0, 6).map((tx, i) => (
                <TransactionRow
                  key={tx.tx?.hash || i}
                  transaction={tx}
                  creatorAddress={creatorAddress}
                  onSelectTransaction={onSelectTransaction}
                  isDark={isDark}
                  isNew={newTxHashes.has(tx.tx?.hash)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    );
  }
);

CreatorTransactionsDialog.displayName = 'CreatorTransactionsDialog';

export default CreatorTransactionsDialog;
