import { useState, useEffect, useRef, memo, useContext, useMemo } from 'react';
import { Box, ButtonGroup, Button, Typography, useTheme, Paper, IconButton, Menu, MenuItem, CircularProgress, alpha } from '@mui/material';
import { createChart, CandlestickSeries, LineSeries, HistogramSeries, AreaSeries } from 'lightweight-charts';
import axios from 'axios';
import { AppContext } from 'src/AppContext';
import { currencySymbols } from 'src/utils/constants';
import { PinChartButton } from 'src/components/PinnedChartTracker';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import CandlestickChartIcon from '@mui/icons-material/CandlestickChart';
import RefreshIcon from '@mui/icons-material/Refresh';
import GroupIcon from '@mui/icons-material/Group';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';

// Performance: Throttle chart updates
const throttle = (func, delay) => {
  let lastCall = 0;
  let timeout;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return func(...args);
    }
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      lastCall = Date.now();
      func(...args);
    }, delay - (now - lastCall));
  };
};

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
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [indicators, setIndicators] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [athData, setAthData] = useState({ price: null, percentDown: null });
  const [rsiValues, setRsiValues] = useState({});
  const [holderData, setHolderData] = useState(null);
  const [userTrades, setUserTrades] = useState([]);
  const [isUserZoomed, setIsUserZoomed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
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

  const convertScientificToRegular = (value) => {
    if (typeof value === 'string') {
      value = parseFloat(value);
    }
    return Number(value);
  };

  // Scale factor for very small prices to help with tick generation
  const getScaleFactor = (data) => {
    if (!data || data.length === 0) return 1;
    const maxPrice = Math.max(...data.map(d => Math.max(d.high || d.close || d.value || d.open || 0)));
    if (maxPrice < 0.000000001) return 1000000000000; // Scale up by 1 trillion
    if (maxPrice < 0.00000001) return 100000000000;   // Scale up by 100 billion
    if (maxPrice < 0.0000001) return 10000000000;     // Scale up by 10 billion
    if (maxPrice < 0.000001) return 1000000000;       // Scale up by 1 billion
    if (maxPrice < 0.00001) return 100000000;         // Scale up by 100 million
    if (maxPrice < 0.0001) return 10000000;           // Scale up by 10 million
    if (maxPrice < 0.001) return 1000000;             // Scale up by 1 million
    if (maxPrice < 0.01) return 100000;               // Scale up by 100 thousand
    if (maxPrice < 0.1) return 10000;                 // Scale up by 10 thousand  
    if (maxPrice < 1) return 1000;                    // Scale up by 1 thousand
    return 1; // No scaling needed
  };

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
        upper: sma[i].value + (stdDev * standardDeviation),
        middle: sma[i].value,
        lower: sma[i].value - (stdDev * standardDeviation)
      });
    }
    
    return bands;
  };

  const calculateRSI = (data, period = 14) => {
    if (data.length < period + 1) return [];
    
    const rsi = [];
    let gains = 0;
    let losses = 0;
    
    // Calculate initial average gain and loss
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
    
    // Calculate RSI for the first period
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi.push({
      time: data[period].time,
      value: avgLoss === 0 ? 100 : 100 - (100 / (1 + rs))
    });
    
    // Calculate RSI for remaining periods using Wilder's smoothing
    for (let i = period + 1; i < data.length; i++) {
      const change = (data[i].close || data[i].value) - (data[i - 1].close || data[i - 1].value);
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? Math.abs(change) : 0;
      
      avgGain = ((avgGain * (period - 1)) + gain) / period;
      avgLoss = ((avgLoss * (period - 1)) + loss) / period;
      
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi.push({
        time: data[i].time,
        value: avgLoss === 0 ? 100 : 100 - (100 / (1 + rs))
      });
    }
    
    return rsi;
  };

  // Fetch price data
  useEffect(() => {
    
    if (!token?.md5) {
      return;
    }
    
    const controller = new AbortController();
    
    const fetchData = async (isUpdate = false) => {
      try {
        if (isUpdate) {
          setIsUpdating(true);
        } else {
          setLoading(true);
        }
        const apiRange = range === 'ALL' ? '1Y' : range;
        const endpoint = `${BASE_URL}/graph-ohlc-v2/${token.md5}?range=${apiRange}&vs_currency=${activeFiatCurrency}`;
        
        
        const response = await axios.get(endpoint, { signal: controller.signal });
        
        
        if (response.data?.ohlc && response.data.ohlc.length > 0) {
          const processedData = response.data.ohlc.map(candle => ({
            time: Math.floor(candle[0] / 1000), // Convert ms to seconds
            open: convertScientificToRegular(candle[1]),
            high: convertScientificToRegular(candle[2]),
            low: convertScientificToRegular(candle[3]),
            close: convertScientificToRegular(candle[4]),
            value: convertScientificToRegular(candle[4]),
            volume: convertScientificToRegular(candle[5]) || 0
          })).sort((a, b) => a.time - b.time); // Ensure chronological order
          
          
          setData(processedData);
          dataRef.current = processedData;
          setLastUpdate(new Date());
          
          // Calculate ATH from the data
          const allTimeHigh = Math.max(...processedData.map(d => d.high));
          const currentPrice = processedData[processedData.length - 1].close;
          const percentFromATH = ((currentPrice - allTimeHigh) / allTimeHigh * 100).toFixed(8);
          
          
          setAthData({
            price: allTimeHigh,
            percentDown: percentFromATH
          });
          
          // Calculate RSI values for tooltip display
          const rsiData = calculateRSI(processedData, 14);
          const rsiMap = {};
          rsiData.forEach(r => {
            rsiMap[r.time] = r.value;
          });
          setRsiValues(rsiMap);
          
          setLoading(false);
          setIsUpdating(false);
        } else {
          setLoading(false);
          setIsUpdating(false);
        }
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error('Chart fetch error:', error.message);
        }
        setLoading(false);
        setIsUpdating(false);
      }
    };

    fetchData();
    
    // Set up 4-second refresh interval - but only if user is not zoomed
    const interval = setInterval(() => {
      if (!isUserZoomedRef.current) {
        fetchData(true);
      }
    }, 4000);
    
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [token.md5, range, BASE_URL, activeFiatCurrency]); // Removed isUserZoomed to prevent re-creating interval

  // Fetch holder data
  useEffect(() => {
    if (!token?.md5 || chartType !== 'holders') return;
    
    const controller = new AbortController();
    
    const fetchHolderData = async () => {
      try {
        setLoading(true);
        const endpoint = `${BASE_URL}/graphrich/${token.md5}?range=${range}`;
        
        const response = await axios.get(endpoint, { signal: controller.signal });
        
        if (response.data?.history && response.data.history.length > 0) {
          const processedData = response.data.history
            .map(item => ({
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
          
          setHolderData(processedData);
          holderDataRef.current = processedData;
          setLoading(false);
        }
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error('Holder data error:', error);
        }
        setLoading(false);
      }
    };

    fetchHolderData();
    
    return () => controller.abort();
  }, [token.md5, range, BASE_URL, chartType]);

  // Create chart only when chart type changes AND data is available
  useEffect(() => {
    
    // Wait for container and data to be available
    if (!chartContainerRef.current || loading || !data || data.length === 0) {
      return;
    }
    
    // Only create chart once per chart type, prevent flickering
    if (chartCreatedRef.current && lastChartTypeRef.current === chartType) {
      return;
    }
    
    console.log('🎯 Chart creating with data points:', data.length);
    
    // Clean up existing chart when chart type changes
    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch (e) {
        console.error('Error removing chart:', e);
      }
      chartRef.current = null;
      candleSeriesRef.current = null;
      lineSeriesRef.current = null;
      volumeSeriesRef.current = null;
      chartCreatedRef.current = false;
    }
    
    lastChartTypeRef.current = chartType;


    // Create new chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: isFullscreen ? window.innerHeight - 120 : (isMobile ? 380 : 550),
      layout: {
        background: {
          type: 'solid',
          color: 'transparent'
        },
        textColor: theme.palette.text.primary,
        fontSize: 13,
        fontFamily: "'Segoe UI', Roboto, Arial, sans-serif",
      },
      grid: {
        vertLines: {
          color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          style: 1,
        },
        horzLines: {
          color: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
          style: 0,
        },
      },
      crosshair: {
        mode: 0,
        vertLine: {
          color: theme.palette.primary.main,
          width: 1,
          labelBackgroundColor: theme.palette.primary.main,
        },
        horzLine: {
          color: theme.palette.primary.main,
          width: 1,
          labelBackgroundColor: theme.palette.primary.main,
        },
      },
      rightPriceScale: {
        borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
        scaleMargins: {
          top: 0.05,
          bottom: 0.15,
        },
        mode: 0,
        autoScale: true,
        borderVisible: false,
        visible: true,
        entireTextOnly: false,
        drawTicks: true,
        ticksVisible: true,
        alignLabels: true,
        textColor: isDark ? '#ffffff' : '#000000',
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
          
          // Format based on the actual (unscaled) price with higher precision
          if (actualPrice < 0.000000000001) {
            return symbol + actualPrice.toFixed(16);
          } else if (actualPrice < 0.00000000001) {
            return symbol + actualPrice.toFixed(15);
          } else if (actualPrice < 0.0000000001) {
            return symbol + actualPrice.toFixed(14);
          } else if (actualPrice < 0.000000001) {
            return symbol + actualPrice.toFixed(13);
          } else if (actualPrice < 0.00000001) {
            return symbol + actualPrice.toFixed(12);
          } else if (actualPrice < 0.0000001) {
            return symbol + actualPrice.toFixed(11);
          } else if (actualPrice < 0.000001) {
            return symbol + actualPrice.toFixed(10);
          } else if (actualPrice < 0.00001) {
            return symbol + actualPrice.toFixed(8);
          } else if (actualPrice < 0.001) {
            return symbol + actualPrice.toFixed(8);
          } else if (actualPrice < 0.01) {
            return symbol + actualPrice.toFixed(6);
          } else if (actualPrice < 1) {
            return symbol + actualPrice.toFixed(6);
          } else if (actualPrice < 100) {
            return symbol + actualPrice.toFixed(4);
          } else {
            return symbol + actualPrice.toFixed(2);
          }
        },
      },
      timeScale: {
        borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        barSpacing: 8,
        minBarSpacing: 0.5,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
    });

    chartRef.current = chart;
    chartCreatedRef.current = true;


    // Add zoom/scroll detection with debouncing
    let zoomCheckTimeout;
    chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (range && dataRef.current && dataRef.current.length > 0) {
        clearTimeout(zoomCheckTimeout);
        zoomCheckTimeout = setTimeout(() => {
          // Get the full data range
          const dataLength = dataRef.current.length;
          // Check if we're seeing less than 95% of the data (allowing some margin)
          const visibleBars = range.to - range.from;
          const isZoomed = visibleBars < (dataLength * 0.95);
          
          // Also check if user has scrolled away from the latest data
          const isScrolledAway = range.to < (dataLength - 5); // Not showing last 5 bars
          const shouldPauseUpdates = isZoomed || isScrolledAway;
          
          if (shouldPauseUpdates !== isUserZoomedRef.current) {
            setIsUserZoomed(shouldPauseUpdates);
            isUserZoomedRef.current = shouldPauseUpdates;
          }
        }, 100); // Debounce for 100ms
      }
    });

    // Create tooltip
    const toolTip = document.createElement('div');
    toolTip.style = `width: 140px; height: auto; position: absolute; display: none; padding: 8px; box-sizing: border-box; font-size: 12px; text-align: left; z-index: 1000; top: 12px; left: 12px; pointer-events: none; border-radius: 4px; font-family: inherit; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; background: ${isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.95)'}; color: ${theme.palette.text.primary}; border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}; box-shadow: 0 2px 8px ${isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.15)'}`;
    chartContainerRef.current.appendChild(toolTip);

    chart.subscribeCrosshairMove(param => {
      if (!param.time || param.point.x < 0 || param.point.x > chartContainerRef.current.clientWidth ||
          param.point.y < 0 || param.point.y > chartContainerRef.current.clientHeight) {
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
      const candle = currentData ? currentData.find(d => d.time === param.time) : null;
      
      if (candle) {
        const formatPrice = (p) => {
          // The candle data is original unscaled data, so don't scale back
          const actualPrice = p;
          if (actualPrice < 0.000000000001) return actualPrice.toFixed(16);
          if (actualPrice < 0.00000000001) return actualPrice.toFixed(15);
          if (actualPrice < 0.0000000001) return actualPrice.toFixed(14);
          if (actualPrice < 0.000000001) return actualPrice.toFixed(13);
          if (actualPrice < 0.00000001) return actualPrice.toFixed(12);
          if (actualPrice < 0.0000001) return actualPrice.toFixed(11);
          if (actualPrice < 0.000001) return actualPrice.toFixed(10);
          if (actualPrice < 0.00001) return actualPrice.toFixed(8);
          if (actualPrice < 0.001) return actualPrice.toFixed(8);
          if (actualPrice < 0.01) return actualPrice.toFixed(6);
          if (actualPrice < 1) return actualPrice.toFixed(6);
          if (actualPrice < 100) return actualPrice.toFixed(4);
          return actualPrice.toFixed(2);
        };
        
        if (chartType === 'candles') {
          const change = ((candle.close - candle.open) / candle.open * 100).toFixed(2);
          const changeColor = candle.close >= candle.open ? '#4caf50' : '#f44336';
          
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
          `;
        } else if (chartType === 'line') {
          ohlcData = `
            <div style="font-weight: 500; margin-bottom: 4px">${dateStr}</div>
            <div style="display: flex; justify-content: space-between"><span>Price:</span><span>${symbol}${formatPrice(candle.close || candle.value)}</span></div>
            <div style="display: flex; justify-content: space-between"><span>Vol:</span><span>${(candle.volume || 0).toLocaleString()}</span></div>
          `;
        } else if (chartType === 'holders') {
          ohlcData = `
            <div style="font-weight: 500; margin-bottom: 4px">${dateStr}</div>
            <div style="display: flex; justify-content: space-between"><span>Holders:</span><span>${candle.holders ? candle.holders.toLocaleString() : candle.value.toLocaleString()}</span></div>
            ${candle.top10 !== undefined ? `
              <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}">
                <div style="display: flex; justify-content: space-between"><span>Top 10:</span><span>${candle.top10.toFixed(2)}%</span></div>
                <div style="display: flex; justify-content: space-between"><span>Top 20:</span><span>${candle.top20.toFixed(2)}%</span></div>
                <div style="display: flex; justify-content: space-between"><span>Top 50:</span><span>${candle.top50.toFixed(2)}%</span></div>
                <div style="display: flex; justify-content: space-between"><span>Top 100:</span><span>${candle.top100.toFixed(2)}%</span></div>
              </div>
            ` : ''}
          `;
        }
      }

      if (ohlcData) {
        toolTip.innerHTML = ohlcData;
        const x = Math.max(0, Math.min(chartContainerRef.current.clientWidth - 150, param.point.x - 50));
        const y = 12;
        toolTip.style.left = x + 'px';
        toolTip.style.top = y + 'px';
      }
    });

    // Add series based on chart type (they'll get data in the update effect)
    
    if (chartType === 'candles') {
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderUpColor: '#26a69a',
        borderDownColor: '#ef5350',
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
        borderVisible: true,
        wickVisible: true,
      });
      candleSeriesRef.current = candleSeries;
    } else if (chartType === 'line') {
      const areaSeries = chart.addSeries(AreaSeries, {
        lineColor: theme.palette.primary.main,
        topColor: theme.palette.primary.main + '80',
        bottomColor: theme.palette.primary.main + '08',
        lineWidth: 2,
        lineStyle: 0,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        crosshairMarkerBorderColor: theme.palette.primary.main,
        crosshairMarkerBackgroundColor: theme.palette.background.paper,
      });
      lineSeriesRef.current = areaSeries;
    } else if (chartType === 'holders') {
      const holdersSeries = chart.addSeries(AreaSeries, {
        lineColor: '#9c27b0',
        topColor: 'rgba(156, 39, 176, 0.56)',
        bottomColor: 'rgba(156, 39, 176, 0.04)',
        lineWidth: 2,
        lineStyle: 0,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        crosshairMarkerBorderColor: '#9c27b0',
        crosshairMarkerBackgroundColor: theme.palette.background.paper,
      });
      lineSeriesRef.current = holdersSeries;
    }

    // Add volume series for non-holder charts
    if (chartType !== 'holders') {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: '#26a69a',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: 'volume',
        scaleMargins: {
          top: 0.85,
          bottom: 0,
        },
        priceLineVisible: false,
        lastValueVisible: false,
      });
      volumeSeriesRef.current = volumeSeries;
      
      // Configure volume scale separately
      chart.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.9,
          bottom: 0,
        },
      });
    }

    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartContainerRef.current) {
        const tooltips = chartContainerRef.current.querySelectorAll('div[style*="position: absolute"]');
        tooltips.forEach(tooltip => tooltip.remove());
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
  }, [chartType, isDark, isMobile, data]); // Need data dependency but prevent unnecessary recreations

  // Handle fullscreen resize
  useEffect(() => {
    if (chartRef.current && chartContainerRef.current) {
      const newHeight = isFullscreen ? window.innerHeight - 120 : (isMobile ? 380 : 550);
      chartRef.current.applyOptions({ 
        width: chartContainerRef.current.clientWidth,
        height: newHeight 
      });
    }
  }, [isFullscreen, isMobile]);

  // Separate effect to update data on chart series
  useEffect(() => {
    // Skip if chart isn't ready yet - the chart creation effect will handle initial data
    if (!chartRef.current) {
      return;
    }
    
    const chartData = chartType === 'holders' ? holderData : data;
    if (!chartData || chartData.length === 0) {
      return;
    }

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
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderUpColor: '#26a69a',
        borderDownColor: '#ef5350',
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
        borderVisible: true,
        wickVisible: true,
      });
      candleSeriesRef.current = candleSeries;
    }
    
    if ((chartType === 'line' || chartType === 'holders') && !lineSeriesRef.current) {
      const seriesOptions = chartType === 'holders' ? {
        lineColor: '#9c27b0',
        topColor: 'rgba(156, 39, 176, 0.56)',
        bottomColor: 'rgba(156, 39, 176, 0.04)',
      } : {
        lineColor: theme.palette.primary.main,
        topColor: theme.palette.primary.main + '80',
        bottomColor: theme.palette.primary.main + '08',
      };
      
      const areaSeries = chartRef.current.addSeries(AreaSeries, {
        ...seriesOptions,
        lineWidth: 2,
        lineStyle: 0,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
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
        lastValueVisible: false,
      });
      volumeSeriesRef.current = volumeSeries;
      
      // Configure volume scale separately
      chartRef.current.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.9,
          bottom: 0,
        },
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
      const scaledData = scaleFactor === 1 ? chartData : chartData.map(d => ({
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
        
        if (scaleFactor > 1) {
          console.log('🔍 [PriceScale] Applied scaling factor:', scaleFactor, 'for small prices');
        }
      }
    } else if (chartType === 'line' && lineSeriesRef.current) {
      // Calculate scale factor for small prices
      const scaleFactor = getScaleFactor(chartData);
      scaleFactorRef.current = scaleFactor;
      
      const lineData = chartData.map(d => ({ 
        time: d.time, 
        value: (d.close || d.value) * scaleFactor 
      }));
      
      if (isAutoUpdate && lineData.length > 0) {
        const lastPoint = lineData[lineData.length - 1];
        lineSeriesRef.current.update(lastPoint);
      } else {
        lineSeriesRef.current.setData(lineData);
        
        if (scaleFactor > 1) {
          console.log('🔍 [PriceScale] Line: Applied scaling factor:', scaleFactor, 'for small prices');
        }
      }
    } else if (chartType === 'holders' && lineSeriesRef.current) {
      const holdersLineData = chartData.map(d => ({ time: d.time, value: d.value || d.holders }));
      if (isAutoUpdate && holdersLineData.length > 0) {
        const lastPoint = holdersLineData[holdersLineData.length - 1];
        lineSeriesRef.current.update(lastPoint);
      } else {
        lineSeriesRef.current.setData(holdersLineData);
      }
    }

    // Update volume series
    if (chartType !== 'holders' && volumeSeriesRef.current && data) {
      const volumeData = data.map(d => ({
        time: d.time,
        value: d.volume || 0,
        color: d.close >= d.open 
          ? (isDark ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.3)')
          : (isDark ? 'rgba(244, 67, 54, 0.2)' : 'rgba(244, 67, 54, 0.3)')
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

  const handleIndicatorToggle = (indicator) => {
    setIndicators(prev => {
      const exists = prev.find(i => i.id === indicator.id);
      if (exists) {
        return prev.filter(i => i.id !== indicator.id);
      } else {
        return [...prev, indicator];
      }
    });
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 2,
        background: isDark 
          ? 'linear-gradient(145deg, rgba(18, 18, 18, 0.9) 0%, rgba(25, 25, 25, 0.9) 100%)' 
          : 'linear-gradient(145deg, rgba(255, 255, 255, 0.9) 0%, rgba(250, 250, 250, 0.9) 100%)',
        backdropFilter: 'blur(10px)',
        boxShadow: isDark 
          ? '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          : '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
        borderRadius: 2,
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
          maxHeight: '100vh',
        })
      }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="h6" sx={{ fontSize: '1rem' }}>
            {token.name} {chartType === 'holders' ? 'Holders' : `Price (${activeFiatCurrency})`} • {range === 'ALL' ? '1Y' : range}
          </Typography>
          {athData.price && chartType !== 'holders' && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
              bgcolor: athData.percentDown < 0 ? 'error.main' : 'success.main',
              color: 'white',
              px: 1,
              py: 0.25,
              borderRadius: 1,
              fontSize: '0.75rem'
            }}>
              <Typography variant="caption" sx={{ fontWeight: 500 }}>
                {athData.percentDown}% from ATH
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                ({currencySymbols[activeFiatCurrency] || ''}{athData.price < 0.000000001 ? athData.price.toFixed(16) : athData.price < 0.00000001 ? athData.price.toFixed(12) : athData.price < 0.01 ? athData.price.toFixed(8) : athData.price.toFixed(4)})
              </Typography>
            </Box>
          )}
          <Box sx={{ 
            ml: 1, 
            minWidth: isUserZoomed ? 180 : 100,
            display: 'inline-flex',
            alignItems: 'center',
            height: 20
          }}>
            {isUpdating ? (
              <CircularProgress size={16} />
            ) : lastUpdate ? (
              <Typography variant="caption" color="text.secondary" sx={{ 
                display: 'inline-flex', 
                alignItems: 'center',
                whiteSpace: 'nowrap'
              }}>
                <RefreshIcon sx={{ fontSize: 12, mr: 0.5 }} />
                {lastUpdate.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  second: '2-digit',
                  hour12: false 
                })}
                {isUserZoomed && ' (paused)'}
              </Typography>
            ) : null}
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <ButtonGroup size="small">
            {Object.entries(chartTypeIcons).map(([type, icon]) => (
              <Button
                key={type}
                onClick={() => setChartType(type)}
                variant={chartType === type ? 'contained' : 'outlined'}
                sx={{ px: 1.5 }}
                startIcon={icon}
              >
                {type === 'holders' ? 'Holders' : type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </ButtonGroup>

          <ButtonGroup size="small">
            {['1D', '7D', '1M', '3M', '1Y', 'ALL'].map(r => (
              <Button
                key={r}
                onClick={() => {
                  setRange(r);
                  setIsUserZoomed(false); // Reset zoom state on range change
                }}
                variant={range === r ? 'contained' : 'outlined'}
                sx={{ px: 1, fontSize: '0.75rem', minWidth: 36 }}
              >
                {r}
              </Button>
            ))}
          </ButtonGroup>

          <PinChartButton
            token={token}
            chartType={chartType}
            range={range}
            indicators={indicators}
            activeFiatCurrency={activeFiatCurrency}
          />

          <IconButton
            size="small"
            onClick={handleFullscreen}
            sx={{ ml: 1 }}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </IconButton>

          <IconButton
            size="small"
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{ ml: 1 }}
          >
            <MoreVertIcon />
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem disabled sx={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
              Indicators
            </MenuItem>
            {indicatorOptions.map(indicator => (
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
                      bgcolor: indicators.find(i => i.id === indicator.id) 
                        ? theme.palette.primary.main 
                        : 'transparent'
                    }}
                  >
                    {indicators.find(i => i.id === indicator.id) && (
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

      <Box sx={{ 
        position: 'relative', 
        height: isFullscreen ? 'calc(100vh - 120px)' : (isMobile ? 380 : 550),
        borderRadius: 1,
        overflow: 'hidden'
      }}>
        {(() => {
          
          if (loading) {
            return (
              <Box sx={{ 
                position: 'absolute', 
                inset: 0, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <Typography color="text.secondary">Loading chart data...</Typography>
              </Box>
            );
          } else if (!data || data.length === 0) {
            return (
              <Box sx={{ 
                position: 'absolute', 
                inset: 0, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <Typography color="text.secondary">No data available</Typography>
              </Box>
            );
          } else {
            return (
              <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
            );
          }
        })()}
      </Box>
    </Paper>
  );
});

PriceChartAdvanced.displayName = 'PriceChartAdvanced';

export default PriceChartAdvanced;