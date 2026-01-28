import React, { useContext, useEffect, useState, useMemo, useRef } from 'react';
import styled from '@emotion/styled';
import axios from 'axios';
import { AppContext } from 'src/context/AppContext';
import { fNumber, fCurrency5 } from 'src/utils/formatters';
import { Wifi, WifiOff } from 'lucide-react';

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

const Container = styled.div`
  overflow: hidden;
  height: 100%;
  min-height: 520px;
  display: flex;
  flex-direction: column;
  background: ${(props) => (props.isDark ? 'transparent' : '#fff')};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: ${(props) => (props.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)')};
  border-bottom: 1px solid
    ${(props) => (props.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')};
`;

const Title = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: ${(props) => (props.isDark ? '#fff' : '#212B36')};
  letter-spacing: 0.3px;
`;

const Content = styled.div`
  display: grid;
  grid-template-rows: 1fr auto 1fr;
  flex: 1;
  min-height: 0;
  overflow: hidden;
`;

const Side = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: ${(props) => (props.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')};
    border-radius: 10px;
  }
`;

const ColumnHeader = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 6px 16px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  position: sticky;
  top: 0;
  z-index: 2;
  background: ${(props) => (props.isDark ? '#010815' : '#fafafa')};
  border-bottom: 1px solid
    ${(props) => (props.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')};
  color: ${(props) => (props.isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)')};
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 16px;
  position: relative;
  cursor: pointer;
  font-size: 12px;
  font-family: var(--font-mono);
  transition: all 0.2s ease;
  &:hover {
    background: ${(props) =>
    props.type === 'ask' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(34, 197, 94, 0.08)'};
  }
`;

const DepthBar = styled.div`
  position: absolute;
  top: 1px;
  bottom: 1px;
  ${(props) => (props.type === 'bid' ? 'left: 0;' : 'right: 0;')}
  background: ${(props) =>
    props.type === 'ask' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)'};
  width: ${(props) => props.width}%;
  pointer-events: none;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
`;

const Price = styled.span`
  color: ${(props) => (props.type === 'ask' ? '#ff4d4f' : '#2ecc71')};
  position: relative;
  z-index: 1;
  font-weight: 500;
`;

const Amount = styled.span`
  color: ${(props) => (props.isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)')};
  position: relative;
  z-index: 1;
  text-align: right;
  flex: 1;
  margin-right: 24px;
`;

const Maker = styled.span`
  color: ${(props) => (props.isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)')};
  font-size: 10px;
  position: relative;
  z-index: 1;
  cursor: pointer;
  width: 50px;
  text-align: right;
  transition: color 0.2s;
  &:hover {
    color: #3b82f6;
  }
`;

const SpreadBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: ${(props) => (props.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)')};
  border-top: 1px solid ${(props) => (props.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')};
  border-bottom: 1px solid
    ${(props) => (props.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')};
  font-size: 11px;
  font-family: var(--font-mono);
  flex-shrink: 0;
  backdrop-filter: blur(4px);
`;

const BearEmptyState = ({ isDark, message }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    margin: '12px',
    borderRadius: '12px',
    background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
    border: `1.5px dashed ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
    color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
    gap: '12px'
  }}>
    <BookOpen size={24} style={{ opacity: 0.3 }} />
    <span style={{
      fontSize: '11px',
      fontWeight: 500,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      textAlign: 'center'
    }}>
      {message}
    </span>
  </div>
);

const OrderBook = ({ token, onPriceClick }) => {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

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
    console.log('[OrderBook] Fetching RLUSD token:', rlusdUrl);
    const promise = axios
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
    const wsUrl = `wss://api.xrpl.to/ws/orderbook?${params}`;
    console.log('[OrderBook] WS connecting:', wsUrl);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[OrderBook] WS connected');
      setWsConnected(true);
    };
    ws.onclose = () => {
      console.log('[OrderBook] WS closed');
      setWsConnected(false);
    };
    ws.onerror = (e) => {
      console.error('[OrderBook] WS error:', e);
      setWsConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'snapshot') {
          processWsOrderbook(msg.bids, msg.asks);
        } else if (msg.e === 'depth') {
          processWsOrderbook(msg.b, msg.a);
        }
      } catch (e) {
        console.error('OrderBook WS parse error:', e);
      }
    };

    return () => {
      ws.close();
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
      const t0 = performance.now();
      console.log('[OrderBook] HTTP fetch:', url);

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
      const fetchPromise = axios.get(url).then((r) => r.data);
      if (!isUpdate) {
        fetchInFlight.set(pairKey, fetchPromise);
      }

      try {
        const res = { data: await fetchPromise };

        if (!mountedRef.current) return;

        console.log(`[OrderBook] HTTP done in ${(performance.now() - t0).toFixed(0)}ms, bids=${res.data?.bids?.length || 0} asks=${res.data?.asks?.length || 0}`);
        if (res.data?.success) {
          processOrderbookData(res.data);
        }
        fetchInFlight.delete(pairKey);
      } catch (err) {
        fetchInFlight.delete(pairKey);
        if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
          console.error('[OrderBook] HTTP error:', err.message);
        }
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: '6px', padding: '2px' }}>
            {[
              { id: 'both', label: 'Both' },
              { id: 'buy', label: 'Buy' },
              { id: 'sell', label: 'Sell' }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                style={{
                  height: '24px',
                  padding: '0 8px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  background: viewMode === mode.id
                    ? (isDark ? 'rgba(255,255,255,0.1)' : '#fff')
                    : 'transparent',
                  color: viewMode === mode.id
                    ? (isDark ? '#fff' : '#000')
                    : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'),
                  boxShadow: viewMode === mode.id && !isDark ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {mode.id === 'both' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5px' }}>
                    <div style={{ width: '8px', height: '2px', background: '#ff4d4f', borderRadius: '1px' }} />
                    <div style={{ width: '8px', height: '2px', background: '#2ecc71', borderRadius: '1px' }} />
                  </div>
                )}
                {mode.id === 'buy' && <div style={{ width: '8px', height: '6px', background: '#2ecc71', borderRadius: '1px' }} />}
                {mode.id === 'sell' && <div style={{ width: '8px', height: '6px', background: '#ff4d4f', borderRadius: '1px' }} />}
                {mode.label}
              </button>
            ))}
          </div>
          <select
            value={precision}
            onChange={(e) => setPrecision(Number(e.target.value))}
            style={{
              padding: '4px 24px 4px 10px',
              borderRadius: '6px',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              fontSize: '10px',
              fontWeight: 500,
              background: isDark ? '#1a1f2e' : '#f4f6f8',
              color: isDark ? '#fff' : '#212B36',
              cursor: 'pointer',
              outline: 'none',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='${isDark ? '%23ffffff' : '%232c3e50'}' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 8px center',
              transition: 'all 0.2s'
            }}
          >
            <option value={4} style={{ background: isDark ? '#1a1f2e' : '#fff', color: isDark ? '#fff' : '#000' }}>4 Decimals</option>
            <option value={6} style={{ background: isDark ? '#1a1f2e' : '#fff', color: isDark ? '#fff' : '#000' }}>6 Decimals</option>
            <option value={8} style={{ background: isDark ? '#1a1f2e' : '#fff', color: isDark ? '#fff' : '#000' }}>8 Decimals</option>
          </select>
        </div>
      </Header>

      <Content style={{ gridTemplateRows: viewMode === 'both' ? '1fr auto 1fr' : '1fr' }}>
        {/* Asks (Sell Orders) */}
        {(viewMode === 'both' || viewMode === 'sell') && (
          <Side ref={asksSideRef} type="asks">
            <ColumnHeader isDark={isDark}>
              <span style={{ color: '#ff4d4f' }}>Price (XRP)</span>
              <span>Size ({displayToken?.currency?.slice(0, 8) || 'Token'})</span>
              <span>Maker</span>
            </ColumnHeader>
            {[...asks].reverse().map((ask, idx, arr) => {
              const acc = ask.account || ask.Account;
              const cumSum = arr.slice(0, idx + 1).reduce((s, a) => s + a.amount, 0);
              const avgPrice = arr.slice(0, idx + 1).reduce((s, a) => s + a.price * a.amount, 0) / cumSum;
              const rowKey = `ask-${idx}`;
              return (
                <Row
                  key={idx}
                  type="ask"
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
                  >
                    {acc ? `${acc.slice(1, 5)}…${acc.slice(-2)}` : ''}
                  </Maker>
                  {hoveredRow === rowKey && (
                    <div style={{
                      position: 'absolute',
                      left: '50%',
                      top: '-28px',
                      transform: 'translateX(-50%)',
                      background: isDark ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.95)',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '9px',
                      whiteSpace: 'nowrap',
                      zIndex: 10,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }}>
                      <span style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>Σ </span>
                      <span style={{ color: '#ef4444' }}>{fNumber(cumSum)}</span>
                      <span style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}> · </span>
                      <span style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>Avg </span>
                      <span>{renderInlinePrice(avgPrice)}</span>
                    </div>
                  )}
                </Row>
              );
            })}
          </Side>
        )}

        {/* Spread indicator */}
        {viewMode === 'both' && (
          <SpreadBar isDark={isDark}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', fontSize: '10px' }}>SPREAD</span>
              <span style={{ color: isDark ? '#fff' : '#000', fontWeight: 600 }}>
                {spreadPct != null ? `${spreadPct.toFixed(3)}%` : '—'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <span style={{ color: '#2ecc71' }}>{bestBid != null ? renderInlinePrice(bestBid) : '—'}</span>
              <span style={{ color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>/</span>
              <span style={{ color: '#ff4d4f' }}>{bestAsk != null ? renderInlinePrice(bestAsk) : '—'}</span>
            </div>
          </SpreadBar>
        )}

        {/* Bids (Buy Orders) */}
        {(viewMode === 'both' || viewMode === 'buy') && (
          <Side type="bids">
            <ColumnHeader isDark={isDark}>
              <span style={{ color: '#2ecc71' }}>Price (XRP)</span>
              <span>Size ({displayToken?.currency?.slice(0, 8) || 'Token'})</span>
              <span>Maker</span>
            </ColumnHeader>
            {bids.map((bid, idx) => {
              const acc = bid.account || bid.Account;
              const cumSum = bids.slice(0, idx + 1).reduce((s, b) => s + b.amount, 0);
              const avgPrice = bids.slice(0, idx + 1).reduce((s, b) => s + b.price * b.amount, 0) / cumSum;
              const rowKey = `bid-${idx}`;
              return (
                <Row
                  key={idx}
                  type="bid"
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
                  >
                    {acc ? `${acc.slice(1, 5)}…${acc.slice(-2)}` : ''}
                  </Maker>
                  {hoveredRow === rowKey && (
                    <div style={{
                      position: 'absolute',
                      left: '50%',
                      top: '-28px',
                      transform: 'translateX(-50%)',
                      background: isDark ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.95)',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '9px',
                      whiteSpace: 'nowrap',
                      zIndex: 10,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }}>
                      <span style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>Σ </span>
                      <span style={{ color: '#22c55e' }}>{fNumber(cumSum)}</span>
                      <span style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}> · </span>
                      <span style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>Avg </span>
                      <span>{renderInlinePrice(avgPrice)}</span>
                    </div>
                  )}
                </Row>
              );
            })}
          </Side>
        )}
      </Content>
    </Container>
  );
};

export default OrderBook;
