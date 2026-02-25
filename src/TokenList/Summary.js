import Decimal from 'decimal.js-light';
import { useContext, useState, useEffect, useMemo } from 'react';
import { cn } from 'src/utils/cn';

// Redux
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';

// Constants
const currencySymbols = {
  USD: '$',
  EUR: '€',
  JPY: '¥',
  CNH: '¥',
  XRP: ''
};

// Components
import { ThemeContext, WalletContext, AppContext } from 'src/context/AppContext';
import Link from 'next/link';
import { TrendingUp, Sparkles, ExternalLink, Star, Check } from 'lucide-react';
import { TIER_CONFIG } from 'src/components/VerificationBadge';

const Container = ({ className, children, isDark, ...p }) => (
  <div
    className={cn(
      'summary-root flex flex-col gap-0 rounded-xl relative mb-1 box-border overflow-hidden',
      'max-[600px]:p-1 max-[600px]:gap-0 max-[600px]:mb-1',
      'border-[1.5px] backdrop-blur-[12px] py-[5px] px-[6px]',
      isDark ? 'border-white/[0.08] bg-[rgba(10,10,10,0.5)]' : 'border-black/[0.06] bg-white/50',
      className
    )}
    {...p}
  >
    {children}
    <style>{`
      .summary-container > * { position: relative; z-index: 1; }
      @media (max-width: 1024px) {
        .summary-root { padding: 4px 5px; gap: 0; margin-bottom: 4px; }
        .summary-metric { height: 64px; padding: 8px 8px; overflow: hidden; }
        .summary-title { font-size: 0.6rem; }
        .summary-value { font-size: 0.9rem; }
        .summary-pct { font-size: 0.55rem; padding: 1px 3px; }
        .summary-mcap-row .summary-value { font-size: 0.85rem !important; }
        .summary-mcap-row .summary-pct { font-size: 0.5rem; }
        .summary-vol-badge { display: none; }
        .summary-gauge { display: none !important; }
      }
      @media (max-width: 820px) {
        .summary-metric { height: 70px; padding: 9px 9px; overflow: hidden; }
        .summary-title { font-size: 0.64rem; }
        .summary-value { font-size: 0.95rem; }
        .summary-pct { font-size: 0.56rem; }
        .summary-vol-badge { display: inline-flex; font-size: 0.55rem; }
        .summary-gauge { display: none !important; }
        .summary-mcap-row .summary-value { font-size: 0.9rem !important; }
      }
      @media (min-width: 601px) and (max-width: 820px) {
        .summary-market-row span.font-semibold { font-size: 0.95rem !important; }
        .summary-market-row div > div > span { font-size: 0.52rem !important; }
      }
    `}</style>
  </div>
);

const Grid = ({ className, children, ...p }) => (
  <>
    <style>{`
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr) repeat(2, 1.3fr);
        gap: 5px;
        align-items: stretch;
      }
      @media (max-width: 1024px) { .summary-grid { grid-template-columns: repeat(4, 1fr) repeat(2, 1.2fr); gap: 4px; } }
      @media (max-width: 820px) { .summary-grid { grid-template-columns: repeat(2, 1fr); gap: 4px; } }
      @media (max-width: 600px) {
        .summary-grid {
          grid-template-columns: repeat(2, 1fr);
          gap: 3px;
          align-items: stretch;
        }
        .summary-metric {
          height: auto !important;
          min-height: 0 !important;
          padding: 8px 7px !important;
          gap: 3px !important;
          justify-content: space-between !important;
        }
        .summary-title { font-size: 0.55rem !important; margin-bottom: 0 !important; }
        .summary-value { font-size: 0.78rem !important; }
        .summary-pct { font-size: 0.52rem !important; padding: 0 2px !important; }
        .summary-vol-badge { display: none !important; }
        .summary-gauge { display: none !important; }
        .summary-mcap-row { flex-direction: column !important; gap: 2px !important; }
        .summary-mcap-row > div { flex-direction: row !important; align-items: baseline !important; gap: 3px !important; }
        .summary-market-row { flex-direction: row !important; align-items: center !important; justify-content: space-evenly !important; }
        .summary-market-row > div { gap: 0 !important; }
        .summary-market-row span.font-semibold { font-size: 0.78rem !important; line-height: 1 !important; }
        .summary-market-row div > div > span { font-size: 0.46rem !important; line-height: 1 !important; }
      }
    `}</style>
    <div className={cn('summary-grid relative z-[1]', className)} role="status" aria-live="polite" {...p}>
      {children}
    </div>
  </>
);

const MetricBox = ({ className, children, isDark, ...p }) => (
  <div
    className={cn(
      'summary-metric flex flex-col justify-between rounded-xl transition-[background-color,border-color,opacity,transform] duration-200',
      'max-[600px]:rounded-[10px]',
      'py-[12px] px-[12px] min-h-[78px] gap-0 backdrop-blur-[4px] border-[1.5px]',
      'max-[600px]:h-auto max-[600px]:py-[8px] max-[600px]:px-[7px] max-[600px]:gap-0',
      isDark ? 'bg-white/[0.02] border-white/[0.08]' : 'bg-black/[0.01] border-black/[0.06]',
      className
    )}
    style={{ ...p.style }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = isDark ? 'rgba(19, 125, 254, 0.25)' : 'rgba(19, 125, 254, 0.15)';
      e.currentTarget.style.background = isDark ? 'rgba(19, 125, 254, 0.05)' : 'rgba(19, 125, 254, 0.03)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
      e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)';
    }}
    {...(({ style, ...rest }) => rest)(p)}
  >
    {children}
  </div>
);

const MetricTitle = ({ className, children, isDark, ...p }) => (
  <span
    className={cn(
      'summary-title text-[0.85rem] max-[600px]:text-[0.56rem] font-normal tracking-[0.02em]',
      isDark ? 'text-white/50' : 'text-[rgba(33,43,54,0.5)]',
      className
    )}
    {...p}
  >
    {children}
  </span>
);

const MetricValue = ({ className, children, isDark, ...p }) => (
  <span
    className={cn(
      'summary-value text-2xl max-[600px]:text-[0.85rem] font-semibold whitespace-nowrap leading-[1] tracking-[-0.02em]',
      isDark ? 'text-white' : 'text-[#212B36]',
      className
    )}
    style={{ ...p.style }}
    {...(({ style, ...rest }) => rest)(p)}
  >
    {children}
  </span>
);

const PercentageChange = ({ className, children, isPositive, ...p }) => (
  <span
    className={cn(
      'summary-pct text-[0.8rem] max-[600px]:text-[0.54rem] inline-flex items-center gap-0.5 font-medium rounded',
      'tracking-[-0.01em] py-px px-1',
      isPositive ? 'text-[#10b981] bg-[rgba(16,185,129,0.1)]' : 'text-[#ef4444] bg-[rgba(239,68,68,0.1)]',
      className
    )}
    style={{ ...p.style }}
    {...(({ style, ...rest }) => rest)(p)}
  >
    {children}
  </span>
);

const Skeleton = ({ className, height, width, ...p }) => (
  <>
    <style>{`
      @keyframes summary-loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>
    <div
      className={cn('rounded-lg', className)}
      style={{
        background: '#e8e8e8',
        backgroundSize: '200% 100%',
        animation: 'summary-loading 1.5s infinite',
        height: height || '20px',
        width: width || '100%',
        ...p.style
      }}
      {...(({ style, ...rest }) => rest)(p)}
    />
  </>
);

const formatNumberWithDecimals = (num) => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(0)}K`;
  return Math.round(num).toLocaleString();
};

const fmtVol = (v) => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}K` : v > 0 ? v.toFixed(0) : '0';

const timeAgo = (ts) => {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const TokenAvatar = ({ token, isDark }) => {
  const tier = TIER_CONFIG[token.verified];
  return (
    <div className="relative flex-shrink-0">
      <div className={cn('w-[24px] h-[24px] min-w-[24px] max-[600px]:w-[18px] max-[600px]:h-[18px] max-[600px]:min-w-[18px] rounded-md overflow-hidden flex items-center justify-center', isDark ? 'bg-white/[0.06]' : 'bg-black/[0.04]')}>
        {token.md5 ? (
          <img src={`https://s1.xrpl.to/thumb/${token.md5}_32`} alt="" className="w-full h-full object-cover" loading="lazy" onError={(e) => { e.target.style.display = 'none'; }} />
        ) : (
          <span className="text-[9px] font-bold opacity-40">{token.currency?.[0]}</span>
        )}
      </div>
      {tier && (
        <div className={cn('absolute -bottom-[3px] -right-[3px] rounded-full p-[1.5px]', isDark ? 'ring-[1px] ring-[#0a0a0a]' : 'ring-[1px] ring-white', tier.bg)} title={tier.label}>
          {tier.icon(7)}
        </div>
      )}
    </div>
  );
};

const RowShell = ({ token, isDark, children }) => (
  <Link
    href={`/token/${token.slug}`}
    prefetch={false}
    className={cn(
      'flex items-center gap-[6px] py-[4px] px-[6px] no-underline transition-colors duration-150 rounded-md',
      'max-[600px]:py-[3px] max-[600px]:px-[6px] max-[600px]:gap-[5px]',
      isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.02]'
    )}
  >
    {children}
  </Link>
);

const RankNum = ({ idx, isDark }) => (
  <span className={cn('text-[10px] tabular-nums font-medium w-[14px] text-center flex-shrink-0 max-[600px]:hidden', isDark ? 'text-white/25' : 'text-black/25')}>
    {idx + 1}
  </span>
);

const ChangePill = ({ change }) => {
  const isUp = change >= 0;
  return (
    <div className={cn(
      'text-[10px] max-[600px]:text-[9px] font-bold tabular-nums px-[6px] py-[3px] max-[600px]:px-[4px] max-[600px]:py-[2px] rounded-md leading-tight flex-shrink-0',
      isUp ? 'text-[#10b981] bg-[rgba(16,185,129,0.1)]' : 'text-[#ef4444] bg-[rgba(239,68,68,0.1)]'
    )}>
      {isUp ? '+' : ''}{change.toFixed(1)}%
    </div>
  );
};

const OriginIcon = ({ origin, isDark }) => {
  const s = 'w-3 h-3';
  switch (origin) {
    case 'FirstLedger': return <ExternalLink className={cn(s, 'text-[#013CFE]')} />;
    case 'XPMarket': return <Sparkles className={cn(s, 'text-[#6D1FEE]')} />;
    case 'LedgerMeme': return <span className="text-[10px] leading-none">😂</span>;
    case 'Horizon': return <Star className={cn(s, 'text-[#f97316]')} />;
    case 'aigent.run': return <img src="/static/aigentrun.gif" alt="Aigent.Run" className="w-3 h-3 object-contain" />;
    case 'Magnetic X': return <img src="/static/magneticx-logo.webp" alt="Magnetic X" className="w-3 h-3 object-contain" />;
    case 'xrp.fun': return <TrendingUp className={cn(s, 'text-[#B72136]')} />;
    default: return <Sparkles className={cn(s, isDark ? 'text-white/40' : 'text-gray-400')} />;
  }
};

// Both rows: rank | avatar | name | mcap | origin icon | launched | %change
const DiscoverRow = ({ token, idx, isDark }) => (
  <RowShell token={token} isDark={isDark}>
    <RankNum idx={idx} isDark={isDark} />
    <TokenAvatar token={token} isDark={isDark} />
    <span className={cn('text-[11px] max-[600px]:text-[10px] font-semibold truncate leading-none flex-1 min-w-0', isDark ? 'text-white' : 'text-[#1a1f2e]')}>{token.name}</span>
    <span className={cn('text-[9px] tabular-nums font-medium flex-shrink-0 ml-[4px] max-[600px]:ml-[2px] w-[40px] max-[600px]:w-[36px] text-right', isDark ? 'text-white/30' : 'text-black/30')}>${fmtVol(token.marketcap || 0)}</span>
    <span className="flex-shrink-0 ml-[6px] w-[12px] flex items-center justify-center max-[600px]:hidden" title={token.origin || 'XRPL'}><OriginIcon origin={token.origin} isDark={isDark} /></span>
    <span className={cn('text-[9px] tabular-nums font-medium flex-shrink-0 ml-[6px] w-[34px] text-right max-[600px]:hidden', isDark ? 'text-white/25' : 'text-black/25')}>{timeAgo(token.dateon)}</span>
    <span className="ml-[4px] max-[600px]:ml-[2px] w-[50px] max-[600px]:w-[44px] flex justify-end"><ChangePill change={token.pro24h || 0} /></span>
  </RowShell>
);

// SummaryTag component (previously in separate file)
export const SummaryTag = ({ tagName }) => {
  return (
    <div className="mt-4 max-[600px]:mt-1">
      <h1 className="m-0 mb-2 max-[600px]:mb-1 text-[1.75rem] max-[600px]:text-[1.1rem] font-normal leading-[1.2]">
        {tagName} Tokens
      </h1>
      <div className="text-sm max-[600px]:text-[0.7rem] font-normal leading-[1.4] opacity-60">
        Ranked by 24h trading volume
      </div>
    </div>
  );
};

// SummaryWatchList component (previously in separate file)
export const SummaryWatchList = () => {
  const { accountProfile } = useContext(WalletContext);
  const account = accountProfile?.account;

  return (
    <div className="mt-4 max-[600px]:mt-1">
      <h1
        className="m-0 text-[2.125rem] max-[600px]:text-[1.1rem] font-light leading-[1.235] tracking-[-0.00833em]"
      >
        My Token Watchlist
      </h1>
      {!account && (
        <div
          className="text-base max-[600px]:text-[0.7rem] font-normal mt-4 max-[600px]:mt-2 leading-[1.5] tracking-[0.00938em]"
        >
          <span className="text-[rgba(145,158,171,0.99)]">
            Track your favorite XRPL tokens. Log in to manage your personalized watchlist.
          </span>
        </div>
      )}
    </div>
  );
};

// Main Summary component
export default function Summary({ tokens = [], trendingTokens: trendingProp = [], newTokens: newProp = [] }) {
  const metrics = useSelector(selectMetrics);
  const { darkMode } = useContext(ThemeContext);
  const { activeFiatCurrency } = useContext(AppContext);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 600);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const fiatRate =
    metrics[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics.CNY : null) || 1;

  // Use dedicated SSR props; fallback to deriving from page tokens if not provided
  const { trendingTokens, newTokens } = useMemo(() => {
    if (trendingProp.length > 0 || newProp.length > 0) {
      return { trendingTokens: trendingProp, newTokens: newProp };
    }
    if (!tokens || tokens.length === 0) return { trendingTokens: [], newTokens: [] };
    const trending = [...tokens].filter(t => (t.trendingScore || 0) > 0)
      .sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0)).slice(0, 3);
    const newest = [...tokens].sort((a, b) => (b.dateon || 0) - (a.dateon || 0)).slice(0, 3);
    return { trendingTokens: trending, newTokens: newest };
  }, [trendingProp, newProp, tokens]);


  return (
    <Container isDark={darkMode}>
        {/* Metrics Row */}
        {isLoading ? (
          <Grid>
            {[...Array(4)].map((_, i) => (
              <MetricBox key={`summary-skeleton-${i}`} isDark={darkMode}>
                <Skeleton height="12px" width="60%" style={{ marginBottom: '4px' }} />
                <Skeleton height="20px" width="80%" />
              </MetricBox>
            ))}
          </Grid>
        ) : (
          <Grid>
              {/* MCap / TVL */}
              <MetricBox isDark={darkMode}>
                <div className="flex items-center justify-between w-full">
                  <MetricTitle isDark={darkMode}>{isMobile ? 'MCap' : 'MCap / TVL'}</MetricTitle>
                  {!isMobile && metrics.USD > 0 && (
                    <span className={cn('text-[0.7rem] font-medium tabular-nums', darkMode ? 'text-white/50' : 'text-black/50')}>
                      XRP ${new Decimal(1).div(activeFiatCurrency === 'XRP' ? metrics.USD : fiatRate).toFixed(2)}
                      <span className={cn('ml-0.5 text-[0.6rem]', (metrics.H24?.xrpPro24h || 0) >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]')}>
                        {(metrics.H24?.xrpPro24h || 0) >= 0 ? '↑' : '↓'}{Math.abs(metrics.H24?.xrpPro24h || 0).toFixed(1)}%
                      </span>
                    </span>
                  )}
                </div>
                {isMobile ? (
                  <div className="flex-1 flex flex-col justify-center gap-[2px]">
                    <MetricValue isDark={darkMode}>
                      {currencySymbols[activeFiatCurrency]}
                      {formatNumberWithDecimals(new Decimal(metrics.global?.gMarketcap || metrics.market_cap_usd || 0).div(fiatRate).toNumber())}
                    </MetricValue>
                    <span className={cn('text-[0.5rem] leading-[1] whitespace-nowrap', darkMode ? 'text-white/50' : 'text-black/50')}>
                      TVL {currencySymbols[activeFiatCurrency]}
                      {formatNumberWithDecimals(new Decimal(metrics.global?.gTVL || metrics.global?.totalTVL || metrics.H24?.totalTVL || 0).div(fiatRate).toNumber())}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="summary-mcap-row flex-1 flex w-full items-center justify-between">
                      <MetricValue isDark={darkMode} style={{ fontSize: '1.5rem' }}>
                        {currencySymbols[activeFiatCurrency]}
                        {formatNumberWithDecimals(new Decimal(metrics.global?.gMarketcap || metrics.market_cap_usd || 0).div(fiatRate).toNumber())}
                      </MetricValue>
                      <MetricValue isDark={darkMode} style={{ fontSize: '1.3rem', opacity: 0.5 }}>
                        {currencySymbols[activeFiatCurrency]}
                        {formatNumberWithDecimals(new Decimal(metrics.global?.gTVL || metrics.global?.totalTVL || metrics.H24?.totalTVL || 0).div(fiatRate).toNumber())}
                      </MetricValue>
                    </div>
                    <div className="flex items-center justify-between w-full">
                      <PercentageChange isPositive={(metrics.global?.gMarketcapPro || 0) >= 0} style={{ fontSize: '0.8rem' }}>
                        {(metrics.global?.gMarketcapPro || 0) >= 0 ? '↑' : '↓'}{Math.abs(metrics.global?.gMarketcapPro || 0).toFixed(1)}%
                      </PercentageChange>
                      <PercentageChange isPositive={(metrics.global?.gTVLPro || metrics.global?.totalTVLPro || metrics.H24?.totalTVLPro || 0) >= 0} style={{ fontSize: '0.8rem' }}>
                        {(metrics.global?.gTVLPro || metrics.global?.totalTVLPro || metrics.H24?.totalTVLPro || 0) >= 0 ? '↑' : '↓'}{Math.abs(metrics.global?.gTVLPro || metrics.global?.totalTVLPro || metrics.H24?.totalTVLPro || 0).toFixed(1)}%
                      </PercentageChange>
                    </div>
                  </>
                )}
              </MetricBox>

              {/* 24h Volume */}
              <MetricBox isDark={darkMode}>
                <MetricTitle isDark={darkMode}>{isMobile ? '24h Vol' : '24h Volume'}</MetricTitle>
                <div className="flex-1 flex items-center">
                  <MetricValue isDark={darkMode} style={!isMobile ? { fontSize: '1.5rem' } : undefined}>
                    {currencySymbols[activeFiatCurrency]}
                    {formatNumberWithDecimals(new Decimal(metrics.global?.gDexVolume || metrics.total_volume_usd || 0).div(fiatRate).toNumber())}
                  </MetricValue>
                </div>
                {(() => {
                  const stablePercent = ((metrics.global?.gStableVolume || 0) / (metrics.global?.gDexVolume || 1)) * 100;
                  const memePercent = ((metrics.global?.gMemeVolume || 0) / (metrics.global?.gDexVolume || 1)) * 100;
                  return (
                    <div className="flex items-center justify-between w-full">
                      <PercentageChange isPositive={(metrics.global?.gDexVolumePro || 0) >= 0} style={{ fontSize: '0.8rem' }}>
                        {(metrics.global?.gDexVolumePro || 0) >= 0 ? '↑' : '↓'}{Math.abs(metrics.global?.gDexVolumePro || 0).toFixed(1)}%
                      </PercentageChange>
                      {!isMobile && (
                        <div className="flex items-center gap-1.5">
                          <span className="summary-vol-badge text-[0.75rem] font-medium py-px px-1.5 rounded bg-[rgba(16,185,129,0.1)] text-[#10b981]">
                            {stablePercent.toFixed(0)}% Stable
                          </span>
                          <span className="summary-vol-badge text-[0.75rem] font-medium py-px px-1.5 rounded bg-[rgba(245,158,11,0.1)] text-[#f59e0b]">
                            {memePercent.toFixed(0)}% Meme
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </MetricBox>

              {/* 24h Traders */}
              <MetricBox isDark={darkMode}>
                <MetricTitle isDark={darkMode}>{isMobile ? 'Traders' : '24h Traders'}</MetricTitle>
                <div className="flex-1 flex items-center">
                  <MetricValue isDark={darkMode} style={!isMobile ? { fontSize: '1.5rem' } : undefined}>
                    {formatNumberWithDecimals(metrics.H24?.uniqueTraders24H || 0)}
                  </MetricValue>
                </div>
                {(() => {
                  const buyVol = metrics.H24?.globalBuy24hxrp || 0;
                  const sellVol = metrics.H24?.globalSell24hxrp || 0;
                  const total = buyVol + sellVol;
                  const buyPercent = total > 0 ? (buyVol / total) * 100 : 50;
                  return (
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium rounded bg-[rgba(16,185,129,0.1)] text-[#10b981] text-[0.8rem] py-px px-1.5">
                        {buyPercent.toFixed(0)}% Buy
                      </span>
                      <span className="font-medium rounded bg-[rgba(239,68,68,0.1)] text-[#ef4444] text-[0.8rem] py-px px-1.5">
                        {(100 - buyPercent).toFixed(0)}% Sell
                      </span>
                    </div>
                  );
                })()}
              </MetricBox>

              {/* Market */}
              <MetricBox isDark={darkMode}>
                <MetricTitle isDark={darkMode}>Market</MetricTitle>
                {(() => {
                  const sentiment = metrics.global?.sentimentScore || 50;
                  const rsi = metrics.global?.avgRSI || 50;
                  const getSentimentColor = (v) => v >= 55 ? '#10b981' : v >= 45 ? '#fbbf24' : '#ef4444';
                  const getRsiColor = (v) => v >= 70 ? '#ef4444' : v <= 30 ? '#8b5cf6' : v >= 50 ? '#10b981' : '#fbbf24';
                  const sentColor = getSentimentColor(sentiment);
                  const rsiColor = getRsiColor(rsi);

                  if (isMobile) {
                    return (
                      <div className="flex-1 flex flex-col justify-center gap-[2px]">
                        <MetricValue isDark={darkMode}>
                          <span style={{ color: sentColor }}>{sentiment.toFixed(0)}</span>
                          <span className={cn('text-[0.35rem] ml-[2px] font-normal', darkMode ? 'text-white/50' : 'text-black/50')}>Sent</span>
                        </MetricValue>
                        <span className={cn('text-[0.5rem] leading-[1]', darkMode ? 'text-white/50' : 'text-black/50')}>
                          RSI <span style={{ color: rsiColor, fontWeight: 600 }}>{rsi.toFixed(0)}</span>
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div className="summary-market-row flex-1 flex items-center w-full justify-evenly">
                      <div className="flex flex-col items-center gap-[8px]">
                        <div className="summary-gauge relative w-20 h-[42px]">
                          <div className="absolute opacity-20 bg-[#fbbf24] w-20 h-10 rounded-t-[40px]" />
                          <div className="absolute bottom-0 left-1/2 w-[2px] rounded-[1px] origin-bottom h-9"
                            style={{ background: sentColor, transform: `translateX(-50%) rotate(${(sentiment - 50) * 1.8}deg)` }} />
                          <div className="absolute -bottom-[2px] left-1/2 -translate-x-1/2 rounded-full w-[9px] h-[9px]" style={{ background: sentColor }} />
                        </div>
                        <div className="flex items-baseline gap-[4px]">
                          <span className="font-semibold leading-[1] text-[1.75rem]" style={{ color: sentColor }}>{sentiment.toFixed(0)}</span>
                          <span className={cn('text-[0.8rem]', darkMode ? 'text-white/60' : 'text-black/60')}>Sent</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-[8px]">
                        <div className="summary-gauge relative w-20 h-[42px]">
                          <div className="absolute opacity-20 bg-[#10b981] w-20 h-10 rounded-t-[40px]" />
                          <div className="absolute bottom-0 left-1/2 w-[2px] rounded-[1px] origin-bottom h-9"
                            style={{ background: rsiColor, transform: `translateX(-50%) rotate(${(rsi - 50) * 1.8}deg)` }} />
                          <div className="absolute -bottom-[2px] left-1/2 -translate-x-1/2 rounded-full w-[9px] h-[9px]" style={{ background: rsiColor }} />
                        </div>
                        <div className="flex items-baseline gap-[4px]">
                          <span className="font-semibold leading-[1] text-[1.75rem]" style={{ color: rsiColor }}>{rsi.toFixed(0)}</span>
                          <span className={cn('text-[0.8rem]', darkMode ? 'text-white/60' : 'text-black/60')}>RSI</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </MetricBox>

              {/* Trending Panel — inline in grid */}
              {trendingTokens.length > 0 && (
                <div className={cn(
                  'rounded-xl border-[1.5px] overflow-hidden',
                  darkMode ? 'border-white/[0.08] bg-white/[0.02]' : 'border-black/[0.06] bg-black/[0.01]'
                )}>
                  <div className={cn(
                    'flex items-center justify-between px-[8px] py-[4px] max-[600px]:px-[8px] max-[600px]:py-[3px]',
                    darkMode ? 'border-b border-white/[0.06]' : 'border-b border-black/[0.05]'
                  )}>
                    <div className="flex items-center gap-[5px]">
                      <TrendingUp size={12} className={cn( darkMode ? 'text-white/40' : 'text-black/40')} />
                      <span className={cn('text-[10px] font-semibold', darkMode ? 'text-white/70' : 'text-black/70')}>
                        Trending
                      </span>
                    </div>
                    <Link href="/trending" prefetch={false} className="text-[9px] text-[#137DFE] no-underline font-medium hover:underline">
                      View All
                    </Link>
                  </div>
                  <div className="py-0">
                    {trendingTokens.map((t, i) => (
                      <DiscoverRow key={t.md5} token={t} idx={i} isDark={darkMode} />
                    ))}
                  </div>
                </div>
              )}

              {/* New Launches Panel — inline in grid */}
              {newTokens.length > 0 && (
                <div className={cn(
                  'rounded-xl border-[1.5px] overflow-hidden',
                  darkMode ? 'border-white/[0.08] bg-white/[0.02]' : 'border-black/[0.06] bg-black/[0.01]'
                )}>
                  <div className={cn(
                    'flex items-center justify-between px-[8px] py-[4px] max-[600px]:px-[8px] max-[600px]:py-[3px]',
                    darkMode ? 'border-b border-white/[0.06]' : 'border-b border-black/[0.05]'
                  )}>
                    <div className="flex items-center gap-[5px]">
                      <Sparkles size={12} className={cn( darkMode ? 'text-white/40' : 'text-black/40')} />
                      <span className={cn('text-[10px] font-semibold', darkMode ? 'text-white/70' : 'text-black/70')}>
                        New Launches
                      </span>
                    </div>
                    <Link href="/new" prefetch={false} className="text-[9px] text-[#137DFE] no-underline font-medium hover:underline">
                      View All
                    </Link>
                  </div>
                  <div className="py-0">
                    {newTokens.map((t, i) => (
                      <DiscoverRow key={t.md5} token={t} idx={i} isDark={darkMode} />
                    ))}
                  </div>
                </div>
              )}
          </Grid>
        )}
    </Container>
  );
}
