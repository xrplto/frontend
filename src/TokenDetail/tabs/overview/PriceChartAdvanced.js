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
  padding: ${props => props.isMobile ? '8px' : '12px'};
  padding-right: ${props => props.isMobile ? '4px' : '12px'};
  background: transparent;
  border: 1.5px solid ${props => props.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'};
  border-radius: 12px;
  overflow: hidden;
  &:hover {
    border-color: ${props => props.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'};
    background: ${props => props.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'};
  }
  ${props => props.isFullscreen && `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 99999;
    border-radius: 0;
    width: 100vw;
    height: 100vh;
    max-width: 100vw;
    max-height: 100vh;
    background: ${props.isDark ? '#000000' : '#ffffff'};
    overflow-y: auto;
    border: none;
    &:hover {
      border-color: transparent;
      background: ${props.isDark ? '#000000' : '#ffffff'};
    }
  `}
`;

const Box = styled.div``;

const Typography = styled.span`
  font-size: ${props => props.variant === 'h6' ? '14px' : props.variant === 'caption' ? '11px' : '13px'};
  font-weight: ${props => props.fontWeight || 400};
  color: ${props =>
    props.color === 'text.secondary' ? (props.isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)') :
    props.color === 'text.primary' ? (props.isDark ? '#FFFFFF' : '#212B36') :
    props.color === 'success.main' ? '#4caf50' :
    props.color === 'warning.main' ? '#ff9800' :
    props.color ? props.color :
    (props.isDark ? '#FFFFFF' : '#212B36')
  };
  letter-spacing: ${props => props.letterSpacing || 'normal'};
  text-transform: ${props => props.textTransform || 'none'};
  opacity: ${props => props.opacity || 1};
  user-select: ${props => props.userSelect || 'auto'};
  font-family: ${props => props.fontFamily || 'inherit'};
  line-height: ${props => props.lineHeight || 'normal'};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0px;
  & > button {
    border-radius: 0;
  }
  & > button:first-of-type {
    border-radius: 6px 0 0 6px;
  }
  & > button:last-of-type {
    border-radius: 0 6px 6px 0;
  }
  & > button:not(:first-of-type) {
    margin-left: -1px;
  }
`;

const Button = styled.button`
  padding: ${props => props.isMobile ? '4px 6px' : '6px 10px'};
  font-size: ${props => props.isMobile ? '11px' : '13px'};
  min-width: ${props => props.minWidth || 'auto'};
  height: ${props => props.isMobile ? '26px' : '30px'};
  border-radius: 6px;
  text-transform: none;
  font-weight: ${props => props.isActive ? 600 : 400};
  border: 1.5px solid ${props =>
    props.isActive
      ? '#147DFE'
      : (props.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)')
  };
  background: ${props => props.isActive ? '#147DFE' : 'transparent'};
  color: ${props => props.isActive ? '#FFFFFF' : (props.isDark ? '#FFFFFF' : '#212B36')};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: ${props => props.isMobile ? '2px' : '6px'};
  &:hover {
    background: ${props => props.isActive ? '#147DFE' : (props.isDark ? 'rgba(20,125,254,0.04)' : 'rgba(20,125,254,0.04)')};
    border-color: ${props => props.isActive ? '#147DFE' : 'rgba(20,125,254,0.3)'};
  }
  & svg {
    width: ${props => props.isMobile ? '12px' : '16px'};
    height: ${props => props.isMobile ? '12px' : '16px'};
  }
`;

const IconButton = styled.button`
  padding: ${props => props.size === 'small' ? '5px' : '6px'};
  border: 1.5px solid ${props => props.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'};
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  color: ${props => props.isDark ? '#FFFFFF' : '#212B36'};
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background: ${props => props.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'};
  }
  & svg {
    width: ${props => props.isMobile ? '14px' : '16px'};
    height: ${props => props.isMobile ? '14px' : '16px'};
  }
`;

const Menu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  min-width: 180px;
  background: ${props => props.isDark ? 'rgba(20, 20, 20, 0.98)' : 'rgba(255, 255, 255, 0.98)'};
  border: 1.5px solid ${props => props.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
  border-radius: 8px;
  box-shadow: 0 4px 12px ${props => props.isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)'};
  z-index: 1000;
  padding: 4px 0;
  display: ${props => props.open ? 'block' : 'none'};
`;

const MenuItem = styled.div`
  padding: 8px 12px;
  font-size: 14px;
  color: ${props => props.isDark ? '#FFFFFF' : '#212B36'};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.4 : 1};
  font-weight: ${props => props.disabled && props.isHeader ? 500 : 400};
  background: ${props => props.isActive ? (props.isDark ? 'rgba(20,125,254,0.08)' : 'rgba(20,125,254,0.08)') : 'transparent'};
  &:hover {
    background: ${props => props.disabled ? 'transparent' : (props.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)')};
  }
`;

const Divider = styled.div`
  height: 1px;
  background: ${props => props.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
  margin: 4px 0;
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
  const [athData, setAthData] = useState({ price: null, percentDown: null, athMcap: null });
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

        console.log('Fetching chart data:', { range: apiRange, interval: chartInterval, endpoint });
        const response = await axios.get(endpoint, { signal: requestController.signal });
        console.log('Chart response:', { length: response.data?.ohlc?.length, data: response.data });

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

          // Calculate ATH mcap from OHLC high price × supply
          const allTimeHigh = Math.max(...processedData.map((d) => d.high));
          const supply = parseFloat(token.amount) || 0;
          const athMcap = allTimeHigh * supply;
          const currentMcap = token.marketcap || 0;
          const percentFromATH = athMcap > 0 ? (((currentMcap - athMcap) / athMcap) * 100).toFixed(2) : 0;

          setAthData({
            price: allTimeHigh,
            percentDown: percentFromATH,
            athMcap: athMcap
          });

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

    const containerHeight = chartContainerRef.current.clientHeight || (isMobile ? 380 : 550);
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
    toolTip.style = `width: 140px; height: auto; position: absolute; display: none; padding: 8px; box-sizing: border-box; font-size: 12px; text-align: left; z-index: 1000; top: 12px; left: 12px; pointer-events: none; border-radius: 6px; font-family: inherit; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; background: ${isDark ? 'rgba(20, 20, 20, 0.98)' : 'rgba(255, 255, 255, 0.98)'}; color: ${isDark ? '#FFFFFF' : '#212B36'}; border: 1.5px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}; box-shadow: none`;
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
        lineColor: isDark ? '#2196F3' : '#147DFE',
        topColor: isDark ? 'rgba(33, 150, 243, 0.4)' : 'rgba(20, 125, 254, 0.4)',
        bottomColor: isDark ? 'rgba(33, 150, 243, 0.05)' : 'rgba(20, 125, 254, 0.05)',
        lineWidth: 2,
        lineStyle: 0,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        crosshairMarkerBorderColor: '#147DFE',
        crosshairMarkerBackgroundColor: isDark ? '#000000' : '#ffffff'
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
        crosshairMarkerBackgroundColor: isDark ? '#000000' : '#ffffff'
      });
      lineSeriesRef.current = holdersSeries;
    }

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
        const containerHeight = container.clientHeight || (isMobile ? 380 : 550);

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

      const newHeight = isFullscreen ? window.innerHeight - 120 : isMobile ? 380 : 550;
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
              lineColor: '#147DFE',
              topColor: 'rgba(20, 125, 254, 0.5)',
              bottomColor: 'rgba(20, 125, 254, 0.05)'
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

      chartRef.current.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.9,
          bottom: 0
        }
      });
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
      <Box style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <Box style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Typography variant="h6" isDark={isDark}>
            {token.name} {chartType === 'holders' ? 'Holders' : `Price (${activeFiatCurrency})`} • {range} • {chartInterval}
          </Typography>
          {athData.athMcap > 0 && chartType !== 'holders' && (
            <Box style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '8px',
              border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
              background: 'transparent'
            }}>
              <Typography
                isDark={isDark}
                fontWeight={400}
                style={{
                  fontSize: '12px',
                  color: athData.percentDown < 0 ? '#ef5350' : '#66bb6a',
                  lineHeight: 1,
                  fontFamily: 'monospace'
                }}
              >
                {athData.percentDown}%
              </Typography>
              <Typography
                isDark={isDark}
                style={{
                  fontSize: '11px',
                  fontWeight: 400,
                  color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                  lineHeight: 1
                }}
              >
                ATH MCap
              </Typography>
              <Typography
                isDark={isDark}
                fontWeight={400}
                style={{
                  fontSize: '12px',
                  color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)',
                  lineHeight: 1,
                  fontFamily: 'monospace'
                }}
              >
                {currencySymbols[activeFiatCurrency] || ''}{formatMcap(athData.athMcap)}
              </Typography>
            </Box>
          )}
          <Box style={{
            marginLeft: '16px',
            minWidth: '140px',
            display: 'inline-flex',
            alignItems: 'center',
            height: '20px',
            position: 'relative'
          }}>
            {isUpdating ? (
              <Box style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#4caf50'
              }} />
            ) : lastUpdate ? (
              <Box style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                opacity: isUserZoomed ? 0.5 : 0.7
              }}>
                <Box style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: isUserZoomed ? '#ff9800' : '#4caf50',
                  opacity: isUserZoomed ? 0.6 : 1
                }} />
                <Typography
                  isDark={isDark}
                  color="text.secondary"
                  style={{
                    fontSize: '13px',
                    fontWeight: 400,
                    letterSpacing: '0.03em',
                    fontFamily: '"SF Mono", "Monaco", "Inconsolata", "Fira Code", monospace',
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
                    isDark={isDark}
                    color="warning.main"
                    style={{
                      fontSize: '12px',
                      fontWeight: 400,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      opacity: 0.6
                    }}
                  >
                    paused
                  </Typography>
                )}
              </Box>
            ) : null}
          </Box>
        </Box>

        <Box style={{
          display: 'flex',
          gap: isMobile ? '4px' : '8px',
          flexWrap: 'wrap',
          alignItems: 'center',
          position: 'relative'
        }}>
          <ButtonGroup>
            {Object.entries(chartTypeIcons).map(([type, icon]) => (
              <Button
                key={type}
                onClick={() => setChartType(type)}
                isActive={chartType === type}
                isMobile={isMobile}
                isDark={isDark}
              >
                {icon}
                {type === 'holders'
                  ? 'Holders'
                  : type.charAt(0).toUpperCase() + type.slice(1)}
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
                isActive={range === r}
                isMobile={isMobile}
                isDark={isDark}
                minWidth={isMobile ? '26px' : '32px'}
              >
                {r}
              </Button>
            ))}
          </ButtonGroup>

          <div style={{ position: 'relative' }}>
            <IconButton
              size="small"
              onClick={() => setAnchorEl(anchorEl ? null : {})}
              isMobile={isMobile}
              isDark={isDark}
              style={{ marginLeft: isMobile ? '4px' : '8px' }}
            >
              <MoreVertical />
            </IconButton>

            <Menu open={!!anchorEl} isDark={isDark}>
              {isMobile && (
                <>
                  <MenuItem
                    onClick={() => {
                      handleFullscreen();
                      setAnchorEl(null);
                    }}
                    isDark={isDark}
                  >
                    <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                      {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    </Box>
                  </MenuItem>
                  <Divider isDark={isDark} />
                </>
              )}
              <MenuItem disabled isHeader isDark={isDark}>
                Interval
              </MenuItem>
              {['1m', '5m', '15m', '30m', '1h', '4h', '1d'].map((int) => {
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
                    isActive={chartInterval === int}
                    isDark={isDark}
                  >
                    <Box style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Box style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid',
                        borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                        borderRadius: '50%',
                        marginRight: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: chartInterval === int ? '#147DFE' : 'transparent'
                      }}>
                        {chartInterval === int && (
                          <Box style={{ width: '6px', height: '6px', background: 'white', borderRadius: '50%' }} />
                        )}
                      </Box>
                      {int}
                    </Box>
                  </MenuItem>
                );
              })}
            </Menu>
          </div>

          {!isMobile && (
            <IconButton
              size="small"
              onClick={handleFullscreen}
              isDark={isDark}
              style={{ marginLeft: '8px' }}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize /> : <Maximize />}
            </IconButton>
          )}
        </Box>
      </Box>

      <Box style={{
        position: 'relative',
        height: isFullscreen ? 'calc(100vh - 120px)' : isMobile ? '380px' : '550px',
        borderRadius: '8px',
        overflow: 'hidden',
        marginRight: isMobile ? '-4px' : '0',
        marginLeft: isMobile ? '-4px' : '0'
      }}>
        <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
        {(() => {
          const hasChartData =
            chartType === 'holders' ? holderData && holderData.length > 0 : data && data.length > 0;

          if (loading && !chartRef.current) {
            return (
              <Box style={{
                position: 'absolute',
                inset: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none'
              }}>
                <Spinner size={24} color={isDark ? '#FFFFFF' : '#212B36'} />
              </Box>
            );
          }

          if (!hasChartData && !loading) {
            return (
              <Box style={{
                position: 'absolute',
                inset: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Typography color="text.secondary" isDark={isDark}>No data available</Typography>
              </Box>
            );
          }
          return null;
        })()}
      </Box>
    </Card>
  );
});

PriceChartAdvanced.displayName = 'PriceChartAdvanced';

export default PriceChartAdvanced;
