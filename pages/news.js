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
  Divider
} from '@mui/material';
import moment from 'moment';

export default function News() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
