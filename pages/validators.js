import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  styled,
  Toolbar,
  useMediaQuery,
  Typography,
  Card,
  CardContent,
  Chip,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import Topbar from 'src/components/Topbar';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
import 'src/utils/i18n';

const OverviewWrapper = styled(Box)(
  ({ theme }) => `
    overflow: hidden;
    flex: 1;
    margin: 0;
    padding: 0;
    
    ${theme.breakpoints.down('md')} {
      margin: 0;
      padding: 0;
    }
`
);

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`
}));

const ValidatorCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
  '&:hover': {
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
  }
}));

function ValidatorsPage() {
  const [validators, setValidators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMobile = useMediaQuery('(max-width:600px)');

  useEffect(() => {
    async function fetchValidators() {
      try {
        const response = await fetch('https://api.xrpscan.com/api/v1/validatorregistry');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setValidators(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }

    fetchValidators();
  }, []);

  const formatLedgerIndex = (index) => {
    if (!index) return 'N/A';
    return new Intl.NumberFormat().format(index);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    } else if (diffInSeconds < 2592000) {
      const weeks = Math.floor(diffInSeconds / 604800);
      return `${weeks}w ago`;
    } else if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months}mo ago`;
    } else {
      const years = Math.floor(diffInSeconds / 31536000);
      return `${years}y ago`;
    }
  };

  const truncateKey = (key, length = 16) => {
    if (!key) return 'N/A';
    if (key.length <= length) return key;
    return `${key.substring(0, length / 2)}...${key.substring(key.length - length / 2)}`;
  };

  return (
    <OverviewWrapper>
      {!isMobile && <Toolbar id="back-to-top-anchor" />}
      {!isMobile ? <Topbar /> : ''}
      <Header />
      {isMobile ? <Topbar /> : ''}

      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            XRPL Validators
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Real-time information about active validators on the XRP Ledger network
          </Typography>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              Error loading validators: {error}
            </Alert>
          )}

          {!loading && !error && validators.length > 0 && (
            <>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" variant="body2">
                        Total Validators
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {validators.length}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" variant="body2">
                        Verified
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                        {validators.filter(v => v.meta?.verified).length}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" variant="body2">
                        With Domain
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {validators.filter(v => v.domain).length}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" variant="body2">
                        Network
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        Mainnet
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {isMobile ? (
                // Mobile view - Cards
                validators.map((validator, index) => (
                  <ValidatorCard key={index}>
                    <CardContent>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {validator.domain || 'Unknown Domain'}
                        </Typography>
                        {validator.meta?.verified && (
                          <Chip
                            icon={<CheckCircleIcon />}
                            label="Verified"
                            color="success"
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        )}
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Master Key
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 2, wordBreak: 'break-all' }}>
                        {validator.master_key}
                      </Typography>

                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Ledger Index
                          </Typography>
                          <Typography variant="body2">
                            {formatLedgerIndex(validator.ledger_index)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Last Seen
                          </Typography>
                          <Typography variant="body2">
                            {formatRelativeTime(validator.last_seen)}
                          </Typography>
                        </Grid>
                      </Grid>

                      {validator.server_version && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Version
                          </Typography>
                          <Typography variant="body2">
                            {validator.server_version.version_full || validator.server_version.version || 'N/A'}
                          </Typography>
                        </Box>
                      )}

                      {validator.unl && validator.unl.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            UNL
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                            {validator.unl.map((unl, i) => (
                              <Chip key={i} label={unl} size="small" variant="outlined" />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </ValidatorCard>
                ))
              ) : (
                // Desktop view - Table
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <StyledTableCell>Domain</StyledTableCell>
                        <StyledTableCell>Master Key</StyledTableCell>
                        <StyledTableCell>Status</StyledTableCell>
                        <StyledTableCell>Ledger Index</StyledTableCell>
                        <StyledTableCell>Last Seen</StyledTableCell>
                        <StyledTableCell>Version</StyledTableCell>
                        <StyledTableCell>UNL</StyledTableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {validators.map((validator, index) => (
                        <TableRow key={index} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {validator.domain ? (
                                <Link
                                  href={`https://${validator.domain}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  sx={{ textDecoration: 'none' }}
                                >
                                  {validator.domain}
                                </Link>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  Unknown
                                </Typography>
                              )}
                              {validator.meta?.verified && (
                                <CheckCircleIcon color="success" fontSize="small" />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                              title={validator.master_key}
                            >
                              {truncateKey(validator.master_key, 20)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {validator.meta?.verified ? (
                              <Chip label="Verified" color="success" size="small" />
                            ) : (
                              <Chip label="Unverified" color="default" size="small" />
                            )}
                          </TableCell>
                          <TableCell>{formatLedgerIndex(validator.ledger_index)}</TableCell>
                          <TableCell>
                            <Typography variant="body2" title={formatDate(validator.last_seen)}>
                              {formatRelativeTime(validator.last_seen)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {validator.server_version?.version || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {validator.unl && validator.unl.length > 0 ? (
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {validator.unl.map((unl, i) => (
                                  <Chip
                                    key={i}
                                    label={unl}
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontSize: '0.75rem' }}
                                  />
                                ))}
                              </Box>
                            ) : (
                              'N/A'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}

          {!loading && !error && validators.length === 0 && (
            <Alert severity="info">No validators found</Alert>
          )}
        </Box>
      </Container>

      <ScrollToTop />
      <Footer />
    </OverviewWrapper>
  );
}

export default ValidatorsPage;