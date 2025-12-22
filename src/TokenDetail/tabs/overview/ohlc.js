import { useState, useEffect, useRef, memo, useContext, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styled from '@emotion/styled';
import { TrendingUp, CandlestickChart, Users, Maximize, Minimize, Loader2 } from 'lucide-react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  AreaSeries
} from 'lightweight-charts';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';
import { AppContext } from 'src/AppContext';

// Module-level cache to prevent duplicate fetches in StrictMode
const fetchInFlight = new Map(); // stores pending promises

// Process OHLC data
const processOhlc = (ohlc) => {
  const MAX_CHART_VALUE = 90071992547409;
  const MIN_CHART_VALUE = 1e-12;
  return ohlc
    .filter(candle =>
      candle[1] > MIN_CHART_VALUE && candle[1] < MAX_CHART_VALUE &&
      candle[2] > MIN_CHART_VALUE && candle[2] < MAX_CHART_VALUE &&
      candle[3] > MIN_CHART_VALUE && candle[3] < MAX_CHART_VALUE &&
      candle[4] > MIN_CHART_VALUE && candle[4] < MAX_CHART_VALUE
    )
    .map((candle) => ({
      time: Math.floor(candle[0] / 1000),
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
      volume: candle[5] || 0
    }))
    .sort((a, b) => a.time - b.time);
};

// Constants
const currencySymbols = {
  USD: '$ ',
  EUR: '€ ',
  JPY: '¥ ',
  CNH: '¥ ',
  XRP: '✕ '
};

const formatMcap = (value) => {
  if (!value || value === 0) return '0';
  if (value >= 1e12) return (value / 1e12).toFixed(2) + 'T';
  if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B';
  if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M';
  if (value >= 1e3) return (value / 1e3).toFixed(2) + 'K';
  return value.toFixed(2);
};

const Card = styled.div`
  width: 100%;
  height: 100%;
  padding: ${props => props.isMobile ? '10px' : '14px'};
  background: ${props => props.isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.01)'};
  border: 1px solid ${props => props.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'};
  border-radius: 12px;
  position: relative;
  z-index: 1;
  overflow: hidden;
  ${props => props.isFullscreen && `
    position: fixed;
    inset: 0;
    z-index: 99999;
    border-radius: 0;
    background: ${props.isDark ? '#0a0f16' : '#fff'};
    border: none;
    padding: 16px 20px;
    overflow: hidden;
  `}
`;

const Box = styled.div``;

const Typography = styled.span`
  font-size: ${props => props.variant === 'h6' ? '12px' : '11px'};
  font-weight: ${props => props.fontWeight || 400};
  color: ${props =>
    props.color === 'text.secondary' ? (props.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)') :
    props.color === 'warning.main' ? '#f59e0b' :
    (props.isDark ? 'rgba(255,255,255,0.9)' : '#1a1a1a')
  };
`;

const ButtonGroup = styled.div`
  display: flex;
  padding: 2px;
  border-radius: 8px;
  background: ${props => props.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'};
  gap: 1px;
  & > button { border-radius: 6px; border: none; }
`;

const Button = styled.button`
  padding: ${props => props.isMobile ? '4px 6px' : '5px 10px'};
  font-size: ${props => props.isMobile ? '10px' : '11px'};
  min-width: ${props => props.minWidth || 'auto'};
  height: ${props => props.isMobile ? '24px' : '26px'};
  border-radius: 6px;
  font-weight: ${props => props.isActive ? 500 : 400};
  border: none;
  background: ${props => props.isActive ? (props.isDark ? 'rgba(255,255,255,0.95)' : '#fff') : 'transparent'};
  color: ${props => props.isActive ? (props.isDark ? '#111' : '#333') : (props.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)')};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  transition: all 0.15s ease;
  box-shadow: ${props => props.isActive ? '0 1px 2px rgba(0,0,0,0.08)' : 'none'};
  &:hover {
    background: ${props => props.isActive ? (props.isDark ? '#fff' : '#fff') : (props.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)')};
    color: ${props => props.isActive ? (props.isDark ? '#111' : '#333') : (props.isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)')};
  }
  & svg { width: ${props => props.isMobile ? '11px' : '12px'}; height: ${props => props.isMobile ? '11px' : '12px'}; }
`;

const Spinner = styled(Loader2)`
  animation: spin 1s linear infinite;
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const PriceChartAdvanced = memo(({ token }) => {
  const { activeFiatCurrency, themeName } = useContext(AppContext);
  const metrics = useSelector(selectMetrics);
  const isDark = themeName === 'XrplToDarkTheme';
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const lineSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const lastChartTypeRef = useRef(null);

  // Reactive viewport state
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 600);
      setIsTablet(window.innerWidth < 900);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  const [chartType, setChartType] = useState('candles');
  const [timeRange, setTimeRange] = useState('5d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [holderData, setHolderData] = useState(null);
  const [isUserZoomed, setIsUserZoomed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

  // ATH from token prop
  const athData = useMemo(() => {
    if (token?.athMarketcap) {
      const athMcap = token.athMarketcap;
      const currentMcap = token.marketcap || 0;
      const percentFromATH = athMcap > 0 ? (((currentMcap - athMcap) / athMcap) * 100).toFixed(2) : 0;
      return { percentDown: percentFromATH, athMcap };
    }
    return { percentDown: null, athMcap: null };
  }, [token?.athMarketcap, token?.marketcap]);

  const isUserZoomedRef = useRef(false);
  const zoomStateRef = useRef(null);
  const dataRef = useRef(null);
  const holderDataRef = useRef(null);
  const activeFiatCurrencyRef = useRef(activeFiatCurrency);
  const chartCreatedRef = useRef(false);
  const loadMoreDataRef = useRef(null);
  const isLoadingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);

  const BASE_URL = 'https://api.xrpl.to/api';
  const OHLC_ENDPOINT = `${BASE_URL}/ohlc`;
  const WS_OHLC_URL = 'wss://api.xrpl.to/ws/ohlc';

  // Memoize icons to prevent recreation
  const chartTypeIcons = useMemo(() => ({
    candles: <CandlestickChart />,
    line: <TrendingUp />,
    holders: <Users />
  }), []);

  // Refs for cleanup and performance
  const toolTipRef = useRef(null);
  const chartTypeRef = useRef(chartType);
  const loadMoreAbortRef = useRef(null);
  const crosshairRafRef = useRef(null);
  const wsRef = useRef(null);
  const wsPingRef = useRef(null);
  const metricsRef = useRef(metrics);

  // Update refs when values change (combined for efficiency)
  useEffect(() => {
    activeFiatCurrencyRef.current = activeFiatCurrency;
    metricsRef.current = metrics;
    isUserZoomedRef.current = isUserZoomed;
    hasMoreRef.current = hasMore;
    chartTypeRef.current = chartType;
  }, [activeFiatCurrency, metrics, isUserZoomed, hasMore, chartType]);


  // Helper functions
  const convertScientific = useCallback((value) => {
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
  }, []);

  // Load more historical data (infinite scroll) - disabled for 'all' timerange
  const loadMoreData = useCallback(async () => {
    if (!token?.md5 || isLoadingMoreRef.current || !hasMore || !dataRef.current?.length || timeRange === 'all') {
      return;
    }

    // Cancel previous request
    if (loadMoreAbortRef.current) loadMoreAbortRef.current.abort();
    loadMoreAbortRef.current = new AbortController();

    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    try {
      const presetResolutions = { '1d': '15', '5d': '15', '1m': '60', '3m': '240', '1y': 'D', '5y': 'W', 'all': 'D' };
      const resolution = presetResolutions[timeRange] || '15';
      const oldestTime = dataRef.current[0].time * 1000;
      const barsToLoad = 200;

      const endpoint = `${OHLC_ENDPOINT}/${token.md5}?resolution=${resolution}&cb=${barsToLoad}&abn=${oldestTime}&vs_currency=${activeFiatCurrency}`;
      const response = await axios.get(endpoint, { signal: loadMoreAbortRef.current.signal });

      if (response.data?.ohlc && response.data.ohlc.length > 0) {
        const MAX_CHART_VALUE = 90071992547409;
        const MIN_CHART_VALUE = 1e-12;

        const olderData = response.data.ohlc
          .filter(candle =>
            candle[1] > MIN_CHART_VALUE && candle[1] < MAX_CHART_VALUE &&
            candle[2] > MIN_CHART_VALUE && candle[2] < MAX_CHART_VALUE &&
            candle[3] > MIN_CHART_VALUE && candle[3] < MAX_CHART_VALUE &&
            candle[4] > MIN_CHART_VALUE && candle[4] < MAX_CHART_VALUE
          )
          .map((candle) => ({
            time: Math.floor(candle[0] / 1000),
            open: candle[1],
            high: candle[2],
            low: candle[3],
            close: candle[4],
            volume: candle[5] || 0
          }))
          .sort((a, b) => a.time - b.time);

        setData(prev => {
          if (!prev || prev.length === 0) {
            dataRef.current = olderData;
            return olderData;
          }
          // Merge and dedupe by time, then sort ascending
          const timeMap = new Map();
          olderData.forEach(d => timeMap.set(d.time, d));
          prev.forEach(d => timeMap.set(d.time, d)); // prev overwrites older
          const merged = Array.from(timeMap.values()).sort((a, b) => a.time - b.time);
          dataRef.current = merged;
          return merged;
        });

        setHasMore(response.data.ohlc.length >= barsToLoad * 0.5);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error('Load more error:', error.message);
      }
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [token?.md5, timeRange, activeFiatCurrency, hasMore]);

  // Keep ref updated
  useEffect(() => {
    loadMoreDataRef.current = loadMoreData;
  }, [loadMoreData]);

  // Map timeRange to WebSocket interval (matches HTTP resolution)
  const getWsInterval = useCallback((range) => {
    const intervalMap = { '1d': '1m', '5d': '5m', '1m': '30m', '3m': '2h', '1y': '1w', '5y': '1w', 'all': '1d' };
    return intervalMap[range] || '5m';
  }, []);

  // Fetch price data via WebSocket with HTTP fallback for historical data
  useEffect(() => {
    if (!token?.md5) return;

    let mounted = true;
    const wsInterval = getWsInterval(timeRange);

    // Close existing WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (wsPingRef.current) {
      clearInterval(wsPingRef.current);
      wsPingRef.current = null;
    }

    // Fetch via HTTP first to get enough historical data for all timeframes
    const needsHttpFetch = true;

    const fetchHistoricalData = async () => {
      // Candle resolution per timeframe (like Dexscreener)
      const presets = {
        '1d':  { resolution: '1',   cb: 43200 }, // 1min candles, 30 days
        '5d':  { resolution: '5',   cb: 8640  }, // 5min candles, 30 days (default)
        '1m':  { resolution: '30',  cb: 1440  }, // 30min candles, 30 days
        '3m':  { resolution: '120', cb: 1080  }, // 2h candles, 90 days (we don't have 6m, using 3m)
        '1y':  { resolution: 'W',   cb: 52    }, // 1 week candles, 1 year
        '5y':  { resolution: 'W',   cb: 260   }, // 1 week candles, 5 years
        'all': { resolution: 'D',   cb: 5000  }  // Daily candles, all time
      };
      const preset = presets[timeRange];
      if (!preset) return;

      try {
        setLoading(true);
        const endpoint = `${OHLC_ENDPOINT}/${token.md5}?resolution=${preset.resolution}&cb=${preset.cb}&vs_currency=${activeFiatCurrency}`;
        const response = await axios.get(endpoint);
        if (mounted && response.data?.ohlc) {
          const processedData = processOhlc(response.data.ohlc);
          dataRef.current = processedData;
          setData(processedData);
          setLastUpdate(new Date());
          setHasMore(timeRange !== 'all');
        }
      } catch (error) {
        console.error('Historical fetch error:', error.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // Connect WebSocket for real-time updates
    const connectWebSocket = () => {
      if (!mounted) return;

      const ws = new WebSocket(`${WS_OHLC_URL}/${token.md5}?interval=${wsInterval}&vs_currency=${activeFiatCurrency}`);
      wsRef.current = ws;

      ws.onopen = () => {
        // Keep-alive ping every 30s
        wsPingRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        if (!mounted) return;
        const msg = JSON.parse(event.data);

        if (msg.type === 'initial' && msg.ohlc) {
          // Skip WS initial data - we use HTTP fetch for all timeframes to get more history
        } else if (msg.e === 'kline' && msg.k) {
          // Real-time candle update
          const k = msg.k;
          const candleTime = Math.floor(k.t / 1000);

          const newCandle = {
            time: candleTime,
            open: parseFloat(k.o),
            high: parseFloat(k.h),
            low: parseFloat(k.l),
            close: parseFloat(k.c),
            volume: parseFloat(k.v) || 0
          };

          // Skip updates when user is zoomed/panning
          if (isUserZoomedRef.current) return;

          setData(prev => {
            if (!prev || prev.length === 0) return prev;
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            const lastTime = updated[lastIdx]?.time;

            if (lastTime === candleTime) {
              // Update existing candle
              updated[lastIdx] = newCandle;
            } else if (candleTime > lastTime) {
              // New candle
              updated.push(newCandle);
            } else {
              return prev; // Candle older than last, skip
            }
            dataRef.current = updated;
            return updated;
          });
          setLastUpdate(new Date());
        }
      };

      ws.onerror = (error) => {
        console.error('OHLC WebSocket error:', error);
      };

      ws.onclose = (event) => {
        if (wsPingRef.current) {
          clearInterval(wsPingRef.current);
          wsPingRef.current = null;
        }
        // Reconnect on unexpected close (not user-initiated)
        if (mounted && event.code !== 1000) {
          setTimeout(connectWebSocket, 3000);
        }
      };
    };

    // Fetch historical data first, then connect WS for real-time updates
    fetchHistoricalData().then(() => {
      if (mounted) connectWebSocket();
    });

    return () => {
      mounted = false;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (wsPingRef.current) {
        clearInterval(wsPingRef.current);
        wsPingRef.current = null;
      }
    };
  }, [token.md5, timeRange, activeFiatCurrency, getWsInterval]);

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
        // Holder data uses ALL range by default for maximum history
        const endpoint = `${BASE_URL}/holders/graph/${token.md5}?range=ALL`;

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
  }, [token.md5, BASE_URL, chartType]);

  // Track if we have data for chart creation
  const hasData = chartType === 'holders'
    ? holderData && holderData.length > 0
    : data && data.length > 0;

  // Create chart only when chart type changes AND relevant data is available
  useEffect(() => {
    // Don't create chart if no data yet
    if (!chartContainerRef.current || !hasData) {
      return;
    }

    // Skip if chart already created for this type
    if (chartCreatedRef.current && lastChartTypeRef.current === chartType) {
      return;
    }

    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch (e) {}
      chartRef.current = null;
      candleSeriesRef.current = null;
      lineSeriesRef.current = null;
      volumeSeriesRef.current = null;
      chartCreatedRef.current = false;
    }

    lastChartTypeRef.current = chartType;

    const containerHeight = chartContainerRef.current.clientHeight || (isMobile ? 360 : 570);
    const containerWidth = chartContainerRef.current.clientWidth || 600;
    const chart = createChart(chartContainerRef.current, {
      width: containerWidth,
      height: containerHeight,
      layout: {
        background: {
          type: 'solid',
          color: 'transparent'
        },
        textColor: isDark ? '#FFFFFF' : '#212B36',
        fontSize: isMobile ? 9 : 11,
        fontFamily: "'Segoe UI', Roboto, Arial, sans-serif"
      },
      grid: {
        vertLines: {
          color: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
          style: 0
        },
        horzLines: {
          color: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
          style: 0
        }
      },
      crosshair: {
        mode: 0,
        vertLine: {
          color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)',
          width: 1,
          style: 3,
          labelBackgroundColor: '#147DFE'
        },
        horzLine: {
          color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)',
          width: 1,
          style: 3,
          labelBackgroundColor: '#147DFE'
        }
      },
      rightPriceScale: {
        borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
        scaleMargins: {
          top: 0.05,
          bottom: 0.25
        },
        mode: 0,
        autoScale: true,
        borderVisible: true,
        visible: true,
        entireTextOnly: false,
        drawTicks: true,
        ticksVisible: true,
        alignLabels: true,
        textColor: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)'
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

          const symbol = currencySymbols[activeFiatCurrencyRef.current] || '';
          const isXRP = activeFiatCurrencyRef.current === 'XRP';

          if (isXRP) {
            if (price < 0.000001) {
              return symbol + price.toFixed(8);
            } else if (price < 0.001) {
              return symbol + price.toFixed(6);
            } else if (price < 1) {
              return symbol + price.toFixed(4);
            } else if (price < 100) {
              return symbol + price.toFixed(3);
            } else if (price < 1000) {
              return symbol + price.toFixed(2);
            } else {
              return symbol + price.toFixed(1);
            }
          }

          if (price < 0.001) {
            const str = price.toFixed(20);
            const zeros = str.match(/0\.0*/)?.[0]?.length - 2 || 0;
            if (zeros >= 4) {
              const significant = str.replace(/^0\.0+/, '').replace(/0+$/, '');
              return symbol + '0.0(' + zeros + ')' + significant.slice(0, 4);
            }
            return symbol + price.toFixed(8);
          } else if (price < 0.01) {
            return symbol + price.toFixed(6);
          } else if (price < 1) {
            return symbol + price.toFixed(4);
          } else if (price < 100) {
            return symbol + price.toFixed(3);
          } else if (price < 1000) {
            return symbol + price.toFixed(2);
          } else if (price < 10000) {
            return symbol + price.toFixed(1);
          } else {
            return symbol + Math.round(price).toLocaleString();
          }
        }
      },
      timeScale: {
        visible: true,
        borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
        borderVisible: true,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        barSpacing: isMobile ? 10 : 14,
        minBarSpacing: isMobile ? 5 : 8,
        fixLeftEdge: true,   // Prevent scrolling past oldest data
        fixRightEdge: true,  // Prevent scrolling past newest data
        rightBarStaysOnScroll: true,
        lockVisibleTimeRangeOnResize: true,
        shiftVisibleRangeOnNewBar: true,
        tickMarkFormatter: (time, tickMarkType, locale) => {
          const date = new Date(time * 1000);
          // Convert to EST (America/New_York handles EST/EDT automatically)
          const estOptions = { timeZone: 'America/New_York' };
          const estDate = new Date(date.toLocaleString('en-US', estOptions));
          const hours24 = estDate.getHours();
          const hours12 = hours24 % 12 || 12;
          const ampm = hours24 >= 12 ? 'PM' : 'AM';
          const minutes = estDate.getMinutes().toString().padStart(2, '0');
          const day = estDate.getDate();
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const month = months[estDate.getMonth()];
          // tickMarkType: 0=time, 1=time, 2=day, 3=month, 4=year
          if (tickMarkType >= 4) {
            return `${month} '${estDate.getFullYear().toString().slice(-2)}`;
          }
          if (tickMarkType === 3) {
            return `${month} ${day}`;
          }
          if (tickMarkType === 2) {
            return `${day} ${hours12}:${minutes}${ampm}`;
          }
          // For intraday, show time
          return `${hours12}:${minutes}${ampm}`;
        }
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true
      }
    });

    chartRef.current = chart;
    chartCreatedRef.current = true;

    let zoomCheckTimeout;
    let loadMoreTimeout;

    // Subscribe and store for cleanup - optimized to avoid re-renders during zoom
    const rangeUnsubscribe = chart.timeScale().subscribeVisibleLogicalRangeChange((logicalRange) => {
      if (!logicalRange || !dataRef.current || dataRef.current.length === 0) {
        return;
      }

      // Save zoom state for restoration
      zoomStateRef.current = logicalRange;

      // Debounce state updates to prevent lag during zoom
      clearTimeout(zoomCheckTimeout);
      zoomCheckTimeout = setTimeout(() => {
        const dataLength = dataRef.current.length;
        // Only pause if user scrolled away from the right edge (not viewing latest)
        const isScrolledRight = logicalRange.to < dataLength - 2;

        const shouldPauseUpdates = isScrolledRight;

        // Only update ref, avoid setState during active zooming
        if (shouldPauseUpdates !== isUserZoomedRef.current) {
          isUserZoomedRef.current = shouldPauseUpdates;
          // Batch state update with longer delay to avoid re-render during zoom
          setTimeout(() => setIsUserZoomed(shouldPauseUpdates), 200);
        }

        // Use ref to avoid stale closure
        if (chartTypeRef.current !== 'holders' && logicalRange.from < 30 && !isLoadingMoreRef.current) {
          clearTimeout(loadMoreTimeout);
          loadMoreTimeout = setTimeout(() => {
            if (loadMoreDataRef.current) {
              loadMoreDataRef.current();
            }
          }, 500);
        }
      }, 150);
    });

    const toolTip = document.createElement('div');
    toolTip.style = `width: ${isMobile ? '105px' : '120px'}; position: absolute; display: none; padding: ${isMobile ? '6px' : '8px'}; font-size: ${isMobile ? '9px' : '10px'}; z-index: 1000; top: 6px; left: 6px; pointer-events: none; border-radius: 8px; background: ${isDark ? 'rgba(10,15,22,0.95)' : 'rgba(255,255,255,0.95)'}; backdrop-filter: blur(8px); color: ${isDark ? 'rgba(255,255,255,0.9)' : '#1a1a1a'}; border: 1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`;
    chartContainerRef.current.appendChild(toolTip);
    toolTipRef.current = toolTip;

    // Debounced crosshair handler with rAF
    const crosshairUnsubscribe = chart.subscribeCrosshairMove((param) => {
      if (crosshairRafRef.current) cancelAnimationFrame(crosshairRafRef.current);

      crosshairRafRef.current = requestAnimationFrame(() => {
        if (!param.time || !param.point || param.point.x < 0 || param.point.y < 0 ||
            param.point.x > chartContainerRef.current?.clientWidth ||
            param.point.y > chartContainerRef.current?.clientHeight) {
          toolTip.style.display = 'none';
          return;
        }

        // Binary search for O(log n) lookup (data is sorted by time)
        const currentData = chartTypeRef.current === 'holders' ? holderDataRef.current : dataRef.current;
        if (!currentData || currentData.length === 0) {
          toolTip.style.display = 'none';
          return;
        }
        // Binary search
        let left = 0, right = currentData.length - 1, candle = null;
        while (left <= right) {
          const mid = (left + right) >> 1;
          if (currentData[mid].time === param.time) {
            candle = currentData[mid];
            break;
          }
          if (currentData[mid].time < param.time) left = mid + 1;
          else right = mid - 1;
        }
        if (!candle) {
          toolTip.style.display = 'none';
          return;
        }

        const date = new Date(param.time * 1000);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });
        const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' });
        const symbol = currencySymbols[activeFiatCurrencyRef.current] || '';
        const isXRP = activeFiatCurrencyRef.current === 'XRP';
        const currentChartType = chartTypeRef.current;

        const formatPrice = (p) => {
          if (p && p < 0.001) {
            const str = p.toFixed(20);
            const zeros = str.match(/0\.0*/)?.[0]?.length - 2 || 0;
            if (zeros >= 3) {
              const significant = str.replace(/^0\.0+/, '').replace(/0+$/, '');
              return '0.0(' + zeros + ')' + significant.slice(0, isXRP ? 6 : 4);
            }
          }
          if (p < 0.00001) return p.toFixed(isXRP ? 10 : 8);
          if (p < 0.001) return p.toFixed(isXRP ? 8 : 6);
          if (p < 0.01) return p.toFixed(isXRP ? 8 : 6);
          if (p < 1) return p.toFixed(isXRP ? 6 : 4);
          if (p < 100) return p.toFixed(3);
          if (p < 1000) return p.toFixed(2);
          return p.toLocaleString();
        };

        const row = (l, v, c) => `<div style="display:flex;justify-content:space-between;line-height:1.3;${c ? `color:${c}` : ''}"><span style="opacity:0.6">${l}</span><span>${v}</span></div>`;
        const sep = `<div style="height:1px;background:${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'};margin:3px 0"></div>`;

        let ohlcData = '';
        if (currentChartType === 'candles') {
          const change = (((candle.close - candle.open) / candle.open) * 100).toFixed(2);
          const color = candle.close >= candle.open ? '#22c55e' : '#ef4444';
          ohlcData = `<div style="opacity:0.6;margin-bottom:3px;font-size:9px">${dateStr} ${timeStr}</div>
            ${row('O', symbol + formatPrice(candle.open))}${row('H', symbol + formatPrice(candle.high))}
            ${row('L', symbol + formatPrice(candle.low))}${row('C', symbol + formatPrice(candle.close), color)}
            ${sep}${row('Vol', candle.volume.toLocaleString())}${row('Chg', change + '%', color)}`;
        } else if (currentChartType === 'line') {
          ohlcData = `<div style="opacity:0.6;margin-bottom:3px;font-size:9px">${dateStr} ${timeStr}</div>
            ${row('Price', symbol + formatPrice(candle.close || candle.value))}${row('Vol', (candle.volume || 0).toLocaleString())}`;
        } else if (currentChartType === 'holders') {
          ohlcData = `<div style="opacity:0.6;margin-bottom:3px;font-size:9px">${dateStr}</div>
            ${row('Holders', (candle.holders || candle.value).toLocaleString())}
            ${candle.top10 !== undefined ? sep + row('Top 10', candle.top10.toFixed(1) + '%') + row('Top 20', candle.top20.toFixed(1) + '%') + row('Top 50', candle.top50.toFixed(1) + '%') : ''}`;
        }

        toolTip.innerHTML = ohlcData;
        toolTip.style.display = 'block';
        const tipWidth = isMobile ? 115 : 130;
        toolTip.style.left = Math.max(0, Math.min(chartContainerRef.current.clientWidth - tipWidth, param.point.x - 50)) + 'px';
        // Dynamic vertical positioning
        const yPos = param.point.y > chartContainerRef.current.clientHeight / 2 ? 8 : param.point.y + 20;
        toolTip.style.top = yPos + 'px';
      });
    });

    if (chartType === 'candles') {
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderUpColor: '#22c55e',
        borderDownColor: '#ef4444',
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
        priceFormat: {
          type: 'price',
          minMove: 0.00000001,
          precision: 8
        }
      });
      candleSeriesRef.current = candleSeries;
    } else if (chartType === 'line') {
      const areaSeries = chart.addSeries(AreaSeries, {
        lineColor: '#3b82f6',
        topColor: 'rgba(59, 130, 246, 0.25)',
        bottomColor: 'rgba(59, 130, 246, 0.02)',
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 3,
        crosshairMarkerBorderColor: '#3b82f6',
        crosshairMarkerBackgroundColor: isDark ? '#000' : '#fff',
        priceFormat: {
          type: 'price',
          minMove: 0.00000001,
          precision: 8
        }
      });
      lineSeriesRef.current = areaSeries;
    } else if (chartType === 'holders') {
      const holdersSeries = chart.addSeries(AreaSeries, {
        lineColor: '#a855f7',
        topColor: 'rgba(168, 85, 247, 0.25)',
        bottomColor: 'rgba(168, 85, 247, 0.02)',
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 3,
        crosshairMarkerBorderColor: '#a855f7',
        crosshairMarkerBackgroundColor: isDark ? '#000' : '#fff',
        priceFormat: {
          type: 'price',
          minMove: 1,
          precision: 0
        }
      });
      lineSeriesRef.current = holdersSeries;
    }

    if (chartType !== 'holders') {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: 'rgba(34, 197, 94, 0.6)',
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
        scaleMargins: { top: 0.65, bottom: 0 },
        priceLineVisible: false,
        lastValueVisible: false
      });
      volumeSeriesRef.current = volumeSeries;
      chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.7, bottom: 0 } });
    }

    // Debounced resize with ResizeObserver
    let resizeTimeout;
    const resizeObserver = new ResizeObserver((entries) => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (!chartRef.current || !entries[0]) return;
        const { width, height } = entries[0].contentRect;
        if (width > 0 && height > 0) {
          chartRef.current.applyOptions({ width, height });
        }
      }, 100);
    });

    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }

    return () => {
      clearTimeout(zoomCheckTimeout);
      clearTimeout(loadMoreTimeout);
      clearTimeout(resizeTimeout);
      resizeObserver.disconnect();

      // Unsubscribe from chart events
      if (rangeUnsubscribe) rangeUnsubscribe();
      if (crosshairUnsubscribe) crosshairUnsubscribe();
      if (crosshairRafRef.current) cancelAnimationFrame(crosshairRafRef.current);

      // Remove tooltip explicitly
      if (toolTipRef.current) {
        toolTipRef.current.remove();
        toolTipRef.current = null;
      }

      if (chartRef.current) {
        try {
          chartRef.current.remove();
        } catch (e) {}
        chartRef.current = null;
        candleSeriesRef.current = null;
        lineSeriesRef.current = null;
        volumeSeriesRef.current = null;
        chartCreatedRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartType, isDark, isMobile, hasData]);

  // Handle fullscreen resize
  useEffect(() => {
    if (!chartContainerRef.current || !chartRef.current) return;

    const container = chartContainerRef.current;
    const newHeight = isFullscreen ? window.innerHeight - 100 : isMobile ? 360 : 570;
    const newWidth = container.clientWidth;

    // Use only applyOptions (resize is redundant)
    const timeoutId = setTimeout(() => {
      if (chartRef.current && newWidth > 0) {
        chartRef.current.applyOptions({ width: newWidth, height: newHeight });
      }
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [isFullscreen, isMobile]);

  // Update data on chart series - optimized to skip unnecessary updates
  useEffect(() => {
    if (!chartRef.current) return;

    const chartData = chartType === 'holders' ? holderData : data;
    if (!chartData || chartData.length === 0) return;

    // Always update chart when data changes (real-time WS updates modify last candle)

    // Create series if needed
    if (chartType === 'candles' && !candleSeriesRef.current) {
      candleSeriesRef.current = chartRef.current.addSeries(CandlestickSeries, {
        upColor: '#22c55e', downColor: '#ef4444',
        borderUpColor: '#22c55e', borderDownColor: '#ef4444',
        wickUpColor: '#22c55e', wickDownColor: '#ef4444',
        priceFormat: { type: 'price', minMove: 0.00000001, precision: 8 }
      });
    }

    if ((chartType === 'line' || chartType === 'holders') && !lineSeriesRef.current) {
      const isHolders = chartType === 'holders';
      lineSeriesRef.current = chartRef.current.addSeries(AreaSeries, {
        lineColor: isHolders ? '#a855f7' : '#3b82f6',
        topColor: isHolders ? 'rgba(168, 85, 247, 0.25)' : 'rgba(59, 130, 246, 0.25)',
        bottomColor: isHolders ? 'rgba(168, 85, 247, 0.02)' : 'rgba(59, 130, 246, 0.02)',
        lineWidth: 2, crosshairMarkerVisible: true, crosshairMarkerRadius: 3,
        priceFormat: isHolders ? { type: 'price', minMove: 1, precision: 0 } : { type: 'price', minMove: 0.00000001, precision: 8 }
      });
    }

    if (chartType !== 'holders' && !volumeSeriesRef.current) {
      volumeSeriesRef.current = chartRef.current.addSeries(HistogramSeries, {
        color: 'rgba(34, 197, 94, 0.6)', priceFormat: { type: 'volume' },
        priceScaleId: 'volume', scaleMargins: { top: 0.65, bottom: 0 },
        priceLineVisible: false, lastValueVisible: false
      });
      chartRef.current.priceScale('volume').applyOptions({ scaleMargins: { top: 0.7, bottom: 0 } });
    }

    const currentKey = `${chartType}-${timeRange}-${activeFiatCurrency}`;
    const isNewDataSet = lastChartTypeRef.current !== currentKey;
    const dataLength = chartData.length;

    if (chartType === 'candles' && candleSeriesRef.current) {
      candleSeriesRef.current.setData(chartData);
    } else if (chartType === 'line' && lineSeriesRef.current) {
      lineSeriesRef.current.setData(chartData.map(d => ({
        time: d.time, value: d.close
      })));
    } else if (chartType === 'holders' && lineSeriesRef.current) {
      lineSeriesRef.current.setData(chartData.map(d => ({ time: d.time, value: d.value || d.holders })));
    }

    if (chartType !== 'holders' && volumeSeriesRef.current && data) {
      volumeSeriesRef.current.setData(data.map(d => ({
        time: d.time, value: d.volume || 0,
        color: d.close >= d.open ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'
      })));
    }

    // Reset view on timeframe/currency change - show correct range per timeframe
    if (isNewDataSet) {
      const dataLength = chartData.length;
      // Visible bars based on timeframe (matching the time period)
      const visibleBarsMap = {
        '1d': isMobile ? 120 : 240,  // Show ~4h on load (1min candles)
        '5d': isMobile ? 200 : 400,  // Show ~33h on load (5min candles)
        '1m': isMobile ? 100 : 200,  // Show ~4 days on load (30min candles)
        '3m': isMobile ? 120 : 240,  // Show ~10 days on load (1h candles)
        '1y': isMobile ? 30 : 52,    // Show full year (1w candles)
        '5y': isMobile ? 100 : 200,  // Show ~4 years on load (1w candles)
        'all': dataLength            // Show all data
      };
      const visibleBars = Math.min(visibleBarsMap[timeRange] || 192, dataLength);
      const from = Math.max(0, dataLength - visibleBars);
      chartRef.current.timeScale().setVisibleLogicalRange({ from, to: dataLength + 5 });
      lastChartTypeRef.current = currentKey;
    }
    // Don't restore zoom state on every update - it causes flickering
  }, [data, holderData, chartType, timeRange, activeFiatCurrency, isMobile]);

  const handleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => {
      const next = !prev;
      document.body.style.overflow = next ? 'hidden' : '';
      return next;
    });
  }, []);

  // Cleanup body overflow on unmount + ESC key to exit fullscreen
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        document.body.style.overflow = '';
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  return (
    <Card isDark={isDark} isMobile={isMobile} isFullscreen={isFullscreen}>
      <Box style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', marginBottom: isMobile ? '6px' : '8px', gap: isMobile ? '4px' : '6px' }}>
        <Box style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '8px', flexWrap: 'wrap' }}>
          <Typography variant="h6" isDark={isDark}>
            {token.name} {chartType === 'holders' ? 'Holders' : `(${activeFiatCurrency})`}
          </Typography>
          {athData.athMcap > 0 && chartType !== 'holders' && (() => {
            const progressPercent = Math.max(0, Math.min(100, 100 + parseFloat(athData.percentDown)));
            const isNearATH = progressPercent > 80;
            const isCritical = progressPercent < 20;
            return (
              <Box style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 8px',
                borderRadius: '6px',
                background: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.015)',
              }}>
                <span style={{
                  fontSize: '9px',
                  fontWeight: 400,
                  color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px'
                }}>ATH</span>

                {/* Progress bar container */}
                <Box style={{
                  position: 'relative',
                  width: isMobile ? '50px' : '70px',
                  height: '4px',
                  borderRadius: '2px',
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                  overflow: 'hidden'
                }}>
                  {/* Progress fill */}
                  <Box style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: `${progressPercent}%`,
                    borderRadius: '2px',
                    background: isNearATH ? '#22c55e' : isCritical ? '#ef4444' : '#f59e0b',
                    transition: 'width 0.15s ease'
                  }} />
                </Box>

                {/* Percentage text */}
                <span style={{
                  fontSize: '10px',
                  fontWeight: 400,
                  fontFamily: 'monospace',
                  color: isNearATH ? '#22c55e' : isCritical ? '#ef4444' : '#f59e0b',
                  minWidth: '40px',
                  textAlign: 'right'
                }}>
                  {athData.percentDown > 0 ? '+' : ''}{athData.percentDown}%
                </span>

                {/* ATH value */}
                <span style={{
                  fontSize: '10px',
                  color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
                  fontFamily: 'monospace',
                  borderLeft: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                  paddingLeft: '6px'
                }}>
                  {currencySymbols[activeFiatCurrency] || ''}{formatMcap(athData.athMcap)}
                </span>
              </Box>
            );
          })()}
          {lastUpdate && (
            <Box style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.5 }}>
              <Box style={{ width: '4px', height: '4px', borderRadius: '50%', background: isUserZoomed ? '#f59e0b' : '#22c55e' }} />
              <span style={{ fontSize: '11px', fontFamily: 'monospace', color: isDark ? '#fff' : '#1a1a1a' }}>
                {lastUpdate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
              </span>
              {isUserZoomed && <span style={{ fontSize: '10px', color: '#f59e0b', textTransform: 'uppercase' }}>paused</span>}
            </Box>
          )}
        </Box>

        <Box style={{ display: 'flex', gap: isMobile ? '3px' : '4px', flexWrap: 'wrap', alignItems: 'center', justifyContent: isMobile ? 'space-between' : 'flex-start' }}>
          <ButtonGroup>
            {Object.entries(chartTypeIcons).map(([type, icon]) => (
              <Button key={type} onClick={() => setChartType(type)} isActive={chartType === type} isMobile={isMobile} isDark={isDark}>
                {icon}
                {!isMobile && (type === 'holders' ? 'Holders' : type.charAt(0).toUpperCase() + type.slice(1))}
              </Button>
            ))}
          </ButtonGroup>

          <ButtonGroup>
            {(isMobile ? ['1d', '5d', '1m', '1y', 'all'] : ['1d', '5d', '1m', '3m', '1y', '5y', 'all']).map((range) => (
              <Button
                key={range}
                onClick={() => {
                  setTimeRange(range);
                  setIsUserZoomed(false);
                }}
                isActive={timeRange === range}
                isMobile={isMobile}
                isDark={isDark}
                minWidth={isMobile ? '24px' : '28px'}
              >
                {range.toUpperCase()}
              </Button>
            ))}
          </ButtonGroup>

          <Button
            onClick={handleFullscreen}
            isDark={isDark}
            isMobile={isMobile}
            style={isFullscreen ? {
              background: '#ef4444',
              borderColor: '#ef4444',
              color: '#fff'
            } : {}}
          >
            {isFullscreen ? <Minimize /> : <Maximize />}
            {isFullscreen && 'Exit'}
          </Button>
        </Box>
      </Box>

      <Box style={{ position: 'relative', height: isFullscreen ? 'calc(100vh - 80px)' : isMobile ? '360px' : '570px', borderRadius: '8px', overflow: 'hidden' }}>
        <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
        {loading && !chartRef.current && (
          <Box style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Spinner size={20} color={isDark ? '#fff' : '#1a1a1a'} />
          </Box>
        )}
        {isLoadingMore && (
          <Box style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 8px', borderRadius: '6px', background: isDark ? 'rgba(10,15,22,0.9)' : 'rgba(255,255,255,0.95)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
            <Spinner size={11} color={isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'} />
            <span style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }}>Loading...</span>
          </Box>
        )}
        {!loading && !(chartType === 'holders' ? holderData?.length : data?.length) && (
          <Box style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary" isDark={isDark}>No data</Typography>
          </Box>
        )}
      </Box>

      {/* Fullscreen close button - rendered via portal to document.body */}
      {isFullscreen && typeof document !== 'undefined' && createPortal(
        <button
          onClick={handleFullscreen}
          style={{
            position: 'fixed',
            top: 16,
            right: 16,
            zIndex: 999999,
            padding: '8px 16px',
            background: isDark ? 'rgba(239, 68, 68, 0.9)' : '#ef4444',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: 500,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => e.target.style.background = '#dc2626'}
          onMouseLeave={(e) => e.target.style.background = isDark ? 'rgba(239, 68, 68, 0.9)' : '#ef4444'}
        >
          <Minimize size={16} />
          Exit
        </button>,
        document.body
      )}
    </Card>
  );
});

PriceChartAdvanced.displayName = 'PriceChartAdvanced';

export default PriceChartAdvanced;
