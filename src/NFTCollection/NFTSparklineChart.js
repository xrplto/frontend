import { useState, useEffect, memo, useRef } from 'react';
import axios from 'axios';

const BASE_URL = 'https://api.xrpl.to';

/**
 * NFT Collection Floor Price Sparkline Chart
 * Fetches and displays floor price trend from /api/nft/collections/:slug/sparkline
 *
 * @param {string} slug - Collection slug identifier
 * @param {string} period - Time period: '7d', '30d', or '1y' (default: '7d')
 * @param {number} width - Chart width in pixels (default: 120)
 * @param {number} height - Chart height in pixels (default: 32)
 */
const NFTSparklineChart = memo(
  ({ slug, period = '7d', width = 120, height = 32 }) => {
    const [linePath, setLinePath] = useState('');
    const [areaPath, setAreaPath] = useState('');
    const [color, setColor] = useState('#22c55e');
    const [percentChange, setPercentChange] = useState(null);
    const containerRef = useRef(null);
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Lazy load with IntersectionObserver
    useEffect(() => {
      if (!containerRef.current) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        },
        { rootMargin: '50px', threshold: 0.01 }
      );

      observer.observe(containerRef.current);

      return () => observer.disconnect();
    }, []);

    // Fetch sparkline data when visible
    useEffect(() => {
      if (!visible || !slug) return;

      let cancelled = false;
      setLoading(true);
      setError(false);

      const url = `${BASE_URL}/api/nft/collections/${encodeURIComponent(slug)}/sparkline?period=${period}&lightweight=true&maxPoints=20`;

      axios
        .get(url)
        .then((res) => {
          if (cancelled) return;

          const prices = res.data?.data?.prices?.map(Number) || [];
          const chartColor = res.data?.chartColor || '#22c55e';
          const change = res.data?.percentChange;

          if (prices.length < 2) {
            setLoading(false);
            return;
          }

          // Calculate SVG paths
          const min = Math.min(...prices);
          const max = Math.max(...prices);
          const range = max - min || 1;

          const points = prices.map((price, i) => {
            const x = (i / (prices.length - 1)) * width;
            const y = height - ((price - min) / range) * (height - 4) - 2;
            return [x, y];
          });

          const line = 'M' + points.map((p) => p.join(',')).join('L');
          const area = line + `L${width},${height}L0,${height}Z`;

          setLinePath(line);
          setAreaPath(area);
          setColor(chartColor);
          setPercentChange(change);
          setLoading(false);
        })
        .catch(() => {
          if (!cancelled) {
            setError(true);
            setLoading(false);
          }
        });

      return () => {
        cancelled = true;
      };
    }, [visible, slug, period, width, height]);

    // Fill color with transparency based on chart color
    const fillColor =
      color === '#22c55e' || color === '#00AB55'
        ? 'rgba(34, 197, 94, 0.15)'
        : 'rgba(239, 68, 68, 0.15)';

    // Placeholder while loading or not visible
    if (!visible || loading) {
      return (
        <div
          ref={containerRef}
          style={{
            width,
            height,
            background: 'rgba(128, 128, 128, 0.04)',
            borderRadius: 4
          }}
        />
      );
    }

    // Error or no data state
    if (error || !linePath) {
      return (
        <div
          ref={containerRef}
          style={{
            width,
            height,
            background: 'rgba(128, 128, 128, 0.04)',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <span style={{ fontSize: 10, color: 'rgba(128, 128, 128, 0.5)' }}>—</span>
        </div>
      );
    }

    return (
      <div ref={containerRef} style={{ width, height, position: 'relative' }}>
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          style={{ display: 'block' }}
        >
          <path d={areaPath} fill={fillColor} />
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.slug === nextProps.slug &&
      prevProps.period === nextProps.period &&
      prevProps.width === nextProps.width &&
      prevProps.height === nextProps.height
    );
  }
);

NFTSparklineChart.displayName = 'NFTSparklineChart';

export default NFTSparklineChart;
