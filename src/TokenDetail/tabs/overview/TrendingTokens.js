import styled from '@emotion/styled';
import { useContext, useState, useEffect } from 'react';
import { AppContext } from 'src/context/AppContext';
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';
import axios from 'axios';
import { Star } from 'lucide-react';

const SYMBOLS = { USD: '$', EUR: '€', JPY: '¥', CNH: '¥', XRP: '✕' };

const Container = styled('div')(({ isDark }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflow: 'hidden'
}));

const TokenCard = styled('a')(({ isDark }) => ({
  display: 'grid',
  gridTemplateColumns: '14px 24px 1fr 60px 44px',
  alignItems: 'center',
  gap: '6px',
  padding: '7px 10px',
  textDecoration: 'none',
  color: 'inherit',
  borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
  '&:hover': {
    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'
  },
  '&:last-child': {
    borderBottom: 'none'
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
      .then((res) => res.data.result === 'success' && setWatchList(res.data.watchlist || []))
      .catch(() => {});
  }, [accountProfile]);

  const toggleWatch = async (e, md5) => {
    e.preventDefault();
    e.stopPropagation();
    if (!accountProfile?.account) { setOpenWalletModal(true); return; }
    const action = watchList.includes(md5) ? 'remove' : 'add';
    try {
      const res = await axios.post(`${BASE_URL}/watchlist`, { md5, account: accountProfile.account, action });
      if (res.data.result === 'success') setWatchList(res.data.watchlist || []);
    } catch {}
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
      .catch(() => {});
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
        <div style={{ padding: '6px' }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '14px 24px 1fr 60px 44px', gap: '6px', padding: '7px 10px', alignItems: 'center' }}>
              <div style={{ width: 12, height: 12, borderRadius: '2px', background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />
              <div style={{ width: 24, height: 24, borderRadius: '4px', background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />
              <div style={{ height: 12, borderRadius: '4px', background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', width: '70%' }} />
              <div style={{ height: 10, borderRadius: '4px', background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />
              <div style={{ height: 10, borderRadius: '4px', background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />
            </div>
          ))}
        </div>
      </Container>
    );
  }

  return (
    <Container isDark={darkMode}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['trending', 'new'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '4px 10px',
                fontSize: '10px',
                fontWeight: 500,
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                background: activeTab === tab ? (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)') : 'transparent',
                color: activeTab === tab ? (darkMode ? '#fff' : '#000') : (darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)')
              }}
            >
              {tab === 'trending' ? 'Trending' : 'New'}
            </button>
          ))}
        </div>
        <a href={activeTab === 'trending' ? '/trending' : '/new'} style={{ fontSize: '10px', color: '#137DFE', textDecoration: 'none', fontWeight: 500 }}>
          View All
        </a>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '6px' }}>
        {(() => {
          const baseList = activeTab === 'trending' ? tokens : newTokens;
          const otherList = activeTab === 'trending' ? newTokens : tokens;
          const watchedFromOther = otherList.filter(t => watchList.includes(t.md5) && !baseList.some(b => b.md5 === t.md5));
          return [...watchedFromOther, ...baseList].sort((a, b) => (watchList.includes(b.md5) ? 1 : 0) - (watchList.includes(a.md5) ? 1 : 0));
        })().map((t, i) => {
          const change = t.pro24h || 0;
          const isUp = change >= 0;

          const vol = t.vol24hxrp || 0;
          const volStr = vol >= 1e6 ? `${(vol/1e6).toFixed(1)}M` : vol >= 1e3 ? `${(vol/1e3).toFixed(0)}K` : vol.toFixed(0);

          return (
            <TokenCard key={t.md5 || i} href={`/token/${t.slug}`} isDark={darkMode} style={watchList.includes(t.md5) ? { background: darkMode ? 'rgba(246,184,126,0.06)' : 'rgba(246,184,126,0.1)' } : undefined}>
              <Star
                size={12}
                onClick={(e) => toggleWatch(e, t.md5)}
                fill={watchList.includes(t.md5) ? '#F6B87E' : 'none'}
                style={{ cursor: 'pointer', color: watchList.includes(t.md5) ? '#F6B87E' : darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}
              />
              <div style={{ width: 24, height: 24, borderRadius: '4px', overflow: 'hidden' }}>
                {t.md5 ? (
                  <img
                    src={`https://s1.xrpl.to/token/${t.md5}`}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                    {t.currency?.[0]}
                  </div>
                )}
              </div>
              <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '11px', fontWeight: 500 }}>
                {t.name}<span style={{ fontWeight: 400, opacity: 0.4 }}> / XRP</span>
              </div>
              <div style={{ textAlign: 'right', fontSize: '10px' }}>
                <div style={{ fontWeight: 500 }}>{formatPrice(t.exch, activeFiatCurrency, rate)}</div>
                <div style={{ opacity: 0.4, fontSize: '9px' }}>{volStr}</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '10px', fontWeight: 600, color: isUp ? '#22c55e' : '#ef4444' }}>
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
