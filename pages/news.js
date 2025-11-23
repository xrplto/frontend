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

  const displayLimit = isMobile ? 8 : 12;
  const displayedSources = useMemo(
    () => (showAll ? sortedSources : sortedSources.slice(0, displayLimit)),
    [showAll, sortedSources, displayLimit]
  );

  const totalSources = sortedSources.length;
  const hiddenCount = totalSources - displayLimit;

  return (
    <div className={cn("mb-4 rounded-xl border-[1.5px] bg-transparent p-4", isDark ? "border-white/10" : "border-gray-200")}>
      <div className="mb-3 flex items-center justify-between">
        <p className={cn("text-[11px] font-medium uppercase tracking-wide", isDark ? "text-gray-400" : "text-gray-600")}>
          {isMobile ? `Sources (${totalSources})` : `News Sources (${totalSources})`}
        </p>
        {totalSources > displayLimit && (
          <button
            onClick={() => setShowAll(!showAll)}
            className={cn("rounded-lg border-[1.5px] px-3 py-1 text-[13px] font-normal hover:border-primary hover:bg-primary/5", isDark ? "border-gray-700" : "border-gray-300")}
          >
            {showAll ? 'Show Less' : `Show All (+${hiddenCount})`}
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onSourceSelect(null)}
          className={cn(
            'rounded-lg border-[1.5px] px-3 py-1 text-[13px] font-normal',
            !selectedSource
              ? 'border-primary bg-primary text-white'
              : isDark ? 'border-gray-700 hover:border-primary hover:bg-primary/5' : 'border-gray-300 hover:border-primary hover:bg-gray-100'
          )}
        >
          All Sources
        </button>
        {displayedSources.map(([source, data]) => {
          const sentiment = data.sentiment;
          const hasSentiment = sentiment && (sentiment.Bullish || sentiment.Bearish || sentiment.Neutral);
          const isSelected = selectedSource === source;

          return (
            <div key={source} className="relative">
              <button
                onClick={() => onSourceSelect(source)}
                className={cn(
                  'rounded-lg border-[1.5px] px-3 py-1 text-[13px] font-normal',
                  isSelected
                    ? 'border-primary bg-primary text-white'
                    : isDark ? 'border-gray-700 hover:border-primary hover:bg-primary/5' : 'border-gray-300 hover:border-primary hover:bg-gray-100'
                )}
              >
                <span>{source}</span>
                <span className="ml-1.5 text-xs opacity-50">({data.count})</span>
              </button>
              {hasSentiment && !isSelected && (
                <div className="absolute bottom-0 left-0 right-0 flex h-[2.5px] overflow-hidden rounded-b-lg">
                  <div style={{ width: `${sentiment.Bullish}%` }} className="bg-green-500 opacity-90" />
                  <div style={{ width: `${sentiment.Bearish}%` }} className="bg-red-500 opacity-90" />
                  <div style={{ width: `${sentiment.Neutral}%` }} className="bg-yellow-500 opacity-90" />
                </div>
              )}
            </div>
          );
        })}
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
    <div className={cn("flex min-h-screen flex-col", isDark ? "bg-black" : "bg-white")}>
      <Header
        notificationPanelOpen={notificationPanelOpen}
        onNotificationPanelToggle={setNotificationPanelOpen}
      />
      <h1 className="sr-only">XRPL News & Updates</h1>
      <div className={cn('flex-1 py-4 sm:py-6', notificationPanelOpen ? 'px-4' : 'container mx-auto max-w-[1600px] px-4')}>
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
            <div className={cn("mb-4 rounded-xl border-[1.5px] p-4", isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-gray-50")}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <h2 className={cn("text-lg font-medium", isDark ? "text-white" : "text-gray-900")}>XRP News</h2>
                  {totalCount > 0 && (
                    <span className={cn("rounded-lg border-[1.5px] bg-transparent px-2 py-0.5 text-[13px] font-normal", isDark ? "border-white/15 text-white" : "border-gray-300 text-gray-700")}>
                      {totalCount.toLocaleString()}
                    </span>
                  )}
                </div>

                <form
                  onSubmit={handleSearch}
                  className={cn("flex h-10 min-w-full items-center gap-3 rounded-xl border-[1.5px] px-4 hover:border-primary/30 hover:bg-primary/5 focus-within:border-primary/50 sm:min-w-[320px]", isDark ? "border-white/15 bg-white/[0.02]" : "border-gray-300 bg-white")}
                >
                  <svg className={cn("h-4 w-4", isDark ? "text-gray-400/60" : "text-gray-500")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search news..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className={cn("flex-1 bg-transparent text-sm focus:outline-none", isDark ? "text-white placeholder:text-white/50" : "text-gray-900 placeholder:text-gray-400")}
                  />
                  {searchInput && (
                    <>
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
                        className="p-1"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <button
                        type="submit"
                        className={cn("rounded-lg border-[1.5px] px-4 py-1 text-[0.95rem] font-normal hover:border-primary hover:bg-primary/5", isDark ? "border-gray-700" : "border-gray-300")}
                      >
                        Search
                      </button>
                    </>
                  )}
                </form>
              </div>
            </div>

            {/* Sentiment Summary */}
            <div className={cn("mb-4 rounded-xl border-[1.5px] bg-transparent p-4", isDark ? "border-white/10" : "border-gray-200")}>
              {searchQuery && searchSentimentScore !== null ? (
                <div className="mb-4 flex items-center gap-2">
                  <p className={cn("text-[11px] font-medium uppercase tracking-wide", isDark ? "text-gray-400" : "text-gray-600")}>
                    {isMobile ? 'Sentiment' : 'Market Sentiment'}
                  </p>
                  <span className={cn("rounded-md border-[1.5px] px-2 py-0.5 text-[11px] font-normal", isDark ? "border-white/15 text-white" : "border-gray-300 text-gray-700")}>
                    {searchSentimentScore}
                  </span>
                </div>
              ) : (
                <p className={cn("mb-4 block text-[11px] font-medium uppercase tracking-wide", isDark ? "text-gray-400" : "text-gray-600")}>
                  {isMobile ? 'Sentiment' : 'Market Sentiment'}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 sm:gap-4">
                {[
                  { period: '24H', stats: sentimentStats.last24h },
                  { period: '7D', stats: sentimentStats.last7d },
                  { period: '30D', stats: sentimentStats.last30d },
                  { period: 'ALL', stats: sentimentStats.all }
                ].map((item) => (
                  <div
                    key={item.period}
                    className={cn("rounded-xl border-[1.5px] p-4 text-center", isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-gray-50")}
                  >
                    <p className={cn("mb-2 text-[11px] font-medium", isDark ? "text-gray-400" : "text-gray-600")}>{item.period}</p>
                    <div className="flex justify-center gap-3">
                      <div className="flex flex-col items-center gap-1">
                        <p className="text-[15px] font-medium text-green-500">
                          {item.stats?.bullish || 0}%
                        </p>
                        <p className="text-[10px] uppercase tracking-wide text-gray-400/70">Bull</p>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <p className="text-[15px] font-medium text-red-500">
                          {item.stats?.bearish || 0}%
                        </p>
                        <p className="text-[10px] uppercase tracking-wide text-gray-400/70">Bear</p>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <p className="text-[15px] font-medium text-yellow-500">
                          {item.stats?.neutral || 0}%
                        </p>
                        <p className="text-[10px] uppercase tracking-wide text-gray-400/70">Neutral</p>
                      </div>
                    </div>
                  </div>
                ))}
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
            <div className="space-y-4">
              {currentItems.length === 0 ? (
                <p className={cn("py-16 text-center text-sm font-normal", isDark ? "text-gray-400/70" : "text-gray-500")}>
                  No news found at the moment
                </p>
              ) : (
                currentItems.map((article) => (
                  <div
                    key={article._id}
                    className={cn("cursor-pointer rounded-xl border-[1.5px] bg-transparent p-4 sm:p-5", isDark ? "border-white/10 hover:border-white/20 hover:bg-white/[0.02]" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50")}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <p className={cn("pr-4 text-[15px] font-medium", isDark ? "text-white" : "text-gray-900")}>{extractTitle(article.title)}</p>
                      <span
                        className="rounded-md border px-2 py-1 text-[10px] font-normal capitalize"
                        style={{
                          borderColor: `${getSentimentColor(article.sentiment)}4D`,
                          color: `${getSentimentColor(article.sentiment)}E6`,
                          backgroundColor: `${getSentimentColor(article.sentiment)}14`
                        }}
                      >
                        {article.sentiment || 'Unknown'}
                      </span>
                    </div>

                    <p className={cn("mb-3 text-sm", isDark ? "text-gray-400" : "text-gray-600")}>{article.summary}</p>

                    <div className={cn("my-3 h-px", isDark ? "bg-white/10" : "bg-gray-200")} />

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                        {article.sourceName} •{' '}
                        <time dateTime={article.pubDate}>
                          {formatDistanceToNow(new Date(article.pubDate), { addSuffix: true })}
                        </time>
                      </p>
                      <a
                        href={article.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-sm font-normal text-primary hover:underline"
                      >
                        Read full article →
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalCount > 0 && (
              <div className="mt-4 flex flex-col flex-wrap items-center justify-between gap-4 sm:flex-row">
                <div className={cn("flex flex-wrap items-center gap-2 rounded-xl border-[1.5px] px-4 py-2", isDark ? "border-white/15 bg-white/[0.02]" : "border-gray-200 bg-gray-50")}>
                  <span className={cn("rounded-md border-[1.5px] px-2 py-0.5 text-[13px] font-medium tabular-nums", isDark ? "border-white/15 text-white" : "border-gray-300 text-gray-700")}>
                    {`${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, totalCount)} of ${totalCount.toLocaleString()}`}
                  </span>
                  <span className={cn("text-[13px] tabular-nums", isDark ? "text-gray-400" : "text-gray-600")}>articles</span>
                  {searchQuery && (
                    <>
                      <span className={cn("text-[13px] font-normal", isDark ? "text-gray-400" : "text-gray-600")}>for</span>
                      <span className={cn("text-[13px] font-semibold", isDark ? "text-white" : "text-gray-900")}>"{searchQuery}"</span>
                    </>
                  )}
                  {selectedSource && !searchQuery && (
                    <>
                      <span className={cn("text-[13px] font-normal", isDark ? "text-gray-400" : "text-gray-600")}>from</span>
                      <span className={cn("text-[13px] font-semibold", isDark ? "text-white" : "text-gray-900")}>{selectedSource}</span>
                    </>
                  )}
                </div>

                {totalPages > 1 && (
                  <div className="flex flex-1 justify-center">
                    <div className={cn("flex items-center gap-1.5 rounded-xl border-[1.5px] px-3 py-1.5", isDark ? "border-white/15 bg-white/[0.02]" : "border-gray-200 bg-gray-50")}>
                      <button
                        onClick={() => handlePageChange(null, 1)}
                        disabled={currentPage === 1}
                        title="First page"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg disabled:cursor-not-allowed disabled:opacity-30 enabled:hover:bg-primary/8"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      {(() => {
                        const pages = [];
                        if (totalPages <= 7) {
                          for (let i = 1; i <= totalPages; i++) {
                            pages.push(i);
                          }
                        } else {
                          if (currentPage <= 3) {
                            for (let i = 1; i <= 5; i++) pages.push(i);
                            pages.push('...');
                            pages.push(totalPages);
                          } else if (currentPage >= totalPages - 2) {
                            pages.push(1);
                            pages.push('...');
                            for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
                          } else {
                            pages.push(1);
                            pages.push('...');
                            for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                            pages.push('...');
                            pages.push(totalPages);
                          }
                        }
                        return pages.map((pageNum, idx) => {
                          if (pageNum === '...') {
                            return <span key={`ellipsis-${idx}`} className={cn("px-1 text-[13px] tabular-nums", isDark ? "text-gray-400" : "text-gray-500")}>...</span>;
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(null, pageNum)}
                              className={cn(
                                'inline-flex min-w-[24px] items-center justify-center rounded-lg px-1.5 py-0 text-[13px] tabular-nums',
                                pageNum === currentPage
                                  ? 'bg-primary font-medium text-white hover:bg-primary-600'
                                  : isDark ? 'font-normal hover:bg-primary/8' : 'font-normal text-gray-700 hover:bg-gray-200'
                              )}
                            >
                              {pageNum}
                            </button>
                          );
                        });
                      })()}

                      <button
                        onClick={() => handlePageChange(null, totalPages)}
                        disabled={currentPage === totalPages}
                        title="Last page"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg disabled:cursor-not-allowed disabled:opacity-30 enabled:hover:bg-primary/8"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
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
