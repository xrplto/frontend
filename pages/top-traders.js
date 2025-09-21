import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import dynamic from 'next/dynamic';
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
import Modal from '@mui/material/Modal';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Button from '@mui/material/Button';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
const ReactECharts = dynamic(() => import('echarts-for-react'), {
  ssr: false,
  loading: () => <div style={{ height: '400px', background: 'transparent' }} />
});
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

const StyledModal = styled(Modal)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(2),
  backdropFilter: 'blur(24px)',
  '& .MuiBackdrop-root': {
    backgroundColor: alpha(theme.palette.common.black, 0.5)
  }
}));

const ModalContent = styled(Paper)(({ theme }) => ({
  position: 'relative',
  width: '95%',
  maxWidth: 1200,
  height: '90vh',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor:
    theme.palette.mode === 'dark'
      ? alpha(theme.palette.background.paper, 0.95)
      : theme.palette.background.paper,
  borderRadius: '32px',
  boxShadow:
    theme.palette.mode === 'dark'
      ? `0 24px 64px ${alpha(theme.palette.common.black, 0.4)}`
      : `0 24px 64px ${alpha(theme.palette.common.black, 0.1)}`,
  padding: theme.spacing(4),
  overflow: 'hidden',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    borderRadius: '32px 32px 0 0'
  },
  '& .MuiTabs-root': {
    marginBottom: theme.spacing(3),
    borderBottom: `2px solid ${alpha(theme.palette.divider, 0.08)}`
  },
  '& .tab-panel': {
    height: 'calc(90vh - 140px)',
    overflow: 'hidden'
  },
  '& .chart-section': {
    height: '52vh',
    borderRadius: '20px',
    overflow: 'hidden',
    background:
      theme.palette.mode === 'dark'
        ? alpha(theme.palette.background.default, 0.4)
        : alpha(theme.palette.grey[50], 0.5),
    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
    padding: theme.spacing(2)
  },
  '& .metrics-section': {
    height: '32vh',
    overflowY: 'auto',
    padding: theme.spacing(3),
    backgroundColor:
      theme.palette.mode === 'dark'
        ? alpha(theme.palette.background.default, 0.4)
        : alpha(theme.palette.grey[50], 0.5),
    borderRadius: '20px',
    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
    marginTop: theme.spacing(2)
  }
}));

function TabPanel({ children, value, index }) {
  return (
    <Box role="tabpanel" hidden={value !== index} id={`tabpanel-${index}`} className="tab-panel">
      {value === index && children}
    </Box>
  );
}

// Memoized TraderRow component to prevent unnecessary re-renders
const TraderRow = memo(
  ({ trader, onRoiClick, formatCurrency, formatPercentage, isMobile, index, scrollLeft }) => {
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

    const handleRowClick = useCallback(() => {
      onRoiClick(trader);
    }, [onRoiClick, trader]);

    return (
      <StyledTableRow key={trader._id} onClick={handleRowClick}>
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
        <StyledTableCell align="center">
          <IconButton
            size="small"
            onClick={(e) => onRoiClick(trader, e)}
            title="Show trader analytics"
            sx={{
              color: theme.palette.primary.main,
              padding: isMobile ? '4px' : '8px',
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.08)
              }
            }}
          >
            <ShowChartIcon sx={{ fontSize: isMobile ? '16px' : '20px' }} />
          </IconButton>
        </StyledTableCell>
      </StyledTableRow>
    );
  }
);

TraderRow.displayName = 'TraderRow';

const MetricItem = ({ label, value, valueColor }) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      py: 1,
      px: 1.5,
      borderRadius: '8px',
      transition: 'background 0.2s',
      '&:hover': {
        background: (theme) => alpha(theme.palette.primary.main, 0.04)
      },
      '&:not(:last-of-type)': {
        mb: 0.5
      }
    }}
  >
    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
      {label}
    </Typography>
    <Typography
      variant="body2"
      sx={{
        fontWeight: 700,
        fontSize: '0.85rem',
        color: valueColor || 'text.primary'
      }}
    >
      {value}
    </Typography>
  </Box>
);

export default function Analytics({ initialData, initialError }) {
  const dispatch = useDispatch();
  const [traders, setTraders] = useState(initialData?.data || []);
  const [loading, setLoading] = useState(false);
  const [roiModalTrader, setRoiModalTrader] = useState(null);
  const [orderBy, setOrderBy] = useState('volume24h');
  const [order, setOrder] = useState('desc');
  const [error, setError] = useState(initialError || null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialData?.pagination?.totalPages || 0);
  const [totalItems, setTotalItems] = useState(initialData?.pagination?.total || 0);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [searchAddress, setSearchAddress] = useState('');
  const [debouncedSearchAddress, setDebouncedSearchAddress] = useState('');
  const [activeTab, setActiveTab] = useState(0);
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

  // Effect to handle WebSocket connection status
  useEffect(() => {
    if (readyState === 1) {
      // WebSocket.OPEN
      console.log('WebSocket connection established');
    }
  }, [readyState]);

  // Effect to handle incoming WebSocket messages
  useEffect(() => {
    if (lastMessage !== null) {
      try {
        const data = JSON.parse(lastMessage.data);
        console.log('Received WebSocket data:', data);
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    }
  }, [lastMessage]);

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
  const handleRoiClick = useCallback((trader, event) => {
    if (event) {
      event.stopPropagation();
    }
    setRoiModalTrader(trader);
  }, []);

  const handleCloseRoiModal = useCallback(() => {
    setRoiModalTrader(null);
  }, []);

  const handleRequestSort = useCallback(
    (property) => {
      const isAsc = orderBy === property && order === 'asc';
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(property);
      setIsFirstLoad(false); // Ensure we fetch new data on sort
    },
    [orderBy, order]
  );

  const handleTabChange = useCallback((event, newValue) => {
    setActiveTab(newValue);
  }, []);

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

  // Memoize chart options to prevent recreation on every render
  const createChartOptions = useCallback(
    (roiHistory) => {
      const dates = roiHistory.map((item) => formatDate(item.date));
      const dailyRoi = roiHistory.map((item) => item.dailyRoi);
      const cumulativeRoi = roiHistory.map((item) => item.cumulativeRoi);
      const profits = roiHistory.map((item) => item.profit);
      const volumes = roiHistory.map((item) => item.volume);

      return {
        grid: {
          left: '3%',
          right: '3%',
          top: '8%',
          bottom: '8%',
          containLabel: true
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          },
          formatter: function (params) {
            const date = dates[params[0].dataIndex];
            const dailyRoiValue = params[0].value;
            const cumulativeRoiValue = params[1].value;
            const profit = profits[params[0].dataIndex];
            const volume = volumes[params[0].dataIndex];

            return `
            <div style="font-size: 14px; margin-bottom: 4px;">${date}</div>
            <div style="display: flex; justify-content: space-between;">
              <span>${params[0].marker} ${params[0].seriesName}:</span>
              <span style="color: ${
                dailyRoiValue >= 0 ? '#4caf50' : '#f44336'
              }">${dailyRoiValue.toFixed(2)}%</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>${params[1].marker} ${params[1].seriesName}:</span>
              <span style="color: ${
                cumulativeRoiValue >= 0 ? '#4caf50' : '#f44336'
              }">${cumulativeRoiValue.toFixed(2)}%</span>
            </div>
            <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.2);">
              <div>Profit: <span style="color: ${
                profit >= 0 ? '#4caf50' : '#f44336'
              }">${formatCurrency(profit)}</span></div>
              <div>Volume: ${formatCurrency(volume)}</div>
            </div>
          `;
          }
        },
        legend: {
          data: ['Daily ROI', 'Cumulative ROI']
        },
        xAxis: {
          type: 'category',
          data: dates,
          axisLabel: {
            rotate: 45
          }
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: '{value}%'
          }
        },
        series: [
          {
            name: 'Daily ROI',
            type: 'bar',
            data: dailyRoi,
            itemStyle: {
              color: function (params) {
                return params.value >= 0
                  ? theme.palette.mode === 'dark'
                    ? '#66BB6A'
                    : '#388E3C'
                  : theme.palette.mode === 'dark'
                    ? '#FF5252'
                    : '#D32F2F';
              }
            }
          },
          {
            name: 'Cumulative ROI',
            type: 'line',
            data: cumulativeRoi,
            smooth: true,
            lineStyle: {
              width: 2,
              color: theme.palette.mode === 'dark' ? '#FFB800' : '#F57C00'
            },
            itemStyle: {
              color: theme.palette.mode === 'dark' ? '#FFB800' : '#F57C00'
            },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  {
                    offset: 0,
                    color: alpha(theme.palette.mode === 'dark' ? '#FFB800' : '#F57C00', 0.3)
                  },
                  {
                    offset: 1,
                    color: alpha(theme.palette.mode === 'dark' ? '#FFB800' : '#F57C00', 0.05)
                  }
                ]
              }
            }
          }
        ]
      };
    },
    [formatCurrency, formatDate]
  );

  const createTradeHistoryChartOptions = useCallback(
    (tradeHistory) => {
      const dates = tradeHistory.map((item) => formatDate(item.date));
      const dailyTrades = tradeHistory.map((item) => item.trades);
      const cumulativeTrades = tradeHistory.map((item) => item.cumulativeTrades);

      return {
        grid: {
          left: '3%',
          right: '4%',
          top: '8%',
          bottom: '8%',
          containLabel: true
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          },
          formatter: function (params) {
            const date = dates[params[0].dataIndex];
            const dailyTradesValue = params[0].value;
            const cumulativeTradesValue = params[1].value;

            return `
            <div style="font-size: 14px; margin-bottom: 4px;">${date}</div>
            <div style="display: flex; justify-content: space-between;">
              <span>${params[0].marker} Daily Trades:</span>
              <span>${dailyTradesValue}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>${params[1].marker} Cumulative Trades:</span>
              <span>${cumulativeTradesValue}</span>
            </div>
          `;
          }
        },
        legend: {
          data: ['Daily Trades', 'Cumulative Trades']
        },
        xAxis: {
          type: 'category',
          data: dates,
          axisLabel: {
            rotate: 45
          }
        },
        yAxis: [
          {
            type: 'value',
            name: 'Daily',
            position: 'left'
          },
          {
            type: 'value',
            name: 'Cumulative',
            position: 'right'
          }
        ],
        series: [
          {
            name: 'Daily Trades',
            type: 'bar',
            data: dailyTrades,
            itemStyle: {
              color: theme.palette.mode === 'dark' ? '#66BB6A' : '#388E3C'
            }
          },
          {
            name: 'Cumulative Trades',
            type: 'line',
            yAxisIndex: 1,
            data: cumulativeTrades,
            smooth: true,
            lineStyle: {
              width: 2,
              color: theme.palette.mode === 'dark' ? '#FFB800' : '#F57C00'
            },
            itemStyle: {
              color: theme.palette.mode === 'dark' ? '#FFB800' : '#F57C00'
            },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  {
                    offset: 0,
                    color: alpha(theme.palette.mode === 'dark' ? '#FFB800' : '#F57C00', 0.2)
                  },
                  {
                    offset: 1,
                    color: alpha(theme.palette.mode === 'dark' ? '#FFB800' : '#F57C00', 0.02)
                  }
                ]
              }
            }
          }
        ]
      };
    },
    [formatDate, formatCurrency, theme, alpha]
  );

  const createVolumeHistoryChartOptions = useCallback(
    (volumeHistory) => {
      const dates = volumeHistory.map((item) => formatDate(item.date));
      const dailyVolumes = volumeHistory.map((item) => item.h24Volume);
      const buyVolumes = volumeHistory.map((item) => item.h24BuyVolume);
      const sellVolumes = volumeHistory.map((item) => item.h24SellVolume);
      const cumulativeVolumes = volumeHistory.map((item) => item.cumulativeVolume);
      const cumulativeBuyVolumes = volumeHistory.map((item) => item.cumulativeBuyVolume);
      const cumulativeSellVolumes = volumeHistory.map((item) => item.cumulativeSellVolume);
      const tradedTokens = volumeHistory.map((item) => item.tradedTokens || []);

      return {
        grid: {
          left: '3%',
          right: '4%',
          top: '8%',
          bottom: '8%',
          containLabel: true
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          },
          formatter: function (params) {
            const date = dates[params[0].dataIndex];
            const dailyVolume = dailyVolumes[params[0].dataIndex];
            const buyVolume = buyVolumes[params[0].dataIndex];
            const sellVolume = sellVolumes[params[0].dataIndex];
            const cumulativeVolume = cumulativeVolumes[params[0].dataIndex];
            const cumulativeBuy = cumulativeBuyVolumes[params[0].dataIndex];
            const cumulativeSell = cumulativeSellVolumes[params[0].dataIndex];
            const tokens = tradedTokens[params[0].dataIndex];

            let tokenDetails = '';
            if (tokens && tokens.length > 0) {
              tokenDetails = tokens
                .map(
                  (token) => `
              <div style="margin-left: 12px; margin-top: 2px;">
                <span>${token.name}:</span>
                <div style="margin-left: 12px;">
                  <span style="color: #4caf50">Buy: ${formatCurrency(token.buyVolume)}</span>
                  <br/>
                  <span style="color: #f44336">Sell: ${formatCurrency(token.sellVolume)}</span>
                  <br/>
                  <span>Trades: ${token.trades}</span>
                </div>
              </div>
            `
                )
                .join('');
            }

            return `
            <div style="font-size: 14px; margin-bottom: 4px;">${date}</div>
            <div style="margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between;">
                <span>Daily Volume:</span>
                <span>${formatCurrency(dailyVolume)}</span>
              </div>
              <div style="margin-left: 12px;">
                <span style="color: #4caf50">Buy: ${formatCurrency(buyVolume)}</span>
                <br/>
                <span style="color: #f44336">Sell: ${formatCurrency(sellVolume)}</span>
              </div>
            </div>
            <div style="margin-bottom: 8px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.2);">
              <div style="display: flex; justify-content: space-between;">
                <span>Cumulative Volume:</span>
                <span>${formatCurrency(cumulativeVolume)}</span>
              </div>
              <div style="margin-left: 12px;">
                <span style="color: #4caf50">Buy: ${formatCurrency(cumulativeBuy)}</span>
                <br/>
                <span style="color: #f44336">Sell: ${formatCurrency(cumulativeSell)}</span>
              </div>
            </div>
            ${
              tokens && tokens.length > 0
                ? `
              <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.2);">
                <div style="font-weight: 500;">Traded Tokens:</div>
                ${tokenDetails}
              </div>
            `
                : ''
            }
          `;
          }
        },
        legend: {
          data: ['Daily Volume', 'Buy Volume', 'Sell Volume', 'Cumulative Volume']
        },
        xAxis: {
          type: 'category',
          data: dates,
          axisLabel: {
            rotate: 45
          }
        },
        yAxis: [
          {
            type: 'value',
            name: 'Daily',
            position: 'left',
            axisLabel: {
              formatter: function (value) {
                return formatCurrency(value).split(' ')[0];
              }
            }
          },
          {
            type: 'value',
            name: 'Cumulative',
            position: 'right',
            axisLabel: {
              formatter: function (value) {
                return formatCurrency(value).split(' ')[0];
              }
            }
          }
        ],
        series: [
          {
            name: 'Daily Volume',
            type: 'bar',
            data: dailyVolumes,
            itemStyle: {
              color: alpha(theme.palette.mode === 'dark' ? '#90CAF9' : '#1976D2', 0.8)
            }
          },
          {
            name: 'Buy Volume',
            type: 'bar',
            stack: 'daily',
            data: buyVolumes,
            itemStyle: {
              color: theme.palette.mode === 'dark' ? '#66BB6A' : '#388E3C'
            }
          },
          {
            name: 'Sell Volume',
            type: 'bar',
            stack: 'daily',
            data: sellVolumes,
            itemStyle: {
              color: theme.palette.mode === 'dark' ? '#FF5252' : '#D32F2F'
            }
          },
          {
            name: 'Cumulative Volume',
            type: 'line',
            yAxisIndex: 1,
            data: cumulativeVolumes,
            smooth: true,
            lineStyle: {
              width: 2,
              color: theme.palette.mode === 'dark' ? '#FFB800' : '#F57C00'
            },
            itemStyle: {
              color: theme.palette.mode === 'dark' ? '#FFB800' : '#F57C00'
            },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  {
                    offset: 0,
                    color: alpha(theme.palette.mode === 'dark' ? '#FFB800' : '#F57C00', 0.2)
                  },
                  {
                    offset: 1,
                    color: alpha(theme.palette.mode === 'dark' ? '#FFB800' : '#F57C00', 0.02)
                  }
                ]
              }
            }
          }
        ]
      };
    },
    [formatDate, formatCurrency, theme, alpha]
  );

  // Memoize the chart options for the modal to prevent recreation on every render
  const modalChartOptions = useMemo(() => {
    if (!roiModalTrader?.roiHistory) return null;
    return createChartOptions(roiModalTrader.roiHistory);
  }, [roiModalTrader?.roiHistory, createChartOptions]);

  const modalTradeHistoryOptions = useMemo(() => {
    if (!roiModalTrader?.tradeHistory) return null;
    return createTradeHistoryChartOptions(roiModalTrader.tradeHistory);
  }, [roiModalTrader?.tradeHistory, createTradeHistoryChartOptions]);

  const modalVolumeHistoryOptions = useMemo(() => {
    if (!roiModalTrader?.volumeHistory) return null;
    return createVolumeHistoryChartOptions(roiModalTrader.volumeHistory);
  }, [roiModalTrader?.volumeHistory, createVolumeHistoryChartOptions]);

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
                          <TableCell align="right" />
                        </TableRow>
                      </StyledTableHead>
                      <TableBody>
                        {sortedTraders.map((trader, index) => (
                          <TraderRow
                            key={trader._id}
                            trader={trader}
                            index={index}
                            onRoiClick={handleRoiClick}
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

        {roiModalTrader && (
          <StyledModal
            open={Boolean(roiModalTrader)}
            onClose={handleCloseRoiModal}
            aria-labelledby="roi-history-modal"
          >
            <ModalContent>
              {roiModalTrader && (
                <>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 2
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography
                        variant="h5"
                        component="div"
                        sx={{
                          fontWeight: 700,
                          color: 'text.primary'
                        }}
                      >
                        Trader Analytics
                      </Typography>
                      <Typography
                        component="a"
                        href={`/profile/${roiModalTrader.address}`}
                        sx={{
                          textDecoration: 'none',
                          color: 'primary.main',
                          fontWeight: 600,
                          fontSize: '1rem',
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        {roiModalTrader.address}
                      </Typography>
                      {roiModalTrader.AMM && (
                        <Chip
                          label="AMM"
                          size="small"
                          color="secondary"
                          sx={{ height: 22, fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>

                    <IconButton
                      onClick={handleCloseRoiModal}
                      sx={{
                        borderRadius: '12px',
                        background: 'transparent',
                        border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        '&:hover': {
                          background: 'transparent',
                          border: (theme) => `1px solid ${alpha(theme.palette.error.main, 0.2)}`
                        }
                      }}
                    >
                      <ClearIcon />
                    </IconButton>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                      p: 1.5,
                      borderRadius: '12px',
                      background: 'transparent',
                      border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.2)}`
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        fontWeight: 500
                      }}
                    >
                      First Trade: {new Date(roiModalTrader.firstTradeDate).toLocaleDateString()}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        fontWeight: 500
                      }}
                    >
                      Last Trade: {new Date(roiModalTrader.lastTradeDate).toLocaleDateString()}
                    </Typography>
                  </Box>

                  <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                      mb: 3,
                      '& .MuiTab-root': {
                        borderRadius: '12px 12px 0 0',
                        transition: 'all 0.2s ease',
                        fontWeight: 600,
                        textTransform: 'none',
                        minHeight: 48,
                        '&:hover': {
                          background: 'transparent'
                        },
                        '&.Mui-selected': {
                          background: 'transparent',
                          color: 'primary.main',
                          borderBottom: (theme) => `2px solid ${theme.palette.primary.main}`
                        }
                      }
                    }}
                  >
                    <Tab label="Overview & ROI" />
                    <Tab label="Token Performance" />
                    <Tab label="Trade History" />
                    <Tab label="Volume History" />
                  </Tabs>

                  <TabPanel value={activeTab} index={0}>
                    <Box className="chart-section">
                      {roiModalTrader.roiHistory && roiModalTrader.roiHistory.length > 0 ? (
                        <ReactECharts
                          option={modalChartOptions}
                          style={{ height: '100%', width: '100%' }}
                          opts={{ renderer: 'svg' }}
                        />
                      ) : (
                        <Box
                          sx={{
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Typography color="text.secondary">No ROI history available</Typography>
                        </Box>
                      )}
                    </Box>
                    <Box className="metrics-section">
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                            Volume
                          </Typography>
                          <MetricItem
                            label="Total Volume"
                            value={formatCurrency(roiModalTrader.totalVolume)}
                          />
                          <MetricItem
                            label="Buy Volume"
                            value={formatCurrency(roiModalTrader.buyVolume)}
                            valueColor="success.main"
                          />
                          <MetricItem
                            label="Sell Volume"
                            value={formatCurrency(roiModalTrader.sellVolume)}
                            valueColor="error.main"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                            Profit
                          </Typography>
                          <MetricItem
                            label="Total Profit"
                            value={formatCurrency(roiModalTrader.totalProfit)}
                            valueColor={
                              roiModalTrader.totalProfit >= 0 ? 'success.main' : 'error.main'
                            }
                          />
                          <MetricItem
                            label="Unrealized Profit"
                            value={formatCurrency(roiModalTrader.unrealizedProfit)}
                          />
                          <MetricItem
                            label="Max Profit"
                            value={formatCurrency(roiModalTrader.maxProfitTrade)}
                            valueColor="success.main"
                          />
                          <MetricItem
                            label="Max Loss"
                            value={formatCurrency(roiModalTrader.maxLossTrade)}
                            valueColor="error.main"
                          />
                          <MetricItem
                            label="Avg. ROI"
                            value={formatPercentage(roiModalTrader.avgROI)}
                            valueColor={roiModalTrader.avgROI >= 0 ? 'success.main' : 'error.main'}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                            Trades
                          </Typography>
                          <MetricItem label="Total" value={roiModalTrader.totalTrades} />
                          <MetricItem
                            label="Avg. Holding"
                            value={`${(roiModalTrader.avgHoldingTime / 3600).toFixed(1)}h`}
                          />
                          <MetricItem
                            label="Active Tokens (24h)"
                            value={roiModalTrader.activeTokens24h}
                          />
                          <MetricItem
                            label="Active Tokens (7d)"
                            value={roiModalTrader.activeTokens7d}
                          />
                          <MetricItem
                            label="Active Tokens (1m)"
                            value={roiModalTrader.activeTokens1m}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                            Recent Activity
                          </Typography>
                          <MetricItem
                            label="24h Volume"
                            value={formatCurrency(roiModalTrader.volume24h)}
                          />
                          <MetricItem
                            label="24h Profit"
                            value={formatCurrency(roiModalTrader.profit24h)}
                            valueColor={
                              roiModalTrader.profit24h >= 0 ? 'success.main' : 'error.main'
                            }
                          />
                          <MetricItem label="24h Trades" value={roiModalTrader.trades24h} />
                          <MetricItem
                            label="7d Volume"
                            value={formatCurrency(roiModalTrader.volume7d)}
                          />
                          <MetricItem
                            label="7d Profit"
                            value={formatCurrency(roiModalTrader.profit7d)}
                            valueColor={
                              roiModalTrader.profit7d >= 0 ? 'success.main' : 'error.main'
                            }
                          />
                          <MetricItem label="7d Trades" value={roiModalTrader.trades7d} />
                        </Grid>
                      </Grid>
                    </Box>
                  </TabPanel>

                  <TabPanel value={activeTab} index={1}>
                    <TableContainer sx={{ height: '100%' }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell>Token</TableCell>
                            <TableCell align="right">Volume</TableCell>
                            <TableCell align="right">Profit/Loss</TableCell>
                            <TableCell align="right">ROI</TableCell>
                            <TableCell align="right">Trades</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {roiModalTrader.tokenPerformance?.map((token) => (
                            <TableRow key={token.tokenId}>
                              <TableCell component="th" scope="row">
                                {token.name}
                              </TableCell>
                              <TableCell align="right">{formatCurrency(token.volume)}</TableCell>
                              <TableCell
                                align="right"
                                sx={{ color: token.profit >= 0 ? 'success.main' : 'error.main' }}
                              >
                                {formatCurrency(token.profit)}
                              </TableCell>
                              <TableCell
                                align="right"
                                sx={{ color: token.roi >= 0 ? 'success.main' : 'error.main' }}
                              >
                                {formatPercentage(token.roi)}
                              </TableCell>
                              <TableCell align="right">{token.trades}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </TabPanel>

                  <TabPanel value={activeTab} index={2}>
                    <Box className="chart-section">
                      {roiModalTrader.tradeHistory && roiModalTrader.tradeHistory.length > 0 ? (
                        <ReactECharts
                          option={modalTradeHistoryOptions}
                          style={{ height: '100%', width: '100%' }}
                          opts={{ renderer: 'svg' }}
                        />
                      ) : (
                        <Box
                          sx={{
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Typography color="text.secondary">No trade history available</Typography>
                        </Box>
                      )}
                    </Box>
                    <Box className="metrics-section">
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="body2" color="text.secondary">
                            Total Trades
                          </Typography>
                          <Typography variant="body1">{roiModalTrader.totalTrades}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="body2" color="text.secondary">
                            Total Tokens Traded
                          </Typography>
                          <Typography variant="body1">
                            {roiModalTrader.totalTokensTraded}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </TabPanel>

                  <TabPanel value={activeTab} index={3}>
                    <Box className="chart-section">
                      {roiModalTrader.volumeHistory && roiModalTrader.volumeHistory.length > 0 ? (
                        <ReactECharts
                          option={modalVolumeHistoryOptions}
                          style={{ height: '100%', width: '100%' }}
                          opts={{ renderer: 'svg' }}
                        />
                      ) : (
                        <Box
                          sx={{
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Typography color="text.secondary">
                            No volume history available
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    <Box className="metrics-section">
                      <Grid container spacing={2}>
                        <Grid item xs={6} sm={4} md={2}>
                          <Typography variant="body2" color="text.secondary">
                            24h Volume
                          </Typography>
                          <Typography variant="body1">
                            {formatCurrency(roiModalTrader.volume24h)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={4} md={2}>
                          <Typography variant="body2" color="text.secondary">
                            7d Volume
                          </Typography>
                          <Typography variant="body1">
                            {formatCurrency(roiModalTrader.volume7d)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={4} md={2}>
                          <Typography variant="body2" color="text.secondary">
                            1m Volume
                          </Typography>
                          <Typography variant="body1">
                            {formatCurrency(roiModalTrader.volume1m)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={4} md={2}>
                          <Typography variant="body2" color="text.secondary">
                            24h Trades
                          </Typography>
                          <Typography variant="body1">{roiModalTrader.trades24h}</Typography>
                        </Grid>
                        <Grid item xs={6} sm={4} md={2}>
                          <Typography variant="body2" color="text.secondary">
                            7d Trades
                          </Typography>
                          <Typography variant="body1">{roiModalTrader.trades7d}</Typography>
                        </Grid>
                        <Grid item xs={6} sm={4} md={2}>
                          <Typography variant="body2" color="text.secondary">
                            1m Trades
                          </Typography>
                          <Typography variant="body1">{roiModalTrader.trades1m}</Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </TabPanel>
                </>
              )}
            </ModalContent>
          </StyledModal>
        )}
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
