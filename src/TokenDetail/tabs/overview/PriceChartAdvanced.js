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
import { AppContext } from 'src/AppContext';

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
  padding: ${props => props.isMobile ? '8px' : '12px'};
  background: transparent;
  border: 1.5px solid ${props => props.isDark ? 'rgba(59,130,246,0.12)' : 'rgba(0,0,0,0.08)'};
  border-radius: 12px;
  position: relative;
  z-index: 1;
  overflow: hidden;
  ${props => props.isFullscreen && `
    position: fixed;
    inset: 0;
    z-index: 99999;
    border-radius: 0;
    background: ${props.isDark ? '#000' : '#fff'};
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
    props.color === 'text.secondary' ? (props.isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)') :
    props.color === 'warning.main' ? '#f59e0b' :
    (props.isDark ? '#fff' : '#1a1a1a')
  };
`;

const ButtonGroup = styled.div`
  display: flex;
  & > button { border-radius: 0; }
  & > button:first-of-type { border-radius: 6px 0 0 6px; }
  & > button:last-of-type { border-radius: 0 6px 6px 0; }
  & > button:not(:first-of-type) { margin-left: -1px; }
`;

const Button = styled.button`
  padding: ${props => props.isMobile ? '3px 6px' : '4px 8px'};
  font-size: ${props => props.isMobile ? '10px' : '11px'};
  min-width: ${props => props.minWidth || 'auto'};
  height: ${props => props.isMobile ? '24px' : '26px'};
  border-radius: 5px;
  font-weight: 400;
  border: 1px solid ${props => props.isActive ? '#3b82f6' : (props.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)')};
  background: ${props => props.isActive ? '#3b82f6' : 'transparent'};
  color: ${props => props.isActive ? '#fff' : (props.isDark ? 'rgba(255,255,255,0.7)' : '#374151')};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  transition: border-color 0.15s;
  &:hover {
    border-color: #3b82f6;
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
  const [timeRange, setTimeRange] = useState('1d');
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
  const lastDataLengthRef = useRef(0);

  // Update refs when values change (combined for efficiency)
  useEffect(() => {
    activeFiatCurrencyRef.current = activeFiatCurrency;
    isUserZoomedRef.current = isUserZoomed;
    hasMoreRef.current = hasMore;
    chartTypeRef.current = chartType;
  }, [activeFiatCurrency, isUserZoomed, hasMore, chartType]);


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

      const endpoint = `${BASE_URL}/graph-ohlc-v2/${token.md5}?resolution=${resolution}&cb=${barsToLoad}&abn=${oldestTime}&vs_currency=${activeFiatCurrency}`;
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
          // olderData is already sorted, prev is already sorted
          // Merge sorted arrays (more efficient than Map + sort)
          const seen = new Set(prev.map(d => d.time));
          const newItems = olderData.filter(d => !seen.has(d.time));
          const merged = [...newItems, ...prev]; // newItems are older, so prepend
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
  }, [token?.md5, timeRange, activeFiatCurrency, hasMore, convertScientific]);

  // Keep ref updated
  useEffect(() => {
    loadMoreDataRef.current = loadMoreData;
  }, [loadMoreData]);

  // Fetch price data (initial load and updates)
  useEffect(() => {
    if (!token?.md5) {
      return;
    }

    let mounted = true;
    const controller = new AbortController();

    const fetchData = async (isUpdate = false) => {
      if (!mounted) {
        return;
      }

      try {
        if (isUpdate) {
          setIsUpdating(true);
        } else {
          setLoading(true);
          setHasMore(true);
        }

        // Presets with bar count (cb) - load data based on timeframe
        const presets = {
          '1d':  { resolution: '15',  cb: 100  },  // 15min bars, ~25 hours
          '5d':  { resolution: '15',  cb: 500  },  // 15min bars, ~5 days
          '1m':  { resolution: '60',  cb: 750  },  // 1h bars, ~31 days
          '3m':  { resolution: '240', cb: 550  },  // 4h bars, ~90 days
          '1y':  { resolution: 'D',   cb: 400  },  // daily, ~13 months
          '5y':  { resolution: 'W',   cb: 300  },  // weekly, ~6 years
          'all': { resolution: 'D',   cb: 5000 }   // daily, max bars
        };
        const preset = presets[timeRange] || presets['1d'];
        const endpoint = `${BASE_URL}/graph-ohlc-v2/${token.md5}?resolution=${preset.resolution}&cb=${preset.cb}&vs_currency=${activeFiatCurrency}`;

        const response = await axios.get(endpoint, { signal: controller.signal });

        if (mounted && response.data?.ohlc && response.data.ohlc.length > 0) {
          // Debug: log raw API response
          const rawSample = response.data.ohlc.slice(-3);
          console.log('RAW OHLC from API:', rawSample);
          setDebugInfo({
            endpoint,
            rawSample,
            totalBars: response.data.ohlc.length
          });

          // Bounds for lightweight-charts (must be between ±90071992547409.91)
          const MAX_CHART_VALUE = 90071992547409;
          const MIN_CHART_VALUE = 1e-12;

          const processedData = response.data.ohlc
            .filter(candle =>
              // Filter raw data BEFORE conversion
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

          // Debug: log processed data
          console.log('PROCESSED OHLC:', processedData.slice(-3));

          if (isUpdate && dataRef.current && dataRef.current.length > 0) {
            // For updates, only update if there are actual changes
            const lastExisting = dataRef.current[dataRef.current.length - 1];
            const lastNew = processedData[processedData.length - 1];

            // Check if the last candle actually changed
            const hasChanges = !lastExisting || !lastNew ||
              lastExisting.time !== lastNew.time ||
              lastExisting.close !== lastNew.close ||
              lastExisting.high !== lastNew.high ||
              lastExisting.low !== lastNew.low ||
              lastExisting.volume !== lastNew.volume;

            if (hasChanges) {
              const lastExistingTime = lastExisting.time;

              // Build lookup map for O(1) access - O(n) instead of O(n²)
              const processedMap = new Map(processedData.map(p => [p.time, p]));

              // Update existing candles using map lookup
              const updatedData = dataRef.current.map(d => processedMap.get(d.time) || d);

              // Add new candles that come after existing data
              const newerCandles = processedData.filter(d => d.time > lastExistingTime);

              // Combine and sort only if there are new candles
              const finalData = newerCandles.length > 0
                ? [...updatedData, ...newerCandles].sort((a, b) => a.time - b.time)
                : updatedData;

              dataRef.current = finalData;
              setData(finalData);
              setLastUpdate(new Date());
            }
          } else {
            dataRef.current = processedData;
            setData(processedData);
            setLastUpdate(new Date());
          }

          // Disable "load more" for 'all' timerange since we already have everything
          if (timeRange === 'all') {
            setHasMore(false);
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
      }
    };

    fetchData();

    const updateInterval = setInterval(() => {
      if (!isUserZoomedRef.current && mounted && !controller.signal.aborted) {
        fetchData(true);
      }
    }, 10000);

    return () => {
      mounted = false;
      controller.abort();
      clearInterval(updateInterval);
    };
  }, [token.md5, timeRange, BASE_URL, activeFiatCurrency, convertScientific]);

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
        const endpoint = `${BASE_URL}/graphrich/${token.md5}?range=ALL`;

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
          const hours = date.getUTCHours().toString().padStart(2, '0');
          const minutes = date.getUTCMinutes().toString().padStart(2, '0');
          const day = date.getUTCDate();
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const month = months[date.getUTCMonth()];
          // tickMarkType: 0=time, 1=time, 2=day, 3=month, 4=year
          if (tickMarkType >= 4) {
            return `${month} '${date.getUTCFullYear().toString().slice(-2)}`;
          }
          if (tickMarkType === 3) {
            return `${month} ${day}`;
          }
          if (tickMarkType === 2) {
            return `${day} ${hours}:${minutes}`;
          }
          // For intraday, show time
          return `${hours}:${minutes}`;
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
        const isScrolledRight = logicalRange.to < dataLength - 2;
        const isScrolledLeft = logicalRange.from < dataLength - 200;

        const shouldPauseUpdates = isScrolledRight || isScrolledLeft;

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
    toolTip.style = `width: ${isMobile ? '105px' : '120px'}; position: absolute; display: none; padding: ${isMobile ? '5px' : '6px'}; font-size: ${isMobile ? '9px' : '10px'}; z-index: 1000; top: 6px; left: 6px; pointer-events: none; border-radius: 5px; background: ${isDark ? '#010815' : '#fff'}; color: ${isDark ? '#fff' : '#1a1a1a'}; border: 1px solid ${isDark ? 'rgba(59,130,246,0.15)' : 'rgba(0,0,0,0.08)'}`;
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
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
        const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
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

    // Skip update if data hasn't actually changed (prevents lag during zoom)
    const dataLength = chartData.length;
    const lastTime = chartData[dataLength - 1]?.time;
    const dataChanged = dataLength !== lastDataLengthRef.current ||
      lastTime !== (chartType === 'holders' ? holderDataRef.current : dataRef.current)?.[lastDataLengthRef.current - 1]?.time;

    if (!dataChanged && lastChartTypeRef.current === `${chartType}-${timeRange}-${activeFiatCurrency}`) {
      return; // Skip - nothing changed
    }

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

    // Update refs
    lastDataLengthRef.current = dataLength;

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
        '1d': isMobile ? 35 : 60,    // Wider candles, clearer view
        '5d': isMobile ? 60 : 100,   // 5 days
        '1m': isMobile ? 80 : 140,   // 30 days
        '3m': isMobile ? 100 : 180,  // 90 days
        '1y': isMobile ? 90 : 150,   // 1 year
        '5y': isMobile ? 80 : 120,   // 5 years
        'all': dataLength            // Show all data
      };
      const visibleBars = visibleBarsMap[timeRange] || 96;
      const from = timeRange === 'all' ? 0 : Math.max(0, dataLength - visibleBars);
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
          {athData.athMcap > 0 && chartType !== 'holders' && (
            <Box style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 6px',
              borderRadius: '4px',
              background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'
            }}>
              <span style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>ATH</span>
              <span style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)', fontFamily: 'monospace' }}>
                {currencySymbols[activeFiatCurrency] || ''}{formatMcap(athData.athMcap)}
              </span>
              <span style={{ fontSize: '10px', color: athData.percentDown < 0 ? '#ef4444' : '#22c55e', fontFamily: 'monospace' }}>
                {athData.percentDown}%
              </span>
            </Box>
          )}
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
          <Box style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', borderRadius: '4px', background: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>
            <Spinner size={12} color={isDark ? '#fff' : '#1a1a1a'} />
            <span style={{ fontSize: '10px', color: isDark ? '#fff' : '#1a1a1a' }}>Loading...</span>
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
            top: 20,
            right: 20,
            zIndex: 999999,
            padding: '10px 20px',
            background: '#ef4444',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            transition: 'transform 0.1s',
          }}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        >
          <Minimize size={18} />
          Exit Fullscreen
        </button>,
        document.body
      )}
    </Card>
  );
});

PriceChartAdvanced.displayName = 'PriceChartAdvanced';

export default PriceChartAdvanced;
