import { useState, useEffect, useRef, memo, useCallback, createContext, useContext } from 'react';
import { 
  Box, 
  Paper, 
  IconButton, 
  Typography, 
  useTheme,
  Collapse,
  ButtonGroup,
  Button,
  Menu,
  MenuItem,
  Chip,
  alpha,
  Tooltip
} from '@mui/material';
import { createChart, CandlestickSeries, AreaSeries, HistogramSeries } from 'lightweight-charts';
import axios from 'axios';
import { currencySymbols } from 'src/utils/constants';
import { useRouter } from 'next/router';

// Icons
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';

// Create a context for pinned charts state management
const PinnedChartContext = createContext();

// Local storage helpers
const loadState = () => {
  if (typeof window === 'undefined') return undefined;
  try {
    const serializedState = localStorage.getItem('pinnedChartsTracker');
    if (serializedState === null) return undefined;
    return JSON.parse(serializedState);
  } catch (err) {
    return undefined;
  }
};

const saveState = (state) => {
  if (typeof window === 'undefined') return;
  try {
    const serializedState = JSON.stringify({
      pinnedCharts: state.pinnedCharts,
      miniChartPosition: state.miniChartPosition,
    });
    localStorage.setItem('pinnedChartsTracker', serializedState);
  } catch (err) {
    console.error('Failed to save pinned charts state:', err);
  }
};

// Provider component for pinned charts state
export const PinnedChartProvider = ({ children }) => {
  const persistedState = loadState();
  
  const [pinnedCharts, setPinnedCharts] = useState(persistedState?.pinnedCharts || []);
  const [activePinnedChart, setActivePinnedChart] = useState(persistedState?.pinnedCharts?.[0] || null);
  const [miniChartPosition, setMiniChartPosition] = useState(
    persistedState?.miniChartPosition || { x: 20, y: 80 }
  );
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Save to localStorage whenever state changes
  useEffect(() => {
    saveState({ pinnedCharts, miniChartPosition });
  }, [pinnedCharts, miniChartPosition]);

  // Rehydrate on mount
  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setPinnedCharts(saved.pinnedCharts || []);
      setActivePinnedChart(saved.pinnedCharts?.[0] || null);
      setMiniChartPosition(saved.miniChartPosition || { x: 20, y: 80 });
    }
  }, []);

  const pinChart = useCallback((chartConfig) => {
    const { token, chartType, range, indicators, activeFiatCurrency } = chartConfig;
    
    setPinnedCharts(prev => {
      const existingIndex = prev.findIndex(
        chart => chart.token.md5 === token.md5 && chart.chartType === chartType
      );
      
      let newCharts;
      let newChart;
      
      if (existingIndex === -1) {
        newChart = {
          id: `${token.md5}-${chartType}-${Date.now()}`,
          token,
          chartType,
          range,
          indicators,
          activeFiatCurrency,
          pinnedAt: Date.now(),
        };
        newCharts = [...prev, newChart];
      } else {
        newChart = {
          ...prev[existingIndex],
          range,
          indicators,
          activeFiatCurrency,
          pinnedAt: Date.now(),
        };
        newCharts = [...prev];
        newCharts[existingIndex] = newChart;
      }
      
      setActivePinnedChart(newChart);
      setIsVisible(true);
      setIsMinimized(false);
      
      return newCharts;
    });
  }, []);

  const unpinChart = useCallback((chartId) => {
    setPinnedCharts(prev => {
      const newCharts = prev.filter(chart => chart.id !== chartId);
      
      if (activePinnedChart?.id === chartId) {
        setActivePinnedChart(newCharts[0] || null);
      }
      
      return newCharts;
    });
  }, [activePinnedChart]);

  const unpinChartByToken = useCallback((tokenMd5, chartType) => {
    setPinnedCharts(prev => {
      const newCharts = prev.filter(
        chart => !(chart.token.md5 === tokenMd5 && chart.chartType === chartType)
      );
      
      if (activePinnedChart?.token.md5 === tokenMd5 && activePinnedChart?.chartType === chartType) {
        setActivePinnedChart(newCharts[0] || null);
      }
      
      return newCharts;
    });
  }, [activePinnedChart]);

  const clearAllPinnedCharts = useCallback(() => {
    setPinnedCharts([]);
    setActivePinnedChart(null);
  }, []);

  const value = {
    pinnedCharts,
    activePinnedChart,
    miniChartPosition,
    isMinimized,
    isVisible,
    setActivePinnedChart,
    setMiniChartPosition,
    setIsMinimized,
    setIsVisible,
    pinChart,
    unpinChart,
    unpinChartByToken,
    clearAllPinnedCharts,
  };

  return (
    <PinnedChartContext.Provider value={value}>
      {children}
    </PinnedChartContext.Provider>
  );
};

// Hook to use pinned chart context
export const usePinnedCharts = () => {
  const context = useContext(PinnedChartContext);
  if (!context) {
    throw new Error('usePinnedCharts must be used within a PinnedChartProvider');
  }
  return context;
};

// Pin button component to add to charts
export const PinChartButton = memo(({ token, chartType, range, indicators, activeFiatCurrency }) => {
  const theme = useTheme();
  const { pinnedCharts, pinChart, unpinChartByToken } = usePinnedCharts();
  
  const isChartPinned = pinnedCharts.some(
    chart => chart.token.md5 === token.md5 && chart.chartType === chartType
  );

  const handlePinChart = () => {
    if (isChartPinned) {
      unpinChartByToken(token.md5, chartType);
    } else {
      pinChart({
        token: {
          md5: token.md5,
          name: token.name,
          symbol: token.symbol || token.code,
          code: token.code,
          slug: token.slug,
          logo: token.logo
        },
        chartType,
        range,
        indicators,
        activeFiatCurrency
      });
    }
  };

  return (
    <Tooltip title={isChartPinned ? "Unpin chart" : "Pin chart to track anywhere"}>
      <IconButton
        size="small"
        onClick={handlePinChart}
        sx={{ 
          ml: 1,
          color: isChartPinned ? theme.palette.primary.main : 'inherit'
        }}
      >
        {isChartPinned ? <PushPinIcon /> : <PushPinOutlinedIcon />}
      </IconButton>
    </Tooltip>
  );
});

PinChartButton.displayName = 'PinChartButton';

// Floating chart component
export const FloatingPinnedChart = memo(() => {
  const theme = useTheme();
  const router = useRouter();
  const {
    pinnedCharts,
    activePinnedChart,
    miniChartPosition,
    isMinimized,
    isVisible,
    setActivePinnedChart,
    setMiniChartPosition,
    setIsMinimized,
    setIsVisible,
    unpinChart,
    clearAllPinnedCharts,
  } = usePinnedCharts();

  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const dragRef = useRef(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const [isDraggingState, setIsDraggingState] = useState(false);
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRange, setSelectedRange] = useState('1D');
  
  const isDark = theme.palette.mode === 'dark';
  const BASE_URL = process.env.API_URL;

  // Fetch data for active chart
  useEffect(() => {
    if (!activePinnedChart || isMinimized) return;
    
    const controller = new AbortController();
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const apiRange = selectedRange === 'ALL' ? '1Y' : selectedRange;
        const endpoint = `${BASE_URL}/graph-ohlc-v2/${activePinnedChart.token.md5}?range=${apiRange}&vs_currency=${activePinnedChart.activeFiatCurrency}`;
        
        const response = await axios.get(endpoint, { signal: controller.signal });
        
        if (response.data?.ohlc && response.data.ohlc.length > 0) {
          const processedData = response.data.ohlc
            .map(candle => ({
              time: Math.floor(candle[0] / 1000),
              open: Number(candle[1]),
              high: Number(candle[2]),
              low: Number(candle[3]),
              close: Number(candle[4]),
              value: Number(candle[4]),
              volume: Number(candle[5]) || 0
            }))
            .sort((a, b) => a.time - b.time)
            .slice(-100); // Limit data points for performance
          
          setData(processedData);
        }
        setLoading(false);
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error('Mini chart data error:', error);
        }
        setLoading(false);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 10000); // Update every 10 seconds
    
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [activePinnedChart, selectedRange, BASE_URL, isMinimized]);

  // Create/update chart
  useEffect(() => {
    if (!chartContainerRef.current || !data || data.length === 0 || isMinimized) {
      return;
    }

    // Clean up existing chart
    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch (e) {
        console.error('Error removing mini chart:', e);
      }
      chartRef.current = null;
      seriesRef.current = null;
      volumeSeriesRef.current = null;
    }

    // Create new chart
    const chart = createChart(chartContainerRef.current, {
      width: 300,
      height: 180,
      layout: {
        background: { type: 'solid', color: 'transparent' },
        textColor: theme.palette.text.primary,
        fontSize: 11,
        fontFamily: "'Segoe UI', Roboto, Arial, sans-serif",
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { 
          color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          visible: true 
        },
      },
      crosshair: {
        mode: 1,
        vertLine: { visible: false },
        horzLine: { visible: false },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: 0.2 },
        visible: true,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: false,
        secondsVisible: false,
        rightOffset: 2,
        barSpacing: 6,
        minBarSpacing: 0.5,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      localization: {
        priceFormatter: (price) => {
          const symbol = currencySymbols[activePinnedChart?.activeFiatCurrency] || '';
          if (price < 0.01) return symbol + price.toFixed(8);
          if (price < 100) return symbol + price.toFixed(4);
          return symbol + price.toFixed(2);
        },
      },
    });

    chartRef.current = chart;

    // Add series based on chart type
    if (activePinnedChart?.chartType === 'candles') {
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderUpColor: '#26a69a',
        borderDownColor: '#ef5350',
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
        borderVisible: false,
        wickVisible: true,
      });
      candleSeries.setData(data);
      seriesRef.current = candleSeries;
    } else if (activePinnedChart?.chartType === 'line' || activePinnedChart?.chartType === 'holders') {
      const areaSeries = chart.addSeries(AreaSeries, {
        lineColor: activePinnedChart?.chartType === 'holders' ? '#9c27b0' : theme.palette.primary.main,
        topColor: activePinnedChart?.chartType === 'holders' ? 'rgba(156, 39, 176, 0.4)' : theme.palette.primary.main + '40',
        bottomColor: activePinnedChart?.chartType === 'holders' ? 'rgba(156, 39, 176, 0.08)' : theme.palette.primary.main + '08',
        lineWidth: 2,
        lineStyle: 0,
        crosshairMarkerVisible: false,
      });
      const lineData = data.map(d => ({ time: d.time, value: d.close || d.value }));
      areaSeries.setData(lineData);
      seriesRef.current = areaSeries;
    }

    // Add volume series
    if (activePinnedChart?.chartType !== 'holders') {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: '#26a69a',
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
        scaleMargins: { top: 0.85, bottom: 0 },
        priceLineVisible: false,
        lastValueVisible: false,
      });
      
      const volumeData = data.map(d => ({
        time: d.time,
        value: d.volume || 0,
        color: d.close >= d.open 
          ? 'rgba(76, 175, 80, 0.2)'
          : 'rgba(244, 67, 54, 0.2)'
      }));
      volumeSeries.setData(volumeData);
      volumeSeriesRef.current = volumeSeries;
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({ width: 300 });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        try {
          chartRef.current.remove();
        } catch (e) {
          // Chart already disposed
        }
        chartRef.current = null;
      }
    };
  }, [data, activePinnedChart, theme, isDark, isMinimized]);

  // Handle dragging with mouse and touch support
  useEffect(() => {
    const handleMove = (e) => {
      if (!isDragging.current) return;
      
      // Get coordinates from mouse or touch event
      const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
      const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
      
      const newX = clientX - dragStart.current.x;
      const newY = clientY - dragStart.current.y;
      
      // Get current chart dimensions
      const chartWidth = 320;
      const chartHeight = isMinimized ? 60 : 450; // Approximate heights
      
      // Constrain to viewport with smart edge detection
      const padding = 10;
      const maxX = window.innerWidth - chartWidth - padding;
      const maxY = window.innerHeight - chartHeight - padding;
      
      // Add magnetic edge snapping
      const snapThreshold = 15;
      let constrainedX = Math.max(padding, Math.min(newX, maxX));
      let constrainedY = Math.max(padding, Math.min(newY, maxY));
      
      // Snap to edges if close enough
      if (constrainedX < snapThreshold) constrainedX = padding;
      if (constrainedX > maxX - snapThreshold) constrainedX = maxX;
      if (constrainedY < snapThreshold) constrainedY = padding;
      if (constrainedY > maxY - snapThreshold) constrainedY = maxY;
      
      setMiniChartPosition({ x: constrainedX, y: constrainedY });
    };

    const handleEnd = () => {
      isDragging.current = false;
      setIsDraggingState(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      // Remove dragging styles
      if (dragRef.current) {
        dragRef.current.style.opacity = '';
      }
    };

    // Add both mouse and touch event listeners
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [setMiniChartPosition, isMinimized]);

  const handleDragStart = (e) => {
    // Prevent default to avoid text selection on mobile
    e.preventDefault();
    
    isDragging.current = true;
    setIsDraggingState(true);
    
    // Get starting coordinates from mouse or touch event
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
    
    dragStart.current = {
      x: clientX - miniChartPosition.x,
      y: clientY - miniChartPosition.y
    };
    
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'move';
    
    // Add visual feedback
    if (dragRef.current) {
      dragRef.current.style.opacity = '0.95';
    }
  };

  const handleClose = () => {
    setIsVisible(!isVisible);
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleClearAll = () => {
    clearAllPinnedCharts();
    setAnchorEl(null);
  };

  const handleOpenFull = () => {
    if (activePinnedChart) {
      // Use slug if available, otherwise fall back to symbol or code
      const slug = activePinnedChart.token.slug || 
                   activePinnedChart.token.symbol || 
                   activePinnedChart.token.code ||
                   activePinnedChart.token.md5;
      router.push(`/token/${slug}`);
    }
    setAnchorEl(null);
  };

  if (!isVisible || pinnedCharts.length === 0 || !activePinnedChart) {
    return null;
  }

  const currentPrice = data && data.length > 0 ? data[data.length - 1].close : null;
  const priceChange = data && data.length > 1 
    ? ((data[data.length - 1].close - data[0].close) / data[0].close * 100).toFixed(2)
    : null;

  return (
    <Paper
      elevation={isDraggingState ? 12 : 6}
      sx={{
        position: 'fixed',
        left: miniChartPosition.x,
        top: miniChartPosition.y,
        width: 320,
        zIndex: 1300,
        bgcolor: isDark ? 'rgba(18, 18, 18, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
        borderRadius: 2,
        overflow: 'hidden',
        transition: isDraggingState ? 'none' : 'all 0.3s ease',
        transform: isDraggingState ? 'scale(1.02)' : 'scale(1)',
        boxShadow: isDraggingState 
          ? '0 10px 40px rgba(0,0,0,0.3)' 
          : undefined,
      }}
    >
      {/* Header */}
      <Box
        ref={dragRef}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1,
          bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
          borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
          cursor: 'move',
          userSelect: 'none',
          touchAction: 'none',
          '&:active': {
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DragIndicatorIcon fontSize="small" sx={{ opacity: 0.5 }} />
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {activePinnedChart.token.name}
          </Typography>
          {currentPrice && priceChange && (
            <Chip
              size="small"
              label={`${Number(priceChange) > 0 ? '+' : ''}${priceChange}%`}
              sx={{
                height: 20,
                fontSize: '0.7rem',
                bgcolor: Number(priceChange) > 0 ? alpha('#4caf50', 0.15) : alpha('#f44336', 0.15),
                color: Number(priceChange) > 0 ? '#4caf50' : '#f44336',
              }}
            />
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size="small" onClick={handleMinimize}>
            {isMinimized ? <ExpandMoreIcon fontSize="small" /> : <ExpandLessIcon fontSize="small" />}
          </IconButton>
          <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={handleClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        {pinnedCharts.length > 1 && (
          <Box>
            <MenuItem disabled sx={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
              Switch Chart
            </MenuItem>
            {pinnedCharts.map(chart => (
              <MenuItem
                key={chart.id}
                onClick={() => {
                  setActivePinnedChart(chart);
                  setAnchorEl(null);
                }}
                selected={chart.id === activePinnedChart.id}
                sx={{ fontSize: '0.875rem' }}
              >
                {chart.token.name} - {chart.chartType}
              </MenuItem>
            ))}
            <MenuItem divider />
          </Box>
        )}
        <MenuItem onClick={handleOpenFull} sx={{ fontSize: '0.875rem' }}>
          <OpenInFullIcon fontSize="small" sx={{ mr: 1 }} />
          Open Full Chart
        </MenuItem>
        <MenuItem onClick={() => {
          unpinChart(activePinnedChart.id);
          setAnchorEl(null);
        }} sx={{ fontSize: '0.875rem' }}>
          <CloseIcon fontSize="small" sx={{ mr: 1 }} />
          Unpin This Chart
        </MenuItem>
        <MenuItem onClick={handleClearAll} sx={{ fontSize: '0.875rem', color: 'error.main' }}>
          <DeleteSweepIcon fontSize="small" sx={{ mr: 1 }} />
          Clear All Pinned
        </MenuItem>
      </Menu>

      {/* Chart Content */}
      <Collapse in={!isMinimized}>
        <Box sx={{ p: 1 }}>
          {/* Range selector */}
          <ButtonGroup size="small" fullWidth sx={{ mb: 1 }}>
            {['1D', '7D', '1M', '3M'].map(range => (
              <Button
                key={range}
                onClick={() => setSelectedRange(range)}
                variant={selectedRange === range ? 'contained' : 'outlined'}
                sx={{ fontSize: '0.7rem', py: 0.25 }}
              >
                {range}
              </Button>
            ))}
          </ButtonGroup>
          
          {/* Chart */}
          <Box sx={{ position: 'relative', height: 180 }}>
            {loading ? (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: '100%'
              }}>
                <Typography variant="caption" color="text.secondary">
                  Loading...
                </Typography>
              </Box>
            ) : (
              <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
            )}
          </Box>

          {/* Current price display */}
          {currentPrice && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 1,
              pt: 1,
              borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`
            }}>
              <Typography variant="caption" color="text.secondary">
                Current Price
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {currencySymbols[activePinnedChart.activeFiatCurrency] || ''}
                {currentPrice < 0.01 ? currentPrice.toFixed(8) : currentPrice.toFixed(4)}
              </Typography>
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
});

FloatingPinnedChart.displayName = 'FloatingPinnedChart';

// Main export - single component that handles everything
const PinnedChartTracker = memo(({ children }) => {
  return (
    <PinnedChartProvider>
      {children}
      <FloatingPinnedChart />
    </PinnedChartProvider>
  );
});

PinnedChartTracker.displayName = 'PinnedChartTracker';

export default PinnedChartTracker;