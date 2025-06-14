import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ThemeProvider, createTheme, alpha } from '@mui/material/styles';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  TextField,
  Box,
  Divider,
  CssBaseline,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tabs,
  Tab,
  Button,
  Modal,
  CircularProgress,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Avatar
} from '@mui/material';
import Logo from 'src/components/Logo';
import { motion } from 'framer-motion';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import axios from 'axios';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import CryptoJS from 'crypto-js';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';
import DataUsageIcon from '@mui/icons-material/DataUsage';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CodeIcon from '@mui/icons-material/Code';
import LinkIcon from '@mui/icons-material/Link';
import SearchIcon from '@mui/icons-material/Search';

const sections = [
  { id: 'introduction', title: 'Introduction' },
  { id: 'tokens', title: 'Tokens' },
  { id: 'get-all-tokens', title: 'Get All Tokens' },
  { id: 'get-a-specific-token-info', title: 'Get a Specific Token Info' },
  { id: 'get-sparkline-of-a-token', title: 'Get Sparkline of a token' },
  { id: 'get-graph-data-of-a-token', title: 'Get Graph Data of a Token' },
  { id: 'get-rich-list-of-a-token', title: 'Get Rich List of a Token' },
  { id: 'get-exchange-history-of-a-token', title: 'Get Exchange history of a Token' },
  { id: 'get-the-current-status', title: 'Get the current status' },
  { id: 'errors', title: 'Errors' }
];

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#25A768',
      light: '#4CAF50',
      dark: '#1B5E20'
    },
    secondary: {
      main: '#3E4348'
    },
    background: {
      default: '#000000',
      paper: '#1E2329'
    },
    text: {
      primary: '#ffffff',
      secondary: '#B7BDC6'
    },
    success: {
      main: '#25A768',
      light: '#4CAF50'
    },
    info: {
      main: '#2196F3',
      light: '#64B5F6'
    },
    warning: {
      main: '#FF9800',
      light: '#FFB74D'
    },
    error: {
      main: '#f44336',
      light: '#ef5350'
    },
    divider: 'rgba(255, 255, 255, 0.08)'
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem'
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem'
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem'
    }
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: `linear-gradient(135deg, ${alpha('#000000', 0.95)} 0%, ${alpha(
            '#25A768',
            0.1
          )} 100%)`,
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${alpha('#25A768', 0.2)}`,
          boxShadow: `0 8px 32px ${alpha('#000000', 0.3)}`
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: `linear-gradient(135deg, ${alpha('#1E2329', 0.9)} 0%, ${alpha(
            '#1E2329',
            0.7
          )} 100%)`,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha('#25A768', 0.1)}`,
          boxShadow: `0 8px 32px ${alpha('#000000', 0.08)}, 0 2px 8px ${alpha('#25A768', 0.05)}`
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: `linear-gradient(135deg, ${alpha('#1E2329', 0.9)} 0%, ${alpha(
            '#1E2329',
            0.7
          )} 100%)`,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha('#25A768', 0.1)}`,
          boxShadow: `0 8px 32px ${alpha('#000000', 0.08)}, 0 2px 8px ${alpha('#25A768', 0.05)}`,
          borderRadius: '16px'
        }
      }
    }
  }
});

// Simple code block component
const CodeBlock = ({ children, language = 'javascript' }) => (
  <Paper
    elevation={3}
    sx={{
      my: 2,
      background: `linear-gradient(135deg, ${alpha('#2d2d2d', 0.95)} 0%, ${alpha(
        '#1a1a1a',
        0.9
      )} 100%)`,
      backdropFilter: 'blur(20px)',
      border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
      borderRadius: '12px',
      overflow: 'hidden',
      position: 'relative',
      boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.2)}`,
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main}, ${theme.palette.info.main})`,
        opacity: 0.8
      }
    }}
  >
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 2,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(
          theme.palette.primary.main,
          0.03
        )} 100%)`,
        borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
      }}
    >
      <Chip
        label={language}
        size="small"
        sx={{
          bgcolor: alpha(theme.palette.primary.main, 0.2),
          color: theme.palette.primary.main,
          fontWeight: 600,
          fontSize: '0.75rem',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
        }}
      />
      <IconButton
        size="small"
        onClick={() => navigator.clipboard.writeText(children)}
        sx={{
          color: theme.palette.primary.main,
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          borderRadius: '8px',
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: alpha(theme.palette.primary.main, 0.2),
            transform: 'scale(1.05)'
          }
        }}
      >
        <ContentCopyIcon fontSize="small" />
      </IconButton>
    </Box>
    <Box
      component="pre"
      sx={{
        fontFamily: '"Roboto Mono", monospace',
        fontSize: '0.9rem',
        color: '#e6e6e6',
        margin: 0,
        padding: '16px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        background: 'transparent'
      }}
    >
      {children}
    </Box>
  </Paper>
);

// Documentation content sections
const DocumentationContent = ({ activeSection, searchTerm }) => {
  const highlightText = (text) => {
    if (!searchTerm || typeof text !== 'string') return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.split(regex).map((part, index) =>
      regex.test(part) ? (
        <mark key={`highlight-${part}-${index}`} style={{ backgroundColor: '#FFD54F' }}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const renderSection = (id) => {
    switch (id) {
      case 'introduction':
        return (
          <Box id="introduction">
            {/* Hero Section - More Compact */}
            <Box
              sx={{
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.primary.main,
                  0.1
                )} 0%, ${alpha(theme.palette.success.main, 0.05)} 50%, ${alpha(
                  theme.palette.info.main,
                  0.1
                )} 100%)`,
                borderRadius: '16px',
                p: 3,
                mb: 3,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main}, ${theme.palette.info.main})`,
                  borderRadius: '16px 16px 0 0'
                }
              }}
            >
              <Typography
                variant="h1"
                sx={{
                  color: theme.palette.primary.main,
                  mb: 1,
                  fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' },
                  fontWeight: 700,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textAlign: 'center'
                }}
              >
                XRPL.to API
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: theme.palette.text.secondary,
                  mb: 2,
                  textAlign: 'center',
                  fontWeight: 300
                }}
              >
                Comprehensive XRP Ledger Data & Analytics
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  mb: 2,
                  lineHeight: 1.6,
                  textAlign: 'center',
                  color: theme.palette.text.primary,
                  maxWidth: '700px',
                  mx: 'auto'
                }}
              >
                Access comprehensive XRP Ledger data, token metrics, and trading insights through
                our RESTful API.
              </Typography>

              {/* Quick Stats - More Compact */}
              <Grid container spacing={1.5} sx={{ mt: 1 }}>
                {[
                  { label: '1000+', desc: 'Tokens', color: 'primary' },
                  { label: '99.9%', desc: 'Uptime', color: 'success' },
                  { label: 'Real-time', desc: 'Data', color: 'info' },
                  { label: '4', desc: 'Languages', color: 'warning' }
                ].map((stat, index) => (
                  <Grid item xs={6} sm={3} key={index}>
                    <Card
                      sx={{
                        background: alpha(theme.palette[stat.color].main, 0.1),
                        textAlign: 'center',
                        border: `1px solid ${alpha(theme.palette[stat.color].main, 0.2)}`,
                        transition: 'transform 0.2s ease',
                        py: 1,
                        '&:hover': { transform: 'scale(1.05)' }
                      }}
                    >
                      <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                        <Typography
                          variant="subtitle1"
                          color={`${stat.color}.main`}
                          fontWeight={600}
                        >
                          {stat.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {stat.desc}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* Key Features - More Compact */}
            <Typography
              variant="h4"
              sx={{
                color: theme.palette.primary.main,
                mb: 2,
                textAlign: 'center',
                fontWeight: 600
              }}
            >
              Key Features
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              {[
                {
                  icon: <AccountBalanceWalletIcon />,
                  title: 'Token Support',
                  description: 'Access data for all XRP Ledger tokens',
                  color: theme.palette.primary.main
                },
                {
                  icon: <TrendingUpIcon />,
                  title: 'Price Feeds',
                  description: 'Multi-currency price data',
                  color: theme.palette.success.main
                },
                {
                  icon: <DataUsageIcon />,
                  title: 'Volume Tracking',
                  description: 'DEX and AMM trading volumes',
                  color: theme.palette.info.main
                }
              ].map((feature, index) => (
                <Grid item xs={12} sm={4} key={index}>
                  <Card
                    sx={{
                      height: '100%',
                      background: `linear-gradient(135deg, ${alpha(
                        feature.color,
                        0.05
                      )} 0%, ${alpha(feature.color, 0.02)} 100%)`,
                      border: `1px solid ${alpha(feature.color, 0.15)}`,
                      borderRadius: '12px',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        border: `1px solid ${alpha(feature.color, 0.3)}`,
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar
                          sx={{
                            bgcolor: alpha(feature.color, 0.1),
                            color: feature.color,
                            mr: 1.5,
                            width: 36,
                            height: 36
                          }}
                        >
                          {feature.icon}
                        </Avatar>
                        <Typography variant="h6" sx={{ color: feature.color, fontWeight: 600 }}>
                          {feature.title}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Base URL */}
            <Card
              sx={{
                background: `linear-gradient(135deg, ${alpha('#2d2d2d', 0.95)} 0%, ${alpha(
                  '#1a1a1a',
                  0.9
                )} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                borderRadius: '12px',
                p: 2
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 1
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ color: theme.palette.primary.main, fontWeight: 600 }}
                >
                  Base URL
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => navigator.clipboard.writeText('https://api.xrpl.to')}
                  sx={{ color: theme.palette.primary.main }}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Box>
              <Box
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                  borderRadius: '6px',
                  p: 1.5,
                  fontFamily: '"Roboto Mono", monospace',
                  color: theme.palette.primary.main,
                  textAlign: 'center',
                  fontWeight: 600
                }}
              >
                https://api.xrpl.to
              </Box>
            </Card>
          </Box>
        );

      case 'tokens':
        return (
          <Card
            id="tokens"
            sx={{
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.primary.main,
                0.05
              )} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
              borderRadius: '16px',
              p: 3
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AccountBalanceWalletIcon
                sx={{ color: theme.palette.primary.main, mr: 2, fontSize: 32 }}
              />
              <Typography variant="h2" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
                Tokens
              </Typography>
            </Box>
            <Typography
              variant="body1"
              sx={{ lineHeight: 1.8, color: theme.palette.text.secondary }}
            >
              The Tokens API provides access to comprehensive token data on the XRP Ledger,
              including real-time prices, trading volumes, and detailed token information.
            </Typography>
          </Card>
        );

      case 'get-all-tokens':
        return (
          <Box id="get-all-tokens">
            <Card
              sx={{
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.primary.main,
                  0.05
                )} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                borderRadius: '16px',
                p: 3,
                mb: 3
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <DataUsageIcon sx={{ color: theme.palette.primary.main, mr: 2, fontSize: 32 }} />
                <Typography
                  variant="h2"
                  sx={{ color: theme.palette.primary.main, fontWeight: 600 }}
                >
                  Get All Tokens
                </Typography>
              </Box>
              <Typography
                variant="body1"
                sx={{ lineHeight: 1.8, color: theme.palette.text.secondary }}
              >
                Retrieve tokens with advanced pagination, sorting, and filtering options. Supports
                tag-based filtering, watchlist queries, and customizable response formatting with
                compression for optimal performance.
              </Typography>
            </Card>

            <Card sx={{ mb: 3, borderRadius: '12px' }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.success.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.success.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ color: theme.palette.success.main, fontWeight: 600 }}
                >
                  HTTP Request
                </Typography>
              </Box>
              <CardContent>
                <CodeBlock language="http">
                  GET
                  https://api.xrpl.to/api/tokens?start=0&limit=20&sortBy=vol24hxrp&sortType=desc&filter=&showNew=false&showSlug=false&showDate=false
                </CodeBlock>
                <Typography variant="body2" sx={{ mt: 2, color: theme.palette.text.secondary }}>
                  Example with tag filtering:
                </Typography>
                <CodeBlock language="http">
                  GET
                  https://api.xrpl.to/api/tokens?tag=collectables-and-nfts&start=0&limit=20&sortBy=vol24hxrp&sortType=desc
                </CodeBlock>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3, borderRadius: '12px' }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.info.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.info.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                }}
              >
                <Typography variant="h6" sx={{ color: theme.palette.info.main, fontWeight: 600 }}>
                  Query Parameters
                </Typography>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          fontWeight: 'bold'
                        }}
                      >
                        Parameter
                      </TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          fontWeight: 'bold'
                        }}
                      >
                        Default
                      </TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          fontWeight: 'bold'
                        }}
                      >
                        Description
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>start</TableCell>
                      <TableCell>0</TableCell>
                      <TableCell>Start value for pagination (minimum: 0)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>limit</TableCell>
                      <TableCell>100</TableCell>
                      <TableCell>Limit count value for pagination (1-100, default: 100)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>sortBy</TableCell>
                      <TableCell>vol24hxrp</TableCell>
                      <TableCell>
                        Can be: name, exch, pro24h, pro7d, vol24hxrp, vol24htx, marketcap,
                        trustlines, supply
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>sortType</TableCell>
                      <TableCell>desc</TableCell>
                      <TableCell>asc or desc (ascending or descending)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>tag</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>
                        Filter tokens by category tag (e.g., "collectables-and-nfts")
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>watchlist</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>Filter tokens by watchlist identifier</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>filter</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>General filter parameter for token search</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>filterNe</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>Filter to exclude tokens (not equal filter)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>showNew</TableCell>
                      <TableCell>false</TableCell>
                      <TableCell>
                        Set to "true" to include new token indicators in response
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>showSlug</TableCell>
                      <TableCell>false</TableCell>
                      <TableCell>Set to "true" to include token slug in response</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>showDate</TableCell>
                      <TableCell>false</TableCell>
                      <TableCell>Set to "true" to include date information in response</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>tags</TableCell>
                      <TableCell>no</TableCell>
                      <TableCell>Set to "yes" to include tag information in response</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>

            <Card sx={{ mb: 3, borderRadius: '12px' }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.success.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.success.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ color: theme.palette.success.main, fontWeight: 600 }}
                >
                  Response Structure
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  The API returns compressed data with performance timing and platform metrics:
                </Typography>
                <CodeBlock language="json">
                  {`{
  "result": "success",
  "took": "45.20",      // Response time in milliseconds
  "exch": {             // Current exchange rates
    "xrp": {
      "usd": 0.5234,
      "eur": 0.4891,
      // ... other fiat rates
    }
  },
  "H24": {              // 24-hour platform metrics
    "volume": "1234567.89",
    "trades": 8765,
    // ... other 24h metrics
  },
  "global": {           // Global platform metrics
    "totalSupply": "99999999999",
    "marketCap": "12345678.90",
    // ... other global metrics
  },
  // Token data fields (spread from tokens object):
  "tokens": [           // Array of token objects
    {
      "issuer": "rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq",
      "currency": "USD",
      "name": "USD",
      "slug": "gatehub-usd",        // (if showSlug=true)
      "tags": ["stablecoin"],       // (if tags=yes)
      "isNew": false,               // (if showNew=true)
      "created": "2023-01-01",      // (if showDate=true)
      // ... other token properties
    }
    // ... more tokens
  ],
  "total": 12543,       // Total number of tokens matching criteria
  "start": 0,           // Pagination start value
  "limit": 100          // Pagination limit value
}`}
                </CodeBlock>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3, borderRadius: '12px' }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.warning.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.warning.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ color: theme.palette.warning.main, fontWeight: 600 }}
                >
                  Performance Features
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  This endpoint includes several performance optimizations:
                </Typography>
                <Box sx={{ ml: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Compression:</strong> Automatic response compression for faster data
                    transfer
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Parallel Processing:</strong> Uses Promise.all for concurrent data
                    fetching
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Performance Timing:</strong> Includes response time measurement in
                    "took" field
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    • <strong>Smart Defaults:</strong> Automatic parameter validation and fallback
                    values
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: '12px' }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.error.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.error.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
                }}
              >
                <Typography variant="h6" sx={{ color: theme.palette.error.main, fontWeight: 600 }}>
                  Error Responses
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  The API returns the following error response on failure:
                </Typography>
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 'bold', color: theme.palette.error.main }}
                  >
                    500 Internal Server Error
                  </Typography>
                  <CodeBlock language="json">
                    {`{
  "message": "Error message details"
}`}
                  </CodeBlock>
                </Box>
              </CardContent>
            </Card>
          </Box>
        );

      case 'get-a-specific-token-info':
        return (
          <Box id="get-a-specific-token-info">
            <Card
              sx={{
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.success.main,
                  0.05
                )} 0%, ${alpha(theme.palette.success.main, 0.02)} 100%)`,
                border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`,
                borderRadius: '16px',
                p: 3,
                mb: 3
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SearchIcon sx={{ color: theme.palette.success.main, mr: 2, fontSize: 32 }} />
                <Typography
                  variant="h2"
                  sx={{ color: theme.palette.success.main, fontWeight: 600 }}
                >
                  Get a Specific Token Info
                </Typography>
              </Box>
              <Typography
                variant="body1"
                sx={{ lineHeight: 1.8, color: theme.palette.text.secondary }}
              >
                Retrieve detailed information about a specific token using three different methods:
                issuer + currency code, slug, or MD5 hash. The API uses intelligent fallback logic
                and returns comprehensive token data along with platform metrics.
              </Typography>
            </Card>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <Card sx={{ borderRadius: '12px', height: '100%' }}>
                  <Box
                    sx={{
                      background: `linear-gradient(135deg, ${alpha(
                        theme.palette.success.main,
                        0.08
                      )} 0%, ${alpha(theme.palette.success.main, 0.03)} 100%)`,
                      p: 2,
                      borderRadius: '12px 12px 0 0'
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ color: theme.palette.success.main, fontWeight: 600 }}
                    >
                      Method 1: Issuer + Currency
                    </Typography>
                  </Box>
                  <CardContent>
                    <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                      Recommended method using issuer address and currency code.
                    </Typography>
                    <CodeBlock language="http">
                      GET https://api.xrpl.to/api/token/&lt;issuer&gt;_&lt;currencyCode&gt;
                    </CodeBlock>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ borderRadius: '12px', height: '100%' }}>
                  <Box
                    sx={{
                      background: `linear-gradient(135deg, ${alpha(
                        theme.palette.info.main,
                        0.08
                      )} 0%, ${alpha(theme.palette.info.main, 0.03)} 100%)`,
                      p: 2,
                      borderRadius: '12px 12px 0 0'
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ color: theme.palette.info.main, fontWeight: 600 }}
                    >
                      Method 2: Slug
                    </Typography>
                  </Box>
                  <CardContent>
                    <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                      Using URL-friendly token slug identifier.
                    </Typography>
                    <CodeBlock language="http">
                      GET https://api.xrpl.to/api/token/&lt;slug&gt;?desc=yes
                    </CodeBlock>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ borderRadius: '12px', height: '100%' }}>
                  <Box
                    sx={{
                      background: `linear-gradient(135deg, ${alpha(
                        theme.palette.warning.main,
                        0.08
                      )} 0%, ${alpha(theme.palette.warning.main, 0.03)} 100%)`,
                      p: 2,
                      borderRadius: '12px 12px 0 0'
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ color: theme.palette.warning.main, fontWeight: 600 }}
                    >
                      Method 3: MD5 Hash
                    </Typography>
                  </Box>
                  <CardContent>
                    <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                      Using MD5 hash of issuer_currency combination.
                    </Typography>
                    <CodeBlock language="http">
                      GET https://api.xrpl.to/api/token/&lt;md5&gt;
                    </CodeBlock>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Card sx={{ borderRadius: '12px', mb: 3 }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.info.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.info.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                }}
              >
                <Typography variant="h6" sx={{ color: theme.palette.info.main, fontWeight: 600 }}>
                  Fallback Logic
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  The API uses intelligent fallback logic to find tokens:
                </Typography>
                <Box sx={{ ml: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    1. First attempts to get token by slug (which includes MD5)
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    2. If not found, tries to get token by issuer_currency combination
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    3. Returns 404 if token is not found using either method
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: '12px', mb: 3 }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.warning.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.warning.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ color: theme.palette.warning.main, fontWeight: 600 }}
                >
                  How to Generate MD5 Hash
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  To generate the MD5 hash, combine the issuer address and currency code with an
                  underscore, then calculate the MD5 hash.
                </Typography>
                <CodeBlock language="javascript">
                  {`const CryptoJS = require('crypto-js');

// Example: Generate MD5 for a token
const issuer = 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq';
const currency = 'USD';
const md5 = CryptoJS.MD5(issuer + '_' + currency).toString();

// Use the MD5 in your API request
const response = await fetch(\`https://api.xrpl.to/api/token/\${md5}\`);`}
                </CodeBlock>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: '12px', mb: 3 }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.primary.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ color: theme.palette.primary.main, fontWeight: 600 }}
                >
                  Query Parameters
                </Typography>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          fontWeight: 'bold'
                        }}
                      >
                        Parameter
                      </TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          fontWeight: 'bold'
                        }}
                      >
                        Default
                      </TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          fontWeight: 'bold'
                        }}
                      >
                        Description
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>issuer_currencyCode</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>
                        The issuer address followed by an underscore and the currency code. This is
                        the recommended method.
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>slug</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>
                        Alternatively, you can use the URL slug of the token to retrieve token
                        information.
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>md5</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>
                        MD5 hash of the issuer_currency combination for programmatic access.
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>desc</TableCell>
                      <TableCell>no</TableCell>
                      <TableCell>
                        yes or no, if yes, returns the description of the token in markdown
                        language. Only works when token has MD5 hash.
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>

            <Card sx={{ borderRadius: '12px', mb: 3 }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.success.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.success.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ color: theme.palette.success.main, fontWeight: 600 }}
                >
                  Response Structure
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  The API returns a comprehensive response with token data and platform metrics:
                </Typography>
                <CodeBlock language="json">
                  {`{
  "res": "success",
  "took": "45.20",  // Response time in milliseconds
  "total": 12543,   // Total number of tokens on the platform
  "exch": {         // Current exchange rates
    "xrp": {
      "usd": 0.5234,
      "eur": 0.4891,
      // ... other fiat rates
    }
  },
  "H24": {          // 24-hour platform metrics
    "volume": "1234567.89",
    "trades": 8765,
    // ... other 24h metrics
  },
  "global": {       // Global platform metrics
    "totalSupply": "99999999999",
    "marketCap": "12345678.90",
    // ... other global metrics
  },
  "token": {        // Detailed token information
    "issuer": "rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq",
    "currency": "USD",
    "md5": "0413ca7cfc258dfaf698c02fe304e607",
    "slug": "gatehub-usd",
    "name": "USD",
    "description": "Token description (if desc=yes and MD5 exists)",
    // ... other token properties
  }
}`}
                </CodeBlock>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: '12px' }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.error.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.error.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
                }}
              >
                <Typography variant="h6" sx={{ color: theme.palette.error.main, fontWeight: 600 }}>
                  Error Responses
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  The API returns the following error responses:
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 'bold', color: theme.palette.error.main }}
                  >
                    404 Not Found
                  </Typography>
                  <CodeBlock language="json">
                    {`{
  "message": "Token not found"
}`}
                  </CodeBlock>
                </Box>
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 'bold', color: theme.palette.error.main }}
                  >
                    500 Internal Server Error
                  </Typography>
                  <CodeBlock language="json">
                    {`{
  "message": "Error message details"
}`}
                  </CodeBlock>
                </Box>
              </CardContent>
            </Card>
          </Box>
        );

      case 'get-sparkline-of-a-token':
        return (
          <Box id="get-sparkline-of-a-token">
            <Card
              sx={{
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.info.main,
                  0.05
                )} 0%, ${alpha(theme.palette.info.main, 0.02)} 100%)`,
                border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
                borderRadius: '16px',
                p: 3,
                mb: 3
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon sx={{ color: theme.palette.info.main, mr: 2, fontSize: 32 }} />
                <Typography variant="h2" sx={{ color: theme.palette.info.main, fontWeight: 600 }}>
                  Get Token Sparkline
                </Typography>
              </Box>
              <Typography
                variant="body1"
                sx={{ lineHeight: 1.8, color: theme.palette.text.secondary }}
              >
                Retrieve sparkline chart data for token price visualization and trend analysis.
                Supports both 24-hour and 7-day periods with automatic chart coloring, precise
                formatting, and cross-origin compatibility.
              </Typography>
            </Card>

            <Card sx={{ mb: 3, borderRadius: '12px' }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.info.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.info.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                }}
              >
                <Typography variant="h6" sx={{ color: theme.palette.info.main, fontWeight: 600 }}>
                  HTTP Request
                </Typography>
              </Box>
              <CardContent>
                <CodeBlock language="http">
                  GET https://api.xrpl.to/api/sparkline/&lt;md5&gt;
                </CodeBlock>
                <Typography variant="body2" sx={{ mt: 2, color: theme.palette.text.secondary }}>
                  Example with 24-hour period:
                </Typography>
                <CodeBlock language="http">
                  GET https://api.xrpl.to/api/sparkline/0413ca7cfc258dfaf698c02fe304e607?period=24h
                </CodeBlock>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3, borderRadius: '12px' }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.primary.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ color: theme.palette.primary.main, fontWeight: 600 }}
                >
                  Parameters
                </Typography>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          fontWeight: 'bold'
                        }}
                      >
                        Parameter
                      </TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          fontWeight: 'bold'
                        }}
                      >
                        Type
                      </TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          fontWeight: 'bold'
                        }}
                      >
                        Default
                      </TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          fontWeight: 'bold'
                        }}
                      >
                        Description
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>md5</TableCell>
                      <TableCell>Path</TableCell>
                      <TableCell>Required</TableCell>
                      <TableCell>MD5 hash of the token identifier</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>period</TableCell>
                      <TableCell>Query</TableCell>
                      <TableCell>7d</TableCell>
                      <TableCell>
                        Time period: "24h" for 24-hour data or "7d" for 7-day data
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>pro24h</TableCell>
                      <TableCell>Query</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>
                        Override 24-hour percentage change value (when period=24h)
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>pro7d</TableCell>
                      <TableCell>Query</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>Override 7-day percentage change value (when period=7d)</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>

            <Card sx={{ mb: 3, borderRadius: '12px' }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.success.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.success.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ color: theme.palette.success.main, fontWeight: 600 }}
                >
                  Response Structure
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  The API returns formatted sparkline data with automatic chart coloring and
                  timestamps:
                </Typography>
                <CodeBlock language="json">
                  {`{
  "chartColor": "#54D62C",           // Green for positive, "#ed5565" for negative
  "period": "24h",                  // "24h" or "7d" based on request
  "percentChange": "2.45",          // Percentage change as string
  "data": {
    "prices": [                     // Array of price points (formatted decimals)
      "0.1234",
      "0.1235", 
      "0.1240",
      // ... more price points
    ],
    "timestamps": [                 // Corresponding timestamps (milliseconds)
      1640995200000,
      1640995800000,
      1640996400000,
      // ... more timestamps  
    ],
    "max": "0.1250",               // Highest price in period
    "min": "0.1200"                // Lowest price in period
  }
}`}
                </CodeBlock>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3, borderRadius: '12px' }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.warning.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.warning.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ color: theme.palette.warning.main, fontWeight: 600 }}
                >
                  Smart Features
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  This endpoint includes several intelligent features:
                </Typography>
                <Box sx={{ ml: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Multi-Currency Support:</strong> USD, EUR, JPY, CNH, and XRP
                    conversion
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>XRP Special Handling:</strong> Automatic inverse calculation for XRP
                    pairs
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Intelligent Fallback:</strong> 1D data supplemented with 7D data when
                    needed
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Volume Integration:</strong> Volume-weighted price data included
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    • <strong>Performance Timing:</strong> Response time measurement for
                    optimization
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3, borderRadius: '12px' }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.info.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.info.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                }}
              >
                <Typography variant="h6" sx={{ color: theme.palette.info.main, fontWeight: 600 }}>
                  Data Calculation Logic
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  The endpoint includes sophisticated logic for XRP and data availability:
                </Typography>
                <Box sx={{ ml: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>XRP Detection:</strong> Automatically detects XRP MD5 and applies
                    inverse calculation
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>1D Fallback:</strong> If only 1 trade exists for 1D range, supplements
                    with 7D data
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Currency Mapping:</strong> CNH requests automatically map to CNY data
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    • <strong>Default Fallback:</strong> Unknown currencies default to USD pricing
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: '12px' }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.error.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.error.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
                }}
              >
                <Typography variant="h6" sx={{ color: theme.palette.error.main, fontWeight: 600 }}>
                  Error Responses
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  The API returns the following error response on failure:
                </Typography>
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 'bold', color: theme.palette.error.main }}
                  >
                    500 Internal Server Error
                  </Typography>
                  <CodeBlock language="json">
                    {`{
  "message": "Error message details"
}`}
                  </CodeBlock>
                </Box>
              </CardContent>
            </Card>
          </Box>
        );

      case 'get-rich-list-of-a-token':
        return (
          <Box id="get-rich-list-of-a-token">
            <Card
              sx={{
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.error.main,
                  0.05
                )} 0%, ${alpha(theme.palette.error.main, 0.02)} 100%)`,
                border: `1px solid ${alpha(theme.palette.error.main, 0.15)}`,
                borderRadius: '16px',
                p: 3,
                mb: 3
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccountBalanceWalletIcon
                  sx={{ color: theme.palette.error.main, mr: 2, fontSize: 32 }}
                />
                <Typography variant="h2" sx={{ color: theme.palette.error.main, fontWeight: 600 }}>
                  Get Rich List of Token
                </Typography>
              </Box>
              <Typography
                variant="body1"
                sx={{ lineHeight: 1.8, color: theme.palette.text.secondary }}
              >
                Retrieve the rich list showing top token holders with their balances. Supports
                pagination, custom sorting, freeze status filtering, and performance timing for
                comprehensive token holder analysis.
              </Typography>
            </Card>

            <Card sx={{ mb: 3, borderRadius: '12px' }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.error.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.error.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
                }}
              >
                <Typography variant="h6" sx={{ color: theme.palette.error.main, fontWeight: 600 }}>
                  HTTP Request
                </Typography>
              </Box>
              <CardContent>
                <CodeBlock language="http">
                  GET https://api.xrpl.to/api/richlist/&lt;md5&gt;?start=0&limit=20&sortType=desc
                </CodeBlock>
                <Typography variant="body2" sx={{ mt: 2, color: theme.palette.text.secondary }}>
                  Example with freeze filtering and custom sorting:
                </Typography>
                <CodeBlock language="http">
                  GET
                  https://api.xrpl.to/api/richlist/0413ca7cfc258dfaf698c02fe304e607?start=0&limit=20&freeze=true&sortBy=balance&sortType=desc
                </CodeBlock>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3, borderRadius: '12px' }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.primary.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ color: theme.palette.primary.main, fontWeight: 600 }}
                >
                  Parameters
                </Typography>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          fontWeight: 'bold'
                        }}
                      >
                        Parameter
                      </TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          fontWeight: 'bold'
                        }}
                      >
                        Type
                      </TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          fontWeight: 'bold'
                        }}
                      >
                        Default
                      </TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          fontWeight: 'bold'
                        }}
                      >
                        Description
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>md5</TableCell>
                      <TableCell>Path</TableCell>
                      <TableCell>Required</TableCell>
                      <TableCell>MD5 hash of the token identifier</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>start</TableCell>
                      <TableCell>Query</TableCell>
                      <TableCell>0</TableCell>
                      <TableCell>Starting position for pagination (number)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>limit</TableCell>
                      <TableCell>Query</TableCell>
                      <TableCell>20</TableCell>
                      <TableCell>Maximum number of records to return (number)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>freeze</TableCell>
                      <TableCell>Query</TableCell>
                      <TableCell>false</TableCell>
                      <TableCell>Set to "true" to include freeze status information</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>sortBy</TableCell>
                      <TableCell>Query</TableCell>
                      <TableCell>balance</TableCell>
                      <TableCell>Field to sort by (e.g., balance, account, etc.)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>sortType</TableCell>
                      <TableCell>Query</TableCell>
                      <TableCell>desc</TableCell>
                      <TableCell>
                        Sort direction: "asc" (ascending) or "desc" (descending)
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>

            <Card sx={{ mb: 3, borderRadius: '12px' }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.success.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.success.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ color: theme.palette.success.main, fontWeight: 600 }}
                >
                  Response Structure
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  The API returns rich list data with performance timing and pagination info:
                </Typography>
                <CodeBlock language="json">
                  {`{
  "result": "success",
  "took": "23.45",                  // Response time in milliseconds
  "holders": [                      // Array of token holders
    {
      "account": "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
      "balance": "1000000.123456",   // Token balance
      "percentage": "15.25",         // Percentage of total supply
      "rank": 1,                     // Position in rich list
      "frozen": false                // Freeze status (if freeze=true)
    },
    {
      "account": "rLNaPoKeeBjZe2qs6x52yVPZpZ8td4dc6w", 
      "balance": "750000.987654",
      "percentage": "11.43",
      "rank": 2,
      "frozen": false
    }
    // ... more holders
  ],
  "pagination": {
    "start": 0,                     // Current start position
    "limit": 20,                    // Current limit
    "total": 5000,                  // Total number of holders
    "hasMore": true                 // Whether more records exist
  },
  "summary": {
    "totalSupply": "6562500.000000", // Total token supply
    "totalHolders": 5000,           // Total number of holders
    "topHoldersPercentage": "68.45" // Top holders concentration
  }
}`}
                </CodeBlock>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3, borderRadius: '12px' }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.warning.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.warning.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ color: theme.palette.warning.main, fontWeight: 600 }}
                >
                  Advanced Features
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  The rich list endpoint provides sophisticated analysis capabilities:
                </Typography>
                <Box sx={{ ml: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Flexible Sorting:</strong> Sort by balance, account, or other fields
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Freeze Status:</strong> Include freeze information for compliance
                    analysis
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Pagination Support:</strong> Efficient browsing of large holder lists
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Distribution Analysis:</strong> Percentage holdings and concentration
                    metrics
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    • <strong>Performance Timing:</strong> Response time measurement for
                    optimization
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3, borderRadius: '12px' }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.info.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.info.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                }}
              >
                <Typography variant="h6" sx={{ color: theme.palette.info.main, fontWeight: 600 }}>
                  Use Cases
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  The rich list data is valuable for various analytical purposes:
                </Typography>
                <Box sx={{ ml: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Token Distribution Analysis:</strong> Study wealth concentration
                    patterns
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Whale Tracking:</strong> Monitor large holder movements and behavior
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Compliance Monitoring:</strong> Track frozen accounts and regulatory
                    status
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    • <strong>Market Research:</strong> Understand token holder demographics and
                    patterns
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: '12px' }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.error.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.error.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
                }}
              >
                <Typography variant="h6" sx={{ color: theme.palette.error.main, fontWeight: 600 }}>
                  Error Responses
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  The API returns the following error response on failure:
                </Typography>
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 'bold', color: theme.palette.error.main }}
                  >
                    500 Internal Server Error
                  </Typography>
                  <CodeBlock language="json">
                    {`{
  "message": "Error message details"
}`}
                  </CodeBlock>
                </Box>
              </CardContent>
            </Card>
          </Box>
        );

      case 'get-exchange-history-of-a-token':
        return (
          <Box id="get-exchange-history-of-a-token">
            <Card
              sx={{
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.secondary.main,
                  0.05
                )} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
                borderRadius: '16px',
                p: 3,
                mb: 3
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SpeedIcon sx={{ color: theme.palette.secondary.main, mr: 2, fontSize: 32 }} />
                <Typography
                  variant="h2"
                  sx={{ color: theme.palette.secondary.main, fontWeight: 600 }}
                >
                  Get Exchange History
                </Typography>
              </Box>
              <Typography
                variant="body1"
                sx={{ lineHeight: 1.8, color: theme.palette.text.secondary }}
              >
                Retrieve historical exchange data and trading activity for a specific token or
                account. Supports pagination, account filtering, and performance timing for
                comprehensive transaction analysis with automatic parameter validation.
              </Typography>
            </Card>

            <Card sx={{ mb: 3, borderRadius: '12px' }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.secondary.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.secondary.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ color: theme.palette.secondary.main, fontWeight: 600 }}
                >
                  HTTP Request
                </Typography>
              </Box>
              <CardContent>
                <CodeBlock language="http">
                  GET https://api.xrpl.to/api/history?md5=&lt;md5&gt;&page=0&limit=10
                </CodeBlock>
                <Typography variant="body2" sx={{ mt: 2, color: theme.palette.text.secondary }}>
                  Example with account filtering:
                </Typography>
                <CodeBlock language="http">
                  GET
                  https://api.xrpl.to/api/history?md5=c9ac9a6c44763c1bd9ccc6e47572fd26&account=rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH&page=0&limit=50
                </CodeBlock>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3, borderRadius: '12px' }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.primary.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ color: theme.palette.primary.main, fontWeight: 600 }}
                >
                  Query Parameters
                </Typography>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          fontWeight: 'bold'
                        }}
                      >
                        Parameter
                      </TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          fontWeight: 'bold'
                        }}
                      >
                        Type
                      </TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          fontWeight: 'bold'
                        }}
                      >
                        Default
                      </TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          fontWeight: 'bold'
                        }}
                      >
                        Description
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>md5</TableCell>
                      <TableCell>Query</TableCell>
                      <TableCell>Required</TableCell>
                      <TableCell>MD5 hash of the token identifier</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>account</TableCell>
                      <TableCell>Query</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>Filter history by specific XRPL account address</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>page</TableCell>
                      <TableCell>Query</TableCell>
                      <TableCell>0</TableCell>
                      <TableCell>Page number for pagination (minimum: 0)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>limit</TableCell>
                      <TableCell>Query</TableCell>
                      <TableCell>50</TableCell>
                      <TableCell>Records per page (range: 1-5000, default: 50)</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>

            <Card sx={{ mb: 3, borderRadius: '12px' }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.warning.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.warning.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ color: theme.palette.warning.main, fontWeight: 600 }}
                >
                  Parameter Validation
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  The API automatically validates and corrects parameters:
                </Typography>
                <Box sx={{ ml: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Page Validation:</strong> Negative page values are automatically set
                    to 0
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Limit Bounds:</strong> Values above 5000 are capped at 5000
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    • <strong>Minimum Limit:</strong> Values below 1 are set to default 50
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3, borderRadius: '12px' }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.success.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.success.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ color: theme.palette.success.main, fontWeight: 600 }}
                >
                  Response Structure
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  The API returns comprehensive exchange history with performance metrics:
                </Typography>
                <CodeBlock language="json">
                  {`{
  "result": "success",
  "took": "45.23ms",                // Response time with unit
  "recordsReturned": 10,            // Number of records in current response
  "totalRecords": 15420,            // Total records available
  "page": 0,                        // Current page number
  "limit": 10,                      // Records per page limit
  "count": 15420,                   // Total count (same as totalRecords)
  "hists": [                        // Array of exchange history records
    {
      "txHash": "A1B2C3D4E5F6789...",
      "ledgerIndex": 75123456,
      "timestamp": 1640995200,       // Unix timestamp
      "date": "2023-01-01T00:00:00Z", // ISO date string
      "type": "Payment",             // Transaction type
      "account": "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
      "destination": "rLNaPoKeeBjZe2qs6x52yVPZpZ8td4dc6w",
      "amount": {
        "value": "1000.123456",
        "currency": "USD",
        "issuer": "rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq"
      },
      "fee": "0.000012",             // Transaction fee in XRP
      "result": "tesSUCCESS",        // Transaction result
      "exchangeRate": "0.5234",      // Exchange rate if applicable
      "volume": "1000.123456"        // Transaction volume
    }
    // ... more history records
  ]
}`}
                </CodeBlock>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3, borderRadius: '12px' }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.warning.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.warning.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ color: theme.palette.warning.main, fontWeight: 600 }}
                >
                  Advanced Features
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  The exchange history endpoint provides comprehensive transaction analysis:
                </Typography>
                <Box sx={{ ml: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Account Filtering:</strong> Filter transactions by specific account
                    addresses
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Flexible Pagination:</strong> Efficient browsing with configurable
                    page sizes
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Performance Timing:</strong> Response time measurement with
                    millisecond precision
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Comprehensive Metadata:</strong> Total records, current page, and
                    limit information
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    • <strong>Transaction Details:</strong> Complete transaction data including
                    fees, rates, and results
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3, borderRadius: '12px' }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.warning.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.warning.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ color: theme.palette.warning.main, fontWeight: 600 }}
                >
                  Use Cases
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  Exchange history data enables various analytical and monitoring applications:
                </Typography>
                <Box sx={{ ml: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Transaction Analysis:</strong> Study trading patterns and volume
                    trends
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Account Monitoring:</strong> Track specific account trading activity
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Compliance Auditing:</strong> Review transaction history for
                    regulatory purposes
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Market Research:</strong> Analyze exchange rates and trading volumes
                    over time
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    • <strong>Portfolio Tracking:</strong> Monitor token movements and transaction
                    fees
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: '12px' }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.error.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.error.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
                }}
              >
                <Typography variant="h6" sx={{ color: theme.palette.error.main, fontWeight: 600 }}>
                  Error Responses
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  The API returns the following error response on failure:
                </Typography>
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 'bold', color: theme.palette.error.main }}
                  >
                    500 Internal Server Error
                  </Typography>
                  <CodeBlock language="json">
                    {`{
  "message": "Error message details"
}`}
                  </CodeBlock>
                </Box>
              </CardContent>
            </Card>
          </Box>
        );

      case 'get-the-current-status':
        return (
          <Box id="get-the-current-status">
            <Card
              sx={{
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.primary.main,
                  0.05
                )} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                borderRadius: '16px',
                p: 3,
                mb: 3
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <DataUsageIcon sx={{ color: theme.palette.primary.main, mr: 2, fontSize: 32 }} />
                <Typography
                  variant="h2"
                  sx={{ color: theme.palette.primary.main, fontWeight: 600 }}
                >
                  Get Current Status
                </Typography>
              </Box>
              <Typography
                variant="body1"
                sx={{ lineHeight: 1.8, color: theme.palette.text.secondary }}
              >
                Retrieve comprehensive platform status including current exchange rates, total token
                count, 24-hour metrics, and global platform statistics. This endpoint provides
                real-time insights into XRPL ecosystem activity with performance timing.
              </Typography>
            </Card>

            <Card sx={{ mb: 3, borderRadius: '12px' }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.primary.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ color: theme.palette.primary.main, fontWeight: 600 }}
                >
                  HTTP Request
                </Typography>
              </Box>
              <CardContent>
                <CodeBlock language="http">GET https://api.xrpl.to/api/status</CodeBlock>
                <Typography variant="body2" sx={{ mt: 2, color: theme.palette.text.secondary }}>
                  This endpoint requires no query parameters and returns comprehensive platform
                  metrics.
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3, borderRadius: '12px' }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.success.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.success.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ color: theme.palette.success.main, fontWeight: 600 }}
                >
                  Response Structure
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  The API returns comprehensive platform status with real-time metrics:
                </Typography>
                <CodeBlock language="json">
                  {`{
  "res": "success",
  "took": "83.60ms",               // Response time in milliseconds
  "total": 16849,                  // Total number of tokens on platform
  "exch": {                        // Current XRP exchange rates
    "USD": 0.465408702144082,      // XRP to USD rate
    "EUR": 0.537035101404056,      // XRP to EUR rate  
    "JPY": 0.00322407119453461,    // XRP to JPY rate
    "CNY": 0.0647701776267451      // XRP to CNY rate
  },
  "H24": {                         // 24-hour platform metrics
    "_id": "METRICS_24H",
    "activeAddresses24H": 21919,   // Active addresses in last 24h
    "totalAddresses": 6563817,     // Total addresses on XRPL
    "totalOffers": 11598213,       // Total active offers
    "totalTrustLines": 6681685,    // Total trustlines
    "tradedTokens24H": 1384,       // Tokens traded in 24h
    "tradedXRP24H": 3386907.79963, // XRP volume in 24h
    "transactions24H": 337795,     // Transactions in 24h
    "totalTVL": 24956180.4315585,  // Total Value Locked
    "lastUpdated": "2025-06-13T23:07:31.256Z",
    "updateStatus": "complete"
  },
  "global": {                      // Global platform metrics
    "_id": "METRICS_GLOBAL",
    "gDexVolume": 3380879.024549,  // Global DEX volume
    "gDexVolumePro": -7.00388417359496,  // DEX volume change %
    "gMarketcap": 265098025.707726,      // Global market cap
    "gMarketcapPro": -1.36204154630568,  // Market cap change %
    "gNFTIOUVolume": 5750.87524571821,   // NFT/IOU volume
    "gNFTIOUVolumePro": 0.17010000073828, // NFT/IOU volume change %
    "gScamVolume": 34244.6004413518,     // Scam token volume
    "gScamVolumePro": 1.0128904404061,   // Scam volume change %
    "gStableVolume": 1841364.50671297,   // Stablecoin volume
    "gStableVolumePro": 54.464075565632, // Stable volume change %
    "gXRPdominance": 0,                  // XRP dominance %
    "gXRPdominancePro": 0,              // XRP dominance change %
    "totalAddresses": 6563817,          // Total XRPL addresses
    "totalOffers": 11598225,            // Total platform offers
    "totalTrustLines": 6681690,         // Total platform trustlines
    "gMemeVolume": 1469624.08263417,    // Meme token volume
    "gMemeVolumePro": 43.468697695571   // Meme volume change %
  }
}`}
                </CodeBlock>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3, borderRadius: '12px' }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.info.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.info.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                }}
              >
                <Typography variant="h6" sx={{ color: theme.palette.info.main, fontWeight: 600 }}>
                  Metrics Explanation
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  The status endpoint provides four main categories of data:
                </Typography>

                <Typography
                  variant="h6"
                  sx={{ color: theme.palette.info.main, mb: 1, fontWeight: 600 }}
                >
                  Exchange Rates (exch)
                </Typography>
                <Box sx={{ ml: 2, mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • Current XRP exchange rates against major fiat currencies
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • Updated in real-time from market data sources
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    • Used for token value calculations across the platform
                  </Typography>
                </Box>

                <Typography
                  variant="h6"
                  sx={{ color: theme.palette.info.main, mb: 1, fontWeight: 600 }}
                >
                  24-Hour Metrics (H24)
                </Typography>
                <Box sx={{ ml: 2, mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>activeAddresses24H:</strong> Unique addresses that transacted in last
                    24 hours
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>tradedTokens24H:</strong> Number of different tokens traded
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>tradedXRP24H:</strong> Total XRP volume in 24-hour period
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>transactions24H:</strong> Total transaction count
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    • <strong>totalTVL:</strong> Total Value Locked across all tokens
                  </Typography>
                </Box>

                <Typography
                  variant="h6"
                  sx={{ color: theme.palette.info.main, mb: 1, fontWeight: 600 }}
                >
                  Global Metrics (global)
                </Typography>
                <Box sx={{ ml: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Volume Metrics:</strong> DEX, Stablecoin, Meme, NFT, and Scam token
                    volumes
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Percentage Changes:</strong> All volume metrics include percentage
                    change indicators
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Market Cap:</strong> Total market capitalization with change
                    percentage
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    • <strong>Network Stats:</strong> Total addresses, offers, and trustlines across
                    XRPL
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3, borderRadius: '12px' }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.warning.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.warning.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ color: theme.palette.warning.main, fontWeight: 600 }}
                >
                  Performance Features
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  The status endpoint includes several performance and reliability features:
                </Typography>
                <Box sx={{ ml: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Parallel Processing:</strong> All metrics fetched concurrently using
                    Promise.all
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Performance Timing:</strong> Response time measured and included in
                    response
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Real-time Data:</strong> All metrics updated continuously from live
                    XRPL data
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    • <strong>Error Handling:</strong> Comprehensive error logging and graceful
                    failure handling
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3, borderRadius: '12px' }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.success.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.success.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ color: theme.palette.success.main, fontWeight: 600 }}
                >
                  Use Cases
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  The status endpoint serves various monitoring and analytical purposes:
                </Typography>
                <Box sx={{ ml: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>System Health:</strong> Monitor platform performance and availability
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Market Overview:</strong> Get snapshot of XRPL ecosystem activity
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Exchange Rate Feeds:</strong> Current XRP rates for pricing
                    calculations
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Analytics Dashboards:</strong> Real-time metrics for monitoring tools
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    • <strong>Trading Insights:</strong> Volume trends and market activity
                    indicators
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: '12px' }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.error.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.error.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
                }}
              >
                <Typography variant="h6" sx={{ color: theme.palette.error.main, fontWeight: 600 }}>
                  Error Responses
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  The API returns the following error response on failure:
                </Typography>
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 'bold', color: theme.palette.error.main }}
                  >
                    500 Internal Server Error
                  </Typography>
                  <CodeBlock language="json">
                    {`{
  "message": "Error message details"
}`}
                  </CodeBlock>
                </Box>
              </CardContent>
            </Card>
          </Box>
        );

      case 'get-account-offers':
        return (
          <Box id="get-account-offers">
            <Card
              sx={{
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.success.main,
                  0.05
                )} 0%, ${alpha(theme.palette.success.main, 0.02)} 100%)`,
                border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`,
                borderRadius: '16px',
                p: 3,
                mb: 3
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccountBalanceWalletIcon
                  sx={{ color: theme.palette.success.main, mr: 2, fontSize: 32 }}
                />
                <Typography
                  variant="h2"
                  sx={{ color: theme.palette.success.main, fontWeight: 600 }}
                >
                  Get Account Offers
                </Typography>
              </Box>
              <Typography
                variant="body1"
                sx={{ lineHeight: 1.8, color: theme.palette.text.secondary }}
              >
                Retrieve all active offers for a specific XRPL account address.
              </Typography>
            </Card>

            <Card sx={{ borderRadius: '12px' }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.success.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.success.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ color: theme.palette.success.main, fontWeight: 600 }}
                >
                  HTTP Request
                </Typography>
              </Box>
              <CardContent>
                <CodeBlock language="http">
                  GET https://api.xrpl.to/api/account/offers/&lt;account&gt;
                </CodeBlock>
              </CardContent>
            </Card>
          </Box>
        );

      case 'errors':
        return (
          <Box id="errors">
            <Card
              sx={{
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.error.main,
                  0.05
                )} 0%, ${alpha(theme.palette.error.main, 0.02)} 100%)`,
                border: `1px solid ${alpha(theme.palette.error.main, 0.15)}`,
                borderRadius: '16px',
                p: 3,
                mb: 3
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ErrorOutlineIcon sx={{ color: theme.palette.error.main, mr: 2, fontSize: 32 }} />
                <Typography variant="h2" sx={{ color: theme.palette.error.main, fontWeight: 600 }}>
                  Error Codes
                </Typography>
              </Box>
              <Typography
                variant="body1"
                sx={{ lineHeight: 1.8, color: theme.palette.text.secondary, mb: 3 }}
              >
                The XRPL.to API uses standard HTTP error codes to indicate the success or failure of
                requests.
              </Typography>
            </Card>

            <Card sx={{ borderRadius: '12px' }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.error.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.error.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
                }}
              >
                <Typography variant="h6" sx={{ color: theme.palette.error.main, fontWeight: 600 }}>
                  HTTP Status Codes
                </Typography>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          backgroundColor: alpha(theme.palette.error.main, 0.1),
                          fontWeight: 'bold'
                        }}
                      >
                        Error Code
                      </TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: alpha(theme.palette.error.main, 0.1),
                          fontWeight: 'bold'
                        }}
                      >
                        Meaning
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>400</TableCell>
                      <TableCell>Bad Request -- Your request is invalid.</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>401</TableCell>
                      <TableCell>Unauthorized -- Your API key is wrong.</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>403</TableCell>
                      <TableCell>
                        Forbidden -- The token requested is hidden for administrators only.
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>404</TableCell>
                      <TableCell>Not Found -- The specified token could not be found.</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>405</TableCell>
                      <TableCell>
                        Method Not Allowed -- You tried to access a token with an invalid method.
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>410</TableCell>
                      <TableCell>
                        Gone -- The token requested has been removed from our servers.
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>418</TableCell>
                      <TableCell>I'm a teapot.</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>429</TableCell>
                      <TableCell>
                        Too Many Requests -- You're requesting too many tokens! Slow down!
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>500</TableCell>
                      <TableCell>
                        Internal Server Error -- We had a problem with our server. Try again later.
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>503</TableCell>
                      <TableCell>
                        Service Unavailable -- We're temporarily offline for maintenance. Please try
                        again later.
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Box>
        );

      case 'get-graph-data-of-a-token':
        return (
          <Box id="get-graph-data-of-a-token">
            <Card
              sx={{
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.warning.main,
                  0.05
                )} 0%, ${alpha(theme.palette.warning.main, 0.02)} 100%)`,
                border: `1px solid ${alpha(theme.palette.warning.main, 0.15)}`,
                borderRadius: '16px',
                p: 3,
                mb: 3
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon sx={{ color: theme.palette.warning.main, mr: 2, fontSize: 32 }} />
                <Typography
                  variant="h2"
                  sx={{ color: theme.palette.warning.main, fontWeight: 600 }}
                >
                  Get Graph Data of a Token
                </Typography>
              </Box>
              <Typography
                variant="body1"
                sx={{ lineHeight: 1.8, color: theme.palette.text.secondary }}
              >
                Retrieve comprehensive historical price and trading data for detailed chart
                visualization and technical analysis. Supports multiple time ranges from 1 day to
                all-time data with precise timestamps and volume information.
              </Typography>
            </Card>

            <Card sx={{ mb: 3, borderRadius: '12px' }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.warning.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.warning.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ color: theme.palette.warning.main, fontWeight: 600 }}
                >
                  HTTP Request
                </Typography>
              </Box>
              <CardContent>
                <CodeBlock language="http">
                  GET https://api.xrpl.to/api/graph/&lt;md5&gt;?range=1D
                </CodeBlock>
                <Typography variant="body2" sx={{ mt: 2, color: theme.palette.text.secondary }}>
                  Example with 7-day range:
                </Typography>
                <CodeBlock language="http">
                  GET https://api.xrpl.to/api/graph/c9ac9a6c44763c1bd9ccc6e47572fd26?range=7D
                </CodeBlock>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3, borderRadius: '12px' }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.primary.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ color: theme.palette.primary.main, fontWeight: 600 }}
                >
                  Parameters
                </Typography>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          fontWeight: 'bold'
                        }}
                      >
                        Parameter
                      </TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          fontWeight: 'bold'
                        }}
                      >
                        Type
                      </TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          fontWeight: 'bold'
                        }}
                      >
                        Default
                      </TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          fontWeight: 'bold'
                        }}
                      >
                        Description
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>md5</TableCell>
                      <TableCell>Path</TableCell>
                      <TableCell>Required</TableCell>
                      <TableCell>MD5 hash of the token identifier</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>range</TableCell>
                      <TableCell>Query</TableCell>
                      <TableCell>1D</TableCell>
                      <TableCell>
                        Time range for historical data: 1D, 7D, 1M, 3M, 1Y, or ALL
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>

            <Card sx={{ mb: 3, borderRadius: '12px' }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.info.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.info.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                }}
              >
                <Typography variant="h6" sx={{ color: theme.palette.info.main, fontWeight: 600 }}>
                  Time Ranges
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  The API supports the following time ranges for historical data:
                </Typography>
                <Grid container spacing={2}>
                  {[
                    { range: '1D', desc: '1 Day - Last 24 hours', color: 'primary' },
                    { range: '7D', desc: '7 Days - Last week', color: 'success' },
                    { range: '1M', desc: '1 Month - Last 30 days', color: 'info' },
                    { range: '3M', desc: '3 Months - Last quarter', color: 'warning' },
                    { range: '1Y', desc: '1 Year - Last 12 months', color: 'error' },
                    { range: 'ALL', desc: 'All Time - Complete history', color: 'secondary' }
                  ].map((item, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card
                        sx={{
                          background: alpha(theme.palette[item.color].main, 0.08),
                          border: `1px solid ${alpha(theme.palette[item.color].main, 0.2)}`,
                          borderRadius: '8px',
                          p: 2,
                          textAlign: 'center',
                          transition: 'transform 0.2s ease',
                          '&:hover': { transform: 'scale(1.02)' }
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{ color: `${item.color}.main`, fontWeight: 600, mb: 1 }}
                        >
                          {item.range}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {item.desc}
                        </Typography>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3, borderRadius: '12px' }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.success.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.success.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ color: theme.palette.success.main, fontWeight: 600 }}
                >
                  Response Structure
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  The API returns detailed historical data with performance timing:
                </Typography>
                <CodeBlock language="json">
                  {`{
  "res": "success",
  "took": "45.23",                  // Response time in milliseconds
  "length": 288,                    // Number of data points returned
  "history": [                      // Array of historical data points
    {
      "timestamp": 1640995200000,    // Unix timestamp in milliseconds
      "date": "2023-01-01T00:00:00Z", // ISO 8601 date string
      "open": "0.1234",              // Opening price
      "high": "0.1250",              // Highest price in period
      "low": "0.1200",               // Lowest price in period
      "close": "0.1245",             // Closing price
      "volume": "15000.567890",      // Trading volume
      "volumeXRP": "12500.123456",   // Volume in XRP
      "trades": 45,                  // Number of trades
      "priceUSD": "0.0647",          // Price in USD
      "priceEUR": "0.0591",          // Price in EUR
      "priceJPY": "9.234",           // Price in JPY
      "priceCNY": "0.4123",          // Price in CNY
      "marketCap": "8123456.78"      // Market capitalization
    },
    {
      "timestamp": 1640998800000,
      "date": "2023-01-01T01:00:00Z",
      "open": "0.1245",
      "high": "0.1260",
      "low": "0.1230",
      "close": "0.1255",
      "volume": "18500.123456",
      "volumeXRP": "14750.987654",
      "trades": 52,
      "priceUSD": "0.0657",
      "priceEUR": "0.0601",
      "priceJPY": "9.456",
      "priceCNY": "0.4198",
      "marketCap": "8245123.45"
    }
    // ... more historical data points
  ]
}`}
                </CodeBlock>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3, borderRadius: '12px' }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.warning.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.warning.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ color: theme.palette.warning.main, fontWeight: 600 }}
                >
                  Data Features
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  The graph data endpoint provides comprehensive market data:
                </Typography>
                <Box sx={{ ml: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>OHLC Data:</strong> Open, High, Low, Close prices for each time period
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Multi-Currency Pricing:</strong> USD, EUR, JPY, and CNY price
                    conversions
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Volume Metrics:</strong> Both token volume and XRP volume tracking
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Trade Count:</strong> Number of individual transactions per period
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Market Cap:</strong> Real-time market capitalization calculations
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    • <strong>Performance Timing:</strong> Response time measurement for
                    optimization
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3, borderRadius: '12px' }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.info.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.info.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                }}
              >
                <Typography variant="h6" sx={{ color: theme.palette.info.main, fontWeight: 600 }}>
                  Use Cases
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  The graph data is ideal for various analytical and visualization purposes:
                </Typography>
                <Box sx={{ ml: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Chart Visualization:</strong> Create candlestick, line, and area
                    charts
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Technical Analysis:</strong> Calculate moving averages, RSI, and other
                    indicators
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Historical Research:</strong> Study long-term price trends and
                    patterns
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Volume Analysis:</strong> Correlate price movements with trading
                    activity
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Market Research:</strong> Compare performance across different time
                    periods
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    • <strong>Portfolio Tracking:</strong> Monitor asset performance over time
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3, borderRadius: '12px' }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.success.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.success.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ color: theme.palette.success.main, fontWeight: 600 }}
                >
                  Data Resolution
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  Data resolution varies by time range for optimal performance:
                </Typography>
                <Box sx={{ ml: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>1D:</strong> 5-minute intervals (288 data points)
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>7D:</strong> 30-minute intervals (336 data points)
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>1M:</strong> 4-hour intervals (180 data points)
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>3M:</strong> 12-hour intervals (180 data points)
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>1Y:</strong> Daily intervals (365 data points)
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    • <strong>ALL:</strong> Weekly intervals (variable count)
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: '12px' }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.error.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.error.main, 0.03)} 100%)`,
                  p: 2,
                  borderRadius: '12px 12px 0 0',
                  borderBottom: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
                }}
              >
                <Typography variant="h6" sx={{ color: theme.palette.error.main, fontWeight: 600 }}>
                  Error Responses
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  The API returns the following error responses:
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 'bold', color: theme.palette.error.main }}
                  >
                    500 Internal Server Error (Invalid MD5)
                  </Typography>
                  <CodeBlock language="json">
                    {`{
  "message": "Invalid md5"
}`}
                  </CodeBlock>
                </Box>
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 'bold', color: theme.palette.error.main }}
                  >
                    500 Internal Server Error (Other)
                  </Typography>
                  <CodeBlock language="json">
                    {`{
  "message": "Error message details"
}`}
                  </CodeBlock>
                </Box>
              </CardContent>
            </Card>
          </Box>
        );

      default:
        return (
          <Box id={id}>
            <Typography variant="h2" sx={{ color: theme.palette.primary.main, mb: 3 }}>
              {sections.find((s) => s.id === id)?.title || 'Section'}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8 }}>
              Documentation for this section is coming soon.
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Box>
      {sections.map((section) => (
        <Box key={section.id} sx={{ mb: 6 }}>
          {renderSection(section.id)}
        </Box>
      ))}
    </Box>
  );
};

// Code examples
const getCodeExample = (language, section) => {
  switch (section) {
    case 'get-all-tokens':
      switch (language) {
        case 'shell':
          return `curl -sS "https://api.xrpl.to/api/tokens?start=0&limit=100&sortBy=vol24hxrp&sortType=desc&filter="`;
        case 'ruby':
          return `require 'net/http'
require 'json'

uri = URI('https://api.xrpl.to/api/tokens?start=0&limit=100&sortBy=vol24hxrp&sortType=desc&filter=')
response = Net::HTTP.get(uri)
tokens = JSON.parse(response)`;
        case 'python':
          return `import requests

response = requests.get('https://api.xrpl.to/api/tokens?start=0&limit=100&sortBy=vol24hxrp&sortType=desc&filter=')
tokens = response.json()`;
        case 'javascript':
          return `const axios = require('axios');

const res = await axios.get('https://api.xrpl.to/api/tokens?start=0&limit=100&sortBy=vol24hxrp&sortType=desc&filter=');

const tokens = res.data;`;
        case 'php':
          return `<?php
$url = 'https://api.xrpl.to/api/tokens?start=0&limit=100&sortBy=vol24hxrp&sortType=desc&filter=';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    $tokens = json_decode($response, true);
    print_r($tokens);
} else {
    echo "Error: HTTP $httpCode\\n";
}
?>`;
        default:
          return '';
      }

    case 'get-a-specific-token-info':
      switch (language) {
        case 'shell':
          return `# Using issuer_currencyCode (recommended)
curl -sS "https://api.xrpl.to/api/token/rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq_USD"

# Alternatively, you can use a slug or md5 value
slug="your_slug_here"
curl -sS "https://api.xrpl.to/api/token/$slug?desc=no"`;
        case 'javascript':
          return `const axios = require('axios');

async function getTokenInfo(issuer, currency) {
  try {
    const response = await axios.get(\`https://api.xrpl.to/api/token/\${issuer}_\${currency}\`);
    return response.data;
  } catch (error) {
    console.error('Error fetching token info:', error);
    return null;
  }
}

// Example usage
getTokenInfo('rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq', 'USD')
  .then(tokenInfo => console.log(tokenInfo))
  .catch(error => console.error(error));`;
        case 'python':
          return `import requests

def get_token_info(issuer, currency):
    try:
        response = requests.get(f"https://api.xrpl.to/api/token/{issuer}_{currency}")
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error fetching token info: {e}")
        return None

# Example usage
issuer = "rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq"
currency = "USD"
token_info = get_token_info(issuer, currency)
if token_info:
    print(token_info)`;
        case 'ruby':
          return `require 'net/http'
require 'json'

def get_token_info(issuer, currency)
  uri = URI("https://api.xrpl.to/api/token/#{issuer}_#{currency}")
  response = Net::HTTP.get(uri)
  JSON.parse(response)
rescue => e
  puts "Error fetching token info: #{e.message}"
  nil
end

# Example usage
issuer = "rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq"
currency = "USD"
token_info = get_token_info(issuer, currency)
puts token_info if token_info`;
        case 'php':
          return `<?php
function getTokenInfo($issuer, $currency) {
    $url = "https://api.xrpl.to/api/token/{$issuer}_{$currency}";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        return json_decode($response, true);
    } else {
        echo "Error fetching token info: HTTP $httpCode\\n";
        return null;
    }
}

// Example usage
$issuer = "rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq";
$currency = "USD";
$tokenInfo = getTokenInfo($issuer, $currency);
if ($tokenInfo) {
    print_r($tokenInfo);
}
?>`;
        default:
          return '';
      }

    case 'get-sparkline-of-a-token':
      switch (language) {
        case 'shell':
          return `curl -sS "https://api.xrpl.to/api/sparkline/0413ca7cfc258dfaf698c02fe304e607"`;
        case 'javascript':
          return `const axios = require('axios');

async function getTokenSparkline(tokenId) {
  try {
    const response = await axios.get(\`https://api.xrpl.to/api/sparkline/\${tokenId}\`);
    return response.data;
  } catch (error) {
    console.error('Error fetching token sparkline:', error);
    return null;
  }
}

// Example usage
const tokenId = '0413ca7cfc258dfaf698c02fe304e607';
getTokenSparkline(tokenId)
  .then(sparklineData => console.log(sparklineData))
  .catch(error => console.error(error));`;
        case 'python':
          return `import requests

def get_token_sparkline(token_id):
    try:
        response = requests.get(f"https://api.xrpl.to/api/sparkline/{token_id}")
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error fetching token sparkline: {e}")
        return None

# Example usage
token_id = "0413ca7cfc258dfaf698c02fe304e607"
sparkline_data = get_token_sparkline(token_id)
if sparkline_data:
    print(sparkline_data)`;
        case 'ruby':
          return `require 'net/http'
require 'json'

def get_token_sparkline(token_id)
  uri = URI("https://api.xrpl.to/api/sparkline/#{token_id}")
  response = Net::HTTP.get(uri)
  JSON.parse(response)
rescue => e
  puts "Error fetching token sparkline: #{e.message}"
  nil
end

# Example usage
token_id = "0413ca7cfc258dfaf698c02fe304e607"
sparkline_data = get_token_sparkline(token_id)
puts sparkline_data if sparkline_data`;
        case 'php':
          return `<?php
function getTokenSparkline($tokenId) {
    $url = "https://api.xrpl.to/api/sparkline/{$tokenId}";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        return json_decode($response, true);
    } else {
        echo "Error fetching token sparkline: HTTP $httpCode\\n";
        return null;
    }
}

// Example usage
$tokenId = "0413ca7cfc258dfaf698c02fe304e607";
$sparklineData = getTokenSparkline($tokenId);
if ($sparklineData) {
    print_r($sparklineData);
}
?>`;
        default:
          return '';
      }

    case 'get-graph-data-of-a-token':
      switch (language) {
        case 'shell':
          return `curl -sS "https://api.xrpl.to/api/graph/c9ac9a6c44763c1bd9ccc6e47572fd26?range=1D"`;
        case 'javascript':
          return `const axios = require('axios');

async function getGraphData(tokenId, range = '1D') {
  try {
    const response = await axios.get(\`https://api.xrpl.to/api/graph/\${tokenId}?range=\${range}\`);
    return response.data;
  } catch (error) {
    console.error('Error fetching graph data:', error);
    return null;
  }
}

// Example usage
const tokenId = 'c9ac9a6c44763c1bd9ccc6e47572fd26';
getGraphData(tokenId, '7D')
  .then(graphData => {
    console.log(\`Retrieved \${graphData.length} data points\`);
    console.log(graphData.history);
  })
  .catch(error => console.error(error));`;
        case 'python':
          return `import requests

def get_graph_data(token_id, range='1D'):
    try:
        response = requests.get(f"https://api.xrpl.to/api/graph/{token_id}?range={range}")
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error fetching graph data: {e}")
        return None

# Example usage
token_id = "c9ac9a6c44763c1bd9ccc6e47572fd26"
graph_data = get_graph_data(token_id, '7D')
if graph_data:
    print(f"Retrieved {graph_data['length']} data points")
    print(graph_data['history'])`;
        case 'ruby':
          return `require 'net/http'
require 'json'

def get_graph_data(token_id, range='1D')
  uri = URI("https://api.xrpl.to/api/graph/#{token_id}?range=#{range}")
  response = Net::HTTP.get(uri)
  JSON.parse(response)
rescue => e
  puts "Error fetching graph data: #{e.message}"
  nil
end

# Example usage
token_id = "c9ac9a6c44763c1bd9ccc6e47572fd26"
graph_data = get_graph_data(token_id, '7D')
if graph_data
  puts "Retrieved #{graph_data['length']} data points"
  puts graph_data['history']
end`;
        case 'php':
          return `<?php
function getGraphData($tokenId, $range = '1D') {
    $url = "https://api.xrpl.to/api/graph/{$tokenId}?range={$range}";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        return json_decode($response, true);
    } else {
        echo "Error fetching graph data: HTTP $httpCode\\n";
        return null;
    }
}

// Example usage
$tokenId = "c9ac9a6c44763c1bd9ccc6e47572fd26";
$graphData = getGraphData($tokenId, '7D');
if ($graphData) {
    echo "Retrieved {$graphData['length']} data points\\n";
    print_r($graphData['history']);
}
?>`;
        default:
          return '';
      }

    case 'get-rich-list-of-a-token':
      switch (language) {
        case 'shell':
          return `curl -sS "https://api.xrpl.to/api/richlist/0413ca7cfc258dfaf698c02fe304e607?start=0&limit=20"`;
        case 'javascript':
          return `const axios = require('axios');

async function getRichList(tokenId, start = 0, limit = 20) {
  try {
    const response = await axios.get(\`https://api.xrpl.to/api/richlist/\${tokenId}?start=\${start}&limit=\${limit}\`);
    return response.data;
  } catch (error) {
    console.error('Error fetching rich list:', error);
    return null;
  }
}

// Example usage
const tokenId = '0413ca7cfc258dfaf698c02fe304e607';
getRichList(tokenId)
  .then(richList => console.log(richList))
  .catch(error => console.error(error));`;
        case 'python':
          return `import requests

def get_rich_list(token_id, start=0, limit=20):
    try:
        response = requests.get(f"https://api.xrpl.to/api/richlist/{token_id}?start={start}&limit={limit}")
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error fetching rich list: {e}")
        return None

# Example usage
token_id = "0413ca7cfc258dfaf698c02fe304e607"
rich_list = get_rich_list(token_id)
if rich_list:
    print(rich_list)`;
        case 'ruby':
          return `require 'net/http'
require 'json'

def get_rich_list(token_id, start=0, limit=20)
  uri = URI("https://api.xrpl.to/api/richlist/#{token_id}?start=#{start}&limit=#{limit}")
  response = Net::HTTP.get(uri)
  JSON.parse(response)
rescue => e
  puts "Error fetching rich list: #{e.message}"
  nil
end

# Example usage
token_id = "0413ca7cfc258dfaf698c02fe304e607"
rich_list = get_rich_list(token_id)
puts rich_list if rich_list`;
        case 'php':
          return `<?php
function getRichList($tokenId, $start = 0, $limit = 20) {
    $url = "https://api.xrpl.to/api/richlist/{$tokenId}?start={$start}&limit={$limit}";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        return json_decode($response, true);
    } else {
        echo "Error fetching rich list: HTTP $httpCode\\n";
        return null;
    }
}

// Example usage
$tokenId = "0413ca7cfc258dfaf698c02fe304e607";
$richList = getRichList($tokenId);
if ($richList) {
    print_r($richList);
}
?>`;
        default:
          return '';
      }

      case 'get-exchange-history-of-a-token':
      switch (language) {
        case 'shell':
          return `curl -sS "https://api.xrpl.to/api/history?md5=0413ca7cfc258dfaf698c02fe304e607&page=0&limit=10"`;
        case 'javascript':
          return `const axios = require('axios');

async function getExchangeHistory(md5, page = 0, limit = 10) {
  try {
    const response = await axios.get(\`https://api.xrpl.to/api/history?md5=\${md5}&page=\${page}&limit=\${limit}\`);
    return response.data;
  } catch (error) {
    console.error('Error fetching exchange history:', error);
    return null;
  }
}

// Example usage
const md5 = '0413ca7cfc258dfaf698c02fe304e607';
getExchangeHistory(md5)
  .then(history => console.log(history))
  .catch(error => console.error(error));`;
        case 'python':
          return `import requests

def get_exchange_history(md5, page=0, limit=10):
    try:
        response = requests.get(f"https://api.xrpl.to/api/history?md5={md5}&page={page}&limit={limit}")
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error fetching exchange history: {e}")
        return None

# Example usage
md5 = "0413ca7cfc258dfaf698c02fe304e607"
history = get_exchange_history(md5)
if history:
    print(history)`;
        case 'ruby':
          return `require 'net/http'
require 'json'

def get_exchange_history(md5, page=0, limit=10)
  uri = URI("https://api.xrpl.to/api/history?md5=#{md5}&page=#{page}&limit=#{limit}")
  response = Net::HTTP.get(uri)
  JSON.parse(response)
rescue => e
  puts "Error fetching exchange history: #{e.message}"
  nil
end

# Example usage
md5 = "0413ca7cfc258dfaf698c02fe304e607"
history = get_exchange_history(md5)
puts history if history`;
        case 'php':
          return `<?php
function getExchangeHistory($md5, $page = 0, $limit = 10) {
    $url = "https://api.xrpl.to/api/history?md5={$md5}&page={$page}&limit={$limit}";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        return json_decode($response, true);
    } else {
        echo "Error fetching exchange history: HTTP $httpCode\\n";
        return null;
    }
}

// Example usage
$md5 = "0413ca7cfc258dfaf698c02fe304e607";
$history = getExchangeHistory($md5);
if ($history) {
    print_r($history);
}
?>`;
        default:
          return '';
      }

    case 'get-the-current-status':
      switch (language) {
        case 'shell':
          return `curl -sS "https://api.xrpl.to/api/status"`;
        case 'javascript':
          return `const axios = require('axios');

async function getCurrentStatus() {
  try {
    const response = await axios.get('https://api.xrpl.to/api/status');
    return response.data;
  } catch (error) {
    console.error('Error fetching current status:', error);
    return null;
  }
}

// Example usage
getCurrentStatus()
  .then(status => console.log(status))
  .catch(error => console.error(error));`;
        case 'python':
          return `import requests

def get_current_status():
    try:
        response = requests.get("https://api.xrpl.to/api/status")
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error fetching current status: {e}")
        return None

# Example usage
status = get_current_status()
if status:
    print(status)`;
        case 'ruby':
          return `require 'net/http'
require 'json'

def get_current_status
  uri = URI("https://api.xrpl.to/api/status")
  response = Net::HTTP.get(uri)
  JSON.parse(response)
rescue => e
  puts "Error fetching current status: #{e.message}"
  nil
end

# Example usage
status = get_current_status
puts status if status`;
        case 'php':
          return `<?php
function getCurrentStatus() {
    $url = "https://api.xrpl.to/api/status";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        return json_decode($response, true);
    } else {
        echo "Error fetching current status: HTTP $httpCode\\n";
        return null;
    }
}

// Example usage
$status = getCurrentStatus();
if ($status) {
    print_r($status);
}
?>`;
        default:
          return '';
      }

    case 'get-account-offers':
      switch (language) {
        case 'shell':
          return `curl -sS "https://api.xrpl.to/api/account/offers/rapido5rxPmP4YkMZZEeXSHqWefxHEkqv6"`;
        case 'javascript':
          return `const axios = require('axios');

async function getAccountOffers(account) {
  try {
    const response = await axios.get(\`https://api.xrpl.to/api/account/offers/\${account}\`);
    return response.data;
  } catch (error) {
    console.error('Error fetching account offers:', error);
    return null;
  }
}

// Example usage
const account = 'rapido5rxPmP4YkMZZEeXSHqWefxHEkqv6';
getAccountOffers(account)
  .then(offers => console.log(offers))
  .catch(error => console.error(error));`;
        case 'python':
          return `import requests

def get_account_offers(account):
    try:
        response = requests.get(f"https://api.xrpl.to/api/account/offers/{account}")
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error fetching account offers: {e}")
        return None

# Example usage
account = "rapido5rxPmP4YkMZZEeXSHqWefxHEkqv6"
offers = get_account_offers(account)
if offers:
    print(offers)`;
        case 'ruby':
          return `require 'net/http'
require 'json'

def get_account_offers(account)
  uri = URI("https://api.xrpl.to/api/account/offers/#{account}")
  response = Net::HTTP.get(uri)
  JSON.parse(response)
rescue => e
  puts "Error fetching account offers: #{e.message}"
  nil
end

# Example usage
account = "rapido5rxPmP4YkMZZEeXSHqWefxHEkqv6"
offers = get_account_offers(account)
puts offers if offers`;
        case 'php':
          return `<?php
function getAccountOffers($account) {
    $url = "https://api.xrpl.to/api/account/offers/{$account}";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        return json_decode($response, true);
    } else {
        echo "Error fetching account offers: HTTP $httpCode\\n";
        return null;
    }
}

// Example usage
$account = "rapido5rxPmP4YkMZZEeXSHqWefxHEkqv6";
$offers = getAccountOffers($account);
if ($offers) {
    print_r($offers);
}
?>`;
        default:
          return '';
      }

    case 'get-md5-value-of-the-token':
      switch (language) {
        case 'javascript':
          return `const CryptoJS = require('crypto-js');

function getMD5Value(issuer, currency) {
  const combinedString = \`\${issuer}_\${currency}\`;
  return CryptoJS.MD5(combinedString).toString();
}

// Example usage
const issuer = 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq';
const currency = 'USD';
const md5Value = getMD5Value(issuer, currency);
console.log('MD5 value:', md5Value);

// Use this MD5 value in your API requests
// For example:
// fetch(\`https://api.xrpl.to/api/token/\${md5Value}\`)
//   .then(response => response.json())
//   .then(data => console.log(data))
//   .catch(error => console.error('Error:', error));`;

        case 'python':
          return `import hashlib

def get_md5_value(issuer, currency):
    combined_string = f"{issuer}_{currency}"
    return hashlib.md5(combined_string.encode()).hexdigest()

# Example usage
issuer = "rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq"
currency = "USD"
md5_value = get_md5_value(issuer, currency)
print("MD5 value:", md5_value)

# Use this MD5 value in your API requests
# For example:
# import requests
# response = requests.get(f"https://api.xrpl.to/api/token/{md5_value}")
# data = response.json()
# print(data)`;

        case 'ruby':
          return `require 'digest'

def get_md5_value(issuer, currency)
  combined_string = "#{issuer}_#{currency}"
  Digest::MD5.hexdigest(combined_string)
end

# Example usage
issuer = "rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq"
currency = "USD"
md5_value = get_md5_value(issuer, currency)
puts "MD5 value: #{md5_value}"

# Use this MD5 value in your API requests
# For example:
# require 'net/http'
# require 'json'
# uri = URI("https://api.xrpl.to/api/token/#{md5_value}")
# response = Net::HTTP.get(uri)
# data = JSON.parse(response)
# puts data`;

        case 'shell':
          return `# Using OpenSSL to generate MD5 hash
issuer="rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq"
currency="USD"
md5_value=$(echo -n "${issuer}_${currency}" | openssl dgst -md5 | awk '{print $2}')
echo "MD5 value: $md5_value"

# Use this MD5 value in your API requests
# For example:
# curl -sS "https://api.xrpl.to/api/token/$md5_value"`;
        case 'php':
          return `<?php
function getMD5Value($issuer, $currency) {
    $combinedString = $issuer . '_' . $currency;
    return md5($combinedString);
}

// Example usage
$issuer = "rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq";
$currency = "USD";
$md5Value = getMD5Value($issuer, $currency);
echo "MD5 value: " . $md5Value . "\\n";

// Use this MD5 value in your API requests
// For example:
$url = "https://api.xrpl.to/api/token/" . $md5Value;
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$data = json_decode($response, true);
curl_close($ch);
print_r($data);
?>`;
        default:
          return '';
      }

    default:
      return `// Example code for ${section} in ${language} coming soon...`;
  }
};

const MotionListItem = motion(ListItem);

const ApiDocs = () => {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('introduction');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [currentSection, setCurrentSection] = useState('get-all-tokens');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleCodeLanguageChange = (event, newValue) => {
    setCodeLanguage(newValue);
  };

  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = sections
        .map((section) => document.getElementById(section.id))
        .filter(Boolean);

      let currentSection = null;
      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const element = sectionElements[i];
        const rect = element.getBoundingClientRect();
        if (rect.top <= 100) {
          currentSection = element;
          break;
        }
      }

      if (currentSection) {
        setActiveSection(currentSection.id);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (searchTerm.length > 2) {
      const results = sections.filter((section) =>
        section.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchResultClick = (sectionId) => {
    setSearchTerm('');
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSectionClick = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const appBarHeight = 64;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - appBarHeight - 16;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleOpenModal = async () => {
    setIsModalOpen(true);
    setIsLoading(true);
    try {
      let response;
      switch (currentSection) {
        case 'get-all-tokens':
          response = await axios.get(
            'https://api.xrpl.to/api/tokens?start=0&limit=20&sortBy=vol24hxrp&sortType=desc&filter=&showNew=false&showSlug=false&showDate=false'
          );
          break;
        case 'get-a-specific-token-info':
          response = await axios.get(
            'https://api.xrpl.to/api/token/rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq_USD'
          );
          break;
        case 'get-sparkline-of-a-token':
          response = await axios.get(
            'https://api.xrpl.to/api/sparkline/0413ca7cfc258dfaf698c02fe304e607'
          );
          break;
        case 'get-rich-list-of-a-token':
          response = await axios.get(
            'https://api.xrpl.to/api/richlist/0413ca7cfc258dfaf698c02fe304e607?start=0&limit=20'
          );
          break;
        case 'get-exchange-history-of-a-token':
          response = await axios.get(
            'https://api.xrpl.to/api/history?md5=0413ca7cfc258dfaf698c02fe304e607&page=0&limit=10'
          );
          break;
        case 'get-the-current-status':
          response = await axios.get('https://api.xrpl.to/api/status');
          break;
        case 'get-account-offers':
          response = await axios.get(
            'https://api.xrpl.to/api/account/offers/rapido5rxPmP4YkMZZEeXSHqWefxHEkqv6'
          );
          break;
        default:
          throw new Error('Invalid section');
      }
      setApiResponse(response.data);
    } catch (error) {
      console.error('Error fetching API data:', error);
      setApiResponse({ error: 'Failed to fetch data' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setApiResponse(null);
  };

  const handleCopyResponse = () => {
    navigator.clipboard
      .writeText(JSON.stringify(apiResponse, null, 2))
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch((err) => console.error('Failed to copy text: ', err));
  };

  const handleSectionChange = (section) => {
    setCurrentSection(section);
    const sectionElement = document.getElementById(section);
    if (sectionElement) {
      const appBarHeight = 64;
      const elementPosition = sectionElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - appBarHeight - 16;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

        return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Head>
          <title>XRPL.to API Documentation</title>
          <meta name="description" content="API documentation for XRPL.to" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>

        <AppBar position="sticky">
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={toggleSidebar}
                sx={{ mr: 2, display: { sm: 'none' } }}
              >
                <MenuIcon />
              </IconButton>
              <Logo style={{ height: 28, marginRight: 2 }} />
              <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
                API Docs
              </Typography>
            </Box>
            <Box
              sx={{
                width: '30%',
                height: 4,
                background: 'linear-gradient(90deg, transparent 0%, #25A768 100%)'
              }}
            />
          </Toolbar>
        </AppBar>

        <Box sx={{ display: 'flex', flexGrow: 1, flexDirection: { xs: 'column', md: 'row' } }}>
          <Box
            component="nav"
            sx={{
              width: { sm: 280 },
              flexShrink: 0,
              display: { xs: isSidebarOpen ? 'block' : 'none', sm: 'block' },
              position: { xs: 'fixed', sm: 'sticky' },
              top: 0,
              left: 0,
              height: '100vh',
              overflowY: 'auto',
              zIndex: 1200,
                background: `linear-gradient(135deg, ${alpha(
                theme.palette.background.paper,
                0.95
              )} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
              backdropFilter: 'blur(20px)',
              borderRight: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.12)}`,
              p: 3,
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                right: 0,
                width: '2px',
                height: '100%',
                background: `linear-gradient(180deg, ${alpha(
                  theme.palette.primary.main,
                  0.2
                )} 0%, transparent 50%, ${alpha(theme.palette.primary.main, 0.2)} 100%)`
              }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2 }}>
              <IconButton onClick={toggleSidebar} sx={{ display: { sm: 'none' } }}>
                <CloseIcon />
              </IconButton>
            </Box>

            <TextField
              fullWidth
              size="small"
              variant="outlined"
              placeholder="Search documentation..."
              value={searchTerm}
              onChange={handleSearch}
              sx={{ mb: 2 }}
            />

            {searchResults.length > 0 && (
              <Paper
                elevation={1}
                sx={{
                  mb: 2,
                  maxHeight: 400,
                  overflow: 'auto',
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.background.paper,
                    0.9
                  )} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                  borderRadius: '12px',
                  boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}`
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    p: 2,
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.primary.main,
                      0.08
                    )} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                    borderRadius: '12px 12px 0 0',
                    borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                  }}
                >
                  Search Results
                </Typography>
                <List>
                  {searchResults.map((result) => (
                    <ListItem
                      key={result.id}
                      button
                      onClick={() => handleSearchResultClick(result.id)}
                    >
                      <ListItemText primary={result.title} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}

            <List>
              {sections.map((section) => (
                <MotionListItem
                  key={section.id}
                  button
                  selected={activeSection === section.id}
                  onClick={() => handleSectionClick(section.id)}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  sx={{
                    borderRadius: '12px',
                    mb: 1,
                    p: 1.5,
                    background:
                      activeSection === section.id
                        ? `linear-gradient(135deg, ${alpha(
                            theme.palette.primary.main,
                            0.15
                          )} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`
                        : 'transparent',
                    border:
                      activeSection === section.id
                        ? `1px solid ${alpha(theme.palette.primary.main, 0.25)}`
                        : `1px solid transparent`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&.Mui-selected': {
                      backgroundColor: 'transparent',
                      color: theme.palette.primary.main,
                      fontWeight: 600,
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: '3px',
                        background: `linear-gradient(180deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`,
                        borderRadius: '0 2px 2px 0'
                      }
                    },
                    '&:hover': {
                      background: `linear-gradient(135deg, ${alpha(
                        theme.palette.primary.main,
                        0.08
                      )} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                      boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.08)}`,
                      '& .MuiListItemText-primary': {
                        color: theme.palette.primary.main
                      }
                    },
                    '& .MuiListItemText-primary': {
                      fontSize: '0.9rem',
                      fontWeight: activeSection === section.id ? 600 : 500,
                      color:
                        activeSection === section.id
                          ? theme.palette.primary.main
                          : theme.palette.text.primary,
                      transition: 'color 0.2s ease'
                    }
                  }}
                >
                  <ListItemText primary={section.title} />
                </MotionListItem>
              ))}
            </List>
          </Box>

          <Box
            sx={{
              flexGrow: 1,
              p: { xs: 2, sm: 4 },
              width: { xs: '100%', md: '50%' },
              overflowY: 'auto',
              borderRight: {
                xs: 'none',
                md: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
              },
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.background.default,
                0.8
              )} 0%, ${alpha(theme.palette.background.paper, 0.1)} 100%)`,
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                right: { xs: 'auto', md: 0 },
                width: { xs: '100%', md: '2px' },
                height: { xs: '2px', md: '100%' },
                background: `linear-gradient(${
                  theme.breakpoints.down('md') ? '90deg' : '180deg'
                }, ${alpha(theme.palette.primary.main, 0.2)} 0%, transparent 50%, ${alpha(
                  theme.palette.primary.main,
                  0.2
                )} 100%)`
              }
            }}
          >
            <DocumentationContent activeSection={activeSection} searchTerm={searchTerm} />
          </Box>

          <Divider
            sx={{
              display: { xs: 'block', md: 'none' },
              my: 2,
              borderColor: alpha(theme.palette.primary.main, 0.1)
            }}
          />

          <Box
            sx={{
              flexGrow: 1,
              p: 2,
              background: `linear-gradient(135deg, ${alpha('#2d2d2d', 0.95)} 0%, ${alpha(
                '#1a1a1a',
                0.9
              )} 100%)`,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              borderRadius: { xs: '12px', md: '0' },
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              height: { xs: 'auto', md: 'calc(100vh - 64px)' },
              width: { xs: '100%', md: '50%' },
              position: { md: 'sticky' },
              top: { md: 64 },
              alignSelf: { md: 'flex-start' },
              boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.2)}`,
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main}, ${theme.palette.info.main})`,
                borderRadius: '12px 12px 0 0'
              }
            }}
          >
            <Typography variant="h6" gutterBottom>
              Code Examples
            </Typography>
            <TabContext value={currentSection}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <TabList
                  onChange={(event, newValue) => handleSectionChange(newValue)}
                  aria-label="code section tabs"
                  variant="scrollable"
                  scrollButtons="auto"
                  allowScrollButtonsMobile
                  sx={{
                    maxWidth: '100%',
                    '& .MuiTab-root': {
                      minHeight: '48px',
                      fontSize: '0.8rem',
                      textTransform: 'none'
                    }
                  }}
                >
                  <Tab label="Get All Tokens" value="get-all-tokens" />
                  <Tab label="Get Specific Token" value="get-a-specific-token-info" />
                  <Tab label="Get Sparkline" value="get-sparkline-of-a-token" />
                  <Tab label="Get Graph Data" value="get-graph-data-of-a-token" />
                  <Tab label="Get MD5 Value" value="get-md5-value-of-the-token" />
                  <Tab label="Get Rich List" value="get-rich-list-of-a-token" />
                  <Tab label="Get Exchange History" value="get-exchange-history-of-a-token" />
                  <Tab label="Get Current Status" value="get-the-current-status" />
                  <Tab label="Get Account Offers" value="get-account-offers" />
                </TabList>
              </Box>
              <TabPanel
                value={currentSection}
                sx={{
                  p: 0,
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'auto'
                }}
              >
                <Tabs
                  value={codeLanguage}
                  onChange={handleCodeLanguageChange}
                  aria-label="code language tabs"
                  variant="scrollable"
                  scrollButtons="auto"
                  allowScrollButtonsMobile
                  sx={{
                    mb: 2,
                    '& .MuiTab-root': {
                      minHeight: '36px',
                      fontSize: '0.8rem',
                      textTransform: 'none'
                    }
                  }}
                >
                  <Tab label="JavaScript" value="javascript" />
                  <Tab label="Python" value="python" />
                  <Tab label="PHP" value="php" />
                  <Tab label="Shell" value="shell" />
                  <Tab label="Ruby" value="ruby" />
                </Tabs>
                <Box sx={{ flexGrow: 1, overflow: 'auto', maxHeight: { xs: '300px', md: 'none' } }}>
                  <CodeBlock language={codeLanguage}>
                    {getCodeExample(codeLanguage, currentSection)}
                  </CodeBlock>
                </Box>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleOpenModal}
                  sx={{ mt: 2, alignSelf: 'flex-start' }}
                >
                  Try it out
                </Button>
              </TabPanel>
            </TabContext>
          </Box>
        </Box>

        <Modal
          open={isModalOpen}
          onClose={handleCloseModal}
          aria-labelledby="api-response-modal"
          aria-describedby="api-response-description"
        >
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '90%', sm: '80%' },
              maxHeight: '80%',
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.background.paper,
                0.95
              )} 0%, ${alpha(theme.palette.background.paper, 0.85)} 100%)`,
              backdropFilter: 'blur(20px)',
              border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              borderRadius: '16px',
              boxShadow: `0 24px 64px ${alpha(theme.palette.common.black, 0.2)}, 0 8px 32px ${alpha(
                theme.palette.primary.main,
                0.1
              )}`,
              p: { xs: 2, sm: 4 },
              overflowY: 'auto',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main}, ${theme.palette.info.main})`,
                borderRadius: '16px 16px 0 0'
              }
            }}
          >
            <Typography
              id="api-response-modal"
              variant="h6"
              component="h2"
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              API Response
              {!isLoading && apiResponse && (
                <Tooltip title={copySuccess ? 'Copied!' : 'Copy to clipboard'}>
                  <IconButton onClick={handleCopyResponse} size="small">
                    <ContentCopyIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Typography>
            {isLoading ? (
              <CircularProgress />
            ) : (
              <CodeBlock language="json">{JSON.stringify(apiResponse, null, 2)}</CodeBlock>
            )}
            <Button onClick={handleCloseModal}>Close</Button>
          </Box>
        </Modal>

        <Box
          component="footer"
          sx={{
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.background.paper,
              0.95
            )} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
            backdropFilter: 'blur(20px)',
            borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            color: theme.palette.text.primary,
            py: 3,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main}, ${theme.palette.info.main})`,
              opacity: 0.6
            }
          }}
        >
          <Container maxWidth="lg">
            <Typography variant="body2" align="center">
              &copy; {new Date().getFullYear()} XRPL.to. All rights reserved.
            </Typography>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default ApiDocs;
