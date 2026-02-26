import { apiFetch } from 'src/utils/api';
import { useState, useEffect, useMemo, useCallback, memo, useContext, useRef } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import { cn } from 'src/utils/cn';
import { ThemeContext } from 'src/context/AppContext';
import { ApiButton, registerApiCalls } from 'src/components/ApiEndpointsModal';

const Header = dynamic(() => import('../src/components/Header'), { ssr: true });
const Footer = dynamic(() => import('../src/components/Footer'), { ssr: true });

import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Sparkles,
  ImageOff
} from 'lucide-react';

const SENTIMENT_COLORS = {
  bullish: '#10B981',
  bearish: '#EF4444',
  neutral: '#F59E0B',
  default: '#9CA3AF'
};

const getSentimentColor = (s) => SENTIMENT_COLORS[s?.toLowerCase()] || SENTIMENT_COLORS.default;

const SentimentChart = memo(({ data, period, onPeriodChange, onHover, hoverIdx, isDark }) => {
  if (!data?.labels?.length) return null;

  const maxVal = Math.max(...data.bullish, ...data.bearish, ...(data.neutral || []), 1);
  const w = 1000, h = 200, pts = data.labels.length;
  const step = w / Math.max(pts - 1, 1);
  const getY = (val) => h - (val / maxVal) * h;

  const getPath = (arr) => arr.map((v, i) => `${i ? 'L' : 'M'}${i * step},${getY(v)}`).join(' ');
  const getArea = (arr) => `${getPath(arr)} L${(pts - 1) * step},${h} L0,${h} Z`;

  const totalBull = data.bullish.reduce((a, b) => a + b, 0);
  const totalBear = data.bearish.reduce((a, b) => a + b, 0);
  const totalNeutral = (data.neutral || []).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-6 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={cn("text-[13px] font-black uppercase tracking-widest opacity-70", isDark ? "text-white" : "text-black")}>
            Market Sentiment
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest",
              isDark
                ? "bg-primary/10 text-primary border border-primary/20"
                : "bg-primary/5 text-primary border border-primary/10"
            )}>
              <Sparkles size={10} />
              Powered by AI
            </span>
          </div>
        </div>
        <div className={cn(
          "flex items-center p-1 rounded-xl border",
          isDark ? "bg-white/[0.03] border-white/10" : "bg-black/[0.02] border-black/[0.05]"
        )}>
          {[7, 30, 90, 'all'].map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={cn(
                'rounded-lg px-3.5 py-2 sm:px-3 sm:py-1.5 text-[11px] font-black transition-[background-color,box-shadow]',
                period === p
                  ? 'bg-[#0a5cc5] text-white shadow-lg shadow-primary/20'
                  : isDark
                    ? 'text-gray-300 hover:text-white'
                    : 'text-gray-500 hover:text-black'
              )}
            >
              {p === 'all' ? 'ALL' : `${p}D`}
            </button>
          ))}
        </div>
      </div>

      <div className="relative rounded-xl overflow-hidden">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="w-full h-[120px]"
          preserveAspectRatio="none"
          onMouseLeave={() => onHover(null)}
        >
          <path d={getArea(data.bullish)} fill="#10B981" fillOpacity="0.05" />
          <path d={getArea(data.bearish)} fill="#EF4444" fillOpacity="0.05" />
          {data.neutral && <path d={getArea(data.neutral)} fill="#F59E0B" fillOpacity="0.03" />}

          <path
            d={getPath(data.bullish)}
            fill="none"
            stroke="#10B981"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={getPath(data.bearish)}
            fill="none"
            stroke="#EF4444"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
          {data.neutral && (
            <path
              d={getPath(data.neutral)}
              fill="none"
              stroke="#F59E0B"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              vectorEffect="non-scaling-stroke"
              opacity="0.6"
            />
          )}

          {data.labels.map((_, i) => (
            <rect
              key={i}
              x={i * step - step / 2}
              y="0"
              width={step}
              height={h}
              fill="transparent"
              className="cursor-crosshair"
              onMouseEnter={() => onHover(i)}
            />
          ))}

          {hoverIdx !== null && (
            <line
              x1={hoverIdx * step}
              y1="0"
              x2={hoverIdx * step}
              y2={h}
              stroke={isDark ? '#fff' : '#000'}
              strokeOpacity="0.1"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        {hoverIdx !== null && data.labels[hoverIdx] && (
          <div
            className={cn(
              'absolute top-2 px-3 py-1.5 rounded-xl border backdrop-blur-md pointer-events-none z-20',
              isDark ? 'bg-black/80 border-white/10' : 'bg-white/80 border-black/10'
            )}
            style={{
              left: `clamp(0px, calc(${(hoverIdx / (pts - 1)) * 100}% - 50px), calc(100% - 100px))`
            }}
          >
            <div className="text-[10px] font-black opacity-40 mb-1">{data.labels[hoverIdx]}</div>
            <div className="flex gap-4">
              <span className="text-[11px] font-black text-green-500">{data.bullish[hoverIdx]}</span>
              <span className="text-[11px] font-black text-red-500">{data.bearish[hoverIdx]}</span>
              {data.neutral && <span className="text-[11px] font-black text-amber-500">{data.neutral[hoverIdx]}</span>}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 sm:gap-8 justify-center pt-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className={cn('text-[11px] font-black tracking-widest opacity-70', isDark ? 'text-white' : 'text-black')}>BULLISH</span>
          <span className="text-sm font-black text-green-500 tabular-nums">{totalBull.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
          <span className={cn('text-[11px] font-black tracking-widest opacity-70', isDark ? 'text-white' : 'text-black')}>BEARISH</span>
          <span className="text-sm font-black text-red-500 tabular-nums">{totalBear.toLocaleString()}</span>
        </div>
        {totalNeutral > 0 && (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            <span className={cn('text-[11px] font-black tracking-widest opacity-70', isDark ? 'text-white' : 'text-black')}>NEUTRAL</span>
            <span className="text-sm font-black text-amber-500 tabular-nums">{totalNeutral.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
});
SentimentChart.displayName = 'SentimentChart';

const SourcesMenu = memo(({ sources, selectedSource, onSourceSelect, isMobile, isDark }) => {
  const [showAll, setShowAll] = useState(false);
  const sortedSources = useMemo(
    () => Object.entries(sources).sort(([, a], [, b]) => b.count - a.count),
    [sources]
  );
  const displayLimit = isMobile ? 6 : 14;
  const displayedSources = showAll ? sortedSources : sortedSources.slice(0, displayLimit);
  const hiddenCount = sortedSources.length - displayLimit;

  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-nowrap sm:flex-wrap items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
        <button
          onClick={() => onSourceSelect(null)}
          className={cn(
            'rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-[background-color,box-shadow] shrink-0',
            !selectedSource
              ? 'bg-[#0a5cc5] text-white shadow-lg shadow-primary/20'
              : isDark
                ? 'text-gray-300 bg-white/5 hover:bg-white/10'
                : 'text-gray-500 bg-black/5 hover:bg-black/10'
          )}
        >
          All
        </button>
        {displayedSources.map(([source, data]) => {
          const isSelected = selectedSource === source;
          return (
            <button
              key={source}
              onClick={() => onSourceSelect(source)}
              className={cn(
                'group flex items-center gap-2 rounded-xl px-4 py-2 text-[11px] font-bold transition-[background-color,box-shadow] shrink-0',
                isSelected
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : isDark
                    ? 'text-gray-300 bg-white/5 hover:bg-white/10 hover:text-white'
                    : 'text-gray-500 bg-black/5 hover:bg-black/10 hover:text-black'
              )}
            >
              {data.sentiment && (() => {
                const bull = parseFloat(data.sentiment.Bullish || 0);
                const bear = parseFloat(data.sentiment.Bearish || 0);
                const color = bull > bear ? 'bg-green-500' : bear > bull ? 'bg-red-500' : 'bg-amber-500';
                return <div className={cn('h-1.5 w-1.5 rounded-full shrink-0', color)} />;
              })()}
              {source}
              <span className={cn(
                'tabular-nums opacity-80',
                isSelected && 'opacity-90'
              )}>
                {data.count}
              </span>
            </button>
          );
        })}
        {sortedSources.length > displayLimit && (
          <button
            onClick={() => setShowAll(!showAll)}
            className={cn(
              'px-4 py-2 text-[11px] font-bold opacity-60 hover:opacity-100 transition-opacity',
              isDark ? 'text-white' : 'text-black'
            )}
          >
            {showAll ? 'LESS' : `+${hiddenCount} MORE`}
          </button>
        )}
      </div>
    </div>
  );
});
SourcesMenu.displayName = 'SourcesMenu';

const proxyImageUrl = (url) => url ? `/api/news-image?url=${encodeURIComponent(url)}` : null;

const NewsImageFallback = ({ isDark, className }) => (
  <div className={cn(
    'flex flex-col items-center justify-center gap-1.5 w-full h-full',
    isDark ? 'bg-[#111] text-[#9CA3AF]' : 'bg-[#F1F5F9] text-[#64748B]',
    className
  )}>
    <ImageOff size={24} strokeWidth={1.2} />
    <span className={cn('text-[10px] font-medium', isDark ? 'text-[#4B5563]' : 'text-[#94A3B8]')}>
      Image Unavailable
    </span>
  </div>
);

const NewsImage = memo(({ src, isDark, className }) => {
  const [errored, setErrored] = useState(false);
  if (errored) return <NewsImageFallback isDark={isDark} className={className} />;
  return (
    <img
      src={src}
      alt=""
      className={cn('w-full h-full object-cover', className)}
      loading="lazy"
      onError={() => setErrored(true)}
    />
  );
});
NewsImage.displayName = 'NewsImage';

const NewsArticle = memo(({ article, isDark, extractTitle }) => (
  <a
    href={article.sourceUrl}
    target="_blank"
    rel="noopener noreferrer"
    className={cn(
      'group relative flex flex-col sm:flex-row gap-3 sm:gap-4 rounded-[16px] sm:rounded-[20px] p-4 sm:p-5 transition-[background-color,border-color] duration-300 active:scale-[0.99] min-w-0 overflow-hidden',
      isDark
        ? 'bg-white/[0.02] hover:bg-white/[0.04] border border-white/5'
        : 'bg-[#fcfcfc] border border-black/[0.03] hover:border-primary/20'
    )}
  >
    {article.articleImage && (
      <div className="sm:hidden shrink-0 w-full h-[160px] rounded-xl overflow-hidden -mt-0.5">
        <NewsImage src={proxyImageUrl(article.articleImage)} isDark={isDark} />
      </div>
    )}
    <div className="flex flex-col gap-2 sm:gap-3 flex-1 min-w-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn('text-[11px] sm:text-[12px] font-black uppercase tracking-wider truncate', isDark ? 'text-white/60' : 'text-black/50')}>
            {article.sourceName}
          </span>
          <div className={cn('h-1 w-1 rounded-full shrink-0', isDark ? 'bg-white/10' : 'bg-black/5')} />
          <span className={cn('text-[10px] font-bold opacity-60 shrink-0', isDark ? 'text-white' : 'text-black')}>
            {formatDistanceToNow(new Date(article.pubDate), { addSuffix: true })}
          </span>
        </div>

        <span
          className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-md shrink-0"
          style={{
            color: getSentimentColor(article.sentiment),
            backgroundColor: `${getSentimentColor(article.sentiment)}15`
          }}
        >
          {article.sentiment || 'NEUTRAL'}
        </span>
      </div>

      <h2 className={cn(
        'text-[14px] sm:text-[15px] font-bold leading-snug transition-colors group-hover:text-primary',
        isDark ? 'text-white' : 'text-black'
      )}>
        {article.normalizedTitle || extractTitle(article.title)}
      </h2>

      <p className={cn(
        'line-clamp-2 text-[12px] sm:text-[13px] leading-relaxed opacity-50',
        isDark ? 'text-white' : 'text-black'
      )}>
        {article.summary}
      </p>

      <div className="pt-1 sm:pt-2 flex items-center gap-1.5 text-[11px] font-black text-primary uppercase tracking-widest sm:opacity-0 sm:group-hover:opacity-100 opacity-70 transition-opacity">
        Read Story <ArrowRight size={14} />
      </div>
    </div>

    {article.articleImage && (
      <div className="hidden sm:block shrink-0 w-[140px] h-[100px] rounded-xl overflow-hidden self-center">
        <NewsImage src={proxyImageUrl(article.articleImage)} isDark={isDark} />
      </div>
    )}
  </a>
));
NewsArticle.displayName = 'NewsArticle';

const Pagination = memo(({ currentPage, totalPages, onPageChange, isDark }) => {
  if (totalPages <= 1) return null;

  const pages = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, '...', totalPages];
    if (currentPage >= totalPages - 2)
      return [1, '...', totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', currentPage, '...', totalPages];
  }, [currentPage, totalPages]);

  return (
    <div className="mt-8 flex items-center justify-center gap-1.5">
      <button
        onClick={() => onPageChange(null, currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-xl border transition-[background-color,border-color] disabled:opacity-30',
          isDark
            ? 'bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/10'
            : 'bg-white border-black/[0.05] hover:border-black/20 hover:bg-black/[0.02]'
        )}
      >
        <ChevronLeft size={16} className={isDark ? "text-white" : "text-black"} />
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span
            key={`e${i}`}
            className={cn('px-2 text-[12px] font-bold opacity-60', isDark ? 'text-white' : 'text-black')}
          >
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(null, p)}
            className={cn(
              'flex h-9 min-w-[36px] items-center justify-center rounded-xl text-[12px] font-bold tabular-nums border transition-[background-color,border-color,box-shadow,transform] duration-300',
              p === currentPage
                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105'
                : isDark
                  ? 'text-gray-400 bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/10'
                  : 'text-gray-600 bg-white border-black/[0.05] hover:border-black/20 hover:bg-black/[0.02]'
            )}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(null, currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-xl border transition-[background-color,border-color] disabled:opacity-30',
          isDark
            ? 'bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/10'
            : 'bg-white border-black/[0.05] hover:border-black/20 hover:bg-black/[0.02]'
        )}
      >
        <ChevronRight size={16} className={isDark ? "text-white" : "text-black"} />
      </button>
    </div>
  );
});
Pagination.displayName = 'Pagination';

function NewsPage({
  initialNews,
  initialTotal,
  initialSources,
  initialSentiment,
  initialChart,
  initialQuery
}) {
  const router = useRouter();
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [isMobile, setIsMobile] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [news, setNews] = useState(initialNews);
  const [error, setError] = useState(null);
  const [selectedSource, setSelectedSource] = useState(initialQuery.source || null);
  const [searchQuery, setSearchQuery] = useState(initialQuery.q || '');
  const [searchInput, setSearchInput] = useState(initialQuery.q || '');
  const [currentPage, setCurrentPage] = useState(initialQuery.page);
  const [itemsPerPage, setItemsPerPage] = useState(initialQuery.limit);
  const [totalCount, setTotalCount] = useState(initialTotal);
  const [sentimentStats, setSentimentStats] = useState(initialSentiment);
  const [sourcesStats, setSourcesStats] = useState(initialSources);
  const [searchSentimentScore, setSearchSentimentScore] = useState(null);
  const [chartData, setChartData] = useState(initialChart);
  const [chartPeriod, setChartPeriod] = useState(30);
  const [chartHover, setChartHover] = useState(null);

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const extractTitle = useCallback((html) => html.match(/>([^<]+)</)?.[1] || html, []);

  // Register server-side API calls
  useEffect(() => {
    registerApiCalls([
      'https://api.xrpl.to/v1/news',
      'https://api.xrpl.to/v1/news/search',
      'https://api.xrpl.to/v1/news/sentiment-chart'
    ]);
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const updateUrl = useCallback(
    (params) => {
      const query = { page: params.page || 1 };
      if (params.limit && params.limit !== 10) query.limit = params.limit;
      if (params.source) query.source = params.source;
      if (params.q) query.q = params.q;
      router.push({ pathname: '/news', query }, undefined, { shallow: true });
    },
    [router]
  );

  const handlePageChange = useCallback(
    (_, value) => {
      setCurrentPage(value);
      updateUrl({ page: value, limit: itemsPerPage, source: selectedSource, q: searchQuery });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [itemsPerPage, selectedSource, searchQuery, updateUrl]
  );

  const handleSourceSelect = useCallback(
    (source) => {
      setSelectedSource(source);
      setCurrentPage(1);
      updateUrl({ page: 1, limit: itemsPerPage, source, q: searchQuery });
    },
    [itemsPerPage, searchQuery, updateUrl]
  );

  const handleSearch = useCallback(
    (e) => {
      e.preventDefault();
      setSearchQuery(searchInput);
      setCurrentPage(1);
      updateUrl({ page: 1, limit: itemsPerPage, source: selectedSource, q: searchInput });
    },
    [searchInput, itemsPerPage, selectedSource, updateUrl]
  );

  const handleClearSearch = useCallback(() => {
    setSearchInput('');
    setSearchQuery('');
    setSearchSentimentScore(null);
    setCurrentPage(1);
    updateUrl({ page: 1, limit: itemsPerPage, source: selectedSource });
  }, [itemsPerPage, selectedSource, updateUrl]);

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const fetchNews = async () => {
      try {
        const params = new URLSearchParams({ page: currentPage, limit: itemsPerPage });
        if (selectedSource) params.append('source', selectedSource);
        const endpoint = searchQuery
          ? `https://api.xrpl.to/v1/news/search?q=${encodeURIComponent(searchQuery)}&${params}`
          : `https://api.xrpl.to/v1/news?${params}`;

        const res = await fetch(endpoint);
        if (!res.ok) throw new Error('Failed to fetch news');
        const data = await res.json();

        if (data.data && Array.isArray(data.data)) {
          setNews(data.data);
          setTotalCount(data.pagination?.total || 0);
          setSearchSentimentScore(searchQuery ? (data.sentiment_score ?? null) : null);
          if (data.sources) {
            setSourcesStats(
              data.sources.reduce(
                (acc, s) => ({ ...acc, [s.name]: { count: s.count, sentiment: s.sentiment } }),
                {}
              )
            );
          }
          if (data.sentiment) {
            const parse = (p) => ({
              bullish: parseFloat(p?.Bullish || 0),
              bearish: parseFloat(p?.Bearish || 0),
              neutral: parseFloat(p?.Neutral || 0)
            });
            setSentimentStats({
              last24h: parse(data.sentiment['24h']),
              last7d: parse(data.sentiment['7d']),
              last30d: parse(data.sentiment['30d']),
              all: parse(data.sentiment['all'])
            });
          }
        } else if (Array.isArray(data)) {
          setNews(data);
          setTotalCount(data.length);
          setSourcesStats(
            data.reduce((acc, a) => {
              const s = a.sourceName || 'Unknown';
              acc[s] = { count: (acc[s]?.count || 0) + 1 };
              return acc;
            }, {})
          );
        } else {
          setNews([]);
          setTotalCount(0);
          setSourcesStats({});
        }
      } catch (err) {
        setError(err.message);
      }
    };
    fetchNews();
  }, [currentPage, itemsPerPage, selectedSource, searchQuery]);

  useEffect(() => {
    const fetchChart = async () => {
      try {
        const res = await apiFetch(
          `https://api.xrpl.to/v1/news/sentiment-chart?days=${chartPeriod === 'all' ? 9999 : chartPeriod}`
        );
        if (res.ok) setChartData(await res.json());
      } catch { }
    };
    fetchChart();
    const interval = setInterval(fetchChart, 60000);
    return () => clearInterval(interval);
  }, [chartPeriod]);

  return (
    <div className={cn('flex min-h-screen flex-col overflow-x-hidden', isDark ? 'bg-transparent' : 'bg-white')}>
      <Header
        notificationPanelOpen={notificationPanelOpen}
        onNotificationPanelToggle={setNotificationPanelOpen}
      />
      <h1 className="sr-only">XRPL News & Updates</h1>
      <div
        className={cn(
          'flex-1 mt-4 pb-4 sm:pb-6 min-w-0',
          notificationPanelOpen ? 'px-4' : 'mx-auto max-w-[1920px] px-4 w-full'
        )}
      >
        {error ? (
          <p className="py-8 text-center text-red-500">Error: {error}</p>
        ) : (
          <>
            <div className="mb-6 sm:mb-8 flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-baseline gap-3">
                  <h1 className={cn('text-xl sm:text-2xl font-black tracking-tight', isDark ? 'text-white' : 'text-black')}>
                    News
                  </h1>
                  <span className={cn('text-[11px] font-black tabular-nums opacity-60', isDark ? 'text-white' : 'text-black')}>
                    {totalCount.toLocaleString()} articles
                  </span>
                </div>
                <p className={cn('text-[12px] font-bold opacity-60 hidden sm:block', isDark ? 'text-white' : 'text-black')}>
                  Discover the latest pulse of the XRP Ledger ecosystem
                </p>
              </div>
              <div className="flex items-center gap-3">
                <form
                  onSubmit={handleSearch}
                  className={cn(
                    'group relative flex items-center gap-2 rounded-lg border px-2.5 py-2 sm:py-1.5 transition-[background-color,border-color,box-shadow] duration-300 w-full sm:w-[320px]',
                    isDark
                      ? 'bg-white/[0.02] border-white/10 focus-within:border-primary focus-within:bg-white/[0.05]'
                      : 'bg-white border-black/[0.05] focus-within:border-primary focus-within:shadow-[0_4px_20px_rgba(37,99,235,0.08)]'
                  )}
                >
                  <Search size={18} className={cn('shrink-0 opacity-30 transition-opacity group-focus-within:opacity-100', isDark ? 'text-white' : 'text-black')} />
                  <input
                    type="text"
                    placeholder="Search keywords..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className={cn(
                      'w-full bg-transparent text-[14px] sm:text-[13px] font-bold focus:outline-none',
                      isDark ? 'text-white placeholder:text-white/20' : 'text-black placeholder:text-black/20'
                    )}
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      aria-label="Clear search"
                      className="p-1 opacity-60 hover:opacity-100 transition-opacity"
                    >
                      <X size={16} />
                    </button>
                  )}
                </form>
                <div className="hidden sm:block">
                  <ApiButton />
                </div>
              </div>
            </div>

            <div
              className={cn(
                'mb-8 sm:mb-10 overflow-hidden rounded-[16px] sm:rounded-[24px] border transition-[border-color]',
                isDark
                  ? 'bg-[#0a0a0a] border-white/5'
                  : 'bg-white border-black/[0.03]'
              )}
            >
              <div className="p-4 sm:p-8">
                <SentimentChart
                  data={chartData}
                  period={chartPeriod}
                  onPeriodChange={setChartPeriod}
                  onHover={setChartHover}
                  hoverIdx={chartHover}
                  isDark={isDark}
                />
              </div>

              <div className={cn(
                'grid grid-cols-2 lg:grid-cols-4 border-t',
                isDark ? 'border-white/5' : 'border-black/[0.03]'
              )}>
                {[
                  { period: '24h', stats: sentimentStats.last24h },
                  { period: '7d', stats: sentimentStats.last7d },
                  { period: '30d', stats: sentimentStats.last30d },
                  { period: 'All', stats: sentimentStats.all }
                ].map((item) => (
                  <div key={item.period} className={cn(
                    "p-4 sm:p-6 flex flex-col gap-2 sm:gap-3 group transition-[background-color]",
                    isDark ? "hover:bg-white/[0.02]" : "hover:bg-black/[0.01]",
                    "border-l first:border-l-0",
                    isDark ? "border-white/5" : "border-black/[0.03]",
                    "max-sm:border-l-0 max-sm:even:border-l max-sm:[&:nth-child(n+3)]:border-t"
                  )}>
                    <span className={cn('text-[11px] font-black uppercase tracking-widest opacity-60', isDark ? 'text-white' : 'text-black')}>
                      {item.period}
                    </span>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-black">
                        <span className="text-green-500">{item.stats?.bullish || 0}%</span>
                        <span className="text-amber-400">{item.stats?.neutral || 0}%</span>
                        <span className="text-red-500">{item.stats?.bearish || 0}%</span>
                      </div>
                      <div className={cn(
                        'flex h-1 w-full overflow-hidden rounded-full',
                        isDark ? 'bg-white/5' : 'bg-black/[0.05]'
                      )}>
                        <div
                          style={{ width: `${item.stats?.bullish || 0}%` }}
                          className="bg-green-500 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                        />
                        <div
                          style={{ width: `${item.stats?.neutral || 0}%` }}
                          className="bg-amber-500 opacity-60"
                        />
                        <div
                          style={{ width: `${item.stats?.bearish || 0}%` }}
                          className="bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.2)]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {searchQuery && searchSentimentScore !== null && (
                <div className={cn(
                  "px-8 py-3 border-t flex items-center justify-between",
                  isDark ? "bg-primary/5 border-white/5" : "bg-primary/[0.01] border-black/[0.03]"
                )}>
                  <span className={cn("text-[11px] font-bold opacity-60", isDark ? "text-white" : "text-black")}>
                    Search Sentiment Score for <span className="text-primary italic">"{searchQuery}"</span>
                  </span>
                  <span className="text-sm font-black text-primary tabular-nums">
                    {searchSentimentScore}
                  </span>
                </div>
              )}
            </div>

            <SourcesMenu
              sources={sourcesStats}
              selectedSource={selectedSource}
              onSourceSelect={handleSourceSelect}
              isMobile={isMobile}
              isDark={isDark}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-3 sm:gap-5 min-w-0">
              {news.length === 0 ? (
                <div className={cn(
                  "col-span-full py-24 rounded-[32px] border border-dashed flex flex-col items-center justify-center text-center",
                  isDark ? "border-white/10 bg-white/[0.01]" : "border-black/10 bg-black/[0.01]"
                )}>
                  <h3 className={cn("text-xl font-black mb-2 uppercase tracking-tighter", isDark ? "text-white" : "text-black")}>
                    No Updates Found
                  </h3>
                  <p className={cn("text-[12px] font-bold max-w-xs px-4 opacity-30", isDark ? "text-white" : "text-black")}>
                    Try adjusting your search keywords or clearing the source filters.
                  </p>
                  <button
                    onClick={handleClearSearch}
                    className="mt-8 text-[11px] font-black uppercase tracking-widest text-primary hover:opacity-70 transition-opacity"
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                news.map((article) => (
                  <NewsArticle
                    key={article._id}
                    article={article}
                    isDark={isDark}
                    extractTitle={extractTitle}
                  />
                ))
              )}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              isDark={isDark}
            />
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default NewsPage;

export async function getServerSideProps({ query }) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const { source, q } = query;

  const params = new URLSearchParams({ page, limit });
  if (source) params.append('source', source);

  const endpoint = q
    ? `https://api.xrpl.to/v1/news/search?q=${encodeURIComponent(q)}&${params}`
    : `https://api.xrpl.to/v1/news?${params}`;

  try {
    const newsController = new AbortController();
    const chartController = new AbortController();
    const newsTimeout = setTimeout(() => newsController.abort(), 8000);
    const chartTimeout = setTimeout(() => chartController.abort(), 8000);
    const [newsRes, chartRes] = await Promise.all([
      fetch(endpoint, { signal: newsController.signal }),
      apiFetch('https://api.xrpl.to/v1/news/sentiment-chart?days=30', { signal: chartController.signal })
    ]);
    clearTimeout(newsTimeout);
    clearTimeout(chartTimeout);

    if (!newsRes.ok) {
      console.error('News API error:', newsRes.status, newsRes.statusText);
      throw new Error(`News API returned ${newsRes.status}`);
    }

    const newsText = await newsRes.text();
    let newsData;
    try { newsData = JSON.parse(newsText); } catch { newsData = []; }
    const chartData = chartRes.ok ? await chartRes.json() : null;

    const parse = (p) => ({
      bullish: parseFloat(p?.Bullish || 0),
      bearish: parseFloat(p?.Bearish || 0),
      neutral: parseFloat(p?.Neutral || 0)
    });

    // Handle both { data: [...] } and direct array response
    const newsArray = Array.isArray(newsData) ? newsData : newsData.data || [];
    const total = Array.isArray(newsData) ? newsData.length : newsData.pagination?.total || 0;
    const sources = Array.isArray(newsData)
      ? {}
      : newsData.sources?.reduce(
        (acc, s) => ({ ...acc, [s.name]: { count: s.count, sentiment: s.sentiment } }),
        {}
      ) || {};

    return {
      props: {
        initialNews: newsArray,
        initialTotal: total,
        initialSources: sources,
        initialSentiment: newsData.sentiment
          ? {
            last24h: parse(newsData.sentiment['24h']),
            last7d: parse(newsData.sentiment['7d']),
            last30d: parse(newsData.sentiment['30d']),
            all: parse(newsData.sentiment['all'])
          }
          : { last24h: {}, last7d: {}, last30d: {}, all: {} },
        initialChart: chartData,
        initialQuery: { page, limit, source: source || null, q: q || null },
        ogp: {
          canonical: 'https://xrpl.to/news',
          title: 'XRPL News - Latest Crypto & XRP Ledger Updates',
          url: 'https://xrpl.to/news',
          imgUrl: 'https://xrpl.to/api/og/news',
          imgType: 'image/png',
          imgWidth: '1200',
          imgHeight: '630',
          imgAlt: 'XRPL.to News - Latest cryptocurrency and XRP Ledger news',
          desc: 'Stay updated with the latest XRPL news, market sentiment analysis, and cryptocurrency updates from trusted sources'
        }
      }
    };
  } catch (err) {
    console.error('News SSR fetch error:', err.message);
    return {
      props: {
        initialNews: [],
        initialTotal: 0,
        initialSources: {},
        initialSentiment: { last24h: {}, last7d: {}, last30d: {}, all: {} },
        initialChart: null,
        initialQuery: { page: 1, limit: 10, source: null, q: null },
        ogp: {
          canonical: 'https://xrpl.to/news',
          title: 'XRPL News - Latest Crypto & XRP Ledger Updates',
          url: 'https://xrpl.to/news',
          imgUrl: 'https://xrpl.to/api/og/news',
          imgType: 'image/png',
          imgWidth: '1200',
          imgHeight: '630',
          imgAlt: 'XRPL.to News - Latest cryptocurrency and XRP Ledger news',
          desc: 'Stay updated with the latest XRPL news, market sentiment analysis, and cryptocurrency updates from trusted sources'
        }
      }
    };
  }
}
