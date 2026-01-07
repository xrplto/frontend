import styled from '@emotion/styled';
import { useContext, useState, useEffect, useMemo, useRef } from 'react';
import { AppContext } from 'src/AppContext';
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';
import axios from 'axios';

const SYMBOLS = { USD: '$', EUR: '€', JPY: '¥', CNH: '¥', XRP: '✕' };

const Container = styled('div')(({ isDark }) => ({
  borderRadius: '12px',
  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
  overflow: 'hidden'
}));

const TokenCard = styled('a')(({ isDark }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 10px',
  borderRadius: '8px',
  border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
  textDecoration: 'none',
  color: 'inherit',
  '&:hover': {
    background: isDark ? 'rgba(59,130,246,0.06)' : 'rgba(59,130,246,0.03)',
    borderColor: 'rgba(59,130,246,0.3)'
  }
}));

const RANK_COLORS = {
  1: { bg: 'rgba(234,179,8,0.15)', color: '#eab308', border: 'rgba(234,179,8,0.3)' },
  2: { bg: 'rgba(156,163,175,0.15)', color: '#9ca3af', border: 'rgba(156,163,175,0.3)' },
  3: { bg: 'rgba(249,115,22,0.15)', color: '#f97316', border: 'rgba(249,115,22,0.3)' }
};

const BASE_URL = 'https://api.xrpl.to/api';

// Formatters
const formatPrice = (price, currency, rate) => {
  if (!price) return `${SYMBOLS[currency]}0`;
  const p = currency === 'XRP' ? price : price / rate;
  const s = SYMBOLS[currency];
  if (p < 0.0001) {
    const zeros = -Math.floor(Math.log10(p)) - 1;
    const sig = Math.round(p * Math.pow(10, zeros + 4));
    return <>{s}0.0<sub>{zeros}</sub>{sig}</>;
  }
  if (p < 1) return `${s}${p.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')}`;
  if (p >= 1e6) return `${s}${(p / 1e6).toFixed(1)}M`;
  if (p >= 1e3) return `${s}${(p / 1e3).toFixed(1)}K`;
  return `${s}${p < 100 ? p.toFixed(2) : Math.round(p)}`;
};

const formatCompact = (val, currency, rate) => {
  if (!val) return '—';
  const v = currency === 'XRP' ? val : val / rate;
  const s = SYMBOLS[currency];
  if (v >= 1e9) return `${s}${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${s}${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${s}${(v / 1e3).toFixed(1)}K`;
  return `${s}${Math.round(v)}`;
};

const TrendingTokens = ({ horizontal = false, token = null }) => {
  const { darkMode, activeFiatCurrency } = useContext(AppContext);
  const metrics = useSelector(selectMetrics);
  const rate = metrics[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics.CNY : 1) || 1;

  const [tokens, setTokens] = useState([]);
  const [error, setError] = useState(null);
  const fetchedRef = useRef(false);

  const isMobile = useMemo(() => typeof window !== 'undefined' && window.innerWidth < 600, []);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const ctrl = new AbortController();
    axios.get(`${BASE_URL}/tokens?start=0&limit=15&sortBy=trendingScore&sortType=desc&skipMetrics=true`, { signal: ctrl.signal })
      .then(res => {
        const list = res.data?.tokens || [];
        setTokens(token?.md5 ? list.filter(t => t.md5 !== token.md5) : list);
      })
      .catch(err => !axios.isCancel(err) && setError('Failed to load'));

    return () => ctrl.abort();
  }, [token?.md5]);

  const getRankStyle = (rank, isDark) => {
    const c = RANK_COLORS[rank] || {
      bg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
      border: 'transparent'
    };
    return { background: c.bg, color: c.color, border: `1px solid ${c.border}` };
  };

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

  const headerStyle = { fontSize: '9px', textTransform: 'uppercase', fontWeight: 500, letterSpacing: '0.5px', color: darkMode ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)' };

  return (
    <Container isDark={darkMode}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(33,43,54,0.4)' }}>Trending</span>
          <span style={{ height: 14, fontSize: '8px', background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontWeight: 600, padding: '0 5px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center' }}>LIVE</span>
        </div>
        <a href="/trending" style={{ fontSize: '11px', color: '#3b82f6', textDecoration: 'none' }}>View All→</a>
      </div>

      {/* Column Headers */}
      {!isMobile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '2px 10px 6px' }}>
          <div style={{ width: 20 }} />
          <div style={{ width: 24 }} />
          <div style={{ flex: 1, marginLeft: '6px' }}><span style={headerStyle}>Token</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 55px 70px 70px', gap: '6px' }}>
            <span style={{ ...headerStyle, textAlign: 'right' }}>Price</span>
            <span style={{ ...headerStyle, textAlign: 'right' }}>24h %</span>
            <span style={{ ...headerStyle, textAlign: 'right' }}>MCap</span>
            <span style={{ ...headerStyle, textAlign: 'right' }}>Volume</span>
          </div>
        </div>
      )}

      {/* Token List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '6px 8px 8px' }}>
        {tokens.slice(0, isMobile ? 5 : 15).map((t, i) => {
          const change = t.pro24h || 0;
          const isUp = change >= 0;

          return (
            <TokenCard key={t.md5 || i} href={`/token/${t.slug}`} isDark={darkMode}>
              {/* Rank */}
              <div style={{ width: 18, height: 18, borderRadius: '6px', fontSize: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, ...getRankStyle(i + 1, darkMode) }}>
                {i + 1}
              </div>

              {/* Avatar */}
              <div style={{ width: 24, height: 24, borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', flexShrink: 0 }}>
                {t.md5 ? (
                  <img src={`https://s1.xrpl.to/token/${t.md5}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; e.target.parentNode.textContent = t.user?.[0]?.toUpperCase(); }} />
                ) : t.user?.[0]?.toUpperCase()}
              </div>

              {/* Name */}
              <div style={{ flex: 1, minWidth: 0, marginLeft: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.user}</span>
                  {t.verified >= 1 && <span style={{ padding: '1px 5px', borderRadius: '4px', fontSize: '8px', fontWeight: 500, background: darkMode ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.08)', color: darkMode ? '#4ade80' : '#16a34a' }}>Verified</span>}
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '55px' : '80px 55px 70px 70px', gap: '6px', marginLeft: 'auto', flexShrink: 0 }}>
                {!isMobile && <span style={{ fontSize: '11px', fontWeight: 500, textAlign: 'right' }}>{formatPrice(t.exch, activeFiatCurrency, rate)}</span>}
                <span style={{ fontSize: '11px', fontWeight: 500, textAlign: 'right', color: isUp ? '#22c55e' : '#ef4444' }}>{isUp ? '+' : ''}{change.toFixed(1)}%</span>
                {!isMobile && <span style={{ fontSize: '11px', fontWeight: 500, textAlign: 'right' }}>{formatCompact(t.marketcap, activeFiatCurrency, rate)}</span>}
                {!isMobile && <span style={{ fontSize: '11px', fontWeight: 500, textAlign: 'right' }}>{formatCompact(t.vol24hxrp, activeFiatCurrency, rate)}</span>}
              </div>
            </TokenCard>
          );
        })}
      </div>
    </Container>
  );
};

export default TrendingTokens;
