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
  Stack
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ChatIcon from '@mui/icons-material/Chat';
import moment from 'moment';
import ChatModal from '../src/components/AIChat';
import Header from '../src/components/Header';
import Footer from '../src/components/Footer';
import Topbar from '../src/components/Topbar';
import useWebSocket from 'react-use-websocket';
import { useDispatch } from 'react-redux';
import { update_metrics } from 'src/redux/statusSlice';

const SourcesMenu = ({ sources, selectedSource, onSourceSelect }) => {
  // Sort sources by count in descending order
  const sortedSources = Object.entries(sources).sort(([, a], [, b]) => b - a);
  const [showAll, setShowAll] = useState(false);

  // Show top 12 sources by default
  const displayedSources = showAll ? sortedSources : sortedSources.slice(0, 12);
  const totalSources = sortedSources.length;
  const hiddenCount = totalSources - 12;

  return (
    <Paper sx={{ mb: 3, py: 1.5, px: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
          News Sources ({totalSources} sources)
        </Typography>
        {totalSources > 12 && (
          <Chip
            label={showAll ? 'Show Less' : `Show All (+${hiddenCount})`}
            size="small"
            onClick={() => setShowAll(!showAll)}
            sx={{
              cursor: 'pointer',
              backgroundColor: 'primary.lighter',
              color: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.light'
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
            backgroundColor: !selectedSource ? 'primary.main' : 'primary.lighter',
            color: !selectedSource ? 'white' : 'primary.main',
            borderColor: 'primary.main',
            border: '1px solid',
            height: '24px',
            '& .MuiChip-label': {
              px: 1
            },
            '&:hover': {
              backgroundColor: !selectedSource ? 'primary.dark' : 'primary.light',
              color: 'white'
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
              backgroundColor: selectedSource === source ? 'primary.main' : 'primary.lighter',
              color: selectedSource === source ? 'white' : 'primary.main',
              borderColor: 'primary.main',
              border: '1px solid',
              height: '24px',
              '& .MuiChip-label': {
                px: 1
              },
              '&:hover': {
                backgroundColor: selectedSource === source ? 'primary.dark' : 'primary.light',
                color: 'white'
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
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSource, setSelectedSource] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sentimentStats, setSentimentStats] = useState({
    last24h: { bullish: 0, bearish: 0, neutral: 0 },
    last7d: { bullish: 0, bearish: 0, neutral: 0 },
    last30d: { bullish: 0, bearish: 0, neutral: 0 }
  });
  const [sourcesStats, setSourcesStats] = useState({});

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
        const now = moment();
        const stats = {
          last24h: { bullish: 0, bearish: 0, neutral: 0 },
          last7d: { bullish: 0, bearish: 0, neutral: 0 },
          last30d: { bullish: 0, bearish: 0, neutral: 0 }
        };

        data.forEach((article) => {
          const pubDate = moment(article.pubDate);
          const sentiment = article.sentiment?.toLowerCase() || 'neutral';

          if (now.diff(pubDate, 'hours') <= 24) {
            stats.last24h[sentiment]++;
          }
          if (now.diff(pubDate, 'days') <= 7) {
            stats.last7d[sentiment]++;
          }
          if (now.diff(pubDate, 'days') <= 30) {
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
        return '#4caf50';
      case 'bearish':
        return '#f44336';
      case 'neutral':
        return '#ff9800';
      default:
        return '#757575';
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
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
          {period}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          <Chip
            label={`Bullish ${getPercentage(stats.bullish)}%`}
            size="small"
            sx={{ backgroundColor: '#4caf50', color: 'white', height: '20px' }}
          />
          <Chip
            label={`Bearish ${getPercentage(stats.bearish)}%`}
            size="small"
            sx={{ backgroundColor: '#f44336', color: 'white', height: '20px' }}
          />
          <Chip
            label={`Neutral ${getPercentage(stats.neutral)}%`}
            size="small"
            sx={{ backgroundColor: '#ff9800', color: 'white', height: '20px' }}
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
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Topbar />
      <Header />
      <Box sx={{ flex: 1 }}>
        <Container maxWidth="xl" sx={{ py: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 2 }}>
            Latest XRPL News
          </Typography>

          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              placeholder="Search news by title, summary, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
              sx={{
                backgroundColor: 'background.paper',
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'divider'
                  },
                  '&:hover fieldset': {
                    borderColor: 'primary.main'
                  }
                }
              }}
            />
          </Box>

          <SourcesMenu
            sources={sourcesStats}
            selectedSource={selectedSource}
            onSourceSelect={handleSourceSelect}
          />

          <Paper sx={{ mb: 2, p: 1.5 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 1 }}>
              Sentiment Analysis
              {selectedSource && (
                <Typography component="span" color="text.secondary" sx={{ ml: 1 }}>
                  ({selectedSource})
                </Typography>
              )}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <SentimentSummary period="Last 24h" stats={sentimentStats.last24h} />
              <Divider orientation="vertical" flexItem />
              <SentimentSummary period="7d" stats={sentimentStats.last7d} />
              <Divider orientation="vertical" flexItem />
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
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 2
                    }
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 1
                      }}
                    >
                      <Typography variant="subtitle1" component="h2" sx={{ flex: 1 }}>
                        {extractTitle(article.title)}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedArticle(article);
                            setChatOpen(true);
                          }}
                          sx={{
                            color: 'primary.main',
                            '&:hover': {
                              backgroundColor: 'primary.lighter'
                            }
                          }}
                        >
                          <ChatIcon />
                        </IconButton>
                        <Chip
                          label={article.sentiment || 'Unknown'}
                          size="small"
                          sx={{
                            backgroundColor: getSentimentColor(article.sentiment),
                            color: 'white',
                            height: '20px'
                          }}
                        />
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {article.summary}
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {article.articleBody?.split('\n').map(
                        (paragraph, index) =>
                          paragraph.trim() && (
                            <Typography key={index} paragraph sx={{ mb: 0.5 }}>
                              {paragraph}
                            </Typography>
                          )
                      )}
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mt: 1
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {article.sourceName} • {moment(article.pubDate).fromNow()}
                      </Typography>
                      <Typography
                        variant="caption"
                        component="a"
                        href={article.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          color: 'primary.main',
                          textDecoration: 'none',
                          '&:hover': {
                            textDecoration: 'underline'
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
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
              <Typography variant="caption" color="text.secondary">
                Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredNews.length)} of{' '}
                {filteredNews.length} articles
              </Typography>
            </Stack>
          )}
        </Container>
      </Box>
      <Footer />
      <ChatModal open={chatOpen} onClose={() => setChatOpen(false)} article={selectedArticle} />
    </Box>
  );
}
