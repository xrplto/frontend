import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import React from 'react';

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
  TablePagination
} from '@mui/material';

// Icons
import LinkIcon from '@mui/icons-material/Link';
import BarChartIcon from '@mui/icons-material/BarChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';

// Context
import { AppContext } from 'src/AppContext';

// Utils
import { fNumber, fPercent } from 'src/utils/formatNumber';

// Components
import { StatsModal } from 'src/components/trader/TraderStats';

function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.substr(0, n - 1) + ' ...' : str;
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);

  if (months > 0) {
    return `${months}m`;
  } else if (days > 0) {
    return `${days}d`;
  } else {
    return `${hours}h`;
  }
}

function descendingComparator(a, b, orderBy) {
  let aValue = a[orderBy];
  let bValue = b[orderBy];

  // Special handling for calculated fields
  if (orderBy === 'winRate') {
    aValue = (a.profitableTrades / (a.profitableTrades + a.losingTrades)) * 100;
    bValue = (b.profitableTrades / (b.profitableTrades + b.losingTrades)) * 100;
  }

  // For profit fields, we want to sort by actual value, not absolute value
  // This ensures that higher profits are ranked higher, even when comparing negative values
  if (orderBy === 'profit24h' || orderBy === 'profit7d' || orderBy === 'profit2m') {
    if (bValue < aValue) {
      return -1;
    }
    if (bValue > aValue) {
      return 1;
    }
    return 0;
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
  { id: 'rank', label: 'Rank', numeric: true, sortable: false },
  { id: 'address', label: 'Address', numeric: false, sortable: false },
  { id: 'profit24h', label: 'Profit (24h)', numeric: true, sortable: true },
  { id: 'profit7d', label: 'Profit (7d)', numeric: true, sortable: true },
  { id: 'profit2m', label: 'Profit (2m)', numeric: true, sortable: true },
  { id: 'volume24h', label: 'Volume (24h)', numeric: true, sortable: true },
  { id: 'volume7d', label: 'Volume (7d)', numeric: true, sortable: true },
  { id: 'totalVolume', label: 'Total Volume', numeric: true, sortable: true },
  { id: 'tradePercentage', label: 'Market Share', numeric: true, sortable: true },
  { id: 'roi', label: 'ROI', numeric: true, sortable: true },
  { id: 'winRate', label: 'Win Rate', numeric: true, sortable: true },
  { id: 'trades', label: 'Trades', numeric: true, sortable: false },
  { id: 'avgHoldingTime', label: 'Avg Hold', numeric: true, sortable: true },
  { id: 'maxProfitTrade', label: 'Best Trade', numeric: true, sortable: true },
  { id: 'maxLossTrade', label: 'Worst Trade', numeric: true, sortable: true },
  { id: 'actions', label: 'Actions', numeric: false, sortable: false }
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

  console.log('Token prop:', token); // Debug token prop
  console.log('BASE_URL:', BASE_URL); // Debug API URL

  const [traders, setTraders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrader, setSelectedTrader] = useState(null);
  const [traderStats, setTraderStats] = useState({});
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('profit24h');
  const [copiedTrader, setCopiedTrader] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  useEffect(() => {
    const fetchTopTraders = async () => {
      try {
        console.log('Fetching traders for token:', token.md5);
        const response = await axios.get(
          `${BASE_URL}/analytics/top-traders/${token.md5}?limit=1000`
        );
        console.log('API Response:', response.data);
        if (response.status === 200) {
          // Check if response.data is an object with a data property, or if it's the array directly
          const tradersData = response.data.data || response.data;

          // Ensure we're working with an array
          const tradersArray = Array.isArray(tradersData) ? tradersData : [];

          console.log('Processed traders data:', tradersArray);
          setTraders(tradersArray);
        }
      } catch (error) {
        console.error('Error fetching top traders:', error);
        setTraders([]);
      } finally {
        setLoading(false);
      }
    };

    if (token?.md5) {
      fetchTopTraders();
    } else {
      console.log('No token.md5 provided');
      setLoading(false);
    }
  }, [token?.md5, BASE_URL]);

  // Add debug log for traders state changes
  useEffect(() => {
    console.log('Current traders state:', traders);
  }, [traders]);

  // Update the sortedTraders calculation to handle potential issues
  const sortedTraders = React.useMemo(() => {
    if (!Array.isArray(traders) || traders.length === 0) {
      console.log('No traders data to sort');
      return [];
    }

    try {
      return [...traders].sort(getComparator(order, orderBy));
    } catch (error) {
      console.error('Error sorting traders:', error);
      return traders;
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
    const jsonData = JSON.stringify(trader, null, 2);
    navigator.clipboard
      .writeText(jsonData)
      .then(() => {
        setCopiedTrader(trader.address);
        setTimeout(() => {
          setCopiedTrader(null);
        }, 2000);
      })
      .catch((error) => {
        console.error('Error copying JSON data:', error);
      });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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

  // Apply pagination
  const paginatedTraders = sortedTraders.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
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
        ) : (
          <>
            <Table
              stickyHeader
              size="small"
              sx={{
                '& .MuiTableCell-root': {
                  py: 0.75,
                  px: 1,
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap'
                },
                '& .MuiTableCell-head': {
                  fontWeight: 600,
                  bgcolor: (theme) => theme.palette.background.paper
                }
              }}
            >
              <TableHead>
                <TableRow>
                  {headCells.map((headCell) => (
                    <TableCell
                      key={headCell.id}
                      align={headCell.numeric ? 'right' : 'left'}
                      sortDirection={orderBy === headCell.id ? order : false}
                    >
                      {headCell.sortable ? (
                        <TableSortLabel
                          active={orderBy === headCell.id}
                          direction={orderBy === headCell.id ? order : 'asc'}
                          onClick={() => handleRequestSort(headCell.id)}
                          sx={{ fontSize: '0.75rem' }}
                        >
                          {headCell.label}
                          {headCell.id === 'tradePercentage' && (
                            <Tooltip title="Trader's share of total market volume" placement="top">
                              <span style={{ marginLeft: '2px', fontSize: '12px' }}>ⓘ</span>
                            </Tooltip>
                          )}
                          {headCell.id === 'profit24h' && (
                            <Tooltip title="Trader's profit in the last 24 hours" placement="top">
                              <span style={{ marginLeft: '2px', fontSize: '12px' }}>ⓘ</span>
                            </Tooltip>
                          )}
                        </TableSortLabel>
                      ) : (
                        headCell.label
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedTraders.map((trader, index) => {
                  // Add default values for potentially missing properties
                  const safeTrader = {
                    address: trader.address || 'Unknown',
                    profit24h: trader.profit24h || 0,
                    profit7d: trader.profit7d || 0,
                    profit2m: trader.profit2m || 0,
                    volume24h: trader.volume24h || 0,
                    volume7d: trader.volume7d || 0,
                    totalVolume: trader.totalVolume || 0,
                    tradePercentage: trader.tradePercentage || 0,
                    roi: trader.roi || 0,
                    profitableTrades: trader.profitableTrades || 0,
                    losingTrades: trader.losingTrades || 0,
                    trades24h: trader.trades24h || 0,
                    totalTrades: trader.totalTrades || 0,
                    avgHoldingTime: trader.avgHoldingTime || 0,
                    maxProfitTrade: trader.maxProfitTrade || 0,
                    maxLossTrade: trader.maxLossTrade || 0,
                    AMM: trader.AMM || false,
                    ...trader // Keep any other properties
                  };

                  return (
                    <TableRow
                      key={safeTrader.address}
                      sx={{
                        '&:hover': {
                          bgcolor: 'action.hover'
                        }
                      }}
                    >
                      <TableCell align="right">{page * rowsPerPage + index + 1}</TableCell>
                      <TableCell align="left">
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Link
                            underline="none"
                            color="inherit"
                            href={`/profile/${safeTrader.address}`}
                            rel="noreferrer"
                          >
                            <Typography variant="body2" color="primary">
                              {truncate(safeTrader.address, 20)}
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
                        <ProfitCell value={safeTrader.profit2m} />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">{fNumber(safeTrader.volume24h)}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">{fNumber(safeTrader.volume7d)}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">{fNumber(safeTrader.totalVolume)}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <MarketShareCell value={safeTrader.tradePercentage} />
                        </Box>
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
                            sx={{ color: safeTrader.roi >= 0 ? '#54D62C' : '#FF6C40' }}
                          >
                            {fPercent(safeTrader.roi)}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Chip
                            label={fPercent(
                              (safeTrader.profitableTrades /
                                (safeTrader.profitableTrades + safeTrader.losingTrades)) *
                                100
                            )}
                            size="small"
                            sx={{
                              bgcolor: 'rgba(84, 214, 44, 0.16)',
                              color: '#54D62C',
                              height: '20px',
                              '& .MuiChip-label': {
                                px: 0.75,
                                fontSize: '0.7rem'
                              }
                            }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="column" spacing={0} alignItems="flex-end">
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontSize: '0.65rem' }}
                          >
                            24h: {fNumber(safeTrader.trades24h)}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontSize: '0.65rem' }}
                          >
                            Total: {fNumber(safeTrader.totalTrades)}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {formatDuration(safeTrader.avgHoldingTime)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ color: '#54D62C' }}>
                          {fNumber(safeTrader.maxProfitTrade)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ color: '#FF6C40' }}>
                          {fNumber(Math.abs(safeTrader.maxLossTrade))}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1}
                          justifyContent="flex-end"
                        >
                          <Link
                            underline="none"
                            color="inherit"
                            target="_blank"
                            href={`https://bithomp.com/explorer/${safeTrader.address}`}
                            rel="noreferrer noopener nofollow"
                          >
                            <IconButton edge="end" aria-label="bithomp" size="small">
                              <LinkIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Link>
                          <Tooltip title="View Trader Statistics">
                            <IconButton
                              edge="end"
                              aria-label="stats"
                              onClick={() => handleOpenStats(safeTrader)}
                              size="small"
                            >
                              <BarChartIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Copy JSON Data">
                            <IconButton
                              edge="end"
                              aria-label="copy-json"
                              onClick={() => handleCopyJson(safeTrader)}
                              size="small"
                            >
                              {copiedTrader === safeTrader.address ? (
                                <CheckIcon sx={{ fontSize: 16, color: '#54D62C' }} />
                              ) : (
                                <ContentCopyIcon sx={{ fontSize: 16 }} />
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
              rowsPerPageOptions={[5, 10, 20, 25, 50, 100]}
              component="div"
              count={sortedTraders.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{
                '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                  fontSize: '0.75rem'
                },
                '.MuiTablePagination-select': {
                  fontSize: '0.75rem'
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
    </>
  );
}