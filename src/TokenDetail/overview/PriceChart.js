import axios from 'axios';
import { useState, useEffect, useContext, useMemo, useCallback, useRef } from 'react';
import csvDownload from 'json-to-csv-export';
import createMedianFilter from 'moving-median';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import CandlestickChartIcon from '@mui/icons-material/CandlestickChart';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import PeopleIcon from '@mui/icons-material/People';
import useWebSocket from 'react-use-websocket';

// Material
import {
  useTheme,
  Grid,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Paper,
  toggleButtonGroupClasses,
  styled,
  Box,
  CircularProgress,
  Skeleton,
  Fade,
  Chip,
  Tooltip,
  useMediaQuery
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { alpha, keyframes } from '@mui/material/styles';

// Context
import { AppContext } from 'src/AppContext';

import { useRouter } from 'next/router';
import { currencySymbols } from 'src/utils/constants';

// import Highcharts from 'highcharts'
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import accessibility from 'highcharts/modules/accessibility';
import { format } from 'date-fns';
import { fCurrency5, fVolume } from 'src/utils/formatNumber';

// Components
import RichListChart from '../richlist/RichListChart';
// ----------------------------------------------------------------------

// Initialize the accessibility module
if (typeof Highcharts === 'object') {
  accessibility(Highcharts);
}

// API Response Structure:
// Line Chart: [timestamp, price, volume]
// OHLC Chart: [timestamp, open, high, low, close]

// Optimizations Applied:
// 1. Added request cancellation with AbortController
// 2. Improved error handling with try-catch
// 3. Memoized chart options and calculations for better performance
// 4. Optimized data transformations using array destructuring
// 5. Better CSV export with descriptive filename
// 6. Added SPARK range support
// 7. Enhanced loading states and error boundaries

// High-Frequency Trading Features:
// 1. Real-time WebSocket streaming for 1MIN and SPARK ranges
// 2. Buffered data updates with throttling (10 FPS max)
// 3. Animation-free rendering for real-time data
// 4. Performance optimizations: turboThreshold, boostThreshold
// 5. Live price change indicators with color coding
// 6. Streaming status indicators and manual controls
// 7. Memory management with data point limits (10k max)
// 8. Batch processing of high-frequency updates
// 9. Auto-reconnection for WebSocket connections
// 10. Real-time volume change tracking
// 11. Outlier detection and filtering for price data integrity

// 7D & 1M Range Optimizations:
// 1. Enhanced time formatting (7D: day+hour, 1M: day only)
// 2. Data validation for OHLC and line chart integrity
// 3. Optimized for large datasets (7D: ~500 points, 1M: ~721 points)
// 4. Buffer clearing when switching from real-time modes
// 5. Proper handling of sparse OHLC data (O=H=L=C scenarios)
// 6. 1M: Hourly intervals for comprehensive monthly analysis

const fiatMapping = {
  USD: 'USD',
  EUR: 'EUR',
  JPY: 'JPY',
  CNY: 'CNH',
  XRP: 'XRP'
};

// Time interval configuration for different chart ranges
const INTERVAL_CONFIG = [
  ['ALL', 4 * 24 * 60 * 60 * 1000], // 4 Day difference / ALL
  ['1Y', 24 * 60 * 60 * 1000], // 1 Day difference / 1Y
  ['3M', 1 * 60 * 60 * 1000], // 1 Hours difference / 3M
  ['1M', 30 * 60 * 1000], // 30 min difference / 1M
  ['7D', 5 * 60 * 1000], // 5 Mins difference / 7D
  ['1D', 1 * 60 * 1000], // 1 Mins difference / 1D
  ['12H', 5 * 1000] // 5 Secs difference / SPARK (more real-time)
];

// Map range to WebSocket interval
const RANGE_TO_INTERVAL = {
  '12h': '1m',
  '1D': '5m',
  '7D': '15m',
  '1M': '1h',
  '3M': '4h',
  '1Y': '1d',
  'ALL': '1w'
};

const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`;

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  [`& .${toggleButtonGroupClasses.grouped}`]: {
    margin: theme.spacing(0.15),
    border: 0,
    borderRadius: theme.shape.borderRadius,
    [`&.${toggleButtonGroupClasses.disabled}`]: {
      border: 0
    }
  },
  [`& .${toggleButtonGroupClasses.middleButton},& .${toggleButtonGroupClasses.lastButton}`]: {
    marginLeft: -1,
    borderLeft: '1px solid transparent'
  }
}));

const EnhancedToggleButton = styled(ToggleButton)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  background: theme.palette.mode === 'dark' 
    ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.default, 0.9)} 100%)`
    : `linear-gradient(135deg, ${alpha(theme.palette.grey[100], 0.8)} 0%, ${alpha(theme.palette.grey[200], 0.9)} 100%)`,
  color: theme.palette.text.primary,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.3)}, transparent)`,
    transition: 'left 0.6s'
  },
  '&:hover::before': {
    left: '100%'
  },
  '&:hover': {
    transform: 'translateY(-1px) scale(1.02)',
    boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.4)}`,
    filter: 'brightness(1.1)'
  },
  '&.Mui-selected': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.info.main, 0.1)} 100%)`,
    color: theme.palette.primary.main,
    fontWeight: 700,
    boxShadow: `0 0 15px ${alpha(theme.palette.primary.main, 0.3)}`,
    textShadow: theme.palette.mode === 'dark' ? `0 0 10px ${alpha(theme.palette.primary.main, 0.6)}` : 'none',
    '&:hover': {
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.3)} 0%, ${alpha(theme.palette.info.main, 0.15)} 100%)`
    }
  }
}));

const ChartContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  borderRadius: '16px',
  overflow: 'hidden',
  background: 'transparent',
  backdropFilter: 'none',
  boxShadow: theme.palette.mode === 'dark'
    ? `0 0 40px ${alpha(theme.palette.primary.main, 0.15)}, 0 0 80px ${alpha(theme.palette.info.main, 0.1)}`
    : `0 4px 24px ${alpha(theme.palette.grey[400], 0.2)}, 0 0 40px ${alpha(theme.palette.primary.light, 0.1)}`,
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '2px',
    background: theme.palette.mode === 'dark'
      ? `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.8)}, ${alpha(theme.palette.info.main, 0.6)}, transparent)`
      : `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.6)}, transparent)`
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '1px',
    background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.divider, 0.4)}, transparent)`
  }
}));

const LoadingSkeleton = styled(Box)(({ theme }) => ({
  background: `linear-gradient(90deg, ${alpha(theme.palette.divider, 0.1)} 25%, ${alpha(
    theme.palette.divider,
    0.2
  )} 50%, ${alpha(theme.palette.divider, 0.1)} 75%)`,
  backgroundSize: '200px 100%',
  animation: `${shimmer} 1.5s infinite linear`,
  borderRadius: theme.shape.borderRadius
}));

function PriceChart({ token }) {
  const BASE_URL = process.env.API_URL;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [data, setData] = useState([]);
  const [dataOHLC, setDataOHLC] = useState([]);
  const [chartType, setChartType] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [range, setRange] = useState('12h');
  const [lastPrice, setLastPrice] = useState(null);
  const [priceChange, setPriceChange] = useState(0);
  const [volumeChange, setVolumeChange] = useState(0);
  const [isStreaming, setIsStreaming] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());

  const [minTime, setMinTime] = useState(0);
  const [maxTime, setMaxTime] = useState(0);

  const { accountProfile, activeFiatCurrency } = useContext(AppContext);
  const isAdmin = accountProfile && accountProfile.account && accountProfile.admin;

  const router = useRouter();
  const fromSearch = router.query.fromSearch ? '&fromSearch=1' : '';

  const [chartControls, setChartControls] = useState({
    animationsEnabled: false,
    brushEnabled: true,
    autoScaleYaxis: true,
    selectionEnabled: true,
    selectionFill: theme.palette.chartFill,
    selectionStroke: {
      width: 1,
      dashArray: 3,
      color: theme.palette.divider1,
      opacity: 0.8
    },
    selectionXaxis: {
      min: minTime || 0,
      max: maxTime || 0
    }
  });

  // Add outlier detection function
  const detectAndFilterOutliers = useCallback((data, threshold = 10) => {
    if (!data || data.length < 3) return data;

    // Calculate median price to identify outliers
    const prices = data.map((item) => item[1]).filter((price) => price > 0);
    if (prices.length === 0) return data;

    // Sort prices to find median
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const median = sortedPrices[Math.floor(sortedPrices.length / 2)];

    // Filter out extreme outliers (more than threshold times the median)
    const filteredData = data.filter((item) => {
      const price = item[1];
      if (price <= 0) return false;

      // Remove values that are more than threshold times the median
      const ratio = price / median;
      return ratio <= threshold && ratio >= 1 / threshold;
    });

    // Remove console logs in production
    if (process.env.NODE_ENV === 'development') {
      console.log(`Outlier detection: ${data.length} -> ${filteredData.length} data points`);
      if (filteredData.length < data.length) {
        console.log(`Filtered out ${data.length - filteredData.length} outliers`);
      }
    }

    return filteredData;
  }, []);

  // Add OHLC outlier detection function
  const detectAndFilterOHLCOutliers = useCallback((data, threshold = 10) => {
    if (!data || data.length < 3) return data;

    // Calculate median of close prices to identify outliers
    const closePrices = data.map((item) => item[4]).filter((price) => price > 0);
    if (closePrices.length === 0) return data;

    // Sort prices to find median
    const sortedPrices = [...closePrices].sort((a, b) => a - b);
    const median = sortedPrices[Math.floor(sortedPrices.length / 2)];

    // Filter out extreme outliers in OHLC data
    const filteredData = data.filter((item) => {
      const [timestamp, open, high, low, close] = item;
      const prices = [open, high, low, close];

      // Check if any OHLC value is an extreme outlier
      const hasOutlier = prices.some((price) => {
        if (price <= 0) return true;
        const ratio = price / median;
        return ratio > threshold || ratio < 1 / threshold;
      });

      return !hasOutlier;
    });

    // Remove console logs in production
    if (process.env.NODE_ENV === 'development') {
      console.log(`OHLC outlier detection: ${data.length} -> ${filteredData.length} data points`);
      if (filteredData.length < data.length) {
        console.log(`Filtered out ${data.length - filteredData.length} OHLC outliers`);
      }
    }

    return filteredData;
  }, []);

  // Main data fetching effect
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function getGraph() {
      setIsLoading(true);

      try {
        const apiRange = range === '12h' ? 'SPARK' : range;
        const [lineRes, ohlcRes] = await Promise.all([
          axios.get(
            `${BASE_URL}/graph-with-metrics/${token.md5}?range=${apiRange}&vs_currency=${fiatMapping[activeFiatCurrency]}${fromSearch}`,
            { signal: controller.signal }
          ),
          axios.get(
            `${BASE_URL}/graph-ohlc-with-metrics/${token.md5}?range=${apiRange}&vs_currency=${fiatMapping[activeFiatCurrency]}${fromSearch}`,
            { signal: controller.signal }
          )
        ]);

        if (!isMounted) return;

        // Process line chart data
        if (lineRes.status === 200 && lineRes.data?.history?.length > 0) {
          const items = lineRes.data.history;

          // 7D and 1M specific validation: ensure line data integrity
          let validatedItems = items;
          if (range === '7D' || range === '1M') {
            validatedItems = items.filter(
              (item) =>
                item &&
                item.length === 3 &&
                typeof item[0] === 'number' && // timestamp
                typeof item[1] === 'number' && // price
                typeof item[2] === 'number' // volume
            );
          }

          // Apply outlier detection to all ranges
          const filteredItems = detectAndFilterOutliers(validatedItems);

          if (filteredItems.length > 0) {
            setMinTime(filteredItems[0][0]);
            setMaxTime(filteredItems[filteredItems.length - 1][0]);
            setData(filteredItems);

            // Set last price for change calculation
            setLastPrice(filteredItems[filteredItems.length - 1][1]);
          } else {
            setData([]);
          }
        } else {
          setData([]);
        }

        // Process OHLC chart data
        if (ohlcRes.status === 200) {
          // Check if the response has the expected structure
          const responseData = ohlcRes.data;
          let items = [];
          
          // Handle different response formats
          if (responseData?.ohlc && Array.isArray(responseData.ohlc)) {
            // API returns data in { ohlc: [...] } format
            items = responseData.ohlc;
          } else if (responseData?.history && Array.isArray(responseData.history)) {
            // Legacy format with history array
            items = responseData.history;
          } else if (Array.isArray(responseData)) {
            // Direct array response
            items = responseData;
          }

          if (items.length > 0) {
            // Transform OHLC data to Highcharts format [timestamp, open, high, low, close]
            // The API returns [timestamp, open, high, low, close, volume]
            const highchartsOHLCData = items
              .filter(item => 
                item && 
                item.length >= 5 && // At least 5 elements (volume is optional)
                typeof item[0] === 'number' && // timestamp
                typeof item[1] === 'number' && // open
                typeof item[2] === 'number' && // high
                typeof item[3] === 'number' && // low
                typeof item[4] === 'number'    // close
              )
              .map(item => [
                item[0], // timestamp
                item[1], // open
                item[2], // high
                item[3], // low
                item[4]  // close
              ]);

            // Apply OHLC outlier detection
            const filteredOHLCItems = detectAndFilterOHLCOutliers(highchartsOHLCData);
            setDataOHLC(filteredOHLCItems);
            
            // Store the original data with volume for the volume series
            window._ohlcVolumeData = items;
          } else {
            setDataOHLC([]);
          }
        } else {
          setDataOHLC([]);
        }
      } catch (err) {
        if (!controller.signal.aborted && isMounted) {
          console.error('Error fetching graph data:', err);
          setData([]);
          setDataOHLC([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    getGraph();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [
    range,
    activeFiatCurrency,
    token.md5,
    BASE_URL,
    fromSearch,
    detectAndFilterOutliers,
    detectAndFilterOHLCOutliers
  ]);

  // Real-time price update effect with throttling
  const lastExchRef = useRef(token.exch);
  const throttleRef = useRef(null);
  
  useEffect(() => {
    if (!token || token.exch === undefined || token.exch === lastExchRef.current) return;
    
    lastExchRef.current = token.exch;
    
    // Throttle updates to once per second to reduce CPU usage
    if (throttleRef.current) clearTimeout(throttleRef.current);
    
    throttleRef.current = setTimeout(() => {
      const newPrice = Number(token.exch);
      if (isNaN(newPrice) || newPrice <= 0) return;

      setLastPrice((prevLastPrice) => {
        const change = newPrice - (prevLastPrice || newPrice);
        setPriceChange(change);
        return newPrice;
      });
    }, 1000);
    
    return () => {
      if (throttleRef.current) clearTimeout(throttleRef.current);
    };
  }, [token.exch]);

  let user = token.user;
  if (!user) user = token.name;
  let name = token.name;

  useEffect(() => {
    // Update the selectionXaxis when minTime or maxTime change
    setChartControls((prevControls) => ({
      ...prevControls,
      selectionXaxis: {
        min: minTime || 0,
        max: maxTime || 0
      }
    }));
  }, [minTime, maxTime]);

  // Optimize mediumValue calculation with useMemo and data length check
  const mediumValue = useMemo(() => {
    if (chartType === 0 && data?.length > 0) {
      // Sample only every 10th point for large datasets to improve performance
      const sampleStep = data.length > 1000 ? Math.ceil(data.length / 100) : 1;
      const prices = data.filter((_, i) => i % sampleStep === 0).map((point) => point[1]);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      return (min + max) / 2;
    } else if (chartType === 1 && dataOHLC?.length > 0) {
      const sampleStep = dataOHLC.length > 1000 ? Math.ceil(dataOHLC.length / 100) : 1;
      const closes = dataOHLC.filter((_, i) => i % sampleStep === 0).map((point) => point[4]);
      const min = Math.min(...closes);
      const max = Math.max(...closes);
      return (min + max) / 2;
    }
    return null;
  }, [chartType, data?.length, dataOHLC?.length]);

  // Memoize price data transformation
  const priceSeriesData = useMemo(() => {
    return data?.length > 0 ? data.map(([timestamp, price]) => [timestamp, price]) : [];
  }, [data]);

  // Memoize volume data transformation with color calculations
  const volumeSeriesData = useMemo(() => {
    if (!data?.length) return [];
    
    return data.map(([timestamp, price, volume], i) => {
      let color;
      if (i > 0) {
        const prevPrice = data[i - 1][1];
        if (price > prevPrice) {
          color = alpha(theme.palette.success.main, 0.15);
        } else if (price < prevPrice) {
          color = alpha(theme.palette.error.main, 0.15);
        } else {
          color = alpha(theme.palette.grey[500], 0.1);
        }
      } else {
        color = alpha(theme.palette.grey[500], 0.1);
      }
      return { x: timestamp, y: volume, color };
    });
  }, [data, theme.palette]);

  const handleChange = useCallback((event, newRange) => {
    if (newRange) {
      setRange(newRange);
      // Don't stop streaming when changing range, just update the subscription
    }
  }, []);

  const handleDownloadCSV = useCallback(
    (event) => {
      if (!data?.length) return;

      const median1 = createMedianFilter(2);
      const median2 = createMedianFilter(3);

      const csvData = data.map(([timestamp, price]) => ({
        time: timestamp,
        original: price,
        median1: median1(price),
        median2: median2(price)
      }));

      const dataToConvert = {
        data: csvData,
        filename: `${user}_${name}_${range}_${activeFiatCurrency}_price_data`,
        delimiter: ',',
        headers: ['Time', 'Original', 'Median_1', 'Median_2']
      };
      csvDownload(dataToConvert);
    },
    [data, user, name, range, activeFiatCurrency]
  );

  const handleAfterSetExtremes = useCallback(() => {
    // This function is no longer needed since we use useMemo for mediumValue
    // Kept for backward compatibility with chart options
  }, []);

  // WebSocket configuration
  const socketUrl = isStreaming && token?.md5 ? `wss://api.xrpl.to/ws/ohlc` : null;
  console.log('[WebSocket] Socket URL:', socketUrl, 'Streaming:', isStreaming, 'Token MD5:', token?.md5);
  
  const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl, {
    onOpen: (event) => {
      console.log('[WebSocket] Connected, event:', event);
      // Wait a bit for connection to stabilize before subscribing
      setTimeout(() => {
        if (token?.md5 && isStreaming) {
          const interval = RANGE_TO_INTERVAL[range] || '5m';
          const subscribeMsg = {
            type: 'subscribe',
            tokenMd5: token.md5,
            intervals: [interval]
          };
          console.log('[WebSocket] Sending subscribe after delay:', subscribeMsg);
          sendMessage(JSON.stringify(subscribeMsg));
        }
      }, 100);
    },
    onMessage: (event) => {
      console.log('[WebSocket] Raw message received:', event.data);
    },
    onError: (event) => {
      console.error('[WebSocket] Error:', event);
    },
    onClose: (event) => {
      console.log('[WebSocket] Closed:', event.code, event.reason);
    },
    shouldReconnect: () => isStreaming,
    reconnectInterval: 3000,
    reconnectAttempts: 10,
    share: false,
    retryOnError: true
  });

  // Handle candle updates
  const handleCandleUpdate = useCallback((data) => {
    const currentInterval = RANGE_TO_INTERVAL[range] || '5m';
    if (data.interval !== currentInterval) {
      console.log('[WebSocket] Ignoring update for different interval:', data.interval, 'current:', currentInterval);
      return;
    }
    
    const newCandle = data.candle;
    console.log('[WebSocket] Processing candle update for chart type:', chartType);
    
    // Update OHLC data
    if (chartType === 1 && newCandle) {
      console.log('[WebSocket] Updating OHLC data');
      setDataOHLC(prevData => {
            if (!prevData || prevData.length === 0) return prevData;
            
            const lastCandle = prevData[prevData.length - 1];
            // Candle format from API: [timestamp, open, high, low, close, volume]
            const candleData = [
              newCandle[0], // timestamp
              newCandle[1], // open
              newCandle[2], // high
              newCandle[3], // low
              newCandle[4]  // close
            ];
            
            // Log the update for debugging
            console.log('[WebSocket] Candle data:', {
              timestamp: new Date(newCandle[0]).toLocaleTimeString(),
              open: newCandle[1],
              high: newCandle[2],
              low: newCandle[3],
              close: newCandle[4],
              volume: newCandle[5]
            });
            
            // Update existing candle or add new one
            if (lastCandle[0] === newCandle[0]) {
              console.log('[WebSocket] Updating existing candle at timestamp:', newCandle[0]);
              const updated = [...prevData.slice(0, -1), candleData];
              console.log('[WebSocket] Updated OHLC data length:', updated.length);
              setLastUpdateTime(Date.now()); // Force re-render
              return updated;
            } else if (newCandle[0] > lastCandle[0]) {
              console.log('[WebSocket] Adding new candle at timestamp:', newCandle[0]);
              const updated = [...prevData, candleData];
              console.log('[WebSocket] Updated OHLC data length:', updated.length);
              return updated;
            }
            console.log('[WebSocket] Timestamp not newer, skipping update');
            return prevData;
          });
          
          // Store volume data
          if (window._ohlcVolumeData && newCandle[5] !== undefined) {
            const volumeEntry = [...newCandle];
            
            const lastVolume = window._ohlcVolumeData[window._ohlcVolumeData.length - 1];
            if (lastVolume && lastVolume[0] === newCandle[0]) {
              window._ohlcVolumeData[window._ohlcVolumeData.length - 1] = volumeEntry;
            } else if (!lastVolume || newCandle[0] > lastVolume[0]) {
              window._ohlcVolumeData.push(volumeEntry);
            }
          }
        }
        
        // Update line chart data
        if (chartType === 0 && newCandle) {
          setData(prevData => {
            if (!prevData || prevData.length === 0) return prevData;
            
            const timestamp = newCandle[0];
            const price = newCandle[4]; // close price
            const volume = newCandle[5] || 0;
            
            const lastPoint = prevData[prevData.length - 1];
            
            // Update or add new point
            if (lastPoint[0] === timestamp) {
              return [...prevData.slice(0, -1), [timestamp, price, volume]];
            } else if (timestamp > lastPoint[0]) {
              return [...prevData, [timestamp, price, volume]];
            }
            return prevData;
          });
        }
        
        // Update last price and calculate change
        if (newCandle[4]) {
          setLastPrice(prev => {
            const change = newCandle[4] - (prev || newCandle[4]);
            setPriceChange(change);
            return newCandle[4];
          });
        }
  }, [chartType, range]);

  // Handle completed candles
  const handleCandleComplete = useCallback((data) => {
    const currentInterval = RANGE_TO_INTERVAL[range] || '5m';
    if (data.interval !== currentInterval) return;
    
    console.log('[WebSocket] Candle completed, fetching fresh data');
    // Trigger a data refresh to ensure consistency
    // This reuses the existing data fetching logic
    const controller = new AbortController();
    
    async function refreshData() {
      try {
        const apiRange = range === '12h' ? 'SPARK' : range;
        const [lineRes, ohlcRes] = await Promise.all([
          axios.get(
            `${BASE_URL}/graph-with-metrics/${token.md5}?range=${apiRange}&vs_currency=${fiatMapping[activeFiatCurrency]}${fromSearch}`,
            { signal: controller.signal }
          ),
          axios.get(
            `${BASE_URL}/graph-ohlc-with-metrics/${token.md5}?range=${apiRange}&vs_currency=${fiatMapping[activeFiatCurrency]}${fromSearch}`,
            { signal: controller.signal }
          )
        ]);

        // Process the fresh data
        if (lineRes.status === 200 && lineRes.data?.history?.length > 0) {
          const filteredItems = detectAndFilterOutliers(lineRes.data.history);
          if (filteredItems.length > 0) {
            setData(filteredItems);
            setLastPrice(filteredItems[filteredItems.length - 1][1]);
          }
        }

        if (ohlcRes.status === 200) {
          const responseData = ohlcRes.data;
          let items = responseData?.ohlc || responseData?.history || responseData || [];
          
          if (items.length > 0) {
            const highchartsOHLCData = items
              .filter(item => item && item.length >= 5)
              .map(item => [item[0], item[1], item[2], item[3], item[4]]);
            
            const filteredOHLCItems = detectAndFilterOHLCOutliers(highchartsOHLCData);
            setDataOHLC(filteredOHLCItems);
            window._ohlcVolumeData = items;
          }
        }
      } catch (err) {
        console.error('[WebSocket] Error refreshing data on candle complete:', err);
      }
    }
    
    refreshData();
    
    return () => controller.abort();
  }, [range, token.md5, BASE_URL, activeFiatCurrency, fromSearch, detectAndFilterOutliers, detectAndFilterOHLCOutliers]);

  // Re-subscribe when range changes
  useEffect(() => {
    if (readyState === 1 && isStreaming && token?.md5) {
      const interval = RANGE_TO_INTERVAL[range] || '5m';
      const subscribeMsg = {
        type: 'subscribe',
        tokenMd5: token.md5,
        intervals: [interval]
      };
      console.log('[WebSocket] Re-subscribing due to range change:', subscribeMsg);
      sendMessage(JSON.stringify(subscribeMsg));
    }
  }, [range, readyState, isStreaming, token?.md5, activeFiatCurrency, sendMessage]);

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage || !isStreaming) {
      console.log('[WebSocket] No message or streaming disabled:', { lastMessage: !!lastMessage, isStreaming });
      return;
    }
    
    try {
      const message = JSON.parse(lastMessage.data);
      console.log('[WebSocket] Parsed message:', message);
      
      // Handle different message types according to the guide
      switch (message.type) {
        case 'welcome':
          console.log('[WebSocket] Welcome message received');
          break;
          
        case 'subscribed':
          console.log('[WebSocket] Subscribed to intervals:', message.intervals);
          break;
          
        case 'candleUpdate':
          if (message.tokenMd5 === token.md5) {
            const newCandle = message.candle;
            console.log('[WebSocket] Candle update:', newCandle, 'Interval:', message.interval);
            handleCandleUpdate(message);
          }
          break;
          
        case 'candleComplete':
          if (message.tokenMd5 === token.md5) {
            console.log('[WebSocket] Candle completed:', message);
            // Fetch fresh data when a candle completes
            handleCandleComplete(message);
          }
          break;
          
        case 'error':
          console.error('[WebSocket] Error from server:', message.message);
          break;
          
        default:
          console.log('[WebSocket] Unknown message type:', message.type);
      }
    } catch (err) {
      console.error('WebSocket message parse error:', err);
    }
  }, [lastMessage, isStreaming, token.md5, handleCandleUpdate, handleCandleComplete]);

  const toggleStreaming = useCallback(() => {
    setIsStreaming(prev => !prev);
  }, []);

  // Development helper for 7D/1M data validation
  const validateTimeSeriesData = useCallback(() => {
    if (range !== '7D' && range !== '1M')
      return { valid: false, reason: `Not in 7D or 1M mode (current: ${range})` };

    const lineDataValid = data.every(
      (item) =>
        item &&
        item.length === 3 &&
        typeof item[0] === 'number' &&
        typeof item[1] === 'number' &&
        typeof item[2] === 'number'
    );

    const ohlcDataValid = dataOHLC.every(
      (item) =>
        item &&
        item.length === 6 &&
        typeof item[0] === 'number' &&
        typeof item[1] === 'number' &&
        typeof item[2] === 'number' &&
        typeof item[3] === 'number' &&
        typeof item[4] === 'number' &&
        typeof item[5] === 'number'
    );

    return {
      valid: lineDataValid && ohlcDataValid,
      range: range,
      lineDataCount: data.length,
      ohlcDataCount: dataOHLC.length,
      lineDataValid,
      ohlcDataValid,
      expectedDataPoints:
        range === '7D'
          ? '~500 (5-min intervals)'
          : range === '1M'
            ? '~721 (1-hour intervals)'
            : 'variable',
      timeRange:
        data.length > 0
          ? {
              start: new Date(data[0][0]).toISOString(),
              end: new Date(data[data.length - 1][0]).toISOString(),
              duration: `${Math.round((data[data.length - 1][0] - data[0][0]) / (1000 * 60 * 60 * 24))} days`
            }
          : null
    };
  }, [range, data, dataOHLC]);

  // Expose validation function in development
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    window.validateTimeSeriesData = validateTimeSeriesData;
    // Keep legacy name for backwards compatibility
    window.validate7DData = validateTimeSeriesData;
  }

  const options1 = useMemo(
    () => ({
      title: {
        text: null
      },
      chart: {
        backgroundColor: 'transparent',
        type: 'areaspline',
        height: isMobile ? '400px' : '550px',
        events: {
          render: function () {
            const chart = this;
            const imgUrl = theme.palette.mode === 'dark'
              ? '/logo/xrpl-to-logo-white.svg'
              : '/logo/xrpl-to-logo-black.svg';
            const imgWidth = '50';
            const imgHeight = '15';

            if (chart.watermark) {
              chart.watermark.destroy();
            }

            const xPos = chart.plotWidth - imgWidth - 10;
            const yPos = chart.plotHeight - imgHeight - 10;

            chart.watermark = chart.renderer
              .image(imgUrl, xPos, yPos, imgWidth, imgHeight)
              .attr({
                zIndex: 5,
                opacity: theme.palette.mode === 'dark' ? 0.4 : 0.2,
                width: '100px'
              })
              .add();
          }
        },
        zoomType: 'xy',
        marginBottom: isMobile ? 30 : 40,
        animation: {
          duration: 1200,
          easing: 'easeOutCubic'
        },
        style: {
          fontFamily: theme.typography.fontFamily
        },
        // Performance optimizations
        turboThreshold: 1000,
        boostThreshold: 500,
        plotBorderWidth: 0,
        reflow: true
      },
      legend: { enabled: false },
      credits: {
        text: ''
      },
      xAxis: {
        type: 'datetime',
        crosshair: {
          width: 1,
          dashStyle: 'Solid',
          color: alpha(theme.palette.primary.main, 0.6),
          zIndex: 2
        },
        labels: {
          style: {
            color: theme.palette.text.primary,
            fontWeight: 500,
            fontSize: '10px'
          },
          formatter: function () {
            const date = new Date(this.value);
            if (range === '12h') {
              return format(date, 'HH:mm');
            } else if (range === '1D') {
              return format(date, 'HH:mm');
            } else if (range === '7D') {
              return format(date, 'MMM dd HH:mm');
            } else if (range === '1M') {
              return format(date, 'MMM dd');
            } else {
              return format(date, 'MMM dd');
            }
          }
        },
        lineColor: alpha(theme.palette.divider, 0.6),
        tickColor: alpha(theme.palette.divider, 0.6),
        minPadding: 0,
        maxPadding: 0,
        gridLineWidth: 0,
        gridLineColor: alpha(theme.palette.divider, 0.05)
      },
      yAxis: [
        {
          title: {
            text: null
          },
          tickAmount: isMobile ? 3 : 5,
          tickWidth: 1,
          gridLineColor: alpha(theme.palette.divider, 0.05),
          minPadding: 0.1,
          maxPadding: 0.1,
          labels: {
            style: {
              color: theme.palette.text.primary,
              fontWeight: 500,
              fontSize: '10px'
            },
            formatter: function () {
              return fCurrency5(this.value);
            }
          },
          events: {
            afterSetExtremes: handleAfterSetExtremes
          },
          height: isMobile ? '85%' : '80%',
          plotLines: [
            ...(mediumValue
              ? [
                  {
                    width: 0.5,
                    value: mediumValue,
                    dashStyle: 'LongDash',
                    color: alpha(theme.palette.divider, 0.3),
                    zIndex: 1
                  }
                ]
              : []),
            ...(lastPrice
              ? [
                  {
                    width: 0.5,
                    value: lastPrice,
                    dashStyle: 'Dot',
                    color: alpha(theme.palette.primary.main, 0.4),
                    label: {
                      text: fCurrency5(lastPrice),
                      align: 'right',
                      style: {
                        color: theme.palette.text.secondary,
                        fontSize: '9px'
                      },
                      x: -2,
                      y: -2
                    },
                    zIndex: 3
                  }
                ]
              : [])
          ],
          crosshair: {
            width: 1,
            dashStyle: 'Solid',
            color: alpha(theme.palette.primary.main, 0.6),
            zIndex: 2
          }
        },
        {
          title: {
            text: null
          },
          labels: {
            enabled: true
          },
          type: 'logarithmic',
          min: 0.001,
          top: isMobile ? '85%' : '80%',
          height: isMobile ? '15%' : '20%',
          offset: -5,
          lineWidth: 0,
          gridLineWidth: 0,
          gridLineColor: alpha(theme.palette.divider, 0.05)
        }
      ],
      plotOptions: {
        areaspline: {
          marker: {
            enabled: false,
            symbol: 'circle',
            radius: 3,
            states: {
              hover: {
                enabled: true,
                radius: 6,
                lineWidth: 2,
                lineColor: theme.palette.background.paper,
                fillColor: theme.palette.primary.main
              }
            }
          },
          lineWidth: 2.5,
          states: {
            hover: {
              lineWidth: 3.5,
              brightness: 0.1
            }
          },
          fillOpacity: 0.3,
          zoneAxis: 'y'
        },
        series: {
          states: {
            inactive: {
              opacity: 1
            },
            hover: {
              animation: {
                duration: 200
              }
            }
          },
          zones: [
            {
              value: mediumValue,
              color: {
                linearGradient: { x1: 0, x2: 0, y1: 0, y2: 1 },
                stops: [
                  [0, theme.palette.error.light],
                  [1, theme.palette.error.main]
                ]
              },
              fillColor: {
                linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                stops: [
                  [0, `${theme.palette.error.light}40`],
                  [0.5, `${theme.palette.error.main}25`],
                  [1, `${theme.palette.error.light}15`]
                ]
              }
            },
            {
              color: {
                linearGradient: { x1: 0, x2: 0, y1: 0, y2: 1 },
                stops: [
                  [0, theme.palette.success.light],
                  [1, theme.palette.success.main]
                ]
              },
              fillColor: {
                linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                stops: [
                  [0, `${theme.palette.success.main}40`],
                  [0.5, `${theme.palette.success.light}25`],
                  [1, `${theme.palette.success.main}15`]
                ]
              }
            }
          ]
        },
        column: {
          borderRadius: 0,
          animation: false,
          borderWidth: 0,
          states: {
            hover: {
              enabled: false
            }
          }
        }
      },
      series: [
        {
          name: 'Price',
          data: priceSeriesData,
          threshold: mediumValue,
          lineWidth: 2.5,
          animation: false
        },
        {
          type: 'column',
          name: 'Volume',
          data: volumeSeriesData,
          yAxis: 1,
          showInLegend: false,
          borderWidth: 0,
          zIndex: -1,
          opacity: 0.7,
          states: {
            hover: {
              enabled: false
            }
          }
        }
      ],
      tooltip: {
        enabled: true,
        backgroundColor: theme.palette.mode === 'dark'
          ? alpha(theme.palette.grey[900], 0.95)
          : alpha(theme.palette.background.paper, 0.95),
        borderColor: alpha(theme.palette.primary.main, 0.3),
        borderRadius: theme.shape.borderRadius * 1.5,
        borderWidth: 1,
        shadow: {
          color: alpha(theme.palette.primary.main, 0.2),
          offsetX: 0,
          offsetY: 4,
          opacity: 0.3,
          width: 8
        },
        style: {
          color: theme.palette.text.primary,
          fontSize: '11px',
          fontWeight: 500
        },
        formatter: function () {
          const formatString =
            range === '12h'
              ? 'MMM dd, yyyy HH:mm:ss'
              : range === '7D'
                ? 'MMM dd, yyyy HH:mm'
                : range === '1M'
                  ? 'MMM dd, yyyy HH:mm'
                  : 'MMM dd, yyyy HH:mm';
          const volumeData = data.find((d) => d[0] === this.x)?.[2] || 0;

          return `<div style="padding: 8px;">
            <div style="font-weight: 600; color: ${
              theme.palette.primary.main
            }; margin-bottom: 4px;">
              ${format(this.x, formatString)}
            </div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background: ${
                theme.palette.success.main
              };"></div>
              <span>Price: <strong>${fCurrency5(this.y)}</strong></span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; font-size: 10px; color: ${theme.palette.text.secondary};">
              <span>Volume: <strong>${fVolume(volumeData)}</strong></span>
            </div>
            ${
              priceChange !== 0
                ? `<div style="font-size: 10px; color: ${priceChange > 0 ? theme.palette.success.main : theme.palette.error.main};">
              Change: <strong>${priceChange > 0 ? '+' : ''}${fCurrency5(priceChange)}</strong>
            </div>`
                : ''
            }
          </div>`;
        },
        shared: false,
        useHTML: true,
        hideDelay: 100
      },
      responsive: {
        rules: [
          {
            condition: {
              maxWidth: 500
            },
            chartOptions: {
              yAxis: [
                {
                  labels: {
                    align: 'right',
                    x: -5,
                    y: 0
                  }
                },
                {
                  labels: {
                    enabled: true,
                    align: 'left',
                    x: 5,
                    y: 0
                  }
                }
              ]
            }
          }
        ]
      }
    }),
    [data, mediumValue, theme, range, user, name, priceSeriesData, volumeSeriesData, isMobile, activeFiatCurrency, priceChange, lastPrice]
  );

  const options2 = useMemo(
    () => ({
      plotOptions: {
        candlestick: {
          color: theme.palette.error.main,
          lineColor: theme.palette.error.main,
          upColor: theme.palette.success.main,
          upLineColor: theme.palette.success.main,
          lineWidth: 0.1,
          crisp: true,
          states: {
            hover: {
              lineWidth: 0.2,
              brightness: 0.1
            }
          },
          groupPadding: 0.1,
          pointPadding: 0.05,
          maxPointWidth: 0.4,
          minPointLength: 0.2,
          dataGrouping: {
            enabled: false
          },
          pointWidth: 0.3,
          borderWidth: 0.1
        }
      },
      rangeSelector: {
        enabled: false
      },
      navigator: {
        enabled: true,
        height: 25,
        margin: 2,
        maskFill: alpha(theme.palette.primary.main, 0.05),
        outlineColor: alpha(theme.palette.divider, 0.2),
        outlineWidth: 0.5,
        series: {
          type: 'candlestick',
          color: theme.palette.error.main,
          lineColor: theme.palette.error.main,
          upColor: theme.palette.success.main,
          upLineColor: theme.palette.success.main
        },
        xAxis: {
          gridLineWidth: 0,
          labels: {
            enabled: false
          }
        }
      },
      scrollbar: {
        enabled: true,
        height: 8,
        barBackgroundColor: alpha(theme.palette.primary.main, 0.2),
        barBorderRadius: 4,
        barBorderWidth: 0,
        buttonBackgroundColor: alpha(theme.palette.primary.main, 0.3),
        buttonBorderWidth: 0,
        buttonBorderRadius: 4,
        trackBackgroundColor: alpha(theme.palette.divider, 0.05),
        trackBorderWidth: 0,
        trackBorderRadius: 4,
        trackBorderColor: 'transparent',
        rifleColor: theme.palette.primary.main,
        buttonArrowColor: theme.palette.primary.main
      },
      title: {
        text: null
      },
      chart: {
        backgroundColor: 'transparent',
        height: isMobile ? '400px' : '550px',
        alignTicks: false,
        spacingTop: 0,
        spacingBottom: 0,
        spacingLeft: 0,
        spacingRight: 0,
        events: {
          render: function () {
            const chart = this;
            const imgUrl = theme.palette.mode === 'dark'
              ? '/logo/xrpl-to-logo-white.svg'
              : '/logo/xrpl-to-logo-black.svg';
            const imgWidth = '50';
            const imgHeight = '15';

            if (chart.watermark) {
              chart.watermark.destroy();
            }

            const xPos = chart.plotWidth - imgWidth - 10;
            const yPos = chart.plotHeight - imgHeight - 10;

            chart.watermark = chart.renderer
              .image(imgUrl, xPos, yPos, imgWidth, imgHeight)
              .attr({
                zIndex: 5,
                opacity: theme.palette.mode === 'dark' ? 0.4 : 0.2,
                width: '100px'
              })
              .add();
          }
        },
        animation: {
          duration: 1200,
          easing: 'easeOutCubic'
        },
        style: {
          fontFamily: theme.typography.fontFamily
        },
        // Performance optimizations
        turboThreshold: 1000,
        boostThreshold: 500,
        plotBorderWidth: 0,
        reflow: true,
        zoomType: 'x',
        panning: {
          enabled: true,
          type: 'x'
        },
        panKey: 'shift',
        marginLeft: 50,
        marginRight: 10,
        marginTop: 0
      },
      legend: { enabled: false },
      credits: {
        enabled: false
      },
      xAxis: {
        type: 'datetime',
        crosshair: {
          width: 1,
          dashStyle: 'Solid',
          color: alpha(theme.palette.primary.main, 0.6)
        },
        labels: {
          style: {
            color: theme.palette.text.primary,
            fontWeight: 500,
            fontSize: '10px'
          },
          formatter: function () {
            const date = new Date(this.value);
            if (range === '12h') {
              return format(date, 'HH:mm');
            } else if (range === '1D') {
              return format(date, 'HH:mm');
            } else if (range === '7D') {
              return format(date, 'MMM dd HH:mm');
            } else if (range === '1M') {
              return format(date, 'MMM dd');
            } else {
              return format(date, 'MMM dd');
            }
          }
        },
        lineColor: alpha(theme.palette.divider, 0.6),
        tickColor: alpha(theme.palette.divider, 0.6),
        minPadding: 0,
        maxPadding: 0,
        gridLineWidth: 0,
        gridLineColor: alpha(theme.palette.divider, 0.05)
      },
      yAxis: [
        {
          crosshair: {
            width: 1,
            dashStyle: 'Solid',
            color: alpha(theme.palette.primary.main, 0.6)
          },
          title: {
            text: null
          },
          labels: {
            style: {
              color: theme.palette.text.primary,
              fontWeight: 500,
              fontSize: '10px'
            },
            formatter: function () {
              return fCurrency5(this.value);
            }
          },
          gridLineColor: alpha(theme.palette.divider, 0.05),
          minPadding: 0.15,
          maxPadding: 0.15,
          plotLines: [
            ...(mediumValue
              ? [
                  {
                    width: 0.5,
                    value: mediumValue,
                    dashStyle: 'LongDash',
                    color: alpha(theme.palette.divider, 0.3),
                    zIndex: 1
                  }
                ]
              : []),
            ...(dataOHLC?.length > 0
              ? [
                  {
                    width: 0.5,
                    value: dataOHLC[dataOHLC.length - 1]?.[4] || 0,
                    dashStyle: 'Dot',
                    color: alpha(theme.palette.primary.main, 0.4),
                    label: {
                      text: fCurrency5(dataOHLC[dataOHLC.length - 1]?.[4] || 0),
                      align: 'right',
                      style: {
                        color: theme.palette.text.secondary,
                        fontSize: '9px'
                      },
                      x: -2,
                      y: -2
                    },
                    zIndex: 3
                  }
                ]
              : [])
          ]
        },
        {
          title: {
            text: null
          },
          labels: {
            enabled: true,
            formatter: function () {
              return fVolume(this.value);
            }
          },
          type: 'logarithmic',
          min: 0.001,
          tickPixelInterval: 25,
          top: isMobile ? '85%' : '80%',
          height: isMobile ? '15%' : '20%',
          offset: -5,
          lineWidth: 0,
          gridLineWidth: 0,
          gridLineColor: alpha(theme.palette.divider, 0.05)
        }
      ],
      series: [
        {
          type: 'candlestick',
          name: `${user} ${name}`,
          data: dataOHLC,
          animation: false,
          groupPadding: 0.1,
          pointPadding: 0.05,
          maxPointWidth: 0.4,
          pointWidth: 0.3,
          tooltip: {
            pointFormat: '<span style="color:{point.color}">\u25CF</span> {series.name}<br/>' +
                        'Open: {point.open}<br/>' +
                        'High: {point.high}<br/>' +
                        'Low: {point.low}<br/>' +
                        'Close: {point.close}<br/>'
          }
        },
        {
          type: 'column',
          name: 'Volume',
          data:
            dataOHLC?.length > 0 && window._ohlcVolumeData
              ? dataOHLC.map((item, i) => {
                  let color;
                  if (i > 0) {
                    const prevClose = dataOHLC[i - 1][4]; // Previous close price
                    const currentClose = item[4]; // Current close price
                    if (currentClose > prevClose) {
                      color = alpha(theme.palette.success.main, 0.15); // Price up - very faded
                    } else if (currentClose < prevClose) {
                      color = alpha(theme.palette.error.main, 0.15); // Price down - very faded
                    } else {
                      color = alpha(theme.palette.grey[500], 0.1); // No change - barely visible
                    }
                  } else {
                    color = alpha(theme.palette.grey[500], 0.1); // First bar - barely visible
                  }
                  // Get volume from the original data that includes volume
                  const volumeData = window._ohlcVolumeData.find(d => d[0] === item[0]);
                  const volumeValue = volumeData && volumeData[5] ? Math.max(volumeData[5], 0.001) : 0.001;
                  return {
                    x: item[0], // Timestamp
                    y: volumeValue, // Volume from original data
                    color
                  };
                })
              : [],
          yAxis: 1,
          showInLegend: false,
          borderWidth: 0,
          pointPadding: 0.001,
          groupPadding: 0.001,
          minPointLength: 0.1,
          maxPointWidth: 0.2,
          zIndex: -1,
          opacity: 0.7,
          states: {
            hover: {
              enabled: false
            }
          }
        }
      ],
      tooltip: {
        enabled: true,
        backgroundColor: theme.palette.mode === 'dark'
          ? alpha(theme.palette.grey[900], 0.95)
          : alpha(theme.palette.background.paper, 0.95),
        borderColor: alpha(theme.palette.primary.main, 0.3),
        borderRadius: theme.shape.borderRadius * 1.5,
        borderWidth: 1,
        shadow: {
          color: alpha(theme.palette.primary.main, 0.2),
          offsetX: 0,
          offsetY: 4,
          opacity: 0.3,
          width: 8
        },
        style: {
          color: theme.palette.text.primary,
          fontSize: '11px',
          fontWeight: 500
        },
        formatter: function () {
          const formatString =
            range === '12h'
              ? 'MMM dd, yyyy HH:mm:ss'
              : range === '7D'
                ? 'MMM dd, yyyy HH:mm'
                : range === '1M'
                  ? 'MMM dd, yyyy HH:mm'
                  : 'MMM dd, yyyy HH:mm';
          return `<div style="padding: 8px;">
            <div style="font-weight: 600; color: ${
              theme.palette.primary.main
            }; margin-bottom: 6px;">
              ${format(this.x, formatString)}
            </div>
            <div style="display: grid; gap: 4px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: ${theme.palette.text.secondary};">Open:</span>
                <strong>${fCurrency5(this.point.open)}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: ${theme.palette.success.main};">High:</span>
                <strong style="color: ${theme.palette.success.main};">${fCurrency5(
                  this.point.high
                )}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: ${theme.palette.error.main};">Low:</span>
                <strong style="color: ${theme.palette.error.main};">${fCurrency5(
                  this.point.low
                )}</strong>
              </div>
              <div style="display: flex; justify-items: space-between;">
                <span style="color: ${theme.palette.text.secondary};">Close:</span>
                <strong>${fCurrency5(this.point.close)}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: ${theme.palette.text.secondary};">Volume:</span>
                <strong>${fVolume(
                  window._ohlcVolumeData && this.x
                    ? (() => {
                        const volumeData = window._ohlcVolumeData.find(d => d[0] === this.x);
                        return volumeData && volumeData[5] ? volumeData[5] : 0;
                      })()
                    : 0
                )}</strong>
              </div>
            </div>
          </div>`;
        },
        useHTML: true,
        hideDelay: 100
      },
      responsive: {
        rules: [
          {
            condition: {
              maxWidth: 500
            },
            chartOptions: {
              yAxis: [
                {
                  labels: {
                    align: 'right',
                    x: -5,
                    y: 0
                  }
                },
                {
                  labels: {
                    enabled: true,
                    align: 'left',
                    x: 5,
                    y: 0
                  }
                }
              ]
            }
          }
        ]
      }
    }),
    [dataOHLC, mediumValue, theme, range, user, name, isMobile, lastPrice, lastUpdateTime]
  );

  const rangeConfig = useMemo(
    () => ({
      colors: {
        '12h': theme.palette.info.main,
        '1D': theme.palette.primary.main,
        '7D': theme.palette.success.main,
        '1M': theme.palette.warning.main,
        '3M': theme.palette.info.main,
        '1Y': theme.palette.secondary.main,
        ALL: theme.palette.error.main
      },
      intervals: {
        ALL: '4 Day intervals - Long-term price trends',
        '1Y': '1 Day intervals - Daily price movements over a year',
        '3M': '1 Hour intervals - Intraday trends over 3 months',
        '1M': '30 Minute intervals - Detailed price movements over a month',
        '7D': '5 Minute intervals - Detailed 7-day price history',
        '1D': '1 Minute intervals - High-frequency data for one day',
        '12H': '5 Second intervals - Ultra real-time spark data'
      }
    }),
    [theme]
  );

  const getRangeColor = (currentRange) => {
    return rangeConfig.colors[currentRange] || theme.palette.primary.main;
  };

  const getIntervalTooltip = (currentRange) => {
    return rangeConfig.intervals[currentRange] || 'Price data intervals';
  };

  return (
    <>
      <Grid container rowSpacing={isMobile ? 0.5 : 1} alignItems="center" sx={{ mt: 0, mb: isMobile ? 0.75 : 1.5 }}>
        <Grid container item xs={12} alignItems="center" justifyContent="space-between">
          {isMobile ? (
            // Mobile Layout - Stack vertically
            <Stack spacing={0.75} sx={{ width: '100%' }}>
              {/* Title and Currency Row */}
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, #00ff88 0%, #00ccff 50%, #ffffff 100%)'
                      : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.info.main} 50%, ${theme.palette.primary.dark} 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontSize: '0.9rem',
                    lineHeight: 1
                  }}
                >
                  {`${user} ${name}`}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '0.7rem'
                  }}
                >
                  to
                  <Box component="span" sx={{ color: theme.palette.primary.main, fontWeight: 700, mx: 0.25 }}>
                    {currencySymbols[activeFiatCurrency]}
                  </Box>
                  {activeFiatCurrency}
                </Typography>
              </Box>

              {/* Controls Row */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                {/* Left side - Chart type and range indicator */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      display: 'flex',
                      borderRadius: 1,
                      background: alpha(theme.palette.background.paper, 0.8),
                      backdropFilter: 'blur(10px)',
                      p: 0.1
                    }}
                  >
                    <StyledToggleButtonGroup
                      size="small"
                      value={chartType}
                      exclusive
                      onChange={(e, newType) => setChartType(newType)}
                      aria-label="chart type"
                      sx={{ m: 0 }}
                    >
                      <EnhancedToggleButton
                        value={0}
                        sx={{
                          p: 0.25,
                          minWidth: '24px',
                          height: '24px',
                          borderRadius: 0.75
                        }}
                        aria-label="line chart"
                      >
                        <ShowChartIcon sx={{ fontSize: '16px' }} />
                      </EnhancedToggleButton>
                      <EnhancedToggleButton
                        value={1}
                        sx={{
                          p: 0.25,
                          minWidth: '24px',
                          height: '24px',
                          borderRadius: 0.75
                        }}
                        aria-label="candlestick chart"
                      >
                        <CandlestickChartIcon sx={{ fontSize: '16px' }} />
                      </EnhancedToggleButton>
                      <EnhancedToggleButton
                        value={2}
                        sx={{
                          p: 0.25,
                          minWidth: '24px',
                          height: '24px',
                          borderRadius: 0.75
                        }}
                        aria-label="rich list chart"
                      >
                        <PeopleIcon sx={{ fontSize: '16px' }} />
                      </EnhancedToggleButton>
                    </StyledToggleButtonGroup>
                  </Paper>

                  {chartType !== 2 && (
                    <Chip
                      size="small"
                      label={range}
                      sx={{
                        bgcolor: alpha(getRangeColor(range), 0.1),
                        color: getRangeColor(range),
                        fontWeight: 600,
                        fontSize: '0.6rem',
                        height: '18px',
                        '& .MuiChip-label': { px: 0.5 }
                      }}
                    />
                  )}

                  {lastPrice !== null && priceChange !== 0 && (
                    <Chip
                      size="small"
                      label={`${priceChange > 0 ? '+' : ''}${fCurrency5(priceChange)}`}
                      sx={{
                        bgcolor: alpha(
                          priceChange > 0 ? theme.palette.success.main : theme.palette.error.main,
                          0.1
                        ),
                        color: priceChange > 0 ? theme.palette.success.main : theme.palette.error.main,
                        fontWeight: 600,
                        fontSize: '0.6rem',
                        height: '18px',
                        '& .MuiChip-label': { px: 0.5 }
                      }}
                    />
                  )}
                </Box>

                {/* Right side - Time range buttons */}
                {chartType !== 2 && (
                  <Paper
                    elevation={0}
                    sx={{
                      display: 'flex',
                      borderRadius: 1,
                      background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.15)} 0%, ${alpha(theme.palette.background.paper, 0.08)} 100%)`,
                      backdropFilter: 'blur(24px)',
                      flexWrap: 'wrap',
                      p: 0.1
                    }}
                  >
                    <ToggleButtonGroup
                      color="primary"
                      value={range}
                      exclusive
                      onChange={handleChange}
                      size="small"
                      sx={{ m: 0 }}
                    >
                      {['12h', '1D', '7D', '1M'].map((timeRange) => (
                        <EnhancedToggleButton
                          key={timeRange}
                          sx={{
                            minWidth: '24px',
                            p: 0.25,
                            height: '24px',
                            borderRadius: 0.75
                          }}
                          value={timeRange}
                        >
                          <Typography variant="caption" fontWeight={600} fontSize="0.6rem">
                            {timeRange}
                          </Typography>
                        </EnhancedToggleButton>
                      ))}
                    </ToggleButtonGroup>
                  </Paper>
                )}
              </Box>
            </Stack>
          ) : (
            // Desktop Layout - Keep original
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, #00ff88 0%, #00ccff 50%, #ffffff 100%)'
                      : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.info.main} 50%, ${theme.palette.primary.dark} 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: theme.palette.mode === 'dark' 
                      ? '0px 0px 20px rgba(0,255,136,0.5)'
                      : `0px 0px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                    filter: theme.palette.mode === 'dark'
                      ? 'drop-shadow(0 0 10px rgba(0, 255, 136, 0.6))'
                      : `drop-shadow(0 0 10px ${alpha(theme.palette.primary.main, 0.4)})`,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {`${user} ${name}`}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    whiteSpace: 'nowrap'
                  }}
                >
                  to
                  <Box component="span" sx={{ color: theme.palette.primary.main, fontWeight: 700, mx: 0.5 }}>
                    {currencySymbols[activeFiatCurrency]}
                  </Box>
                  {activeFiatCurrency}
                </Typography>

                {chartType !== 2 && (
                  <Chip
                    size="small"
                    label={range}
                    sx={{
                      bgcolor: alpha(getRangeColor(range), 0.1),
                      color: getRangeColor(range),
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      height: '20px',
                      '& .MuiChip-label': { px: 0.75 }
                    }}
                    icon={
                      <Box
                        sx={{
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          bgcolor: getRangeColor(range),
                          boxShadow: `0 0 8px ${alpha(getRangeColor(range), 0.5)}`,
                          ...(isStreaming && {
                            animation: 'pulse 2s infinite',
                            '@keyframes pulse': {
                              '0%': { opacity: 1 },
                              '50%': { opacity: 0.3 },
                              '100%': { opacity: 1 }
                            }
                          })
                        }}
                      />
                    }
                  />
                )}

                {lastPrice !== null && priceChange !== 0 && (
                  <Chip
                    size="small"
                    label={`${priceChange > 0 ? '+' : ''}${fCurrency5(priceChange)}`}
                    sx={{
                      bgcolor: alpha(
                        priceChange > 0 ? theme.palette.success.main : theme.palette.error.main,
                        0.1
                      ),
                      color: priceChange > 0 ? theme.palette.success.main : theme.palette.error.main,
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      height: '20px',
                      '& .MuiChip-label': { px: 0.75 }
                    }}
                  />
                )}

                {chartType !== 2 && (
                  <Tooltip title={`WebSocket: ${readyState === 1 ? 'Connected' : readyState === 0 ? 'Connecting' : 'Disconnected'} | Streaming: ${isStreaming ? 'ON' : 'OFF'}`}>
                    <IconButton
                      size="small"
                      onClick={toggleStreaming}
                      sx={{
                        width: '28px',
                        height: '28px',
                        bgcolor: alpha(isStreaming ? theme.palette.success.main : theme.palette.grey[500], 0.1),
                        color: isStreaming ? theme.palette.success.main : theme.palette.grey[500],
                        transition: 'all 0.3s',
                        position: 'relative',
                        '&:hover': {
                          bgcolor: alpha(isStreaming ? theme.palette.success.main : theme.palette.grey[500], 0.15),
                          transform: 'scale(1.05)'
                        },
                        '&::after': readyState === 1 && isStreaming ? {
                          content: '""',
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: theme.palette.success.main,
                          animation: 'pulse 2s infinite'
                        } : {}
                      }}
                    >
                      {isStreaming ? <StopIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                )}
              </Box>

              {isAdmin && range !== 'OHLC' && (
                <IconButton
                  size="small"
                  onClick={handleDownloadCSV}
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    width: '28px',
                    height: '28px',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.15),
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
                    }
                  }}
                >
                  <DownloadIcon fontSize="small" />
                </IconButton>
              )}

              <Box>
                <Paper
                  elevation={0}
                  sx={{
                    display: 'flex',
                    borderRadius: 1.5,
                    background: alpha(theme.palette.background.paper, 0.8),
                    backdropFilter: 'blur(10px)',
                    flexWrap: 'wrap',
                    p: 0.2,
                    boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.08)}`
                  }}
                >
                  <StyledToggleButtonGroup
                    size="small"
                    value={chartType}
                    exclusive
                    onChange={(e, newType) => setChartType(newType)}
                    aria-label="chart type"
                    sx={{ m: 0 }}
                  >
                    <EnhancedToggleButton
                      value={0}
                      sx={{
                        p: 0.5,
                        minWidth: '28px',
                        height: '28px',
                        borderRadius: 1
                      }}
                      aria-label="line chart"
                    >
                      <ShowChartIcon fontSize="small" />
                    </EnhancedToggleButton>
                    <EnhancedToggleButton
                      value={1}
                      sx={{
                        p: 0.5,
                        minWidth: '28px',
                        height: '28px',
                        borderRadius: 1
                      }}
                      aria-label="candlestick chart"
                    >
                      <CandlestickChartIcon fontSize="small" />
                    </EnhancedToggleButton>
                    <EnhancedToggleButton
                      value={2}
                      sx={{
                        p: 0.5,
                        minWidth: '28px',
                        height: '28px',
                        borderRadius: 1
                      }}
                      aria-label="rich list chart"
                    >
                      <PeopleIcon fontSize="small" />
                    </EnhancedToggleButton>
                  </StyledToggleButtonGroup>
                </Paper>
              </Box>
            </Box>
          )}

          {!isMobile && chartType !== 2 && (
            <Box>
              <Paper
                elevation={0}
                sx={{
                  display: 'flex',
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.15)} 0%, ${alpha(theme.palette.background.paper, 0.08)} 100%)`,
                  backdropFilter: 'blur(24px)',
                  flexWrap: 'wrap',
                  p: 0.3,
                  boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.08)}`
                }}
              >
                <ToggleButtonGroup
                  color="primary"
                  value={range}
                  exclusive
                  onChange={handleChange}
                  size="small"
                  sx={{ m: 0 }}
                >
                  <Tooltip title={getIntervalTooltip('12h')} arrow placement="top">
                    <EnhancedToggleButton
                      sx={{
                        minWidth: '42px',
                        p: 0.5,
                        height: '28px',
                        borderRadius: 1,
                        position: 'relative',
                        overflow: 'hidden',
                        '&::after':
                          range === '12h'
                            ? {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: '-100%',
                                width: '100%',
                                height: '100%',
                                background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.success.main, 0.3)}, transparent)`,
                                animation: 'sparkle 2s infinite'
                              }
                            : {},
                        '@keyframes sparkle': {
                          '0%': { left: '-100%' },
                          '100%': { left: '100%' }
                        }
                      }}
                      value="12h"
                    >
                      <Typography variant="caption" fontWeight={700} fontSize="0.65rem">
                        12h
                      </Typography>
                    </EnhancedToggleButton>
                  </Tooltip>
                  <Tooltip title={getIntervalTooltip('1D')} arrow placement="top">
                    <EnhancedToggleButton
                      sx={{ minWidth: '32px', p: 0.5, height: '28px', borderRadius: 1 }}
                      value="1D"
                    >
                      <Typography variant="caption" fontWeight={600} fontSize="0.7rem">
                        1D
                      </Typography>
                    </EnhancedToggleButton>
                  </Tooltip>
                  <Tooltip title={getIntervalTooltip('7D')} arrow placement="top">
                    <EnhancedToggleButton
                      sx={{ minWidth: '32px', p: 0.5, height: '28px', borderRadius: 1 }}
                      value="7D"
                    >
                      <Typography variant="caption" fontWeight={600} fontSize="0.7rem">
                        7D
                      </Typography>
                    </EnhancedToggleButton>
                  </Tooltip>
                  <Tooltip title={getIntervalTooltip('1M')} arrow placement="top">
                    <EnhancedToggleButton
                      sx={{ minWidth: '32px', p: 0.5, height: '28px', borderRadius: 1 }}
                      value="1M"
                    >
                      <Typography variant="caption" fontWeight={600} fontSize="0.7rem">
                        1M
                      </Typography>
                    </EnhancedToggleButton>
                  </Tooltip>
                  <Tooltip title={getIntervalTooltip('3M')} arrow placement="top">
                    <EnhancedToggleButton
                      sx={{ minWidth: '32px', p: 0.5, height: '28px', borderRadius: 1 }}
                      value="3M"
                    >
                      <Typography variant="caption" fontWeight={600} fontSize="0.7rem">
                        3M
                      </Typography>
                    </EnhancedToggleButton>
                  </Tooltip>
                  <Tooltip title={getIntervalTooltip('1Y')} arrow placement="top">
                    <EnhancedToggleButton
                      sx={{ minWidth: '32px', p: 0.5, height: '28px', borderRadius: 1 }}
                      value="1Y"
                    >
                      <Typography variant="caption" fontWeight={600} fontSize="0.7rem">
                        1Y
                      </Typography>
                    </EnhancedToggleButton>
                  </Tooltip>
                  <Tooltip title={getIntervalTooltip('ALL')} arrow placement="top">
                    <EnhancedToggleButton
                      sx={{ minWidth: '34px', p: 0.5, height: '28px', borderRadius: 1 }}
                      value="ALL"
                    >
                      <Typography variant="caption" fontWeight={600} fontSize="0.7rem">
                        ALL
                      </Typography>
                    </EnhancedToggleButton>
                  </Tooltip>
                </ToggleButtonGroup>
              </Paper>
            </Box>
          )}
        </Grid>
      </Grid>

      <ChartContainer>
        {isLoading ? (
          <Box sx={{ height: isMobile ? '360px' : '450px', p: isMobile ? 0.25 : 0.5 }}>
            <Fade in={isLoading}>
              <Box>
                <LoadingSkeleton sx={{ height: isMobile ? '30px' : '40px', mb: isMobile ? 1 : 1.5 }} />
                <LoadingSkeleton sx={{ height: isMobile ? '200px' : '240px', mb: isMobile ? 1 : 1.5 }} />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <LoadingSkeleton sx={{ height: isMobile ? '24px' : '30px', flex: 1 }} />
                  <LoadingSkeleton sx={{ height: isMobile ? '24px' : '30px', flex: 1 }} />
                  <LoadingSkeleton sx={{ height: isMobile ? '24px' : '30px', flex: 1 }} />
                </Box>
              </Box>
            </Fade>
          </Box>
        ) : (
          <>
            {chartType === 0 ? (
              data?.length > 0 ? (
                <Fade in={!isLoading}>
                  <Stack>
                    <HighchartsReact
                      highcharts={Highcharts}
                      options={options1}
                      allowChartUpdate={true}
                      updateArgs={[true, true, true]}
                      constructorType={'chart'}
                      key={`line-chart-${range}-${activeFiatCurrency}`}
                    />
                  </Stack>
                </Fade>
              ) : (
                <Box
                  sx={{
                    height: isMobile ? '360px' : '450px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: isMobile ? 1 : 1.5
                  }}
                >
                  <Box
                    sx={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      bgcolor: alpha(theme.palette.warning.main, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <ShowChartIcon sx={{ fontSize: '24px', color: theme.palette.warning.main }} />
                  </Box>
                  <Typography variant="subtitle1" color="text.secondary" fontWeight={600}>
                    No data available
                  </Typography>
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    No price data found for the selected time range.
                    <br />
                    Try selecting a different time period.
                  </Typography>
                </Box>
              )
            ) : chartType === 1 ? (
              dataOHLC?.length > 0 ? (
              <Fade in={!isLoading}>
                <Stack>
                  <HighchartsReact
                    highcharts={Highcharts}
                    options={options2}
                    allowChartUpdate={true}
                    updateArgs={[true, true, true]}
                    immutable={false}
                    constructorType={'chart'}
                    key={`candlestick-chart-${range}-${activeFiatCurrency}-${dataOHLC?.length || 0}`}
                  />
                </Stack>
              </Fade>
            ) : (
              <Box
                sx={{
                  height: isMobile ? '280px' : '350px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: isMobile ? 1 : 1.5
                }}
              >
                <Box
                  sx={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <CandlestickChartIcon
                    sx={{ fontSize: '24px', color: theme.palette.warning.main }}
                  />
                </Box>
                <Typography variant="subtitle1" color="text.secondary" fontWeight={600}>
                  No data available
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  No candlestick data found for the selected time range.
                  <br />
                  Try selecting a different time period.
                </Typography>
              </Box>
            )
            ) : (
              // chartType === 2 - RichListChart
              <Fade in={!isLoading}>
                <Box sx={{ p: 0 }}>
                  <RichListChart token={token} />
                </Box>
              </Fade>
            )}
          </>
        )}
      </ChartContainer>
    </>
  );
}

export default PriceChart;
