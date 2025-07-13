import { useState, useEffect, useRef, memo } from 'react';
import { Box, ButtonGroup, Button, Typography, useTheme, Paper } from '@mui/material';
import axios from 'axios';

// Lightweight chart using Canvas API for ultimate performance
const PriceChartLightweight = memo(({ token }) => {
  const theme = useTheme();
  const canvasRef = useRef(null);
  const [chartType, setChartType] = useState(1); // 0: line, 1: candles, 2: holders
  const [range, setRange] = useState('12h');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasInitialData, setHasInitialData] = useState(false);
  const [mousePos, setMousePos] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const pollingIntervalRef = useRef(null);
  
  const BASE_URL = process.env.API_URL;
  const isDark = theme.palette.mode === 'dark';

  // Fetch data
  useEffect(() => {
    if (!token?.md5) return;
    
    const controller = new AbortController();
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const apiRange = range === '12h' ? 'SPARK' : range;
        let endpoint;
        
        if (chartType === 2) {
          // Holders chart - use graphrich endpoint
          endpoint = `${BASE_URL}/graphrich/${token.md5}?range=${apiRange}`;
        } else if (chartType === 1) {
          // Candlestick chart
          endpoint = `${BASE_URL}/graph-ohlc-with-metrics/${token.md5}?range=${apiRange}&vs_currency=XRP`;
        } else {
          // Line chart
          endpoint = `${BASE_URL}/graph-with-metrics/${token.md5}?range=${apiRange}&vs_currency=XRP`;
        }
        
        const response = await axios.get(endpoint, { signal: controller.signal });
        
        if (chartType === 2 && response.data?.history && response.data.history.length > 0) {
          // Convert holders data to [time, value] format
          const holdersData = response.data.history.map(item => [
            item.time,
            item.length // graphrich returns 'length' for number of addresses
          ]);
          setData(holdersData.slice(-200));
          setHasInitialData(true);
          setLoading(false);
        } else if (chartType === 1 && response.data?.ohlc && response.data.ohlc.length > 0) {
          // Normalize OHLC data to ensure all values are numbers
          const normalizedOhlc = response.data.ohlc.map(candle => [
            candle[0], // timestamp
            parseFloat(candle[1]), // open
            parseFloat(candle[2]), // high
            parseFloat(candle[3]), // low
            parseFloat(candle[4]), // close
            parseFloat(candle[5]) || 0 // volume
          ]);
          setData(normalizedOhlc.slice(-200)); // Limit to 200 points
          setHasInitialData(true);
          setLoading(false);
        } else if (response.data?.history && response.data.history.length > 0) {
          // For line chart, history data is already in correct format [timestamp, price, volume]
          setData(response.data.history.slice(-200));
          setHasInitialData(true);
          setLoading(false);
        } else {
          // No valid data received - only set loading false if we've never had data
          if (hasInitialData) {
            setLoading(false);
          }
          setData([]);
        }
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error('Chart error:', error);
        }
        // Only set loading false if we've had initial data before
        if (hasInitialData) {
          setLoading(false);
        }
        setData([]);
      }
    };

    fetchData();
    
    return () => controller.abort();
  }, [token.md5, range, chartType, BASE_URL]);

  // Polling for live updates
  useEffect(() => {
    if (!token?.md5 || !hasInitialData) return;
    
    // Poll every 3 seconds
    const pollData = async () => {
      try {
        const apiRange = range === '12h' ? 'SPARK' : range;
        let endpoint;
        
        if (chartType === 2) {
          endpoint = `${BASE_URL}/graphrich/${token.md5}?range=${apiRange}`;
        } else if (chartType === 1) {
          endpoint = `${BASE_URL}/graph-ohlc-with-metrics/${token.md5}?range=${apiRange}&vs_currency=XRP`;
        } else {
          endpoint = `${BASE_URL}/graph-with-metrics/${token.md5}?range=${apiRange}&vs_currency=XRP`;
        }
        
        const response = await axios.get(endpoint);
        
        if (chartType === 2 && response.data?.history && response.data.history.length > 0) {
          const holdersData = response.data.history.map(item => [
            item.time,
            item.length
          ]);
          setData(holdersData.slice(-200));
        } else if (chartType === 1 && response.data?.ohlc && response.data.ohlc.length > 0) {
          const normalizedOhlc = response.data.ohlc.map(candle => [
            candle[0],
            parseFloat(candle[1]),
            parseFloat(candle[2]),
            parseFloat(candle[3]),
            parseFloat(candle[4]),
            parseFloat(candle[5]) || 0
          ]);
          setData(normalizedOhlc.slice(-200));
        } else if (response.data?.history && response.data.history.length > 0) {
          setData(response.data.history.slice(-200));
        }
        
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Polling error:', error);
      }
    };
    
    // Start polling
    pollingIntervalRef.current = setInterval(pollData, 3000);
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [token.md5, range, chartType, hasInitialData, BASE_URL]);

  // Draw chart using Canvas
  useEffect(() => {
    if (!data || !canvasRef.current || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Set canvas size
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Calculate bounds
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVolume = 0;
    
    data.forEach(item => {
      if (chartType === 1) {
        minPrice = Math.min(minPrice, item[3]); // low
        maxPrice = Math.max(maxPrice, item[2]); // high
        maxVolume = Math.max(maxVolume, item[5] || 0); // volume for OHLC
      } else if (chartType === 0) {
        minPrice = Math.min(minPrice, item[1]);
        maxPrice = Math.max(maxPrice, item[1]);
        maxVolume = Math.max(maxVolume, item[2] || 0); // volume for line chart
      } else {
        minPrice = Math.min(minPrice, item[1]);
        maxPrice = Math.max(maxPrice, item[1]);
      }
    });

    const priceRange = maxPrice - minPrice || 1; // Avoid division by zero
    const leftPadding = 80; // More space for price labels
    const rightPadding = 20;
    const topPadding = 20;
    const bottomPadding = 20;
    const chartWidth = rect.width - leftPadding - rightPadding;
    const totalHeight = rect.height - topPadding - bottomPadding;
    
    // Split height: 70% for price chart, 30% for volume
    const showVolume = chartType !== 2; // Don't show volume for holders chart
    const priceChartHeight = showVolume ? totalHeight * 0.7 : totalHeight;
    const volumeChartHeight = showVolume ? totalHeight * 0.25 : 0;
    const volumeChartGap = showVolume ? totalHeight * 0.05 : 0;

    // Draw grid
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 4; i++) {
      const y = topPadding + (priceChartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(leftPadding, y);
      ctx.lineTo(rect.width - rightPadding, y);
      ctx.stroke();
    }

    // Draw data
    if (chartType === 0 || chartType === 2) {
      // Line chart or Holders chart
      if (chartType === 2) {
        // Draw area fill for holders
        const gradient = ctx.createLinearGradient(0, topPadding, 0, topPadding + priceChartHeight);
        gradient.addColorStop(0, isDark ? 'rgba(33, 150, 243, 0.3)' : 'rgba(25, 118, 210, 0.3)');
        gradient.addColorStop(1, isDark ? 'rgba(33, 150, 243, 0.05)' : 'rgba(25, 118, 210, 0.05)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(leftPadding, topPadding + priceChartHeight);
        
        data.forEach((item, index) => {
          const x = leftPadding + (index / (data.length - 1)) * chartWidth;
          const y = topPadding + ((maxPrice - item[1]) / priceRange) * priceChartHeight;
          
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        
        ctx.lineTo(leftPadding + chartWidth, topPadding + priceChartHeight);
        ctx.lineTo(leftPadding, topPadding + priceChartHeight);
        ctx.closePath();
        ctx.fill();
      }
      
      // Draw line
      ctx.strokeStyle = theme.palette.primary.main;
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      data.forEach((item, index) => {
        const x = leftPadding + (index / (data.length - 1)) * chartWidth;
        const y = topPadding + ((maxPrice - item[1]) / priceRange) * priceChartHeight;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
    } else {
      // Candlestick chart with improved rendering
      const candleWidth = Math.max(1, chartWidth / data.length - 1);
      const candleSpacing = Math.min(2, candleWidth * 0.2);
      const actualCandleWidth = candleWidth - candleSpacing;
      
      data.forEach((item, index) => {
        const x = leftPadding + (index / data.length) * chartWidth + candleWidth / 2;
        const [time, open, high, low, close, volume] = item;
        
        const yHigh = topPadding + ((maxPrice - high) / priceRange) * priceChartHeight;
        const yLow = topPadding + ((maxPrice - low) / priceRange) * priceChartHeight;
        const yOpen = topPadding + ((maxPrice - open) / priceRange) * priceChartHeight;
        const yClose = topPadding + ((maxPrice - close) / priceRange) * priceChartHeight;
        
        const isUp = close >= open;
        
        // Enhanced colors with gradients
        if (isUp) {
          const gradient = ctx.createLinearGradient(0, yClose, 0, yOpen);
          gradient.addColorStop(0, '#4caf50');
          gradient.addColorStop(1, '#66bb6a');
          ctx.fillStyle = gradient;
          ctx.strokeStyle = '#4caf50';
        } else {
          const gradient = ctx.createLinearGradient(0, yOpen, 0, yClose);
          gradient.addColorStop(0, '#ef5350');
          gradient.addColorStop(1, '#f44336');
          ctx.fillStyle = gradient;
          ctx.strokeStyle = '#f44336';
        }
        
        // Draw wick with shadow effect
        ctx.lineWidth = Math.max(1, actualCandleWidth * 0.15);
        ctx.lineCap = 'round';
        
        // Shadow for wick
        ctx.shadowColor = isUp ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)';
        ctx.shadowBlur = 2;
        
        ctx.beginPath();
        ctx.moveTo(x, yHigh);
        ctx.lineTo(x, yLow);
        ctx.stroke();
        
        // Reset shadow
        ctx.shadowBlur = 0;
        
        // Draw body with rounded corners
        const bodyHeight = Math.abs(yClose - yOpen);
        const bodyY = Math.min(yOpen, yClose);
        const cornerRadius = Math.min(2, actualCandleWidth * 0.1);
        
        if (bodyHeight > 1) {
          // Rounded rectangle for body
          ctx.beginPath();
          ctx.moveTo(x - actualCandleWidth / 2 + cornerRadius, bodyY);
          ctx.lineTo(x + actualCandleWidth / 2 - cornerRadius, bodyY);
          ctx.quadraticCurveTo(x + actualCandleWidth / 2, bodyY, x + actualCandleWidth / 2, bodyY + cornerRadius);
          ctx.lineTo(x + actualCandleWidth / 2, bodyY + bodyHeight - cornerRadius);
          ctx.quadraticCurveTo(x + actualCandleWidth / 2, bodyY + bodyHeight, x + actualCandleWidth / 2 - cornerRadius, bodyY + bodyHeight);
          ctx.lineTo(x - actualCandleWidth / 2 + cornerRadius, bodyY + bodyHeight);
          ctx.quadraticCurveTo(x - actualCandleWidth / 2, bodyY + bodyHeight, x - actualCandleWidth / 2, bodyY + bodyHeight - cornerRadius);
          ctx.lineTo(x - actualCandleWidth / 2, bodyY + cornerRadius);
          ctx.quadraticCurveTo(x - actualCandleWidth / 2, bodyY, x - actualCandleWidth / 2 + cornerRadius, bodyY);
          ctx.closePath();
          ctx.fill();
          
          // Outline for definition
          ctx.lineWidth = 0.5;
          ctx.stroke();
        } else {
          // Thin line for doji candles
          ctx.fillRect(x - actualCandleWidth / 2, bodyY - 0.5, actualCandleWidth, 1);
        }
      });
    }

    // Draw price labels with improved styling
    ctx.fillStyle = theme.palette.text.primary;
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    // Background for price axis
    ctx.fillStyle = isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.8)';
    ctx.fillRect(0, topPadding, leftPadding - 5, priceChartHeight);
    
    for (let i = 0; i <= 4; i++) {
      const value = maxPrice - (priceRange / 4) * i;
      const y = topPadding + (priceChartHeight / 4) * i;
      let label;
      
      if (chartType === 2) {
        // Format holders count
        label = Math.round(value).toLocaleString();
      } else {
        // Format price with appropriate decimal places
        if (value < 0.00001) {
          label = value.toExponential(2);
        } else if (value < 0.01) {
          label = value.toFixed(8);
        } else if (value < 1) {
          label = value.toFixed(6);
        } else {
          label = value.toFixed(4);
        }
      }
      
      // Price label background
      const metrics = ctx.measureText(label);
      ctx.fillStyle = isDark ? 'rgba(30,30,30,0.8)' : 'rgba(245,245,245,0.9)';
      ctx.fillRect(leftPadding - metrics.width - 15, y - 8, metrics.width + 10, 16);
      
      // Price label text
      ctx.fillStyle = theme.palette.text.primary;
      ctx.fillText(label, leftPadding - 8, y);
    }

    // Draw volume bars if applicable
    if (showVolume && maxVolume > 0) {
      const volumeY = topPadding + priceChartHeight + volumeChartGap;
      
      // Draw volume grid line
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(leftPadding, volumeY + volumeChartHeight);
      ctx.lineTo(rect.width - rightPadding, volumeY + volumeChartHeight);
      ctx.stroke();
      
      // Draw volume bars
      const barWidth = Math.max(1, chartWidth / data.length - 1);
      
      data.forEach((item, index) => {
        const volume = chartType === 1 ? (item[5] || 0) : (item[2] || 0);
        const x = leftPadding + (index / data.length) * chartWidth;
        const barHeight = (volume / maxVolume) * volumeChartHeight;
        const y = volumeY + volumeChartHeight - barHeight;
        
        // Color based on price movement
        let barColor;
        if (chartType === 1) {
          // For candlestick, use open/close comparison
          barColor = item[4] >= item[1] ? '#4caf5088' : '#f4433688';
        } else if (index > 0) {
          // For line chart, compare with previous price
          barColor = item[1] >= data[index - 1][1] ? '#4caf5088' : '#f4433688';
        } else {
          barColor = '#4caf5088';
        }
        
        ctx.fillStyle = barColor;
        ctx.fillRect(x, y, barWidth * 0.8, barHeight);
      });
      
      // Draw volume section background
      ctx.fillStyle = isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)';
      ctx.fillRect(leftPadding, volumeY, chartWidth, volumeChartHeight);
      
      // Draw volume label with better styling
      ctx.fillStyle = theme.palette.text.primary;
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      
      // Volume label background
      const volLabelMetrics = ctx.measureText('Volume');
      ctx.fillStyle = isDark ? 'rgba(30,30,30,0.9)' : 'rgba(245,245,245,0.95)';
      ctx.fillRect(leftPadding, volumeY + 2, volLabelMetrics.width + 12, 16);
      
      ctx.fillStyle = theme.palette.text.primary;
      ctx.fillText('Volume', leftPadding + 6, volumeY + 5);
      
      // Draw max volume value with background
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      const volumeLabel = maxVolume > 1000000 
        ? (maxVolume / 1000000).toFixed(1) + 'M'
        : maxVolume > 1000 
        ? (maxVolume / 1000).toFixed(1) + 'K'
        : maxVolume.toFixed(0);
      
      const volMetrics = ctx.measureText(volumeLabel);
      ctx.fillStyle = isDark ? 'rgba(30,30,30,0.8)' : 'rgba(245,245,245,0.9)';
      ctx.fillRect(leftPadding - volMetrics.width - 15, volumeY + volumeChartHeight/2 - 8, volMetrics.width + 10, 16);
      
      ctx.fillStyle = theme.palette.text.primary;
      ctx.fillText(volumeLabel, leftPadding - 8, volumeY + volumeChartHeight/2);
    }

    // Draw time labels
    const timeY = showVolume ? topPadding + priceChartHeight + volumeChartGap + volumeChartHeight + 10 : topPadding + priceChartHeight + 10;
    ctx.fillStyle = theme.palette.text.secondary;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    const labelCount = Math.min(5, data.length);
    const step = Math.floor(data.length / labelCount);
    
    for (let i = 0; i < labelCount; i++) {
      const index = i * step;
      if (index < data.length) {
        const x = leftPadding + (index / (data.length - 1)) * chartWidth;
        const date = new Date(data[index][0]);
        const label = range === '12h' || range === '1D' 
          ? date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
          : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        ctx.fillText(label, x, timeY);
      }
    }

    // Draw crosshair if mouse is over chart
    if (mousePos) {
      const { x, y } = mousePos;
      const chartBounds = {
        left: leftPadding,
        right: leftPadding + chartWidth,
        top: topPadding,
        bottom: topPadding + priceChartHeight
      };

      if (x >= chartBounds.left && x <= chartBounds.right && y >= chartBounds.top && y <= chartBounds.bottom) {
        ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 0.5;
        
        // Vertical line
        ctx.beginPath();
        ctx.moveTo(x, topPadding);
        ctx.lineTo(x, topPadding + priceChartHeight);
        ctx.stroke();
        
        // Horizontal line
        ctx.beginPath();
        ctx.moveTo(leftPadding, y);
        ctx.lineTo(leftPadding + chartWidth, y);
        ctx.stroke();
        
        // Price label
        const price = maxPrice - ((y - topPadding) / priceChartHeight) * priceRange;
        const priceLabel = chartType === 2 
          ? Math.round(price).toLocaleString()
          : price < 0.01 ? price.toFixed(8) : price.toFixed(6);
        
        ctx.fillStyle = theme.palette.background.paper;
        ctx.fillRect(leftPadding - 78, y - 10, 76, 20);
        ctx.fillStyle = theme.palette.text.primary;
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(priceLabel, leftPadding - 12, y);
        
        // Time label
        const dataIndex = Math.round(((x - leftPadding) / chartWidth) * (data.length - 1));
        if (dataIndex >= 0 && dataIndex < data.length) {
          const date = new Date(data[dataIndex][0]);
          const timeLabel = date.toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            hour: 'numeric', 
            minute: '2-digit' 
          });
          
          const labelWidth = ctx.measureText(timeLabel).width;
          ctx.fillStyle = theme.palette.background.paper;
          ctx.fillRect(x - labelWidth/2 - 5, timeY - 2, labelWidth + 10, 16);
          ctx.fillStyle = theme.palette.text.primary;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(timeLabel, x, timeY);
        }
      }
    }

  }, [data, chartType, isDark, theme, mousePos]);

  return (
    <Paper elevation={0} sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" sx={{ fontSize: '1rem' }}>
            {token.name} {chartType === 2 ? 'Holders' : 'Price'}
          </Typography>
          {lastUpdate && (
            <Typography variant="caption" color="text.secondary">
              Updated: {lastUpdate.toLocaleTimeString()}
            </Typography>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <ButtonGroup size="small">
            <Button 
              onClick={() => setChartType(1)}
              variant={chartType === 1 ? 'contained' : 'outlined'}
              sx={{ px: 1, fontSize: '0.75rem' }}
            >
              Candles
            </Button>
            <Button 
              onClick={() => setChartType(0)}
              variant={chartType === 0 ? 'contained' : 'outlined'}
              sx={{ px: 1, fontSize: '0.75rem' }}
            >
              Line
            </Button>
            <Button 
              onClick={() => setChartType(2)}
              variant={chartType === 2 ? 'contained' : 'outlined'}
              sx={{ px: 1, fontSize: '0.75rem' }}
            >
              Holders
            </Button>
          </ButtonGroup>

          <ButtonGroup size="small">
            {['12h', '1D', '7D', '1M'].map(r => (
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
        </Box>
      </Box>

      {/* Canvas Chart */}
      <Box sx={{ position: 'relative', height: 300 }}>
        {loading || (!hasInitialData && (!data || data.length === 0)) ? (
          <Box sx={{ 
            position: 'absolute', 
            inset: 0, 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            gap: 2
          }}>
            {/* Animated chart bars */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'flex-end', 
              gap: 0.5,
              height: 40
            }}>
              {[0.3, 0.6, 0.4, 0.8, 0.5, 0.9, 0.7, 0.4, 0.6, 0.5].map((height, i) => (
                <Box
                  key={i}
                  sx={{
                    width: 6,
                    height: `${height * 100}%`,
                    bgcolor: theme.palette.primary.main,
                    opacity: 0.7,
                    borderRadius: 1,
                    animation: 'pulse 1.5s ease-in-out infinite',
                    animationDelay: `${i * 0.1}s`,
                    '@keyframes pulse': {
                      '0%, 100%': {
                        transform: 'scaleY(0.5)',
                        opacity: 0.5,
                      },
                      '50%': {
                        transform: 'scaleY(1)',
                        opacity: 0.8,
                      },
                    },
                  }}
                />
              ))}
            </Box>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'text.secondary',
                fontWeight: 500,
                letterSpacing: 0.5
              }}
            >
              Loading chart data
            </Typography>
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
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%', cursor: 'crosshair' }}
            onMouseMove={(e) => {
              const rect = canvasRef.current.getBoundingClientRect();
              setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
            }}
            onMouseLeave={() => setMousePos(null)}
          />
        )}
      </Box>
    </Paper>
  );
});

PriceChartLightweight.displayName = 'PriceChartLightweight';

export default PriceChartLightweight;