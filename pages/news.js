import { useState, useEffect, useMemo, useCallback, memo, useContext } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import { cn } from 'src/utils/cn';
import { AppContext } from 'src/AppContext';

const Header = dynamic(() => import('../src/components/Header'), { ssr: true });
const Footer = dynamic(() => import('../src/components/Footer'), { ssr: true });

const SourcesMenu = memo(({ sources, selectedSource, onSourceSelect, isMobile, isDark }) => {
  const [showAll, setShowAll] = useState(false);

  const sortedSources = useMemo(
    () => Object.entries(sources).sort(([, a], [, b]) => b.count - a.count),
    [sources]
  );

  const displayLimit = isMobile ? 8 : 14;
  const displayedSources = useMemo(
    () => (showAll ? sortedSources : sortedSources.slice(0, displayLimit)),
    [showAll, sortedSources, displayLimit]
  );

  const totalSources = sortedSources.length;
  const hiddenCount = totalSources - displayLimit;

  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => onSourceSelect(null)}
          className={cn(
            'rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
            !selectedSource
              ? 'bg-primary text-white'
              : isDark ? 'text-gray-400 hover:bg-white/5' : 'text-gray-500 hover:bg-gray-100'
          )}
        >
          All Sources
        </button>
        {displayedSources.map(([source, data]) => {
          const sentiment = data.sentiment;
          const bull = sentiment?.Bullish || 0;
          const isSelected = selectedSource === source;

          return (
            <button
              key={source}
              onClick={() => onSourceSelect(source)}
              className={cn(
                'group relative flex items-center gap-1 rounded-md px-2 py-1 text-[11px] transition-colors',
                isSelected
                  ? 'bg-primary text-white'
                  : isDark ? 'text-gray-400 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <span className="font-medium">{source}</span>
              <span className={cn("tabular-nums", isSelected ? "opacity-70" : "opacity-40")}>{data.count}</span>
              {bull > 0 && !isSelected && (
                <span className={cn("h-1.5 w-1.5 rounded-full", bull > 60 ? "bg-green-500" : bull < 40 ? "bg-red-500" : "bg-yellow-500")} />
              )}
            </button>
          );
        })}
        {totalSources > displayLimit && (
          <button
            onClick={() => setShowAll(!showAll)}
            className={cn("rounded-md px-2 py-1 text-[11px] transition-colors", isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600")}
          >
            {showAll ? 'Less' : `+${hiddenCount}`}
          </button>
        )}
      </div>
    </div>
  );
});

SourcesMenu.displayName = 'SourcesMenu';

function NewsPage() {
  const router = useRouter();
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [isMobile, setIsMobile] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSource, setSelectedSource] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [sentimentStats, setSentimentStats] = useState(() => ({
    last24h: { bullish: 0, bearish: 0, neutral: 0 },
    last7d: { bullish: 0, bearish: 0, neutral: 0 },
    last30d: { bullish: 0, bearish: 0, neutral: 0 },
    all: { bullish: 0, bearish: 0, neutral: 0 }
  }));
  const [sourcesStats, setSourcesStats] = useState({});
  const [searchSentimentScore, setSearchSentimentScore] = useState(null);

  const filteredNews = useMemo(() => (Array.isArray(news) ? news : []), [news]);
  const totalPages = useMemo(
    () => Math.ceil(totalCount / itemsPerPage),
    [totalCount, itemsPerPage]
  );
  const currentItems = filteredNews;

  const handlePageChange = useCallback(
    (event, value) => {
      setCurrentPage(value);
      const query = { page: value };
      if (itemsPerPage !== 10) query.limit = itemsPerPage;
      if (selectedSource) query.source = selectedSource;
      if (searchQuery) query.q = searchQuery;
      router.push({ pathname: '/news', query }, undefined, { shallow: true });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [itemsPerPage, selectedSource, searchQuery, router]
  );

  const handleSourceSelect = useCallback(
    (source) => {
      setSelectedSource(source);
      setCurrentPage(1);
      const query = { page: 1 };
      if (itemsPerPage !== 10) query.limit = itemsPerPage;
      if (source) query.source = source;
      if (searchQuery) query.q = searchQuery;
      router.push({ pathname: '/news', query }, undefined, { shallow: true });
    },
    [itemsPerPage, searchQuery, router]
  );

  const handleSearch = useCallback(
    (e) => {
      e.preventDefault();
      setSearchQuery(searchInput);
      setCurrentPage(1);
      const query = { page: 1 };
      if (itemsPerPage !== 10) query.limit = itemsPerPage;
      if (selectedSource) query.source = selectedSource;
      if (searchInput) query.q = searchInput;
      router.push({ pathname: '/news', query }, undefined, { shallow: true });
    },
    [searchInput, itemsPerPage, selectedSource, router]
  );

  useEffect(() => {
    const { page, limit, source, q } = router.query;
    if (page) {
      const pageNum = parseInt(page);
      if (!isNaN(pageNum) && pageNum > 0) {
        setCurrentPage(pageNum);
      }
    }
    if (limit) {
      const limitNum = parseInt(limit);
      if (!isNaN(limitNum) && limitNum > 0 && limitNum <= 100) {
        setItemsPerPage(limitNum);
      }
    }
    if (source) {
      setSelectedSource(source);
    } else {
      setSelectedSource(null);
    }
    if (q) {
      setSearchQuery(q);
      setSearchInput(q);
    } else {
      setSearchQuery('');
      setSearchInput('');
    }
  }, [router.query]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);

        const params = new URLSearchParams();
        params.append('page', currentPage);
        params.append('limit', itemsPerPage);
        if (selectedSource) params.append('source', selectedSource);

        const endpoint = searchQuery
          ? `https://api.xrpl.to/api/news/search?q=${encodeURIComponent(searchQuery)}&${params.toString()}`
          : `https://api.xrpl.to/api/news?${params.toString()}`;

        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error('Failed to fetch news');
        }
        const data = await response.json();

        if (data.data && Array.isArray(data.data)) {
          setNews(data.data);
          if (data.pagination && data.pagination.total) {
            setTotalCount(data.pagination.total);
          }

          if (searchQuery && data.sentiment_score !== undefined) {
            setSearchSentimentScore(data.sentiment_score);
          } else {
            setSearchSentimentScore(null);
          }

          if (data.sources) {
            const sourcesObj = data.sources.reduce((acc, source) => {
              acc[source.name] = {
                count: source.count,
                sentiment: source.sentiment
              };
              return acc;
            }, {});
            setSourcesStats(sourcesObj);
          }

          if (data.sentiment) {
            setSentimentStats({
              last24h: {
                bullish: parseFloat(data.sentiment['24h']?.Bullish || 0),
                bearish: parseFloat(data.sentiment['24h']?.Bearish || 0),
                neutral: parseFloat(data.sentiment['24h']?.Neutral || 0)
              },
              last7d: {
                bullish: parseFloat(data.sentiment['7d']?.Bullish || 0),
                bearish: parseFloat(data.sentiment['7d']?.Bearish || 0),
                neutral: parseFloat(data.sentiment['7d']?.Neutral || 0)
              },
              last30d: {
                bullish: parseFloat(data.sentiment['30d']?.Bullish || 0),
                bearish: parseFloat(data.sentiment['30d']?.Bearish || 0),
                neutral: parseFloat(data.sentiment['30d']?.Neutral || 0)
              },
              all: {
                bullish: parseFloat(data.sentiment['all']?.Bullish || 0),
                bearish: parseFloat(data.sentiment['all']?.Bearish || 0),
                neutral: parseFloat(data.sentiment['all']?.Neutral || 0)
              }
            });
          }
        } else if (Array.isArray(data)) {
          setNews(data);
          setTotalCount(data.length);
          setSearchSentimentScore(null);
          const sourceCount = data.reduce((acc, article) => {
            const source = article.sourceName || 'Unknown';
            acc[source] = (acc[source] || 0) + 1;
            return acc;
          }, {});
          setSourcesStats(sourceCount);
        } else {
          setNews([]);
          setSourcesStats({});
          setTotalCount(0);
          setSearchSentimentScore(null);
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [currentPage, itemsPerPage, selectedSource, searchQuery]);

  const getSentimentColor = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'bullish':
        return '#10B981';
      case 'bearish':
        return '#EF4444';
      case 'neutral':
        return '#F59E0B';
      default:
        return '#9CA3AF';
    }
  };

  const extractTitle = useCallback((htmlContent) => {
    const titleMatch = htmlContent.match(/>([^<]+)</);;
    return titleMatch ? titleMatch[1] : htmlContent;
  }, []);

  return (
    <div className={cn("flex min-h-screen flex-col", isDark ? "bg-transparent" : "bg-white")}>
      <Header
        notificationPanelOpen={notificationPanelOpen}
        onNotificationPanelToggle={setNotificationPanelOpen}
      />
      <h1 className="sr-only">XRPL News & Updates</h1>
      <div className={cn('flex-1 mt-4 pb-4 sm:pb-6', notificationPanelOpen ? 'px-4' : 'mx-auto max-w-[1920px] px-4')}>
        {loading ? (
          <div className="flex justify-center py-16">
            <svg className="h-8 w-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : error ? (
          <p className="py-8 text-center text-red-500">Error: {error}</p>
        ) : (
          <>
            {/* Header with Search */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <h2 className={cn("text-[17px] font-medium", isDark ? "text-white" : "text-gray-900")}>News</h2>
                <span className={cn("rounded px-1.5 py-0.5 text-[11px] tabular-nums", isDark ? "bg-white/10 text-gray-400" : "bg-gray-100 text-gray-500")}>
                  {totalCount.toLocaleString()}
                </span>
              </div>

              <form
                onSubmit={handleSearch}
                className={cn(
                  "flex h-9 items-center gap-2 rounded-lg px-3 transition-all",
                  isDark ? "bg-white/5 focus-within:bg-white/8" : "bg-gray-100 focus-within:bg-gray-200/80"
                )}
              >
                <svg className={cn("h-4 w-4 shrink-0", isDark ? "text-gray-500" : "text-gray-400")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className={cn("w-full min-w-[180px] bg-transparent text-[13px] focus:outline-none sm:w-[240px]", isDark ? "text-white placeholder:text-gray-500" : "text-gray-900 placeholder:text-gray-400")}
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput('');
                      setSearchQuery('');
                      setSearchSentimentScore(null);
                      setCurrentPage(1);
                      const query = { page: 1 };
                      if (itemsPerPage !== 10) query.limit = itemsPerPage;
                      if (selectedSource) query.source = selectedSource;
                      router.push({ pathname: '/news', query }, undefined, { shallow: true });
                    }}
                    className={cn("shrink-0 rounded p-0.5", isDark ? "hover:bg-white/10" : "hover:bg-gray-300")}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </form>
            </div>

            {/* Sentiment Summary - Compact horizontal */}
            <div className={cn("mb-4 rounded-xl p-3", isDark ? "bg-white/[0.02]" : "bg-gray-50")}>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <span className={cn("text-[11px] font-medium uppercase tracking-wide", isDark ? "text-gray-500" : "text-gray-400")}>
                  Sentiment
                </span>
                {[
                  { period: '24H', stats: sentimentStats.last24h },
                  { period: '7D', stats: sentimentStats.last7d },
                  { period: '30D', stats: sentimentStats.last30d },
                  { period: 'ALL', stats: sentimentStats.all }
                ].map((item) => {
                  const bull = item.stats?.bullish || 0;
                  const bear = item.stats?.bearish || 0;
                  return (
                    <div key={item.period} className="flex items-center gap-2">
                      <span className={cn("w-7 text-[10px] font-medium", isDark ? "text-gray-500" : "text-gray-400")}>{item.period}</span>
                      <div className={cn("flex h-1.5 w-20 overflow-hidden rounded-full", isDark ? "bg-white/10" : "bg-gray-200")}>
                        <div style={{ width: `${bull}%` }} className="bg-green-500" />
                        <div style={{ width: `${bear}%` }} className="bg-red-500" />
                      </div>
                      <span className="w-8 text-[10px] tabular-nums text-green-500">{bull}%</span>
                    </div>
                  );
                })}
                {searchQuery && searchSentimentScore !== null && (
                  <span className={cn("ml-auto text-[11px] tabular-nums", isDark ? "text-gray-400" : "text-gray-500")}>
                    Score: {searchSentimentScore}
                  </span>
                )}
              </div>
            </div>

            <SourcesMenu
              sources={sourcesStats}
              selectedSource={selectedSource}
              onSourceSelect={handleSourceSelect}
              isMobile={isMobile}
              isDark={isDark}
            />

            {/* News Grid */}
            <div className="space-y-2">
              {currentItems.length === 0 ? (
                <div className="py-16 text-center">
                  <div className={cn("mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl", isDark ? "bg-white/5" : "bg-gray-100")}>
                    <svg className={cn("h-7 w-7", isDark ? "text-gray-600" : "text-gray-400")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                  <p className={cn("text-[14px] font-medium", isDark ? "text-gray-400" : "text-gray-600")}>No news found</p>
                  <p className={cn("text-[12px]", isDark ? "text-gray-600" : "text-gray-500")}>Try adjusting your search or filters</p>
                </div>
              ) : (
                currentItems.map((article) => (
                  <a
                    key={article._id}
                    href={article.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "group flex gap-4 rounded-xl border-[1.5px] p-4 transition-all",
                      isDark
                        ? "border-white/10 bg-[rgba(255,255,255,0.01)] hover:border-primary/30 hover:bg-white/[0.02]"
                        : "border-gray-200 hover:border-primary/30 hover:bg-gray-50"
                    )}
                  >
                    {/* Sentiment indicator bar */}
                    <div
                      className="w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: getSentimentColor(article.sentiment) }}
                    />

                    <div className="min-w-0 flex-1">
                      {/* Top row: Source & Time */}
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className={cn("text-[11px] font-medium", isDark ? "text-gray-400" : "text-gray-500")}>
                          {article.sourceName}
                        </span>
                        <span className={cn("text-[10px]", isDark ? "text-gray-600" : "text-gray-400")}>
                          {formatDistanceToNow(new Date(article.pubDate), { addSuffix: true })}
                        </span>
                        <span
                          className="ml-auto shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium uppercase"
                          style={{
                            color: getSentimentColor(article.sentiment),
                            backgroundColor: `${getSentimentColor(article.sentiment)}15`
                          }}
                        >
                          {article.sentiment || 'N/A'}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className={cn(
                        "mb-1 text-[14px] font-medium leading-snug transition-colors group-hover:text-primary",
                        isDark ? "text-white" : "text-gray-900"
                      )}>
                        {extractTitle(article.title)}
                      </h3>

                      {/* Summary */}
                      <p className={cn("line-clamp-1 text-[12px] leading-relaxed", isDark ? "text-gray-500" : "text-gray-500")}>
                        {article.summary}
                      </p>
                    </div>

                    {/* Arrow indicator */}
                    <div className={cn(
                      "flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100",
                      isDark ? "text-gray-500" : "text-gray-400"
                    )}>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </a>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-1">
                <button
                  onClick={() => handlePageChange(null, currentPage - 1)}
                  disabled={currentPage === 1}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:opacity-30",
                    isDark ? "hover:bg-white/5 disabled:hover:bg-transparent" : "hover:bg-gray-100 disabled:hover:bg-transparent"
                  )}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {(() => {
                  const pages = [];
                  if (totalPages <= 5) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else if (currentPage <= 3) {
                    pages.push(1, 2, 3, '...', totalPages);
                  } else if (currentPage >= totalPages - 2) {
                    pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
                  } else {
                    pages.push(1, '...', currentPage, '...', totalPages);
                  }
                  return pages.map((p, i) =>
                    p === '...' ? (
                      <span key={`e${i}`} className={cn("px-1 text-[12px]", isDark ? "text-gray-600" : "text-gray-400")}>...</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => handlePageChange(null, p)}
                        className={cn(
                          "flex h-8 min-w-[32px] items-center justify-center rounded-md text-[12px] tabular-nums transition-colors",
                          p === currentPage
                            ? "bg-primary text-white"
                            : isDark ? "text-gray-400 hover:bg-white/5" : "text-gray-600 hover:bg-gray-100"
                        )}
                      >
                        {p}
                      </button>
                    )
                  );
                })()}

                <button
                  onClick={() => handlePageChange(null, currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:opacity-30",
                    isDark ? "hover:bg-white/5 disabled:hover:bg-transparent" : "hover:bg-gray-100 disabled:hover:bg-transparent"
                  )}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <span className={cn("ml-2 text-[11px] tabular-nums", isDark ? "text-gray-600" : "text-gray-400")}>
                  {currentPage}/{totalPages}
                </span>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default NewsPage;

export async function getStaticProps() {
  const ogp = {
    canonical: 'https://xrpl.to/news',
    title: 'XRPL News - Latest Crypto & XRP Ledger Updates',
    url: 'https://xrpl.to/news',
    imgUrl: 'https://s1.xrpl.to/ogp/news.webp',
    imgType: 'image/webp',
    imgWidth: '1200',
    imgHeight: '630',
    imgAlt: 'XRPL.to News - Latest cryptocurrency and XRP Ledger news',
    desc: 'Stay updated with the latest XRPL news, market sentiment analysis, and cryptocurrency updates from trusted sources'
  };

  return {
    props: {
      ogp
    },
    revalidate: 60
  };
}
