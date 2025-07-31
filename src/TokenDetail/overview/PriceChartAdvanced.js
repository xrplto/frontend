import { useState, useEffect, useRef, memo, useContext } from 'react';
import { Box, ButtonGroup, Button, Typography, useTheme, Paper, IconButton, Menu, MenuItem, CircularProgress } from '@mui/material';
import { createChart, CandlestickSeries, LineSeries, AreaSeries, HistogramSeries } from 'lightweight-charts';
import axios from 'axios';
import { AppContext } from 'src/AppContext';
import { currencySymbols } from 'src/utils/constants';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import CandlestickChartIcon from '@mui/icons-material/CandlestickChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import RefreshIcon from '@mui/icons-material/Refresh';

const PriceChartAdvanced = memo(({ token }) => {
  const theme = useTheme();
  const { activeFiatCurrency } = useContext(AppContext);
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const lineSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const areaSeriesRef = useRef(null);
  const isMobile = theme.breakpoints.values.sm > window.innerWidth;
  
  const [chartType, setChartType] = useState('candles');
  const [range, setRange] = useState('1D');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [indicators, setIndicators] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  const BASE_URL = process.env.API_URL;
  const isDark = theme.palette.mode === 'dark';

  const chartTypeIcons = {
    candles: <CandlestickChartIcon fontSize="small" />,
    line: <ShowChartIcon fontSize="small" />,
    area: <TimelineIcon fontSize="small" />,
    bars: <BarChartIcon fontSize="small" />
  };

  const indicatorOptions = [
    { id: 'sma20', name: 'SMA 20', period: 20 },
    { id: 'sma50', name: 'SMA 50', period: 50 },
    { id: 'ema20', name: 'EMA 20', period: 20 },
    { id: 'ema50', name: 'EMA 50', period: 50 },
    { id: 'bb', name: 'Bollinger Bands', period: 20 },
    { id: 'fib', name: 'Fibonacci Extensions' }
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

  useEffect(() => {
    if (!chartContainerRef.current || !data || data.length === 0) return;

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
          color: 'transparent'
        },
        textColor: theme.palette.text.primary,
      },
      grid: {
        vertLines: {
          color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        horzLines: {
          color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
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

    if (chartType === 'candles') {
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#4caf50',
        downColor: '#f44336',
        borderUpColor: '#4caf50',
        borderDownColor: '#f44336',
        wickUpColor: '#4caf50',
        wickDownColor: '#f44336',
      });
      candleSeries.setData(data);
      candleSeriesRef.current = candleSeries;
    } else if (chartType === 'line') {
      const lineSeries = chart.addSeries(LineSeries, {
        color: theme.palette.primary.main,
        lineWidth: 2,
      });
      lineSeries.setData(data.map(d => ({ time: d.time, value: d.close })));
      lineSeriesRef.current = lineSeries;
    } else if (chartType === 'area') {
      const areaSeries = chart.addSeries(AreaSeries, {
        lineColor: theme.palette.primary.main,
        topColor: theme.palette.primary.main + '80',
        bottomColor: theme.palette.primary.main + '10',
        lineWidth: 2,
      });
      areaSeries.setData(data.map(d => ({ time: d.time, value: d.close })));
      areaSeriesRef.current = areaSeries;
    } else if (chartType === 'bars') {
      const barSeries = chart.addSeries(HistogramSeries, {
        color: theme.palette.primary.main,
      });
      barSeries.setData(data.map(d => ({ time: d.time, value: d.volume })));
    }

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
      priceLineVisible: false,
      lastValueVisible: !isMobile,
    });
    volumeSeries.setData(data.map(d => ({
      time: d.time,
      value: d.volume,
      color: d.close >= d.open ? '#4caf5080' : '#f4433680'
    })));
    volumeSeriesRef.current = volumeSeries;

    indicators.forEach(indicator => {
      if (indicator.id.startsWith('sma')) {
        const smaData = calculateSMA(data, indicator.period);
        const smaSeries = chart.addSeries(LineSeries, {
          color: indicator.period === 20 ? '#2196f3' : '#ff9800',
          lineWidth: 1,
        });
        smaSeries.setData(smaData);
      } else if (indicator.id.startsWith('ema')) {
        const emaData = calculateEMA(data, indicator.period);
        const emaSeries = chart.addSeries(LineSeries, {
          color: indicator.period === 20 ? '#9c27b0' : '#f44336',
          lineWidth: 1,
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
            { time: data[0].time, value: fib.price },
            { time: data[data.length - 1].time, value: fib.price }
          ];
          fibSeries.setData(lineData);
        });
      }
    });

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        try {
          chart.remove();
        } catch (e) {
          // Chart already disposed
        }
        chartRef.current = null;
      }
    };
  }, [data, chartType, theme, isDark, indicators, activeFiatCurrency]);

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
    <Paper elevation={0} sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" sx={{ fontSize: '1rem' }}>
            {token.name} Price ({activeFiatCurrency})
          </Typography>
          {isUpdating && (
            <CircularProgress size={16} sx={{ ml: 1 }} />
          )}
          {!isUpdating && lastUpdate && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              <RefreshIcon sx={{ fontSize: 12, verticalAlign: 'middle', mr: 0.5 }} />
              {lastUpdate.toLocaleTimeString()}
            </Typography>
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
                {type.charAt(0).toUpperCase() + type.slice(1)}
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

      <Box sx={{ position: 'relative', height: isMobile ? 280 : 400 }}>
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