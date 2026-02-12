import React, { useState, useContext, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import { useRouter } from 'next/router';
import CollectionList from './CollectionList';
import { cn } from 'src/utils/cn';
import { fVolume, fIntNumber, normalizeTag } from 'src/utils/formatters';
import { ThemeContext } from 'src/context/AppContext';
import { X, Search } from 'lucide-react';
import { ApiButton } from 'src/components/ApiEndpointsModal';

// Constants
const CollectionListType = {
  ALL: 'ALL',
  FEATURED: 'FEATURED',
  TRENDING: 'TRENDING'
};

// Styled Components - matching Summary.js
const Container = ({ className, children, ...p }) => (
  <div className={cn('relative z-[2] mb-3 w-full max-w-full bg-transparent overflow-visible max-sm:my-2 max-sm:p-0', className)} {...p}>{children}</div>
);

const Grid = ({ className, children, ...p }) => (
  <div
    className={cn(
      'grid grid-cols-[repeat(5,1fr)_1.5fr] gap-[10px] w-full',
      'max-[1400px]:grid-cols-3',
      'max-[900px]:grid-cols-3',
      'max-sm:flex max-sm:overflow-x-auto max-sm:gap-2 max-sm:pb-1 max-sm:[scrollbar-width:none] max-sm:[&::-webkit-scrollbar]:hidden',
      className
    )}
    style={{ WebkitOverflowScrolling: 'touch' }}
    {...p}
  >{children}</div>
);

const MetricBox = ({ isDark, className, children, ...p }) => (
  <div
    className={cn(
      'py-3 px-[14px] h-[82px] flex flex-col justify-between items-start rounded-xl bg-transparent border-[1.5px] transition-all duration-150',
      'max-sm:py-[10px] max-sm:px-3 max-sm:h-[68px] max-sm:flex-none max-sm:min-w-[95px]',
      isDark ? 'border-white/10 hover:border-white/[0.15] hover:bg-white/[0.02]' : 'border-black/[0.06] hover:border-black/10 hover:bg-black/[0.01]',
      className
    )}
    {...p}
  >{children}</div>
);

const MetricTitle = ({ isDark, className, children, ...p }) => (
  <span className={cn('text-[0.68rem] font-normal tracking-[0.02em] max-sm:text-[0.58rem]', isDark ? 'text-white/50' : 'text-[#212B36]/50', className)} {...p}>{children}</span>
);

const MetricValue = ({ isDark, className, children, ...p }) => (
  <span className={cn('text-xl font-semibold leading-none tracking-[-0.02em] whitespace-nowrap max-sm:text-[0.92rem]', isDark ? 'text-white' : 'text-[#212B36]', className)} {...p}>{children}</span>
);

const PercentageChange = ({ isPositive, className, children, ...p }) => (
  <span
    className={cn(
      'text-[0.68rem] inline-flex items-center gap-[2px] font-medium tracking-[-0.01em] px-1 py-px rounded max-sm:text-[0.58rem] max-sm:px-[3px]',
      isPositive ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10',
      className
    )}
    {...p}
  >{children}</span>
);

const VolumePercentage = ({ isDark, className, children, ...p }) => (
  <span className={cn('text-[0.58rem] font-normal max-sm:text-[0.5rem]', isDark ? 'text-white/45' : 'text-[#212B36]/45', className)} {...p}>{children}</span>
);

const ChartMetricBox = ({ isDark, className, children, ...p }) => (
  <MetricBox isDark={isDark} className={cn('col-span-1 overflow-visible max-[1400px]:col-span-3 max-[900px]:col-span-3 max-sm:!hidden', className)} {...p}>{children}</MetricBox>
);

const MobileChartBox = ({ isDark, className, children, ...p }) => (
  <MetricBox isDark={isDark} className={cn('hidden max-sm:!flex max-sm:mt-1', className)} {...p}>{children}</MetricBox>
);

// Volume Chart Component
const VolumeChart = ({ data, isDark }) => {
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
          isDark ? 'bg-[rgba(18,18,18,0.98)] text-white border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)]' : 'bg-[rgba(255,255,255,0.98)] text-black border border-black/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.12)]'
        )}
        style={{ left: tooltip.x + 15, top: tooltip.y - 80 }}
      >
        <div
          className={cn('text-xs font-medium mb-2 pb-1.5', isDark ? 'border-b border-white/[0.08]' : 'border-b border-black/[0.06]')}
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
          <span className="opacity-60">Avg Price</span>
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
          className="w-full h-full block cursor-pointer"
        />
      </div>
      <TooltipPortal />
    </>
  );
};

// Collection Creation Chart Component (similar to TokenChart in Summary.js)
const CollectionCreationChart = ({ data, isDark }) => {
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
          isDark ? 'bg-[rgba(18,18,18,0.98)] text-white border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)]' : 'bg-[rgba(255,255,255,0.98)] text-black border border-black/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.12)]'
        )}
        style={{ left: tooltip.x + 15, top: tooltip.y - 100 }}
      >
        <div
          className={cn('text-xs font-medium mb-2 pb-1.5', isDark ? 'border-b border-white/[0.08]' : 'border-b border-black/[0.06]')}
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
              className={cn('my-[6px_0_4px] pt-1.5', isDark ? 'border-t border-white/[0.08]' : 'border-t border-black/[0.06]')}
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
                    className={cn('w-[14px] h-[14px] min-w-[14px] min-h-[14px] rounded-[3px] overflow-hidden', isDark ? 'bg-white/5' : 'bg-black/[0.04]')}
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
          className="w-full h-full block cursor-pointer"
        />
      </div>
      <TooltipPortal />
    </>
  );
};

// Tags Bar Components
const TagsContainer = ({ isDark, className, children, ...p }) => (
  <div
    className={cn(
      'flex flex-col gap-2 rounded-xl border-[1.5px] backdrop-blur-[12px] py-[10px] px-[14px] relative box-border overflow-hidden',
      'before:content-[""] before:absolute before:-top-[60px] before:-right-[60px] before:w-[180px] before:h-[180px] before:rounded-full before:bg-[radial-gradient(circle,rgba(19,125,254,0.2)_0%,transparent_70%)] before:blur-[40px] before:pointer-events-none before:z-0',
      '[&>*]:relative [&>*]:z-[1]',
      'max-sm:py-[6px] max-sm:px-2 max-sm:gap-[6px]',
      isDark ? 'border-white/[0.08] bg-[rgba(10,10,10,0.5)]' : 'border-black/[0.06] bg-white/50',
      className
    )}
    {...p}
  >{children}</div>
);

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

const TagChip = ({ selected, isDark, className, children, ...p }) => (
  <button
    className={cn(
      'inline-flex items-center gap-[3px] px-2 rounded-[6px] border text-[0.68rem] cursor-pointer whitespace-nowrap h-6 shrink-0 transition-all duration-150',
      selected
        ? 'border-blue-500/30 bg-blue-500/10 text-blue-500 font-medium hover:bg-blue-500/[0.15]'
        : cn(
            isDark ? 'border-white/[0.08] bg-white/[0.04] text-white/70 font-normal hover:bg-white/[0.08] hover:text-white/90' : 'border-black/[0.08] bg-black/[0.02] text-[#212B36]/70 font-normal hover:bg-black/[0.05] hover:text-[#212B36]/90'
          ),
      className
    )}
    {...p}
  >{children}</button>
);

const AllTagsButton = ({ isDark, className, children, ...p }) => (
  <button
    className={cn(
      'inline-flex items-center gap-1 px-3 border-none rounded-2xl text-blue-500 text-[0.7rem] font-medium cursor-pointer whitespace-nowrap h-[26px] shrink-0 ml-auto transition-all duration-150 hover:bg-blue-500/20',
      'max-sm:text-[0.68rem] max-sm:h-6 max-sm:px-2 max-sm:gap-[3px]',
      isDark ? 'bg-blue-500/[0.15]' : 'bg-blue-500/10',
      className
    )}
    {...p}
  >{children}</button>
);

const Drawer = ({ open, className, children, ...p }) => (
  <div className={cn('fixed inset-0 z-[1300]', open ? 'block' : 'hidden', className)} {...p}>{children}</div>
);

const DrawerBackdrop = ({ className, children, ...p }) => (
  <div className={cn('fixed inset-0 bg-black/60 backdrop-blur-[4px]', className)} {...p}>{children}</div>
);

const DrawerPaper = ({ isDark, className, children, ...p }) => (
  <div
    className={cn(
      'fixed bottom-0 left-0 right-0 max-h-[70vh] backdrop-blur-[24px] rounded-t-xl border-t overflow-hidden flex flex-col z-[1301]',
      isDark ? 'bg-black/85 border-blue-500/20 shadow-[0_-25px_50px_-12px_rgba(59,130,246,0.1)]' : 'bg-white/[0.98] border-blue-200 shadow-[0_-25px_50px_-12px_rgba(191,219,254,0.5)]',
      className
    )}
    {...p}
  >{children}</div>
);

const DrawerHeader = ({ className, children, ...p }) => (
  <div className={cn('flex items-center justify-between p-4', className)} {...p}>{children}</div>
);

const DrawerTitle = ({ isDark, className, children, ...p }) => (
  <h2 className={cn('font-medium text-[15px] m-0', isDark ? 'text-white' : 'text-[#212B36]', className)} {...p}>{children}</h2>
);

const DrawerClose = ({ isDark, className, children, ...p }) => (
  <button
    className={cn(
      'w-8 h-8 border-[1.5px] rounded-lg bg-transparent cursor-pointer flex items-center justify-center transition-all duration-150',
      'hover:border-blue-400/50 hover:text-[#4285f4]',
      isDark ? 'border-white/10 text-white/40' : 'border-black/10 text-black/40',
      className
    )}
    {...p}
  >{children}</button>
);

const SearchBox = ({ className, children, ...p }) => (
  <div className={cn('py-3 px-4', className)} {...p}>{children}</div>
);

const SearchInputWrapper = ({ isDark, className, children, ...p }) => (
  <div
    className={cn(
      'flex items-center gap-3 h-10 px-4 rounded-xl border-[1.5px] transition-[border-color] duration-200',
      isDark
        ? 'border-blue-500/[0.08] bg-white/[0.02] hover:border-blue-500/20 focus-within:border-blue-500/40'
        : 'border-black/[0.08] bg-white hover:border-blue-500/30 focus-within:border-blue-500/50',
      className
    )}
    {...p}
  >{children}</div>
);

const SearchIconWrapper = ({ isDark, className, children, ...p }) => (
  <div className={cn('flex items-center justify-center shrink-0', isDark ? 'text-white/40' : 'text-black/40', className)} {...p}>{children}</div>
);

const SearchInput = ({ isDark, className, ...p }) => (
  <input
    className={cn(
      'flex-1 bg-transparent border-none outline-none text-sm font-[inherit] focus:outline-none',
      isDark ? 'text-white placeholder:text-white/50' : 'text-[#212B36] placeholder:text-[#212B36]/40',
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

const TagButton = ({ isDark, className, children, ...p }) => (
  <button
    className={cn(
      'inline-flex items-center justify-center py-1 px-3 border rounded-lg bg-transparent text-xs font-normal cursor-pointer font-[inherit] whitespace-nowrap h-7 shrink-0 transition-all duration-200',
      'hover:bg-blue-500/[0.08] hover:border-blue-500/30 hover:text-blue-500',
      'max-sm:h-8 max-sm:py-1 max-sm:px-[14px] max-sm:text-[0.8rem]',
      isDark ? 'border-white/[0.08] text-white/70' : 'border-black/[0.08] text-[#212B36]/70',
      className
    )}
    {...p}
  >{children}</button>
);

const EmptyState = ({ isDark, className, children, ...p }) => (
  <div
    className={cn('w-full text-center py-8 text-sm', isDark ? 'text-white/50' : 'text-[#212B36]/50', className)}
    {...p}
  >{children}</div>
);

const formatNumberWithDecimals = (num) => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(0)}K`;
  return Math.round(num).toLocaleString();
};

function Collections({
  initialCollections,
  initialTotal,
  initialGlobalMetrics,
  collectionCreation,
  tags
}) {
  const router = useRouter();
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [globalMetrics, setGlobalMetrics] = useState(initialGlobalMetrics);
  const [tagsDrawerOpen, setTagsDrawerOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState(router.query.tag || null);
  const [copied, setCopied] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 600;

  // Sync selectedTag with URL query
  useEffect(() => {
    const urlTag = router.query.tag || null;
    if (urlTag !== selectedTag) {
      setSelectedTag(urlTag);
    }
  }, [router.query.tag]);

  const visibleTagCount = isMobile ? 5 : 10;

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
    setTagsDrawerOpen(false);
    // Update URL without full page reload
    router.push(newTag ? `/nfts?tag=${encodeURIComponent(newTag)}` : '/nfts', undefined, {
      shallow: true
    });
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
          <DrawerPaper isDark={isDark}>
            <DrawerHeader>
              <div className="flex items-center gap-4 flex-1">
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-blue-500 whitespace-nowrap">
                  Categories {tags?.length ? `(${tags.length})` : ''}
                </span>
                <div
                  className="flex-1 h-[14px]"
                  style={{
                    backgroundImage: isDark
                      ? 'radial-gradient(circle, rgba(96,165,250,0.4) 1px, transparent 1px)'
                      : 'radial-gradient(circle, rgba(66,133,244,0.5) 1px, transparent 1px)',
                    backgroundSize: '8px 5px',
                    WebkitMaskImage: 'linear-gradient(90deg, black 0%, transparent 100%)',
                    maskImage: 'linear-gradient(90deg, black 0%, transparent 100%)'
                  }}
                />
              </div>
              <div className="flex gap-2">
                <DrawerClose isDark={isDark} onClick={copyTags} title="Copy all tags">
                  {copied ? <Check size={18} color="#10b981" /> : <Copy size={18} />}
                </DrawerClose>
                <DrawerClose isDark={isDark} onClick={() => setTagsDrawerOpen(false)}>
                  <X size={18} />
                </DrawerClose>
              </div>
            </DrawerHeader>
            <SearchBox isDark={isDark}>
              <SearchInputWrapper>
                <SearchIconWrapper isDark={isDark}>
                  <Search size={18} />
                </SearchIconWrapper>
                <SearchInput
                  type="search"
                  placeholder="Search categories..."
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  isDark={isDark}
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
                      isDark={isDark}
                      onClick={() => handleTagClick(tagName)}
                      style={
                        selectedTag === tagName
                          ? {
                              borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                              color: isDark ? '#fff' : '#000',
                              background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
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
                <EmptyState isDark={isDark}>
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
          <div className="w-full">
            <Grid>
              <MetricBox isDark={isDark}>
                <MetricTitle isDark={isDark}>24h Volume</MetricTitle>
                <MetricValue isDark={isDark}>
                  ✕{fVolume(globalMetrics.total24hVolume || 0)}
                </MetricValue>
                <PercentageChange isPositive={(globalMetrics.volumePct || 0) >= 0}>
                  {(globalMetrics.volumePct || 0) >= 0 ? '↑' : '↓'}
                  {Math.abs(globalMetrics.volumePct || 0).toFixed(1)}%
                </PercentageChange>
              </MetricBox>

              <MetricBox isDark={isDark}>
                <MetricTitle isDark={isDark}>24h Sales</MetricTitle>
                <MetricValue isDark={isDark}>
                  {formatNumberWithDecimals(globalMetrics.total24hSales || 0)}
                </MetricValue>
                <PercentageChange isPositive={(globalMetrics.salesPct || 0) >= 0}>
                  {(globalMetrics.salesPct || 0) >= 0 ? '↑' : '↓'}
                  {Math.abs(globalMetrics.salesPct || 0).toFixed(1)}%
                </PercentageChange>
              </MetricBox>

              <MetricBox isDark={isDark}>
                <MetricTitle isDark={isDark}>Collections</MetricTitle>
                <MetricValue isDark={isDark}>
                  {formatNumberWithDecimals(globalMetrics.totalCollections || 0)}
                </MetricValue>
                <VolumePercentage isDark={isDark}>
                  {formatNumberWithDecimals(globalMetrics.activeCollections24h || 0)} active |{' '}
                  {formatNumberWithDecimals(globalMetrics.total24hMints || 0)} mints
                </VolumePercentage>
              </MetricBox>

              <MetricBox isDark={isDark}>
                <MetricTitle isDark={isDark}>24h Fees</MetricTitle>
                <MetricValue isDark={isDark}>
                  ✕
                  {formatNumberWithDecimals(
                    (globalMetrics.total24hBrokerFees || 0) + (globalMetrics.total24hRoyalties || 0)
                  )}
                </MetricValue>
                <VolumePercentage isDark={isDark}>
                  ✕{formatNumberWithDecimals(globalMetrics.total24hRoyalties || 0)} royalties | ✕
                  {formatNumberWithDecimals(globalMetrics.total24hBrokerFees || 0)} broker
                </VolumePercentage>
              </MetricBox>

              <MetricBox isDark={isDark} style={{ minWidth: isMobile ? '130px' : '160px' }}>
                <MetricTitle isDark={isDark}>Market</MetricTitle>
                {(() => {
                  const sentiment = globalMetrics.sentimentScore || 50;
                  const rsi = globalMetrics.marketRSI || 50;

                  const getSentimentColor = (v) =>
                    v >= 55 ? '#10b981' : v >= 45 ? '#fbbf24' : '#ef4444';
                  const getRsiColor = (v) =>
                    v >= 70 ? '#ef4444' : v <= 30 ? '#8b5cf6' : v >= 50 ? '#10b981' : '#fbbf24';

                  const sentColor = getSentimentColor(sentiment);
                  const rsiColor = getRsiColor(rsi);

                  return (
                    <div className={cn('flex items-end', isMobile ? 'gap-4' : 'gap-6')}>
                      {/* Sentiment gauge */}
                      <div className="flex flex-col items-center gap-1">
                        <div className="relative w-9 h-5">
                          <div
                            className="absolute w-9 h-[18px] rounded-t-[18px] opacity-20"
                            style={{ background: 'conic-gradient(from 180deg, #ef4444 0deg, #fbbf24 90deg, #10b981 180deg)' }}
                          />
                          <div
                            className="absolute bottom-0 left-1/2 w-0.5 h-[14px] rounded-[1px] origin-bottom"
                            style={{
                              background: sentColor,
                              transform: `translateX(-50%) rotate(${(sentiment - 50) * 1.8}deg)`
                            }}
                          />
                          <div
                            className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                            style={{ background: sentColor }}
                          />
                        </div>
                        <div className="flex items-baseline gap-0.5">
                          <span
                            className="text-base font-semibold leading-none"
                            style={{ color: sentColor }}
                          >
                            {sentiment}
                          </span>
                          <span className={cn('text-[0.5rem]', isDark ? 'text-white/40' : 'text-black/40')}>
                            Sentiment
                          </span>
                        </div>
                      </div>

                      {/* RSI gauge */}
                      <div className="flex flex-col items-center gap-1">
                        <div className="relative w-9 h-5">
                          <div
                            className="absolute w-9 h-[18px] rounded-t-[18px] opacity-20"
                            style={{ background: 'conic-gradient(from 180deg, #8b5cf6 0deg, #10b981 90deg, #ef4444 180deg)' }}
                          />
                          <div
                            className="absolute bottom-0 left-1/2 w-0.5 h-[14px] rounded-[1px] origin-bottom"
                            style={{
                              background: rsiColor,
                              transform: `translateX(-50%) rotate(${(rsi - 50) * 1.8}deg)`
                            }}
                          />
                          <div
                            className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                            style={{ background: rsiColor }}
                          />
                        </div>
                        <div className="flex items-baseline gap-0.5">
                          <span
                            className="text-base font-semibold leading-none"
                            style={{ color: rsiColor }}
                          >
                            {rsi}
                          </span>
                          <span className={cn('text-[0.5rem]', isDark ? 'text-white/40' : 'text-black/40')}>
                            RSI
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </MetricBox>

              <ChartMetricBox isDark={isDark}>
                {(() => {
                  // Use collectionCreation prop, fallback to daily data
                  const creationData = collectionCreation?.length
                    ? collectionCreation
                    : globalMetrics.daily || [];
                  const chartData = creationData.slice(-30);
                  const todayData = chartData[chartData.length - 1] || {};
                  const yesterdayData = chartData[chartData.length - 2] || {};
                  // collectionCreation uses totalCollections, daily uses mints
                  const today = todayData.totalCollections ?? todayData.mints ?? 0;
                  const yesterday = yesterdayData.totalCollections ?? yesterdayData.mints ?? 0;
                  const isUp = today >= yesterday;
                  // collectionCreation uses collectionsInvolved, daily uses topCollections
                  const latestCollection = (todayData.collectionsInvolved ||
                    todayData.topCollections ||
                    [])[0];
                  return (
                    <>
                      <div className="flex items-center justify-between mb-0.5">
                        <MetricTitle isDark={isDark}>New Collections</MetricTitle>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn('text-[0.85rem] font-semibold', isDark ? 'text-white' : 'text-[#212B36]')}
                          >
                            {formatNumberWithDecimals(today)}
                          </span>
                          <span className={cn('text-[0.5rem]', isDark ? 'text-white/40' : 'text-black/40')}>
                            today
                          </span>
                          <span
                            className="text-[0.65rem]"
                            style={{ color: isUp ? '#10b981' : '#ef4444' }}
                          >
                            {isUp ? '↑' : '↓'}
                          </span>
                          {latestCollection && (
                            <a
                              href={`/nft/collection/${latestCollection.slug}`}
                              className={cn('text-[0.55rem] no-underline flex items-center gap-1 pl-1.5', isDark ? 'text-white/50 border-l border-white/10' : 'text-black/50 border-l border-black/10')}
                            >
                              <span className="max-w-[55px] overflow-hidden text-ellipsis whitespace-nowrap">
                                {latestCollection.name}
                              </span>
                              <span className="text-emerald-500 font-medium">
                                ✕
                                {formatNumberWithDecimals(
                                  latestCollection.volume || latestCollection.items || 0
                                )}
                              </span>
                            </a>
                          )}
                        </div>
                      </div>
                      <CollectionCreationChart data={chartData} isDark={isDark} />
                    </>
                  );
                })()}
              </ChartMetricBox>
            </Grid>

            <MobileChartBox isDark={isDark}>
              {(() => {
                const creationData = collectionCreation?.length
                  ? collectionCreation
                  : globalMetrics.daily || [];
                const chartData = creationData.slice(-30);
                const todayData = chartData[chartData.length - 1] || {};
                const yesterdayData = chartData[chartData.length - 2] || {};
                const today = todayData.totalCollections ?? todayData.mints ?? 0;
                const yesterday = yesterdayData.totalCollections ?? yesterdayData.mints ?? 0;
                const isUp = today >= yesterday;
                const latestCollection = (todayData.collectionsInvolved ||
                  todayData.topCollections ||
                  [])[0];
                return (
                  <>
                    <div className="flex items-center justify-between">
                      <MetricTitle isDark={isDark}>New Collections</MetricTitle>
                      <div className="flex items-center gap-1">
                        <span className={cn('text-[0.75rem] font-semibold', isDark ? 'text-white' : 'text-[#212B36]')}>
                          {formatNumberWithDecimals(today)}
                        </span>
                        <span className={cn('text-[0.45rem]', isDark ? 'text-white/40' : 'text-black/40')}>
                          today
                        </span>
                        <span className="text-[0.6rem]" style={{ color: isUp ? '#10b981' : '#ef4444' }}>
                          {isUp ? '↑' : '↓'}
                        </span>
                        {latestCollection && (
                          <a
                            href={`/nft/collection/${latestCollection.slug}`}
                            className={cn('text-[0.45rem] no-underline flex items-center gap-[3px] pl-1', isDark ? 'text-white/50 border-l border-white/10' : 'text-black/50 border-l border-black/10')}
                          >
                            <span className="max-w-[40px] overflow-hidden text-ellipsis whitespace-nowrap">
                              {latestCollection.name}
                            </span>
                            <span className="text-emerald-500 font-medium">
                              ✕
                              {formatNumberWithDecimals(
                                latestCollection.volume || latestCollection.items || 0
                              )}
                            </span>
                          </a>
                        )}
                      </div>
                    </div>
                    <CollectionCreationChart data={chartData} isDark={isDark} />
                  </>
                );
              })()}
            </MobileChartBox>
          </div>
        )}
      </Container>

      {/* Tags Bar */}
      {tags && tags.length > 0 && (
        <Container>
          <TagsContainer isDark={isDark}>
            <TagsRow>
              <TagsScrollArea>
                {/* All NFTs button - always visible */}
                <TagChip
                  isDark={isDark}
                  selected={!selectedTag}
                  onClick={() => setSelectedTag(null)}
                >
                  All NFTs
                </TagChip>
                {selectedTag && (
                  <TagChip isDark={isDark} selected onClick={() => setSelectedTag(null)}>
                    <span>{selectedTag}</span> <X size={12} />
                  </TagChip>
                )}
                {tags
                  .slice(0, selectedTag ? visibleTagCount - 2 : visibleTagCount - 1)
                  .filter((t) => getTagName(t) !== selectedTag)
                  .map((t) => {
                    const tagName = getTagName(t);
                    return (
                      <TagChip
                        key={tagName}
                        isDark={isDark}
                        onClick={() => handleTagClick(tagName)}
                      >
                        <span>{tagName}</span>
                      </TagChip>
                    );
                  })}
              </TagsScrollArea>
              <AllButtonWrapper>
                <div className="flex gap-1.5">
                  <ApiButton />
                  <AllTagsButton isDark={isDark} onClick={() => setTagsDrawerOpen(true)}>
                    <span>All {tags.length > visibleTagCount ? `(${tags.length})` : ''}</span>
                  </AllTagsButton>
                </div>
              </AllButtonWrapper>
            </TagsRow>
          </TagsContainer>
        </Container>
      )}

      {/* Table Section - aligned with metric boxes */}
      <Container>
        <div className="min-h-[50vh] relative z-[1]">
          <CollectionList
            type={CollectionListType.ALL}
            tag={selectedTag}
            onGlobalMetrics={setGlobalMetrics}
            initialCollections={initialCollections}
            initialTotal={initialTotal}
          />
        </div>
      </Container>
    </div>
  );
}

export default React.memo(Collections);
