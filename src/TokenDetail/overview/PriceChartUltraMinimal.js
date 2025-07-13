import { useState, useEffect, useRef, memo } from 'react';
import { Box, ButtonGroup, Button, Typography, useTheme, Paper } from '@mui/material';
import axios from 'axios';

// Use regular Highcharts instead of Highstock for lighter bundle
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

// Ultra-minimal chart for maximum performance
const PriceChartUltraMinimal = memo(({ token }) => {
  const theme = useTheme();
  const chartRef = useRef(null);
  const [chartType, setChartType] = useState(1); // 0=line, 1=candlestick
  const [range, setRange] = useState('12h');
  const [chartData, setChartData] = useState(null);
  
  const BASE_URL = process.env.API_URL;
  const isDark = theme.palette.mode === 'dark';

  // Single effect for data fetching
  useEffect(() => {
    if (!token?.md5) return;
    
    let cancelled = false;
    
    const loadData = async () => {
      try {
        const apiRange = range === '12h' ? 'SPARK' : range;
        const url = chartType === 1 
          ? `${BASE_URL}/graph-ohlc-with-metrics/${token.md5}?range=${apiRange}&vs_currency=XRP`
          : `${BASE_URL}/graph-with-metrics/${token.md5}?range=${apiRange}&vs_currency=XRP`;
        
        const { data } = await axios.get(url);
        
        if (cancelled) return;
        
        if (chartType === 1 && data?.ohlc) {
          setChartData({
            type: 'candlestick',
            data: data.ohlc.slice(-500) // Limit data points
          });
        } else if (data?.history) {
          setChartData({
            type: 'line',
            data: data.history.slice(-500)
          });
        }
      } catch (err) {
        // Silent fail
      }
    };

    loadData();
    
    return () => { cancelled = true; };
  }, [token.md5, range, chartType, BASE_URL]);

  // Ultra-minimal options
  const options = chartData ? {
    chart: {
      height: 350,
      type: chartData.type === 'line' ? 'line' : 'candlestick',
      backgroundColor: null,
      animation: false,
      marginTop: 10,
      marginBottom: 40,
      style: { fontFamily: 'inherit' }
    },
    title: { text: null },
    credits: { enabled: false },
    legend: { enabled: false },
    xAxis: {
      type: 'datetime',
      labels: {
        style: { color: theme.palette.text.secondary, fontSize: '10px' },
        y: 20
      },
      lineWidth: 0,
      tickWidth: 0,
      gridLineWidth: 0
    },
    yAxis: {
      labels: {
        style: { color: theme.palette.text.secondary, fontSize: '10px' },
        x: -5,
        formatter: function() {
          const val = this.value;
          if (val < 0.0001) return val.toExponential(2);
          if (val < 1) return val.toFixed(6);
          return val.toFixed(2);
        }
      },
      title: { text: null },
      gridLineColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      gridLineWidth: 1
    },
    tooltip: {
      enabled: true,
      animation: false,
      hideDelay: 0,
      shadow: false,
      backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
      borderWidth: 1,
      borderColor: theme.palette.divider,
      borderRadius: 2,
      padding: 4,
      style: { fontSize: '11px' },
      positioner: function() {
        return { x: 10, y: 10 };
      }
    },
    plotOptions: {
      series: {
        animation: false,
        states: { hover: { enabled: false } }
      },
      candlestick: {
        color: '#f44336',
        upColor: '#4caf50',
        lineColor: '#f44336',
        upLineColor: '#4caf50',
        lineWidth: 1
      },
      line: {
        color: theme.palette.primary.main,
        lineWidth: 1.5,
        marker: { enabled: false },
        states: { hover: { enabled: false } }
      }
    },
    series: [{
      type: chartData.type,
      name: 'Price',
      data: chartData.type === 'candlestick' 
        ? chartData.data.map(d => [d[0], d[1], d[2], d[3], d[4]])
        : chartData.data.map(d => [d[0], d[1]]),
      turboThreshold: 0
    }]
  } : null;

  return (
    <Paper elevation={0} sx={{ p: 2, backgroundColor: 'background.paper' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={500}>
          {token.name} Chart
        </Typography>
        
        {/* Controls */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <ButtonGroup size="small" sx={{ height: 28 }}>
            <Button 
              onClick={() => setChartType(1)}
              sx={{ 
                px: 1.5, 
                fontSize: '0.75rem',
                backgroundColor: chartType === 1 ? 'primary.main' : 'transparent'
              }}
            >
              Candles
            </Button>
            <Button 
              onClick={() => setChartType(0)}
              sx={{ 
                px: 1.5, 
                fontSize: '0.75rem',
                backgroundColor: chartType === 0 ? 'primary.main' : 'transparent'
              }}
            >
              Line
            </Button>
          </ButtonGroup>

          <ButtonGroup size="small" sx={{ height: 28 }}>
            {['12h', '1D', '7D', '1M'].map(r => (
              <Button
                key={r}
                onClick={() => setRange(r)}
                sx={{ 
                  px: 1, 
                  fontSize: '0.75rem',
                  minWidth: 36,
                  backgroundColor: range === r ? 'primary.main' : 'transparent'
                }}
              >
                {r}
              </Button>
            ))}
          </ButtonGroup>
        </Box>
      </Box>

      {/* Chart container */}
      <Box sx={{ height: 350, position: 'relative' }}>
        {!chartData ? (
          <Box sx={{ 
            position: 'absolute', 
            inset: 0, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Typography variant="caption" color="text.secondary">
              Loading...
            </Typography>
          </Box>
        ) : (
          <HighchartsReact
            ref={chartRef}
            highcharts={Highcharts}
            options={options}
            immutable={true}
          />
        )}
      </Box>
    </Paper>
  );
});

PriceChartUltraMinimal.displayName = 'PriceChartUltraMinimal';

export default PriceChartUltraMinimal;