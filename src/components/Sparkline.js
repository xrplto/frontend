import axios from 'axios';
import { useEffect, useState, memo, useRef } from 'react';
import { useTheme, alpha } from '@mui/material/styles';
import { Box, Skeleton } from '@mui/material';
import { useInView } from 'react-intersection-observer';

// Simple in-memory cache with TTL
const chartDataCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCachedData = (url) => {
  const cached = chartDataCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
};

const setCachedData = (url, data) => {
  chartDataCache.set(url, {
    data,
    timestamp: Date.now()
  });
};

const Sparkline = ({
  url,
  showGradient = true,
  lineWidth = 2,
  interpolationFactor = 2,
  ...props
}) => {
  const theme = useTheme();
  const [chartData, setChartData] = useState(null);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const previousUrlRef = useRef(url);
  const canvasRef = useRef(null);

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  // Linear interpolation between two points
  const interpolatePoints = (points, factor) => {
    if (factor <= 1 || points.length < 2) return points;

    const interpolated = [];

    for (let i = 0; i < points.length - 1; i++) {
      interpolated.push(points[i]);

      // Add interpolated points between current and next
      for (let j = 1; j < factor; j++) {
        const t = j / factor;
        const interpolatedPoint = {
          x: points[i].x + (points[i + 1].x - points[i].x) * t,
          y: points[i].y + (points[i + 1].y - points[i].y) * t
        };
        interpolated.push(interpolatedPoint);
      }
    }

    // Add the last point
    interpolated.push(points[points.length - 1]);
    return interpolated;
  };

  // Draw chart on canvas
  useEffect(() => {
    if (!chartData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { data: apiData, chartColor } = chartData;

    if (!apiData?.prices?.length || !apiData?.timestamps?.length) return;

    const prices = apiData.prices.map((p) => parseFloat(p));
    const isPositive = prices[prices.length - 1] >= prices[0];
    const color = chartColor || (isPositive ? '#00ff88' : '#ff3366');

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = rect.width;
    const height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (prices.length < 2) return;

    // Calculate min/max for scaling
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice;

    // Scale points to canvas with padding
    const padding = height * 0.1; // 10% padding top and bottom
    const chartHeight = height - padding * 2;

    const points = prices.map((price, index) => {
      const x = (index / (prices.length - 1)) * width;
      const y =
        range === 0
          ? height / 2
          : padding + chartHeight - ((price - minPrice) / range) * chartHeight;
      return { x, y };
    });

    // Interpolate points for smoother sparklines
    const interpolatedPoints = interpolatePoints(points, interpolationFactor);

    // Draw gradient fill if enabled
    if (showGradient) {
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, color + '66');
      gradient.addColorStop(1, color + '00');

      ctx.beginPath();
      ctx.moveTo(interpolatedPoints[0].x, height - padding);
      interpolatedPoints.forEach((point) => ctx.lineTo(point.x, point.y));
      ctx.lineTo(interpolatedPoints[interpolatedPoints.length - 1].x, height - padding);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Draw line with interpolated points
    ctx.beginPath();
    ctx.moveTo(interpolatedPoints[0].x, interpolatedPoints[0].y);
    interpolatedPoints.forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }, [chartData, showGradient, lineWidth, interpolationFactor, theme]);

  // Fetch data when URL changes or component comes into view
  useEffect(() => {
    if (previousUrlRef.current === url && chartData) {
      return;
    }
    previousUrlRef.current = url;

    const controller = new AbortController();

    const fetchChartData = async () => {
      if (!url || !inView) {
        setIsLoading(false);
        return;
      }

      const cachedData = getCachedData(url);
      if (cachedData) {
        setChartData(cachedData);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setIsError(false);
      try {
        const response = await axios.get(url, {
          signal: controller.signal,
          headers: {
            'Cache-Control': 'max-age=300'
          }
        });
        setChartData(response.data);
        setCachedData(url, response.data);
      } catch (err) {
        if (!axios.isCancel(err)) {
          console.error('Error fetching chart data:', err);
          setIsError(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchChartData();

    return () => {
      controller.abort();
    };
  }, [url, inView, chartData]);

  // Loading state with skeleton
  if (isLoading) {
    return (
      <Box
        ref={ref}
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '40px'
        }}
      >
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          animation="wave"
          sx={{
            borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            '&::after': {
              background: `linear-gradient(90deg, transparent, ${alpha('#00ff88', 0.2)}, transparent)`
            }
          }}
        />
      </Box>
    );
  }

  // Error state
  if (isError) {
    return (
      <Box
        ref={ref}
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '40px',
          opacity: 0.3
        }}
      >
        <Box
          sx={{
            width: '100%',
            height: '2px',
            background: `linear-gradient(90deg, transparent, ${alpha(
              theme.palette.divider,
              0.5
            )}, transparent)`,
            borderRadius: 1
          }}
        />
      </Box>
    );
  }

  // No data state
  if (!chartData) {
    return (
      <Box
        ref={ref}
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '40px'
        }}
      >
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          animation={false}
          sx={{
            borderRadius: 1,
            bgcolor: 'transparent'
          }}
        />
      </Box>
    );
  }

  return (
    <Box
      ref={ref}
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />
    </Box>
  );
};

export default memo(Sparkline);
