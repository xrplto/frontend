import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import React from 'react';
import { format } from 'date-fns';
import { alpha } from '@mui/material/styles';

// Material
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Stack,
  Link,
  IconButton,
  Tooltip,
  CircularProgress,
  Chip,
  TableSortLabel,
  TablePagination,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  Divider,
  styled,
  keyframes,
  Pagination
} from '@mui/material';

// Icons
import LinkIcon from '@mui/icons-material/Link';
import BarChartIcon from '@mui/icons-material/BarChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

// Context
import { AppContext } from 'src/AppContext';

// Utils
import { fNumber, fPercent } from 'src/utils/formatNumber';

// Components
import { StatsModal } from 'src/components/TraderStats';
import dynamic from 'next/dynamic';

const SankeyModal = dynamic(() => import('src/components/SankeyModal'), {
  loading: () => <CircularProgress />
});

// Define highlight animation with softer colors
const highlightAnimation = (theme) => keyframes`
  0% {
    background-color: ${theme.palette.primary.main}30;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px ${theme.palette.primary.main}40;
  }
  50% {
    background-color: ${theme.palette.primary.main}15;
    transform: translateY(0);
    box-shadow: 0 2px 4px ${theme.palette.primary.main}20;
  }
  100% {
    background-color: transparent;
    transform: translateY(0);
    box-shadow: none;
  }
`;

// Styled components with improved design
const TraderCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'isNew'
})(({ theme, isNew }) => ({
  marginBottom: theme.spacing(0.5),
  borderRadius: '8px',
  backgroundColor: 'transparent',
  backdropFilter: 'none',
  WebkitBackdropFilter: 'none',
  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
  boxShadow: `
    0 8px 32px ${alpha(theme.palette.common.black, 0.12)}, 
    0 1px 2px ${alpha(theme.palette.common.black, 0.04)},
    inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`,
  transition: 'all 0.3s ease-in-out',
  position: 'relative',
  overflow: 'hidden',
  animation: isNew ? `${highlightAnimation(theme)} 1s ease-in-out` : 'none',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: `
      0 12px 40px ${alpha(theme.palette.common.black, 0.15)}, 
      0 2px 4px ${alpha(theme.palette.common.black, 0.05)},
      inset 0 1px 1px ${alpha(theme.palette.common.white, 0.15)}`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
  }
}));

const ProfitChip = styled(Chip)(({ theme, profittype }) => ({
  fontSize: '0.7rem',
  height: '24px',
  fontWeight: 'bold',
  borderRadius: '12px',
  backgroundColor: 'transparent',
  color: profittype === 'positive' ? theme.palette.primary.main : '#F44336',
  border:
    profittype === 'positive'
      ? `1px solid ${alpha(theme.palette.primary.main, 0.5)}`
      : `1px solid ${alpha('#F44336', 0.4)}`,
  boxShadow: `
    0 2px 8px ${alpha(profittype === 'positive' ? theme.palette.primary.main : '#F44336', 0.15)},
    inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`
}));

const VolumeIndicator = styled('div')(({ theme, volume }) => ({
  position: 'absolute',
  left: 0,
  top: 0,
  height: '100%',
  width: `${volume}%`,
  background: `linear-gradient(90deg, 
    ${theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.08)' : 'rgba(33, 150, 243, 0.05)'} 0%, 
    ${
      theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.02)' : 'rgba(33, 150, 243, 0.01)'
    } 100%)`,
  transition: 'width 0.3s ease-in-out',
  borderRadius: '12px'
}));

const StyledPagination = styled(Pagination)(({ theme }) => ({
  '& .MuiPaginationItem-root': {
    color: theme.palette.text.primary,
    borderRadius: '8px',
    margin: '0 2px',
    fontWeight: '500',
    '&:hover': {
      backgroundColor:
        theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
    }
  },
  '& .Mui-selected': {
    backgroundColor: `${theme.palette.primary.main} !important`,
    color: '#fff !important',
    fontWeight: 'bold',
    borderRadius: '8px',
    '&:hover': {
      backgroundColor: `${theme.palette.primary.dark} !important`
    }
  }
}));

function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.substr(0, n - 1) + ' ...' : str;
}

function formatDuration(seconds) {
  if (seconds === 0 || seconds === null || seconds === undefined) return '-';
  const hours = Math.floor(seconds / 3600);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);

  if (months > 0) {
    return `${months}m`;
  } else if (days > 0) {
    return `${days}d`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    const minutes = Math.floor((seconds % 3600) / 60);
    if (minutes > 0) {
      return `${minutes}min`;
    } else {
      return `<1min`;
    }
  }
}

function formatDate(dateString) {
  if (!dateString) return '-';
  try {
    return format(new Date(dateString), 'MMM d, yyyy');
  } catch (error) {
    return 'Invalid Date';
  }
}

function descendingComparator(a, b, orderBy) {
  let aValue = a[orderBy];
  let bValue = b[orderBy];

  if (orderBy === 'firstTradeDate' || orderBy === 'lastTradeDate') {
    aValue = aValue ? new Date(aValue).getTime() : 0;
    bValue = bValue ? new Date(bValue).getTime() : 0;
  }

  if (
    orderBy === 'profit24h' ||
    orderBy === 'profit7d' ||
    orderBy === 'profit1m' ||
    orderBy === 'profit2m' ||
    orderBy === 'profit3m'
  ) {
  }

  if (bValue < aValue) {
    return -1;
  }
  if (bValue > aValue) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

const headCells = [
  { id: 'rank', label: '#', numeric: true, sortable: false, mobileHide: false },
  { id: 'address', label: 'Trader', numeric: false, sortable: false, mobileHide: false },
  {
    id: 'profit24h',
    label: 'P&L (24h)',
    numeric: true,
    sortable: true,
    tooltip: "Trader's profit/loss in the last 24 hours",
    mobileHide: false
  },
  {
    id: 'profit7d',
    label: 'P&L (7d)',
    numeric: true,
    sortable: true,
    tooltip: "Trader's profit/loss in the last 7 days",
    mobileHide: true
  },
  {
    id: 'volume24h',
    label: 'Vol (24h)',
    numeric: true,
    sortable: true,
    tooltip: "Trader's trade volume in the last 24 hours",
    mobileHide: false
  },
  {
    id: 'totalVolume',
    label: 'Total Vol',
    numeric: true,
    sortable: true,
    tooltip: "Trader's total trade volume for this token",
    mobileHide: true
  },
  {
    id: 'trades24h',
    label: 'Trades (24h)',
    numeric: true,
    sortable: true,
    tooltip: 'Number of trades in the last 24 hours',
    mobileHide: true
  },
  {
    id: 'totalTrades',
    label: 'Total Trades',
    numeric: true,
    sortable: true,
    tooltip: 'Total number of trades for this token',
    mobileHide: true
  },
  { id: 'roi', label: 'ROI', numeric: true, sortable: true, tooltip: 'Return on Investment', mobileHide: false },
  {
    id: 'lastTradeDate',
    label: 'Last Trade',
    numeric: false,
    sortable: true,
    tooltip: 'Date of the last recorded trade for this token',
    mobileHide: true
  },
  { id: 'actions', label: 'Actions', numeric: false, sortable: false, mobileHide: false }
];

function ProfitCell({ value }) {
  const isPositive = value >= 0;
  const theme = useTheme();
  return (
    <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end">
      {isPositive ? (
        <TrendingUpIcon sx={{ color: theme.palette.primary.main, fontSize: 14 }} />
      ) : (
        <TrendingDownIcon sx={{ color: '#F44336', fontSize: 14 }} />
      )}
      <Typography 
        variant="body2" 
        sx={{ 
          color: isPositive ? theme.palette.primary.main : '#F44336',
          fontWeight: 600,
          fontSize: '0.85rem'
        }}
      >
        {fNumber(Math.abs(value))}
      </Typography>
    </Stack>
  );
}

function MarketShareCell({ value }) {
  return (
    <Chip
      label={`${fPercent(value)}`}
      size="small"
      sx={{
        bgcolor: 'rgba(0, 171, 85, 0.08)',
        color: 'primary.main',
        height: '20px',
        '& .MuiChip-label': {
          px: 0.75,
          fontSize: '0.7rem'
        }
      }}
    />
  );
}

export default function TopTraders({ token }) {
  const BASE_URL = process.env.API_URL;
  const { darkMode } = useContext(AppContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [traders, setTraders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrader, setSelectedTrader] = useState(null);
  const [traderStats, setTraderStats] = useState({});
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('profit24h');
  const [copiedTrader, setCopiedTrader] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [sankeyModalOpen, setSankeyModalOpen] = useState(false);
  const [selectedSankeyAccount, setSelectedSankeyAccount] = useState(null);

  useEffect(() => {
    const fetchTopTraders = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/analytics/top-traders/${token.md5}?limit=1000`
        );
        if (response.status === 200) {
          const tradersData = response.data.data || response.data;

          const tradersArray = Array.isArray(tradersData) ? tradersData : [];

          setTraders(tradersArray);
        }
      } catch (error) {
        setTraders([]);
      } finally {
        setLoading(false);
      }
    };

    if (token && token.md5) {
      fetchTopTraders();
    } else {
      setLoading(false);
    }
  }, [token, BASE_URL]);

  const sortedTraders = React.useMemo(() => {
    if (!Array.isArray(traders) || traders.length === 0) {
      return [];
    }

    try {
      const tradersWithDefaults = traders.map((trader) => ({
        address: trader.address || 'Unknown',
        profit24h: trader.profit24h || 0,
        profit7d: trader.profit7d || 0,
        profit1m: trader.profit1m || 0,
        profit2m: trader.profit2m || 0,
        profit3m: trader.profit3m || 0,
        volume24h: trader.volume24h || 0,
        volume7d: trader.volume7d || 0,
        volume1m: trader.volume1m || 0,
        volume2m: trader.volume2m || 0,
        volume3m: trader.volume3m || 0,
        totalVolume: trader.totalVolume || 0,
        tradePercentage: trader.tradePercentage || 0,
        roi: trader.roi || 0,
        profitableTrades: trader.profitableTrades || 0,
        losingTrades: trader.losingTrades || 0,
        trades24h: trader.trades24h || 0,
        trades7d: trader.trades7d || 0,
        trades1m: trader.trades1m || 0,
        trades2m: trader.trades2m || 0,
        trades3m: trader.trades3m || 0,
        totalTrades: trader.totalTrades || 0,
        avgHoldingTime: trader.avgHoldingTime || 0,
        maxProfitTrade: trader.maxProfitTrade || 0,
        maxLossTrade: trader.maxLossTrade || 0,
        firstTradeDate: trader.firstTradeDate || null,
        lastTradeDate: trader.lastTradeDate || null,
        AMM: trader.AMM || false,
        ...trader
      }));
      return [...tradersWithDefaults].sort(getComparator(order, orderBy));
    } catch (error) {
      return traders.map((trader) => ({
        address: trader.address || 'Unknown',
        profit24h: trader.profit24h || 0,
        profit7d: trader.profit7d || 0,
        profit1m: trader.profit1m || 0,
        profit2m: trader.profit2m || 0,
        profit3m: trader.profit3m || 0,
        volume24h: trader.volume24h || 0,
        volume7d: trader.volume7d || 0,
        volume1m: trader.volume1m || 0,
        volume2m: trader.volume2m || 0,
        volume3m: trader.volume3m || 0,
        totalVolume: trader.totalVolume || 0,
        tradePercentage: trader.tradePercentage || 0,
        roi: trader.roi || 0,
        profitableTrades: trader.profitableTrades || 0,
        losingTrades: trader.losingTrades || 0,
        trades24h: trader.trades24h || 0,
        trades7d: trader.trades7d || 0,
        trades1m: trader.trades1m || 0,
        trades2m: trader.trades2m || 0,
        trades3m: trader.trades3m || 0,
        totalTrades: trader.totalTrades || 0,
        avgHoldingTime: trader.avgHoldingTime || 0,
        maxProfitTrade: trader.maxProfitTrade || 0,
        maxLossTrade: trader.maxLossTrade || 0,
        firstTradeDate: trader.firstTradeDate || null,
        lastTradeDate: trader.lastTradeDate || null,
        AMM: trader.AMM || false,
        ...trader
      }));
    }
  }, [traders, order, orderBy]);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleOpenStats = (trader) => {
    setSelectedTrader(trader);
    setTraderStats((prev) => ({
      ...prev,
      [trader.address]: trader
    }));
  };

  const handleCloseStats = () => {
    setSelectedTrader(null);
  };

  const handleCopyJson = (trader) => {
    try {
      const jsonData = JSON.stringify(trader, null, 2);
      navigator.clipboard.writeText(jsonData);
      setCopiedTrader(trader.address);
      setTimeout(() => setCopiedTrader(null), 2000);
    } catch (error) {
      // Handle error silently
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenSankey = (traderAddress) => {
    setSelectedSankeyAccount(traderAddress);
    setSankeyModalOpen(true);
  };

  const handleCloseSankey = () => {
    setSankeyModalOpen(false);
    setSelectedSankeyAccount(null);
  };

  if (loading) {
    return (
      <Stack spacing={1}>
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress size={40} thickness={4} />
        </Box>
      </Stack>
    );
  }

  const paginatedTraders = sortedTraders.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  
  const totalPages = Math.ceil(sortedTraders.length / rowsPerPage);

  return (
    <Stack spacing={1}>
      {sortedTraders.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 6,
            backgroundColor: 'transparent',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            borderRadius: '12px',
            border: `1px dashed ${alpha(theme.palette.divider, 0.3)}`,
            boxShadow: `
              0 8px 32px ${alpha(theme.palette.common.black, 0.12)}, 
              0 1px 2px ${alpha(theme.palette.common.black, 0.04)},
              inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Top Traders Data
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Trading data will appear here when available
          </Typography>
        </Box>
      ) : (
        <>
          {/* Table Headers with integrated title */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
                md: '0.5fr 2fr 1.5fr 1.5fr 1.5fr 1.5fr 1fr 1fr 1.5fr 1fr'
              },
              gap: 2,
              p: 2,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              backgroundColor: 'transparent',
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none',
              borderRadius: '8px 8px 0 0',
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              boxShadow: `
                0 8px 32px ${alpha(theme.palette.common.black, 0.12)}, 
                0 1px 2px ${alpha(theme.palette.common.black, 0.04)},
                inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`,
              '& > *': {
                fontWeight: 'bold',
                color: theme.palette.text.secondary,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }
            }}
          >
            <Typography sx={{ display: { xs: 'none', md: 'block' } }}>#</Typography>
            <Typography sx={{ display: { xs: 'none', md: 'block' } }}>Trader</Typography>
            <Typography sx={{ display: { xs: 'none', md: 'block' } }}>P&L (24h)</Typography>
            <Typography sx={{ display: { xs: 'none', md: 'block' } }}>P&L (7d)</Typography>
            <Typography sx={{ display: { xs: 'none', md: 'block' } }}>Vol (24h)</Typography>
            <Typography sx={{ display: { xs: 'none', md: 'block' } }}>Total Vol</Typography>
            <Typography sx={{ display: { xs: 'none', md: 'block' } }}>Trades</Typography>
            <Typography sx={{ display: { xs: 'none', md: 'block' } }}>ROI</Typography>
            <Typography sx={{ display: { xs: 'none', md: 'block' } }}>Last Trade</Typography>
            <Typography sx={{ display: { xs: 'none', md: 'block' } }}></Typography>
          </Box>

          <Stack spacing={0.5}>
            {paginatedTraders.map((trader, index) => {
              const volumePercentage = Math.min(100, Math.max(5, (trader.totalVolume / 1000000) * 100));
              
              return (
                <TraderCard key={trader.address + '-' + index}>
                  <VolumeIndicator volume={volumePercentage} />
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: '1fr',
                          sm: '1fr 1fr',
                          md: '0.5fr 2fr 1.5fr 1.5fr 1.5fr 1.5fr 1fr 1fr 1.5fr 1fr'
                        },
                        gap: 1.5,
                        alignItems: 'center'
                      }}
                    >
                      {/* Rank */}
                      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                        <Typography
                          variant="body2"
                          fontWeight="600"
                          color="text.primary"
                          sx={{ fontSize: '0.85rem' }}
                        >
                          {page * rowsPerPage + index + 1}
                        </Typography>
                      </Box>

                      {/* Trader Address */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Link
                          href={`/profile/${trader.address}`}
                          sx={{
                            textDecoration: 'none',
                            color: 'primary.main',
                            fontWeight: '500',
                            '&:hover': {
                              textDecoration: 'underline',
                              color: 'primary.dark'
                            }
                          }}
                        >
                          <Typography
                            variant="body2"
                            fontWeight="500"
                            sx={{ fontSize: '0.8rem', color: 'primary.main' }}
                          >
                            {`${trader.address.slice(0, 4)}...${trader.address.slice(-4)}`}
                          </Typography>
                        </Link>
                        {trader.AMM && (
                          <Chip
                            label="AMM"
                            size="small"
                            color="secondary"
                            sx={{
                              height: 18,
                              fontSize: '0.65rem',
                              '& .MuiChip-label': {
                                px: 0.5
                              }
                            }}
                          />
                        )}
                      </Box>

                      {/* P&L 24h */}
                      <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: '0.7rem', display: { xs: 'block', md: 'none' } }}
                        >
                          P&L (24h)
                        </Typography>
                        <ProfitCell value={trader.profit24h} />
                      </Box>

                      {/* P&L 7d */}
                      <Box sx={{ textAlign: { xs: 'left', md: 'right' }, display: { xs: 'none', md: 'block' } }}>
                        <ProfitCell value={trader.profit7d} />
                      </Box>

                      {/* Volume 24h */}
                      <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: '0.7rem', display: { xs: 'block', md: 'none' } }}
                        >
                          Vol (24h)
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight="600"
                          color="text.primary"
                          sx={{ fontSize: '0.85rem' }}
                        >
                          {fNumber(trader.volume24h)}
                        </Typography>
                      </Box>

                      {/* Total Volume */}
                      <Box sx={{ textAlign: { xs: 'left', md: 'right' }, display: { xs: 'none', md: 'block' } }}>
                        <Typography
                          variant="body2"
                          fontWeight="600"
                          color="text.primary"
                          sx={{ fontSize: '0.85rem' }}
                        >
                          {fNumber(trader.totalVolume)}
                        </Typography>
                      </Box>

                      {/* Trades */}
                      <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: '0.7rem', display: { xs: 'block', md: 'none' } }}
                        >
                          Trades
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight="600"
                          color="text.primary"
                          sx={{ fontSize: '0.85rem' }}
                        >
                          {fNumber(trader.totalTrades)}
                        </Typography>
                      </Box>

                      {/* ROI */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                        {trader.roi >= 0 ? (
                          <TrendingUpIcon sx={{ color: theme.palette.primary.main, fontSize: 14 }} />
                        ) : (
                          <TrendingDownIcon sx={{ color: '#F44336', fontSize: 14 }} />
                        )}
                        <Typography
                          variant="body2"
                          sx={{
                            color: trader.roi >= 0 ? theme.palette.primary.main : '#F44336',
                            fontWeight: 600,
                            fontSize: '0.85rem'
                          }}
                        >
                          {fPercent(trader.roi)}
                        </Typography>
                      </Box>

                      {/* Last Trade */}
                      <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: '0.7rem', display: { xs: 'block', md: 'none' } }}
                        >
                          Last Trade
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight="500"
                          color="text.secondary"
                          sx={{ fontSize: '0.8rem' }}
                        >
                          {formatDate(trader.lastTradeDate)}
                        </Typography>
                      </Box>

                      {/* Actions */}
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                        <Tooltip title="View Trader Statistics" arrow>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenStats(trader)}
                            sx={{
                              color: `${theme.palette.primary.main} !important`,
                              padding: '4px',
                              '&:hover': {
                                color: `${theme.palette.primary.dark} !important`,
                                backgroundColor:
                                  theme.palette.mode === 'dark'
                                    ? 'rgba(255, 255, 255, 0.08)'
                                    : 'rgba(0, 0, 0, 0.04)',
                                transform: 'scale(1.1)'
                              }
                            }}
                          >
                            <BarChartIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View Flow Analysis" arrow>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenSankey(trader.address)}
                            sx={{
                              color: `${theme.palette.primary.main} !important`,
                              padding: '4px',
                              '&:hover': {
                                color: `${theme.palette.primary.dark} !important`,
                                backgroundColor:
                                  theme.palette.mode === 'dark'
                                    ? 'rgba(255, 255, 255, 0.08)'
                                    : 'rgba(0, 0, 0, 0.04)',
                                transform: 'scale(1.1)'
                              }
                            }}
                          >
                            <AccountTreeIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View Profile" arrow>
                          <IconButton
                            size="small"
                            component={Link}
                            href={`/profile/${trader.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              color: `${theme.palette.primary.main} !important`,
                              padding: '4px',
                              '&:hover': {
                                color: `${theme.palette.primary.dark} !important`,
                                backgroundColor:
                                  theme.palette.mode === 'dark'
                                    ? 'rgba(255, 255, 255, 0.08)'
                                    : 'rgba(0, 0, 0, 0.04)',
                                transform: 'scale(1.1)'
                              },
                              '& .MuiSvgIcon-root': {
                                color: `${theme.palette.primary.main} !important`
                              },
                              '&:hover .MuiSvgIcon-root': {
                                color: `${theme.palette.primary.dark} !important`
                              }
                            }}
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </CardContent>
                </TraderCard>
              );
            })}
          </Stack>

          {totalPages > 1 && (
            <Stack direction="row" justifyContent="center" sx={{ mt: 4 }}>
              <StyledPagination
                count={totalPages}
                page={page + 1}
                onChange={(e, newPage) => setPage(newPage - 1)}
                size="large"
                showFirstButton
                showLastButton
              />
            </Stack>
          )}
        </>
      )}

      <StatsModal
        open={Boolean(selectedTrader)}
        onClose={handleCloseStats}
        account={selectedTrader?.address}
        traderStats={traderStats}
        isAmm={selectedTrader?.AMM}
      />

      <SankeyModal
        open={sankeyModalOpen}
        onClose={handleCloseSankey}
        account={selectedSankeyAccount}
      />
    </Stack>
  );
}
