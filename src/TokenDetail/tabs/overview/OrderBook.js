import React, { useContext, useEffect, useState, useMemo, useRef } from 'react';
import styled from '@emotion/styled';
import axios from 'axios';
import { AppContext } from 'src/AppContext';
import { fNumber, fCurrency5 } from 'src/utils/formatters';

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

const BASE_URL = 'https://api.xrpl.to/api';

const Container = styled.div`
  border-radius: 10px;
  border: 1px solid ${props => props.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
  overflow: hidden;
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
  display: flex;
  flex-direction: column;
`;

const Side = styled.div`
  max-height: 180px;
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
  background: ${props => props.isDark ? '#0a0a0a' : '#fafafa'};
  border-bottom: 1px solid ${props => props.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'};
  color: ${props => props.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'};
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3px 10px;
  position: relative;
  cursor: pointer;
  font-size: 11px;
  font-family: monospace;
  &:hover {
    background: ${props => props.type === 'ask'
      ? 'rgba(239, 68, 68, 0.08)'
      : 'rgba(34, 197, 94, 0.08)'};
  }
`;

const DepthBar = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  ${props => props.type === 'bid' ? 'left: 0;' : 'right: 0;'}
  background: ${props => props.type === 'ask'
    ? 'rgba(239, 68, 68, 0.1)'
    : 'rgba(34, 197, 94, 0.1)'};
  width: ${props => props.width}%;
  pointer-events: none;
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
  padding: 6px 12px;
  background: ${props => props.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'};
  border-top: 1px solid ${props => props.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'};
  border-bottom: 1px solid ${props => props.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'};
  font-size: 11px;
`;

const OrderBook = ({ token, onPriceClick }) => {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  const [bids, setBids] = useState([]);
  const [asks, setAsks] = useState([]);
  const asksSideRef = useRef(null);

  const pair = useMemo(() => ({
    curr1: { currency: 'XRP', issuer: 'XRPL' },
    curr2: token
  }), [token]);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchOrderbook() {
      const { curr1, curr2 } = pair;
      if (!curr1 || !curr2) return;

      try {
        const params = new URLSearchParams({
          base_currency: curr1.currency,
          quote_currency: curr2.currency,
          limit: '60'
        });
        if (curr1.currency !== 'XRP' && curr1.issuer) params.append('base_issuer', curr1.issuer);
        if (curr2.currency !== 'XRP' && curr2.issuer) params.append('quote_issuer', curr2.issuer);

        const res = await axios.get(`${BASE_URL}/orderbook?${params}`, { signal: controller.signal });

        if (res.data?.success) {
          // API returns pre-parsed data with price, amount, total fields
          // Filter out invalid entries where price is NaN
          const parsedBids = (res.data.bids || [])
            .map(o => ({
              price: parseFloat(o.price),
              amount: parseFloat(o.amount),
              total: parseFloat(o.total),
              account: o.account,
              funded: o.funded
            }))
            .filter(o => !isNaN(o.price) && o.price > 0);

          const parsedAsks = (res.data.asks || [])
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
        }
      } catch (err) {
        if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
          console.error('Orderbook fetch error:', err);
        }
      }
    }

    fetchOrderbook();
    const timer = setInterval(fetchOrderbook, 5000);

    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [pair]);

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

  if (!bids.length && !asks.length) return null;

  return (
    <Container isDark={isDark}>
      <Header isDark={isDark}>
        <Title isDark={isDark}>
          <BookOpen size={14} style={{ opacity: 0.7 }} />
          Order Book
        </Title>
        <span style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
          {bids.length} bids · {asks.length} asks
        </span>
      </Header>

      <Content>
        {/* Asks (Sell Orders) - reversed so lowest ask at bottom near spread */}
        <Side ref={asksSideRef}>
          <ColumnHeader isDark={isDark}>
            <span style={{ color: '#ef4444' }}>Ask (XRP)</span>
            <span>Amount</span>
            <span>Maker</span>
          </ColumnHeader>
          {[...asks].reverse().map((ask, idx) => (
            <Row
              key={idx}
              type="ask"
              onClick={() => onPriceClick?.(ask.price)}
            >
              <DepthBar type="ask" width={(ask.amount / askMax) * 100} />
              <Price type="ask">✕{formatPrice(ask.price)}</Price>
              <Amount isDark={isDark}>{fNumber(ask.amount)}</Amount>
              <Maker
                isDark={isDark}
                onClick={(e) => { e.stopPropagation(); ask.Account && window.open(`/profile/${ask.Account}`, '_blank'); }}
              >
                {ask.Account ? `${ask.Account.slice(0, 4)}...${ask.Account.slice(-3)}` : ''}
              </Maker>
            </Row>
          ))}
        </Side>

        {/* Spread indicator in middle */}
        <SpreadBar isDark={isDark}>
          <span style={{ color: '#22c55e' }}>▲ ✕{bestBid != null ? formatPrice(bestBid) : '—'}</span>
          <span style={{
            padding: '2px 8px',
            borderRadius: '4px',
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            fontWeight: 500
          }}>
            {spreadPct != null ? `${spreadPct.toFixed(2)}%` : '—'}
          </span>
          <span style={{ color: '#ef4444' }}>✕{bestAsk != null ? formatPrice(bestAsk) : '—'} ▼</span>
        </SpreadBar>

        {/* Bids (Buy Orders) - highest bid at top near spread */}
        <Side>
          <ColumnHeader isDark={isDark}>
            <span style={{ color: '#22c55e' }}>Bid (XRP)</span>
            <span>Amount</span>
            <span>Maker</span>
          </ColumnHeader>
          {bids.map((bid, idx) => (
            <Row
              key={idx}
              type="bid"
              onClick={() => onPriceClick?.(bid.price)}
            >
              <DepthBar type="bid" width={(bid.amount / bidMax) * 100} />
              <Price type="bid">✕{formatPrice(bid.price)}</Price>
              <Amount isDark={isDark}>{fNumber(bid.amount)}</Amount>
              <Maker
                isDark={isDark}
                onClick={(e) => { e.stopPropagation(); bid.Account && window.open(`/profile/${bid.Account}`, '_blank'); }}
              >
                {bid.Account ? `${bid.Account.slice(0, 4)}...${bid.Account.slice(-3)}` : ''}
              </Maker>
            </Row>
          ))}
        </Side>
      </Content>
    </Container>
  );
};

export default OrderBook;
