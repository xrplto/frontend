import { useState, useEffect, useRef, memo, useContext, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';
import { TrendingUp, CandlestickChart, Users, Maximize, Minimize, MoreVertical, Loader2 } from 'lucide-react';
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  AreaSeries
} from 'lightweight-charts';
import axios from 'axios';
import { AppContext } from 'src/AppContext';
import { throttle } from 'src/utils/formatters';

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

const alpha = (color, opacity) => {
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color.replace(')', `, ${opacity})`);
};

const Card = styled.div`
  width: 100%;
  padding: ${props => props.isMobile ? '8px' : '16px'};
  background: transparent;
  border: 1.5px solid ${props => props.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'};
  border-radius: 12px;
  ${props => props.isFullscreen && `
    position: fixed;
    inset: 0;
    z-index: 99999;
    border-radius: 0;
    background: ${props.isDark ? '#000' : '#fff'};
    border: none;
  `}
`;

const Box = styled.div``;

const Typography = styled.span`
  font-size: ${props => props.variant === 'h6' ? '13px' : '12px'};
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
  padding: ${props => props.isMobile ? '4px 8px' : '5px 10px'};
  font-size: ${props => props.isMobile ? '11px' : '12px'};
  min-width: ${props => props.minWidth || 'auto'};
  height: ${props => props.isMobile ? '26px' : '28px'};
  border-radius: 6px;
  font-weight: 400;
  border: 1.5px solid ${props => props.isActive ? '#3b82f6' : (props.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)')};
  background: ${props => props.isActive ? '#3b82f6' : 'transparent'};
  color: ${props => props.isActive ? '#fff' : (props.isDark ? 'rgba(255,255,255,0.8)' : '#374151')};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: border-color 0.15s;
  &:hover {
    border-color: ${props => props.isActive ? '#3b82f6' : '#3b82f6'};
  }
  & svg { width: 14px; height: 14px; }
`;

const IconButton = styled.button`
  padding: 5px;
  border: 1.5px solid ${props => props.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'};
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  color: ${props => props.isDark ? 'rgba(255,255,255,0.7)' : '#374151'};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.15s;
  &:hover { border-color: #3b82f6; }
  & svg { width: 14px; height: 14px; }
`;

const Menu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  min-width: 160px;
  background: ${props => props.isDark ? '#1a1a1a' : '#fff'};
  border: 1.5px solid ${props => props.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'};
  border-radius: 8px;
  z-index: 1000;
  padding: 4px;
  display: ${props => props.open ? 'block' : 'none'};
`;

const MenuItem = styled.div`
  padding: 6px 10px;
  font-size: 12px;
  border-radius: 4px;
  color: ${props => props.isDark ? 'rgba(255,255,255,0.8)' : '#374151'};
  cursor: ${props => props.disabled ? 'default' : 'pointer'};
  opacity: ${props => props.disabled ? 0.5 : 1};
  background: ${props => props.isActive ? (props.isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.1)') : 'transparent'};
  &:hover {
    background: ${props => props.disabled ? 'transparent' : (props.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)')};
  }
`;

const Divider = styled.div`
  height: 1px;
  background: ${props => props.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'};
  margin: 4px;
`;

const Spinner = styled(Loader2)`
  animation: spin 1s linear infinite;
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const PriceChartAdvanced = memo(({ token }) => {
  const { activeFiatCurrency, accountProfile, themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const lineSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const lastChartTypeRef = useRef(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 600;
  const isTablet = typeof window !== 'undefined' && window.innerWidth < 900;

  // Performance: Limit data points
  const maxDataPoints = isMobile ? 100 : isTablet ? 200 : 300;

  const [chartType, setChartType] = useState('candles');
  const [range, setRange] = useState('1D');
  const [chartInterval, setChartInterval] = useState('5m');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  // ATH from token prop (API /api/token endpoint), not from chart intervals
  const athData = useMemo(() => {
    if (token?.athMarketcap) {
      const athMcap = token.athMarketcap;
      const currentMcap = token.marketcap || 0;
      const percentFromATH = athMcap > 0 ? (((currentMcap - athMcap) / athMcap) * 100).toFixed(2) : 0;
      return { price: null, percentDown: percentFromATH, athMcap };
    }
    return { price: null, percentDown: null, athMcap: null };
  }, [token?.athMarketcap, token?.marketcap]);
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

  const BASE_URL = 'https://api.xrpl.to/api';

  const chartTypeIcons = {
    candles: <CandlestickChart />,
    line: <TrendingUp />,
    holders: <Users />
  };

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
      if (!mounted || isRequestInProgress) {
        return;
      }

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

      if (currentRequest && !currentRequest.signal.aborted) {
        currentRequest.abort();
      }

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

        const response = await axios.get(endpoint, { signal: requestController.signal });

        if (mounted && response.data?.ohlc && response.data.ohlc.length > 0) {
          const processedData = response.data.ohlc
            .map((candle) => ({
              time: Math.floor(candle[0] / 1000),
              open: convertScientific(candle[1]),
              high: convertScientific(candle[2]),
              low: convertScientific(candle[3]),
              close: convertScientific(candle[4]),
              value: convertScientific(candle[4]),
              volume: convertScientific(candle[5]) || 0
            }))
            .sort((a, b) => a.time - b.time);

          // Limit data points to prevent memory growth
          const limitedData = processedData.slice(-maxDataPoints);
          setData(limitedData);
          dataRef.current = limitedData;
          setLastUpdate(new Date());

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

  // Create chart only when chart type changes AND relevant data is available
  useEffect(() => {
    const hasChartData =
      chartType === 'holders' ? holderData && holderData.length > 0 : data && data.length > 0;

    if (!chartContainerRef.current || loading || !hasChartData) {
      return;
    }

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

    const containerHeight = chartContainerRef.current.clientHeight || (isMobile ? 360 : 500);
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: containerHeight,
      layout: {
        background: {
          type: 'solid',
          color: 'transparent'
        },
        textColor: isDark ? '#FFFFFF' : '#212B36',
        fontSize: 13,
        fontFamily: "'Segoe UI', Roboto, Arial, sans-serif"
      },
      grid: {
        vertLines: {
          color: isDark ? 'rgba(56, 56, 56, 0.25)' : 'rgba(240, 240, 240, 0.8)',
          style: 1
        },
        horzLines: {
          color: isDark ? 'rgba(56, 56, 56, 0.4)' : 'rgba(240, 240, 240, 1)',
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
        borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
        scaleMargins: {
          top: 0.05,
          bottom: 0.2
        },
        mode: 0,
        autoScale: true,
        borderVisible: false,
        visible: true,
        entireTextOnly: false,
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

          const actualPrice = price / scaleFactorRef.current;
          const symbol = currencySymbols[activeFiatCurrencyRef.current] || '';
          const isXRP = activeFiatCurrencyRef.current === 'XRP';

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
        borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
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

    let zoomCheckTimeout;
    chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (range && dataRef.current && dataRef.current.length > 0) {
        clearTimeout(zoomCheckTimeout);
        zoomCheckTimeout = setTimeout(() => {
          const dataLength = dataRef.current.length;
          const isScrolledAway = range.to < dataLength - 2;

          const shouldPauseUpdates = isScrolledAway;

          if (shouldPauseUpdates !== isUserZoomedRef.current) {
            setIsUserZoomed(shouldPauseUpdates);
            isUserZoomedRef.current = shouldPauseUpdates;
          }
        }, 100);
      }
    });

    const toolTip = document.createElement('div');
    toolTip.style = `width: 130px; position: absolute; display: none; padding: 8px; font-size: 11px; z-index: 1000; top: 8px; left: 8px; pointer-events: none; border-radius: 6px; background: ${isDark ? '#1a1a1a' : '#fff'}; color: ${isDark ? '#fff' : '#1a1a1a'}; border: 1.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`;
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

      crosshairPositionRef.current = { time: param.time, point: param.point };

      const dateStr = new Date(param.time * 1000).toLocaleDateString();
      const rawTimestamp = param.time;
      toolTip.style.display = 'block';

      let ohlcData = '';
      const symbol = currencySymbols[activeFiatCurrencyRef.current] || '';
      const currentData = chartType === 'holders' ? holderDataRef.current : dataRef.current;
      const candle = currentData ? currentData.find((d) => d.time === param.time) : null;

      if (candle) {
        const formatPrice = (p) => {
          const actualPrice = p;
          const isXRP = activeFiatCurrencyRef.current === 'XRP';

          if (actualPrice && actualPrice < 0.001) {
            const str = actualPrice.toFixed(20);
            const zeros = str.match(/0\.0*/)?.[0]?.length - 2 || 0;
            if (zeros >= 3) {
              const significant = str.replace(/^0\.0+/, '').replace(/0+$/, '');
              const sigDigits = isXRP ? 6 : 4;
              return '0.0(' + zeros + ')' + significant.slice(0, sigDigits);
            }
          }

          if (actualPrice < 0.00001) return actualPrice.toFixed(isXRP ? 10 : 8);
          if (actualPrice < 0.001) return actualPrice.toFixed(isXRP ? 8 : 6);
          if (actualPrice < 0.01) return actualPrice.toFixed(isXRP ? 8 : 6);
          if (actualPrice < 1) return actualPrice.toFixed(isXRP ? 6 : 4);
          if (actualPrice < 100) return actualPrice.toFixed(3);
          if (actualPrice < 1000) return actualPrice.toFixed(2);
          return actualPrice.toLocaleString();
        };

        const row = (l, v, c) => `<div style="display:flex;justify-content:space-between;${c ? `color:${c}` : ''}"><span style="opacity:0.6">${l}</span><span>${v}</span></div>`;
        const sep = `<div style="height:1px;background:${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'};margin:4px 0"></div>`;

        if (chartType === 'candles') {
          const change = (((candle.close - candle.open) / candle.open) * 100).toFixed(2);
          const color = candle.close >= candle.open ? '#22c55e' : '#ef4444';
          ohlcData = `<div style="opacity:0.6;margin-bottom:4px">${dateStr}</div>
            ${row('O', symbol + formatPrice(candle.open))}
            ${row('H', symbol + formatPrice(candle.high))}
            ${row('L', symbol + formatPrice(candle.low))}
            ${row('C', symbol + formatPrice(candle.close), color)}
            ${sep}${row('Vol', candle.volume.toLocaleString())}
            ${row('Chg', change + '%', color)}`;
        } else if (chartType === 'line') {
          ohlcData = `<div style="opacity:0.6;margin-bottom:4px">${dateStr}</div>
            ${row('Price', symbol + formatPrice(candle.close || candle.value))}
            ${row('Vol', (candle.volume || 0).toLocaleString())}`;
        } else if (chartType === 'holders') {
          ohlcData = `<div style="opacity:0.6;margin-bottom:4px">${dateStr}</div>
            ${row('Holders', (candle.holders || candle.value).toLocaleString())}
            ${candle.top10 !== undefined ? sep + row('Top 10', candle.top10.toFixed(1) + '%') + row('Top 20', candle.top20.toFixed(1) + '%') + row('Top 50', candle.top50.toFixed(1) + '%') : ''}`;
        }
      }

      if (ohlcData) {
        toolTip.innerHTML = ohlcData;
        toolTip.style.left = Math.max(0, Math.min(chartContainerRef.current.clientWidth - 140, param.point.x - 50)) + 'px';
        toolTip.style.top = '8px';
      }
    });

    if (chartType === 'candles') {
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderUpColor: '#22c55e',
        borderDownColor: '#ef4444',
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444'
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
        crosshairMarkerBackgroundColor: isDark ? '#000' : '#fff'
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
        crosshairMarkerBackgroundColor: isDark ? '#000' : '#fff'
      });
      lineSeriesRef.current = holdersSeries;
    }

    if (chartType !== 'holders') {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: 'rgba(34, 197, 94, 0.4)',
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
        scaleMargins: { top: 0.8, bottom: 0 },
        priceLineVisible: false,
        lastValueVisible: false
      });
      volumeSeriesRef.current = volumeSeries;
      chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });
    }

    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        const container = chartContainerRef.current;
        const containerHeight = container.clientHeight || (isMobile ? 380 : 420);

        chart.applyOptions({
          width: container.clientWidth,
          height: containerHeight
        });

        chart.resize(container.clientWidth, containerHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(zoomCheckTimeout);

      if (chartContainerRef.current) {
        const tooltips = chartContainerRef.current.querySelectorAll(
          'div[style*="position: absolute"]'
        );
        tooltips.forEach((tooltip) => tooltip.remove());
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
  }, [chartType, isDark, isMobile, data, holderData]);

  // Handle fullscreen resize
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const resizeOrRecreateChart = () => {
      const container = chartContainerRef.current;
      if (!container) return;

      const newHeight = isFullscreen ? window.innerHeight - 120 : isMobile ? 360 : 500;
      const rect = container.getBoundingClientRect();
      const newWidth = rect.width || container.clientWidth;

      if (chartRef.current) {
        try {
          chartRef.current.resize(newWidth, newHeight);

          chartRef.current.applyOptions({
            width: newWidth,
            height: newHeight
          });

          const timeScale = chartRef.current.timeScale();
          if (zoomStateRef.current) {
            timeScale.setVisibleRange(zoomStateRef.current);
          } else {
            timeScale.fitContent();
          }

        } catch (error) {
          console.error('Resize failed, forcing recreation:', error);
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

    const timeoutId = setTimeout(resizeOrRecreateChart, 100);

    return () => clearTimeout(timeoutId);
  }, [isFullscreen, isMobile]);

  // Update data on chart series
  useEffect(() => {
    if (!chartRef.current) {
      return;
    }

    const chartData = chartType === 'holders' ? holderData : data;
    if (!chartData || chartData.length === 0) {
      return;
    }

    const getScaleFactor = (data) => {
      if (!data || data.length === 0) return 1;
      const maxPrice = Math.max(
        ...data.map((d) => Math.max(d.high || d.close || d.value || d.open || 0))
      );
      const minPrice = Math.min(
        ...data.map((d) => Math.min(d.low || d.close || d.value || d.open || Infinity))
      );

      const avgPrice = (maxPrice + minPrice) / 2;

      if (avgPrice < 0.000000000001) return 1000000000000000;
      if (avgPrice < 0.00000000001) return 100000000000000;
      if (avgPrice < 0.0000000001) return 10000000000000;
      if (avgPrice < 0.000000001) return 1000000000000;
      if (avgPrice < 0.00000001) return 100000000000;
      if (avgPrice < 0.0000001) return 10000000000;
      if (avgPrice < 0.000001) return 1000000000;
      if (avgPrice < 0.00001) return 100000000;
      if (avgPrice < 0.0001) return 10000000;
      if (avgPrice < 0.001) return 1000000;
      if (avgPrice < 0.01) return 100000;
      if (avgPrice < 0.1) return 10000;
      if (avgPrice < 1) return 1000;
      return 1;
    };

    if (chartRef.current && chartRef.current.timeScale) {
      try {
        const visibleRange = chartRef.current.timeScale().getVisibleRange();
        if (visibleRange) {
          zoomStateRef.current = visibleRange;
        }
      } catch (e) {}
    }

    if (chartType === 'candles' && !candleSeriesRef.current) {
      const candleSeries = chartRef.current.addSeries(CandlestickSeries, {
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderUpColor: '#22c55e',
        borderDownColor: '#ef4444',
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444'
      });
      candleSeriesRef.current = candleSeries;
    }

    if ((chartType === 'line' || chartType === 'holders') && !lineSeriesRef.current) {
      const isHolders = chartType === 'holders';
      const areaSeries = chartRef.current.addSeries(AreaSeries, {
        lineColor: isHolders ? '#a855f7' : '#3b82f6',
        topColor: isHolders ? 'rgba(168, 85, 247, 0.25)' : 'rgba(59, 130, 246, 0.25)',
        bottomColor: isHolders ? 'rgba(168, 85, 247, 0.02)' : 'rgba(59, 130, 246, 0.02)',
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 3
      });
      lineSeriesRef.current = areaSeries;
    }

    if (chartType !== 'holders' && !volumeSeriesRef.current) {
      const volumeSeries = chartRef.current.addSeries(HistogramSeries, {
        color: 'rgba(34, 197, 94, 0.4)',
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
        scaleMargins: { top: 0.85, bottom: 0 },
        priceLineVisible: false,
        lastValueVisible: false
      });
      volumeSeriesRef.current = volumeSeries;
      chartRef.current.priceScale('volume').applyOptions({ scaleMargins: { top: 0.9, bottom: 0 } });
    }

    const isRangeChange = lastChartTypeRef.current !== `${chartType}-${range}`;
    const isCurrencyChange = activeFiatCurrencyRef.current !== activeFiatCurrency;

    const isAutoUpdate = !isRangeChange && !isCurrencyChange && dataRef.current && chartData.length > 0;

    if (chartType === 'candles' && candleSeriesRef.current) {
      const scaleFactor = getScaleFactor(chartData);
      scaleFactorRef.current = scaleFactor;

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
      }
    } else if (chartType === 'line' && lineSeriesRef.current) {
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

    if (chartType !== 'holders' && volumeSeriesRef.current && data) {
      const volumeData = data.map((d) => ({
        time: d.time,
        value: d.volume || 0,
        color: d.close >= d.open ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'
      }));
      if (isAutoUpdate && volumeData.length > 0) {
        const lastVolume = volumeData[volumeData.length - 1];
        volumeSeriesRef.current.update(lastVolume);
      } else {
        volumeSeriesRef.current.setData(volumeData);
      }
    }

    if (isRangeChange || isCurrencyChange) {
      chartRef.current.timeScale().fitContent();
      lastChartTypeRef.current = `${chartType}-${range}`;
      activeFiatCurrencyRef.current = activeFiatCurrency;
    } else if (zoomStateRef.current) {
      setTimeout(() => {
        if (chartRef.current && chartRef.current.timeScale && zoomStateRef.current) {
          try {
            chartRef.current.timeScale().setVisibleRange(zoomStateRef.current);
          } catch (e) {}
        }
      }, 0);
    }
  }, [data, holderData, chartType, isDark, range, isMobile]);

  const handleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => {
      const next = !prev;
      document.body.style.overflow = next ? 'hidden' : '';
      return next;
    });
  }, []);

  // Cleanup body overflow on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <Card isDark={isDark} isMobile={isMobile} isFullscreen={isFullscreen}>
      <Box style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <Box style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
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

        <Box style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <ButtonGroup>
            {Object.entries(chartTypeIcons).map(([type, icon]) => (
              <Button key={type} onClick={() => setChartType(type)} isActive={chartType === type} isMobile={isMobile} isDark={isDark}>
                {icon}
                {!isMobile && (type === 'holders' ? 'Holders' : type.charAt(0).toUpperCase() + type.slice(1))}
              </Button>
            ))}
          </ButtonGroup>

          <ButtonGroup>
            {['1D', '5D', '1M', '3M', '1Y', '5Y', 'ALL'].map((r) => (
              <Button
                key={r}
                onClick={() => {
                  setRange(r);
                  setIsUserZoomed(false);
                  const defaults = { '1D': '5m', '5D': '15m', '1M': '1h', '3M': '4h', '1Y': '1d', '5Y': '1d', 'ALL': '1d' };
                  if (defaults[r]) setChartInterval(defaults[r]);
                }}
                isActive={range === r}
                isMobile={isMobile}
                isDark={isDark}
                minWidth={isMobile ? '24px' : '28px'}
              >
                {r}
              </Button>
            ))}
          </ButtonGroup>

          <div style={{ position: 'relative' }}>
            <IconButton onClick={() => setAnchorEl(anchorEl ? null : {})} isDark={isDark}>
              <MoreVertical />
            </IconButton>

            <Menu open={!!anchorEl} isDark={isDark}>
              {isMobile && (
                <>
                  <MenuItem onClick={() => { handleFullscreen(); setAnchorEl(null); }} isDark={isDark}>
                    <Box style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
                      {isFullscreen ? 'Exit' : 'Fullscreen'}
                    </Box>
                  </MenuItem>
                  <Divider isDark={isDark} />
                </>
              )}
              <MenuItem disabled isDark={isDark} style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Interval
              </MenuItem>
              {['1m', '5m', '15m', '30m', '1h', '4h', '1d'].map((int) => {
                const validCombos = { '1D': ['1m', '5m', '15m', '30m', '1h'], '5D': ['5m', '15m', '30m', '1h', '4h'], '1M': ['15m', '30m', '1h', '4h', '1d'], '3M': ['30m', '1h', '4h', '1d'], '1Y': ['1h', '4h', '1d'], '5Y': ['4h', '1d'], 'ALL': ['1d'] };
                const isValid = validCombos[range]?.includes(int);
                return (
                  <MenuItem
                    key={int}
                    disabled={!isValid}
                    onClick={() => { if (isValid) { setChartInterval(int); setAnchorEl(null); } }}
                    isActive={chartInterval === int}
                    isDark={isDark}
                  >
                    {int}
                  </MenuItem>
                );
              })}
            </Menu>
          </div>

          {!isMobile && (
            <IconButton onClick={handleFullscreen} isDark={isDark} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
              {isFullscreen ? <Minimize /> : <Maximize />}
            </IconButton>
          )}
        </Box>
      </Box>

      <Box style={{ position: 'relative', height: isFullscreen ? 'calc(100vh - 100px)' : isMobile ? '360px' : '500px', borderRadius: '8px', overflow: 'hidden' }}>
        <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
        {loading && !chartRef.current && (
          <Box style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Spinner size={20} color={isDark ? '#fff' : '#1a1a1a'} />
          </Box>
        )}
        {!loading && !(chartType === 'holders' ? holderData?.length : data?.length) && (
          <Box style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary" isDark={isDark}>No data</Typography>
          </Box>
        )}
      </Box>
    </Card>
  );
});

PriceChartAdvanced.displayName = 'PriceChartAdvanced';

export default PriceChartAdvanced;
