import React, { useState, useEffect, useMemo, useContext } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
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
  CardContent
} from '@mui/material';
import axios from 'axios';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CodeIcon from '@mui/icons-material/Code';
import SearchIcon from '@mui/icons-material/Search';
import { AppContext } from 'src/AppContext';
import ApiDocsHeader from 'src/components/ApiDocsHeader';
import ApiDocsFooter from 'src/components/ApiDocsFooter';

const sections = [
  { id: 'tokens', title: 'Tokens' },
  { id: 'token-details', title: 'Token Details' },
  { id: 'market-data', title: 'Market Data' },
  { id: 'account', title: 'Account' },
  { id: 'trading', title: 'Trading' },
  { id: 'analytics', title: 'Analytics' },
  { id: 'errors', title: 'Errors' }
];

const CodeBlock = ({ children, language = 'bash' }) => {
  const theme = useTheme();
  
  return (
    <Paper sx={{ 
      background: theme.palette.background.paper, 
      borderRadius: '8px', 
      overflow: 'hidden', 
      position: 'relative',
      border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        background: alpha(theme.palette.primary.main, 0.1), 
        p: 1 
      }}>
        <Chip 
          label={language} 
          size="small" 
          sx={{ background: alpha(theme.palette.primary.main, 0.2) }} 
        />
        <IconButton size="small" onClick={() => navigator.clipboard.writeText(children)}>
          <ContentCopyIcon fontSize="small" />
        </IconButton>
      </Box>
      <Box 
        component="pre" 
        sx={{ 
          fontFamily: '"Roboto Mono", monospace', 
          fontSize: '0.9rem', 
          m: 0, 
          p: 2, 
          overflowX: 'auto',
          color: theme.palette.text.primary,
          background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)'
        }}
      >
        {children}
      </Box>
    </Paper>
  );
};

const ApiEndpoint = ({ method, endpoint, description, params = [], response, example, apiPath, onTryIt }) => {
  const theme = useTheme();
  
  return (
    <Card sx={{ 
      mb: 3, 
      background: alpha(theme.palette.primary.main, 0.02), 
      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      borderRadius: '8px'
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
          <Chip label={method} color="primary" size="small" sx={{ fontWeight: 600 }} />
          <Typography variant="h6" sx={{ 
            fontFamily: '"Roboto Mono", monospace',
            color: theme.palette.text.primary
          }}>
            {endpoint}
          </Typography>
        </Box>
        {description && (
          <Typography variant="body2" sx={{ 
            mb: 2, 
            color: theme.palette.text.secondary 
          }}>
            {description}
          </Typography>
        )}
        
        {params.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ 
              mb: 1, 
              fontWeight: 600,
              color: theme.palette.text.primary 
            }}>
              Parameters
            </Typography>
            <TableContainer component={Paper} sx={{ 
              background: theme.palette.background.paper,
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`
            }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: theme.palette.text.primary }}>Name</TableCell>
                    <TableCell sx={{ color: theme.palette.text.primary }}>Type</TableCell>
                    <TableCell sx={{ color: theme.palette.text.primary }}>Default</TableCell>
                    <TableCell sx={{ color: theme.palette.text.primary }}>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {params.map(param => (
                    <TableRow key={param.name}>
                      <TableCell>
                        <code style={{ 
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                          padding: '2px 4px',
                          borderRadius: '4px',
                          color: theme.palette.text.primary
                        }}>
                          {param.name}
                        </code>
                      </TableCell>
                      <TableCell sx={{ color: theme.palette.text.primary }}>{param.type}</TableCell>
                      <TableCell sx={{ color: theme.palette.text.primary }}>{param.default || '-'}</TableCell>
                      <TableCell sx={{ color: theme.palette.text.secondary }}>{param.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
        
        {example && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ 
              mb: 1, 
              fontWeight: 600,
              color: theme.palette.text.primary 
            }}>
              Example
            </Typography>
            <CodeBlock>{example}</CodeBlock>
          </Box>
        )}
        
        {response && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ 
              mb: 1, 
              fontWeight: 600,
              color: theme.palette.text.primary 
            }}>
              Response
            </Typography>
            <CodeBlock language="json">{response}</CodeBlock>
          </Box>
        )}
        
        {apiPath && (
          <Box>
            <Button 
              variant="contained" 
              color="primary" 
              size="small" 
              onClick={() => onTryIt(apiPath)}
              startIcon={<CodeIcon />}
            >
              Try It Now
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const DocumentationContent = ({ activeSection, onTryApi }) => {
  const theme = useTheme();
  
  const renderSection = (id) => {
    switch (id) {
      case 'tokens':
        return (
          <Box>
            <Typography variant="h4" sx={{ mb: 3, color: theme.palette.primary.main }}>Tokens</Typography>
            
            <ApiEndpoint
              method="GET"
              endpoint="/api/tokens"
              description="Get paginated list of tokens with sorting and filtering"
              apiPath="/api/tokens?limit=10&sortBy=vol24hxrp&sortType=desc"
              onTryIt={onTryApi}
              params={[
                { name: 'start', type: 'number', default: '0', description: 'Pagination offset' },
                { name: 'limit', type: 'number', default: '20', description: 'Results per page (1-100)' },
                { name: 'sortBy', type: 'string', default: 'vol24hxrp', description: 'Sort field: name, exch, pro24h, vol24hxrp, marketcap, trustlines' },
                { name: 'sortType', type: 'string', default: 'desc', description: 'Sort order: asc, desc' },
                { name: 'tag', type: 'string', description: 'Filter by category tag' },
                { name: 'filter', type: 'string', description: 'Search filter' },
                { name: 'showNew', type: 'boolean', default: 'false', description: 'Include new token indicators' },
                { name: 'skipMetrics', type: 'boolean', default: 'false', description: 'Skip metrics for performance' }
              ]}
              example="GET https://api.xrpl.to/api/tokens?limit=10&sortBy=vol24hxrp&sortType=desc"
              response={`{
  "tokens": [{
    "md5": "0413ca7cfc258dfaf698c02fe304e607",
    "issuer": "rswh1fvyLqHizBS2awu1vs6QcmwTBd9qiv",
    "currencyCode": "534F4C4F",
    "name": "SOLO",
    "price": 0.15,
    "pro24h": 5.23,
    "vol24hxrp": 150000,
    "marketcap": 5000000,
    "trustlines": 25000
  }],
  "total": 18000
}`}
            />

            <ApiEndpoint
              method="GET"
              endpoint="/api/trending"
              description="Get trending tokens"
              apiPath="/api/trending?limit=10"
              onTryIt={onTryApi}
              params={[
                { name: 'limit', type: 'number', default: '20', description: 'Results limit' }
              ]}
              example="GET https://api.xrpl.to/api/trending?limit=10"
            />

            <ApiEndpoint
              method="GET"
              endpoint="/api/gainers/{period}"
              description="Get top gainers for a period"
              apiPath="/api/gainers/24h"
              onTryIt={onTryApi}
              params={[
                { name: 'period', type: 'string', description: 'Period: 5m, 15m, 1h, 24h, 7d' }
              ]}
              example="GET https://api.xrpl.to/api/gainers/24h"
            />

            <ApiEndpoint
              method="GET"
              endpoint="/api/new"
              description="Get newly listed tokens"
              apiPath="/api/new?limit=10"
              onTryIt={onTryApi}
              params={[
                { name: 'limit', type: 'number', default: '20', description: 'Results limit' }
              ]}
              example="GET https://api.xrpl.to/api/new?limit=10"
            />
          </Box>
        );
        
      case 'token-details':
        return (
          <Box>
            <Typography variant="h4" sx={{ mb: 3, color: theme.palette.primary.main }}>Token Details</Typography>
            
            <ApiEndpoint
              method="GET"
              endpoint="/api/token/{identifier}"
              description="Get detailed token information"
              apiPath="/api/token/rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq_USD"
              onTryIt={onTryApi}
              params={[
                { name: 'identifier', type: 'string', description: 'Token identifier: issuer_currency, md5, or slug' },
                { name: 'desc', type: 'string', default: 'yes', description: 'Include description' }
              ]}
              example="GET https://api.xrpl.to/api/token/rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq_USD"
              response={`{
  "token": {
    "md5": "0413ca7cfc258dfaf698c02fe304e607",
    "issuer": "rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq",
    "currencyCode": "USD",
    "name": "USD Stablecoin",
    "price": 1.0,
    "pro24h": 0.01,
    "vol24hxrp": 500000,
    "marketcap": 10000000,
    "trustlines": 5000,
    "supply": 10000000,
    "description": "USD backed stablecoin"
  }
}`}
            />

            <ApiEndpoint
              method="GET"
              endpoint="/api/token/image/{md5}"
              description="Get token image"
              params={[
                { name: 'md5', type: 'string', description: 'Token MD5 identifier' }
              ]}
              example="GET https://s1.xrpl.to/token/0413ca7cfc258dfaf698c02fe304e607"
            />

            <ApiEndpoint
              method="GET"
              endpoint="/api/sparkline/{md5}"
              description="Get token price sparkline data"
              apiPath="/api/sparkline/0413ca7cfc258dfaf698c02fe304e607"
              onTryIt={onTryApi}
              params={[
                { name: 'md5', type: 'string', description: 'Token MD5 identifier' }
              ]}
              example="GET https://api.xrpl.to/api/sparkline/0413ca7cfc258dfaf698c02fe304e607"
              response={`{
  "sparkline": [0.14, 0.145, 0.15, 0.148, 0.152, 0.15]
}`}
            />
          </Box>
        );
        
      case 'market-data':
        return (
          <Box>
            <Typography variant="h4" sx={{ mb: 3, color: theme.palette.primary.main }}>Market Data</Typography>
            
            <ApiEndpoint
              method="GET"
              endpoint="/api/graph/{md5}"
              description="Get historical price data"
              apiPath="/api/graph/c9ac9a6c44763c1bd9ccc6e47572fd26?range=7D"
              onTryIt={onTryApi}
              params={[
                { name: 'md5', type: 'string', description: 'Token MD5 identifier' },
                { name: 'range', type: 'string', default: '1D', description: 'Time range: 1D, 7D, 1M, 3M, 1Y, ALL' }
              ]}
              example="GET https://api.xrpl.to/api/graph/0413ca7cfc258dfaf698c02fe304e607?range=7D"
              response={`{
  "data": [
    [1699920000000, 0.15, 0.16, 0.14, 0.155, 50000],
    [1700006400000, 0.155, 0.17, 0.15, 0.165, 75000]
  ]
}`}
            />

            <ApiEndpoint
              method="GET"
              endpoint="/api/richlist/{md5}"
              description="Get token holder distribution"
              apiPath="/api/richlist/0413ca7cfc258dfaf698c02fe304e607?limit=10"
              onTryIt={onTryApi}
              params={[
                { name: 'md5', type: 'string', description: 'Token MD5 identifier' },
                { name: 'start', type: 'number', default: '0', description: 'Pagination offset' },
                { name: 'limit', type: 'number', default: '20', description: 'Results limit' }
              ]}
              example="GET https://api.xrpl.to/api/richlist/0413ca7cfc258dfaf698c02fe304e607?limit=10"
            />

            <ApiEndpoint
              method="GET"
              endpoint="/api/history"
              description="Get trading history"
              apiPath="/api/history?md5=0413ca7cfc258dfaf698c02fe304e607&limit=10"
              onTryIt={onTryApi}
              params={[
                { name: 'md5', type: 'string', description: 'Token MD5 identifier' },
                { name: 'page', type: 'number', default: '0', description: 'Page number' },
                { name: 'limit', type: 'number', default: '10', description: 'Results per page' }
              ]}
              example="GET https://api.xrpl.to/api/history?md5=0413ca7cfc258dfaf698c02fe304e607&limit=10"
            />

            <ApiEndpoint
              method="GET"
              endpoint="/api/pairs"
              description="Get trading pairs for a token"
              apiPath="/api/pairs?base=XRP&quote=USD"
              onTryIt={onTryApi}
              params={[
                { name: 'base', type: 'string', description: 'Base token identifier' },
                { name: 'quote', type: 'string', description: 'Quote token identifier' }
              ]}
              example="GET https://api.xrpl.to/api/pairs?base=XRP&quote=USD"
            />
          </Box>
        );
        
      case 'account':
        return (
          <Box>
            <Typography variant="h4" sx={{ mb: 3, color: theme.palette.primary.main }}>Account</Typography>
            
            <ApiEndpoint
              method="GET"
              endpoint="/api/account/lines/{address}"
              description="Get account trust lines"
              apiPath="/api/account/lines/rapido5rxPmP4YkMZZEeXSHqWefxHEkqv6"
              onTryIt={onTryApi}
              params={[
                { name: 'address', type: 'string', description: 'XRPL account address' }
              ]}
              example="GET https://api.xrpl.to/api/account/lines/rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH"
            />

            <ApiEndpoint
              method="GET"
              endpoint="/api/account/offers/{address}"
              description="Get account open offers"
              apiPath="/api/account/offers/rapido5rxPmP4YkMZZEeXSHqWefxHEkqv6"
              onTryIt={onTryApi}
              params={[
                { name: 'address', type: 'string', description: 'XRPL account address' }
              ]}
              example="GET https://api.xrpl.to/api/account/offers/rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH"
            />

            <ApiEndpoint
              method="GET"
              endpoint="/api/account/balance/{address}"
              description="Get account balances"
              apiPath="/api/account/balance/rapido5rxPmP4YkMZZEeXSHqWefxHEkqv6"
              onTryIt={onTryApi}
              params={[
                { name: 'address', type: 'string', description: 'XRPL account address' }
              ]}
              example="GET https://api.xrpl.to/api/account/balance/rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH"
            />
          </Box>
        );
        
      case 'trading':
        return (
          <Box>
            <Typography variant="h4" sx={{ mb: 3, color: theme.palette.primary.main }}>Trading</Typography>
            
            <ApiEndpoint
              method="GET"
              endpoint="/api/trader/stats/{address}"
              description="Get trader statistics"
              apiPath="/api/trader/stats/rapido5rxPmP4YkMZZEeXSHqWefxHEkqv6"
              onTryIt={onTryApi}
              params={[
                { name: 'address', type: 'string', description: 'Trader address' },
                { name: 'period', type: 'string', default: '30d', description: 'Time period' }
              ]}
              example="GET https://api.xrpl.to/api/trader/stats/rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH"
            />

            <ApiEndpoint
              method="GET"
              endpoint="/api/wash-trading/{md5}"
              description="Check for wash trading activity"
              apiPath="/api/wash-trading/0413ca7cfc258dfaf698c02fe304e607"
              onTryIt={onTryApi}
              params={[
                { name: 'md5', type: 'string', description: 'Token MD5 identifier' }
              ]}
              example="GET https://api.xrpl.to/api/wash-trading/0413ca7cfc258dfaf698c02fe304e607"
            />
          </Box>
        );
        
      case 'analytics':
        return (
          <Box>
            <Typography variant="h4" sx={{ mb: 3, color: theme.palette.primary.main }}>Analytics</Typography>
            
            <ApiEndpoint
              method="GET"
              endpoint="/api/spark/24h"
              description="Get 24h market overview data"
              apiPath="/api/spark/24h"
              onTryIt={onTryApi}
              example="GET https://api.xrpl.to/api/spark/24h"
            />

            <ApiEndpoint
              method="GET"
              endpoint="/api/tags"
              description="Get available token tags/categories"
              apiPath="/api/tags"
              onTryIt={onTryApi}
              example="GET https://api.xrpl.to/api/tags"
              response={`{
  "tags": [
    {"name": "stablecoin", "count": 15},
    {"name": "defi", "count": 234},
    {"name": "gaming", "count": 89}
  ]
}`}
            />

            <ApiEndpoint
              method="GET"
              endpoint="/api/status"
              description="Get API and network status"
              apiPath="/api/status"
              onTryIt={onTryApi}
              example="GET https://api.xrpl.to/api/status"
              response={`{
  "status": "operational",
  "ledger": 85000000,
  "version": "1.0.0"
}`}
            />
          </Box>
        );
        
      case 'errors':
        return (
          <Box>
            <Typography variant="h4" sx={{ mb: 3, color: theme.palette.primary.main }}>Error Codes</Typography>
            
            <TableContainer component={Paper} sx={{ 
              background: theme.palette.background.paper,
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`
            }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: theme.palette.text.primary }}>Code</TableCell>
                    <TableCell sx={{ color: theme.palette.text.primary }}>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ color: theme.palette.text.primary }}>200</TableCell>
                    <TableCell sx={{ color: theme.palette.text.secondary }}>Success</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ color: theme.palette.text.primary }}>400</TableCell>
                    <TableCell sx={{ color: theme.palette.text.secondary }}>Bad Request - Invalid parameters</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ color: theme.palette.text.primary }}>404</TableCell>
                    <TableCell sx={{ color: theme.palette.text.secondary }}>Not Found - Resource doesn't exist</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ color: theme.palette.text.primary }}>429</TableCell>
                    <TableCell sx={{ color: theme.palette.text.secondary }}>Too Many Requests - Rate limit exceeded</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ color: theme.palette.text.primary }}>500</TableCell>
                    <TableCell sx={{ color: theme.palette.text.secondary }}>Internal Server Error</TableCell>
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

  return renderSection(activeSection);
};

const ApiDocs = () => {
  const theme = useTheme();
  const { darkMode } = useContext(AppContext);
  const [currentSection, setCurrentSection] = useState('tokens');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('shell');
  const router = useRouter();
  
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
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setApiResponse(null);
  };
  
  const handleCopyResponse = () => {
    navigator.clipboard.writeText(JSON.stringify(apiResponse, null, 2))
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => console.error('Failed to copy:', err));
  };

  useEffect(() => {
    const hash = router.asPath.split('#')[1];
    if (hash && sections.some(section => section.id === hash)) {
      setCurrentSection(hash);
    }
  }, [router.asPath]);

  const handleSectionChange = (section) => {
    setCurrentSection(section);
    setIsSidebarOpen(false);
    const element = document.getElementById(section);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <Box sx={{ 
      margin: 0, 
      padding: 0, 
      background: theme.palette.background.default, 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Head>
        <title>XRPL.to API Documentation</title>
        <meta name="description" content="Complete API documentation for XRPL.to - XRP Ledger token data and analytics" />
      </Head>

      <ApiDocsHeader />

      <Box sx={{ display: 'flex', flex: 1 }}>
        {/* Mobile menu button */}
        <IconButton 
          onClick={toggleSidebar}
          sx={{ 
            display: { md: 'none' },
            position: 'fixed',
            top: 8,
            right: 8,
            zIndex: 1300,
            background: theme.palette.background.paper,
            boxShadow: 2
          }}
        >
          <MenuIcon />
        </IconButton>

        {/* Sidebar */}
        <Box
          sx={{
            width: { xs: isSidebarOpen ? '250px' : '0', md: '250px' },
            transition: 'width 0.3s',
            borderRight: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
            background: theme.palette.background.paper,
            overflowY: 'auto',
            position: { xs: 'fixed', md: 'relative' },
            height: { xs: '100vh', md: 'auto' },
            top: { xs: 0, md: 'auto' },
            zIndex: { xs: 1200, md: 'auto' },
            display: { xs: isSidebarOpen ? 'block' : 'none', md: 'block' }
          }}
        >
          <Box sx={{ p: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{ 
                startAdornment: <SearchIcon sx={{ mr: 1, color: theme.palette.text.secondary }} />
              }}
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: theme.palette.text.primary,
                  '& fieldset': {
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)'
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'
                  }
                }
              }}
            />
            <List>
              {sections.map(section => (
                <ListItem
                  key={section.id}
                  button
                  selected={currentSection === section.id}
                  onClick={() => handleSectionChange(section.id)}
                  sx={{
                    borderRadius: '8px',
                    mb: 0.5,
                    color: theme.palette.text.primary,
                    '&.Mui-selected': { 
                      background: alpha(theme.palette.primary.main, 0.1),
                      '& .MuiListItemText-primary': {
                        color: theme.palette.primary.main
                      }
                    },
                    '&:hover': {
                      background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                >
                  <ListItemText 
                    primary={section.title}
                    sx={{
                      '& .MuiListItemText-primary': {
                        color: theme.palette.text.primary
                      }
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </Box>

        {/* Main Content */}
        <Box sx={{ 
          flexGrow: 1, 
          overflowY: 'auto',
          background: theme.palette.background.default
        }}>
          <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Typography variant="h3" sx={{ 
                mb: 2, 
                fontWeight: 700,
                color: theme.palette.text.primary
              }}>
                XRPL.to API
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                RESTful API for XRP Ledger token data, market analytics, and trading information
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Chip 
                  label="Base URL: https://api.xrpl.to" 
                  sx={{ 
                    background: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.text.primary
                  }} 
                />
              </Box>
            </Box>
            
            <DocumentationContent activeSection={currentSection} onTryApi={handleTryApi} />
          </Container>
        </Box>
      </Box>
      
      {/* API Response Modal */}
      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Paper sx={{ 
          width: '90%', 
          maxWidth: '800px', 
          maxHeight: '80vh', 
          overflow: 'auto', 
          p: 3,
          background: theme.palette.background.paper,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>API Response</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {copySuccess && (
                <Chip 
                  icon={<CheckCircleIcon />} 
                  label="Copied!" 
                  color="success" 
                  size="small" 
                />
              )}
              <IconButton onClick={handleCopyResponse} size="small" color="primary">
                <ContentCopyIcon />
              </IconButton>
              <IconButton onClick={handleCloseModal} size="small">
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
                fontFamily: '"Roboto Mono", monospace',
                fontSize: '0.9rem',
                color: theme.palette.text.primary,
                background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                p: 2,
                borderRadius: '8px',
                overflowX: 'auto',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
              }}
            >
              {JSON.stringify(apiResponse, null, 2)}
            </Box>
          ) : null}
        </Paper>
      </Modal>
      
      <ApiDocsFooter />
    </Box>
  );
};

export default ApiDocs;