import React, { useState, useEffect, useCallback, useRef, memo, useMemo, useContext } from 'react';
import { AppContext } from 'src/AppContext';
import { X, RefreshCw, Copy, ExternalLink, CheckCircle, AlertCircle, ChevronDown, FileText, BookOpen, ArrowRight, Clock, Hash, Layers } from 'lucide-react';
import { cn } from 'src/utils/cn';
import { fNumber, getHashIcon } from 'src/utils/formatters';
import { formatDistanceToNow } from 'date-fns';
import Decimal from 'decimal.js-light';
import { normalizeCurrencyCode, rippleTimeToISO8601, dropsToXrp, calculateSpread } from 'src/utils/parseUtils';
import axios from 'axios';

const AccountAvatar = ({ account, size = 16 }) => {
  const [imgSrc, setImgSrc] = useState(`https://s1.xrpl.to/account/${account}`);
  return (
    <img
      src={imgSrc}
      onError={() => setImgSrc(getHashIcon(account))}
      className="rounded-full ring-1 ring-white/10"
      style={{ width: size, height: size }}
      alt=""
    />
  );
};

const formatTime = (date) => {
  if (!date) return '—';
  try {
    return formatDistanceToNow(new Date(rippleTimeToISO8601(date)), { addSuffix: true });
  } catch { return '—'; }
};

const formatAmount = (amount) => {
  if (!amount) return '—';
  if (typeof amount === 'string') return `${dropsToXrp(amount)} XRP`;
  if (amount?.value) {
    const val = new Decimal(amount.value);
    return `${val.toFixed(val.lt(1) ? 4 : 2)} ${normalizeCurrencyCode(amount.currency)}`;
  }
  return '—';
};

const getPlatform = (tag) => {
  const map = {
    74920348: 'First Ledger', 10011010: 'Magnetic', 101102979: 'xrp.cafe',
    20221212: 'XPMarket', 69420589: 'Bidds', 110100111: 'Sologenic',
    20102305: 'Opulence', 13888813: 'Zerpmon', 11782013: 'ANODEX',
    100010010: 'Xrpl Daddy', 123321: 'BearBull', 42697268: 'Bithomp',
    4152544945: 'ArtDept.fun', 80085: 'Zerpaay', 510162502: 'Sonar Muse', 80008000: 'Orchestra'
  };
  return map[tag] || null;
};

const LimitMarker = ({ label, isDark }) => (
  <div className="flex items-center gap-2 px-3 py-1">
    <div className="flex-1 h-px bg-blue-500/30" />
    <span className="text-[9px] text-blue-400 font-medium px-2 py-0.5 rounded-full bg-blue-500/10">{label}</span>
    <div className="flex-1 h-px bg-blue-500/30" />
  </div>
);

const OrderRow = memo(({ level, type, onClick, isDark, indicatorWidth, highlighted }) => (
  <div
    onClick={onClick}
    className={cn(
      'relative flex items-center justify-between px-3 py-1.5 cursor-pointer transition-colors',
      highlighted ? 'bg-blue-500/10' : '',
      isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.04]'
    )}
  >
    <div
      className={cn('absolute left-0 top-0 bottom-0 pointer-events-none opacity-40',
        type === 'ask' ? 'bg-gradient-to-r from-red-500/20 to-transparent' : 'bg-gradient-to-r from-emerald-500/20 to-transparent'
      )}
      style={{ width: `${indicatorWidth}%` }}
    />
    <span className={cn('text-[11px] tabular-nums z-[1] font-medium', type === 'ask' ? 'text-red-400' : 'text-emerald-400')}>
      {fNumber(level.price)}
    </span>
    <span className={cn('text-[11px] tabular-nums z-[1]', isDark ? 'text-white/70' : 'text-gray-700')}>
      {fNumber(level.amount)}
    </span>
    <span className={cn('text-[10px] tabular-nums z-[1]', isDark ? 'text-white/30' : 'text-black/30')}>
      {fNumber(level.sumAmount)}
    </span>
  </div>
));
OrderRow.displayName = 'OrderRow';

const TransactionDetailsPanel = memo(({
  open,
  onClose,
  transactionHash,
  tradeAccount,
  onSelectTransaction,
  mode = 'transaction',
  pair,
  asks = [],
  bids = [],
  limitPrice,
  isBuyOrder,
  onAskClick,
  onBidClick,
  embedded = false
}) => {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [showDepth, setShowDepth] = useState(false);

  const panelIdRef = useRef(Math.random().toString(36).slice(2));
  const asksScrollRef = useRef(null);

  const spread = useMemo(() => mode === 'orderbook' ? calculateSpread(bids, asks) : { spreadAmount: 0, spreadPercentage: 0 }, [mode, bids, asks]);
  const bestAsk = useMemo(() => asks[0] ? Number(asks[0].price) : null, [asks]);
  const bestBid = useMemo(() => bids[0] ? Number(bids[0].price) : null, [bids]);

  const getIndicatorWidth = useCallback((amount) => {
    const avgA = asks.length ? Number(asks[asks.length - 1]?.sumAmount || 0) / asks.length : 0;
    const avgB = bids.length ? Number(bids[bids.length - 1]?.sumAmount || 0) / bids.length : 0;
    const avg = (avgA + avgB) / 2;
    const max100 = (avg / 50) * 100;
    return Math.min((Number(amount) / max100) * 100, 100).toFixed(0);
  }, [asks, bids]);

  useEffect(() => {
    if (mode === 'orderbook' && open && asksScrollRef.current && asks.length) {
      requestAnimationFrame(() => {
        if (asksScrollRef.current) asksScrollRef.current.scrollTop = asksScrollRef.current.scrollHeight;
      });
    }
  }, [mode, open, asks]);

  const fetchTransaction = useCallback(async () => {
    if (mode !== 'transaction' || !transactionHash || !open) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`https://api.xrpl.to/api/tx/${transactionHash}`);
      if (res.data) setTransaction(res.data);
      else setError('Not found');
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed');
    } finally {
      setLoading(false);
    }
  }, [transactionHash, open, mode]);

  useEffect(() => {
    if (open && transactionHash && mode === 'transaction') fetchTransaction();
  }, [transactionHash, open, mode, fetchTransaction]);

  useEffect(() => {
    const handler = (e) => {
      if (e?.detail?.id && e.detail.id !== panelIdRef.current && open) onClose?.();
    };
    window.addEventListener('XRPLTO_RIGHT_DRAWER_OPEN', handler);
    return () => window.removeEventListener('XRPLTO_RIGHT_DRAWER_OPEN', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open) window.dispatchEvent(new CustomEvent('XRPLTO_RIGHT_DRAWER_OPEN', { detail: { id: panelIdRef.current } }));
  }, [open]);

  const copyHash = () => {
    if (transactionHash) {
      navigator.clipboard.writeText(transactionHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const decodeMemo = (hex) => {
    try {
      let s = '';
      for (let i = 0; i < hex.length; i += 2) {
        const b = parseInt(hex.substr(i, 2), 16);
        if (b === 0) break;
        s += String.fromCharCode(b);
      }
      return s || hex;
    } catch { return hex; }
  };

  if (!open) return null;

  const isOrderbook = mode === 'orderbook';
  const panelWidth = isOrderbook ? 260 : 240;

  const header = (
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
          'flex items-center justify-center w-6 h-6 rounded-lg',
          isDark ? 'bg-cyan-500/10' : 'bg-cyan-500/10'
        )}>
          {isOrderbook ? <BookOpen size={13} className="text-cyan-400" /> : <FileText size={13} className="text-cyan-400" />}
        </div>
        <span className={cn('text-[12px] font-medium', isDark ? 'text-white/90' : 'text-gray-900')}>
          {isOrderbook ? 'Order Book' : 'Transaction'}
        </span>
      </div>
      <div className="flex items-center gap-0.5">
        {!isOrderbook && transactionHash && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); copyHash(); }}
              className={cn('p-1.5 rounded-lg transition-colors', isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.06]')}
            >
              <Copy size={13} className={copied ? 'text-cyan-400' : isDark ? 'text-white/40' : 'text-black/40'} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); window.open(`https://xrpl.to/tx/${transactionHash}`, '_blank'); }}
              className={cn('p-1.5 rounded-lg transition-colors', isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.06]')}
            >
              <ExternalLink size={13} className={isDark ? 'text-white/40' : 'text-black/40'} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); fetchTransaction(); }}
              disabled={loading}
              className={cn('p-1.5 rounded-lg transition-colors', isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.06]')}
            >
              <RefreshCw size={13} className={cn(isDark ? 'text-white/40' : 'text-black/40', loading && 'animate-spin')} />
            </button>
          </>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onClose?.(); }}
          className={cn('p-1.5 rounded-lg transition-colors', isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.06]')}
        >
          <X size={13} className={isDark ? 'text-white/40' : 'text-black/40'} />
        </button>
        <div className={cn('p-1 rounded-lg transition-transform', expanded ? 'rotate-0' : 'rotate-180')}>
          <ChevronDown size={14} className={isDark ? 'text-white/40' : 'text-black/40'} />
        </div>
      </div>
    </div>
  );

  const transactionContent = (
    <div className="p-3 space-y-3" style={{ height: 320 }}>
      {loading ? (
        <div className="h-full flex flex-col items-center justify-center">
          <div className={cn('w-5 h-5 border-2 rounded-full animate-spin', isDark ? 'border-white/10 border-t-cyan-400' : 'border-black/10 border-t-cyan-500')} />
          <p className={cn('mt-2 text-[10px]', isDark ? 'text-white/30' : 'text-black/30')}>Loading...</p>
        </div>
      ) : error ? (
        <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 text-[11px]">{error}</div>
      ) : transaction ? (
        <>
          {/* Summary Card */}
          <div className={cn('p-3 rounded-xl', isDark ? 'bg-white/[0.03]' : 'bg-black/[0.02]')}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className={cn('text-[13px] font-medium', isDark ? 'text-white/90' : 'text-gray-900')}>
                  {(() => {
                    const { TransactionType, Account, Destination, Amount, Flags, meta } = transaction;
                    const fmtAmt = (amt) => {
                      if (typeof amt === 'string') return `${dropsToXrp(amt)} XRP`;
                      if (amt?.value) return `${new Decimal(amt.value).toFixed(2)} ${normalizeCurrencyCode(amt.currency)}`;
                      return '';
                    };
                    const del = meta?.delivered_amount || meta?.DeliveredAmount || Amount;
                    switch (TransactionType) {
                      case 'Payment': return Account === Destination ? `Swap` : `Payment`;
                      case 'OfferCreate': return `${Flags & 0x00080000 ? 'Sell' : 'Buy'} Order`;
                      case 'OfferCancel': return 'Cancel Order';
                      case 'TrustSet': return `${transaction.LimitAmount && new Decimal(transaction.LimitAmount.value).isZero() ? 'Remove' : 'Add'} Trust`;
                      case 'NFTokenMint': return 'Mint NFT';
                      case 'NFTokenCreateOffer': return 'NFT Offer';
                      case 'NFTokenAcceptOffer': return 'NFT Trade';
                      case 'AMMDeposit': return 'Add Liquidity';
                      case 'AMMWithdraw': return 'Remove Liquidity';
                      default: return TransactionType;
                    }
                  })()}
                </p>
                <p className={cn('text-[10px] font-mono mt-1', isDark ? 'text-white/30' : 'text-black/30')}>
                  {transactionHash?.slice(0, 8)}···{transactionHash?.slice(-6)}
                </p>
              </div>
              <span className={cn(
                'inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-lg',
                transaction.meta?.TransactionResult === 'tesSUCCESS'
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-red-400 bg-red-500/10'
              )}>
                {transaction.meta?.TransactionResult === 'tesSUCCESS' ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                {transaction.meta?.TransactionResult === 'tesSUCCESS' ? 'Success' : 'Failed'}
              </span>
            </div>
          </div>

          {/* Info Row */}
          <div className={cn('flex items-center justify-between px-2 py-1.5 rounded-lg text-[10px] tabular-nums', isDark ? 'bg-white/[0.02]' : 'bg-black/[0.02]')}>
            <span className={isDark ? 'text-white/40' : 'text-black/40'}>#{transaction.ledger_index}</span>
            <span className={isDark ? 'text-white/60' : 'text-gray-600'}>{formatTime(transaction.date)}</span>
            <span className={isDark ? 'text-white/40' : 'text-black/40'}>{dropsToXrp(transaction.Fee)} fee</span>
          </div>

          {/* Platform */}
          {transaction.SourceTag && getPlatform(transaction.SourceTag) && (
            <div className={cn('inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg', isDark ? 'bg-cyan-500/5' : 'bg-cyan-500/5')}>
              <span className={cn('text-[9px]', isDark ? 'text-white/40' : 'text-black/40')}>via</span>
              <span className="text-[10px] font-medium text-cyan-400">{getPlatform(transaction.SourceTag)}</span>
            </div>
          )}

          {/* Accounts */}
          <div className={cn('p-3 rounded-xl space-y-2', isDark ? 'bg-white/[0.02]' : 'bg-black/[0.02]')}>
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => window.open(`https://xrpl.to/profile/${tradeAccount || transaction.Account}`, '_blank')}
            >
              <AccountAvatar account={tradeAccount || transaction.Account} size={20} />
              <div className="flex-1 min-w-0">
                <span className={cn('text-[9px] uppercase tracking-wider', isDark ? 'text-white/30' : 'text-black/30')}>{tradeAccount ? 'Trader' : 'From'}</span>
                <p className={cn('text-[11px] font-mono truncate group-hover:text-cyan-400 transition-colors', isDark ? 'text-white/70' : 'text-gray-700')}>
                  {tradeAccount || transaction.Account}
                </p>
              </div>
            </div>
            {transaction.Destination && (
              <>
                <div className="flex items-center gap-2 pl-2">
                  <ArrowRight size={12} className={isDark ? 'text-white/20' : 'text-black/20'} />
                </div>
                <div
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => window.open(`https://xrpl.to/profile/${transaction.Destination}`, '_blank')}
                >
                  <AccountAvatar account={transaction.Destination} size={20} />
                  <div className="flex-1 min-w-0">
                    <span className={cn('text-[9px] uppercase tracking-wider', isDark ? 'text-white/30' : 'text-black/30')}>To</span>
                    <p className={cn('text-[11px] font-mono truncate group-hover:text-cyan-400 transition-colors', isDark ? 'text-white/70' : 'text-gray-700')}>
                      {transaction.Destination}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Amount */}
          {(transaction.Amount || transaction.meta?.delivered_amount) && (
            <div className={cn('p-3 rounded-xl', isDark ? 'bg-white/[0.02]' : 'bg-black/[0.02]')}>
              <span className={cn('text-[9px] uppercase tracking-wider block mb-1', isDark ? 'text-white/30' : 'text-black/30')}>Amount</span>
              <span className={cn('text-[15px] font-medium tabular-nums', isDark ? 'text-white' : 'text-gray-900')}>
                {formatAmount(transaction.meta?.delivered_amount || transaction.meta?.DeliveredAmount || transaction.Amount)}
              </span>
              {transaction.SendMax && (
                <span className={cn('text-[10px] block mt-1', isDark ? 'text-white/40' : 'text-black/40')}>
                  Max: {formatAmount(transaction.SendMax)}
                </span>
              )}
            </div>
          )}

          {/* OfferCreate Details */}
          {transaction.TransactionType === 'OfferCreate' && (
            <div className="grid grid-cols-2 gap-1.5">
              <div className={cn('p-1.5 rounded', isDark ? 'bg-white/[0.02]' : 'bg-black/[0.02]')}>
                <span className={cn('text-[8px] uppercase block', isDark ? 'text-white/30' : 'text-black/30')}>
                  {transaction.Flags & 0x00080000 ? 'Selling' : 'Buying'}
                </span>
                <span className={cn('text-[10px] font-medium', isDark ? 'text-white/80' : 'text-gray-700')}>
                  {formatAmount(transaction.TakerGets)}
                </span>
              </div>
              <div className={cn('p-1.5 rounded', isDark ? 'bg-white/[0.02]' : 'bg-black/[0.02]')}>
                <span className={cn('text-[8px] uppercase block', isDark ? 'text-white/30' : 'text-black/30')}>For</span>
                <span className={cn('text-[10px] font-medium', isDark ? 'text-white/80' : 'text-gray-700')}>
                  {formatAmount(transaction.TakerPays)}
                </span>
              </div>
              {(() => {
                try {
                  const getsVal = typeof transaction.TakerGets === 'string' ? new Decimal(dropsToXrp(transaction.TakerGets)) : new Decimal(transaction.TakerGets.value);
                  const paysVal = typeof transaction.TakerPays === 'string' ? new Decimal(dropsToXrp(transaction.TakerPays)) : new Decimal(transaction.TakerPays.value);
                  const rate = getsVal.div(paysVal);
                  const getCurr = (amt) => typeof amt === 'string' ? 'XRP' : normalizeCurrencyCode(amt.currency);
                  return (
                    <span className={cn('col-span-2 text-[9px] font-mono', isDark ? 'text-white/40' : 'text-black/40')}>
                      @ {rate.toFixed(rate.lt(0.01) ? 6 : 4)} {getCurr(transaction.TakerGets)}/{getCurr(transaction.TakerPays)}
                    </span>
                  );
                } catch { return null; }
              })()}
            </div>
          )}

          {/* TrustSet Details */}
          {transaction.TransactionType === 'TrustSet' && transaction.LimitAmount && (
            <div className="flex items-center justify-between">
              <div>
                <span className={cn('text-[8px] uppercase block', isDark ? 'text-white/30' : 'text-black/30')}>Trust Line</span>
                <span className={cn('text-[10px] font-medium', isDark ? 'text-white/80' : 'text-gray-700')}>
                  {formatAmount(transaction.LimitAmount)}
                </span>
              </div>
              <span className={cn('text-[9px] px-1.5 py-0.5 rounded',
                new Decimal(transaction.LimitAmount.value).isZero()
                  ? 'text-red-400 bg-red-500/10'
                  : 'text-emerald-400 bg-emerald-500/10'
              )}>
                {new Decimal(transaction.LimitAmount.value).isZero() ? 'REMOVED' : 'ACTIVE'}
              </span>
            </div>
          )}

          {/* NFT Details */}
          {transaction.NFTokenID && (
            <div>
              <span className={cn('text-[8px] uppercase block mb-0.5', isDark ? 'text-white/30' : 'text-black/30')}>NFT ID</span>
              <span className={cn('text-[9px] font-mono break-all', isDark ? 'text-white/60' : 'text-gray-600')}>
                {transaction.NFTokenID}
              </span>
            </div>
          )}

          {/* Memos */}
          {transaction.Memos?.length > 0 && (
            <div>
              <span className={cn('text-[8px] uppercase block mb-1', isDark ? 'text-white/30' : 'text-black/30')}>Memos</span>
              {transaction.Memos.map((m, i) => {
                const data = m.Memo?.MemoData ? decodeMemo(m.Memo.MemoData) : null;
                const type = m.Memo?.MemoType ? decodeMemo(m.Memo.MemoType) : null;
                return (data || type) ? (
                  <div key={i} className={cn('p-1.5 rounded border', isDark ? 'border-white/[0.06] bg-white/[0.01]' : 'border-black/[0.06] bg-black/[0.01]')}>
                    {type && <span className={cn('text-[8px] block mb-0.5', isDark ? 'text-white/40' : 'text-black/40')}>{type}</span>}
                    {data && <span className={cn('text-[9px] font-mono break-all', isDark ? 'text-white/60' : 'text-gray-600')}>{data}</span>}
                  </div>
                ) : null;
              })}
            </div>
          )}

          {/* Affected Nodes */}
          {transaction.meta?.AffectedNodes?.length > 0 && (
            <div className="flex items-center justify-between">
              <span className={cn('text-[8px] uppercase', isDark ? 'text-white/30' : 'text-black/30')}>Affected</span>
              <span className={cn('text-[9px] tabular-nums', isDark ? 'text-white/60' : 'text-gray-600')}>
                {transaction.meta.AffectedNodes.length} nodes
              </span>
            </div>
          )}
        </>
      ) : null}
    </div>
  );

  const orderbookContent = (
    <div className="flex flex-col" style={{ height: 320 }}>
      {/* Pair Info */}
      {pair && (
        <div className={cn('px-3 py-2', isDark ? 'border-b border-white/[0.04]' : 'border-b border-black/[0.04]')}>
          <div className="flex items-center justify-between mb-2">
            <span className={cn('text-[11px] font-medium', isDark ? 'text-white/70' : 'text-gray-700')}>
              {pair.curr1?.name || pair.curr1?.currency}/{pair.curr2?.name || pair.curr2?.currency}
            </span>
            <button
              onClick={() => setShowDepth(!showDepth)}
              className={cn(
                'px-2 py-1 text-[9px] font-medium rounded-lg transition-colors',
                showDepth
                  ? 'bg-cyan-500/10 text-cyan-400'
                  : isDark ? 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08]' : 'bg-black/[0.04] text-black/50 hover:bg-black/[0.08]'
              )}
            >
              {showDepth ? 'Depth' : 'Book'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-2 py-1.5 rounded-lg bg-emerald-500/10 text-center">
              <span className="text-[8px] block text-emerald-400/60 uppercase tracking-wider">Bid</span>
              <span className="text-[12px] font-medium tabular-nums text-emerald-400">
                {bestBid != null ? fNumber(bestBid) : '—'}
              </span>
            </div>
            <div className="flex-1 px-2 py-1.5 rounded-lg bg-red-500/10 text-center">
              <span className="text-[8px] block text-red-400/60 uppercase tracking-wider">Ask</span>
              <span className="text-[12px] font-medium tabular-nums text-red-400">
                {bestAsk != null ? fNumber(bestAsk) : '—'}
              </span>
            </div>
          </div>
        </div>
      )}

      {!showDepth ? (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Asks */}
          <div className="flex-1 min-h-0 flex flex-col">
            <div className={cn('flex items-center justify-between px-3 py-1.5 text-[9px]', isDark ? 'text-white/30' : 'text-black/30')}>
              <span className="text-red-400/70">Price</span>
              <span>Amount</span>
              <span>Total</span>
            </div>
            <div ref={asksScrollRef} className="flex-1 overflow-y-auto">
              {(() => {
                const askSlice = asks.slice(0, 30);
                const displayAsks = askSlice.slice().reverse();
                const lp = typeof limitPrice === 'number' ? limitPrice : null;
                return displayAsks.map((lvl, i) => {
                  const origIdx = askSlice.length - 1 - i;
                  const prev = i > 0 ? displayAsks[i - 1] : null;
                  const showMarker = lp != null && isBuyOrder && ((i === 0 && Number(lvl.price) <= lp) || (prev && Number(prev.price) > lp && Number(lvl.price) <= lp));
                  return (
                    <React.Fragment key={`ask-${origIdx}`}>
                      {showMarker && <LimitMarker label="Your buy limit" isDark={isDark} />}
                      <OrderRow level={lvl} type="ask" onClick={(e) => onAskClick?.(e, origIdx)} isDark={isDark} indicatorWidth={getIndicatorWidth(lvl.amount)} highlighted={showMarker} />
                    </React.Fragment>
                  );
                });
              })()}
              {!asks.length && <div className={cn('py-6 text-center text-[10px]', isDark ? 'text-white/20' : 'text-black/20')}>No sell orders</div>}
            </div>
          </div>

          {/* Spread */}
          <div className={cn('px-3 py-2 flex items-center justify-between', isDark ? 'bg-white/[0.02]' : 'bg-black/[0.02]')}>
            <span className={cn('text-[9px] uppercase tracking-wider', isDark ? 'text-white/30' : 'text-black/30')}>Spread</span>
            <span className={cn('text-[10px] font-medium tabular-nums', isDark ? 'text-white/70' : 'text-gray-700')}>
              {fNumber(spread.spreadAmount)} <span className={isDark ? 'text-white/40' : 'text-black/40'}>({Number(spread.spreadPercentage).toFixed(2)}%)</span>
            </span>
          </div>

          {/* Bids */}
          <div className="flex-1 min-h-0 flex flex-col">
            <div className={cn('flex items-center justify-between px-3 py-1.5 text-[9px]', isDark ? 'text-white/30' : 'text-black/30')}>
              <span className="text-emerald-400/70">Price</span>
              <span>Amount</span>
              <span>Total</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {(() => {
                const bidSlice = bids.slice(0, 30);
                const lp = typeof limitPrice === 'number' ? limitPrice : null;
                return bidSlice.map((lvl, i) => {
                  const prev = i > 0 ? bidSlice[i - 1] : null;
                  const showMarker = lp != null && !isBuyOrder && ((i === 0 && Number(lvl.price) < lp) || (prev && Number(prev.price) >= lp && Number(lvl.price) < lp));
                  return (
                    <React.Fragment key={`bid-${i}`}>
                      {showMarker && <LimitMarker label="Your sell limit" isDark={isDark} />}
                      <OrderRow level={lvl} type="bid" onClick={(e) => onBidClick?.(e, i)} isDark={isDark} indicatorWidth={getIndicatorWidth(lvl.amount)} highlighted={showMarker} />
                    </React.Fragment>
                  );
                });
              })()}
              {!bids.length && <div className={cn('py-6 text-center text-[10px]', isDark ? 'text-white/20' : 'text-black/20')}>No buy orders</div>}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-2 space-y-2">
          <div className={cn('p-2 rounded border', isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-black/[0.06] bg-black/[0.02]')}>
            <div className="grid grid-cols-2 gap-2 text-[9px]">
              <div>
                <span className={cn('block', isDark ? 'text-white/30' : 'text-black/30')}>Orders</span>
                <span className={cn('font-medium', isDark ? 'text-white' : 'text-gray-900')}>{bids.length + asks.length}</span>
              </div>
              <div>
                <span className={cn('block', isDark ? 'text-white/30' : 'text-black/30')}>Ratio</span>
                <span className={cn('font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                  {(() => {
                    const buyD = bids.reduce((s, b) => s + Number(b.amount || 0), 0);
                    const sellD = asks.reduce((s, a) => s + Number(a.amount || 0), 0);
                    return buyD && sellD ? (buyD / sellD).toFixed(2) : '—';
                  })()}
                </span>
              </div>
              <div>
                <span className="block text-emerald-400">Buy Depth</span>
                <span className="font-medium text-emerald-400">{fNumber(bids.reduce((s, b) => s + Number(b.amount || 0), 0))}</span>
              </div>
              <div>
                <span className="block text-red-400">Sell Depth</span>
                <span className="font-medium text-red-400">{fNumber(asks.reduce((s, a) => s + Number(a.amount || 0), 0))}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const content = (
    <div className={cn(
      'overflow-hidden transition-all duration-300 ease-out backdrop-blur-xl rounded-b-2xl',
      isDark ? 'bg-black/80 border border-t-0 border-white/[0.08]' : 'bg-white/80 border border-t-0 border-black/[0.08]',
      expanded ? 'opacity-100' : 'max-h-0 opacity-0 border-0'
    )}>
      {isOrderbook ? orderbookContent : transactionContent}
    </div>
  );

  if (embedded) {
    return (
      <div className={cn('h-full rounded-2xl border overflow-hidden flex flex-col backdrop-blur-xl',
        isDark ? 'border-white/[0.08] bg-black/80' : 'border-black/[0.08] bg-white/80'
      )}>
        {header}
        {content}
      </div>
    );
  }

  return (
    <div
      className={cn('fixed bottom-3 left-[316px] z-[60] pointer-events-auto', isDark ? 'text-white' : 'text-gray-900')}
      style={{ width: isOrderbook ? 300 : 320 }}
    >
      {header}
      {content}
    </div>
  );
});

TransactionDetailsPanel.displayName = 'TransactionDetailsPanel';

export default TransactionDetailsPanel;
