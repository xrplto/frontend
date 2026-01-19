import { useState, useEffect, useMemo, useCallback, memo, useContext, useRef } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import { cn } from 'src/utils/cn';
import { AppContext } from 'src/AppContext';
import { ApiButton, registerApiCalls } from 'src/components/ApiEndpointsModal';

const Header = dynamic(() => import('../src/components/Header'), { ssr: true });
const Footer = dynamic(() => import('../src/components/Footer'), { ssr: true });

const SENTIMENT_COLORS = { bullish: '#10B981', bearish: '#EF4444', neutral: '#F59E0B', default: '#9CA3AF' };
const getSentimentColor = (s) => SENTIMENT_COLORS[s?.toLowerCase()] || SENTIMENT_COLORS.default;

const ChevronLeft = () => <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />;
const ChevronRight = () => <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />;
const SearchIcon = () => <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />;
const CloseIcon = () => <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />;

const SentimentChart = memo(({ data, period, onPeriodChange, onHover, hoverIdx, isDark }) => {
  if (!data?.labels?.length) return null;

  const maxVal = Math.max(...data.bullish, ...data.bearish, 1);
  const w = 100, h = 40, pts = data.labels.length;
  const step = w / Math.max(pts - 1, 1);
  const getY = (val) => h - (val / maxVal) * h;

  const getPath = (arr) => arr.map((v, i) => `${i ? 'L' : 'M'}${i * step},${getY(v)}`).join(' ');
  const getArea = (arr) => `${getPath(arr)} L${(pts - 1) * step},${h} L0,${h} Z`;

  const totalBull = data.bullish.reduce((a, b) => a + b, 0);
  const totalBear = data.bearish.reduce((a, b) => a + b, 0);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <span className={cn("text-[11px] font-medium uppercase tracking-wide", isDark ? "text-gray-500" : "text-gray-400")}>Sentiment</span>
        <div className="flex items-center gap-1">
          {[7, 30, 90, 'all'].map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={cn("rounded-lg px-2 py-0.5 text-[10px] font-medium border-[1.5px] transition-all", period === p ? "bg-primary text-white border-primary" : isDark ? "text-gray-500 border-white/10 hover:border-white/[0.15] hover:bg-white/[0.02]" : "text-gray-400 border-black/[0.06] hover:border-black/10 hover:bg-black/[0.01]")}
            >
              {p === 'all' ? 'All' : `${p}D`}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-end gap-4">
        <div className="relative flex-1">
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[60px]" preserveAspectRatio="none" onMouseLeave={() => onHover(null)}>
            <path d={getArea(data.bullish)} fill="#10B981" fillOpacity="0.15" />
            <path d={getArea(data.bearish)} fill="#EF4444" fillOpacity="0.1" />
            <path d={getPath(data.bullish)} fill="none" stroke="#10B981" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <path d={getPath(data.bearish)} fill="none" stroke="#EF4444" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            {data.labels.map((_, i) => (
              <rect key={i} x={i * step - step / 2} y="0" width={step} height={h} fill="transparent" onMouseEnter={() => onHover(i)} />
            ))}
            {hoverIdx !== null && <line x1={hoverIdx * step} y1="0" x2={hoverIdx * step} y2={h} stroke={isDark ? "#fff" : "#000"} strokeOpacity="0.2" strokeWidth="1" vectorEffect="non-scaling-stroke" />}
          </svg>
          {hoverIdx !== null && data.labels[hoverIdx] && (
            <div className={cn("absolute top-0 -translate-y-full -translate-x-1/2 mb-1 px-2 py-1 rounded text-[10px] whitespace-nowrap pointer-events-none z-10", isDark ? "bg-gray-800 text-white" : "bg-gray-900 text-white")} style={{ left: `${(hoverIdx / (pts - 1)) * 100}%` }}>
              <div className="font-medium">{data.labels[hoverIdx]}</div>
              <div className="flex gap-2">
                <span className="text-green-400">{data.bullish[hoverIdx]}</span>
                <span className="text-red-400">{data.bearish[hoverIdx]}</span>
                <span className="text-yellow-400">{data.neutral?.[hoverIdx] || 0}</span>
              </div>
            </div>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className={cn("text-[10px]", isDark ? "text-gray-500" : "text-gray-400")}>Bullish</span>
            <span className="text-[11px] text-green-500 tabular-nums font-medium">{totalBull.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <span className={cn("text-[10px]", isDark ? "text-gray-500" : "text-gray-400")}>Bearish</span>
            <span className="text-[11px] text-red-500 tabular-nums font-medium">{totalBear.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </>
  );
});
SentimentChart.displayName = 'SentimentChart';

const SourcesMenu = memo(({ sources, selectedSource, onSourceSelect, isMobile, isDark }) => {
  const [showAll, setShowAll] = useState(false);
  const sortedSources = useMemo(() => Object.entries(sources).sort(([, a], [, b]) => b.count - a.count), [sources]);
  const displayLimit = isMobile ? 8 : 14;
  const displayedSources = showAll ? sortedSources : sortedSources.slice(0, displayLimit);
  const hiddenCount = sortedSources.length - displayLimit;

  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => onSourceSelect(null)}
          className={cn("rounded-xl px-2 py-1 text-[11px] font-medium border-[1.5px] transition-all", !selectedSource ? "bg-primary text-white border-primary" : isDark ? "text-gray-400 border-white/10 hover:border-white/[0.15] hover:bg-white/[0.02]" : "text-gray-500 border-black/[0.06] hover:border-black/10 hover:bg-black/[0.01]")}
        >
          All Sources
        </button>
        {displayedSources.map(([source, data]) => {
          const bull = data.sentiment?.Bullish || 0;
          const isSelected = selectedSource === source;
          return (
            <button
              key={source}
              onClick={() => onSourceSelect(source)}
              className={cn("group relative flex items-center gap-1 rounded-xl px-2 py-1 text-[11px] border-[1.5px] transition-all", isSelected ? "bg-primary text-white border-primary" : isDark ? "text-gray-400 border-white/10 hover:border-white/[0.15] hover:bg-white/[0.02]" : "text-gray-600 border-black/[0.06] hover:border-black/10 hover:bg-black/[0.01]")}
            >
              <span className="font-medium">{source}</span>
              <span className={cn("tabular-nums", isSelected ? "opacity-70" : "opacity-40")}>{data.count}</span>
              {bull > 0 && !isSelected && <span className={cn("h-1.5 w-1.5 rounded-full", bull > 60 ? "bg-green-500" : bull < 40 ? "bg-red-500" : "bg-yellow-500")} />}
            </button>
          );
        })}
        {sortedSources.length > displayLimit && (
          <button onClick={() => setShowAll(!showAll)} className={cn("rounded-xl px-2 py-1 text-[11px] border-[1.5px] transition-all", isDark ? "text-gray-500 border-white/10 hover:border-white/[0.15] hover:bg-white/[0.02]" : "text-gray-400 border-black/[0.06] hover:border-black/10 hover:bg-black/[0.01]")}>
            {showAll ? 'Less' : `+${hiddenCount}`}
          </button>
        )}
      </div>
    </div>
  );
});
SourcesMenu.displayName = 'SourcesMenu';

const NewsArticle = memo(({ article, isDark, extractTitle }) => (
  <a
    href={article.sourceUrl}
    target="_blank"
    rel="noopener noreferrer"
    className={cn("group flex gap-4 rounded-xl border-[1.5px] p-4 transition-all", isDark ? "border-white/10 bg-transparent hover:border-white/[0.15] hover:bg-white/[0.02]" : "border-black/[0.06] hover:border-black/10 hover:bg-black/[0.01]")}
  >
    <div className="w-1 shrink-0 rounded-full" style={{ backgroundColor: getSentimentColor(article.sentiment) }} />
    <div className="min-w-0 flex-1">
      <div className="mb-1.5 flex items-center gap-2">
        <span className={cn("text-[11px] font-medium", isDark ? "text-gray-400" : "text-gray-500")}>{article.sourceName}</span>
        <span className={cn("text-[10px]", isDark ? "text-gray-600" : "text-gray-400")}>{formatDistanceToNow(new Date(article.pubDate), { addSuffix: true })}</span>
        <span className="ml-auto shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium uppercase" style={{ color: getSentimentColor(article.sentiment), backgroundColor: `${getSentimentColor(article.sentiment)}15` }}>
          {article.sentiment || 'N/A'}
        </span>
      </div>
      <h3 className={cn("mb-1 text-[14px] font-medium leading-snug transition-colors group-hover:text-primary", isDark ? "text-white" : "text-gray-900")}>{extractTitle(article.title)}</h3>
      <p className={cn("line-clamp-1 text-[12px] leading-relaxed", isDark ? "text-gray-500" : "text-gray-500")}>{article.summary}</p>
    </div>
    <div className={cn("flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100", isDark ? "text-gray-500" : "text-gray-400")}>
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><ChevronRight /></svg>
    </div>
  </a>
));
NewsArticle.displayName = 'NewsArticle';

const Pagination = memo(({ currentPage, totalPages, onPageChange, isDark }) => {
  if (totalPages <= 1) return null;

  const pages = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, '...', totalPages];
    if (currentPage >= totalPages - 2) return [1, '...', totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', currentPage, '...', totalPages];
  }, [currentPage, totalPages]);

  return (
    <div className="mt-6 flex items-center justify-center gap-1">
      <button onClick={() => onPageChange(null, currentPage - 1)} disabled={currentPage === 1} className={cn("flex h-8 w-8 items-center justify-center rounded-xl border-[1.5px] transition-all disabled:opacity-30", isDark ? "border-white/10 hover:border-white/[0.15] hover:bg-white/[0.02]" : "border-black/[0.06] hover:border-black/10 hover:bg-black/[0.01]")}>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><ChevronLeft /></svg>
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`e${i}`} className={cn("px-1 text-[12px]", isDark ? "text-gray-600" : "text-gray-400")}>...</span>
        ) : (
          <button key={p} onClick={() => onPageChange(null, p)} className={cn("flex h-8 min-w-[32px] items-center justify-center rounded-xl text-[12px] tabular-nums border-[1.5px] transition-all", p === currentPage ? "bg-primary text-white border-primary" : isDark ? "text-gray-400 border-white/10 hover:border-white/[0.15] hover:bg-white/[0.02]" : "text-gray-600 border-black/[0.06] hover:border-black/10 hover:bg-black/[0.01]")}>{p}</button>
        )
      )}
      <button onClick={() => onPageChange(null, currentPage + 1)} disabled={currentPage === totalPages} className={cn("flex h-8 w-8 items-center justify-center rounded-xl border-[1.5px] transition-all disabled:opacity-30", isDark ? "border-white/10 hover:border-white/[0.15] hover:bg-white/[0.02]" : "border-black/[0.06] hover:border-black/10 hover:bg-black/[0.01]")}>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><ChevronRight /></svg>
      </button>
      <span className={cn("ml-2 text-[11px] tabular-nums", isDark ? "text-gray-600" : "text-gray-400")}>{currentPage}/{totalPages}</span>
    </div>
  );
});
Pagination.displayName = 'Pagination';


function NewsPage({ initialNews, initialTotal, initialSources, initialSentiment, initialChart, initialQuery }) {
  const router = useRouter();
  const { themeName } = useContext(AppContext);
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
      'https://api.xrpl.to/api/news',
      'https://api.xrpl.to/api/news/search',
      'https://api.xrpl.to/api/news/sentiment-chart'
    ]);
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const updateUrl = useCallback((params) => {
    const query = { page: params.page || 1 };
    if (params.limit && params.limit !== 10) query.limit = params.limit;
    if (params.source) query.source = params.source;
    if (params.q) query.q = params.q;
    router.push({ pathname: '/news', query }, undefined, { shallow: true });
  }, [router]);

  const handlePageChange = useCallback((_, value) => {
    setCurrentPage(value);
    updateUrl({ page: value, limit: itemsPerPage, source: selectedSource, q: searchQuery });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [itemsPerPage, selectedSource, searchQuery, updateUrl]);

  const handleSourceSelect = useCallback((source) => {
    setSelectedSource(source);
    setCurrentPage(1);
    updateUrl({ page: 1, limit: itemsPerPage, source, q: searchQuery });
  }, [itemsPerPage, searchQuery, updateUrl]);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setCurrentPage(1);
    updateUrl({ page: 1, limit: itemsPerPage, source: selectedSource, q: searchInput });
  }, [searchInput, itemsPerPage, selectedSource, updateUrl]);

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
          ? `https://api.xrpl.to/api/news/search?q=${encodeURIComponent(searchQuery)}&${params}`
          : `https://api.xrpl.to/api/news?${params}`;

        const res = await fetch(endpoint);
        if (!res.ok) throw new Error('Failed to fetch news');
        const data = await res.json();

        if (data.data && Array.isArray(data.data)) {
          setNews(data.data);
          setTotalCount(data.pagination?.total || 0);
          setSearchSentimentScore(searchQuery ? data.sentiment_score ?? null : null);
          if (data.sources) {
            setSourcesStats(data.sources.reduce((acc, s) => ({ ...acc, [s.name]: { count: s.count, sentiment: s.sentiment } }), {}));
          }
          if (data.sentiment) {
            const parse = (p) => ({ bullish: parseFloat(p?.Bullish || 0), bearish: parseFloat(p?.Bearish || 0), neutral: parseFloat(p?.Neutral || 0) });
            setSentimentStats({ last24h: parse(data.sentiment['24h']), last7d: parse(data.sentiment['7d']), last30d: parse(data.sentiment['30d']), all: parse(data.sentiment['all']) });
          }
        } else if (Array.isArray(data)) {
          setNews(data);
          setTotalCount(data.length);
          setSourcesStats(data.reduce((acc, a) => { const s = a.sourceName || 'Unknown'; acc[s] = { count: (acc[s]?.count || 0) + 1 }; return acc; }, {}));
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
        const res = await fetch(`https://api.xrpl.to/api/news/sentiment-chart?days=${chartPeriod === 'all' ? 9999 : chartPeriod}`);
        if (res.ok) setChartData(await res.json());
      } catch {}
    };
    fetchChart();
    const interval = setInterval(fetchChart, 60000);
    return () => clearInterval(interval);
  }, [chartPeriod]);

  return (
    <div className={cn("flex min-h-screen flex-col", isDark ? "bg-transparent" : "bg-white")}>
      <Header notificationPanelOpen={notificationPanelOpen} onNotificationPanelToggle={setNotificationPanelOpen} />
      <h1 className="sr-only">XRPL News & Updates</h1>
      <div className={cn('flex-1 mt-4 pb-4 sm:pb-6', notificationPanelOpen ? 'px-4' : 'mx-auto max-w-[1920px] px-4')}>
        {error ? (
          <p className="py-8 text-center text-red-500">Error: {error}</p>
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <h2 className={cn("text-[17px] font-medium", isDark ? "text-white" : "text-gray-900")}>News</h2>
                <span className={cn("rounded px-1.5 py-0.5 text-[11px] tabular-nums", isDark ? "bg-white/10 text-gray-400" : "bg-black/[0.04] text-gray-500")}>{totalCount.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <form onSubmit={handleSearch} className={cn("flex h-9 items-center gap-2 rounded-xl border-[1.5px] px-3 transition-all", isDark ? "border-white/10 bg-transparent focus-within:border-white/[0.15]" : "border-black/[0.06] focus-within:border-black/10")}>
                <svg className={cn("h-4 w-4 shrink-0", isDark ? "text-gray-500" : "text-gray-400")} fill="none" viewBox="0 0 24 24" stroke="currentColor"><SearchIcon /></svg>
                <input type="text" placeholder="Search..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className={cn("w-full min-w-[180px] bg-transparent text-[13px] focus:outline-none sm:w-[240px]", isDark ? "text-white placeholder:text-gray-500" : "text-gray-900 placeholder:text-gray-400")} />
                {searchInput && (
                  <button type="button" onClick={handleClearSearch} className={cn("shrink-0 rounded p-0.5", isDark ? "hover:bg-white/[0.08]" : "hover:bg-black/[0.06]")}>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><CloseIcon /></svg>
                  </button>
                )}
              </form>
              <ApiButton />
              </div>
            </div>

            <div className={cn("mb-4 rounded-xl border-[1.5px] p-3 transition-all", isDark ? "border-white/10 bg-transparent hover:border-white/[0.15] hover:bg-white/[0.02]" : "border-black/[0.06] hover:border-black/10 hover:bg-black/[0.01]")}>
              <SentimentChart data={chartData} period={chartPeriod} onPeriodChange={setChartPeriod} onHover={setChartHover} hoverIdx={chartHover} isDark={isDark} />
              <div className={cn("flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 pt-3 border-t", isDark ? "border-white/[0.06]" : "border-black/[0.04]")}>
                {[{ period: '24H', stats: sentimentStats.last24h }, { period: '7D', stats: sentimentStats.last7d }, { period: '30D', stats: sentimentStats.last30d }, { period: 'ALL', stats: sentimentStats.all }].map((item) => (
                  <div key={item.period} className="flex items-center gap-2">
                    <span className={cn("w-7 text-[10px] font-medium", isDark ? "text-gray-500" : "text-gray-400")}>{item.period}</span>
                    <div className={cn("flex h-1.5 w-20 overflow-hidden rounded-full", isDark ? "bg-white/10" : "bg-black/[0.06]")}>
                      <div style={{ width: `${item.stats?.bullish || 0}%` }} className="bg-green-500" />
                      <div style={{ width: `${item.stats?.bearish || 0}%` }} className="bg-red-500" />
                    </div>
                    <span className="w-8 text-[10px] tabular-nums text-green-500">{item.stats?.bullish || 0}%</span>
                  </div>
                ))}
                {searchQuery && searchSentimentScore !== null && <span className={cn("ml-auto text-[11px] tabular-nums", isDark ? "text-gray-400" : "text-gray-500")}>Score: {searchSentimentScore}</span>}
              </div>
            </div>

            <SourcesMenu sources={sourcesStats} selectedSource={selectedSource} onSourceSelect={handleSourceSelect} isMobile={isMobile} isDark={isDark} />

            <div className="space-y-2">
              {news.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className={cn("absolute -top-1 left-1 w-5 h-5 rounded-full", isDark ? "bg-[#4285f4]" : "bg-blue-400")} />
                    <div className={cn("absolute -top-1 right-1 w-5 h-5 rounded-full", isDark ? "bg-[#4285f4]" : "bg-blue-400")} />
                    <div className={cn("absolute top-0.5 left-2 w-2.5 h-2.5 rounded-full", isDark ? "bg-[#3b78e7]" : "bg-blue-500")} />
                    <div className={cn("absolute top-0.5 right-2 w-2.5 h-2.5 rounded-full", isDark ? "bg-[#3b78e7]" : "bg-blue-500")} />
                    <div className={cn("absolute top-2.5 left-1/2 -translate-x-1/2 w-13 h-13 rounded-full", isDark ? "bg-[#4285f4]" : "bg-blue-400")} style={{ width: '52px', height: '52px' }}>
                      <div className="absolute top-4 left-2.5 w-2 h-1.5 rounded-full bg-[#0a0a0a] rotate-[-10deg]" />
                      <div className="absolute top-4 right-2.5 w-2 h-1.5 rounded-full bg-[#0a0a0a] rotate-[10deg]" />
                      <div className={cn("absolute bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-3 rounded-full", isDark ? "bg-[#5a9fff]" : "bg-blue-300")}>
                        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1 rounded-full bg-[#0a0a0a]" />
                      </div>
                      <div className={cn("absolute bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-1.5 rounded-t-full border-t-[1.5px] border-l-[1.5px] border-r-[1.5px]", isDark ? "border-[#0a0a0a]" : "border-blue-600")} />
                    </div>
                    <div className="absolute top-2.5 left-1/2 -translate-x-1/2 flex flex-col justify-start gap-[2px] pointer-events-none overflow-hidden rounded-full" style={{ width: '52px', height: '52px' }}>
                      {[...Array(12)].map((_, i) => (
                        <div key={i} className={cn("h-[2px] w-full", isDark ? "bg-[#0a0a0a]/40" : "bg-white/40")} />
                      ))}
                    </div>
                  </div>
                  <p className={cn("text-sm font-medium tracking-widest mb-1", isDark ? "text-white/80" : "text-gray-600")}>NO NEWS FOUND</p>
                  <p className={cn("text-xs", isDark ? "text-white/30" : "text-gray-400")}>Try adjusting your search or filters</p>
                </div>
              ) : (
                news.map((article) => <NewsArticle key={article._id} article={article} isDark={isDark} extractTitle={extractTitle} />)
              )}
            </div>

            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} isDark={isDark} />
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
    ? `https://api.xrpl.to/api/news/search?q=${encodeURIComponent(q)}&${params}`
    : `https://api.xrpl.to/api/news?${params}`;

  try {
    const [newsRes, chartRes] = await Promise.all([
      fetch(endpoint),
      fetch('https://api.xrpl.to/api/news/sentiment-chart?days=30')
    ]);

    const newsData = await newsRes.json();
    const chartData = chartRes.ok ? await chartRes.json() : null;

    const parse = (p) => ({ bullish: parseFloat(p?.Bullish || 0), bearish: parseFloat(p?.Bearish || 0), neutral: parseFloat(p?.Neutral || 0) });

    return {
      props: {
        initialNews: newsData.data || [],
        initialTotal: newsData.pagination?.total || 0,
        initialSources: newsData.sources?.reduce((acc, s) => ({ ...acc, [s.name]: { count: s.count, sentiment: s.sentiment } }), {}) || {},
        initialSentiment: newsData.sentiment ? {
          last24h: parse(newsData.sentiment['24h']),
          last7d: parse(newsData.sentiment['7d']),
          last30d: parse(newsData.sentiment['30d']),
          all: parse(newsData.sentiment['all'])
        } : { last24h: {}, last7d: {}, last30d: {}, all: {} },
        initialChart: chartData,
        initialQuery: { page, limit, source: source || null, q: q || null },
        ogp: {
          canonical: 'https://xrpl.to/news',
          title: 'XRPL News - Latest Crypto & XRP Ledger Updates',
          url: 'https://xrpl.to/news',
          imgUrl: 'https://s1.xrpl.to/ogp/news.webp',
          imgType: 'image/webp',
          imgWidth: '1200',
          imgHeight: '630',
          imgAlt: 'XRPL.to News - Latest cryptocurrency and XRP Ledger news',
          desc: 'Stay updated with the latest XRPL news, market sentiment analysis, and cryptocurrency updates from trusted sources'
        }
      }
    };
  } catch {
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
          imgUrl: 'https://s1.xrpl.to/ogp/news.webp',
          imgType: 'image/webp',
          imgWidth: '1200',
          imgHeight: '630',
          imgAlt: 'XRPL.to News - Latest cryptocurrency and XRP Ledger news',
          desc: 'Stay updated with the latest XRPL news, market sentiment analysis, and cryptocurrency updates from trusted sources'
        }
      }
    };
  }
}
