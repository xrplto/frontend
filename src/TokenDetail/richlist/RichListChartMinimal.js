import { useState, useEffect, useRef, memo } from 'react';
import { Box, ButtonGroup, Button, Typography, useTheme, Paper } from '@mui/material';
import axios from 'axios';

// Minimal RichList Chart using Canvas for performance
const RichListChartMinimal = memo(({ token }) => {
  const theme = useTheme();
  const canvasRef = useRef(null);
  const [range, setRange] = useState('7D');
  const [chartType, setChartType] = useState('addresses'); // 'addresses' or 'holders'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const BASE_URL = process.env.API_URL;
  const isDark = theme.palette.mode === 'dark';

  // Fetch data
  useEffect(() => {
    if (!token?.md5) return;
    
    const controller = new AbortController();
    
    const fetchData = async () => {
      try {
        setLoading(true);
        // Use different endpoint based on chart type
        const endpoint = chartType === 'holders' 
          ? `${BASE_URL}/graphholder/${token.md5}?range=${range}`
          : `${BASE_URL}/graphrich/${token.md5}?range=${range}`;
          
        const response = await axios.get(endpoint, { signal: controller.signal });
        
        if (response.data?.history) {
          // Convert to simple array format [timestamp, value]
          const chartData = response.data.history.map(item => [
            item.time,
            chartType === 'holders' ? (item.holders || item.length) : item.length
          ]);
          setData(chartData);
        }
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error('RichList chart error:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    return () => controller.abort();
  }, [token.md5, range, chartType, BASE_URL]);

  // Draw chart
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
    const values = data.map(d => d[1]);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1;

    const leftPadding = 65; // More space for labels
    const rightPadding = 20;
    const topPadding = 20;
    const bottomPadding = 30; // Space for date labels
    const chartWidth = rect.width - leftPadding - rightPadding;
    const chartHeight = rect.height - topPadding - bottomPadding;

    // Draw grid lines
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = topPadding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(leftPadding, y);
      ctx.lineTo(rect.width - rightPadding, y);
      ctx.stroke();
    }

    // Draw area chart
    ctx.beginPath();
    ctx.moveTo(leftPadding, topPadding + chartHeight);

    // Create gradient
    const gradient = ctx.createLinearGradient(0, topPadding, 0, topPadding + chartHeight);
    gradient.addColorStop(0, isDark ? 'rgba(33, 150, 243, 0.3)' : 'rgba(25, 118, 210, 0.3)');
    gradient.addColorStop(1, isDark ? 'rgba(33, 150, 243, 0.05)' : 'rgba(25, 118, 210, 0.05)');
    ctx.fillStyle = gradient;

    // Draw the line and fill
    data.forEach((point, index) => {
      const x = leftPadding + (index / (data.length - 1)) * chartWidth;
      const y = topPadding + ((maxValue - point[1]) / valueRange) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    // Complete the area
    ctx.lineTo(leftPadding + chartWidth, topPadding + chartHeight);
    ctx.lineTo(leftPadding, topPadding + chartHeight);
    ctx.closePath();
    ctx.fill();

    // Draw the line on top
    ctx.strokeStyle = theme.palette.primary.main;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    data.forEach((point, index) => {
      const x = leftPadding + (index / (data.length - 1)) * chartWidth;
      const y = topPadding + ((maxValue - point[1]) / valueRange) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();

    // Draw Y-axis labels
    ctx.fillStyle = theme.palette.text.secondary;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i <= 4; i++) {
      const value = maxValue - (valueRange / 4) * i;
      const y = topPadding + (chartHeight / 4) * i;
      ctx.fillText(Math.round(value).toLocaleString(), leftPadding - 10, y);
    }

    // Draw X-axis labels (dates)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    const labelCount = Math.min(5, data.length);
    const step = Math.floor(data.length / labelCount);
    
    for (let i = 0; i < labelCount; i++) {
      const index = i * step;
      if (index < data.length) {
        const x = leftPadding + (index / (data.length - 1)) * chartWidth;
        const date = new Date(data[index][0]);
        const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        ctx.fillText(label, x, topPadding + chartHeight + 5);
      }
    }

  }, [data, isDark, theme]);

  return (
    <Paper elevation={0} sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 500 }}>
            {chartType === 'addresses' ? 'Total Addresses' : 'Holders'}
          </Typography>
          
          {/* Chart type selector */}
          <ButtonGroup size="small">
            <Button
              onClick={() => setChartType('addresses')}
              variant={chartType === 'addresses' ? 'contained' : 'outlined'}
              sx={{ 
                px: 1.5, 
                fontSize: '0.75rem',
                minWidth: 60
              }}
            >
              Addresses
            </Button>
            <Button
              onClick={() => setChartType('holders')}
              variant={chartType === 'holders' ? 'contained' : 'outlined'}
              sx={{ 
                px: 1.5, 
                fontSize: '0.75rem',
                minWidth: 50
              }}
            >
              Holders
            </Button>
          </ButtonGroup>
        </Box>
        
        {/* Range selector */}
        <ButtonGroup size="small">
          {['7D', '1M', '3M', 'ALL'].map(r => (
            <Button
              key={r}
              onClick={() => setRange(r)}
              variant={range === r ? 'contained' : 'outlined'}
              sx={{ 
                px: 1, 
                fontSize: '0.75rem',
                minWidth: r === 'ALL' ? 40 : 32
              }}
            >
              {r}
            </Button>
          ))}
        </ButtonGroup>
      </Box>

      {/* Chart */}
      <Box sx={{ position: 'relative', height: 300 }}>
        {loading ? (
          <Box sx={{ 
            position: 'absolute', 
            inset: 0, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Typography color="text.secondary">Loading...</Typography>
          </Box>
        ) : !data || data.length === 0 ? (
          <Box sx={{ 
            position: 'absolute', 
            inset: 0, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 1
          }}>
            <Typography color="text.secondary">No data available</Typography>
            <Typography variant="caption" color="text.secondary">
              Try selecting a different time range
            </Typography>
          </Box>
        ) : (
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%' }}
          />
        )}
      </Box>
    </Paper>
  );
});

RichListChartMinimal.displayName = 'RichListChartMinimal';

export default RichListChartMinimal;