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
  Avatar,
  Alert
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
import ImageIcon from '@mui/icons-material/Image';
import { AppContext } from 'src/AppContext';

const sections = [
  { id: 'introduction', title: 'Introduction' },
  { id: 'get-all-tokens', title: 'Get All Tokens' },
  { id: 'get-a-specific-token-info', title: 'Get a Specific Token Info' },
  { id: 'get-token-image', title: 'Get Token Image' },
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
          backgroundColor: '#1E2329',
          borderBottom: `1px solid ${alpha('#25A768', 0.2)}`
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#1E2329',
          border: `1px solid ${alpha('#25A768', 0.1)}`
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1E2329',
          border: `1px solid ${alpha('#25A768', 0.1)}`,
          borderRadius: '8px'
        }
      }
    }
  }
});

// Simple code block component
const CodeBlock = ({ children, language = 'javascript' }) => (
  <Paper
    elevation={1}
    sx={{
      my: 2,
      backgroundColor: '#2d2d2d',
      border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
      borderRadius: '8px',
      overflow: 'hidden'
    }}
  >
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 2,
        backgroundColor: alpha(theme.palette.primary.main, 0.08),
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
          fontSize: '0.75rem'
        }}
      />
      <IconButton
        size="small"
        onClick={() => navigator.clipboard.writeText(children)}
        sx={{
          color: theme.palette.primary.main,
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.1)
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
const DocumentationContent = ({ activeSection, searchTerm, handleOpenModal }) => {
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
                  { label: '16000+', desc: 'Tokens', color: 'primary' },
                  { label: '99.9%', desc: 'Uptime', color: 'success' },
                  { label: 'Real-time', desc: 'Data', color: 'info' },
                  { label: '5', desc: 'Languages', color: 'warning' }
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
                  Try It Now
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  Test this endpoint directly and see the live response structure:
                </Typography>

                <Button
                  variant="contained"
                  color="success"
                  onClick={() => handleOpenModal('get-all-tokens')}
                  sx={{
                    borderRadius: '8px',
                    textTransform: 'none',
                    px: 3,
                    py: 1.5,
                    fontWeight: 600,
                    mt: 2
                  }}
                >
                  Try API Call
                </Button>
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
                  HTTP Request Examples
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  Using different methods to retrieve token information:
                </Typography>
                <CodeBlock language="http">
                  GET
                  https://api.xrpl.to/api/token/rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz_534F4C4F00000000000000000000000000000000
                </CodeBlock>
                <Typography
                  variant="body2"
                  sx={{ mt: 1, mb: 1, color: theme.palette.text.secondary }}
                >
                  Using slug:
                </Typography>
                <CodeBlock language="http">
                  GET https://api.xrpl.to/api/token/sologenic?desc=yes
                </CodeBlock>
                <Typography
                  variant="body2"
                  sx={{ mt: 1, mb: 1, color: theme.palette.text.secondary }}
                >
                  Using MD5 hash:
                </Typography>
                <CodeBlock language="http">
                  GET https://api.xrpl.to/api/token/0413ca7cfc258dfaf698c02fe304e607
                </CodeBlock>
              </CardContent>
            </Card>

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
                  Request Parameters
                </Typography>
              </Box>
              <CardContent>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Parameter</TableCell>
                        <TableCell>Default</TableCell>
                        <TableCell>Description</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>issuer_currencyCode</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>
                          The issuer address followed by an underscore and the currency code. This
                          is the recommended method.
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
              </CardContent>
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
                  Try It Now
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  Test this endpoint directly and see the live response structure:
                </Typography>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => handleOpenModal('get-a-specific-token-info')}
                  sx={{
                    borderRadius: '8px',
                    textTransform: 'none',
                    px: 3,
                    py: 1.5,
                    fontWeight: 600
                  }}
                >
                  Try API Call
                </Button>
              </CardContent>
            </Card>

            {/* New section for comprehensive field explanations */}
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
                  Numeric Fields Explained
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 3, color: theme.palette.text.secondary }}>
                  Comprehensive explanation of all numeric fields in the token response:
                </Typography>

                <Typography variant="h6" sx={{ mb: 2, color: theme.palette.primary.main }}>
                  Price & Exchange Rate Fields
                </Typography>
                <TableContainer sx={{ mb: 3 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Field</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <code>exch</code>
                        </TableCell>
                        <TableCell>
                          XRP exchange rate per token - derived from TxDB price collection,
                          represents current market price in XRP
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>usd</code>
                        </TableCell>
                        <TableCell>
                          USD price value calculated from XRP exchange rate and XRP/USD conversion
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>time</code>
                        </TableCell>
                        <TableCell>
                          Unix timestamp (milliseconds) of last price update - updated whenever exch
                          field changes from transaction data
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>marketcap</code>
                        </TableCell>
                        <TableCell>
                          Market capitalization = supply × exch rate (only calculated for
                          isOMCF="yes" tokens, 0 otherwise)
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>maxMin24h</code>
                        </TableCell>
                        <TableCell>
                          Array [max, min] of highest and lowest USD prices in the last 24 hours
                          from PriceDB 1D collection
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                <Typography variant="h6" sx={{ mb: 2, color: theme.palette.primary.main }}>
                  Volume & Trading Fields
                </Typography>
                <TableContainer sx={{ mb: 3 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Field</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <code>vol24h</code>
                        </TableCell>
                        <TableCell>
                          24-hour raw trading volume in token units - sum of unique transaction
                          volumes from HistoryDB 1D collection
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>vol24htx</code>
                        </TableCell>
                        <TableCell>
                          24-hour transaction count - number of unique transactions (deduplicated by
                          ledger+hash) divided by 2
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>vol24hxrp</code>
                        </TableCell>
                        <TableCell>
                          24-hour XRP equivalent volume - calculated as vol24h × exch rate,
                          represents total XRP value traded
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>vol24hxrpAMM</code>
                        </TableCell>
                        <TableCell>
                          24-hour XRP volume through AMM pools only - vol24hAMM × exch rate for AMM
                          transactions
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>vol24hAMM</code>
                        </TableCell>
                        <TableCell>
                          24-hour AMM volume in token units - filtered from isAMM=true transactions
                          only
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>vol24htxAMM</code>
                        </TableCell>
                        <TableCell>
                          24-hour AMM transaction count - unique AMM transactions (isAMM=true)
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>vol24hx</code>
                        </TableCell>
                        <TableCell>
                          24-hour extended volume - from XRP trading pairs in volex24h collection,
                          token amount traded with XRP
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>vol24hxAMM</code>
                        </TableCell>
                        <TableCell>
                          24-hour extended AMM volume - AMM portion of vol24hx from trading pair
                          data
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                <Typography variant="h6" sx={{ mb: 2, color: theme.palette.primary.main }}>
                  Price Change Percentages
                </Typography>
                <TableContainer sx={{ mb: 3 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Field</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <code>pro5m</code>
                        </TableCell>
                        <TableCell>
                          5-minute price change percentage - calculated using getPriceChange()
                          against PriceDB 7D collection
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>pro1h</code>
                        </TableCell>
                        <TableCell>
                          1-hour price change percentage - compares current USD price with price
                          from 1 hour ago
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>pro24h</code>
                        </TableCell>
                        <TableCell>
                          24-hour price change percentage - compares current USD price with price
                          from 24 hours ago
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>pro7d</code>
                        </TableCell>
                        <TableCell>
                          7-day price change percentage - compares current USD price with price from
                          7 days ago
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>p5m</code>
                        </TableCell>
                        <TableCell>
                          5-minute price difference (absolute USD value) - Decimal.sub(newPrice,
                          oldPrice)
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>p1h</code>
                        </TableCell>
                        <TableCell>
                          1-hour price difference (absolute USD value) - absolute change over 1 hour
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>p24h</code>
                        </TableCell>
                        <TableCell>
                          24-hour price difference (absolute USD value) - absolute change over 24
                          hours
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>p7d</code>
                        </TableCell>
                        <TableCell>
                          7-day price difference (absolute USD value) - absolute change over 7 days
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                <Typography variant="h6" sx={{ mb: 2, color: theme.palette.primary.main }}>
                  Token Metrics & Supply
                </Typography>
                <TableContainer sx={{ mb: 3 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Field</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <code>amount</code>
                        </TableCell>
                        <TableCell>
                          Total circulating supply - for XRP: calculated from accounts collection
                          balance sum
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>supply</code>
                        </TableCell>
                        <TableCell>
                          Total token supply - for XRP: sum of all account balances divided by
                          1,000,000 (drops to XRP)
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>holders</code>
                        </TableCell>
                        <TableCell>
                          Current number of unique addresses with balance &gt; 0 - counted from
                          accounts collection
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>trustlines</code>
                        </TableCell>
                        <TableCell>
                          Number of trustlines - for XRP: total address count; for tokens: trust
                          relationships count
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>offers</code>
                        </TableCell>
                        <TableCell>
                          Active buy/sell offers on XRPL DEX - aggregated count from offers
                          collection by trading pair
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>holders24h</code>
                        </TableCell>
                        <TableCell>
                          24-hour change in holders count - current holders minus holders from
                          tokens24h collection
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>trustlines24h</code>
                        </TableCell>
                        <TableCell>
                          24-hour change in trustlines - current trustlines minus trustlines from
                          tokens24h collection
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>marketcap24h</code>
                        </TableCell>
                        <TableCell>
                          24-hour change in market cap - current marketcap minus marketcap from
                          tokens24h collection
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                <Typography variant="h6" sx={{ mb: 2, color: theme.palette.primary.main }}>
                  AMM & Liquidity Fields
                </Typography>
                <TableContainer sx={{ mb: 3 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Field</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <code>tvl</code>
                        </TableCell>
                        <TableCell>
                          Total Value Locked in XRP equivalent - calculated from AMM pool analysis
                          combining XRP + token pool values
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>AMM</code>
                        </TableCell>
                        <TableCell>
                          AMM account address for the liquidity pool - validated AMM account with
                          minimum 40 XRP liquidity requirement
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                <Typography variant="h6" sx={{ mb: 2, color: theme.palette.primary.main }}>
                  Ranking & Scoring Fields
                </Typography>
                <TableContainer sx={{ mb: 3 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Field</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <code>id</code>
                        </TableCell>
                        <TableCell>
                          Ranking position based on vol24hxrp descending sort order
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>dom</code>
                        </TableCell>
                        <TableCell>
                          Market dominance percentage - (token marketcap × 100) ÷ total market cap
                          of all qualified tokens
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>trendingScore</code>
                        </TableCell>
                        <TableCell>
                          Weighted trending score: volume(10%) + pro24h(10%) + marketcap24h(10%) +
                          trustlines24h(7.5%) + holders24h(7.5%) + trades(20%) + offers(15%) +
                          nginxScore(15%) + searchScore(5%)
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>assessmentScore</code>
                        </TableCell>
                        <TableCell>
                          Quality assessment score: vol24hxrp(20%) + marketcap(20%) +
                          trustlines(15%) + holders(15%) + vol24htx(15%) + offers(15%) - normalized
                          against global metrics
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>nginxScore</code>
                        </TableCell>
                        <TableCell>
                          Web traffic popularity score from nginx access logs analysis via
                          tokentrends.sh script
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>searchScore</code>
                        </TableCell>
                        <TableCell>
                          Search-related traffic score - search requests per unique IP from nginx
                          logs
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                <Typography variant="h6" sx={{ mb: 2, color: theme.palette.primary.main }}>
                  Timestamp Fields
                </Typography>
                <TableContainer sx={{ mb: 3 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Field</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <code>dateon</code>
                        </TableCell>
                        <TableCell>
                          Token creation/first discovery timestamp (Unix milliseconds) from initial
                          transaction
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>date</code>
                        </TableCell>
                        <TableCell>
                          Token registration date (ISO format string) - when token was first indexed
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>lastUpdated</code>
                        </TableCell>
                        <TableCell>
                          Last metadata update timestamp - when token information was last modified
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>updatedAt</code>
                        </TableCell>
                        <TableCell>
                          Last price/market data update timestamp - updated during metrics
                          calculations
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>trustlinesUpdatedAt</code>
                        </TableCell>
                        <TableCell>
                          Last trustlines count update timestamp from CalcXRPTokenInfo() function
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>lastModified</code>
                        </TableCell>
                        <TableCell>Last token record modification timestamp in database</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                <Typography variant="h6" sx={{ mb: 2, color: theme.palette.primary.main }}>
                  Global Metrics Fields (Available in H24 and global objects)
                </Typography>
                <TableContainer sx={{ mb: 3 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Field</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <code>gDexVolume</code>
                        </TableCell>
                        <TableCell>
                          Global DEX volume - sum of all tradedXRP24H across all qualified tokens
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>gMarketcap</code>
                        </TableCell>
                        <TableCell>
                          Global market capitalization - sum of all token market caps (excluding
                          XRP, scam, and defunct tokens)
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>gScamVolume</code>
                        </TableCell>
                        <TableCell>
                          Volume from tokens tagged as 'Scam' or 'Defunct' - excluded from main
                          market calculations
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>gNFTIOUVolume</code>
                        </TableCell>
                        <TableCell>
                          Volume from tokens tagged as 'NFT', 'IOU', or 'NFT IOU'
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>gStableVolume</code>
                        </TableCell>
                        <TableCell>Volume from tokens tagged as 'Stablecoin'</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>gMemeVolume</code>
                        </TableCell>
                        <TableCell>Volume from tokens tagged as 'Memes'</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>gXRPdominance</code>
                        </TableCell>
                        <TableCell>
                          XRP market dominance percentage - (XRP marketcap × 100) ÷ (total marketcap
                          + XRP marketcap)
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>transactions24H</code>
                        </TableCell>
                        <TableCell>
                          Total XRPL transactions in last 24 hours - calculated from HistoryDB 1D
                          collection
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>activeAddresses24H</code>
                        </TableCell>
                        <TableCell>
                          Unique addresses that had transactions in the last 24 hours - from TxDB
                          accounts24h collection
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>totalAddresses</code>
                        </TableCell>
                        <TableCell>
                          Total number of XRPL addresses - count from accounts collection
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>totalOffers</code>
                        </TableCell>
                        <TableCell>
                          Total active offers on XRPL DEX - count from offers collection
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <code>totalTrustLines</code>
                        </TableCell>
                        <TableCell>
                          Total trustlines on XRPL - count from trusts collection
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                <Alert severity="info" sx={{ mt: 3 }}>
                  <Typography variant="body2">
                    <strong>Important Notes:</strong>
                    <br />• All volume calculations use unique transaction deduplication (by ledger
                    + hash)
                    <br />• Only tokens with isOMCF="yes" are included in market cap and ranking
                    calculations
                    <br />• AMM volumes require minimum 40 XRP liquidity and proper account
                    validation
                    <br />• Price changes use fallback logic when historical data is insufficient
                    <br />• Global metrics exclude scam/defunct tokens to maintain data quality
                    <br />• All timestamps are in Unix milliseconds unless specified otherwise
                  </Typography>
                </Alert>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: '12px', mb: 3 }}>
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

      case 'get-token-image':
        return (
          <Box id="get-token-image">
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
                <ImageIcon sx={{ color: theme.palette.info.main, mr: 2, fontSize: 32 }} />
                <Typography variant="h2" sx={{ color: theme.palette.info.main, fontWeight: 600 }}>
                  Get Token Image
                </Typography>
              </Box>
              <Typography
                variant="body1"
                sx={{ lineHeight: 1.8, color: theme.palette.text.secondary }}
              >
                Retrieve the image associated with a specific token using its MD5 hash. Token images
                are hosted on the XRPL.to CDN and can be accessed directly for display in
                applications, websites, or other interfaces.
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
                <CodeBlock language="http">GET https://s1.xrpl.to/token/&lt;md5&gt;</CodeBlock>
                <Typography variant="body2" sx={{ mt: 2, color: theme.palette.text.secondary }}>
                  Example with specific token MD5:
                </Typography>
                <CodeBlock language="http">
                  GET https://s1.xrpl.to/token/0dd550278b74cb6690fdae351e8e0df3
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
              <CardContent>
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
                          Required
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
                        <TableCell>Yes</TableCell>
                        <TableCell>
                          MD5 hash of the token identifier (issuer_currency combination)
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
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
                  How to Get MD5 Hash
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  The MD5 hash is calculated from the token's issuer address and currency code:
                </Typography>
                <CodeBlock language="javascript">
                  {`// Example: Calculate MD5 for a token
const crypto = require('crypto');

const issuer = 'rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz';
const currency = 'SOLO';
const tokenString = \`\${issuer}_\${currency}\`;
const md5Hash = crypto.createHash('md5').update(tokenString).digest('hex');

console.log(md5Hash); // Output: 0dd550278b74cb6690fdae351e8e0df3`}
                </CodeBlock>
                <Typography variant="body2" sx={{ mt: 2, color: theme.palette.text.secondary }}>
                  You can also get the MD5 hash from the token info API response.
                </Typography>
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
                  Response Format
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  This endpoint returns the token image directly as a binary response. Common
                  formats include:
                </Typography>
                <Box sx={{ ml: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Content-Type:</strong> image/png, image/jpeg, image/webp, or
                    image/svg+xml
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Response:</strong> Binary image data
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Cache Headers:</strong> Includes cache-control headers for
                    optimization
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    • <strong>CORS Enabled:</strong> Can be accessed from web applications
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
                  Usage Examples
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  Here are common ways to use token images in your applications:
                </Typography>

                <Typography
                  variant="subtitle2"
                  sx={{ mb: 1, color: theme.palette.text.primary, fontWeight: 600 }}
                >
                  HTML Image Tag:
                </Typography>
                <CodeBlock language="html">
                  {`<img src="https://s1.xrpl.to/token/0dd550278b74cb6690fdae351e8e0df3" 
     alt="SOLO Token" 
     width="32" 
     height="32" />`}
                </CodeBlock>

                <Typography
                  variant="subtitle2"
                  sx={{ mb: 1, mt: 2, color: theme.palette.text.primary, fontWeight: 600 }}
                >
                  CSS Background Image:
                </Typography>
                <CodeBlock language="css">
                  {`.token-icon {
  background-image: url('https://s1.xrpl.to/token/0dd550278b74cb6690fdae351e8e0df3');
  background-size: cover;
  width: 32px;
  height: 32px;
}`}
                </CodeBlock>

                <Typography
                  variant="subtitle2"
                  sx={{ mb: 1, mt: 2, color: theme.palette.text.primary, fontWeight: 600 }}
                >
                  React Component:
                </Typography>
                <CodeBlock language="jsx">
                  {`function TokenIcon({ md5, alt, size = 32 }) {
  return (
    <img 
      src={\`https://s1.xrpl.to/token/\${md5}\`}
      alt={alt}
      width={size}
      height={size}
      onError={(e) => {
        e.target.src = '/fallback-token-icon.png';
      }}
    />
  );
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
                  Error Handling
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  When a token image is not found or unavailable, the endpoint will return:
                </Typography>
                <Box sx={{ ml: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>404 Not Found:</strong> When the MD5 hash doesn't correspond to any
                    token image
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Image Fallback:</strong> Some applications may show a default token
                    icon
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    • <strong>CORS Errors:</strong> Ensure your application handles cross-origin
                    requests properly
                  </Typography>
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
                  Try It Now
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  Test this endpoint directly and see the live response structure:
                </Typography>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => handleOpenModal('get-sparkline-of-a-token')}
                  sx={{
                    borderRadius: '8px',
                    textTransform: 'none',
                    px: 3,
                    py: 1.5,
                    fontWeight: 600
                  }}
                >
                  Try API Call
                </Button>
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
                  Try It Now
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  Test this endpoint directly and see the live response structure:
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
                  Try It Now
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  Test this endpoint directly and see the live response structure:
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleOpenModal('get-exchange-history-of-a-token')}
                  sx={{
                    borderRadius: '8px',
                    textTransform: 'none',
                    px: 3,
                    py: 1.5,
                    fontWeight: 600
                  }}
                >
                  Try API Call
                </Button>
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
                  Try It Now
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  Test this endpoint directly and see the live response structure:
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleOpenModal('get-the-current-status')}
                  sx={{
                    borderRadius: '8px',
                    textTransform: 'none',
                    px: 3,
                    py: 1.5,
                    fontWeight: 600
                  }}
                >
                  Try API Call
                </Button>
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
                  Try It Now
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  Test this endpoint directly and see the live response structure:
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleOpenModal('get-graph-data-of-a-token')}
                  sx={{
                    borderRadius: '8px',
                    textTransform: 'none',
                    px: 3,
                    py: 1.5,
                    fontWeight: 600
                  }}
                >
                  Try API Call
                </Button>
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

    case 'get-token-image':
      switch (language) {
        case 'shell':
          return `curl -sS "https://s1.xrpl.to/token/0dd550278b74cb6690fdae351e8e0df3"`;
        case 'javascript':
          return `// Direct image URL usage
const tokenMd5 = '0dd550278b74cb6690fdae351e8e0df3';
const imageUrl = \`https://s1.xrpl.to/token/\${tokenMd5}\`;

// Use in HTML
const img = document.createElement('img');
img.src = imageUrl;
img.alt = 'Token Image';
img.width = 32;
img.height = 32;

// Add error handling
img.onerror = function() {
  this.src = '/fallback-token-icon.png';
};

document.body.appendChild(img);`;
        case 'python':
          return `import requests
from PIL import Image
from io import BytesIO

def get_token_image(token_md5):
    """
    Fetch token image and return as PIL Image object
    """
    try:
        url = f"https://s1.xrpl.to/token/{token_md5}"
        response = requests.get(url)
        response.raise_for_status()
        
        # Convert to PIL Image
        image = Image.open(BytesIO(response.content))
        return image
    except requests.RequestException as e:
        print(f"Error fetching token image: {e}")
        return None

# Example usage
token_md5 = "0dd550278b74cb6690fdae351e8e0df3"
token_image = get_token_image(token_md5)
if token_image:
    token_image.show()  # Display the image
    token_image.save("token_image.png")  # Save locally`;
        case 'ruby':
          return `require 'net/http'
require 'uri'

def get_token_image_url(token_md5)
  "https://s1.xrpl.to/token/#{token_md5}"
end

def download_token_image(token_md5, save_path)
  uri = URI(get_token_image_url(token_md5))
  
  Net::HTTP.start(uri.host, uri.port, use_ssl: true) do |http|
    response = http.get(uri.path)
    
    if response.code == '200'
      File.open(save_path, 'wb') do |file|
        file.write(response.body)
      end
      puts "Token image saved to #{save_path}"
    else
      puts "Error: HTTP #{response.code}"
    end
  end
rescue => e
  puts "Error downloading token image: #{e.message}"
end

# Example usage
token_md5 = "0dd550278b74cb6690fdae351e8e0df3"
download_token_image(token_md5, "token_image.png")`;
        case 'php':
          return `<?php
function getTokenImageUrl($tokenMd5) {
    return "https://s1.xrpl.to/token/{$tokenMd5}";
}

function downloadTokenImage($tokenMd5, $savePath) {
    $url = getTokenImageUrl($tokenMd5);
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $imageData = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200 && $imageData !== false) {
        file_put_contents($savePath, $imageData);
        echo "Token image saved to {$savePath}\\n";
        return true;
    } else {
        echo "Error fetching token image: HTTP {$httpCode}\\n";
        return false;
    }
}

// Example usage
$tokenMd5 = "0dd550278b74cb6690fdae351e8e0df3";
downloadTokenImage($tokenMd5, "token_image.png");

// Or just use the URL directly in HTML
echo '<img src="' . getTokenImageUrl($tokenMd5) . '" alt="Token Image" width="32" height="32">';
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

  const handleOpenModal = async (section = currentSection) => {
    setIsModalOpen(true);
    setIsLoading(true);
    try {
      let response;
      switch (section) {
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
        case 'get-token-image':
          // For token images, we'll show metadata instead of the binary image data
          setApiResponse({
            message: 'Token image endpoint returns binary image data',
            url: 'https://s1.xrpl.to/token/0dd550278b74cb6690fdae351e8e0df3',
            note: 'This endpoint returns the actual image file, not JSON data. Open the URL directly to view the image.',
            contentType: 'image/png, image/jpeg, image/webp, or image/svg+xml',
            example: {
              html: '<img src="https://s1.xrpl.to/token/0dd550278b74cb6690fdae351e8e0df3" alt="Token Image" width="32" height="32" />',
              css: "background-image: url('https://s1.xrpl.to/token/0dd550278b74cb6690fdae351e8e0df3');",
              react: 'src={`https://s1.xrpl.to/token/${md5}`}'
            }
          });
          setIsLoading(false);
          return;
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
        case 'get-graph-data-of-a-token':
          response = await axios.get(
            'https://api.xrpl.to/api/graph/c9ac9a6c44763c1bd9ccc6e47572fd26?range=1D'
          );
          break;
        default:
          throw new Error('Invalid section');
      }
      setApiResponse(response.data);
    } catch (error) {
      console.error('Error fetching API data:', error);
      setApiResponse({ error: 'Failed to fetch data', details: error.message });
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

        <AppBar position="sticky" sx={{ zIndex: 1300 }}>
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
              <Logo style={{ height: 40, marginRight: 8 }} />
              <Divider
                orientation="vertical"
                flexItem
                sx={{ mx: 2, backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
              />
              <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
                Developer
              </Typography>
            </Box>
            <TextField
              size="small"
              variant="outlined"
              placeholder="Search documentation..."
              value={searchTerm}
              onChange={handleSearch}
              sx={{
                width: { xs: 200, sm: 300 },
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)'
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.5)'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'white'
                  }
                },
                '& .MuiInputBase-input::placeholder': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  opacity: 1
                }
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
              top: { xs: 64, sm: 0 },
              left: 0,
              height: { xs: 'calc(100vh - 64px)', sm: '100vh' },
              overflowY: 'auto',
              zIndex: 1100,
              backgroundColor: theme.palette.background.paper,
              borderRight: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              p: 3
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
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                  borderRadius: '8px'
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    p: 2,
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                    borderRadius: '8px 8px 0 0',
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
              backgroundColor: theme.palette.background.default
            }}
          >
            <DocumentationContent
              activeSection={activeSection}
              searchTerm={searchTerm}
              handleOpenModal={handleOpenModal}
            />
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
              backgroundColor: '#1a1a1a',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
              borderRadius: { xs: '12px', md: '0' },
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              height: { xs: 'auto', md: 'calc(100vh - 64px)' },
              width: { xs: '100%', md: '50%' },
              position: { md: 'sticky' },
              top: { md: 64 },
              alignSelf: { md: 'flex-start' },
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
                pb: 2,
                borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.primary.main,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <CodeIcon />
                Code Examples
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={() => handleOpenModal(currentSection)}
                sx={{
                  borderRadius: '20px',
                  textTransform: 'none',
                  px: 2,
                  py: 0.5,
                  fontSize: '0.8rem',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.success.dark})`
                  }
                }}
              >
                Try Live
              </Button>
            </Box>

            {/* API Endpoint Tabs */}
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.secondary,
                  mb: 1,
                  display: 'block',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  letterSpacing: 1
                }}
              >
                API Endpoint
              </Typography>
              <TabContext value={currentSection}>
                <TabList
                  onChange={(event, newValue) => handleSectionChange(newValue)}
                  aria-label="api endpoint tabs"
                  variant="scrollable"
                  scrollButtons="auto"
                  allowScrollButtonsMobile
                  sx={{
                    minHeight: 'auto',
                    '& .MuiTabs-indicator': {
                      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`,
                      height: '2px',
                      borderRadius: '1px'
                    },
                    '& .MuiTab-root': {
                      minHeight: '36px',
                      fontSize: '0.75rem',
                      textTransform: 'none',
                      fontWeight: 500,
                      minWidth: 'auto',
                      px: 2,
                      py: 1,
                      color: theme.palette.text.secondary,
                      transition: 'all 0.2s ease',
                      '&.Mui-selected': {
                        color: theme.palette.primary.main,
                        fontWeight: 600
                      },
                      '&:hover': {
                        color: theme.palette.primary.light,
                        backgroundColor: alpha(theme.palette.primary.main, 0.05)
                      }
                    }
                  }}
                >
                  <Tab label="All Tokens" value="get-all-tokens" />
                  <Tab label="Token Info" value="get-a-specific-token-info" />
                  <Tab label="Token Image" value="get-token-image" />
                  <Tab label="Sparkline" value="get-sparkline-of-a-token" />
                  <Tab label="Graph Data" value="get-graph-data-of-a-token" />
                  <Tab label="MD5 Value" value="get-md5-value-of-the-token" />
                  <Tab label="Rich List" value="get-rich-list-of-a-token" />
                  <Tab label="History" value="get-exchange-history-of-a-token" />
                  <Tab label="Status" value="get-the-current-status" />
                  <Tab label="Offers" value="get-account-offers" />
                </TabList>
              </TabContext>
            </Box>

            {/* Language Tabs */}
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.secondary,
                  mb: 1,
                  display: 'block',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  letterSpacing: 1
                }}
              >
                Language
              </Typography>
              <Tabs
                value={codeLanguage}
                onChange={handleCodeLanguageChange}
                aria-label="programming language tabs"
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{
                  minHeight: 'auto',
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  borderRadius: '8px',
                  p: 0.5,
                  '& .MuiTabs-indicator': {
                    display: 'none'
                  },
                  '& .MuiTab-root': {
                    minHeight: '32px',
                    fontSize: '0.75rem',
                    textTransform: 'none',
                    fontWeight: 500,
                    minWidth: 'auto',
                    px: 2,
                    py: 0.5,
                    m: 0.25,
                    borderRadius: '6px',
                    color: theme.palette.text.secondary,
                    transition: 'all 0.2s ease',
                    '&.Mui-selected': {
                      color: 'white',
                      backgroundColor: theme.palette.primary.main,
                      fontWeight: 600,
                      boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`
                    },
                    '&:hover': {
                      color: theme.palette.primary.light,
                      backgroundColor: alpha(theme.palette.primary.main, 0.1)
                    }
                  }
                }}
              >
                <Tab label="JavaScript" value="javascript" />
                <Tab label="Python" value="python" />
                <Tab label="PHP" value="php" />
                <Tab label="Shell" value="shell" />
                <Tab label="Ruby" value="ruby" />
              </Tabs>
            </Box>

            {/* Code Block */}
            <Box
              sx={{
                flexGrow: 1,
                overflow: 'hidden',
                borderRadius: '8px',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                backgroundColor: '#0d1117'
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.5,
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`
                }}
              >
                <Chip
                  label={codeLanguage}
                  size="small"
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: '24px'
                  }}
                />
                <IconButton
                  size="small"
                  onClick={() =>
                    navigator.clipboard.writeText(getCodeExample(codeLanguage, currentSection))
                  }
                  sx={{
                    color: theme.palette.primary.main,
                    padding: '4px',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1)
                    }
                  }}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Box>
              <Box
                component="pre"
                sx={{
                  fontFamily: '"JetBrains Mono", "Roboto Mono", monospace',
                  fontSize: '0.8rem',
                  lineHeight: 1.5,
                  color: '#e6edf3',
                  margin: 0,
                  padding: '16px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  background: 'transparent',
                  overflow: 'auto',
                  height: { xs: '300px', md: 'calc(100vh - 400px)' },
                  '&::-webkit-scrollbar': {
                    width: '8px'
                  },
                  '&::-webkit-scrollbar-track': {
                    background: alpha(theme.palette.primary.main, 0.05)
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: alpha(theme.palette.primary.main, 0.3),
                    borderRadius: '4px',
                    '&:hover': {
                      background: alpha(theme.palette.primary.main, 0.5)
                    }
                  }
                }}
              >
                {getCodeExample(codeLanguage, currentSection)}
              </Box>
            </Box>
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
              backgroundColor: theme.palette.background.paper,
              border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              borderRadius: '8px',
              p: { xs: 2, sm: 4 },
              overflowY: 'auto'
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
            backgroundColor: theme.palette.background.paper,
            borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            color: theme.palette.text.primary,
            py: 3
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

// Wrapper component to provide AppContext for Logo component
const ApiDocsWithContext = () => {
  const contextValue = {
    darkMode: true, // API docs uses dark theme
    openSnackbar: () => {}, // Mock function for context completeness
    accountProfile: null
  };

  return (
    <AppContext.Provider value={contextValue}>
      <ApiDocs />
    </AppContext.Provider>
  );
};

export default ApiDocsWithContext;
