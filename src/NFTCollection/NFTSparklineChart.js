import { useState, useEffect, memo, useRef } from 'react';
import api from 'src/utils/api';

const BASE_URL = 'https://api.xrpl.to';

const NFTSparklineChart = memo(
  ({ slug, period = '7d' }) => {
    const [linePath, setLinePath] = useState('');
    const [areaPath, setAreaPath] = useState('');
    const [color, setColor] = useState('#22c55e');
    const containerRef = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
      if (!containerRef.current) return;
      const obs = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            setVisible(true);
            obs.disconnect();
          }
        },
        { rootMargin: '50px' }
      );
      obs.observe(containerRef.current);
      return () => obs.disconnect();
    }, []);

    useEffect(() => {
      if (!visible || !slug) return;
      let cancelled = false;
      const url = `${BASE_URL}/api/nft/collections/${encodeURIComponent(slug)}/sparkline?period=${period}&lightweight=true&maxPoints=20`;
      api
        .get(url)
        .then((res) => {
          if (cancelled) return;
          const prices = res.data?.data?.prices?.map(Number) || [];
          const chartColor = res.data?.chartColor || '#22c55e';
          if (prices.length < 2) return;
          const w = 120,
            h = 32;
          const min = Math.min(...prices),
            max = Math.max(...prices),
            range = max - min || 1;
          const pts = prices.map((p, i) => [
            (i / (prices.length - 1)) * w,
            h - ((p - min) / range) * (h - 4) - 2
          ]);
          const line = 'M' + pts.map((p) => p.join(',')).join('L');
          const area = line + `L${w},${h}L0,${h}Z`;
          setLinePath(line);
          setAreaPath(area);
          setColor(chartColor);
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }, [visible, slug, period]);

    const hexToRgba = (hex, alpha) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
    const fillColor = hexToRgba(color, 0.15);

    return (
      <div ref={containerRef} className="tr-spark w-[120px] h-8" style={{ '--spark-color': color || 'transparent' }}>
        {linePath ? (
          <svg
            width="120"
            height="32"
            viewBox="0 0 120 32"
            preserveAspectRatio="none"
            className="block"
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
        ) : (
          <div className="w-[120px] h-8 bg-[rgba(128,128,128,0.04)] rounded" />
        )}
      </div>
    );
  },
  (prev, next) => prev.slug === next.slug && prev.period === next.period
);

NFTSparklineChart.displayName = 'NFTSparklineChart';

export default NFTSparklineChart;
