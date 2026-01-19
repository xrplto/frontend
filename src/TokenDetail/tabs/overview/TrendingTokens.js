import styled from '@emotion/styled';
import { useContext, useState, useEffect, useRef } from 'react';
import { AppContext } from 'src/AppContext';
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';
import axios from 'axios';

const SYMBOLS = { USD: '$', EUR: '€', JPY: '¥', CNH: '¥', XRP: '✕' };

const Container = styled('div')(({ isDark }) => ({
  borderRadius: '6px',
  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
  overflow: 'hidden'
}));

const TokenCard = styled('a')(({ isDark }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 10px',
  borderRadius: '4px',
  border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
  textDecoration: 'none',
  color: 'inherit',
  '&:hover': {
    background: isDark ? 'rgba(59,130,246,0.06)' : 'rgba(59,130,246,0.03)',
    borderColor: 'rgba(59,130,246,0.3)'
  }
}));

const BASE_URL = 'https://api.xrpl.to/v1';

// Formatters
const formatPrice = (price, currency, rate) => {
  if (!price) return `${SYMBOLS[currency]}0`;
  const p = currency === 'XRP' ? price : price / rate;
  const s = SYMBOLS[currency];
  if (p < 0.0001) {
    const zeros = -Math.floor(Math.log10(p)) - 1;
    const sig = Math.round(p * Math.pow(10, zeros + 4));
    return (
      <>
        {s}0.0<sub>{zeros}</sub>
        {sig}
      </>
    );
  }
  if (p < 1) return `${s}${p.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')}`;
  if (p >= 1e6) return `${s}${(p / 1e6).toFixed(1)}M`;
  if (p >= 1e3) return `${s}${(p / 1e3).toFixed(1)}K`;
  return `${s}${p < 100 ? p.toFixed(2) : Math.round(p)}`;
};

const TrendingTokens = ({ token = null }) => {
  const { darkMode, activeFiatCurrency } = useContext(AppContext);
  const metrics = useSelector(selectMetrics);
  const rate = metrics[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics.CNY : 1) || 1;

  const [tokens, setTokens] = useState([]);
  const [error, setError] = useState(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const ctrl = new AbortController();
    axios
      .get(
        `${BASE_URL}/tokens?start=0&limit=15&sortBy=trendingScore&sortType=desc&skipMetrics=true`,
        { signal: ctrl.signal }
      )
      .then((res) => {
        const list = res.data?.tokens || [];
        setTokens(token?.md5 ? list.filter((t) => t.md5 !== token.md5) : list);
      })
      .catch((err) => !axios.isCancel(err) && setError('Failed to load'));

    return () => ctrl.abort();
  }, [token?.md5]);

  if (error) {
    return (
      <Container isDark={darkMode} style={{ padding: '16px' }}>
        <div style={{ color: '#f44336', fontSize: '12px' }}>Failed to load trending tokens</div>
      </Container>
    );
  }

  if (!tokens.length) {
    return (
      <Container isDark={darkMode} style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '12px', opacity: 0.6 }}>No trending tokens</div>
      </Container>
    );
  }

  return (
    <Container isDark={darkMode}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 10px 6px',
          borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.3px',
              color: darkMode ? 'rgba(255,255,255,0.85)' : 'rgba(33,43,54,0.85)'
            }}
          >
            Trending
          </span>
          <span
            style={{
              height: 16,
              fontSize: '9px',
              background: 'rgba(34,197,94,0.12)',
              color: '#22c55e',
              fontWeight: 600,
              padding: '0 6px',
              borderRadius: '3px',
              display: 'inline-flex',
              alignItems: 'center'
            }}
          >
            LIVE
          </span>
        </div>
        <a
          href="/trending"
          style={{ fontSize: '11px', color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}
        >
          View All
        </a>
      </div>

      {/* Token List */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          padding: '8px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {tokens.slice(0, 12).map((t, i) => {
          const change = t.pro24h || 0;
          const isUp = change >= 0;

          return (
            <TokenCard
              key={t.md5 || i}
              href={`/token/${t.slug}`}
              isDark={darkMode}
              style={{ minWidth: 120, padding: '8px' }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '4px',
                  overflow: 'hidden',
                  flexShrink: 0
                }}
              >
                {t.md5 ? (
                  <img
                    src={`https://s1.xrpl.to/token/${t.md5}`}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentNode.textContent = t.user?.[0]?.toUpperCase();
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                    }}
                  >
                    {t.user?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {t.user}
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'
                  }}
                >
                  {formatPrice(t.exch, activeFiatCurrency, rate)}
                </div>
              </div>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: isUp ? '#22c55e' : '#ef4444',
                  flexShrink: 0
                }}
              >
                {isUp ? '+' : ''}
                {change.toFixed(1)}%
              </span>
            </TokenCard>
          );
        })}
      </div>
    </Container>
  );
};

export default TrendingTokens;
