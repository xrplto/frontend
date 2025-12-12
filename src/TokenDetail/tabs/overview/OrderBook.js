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
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';

const BASE_URL = 'https://api.xrpl.to/api';

// Module-level cache to prevent duplicate fetches in StrictMode
const fetchInFlight = new Map();

const Container = styled.div`
  border-radius: 12px;
  border: 1.5px solid ${props => props.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
  overflow: hidden;
  height: calc(100% - 24px);
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: ${props => props.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'};
  border-bottom: 1px solid ${props => props.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'};
`;

const Title = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: ${props => props.isDark ? 'rgba(255,255,255,0.9)' : '#212B36'};
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
  &::-webkit-scrollbar { display: none; }
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
  background: ${props => props.isDark ? '#010815' : '#fafafa'};
  border-bottom: 1px solid ${props => props.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'};
  color: ${props => props.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'};
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  position: relative;
  cursor: pointer;
  font-size: 12px;
  font-family: monospace;
  transition: background 0.1s;
  &:hover {
    background: ${props => props.type === 'ask'
      ? 'rgba(239, 68, 68, 0.12)'
      : 'rgba(34, 197, 94, 0.12)'};
  }
`;

const DepthBar = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  ${props => props.type === 'bid' ? 'left: 0;' : 'right: 0;'}
  background: ${props => props.type === 'ask'
    ? 'rgba(239, 68, 68, 0.15)'
    : 'rgba(34, 197, 94, 0.15)'};
  width: ${props => props.width}%;
  pointer-events: none;
  transition: width 0.2s ease-out;
`;

const Price = styled.span`
  color: ${props => props.type === 'ask' ? '#ef4444' : '#22c55e'};
  position: relative;
  z-index: 1;
`;

const Amount = styled.span`
  color: ${props => props.isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)'};
  position: relative;
  z-index: 1;
`;

const Maker = styled.span`
  color: ${props => props.isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'};
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
  background: ${props => props.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'};
  border-top: 1px solid ${props => props.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
  border-bottom: 1px solid ${props => props.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
  font-size: 11px;
  font-family: monospace;
  flex-shrink: 0;
`;

const CollapseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 8px;
  border: none;
  background: ${props => props.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'};
  color: ${props => props.isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'};
  cursor: pointer;
  transition: all 0.15s;
  &:hover {
    background: ${props => props.isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.15)'};
    color: #3b82f6;
  }
`;

const CollapsedBar = styled.div`
  width: 36px;
  height: 100%;
  border-radius: 12px;
  border: 1px solid ${props => props.isDark ? '#4b5563' : '#9ca3af'};
  background: ${props => props.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'};
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0;
  gap: 8px;
  cursor: pointer;
  transition: all 0.15s;
  &:hover {
    border-color: #3b82f6;
    background: rgba(59,130,246,0.05);
  }
`;

const VerticalText = styled.span`
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-size: 11px;
  font-weight: 500;
  color: ${props => props.isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'};
  letter-spacing: 1px;
`;

const OrderBook = ({ token, onPriceClick, collapsed, onToggleCollapse }) => {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  const [bids, setBids] = useState([]);
  const [asks, setAsks] = useState([]);
  const asksSideRef = useRef(null);
  const [rlusdToken, setRlusdToken] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);

  // XRP is native asset - show RLUSD/XRP orderbook instead
  const isXRPToken = token?.currency === 'XRP';

  // Fetch RLUSD when viewing XRP
  useEffect(() => {
    if (!isXRPToken || collapsed) return;
    let mounted = true;
    const rlusdKey = 'rlusd-token';

    if (fetchInFlight.has(rlusdKey)) {
      fetchInFlight.get(rlusdKey)
        .then(token => mounted && token && setRlusdToken(token))
        .catch(() => {});
      return () => { mounted = false; };
    }

    const promise = axios.get(`${BASE_URL}/token/rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De-524C555344000000000000000000000000000000`)
      .then(res => res.data?.token);
    fetchInFlight.set(rlusdKey, promise);

    promise
      .then(token => { mounted && token && setRlusdToken(token); fetchInFlight.delete(rlusdKey); })
      .catch(() => fetchInFlight.delete(rlusdKey));
    return () => { mounted = false; };
  }, [isXRPToken, collapsed]);

  const effectiveToken = isXRPToken ? rlusdToken : token;
  const tokenMd5 = effectiveToken?.md5;

  // Ref to track last data hash for smart polling (skip updates when data unchanged)
  const lastDataHashRef = useRef(null);
  const mountedRef = useRef(true);

  // Process WebSocket orderbook data
  const processWsOrderbook = (rawBids, rawAsks) => {
    const parsedBids = (rawBids || [])
      .map(o => ({
        price: parseFloat(o.price),
        amount: parseFloat(o.amount),
        total: parseFloat(o.total),
        account: o.account,
        funded: o.funded
      }))
      .filter(o => !isNaN(o.price) && o.price > 0);

    const parsedAsks = (rawAsks || [])
      .map(o => ({
        price: parseFloat(o.price),
        amount: parseFloat(o.amount),
        total: parseFloat(o.total),
        account: o.account,
        funded: o.funded
      }))
      .filter(o => !isNaN(o.price) && o.price > 0);

    let bidSum = 0, askSum = 0;
    parsedBids.forEach(b => { bidSum += b.amount; b.sumAmount = bidSum; });
    parsedAsks.forEach(a => { askSum += a.amount; a.sumAmount = askSum; });

    setBids(parsedBids.slice(0, 30));
    setAsks(parsedAsks.slice(0, 30));
  };

  // WebSocket for real-time orderbook updates
  useEffect(() => {
    if (collapsed || !effectiveToken?.issuer || !effectiveToken?.currency) {
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
  }, [effectiveToken?.issuer, effectiveToken?.currency, collapsed]);

  // HTTP polling fallback (only when WebSocket not connected)
  useEffect(() => {
    mountedRef.current = true;
    // Don't fetch if collapsed, no token, or WebSocket is connected
    if (collapsed || !tokenMd5 || !effectiveToken?.issuer || wsConnected) return;

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
      const fetchPromise = axios.get(url).then(r => r.data);
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
        .map(o => ({
          price: parseFloat(o.price),
          amount: parseFloat(o.amount),
          total: parseFloat(o.total),
          account: o.account,
          funded: o.funded
        }))
        .filter(o => !isNaN(o.price) && o.price > 0);

      const parsedAsks = (data.asks || [])
        .map(o => ({
          price: parseFloat(o.price),
          amount: parseFloat(o.amount),
          total: parseFloat(o.total),
          account: o.account,
          funded: o.funded
        }))
        .filter(o => !isNaN(o.price) && o.price > 0);

      // Smart polling: compute simple hash to detect actual changes
      const newHash = `${parsedBids.length}-${parsedAsks.length}-${parsedBids[0]?.price || 0}-${parsedAsks[0]?.price || 0}`;
      if (newHash === lastDataHashRef.current) return;
      lastDataHashRef.current = newHash;

      let bidSum = 0, askSum = 0;
      parsedBids.forEach(b => { bidSum += b.amount; b.sumAmount = bidSum; });
      parsedAsks.forEach(a => { askSum += a.amount; a.sumAmount = askSum; });

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
  }, [tokenMd5, collapsed, effectiveToken?.issuer, wsConnected]);

  const { bestBid, bestAsk, spreadPct } = useMemo(() => {
    const bb = bids.length ? bids[0].price : null;
    const ba = asks.length ? asks[0].price : null;
    const mid = bb != null && ba != null ? (bb + ba) / 2 : null;
    const spread = bb != null && ba != null && mid ? ((ba - bb) / mid) * 100 : null;
    return { bestBid: bb, bestAsk: ba, spreadPct: spread };
  }, [asks, bids]);

  const bidMax = Math.max(...bids.map(b => b.amount || 0), 1);
  const askMax = Math.max(...asks.map(a => a.amount || 0), 1);

  // Auto-scroll asks to bottom (so lowest ask is visible near spread)
  useEffect(() => {
    if (asksSideRef.current && asks.length > 0) {
      asksSideRef.current.scrollTop = asksSideRef.current.scrollHeight;
    }
  }, [asks]);

  if (!bids.length && !asks.length) {
    // Show collapsed bar even with no data if collapse is enabled
    if (collapsed && onToggleCollapse) {
      return (
        <CollapsedBar isDark={isDark} onClick={onToggleCollapse} title="Expand Order Book">
          <ChevronRight size={16} style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }} />
          <BookOpen size={14} style={{ opacity: 0.7, color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }} />
          <VerticalText isDark={isDark}>ORDER BOOK</VerticalText>
        </CollapsedBar>
      );
    }
    return null;
  }

  const displayToken = effectiveToken || token;

  // Collapsed view - vertical bar
  if (collapsed) {
    return (
      <CollapsedBar isDark={isDark} onClick={onToggleCollapse} title="Expand Order Book">
        <ChevronRight size={16} style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }} />
        <BookOpen size={14} style={{ opacity: 0.7, color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }} />
        <VerticalText isDark={isDark}>ORDER BOOK</VerticalText>
        <span style={{
          writingMode: 'vertical-rl',
          fontSize: '9px',
          color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
          marginTop: '8px'
        }}>
          {bids.length}B · {asks.length}A
        </span>
      </CollapsedBar>
    );
  }

  return (
    <Container isDark={isDark}>
      <Header isDark={isDark}>
        <Title isDark={isDark}>
          <BookOpen size={14} style={{ opacity: 0.7 }} />
          {isXRPToken ? 'RLUSD/XRP' : 'Order Book'}
        </Title>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 6px',
            borderRadius: '4px',
            background: wsConnected ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)',
            color: wsConnected ? '#22c55e' : (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'),
            fontSize: '9px'
          }}>
            {wsConnected ? <Wifi size={10} /> : <WifiOff size={10} />}
          </div>
          <span style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
            {bids.length}B · {asks.length}A
          </span>
          {onToggleCollapse && (
            <CollapseButton isDark={isDark} onClick={onToggleCollapse} title="Collapse Order Book">
              <ChevronLeft size={14} />
            </CollapseButton>
          )}
        </div>
      </Header>

      <Content>
        {/* Asks (Sell Orders) - reversed so lowest ask at bottom near spread */}
        <Side ref={asksSideRef} type="asks">
          <ColumnHeader isDark={isDark}>
            <span style={{ color: '#ef4444' }}>XRP</span>
            <span>{displayToken?.name || displayToken?.currency || 'Token'}</span>
            <span>By</span>
          </ColumnHeader>
          {[...asks].reverse().map((ask, idx) => {
            const acc = ask.account || ask.Account;
            return (
              <Row
                key={idx}
                type="ask"
                onClick={() => onPriceClick?.(ask.price)}
              >
                <DepthBar type="ask" width={(ask.amount / askMax) * 100} />
                <Price type="ask">{formatPrice(ask.price)}</Price>
                <Amount isDark={isDark}>{fNumber(ask.amount)}</Amount>
                <Maker
                  isDark={isDark}
                  title={acc || ''}
                  onClick={(e) => { e.stopPropagation(); acc && window.open(`/profile/${acc}`, '_blank'); }}
                >
                  {acc ? `${acc.slice(1, 5)}…${acc.slice(-2)}` : ''}
                </Maker>
              </Row>
            );
          })}
        </Side>

        {/* Spread indicator in middle */}
        <SpreadBar isDark={isDark}>
          <span style={{ color: '#22c55e' }}>▲ ✕{bestBid != null ? formatPrice(bestBid) : '—'}</span>
          <span style={{
            padding: '2px 8px',
            borderRadius: '8px',
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            fontWeight: 500
          }}>
            {spreadPct != null ? `${spreadPct.toFixed(2)}%` : '—'}
          </span>
          <span style={{ color: '#ef4444' }}>✕{bestAsk != null ? formatPrice(bestAsk) : '—'} ▼</span>
        </SpreadBar>

        {/* Bids (Buy Orders) - highest bid at top near spread */}
        <Side type="bids">
          <ColumnHeader isDark={isDark}>
            <span style={{ color: '#22c55e' }}>XRP</span>
            <span>{displayToken?.name || displayToken?.currency || 'Token'}</span>
            <span>By</span>
          </ColumnHeader>
          {bids.map((bid, idx) => {
            const acc = bid.account || bid.Account;
            return (
              <Row
                key={idx}
                type="bid"
                onClick={() => onPriceClick?.(bid.price)}
              >
                <DepthBar type="bid" width={(bid.amount / bidMax) * 100} />
                <Price type="bid">{formatPrice(bid.price)}</Price>
                <Amount isDark={isDark}>{fNumber(bid.amount)}</Amount>
                <Maker
                  isDark={isDark}
                  title={acc || ''}
                  onClick={(e) => { e.stopPropagation(); acc && window.open(`/profile/${acc}`, '_blank'); }}
                >
                  {acc ? `${acc.slice(1, 5)}…${acc.slice(-2)}` : ''}
                </Maker>
              </Row>
            );
          })}
        </Side>
      </Content>
    </Container>
  );
};

export default OrderBook;
