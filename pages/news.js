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
  Paper
} from '@mui/material';
import moment from 'moment';

export default function News() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sentimentStats, setSentimentStats] = useState({
    last24h: { bullish: 0, bearish: 0, neutral: 0 },
    last7d: { bullish: 0, bearish: 0, neutral: 0 },
    last30d: { bullish: 0, bearish: 0, neutral: 0 }
  });

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
      <Box sx={{ flex: 1, p: 2 }}>
        <Typography variant="h6" gutterBottom>
          {period}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={`Bullish ${getPercentage(stats.bullish)}%`}
            size="small"
            sx={{ backgroundColor: '#4caf50', color: 'white' }}
          />
          <Chip
            label={`Bearish ${getPercentage(stats.bearish)}%`}
            size="small"
            sx={{ backgroundColor: '#f44336', color: 'white' }}
          />
          <Chip
            label={`Neutral ${getPercentage(stats.neutral)}%`}
            size="small"
            sx={{ backgroundColor: '#ff9800', color: 'white' }}
          />
        </Box>
      </Box>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography color="error">Error: {error}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        Latest Crypto News
      </Typography>

      <Paper sx={{ mb: 4, p: 2 }}>
        <Typography variant="h5" gutterBottom>
          Sentiment Analysis
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <SentimentSummary period="Last 24 Hours" stats={sentimentStats.last24h} />
          <Divider orientation="vertical" flexItem />
          <SentimentSummary period="Last 7 Days" stats={sentimentStats.last7d} />
          <Divider orientation="vertical" flexItem />
          <SentimentSummary period="Last 30 Days" stats={sentimentStats.last30d} />
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {news.map((article) => (
          <Grid item xs={12} key={article._id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                }
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 2
                  }}
                >
                  <Typography variant="h6" component="h2" sx={{ flex: 1 }}>
                    {extractTitle(article.title)}
                  </Typography>
                  <Chip
                    label={article.sentiment || 'Unknown'}
                    size="small"
                    sx={{
                      ml: 2,
                      backgroundColor: getSentimentColor(article.sentiment),
                      color: 'white'
                    }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {article.summary}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {article.articleBody?.split('\n').map(
                    (paragraph, index) =>
                      paragraph.trim() && (
                        <Typography key={index} paragraph>
                          {paragraph}
                        </Typography>
                      )
                  )}
                </Typography>
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {article.sourceName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {moment(article.pubDate).format('MMMM D, YYYY')}
                  </Typography>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography
                    variant="body2"
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
    </Container>
  );
}
