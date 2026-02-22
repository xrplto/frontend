import React, { useContext, useEffect, useState, useMemo, useRef } from 'react';
import api from 'src/utils/api';
import { ThemeContext, WalletContext } from 'src/context/AppContext';
import { fNumber, fCurrency5 } from 'src/utils/formatters';
import { normalizeCurrencyCode } from 'src/utils/parseUtils';
import { Wifi, WifiOff, BarChart3, X } from 'lucide-react';
import { cn } from 'src/utils/cn';
import { createPortal } from 'react-dom';

// Format price with compact notation for small values (matches TokenSummary)
const formatPrice = (price, precision = 6) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (numPrice == null || isNaN(numPrice) || !isFinite(numPrice) || numPrice === 0) return '0';

  if (numPrice < 0.01) {
    const str = numPrice.toFixed(15);
    const zeros = str.match(/0\.0*/)?.[0]?.length - 2 || 0;
    if (zeros >= 4) {
      const significant = str.replace(/^0\.0+/, '').replace(/0+$/, '');
      return { compact: true, zeros, significant: significant.slice(0, Math.max(precision - zeros, 2)) };
    }
    return numPrice.toFixed(precision).replace(/0+$/, '').replace(/\.$/, '');
  } else if (numPrice >= 1e6) {
    return `${(numPrice / 1e6).toFixed(1)}M`;
  } else if (numPrice >= 1e3) {
    return `${(numPrice / 1e3).toFixed(1)}K`;
  }
  return numPrice.toFixed(precision).replace(/0+$/, '').replace(/\.$/, '');
};

// Render price with compact subscript notation
const PriceDisplay = ({ price, type, precision }) => {
  const formatted = formatPrice(price, precision);
  if (formatted?.compact) {
    return (
      <Price type={type}>
        0.0<sub style={{ fontSize: '0.7em' }}>{formatted.zeros}</sub>{formatted.significant}
      </Price>
    );
  }
  return <Price type={type}>{formatted}</Price>;
};

// Inline price renderer for tooltips/spread
const renderInlinePrice = (price) => {
  const formatted = formatPrice(price);
  if (formatted?.compact) {
    return <>0.0<sub style={{ fontSize: '0.7em' }}>{formatted.zeros}</sub>{formatted.significant}</>;
  }
  return formatted;
};
import { BookOpen } from 'lucide-react';

const BASE_URL = 'https://api.xrpl.to/v1';
const fetchInFlight = new Map();

const Container = ({ className, children, isDark, ...p }) => (
  <div
    className={cn('overflow-hidden h-full min-h-[600px] flex flex-col', isDark ? 'bg-transparent' : 'bg-white', className)}
    {...p}
  >
    {children}
  </div>
);

const Header = ({ className, children, isDark, ...p }) => (
  <div
    className={cn(
      'flex justify-between items-center px-4 py-3 border-b',
      isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-black/[0.02] border-black/[0.06]',
      className
    )}
    {...p}
  >
    {children}
  </div>
);

const Title = ({ className, children, isDark, ...p }) => (
  <div
    className={cn('flex items-center gap-2 text-[13px] font-semibold tracking-wide', isDark ? 'text-white' : 'text-[#212B36]', className)}
    {...p}
  >
    {children}
  </div>
);

const Content = ({ className, children, ...p }) => (
  <div
    className={cn('grid flex-1 min-h-0 overflow-hidden', className)}
    style={{ gridTemplateRows: '1fr auto 1fr', ...p.style }}
    {...(({ style, ...rest }) => rest)(p)}
  >
    {children}
  </div>
);

const Side = React.forwardRef(({ className, children, type, ...p }, ref) => (
  <div
    ref={ref}
    className={cn('flex-1 min-h-0 overflow-y-auto', className)}
    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    {...p}
  >
    <style>{`.side-scroll::-webkit-scrollbar { width: 4px; } .side-scroll::-webkit-scrollbar-track { background: transparent; }`}</style>
    {children}
  </div>
));

const ColumnHeader = ({ className, children, isDark, ...p }) => (
  <div
    className={cn(
      'flex justify-between px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest sticky top-0 z-[2] border-b',
      isDark ? 'bg-[#010815] border-white/[0.06] text-white/60' : 'bg-[#fafafa] border-black/[0.06] text-black/60',
      className
    )}
    {...p}
  >
    {children}
  </div>
);

const Row = ({ className, children, type, isUserOrder, isHovered, isHighlighted, onClick, ...p }) => {
  const bg = isUserOrder
    ? (isHovered ? 'rgba(59, 130, 246, 0.18)' : 'rgba(59, 130, 246, 0.12)')
    : isHovered
      ? (type === 'ask' ? 'rgba(239, 68, 68, 0.10)' : 'rgba(34, 197, 94, 0.10)')
      : isHighlighted
        ? (type === 'ask' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(34, 197, 94, 0.05)')
        : 'transparent';

  return (
    <div
      className={cn(
        'flex justify-between items-center px-4 py-1.5 relative cursor-pointer text-xs transition-[opacity,transform,background-color,border-color] duration-200 border-l-2 font-mono',
        isUserOrder ? 'border-l-[#3b82f6]' : 'border-l-transparent',
        className
      )}
      style={{ background: bg }}
      onClick={onClick}
      {...p}
    >
      {children}
    </div>
  );
};

const DepthBar = ({ className, type, width, ...p }) => (
  <div
    className={cn(
      'absolute top-px bottom-px pointer-events-none w-full transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
      type === 'bid' ? 'left-0 origin-left' : 'right-0 origin-right',
      type === 'ask' ? 'bg-red-500/[0.12]' : 'bg-green-500/[0.12]',
      className
    )}
    style={{ transform: `scaleX(${(width || 0) / 100})` }}
    {...p}
  />
);

const Price = ({ className, children, type, ...p }) => (
  <span
    className={cn('relative z-[1] font-medium', type === 'ask' ? 'text-[#ff4d4f]' : 'text-[#2ecc71]', className)}
    {...p}
  >
    {children}
  </span>
);

const Amount = ({ className, children, isDark, ...p }) => (
  <span
    className={cn('relative z-[1] text-right flex-1 mr-6', isDark ? 'text-white/[0.85]' : 'text-black/[0.85]', className)}
    {...p}
  >
    {children}
  </span>
);

const Maker = ({ className, children, isDark, onClick, ...p }) => (
  <span
    className={cn('relative z-[1] cursor-pointer w-[50px] text-right text-[10px] transition-[background-color,border-color] duration-200 hover:text-[#3b82f6]', isDark ? 'text-white/60' : 'text-black/60', className)}
    onClick={onClick}
    {...p}
  >
    {children}
  </span>
);

const SpreadBar = ({ className, children, isDark, ...p }) => (
  <div
    className={cn(
      'flex justify-between items-center px-4 py-2.5 text-[11px] flex-shrink-0 backdrop-blur-[4px] border-y font-mono',
      isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-black/[0.04] border-black/[0.06]',
      className
    )}
    {...p}
  >
    {children}
  </div>
);

const LimitPriceLine = ({ className, ...p }) => (
  <div
    className={cn('relative h-0.5 mx-4 my-0.5', className)}
    style={{
      background: 'linear-gradient(90deg, transparent 0%, #3b82f6 10%, #3b82f6 90%, transparent 100%)'
    }}
    {...p}
  >
    <span
      className="absolute right-0 -top-2.5 text-[8px] font-semibold text-[#3b82f6] tracking-[0.5px]"
    >
      YOUR LIMIT
    </span>
  </div>
);

const OrderTooltip = ({ isDark, type, cumSum, avgPrice, cumXrp, pctFromBest, tokenName }) => (
  <div className={cn(
    'absolute left-1/2 -translate-x-1/2 rounded-[8px] px-[10px] py-[6px] text-[9px] whitespace-nowrap z-10 shadow-[0_4px_12px_rgba(0,0,0,0.3)] flex flex-col gap-[3px]',
    type === 'ask' ? '-top-[52px]' : 'top-full mt-1',
    isDark
      ? 'bg-black/95 border border-white/10'
      : 'bg-white/95 border border-black/10'
  )}>
    <div className="flex items-center gap-[6px]">
      <span className={cn(isDark ? 'text-white/55' : 'text-black/40')}>{'\u03A3'}</span>
      <span className={cn('font-semibold', type === 'ask' ? 'text-[#ef4444]' : 'text-[#22c55e]')}>{fNumber(cumSum)} {tokenName}</span>
      <span className={cn(isDark ? 'text-white/20' : 'text-black/20')}>{'\u00B7'}</span>
      <span className={cn(isDark ? 'text-white/55' : 'text-black/40')}>Avg</span>
      <span className={cn('font-medium', isDark ? 'text-white/80' : 'text-black/80')}>{renderInlinePrice(avgPrice)}</span>
    </div>
    <div className="flex items-center gap-[6px]">
      <span className={cn(isDark ? 'text-white/55' : 'text-black/40')}>Total</span>
      <span className={cn('font-semibold', isDark ? 'text-white/80' : 'text-black/80')}>{fNumber(cumXrp)} XRP</span>
      <span className={cn(isDark ? 'text-white/20' : 'text-black/20')}>{'\u00B7'}</span>
      <span className={cn(isDark ? 'text-white/55' : 'text-black/40')}>Depth</span>
      <span className={cn('font-semibold', pctFromBest > 5 ? 'text-[#f59e0b]' : isDark ? 'text-white/70' : 'text-black/70')}>
        {pctFromBest != null ? `${pctFromBest.toFixed(2)}%` : '\u2014'}
      </span>
    </div>
  </div>
);

const BearEmptyState = ({ isDark, message }) => (
  <div className={cn(
    'flex flex-col items-center justify-center px-[20px] py-[40px] m-[12px] rounded-[12px] gap-[12px]',
    isDark
      ? 'bg-white/[0.02] border-[1.5px] border-dashed border-white/[0.06] text-white/60'
      : 'bg-black/[0.02] border-[1.5px] border-dashed border-black/[0.06] text-black/60'
  )}>
    <BookOpen size={24} className="opacity-30" />
    <span className="text-[11px] font-medium tracking-[0.05em] uppercase text-center">
      {message}
    </span>
  </div>
);

const MIN_XRP_OPTIONS = [0, 10, 100, 1000, 10000];

const DepthChartModal = ({ bids, asks, isDark, onClose, userAccount }) => {
  const chartRef = useRef(null);
  const containerRef = useRef(null);
  const overlayRef = useRef(null);
  const seriesRef = useRef({ bid: null, ask: null });
  const [chartReady, setChartReady] = useState(false);
  const [minXrp, setMinXrp] = useState(0);

  // Build cumulative depth data from orders
  const buildDepthData = (bids, asks) => {
    const aggregate = (orders) => {
      const map = new Map();
      for (const o of orders) map.set(o.price, (map.get(o.price) || 0) + o.amount);
      return [...map.entries()].sort((a, b) => a[0] - b[0]);
    };
    const bidAgg = aggregate(bids);
    const bidData = [];
    let bidCum = 0;
    for (let i = bidAgg.length - 1; i >= 0; i--) bidCum += bidAgg[i][1];
    let bidRunning = bidCum;
    for (const [price, amt] of bidAgg) { bidData.push({ time: price, value: bidRunning }); bidRunning -= amt; }
    const askAgg = aggregate(asks);
    const askData = [];
    let askCum = 0;
    for (const [price, amt] of askAgg) { askCum += amt; askData.push({ time: price, value: askCum }); }
    return { bidData, askData };
  };

  // Create chart once (only on mount / theme change)
  useEffect(() => {
    if (!containerRef.current) return;

    (async () => {
      const { createChart, LineSeries } = await import('lightweight-charts');
      if (!containerRef.current) return;

      const chart = createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
        layout: {
          background: { type: 'solid', color: 'transparent' },
          textColor: isDark ? '#FFFFFF' : '#212B36',
          fontSize: 11,
          fontFamily: 'var(--font-sans)'
        },
        grid: {
          vertLines: { color: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)', style: 0 },
          horzLines: { color: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)', style: 0 }
        },
        crosshair: {
          mode: 0,
          vertLine: { color: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)', width: 1, style: 3, labelBackgroundColor: '#3b82f6' },
          horzLine: { color: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)', width: 1, style: 3, labelBackgroundColor: '#3b82f6' }
        },
        rightPriceScale: { borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)', scaleMargins: { top: 0.1, bottom: 0.1 } },
        timeScale: { borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)', timeVisible: false, tickMarkFormatter: (t) => t.toFixed(6), rightOffset: 15 },
        handleScroll: false,
        handleScale: false
      });
      chartRef.current = chart;

      const bidSeries = chart.addSeries(LineSeries, { color: '#22c55e', lineWidth: 2, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: true });
      const askSeries = chart.addSeries(LineSeries, { color: '#ef4444', lineWidth: 2, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: true });
      seriesRef.current = { bid: bidSeries, ask: askSeries };
      setChartReady(true);
    })();

    const handleResize = () => {
      if (chartRef.current && containerRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      setChartReady(false);
      if (overlayRef.current) { overlayRef.current.remove(); overlayRef.current = null; }
      seriesRef.current = { bid: null, ask: null };
      if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }
    };
  }, [isDark]);

  // Update series data when bids/asks change (no chart rebuild)
  useEffect(() => {
    const { bid: bidSeries, ask: askSeries } = seriesRef.current;
    if (!bidSeries || !askSeries || (!bids.length && !asks.length)) return;
    const { bidData, askData } = buildDepthData(bids, asks);
    bidSeries.setData(bidData);
    askSeries.setData(askData);
    chartRef.current?.timeScale().fitContent();
  }, [bids, asks]);

  // Separate effect for address labels — re-runs when minXrp, data, or chart readiness changes
  useEffect(() => {
    if (!chartReady) return;
    const chart = chartRef.current;
    const bidSeries = seriesRef.current.bid;
    const askSeries = seriesRef.current.ask;
    if (!chart || !bidSeries || !askSeries || (!bids.length && !asks.length) || !containerRef.current) return;

    const { bidData, askData } = buildDepthData(bids, asks);

    // Create or reuse overlay
    let overlay = overlayRef.current;
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:5';
      containerRef.current.style.position = 'relative';
      containerRef.current.appendChild(overlay);
      overlayRef.current = overlay;
    }

    const shortAddr = (acc) => userAccount && acc === userAccount ? 'YOU' : `${acc.slice(0, 4)}..${acc.slice(-3)}`;
    const fmtXrp = (v) => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(1)}K` : v.toFixed(0);

    // Deterministic color per address via hash — every address gets a unique hue
    const getAddrColor = (acc) => {
      let h = 0;
      for (let i = 0; i < acc.length; i++) h = ((h << 5) - h + acc.charCodeAt(i)) | 0;
      const hue = ((h % 360) + 360) % 360;
      const sat = 55 + (((h >>> 8) % 20));   // 55-74%
      const lit = 55 + (((h >>> 16) % 15));   // 55-69%
      return `hsl(${hue}, ${sat}%, ${lit}%)`;
    };

    const placeLabels = () => {
      overlay.innerHTML = '';
      const ts = chart.timeScale();
      const allOrders = [
        ...bids.map((b) => ({ ...b, side: 'bid', series: bidSeries })),
        ...asks.map((a) => ({ ...a, side: 'ask', series: askSeries }))
      ];

      const usedSlots = [];
      for (const o of allOrders) {
        const acc = o.account || o.Account;
        if (!acc) continue;
        const isYou = userAccount && acc === userAccount;
        const xrpValue = o.total && !isNaN(o.total) ? o.total : o.price * o.amount;
        if (!isYou && minXrp > 0 && xrpValue < minXrp) continue;

        const x = ts.timeToCoordinate(o.price);
        if (x === null || x < 0) continue;
        const sideData = o.side === 'bid' ? bidData : askData;
        let nearest = sideData[0];
        let minDist = Math.abs(o.price - nearest.time);
        for (const d of sideData) {
          const dist = Math.abs(o.price - d.time);
          if (dist < minDist) { minDist = dist; nearest = d; }
        }
        if (!nearest) continue;
        const y = o.series.priceToCoordinate(nearest.value);
        if (y === null || y < 0) continue;

        const tooClose = usedSlots.some((s) => Math.abs(s.x - x) < 60 && Math.abs(s.y - y) < 14);
        if (tooClose && !isYou) continue;
        usedSlots.push({ x, y });

        const color = isYou ? '#3b82f6' : getAddrColor(acc);
        const dot = document.createElement('div');
        dot.style.cssText = `position:absolute;width:${isYou ? 10 : 6}px;height:${isYou ? 10 : 6}px;border-radius:50%;background:${color};left:${x - (isYou ? 5 : 3)}px;top:${y - (isYou ? 5 : 3)}px;${isYou ? `box-shadow:0 0 8px ${color}` : ''}`;
        overlay.appendChild(dot);

        const label = document.createElement('div');
        label.style.cssText = `position:absolute;left:${x + 8}px;top:${y - 8}px;font-size:${isYou ? 10 : 9}px;font-family:var(--font-mono);white-space:nowrap;padding:1px 4px;border-radius:3px;font-weight:${isYou ? 700 : 500};color:${color};background:${isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.85)'}`;
        label.textContent = `${shortAddr(acc)} ${fmtXrp(xrpValue)} XRP`;
        overlay.appendChild(label);
      }
    };

    requestAnimationFrame(placeLabels);
    const unsub = chart.timeScale().subscribeVisibleLogicalRangeChange(placeLabels);

    return () => {
      unsub?.();
    };
  }, [bids, asks, isDark, userAccount, minXrp, chartReady]);

  useEffect(() => {
    const handleEsc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const totalBidVol = bids.reduce((s, b) => s + (b.total || b.price * b.amount), 0);
  const totalAskVol = asks.reduce((s, a) => s + (a.total || a.price * a.amount), 0);
  const bidPct = totalBidVol + totalAskVol > 0 ? (totalBidVol / (totalBidVol + totalAskVol)) * 100 : 50;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 max-sm:p-3 max-sm:h-dvh" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className={cn(
          'relative w-full max-w-[1200px] rounded-2xl border-[1.5px] overflow-hidden flex flex-col',
          isDark ? 'bg-[#000000] border-white/10' : 'bg-[#F8FAFD] border-black/10'
        )}
        style={{ height: 'min(80dvh, 720px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={cn(
          'flex items-center justify-between px-5 py-3.5 border-b flex-shrink-0',
          isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'
        )}>
          <div className="flex items-center gap-3">
            <BarChart3 size={16} className={isDark ? 'text-white/50' : 'text-black/50'} />
            <span className={cn('text-[13px] font-semibold tracking-wide', isDark ? 'text-white' : 'text-[#212B36]')}>
              Depth Chart
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn(
              'flex items-center rounded-lg p-[2px]',
              isDark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-black/[0.03] border border-black/[0.06]'
            )}>
              <span className={cn('text-[10px] font-medium px-2.5', isDark ? 'text-white/60' : 'text-black/60')}>Min XRP</span>
              {MIN_XRP_OPTIONS.map((v) => (
                <button
                  key={v}
                  onClick={() => setMinXrp(v)}
                  className={cn(
                    'h-[26px] px-2.5 rounded-md border-none cursor-pointer text-[10px] font-semibold transition-[opacity,transform,background-color,border-color]',
                    minXrp === v
                      ? 'bg-[#3b82f6] text-white'
                      : isDark ? 'text-white/55 hover:text-white hover:bg-white/10' : 'text-black/40 hover:text-black hover:bg-black/5'
                  )}
                >
                  {v === 0 ? 'All' : v >= 1000 ? `${v / 1000}K` : v}
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              aria-label="Close depth chart"
              className={cn(
                'p-1.5 rounded-lg transition-[background-color,border-color] ml-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
                isDark ? 'hover:bg-white/10 text-white/55' : 'hover:bg-black/5 text-black/40'
              )}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Chart */}
        <div ref={containerRef} className="flex-1 min-h-0" />

        {/* Footer */}
        <div className={cn(
          'flex items-center justify-between px-5 py-2.5 border-t flex-shrink-0',
          isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'
        )}>
          <div className="flex items-center gap-5 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
              <span className={isDark ? 'text-white/50' : 'text-black/50'}>Bids</span>
              <span className="text-[#22c55e] font-semibold font-mono ml-0.5">{fNumber(totalBidVol)} XRP</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
              <span className={isDark ? 'text-white/50' : 'text-black/50'}>Asks</span>
              <span className="text-[#ef4444] font-semibold font-mono ml-0.5">{fNumber(totalAskVol)} XRP</span>
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className={cn(
              'w-[120px] h-[6px] rounded-full overflow-hidden flex',
              isDark ? 'bg-white/[0.06]' : 'bg-black/[0.06]'
            )}>
              <div className="h-full bg-[#22c55e] rounded-l-full" style={{ width: `${bidPct}%` }} />
              <div className="h-full bg-[#ef4444] rounded-r-full" style={{ width: `${100 - bidPct}%` }} />
            </div>
            <span className={cn('text-[10px] font-mono font-medium', isDark ? 'text-white/55' : 'text-black/40')}>
              {bidPct.toFixed(0)}% / {(100 - bidPct).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

const OrderBook = ({ token, onPriceClick, limitPrice }) => {
  const { themeName } = useContext(ThemeContext);
  const { accountProfile } = useContext(WalletContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const userAccount = accountProfile?.account;

  const [bids, setBids] = useState([]);
  const [asks, setAsks] = useState([]);
  const asksSideRef = useRef(null);
  const [rlusdToken, setRlusdToken] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [showDepthChart, setShowDepthChart] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('orderbook_viewMode') || 'both';
    }
    return 'both';
  });

  // Persist viewMode to localStorage
  useEffect(() => {
    localStorage.setItem('orderbook_viewMode', viewMode);
  }, [viewMode]);
  const [precision, setPrecision] = useState(6);
  const [hoveredRow, setHoveredRow] = useState(null);
  const hasLoadedRef = useRef(false);
  const wsRef = useRef(null);

  // XRP is native asset - show RLUSD/XRP orderbook instead
  const isXRPToken = token?.currency === 'XRP';

  // Fetch RLUSD when viewing XRP
  useEffect(() => {
    if (!isXRPToken) return;
    let mounted = true;
    const rlusdKey = 'rlusd-token';

    if (fetchInFlight.has(rlusdKey)) {
      fetchInFlight
        .get(rlusdKey)
        .then((token) => mounted && token && setRlusdToken(token))
        .catch(err => { console.warn('[OrderBook] RLUSD fetch failed:', err.message); });
      return () => {
        mounted = false;
      };
    }

    const rlusdUrl = `${BASE_URL}/token/rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De-524C555344000000000000000000000000000000`;
    const promise = api
      .get(rlusdUrl)
      .then((res) => res.data?.token);
    fetchInFlight.set(rlusdKey, promise);

    promise
      .then((token) => {
        mounted && token && setRlusdToken(token);
        fetchInFlight.delete(rlusdKey);
      })
      .catch(err => { console.warn('[OrderBook] RLUSD token fetch failed:', err.message); fetchInFlight.delete(rlusdKey); });
    return () => {
      mounted = false;
    };
  }, [isXRPToken]);

  const effectiveToken = isXRPToken ? rlusdToken : token;
  const tokenMd5 = effectiveToken?.md5;

  // Ref to track last data hash for smart polling (skip updates when data unchanged)
  const lastDataHashRef = useRef(null);
  const mountedRef = useRef(true);

  // Process WebSocket orderbook data
  const processWsOrderbook = (rawBids, rawAsks) => {
    const parsedBids = (rawBids || [])
      .map((o) => ({
        price: parseFloat(o.price),
        amount: parseFloat(o.amount),
        total: parseFloat(o.total),
        account: o.account,
        funded: o.funded
      }))
      .filter((o) => !isNaN(o.price) && o.price > 0);

    const parsedAsks = (rawAsks || [])
      .map((o) => ({
        price: parseFloat(o.price),
        amount: parseFloat(o.amount),
        total: parseFloat(o.total),
        account: o.account,
        funded: o.funded
      }))
      .filter((o) => !isNaN(o.price) && o.price > 0);

    let bidSum = 0,
      askSum = 0;
    parsedBids.forEach((b) => {
      bidSum += b.amount;
      b.sumAmount = bidSum;
    });
    parsedAsks.forEach((a) => {
      askSum += a.amount;
      a.sumAmount = askSum;
    });

    hasLoadedRef.current = true;
    setBids(parsedBids.slice(0, 100));
    setAsks(parsedAsks.slice(0, 100));
  };

  // WebSocket for real-time orderbook updates
  useEffect(() => {
    if (!effectiveToken?.issuer || !effectiveToken?.currency || effectiveToken?.tokenType === 'mpt') {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
        setWsConnected(false);
      }
      return;
    }

    const params = new URLSearchParams({
      base_currency: 'XRP',
      quote_currency: effectiveToken.currency,
      quote_issuer: effectiveToken.issuer,
      limit: '100'
    });

    let unmounted = false;
    let reconnectTimeout = null;
    let retryCount = 0;

    const connect = async () => {
      if (unmounted) return;
      try {
        const { getSessionWsUrl } = await import('src/utils/wsToken');
        const wsUrl = await getSessionWsUrl('orderbook', null, Object.fromEntries(new URLSearchParams(params)));
        if (unmounted || !wsUrl) return;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => { setWsConnected(true); retryCount = 0; };
        ws.onclose = () => {
          if (!unmounted) {
            setWsConnected(false);
            if (retryCount < 5) {
              reconnectTimeout = setTimeout(() => { retryCount++; connect(); }, Math.min(3000 * Math.pow(2, retryCount), 60000));
            }
          }
        };
        ws.onerror = () => {};
        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'snapshot') {
              processWsOrderbook(msg.bids, msg.asks);
            } else if (msg.e === 'depth') {
              processWsOrderbook(msg.b, msg.a);
            }
          } catch {}
        };

        if (unmounted) { ws.close(); wsRef.current = null; }
      } catch {}
    };
    connect();

    return () => {
      unmounted = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) wsRef.current.close();
      wsRef.current = null;
      setWsConnected(false);
    };
  }, [effectiveToken?.issuer, effectiveToken?.currency]);

  // HTTP polling fallback (only when WebSocket not connected)
  useEffect(() => {
    mountedRef.current = true;
    // Don't fetch if no token or WebSocket is connected
    if (!tokenMd5 || !effectiveToken?.issuer || !effectiveToken?.currency || effectiveToken?.tokenType === 'mpt' || wsConnected) return;

    const pairKey = `ob2-${tokenMd5}`;

    async function fetchOrderbook(isUpdate = false) {
      if (!mountedRef.current) return;

      const params = new URLSearchParams({
        base_currency: 'XRP',
        quote_currency: effectiveToken.currency,
        limit: '100'
      });
      params.append('quote_issuer', effectiveToken.issuer);
      const url = `${BASE_URL}/orderbook?${params}`;

      // Reuse in-flight request (StrictMode protection) - only for initial load
      if (!isUpdate && fetchInFlight.has(pairKey)) {
        try {
          const data = await fetchInFlight.get(pairKey);
          if (mountedRef.current && data) {
            processOrderbookData(data);
          }
        } catch { }
        return;
      }

      // Create fetch promise
      const fetchPromise = api.get(url).then((r) => r.data);
      if (!isUpdate) {
        fetchInFlight.set(pairKey, fetchPromise);
      }

      try {
        const res = { data: await fetchPromise };

        if (!mountedRef.current) return;

        if (res.data?.success) {
          processOrderbookData(res.data);
        }
        fetchInFlight.delete(pairKey);
      } catch {
        fetchInFlight.delete(pairKey);
      }
    }

    function processOrderbookData(data) {
      const parsedBids = (data.bids || [])
        .map((o) => ({
          price: parseFloat(o.price),
          amount: parseFloat(o.amount),
          total: parseFloat(o.total),
          account: o.account,
          funded: o.funded
        }))
        .filter((o) => !isNaN(o.price) && o.price > 0);

      const parsedAsks = (data.asks || [])
        .map((o) => ({
          price: parseFloat(o.price),
          amount: parseFloat(o.amount),
          total: parseFloat(o.total),
          account: o.account,
          funded: o.funded
        }))
        .filter((o) => !isNaN(o.price) && o.price > 0);

      // Smart polling: compute simple hash to detect actual changes
      const newHash = `${parsedBids.length}-${parsedAsks.length}-${parsedBids[0]?.price || 0}-${parsedAsks[0]?.price || 0}`;
      if (newHash === lastDataHashRef.current) return;
      lastDataHashRef.current = newHash;

      let bidSum = 0,
        askSum = 0;
      parsedBids.forEach((b) => {
        bidSum += b.amount;
        b.sumAmount = bidSum;
      });
      parsedAsks.forEach((a) => {
        askSum += a.amount;
        a.sumAmount = askSum;
      });

      if (mountedRef.current) {
        hasLoadedRef.current = true;
        setBids(parsedBids.slice(0, 100));
        setAsks(parsedAsks.slice(0, 100));
      }
    }

    fetchOrderbook();

    // Visibility-aware polling to prevent memory leaks when tab is hidden
    let timer = null;
    let lastFetchTime = Date.now();
    const POLL_INTERVAL = 5000; // 5 second updates

    const startPolling = () => {
      if (timer) return;
      timer = setInterval(() => {
        if (mountedRef.current && document.visibilityState === 'visible') {
          const now = Date.now();
          if (now - lastFetchTime >= POLL_INTERVAL - 500) {
            lastFetchTime = now;
            fetchOrderbook(true);
          }
        }
      }, POLL_INTERVAL);
    };

    const stopPolling = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Refresh on tab focus
        if (mountedRef.current) {
          fetchOrderbook(true);
        }
        startPolling();
      } else {
        stopPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Only start polling if tab is visible
    if (document.visibilityState === 'visible') {
      startPolling();
    }

    return () => {
      mountedRef.current = false;
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      fetchInFlight.delete(pairKey);
      lastDataHashRef.current = null;
    };
  }, [tokenMd5, effectiveToken?.issuer, wsConnected]);

  const { bestBid, bestAsk, spreadPct } = useMemo(() => {
    const bb = bids.length ? bids[0].price : null;
    const ba = asks.length ? asks[0].price : null;
    const mid = bb != null && ba != null ? (bb + ba) / 2 : null;
    const spread = bb != null && ba != null && mid ? ((ba - bb) / mid) * 100 : null;
    return { bestBid: bb, bestAsk: ba, spreadPct: spread };
  }, [asks, bids]);

  // Aggregate orders by rounded price at current precision
  const aggregateOrders = (orders, prec) => {
    const map = new Map();
    for (const o of orders) {
      const key = o.price.toFixed(prec);
      if (map.has(key)) {
        const g = map.get(key);
        g.amount += o.amount;
        g.total += (o.total && !isNaN(o.total) ? o.total : o.price * o.amount);
        const acc = o.account || o.Account;
        if (acc && !g.accounts.has(acc)) g.accounts.add(acc);
        g.orders.push(o);
      } else {
        const acc = o.account || o.Account;
        const accounts = new Set();
        if (acc) accounts.add(acc);
        map.set(key, {
          price: o.price,
          amount: o.amount,
          total: o.total && !isNaN(o.total) ? o.total : o.price * o.amount,
          account: acc,
          accounts,
          orders: [o],
          funded: o.funded
        });
      }
    }
    const result = [...map.values()];
    let sum = 0;
    result.forEach((r) => { sum += r.amount; r.sumAmount = sum; });
    return result;
  };

  const groupedBids = useMemo(() => aggregateOrders(bids, precision), [bids, precision]);
  const groupedAsks = useMemo(() => aggregateOrders(asks, precision), [asks, precision]);

  // Depth bars use XRP value with sqrt scaling (industry standard)
  // Sqrt compresses whale orders while keeping small orders visible
  // P95 cap prevents a single mega-whale from squashing everything
  const getXrpValue = (o) => (o.total && !isNaN(o.total) ? o.total : o.price * o.amount) || 0;
  const getDepthWidth = (orders) => {
    if (!orders.length) return () => 0;
    const values = orders.map(getXrpValue).sort((a, b) => a - b);
    const p95 = values[Math.floor(values.length * 0.95)] || values[values.length - 1];
    const refMax = Math.max(p95, 1);
    return (value) => Math.min(Math.sqrt(Math.min(value, refMax * 2) / refMax) * 100, 100);
  };
  const bidBarWidth = getDepthWidth(groupedBids);
  const askBarWidth = getDepthWidth(groupedAsks);

  // Auto-scroll asks to bottom (so lowest ask is visible near spread)
  useEffect(() => {
    if (asksSideRef.current && groupedAsks.length > 0) {
      asksSideRef.current.scrollTop = asksSideRef.current.scrollHeight;
    }
  }, [groupedAsks]);

  const isMPT = token?.tokenType === 'mpt';

  if (isMPT) {
    return <BearEmptyState isDark={isDark} message="MPT tokens don't support orderbook yet" />;
  }

  if (!bids.length && !asks.length) {
    if (!hasLoadedRef.current) return <Container isDark={isDark} />;
    return <BearEmptyState isDark={isDark} message="No orderbook data" />;
  }

  const displayToken = effectiveToken || token;

  return (
    <Container isDark={isDark}>
      <Header isDark={isDark}>
        <Title isDark={isDark} />
        <div className="flex items-center gap-[10px]">
          <button
            onClick={() => setShowDepthChart(true)}
            className={cn(
              'h-[24px] w-[24px] flex items-center justify-center rounded-[6px] transition-[background-color,border-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
              isDark ? 'hover:bg-white/10 text-white/55 hover:text-white/80' : 'hover:bg-black/5 text-black/40 hover:text-black/80'
            )}
            aria-label="Depth Chart"
            title="Depth Chart"
          >
            <BarChart3 size={14} />
          </button>
          <div className={cn('flex rounded-[6px] p-[2px]', isDark ? 'bg-white/[0.05]' : 'bg-black/[0.05]')}>
            {[
              { id: 'both', label: 'Both' },
              { id: 'buy', label: 'Buy' },
              { id: 'sell', label: 'Sell' }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className="h-[24px] px-[8px] rounded-[4px] border-none cursor-pointer text-[10px] font-semibold transition-[opacity,transform,background-color,border-color] duration-200 flex items-center gap-[4px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]"
                style={{
                  background: viewMode === mode.id
                    ? (isDark ? 'rgba(255,255,255,0.1)' : '#fff')
                    : 'transparent',
                  color: viewMode === mode.id
                    ? (isDark ? '#fff' : '#000')
                    : (isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'),
                  boxShadow: viewMode === mode.id && !isDark ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                {mode.id === 'both' && (
                  <div className="flex flex-col gap-[1.5px]">
                    <div className="w-[8px] h-[2px] bg-[#ff4d4f] rounded-[1px]" />
                    <div className="w-[8px] h-[2px] bg-[#2ecc71] rounded-[1px]" />
                  </div>
                )}
                {mode.id === 'buy' && <div className="w-[8px] h-[6px] bg-[#2ecc71] rounded-[1px]" />}
                {mode.id === 'sell' && <div className="w-[8px] h-[6px] bg-[#ff4d4f] rounded-[1px]" />}
                {mode.label}
              </button>
            ))}
          </div>
          <select
            aria-label="Price decimal precision"
            value={precision}
            onChange={(e) => setPrecision(Number(e.target.value))}
            className={cn(
              'py-[4px] pl-[10px] pr-[24px] rounded-[6px] text-[10px] font-medium cursor-pointer outline-none appearance-none bg-no-repeat transition-[opacity,transform,background-color,border-color] duration-200 focus-visible:ring-2 focus-visible:ring-[#137DFE]',
              isDark
                ? 'bg-[#1a1f2e] text-white border border-white/10'
                : 'bg-[#f4f6f8] text-[#212B36] border border-black/10'
            )}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='${isDark ? '%23ffffff' : '%232c3e50'}' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundPosition: 'right 8px center'
            }}
          >
            <option value={2} className={cn(isDark ? 'bg-[#1a1f2e] text-white' : 'bg-white text-black')}>2 Decimals</option>
            <option value={4} className={cn(isDark ? 'bg-[#1a1f2e] text-white' : 'bg-white text-black')}>4 Decimals</option>
            <option value={6} className={cn(isDark ? 'bg-[#1a1f2e] text-white' : 'bg-white text-black')}>6 Decimals</option>
            <option value={8} className={cn(isDark ? 'bg-[#1a1f2e] text-white' : 'bg-white text-black')}>8 Decimals</option>
          </select>
        </div>
      </Header>

      <Content style={{ gridTemplateRows: viewMode === 'both' ? '1fr auto 1fr' : '1fr' }}>
        {/* Asks (Sell Orders) */}
        {(viewMode === 'both' || viewMode === 'sell') && (
          <Side ref={asksSideRef} type="asks">
            <ColumnHeader isDark={isDark}>
              <span className="text-[#ff4d4f]">Price (XRP)</span>
              <span>Size ({normalizeCurrencyCode(displayToken?.currency) || 'Token'})</span>
              <span>Maker</span>
            </ColumnHeader>
            {[...groupedAsks].reverse().map((ask, idx, arr) => {
              const accs = ask.accounts;
              const hasUser = userAccount && accs.has(userAccount);
              const makerCount = accs.size;
              const cumSum = arr.slice(idx).reduce((s, a) => s + a.amount, 0);
              const avgPrice = arr.slice(idx).reduce((s, a) => s + a.total, 0) / cumSum;
              const cumXrp = arr.slice(idx).reduce((s, a) => s + a.total, 0);
              const pctFromBest = bestAsk ? ((ask.price - bestAsk) / bestAsk) * 100 : null;
              const rowKey = `ask-${idx}`;
              const nextAsk = arr[idx + 1];
              const showLimitLine = limitPrice && nextAsk && ask.price > limitPrice && nextAsk.price <= limitPrice;
              const singleAcc = makerCount === 1 ? [...accs][0] : null;
              return (
                <React.Fragment key={idx}>
                  <Row
                    type="ask"
                    isUserOrder={hasUser}
                    isHovered={hoveredRow === rowKey}
                    isHighlighted={hoveredRow?.startsWith('ask-') && idx >= parseInt(hoveredRow.split('-')[1], 10) && hoveredRow !== rowKey}
                    onClick={() => onPriceClick?.(ask.price)}
                    onMouseEnter={() => setHoveredRow(rowKey)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <DepthBar type="ask" width={askBarWidth(getXrpValue(ask))} />
                    <PriceDisplay price={ask.price} type="ask" precision={precision} />
                    <Amount isDark={isDark}>{fNumber(ask.amount)}</Amount>
                    <Maker
                      isDark={isDark}
                      title={makerCount > 1 ? [...accs].join(', ') : (singleAcc || '')}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (singleAcc) window.open(`/address/${singleAcc}`, '_blank');
                      }}
                      style={hasUser ? { color: '#3b82f6', fontWeight: 600 } : {}}
                    >
                      {makerCount > 1 ? `${makerCount} makers` : hasUser ? 'YOU' : singleAcc ? `${singleAcc.slice(1, 5)}\u2026${singleAcc.slice(-2)}` : ''}
                    </Maker>
                    {hoveredRow === rowKey && (
                      <OrderTooltip isDark={isDark} type="ask" cumSum={cumSum} avgPrice={avgPrice} cumXrp={cumXrp} pctFromBest={pctFromBest} tokenName={normalizeCurrencyCode(displayToken?.currency) || 'Token'} />
                    )}
                  </Row>
                  {showLimitLine && <LimitPriceLine />}
                </React.Fragment>
              );
            })}
          </Side>
        )}

        {/* Spread indicator */}
        {viewMode === 'both' && (() => {
          const inSpread = limitPrice && bestBid != null && bestAsk != null && limitPrice > bestBid && limitPrice < bestAsk;
          const spreadSize = bestAsk && bestBid ? bestAsk - bestBid : 0;
          const positionPct = inSpread && spreadSize > 0 ? ((limitPrice - bestBid) / spreadSize) * 100 : 50;

          return inSpread ? (
            <div
              className={cn(
                'px-[16px] py-[8px]',
                isDark
                  ? 'bg-[rgba(59,130,246,0.08)] border-t border-b border-[rgba(59,130,246,0.2)]'
                  : 'bg-[rgba(59,130,246,0.06)] border-t border-b border-[rgba(59,130,246,0.15)]'
              )}
            >
              <div className="flex justify-between items-center mb-[6px]">
                <span className="text-[#2ecc71] text-[10px] font-mono">{renderInlinePrice(bestBid)}</span>
                <span className="text-[#3b82f6] text-[11px] font-bold tracking-[0.5px]">
                  YOUR LIMIT
                </span>
                <span className="text-[#ff4d4f] text-[10px] font-mono">{renderInlinePrice(bestAsk)}</span>
              </div>
              <div className={cn('relative h-[4px] rounded-[2px]', isDark ? 'bg-white/10' : 'bg-black/10')}>
                <div
                  className="absolute left-0 top-0 bottom-0 rounded-l-[2px]"
                  style={{
                    width: `${positionPct}%`,
                    background: 'linear-gradient(90deg, #22c55e, #3b82f6)'
                  }}
                />
                <div
                  className="absolute right-0 top-0 bottom-0 rounded-r-[2px]"
                  style={{
                    width: `${100 - positionPct}%`,
                    background: 'linear-gradient(90deg, #3b82f6, #ef4444)'
                  }}
                />
                <div
                  className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] rounded-full bg-[#3b82f6] border-2 border-white shadow-[0_0_6px_rgba(59,130,246,0.6)]"
                  style={{ left: `${positionPct}%` }}
                />
              </div>
              <div className="flex justify-center mt-[6px]">
                <span className="text-[#3b82f6] text-[12px] font-semibold font-mono">
                  {renderInlinePrice(limitPrice)}
                </span>
              </div>
            </div>
          ) : (
            <SpreadBar isDark={isDark}>
              <div className="flex items-center gap-[4px]">
                <span className={cn('text-[10px]', isDark ? 'text-white/60' : 'text-black/60')}>SPREAD</span>
                <span className={cn('font-semibold', isDark ? 'text-white' : 'text-black')}>
                  {spreadPct != null ? `${spreadPct.toFixed(3)}%` : '\u2014'}
                </span>
              </div>
              <div className="flex gap-[12px]">
                <span className="text-[#2ecc71]">{bestBid != null ? renderInlinePrice(bestBid) : '\u2014'}</span>
                <span className={cn(isDark ? 'text-white/10' : 'text-black/10')}>/</span>
                <span className="text-[#ff4d4f]">{bestAsk != null ? renderInlinePrice(bestAsk) : '\u2014'}</span>
              </div>
            </SpreadBar>
          );
        })()}

        {/* Bids (Buy Orders) */}
        {(viewMode === 'both' || viewMode === 'buy') && (
          <Side type="bids">
            <ColumnHeader isDark={isDark}>
              <span className="text-[#2ecc71]">Price (XRP)</span>
              <span>Size ({normalizeCurrencyCode(displayToken?.currency) || 'Token'})</span>
              <span>Maker</span>
            </ColumnHeader>
            {groupedBids.map((bid, idx) => {
              const accs = bid.accounts;
              const hasUser = userAccount && accs.has(userAccount);
              const makerCount = accs.size;
              const cumSum = groupedBids.slice(0, idx + 1).reduce((s, b) => s + b.amount, 0);
              const avgPrice = groupedBids.slice(0, idx + 1).reduce((s, b) => s + b.total, 0) / cumSum;
              const cumXrp = groupedBids.slice(0, idx + 1).reduce((s, b) => s + b.total, 0);
              const pctFromBest = bestBid ? ((bestBid - bid.price) / bestBid) * 100 : null;
              const rowKey = `bid-${idx}`;
              const nextBid = groupedBids[idx + 1];
              const showLimitLine = limitPrice && nextBid && bid.price > limitPrice && nextBid.price <= limitPrice;
              const singleAcc = makerCount === 1 ? [...accs][0] : null;
              return (
                <React.Fragment key={idx}>
                  <Row
                    type="bid"
                    isUserOrder={hasUser}
                    isHovered={hoveredRow === rowKey}
                    isHighlighted={hoveredRow?.startsWith('bid-') && idx <= parseInt(hoveredRow.split('-')[1], 10) && hoveredRow !== rowKey}
                    onClick={() => onPriceClick?.(bid.price)}
                    onMouseEnter={() => setHoveredRow(rowKey)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <DepthBar type="bid" width={bidBarWidth(getXrpValue(bid))} />
                    <PriceDisplay price={bid.price} type="bid" precision={precision} />
                    <Amount isDark={isDark}>{fNumber(bid.amount)}</Amount>
                    <Maker
                      isDark={isDark}
                      title={makerCount > 1 ? [...accs].join(', ') : (singleAcc || '')}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (singleAcc) window.open(`/address/${singleAcc}`, '_blank');
                      }}
                      style={hasUser ? { color: '#3b82f6', fontWeight: 600 } : {}}
                    >
                      {makerCount > 1 ? `${makerCount} makers` : hasUser ? 'YOU' : singleAcc ? `${singleAcc.slice(1, 5)}\u2026${singleAcc.slice(-2)}` : ''}
                    </Maker>
                    {hoveredRow === rowKey && (
                      <OrderTooltip isDark={isDark} type="bid" cumSum={cumSum} avgPrice={avgPrice} cumXrp={cumXrp} pctFromBest={pctFromBest} tokenName={normalizeCurrencyCode(displayToken?.currency) || 'Token'} />
                    )}
                  </Row>
                  {showLimitLine && <LimitPriceLine />}
                </React.Fragment>
              );
            })}
          </Side>
        )}
      </Content>
      {showDepthChart && (
        <DepthChartModal bids={bids} asks={asks} isDark={isDark} onClose={() => setShowDepthChart(false)} userAccount={userAccount} />
      )}
    </Container>
  );
};

export default OrderBook;
