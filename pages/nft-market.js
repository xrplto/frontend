import { useState, useContext, useMemo } from 'react';
import axios from 'axios';
import styled from '@emotion/styled';
import { AppContext } from 'src/AppContext';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
import { fNumber, fVolume } from 'src/utils/formatters';
import { TrendingUp, TrendingDown, Activity, Users, Flame, Image, ShoppingCart, ArrowRightLeft } from 'lucide-react';

const BASE_URL = 'https://api.xrpl.to/api';

const Container = styled.div`
  max-width: 1920px;
  margin: 0 auto;
  padding: 24px 16px;
`;

const Title = styled.h1`
  font-size: 22px;
  font-weight: 400;
  margin-bottom: 4px;
  color: ${({ darkMode }) => (darkMode ? '#fff' : '#212B36')};
`;

const Subtitle = styled.p`
  font-size: 13px;
  margin-bottom: 24px;
  color: ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.5)' : '#637381')};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 24px;
  @media (min-width: 768px) { grid-template-columns: repeat(4, 1fr); }
  @media (min-width: 1024px) { grid-template-columns: repeat(6, 1fr); }
`;

const StatCard = styled.div`
  padding: 16px;
  border-radius: 12px;
  border: 1px solid ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')};
  background: ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.02)' : '#fff')};
`;

const StatLabel = styled.p`
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 6px;
  color: ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)')};
  display: flex;
  align-items: center;
  gap: 6px;
`;

const StatValue = styled.p`
  font-size: 18px;
  font-weight: 600;
  color: ${({ darkMode }) => (darkMode ? '#fff' : '#212B36')};
  margin-bottom: 4px;
`;

const StatChange = styled.span`
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 2px;
  color: ${({ positive }) => (positive ? '#10b981' : '#ef4444')};
`;

const Section = styled.div`
  margin-bottom: 24px;
`;

const ChartCard = styled.div`
  border-radius: 12px;
  border: 1px solid ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')};
  background: ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.02)' : '#fff')};
  overflow: hidden;
`;

const ChartHeader = styled.div`
  padding: 16px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')};
`;

const ChartTitle = styled.h3`
  font-size: 14px;
  font-weight: 500;
  color: ${({ darkMode }) => (darkMode ? '#fff' : '#212B36')};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 4px;
`;

const ToggleBtn = styled.button`
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 500;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
  background: ${({ active, darkMode }) => active ? '#3b82f6' : (darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')};
  color: ${({ active, darkMode }) => active ? '#fff' : (darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)')};
  &:hover { background: ${({ active }) => active ? '#2563eb' : 'rgba(59,130,246,0.1)'}; }
`;

const ChartArea = styled.div`
  position: relative;
  height: 280px;
  padding: 20px 16px 40px;
`;

const ChartSvg = styled.svg`
  width: 100%;
  height: 100%;
  overflow: visible;
`;

const Tooltip = styled.div`
  position: absolute;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 12px;
  pointer-events: none;
  z-index: 20;
  background: ${({ darkMode }) => (darkMode ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.95)')};
  border: 1px solid ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')};
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  color: ${({ darkMode }) => (darkMode ? '#fff' : '#212B36')};
`;

const TableContainer = styled.div`
  border-radius: 12px;
  border: 1px solid ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')};
  background: ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.02)' : '#fff')};
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 12px 16px;
  text-align: ${({ align }) => align || 'left'};
  color: ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)')};
  border-bottom: 1px solid ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')};
`;

const Td = styled.td`
  font-size: 12px;
  padding: 12px 16px;
  text-align: ${({ align }) => align || 'left'};
  color: ${({ darkMode }) => (darkMode ? '#fff' : '#212B36')};
  border-bottom: 1px solid ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)')};
`;

const PlatformBar = styled.div`
  height: 6px;
  border-radius: 3px;
  background: ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')};
  overflow: hidden;
  margin-top: 4px;
`;

const PlatformFill = styled.div`
  height: 100%;
  background: #3b82f6;
  border-radius: 3px;
`;

const TIME_RANGES = [
  { key: '7d', label: '7D', days: 7 },
  { key: '30d', label: '30D', days: 30 },
  { key: '90d', label: '90D', days: 90 },
  { key: '1y', label: '1Y', days: 365 },
  { key: 'all', label: 'All', days: 9999 }
];

const METRICS = [
  { key: 'volume', label: 'Volume', format: fVolume },
  { key: 'sales', label: 'Sales', format: fNumber },
  { key: 'avgPrice', label: 'Avg Price', format: v => (v || 0).toFixed(2) + ' XRP' },
  { key: 'uniqueBuyers', label: 'Buyers', format: fNumber },
  { key: 'uniqueSellers', label: 'Sellers', format: fNumber },
  { key: 'mints', label: 'Mints', format: fNumber },
  { key: 'burns', label: 'Burns', format: fNumber },
  { key: 'transfers', label: 'Transfers', format: fNumber },
  { key: 'royalties', label: 'Royalties', format: fVolume },
  { key: 'brokerFees', label: 'Broker Fees', format: fVolume }
];

export default function NFTMarketPage({ stats }) {
  const { themeName } = useContext(AppContext);
  const darkMode = themeName === 'XrplToDarkTheme';
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [timeRange, setTimeRange] = useState('90d');
  const [metric, setMetric] = useState('volume');
  const [hoverData, setHoverData] = useState(null);

  const volumeHistory = stats?.volumeHistory || [];

  const chartData = useMemo(() => {
    const range = TIME_RANGES.find(r => r.key === timeRange);
    return volumeHistory.slice(-range.days);
  }, [volumeHistory, timeRange]);

  const maxValue = useMemo(() => Math.max(...chartData.map(d => d[metric] || 0), 1), [chartData, metric]);

  const platformTotals = useMemo(() => {
    const totals = {};
    volumeHistory.slice(-7).forEach(day => {
      if (day.volumeByPlatform) {
        Object.entries(day.volumeByPlatform).forEach(([p, v]) => {
          totals[p] = (totals[p] || 0) + v;
        });
      }
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [volumeHistory]);

  const maxPlatformVol = platformTotals[0]?.[1] || 1;

  if (!stats) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <div id="back-to-top-anchor" style={{ height: 24 }} />
        <Header notificationPanelOpen={notificationPanelOpen} onNotificationPanelToggle={setNotificationPanelOpen} />
        <Container>
          <Title darkMode={darkMode}>NFT Market Stats</Title>
          <Subtitle darkMode={darkMode}>Unable to load market data</Subtitle>
        </Container>
        <ScrollToTop />
        <Footer />
      </div>
    );
  }

  const width = 100;
  const height = 100;
  const padding = { top: 10, right: 0, bottom: 0, left: 0 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const points = chartData.map((d, i) => {
    const x = padding.left + (i / (chartData.length - 1 || 1)) * chartWidth;
    const y = padding.top + chartHeight - ((d[metric] || 0) / maxValue) * chartHeight;
    return { x, y, data: d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1]?.x || 0} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`;

  const metricConfig = METRICS.find(m => m.key === metric);

  return (
    <div style={{ minHeight: '100vh', overflow: 'hidden' }}>
      <div id="back-to-top-anchor" style={{ height: 24 }} />
      <Header notificationPanelOpen={notificationPanelOpen} onNotificationPanelToggle={setNotificationPanelOpen} />

      <Container>
        <Title darkMode={darkMode}>NFT Market Stats</Title>
        <Subtitle darkMode={darkMode}>Real-time XRPL NFT market analytics</Subtitle>

        <Grid>
          <StatCard darkMode={darkMode}>
            <StatLabel darkMode={darkMode}><Activity size={12} /> 24h Volume</StatLabel>
            <StatValue darkMode={darkMode}>{fVolume(stats.total24hVolume || 0)}</StatValue>
            <StatChange positive={stats.volumePct >= 0}>
              {stats.volumePct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(stats.volumePct || 0).toFixed(1)}%
            </StatChange>
          </StatCard>

          <StatCard darkMode={darkMode}>
            <StatLabel darkMode={darkMode}><ShoppingCart size={12} /> 24h Sales</StatLabel>
            <StatValue darkMode={darkMode}>{fNumber(stats.total24hSales || 0)}</StatValue>
            <StatChange positive={stats.salesPct >= 0}>
              {stats.salesPct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(stats.salesPct || 0).toFixed(1)}%
            </StatChange>
          </StatCard>

          <StatCard darkMode={darkMode}>
            <StatLabel darkMode={darkMode}><Users size={12} /> Active Traders</StatLabel>
            <StatValue darkMode={darkMode}>{fNumber(stats.activeTraders24h || 0)}</StatValue>
            <StatChange positive={stats.activeTradersPct >= 0}>
              {stats.activeTradersPct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(stats.activeTradersPct || 0).toFixed(1)}%
            </StatChange>
          </StatCard>

          <StatCard darkMode={darkMode}>
            <StatLabel darkMode={darkMode}><Image size={12} /> 24h Mints</StatLabel>
            <StatValue darkMode={darkMode}>{fNumber(stats.total24hMints || 0)}</StatValue>
            <StatChange positive={stats.mintsPct >= 0}>
              {stats.mintsPct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(stats.mintsPct || 0).toFixed(1)}%
            </StatChange>
          </StatCard>

          <StatCard darkMode={darkMode}>
            <StatLabel darkMode={darkMode}><Flame size={12} /> 24h Burns</StatLabel>
            <StatValue darkMode={darkMode}>{fNumber(stats.total24hBurns || 0)}</StatValue>
            <StatChange positive={stats.burnsPct >= 0}>
              {stats.burnsPct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(stats.burnsPct || 0).toFixed(1)}%
            </StatChange>
          </StatCard>

          <StatCard darkMode={darkMode}>
            <StatLabel darkMode={darkMode}><ArrowRightLeft size={12} /> 24h Transfers</StatLabel>
            <StatValue darkMode={darkMode}>{fNumber(stats.total24hTransfers || 0)}</StatValue>
          </StatCard>
        </Grid>

        <Section>
          <ChartCard darkMode={darkMode}>
            <ChartHeader darkMode={darkMode}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <ChartTitle darkMode={darkMode}>Historical {metricConfig.label}</ChartTitle>
                <ButtonGroup>
                  {METRICS.map(m => (
                    <ToggleBtn key={m.key} active={metric === m.key} darkMode={darkMode} onClick={() => setMetric(m.key)}>
                      {m.label}
                    </ToggleBtn>
                  ))}
                </ButtonGroup>
              </div>
              <ButtonGroup>
                {TIME_RANGES.map(r => (
                  <ToggleBtn key={r.key} active={timeRange === r.key} darkMode={darkMode} onClick={() => setTimeRange(r.key)}>
                    {r.label}
                  </ToggleBtn>
                ))}
              </ButtonGroup>
            </ChartHeader>
            <ChartArea
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = (e.clientX - rect.left - 16) / (rect.width - 32);
                const idx = Math.min(Math.max(Math.round(x * (chartData.length - 1)), 0), chartData.length - 1);
                const d = chartData[idx];
                if (d) setHoverData({ ...d, x: e.clientX - rect.left, y: e.clientY - rect.top });
              }}
              onMouseLeave={() => setHoverData(null)}
            >
              <ChartSvg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                <path d={areaPath} fill="url(#areaGradient)" />
                <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
              </ChartSvg>
              {hoverData && (
                <Tooltip darkMode={darkMode} style={{ left: Math.min(hoverData.x, 250), top: Math.max(hoverData.y - 80, 10) }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{hoverData.date}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                    <span style={{ opacity: 0.6 }}>{metricConfig.label}:</span>
                    <span style={{ fontWeight: 500 }}>{metricConfig.format(hoverData[metric] || 0)}</span>
                  </div>
                  {metric !== 'sales' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                      <span style={{ opacity: 0.6 }}>Sales:</span>
                      <span>{fNumber(hoverData.sales || 0)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                    <span style={{ opacity: 0.6 }}>Avg Price:</span>
                    <span>{(hoverData.avgPrice || 0).toFixed(2)} XRP</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                    <span style={{ opacity: 0.6 }}>Traders:</span>
                    <span>{fNumber((hoverData.uniqueBuyers || 0) + (hoverData.uniqueSellers || 0))}</span>
                  </div>
                </Tooltip>
              )}
              <div style={{ position: 'absolute', bottom: 8, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}>
                <span>{chartData[0]?.date}</span>
                <span>{chartData[chartData.length - 1]?.date}</span>
              </div>
            </ChartArea>
          </ChartCard>
        </Section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <Section>
            <TableContainer darkMode={darkMode}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: darkMode ? '#fff' : '#212B36' }}>Platform Volume (7d)</span>
              </div>
              <Table>
                <thead>
                  <tr>
                    <Th darkMode={darkMode}>Platform</Th>
                    <Th darkMode={darkMode} align="right">Volume</Th>
                  </tr>
                </thead>
                <tbody>
                  {platformTotals.map(([platform, vol]) => (
                    <tr key={platform}>
                      <Td darkMode={darkMode}>
                        {platform}
                        <PlatformBar darkMode={darkMode}>
                          <PlatformFill style={{ width: `${(vol / maxPlatformVol) * 100}%` }} />
                        </PlatformBar>
                      </Td>
                      <Td darkMode={darkMode} align="right" style={{ fontWeight: 500 }}>{fVolume(vol)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          </Section>

          <Section>
            <TableContainer darkMode={darkMode}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: darkMode ? '#fff' : '#212B36' }}>Market Overview</span>
              </div>
              <Table>
                <tbody>
                  <tr>
                    <Td darkMode={darkMode} style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>Total Volume</Td>
                    <Td darkMode={darkMode} align="right" style={{ fontWeight: 500 }}>{fVolume(stats.totalVolume || 0)}</Td>
                  </tr>
                  <tr>
                    <Td darkMode={darkMode} style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>Total Sales</Td>
                    <Td darkMode={darkMode} align="right" style={{ fontWeight: 500 }}>{fNumber(stats.totalSales || 0)}</Td>
                  </tr>
                  <tr>
                    <Td darkMode={darkMode} style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>Total Collections</Td>
                    <Td darkMode={darkMode} align="right" style={{ fontWeight: 500 }}>{fNumber(stats.totalCollections || 0)}</Td>
                  </tr>
                  <tr>
                    <Td darkMode={darkMode} style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>Active Collections (24h)</Td>
                    <Td darkMode={darkMode} align="right" style={{ fontWeight: 500 }}>{fNumber(stats.activeCollections24h || 0)}</Td>
                  </tr>
                  <tr>
                    <Td darkMode={darkMode} style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>Total Traders</Td>
                    <Td darkMode={darkMode} align="right" style={{ fontWeight: 500 }}>{fNumber(stats.totalTraders || 0)}</Td>
                  </tr>
                  <tr>
                    <Td darkMode={darkMode} style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>Traders (7d / 30d)</Td>
                    <Td darkMode={darkMode} align="right" style={{ fontWeight: 500 }}>{fNumber(stats.activeTraders7d || 0)} / {fNumber(stats.activeTraders30d || 0)}</Td>
                  </tr>
                </tbody>
              </Table>
            </TableContainer>
          </Section>

          <Section>
            <TableContainer darkMode={darkMode}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: darkMode ? '#fff' : '#212B36' }}>24h Breakdown</span>
              </div>
              <Table>
                <tbody>
                  <tr>
                    <Td darkMode={darkMode} style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>Avg Trade Size</Td>
                    <Td darkMode={darkMode} align="right" style={{ fontWeight: 500 }}>{(stats.avgTradeSize24h || 0).toFixed(2)} XRP</Td>
                  </tr>
                  <tr>
                    <Td darkMode={darkMode} style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>Unique Buyers</Td>
                    <Td darkMode={darkMode} align="right" style={{ fontWeight: 500 }}>{fNumber(stats.uniqueBuyers24h || 0)}</Td>
                  </tr>
                  <tr>
                    <Td darkMode={darkMode} style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>Unique Sellers</Td>
                    <Td darkMode={darkMode} align="right" style={{ fontWeight: 500 }}>{fNumber(stats.uniqueSellers24h || 0)}</Td>
                  </tr>
                  <tr>
                    <Td darkMode={darkMode} style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>Royalties Paid</Td>
                    <Td darkMode={darkMode} align="right" style={{ fontWeight: 500 }}>{fVolume(stats.total24hRoyalties || 0)}</Td>
                  </tr>
                  <tr>
                    <Td darkMode={darkMode} style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>Broker Fees</Td>
                    <Td darkMode={darkMode} align="right" style={{ fontWeight: 500 }}>{fVolume(stats.total24hBrokerFees || 0)}</Td>
                  </tr>
                  <tr>
                    <Td darkMode={darkMode} style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>Total Liquidity</Td>
                    <Td darkMode={darkMode} align="right" style={{ fontWeight: 500 }}>
                      {fVolume(stats.totalLiquidity24h || 0)}
                      <span style={{ marginLeft: 6, fontSize: 10, color: stats.totalLiquidityPct >= 0 ? '#10b981' : '#ef4444' }}>
                        {stats.totalLiquidityPct >= 0 ? '+' : ''}{(stats.totalLiquidityPct || 0).toFixed(1)}%
                      </span>
                    </Td>
                  </tr>
                </tbody>
              </Table>
            </TableContainer>
          </Section>
        </div>
      </Container>

      <ScrollToTop />
      <Footer />
    </div>
  );
}

export async function getServerSideProps() {
  try {
    const response = await axios.get(`${BASE_URL}/nft/analytics/market`);
    return { props: { stats: response.data } };
  } catch (error) {
    console.error('Failed to fetch NFT market stats:', error.message);
    return { props: { stats: null } };
  }
}
