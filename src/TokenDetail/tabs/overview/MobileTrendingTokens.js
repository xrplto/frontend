import { useContext, useState, useEffect } from 'react';
import { ThemeContext, WalletContext, AppContext } from 'src/context/AppContext';
import { cn } from 'src/utils/cn';
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';
import api from 'src/utils/api';
import { Bookmark, Flame } from 'lucide-react';

const SYMBOLS = { USD: '$', EUR: '€', JPY: '¥', CNH: '¥', XRP: '✕' };
const BASE_URL = 'https://api.xrpl.to/v1';

const formatPrice = (price, currency, rate) => {
  if (!price) return `${SYMBOLS[currency]}0`;
  const p = currency === 'XRP' ? price : price / rate;
  const s = SYMBOLS[currency];
  if (p < 0.0001) {
    const zeros = -Math.floor(Math.log10(p)) - 1;
    const sig = Math.round(p * Math.pow(10, zeros + 4));
    return <>{s}0.0<sub>{zeros}</sub>{sig}</>;
  }
  if (p < 1) return `${s}${p.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')}`;
  if (p >= 1e6) return `${s}${(p / 1e6).toFixed(1)}M`;
  if (p >= 1e3) return `${s}${(p / 1e3).toFixed(1)}K`;
  return `${s}${p < 100 ? p.toFixed(2) : Math.round(p)}`;
};

const MobileTrendingTokens = ({ token = null }) => {
  const { darkMode: isDark } = useContext(ThemeContext);
  const { accountProfile, setOpenWalletModal } = useContext(WalletContext);
  const { activeFiatCurrency } = useContext(AppContext);
  const metrics = useSelector(selectMetrics);
  const rate = metrics[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics.CNY : 1) || 1;

  const [tokens, setTokens] = useState([]);
  const [newTokens, setNewTokens] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [watchList, setWatchList] = useState([]);
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('discover_activeTab') || 'trending';
    }
    return 'trending';
  });

  useEffect(() => {
    localStorage.setItem('discover_activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (!accountProfile?.account) { setWatchList([]); return; }
    api.get(`${BASE_URL}/watchlist?account=${accountProfile.account}`)
      .then((res) => res.data.success && setWatchList(res.data.watchlist || []))
      .catch(err => { console.warn('[MobileTrendingTokens] Watchlist fetch failed:', err.message); });
  }, [accountProfile]);

  const toggleWatch = async (e, md5) => {
    e.preventDefault();
    e.stopPropagation();
    if (!accountProfile?.account) { setOpenWalletModal(true); return; }
    const action = watchList.includes(md5) ? 'remove' : 'add';
    try {
      const res = await api.post(`${BASE_URL}/watchlist`, { md5, account: accountProfile.account, action });
      if (res.data.success) setWatchList(res.data.watchlist || []);
    } catch (err) { console.warn('[MobileTrendingTokens] Watchlist toggle failed:', err.message); }
  };

  useEffect(() => {
    const ctrl = new AbortController();
    api.get(`${BASE_URL}/tokens?start=0&limit=50&sortBy=trendingScore&sortType=desc&skipMetrics=true`, { signal: ctrl.signal })
      .then((res) => {
        const list = res.data?.tokens || [];
        setTokens(token?.md5 ? list.filter((t) => t.md5 !== token.md5) : list);
        setLoading(false);
      })
      .catch((err) => { !api.isCancel(err) && setError('Failed to load'); setLoading(false); });
    return () => ctrl.abort();
  }, [token?.md5]);

  useEffect(() => {
    if (activeTab !== 'new' || newTokens.length > 0) return;
    const ctrl = new AbortController();
    api.get(`${BASE_URL}/tokens?start=0&limit=50&sortBy=dateon&sortType=desc&skipMetrics=true`, { signal: ctrl.signal })
      .then((res) => {
        const list = res.data?.tokens || [];
        setNewTokens(token?.md5 ? list.filter((t) => t.md5 !== token.md5) : list);
      })
      .catch((err) => { if (!api.isCancel(err)) console.warn('[MobileTrendingTokens] New tokens fetch failed:', err.message); });
    return () => ctrl.abort();
  }, [activeTab, token?.md5]);

  if (error) {
    return <div className="p-4 text-[#f44336] text-xs">Failed to load trending tokens</div>;
  }

  if (loading) {
    return (
      <div className={cn('flex flex-col overflow-hidden rounded-xl border-[1.5px]', 'border-black/[0.06] bg-black/[0.01] dark:border-white/[0.08] dark:bg-white/[0.02]')}>
        <div className="p-2">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center gap-2.5 py-[5px] px-1">
              <div className={cn('w-7 h-7 rounded-full flex-shrink-0', 'bg-black/[0.06] dark:bg-white/[0.06]')} />
              <div className="flex flex-col gap-1 flex-[2] min-w-0">
                <div className={cn('h-3 rounded w-[60%]', 'bg-black/[0.06] dark:bg-white/[0.06]')} />
                <div className={cn('h-2 rounded w-[40%]', 'bg-black/[0.04] dark:bg-white/[0.04]')} />
              </div>
              <div className={cn('h-3 rounded flex-[1]', 'bg-black/[0.06] dark:bg-white/[0.06]')} />
              <div className={cn('h-3 rounded flex-[0.7]', 'bg-black/[0.06] dark:bg-white/[0.06]')} />
              <div className={cn('h-3 rounded flex-[0.7]', 'bg-black/[0.06] dark:bg-white/[0.06]')} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const baseList = activeTab === 'trending' ? tokens : newTokens;
  const otherList = activeTab === 'trending' ? newTokens : tokens;
  const watchedFromOther = otherList.filter(t => watchList.includes(t.md5) && !baseList.some(b => b.md5 === t.md5));
  const sorted = [...watchedFromOther, ...baseList].sort((a, b) => (watchList.includes(b.md5) ? 1 : 0) - (watchList.includes(a.md5) ? 1 : 0));
  const displayList = sorted.slice(0, 10);

  return (
    <div className={cn('flex flex-col overflow-hidden rounded-xl border-[1.5px]', 'border-black/[0.06] bg-black/[0.01] dark:border-white/[0.08] dark:bg-white/[0.02]')}>
      {/* Tab header */}
      <div className={cn(
        'flex items-center justify-between py-2 px-3 border-b',
        'border-black/[0.06] dark:border-white/[0.06]'
      )}>
        <div className={cn('flex rounded-md p-0.5', 'bg-black/5 dark:bg-white/5')}>
          {['trending', 'new'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'h-[22px] px-2.5 text-[10px] font-semibold border-none rounded cursor-pointer transition-colors duration-150',
                activeTab === tab
                  ? ('bg-white text-black shadow-[0_1px_3px_rgba(0,0,0,0.1)] dark:bg-white/10 dark:text-white')
                  : ('bg-transparent text-black/55 dark:bg-transparent dark:text-white/55')
              )}
            >
              {tab === 'trending' ? 'Trending' : 'New'}
            </button>
          ))}
        </div>
        <a
          href={activeTab === 'trending' ? '/trending' : '/new'}
          className="text-[10px] text-blue-500 no-underline font-semibold"
        >
          View All
        </a>
      </div>

      {/* Column header */}
      <div className={cn(
        'flex items-center gap-2.5 py-1 px-3 text-[8px] font-semibold uppercase tracking-wider border-b',
        'text-black/30 border-black/[0.04] dark:text-white/30 dark:border-white/[0.04]'
      )}>
        <span className="flex-[2] min-w-0">Token</span>
        <span className="flex-[1] text-right">Price</span>
        <span className="flex-[0.7] text-right">Volume</span>
        <span className="flex-[0.7] text-right">24h</span>
      </div>

      {/* Token rows */}
      <div className="overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none]">
        {displayList.map((t, i) => {
          const change = t.pro24h || 0;
          const isUp = change >= 0;
          const isWatched = watchList.includes(t.md5);
          const vol = t.vol24hxrp || 0;
          const volStr = vol >= 1e6 ? `${(vol / 1e6).toFixed(1)}M` : vol >= 1e3 ? `${(vol / 1e3).toFixed(1)}K` : vol.toFixed(0);

          return (
            <a
              key={t.md5 || i}
              href={`/token/${t.slug}`}
              className={cn(
                'flex items-center gap-2.5 py-[5px] px-3 no-underline text-inherit border-b relative transition-colors duration-100',
                'border-black/[0.03] hover:bg-black/[0.02] dark:border-white/[0.03] dark:hover:bg-white/[0.03]',
                'last:border-b-0',
                isWatched && ('bg-[rgba(246,184,126,0.06)] dark:bg-[rgba(246,184,126,0.04)]')
              )}
            >
              {isWatched && <span className="absolute left-0 top-[15%] bottom-[15%] w-0.5 bg-[#F6B87E] rounded-r" />}

              {/* Token info: avatar + name — flex-[2] */}
              <div className="flex items-center gap-1.5 flex-[2] min-w-0">
                <div className="relative w-7 h-7 flex-shrink-0">
                  <div className={cn('w-7 h-7 rounded-full overflow-hidden flex items-center justify-center', 'bg-black/5 dark:bg-white/5')}>
                    {t.md5 ? (
                      <img src={`https://s1.xrpl.to/thumb/${t.md5}_32`} alt="" className="w-full h-full object-cover" loading="lazy" onError={(e) => { e.target.style.display = 'none'; }} />
                    ) : (
                      <span className="text-[8px] font-bold opacity-50">{t.currency?.[0]}</span>
                    )}
                  </div>
                  <Bookmark
                    size={8}
                    onClick={(e) => toggleWatch(e, t.md5)}
                    fill={isWatched ? '#F59E0B' : 'none'}
                    strokeWidth={2}
                    className="absolute -top-0.5 -right-0.5 cursor-pointer"
                    style={{ color: isWatched ? '#F59E0B' : (isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)') }}
                  />
                </div>
                <div className="min-w-0 flex flex-col overflow-hidden">
                  <div className={cn('overflow-hidden text-ellipsis whitespace-nowrap text-[11px] font-semibold leading-tight flex items-center gap-0.5', 'text-[#1a1f2e] dark:text-white')}>
                    <span className={cn('truncate', t.trendingBoost >= 500 && t.trendingBoostExpires > Date.now() && 'text-[#FFD700]')}>{t.name}</span>
                    {t.trendingBoost > 0 && t.trendingBoostExpires > Date.now() && (
                      <Flame size={8} fill="#F6AF01" className="flex-shrink-0 text-[#F6AF01]" />
                    )}
                  </div>
                  <div className="text-[8px] font-medium opacity-40 overflow-hidden text-ellipsis whitespace-nowrap leading-tight" suppressHydrationWarning>
                    {activeTab === 'new' && t.dateon
                      ? (() => { const s = Math.floor((Date.now() - t.dateon) / 1000); if (s < 60) return `${s}s ago`; const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`; const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`; const d = Math.floor(h / 24); return `${d}d ago`; })()
                      : t.user || t.name}
                  </div>
                </div>
              </div>

              {/* Price — flex-[1] */}
              <div className={cn('flex-[1] text-right text-[11px] font-semibold font-mono tabular-nums leading-tight', 'text-[#1a1f2e] dark:text-white/90')}>
                {formatPrice(t.exch, activeFiatCurrency, rate)}
              </div>

              {/* Volume — flex-[0.7] */}
              <div className={cn('flex-[0.7] text-right text-[9px] font-medium tabular-nums', 'text-black/40 dark:text-white/40')}>
                {volStr}
              </div>

              {/* Change — flex-[0.7] */}
              <div className={cn(
                'flex-[0.7] text-right text-[9px] font-bold tabular-nums',
                isUp ? 'text-[#2ecc71]' : 'text-[#ff4d4f]'
              )}>
                {isUp ? '+' : ''}{change.toFixed(1)}%
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
};

export default MobileTrendingTokens;
