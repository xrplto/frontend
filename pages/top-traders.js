import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import {
  Container,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Divider,
  IconButton,
  Modal,
  styled,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Chip,
  FormControlLabel,
  Switch,
  useTheme,
  Button
} from '@mui/material';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ReactECharts from 'echarts-for-react';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import Topbar from '../src/components/Topbar';
import useWebSocket from 'react-use-websocket';
import { useDispatch, useSelector } from 'react-redux';
import { update_metrics } from 'src/redux/statusSlice';
import { alpha } from '@mui/material/styles';
import Link from 'next/link';

const StyledModal = styled(Modal)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(2),
  backdropFilter: 'blur(8px)',
  '& .MuiBackdrop-root': {
    backgroundColor: alpha(theme.palette.common.black, 0.7)
  }
}));

const ModalContent = styled(Paper)(({ theme }) => ({
  position: 'relative',
  width: '95%',
  maxWidth: 1200,
  height: '90vh',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.paper,
  borderRadius: '24px',
  boxShadow: `0 24px 48px ${alpha(theme.palette.common.black, 0.15)}`,
  padding: theme.spacing(3),
  overflow: 'hidden',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main}, ${theme.palette.info.main})`,
    borderRadius: '24px 24px 0 0'
  },
  '& .MuiTabs-root': {
    marginBottom: theme.spacing(2),
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}`
  },
  '& .tab-panel': {
    height: 'calc(90vh - 120px)',
    overflow: 'hidden'
  },
  '& .chart-section': {
    height: '55vh',
    borderRadius: '16px',
    overflow: 'hidden',
    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(
      theme.palette.background.paper,
      0.6
    )} 100%)`,
    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`
  },
  '& .metrics-section': {
    height: '35vh',
    overflowY: 'auto',
    padding: theme.spacing(2),
    backgroundColor: alpha(theme.palette.background.default, 0.5),
    borderRadius: '16px',
    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
    backdropFilter: 'blur(10px)'
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
  ({ trader, onRoiClick, abbreviateAddress, formatCurrency, formatPercentage }) => (
    <TableRow
      key={trader._id}
      sx={{
        '&:last-child td, &:last-child th': { border: 0 },
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: 'action.hover'
        }
      }}
      onClick={() => onRoiClick(trader)}
    >
      <TableCell component="th" scope="row">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            component="a"
            href={`/profile/${trader.address}`}
            sx={{
              textDecoration: 'none',
              color: 'primary.main',
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {abbreviateAddress(trader.address)}
          </Typography>
          {trader.AMM && (
            <Chip
              label="AMM"
              size="small"
              color="secondary"
              sx={{
                height: 20,
                fontSize: '0.65rem',
                '& .MuiChip-label': {
                  px: 1
                }
              }}
            />
          )}
          <IconButton
            size="small"
            onClick={(e) => onRoiClick(trader, e)}
            title={trader.address}
            sx={{
              color: 'primary.main',
              '&:hover': {
                color: 'primary.dark'
              }
            }}
          >
            <ShowChartIcon fontSize="small" />
          </IconButton>
        </Box>
      </TableCell>
      <TableCell align="right">{trader.activeTokens24h}</TableCell>
      <TableCell align="right">{formatCurrency(trader.volume24h)}</TableCell>
      <TableCell
        align="right"
        sx={{
          color: trader.profit24h >= 0 ? 'success.main' : 'error.main'
        }}
      >
        {formatCurrency(trader.profit24h)}
      </TableCell>
      <TableCell align="right">{trader.totalTrades}</TableCell>
      <TableCell
        align="right"
        sx={{
          color: trader.totalProfit >= 0 ? 'success.main' : 'error.main'
        }}
      >
        {formatCurrency(trader.totalProfit)}
      </TableCell>
      <TableCell
        align="right"
        sx={{
          color: trader.avgROI >= 0 ? 'success.main' : 'error.main'
        }}
      >
        {formatPercentage(trader.avgROI)}
      </TableCell>
      <TableCell align="right">{new Date(trader.firstTradeDate).toLocaleDateString()}</TableCell>
      <TableCell align="right">{new Date(trader.lastTradeDate).toLocaleDateString()}</TableCell>
      <TableCell align="right">{(trader.avgHoldingTime / 3600).toFixed(2)}</TableCell>
      <TableCell
        align="right"
        sx={{
          color: 'success.main'
        }}
      >
        {formatCurrency(trader.maxProfitTrade)}
      </TableCell>
      <TableCell
        align="right"
        sx={{
          color: 'error.main'
        }}
      >
        {formatCurrency(trader.maxLossTrade)}
      </TableCell>
      <TableCell align="right">{formatCurrency(trader.buyVolume)}</TableCell>
      <TableCell align="right">{formatCurrency(trader.sellVolume)}</TableCell>
    </TableRow>
  )
);

TraderRow.displayName = 'TraderRow';

export default function Analytics() {
  const dispatch = useDispatch();
  const metrics = useSelector((state) => state.status.metrics);
  const [traders, setTraders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roiModalTrader, setRoiModalTrader] = useState(null);
  const [orderBy, setOrderBy] = useState('volume24h');
  const [order, setOrder] = useState('desc');
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(50);
  const [searchAddress, setSearchAddress] = useState('');
  const [debouncedSearchAddress, setDebouncedSearchAddress] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [hideAmm, setHideAmm] = useState(false);
  const theme = useTheme();

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

  // Add WebSocket connection
  const WSS_FEED_URL = 'wss://api.xrpl.to/ws/sync';
  const { sendJsonMessage, lastMessage, readyState } = useWebSocket(WSS_FEED_URL, {
    shouldReconnect: (closeEvent) => true,
    reconnectInterval: 3000,
    onOpen: () => {
      console.log('WebSocket Connected');
    },
    onMessage: (event) => {
      try {
        const json = JSON.parse(event.data);
        throttledWebSocketHandler(json);
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
    },
    onClose: () => {
      console.log('WebSocket connection closed');
      if (throttleTimeout.current) {
        clearTimeout(throttleTimeout.current);
      }
    }
  });

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
    setPage(1);
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

  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page,
        limit: itemsPerPage,
        sortBy: orderBy,
        sortOrder: order
      });

      if (debouncedSearchAddress) {
        queryParams.append('address', debouncedSearchAddress);
      }

      const response = await fetch(
        `https://api.xrpl.to/api/analytics/cumulative-stats?${queryParams.toString()}`
      );
      const responseData = await response.json();
      console.log('Fetched traders data:', responseData);

      // Handle the data structure and pagination
      if (responseData && responseData.data) {
        if (Array.isArray(responseData.data)) {
          setTraders(responseData.data);
          // Set pagination data if available
          if (responseData.pagination) {
            setTotalPages(responseData.pagination.totalPages);
            setTotalItems(responseData.pagination.total);
          }
          setError(null);
        } else {
          console.error('Unexpected data structure:', responseData);
          setError('Invalid data format received from server');
          setTraders([]);
        }
      } else {
        setError('Invalid data format received from server');
        setTraders([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Error fetching data');
      setTraders([]);
    } finally {
      setLoading(false);
    }
  }, [page, itemsPerPage, orderBy, order, debouncedSearchAddress]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const abbreviateAddress = useCallback((address) => {
    if (!address) return '';
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
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

  // Limit the number of rendered items to prevent UI freezing
  const RENDER_LIMIT = 100; // Only render first 100 items for performance

  // Memoize the sorted and filtered data with render limit
  const sortedTraders = useMemo(() => {
    if (!Array.isArray(traders)) {
      console.error('sortData received non-array:', traders);
      return [];
    }

    let filteredData = hideAmm ? traders.filter((trader) => !trader.AMM) : traders;

    console.log('Sorting data:', { orderBy, order, dataLength: filteredData.length });

    const sorted = filteredData.sort((a, b) => {
      if (!a || !b) {
        console.error('Invalid trader objects in sort:', { a, b });
        return 0;
      }

      let aValue = a[orderBy];
      let bValue = b[orderBy];

      if (aValue == null) return 1;
      if (bValue == null) return -1;

      if (orderBy.includes('Date')) {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      const result = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return order === 'desc' ? -result : result;
    });

    // Limit rendering to prevent UI freezing
    return sorted.slice(0, RENDER_LIMIT);
  }, [traders, hideAmm, orderBy, order]);

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
                return params.value >= 0 ? '#4caf50' : '#f44336';
              }
            }
          },
          {
            name: 'Cumulative ROI',
            type: 'line',
            data: cumulativeRoi,
            smooth: true,
            lineStyle: {
              width: 3
            },
            itemStyle: {
              color: '#1976d2'
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
      const profitableTrades = tradeHistory.map((item) => item.profitableTrades);
      const losingTrades = tradeHistory.map((item) => item.losingTrades);

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
            const profitableTradesValue = profitableTrades[params[0].dataIndex];
            const losingTradesValue = losingTrades[params[0].dataIndex];

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
            <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.2);">
              <div style="color: #4caf50">Profitable: ${profitableTradesValue}</div>
              <div style="color: #f44336">Losing: ${losingTradesValue}</div>
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
              color: '#1976d2'
            }
          },
          {
            name: 'Cumulative Trades',
            type: 'line',
            yAxisIndex: 1,
            data: cumulativeTrades,
            smooth: true,
            lineStyle: {
              width: 3
            },
            itemStyle: {
              color: '#2196f3'
            }
          }
        ]
      };
    },
    [formatDate, formatCurrency]
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
              color: '#1976d2'
            }
          },
          {
            name: 'Buy Volume',
            type: 'bar',
            stack: 'daily',
            data: buyVolumes,
            itemStyle: {
              color: '#4caf50'
            }
          },
          {
            name: 'Sell Volume',
            type: 'bar',
            stack: 'daily',
            data: sellVolumes,
            itemStyle: {
              color: '#f44336'
            }
          },
          {
            name: 'Cumulative Volume',
            type: 'line',
            yAxisIndex: 1,
            data: cumulativeVolumes,
            smooth: true,
            lineStyle: {
              width: 3
            },
            itemStyle: {
              color: '#2196f3'
            }
          }
        ]
      };
    },
    [formatDate, formatCurrency]
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
  }, []);

  const handleNextPage = useCallback(() => {
    setPage((prev) => Math.min(totalPages, prev + 1));
  }, [totalPages]);

  // Early return for loading state to prevent unnecessary computations
  if (loading) {
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
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.background.paper,
                0.9
              )} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.08)}`
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
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.error.main,
                0.1
              )} 0%, ${alpha(theme.palette.error.main, 0.05)} 100%)`,
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
      <Topbar />
      <Header />
      <Container maxWidth="xl">
        <Box
          sx={{
            flex: 1,
            py: { xs: 1, sm: 2, md: 3 },
            backgroundColor: 'transparent',
            backgroundImage: `linear-gradient(135deg, ${alpha(
              theme.palette.background.default,
              0.95
            )} 0%, ${alpha(theme.palette.background.default, 0.8)} 100%)`,
            minHeight: '100vh',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `radial-gradient(circle at 20% 50%, ${alpha(
                theme.palette.primary.main,
                0.03
              )} 0%, transparent 50%), radial-gradient(circle at 80% 20%, ${alpha(
                theme.palette.success.main,
                0.03
              )} 0%, transparent 50%)`,
              pointerEvents: 'none'
            }
          }}
        >
          <Container
            maxWidth="xl"
            sx={{
              mt: { xs: 2, sm: 3, md: 4 },
              mb: { xs: 2, sm: 3, md: 4 },
              position: 'relative',
              zIndex: 1
            }}
          >
            <Box sx={{ mb: { xs: 3, sm: 4, md: 5 } }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 1,
                  mb: 1.5,
                  p: 3,
                  borderRadius: '20px',
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.background.paper,
                    0.9
                  )} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                  boxShadow: `0 8px 32px ${alpha(
                    theme.palette.common.black,
                    0.06
                  )}, 0 2px 8px ${alpha(theme.palette.primary.main, 0.04)}`,
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main}, ${theme.palette.info.main})`,
                    opacity: 0.8
                  }
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="h4"
                    sx={{
                      color: theme.palette.text.primary,
                      fontWeight: 700,
                      fontSize: { xs: '1.6rem', sm: '1.8rem', md: '2.1rem' },
                      letterSpacing: '-0.02em',
                      background: `linear-gradient(135deg, ${
                        theme.palette.text.primary
                      } 0%, ${alpha(theme.palette.primary.main, 0.8)} 100%)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 1
                    }}
                  >
                    Top Traders Analytics
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
                      maxWidth: '600px',
                      lineHeight: 1.6
                    }}
                  >
                    Discover the most successful traders on the XRPL ecosystem. Track performance
                    metrics, ROI trends, and trading patterns of top performers across different
                    timeframes and strategies.
                  </Typography>
                </Box>
                <Link href="/api-docs">
                  <Button
                    variant="contained"
                    size="medium"
                    sx={{
                      background: `linear-gradient(135deg, ${alpha(
                        theme.palette.primary.main,
                        0.9
                      )} 0%, ${alpha(theme.palette.primary.dark, 0.8)} 100%)`,
                      color: theme.palette.primary.contrastText,
                      '&:hover': {
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                        transform: 'translateY(-2px)',
                        boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`
                      },
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      padding: { xs: '8px 16px', sm: '10px 20px' },
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    See API Details
                  </Button>
                </Link>
              </Box>
            </Box>

            <Card
              sx={{
                borderRadius: '24px',
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.background.paper,
                  0.95
                )} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: `3px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                boxShadow: `0 16px 48px ${alpha(
                  theme.palette.common.black,
                  0.12
                )}, 0 4px 16px ${alpha(theme.palette.primary.main, 0.1)}`,
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 24px 64px ${alpha(
                    theme.palette.common.black,
                    0.18
                  )}, 0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
                  border: `3px solid ${alpha(theme.palette.primary.main, 0.25)}`
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main}, ${theme.palette.info.main})`,
                  opacity: 0.9
                }
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                {loading && (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      py: 8,
                      background: `linear-gradient(135deg, ${alpha(
                        theme.palette.background.paper,
                        0.8
                      )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
                      borderRadius: '16px',
                      border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
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
                      Loading Top Traders
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        textAlign: 'center'
                      }}
                    >
                      Analyzing trading performance and metrics...
                    </Typography>
                  </Box>
                )}

                {error && (
                  <Box
                    sx={{
                      p: 4,
                      textAlign: 'center',
                      background: `linear-gradient(135deg, ${alpha(
                        theme.palette.error.main,
                        0.1
                      )} 0%, ${alpha(theme.palette.error.main, 0.05)} 100%)`,
                      borderRadius: '16px',
                      border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
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

                {!loading && !error && (
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
                                  borderRadius: '8px',
                                  '&:hover': {
                                    color: theme.palette.error.main,
                                    bgcolor: alpha(theme.palette.error.main, 0.08),
                                    transform: 'scale(1.1)'
                                  }
                                }}
                              >
                                <ClearIcon />
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                        sx={{
                          maxWidth: 450,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '16px',
                            background: `linear-gradient(135deg, ${alpha(
                              theme.palette.background.paper,
                              0.8
                            )} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`,
                            backdropFilter: 'blur(10px)',
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
                              transform: 'translateY(-1px)'
                            },
                            '&.Mui-focused': {
                              border: `1px solid ${theme.palette.primary.main}`,
                              boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`
                            }
                          }
                        }}
                      />
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          p: 2,
                          borderRadius: '16px',
                          background: `linear-gradient(135deg, ${alpha(
                            theme.palette.background.paper,
                            0.8
                          )} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`,
                          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                          backdropFilter: 'blur(10px)'
                        }}
                      >
                        <FormControlLabel
                          control={
                            <Switch
                              checked={hideAmm}
                              onChange={(e) => setHideAmm(e.target.checked)}
                              sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': {
                                  color: theme.palette.primary.main,
                                  '& + .MuiSwitch-track': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.5)
                                  }
                                }
                              }}
                            />
                          }
                          label={
                            <Typography sx={{ fontWeight: 500, color: theme.palette.text.primary }}>
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
                            py: 1,
                            borderRadius: '12px',
                            background: alpha(theme.palette.info.main, 0.1),
                            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                          }}
                        >
                          <Typography variant="caption" color="info.main" sx={{ fontWeight: 600 }}>
                            {totalItems} Traders
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <TableContainer
                      sx={{
                        borderRadius: '20px',
                        background: `linear-gradient(135deg, ${alpha(
                          theme.palette.background.paper,
                          0.7
                        )} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`,
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
                        overflow: 'hidden',
                        boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.04)}`
                      }}
                    >
                      <Table
                        sx={{
                          minWidth: 650,
                          '& .MuiTableCell-root': {
                            whiteSpace: 'nowrap',
                            padding: '12px 16px',
                            fontSize: '0.875rem',
                            lineHeight: 1.4,
                            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
                            fontWeight: '500'
                          },
                          '& .MuiTableHead-root': {
                            position: 'sticky',
                            top: 0,
                            zIndex: 999,
                            background: `linear-gradient(135deg, ${alpha(
                              theme.palette.background.paper,
                              0.95
                            )} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
                            backdropFilter: 'blur(20px)',
                            '&::after': {
                              content: '""',
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              height: '1px',
                              background: `linear-gradient(90deg, transparent, ${alpha(
                                theme.palette.divider,
                                0.24
                              )}, transparent)`
                            }
                          },
                          '& .MuiTableHead-root .MuiTableCell-root': {
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            padding: '20px 16px',
                            color: theme.palette.text.primary,
                            borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                            '& .MuiTableSortLabel-root': {
                              fontSize: '0.8rem',
                              fontWeight: '700',
                              color: 'inherit',
                              '&:hover': {
                                color: theme.palette.primary.main
                              },
                              '&.Mui-active': {
                                color: theme.palette.primary.main,
                                '& .MuiTableSortLabel-icon': {
                                  color: 'inherit'
                                }
                              },
                              '& .MuiTableSortLabel-icon': {
                                fontSize: '16px'
                              }
                            }
                          },
                          '& .MuiTableRow-root': {
                            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              '& .MuiTableCell-root': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.04),
                                backdropFilter: 'blur(6px)'
                              },
                              cursor: 'pointer',
                              transform: 'translateY(-1px)',
                              boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.08)}`
                            }
                          },
                          '& .MuiIconButton-root': {
                            padding: '6px',
                            borderRadius: '10px',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              background: alpha(theme.palette.primary.main, 0.1),
                              transform: 'scale(1.05)'
                            }
                          }
                        }}
                        size="medium"
                        aria-label="trader analytics table"
                      >
                        <TableHead>
                          <TableRow>
                            <TableCell>
                              <TableSortLabel
                                active={orderBy === 'address'}
                                direction={orderBy === 'address' ? order : 'asc'}
                                onClick={() => handleRequestSort('address')}
                              >
                                Address
                              </TableSortLabel>
                            </TableCell>
                            <TableCell align="right">
                              <TableSortLabel
                                active={orderBy === 'activeTokens24h'}
                                direction={orderBy === 'activeTokens24h' ? order : 'asc'}
                                onClick={() => handleRequestSort('activeTokens24h')}
                              >
                                Active Tokens (24h)
                              </TableSortLabel>
                            </TableCell>
                            <TableCell align="right">
                              <TableSortLabel
                                active={orderBy === 'volume24h'}
                                direction={orderBy === 'volume24h' ? order : 'asc'}
                                onClick={() => handleRequestSort('volume24h')}
                              >
                                Volume (24h)
                              </TableSortLabel>
                            </TableCell>
                            <TableCell align="right">
                              <TableSortLabel
                                active={orderBy === 'profit24h'}
                                direction={orderBy === 'profit24h' ? order : 'asc'}
                                onClick={() => handleRequestSort('profit24h')}
                              >
                                Profit/Loss (24h)
                              </TableSortLabel>
                            </TableCell>
                            <TableCell align="right">
                              <TableSortLabel
                                active={orderBy === 'totalTrades'}
                                direction={orderBy === 'totalTrades' ? order : 'asc'}
                                onClick={() => handleRequestSort('totalTrades')}
                              >
                                Total Trades
                              </TableSortLabel>
                            </TableCell>
                            <TableCell align="right">
                              <TableSortLabel
                                active={orderBy === 'totalProfit'}
                                direction={orderBy === 'totalProfit' ? order : 'asc'}
                                onClick={() => handleRequestSort('totalProfit')}
                              >
                                Total Profit
                              </TableSortLabel>
                            </TableCell>
                            <TableCell align="right">
                              <TableSortLabel
                                active={orderBy === 'avgROI'}
                                direction={orderBy === 'avgROI' ? order : 'asc'}
                                onClick={() => handleRequestSort('avgROI')}
                              >
                                ROI
                              </TableSortLabel>
                            </TableCell>
                            <TableCell align="right">
                              <TableSortLabel
                                active={orderBy === 'firstTradeDate'}
                                direction={orderBy === 'firstTradeDate' ? order : 'asc'}
                                onClick={() => handleRequestSort('firstTradeDate')}
                              >
                                First Trade
                              </TableSortLabel>
                            </TableCell>
                            <TableCell align="right">
                              <TableSortLabel
                                active={orderBy === 'lastTradeDate'}
                                direction={orderBy === 'lastTradeDate' ? order : 'asc'}
                                onClick={() => handleRequestSort('lastTradeDate')}
                              >
                                Last Trade
                              </TableSortLabel>
                            </TableCell>
                            <TableCell align="right">
                              <TableSortLabel
                                active={orderBy === 'avgHoldingTime'}
                                direction={orderBy === 'avgHoldingTime' ? order : 'asc'}
                                onClick={() => handleRequestSort('avgHoldingTime')}
                              >
                                Avg Hold Time (h)
                              </TableSortLabel>
                            </TableCell>
                            <TableCell align="right">
                              <TableSortLabel
                                active={orderBy === 'maxProfitTrade'}
                                direction={orderBy === 'maxProfitTrade' ? order : 'asc'}
                                onClick={() => handleRequestSort('maxProfitTrade')}
                              >
                                Max Profit
                              </TableSortLabel>
                            </TableCell>
                            <TableCell align="right">
                              <TableSortLabel
                                active={orderBy === 'maxLossTrade'}
                                direction={orderBy === 'maxLossTrade' ? order : 'asc'}
                                onClick={() => handleRequestSort('maxLossTrade')}
                              >
                                Max Loss
                              </TableSortLabel>
                            </TableCell>
                            <TableCell align="right">
                              <TableSortLabel
                                active={orderBy === 'buyVolume'}
                                direction={orderBy === 'buyVolume' ? order : 'asc'}
                                onClick={() => handleRequestSort('buyVolume')}
                              >
                                Buy Volume
                              </TableSortLabel>
                            </TableCell>
                            <TableCell align="right">
                              <TableSortLabel
                                active={orderBy === 'sellVolume'}
                                direction={orderBy === 'sellVolume' ? order : 'asc'}
                                onClick={() => handleRequestSort('sellVolume')}
                              >
                                Sell Volume
                              </TableSortLabel>
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {sortedTraders.map((trader) => (
                            <TraderRow
                              key={trader._id}
                              trader={trader}
                              onRoiClick={handleRoiClick}
                              abbreviateAddress={abbreviateAddress}
                              formatCurrency={formatCurrency}
                              formatPercentage={formatPercentage}
                            />
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    <Box
                      sx={{
                        py: 3,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mt: 3,
                        p: 3,
                        borderRadius: '16px',
                        background: `linear-gradient(135deg, ${alpha(
                          theme.palette.background.paper,
                          0.6
                        )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`
                      }}
                    >
                      <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Showing{' '}
                        {`${(page - 1) * itemsPerPage + 1}-${Math.min(
                          page * itemsPerPage,
                          totalItems
                        )}`}{' '}
                        of {totalItems} traders
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <IconButton
                          onClick={handlePrevPage}
                          disabled={page === 1}
                          sx={{
                            borderRadius: '12px',
                            background: alpha(theme.palette.background.paper, 0.8),
                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                            transition: 'all 0.2s ease',
                            width: 44,
                            height: 44,
                            '&:hover': {
                              background: alpha(theme.palette.primary.main, 0.1),
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                              transform: 'translateY(-2px)',
                              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
                            },
                            '&:disabled': {
                              opacity: 0.4
                            }
                          }}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M15 18L9 12L15 6"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </IconButton>
                        <IconButton
                          onClick={handleNextPage}
                          disabled={page >= totalPages}
                          sx={{
                            borderRadius: '12px',
                            background: alpha(theme.palette.background.paper, 0.8),
                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                            transition: 'all 0.2s ease',
                            width: 44,
                            height: 44,
                            '&:hover': {
                              background: alpha(theme.palette.primary.main, 0.1),
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                              transform: 'translateY(-2px)',
                              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
                            },
                            '&:disabled': {
                              opacity: 0.4
                            }
                          }}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M9 6L15 12L9 18"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </IconButton>
                      </Box>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Container>
        </Box>

        <StyledModal
          open={Boolean(roiModalTrader)}
          onClose={handleCloseRoiModal}
          aria-labelledby="roi-history-modal"
        >
          <ModalContent>
            {roiModalTrader && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
                  <Typography
                    variant="h5"
                    component="div"
                    sx={{
                      flexGrow: 1,
                      fontWeight: 700,
                      color: theme.palette.text.primary
                    }}
                  >
                    Trader Analytics
                  </Typography>
                  <IconButton
                    onClick={handleCloseRoiModal}
                    sx={{
                      borderRadius: '12px',
                      background: alpha(theme.palette.background.paper, 0.8),
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      '&:hover': {
                        background: alpha(theme.palette.error.main, 0.1),
                        border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
                      }
                    }}
                  >
                    <ClearIcon />
                  </IconButton>
                </Box>

                <Box
                  sx={{
                    mb: 3,
                    p: 3,
                    borderRadius: '16px',
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.background.paper,
                      0.8
                    )} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Typography
                      component="a"
                      href={`/profile/${roiModalTrader.address}`}
                      sx={{
                        textDecoration: 'none',
                        color: theme.palette.primary.main,
                        fontWeight: 700,
                        fontSize: '1.1rem',
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
                        sx={{
                          height: 24,
                          fontSize: '0.75rem',
                          background: `linear-gradient(135deg, ${alpha(
                            theme.palette.secondary.main,
                            0.15
                          )} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
                          color: theme.palette.secondary.main,
                          border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                          fontWeight: 600
                        }}
                      />
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 3 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        fontWeight: 500,
                        px: 2,
                        py: 1,
                        borderRadius: '8px',
                        background: alpha(theme.palette.success.main, 0.1),
                        border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                      }}
                    >
                      First Trade: {new Date(roiModalTrader.firstTradeDate).toLocaleDateString()}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        fontWeight: 500,
                        px: 2,
                        py: 1,
                        borderRadius: '8px',
                        background: alpha(theme.palette.info.main, 0.1),
                        border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                      }}
                    >
                      Last Trade: {new Date(roiModalTrader.lastTradeDate).toLocaleDateString()}
                    </Typography>
                  </Box>
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
                        background: alpha(theme.palette.primary.main, 0.04)
                      },
                      '&.Mui-selected': {
                        background: `linear-gradient(135deg, ${alpha(
                          theme.palette.primary.main,
                          0.1
                        )} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                        color: theme.palette.primary.main
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
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Volume Metrics
                        </Typography>
                        <Typography variant="body2">
                          Total Volume: {formatCurrency(roiModalTrader.totalVolume)}
                        </Typography>
                        <Typography variant="body2" color="success.main">
                          Buy Volume: {formatCurrency(roiModalTrader.buyVolume)}
                        </Typography>
                        <Typography variant="body2" color="error.main">
                          Sell Volume: {formatCurrency(roiModalTrader.sellVolume)}
                        </Typography>
                        <Typography variant="body2">
                          Active Tokens (24h): {roiModalTrader.activeTokens24h}
                        </Typography>
                        <Typography variant="body2">
                          Active Tokens (7d): {roiModalTrader.activeTokens7d}
                        </Typography>
                        <Typography variant="body2">
                          Active Tokens (1m): {roiModalTrader.activeTokens1m}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Profit Metrics
                        </Typography>
                        <Typography
                          variant="body2"
                          color={roiModalTrader.totalProfit >= 0 ? 'success.main' : 'error.main'}
                        >
                          Total Profit: {formatCurrency(roiModalTrader.totalProfit)}
                        </Typography>
                        <Typography variant="body2">
                          Unrealized Profit: {formatCurrency(roiModalTrader.unrealizedProfit)}
                        </Typography>
                        <Typography variant="body2" color="success.main">
                          Max Profit Trade: {formatCurrency(roiModalTrader.maxProfitTrade)}
                        </Typography>
                        <Typography variant="body2" color="error.main">
                          Max Loss Trade: {formatCurrency(roiModalTrader.maxLossTrade)}
                        </Typography>
                        <Typography variant="body2">
                          Avg ROI: {formatPercentage(roiModalTrader.avgROI)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Trade Metrics
                        </Typography>
                        <Typography variant="body2">
                          Total Trades: {roiModalTrader.totalTrades}
                        </Typography>
                        <Typography variant="body2" color="success.main">
                          Profitable Trades: {roiModalTrader.profitableTrades}
                        </Typography>
                        <Typography variant="body2" color="error.main">
                          Losing Trades: {roiModalTrader.losingTrades}
                        </Typography>
                        <Typography variant="body2">
                          Avg Holding Time: {(roiModalTrader.avgHoldingTime / 3600).toFixed(1)}h
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Recent Activity
                        </Typography>
                        <Typography variant="body2">
                          24h Volume: {formatCurrency(roiModalTrader.volume24h)}
                        </Typography>
                        <Typography variant="body2">
                          7d Volume: {formatCurrency(roiModalTrader.volume7d)}
                        </Typography>
                        <Typography variant="body2">
                          24h Profit: {formatCurrency(roiModalTrader.profit24h)}
                        </Typography>
                        <Typography variant="body2">
                          7d Profit: {formatCurrency(roiModalTrader.profit7d)}
                        </Typography>
                        <Typography variant="body2">
                          24h Trades: {roiModalTrader.trades24h}
                        </Typography>
                        <Typography variant="body2">
                          7d Trades: {roiModalTrader.trades7d}
                        </Typography>
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
                        <Typography variant="body1">{roiModalTrader.totalTokensTraded}</Typography>
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
                        <Typography color="text.secondary">No volume history available</Typography>
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
      </Container>
      <Footer />
    </>
  );
}
