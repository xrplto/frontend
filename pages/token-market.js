import { useState, useContext, useMemo } from 'react';
import axios from 'axios';
import styled from '@emotion/styled';
import { AppContext } from 'src/AppContext';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
import { fNumber, fVolume } from 'src/utils/formatters';
import { TrendingUp, TrendingDown, Activity, BarChart3, Coins, Users, DollarSign, Layers } from 'lucide-react';
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
  { key: 'all', label: 'All', days: 9999 }
];

const METRICS = [
  { key: 'platformVolume', label: 'Platforms', format: fVolume, platform: true },
  { key: 'volume', label: 'Volume', format: fVolume },
  { key: 'volumeSplit', label: 'AMM vs DEX', format: fVolume, dual: true },
  { key: 'trades', label: 'Trades', format: fNumber },
  { key: 'marketcap', label: 'Marketcap', format: fVolume }
];

const PLATFORM_COLORS = {
  FirstLedger: '#f59e0b',
  MagneticX: '#ec4899',
  XPMarket: '#06b6d4',
  default: '#6b7280'
};

export default function TokenMarketPage({ stats }) {
  const { themeName } = useContext(AppContext);
  const darkMode = themeName === 'XrplToDarkTheme';
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');
  const [metric, setMetric] = useState('platformVolume');
  const [hoverData, setHoverData] = useState(null);
  const [topTokensRange, setTopTokensRange] = useState('7d');

  const history = stats?.history || [];

  const chartData = useMemo(() => {
    const range = TIME_RANGES.find(r => r.key === timeRange);
    return history.slice(-range.days);
  }, [history, timeRange]);

  const isDualChart = metric === 'volumeSplit';
  const isPlatformChart = metric === 'platformVolume';
  const platformNames = stats?.platformNames || [];

  const maxValue = useMemo(() => {
    if (isDualChart) {
      return Math.max(...chartData.map(d => Math.max(d.volumeAMM || 0, d.volumeNonAMM || 0)), 1);
    }
    if (isPlatformChart) {
      return Math.max(...chartData.flatMap(d =>
        platformNames.map(p => d.platformVolume?.[p]?.volume || 0)
      ), 1);
    }
    return Math.max(...chartData.map(d => d[metric] || 0), 1);
  }, [chartData, metric, isDualChart, isPlatformChart, platformNames]);

  const topWashTraders = stats?.topWashTraders || [];
  const maxWashScore = topWashTraders[0]?.washScore || 1;

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

  const ammPoints = isDualChart ? chartData.map((d, i) => {
    const x = padding.left + (i / (chartData.length - 1 || 1)) * chartWidth;
    const y = padding.top + chartHeight - ((d.volumeAMM || 0) / maxValue) * chartHeight;
    return { x, y, data: d };
  }) : [];

  const dexPoints = isDualChart ? chartData.map((d, i) => {
    const x = padding.left + (i / (chartData.length - 1 || 1)) * chartWidth;
    const y = padding.top + chartHeight - ((d.volumeNonAMM || 0) / maxValue) * chartHeight;
    return { x, y, data: d };
  }) : [];

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1]?.x || 0} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`;

  const ammLinePath = ammPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const ammAreaPath = isDualChart ? `${ammLinePath} L ${ammPoints[ammPoints.length - 1]?.x || 0} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z` : '';

  const dexLinePath = dexPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const dexAreaPath = isDualChart ? `${dexLinePath} L ${dexPoints[dexPoints.length - 1]?.x || 0} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z` : '';

  const platformPaths = useMemo(() => {
    if (!isPlatformChart) return {};
    const paths = {};
    platformNames.forEach(platform => {
      const pts = chartData.map((d, i) => {
        const x = (i / (chartData.length - 1 || 1)) * 100;
        const vol = d.platformVolume?.[platform]?.volume || 0;
        const y = 10 + 90 - (vol / maxValue) * 90;
        return { x, y };
      });
      const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
      paths[platform] = { linePath };
    });
    return paths;
  }, [isPlatformChart, platformNames, chartData, maxValue]);

  const metricConfig = METRICS.find(m => m.key === metric);

  return (
    <div style={{ minHeight: '100vh', overflow: 'hidden' }}>
      <div id="back-to-top-anchor" style={{ height: 24 }} />
      <Header notificationPanelOpen={notificationPanelOpen} onNotificationPanelToggle={setNotificationPanelOpen} />

      <Container>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <Title darkMode={darkMode}>Token Market Stats</Title>
            <Subtitle darkMode={darkMode}>XRPL DEX token trading analytics</Subtitle>
          </div>
          {stats.lastUpdated && (
            <div style={{ fontSize: 11, color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', marginTop: 4 }}>
              Updated {new Date(stats.lastUpdated).toLocaleString()}
            </div>
          )}
        </div>

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
            <StatLabel darkMode={darkMode}><Users size={12} /> Unique Traders</StatLabel>
            <StatValue darkMode={darkMode}>{fNumber(stats.uniqueTraderCount || ((stats.uniqueTradersAMM || 0) + (stats.uniqueTradersNonAMM || 0)))}</StatValue>
          </StatCard>

          <StatCard darkMode={darkMode}>
            <StatLabel darkMode={darkMode}><DollarSign size={12} /> 7d Fees</StatLabel>
            <StatValue darkMode={darkMode}>{fVolume(stats.fees7d || 0)}</StatValue>
          </StatCard>

          <StatCard darkMode={darkMode}>
            <StatLabel darkMode={darkMode}><Layers size={12} /> Active Tokens</StatLabel>
            <StatValue darkMode={darkMode}>{fNumber(stats.tokenCount || 0)}</StatValue>
          </StatCard>
        </Grid>

        <Grid style={{ marginBottom: 16 }}>
          <StatCard darkMode={darkMode}>
            <StatLabel darkMode={darkMode}>7d Volume</StatLabel>
            <StatValue darkMode={darkMode}>{fVolume(stats.volume7d || 0)}</StatValue>
            {stats.volume7dPct !== undefined && (
              <StatChange positive={stats.volume7dPct >= 0}>
                {stats.volume7dPct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {Math.abs(stats.volume7dPct || 0).toFixed(1)}% vs prev
              </StatChange>
            )}
          </StatCard>

          <StatCard darkMode={darkMode}>
            <StatLabel darkMode={darkMode}>30d Volume</StatLabel>
            <StatValue darkMode={darkMode}>{fVolume(stats.volume30d || 0)}</StatValue>
          </StatCard>

          <StatCard darkMode={darkMode}>
            <StatLabel darkMode={darkMode}>Avg Trade</StatLabel>
            <StatValue darkMode={darkMode}>{(stats.avgTradeSize || 0).toFixed(0)} XRP</StatValue>
          </StatCard>

          <StatCard darkMode={darkMode}>
            <StatLabel darkMode={darkMode}>30d Fees</StatLabel>
            <StatValue darkMode={darkMode}>{fVolume(stats.fees30d || 0)}</StatValue>
          </StatCard>

          <StatCard darkMode={darkMode}>
            <StatLabel darkMode={darkMode}>AMM Share</StatLabel>
            <StatValue darkMode={darkMode}>{stats.volume24h > 0 ? ((stats.volumeAMM / stats.volume24h) * 100).toFixed(1) : 0}%</StatValue>
          </StatCard>

          <StatCard darkMode={darkMode}>
            <StatLabel darkMode={darkMode}>7d Trades</StatLabel>
            <StatValue darkMode={darkMode}>{fNumber(stats.trades7d || 0)}</StatValue>
          </StatCard>
        </Grid>

        <Section>
          <ChartCard darkMode={darkMode}>
            <ChartHeader darkMode={darkMode}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <ChartTitle darkMode={darkMode}>Historical {metricConfig.label}</ChartTitle>
                <ButtonGroup>
                  {METRICS.map(m => (
                    <ToggleBtn key={m.key} active={metric === m.key} darkMode={darkMode} onClick={() => setMetric(m.key)}>
                      {m.label}
                    </ToggleBtn>
                  ))}
                </ButtonGroup>
                {isDualChart && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 12, height: 3, borderRadius: 2, background: '#8b5cf6' }} />
                      <span style={{ color: darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>AMM</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 12, height: 3, borderRadius: 2, background: '#10b981' }} />
                      <span style={{ color: darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>DEX</span>
                    </span>
                  </div>
                )}
                {isPlatformChart && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11 }}>
                    {platformNames.map(platform => (
                      <span key={platform} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 12, height: 3, borderRadius: 2, background: PLATFORM_COLORS[platform] || PLATFORM_COLORS.default }} />
                        <span style={{ color: darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>{platform}</span>
                      </span>
                    ))}
                  </div>
                )}
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
                  <linearGradient id="ammAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.02" />
                  </linearGradient>
                  <linearGradient id="dexAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                {isPlatformChart ? (
                  platformNames.map(platform => {
                    const color = PLATFORM_COLORS[platform] || PLATFORM_COLORS.default;
                    return (
                      <g key={platform}>
                        <path d={platformPaths[platform]?.linePath || ''} fill="none" stroke={color} strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
                      </g>
                    );
                  })
                ) : isDualChart ? (
                  <>
                    <path d={ammAreaPath} fill="url(#ammAreaGradient)" />
                    <path d={dexAreaPath} fill="url(#dexAreaGradient)" />
                    <path d={ammLinePath} fill="none" stroke="#8b5cf6" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
                    <path d={dexLinePath} fill="none" stroke="#10b981" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
                  </>
                ) : (
                  <>
                    <path d={areaPath} fill="url(#tokenAreaGradient)" />
                    <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
                  </>
                )}
              </ChartSvg>
              {hoverData && (
                <Tooltip darkMode={darkMode} style={{ left: Math.min(hoverData.x, 250), top: Math.max(hoverData.y - 80, 10) }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{hoverData.date}</div>
                  {isPlatformChart ? (
                    <>
                      {platformNames.map(platform => {
                        const vol = hoverData.platformVolume?.[platform]?.volume || 0;
                        if (vol === 0) return null;
                        const color = PLATFORM_COLORS[platform] || PLATFORM_COLORS.default;
                        return (
                          <div key={platform} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                              <span style={{ opacity: 0.6 }}>{platform}:</span>
                            </span>
                            <span style={{ fontWeight: 500 }}>{fVolume(vol)}</span>
                          </div>
                        );
                      })}
                    </>
                  ) : isDualChart ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#8b5cf6' }} />
                          <span style={{ opacity: 0.6 }}>AMM:</span>
                        </span>
                        <span style={{ fontWeight: 500 }}>{fVolume(hoverData.volumeAMM || 0)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                          <span style={{ opacity: 0.6 }}>DEX:</span>
                        </span>
                        <span style={{ fontWeight: 500 }}>{fVolume(hoverData.volumeNonAMM || 0)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginTop: 4, paddingTop: 4, borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>
                        <span style={{ opacity: 0.6 }}>Total:</span>
                        <span style={{ fontWeight: 500 }}>{fVolume((hoverData.volumeAMM || 0) + (hoverData.volumeNonAMM || 0))}</span>
                      </div>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                </Tooltip>
              )}
              <div style={{ position: 'absolute', bottom: 8, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}>
                <span>{chartData[0]?.date}</span>
                <span>{chartData[chartData.length - 1]?.date}</span>
              </div>
            </ChartArea>
          </ChartCard>
        </Section>

        {/* Two Column Layout */}
        <div className="tables-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 16 }}>
          {/* Left Column - Trading Activity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <TableContainer darkMode={darkMode}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: darkMode ? '#fff' : '#212B36' }}>Top Tokens</span>
                <ButtonGroup>
                  <ToggleBtn active={topTokensRange === '7d'} darkMode={darkMode} onClick={() => setTopTokensRange('7d')}>7D</ToggleBtn>
                  <ToggleBtn active={topTokensRange === '30d'} darkMode={darkMode} onClick={() => setTopTokensRange('30d')}>30D</ToggleBtn>
                </ButtonGroup>
              </div>
              <Table>
                <thead>
                  <tr>
                    <Th darkMode={darkMode}>#</Th>
                    <Th darkMode={darkMode}>Token</Th>
                    <Th darkMode={darkMode} align="right">Volume</Th>
                    <Th darkMode={darkMode} align="right">Mcap</Th>
                  </tr>
                </thead>
                <tbody>
                  {(topTokensRange === '30d' ? stats.topTokens30d : stats.topTokens || []).slice(0, 8).map((token, idx) => (
                    <tr key={token.tokenId || idx}>
                      <Td darkMode={darkMode} style={{ color: darkMode ? 'rgba(255,255,255,0.4)' : '#919EAB', width: 32 }}>{idx + 1}</Td>
                      <Td darkMode={darkMode}>
                        <TokenLink href={`/token/${token.tokenId}`}>{token.name}</TokenLink>
                      </Td>
                      <Td darkMode={darkMode} align="right" style={{ fontWeight: 500 }}>{fVolume(token.volume)}</Td>
                      <Td darkMode={darkMode} align="right" style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>{fVolume(token.marketcap)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>

            <TableContainer darkMode={darkMode}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: darkMode ? '#fff' : '#212B36' }}>Wash Trading Detection (24h)</span>
              </div>
              <Table>
                <thead>
                  <tr>
                    <Th darkMode={darkMode}>#</Th>
                    <Th darkMode={darkMode}>Address</Th>
                    <Th darkMode={darkMode} align="right">Score</Th>
                    <Th darkMode={darkMode} align="right">Tokens</Th>
                    <Th darkMode={darkMode} align="right">Volume</Th>
                  </tr>
                </thead>
                <tbody>
                  {topWashTraders.slice(0, 5).map((trader, idx) => (
                    <tr key={trader.address || idx}>
                      <Td darkMode={darkMode} style={{ color: darkMode ? 'rgba(255,255,255,0.4)' : '#919EAB', width: 32 }}>{idx + 1}</Td>
                      <Td darkMode={darkMode}>
                        <TokenLink href={`/address/${trader.address}`}>
                          {trader.address ? `${trader.address.slice(0,6)}...${trader.address.slice(-4)}` : '-'}
                        </TokenLink>
                      </Td>
                      <Td darkMode={darkMode} align="right" style={{ fontWeight: 500, color: '#ef4444' }}>{fNumber(trader.washScore)}</Td>
                      <Td darkMode={darkMode} align="right" style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>{trader.tokenCount || '-'}</Td>
                      <Td darkMode={darkMode} align="right">{fVolume(trader.volume24h)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          </div>

          {/* Right Column - AMM & Platform Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <TableContainer darkMode={darkMode}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: darkMode ? '#fff' : '#212B36' }}>AMM Overview (24h)</span>
              </div>
              <Table>
                <thead>
                  <tr>
                    <Th darkMode={darkMode}>Metric</Th>
                    <Th darkMode={darkMode} align="right">AMM</Th>
                    <Th darkMode={darkMode} align="right">DEX</Th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <Td darkMode={darkMode} style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>Volume</Td>
                    <Td darkMode={darkMode} align="right" style={{ fontWeight: 500 }}>{fVolume(stats.volumeAMM || 0)}</Td>
                    <Td darkMode={darkMode} align="right" style={{ fontWeight: 500 }}>{fVolume(stats.volumeNonAMM || 0)}</Td>
                  </tr>
                  <tr>
                    <Td darkMode={darkMode} style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>Trades</Td>
                    <Td darkMode={darkMode} align="right">{fNumber(stats.tradesAMM || 0)}</Td>
                    <Td darkMode={darkMode} align="right">{fNumber(stats.tradesNonAMM || 0)}</Td>
                  </tr>
                  <tr>
                    <Td darkMode={darkMode} style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>Traders</Td>
                    <Td darkMode={darkMode} align="right">{fNumber(stats.uniqueTradersAMM || 0)}</Td>
                    <Td darkMode={darkMode} align="right">{fNumber(stats.uniqueTradersNonAMM || 0)}</Td>
                  </tr>
                </tbody>
              </Table>
              <div style={{ padding: '8px 16px 12px', borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em', color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)', marginBottom: 8 }}>Pool Activity (24h)</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, fontSize: 12 }}>
                  <div>
                    <div style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>Deposits</div>
                    <div style={{ fontWeight: 500, color: darkMode ? '#fff' : '#212B36' }}>{fVolume(stats.ammDepositVolume || 0)}</div>
                    <div style={{ fontSize: 10, color: darkMode ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)' }}>{fNumber(stats.ammDeposit || 0)} txns</div>
                  </div>
                  <div>
                    <div style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>Withdrawals</div>
                    <div style={{ fontWeight: 500, color: darkMode ? '#fff' : '#212B36' }}>{fVolume(stats.ammWithdrawVolume || 0)}</div>
                    <div style={{ fontSize: 10, color: darkMode ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)' }}>{fNumber(stats.ammWithdraw || 0)} txns</div>
                  </div>
                  <div>
                    <div style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>Net Flow</div>
                    <div style={{ fontWeight: 500, color: (stats.ammNetFlow || 0) >= 0 ? '#10b981' : '#ef4444' }}>{(stats.ammNetFlow || 0) >= 0 ? '+' : ''}{fVolume(stats.ammNetFlow || 0)}</div>
                  </div>
                </div>
              </div>
            </TableContainer>

            <TableContainer darkMode={darkMode}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: darkMode ? '#fff' : '#212B36' }}>Platform Volume (All Time)</span>
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

            <TableContainer darkMode={darkMode}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: darkMode ? '#fff' : '#212B36' }}>Market Summary (All Time)</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, padding: '12px 16px' }}>
                <div>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em', color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)', marginBottom: 4 }}>Total Volume</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: darkMode ? '#fff' : '#212B36' }}>{fVolume(stats.totalVolume || 0)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em', color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)', marginBottom: 4 }}>Total Trades</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: darkMode ? '#fff' : '#212B36' }}>{fNumber(stats.totalTrades || 0)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em', color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)', marginBottom: 4 }}>Total Fees</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: darkMode ? '#fff' : '#212B36' }}>{fVolume(stats.totalFees || 0)}</div>
                </div>
              </div>
            </TableContainer>
          </div>
        </div>
      </Container>

      <ScrollToTop />
      <Footer />
    </div>
  );
}

export async function getServerSideProps() {
  try {
    // Fetch all available data
    const startDate = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const response = await axios.get(`${BASE_URL}/token/analytics/market?startDate=${startDate}`);
    const data = response.data;

    // Extract from new API structure
    const days = data.daily || [];
    const aggregates = data.aggregates || {};
    const percentChanges = data.percentChanges || {};
    const platformStatsAll = data.platformStatsAll || {};

    // Sort and format history for charts
    const sortedDays = [...days].sort((a, b) => new Date(a.date) - new Date(b.date));
    const history = sortedDays.map(day => ({
      date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      volume: day.volume || 0,
      trades: day.trades || 0,
      marketcap: day.marketcap || 0,
      tokens: day.tokenCount || 0,
      volumeAMM: day.volumeAMM || 0,
      volumeNonAMM: day.volumeNonAMM || 0,
      platformVolume: day.volumeByPlatform || {}
    }));

    // Get platform names from all-time stats or daily data
    const platformNames = Object.keys(platformStatsAll).length > 0
      ? Object.keys(platformStatsAll)
      : [...new Set(days.flatMap(d => Object.keys(d.volumeByPlatform || {})))].filter(Boolean);

    // Get latest day for 24h specific data
    const lastDay = sortedDays[sortedDays.length - 1] || {};

    // Use aggregates from API (with fallbacks for backwards compatibility)
    const agg24h = aggregates['24h'] || {};
    const agg7d = aggregates['7d'] || {};
    const agg30d = aggregates['30d'] || {};
    const aggAll = aggregates['all'] || {};

    const stats = {
      // 24h stats from aggregates
      volume24h: agg24h.volume || lastDay.volume || 0,
      trades24h: agg24h.trades || lastDay.trades || 0,
      totalMarketcap: lastDay.marketcap || 0,
      avgTradeSize: lastDay.avgTradeSize || 0,

      // Percentage changes from API
      volumePct: percentChanges.volume24hPct || 0,
      tradesPct: percentChanges.trades24hPct || 0,
      marketcapPct: percentChanges.marketcap24hPct || 0,
      volume7dPct: percentChanges.volume7dPct || 0,

      // Period aggregates
      volume7d: agg7d.volume || 0,
      trades7d: agg7d.trades || 0,
      fees7d: agg7d.fees || 0,
      volume30d: agg30d.volume || 0,
      trades30d: agg30d.trades || 0,
      fees30d: agg30d.fees || 0,
      totalVolume: aggAll.volume || 0,
      totalTrades: aggAll.trades || 0,
      totalFees: aggAll.fees || 0,

      // Token count
      tokenCount: lastDay.tokenCount || 0,

      // AMM vs DEX (24h)
      volumeAMM: agg24h.volumeAMM || lastDay.volumeAMM || 0,
      volumeNonAMM: agg24h.volumeNonAMM || lastDay.volumeNonAMM || 0,
      tradesAMM: agg24h.tradesAMM || lastDay.tradesAMM || 0,
      tradesNonAMM: agg24h.tradesNonAMM || lastDay.tradesNonAMM || 0,
      uniqueTradersAMM: lastDay.uniqueTradersAMM || 0,
      uniqueTradersNonAMM: lastDay.uniqueTradersNonAMM || 0,
      uniqueTraderCount: data.uniqueTraderCount || 0,

      // AMM activity (24h) - counts and volumes
      ammDeposit: lastDay.ammDeposit || 0,
      ammWithdraw: lastDay.ammWithdraw || 0,
      ammCreate: lastDay.ammCreate || 0,
      ammDepositVolume: agg24h.ammDeposits || lastDay.ammDepositVolume || 0,
      ammWithdrawVolume: agg24h.ammWithdraws || lastDay.ammWithdrawVolume || 0,
      ammNetFlow: lastDay.ammNetFlow || 0,

      // Platform stats (all-time from API, fallback to 7d calc)
      platforms: platformStatsAll,
      platformNames,

      // Top tokens by period
      topTokens: data.topTokens7d || lastDay.topTokens || [],
      topTokens30d: data.topTokens30d || [],

      // Wash traders
      topWashTraders: data.topWashTraders24h || [],

      // Chart history
      history,

      // Meta
      lastUpdated: data.lastUpdated || null
    };

    return { props: { stats } };
  } catch (error) {
    console.error('Failed to fetch token market stats:', error.message);
    return { props: { stats: null } };
  }
}
