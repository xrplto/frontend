import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import { useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import styled from '@emotion/styled';
import {
  alpha,
  Container,
  Box,
  IconButton,
  Typography,
  Paper,
  Chip,
  Button,
  CircularProgress,
  Stack,
  Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ClearIcon from '@mui/icons-material/Clear';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

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

const StyledChip = styled.span`
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
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1, sm: 1.5 },
        mb: 2,
        background: 'transparent',
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        borderRadius: 2
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            color: theme.palette.text.secondary
          }}
        >
          {isMobile ? `Sources (${totalSources})` : `News Sources (${totalSources})`}
        </Typography>
        {totalSources > displayLimit && (
          <Button
            size="small"
            onClick={() => setShowAll(!showAll)}
            sx={{
              fontSize: '0.75rem',
              px: 1,
              py: 0.5,
              minHeight: 'auto',
              textTransform: 'none',
              borderRadius: 1
            }}
          >
            {showAll ? 'Show Less' : `Show All (+${hiddenCount})`}
          </Button>
        )}
      </Stack>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
        <Chip
          label="All Sources"
          onClick={() => onSourceSelect(null)}
          variant={!selectedSource ? "filled" : "outlined"}
          size="small"
          sx={{
            fontSize: '0.7rem',
            height: 26,
            '& .MuiChip-label': { px: 1 }
          }}
        />
        {displayedSources.map(([source, data]) => {
          const sentiment = data.sentiment;
          const hasSentiment = sentiment && (sentiment.Bullish || sentiment.Bearish || sentiment.Neutral);
          const isSelected = selectedSource === source;

          return (
            <Box key={source} sx={{ position: 'relative' }}>
              <Chip
                label={
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <span>{source}</span>
                    <span style={{ opacity: 0.6 }}>({data.count})</span>
                    {hasSentiment && !isMobile && (
                      <Stack direction="row" spacing={0.25} alignItems="center">
                        <Typography sx={{ color: '#10B981', fontSize: '0.65rem', fontWeight: 600 }}>
                          {sentiment.Bullish}
                        </Typography>
                        <span>·</span>
                        <Typography sx={{ color: '#EF4444', fontSize: '0.65rem', fontWeight: 600 }}>
                          {sentiment.Bearish}
                        </Typography>
                        <span>·</span>
                        <Typography sx={{ color: '#F59E0B', fontSize: '0.65rem', fontWeight: 600 }}>
                          {sentiment.Neutral}
                        </Typography>
                      </Stack>
                    )}
                  </Stack>
                }
                onClick={() => onSourceSelect(source)}
                variant={isSelected ? "filled" : "outlined"}
                size="small"
                sx={{
                  fontSize: '0.7rem',
                  height: 26,
                  '& .MuiChip-label': { px: 1 },
                  position: 'relative',
                  overflow: 'hidden'
                }}
              />
              {hasSentiment && !isSelected && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    display: 'flex',
                    borderRadius: '0 0 16px 16px',
                    overflow: 'hidden'
                  }}
                >
                  <Box sx={{ width: `${sentiment.Bullish}%`, bgcolor: '#10B981' }} />
                  <Box sx={{ width: `${sentiment.Bearish}%`, bgcolor: '#EF4444' }} />
                  <Box sx={{ width: `${sentiment.Neutral}%`, bgcolor: '#F59E0B' }} />
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
});

SourcesMenu.displayName = 'SourcesMenu';

function NewsPage() {
  const router = useRouter();
  const theme = useTheme();
  const themeMode = useSelector((state) => state.status.theme);
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
    const titleMatch = htmlContent.match(/>([^<]+)</);
    return titleMatch ? titleMatch[1] : htmlContent;
  }, []);

  return (
    <Box
      sx={{
        bgcolor: theme.palette.background.default,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Header
        notificationPanelOpen={notificationPanelOpen}
        onNotificationPanelToggle={setNotificationPanelOpen}
      />
      <Container maxWidth={notificationPanelOpen ? false : "xl"} sx={{ flex: 1, py: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" align="center" sx={{ py: 4 }}>
            Error: {error}
          </Typography>
        ) : (
          <>
            {/* Header with Search */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 2,
                background: alpha(theme.palette.background.paper, 0.02),
                border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                borderRadius: 2
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                alignItems={{ xs: 'stretch', sm: 'center' }}
                justifyContent="space-between"
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    XRP News
                  </Typography>
                  {totalCount > 0 && (
                    <Chip
                      label={totalCount.toLocaleString()}
                      size="small"
                      sx={{
                        height: 24,
                        fontSize: '0.75rem',
                        bgcolor: alpha(theme.palette.primary.main, 0.1)
                      }}
                    />
                  )}
                </Stack>

                <Box
                  component="form"
                  onSubmit={handleSearch}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: 2,
                    px: 2,
                    py: 1,
                    minWidth: { xs: '100%', sm: 320 },
                    border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                    bgcolor: 'transparent',
                    '&:hover': {
                      borderColor: alpha(theme.palette.primary.main, 0.3)
                    },
                    '&:focus-within': {
                      borderColor: theme.palette.primary.main
                    }
                  }}
                >
                  <SearchIcon sx={{ mr: 1.5, color: theme.palette.text.secondary, fontSize: 20 }} />
                  <input
                    type="text"
                    placeholder="Search news..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    style={{
                      flex: 1,
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontSize: '0.9rem',
                      color: theme.palette.text.primary
                    }}
                  />
                  {searchInput && (
                    <>
                      <IconButton
                        size="small"
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
                        <ClearIcon fontSize="small" />
                      </IconButton>
                      <Button
                        type="submit"
                        size="small"
                        sx={{
                          ml: 1,
                          minWidth: 'auto',
                          px: 2,
                          py: 0.75,
                          fontSize: '0.875rem'
                        }}
                      >
                        Search
                      </Button>
                    </>
                  )}
                </Box>
              </Stack>
            </Paper>

            {/* Sentiment Summary */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 2,
                background: 'transparent',
                border: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
                borderRadius: 2
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                    {isMobile ? 'Sentiment' : 'Market Sentiment'}
                  </Typography>
                  {searchQuery && searchSentimentScore !== null && (
                    <Chip
                      label={searchSentimentScore}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        bgcolor: alpha(theme.palette.primary.main, 0.1)
                      }}
                    />
                  )}
                </Stack>
                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{ display: { xs: 'none', sm: 'flex' }, fontSize: '0.65rem' }}
                >
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Box sx={{ width: 6, height: 6, bgcolor: '#10B981', borderRadius: '50%' }} />
                    <Typography variant="caption">Bull</Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Box sx={{ width: 6, height: 6, bgcolor: '#EF4444', borderRadius: '50%' }} />
                    <Typography variant="caption">Bear</Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Box sx={{ width: 6, height: 6, bgcolor: '#F59E0B', borderRadius: '50%' }} />
                    <Typography variant="caption">Neutral</Typography>
                  </Stack>
                </Stack>
              </Stack>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                  gap: 1
                }}
              >
                {[
                  { period: '24H', stats: sentimentStats.last24h },
                  { period: '7D', stats: sentimentStats.last7d },
                  { period: '30D', stats: sentimentStats.last30d },
                  { period: 'ALL', stats: sentimentStats.all }
                ].map((item) => (
                  <Paper
                    key={item.period}
                    elevation={0}
                    sx={{
                      p: 1.5,
                      textAlign: 'center',
                      bgcolor: alpha(theme.palette.background.paper, 0.4),
                      border: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
                      borderRadius: 1.5
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                      {item.period}
                    </Typography>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      justifyContent="center"
                      spacing={0.5}
                      sx={{ mt: 0.5, fontSize: '0.7rem', fontWeight: 600 }}
                    >
                      <Typography sx={{ color: '#10B981', fontSize: '0.7rem' }}>
                        {item.stats?.bullish || 0}%
                      </Typography>
                      <Typography sx={{ color: '#EF4444', fontSize: '0.7rem', display: { xs: 'none', sm: 'block' } }}>
                        {item.stats?.bearish || 0}%
                      </Typography>
                      <Typography sx={{ color: '#F59E0B', fontSize: '0.7rem', display: { xs: 'none', sm: 'block' } }}>
                        {item.stats?.neutral || 0}%
                      </Typography>
                    </Stack>
                  </Paper>
                ))}
              </Box>
            </Paper>

            <SourcesMenu
              sources={sourcesStats}
              selectedSource={selectedSource}
              onSourceSelect={handleSourceSelect}
              isMobile={isMobile}
            />

            {/* News Grid */}
            <Stack spacing={2}>
              {currentItems.length === 0 ? (
                <Typography
                  align="center"
                  sx={{
                    py: 8,
                    color: theme.palette.text.secondary,
                    fontSize: '1.1rem',
                    fontWeight: 500
                  }}
                >
                  No news found at the moment
                </Typography>
              ) : (
                currentItems.map((article) => (
                  <Paper
                    key={article._id}
                    elevation={0}
                    sx={{
                      p: 3,
                      background: 'transparent',
                      border: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
                      borderRadius: 2,
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.action.hover, 0.02)
                      }
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Typography variant="body1" sx={{ fontWeight: 500, pr: 2 }}>
                        {extractTitle(article.title)}
                      </Typography>
                      <Chip
                        label={article.sentiment || 'Unknown'}
                        size="small"
                        sx={{
                          bgcolor: getSentimentColor(article.sentiment),
                          color: 'white',
                          fontSize: '0.75rem'
                        }}
                      />
                    </Stack>

                    <Typography variant="body2" color="text.secondary" paragraph>
                      {article.summary}
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                      spacing={1}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {article.sourceName} •{' '}
                        <time dateTime={article.pubDate}>
                          {formatDistanceToNow(new Date(article.pubDate), { addSuffix: true })}
                        </time>
                      </Typography>
                      <Typography
                        component="a"
                        href={article.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          color: theme.palette.primary.main,
                          textDecoration: 'none',
                          fontSize: '0.875rem',
                          display: 'flex',
                          alignItems: 'center',
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        Read full article →
                      </Typography>
                    </Stack>
                  </Paper>
                ))
              )}
            </Stack>

            {/* Pagination */}
            {totalCount > 0 && (
              <PaginationWrapper>
                <InfoBox>
                  <StyledChip>{`${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, totalCount)} of ${totalCount.toLocaleString()}`}</StyledChip>
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
                        <ArrowBackIcon sx={{ fontSize: 14 }} />
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
    </Box>
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