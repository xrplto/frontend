import { useState, useEffect, useRef, memo } from 'react';
import { Box, ButtonGroup, Button, Typography, useTheme } from '@mui/material';
import axios from 'axios';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';

// Minimal chart component for fastest loading
const PriceChartMinimal = memo(({ token }) => {
  const theme = useTheme();
  const chartRef = useRef(null);
  const [chartType, setChartType] = useState(1); // 0=line, 1=candlestick
  const [range, setRange] = useState('12h');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const BASE_URL = process.env.API_URL;
  const isDark = theme.palette.mode === 'dark';

  // Fetch data
  useEffect(() => {
    if (!token?.md5) return;
    
    const fetchData = async () => {
      try {
        const apiRange = range === '12h' ? 'SPARK' : range;
        const endpoint = chartType === 1 
          ? `${BASE_URL}/graph-ohlc-with-metrics/${token.md5}?range=${apiRange}&vs_currency=XRP`
          : `${BASE_URL}/graph-with-metrics/${token.md5}?range=${apiRange}&vs_currency=XRP`;
        
        const response = await axios.get(endpoint);
        
        if (chartType === 1 && response.data?.ohlc) {
          // OHLC data
          setData(response.data.ohlc.map(item => [
            item[0], // timestamp
            item[1], // open
            item[2], // high
            item[3], // low
            item[4]  // close
          ]));
        } else if (chartType === 0 && response.data?.history) {
          // Line data
          setData(response.data.history.map(item => [
            item[0], // timestamp
            item[1]  // price
          ]));
        }
      } catch (error) {
        console.error('Chart data error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token.md5, range, chartType, BASE_URL]);

  // Minimal chart options
  const chartOptions = {
    chart: {
      height: 400,
      backgroundColor: 'transparent',
      animation: false
    },
    title: { text: null },
    credits: { enabled: false },
    navigator: { enabled: false },
    rangeSelector: { enabled: false },
    scrollbar: { enabled: false },
    legend: { enabled: false },
    tooltip: {
      enabled: true,
      animation: false,
      shadow: false,
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      borderColor: isDark ? '#333' : '#ddd',
      borderRadius: 4,
      style: {
        fontSize: '12px'
      }
    },
    xAxis: {
      type: 'datetime',
      labels: {
        style: {
          color: theme.palette.text.secondary,
          fontSize: '11px'
        }
      },
      lineColor: isDark ? '#333' : '#ddd',
      gridLineWidth: 0
    },
    yAxis: {
      labels: {
        style: {
          color: theme.palette.text.secondary,
          fontSize: '11px'
        },
        formatter: function() {
          return this.value.toFixed(8);
        }
      },
      gridLineColor: isDark ? '#222' : '#f0f0f0',
      gridLineWidth: 1
    },
    plotOptions: {
      series: {
        animation: false
      },
      candlestick: {
        color: '#ef5350',
        upColor: '#26a69a',
        lineColor: '#ef5350',
        upLineColor: '#26a69a',
        lineWidth: 1
      },
      line: {
        color: theme.palette.primary.main,
        lineWidth: 2,
        marker: {
          enabled: false
        }
      }
    },
    series: [{
      type: chartType === 1 ? 'candlestick' : 'line',
      name: token.name || 'Price',
      data: data || [],
      turboThreshold: 0
    }]
  };

  if (loading || !data) {
    return (
      <Box sx={{ height: 460, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary">Loading chart...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Simple controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
        <Typography variant="h6">{token.name} Price Chart</Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* Chart type selector */}
          <ButtonGroup size="small">
            <Button 
              onClick={() => setChartType(1)}
              variant={chartType === 1 ? 'contained' : 'outlined'}
            >
              Candles
            </Button>
            <Button 
              onClick={() => setChartType(0)}
              variant={chartType === 0 ? 'contained' : 'outlined'}
            >
              Line
            </Button>
          </ButtonGroup>

          {/* Time range selector */}
          <ButtonGroup size="small">
            {['12h', '1D', '7D', '1M'].map(r => (
              <Button
                key={r}
                onClick={() => setRange(r)}
                variant={range === r ? 'contained' : 'outlined'}
              >
                {r}
              </Button>
            ))}
          </ButtonGroup>
        </Box>
      </Box>

      {/* Chart */}
      <Box sx={{ height: 400 }}>
        <HighchartsReact
          ref={chartRef}
          highcharts={Highcharts}
          options={chartOptions}
          constructorType={'stockChart'}
        />
      </Box>
    </Box>
  );
});

PriceChartMinimal.displayName = 'PriceChartMinimal';

export default PriceChartMinimal;