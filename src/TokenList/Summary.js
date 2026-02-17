import Decimal from 'decimal.js-light';
import { useContext, useState, useEffect, useRef, useMemo, memo } from 'react';
import { createPortal } from 'react-dom';
import { cn } from 'src/utils/cn';

// Translations removed - not using i18n

// Redux
import { useSelector } from 'react-redux';
import { selectMetrics, selectTokenCreation } from 'src/redux/statusSlice';

// Utils
import { fNumber } from 'src/utils/formatters';

// Constants
const currencySymbols = {
  USD: '$',
  EUR: '€',
  JPY: '¥',
  CNH: '¥',
  XRP: ''
};

// Components
import { ThemeContext, WalletContext, AppContext } from 'src/context/AppContext';
// Removed ECharts dependency
import { format } from 'date-fns';
import Link from 'next/link';

// Components
const Container = ({ className, children, isDark, ...p }) => (
  <div
    className={cn(
      'summary-root flex flex-col gap-1.5 rounded-xl relative mb-2 box-border overflow-hidden',
      'max-[600px]:p-1.5 max-[600px]:gap-1.5 max-[600px]:mb-2',
      'border-[1.5px] backdrop-blur-[12px] py-[8px] px-[12px]',
      isDark ? 'border-white/[0.08] bg-[rgba(10,10,10,0.5)]' : 'border-black/[0.06] bg-white/50',
      className
    )}
    {...p}
  >
    {/* ::before pseudo-element replacement */}
    <span
      className="absolute pointer-events-none z-0 -top-[60px] -right-[60px] w-[180px] h-[180px] rounded-full bg-[#137DFE]/20 blur-[40px]"
    />
    {children}
    <style>{`
      .summary-container > * { position: relative; z-index: 1; }
      @media (max-width: 1024px) {
        .summary-root { padding: 5px 8px; gap: 3px; margin-bottom: 5px; }
        .summary-metric { height: 56px; padding: 5px 7px; gap: 2px; overflow: hidden; }
        .summary-title { font-size: 0.55rem; }
        .summary-value { font-size: 0.82rem; }
        .summary-pct { font-size: 0.5rem; padding: 1px 3px; }
        .summary-mcap-row { gap: 8px !important; }
        .summary-mcap-row .summary-value { font-size: 0.78rem !important; }
        .summary-mcap-row .summary-pct { font-size: 0.45rem; }
        .summary-vol-badge { display: none; }
        .summary-gauge { display: none !important; }
        .summary-market-row { gap: 10px !important; }
      }
      @media (max-width: 820px) {
        .summary-metric { height: 62px; padding: 6px 8px; gap: 3px; overflow: hidden; }
        .summary-title { font-size: 0.58rem; }
        .summary-value { font-size: 0.9rem; }
        .summary-pct { font-size: 0.52rem; }
        .summary-vol-badge { display: inline-flex; font-size: 0.5rem; }
        .summary-gauge { display: none !important; }
        .summary-mcap-row { gap: 12px !important; }
        .summary-mcap-row .summary-value { font-size: 0.85rem !important; }
        .summary-market-row { gap: 16px !important; }
      }
      @media (min-width: 601px) and (max-width: 820px) {
        .summary-market-row span.font-semibold { font-size: 0.9rem !important; }
        .summary-market-row div > div > span { font-size: 0.48rem !important; }
      }
    `}</style>
  </div>
);

const Stack = ({ className, children, direction, spacing, alignItems, justifyContent, width, ...p }) => (
  <div
    className={cn('flex', className)}
    style={{
      flexDirection: direction === 'row' ? 'row' : 'column',
      gap: spacing || '8px',
      alignItems: alignItems || 'stretch',
      justifyContent: justifyContent || 'flex-start',
      width: width || 'auto'
    }}
    {...p}
  >
    {children}
  </div>
);
// Note: Stack has all dynamic props, must remain as inline styles

const Grid = ({ className, children, ...p }) => (
  <>
    <style>{`
      .summary-grid {
        display: grid;
        grid-template-columns: 1.1fr 1fr 0.8fr 0.9fr 1fr 1.6fr;
        gap: 8px;
      }
      @media (max-width: 1400px) { .summary-grid { grid-template-columns: 1.1fr 1fr 0.8fr 0.9fr 1fr 1.6fr; gap: 6px; } }
      @media (max-width: 1200px) { .summary-grid { grid-template-columns: repeat(3, 1fr); } }
      @media (max-width: 1024px) { .summary-grid { grid-template-columns: 1fr 1fr 0.7fr 0.8fr 0.9fr 1.4fr; gap: 4px; } }
      @media (max-width: 820px) { .summary-grid { grid-template-columns: repeat(3, 1fr); gap: 4px; } }
      @media (max-width: 700px) { .summary-grid { grid-template-columns: repeat(2, 1fr); gap: 3px; } }
      @media (max-width: 600px) {
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 3px;
          align-items: stretch;
        }
        .summary-metric {
          height: auto !important;
          min-height: 0 !important;
          padding: 6px 6px !important;
          gap: 2px !important;
          justify-content: center !important;
        }
        .summary-title { font-size: 0.5rem !important; margin-bottom: 0 !important; }
        .summary-value { font-size: 0.7rem !important; }
        .summary-pct { font-size: 0.48rem !important; padding: 0 2px !important; }
        .summary-vol-badge { display: none !important; }
        .summary-gauge { display: none !important; }
        .summary-mcap-row { flex-direction: column !important; gap: 0 !important; }
        .summary-mcap-row > div { flex-direction: row !important; align-items: baseline !important; gap: 2px !important; }
        .summary-market-row { gap: 4px !important; flex-direction: row !important; align-items: center !important; }
        .summary-market-row > div { gap: 0 !important; }
        .summary-market-row span.font-semibold { font-size: 0.7rem !important; line-height: 1 !important; }
        .summary-market-row div > div > span { font-size: 0.42rem !important; line-height: 1 !important; }
      }
    `}</style>
    <div className={cn('summary-grid relative z-[1]', className)} {...p}>
      {children}
    </div>
  </>
);

const MetricBox = ({ className, children, isDark, ...p }) => (
  <div
    className={cn(
      'summary-metric flex flex-col justify-center rounded-xl transition-[background-color,border-color,opacity,transform] duration-200',
      'max-[600px]:rounded-[10px]',
      'py-[6px] px-[10px] h-[68px] gap-[4px] backdrop-blur-[4px] border-[1.5px]',
      'max-[600px]:h-auto max-[600px]:py-[6px] max-[600px]:px-[6px] max-[600px]:gap-[2px]',
      isDark ? 'bg-white/[0.02] border-white/[0.08]' : 'bg-black/[0.01] border-black/[0.06]',
      className
    )}
    style={{
      ...p.style
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = isDark ? 'rgba(19, 125, 254, 0.25)' : 'rgba(19, 125, 254, 0.15)';
      e.currentTarget.style.background = isDark ? 'rgba(19, 125, 254, 0.05)' : 'rgba(19, 125, 254, 0.03)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
      e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)';
    }}
    {...(({ style, ...rest }) => rest)(p)}
  >
    {children}
  </div>
);

const MetricTitle = ({ className, children, isDark, ...p }) => (
  <span
    className={cn(
      'summary-title text-[0.68rem] max-[600px]:text-[0.52rem] font-normal tracking-[0.02em]',
      isDark ? 'text-white/50' : 'text-[rgba(33,43,54,0.5)]',
      className
    )}
    {...p}
  >
    {children}
  </span>
);

const MetricValue = ({ className, children, isDark, ...p }) => (
  <span
    className={cn(
      'summary-value text-lg max-[600px]:text-[0.78rem] font-semibold whitespace-nowrap leading-[1] tracking-[-0.02em]',
      isDark ? 'text-white' : 'text-[#212B36]',
      className
    )}
    style={{
      ...p.style
    }}
    {...(({ style, ...rest }) => rest)(p)}
  >
    {children}
  </span>
);

const PercentageChange = ({ className, children, isPositive, ...p }) => (
  <span
    className={cn(
      'summary-pct text-[0.68rem] max-[600px]:text-[0.5rem] inline-flex items-center gap-0.5 font-medium rounded',
      'tracking-[-0.01em] py-px px-1',
      isPositive ? 'text-[#10b981] bg-[rgba(16,185,129,0.1)]' : 'text-[#ef4444] bg-[rgba(239,68,68,0.1)]',
      className
    )}
    style={{
      ...p.style
    }}
    {...(({ style, ...rest }) => rest)(p)}
  >
    {children}
  </span>
);

const VolumePercentage = ({ className, children, isDark, ...p }) => (
  <span
    className={cn(
      'text-[0.58rem] max-[600px]:text-[0.5rem] font-normal',
      isDark ? 'text-white/[0.45]' : 'text-[rgba(33,43,54,0.45)]',
      className
    )}
    {...p}
  >
    {children}
  </span>
);

const ContentTypography = ({ className, children, isDark, ...p }) => (
  <span
    className={cn(
      'text-[0.7rem] max-[600px]:text-[0.48rem] max-[480px]:text-[0.45rem] font-normal tracking-[0.01em]',
      isDark ? 'text-white/70' : 'text-[rgba(33,43,54,0.7)]',
      className
    )}
    {...p}
  >
    {children}
  </span>
);

const ChartContainer = ({ className, children, height, mt, ...p }) => (
  <div
    className={cn('w-full max-[600px]:h-[140px]', className)}
    style={{
      height: height || '180px',
      marginTop: mt || '0'
    }}
    {...p}
  >
    {children}
  </div>
);

const TooltipContainer = ({ className, children, darkMode, ...p }) => (
  <div
    className={cn(
      'rounded-lg p-3 relative z-[9999] min-w-[200px] border-[1.5px] shadow-[0_4px_12px_rgba(0,0,0,0.15)]',
      darkMode ? 'bg-[#1c1c1c] text-white border-white/10' : 'bg-white text-black border-black/10',
      className
    )}
    {...p}
  >
    {children}
  </div>
);

const Skeleton = ({ className, children, height, width, ...p }) => (
  <>
    <style>{`
      @keyframes summary-loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>
    <div
      className={cn('rounded-lg', className)}
      style={{
        background: '#e8e8e8',
        backgroundSize: '200% 100%',
        animation: 'summary-loading 1.5s infinite',
        height: height || '20px',
        width: width || '100%',
        ...p.style
      }}
      {...(({ style, ...rest }) => rest)(p)}
    />
  </>
);

const CircularProgress = ({ className, ...p }) => (
  <>
    <style>{`
      @keyframes summary-spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
    <div
      className={cn('w-10 h-10 rounded-full border-4 border-black/10 border-t-[#1976d2]', className)}
      style={{
        animation: 'summary-spin 1s linear infinite'
      }}
      {...p}
    />
  </>
);

const ChartMetricBox = ({ className, children, isDark, ...p }) => (
  <>
    <style>{`
      .chart-metric-box {
        grid-column: span 1;
        overflow: visible;
        height: 64px;
        padding: 6px 10px;
        justify-content: flex-start;
        gap: 0;
      }
      @media (max-width: 1400px) { .chart-metric-box { height: 60px; } }
      @media (max-width: 1200px) { .chart-metric-box { grid-column: span 3; } }
      @media (max-width: 1024px) { .chart-metric-box { grid-column: span 1; height: 56px; padding: 5px 7px; } }
      @media (max-width: 820px) { .chart-metric-box { grid-column: span 3; height: 60px; } }
      @media (max-width: 700px) { .chart-metric-box { grid-column: span 2; } }
      @media (max-width: 600px) { .chart-metric-box { display: none; } }
    `}</style>
    <MetricBox
      className={cn('chart-metric-box', className)}
      isDark={isDark}
      style={{ justifyContent: 'flex-start' }}
      {...p}
    >
      {children}
    </MetricBox>
  </>
);

const MobileChartBox = ({ className, children, isDark, ...p }) => (
  <div
    className={cn(
      'hidden max-[600px]:flex max-[600px]:flex-col max-[600px]:mt-1 max-[600px]:justify-start max-[600px]:gap-0.5 max-[600px]:p-0 max-[600px]:overflow-hidden',
      'relative z-[1]',
      className
    )}
    {...p}
  >
    {children}
  </div>
);

function Rate(num, exch) {
  if (num === 0 || exch === 0) return '0';
  const price = num / exch;

  if (price < 0.01) {
    return price.toFixed(8).replace(/0+$/, '').replace(/\.$/, '');
  }
  if (price < 100) {
    return price.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
  }
  return price.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

const formatNumberWithDecimals = (num) => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(0)}K`;
  return Math.round(num).toLocaleString();
};

// Canvas-based Token Chart Component with Tooltips
const TokenChart = ({ data, theme, activeFiatCurrency, darkMode }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, data: null });

  const handleMouseMove = (event) => {
    if (!data || data.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;

    const chartData = data.slice(-30);
    if (chartData.length === 0) return;

    const width = rect.width;
    const pointWidth = width / Math.max(chartData.length - 1, 1);

    // Find closest data point
    const closestIndex = Math.max(
      0,
      Math.min(Math.round(mouseX / pointWidth), chartData.length - 1)
    );
    const dataPoint = chartData[closestIndex];

    // Show tooltip for the closest data point
    setTooltip({
      show: true,
      x: event.clientX,
      y: event.clientY,
      data: dataPoint
    });
  };

  const handleMouseLeave = () => {
    setTooltip({ show: false, x: 0, y: 0, data: null });
  };

  useEffect(() => {
    if (!data || data.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    let retryCount = 0;
    let retryTimeout;

    const draw = () => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      // Retry if canvas not visible yet (up to 10 attempts)
      if (rect.width === 0 || rect.height === 0) {
        if (retryCount < 10) {
          retryCount++;
          retryTimeout = setTimeout(() => requestAnimationFrame(draw), 100);
        }
        return;
      }

      // Get last 30 days of data
      const chartData = data.slice(-30);
      const chartValues = chartData.map((d) => d.Tokens || 0);
      if (chartValues.length === 0) return;

      // Set canvas size
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      const width = rect.width;
      const height = rect.height;
      const padding = 4;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Handle single data point by duplicating it for display
      if (chartValues.length === 1) {
        chartValues.push(chartValues[0]);
        chartData.push(chartData[0]);
      }

      if (chartValues.length < 2) return;

      // Calculate min/max for scaling
      const minValue = Math.min(...chartValues);
      const maxValue = Math.max(...chartValues);
      const range = maxValue - minValue;

      // Scale points to canvas with padding
      const points = chartValues.map((value, index) => {
        const x = padding + (index / (chartValues.length - 1)) * (width - padding * 2);
        const y =
          range === 0
            ? height / 2
            : padding +
              (height - padding * 2) -
              ((value - minValue) / range) * (height - padding * 2);
        return { x, y };
      });

      // Calculate median marketcap for threshold
      const marketcaps = chartData.map((d) =>
        Math.max(...(d.tokensInvolved?.map((t) => t.marketcap || 0) || [0]))
      );
      const sortedMc = [...marketcaps].sort((a, b) => a - b);
      const medianMc = sortedMc[Math.floor(sortedMc.length / 2)] || 1000;

      // Draw segments - green for above-median performers, blue for others
      for (let i = 0; i < points.length - 1; i++) {
        const maxMc = marketcaps[i];
        const isHighPerformer = maxMc > medianMc * 1.5;
        const segmentColor = isHighPerformer ? '#10b981' : '#3b82f6';

        // Area fill
        ctx.beginPath();
        ctx.moveTo(points[i].x, height);
        ctx.lineTo(points[i].x, points[i].y);
        ctx.lineTo(points[i + 1].x, points[i + 1].y);
        ctx.lineTo(points[i + 1].x, height);
        ctx.closePath();
        ctx.fillStyle = segmentColor + '20';
        ctx.fill();

        // Line
        ctx.beginPath();
        ctx.moveTo(points[i].x, points[i].y);
        ctx.lineTo(points[i + 1].x, points[i + 1].y);
        ctx.strokeStyle = segmentColor;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
    };

    // Use rAF to ensure layout is complete
    const rafId = requestAnimationFrame(draw);
    window.addEventListener('resize', draw);

    // Use ResizeObserver to detect when canvas becomes visible
    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(draw);
      });
      resizeObserver.observe(canvas);
    }

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(retryTimeout);
      window.removeEventListener('resize', draw);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [data]);

  // Tooltip Portal Component
  const TooltipPortal = ({ tooltip, darkMode, activeFiatCurrency }) => {
    if (!tooltip.show || !tooltip.data) return null;

    return createPortal(
      <div
        style={{
          position: 'fixed',
          left: tooltip.x + 15,
          top: tooltip.y - 60,
          background: darkMode ? 'rgba(18, 18, 18, 0.98)' : 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(16px)',
          color: darkMode ? '#fff' : '#000',
          border: darkMode
            ? '1px solid rgba(255, 255, 255, 0.08)'
            : '1px solid rgba(0, 0, 0, 0.08)',
          borderRadius: '10px',
          padding: '10px 12px',
          boxShadow: darkMode ? '0 8px 32px rgba(0, 0, 0, 0.4)' : '0 8px 32px rgba(0, 0, 0, 0.12)',
          minWidth: '180px',
          zIndex: 999999,
          pointerEvents: 'none',
          fontSize: '11px'
        }}
      >
        <div
          className="text-xs font-medium mb-2 pb-[6px]"
          style={{
            color: darkMode ? 'rgba(255,255,255,0.9)' : '#333',
            borderBottom: darkMode
              ? '1px solid rgba(255, 255, 255, 0.08)'
              : '1px solid rgba(0, 0, 0, 0.06)'
          }}
        >
          {format(new Date(tooltip.data.originalDate), 'MMM dd, yyyy')}
        </div>
        <div className="flex justify-between my-[3px]">
          <span className="opacity-60">New Tokens</span>
          <span className="font-medium">{tooltip.data.Tokens || 0}</span>
        </div>
        <div className="flex justify-between my-[3px]">
          <span className="opacity-60">Market Cap</span>
          <span className="font-medium">
            {currencySymbols[activeFiatCurrency]}
            {formatNumberWithDecimals(tooltip.data.totalMarketcap || 0)}
          </span>
        </div>
        <div className="flex justify-between my-[3px]">
          <span className="opacity-60">Avg Holders</span>
          <span className="font-medium">{Math.round(tooltip.data.avgHolders || 0)}</span>
        </div>
        <div className="flex justify-between my-[3px]">
          <span className="opacity-60">Volume 24h</span>
          <span className="font-medium">
            {currencySymbols[activeFiatCurrency]}
            {formatNumberWithDecimals(tooltip.data.totalVolume24h || 0)}
          </span>
        </div>
        {tooltip.data.platforms &&
          Object.entries(tooltip.data.platforms).filter(([, v]) => v > 0).length > 0 && (
            <>
              <div
                className="mt-[6px] mb-1 pt-[6px]"
                style={{
                  borderTop: darkMode
                    ? '1px solid rgba(255, 255, 255, 0.08)'
                    : '1px solid rgba(0, 0, 0, 0.06)'
                }}
              >
                <span className="text-[10px] font-medium opacity-50 uppercase tracking-[0.03em]">
                  Platforms
                </span>
              </div>
              {Object.entries(tooltip.data.platforms)
                .filter(([, v]) => v > 0)
                .map(([platform, count]) => (
                  <div
                    key={platform}
                    className="flex justify-between my-[2px] text-[10px] opacity-70"
                  >
                    <span>{platform}</span>
                    <span>{count}</span>
                  </div>
                ))}
            </>
          )}
        {tooltip.data.tokensInvolved?.length > 0 && (
          <>
            <div
              className="mt-[6px] mb-1 pt-[6px]"
              style={{
                borderTop: darkMode
                  ? '1px solid rgba(255, 255, 255, 0.08)'
                  : '1px solid rgba(0, 0, 0, 0.06)'
              }}
            >
              <span className="text-[10px] font-medium opacity-50 uppercase tracking-[0.03em]">
                Top Tokens
              </span>
            </div>
            {[...tooltip.data.tokensInvolved]
              .sort((a, b) => (b.marketcap || 0) - (a.marketcap || 0))
              .slice(0, 3)
              .map((token, i) => (
                <div
                  key={`tooltip-token-${i}-${token.md5 || token.name}`}
                  className="flex items-center justify-between my-[3px] text-[10px]"
                >
                  <div className="flex items-center gap-[5px]">
                    <div
                      className={cn(
                        'w-[14px] h-[14px] min-w-[14px] min-h-[14px] rounded-[3px] overflow-hidden',
                        darkMode ? 'bg-white/[0.05]' : 'bg-black/[0.04]'
                      )}
                    >
                      <img
                        src={`https://s1.xrpl.to/token/${token.md5}`}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.parentElement.style.display = 'none';
                        }}
                      />
                    </div>
                    <span className="opacity-80">{token.name}</span>
                  </div>
                  <span className="font-medium">
                    {formatNumberWithDecimals(token.marketcap || 0)} XRP
                  </span>
                </div>
              ))}
          </>
        )}
      </div>,
      document.body
    );
  };

  return (
    <>
      <div
        ref={containerRef}
        className="w-full h-full min-h-[20px] relative"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full block cursor-pointer"
        />
      </div>

      <TooltipPortal
        tooltip={tooltip}
        darkMode={darkMode}
        activeFiatCurrency={activeFiatCurrency}
      />
    </>
  );
};

// SummaryTag component (previously in separate file)
export const SummaryTag = ({ tagName }) => {
  return (
    <div className="mt-4 max-[600px]:mt-1">
      <h1 className="m-0 mb-2 max-[600px]:mb-1 text-[1.75rem] max-[600px]:text-[1.1rem] font-normal leading-[1.2]">
        {tagName} Tokens
      </h1>
      <div className="text-sm max-[600px]:text-[0.7rem] font-normal leading-[1.4] opacity-60">
        Ranked by 24h trading volume
      </div>
    </div>
  );
};

// SummaryWatchList component (previously in separate file)
export const SummaryWatchList = () => {
  const { accountProfile } = useContext(WalletContext);
  const account = accountProfile?.account;

  return (
    <div className="mt-4 max-[600px]:mt-1">
      <h1
        className="m-0 text-[2.125rem] max-[600px]:text-[1.1rem] font-light leading-[1.235] tracking-[-0.00833em]"
      >
        My Token Watchlist
      </h1>
      {!account && (
        <div
          className="text-base max-[600px]:text-[0.7rem] font-normal mt-4 max-[600px]:mt-2 leading-[1.5] tracking-[0.00938em]"
        >
          <span className="text-[rgba(145,158,171,0.99)]">
            Track your favorite XRPL tokens. Log in to manage your personalized watchlist.
          </span>
        </div>
      )}
    </div>
  );
};

// Main Summary component
export default function Summary() {
  // Translation removed - using hardcoded English text
  const metrics = useSelector(selectMetrics);
  const tokenCreation = useSelector(selectTokenCreation);
  const { darkMode } = useContext(ThemeContext);
  const { activeFiatCurrency } = useContext(AppContext);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 600);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const fiatRate =
    metrics[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics.CNY : null) || 1;

  const getChartOption = () => ({
    grid: {
      left: 0,
      right: 0,
      top: 5,
      bottom: 0
    },
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      z: 999999,
      position: function (point, params, dom, rect, size) {
        // Calculate position to ensure tooltip stays within viewport
        var x = point[0];
        var y = point[1];

        // Adjust if tooltip would go off top of screen
        if (y - size.contentSize[1] - 10 < 0) {
          y = point[1] + 20; // Show below cursor
        } else {
          y = point[1] - size.contentSize[1] - 10; // Show above cursor
        }

        // Adjust if tooltip would go off right side
        if (x + size.contentSize[0] > window.innerWidth) {
          x = window.innerWidth - size.contentSize[0] - 10;
        }

        return [x, y];
      },
      formatter: (params) => {
        if (!params || !params[0]) return '';
        const data = chartData[params[0].dataIndex];
        const platforms = data.platforms || {};
        const platformEntries = Object.entries(platforms).filter(([, value]) => value > 0);
        const tokensInvolved = (data.tokensInvolved || [])
          .slice()
          .sort((a, b) => (b.marketcap || 0) - (a.marketcap || 0));

        let html = `
          <div style="background: ${darkMode ? '#1c1c1c' : 'white'}; color: ${darkMode ? '#fff' : '#000'}; border: 1.5px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}; border-radius: 8px; padding: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); min-width: 200px;">
            <div style="font-size: 0.875rem; font-weight: 600; margin-bottom: 8px;">
              ${format(new Date(data.originalDate), 'MMM dd, yyyy')}
            </div>
            <div style="display: flex; justify-content: space-between; margin: 4px 0;">
              <span style="font-size: 0.75rem;">New Tokens</span>
              <span style="font-size: 0.75rem; font-weight: 600;">${data.Tokens || 0}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 4px 0;">
              <span style="font-size: 0.75rem;">Market Cap</span>
              <span style="font-size: 0.75rem; font-weight: 600;">${currencySymbols[activeFiatCurrency]}${formatNumberWithDecimals(data.totalMarketcap)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 4px 0;">
              <span style="font-size: 0.75rem;">Avg Holders</span>
              <span style="font-size: 0.75rem; font-weight: 600;">${Math.round(data.avgHolders)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 4px 0;">
              <span style="font-size: 0.75rem;">Volume 24h</span>
              <span style="font-size: 0.75rem; font-weight: 600;">${currencySymbols[activeFiatCurrency]}${formatNumberWithDecimals(data.totalVolume24h)}</span>
            </div>
            ${
              platformEntries.length > 0
                ? `
              <div style="border-top: 1px solid ${darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}; margin: 8px -12px;"></div>
              <div style="font-size: 0.75rem; font-weight: 600; margin-top: 8px;">Platforms</div>
              ${platformEntries
                .map(
                  ([platform, count]) => `
                <div style="display: flex; justify-content: space-between; margin: 4px 0;">
                  <span style="font-size: 0.7rem; color: ${darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'};">${platform}</span>
                  <span style="font-size: 0.7rem; font-weight: 600;">${count}</span>
                </div>
              `
                )
                .join('')}
            `
                : ''
            }
            ${
              tokensInvolved.length > 0
                ? `
              <div style="border-top: 1px solid ${darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}; margin: 8px -12px;"></div>
              <div style="font-size: 0.75rem; font-weight: 600; margin-top: 8px;">Top Tokens Created</div>
              ${tokensInvolved
                .slice(0, 3)
                .map(
                  (token) => `
                <div style="display: flex; justify-content: space-between; margin: 4px 0;">
                  <span style="font-size: 0.7rem; color: ${darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'};">${token.currency || token.symbol || token.ticker || token.code || token.currencyCode || token.name || 'Unknown'}</span>
                  <span style="font-size: 0.7rem;">${currencySymbols[activeFiatCurrency]}${formatNumberWithDecimals(new Decimal(token.marketcap || 0).div(fiatRate).toNumber())}</span>
                </div>
              `
                )
                .join('')}
            `
                : ''
            }
          </div>
        `;
        return html;
      },
      backgroundColor: darkMode ? '#1c1c1c' : 'white',
      borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      borderWidth: 1,
      borderRadius: 12,
      textStyle: {
        color: darkMode ? '#fff' : '#000'
      },
      extraCssText: 'z-index: 999999 !important; position: fixed !important;'
    },
    xAxis: {
      type: 'category',
      data: chartData.map((d) => d.date),
      show: false
    },
    yAxis: {
      type: 'value',
      show: false
    },
    series: [
      {
        data: chartData.map((d) => d.Tokens),
        type: 'line',
        smooth: true,
        lineStyle: {
          color: '#3b82f6',
          width: 1.5
        },
        areaStyle: {
          color: 'rgba(59, 130, 246, 0.15)'
        },
        showSymbol: false
      }
    ]
  });

  const platformColors = {
    'xrpl.to': '#3b82f6',
    XPMarket: '#ef4444',
    FirstLedger: '#10b981',
    Sologenic: '#f59e0b',
    Other: '#6b7280'
  };

  const chartData = useMemo(() => {
    return tokenCreation && tokenCreation.length > 0
      ? tokenCreation
          .slice(0, 30)
          .reverse()
          .map((d) => {
            const totalMarketcapFromInvolved = d.tokensInvolved?.reduce(
              (sum, token) => sum + (token.marketcap || 0),
              0
            );
            const totalMarketcap = totalMarketcapFromInvolved ?? d.totalMarketcap ?? 0;
            return {
              date: d.date.substring(5, 7) + '/' + d.date.substring(8, 10),
              originalDate: d.date,
              Tokens: d.totalTokens,
              platforms: d.platforms,
              avgMarketcap: new Decimal(d.avgMarketcap || 0).div(fiatRate).toNumber(),
              rawAvgMarketcap: d.avgMarketcap,
              avgHolders: d.avgHolders || 0,
              totalVolume24h: new Decimal(d.avgVolume24h || 0).div(fiatRate).toNumber(),
              totalMarketcap: new Decimal(totalMarketcap || 0).div(fiatRate).toNumber(),
              tokensInvolved: d.tokensInvolved || []
            };
          })
      : [];
  }, [tokenCreation, fiatRate]);

  const latestToken = chartData[chartData.length - 1]?.tokensInvolved?.slice(-1)[0];

  const activePlatforms = Object.keys(platformColors).filter((platform) => {
    if (platform === 'Other') return false;
    return chartData.some((d) => (d.platforms?.[platform] || 0) > 0);
  });

  const xrpPrice =
    activeFiatCurrency === 'XRP'
      ? Rate(1, metrics.USD || 1)
      : Rate(
          1,
          metrics[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics.CNY : null) || 1
        );

  const xrpPriceSymbol =
    activeFiatCurrency === 'XRP' ? currencySymbols.USD : currencySymbols[activeFiatCurrency];

  return (
    <Container isDark={darkMode}>
        {/* Main Metrics Section */}
        {isLoading ? (
          <>
            <Grid>
              {[...Array(6)].map((_, i) => (
                <MetricBox key={`summary-skeleton-${i}`} isDark={darkMode}>
                  <Skeleton height="12px" width="60%" style={{ marginBottom: '4px' }} />
                  <Skeleton height="20px" width="80%" />
                </MetricBox>
              ))}
            </Grid>
          </>
        ) : (
          <>
            <Grid>
              <MetricBox isDark={darkMode}>
                <MetricTitle isDark={darkMode}>{isMobile ? 'MCap' : 'MCap / TVL'}</MetricTitle>
                {isMobile ? (
                  <>
                    <MetricValue isDark={darkMode}>
                      {currencySymbols[activeFiatCurrency]}
                      {formatNumberWithDecimals(
                        new Decimal(metrics.global?.gMarketcap || metrics.market_cap_usd || 0)
                          .div(fiatRate)
                          .toNumber()
                      )}
                    </MetricValue>
                    <span className={cn('text-[0.5rem] leading-[1] whitespace-nowrap', darkMode ? 'text-white/50' : 'text-black/50')}>
                      TVL {currencySymbols[activeFiatCurrency]}
                      {formatNumberWithDecimals(
                        new Decimal(metrics.global?.gTVL || metrics.global?.totalTVL || metrics.H24?.totalTVL || 0)
                          .div(fiatRate)
                          .toNumber()
                      )}
                    </span>
                  </>
                ) : (
                  <div className="summary-mcap-row flex w-full items-center gap-5">
                    <div className="flex flex-col gap-[3px]">
                      <MetricValue isDark={darkMode} style={{ fontSize: '1.15rem' }}>
                        {currencySymbols[activeFiatCurrency]}
                        {formatNumberWithDecimals(
                          new Decimal(metrics.global?.gMarketcap || metrics.market_cap_usd || 0)
                            .div(fiatRate)
                            .toNumber()
                        )}
                      </MetricValue>
                      <PercentageChange
                        isPositive={(metrics.global?.gMarketcapPro || 0) >= 0}
                        style={{ fontSize: '0.58rem' }}
                      >
                        {(metrics.global?.gMarketcapPro || 0) >= 0 ? '↑' : '↓'}
                        {Math.abs(metrics.global?.gMarketcapPro || 0).toFixed(1)}%
                      </PercentageChange>
                    </div>
                    <div className="flex flex-col gap-[3px]">
                      <MetricValue isDark={darkMode} style={{ fontSize: '1.15rem', opacity: 0.6 }}>
                        {currencySymbols[activeFiatCurrency]}
                        {formatNumberWithDecimals(
                          new Decimal(
                            metrics.global?.gTVL ||
                              metrics.global?.totalTVL ||
                              metrics.H24?.totalTVL ||
                              0
                          )
                            .div(fiatRate)
                            .toNumber()
                        )}
                      </MetricValue>
                      <PercentageChange
                        isPositive={
                          (metrics.global?.gTVLPro ||
                            metrics.global?.totalTVLPro ||
                            metrics.H24?.totalTVLPro ||
                            0) >= 0
                        }
                        style={{ fontSize: '0.58rem' }}
                      >
                        {(metrics.global?.gTVLPro ||
                          metrics.global?.totalTVLPro ||
                          metrics.H24?.totalTVLPro ||
                          0) >= 0
                          ? '↑'
                          : '↓'}
                        {Math.abs(
                          metrics.global?.gTVLPro ||
                            metrics.global?.totalTVLPro ||
                            metrics.H24?.totalTVLPro ||
                            0
                        ).toFixed(1)}
                        %
                      </PercentageChange>
                    </div>
                  </div>
                )}
              </MetricBox>

              <MetricBox isDark={darkMode}>
                <MetricTitle isDark={darkMode}>{isMobile ? '24h Vol' : '24h Volume'}</MetricTitle>
                <MetricValue isDark={darkMode}>
                  {currencySymbols[activeFiatCurrency]}
                  {formatNumberWithDecimals(
                    new Decimal(metrics.global?.gDexVolume || metrics.total_volume_usd || 0)
                      .div(fiatRate)
                      .toNumber()
                  )}
                </MetricValue>
                {(() => {
                  const stablePercent =
                    ((metrics.global?.gStableVolume || 0) / (metrics.global?.gDexVolume || 1)) *
                    100;
                  const memePercent =
                    ((metrics.global?.gMemeVolume || 0) / (metrics.global?.gDexVolume || 1)) * 100;
                  return (
                    <div className="flex items-center gap-1 flex-wrap">
                      <PercentageChange isPositive={(metrics.global?.gDexVolumePro || 0) >= 0}>
                        {(metrics.global?.gDexVolumePro || 0) >= 0 ? '↑' : '↓'}
                        {Math.abs(metrics.global?.gDexVolumePro || 0).toFixed(1)}%
                      </PercentageChange>
                      {!isMobile && (
                        <>
                          <span className="summary-vol-badge text-[0.58rem] font-medium py-px px-1 rounded bg-[rgba(16,185,129,0.1)] text-[#10b981]">
                            {stablePercent.toFixed(0)}% Stable
                          </span>
                          <span className="summary-vol-badge text-[0.58rem] font-medium py-px px-1 rounded bg-[rgba(245,158,11,0.1)] text-[#f59e0b]">
                            {memePercent.toFixed(0)}% Meme
                          </span>
                        </>
                      )}
                    </div>
                  );
                })()}
              </MetricBox>

              <MetricBox isDark={darkMode}>
                <MetricTitle isDark={darkMode}>{isMobile ? 'XRP' : 'XRP Price'}</MetricTitle>
                <MetricValue isDark={darkMode}>
                  {xrpPriceSymbol}
                  {xrpPrice}
                </MetricValue>
                <PercentageChange
                  isPositive={(metrics.H24?.xrpPro24h || metrics.XRPchange24h || 0) >= 0}
                >
                  {(metrics.H24?.xrpPro24h || metrics.XRPchange24h || 0) >= 0 ? '↑' : '↓'}
                  {Math.abs(metrics.H24?.xrpPro24h || metrics.XRPchange24h || 0).toFixed(2)}%
                </PercentageChange>
              </MetricBox>

              <MetricBox isDark={darkMode}>
                <MetricTitle isDark={darkMode}>{isMobile ? 'Traders' : '24h Traders'}</MetricTitle>
                <MetricValue isDark={darkMode}>
                  {formatNumberWithDecimals(metrics.H24?.uniqueTraders24H || 0)}
                </MetricValue>
                {(() => {
                  const buyVol = metrics.H24?.globalBuy24hxrp || 0;
                  const sellVol = metrics.H24?.globalSell24hxrp || 0;
                  const total = buyVol + sellVol;
                  const buyPercent = total > 0 ? (buyVol / total) * 100 : 50;
                  return !isMobile ? (
                    <div className="flex items-center gap-1">
                      <span className="font-medium rounded bg-[rgba(16,185,129,0.1)] text-[#10b981] text-[0.58rem] py-px px-1">
                        {buyPercent.toFixed(0)}% Buy
                      </span>
                      <span className="font-medium rounded bg-[rgba(239,68,68,0.1)] text-[#ef4444] text-[0.58rem] py-px px-1">
                        {(100 - buyPercent).toFixed(0)}% Sell
                      </span>
                    </div>
                    ) : (
                    <PercentageChange isPositive={buyPercent >= 50}>
                      {buyPercent.toFixed(0)}% B / {(100 - buyPercent).toFixed(0)}% S
                    </PercentageChange>
                    );
                })()}
              </MetricBox>

              <MetricBox
                isDark={darkMode}
              >
                <MetricTitle isDark={darkMode}>Market</MetricTitle>
                {(() => {
                  const sentiment = metrics.global?.sentimentScore || 50;
                  const rsi = metrics.global?.avgRSI || 50;

                  const getSentimentColor = (v) =>
                    v >= 55 ? '#10b981' : v >= 45 ? '#fbbf24' : '#ef4444';
                  const getRsiColor = (v) =>
                    v >= 70 ? '#ef4444' : v <= 30 ? '#8b5cf6' : v >= 50 ? '#10b981' : '#fbbf24';

                  const sentColor = getSentimentColor(sentiment);
                  const rsiColor = getRsiColor(rsi);

                  if (isMobile) {
                    return (
                      <>
                        <MetricValue isDark={darkMode}>
                          <span style={{ color: sentColor }}>{sentiment.toFixed(0)}</span>
                          <span className={cn('text-[0.35rem] ml-[2px] font-normal', darkMode ? 'text-white/50' : 'text-black/50')}>Sentiment</span>
                        </MetricValue>
                        <span className={cn('text-[0.5rem] leading-[1] whitespace-nowrap', darkMode ? 'text-white/50' : 'text-black/50')}>
                          RSI <span style={{ color: rsiColor, fontWeight: 600 }}>{rsi.toFixed(0)}</span>
                        </span>
                      </>
                    );
                  }

                  return (
                    <div
                      className="summary-market-row flex items-center w-full justify-start gap-5"
                    >
                      {/* Sentiment gauge */}
                      <div className="flex flex-col items-center gap-[3px]">
                        <div className="summary-gauge relative w-10 h-[22px]">
                          <div className="absolute opacity-20 bg-[#fbbf24] w-10 h-5 rounded-t-[20px]" />
                          <div
                            className="absolute bottom-0 left-1/2 w-[2px] rounded-[1px] origin-bottom h-4"
                            style={{
                              background: sentColor,
                              transform: `translateX(-50%) rotate(${(sentiment - 50) * 1.8}deg)`
                            }}
                          />
                          <div
                            className="absolute -bottom-[2px] left-1/2 -translate-x-1/2 rounded-full w-[6px] h-[6px]"
                            style={{ background: sentColor }}
                          />
                        </div>
                        <div className="flex items-baseline gap-[3px]">
                          <span className="font-semibold leading-[1] text-[1.15rem]" style={{ color: sentColor }}>
                            {sentiment.toFixed(0)}
                          </span>
                          <span className={cn('text-[0.52rem]', darkMode ? 'text-white/60' : 'text-black/60')}>
                            Sentiment
                          </span>
                        </div>
                      </div>

                      {/* RSI gauge */}
                      <div className="flex flex-col items-center gap-[3px]">
                        <div className="summary-gauge relative w-10 h-[22px]">
                          <div className="absolute opacity-20 bg-[#10b981] w-10 h-5 rounded-t-[20px]" />
                          <div
                            className="absolute bottom-0 left-1/2 w-[2px] rounded-[1px] origin-bottom h-4"
                            style={{
                              background: rsiColor,
                              transform: `translateX(-50%) rotate(${(rsi - 50) * 1.8}deg)`
                            }}
                          />
                          <div
                            className="absolute -bottom-[2px] left-1/2 -translate-x-1/2 rounded-full w-[6px] h-[6px]"
                            style={{ background: rsiColor }}
                          />
                        </div>
                        <div className="flex items-baseline gap-[3px]">
                          <span className="font-semibold leading-[1] text-[1.15rem]" style={{ color: rsiColor }}>
                            {rsi.toFixed(0)}
                          </span>
                          <span className={cn('text-[0.52rem]', darkMode ? 'text-white/60' : 'text-black/60')}>
                            RSI
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </MetricBox>

              <ChartMetricBox isDark={darkMode}>
                {(() => {
                  const today = chartData[chartData.length - 1]?.Tokens || 0;
                  const yesterday = chartData[chartData.length - 2]?.Tokens || 0;
                  const isUp = today >= yesterday;
                  return (
                    <>
                      <div className="flex items-center justify-between w-full mb-1">
                        <div className="flex items-center gap-2">
                          <MetricTitle isDark={darkMode}>New Tokens</MetricTitle>
                          <div className="flex items-center gap-1">
                            <span
                              className={cn('text-base font-semibold', darkMode ? 'text-white' : 'text-[#212B36]')}
                            >
                              {today}
                            </span>
                            <span
                              className={cn('text-[0.52rem]', darkMode ? 'text-white/60' : 'text-black/60')}
                            >
                              today
                            </span>
                            <span
                              className={cn('text-[0.7rem]', isUp ? 'text-[#10b981]' : 'text-[#ef4444]')}
                            >
                              {isUp ? '↑' : '↓'}
                            </span>
                          </div>
                        </div>
                        {latestToken && (
                          <Link
                            href={`/token/${latestToken.md5}`}
                            prefetch={false}
                            className={cn(
                              'text-[0.58rem] no-underline flex items-center gap-[6px] pl-2 border-l',
                              darkMode ? 'text-white/50 border-white/10' : 'text-black/50 border-black/10'
                            )}
                          >
                            <span className="max-w-[70px] overflow-hidden text-ellipsis whitespace-nowrap">
                              {latestToken.name}
                            </span>
                            <span className="text-[#10b981] font-medium">
                              {formatNumberWithDecimals(latestToken.marketcap || 0)} XRP
                            </span>
                          </Link>
                        )}
                      </div>
                      <div className="flex-1 w-full min-h-0">
                        <TokenChart
                          data={chartData}
                          activeFiatCurrency={activeFiatCurrency}
                          darkMode={darkMode}
                        />
                      </div>
                    </>
                  );
                })()}
              </ChartMetricBox>
            </Grid>

            <MobileChartBox isDark={darkMode}>
              {(() => {
                const today = chartData[chartData.length - 1]?.Tokens || 0;
                const yesterday = chartData[chartData.length - 2]?.Tokens || 0;
                const isUp = today >= yesterday;
                return (
                  <>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-[6px]">
                        <MetricTitle isDark={darkMode}>New Tokens</MetricTitle>
                        <div className="flex items-center gap-[3px]">
                          <span
                            className={cn('text-[0.85rem] font-semibold', darkMode ? 'text-white' : 'text-[#212B36]')}
                          >
                            {today}
                          </span>
                          <span
                            className={cn('text-[0.48rem]', darkMode ? 'text-white/50' : 'text-black/50')}
                          >
                            today
                          </span>
                          <span className={cn('text-[0.65rem]', isUp ? 'text-[#10b981]' : 'text-[#ef4444]')}>
                            {isUp ? '↑' : '↓'}
                          </span>
                        </div>
                      </div>
                      {latestToken && (
                        <Link
                          href={`/token/${latestToken.md5}`}
                          prefetch={false}
                          className={cn(
                            'text-[0.48rem] no-underline flex items-center gap-1 pl-[6px] border-l',
                            darkMode ? 'text-white/50 border-white/10' : 'text-black/50 border-black/10'
                          )}
                        >
                          <span className="max-w-[50px] overflow-hidden text-ellipsis whitespace-nowrap">
                            {latestToken.name}
                          </span>
                          <span className="text-[#10b981] font-medium">
                            {formatNumberWithDecimals(latestToken.marketcap || 0)} XRP
                          </span>
                        </Link>
                      )}
                    </div>
                    <div className="h-[22px] w-full">
                      <TokenChart
                        data={chartData}
                        activeFiatCurrency={activeFiatCurrency}
                        darkMode={darkMode}
                      />
                    </div>
                  </>
                );
              })()}
            </MobileChartBox>
          </>
        )}
    </Container>
  );
}
