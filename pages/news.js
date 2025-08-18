import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import { useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import styled from '@emotion/styled';
import { alpha, Container, Box, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Icon } from '@iconify/react';
import styles from './news.module.css';

const Header = dynamic(() => import('../src/components/Header'), { ssr: true });
const Footer = dynamic(() => import('../src/components/Footer'), { ssr: true });
const Topbar = dynamic(() => import('../src/components/Topbar'), { ssr: true });

// Styled Components for Pagination (matching TokenList)
const PaginationContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 16px;
  background: ${({ theme }) => theme.pagination?.background || theme.palette.background.paper};
  border: 1px solid ${({ theme }) => theme.pagination?.border || alpha(theme.palette.divider, 0.12)};
  box-shadow: ${({ theme }) => theme.pagination?.boxShadow || '0 2px 4px rgba(0, 0, 0, 0.04)'};
  backdrop-filter: blur(10px);
  
  @media (max-width: 900px) {
    width: 100%;
    justify-content: center;
    padding: 2px 4px;
  }
`;

const NavButton = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.palette.text.primary || 'inherit'};
  padding: 0;
  
  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.pagination?.backgroundHover || alpha(theme.palette.primary.main, 0.08)};
  }
  
  &:disabled {
    color: ${({ theme }) => alpha(theme.pagination?.textColor || theme.palette.text.primary, 0.48)};
    cursor: not-allowed;
  }
`;

const PageButton = styled.button`
  min-width: 20px;
  height: 20px;
  border-radius: 6px;
  border: none;
  background: ${props => props.selected ? props.theme.pagination?.selectedBackground || props.theme.palette.primary.main : 'transparent'};
  color: ${props => props.selected ? (props.theme.pagination?.selectedTextColor || 'white') : (props.theme.palette.text.primary || 'inherit')};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  margin: 0;
  font-size: 12px;
  font-weight: ${props => props.selected ? 600 : 500};
  
  &:hover:not(:disabled) {
    background: ${props => props.selected ? (props.theme.palette.primary.dark || '#1976D2') : (props.theme.pagination?.backgroundHover || alpha(props.theme.palette.primary.main, 0.08))};
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const PageEllipsis = styled.span`
  padding: 0 4px;
  font-size: 12px;
  color: ${({ theme }) => theme.palette.text.secondary};
`;

const InfoBox = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  border: 1px solid ${({ theme }) => theme.pagination?.border || alpha(theme.palette.divider, 0.12)};
  border-radius: 16px;
  background: ${({ theme }) => theme.pagination?.background || theme.palette.background.paper};
  box-shadow: ${({ theme }) => theme.pagination?.boxShadow || '0 2px 4px rgba(0, 0, 0, 0.04)'};
  padding: 4px 8px;
  backdrop-filter: blur(10px);
  
  @media (max-width: 900px) {
    flex: 1;
    min-width: calc(50% - 8px);
    justify-content: flex-start;
    gap: 4px;
    padding: 4px 8px;
  }
`;

const Chip = styled.span`
  font-size: 12px;
  font-weight: 600;
  padding: 2px 6px;
  border: 1px solid ${({ theme }) => theme.pagination?.border || alpha(theme.palette.divider, 0.32)};
  border-radius: 6px;
  color: ${({ theme }) => theme.pagination?.textColor || theme.palette.text.primary};
`;

const Text = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.pagination?.textColor || theme.palette.text.secondary};
  font-weight: ${props => props.fontWeight || 500};
`;

const PaginationWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1rem;
  margin-bottom: 1rem;
  gap: 1rem;
  flex-wrap: wrap;
  
  @media (max-width: 900px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const CenterBox = styled.div`
  flex-grow: 1;
  display: flex;
  justify-content: center;
`;


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
        <span className={styles.sentimentPeriod}>
          {period}
        </span>
        <div className={styles.sentimentValues}>
          <span className={`${styles.sentimentValue} ${styles.bullish}`}>
            {stats.bullish || 0}%
          </span>
          <span className={styles.sentimentDivider}>·</span>
          <span className={`${styles.sentimentValue} ${styles.bearish}`}>
            {stats.bearish || 0}%
          </span>
          <span className={styles.sentimentDivider}>·</span>
          <span className={`${styles.sentimentValue} ${styles.neutral}`}>
            {stats.neutral || 0}%
          </span>
        </div>
      </div>
    );
  });
  
  SentimentSummary.displayName = 'SentimentSummary';

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
      <Container maxWidth="xl">
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
          </div>
        ) : error ? (
          <div className={styles.errorMessage} style={{ color: theme.palette.error.main }}>Error: {error}</div>
        ) : (
          <>
          <div className={`${styles.compactHeader} ${isDark ? styles.dark : ''}`}>
            <div className={styles.headerContent}>
              <div className={styles.titleSection}>
                <h1 className={styles.compactTitle} style={{ color: theme.palette.primary.main }}>
                  XRP News
                  {totalCount > 0 && (
                    <span className={styles.compactCount} style={{ color: theme.palette.text.secondary }}>
                      {totalCount.toLocaleString()}
                    </span>
                  )}
                </h1>
              </div>
              <form onSubmit={handleSearch} className={styles.searchForm}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: '14px',
                    px: 2.5,
                    py: 1.5,
                    height: '46px',
                    minWidth: { xs: '100%', sm: '320px' },
                    backgroundColor: 'transparent',
                    backdropFilter: 'blur(10px) saturate(150%)',
                    WebkitBackdropFilter: 'blur(10px) saturate(150%)',
                    border: `0.5px solid ${alpha(theme.palette.primary.main, isDark ? 0.12 : 0.18)}`,
                    boxShadow: 'none',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    '&:hover': {
                      backgroundColor: 'transparent',
                      border: `0.5px solid ${alpha(theme.palette.primary.main, isDark ? 0.25 : 0.35)}`,
                      boxShadow: 'none',
                      transform: 'translateY(-1px)'
                    },
                    '&:focus-within': {
                      border: `0.5px solid ${alpha(theme.palette.primary.main, isDark ? 0.35 : 0.45)}`,
                      transform: 'translateY(-1px)'
                    }
                  }}
                >
                  <SearchIcon
                    sx={{
                      fontSize: '1.3rem',
                      mr: 2,
                      color: alpha(theme.palette.primary.main, 0.6),
                      transition: 'all 0.25s ease'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Search news..."
                    aria-label="Search news articles"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    style={{
                      flex: 1,
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontSize: '0.96rem',
                      color: theme.palette.text.primary,
                      fontWeight: 500,
                      letterSpacing: '0.02em',
                      lineHeight: 1.2
                    }}
                  />
                  {searchInput && (
                    <>
                      <IconButton
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
                        sx={{
                          p: 0.5,
                          mr: 1,
                          color: alpha(theme.palette.text.primary, 0.5),
                          '&:hover': {
                            color: theme.palette.text.primary,
                            backgroundColor: alpha(theme.palette.action.hover, 0.08)
                          }
                        }}
                      >
                        <Icon icon="material-symbols:close" width="18" height="18" />
                      </IconButton>
                      <Box
                        component="button"
                        type="submit"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          px: 2,
                          py: 0.75,
                          borderRadius: '8px',
                          backgroundColor: theme.palette.primary.main,
                          color: theme.palette.primary.contrastText,
                          border: 'none',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: theme.palette.primary.dark,
                            transform: 'scale(1.02)'
                          },
                          '&:active': {
                            transform: 'scale(0.98)'
                          }
                        }}
                      >
                        Search
                      </Box>
                    </>
                  )}
                </Box>
              </form>
            </div>
          </div>

          <Box
            sx={{
              background: 'transparent',
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
              borderRadius: '8px',
              p: 1.5,
              mb: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ fontSize: '0.75rem', fontWeight: 600, color: theme.palette.text.secondary, textTransform: 'uppercase' }}>
                  Market Sentiment
                </Box>
                {searchQuery && searchSentimentScore !== null && (
                  <Box sx={{ 
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 0.5,
                    fontSize: '0.65rem',
                    fontWeight: 600
                  }}>
                    {searchSentimentScore}
                  </Box>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, fontSize: '0.65rem', color: theme.palette.text.secondary }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 6, height: 6, backgroundColor: '#10B981', borderRadius: '50%' }} />
                  Bull
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 6, height: 6, backgroundColor: '#EF4444', borderRadius: '50%' }} />
                  Bear
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 6, height: 6, backgroundColor: '#F59E0B', borderRadius: '50%' }} />
                  Neutral
                </Box>
              </Box>
            </Box>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
              {[
                { period: '24H', stats: sentimentStats.last24h },
                { period: '7D', stats: sentimentStats.last7d },
                { period: '30D', stats: sentimentStats.last30d },
                { period: 'ALL', stats: sentimentStats.all }
              ].map((item) => (
                <Box key={item.period} sx={{ 
                  backgroundColor: alpha(theme.palette.background.paper, 0.3),
                  borderRadius: '6px',
                  p: 1,
                  textAlign: 'center'
                }}>
                  <Box sx={{ 
                    fontSize: '0.7rem', 
                    fontWeight: 700, 
                    color: theme.palette.text.primary,
                    mb: 0.5
                  }}>
                    {item.period}
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, fontSize: '0.7rem', fontWeight: 600 }}>
                    <Box sx={{ color: '#10B981' }}>{item.stats?.bullish || 0}%</Box>
                    <Box sx={{ color: '#EF4444' }}>{item.stats?.bearish || 0}%</Box>
                    <Box sx={{ color: '#F59E0B' }}>{item.stats?.neutral || 0}%</Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          <SourcesMenu
            sources={sourcesStats}
            selectedSource={selectedSource}
            onSourceSelect={handleSourceSelect}
            isSyncWave={isSyncWave}
          />

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
            <PaginationWrapper>
              <InfoBox>
                <Chip>{`${((currentPage - 1) * itemsPerPage) + 1}-${Math.min(currentPage * itemsPerPage, totalCount)} of ${totalCount.toLocaleString()}`}</Chip>
                <Text>articles</Text>
                {searchQuery && (
                  <>
                    <Text fontWeight={400}>for</Text>
                    <Text fontWeight={600}>"{searchQuery}"</Text>
                  </>
                )}
                {selectedSource && !searchQuery && (
                  <>
                    <Text fontWeight={400}>from</Text>
                    <Text fontWeight={600}>{selectedSource}</Text>
                  </>
                )}
              </InfoBox>

              {totalPages > 1 && (
                <CenterBox>
                  <PaginationContainer>
                    <NavButton
                      onClick={() => handlePageChange(null, 1)}
                      disabled={currentPage === 1}
                      title="First page"
                    >
                      <Icon icon="material-symbols:first-page" width="14" height="14" />
                    </NavButton>

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
                          return <PageEllipsis key={`ellipsis-${idx}`}>...</PageEllipsis>;
                        }
                        return (
                          <PageButton
                            key={pageNum}
                            selected={pageNum === currentPage}
                            onClick={() => handlePageChange(null, pageNum)}
                          >
                            {pageNum}
                          </PageButton>
                        );
                      });
                    })()}

                    <NavButton
                      onClick={() => handlePageChange(null, totalPages)}
                      disabled={currentPage === totalPages}
                      title="Last page"
                    >
                      <Icon icon="material-symbols:last-page" width="14" height="14" />
                    </NavButton>
                  </PaginationContainer>
                </CenterBox>
              )}
            </PaginationWrapper>
          )}
          </>
        )}
      </Container>
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
