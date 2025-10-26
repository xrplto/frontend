import React, { useState, useEffect, useContext } from 'react';
import Head from 'next/head';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Typography,
  Container,
  Paper,
  List,
  ListItem,
  ListItemText,
  TextField,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Modal,
  CircularProgress,
  IconButton,
  Card,
  CardContent,
  Toolbar
} from '@mui/material';
import axios from 'axios';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CodeIcon from '@mui/icons-material/Code';
import SearchIcon from '@mui/icons-material/Search';
import { AppContext } from 'src/AppContext';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';

const ApiDocsPage = () => {
  const theme = useTheme();
  const { darkMode } = useContext(AppContext);
  const [currentSection, setCurrentSection] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const sections = [
    { id: 'overview', title: 'Overview' },
    { id: 'tokens', title: 'Tokens' },
    { id: 'token-details', title: 'Token Details' },
    { id: 'trading', title: 'Trading' },
    { id: 'accounts', title: 'Accounts' },
    { id: 'errors', title: 'Error Codes' }
  ];

  const handleTryApi = async (apiPath) => {
    setIsLoading(true);
    setIsModalOpen(true);
    setApiResponse(null);

    try {
      const response = await axios.get(`https://api.xrpl.to${apiPath}`);
      setApiResponse(response.data);
    } catch (error) {
      setApiResponse({
        error: 'Failed to fetch data',
        message: error.message,
        status: error.response?.status || 'Network Error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyResponse = () => {
    navigator.clipboard
      .writeText(JSON.stringify(apiResponse, null, 2))
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch((err) => console.error('Failed to copy:', err));
  };

  const renderContent = () => {
    switch (currentSection) {
      case 'overview':
        return (
          <Box>
            <Typography variant="h4" sx={{ mb: 3, color: theme.palette.primary.main }}>
              XRPL.to API Documentation
            </Typography>
            <Typography variant="body1" paragraph>
              Welcome to the XRPL.to API! Access comprehensive XRP Ledger token data, market
              analytics, and trading information.
            </Typography>

            <Card sx={{ mb: 3, background: alpha(theme.palette.primary.main, 0.02) }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Base URL
                </Typography>
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f8f9fa'
                  }}
                >
                  <code>https://api.xrpl.to</code>
                </Paper>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Start
                </Typography>
                <Typography variant="body2" paragraph>
                  Get trending tokens:
                </Typography>
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f8f9fa'
                  }}
                >
                  <code>
                    curl -X GET
                    "https://api.xrpl.to/api/tokens?limit=10&sortBy=vol24hxrp&sortType=desc"
                  </code>
                </Paper>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Rate Limits
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText primary="Free: 1,000 requests/hour" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Authenticated: 5,000 requests/hour" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Box>
        );

      case 'tokens':
        return (
          <Box>
            <Typography variant="h4" sx={{ mb: 3, color: theme.palette.primary.main }}>
              Tokens
            </Typography>

            <Card sx={{ mb: 3, background: alpha(theme.palette.primary.main, 0.02) }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                  <Chip label="GET" color="primary" size="small" />
                  <Typography variant="h6" sx={{ fontFamily: '"Roboto Mono", monospace' }}>
                    /api/tokens
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Get paginated list of tokens with sorting and filtering
                </Typography>

                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 400 }}>
                  Parameters
                </Typography>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Default</TableCell>
                        <TableCell>Description</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <code>limit</code>
                        </TableCell>
                        <TableCell>number</TableCell>
                        <TableCell>20</TableCell>
                        <TableCell>Results per page (1-100)</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>sortBy</code>
                        </TableCell>
                        <TableCell>string</TableCell>
                        <TableCell>vol24hxrp</TableCell>
                        <TableCell>Sort field</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>filter</code>
                        </TableCell>
                        <TableCell>string</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>Search filter</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                <Typography variant="subtitle2" sx={{ mb: 1, mt: 2, fontWeight: 400 }}>
                  Example
                </Typography>
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f8f9fa'
                  }}
                >
                  <code>
                    GET https://api.xrpl.to/api/tokens?limit=10&sortBy=vol24hxrp&sortType=desc
                  </code>
                </Paper>

                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleTryApi('/api/tokens?limit=10')}
                    startIcon={<CodeIcon />}
                  >
                    Try It Now
                  </Button>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                  <Chip label="GET" color="primary" size="small" />
                  <Typography variant="h6" sx={{ fontFamily: '"Roboto Mono", monospace' }}>
                    /api/trending
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Get trending tokens
                </Typography>
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f8f9fa'
                  }}
                >
                  <code>GET https://api.xrpl.to/api/trending?limit=10</code>
                </Paper>
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleTryApi('/api/trending?limit=10')}
                    startIcon={<CodeIcon />}
                  >
                    Try It Now
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        );

      case 'token-details':
        return (
          <Box>
            <Typography variant="h4" sx={{ mb: 3, color: theme.palette.primary.main }}>
              Token Details
            </Typography>

            <Card sx={{ mb: 3, background: alpha(theme.palette.primary.main, 0.02) }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                  <Chip label="GET" color="primary" size="small" />
                  <Typography variant="h6" sx={{ fontFamily: '"Roboto Mono", monospace' }}>
                    /api/token/{`{identifier}`}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Get detailed token information
                </Typography>
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f8f9fa'
                  }}
                >
                  <code>GET https://api.xrpl.to/api/token/solo</code>
                </Paper>
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleTryApi('/api/token/solo')}
                    startIcon={<CodeIcon />}
                  >
                    Try It Now
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        );

      case 'trading':
        return (
          <Box>
            <Typography variant="h4" sx={{ mb: 3, color: theme.palette.primary.main }}>
              Trading
            </Typography>

            <Card sx={{ mb: 3, background: alpha(theme.palette.primary.main, 0.02) }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                  <Chip label="GET" color="primary" size="small" />
                  <Typography variant="h6" sx={{ fontFamily: '"Roboto Mono", monospace' }}>
                    /api/history
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Get trading history
                </Typography>
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f8f9fa'
                  }}
                >
                  <code>GET https://api.xrpl.to/api/history?limit=10</code>
                </Paper>
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleTryApi('/api/history?limit=10')}
                    startIcon={<CodeIcon />}
                  >
                    Try It Now
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        );

      case 'accounts':
        return (
          <Box>
            <Typography variant="h4" sx={{ mb: 3, color: theme.palette.primary.main }}>
              Accounts
            </Typography>

            <Card sx={{ mb: 3, background: alpha(theme.palette.primary.main, 0.02) }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                  <Chip label="GET" color="primary" size="small" />
                  <Typography variant="h6" sx={{ fontFamily: '"Roboto Mono", monospace' }}>
                    /api/account/balance/{`{address}`}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Get account balances
                </Typography>
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f8f9fa'
                  }}
                >
                  <code>GET https://api.xrpl.to/api/account/balance/rAccount123...</code>
                </Paper>
              </CardContent>
            </Card>
          </Box>
        );

      case 'errors':
        return (
          <Box>
            <Typography variant="h4" sx={{ mb: 3, color: theme.palette.primary.main }}>
              Error Codes
            </Typography>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>200</TableCell>
                    <TableCell>Success</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>400</TableCell>
                    <TableCell>Bad Request</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>404</TableCell>
                    <TableCell>Not Found</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>429</TableCell>
                    <TableCell>Too Many Requests</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>500</TableCell>
                    <TableCell>Internal Server Error</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ flex: 1 }}>
      <Head>
        <title>XRPL.to API Documentation</title>
        <meta
          name="description"
          content="Complete API documentation for XRPL.to - XRP Ledger token data and analytics"
        />
      </Head>

      <Toolbar id="back-to-top-anchor" />
      <Header />

      <Box
        sx={{
          margin: 0,
          padding: 0,
          background: theme.palette.background.default,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Box sx={{ display: 'flex', flex: 1 }}>
          <IconButton
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            sx={{
              display: { md: 'none' },
              position: 'fixed',
              top: 8,
              right: 8,
              zIndex: 1300,
              background: theme.palette.background.paper
            }}
          >
            <MenuIcon />
          </IconButton>

          <Box
            sx={{
              width: { xs: isSidebarOpen ? '250px' : '0', md: '250px' },
              transition: 'width 0.3s',
              borderRight: `1px solid ${theme.palette.divider}`,
              background: theme.palette.background.paper,
              overflowY: 'auto',
              position: { xs: 'fixed', md: 'relative' },
              height: { xs: '100vh', md: 'auto' },
              zIndex: { xs: 1200, md: 'auto' },
              display: { xs: isSidebarOpen ? 'block' : 'none', md: 'block' }
            }}
          >
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                API Documentation
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 2, mt: 1 }}
              />
              <List>
                {sections.map((section) => (
                  <ListItem
                    key={section.id}
                    button
                    selected={currentSection === section.id}
                    onClick={() => {
                      setCurrentSection(section.id);
                      setIsSidebarOpen(false);
                    }}
                    sx={{ borderRadius: 1, mb: 0.5 }}
                  >
                    <ListItemText primary={section.title} />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Box>

          <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
            <Container maxWidth="lg" sx={{ py: 4 }}>
              <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Typography variant="h3" sx={{ mb: 2, fontWeight: 500 }}>
                  XRPL.to API
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  RESTful API for XRP Ledger token data and analytics
                </Typography>
                <Chip
                  label="Base URL: https://api.xrpl.to"
                  sx={{ mt: 2, background: alpha(theme.palette.primary.main, 0.1) }}
                />
              </Box>

              {renderContent()}
            </Container>
          </Box>
        </Box>

        <Modal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Paper
            sx={{ width: '90%', maxWidth: '800px', maxHeight: '80vh', overflow: 'auto', p: 3 }}
          >
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
            >
              <Typography variant="h6">API Response</Typography>
              <Box>
                {copySuccess && (
                  <Chip icon={<CheckCircleIcon />} label="Copied!" color="success" size="small" />
                )}
                <IconButton onClick={handleCopyResponse} size="small">
                  <ContentCopyIcon />
                </IconButton>
                <IconButton onClick={() => setIsModalOpen(false)} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : apiResponse ? (
              <Box
                component="pre"
                sx={{
                  fontSize: '14px',
                  overflow: 'auto',
                  p: 2,
                  backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f8f9fa',
                  borderRadius: 1
                }}
              >
                {JSON.stringify(apiResponse, null, 2)}
              </Box>
            ) : null}
          </Paper>
        </Modal>
      </Box>

      <ScrollToTop />
      <Footer />
    </Box>
  );
};

export default ApiDocsPage;
