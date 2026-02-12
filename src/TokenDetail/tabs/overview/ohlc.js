import { useState, useEffect, useRef, memo, useContext, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  TrendingUp,
  CandlestickChart,
  Users,
  Maximize,
  Minimize,
  Loader2,
  Droplets,
  Sparkles
} from 'lucide-react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  AreaSeries
} from 'lightweight-charts';
import api from 'src/utils/api';
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';
import { ThemeContext, AppContext } from 'src/context/AppContext';
import { cn } from 'src/utils/cn';

const SYMBOLS = { USD: '$', EUR: '\u20AC', JPY: '\u00A5', CNH: '\u00A5', XRP: '\u2715' };
const BASE_URL = 'https://api.xrpl.to/v1';
// WebSocket URLs fetched via session endpoint for auth

const processOhlc = (ohlc) => {
  const MAX = 90071992547409;
  return ohlc
    .filter((c) => c[1] < MAX && c[2] < MAX && c[3] < MAX && c[4] < MAX)
    .filter((c) => c[1] > 0 && c[4] > 0)
    .map((c) => ({
      time: Math.floor(c[0] / 1000),
      open: c[1] || 0,
      high: c[2] || 0,
      low: c[3] || 0,
      close: c[4] || 0,
      volume: c[5] || 0
    }))
    .sort((a, b) => a.time - b.time);
};

const formatMcap = (v) => {
  if (!v) return '0';
  if (v >= 1e12) return (v / 1e12).toFixed(2) + 'T';
  if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B';
  if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K';
  return v < 1 ? v.toFixed(2) : Math.round(v).toString();
};

const Card = ({ className, children, isDark, isMobile, isFullscreen, ...p }) => (
  <div
    className={cn(
      'w-full relative overflow-hidden flex flex-col',
      !isFullscreen && 'rounded-xl',
      className
    )}
    style={{
      padding: isFullscreen ? '16px 20px' : isMobile ? '12px' : '16px',
      background: isFullscreen
        ? (isDark ? '#06090e' : '#fff')
        : (isDark ? 'rgba(255,255,255,0.01)' : '#fff'),
      border: isFullscreen ? 'none' : `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
      ...(isFullscreen && { position: 'fixed', inset: 0, zIndex: 99999, borderRadius: 0 }),
      ...p.style
    }}
    {...(({ style, ...rest }) => rest)(p)}
  >
    {children}
  </div>
);

const ChartHeader = ({ className, children, ...p }) => (
  <div
    className={cn(
      'flex justify-between items-center mb-3 gap-3',
      'max-[900px]:flex-col max-[900px]:items-start',
      className
    )}
    {...p}
  >
    {children}
  </div>
);

const HeaderSection = ({ className, children, ...p }) => (
  <div className={cn('flex items-center gap-2 flex-wrap', className)} {...p}>
    {children}
  </div>
);

const ToolGroup = ({ className, children, isDark, ...p }) => (
  <div
    className={cn(
      'flex p-[3px] rounded-[10px] gap-[2px] border',
      isDark ? 'bg-white/[0.04] border-white/[0.06]' : 'bg-black/[0.03] border-black/[0.06]',
      className
    )}
    {...p}
  >
    {children}
  </div>
);

const ToolBtn = ({ className, children, isActive, isMobile, isDark, ...p }) => (
  <button
    className={cn(
      'flex items-center gap-[6px] font-semibold rounded-md border-none cursor-pointer transition-all duration-200',
      isMobile ? 'px-2 py-1 text-[10px]' : 'px-3 py-[6px] text-[11px]',
      isActive
        ? 'bg-[#3b82f6] text-white hover:bg-[#2563eb]'
        : cn(
            'bg-transparent',
            isDark ? 'text-white/50 hover:text-white hover:bg-white/[0.08]' : 'text-black/50 hover:text-black hover:bg-black/[0.05]'
          ),
      '[&_svg]:w-[14px] [&_svg]:h-[14px] [&_svg]:stroke-[2.5]',
      isActive ? '[&_svg]:opacity-100' : '[&_svg]:opacity-70',
      className
    )}
    {...p}
  >
    {children}
  </button>
);

const Spinner = ({ className, ...p }) => (
  <Loader2 className={cn('animate-spin', className)} {...p} />
);

const BearEmptyState = ({ isDark, message = 'No chart data' }) => (
  <div className={cn(
    'flex flex-col items-center justify-center py-12 px-6 w-full h-full gap-4 rounded-2xl border-[1.5px] border-dashed',
    isDark ? 'bg-white/[0.01] border-white/[0.06]' : 'bg-black/[0.01] border-black/[0.06]'
  )}>
    <div className="relative w-14 h-14 opacity-60">
      <div className={cn('absolute -top-1 left-0 w-[18px] h-[18px] rounded-full', isDark ? 'bg-white/15' : 'bg-[#d1d5db]')}>
        <div className={cn('absolute top-[3.5px] left-[3.5px] w-[11px] h-[11px] rounded-full', isDark ? 'bg-white/10' : 'bg-[#e5e7eb]')} />
      </div>
      <div className={cn('absolute -top-1 right-0 w-[18px] h-[18px] rounded-full', isDark ? 'bg-white/15' : 'bg-[#d1d5db]')}>
        <div className={cn('absolute top-[3.5px] right-[3.5px] w-[11px] h-[11px] rounded-full', isDark ? 'bg-white/10' : 'bg-[#e5e7eb]')} />
      </div>
      <div className={cn('absolute top-[7px] left-1/2 -translate-x-1/2 w-11 h-10 rounded-full overflow-hidden', isDark ? 'bg-white/15' : 'bg-[#d1d5db]')}>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className={cn('h-[2px] w-full', isDark ? 'bg-white/15' : 'bg-[#e5e7eb]')} style={{ marginTop: i * 3 + 2 }} />
        ))}
        <div className="absolute top-[11px] left-2 w-3 h-3">
          <div className={cn('absolute w-[10px] h-[2px] rotate-45 top-[5px]', isDark ? 'bg-white/40' : 'bg-[#6b7280]')} />
          <div className={cn('absolute w-[10px] h-[2px] -rotate-45 top-[5px]', isDark ? 'bg-white/40' : 'bg-[#6b7280]')} />
        </div>
        <div className="absolute top-[11px] right-2 w-3 h-3">
          <div className={cn('absolute w-[10px] h-[2px] rotate-45 top-[5px]', isDark ? 'bg-white/40' : 'bg-[#6b7280]')} />
          <div className={cn('absolute w-[10px] h-[2px] -rotate-45 top-[5px]', isDark ? 'bg-white/40' : 'bg-[#6b7280]')} />
        </div>
        <div className={cn('absolute bottom-[6px] left-1/2 -translate-x-1/2 w-5 h-[14px] rounded-full', isDark ? 'bg-white/10' : 'bg-[#e5e7eb]')}>
          <div className={cn('absolute top-[2px] left-1/2 -translate-x-1/2 w-[9px] h-[7px] rounded-full', isDark ? 'bg-white/25' : 'bg-[#9ca3af]')} />
        </div>
      </div>
    </div>
    <div className="text-center">
      <div className={cn('text-[13px] font-semibold mb-1', isDark ? 'text-white' : 'text-[#1a1a1a]')}>
        No chart data available
      </div>
      <div className={cn('text-[11px]', isDark ? 'text-white/40' : 'text-black/40')}>
        {message}
      </div>
    </div>
  </div>
);

const PriceChartAdvanced = memo(({ token }) => {
  const { themeName } = useContext(ThemeContext);
  const { activeFiatCurrency } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  // Refs
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRefs = useRef({
    candle: null,
    line: null,
    volume: null,
    xrpLine: null,
    tokenLine: null
  });
  const dataRef = useRef(null);
  const holderDataRef = useRef(null);
  const wsRef = useRef(null);
  const toolTipRef = useRef(null);
  const lastKeyRef = useRef(null);
  const lastChartTypeRef = useRef(null);
  const priceTimeRangeRef = useRef('5d'); // Remember timeRange for candles/line charts
  const refs = useRef({
    currency: activeFiatCurrency,
    chartType: 'candles',
    isZoomed: false,
    hasMore: true,
    isLoadingMore: false
  });

  // State
  const [isMobile, setIsMobile] = useState(false);
  const [chartType, setChartType] = useState('candles');
  const [timeRange, setTimeRange] = useState('5d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [holderData, setHolderData] = useState(null);
  const [liquidityData, setLiquidityData] = useState(null);
  const liquidityDataRef = useRef(null);
  const [isUserZoomed, setIsUserZoomed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Viewport check
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 600);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ATH data
  const athData = useMemo(() => {
    if (!token?.athMarketcap) return { percentDown: null, athMcap: null };
    const pct =
      token.athMarketcap > 0
        ? ((((token.marketcap || 0) - token.athMarketcap) / token.athMarketcap) * 100).toFixed(2)
        : 0;
    return { percentDown: pct, athMcap: token.athMarketcap };
  }, [token?.athMarketcap, token?.marketcap]);

  // Creator events - HTTP for initial load, WebSocket for live updates
  const [creatorEvents, setCreatorEvents] = useState([]);
  const creatorWsRef = useRef(null);
  const creatorColorsRef = useRef({ sell: '#ef4444', buy: '#22c55e', withdraw: '#f59e0b', deposit: '#8b5cf6', transfer_out: '#f97316', other_send: '#f97316', check_create: '#ec4899', check_cash: '#ec4899', check_receive: '#ec4899', receive: '#06b6d4', other_receive: '#06b6d4' });
  const mapCreatorEvent = useCallback((e) => ({
    time: e.t,
    type: (e.s || '').toUpperCase().replace('_', ' ').replace('OTHER ', ''),
    tokenAmount: e.a || 0,
    xrpAmount: e.x || 0,
    hash: e.h,
    color: creatorColorsRef.current[e.s] || '#9ca3af',
    currency: e.n || e.c || ''
  }), []);

  // Fetch initial creator events via REST (not affected by WS rate limits)
  useEffect(() => {
    if (!token?.md5) return;
    let mounted = true;
    api.get(`${BASE_URL}/creator-activity/${token.md5}?stream=true&limit=10`)
      .then((res) => {
        if (mounted && res.data?.length) {
          setCreatorEvents(res.data.map(mapCreatorEvent));
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [token?.md5, mapCreatorEvent]);

  // WebSocket for live creator event updates only
  useEffect(() => {
    if (!token?.md5) return;
    let mounted = true;
    let retryDelay = 3000;

    const connect = async () => {
      if (!mounted) return;
      try {
        const res = await fetch(`/api/ws/session?type=creator&id=${token.md5}`);
        const { wsUrl } = await res.json();
        if (!wsUrl || !mounted) return;

        const ws = new WebSocket(wsUrl);
        creatorWsRef.current = ws;
        ws.onopen = () => { retryDelay = 3000; };
        ws.onmessage = (e) => {
          if (!mounted) return;
          const msg = JSON.parse(e.data);
          if (msg.type === 'initial' && msg.events?.length) {
            // Fallback: use WS initial data only if HTTP fetch didn't populate
            setCreatorEvents((prev) => prev.length > 0 ? prev : msg.events.map(mapCreatorEvent));
          } else if (msg.type === 'activity') {
            setCreatorEvents((prev) => [mapCreatorEvent(msg), ...prev].slice(0, 10));
          }
        };
        ws.onerror = () => {};
        ws.onclose = (ev) => {
          if (!mounted || ev.code === 1000) return;
          // Retry all failures including 4011 (rate limit) with backoff
          retryDelay = Math.min(retryDelay * 1.5, 30000);
          setTimeout(connect, retryDelay);
        };
      } catch {
        if (mounted) {
          retryDelay = Math.min(retryDelay * 1.5, 30000);
          setTimeout(connect, retryDelay);
        }
      }
    };
    connect();
    return () => { mounted = false; creatorWsRef.current?.close(); };
  }, [token?.md5, mapCreatorEvent]);

  // Keep refs in sync
  useEffect(() => {
    refs.current = {
      currency: activeFiatCurrency,
      chartType,
      isZoomed: isUserZoomed,
      hasMore,
      isLoadingMore
    };
  }, [activeFiatCurrency, chartType, isUserZoomed, hasMore, isLoadingMore]);

  // Load more historical data
  const loadMoreData = useCallback(async () => {
    if (
      !token?.md5 ||
      refs.current.isLoadingMore ||
      !hasMore ||
      !dataRef.current?.length ||
      timeRange === 'all'
    )
      return;

    refs.current.isLoadingMore = true;
    setIsLoadingMore(true);

    // Must match the resolution used in initial fetch (presets)
    const resMap = {
      '1d': '1',
      '5d': '5',
      '1m': '30',
      '3m': '120',
      '1y': 'W',
      '5y': 'W',
      all: 'D'
    };
    try {
      const loadMoreUrl = `${BASE_URL}/ohlc/${token.md5}?resolution=${resMap[timeRange] || '15'}&cb=200&abn=${dataRef.current[0].time * 1000}&vs_currency=${activeFiatCurrency}`;
      const res = await api.get(loadMoreUrl);
      if (res.data?.ohlc?.length) {
        const older = processOhlc(res.data.ohlc);
        setData((prev) => {
          const map = new Map();
          older.forEach((d) => map.set(d.time, d));
          (prev || []).forEach((d) => map.set(d.time, d));
          const merged = Array.from(map.values()).sort((a, b) => a.time - b.time);
          dataRef.current = merged;
          return merged;
        });
        setHasMore(res.data.ohlc.length >= 100);
      } else {
        setHasMore(false);
      }
    } catch (e) {
      if (!api.isCancel(e)) setHasMore(false);
    } finally {
      refs.current.isLoadingMore = false;
      setIsLoadingMore(false);
    }
  }, [token?.md5, timeRange, activeFiatCurrency, hasMore]);

  const getWsInterval = (range) =>
    ({ '1d': '1m', '5d': '5m', '1m': '30m', '3m': '2h', '1y': '1w', '5y': '1w', all: '1d' })[
    range
    ] || '5m';

  // Fetch OHLC data + WebSocket
  useEffect(() => {
    if (!token?.md5) return;
    let mounted = true;
    let pingInterval = null;

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const presets = {
      '1d': { res: '1', cb: 1440 },
      '5d': { res: '5', cb: 1440 },
      '1m': { res: '30', cb: 1440 },
      '3m': { res: '120', cb: 1080 },
      '1y': { res: 'W', cb: 52 },
      '5y': { res: 'W', cb: 260 },
      all: { res: 'D', cb: 2000 }
    };

    const fetchData = async () => {
      const p = presets[timeRange];
      if (!p) return;
      setLoading(true);
      try {
        const ohlcUrl = `${BASE_URL}/ohlc/${token.md5}?resolution=${p.res}&cb=${p.cb}&vs_currency=${activeFiatCurrency}`;
        const res = await api.get(ohlcUrl);
        if (mounted && res.data?.ohlc) {
          const processed = processOhlc(res.data.ohlc);
          dataRef.current = processed;
          setData(processed);
          setLastUpdate(new Date());
          setHasMore(timeRange !== 'all');
        }
      } catch {
        // Fetch error
      }
      if (mounted) setLoading(false);
    };

    const connectWs = async () => {
      if (!mounted) return;
      try {
        const params = `interval=${getWsInterval(timeRange)}&vs_currency=${activeFiatCurrency}`;
        const res = await fetch(`/api/ws/session?type=ohlc&id=${token.md5}&${params}`);
        const { wsUrl } = await res.json();
        if (!mounted) return;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          pingInterval = setInterval(() => ws.readyState === 1 && ws.send('{"type":"ping"}'), 30000);
        };

        ws.onmessage = (e) => {
          if (!mounted) return;
          const msg = JSON.parse(e.data);
          if (msg.ohlc) return;

          if (msg.e === 'kline' && msg.k && !refs.current.isZoomed) {
            const k = msg.k;
            if (+k.o === 0 || +k.c === 0) return;

            const candleTime = Math.floor(k.t / 1000);
            const candle = {
              time: candleTime,
              open: +k.o,
              high: +k.h,
              low: +k.l,
              close: +k.c,
              volume: +k.v || 0
            };

            if (dataRef.current?.length) {
              const last = dataRef.current[dataRef.current.length - 1];
              if (candleTime >= last.time) {
                // Update master ref
                if (candleTime === last.time) {
                  dataRef.current[dataRef.current.length - 1] = candle;
                } else {
                  dataRef.current.push(candle);
                }

                // Immediate chart update
                const series = seriesRefs.current;
                if (series.candle && refs.current.chartType === 'candles') {
                  series.candle.update(candle);
                } else if (series.line && refs.current.chartType === 'line') {
                  series.line.update({ time: candle.time, value: candle.close });
                }
                if (series.volume) {
                  series.volume.update({
                    time: candle.time,
                    value: candle.volume,
                    color: candle.close >= candle.open ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'
                  });
                }

                // Sync React state to prevent useEffect from overwriting with old data
                setData([...dataRef.current]);
                setLastUpdate(new Date());
              }
            }
          }
        };

        ws.onclose = (ev) => {
          clearInterval(pingInterval);
          if (mounted && ev.code !== 1000 && ev.code !== 4011) setTimeout(connectWs, 3000);
        };
      } catch {
        if (mounted) setTimeout(connectWs, 3000);
      }
    };

    fetchData().then(() => mounted && connectWs());

    return () => {
      mounted = false;
      clearInterval(pingInterval);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [token.md5, timeRange, activeFiatCurrency]);

  // Fetch holder data
  useEffect(() => {
    if (!token?.md5 || chartType !== 'holders') return;
    let mounted = true;
    const ctrl = new AbortController();

    setLoading(true);
    const holdersUrl = `${BASE_URL}/holders/graph/${token.md5}?range=ALL`;
    api
      .get(holdersUrl, { signal: ctrl.signal })
      .then((res) => {
        if (!mounted || !res.data?.history?.length) return;
        const processed = res.data.history
          .map((h) => ({
            time: Math.floor(h.time / 1000),
            value: h.length || 0,
            holders: h.length || 0,
            top10: h.top10 || 0,
            top20: h.top20 || 0,
            top50: h.top50 || 0
          }))
          .sort((a, b) => a.time - b.time)
          .filter((h, i, arr) => i === arr.length - 1 || h.time !== arr[i + 1].time);
        holderDataRef.current = processed;
        setHolderData(processed);
      })
      .catch(() => {})
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
      ctrl.abort();
    };
  }, [token.md5, chartType]);

  // Fetch liquidity data
  useEffect(() => {
    if (!token?.md5 || chartType !== 'liquidity') return;
    let mounted = true;
    const ctrl = new AbortController();
    const periodMap = {
      '1d': '1d',
      '5d': '5d',
      '1m': '1m',
      '3m': '3m',
      '1y': '1y',
      '5y': '5y',
      all: 'all'
    };

    setLoading(true);
    const liquidityUrl = `${BASE_URL}/amm/liquidity-chart?md5=${token.md5}&period=${periodMap[timeRange] || '3m'}`;
    api
      .get(liquidityUrl, { signal: ctrl.signal })
      .then((res) => {
        if (!mounted || !res.data?.data?.length) return;
        const mapped = res.data.data.map((d) => ({
          time: Math.floor(new Date(d.date).getTime() / 1000),
          xrpLiquidity: d.xrpLiquidity || 0,
          tokenLiquidity: d.tokenLiquidity || 0,
          tvl: d.tvl || 0,
          volume: d.volume || 0,
          fees: d.fees || 0,
          apr: d.apr || 0,
          poolCount: d.poolCount || 0
        }));
        // Dedupe: keep entry with highest xrpLiquidity per timestamp
        const deduped = new Map();
        mapped.forEach((d) => {
          const existing = deduped.get(d.time);
          if (!existing || d.xrpLiquidity > existing.xrpLiquidity) deduped.set(d.time, d);
        });
        const processed = Array.from(deduped.values()).sort((a, b) => a.time - b.time);
        liquidityDataRef.current = processed;
        setLiquidityData(processed);
      })
      .catch(() => {})
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
      ctrl.abort();
    };
  }, [token.md5, chartType, timeRange]);

  const hasData =
    chartType === 'holders'
      ? holderData?.length > 0
      : chartType === 'liquidity'
        ? liquidityData?.length > 0
        : data?.length > 0;

  // Create chart
  useEffect(() => {
    if (!chartContainerRef.current || !hasData) return;
    if (lastChartTypeRef.current === chartType && chartRef.current) return;

    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch { }
      chartRef.current = null;
      seriesRefs.current = {
        candle: null,
        line: null,
        volume: null,
        xrpLine: null,
        tokenLine: null
      };
    }

    lastChartTypeRef.current = chartType;
    lastKeyRef.current = null;

    const containerHeight = chartContainerRef.current.clientHeight || (isMobile ? 420 : 650);
    const containerWidth = chartContainerRef.current.clientWidth || 600;
    const chart = createChart(chartContainerRef.current, {
      width: containerWidth,
      height: containerHeight,
      layout: {
        background: {
          type: 'solid',
          color: 'transparent'
        },
        textColor: isDark ? '#FFFFFF' : '#212B36',
        fontSize: isMobile ? 9 : 11,
        fontFamily: 'var(--font-sans)'
      },
      grid: {
        vertLines: {
          color: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
          style: 0
        },
        horzLines: {
          color: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
          style: 0
        }
      },
      crosshair: {
        mode: 0,
        vertLine: {
          color: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)',
          width: 1,
          style: 3,
          labelBackgroundColor: '#3b82f6'
        },
        horzLine: {
          color: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)',
          width: 1,
          style: 3,
          labelBackgroundColor: '#3b82f6'
        }
      },
      rightPriceScale: {
        borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
        scaleMargins: { top: 0.05, bottom: 0.25 },
        mode: 1,
        autoScale: true,
        borderVisible: !isMobile,
        visible: true,
        entireTextOnly: isMobile,
        drawTicks: !isMobile,
        ticksVisible: !isMobile,
        alignLabels: true,
        textColor: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
        minimumWidth: isMobile ? 40 : 60
      },
      localization: {
        priceFormatter: (price) => {
          if (chartType === 'holders' || chartType === 'liquidity') {
            if (price < 1000) return chartType === 'liquidity' ? price.toFixed(isMobile ? 1 : 2) : Math.round(price).toString();
            if (price < 1e6) return (price / 1e3).toFixed(1) + 'K';
            return (price / 1e6).toFixed(1) + 'M';
          }
          const s = isMobile ? '' : (SYMBOLS[refs.current.currency] || '');
          if (price < 0.01) {
            const str = price.toFixed(15);
            const zeros = str.match(/0\.0*/)?.[0]?.length - 2 || 0;
            if (zeros >= 4) {
              const sig = str.replace(/^0\.0+/, '').replace(/0+$/, '');
              const sub = '\u2080\u2081\u2082\u2083\u2084\u2085\u2086\u2087\u2088\u2089';
              return s + '0.0' + String(zeros).split('').map((d) => sub[+d]).join('') + sig.slice(0, isMobile ? 2 : 4);
            }
            return s + price.toFixed(isMobile ? 4 : 6).replace(/0+$/, '').replace(/\.$/, '');
          }
          if (price < 1) return s + price.toFixed(isMobile ? 3 : 4).replace(/0+$/, '').replace(/\.$/, '');
          if (price < 100) return s + price.toFixed(isMobile ? 1 : 2);
          if (price < 1000) return s + price.toFixed(isMobile ? 0 : 1);
          return s + (isMobile ? formatMcap(price) : Math.round(price).toLocaleString());
        }
      },
      timeScale: {
        visible: true,
        borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
        borderVisible: true,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        barSpacing: isMobile ? 3 : 4,
        minBarSpacing: isMobile ? 1 : 2,
        fixLeftEdge: true,
        fixRightEdge: true,
        rightBarStaysOnScroll: true,
        lockVisibleTimeRangeOnResize: true,
        shiftVisibleRangeOnNewBar: true,
        tickMarkFormatter: (time, tickMarkType, locale) => {
          const date = new Date(time * 1000);
          const estOptions = { timeZone: 'America/New_York' };
          const estDate = new Date(date.toLocaleString('en-US', estOptions));
          const day = estDate.getDate();
          const months = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec'
          ];
          const month = months[estDate.getMonth()];
          const year = estDate.getFullYear().toString().slice(-2);

          // Daily data (liquidity/holders) - dates only
          if (refs.current.chartType === 'liquidity' || refs.current.chartType === 'holders') {
            if (tickMarkType >= 4) return `${month} '${year}`;
            return `${month} ${day}`;
          }

          // Intraday data (candles/line) - include times
          const hours24 = estDate.getHours();
          const hours12 = hours24 % 12 || 12;
          const ampm = hours24 >= 12 ? 'PM' : 'AM';
          const minutes = estDate.getMinutes().toString().padStart(2, '0');
          if (tickMarkType >= 4) return `${month} '${year}`;
          if (tickMarkType === 3) return `${month} ${day}`;
          if (tickMarkType === 2) return `${day} ${hours12}:${minutes}${ampm}`;
          return `${hours12}:${minutes}${ampm}`;
        }
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true
      }
    });

    chartRef.current = chart;

    let zoomTimeout, loadTimeout, stateTimeout;

    const rangeUnsub = chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (!range || !dataRef.current?.length) return;

      clearTimeout(zoomTimeout);
      zoomTimeout = setTimeout(() => {
        const len = dataRef.current.length;
        const scrolled = range.to < len - 2;
        if (scrolled !== refs.current.isZoomed) {
          refs.current.isZoomed = scrolled;
          clearTimeout(stateTimeout);
          stateTimeout = setTimeout(() => setIsUserZoomed(scrolled), 600);
        }
        if (
          refs.current.chartType !== 'holders' &&
          range.from < 30 &&
          !refs.current.isLoadingMore
        ) {
          clearTimeout(loadTimeout);
          loadTimeout = setTimeout(() => loadMoreData(), 500);
        }
      }, 200);
    });

    const toolTip = document.createElement('div');
    toolTip.style = `
      width: ${isMobile ? '120px' : '150px'};
      position: absolute;
      display: none;
      padding: 10px;
      font-size: ${isMobile ? '10px' : '11px'};
      z-index: 1000;
      pointer-events: none;
      border-radius: 10px;
      background: ${isDark ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.98)'};
      backdrop-filter: blur(12px);
      color: ${isDark ? '#fff' : '#1a1a1a'};
      border: 1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'};
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      font-family: var(--font-sans);
    `;
    chartContainerRef.current.appendChild(toolTip);
    toolTipRef.current = toolTip;

    const dateOpts = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'America/New_York'
    };
    const timeOpts = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/New_York'
    };
    let lastTime = 0,
      rafId = null;

    const crossUnsub = chart.subscribeCrosshairMove((param) => {
      if (rafId) cancelAnimationFrame(rafId);
      if (param.time === lastTime) return;

      rafId = requestAnimationFrame(() => {
        if (!param.time || !param.point || param.point.x < 0 || param.point.y < 0) {
          toolTip.style.display = 'none';
          return;
        }

        const arr =
          refs.current.chartType === 'holders'
            ? holderDataRef.current
            : refs.current.chartType === 'liquidity'
              ? liquidityDataRef.current
              : dataRef.current;
        if (!arr?.length) {
          toolTip.style.display = 'none';
          return;
        }

        // Binary search
        let l = 0,
          r = arr.length - 1,
          candle = null;
        while (l <= r) {
          const m = (l + r) >> 1;
          if (arr[m].time === param.time) {
            candle = arr[m];
            break;
          }
          if (arr[m].time < param.time) l = m + 1;
          else r = m - 1;
        }
        if (!candle) {
          toolTip.style.display = 'none';
          return;
        }

        lastTime = param.time;
        const date = new Date(param.time * 1000);
        const dateStr = date.toLocaleDateString('en-US', dateOpts);
        const timeStr = date.toLocaleTimeString('en-US', timeOpts);
        const sym = SYMBOLS[refs.current.currency] || '';
        const ct = refs.current.chartType;

        const fp = (p) => {
          if (p < 0.001) {
            const z = p.toFixed(20).match(/0\.0*/)?.[0]?.length - 2 || 0;
            if (z >= 3)
              return (
                '0.0(' +
                z +
                ')' +
                p
                  .toFixed(20)
                  .replace(/^0\.0+/, '')
                  .slice(0, 4)
              );
          }
          if (p < 0.01) return p.toFixed(6);
          if (p < 1) return p.toFixed(4);
          if (p < 100) return p.toFixed(3);
          return p.toLocaleString();
        };

        const row = (l, v, c) =>
          `<div style="display:flex;justify-content:space-between;line-height:1.5;margin-bottom:2px;${c ? `color:${c}` : ''}">
            <span style="opacity:0.5;font-weight:500">${l}</span>
            <span style="font-weight:600;font-family:var(--font-mono)">${v}</span>
          </div>`;
        const sep = `<div style="height:1px;background:${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'};margin:6px 0"></div>`;

        let html = `<div style="opacity:0.6;margin-bottom:3px;font-size:9px">${dateStr}${ct !== 'holders' && ct !== 'liquidity' ? ' ' + timeStr : ''}</div>`;
        if (ct === 'candles') {
          const chg = (((candle.close - candle.open) / candle.open) * 100).toFixed(2);
          const col = candle.close >= candle.open ? '#22c55e' : '#ef4444';
          html +=
            row('O', sym + fp(candle.open)) +
            row('H', sym + fp(candle.high)) +
            row('L', sym + fp(candle.low)) +
            row('C', sym + fp(candle.close), col) +
            sep +
            row('Vol', candle.volume.toLocaleString()) +
            row('Chg', chg + '%', col);
        } else if (ct === 'line') {
          html +=
            row('Price', sym + fp(candle.close || candle.value)) +
            row('Vol', (candle.volume || 0).toLocaleString());
        } else if (ct === 'holders') {
          html += row('Holders', (candle.holders || candle.value).toLocaleString());
          if (candle.top10 !== undefined)
            html +=
              sep +
              row('Top 10', candle.top10.toFixed(1) + '%') +
              row('Top 20', candle.top20.toFixed(1) + '%') +
              row('Top 50', candle.top50.toFixed(1) + '%');
        } else {
          // Liquidity
          html += row('XRP Liq', formatMcap(candle.xrpLiquidity) + ' XRP');
          html += row('Token Liq', formatMcap(candle.tokenLiquidity));
          if (candle.tvl > 0) html += row('TVL', formatMcap(candle.tvl) + ' XRP');
          html += sep;
          if (candle.volume > 0) html += row('Volume', formatMcap(candle.volume) + ' XRP');
          if (candle.fees > 0) html += row('Fees', formatMcap(candle.fees) + ' XRP');
          if (candle.apr > 0) html += row('APR', candle.apr.toFixed(2) + '%', '#22c55e');
        }

        const w = containerWidth;
        const h = containerHeight;
        toolTip.innerHTML = html;
        toolTip.style.display = 'block';
        toolTip.style.left = Math.max(0, Math.min(w - 150, param.point.x - 60)) + 'px';
        toolTip.style.top =
          (param.point.y > h / 2 ? 8 : param.point.y + 20) +
          'px';
      });
    });

    const customPriceFormat = {
      type: 'custom',
      formatter: (price) => {
        const s = SYMBOLS[refs.current.currency] || '';
        if (price < 0.00000001) {
          const str = price.toFixed(20);
          const zeros = str.match(/0\.0*/)?.[0]?.length - 2 || 0;
          const sub = '\u2080\u2081\u2082\u2083\u2084\u2085\u2086\u2087\u2088\u2089';
          const sig = str.replace(/^0\.0+/, '').slice(0, 4);
          return s + '0.0' + String(zeros).split('').map((d) => sub[+d]).join('') + sig;
        }
        if (price < 0.01) return s + price.toFixed(8);
        if (price < 1) return s + price.toFixed(4);
        if (price < 100) return s + price.toFixed(2);
        return s + Math.round(price).toLocaleString();
      },
      minMove: 1e-12
    };

    if (chartType === 'candles') {
      seriesRefs.current.candle = chart.addSeries(CandlestickSeries, {
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderUpColor: '#22c55e',
        borderDownColor: '#ef4444',
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
        priceFormat: customPriceFormat
      });
    } else if (chartType === 'line') {
      seriesRefs.current.line = chart.addSeries(AreaSeries, {
        lineColor: '#3b82f6',
        topColor: 'rgba(59,130,246,0.25)',
        bottomColor: 'rgba(59,130,246,0.02)',
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 3,
        priceFormat: customPriceFormat
      });
    } else if (chartType === 'holders') {
      seriesRefs.current.line = chart.addSeries(AreaSeries, {
        lineColor: '#a855f7',
        topColor: 'rgba(168,85,247,0.25)',
        bottomColor: 'rgba(168,85,247,0.02)',
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 3,
        priceFormat: { type: 'price', minMove: 1, precision: 0 }
      });
    } else {
      // Liquidity chart - dual lines for XRP and Token
      seriesRefs.current.xrpLine = chart.addSeries(AreaSeries, {
        lineColor: '#06b6d4',
        topColor: 'rgba(6,182,212,0.15)',
        bottomColor: 'rgba(6,182,212,0.01)',
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 3,
        priceFormat: { type: 'price', minMove: 0.01, precision: 2 },
        title: 'XRP'
      });
      seriesRefs.current.tokenLine = chart.addSeries(AreaSeries, {
        lineColor: '#f59e0b',
        topColor: 'rgba(245,158,11,0.15)',
        bottomColor: 'rgba(245,158,11,0.01)',
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 3,
        priceFormat: { type: 'price', minMove: 0.01, precision: 2 },
        priceScaleId: 'token',
        title: 'Token'
      });
      chart
        .priceScale('token')
        .applyOptions({ scaleMargins: { top: 0.05, bottom: 0.25 }, visible: true });
    }

    if (chartType !== 'holders' && chartType !== 'liquidity') {
      seriesRefs.current.volume = chart.addSeries(HistogramSeries, {
        color: 'rgba(34,197,94,0.6)',
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
        scaleMargins: { top: 0.65, bottom: 0 },
        priceLineVisible: false,
        lastValueVisible: false
      });
      chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.88, bottom: 0 } });
    }

    let resizeTimeout;
    const resizeObs = new ResizeObserver((entries) => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const { width, height } = entries[0]?.contentRect || {};
        if (chartRef.current && width > 0 && height > 0)
          chartRef.current.applyOptions({ width, height });
      }, 100);
    });

    const wheelHandler = (e) => e.preventDefault();
    chartContainerRef.current?.addEventListener('wheel', wheelHandler, { passive: false });
    resizeObs.observe(chartContainerRef.current);

    return () => {
      clearTimeout(zoomTimeout);
      clearTimeout(loadTimeout);
      clearTimeout(stateTimeout);
      clearTimeout(resizeTimeout);
      resizeObs.disconnect();
      chartContainerRef.current?.removeEventListener('wheel', wheelHandler);
      rangeUnsub?.();
      crossUnsub?.();
      if (rafId) cancelAnimationFrame(rafId);
      toolTipRef.current?.remove();
      toolTipRef.current = null;
      if (chartRef.current) {
        try {
          chartRef.current.remove();
        } catch { }
        chartRef.current = null;
      }
      seriesRefs.current = {
        candle: null,
        line: null,
        volume: null,
        xrpLine: null,
        tokenLine: null
      };
    };
  }, [chartType, isDark, isMobile, hasData, loadMoreData]);

  // Handle fullscreen resize
  useEffect(() => {
    if (!chartContainerRef.current || !chartRef.current) return;

    const container = chartContainerRef.current;
    const newHeight = isFullscreen ? window.innerHeight - 100 : isMobile ? 400 : 620;
    const newWidth = container.clientWidth;

    // Use only applyOptions (resize is redundant)
    const timeoutId = setTimeout(() => {
      if (chartRef.current && newWidth > 0) {
        chartRef.current.applyOptions({ width: newWidth, height: newHeight });
      }
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [isFullscreen, isMobile]);

  // Update data on chart
  useEffect(() => {
    const chart = chartRef.current;
    const series = seriesRefs.current;
    if (!chart) return;
    const chartData =
      chartType === 'holders' ? holderData : chartType === 'liquidity' ? liquidityData : data;
    if (!chartData?.length) return;

    const key = `${chartType}-${timeRange}-${activeFiatCurrency}`;
    const isNew = lastKeyRef.current !== key;

    if (chartType === 'candles' && series.candle) {
      series.candle.setData(chartData);
    } else if (chartType === 'line' && series.line) {
      series.line.setData(chartData.map((d) => ({ time: d.time, value: d.close })));
    } else if (chartType === 'holders' && series.line) {
      series.line.setData(chartData.map((d) => ({ time: d.time, value: d.holders })));
    } else if (chartType === 'liquidity' && series.xrpLine && series.tokenLine) {
      series.xrpLine.setData(chartData.map((d) => ({ time: d.time, value: d.xrpLiquidity })));
      series.tokenLine.setData(chartData.map((d) => ({ time: d.time, value: d.tokenLiquidity })));
    }

    if (chartType !== 'holders' && chartType !== 'liquidity' && series.volume && data) {
      series.volume.setData(
        data.map((d) => ({
          time: d.time,
          value: d.volume || 0,
          color: d.close >= d.open ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'
        }))
      );
    }


    if (isNew) {
      const len = chartData.length;
      const visMap = {
        '1d': isMobile ? 60 : 100,
        '5d': isMobile ? 80 : 120,
        '1m': isMobile ? 60 : 100,
        '3m': isMobile ? 80 : 120,
        '1y': isMobile ? 30 : 52,
        '5y': isMobile ? 80 : 120,
        all: isMobile ? 100 : 150
      };
      // Ensure minimum visible slots so candles don't get too wide with sparse data
      const minSlots = isMobile ? 40 : 60;
      const vis = Math.max(minSlots, Math.min(visMap[timeRange] || 100, len));
      // Use requestAnimationFrame to set range after render to prevent layout shift
      requestAnimationFrame(() => {
        if (chartRef.current) {
          chartRef.current.timeScale().setVisibleLogicalRange({
            from: len - vis,
            to: len + 5
          });
        }
      });
      lastKeyRef.current = key;
    }
  }, [data, holderData, liquidityData, chartType, timeRange, activeFiatCurrency, isMobile]);

  const handleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => {
      const next = !prev;
      document.body.style.overflow = next ? 'hidden' : '';
      return next;
    });
  }, []);

  // Cleanup body overflow on unmount + ESC key to exit fullscreen
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        document.body.style.overflow = '';
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  const chartIcons = {
    candles: <CandlestickChart />,
    line: <TrendingUp />,
    holders: <Users />,
    liquidity: <Droplets />
  };

  return (
    <div className="flex flex-col h-full gap-3">
      <Card isDark={isDark} isMobile={isMobile} isFullscreen={isFullscreen} className="flex-1">
        <ChartHeader>
          <HeaderSection>
            <span className={cn('text-[13px] font-semibold', isDark ? 'text-white' : 'text-[#1a1a1a]')}>
              {token.name} <span className="opacity-50 font-normal">{chartType === 'holders' ? 'Holders' : chartType === 'liquidity' ? 'TVL' : activeFiatCurrency}</span>
            </span>

            <div className="flex items-center gap-[6px] flex-nowrap">
              {lastUpdate && (
                <div className="flex items-center gap-[6px] py-1 px-2 rounded-lg h-6 bg-[rgba(34,197,94,0.05)] border border-[rgba(34,197,94,0.2)]">
                  <div className={cn('w-[6px] h-[6px] rounded-full', isUserZoomed ? 'bg-[#f59e0b]' : 'bg-[#22c55e]')} style={{ boxShadow: isUserZoomed ? 'none' : '0 0 8px rgba(34,197,94,0.6)', animation: isUserZoomed ? 'none' : 'pulse 2s infinite' }} />
                  <span className={cn('text-[10px] font-mono font-bold tracking-[0.05em]', isUserZoomed ? 'text-[#f59e0b]' : 'text-[#22c55e]')}>
                    {isUserZoomed ? 'PAUSED' : 'LIVE'}
                  </span>
                  <style>{`@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }`}</style>
                </div>
              )}

              {athData.athMcap > 0 && chartType !== 'holders' && chartType !== 'liquidity' && (() => {
                const pct = Math.max(0, Math.min(100, 100 + parseFloat(athData.percentDown)));
                const col = pct > 80 ? '#22c55e' : pct < 20 ? '#ef4444' : '#f59e0b';
                return (
                  <div className={cn('flex items-center gap-2 py-1 px-[10px] rounded-lg h-6 border', isDark ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-black/[0.03] border-black/[0.08]')}>
                    <span className={cn('text-[9px] font-extrabold', isDark ? 'text-white/40' : 'text-black/40')}>ATH</span>
                    <div className={cn('relative h-1 rounded-sm overflow-hidden', isMobile ? 'w-[30px]' : 'w-10', isDark ? 'bg-white/[0.06]' : 'bg-black/10')}>
                      <div className="absolute left-0 top-0 h-full rounded-sm" style={{ width: `${pct}%`, background: col }} />
                    </div>
                    <span className="text-[10px] font-bold font-mono" style={{ color: col }}>{athData.percentDown}%</span>
                  </div>
                );
              })()}

              {chartType === 'liquidity' && (
                <div className={cn('flex items-center gap-[6px] text-[9px] py-[2px] px-[6px] rounded-md', isDark ? 'bg-white/[0.03]' : 'bg-black/[0.03]')}>
                  <span className={cn('flex items-center gap-[3px]', isDark ? 'text-white/60' : 'text-black/60')}><span className="w-[6px] h-[2px] rounded-sm bg-[#06b6d4]" />XRP</span>
                  <span className={cn('flex items-center gap-[3px]', isDark ? 'text-white/60' : 'text-black/60')}><span className="w-[6px] h-[2px] rounded-sm bg-[#f59e0b]" />Token</span>
                </div>
              )}
            </div>
          </HeaderSection>

          <HeaderSection>
            <ToolGroup isDark={isDark}>
              {Object.entries(chartIcons).map(([type, icon]) => (
                <ToolBtn
                  key={type}
                  onClick={() => {
                    const wasPrice = chartType === 'candles' || chartType === 'line';
                    const isPrice = type === 'candles' || type === 'line';
                    if (wasPrice && !isPrice) {
                      priceTimeRangeRef.current = timeRange;
                      setTimeRange('all');
                    } else if (!wasPrice && isPrice) {
                      setTimeRange(priceTimeRangeRef.current);
                    }
                    setChartType(type);
                  }}
                  isActive={chartType === type}
                  isMobile={isMobile}
                  isDark={isDark}
                >
                  {icon}
                  {!isMobile && { holders: 'Holders', liquidity: 'Liquidity', candles: 'Price', line: 'Area' }[type]}
                </ToolBtn>
              ))}
            </ToolGroup>

            <ToolGroup isDark={isDark}>
              {(isMobile
                ? ['1d', '5d', '1m', '1y', 'all']
                : ['1d', '5d', '1m', '3m', '1y', '5y', 'all']
              ).map((r) => (
                <ToolBtn
                  key={r}
                  onClick={() => {
                    setTimeRange(r);
                    setIsUserZoomed(false);
                    if (chartType === 'candles' || chartType === 'line') {
                      priceTimeRangeRef.current = r;
                    }
                  }}
                  isActive={timeRange === r}
                  isMobile={isMobile}
                  isDark={isDark}
                >
                  {r.toUpperCase()}
                </ToolBtn>
              ))}
            </ToolGroup>

            <ToolBtn
              onClick={handleFullscreen}
              isDark={isDark}
              isMobile={isMobile}
              style={isFullscreen ? { background: '#ef4444', color: '#fff' } : {}}
            >
              {isFullscreen ? <Minimize /> : <Maximize />}
              {!isMobile && (isFullscreen ? 'Exit' : 'Full')}
            </ToolBtn>
          </HeaderSection>
        </ChartHeader>

        <div
          className={cn('relative flex-1 rounded-xl overflow-hidden', isMobile ? 'min-h-[400px]' : 'min-h-[450px]', isDark ? 'bg-black/10' : 'bg-transparent')}
        >
          <div ref={chartContainerRef} className="w-full h-full" />

          {loading && !chartRef.current && (
            <div
              className={cn('absolute inset-0 flex flex-col items-center justify-center gap-3 backdrop-blur-[4px]', isDark ? 'bg-[rgba(6,9,14,0.4)]' : 'bg-white/40')}
            >
              <Spinner size={24} color="#3b82f6" />
              <span className="text-[11px] font-medium opacity-60">Loading chart data...</span>
            </div>
          )}

          {isLoadingMore && (
            <div
              className={cn('absolute top-3 left-3 flex items-center gap-2 py-[6px] px-3 rounded-lg border z-10 shadow-[0_4px_12px_rgba(0,0,0,0.1)]', isDark ? 'bg-[rgba(20,25,35,0.95)] border-white/[0.08]' : 'bg-[rgba(255,255,255,0.95)] border-black/[0.08]')}
            >
              <Spinner size={12} />
              <span className="text-[10px] font-semibold opacity-80 tracking-[0.02em]">Fetching history...</span>
            </div>
          )}

          {!loading &&
            !(chartType === 'holders'
              ? holderData?.length
              : chartType === 'liquidity'
                ? liquidityData?.length
                : data?.length) && (
              <div className="absolute inset-0 flex items-center justify-center p-5">
                <BearEmptyState isDark={isDark} />
              </div>
            )}
        </div>

        {isFullscreen &&
          typeof document !== 'undefined' &&
          createPortal(
            <button
              onClick={handleFullscreen}
              className="fixed top-5 right-5 z-[999999] py-[10px] px-5 bg-[#ef4444] text-white border-none rounded-[10px] cursor-pointer flex items-center gap-2 text-sm font-semibold shadow-[0_4px_20px_rgba(239,68,68,0.3)]"
            >
              <Minimize size={18} />
              Exit Fullscreen
            </button>,
            document.body
          )}
      </Card>

      {creatorEvents.length > 0 && chartType !== 'holders' && chartType !== 'liquidity' && (
        <div
          className={cn('flex items-center gap-3 py-2 px-4 rounded-xl min-h-[40px] border', isDark ? 'bg-black/20 border-white/[0.05]' : 'bg-black/[0.02] border-black/[0.05]')}
        >
          <div className={cn('flex items-center gap-2 pr-3 shrink-0', isDark ? 'border-r border-white/10' : 'border-r border-black/10')}>
            <Sparkles size={14} color="#f59e0b" fill="#f59e0b" className="opacity-80" />
            <span className={cn('font-bold text-[10px] uppercase tracking-[0.1em]', isDark ? 'text-white/50' : 'text-black/50')}>Creator</span>
          </div>
          <div className="flex gap-2 overflow-x-auto py-[2px]" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {creatorEvents.slice(0, 10).map((e, i) => {
              const f = (n) => n >= 9.995e5 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(0) + 'K' : n < 1 ? n.toFixed(2) : Math.round(n);
              const t = e.time > 1e12 ? e.time : e.time * 1000;
              const d = Math.floor((Date.now() - t) / 1000);
              const ago = d < 60 ? d + 's' : d < 3600 ? Math.floor(d / 60) + 'm' : d < 86400 ? Math.floor(d / 3600) + 'h' : Math.floor(d / 86400) + 'd';
              const isXrp = ['SELL', 'BUY', 'WITHDRAW', 'DEPOSIT', 'SEND', 'RECEIVE'].includes(e.type);
              const amt = isXrp && e.xrpAmount > 0.001 ? f(e.xrpAmount) + ' XRP' : e.tokenAmount > 0 ? f(e.tokenAmount) + (e.currency ? ' ' + e.currency : '') : '';
              const short = { SELL: 'Sell', BUY: 'Buy', SEND: 'Send', RECEIVE: 'Recv', 'TRANSFER OUT': 'Send', WITHDRAW: 'Out', DEPOSIT: 'In' }[e.type] || e.type;
              return (
                <a
                  key={e.hash || i}
                  href={`https://xrpl.to/tx/${e.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'inline-flex items-center gap-[6px] py-1 px-[10px] rounded-md border no-underline shrink-0 transition-all duration-200',
                    isDark ? 'bg-white/[0.04] border-white/[0.08] text-white hover:-translate-y-px hover:bg-white/[0.08] hover:border-[#3b82f6]' : 'bg-white border-black/[0.08] text-[#1a1a1a] hover:-translate-y-px hover:bg-[#f8fafc] hover:border-[#3b82f6]'
                  )}
                >
                  <span className="font-extrabold text-[10px] uppercase" style={{ color: e.color }}>{short}</span>
                  {amt && <span className="font-mono text-[10px] font-semibold opacity-90">{amt}</span>}
                  <span className="opacity-40 text-[9px] font-semibold">{ago}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

PriceChartAdvanced.displayName = 'PriceChartAdvanced';

export default PriceChartAdvanced;
