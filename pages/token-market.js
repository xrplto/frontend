import { useState, useContext, useMemo, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import styled from '@emotion/styled';
import { AppContext } from 'src/AppContext';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
import { fNumber, fVolume } from 'src/utils/formatters';
import { TrendingUp, TrendingDown, Activity, BarChart3, Coins, Users, DollarSign, Layers, Percent, ArrowLeftRight, ChevronDown } from 'lucide-react';

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
`;

const ChartHeader = styled.div`
  position: relative;
  padding: 16px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')};
  z-index: 10;
`;

const MetricSelect = styled.div`
  position: relative;
  display: inline-block;
`;

const MetricButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 8px;
  border: 1px solid ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')};
  cursor: pointer;
  background: ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.03)' : '#fff')};
  color: ${({ darkMode }) => (darkMode ? '#fff' : '#212B36')};
  transition: all 0.15s ease;
  &:hover { border-color: #3b82f6; }
`;

const MetricDropdown = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 200px;
  padding: 6px;
  border-radius: 10px;
  border: 1px solid ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')};
  background: ${({ darkMode }) => (darkMode ? '#1a1a1a' : '#fff')};
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  z-index: 50;
`;

const MetricGroup = styled.div`
  &:not(:last-child) {
    border-bottom: 1px solid ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')};
    padding-bottom: 6px;
    margin-bottom: 6px;
  }
`;

const MetricGroupLabel = styled.div`
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 4px 10px;
  color: ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)')};
`;

const MetricOption = styled.button`
  display: block;
  width: 100%;
  padding: 8px 10px;
  font-size: 12px;
  text-align: left;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background: ${({ active }) => active ? 'rgba(59,130,246,0.15)' : 'transparent'};
  color: ${({ active, darkMode }) => active ? '#3b82f6' : (darkMode ? '#fff' : '#212B36')};
  transition: all 0.1s ease;
  &:hover { background: ${({ active }) => active ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.08)'}; }
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

const METRIC_GROUPS = [
  {
    label: 'Trading',
    icon: DollarSign,
    metrics: [
      { key: 'volume', label: 'Volume', format: fVolume },
      { key: 'trades', label: 'Trades', format: fNumber },
      { key: 'marketcap', label: 'Marketcap', format: fVolume },
    ]
  },
  {
    label: 'Platforms',
    icon: Layers,
    metrics: [
      { key: 'platformVolume', label: 'By Platform', format: fVolume, platform: true },
    ]
  },
  {
    label: 'AMM vs DEX',
    icon: ArrowLeftRight,
    metrics: [
      { key: 'volumeSplit', label: 'Volume Split', format: fVolume, dual: true },
      { key: 'tradesSplit', label: 'Trades Split', format: fNumber, dual: true },
    ]
  },
  {
    label: 'Pool Activity',
    icon: Activity,
    metrics: [
      { key: 'ammDeposits', label: 'Deposits', format: fVolume },
      { key: 'ammWithdraws', label: 'Withdrawals', format: fVolume },
      { key: 'ammNetFlow', label: 'Net Flow', format: fVolume },
    ]
  }
];

const ALL_METRICS = METRIC_GROUPS.flatMap(g => g.metrics);

const PLATFORM_COLORS = {
  MagneticX: '#ec4899',
  SologenicWallet: '#8b5cf6',
  XPMarket: '#06b6d4',
  Bidds: '#3b82f6',
  FirstLedger: '#f59e0b',
  HBot: '#ef4444',
  Anodos: '#10b981',
  Horizon: '#f97316',
  StaticBit: '#84cc16',
  OpulenceX: '#a855f7',
  SonarMuse: '#14b8a6',
  CalypsoWallet: '#0ea5e9',
  KatzWallet: '#eab308',
  default: '#6b7280'
};

export default function TokenMarketPage({ stats }) {
  const { themeName } = useContext(AppContext);
  const darkMode = themeName === 'XrplToDarkTheme';
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');
  const [metric, setMetric] = useState('platformVolume');
  const [hoverData, setHoverData] = useState(null);
  const [platformSort, setPlatformSort] = useState('volume');
  const [metricDropdownOpen, setMetricDropdownOpen] = useState(false);
  const [ammTimeRange, setAmmTimeRange] = useState('24h');
  const [platformTimeRange, setPlatformTimeRange] = useState('all');
  const [platformExpanded, setPlatformExpanded] = useState(false);
  const dropdownRef = useRef(null);

  const handleMetricSelect = useCallback((key) => {
    setMetric(key);
    setMetricDropdownOpen(false);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMetricDropdownOpen(false);
      }
    };
    if (metricDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [metricDropdownOpen]);

  const history = stats?.history || [];

  const chartData = useMemo(() => {
    const range = TIME_RANGES.find(r => r.key === timeRange);
    return history.slice(-range.days);
  }, [history, timeRange]);

  const isDualChart = metric === 'volumeSplit' || metric === 'tradesSplit';
  const isPlatformChart = metric === 'platformVolume';
  const isPoolMetric = ['ammDeposits', 'ammWithdraws', 'ammNetFlow'].includes(metric);
  const platformNames = stats?.platformNames || [];

  const maxValue = useMemo(() => {
    if (isDualChart) {
      if (metric === 'tradesSplit') {
        return Math.max(...chartData.map(d => Math.max(d.tradesAMM || 0, d.tradesNonAMM || 0)), 1);
      }
      return Math.max(...chartData.map(d => Math.max(d.volumeAMM || 0, d.volumeNonAMM || 0)), 1);
    }
    if (isPlatformChart) {
      return Math.max(...chartData.flatMap(d =>
        platformNames.map(p => d.platformVolume?.[p]?.volume || 0)
      ), 1);
    }
    if (metric === 'ammNetFlow') {
      const vals = chartData.map(d => Math.abs(d.ammNetFlow || 0));
      return Math.max(...vals, 1);
    }
    return Math.max(...chartData.map(d => d[metric] || 0), 1);
  }, [chartData, metric, isDualChart, isPlatformChart, platformNames]);

  const stackedMax = useMemo(() => {
    return Math.max(...chartData.map(d => {
      let total = 0;
      platformNames.forEach(p => { total += d.platformVolume?.[p]?.volume || 0; });
      return total;
    }), 1);
  }, [chartData, platformNames]);

  const periodTotal = useMemo(() => {
    if (metric === 'volumeSplit') {
      return chartData.reduce((sum, d) => sum + (d.volumeAMM || 0) + (d.volumeNonAMM || 0), 0);
    }
    if (metric === 'tradesSplit') {
      return chartData.reduce((sum, d) => sum + (d.tradesAMM || 0) + (d.tradesNonAMM || 0), 0);
    }
    if (metric === 'platformVolume') {
      return chartData.reduce((sum, d) => sum + (d.volume || 0), 0);
    }
    if (metric === 'ammNetFlow') {
      return chartData.reduce((sum, d) => sum + (d.ammNetFlow || 0), 0);
    }
    return chartData.reduce((sum, d) => sum + (d[metric] || 0), 0);
  }, [chartData, metric]);

  const metricConfig = ALL_METRICS.find(m => m.key === metric);

  // AMM vs DEX aggregates based on selected time range
  const ammStats = useMemo(() => {
    const rangeDays = ammTimeRange === '24h' ? 1 : ammTimeRange === '7d' ? 7 : ammTimeRange === '30d' ? 30 : 9999;
    const data = history.slice(-rangeDays);
    return {
      volumeAMM: data.reduce((s, d) => s + (d.volumeAMM || 0), 0),
      volumeNonAMM: data.reduce((s, d) => s + (d.volumeNonAMM || 0), 0),
      tradesAMM: data.reduce((s, d) => s + (d.tradesAMM || 0), 0),
      tradesNonAMM: data.reduce((s, d) => s + (d.tradesNonAMM || 0), 0),
      ammDeposits: data.reduce((s, d) => s + (d.ammDeposits || 0), 0),
      ammWithdraws: data.reduce((s, d) => s + (d.ammWithdraws || 0), 0),
      ammNetFlow: data.reduce((s, d) => s + (d.ammNetFlow || 0), 0),
    };
  }, [history, ammTimeRange]);

  // Platform stats aggregates based on selected time range
  const platformStats = useMemo(() => {
    if (platformTimeRange === 'all') {
      // Use the all-time stats from API
      return Object.entries(stats?.platformStatsAll || {})
        .map(([name, d]) => ({ name, volume: d.volume || 0, trades: d.trades || 0, fees: d.fees || 0 }));
    }
    const rangeDays = platformTimeRange === '24h' ? 1 : platformTimeRange === '7d' ? 7 : 30;
    const data = history.slice(-rangeDays);
    const aggregated = {};
    data.forEach(day => {
      Object.entries(day.platformVolume || {}).forEach(([platform, pData]) => {
        if (!aggregated[platform]) {
          aggregated[platform] = { volume: 0, trades: 0, fees: 0 };
        }
        aggregated[platform].volume += pData.volume || 0;
        aggregated[platform].trades += pData.trades || 0;
        aggregated[platform].fees += pData.fees || 0;
      });
    });
    return Object.entries(aggregated)
      .map(([name, d]) => ({ name, volume: d.volume, trades: d.trades, fees: d.fees }))
      .filter(p => p.volume > 0 || p.trades > 0);
  }, [history, platformTimeRange, stats?.platformStatsAll]);

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
    const val = metric === 'tradesSplit' ? (d.tradesAMM || 0) : (d.volumeAMM || 0);
    const y = padding.top + chartHeight - (val / maxValue) * chartHeight;
    return { x, y, data: d };
  }) : [];

  const dexPoints = isDualChart ? chartData.map((d, i) => {
    const x = padding.left + (i / (chartData.length - 1 || 1)) * chartWidth;
    const val = metric === 'tradesSplit' ? (d.tradesNonAMM || 0) : (d.volumeNonAMM || 0);
    const y = padding.top + chartHeight - (val / maxValue) * chartHeight;
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <StatChange positive={stats.volumePct >= 0}>
                {stats.volumePct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {Math.abs(stats.volumePct || 0).toFixed(1)}%
              </StatChange>
              <span style={{ fontSize: 10, color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                7d: {fVolume(stats.volume7d || 0)}
              </span>
            </div>
          </StatCard>

          <StatCard darkMode={darkMode}>
            <StatLabel darkMode={darkMode}><BarChart3 size={12} /> 24h Trades</StatLabel>
            <StatValue darkMode={darkMode}>{fNumber(stats.trades24h || 0)}</StatValue>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <StatChange positive={stats.tradesPct >= 0}>
                {stats.tradesPct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {Math.abs(stats.tradesPct || 0).toFixed(1)}%
              </StatChange>
              <span style={{ fontSize: 10, color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                Avg: {fVolume(stats.avgTradeSize || 0)}
              </span>
            </div>
          </StatCard>

          <StatCard darkMode={darkMode}>
            <StatLabel darkMode={darkMode}><Coins size={12} /> Total Marketcap</StatLabel>
            <StatValue darkMode={darkMode}>{fVolume(stats.totalMarketcap || 0)}</StatValue>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <StatChange positive={stats.marketcapPct >= 0}>
                {stats.marketcapPct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {Math.abs(stats.marketcapPct || 0).toFixed(1)}%
              </StatChange>
              <span style={{ fontSize: 10, color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                {fNumber(stats.tokenCount || 0)} tokens
              </span>
            </div>
          </StatCard>

          <StatCard darkMode={darkMode}>
            <StatLabel darkMode={darkMode}><Layers size={12} /> Top Platform</StatLabel>
            {(() => {
              const platforms = Object.entries(stats.platformStatsAll || {});
              const sorted = platforms.sort((a, b) => (b[1].volume || 0) - (a[1].volume || 0));
              const top = sorted[0];
              const totalVol = platforms.reduce((s, [, d]) => s + (d.volume || 0), 0);
              if (!top) return <StatValue darkMode={darkMode}>-</StatValue>;
              return (
                <>
                  <StatValue darkMode={darkMode} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: PLATFORM_COLORS[top[0]] || PLATFORM_COLORS.default }} />
                    {top[0]}
                  </StatValue>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 11, color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                      {fVolume(top[1].volume || 0)}
                    </span>
                    <span style={{ fontSize: 10, color: '#3b82f6', fontWeight: 500 }}>
                      {totalVol > 0 ? ((top[1].volume / totalVol) * 100).toFixed(1) : 0}% share
                    </span>
                  </div>
                </>
              );
            })()}
          </StatCard>

          <StatCard darkMode={darkMode}>
            <StatLabel darkMode={darkMode}><Users size={12} /> Unique Traders (24h)</StatLabel>
            <StatValue darkMode={darkMode}>{fNumber((stats.uniqueTradersAMM || 0) + (stats.uniqueTradersNonAMM || 0))}</StatValue>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#8b5cf6' }}>
                <span style={{ width: 6, height: 6, borderRadius: 1, background: '#8b5cf6' }} />
                AMM {fNumber(stats.uniqueTradersAMM || 0)}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#10b981' }}>
                <span style={{ width: 6, height: 6, borderRadius: 1, background: '#10b981' }} />
                DEX {fNumber(stats.uniqueTradersNonAMM || 0)}
              </span>
            </div>
          </StatCard>

          <StatCard darkMode={darkMode}>
            <StatLabel darkMode={darkMode}><ArrowLeftRight size={12} /> AMM vs DEX (24h)</StatLabel>
            <StatValue darkMode={darkMode}>{stats.volume24h > 0 ? ((stats.volumeAMM / stats.volume24h) * 100).toFixed(1) : 0}% AMM</StatValue>
            <div style={{ marginTop: 4 }}>
              <div style={{ height: 6, borderRadius: 3, background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', overflow: 'hidden', display: 'flex' }}>
                <div style={{ height: '100%', background: '#8b5cf6', width: `${stats.volume24h > 0 ? (stats.volumeAMM / stats.volume24h) * 100 : 0}%` }} />
                <div style={{ height: '100%', background: '#10b981', flex: 1 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                <span>{fVolume(stats.volumeAMM || 0)}</span>
                <span>{fVolume(stats.volumeNonAMM || 0)}</span>
              </div>
            </div>
          </StatCard>
        </Grid>

        <Section>
          <ChartCard darkMode={darkMode}>
            <ChartHeader darkMode={darkMode}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em', color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)', marginBottom: 2 }}>
                    {TIME_RANGES.find(r => r.key === timeRange)?.label} Total
                  </div>
                  <div style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: metric === 'ammNetFlow'
                      ? (periodTotal >= 0 ? '#10b981' : '#ef4444')
                      : metric === 'ammDeposits' ? '#10b981'
                      : metric === 'ammWithdraws' ? '#ef4444'
                      : (darkMode ? '#fff' : '#212B36')
                  }}>
                    {metric === 'ammNetFlow' && periodTotal >= 0 ? '+' : ''}
                    {metricConfig?.format(periodTotal) || fVolume(periodTotal)}
                  </div>
                </div>
                <MetricSelect ref={dropdownRef}>
                  <MetricButton darkMode={darkMode} onClick={() => setMetricDropdownOpen(!metricDropdownOpen)}>
                    {metricConfig?.label || 'Volume'}
                    <ChevronDown size={14} style={{ opacity: 0.5, transform: metricDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                  </MetricButton>
                  {metricDropdownOpen && (
                    <MetricDropdown darkMode={darkMode}>
                      {METRIC_GROUPS.map(group => (
                        <MetricGroup key={group.label} darkMode={darkMode}>
                          <MetricGroupLabel darkMode={darkMode}>{group.label}</MetricGroupLabel>
                          {group.metrics.map(m => (
                            <MetricOption key={m.key} active={metric === m.key} darkMode={darkMode} onClick={() => handleMetricSelect(m.key)}>
                              {m.label}
                            </MetricOption>
                          ))}
                        </MetricGroup>
                      ))}
                    </MetricDropdown>
                  )}
                </MetricSelect>
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
                  <linearGradient id="depositsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
                  </linearGradient>
                  <linearGradient id="withdrawsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0.02" />
                  </linearGradient>
                  {platformNames.map(p => (
                    <linearGradient key={p} id={`grad-${p.replace(/[^a-zA-Z]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={PLATFORM_COLORS[p] || '#6b7280'} stopOpacity="0.6" />
                      <stop offset="100%" stopColor={PLATFORM_COLORS[p] || '#6b7280'} stopOpacity="0.1" />
                    </linearGradient>
                  ))}
                </defs>
                {isPlatformChart ? (
                  platformNames.slice().reverse().map((platform, pIdx) => {
                    const stackedPoints = chartData.map((d, i) => {
                      const x = padding.left + (i / (chartData.length - 1 || 1)) * chartWidth;
                      let cumulative = 0;
                      platformNames.slice(0, platformNames.length - pIdx).forEach(p => {
                        cumulative += d.platformVolume?.[p]?.volume || 0;
                      });
                      const y = padding.top + chartHeight - (cumulative / stackedMax) * chartHeight;
                      return { x, y };
                    });
                    const pathD = stackedPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                    const areaD = `${pathD} L ${stackedPoints[stackedPoints.length - 1]?.x || 0} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`;
                    return <path key={platform} d={areaD} fill={`url(#grad-${platform.replace(/[^a-zA-Z]/g, '')})`} />;
                  })
                ) : isDualChart ? (
                  <>
                    <path d={ammAreaPath} fill="url(#ammAreaGradient)" />
                    <path d={dexAreaPath} fill="url(#dexAreaGradient)" />
                    <path d={ammLinePath} fill="none" stroke="#8b5cf6" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
                    <path d={dexLinePath} fill="none" stroke="#10b981" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
                  </>
                ) : (
                  <>
                    <path d={areaPath} fill={`url(#${metric === 'ammDeposits' ? 'depositsGradient' : metric === 'ammWithdraws' ? 'withdrawsGradient' : 'tokenAreaGradient'})`} />
                    <path d={linePath} fill="none" stroke={metric === 'ammDeposits' ? '#10b981' : metric === 'ammWithdraws' ? '#ef4444' : '#3b82f6'} strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
                  </>
                )}
              </ChartSvg>
              {hoverData && (
                <>
                  <div style={{
                    position: 'absolute',
                    left: hoverData.x,
                    top: 0,
                    bottom: 40,
                    width: 1,
                    background: darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                    pointerEvents: 'none'
                  }} />
                  <Tooltip darkMode={darkMode} style={{ left: Math.min(Math.max(hoverData.x - 80, 10), 300), top: 10 }}>
                    <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 11, opacity: 0.7 }}>{hoverData.date}</div>
                    {isPlatformChart ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 6 }}>
                          <span style={{ opacity: 0.6 }}>Total</span>
                          <span style={{ fontWeight: 600 }}>{fVolume(hoverData.volume || 0)}</span>
                        </div>
                        {platformNames.map(platform => {
                          const vol = hoverData.platformVolume?.[platform]?.volume || 0;
                          if (vol === 0) return null;
                          const color = PLATFORM_COLORS[platform] || PLATFORM_COLORS.default;
                          return (
                            <div key={platform} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 11 }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                                {platform}
                              </span>
                              <span>{fVolume(vol)}</span>
                            </div>
                          );
                        })}
                      </>
                    ) : isDualChart ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 8, height: 8, borderRadius: 2, background: '#8b5cf6' }} />
                            <span style={{ opacity: 0.6 }}>AMM:</span>
                          </span>
                          <span style={{ fontWeight: 500 }}>
                            {metric === 'tradesSplit' ? fNumber(hoverData.tradesAMM || 0) : fVolume(hoverData.volumeAMM || 0)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 8, height: 8, borderRadius: 2, background: '#10b981' }} />
                            <span style={{ opacity: 0.6 }}>DEX:</span>
                          </span>
                          <span style={{ fontWeight: 500 }}>
                            {metric === 'tradesSplit' ? fNumber(hoverData.tradesNonAMM || 0) : fVolume(hoverData.volumeNonAMM || 0)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginTop: 4, paddingTop: 4, borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>
                          <span style={{ opacity: 0.6 }}>Total:</span>
                          <span style={{ fontWeight: 500 }}>
                            {metric === 'tradesSplit'
                              ? fNumber((hoverData.tradesAMM || 0) + (hoverData.tradesNonAMM || 0))
                              : fVolume((hoverData.volumeAMM || 0) + (hoverData.volumeNonAMM || 0))}
                          </span>
                        </div>
                      </>
                    ) : isPoolMetric ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 4 }}>
                          <span style={{ opacity: 0.6 }}>{metricConfig?.label}</span>
                          <span style={{ fontWeight: 600, color: metric === 'ammNetFlow' ? ((hoverData.ammNetFlow || 0) >= 0 ? '#10b981' : '#ef4444') : '#3b82f6' }}>
                            {metric === 'ammNetFlow' && (hoverData.ammNetFlow || 0) >= 0 ? '+' : ''}{fVolume(hoverData[metric] || 0)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
                          <span style={{ opacity: 0.6 }}>Deposits</span>
                          <span style={{ color: '#10b981' }}>{fVolume(hoverData.ammDeposits || 0)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
                          <span style={{ opacity: 0.6 }}>Withdrawals</span>
                          <span style={{ color: '#ef4444' }}>{fVolume(hoverData.ammWithdraws || 0)}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 4 }}>
                          <span style={{ opacity: 0.6 }}>{metricConfig?.label}</span>
                          <span style={{ fontWeight: 600, color: '#3b82f6' }}>{metricConfig?.format(hoverData[metric] || 0)}</span>
                        </div>
                        {metric !== 'volume' && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
                            <span style={{ opacity: 0.6 }}>Volume</span>
                            <span>{fVolume(hoverData.volume || 0)}</span>
                          </div>
                        )}
                        {metric !== 'trades' && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
                            <span style={{ opacity: 0.6 }}>Trades</span>
                            <span>{fNumber(hoverData.trades || 0)}</span>
                          </div>
                        )}
                      </>
                    )}
                  </Tooltip>
                </>
              )}
              <div style={{ position: 'absolute', bottom: 8, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}>
                <span>{chartData[0]?.date}</span>
                <span>{chartData[chartData.length - 1]?.date}</span>
              </div>
            </ChartArea>
            {isPlatformChart && (
              <div style={{ padding: '12px 16px', borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
                {platformNames.map(p => (
                  <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: PLATFORM_COLORS[p] || '#6b7280' }} />
                    {p}
                  </div>
                ))}
              </div>
            )}
            {isDualChart && (
              <div style={{ padding: '12px 16px', borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#8b5cf6' }} />
                  AMM
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981' }} />
                  DEX
                </div>
              </div>
            )}
            {isPoolMetric && (
              <div style={{ padding: '12px 16px', borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: metric === 'ammDeposits' ? '#10b981' : metric === 'ammWithdraws' ? '#ef4444' : '#3b82f6' }} />
                  {metricConfig?.label}
                </div>
              </div>
            )}
          </ChartCard>
        </Section>

        {/* Platform Stats - Full Width */}
        <Section>
          <TableContainer darkMode={darkMode}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: darkMode ? '#fff' : '#212B36' }}>Trading Platform Stats</span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <ButtonGroup>
                  {[{ key: '24h', label: '24H' }, { key: '7d', label: '7D' }, { key: '30d', label: '30D' }, { key: 'all', label: 'All' }].map(r => (
                    <ToggleBtn key={r.key} active={platformTimeRange === r.key} darkMode={darkMode} onClick={() => setPlatformTimeRange(r.key)}>
                      {r.label}
                    </ToggleBtn>
                  ))}
                </ButtonGroup>
                <ButtonGroup>
                  {[{ key: 'volume', label: 'Volume' }, { key: 'trades', label: 'Trades' }, { key: 'fees', label: 'Fees' }].map(s => (
                    <ToggleBtn key={s.key} active={platformSort === s.key} darkMode={darkMode} onClick={() => setPlatformSort(s.key)}>
                      {s.label}
                    </ToggleBtn>
                  ))}
                </ButtonGroup>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <Table style={{ minWidth: 500 }}>
                <thead>
                  <tr>
                    <Th darkMode={darkMode}>Platform</Th>
                    <Th darkMode={darkMode} align="right">Volume</Th>
                    <Th darkMode={darkMode} align="right">Trades</Th>
                    <Th darkMode={darkMode} align="right">Fees</Th>
                    <Th darkMode={darkMode} align="right">Share</Th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const sortedPlatforms = [...platformStats].sort((a, b) => b[platformSort] - a[platformSort]);
                    const totalVol = sortedPlatforms.reduce((s, p) => s + p.volume, 0);
                    const maxVal = sortedPlatforms[0]?.[platformSort] || 1;
                    const displayPlatforms = platformExpanded ? sortedPlatforms : sortedPlatforms.slice(0, 10);
                    if (sortedPlatforms.length === 0) {
                      return (
                        <tr>
                          <Td darkMode={darkMode} colSpan={5} style={{ textAlign: 'center', color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', padding: 24 }}>
                            No platform data available for this period
                          </Td>
                        </tr>
                      );
                    }
                    return displayPlatforms.map(p => (
                      <tr key={p.name}>
                        <Td darkMode={darkMode} style={{ minWidth: 140 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 10, height: 10, borderRadius: 2, background: PLATFORM_COLORS[p.name] || PLATFORM_COLORS.default, flexShrink: 0 }} />
                            <span style={{ fontWeight: 500 }}>{p.name}</span>
                          </div>
                          <div style={{ height: 4, borderRadius: 2, background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', marginTop: 6 }}>
                            <div style={{ height: '100%', borderRadius: 2, background: PLATFORM_COLORS[p.name] || PLATFORM_COLORS.default, width: `${(p[platformSort] / maxVal) * 100}%`, transition: 'width 0.3s ease' }} />
                          </div>
                        </Td>
                        <Td darkMode={darkMode} align="right" style={{ fontWeight: platformSort === 'volume' ? 600 : 400 }}>{fVolume(p.volume)}</Td>
                        <Td darkMode={darkMode} align="right" style={{ fontWeight: platformSort === 'trades' ? 600 : 400 }}>{fNumber(p.trades)}</Td>
                        <Td darkMode={darkMode} align="right" style={{ fontWeight: platformSort === 'fees' ? 600 : 400 }}>{fVolume(p.fees)}</Td>
                        <Td darkMode={darkMode} align="right" style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>{totalVol > 0 ? ((p.volume / totalVol) * 100).toFixed(1) : 0}%</Td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </Table>
            </div>
            {/* Show more button */}
            {platformStats.length > 10 && (
              <div style={{ padding: '12px 16px', borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, textAlign: 'center' }}>
                <button
                  onClick={() => setPlatformExpanded(!platformExpanded)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#3b82f6',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    padding: '6px 12px',
                    borderRadius: 6,
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(59,130,246,0.1)'}
                  onMouseLeave={(e) => e.target.style.background = 'none'}
                >
                  {platformExpanded ? 'Show less' : `Show ${platformStats.length - 10} more`}
                </button>
              </div>
            )}
            {/* Period summary */}
            <div style={{ padding: '12px 16px', borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, fontSize: 12 }}>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div>
                  <span style={{ color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>Total Volume: </span>
                  <span style={{ fontWeight: 600, color: darkMode ? '#fff' : '#212B36' }}>{fVolume(platformStats.reduce((s, p) => s + p.volume, 0))}</span>
                </div>
                <div>
                  <span style={{ color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>Total Trades: </span>
                  <span style={{ fontWeight: 600, color: darkMode ? '#fff' : '#212B36' }}>{fNumber(platformStats.reduce((s, p) => s + p.trades, 0))}</span>
                </div>
                <div>
                  <span style={{ color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>Total Fees: </span>
                  <span style={{ fontWeight: 600, color: darkMode ? '#fff' : '#212B36' }}>{fVolume(platformStats.reduce((s, p) => s + p.fees, 0))}</span>
                </div>
                <div>
                  <span style={{ color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>Platforms: </span>
                  <span style={{ fontWeight: 600, color: darkMode ? '#fff' : '#212B36' }}>{platformStats.length}</span>
                </div>
              </div>
            </div>
          </TableContainer>
        </Section>

        {/* Market Summary - Full Width */}
        <Section>
          <TableContainer darkMode={darkMode}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: darkMode ? '#fff' : '#212B36' }}>Market Summary</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 0 }}>
              <div style={{ padding: '12px 16px', borderRight: `1px solid ${darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`, borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em', color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)', marginBottom: 4 }}>Total Volume</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: darkMode ? '#fff' : '#212B36' }}>{fVolume(stats.totalVolume || 0)}</div>
              </div>
              <div style={{ padding: '12px 16px', borderRight: `1px solid ${darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`, borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em', color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)', marginBottom: 4 }}>Total Trades</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: darkMode ? '#fff' : '#212B36' }}>{fNumber(stats.totalTrades || 0)}</div>
              </div>
              <div style={{ padding: '12px 16px', borderRight: `1px solid ${darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`, borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em', color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)', marginBottom: 4 }}>7d Volume</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: darkMode ? '#fff' : '#212B36' }}>{fVolume(stats.volume7d || 0)}</div>
              </div>
              <div style={{ padding: '12px 16px', borderRight: `1px solid ${darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`, borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em', color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)', marginBottom: 4 }}>30d Volume</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: darkMode ? '#fff' : '#212B36' }}>{fVolume(stats.volume30d || 0)}</div>
              </div>
              <div style={{ padding: '12px 16px', borderRight: `1px solid ${darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`, borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em', color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)', marginBottom: 4 }}>Total Fees</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: darkMode ? '#fff' : '#212B36' }}>{fVolume(stats.totalFees || 0)}</div>
              </div>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em', color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)', marginBottom: 4 }}>Avg Trade</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: darkMode ? '#fff' : '#212B36' }}>{(stats.avgTradeSize || 0).toFixed(0)} XRP</div>
              </div>
            </div>
          </TableContainer>
        </Section>

        {/* AMM vs DEX - Token Specific */}
        <Section>
          <TableContainer darkMode={darkMode}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: darkMode ? '#fff' : '#212B36' }}>AMM vs DEX</span>
              <ButtonGroup>
                {[{ key: '24h', label: '24H' }, { key: '7d', label: '7D' }, { key: '30d', label: '30D' }, { key: 'all', label: 'All' }].map(r => (
                  <ToggleBtn key={r.key} active={ammTimeRange === r.key} darkMode={darkMode} onClick={() => setAmmTimeRange(r.key)}>
                    {r.label}
                  </ToggleBtn>
                ))}
              </ButtonGroup>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 0 }}>
              <div style={{ borderRight: `1px solid ${darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` }}>
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
                      <Td darkMode={darkMode} align="right" style={{ fontWeight: 500 }}>{fVolume(ammStats.volumeAMM)}</Td>
                      <Td darkMode={darkMode} align="right" style={{ fontWeight: 500 }}>{fVolume(ammStats.volumeNonAMM)}</Td>
                    </tr>
                    <tr>
                      <Td darkMode={darkMode} style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>Trades</Td>
                      <Td darkMode={darkMode} align="right">{fNumber(ammStats.tradesAMM)}</Td>
                      <Td darkMode={darkMode} align="right">{fNumber(ammStats.tradesNonAMM)}</Td>
                    </tr>
                    {ammTimeRange === '24h' && (
                      <tr>
                        <Td darkMode={darkMode} style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>Traders</Td>
                        <Td darkMode={darkMode} align="right">{fNumber(stats.uniqueTradersAMM || 0)}</Td>
                        <Td darkMode={darkMode} align="right">{fNumber(stats.uniqueTradersNonAMM || 0)}</Td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em', color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)', marginBottom: 16 }}>Pool Activity</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381', marginBottom: 4 }}>Deposits</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#10b981' }}>{fVolume(ammStats.ammDeposits)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381', marginBottom: 4 }}>Withdrawals</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#ef4444' }}>{fVolume(ammStats.ammWithdraws)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381', marginBottom: 4 }}>Net Flow</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: ammStats.ammNetFlow >= 0 ? '#10b981' : '#ef4444' }}>
                      {ammStats.ammNetFlow >= 0 ? '+' : ''}{fVolume(ammStats.ammNetFlow)}
                    </div>
                  </div>
                </div>
                {/* Visual comparison bar */}
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 4, color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                    <span>AMM vs DEX Volume Share</span>
                    <span>{ammStats.volumeAMM + ammStats.volumeNonAMM > 0 ? ((ammStats.volumeAMM / (ammStats.volumeAMM + ammStats.volumeNonAMM)) * 100).toFixed(1) : 0}% AMM</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', overflow: 'hidden', display: 'flex' }}>
                    <div style={{
                      height: '100%',
                      background: '#8b5cf6',
                      width: `${ammStats.volumeAMM + ammStats.volumeNonAMM > 0 ? (ammStats.volumeAMM / (ammStats.volumeAMM + ammStats.volumeNonAMM)) * 100 : 0}%`,
                      transition: 'width 0.3s ease'
                    }} />
                    <div style={{
                      height: '100%',
                      background: '#10b981',
                      flex: 1
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: '#8b5cf6' }} /> AMM
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: '#10b981' }} /> DEX
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TableContainer>
        </Section>
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
    const history = sortedDays.map(day => {
      // Transform volumeByPlatform to include fees
      const platformVolume = {};
      Object.entries(day.volumeByPlatform || {}).forEach(([platform, data]) => {
        platformVolume[platform] = {
          volume: data.volume || 0,
          trades: data.trades || 0,
          fees: data.fees || 0
        };
      });
      return {
        date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        volume: day.volume || 0,
        trades: day.trades || 0,
        marketcap: day.marketcap || 0,
        tokens: day.tokenCount || 0,
        volumeAMM: day.volumeAMM || 0,
        volumeNonAMM: day.volumeNonAMM || 0,
        tradesAMM: day.tradesAMM || 0,
        tradesNonAMM: day.tradesNonAMM || 0,
        ammDeposits: day.ammDepositVolume || 0,
        ammWithdraws: day.ammWithdrawVolume || 0,
        ammNetFlow: day.ammNetFlow || 0,
        platformVolume
      };
    });

    // Get platform names from daily data (for chart) and all-time stats (for table)
    const dailyPlatformNames = [...new Set(days.flatMap(d => Object.keys(d.volumeByPlatform || {})))].filter(Boolean);
    const platformNames = dailyPlatformNames.length > 0 ? dailyPlatformNames : Object.keys(platformStatsAll);

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

      // Platform stats (all-time from API)
      platformStatsAll,
      platformNames,

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
