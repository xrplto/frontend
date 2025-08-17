import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import { useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import styles from './news.module.css';

const Header = dynamic(() => import('../src/components/Header'), { ssr: true });
const Footer = dynamic(() => import('../src/components/Footer'), { ssr: true });
const Topbar = dynamic(() => import('../src/components/Topbar'), { ssr: true });


const SourcesMenu = memo(({ sources, selectedSource, onSourceSelect, isSyncWave }) => {
  const theme = useTheme();
  const themeMode = useSelector((state) => state.status.theme);
  const isDark = themeMode === 'dark';
  const [showAll, setShowAll] = useState(false);
  
  const sortedSources = useMemo(() => 
    Object.entries(sources).sort(([, a], [, b]) => b.count - a.count),
    [sources]
  );
  
  const displayedSources = useMemo(() => 
    showAll ? sortedSources : sortedSources.slice(0, 12),
    [showAll, sortedSources]
  );
  
  const totalSources = sortedSources.length;
  const hiddenCount = totalSources - 12;

  // Simple transparent background like TokenRow with theme text color
  const containerStyle = {
    background: 'transparent',
    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
    color: theme.palette.text.primary
  };

  return (
    <div 
      className={`${styles.sourcesMenuContainer} ${isDark ? styles.dark : ''} ${isSyncWave ? styles.syncwave : ''}`}
      style={containerStyle}
    >
      <div className={styles.sourcesHeader}>
        <span className={styles.sourcesTitle}>
          News Sources ({totalSources})
        </span>
        {totalSources > 12 && (
          <button
            className={styles.chipButton}
            onClick={() => setShowAll(!showAll)}
            style={{
              background: theme.palette.primary.main,
              color: theme.palette.primary.contrastText
            }}
          >
            {showAll ? 'Show Less' : `Show All (+${hiddenCount})`}
          </button>
        )}
      </div>
      <div className={styles.sourcesChips}>
        <button
          className={`${styles.sourceChip} ${!selectedSource ? styles.selected : ''}`}
          onClick={() => onSourceSelect(null)}
          style={{
            borderColor: theme.palette.primary.main,
            color: !selectedSource ? theme.palette.primary.contrastText : theme.palette.primary.main,
            background: !selectedSource ? theme.palette.primary.main : 'transparent'
          }}
        >
          All Sources
        </button>
        {displayedSources.map(([source, data]) => {
          const sentiment = data.sentiment;
          const hasSentiment = sentiment && (sentiment.Bullish || sentiment.Bearish || sentiment.Neutral);
          
          return (
            <button
              key={source}
              className={`${styles.sourceChip} ${selectedSource === source ? styles.selected : ''}`}
              onClick={() => onSourceSelect(source)}
              style={{
                borderColor: theme.palette.primary.main,
                color: selectedSource === source ? theme.palette.primary.contrastText : theme.palette.primary.main,
                background: selectedSource === source ? theme.palette.primary.main : 'transparent'
              }}
            >
              <span className={styles.chipContent}>
                <span>{source}</span>
                <span className={styles.chipCount}>({data.count})</span>
                {hasSentiment && (
                  <span className={styles.sentimentIndicators}>
                    <span className={styles.sentimentItem}>
                      <span className={`${styles.sentimentDot} ${styles.bullish}`}></span>
                      <span className={styles.sentimentText}>{sentiment.Bullish}%</span>
                    </span>
                    <span className={styles.sentimentItem}>
                      <span className={`${styles.sentimentDot} ${styles.bearish}`}></span>
                      <span className={styles.sentimentText}>{sentiment.Bearish}%</span>
                    </span>
                    <span className={styles.sentimentItem}>
                      <span className={`${styles.sentimentDot} ${styles.neutral}`}></span>
                      <span className={styles.sentimentText}>{sentiment.Neutral}%</span>
                    </span>
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

SourcesMenu.displayName = 'SourcesMenu';

function NewsPage() {
  const router = useRouter();
  const theme = useTheme();
  const themeMode = useSelector((state) => state.status.theme);
  const themeName = useSelector((state) => state.status.themeName);
  const isDark = themeMode === 'dark';
  const isSyncWave = themeName === 'SyncWaveTheme';
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 600);
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
  const [expandedArticles, setExpandedArticles] = useState({});
  const [searchSentimentScore, setSearchSentimentScore] = useState(null);

  const filteredNews = useMemo(() => Array.isArray(news) ? news : [], [news]);
  const totalPages = useMemo(() => Math.ceil(totalCount / itemsPerPage), [totalCount, itemsPerPage]);
  const currentItems = filteredNews;

  const handlePageChange = useCallback((event, value) => {
    setCurrentPage(value);
    const query = { page: value };
    if (itemsPerPage !== 10) query.limit = itemsPerPage;
    if (selectedSource) query.source = selectedSource;
    if (searchQuery) query.q = searchQuery;
    router.push({ pathname: '/news', query }, undefined, { shallow: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [itemsPerPage, selectedSource, searchQuery, router]);

  const handleSourceSelect = useCallback((source) => {
    setSelectedSource(source);
    setCurrentPage(1);
    const query = { page: 1 };
    if (itemsPerPage !== 10) query.limit = itemsPerPage;
    if (source) query.source = source;
    if (searchQuery) query.q = searchQuery;
    router.push({ pathname: '/news', query }, undefined, { shallow: true });
  }, [itemsPerPage, searchQuery, router]);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setCurrentPage(1);
    const query = { page: 1 };
    if (itemsPerPage !== 10) query.limit = itemsPerPage;
    if (selectedSource) query.source = selectedSource;
    if (searchInput) query.q = searchInput;
    router.push({ pathname: '/news', query }, undefined, { shallow: true });
  }, [searchInput, itemsPerPage, selectedSource, router]);

  const toggleArticleExpansion = useCallback((articleId) => {
    setExpandedArticles((prev) => ({
      ...prev,
      [articleId]: !prev[articleId]
    }));
  }, []);

  // Parse URL parameters on mount and router changes
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
        
        // Build query string from state
        const params = new URLSearchParams();
        params.append('page', currentPage);
        params.append('limit', itemsPerPage);
        if (selectedSource) params.append('source', selectedSource);
        
        // Use search endpoint if there's a search query
        const endpoint = searchQuery 
          ? `https://api.xrpl.to/api/news/search?q=${encodeURIComponent(searchQuery)}&${params.toString()}`
          : `https://api.xrpl.to/api/news?${params.toString()}`;
        
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error('Failed to fetch news');
        }
        const data = await response.json();
        
        // Check if response has data array (both regular and search endpoints have this)
        if (data.data && Array.isArray(data.data)) {
          setNews(data.data);
          // Set total count from pagination info
          if (data.pagination && data.pagination.total) {
            setTotalCount(data.pagination.total);
          }
          
          // Set search sentiment score if available (from search endpoint)
          if (searchQuery && data.sentiment_score !== undefined) {
            setSearchSentimentScore(data.sentiment_score);
          } else {
            setSearchSentimentScore(null);
          }
          
          // Only process sources if they exist (not present in search endpoint)
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
          
          // Use sentiment data from API if available (not present in search endpoint)
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
          // Fallback for old API format (array of articles)
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
          // Handle unexpected format
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
    if (isSyncWave) {
      // Use SyncWave theme colors (cyberpunk neon)
      switch (sentiment?.toLowerCase()) {
        case 'bullish':
          return '#00ff00'; // Neon Green
        case 'bearish':
          return '#ff0066'; // Hot Pink
        case 'neutral':
          return '#ffff00'; // Neon Yellow
        default:
          return '#00ccff'; // Electric Blue
      }
    }
    // Default colors
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

  const stripHtml = useCallback((html) => {
    if (typeof window === 'undefined') return html;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  }, []);

  const extractTitle = useCallback((htmlContent) => {
    const titleMatch = htmlContent.match(/>([^<]+)</);
    return titleMatch ? titleMatch[1] : htmlContent;
  }, []);

  const SentimentSummary = memo(({ period, stats }) => {
    if (!stats) return null;
    
    return (
      <div className={`${styles.sentimentSummary} ${isDark ? styles.dark : ''}`}>
        <h3 className={styles.sentimentPeriod}>
          {period}
        </h3>
        <div className={styles.sentimentChips}>
          <span className={`${styles.sentimentChip} ${styles.bullishChip}`}>
            Bullish {stats.bullish || 0}%
          </span>
          <span className={`${styles.sentimentChip} ${styles.bearishChip}`}>
            Bearish {stats.bearish || 0}%
          </span>
          <span className={`${styles.sentimentChip} ${styles.neutralChip}`}>
            Neutral {stats.neutral || 0}%
          </span>
        </div>
      </div>
    );
  });
  
  SentimentSummary.displayName = 'SentimentSummary';

  if (loading) {
    return (
      <div style={{ background: theme.palette.background.default, minHeight: '100vh', color: theme.palette.text.primary }}>
        <Topbar />
        <Header />
        <div className={`${styles.container} ${isDark ? styles.dark : ''}`}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: theme.palette.background.default, minHeight: '100vh', color: theme.palette.text.primary }}>
        <Topbar />
        <Header />
        <div className={`${styles.container} ${isDark ? styles.dark : ''}`}>
          <div className={styles.errorMessage} style={{ color: theme.palette.error.main }}>Error: {error}</div>
        </div>
        <Footer />
      </div>
    );
  }

  // Get background and text styles from theme
  const backgroundStyle = {
    background: theme.palette.background.default,
    minHeight: '100vh',
    color: theme.palette.text.primary
  };

  return (
    <div 
      className={`${styles.pageWrapper} ${isDark ? styles.dark : ''} ${isSyncWave ? styles.syncwave : ''}`} 
      style={backgroundStyle}
    >
      <Topbar />
      <Header />
      <div className={styles.mainContent}>
        <div className={`${styles.container} ${isDark ? styles.dark : ''}`}>
          <div className={`${styles.pageHeader} ${isDark ? styles.dark : ''}`}>
            <h1 className={styles.pageTitle} style={{ color: theme.palette.primary.main }}>
              Latest XRP Ledger News
              {totalCount > 0 && (
                <span className={styles.articleCount} style={{ color: theme.palette.text.secondary }}>
                  ({totalCount.toLocaleString()} articles)
                </span>
              )}
            </h1>
          </div>

          <div className={`${styles.searchBox} ${isDark ? styles.dark : ''}`}>
            <form onSubmit={handleSearch}>
              <div className={`${styles.searchContainer} ${isDark ? styles.dark : ''}`}>
                <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search XRPL News"
                  aria-label="Search news articles"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                {searchInput && (
                  <>
                    <button
                      type="button"
                      className={styles.clearButton}
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
                    >
                      ×
                    </button>
                    <button
                      type="submit"
                      className={styles.searchButton}
                      style={{
                        background: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText
                      }}
                    >
                      Search
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>

          <SourcesMenu
            sources={sourcesStats}
            selectedSource={selectedSource}
            onSourceSelect={handleSourceSelect}
            isSyncWave={isSyncWave}
          />

          <div 
            className={`${styles.sentimentContainer} ${isDark ? styles.dark : ''} ${isSyncWave ? styles.syncwave : ''}`}
            style={{
              background: 'transparent',
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
              color: theme.palette.text.primary
            }}
          >
            <h2 className={styles.sentimentTitle} style={{ color: theme.palette.text.primary }}>
              Sentiment Analysis
              {searchQuery && searchSentimentScore !== null && (
                <span className={styles.sentimentScore} style={{ color: theme.palette.primary.main }}>
                  (Score: {searchSentimentScore})
                </span>
              )}
              {selectedSource && (
                <span className={styles.sentimentSource} style={{ color: theme.palette.text.secondary }}>
                  ({selectedSource})
                </span>
              )}
            </h2>
            <div className={`${styles.sentimentGrid} ${isMobile ? styles.mobile : ''}`}>
              <SentimentSummary period="Last 24h" stats={sentimentStats.last24h} />
              {!isMobile && <div className={styles.divider}></div>}
              <SentimentSummary period="7d" stats={sentimentStats.last7d} />
              {!isMobile && <div className={styles.divider}></div>}
              <SentimentSummary period="30d" stats={sentimentStats.last30d} />
              {!isMobile && <div className={styles.divider}></div>}
              <SentimentSummary period="All Time" stats={sentimentStats.all} />
            </div>
          </div>

          <div className={`${styles.newsGrid} ${isDark ? styles.dark : ''}`}>
            {currentItems.map((article) => (
              <div 
                key={article._id} 
                className={`${styles.newsCard} ${isDark ? styles.dark : ''} ${isSyncWave ? styles.syncwave : ''}`}
                style={{
                  background: 'transparent',
                  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
                  color: theme.palette.text.primary
                }}
              >
                <div className={`${styles.cardContent} ${isDark ? styles.dark : ''}`}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.articleTitle} style={{ color: theme.palette.text.primary }}>
                      {extractTitle(article.title)}
                    </h2>
                    <div className={styles.sentimentBadge}>
                      <span 
                        className={styles.sentimentLabel}
                        style={{ backgroundColor: getSentimentColor(article.sentiment) }}
                      >
                        {article.sentiment || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  <div className={styles.articleContent}>
                    <div className={styles.articleImage}>
                      <img
                        src={article.articleImage || '/static/default-news.svg'}
                        alt={extractTitle(article.title)}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          if (e.target.src !== '/static/default-news.svg') {
                            e.target.src = '/static/default-news.svg';
                          }
                        }}
                      />
                    </div>
                    <p className={styles.articleSummary} style={{ color: theme.palette.text.secondary }}>
                      {article.summary}
                    </p>
                  </div>
                  <div className={styles.divider}></div>
                    {expandedArticles[article._id] && (
                      <div className={styles.expandedContent}>
                        {article.articleBody?.split('\n').map(
                          (paragraph, index) =>
                            paragraph.trim() && (
                              <p
                                key={`${article._id}-para-${index}`}
                                className={styles.articleParagraph}
                              >
                                {paragraph}
                              </p>
                            )
                        )}
                      </div>
                    )}
                    <div className={`${styles.cardFooter} ${isMobile ? styles.mobile : ''}`}>
                      <div className={styles.metaInfo}>
                        <span className={styles.sourceMeta} style={{ color: theme.palette.text.secondary }}>
                          {article.sourceName} •{' '}
                          <time dateTime={article.pubDate}>
                            {formatDistanceToNow(new Date(article.pubDate), { addSuffix: true })}
                          </time>
                        </span>
                        {article.articleBody && (
                          <button
                            className={styles.expandButton}
                            onClick={() => toggleArticleExpansion(article._id)}
                          >
                            {expandedArticles[article._id] ? 'Show Less' : 'Show More'}
                          </button>
                        )}
                      </div>
                      <a
                        href={article.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Read full article on external site"
                        className={styles.readMoreLink}
                      >
                        Read full article →
                      </a>
                    </div>
                </div>
              </div>
            ))}
          </div>

          {totalCount > 0 && (
            <div className={`${styles.paginationContainer} ${isDark ? styles.dark : ''}`}>
              <p className={styles.resultsInfo} style={{ color: theme.palette.text.secondary }}>
                {searchQuery && `Found ${totalCount} articles for "${searchQuery}"`}
                {selectedSource && !searchQuery && `Showing ${totalCount} articles from ${selectedSource}`}
                {!searchQuery && !selectedSource && `Showing ${currentItems.length} of ${totalCount} articles`}
              </p>
              {totalPages > 1 && (
                <div 
                  className={`${styles.paginationBox} ${isSyncWave ? styles.syncwave : ''}`}
                  style={{
                    background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
                    color: theme.palette.text.primary
                  }}
                >
                  <button
                    className={`${styles.paginationButton} ${currentPage === 1 ? styles.disabled : ''}`}
                    onClick={() => handlePageChange(null, 1)}
                    disabled={currentPage === 1}
                    style={{
                      color: currentPage === 1 
                        ? theme.palette.text.disabled 
                        : theme.palette.primary.main
                    }}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M18.41 16.59L13.82 12L18.41 7.41L17 6L11 12L17 18L18.41 16.59Z"
                        fill="currentColor"
                      />
                      <path
                        d="M12.41 16.59L7.82 12L12.41 7.41L11 6L5 12L11 18L12.41 16.59Z"
                        fill="currentColor"
                      />
                    </svg>
                  </button>
                  <div className={styles.paginationNumbers}>
                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1;
                      // Show first page, last page, current page, and pages around current
                      if (
                        page === 1 ||
                        page === totalPages ||
                        page === currentPage ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            className={`${styles.pageNumber} ${page === currentPage ? styles.active : ''}`}
                            onClick={() => handlePageChange(null, page)}
                            style={{
                              color: page === currentPage 
                                ? (theme.palette.mode === 'dark' ? '#000' : '#fff')
                                : theme.palette.text.primary,
                              background: page === currentPage 
                                ? theme.palette.primary.main 
                                : 'transparent',
                              borderColor: page === currentPage 
                                ? theme.palette.primary.main 
                                : (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)')
                            }}
                          >
                            {page}
                          </button>
                        );
                      }
                      // Show ellipsis
                      if (page === 2 && currentPage > 4) {
                        return <span key={page} className={styles.ellipsis} style={{ color: theme.palette.text.secondary }}>...</span>;
                      }
                      if (page === totalPages - 1 && currentPage < totalPages - 3) {
                        return <span key={page} className={styles.ellipsis} style={{ color: theme.palette.text.secondary }}>...</span>;
                      }
                      return null;
                    })}
                  </div>
                  <button
                    className={`${styles.paginationButton} ${currentPage === totalPages ? styles.disabled : ''}`}
                    onClick={() => handlePageChange(null, totalPages)}
                    disabled={currentPage === totalPages}
                    style={{
                      color: currentPage === totalPages 
                        ? theme.palette.text.disabled 
                        : theme.palette.primary.main
                    }}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M5.59 7.41L10.18 12L5.59 16.59L7 18L13 12L7 6L5.59 7.41Z"
                        fill="currentColor"
                      />
                      <path
                        d="M11.59 7.41L16.18 12L11.59 16.59L13 18L19 12L13 6L11.59 7.41Z"
                        fill="currentColor"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
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
    revalidate: 60 // Revalidate every minute for better caching
  };
}
