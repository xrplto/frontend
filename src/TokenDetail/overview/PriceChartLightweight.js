import { useState, useEffect, useRef, memo, useContext } from 'react';
import { Box, ButtonGroup, Button, Typography, useTheme, Paper } from '@mui/material';
import axios from 'axios';
import { AppContext } from 'src/AppContext';
import { currencySymbols } from 'src/utils/constants';

// Helper function to convert scientific notation to regular number
const convertScientificToRegular = (value) => {
  if (typeof value === 'string') {
    value = parseFloat(value);
  }
  // Convert scientific notation to regular number
  return Number(value);
};

// Lightweight chart using Canvas API for ultimate performance
const PriceChartLightweight = memo(({ token }) => {
  const theme = useTheme();
  const { activeFiatCurrency } = useContext(AppContext);
  const canvasRef = useRef(null);
  const [chartType, setChartType] = useState(1); // 0: line, 1: candles, 2: holders
  const [range, setRange] = useState('1D');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasInitialData, setHasInitialData] = useState(false);
  const [mousePos, setMousePos] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const pollingIntervalRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState(null);
  
  const BASE_URL = process.env.API_URL;
  const isDark = theme.palette.mode === 'dark';

  // Fetch data
  useEffect(() => {
    if (!token?.md5) return;
    
    const controller = new AbortController();
    
    const fetchData = async () => {
      try {
        setLoading(true);
        // OHLC v2 doesn't support ALL, use appropriate mappings
        const apiRange = range === 'ALL' ? '1Y' : range;
        let endpoint;
        
        if (chartType === 2) {
          // Holders chart - use graphrich endpoint
          endpoint = `${BASE_URL}/graphrich/${token.md5}?range=${apiRange}`;
        } else if (chartType === 1) {
          // Candlestick chart - use OHLC v2 endpoint with active currency
          endpoint = `${BASE_URL}/graph-ohlc-v2/${token.md5}?range=${apiRange}&vs_currency=${activeFiatCurrency}`;
        } else {
          // Line chart - also use OHLC v2 endpoint but extract close prices with active currency
          endpoint = `${BASE_URL}/graph-ohlc-v2/${token.md5}?range=${apiRange}&vs_currency=${activeFiatCurrency}`;
        }
        
        const response = await axios.get(endpoint, { signal: controller.signal });
        
        if (chartType === 2 && response.data?.history && response.data.history.length > 0) {
          // Convert holders data to [time, value] format
          const holdersData = response.data.history.map(item => [
            item.time,
            item.length // graphrich returns 'length' for number of addresses
          ]);
          setData(holdersData);
          setHasInitialData(true);
          setLoading(false);
        } else if (response.data?.ohlc && response.data.ohlc.length > 0) {
          if (chartType === 1) {
            // Candlestick chart - use full OHLC data
            const normalizedOhlc = response.data.ohlc.map(candle => [
              candle[0], // timestamp
              convertScientificToRegular(candle[1]), // open
              convertScientificToRegular(candle[2]), // high
              convertScientificToRegular(candle[3]), // low
              convertScientificToRegular(candle[4]), // close
              convertScientificToRegular(candle[5]) || 0 // volume
            ]);
            setData(normalizedOhlc);
          } else {
            // Line chart - extract close prices from OHLC data
            const lineData = response.data.ohlc.map(candle => [
              candle[0], // timestamp
              convertScientificToRegular(candle[4]), // close price
              convertScientificToRegular(candle[5]) || 0 // volume
            ]);
            setData(lineData);
          }
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
  }, [token.md5, range, chartType, BASE_URL, activeFiatCurrency]);

  // Polling for live updates
  useEffect(() => {
    if (!token?.md5 || !hasInitialData) return;
    
    // Poll every 3 seconds
    const pollData = async () => {
      try {
        // OHLC v2 doesn't support ALL, use appropriate mappings
        const apiRange = range === 'ALL' ? '1Y' : range;
        let endpoint;
        
        if (chartType === 2) {
          endpoint = `${BASE_URL}/graphrich/${token.md5}?range=${apiRange}`;
        } else {
          // Both line and candlestick charts use OHLC v2 endpoint with active currency
          endpoint = `${BASE_URL}/graph-ohlc-v2/${token.md5}?range=${apiRange}&vs_currency=${activeFiatCurrency}`;
        }
        
        const response = await axios.get(endpoint);
        
        if (chartType === 2 && response.data?.history && response.data.history.length > 0) {
          const holdersData = response.data.history.map(item => [
            item.time,
            item.length
          ]);
          setData(holdersData);
        } else if (response.data?.ohlc && response.data.ohlc.length > 0) {
          if (chartType === 1) {
            // Candlestick chart - use full OHLC data
            const normalizedOhlc = response.data.ohlc.map(candle => [
              candle[0],
              convertScientificToRegular(candle[1]),
              convertScientificToRegular(candle[2]),
              convertScientificToRegular(candle[3]),
              convertScientificToRegular(candle[4]),
              convertScientificToRegular(candle[5]) || 0
            ]);
            setData(normalizedOhlc);
          } else {
            // Line chart - extract close prices from OHLC data
            const lineData = response.data.ohlc.map(candle => [
              candle[0],
              convertScientificToRegular(candle[4]), // close price
              convertScientificToRegular(candle[5]) || 0 // volume
            ]);
            setData(lineData);
          }
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
  }, [token.md5, range, chartType, hasInitialData, BASE_URL, activeFiatCurrency]);

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
    const isMobile = rect.width < 600;
    
    // Dynamic left padding based on price label width
    ctx.font = isMobile ? '7px Inter, sans-serif' : '8px Inter, sans-serif';
    let maxLabelWidth = 0;
    for (let i = 0; i <= 4; i++) {
      const value = maxPrice - (priceRange / 4) * i;
      let label;
      if (chartType === 2) {
        label = Math.round(value).toLocaleString();
      } else {
        const symbol = currencySymbols[activeFiatCurrency] || '';
        if (value < 0.000000001) {
          label = symbol + value.toFixed(12).replace(/\.?0+$/, '');
        } else if (value < 0.00001) {
          label = symbol + value.toFixed(10).replace(/\.?0+$/, '');
        } else if (value < 0.01) {
          label = symbol + value.toFixed(8);
        } else if (value < 1) {
          label = symbol + value.toFixed(6);
        } else {
          label = symbol + value.toFixed(4);
        }
      }
      const metrics = ctx.measureText(label);
      maxLabelWidth = Math.max(maxLabelWidth, metrics.width);
    }
    
    const leftPadding = Math.min(120, maxLabelWidth + (isMobile ? 20 : 30));
    const rightPadding = isMobile ? 10 : 20;
    const topPadding = 20;
    const bottomPadding = 20;
    const chartWidth = rect.width - leftPadding - rightPadding;
    const totalHeight = rect.height - topPadding - bottomPadding;
    
    // Apply pan offset to chart positioning
    const panX = panOffset.x;
    const panY = panOffset.y;
    
    // Split height: 70% for price chart, 30% for volume
    const showVolume = chartType !== 2; // Don't show volume for holders chart
    const priceChartHeight = showVolume ? totalHeight * 0.7 : totalHeight;
    const volumeChartHeight = showVolume ? totalHeight * 0.25 : 0;
    const volumeChartGap = showVolume ? totalHeight * 0.05 : 0;

    // Draw grid with pan offset
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 4; i++) {
      const y = topPadding + (priceChartHeight / 4) * i + panY;
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
          const x = leftPadding + (index / (data.length - 1)) * chartWidth + panX;
          const y = topPadding + ((maxPrice - item[1]) / priceRange) * priceChartHeight + panY;
          
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
        const x = leftPadding + (index / (data.length - 1)) * chartWidth + panX;
        const y = topPadding + ((maxPrice - item[1]) / priceRange) * priceChartHeight + panY;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
    } else {
      // Candlestick chart with improved rendering
      const minCandles = 10; // Minimum number of candle slots to show
      const effectiveLength = Math.max(data.length, minCandles);
      const maxCandleWidth = 20; // Maximum candle width
      const candleWidth = Math.min(maxCandleWidth, Math.max(1, chartWidth / effectiveLength - 1));
      const candleSpacing = Math.min(2, candleWidth * 0.2);
      const actualCandleWidth = candleWidth - candleSpacing;
      
      // Center the candles if there are very few
      const totalCandlesWidth = data.length * (candleWidth + candleSpacing);
      const offsetX = data.length < minCandles ? (chartWidth - totalCandlesWidth) / 2 : 0;
      
      data.forEach((item, index) => {
        const x = leftPadding + offsetX + (index * (candleWidth + candleSpacing)) + candleWidth / 2 + panX;
        const [time, open, high, low, close, volume] = item;
        
        // Ensure all OHLC values are finite numbers
        if (!isFinite(open) || !isFinite(high) || !isFinite(low) || !isFinite(close)) {
          return; // Skip this candle if any value is invalid
        }
        
        const yHigh = topPadding + ((maxPrice - high) / priceRange) * priceChartHeight + panY;
        const yLow = topPadding + ((maxPrice - low) / priceRange) * priceChartHeight + panY;
        const yOpen = topPadding + ((maxPrice - open) / priceRange) * priceChartHeight + panY;
        const yClose = topPadding + ((maxPrice - close) / priceRange) * priceChartHeight + panY;
        
        // Additional check for calculated y values
        if (!isFinite(yOpen) || !isFinite(yClose) || !isFinite(yHigh) || !isFinite(yLow)) {
          return; // Skip this candle if calculated positions are invalid
        }
        
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
    ctx.font = isMobile ? '7px Inter, sans-serif' : '8px Inter, sans-serif';
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
        // Format price with appropriate decimal places and currency symbol
        const symbol = currencySymbols[activeFiatCurrency] || '';
        if (value < 0.000000001) {
          label = symbol + value.toFixed(12).replace(/\.?0+$/, '');
        } else if (value < 0.00001) {
          label = symbol + value.toFixed(10).replace(/\.?0+$/, '');
        } else if (value < 0.01) {
          label = symbol + value.toFixed(8);
        } else if (value < 1) {
          label = symbol + value.toFixed(6);
        } else {
          label = symbol + value.toFixed(4);
        }
      }
      
      // Price label text - no background needed since we have axis background
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
      
      // Draw volume bars with same spacing as candles
      let volumeBarWidth, volumeOffsetX;
      
      if (chartType === 1) {
        // Match candlestick spacing for volume bars
        const minCandles = 10;
        const effectiveLength = Math.max(data.length, minCandles);
        const maxBarWidth = 16; // Slightly smaller than candle width
        volumeBarWidth = Math.min(maxBarWidth, Math.max(1, chartWidth / effectiveLength - 1));
        const barSpacing = Math.min(2, volumeBarWidth * 0.2);
        const actualBarWidth = volumeBarWidth - barSpacing;
        
        // Center volume bars if there are very few
        const totalBarsWidth = data.length * (volumeBarWidth + barSpacing);
        volumeOffsetX = data.length < minCandles ? (chartWidth - totalBarsWidth) / 2 : 0;
        
        data.forEach((item, index) => {
          const volume = item[5] || 0;
          const x = leftPadding + volumeOffsetX + (index * (volumeBarWidth + barSpacing)) + panX;
          const barHeight = (volume / maxVolume) * volumeChartHeight;
          const y = volumeY + volumeChartHeight - barHeight;
          
          // Color based on open/close comparison
          const barColor = item[4] >= item[1] ? '#4caf5088' : '#f4433688';
          
          ctx.fillStyle = barColor;
          ctx.fillRect(x, y, actualBarWidth, barHeight);
        });
      } else {
        // Line chart - use thinner bars
        const barWidth = Math.max(1, chartWidth / data.length - 1);
        const maxBarWidth = 8; // Maximum width for line chart volume bars
        const actualBarWidth = Math.min(maxBarWidth, barWidth * 0.6);
        
        data.forEach((item, index) => {
          const volume = item[2] || 0;
          const x = leftPadding + (index / (data.length - 1)) * chartWidth + panX - actualBarWidth / 2;
          const barHeight = (volume / maxVolume) * volumeChartHeight;
          const y = volumeY + volumeChartHeight - barHeight;
          
          // Color based on price movement
          let barColor;
          if (index > 0) {
            barColor = item[1] >= data[index - 1][1] ? '#4caf5088' : '#f4433688';
          } else {
            barColor = '#4caf5088';
          }
          
          ctx.fillStyle = barColor;
          ctx.fillRect(x, y, actualBarWidth, barHeight);
        });
      }
      
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
        const label = range === '1D' 
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
        const symbol = currencySymbols[activeFiatCurrency] || '';
        let priceLabel;
        if (chartType === 2) {
          priceLabel = Math.round(price).toLocaleString();
        } else if (price < 0.000000001) {
          priceLabel = symbol + price.toFixed(12).replace(/\.?0+$/, '');
        } else if (price < 0.00001) {
          priceLabel = symbol + price.toFixed(10).replace(/\.?0+$/, '');
        } else if (price < 0.01) {
          priceLabel = symbol + price.toFixed(8);
        } else {
          priceLabel = symbol + price.toFixed(6);
        }
        
        ctx.fillStyle = theme.palette.background.paper;
        const labelMetrics = ctx.measureText(priceLabel);
        ctx.fillRect(leftPadding - labelMetrics.width - 10, y - 8, labelMetrics.width + 8, 16);
        ctx.fillStyle = theme.palette.text.primary;
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(priceLabel, leftPadding - 12, y);
        
        // Time label with debug info
        const dataIndex = Math.round(((x - leftPadding) / chartWidth) * (data.length - 1));
        if (dataIndex >= 0 && dataIndex < data.length) {
          const date = new Date(data[dataIndex][0]);
          const timeLabel = date.toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            hour: 'numeric', 
            minute: '2-digit' 
          });
          
          // Add detailed timestamp for debugging
          const debugTimestamp = date.toISOString();
          const unixTimestamp = data[dataIndex][0];
          
          const labelWidth = ctx.measureText(timeLabel).width;
          ctx.fillStyle = theme.palette.background.paper;
          ctx.fillRect(x - labelWidth/2 - 5, timeY - 2, labelWidth + 10, 16);
          ctx.fillStyle = theme.palette.text.primary;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(timeLabel, x, timeY);
          
          // Draw debug timestamp info above the crosshair
          const debugInfo = `${debugTimestamp} (Unix: ${unixTimestamp})`;
          const debugWidth = ctx.measureText(debugInfo).width;
          ctx.fillStyle = isDark ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.95)';
          ctx.fillRect(x - debugWidth/2 - 8, topPadding - 20, debugWidth + 16, 18);
          ctx.fillStyle = theme.palette.primary.main;
          ctx.font = '10px monospace';
          ctx.fillText(debugInfo, x, topPadding - 10);
        }
      }
    }

  }, [data, chartType, isDark, theme, mousePos, panOffset, activeFiatCurrency]);

  return (
    <Paper elevation={0} sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" sx={{ fontSize: '1rem' }}>
            {token.name} {chartType === 2 ? 'Holders' : `Price (${activeFiatCurrency})`}
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
          <>
            {data && data.length < 5 && chartType === 1 && (
              <Box sx={{ 
                position: 'absolute', 
                top: 8,
                right: 8,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                borderRadius: 1,
                px: 1.5,
                py: 0.5,
                zIndex: 10
              }}>
                <Typography variant="caption" color="text.secondary">
                  Limited data: {data.length} candle{data.length !== 1 ? 's' : ''} available
                </Typography>
              </Box>
            )}
            <canvas
              ref={canvasRef}
              style={{ width: '100%', height: '100%', cursor: isDragging ? 'grabbing' : 'grab' }}
              onMouseDown={(e) => {
              const rect = canvasRef.current.getBoundingClientRect();
              setIsDragging(true);
              setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
              setMousePos(null);
            }}
            onMouseMove={(e) => {
              const rect = canvasRef.current.getBoundingClientRect();
              const currentPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
              
              if (isDragging && dragStart) {
                const deltaX = currentPos.x - dragStart.x;
                const deltaY = currentPos.y - dragStart.y;
                setPanOffset({ x: deltaX, y: deltaY });
              } else {
                setMousePos(currentPos);
              }
            }}
            onMouseUp={() => {
              setIsDragging(false);
              setDragStart(null);
            }}
            onMouseLeave={() => {
              setMousePos(null);
              setIsDragging(false);
              setDragStart(null);
            }}
          />
          </>
        )}
      </Box>
    </Paper>
  );
});

PriceChartLightweight.displayName = 'PriceChartLightweight';

export default PriceChartLightweight;