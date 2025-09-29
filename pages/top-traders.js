import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styled from '@emotion/styled';
import { useTheme } from '@mui/material/styles';
import {
  Container, Box, Typography, TextField, InputAdornment, IconButton,
  CircularProgress, FormControlLabel, Switch, Chip, Select, MenuItem,
  FormControl, InputLabel, Button, Tooltip, Paper, Fade, Skeleton
} from '@mui/material';
import {
  Search, Clear, TrendingUp, TrendingDown, FilterList,
  ArrowUpward, ArrowDownward, Info, Casino, ShowChart,
  AccountBalance, Speed, Timer, EmojiEvents, FirstPage, LastPage,
  ViewList, ArrowDropDown
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
// Constants
const currencySymbols = {
  USD: '$ ',
  EUR: '€ ',
  JPY: '¥ ',
  CNH: '¥ ',
  XRP: '✕ '
};

// Table Styled Components
const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
`;

const StyledTableHead = styled.thead`
  position: sticky;
  top: 0px;
  z-index: 10;
  background: transparent;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 1px;
    background: ${(props) =>
      props.darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'};
  }
`;

const StyledTableCell = styled.th`
  font-weight: 700;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: ${(props) => (props.darkMode ? '#999' : '#666')};
  padding: 16px 12px;
  border-bottom: 1px solid
    ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)')};
  white-space: nowrap;
  text-align: ${(props) => props.align || 'left'};
  width: ${(props) => props.width || 'auto'};
  box-sizing: border-box;
  cursor: ${(props) => (props.sortable ? 'pointer' : 'default')};

  &:hover {
    color: ${(props) => (props.sortable ? (props.darkMode ? '#fff' : '#000') : 'inherit')};
  }
`;

const StyledTableRow = styled.tr`
  background: ${({ theme, darkMode }) => darkMode ? '#000' : '#fff'};
  border-bottom: 1px solid ${({ darkMode }) => darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'};
  transition: all 0.3s;
  cursor: pointer;

  &:hover {
    background: ${({ theme, darkMode }) => darkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)'};
    transform: translateX(2px);
  }
`;

const StyledTableData = styled.td`
  padding: 16px 12px;
  font-size: 0.875rem;
  color: ${({ theme, darkMode }) => darkMode ? '#fff' : '#000'};
  text-align: ${(props) => props.align || 'left'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SortIndicator = styled.span`
  display: inline-block;
  margin-left: 4px;
  font-size: 0.65rem;
  color: ${(props) => (props.active ? '#2196f3' : props.darkMode ? '#666' : '#999')};
  transition: transform 0.2s;
  transform: ${(props) => (props.direction === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)')};
`;

// Toolbar Components
const StyledToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  gap: 16px;
  flex-wrap: wrap;
`;

const PaginationContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 16px;
  background: ${({ theme }) => theme.palette.background.paper};
  border: 1px solid ${({ theme }) => alpha(theme.palette.divider, 0.12)};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
`;

const InfoBox = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid ${({ theme }) => alpha(theme.palette.divider, 0.12)};
  border-radius: 16px;
  background: ${({ theme }) => theme.palette.background.paper};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  padding: 8px 12px;
`;

const NavButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: inherit;

  &:hover:not(:disabled) {
    background: ${({ theme }) => alpha(theme.palette.primary.main, 0.08)};
  }

  &:disabled {
    color: ${({ theme }) => alpha(theme.palette.text.primary, 0.48)};
    cursor: not-allowed;
  }
`;

const PageButton = styled.button`
  min-width: 24px;
  height: 24px;
  border-radius: 6px;
  border: none;
  background: ${(props) =>
    props.selected ? props.theme.palette.primary.main : 'transparent'};
  color: ${(props) => (props.selected ? 'white' : 'inherit')};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  font-size: 12px;
  font-weight: ${(props) => (props.selected ? 600 : 500)};

  &:hover:not(:disabled) {
    background: ${(props) =>
      props.selected
        ? props.theme.palette.primary.dark
        : alpha(props.theme.palette.primary.main, 0.08)};
  }
`;

const RankBadge = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: ${(props) => props.isTop3 ? '#000' : props.theme.palette.action.hover};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  color: ${(props) => props.isTop3 ? '#fff' : 'inherit'};
`;

const MetricValue = styled.span`
  font-weight: 600;
  color: ${(props) => {
    if (props.type === 'profit') {
      return props.value >= 0 ? props.theme.palette.success.main : props.theme.palette.error.main;
    }
    if (props.type === 'winRate') {
      return props.value >= 60 ? props.theme.palette.success.main
        : props.value >= 40 ? props.theme.palette.warning.main
        : props.theme.palette.error.main;
    }
    return 'inherit';
  }};
`;

const FilterSection = styled(Paper)`
  padding: 20px;
  border-radius: 16px;
  margin-bottom: 20px;
`;

const SortButton = styled(Button)`
  text-transform: none;
  border-radius: 8px;
  padding: 6px 12px;
  font-weight: 500;
  margin: 2px;
`;

// API Hook
const useTraderStats = (filters = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams(filters);
        const response = await fetch(
          `https://api.xrpl.to/api/analytics/cumulative-stats?${params}`,
          { headers: { Accept: 'application/json' } }
        );

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(errorData || `HTTP ${response.status}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('API Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [JSON.stringify(filters)]);

  return { data, loading, error };
};

// Table Head Component
const TraderTableHead = memo(({ order, orderBy, onRequestSort, darkMode }) => {
  const headers = [
    { id: 'rank', label: '#', align: 'center', width: '60px', sortable: false },
    { id: 'address', label: 'TRADER', align: 'left', width: '200px', sortable: false },
    { id: 'volume24h', label: 'VOLUME 24H', align: 'right', width: '120px', sortable: true },
    { id: 'winRate', label: 'WIN RATE', align: 'right', width: '100px', sortable: true },
    { id: 'totalProfit', label: 'TOTAL PROFIT', align: 'right', width: '120px', sortable: true },
    { id: 'avgROI', label: 'AVG ROI', align: 'right', width: '100px', sortable: true },
    { id: 'totalTrades', label: 'TRADES', align: 'right', width: '100px', sortable: true },
    { id: 'totalTokensTraded', label: 'TOKENS', align: 'right', width: '80px', sortable: true },
    { id: 'activityScore', label: 'ACTIVITY', align: 'right', width: '80px', sortable: true },
  ];

  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  return (
    <StyledTableHead darkMode={darkMode}>
      <tr>
        {headers.map((headCell) => (
          <StyledTableCell
            key={headCell.id}
            align={headCell.align}
            width={headCell.width}
            darkMode={darkMode}
            sortable={headCell.sortable}
            onClick={headCell.sortable ? createSortHandler(headCell.id) : undefined}
          >
            {headCell.label}
            {headCell.sortable && orderBy === headCell.id && (
              <SortIndicator active={true} direction={order} darkMode={darkMode}>
                ▼
              </SortIndicator>
            )}
          </StyledTableCell>
        ))}
      </tr>
    </StyledTableHead>
  );
});

// Trader Row Component
const TraderRow = memo(({ trader, rank, theme, darkMode }) => {
  const formatValue = (value, type = 'currency') => {
    if (value == null) return '-';
    switch (type) {
      case 'currency':
        return `${currencySymbols.XRP}${Math.abs(value).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`;
      case 'percent':
        return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
      case 'number':
        return value >= 1000000 ? `${(value/1000000).toFixed(1)}M`
          : value >= 1000 ? `${(value/1000).toFixed(1)}K`
          : value.toLocaleString();
      default:
        return value;
    }
  };

  return (
    <StyledTableRow theme={theme} darkMode={darkMode}>
      <StyledTableData align="center" darkMode={darkMode}>
        <RankBadge theme={theme} isTop3={rank <= 3}>
          {rank <= 3 ? <EmojiEvents fontSize="small" /> : rank}
        </RankBadge>
      </StyledTableData>

      <StyledTableData align="left" darkMode={darkMode}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography
            component="a"
            href={`/profile/${trader.address}`}
            sx={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'primary.main',
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            {trader.address.slice(0, 6)}...{trader.address.slice(-4)}
          </Typography>
          {trader.AMM && (
            <Chip label="AMM" size="small" color="info" sx={{ height: 20, fontSize: '10px' }} />
          )}
        </Box>
      </StyledTableData>

      <StyledTableData align="right" darkMode={darkMode}>
        {formatValue(trader.volume24h)}
      </StyledTableData>

      <StyledTableData align="right" darkMode={darkMode}>
        <MetricValue theme={theme} type="winRate" value={trader.winRate}>
          {trader.winRate?.toFixed(1) || 0}%
        </MetricValue>
      </StyledTableData>

      <StyledTableData align="right" darkMode={darkMode}>
        <MetricValue theme={theme} type="profit" value={trader.totalProfit}>
          {trader.totalProfit >= 0 ? '+' : ''}{formatValue(trader.totalProfit)}
        </MetricValue>
      </StyledTableData>

      <StyledTableData align="right" darkMode={darkMode}>
        <MetricValue theme={theme} type="profit" value={trader.avgROI}>
          {formatValue(trader.avgROI, 'percent')}
        </MetricValue>
      </StyledTableData>

      <StyledTableData align="right" darkMode={darkMode}>
        {formatValue(trader.totalTrades, 'number')}
      </StyledTableData>

      <StyledTableData align="right" darkMode={darkMode}>
        {trader.totalTokensTraded || 0}
      </StyledTableData>

      <StyledTableData align="right" darkMode={darkMode}>
        {trader.activityScore || '-'}
      </StyledTableData>
    </StyledTableRow>
  );
});

// Toolbar Component
const TraderToolbar = memo(({
  totalCount,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange
}) => {
  const pageCount = Math.ceil(totalCount / rowsPerPage);
  const start = totalCount > 0 ? page * rowsPerPage + 1 : 0;
  const end = Math.min(start + rowsPerPage - 1, totalCount);

  const getPageNumbers = () => {
    const pages = [];
    const current = page + 1;
    const total = pageCount;

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 3) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(total);
      } else if (current >= total - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(total);
      }
    }
    return pages;
  };

  return (
    <StyledToolbar>
      <InfoBox>
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          {start}-{end} of {totalCount.toLocaleString()} traders
        </Typography>
      </InfoBox>

      <PaginationContainer>
        <NavButton
          onClick={() => onPageChange(0)}
          disabled={page === 0}
          title="First page"
        >
          <FirstPage fontSize="small" />
        </NavButton>

        {getPageNumbers().map((pageNum, idx) => {
          if (pageNum === '...') {
            return (
              <span key={`ellipsis-${idx}`} style={{ padding: '0 8px', fontSize: '12px' }}>
                ...
              </span>
            );
          }
          return (
            <PageButton
              key={pageNum}
              selected={pageNum === page + 1}
              onClick={() => onPageChange(pageNum - 1)}
            >
              {pageNum}
            </PageButton>
          );
        })}

        <NavButton
          onClick={() => onPageChange(pageCount - 1)}
          disabled={page === pageCount - 1}
          title="Last page"
        >
          <LastPage fontSize="small" />
        </NavButton>
      </PaginationContainer>

      <Box display="flex" alignItems="center" gap={1}>
        <ViewList fontSize="small" />
        <Typography variant="caption">Rows</Typography>
        <FormControl size="small" sx={{ minWidth: 60 }}>
          <Select
            value={rowsPerPage}
            onChange={(e) => onRowsPerPageChange(e.target.value)}
            sx={{ fontSize: '12px' }}
          >
            <MenuItem value={25}>25</MenuItem>
            <MenuItem value={50}>50</MenuItem>
            <MenuItem value={100}>100</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </StyledToolbar>
  );
});

// Main Component
export default function TopTraders() {
  const theme = useTheme();
  const router = useRouter();
  const darkMode = theme.palette.mode === 'dark';

  const [filters, setFilters] = useState({
    page: 1,
    limit: 25,
    sortBy: 'volume24h',
    sortOrder: 'desc',
    includeAMM: 'true'
  });
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('volume24h');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activePeriod, setActivePeriod] = useState('');
  const [minFilters, setMinFilters] = useState({});

  const { data, loading, error } = useTraderStats({
    ...filters,
    page: page + 1,
    limit: rowsPerPage,
    sortBy: orderBy,
    sortOrder: order
  });

  // Sorting presets
  const sortPresets = [
    { label: '24h Volume', value: 'volume24h', icon: <ShowChart /> },
    { label: 'Win Rate', value: 'winRate', icon: <Casino /> },
    { label: 'Total Profit', value: 'totalProfit', icon: <AccountBalance /> },
    { label: 'ROI', value: 'avgROI', icon: <TrendingUp /> },
    { label: 'Activity Score', value: 'activityScore', icon: <Speed /> },
    { label: 'Profit Factor', value: 'profitFactor', icon: <ShowChart /> },
    { label: 'Trades', value: 'totalTrades', icon: <Timer /> },
    { label: 'Tokens', value: 'totalTokensTraded', icon: <Speed /> }
  ];

  const handleSearch = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      address: searchInput.trim()
    }));
    setPage(0);
  }, [searchInput]);

  const handleRequestSort = useCallback((event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
    setPage(0);
  }, [order, orderBy]);

  const handleSort = useCallback((sortBy) => {
    const isAsc = orderBy === sortBy && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(sortBy);
    setPage(0);
  }, [order, orderBy]);

  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
  }, []);

  const handleRowsPerPageChange = useCallback((newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  }, []);

  const applyAdvancedFilters = useCallback(() => {
    const newFilters = { ...filters };

    if (activePeriod) newFilters.activePeriod = activePeriod;
    if (minFilters.minTrades) newFilters.minTrades = minFilters.minTrades;
    if (minFilters.minProfit) newFilters.minProfit = minFilters.minProfit;
    if (minFilters.minROI) newFilters.minROI = minFilters.minROI;
    if (minFilters.minTokens) newFilters.minTokens = minFilters.minTokens;
    if (minFilters.minVolume) newFilters.minVolume = minFilters.minVolume;

    setFilters(newFilters);
    setShowFilters(false);
    setPage(0);
  }, [filters, activePeriod, minFilters]);

  const clearFilters = useCallback(() => {
    setFilters({
      page: 1,
      limit: 25,
      sortBy: 'volume24h',
      sortOrder: 'desc',
      includeAMM: 'true'
    });
    setSearchInput('');
    setActivePeriod('');
    setMinFilters({});
    setPage(0);
    setOrder('desc');
    setOrderBy('volume24h');
  }, []);

  return (
    <>
      <Head>
        <title>Top Traders Analytics - XRPL.to</title>
        <meta name="description" content="Advanced trader analytics and leaderboard for XRPL ecosystem" />
      </Head>

      <Header />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box mb={4}>
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Top Traders Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track performance metrics, ROI trends, and trading patterns of top XRPL traders
          </Typography>
        </Box>

        {/* Search & Filters */}
        <FilterSection>
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <TextField
              placeholder="Search trader address..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
                endAdornment: searchInput && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchInput('')}>
                      <Clear />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ minWidth: 300 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={filters.includeAMM === 'false'}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    includeAMM: e.target.checked ? 'false' : 'true'
                  }))}
                />
              }
              label="Hide AMM"
            />

            <Button
              startIcon={<FilterList />}
              onClick={() => setShowFilters(!showFilters)}
              variant={showFilters ? "contained" : "outlined"}
            >
              Advanced Filters
            </Button>

            {(searchInput || activePeriod || Object.keys(minFilters).length > 0) && (
              <Button onClick={clearFilters} color="error" variant="text">
                Clear All
              </Button>
            )}
          </Box>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <Fade in={showFilters}>
              <Box mt={3} p={3} bgcolor={alpha(theme.palette.primary.main, 0.02)} borderRadius="12px">
                <Typography variant="h6" gutterBottom>Advanced Filters</Typography>
                <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={2}>
                  <FormControl size="small">
                    <InputLabel>Activity Period</InputLabel>
                    <Select
                      value={activePeriod}
                      onChange={(e) => setActivePeriod(e.target.value)}
                      label="Activity Period"
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="24h">Last 24 Hours</MenuItem>
                      <MenuItem value="7d">Last 7 Days</MenuItem>
                      <MenuItem value="30d">Last 30 Days</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    size="small"
                    label="Min Trades"
                    type="number"
                    value={minFilters.minTrades || ''}
                    onChange={(e) => setMinFilters(prev => ({ ...prev, minTrades: e.target.value }))}
                  />

                  <TextField
                    size="small"
                    label="Min Profit"
                    type="number"
                    value={minFilters.minProfit || ''}
                    onChange={(e) => setMinFilters(prev => ({ ...prev, minProfit: e.target.value }))}
                  />

                  <TextField
                    size="small"
                    label="Min ROI %"
                    type="number"
                    value={minFilters.minROI || ''}
                    onChange={(e) => setMinFilters(prev => ({ ...prev, minROI: e.target.value }))}
                  />

                  <TextField
                    size="small"
                    label="Min Tokens"
                    type="number"
                    value={minFilters.minTokens || ''}
                    onChange={(e) => setMinFilters(prev => ({ ...prev, minTokens: e.target.value }))}
                  />

                  <TextField
                    size="small"
                    label="Min Volume"
                    type="number"
                    value={minFilters.minVolume || ''}
                    onChange={(e) => setMinFilters(prev => ({ ...prev, minVolume: e.target.value }))}
                  />
                </Box>

                <Box mt={2} display="flex" gap={2}>
                  <Button variant="contained" onClick={applyAdvancedFilters}>
                    Apply Filters
                  </Button>
                  <Button variant="outlined" onClick={() => setShowFilters(false)}>
                    Cancel
                  </Button>
                </Box>
              </Box>
            </Fade>
          )}
        </FilterSection>

        {/* Sort Options */}
        <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
          {sortPresets.map(preset => (
            <SortButton
              key={preset.value}
              variant={orderBy === preset.value ? "contained" : "outlined"}
              size="small"
              startIcon={preset.icon}
              endIcon={
                orderBy === preset.value &&
                (order === 'desc' ? <ArrowDownward fontSize="small" /> : <ArrowUpward fontSize="small" />)
              }
              onClick={() => handleSort(preset.value)}
            >
              {preset.label}
            </SortButton>
          ))}
        </Box>

        {/* Table */}
        {loading ? (
          <Box>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={`top-traders-skeleton-${i}`} variant="rectangular" height={60} sx={{ mb: 1, borderRadius: '8px' }} />
            ))}
          </Box>
        ) : error ? (
          <Box textAlign="center" py={8}>
            <Typography variant="h6" color="error" gutterBottom>Error Loading Data</Typography>
            <Typography color="text.secondary">{error}</Typography>
          </Box>
        ) : data?.data?.length > 0 ? (
          <Paper sx={{ borderRadius: '16px', overflow: 'hidden' }}>
            <StyledTable>
              <TraderTableHead
                order={order}
                orderBy={orderBy}
                onRequestSort={handleRequestSort}
                darkMode={darkMode}
              />
              <tbody>
                {data.data.map((trader, index) => (
                  <TraderRow
                    key={trader.address}
                    trader={trader}
                    rank={page * rowsPerPage + index + 1}
                    theme={theme}
                    darkMode={darkMode}
                  />
                ))}
              </tbody>
            </StyledTable>

            <TraderToolbar
              totalCount={data.pagination?.total || 0}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
            />
          </Paper>
        ) : (
          <Box textAlign="center" py={8}>
            <Typography variant="h6" color="text.secondary">No traders found</Typography>
          </Box>
        )}
      </Container>

      <Footer />
    </>
  );
}