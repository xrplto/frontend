import { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import api from 'src/utils/api';
import { ThemeContext } from 'src/context/AppContext';
import { cn } from 'src/utils/cn';
import { getNftCoverUrl, parseTransaction } from 'src/utils/parseUtils';
import Link from 'next/link';
import { MD5 } from 'crypto-js';
import {
  Copy,
  ExternalLink,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  ArrowRight,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Code2,
  Coins,
  Activity,
  Images,
  Image
} from 'lucide-react';

const BASE_URL = 'https://api.xrpl.to';

// NFT Image component with lazy loading and tooltip
const NftImage = ({ nftTokenId, className, fallback }) => {
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [nftData, setNftData] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!nftTokenId) {
      setLoading(false);
      setError(true);
      return;
    }
    let cancelled = false;
    api
      .get(`${BASE_URL}/v1/nft/${nftTokenId}`)
      .then((res) => {
        if (cancelled) return;
        const nft = res.data;
        setNftData(nft);
        const coverUrl = getNftCoverUrl(nft, 'small', 'image');
        if (coverUrl) {
          setImageUrl(coverUrl);
        } else if (nft.meta?.image) {
          const metaImage = nft.meta.image;
          if (metaImage.startsWith('ipfs://')) {
            setImageUrl(`https://ipfs.io/ipfs/${metaImage.replace('ipfs://', '')}`);
          } else {
            setImageUrl(metaImage);
          }
        } else {
          setError(true);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [nftTokenId]);

  const handleMouseEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ top: rect.top - 8, left: rect.left + rect.width / 2 });
    setShowTooltip(true);
  };

  if (loading) {
    return <div className={cn(className, 'bg-white/10 animate-pulse')} />;
  }
  if (error || !imageUrl) {
    return fallback || null;
  }

  const largeImageUrl = nftData ? (getNftCoverUrl(nftData, 'medium', 'image') || imageUrl) : imageUrl;

  return (
    <>
      <img
        src={imageUrl}
        alt=""
        className={className}
        onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
      />
      {showTooltip && nftData && typeof window !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            top: tooltipPos.top,
            left: tooltipPos.left,
            transform: 'translate(-50%, -100%)',
            zIndex: 99999
          }}
          className={cn(
            'rounded-2xl p-3 min-w-[200px] max-w-[280px] shadow-2xl border backdrop-blur-3xl transition-all duration-300 pointer-events-none',
            isDark ? 'bg-black/90 border-white/10 shadow-black' : 'bg-white/90 border-gray-200 shadow-xl'
          )}
        >
          <div className="flex gap-3">
            <img src={largeImageUrl} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0 shadow-lg" />
            <div className="min-w-0 flex-1 py-0.5">
              <p className={cn('text-[12px] font-bold truncate leading-tight', isDark ? 'text-white' : 'text-gray-900')}>
                {nftData.name || nftData.meta?.name || 'Unnamed'}
              </p>
              {nftData.collection && (
                <p className={cn('text-[10px] truncate mt-0.5 font-medium', isDark ? 'text-white/40' : 'text-gray-500')}>
                  {nftData.collection}
                </p>
              )}
              {nftData.rarity_rank > 0 && (
                <div className="flex items-center gap-1 mt-1.5">
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-bold">Rank #{nftData.rarity_rank}</span>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

// Helper: decode hex currency
const decodeCurrency = (code) => {
  if (!code || code === 'XRP') return 'XRP';
  if (code.length === 3) return code;
  if (code.length === 40 && /^[0-9A-Fa-f]+$/.test(code)) {
    try {
      const hex = code.replace(/(00)+$/, '');
      let decoded = '';
      for (let i = 0; i < hex.length; i += 2) {
        const char = parseInt(hex.substr(i, 2), 16);
        if (char) decoded += String.fromCharCode(char);
      }
      return decoded.match(/^[A-Za-z0-9]+$/) ? decoded : code.substring(0, 6);
    } catch {
      return code.substring(0, 6);
    }
  }
  return code;
};

// Helper: format value
const fmtVal = (v) => {
  const n = parseFloat(v);
  return n >= 1 ? n.toFixed(2) : n >= 0.01 ? n.toFixed(4) : String(n);
};

// Helper: format currency display
const fmtCurrency = (c) => {
  if (!c || c === 'XRP') return 'XRP';
  if (c.length === 3) return c;
  if (c.length === 40) {
    try {
      const hex = c.replace(/0+$/, '');
      let decoded = '';
      for (let i = 0; i < hex.length; i += 2) {
        const char = parseInt(hex.substr(i, 2), 16);
        if (char) decoded += String.fromCharCode(char);
      }
      return decoded.match(/^[A-Za-z0-9]+$/) ? decoded : c.slice(0, 6);
    } catch {
      return c.slice(0, 6);
    }
  }
  return c;
};

// Helper: get token MD5 for image URL
const getTokenMd5 = (t) =>
  t?.currency === 'XRP'
    ? '84e5efeb89c4eae8f68188982dc290d8'
    : t?.issuer
      ? MD5(`${t.issuer}_${t.currency}`).toString()
      : null;


const TX_TYPES = ['all', 'Payment', 'OfferCreate', 'OfferCancel', 'TrustSet', 'AMMDeposit', 'AMMWithdraw', 'NFTokenMint', 'NFTokenAcceptOffer', 'NFTokenCreateOffer', 'NFTokenBurn', 'CheckCreate', 'CheckCash', 'EscrowCreate', 'EscrowFinish', 'AccountSet'];
const ITEMS_PER_PAGE = 10;

const COMPACT_LIMIT = 10;

// Helper: relative time (e.g. "1h ago", "3d ago")
const timeAgo = (ts) => {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
};

const AccountHistory = ({ account, compact = false }) => {
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';

  // View toggle
  const [historyView, setHistoryView] = useState('onchain');

  // Onchain state
  const [txHistory, setTxHistory] = useState([]);
  const [txMarker, setTxMarker] = useState(null);
  const [txHasMore, setTxHasMore] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  const [txTypeFilter, setTxTypeFilter] = useState('all');

  // Token trade state
  const [tokenHistory, setTokenHistory] = useState([]);
  const [tokenHistoryLoading, setTokenHistoryLoading] = useState(false);
  const [tokenHistoryCursor, setTokenHistoryCursor] = useState(null);
  const [tokenHistoryHasMore, setTokenHistoryHasMore] = useState(false);
  const [tokenHistoryType, setTokenHistoryType] = useState('all');
  const [tokenHistoryPairType, setTokenHistoryPairType] = useState('');
  const [tokenHistoryPage, setTokenHistoryPage] = useState(0);

  // NFT trades state
  const [nftTrades, setNftTrades] = useState([]);
  const [nftTradesLoading, setNftTradesLoading] = useState(false);
  const [nftTradesPage, setNftTradesPage] = useState(0);

  // Parse tx helper
  const parseTx = (tx) => parseTransaction(tx, account, decodeCurrency);

  // Fetch onchain history via API
  const fetchTxHistory = async (marker = null) => {
    if (!account) return;
    setTxLoading(true);
    try {
      let url = `${BASE_URL}/v1/account/tx/${account}?limit=50`;
      if (marker) url += `&marker=${encodeURIComponent(JSON.stringify(marker))}`;
      const response = await api.get(url);
      const txs = response.data?.txs || [];
      // Wrap txs in expected format for parseTransaction
      const wrappedTxs = txs.map(tx => ({ tx, meta: tx.meta, hash: tx.hash }));
      setTxHistory((prev) => (marker ? [...prev, ...wrappedTxs] : wrappedTxs));
      setTxMarker(response.data?.marker || null);
      setTxHasMore(response.data?.hasMore || false);
    } catch (err) {
      console.error('TX history fetch failed:', err);
    } finally {
      setTxLoading(false);
    }
  };

  // Auto-fetch onchain when view is onchain (or always in compact mode)
  useEffect(() => {
    if (!compact && historyView !== 'onchain') return;
    if (!account) return;
    if (txHistory.length > 0) return;
    fetchTxHistory();
  }, [historyView, account, txHistory.length, compact]);

  // Fetch NFT trades (skip in compact mode)
  useEffect(() => {
    if (compact) return;
    if (!account || nftTrades.length > 0) return;
    setNftTradesLoading(true);
    api
      .get(`${BASE_URL}/v1/nft/analytics/trader/${account}/trades?offset=0&limit=50`)
      .then((res) => setNftTrades(res.data?.trades || []))
      .catch(() => setNftTrades([]))
      .finally(() => setNftTradesLoading(false));
  }, [account, compact]);

  // Build token history URL with filters
  const buildTokenHistoryUrl = (cursor = null) => {
    let url = `${BASE_URL}/v1/history?account=${account}&limit=50`;
    if (tokenHistoryType && tokenHistoryType !== 'all') url += `&type=${tokenHistoryType}`;
    if (tokenHistoryPairType) url += `&pairType=${tokenHistoryPairType}`;
    if (cursor) url += `&cursor=${cursor}`;
    return url;
  };

  // Fetch token history when tokens view selected or filters change (skip in compact mode)
  useEffect(() => {
    if (compact) return;
    if (historyView !== 'tokens' || !account) return;
    setTokenHistoryLoading(true);
    api
      .get(buildTokenHistoryUrl())
      .then((res) => {
        setTokenHistory(res.data?.data || []);
        setTokenHistoryCursor(res.data?.meta?.nextCursor || null);
        setTokenHistoryHasMore(!!res.data?.meta?.nextCursor);
      })
      .catch((err) => console.error('Failed to fetch token history:', err))
      .finally(() => setTokenHistoryLoading(false));
  }, [historyView, account, tokenHistoryType, tokenHistoryPairType]);

  const loadMoreTokenHistory = () => {
    if (!tokenHistoryCursor || tokenHistoryLoading) return;
    setTokenHistoryLoading(true);
    api
      .get(buildTokenHistoryUrl(tokenHistoryCursor))
      .then((res) => {
        setTokenHistory((prev) => [...prev, ...(res.data?.data || [])]);
        setTokenHistoryCursor(res.data?.meta?.nextCursor || null);
        setTokenHistoryHasMore(!!res.data?.meta?.nextCursor);
      })
      .catch((err) => console.error('Failed to fetch more token history:', err))
      .finally(() => setTokenHistoryLoading(false));
  };

  // Compact mode: brief summary for Overview tab
  if (compact) {
    const recentTxs = txHistory.slice(0, COMPACT_LIMIT);
    return (
      <div
        className={cn(
          'rounded-xl overflow-hidden border',
          isDark ? 'bg-black/50 backdrop-blur-sm border-white/[0.15]' : 'bg-white border-gray-200'
        )}
      >
        <div className={cn(
          'px-4 py-3 flex items-center justify-between border-b',
          isDark ? 'border-b-white/[0.08]' : 'border-b-gray-100'
        )}>
          <div className="flex items-center gap-2">
            <Activity size={14} className={isDark ? 'text-white/50' : 'text-gray-500'} />
            <p className={cn('text-[11px] font-semibold uppercase tracking-[0.15em]', isDark ? 'text-white/50' : 'text-gray-500')}>Recent Activity</p>
          </div>
        </div>
        {txLoading && recentTxs.length === 0 ? (
          <div className={cn('p-10 text-center', isDark ? 'text-white/20' : 'text-gray-300')}>
            <p className="text-[13px] font-medium">Loading...</p>
          </div>
        ) : recentTxs.length === 0 ? (
          <div className={cn('p-10 text-center', isDark ? 'text-white/20' : 'text-gray-300')}>
            <p className="text-[13px] font-medium">No recent activity</p>
          </div>
        ) : (
          <>
            <div className={cn('grid grid-cols-[1.3fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-2 text-[9px] uppercase tracking-wider font-semibold border-b', isDark ? 'text-white/30 border-white/[0.06]' : 'text-gray-400 border-gray-100')}>
              <div>Transaction</div>
              <div className="text-left">Source</div>
              <div className="text-right">Spent</div>
              <div className="text-right">Received</div>
              <div className="text-right">Fee</div>
              <div className="text-right">Hash</div>
              <div className="text-right">Time</div>
            </div>
            <div className={cn('divide-y', isDark ? 'divide-white/[0.04]' : 'divide-gray-50')}>
              {recentTxs.map((tx) => {
                const parsed = parseTx(tx);
                return (
                  <div
                    key={parsed.id}
                    className={cn('grid grid-cols-[1.3fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-2.5 items-center transition-colors', isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50', (parsed.nftTokenId || parsed.tokenCurrency) && 'cursor-pointer')}
                    onClick={() => {
                      if (parsed.nftTokenId) window.open(`/nft/${parsed.nftTokenId}`, '_blank');
                      else if (parsed.tokenCurrency && parsed.tokenCurrency !== 'XRP' && parsed.tokenIssuer) window.open(`/token/${parsed.tokenIssuer}-${decodeCurrency(parsed.tokenCurrency)}`, '_blank');
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={cn(
                        'w-[38px] text-center py-1 rounded-lg text-[10px] font-bold flex-shrink-0',
                        parsed.type === 'failed' ? 'bg-amber-500/10 text-amber-500' :
                          parsed.type === 'in' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                      )}>
                        {parsed.type === 'failed' ? 'Fail' : parsed.type === 'in' ? 'In' : 'Out'}
                      </span>
                      <div className="relative flex-shrink-0">
                        {parsed.nftTokenId ? (
                          <NftImage
                            nftTokenId={parsed.nftTokenId}
                            className="w-8 h-8 rounded-xl object-cover bg-white/5"
                            fallback={<div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', isDark ? 'bg-purple-500/10' : 'bg-purple-50')}><Image size={14} className="text-purple-400" /></div>}
                          />
                        ) : parsed.tokenCurrency ? (
                          <img
                            src={`https://s1.xrpl.to/token/${parsed.tokenCurrency === 'XRP' ? '84e5efeb89c4eae8f68188982dc290d8' : MD5(`${parsed.tokenIssuer}_${parsed.tokenCurrency}`).toString()}`}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover bg-white/5"
                            onError={(e) => { e.target.onerror = null; e.target.src = '/static/alt.webp'; }}
                          />
                        ) : (
                          <div className={cn('w-8 h-8 rounded-full', isDark ? 'bg-white/5' : 'bg-gray-100')} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className={cn('text-[12px] font-bold truncate block', isDark ? 'text-white' : 'text-gray-900')}>
                          {parsed.label}
                          {parsed.tokenCurrency && !parsed.nftTokenId && !parsed.fromAmount && (
                            <span className={cn('ml-1 font-medium', isDark ? 'text-white/40' : 'text-gray-500')}>{decodeCurrency(parsed.tokenCurrency)}</span>
                          )}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={cn('text-[8px] px-1 py-0.5 rounded font-medium',
                            parsed.fromAmount && parsed.toAmount ? (isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600') :
                            parsed.nftTokenId ? (isDark ? 'bg-pink-500/10 text-pink-400' : 'bg-pink-50 text-pink-600') :
                            isDark ? 'bg-white/5 text-white/40' : 'bg-gray-100 text-gray-500'
                          )}>
                            {parsed.fromAmount && parsed.toAmount ? 'Swap' :
                             parsed.txType === 'NFTokenAcceptOffer' ? 'NFT Trade' :
                             parsed.txType === 'NFTokenCreateOffer' ? 'NFT Offer' :
                             parsed.txType === 'NFTokenMint' ? 'NFT Mint' :
                             parsed.txType === 'NFTokenBurn' ? 'NFT Burn' :
                             parsed.txType === 'NFTokenCancelOffer' ? 'Cancel' :
                             parsed.txType === 'TrustSet' ? 'Trustline' :
                             parsed.txType === 'OfferCreate' ? 'DEX Order' :
                             parsed.txType === 'OfferCancel' ? 'Cancel' :
                             parsed.txType === 'Payment' ? 'Transfer' :
                             parsed.txType || 'Tx'}
                          </span>
                          {parsed.nftTokenId && <Link href={`/nft/${parsed.nftTokenId}`} onClick={(e) => e.stopPropagation()} className={cn('text-[8px] font-mono truncate hover:text-blue-400', isDark ? 'text-white/25' : 'text-gray-400')}>{parsed.nftTokenId.slice(0,8)}...</Link>}
                          {parsed.type === 'failed' && <span className="text-[8px] font-bold text-amber-500 uppercase">Failed</span>}
                          {parsed.isDust && <span className="text-[8px] font-bold text-amber-500 uppercase">Dust</span>}
                        </div>
                      </div>
                    </div>
                    <div className="min-w-0 text-left">
                      {parsed.sourceTag ? (
                        <div>
                          <span className={cn('text-[9px] px-1.5 py-0.5 rounded font-bold inline-block', isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600')}>#{parsed.sourceTag}</span>
                          {parsed.sourceTagName && <span className={cn('text-[8px] block mt-0.5 truncate', isDark ? 'text-white/25' : 'text-gray-400')}>{parsed.sourceTagName}</span>}
                        </div>
                      ) : parsed.counterparty && parsed.counterparty.startsWith('r') ? (
                        <span className={cn('text-[10px] truncate block font-mono', isDark ? 'text-white/40' : 'text-gray-500')}>{parsed.counterparty.slice(0,6)}...{parsed.counterparty.slice(-4)}</span>
                      ) : parsed.counterparty ? (
                        <span className={cn('text-[9px] px-1.5 py-0.5 rounded font-medium inline-block', isDark ? 'bg-white/5 text-white/50' : 'bg-gray-100 text-gray-500')}>{parsed.counterparty}</span>
                      ) : <span className={cn('text-[10px]', isDark ? 'text-white/20' : 'text-gray-300')}>{'\u2014'}</span>}
                    </div>
                    <div className="text-right">
                      {parsed.fromAmount && parsed.toAmount ? (
                        <span className="text-[10px] font-bold tabular-nums text-red-400">{parsed.fromAmount.split(' ')[0]} <span className={cn('text-[8px] font-medium', isDark ? 'text-white/30' : 'text-gray-400')}>{parsed.fromAmount.split(' ')[1] || 'XRP'}</span></span>
                      ) : parsed.nftTokenId && parsed.txType !== 'NFTokenCancelOffer' && parsed.type === 'in' ? (
                        <Link href={`/nft/${parsed.nftTokenId}`} onClick={(e) => e.stopPropagation()} className="text-[9px] font-mono text-red-400 hover:text-red-300">{parsed.nftTokenId.slice(0,8)}...</Link>
                      ) : parsed.nftTokenId && parsed.txType !== 'NFTokenCancelOffer' && parsed.type === 'out' && parsed.amount ? (
                        <span className="text-[10px] font-bold tabular-nums text-red-400">{parsed.amount.split(' ')[0]} <span className={cn('text-[8px] font-medium', isDark ? 'text-white/30' : 'text-gray-400')}>XRP</span></span>
                      ) : parsed.type === 'out' && parsed.amount && !parsed.amount.includes('Limit') && !parsed.amount.includes('offer') ? (
                        <span className="text-[10px] font-bold tabular-nums text-red-400">{parsed.amount.split(' ')[0]} <span className={cn('text-[8px] font-medium', isDark ? 'text-white/30' : 'text-gray-400')}>{parsed.tokenCurrency ? decodeCurrency(parsed.tokenCurrency) : 'XRP'}</span></span>
                      ) : <span className={cn('text-[10px]', isDark ? 'text-white/20' : 'text-gray-300')}>{'\u2014'}</span>}
                    </div>
                    <div className="text-right">
                      {parsed.fromAmount && parsed.toAmount ? (
                        <span className="text-[10px] font-bold tabular-nums text-emerald-500">{parsed.toAmount.split(' ')[0]} <span className={cn('text-[8px] font-medium', isDark ? 'text-white/30' : 'text-gray-400')}>{parsed.toAmount.split(' ')[1] || 'XRP'}</span></span>
                      ) : parsed.nftTokenId && parsed.txType !== 'NFTokenCancelOffer' && parsed.type === 'out' ? (
                        <Link href={`/nft/${parsed.nftTokenId}`} onClick={(e) => e.stopPropagation()} className="text-[9px] font-mono text-emerald-500 hover:text-emerald-400">{parsed.nftTokenId.slice(0,8)}...</Link>
                      ) : parsed.nftTokenId && parsed.txType !== 'NFTokenCancelOffer' && parsed.type === 'in' && parsed.amount ? (
                        <span className="text-[10px] font-bold tabular-nums text-emerald-500">{parsed.amount.split(' ')[0]} <span className={cn('text-[8px] font-medium', isDark ? 'text-white/30' : 'text-gray-400')}>XRP</span></span>
                      ) : parsed.type === 'in' && parsed.amount && !parsed.amount.includes('Limit') && !parsed.amount.includes('offer') ? (
                        <span className="text-[10px] font-bold tabular-nums text-emerald-500">{parsed.amount.split(' ')[0]} <span className={cn('text-[8px] font-medium', isDark ? 'text-white/30' : 'text-gray-400')}>{parsed.tokenCurrency ? decodeCurrency(parsed.tokenCurrency) : 'XRP'}</span></span>
                      ) : <span className={cn('text-[10px]', isDark ? 'text-white/20' : 'text-gray-300')}>{'\u2014'}</span>}
                    </div>
                    <div className={cn('text-right text-[9px] tabular-nums', parseFloat(parsed.fee) > 0.00005 ? 'text-red-400' : isDark ? 'text-white/30' : 'text-gray-400')}>
                      {parsed.fee || '\u2014'}
                    </div>
                    <Link
                      href={`/tx/${parsed.hash}`}
                      target="_blank"
                      onClick={(e) => e.stopPropagation()}
                      className={cn('text-right text-[9px] font-mono transition-colors', isDark ? 'text-white/25 hover:text-blue-400' : 'text-gray-400 hover:text-blue-500')}
                    >
                      {parsed.hash?.slice(0,4)}...{parsed.hash?.slice(-4)}
                    </Link>
                    <div className={cn('text-right text-[10px] font-medium tabular-nums', isDark ? 'text-white/40' : 'text-gray-400')}>
                      {timeAgo(parsed.time)}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      {/* History View Toggle */}
      <div className="flex justify-start mb-5">
        <div className={cn(
          'flex items-center gap-1 p-1 rounded-xl border',
          isDark ? 'bg-white/[0.03] border-white/10' : 'bg-gray-100/50 border-gray-200'
        )}>
          {[
            { id: 'onchain', label: 'Onchain', icon: Code2 },
            { id: 'tokens', label: 'Trades', icon: Coins }
          ].map((view) => (
            <button
              key={view.id}
              onClick={() => setHistoryView(view.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold transition-all duration-200',
                historyView === view.id
                  ? cn(isDark ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]' : 'bg-white text-gray-900 shadow-sm')
                  : cn(isDark ? 'text-white/40 hover:text-white/70 hover:bg-white/[0.02]' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50')
              )}
            >
              <view.icon size={13} className={cn('transition-transform duration-200', historyView === view.id ? 'scale-110' : 'opacity-50')} />
              <span>{view.label}</span>
            </button>
          ))}
        </div>
      </div>,

      {/* Onchain History - Table Layout */}
      {historyView === 'onchain' && (
        <div
          className={cn(
            'rounded-xl overflow-hidden transition-all duration-300',
            isDark ? 'bg-black/50 backdrop-blur-sm border border-white/[0.15]' : 'bg-white border border-gray-200'
          )}
        >
          {/* Header */}
          <div
            className={cn(
              'px-4 py-3 flex flex-wrap items-center justify-between gap-4 border-b',
              isDark ? 'border-b-white/[0.08]' : 'border-b-gray-100'
            )}
          >
            <div className="flex items-center gap-2">
              <Activity size={14} className={isDark ? 'text-white/50' : 'text-gray-500'} />
              <p className={cn('text-[11px] font-semibold uppercase tracking-[0.15em]', isDark ? 'text-white/50' : 'text-gray-500')}>Transactions</p>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {['all', 'Payment', 'OfferCreate', 'TrustSet'].map(t => (
                <button
                  key={t}
                  onClick={() => setTxTypeFilter(t)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200',
                    txTypeFilter === t
                      ? (isDark ? 'bg-white/10 text-white shadow-sm' : 'bg-gray-900 text-white shadow-sm')
                      : (isDark ? 'text-white/40 hover:text-white/70 hover:bg-white/5' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100')
                  )}
                >
                  {t === 'all' ? 'All' : t === 'OfferCreate' ? 'Trade' : t}
                </button>
              ))}
              <div className="h-4 w-[1px] bg-white/10 mx-1 hidden sm:block" />
              <select
                value={['all', 'Payment', 'OfferCreate', 'TrustSet'].includes(txTypeFilter) ? '' : txTypeFilter}
                onChange={(e) => e.target.value && setTxTypeFilter(e.target.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-[10px] font-bold outline-none cursor-pointer transition-all appearance-none',
                  !['all', 'Payment', 'OfferCreate', 'TrustSet'].includes(txTypeFilter)
                    ? (isDark ? 'bg-white/10 text-white shadow-sm border border-white/5' : 'bg-gray-900 text-white shadow-sm')
                    : (isDark ? 'bg-white/5 text-white/40 hover:text-white/70 border border-white/5' : 'bg-gray-100 text-gray-400 hover:text-gray-900'),
                  isDark ? '[&>option]:bg-[#1a1a1a] [&>option]:text-white' : ''
                )}
              >
                <option value="">{['all', 'Payment', 'OfferCreate', 'TrustSet'].includes(txTypeFilter) ? 'Other \u25BE' : txTypeFilter}</option>
                {TX_TYPES.filter(t => !['all', 'Payment', 'OfferCreate', 'TrustSet'].includes(t)).map(t => (
                  <option key={t} value={t}>{t.replace('NFToken', 'NFT ').replace('AMM', 'AMM ')}</option>
                ))}
              </select>
            </div>
          </div>

          {txHistory.length === 0 ? (
            <div className={cn('p-16 text-center', isDark ? 'text-white/20' : 'text-gray-300')}>
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-current flex items-center justify-center opacity-40">
                  <Activity size={24} />
                </div>
                <p className="text-[13px] font-medium">{txLoading ? 'Scanning ledger...' : 'No ledger records found'}</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={cn('text-[10px] font-bold uppercase tracking-widest border-b', isDark ? 'text-white/30 border-white/[0.04]' : 'text-gray-400 border-gray-50')}>
                    <th className="px-6 py-4 text-left">Asset</th>
                    <th className="px-4 py-4 text-left">Type</th>
                    <th className="px-4 py-4 text-left">Info</th>
                    <th className="px-4 py-4 text-right">Value</th>
                    <th className="px-4 py-4 text-right">Time</th>
                    <th className="px-6 py-4 text-right w-[60px]"></th>
                  </tr>
                </thead>
                <tbody className={cn('divide-y', isDark ? 'divide-white/[0.04]' : 'divide-gray-50')}>
                  {txHistory.filter(tx => txTypeFilter === 'all' || (tx.tx_json || tx.tx || tx).TransactionType === txTypeFilter).map((tx) => {
                    const parsed = parseTx(tx);
                    return (
                      <tr
                        key={parsed.id}
                        className={cn('group transition-all duration-200 relative cursor-pointer', isDark ? 'hover:bg-white/[0.05]' : 'hover:bg-gray-50')}
                        onClick={() => window.open(`/tx/${parsed.hash}`, '_blank')}
                      >
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              'w-10 text-center flex-shrink-0 py-1 rounded-lg text-[10px] font-bold transition-transform group-hover:scale-105',
                              parsed.type === 'failed' ? 'bg-amber-500/10 text-amber-500' :
                                parsed.type === 'in' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                            )}>
                              {parsed.type === 'failed' ? 'Fail' : parsed.type === 'in' ? 'In' : 'Out'}
                            </span>
                            {parsed.nftTokenId ? (
                              <div className="relative group/nft w-9 h-9 flex-shrink-0">
                                <NftImage
                                  nftTokenId={parsed.nftTokenId}
                                  className="w-9 h-9 rounded-xl object-cover bg-white/5 border border-white/10 shadow-sm"
                                  fallback={
                                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', isDark ? 'bg-purple-500/10' : 'bg-purple-50 border border-purple-100')}>
                                      <Image size={16} className="text-purple-400" />
                                    </div>
                                  }
                                />
                                {parsed.nftTokenId && (
                                  <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-purple-500 rounded-full border-2 border-black flex items-center justify-center shadow-lg">
                                    <Images size={8} className="text-white" />
                                  </div>
                                )}
                              </div>
                            ) : parsed.tokenCurrency ? (
                              <img
                                src={`https://s1.xrpl.to/token/${parsed.tokenCurrency === 'XRP' ? '84e5efeb89c4eae8f68188982dc290d8' : MD5(`${parsed.tokenIssuer}_${parsed.tokenCurrency}`).toString()}`}
                                alt=""
                                className="w-9 h-9 flex-shrink-0 rounded-full object-cover bg-white/5 border border-white/10 shadow-sm"
                                onError={(e) => { e.target.onerror = null; e.target.src = '/static/alt.webp'; }}
                              />
                            ) : (
                              <div className={cn('w-9 h-9 flex-shrink-0 rounded-full border border-white/5', isDark ? 'bg-white/[0.03]' : 'bg-gray-100')} />
                            )}
                            <div className="flex flex-col">
                              <span className={cn('text-[13px] font-bold tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>
                                {parsed.tokenCurrency ? decodeCurrency(parsed.tokenCurrency) : (parsed.nftTokenId ? 'NFT' : 'XRP')}
                              </span>
                              {parsed.tokenIssuer && (
                                <span className={cn('text-[10px] font-medium opacity-40', isDark ? 'text-white' : 'text-gray-500')}>
                                  {parsed.tokenIssuer.slice(0, 4)}...{parsed.tokenIssuer.slice(-4)}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col">
                            <span className={cn('text-[12px] font-bold', isDark ? 'text-white' : 'text-gray-900')}>{parsed.label}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {parsed.type === 'failed' && <span className="text-[9px] font-bold text-amber-500 uppercase tracking-tighter">Failed</span>}
                              {parsed.isDust && <span className="text-[9px] font-bold text-amber-500 uppercase tracking-tighter">Dust</span>}
                              {parsed.sourceTag && (
                                <span className={cn('text-[9px] px-1.5 py-0.5 rounded-md font-bold', isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600')}>
                                  #{parsed.sourceTag}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col">
                            <span className={cn('text-[11px] font-bold opacity-80', isDark ? 'text-white/60' : 'text-gray-700')}>
                              {parsed.counterparty ? (
                                parsed.counterparty.startsWith('r') ? (
                                  <span className="hover:text-blue-500 transition-colors">
                                    {parsed.counterparty.slice(0, 6)}...{parsed.counterparty.slice(-4)}
                                  </span>
                                ) : parsed.counterparty
                              ) : parsed.fromAmount ? 'DEX Swap' : '\u2014'}
                            </span>
                            {parsed.sourceTagName && (
                              <span className="text-[9px] font-medium text-blue-400/80 mt-0.5">{parsed.sourceTagName}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex flex-col items-end">
                            {parsed.fromAmount && parsed.toAmount ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[12px] font-bold tabular-nums text-red-500">{parsed.fromAmount.split(' ')[0]}</span>
                                <span className="text-[10px] text-white/20">to</span>
                                <span className="text-[12px] font-bold tabular-nums text-emerald-500">{parsed.toAmount.split(' ')[0]}</span>
                              </div>
                            ) : parsed.amount ? (
                              <span className={cn(
                                'text-[13px] font-bold tabular-nums',
                                parsed.type === 'failed' ? 'text-amber-500' :
                                  parsed.type === 'in' ? 'text-emerald-500' : 'text-red-500'
                              )}>
                                {parsed.type !== 'failed' && (parsed.type === 'in' ? '+' : '-')}{parsed.amount.replace(' XRP', '').replace(' NFT', '')}
                              </span>
                            ) : (
                              <span className="opacity-20 text-[13px]">{'\u2014'}</span>
                            )}
                            <span className={cn('text-[10px] font-medium opacity-40 uppercase', isDark ? 'text-white' : 'text-gray-500')}>
                              {parsed.tokenCurrency ? decodeCurrency(parsed.tokenCurrency) : (parsed.nftTokenId ? 'NFT' : 'XRP')}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className={cn('text-[12px] tabular-nums font-bold tracking-tight', isDark ? 'text-white/50' : 'text-gray-500')}>
                            {parsed.time ? new Date(parsed.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '\u2014'}
                          </span>
                          <span className={cn('block text-[9px] font-medium opacity-30 uppercase mt-0.5', isDark ? 'text-white' : 'text-gray-500')}>
                            {parsed.time ? new Date(parsed.time).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <div className={cn('p-2 rounded-lg ml-auto w-fit transition-colors group-hover:bg-white/5', isDark ? 'text-white/20 group-hover:text-blue-400' : 'text-gray-300 group-hover:text-blue-500')}>
                            <ExternalLink size={14} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {txHasMore && (
            <button
              onClick={() => fetchTxHistory(txMarker)}
              disabled={txLoading}
              className={cn(
                'w-full text-center py-4 text-[12px] font-bold uppercase tracking-widest border-t transition-all duration-200',
                isDark
                  ? 'border-white/[0.08] text-white/40 hover:text-white/70 hover:bg-white/[0.02]'
                  : 'border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              )}
            >
              {txLoading ? 'Loading...' : 'Load more transactions'}
            </button>
          )}
        </div>
      )}

      {/* Token History */}
      {historyView === 'tokens' &&
        (() => {
          const totalPages = Math.ceil(tokenHistory.length / ITEMS_PER_PAGE);
          const paginatedHistory = tokenHistory.slice(
            tokenHistoryPage * ITEMS_PER_PAGE,
            (tokenHistoryPage + 1) * ITEMS_PER_PAGE
          );

          return (
            <div
              className={cn(
                'rounded-xl overflow-hidden transition-all duration-300 mt-6',
                isDark ? 'bg-black/50 backdrop-blur-sm border border-white/[0.15]' : 'bg-white border border-gray-200'
              )}
            >
              {/* Header with filters */}
              <div
                className={cn(
                  'px-4 py-3 flex flex-wrap items-center justify-between gap-4 border-b',
                  isDark ? 'border-b-white/[0.08]' : 'border-b-gray-100'
                )}
              >
                <div className="flex items-center gap-2">
                  <Coins size={14} className={isDark ? 'text-white/50' : 'text-gray-500'} />
                  <p className={cn('text-[11px] font-semibold uppercase tracking-[0.15em]', isDark ? 'text-white/50' : 'text-gray-500')}>Token Trades</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className={cn('flex p-1 rounded-xl border', isDark ? 'bg-white/[0.03] border-white/10' : 'bg-gray-100 border-gray-200')}>
                    {['all', 'trades', 'liquidity'].map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          setTokenHistoryType(t);
                          setTokenHistoryPage(0);
                        }}
                        className={cn(
                          'px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all duration-200 capitalize',
                          tokenHistoryType === t
                            ? (isDark ? 'bg-white/10 text-white shadow-sm' : 'bg-white text-gray-900 shadow-sm')
                            : (isDark ? 'text-white/40 hover:text-white/70' : 'text-gray-500 hover:text-gray-700')
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={cn('text-[10px] font-bold uppercase tracking-widest border-b', isDark ? 'text-white/30 border-white/[0.04]' : 'text-gray-400 border-gray-50')}>
                      <th className="px-6 py-4 text-left">Type</th>
                      <th className="px-4 py-4 text-left">Assets Involved</th>
                      <th className="px-4 py-4 text-right">Time</th>
                      <th className="px-6 py-4 text-right w-[140px]">Hash</th>
                    </tr>
                  </thead>
                  <tbody className={cn('divide-y', isDark ? 'divide-white/[0.04]' : 'divide-gray-50')}>
                    {tokenHistoryLoading && tokenHistory.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className={cn(
                            'px-4 py-8 text-center text-[13px]',
                            isDark ? 'text-white/35' : 'text-gray-400'
                          )}
                        >
                          Loading...
                        </td>
                      </tr>
                    ) : paginatedHistory.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className={cn(
                            'px-4 py-12 text-center text-[13px]',
                            isDark ? 'text-white/35' : 'text-gray-400'
                          )}
                        >
                          No transactions found
                        </td>
                      </tr>
                    ) : (
                      paginatedHistory.map((trade) => {
                        const paidIsXRP = trade.paid?.currency === 'XRP';
                        const gotIsXRP = trade.got?.currency === 'XRP';
                        const isTokenToToken = !paidIsXRP && !gotIsXRP;
                        const isBuy = paidIsXRP;
                        const paidMd5 = getTokenMd5(trade.paid);
                        const gotMd5 = getTokenMd5(trade.got);

                        return (
                          <tr
                            key={trade._id}
                            className={cn(
                              'group transition-all duration-300 relative overflow-hidden',
                              isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50'
                            )}
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3.5">
                                <div
                                  className={cn(
                                    'w-8 h-8 rounded-xl flex items-center justify-center shadow-sm',
                                    isTokenToToken
                                      ? 'bg-blue-500/10 text-blue-400'
                                      : isBuy
                                        ? 'bg-emerald-500/10 text-emerald-400'
                                        : 'bg-red-500/10 text-red-400'
                                  )}
                                >
                                  <span className="text-[10px] font-bold">
                                    {isTokenToToken ? 'Swap' : isBuy ? 'Buy' : 'Sell'}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <p className={cn('text-[13px] font-bold tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>
                                    {isTokenToToken ? 'Token Swap' : isBuy ? 'Buy Order' : 'Sell Order'}
                                  </p>
                                  <p className={cn('text-[10px] font-bold uppercase tracking-wider opacity-30', isDark ? 'text-white' : 'text-gray-500')}>
                                    {isTokenToToken ? 'DEX Swap' : 'AMM Trade'}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <div className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border', isDark ? 'bg-white/[0.02] border-white/5' : 'bg-gray-50 border-gray-100')}>
                                  <div className="flex items-center gap-1.5">
                                    {paidMd5 && (
                                      <img src={`https://s1.xrpl.to/token/${paidMd5}`} className="w-4 h-4 rounded-full" onError={(e) => { e.target.style.display = 'none'; }} alt="" />
                                    )}
                                    <span className={cn('text-[12px] font-bold tabular-nums', isDark ? 'text-white/90' : 'text-gray-900')}>{fmtVal(trade.paid?.value)}</span>
                                    <span className="text-[10px] font-bold opacity-40">{fmtCurrency(trade.paid?.currency)}</span>
                                  </div>
                                  <span className="mx-1 text-[10px] opacity-20">to</span>
                                  <div className="flex items-center gap-1.5">
                                    {gotMd5 && (
                                      <img src={`https://s1.xrpl.to/token/${gotMd5}`} className="w-4 h-4 rounded-full" onError={(e) => { e.target.style.display = 'none'; }} alt="" />
                                    )}
                                    <span className={cn('text-[12px] font-bold tabular-nums', isBuy ? 'text-emerald-500' : isDark ? 'text-white/90' : 'text-gray-900')}>{fmtVal(trade.got?.value)}</span>
                                    <span className="text-[10px] font-bold opacity-40">{fmtCurrency(trade.got?.currency)}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <span className={cn('text-[12px] tabular-nums font-bold tracking-tight', isDark ? 'text-white/50' : 'text-gray-500')}>
                                {trade.time ? new Date(trade.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '\u2014'}
                              </span>
                              <span className={cn('block text-[9px] font-medium opacity-30 uppercase mt-0.5', isDark ? 'text-white' : 'text-gray-500')}>
                                {trade.time ? new Date(trade.time).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Link
                                  href={`/tx/${trade.hash}`}
                                  target="_blank"
                                  className={cn(
                                    'text-[11px] font-mono font-bold tracking-wider hover:text-blue-400 transition-colors',
                                    isDark ? 'text-white/20' : 'text-gray-400'
                                  )}
                                >
                                  {trade.hash?.slice(0, 4)}...{trade.hash?.slice(-4)}
                                </Link>
                                <button
                                  onClick={() => navigator.clipboard.writeText(trade.hash)}
                                  className={cn(
                                    'p-1.5 rounded-lg transition-all hover:scale-110',
                                    isDark ? 'text-white/20 hover:text-white/50 hover:bg-white/5' : 'text-gray-300 hover:text-gray-600 hover:bg-gray-100'
                                  )}
                                >
                                  <Copy size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div
                className={cn(
                  'px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-t',
                  isDark ? 'border-white/[0.06]' : 'border-gray-100'
                )}
              >
                <div className="flex items-center gap-3 opacity-40">
                  <span className={cn('text-[11px] font-bold uppercase tracking-wider', isDark ? 'text-white' : 'text-gray-500')}>Items per page</span>
                  <span className={cn('text-[12px] font-bold tabular-nums', isDark ? 'text-white' : 'text-gray-900')}>{ITEMS_PER_PAGE}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setTokenHistoryPage(0)}
                    disabled={tokenHistoryPage === 0}
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-20',
                      isDark ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                    )}
                  >
                    <span className="text-sm font-bold">&laquo;</span>
                  </button>
                  <button
                    onClick={() => setTokenHistoryPage((p) => Math.max(0, p - 1))}
                    disabled={tokenHistoryPage === 0}
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-20',
                      isDark ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                    )}
                  >
                    <span className="text-sm font-bold">&lsaquo;</span>
                  </button>
                  <div className={cn('px-3 py-1 rounded-lg text-[11px] font-bold', isDark ? 'bg-white/5 text-white/70' : 'bg-gray-100 text-gray-700')}>
                    {tokenHistoryPage + 1} / {tokenHistoryHasMore ? '...' : totalPages}
                  </div>
                  <button
                    onClick={() => {
                      setTokenHistoryPage((p) => p + 1);
                      if ((tokenHistoryPage + 2) * ITEMS_PER_PAGE >= tokenHistory.length && tokenHistoryHasMore) loadMoreTokenHistory();
                    }}
                    disabled={!tokenHistoryHasMore && tokenHistoryPage >= totalPages - 1}
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-20',
                      isDark ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                    )}
                  >
                    <span className="text-sm font-bold">&rsaquo;</span>
                  </button>
                  <button
                    onClick={() => {
                      if (tokenHistoryHasMore) loadMoreTokenHistory();
                      setTokenHistoryPage(totalPages - 1);
                    }}
                    disabled={!tokenHistoryHasMore && tokenHistoryPage >= totalPages - 1}
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-20',
                      isDark ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                    )}
                  >
                    <span className="text-sm font-bold">&raquo;</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* NFT Trades Section */}
      {historyView === 'tokens' && nftTrades.length > 0 &&
        (() => {
          const nftTotalPages = Math.ceil(nftTrades.length / ITEMS_PER_PAGE);
          const paginatedNftTrades = nftTrades.slice(
            nftTradesPage * ITEMS_PER_PAGE,
            (nftTradesPage + 1) * ITEMS_PER_PAGE
          );
          return (
            <div
              className={cn(
                'rounded-xl overflow-hidden transition-all duration-300 mt-6',
                isDark ? 'bg-black/40 backdrop-blur-sm border border-gray-500/20' : 'bg-white border border-gray-200'
              )}
            >
              <div
                className={cn(
                  'p-4 border-b border-gray-500/20 flex flex-wrap items-center justify-between gap-4'
                )}
              >
                <div className="flex items-center gap-2">
                  <Images size={14} className={isDark ? 'text-white/50' : 'text-gray-500'} />
                  <p className={cn('text-[11px] font-semibold uppercase tracking-[0.15em]', isDark ? 'text-white/50' : 'text-gray-500')}>NFT Trades</p>
                  <span className={cn('text-[9px] px-2 py-0.5 rounded font-semibold uppercase tracking-wide', isDark ? 'bg-white/5 text-white/50 border border-white/[0.15]' : 'bg-gray-100 text-gray-500')}>{nftTrades.length}</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={cn('text-[10px] font-bold uppercase tracking-widest border-b', isDark ? 'text-white/30 border-white/[0.04]' : 'text-gray-400 border-gray-50')}>
                      <th className="px-6 py-4 text-left">Type</th>
                      <th className="px-4 py-4 text-left">Price</th>
                      <th className="px-4 py-4 text-right">Time</th>
                      <th className="px-6 py-4 text-right w-[140px]">Hash</th>
                    </tr>
                  </thead>
                  <tbody className={cn('divide-y', isDark ? 'divide-white/[0.04]' : 'divide-gray-50')}>
                    {paginatedNftTrades.map((trade) => {
                      const isSeller = trade.seller === account;
                      const label = isSeller ? 'Sold NFT' : 'Bought NFT';
                      const amt = trade.costXRP ?? trade.cost ?? 0;
                      const currency = trade.currency || 'XRP';
                      const amtStr = amt >= 1 ? amt.toFixed(2) : amt >= 0.01 ? amt.toFixed(4) : String(amt);
                      return (
                        <tr key={trade._id} className={cn('group transition-all duration-200 hover:bg-white/[0.05]')}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3.5">
                              <span className={cn(
                                'px-2 py-1 rounded-lg text-[10px] font-bold',
                                isSeller ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
                              )}>
                                {isSeller ? 'Sold' : 'Bought'}
                              </span>
                              <div className="flex flex-col">
                                <span className={cn('text-[13px] font-bold tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>{label}</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-30">NFT Marketplace</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                'px-1.5 py-0.5 rounded-md text-[10px] font-bold',
                                isSeller ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500'
                              )}>
                                {isSeller ? '+' : '-'}
                              </span>
                              <span className={cn('text-[13px] font-bold tabular-nums', isDark ? 'text-white' : 'text-gray-900')}>{amtStr}</span>
                              <span className="text-[10px] font-bold opacity-40 uppercase">{currency}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className={cn('text-[12px] tabular-nums font-bold tracking-tight', isDark ? 'text-white/50' : 'text-gray-500')}>
                              {trade.time ? new Date(trade.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '\u2014'}
                            </span>
                            <span className={cn('block text-[9px] font-medium opacity-30 uppercase mt-0.5', isDark ? 'text-white' : 'text-gray-500')}>
                              {trade.time ? new Date(trade.time).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link href={`/tx/${trade.hash}`} target="_blank" className={cn('text-[11px] font-mono font-bold tracking-wider hover:text-blue-400 transition-colors', isDark ? 'text-white/20' : 'text-gray-400')}>
                                {trade.hash?.slice(0, 4)}...{trade.hash?.slice(-4)}
                              </Link>
                              <button onClick={() => navigator.clipboard.writeText(trade.hash)} className={cn('p-1.5 rounded-lg transition-all hover:scale-110', isDark ? 'text-white/20 hover:text-white/50 hover:bg-white/5' : 'text-gray-300 hover:text-gray-600 hover:bg-gray-100')}>
                                <Copy size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className={cn('px-6 py-4 flex items-center justify-between border-t', isDark ? 'border-white/[0.06]' : 'border-gray-100')}>
                <div className="flex items-center gap-3 opacity-40">
                  <span className={cn('text-[11px] font-bold uppercase tracking-wider', isDark ? 'text-white' : 'text-gray-500')}>Items per page</span>
                  <span className={cn('text-[12px] font-bold tabular-nums', isDark ? 'text-white' : 'text-gray-900')}>{ITEMS_PER_PAGE}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setNftTradesPage(0)} disabled={nftTradesPage === 0} className={cn('w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-20', isDark ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100')}>
                    <span className="text-sm font-bold">&laquo;</span>
                  </button>
                  <button onClick={() => setNftTradesPage((p) => Math.max(0, p - 1))} disabled={nftTradesPage === 0} className={cn('w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-20', isDark ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100')}>
                    <span className="text-sm font-bold">&lsaquo;</span>
                  </button>
                  <div className={cn('px-3 py-1 rounded-lg text-[11px] font-bold', isDark ? 'bg-white/5 text-white/70' : 'bg-gray-100 text-gray-700')}>
                    {nftTradesPage + 1} / {nftTotalPages}
                  </div>
                  <button onClick={() => setNftTradesPage((p) => Math.min(nftTotalPages - 1, p + 1))} disabled={nftTradesPage >= nftTotalPages - 1} className={cn('w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-20', isDark ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100')}>
                    <span className="text-sm font-bold">&rsaquo;</span>
                  </button>
                  <button onClick={() => setNftTradesPage(nftTotalPages - 1)} disabled={nftTradesPage >= nftTotalPages - 1} className={cn('w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-20', isDark ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100')}>
                    <span className="text-sm font-bold">&raquo;</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </>
  );
};

export default AccountHistory;
