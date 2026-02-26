import { useContext, useState, useEffect } from 'react';
import { ThemeContext, WalletContext, AppContext } from 'src/context/AppContext';
import { cn } from 'src/utils/cn';
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';
import api from 'src/utils/api';
import { Bookmark, Flame } from 'lucide-react';

const SYMBOLS = { USD: '$', EUR: '€', JPY: '¥', CNH: '¥', XRP: '✕' };

const Container = ({ isDark, className, ...props }) => (
  <div
    className={cn(
      'flex flex-col h-full overflow-hidden',
      isDark ? 'bg-transparent' : 'bg-white',
      className
    )}
    {...props}
  />
);

const TokenCard = ({ isDark, isWatched, className, children, ...props }) => (
  <a
    className={cn(
      'grid items-center no-underline text-inherit transition-[background-color] duration-150 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#137DFE]',
      'grid-cols-[20px_28px_1fr_70px_54px] gap-2.5 py-2.5 px-4',
      isDark
        ? 'border-b border-white/[0.04] hover:bg-white/[0.03]'
        : 'border-b border-black/[0.04] hover:bg-black/[0.02]',
      'last:border-b-0',
      isWatched && (isDark ? 'bg-[rgba(246,184,126,0.04)]' : 'bg-[rgba(246,184,126,0.06)]'),
      className
    )}
    {...props}
  >
    {isWatched && (
      <span className="absolute left-0 top-[15%] bottom-[15%] w-0.5 bg-[#F6B87E] rounded-r" />
    )}
    {children}
  </a>
);

const BASE_URL = 'https://api.xrpl.to/v1';

// Formatters
const formatPrice = (price, currency, rate) => {
  if (!price) return `${SYMBOLS[currency]}0`;
  const p = currency === 'XRP' ? price : price / rate;
  const s = SYMBOLS[currency];
  if (p < 0.0001) {
    const zeros = -Math.floor(Math.log10(p)) - 1;
    const sig = Math.round(p * Math.pow(10, zeros + 4));
    return (
      <>
        {s}0.0<sub>{zeros}</sub>
        {sig}
      </>
    );
  }
  if (p < 1) return `${s}${p.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')}`;
  if (p >= 1e6) return `${s}${(p / 1e6).toFixed(1)}M`;
  if (p >= 1e3) return `${s}${(p / 1e3).toFixed(1)}K`;
  return `${s}${p < 100 ? p.toFixed(2) : Math.round(p)}`;
};

const TrendingTokens = ({ token = null }) => {
  const { darkMode } = useContext(ThemeContext);
  const isDark = darkMode;
  const { accountProfile, setOpenWalletModal } = useContext(WalletContext);
  const { activeFiatCurrency } = useContext(AppContext);
  const metrics = useSelector(selectMetrics);
  const rate = metrics[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics.CNY : 1) || 1;

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 600);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

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

  // Fetch watchlist
  useEffect(() => {
    if (!accountProfile?.account) { setWatchList([]); return; }
    api.get(`${BASE_URL}/watchlist?account=${accountProfile.account}`)
      .then((res) => res.data.success && setWatchList(res.data.watchlist || []))
      .catch(err => { console.warn('[TrendingTokens] Watchlist fetch failed:', err.message); });
  }, [accountProfile]);

  const toggleWatch = async (e, md5) => {
    e.preventDefault();
    e.stopPropagation();
    if (!accountProfile?.account) { setOpenWalletModal(true); return; }
    const action = watchList.includes(md5) ? 'remove' : 'add';
    try {
      const res = await api.post(`${BASE_URL}/watchlist`, { md5, account: accountProfile.account, action });
      if (res.data.success) setWatchList(res.data.watchlist || []);
    } catch (err) { console.warn('[TrendingTokens] Watchlist toggle failed:', err.message); }
  };

  // Fetch trending on mount
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

  // Fetch new only when tab switches to new
  useEffect(() => {
    if (activeTab !== 'new' || newTokens.length > 0) return;
    const ctrl = new AbortController();
    api.get(`${BASE_URL}/tokens?start=0&limit=50&sortBy=dateon&sortType=desc&skipMetrics=true`, { signal: ctrl.signal })
      .then((res) => {
        const list = res.data?.tokens || [];
        setNewTokens(token?.md5 ? list.filter((t) => t.md5 !== token.md5) : list);
      })
      .catch((err) => { if (!api.isCancel(err)) console.warn('[TrendingTokens] New tokens fetch failed:', err.message); });
    return () => ctrl.abort();
  }, [activeTab, token?.md5]);

  if (error) {
    return (
      <Container isDark={darkMode}>
        <div className="p-4 text-[#f44336] text-xs">Failed to load trending tokens</div>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container isDark={darkMode}>
        <div className="p-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center gap-2 py-[6px] px-2">
              <div className={cn('w-6 h-6 rounded-md flex-shrink-0', darkMode ? 'bg-white/[0.06]' : 'bg-black/[0.06]')} />
              <div className="flex flex-col gap-1 w-[72px] flex-shrink-0">
                <div className={cn('h-2.5 rounded w-[80%]', darkMode ? 'bg-white/[0.06]' : 'bg-black/[0.06]')} />
                <div className={cn('h-2 rounded w-[50%]', darkMode ? 'bg-white/[0.04]' : 'bg-black/[0.04]')} />
              </div>
              <div className={cn('h-2.5 rounded w-12 ml-auto', darkMode ? 'bg-white/[0.06]' : 'bg-black/[0.06]')} />
              <div className={cn('h-2.5 rounded w-8 flex-shrink-0', darkMode ? 'bg-white/[0.06]' : 'bg-black/[0.06]')} />
              <div className={cn('h-2.5 rounded w-10 flex-shrink-0', darkMode ? 'bg-white/[0.06]' : 'bg-black/[0.06]')} />
            </div>
          ))}
        </div>
      </Container>
    );
  }

  return (
    <Container isDark={darkMode}>
      <div className={cn(
        'flex items-center justify-between py-2 sm:py-3 px-2.5 sm:px-4 border-b',
        darkMode ? 'border-white/[0.06] bg-white/[0.02]' : 'border-black/[0.06] bg-black/[0.02]'
      )}>
        <div className={cn('flex rounded-md p-0.5', darkMode ? 'bg-white/5' : 'bg-black/5')}>
          {['trending', 'new'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'h-[22px] sm:h-6 px-2.5 sm:px-3 text-[10px] font-semibold border-none rounded cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
                activeTab === tab
                  ? cn(darkMode ? 'bg-white/10 text-white' : 'bg-white text-black shadow-[0_1px_3px_rgba(0,0,0,0.1)]')
                  : cn('bg-transparent', darkMode ? 'text-white/55' : 'text-black/55')
              )}
            >
              {tab === 'trending' ? 'Trending' : 'New'}
            </button>
          ))}
        </div>
        <a
          href={activeTab === 'trending' ? '/trending' : '/new'}
          className="text-[10px] sm:text-[11px] text-blue-500 no-underline font-semibold"
        >
          View All
        </a>
      </div>

      <div className="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none]">
        {(() => {
          const baseList = activeTab === 'trending' ? tokens : newTokens;
          const otherList = activeTab === 'trending' ? newTokens : tokens;
          const watchedFromOther = otherList.filter(t => watchList.includes(t.md5) && !baseList.some(b => b.md5 === t.md5));
          const sorted = [...watchedFromOther, ...baseList].sort((a, b) => (watchList.includes(b.md5) ? 1 : 0) - (watchList.includes(a.md5) ? 1 : 0));
          return isMobile ? sorted.slice(0, 10) : sorted;
        })().map((t, i) => {
          const change = t.pro24h || 0;
          const isUp = change >= 0;
          const isWatched = watchList.includes(t.md5);

          const vol = t.vol24hxrp || 0;
          const volStr = vol >= 1e6 ? `${(vol / 1e6).toFixed(1)}M` : vol >= 1e3 ? `${(vol / 1e3).toFixed(1)}K` : vol.toFixed(0);

          if (isMobile) {
            return (
              <a
                key={t.md5 || i}
                href={`/token/${t.slug}`}
                className={cn(
                  'flex items-center gap-2 py-[6px] px-2 no-underline text-inherit border-b relative',
                  isDark
                    ? 'border-white/[0.04] hover:bg-white/[0.03]'
                    : 'border-black/[0.04] hover:bg-black/[0.02]',
                  'last:border-b-0',
                  isWatched && (isDark ? 'bg-[rgba(246,184,126,0.04)]' : 'bg-[rgba(246,184,126,0.06)]')
                )}
              >
                {isWatched && <span className="absolute left-0 top-[15%] bottom-[15%] w-0.5 bg-[#F6B87E] rounded-r" />}
                <div className="relative w-6 h-6 flex-shrink-0">
                  <div className={cn('w-6 h-6 rounded-md overflow-hidden flex items-center justify-center', isDark ? 'bg-white/5' : 'bg-black/5')}>
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
                    style={{ color: isWatched ? '#F59E0B' : isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)' }}
                  />
                </div>
                <div className="min-w-0 flex-1 flex flex-col overflow-hidden">
                  <div className={cn('overflow-hidden text-ellipsis whitespace-nowrap text-[11px] font-semibold leading-tight flex items-center gap-0.5', isDark ? 'text-white' : 'text-[#1a1f2e]')}>
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
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right flex flex-col">
                    <div className={cn('text-[10px] font-semibold font-mono tabular-nums leading-tight', isDark ? 'text-white/90' : 'text-[#1a1f2e]')}>
                      {formatPrice(t.exch, activeFiatCurrency, rate)}
                    </div>
                    <div className="text-[8px] font-medium tabular-nums opacity-40 leading-tight">
                      {volStr}
                    </div>
                  </div>
                  <div className={cn(
                    'text-[9px] font-bold tabular-nums py-0.5 px-1.5 rounded leading-tight min-w-[40px] text-center',
                    isUp ? 'text-[#2ecc71] bg-[rgba(46,204,113,0.08)]' : 'text-[#ff4d4f] bg-[rgba(255,77,79,0.08)]'
                  )}>
                    {isUp ? '+' : ''}{change.toFixed(1)}%
                  </div>
                </div>
              </a>
            );
          }

          return (
            <TokenCard
              key={t.md5 || i}
              href={`/token/${t.slug}`}
              isDark={darkMode}
              isWatched={isWatched}
            >
              <div className="flex items-center">
                <Bookmark
                  size={14}
                  onClick={(e) => toggleWatch(e, t.md5)}
                  fill={isWatched ? '#F59E0B' : 'none'}
                  strokeWidth={2}
                  className="cursor-pointer transition-transform duration-200 hover:scale-[1.2]"
                  style={{ color: isWatched ? '#F59E0B' : isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}
                />
              </div>
              <div className={cn('flex w-7 h-7 rounded-lg overflow-hidden items-center justify-center', isDark ? 'bg-white/5' : 'bg-black/5')}>
                {t.md5 ? (
                  <img src={`https://s1.xrpl.to/thumb/${t.md5}_32`} alt="" className="w-full h-full object-cover" loading="lazy" onError={(e) => { e.target.style.display = 'none'; }} />
                ) : (
                  <span className="text-[10px] font-bold opacity-50">{t.currency?.[0]}</span>
                )}
              </div>
              <div className="min-w-0 flex flex-col overflow-hidden">
                <div className={cn('overflow-hidden text-ellipsis whitespace-nowrap text-xs font-semibold leading-tight flex items-center gap-1', isDark ? 'text-white' : 'text-[#1a1f2e]')}>
                  <span className={cn('truncate', t.trendingBoost >= 500 && t.trendingBoostExpires > Date.now() && 'text-[#FFD700]')}>{t.name}</span>
                  {t.trendingBoost > 0 && t.trendingBoostExpires > Date.now() && (
                    <span className="inline-flex items-center gap-0.5 flex-shrink-0 text-[#F6AF01]">
                      <Flame size={10} fill="#F6AF01" />
                      <span className="text-[9px] font-bold">{t.trendingBoost}</span>
                    </span>
                  )}
                </div>
                <div className="text-[8px] font-medium opacity-40 overflow-hidden text-ellipsis whitespace-nowrap leading-tight mt-px" suppressHydrationWarning>
                  {activeTab === 'new' && t.dateon
                    ? (() => { const s = Math.floor((Date.now() - t.dateon) / 1000); if (s < 60) return `${s}s ago`; const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`; const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`; const d = Math.floor(h / 24); return `${d}d ago`; })()
                    : t.user || t.name}
                </div>
              </div>
              <div className="flex text-right flex-col gap-px">
                <div className={cn('text-[11px] font-semibold font-mono tabular-nums', isDark ? 'text-white/90' : 'text-[#1a1f2e]')}>
                  {formatPrice(t.exch, activeFiatCurrency, rate)}
                </div>
                <div className="opacity-40 text-[9px] font-medium tabular-nums">
                  Vol {volStr}
                </div>
              </div>
              <div className={cn(
                'text-right text-[11px] font-bold tabular-nums py-0.5 px-1.5 rounded justify-self-end',
                isUp ? 'text-[#2ecc71] bg-[rgba(46,204,113,0.1)]' : 'text-[#ff4d4f] bg-[rgba(255,77,79,0.1)]'
              )}>
                {isUp ? '+' : ''}{change.toFixed(1)}%
              </div>
            </TokenCard>
          );
        })}
      </div>
    </Container>
  );
};

export default TrendingTokens;
