import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Pagination,
  Stack,
  useTheme,
  useMediaQuery
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { differenceInHours, differenceInDays, formatDistanceToNow } from 'date-fns';
import Header from '../src/components/Header';
import Footer from '../src/components/Footer';
import Topbar from '../src/components/Topbar';
import useWebSocket from 'react-use-websocket';
import { useDispatch } from 'react-redux';
import { update_metrics } from 'src/redux/statusSlice';

const SourcesMenu = ({ sources, selectedSource, onSourceSelect }) => {
  const theme = useTheme();
  const [showAll, setShowAll] = useState(false);
  const sortedSources = Object.entries(sources).sort(([, a], [, b]) => b.count - a.count);
  const displayedSources = showAll ? sortedSources : sortedSources.slice(0, 12);
  const totalSources = sortedSources.length;
  const hiddenCount = totalSources - 12;

  return (
    <Paper
      sx={{
        mb: 2,
        py: 1,
        px: 1.5,
        background:
          theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${
          theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
        }`,
        borderRadius: 2
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)',
            fontSize: '0.875rem'
          }}
        >
          News Sources ({totalSources})
        </Typography>
        {totalSources > 12 && (
          <Chip
            label={showAll ? 'Show Less' : `Show All (+${hiddenCount})`}
            size="small"
            onClick={() => setShowAll(!showAll)}
            sx={{
              cursor: 'pointer',
              background: theme.palette.primary.main,
              color: '#fff',
              '&:hover': {
                background: theme.palette.primary.dark
              }
            }}
          />
        )}
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        <Chip
          key="all"
          label="All Sources"
          size="small"
          onClick={() => onSourceSelect(null)}
          sx={{
            background: !selectedSource ? theme.palette.primary.main : 'transparent',
            color: !selectedSource ? '#fff' : theme.palette.primary.main,
            border: `1px solid ${theme.palette.primary.main}`,
            height: '22px',
            fontSize: '0.75rem',
            '& .MuiChip-label': {
              px: 0.75,
              py: 0
            },
            '&:hover': {
              background: !selectedSource ? theme.palette.primary.dark : theme.palette.primary.main,
              color: '#fff'
            }
          }}
        />
        {displayedSources.map(([source, data]) => {
          const sentiment = data.sentiment;
          const hasSentiment = sentiment && (sentiment.Bullish || sentiment.Bearish || sentiment.Neutral);
          
          return (
            <Chip
              key={source}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <span>{source}</span>
                  <span style={{ opacity: 0.7, fontSize: '0.85em' }}>({data.count})</span>
                  {hasSentiment && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, ml: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ 
                          width: 6, 
                          height: 6, 
                          borderRadius: '50%', 
                          bgcolor: 'success.main',
                          mr: 0.25
                        }} />
                        <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                          {sentiment.Bullish}%
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ 
                          width: 6, 
                          height: 6, 
                          borderRadius: '50%', 
                          bgcolor: 'error.main',
                          mr: 0.25
                        }} />
                        <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                          {sentiment.Bearish}%
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ 
                          width: 6, 
                          height: 6, 
                          borderRadius: '50%', 
                          bgcolor: 'warning.main',
                          mr: 0.25
                        }} />
                        <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                          {sentiment.Neutral}%
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              }
              size="small"
              onClick={() => onSourceSelect(source)}
              sx={{
                background: selectedSource === source ? theme.palette.primary.main : 'transparent',
                color: selectedSource === source ? '#fff' : theme.palette.primary.main,
                border: `1px solid ${theme.palette.primary.main}`,
                height: '22px',
                fontSize: '0.75rem',
                '& .MuiChip-label': {
                  px: 0.75,
                  py: 0
                },
                '&:hover': {
                  background:
                    selectedSource === source
                      ? theme.palette.primary.dark
                      : theme.palette.primary.main,
                  color: '#fff'
                }
              }}
            />
          );
        })}
      </Box>
    </Paper>
  );
};

function NewsPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSource, setSelectedSource] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [sentimentStats, setSentimentStats] = useState({
    last24h: { bullish: 0, bearish: 0, neutral: 0 },
    last7d: { bullish: 0, bearish: 0, neutral: 0 },
    last30d: { bullish: 0, bearish: 0, neutral: 0 },
    all: { bullish: 0, bearish: 0, neutral: 0 }
  });
  const [sourcesStats, setSourcesStats] = useState({});
  const [expandedArticles, setExpandedArticles] = useState({});

  // Add WebSocket connection
  const WSS_FEED_URL = 'wss://api.xrpl.to/ws/sync';
  const { sendJsonMessage } = useWebSocket(WSS_FEED_URL, {
    shouldReconnect: (closeEvent) => true,
    onMessage: (event) => {
      try {
        const json = JSON.parse(event.data);
        dispatch(update_metrics(json));
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    }
  });

  // No client-side filtering needed - all filtering is done server-side
  const filteredNews = Array.isArray(news) ? news : [];

  // Calculate pagination - always use totalCount from API when available
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  
  console.log('Pagination debug:', { totalCount, itemsPerPage, totalPages, filteredNewsLength: filteredNews.length });
  
  // News is always paginated by API now
  const currentItems = filteredNews;

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    const query = { page: value };
    if (itemsPerPage !== 10) query.limit = itemsPerPage;
    if (selectedSource) query.source = selectedSource;
    if (searchQuery) query.q = searchQuery;
    router.push({ pathname: '/news', query }, undefined, { shallow: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSourceSelect = (source) => {
    setSelectedSource(source);
    setCurrentPage(1);
    const query = { page: 1 };
    if (itemsPerPage !== 10) query.limit = itemsPerPage;
    if (source) query.source = source;
    if (searchQuery) query.q = searchQuery;
    router.push({ pathname: '/news', query }, undefined, { shallow: true });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setCurrentPage(1);
    const query = { page: 1 };
    if (itemsPerPage !== 10) query.limit = itemsPerPage;
    if (selectedSource) query.source = selectedSource;
    if (searchInput) query.q = searchInput;
    router.push({ pathname: '/news', query }, undefined, { shallow: true });
  };

  const toggleArticleExpansion = (articleId) => {
    setExpandedArticles((prev) => ({
      ...prev,
      [articleId]: !prev[articleId]
    }));
  };

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
        
        console.log('Fetching from endpoint:', endpoint);
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error('Failed to fetch news');
        }
        const data = await response.json();
        console.log('API Response:', data);
        
        // Check if response has data array (both regular and search endpoints have this)
        if (data.data && Array.isArray(data.data)) {
          setNews(data.data);
          // Set total count from pagination info
          if (data.pagination && data.pagination.total) {
            setTotalCount(data.pagination.total);
          }
          
          // Only process sources if they exist (not present in search endpoint)
          if (data.sources) {
            console.log('Sources data:', data.sources); // Debug log
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
        }

        // Only calculate sentiment if not provided by API
        if (!data.sentiment) {
          const now = new Date();
          const stats = {
            last24h: { bullish: 0, bearish: 0, neutral: 0 },
            last7d: { bullish: 0, bearish: 0, neutral: 0 },
            last30d: { bullish: 0, bearish: 0, neutral: 0 }
          };

          const newsData = data.data || (Array.isArray(data) ? data : []);
          if (Array.isArray(newsData)) {
            newsData.forEach((article) => {
              const pubDate = new Date(article.pubDate);
              const sentiment = article.sentiment?.toLowerCase() || 'neutral';

              if (differenceInHours(now, pubDate) <= 24) {
                stats.last24h[sentiment]++;
              }
              if (differenceInDays(now, pubDate) <= 7) {
                stats.last7d[sentiment]++;
              }
              if (differenceInDays(now, pubDate) <= 30) {
                stats.last30d[sentiment]++;
              }
            });
          }

          setSentimentStats(stats);
        }
      } catch (error) {
        console.error('Error fetching news:', error);
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
        return theme.palette.success.main;
      case 'bearish':
        return theme.palette.error.main;
      case 'neutral':
        return theme.palette.warning.main;
      default:
        return theme.palette.grey[500];
    }
  };

  // Function to strip HTML tags
  const stripHtml = (html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  // Function to extract title from HTML content
  const extractTitle = (htmlContent) => {
    const titleMatch = htmlContent.match(/>([^<]+)</);
    return titleMatch ? titleMatch[1] : htmlContent;
  };

  const SentimentSummary = ({ period, stats }) => {
    if (!stats) return null;
    
    return (
      <Box sx={{ flex: 1, py: 0.5, px: isMobile ? 0.5 : 1 }}>
        <Typography variant="subtitle2" sx={{ mb: 0.8, color: 'rgba(255,255,255,0.7)', fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
          {period}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
          <Chip
            label={`Bullish ${stats.bullish || 0}%`}
            size="small"
            sx={{
              background: theme.palette.mode === 'dark' && theme.palette.primary.main === '#FFD700' 
                ? 'linear-gradient(90deg, #00FF87 0%, #00E673 100%)' 
                : 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)',
              color: 'white',
              height: '22px',
              fontWeight: 500,
              boxShadow: theme.palette.mode === 'dark' && theme.palette.primary.main === '#FFD700' 
                ? '0px 0px 10px rgba(0, 255, 135, 0.5)' 
                : 'none'
            }}
          />
          <Chip
            label={`Bearish ${stats.bearish || 0}%`}
            size="small"
            sx={{
              background: 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              height: '22px',
              fontWeight: 500
            }}
          />
          <Chip
            label={`Neutral ${stats.neutral || 0}%`}
            size="small"
            sx={{
              background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              height: '22px',
              fontWeight: 500
            }}
          />
        </Box>
      </Box>
    );
  };

  if (loading) {
    return (
      <>
        <Topbar />
        <Header />
        <Container maxWidth="xl" sx={{ py: 4, textAlign: 'center' }}>
          <CircularProgress />
        </Container>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Topbar />
        <Header />
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Typography color="error">Error: {error}</Typography>
        </Container>
        <Footer />
      </>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: theme.palette.mode === 'dark' ? '#000' : '#fff'
      }}
    >
      <Topbar />
      <Header />
      <Box sx={{ flex: 1 }}>
        <Container maxWidth="xl" sx={{ py: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                color: theme.palette.primary.main,
                fontWeight: 600
              }}
            >
              Latest XRPL News
            </Typography>
            {totalCount > 0 && (
              <Typography
                variant="subtitle1"
                sx={{
                  color: theme.palette.text.secondary,
                  mt: 0.5
                }}
              >
                {totalCount.toLocaleString()} articles indexed
              </Typography>
            )}
          </Box>

          <Box sx={{ mb: 3 }}>
            <form onSubmit={handleSearch}>
              <Paper
                elevation={0}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  px: 2,
                  py: 1,
                  background: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.05)' 
                    : 'rgba(0,0,0,0.03)',
                  border: `1px solid ${
                    theme.palette.mode === 'dark' 
                      ? 'rgba(255,255,255,0.1)' 
                      : 'rgba(0,0,0,0.1)'
                  }`,
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    background: theme.palette.mode === 'dark' 
                      ? 'rgba(255,255,255,0.08)' 
                      : 'rgba(0,0,0,0.05)',
                  },
                  '&:focus-within': {
                    borderColor: theme.palette.primary.main,
                    boxShadow: `0 0 0 2px ${theme.palette.primary.main}20`,
                  }
                }}
              >
                <SearchIcon
                  sx={{
                    color: theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.5)'
                      : 'rgba(0,0,0,0.5)',
                    mr: 1.5
                  }}
                />
                <TextField
                  fullWidth
                  size="small"
                  variant="standard"
                  placeholder="Search news..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  InputProps={{
                    disableUnderline: true,
                    style: { fontSize: '0.95rem' },
                    endAdornment: searchInput && (
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSearchInput('');
                          setSearchQuery('');
                          setCurrentPage(1);
                          const query = { page: 1 };
                          if (itemsPerPage !== 10) query.limit = itemsPerPage;
                          if (selectedSource) query.source = selectedSource;
                          router.push({ pathname: '/news', query }, undefined, { shallow: true });
                        }}
                        sx={{
                          ml: 1,
                          p: 0.5,
                          '&:hover': {
                            bgcolor: theme.palette.mode === 'dark'
                              ? 'rgba(255,255,255,0.1)'
                              : 'rgba(0,0,0,0.1)'
                          }
                        }}
                      >
                        <Box
                          component="span"
                          sx={{ 
                            fontSize: '1.2rem',
                            color: theme.palette.mode === 'dark' 
                              ? 'rgba(255,255,255,0.5)' 
                              : 'rgba(0,0,0,0.5)'
                          }}
                        >
                          ×
                        </Box>
                      </IconButton>
                    )
                  }}
                  sx={{
                    '& .MuiInput-root': {
                      color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: theme.palette.mode === 'dark' 
                        ? 'rgba(255,255,255,0.5)' 
                        : 'rgba(0,0,0,0.5)',
                      opacity: 1
                    }
                  }}
                />
                {searchInput && (
                  <Chip
                    label="Search"
                    size="small"
                    onClick={handleSearch}
                    sx={{
                      ml: 1,
                      height: 28,
                      bgcolor: theme.palette.primary.main,
                      color: '#fff',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: theme.palette.primary.dark
                      }
                    }}
                  />
                )}
              </Paper>
            </form>
          </Box>

          <SourcesMenu
            sources={sourcesStats}
            selectedSource={selectedSource}
            onSourceSelect={handleSourceSelect}
          />

          <Paper
            sx={{
              mb: 2,
              p: 1.5,
              background:
                theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${
                theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
              }`,
              borderRadius: 2
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                mb: 2,
                color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)',
                fontWeight: 600
              }}
            >
              Sentiment Analysis
              {selectedSource && (
                <Typography
                  component="span"
                  sx={{
                    ml: 1,
                    color:
                      theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'
                  }}
                >
                  ({selectedSource})
                </Typography>
              )}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', flexWrap: 'wrap', gap: isMobile ? 1 : 2 }}>
              <SentimentSummary period="Last 24h" stats={sentimentStats.last24h} />
              <Divider
                orientation="vertical"
                flexItem
                sx={{
                  borderColor:
                    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  display: isMobile ? 'none' : 'block'
                }}
              />
              <SentimentSummary period="7d" stats={sentimentStats.last7d} />
              <Divider
                orientation="vertical"
                flexItem
                sx={{
                  borderColor:
                    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  display: isMobile ? 'none' : 'block'
                }}
              />
              <SentimentSummary period="30d" stats={sentimentStats.last30d} />
              <Divider
                orientation="vertical"
                flexItem
                sx={{
                  borderColor:
                    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  display: isMobile ? 'none' : 'block'
                }}
              />
              <SentimentSummary period="All Time" stats={sentimentStats.all} />
            </Box>
          </Paper>

          <Grid container spacing={2}>
            {currentItems.map((article) => (
              <Grid item xs={12} key={article._id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    background:
                      theme.palette.mode === 'dark'
                        ? 'rgba(0, 0, 0, 0.6)'
                        : 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${
                      theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                    }`,
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow:
                        theme.palette.mode === 'dark'
                          ? '0 8px 24px rgba(255,255,255,0.1)'
                          : '0 8px 24px rgba(0,0,0,0.1)',
                      borderColor: theme.palette.primary.main
                    }
                  }}
                >
                  <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    <Box
                      sx={{
                        display: 'flex',
                        gap: isMobile ? 1.5 : 2,
                        mb: 1.5
                      }}
                    >
                      {article.articleImage && (
                        <Box
                          sx={{
                            flexShrink: 0,
                            width: isMobile ? 60 : 80,
                            height: isMobile ? 60 : 80,
                            borderRadius: 1,
                            overflow: 'hidden',
                            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                          }}
                        >
                          <img
                            src={article.articleImage}
                            alt={extractTitle(article.title)}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                            onError={(e) => {
                              e.target.parentElement.style.display = 'none';
                            }}
                          />
                        </Box>
                      )}
                      <Box sx={{ flex: 1 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            mb: 1
                          }}
                        >
                          <Typography
                            variant="h6"
                            component="h2"
                            sx={{
                              flex: 1,
                              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                              fontWeight: 500,
                              fontSize: isMobile ? '1rem' : '1.1rem',
                              lineHeight: isMobile ? 1.3 : 1.4
                            }}
                          >
                            {extractTitle(article.title)}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 2 }}>
                            <Chip
                              label={article.sentiment || 'Unknown'}
                              size="small"
                              sx={{
                                backgroundColor: getSentimentColor(article.sentiment),
                                color: '#fff',
                                height: '22px',
                                fontWeight: 500
                              }}
                            />
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        mb: 1.5,
                        color:
                          theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.7)'
                            : 'rgba(0,0,0,0.7)',
                        lineHeight: 1.6
                      }}
                    >
                      {article.summary}
                    </Typography>
                    <Divider
                      sx={{
                        my: 1.5,
                        borderColor:
                          theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.1)'
                            : 'rgba(0,0,0,0.1)'
                      }}
                    />
                    {expandedArticles[article._id] && (
                      <Typography
                        variant="body2"
                        sx={{
                          mb: 1.5,
                          color:
                            theme.palette.mode === 'dark'
                              ? 'rgba(255,255,255,0.8)'
                              : 'rgba(0,0,0,0.8)',
                          lineHeight: 1.6
                        }}
                      >
                        {article.articleBody?.split('\n').map(
                          (paragraph, index) =>
                            paragraph.trim() && (
                              <Typography
                                key={`${article._id}-para-${paragraph.substring(0, 20).replace(/\s+/g, '')}`}
                                paragraph
                                sx={{ mb: 1 }}
                              >
                                {paragraph}
                              </Typography>
                            )
                        )}
                      </Typography>
                    )}
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        justifyContent: 'space-between',
                        alignItems: isMobile ? 'flex-start' : 'center',
                        gap: isMobile ? 1 : 0,
                        mt: 1
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color:
                              theme.palette.mode === 'dark'
                                ? 'rgba(255,255,255,0.5)'
                                : 'rgba(0,0,0,0.5)'
                          }}
                        >
                          {article.sourceName} •{' '}
                          {formatDistanceToNow(new Date(article.pubDate), { addSuffix: true })}
                        </Typography>
                        {article.articleBody && (
                          <Chip
                            label={expandedArticles[article._id] ? 'Show Less' : 'Show More'}
                            size="small"
                            onClick={() => toggleArticleExpansion(article._id)}
                            sx={{
                              cursor: 'pointer',
                              backgroundColor: 'transparent',
                              color: theme.palette.primary.main,
                              border: `1px solid ${theme.palette.primary.main}`,
                              '&:hover': {
                                backgroundColor: theme.palette.primary.main,
                                color: '#fff'
                              }
                            }}
                          />
                        )}
                      </Box>
                      <Typography
                        variant="caption"
                        component="a"
                        href={article.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          color: theme.palette.primary.main,
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          '&:hover': {
                            color: theme.palette.primary.dark
                          }
                        }}
                      >
                        Read full article →
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {totalCount > 0 && (
            <Stack spacing={2} alignItems="center" sx={{ mt: 4, mb: 2 }}>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                {searchQuery && `Found ${totalCount} articles for "${searchQuery}"`}
                {selectedSource && !searchQuery && `Showing ${totalCount} articles from ${selectedSource}`}
                {!searchQuery && !selectedSource && `Showing ${currentItems.length} of ${totalCount} articles`}
              </Typography>
              {totalPages > 1 && (
                <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 2,
                  borderRadius: 2,
                  background:
                    theme.palette.mode === 'dark'
                      ? 'rgba(0, 0, 0, 0.6)'
                      : 'rgba(255, 255, 255, 0.9)',
                  border: `1px solid ${
                    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                  }`
                }}
              >
                <IconButton
                  onClick={() => handlePageChange(null, 1)}
                  disabled={currentPage === 1}
                  sx={{
                    color:
                      currentPage === 1
                        ? theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.3)'
                          : 'rgba(0,0,0,0.3)'
                        : theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor:
                        theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                    }
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
                </IconButton>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                  siblingCount={1}
                  boundaryCount={1}
                  sx={{
                    '& .MuiPaginationItem-root': {
                      color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                      borderColor:
                        theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                      '&.Mui-selected': {
                        backgroundColor: theme.palette.primary.main,
                        color: '#fff',
                        '&:hover': {
                          backgroundColor: theme.palette.primary.dark
                        }
                      },
                      '&:hover': {
                        backgroundColor:
                          theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.1)'
                            : 'rgba(0,0,0,0.1)'
                      }
                    }
                  }}
                />
              </Box>
              )}
            </Stack>
          )}
        </Container>
      </Box>
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
    revalidate: 300 // Revalidate every 5 minutes
  };
}
