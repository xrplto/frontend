import axios from 'axios';
import { useEffect, useState, memo, useRef, useContext } from 'react';
import { useInView } from 'react-intersection-observer';
import { cn } from 'src/utils/cn';
import { AppContext } from 'src/AppContext';

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
  lineWidth = 1.5,
  smooth = true,
  ...props
}) => {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [chartData, setChartData] = useState(null);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const previousUrlRef = useRef(url);
  const canvasRef = useRef(null);

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  // Draw smooth bezier curve through points (continues existing path)
  const drawCurve = (ctx, points, startNew = true) => {
    if (points.length < 2) return;

    if (startNew) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
    }

    if (!smooth || points.length < 3) {
      points.forEach((p) => ctx.lineTo(p.x, p.y));
      return;
    }

    // Use quadratic bezier curves for smoothing
    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
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
    const color = chartColor || (isPositive ? '#22c55e' : '#ef4444');

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
    const padding = height * 0.15;
    const chartHeight = height - padding * 2;

    const points = prices.map((price, index) => {
      const x = (index / (prices.length - 1)) * width;
      const y =
        range === 0
          ? height / 2
          : padding + chartHeight - ((price - minPrice) / range) * chartHeight;
      return { x, y };
    });

    // Draw gradient fill if enabled - subtle glow effect
    if (showGradient) {
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, color + '20');
      gradient.addColorStop(0.5, color + '10');
      gradient.addColorStop(1, color + '00');

      ctx.beginPath();
      ctx.moveTo(points[0].x, height);
      ctx.lineTo(points[0].x, points[0].y);
      drawCurve(ctx, points, false);
      ctx.lineTo(points[points.length - 1].x, height);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Draw smooth line
    drawCurve(ctx, points);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Trigger fade-in
    setIsVisible(true);
  }, [chartData, showGradient, lineWidth, smooth, isDark]);

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

  // Loading skeleton - subtle shimmer
  if (isLoading) {
    return (
      <div ref={ref} className="w-full h-full min-h-[40px] flex items-center justify-center">
        <div
          className={cn(
            "w-full h-[2px] rounded-full",
            isDark ? "bg-white/5" : "bg-gray-100"
          )}
          style={{
            background: isDark
              ? 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 100%)'
              : 'linear-gradient(90deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.06) 50%, rgba(0,0,0,0.02) 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite'
          }}
        />
      </div>
    );
  }

  // Error/no data state - minimal dash
  if (isError || !chartData) {
    return (
      <div ref={ref} className="w-full h-full min-h-[40px] flex items-center justify-center">
        <span className={cn(
          "text-[11px]",
          isDark ? "text-white/20" : "text-gray-300"
        )}>—</span>
      </div>
    );
  }

  return (
    <div ref={ref} className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        className={cn(
          "transition-opacity duration-300",
          isVisible ? "opacity-100" : "opacity-0"
        )}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
};

export default memo(Sparkline);
