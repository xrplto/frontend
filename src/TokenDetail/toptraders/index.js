import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import React from 'react';
import { format } from 'date-fns';

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
  Divider
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

// Context
import { AppContext } from 'src/AppContext';

// Utils
import { fNumber, fPercent } from 'src/utils/formatNumber';

// Components
import { StatsModal } from 'src/components/trader/TraderStats';
import SankeyModal from 'src/components/SankeyModal';

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
  return (
    <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end">
      {isPositive ? (
        <TrendingUpIcon sx={{ color: '#54D62C', fontSize: 14 }} />
      ) : (
        <TrendingDownIcon sx={{ color: '#FF6C40', fontSize: 14 }} />
      )}
      <Typography variant="body2" sx={{ color: isPositive ? '#54D62C' : '#FF6C40' }}>
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
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const paginatedTraders = sortedTraders.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const MobileTraderCard = ({ trader, rank }) => (
    <Card 
      sx={{ 
        mb: 1.5, 
        bgcolor: darkMode ? 'background.paper' : 'background.default',
        boxShadow: 'none',
        border: `1px solid ${darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
        '&:active': {
          transform: 'scale(0.98)',
          transition: 'transform 0.1s'
        }
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">#{rank}</Typography>
              <Link
                underline="none"
                href={`/profile/${trader.address}`}
                rel="noreferrer"
              >
                <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                  {truncate(trader.address, isSmallMobile ? 10 : 16)}
                </Typography>
              </Link>
              {trader.AMM && (
                <Chip
                  label="AMM"
                  size="small"
                  color="secondary"
                  sx={{ height: 18, fontSize: '0.65rem' }}
                />
              )}
            </Stack>
            <Stack direction="row" spacing={0.5}>
              <IconButton
                size="small"
                onClick={() => handleOpenStats(trader)}
                sx={{ p: 0.5 }}
              >
                <BarChartIcon sx={{ fontSize: 18 }} />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleOpenSankey(trader.address)}
                sx={{ p: 0.5 }}
              >
                <AccountTreeIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Stack>
          </Stack>
          
          <Divider sx={{ my: 0.5 }} />
          
          <Stack direction="row" justifyContent="space-between">
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">P&L (24h)</Typography>
              <ProfitCell value={trader.profit24h} />
            </Stack>
            <Stack spacing={0.5} alignItems="flex-end">
              <Typography variant="caption" color="text.secondary">Vol (24h)</Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {fNumber(trader.volume24h)}
              </Typography>
            </Stack>
            <Stack spacing={0.5} alignItems="flex-end">
              <Typography variant="caption" color="text.secondary">ROI</Typography>
              <Stack direction="row" spacing={0.25} alignItems="center">
                {trader.roi >= 0 ? (
                  <TrendingUpIcon sx={{ color: '#54D62C', fontSize: 14 }} />
                ) : (
                  <TrendingDownIcon sx={{ color: '#FF6C40', fontSize: 14 }} />
                )}
                <Typography
                  variant="body2"
                  sx={{
                    color: trader.roi >= 0 ? '#54D62C' : '#FF6C40',
                    fontWeight: 500
                  }}
                >
                  {fPercent(trader.roi)}
                </Typography>
              </Stack>
            </Stack>
          </Stack>
          
          <Stack direction="row" justifyContent="space-between" sx={{ pt: 0.5 }}>
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">Trades (24h)</Typography>
              <Typography variant="body2">{fNumber(trader.trades24h)}</Typography>
            </Stack>
            <Stack spacing={0.5} alignItems="flex-end">
              <Typography variant="caption" color="text.secondary">Last Trade</Typography>
              <Typography variant="body2">{formatDate(trader.lastTradeDate)}</Typography>
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Box sx={{ overflow: 'auto', width: '100%' }}>
        {sortedTraders.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No trader data available for this token.
            </Typography>
          </Box>
        ) : isMobile ? (
          <>
            <Box sx={{ px: 1 }}>
              {paginatedTraders.map((trader, index) => (
                <MobileTraderCard 
                  key={trader.address + '-' + index}
                  trader={trader}
                  rank={page * rowsPerPage + index + 1}
                />
              ))}
            </Box>
            <TablePagination
              component="div"
              count={sortedTraders.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 20]}
              sx={{
                borderTop: '1px solid rgba(145, 158, 171, 0.08)',
                '& .MuiTablePagination-toolbar': {
                  minHeight: '48px',
                  px: 1
                },
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  fontSize: '0.75rem',
                  color: 'text.secondary'
                },
                '& .MuiTablePagination-select': {
                  fontSize: '0.75rem'
                }
              }}
            />
          </>
        ) : (
          <>
            <Table
              stickyHeader
              size="small"
              sx={{
                '& .MuiTableCell-root': {
                  py: isMobile ? 0.75 : 1,
                  px: isMobile ? 0.5 : 1.5,
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  whiteSpace: 'nowrap',
                  borderBottom: 'none'
                },
                '& .MuiTableCell-head': {
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em',
                  color: darkMode ? '#919EAB' : '#637381',
                  bgcolor: darkMode ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  borderBottom: `1px solid ${
                    darkMode ? 'rgba(145, 158, 171, 0.12)' : 'rgba(145, 158, 171, 0.24)'
                  }`,
                  position: 'sticky',
                  top: 0,
                  zIndex: 100
                },
                '& .MuiTableRow-root': {
                  borderBottom: '1px solid rgba(145, 158, 171, 0.08)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    '& .MuiTableCell-root': {
                      backgroundColor: darkMode
                        ? 'rgba(255, 255, 255, 0.04)'
                        : 'rgba(145, 158, 171, 0.04)',
                      backdropFilter: 'blur(6px)'
                    },
                    cursor: 'pointer',
                    transform: 'translateY(-1px)',
                    boxShadow: darkMode
                      ? '0 4px 16px rgba(0, 0, 0, 0.24)'
                      : '0 4px 16px rgba(145, 158, 171, 0.16)'
                  }
                },
                '& .MuiTableSortLabel-root': {
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'inherit',
                  '&:hover': {
                    color: darkMode ? '#fff' : '#212B36'
                  },
                  '&.Mui-active': {
                    color: darkMode ? '#fff' : '#212B36',
                    '& .MuiTableSortLabel-icon': {
                      color: 'inherit'
                    }
                  },
                  '& .MuiTableSortLabel-icon': {
                    fontSize: '16px'
                  }
                }
              }}
            >
              <TableHead>
                <TableRow>
                  {headCells.filter(cell => !isMobile || !cell.mobileHide).map((headCell) => (
                    <TableCell
                      key={headCell.id}
                      align={headCell.numeric ? 'right' : 'left'}
                      sortDirection={orderBy === headCell.id ? order : false}
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.02em',
                        color: darkMode ? '#919EAB' : '#637381'
                      }}
                    >
                      {headCell.sortable ? (
                        <TableSortLabel
                          active={orderBy === headCell.id}
                          direction={orderBy === headCell.id ? order : 'asc'}
                          onClick={() => handleRequestSort(headCell.id)}
                          sx={{ fontSize: '0.75rem' }}
                          IconComponent={orderBy === headCell.id ? undefined : () => null}
                        >
                          {headCell.label}
                          {headCell.tooltip && (
                            <Tooltip title={headCell.tooltip} placement="top">
                              <InfoOutlinedIcon
                                sx={{
                                  fontSize: 12,
                                  ml: 0.5,
                                  verticalAlign: 'middle',
                                  color: 'text.disabled'
                                }}
                              />
                            </Tooltip>
                          )}
                        </TableSortLabel>
                      ) : (
                        <>
                          {headCell.label}
                          {headCell.tooltip && (
                            <Tooltip title={headCell.tooltip} placement="top">
                              <InfoOutlinedIcon
                                sx={{
                                  fontSize: 12,
                                  ml: 0.5,
                                  verticalAlign: 'middle',
                                  color: 'text.disabled'
                                }}
                              />
                            </Tooltip>
                          )}
                        </>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedTraders.map((safeTrader, index) => {
                  return (
                    <TableRow
                      key={safeTrader.address + '-' + index}
                      sx={{
                        '&:hover': {
                          bgcolor: 'action.hover'
                        }
                      }}
                    >
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {page * rowsPerPage + index + 1}
                        </Typography>
                      </TableCell>
                      <TableCell align="left">
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Link
                            underline="none"
                            color="inherit"
                            href={`/profile/${safeTrader.address}`}
                            rel="noreferrer"
                          >
                            <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
                              {truncate(safeTrader.address, isMobile ? 10 : 20)}
                            </Typography>
                          </Link>
                          {safeTrader.AMM && (
                            <Chip
                              label="AMM"
                              size="small"
                              color="secondary"
                              sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                '& .MuiChip-label': {
                                  px: 0.75
                                }
                              }}
                            />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <ProfitCell value={safeTrader.profit24h} />
                      </TableCell>
                      <TableCell align="right">
                        <ProfitCell value={safeTrader.profit7d} />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {fNumber(safeTrader.volume24h)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {fNumber(safeTrader.totalVolume)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {fNumber(safeTrader.trades24h)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {fNumber(safeTrader.totalTrades)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={0.5}
                          alignItems="center"
                          justifyContent="flex-end"
                        >
                          {safeTrader.roi >= 0 ? (
                            <TrendingUpIcon sx={{ color: '#54D62C', fontSize: 14 }} />
                          ) : (
                            <TrendingDownIcon sx={{ color: '#FF6C40', fontSize: 14 }} />
                          )}
                          <Typography
                            variant="body2"
                            sx={{
                              color: safeTrader.roi >= 0 ? '#54D62C' : '#FF6C40',
                              fontWeight: 500
                            }}
                          >
                            {fPercent(safeTrader.roi)}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {formatDate(safeTrader.lastTradeDate)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.5}
                          justifyContent="flex-end"
                        >
                          <Tooltip title="View Trader Statistics">
                            <IconButton
                              edge="end"
                              aria-label="stats"
                              onClick={() => handleOpenStats(safeTrader)}
                              size="small"
                              sx={{
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': {
                                  backgroundColor: darkMode
                                    ? 'rgba(255, 255, 255, 0.08)'
                                    : 'rgba(145, 158, 171, 0.08)',
                                  transform: 'scale(1.1)'
                                }
                              }}
                            >
                              <BarChartIcon sx={{ fontSize: isMobile ? 14 : 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Sankey Flow Analysis">
                            <IconButton
                              edge="end"
                              aria-label="sankey"
                              onClick={() => handleOpenSankey(safeTrader.address)}
                              size="small"
                              sx={{
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': {
                                  backgroundColor: darkMode
                                    ? 'rgba(255, 255, 255, 0.08)'
                                    : 'rgba(145, 158, 171, 0.08)',
                                  transform: 'scale(1.1)'
                                }
                              }}
                            >
                              <AccountTreeIcon sx={{ fontSize: isMobile ? 14 : 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Copy JSON Data">
                            <IconButton
                              edge="end"
                              aria-label="copy-json"
                              onClick={() => handleCopyJson(safeTrader)}
                              size="small"
                              sx={{
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': {
                                  backgroundColor: darkMode
                                    ? 'rgba(255, 255, 255, 0.08)'
                                    : 'rgba(145, 158, 171, 0.08)',
                                  transform: 'scale(1.1)'
                                }
                              }}
                            >
                              {copiedTrader === safeTrader.address ? (
                                <CheckIcon sx={{ fontSize: isMobile ? 14 : 16, color: '#54D62C' }} />
                              ) : (
                                <ContentCopyIcon sx={{ fontSize: isMobile ? 14 : 16 }} />
                              )}
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={sortedTraders.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 20, 25, 50, 100]}
              sx={{
                borderTop: '1px solid rgba(145, 158, 171, 0.08)',
                '& .MuiTablePagination-toolbar': {
                  minHeight: '52px'
                },
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  fontSize: '0.875rem',
                  color: 'text.secondary'
                }
              }}
            />
          </>
        )}
      </Box>

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
    </>
  );
}
