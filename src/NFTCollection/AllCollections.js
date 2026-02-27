import React, { useState, useMemo, useEffect, useRef, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import { useRouter } from 'next/router';
import CollectionList from './CollectionList';
import { cn } from 'src/utils/cn';
import { fVolume, fIntNumber, normalizeTag } from 'src/utils/formatters';
import { X, Search, Flame, TrendingUp, Sparkles, Clock } from 'lucide-react';
import { TIER_CONFIG } from 'src/components/VerificationBadge';
import { ApiButton } from 'src/components/ApiEndpointsModal';
import Link from 'next/link';
import { fNumber, normalizeCollectionName } from 'src/utils/formatters';
import dynamic from 'next/dynamic';
const BoostModal = dynamic(() => import('src/components/BoostModal'), { ssr: false });

// Constants
const CollectionListType = {
  ALL: 'ALL',
  FEATURED: 'FEATURED',
  TRENDING: 'TRENDING'
};

// Styled Components - matching Summary.js
const Container = ({ className, children, ...p }) => (
  <div
    className={cn('relative z-[2] mb-3 w-full max-w-full bg-transparent overflow-visible max-sm:my-2 max-sm:p-0', className)}
    style={typeof document !== "undefined" && document.documentElement.classList.contains('dark') ? {
      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.02) 39px, rgba(255,255,255,0.02) 40px)',
      backgroundSize: '100% 40px',
      boxShadow: '0 0 30px rgba(255,255,255,0.03), 0 0 60px rgba(255,255,255,0.01)'
    } : undefined}
    {...p}
  >{children}</div>
);

const Grid = ({ className, children, ...p }) => (
  <div
    className={cn(
      'grid grid-cols-[repeat(4,1fr)_repeat(2,1.3fr)] gap-[5px] w-full',
      'max-[1400px]:grid-cols-3',
      'max-[900px]:grid-cols-3',
      'max-sm:grid-cols-2 max-sm:gap-[3px]',
      className
    )}
    style={{ WebkitOverflowScrolling: 'touch' }}
    {...p}
  >{children}</div>
);

const MetricBox = ({ className, children, ...p }) => (
  <div
    className={cn(
      'py-[6px] px-[10px] flex flex-col justify-between items-start rounded-xl border-[1.5px] backdrop-blur-md transition-[background-color,border-color,opacity,transform,box-shadow] duration-200 gap-0',
      'max-sm:py-[8px] max-sm:px-[7px] max-sm:flex-none max-sm:min-w-[100px] max-sm:gap-0 max-sm:rounded-[10px]',
      'bg-white border-black/[0.06] dark:bg-white/[0.02] dark:border-white/[0.08]',
      className
    )}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = document.documentElement.classList.contains('dark') ? 'rgba(19, 125, 254, 0.25)' : 'rgba(19, 125, 254, 0.15)';
      e.currentTarget.style.background = document.documentElement.classList.contains('dark') ? 'rgba(19, 125, 254, 0.05)' : 'rgba(19, 125, 254, 0.03)';
      e.currentTarget.style.boxShadow = document.documentElement.classList.contains('dark') ? '0 0 12px rgba(19,125,254,0.15)' : '0 0 8px rgba(19,125,254,0.08)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
      e.currentTarget.style.background = document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)';
      e.currentTarget.style.boxShadow = 'none';
    }}
    {...p}
  >{children}</div>
);

const MetricTitle = ({ className, children, ...p }) => (
  <span className={cn('text-[0.85rem] font-normal font-mono uppercase tracking-widest max-sm:text-[0.65rem]', 'text-[#212B36]/50 dark:text-white/50', className)} {...p}>{children}</span>
);

const MetricValue = ({ className, children, ...p }) => (
  <span className={cn('text-[1.75rem] font-semibold leading-none tracking-[-0.02em] whitespace-nowrap tabular-nums max-sm:text-[1.1rem]', 'text-[#212B36] dark:text-white', className)} {...p}>{children}</span>
);

const PercentageChange = ({ isPositive, className, children, ...p }) => (
  <span
    className={cn(
      'text-[0.85rem] inline-flex items-center gap-[2px] font-medium tracking-[-0.01em] px-2 py-1 rounded max-sm:text-[0.65rem] max-sm:px-[5px]',
      isPositive ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10',
      className
    )}
    style={{ boxShadow: isPositive ? '0 0 6px rgba(16,185,129,0.4)' : '0 0 6px rgba(239,68,68,0.4)' }}
    {...p}
  >{children}</span>
);

const VolumePercentage = ({ className, children, ...p }) => (
  <span className={cn('text-[0.75rem] font-normal max-sm:text-[0.58rem]', 'text-[#212B36]/60 dark:text-white/60', className)} {...p}>{children}</span>
);

const ChartMetricBox = ({ className, children, ...p }) => (
  <MetricBox className={cn('col-span-1 overflow-visible max-[1400px]:col-span-3 max-[900px]:col-span-3 max-sm:!hidden', className)} {...p}>{children}</MetricBox>
);

const MobileChartBox = ({ className, children, ...p }) => (
  <MetricBox className={cn('hidden max-sm:!flex max-sm:mt-1', className)} {...p}>{children}</MetricBox>
);

// Volume Chart Component
const VolumeChart = ({ data }) => {
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

    const closestIndex = Math.max(
      0,
      Math.min(Math.round(mouseX / pointWidth), chartData.length - 1)
    );
    const dataPoint = chartData[closestIndex];

    setTooltip({ show: true, x: event.clientX, y: event.clientY, data: dataPoint });
  };

  const handleMouseLeave = () => {
    setTooltip({ show: false, x: 0, y: 0, data: null });
  };

  useEffect(() => {
    if (!data || data.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;

    const draw = () => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const chartData = data.slice(-30);
      const chartValues = chartData.map((d) => d.volume || 0);
      if (chartValues.length === 0) return;

      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      const width = rect.width;
      const height = rect.height;
      const padding = 4;

      ctx.clearRect(0, 0, width, height);

      if (chartValues.length === 1) {
        chartValues.push(chartValues[0]);
        chartData.push(chartData[0]);
      }

      if (chartValues.length < 2) return;

      const minValue = Math.min(...chartValues);
      const maxValue = Math.max(...chartValues);
      const range = maxValue - minValue;

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

      // Draw gradient area and line
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

      ctx.beginPath();
      ctx.moveTo(points[0].x, height);
      points.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.lineTo(points[points.length - 1].x, height);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    };

    const rafId = requestAnimationFrame(draw);
    window.addEventListener('resize', draw);

    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => requestAnimationFrame(draw));
      resizeObserver.observe(canvas);
    }

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', draw);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [data]);

  const TooltipPortal = () => {
    if (!tooltip.show || !tooltip.data) return null;

    return createPortal(
      <div
        className={cn(
          'fixed rounded-[10px] py-[10px] px-3 min-w-[160px] z-[999999] pointer-events-none text-[11px] backdrop-blur-[16px]',
          'bg-[rgba(255,255,255,0.98)] text-black border border-black/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:bg-[rgba(18,18,18,0.98)] dark:text-white dark:border-white/[0.08] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
        )}
        style={{ left: tooltip.x + 15, top: tooltip.y - 80 }}
      >
        <div
          className={cn('text-xs font-medium mb-2 pb-1.5', 'border-b border-black/[0.06] dark:border-white/[0.08]')}
        >
          {format(new Date(tooltip.data.date), 'MMM dd, yyyy')}
        </div>
        <div className="flex justify-between my-[3px]">
          <span className="opacity-60">Volume</span>
          <span className="font-medium">
            ✕{formatNumberWithDecimals(tooltip.data.volume || 0)}
          </span>
        </div>
        <div className="flex justify-between my-[3px]">
          <span className="opacity-60">Sales</span>
          <span className="font-medium">{tooltip.data.sales || 0}</span>
        </div>
        <div className="flex justify-between my-[3px]">
          <span className="opacity-60">Average Price</span>
          <span className="font-medium">✕{(tooltip.data.avgPrice || 0).toFixed(2)}</span>
        </div>
        {tooltip.data.uniqueBuyers && (
          <div className="flex justify-between my-[3px]">
            <span className="opacity-60">Traders</span>
            <span className="font-medium">
              {tooltip.data.uniqueBuyers} / {tooltip.data.uniqueSellers}
            </span>
          </div>
        )}
      </div>,
      document.body
    );
  };

  return (
    <>
      <div
        ref={containerRef}
        className="w-full h-[42px] -mt-[2px] relative"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <canvas
          ref={canvasRef}
          aria-label="Volume chart"
          className="w-full h-full block cursor-pointer"
        />
      </div>
      <TooltipPortal />
    </>
  );
};

// Collection Creation Chart Component (similar to TokenChart in Summary.js)
const CollectionCreationChart = ({ data }) => {
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

    const closestIndex = Math.max(
      0,
      Math.min(Math.round(mouseX / pointWidth), chartData.length - 1)
    );
    const dataPoint = chartData[closestIndex];

    setTooltip({ show: true, x: event.clientX, y: event.clientY, data: dataPoint });
  };

  const handleMouseLeave = () => {
    setTooltip({ show: false, x: 0, y: 0, data: null });
  };

  useEffect(() => {
    if (!data || data.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;

    const draw = () => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const chartData = data.slice(-30);
      // Support both collectionCreation (totalCollections) and daily (mints) formats
      const chartValues = chartData.map((d) => d.totalCollections ?? d.mints ?? 0);
      if (chartValues.length === 0) return;

      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      const width = rect.width;
      const height = rect.height;
      const padding = 4;

      ctx.clearRect(0, 0, width, height);

      if (chartValues.length === 1) {
        chartValues.push(chartValues[0]);
        chartData.push(chartData[0]);
      }

      if (chartValues.length < 2) return;

      const minValue = Math.min(...chartValues);
      const maxValue = Math.max(...chartValues);
      const range = maxValue - minValue;

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

      // Calculate median volume for threshold coloring
      const volumes = chartData.map((d) => d.volume || 0);
      const sortedVol = [...volumes].sort((a, b) => a - b);
      const medianVol = sortedVol[Math.floor(sortedVol.length / 2)] || 1000;

      // Draw segments - green for high activity days, blue for normal
      for (let i = 0; i < points.length - 1; i++) {
        const dayVolume = volumes[i];
        const isHighActivity = dayVolume > medianVol * 1.5;
        const segmentColor = isHighActivity ? '#10b981' : '#3b82f6';

        const gradient = ctx.createLinearGradient(0, points[i].y, 0, height);
        gradient.addColorStop(0, segmentColor + '40');
        gradient.addColorStop(1, segmentColor + '00');

        ctx.beginPath();
        ctx.moveTo(points[i].x, height);
        ctx.lineTo(points[i].x, points[i].y);
        ctx.lineTo(points[i + 1].x, points[i + 1].y);
        ctx.lineTo(points[i + 1].x, height);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

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

    const rafId = requestAnimationFrame(draw);
    window.addEventListener('resize', draw);

    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => requestAnimationFrame(draw));
      resizeObserver.observe(canvas);
    }

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', draw);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [data]);

  const TooltipPortal = () => {
    if (!tooltip.show || !tooltip.data) return null;

    const d = tooltip.data;
    // Support both collectionCreation and daily formats
    const collections = d.collectionsInvolved || d.topCollections || [];
    const mintCount = d.totalCollections ?? d.mints ?? 0;
    const itemCount = d.totalItems ?? d.sales ?? 0;

    return createPortal(
      <div
        className={cn(
          'fixed rounded-[10px] py-[10px] px-3 min-w-[180px] z-[999999] pointer-events-none text-[11px] backdrop-blur-[16px]',
          'bg-[rgba(255,255,255,0.98)] text-black border border-black/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:bg-[rgba(18,18,18,0.98)] dark:text-white dark:border-white/[0.08] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
        )}
        style={{ left: tooltip.x + 15, top: tooltip.y - 100 }}
      >
        <div
          className={cn('text-xs font-medium mb-2 pb-1.5', 'border-b border-black/[0.06] dark:border-white/[0.08]')}
        >
          {format(new Date(d.date), 'MMM dd, yyyy')}
        </div>
        <div className="flex justify-between my-[3px]">
          <span className="opacity-60">New Collections</span>
          <span className="font-medium">{formatNumberWithDecimals(mintCount)}</span>
        </div>
        {d.volume !== undefined && (
          <div className="flex justify-between my-[3px]">
            <span className="opacity-60">Volume</span>
            <span className="font-medium">✕{formatNumberWithDecimals(d.volume || 0)}</span>
          </div>
        )}
        <div className="flex justify-between my-[3px]">
          <span className="opacity-60">{d.totalItems !== undefined ? 'Items' : 'Sales'}</span>
          <span className="font-medium">{itemCount}</span>
        </div>
        {d.uniqueCollections !== undefined && (
          <div className="flex justify-between my-[3px]">
            <span className="opacity-60">Collections</span>
            <span className="font-medium">{d.uniqueCollections}</span>
          </div>
        )}
        {collections.length > 0 && (
          <>
            <div
              className={cn('my-[6px_0_4px] pt-1.5', 'border-t border-black/[0.06] dark:border-white/[0.08]')}
            >
              <span className="text-[10px] font-medium opacity-50 uppercase tracking-[0.03em]">
                {d.collectionsInvolved ? 'New Collections' : 'Top Collections'}
              </span>
            </div>
            {collections.slice(0, 3).map((col, i) => (
              <div
                key={`tooltip-col-${i}-${col.cid || col.slug}`}
                className="flex items-center justify-between my-[3px] text-[10px]"
              >
                <div className="flex items-center gap-[5px]">
                  <div
                    className={cn('w-[14px] h-[14px] min-w-[14px] min-h-[14px] rounded-[3px] overflow-hidden', 'bg-black/[0.04] dark:bg-white/5')}
                  >
                    <img
                      src={`https://s1.xrpl.to/collection/${col.logo || col.logoImage}`}
                      alt={col.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.parentElement.style.display = 'none';
                      }}
                    />
                  </div>
                  <span className="opacity-80 max-w-[80px] overflow-hidden text-ellipsis whitespace-nowrap">
                    {col.name}
                  </span>
                </div>
                <span className="font-medium">
                  {col.volume
                    ? `✕${formatNumberWithDecimals(col.volume)}`
                    : `${col.items || 0} items`}
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
        className="w-full h-[42px] -mt-[2px] relative"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <canvas
          ref={canvasRef}
          aria-label="Collection creation chart"
          className="w-full h-full block cursor-pointer"
        />
      </div>
      <TooltipPortal />
    </>
  );
};

// Tags Bar Components
const TagsContainer = forwardRef(({ className, children, ...p }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col gap-2 rounded-xl border-[1.5px] backdrop-blur-[12px] py-[10px] px-[14px] box-border',
      'max-sm:py-[6px] max-sm:px-2 max-sm:gap-[6px]',
      'border-black/[0.06] bg-white dark:border-white/[0.08] dark:bg-white/[0.02]',
      className
    )}
    {...p}
  >{children}</div>
));

const TagsRow = ({ className, children, ...p }) => (
  <div className={cn('flex items-center gap-[6px] w-full', className)} {...p}>{children}</div>
);

const TagsScrollArea = ({ className, children, ...p }) => (
  <div
    className={cn('flex items-center gap-[6px] overflow-x-auto flex-1 min-w-0 pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden', className)}
    style={{ WebkitOverflowScrolling: 'touch' }}
    {...p}
  >{children}</div>
);

const AllButtonWrapper = ({ className, children, ...p }) => (
  <div className={cn('shrink-0 ml-1', className)} {...p}>{children}</div>
);

const TagChip = ({ selected, className, children, ...p }) => (
  <button
    className={cn(
      'inline-flex items-center gap-[3px] px-2 rounded-[6px] border text-[0.68rem] cursor-pointer whitespace-nowrap h-6 shrink-0 transition-[background-color,border-color] duration-150',
      'outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
      selected
        ? 'border-blue-500/30 bg-blue-500/10 text-blue-500 font-medium hover:bg-blue-500/[0.15]'
        : 'border-black/[0.08] bg-black/[0.02] text-[#212B36]/70 font-normal hover:bg-black/[0.05] hover:text-[#212B36]/90 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/70 dark:hover:bg-white/[0.08] dark:hover:text-white/90',
      className
    )}
    {...p}
  >{children}</button>
);

const AllTagsButton = ({ className, children, ...p }) => (
  <button
    className={cn(
      'inline-flex items-center gap-1 px-2 border-[1.5px] rounded-[6px] text-blue-500 text-[0.68rem] font-medium cursor-pointer whitespace-nowrap h-6 shrink-0 ml-auto transition-[background-color,border-color,opacity] duration-150 hover:bg-blue-500/[0.15]',
      'outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
      'max-sm:text-[0.62rem] max-sm:h-[22px] max-sm:px-[6px] max-sm:gap-[2px]',
      'bg-blue-500/[0.05] border-blue-500/15 dark:bg-blue-500/[0.08] dark:border-blue-500/20',
      className
    )}
    {...p}
  >{children}</button>
);

const Row = ({ spaceBetween, className, children, ...p }) => (
  <div
    className={cn(
      'flex items-center gap-[6px] flex-row w-full relative overflow-y-visible',
      spaceBetween ? 'justify-between' : 'justify-start',
      'flex-wrap overflow-x-hidden',
      'max-sm:gap-[5px] max-sm:overflow-x-auto max-sm:flex-nowrap max-sm:pb-[2px] max-sm:[scrollbar-width:none] max-sm:[&::-webkit-scrollbar]:hidden',
      className
    )}
    {...p}
  >{children}</div>
);

const RowContent = ({ className, children, ...p }) => (
  <div
    className={cn(
      'flex items-center gap-1 flex-wrap flex-auto',
      'max-sm:gap-1 max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:mr-2 max-sm:[scrollbar-width:none] max-sm:[&::-webkit-scrollbar]:hidden',
      className
    )}
    style={{ WebkitOverflowScrolling: 'touch' }}
    {...p}
  >{children}</div>
);

const Stack = ({ className, children, ...p }) => (
  <div className={cn('flex flex-row gap-[6px] items-center shrink-0 relative z-[1] max-sm:gap-[3px] max-sm:touch-manipulation', className)} {...p}>{children}</div>
);

const SortSelector = ({ className, children, ...p }) => {
  const bgImage = typeof document !== "undefined" && document.documentElement.classList.contains('dark')
    ? `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.6)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`
    : `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgba(0,0,0,0.5)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`;
  return (
    <select
      className={cn(
        'rounded-lg border-[1.5px] text-xs font-medium cursor-pointer h-8 min-w-[70px] appearance-none transition-[background-color,border-color,opacity] duration-150',
        'hover:border-blue-500/50 focus:outline-none focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-[#137DFE]',
        'max-sm:text-[0.62rem] max-sm:h-[26px] max-sm:min-w-[48px] max-sm:pl-[6px] max-sm:pr-5',
        'border-black/[0.08] bg-white/90 text-black/70 [&_option]:bg-white [&_option]:text-[#1a1a1a] dark:border-white/10 dark:bg-black/40 dark:text-white/85 dark:[&_option]:bg-[#0a0a0a] dark:[&_option]:text-[#e5e5e5]',
        'hover:bg-blue-500/[0.05] dark:hover:bg-blue-500/10',
        className
      )}
      style={{
        padding: '0 28px 0 12px',
        backgroundImage: bgImage,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 10px center',
        backgroundSize: '12px'
      }}
      {...p}
    >{children}</select>
  );
};

const MarketplaceGroup = ({ className, children, ...p }) => (
  <div
    className={cn('st-lp-group inline-flex items-center gap-[2px] py-[3px] pl-2 pr-[6px] rounded-[6px] border ml-2', 'bg-black/[0.04] border-black/[0.1] dark:bg-white/[0.06] dark:border-white/[0.12]', className)}
    {...p}
  >{children}</div>
);

const MarketplaceLabel = ({ className, children, ...p }) => (
  <span
    className={cn('st-lp-label text-[0.6rem] font-semibold uppercase tracking-[0.05em] mr-1', 'text-black/60 dark:text-white/60', className)}
    {...p}
  >{children}</span>
);

const MarketplaceChip = ({ selected, className, children, ...p }) => (
  <button
    className={cn(
      'st-lp-chip inline-flex items-center px-[6px] border-none rounded text-[0.65rem] cursor-pointer whitespace-nowrap h-5 shrink-0 transition-[background-color,border-color,opacity] duration-150',
      'hover:bg-blue-500/10 hover:text-blue-500',
      'outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
      selected ? 'bg-blue-500/[0.15] text-blue-500 font-medium' : 'bg-transparent text-[#212B36]/60 font-normal dark:text-white/60',
      className
    )}
    {...p}
  >{children}</button>
);

const NFT_MARKETPLACES = [
  { id: 'xrp.cafe', name: 'xrp.cafe' },
  { id: 'Sologenic', name: 'Sologenic' },
  { id: 'xmart.art', name: 'xmart.art' },
  { id: 'onXRP', name: 'onXRP' },
  { id: 'OpulenceX', name: 'OpulenceX' },
  { id: 'XPMarket', name: 'XPMarket' },
  { id: 'xrpnft.com', name: 'xrpnft.com' }
];

const Drawer = ({ open, className, children, ...p }) => (
  <div className={cn('fixed inset-0 z-[1300]', open ? 'block' : 'hidden', className)} {...p}>{children}</div>
);

const DrawerBackdrop = ({ className, children, ...p }) => (
  <div className={cn('fixed inset-0 bg-black/60 backdrop-blur-[4px]', className)} {...p}>{children}</div>
);

const DrawerPaper = ({ className, children, ...p }) => (
  <div
    className={cn(
      'fixed bottom-0 left-0 right-0 max-h-[70dvh] pb-[env(safe-area-inset-bottom)] backdrop-blur-[24px] rounded-t-xl border-t overflow-hidden flex flex-col z-[1301]',
      'bg-white/[0.98] border-blue-200 shadow-[0_-25px_50px_-12px_rgba(191,219,254,0.5)] dark:bg-black/85 dark:border-blue-500/20 dark:shadow-[0_-25px_50px_-12px_rgba(59,130,246,0.1)]',
      className
    )}
    {...p}
  >{children}</div>
);

const DrawerHeader = ({ className, children, ...p }) => (
  <div className={cn('flex items-center justify-between p-4', className)} {...p}>{children}</div>
);

const DrawerTitle = ({ className, children, ...p }) => (
  <h2 className={cn('font-medium text-[15px] m-0', 'text-[#212B36] dark:text-white', className)} {...p}>{children}</h2>
);

const DrawerClose = ({ className, children, ...p }) => (
  <button
    className={cn(
      'w-8 h-8 border-[1.5px] rounded-lg bg-transparent cursor-pointer flex items-center justify-center transition-[background-color,border-color] duration-150',
      'hover:border-blue-400/50 hover:text-[#4285f4]',
      'outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
      'border-black/10 text-black/40 dark:border-white/10 dark:text-white/40',
      className
    )}
    {...p}
  >{children}</button>
);

const SearchBox = ({ className, children, ...p }) => (
  <div className={cn('py-3 px-4', className)} {...p}>{children}</div>
);

const SearchInputWrapper = ({ className, children, ...p }) => (
  <div
    className={cn(
      'flex items-center gap-3 h-10 px-4 rounded-xl border-[1.5px] transition-[border-color] duration-200',
      'border-black/[0.08] bg-white hover:border-blue-500/30 focus-within:border-blue-500/50 dark:border-blue-500/[0.08] dark:bg-white/[0.02] dark:hover:border-blue-500/20 dark:focus-within:border-blue-500/40',
      className
    )}
    {...p}
  >{children}</div>
);

const SearchIconWrapper = ({ className, children, ...p }) => (
  <div className={cn('flex items-center justify-center shrink-0', 'text-black/40 dark:text-white/40', className)} {...p}>{children}</div>
);

const SearchInput = ({ className, ...p }) => (
  <input
    className={cn(
      'flex-1 bg-transparent border-none outline-none text-sm font-[inherit] focus:outline-none',
      'text-[#212B36] placeholder:text-[#212B36]/40 dark:text-white dark:placeholder:text-white/50',
      className
    )}
    {...p}
  />
);

const TagsGrid = ({ className, children, ...p }) => (
  <div
    className={cn('p-4 flex flex-wrap gap-[10px] flex-1 overflow-y-auto content-start max-sm:p-3 max-sm:gap-2', className)}
    style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(59,130,246,0.15) transparent' }}
    {...p}
  >{children}</div>
);

const TagButton = ({ className, children, ...p }) => (
  <button
    className={cn(
      'inline-flex items-center justify-center py-1 px-3 border rounded-lg bg-transparent text-xs font-normal cursor-pointer font-[inherit] whitespace-nowrap h-7 shrink-0 transition-[background-color,border-color] duration-200',
      'hover:bg-blue-500/[0.08] hover:border-blue-500/30 hover:text-blue-500',
      'outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
      'max-sm:h-8 max-sm:py-1 max-sm:px-[14px] max-sm:text-[0.8rem]',
      'border-black/[0.08] text-[#212B36]/70 dark:border-white/[0.08] dark:text-white/70',
      className
    )}
    {...p}
  >{children}</button>
);

const EmptyState = ({ className, children, ...p }) => (
  <div
    className={cn('w-full text-center py-8 text-sm', 'text-[#212B36]/50 dark:text-white/50', className)}
    {...p}
  >{children}</div>
);

const formatNumberWithDecimals = (num) => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(0)}K`;
  return Math.round(num).toLocaleString('en-US');
};

// Discover panel helpers
const fmtFloor = (v) => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}K` : v > 0 ? fNumber(v) : '0';

const timeAgo = (ts) => {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
};

const DiscoverCollectionRow = ({ collection, idx, onBoost }) => {
  const name = normalizeCollectionName(collection.name);
  const logoUrl = collection.logoImage ? `https://s1.xrpl.to/nft-collection/${collection.logoImage}` : null;
  const change = collection.floor1dPercent || 0;
  const isUp = change >= 0;

  return (
    <Link
      href={`/nfts/${collection.slug}`}
      prefetch={false}
      className={cn(
        'flex items-center gap-[6px] py-[2px] px-[6px] no-underline transition-colors duration-150 rounded-md',
        'max-[600px]:py-[2px] max-[600px]:px-[4px] max-[600px]:gap-[4px]',
        'hover:bg-black/[0.02] dark:hover:bg-white/[0.04]'
      )}
    >
      <span className={cn('text-[10px] tabular-nums font-medium w-[14px] text-center flex-shrink-0 max-[600px]:hidden', 'text-black/25 dark:text-white/25')}>
        {idx + 1}
      </span>
      <div className="relative flex-shrink-0">
        <div className={cn('w-[20px] h-[20px] min-w-[20px] max-[600px]:w-[16px] max-[600px]:h-[16px] max-[600px]:min-w-[16px] rounded-md max-[600px]:rounded overflow-hidden flex items-center justify-center', 'bg-black/[0.04] dark:bg-white/[0.06]')}>
          {logoUrl ? (
            <img src={logoUrl} alt="" className="w-full h-full object-cover" loading="lazy" onError={(e) => { e.target.style.display = 'none'; }} />
          ) : (
            <span className="text-[9px] font-bold opacity-40">{name?.[0]}</span>
          )}
        </div>
        {(() => { const tier = TIER_CONFIG[collection.verified]; return tier ? (
          <div className={cn('absolute -bottom-[2px] -right-[2px] rounded-full p-[1px]', 'ring-[1px] ring-white dark:ring-[#0a0a0a]', tier.bg)} title={tier.label}>
            {tier.icon(6)}
          </div>
        ) : null; })()}
      </div>
      <span className={cn('text-[11px] max-[600px]:text-[10px] font-semibold truncate leading-none flex-1 min-w-0', 'text-[#1a1f2e] dark:text-white')}>{name}</span>
      <span className={cn('text-[9px] tabular-nums font-medium flex-shrink-0 ml-[4px] max-[600px]:ml-[1px] w-[40px] max-[600px]:w-[32px] text-right', 'text-black/30 dark:text-white/30')}>
        ✕{fmtFloor(collection.floor || 0)}
      </span>
      <span className={cn('text-[9px] tabular-nums font-medium flex-shrink-0 ml-[6px] max-[600px]:hidden w-[34px] text-right', 'text-black/25 dark:text-white/25')}>
        {timeAgo(collection.created)}
      </span>
      <span className="ml-[4px] max-[600px]:ml-[1px] w-[50px] max-[600px]:w-[40px] flex justify-end">
        <div className={cn(
          'text-[10px] max-[600px]:text-[8px] font-bold tabular-nums px-[6px] py-[3px] max-[600px]:px-[3px] max-[600px]:py-[1px] rounded-md max-[600px]:rounded leading-tight flex-shrink-0',
          isUp ? 'text-[#10b981] bg-[rgba(16,185,129,0.1)]' : 'text-[#ef4444] bg-[rgba(239,68,68,0.1)]'
        )}
        style={{ boxShadow: isUp ? '0 0 4px rgba(16,185,129,0.3)' : '0 0 4px rgba(239,68,68,0.3)' }}
        >
          {isUp ? '+' : ''}{change.toFixed(1)}%
        </div>
      </span>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBoost(collection); }}
        title="Boost"
        className={cn(
          'flex-shrink-0 ml-[4px] max-[600px]:ml-[1px] w-[20px] h-[20px] max-[600px]:w-[18px] max-[600px]:h-[18px] rounded-md flex items-center justify-center transition-colors duration-150 border-none cursor-pointer',
          'bg-black/[0.03] hover:bg-orange-500/10 text-black/20 hover:text-orange-500 hover:shadow-[0_0_6px_rgba(249,115,22,0.3)] dark:bg-white/[0.04] dark:hover:bg-orange-500/20 dark:text-white/25 dark:hover:text-orange-400 dark:hover:shadow-[0_0_6px_rgba(249,115,22,0.4)]'
        )}
      >
        <Flame size={10} />
      </button>
    </Link>
  );
};

const DiscoverPanel = ({ title, icon: Icon, href, collections, onBoost }) => {
  if (!collections || collections.length === 0) return null;
  const isTrending = title === 'Trending';
  return (
    <div className={cn(
      'rounded-xl max-[600px]:rounded-[10px] border-[1.5px] overflow-hidden flex flex-col backdrop-blur-md',
      'border-black/[0.06] bg-white dark:border-white/[0.08] dark:bg-white/[0.02]'
    )}>
      <div className={cn(
        'flex items-center justify-between px-[8px] py-[2px] max-[600px]:px-[6px] max-[600px]:py-[2px] relative',
      )}>
        <div className="flex items-center gap-[4px]">
          <Icon size={11} className={cn('max-[600px]:w-[10px] max-[600px]:h-[10px] animate-pulse', isTrending ? 'text-[#10b981]' : 'text-[#8b5cf6]')} />
          <span className={cn('text-[10px] max-[600px]:text-[9px] font-semibold font-mono uppercase tracking-wider', 'text-black/70 dark:text-white/70')}>
            {title}
          </span>
        </div>
        <Link href={href} prefetch={false} className="text-[9px] max-[600px]:text-[8px] text-[#137DFE] no-underline font-medium hover:underline">
          View All
        </Link>
        <div className={cn('absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent to-transparent', 'via-black/[0.05] dark:via-white/10')} />
      </div>
      <div className="flex-1 flex flex-col justify-evenly py-0">
        {collections.map((c, i) => (
          <DiscoverCollectionRow key={c.slug} collection={c} idx={i} onBoost={onBoost} />
        ))}
      </div>
    </div>
  );
};

function Collections({
  initialCollections,
  initialTotal,
  initialGlobalMetrics,
  collectionCreation,
  tags,
  trendingCollections: trendingProp = [],
  newCollections: newProp = []
}) {
  const router = useRouter();
  const [globalMetrics, setGlobalMetrics] = useState(initialGlobalMetrics);
  const [tagsDrawerOpen, setTagsDrawerOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState(router.query.tag || null);
  const [selectedOrigin, setSelectedOrigin] = useState(router.query.origin || null);
  const [activeView, setActiveView] = useState('all');
  const [copied, setCopied] = useState(false);
  const [rows, setRows] = useState(20);
  const [orderBy, setOrderBy] = useState('totalVol24h');
  const [order, setOrder] = useState('desc');
  const [sync, setSync] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [visibleTagCount, setVisibleTagCount] = useState(0);
  const tagsContainerRef = useRef(null);
  const trendingCollections = trendingProp;
  const newCollections = newProp;
  const [boostCollection, setBoostCollection] = useState(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 600);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate how many tags can fit (same heuristic as SearchToolbar)
  useEffect(() => {
    if (!tags || tags.length === 0) return;

    const calculateVisibleTags = () => {
      const containerWidth = tagsContainerRef.current?.offsetWidth || window.innerWidth;
      const mobile = window.innerWidth <= 600;
      const allTagsWidth = mobile ? 60 : 100;
      const availableWidth = containerWidth - allTagsWidth - 20;
      const avgTagWidth = mobile ? 60 : 90;
      const count = Math.floor(Math.max(availableWidth, 0) / avgTagWidth);
      setVisibleTagCount(Math.max(mobile ? 5 : 8, Math.min(count, tags.length)));
    };

    calculateVisibleTags();

    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(calculateVisibleTags, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, [tags]);

  // Sync selectedTag with URL query
  useEffect(() => {
    const urlTag = router.query.tag || null;
    if (urlTag !== selectedTag) {
      setSelectedTag(urlTag);
    }
  }, [router.query.tag]);

  // Helper to get tag name from tag object or string
  const getTagName = (t) => (typeof t === 'object' ? t.tag : t);

  const copyTags = () => {
    if (!tags) return;
    const text = tags.map((t) => `${getTagName(t)}: ${t.count || 0}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTagClick = (tag) => {
    const newTag = selectedTag === tag ? null : tag;
    setSelectedTag(newTag);
    setActiveView('all');
    setTagsDrawerOpen(false);
    router.push(newTag ? `/nfts?tag=${encodeURIComponent(newTag)}` : '/nfts', undefined, {
      shallow: true
    });
  };

  const handleViewClick = (view) => {
    if (activeView === view) {
      // Reset to default
      setActiveView('all');
      setOrderBy('totalVol24h');
      setOrder('desc');
      setSync((prev) => prev + 1);
    } else {
      setActiveView(view);
      // Map views to sort fields
      const viewSortMap = {
        new: { sortBy: 'created', order: 'desc' },
        trending: { sortBy: 'trendingScore', order: 'desc' },
        hot: { sortBy: 'sales24h', order: 'desc' },
        rising: { sortBy: 'floor1dPercent', order: 'desc' }
      };
      const config = viewSortMap[view];
      if (config) {
        setOrderBy(config.sortBy);
        setOrder(config.order);
        setSync((prev) => prev + 1);
      }
    }
  };

  const filteredTags = useMemo(() => {
    if (!tags) return [];
    if (!tagSearch.trim()) return tags;
    const term = tagSearch.toLowerCase();
    return tags.filter((t) => (t.tag || t).toLowerCase().includes(term));
  }, [tags, tagSearch]);

  return (
    <div
      className={cn(
        'flex-1 bg-transparent min-h-screen relative',
        isMobile ? 'pt-2 pb-4' : 'pt-4 pb-8'
      )}
    >
      {/* Tags Drawer */}
      {tagsDrawerOpen && (
        <Drawer open={tagsDrawerOpen}>
          <DrawerBackdrop onClick={() => setTagsDrawerOpen(false)} />
          <DrawerPaper role="dialog" aria-modal="true" aria-label="Categories">
            <DrawerHeader>
              <div className="flex items-center gap-4 flex-1">
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-blue-500 whitespace-nowrap">
                  Categories {tags?.length ? `(${tags.length})` : ''}
                </span>
                <div
                  className="flex-1 h-[14px]"
                  style={{
                    backgroundImage: typeof document !== "undefined" && document.documentElement.classList.contains('dark')
                      ? 'radial-gradient(circle, rgba(96,165,250,0.4) 1px, transparent 1px)'
                      : 'radial-gradient(circle, rgba(66,133,244,0.5) 1px, transparent 1px)',
                    backgroundSize: '8px 5px',
                    WebkitMaskImage: 'linear-gradient(90deg, black 0%, transparent 100%)',
                    maskImage: 'linear-gradient(90deg, black 0%, transparent 100%)'
                  }}
                />
              </div>
              <div className="flex gap-2">
                <DrawerClose onClick={copyTags} title="Copy all tags" aria-label="Copy all tags">
                  {copied ? <Check size={18} color="#10b981" /> : <Copy size={18} />}
                </DrawerClose>
                <DrawerClose onClick={() => setTagsDrawerOpen(false)} aria-label="Close categories drawer">
                  <X size={18} />
                </DrawerClose>
              </div>
            </DrawerHeader>
            <SearchBox>
              <SearchInputWrapper>
                <SearchIconWrapper>
                  <Search size={18} />
                </SearchIconWrapper>
                <SearchInput
                  type="search"
                  placeholder="Search categories..."
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                />
              </SearchInputWrapper>
            </SearchBox>
            <TagsGrid>
              {filteredTags.length > 0 ? (
                filteredTags.map((t) => {
                  const tagName = getTagName(t);
                  const count = typeof t === 'object' ? t.count : null;
                  return (
                    <TagButton
                      key={tagName}
                      onClick={() => handleTagClick(tagName)}
                      style={
                        selectedTag === tagName
                          ? {
                              borderColor: typeof document !== "undefined" && document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                              color: typeof document !== "undefined" && document.documentElement.classList.contains('dark') ? '#fff' : '#000',
                              background: typeof document !== "undefined" && document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
                            }
                          : {}
                      }
                    >
                      {tagName}
                      {count ? ` (${count})` : ''}
                    </TagButton>
                  );
                })
              ) : (
                <EmptyState>
                  {tagSearch ? 'No matching categories' : 'No categories available'}
                </EmptyState>
              )}
            </TagsGrid>
          </DrawerPaper>
        </Drawer>
      )}

      {/* Global Metrics Section */}
      <Container>
        {globalMetrics && (
          <Grid>
            {/* 24h Volume & Sales (combined) */}
            <MetricBox>
              <MetricTitle>24h Volume / Sales</MetricTitle>
              <div className="flex items-baseline gap-2">
                <MetricValue>
                  ✕{fVolume(globalMetrics.total24hVolume || 0)}
                </MetricValue>
                <MetricValue className="!text-[1rem] max-sm:!text-[0.8rem] opacity-50">
                  {formatNumberWithDecimals(globalMetrics.total24hSales || 0)}
                </MetricValue>
              </div>
              <div className="flex items-center gap-2">
                <PercentageChange isPositive={(globalMetrics.volumePct || 0) >= 0}>
                  {(globalMetrics.volumePct || 0) >= 0 ? '↑' : '↓'}
                  {Math.abs(globalMetrics.volumePct || 0).toFixed(1)}%
                </PercentageChange>
                <PercentageChange isPositive={(globalMetrics.salesPct || 0) >= 0}>
                  {(globalMetrics.salesPct || 0) >= 0 ? '↑' : '↓'}
                  {Math.abs(globalMetrics.salesPct || 0).toFixed(1)}%
                </PercentageChange>
              </div>
            </MetricBox>

            <MetricBox>
              <MetricTitle>Collections</MetricTitle>
              <MetricValue>
                {formatNumberWithDecimals(globalMetrics.totalCollections || 0)}
              </MetricValue>
              <VolumePercentage>
                {formatNumberWithDecimals(globalMetrics.activeCollections24h || 0)} active |{' '}
                {formatNumberWithDecimals(globalMetrics.total24hMints || 0)} mints
              </VolumePercentage>
            </MetricBox>

            <MetricBox>
              <MetricTitle>24h Fees</MetricTitle>
              <MetricValue>
                ✕
                {formatNumberWithDecimals(
                  (globalMetrics.total24hBrokerFees || 0) + (globalMetrics.total24hRoyalties || 0)
                )}
              </MetricValue>
              <VolumePercentage>
                ✕{formatNumberWithDecimals(globalMetrics.total24hRoyalties || 0)} royalties | ✕
                {formatNumberWithDecimals(globalMetrics.total24hBrokerFees || 0)} broker
              </VolumePercentage>
            </MetricBox>

            <MetricBox>
              <MetricTitle>Market</MetricTitle>
              {(() => {
                const sentiment = globalMetrics.sentimentScore || 50;
                const rsi = globalMetrics.marketRSI || 50;
                const getSentimentColor = (v) => v >= 55 ? '#10b981' : v >= 45 ? '#fbbf24' : '#ef4444';
                const getRsiColor = (v) => v >= 70 ? '#ef4444' : v <= 30 ? '#8b5cf6' : v >= 50 ? '#10b981' : '#fbbf24';
                const sentColor = getSentimentColor(sentiment);
                const rsiColor = getRsiColor(rsi);

                if (isMobile) {
                  return (
                    <div className="flex-1 flex items-end w-full gap-0 justify-evenly">
                      <div className="flex flex-col items-center gap-[3px]">
                        <div className="relative w-10 h-[22px]">
                          <div className="absolute w-10 h-[20px] rounded-t-[20px] opacity-20 bg-[#fbbf24]" />
                          <div className="absolute bottom-0 left-1/2 w-[2px] h-[17px] rounded-[1px] origin-bottom"
                            style={{ background: sentColor, transform: `translateX(-50%) rotate(${(sentiment - 50) * 1.8}deg)` }} />
                          <div className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-[6px] h-[6px] rounded-full" style={{ background: sentColor }} />
                        </div>
                        <div className="flex items-baseline gap-[2px]">
                          <span className="text-[0.85rem] font-semibold leading-none" style={{ color: sentColor }}>{sentiment}</span>
                          <span className={cn('text-[0.4rem]', 'text-black/50 dark:text-white/50')}>Sent</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-[3px]">
                        <div className="relative w-10 h-[22px]">
                          <div className="absolute w-10 h-[20px] rounded-t-[20px] opacity-20 bg-[#10b981]" />
                          <div className="absolute bottom-0 left-1/2 w-[2px] h-[17px] rounded-[1px] origin-bottom"
                            style={{ background: rsiColor, transform: `translateX(-50%) rotate(${(rsi - 50) * 1.8}deg)` }} />
                          <div className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-[6px] h-[6px] rounded-full" style={{ background: rsiColor }} />
                        </div>
                        <div className="flex items-baseline gap-[2px]">
                          <span className="text-[0.85rem] font-semibold leading-none" style={{ color: rsiColor }}>{rsi}</span>
                          <span className={cn('text-[0.4rem]', 'text-black/50 dark:text-white/50')}>RSI</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="flex-1 flex items-center w-full justify-evenly">
                    <div className="flex flex-col items-center gap-[8px]">
                      <div className="relative w-20 h-[42px]">
                        <div className="absolute opacity-20 bg-[#fbbf24] w-20 h-10 rounded-t-[40px]" />
                        <div className="absolute bottom-0 left-1/2 w-[2px] rounded-[1px] origin-bottom h-9"
                          style={{ background: sentColor, transform: `translateX(-50%) rotate(${(sentiment - 50) * 1.8}deg)` }} />
                        <div className="absolute -bottom-[2px] left-1/2 -translate-x-1/2 rounded-full w-[9px] h-[9px]" style={{ background: sentColor }} />
                      </div>
                      <div className="flex items-baseline gap-[4px]">
                        <span className="font-semibold leading-[1] text-[1.75rem]" style={{ color: sentColor }}>{sentiment}</span>
                        <span className={cn('text-[0.8rem]', 'text-black/60 dark:text-white/60')}>Sent</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-[8px]">
                      <div className="relative w-20 h-[42px]">
                        <div className="absolute opacity-20 bg-[#10b981] w-20 h-10 rounded-t-[40px]" />
                        <div className="absolute bottom-0 left-1/2 w-[2px] rounded-[1px] origin-bottom h-9"
                          style={{ background: rsiColor, transform: `translateX(-50%) rotate(${(rsi - 50) * 1.8}deg)` }} />
                        <div className="absolute -bottom-[2px] left-1/2 -translate-x-1/2 rounded-full w-[9px] h-[9px]" style={{ background: rsiColor }} />
                      </div>
                      <div className="flex items-baseline gap-[4px]">
                        <span className="font-semibold leading-[1] text-[1.75rem]" style={{ color: rsiColor }}>{rsi}</span>
                        <span className={cn('text-[0.8rem]', 'text-black/60 dark:text-white/60')}>RSI</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </MetricBox>

            {/* Trending & New Collections inline */}
            <DiscoverPanel title="Trending" icon={TrendingUp} href="/nfts?sort=trendingScore" collections={trendingCollections} onBoost={setBoostCollection} />
            <DiscoverPanel title="New Collections" icon={Sparkles} href="/nfts?sort=created" collections={newCollections} onBoost={setBoostCollection} />
          </Grid>
        )}
      </Container>

      {/* Tags Bar */}
      {tags && tags.length > 0 && (
        <Container>
          <TagsContainer ref={tagsContainerRef}>
            {/* Row 1: Categories + All button */}
            <TagsRow>
              <TagsScrollArea>
                {tags
                  .slice(0, visibleTagCount)
                  .filter((t) => getTagName(t) !== selectedTag)
                  .map((t) => {
                    const tagName = getTagName(t);
                    return (
                      <TagChip
                        key={tagName}
                        selected={selectedTag === tagName}
                        onClick={() => handleTagClick(tagName)}
                      >
                        <span>{tagName}</span>
                      </TagChip>
                    );
                  })}
              </TagsScrollArea>
              <AllButtonWrapper>
                <AllTagsButton onClick={() => setTagsDrawerOpen(true)}>
                  <span>All {tags.length > visibleTagCount ? `(${tags.length})` : ''}</span>
                </AllTagsButton>
              </AllButtonWrapper>
            </TagsRow>

            {/* Row 2: View chips + Marketplaces (left) | Sort + Rows + API (right) */}
            <Row spaceBetween>
              <RowContent>
                <TagChip
                  selected={activeView === 'all'}
                  onClick={() => { setActiveView('all'); setSelectedTag(null); setOrderBy('totalVol24h'); setOrder('desc'); setSync((prev) => prev + 1); }}
                >
                  Collections
                </TagChip>
                <TagChip
                  selected={activeView === 'new'}
                  onClick={() => handleViewClick('new')}
                >
                  <Clock size={13} />
                  <span>New</span>
                </TagChip>
                <TagChip
                  selected={activeView === 'trending'}
                  onClick={() => handleViewClick('trending')}
                >
                  <Flame size={13} />
                  <span>Trending</span>
                </TagChip>
                <TagChip
                  selected={activeView === 'hot'}
                  onClick={() => handleViewClick('hot')}
                >
                  <TrendingUp size={13} />
                  <span>Hot</span>
                </TagChip>
                <TagChip
                  selected={activeView === 'rising'}
                  onClick={() => handleViewClick('rising')}
                >
                  <Sparkles size={13} />
                  <span>Rising</span>
                </TagChip>

                {/* Marketplaces group */}
                <MarketplaceGroup>
                  <MarketplaceLabel>Marketplaces</MarketplaceLabel>
                  {NFT_MARKETPLACES.map((mp) => (
                    <MarketplaceChip
                      key={mp.id}
                      selected={selectedOrigin === mp.id}
                      onClick={() => setSelectedOrigin(selectedOrigin === mp.id ? null : mp.id)}
                    >
                      {mp.name}
                    </MarketplaceChip>
                  ))}
                </MarketplaceGroup>
              </RowContent>

              {/* Sort + Rows + API on the right */}
              <Stack className="ml-auto gap-[6px]">
                <SortSelector
                  value={orderBy}
                  onChange={(e) => {
                    setOrderBy(e.target.value);
                    setActiveView('all');
                    setSync((prev) => prev + 1);
                  }}
                  aria-label="Sort by"
                >
                  <option value="totalVol24h">{isMobile ? 'Volume 24h' : 'Volume 24h'}</option>
                  <option value="totalVolume">{isMobile ? 'Volume All' : 'Volume All'}</option>
                  <option value="trendingScore">Trending</option>
                  <option value="floor">Floor</option>
                  <option value="floor1dPercent">{isMobile ? 'Change 24h' : 'Change 24h'}</option>
                  <option value="marketcap.amount">{isMobile ? 'MCap' : 'Market Cap'}</option>
                  <option value="sales24h">{isMobile ? 'Sales 24h' : 'Sales 24h'}</option>
                  <option value="owners">Owners</option>
                  <option value="items">Supply</option>
                  <option value="created">Newest</option>
                </SortSelector>
                <SortSelector
                  value={rows}
                  onChange={(e) => setRows(parseInt(e.target.value))}
                  aria-label="Rows per page"
                >
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </SortSelector>
                <ApiButton />
              </Stack>
            </Row>
          </TagsContainer>
        </Container>
      )}

      {/* Table Section - aligned with metric boxes */}
      <Container>
        <div className="min-h-[50vh] relative z-[1]">
          <CollectionList
            type={CollectionListType.ALL}
            tag={selectedTag}
            origin={selectedOrigin}
            onGlobalMetrics={setGlobalMetrics}
            initialCollections={initialCollections}
            initialTotal={initialTotal}
            rows={rows}
            setRows={setRows}
            orderBy={orderBy}
            setOrderBy={setOrderBy}
            order={order}
            setOrder={setOrder}
            sync={sync}
            setSync={setSync}
          />
        </div>
      </Container>
      {boostCollection && (
        <BoostModal
          collection={boostCollection}
          onClose={() => setBoostCollection(null)}
          onSuccess={() => setBoostCollection(null)}
        />
      )}
    </div>
  );
}

export default React.memo(Collections);
