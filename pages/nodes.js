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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  LinearProgress
} from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RouterIcon from '@mui/icons-material/Router';
import Topbar from 'src/components/Topbar';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';

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

const NodeCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
  '&:hover': {
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
  }
}));

const StatusChip = styled(Chip)(({ theme, status }) => ({
  fontWeight: 600,
  ...(status === 'online' && {
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.dark
  })
}));

function NodesPage() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMobile = useMediaQuery('(max-width:600px)');

  useEffect(() => {
    async function fetchNodes() {
      try {
        const response = await fetch('https://api.xrpscan.com/api/v1/nodes');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setNodes(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }

    fetchNodes();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchNodes, 30000);
    return () => clearInterval(interval);
  }, []);

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

  const formatUptime = (seconds) => {
    if (!seconds) return 'N/A';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const truncateKey = (key, length = 20) => {
    if (!key) return 'N/A';
    if (key.length <= length) return key;
    return `${key.substring(0, length / 2)}...${key.substring(key.length - length / 2)}`;
  };

  const getNodeStatus = (lastSeen) => {
    if (!lastSeen) return 'unknown';
    const date = new Date(lastSeen);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    // Consider online if seen within last 2 minutes
    return diffInSeconds < 120 ? 'online' : 'offline';
  };

  const onlineNodes = nodes.filter(node => getNodeStatus(node.last_seen) === 'online').length;
  const averageUptime = nodes.length > 0 
    ? Math.floor(nodes.reduce((acc, node) => acc + (node.uptime || 0), 0) / nodes.length)
    : 0;

  return (
    <OverviewWrapper>
      {!isMobile && <Toolbar id="back-to-top-anchor" />}
      {!isMobile ? <Topbar /> : ''}
      <Header />
      {isMobile ? <Topbar /> : ''}

      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            XRPL Nodes
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Real-time monitoring of XRP Ledger network nodes
          </Typography>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              Error loading nodes: {error}
            </Alert>
          )}

          {!loading && !error && nodes.length > 0 && (
            <>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <StorageIcon color="primary" sx={{ mr: 1 }} />
                        <Typography color="text.secondary" variant="body2">
                          Total Nodes
                        </Typography>
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {nodes.length}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <RouterIcon color="success" sx={{ mr: 1 }} />
                        <Typography color="text.secondary" variant="body2">
                          Online
                        </Typography>
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                        {onlineNodes}
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={(onlineNodes / nodes.length) * 100} 
                        sx={{ mt: 1, height: 4, borderRadius: 2 }}
                        color="success"
                      />
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <AccessTimeIcon color="info" sx={{ mr: 1 }} />
                        <Typography color="text.secondary" variant="body2">
                          Avg Uptime
                        </Typography>
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {formatUptime(averageUptime)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>
                        Latest Version
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {nodes[0]?.server_version || 'N/A'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {isMobile ? (
                // Mobile view - Cards
                nodes.map((node, index) => (
                  <NodeCard key={index}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                          {truncateKey(node.public_key, 16)}
                        </Typography>
                        <StatusChip
                          label={getNodeStatus(node.last_seen) === 'online' ? 'Online' : 'Offline'}
                          size="small"
                          status={getNodeStatus(node.last_seen)}
                        />
                      </Box>

                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Last Seen
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatRelativeTime(node.last_seen)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Uptime
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatUptime(node.uptime)}
                          </Typography>
                        </Grid>
                      </Grid>

                      {node.ip && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            IP Address
                          </Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {node.ip}{node.port ? `:${node.port}` : ''}
                          </Typography>
                        </Box>
                      )}

                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Version
                        </Typography>
                        <Typography variant="body2">
                          {node.version || 'N/A'}
                        </Typography>
                      </Box>

                      {node.complete_ledgers && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Ledgers
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                            {node.complete_ledgers}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </NodeCard>
                ))
              ) : (
                // Desktop view - Table
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <StyledTableCell>Public Key</StyledTableCell>
                        <StyledTableCell>Status</StyledTableCell>
                        <StyledTableCell>Last Seen</StyledTableCell>
                        <StyledTableCell>Uptime</StyledTableCell>
                        <StyledTableCell>IP Address</StyledTableCell>
                        <StyledTableCell>Version</StyledTableCell>
                        <StyledTableCell>Ledgers</StyledTableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {nodes.map((node, index) => (
                        <TableRow key={index} hover>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                              title={node.public_key}
                            >
                              {truncateKey(node.public_key, 24)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <StatusChip
                              label={getNodeStatus(node.last_seen) === 'online' ? 'Online' : 'Offline'}
                              size="small"
                              status={getNodeStatus(node.last_seen)}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" title={formatDate(node.last_seen)}>
                              {formatRelativeTime(node.last_seen)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatUptime(node.uptime)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {node.ip ? (
                              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                                {node.ip}{node.port ? `:${node.port}` : ''}
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                N/A
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {node.version || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                              {node.complete_ledgers || 'N/A'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}

          {!loading && !error && nodes.length === 0 && (
            <Alert severity="info">No nodes found</Alert>
          )}
        </Box>
      </Container>

      <ScrollToTop />
      <Footer />
    </OverviewWrapper>
  );
}

export default NodesPage;