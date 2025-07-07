import React from 'react';
import Head from 'next/head';
import { ThemeProvider, createTheme, alpha } from '@mui/material/styles';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Paper,
  Box,
  CssBaseline,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Divider
} from '@mui/material';
import Logo from 'src/components/Logo';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DataUsageIcon from '@mui/icons-material/DataUsage';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ScheduleIcon from '@mui/icons-material/Schedule';
import StorageIcon from '@mui/icons-material/Storage';
import AnalyticsIcon from '@mui/icons-material/Analytics';

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

const FieldTable = ({ fields, title }) => (
  <TableContainer component={Paper} sx={{ my: 2 }}>
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>
            <Typography variant="h6">{title}</Typography>
          </TableCell>
          <TableCell align="right">Type</TableCell>
          <TableCell align="right">Description</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {fields.map((field) => (
          <TableRow key={field.name}>
            <TableCell component="th" scope="row">
              <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#25A768' }}>
                {field.name}
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Chip label={field.type} size="small" color="secondary" />
            </TableCell>
            <TableCell align="right">
              <Typography variant="body2" color="text.secondary">
                {field.description}
              </Typography>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

const BackendDocs = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Head>
        <title>XRPL.to Backend Documentation - Metrics System</title>
        <meta
          name="description"
          content="Comprehensive documentation for the XRPL.to backend metrics system, including database collections, job schedules, and data structures."
        />
        <meta
          name="keywords"
          content="XRPL, backend, metrics, documentation, API, database, MongoDB"
        />
      </Head>

      <AppBar position="fixed">
        <Toolbar>
          <Logo sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            XRPL.to Backend Documentation
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 12, mb: 4 }}>
        {/* Overview Section */}
        <Typography variant="h1" gutterBottom sx={{ color: '#25A768', mb: 4 }}>
          XRPL.to Backend Documentation
        </Typography>

        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h3" gutterBottom>
              Overview
            </Typography>
            <Typography variant="body1" paragraph>
              The XRPL.to backend is a comprehensive system that aggregates and processes data from
              the XRP Ledger to provide real-time metrics, analytics, and market data. The backend
              consists of multiple modules that work together to collect, process, and serve data
              through various APIs.
            </Typography>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                This documentation focuses on the <strong>metrics.js</strong> module, which is
                responsible for collecting and updating various metrics across multiple database
                collections.
              </Typography>
            </Alert>
          </CardContent>
        </Card>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <DataUsageIcon sx={{ color: '#25A768', mr: 1 }} />
                  <Typography variant="h5">Data Collections</Typography>
                </Box>
                <Typography variant="body2">
                  The system maintains several MongoDB collections including tokens, metrics,
                  gmetrics, and volex24h collections.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <ScheduleIcon sx={{ color: '#25A768', mr: 1 }} />
                  <Typography variant="h5">Scheduled Jobs</Typography>
                </Box>
                <Typography variant="body2">
                  Multiple jobs run at different intervals (5s, 30s, 1min, 2min, 5min) to keep
                  metrics updated in real-time.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Metrics.js Module Section */}
        <Typography variant="h2" gutterBottom sx={{ color: '#25A768', mb: 3 }}>
          Metrics.js Module
        </Typography>

        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="body1" paragraph>
              The <code>metrics.js</code> module is the core component responsible for collecting,
              processing, and updating various metrics across the XRPL.to platform. It manages
              multiple database collections and runs scheduled jobs to ensure data freshness and
              accuracy for real-time analytics.
            </Typography>

            <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
              Core Responsibilities
            </Typography>

            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <TrendingUpIcon sx={{ color: '#25A768', mr: 1 }} />
                      <Typography variant="h6">Token Metrics Processing</Typography>
                    </Box>
                    <Typography variant="body2" paragraph>
                      Continuously updates token-specific metrics including:
                    </Typography>
                    <Box component="ul" sx={{ pl: 2, mb: 0 }}>
                      <Typography component="li" variant="body2">
                        24-hour trading volumes (vol24h, vol24htx, vol24hAMM)
                      </Typography>
                      <Typography component="li" variant="body2">
                        XRP-specific volumes (vol24hxrp, vol24hxrpAMM)
                      </Typography>
                      <Typography component="li" variant="body2">
                        Market capitalization calculations
                      </Typography>
                      <Typography component="li" variant="body2">
                        Price change percentages (5m, 1h, 24h, 7d)
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <AnalyticsIcon sx={{ color: '#25A768', mr: 1 }} />
                      <Typography variant="h6">Global Statistics</Typography>
                    </Box>
                    <Typography variant="body2" paragraph>
                      Maintains platform-wide aggregate metrics:
                    </Typography>
                    <Box component="ul" sx={{ pl: 2, mb: 0 }}>
                      <Typography component="li" variant="body2">
                        Global market cap and percentage changes
                      </Typography>
                      <Typography component="li" variant="body2">
                        DEX volume tracking and analysis
                      </Typography>
                      <Typography component="li" variant="body2">
                        Categorized volume metrics (Scam, NFT/IOU, Stable, Meme)
                      </Typography>
                      <Typography component="li" variant="body2">
                        XRP dominance calculations
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <StorageIcon sx={{ color: '#25A768', mr: 1 }} />
                      <Typography variant="h6">Network Statistics</Typography>
                    </Box>
                    <Typography variant="body2" paragraph>
                      Tracks XRPL network-wide statistics:
                    </Typography>
                    <Box component="ul" sx={{ pl: 2, mb: 0 }}>
                      <Typography component="li" variant="body2">
                        Total and active addresses monitoring
                      </Typography>
                      <Typography component="li" variant="body2">
                        Trustlines and holder count tracking
                      </Typography>
                      <Typography component="li" variant="body2">
                        Active offers and order book analysis
                      </Typography>
                      <Typography component="li" variant="body2">
                        24-hour transaction volume aggregation
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <DataUsageIcon sx={{ color: '#25A768', mr: 1 }} />
                      <Typography variant="h6">Ranking & Scoring</Typography>
                    </Box>
                    <Typography variant="body2" paragraph>
                      Implements sophisticated ranking algorithms:
                    </Typography>
                    <Box component="ul" sx={{ pl: 2, mb: 0 }}>
                      <Typography component="li" variant="body2">
                        Token ranking positions and market dominance
                      </Typography>
                      <Typography component="li" variant="body2">
                        Trending score calculations based on activity
                      </Typography>
                      <Typography component="li" variant="body2">
                        Assessment scores for token quality
                      </Typography>
                      <Typography component="li" variant="body2">
                        Search relevance and nginx-based scoring
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Data Processing Pipeline:</strong> The metrics module processes raw XRPL data
            through multiple transformation stages, ensuring accurate calculations and maintaining
            data integrity across all collections.
          </Typography>
        </Alert>

        <Divider sx={{ my: 4 }} />

        {/* Tokens Collection Section */}
        <Typography variant="h2" gutterBottom sx={{ color: '#25A768', mb: 3 }}>
          Tokens Collection
        </Typography>

        <Typography variant="body1" paragraph>
          The tokens collection stores comprehensive information about each token on the XRP Ledger,
          including trading metrics, market data, and token-specific statistics.
        </Typography>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5">Volume & Trading Fields</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FieldTable
              title="Volume & Trading Metrics"
              fields={[
                { name: 'vol24h', type: 'Number', description: '24-hour trading volume' },
                { name: 'vol24htx', type: 'Number', description: '24-hour transaction volume' },
                { name: 'vol24hAMM', type: 'Number', description: '24-hour AMM volume' },
                {
                  name: 'vol24htxAMM',
                  type: 'Number',
                  description: '24-hour AMM transaction volume'
                },
                { name: 'vol24hxrp', type: 'Number', description: '24-hour XRP volume' },
                { name: 'vol24hxrpAMM', type: 'Number', description: '24-hour XRP AMM volume' },
                { name: 'vol24hx', type: 'Number', description: '24-hour extended volume' },
                { name: 'vol24hxAMM', type: 'Number', description: '24-hour extended AMM volume' }
              ]}
            />
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5">Market Data Fields</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FieldTable
              title="Market Data"
              fields={[
                { name: 'marketcap', type: 'Number', description: 'Current market capitalization' },
                { name: 'maxMin24h', type: 'Object', description: '24-hour high/low prices' },
                { name: 'pro5m', type: 'Number', description: '5-minute price change percentage' },
                { name: 'pro1h', type: 'Number', description: '1-hour price change percentage' },
                { name: 'pro24h', type: 'Number', description: '24-hour price change percentage' },
                { name: 'pro7d', type: 'Number', description: '7-day price change percentage' },
                { name: 'p5m', type: 'Number', description: '5-minute price difference' },
                { name: 'p1h', type: 'Number', description: '1-hour price difference' },
                { name: 'p24h', type: 'Number', description: '24-hour price difference' },
                { name: 'p7d', type: 'Number', description: '7-day price difference' }
              ]}
            />
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5">Token Metrics</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FieldTable
              title="Token Statistics"
              fields={[
                { name: 'supply', type: 'Number', description: 'Total token supply' },
                { name: 'trustlines', type: 'Number', description: 'Current number of trustlines' },
                { name: 'holders', type: 'Number', description: 'Current number of holders' },
                { name: 'trustlines24h', type: 'Number', description: '24-hour trustline change' },
                { name: 'marketcap24h', type: 'Number', description: '24-hour market cap change' },
                { name: 'holders24h', type: 'Number', description: '24-hour holder change' },
                { name: 'offers', type: 'Number', description: 'Active offers count' }
              ]}
            />
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5">Rankings & Scores</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FieldTable
              title="Ranking & Scoring"
              fields={[
                { name: 'id', type: 'Number', description: 'Ranking position' },
                { name: 'dom', type: 'Number', description: 'Market dominance percentage' },
                { name: 'trendingScore', type: 'Number', description: 'Trending algorithm score' },
                { name: 'assessmentScore', type: 'Number', description: 'Token assessment score' },
                { name: 'nginxScore', type: 'Number', description: 'Nginx-based score' },
                { name: 'searchScore', type: 'Number', description: 'Search relevance score' }
              ]}
            />
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5">Metadata</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FieldTable
              title="Metadata Fields"
              fields={[
                { name: 'lastRecentUpdate', type: 'Date', description: 'Timestamp of last update' }
              ]}
            />
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ my: 4 }} />

        {/* Metrics Collection Section */}
        <Typography variant="h2" gutterBottom sx={{ color: '#25A768', mb: 3 }}>
          Metrics Collection
        </Typography>

        <Typography variant="body1" paragraph>
          The metrics collection contains aggregate statistics and global metrics for the entire
          platform, organized into specific documents for different time periods and data types.
        </Typography>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5">METRICS_24H Document</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph color="text.secondary">
              Contains 24-hour aggregate statistics for the entire platform.
            </Typography>
            <FieldTable
              title="24-Hour Metrics"
              fields={[
                {
                  name: 'transactions24H',
                  type: 'Number',
                  description: 'Total transactions in last 24 hours'
                },
                {
                  name: 'tradedXRP24H',
                  type: 'Number',
                  description: 'Total XRP traded in last 24 hours'
                },
                {
                  name: 'tradedTokens24H',
                  type: 'Number',
                  description: 'Total tokens traded in last 24 hours'
                },
                {
                  name: 'activeAddresses24H',
                  type: 'Number',
                  description: 'Active addresses in last 24 hours'
                },
                { name: 'totalAddresses', type: 'Number', description: 'Total unique addresses' },
                { name: 'totalOffers', type: 'Number', description: 'Total active offers' },
                { name: 'totalTrustLines', type: 'Number', description: 'Total trustlines' }
              ]}
            />
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5">METRICS_GLOBAL Document</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph color="text.secondary">
              Contains global market statistics and categorized volume data.
            </Typography>
            <FieldTable
              title="Global Metrics"
              fields={[
                { name: 'gMarketcap', type: 'Number', description: 'Global market capitalization' },
                {
                  name: 'gMarketcapPro',
                  type: 'Number',
                  description: 'Global market cap percentage change'
                },
                { name: 'gDexVolume', type: 'Number', description: 'Global DEX volume' },
                {
                  name: 'gDexVolumePro',
                  type: 'Number',
                  description: 'Global DEX volume percentage change'
                },
                { name: 'gScamVolume', type: 'Number', description: 'Scam token volume' },
                {
                  name: 'gScamVolumePro',
                  type: 'Number',
                  description: 'Scam volume percentage change'
                },
                { name: 'gNFTIOUVolume', type: 'Number', description: 'NFT/IOU volume' },
                {
                  name: 'gNFTIOUVolumePro',
                  type: 'Number',
                  description: 'NFT/IOU volume percentage change'
                },
                { name: 'gStableVolume', type: 'Number', description: 'Stablecoin volume' },
                {
                  name: 'gStableVolumePro',
                  type: 'Number',
                  description: 'Stablecoin volume percentage change'
                },
                { name: 'gMemeVolume', type: 'Number', description: 'Meme token volume' },
                {
                  name: 'gMemeVolumePro',
                  type: 'Number',
                  description: 'Meme token volume percentage change'
                },
                { name: 'gXRPdominance', type: 'Number', description: 'XRP market dominance' },
                {
                  name: 'gXRPdominancePro',
                  type: 'Number',
                  description: 'XRP dominance percentage change'
                },
                { name: 'totalAddresses', type: 'Number', description: 'Total addresses' },
                { name: 'totalOffers', type: 'Number', description: 'Total offers' },
                { name: 'totalTrustLines', type: 'Number', description: 'Total trustlines' }
              ]}
            />
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ my: 4 }} />

        {/* Global Metrics Collection Section */}
        <Typography variant="h2" gutterBottom sx={{ color: '#25A768', mb: 3 }}>
          Global Metrics Collection
        </Typography>

        <Typography variant="body1" paragraph>
          The gmetrics collection stores time-series data for global metrics, allowing for
          historical analysis and trend tracking.
        </Typography>

        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Time-Series Structure
            </Typography>
            <Typography variant="body2" paragraph>
              Each document in the gmetrics collection represents a snapshot of global metrics at a
              specific time, enabling historical analysis and charting.
            </Typography>
          </CardContent>
        </Card>

        <FieldTable
          title="Global Metrics Time-Series"
          fields={[
            {
              name: 'gMarketcap',
              type: 'Number',
              description: 'Global market capitalization at time'
            },
            { name: 'gDexVolume', type: 'Number', description: 'Global DEX volume at time' },
            { name: 'gScamVolume', type: 'Number', description: 'Scam token volume at time' },
            { name: 'gNFTIOUVolume', type: 'Number', description: 'NFT/IOU volume at time' },
            { name: 'gStableVolume', type: 'Number', description: 'Stablecoin volume at time' },
            { name: 'gMemeVolume', type: 'Number', description: 'Meme token volume at time' },
            { name: 'gXRPdominance', type: 'Number', description: 'XRP market dominance at time' },
            { name: 'time', type: 'Date', description: 'Timestamp of the metric snapshot' }
          ]}
        />

        <Divider sx={{ my: 4 }} />

        {/* Volume Exchange 24h Collection Section */}
        <Typography variant="h2" gutterBottom sx={{ color: '#25A768', mb: 3 }}>
          Volume Exchange 24h Collection
        </Typography>

        <Typography variant="body1" paragraph>
          The volex24h collection tracks trading pair volumes and transaction counts over 24-hour
          periods, providing detailed insights into trading activity.
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            This collection is particularly useful for analyzing trading patterns and identifying
            popular trading pairs on the XRP Ledger.
          </Typography>
        </Alert>

        <FieldTable
          title="Volume Exchange Fields"
          fields={[
            {
              name: 'pair',
              type: 'String',
              description: 'Trading pair identifier (e.g., "XRP/USD")'
            },
            { name: 'curr1', type: 'String', description: 'First currency in the pair' },
            { name: 'curr2', type: 'String', description: 'Second currency in the pair' },
            { name: 'count', type: 'Number', description: 'Number of transactions for this pair' },
            { name: 'time', type: 'Date', description: 'Timestamp of the record' }
          ]}
        />

        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Use Cases
            </Typography>
            <Box component="ul" sx={{ pl: 3 }}>
              <Typography component="li" variant="body2" paragraph>
                Identifying most active trading pairs
              </Typography>
              <Typography component="li" variant="body2" paragraph>
                Tracking trading volume trends over time
              </Typography>
              <Typography component="li" variant="body2" paragraph>
                Analyzing market liquidity patterns
              </Typography>
              <Typography component="li" variant="body2" paragraph>
                Generating trading pair rankings
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Divider sx={{ my: 4 }} />

        {/* Job Schedules Section */}
        <Typography variant="h2" gutterBottom sx={{ color: '#25A768', mb: 3 }}>
          Job Schedules
        </Typography>

        <Typography variant="body1" paragraph>
          The metrics module runs various jobs at different intervals to ensure optimal performance
          and data accuracy. Each job is designed to handle specific types of data updates without
          overwhelming the system.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Chip label="5 seconds" color="error" sx={{ mr: 2 }} />
                  <Typography variant="h6">High-Frequency Updates</Typography>
                </Box>
                <Typography variant="body2">
                  Critical real-time data updates that require immediate processing, such as price
                  changes and volume spikes.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Chip label="30 seconds" color="warning" sx={{ mr: 2 }} />
                  <Typography variant="h6">Medium-Frequency Updates</Typography>
                </Box>
                <Typography variant="body2">
                  Important metrics that need regular updates but don't require real-time
                  processing, such as trustline counts.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Chip label="1 minute" color="info" sx={{ mr: 2 }} />
                  <Typography variant="h6">Standard Updates</Typography>
                </Box>
                <Typography variant="body2">
                  Regular metric updates including market cap calculations and holder statistics.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Chip label="2 minutes" color="success" sx={{ mr: 2 }} />
                  <Typography variant="h6">Analytical Updates</Typography>
                </Box>
                <Typography variant="body2">
                  Complex calculations and analytical metrics that require more processing time.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Chip label="5 minutes" color="secondary" sx={{ mr: 2 }} />
                  <Typography variant="h6">Batch Processing</Typography>
                </Box>
                <Typography variant="body2">
                  Heavy computational tasks, data aggregation, and system maintenance operations
                  that can be performed less frequently.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Alert severity="success" sx={{ mt: 4 }}>
          <Typography variant="body2">
            <strong>Performance Optimization:</strong> The staggered job schedule ensures that the
            system maintains high performance while keeping all metrics up-to-date. Jobs are
            designed to avoid conflicts and optimize database operations.
          </Typography>
        </Alert>

        <Divider sx={{ my: 4 }} />

        {/* TX Module Section */}
        <Typography variant="h1" gutterBottom sx={{ color: '#25A768', mb: 4 }}>
          TX Module - main.js
        </Typography>

        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h3" gutterBottom>
              Real-Time Transaction Processing Engine
            </Typography>
            <Typography variant="body1" paragraph>
              The TX Module (main.js) is the core real-time transaction processing engine that
              monitors the XRPL ledger continuously, extracting trading activity, price movements,
              and state changes. It maintains comprehensive token and market data across multiple
              database collections and timeframes.
            </Typography>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                This module processes XRPL ledger data in real-time, handling{' '}
                <strong>
                  price updates, trading history, graph generation, and state management
                </strong>{' '}
                for accounts, offers, and trust lines.
              </Typography>
            </Alert>
          </CardContent>
        </Card>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <TrendingUpIcon sx={{ color: '#25A768', mr: 1 }} />
                  <Typography variant="h5">Real-Time Processing</Typography>
                </Box>
                <Typography variant="body2">
                  Processes XRPL transactions as they occur, extracting price and volume data for
                  immediate market updates.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <StorageIcon sx={{ color: '#25A768', mr: 1 }} />
                  <Typography variant="h5">Multi-Database Architecture</Typography>
                </Box>
                <Typography variant="body2">
                  Manages multiple specialized databases (TxDB, PriceDB, GraphDB, HistoryDB) each
                  optimized for specific data types and query patterns.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <AnalyticsIcon sx={{ color: '#25A768', mr: 1 }} />
                  <Typography variant="h5">Multi-Timeframe Analysis</Typography>
                </Box>
                <Typography variant="body2">
                  Generates graph data across multiple timeframes (1MIN, 1D, 7D, 1M, 3M, 1Y, ALL)
                  for comprehensive market analysis.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <DataUsageIcon sx={{ color: '#25A768', mr: 1 }} />
                  <Typography variant="h5">Token Discovery</Typography>
                </Box>
                <Typography variant="body2">
                  Automatically discovers and registers new tokens as they appear on the XRPL,
                  tracking metadata and initial trading activity.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Typography variant="h4" gutterBottom sx={{ mt: 4, mb: 3 }}>
          Key Operations
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom color="primary.main">
                Real-Time Price Updates
              </Typography>
              <Typography variant="body2">
                Extracts price data from XRPL transactions and updates multiple price collections
                with current market values.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom color="primary.main">
                Trading History Tracking
              </Typography>
              <Typography variant="body2">
                Maintains comprehensive trading history for all token pairs with detailed
                transaction metadata.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom color="primary.main">
                State Management
              </Typography>
              <Typography variant="body2">
                Tracks account balances, offers, and trust line changes to maintain accurate ledger
                state representation.
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Alert severity="success" sx={{ mt: 4 }}>
          <Typography variant="body2">
            <strong>Real-Time Architecture:</strong> The TX module's multi-database architecture
            ensures optimal performance for different query patterns while maintaining data
            consistency across all collections.
          </Typography>
        </Alert>

        <Divider sx={{ my: 4 }} />

        {/* Price Collection Section */}
        <Typography variant="h2" gutterBottom sx={{ color: '#25A768', mb: 3 }}>
          Price Collection (TxDB)
        </Typography>

        <Typography variant="body1" paragraph>
          The price collection in TxDB stores real-time price data extracted from XRPL transactions,
          providing the foundation for all price-related calculations and market analysis.
        </Typography>

        <FieldTable
          title="Price Collection Fields"
          fields={[
            { name: '_id', type: 'ObjectId', description: 'Unique document identifier' },
            { name: 'issuer', type: 'String', description: 'Token issuer address' },
            { name: 'currency', type: 'String', description: 'Currency code or hex' },
            { name: 'exch', type: 'Number', description: 'Exchange rate against base currency' },
            { name: 'usd', type: 'Number', description: 'USD price value' },
            { name: 'volume', type: 'Number', description: 'Trading volume' },
            { name: 'md5', type: 'String', description: 'MD5 hash of issuer+currency' },
            { name: 'time', type: 'Date', description: 'Timestamp of price update' }
          ]}
        />

        <Alert severity="info" sx={{ mt: 2, mb: 4 }}>
          <Typography variant="body2">
            The price collection serves as the primary source for current token prices and is
            updated in real-time as transactions occur on the XRPL.
          </Typography>
        </Alert>

        <Divider sx={{ my: 4 }} />

        {/* Enhanced Tokens Collection Section */}
        <Typography variant="h2" gutterBottom sx={{ color: '#25A768', mb: 3 }}>
          Enhanced Tokens Collection (TX Module)
        </Typography>

        <Typography variant="body1" paragraph>
          The TX module extends the tokens collection with additional fields for price data, token
          metadata, and XRP supply information.
        </Typography>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5">Price Data Fields</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FieldTable
              title="Price Information"
              fields={[
                { name: 'exch', type: 'Number', description: 'Current exchange rate' },
                { name: 'usd', type: 'Number', description: 'USD price value' },
                { name: 'time', type: 'Date', description: 'Price update timestamp' }
              ]}
            />
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5">Token Metadata (New Tokens)</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FieldTable
              title="Token Registration Data"
              fields={[
                { name: 'amount', type: 'Number', description: 'Initial token amount' },
                { name: 'supply', type: 'Number', description: 'Total token supply' },
                { name: 'trustlines', type: 'Number', description: 'Number of trustlines' },
                { name: 'offers', type: 'Number', description: 'Active offers count' },
                { name: 'holders', type: 'Number', description: 'Token holders count' },
                { name: '_id', type: 'ObjectId', description: 'Document identifier' },
                { name: 'issuer', type: 'String', description: 'Token issuer address' },
                { name: 'currency', type: 'String', description: 'Currency code' },
                { name: 'name', type: 'String', description: 'Token name' },
                { name: 'md5', type: 'String', description: 'Token hash' },
                { name: 'slug', type: 'String', description: 'URL-friendly identifier' }
              ]}
            />
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5">Extended Metadata</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FieldTable
              title="Additional Token Information"
              fields={[
                { name: 'ext', type: 'Object', description: 'Extended token information' },
                { name: 'dateon', type: 'Date', description: 'Token creation date' },
                { name: 'isTx', type: 'Boolean', description: 'Transaction flag' },
                { name: 'date', type: 'Date', description: 'Registration date' },
                { name: 'kyc', type: 'Boolean', description: 'KYC verification status' },
                { name: 'verified', type: 'Boolean', description: 'Verification status' },
                { name: 'user', type: 'String', description: 'Associated user' },
                { name: 'domain', type: 'String', description: 'Token domain' },
                { name: 'social', type: 'Object', description: 'Social media links' },
                { name: 'hashicon', type: 'String', description: 'Token icon hash' }
              ]}
            />
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5">XRP Supply Data</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FieldTable
              title="XRP Supply Information"
              fields={[
                { name: 'amount', type: 'Number', description: 'Total XRP supply from ledger' }
              ]}
            />
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ my: 4 }} />

        {/* PriceDB Collections Section */}
        <Typography variant="h2" gutterBottom sx={{ color: '#25A768', mb: 3 }}>
          PriceDB Collections
        </Typography>

        <Typography variant="body1" paragraph>
          PriceDB maintains historical price data across different timeframes (1D, 7D) for trend
          analysis and historical price queries.
        </Typography>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Timeframe Collections
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color="primary.main">
                    1D
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    1-Day Price History
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color="primary.main">
                    7D
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    7-Day Price History
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <FieldTable
          title="PriceDB Collection Structure"
          fields={[
            { name: '_id', type: 'ObjectId', description: 'Document identifier' },
            { name: 'issuer', type: 'String', description: 'Token issuer address' },
            { name: 'currency', type: 'String', description: 'Currency code' },
            { name: 'exch', type: 'Number', description: 'Exchange rate' },
            { name: 'usd', type: 'Number', description: 'USD price' },
            { name: 'volume', type: 'Number', description: 'Trading volume' },
            { name: 'md5', type: 'String', description: 'Token identifier hash' },
            { name: 'time', type: 'Date', description: 'Price timestamp' }
          ]}
        />

        <Divider sx={{ my: 4 }} />

        {/* GraphDB Collections Section */}
        <Typography variant="h2" gutterBottom sx={{ color: '#25A768', mb: 3 }}>
          GraphDB Collections
        </Typography>

        <Typography variant="body1" paragraph>
          GraphDB stores chart data across multiple timeframes, enabling comprehensive technical
          analysis and price visualization with support for multiple fiat currencies.
        </Typography>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Timeframe Collections
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={2}>
                <Paper sx={{ p: 1, textAlign: 'center' }}>
                  <Typography variant="body2" color="primary.main">
                    ALL
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={2}>
                <Paper sx={{ p: 1, textAlign: 'center' }}>
                  <Typography variant="body2" color="primary.main">
                    1Y
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={2}>
                <Paper sx={{ p: 1, textAlign: 'center' }}>
                  <Typography variant="body2" color="primary.main">
                    3M
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={2}>
                <Paper sx={{ p: 1, textAlign: 'center' }}>
                  <Typography variant="body2" color="primary.main">
                    1M
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={2}>
                <Paper sx={{ p: 1, textAlign: 'center' }}>
                  <Typography variant="body2" color="primary.main">
                    7D
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={2}>
                <Paper sx={{ p: 1, textAlign: 'center' }}>
                  <Typography variant="body2" color="primary.main">
                    1D
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={2}>
                <Paper sx={{ p: 1, textAlign: 'center' }}>
                  <Typography variant="body2" color="primary.main">
                    SPARK
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={2}>
                <Paper sx={{ p: 1, textAlign: 'center' }}>
                  <Typography variant="body2" color="primary.main">
                    1MIN
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <FieldTable
          title="GraphDB Collection Structure"
          fields={[
            { name: '_id', type: 'ObjectId', description: 'Document identifier' },
            { name: 'md5', type: 'String', description: 'Token identifier hash' },
            { name: 'exch', type: 'Number', description: 'Exchange rate' },
            { name: 'usd', type: 'Number', description: 'USD price' },
            { name: 'volume', type: 'Number', description: 'Trading volume' },
            { name: 'time', type: 'Date', description: 'Chart point timestamp' },
            { name: 'utime', type: 'Number', description: 'Unix timestamp' },
            { name: 'eur', type: 'Number', description: 'EUR converted price' },
            { name: 'jpy', type: 'Number', description: 'JPY converted price' },
            { name: 'cny', type: 'Number', description: 'CNY converted price' }
          ]}
        />

        <Alert severity="info" sx={{ mt: 2, mb: 4 }}>
          <Typography variant="body2">
            <strong>Multi-Currency Support:</strong> GraphDB collections include converted prices
            for EUR, JPY, and CNY to support international users and global market analysis.
          </Typography>
        </Alert>

        <Divider sx={{ my: 4 }} />

        {/* GraphIssuesDB Collections Section */}
        <Typography variant="h2" gutterBottom sx={{ color: '#25A768', mb: 3 }}>
          GraphIssuesDB Collections
        </Typography>

        <Typography variant="body1" paragraph>
          GraphIssuesDB maintains the same structure as GraphDB collections but stores data for
          tokens with failed metric lookups or processing issues, ensuring no data is lost during
          system operations.
        </Typography>

        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Fallback System:</strong> GraphIssuesDB serves as a backup system for tokens
            that encounter processing issues, maintaining data integrity across all timeframes.
          </Typography>
        </Alert>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Same Timeframe Structure as GraphDB
            </Typography>
            <Typography variant="body2" paragraph>
              GraphIssuesDB collections mirror the GraphDB timeframe structure (ALL, 1Y, 3M, 1M, 7D,
              1D, SPARK, 1MIN) with identical field schemas.
            </Typography>
          </CardContent>
        </Card>

        <FieldTable
          title="GraphIssuesDB Collection Structure"
          fields={[
            { name: '_id', type: 'ObjectId', description: 'Document identifier' },
            { name: 'md5', type: 'String', description: 'Token identifier hash' },
            { name: 'exch', type: 'Number', description: 'Exchange rate' },
            { name: 'usd', type: 'Number', description: 'USD price' },
            { name: 'volume', type: 'Number', description: 'Trading volume' },
            { name: 'time', type: 'Date', description: 'Chart point timestamp' },
            { name: 'utime', type: 'Number', description: 'Unix timestamp' },
            { name: 'eur', type: 'Number', description: 'EUR converted price' },
            { name: 'jpy', type: 'Number', description: 'JPY converted price' },
            { name: 'cny', type: 'Number', description: 'CNY converted price' }
          ]}
        />

        <Divider sx={{ my: 4 }} />

        {/* HistoryDB Collections Section */}
        <Typography variant="h2" gutterBottom sx={{ color: '#25A768', mb: 3 }}>
          HistoryDB Collections
        </Typography>

        <Typography variant="body1" paragraph>
          HistoryDB maintains comprehensive trading history with individual token collections and
          aggregate views across different timeframes.
        </Typography>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5">Individual Token Collections</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph color="text.secondary">
              Each token has its own collection identified by MD5 hash, containing detailed
              transaction history.
            </Typography>
            <FieldTable
              title="Token-Specific History"
              fields={[
                { name: '_id', type: 'ObjectId', description: 'Transaction identifier' },
                { name: 'maker', type: 'String', description: 'Maker account address' },
                { name: 'taker', type: 'String', description: 'Taker account address' },
                { name: 'seq', type: 'Number', description: 'Sequence number' },
                { name: 'pair', type: 'String', description: 'Trading pair identifier' },
                { name: 'paid', type: 'Object', description: 'Amount paid in transaction' },
                { name: 'got', type: 'Object', description: 'Amount received in transaction' },
                { name: 'ledger', type: 'Number', description: 'Ledger index' },
                { name: 'hash', type: 'String', description: 'Transaction hash' },
                { name: 'time', type: 'Date', description: 'Transaction timestamp' },
                { name: 'isAMM', type: 'Boolean', description: 'AMM transaction flag' }
              ]}
            />
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5">ALL Collection</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph color="text.secondary">
              Aggregate collection containing all trading history across all tokens.
            </Typography>
            <FieldTable
              title="All Transactions History"
              fields={[
                { name: '_id', type: 'ObjectId', description: 'Primary identifier' },
                { name: '_id2', type: 'ObjectId', description: 'Secondary identifier' },
                { name: '_id3', type: 'ObjectId', description: 'Tertiary identifier' },
                { name: '_id4', type: 'ObjectId', description: 'Quaternary identifier' },
                { name: 'maker', type: 'String', description: 'Maker account' },
                { name: 'taker', type: 'String', description: 'Taker account' },
                { name: 'seq', type: 'Number', description: 'Sequence number' },
                { name: 'pair', type: 'String', description: 'Trading pair' },
                { name: 'paid', type: 'Object', description: 'Payment amount' },
                { name: 'got', type: 'Object', description: 'Received amount' },
                { name: 'ledger', type: 'Number', description: 'Ledger index' },
                { name: 'hash', type: 'String', description: 'Transaction hash' },
                { name: 'time', type: 'Date', description: 'Transaction time' },
                { name: 'isAMM', type: 'Boolean', description: 'AMM flag' }
              ]}
            />
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5">1D and 7D Collections</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph color="text.secondary">
              Time-windowed collections for recent trading activity analysis.
            </Typography>
            <FieldTable
              title="Short-Term History"
              fields={[
                { name: '_id', type: 'ObjectId', description: 'Document identifier' },
                { name: 'maker', type: 'String', description: 'Maker account' },
                { name: 'taker', type: 'String', description: 'Taker account' },
                { name: 'curr1', type: 'String', description: 'First currency' },
                { name: 'curr2', type: 'String', description: 'Second currency' },
                { name: 'pair', type: 'String', description: 'Trading pair' },
                { name: 'hash', type: 'String', description: 'Transaction hash' },
                { name: 'ledger', type: 'Number', description: 'Ledger index' },
                { name: 'time', type: 'Date', description: 'Transaction time' },
                { name: 'md5', type: 'String', description: 'Token hash' },
                { name: 'isAMM', type: 'Boolean', description: 'AMM transaction flag' }
              ]}
            />
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ my: 4 }} />

        {/* State Management Collections Section */}
        <Typography variant="h2" gutterBottom sx={{ color: '#25A768', mb: 3 }}>
          State Management Collections
        </Typography>

        <Typography variant="body1" paragraph>
          The TX module maintains several collections to track the current state of XRPL accounts,
          offers, and trust lines.
        </Typography>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5">Accounts Collection</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph color="text.secondary">
              Stores account data parsed from parseAccountInfo() with various account fields.
            </Typography>
            <FieldTable
              title="Account Information"
              fields={[
                { name: '_id', type: 'ObjectId', description: 'Document identifier' },
                { name: 'account', type: 'String', description: 'Account address' },
                { name: 'balance', type: 'String', description: 'XRP balance' },
                { name: 'flags', type: 'Number', description: 'Account flags' }
              ]}
            />
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Additional fields from parseAccountInfo() include sequence numbers, reserve amounts,
                and other account-specific data.
              </Typography>
            </Alert>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5">Accounts24h Collection (TxDB)</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph color="text.secondary">
              Tracks recent account activity within 24-hour windows.
            </Typography>
            <FieldTable
              title="Recent Account Activity"
              fields={[
                { name: '_id', type: 'ObjectId', description: 'Document identifier' },
                { name: 'address', type: 'String', description: 'Account address' },
                { name: 'type', type: 'String', description: 'Activity type' },
                { name: 'time', type: 'Date', description: 'Activity timestamp' }
              ]}
            />
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5">Offers Collection</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph color="text.secondary">
              Maintains current state of all offers on the XRPL order book.
            </Typography>
            <FieldTable
              title="Offer Book Data"
              fields={[
                { name: '_id', type: 'ObjectId', description: 'Document identifier' },
                { name: 'status', type: 'String', description: 'Offer status' },
                { name: 'account', type: 'String', description: 'Offer creator account' },
                { name: 'seq', type: 'Number', description: 'Sequence number' },
                { name: 'chash', type: 'String', description: 'Creation hash' },
                { name: 'ctime', type: 'Date', description: 'Creation time' },
                { name: 'mhash', type: 'String', description: 'Modification hash' },
                { name: 'dhash', type: 'String', description: 'Deletion hash' },
                { name: 'gets', type: 'Object', description: 'Amount to receive' },
                { name: 'pays', type: 'Object', description: 'Amount to pay' },
                { name: 'pair', type: 'String', description: 'Trading pair' }
              ]}
            />
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5">Trusts Collection</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph color="text.secondary">
              Tracks trust line states between accounts for all tokens.
            </Typography>
            <FieldTable
              title="Trust Line Information"
              fields={[
                { name: '_id', type: 'ObjectId', description: 'Primary identifier' },
                { name: '_id2', type: 'ObjectId', description: 'Secondary identifier' },
                { name: '_token1', type: 'String', description: 'First token identifier' },
                { name: '_token2', type: 'String', description: 'Second token identifier' },
                { name: '_currency', type: 'String', description: 'Currency code' },
                { name: 'HighLimit', type: 'Object', description: 'High limit settings' },
                { name: 'LowLimit', type: 'Object', description: 'Low limit settings' },
                { name: 'Balance', type: 'Object', description: 'Current balance' },
                { name: 'hash', type: 'String', description: 'Trust line hash' },
                { name: 'time', type: 'Date', description: 'Last update time' }
              ]}
            />
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5">Trusts_24h Collection</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph color="text.secondary">
              Extended trust line data with 24-hour change tracking.
            </Typography>
            <FieldTable
              title="Recent Trust Line Changes"
              fields={[
                { name: 'id', type: 'String', description: 'Trust line identifier' },
                { name: 'id2', type: 'String', description: 'Secondary identifier' },
                { name: 'status', type: 'String', description: 'Change status' },
                { name: 'BalancePrevious', type: 'Object', description: 'Previous balance state' }
              ]}
            />
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Inherits all fields from trusts collection plus additional change tracking fields.
              </Typography>
            </Alert>
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ my: 4 }} />

        {/* Additional Collections Section */}
        <Typography variant="h2" gutterBottom sx={{ color: '#25A768', mb: 3 }}>
          Additional Collections
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Token_Date Collection
                </Typography>
                <Typography variant="body2" paragraph>
                  Tracks token registration and discovery dates.
                </Typography>
                <FieldTable
                  title="Token Registration Data"
                  fields={[
                    { name: '_id', type: 'ObjectId', description: 'Document identifier' },
                    { name: 'issuer', type: 'String', description: 'Token issuer' },
                    { name: 'currency', type: 'String', description: 'Currency code' },
                    { name: 'name', type: 'String', description: 'Token name' },
                    { name: 'md5', type: 'String', description: 'Token hash' },
                    { name: 'xrplto', type: 'String', description: 'XRPL.to identifier' },
                    { name: 'hash', type: 'String', description: 'Registration hash' },
                    { name: 'time', type: 'Date', description: 'Registration timestamp' }
                  ]}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Ledgers Collection (TxDB)
                </Typography>
                <Typography variant="body2" paragraph>
                  Stores ledger-level statistics and metrics.
                </Typography>
                <FieldTable
                  title="Ledger Statistics"
                  fields={[
                    { name: '_id', type: 'ObjectId', description: 'Document identifier' },
                    { name: 'exchs', type: 'Number', description: 'Exchange count' },
                    { name: 'offers', type: 'Number', description: 'Offers count' },
                    { name: 'trusts', type: 'Number', description: 'Trust lines count' },
                    { name: 'accounts', type: 'Number', description: 'Accounts count' },
                    { name: 'total_coins', type: 'String', description: 'Total XRP supply' },
                    { name: 'close_time', type: 'Number', description: 'Ledger close time' },
                    {
                      name: 'close_time_human',
                      type: 'String',
                      description: 'Human-readable close time'
                    }
                  ]}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Alert severity="success" sx={{ mt: 4 }}>
          <Typography variant="body2">
            <strong>Real-Time Architecture:</strong> The TX module's multi-database architecture
            ensures optimal performance for different query patterns while maintaining data
            consistency across all collections.
          </Typography>
        </Alert>

        <Divider sx={{ my: 4 }} />

        {/* TokenData Module Section */}
        <Typography variant="h1" gutterBottom sx={{ color: '#25A768', mb: 4 }}>
          TokenData.js Module
        </Typography>

        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h3" gutterBottom>
              Token Metadata Enrichment System
            </Typography>
            <Typography variant="body1" paragraph>
              The TokenData.js module acts as a comprehensive token enrichment system, pulling
              metadata from multiple decentralized and centralized sources to provide complete token
              profiles. It integrates with various platforms including FirstLedger, Magnetic X,
              XPMarket, xrp.fun, and LedgerMeme to gather logos, social links, descriptions, and
              platform-specific tags.
            </Typography>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                This module processes token data from <strong>5+ external platforms</strong> with
                advanced features including TOML validation, logo processing, blackhole
                verification, and Tor proxy usage for privacy.
              </Typography>
            </Alert>
          </CardContent>
        </Card>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <DataUsageIcon sx={{ color: '#25A768', mr: 1 }} />
                  <Typography variant="h5">Multi-Platform Integration</Typography>
                </Box>
                <Typography variant="body2">
                  Integrates with FirstLedger, Magnetic X, XPMarket, xrp.fun, and LedgerMeme
                  platforms to gather comprehensive token metadata.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <StorageIcon sx={{ color: '#25A768', mr: 1 }} />
                  <Typography variant="h5">Advanced Processing</Typography>
                </Box>
                <Typography variant="body2">
                  Features TOML validation, image processing with WebP conversion, domain
                  extraction, and blackhole verification for security.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <AnalyticsIcon sx={{ color: '#25A768', mr: 1 }} />
                  <Typography variant="h5">Real-Time Monitoring</Typography>
                </Box>
                <Typography variant="body2">
                  Monitors for new tokens every 5 seconds, with external API monitoring every 30-60
                  seconds and periodic full syncs every 2 hours.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <TrendingUpIcon sx={{ color: '#25A768', mr: 1 }} />
                  <Typography variant="h5">Privacy & Security</Typography>
                </Box>
                <Typography variant="body2">
                  Uses Tor proxy (torsocks) for all external requests, implements rate limiting, and
                  performs comprehensive validation checks.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Typography variant="h4" gutterBottom sx={{ mt: 4, mb: 3 }}>
          Data Sources & Platforms
        </Typography>

        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
              <Typography variant="h6" color="primary.main">
                FirstLedger
              </Typography>
              <Typography variant="body2" color="text.secondary">
                TOML validation from .toml.firstledger.net
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
              <Typography variant="h6" color="primary.main">
                Magnetic X
              </Typography>
              <Typography variant="body2" color="text.secondary">
                API integration with project details
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
              <Typography variant="h6" color="primary.main">
                XPMarket
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Meme token pool API integration
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
              <Typography variant="h6" color="primary.main">
                xrp.fun
              </Typography>
              <Typography variant="body2" color="text.secondary">
                IPFS image processing
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
              <Typography variant="h6" color="primary.main">
                LedgerMeme
              </Typography>
              <Typography variant="body2" color="text.secondary">
                TOML validation from .toml.ledger.meme
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Enhanced Tokens Collection for TokenData */}
        <Typography variant="h2" gutterBottom sx={{ color: '#25A768', mb: 3 }}>
          Enhanced Tokens Collection (TokenData)
        </Typography>

        <Typography variant="body1" paragraph>
          The TokenData module significantly enhances the tokens collection with rich metadata from
          external platforms, social media links, and processed assets.
        </Typography>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5">Token Metadata Fields</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FieldTable
              title="Core Metadata"
              fields={[
                {
                  name: 'origin',
                  type: 'String',
                  description:
                    'Platform origin (FirstLedger, Magnetic X, XPMarket, xrp.fun, LedgerMeme)'
                },
                {
                  name: 'isOMCF',
                  type: 'String',
                  description: 'OMCF validation status (yes/removed based on validation)'
                },
                {
                  name: 'lastUpdated',
                  type: 'Date',
                  description: 'Timestamp of last metadata update'
                },
                {
                  name: 'user',
                  type: 'String',
                  description: 'Project name/title from external sources'
                },
                {
                  name: 'domain',
                  type: 'String',
                  description: 'Domain extracted from websites/TOML files'
                },
                {
                  name: 'ext',
                  type: 'String',
                  description: 'File extension (webp when logo is processed)'
                },
                { name: 'slug', type: 'String', description: 'Updated format: issuer-currency' }
              ]}
            />
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5">Social Media Links</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph color="text.secondary">
              Comprehensive social media integration with platform-specific formatting and
              validation.
            </Typography>
            <FieldTable
              title="Social Media Fields"
              fields={[
                {
                  name: 'social.twitter',
                  type: 'String',
                  description: 'Twitter handle without domain'
                },
                {
                  name: 'social.telegram',
                  type: 'String',
                  description: 'Telegram handle without t.me/'
                },
                { name: 'social.discord', type: 'String', description: 'Full Discord URL' },
                {
                  name: 'social.facebook',
                  type: 'String',
                  description: 'Facebook page/profile URL'
                },
                { name: 'social.instagram', type: 'String', description: 'Instagram profile URL' },
                { name: 'social.youtube', type: 'String', description: 'YouTube channel URL' },
                { name: 'social.tiktok', type: 'String', description: 'TikTok profile URL' },
                {
                  name: 'social.reddit',
                  type: 'String',
                  description: 'Reddit profile/subreddit URL'
                }
              ]}
            />
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5">External Data Integration</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FieldTable
              title="External Data Fields"
              fields={[
                { name: 'weblinks', type: 'Array', description: 'Array of links from TOML files' },
                {
                  name: 'tags',
                  type: 'Array',
                  description: 'Platform-specific tags automatically added'
                }
              ]}
            />
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Platform Tags:</strong> Each platform automatically adds specific tags:
                <br />• Magnetic X, XPMarket, FirstLedger, LedgerMeme, xrp.fun → ['Platform Name',
                'Memes']
              </Typography>
            </Alert>
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ my: 4 }} />

        {/* Description Collection Section */}
        <Typography variant="h2" gutterBottom sx={{ color: '#25A768', mb: 3 }}>
          Description Collection
        </Typography>

        <Typography variant="body1" paragraph>
          The description collection stores detailed token descriptions gathered from TOML files and
          API sources, providing rich context for each token.
        </Typography>

        <FieldTable
          title="Description Collection Structure"
          fields={[
            { name: '_id', type: 'String', description: 'Token MD5 hash identifier' },
            {
              name: 'description',
              type: 'String',
              description: 'Token description from TOML/API sources'
            },
            { name: 'time', type: 'Date', description: 'Timestamp of description update' }
          ]}
        />

        <Alert severity="info" sx={{ mt: 2, mb: 4 }}>
          <Typography variant="body2">
            Descriptions are sourced from validated TOML files and verified API endpoints, ensuring
            accuracy and authenticity of token information.
          </Typography>
        </Alert>

        <Divider sx={{ my: 4 }} />

        {/* Key Operations Section */}
        <Typography variant="h2" gutterBottom sx={{ color: '#25A768', mb: 3 }}>
          Key Operations
        </Typography>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5">Token Origin Processing</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              Specialized processing for each platform with validation and metadata extraction:
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary.main">
                    FirstLedger Tokens
                  </Typography>
                  <Typography variant="body2">
                    TOML validation from .toml.firstledger.net domains with comprehensive metadata
                    extraction
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary.main">
                    LedgerMeme Tokens
                  </Typography>
                  <Typography variant="body2">
                    TOML validation from .toml.ledger.meme domains with meme-specific categorization
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary.main">
                    xrp.fun Tokens
                  </Typography>
                  <Typography variant="body2">
                    IPFS image processing from brown-binding-rodent-444 domains with logo extraction
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary.main">
                    Magnetic X & XPMarket
                  </Typography>
                  <Typography variant="body2">
                    API integration for project details, meme token pools, and social media data
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5">Logo/Image Processing</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              Advanced image processing pipeline with privacy and optimization features:
            </Typography>
            <Box component="ul" sx={{ pl: 3 }}>
              <Typography component="li" variant="body2" paragraph>
                <strong>Secure Download:</strong> Downloads logos from external sources using
                torsocks curl for privacy
              </Typography>
              <Typography component="li" variant="body2" paragraph>
                <strong>Format Conversion:</strong> Converts images to WebP format using Sharp for
                optimal file sizes
              </Typography>
              <Typography component="li" variant="body2" paragraph>
                <strong>File Management:</strong> Saves to
                /usr/src/files.xrpl.to/token/&#123;md5&#125; directory structure
              </Typography>
              <Typography component="li" variant="body2" paragraph>
                <strong>Database Updates:</strong> Updates ext field to 'webp' on successful
                processing
              </Typography>
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5">Validation & Security</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              Comprehensive security and validation measures:
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom color="success.main">
                    Blackhole Verification
                  </Typography>
                  <Typography variant="body2">
                    Checks for disabled master keys + special regular keys to verify token security
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom color="info.main">
                    TOML Validation
                  </Typography>
                  <Typography variant="body2">
                    Ensures issuer/currency match before processing to prevent data corruption
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom color="warning.main">
                    Rate Limiting
                  </Typography>
                  <Typography variant="body2">
                    Random delays between API calls to avoid detection and respect rate limits
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Domain Extraction:</strong> Converts hex domains from XRPL account data to
                readable format
              </Typography>
            </Box>
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ my: 4 }} />

        {/* Processing Modes Section */}
        <Typography variant="h2" gutterBottom sx={{ color: '#25A768', mb: 3 }}>
          Processing Modes
        </Typography>

        <Typography variant="body1" paragraph>
          The TokenData module operates in multiple processing modes to ensure comprehensive and
          timely token metadata updates.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Chip label="5 seconds" color="error" sx={{ mr: 2 }} />
                  <Typography variant="h6">Real-Time Monitoring</Typography>
                </Box>
                <Typography variant="body2">
                  Monitors for recent tokens (50 newest) to ensure immediate metadata processing for
                  new listings.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Chip label="30-60 seconds" color="warning" sx={{ mr: 2 }} />
                  <Typography variant="h6">External API Monitoring</Typography>
                </Box>
                <Typography variant="body2">
                  Checks external APIs for new tokens and metadata updates with intelligent rate
                  limiting.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Chip label="Startup" color="info" sx={{ mr: 2 }} />
                  <Typography variant="h6">Background Processing</Typography>
                </Box>
                <Typography variant="body2">
                  Performs full token validation on startup to ensure database consistency and
                  completeness.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Chip label="2 hours" color="success" sx={{ mr: 2 }} />
                  <Typography variant="h6">Periodic Refresh</Typography>
                </Box>
                <Typography variant="body2">
                  Complete external API sync to catch any missed updates and refresh existing
                  metadata.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Special Features Section */}
        <Typography variant="h2" gutterBottom sx={{ color: '#25A768', mb: 3 }}>
          Special Features
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Currency Format Handling
                </Typography>
                <Typography variant="body2" paragraph>
                  Advanced currency code processing with seamless conversion between plain text and
                  hex formats.
                </Typography>
                <Box component="ul" sx={{ pl: 3 }}>
                  <Typography component="li" variant="body2">
                    Automatic detection of currency format
                  </Typography>
                  <Typography component="li" variant="body2">
                    Bidirectional conversion support
                  </Typography>
                  <Typography component="li" variant="body2">
                    Validation of currency code integrity
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Slug Format Updates
                </Typography>
                <Typography variant="body2" paragraph>
                  Modern slug generation replacing MD5-based identifiers with readable
                  issuer-currency format.
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Typography variant="body2">
                      <strong>Old:</strong> a1b2c3d4e5f6...
                      <br />
                      <strong>New:</strong> rIssuerAddress-USD
                    </Typography>
                  </Paper>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Conditional Updates
                </Typography>
                <Typography variant="body2" paragraph>
                  Intelligent update logic that preserves data integrity and platform priorities.
                </Typography>
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>FirstLedger Priority:</strong> Preserves FirstLedger origin when tokens
                    exist in multiple platforms, ensuring authoritative source precedence.
                  </Typography>
                </Alert>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Tor Proxy Usage
                </Typography>
                <Typography variant="body2" paragraph>
                  Enhanced privacy and security through Tor network routing for all external
                  requests.
                </Typography>
                <Box component="ul" sx={{ pl: 3 }}>
                  <Typography component="li" variant="body2">
                    Uses torsocks for all external requests
                  </Typography>
                  <Typography component="li" variant="body2">
                    Protects server IP from external services
                  </Typography>
                  <Typography component="li" variant="body2">
                    Ensures anonymity during data collection
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Alert severity="success" sx={{ mt: 4 }}>
          <Typography variant="body2">
            <strong>Comprehensive Enrichment:</strong> The TokenData module provides the most
            comprehensive token metadata collection system in the XRPL ecosystem, integrating data
            from 5+ platforms with advanced security and privacy features.
          </Typography>
        </Alert>

        <Divider sx={{ my: 4 }} />

        {/* AmmData Module Section */}
        <Typography variant="h1" gutterBottom sx={{ color: '#25A768', mb: 4 }}>
          AmmData.js Module
        </Typography>

        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h3" gutterBottom>
              AMM Data Processing & TVL Management System
            </Typography>
            <Typography variant="body1" paragraph>
              The AmmData.js module serves as a comprehensive AMM (Automated Market Maker) data
              processor that maintains real-time TVL (Total Value Locked) calculations, validates
              token eligibility for inclusion in metrics, and provides AMM pool information. It
              ensures data consistency and system reliability through robust error handling and
              performance optimization.
            </Typography>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                This module processes <strong>AMM pool data in real-time</strong> with advanced
                features including TVL calculations, token qualification criteria, liquidity
                validation, and atomic global TVL management.
              </Typography>
            </Alert>
          </CardContent>
        </Card>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <TrendingUpIcon sx={{ color: '#25A768', mr: 1 }} />
                  <Typography variant="h5">Real-Time TVL Processing</Typography>
                </Box>
                <Typography variant="body2">
                  Calculates Total Value Locked by analyzing XRP liquidity and token pool values
                  across all AMM pools with continuous updates.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <AnalyticsIcon sx={{ color: '#25A768', mr: 1 }} />
                  <Typography variant="h5">Token Qualification System</Typography>
                </Box>
                <Typography variant="body2">
                  Implements sophisticated criteria for token qualification including holder counts,
                  liquidity thresholds, and AMM pool validation.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <DataUsageIcon sx={{ color: '#25A768', mr: 1 }} />
                  <Typography variant="h5">Performance Optimization</Typography>
                </Box>
                <Typography variant="body2">
                  Features batch processing, connection pooling, garbage collection, and optimized
                  database indexes for maximum efficiency.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <StorageIcon sx={{ color: '#25A768', mr: 1 }} />
                  <Typography variant="h5">Global TVL Management</Typography>
                </Box>
                <Typography variant="body2">
                  Maintains atomic updates with delta-based calculations and automatic error
                  recovery for consistent global metrics.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Typography variant="h4" gutterBottom sx={{ mt: 4, mb: 3 }}>
          Core AMM Operations
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom color="primary.main">
                AMM Pool Analysis
              </Typography>
              <Typography variant="body2">
                Comprehensive analysis of AMM pools including TVL calculation, price discovery, and
                liquidity validation with minimum thresholds.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom color="primary.main">
                Token Qualification
              </Typography>
              <Typography variant="body2">
                Advanced criteria system for determining token eligibility with holder requirements,
                liquidity minimums, and currency filtering.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom color="primary.main">
                Real-Time Updates
              </Typography>
              <Typography variant="body2">
                Multi-tier update system processing newest tokens every 5 seconds and recent changes
                every 10 seconds with full scans.
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Enhanced Tokens Collection for AmmData */}
        <Typography variant="h2" gutterBottom sx={{ color: '#25A768', mb: 3 }}>
          Enhanced Tokens Collection (AmmData)
        </Typography>

        <Typography variant="body1" paragraph>
          The AmmData module extends the tokens collection with AMM-specific fields for TVL
          tracking, pool management, and qualification status.
        </Typography>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5">AMM-Specific Fields</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FieldTable
              title="AMM Pool Data"
              fields={[
                {
                  name: 'tvl',
                  type: 'Number',
                  description: 'Total Value Locked in XRP equivalent'
                },
                { name: 'AMM', type: 'String', description: 'AMM account address for the pool' },
                { name: 'exch', type: 'Number', description: 'XRP exchange rate/price per token' }
              ]}
            />
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5">Status Management</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph color="text.secondary">
              Comprehensive status tracking for AMM processing and validation states.
            </Typography>
            <FieldTable
              title="Status Fields"
              fields={[
                {
                  name: 'isOMCF',
                  type: 'String',
                  description: 'Qualification status (yes/removed based on AMM validation)'
                },
                {
                  name: 'updateStatus',
                  type: 'String',
                  description: 'Processing status (updating/complete/null)'
                },
                {
                  name: 'lastUpdated',
                  type: 'Date',
                  description: 'Timestamp of last AMM data update'
                }
              ]}
            />
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ my: 4 }} />

        {/* Enhanced Metrics Collection for AmmData */}
        <Typography variant="h2" gutterBottom sx={{ color: '#25A768', mb: 3 }}>
          Enhanced Metrics Collection (AmmData)
        </Typography>

        <Typography variant="body1" paragraph>
          The AmmData module adds global AMM metrics to the metrics collection for platform-wide TVL
          tracking and status management.
        </Typography>

        <FieldTable
          title="Global AMM Metrics"
          fields={[
            {
              name: 'totalTVL',
              type: 'Number',
              description: 'Sum of all token TVL values across all AMM pools'
            },
            {
              name: 'updateStatus',
              type: 'String',
              description: 'Global update status (updating/complete/null)'
            },
            {
              name: 'lastUpdated',
              type: 'Date',
              description: 'Timestamp of last global TVL update'
            }
          ]}
        />

        <Alert severity="info" sx={{ mt: 2, mb: 4 }}>
          <Typography variant="body2">
            <strong>Atomic Updates:</strong> Global TVL calculations use delta-based updates to
            ensure consistency and prevent race conditions during concurrent processing.
          </Typography>
        </Alert>

        <Divider sx={{ my: 4 }} />

        {/* Key Operations Section */}
        <Typography variant="h2" gutterBottom sx={{ color: '#25A768', mb: 3 }}>
          Key Operations
        </Typography>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5">AMM Pool Analysis</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              Comprehensive analysis of AMM pools with multiple validation and calculation layers:
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary.main">
                    TVL Calculation
                  </Typography>
                  <Typography variant="body2">
                    Calculates Total Value Locked by combining XRP liquidity with token pool value
                    converted to XRP equivalent
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary.main">
                    Price Discovery
                  </Typography>
                  <Typography variant="body2">
                    Determines XRP price per token from AMM pool ratios and current market
                    conditions
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary.main">
                    Liquidity Validation
                  </Typography>
                  <Typography variant="body2">
                    Ensures minimum 40 XRP liquidity requirement for pool qualification and
                    stability
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary.main">
                    Account Validation
                  </Typography>
                  <Typography variant="body2">
                    Verifies AMM account addresses and validates proper pool structure and
                    functionality
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5">Token Qualification (isOMCF)</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              Sophisticated criteria system for determining token qualification status:
            </Typography>

            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Criteria for Setting isOMCF: 'yes'</strong>
              </Typography>
            </Alert>

            <Box component="ul" sx={{ pl: 3, mb: 3 }}>
              <Typography component="li" variant="body2" paragraph>
                <strong>Minimum 30 holders:</strong> Token must have at least 30 unique holders
              </Typography>
              <Typography component="li" variant="body2" paragraph>
                <strong>Minimum 40 XRP liquidity:</strong> AMM pool must contain at least 40 XRP
              </Typography>
              <Typography component="li" variant="body2" paragraph>
                <strong>Active AMM pool exists:</strong> Valid and functional AMM pool required
              </Typography>
              <Typography component="li" variant="body2" paragraph>
                <strong>Currency validation:</strong> Currency code must not start with '03'
                (excludes NFTs)
              </Typography>
            </Box>

            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Protected Origins (View-Only):</strong> FirstLedger, XPMarket, Magnetic X,
                xrp.fun, LedgerMeme tokens only receive TVL/AMM data updates without isOMCF status
                changes.
              </Typography>
            </Alert>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5">Real-Time Processing</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              Multi-tier processing system for optimal performance and data freshness:
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom color="success.main">
                    Latest Token Updates
                  </Typography>
                  <Typography variant="body2">
                    Processes 10 newest tokens every 5 seconds for immediate AMM data availability
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom color="info.main">
                    Real-Time Updates
                  </Typography>
                  <Typography variant="body2">
                    Monitors recent token changes every 10 seconds for dynamic market conditions
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom color="warning.main">
                    Full Processing
                  </Typography>
                  <Typography variant="body2">
                    Complete token scan runs continuously to ensure comprehensive coverage
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom color="error.main">
                    Cleanup Jobs
                  </Typography>
                  <Typography variant="body2">
                    Stuck update status cleanup every 5 minutes to prevent processing deadlocks
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ my: 4 }} />

        {/* Memory & Performance Management Section */}
        <Typography variant="h2" gutterBottom sx={{ color: '#25A768', mb: 3 }}>
          Memory & Performance Management
        </Typography>

        <Typography variant="body1" paragraph>
          The AmmData module implements advanced performance optimization techniques to ensure
          efficient processing of large-scale AMM data.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Batch Processing
                </Typography>
                <Typography variant="body2" paragraph>
                  Processes tokens in batches of 10 for optimal memory efficiency and system
                  stability.
                </Typography>
                <Box component="ul" sx={{ pl: 3 }}>
                  <Typography component="li" variant="body2">
                    10 tokens per batch maximum
                  </Typography>
                  <Typography component="li" variant="body2">
                    Memory-efficient processing cycles
                  </Typography>
                  <Typography component="li" variant="body2">
                    Prevents system overload
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Connection Pooling
                </Typography>
                <Typography variant="body2" paragraph>
                  Maintains separate XRPL clients for different processes to optimize network usage.
                </Typography>
                <Box component="ul" sx={{ pl: 3 }}>
                  <Typography component="li" variant="body2">
                    Dedicated clients per process type
                  </Typography>
                  <Typography component="li" variant="body2">
                    Reduced connection overhead
                  </Typography>
                  <Typography component="li" variant="body2">
                    Improved reliability
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Garbage Collection
                </Typography>
                <Typography variant="body2" paragraph>
                  Forced cleanup between batches to maintain optimal memory usage patterns.
                </Typography>
                <Box component="ul" sx={{ pl: 3 }}>
                  <Typography component="li" variant="body2">
                    Automatic memory cleanup
                  </Typography>
                  <Typography component="li" variant="body2">
                    Prevents memory leaks
                  </Typography>
                  <Typography component="li" variant="body2">
                    Maintains system performance
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Index Optimization
                </Typography>
                <Typography variant="body2" paragraph>
                  Optimized database indexes for critical fields to ensure fast query performance.
                </Typography>
                <Box component="ul" sx={{ pl: 3 }}>
                  <Typography component="li" variant="body2">
                    Indexed: dateon, currency, issuer
                  </Typography>
                  <Typography component="li" variant="body2">
                    Fast query execution
                  </Typography>
                  <Typography component="li" variant="body2">
                    Reduced database load
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Global TVL Management Section */}
        <Typography variant="h2" gutterBottom sx={{ color: '#25A768', mb: 3 }}>
          Global TVL Management
        </Typography>

        <Typography variant="body1" paragraph>
          Advanced TVL management system ensuring data consistency and reliability across all AMM
          operations.
        </Typography>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5">Atomic Updates</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              Delta-based TVL calculations ensure atomic updates and prevent race conditions:
            </Typography>
            <Box component="ul" sx={{ pl: 3 }}>
              <Typography component="li" variant="body2" paragraph>
                <strong>Delta Calculations:</strong> Only updates changed values to minimize
                database operations
              </Typography>
              <Typography component="li" variant="body2" paragraph>
                <strong>Atomic Operations:</strong> Ensures consistency during concurrent updates
              </Typography>
              <Typography component="li" variant="body2" paragraph>
                <strong>Race Condition Prevention:</strong> Locks prevent simultaneous modifications
              </Typography>
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5">Recalculation & Recovery</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary.main">
                    Full TVL Recalculation
                  </Typography>
                  <Typography variant="body2">
                    Complete TVL recalculation from scratch on startup to ensure data accuracy and
                    consistency
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary.main">
                    Error Recovery
                  </Typography>
                  <Typography variant="body2">
                    Automatic status reset for stuck updates with comprehensive error handling and
                    recovery mechanisms
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ my: 4 }} />

        {/* Data Validation Section */}
        <Typography variant="h2" gutterBottom sx={{ color: '#25A768', mb: 3 }}>
          Data Validation
        </Typography>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5">AMM Requirements</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              Comprehensive validation ensures only qualified AMM pools are processed:
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom color="success.main">
                    Valid AMM Pool
                  </Typography>
                  <Typography variant="body2">
                    Must have both XRP and token reserves with proper pool structure
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom color="info.main">
                    Liquidity Thresholds
                  </Typography>
                  <Typography variant="body2">
                    Minimum liquidity requirements ensure pool stability and trading viability
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom color="warning.main">
                    Trading Capabilities
                  </Typography>
                  <Typography variant="body2">
                    Active trading capabilities verified through pool functionality testing
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom color="error.main">
                    Account Structures
                  </Typography>
                  <Typography variant="body2">
                    Proper account structures validated for AMM compliance and functionality
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5">Currency Filtering</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              Advanced filtering system ensures only valid tokens are processed:
            </Typography>
            <Box component="ul" sx={{ pl: 3 }}>
              <Typography component="li" variant="body2" paragraph>
                <strong>NFT Exclusion:</strong> Excludes currencies starting with '03' (likely NFTs)
              </Typography>
              <Typography component="li" variant="body2" paragraph>
                <strong>Positive Amounts:</strong> Requires positive token amounts for validation
              </Typography>
              <Typography component="li" variant="body2" paragraph>
                <strong>Holder Validation:</strong> Validates holder counts meet minimum
                requirements
              </Typography>
            </Box>
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ my: 4 }} />

        {/* Processing Modes Section */}
        <Typography variant="h2" gutterBottom sx={{ color: '#25A768', mb: 3 }}>
          Processing Modes
        </Typography>

        <Typography variant="body1" paragraph>
          The AmmData module operates in multiple processing modes to ensure comprehensive and
          timely AMM data updates with optimal performance.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Chip label="5 seconds" color="error" sx={{ mr: 2 }} />
                  <Typography variant="h6">Continuous Latest Updates</Typography>
                </Box>
                <Typography variant="body2">
                  Processes newest 10 tokens every 5 seconds to ensure immediate AMM data
                  availability for new listings.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Chip label="10 seconds" color="warning" sx={{ mr: 2 }} />
                  <Typography variant="h6">Real-Time Monitoring</Typography>
                </Box>
                <Typography variant="body2">
                  Monitors recently changed tokens every 10 seconds for dynamic market condition
                  updates.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Chip label="Continuous" color="info" sx={{ mr: 2 }} />
                  <Typography variant="h6">Full Token Scan</Typography>
                </Box>
                <Typography variant="body2">
                  Complete validation of all qualifying tokens runs continuously to ensure
                  comprehensive coverage.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Chip label="5 minutes" color="success" sx={{ mr: 2 }} />
                  <Typography variant="h6">Periodic Cleanup</Typography>
                </Box>
                <Typography variant="body2">
                  Cleanup operations every 5 minutes to reset stuck operations and maintain system
                  health.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Error Handling Section */}
        <Typography variant="h2" gutterBottom sx={{ color: '#25A768', mb: 3 }}>
          Error Handling & Reliability
        </Typography>

        <Typography variant="body1" paragraph>
          Comprehensive error handling and reliability features ensure continuous operation and data
          integrity.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Connection Management
                </Typography>
                <Typography variant="body2" paragraph>
                  Robust connection handling with automatic recovery capabilities.
                </Typography>
                <Box component="ul" sx={{ pl: 3 }}>
                  <Typography component="li" variant="body2">
                    Automatic XRPL reconnection
                  </Typography>
                  <Typography component="li" variant="body2">
                    Connection health monitoring
                  </Typography>
                  <Typography component="li" variant="body2">
                    Failover mechanisms
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Graceful Shutdown
                </Typography>
                <Typography variant="body2" paragraph>
                  Clean disconnection and resource cleanup during system shutdown.
                </Typography>
                <Box component="ul" sx={{ pl: 3 }}>
                  <Typography component="li" variant="body2">
                    Clean disconnection of all services
                  </Typography>
                  <Typography component="li" variant="body2">
                    Resource cleanup procedures
                  </Typography>
                  <Typography component="li" variant="body2">
                    State preservation
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Status Tracking
                </Typography>
                <Typography variant="body2" paragraph>
                  Prevents concurrent updates and ensures data consistency.
                </Typography>
                <Box component="ul" sx={{ pl: 3 }}>
                  <Typography component="li" variant="body2">
                    Prevents concurrent updates on same tokens
                  </Typography>
                  <Typography component="li" variant="body2">
                    Update status monitoring
                  </Typography>
                  <Typography component="li" variant="body2">
                    Deadlock prevention
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Recovery Mechanisms
                </Typography>
                <Typography variant="body2" paragraph>
                  Automatic cleanup and recovery from failed operations.
                </Typography>
                <Box component="ul" sx={{ pl: 3 }}>
                  <Typography component="li" variant="body2">
                    Automatic cleanup of failed operations
                  </Typography>
                  <Typography component="li" variant="body2">
                    Status reset procedures
                  </Typography>
                  <Typography component="li" variant="body2">
                    Data integrity verification
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Alert severity="success" sx={{ mt: 4 }}>
          <Typography variant="body2">
            <strong>Comprehensive AMM Processing:</strong> The AmmData module provides the most
            advanced AMM data processing system for XRPL, combining real-time TVL calculations,
            sophisticated token qualification, and robust performance optimization for reliable DeFi
            analytics.
          </Typography>
        </Alert>
      </Container>
    </ThemeProvider>
  );
};

export default BackendDocs;
