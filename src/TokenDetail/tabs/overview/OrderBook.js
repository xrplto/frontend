import React, { useContext, useEffect, useState, useMemo, useRef } from 'react';
import styled from '@emotion/styled';
import axios from 'axios';
import { AppContext } from 'src/AppContext';
import { fNumber, fCurrency5 } from 'src/utils/formatters';
import { Wifi, WifiOff } from 'lucide-react';

// Format price with enough decimals for small values (no scientific notation)
const formatPrice = (price) => {
  if (!price || isNaN(price)) return '0';
  const absPrice = Math.abs(price);
  if (absPrice >= 1) return price.toFixed(4);
  if (absPrice >= 0.001) return price.toFixed(6);
  if (absPrice >= 0.000001) return price.toFixed(10);
  return price.toFixed(14);
};
import { BookOpen } from 'lucide-react';

const BASE_URL = 'https://api.xrpl.to/v1';
const fetchInFlight = new Map();

const Container = styled.div`
  border-radius: 12px;
  border: 1px solid ${(props) => (props.isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb')};
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: ${(props) => (props.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)')};
  border-bottom: 1px solid
    ${(props) => (props.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')};
`;

const Title = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 500;
  color: ${(props) => (props.isDark ? 'rgba(255,255,255,0.7)' : '#212B36')};
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
    display: none;
  }
`;

const ColumnHeader = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 4px 10px;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: sticky;
  top: 0;
  z-index: 2;
  background: ${(props) => (props.isDark ? '#010815' : '#fafafa')};
  border-bottom: 1px solid
    ${(props) => (props.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')};
  color: ${(props) => (props.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)')};
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  position: relative;
  cursor: pointer;
  font-size: 12px;
  font-family: var(--font-mono);
  transition: background 0.1s;
  &:hover {
    background: ${(props) =>
      props.type === 'ask' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)'};
  }
`;

const DepthBar = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  ${(props) => (props.type === 'bid' ? 'left: 0;' : 'right: 0;')}
  background: ${(props) =>
    props.type === 'ask' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)'};
  width: ${(props) => props.width}%;
  pointer-events: none;
  transition: width 0.2s ease-out;
`;

const Price = styled.span`
  color: ${(props) => (props.type === 'ask' ? '#ef4444' : '#22c55e')};
  position: relative;
  z-index: 1;
`;

const Amount = styled.span`
  color: ${(props) => (props.isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)')};
  position: relative;
  z-index: 1;
`;

const Maker = styled.span`
  color: ${(props) => (props.isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)')};
  font-size: 9px;
  position: relative;
  z-index: 1;
  cursor: pointer;
  &:hover {
    color: #3b82f6;
  }
`;

const SpreadBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: ${(props) => (props.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)')};
  border-top: 1px solid ${(props) => (props.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')};
  border-bottom: 1px solid
    ${(props) => (props.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')};
  font-size: 11px;
  font-family: var(--font-mono);
  flex-shrink: 0;
`;

const OrderBook = ({ token, onPriceClick }) => {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  const [bids, setBids] = useState([]);
  const [asks, setAsks] = useState([]);
  const asksSideRef = useRef(null);
  const [rlusdToken, setRlusdToken] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [viewMode, setViewMode] = useState('both'); // 'both', 'buy', 'sell'
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
        .catch(() => {});
      return () => {
        mounted = false;
      };
    }

    const promise = axios
      .get(
        `${BASE_URL}/token/rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De-524C555344000000000000000000000000000000`
      )
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
    if (!effectiveToken?.issuer || !effectiveToken?.currency) {
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
    const ws = new WebSocket(wsUrl);
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
    if (!tokenMd5 || !effectiveToken?.issuer || wsConnected) return;

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
        } catch {}
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

        if (res.data?.success) {
          processOrderbookData(res.data);
        }
        fetchInFlight.delete(pairKey);
      } catch (err) {
        fetchInFlight.delete(pairKey);
        if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
          console.error('Orderbook fetch error:', err);
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

  if (!bids.length && !asks.length) {
    return null;
  }

  const displayToken = effectiveToken || token;

  return (
    <Container isDark={isDark}>
      <Header isDark={isDark}>
        <Title isDark={isDark}>
          <BookOpen size={14} style={{ opacity: 0.7 }} />
          {isXRPToken ? 'RLUSD/XRP' : 'Order Book'}
        </Title>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ display: 'flex', gap: '1px', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', borderRadius: '4px', padding: '2px' }}>
            {['both', 'buy', 'sell'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                title={mode === 'both' ? 'Both sides' : mode === 'buy' ? 'Bids only' : 'Asks only'}
                style={{
                  width: '22px',
                  height: '18px',
                  borderRadius: '3px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  padding: '3px',
                  background: viewMode === mode ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)') : 'transparent'
                }}
              >
                {mode === 'both' && (
                  <>
                    <span style={{ width: '12px', height: '3px', borderRadius: '1px', background: viewMode === mode ? '#ef4444' : isDark ? 'rgba(239,68,68,0.4)' : 'rgba(239,68,68,0.5)' }} />
                    <span style={{ width: '12px', height: '3px', borderRadius: '1px', background: viewMode === mode ? '#22c55e' : isDark ? 'rgba(34,197,94,0.4)' : 'rgba(34,197,94,0.5)' }} />
                  </>
                )}
                {mode === 'sell' && (
                  <>
                    <span style={{ width: '12px', height: '3px', borderRadius: '1px', background: viewMode === mode ? '#ef4444' : isDark ? 'rgba(239,68,68,0.4)' : 'rgba(239,68,68,0.5)' }} />
                    <span style={{ width: '12px', height: '3px', borderRadius: '1px', background: viewMode === mode ? '#ef4444' : isDark ? 'rgba(239,68,68,0.4)' : 'rgba(239,68,68,0.5)' }} />
                  </>
                )}
                {mode === 'buy' && (
                  <>
                    <span style={{ width: '12px', height: '3px', borderRadius: '1px', background: viewMode === mode ? '#22c55e' : isDark ? 'rgba(34,197,94,0.4)' : 'rgba(34,197,94,0.5)' }} />
                    <span style={{ width: '12px', height: '3px', borderRadius: '1px', background: viewMode === mode ? '#22c55e' : isDark ? 'rgba(34,197,94,0.4)' : 'rgba(34,197,94,0.5)' }} />
                  </>
                )}
              </button>
            ))}
          </div>
          <select
            value={precision}
            onChange={(e) => setPrecision(Number(e.target.value))}
            style={{
              padding: '3px 6px',
              borderRadius: '4px',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              fontSize: '9px',
              background: isDark ? '#1a1f2e' : '#f5f5f5',
              color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
              cursor: 'pointer',
              outline: 'none',
              appearance: 'none',
              WebkitAppearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 24 24' fill='none' stroke='${isDark ? '%23ffffff60' : '%2300000060'}' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 4px center',
              paddingRight: '18px'
            }}
          >
            <option value={4} style={{ background: isDark ? '#1a1f2e' : '#f5f5f5', color: isDark ? '#fff' : '#000' }}>0.0001</option>
            <option value={6} style={{ background: isDark ? '#1a1f2e' : '#f5f5f5', color: isDark ? '#fff' : '#000' }}>0.000001</option>
            <option value={8} style={{ background: isDark ? '#1a1f2e' : '#f5f5f5', color: isDark ? '#fff' : '#000' }}>0.00000001</option>
          </select>
        </div>
      </Header>

      <Content style={{ gridTemplateRows: viewMode === 'both' ? '1fr auto 1fr' : '1fr' }}>
        {/* Asks (Sell Orders) */}
        {(viewMode === 'both' || viewMode === 'sell') && (
          <Side ref={asksSideRef} type="asks">
            <ColumnHeader isDark={isDark}>
              <span style={{ color: '#ef4444' }}>XRP</span>
              <span>{displayToken?.name || displayToken?.currency || 'Token'}</span>
              <span>By</span>
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
                  <Price type="ask">{ask.price.toFixed(precision)}</Price>
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
                      <span>{avgPrice.toFixed(precision)}</span>
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
            <span style={{ color: '#22c55e' }}>
              ▲ ✕{bestBid != null ? formatPrice(bestBid) : '—'}
            </span>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: '8px',
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                fontWeight: 500
              }}
            >
              {spreadPct != null ? `${spreadPct.toFixed(2)}%` : '—'}
            </span>
            <span style={{ color: '#ef4444' }}>
              ✕{bestAsk != null ? formatPrice(bestAsk) : '—'} ▼
            </span>
          </SpreadBar>
        )}

        {/* Bids (Buy Orders) */}
        {(viewMode === 'both' || viewMode === 'buy') && (
          <Side type="bids">
            <ColumnHeader isDark={isDark}>
              <span style={{ color: '#22c55e' }}>XRP</span>
              <span>{displayToken?.name || displayToken?.currency || 'Token'}</span>
              <span>By</span>
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
                  <Price type="bid">{bid.price.toFixed(precision)}</Price>
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
                      <span>{avgPrice.toFixed(precision)}</span>
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
