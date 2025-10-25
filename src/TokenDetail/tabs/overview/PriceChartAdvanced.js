import { useState, useEffect, useRef, memo, useContext, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Box from '@mui/material/Box';
import ButtonGroup from '@mui/material/ButtonGroup';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import { alpha } from '@mui/material/styles';
import Divider from '@mui/material/Divider';
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  AreaSeries
} from 'lightweight-charts';
import axios from 'axios';
import { AppContext } from 'src/AppContext';
// Constants
const currencySymbols = {
  USD: '$ ',
  EUR: '€ ',
  JPY: '¥ ',
  CNH: '¥ ',
  XRP: '✕ '
};
import { throttle } from 'src/utils/formatters';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import CandlestickChartIcon from '@mui/icons-material/CandlestickChart';
import RefreshIcon from '@mui/icons-material/Refresh';
import GroupIcon from '@mui/icons-material/Group';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';

const PriceChartAdvanced = memo(({ token }) => {
  const theme = useTheme();
  const { activeFiatCurrency, accountProfile } = useContext(AppContext);
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const lineSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const lastChartTypeRef = useRef(null);
  const isMobile = theme.breakpoints.values.sm > window.innerWidth;
  const isTablet = theme.breakpoints.values.md > window.innerWidth;

  // Performance: Reduce data points for mobile/tablet
  const maxDataPoints = useMemo(() => {
    if (isMobile) return 100;
    if (isTablet) return 200;
    return 500;
  }, [isMobile, isTablet]);

  const [chartType, setChartType] = useState('candles');
  const [range, setRange] = useState('1D');
  const [chartInterval, setChartInterval] = useState('5m'); // New: interval parameter (renamed to avoid conflict)
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [indicators, setIndicators] = useState([]);
  const indicatorSeriesRef = useRef({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [athData, setAthData] = useState({ price: null, percentDown: null });
  const [rsiValues, setRsiValues] = useState({});
  const rsiValuesRef = useRef({});
  const [showRSI, setShowRSI] = useState(false);
  const showRSIRef = useRef(false);
  const [holderData, setHolderData] = useState(null);
  const [userTrades, setUserTrades] = useState([]);
  const [isUserZoomed, setIsUserZoomed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chartKey, setChartKey] = useState(0);
  const zoomStateRef = useRef(null);
  const isUserZoomedRef = useRef(false);
  const crosshairPositionRef = useRef(null);
  const dataRef = useRef(null);
  const holderDataRef = useRef(null);
  const activeFiatCurrencyRef = useRef(activeFiatCurrency);
  const chartCreatedRef = useRef(false);
  const scaleFactorRef = useRef(1);

  const BASE_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
  const isDark = theme.palette.mode === 'dark';

  const chartTypeIcons = {
    candles: <CandlestickChartIcon fontSize="small" />,
    line: <ShowChartIcon fontSize="small" />,
    holders: <GroupIcon fontSize="small" />
  };

  const indicatorOptions = [
    { id: 'sma20', name: 'SMA 20', period: 20 },
    { id: 'sma50', name: 'SMA 50', period: 50 },
    { id: 'ema20', name: 'EMA 20', period: 20 },
    { id: 'ema50', name: 'EMA 50', period: 50 },
    { id: 'bb', name: 'Bollinger Bands', period: 20 },
    { id: 'rsi', name: 'RSI (14)', period: 14 },
    { id: 'fib', name: 'Fibonacci Extensions' },
    { id: 'ath', name: 'All-Time High' }
  ];

  // Update refs when values change
  useEffect(() => {
    activeFiatCurrencyRef.current = activeFiatCurrency;
  }, [activeFiatCurrency]);

  useEffect(() => {
    isUserZoomedRef.current = isUserZoomed;
  }, [isUserZoomed]);


  // Fetch price data
  useEffect(() => {
    if (!token?.md5) {
      return;
    }

    let mounted = true;
    let currentRequest = null;
    let isRequestInProgress = false;

    // Move helper functions inside to avoid dependency issues
    const convertScientific = (value) => {
      if (typeof value === 'string') {
        value = parseFloat(value);
      }
      if (typeof value !== 'number' || isNaN(value)) {
        return 0;
      }
      if (Math.abs(value) < 1e-10) {
        return 0;
      }
      const isScientific = value.toString().includes('e');
      if (isScientific) {
        const [base, exponent] = value.toString().split('e');
        const exp = parseInt(exponent);
        if (exp < -10) {
          const precision = Math.min(Math.abs(exp) + 2, 20);
          return parseFloat(value.toFixed(precision));
        }
      }
      return value;
    };

    const calcRSI = (data, period = 14) => {
      if (data.length < period + 1) return [];
      const rsi = [];
      let avgGain = 0;
      let avgLoss = 0;
      for (let i = 1; i <= period; i++) {
        const change = data[i].close - data[i - 1].close;
        if (change >= 0) {
          avgGain += change;
        } else {
          avgLoss += Math.abs(change);
        }
      }
      avgGain /= period;
      avgLoss /= period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi.push({
        time: data[period].time,
        value: avgLoss === 0 ? 100 : 100 - 100 / (1 + rs)
      });
      for (let i = period + 1; i < data.length; i++) {
        const change = data[i].close - data[i - 1].close;
        const gain = change >= 0 ? change : 0;
        const loss = change < 0 ? Math.abs(change) : 0;
        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsi.push({
          time: data[i].time,
          value: avgLoss === 0 ? 100 : 100 - 100 / (1 + rs)
        });
      }
      return rsi;
    };

    const fetchData = async (isUpdate = false) => {
      // Skip if unmounted or request already in progress
      if (!mounted || isRequestInProgress) {
        return;
      }

      // Simple validation - only block extremely dangerous combinations
      const maxCandles = {
        '1D': { '1m': 1440, '5m': 288, '15m': 96, '30m': 48, '1h': 24 },
        '5D': { '5m': 1440, '15m': 480, '30m': 240, '1h': 120, '4h': 30 },
        '1M': { '15m': 2880, '30m': 1440, '1h': 720, '4h': 180, '1d': 30 },
        '3M': { '30m': 4320, '1h': 2160, '4h': 540, '1d': 90 },
        '1Y': { '1h': 8760, '4h': 2190, '1d': 365 },
        '5Y': { '4h': 10950, '1d': 1825 },
        'ALL': { '1d': 10000 }
      };

      const estimatedCandles = maxCandles[range]?.[chartInterval];

      // Only warn if invalid, but still allow the request (backend will validate)
      if (!estimatedCandles) {
        console.warn(`Potentially invalid combination: ${range} @ ${chartInterval}, allowing anyway`);
      } else if (estimatedCandles > 10000) {
        console.error(`Too many candles: ${estimatedCandles} for ${range} @ ${chartInterval}, blocking request`);
        if (mounted) {
          setLoading(false);
          setIsUpdating(false);
        }
        isRequestInProgress = false;
        return;
      }

      // Cancel any ongoing request only if it exists
      if (currentRequest && !currentRequest.signal.aborted) {
        currentRequest.abort();
      }

      // Create new controller for this specific request
      const requestController = new AbortController();
      currentRequest = requestController;
      isRequestInProgress = true;

      try {
        if (mounted) {
          if (isUpdate) {
            setIsUpdating(true);
          } else {
            setLoading(true);
          }
        }
        const apiRange = range;
        const endpoint = `${BASE_URL}/graph-ohlc-v2/${token.md5}?range=${apiRange}&interval=${chartInterval}&vs_currency=${activeFiatCurrency}`;

        console.log('Fetching chart data:', { range: apiRange, interval: chartInterval, endpoint });
        const response = await axios.get(endpoint, { signal: requestController.signal });
        console.log('Chart response:', { length: response.data?.ohlc?.length, data: response.data });

        if (mounted && response.data?.ohlc && response.data.ohlc.length > 0) {
          const processedData = response.data.ohlc
            .map((candle) => ({
              time: Math.floor(candle[0] / 1000), // Convert ms to seconds
              open: convertScientific(candle[1]),
              high: convertScientific(candle[2]),
              low: convertScientific(candle[3]),
              close: convertScientific(candle[4]),
              value: convertScientific(candle[4]),
              volume: convertScientific(candle[5]) || 0
            }))
            .sort((a, b) => a.time - b.time); // Ensure chronological order

          setData(processedData);
          dataRef.current = processedData;
          setLastUpdate(new Date());

          // Calculate ATH from the data
          const allTimeHigh = Math.max(...processedData.map((d) => d.high));
          const currentPrice = processedData[processedData.length - 1].close;
          const percentFromATH = (((currentPrice - allTimeHigh) / allTimeHigh) * 100).toFixed(2);

          setAthData({
            price: allTimeHigh,
            percentDown: percentFromATH
          });

          // Calculate RSI values for tooltip display
          const rsiData = calcRSI(processedData, 14);
          const rsiMap = {};
          rsiData.forEach((r) => {
            rsiMap[r.time] = r.value;
          });
          if (mounted) {
            setRsiValues(rsiMap);
            rsiValuesRef.current = rsiMap;
          }

          if (mounted) {
            setLoading(false);
            setIsUpdating(false);
          }
        } else {
          if (mounted) {
            setLoading(false);
            setIsUpdating(false);
          }
        }
      } catch (error) {
        if (!axios.isCancel(error) && error.code !== 'ERR_CANCELED' && error.name !== 'AbortError') {
          console.error('Chart fetch error:', error.message);
        }
        if (mounted) {
          setLoading(false);
          setIsUpdating(false);
        }
      } finally {
        isRequestInProgress = false;
      }
    };

    fetchData();

    // Sync with ledger updates every 4 seconds - but only if user is not zoomed
    const updateInterval = setInterval(() => {
      if (!isUserZoomedRef.current && mounted) {
        fetchData(true);
      }
    }, 4000);

    return () => {
      mounted = false;
      if (currentRequest) {
        currentRequest.abort();
      }
      clearInterval(updateInterval);
    };
  }, [token.md5, range, chartInterval, BASE_URL, activeFiatCurrency]);

  // Fetch holder data
  useEffect(() => {
    if (!token?.md5 || chartType !== 'holders') return;

    let mounted = true;
    const controller = new AbortController();

    const fetchHolderData = async () => {
      try {
        if (mounted) {
          setLoading(true);
        }
        const endpoint = `${BASE_URL}/graphrich/${token.md5}?range=${range}`;

        const response = await axios.get(endpoint, { signal: controller.signal });

        if (mounted && response.data?.history && response.data.history.length > 0) {
          const processedData = response.data.history
            .map((item) => ({
              time: Math.floor(item.time / 1000),
              value: item.length || 0,
              holders: item.length || 0,
              top10: item.top10 || 0,
              top20: item.top20 || 0,
              top50: item.top50 || 0,
              top100: item.top100 || 0,
              active24H: item.active24H || 0
            }))
            .sort((a, b) => a.time - b.time)
            .filter((item, index, array) => {
              return index === array.length - 1 || item.time !== array[index + 1].time;
            });

          if (mounted) {
            setHolderData(processedData);
            holderDataRef.current = processedData;
            setLoading(false);
          }
        }
      } catch (error) {
        if (!axios.isCancel(error) && error.code !== 'ERR_CANCELED' && error.name !== 'AbortError') {
          console.error('Holder data error:', error);
        }
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchHolderData();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [token.md5, range, BASE_URL, chartType]);

  // Create chart only when chart type changes AND relevant data is available - optimized
  useEffect(() => {
    // Determine which dataset is relevant for current chart type
    const hasChartData =
      chartType === 'holders' ? holderData && holderData.length > 0 : data && data.length > 0;

    // Wait for container and the relevant data to be available
    if (!chartContainerRef.current || loading || !hasChartData) {
      return;
    }

    // Only create chart once per chart type, prevent flickering
    if (chartCreatedRef.current && lastChartTypeRef.current === chartType) {
      return;
    }

    // Clean up existing chart when chart type changes
    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch (e) {
        // Error removing chart
      }
      chartRef.current = null;
      candleSeriesRef.current = null;
      lineSeriesRef.current = null;
      volumeSeriesRef.current = null;
      chartCreatedRef.current = false;
    }

    lastChartTypeRef.current = chartType;

    // Create new chart with current container dimensions
    const containerHeight = chartContainerRef.current.clientHeight || (isMobile ? 380 : 550);
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: containerHeight,
      layout: {
        background: {
          type: 'solid',
          color: theme.chart?.background || 'transparent'
        },
        textColor: theme.palette.text.primary,
        fontSize: 13,
        fontFamily: "'Segoe UI', Roboto, Arial, sans-serif"
      },
      grid: {
        vertLines: {
          color:
            theme.chart?.gridColor || (isDark ? 'rgba(56, 56, 56, 0.25)' : 'rgba(240, 240, 240, 0.8)'),
          style: 1
        },
        horzLines: {
          color:
            theme.chart?.gridColor || (isDark ? 'rgba(56, 56, 56, 0.4)' : 'rgba(240, 240, 240, 1)'),
          style: 0
        }
      },
      crosshair: {
        mode: 0,
        vertLine: {
          color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)',
          width: 1,
          style: 3,
          labelBackgroundColor: theme.palette.primary.main
        },
        horzLine: {
          color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)',
          width: 1,
          style: 3,
          labelBackgroundColor: theme.palette.primary.main
        }
      },
      rightPriceScale: {
        borderColor:
          theme.chart?.borderColor || (isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'),
        scaleMargins: {
          top: 0.05,
          bottom: 0.2
        },
        mode: 0,
        autoScale: true,
        borderVisible: false,
        visible: true,
        entireTextOnly: false, // Show full precision even on mobile
        drawTicks: true,
        ticksVisible: true,
        alignLabels: true,
        textColor: isDark ? '#ffffff' : '#000000'
      },
      localization: {
        priceFormatter: (price) => {
          if (chartType === 'holders') {
            if (price < 1000) {
              return Math.round(price).toString();
            } else if (price < 1000000) {
              return (price / 1000).toFixed(1) + 'K';
            } else {
              return (price / 1000000).toFixed(1) + 'M';
            }
          }

          // Scale the price back down to original value
          const actualPrice = price / scaleFactorRef.current;
          const symbol = currencySymbols[activeFiatCurrencyRef.current] || '';
          const isXRP = activeFiatCurrencyRef.current === 'XRP';

          // XRP uses different precision rules - simpler display
          if (isXRP) {
            if (actualPrice < 0.000001) {
              return symbol + actualPrice.toFixed(8);
            } else if (actualPrice < 0.001) {
              return symbol + actualPrice.toFixed(6);
            } else if (actualPrice < 1) {
              return symbol + actualPrice.toFixed(4);
            } else if (actualPrice < 100) {
              return symbol + actualPrice.toFixed(3);
            } else if (actualPrice < 1000) {
              return symbol + actualPrice.toFixed(2);
            } else {
              return symbol + actualPrice.toFixed(1);
            }
          }

          // USD/EUR/other fiat formatting with compact notation for very small values
          if (actualPrice < 0.001) {
            const str = actualPrice.toFixed(20);
            const zeros = str.match(/0\.0*/)?.[0]?.length - 2 || 0;
            if (zeros >= 4) {
              const significant = str.replace(/^0\.0+/, '').replace(/0+$/, '');
              return symbol + '0.0(' + zeros + ')' + significant.slice(0, 4);
            }
            return symbol + actualPrice.toFixed(8);
          } else if (actualPrice < 0.01) {
            return symbol + actualPrice.toFixed(6);
          } else if (actualPrice < 1) {
            return symbol + actualPrice.toFixed(4);
          } else if (actualPrice < 100) {
            return symbol + actualPrice.toFixed(3);
          } else if (actualPrice < 1000) {
            return symbol + actualPrice.toFixed(2);
          } else if (actualPrice < 10000) {
            return symbol + actualPrice.toFixed(1);
          } else {
            return symbol + Math.round(actualPrice).toLocaleString();
          }
        }
      },
      timeScale: {
        borderColor:
          theme.chart?.borderColor || (isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'),
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        barSpacing: 12,
        minBarSpacing: 2,
        fixLeftEdge: true,
        fixRightEdge: true
      }
    });

    chartRef.current = chart;
    chartCreatedRef.current = true;

    // Add zoom/scroll detection with debouncing
    let zoomCheckTimeout;
    chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (range && dataRef.current && dataRef.current.length > 0) {
        clearTimeout(zoomCheckTimeout);
        zoomCheckTimeout = setTimeout(() => {
          // Determine if user has scrolled away from the most recent bars.
          // Only this condition will pause auto-updates to avoid false positives.
          const dataLength = dataRef.current.length;
          const isScrolledAway = range.to < dataLength - 2; // not showing last ~2 bars

          const shouldPauseUpdates = isScrolledAway;

          if (shouldPauseUpdates !== isUserZoomedRef.current) {
            setIsUserZoomed(shouldPauseUpdates);
            isUserZoomedRef.current = shouldPauseUpdates;
          }
        }, 100); // Debounce for 100ms
      }
    });

    // Create tooltip
    const toolTip = document.createElement('div');
    toolTip.style = `width: 140px; height: auto; position: absolute; display: none; padding: 8px; box-sizing: border-box; font-size: 12px; text-align: left; z-index: 1000; top: 12px; left: 12px; pointer-events: none; border-radius: 6px; font-family: inherit; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; background: ${isDark ? 'rgba(20, 20, 20, 0.98)' : 'rgba(255, 255, 255, 0.98)'}; color: ${theme.palette.text.primary}; border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}; box-shadow: none`;
    chartContainerRef.current.appendChild(toolTip);

    chart.subscribeCrosshairMove((param) => {
      if (
        !param.time ||
        param.point.x < 0 ||
        param.point.x > chartContainerRef.current.clientWidth ||
        param.point.y < 0 ||
        param.point.y > chartContainerRef.current.clientHeight
      ) {
        toolTip.style.display = 'none';
        crosshairPositionRef.current = null;
        return;
      }

      // Save the crosshair position
      crosshairPositionRef.current = { time: param.time, point: param.point };

      const dateStr = new Date(param.time * 1000).toLocaleDateString();
      const rawTimestamp = param.time;
      toolTip.style.display = 'block';

      let ohlcData = '';
      const symbol = currencySymbols[activeFiatCurrencyRef.current] || '';
      // Get data from correct source based on chart type using refs
      const currentData = chartType === 'holders' ? holderDataRef.current : dataRef.current;
      const candle = currentData ? currentData.find((d) => d.time === param.time) : null;

      if (candle) {
        const formatPrice = (p) => {
          // The candle data is original unscaled data, so don't scale back
          const actualPrice = p;
          const isXRP = activeFiatCurrencyRef.current === 'XRP';

          // Check if price has many leading zeros and use compact notation
          if (actualPrice && actualPrice < 0.001) {
            const str = actualPrice.toFixed(20);
            const zeros = str.match(/0\.0*/)?.[0]?.length - 2 || 0;
            if (zeros >= 3) {
              // Use compact notation for 3+ zeros for XRP, 4+ for others
              const significant = str.replace(/^0\.0+/, '').replace(/0+$/, '');
              const sigDigits = isXRP ? 6 : 4; // More precision for XRP pairs
              return '0.0(' + zeros + ')' + significant.slice(0, sigDigits);
            }
          }

          // Regular formatting with enhanced precision for XRP
          if (actualPrice < 0.00001) return actualPrice.toFixed(isXRP ? 10 : 8);
          if (actualPrice < 0.001) return actualPrice.toFixed(isXRP ? 8 : 6);
          if (actualPrice < 0.01) return actualPrice.toFixed(isXRP ? 8 : 6);
          if (actualPrice < 1) return actualPrice.toFixed(isXRP ? 6 : 4);
          if (actualPrice < 100) return actualPrice.toFixed(3);
          if (actualPrice < 1000) return actualPrice.toFixed(2);
          return actualPrice.toLocaleString();
        };

        if (chartType === 'candles') {
          const change = (((candle.close - candle.open) / candle.open) * 100).toFixed(2);
          const changeColor =
            candle.close >= candle.open
              ? isDark
                ? '#00E676'
                : '#4CAF50'
              : isDark
                ? '#FF5252'
                : '#F44336';

          ohlcData = `
            <div style="font-weight: 400; margin-bottom: 4px">${dateStr}</div>
            <div style="font-size: 10px; color: #888; margin-bottom: 4px">TS: ${rawTimestamp}</div>
            <div style="display: flex; justify-content: space-between"><span>O:</span><span>${symbol}${formatPrice(candle.open)}</span></div>
            <div style="display: flex; justify-content: space-between"><span>H:</span><span>${symbol}${formatPrice(candle.high)}</span></div>
            <div style="display: flex; justify-content: space-between"><span>L:</span><span>${symbol}${formatPrice(candle.low)}</span></div>
            <div style="display: flex; justify-content: space-between; color: ${changeColor}"><span>C:</span><span>${symbol}${formatPrice(candle.close)}</span></div>
            <div style="display: flex; justify-content: space-between; margin-top: 4px; padding-top: 4px; border-top: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}">
              <span>Vol:</span><span>${candle.volume.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; color: ${changeColor}">
              <span>Chg:</span><span>${change}%</span>
            </div>
            ${
              showRSIRef.current && rsiValuesRef.current[candle.time]
                ? `
              <div style=\"display: flex; justify-content: space-between; margin-top: 4px; padding-top: 4px; border-top: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}; color: ${rsiValuesRef.current[candle.time] > 70 ? '#FF5252' : rsiValuesRef.current[candle.time] < 30 ? '#00E676' : 'inherit'}\">
                <span>RSI:</span><span>${rsiValuesRef.current[candle.time].toFixed(2)}</span>
              </div>
            `
                : ''
            }
          `;
        } else if (chartType === 'line') {
          ohlcData = `
            <div style="font-weight: 400; margin-bottom: 4px">${dateStr}</div>
            <div style="font-size: 10px; color: #888; margin-bottom: 4px">TS: ${rawTimestamp}</div>
            <div style="display: flex; justify-content: space-between"><span>Price:</span><span>${symbol}${formatPrice(candle.close || candle.value)}</span></div>
            <div style="display: flex; justify-content: space-between"><span>Vol:</span><span>${(candle.volume || 0).toLocaleString()}</span></div>
            ${
              showRSIRef.current && rsiValuesRef.current[candle.time]
                ? `
              <div style=\"display: flex; justify-content: space-between; margin-top: 4px; padding-top: 4px; border-top: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}; color: ${rsiValuesRef.current[candle.time] > 70 ? '#FF5252' : rsiValuesRef.current[candle.time] < 30 ? '#00E676' : 'inherit'}\">
                <span>RSI:</span><span>${rsiValuesRef.current[candle.time].toFixed(2)}</span>
              </div>
            `
                : ''
            }
          `;
        } else if (chartType === 'holders') {
          ohlcData = `
            <div style="font-weight: 400; margin-bottom: 4px">${dateStr}</div>
            <div style="font-size: 10px; color: #888; margin-bottom: 4px">TS: ${rawTimestamp}</div>
            <div style="display: flex; justify-content: space-between"><span>Holders:</span><span>${candle.holders ? candle.holders.toLocaleString() : candle.value.toLocaleString()}</span></div>
            ${
              candle.top10 !== undefined
                ? `
              <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}">
                <div style="display: flex; justify-content: space-between"><span>Top 10:</span><span>${candle.top10.toFixed(2)}%</span></div>
                <div style="display: flex; justify-content: space-between"><span>Top 20:</span><span>${candle.top20.toFixed(2)}%</span></div>
                <div style="display: flex; justify-content: space-between"><span>Top 50:</span><span>${candle.top50.toFixed(2)}%</span></div>
                <div style="display: flex; justify-content: space-between"><span>Top 100:</span><span>${candle.top100.toFixed(2)}%</span></div>
              </div>
            `
                : ''
            }
          `;
        }
      }

      if (ohlcData) {
        toolTip.innerHTML = ohlcData;
        const x = Math.max(
          0,
          Math.min(chartContainerRef.current.clientWidth - 150, param.point.x - 50)
        );
        const y = 12;
        toolTip.style.left = x + 'px';
        toolTip.style.top = y + 'px';
      }
    });

    // Add series based on chart type (they'll get data in the update effect)

    if (chartType === 'candles') {
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: isDark ? '#00E676' : '#4CAF50',
        downColor: isDark ? '#FF5252' : '#F44336',
        borderUpColor: isDark ? '#00E676' : '#4CAF50',
        borderDownColor: isDark ? '#FF5252' : '#F44336',
        wickUpColor: isDark ? '#00E676' : '#4CAF50',
        wickDownColor: isDark ? '#FF5252' : '#F44336',
        borderVisible: true,
        wickVisible: true
      });
      candleSeriesRef.current = candleSeries;
    } else if (chartType === 'line') {
      const areaSeries = chart.addSeries(AreaSeries, {
        lineColor: isDark ? '#2196F3' : theme.palette.primary.main,
        topColor: isDark ? 'rgba(33, 150, 243, 0.4)' : theme.palette.primary.main + '60',
        bottomColor: isDark ? 'rgba(33, 150, 243, 0.05)' : theme.palette.primary.main + '08',
        lineWidth: 2,
        lineStyle: 0,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        crosshairMarkerBorderColor: theme.palette.primary.main,
        crosshairMarkerBackgroundColor: theme.palette.background.paper
      });
      lineSeriesRef.current = areaSeries;
    } else if (chartType === 'holders') {
      const holdersSeries = chart.addSeries(AreaSeries, {
        lineColor: isDark ? '#E040FB' : '#9c27b0',
        topColor: isDark ? 'rgba(224, 64, 251, 0.3)' : 'rgba(156, 39, 176, 0.4)',
        bottomColor: isDark ? 'rgba(224, 64, 251, 0.05)' : 'rgba(156, 39, 176, 0.04)',
        lineWidth: 2,
        lineStyle: 0,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        crosshairMarkerBorderColor: '#9c27b0',
        crosshairMarkerBackgroundColor: theme.palette.background.paper
      });
      lineSeriesRef.current = holdersSeries;
    }

    // Add volume series for non-holder charts
    if (chartType !== 'holders') {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: isDark ? 'rgba(0, 230, 118, 0.6)' : 'rgba(76, 175, 80, 0.6)',
        priceFormat: {
          type: 'volume'
        },
        priceScaleId: 'volume',
        scaleMargins: {
          top: 0.75,
          bottom: 0
        },
        priceLineVisible: false,
        lastValueVisible: false
      });
      volumeSeriesRef.current = volumeSeries;

      // Configure volume scale separately
      chart.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0
        }
      });
    }

    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        const container = chartContainerRef.current;
        // Don't use isFullscreen here as it's in the dependency array
        const containerHeight = container.clientHeight || (isMobile ? 380 : 550);

        chart.applyOptions({
          width: container.clientWidth,
          height: containerHeight
        });

        // Also call resize method for better compatibility
        chart.resize(container.clientWidth, containerHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);

      // Clean up indicator series
      Object.values(indicatorSeriesRef.current).forEach((series) => {
        if (series && chartRef.current) {
          try {
            chartRef.current.removeSeries(series);
          } catch (e) {
            // Series already removed
          }
        }
      });
      indicatorSeriesRef.current = {};

      if (chartContainerRef.current) {
        const tooltips = chartContainerRef.current.querySelectorAll(
          'div[style*="position: absolute"]'
        );
        tooltips.forEach((tooltip) => tooltip.remove());
      }
      if (chartRef.current) {
        try {
          chartRef.current.remove();
        } catch (e) {
          // Chart already disposed
        }
        chartRef.current = null;
      }
    };
  }, [chartType, isDark, isMobile, data, holderData, theme]);

  // Handle fullscreen resize - recreate chart if needed
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const resizeOrRecreateChart = () => {
      const container = chartContainerRef.current;
      if (!container) return;

      const newHeight = isFullscreen ? window.innerHeight - 120 : isMobile ? 380 : 550;
      const rect = container.getBoundingClientRect();
      const newWidth = rect.width || container.clientWidth;


      // Try to resize first
      if (chartRef.current) {
        try {
          // Apply new size
          chartRef.current.resize(newWidth, newHeight);

          // Also update options
          chartRef.current.applyOptions({
            width: newWidth,
            height: newHeight
          });

          // Restore visible range
          const timeScale = chartRef.current.timeScale();
          if (zoomStateRef.current) {
            timeScale.setVisibleRange(zoomStateRef.current);
          } else {
            timeScale.fitContent();
          }

        } catch (error) {
          console.error('Resize failed, forcing recreation:', error);
          // Force chart recreation on next render
          if (chartRef.current) {
            try {
              chartRef.current.remove();
            } catch (e) {}
            chartRef.current = null;
          }
          chartCreatedRef.current = false;
          lastChartTypeRef.current = null;
        }
      }
    };

    // Wait for DOM to update, then resize
    const timeoutId = setTimeout(resizeOrRecreateChart, 100);

    return () => clearTimeout(timeoutId);
  }, [isFullscreen, isMobile]);

  // Handle indicators
  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0 || chartType === 'holders') return;

    // Define calculation functions inside useEffect
    const calculateSMA = (data, period) => {
      const sma = [];
      for (let i = period - 1; i < data.length; i++) {
        let sum = 0;
        for (let j = 0; j < period; j++) {
          sum += data[i - j].value || data[i - j].close;
        }
        sma.push({
          time: data[i].time,
          value: sum / period
        });
      }
      return sma;
    };

    const calculateEMA = (data, period) => {
      const ema = [];
      const multiplier = 2 / (period + 1);
      let sum = 0;
      for (let i = 0; i < period; i++) {
        sum += data[i].value || data[i].close;
      }
      ema.push({
        time: data[period - 1].time,
        value: sum / period
      });
      for (let i = period; i < data.length; i++) {
        const currentValue = data[i].value || data[i].close;
        const previousEMA = ema[ema.length - 1].value;
        const currentEMA = (currentValue - previousEMA) * multiplier + previousEMA;
        ema.push({
          time: data[i].time,
          value: currentEMA
        });
      }
      return ema;
    };

    const calculateBollingerBands = (data, period = 20, stdDev = 2) => {
      const sma = calculateSMA(data, period);
      const bands = [];
      for (let i = 0; i < sma.length; i++) {
        const dataIndex = i + period - 1;
        let sum = 0;
        for (let j = 0; j < period; j++) {
          const value = data[dataIndex - j].value || data[dataIndex - j].close;
          sum += Math.pow(value - sma[i].value, 2);
        }
        const variance = sum / period;
        const standardDeviation = Math.sqrt(variance);
        bands.push({
          time: sma[i].time,
          upper: sma[i].value + stdDev * standardDeviation,
          middle: sma[i].value,
          lower: sma[i].value - stdDev * standardDeviation
        });
      }
      return bands;
    };

    const calculateRSI = (data, period = 14) => {
      if (data.length < period + 1) return [];
      const rsi = [];
      let gains = 0;
      let losses = 0;
      for (let i = 1; i <= period; i++) {
        const change = (data[i].close || data[i].value) - (data[i - 1].close || data[i - 1].value);
        if (change > 0) {
          gains += change;
        } else {
          losses += Math.abs(change);
        }
      }
      let avgGain = gains / period;
      let avgLoss = losses / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi.push({
        time: data[period].time,
        value: avgLoss === 0 ? 100 : 100 - 100 / (1 + rs)
      });
      for (let i = period + 1; i < data.length; i++) {
        const change = (data[i].close || data[i].value) - (data[i - 1].close || data[i - 1].value);
        const gain = change > 0 ? change : 0;
        const loss = change < 0 ? Math.abs(change) : 0;
        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsi.push({
          time: data[i].time,
          value: avgLoss === 0 ? 100 : 100 - 100 / (1 + rs)
        });
      }
      return rsi;
    };

    // Remove all existing indicator series
    Object.values(indicatorSeriesRef.current).forEach((series) => {
      if (series && chartRef.current) {
        try {
          chartRef.current.removeSeries(series);
        } catch (e) {
          console.error('Error removing series:', e);
        }
      }
    });
    indicatorSeriesRef.current = {};

    // Add selected indicators
    indicators.forEach((indicator) => {
      try {
        if (indicator.id === 'sma20') {
          const smaData = calculateSMA(data, 20);
          if (smaData.length > 0) {
            const smaSeries = chartRef.current.addSeries(LineSeries, {
              color: '#FF6B6B',
              lineWidth: 2,
              title: 'SMA 20',
              priceLineVisible: false,
              lastValueVisible: false,
              crosshairMarkerVisible: false
            });
            smaSeries.setData(
              smaData.map((d) => ({
                time: d.time,
                value: d.value * scaleFactorRef.current
              }))
            );
            indicatorSeriesRef.current['sma20'] = smaSeries;
          }
        } else if (indicator.id === 'sma50') {
          const smaData = calculateSMA(data, 50);
          if (smaData.length > 0) {
            const smaSeries = chartRef.current.addSeries(LineSeries, {
              color: '#4ECDC4',
              lineWidth: 2,
              title: 'SMA 50',
              priceLineVisible: false,
              lastValueVisible: false,
              crosshairMarkerVisible: false
            });
            smaSeries.setData(
              smaData.map((d) => ({
                time: d.time,
                value: d.value * scaleFactorRef.current
              }))
            );
            indicatorSeriesRef.current['sma50'] = smaSeries;
          }
        } else if (indicator.id === 'ema20') {
          const emaData = calculateEMA(data, 20);
          if (emaData.length > 0) {
            const emaSeries = chartRef.current.addSeries(LineSeries, {
              color: '#FFA07A',
              lineWidth: 2,
              title: 'EMA 20',
              priceLineVisible: false,
              lastValueVisible: false,
              crosshairMarkerVisible: false
            });
            emaSeries.setData(
              emaData.map((d) => ({
                time: d.time,
                value: d.value * scaleFactorRef.current
              }))
            );
            indicatorSeriesRef.current['ema20'] = emaSeries;
          }
        } else if (indicator.id === 'ema50') {
          const emaData = calculateEMA(data, 50);
          if (emaData.length > 0) {
            const emaSeries = chartRef.current.addSeries(LineSeries, {
              color: '#98D8C8',
              lineWidth: 2,
              title: 'EMA 50',
              priceLineVisible: false,
              lastValueVisible: false,
              crosshairMarkerVisible: false
            });
            emaSeries.setData(
              emaData.map((d) => ({
                time: d.time,
                value: d.value * scaleFactorRef.current
              }))
            );
            indicatorSeriesRef.current['ema50'] = emaSeries;
          }
        } else if (indicator.id === 'bb') {
          const bbData = calculateBollingerBands(data, 20, 2);
          if (bbData.length > 0) {
            // Upper band
            const upperSeries = chartRef.current.addSeries(LineSeries, {
              color: 'rgba(33, 150, 243, 0.6)',
              lineWidth: 1,
              lineStyle: 2, // Dashed
              title: 'BB Upper',
              priceLineVisible: false,
              lastValueVisible: false,
              crosshairMarkerVisible: false
            });
            upperSeries.setData(
              bbData.map((d) => ({
                time: d.time,
                value: d.upper * scaleFactorRef.current
              }))
            );
            indicatorSeriesRef.current['bb_upper'] = upperSeries;

            // Middle band (SMA)
            const middleSeries = chartRef.current.addSeries(LineSeries, {
              color: 'rgba(33, 150, 243, 0.8)',
              lineWidth: 1,
              title: 'BB Middle',
              priceLineVisible: false,
              lastValueVisible: false,
              crosshairMarkerVisible: false
            });
            middleSeries.setData(
              bbData.map((d) => ({
                time: d.time,
                value: d.middle * scaleFactorRef.current
              }))
            );
            indicatorSeriesRef.current['bb_middle'] = middleSeries;

            // Lower band
            const lowerSeries = chartRef.current.addSeries(LineSeries, {
              color: 'rgba(33, 150, 243, 0.6)',
              lineWidth: 1,
              lineStyle: 2, // Dashed
              title: 'BB Lower',
              priceLineVisible: false,
              lastValueVisible: false,
              crosshairMarkerVisible: false
            });
            lowerSeries.setData(
              bbData.map((d) => ({
                time: d.time,
                value: d.lower * scaleFactorRef.current
              }))
            );
            indicatorSeriesRef.current['bb_lower'] = lowerSeries;
          }
        } else if (indicator.id === 'rsi') {
          // RSI needs to be shown as an overlay with scaled values
          const rsiData = calculateRSI(data, 14);
          if (rsiData.length > 0) {
            // Scale RSI values to fit on the price chart
            const priceRange =
              Math.max(...data.map((d) => d.high)) - Math.min(...data.map((d) => d.low));
            const priceMin = Math.min(...data.map((d) => d.low));

            // RSI oscillates between 0-100, map it to price range
            const scaledRSI = rsiData.map((r) => ({
              time: r.time,
              value: (priceMin + (r.value / 100) * priceRange * 0.3) * scaleFactorRef.current // Use 30% of price range for RSI
            }));

            const rsiSeries = chartRef.current.addSeries(LineSeries, {
              color: 'rgba(156, 39, 176, 0.7)',
              lineWidth: 2,
              title: 'RSI (14)',
              priceLineVisible: false,
              lastValueVisible: false,
              crosshairMarkerVisible: false,
              priceScaleId: 'rsi'
            });
            rsiSeries.setData(scaledRSI);
            indicatorSeriesRef.current['rsi'] = rsiSeries;

            // Add overbought line (70)
            const overboughtLevel = priceMin + (70 / 100) * priceRange * 0.3;
            const overboughtSeries = chartRef.current.addSeries(LineSeries, {
              color: 'rgba(255, 82, 82, 0.3)',
              lineWidth: 1,
              lineStyle: 2,
              priceLineVisible: false,
              lastValueVisible: false,
              crosshairMarkerVisible: false,
              priceScaleId: 'rsi'
            });
            overboughtSeries.setData([
              { time: data[0].time, value: overboughtLevel * scaleFactorRef.current },
              { time: data[data.length - 1].time, value: overboughtLevel * scaleFactorRef.current }
            ]);
            indicatorSeriesRef.current['rsi_overbought'] = overboughtSeries;

            // Add oversold line (30)
            const oversoldLevel = priceMin + (30 / 100) * priceRange * 0.3;
            const oversoldSeries = chartRef.current.addSeries(LineSeries, {
              color: 'rgba(0, 230, 118, 0.3)',
              lineWidth: 1,
              lineStyle: 2,
              priceLineVisible: false,
              lastValueVisible: false,
              crosshairMarkerVisible: false,
              priceScaleId: 'rsi'
            });
            oversoldSeries.setData([
              { time: data[0].time, value: oversoldLevel * scaleFactorRef.current },
              { time: data[data.length - 1].time, value: oversoldLevel * scaleFactorRef.current }
            ]);
            indicatorSeriesRef.current['rsi_oversold'] = oversoldSeries;

            // Add middle line (50)
            const middleLevel = priceMin + (50 / 100) * priceRange * 0.3;
            const middleSeries = chartRef.current.addSeries(LineSeries, {
              color: 'rgba(158, 158, 158, 0.3)',
              lineWidth: 1,
              lineStyle: 3,
              priceLineVisible: false,
              lastValueVisible: false,
              crosshairMarkerVisible: false,
              priceScaleId: 'rsi'
            });
            middleSeries.setData([
              { time: data[0].time, value: middleLevel * scaleFactorRef.current },
              { time: data[data.length - 1].time, value: middleLevel * scaleFactorRef.current }
            ]);
            indicatorSeriesRef.current['rsi_middle'] = middleSeries;
          }
        } else if (indicator.id === 'fib') {
          // Calculate Fibonacci levels based on the data range
          if (data.length > 0) {
            const minPrice = Math.min(...data.map((d) => d.low));
            const maxPrice = Math.max(...data.map((d) => d.high));
            const diff = maxPrice - minPrice;

            const fibLevels = [
              { level: 0, price: minPrice, color: 'rgba(255, 82, 82, 0.5)' },
              { level: 0.236, price: minPrice + diff * 0.236, color: 'rgba(255, 152, 0, 0.5)' },
              { level: 0.382, price: minPrice + diff * 0.382, color: 'rgba(255, 193, 7, 0.5)' },
              { level: 0.5, price: minPrice + diff * 0.5, color: 'rgba(76, 175, 80, 0.5)' },
              { level: 0.618, price: minPrice + diff * 0.618, color: 'rgba(33, 150, 243, 0.5)' },
              { level: 0.786, price: minPrice + diff * 0.786, color: 'rgba(103, 58, 183, 0.5)' },
              { level: 1, price: maxPrice, color: 'rgba(156, 39, 176, 0.5)' }
            ];

            fibLevels.forEach((fib, index) => {
              const fibSeries = chartRef.current.addSeries(LineSeries, {
                color: fib.color,
                lineWidth: 1,
                lineStyle: 3, // Dotted
                title: `Fib ${fib.level}`,
                priceLineVisible: false,
                lastValueVisible: false,
                crosshairMarkerVisible: false
              });

              // Create a horizontal line at the fib level
              const lineData = [
                { time: data[0].time, value: fib.price * scaleFactorRef.current },
                { time: data[data.length - 1].time, value: fib.price * scaleFactorRef.current }
              ];
              fibSeries.setData(lineData);
              indicatorSeriesRef.current[`fib_${index}`] = fibSeries;
            });
          }
        } else if (indicator.id === 'ath' && athData.price) {
          // All-Time High line
          const athSeries = chartRef.current.addSeries(LineSeries, {
            color: '#FFD700',
            lineWidth: 2,
            lineStyle: 2, // Dashed
            title: 'ATH',
            priceLineVisible: false,
            lastValueVisible: true,
            crosshairMarkerVisible: false
          });

          // Create a horizontal line at ATH level
          const athLineData = [
            { time: data[0].time, value: athData.price * scaleFactorRef.current },
            { time: data[data.length - 1].time, value: athData.price * scaleFactorRef.current }
          ];
          athSeries.setData(athLineData);
          indicatorSeriesRef.current['ath'] = athSeries;
        }
      } catch (error) {
        console.error(`Error adding ${indicator.name}:`, error);
      }
    });
  }, [
    indicators,
    data,
    chartType,
    athData,
    isDark
  ]);

  // Separate effect to update data on chart series - throttled for performance
  useEffect(() => {
    // Skip if chart isn't ready yet - the chart creation effect will handle initial data
    if (!chartRef.current) {
      return;
    }

    const chartData = chartType === 'holders' ? holderData : data;
    if (!chartData || chartData.length === 0) {
      return;
    }

    // Scale factor for very small prices to help with tick generation
    const getScaleFactor = (data) => {
      if (!data || data.length === 0) return 1;
      const maxPrice = Math.max(
        ...data.map((d) => Math.max(d.high || d.close || d.value || d.open || 0))
      );
      const minPrice = Math.min(
        ...data.map((d) => Math.min(d.low || d.close || d.value || d.open || Infinity))
      );

      // Use the average of min and max for better scaling decision
      const avgPrice = (maxPrice + minPrice) / 2;

      // More aggressive scaling for extremely small values (common with XRP pairs)
      if (avgPrice < 0.000000000001) return 1000000000000000; // 1e15
      if (avgPrice < 0.00000000001) return 100000000000000;   // 1e14
      if (avgPrice < 0.0000000001) return 10000000000000;     // 1e13
      if (avgPrice < 0.000000001) return 1000000000000;       // 1e12
      if (avgPrice < 0.00000001) return 100000000000;         // 1e11
      if (avgPrice < 0.0000001) return 10000000000;           // 1e10
      if (avgPrice < 0.000001) return 1000000000;             // 1e9
      if (avgPrice < 0.00001) return 100000000;               // 1e8
      if (avgPrice < 0.0001) return 10000000;                 // 1e7
      if (avgPrice < 0.001) return 1000000;                   // 1e6
      if (avgPrice < 0.01) return 100000;                     // 1e5
      if (avgPrice < 0.1) return 10000;                       // 1e4
      if (avgPrice < 1) return 1000;                          // 1e3
      return 1;
    };

    // Save current zoom state before updating
    if (chartRef.current && chartRef.current.timeScale) {
      try {
        const visibleRange = chartRef.current.timeScale().getVisibleRange();
        if (visibleRange) {
          zoomStateRef.current = visibleRange;
        }
      } catch (e) {
        // Could not save zoom state
      }
    }

    // Create series if they don't exist yet
    if (chartType === 'candles' && !candleSeriesRef.current) {
      const candleSeries = chartRef.current.addSeries(CandlestickSeries, {
        upColor: isDark ? '#00E676' : '#4CAF50',
        downColor: isDark ? '#FF5252' : '#F44336',
        borderUpColor: isDark ? '#00E676' : '#4CAF50',
        borderDownColor: isDark ? '#FF5252' : '#F44336',
        wickUpColor: isDark ? '#00E676' : '#4CAF50',
        wickDownColor: isDark ? '#FF5252' : '#F44336',
        borderVisible: true,
        wickVisible: true
      });
      candleSeriesRef.current = candleSeries;
    }

    if ((chartType === 'line' || chartType === 'holders') && !lineSeriesRef.current) {
      const seriesOptions =
        chartType === 'holders'
          ? {
              lineColor: '#9c27b0',
              topColor: 'rgba(156, 39, 176, 0.56)',
              bottomColor: 'rgba(156, 39, 176, 0.04)'
            }
          : {
              lineColor: theme.palette.primary.main,
              topColor: theme.palette.primary.main + '80',
              bottomColor: theme.palette.primary.main + '08'
            };

      const areaSeries = chartRef.current.addSeries(AreaSeries, {
        ...seriesOptions,
        lineWidth: 2,
        lineStyle: 0,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4
      });
      lineSeriesRef.current = areaSeries;
    }

    if (chartType !== 'holders' && !volumeSeriesRef.current) {
      const volumeSeries = chartRef.current.addSeries(HistogramSeries, {
        color: '#26a69a',
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
        scaleMargins: { top: 0.85, bottom: 0 },
        priceLineVisible: false,
        lastValueVisible: false
      });
      volumeSeriesRef.current = volumeSeries;

      // Configure volume scale separately
      chartRef.current.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.9,
          bottom: 0
        }
      });
    }

    // Check if this is a range change or currency change
    const isRangeChange = lastChartTypeRef.current !== `${chartType}-${range}`;
    const isCurrencyChange = activeFiatCurrencyRef.current !== activeFiatCurrency;

    // Update series data - use update for the last bar if it's an auto-update
    const isAutoUpdate = !isRangeChange && !isCurrencyChange && dataRef.current && chartData.length > 0;

    if (chartType === 'candles' && candleSeriesRef.current) {
      // Calculate scale factor for small prices
      const scaleFactor = getScaleFactor(chartData);
      scaleFactorRef.current = scaleFactor;

      // Scale the data if needed
      const scaledData =
        scaleFactor === 1
          ? chartData
          : chartData.map((d) => ({
              time: d.time,
              open: d.open * scaleFactor,
              high: d.high * scaleFactor,
              low: d.low * scaleFactor,
              close: d.close * scaleFactor,
              volume: d.volume
            }));

      if (isAutoUpdate && scaledData.length > 0) {
        const lastBar = scaledData[scaledData.length - 1];
        candleSeriesRef.current.update(lastBar);
      } else {
        candleSeriesRef.current.setData(scaledData);

        // Applied scaling factor for small prices
      }
    } else if (chartType === 'line' && lineSeriesRef.current) {
      // Calculate scale factor for small prices
      const scaleFactor = getScaleFactor(chartData);
      scaleFactorRef.current = scaleFactor;

      const lineData = chartData.map((d) => ({
        time: d.time,
        value: (d.close || d.value) * scaleFactor
      }));

      if (isAutoUpdate && lineData.length > 0) {
        const lastPoint = lineData[lineData.length - 1];
        lineSeriesRef.current.update(lastPoint);
      } else {
        lineSeriesRef.current.setData(lineData);

        // Line: Applied scaling factor for small prices
      }
    } else if (chartType === 'holders' && lineSeriesRef.current) {
      const holdersLineData = chartData.map((d) => ({ time: d.time, value: d.value || d.holders }));
      if (isAutoUpdate && holdersLineData.length > 0) {
        const lastPoint = holdersLineData[holdersLineData.length - 1];
        lineSeriesRef.current.update(lastPoint);
      } else {
        lineSeriesRef.current.setData(holdersLineData);
      }
    }

    // Update volume series
    if (chartType !== 'holders' && volumeSeriesRef.current && data) {
      const volumeData = data.map((d) => ({
        time: d.time,
        value: d.volume || 0,
        color:
          d.close >= d.open
            ? isDark
              ? 'rgba(0, 230, 118, 0.5)'
              : 'rgba(76, 175, 80, 0.6)'
            : isDark
              ? 'rgba(255, 82, 82, 0.5)'
              : 'rgba(244, 67, 54, 0.6)'
      }));
      if (isAutoUpdate && volumeData.length > 0) {
        const lastVolume = volumeData[volumeData.length - 1];
        volumeSeriesRef.current.update(lastVolume);
      } else {
        volumeSeriesRef.current.setData(volumeData);
      }
    }

    // Don't call fitContent on auto-updates - preserve user's zoom
    // Only fit content on initial load, range change, or currency change
    if (isRangeChange || isCurrencyChange) {
      // This is a range/currency change or initial load, fit content
      chartRef.current.timeScale().fitContent();
      lastChartTypeRef.current = `${chartType}-${range}`;
      // Update currency ref after processing
      activeFiatCurrencyRef.current = activeFiatCurrency;
    } else if (zoomStateRef.current) {
      // This is an auto-update, restore the saved zoom
      setTimeout(() => {
        if (chartRef.current && chartRef.current.timeScale && zoomStateRef.current) {
          try {
            chartRef.current.timeScale().setVisibleRange(zoomStateRef.current);
          } catch (e) {
            // Could not restore zoom
          }
        }
      }, 0);
    }

    // The tooltip will maintain its position automatically since we're not recreating the chart
  }, [data, holderData, chartType, isDark, range, theme, isMobile]);

  const handleIndicatorToggle = useCallback((indicator) => {
    // Special handling for RSI
    if (indicator.id === 'rsi') {
      setShowRSI((prev) => {
        const newValue = !prev;
        showRSIRef.current = newValue;
        return newValue;
      });
    }

    setIndicators((prev) => {
      const exists = prev.find((i) => i.id === indicator.id);
      if (exists) {
        return prev.filter((i) => i.id !== indicator.id);
      } else {
        return [...prev, indicator];
      }
    });
  }, []);

  const handleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  return (
    <Paper
      elevation={0}
      sx={{
        // Keep within grid column to preserve two-column layout
        mx: 0,
        width: '100%',
        p: isMobile ? 1 : 1.5,
        pr: isMobile ? 0.5 : 1.5,
        background: 'transparent',
        backdropFilter: 'none',
        boxShadow: 'none',
        border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
        borderRadius: '8px',
        overflow: 'hidden',
        '&:hover': {
          borderColor: alpha(theme.palette.divider, 0.2),
          background: alpha(theme.palette.background.paper, 0.02)
        },
        ...(isFullscreen && {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          borderRadius: 0,
          width: '100vw',
          height: '100vh',
          maxWidth: '100vw',
          maxHeight: '100vh'
        })
      }}
    >
      <Box
        sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="h6" sx={{ fontSize: '14px', fontWeight: 400 }}>
            {token.name} {chartType === 'holders' ? 'Holders' : `Price (${activeFiatCurrency})`} •{' '}
            {range} • {chartInterval}
          </Typography>
          {athData.price && chartType !== 'holders' && (
            <Box
              onClick={() => {
                const hasATH = indicators.find(i => i.id === 'ath');
                handleIndicatorToggle(indicatorOptions.find(i => i.id === 'ath'));
              }}
              sx={{
                position: 'relative',
                minWidth: isMobile ? 110 : 160,
                maxWidth: isMobile ? 160 : 240,
                width: 'auto',
                height: isMobile ? 24 : 28,
                borderRadius: '6px',
                overflow: 'hidden',
                border: `1.5px solid ${alpha(theme.palette.divider, 0.2)}`,
                cursor: 'pointer',
                transition: 'border-color 0.15s ease',
                '&:hover': {
                  borderColor: athData.percentDown < 0
                    ? alpha('#ef5350', 0.6)
                    : alpha('#66bb6a', 0.6)
                }
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${Math.min(Math.abs(parseFloat(athData.percentDown)), 100)}%`,
                  bgcolor: athData.percentDown < 0
                    ? alpha('#ef5350', 0.12)
                    : alpha('#66bb6a', 0.12),
                  transition: 'width 0.3s ease'
                }}
              />
              <Box
                sx={{
                  position: 'relative',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  px: 1,
                  gap: 0.75,
                  whiteSpace: 'nowrap'
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 400,
                    fontSize: isMobile ? '11px' : '12px',
                    color: athData.percentDown < 0 ? '#ef5350' : '#66bb6a',
                    flexShrink: 0
                  }}
                >
                  {athData.percentDown}%
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: isMobile ? '13px' : '11px',
                    color: 'text.secondary',
                    opacity: 0.7,
                    flexShrink: 0
                  }}
                >
                  {isMobile ? 'ATH' : 'from ATH'}
                </Typography>
                {!isMobile && (
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '13px',
                      color: 'text.secondary',
                      opacity: 0.6,
                      fontFamily: 'monospace',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '80px'
                    }}
                  >
                    {currencySymbols[activeFiatCurrency] || ''}
                    {(() => {
                      if (athData.price && athData.price < 0.001) {
                        const str = athData.price.toFixed(15);
                        const zeros = str.match(/0\.0*/)?.[0]?.length - 2 || 0;
                        if (zeros >= 4) {
                          const significant = str.replace(/^0\.0+/, '').replace(/0+$/, '');
                          return `0.0(${zeros})${significant.slice(0, 3)}`;
                        }
                      }
                      return athData.price < 0.01
                        ? athData.price.toFixed(6)
                        : athData.price.toFixed(3);
                    })()}
                  </Typography>
                )}
              </Box>
            </Box>
          )}
          <Box
            sx={{
              ml: 2,
              minWidth: 140,
              display: 'inline-flex',
              alignItems: 'center',
              height: 20,
              position: 'relative'
            }}
          >
            {isUpdating ? (
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: 'success.main',
                }}
              />
            ) : lastUpdate ? (
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.75,
                  opacity: isUserZoomed ? 0.5 : 0.7,
                }}
              >
                <Box
                  sx={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    bgcolor: isUserZoomed ? 'warning.main' : 'success.main',
                    opacity: isUserZoomed ? 0.6 : 1
                  }}
                />
                <Typography
                  component="span"
                  sx={{
                    fontSize: '13px',
                    fontWeight: 400,
                    letterSpacing: '0.03em',
                    fontFamily: '"SF Mono", "Monaco", "Inconsolata", "Fira Code", monospace',
                    color: 'text.secondary',
                    userSelect: 'none'
                  }}
                >
                  {lastUpdate.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                  })}
                </Typography>
                {isUserZoomed && (
                  <Typography
                    component="span"
                    sx={{
                      fontSize: '12px',
                      fontWeight: 400,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      opacity: 0.6,
                      color: 'warning.main'
                    }}
                  >
                    paused
                  </Typography>
                )}
              </Box>
            ) : null}
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            gap: isMobile ? 0.5 : 1,
            flexWrap: 'wrap',
            alignItems: 'center',
            position: 'relative'
          }}
        >
          <ButtonGroup size="small">
            {Object.entries(chartTypeIcons).map(([type, icon]) => (
              <Button
                key={type}
                onClick={() => setChartType(type)}
                variant={chartType === type ? 'contained' : 'outlined'}
                sx={{
                  px: isMobile ? 0.75 : 1.25,
                  fontSize: isMobile ? '11px' : '13px',
                  minWidth: isMobile ? 'auto' : 'unset',
                  height: isMobile ? 26 : 30,
                  borderRadius: '6px',
                  textTransform: 'none',
                  fontWeight: chartType === type ? 600 : 500,
                  border: `1px solid ${chartType === type ? theme.palette.primary.main : alpha(theme.palette.divider, 0.2)}`,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.04),
                    borderColor: alpha(theme.palette.primary.main, 0.3)
                  },
                  '& .MuiButton-startIcon': {
                    marginRight: isMobile ? '2px' : '6px',
                    '& > svg': {
                      fontSize: isMobile ? '12px' : '16px'
                    }
                  }
                }}
                startIcon={icon}
              >
                {isMobile
                  ? type === 'holders'
                    ? 'Hold'
                    : type.charAt(0).toUpperCase() + type.slice(1).substring(0, 3)
                  : type === 'holders'
                    ? 'Holders'
                    : type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </ButtonGroup>

          <ButtonGroup
            size="small"
            sx={{ '& .MuiButtonGroup-grouped': { minWidth: isMobile ? 20 : 'auto' } }}
          >
            {['1D', '5D', '1M', '3M', '1Y', '5Y', 'ALL'].map((r) => (
              <Button
                key={r}
                onClick={() => {
                  setRange(r);
                  setIsUserZoomed(false); // Reset zoom state on range change

                  // Auto-adjust interval to safe default
                  const rangeDefaults = {
                    '1D': '5m',
                    '5D': '15m',
                    '1M': '1h',
                    '3M': '4h',
                    '1Y': '1d',
                    '5Y': '1d',
                    'ALL': '1d'
                  };
                  const defaultInterval = rangeDefaults[r];
                  if (defaultInterval) {
                    setChartInterval(defaultInterval);
                  }
                }}
                variant={range === r ? 'contained' : 'outlined'}
                sx={{
                  px: isMobile ? 0.5 : 0.75,
                  fontSize: isMobile ? '13px' : '12px',
                  minWidth: isMobile ? 26 : 32,
                  height: isMobile ? 26 : 30,
                  letterSpacing: '-0.02em',
                  borderRadius: '6px',
                  fontWeight: range === r ? 600 : 500,
                  border: `1px solid ${range === r ? theme.palette.primary.main : alpha(theme.palette.divider, 0.2)}`,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.04),
                    borderColor: alpha(theme.palette.primary.main, 0.3)
                  }
                }}
              >
                {r}
              </Button>
            ))}
          </ButtonGroup>

          <IconButton
            size={isMobile ? 'small' : 'small'}
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{
              ml: isMobile ? 0.5 : 1,
              p: isMobile ? 0.5 : 1,
              '& .MuiSvgIcon-root': {
                fontSize: isMobile ? '16px' : '20px'
              }
            }}
          >
            <MoreVertIcon />
          </IconButton>

          {!isMobile && (
            <>
              <IconButton
                size="small"
                onClick={handleFullscreen}
                sx={{
                  ml: 1,
                  p: 1,
                  '& .MuiSvgIcon-root': {
                    fontSize: '20px'
                  }
                }}
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            </>
          )}

          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            {isMobile && (
              <>
                <MenuItem
                  onClick={() => {
                    handleFullscreen();
                    setAnchorEl(null);
                  }}
                  sx={{ fontSize: '14px' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {isFullscreen ? (
                      <FullscreenExitIcon fontSize="small" />
                    ) : (
                      <FullscreenIcon fontSize="small" />
                    )}
                    {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                  </Box>
                </MenuItem>
                <Divider />
              </>
            )}
            <MenuItem disabled sx={{ fontSize: '14px', fontWeight: 'bold' }}>
              Interval
            </MenuItem>
            {['1m', '5m', '15m', '30m', '1h', '4h', '1d'].map((int) => {
              // Disable invalid combinations
              const validCombos = {
                '1D': ['1m', '5m', '15m', '30m', '1h'],
                '5D': ['5m', '15m', '30m', '1h', '4h'],
                '1M': ['15m', '30m', '1h', '4h', '1d'],
                '3M': ['30m', '1h', '4h', '1d'],
                '1Y': ['1h', '4h', '1d'],
                '5Y': ['4h', '1d'],
                'ALL': ['1d']
              };

              const isValid = validCombos[range]?.includes(int);

              return (
                <MenuItem
                  key={int}
                  disabled={!isValid}
                  onClick={() => {
                    if (isValid) {
                      setChartInterval(int);
                      setAnchorEl(null);
                    }
                  }}
                  sx={{
                    fontSize: '14px',
                    backgroundColor: chartInterval === int ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                    opacity: !isValid ? 0.4 : 1
                  }}
                >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      border: '2px solid',
                      borderColor: theme.palette.divider,
                      borderRadius: '50%',
                      mr: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: chartInterval === int ? theme.palette.primary.main : 'transparent'
                    }}
                  >
                    {chartInterval === int && (
                      <Box sx={{ width: 6, height: 6, bgcolor: 'white', borderRadius: '50%' }} />
                    )}
                  </Box>
                  {int}
                </Box>
              </MenuItem>
              );
            })}
            <Divider />
            <MenuItem disabled sx={{ fontSize: '14px', fontWeight: 'bold' }}>
              Indicators
            </MenuItem>
            {indicatorOptions.map((indicator) => (
              <MenuItem
                key={indicator.id}
                onClick={() => handleIndicatorToggle(indicator)}
                sx={{ fontSize: '14px' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      border: '2px solid',
                      borderColor: theme.palette.divider,
                      borderRadius: '2px',
                      mr: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: indicators.find((i) => i.id === indicator.id)
                        ? theme.palette.primary.main
                        : 'transparent'
                    }}
                  >
                    {indicators.find((i) => i.id === indicator.id) && (
                      <Box sx={{ width: 8, height: 8, bgcolor: 'white', borderRadius: '1px' }} />
                    )}
                  </Box>
                  {indicator.name}
                </Box>
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </Box>

      <Box
        sx={{
          position: 'relative',
          height: isFullscreen ? 'calc(100vh - 120px)' : isMobile ? 380 : 550,
          borderRadius: 1,
          overflow: 'hidden',
          contain: 'layout style paint',
          mr: isMobile ? -0.5 : 0,
          ml: isMobile ? -0.5 : 0
        }}
      >
        <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
        {(() => {
          const hasChartData =
            chartType === 'holders' ? holderData && holderData.length > 0 : data && data.length > 0;

          // Only overlay spinner if no chart instance exists yet
          if (loading && !chartRef.current) {
            return (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none'
                }}
              >
                <CircularProgress size={24} />
              </Box>
            );
          }

          if (!hasChartData && !loading) {
            return (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography color="text.secondary">No data available</Typography>
              </Box>
            );
          }
          return null;
        })()}
      </Box>
    </Paper>
  );
});

PriceChartAdvanced.displayName = 'PriceChartAdvanced';

export default PriceChartAdvanced;
