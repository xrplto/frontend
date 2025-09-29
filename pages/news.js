import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import { useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import styled from '@emotion/styled';
import { alpha, Container, Box, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const Header = dynamic(() => import('../src/components/Header'), { ssr: true });
const Footer = dynamic(() => import('../src/components/Footer'), { ssr: true });

// Styled Components for Pagination (matching TokenList)
const PaginationContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  background: ${({ theme }) => theme.pagination?.background || theme.palette.background.paper};
  border: 1px solid ${({ theme }) => theme.pagination?.border || alpha(theme.palette.divider, 0.08)};
  box-shadow: ${({ theme }) => theme.pagination?.boxShadow || '0 4px 12px rgba(0, 0, 0, 0.06)'};
  backdrop-filter: blur(20px);
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.pagination?.boxShadow || '0 6px 16px rgba(0, 0, 0, 0.08)'};
  }

  @media (max-width: 900px) {
    width: 100%;
    justify-content: center;
    padding: 4px 8px;
    gap: 4px;
  }
`;

const NavButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.palette.text.primary || 'inherit'};
  padding: 0;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: ${({ theme }) =>
      theme.pagination?.backgroundHover || alpha(theme.palette.primary.main, 0.1)};
    transform: scale(1.05);
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  &:disabled {
    color: ${({ theme }) => alpha(theme.pagination?.textColor || theme.palette.text.primary, 0.3)};
    cursor: not-allowed;
  }
`;

const PageButton = styled.button`
  min-width: 24px;
  height: 24px;
  border-radius: 8px;
  border: none;
  background: ${(props) =>
    props.selected
      ? props.theme.pagination?.selectedBackground || props.theme.palette.primary.main
      : 'transparent'};
  color: ${(props) =>
    props.selected
      ? props.theme.pagination?.selectedTextColor || 'white'
      : props.theme.palette.text.primary || 'inherit'};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  margin: 0;
  font-size: 13px;
  font-weight: ${(props) => (props.selected ? 700 : 500)};
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: ${(props) =>
      props.selected
        ? props.theme.palette.primary.dark || '#1976D2'
        : props.theme.pagination?.backgroundHover || alpha(props.theme.palette.primary.main, 0.1)};
    transform: ${(props) => (props.selected ? 'none' : 'translateY(-1px)')};
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.3;
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
  gap: 6px;
  flex-wrap: wrap;
  border: 1px solid ${({ theme }) => theme.pagination?.border || alpha(theme.palette.divider, 0.08)};
  border-radius: 20px;
  background: ${({ theme }) => theme.pagination?.background || theme.palette.background.paper};
  box-shadow: ${({ theme }) => theme.pagination?.boxShadow || '0 4px 12px rgba(0, 0, 0, 0.06)'};
  padding: 8px 14px;
  backdrop-filter: blur(20px);
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.pagination?.boxShadow || '0 6px 16px rgba(0, 0, 0, 0.08)'};
  }

  @media (max-width: 900px) {
    flex: 1;
    min-width: calc(50% - 8px);
    justify-content: flex-start;
    gap: 4px;
    padding: 6px 10px;
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
  font-weight: ${(props) => props.fontWeight || 500};
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

const SourcesMenu = memo(({ sources, selectedSource, onSourceSelect, isMobile }) => {
  const theme = useTheme();
  const themeMode = useSelector((state) => state.status.theme);
  const isDark = themeMode === 'dark';
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

  // Simple transparent background like TokenRow with theme text color
  const containerStyle = {
    background: 'transparent',
    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
    color: theme.palette.text.primary
  };

  return (
    <div
      className={`${styles.sourcesMenuContainer} ${isDark ? styles.dark : ''}`}
      style={containerStyle}
    >
      <div className={styles.sourcesHeader}>
        <span className={styles.sourcesTitle}>
          {isMobile ? `Sources (${totalSources})` : `News Sources (${totalSources})`}
        </span>
        {totalSources > displayLimit && (
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
            color: !selectedSource
              ? theme.palette.primary.contrastText
              : theme.palette.primary.main,
            background: !selectedSource ? theme.palette.primary.main : 'transparent',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          All Sources
        </button>
        {displayedSources.map(([source, data]) => {
          const sentiment = data.sentiment;
          const hasSentiment =
            sentiment && (sentiment.Bullish || sentiment.Bearish || sentiment.Neutral);
          const isSelected = selectedSource === source;

          // Calculate sentiment bar widths
          const bullishWidth = sentiment?.Bullish || 0;
          const bearishWidth = sentiment?.Bearish || 0;
          const neutralWidth = sentiment?.Neutral || 0;

          return (
            <button
              key={source}
              className={`${styles.sourceChip} ${isSelected ? styles.selected : ''}`}
              onClick={() => onSourceSelect(source)}
              style={{
                borderColor: theme.palette.primary.main,
                color: isSelected ? theme.palette.primary.contrastText : theme.palette.text.primary,
                background: isSelected ? theme.palette.primary.main : 'transparent',
                position: 'relative',
                overflow: 'hidden',
                paddingRight: hasSentiment && !isMobile ? '4px' : '0.5rem'
              }}
            >
              {hasSentiment && !isSelected && (
                <div
                  className={styles.sentimentBar}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    display: 'flex',
                    background: alpha(theme.palette.divider, 0.1)
                  }}
                >
                  <div style={{ width: `${bullishWidth}%`, background: '#10B981' }} />
                  <div style={{ width: `${bearishWidth}%`, background: '#EF4444' }} />
                  <div style={{ width: `${neutralWidth}%`, background: '#F59E0B' }} />
                </div>
              )}
              <span className={styles.chipContent} style={{ position: 'relative', zIndex: 1 }}>
                <span>{source}</span>
                <span
                  className={styles.chipCount}
                  style={{ marginRight: hasSentiment && !isMobile ? '0.5rem' : 0 }}
                >
                  ({data.count})
                </span>
                {hasSentiment && !isMobile && (
                  <span className={styles.sentimentCompact}>
                    <span style={{ color: '#10B981', fontSize: '0.65rem', fontWeight: 600 }}>
                      {sentiment.Bullish}
                    </span>
                    <span
                      style={{ color: alpha(theme.palette.text.primary, 0.3), margin: '0 2px' }}
                    >
                      ·
                    </span>
                    <span style={{ color: '#EF4444', fontSize: '0.65rem', fontWeight: 600 }}>
                      {sentiment.Bearish}
                    </span>
                    <span
                      style={{ color: alpha(theme.palette.text.primary, 0.3), margin: '0 2px' }}
                    >
                      ·
                    </span>
                    <span style={{ color: '#F59E0B', fontSize: '0.65rem', fontWeight: 600 }}>
                      {sentiment.Neutral}
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

const SentimentSummary = memo(({ period, stats, isDark }) => {
  if (!stats) return null;

  return (
    <div className={`${styles.sentimentSummary} ${isDark ? styles.dark : ''}`}>
      <span className={styles.sentimentPeriod}>{period}</span>
      <div className={styles.sentimentValues}>
        <span className={`${styles.sentimentValue} ${styles.bullish}`}>{stats.bullish || 0}%</span>
        <span className={styles.sentimentDivider}>·</span>
        <span className={`${styles.sentimentValue} ${styles.bearish}`}>{stats.bearish || 0}%</span>
        <span className={styles.sentimentDivider}>·</span>
        <span className={`${styles.sentimentValue} ${styles.neutral}`}>{stats.neutral || 0}%</span>
      </div>
    </div>
  );
});

SentimentSummary.displayName = 'SentimentSummary';

function NewsPage() {
  const router = useRouter();
  const theme = useTheme();
  const themeMode = useSelector((state) => state.status.theme);
  const themeName = useSelector((state) => state.status.themeName);
  const isDark = themeMode === 'dark';
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
    if (isDark) {
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

  const stripHtml = useMemo(() => {
    const parser = typeof window !== 'undefined' ? new DOMParser() : null;
    return (html) => {
      if (!parser) return html;
      const doc = parser.parseFromString(html, 'text/html');
      return doc.body.textContent || '';
    };
  }, []);

  const extractTitle = useCallback((htmlContent) => {
    const titleMatch = htmlContent.match(/>([^<]+)</);
    return titleMatch ? titleMatch[1] : htmlContent;
  }, []);

  // Get background and text styles from theme
  const backgroundStyle = {
    background: theme.palette.background.default,
    minHeight: '100vh',
    color: theme.palette.text.primary
  };

  return (
    <div
      className={`${styles.pageWrapper} ${isDark ? styles.dark : ''}`}
      style={backgroundStyle}
    >
      <Header
        notificationPanelOpen={notificationPanelOpen}
        onNotificationPanelToggle={setNotificationPanelOpen}
      />
      <Container maxWidth={notificationPanelOpen ? false : "xl"}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
          </div>
        ) : error ? (
          <div className={styles.errorMessage} style={{ color: theme.palette.error.main }}>
            Error: {error}
          </div>
        ) : (
          <>
            <div className={`${styles.compactHeader} ${isDark ? styles.dark : ''}`}>
              <div className={styles.headerContent}>
                <div className={styles.titleSection}>
                  <h1 className={styles.compactTitle} style={{ color: theme.palette.primary.main }}>
                    XRP News
                    {totalCount > 0 && (
                      <span
                        className={styles.compactCount}
                        style={{ color: theme.palette.text.secondary }}
                      >
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
                          <ArrowForwardIcon sx={{ fontSize: 18 }} />
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
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
                borderRadius: '12px',
                p: { xs: 1.5, sm: 2 },
                mb: 2.5,
                backdropFilter: 'blur(10px)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(0, 0, 0, 0.1)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
                }
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: { xs: 1.5, sm: 2 }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      fontWeight: 600,
                      color: theme.palette.text.secondary,
                      textTransform: 'uppercase'
                    }}
                  >
                    {isMobile ? 'Sentiment' : 'Market Sentiment'}
                  </Box>
                  {searchQuery && searchSentimentScore !== null && (
                    <Box
                      sx={{
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        px: 0.75,
                        py: 0.25,
                        borderRadius: 0.5,
                        fontSize: '0.65rem',
                        fontWeight: 600
                      }}
                    >
                      {searchSentimentScore}
                    </Box>
                  )}
                </Box>
                <Box
                  sx={{
                    display: { xs: 'none', sm: 'flex' },
                    gap: 1.5,
                    fontSize: '0.65rem',
                    color: theme.palette.text.secondary,
                    opacity: 0.8
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box
                      sx={{ width: 6, height: 6, backgroundColor: '#10B981', borderRadius: '50%' }}
                    />
                    Bull
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box
                      sx={{ width: 6, height: 6, backgroundColor: '#EF4444', borderRadius: '50%' }}
                    />
                    Bear
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box
                      sx={{ width: 6, height: 6, backgroundColor: '#F59E0B', borderRadius: '50%' }}
                    />
                    Neutral
                  </Box>
                </Box>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                  gap: { xs: 0.75, sm: 1.25 }
                }}
              >
                {[
                  { period: '24H', stats: sentimentStats.last24h },
                  { period: '7D', stats: sentimentStats.last7d },
                  { period: '30D', stats: sentimentStats.last30d },
                  { period: 'ALL', stats: sentimentStats.all }
                ].map((item) => (
                  <Box
                    key={item.period}
                    sx={{
                      backgroundColor: alpha(theme.palette.background.paper, 0.4),
                      borderRadius: '10px',
                      p: { xs: 0.75, sm: 1.25 },
                      textAlign: 'center',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.background.paper, 0.6),
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    <Box
                      sx={{
                        fontSize: { xs: '0.65rem', sm: '0.7rem' },
                        fontWeight: 700,
                        color: theme.palette.text.primary,
                        mb: { xs: 0.25, sm: 0.5 },
                        letterSpacing: '0.5px'
                      }}
                    >
                      {item.period}
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        justifyContent: 'center',
                        gap: { xs: 0, sm: 0.5 },
                        fontSize: { xs: '0.6rem', sm: '0.7rem' },
                        fontWeight: 600
                      }}
                    >
                      <Box sx={{ color: '#10B981' }}>
                        {item.stats?.bullish || 0}
                        <span style={{ fontSize: '0.5rem' }}>%</span>
                      </Box>
                      <Box sx={{ color: '#EF4444', display: { xs: 'none', sm: 'block' } }}>
                        {item.stats?.bearish || 0}%
                      </Box>
                      <Box sx={{ color: '#F59E0B', display: { xs: 'none', sm: 'block' } }}>
                        {item.stats?.neutral || 0}%
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>

            <SourcesMenu
              sources={sourcesStats}
              selectedSource={selectedSource}
              onSourceSelect={handleSourceSelect}
              isMobile={isMobile}
            />

            <div className={`${styles.newsGrid} ${isDark ? styles.dark : ''}`}>
              {currentItems.length === 0 ? (
                <div
                  style={{
                    gridColumn: '1 / -1',
                    textAlign: 'center',
                    padding: '4rem 2rem',
                    color: theme.palette.text.secondary,
                    fontSize: '1.1rem',
                    fontWeight: 500
                  }}
                >
                  No news found at the moment
                </div>
              ) : (
                currentItems.map((article) => (
                  <div
                    key={article._id}
                    className={`${styles.newsCard} ${isDark ? styles.dark : ''}`}
                    style={{
                      background: 'transparent',
                      border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
                      color: theme.palette.text.primary
                    }}
                  >
                    <div className={`${styles.cardContent} ${isDark ? styles.dark : ''}`}>
                      <div className={styles.cardHeader}>
                        <h2
                          className={styles.articleTitle}
                          style={{ color: theme.palette.text.primary }}
                        >
                          {extractTitle(article.title)}
                        </h2>
                        <div className={styles.sentimentBadge}>
                          <span
                            className={styles.sentimentLabel}
                            style={{
                              backgroundColor: getSentimentColor(article.sentiment),
                              transition: 'all 0.2s ease',
                              transform: 'scale(1)'
                            }}
                            onMouseEnter={(e) => (e.target.style.transform = 'scale(1.05)')}
                            onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
                          >
                            {article.sentiment || 'Unknown'}
                          </span>
                        </div>
                      </div>
                      <div className={styles.articleContent}>
                        <p
                          className={styles.articleSummary}
                          style={{ color: theme.palette.text.secondary }}
                        >
                          {article.summary}
                        </p>
                      </div>
                      <div className={styles.divider}></div>
                      <div className={`${styles.cardFooter} ${isMobile ? styles.mobile : ''}`}>
                        <div className={styles.metaInfo}>
                          <span
                            className={styles.sourceMeta}
                            style={{ color: theme.palette.text.secondary }}
                          >
                            {article.sourceName} •{' '}
                            <time dateTime={article.pubDate}>
                              {formatDistanceToNow(new Date(article.pubDate), { addSuffix: true })}
                            </time>
                          </span>
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
                ))
              )}
            </div>

            {totalCount > 0 && (
              <PaginationWrapper>
                <InfoBox>
                  <Chip>{`${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, totalCount)} of ${totalCount.toLocaleString()}`}</Chip>
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
                        <ArrowForwardIcon sx={{ fontSize: 14, transform: 'rotate(180deg)' }} />
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
                        <ArrowForwardIcon sx={{ fontSize: 14 }} />
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
