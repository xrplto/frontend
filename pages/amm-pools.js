import { useState, useEffect, useContext, useCallback, useMemo, memo } from 'react';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
import { useRouter } from 'next/router';
import axios from 'axios';
import styled from '@emotion/styled';
import { AppContext } from 'src/AppContext';
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';
import { fNumber } from 'src/utils/formatters';
import Decimal from 'decimal.js-light';

const currencySymbols = {
  USD: '$ ',
  EUR: '€ ',
  JPY: '¥ ',
  CNH: '¥ ',
  XRP: '✕ '
};

const Wrapper = styled.div`
  overflow: hidden;
  min-height: 100vh;
  margin: 0;
  padding: 0;

  @media (max-width: 768px) {
    margin: 0;
    padding: 0;
  }
`;

const Controls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
  padding: 14px;
  background: ${p => p.darkMode ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.01)'};
  border-radius: 12px;
  border: 1px solid ${p => p.darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'};
  width: 100%;
  transition: border-color 0.15s ease;

  &:hover {
    border-color: ${p => p.darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
  }
`;

const ControlRow = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
  width: 100%;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;

    &:not(:last-child) {
      border-bottom: 1px solid ${p => p.darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
      padding-bottom: 12px;
    }
  }
`;

const MobileSection = styled.div`
  @media (max-width: 768px) {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
`;

const MobileButtonGrid = styled.div`
  display: flex;
  gap: 16px;

  @media (max-width: 768px) {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
    gap: 8px;
    width: 100%;
  }
`;

const Button = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: ${p => p.darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'};
  color: ${p => p.darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'};
  cursor: pointer;
  font-size: 13px;
  font-weight: 400;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: ${p => p.darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'};
    color: ${p => p.darkMode ? '#fff' : '#333'};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const Select = styled.select`
  padding: 8px 14px;
  padding-right: 30px;
  border: 1px solid ${p => p.darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
  border-radius: 8px;
  background: ${p => p.darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'};
  color: ${p => p.darkMode ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)'};
  font-size: 13px;
  font-weight: 400;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 14px;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${p => p.darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'};
  }

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const Label = styled.span`
  font-size: 13px;
  color: ${p => p.darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'};
  font-weight: 400;
  white-space: nowrap;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 20px;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    margin-top: 16px;
  }
`;

const SummaryCard = styled.div`
  padding: 16px;
  background: ${p => p.darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'};
  border-radius: 12px;
  border: 1px solid ${p => p.darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
  transition: border-color 0.2s ease, background 0.2s ease;

  &:hover {
    border-color: ${p => p.darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'};
    background: ${p => p.darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'};
  }
`;

const SummaryLabel = styled.div`
  font-size: 12px;
  color: ${p => p.darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'};
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const SummaryValue = styled.div`
  font-size: 20px;
  font-weight: 600;
  color: ${p => p.darkMode ? '#fff' : '#000'};
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid ${p => p.darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
  background: ${p => p.darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'};
  width: 100%;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 100%;
  table-layout: auto;
`;

const Th = styled.th`
  padding: 10px 8px;
  text-align: ${p => p.align || 'left'};
  font-weight: 500;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: ${p => p.darkMode ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)'};
  background: ${p => p.darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'};
  border-bottom: 1px solid ${p => p.darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
  cursor: ${p => p.sortable ? 'pointer' : 'default'};
  white-space: nowrap;
  font-family: inherit;

  &:hover {
    ${p => p.sortable && `
      color: ${p.darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'};
    `}
  }
`;

const Tr = styled.tr`
  border-bottom: 1px solid ${p => p.darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${p => p.darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'};
  }

  &:last-child {
    border-bottom: none;
  }
`;

const Td = styled.td`
  padding: 14px 16px;
  font-size: 14px;
  color: ${p => p.darkMode ? '#fff' : '#333'};
  text-align: ${p => p.align || 'left'};
`;

const PoolInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const PoolPair = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  color: ${p => p.darkMode ? '#fff' : '#000'};
`;

const TokenIconPair = styled.div`
  display: flex;
  margin-right: 8px;
`;

const TokenImage = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid ${p => p.darkMode ? '#1a1a1a' : '#fff'};

  &:last-child {
    margin-left: -8px;
  }
`;

const PoolAccount = styled.div`
  font-size: 11px;
  color: ${p => p.darkMode ? '#bbb' : '#666'};
  font-family: var(--font-mono);
`;

const APYBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
  min-width: 50px;
  background: ${p => p.bg};
  color: ${p => p.color};
  border: 1.5px solid ${p => p.border};
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 400;
  font-size: 12px;
  text-transform: uppercase;
  background: ${p => p.active ? 'rgba(76,175,80,0.1)' : 'rgba(158,158,158,0.1)'};
  color: ${p => p.active ? '#4caf50' : '#9e9e9e'};
  border: 1.5px solid ${p => p.active ? 'rgba(76,175,80,0.3)' : 'rgba(158,158,158,0.3)'};
`;

function AMMPoolsPage({ data }) {
  const { darkMode, activeFiatCurrency } = useContext(AppContext);
  const metrics = useSelector(selectMetrics);
  const exchRate = metrics[activeFiatCurrency] || 1;
  const router = useRouter();

  const [pools, setPools] = useState(data?.pools || []);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(data?.totalPages || 0);
  const [currentPage, setCurrentPage] = useState(0);
  const [summary, setSummary] = useState(data?.summary || null);

  const [params, setParams] = useState({
    sortBy: 'fees',
    status: 'active',
    page: 0,
    limit: 50,
    includeAPY: true
  });

  const BASE_URL = 'https://api.xrpl.to';

  const sortOptions = [
    { value: 'fees', label: '7d Fees' },
    { value: 'apy', label: '7d APY' },
    { value: 'liquidity', label: 'Liquidity' },
    { value: 'volume', label: '7d Volume' },
    { value: 'created', label: 'Newest' }
  ];

  const loadPools = useCallback(async () => {
    setLoading(true);
    try {
      const cleanParams = Object.entries(params).reduce((acc, [key, val]) => {
        if (val !== '' && val !== null && val !== undefined) {
          acc[key] = val;
        }
        return acc;
      }, {});

      const response = await axios.get(`${BASE_URL}/api/amm`, { params: cleanParams });

      if (response.data?.pools) {
        setPools(response.data.pools);
        setTotalPages(response.data.totalPages || 0);
        setCurrentPage(response.data.page || 0);
        setSummary(response.data.summary || null);
      }
    } catch (error) {
      console.error('Error loading AMM pools:', error);
      setPools([]);
    } finally {
      setLoading(false);
    }
  }, [params, BASE_URL]);

  useEffect(() => {
    loadPools();
  }, [params.sortBy, params.status, params.limit, params.page]);

  const updateParam = (key, value) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const getAPYColor = (apy) => {
    if (!apy || isNaN(apy)) return {
      bg: 'transparent',
      color: darkMode ? '#666' : '#999',
      border: 'transparent'
    };

    if (apy >= 100) return {
      bg: 'rgba(76,175,80,0.2)',
      color: '#4caf50',
      border: 'rgba(76,175,80,0.3)'
    };

    if (apy >= 50) return {
      bg: 'rgba(139,195,74,0.15)',
      color: '#8bc34a',
      border: 'rgba(139,195,74,0.25)'
    };

    if (apy >= 20) return {
      bg: 'rgba(255,193,7,0.15)',
      color: '#ffc107',
      border: 'rgba(255,193,7,0.25)'
    };

    return {
      bg: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      color: darkMode ? '#fff' : '#000',
      border: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
    };
  };

  const formatCurrency = (value) => {
    if (!value) return '0';
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return fNumber(value);
  };

  const formatPair = useMemo(() => (pool) => {
    const formatCurrency = (cur) => {
      if (cur === 'XRP') return 'XRP';
      if (cur.length === 40) {
        const hex = cur.replace(/00+$/, '');
        let str = '';
        for (let i = 0; i < hex.length; i += 2) {
          const code = parseInt(hex.substr(i, 2), 16);
          if (code > 0) str += String.fromCharCode(code);
        }
        return str || cur.substring(0, 10);
      }
      return cur.length > 10 ? cur.substring(0, 10) : cur;
    };

    const asset1 = formatCurrency(pool.asset1.currency);
    const asset2 = formatCurrency(pool.asset2.currency);
    return `${asset1} / ${asset2}`;
  }, []);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 600);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <Wrapper>
      <Header />
      <h1 style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
        AMM Pools - XRPL Automated Market Maker Analytics
      </h1>

      <div id="back-to-top-anchor" className="mx-auto max-w-[1920px] px-4 mt-4">
        {summary && (
          <SummaryGrid>
            <SummaryCard darkMode={darkMode}>
              <SummaryLabel darkMode={darkMode}>Total Liquidity</SummaryLabel>
              <SummaryValue darkMode={darkMode}>{formatCurrency(summary.totalLiquidity)} XRP</SummaryValue>
              {(summary.xrpTokenLiquidity || summary.tokenTokenLiquidity) && (
                <div style={{ fontSize: 11, color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', marginTop: 4 }}>
                  {summary.xrpTokenLiquidity && <span>XRP Pools: {formatCurrency(summary.xrpTokenLiquidity)}</span>}
                  {summary.xrpTokenLiquidity && summary.tokenTokenLiquidity && <span> · </span>}
                  {summary.tokenTokenLiquidity && <span>Token Pools: {formatCurrency(summary.tokenTokenLiquidity)}</span>}
                </div>
              )}
            </SummaryCard>
            <SummaryCard darkMode={darkMode}>
              <SummaryLabel darkMode={darkMode}>Volume (24h)</SummaryLabel>
              <SummaryValue darkMode={darkMode}>{formatCurrency(summary.totalVolume24h)} XRP</SummaryValue>
            </SummaryCard>
            <SummaryCard darkMode={darkMode}>
              <SummaryLabel darkMode={darkMode}>Volume (7d)</SummaryLabel>
              <SummaryValue darkMode={darkMode}>{formatCurrency(summary.totalVolume7d)} XRP</SummaryValue>
            </SummaryCard>
            <SummaryCard darkMode={darkMode}>
              <SummaryLabel darkMode={darkMode}>Fees Earned (24h)</SummaryLabel>
              <SummaryValue darkMode={darkMode}>{formatCurrency(summary.totalFees24h)} XRP</SummaryValue>
            </SummaryCard>
            <SummaryCard darkMode={darkMode}>
              <SummaryLabel darkMode={darkMode}>Fees Earned (7d)</SummaryLabel>
              <SummaryValue darkMode={darkMode}>{formatCurrency(summary.totalFees7d)} XRP</SummaryValue>
            </SummaryCard>
            <SummaryCard darkMode={darkMode}>
              <SummaryLabel darkMode={darkMode}>Avg Trade Fee</SummaryLabel>
              <SummaryValue darkMode={darkMode}>{(summary.avgFee / 10).toFixed(4)}%</SummaryValue>
            </SummaryCard>
          </SummaryGrid>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {sortOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => updateParam('sortBy', opt.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: `1.5px solid ${params.sortBy === opt.value ? 'rgba(59,130,246,0.4)' : darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                  background: params.sortBy === opt.value ? 'rgba(59,130,246,0.1)' : 'transparent',
                  color: params.sortBy === opt.value ? '#3b82f6' : darkMode ? '#fff' : '#333',
                  fontSize: 13,
                  fontWeight: params.sortBy === opt.value ? 500 : 400,
                  cursor: 'pointer'
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <select
            value={params.limit}
            onChange={e => updateParam('limit', e.target.value)}
            style={{
              padding: '8px 32px 8px 12px',
              borderRadius: 8,
              border: `1.5px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              background: darkMode ? 'rgba(255,255,255,0.05)' : '#fff',
              color: darkMode ? '#fff' : '#333',
              fontSize: 13,
              cursor: 'pointer',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${darkMode ? '%23fff' : '%23333'}' stroke-width='2'%3e%3cpolyline points='6 9 12 15 18 9'/%3e%3c/svg%3e")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 8px center',
              backgroundSize: 14
            }}
          >
            <option value="25">25 rows</option>
            <option value="50">50 rows</option>
            <option value="100">100 rows</option>
          </select>
        </div>

        <TableWrapper darkMode={darkMode}>
          <Table>
            <thead>
              <tr>
                <Th darkMode={darkMode}>#</Th>
                <Th darkMode={darkMode}>POOL</Th>
                <Th darkMode={darkMode} align="right">TRADE FEE</Th>
                <Th darkMode={darkMode} align="right">LIQUIDITY</Th>
                <Th darkMode={darkMode} align="right">VOL (24H)</Th>
                <Th darkMode={darkMode} align="right">VOL (7D)</Th>
                <Th darkMode={darkMode} align="right">FEES (24H)</Th>
                <Th darkMode={darkMode} align="right">FEES (7D)</Th>
                <Th darkMode={darkMode} align="center">APY (24H)</Th>
                <Th darkMode={darkMode} align="center">APY (7D)</Th>
              </tr>
            </thead>
            <tbody>
              {pools.map((pool, idx) => {
                const apy24h = pool.apy24h?.apy || 0;
                const apy7d = pool.apy7d?.apy || 0;
                const apyColors24h = getAPYColor(apy24h);
                const apyColors7d = getAPYColor(apy7d);
                const liquidityXRP = pool.apy7d?.liquidity || pool.currentLiquidity?.asset1Amount || 0;
                const liquidityFiat = new Decimal(liquidityXRP).div(exchRate).toNumber();

                return (
                  <Tr
                    key={pool._id}
                    darkMode={darkMode}
                    onClick={() => router.push(`/amm/${pool.ammAccount}`)}
                  >
                    <Td darkMode={darkMode}>{idx + 1}</Td>
                    <Td darkMode={darkMode}>
                      <PoolInfo>
                        <PoolPair darkMode={darkMode}>
                          <TokenIconPair>
                            <TokenImage src={`https://s1.xrpl.to/token/${pool.asset1.md5 || '84e5efeb89c4eae8f68188982dc290d8'}`} alt="" loading="lazy" darkMode={darkMode} />
                            <TokenImage src={`https://s1.xrpl.to/token/${pool.asset2.md5}`} alt="" loading="lazy" darkMode={darkMode} />
                          </TokenIconPair>
                          {formatPair(pool)}
                        </PoolPair>
                        <PoolAccount darkMode={darkMode}>{pool.ammAccount.substring(0, 20)}...</PoolAccount>
                      </PoolInfo>
                    </Td>
                    <Td darkMode={darkMode} align="right">
                      <span>{pool.tradingFee ? `${(pool.tradingFee / 1000).toFixed(2)}%` : '-'}</span>
                    </Td>
                    <Td darkMode={darkMode} align="right">
                      <span>{currencySymbols[activeFiatCurrency]}{formatCurrency(liquidityFiat)}</span>
                    </Td>
                    <Td darkMode={darkMode} align="right">
                      <span>{formatCurrency(pool.apy24h?.volume || 0)}</span>
                    </Td>
                    <Td darkMode={darkMode} align="right">
                      <span>{formatCurrency(pool.apy7d?.volume || 0)}</span>
                    </Td>
                    <Td darkMode={darkMode} align="right">
                      <span>{formatCurrency(pool.apy24h?.fees || 0)}</span>
                    </Td>
                    <Td darkMode={darkMode} align="right">
                      <span>{formatCurrency(pool.apy7d?.fees || 0)}</span>
                    </Td>
                    <Td darkMode={darkMode} align="center">
                      <APYBadge {...apyColors24h}>
                        {apy24h > 0 ? `${apy24h.toFixed(1)}%` : '-'}
                      </APYBadge>
                    </Td>
                    <Td darkMode={darkMode} align="center">
                      <APYBadge {...apyColors7d}>
                        {apy7d > 0 ? `${apy7d.toFixed(1)}%` : '-'}
                      </APYBadge>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        </TableWrapper>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              darkMode={darkMode}
              disabled={currentPage === 0}
              onClick={() => updateParam('page', currentPage - 1)}
            >
              Previous
            </Button>
            <span style={{ padding: '10px 18px', color: darkMode ? '#fff' : '#333' }}>
              Page {currentPage + 1} of {totalPages}
            </span>
            <Button
              darkMode={darkMode}
              disabled={currentPage >= totalPages - 1}
              onClick={() => updateParam('page', currentPage + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      <ScrollToTop />
      <Footer />
    </Wrapper>
  );
}

export default AMMPoolsPage;

export async function getStaticProps() {
  const BASE_URL = 'https://api.xrpl.to';

  try {
    const res = await axios.get(`${BASE_URL}/api/amm`, {
      params: {
        sortBy: 'fees',
        limit: 50,
        includeAPY: true
      }
    });

    return {
      props: {
        data: {
          pools: res.data?.pools || [],
          summary: res.data?.summary || null,
          totalPages: res.data?.totalPages || 0
        },
        ogp: {
          canonical: 'https://xrpl.to/amm-pools',
          title: 'AMM Pools | XRPL Automated Market Maker Analytics',
          url: 'https://xrpl.to/amm-pools',
          imgUrl: 'https://xrpl.to/static/ogp.webp',
          desc: 'Explore XRPL AMM pools with real-time liquidity, volume, fees, and APY analytics',
          keywords: 'AMM pools, XRPL, automated market maker, liquidity pools, DEX, APY'
        }
      },
      revalidate: 60
    };
  } catch (error) {
    console.error('Error fetching AMM pools:', error);
    return {
      props: { data: { pools: [] } },
      revalidate: 60
    };
  }
}
