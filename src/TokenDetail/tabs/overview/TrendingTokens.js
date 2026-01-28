import styled from '@emotion/styled';
import { useContext, useState, useEffect } from 'react';
import { AppContext } from 'src/context/AppContext';
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';
import axios from 'axios';
import { Star } from 'lucide-react';

const SYMBOLS = { USD: '$', EUR: '€', JPY: '¥', CNH: '¥', XRP: '✕' };

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: ${(props) => (props.isDark ? 'transparent' : '#fff')};
`;

const TokenCard = styled.a`
  display: grid;
  grid-template-columns: 24px 28px 1fr 70px 50px;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  text-decoration: none;
  color: inherit;
  border-bottom: 1px solid ${(props) => (props.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)')};
  transition: all 0.2s ease;
  position: relative;
  
  &:hover {
    background: ${(props) => (props.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)')};
    transform: translateX(2px);
  }

  ${(props) => props.isWatched && `
    background: ${props.isDark ? 'rgba(246,184,126,0.04)' : 'rgba(246,184,126,0.06)'};
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 15%;
      bottom: 15%;
      width: 2px;
      background: #F6B87E;
      border-radius: 0 2px 2px 0;
    }
  `}

  &:last-child {
    border-bottom: none;
  }
`;

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
  const { darkMode, activeFiatCurrency, accountProfile, setOpenWalletModal } = useContext(AppContext);
  const metrics = useSelector(selectMetrics);
  const rate = metrics[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics.CNY : 1) || 1;

  const [tokens, setTokens] = useState([]);
  const [newTokens, setNewTokens] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [watchList, setWatchList] = useState([]);
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('discover_activeTab') || 'trending';
    }
    return 'trending';
  });

  useEffect(() => {
    localStorage.setItem('discover_activeTab', activeTab);
  }, [activeTab]);

  // Fetch watchlist
  useEffect(() => {
    if (!accountProfile?.account) { setWatchList([]); return; }
    axios.get(`${BASE_URL}/watchlist?account=${accountProfile.account}`)
      .then((res) => res.data.success && setWatchList(res.data.watchlist || []))
      .catch(() => { });
  }, [accountProfile]);

  const toggleWatch = async (e, md5) => {
    e.preventDefault();
    e.stopPropagation();
    if (!accountProfile?.account) { setOpenWalletModal(true); return; }
    const action = watchList.includes(md5) ? 'remove' : 'add';
    try {
      const res = await axios.post(`${BASE_URL}/watchlist`, { md5, account: accountProfile.account, action });
      if (res.data.success) setWatchList(res.data.watchlist || []);
    } catch { }
  };

  // Fetch trending on mount
  useEffect(() => {
    const ctrl = new AbortController();
    axios.get(`${BASE_URL}/tokens?start=0&limit=50&sortBy=trendingScore&sortType=desc&skipMetrics=true`, { signal: ctrl.signal })
      .then((res) => {
        const list = res.data?.tokens || [];
        setTokens(token?.md5 ? list.filter((t) => t.md5 !== token.md5) : list);
        setLoading(false);
      })
      .catch((err) => { !axios.isCancel(err) && setError('Failed to load'); setLoading(false); });
    return () => ctrl.abort();
  }, [token?.md5]);

  // Fetch new only when tab switches to new
  useEffect(() => {
    if (activeTab !== 'new' || newTokens.length > 0) return;
    const ctrl = new AbortController();
    axios.get(`${BASE_URL}/tokens?start=0&limit=50&sortBy=dateon&sortType=desc&skipMetrics=true`, { signal: ctrl.signal })
      .then((res) => {
        const list = res.data?.tokens || [];
        setNewTokens(token?.md5 ? list.filter((t) => t.md5 !== token.md5) : list);
      })
      .catch(() => { });
    return () => ctrl.abort();
  }, [activeTab, token?.md5]);

  if (error) {
    return (
      <Container isDark={darkMode}>
        <div style={{ padding: '16px', color: '#f44336', fontSize: '12px' }}>Failed to load trending tokens</div>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container isDark={darkMode}>
        <div style={{ padding: '12px' }}>
          {[...Array(10)].map((_, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '14px 28px 1fr 70px 50px', gap: '10px', padding: '10px 16px', alignItems: 'center' }}>
              <div style={{ width: 12, height: 12, borderRadius: '2px', background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />
              <div style={{ width: 28, height: 28, borderRadius: '6px', background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />
              <div style={{ height: 12, borderRadius: '4px', background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', width: '60%' }} />
              <div style={{ height: 10, borderRadius: '4px', background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', width: '80%' }} />
              <div style={{ height: 10, borderRadius: '4px', background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', width: '90%' }} />
            </div>
          ))}
        </div>
      </Container>
    );
  }

  return (
    <Container isDark={darkMode}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
        background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'
      }}>
        <div style={{
          display: 'flex',
          background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
          borderRadius: '6px',
          padding: '2px'
        }}>
          {['trending', 'new'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                height: '24px',
                padding: '0 12px',
                fontSize: '10px',
                fontWeight: 600,
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: activeTab === tab ? (darkMode ? 'rgba(255,255,255,0.1)' : '#fff') : 'transparent',
                color: activeTab === tab ? (darkMode ? '#fff' : '#000') : (darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'),
                boxShadow: activeTab === tab && !darkMode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              {tab === 'trending' ? 'Trending' : 'New Tokens'}
            </button>
          ))}
        </div>
        <a
          href={activeTab === 'trending' ? '/trending' : '/new'}
          style={{
            fontSize: '11px',
            color: '#3b82f6',
            textDecoration: 'none',
            fontWeight: 600,
            letterSpacing: '0.3px'
          }}
        >
          View All
        </a>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {(() => {
          const baseList = activeTab === 'trending' ? tokens : newTokens;
          const otherList = activeTab === 'trending' ? newTokens : tokens;
          const watchedFromOther = otherList.filter(t => watchList.includes(t.md5) && !baseList.some(b => b.md5 === t.md5));
          return [...watchedFromOther, ...baseList].sort((a, b) => (watchList.includes(b.md5) ? 1 : 0) - (watchList.includes(a.md5) ? 1 : 0));
        })().map((t, i) => {
          const change = t.pro24h || 0;
          const isUp = change >= 0;
          const isWatched = watchList.includes(t.md5);

          const vol = t.vol24hxrp || 0;
          const volStr = vol >= 1e6 ? `${(vol / 1e6).toFixed(1)}M` : vol >= 1e3 ? `${(vol / 1e3).toFixed(1)}K` : vol.toFixed(0);

          return (
            <TokenCard
              key={t.md5 || i}
              href={`/token/${t.slug}`}
              isDark={darkMode}
              isWatched={isWatched}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Star
                  size={14}
                  onClick={(e) => toggleWatch(e, t.md5)}
                  fill={isWatched ? '#F6B87E' : 'none'}
                  strokeWidth={2}
                  style={{
                    cursor: 'pointer',
                    color: isWatched ? '#F6B87E' : darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                    transition: 'transform 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                />
              </div>
              <div style={{ width: 28, height: 28, borderRadius: '8px', overflow: 'hidden', background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {t.md5 ? (
                  <img
                    src={`https://s1.xrpl.to/token/${t.md5}`}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    loading="lazy"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <span style={{ fontSize: '10px', fontWeight: 700, opacity: 0.5 }}>{t.currency?.[0]}</span>
                )}
              </div>
              <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1px' }}>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px', fontWeight: 600, color: darkMode ? '#fff' : '#1a1f2e' }}>
                  {t.name}
                </div>
                <div style={{ fontSize: '10px', fontWeight: 500, opacity: 0.4, fontFamily: 'var(--font-mono)' }}>
                  {t.currency?.slice(0, 8)}
                </div>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: darkMode ? 'rgba(255,255,255,0.9)' : '#1a1f2e' }}>
                  {formatPrice(t.exch, activeFiatCurrency, rate)}
                </div>
                <div style={{ opacity: 0.4, fontSize: '9px', fontWeight: 500 }}>
                  Vol {volStr}
                </div>
              </div>
              <div style={{
                textAlign: 'right',
                fontSize: '11px',
                fontWeight: 700,
                color: isUp ? '#2ecc71' : '#ff4d4f',
                background: isUp ? 'rgba(46, 204, 113, 0.1)' : 'rgba(255, 77, 79, 0.1)',
                padding: '2px 6px',
                borderRadius: '4px',
                justifySelf: 'end'
              }}>
                {isUp ? '+' : ''}{change.toFixed(1)}%
              </div>
            </TokenCard>
          );
        })}
      </div>
    </Container>
  );
};

export default TrendingTokens;
