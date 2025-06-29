import { useState, useEffect } from 'react';
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
  const sortedSources = Object.entries(sources).sort(([, a], [, b]) => b - a);
  const displayedSources = showAll ? sortedSources : sortedSources.slice(0, 12);
  const totalSources = sortedSources.length;
  const hiddenCount = totalSources - 12;

  return (
    <Paper
      sx={{
        mb: 3,
        py: 1.5,
        px: 2,
        background:
          theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${
          theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
        }`,
        borderRadius: 2
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)'
          }}
        >
          News Sources ({totalSources} sources)
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
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
        <Chip
          key="all"
          label="All Sources"
          size="small"
          onClick={() => onSourceSelect(null)}
          sx={{
            background: !selectedSource ? theme.palette.primary.main : 'transparent',
            color: !selectedSource ? '#fff' : theme.palette.primary.main,
            border: `1px solid ${theme.palette.primary.main}`,
            height: '26px',
            '&:hover': {
              background: !selectedSource ? theme.palette.primary.dark : theme.palette.primary.main,
              color: '#fff'
            }
          }}
        />
        {displayedSources.map(([source, count]) => (
          <Chip
            key={source}
            label={`${source} (${count})`}
            size="small"
            onClick={() => onSourceSelect(source)}
            sx={{
              background: selectedSource === source ? theme.palette.primary.main : 'transparent',
              color: selectedSource === source ? '#fff' : theme.palette.primary.main,
              border: `1px solid ${theme.palette.primary.main}`,
              height: '26px',
              '&:hover': {
                background:
                  selectedSource === source
                    ? theme.palette.primary.dark
                    : theme.palette.primary.main,
                color: '#fff'
              }
            }}
          />
        ))}
      </Box>
    </Paper>
  );
};

export default function News() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSource, setSelectedSource] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sentimentStats, setSentimentStats] = useState({
    last24h: { bullish: 0, bearish: 0, neutral: 0 },
    last7d: { bullish: 0, bearish: 0, neutral: 0 },
    last30d: { bullish: 0, bearish: 0, neutral: 0 }
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

  // Filter news based on selected source and search query
  const filteredNews = news.filter((article) => {
    const matchesSource = selectedSource ? article.sourceName === selectedSource : true;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === '' ||
      article.title.toLowerCase().includes(searchLower) ||
      article.summary?.toLowerCase().includes(searchLower) ||
      article.articleBody?.toLowerCase().includes(searchLower);
    return matchesSource && matchesSearch;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredNews.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSourceSelect = (source) => {
    setSelectedSource(source);
  };

  const toggleArticleExpansion = (articleId) => {
    setExpandedArticles((prev) => ({
      ...prev,
      [articleId]: !prev[articleId]
    }));
  };

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:7000/api/news');
        if (!response.ok) {
          throw new Error('Failed to fetch news');
        }
        const data = await response.json();
        setNews(data);

        // Calculate sources statistics
        const sourceCount = data.reduce((acc, article) => {
          const source = article.sourceName || 'Unknown';
          acc[source] = (acc[source] || 0) + 1;
          return acc;
        }, {});
        setSourcesStats(sourceCount);

        // Calculate sentiment statistics
        const now = new Date();
        const stats = {
          last24h: { bullish: 0, bearish: 0, neutral: 0 },
          last7d: { bullish: 0, bearish: 0, neutral: 0 },
          last30d: { bullish: 0, bearish: 0, neutral: 0 }
        };

        data.forEach((article) => {
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

        setSentimentStats(stats);
      } catch (error) {
        console.error('Error fetching news:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

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
    const total = stats.bullish + stats.bearish + stats.neutral;
    const getPercentage = (value) => ((value / total) * 100).toFixed(1);

    return (
      <Box sx={{ flex: 1, py: 0.5, px: 1 }}>
        <Typography variant="subtitle2" sx={{ mb: 0.8, color: 'rgba(255,255,255,0.7)' }}>
          {period}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
          <Chip
            label={`Bullish ${getPercentage(stats.bullish)}%`}
            size="small"
            sx={{
              background: 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)',
              color: 'white',
              height: '22px',
              fontWeight: 500
            }}
          />
          <Chip
            label={`Bearish ${getPercentage(stats.bearish)}%`}
            size="small"
            sx={{
              background: 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              height: '22px',
              fontWeight: 500
            }}
          />
          <Chip
            label={`Neutral ${getPercentage(stats.neutral)}%`}
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
          <Typography
            variant="h4"
            component="h1"
            sx={{
              mb: 3,
              color: theme.palette.primary.main,
              fontWeight: 600
            }}
          >
            Latest XRPL News
          </Typography>

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              size="medium"
              variant="outlined"
              placeholder="Search news by title, summary, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon
                      sx={{
                        color:
                          theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.5)'
                            : 'rgba(0,0,0,0.5)'
                      }}
                    />
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor:
                    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  borderRadius: 2,
                  color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                  '& fieldset': {
                    borderColor:
                      theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.primary.main
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.primary.main
                  }
                },
                '& .MuiOutlinedInput-input::placeholder': {
                  color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'
                }
              }}
            />
          </Box>

          <SourcesMenu
            sources={sourcesStats}
            selectedSource={selectedSource}
            onSourceSelect={handleSourceSelect}
          />

          <Paper
            sx={{
              mb: 3,
              p: 2,
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
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <SentimentSummary period="Last 24h" stats={sentimentStats.last24h} />
              <Divider
                orientation="vertical"
                flexItem
                sx={{
                  borderColor:
                    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                }}
              />
              <SentimentSummary period="7d" stats={sentimentStats.last7d} />
              <Divider
                orientation="vertical"
                flexItem
                sx={{
                  borderColor:
                    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                }}
              />
              <SentimentSummary period="30d" stats={sentimentStats.last30d} />
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
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 1.5
                      }}
                    >
                      <Typography
                        variant="h6"
                        component="h2"
                        sx={{
                          flex: 1,
                          color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                          fontWeight: 500,
                          fontSize: '1.1rem'
                        }}
                      >
                        {extractTitle(article.title)}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
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
                              <Typography key={index} paragraph sx={{ mb: 1 }}>
                                {paragraph}
                              </Typography>
                            )
                        )}
                      </Typography>
                    )}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mt: 1
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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

          {totalPages > 1 && (
            <Stack spacing={2} alignItems="center" sx={{ mt: 4, mb: 2 }}>
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
            </Stack>
          )}
        </Container>
      </Box>
      <Footer />
    </Box>
  );
}
