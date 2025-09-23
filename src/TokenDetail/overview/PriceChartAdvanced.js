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
import { currencySymbols } from 'src/utils/constants';
import { PinChartButton, usePinnedCharts } from 'src/components/PinnedChartTracker';
import { ChartNotificationButton } from 'src/components/PriceNotifications';
import { throttle } from 'src/utils/lodashLite';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import CandlestickChartIcon from '@mui/icons-material/CandlestickChart';
import RefreshIcon from '@mui/icons-material/Refresh';
import GroupIcon from '@mui/icons-material/Group';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';

const PriceChartAdvanced = memo(({ token }) => {
  const theme = useTheme();
  const { activeFiatCurrency, accountProfile } = useContext(AppContext);
  const { pinnedCharts, pinChart, unpinChartByToken } = usePinnedCharts();
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

  const BASE_URL = process.env.API_URL;
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
        const apiRange = range === 'ALL' ? '1Y' : range;
        const endpoint = `${BASE_URL}/graph-ohlc-v2/${token.md5}?range=${apiRange}&vs_currency=${activeFiatCurrency}`;

        const response = await axios.get(endpoint, { signal: requestController.signal });

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
    const interval = setInterval(() => {
      if (!isUserZoomedRef.current && mounted) {
        fetchData(true);
      }
    }, 4000);

    return () => {
      mounted = false;
      if (currentRequest) {
        currentRequest.abort();
      }
      clearInterval(interval);
    };
  }, [token.md5, range, BASE_URL, activeFiatCurrency]);

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
            theme.chart?.gridColor || (isDark ? 'rgba(56, 56, 56, 0.4)' : 'rgba(240, 240, 240, 1)'),
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
          color: theme.palette.primary.main,
          width: 1,
          labelBackgroundColor: theme.palette.primary.main
        },
        horzLine: {
          color: theme.palette.primary.main,
          width: 1,
          labelBackgroundColor: theme.palette.primary.main
        }
      },
      rightPriceScale: {
        borderColor:
          theme.chart?.borderColor || (isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'),
        scaleMargins: {
          top: 0.05,
          bottom: 0.15
        },
        mode: 0,
        autoScale: true,
        borderVisible: false,
        visible: true,
        entireTextOnly: isMobile ? true : false,
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

          // Check if price has many leading zeros and use compact notation
          if (actualPrice && actualPrice < 0.001) {
            const str = actualPrice.toFixed(15);
            const zeros = str.match(/0\.0*/)?.[0]?.length - 2 || 0;
            if (zeros >= 4) {
              // Use compact notation for 4+ zeros
              const significant = str.replace(/^0\.0+/, '').replace(/0+$/, '');
              // Create HTML-like string that chart can display
              return symbol + '0.0(' + zeros + ')' + significant.slice(0, 4);
            } else if (actualPrice < 0.00001) {
              return symbol + actualPrice.toFixed(8);
            } else if (actualPrice < 0.001) {
              return symbol + actualPrice.toFixed(6);
            }
          }

          // Regular formatting for normal prices
          if (actualPrice < 0.01) {
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
        barSpacing: 8,
        minBarSpacing: 0.5,
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
    toolTip.style = `width: 140px; height: auto; position: absolute; display: none; padding: 8px; box-sizing: border-box; font-size: 12px; text-align: left; z-index: 1000; top: 12px; left: 12px; pointer-events: none; border-radius: 6px; font-family: inherit; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; background: ${isDark ? 'linear-gradient(145deg, rgba(20, 20, 20, 0.95) 0%, rgba(30, 30, 30, 0.95) 100%)' : 'linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 250, 250, 0.98) 100%)'}; color: ${theme.palette.text.primary}; border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'}; box-shadow: 0 4px 12px ${isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.12)'}`;
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

          // Check if price has many leading zeros and use compact notation
          if (actualPrice && actualPrice < 0.001) {
            const str = actualPrice.toFixed(15);
            const zeros = str.match(/0\.0*/)?.[0]?.length - 2 || 0;
            if (zeros >= 4) {
              // Use compact notation for 4+ zeros
              const significant = str.replace(/^0\.0+/, '').replace(/0+$/, '');
              return '0.0(' + zeros + ')' + significant.slice(0, 4);
            }
          }

          // Regular formatting
          if (actualPrice < 0.00001) return actualPrice.toFixed(8);
          if (actualPrice < 0.001) return actualPrice.toFixed(6);
          if (actualPrice < 0.01) return actualPrice.toFixed(6);
          if (actualPrice < 1) return actualPrice.toFixed(4);
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
            <div style="font-weight: 500; margin-bottom: 4px">${dateStr}</div>
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
            <div style="font-weight: 500; margin-bottom: 4px">${dateStr}</div>
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
            <div style="font-weight: 500; margin-bottom: 4px">${dateStr}</div>
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
        wickUpColor: isDark ? 'rgba(0, 230, 118, 0.5)' : 'rgba(76, 175, 80, 0.5)',
        wickDownColor: isDark ? 'rgba(255, 82, 82, 0.5)' : 'rgba(244, 67, 54, 0.5)',
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
        color: isDark ? 'rgba(0, 230, 118, 0.3)' : 'rgba(76, 175, 80, 0.3)',
        priceFormat: {
          type: 'volume'
        },
        priceScaleId: 'volume',
        scaleMargins: {
          top: 0.85,
          bottom: 0
        },
        priceLineVisible: false,
        lastValueVisible: false
      });
      volumeSeriesRef.current = volumeSeries;

      // Configure volume scale separately
      chart.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.9,
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
  }, [chartType, isDark, isMobile, data, holderData, theme, activeFiatCurrency]);

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
      if (maxPrice < 0.000000001) return 1000000000000;
      if (maxPrice < 0.00000001) return 100000000000;
      if (maxPrice < 0.0000001) return 10000000000;
      if (maxPrice < 0.000001) return 1000000000;
      if (maxPrice < 0.00001) return 100000000;
      if (maxPrice < 0.0001) return 10000000;
      if (maxPrice < 0.001) return 1000000;
      if (maxPrice < 0.01) return 100000;
      if (maxPrice < 0.1) return 10000;
      if (maxPrice < 1) return 1000;
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
        wickUpColor: isDark ? 'rgba(0, 230, 118, 0.5)' : 'rgba(76, 175, 80, 0.5)',
        wickDownColor: isDark ? 'rgba(255, 82, 82, 0.5)' : 'rgba(244, 67, 54, 0.5)',
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

    // Check if this is a range change
    const isRangeChange = lastChartTypeRef.current !== `${chartType}-${range}`;

    // Update series data - use update for the last bar if it's an auto-update
    const isAutoUpdate = !isRangeChange && dataRef.current && chartData.length > 0;

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
              ? 'rgba(0, 230, 118, 0.2)'
              : 'rgba(76, 175, 80, 0.3)'
            : isDark
              ? 'rgba(255, 82, 82, 0.2)'
              : 'rgba(244, 67, 54, 0.3)'
      }));
      if (isAutoUpdate && volumeData.length > 0) {
        const lastVolume = volumeData[volumeData.length - 1];
        volumeSeriesRef.current.update(lastVolume);
      } else {
        volumeSeriesRef.current.setData(volumeData);
      }
    }

    // Don't call fitContent on auto-updates - preserve user's zoom
    // Only fit content on initial load or range change
    if (isRangeChange) {
      // This is a range change or initial load, fit content
      chartRef.current.timeScale().fitContent();
      lastChartTypeRef.current = `${chartType}-${range}`;
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
        p: isMobile ? 1 : 2,
        pr: isMobile ? 0.5 : 2,
        background: theme.chart?.background || (isDark ? '#0d0d0d' : '#fafafa'),
        backdropFilter: 'blur(20px)',
        boxShadow: isDark
          ? '0 10px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
          : '0 4px 20px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 1)',
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
        borderRadius: isMobile ? '10px' : '16px',
        overflow: 'hidden',
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
          <Typography variant="h6" sx={{ fontSize: '1rem' }}>
            {token.name} {chartType === 'holders' ? 'Holders' : `Price (${activeFiatCurrency})`} •{' '}
            {range === 'ALL' ? '1Y' : range}
          </Typography>
          {athData.price && chartType !== 'holders' && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? 0.25 : 0.5,
                bgcolor: athData.percentDown < 0 ? 'error.main' : 'success.main',
                color: 'white',
                px: isMobile ? 0.5 : 1,
                py: isMobile ? 0.125 : 0.25,
                borderRadius: 1,
                fontSize: isMobile ? '0.625rem' : '0.75rem'
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 500, fontSize: 'inherit' }}>
                {athData.percentDown}% {isMobile ? 'ATH' : 'from ATH'}
              </Typography>
              {!isMobile && (
                <Typography variant="caption" sx={{ opacity: 0.9, fontSize: 'inherit' }}>
                  ({currencySymbols[activeFiatCurrency] || ''}
                  {(() => {
                    if (athData.price && athData.price < 0.001) {
                      const str = athData.price.toFixed(15);
                      const zeros = str.match(/0\.0*/)?.[0]?.length - 2 || 0;
                      if (zeros >= 4) {
                        const significant = str.replace(/^0\.0+/, '').replace(/0+$/, '');
                        return `0.0(${zeros})${significant.slice(0, 4)}`;
                      }
                    }
                    return athData.price < 0.01
                      ? athData.price.toFixed(8)
                      : athData.price.toFixed(4);
                  })()}
                  )
                </Typography>
              )}
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
                  animation: 'pulse 1.5s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%': { opacity: 1, transform: 'scale(1)' },
                    '50%': { opacity: 0.6, transform: 'scale(1.2)' },
                    '100%': { opacity: 1, transform: 'scale(1)' }
                  }
                }}
              />
            ) : lastUpdate ? (
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.75,
                  opacity: isUserZoomed ? 0.5 : 0.7,
                  transition: 'opacity 0.2s ease'
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
                    fontSize: '0.6875rem',
                    fontWeight: 500,
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
                      fontSize: '0.625rem',
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
                  px: isMobile ? 0.75 : 1.5,
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  minWidth: isMobile ? 'auto' : 'unset',
                  height: isMobile ? 28 : 32,
                  '& .MuiButton-startIcon': {
                    marginRight: isMobile ? '2px' : '8px',
                    '& > svg': {
                      fontSize: isMobile ? '0.75rem' : '1.25rem'
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
            {['1D', '7D', '1M', '3M', '1Y', 'ALL'].map((r) => (
              <Button
                key={r}
                onClick={() => {
                  setRange(r);
                  setIsUserZoomed(false); // Reset zoom state on range change
                }}
                variant={range === r ? 'contained' : 'outlined'}
                sx={{
                  px: isMobile ? 0.25 : 1,
                  fontSize: isMobile ? '0.65rem' : '0.75rem',
                  minWidth: isMobile ? 24 : 36,
                  height: isMobile ? 24 : 32,
                  letterSpacing: isMobile ? '-0.5px' : 'normal'
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
                fontSize: isMobile ? '1rem' : '1.25rem'
              }
            }}
          >
            <MoreVertIcon />
          </IconButton>

          {!isMobile && (
            <>
              <PinChartButton
                token={token}
                chartType={chartType}
                range={range}
                indicators={indicators}
                activeFiatCurrency={activeFiatCurrency}
              />

              <ChartNotificationButton
                token={token}
                currentPrice={data && data.length > 0 ? data[data.length - 1].close : null}
              />

              <IconButton
                size="small"
                onClick={handleFullscreen}
                sx={{
                  ml: 1,
                  p: 1,
                  '& .MuiSvgIcon-root': {
                    fontSize: '1.25rem'
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
                  sx={{ fontSize: '0.875rem' }}
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
                <MenuItem
                  onClick={() => {
                    if (
                      pinnedCharts.some(
                        (chart) => chart.token.md5 === token.md5 && chart.chartType === chartType
                      )
                    ) {
                      unpinChartByToken(token.md5, chartType);
                    } else {
                      pinChart({
                        token: {
                          md5: token.md5,
                          name: token.name,
                          symbol: token.symbol || token.code,
                          code: token.code,
                          currency: token.currency,
                          issuer: token.issuer,
                          slug: token.slug,
                          logo: token.logo
                        },
                        chartType,
                        range,
                        indicators,
                        activeFiatCurrency
                      });
                    }
                    setAnchorEl(null);
                  }}
                  sx={{ fontSize: '0.875rem' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {pinnedCharts?.some(
                      (chart) => chart.token.md5 === token.md5 && chart.chartType === chartType
                    ) ? (
                      <PushPinIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
                    ) : (
                      <PushPinOutlinedIcon fontSize="small" />
                    )}
                    {pinnedCharts?.some(
                      (chart) => chart.token.md5 === token.md5 && chart.chartType === chartType
                    )
                      ? 'Unpin Chart'
                      : 'Pin Chart'}
                  </Box>
                </MenuItem>
                <Box sx={{ px: 1, py: 0.5, display: 'flex', justifyContent: 'center' }}>
                  <ChartNotificationButton
                    token={token}
                    currentPrice={data && data.length > 0 ? data[data.length - 1].close : null}
                  />
                </Box>
                <Divider />
              </>
            )}
            <MenuItem disabled sx={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
              Indicators
            </MenuItem>
            {indicatorOptions.map((indicator) => (
              <MenuItem
                key={indicator.id}
                onClick={() => handleIndicatorToggle(indicator)}
                sx={{ fontSize: '0.875rem' }}
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
          willChange: 'height',
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
