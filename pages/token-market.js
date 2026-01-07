import { useState, useContext, useMemo } from 'react';
import axios from 'axios';
import styled from '@emotion/styled';
import { AppContext } from 'src/AppContext';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
import { fNumber, fVolume } from 'src/utils/formatters';
import { TrendingUp, TrendingDown, Activity, BarChart3, Coins, Users } from 'lucide-react';
import Link from 'next/link';

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

const TokenLink = styled(Link)`
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
  &:hover { text-decoration: underline; }
`;

const VolumeBar = styled.div`
  height: 6px;
  border-radius: 3px;
  background: ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')};
  overflow: hidden;
  margin-top: 4px;
`;

const VolumeFill = styled.div`
  height: 100%;
  background: #3b82f6;
  border-radius: 3px;
`;

const TIME_RANGES = [
  { key: '7d', label: '7D', days: 7 },
  { key: '30d', label: '30D', days: 30 },
  { key: '90d', label: '90D', days: 90 },
  { key: 'all', label: 'All', days: 9999 }
];

const METRICS = [
  { key: 'volume', label: 'Volume', format: fVolume },
  { key: 'trades', label: 'Trades', format: fNumber },
  { key: 'marketcap', label: 'Marketcap', format: fVolume },
  { key: 'tokens', label: 'Tokens', format: fNumber },
  { key: 'volumeAMM', label: 'AMM Vol', format: fVolume },
  { key: 'volumeNonAMM', label: 'DEX Vol', format: fVolume }
];

export default function TokenMarketPage({ stats }) {
  const { themeName } = useContext(AppContext);
  const darkMode = themeName === 'XrplToDarkTheme';
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');
  const [metric, setMetric] = useState('volume');
  const [hoverData, setHoverData] = useState(null);

  const history = stats?.history || [];

  const chartData = useMemo(() => {
    const range = TIME_RANGES.find(r => r.key === timeRange);
    return history.slice(-range.days);
  }, [history, timeRange]);

  const maxValue = useMemo(() => Math.max(...chartData.map(d => d[metric] || 0), 1), [chartData, metric]);

  const topTokens = stats?.topTokens || [];
  const maxTokenVol = topTokens[0]?.volume || 1;

  if (!stats) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <div id="back-to-top-anchor" style={{ height: 24 }} />
        <Header notificationPanelOpen={notificationPanelOpen} onNotificationPanelToggle={setNotificationPanelOpen} />
        <Container>
          <Title darkMode={darkMode}>Token Market Stats</Title>
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
        <Title darkMode={darkMode}>Token Market Stats</Title>
        <Subtitle darkMode={darkMode}>XRPL DEX token trading analytics</Subtitle>

        <Grid>
          <StatCard darkMode={darkMode}>
            <StatLabel darkMode={darkMode}><Activity size={12} /> 24h Volume</StatLabel>
            <StatValue darkMode={darkMode}>{fVolume(stats.volume24h || 0)}</StatValue>
            <StatChange positive={stats.volumePct >= 0}>
              {stats.volumePct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(stats.volumePct || 0).toFixed(1)}%
            </StatChange>
          </StatCard>

          <StatCard darkMode={darkMode}>
            <StatLabel darkMode={darkMode}><BarChart3 size={12} /> 24h Trades</StatLabel>
            <StatValue darkMode={darkMode}>{fNumber(stats.trades24h || 0)}</StatValue>
            <StatChange positive={stats.tradesPct >= 0}>
              {stats.tradesPct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(stats.tradesPct || 0).toFixed(1)}%
            </StatChange>
          </StatCard>

          <StatCard darkMode={darkMode}>
            <StatLabel darkMode={darkMode}><Coins size={12} /> Total Marketcap</StatLabel>
            <StatValue darkMode={darkMode}>{fVolume(stats.totalMarketcap || 0)}</StatValue>
            <StatChange positive={stats.marketcapPct >= 0}>
              {stats.marketcapPct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(stats.marketcapPct || 0).toFixed(1)}%
            </StatChange>
          </StatCard>

          <StatCard darkMode={darkMode}>
            <StatLabel darkMode={darkMode}><Users size={12} /> Active Tokens</StatLabel>
            <StatValue darkMode={darkMode}>{fNumber(stats.activeTokens || 0)}</StatValue>
          </StatCard>

          <StatCard darkMode={darkMode}>
            <StatLabel darkMode={darkMode}>7d Volume</StatLabel>
            <StatValue darkMode={darkMode}>{fVolume(stats.volume7d || 0)}</StatValue>
          </StatCard>

          <StatCard darkMode={darkMode}>
            <StatLabel darkMode={darkMode}>7d Trades</StatLabel>
            <StatValue darkMode={darkMode}>{fNumber(stats.trades7d || 0)}</StatValue>
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
                  <linearGradient id="tokenAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                <path d={areaPath} fill="url(#tokenAreaGradient)" />
                <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
              </ChartSvg>
              {hoverData && (
                <Tooltip darkMode={darkMode} style={{ left: Math.min(hoverData.x, 250), top: Math.max(hoverData.y - 80, 10) }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{hoverData.date}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                    <span style={{ opacity: 0.6 }}>{metricConfig.label}:</span>
                    <span style={{ fontWeight: 500 }}>{metricConfig.format(hoverData[metric] || 0)}</span>
                  </div>
                  {metric !== 'trades' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                      <span style={{ opacity: 0.6 }}>Trades:</span>
                      <span>{fNumber(hoverData.trades || 0)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                    <span style={{ opacity: 0.6 }}>Tokens:</span>
                    <span>{fNumber(hoverData.tokens || 0)}</span>
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
                <span style={{ fontSize: 12, fontWeight: 500, color: darkMode ? '#fff' : '#212B36' }}>Top Tokens by Volume (24h)</span>
              </div>
              <Table>
                <thead>
                  <tr>
                    <Th darkMode={darkMode}>#</Th>
                    <Th darkMode={darkMode}>Token</Th>
                    <Th darkMode={darkMode} align="right">Volume</Th>
                    <Th darkMode={darkMode} align="right">Trades</Th>
                  </tr>
                </thead>
                <tbody>
                  {topTokens.slice(0, 10).map((token, idx) => (
                    <tr key={token.tokenId || idx}>
                      <Td darkMode={darkMode} style={{ color: darkMode ? 'rgba(255,255,255,0.4)' : '#919EAB', width: 32 }}>
                        {idx + 1}
                      </Td>
                      <Td darkMode={darkMode}>
                        <TokenLink href={`/token/${token.tokenId}`}>{token.name}</TokenLink>
                        <VolumeBar darkMode={darkMode}>
                          <VolumeFill style={{ width: `${(token.volume / maxTokenVol) * 100}%` }} />
                        </VolumeBar>
                      </Td>
                      <Td darkMode={darkMode} align="right" style={{ fontWeight: 500 }}>{fVolume(token.volume)}</Td>
                      <Td darkMode={darkMode} align="right">{fNumber(token.trades)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          </Section>

          <Section>
            <TableContainer darkMode={darkMode}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: darkMode ? '#fff' : '#212B36' }}>AMM vs DEX (24h)</span>
              </div>
              <Table>
                <tbody>
                  <tr>
                    <Td darkMode={darkMode} style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>AMM Volume</Td>
                    <Td darkMode={darkMode} align="right" style={{ fontWeight: 500 }}>{fVolume(stats.volumeAMM || 0)}</Td>
                  </tr>
                  <tr>
                    <Td darkMode={darkMode} style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>DEX Volume</Td>
                    <Td darkMode={darkMode} align="right" style={{ fontWeight: 500 }}>{fVolume(stats.volumeNonAMM || 0)}</Td>
                  </tr>
                  <tr>
                    <Td darkMode={darkMode} style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>AMM Trades</Td>
                    <Td darkMode={darkMode} align="right" style={{ fontWeight: 500 }}>{fNumber(stats.tradesAMM || 0)}</Td>
                  </tr>
                  <tr>
                    <Td darkMode={darkMode} style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>DEX Trades</Td>
                    <Td darkMode={darkMode} align="right" style={{ fontWeight: 500 }}>{fNumber(stats.tradesNonAMM || 0)}</Td>
                  </tr>
                  <tr>
                    <Td darkMode={darkMode} style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>AMM Traders</Td>
                    <Td darkMode={darkMode} align="right" style={{ fontWeight: 500 }}>{fNumber(stats.uniqueTradersAMM || 0)}</Td>
                  </tr>
                  <tr>
                    <Td darkMode={darkMode} style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>DEX Traders</Td>
                    <Td darkMode={darkMode} align="right" style={{ fontWeight: 500 }}>{fNumber(stats.uniqueTradersNonAMM || 0)}</Td>
                  </tr>
                </tbody>
              </Table>
            </TableContainer>
          </Section>

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
                    <Th darkMode={darkMode} align="right">Trades</Th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stats.platforms || {}).filter(([_, d]) => d.volume > 0).map(([name, data]) => (
                    <tr key={name}>
                      <Td darkMode={darkMode}>{name}</Td>
                      <Td darkMode={darkMode} align="right" style={{ fontWeight: 500 }}>{fVolume(data.volume)}</Td>
                      <Td darkMode={darkMode} align="right">{fNumber(data.trades)}</Td>
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
                    <Td darkMode={darkMode} style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>Total Volume (90d)</Td>
                    <Td darkMode={darkMode} align="right" style={{ fontWeight: 500 }}>{fVolume(stats.totalVolume || 0)}</Td>
                  </tr>
                  <tr>
                    <Td darkMode={darkMode} style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>Total Trades (90d)</Td>
                    <Td darkMode={darkMode} align="right" style={{ fontWeight: 500 }}>{fNumber(stats.totalTrades || 0)}</Td>
                  </tr>
                  <tr>
                    <Td darkMode={darkMode} style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>Active Tokens</Td>
                    <Td darkMode={darkMode} align="right" style={{ fontWeight: 500 }}>{fNumber(stats.totalTokens || 0)}</Td>
                  </tr>
                  <tr>
                    <Td darkMode={darkMode} style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>30d Volume</Td>
                    <Td darkMode={darkMode} align="right" style={{ fontWeight: 500 }}>{fVolume(stats.volume30d || 0)}</Td>
                  </tr>
                  <tr>
                    <Td darkMode={darkMode} style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>Avg Trade Size (24h)</Td>
                    <Td darkMode={darkMode} align="right" style={{ fontWeight: 500 }}>{(stats.avgTradeSize || 0).toFixed(2)} XRP</Td>
                  </tr>
                  <tr>
                    <Td darkMode={darkMode} style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>Total Fees (90d)</Td>
                    <Td darkMode={darkMode} align="right" style={{ fontWeight: 500 }}>{fVolume(stats.totalFees || 0)}</Td>
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
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const response = await axios.get(`${BASE_URL}/token/analytics/market?startDate=${startDate}`);
    const rawData = response.data;

    const days = Array.isArray(rawData) ? rawData : Object.values(rawData);

    // Use correct API field names
    const history = days.map(day => ({
      date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      volume: day.volume || 0,
      trades: day.trades || 0,
      marketcap: day.marketcap || 0,
      tokens: day.tokenCount || 0,
      volumeAMM: day.volumeAMM || 0,
      volumeNonAMM: day.volumeNonAMM || 0
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Use second-to-last day for 24h stats (today is incomplete)
    const lastDay = days[days.length - 2] || days[days.length - 1];
    const prevDay = days[days.length - 3] || days[days.length - 2];

    // 24h stats
    const volume24h = lastDay?.volume || 0;
    const trades24h = lastDay?.trades || 0;
    const marketcap24h = lastDay?.marketcap || 0;
    const volumePrev = prevDay?.volume || 0;
    const tradesPrev = prevDay?.trades || 0;
    const marketcapPrev = prevDay?.marketcap || 0;

    // AMM breakdown
    const volumeAMM = lastDay?.volumeAMM || 0;
    const volumeNonAMM = lastDay?.volumeNonAMM || 0;
    const tradesAMM = lastDay?.tradesAMM || 0;
    const tradesNonAMM = lastDay?.tradesNonAMM || 0;
    const uniqueTradersAMM = lastDay?.uniqueTradersAMM || 0;
    const uniqueTradersNonAMM = lastDay?.uniqueTradersNonAMM || 0;

    // Platform stats (7d) from volumeByPlatform object
    const platforms = {};
    days.slice(-7).forEach(day => {
      if (day.volumeByPlatform) {
        Object.entries(day.volumeByPlatform).forEach(([name, data]) => {
          if (!platforms[name]) platforms[name] = { volume: 0, trades: 0, fees: 0 };
          platforms[name].volume += data.volume || 0;
          platforms[name].trades += data.trades || 0;
          platforms[name].fees += data.fees || 0;
        });
      }
    });

    // 7d/30d stats
    let volume7d = 0, trades7d = 0, volume30d = 0, trades30d = 0;
    days.slice(-7).forEach(d => { volume7d += d.volume || 0; trades7d += d.trades || 0; });
    days.slice(-30).forEach(d => { volume30d += d.volume || 0; trades30d += d.trades || 0; });

    // Totals
    let totalVolume = 0, totalTrades = 0, totalFees = 0;
    days.forEach(d => { totalVolume += d.volume || 0; totalTrades += d.trades || 0; totalFees += d.totalFees || 0; });

    // Top tokens - backend should provide rolling 24h data in topTokens24h field
    const topTokens = (lastDay?.topTokens24h || lastDay?.topTokens || [])
      .slice(0, 10)
      .map(t => ({ tokenId: t.tokenId || t.md5, name: t.name, volume: t.volume || t.vol24hxrp || 0, trades: t.trades || 0 }));

    const stats = {
      volume24h, trades24h, totalMarketcap: marketcap24h,
      activeTokens: lastDay?.tokenCount || 0,
      volumePct: volumePrev > 0 ? ((volume24h - volumePrev) / volumePrev) * 100 : 0,
      tradesPct: tradesPrev > 0 ? ((trades24h - tradesPrev) / tradesPrev) * 100 : 0,
      marketcapPct: marketcapPrev > 0 ? ((marketcap24h - marketcapPrev) / marketcapPrev) * 100 : 0,
      volume7d, trades7d, volume30d, trades30d, totalVolume, totalTrades, totalFees,
      totalTokens: lastDay?.tokenCount || 0,
      avgTradeSize: lastDay?.avgTradeSize || 0,
      volumeAMM, volumeNonAMM, tradesAMM, tradesNonAMM,
      uniqueTradersAMM, uniqueTradersNonAMM,
      platforms,
      history, topTokens
    };

    return { props: { stats } };
  } catch (error) {
    console.error('Failed to fetch token market stats:', error.message);
    return { props: { stats: null } };
  }
}
