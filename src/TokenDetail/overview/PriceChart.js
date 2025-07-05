import axios from 'axios';
import { useState, useEffect, useContext, useMemo, useCallback, useRef } from 'react';
import csvDownload from 'json-to-csv-export';
import createMedianFilter from 'moving-median';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import CandlestickChartIcon from '@mui/icons-material/CandlestickChart';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';

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
  Tooltip
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
    margin: theme.spacing(0.25),
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
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: `linear-gradient(90deg, transparent, ${alpha(
      theme.palette.primary.main,
      0.1
    )}, transparent)`,
    transition: 'left 0.6s'
  },
  '&:hover::before': {
    left: '100%'
  },
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
  },
  '&.Mui-selected': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    color: theme.palette.primary.main,
    fontWeight: 600,
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.15)
    }
  }
}));

const ChartContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius * 2,
  overflow: 'hidden',
  background:
    theme.palette.mode === 'dark'
      ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(
          theme.palette.background.default,
          0.9
        )} 100%)`
      : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(
          '#f8fafc',
          0.8
        )} 100%)`,
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow:
    theme.palette.mode === 'dark'
      ? `0 8px 32px ${alpha('#000', 0.3)}`
      : `0 8px 32px ${alpha('#000', 0.08)}`,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '1px',
    background: `linear-gradient(90deg, transparent, ${alpha(
      theme.palette.primary.main,
      0.3
    )}, transparent)`
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

  const [data, setData] = useState([]);
  const [dataOHLC, setDataOHLC] = useState([]);
  const [chartType, setChartType] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [range, setRange] = useState('12h');
  const [lastPrice, setLastPrice] = useState(null);
  const [priceChange, setPriceChange] = useState(0);
  const [volumeChange, setVolumeChange] = useState(0);

  const [minTime, setMinTime] = useState(0);
  const [maxTime, setMaxTime] = useState(0);

  const { accountProfile, activeFiatCurrency, darkMode } = useContext(AppContext);
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

    console.log(`Outlier detection: ${data.length} -> ${filteredData.length} data points`);
    if (filteredData.length < data.length) {
      console.log(`Filtered out ${data.length - filteredData.length} outliers`);
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

    console.log(`OHLC outlier detection: ${data.length} -> ${filteredData.length} data points`);
    if (filteredData.length < data.length) {
      console.log(`Filtered out ${data.length - filteredData.length} OHLC outliers`);
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
        if (ohlcRes.status === 200 && ohlcRes.data?.history?.length > 0) {
          const items = ohlcRes.data.history;

          // 7D and 1M specific validation: ensure OHLC data integrity
          let validatedItems = items;
          if (range === '7D' || range === '1M') {
            validatedItems = items.filter(
              (item) =>
                item &&
                item.length === 5 &&
                typeof item[0] === 'number' && // timestamp
                typeof item[1] === 'number' && // open
                typeof item[2] === 'number' && // high
                typeof item[3] === 'number' && // low
                typeof item[4] === 'number' // close
            );
          }

          // Apply OHLC outlier detection to all ranges
          const filteredOHLCItems = detectAndFilterOHLCOutliers(validatedItems);
          setDataOHLC(filteredOHLCItems);
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

  // Real-time price update effect
  useEffect(() => {
    if (!token || token.exch === undefined) return;

    const newPrice = Number(token.exch);
    if (isNaN(newPrice) || newPrice <= 0) return;

    const now = Date.now();

    setLastPrice((prevLastPrice) => {
      const change = newPrice - (prevLastPrice || newPrice);
      setPriceChange(change);
      return newPrice;
    });

    if (range === '12h' || range === '1D') {
      // Update line chart data
      setData((prevData) => {
        const newDataPoint = [now, newPrice, token.vol24h || 0]; // Assuming volume from token or 0
        const updatedData = [...prevData, newDataPoint];
        // Keep only the last 500 points for 12h and 1440 for 1D to prevent endless growth
        const maxPoints = range === '12h' ? 500 : 1440;
        return updatedData.slice(-maxPoints);
      });

      // Update OHLC chart data (update last candlestick's close price, or add new one)
      setDataOHLC((prevOHLCData) => {
        const lastOHLC = prevOHLCData[prevOHLCData.length - 1];
        if (lastOHLC && now - lastOHLC[0] < (range === '12h' ? 5000 : 60000)) {
          // 5 sec for 12h, 1 min for 1D
          // Update the last candlestick's close price, and adjust high/low if needed
          const updatedLastOHLC = [
            lastOHLC[0],
            lastOHLC[1],
            Math.max(lastOHLC[2], newPrice),
            Math.min(lastOHLC[3], newPrice),
            newPrice
          ];
          return [...prevOHLCData.slice(0, -1), updatedLastOHLC];
        } else {
          // Add a new candlestick (open, high, low, close all as newPrice initially)
          const newOHLCPoint = [now, newPrice, newPrice, newPrice, newPrice];
          const updatedOHLCData = [...prevOHLCData, newOHLCPoint];
          const maxPoints = range === '12h' ? 500 : 1440;
          return updatedOHLCData.slice(-maxPoints);
        }
      });
    }
  }, [token.exch, range]);

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

  // Optimize mediumValue calculation with useMemo
  const mediumValue = useMemo(() => {
    if (chartType === 0 && data?.length > 0) {
      const prices = data.map((point) => point[1]);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      return (min + max) / 2;
    } else if (chartType === 1 && dataOHLC?.length > 0) {
      const closes = dataOHLC.map((point) => point[4]);
      const min = Math.min(...closes);
      const max = Math.max(...closes);
      return (min + max) / 2;
    }
    return null;
  }, [chartType, data, dataOHLC]);

  const handleChange = useCallback((event, newRange) => {
    if (newRange) setRange(newRange);
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

  const toggleStreaming = useCallback(() => {
    // WebSocket removed
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
        item.length === 5 &&
        typeof item[0] === 'number' &&
        typeof item[1] === 'number' &&
        typeof item[2] === 'number' &&
        typeof item[3] === 'number' &&
        typeof item[4] === 'number'
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
        height: '350px',
        events: {
          render: function () {
            const chart = this;
            const imgUrl = darkMode
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
                opacity: 0.4,
                width: '100px'
              })
              .add();
          }
        },
        zoomType: 'xy',
        marginBottom: 40,
        animation: {
          duration: 1200,
          easing: 'easeOutCubic'
        },
        style: {
          fontFamily: theme.typography.fontFamily
        },
        // High-frequency trading optimizations
        turboThreshold: 10000,
        boostThreshold: 1000,
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
        gridLineWidth: 1,
        gridLineColor: alpha(theme.palette.divider, 0.1)
      },
      yAxis: [
        {
          title: {
            text: null
          },
          tickAmount: 6,
          tickWidth: 1,
          gridLineColor: alpha(theme.palette.divider, 0.1),
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
          height: '60%',
          plotLines: [
            {
              width: 1,
              value: mediumValue,
              dashStyle: 'Dash',
              color: alpha(theme.palette.warning.main, 0.7),
              zIndex: 1
            }
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
            enabled: false
          },
          type: 'logarithmic',
          top: '60%',
          height: '40%',
          offset: 0,
          lineWidth: 0,
          gridLineWidth: 0,
          gridLineColor: alpha(theme.palette.divider, 0.1)
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
          borderRadius: 2,
          animation: {
            duration: 1000
          }
        }
      },
      series: [
        {
          name: 'Price',
          data: data?.length > 0 ? data.map(([timestamp, price]) => [timestamp, price]) : [],
          threshold: mediumValue,
          lineWidth: 2.5,
          animation: {
            duration: 1500,
            easing: 'easeOutCubic'
          }
        },
        {
          type: 'column',
          name: 'Volume',
          data:
            data?.length > 0
              ? data.map(([timestamp, price, volume], i) => {
                  let color;
                  if (i > 0) {
                    const prevPrice = data[i - 1][1];
                    if (price > prevPrice) {
                      color = alpha(theme.palette.success.main, 0.6); // Price up
                    } else if (price < prevPrice) {
                      color = alpha(theme.palette.error.main, 0.6); // Price down
                    } else {
                      color = alpha(theme.palette.grey[500], 0.4); // No change
                    }
                  } else {
                    color = alpha(theme.palette.grey[500], 0.4); // First bar
                  }
                  return {
                    x: timestamp,
                    y: volume,
                    color
                  };
                })
              : [],
          yAxis: 1,
          showInLegend: false,
          borderWidth: 0
        }
      ],
      tooltip: {
        enabled: true,
        backgroundColor: darkMode
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
                }
              ]
            }
          }
        ]
      }
    }),
    [data, mediumValue, theme, darkMode, range, user, name]
  );

  const options2 = useMemo(
    () => ({
      plotOptions: {
        candlestick: {
          color: theme.palette.error.main,
          lineColor: theme.palette.error.main,
          upColor: theme.palette.success.main,
          upLineColor: theme.palette.success.main,
          lineWidth: 1.5,
          states: {
            hover: {
              lineWidth: 2.5,
              brightness: 0.1
            }
          }
        }
      },
      rangeSelector: {
        enabled: false
      },
      title: {
        text: null
      },
      chart: {
        backgroundColor: 'transparent',
        height: '350px',
        events: {
          render: function () {
            const chart = this;
            const imgUrl = darkMode
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
                opacity: 0.4,
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
        // High-frequency trading optimizations
        turboThreshold: 10000,
        boostThreshold: 1000,
        plotBorderWidth: 0,
        reflow: true,
        zoomType: 'xy'
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
        gridLineWidth: 1,
        gridLineColor: alpha(theme.palette.divider, 0.1)
      },
      yAxis: {
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
        gridLineColor: alpha(theme.palette.divider, 0.1),
        plotLines: mediumValue
          ? [
              {
                width: 1,
                value: mediumValue,
                dashStyle: 'Dash',
                color: alpha(theme.palette.warning.main, 0.7)
              }
            ]
          : []
      },
      series: [
        {
          type: 'candlestick',
          name: `${user} ${name}`,
          data: dataOHLC,
          animation: {
            duration: 1200,
            easing: 'easeOutCubic'
          }
        }
      ],
      tooltip: {
        enabled: true,
        backgroundColor: darkMode
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
              yAxis: {
                labels: {
                  align: 'right',
                  x: -5,
                  y: 0
                }
              }
            }
          }
        ]
      }
    }),
    [dataOHLC, mediumValue, theme, darkMode, range, user, name]
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
      <Grid container rowSpacing={1} alignItems="center" sx={{ mt: 0, mb: 1.5 }}>
        <Grid container item xs={12} alignItems="center" justifyContent="space-between">
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  background:
                    theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.6) 100%)'
                      : 'linear-gradient(135deg, #000 0%, rgba(0,0,0,0.9) 50%, rgba(0,0,0,0.7) 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow:
                    theme.palette.mode === 'dark'
                      ? '0px 2px 8px rgba(255,255,255,0.1)'
                      : '0px 2px 8px rgba(0,0,0,0.1)',
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
                <Box
                  component="span"
                  sx={{
                    color: theme.palette.primary.main,
                    fontWeight: 700,
                    mx: 0.5
                  }}
                >
                  {currencySymbols[activeFiatCurrency]}
                </Box>
                {activeFiatCurrency}
              </Typography>

              <Chip
                size="small"
                label={range}
                sx={{
                  bgcolor: alpha(getRangeColor(range), 0.1),
                  color: getRangeColor(range),
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: '20px',
                  '& .MuiChip-label': {
                    px: 0.75
                  }
                }}
                icon={
                  <Box
                    sx={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      bgcolor: getRangeColor(range),
                      boxShadow: `0 0 8px ${alpha(getRangeColor(range), 0.5)}`
                    }}
                  />
                }
              />

              {/* Price change indicator */}
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
                    '& .MuiChip-label': {
                      px: 0.75
                    }
                  }}
                />
              )}
            </Box>

            {isAdmin && range !== 'OHLC' && (
              <IconButton
                size="small"
                onClick={handleDownloadCSV}
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
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
                  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
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
                </StyledToggleButtonGroup>
              </Paper>
            </Box>
          </Box>

          <Box>
            <Paper
              elevation={0}
              sx={{
                display: 'flex',
                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                borderRadius: 1.5,
                background: alpha(theme.palette.background.paper, 0.8),
                backdropFilter: 'blur(10px)',
                flexWrap: 'wrap',
                p: 0.2,
                boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.08)}`
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
        </Grid>
      </Grid>

      <ChartContainer>
        {isLoading ? (
          <Box sx={{ height: '350px', p: 2 }}>
            <Fade in={isLoading}>
              <Box>
                <LoadingSkeleton sx={{ height: '40px', mb: 1.5 }} />
                <LoadingSkeleton sx={{ height: '240px', mb: 1.5 }} />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <LoadingSkeleton sx={{ height: '30px', flex: 1 }} />
                  <LoadingSkeleton sx={{ height: '30px', flex: 1 }} />
                  <LoadingSkeleton sx={{ height: '30px', flex: 1 }} />
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
                      constructorType={'chart'}
                      key={`line-chart-${range}-${activeFiatCurrency}`}
                    />
                  </Stack>
                </Fade>
              ) : (
                <Box
                  sx={{
                    height: '350px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1.5
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
            ) : dataOHLC?.length > 0 ? (
              <Fade in={!isLoading}>
                <Stack>
                  <HighchartsReact
                    highcharts={Highcharts}
                    options={options2}
                    allowChartUpdate={true}
                    constructorType={'chart'}
                    key={`candlestick-chart-${range}-${activeFiatCurrency}`}
                  />
                </Stack>
              </Fade>
            ) : (
              <Box
                sx={{
                  height: '350px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1.5
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
            )}
          </>
        )}
      </ChartContainer>
    </>
  );
}

export default PriceChart;
