import { useState, useEffect, useContext, useMemo, useCallback } from 'react';
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
  ArrowRight,
  Code2,
  Coins,
  Activity,
  Images,
  Image
} from 'lucide-react';

const BASE_URL = 'https://api.xrpl.to';

// Module-level caches
const nftDataCache = new Map();
const decodedCurrencyCache = new Map();
const md5Cache = new Map();

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

    // Check module-level cache first
    const cached = nftDataCache.get(nftTokenId);
    if (cached) {
      setNftData(cached.nft);
      if (cached.imageUrl) setImageUrl(cached.imageUrl);
      else setError(true);
      setLoading(false);
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
        let resolvedUrl = null;
        if (coverUrl) {
          resolvedUrl = coverUrl;
        } else if (nft.meta?.image) {
          const metaImage = nft.meta.image;
          resolvedUrl = metaImage.startsWith('ipfs://')
            ? `https://ipfs.io/ipfs/${metaImage.replace('ipfs://', '')}`
            : metaImage;
        }
        nftDataCache.set(nftTokenId, { nft, imageUrl: resolvedUrl });
        if (resolvedUrl) {
          setImageUrl(resolvedUrl);
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
        onError={(e) => { e.target.onerror = null; e.target.src = ''; e.target.style.opacity = '0'; e.target.style.width = '0'; e.target.style.height = '0'; }}
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

// Helper: decode hex currency (cached)
const decodeCurrency = (code) => {
  if (!code || code === 'XRP') return 'XRP';
  const cached = decodedCurrencyCache.get(code);
  if (cached) return cached;
  let result = code;
  if (code.length === 3) {
    result = code;
  } else if (code.length === 40 && /^[0-9A-Fa-f]+$/.test(code)) {
    try {
      const hex = code.replace(/(00)+$/, '');
      let decoded = '';
      for (let i = 0; i < hex.length; i += 2) {
        const char = parseInt(hex.substr(i, 2), 16);
        if (char) decoded += String.fromCharCode(char);
      }
      result = decoded.match(/^[A-Za-z0-9]+$/) ? decoded : code.substring(0, 6);
    } catch {
      result = code.substring(0, 6);
    }
  }
  decodedCurrencyCache.set(code, result);
  return result;
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

// Helper: get token MD5 for image URL (cached)
const getTokenMd5 = (t) => {
  if (t?.currency === 'XRP') return '84e5efeb89c4eae8f68188982dc290d8';
  if (!t?.issuer) return null;
  const key = `${t.issuer}_${t.currency}`;
  const cached = md5Cache.get(key);
  if (cached) return cached;
  const hash = MD5(key).toString();
  md5Cache.set(key, hash);
  return hash;
};


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

const AccountHistory = ({ account, compact = false, onShowMore }) => {
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

  // Parse tx helper (memoized per account)
  const parseTx = useCallback(
    (tx) => parseTransaction(tx, account, decodeCurrency),
    [account]
  );

  // Fetch onchain history via API
  const fetchTxHistory = useCallback(async (marker = null, typeFilter = 'all') => {
    if (!account) return;
    setTxLoading(true);
    try {
      let url = `${BASE_URL}/v1/account/tx/${account}?limit=50`;
      if (typeFilter && typeFilter !== 'all') url += `&types=${typeFilter}`;
      if (marker) url += `&marker=${encodeURIComponent(JSON.stringify(marker))}`;
      const response = await api.get(url);
      const txs = response.data?.txs || [];
      setTxHistory((prev) => (marker ? [...prev, ...txs] : txs));
      setTxMarker(response.data?.marker || null);
      setTxHasMore(response.data?.hasMore || false);
    } catch (err) {
      console.error('TX history fetch failed:', err);
    } finally {
      setTxLoading(false);
    }
  }, [account]);

  // Fetch on initial load + NFT trades in parallel
  useEffect(() => {
    if (!account) return;

    const shouldFetchTx = (compact || historyView === 'onchain') && txHistory.length === 0;
    const shouldFetchNft = !compact && nftTrades.length === 0;

    if (shouldFetchTx) fetchTxHistory(null, txTypeFilter);
    if (shouldFetchNft) {
      setNftTradesLoading(true);
      api
        .get(`${BASE_URL}/v1/nft/analytics/trader/${account}/trades?offset=0&limit=50`)
        .then((res) => setNftTrades(res.data?.trades || []))
        .catch(() => setNftTrades([]))
        .finally(() => setNftTradesLoading(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, compact, historyView, nftTrades.length, fetchTxHistory]);

  // Re-fetch when type filter changes (server-side filtering)
  useEffect(() => {
    if (compact || historyView !== 'onchain' || !account) return;
    setTxHistory([]);
    fetchTxHistory(null, txTypeFilter);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txTypeFilter]);

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

  // Memoize parsed transactions (shared between compact and full mode)
  const parsedTxs = useMemo(
    () => {
      const source = compact ? txHistory.slice(0, COMPACT_LIMIT) : txHistory;
      return source.map(tx => ({ raw: tx, parsed: parseTx(tx) }));
    },
    [compact, txHistory, parseTx]
  );

  // Memoize inline MD5 for token images to avoid recomputing in JSX
  const getTokenImageUrl = useCallback((currency, issuer) => {
    if (!currency) return null;
    if (currency === 'XRP') return 'https://s1.xrpl.to/token/84e5efeb89c4eae8f68188982dc290d8';
    if (!issuer) return '/static/alt.webp';
    const key = `${issuer}_${currency}`;
    let hash = md5Cache.get(key);
    if (!hash) {
      hash = MD5(key).toString();
      md5Cache.set(key, hash);
    }
    return `https://s1.xrpl.to/token/${hash}`;
  }, []);

  // Shared onchain transaction table (used by both compact and full mode)
  const renderOnchainTable = (txList, showLoadMore = false) => {
    if (txLoading && txList.length === 0) {
      return (
        <div className={cn('p-10 sm:p-16 text-center', isDark ? 'text-white/20' : 'text-gray-300')}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-current flex items-center justify-center opacity-40">
              <Activity size={24} />
            </div>
            <p className="text-[13px] font-medium">Scanning ledger...</p>
          </div>
        </div>
      );
    }

    if (txList.length === 0) {
      return (
        <div className={cn('p-10 sm:p-16 text-center', isDark ? 'text-white/20' : 'text-gray-300')}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-current flex items-center justify-center opacity-40">
              <Activity size={24} />
            </div>
            <p className="text-[13px] font-medium">No ledger records found</p>
          </div>
        </div>
      );
    }

    return (
      <>
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={cn('text-[11px] font-bold uppercase tracking-widest border-b', isDark ? 'text-white/30 border-white/[0.04]' : 'text-gray-400 border-gray-50')}>
                <th className="w-[22%] px-5 py-4 text-left">Asset</th>
                <th className="w-[18%] px-4 py-4 text-left">Type</th>
                <th className="w-[20%] px-4 py-4 text-left">Info</th>
                <th className="w-[18%] px-4 py-4 text-right">Value</th>
                <th className="w-[14%] px-4 py-4 text-right">Time</th>
                <th className="w-[8%] px-4 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className={cn('divide-y', isDark ? 'divide-white/[0.04]' : 'divide-gray-50')}>
              {txList.map(({ parsed }) => (
                <tr
                  key={parsed.id}
                  className={cn('group transition-all duration-200 relative cursor-pointer', isDark ? 'hover:bg-white/[0.05]' : 'hover:bg-gray-50')}
                  onClick={() => window.open(`/tx/${parsed.hash}`, '_blank')}
                >
                  <td className="px-5 py-3.5">
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
                          src={getTokenImageUrl(parsed.tokenCurrency, parsed.tokenIssuer)}
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
                  <td className="px-4 py-3.5 text-right">
                    <div aria-label="View transaction" className={cn('p-2 rounded-lg ml-auto w-fit transition-colors group-hover:bg-white/5', isDark ? 'text-white/20 group-hover:text-blue-400' : 'text-gray-300 group-hover:text-blue-500')}>
                      <ExternalLink size={14} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile list */}
        <div className={cn('md:hidden divide-y', isDark ? 'divide-white/[0.04]' : 'divide-gray-50')}>
          {txList.map(({ parsed }) => (
            <div
              key={parsed.id}
              className={cn('flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors', isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50')}
              onClick={() => window.open(`/tx/${parsed.hash}`, '_blank')}
            >
              <span className={cn(
                'w-7 text-center py-0.5 rounded text-[9px] font-bold flex-shrink-0',
                parsed.type === 'failed' ? 'bg-amber-500/10 text-amber-500' :
                  parsed.type === 'in' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
              )}>
                {parsed.type === 'failed' ? 'Fail' : parsed.type === 'in' ? 'In' : 'Out'}
              </span>
              <div className="flex-shrink-0">
                {parsed.nftTokenId ? (
                  <NftImage
                    nftTokenId={parsed.nftTokenId}
                    className="w-6 h-6 rounded object-cover bg-white/5"
                    fallback={<div className={cn('w-6 h-6 rounded flex items-center justify-center', isDark ? 'bg-purple-500/10' : 'bg-purple-50')}><Image size={10} className="text-purple-400" /></div>}
                  />
                ) : parsed.tokenCurrency ? (
                  <img
                    src={getTokenImageUrl(parsed.tokenCurrency, parsed.tokenIssuer)}
                    alt=""
                    className="w-6 h-6 rounded-full object-cover bg-white/5"
                    onError={(e) => { e.target.onerror = null; e.target.src = '/static/alt.webp'; }}
                  />
                ) : (
                  <div className={cn('w-6 h-6 rounded-full', isDark ? 'bg-white/5' : 'bg-gray-100')} />
                )}
              </div>
              <span className="flex-1 min-w-0 truncate">
                <span className={cn('text-[12px] font-bold', isDark ? 'text-white' : 'text-gray-900')}>{parsed.label}</span>
                <span className={cn('text-[9px] ml-1', isDark ? 'text-white/30' : 'text-gray-400')}>{parsed.tokenCurrency ? decodeCurrency(parsed.tokenCurrency) : (parsed.nftTokenId ? 'NFT' : 'XRP')}</span>
              </span>
              <span className="flex-shrink-0 text-right">
                {parsed.fromAmount && parsed.toAmount ? (
                  <span className="text-[10px] font-bold tabular-nums">
                    <span className="text-red-500">{parsed.fromAmount.split(' ')[0]}</span>
                    <ArrowRight size={8} className={cn('inline mx-0.5', isDark ? 'text-white/20' : 'text-gray-300')} />
                    <span className="text-emerald-500">{parsed.toAmount.split(' ')[0]}</span>
                    <span className={cn('text-[9px] ml-0.5', isDark ? 'text-white/30' : 'text-gray-400')}>{parsed.toAmount.split(' ')[1] || 'XRP'}</span>
                  </span>
                ) : parsed.amount ? (
                  <span className={cn('text-[10px] font-bold tabular-nums', parsed.type === 'failed' ? 'text-amber-500' : parsed.type === 'in' ? 'text-emerald-500' : 'text-red-500')}>
                    {parsed.type !== 'failed' && (parsed.type === 'in' ? '+' : '-')}{parsed.amount.replace(' XRP', '').replace(' NFT', '')}
                    <span className={cn('text-[9px] ml-0.5', isDark ? 'text-white/30' : 'text-gray-400')}>{parsed.tokenCurrency ? decodeCurrency(parsed.tokenCurrency) : 'XRP'}</span>
                  </span>
                ) : (
                  <span className={cn('text-[10px]', isDark ? 'text-white/20' : 'text-gray-300')}>{'\u2014'}</span>
                )}
              </span>
              <span className={cn('text-[9px] tabular-nums flex-shrink-0 w-10 text-right', isDark ? 'text-white/30' : 'text-gray-400')}>{timeAgo(parsed.time)}</span>
            </div>
          ))}
        </div>

        {showLoadMore && txHasMore && (
          <button
            onClick={() => fetchTxHistory(txMarker, txTypeFilter)}
            disabled={txLoading}
            className={cn(
              'w-full text-center py-3 sm:py-4 text-[11px] sm:text-[12px] font-bold uppercase tracking-widest border-t outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE] transition-all duration-200',
              isDark
                ? 'border-white/[0.08] text-white/40 hover:text-white/70 hover:bg-white/[0.02]'
                : 'border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            )}
          >
            {txLoading ? 'Loading...' : 'Load more'}
          </button>
        )}
      </>
    );
  };

  // Compact mode: same table design, just fewer rows and no filters
  if (compact) {
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
            <p className={cn('text-xs font-semibold uppercase tracking-[0.15em]', isDark ? 'text-white/50' : 'text-gray-500')}>Recent Activity</p>
          </div>
          {onShowMore && (
            <button
              onClick={onShowMore}
              className={cn('text-xs font-semibold uppercase tracking-wide', isDark ? 'text-[#137DFE] hover:text-blue-400' : 'text-[#137DFE] hover:text-blue-600')}
            >
              View All
            </button>
          )}
        </div>
        {renderOnchainTable(parsedTxs)}
        {onShowMore && parsedTxs.length >= COMPACT_LIMIT && (
          <button
            onClick={onShowMore}
            className={cn(
              'w-full text-center py-3 text-[11px] font-bold uppercase tracking-widest border-t transition-all duration-200',
              isDark
                ? 'border-white/[0.08] text-white/40 hover:text-white/70 hover:bg-white/[0.02]'
                : 'border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            )}
          >
            Show More
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      {/* History View Toggle */}
      <div className="flex justify-start mb-4 sm:mb-5">
        <nav role="tablist" aria-label="History views" className={cn(
          'flex items-center gap-1 p-1 rounded-xl border',
          isDark ? 'bg-white/[0.03] border-white/10' : 'bg-gray-100/50 border-gray-200'
        )}>
          {[
            { id: 'onchain', label: 'Onchain', icon: Code2 },
            { id: 'tokens', label: 'Trades', icon: Coins }
          ].map((view) => (
            <button
              key={view.id}
              role="tab"
              aria-selected={historyView === view.id}
              aria-controls={`tabpanel-${view.id}`}
              onClick={() => setHistoryView(view.id)}
              className={cn(
                'flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE] transition-all duration-200',
                historyView === view.id
                  ? cn(isDark ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]' : 'bg-white text-gray-900 shadow-sm')
                  : cn(isDark ? 'text-white/40 hover:text-white/70 hover:bg-white/[0.02]' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50')
              )}
            >
              <view.icon size={13} className={cn('transition-transform duration-200', historyView === view.id ? 'scale-110' : 'opacity-50')} />
              <span>{view.label}</span>
            </button>
          ))}
        </nav>
      </div>,

      {/* Onchain History - Table Layout */}
      {historyView === 'onchain' && (
        <section role="tabpanel" id="tabpanel-onchain" aria-label="Onchain transactions"><div
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
              <p className={cn('text-xs font-semibold uppercase tracking-[0.15em]', isDark ? 'text-white/50' : 'text-gray-500')}>Transactions</p>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
              {['all', 'Payment', 'OfferCreate', 'TrustSet'].map(t => (
                <button
                  key={t}
                  onClick={() => setTxTypeFilter(t)}
                  className={cn(
                    'px-2.5 sm:px-3.5 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE] transition-all duration-200',
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
                  'px-3 py-1.5 rounded-lg text-[10px] font-bold outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE] cursor-pointer transition-all appearance-none',
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

          {renderOnchainTable(parsedTxs, true)}
        </div>
      </section>)}

      {/* Token History */}
      {historyView === 'tokens' &&
        (() => {
          const totalPages = Math.ceil(tokenHistory.length / ITEMS_PER_PAGE);
          const paginatedHistory = tokenHistory.slice(
            tokenHistoryPage * ITEMS_PER_PAGE,
            (tokenHistoryPage + 1) * ITEMS_PER_PAGE
          );

          return (
            <section role="tabpanel" id="tabpanel-tokens" aria-label="Token trades"><div
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
                  <p className={cn('text-xs font-semibold uppercase tracking-[0.15em]', isDark ? 'text-white/50' : 'text-gray-500')}>Token Trades</p>
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
                          'px-4 py-1.5 text-[11px] font-bold rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE] transition-all duration-200 capitalize',
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
              {tokenHistoryLoading && tokenHistory.length === 0 ? (
                <div className={cn('px-4 py-8 text-center text-[13px]', isDark ? 'text-white/35' : 'text-gray-400')}>Loading...</div>
              ) : paginatedHistory.length === 0 ? (
                <div className={cn('px-4 py-12 text-center text-[13px]', isDark ? 'text-white/35' : 'text-gray-400')}>No transactions found</div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={cn('text-[11px] font-bold uppercase tracking-widest border-b', isDark ? 'text-white/30 border-white/[0.04]' : 'text-gray-400 border-gray-50')}>
                          <th className="w-[25%] px-5 py-4 text-left">Type</th>
                          <th className="w-[40%] px-4 py-4 text-left">Assets Involved</th>
                          <th className="w-[18%] px-4 py-4 text-right">Time</th>
                          <th className="w-[17%] px-5 py-4 text-right">Hash</th>
                        </tr>
                      </thead>
                      <tbody className={cn('divide-y', isDark ? 'divide-white/[0.04]' : 'divide-gray-50')}>
                        {paginatedHistory.map((trade) => {
                          const paidIsXRP = trade.paid?.currency === 'XRP';
                          const gotIsXRP = trade.got?.currency === 'XRP';
                          const isTokenToToken = !paidIsXRP && !gotIsXRP;
                          const isBuy = paidIsXRP;
                          const paidMd5 = getTokenMd5(trade.paid);
                          const gotMd5 = getTokenMd5(trade.got);

                          return (
                            <tr
                              key={trade._id}
                              className={cn('group transition-all duration-200 relative overflow-hidden', isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50')}
                            >
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3.5">
                                  <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shadow-sm', isTokenToToken ? 'bg-blue-500/10 text-blue-400' : isBuy ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400')}>
                                    <span className="text-[10px] font-bold">{isTokenToToken ? 'Swap' : isBuy ? 'Buy' : 'Sell'}</span>
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
                                      {paidMd5 && <img src={`https://s1.xrpl.to/token/${paidMd5}`} className="w-4 h-4 rounded-full" onError={(e) => { e.target.style.display = 'none'; }} alt="" />}
                                      <span className={cn('text-[12px] font-bold tabular-nums', isDark ? 'text-white/90' : 'text-gray-900')}>{fmtVal(trade.paid?.value)}</span>
                                      <span className="text-[10px] font-bold opacity-40">{fmtCurrency(trade.paid?.currency)}</span>
                                    </div>
                                    <span className="mx-1 text-[10px] opacity-20">to</span>
                                    <div className="flex items-center gap-1.5">
                                      {gotMd5 && <img src={`https://s1.xrpl.to/token/${gotMd5}`} className="w-4 h-4 rounded-full" onError={(e) => { e.target.style.display = 'none'; }} alt="" />}
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
                              <td className="px-5 py-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Link href={`/tx/${trade.hash}`} target="_blank" className={cn('text-[11px] font-mono font-bold tracking-wider hover:text-blue-400 transition-colors', isDark ? 'text-white/20' : 'text-gray-400')}>
                                    {trade.hash?.slice(0, 4)}...{trade.hash?.slice(-4)}
                                  </Link>
                                  <button onClick={() => navigator.clipboard.writeText(trade.hash)} aria-label="Copy transaction hash" className={cn('p-1.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE] transition-all hover:scale-110', isDark ? 'text-white/20 hover:text-white/50 hover:bg-white/5' : 'text-gray-300 hover:text-gray-600 hover:bg-gray-100')}>
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

                  {/* Mobile list */}
                  <div className={cn('md:hidden divide-y', isDark ? 'divide-white/[0.04]' : 'divide-gray-50')}>
                    {paginatedHistory.map((trade) => {
                      const paidIsXRP = trade.paid?.currency === 'XRP';
                      const gotIsXRP = trade.got?.currency === 'XRP';
                      const isTokenToToken = !paidIsXRP && !gotIsXRP;
                      const isBuy = paidIsXRP;

                      return (
                        <div
                          key={trade._id}
                          className={cn('flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors', isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50')}
                          onClick={() => window.open(`/tx/${trade.hash}`, '_blank')}
                        >
                          <span className={cn('w-8 text-center py-0.5 rounded text-[9px] font-bold flex-shrink-0', isTokenToToken ? 'bg-blue-500/10 text-blue-400' : isBuy ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400')}>
                            {isTokenToToken ? 'Swap' : isBuy ? 'Buy' : 'Sell'}
                          </span>
                          <span className="flex-1 min-w-0 text-[10px] font-bold tabular-nums truncate">
                            <span className={cn(isDark ? 'text-white/80' : 'text-gray-900')}>{fmtVal(trade.paid?.value)}</span>
                            <span className="opacity-40 mx-0.5">{fmtCurrency(trade.paid?.currency)}</span>
                            <ArrowRight size={8} className={cn('inline mx-0.5', isDark ? 'text-white/20' : 'text-gray-300')} />
                            <span className={cn(isBuy ? 'text-emerald-500' : isDark ? 'text-white/80' : 'text-gray-900')}>{fmtVal(trade.got?.value)}</span>
                            <span className="opacity-40 ml-0.5">{fmtCurrency(trade.got?.currency)}</span>
                          </span>
                          <span className={cn('text-[9px] tabular-nums flex-shrink-0 w-10 text-right', isDark ? 'text-white/30' : 'text-gray-400')}>{timeAgo(trade.time)}</span>
                          <Link
                            href={`/tx/${trade.hash}`}
                            target="_blank"
                            onClick={(e) => e.stopPropagation()}
                            className={cn('text-[9px] font-mono flex-shrink-0 w-12 text-right', isDark ? 'text-white/20 hover:text-blue-400' : 'text-gray-400 hover:text-blue-500')}
                          >
                            {trade.hash?.slice(0, 3)}..{trade.hash?.slice(-3)}
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Pagination */}
              <div
                className={cn(
                  'px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3 border-t',
                  isDark ? 'border-white/[0.06]' : 'border-gray-100'
                )}
              >
                <div className="hidden sm:flex items-center gap-3 opacity-40">
                  <span className={cn('text-xs font-bold uppercase tracking-wider', isDark ? 'text-white' : 'text-gray-500')}>Items per page</span>
                  <span className={cn('text-[12px] font-bold tabular-nums', isDark ? 'text-white' : 'text-gray-900')}>{ITEMS_PER_PAGE}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    aria-label="First page"
                    onClick={() => setTokenHistoryPage(0)}
                    disabled={tokenHistoryPage === 0}
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE] transition-all disabled:opacity-20',
                      isDark ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                    )}
                  >
                    <span className="text-sm font-bold">&laquo;</span>
                  </button>
                  <button
                    aria-label="Previous page"
                    onClick={() => setTokenHistoryPage((p) => Math.max(0, p - 1))}
                    disabled={tokenHistoryPage === 0}
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE] transition-all disabled:opacity-20',
                      isDark ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                    )}
                  >
                    <span className="text-sm font-bold">&lsaquo;</span>
                  </button>
                  <div role="status" aria-live="polite" className={cn('px-3 py-1 rounded-lg text-[11px] font-bold', isDark ? 'bg-white/5 text-white/70' : 'bg-gray-100 text-gray-700')}>
                    {tokenHistoryPage + 1} / {tokenHistoryHasMore ? '...' : totalPages}
                  </div>
                  <button
                    aria-label="Next page"
                    onClick={() => {
                      setTokenHistoryPage((p) => p + 1);
                      if ((tokenHistoryPage + 2) * ITEMS_PER_PAGE >= tokenHistory.length && tokenHistoryHasMore) loadMoreTokenHistory();
                    }}
                    disabled={!tokenHistoryHasMore && tokenHistoryPage >= totalPages - 1}
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE] transition-all disabled:opacity-20',
                      isDark ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                    )}
                  >
                    <span className="text-sm font-bold">&rsaquo;</span>
                  </button>
                  <button
                    aria-label="Last page"
                    onClick={() => {
                      if (tokenHistoryHasMore) loadMoreTokenHistory();
                      setTokenHistoryPage(totalPages - 1);
                    }}
                    disabled={!tokenHistoryHasMore && tokenHistoryPage >= totalPages - 1}
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE] transition-all disabled:opacity-20',
                      isDark ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                    )}
                  >
                    <span className="text-sm font-bold">&raquo;</span>
                  </button>
                </div>
              </div>
            </div>
          </section>);
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
                  <p className={cn('text-xs font-semibold uppercase tracking-[0.15em]', isDark ? 'text-white/50' : 'text-gray-500')}>NFT Trades</p>
                  <span className={cn('text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wide', isDark ? 'bg-white/5 text-white/50 border border-white/[0.15]' : 'bg-gray-100 text-gray-500')}>{nftTrades.length}</span>
                </div>
              </div>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={cn('text-[11px] font-bold uppercase tracking-widest border-b', isDark ? 'text-white/30 border-white/[0.04]' : 'text-gray-400 border-gray-50')}>
                      <th className="w-[30%] px-5 py-4 text-left">Type</th>
                      <th className="w-[30%] px-4 py-4 text-left">Price</th>
                      <th className="w-[22%] px-4 py-4 text-right">Time</th>
                      <th className="w-[18%] px-5 py-4 text-right">Hash</th>
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
                        <tr key={trade._id} className={cn('group transition-all duration-200', isDark ? 'hover:bg-white/[0.05]' : 'hover:bg-gray-50')}>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3.5">
                              <span className={cn('px-2 py-1 rounded-lg text-[10px] font-bold', isSeller ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400')}>
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
                              <span className={cn('px-1.5 py-0.5 rounded-md text-[10px] font-bold', isSeller ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500')}>
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
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link href={`/tx/${trade.hash}`} target="_blank" className={cn('text-[11px] font-mono font-bold tracking-wider hover:text-blue-400 transition-colors', isDark ? 'text-white/20' : 'text-gray-400')}>
                                {trade.hash?.slice(0, 4)}...{trade.hash?.slice(-4)}
                              </Link>
                              <button onClick={() => navigator.clipboard.writeText(trade.hash)} aria-label="Copy transaction hash" className={cn('p-1.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE] transition-all hover:scale-110', isDark ? 'text-white/20 hover:text-white/50 hover:bg-white/5' : 'text-gray-300 hover:text-gray-600 hover:bg-gray-100')}>
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

              {/* Mobile list */}
              <div className={cn('md:hidden divide-y', isDark ? 'divide-white/[0.04]' : 'divide-gray-50')}>
                {paginatedNftTrades.map((trade) => {
                  const isSeller = trade.seller === account;
                  const amt = trade.costXRP ?? trade.cost ?? 0;
                  const currency = trade.currency || 'XRP';
                  const amtStr = amt >= 1 ? amt.toFixed(2) : amt >= 0.01 ? amt.toFixed(4) : String(amt);
                  return (
                    <div
                      key={trade._id}
                      className={cn('flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors', isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50')}
                      onClick={() => window.open(`/tx/${trade.hash}`, '_blank')}
                    >
                      <span className={cn('w-8 text-center py-0.5 rounded text-[9px] font-bold flex-shrink-0', isSeller ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400')}>
                        {isSeller ? 'Sold' : 'Buy'}
                      </span>
                      <span className={cn('flex-1 min-w-0 text-[11px] font-bold truncate', isDark ? 'text-white' : 'text-gray-900')}>
                        NFT
                      </span>
                      <span className="flex-shrink-0 text-right">
                        <span className={cn('text-[10px] font-bold tabular-nums', isSeller ? 'text-emerald-500' : 'text-red-500')}>
                          {isSeller ? '+' : '-'}{amtStr}
                        </span>
                        <span className={cn('text-[9px] ml-0.5 opacity-40 uppercase')}>{currency}</span>
                      </span>
                      <span className={cn('text-[9px] tabular-nums flex-shrink-0 w-10 text-right', isDark ? 'text-white/30' : 'text-gray-400')}>{timeAgo(trade.time)}</span>
                    </div>
                  );
                })}
              </div>
              <div className={cn('px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-t', isDark ? 'border-white/[0.06]' : 'border-gray-100')}>
                <div className="hidden sm:flex items-center gap-3 opacity-40">
                  <span className={cn('text-xs font-bold uppercase tracking-wider', isDark ? 'text-white' : 'text-gray-500')}>Items per page</span>
                  <span className={cn('text-[12px] font-bold tabular-nums', isDark ? 'text-white' : 'text-gray-900')}>{ITEMS_PER_PAGE}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button aria-label="First page" onClick={() => setNftTradesPage(0)} disabled={nftTradesPage === 0} className={cn('w-8 h-8 rounded-lg flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE] transition-all disabled:opacity-20', isDark ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100')}>
                    <span className="text-sm font-bold">&laquo;</span>
                  </button>
                  <button aria-label="Previous page" onClick={() => setNftTradesPage((p) => Math.max(0, p - 1))} disabled={nftTradesPage === 0} className={cn('w-8 h-8 rounded-lg flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE] transition-all disabled:opacity-20', isDark ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100')}>
                    <span className="text-sm font-bold">&lsaquo;</span>
                  </button>
                  <div role="status" aria-live="polite" className={cn('px-3 py-1 rounded-lg text-[11px] font-bold', isDark ? 'bg-white/5 text-white/70' : 'bg-gray-100 text-gray-700')}>
                    {nftTradesPage + 1} / {nftTotalPages}
                  </div>
                  <button aria-label="Next page" onClick={() => setNftTradesPage((p) => Math.min(nftTotalPages - 1, p + 1))} disabled={nftTradesPage >= nftTotalPages - 1} className={cn('w-8 h-8 rounded-lg flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE] transition-all disabled:opacity-20', isDark ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100')}>
                    <span className="text-sm font-bold">&rsaquo;</span>
                  </button>
                  <button aria-label="Last page" onClick={() => setNftTradesPage(nftTotalPages - 1)} disabled={nftTradesPage >= nftTotalPages - 1} className={cn('w-8 h-8 rounded-lg flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE] transition-all disabled:opacity-20', isDark ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100')}>
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
