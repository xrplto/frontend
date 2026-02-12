import React, { useContext, useEffect, useState, useMemo, useRef } from 'react';
import api from 'src/utils/api';
import { ThemeContext, WalletContext } from 'src/context/AppContext';
import { fNumber, fCurrency5 } from 'src/utils/formatters';
import { normalizeCurrencyCode } from 'src/utils/parseUtils';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from 'src/utils/cn';

// Format price with compact notation for small values (matches TokenSummary)
const formatPrice = (price) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (numPrice == null || isNaN(numPrice) || !isFinite(numPrice) || numPrice === 0) return '0';

  if (numPrice < 0.01) {
    const str = numPrice.toFixed(15);
    const zeros = str.match(/0\.0*/)?.[0]?.length - 2 || 0;
    if (zeros >= 4) {
      const significant = str.replace(/^0\.0+/, '').replace(/0+$/, '');
      return { compact: true, zeros, significant: significant.slice(0, 4) };
    }
    return numPrice.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
  } else if (numPrice < 1) {
    return numPrice.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
  } else if (numPrice < 100) {
    return numPrice.toFixed(2);
  } else if (numPrice >= 1e6) {
    return `${(numPrice / 1e6).toFixed(1)}M`;
  } else if (numPrice >= 1e3) {
    return `${(numPrice / 1e3).toFixed(1)}K`;
  }
  return Math.round(numPrice).toString();
};

// Render price with compact subscript notation
const PriceDisplay = ({ price, type }) => {
  const formatted = formatPrice(price);
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
      isDark ? 'bg-[#010815] border-white/[0.06] text-white/40' : 'bg-[#fafafa] border-black/[0.06] text-black/40',
      className
    )}
    {...p}
  >
    {children}
  </div>
);

const Row = ({ className, children, type, isUserOrder, onClick, ...p }) => (
  <div
    className={cn(
      'flex justify-between items-center px-4 py-1.5 relative cursor-pointer text-xs transition-all duration-200 border-l-2 font-mono',
      isUserOrder ? 'border-l-[#3b82f6]' : 'border-l-transparent',
      className
    )}
    style={{
      background: isUserOrder ? 'rgba(59, 130, 246, 0.12)' : 'transparent'
    }}
    onClick={onClick}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = isUserOrder
        ? 'rgba(59, 130, 246, 0.18)'
        : type === 'ask'
          ? 'rgba(239, 68, 68, 0.08)'
          : 'rgba(34, 197, 94, 0.08)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = isUserOrder ? 'rgba(59, 130, 246, 0.12)' : 'transparent';
    }}
    {...p}
  >
    {children}
  </div>
);

const DepthBar = ({ className, type, width, ...p }) => (
  <div
    className={cn(
      'absolute top-px bottom-px pointer-events-none transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
      type === 'bid' ? 'left-0' : 'right-0',
      type === 'ask' ? 'bg-red-500/[0.12]' : 'bg-green-500/[0.12]',
      className
    )}
    style={{ width: `${width}%` }}
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
    className={cn('relative z-[1] cursor-pointer w-[50px] text-right text-[10px] transition-colors duration-200 hover:text-[#3b82f6]', isDark ? 'text-white/[0.35]' : 'text-black/[0.35]', className)}
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

const BearEmptyState = ({ isDark, message }) => (
  <div className={cn(
    'flex flex-col items-center justify-center px-[20px] py-[40px] m-[12px] rounded-[12px] gap-[12px]',
    isDark
      ? 'bg-white/[0.02] border-[1.5px] border-dashed border-white/[0.06] text-white/40'
      : 'bg-black/[0.02] border-[1.5px] border-dashed border-black/[0.06] text-black/40'
  )}>
    <BookOpen size={24} className="opacity-30" />
    <span className="text-[11px] font-medium tracking-[0.05em] uppercase text-center">
      {message}
    </span>
  </div>
);

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
        .catch(() => { });
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
      .catch(() => fetchInFlight.delete(rlusdKey));
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

    setBids(parsedBids.slice(0, 30));
    setAsks(parsedAsks.slice(0, 30));
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
      limit: '30'
    });

    let ws = null;
    (async () => {
      try {
        const res = await fetch(`/api/ws/session?type=orderbook&${params}`);
        const { wsUrl } = await res.json();
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => setWsConnected(true);
        ws.onclose = () => setWsConnected(false);
        ws.onerror = () => setWsConnected(false);
        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'snapshot') {
              processWsOrderbook(msg.bids, msg.asks);
            } else if (msg.e === 'depth') {
              processWsOrderbook(msg.b, msg.a);
            }
          } catch {
            // Parse error
          }
        };
      } catch {
        // Session error
      }
    })();

    return () => {
      if (ws) ws.close();
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
        limit: '60'
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
        setBids(parsedBids.slice(0, 30));
        setAsks(parsedAsks.slice(0, 30));
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

  const bidMax = Math.max(...bids.map((b) => b.amount || 0), 1);
  const askMax = Math.max(...asks.map((a) => a.amount || 0), 1);

  // Auto-scroll asks to bottom (so lowest ask is visible near spread)
  useEffect(() => {
    if (asksSideRef.current && asks.length > 0) {
      asksSideRef.current.scrollTop = asksSideRef.current.scrollHeight;
    }
  }, [asks]);

  const isMPT = token?.tokenType === 'mpt';

  if (isMPT) {
    return <BearEmptyState isDark={isDark} message="MPT tokens don't support orderbook yet" />;
  }

  if (!bids.length && !asks.length) {
    return <BearEmptyState isDark={isDark} message="No orderbook data" />;
  }

  const displayToken = effectiveToken || token;

  return (
    <Container isDark={isDark}>
      <Header isDark={isDark}>
        <Title isDark={isDark} />
        <div className="flex items-center gap-[10px]">
          <div className={cn('flex rounded-[6px] p-[2px]', isDark ? 'bg-white/[0.05]' : 'bg-black/[0.05]')}>
            {[
              { id: 'both', label: 'Both' },
              { id: 'buy', label: 'Buy' },
              { id: 'sell', label: 'Sell' }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className="h-[24px] px-[8px] rounded-[4px] border-none cursor-pointer text-[10px] font-semibold transition-all duration-200 flex items-center gap-[4px]"
                style={{
                  background: viewMode === mode.id
                    ? (isDark ? 'rgba(255,255,255,0.1)' : '#fff')
                    : 'transparent',
                  color: viewMode === mode.id
                    ? (isDark ? '#fff' : '#000')
                    : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'),
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
            value={precision}
            onChange={(e) => setPrecision(Number(e.target.value))}
            className={cn(
              'py-[4px] pl-[10px] pr-[24px] rounded-[6px] text-[10px] font-medium cursor-pointer outline-none appearance-none bg-no-repeat transition-all duration-200',
              isDark
                ? 'bg-[#1a1f2e] text-white border border-white/10'
                : 'bg-[#f4f6f8] text-[#212B36] border border-black/10'
            )}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='${isDark ? '%23ffffff' : '%232c3e50'}' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundPosition: 'right 8px center'
            }}
          >
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
            {[...asks].reverse().map((ask, idx, arr) => {
              const acc = ask.account || ask.Account;
              const cumSum = arr.slice(0, idx + 1).reduce((s, a) => s + a.amount, 0);
              const avgPrice = arr.slice(0, idx + 1).reduce((s, a) => s + a.price * a.amount, 0) / cumSum;
              const rowKey = `ask-${idx}`;
              const nextAsk = arr[idx + 1];
              const showLimitLine = limitPrice && nextAsk && ask.price > limitPrice && nextAsk.price <= limitPrice;
              const isUserOrder = userAccount && acc === userAccount;
              return (
                <React.Fragment key={idx}>
                  <Row
                    type="ask"
                    isUserOrder={isUserOrder}
                    onClick={() => onPriceClick?.(ask.price)}
                    onMouseEnter={() => setHoveredRow(rowKey)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <DepthBar type="ask" width={(ask.amount / askMax) * 100} />
                    <PriceDisplay price={ask.price} type="ask" />
                    <Amount isDark={isDark}>{fNumber(ask.amount)}</Amount>
                    <Maker
                      isDark={isDark}
                      title={acc || ''}
                      onClick={(e) => {
                        e.stopPropagation();
                        acc && window.open(`/address/${acc}`, '_blank');
                      }}
                      style={isUserOrder ? { color: '#3b82f6', fontWeight: 600 } : {}}
                    >
                      {isUserOrder ? 'YOU' : acc ? `${acc.slice(1, 5)}\u2026${acc.slice(-2)}` : ''}
                    </Maker>
                    {hoveredRow === rowKey && (
                      <div className={cn(
                        'absolute left-1/2 -top-[28px] -translate-x-1/2 rounded-[6px] px-[8px] py-[4px] text-[9px] whitespace-nowrap z-10 shadow-[0_4px_12px_rgba(0,0,0,0.3)]',
                        isDark
                          ? 'bg-black/90 border border-white/10'
                          : 'bg-white/95 border border-black/10'
                      )}>
                        <span className={cn(isDark ? 'text-white/50' : 'text-black/50')}>{'\u03A3'} </span>
                        <span className="text-[#ef4444]">{fNumber(cumSum)}</span>
                        <span className={cn(isDark ? 'text-white/30' : 'text-black/30')}> {'\u00B7'} </span>
                        <span className={cn(isDark ? 'text-white/50' : 'text-black/50')}>Avg </span>
                        <span>{renderInlinePrice(avgPrice)}</span>
                      </div>
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
                <span className={cn('text-[10px]', isDark ? 'text-white/30' : 'text-black/30')}>SPREAD</span>
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
            {bids.map((bid, idx) => {
              const acc = bid.account || bid.Account;
              const cumSum = bids.slice(0, idx + 1).reduce((s, b) => s + b.amount, 0);
              const avgPrice = bids.slice(0, idx + 1).reduce((s, b) => s + b.price * b.amount, 0) / cumSum;
              const rowKey = `bid-${idx}`;
              const nextBid = bids[idx + 1];
              const showLimitLine = limitPrice && nextBid && bid.price > limitPrice && nextBid.price <= limitPrice;
              const isUserOrder = userAccount && acc === userAccount;
              return (
                <React.Fragment key={idx}>
                  <Row
                    type="bid"
                    isUserOrder={isUserOrder}
                    onClick={() => onPriceClick?.(bid.price)}
                    onMouseEnter={() => setHoveredRow(rowKey)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <DepthBar type="bid" width={(bid.amount / bidMax) * 100} />
                    <PriceDisplay price={bid.price} type="bid" />
                    <Amount isDark={isDark}>{fNumber(bid.amount)}</Amount>
                    <Maker
                      isDark={isDark}
                      title={acc || ''}
                      onClick={(e) => {
                        e.stopPropagation();
                        acc && window.open(`/address/${acc}`, '_blank');
                      }}
                      style={isUserOrder ? { color: '#3b82f6', fontWeight: 600 } : {}}
                    >
                      {isUserOrder ? 'YOU' : acc ? `${acc.slice(1, 5)}\u2026${acc.slice(-2)}` : ''}
                    </Maker>
                    {hoveredRow === rowKey && (
                      <div className={cn(
                        'absolute left-1/2 -top-[28px] -translate-x-1/2 rounded-[6px] px-[8px] py-[4px] text-[9px] whitespace-nowrap z-10 shadow-[0_4px_12px_rgba(0,0,0,0.3)]',
                        isDark
                          ? 'bg-black/90 border border-white/10'
                          : 'bg-white/95 border border-black/10'
                      )}>
                        <span className={cn(isDark ? 'text-white/50' : 'text-black/50')}>{'\u03A3'} </span>
                        <span className="text-[#22c55e]">{fNumber(cumSum)}</span>
                        <span className={cn(isDark ? 'text-white/30' : 'text-black/30')}> {'\u00B7'} </span>
                        <span className={cn(isDark ? 'text-white/50' : 'text-black/50')}>Avg </span>
                        <span>{renderInlinePrice(avgPrice)}</span>
                      </div>
                    )}
                  </Row>
                  {showLimitLine && <LimitPriceLine />}
                </React.Fragment>
              );
            })}
          </Side>
        )}
      </Content>
    </Container>
  );
};

export default OrderBook;
