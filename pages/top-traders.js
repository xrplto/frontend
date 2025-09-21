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
  AccountBalance, Speed, Timer, EmojiEvents
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import Topbar from '../src/components/Topbar';
import { currencySymbols } from 'src/utils/constants';

// Styled Components
const StatsCard = styled(Paper)`
  padding: 16px;
  border-radius: 16px;
  background: ${({ theme }) => theme.palette.mode === 'dark'
    ? 'rgba(255, 255, 255, 0.02)'
    : 'rgba(0, 0, 0, 0.02)'};
  border: 1px solid ${({ theme }) => theme.palette.mode === 'dark'
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(0, 0, 0, 0.08)'};
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
`;

const TraderCard = styled(Box)`
  background: ${({ theme }) => theme.palette.mode === 'dark'
    ? 'rgba(255, 255, 255, 0.02)'
    : 'rgba(255, 255, 255, 0.98)'};
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid ${({ theme }) => theme.palette.mode === 'dark'
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(0, 0, 0, 0.08)'};
  transition: all 0.3s;
  cursor: pointer;

  &:hover {
    transform: translateX(4px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border-color: ${({ theme }) => theme.palette.primary.main};
  }
`;

const MetricBadge = styled(Chip)`
  font-weight: 600;
  height: 28px;
  border-radius: 8px;
`;

const SortButton = styled(Button)`
  text-transform: none;
  border-radius: 12px;
  padding: 8px 16px;
  font-weight: 500;
  transition: all 0.2s;
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

// Trader Row Component
const TraderRow = memo(({ trader, rank, theme }) => {
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
      case 'ratio':
        return value.toFixed(3);
      default:
        return value;
    }
  };

  const getValueColor = (value, type = 'profit') => {
    if (type === 'profit') {
      return value >= 0 ? 'success.main' : 'error.main';
    }
    if (type === 'winRate') {
      return value >= 60 ? 'success.main' : value >= 40 ? 'warning.main' : 'error.main';
    }
    return 'text.primary';
  };

  return (
    <TraderCard theme={theme}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
        {/* Rank & Address */}
        <Box display="flex" alignItems="center" gap={2} flex="1 1 300px">
          <Box sx={{
            width: 48, height: 48,
            borderRadius: '12px',
            background: rank <= 3
              ? `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`
              : theme.palette.action.hover,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '18px',
            color: rank <= 3 ? '#fff' : 'text.primary'
          }}>
            {rank <= 3 ? <EmojiEvents /> : rank}
          </Box>

          <Box>
            <Typography
              component="a"
              href={`/profile/${trader.address}`}
              sx={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'text.primary',
                textDecoration: 'none',
                '&:hover': { color: 'primary.main' }
              }}
            >
              {trader.address.slice(0, 6)}...{trader.address.slice(-4)}
            </Typography>
            <Box display="flex" gap={0.5} mt={0.5}>
              {trader.AMM && <MetricBadge label="AMM" size="small" color="info" />}
              {trader.activeTokens24h > 0 &&
                <MetricBadge label={`${trader.activeTokens24h} Active`} size="small" variant="outlined" />
              }
            </Box>
          </Box>
        </Box>

        {/* Key Metrics */}
        <Box display="flex" flexWrap="wrap" gap={3} alignItems="center">
          {/* Volume */}
          <Box textAlign="center">
            <Typography variant="caption" color="text.secondary">24h Volume</Typography>
            <Typography variant="h6" fontWeight={600}>
              {formatValue(trader.volume24h)}
            </Typography>
          </Box>

          {/* Win Rate */}
          <Box textAlign="center">
            <Typography variant="caption" color="text.secondary">Win Rate</Typography>
            <Typography
              variant="h6"
              fontWeight={600}
              color={getValueColor(trader.winRate, 'winRate')}
            >
              {trader.winRate?.toFixed(1) || 0}%
            </Typography>
          </Box>

          {/* Total Profit */}
          <Box textAlign="center">
            <Typography variant="caption" color="text.secondary">Total Profit</Typography>
            <Typography
              variant="h6"
              fontWeight={600}
              color={getValueColor(trader.totalProfit)}
            >
              {trader.totalProfit >= 0 ? '+' : ''}{formatValue(trader.totalProfit)}
            </Typography>
          </Box>

          {/* ROI */}
          <Box textAlign="center">
            <Typography variant="caption" color="text.secondary">Avg ROI</Typography>
            <Typography
              variant="h6"
              fontWeight={600}
              color={getValueColor(trader.avgROI)}
            >
              {formatValue(trader.avgROI, 'percent')}
            </Typography>
          </Box>

          {/* Profit Factor */}
          {trader.profitFactor != null && (
            <Box textAlign="center">
              <Typography variant="caption" color="text.secondary">Profit Factor</Typography>
              <Typography variant="h6" fontWeight={600}>
                {formatValue(trader.profitFactor, 'ratio')}
              </Typography>
            </Box>
          )}

          {/* Activity Score */}
          {trader.activityScore != null && (
            <Box textAlign="center">
              <Typography variant="caption" color="text.secondary">Activity</Typography>
              <Typography variant="h6" fontWeight={600} color="info.main">
                {trader.activityScore}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Additional Stats */}
      <Box display="flex" gap={2} mt={2} pt={2} borderTop="1px solid" borderColor="divider">
        <Typography variant="caption" color="text.secondary">
          <strong>{formatValue(trader.totalTrades, 'number')}</strong> trades
        </Typography>
        <Typography variant="caption" color="text.secondary">
          <strong>{trader.totalTokensTraded || 0}</strong> tokens
        </Typography>
        <Typography variant="caption" color="text.secondary">
          <strong>{formatValue(trader.totalVolume)}</strong> total volume
        </Typography>
        {trader.volumeEfficiency != null && (
          <Typography variant="caption" color="text.secondary">
            <strong>{trader.volumeEfficiency.toFixed(4)}</strong> efficiency
          </Typography>
        )}
      </Box>
    </TraderCard>
  );
});

// Main Component
export default function TopTraders() {
  const theme = useTheme();
  const router = useRouter();
  const [filters, setFilters] = useState({
    page: 1,
    limit: 25,
    sortBy: 'volume24h',
    sortOrder: 'desc',
    includeAMM: 'true'
  });

  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activePeriod, setActivePeriod] = useState('');
  const [minFilters, setMinFilters] = useState({});

  const { data, loading, error } = useTraderStats(filters);

  // Sorting presets
  const sortPresets = [
    { label: '24h Volume', value: 'volume24h', icon: <ShowChart /> },
    { label: 'Win Rate', value: 'winRate', icon: <Casino /> },
    { label: 'Total Profit', value: 'totalProfit', icon: <AccountBalance /> },
    { label: 'ROI', value: 'avgROI', icon: <TrendingUp /> },
    { label: 'Activity Score', value: 'activityScore', icon: <Speed /> },
    { label: 'Profit Factor', value: 'profitFactor', icon: <ShowChart /> },
    { label: 'Consistency', value: 'tradingConsistency', icon: <Timer /> },
    { label: 'Efficiency', value: 'volumeEfficiency', icon: <Speed /> }
  ];

  const handleSearch = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      address: searchInput.trim(),
      page: 1
    }));
  }, [searchInput]);

  const handleSort = useCallback((sortBy) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'desc' ? 'asc' : 'desc',
      page: 1
    }));
  }, []);

  const applyAdvancedFilters = useCallback(() => {
    const newFilters = { ...filters, page: 1 };

    if (activePeriod) newFilters.activePeriod = activePeriod;
    if (minFilters.minTrades) newFilters.minTrades = minFilters.minTrades;
    if (minFilters.minProfit) newFilters.minProfit = minFilters.minProfit;
    if (minFilters.minROI) newFilters.minROI = minFilters.minROI;
    if (minFilters.minTokens) newFilters.minTokens = minFilters.minTokens;
    if (minFilters.minVolume) newFilters.minVolume = minFilters.minVolume;

    setFilters(newFilters);
    setShowFilters(false);
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
  }, []);

  return (
    <>
      <Head>
        <title>Top Traders Analytics - XRPL.to</title>
        <meta name="description" content="Advanced trader analytics and leaderboard for XRPL ecosystem" />
      </Head>

      <Topbar />
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

        {/* Stats Overview */}
        {data && !loading && (
          <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={2} mb={4}>
            <StatsCard theme={theme}>
              <Typography variant="caption" color="text.secondary">Total Traders</Typography>
              <Typography variant="h5" fontWeight={600}>{data.pagination?.total?.toLocaleString()}</Typography>
            </StatsCard>
            <StatsCard theme={theme}>
              <Typography variant="caption" color="text.secondary">Active 24h</Typography>
              <Typography variant="h5" fontWeight={600}>
                {data.data?.filter(t => t.trades24h > 0).length || 0}
              </Typography>
            </StatsCard>
            <StatsCard theme={theme}>
              <Typography variant="caption" color="text.secondary">Avg Win Rate</Typography>
              <Typography variant="h5" fontWeight={600} color="success.main">
                {(data.data?.reduce((acc, t) => acc + (t.winRate || 0), 0) / (data.data?.length || 1)).toFixed(1)}%
              </Typography>
            </StatsCard>
            <StatsCard theme={theme}>
              <Typography variant="caption" color="text.secondary">Total Volume 24h</Typography>
              <Typography variant="h5" fontWeight={600}>
                {currencySymbols.XRP}{(data.data?.reduce((acc, t) => acc + (t.volume24h || 0), 0) / 1000000).toFixed(1)}M
              </Typography>
            </StatsCard>
          </Box>
        )}

        {/* Search & Filters */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: '16px' }}>
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
                    includeAMM: e.target.checked ? 'false' : 'true',
                    page: 1
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
        </Paper>

        {/* Sort Options */}
        <Box display="flex" gap={1} flexWrap="wrap" mb={3}>
          {sortPresets.map(preset => (
            <SortButton
              key={preset.value}
              variant={filters.sortBy === preset.value ? "contained" : "outlined"}
              size="small"
              startIcon={preset.icon}
              endIcon={
                filters.sortBy === preset.value &&
                (filters.sortOrder === 'desc' ? <ArrowDownward fontSize="small" /> : <ArrowUpward fontSize="small" />)
              }
              onClick={() => handleSort(preset.value)}
            >
              {preset.label}
            </SortButton>
          ))}
        </Box>

        {/* Results */}
        {loading ? (
          <Box>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={150} sx={{ mb: 2, borderRadius: '20px' }} />
            ))}
          </Box>
        ) : error ? (
          <Box textAlign="center" py={8}>
            <Typography variant="h6" color="error" gutterBottom>Error Loading Data</Typography>
            <Typography color="text.secondary">{error}</Typography>
          </Box>
        ) : data?.data?.length > 0 ? (
          <>
            {data.data.map((trader, index) => (
              <TraderRow
                key={trader.address}
                trader={trader}
                rank={(filters.page - 1) * filters.limit + index + 1}
                theme={theme}
              />
            ))}

            {/* Pagination */}
            {data.pagination && data.pagination.totalPages > 1 && (
              <Box display="flex" justifyContent="center" gap={2} mt={4}>
                <Button
                  disabled={!data.pagination.hasPrevPage}
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Previous
                </Button>

                <Box display="flex" alignItems="center" gap={1}>
                  {[...Array(Math.min(7, data.pagination.totalPages))].map((_, i) => {
                    let pageNum;
                    if (data.pagination.totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (filters.page <= 4) {
                      pageNum = i < 5 ? i + 1 : i === 5 ? '...' : data.pagination.totalPages;
                    } else if (filters.page >= data.pagination.totalPages - 3) {
                      pageNum = i === 0 ? 1 : i === 1 ? '...' : data.pagination.totalPages - 6 + i;
                    } else {
                      pageNum = i === 0 ? 1 : i === 1 ? '...' : i === 5 ? '...' : i === 6 ? data.pagination.totalPages : filters.page - 3 + i;
                    }

                    return pageNum === '...' ? (
                      <span key={i}>...</span>
                    ) : (
                      <Button
                        key={i}
                        size="small"
                        variant={pageNum === filters.page ? "contained" : "text"}
                        onClick={() => setFilters(prev => ({ ...prev, page: pageNum }))}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </Box>

                <Button
                  disabled={!data.pagination.hasNextPage}
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next
                </Button>
              </Box>
            )}
          </>
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