import React, { useState, useEffect, useMemo } from 'react';
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
  { id: 'get-pairs', title: 'Get Trading Pairs' },
  { id: 'search-tokens', title: 'Search Tokens' },
  { id: 'watchlist', title: 'Watchlist' },
  { id: 'team-wallet', title: 'Team Wallet' },
  { id: 'token-description', title: 'Token Description' },
  { id: 'user-profile', title: 'User Profile' },
  { id: 'user-activities', title: 'User Activities' },
  { id: 'account-lines', title: 'Account Trust Lines' },
  { id: 'account-offers', title: 'Account Offers' },
  { id: 'account-balance', title: 'Account Balance' },
  { id: 'spark-24h', title: '24h Spark Data' },
  { id: 'tags', title: 'Tags' },
  { id: 'token-creation', title: 'Token Creation' },
  { id: 'trader-stats', title: 'Trader Statistics' },
  { id: 'wash-trading', title: 'Wash Trading Detection' },
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
        <mark
          key={`highlight-${part}-${index}-${part.length}`}
          style={{ backgroundColor: '#FFD54F' }}
        >
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
                  { label: '16000+', desc: 'Tokens', color: 'primary', id: 'stat-tokens' },
                  { label: '99.9%', desc: 'Uptime', color: 'success', id: 'stat-uptime' },
                  { label: 'Real-time', desc: 'Data', color: 'info', id: 'stat-realtime' },
                  { label: '5', desc: 'Languages', color: 'warning', id: 'stat-languages' }
                ].map((stat) => (
                  <Grid item xs={6} sm={3} key={stat.id}>
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
                  color: theme.palette.primary.main,
                  id: 'feature-token'
                },
                {
                  icon: <TrendingUpIcon />,
                  title: 'Price Feeds',
                  description: 'Multi-currency price data',
                  color: theme.palette.success.main,
                  id: 'feature-price'
                },
                {
                  icon: <DataUsageIcon />,
                  title: 'Volume Tracking',
                  description: 'DEX and AMM trading volumes',
                  color: theme.palette.info.main,
                  id: 'feature-volume'
                }
              ].map((feature) => (
                <Grid item xs={12} sm={4} key={feature.id}>
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
                <Typography variant="body2" sx={{ mt: 2, color: theme.palette.text.secondary }}>
                  Example with trending sorting and performance optimization:
                </Typography>
                <CodeBlock language="http">
                  GET
                  https://api.xrpl.to/api/tokens?sort=trendingScore&order=desc&limit=50&skipMetrics=true
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
                      <TableCell>Varies</TableCell>
                      <TableCell>
                        Records per page (1-100). Intelligent defaults: 50 for filtered queries, 20
                        for complex sorts (assessmentScore, pro5m, trendingScore), 100 for general
                        queries
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>sortBy</TableCell>
                      <TableCell>vol24hxrp</TableCell>
                      <TableCell>
                        Can be: name, exch, pro24h, pro7d, vol24hxrp, vol24htx, marketcap,
                        trustlines, supply, assessmentScore, pro5m, trendingScore
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>sort</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>
                        Alternative parameter name for sortBy (same options available)
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>sortType</TableCell>
                      <TableCell>desc</TableCell>
                      <TableCell>asc or desc (ascending or descending)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>order</TableCell>
                      <TableCell>desc</TableCell>
                      <TableCell>Alternative parameter name for sortType (asc or desc)</TableCell>
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
                    <TableRow>
                      <TableCell>queryTags</TableCell>
                      <TableCell>no</TableCell>
                      <TableCell>Set to "yes" to return tags list instead of tokens</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>skipMetrics</TableCell>
                      <TableCell>false</TableCell>
                      <TableCell>
                        Set to "true" to skip fetching metrics data for improved performance
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
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleOpenModal('get-all-tokens')}
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
                  Get a Specific Token Info
                </Typography>
              </Box>
              <Typography
                variant="body1"
                sx={{ lineHeight: 1.8, color: theme.palette.text.secondary }}
              >
                Retrieve detailed information about a specific token, including its issuer,
                description, and other relevant details. You can query by issuer_currency format,
                MD5 hash, or slug identifier.
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
                  GET https://api.xrpl.to/api/token/&lt;identifier&gt;
                </CodeBlock>
                <Typography variant="body2" sx={{ mt: 2, color: theme.palette.text.secondary }}>
                  You can query using different identifiers:
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, mb: 1, color: theme.palette.text.secondary }}>
                  • Issuer_Currency format:
                </Typography>
                <CodeBlock language="http">
                  GET https://api.xrpl.to/api/token/rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq_USD
                </CodeBlock>
                <Typography variant="body2" sx={{ mt: 1, mb: 1, color: theme.palette.text.secondary }}>
                  • MD5 hash format:
                </Typography>
                <CodeBlock language="http">
                  GET https://api.xrpl.to/api/token/c9ac9a6c44763c1bd9ccc6e47572fd26
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
                      <TableCell>identifier</TableCell>
                      <TableCell>Path</TableCell>
                      <TableCell>Required</TableCell>
                      <TableCell>Token identifier - can be issuer_currency format, MD5 hash, or slug</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>desc</TableCell>
                      <TableCell>Query</TableCell>
                      <TableCell>no</TableCell>
                      <TableCell>Set to "no" to exclude description from response</TableCell>
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
                  color="primary"
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

      case 'get-token-image':
        return (
          <Box id="get-token-image">
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
                  Get Token Image
                </Typography>
              </Box>
              <Typography
                variant="body1"
                sx={{ lineHeight: 1.8, color: theme.palette.text.secondary }}
              >
                Retrieve the image associated with a specific token using its MD5 hash. This
                endpoint returns optimized images in WebP format for efficient loading and
                optimal performance.
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
                <CodeBlock language="http">GET https://s1.xrpl.to/token/&lt;md5&gt;</CodeBlock>
                <Typography variant="body2" sx={{ mt: 2, color: theme.palette.text.secondary }}>
                  Example usage:
                </Typography>
                <CodeBlock language="http">
                  GET https://s1.xrpl.to/token/f34b16a00980d21c80e4b8b3dbf2424b
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
                <Typography variant="h6" sx={{ color: theme.palette.warning.main, fontWeight: 600 }}>
                  Response Format
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  This endpoint returns binary image data in optimized WebP format:
                </Typography>
                <Box sx={{ ml: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Content-Type:</strong> image/webp
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Format:</strong> Optimized WebP for smaller file sizes and faster loading
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Caching:</strong> Images are cached for performance
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
                  Path Parameters
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
                      <TableCell>MD5 hash of the token identifier (issuer_currency)</TableCell>
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
                  color="primary"
                  onClick={() => handleOpenModal('get-token-image')}
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

      case 'get-sparkline-of-a-token':
        return (
          <Box id="get-sparkline-of-a-token">
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
                <TrendingUpIcon sx={{ color: theme.palette.primary.main, mr: 2, fontSize: 32 }} />
                <Typography
                  variant="h2"
                  sx={{ color: theme.palette.primary.main, fontWeight: 600 }}
                >
                  Get Sparkline of a Token
                </Typography>
              </Box>
              <Typography
                variant="body1"
                sx={{ lineHeight: 1.8, color: theme.palette.text.secondary }}
              >
                Retrieve a sparkline chart for a specific token. This endpoint provides a visual
                representation of token price movements over a specified time range.
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
                  GET https://api.xrpl.to/api/sparkline/&lt;tokenId&gt;
                </CodeBlock>
                <Typography variant="body2" sx={{ mt: 2, color: theme.palette.text.secondary }}>
                  Example usage:
                </Typography>
                <CodeBlock language="http">
                  GET https://api.xrpl.to/api/sparkline/0413ca7cfc258dfaf698c02fe304e607
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
                      <TableCell>tokenId</TableCell>
                      <TableCell>Path</TableCell>
                      <TableCell>Required</TableCell>
                      <TableCell>Token ID or slug</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>range</TableCell>
                      <TableCell>Query</TableCell>
                      <TableCell>1D</TableCell>
                      <TableCell>
                        Time range for historical data: SPARK, 1D, 7D, 1M, 3M, 1Y, or ALL
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
                <Button
                  variant="contained"
                  color="primary"
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
                  Data Features
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  The sparkline data endpoint provides comprehensive market data:
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
                    • <strong>SPARK:</strong> 4-second intervals for 12 hours (10,800 data points)
                  </Typography>
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
                    500 Internal Server Error (Invalid Token ID)
                  </Typography>
                  <CodeBlock language="json">
                    {`{
  "message": "Invalid token ID"
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
                        Time range for historical data: SPARK, 1D, 7D, 1M, 3M, 1Y, or ALL
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
                    {
                      range: '1D',
                      desc: '1 Day - Last 24 hours',
                      color: 'primary',
                      id: 'range-1d'
                    },
                    { range: '7D', desc: '7 Days - Last week', color: 'success', id: 'range-7d' },
                    { range: '1M', desc: '1 Month - Last 30 days', color: 'info', id: 'range-1m' },
                    {
                      range: '3M',
                      desc: '3 Months - Last quarter',
                      color: 'warning',
                      id: 'range-3m'
                    },
                    {
                      range: '1Y',
                      desc: '1 Year - Last 12 months',
                      color: 'error',
                      id: 'range-1y'
                    },
                    {
                      range: 'ALL',
                      desc: 'All Time - Complete history',
                      color: 'secondary',
                      id: 'range-all'
                    }
                  ].map((item) => (
                    <Grid item xs={12} sm={6} md={4} key={item.id}>
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
                    • <strong>SPARK:</strong> 4-second intervals for 12 hours (10,800 data points)
                  </Typography>
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

      case 'get-rich-list-of-a-token':
        return (
          <Box id="get-rich-list-of-a-token">
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
                  Get Rich List of a Token
                </Typography>
              </Box>
              <Typography
                variant="body1"
                sx={{ lineHeight: 1.8, color: theme.palette.text.secondary }}
              >
                Retrieve a list of top holders of a specific token. This endpoint provides
                comprehensive information about token distribution and ownership.
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
                  GET https://api.xrpl.to/api/richlist/&lt;tokenId&gt;?start=0&limit=20
                </CodeBlock>
                <Typography variant="body2" sx={{ mt: 2, color: theme.palette.text.secondary }}>
                  Example usage:
                </Typography>
                <CodeBlock language="http">
                  GET
                  https://api.xrpl.to/api/richlist/0413ca7cfc258dfaf698c02fe304e607?start=0&limit=20
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
                      <TableCell>tokenId</TableCell>
                      <TableCell>Path</TableCell>
                      <TableCell>Required</TableCell>
                      <TableCell>Token ID or slug</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>start</TableCell>
                      <TableCell>Query</TableCell>
                      <TableCell>0</TableCell>
                      <TableCell>Start value for pagination (minimum: 0)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>limit</TableCell>
                      <TableCell>Query</TableCell>
                      <TableCell>20</TableCell>
                      <TableCell>Limit count value for pagination (1-100, default: 20)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>freeze</TableCell>
                      <TableCell>Query</TableCell>
                      <TableCell>false</TableCell>
                      <TableCell>Filter frozen accounts when set to true</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>sortBy</TableCell>
                      <TableCell>Query</TableCell>
                      <TableCell>balance</TableCell>
                      <TableCell>Sort field (e.g., balance, balance24h)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>sortType</TableCell>
                      <TableCell>Query</TableCell>
                      <TableCell>desc</TableCell>
                      <TableCell>Sort order: asc or desc</TableCell>
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
                  color="primary"
                  onClick={() => handleOpenModal('get-rich-list-of-a-token')}
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
                <TrendingUpIcon sx={{ color: theme.palette.secondary.main, mr: 2, fontSize: 32 }} />
                <Typography
                  variant="h2"
                  sx={{ color: theme.palette.secondary.main, fontWeight: 600 }}
                >
                  Get Exchange History of a Token
                </Typography>
              </Box>
              <Typography
                variant="body1"
                sx={{ lineHeight: 1.8, color: theme.palette.text.secondary }}
              >
                Retrieve detailed transaction history for a specific token, including trade data,
                volumes, prices, and participant information. Supports pagination and
                account-specific filtering for comprehensive transaction analysis.
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
                <Typography variant="body2" sx={{ mt: 2, color: theme.palette.text.secondary }}>
                  Example with time range and XRP-only filtering:
                </Typography>
                <CodeBlock language="http">
                  GET
                  https://api.xrpl.to/api/history?md5=c9ac9a6c44763c1bd9ccc6e47572fd26&page=0&limit=10&startTime=1640995200000&endTime=1641081600000&xrpOnly=true
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
                    <TableRow>
                      <TableCell>startTime</TableCell>
                      <TableCell>Query</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>
                        Start timestamp for time range filtering (Unix timestamp in milliseconds)
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>endTime</TableCell>
                      <TableCell>Query</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>
                        End timestamp for time range filtering (Unix timestamp in milliseconds)
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>xrpOnly</TableCell>
                      <TableCell>Query</TableCell>
                      <TableCell>false</TableCell>
                      <TableCell>
                        Filter results to show only XRP transactions (boolean: true/false)
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>xrpAmount</TableCell>
                      <TableCell>Query</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>
                        Filter trades above specified XRP amount
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
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Minimum Limit:</strong> Values below 1 are set to default 50
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Time Range Validation:</strong> startTime must be less than or equal
                    to endTime
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    • <strong>Timestamp Format:</strong> startTime and endTime must be valid Unix
                    timestamps in milliseconds
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    • <strong>Boolean Parameters:</strong> xrpOnly accepts 'true' for true, any
                    other value defaults to false
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

      case 'get-pairs':
        return (
          <Box id="get-pairs">
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
                <TrendingUpIcon sx={{ color: theme.palette.success.main, mr: 2, fontSize: 32 }} />
                <Typography
                  variant="h2"
                  sx={{ color: theme.palette.success.main, fontWeight: 600 }}
                >
                  Get Trading Pairs
                </Typography>
              </Box>
              <Typography
                variant="body1"
                sx={{ lineHeight: 1.8, color: theme.palette.text.secondary }}
              >
                Retrieve available trading pairs for a specific token.
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
                <CodeBlock language="http">GET https://api.xrpl.to/api/pairs?token=&lt;tokenId&gt;</CodeBlock>
              </CardContent>
            </Card>
          </Box>
        );

      case 'search-tokens':
        return (
          <Box id="search-tokens">
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
                <SearchIcon sx={{ color: theme.palette.info.main, mr: 2, fontSize: 32 }} />
                <Typography
                  variant="h2"
                  sx={{ color: theme.palette.info.main, fontWeight: 600 }}
                >
                  Search Tokens
                </Typography>
              </Box>
              <Typography
                variant="body1"
                sx={{ lineHeight: 1.8, color: theme.palette.text.secondary }}
              >
                Search for tokens by name, symbol, or other criteria.
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
                <Typography
                  variant="h6"
                  sx={{ color: theme.palette.info.main, fontWeight: 600 }}
                >
                  HTTP Request
                </Typography>
              </Box>
              <CardContent>
                <CodeBlock language="http">GET https://api.xrpl.to/api/search?q=&lt;query&gt;</CodeBlock>
              </CardContent>
            </Card>
          </Box>
        );

      case 'tags':
        return (
          <Box id="tags">
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
                  Get All Tags
                </Typography>
              </Box>
              <Typography
                variant="body1"
                sx={{ lineHeight: 1.8, color: theme.palette.text.secondary }}
              >
                Retrieve all available token category tags.
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
                <CodeBlock language="http">GET https://api.xrpl.to/api/tags</CodeBlock>
              </CardContent>
            </Card>
          </Box>
        );

      case 'account-lines':
        return (
          <Box id="account-lines">
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
                <AccountBalanceWalletIcon sx={{ color: theme.palette.success.main, mr: 2, fontSize: 32 }} />
                <Typography
                  variant="h2"
                  sx={{ color: theme.palette.success.main, fontWeight: 600 }}
                >
                  Get Account Trust Lines
                </Typography>
              </Box>
              <Typography
                variant="body1"
                sx={{ lineHeight: 1.8, color: theme.palette.text.secondary }}
              >
                Retrieve all trust lines for a specific XRPL account.
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
                <CodeBlock language="http">GET https://api.xrpl.to/api/account/lines/&lt;account&gt;</CodeBlock>
              </CardContent>
            </Card>
          </Box>
        );

      case 'account-balance':
        return (
          <Box id="account-balance">
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
                <AccountBalanceWalletIcon sx={{ color: theme.palette.info.main, mr: 2, fontSize: 32 }} />
                <Typography
                  variant="h2"
                  sx={{ color: theme.palette.info.main, fontWeight: 600 }}
                >
                  Get Account XRP Balance
                </Typography>
              </Box>
              <Typography
                variant="body1"
                sx={{ lineHeight: 1.8, color: theme.palette.text.secondary }}
              >
                Retrieve the XRP balance for a specific account.
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
                <Typography
                  variant="h6"
                  sx={{ color: theme.palette.info.main, fontWeight: 600 }}
                >
                  HTTP Request
                </Typography>
              </Box>
              <CardContent>
                <CodeBlock language="http">GET https://api.xrpl.to/api/account/balance/&lt;account&gt;</CodeBlock>
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
  const contextValue = useMemo(
    () => ({
      darkMode: true, // API docs uses dark theme
      openSnackbar: () => {}, // Mock function for context completeness
      accountProfile: null
    }),
    []
  );

  return (
    <AppContext.Provider value={contextValue}>
      <ApiDocs />
    </AppContext.Provider>
  );
};

export default ApiDocsWithContext;
