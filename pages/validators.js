import React, { useState, useEffect } from 'react';
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
  Alert,
  Tabs,
  Tab,
  LinearProgress
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StorageIcon from '@mui/icons-material/Storage';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RouterIcon from '@mui/icons-material/Router';
import DnsIcon from '@mui/icons-material/Dns';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import Topbar from 'src/components/Topbar';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
import 'src/utils/i18n';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

const TabPanel = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

function ValidatorsPage() {
  const [validators, setValidators] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [serverVersions, setServerVersions] = useState([]);
  const [amendments, setAmendments] = useState([]);
  const [amendmentVotes, setAmendmentVotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [amendmentFilter, setAmendmentFilter] = useState('all'); // all, enabled, pending, voting
  const [expandedAmendment, setExpandedAmendment] = useState(null);
  const isMobile = useMediaQuery('(max-width:600px)');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Fetch all data in parallel
        const [validatorsRes, nodesRes, versionsRes, amendmentsRes] = await Promise.all([
          fetch('https://api.xrpscan.com/api/v1/validatorregistry'),
          fetch('https://api.xrpscan.com/api/v1/nodes'),
          fetch('https://api.xrpscan.com/api/v1/network/server_versions'),
          fetch('https://api.xrpscan.com/api/v1/amendments')
        ]);

        if (!validatorsRes.ok || !nodesRes.ok || !versionsRes.ok || !amendmentsRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const [validatorsData, nodesData, versionsData, amendmentsData] = await Promise.all([
          validatorsRes.json(),
          nodesRes.json(),
          versionsRes.json(),
          amendmentsRes.json()
        ]);

        setValidators(validatorsData || []);
        setNodes(nodesData || []);
        setServerVersions(versionsData || []);
        // Check if amendmentsData is an array or needs to be extracted
        const amendmentsList = Array.isArray(amendmentsData) ? amendmentsData : 
                               amendmentsData?.amendments ? amendmentsData.amendments : 
                               Object.values(amendmentsData || {});
        setAmendments(amendmentsList);
        
        // Extract actual voting data from validators
        const votesData = {};
        
        // Debug: Check the structure of validator votes
        if (validatorsData && validatorsData.length > 0) {
          console.log('Sample validator data:', validatorsData[0]);
          console.log('Sample votes structure:', validatorsData[0].votes);
        }
        
        for (const amendment of amendmentsList.filter(a => !a.enabled && a.count > 0)) {
          // Find validators that voted for this amendment
          const supportingValidators = validatorsData
            .filter(v => {
              // Check if validator has votes and amendments array
              if (v.votes && Array.isArray(v.votes.amendments)) {
                return v.votes.amendments.includes(amendment.amendment_id);
              }
              // Also check if votes is an object with amendments property
              if (v.votes && v.votes.amendments && Array.isArray(v.votes.amendments)) {
                return v.votes.amendments.includes(amendment.amendment_id);
              }
              return false;
            })
            .map(v => ({
              validator: v.master_key,
              domain: v.domain || null,
              domain_legacy: v.domain_legacy || null,
              verified: v.meta?.verified || false
            }));
          
          votesData[amendment.amendment_id] = supportingValidators;
          
          // If we found supporting validators, log them
          if (supportingValidators.length > 0) {
            console.log(`Found ${supportingValidators.length} validators supporting ${amendment.name}`);
          }
        }
        
        setAmendmentVotes(votesData);
        console.log('All amendment votes:', votesData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }

    fetchData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

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

  const truncateKey = (key, length = 16) => {
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

  // Calculate version distribution for chart
  const getVersionDistribution = () => {
    if (!nodes || nodes.length === 0) return [];

    const versionCounts = {};
    nodes.forEach(node => {
      const version = node.server_version || 'Unknown';
      versionCounts[version] = (versionCounts[version] || 0) + 1;
    });

    // Sort by version number and take top 10
    const sortedVersions = Object.entries(versionCounts)
      .sort((a, b) => {
        // Try to extract version numbers for proper sorting
        const versionA = a[0].match(/\d+\.\d+\.\d+/)?.[0] || a[0];
        const versionB = b[0].match(/\d+\.\d+\.\d+/)?.[0] || b[0];
        return versionB.localeCompare(versionA, undefined, { numeric: true });
      })
      .slice(0, 10);

    return sortedVersions.map(([version, count]) => ({
      name: version,
      value: count,
      percentage: ((count / nodes.length) * 100).toFixed(1)
    }));
  };

  const onlineNodes = nodes.filter(node => getNodeStatus(node.last_seen) === 'online').length;
  
  const versionData = getVersionDistribution();
  const COLORS = ['#4caf50', '#2196f3', '#ff9800', '#f44336', '#9c27b0', '#00bcd4', '#8bc34a', '#ffeb3b', '#795548', '#607d8b'];

  return (
    <OverviewWrapper>
      {!isMobile && <Toolbar id="back-to-top-anchor" />}
      {!isMobile ? <Topbar /> : ''}
      <Header />
      {isMobile ? <Topbar /> : ''}

      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            XRPL Network Infrastructure
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Real-time monitoring of validators and nodes on the XRP Ledger network
          </Typography>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              Error loading data: {error}
            </Alert>
          )}

          {!loading && !error && (
            <>
              {/* Summary Cards */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <DnsIcon color="primary" sx={{ mr: 1 }} />
                        <Typography color="text.secondary" variant="body2">
                          Total Validators
                        </Typography>
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {validators.length}
                      </Typography>
                      <Typography variant="body2" color="success.main">
                        {validators.filter(v => v.meta?.verified).length} verified
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <StorageIcon color="info" sx={{ mr: 1 }} />
                        <Typography color="text.secondary" variant="body2">
                          Total Nodes
                        </Typography>
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {nodes.length}
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={nodes.length > 0 ? (onlineNodes / nodes.length) * 100 : 0} 
                        sx={{ mt: 1, height: 4, borderRadius: 2 }}
                        color="success"
                      />
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <RouterIcon color="success" sx={{ mr: 1 }} />
                        <Typography color="text.secondary" variant="body2">
                          Amendments
                        </Typography>
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {amendments.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {amendments.filter(a => a.enabled).length} enabled
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <AccessTimeIcon color="info" sx={{ mr: 1 }} />
                        <Typography color="text.secondary" variant="body2">
                          Active Voting
                        </Typography>
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {amendments.filter(a => !a.enabled && a.count > 0).length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {amendments.filter(a => !a.enabled && !a.majority && a.count >= a.threshold * 0.75).length} near consensus
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Version Distribution Chart */}
              {nodes.length > 0 && (
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                          Server Version Distribution
                        </Typography>
                        <ResponsiveContainer width="100%" height={350}>
                          <PieChart>
                            <Pie
                              data={versionData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={2}
                              dataKey="value"
                              label={({ percentage }) => `${percentage}%`}
                            >
                              {versionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value) => [`${value} nodes`, 'Count']}
                            />
                            <Legend 
                              verticalAlign="bottom" 
                              height={36}
                              formatter={(value) => value.length > 20 ? `${value.substring(0, 20)}...` : value}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            Total Nodes
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 600 }}>
                            {nodes.length}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                          Available Versions
                        </Typography>
                        <Box sx={{ maxHeight: 350, overflow: 'auto' }}>
                          {serverVersions.map((version, index) => (
                            <Box 
                              key={index} 
                              sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                py: 1,
                                px: 2,
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                                '&:hover': {
                                  backgroundColor: 'action.hover'
                                }
                              }}
                            >
                              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                {version}
                              </Typography>
                              {index === 0 && (
                                <Chip label="Latest" size="small" color="success" />
                              )}
                              {index < 3 && index > 0 && (
                                <Chip label="Recent" size="small" color="info" />
                              )}
                            </Box>
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {/* Tabs */}
              <Paper sx={{ mb: 3 }}>
                <Tabs value={tabValue} onChange={handleTabChange} variant={isMobile ? "scrollable" : "fullWidth"} scrollButtons="auto">
                  <Tab label={`Validators (${validators.length})`} />
                  <Tab label={`Nodes (${nodes.length})`} />
                  <Tab label={`Amendments (${amendments.length})`} />
                </Tabs>
              </Paper>

              {/* Validators Tab */}
              <TabPanel value={tabValue} index={0}>
                {validators.length > 0 && (
                  <>
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
              </TabPanel>

              {/* Nodes Tab */}
              <TabPanel value={tabValue} index={1}>
                {nodes.length > 0 && (
                  <>
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
              </TabPanel>

              {/* Amendments Tab */}
              <TabPanel value={tabValue} index={2}>
                {amendments.length > 0 && (
                  <>
                    {/* Filter Buttons */}
                    <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={`All (${amendments.length})`}
                        onClick={() => setAmendmentFilter('all')}
                        color={amendmentFilter === 'all' ? 'primary' : 'default'}
                        variant={amendmentFilter === 'all' ? 'filled' : 'outlined'}
                      />
                      <Chip
                        label={`Enabled (${amendments.filter(a => a.enabled).length})`}
                        onClick={() => setAmendmentFilter('enabled')}
                        color={amendmentFilter === 'enabled' ? 'success' : 'default'}
                        variant={amendmentFilter === 'enabled' ? 'filled' : 'outlined'}
                      />
                      <Chip
                        label={`Pending (${amendments.filter(a => a.majority && !a.enabled).length})`}
                        onClick={() => setAmendmentFilter('pending')}
                        color={amendmentFilter === 'pending' ? 'warning' : 'default'}
                        variant={amendmentFilter === 'pending' ? 'filled' : 'outlined'}
                      />
                      <Chip
                        label={`Voting (${amendments.filter(a => !a.enabled && !a.majority).length})`}
                        onClick={() => setAmendmentFilter('voting')}
                        color={amendmentFilter === 'voting' ? 'info' : 'default'}
                        variant={amendmentFilter === 'voting' ? 'filled' : 'outlined'}
                      />
                    </Box>
                    {isMobile ? (
                      // Mobile view - Cards
                      amendments
                        .filter(a => {
                          if (amendmentFilter === 'all') return true;
                          if (amendmentFilter === 'enabled') return a.enabled;
                          if (amendmentFilter === 'pending') return a.majority && !a.enabled;
                          if (amendmentFilter === 'voting') return !a.enabled && !a.majority;
                          return true;
                        })
                        .sort((a, b) => {
                          // Sort by: enabled first, then by support percentage
                          if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
                          const aPercent = (a.count / a.threshold) * 100;
                          const bPercent = (b.count / b.threshold) * 100;
                          return bPercent - aPercent;
                        })
                        .map((amendment, index) => (
                        <Card key={index} sx={{ mb: 2 }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {amendment.name}
                              </Typography>
                              <Chip
                                label={amendment.enabled ? 'Enabled' : amendment.majority ? 'Pending' : 'Not Active'}
                                color={amendment.enabled ? 'success' : amendment.majority ? 'warning' : 'default'}
                                size="small"
                              />
                            </Box>
                            
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Amendment ID
                            </Typography>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', mb: 2, wordBreak: 'break-all' }}>
                              {amendment.amendment_id}
                            </Typography>

                            <Grid container spacing={2}>
                              <Grid item xs={4}>
                                <Typography variant="body2" color="text.secondary">
                                  Support
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {amendment.count}/{amendment.validations}
                                </Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="body2" color="text.secondary">
                                  Threshold
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {amendment.threshold}
                                </Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="body2" color="text.secondary">
                                  Version
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {amendment.introduced || 'N/A'}
                                </Typography>
                              </Grid>
                            </Grid>

                            {amendment.count > 0 && (
                              <Box sx={{ mt: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    Support Progress
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {((amendment.count / amendment.threshold) * 100).toFixed(0)}%
                                  </Typography>
                                </Box>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={Math.min((amendment.count / amendment.threshold) * 100, 100)}
                                  sx={{ height: 6, borderRadius: 3 }}
                                  color={amendment.count >= amendment.threshold ? 'success' : 'primary'}
                                />
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      // Desktop view - Table
                      <TableContainer component={Paper}>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <StyledTableCell>Name</StyledTableCell>
                              <StyledTableCell>Amendment ID</StyledTableCell>
                              <StyledTableCell>Status</StyledTableCell>
                              <StyledTableCell>Support</StyledTableCell>
                              <StyledTableCell>Progress</StyledTableCell>
                              <StyledTableCell>Version</StyledTableCell>
                              <StyledTableCell>Supported</StyledTableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {amendments
                              .filter(a => {
                                if (amendmentFilter === 'all') return true;
                                if (amendmentFilter === 'enabled') return a.enabled;
                                if (amendmentFilter === 'pending') return a.majority && !a.enabled;
                                if (amendmentFilter === 'voting') return !a.enabled && !a.majority;
                                return true;
                              })
                              .sort((a, b) => {
                                // Sort by: enabled first, then by support percentage
                                if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
                                const aPercent = (a.count / a.threshold) * 100;
                                const bPercent = (b.count / b.threshold) * 100;
                                return bPercent - aPercent;
                              })
                              .map((amendment, index) => (
                              <React.Fragment key={index}>
                                <TableRow hover>
                                  <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      {!amendment.enabled && amendment.count > 0 && (
                                        <IconButton
                                          size="small"
                                          onClick={() => setExpandedAmendment(expandedAmendment === amendment.amendment_id ? null : amendment.amendment_id)}
                                        >
                                          {expandedAmendment === amendment.amendment_id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                        </IconButton>
                                      )}
                                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {amendment.name}
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                <TableCell>
                                  <Typography
                                    variant="body2"
                                    sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                                    title={amendment.amendment_id}
                                  >
                                    {truncateKey(amendment.amendment_id, 16)}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip
                                      label={amendment.enabled ? 'Enabled' : amendment.majority ? 'Pending' : 'Not Active'}
                                      color={amendment.enabled ? 'success' : amendment.majority ? 'warning' : 'default'}
                                      size="small"
                                    />
                                    {amendment.majority && !amendment.enabled && (
                                      <Typography variant="caption" color="warning.main" sx={{ fontWeight: 600 }}>
                                        ETA: {formatRelativeTime(new Date(amendment.majority * 1000 + 14 * 24 * 60 * 60 * 1000))}
                                      </Typography>
                                    )}
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="body2">
                                        {amendment.count}/{amendment.validations}
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        (threshold: {amendment.threshold})
                                      </Typography>
                                    </Box>
                                    {!amendment.enabled && amendment.count > 0 && (
                                      <Typography variant="caption" color="primary" sx={{ cursor: 'pointer' }} onClick={() => setExpandedAmendment(expandedAmendment === amendment.amendment_id ? null : amendment.amendment_id)}>
                                        {expandedAmendment === amendment.amendment_id ? 'Hide' : 'Show'} voters
                                      </Typography>
                                    )}
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
                                    <LinearProgress 
                                      variant="determinate" 
                                      value={Math.min((amendment.count / amendment.threshold) * 100, 100)}
                                      sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                                      color={amendment.count >= amendment.threshold ? 'success' : 'primary'}
                                    />
                                    <Typography variant="body2" sx={{ minWidth: 40 }}>
                                      {((amendment.count / amendment.threshold) * 100).toFixed(0)}%
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {amendment.introduced || 'N/A'}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  {amendment.supported ? (
                                    <CheckCircleIcon color="success" fontSize="small" />
                                  ) : (
                                    <Typography variant="body2" color="text.secondary">-</Typography>
                                  )}
                                </TableCell>
                                </TableRow>
                                {expandedAmendment === amendment.amendment_id && (
                                  <TableRow>
                                    <TableCell colSpan={7} sx={{ py: 0 }}>
                                      <Collapse in={expandedAmendment === amendment.amendment_id} timeout="auto" unmountOnExit>
                                        <Box sx={{ p: 2, bgcolor: 'background.default' }}>
                                          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                            Supporting Validators ({amendmentVotes[amendment.amendment_id]?.length || 0} of {amendment.count})
                                          </Typography>
                                          {amendmentVotes[amendment.amendment_id]?.length > 0 ? (
                                            <Box>
                                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                {amendmentVotes[amendment.amendment_id].map((vote, i) => (
                                                  <Chip
                                                    key={i}
                                                    label={vote.domain || vote.domain_legacy || truncateKey(vote.validator, 12)}
                                                    size="small"
                                                    variant={vote.verified ? 'filled' : 'outlined'}
                                                    color={vote.verified ? 'success' : 'default'}
                                                    icon={vote.verified ? <CheckCircleIcon fontSize="small" /> : null}
                                                  />
                                                ))}
                                              </Box>
                                            </Box>
                                          ) : (
                                            <Box>
                                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                {amendment.count} validators are supporting this amendment
                                              </Typography>
                                              <Typography variant="caption" color="text.secondary">
                                                Check browser console for debug information about validator vote structure.
                                              </Typography>
                                              {validators.length > 0 && (
                                                <Box sx={{ mt: 2 }}>
                                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                                    All validators voting on amendments:
                                                  </Typography>
                                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                    {validators
                                                      .filter(v => v.votes?.amendments?.includes(amendment.amendment_id))
                                                      .map((v, i) => (
                                                        <Chip
                                                          key={i}
                                                          label={v.domain || v.domain_legacy || truncateKey(v.master_key, 12)}
                                                          size="small"
                                                          variant={v.meta?.verified ? 'filled' : 'outlined'}
                                                          color={v.meta?.verified ? 'success' : 'default'}
                                                          icon={v.meta?.verified ? <CheckCircleIcon fontSize="small" /> : null}
                                                        />
                                                      ))}
                                                    {validators.filter(v => v.votes?.amendments?.includes(amendment.amendment_id)).length === 0 && (
                                                      <Typography variant="caption" color="text.secondary">
                                                        Unable to match voting validators. Showing count: {amendment.count}
                                                      </Typography>
                                                    )}
                                                  </Box>
                                                </Box>
                                              )}
                                            </Box>
                                          )}
                                        </Box>
                                      </Collapse>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </React.Fragment>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </>
                )}
              </TabPanel>
            </>
          )}

          {!loading && !error && validators.length === 0 && nodes.length === 0 && (
            <Alert severity="info">No data found</Alert>
          )}
        </Box>
      </Container>

      <ScrollToTop />
      <Footer />
    </OverviewWrapper>
  );
}

export default ValidatorsPage;