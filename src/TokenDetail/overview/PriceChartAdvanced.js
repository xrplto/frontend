import { useState, useEffect, useRef, memo, useContext } from 'react';
import { Box, ButtonGroup, Button, Typography, useTheme, Paper, IconButton, Menu, MenuItem, CircularProgress, alpha } from '@mui/material';
import { createChart, CandlestickSeries, LineSeries, HistogramSeries, AreaSeries } from 'lightweight-charts';
import axios from 'axios';
import { AppContext } from 'src/AppContext';
import { currencySymbols } from 'src/utils/constants';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import CandlestickChartIcon from '@mui/icons-material/CandlestickChart';
import RefreshIcon from '@mui/icons-material/Refresh';
import GroupIcon from '@mui/icons-material/Group';

const PriceChartAdvanced = memo(({ token }) => {
  const theme = useTheme();
  const { activeFiatCurrency, accountProfile } = useContext(AppContext);
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const lineSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const userTradeMarkersRef = useRef(null);
  const isMobile = theme.breakpoints.values.sm > window.innerWidth;
  
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
  const [showHolders, setShowHolders] = useState(false);
  const [userTrades, setUserTrades] = useState([]);
  
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

  const convertScientificToRegular = (value) => {
    if (typeof value === 'string') {
      value = parseFloat(value);
    }
    return Number(value);
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

  useEffect(() => {
    if (!token?.md5) return;
    
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
            time: Math.floor(candle[0] / 1000),
            open: convertScientificToRegular(candle[1]),
            high: convertScientificToRegular(candle[2]),
            low: convertScientificToRegular(candle[3]),
            close: convertScientificToRegular(candle[4]),
            value: convertScientificToRegular(candle[4]),
            volume: convertScientificToRegular(candle[5]) || 0
          }));
          
          setData(processedData);
          setLastUpdate(new Date());
          
          // Calculate ATH from the data
          const allTimeHigh = Math.max(...processedData.map(d => d.high));
          const currentPrice = processedData[processedData.length - 1].close;
          const percentFromATH = ((currentPrice - allTimeHigh) / allTimeHigh * 100).toFixed(2);
          
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
        }
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error('Chart error:', error);
        }
        setLoading(false);
        setIsUpdating(false);
      }
    };

    fetchData();
    
    // Set up 4-second refresh interval
    const interval = setInterval(() => {
      fetchData(true);
    }, 4000);
    
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [token.md5, range, BASE_URL, activeFiatCurrency]);

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
          // Process data and ensure unique timestamps
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
            .sort((a, b) => a.time - b.time) // Sort by time ascending
            .filter((item, index, array) => {
              // Remove duplicates, keeping the last occurrence
              return index === array.length - 1 || item.time !== array[index + 1].time;
            });
          
          setHolderData(processedData);
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

  // Fetch user trading history
  useEffect(() => {
    if (!token?.md5 || !accountProfile?.account) return;
    
    const controller = new AbortController();
    
    const fetchUserTrades = async () => {
      try {
        const endpoint = `${BASE_URL}/history?md5=${token.md5}&account=${accountProfile.account}&page=0&limit=100`;
        
        const response = await axios.get(endpoint, { signal: controller.signal });
        
        if (response.data?.hists && response.data.hists.length > 0) {
          // Process trades to identify buy/sell
          const processedTrades = response.data.hists.map(trade => {
            const isBuy = trade.taker === accountProfile.account && trade.got.currency === token.currency;
            const isSell = trade.taker === accountProfile.account && trade.paid.currency === token.currency;
            
            return {
              time: Math.floor(trade.time / 1000),
              type: isBuy ? 'buy' : 'sell',
              price: isBuy ? 
                (parseFloat(trade.paid.value) / parseFloat(trade.got.value)) : 
                (parseFloat(trade.got.value) / parseFloat(trade.paid.value)),
              amount: isBuy ? parseFloat(trade.got.value) : parseFloat(trade.paid.value),
              hash: trade.hash,
              // Store raw trade data for tooltip
              paidCurrency: trade.paid.currency === 'XRP' ? 'XRP' : trade.paid.currency.slice(0, 3),
              paidValue: trade.paid.value,
              gotCurrency: trade.got.currency === 'XRP' ? 'XRP' : trade.got.currency.slice(0, 3),
              gotValue: trade.got.value
            };
          }).filter(trade => trade.time > 0 && trade.price > 0);
          
          setUserTrades(processedTrades);
        }
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error('User trades error:', error);
        }
      }
    };

    fetchUserTrades();
    
    return () => controller.abort();
  }, [token.md5, token.currency, accountProfile?.account, BASE_URL]);

  useEffect(() => {
    // For holders chart, use holderData; for others use regular data
    const chartData = chartType === 'holders' ? holderData : data;
    if (!chartContainerRef.current || !chartData || chartData.length === 0) return;

    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch (e) {
        // Chart already disposed
      }
      chartRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: isMobile ? 280 : 400,
      layout: {
        background: {
          type: 'solid',
          color: chartType === 'candles' 
            ? (isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.08)') 
            : 'transparent'
        },
        textColor: theme.palette.text.primary,
        fontSize: 12,
        fontFamily: "'Segoe UI', Roboto, Arial, sans-serif",
      },
      grid: {
        vertLines: {
          color: chartType === 'candles'
            ? (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.1)')
            : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'),
          style: 1, // Dashed lines
        },
        horzLines: {
          color: chartType === 'candles'
            ? (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.12)')
            : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'),
          style: 0, // Solid lines
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
          top: 0.1,
          bottom: 0.2,
        },
        mode: isMobile ? 2 : 0, // Mode 2 = overlay price scale
        autoScale: true,
        borderVisible: false,
        visible: !isMobile, // Hide the scale completely on mobile
      },
      localization: {
        priceFormatter: (price) => {
          // For holders chart, show as integer
          if (chartType === 'holders') {
            if (price < 1000) {
              return Math.round(price).toString();
            } else if (price < 1000000) {
              return (price / 1000).toFixed(1) + 'K';
            } else {
              return (price / 1000000).toFixed(1) + 'M';
            }
          }
          
          const symbol = currencySymbols[activeFiatCurrency] || '';
          
          // Use more compact formatting on mobile
          if (isMobile) {
            if (price < 0.00001) {
              return symbol + price.toExponential(2);
            } else if (price < 0.01) {
              return symbol + price.toFixed(5);
            } else if (price < 1) {
              return symbol + price.toFixed(3);
            } else if (price < 1000) {
              return symbol + price.toFixed(2);
            } else if (price < 1000000) {
              return symbol + (price / 1000).toFixed(1) + 'K';
            } else {
              return symbol + (price / 1000000).toFixed(1) + 'M';
            }
          }
          
          // Desktop formatting
          if (price < 0.000000001) {
            return symbol + price.toFixed(12);
          } else if (price < 0.00001) {
            return symbol + price.toFixed(10);
          } else if (price < 0.01) {
            return symbol + price.toFixed(8);
          } else if (price < 1) {
            return symbol + price.toFixed(6);
          } else if (price < 100) {
            return symbol + price.toFixed(4);
          } else {
            return symbol + price.toFixed(2);
          }
        },
      },
      timeScale: {
        borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 12,
        barSpacing: 6,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
    });

    chartRef.current = chart;

    // Add tooltip
    const toolTip = document.createElement('div');
    toolTip.style = `width: 140px; height: auto; position: absolute; display: none; padding: 8px; box-sizing: border-box; font-size: 12px; text-align: left; z-index: 1000; top: 12px; left: 12px; pointer-events: none; border-radius: 4px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; background: ${isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.95)'}; color: ${theme.palette.text.primary}; border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}; box-shadow: 0 2px 8px ${isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.15)'}`;
    chartContainerRef.current.appendChild(toolTip);

    chart.subscribeCrosshairMove(param => {
      if (!param.time || param.point.x < 0 || param.point.x > chartContainerRef.current.clientWidth ||
          param.point.y < 0 || param.point.y > chartContainerRef.current.clientHeight) {
        toolTip.style.display = 'none';
        return;
      }

      const dateStr = new Date(param.time * 1000).toLocaleDateString();
      toolTip.style.display = 'block';
      
      let ohlcData = '';
      const symbol = currencySymbols[activeFiatCurrency] || '';
      
      // Find the candle data for the current time
      const candle = chartData.find(d => d.time === param.time);
      
      // Check if there's a user trade near this time
      let userTradeInfo = '';
      if (userTrades.length > 0 && chartType !== 'holders') {
        const nearbyTrade = userTrades.find(trade => {
          return Math.abs(trade.time - param.time) < 86400; // Within 1 day
        });
        
        if (nearbyTrade) {
          userTradeInfo = `
            <div style="margin-top: 8px; padding-top: 8px; border-top: 2px solid ${nearbyTrade.type === 'buy' ? '#2196f3' : '#f44336'}">
              <div style="font-weight: 600; color: ${nearbyTrade.type === 'buy' ? '#2196f3' : '#f44336'}">
                Your ${nearbyTrade.type === 'buy' ? 'Buy' : 'Sell'}
              </div>
              <div style="display: flex; justify-content: space-between">
                <span>Amount:</span><span>${nearbyTrade.amount.toFixed(4)}</span>
              </div>
              <div style="display: flex; justify-content: space-between">
                <span>Price:</span><span>${symbol}${nearbyTrade.price.toFixed(6)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 10px; opacity: 0.7">
                <span>${nearbyTrade.type === 'buy' ? 'Paid' : 'Got'}:</span>
                <span>${nearbyTrade.type === 'buy' ? nearbyTrade.paidValue : nearbyTrade.gotValue} ${nearbyTrade.type === 'buy' ? nearbyTrade.paidCurrency : nearbyTrade.gotCurrency}</span>
              </div>
            </div>
          `;
        }
      }
      
      if (candle) {
        const formatPrice = (p) => p < 0.01 ? p.toFixed(8) : p.toFixed(4);
        
        if (chartType === 'candles') {
          const change = ((candle.close - candle.open) / candle.open * 100).toFixed(2);
          const changeColor = candle.close >= candle.open ? '#4caf50' : '#f44336';
          
          // Check if RSI indicator is active and get RSI value
          const hasRsi = indicators.some(i => i.id === 'rsi');
          const rsiValue = hasRsi && rsiValues[param.time] ? rsiValues[param.time] : null;
          
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
            ${rsiValue !== null ? `
              <div style="display: flex; justify-content: space-between; margin-top: 4px; padding-top: 4px; border-top: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}">
                <span>RSI:</span>
                <span style="color: ${rsiValue > 70 ? '#f44336' : rsiValue < 30 ? '#4caf50' : 'inherit'}">
                  ${rsiValue.toFixed(1)}${rsiValue > 70 ? ' (OB)' : rsiValue < 30 ? ' (OS)' : ''}
                </span>
              </div>
            ` : ''}
          `;
        } else if (chartType === 'line') {
          // Check if RSI indicator is active and get RSI value
          const hasRsi = indicators.some(i => i.id === 'rsi');
          const rsiValue = hasRsi && rsiValues[param.time] ? rsiValues[param.time] : null;
          
          ohlcData = `
            <div style="font-weight: 500; margin-bottom: 4px">${dateStr}</div>
            <div style="display: flex; justify-content: space-between"><span>Price:</span><span>${symbol}${formatPrice(candle.close)}</span></div>
            <div style="display: flex; justify-content: space-between"><span>Vol:</span><span>${candle.volume.toLocaleString()}</span></div>
            ${rsiValue !== null ? `
              <div style="display: flex; justify-content: space-between; margin-top: 4px; padding-top: 4px; border-top: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}">
                <span>RSI:</span>
                <span style="color: ${rsiValue > 70 ? '#f44336' : rsiValue < 30 ? '#4caf50' : 'inherit'}">
                  ${rsiValue.toFixed(1)}${rsiValue > 70 ? ' (OB)' : rsiValue < 30 ? ' (OS)' : ''}
                </span>
              </div>
            ` : ''}
          `;
        } else if (chartType === 'holders') {
          ohlcData = `
            <div style="font-weight: 500; margin-bottom: 4px">${dateStr}</div>
            <div style="display: flex; justify-content: space-between"><span>Total Holders:</span><span>${candle.holders ? candle.holders.toLocaleString() : candle.value.toLocaleString()}</span></div>
            ${candle.active24H ? `<div style="display: flex; justify-content: space-between"><span>Active 24H:</span><span>${candle.active24H.toLocaleString()}</span></div>` : ''}
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
        toolTip.innerHTML = ohlcData + userTradeInfo;
        const coordinate = chart.priceScale('right').width();
        const shiftedCoordinate = param.point.x - 50;
        if (coordinate === null) {
          return;
        }
        const x = Math.max(0, Math.min(chartContainerRef.current.clientWidth - 150, shiftedCoordinate));
        const y = 12;
        toolTip.style.left = x + 'px';
        toolTip.style.top = y + 'px';
      }
    });

    if (chartType === 'candles') {
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#4caf50',
        downColor: '#f44336',
        borderUpColor: '#4caf50',
        borderDownColor: '#f44336',
        wickUpColor: '#4caf50',
        wickDownColor: '#f44336',
      });
      candleSeries.setData(chartData);
      candleSeriesRef.current = candleSeries;
    } else if (chartType === 'line') {
      // Create area series for line chart with gradient fill
      const areaSeries = chart.addSeries(AreaSeries, {
        lineColor: theme.palette.primary.main,
        topColor: theme.palette.primary.main + '80', // 50% opacity
        bottomColor: theme.palette.primary.main + '08', // 3% opacity
        lineWidth: 2,
        lineStyle: 0,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        crosshairMarkerBorderColor: theme.palette.primary.main,
        crosshairMarkerBackgroundColor: theme.palette.background.paper,
      });
      areaSeries.setData(chartData.map(d => ({ time: d.time, value: d.close })));
      lineSeriesRef.current = areaSeries;
    } else if (chartType === 'holders') {
      // Create area series for holders chart with purple gradient
      const holdersSeries = chart.addSeries(AreaSeries, {
        lineColor: '#9c27b0',
        topColor: 'rgba(156, 39, 176, 0.56)', // Purple with 35% opacity
        bottomColor: 'rgba(156, 39, 176, 0.04)', // Purple with 2.5% opacity
        lineWidth: 2,
        lineStyle: 0,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        crosshairMarkerBorderColor: '#9c27b0',
        crosshairMarkerBackgroundColor: theme.palette.background.paper,
      });
      holdersSeries.setData(chartData.map(d => ({ time: d.time, value: d.value || d.holders })));
      lineSeriesRef.current = holdersSeries;
    }

    // Only show volume for price charts, not holder charts
    if (chartType !== 'holders') {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: '#26a69a',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: '',
        scaleMargins: {
          top: 0.9,
          bottom: 0,
        },
        priceLineVisible: false,
        lastValueVisible: !isMobile,
      });
      volumeSeries.setData(chartData.map(d => ({
        time: d.time,
        value: d.volume || 0,
        color: d.close >= d.open 
          ? (isDark ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.5)')  // Green with transparency
          : (isDark ? 'rgba(244, 67, 54, 0.3)' : 'rgba(244, 67, 54, 0.5)')  // Red with transparency
      })));
      volumeSeriesRef.current = volumeSeries;
    }

    // Only apply indicators for price charts
    if (chartType !== 'holders' && data) {
      indicators.forEach(indicator => {
        if (indicator.id.startsWith('sma')) {
          const smaData = calculateSMA(data, indicator.period);
          const smaSeries = chart.addSeries(LineSeries, {
            color: indicator.period === 20 ? 'rgba(33, 150, 243, 0.9)' : 'rgba(255, 152, 0, 0.9)',
            lineWidth: 2,
            lineStyle: 0,
          });
          smaSeries.setData(smaData);
        } else if (indicator.id.startsWith('ema')) {
          const emaData = calculateEMA(data, indicator.period);
          const emaSeries = chart.addSeries(LineSeries, {
            color: indicator.period === 20 ? 'rgba(156, 39, 176, 0.9)' : 'rgba(244, 67, 54, 0.9)',
            lineWidth: 2,
            lineStyle: 0,
          });
          emaSeries.setData(emaData);
        } else if (indicator.id === 'bb') {
          const bbData = calculateBollingerBands(data);
        
        const upperBand = chart.addSeries(LineSeries, {
          color: '#795548',
          lineWidth: 1,
          lineStyle: 2,
        });
        upperBand.setData(bbData.map(d => ({ time: d.time, value: d.upper })));
        
        const middleBand = chart.addSeries(LineSeries, {
          color: '#607d8b',
          lineWidth: 1,
        });
        middleBand.setData(bbData.map(d => ({ time: d.time, value: d.middle })));
        
        const lowerBand = chart.addSeries(LineSeries, {
          color: '#795548',
          lineWidth: 1,
          lineStyle: 2,
        });
        lowerBand.setData(bbData.map(d => ({ time: d.time, value: d.lower })));
      } else if (indicator.id === 'fib') {
        // Calculate Fibonacci Extensions based on visible data range
        const high = Math.max(...data.map(d => d.high));
        const low = Math.min(...data.map(d => d.low));
        const diff = high - low;
        
        const fibLevels = [
          { level: 0, price: low },
          { level: 0.236, price: low + diff * 0.236 },
          { level: 0.382, price: low + diff * 0.382 },
          { level: 0.5, price: low + diff * 0.5 },
          { level: 0.618, price: low + diff * 0.618 },
          { level: 0.786, price: low + diff * 0.786 },
          { level: 1, price: high },
          { level: 1.618, price: low + diff * 1.618 },
          { level: 2.618, price: low + diff * 2.618 }
        ];
        
        fibLevels.forEach((fib, index) => {
          const fibSeries = chart.addSeries(LineSeries, {
            color: index < 6 ? '#ff9800' : '#e91e63',
            lineWidth: 1,
            lineStyle: 2,
            lastValueVisible: false,
            priceLineVisible: false,
            crosshairMarkerVisible: false,
            title: `Fib ${fib.level}`,
          });
          
          // Create horizontal line across entire chart
          const lineData = [
            { time: chartData[0].time, value: fib.price },
            { time: chartData[chartData.length - 1].time, value: fib.price }
          ];
          fibSeries.setData(lineData);
        });
      } else if (indicator.id === 'rsi') {
        const rsiData = calculateRSI(data, indicator.period);
        
        // RSI oscillator in separate pane with gradient area
        const rsiSeries = chart.addSeries(AreaSeries, {
          lineColor: '#9c27b0',
          topColor: 'rgba(156, 39, 176, 0.4)',
          bottomColor: 'rgba(156, 39, 176, 0.05)',
          lineWidth: 2,
          priceScaleId: 'rsi',
          priceFormat: {
            type: 'custom',
            formatter: (price) => price.toFixed(0),
          },
        });
        
        // Configure RSI scale
        chart.priceScale('rsi').applyOptions({
          scaleMargins: {
            top: 0.8,
            bottom: 0,
          },
          borderVisible: false,
          autoScale: false,
          minimum: 0,
          maximum: 100,
        });
        
        rsiSeries.setData(rsiData);
        
        // Add overbought line (70)
        const overboughtSeries = chart.addSeries(LineSeries, {
          color: '#f44336',
          lineWidth: 1,
          lineStyle: 2,
          priceScaleId: 'rsi',
          lastValueVisible: false,
          priceLineVisible: false,
          crosshairMarkerVisible: false,
        });
        overboughtSeries.setData([
          { time: chartData[0].time, value: 70 },
          { time: chartData[chartData.length - 1].time, value: 70 }
        ]);
        
        // Add oversold line (30)
        const oversoldSeries = chart.addSeries(LineSeries, {
          color: '#4caf50',
          lineWidth: 1,
          lineStyle: 2,
          priceScaleId: 'rsi',
          lastValueVisible: false,
          priceLineVisible: false,
          crosshairMarkerVisible: false,
        });
        oversoldSeries.setData([
          { time: chartData[0].time, value: 30 },
          { time: chartData[chartData.length - 1].time, value: 30 }
        ]);
        
        // Add middle line (50)
        const middleSeries = chart.addSeries(LineSeries, {
          color: theme.palette.divider,
          lineWidth: 1,
          lineStyle: 2,
          priceScaleId: 'rsi',
          lastValueVisible: false,
          priceLineVisible: false,
          crosshairMarkerVisible: false,
        });
        middleSeries.setData([
          { time: chartData[0].time, value: 50 },
          { time: chartData[chartData.length - 1].time, value: 50 }
        ]);
      } else if (indicator.id === 'ath' && athData.price) {
        // Add ATH line
        const athSeries = chart.addSeries(LineSeries, {
          color: '#ff5722',
          lineWidth: 2,
          lineStyle: 1, // Dashed line
          lastValueVisible: true,
          priceLineVisible: true,
          title: 'ATH',
        });
        
        const athLineData = [
          { time: chartData[0].time, value: athData.price },
          { time: chartData[chartData.length - 1].time, value: athData.price }
        ];
        athSeries.setData(athLineData);
      }
    });
    }

    // Add user trade markers as a separate series
    if (userTrades.length > 0 && chartType !== 'holders' && data) {
      // Filter trades within the visible data range and sort by time
      const firstDataTime = data[0].time;
      const lastDataTime = data[data.length - 1].time;
      const visibleTrades = userTrades
        .filter(trade => trade.time >= firstDataTime && trade.time <= lastDataTime)
        .sort((a, b) => a.time - b.time);

      if (visibleTrades.length > 0) {
        // Create separate series for buy and sell markers
        const buyTrades = [];
        const sellTrades = [];
        
        visibleTrades.forEach((trade, index) => {
          // Find the closest data point to the trade time
          const closestDataPoint = data.reduce((prev, curr) => {
            return Math.abs(curr.time - trade.time) < Math.abs(prev.time - trade.time) ? curr : prev;
          });
          
          const tradePoint = {
            time: trade.time,
            value: closestDataPoint.close || closestDataPoint.value
          };
          
          if (trade.type === 'buy') {
            buyTrades.push(tradePoint);
          } else {
            sellTrades.push(tradePoint);
          }
        });
        
        // Sort and handle duplicates for buy trades
        if (buyTrades.length > 0) {
          const sortedBuyTrades = buyTrades
            .sort((a, b) => a.time - b.time)
            .map((item, index, array) => {
              if (index > 0 && item.time === array[index - 1].time) {
                return { ...item, time: item.time + index };
              }
              return item;
            });
            
          const buyMarkerSeries = chart.addSeries(LineSeries, {
            color: '#2196f3',
            lineVisible: false,
            lineWidth: 0,
            lastValueVisible: false,
            priceLineVisible: false,
            crosshairMarkerVisible: false,
            pointMarkersVisible: true,
            pointMarkersRadius: 3.5,
          });
          buyMarkerSeries.setData(sortedBuyTrades);
        }
        
        // Sort and handle duplicates for sell trades
        if (sellTrades.length > 0) {
          const sortedSellTrades = sellTrades
            .sort((a, b) => a.time - b.time)
            .map((item, index, array) => {
              if (index > 0 && item.time === array[index - 1].time) {
                return { ...item, time: item.time + index };
              }
              return item;
            });
            
          const sellMarkerSeries = chart.addSeries(LineSeries, {
            color: '#f44336',
            lineVisible: false,
            lineWidth: 0,
            lastValueVisible: false,
            priceLineVisible: false,
            crosshairMarkerVisible: false,
            pointMarkersVisible: true,
            pointMarkersRadius: 3.5,
          });
          sellMarkerSeries.setData(sortedSellTrades);
        }
      }
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      // Remove tooltip
      if (chartContainerRef.current) {
        const tooltips = chartContainerRef.current.querySelectorAll('div[style*="position: absolute"]');
        tooltips.forEach(tooltip => tooltip.remove());
      }
      if (chartRef.current) {
        try {
          chart.remove();
        } catch (e) {
          // Chart already disposed
        }
        chartRef.current = null;
      }
    };
  }, [data, holderData, chartType, theme, isDark, indicators, activeFiatCurrency, athData, rsiValues, userTrades]);

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
        overflow: 'hidden'
      }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="h6" sx={{ fontSize: '1rem' }}>
            {token.name} {chartType === 'holders' ? 'Holders' : `Price (${activeFiatCurrency})`}
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
                ({currencySymbols[activeFiatCurrency] || ''}{athData.price < 0.01 ? athData.price.toFixed(8) : athData.price.toFixed(4)})
              </Typography>
            </Box>
          )}
          {isUpdating && (
            <CircularProgress size={16} sx={{ ml: 1 }} />
          )}
          {!isUpdating && lastUpdate && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              <RefreshIcon sx={{ fontSize: 12, verticalAlign: 'middle', mr: 0.5 }} />
              {lastUpdate.toLocaleTimeString()}
              {chartType === 'holders' && holderData && holderData.length > 0 && (
                <span style={{ marginLeft: '8px', color: theme.palette.primary.main }}>
                  Top 10%: {holderData[holderData.length - 1].top10?.toFixed(2)}%
                </span>
              )}
            </Typography>
          )}
          {userTrades.length > 0 && chartType !== 'holders' && accountProfile && (
            <Box sx={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: 0.5,
              ml: 1,
              px: 1,
              py: 0.25,
              borderRadius: 1,
              bgcolor: alpha(theme.palette.info.main, 0.1),
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
            }}>
              <Typography variant="caption" sx={{ fontWeight: 500, color: theme.palette.info.main }}>
                Your Trades: {userTrades.length}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {userTrades.filter(t => t.type === 'buy').length > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                    <Box sx={{ 
                      width: 0, 
                      height: 0, 
                      borderLeft: '4px solid transparent',
                      borderRight: '4px solid transparent',
                      borderBottom: '6px solid #2196f3'
                    }} />
                    <Typography variant="caption" sx={{ color: '#2196f3', fontWeight: 600 }}>
                      {userTrades.filter(t => t.type === 'buy').length}
                    </Typography>
                  </Box>
                )}
                {userTrades.filter(t => t.type === 'sell').length > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                    <Box sx={{ 
                      width: 0, 
                      height: 0, 
                      borderLeft: '4px solid transparent',
                      borderRight: '4px solid transparent',
                      borderTop: '6px solid #f44336'
                    }} />
                    <Typography variant="caption" sx={{ color: '#f44336', fontWeight: 600 }}>
                      {userTrades.filter(t => t.type === 'sell').length}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}
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
                onClick={() => setRange(r)}
                variant={range === r ? 'contained' : 'outlined'}
                sx={{ px: 1, fontSize: '0.75rem', minWidth: 36 }}
              >
                {r}
              </Button>
            ))}
          </ButtonGroup>

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
        height: isMobile ? 280 : 400,
        borderRadius: 1,
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: `linear-gradient(90deg, transparent, ${theme.palette.primary.main}40, transparent)`,
          opacity: 0,
          transition: 'opacity 0.3s ease',
        },
        '&:hover::before': {
          opacity: 1,
        }
      }}>
        {loading ? (
          <Box sx={{ 
            position: 'absolute', 
            inset: 0, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Typography color="text.secondary">Loading chart data...</Typography>
          </Box>
        ) : !data || data.length === 0 ? (
          <Box sx={{ 
            position: 'absolute', 
            inset: 0, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Typography color="text.secondary">No data available</Typography>
          </Box>
        ) : (
          <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
        )}
      </Box>
    </Paper>
  );
});

PriceChartAdvanced.displayName = 'PriceChartAdvanced';

export default PriceChartAdvanced;