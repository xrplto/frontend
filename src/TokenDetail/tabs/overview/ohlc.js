import { useState, useEffect, useRef, memo, useContext, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styled from '@emotion/styled';
import {
  TrendingUp,
  CandlestickChart,
  Users,
  Maximize,
  Minimize,
  Loader2,
  Droplets
} from 'lucide-react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  AreaSeries
} from 'lightweight-charts';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';
import { AppContext } from 'src/context/AppContext';

const SYMBOLS = { USD: '$', EUR: '€', JPY: '¥', CNH: '¥', XRP: '✕' };
const BASE_URL = 'https://api.xrpl.to/v1';
const WS_URL = 'wss://api.xrpl.to/ws/ohlc';

const processOhlc = (ohlc) => {
  const MAX = 90071992547409;
  return ohlc
    .filter((c) => c[1] < MAX && c[2] < MAX && c[3] < MAX && c[4] < MAX)
    .filter((c) => c[1] > 0 && c[4] > 0) // Filter out zero-value candles (incomplete/no trades)
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
  if (v >= 1e3) return (v / 1e3).toFixed(2) + 'K';
  return v.toFixed(2);
};

const Card = styled.div`
  width: 100%;
  height: 100%;
  padding: ${(p) => (p.isMobile ? '10px' : '14px')};
  background: transparent;
  border: 1.5px solid ${(p) => (p.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)')};
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  ${(p) =>
    p.isFullscreen &&
    `position:fixed;inset:0;z-index:99999;border-radius:0;background:${p.isDark ? '#0a0f16' : '#fff'};border:none;padding:16px 20px;`}
`;

const Btn = styled.button`
  padding: ${(p) => (p.isMobile ? '4px 6px' : '5px 10px')};
  font-size: ${(p) => (p.isMobile ? '10px' : '11px')};
  min-width: ${(p) => p.minWidth || 'auto'};
  height: ${(p) => (p.isMobile ? '24px' : '26px')};
  border-radius: 6px;
  font-weight: ${(p) => (p.isActive ? 500 : 400)};
  border: 1px solid
    ${(p) =>
      p.isActive
        ? p.isDark
          ? 'rgba(255,255,255,0.15)'
          : 'rgba(0,0,0,0.1)'
        : p.isDark
          ? 'rgba(255,255,255,0.1)'
          : 'rgba(0,0,0,0.08)'};
  background: ${(p) =>
    p.isActive ? (p.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)') : 'transparent'};
  color: ${(p) =>
    p.isActive
      ? p.isDark
        ? 'rgba(255,255,255,0.9)'
        : 'rgba(0,0,0,0.8)'
      : p.isDark
        ? 'rgba(255,255,255,0.5)'
        : 'rgba(0,0,0,0.5)'};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  & svg {
    width: ${(p) => (p.isMobile ? '11px' : '12px')};
    height: ${(p) => (p.isMobile ? '11px' : '12px')};
  }
`;

const Spinner = styled(Loader2)`
  animation: spin 1s linear infinite;
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const BearEmptyState = ({ isDark }) => (
  <div style={{ border: isDark ? '1.5px dashed rgba(255,255,255,0.1)' : '1.5px dashed rgba(0,0,0,0.1)', borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ position: 'relative', width: 48, height: 48, marginBottom: 12 }}>
        <div style={{ position: 'absolute', top: -3, left: 0, width: 16, height: 16, borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.15)' : '#d1d5db' }}>
          <div style={{ position: 'absolute', top: 3, left: 3, width: 10, height: 10, borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb' }} />
        </div>
        <div style={{ position: 'absolute', top: -3, right: 0, width: 16, height: 16, borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.15)' : '#d1d5db' }}>
          <div style={{ position: 'absolute', top: 3, right: 3, width: 10, height: 10, borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb' }} />
        </div>
        <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', width: 40, height: 36, borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.15)' : '#d1d5db', overflow: 'hidden' }}>
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{ height: 2, width: '100%', background: isDark ? 'rgba(255,255,255,0.15)' : '#e5e7eb', marginTop: i * 2.5 + 2 }} />
          ))}
          <div style={{ position: 'absolute', top: 10, left: 6, width: 10, height: 10 }}>
            <div style={{ position: 'absolute', width: 8, height: 2, background: isDark ? 'rgba(255,255,255,0.4)' : '#6b7280', transform: 'rotate(45deg)', top: 4 }} />
            <div style={{ position: 'absolute', width: 8, height: 2, background: isDark ? 'rgba(255,255,255,0.4)' : '#6b7280', transform: 'rotate(-45deg)', top: 4 }} />
          </div>
          <div style={{ position: 'absolute', top: 10, right: 6, width: 10, height: 10 }}>
            <div style={{ position: 'absolute', width: 8, height: 2, background: isDark ? 'rgba(255,255,255,0.4)' : '#6b7280', transform: 'rotate(45deg)', top: 4 }} />
            <div style={{ position: 'absolute', width: 8, height: 2, background: isDark ? 'rgba(255,255,255,0.4)' : '#6b7280', transform: 'rotate(-45deg)', top: 4 }} />
          </div>
          <div style={{ position: 'absolute', bottom: 5, left: '50%', transform: 'translateX(-50%)', width: 18, height: 12, borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb' }}>
            <div style={{ position: 'absolute', top: 2, left: '50%', transform: 'translateX(-50%)', width: 8, height: 6, borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.25)' : '#9ca3af' }} />
          </div>
        </div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', textTransform: 'uppercase' }}>No chart data</span>
    </div>
  </div>
);

const PriceChartAdvanced = memo(({ token }) => {
  const { activeFiatCurrency, themeName } = useContext(AppContext);
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

  // Creator events from API
  const [creatorEvents, setCreatorEvents] = useState([]);
  useEffect(() => {
    if (!token?.creator || !token?.md5) return;
    const ctrl = new AbortController();
    const creatorUrl = `${BASE_URL.replace('/v1', '')}/v1/creators/${token.creator}?limit=100&md5=${token.md5}`;
    const t0 = performance.now();
    console.log('[OHLC] Fetching creator events:', creatorUrl);
    axios.get(creatorUrl, { signal: ctrl.signal })
      .then(res => {
        console.log(`[OHLC] Creator events done in ${(performance.now() - t0).toFixed(0)}ms, ${res.data?.events?.length || 0} events`);
        if (!res.data?.events?.length) return setCreatorEvents([]);
        const colors = { sell: '#ef4444', buy: '#22c55e', withdraw: '#f59e0b', deposit: '#8b5cf6', transfer_out: '#f97316', other_send: '#f97316', check_create: '#ec4899', check_cash: '#ec4899', check_receive: '#ec4899', receive: '#06b6d4', other_receive: '#06b6d4' };
        const priority = { sell: 1, buy: 1, transfer_out: 2, other_send: 2, check_create: 3, check_cash: 3, check_receive: 3, withdraw: 4, deposit: 4, receive: 5, other_receive: 5 };
        setCreatorEvents(res.data.events
          .filter(e => !((e.side === 'receive' || e.side === 'other_receive') && e.xrpAmount < 5 && e.tokenAmount < 10000))
          .sort((a, b) => (priority[a.side] || 9) - (priority[b.side] || 9) || b.time - a.time)
          .slice(0, 20)
          .map(e => ({
            time: e.time,
            type: (e.side || '').toUpperCase().replace('_', ' ').replace('OTHER ', ''),
            tokenAmount: e.tokenAmount || 0,
            xrpAmount: e.xrpAmount || 0,
            hash: e.hash,
            color: colors[e.side] || '#9ca3af'
          })).sort((a, b) => a.time - b.time));
      })
      .catch(() => setCreatorEvents([]));
    return () => ctrl.abort();
  }, [token?.creator, token?.md5]);

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
      console.log('[OHLC] Loading more:', loadMoreUrl);
      const res = await axios.get(loadMoreUrl);
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
      console.error('[OHLC] Load more error:', e.message);
      if (!axios.isCancel(e)) setHasMore(false);
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
        const t0 = performance.now();
        console.log('[OHLC] Fetching:', ohlcUrl);
        const res = await axios.get(ohlcUrl);
        console.log(`[OHLC] Done in ${(performance.now() - t0).toFixed(0)}ms, ${res.data?.ohlc?.length || 0} candles`);
        if (mounted && res.data?.ohlc) {
          const processed = processOhlc(res.data.ohlc);
          dataRef.current = processed;
          setData(processed);
          setLastUpdate(new Date());
          setHasMore(timeRange !== 'all');
        }
      } catch (e) {
        console.error('[OHLC] Fetch error:', e.message);
      }
      if (mounted) setLoading(false);
    };

    const connectWs = () => {
      if (!mounted) return;
      const wsUrl = `${WS_URL}/${token.md5}?interval=${getWsInterval(timeRange)}&vs_currency=${activeFiatCurrency}`;
      console.log('[OHLC WS] Connecting:', wsUrl);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[OHLC WS] Connected');
        pingInterval = setInterval(() => ws.readyState === 1 && ws.send('{"type":"ping"}'), 30000);
      };

      ws.onmessage = (e) => {
        if (!mounted) return;
        const msg = JSON.parse(e.data);
        // IGNORE any WS message with ohlc array - use HTTP data only
        if (msg.ohlc) return;

        if (msg.e === 'kline' && msg.k && !refs.current.isZoomed) {
          const k = msg.k;
          // Skip zero-value candles (incomplete/no trades yet)
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

          // Update series directly to avoid layout shift from full setData
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
              color: candle.close >= candle.open ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'
            });
          }

          // Update ref without triggering state re-render
          if (dataRef.current?.length) {
            const last = dataRef.current[dataRef.current.length - 1];
            if (last.time === candle.time) {
              dataRef.current[dataRef.current.length - 1] = candle;
            } else if (candle.time > last.time) {
              dataRef.current.push(candle);
            }
          }
          setLastUpdate(new Date());
        }
      };

      ws.onclose = (ev) => {
        console.log(`[OHLC WS] Closed code=${ev.code} reason="${ev.reason}"`);
        clearInterval(pingInterval);
        if (mounted && ev.code !== 1000 && ev.code !== 4011) setTimeout(connectWs, 3000);
      };
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
    const t0 = performance.now();
    console.log('[OHLC] Fetching holders:', holdersUrl);
    axios
      .get(holdersUrl, { signal: ctrl.signal })
      .then((res) => {
        console.log(`[OHLC] Holders done in ${(performance.now() - t0).toFixed(0)}ms`);
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
      .catch((e) => console.error('[OHLC] Holders error:', e.message))
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
    const t0 = performance.now();
    console.log('[OHLC] Fetching liquidity:', liquidityUrl);
    axios
      .get(liquidityUrl, { signal: ctrl.signal })
      .then((res) => {
        console.log(`[OHLC] Liquidity done in ${(performance.now() - t0).toFixed(0)}ms`);
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
      .catch((e) => console.error('[OHLC] Liquidity error:', e.message))
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
      } catch {}
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

    const containerHeight = chartContainerRef.current.clientHeight || (isMobile ? 360 : 570);
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
          color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)',
          width: 1,
          style: 3,
          labelBackgroundColor: '#147DFE'
        },
        horzLine: {
          color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)',
          width: 1,
          style: 3,
          labelBackgroundColor: '#147DFE'
        }
      },
      rightPriceScale: {
        borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
        scaleMargins: {
          top: 0.05,
          bottom: 0.25
        },
        mode: 1, // Logarithmic scale - better for tokens with large price swings
        autoScale: true,
        borderVisible: true,
        visible: true,
        entireTextOnly: false,
        drawTicks: true,
        ticksVisible: true,
        alignLabels: true,
        textColor: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)'
      },
      localization: {
        priceFormatter: (price) => {
          if (chartType === 'holders' || chartType === 'liquidity') {
            if (price < 1000) {
              return chartType === 'liquidity' ? price.toFixed(2) : Math.round(price).toString();
            } else if (price < 1000000) {
              return (price / 1000).toFixed(1) + 'K';
            } else {
              return (price / 1000000).toFixed(1) + 'M';
            }
          }

          const s = SYMBOLS[refs.current.currency] || '';
          if (price < 0.01) {
            const str = price.toFixed(15);
            const zeros = str.match(/0\.0*/)?.[0]?.length - 2 || 0;
            if (zeros >= 4) {
              const sig = str.replace(/^0\.0+/, '').replace(/0+$/, '');
              const sub = '₀₁₂₃₄₅₆₇₈₉';
              return (
                s +
                '0.0' +
                String(zeros)
                  .split('')
                  .map((d) => sub[+d])
                  .join('') +
                sig.slice(0, 4)
              );
            }
            return s + price.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
          }
          if (price < 1) return s + price.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
          if (price < 100) return s + price.toFixed(2);
          if (price < 1000) return s + price.toFixed(1);
          return s + Math.round(price).toLocaleString();
        }
      },
      timeScale: {
        visible: true,
        borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
        borderVisible: true,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        barSpacing: isMobile ? 10 : 14,
        minBarSpacing: isMobile ? 5 : 8,
        fixLeftEdge: true, // Prevent scrolling past oldest data
        fixRightEdge: true, // Prevent scrolling past newest data
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
    toolTip.style = `width: ${isMobile ? '120px' : '140px'}; position: absolute; display: none; padding: ${isMobile ? '6px' : '8px'}; font-size: ${isMobile ? '9px' : '10px'}; z-index: 1000; top: 6px; left: 6px; pointer-events: none; border-radius: 8px; background: ${isDark ? 'rgba(10,15,22,0.95)' : 'rgba(255,255,255,0.95)'}; backdrop-filter: blur(8px); color: ${isDark ? 'rgba(255,255,255,0.9)' : '#1a1a1a'}; border: 1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`;
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
          `<div style="display:flex;justify-content:space-between;line-height:1.3;${c ? `color:${c}` : ''}"><span style="opacity:0.6">${l}</span><span>${v}</span></div>`;
        const sep = `<div style="height:1px;background:${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'};margin:3px 0"></div>`;

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

        const w = chartContainerRef.current.clientWidth;
        toolTip.innerHTML = html;
        toolTip.style.display = 'block';
        toolTip.style.left = Math.max(0, Math.min(w - 150, param.point.x - 60)) + 'px';
        toolTip.style.top =
          (param.point.y > chartContainerRef.current.clientHeight / 2 ? 8 : param.point.y + 20) +
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
          const sub = '₀₁₂₃₄₅₆₇₈₉';
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
      chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.7, bottom: 0 } });
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
        } catch {}
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
    const newHeight = isFullscreen ? window.innerHeight - 100 : isMobile ? 360 : 570;
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
          color: d.close >= d.open ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'
        }))
      );
    }


    if (isNew) {
      const len = chartData.length;
      const visMap = {
        '1d': isMobile ? 120 : 240,
        '5d': isMobile ? 200 : 400,
        '1m': isMobile ? 100 : 200,
        '3m': isMobile ? 120 : 240,
        '1y': isMobile ? 30 : 52,
        '5y': isMobile ? 100 : 200,
        all: len
      };
      const vis = Math.min(visMap[timeRange] || 192, len);
      // Use requestAnimationFrame to set range after render to prevent layout shift
      requestAnimationFrame(() => {
        if (chartRef.current) {
          chartRef.current.timeScale().setVisibleLogicalRange({
            from: Math.max(0, len - vis),
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
  const btnGroupStyle = {
    display: 'flex',
    padding: '2px',
    borderRadius: '8px',
    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    gap: '2px'
  };

  return (
    <Card isDark={isDark} isMobile={isMobile} isFullscreen={isFullscreen}>
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          marginBottom: isMobile ? '6px' : '8px',
          gap: isMobile ? '4px' : '6px'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '6px' : '8px',
            flexWrap: 'wrap'
          }}
        >
          <span
            style={{
              fontSize: '12px',
              fontWeight: 400,
              color: isDark ? 'rgba(255,255,255,0.9)' : '#1a1a1a'
            }}
          >
            {token.name}{' '}
            {chartType === 'holders'
              ? 'Holders'
              : chartType === 'liquidity'
                ? 'TVL'
                : `(${activeFiatCurrency})`}
          </span>
          {chartType === 'liquidity' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '3px',
                    borderRadius: '1px',
                    background: '#06b6d4'
                  }}
                />
                XRP
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '3px',
                    borderRadius: '1px',
                    background: '#f59e0b'
                  }}
                />
                Token
              </span>
            </div>
          )}
          {athData.athMcap > 0 &&
            chartType !== 'holders' &&
            chartType !== 'liquidity' &&
            (() => {
              const pct = Math.max(0, Math.min(100, 100 + parseFloat(athData.percentDown)));
              const col = pct > 80 ? '#22c55e' : pct < 20 ? '#ef4444' : '#f59e0b';
              return (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.015)'
                  }}
                >
                  <span
                    style={{
                      fontSize: '9px',
                      color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
                      textTransform: 'uppercase'
                    }}
                  >
                    ATH
                  </span>
                  <div
                    style={{
                      position: 'relative',
                      width: isMobile ? '50px' : '70px',
                      height: '4px',
                      borderRadius: '2px',
                      background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: `${pct}%`,
                        borderRadius: '2px',
                        background: col
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: '10px',
                      fontFamily: 'var(--font-mono)',
                      color: col,
                      minWidth: '40px',
                      textAlign: 'right'
                    }}
                  >
                    {athData.percentDown > 0 ? '+' : ''}
                    {athData.percentDown}%
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
                      fontFamily: 'var(--font-mono)',
                      borderLeft: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                      paddingLeft: '6px'
                    }}
                  >
                    {SYMBOLS[activeFiatCurrency] || ''}
                    {formatMcap(athData.athMcap)}
                  </span>
                </div>
              );
            })()}
          {lastUpdate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.5 }}>
              <div
                style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: isUserZoomed ? '#f59e0b' : '#22c55e'
                }}
              />
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: isDark ? '#fff' : '#1a1a1a'
                }}
              >
                {lastUpdate.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false
                })}
              </span>
              {isUserZoomed && (
                <span style={{ fontSize: '10px', color: '#f59e0b', textTransform: 'uppercase' }}>
                  paused
                </span>
              )}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            gap: isMobile ? '3px' : '4px',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}
        >
          <div style={btnGroupStyle}>
            {Object.entries(chartIcons).map(([type, icon]) => (
              <Btn
                key={type}
                onClick={() => {
                  const wasPrice = chartType === 'candles' || chartType === 'line';
                  const isPrice = type === 'candles' || type === 'line';

                  // Save current timeRange when leaving price charts
                  if (wasPrice && !isPrice) {
                    priceTimeRangeRef.current = timeRange;
                    setTimeRange('all');
                  }
                  // Restore saved timeRange when returning to price charts
                  else if (!wasPrice && isPrice) {
                    setTimeRange(priceTimeRangeRef.current);
                  }

                  setChartType(type);
                }}
                isActive={chartType === type}
                isMobile={isMobile}
                isDark={isDark}
              >
                {icon}
                {!isMobile &&
                  { holders: 'Holders', liquidity: 'TVL', candles: 'Candles', line: 'Line' }[type]}
              </Btn>
            ))}
          </div>
          <div style={btnGroupStyle}>
            {(isMobile
              ? ['1d', '5d', '1m', '1y', 'all']
              : ['1d', '5d', '1m', '3m', '1y', '5y', 'all']
            ).map((r) => (
              <Btn
                key={r}
                onClick={() => {
                  setTimeRange(r);
                  setIsUserZoomed(false);
                  // Save timeRange for price charts so it persists after TVL/Holders
                  if (chartType === 'candles' || chartType === 'line') {
                    priceTimeRangeRef.current = r;
                  }
                }}
                isActive={timeRange === r}
                isMobile={isMobile}
                isDark={isDark}
                minWidth={isMobile ? '24px' : '28px'}
              >
                {r.toUpperCase()}
              </Btn>
            ))}
          </div>
          <Btn
            onClick={handleFullscreen}
            isDark={isDark}
            isMobile={isMobile}
            style={
              isFullscreen ? { background: '#ef4444', borderColor: '#ef4444', color: '#fff' } : {}
            }
          >
            {isFullscreen ? <Minimize /> : <Maximize />}
            {isFullscreen && 'Exit'}
          </Btn>
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          height: isFullscreen ? 'calc(100vh - 80px)' : isMobile ? '360px' : '570px',
          borderRadius: '8px',
          overflow: 'hidden'
        }}
      >
        <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
        {loading && !chartRef.current && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Spinner size={20} />
          </div>
        )}
        {isLoadingMore && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '12px',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 8px',
              borderRadius: '6px',
              background: isDark ? 'rgba(10,15,22,0.9)' : 'rgba(255,255,255,0.95)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`
            }}
          >
            <Spinner size={11} />
            <span style={{ fontSize: '10px', opacity: 0.6 }}>Loading...</span>
          </div>
        )}
        {!loading &&
          !(chartType === 'holders'
            ? holderData?.length
            : chartType === 'liquidity'
              ? liquidityData?.length
              : data?.length) && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <BearEmptyState isDark={isDark} />
            </div>
          )}
      </div>

      {creatorEvents.length > 0 && chartType !== 'holders' && chartType !== 'liquidity' && (
        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', fontSize: '11px' }}>
          <span style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>Creator</span>
          {creatorEvents.slice(0, 12).map((e, i) => {
            const f = (n) => n >= 1e6 ? (n/1e6).toFixed(1)+'M' : n >= 1e3 ? (n/1e3).toFixed(0)+'K' : n < 1 ? n.toFixed(2) : Math.round(n);
            const t = e.time > 1e12 ? e.time : e.time * 1000;
            const d = Math.floor((Date.now() - t) / 1000);
            const ago = d < 60 ? d+'s' : d < 3600 ? Math.floor(d/60)+'m' : d < 86400 ? Math.floor(d/3600)+'h' : Math.floor(d/86400)+'d';
            const isXrpType = ['SELL','BUY','WITHDRAW','DEPOSIT','SEND','RECEIVE'].includes(e.type);
            const val = isXrpType && e.xrpAmount > 0.001 ? f(e.xrpAmount) + ' XRP' : e.tokenAmount > 0 ? f(e.tokenAmount) : '';
            return (
              <a key={e.hash || i} href={`https://xrpl.to/tx/${e.hash}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '4px', background: e.type === 'SELL' ? 'rgba(239,68,68,0.15)' : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', textDecoration: 'none', color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.8)' }}>
                <span style={{ color: e.color, fontWeight: 600, fontSize: '10px' }}>{e.type.replace('CHECK ','✓').replace('OTHER ','')}</span>
                {val && <span style={{ fontFamily: 'var(--font-mono)' }}>{val}</span>}
                <span style={{ opacity: 0.4 }}>{ago}</span>
              </a>
            );
          })}
          {creatorEvents.length > 12 && <span style={{ opacity: 0.4 }}>+{creatorEvents.length - 12}</span>}
        </div>
      )}

      {isFullscreen &&
        typeof document !== 'undefined' &&
        createPortal(
          <button
            onClick={handleFullscreen}
            style={{
              position: 'fixed',
              top: 16,
              right: 16,
              zIndex: 999999,
              padding: '8px 16px',
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 500
            }}
          >
            <Minimize size={16} />
            Exit
          </button>,
          document.body
        )}
    </Card>
  );
});

PriceChartAdvanced.displayName = 'PriceChartAdvanced';

export default PriceChartAdvanced;
