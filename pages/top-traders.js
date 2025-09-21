import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import PropTypes from 'prop-types';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Button from '@mui/material/Button';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import Topbar from '../src/components/Topbar';
import { useDispatch, useSelector } from 'react-redux';
import { update_metrics } from 'src/redux/statusSlice';
import { alpha } from '@mui/material/styles';
import Link from 'next/link';
import Head from 'next/head';

// Styled components for cleaner table styling
const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: '12px',
  overflow: 'hidden',
  background: 'transparent',
  border: 'none',
  boxShadow: 'none'
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
  transition: 'background-color 0.15s ease',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor:
      theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)'
  },
  '&:last-child': {
    borderBottom: 'none'
  },
  td: {
    borderBottom: 'none'
  }
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: '12px 8px',
  whiteSpace: 'nowrap',
  fontSize: '13px',
  color: theme.palette.mode === 'dark' ? '#fff' : '#000',
  verticalAlign: 'middle',
  borderBottom: 'none',
  backgroundColor: 'transparent'
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
  background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
  th: {
    fontWeight: 600,
    fontSize: '12px',
    color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
    padding: '14px 8px',
    borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}`,
    backgroundColor: 'transparent'
  }
}));

const AddressCell = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '10px'
}));

const TraderAvatar = styled('div')(({ theme }) => ({
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 600,
  fontSize: '14px',
  color: theme.palette.primary.main,
  flexShrink: 0
}));

const TraderInfo = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  minWidth: 0
}));

const TraderAddress = styled('a')(({ theme }) => ({
  fontWeight: 600,
  fontSize: '14px',
  color: theme.palette.mode === 'dark' ? '#fff' : '#000',
  textDecoration: 'none',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: '200px',
  display: 'block',
  '&:hover': {
    color: theme.palette.primary.main,
    textDecoration: 'underline'
  }
}));

const TraderLabel = styled('span')(({ theme }) => ({
  fontSize: '11px',
  color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
  fontWeight: 400
}));

const ValueText = styled('span')(({ theme, bold, small }) => ({
  fontWeight: bold ? '600' : '500',
  fontSize: small ? '12px' : '14px',
  color: theme.palette.mode === 'dark' ? '#fff' : '#000'
}));

const PercentText = styled('span')(({ theme, value }) => ({
  fontWeight: 600,
  fontSize: '13px',
  color:
    value >= 0
      ? theme.palette.mode === 'dark'
        ? '#66BB6A'
        : '#388E3C'
      : theme.palette.mode === 'dark'
        ? '#FF5252'
        : '#D32F2F'
}));



// Memoized TraderRow component to prevent unnecessary re-renders
const TraderRow = memo(
  ({ trader, formatCurrency, formatPercentage, isMobile, index, scrollLeft }) => {
    const theme = useTheme();
    const stickyCellStyles = useMemo(
      () => ({
        first: {
          position: 'sticky',
          zIndex: 1001,
          left: 0,
          backgroundColor: 'transparent',
          width: isMobile ? '10px' : '40px',
          minWidth: isMobile ? '10px' : '40px',
          padding: isMobile ? '0px' : '12px 4px'
        },
        second: {
          position: 'sticky',
          zIndex: 1001,
          left: isMobile ? '10px' : '40px',
          backgroundColor: 'transparent',
          width: isMobile ? '14px' : '50px',
          minWidth: isMobile ? '14px' : '50px',
          padding: isMobile ? '1px 1px' : '12px 8px'
        },
        third: {
          position: 'sticky',
          zIndex: 1001,
          left: isMobile ? '24px' : '90px',
          backgroundColor: 'transparent',
          minWidth: isMobile ? '80px' : '250px',
          maxWidth: isMobile ? '100px' : 'none',
          padding: isMobile ? '1px 4px' : '12px 8px',
          '&:before': scrollLeft
            ? {
                content: "''",
                boxShadow: 'inset 10px 0 8px -8px rgba(145, 158, 171, 0.24)',
                position: 'absolute',
                top: '0',
                right: '0',
                bottom: '-1px',
                width: '30px',
                transform: 'translate(100%)',
                transition: 'box-shadow .3s',
                pointerEvents: 'none'
              }
            : {}
        }
      }),
      [theme, isMobile, scrollLeft]
    );

    // Removed - using styled components instead


    return (
      <StyledTableRow key={trader._id}>
        <StyledTableCell align="center" style={{ width: '50px' }}>
          <ValueText
            style={{ fontWeight: '600', color: theme.palette.mode === 'dark' ? '#999' : '#666' }}
          >
            {index + 1}
          </ValueText>
        </StyledTableCell>
        <StyledTableCell component="th" scope="row" style={{ width: '250px' }}>
          <AddressCell>
            {isMobile && (
              <Typography
                variant="h4"
                sx={{
                  fontWeight: '600',
                  fontSize: '9px',
                  color: alpha(theme.palette.text.secondary, 0.7),
                  minWidth: '15px',
                  textAlign: 'center',
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                {index + 1}
              </Typography>
            )}
            <TraderAvatar>{trader.address.slice(0, 1).toUpperCase()}</TraderAvatar>
            <TraderInfo>
              <TraderAddress
                href={`/profile/${trader.address}`}
                onClick={(e) => e.stopPropagation()}
              >
                {isMobile
                  ? `${trader.address.slice(0, 6)}...${trader.address.slice(-4)}`
                  : `${trader.address.slice(0, 12)}...${trader.address.slice(-6)}`}
              </TraderAddress>
              <TraderLabel>Trader</TraderLabel>
            </TraderInfo>
          </AddressCell>
        </StyledTableCell>
        <StyledTableCell align="right">
          <ValueText bold>{formatCurrency(trader.volume24h)}</ValueText>
        </StyledTableCell>
        <StyledTableCell align="right">
          <PercentText value={trader.profit24h}>
            {trader.profit24h >= 0 ? '+' : ''}
            {formatCurrency(trader.profit24h)}
          </PercentText>
        </StyledTableCell>
        <StyledTableCell align="right">
          <ValueText>
            {trader.totalTrades >= 1000000
              ? `${(trader.totalTrades / 1000000).toFixed(1)}M`
              : trader.totalTrades >= 1000
                ? `${(trader.totalTrades / 1000).toFixed(1)}K`
                : trader.totalTrades.toLocaleString()}
          </ValueText>
        </StyledTableCell>
        {!isMobile && (
          <StyledTableCell align="right">
            <PercentText value={trader.totalProfit}>
              {trader.totalProfit >= 0 ? '+' : ''}
              {formatCurrency(trader.totalProfit)}
            </PercentText>
          </StyledTableCell>
        )}
        <StyledTableCell align="right">
          <PercentText value={trader.avgROI}>{formatPercentage(trader.avgROI)}</PercentText>
        </StyledTableCell>
      </StyledTableRow>
    );
  }
);

TraderRow.displayName = 'TraderRow';


export default function Analytics({ initialData, initialError }) {
  const dispatch = useDispatch();
  const [traders, setTraders] = useState(initialData?.data || []);
  const [loading, setLoading] = useState(false);
  const [orderBy, setOrderBy] = useState('volume24h');
  const [order, setOrder] = useState('desc');
  const [error, setError] = useState(initialError || null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialData?.pagination?.totalPages || 0);
  const [totalItems, setTotalItems] = useState(initialData?.pagination?.total || 0);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [searchAddress, setSearchAddress] = useState('');
  const [debouncedSearchAddress, setDebouncedSearchAddress] = useState('');
  const [hideAmm, setHideAmm] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [scrollLeft, setScrollLeft] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const darkMode = theme.palette.mode === 'dark';

  // Add throttling for WebSocket updates to prevent excessive re-renders
  const throttleTimeout = useRef(null);

  const throttledWebSocketHandler = useCallback(
    (data) => {
      // Skip updates if we're already loading to prevent conflicts
      if (loading) return;

      if (throttleTimeout.current) {
        clearTimeout(throttleTimeout.current);
      }

      throttleTimeout.current = setTimeout(() => {
        try {
          dispatch(update_metrics(data));
        } catch (err) {
          console.error('Error processing throttled WebSocket message:', err);
        }
      }, 1000); // Increased throttle to 1 second for better performance
    },
    [dispatch, loading]
  );

  // WebSocket handled globally in _app.js - avoid duplicate connection

  // Cleanup throttle timeout on unmount
  useEffect(() => {
    return () => {
      if (throttleTimeout.current) {
        clearTimeout(throttleTimeout.current);
      }
    };
  }, []);

  // Add debounce effect for search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchAddress(searchAddress);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchAddress]);

  // Reset page when search changes
  useEffect(() => {
    if (debouncedSearchAddress !== '') {
      setPage(1);
      setIsFirstLoad(false); // Ensure we fetch new data
    }
  }, [debouncedSearchAddress]);

  // WebSocket connection is handled globally in _app.js
  // Removed local WebSocket effects to prevent duplicate connections

  // Initialize state from SSR data
  useEffect(() => {
    if (initialData && isFirstLoad) {
      setTraders(initialData.data || []);
      if (initialData.pagination) {
        setTotalPages(initialData.pagination.totalPages || 0);
        setTotalItems(initialData.pagination.total || 0);
      }
      setIsFirstLoad(false);
    }
  }, [initialData, isFirstLoad]);

  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchData = useCallback(async () => {
    // Skip initial fetch if we have SSR data and it's first load
    if (isFirstLoad && initialData) {
      return;
    }

    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        sortBy: orderBy,
        sortOrder: order
      });

      if (debouncedSearchAddress) {
        queryParams.append('address', debouncedSearchAddress.trim());
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(
          `https://api.xrpl.to/api/analytics/cumulative-stats?${queryParams.toString()}`,
          {
            signal: controller.signal,
            headers: {
              Accept: 'application/json'
            }
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();

        // Handle the data structure and pagination
        if (responseData && Array.isArray(responseData.data)) {
          setTraders(responseData.data);

          // Set pagination data with fallbacks
          const pagination = responseData.pagination || {};
          setTotalPages(
            pagination.totalPages ||
              Math.ceil((pagination.total || responseData.data.length) / itemsPerPage)
          );
          setTotalItems(pagination.total || responseData.data.length);
          setError(null);
        } else {
          console.warn('API returned unexpected data structure:', responseData);
          setTraders([]);
          setError('No data available');
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      console.error('Error fetching data:', error);

      // Provide user-friendly error messages
      let errorMessage = 'Failed to load trader data';
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out - please try again';
      } else if (!navigator.onLine) {
        errorMessage = 'Network error - please check your connection';
      }

      setError(errorMessage);
      setTraders([]);
    } finally {
      setLoading(false);
    }
  }, [page, itemsPerPage, orderBy, order, debouncedSearchAddress, isFirstLoad, initialData]);

  useEffect(() => {
    // Only fetch if not first load or if parameters changed
    if (!isFirstLoad) {
      fetchData();
    }
  }, [fetchData, isFirstLoad]);

  // Memoize the handle functions to prevent unnecessary re-renders

  const handleRequestSort = useCallback(
    (property) => {
      const isAsc = orderBy === property && order === 'asc';
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(property);
      setIsFirstLoad(false); // Ensure we fetch new data on sort
    },
    [orderBy, order]
  );


  // Memoize utility functions
  const formatCurrency = useCallback((value) => {
    return (
      new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value || 0) + ' Ꭓ'
    );
  }, []);

  const formatPercentage = useCallback((value) => {
    return `${(value || 0).toFixed(2)}%`;
  }, []);

  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }, []);

  // Memoize the filtered data. Sorting is handled by the API.
  const sortedTraders = useMemo(() => {
    if (!Array.isArray(traders)) {
      return [];
    }

    if (hideAmm) {
      return traders.filter((trader) => !trader.AMM);
    }

    return traders;
  }, [traders, hideAmm]);



  // Memoize pagination handlers to prevent unnecessary re-renders
  const handlePrevPage = useCallback(() => {
    setPage((prev) => Math.max(1, prev - 1));
    setIsFirstLoad(false); // Ensure we fetch new data on page change
  }, []);

  const handleNextPage = useCallback(() => {
    setPage((prev) => Math.min(totalPages, prev + 1));
    setIsFirstLoad(false); // Ensure we fetch new data on page change
  }, [totalPages]);

  // Add scroll handler for sticky shadow effect
  const handleScroll = useCallback((event) => {
    const { target } = event;
    setScrollLeft(target.scrollLeft > 0);
  }, []);

  // Don't show loading state on initial SSR render
  if (loading && !initialData) {
    return (
      <>
        <Topbar />
        <Header />
        <Container maxWidth="xl" sx={{ py: 4, textAlign: 'center' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              p: 6,
              borderRadius: '24px',
              background: 'transparent',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.15)}`
            }}
          >
            <CircularProgress
              size={60}
              thickness={4}
              sx={{
                color: theme.palette.primary.main,
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round'
                }
              }}
            />
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
              Loading trader analytics...
            </Typography>
          </Box>
        </Container>
        <Footer />
      </>
    );
  }

  // Early return for error state
  if (error) {
    return (
      <>
        <Topbar />
        <Header />
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box
            sx={{
              p: 4,
              borderRadius: '24px',
              background: 'transparent',
              border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
              textAlign: 'center'
            }}
          >
            <Typography color="error.main" variant="h6" sx={{ fontWeight: 600 }}>
              Error: {error}
            </Typography>
          </Box>
        </Container>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Top Traders Analytics - XRPL.to</title>
        <meta
          name="description"
          content="Discover the most successful traders on the XRPL ecosystem. Track performance metrics, ROI trends, and trading patterns of top performers in real-time."
        />
        <meta
          name="keywords"
          content="XRPL traders, XRP trading, crypto analytics, trading metrics, ROI analysis, XRPL ecosystem"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Top Traders Analytics - XRPL.to" />
        <meta
          property="og:description"
          content="Discover the most successful traders on the XRPL ecosystem. Track performance metrics, ROI trends, and trading patterns of top performers."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://xrpl.to/top-traders" />
        <meta property="og:site_name" content="XRPL.to" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Top Traders Analytics - XRPL.to" />
        <meta
          name="twitter:description"
          content="Discover the most successful traders on the XRPL ecosystem. Track performance metrics, ROI trends, and trading patterns."
        />
        <link rel="canonical" href="https://xrpl.to/top-traders" />
      </Head>
      <Topbar />
      <Header />
      <Container maxWidth="xl">
        <Box
          sx={{
            flex: 1,
            py: { xs: 1, sm: 2, md: 3 },
            background: 'transparent',
            minHeight: '100vh'
          }}
        >
          <Container
            maxWidth="xl"
            sx={{
              mt: { xs: 2, sm: 3, md: 4 },
              mb: { xs: 2, sm: 3, md: 4 }
            }}
          >
            <Box
              sx={{
                p: { xs: 2, sm: 3, md: 4 }
              }}
            >
              {loading && !isFirstLoad && (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 8,
                    background: 'transparent',
                    borderRadius: '16px',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <CircularProgress
                    size={48}
                    sx={{
                      color: theme.palette.primary.main,
                      mb: 2,
                      '& .MuiCircularProgress-circle': {
                        strokeLinecap: 'round'
                      }
                    }}
                  />
                  <Typography
                    variant="h6"
                    sx={{
                      color: theme.palette.text.primary,
                      fontWeight: 600,
                      mb: 1
                    }}
                  >
                    Updating Traders
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      textAlign: 'center'
                    }}
                  >
                    Fetching latest trading data...
                  </Typography>
                </Box>
              )}

              {error && (
                <Box
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    background: 'transparent',
                    borderRadius: '16px',
                    border: `1px solid ${alpha(theme.palette.error.main, 0.25)}`,
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      color: theme.palette.error.main,
                      fontWeight: 600,
                      mb: 1
                    }}
                  >
                    Error Loading Data
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary
                    }}
                  >
                    {error}
                  </Typography>
                </Box>
              )}

              {(!loading || isFirstLoad) && !error && traders.length > 0 && (
                <>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: 2,
                      mb: 3,
                      alignItems: { xs: 'stretch', sm: 'center' }
                    }}
                  >
                    <TextField
                      fullWidth
                      variant="outlined"
                      placeholder="Search by trader address..."
                      value={searchAddress}
                      onChange={(e) => setSearchAddress(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon sx={{ color: theme.palette.primary.main }} />
                          </InputAdornment>
                        ),
                        endAdornment: searchAddress && (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() => setSearchAddress('')}
                              edge="end"
                              sx={{
                                color: theme.palette.text.secondary,
                                borderRadius: '10px',
                                transition: 'all 0.2s',
                                '&:hover': {
                                  color: theme.palette.error.main,
                                  bgcolor: alpha(theme.palette.error.main, 0.1),
                                  transform: 'scale(1.1)'
                                }
                              }}
                            >
                              <ClearIcon fontSize="small" />
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                      sx={{
                        maxWidth: 450,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '16px',
                          backgroundColor:
                            theme.palette.mode === 'dark'
                              ? alpha(theme.palette.background.default, 0.6)
                              : alpha(theme.palette.grey[50], 0.8),
                          transition: 'all 0.3s',
                          '& fieldset': {
                            borderColor: alpha(theme.palette.divider, 0.2),
                            borderWidth: '2px'
                          },
                          '&:hover fieldset': {
                            borderColor: alpha(theme.palette.primary.main, 0.4)
                          },
                          '&.Mui-focused': {
                            backgroundColor: theme.palette.background.paper,
                            '& fieldset': {
                              borderColor: theme.palette.primary.main
                            }
                          }
                        }
                      }}
                    />
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Switch
                            checked={hideAmm}
                            onChange={(e) => setHideAmm(e.target.checked)}
                            sx={{
                              '& .MuiSwitch-track': {
                                backgroundColor: alpha(theme.palette.text.secondary, 0.3)
                              },
                              '& .Mui-checked + .MuiSwitch-track': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.5)
                              }
                            }}
                          />
                        }
                        label={
                          <Typography
                            sx={{
                              fontWeight: 600,
                              color: theme.palette.text.primary,
                              fontSize: '0.9rem'
                            }}
                          >
                            Hide AMM
                          </Typography>
                        }
                      />
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          px: 2,
                          py: 0.75,
                          borderRadius: '100px',
                          background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)}, ${alpha(theme.palette.info.light, 0.1)})`,
                          border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            background: `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                          }}
                        >
                          {totalItems.toLocaleString()} Traders
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <StyledTableContainer onScroll={handleScroll}>
                    <Table
                      size="medium"
                      aria-label="trader analytics table"
                      style={{ minWidth: 650, backgroundColor: 'transparent' }}
                    >
                      <StyledTableHead>
                        <TableRow>
                          <TableCell
                            sx={{
                              width: isMobile ? '10px' : '40px',
                              minWidth: isMobile ? '10px' : '40px',
                              padding: isMobile ? '8px 0px' : '16px 4px'
                            }}
                          >
                            #
                          </TableCell>
                          <TableCell
                            sx={{
                              minWidth: isMobile ? '120px' : '250px',
                              padding: isMobile ? '8px 4px' : '16px 8px'
                            }}
                          >
                            <TableSortLabel
                              active={orderBy === 'address'}
                              direction={orderBy === 'address' ? order : 'asc'}
                              onClick={() => handleRequestSort('address')}
                            >
                              Address
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="right" sx={{ minWidth: isMobile ? '32px' : '100px' }}>
                            <TableSortLabel
                              active={orderBy === 'volume24h'}
                              direction={orderBy === 'volume24h' ? order : 'asc'}
                              onClick={() => handleRequestSort('volume24h')}
                            >
                              Volume (24h)
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="right" sx={{ minWidth: isMobile ? '30px' : '80px' }}>
                            <TableSortLabel
                              active={orderBy === 'profit24h'}
                              direction={orderBy === 'profit24h' ? order : 'asc'}
                              onClick={() => handleRequestSort('profit24h')}
                            >
                              Profit/Loss (24h)
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="right" sx={{ minWidth: isMobile ? '30px' : '80px' }}>
                            <TableSortLabel
                              active={orderBy === 'totalTrades'}
                              direction={orderBy === 'totalTrades' ? order : 'asc'}
                              onClick={() => handleRequestSort('totalTrades')}
                            >
                              Total Trades
                            </TableSortLabel>
                          </TableCell>
                          {!isMobile && (
                            <TableCell align="right" sx={{ minWidth: '80px' }}>
                              <TableSortLabel
                                active={orderBy === 'totalProfit'}
                                direction={orderBy === 'totalProfit' ? order : 'asc'}
                                onClick={() => handleRequestSort('totalProfit')}
                              >
                                Total Profit
                              </TableSortLabel>
                            </TableCell>
                          )}
                          <TableCell align="right" sx={{ minWidth: isMobile ? '30px' : '80px' }}>
                            <TableSortLabel
                              active={orderBy === 'avgROI'}
                              direction={orderBy === 'avgROI' ? order : 'asc'}
                              onClick={() => handleRequestSort('avgROI')}
                            >
                              ROI
                            </TableSortLabel>
                          </TableCell>
                        </TableRow>
                      </StyledTableHead>
                      <TableBody>
                        {sortedTraders.map((trader, index) => (
                          <TraderRow
                            key={trader._id}
                            trader={trader}
                            index={index}
                            formatCurrency={formatCurrency}
                            formatPercentage={formatPercentage}
                            isMobile={isMobile}
                            scrollLeft={scrollLeft}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </StyledTableContainer>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '4px 0',
                      gap: '6px',
                      flexWrap: 'wrap',
                      mt: 4,
                      '@media (max-width: 900px)': {
                        flexDirection: 'row',
                        alignItems: 'stretch',
                        flexWrap: 'wrap',
                        gap: '2px',
                        padding: '2px'
                      }
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        flexWrap: 'wrap',
                        border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                        borderRadius: '16px',
                        background: theme.palette.background.paper,
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
                        padding: '4px 8px',
                        backdropFilter: 'blur(10px)',
                        '@media (max-width: 900px)': {
                          flex: 1,
                          minWidth: 'calc(50% - 8px)',
                          justifyContent: 'flex-start',
                          gap: '4px',
                          padding: '4px 8px'
                        }
                      }}
                    >
                      <Box
                        sx={{
                          fontSize: '12px',
                          fontWeight: 600,
                          padding: '2px 6px',
                          border: `1px solid ${alpha(theme.palette.divider, 0.32)}`,
                          borderRadius: '6px',
                          color: theme.palette.text.primary
                        }}
                      >
                        {`${(page - 1) * itemsPerPage + 1}-${Math.min(
                          page * itemsPerPage,
                          totalItems
                        )} of ${totalItems.toLocaleString()}`}
                      </Box>
                      <Typography
                        sx={{
                          fontSize: '12px',
                          color: theme.palette.text.secondary,
                          fontWeight: 500
                        }}
                      >
                        traders
                      </Typography>
                    </Box>

                    <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          borderRadius: '16px',
                          background: theme.palette.background.paper,
                          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
                          backdropFilter: 'blur(10px)',
                          '@media (max-width: 900px)': {
                            width: '100%',
                            justifyContent: 'center',
                            padding: '2px 4px'
                          }
                        }}
                      >
                        <IconButton
                          onClick={() => {
                            setPage(1);
                            setIsFirstLoad(false);
                          }}
                          disabled={page === 1}
                          size="small"
                          sx={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            padding: 0,
                            '&:hover:not(:disabled)': {
                              background: alpha(theme.palette.primary.main, 0.08)
                            },
                            '&:disabled': {
                              color: alpha(theme.palette.text.primary, 0.48)
                            }
                          }}
                          title="First page"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.41 16.59L13.82 12l4.59-4.59L17 6l-6 6 6 6zM6 6h2v12H6z" />
                          </svg>
                        </IconButton>

                        {(() => {
                          const pages = [];
                          const current = page;
                          const total = totalPages;

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

                          return pages.map((pageNum, idx) => {
                            if (pageNum === '...') {
                              return (
                                <span
                                  key={`ellipsis-${idx}`}
                                  style={{ padding: '0 4px', fontSize: '12px' }}
                                >
                                  ...
                                </span>
                              );
                            }
                            return (
                              <Button
                                key={pageNum}
                                onClick={() => {
                                  setPage(pageNum);
                                  setIsFirstLoad(false);
                                }}
                                sx={{
                                  minWidth: '20px',
                                  height: '20px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  background:
                                    pageNum === page ? theme.palette.primary.main : 'transparent',
                                  color: pageNum === page ? 'white' : 'inherit',
                                  padding: '0 4px',
                                  margin: 0,
                                  fontSize: '12px',
                                  fontWeight: pageNum === page ? 600 : 500,
                                  '&:hover:not(:disabled)': {
                                    background:
                                      pageNum === page
                                        ? theme.palette.primary.dark
                                        : alpha(theme.palette.primary.main, 0.08)
                                  }
                                }}
                              >
                                {pageNum}
                              </Button>
                            );
                          });
                        })()}

                        <IconButton
                          onClick={() => {
                            setPage(totalPages);
                            setIsFirstLoad(false);
                          }}
                          disabled={page === totalPages}
                          size="small"
                          sx={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            padding: 0,
                            '&:hover:not(:disabled)': {
                              background: alpha(theme.palette.primary.main, 0.08)
                            },
                            '&:disabled': {
                              color: alpha(theme.palette.text.primary, 0.48)
                            }
                          }}
                          title="Last page"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M5.59 7.41L10.18 12l-4.59 4.59L7 18l6-6-6-6zM16 6h2v12h-2z" />
                          </svg>
                        </IconButton>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        borderRadius: '16px',
                        background: theme.palette.background.paper,
                        border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
                        backdropFilter: 'blur(10px)',
                        '@media (max-width: 900px)': {
                          flex: 1,
                          minWidth: 'calc(50% - 8px)',
                          justifyContent: 'center',
                          padding: '4px 8px',
                          gap: '2px'
                        }
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
                      </svg>
                      <Typography
                        sx={{
                          fontSize: '12px',
                          color: theme.palette.text.secondary,
                          fontWeight: 500
                        }}
                      >
                        Rows
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: theme.palette.primary.main
                        }}
                      >
                        {itemsPerPage}
                      </Typography>
                    </Box>
                  </Box>
                </>
              )}
            </Box>
          </Container>
        </Box>

      </Container>
      <Footer />
    </>
  );
}

// Server-side rendering function
export async function getServerSideProps(context) {
  const { req, res, query } = context;

  // Set cache headers for better performance
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=300');

  // Extract and validate query parameters
  const { page = 1, sortBy = 'volume24h', sortOrder = 'desc', address = '' } = query;

  // Validate page number
  const pageNum = Math.max(1, parseInt(page.toString(), 10) || 1);

  try {
    // Build query params for the API
    const queryParams = new URLSearchParams({
      page: pageNum.toString(),
      limit: '25',
      sortBy: sortBy.toString(),
      sortOrder: sortOrder.toString()
    });

    if (address && typeof address === 'string' && address.trim()) {
      queryParams.append('address', address.toString().trim());
    }

    // Fetch data from the API with proper error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    try {
      const response = await fetch(
        `https://api.xrpl.to/api/analytics/cumulative-stats?${queryParams.toString()}`,
        {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
            'User-Agent': 'XRPL.to/1.0'
          }
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Handle different HTTP error codes
        if (response.status === 404) {
          throw new Error('API endpoint not found');
        }
        if (response.status === 500) {
          throw new Error('Server error - please try again later');
        }
        if (response.status === 429) {
          throw new Error('Too many requests - please try again later');
        }
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Validate the response structure more thoroughly
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format');
      }

      if (!data.data || !Array.isArray(data.data)) {
        console.warn('API returned non-array data:', data);
        return {
          props: {
            initialData: {
              data: [],
              pagination: { total: 0, totalPages: 0, currentPage: 1, limit: 25 }
            },
            initialError: null
          }
        };
      }

      // Validate pagination structure
      const validatedData = {
        ...data,
        pagination: {
          total: data.pagination?.total || data.data.length,
          totalPages:
            data.pagination?.totalPages ||
            Math.ceil((data.pagination?.total || data.data.length) / 25),
          currentPage: data.pagination?.currentPage || pageNum,
          limit: data.pagination?.limit || 25
        }
      };

      return {
        props: {
          initialData: validatedData,
          initialError: null
        }
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error('Error in getServerSideProps:', error);

    // Log more detailed error information
    const errorDetails = {
      message: error.message,
      name: error.name,
      stack: error.stack,
      query: query,
      timestamp: new Date().toISOString()
    };
    console.error('Detailed error:', errorDetails);

    // Return appropriate error based on error type
    let userFriendlyError = 'Failed to load trader data';

    if (error.name === 'AbortError') {
      userFriendlyError = 'Request timeout - please try again';
    } else if (error.message.includes('fetch')) {
      userFriendlyError = 'Network error - please check your connection';
    } else if (error.message.includes('API error')) {
      userFriendlyError = error.message;
    }

    return {
      props: {
        initialData: null,
        initialError: userFriendlyError
      }
    };
  }
}

Analytics.propTypes = {
  initialData: PropTypes.shape({
    data: PropTypes.array,
    pagination: PropTypes.shape({
      total: PropTypes.number,
      totalPages: PropTypes.number,
      currentPage: PropTypes.number,
      limit: PropTypes.number
    })
  }),
  initialError: PropTypes.string
};
