import { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { Client } from 'xrpl';
import { AppContext } from 'src/context/AppContext';
import { cn } from 'src/utils/cn';
import { getNftCoverUrl, parseTransaction } from 'src/utils/parseUtils';
import Link from 'next/link';
import CryptoJS from 'crypto-js';
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
  History,
  Images,
  Image
} from 'lucide-react';

const BASE_URL = 'https://api.xrpl.to';

// NFT Image component with lazy loading and tooltip
const NftImage = ({ nftTokenId, className, fallback }) => {
  const { themeName } = useContext(AppContext);
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
    axios
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
            'rounded-2xl p-4 min-w-[220px] max-w-[300px] shadow-2xl border backdrop-blur-2xl transition-all duration-300',
            isDark ? 'bg-black/95 border-white/10 shadow-black' : 'bg-white/95 border-gray-200 shadow-xl'
          )}
        >
          <div className="flex gap-3">
            <img src={largeImageUrl} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className={cn('text-[13px] font-medium truncate', isDark ? 'text-white' : 'text-gray-900')}>
                {nftData.name || nftData.meta?.name || 'Unnamed'}
              </p>
              {nftData.collection && (
                <p className={cn('text-[11px] truncate', isDark ? 'text-white/50' : 'text-gray-500')}>
                  {nftData.collection}
                </p>
              )}
              {nftData.rarity_rank > 0 && (
                <p className="text-[10px] text-purple-400 mt-1">Rank #{nftData.rarity_rank}</p>
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
      ? CryptoJS.MD5(`${t.issuer}_${t.currency}`).toString()
      : null;

const TX_TYPES = ['all', 'Payment', 'OfferCreate', 'OfferCancel', 'TrustSet', 'AMMDeposit', 'AMMWithdraw', 'NFTokenMint', 'NFTokenAcceptOffer', 'NFTokenCreateOffer', 'NFTokenBurn', 'CheckCreate', 'CheckCash', 'EscrowCreate', 'EscrowFinish', 'AccountSet'];
const ITEMS_PER_PAGE = 10;

const AccountHistory = ({ account }) => {
  const { themeName } = useContext(AppContext);
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

  // Fetch onchain history via WebSocket
  const fetchTxHistory = async (marker = null) => {
    if (!account) return;
    setTxLoading(true);
    const client = new Client('wss://s1.ripple.com');
    try {
      await client.connect();
      const request = {
        command: 'account_tx',
        account,
        ledger_index_min: -1,
        ledger_index_max: -1,
        limit: 50
      };
      if (marker) request.marker = marker;
      const response = await client.request(request);
      const txs = response.result?.transactions || [];
      setTxHistory((prev) => (marker ? [...prev, ...txs] : txs));
      setTxMarker(response.result?.marker || null);
      setTxHasMore(!!response.result?.marker);
    } catch (err) {
      console.error('TX history fetch failed:', err);
    } finally {
      client.disconnect();
      setTxLoading(false);
    }
  };

  // Auto-fetch onchain when view is onchain
  useEffect(() => {
    if (historyView !== 'onchain' || !account) return;
    if (txHistory.length > 0) return;
    fetchTxHistory();
  }, [historyView, account, txHistory.length]);

  // Fetch NFT trades
  useEffect(() => {
    if (!account || nftTrades.length > 0) return;
    setNftTradesLoading(true);
    axios
      .get(`${BASE_URL}/v1/nft/analytics/trader/${account}/trades?offset=0&limit=50`)
      .then((res) => setNftTrades(res.data?.trades || []))
      .catch(() => setNftTrades([]))
      .finally(() => setNftTradesLoading(false));
  }, [account]);

  // Build token history URL with filters
  const buildTokenHistoryUrl = (cursor = null) => {
    let url = `${BASE_URL}/v1/history?account=${account}&limit=50`;
    if (tokenHistoryType && tokenHistoryType !== 'all') url += `&type=${tokenHistoryType}`;
    if (tokenHistoryPairType) url += `&pairType=${tokenHistoryPairType}`;
    if (cursor) url += `&cursor=${cursor}`;
    return url;
  };

  // Fetch token history when tokens view selected or filters change
  useEffect(() => {
    if (historyView !== 'tokens' || !account) return;
    setTokenHistoryLoading(true);
    axios
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
    axios
      .get(buildTokenHistoryUrl(tokenHistoryCursor))
      .then((res) => {
        setTokenHistory((prev) => [...prev, ...(res.data?.data || [])]);
        setTokenHistoryCursor(res.data?.meta?.nextCursor || null);
        setTokenHistoryHasMore(!!res.data?.meta?.nextCursor);
      })
      .catch((err) => console.error('Failed to fetch more token history:', err))
      .finally(() => setTokenHistoryLoading(false));
  };

  return (
    <>
      {/* History View Toggle */}
      <div className="flex justify-start mb-4">
        <div className={cn(
          'flex items-center gap-0.5 p-1 rounded-lg border',
          isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-gray-50 border-gray-200'
        )}>
          {[
            { id: 'onchain', label: 'Onchain', icon: Code2 },
            { id: 'tokens', label: 'Token Trades', icon: Coins }
          ].map((view) => (
            <button
              key={view.id}
              onClick={() => setHistoryView(view.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all',
                historyView === view.id
                  ? cn(isDark ? 'bg-white/10 text-white' : 'bg-white text-gray-900 shadow-sm')
                  : cn(isDark ? 'text-white/40 hover:text-white/70' : 'text-gray-500 hover:text-gray-700')
              )}
            >
              <view.icon size={12} />
              {view.label}
            </button>
          ))}
        </div>
      </div>

      {/* Onchain History - Table Layout */}
      {historyView === 'onchain' && (
        <div
          className={cn(
            'rounded-2xl border transition-all duration-300 overflow-hidden shadow-2xl backdrop-blur-3xl',
            isDark ? 'bg-[#0a0a0a]/40 border-white/10 shadow-black/20' : 'bg-white border-gray-200 shadow-sm'
          )}
        >
          {/* Header */}
          <div
            className={cn(
              'px-5 py-4 flex items-center justify-between border-b',
              isDark ? 'border-white/[0.06]' : 'border-gray-100'
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-xl', isDark ? 'bg-blue-500/10 text-blue-500' : 'bg-blue-500/5 text-blue-500')}>
                <Activity size={18} />
              </div>
              <div>
                <h3 className={cn('text-[14px] font-bold tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>Transaction History</h3>
                <p className={cn('text-[10px] font-medium opacity-50', isDark ? 'text-white' : 'text-gray-500')}>
                  Ledger Activities
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {['all', 'Payment', 'OfferCreate', 'TrustSet'].map(t => (
                <button
                  key={t}
                  onClick={() => setTxTypeFilter(t)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all',
                    txTypeFilter === t
                      ? (isDark ? 'bg-white/15 text-white' : 'bg-gray-200 text-gray-900')
                      : (isDark ? 'text-white/40 hover:text-white/70 hover:bg-white/5' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100')
                  )}
                >
                  {t === 'all' ? 'All' : t === 'OfferCreate' ? 'Trade' : t}
                </button>
              ))}
              <select
                value={['all', 'Payment', 'OfferCreate', 'TrustSet'].includes(txTypeFilter) ? '' : txTypeFilter}
                onChange={(e) => e.target.value && setTxTypeFilter(e.target.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-[10px] font-bold outline-none cursor-pointer transition-all',
                  !['all', 'Payment', 'OfferCreate', 'TrustSet'].includes(txTypeFilter)
                    ? (isDark ? 'bg-white/15 text-white' : 'bg-gray-200 text-gray-900')
                    : (isDark ? 'bg-transparent text-white/40 hover:text-white/70' : 'bg-transparent text-gray-400 hover:text-gray-600'),
                  isDark ? '[&>option]:bg-[#1a1a1a] [&>option]:text-white' : ''
                )}
              >
                <option value="" disabled>More &#9662;</option>
                {TX_TYPES.filter(t => !['all', 'Payment', 'OfferCreate', 'TrustSet'].includes(t)).map(t => (
                  <option key={t} value={t}>{t.replace('NFToken', 'NFT ').replace('AMM', 'AMM ')}</option>
                ))}
              </select>
            </div>
          </div>

          {txHistory.length === 0 ? (
            <div className={cn('p-12 text-center text-[13px]', isDark ? 'text-white/35' : 'text-gray-400')}>
              {txLoading ? 'Loading transactions...' : 'No transactions found'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={cn('text-[10px] font-black uppercase tracking-widest opacity-40', isDark ? 'text-white' : 'text-gray-500')}>
                    <th className="px-5 py-4 pl-6 text-left w-[40px]"></th>
                    <th className="px-5 py-4 text-left">Asset</th>
                    <th className="px-5 py-4 text-left">Type</th>
                    <th className="px-5 py-4 text-left">Tag</th>
                    <th className="px-5 py-4 text-left">Details</th>
                    <th className="px-5 py-4 text-right">Amount</th>
                    <th className="px-5 py-4 text-right">Date</th>
                    <th className="px-5 py-4 pr-6 text-right">Hash</th>
                  </tr>
                </thead>
                <tbody className={cn('divide-y', isDark ? 'divide-white/[0.04]' : 'divide-gray-50')}>
                  {txHistory.filter(tx => txTypeFilter === 'all' || (tx.tx_json || tx.tx || tx).TransactionType === txTypeFilter).map((tx) => {
                    const parsed = parseTx(tx);
                    return (
                      <tr
                        key={parsed.id}
                        className={cn('group transition-all duration-300 relative', isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50')}
                        onClick={() => window.open(`/tx/${parsed.hash}`, '_blank')}
                      >
                        <td className="px-5 py-4 pl-6 cursor-pointer">
                          <div className={cn('w-6 h-6 rounded-full flex items-center justify-center', parsed.type === 'failed' ? 'bg-amber-500/10' : parsed.type === 'in' ? 'bg-emerald-500/10' : 'bg-red-500/10')}>
                            {parsed.type === 'failed' ? <AlertTriangle size={12} className="text-amber-500" /> : parsed.type === 'in' ? <ArrowDownLeft size={12} className="text-emerald-500" /> : <ArrowUpRight size={12} className="text-red-500" />}
                          </div>
                        </td>
                        <td className="px-5 py-4 cursor-pointer">
                          {parsed.nftTokenId ? (
                            <NftImage
                              nftTokenId={parsed.nftTokenId}
                              className="w-8 h-8 rounded-lg object-cover bg-white/10 shadow-sm"
                              fallback={
                                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', isDark ? 'bg-purple-500/10' : 'bg-purple-100')}>
                                  <Image size={14} className="text-purple-400" />
                                </div>
                              }
                            />
                          ) : parsed.tokenCurrency ? (
                            <img
                              src={`https://s1.xrpl.to/token/${parsed.tokenCurrency === 'XRP' ? '84e5efeb89c4eae8f68188982dc290d8' : CryptoJS.MD5(`${parsed.tokenIssuer}_${parsed.tokenCurrency}`).toString()}`}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover bg-white/10 shadow-sm"
                              onError={(e) => { e.target.onerror = null; e.target.src = '/static/alt.webp'; }}
                            />
                          ) : (
                            <div className={cn('w-8 h-8 rounded-full', isDark ? 'bg-white/10' : 'bg-gray-100')} />
                          )}
                        </td>
                        <td className="px-5 py-4 cursor-pointer">
                          <span className={cn('text-[12px] font-bold', isDark ? 'text-white' : 'text-gray-900')}>{parsed.label}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1">
                            {parsed.type === 'failed' && <span className={cn('text-[9px] px-2 py-0.5 rounded-md font-bold uppercase', isDark ? 'bg-amber-500/15 text-[#F6AF01]' : 'bg-amber-100 text-amber-600')}>Failed</span>}
                            {parsed.isDust && <span className={cn('text-[9px] px-2 py-0.5 rounded-md font-bold uppercase', isDark ? 'bg-amber-500/10 text-[#F6AF01]' : 'bg-amber-100 text-amber-600')}>Dust</span>}
                            {parsed.sourceTag && <span className={cn('text-[9px] px-2 py-0.5 rounded-md font-bold', isDark ? 'bg-[#137DFE]/15 text-[#137DFE]' : 'bg-blue-100 text-blue-600')}>{parsed.sourceTagName || `${parsed.sourceTag}`}</span>}
                          </div>
                        </td>
                        <td className="px-5 py-4 cursor-pointer">
                          <span className={cn('text-[11px] font-mono opacity-80', isDark ? 'text-white/60' : 'text-gray-600')}>
                            {parsed.counterparty ? (parsed.counterparty.startsWith('r') ? <Link href={`/address/${parsed.counterparty}`} onClick={(e) => e.stopPropagation()} className="hover:text-primary hover:underline">{parsed.counterparty.slice(0, 8)}...{parsed.counterparty.slice(-6)}</Link> : parsed.counterparty) : parsed.fromAmount ? 'DEX Swap' : '\u2014'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right cursor-pointer">
                          <div className="flex items-center justify-end">
                            {parsed.fromAmount && parsed.toAmount ? (
                              <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded-lg', isDark ? 'bg-white/[0.04]' : 'bg-gray-50')}>
                                <span className="text-[11px] font-bold tabular-nums text-red-500">{parsed.fromAmount}</span>
                                <ArrowRight size={10} className="opacity-30" />
                                <span className="text-[11px] font-bold tabular-nums text-emerald-500">{parsed.toAmount}</span>
                              </div>
                            ) : parsed.amount ? (
                              parsed.amount.includes('\u2192') ? (
                                <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded-lg', parsed.type === 'failed' ? 'bg-amber-500/10' : isDark ? 'bg-white/[0.04]' : 'bg-gray-50')}>
                                  {parsed.amount.split('\u2192').map((part, i) => (
                                    <span key={i} className={cn('text-[11px] font-bold tabular-nums', i === 0 ? 'text-red-500' : 'text-emerald-500')}>
                                      {i > 0 && <span className={cn('text-[9px] mr-1.5 inline-block', isDark ? 'text-white/20' : 'text-gray-400')}>{'\u2192'}</span>}
                                      {part.trim()}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className={cn(
                                  'text-[12px] font-bold tabular-nums',
                                  parsed.type === 'failed' ? 'text-[#F6AF01]' :
                                    parsed.type === 'in' ? 'text-emerald-500' : 'text-red-500'
                                )}>
                                  {parsed.type !== 'failed' && (parsed.type === 'in' ? '+' : '-')}{parsed.amount}
                                </span>
                              )
                            ) : (
                              <span className="opacity-20">{'\u2014'}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right cursor-pointer">
                          <span className={cn('text-[11px] tabular-nums font-medium', isDark ? 'text-white/40' : 'text-gray-500')}>
                            {parsed.time ? new Date(parsed.time).toLocaleDateString() : '\u2014'}
                          </span>
                        </td>
                        <td className="px-5 py-4 pr-6 text-right">
                          <ExternalLink size={14} className={cn('opacity-0 group-hover:opacity-60 transition-opacity ml-auto', isDark ? 'text-white' : 'text-gray-600')} />
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
                'rounded-2xl border transition-all duration-300 overflow-hidden shadow-2xl backdrop-blur-3xl mt-6',
                isDark ? 'bg-[#0a0a0a]/40 border-white/10 shadow-black/20' : 'bg-white border-gray-200 shadow-sm'
              )}
            >
              {/* Header with filters */}
              <div
                className={cn(
                  'px-5 py-4 flex items-center justify-between border-b',
                  isDark ? 'border-white/[0.06]' : 'border-gray-100'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-xl', isDark ? 'bg-orange-500/10 text-orange-500' : 'bg-orange-500/5 text-orange-500')}>
                    <History size={18} />
                  </div>
                  <div>
                    <h3 className={cn('text-[14px] font-bold tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>Token Trade History</h3>
                    <p className={cn('text-[10px] font-medium opacity-50', isDark ? 'text-white' : 'text-gray-500')}>
                      DEX Activity
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex bg-black/5 dark:bg-white/5 rounded-lg p-0.5">
                    {['all', 'trades', 'liquidity'].map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          setTokenHistoryType(t);
                          setTokenHistoryPage(0);
                        }}
                        className={cn(
                          'px-3 py-1.5 text-[10px] font-bold rounded-md transition-all capitalize',
                          tokenHistoryType === t
                            ? isDark
                              ? 'bg-white text-black shadow-sm'
                              : 'bg-white text-black shadow-sm'
                            : isDark
                              ? 'text-white/40 hover:text-white/60'
                              : 'text-gray-500 hover:text-gray-700'
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
                    <tr className={cn('text-[10px] font-black uppercase tracking-widest opacity-40', isDark ? 'text-white' : 'text-gray-500')}>
                      <th className="px-5 py-4 text-left">Type</th>
                      <th className="px-5 py-4 text-left">Info</th>
                      <th className="px-5 py-4 text-left">Time</th>
                      <th className="px-5 py-4 text-right pr-6">Signature</th>
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
                              <div className="flex items-center gap-3">
                                <div
                                  className={cn(
                                    'w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md shadow-sm',
                                    isTokenToToken
                                      ? 'bg-blue-500/10 text-blue-500'
                                      : isBuy
                                        ? 'bg-emerald-500/10 text-emerald-500'
                                        : 'bg-red-500/10 text-red-500'
                                  )}
                                >
                                  {isTokenToToken ? (
                                    <ArrowLeftRight size={14} />
                                  ) : (
                                    <div className="flex items-center justify-center">
                                      {isBuy ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className={cn('text-[13px] font-bold', isDark ? 'text-white' : 'text-gray-900')}>
                                    {isTokenToToken ? 'Swap' : isBuy ? 'Buy' : 'Sell'}
                                  </p>
                                  <p className={cn('text-[10px] font-medium', isDark ? 'text-white/40' : 'text-gray-500')}>
                                    {isTokenToToken ? 'Token to Token' : isBuy ? 'XRP to Token' : 'Token to XRP'}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              {isTokenToToken || trade.paid || trade.got ? (
                                <div className="flex items-center gap-3 flex-wrap">
                                  {/* Paid amount */}
                                  <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded-lg', isDark ? 'bg-white/[0.04]' : 'bg-gray-100')}>
                                    <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-red-500/20 text-red-400 text-[10px] font-bold">
                                      -
                                    </span>
                                    {paidMd5 && (
                                      <img
                                        src={`https://s1.xrpl.to/token/${paidMd5}`}
                                        className="w-4 h-4 rounded-full"
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                        }}
                                        alt=""
                                      />
                                    )}
                                    <span
                                      className={cn(
                                        'text-[12px] tabular-nums',
                                        isDark ? 'text-white' : 'text-gray-900'
                                      )}
                                    >
                                      {fmtVal(trade.paid?.value)}
                                    </span>
                                    <span
                                      className={cn(
                                        'text-[11px]',
                                        isDark ? 'text-white/50' : 'text-gray-500'
                                      )}
                                    >
                                      {fmtCurrency(trade.paid?.currency)}
                                    </span>
                                  </div>
                                  {/* Plus sign */}
                                  <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                                    +
                                  </span>
                                  {/* Got amount */}
                                  <div className="flex items-center gap-1">
                                    {gotMd5 && (
                                      <img
                                        src={`https://s1.xrpl.to/token/${gotMd5}`}
                                        className="w-4 h-4 rounded-full"
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                        }}
                                        alt=""
                                      />
                                    )}
                                    <span
                                      className={cn(
                                        'text-[12px] tabular-nums',
                                        isDark ? 'text-white' : 'text-gray-900'
                                      )}
                                    >
                                      {fmtVal(trade.got?.value)}
                                    </span>
                                    <span
                                      className={cn(
                                        'text-[11px]',
                                        isDark ? 'text-white/50' : 'text-gray-500'
                                      )}
                                    >
                                      {fmtCurrency(trade.got?.currency)}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <span
                                  className={cn(
                                    'text-[12px] font-medium opacity-50',
                                    isDark ? 'text-white' : 'text-gray-900'
                                  )}
                                >
                                  See more details
                                </span>
                              )}
                            </td>
                            <td
                              className={cn(
                                'px-5 py-4 text-[12px]',
                                isDark ? 'text-white/50' : 'text-gray-500'
                              )}
                            >
                              {trade.time
                                ? (() => {
                                  const diff = Date.now() - trade.time;
                                  const mins = Math.floor(diff / 60000);
                                  const hrs = Math.floor(diff / 3600000);
                                  const days = Math.floor(diff / 86400000);
                                  if (mins < 1) return 'Just now';
                                  if (mins < 60) return `${mins} min ago`;
                                  if (hrs < 24) return `${hrs} hr ago`;
                                  if (days < 7) return `${days} day ago`;
                                  return new Date(trade.time).toLocaleDateString(
                                    'en-GB',
                                    { day: '2-digit', month: 'short', year: 'numeric' }
                                  );
                                })()
                                : '-'}
                            </td>
                            <td className="px-5 py-4 text-right pr-6">
                              <div className="flex items-center justify-end gap-2">
                                <Link
                                  href={`/tx/${trade.hash}`}
                                  target="_blank"
                                  className={cn(
                                    'text-[12px] font-mono hover:underline truncate max-w-[80px]',
                                    isDark
                                      ? 'text-white/40 hover:text-white/70'
                                      : 'text-gray-400 hover:text-gray-600'
                                  )}
                                >
                                  {trade.hash?.slice(0, 4)}...{trade.hash?.slice(-4)}
                                </Link>
                                <button
                                  onClick={() =>
                                    navigator.clipboard.writeText(trade.hash)
                                  }
                                  className={cn(
                                    'p-1.5 rounded-lg transition-colors bg-transparent hover:bg-white/10',
                                    isDark
                                      ? 'text-white/30 hover:text-white/60'
                                      : 'text-gray-400 hover:text-gray-600'
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
                  'px-4 py-3 flex items-center justify-between border-t',
                  isDark ? 'border-white/10' : 'border-gray-100'
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'text-[13px]',
                      isDark ? 'text-white/50' : 'text-gray-500'
                    )}
                  >
                    Transactions per page
                  </span>
                  <div
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded border',
                      isDark ? 'border-white/10' : 'border-gray-200'
                    )}
                  >
                    <span
                      className={cn(
                        'text-[13px] tabular-nums min-w-[20px] text-center',
                        isDark ? 'text-white' : 'text-gray-900'
                      )}
                    >
                      {ITEMS_PER_PAGE}
                    </span>
                    <div className="flex flex-col">
                      <ChevronUp
                        size={10}
                        className={cn(isDark ? 'text-white/40' : 'text-gray-400')}
                      />
                      <ChevronDown
                        size={10}
                        className={cn(isDark ? 'text-white/40' : 'text-gray-400')}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTokenHistoryPage(0)}
                    disabled={tokenHistoryPage === 0}
                    className={cn(
                      'text-[14px] px-1 transition-colors disabled:opacity-30',
                      isDark
                        ? 'text-white/50 hover:text-white disabled:hover:text-white/50'
                        : 'text-gray-400 hover:text-gray-600'
                    )}
                  >
                    &laquo;
                  </button>
                  <button
                    onClick={() => setTokenHistoryPage((p) => Math.max(0, p - 1))}
                    disabled={tokenHistoryPage === 0}
                    className={cn(
                      'text-[14px] px-1 transition-colors disabled:opacity-30',
                      isDark
                        ? 'text-white/50 hover:text-white disabled:hover:text-white/50'
                        : 'text-gray-400 hover:text-gray-600'
                    )}
                  >
                    &lsaquo;
                  </button>
                  <span
                    className={cn(
                      'text-[13px] px-2',
                      isDark ? 'text-white/70' : 'text-gray-600'
                    )}
                  >
                    Page {tokenHistoryPage + 1}
                  </span>
                  <button
                    onClick={() => {
                      setTokenHistoryPage((p) => p + 1);
                      if (
                        (tokenHistoryPage + 2) * ITEMS_PER_PAGE >=
                        tokenHistory.length &&
                        tokenHistoryHasMore
                      )
                        loadMoreTokenHistory();
                    }}
                    disabled={!tokenHistoryHasMore && tokenHistoryPage >= totalPages - 1}
                    className={cn(
                      'text-[14px] px-1 transition-colors disabled:opacity-30',
                      isDark
                        ? 'text-white/50 hover:text-white disabled:hover:text-white/50'
                        : 'text-gray-400 hover:text-gray-600'
                    )}
                  >
                    &rsaquo;
                  </button>
                  <button
                    onClick={() => {
                      if (tokenHistoryHasMore) loadMoreTokenHistory();
                      setTokenHistoryPage(totalPages - 1);
                    }}
                    disabled={!tokenHistoryHasMore && tokenHistoryPage >= totalPages - 1}
                    className={cn(
                      'text-[14px] px-1 transition-colors disabled:opacity-30',
                      isDark
                        ? 'text-white/50 hover:text-white disabled:hover:text-white/50'
                        : 'text-gray-400 hover:text-gray-600'
                    )}
                  >
                    &raquo;
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
                'rounded-2xl border transition-all duration-300 overflow-hidden shadow-2xl backdrop-blur-3xl mt-6',
                isDark ? 'bg-white/[0.02] border-white/10 shadow-black/20' : 'bg-white border-gray-200 shadow-sm'
              )}
            >
              <div
                className={cn(
                  'px-5 py-4 flex items-center justify-between border-b',
                  isDark ? 'border-white/[0.06]' : 'border-gray-100'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-xl', isDark ? 'bg-pink-500/10 text-pink-500' : 'bg-pink-500/5 text-pink-500')}>
                    <Images size={18} />
                  </div>
                  <div>
                    <h3 className={cn('text-[14px] font-bold tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>NFT Trade History</h3>
                    <p className={cn('text-[10px] font-medium opacity-50', isDark ? 'text-white' : 'text-gray-500')}>
                      Marketplace Activity
                    </p>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={cn('text-[10px] font-black uppercase tracking-widest opacity-40', isDark ? 'text-white' : 'text-gray-500')}>
                      <th className="px-5 py-4 text-left">Type</th>
                      <th className="px-5 py-4 text-left">Info</th>
                      <th className="px-5 py-4 text-left">Time</th>
                      <th className="px-5 py-4 text-right pr-6">Signature</th>
                    </tr>
                  </thead>
                  <tbody className={cn('divide-y', isDark ? 'divide-white/[0.06]' : 'divide-gray-100')}>
                    {paginatedNftTrades.map((trade) => {
                      const isSeller = trade.seller === account;
                      const label = isSeller ? 'Sold NFT' : 'Bought NFT';
                      const amt = trade.costXRP ?? trade.cost ?? 0;
                      const currency = trade.currency || 'XRP';
                      const amtStr = amt >= 1 ? amt.toFixed(2) : amt >= 0.01 ? amt.toFixed(4) : String(amt);
                      return (
                        <tr key={trade._id} className={cn('transition-colors', isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50')}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {isSeller ? <ArrowUpRight size={14} className="text-emerald-400" /> : <ArrowDownLeft size={14} className={isDark ? 'text-white/40' : 'text-gray-400'} />}
                              <span className={cn('text-[13px] font-medium', isDark ? 'text-white' : 'text-gray-900')}>{label}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {isSeller ? (
                                <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">+</span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-red-500/20 text-red-400 text-[10px] font-bold">-</span>
                              )}
                              <span className={cn('text-[12px] tabular-nums', isDark ? 'text-white' : 'text-gray-900')}>{amtStr} {currency}</span>
                            </div>
                          </td>
                          <td className={cn('px-4 py-3 text-[12px]', isDark ? 'text-white/50' : 'text-gray-500')}>
                            {trade.time ? (() => {
                              const diff = Date.now() - trade.time;
                              const mins = Math.floor(diff / 60000);
                              const hrs = Math.floor(diff / 3600000);
                              const days = Math.floor(diff / 86400000);
                              if (mins < 1) return 'Just now';
                              if (mins < 60) return `${mins} min ago`;
                              if (hrs < 24) return `${hrs} hr ago`;
                              if (days < 7) return `${days} day ago`;
                              return new Date(trade.time).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                            })() : '-'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Link href={`/tx/${trade.hash}`} target="_blank" className={cn('text-[12px] font-mono hover:underline', isDark ? 'text-white/50 hover:text-white/70' : 'text-gray-500 hover:text-gray-700')}>
                                {trade.hash?.slice(0, 4)}...{trade.hash?.slice(-4)}
                              </Link>
                              <button onClick={() => navigator.clipboard.writeText(trade.hash)} className={cn('p-1 rounded transition-colors', isDark ? 'text-white/30 hover:text-white/50' : 'text-gray-400 hover:text-gray-600')}>
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
              <div className={cn('px-4 py-3 flex items-center justify-between border-t', isDark ? 'border-white/10' : 'border-gray-100')}>
                <div className="flex items-center gap-3">
                  <span className={cn('text-[13px]', isDark ? 'text-white/50' : 'text-gray-500')}>Per page</span>
                  <span className={cn('text-[13px] tabular-nums', isDark ? 'text-white' : 'text-gray-900')}>{ITEMS_PER_PAGE}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setNftTradesPage(0)} disabled={nftTradesPage === 0} className={cn('text-[14px] px-1 transition-colors disabled:opacity-30', isDark ? 'text-white/50 hover:text-white' : 'text-gray-400 hover:text-gray-600')}>&laquo;</button>
                  <button onClick={() => setNftTradesPage((p) => Math.max(0, p - 1))} disabled={nftTradesPage === 0} className={cn('text-[14px] px-1 transition-colors disabled:opacity-30', isDark ? 'text-white/50 hover:text-white' : 'text-gray-400 hover:text-gray-600')}>&lsaquo;</button>
                  <span className={cn('text-[13px] px-2', isDark ? 'text-white/70' : 'text-gray-600')}>Page {nftTradesPage + 1}</span>
                  <button onClick={() => setNftTradesPage((p) => Math.min(nftTotalPages - 1, p + 1))} disabled={nftTradesPage >= nftTotalPages - 1} className={cn('text-[14px] px-1 transition-colors disabled:opacity-30', isDark ? 'text-white/50 hover:text-white' : 'text-gray-400 hover:text-gray-600')}>&rsaquo;</button>
                  <button onClick={() => setNftTradesPage(nftTotalPages - 1)} disabled={nftTradesPage >= nftTotalPages - 1} className={cn('text-[14px] px-1 transition-colors disabled:opacity-30', isDark ? 'text-white/50 hover:text-white' : 'text-gray-400 hover:text-gray-600')}>&raquo;</button>
                </div>
              </div>
            </div>
          );
        })()}
    </>
  );
};

export default AccountHistory;
