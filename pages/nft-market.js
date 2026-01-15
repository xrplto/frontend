import { useState, useContext, useMemo, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import styled from '@emotion/styled';
import { AppContext } from 'src/AppContext';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
import { fNumber, fVolume } from 'src/utils/formatters';
import { TrendingUp, TrendingDown, Activity, Users, Flame, Image, ShoppingCart, ArrowRightLeft, ChevronDown, BarChart3, DollarSign, Wallet } from 'lucide-react';

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
  gap: 10px;
  margin-bottom: 20px;
  @media (min-width: 640px) { grid-template-columns: repeat(3, 1fr); }
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

const METRIC_GROUPS = [
  {
    label: 'Trading',
    icon: DollarSign,
    metrics: [
      { key: 'volume', label: 'Volume', format: fVolume },
      { key: 'sales', label: 'Sales', format: fNumber },
      { key: 'avgPrice', label: 'Avg Price', format: v => (v || 0).toFixed(2) + ' XRP' },
    ]
  },
  {
    label: 'Users',
    icon: Users,
    metrics: [
      { key: 'uniqueBuyers', label: 'Buyers', format: fNumber },
      { key: 'uniqueSellers', label: 'Sellers', format: fNumber },
      { key: 'uniqueCollections', label: 'Active Collections', format: fNumber },
    ]
  },
  {
    label: 'Activity',
    icon: Activity,
    metrics: [
      { key: 'mints', label: 'Mints', format: fNumber },
      { key: 'burns', label: 'Burns', format: fNumber },
      { key: 'transfers', label: 'Transfers', format: fNumber },
    ]
  },
  {
    label: 'Offers',
    icon: BarChart3,
    metrics: [
      { key: 'buyOffers', label: 'Buy Offers', format: fNumber },
      { key: 'sellOffers', label: 'Sell Offers', format: fNumber },
      { key: 'cancelledOffers', label: 'Cancelled', format: fNumber },
    ]
  },
  {
    label: 'Fees',
    icon: Wallet,
    metrics: [
      { key: 'royalties', label: 'Royalties', format: fVolume },
      { key: 'brokerFees', label: 'Broker Fees', format: fVolume },
    ]
  }
];

const ALL_METRICS = METRIC_GROUPS.flatMap(g => g.metrics);

const PLATFORM_COLORS = {
  'xrp.cafe': '#3b82f6',
  'BIDDS': '#10b981',
  'Direct': '#f59e0b',
  'XPMarket': '#8b5cf6',
  'OpulenceX': '#ec4899',
  'Other': '#6b7280',
  'Art Dept Fun': '#06b6d4'
};

export default function NFTMarketPage({ stats }) {
  const { themeName } = useContext(AppContext);
  const darkMode = themeName === 'XrplToDarkTheme';
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [timeRange, setTimeRange] = useState('90d');
  const [metric, setMetric] = useState('volume');
  const [hoverData, setHoverData] = useState(null);
  const [metricDropdownOpen, setMetricDropdownOpen] = useState(false);
  const [platformSort, setPlatformSort] = useState('volume');
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

  const volumeHistory = stats?.volumeHistory || [];

  const chartData = useMemo(() => {
    const range = TIME_RANGES.find(r => r.key === timeRange);
    return volumeHistory.slice(-range.days);
  }, [volumeHistory, timeRange]);

  const maxValue = useMemo(() => Math.max(...chartData.map(d => d[metric] || 0), 1), [chartData, metric]);

  const platformNames = useMemo(() => {
    const names = new Set();
    chartData.forEach(d => {
      if (d.volumeByPlatform) Object.keys(d.volumeByPlatform).forEach(p => names.add(p));
    });
    return Array.from(names).sort((a, b) => {
      const aTotal = chartData.reduce((sum, d) => sum + (d.volumeByPlatform?.[a] || 0), 0);
      const bTotal = chartData.reduce((sum, d) => sum + (d.volumeByPlatform?.[b] || 0), 0);
      return bTotal - aTotal;
    });
  }, [chartData]);

  const stackedMax = useMemo(() => {
    return Math.max(...chartData.map(d => d.volume || 0), 1);
  }, [chartData]);

  const periodTotal = useMemo(() => {
    return chartData.reduce((sum, d) => sum + (d[metric] || 0), 0);
  }, [chartData, metric]);

  const periodPlatformData = useMemo(() => {
    const data = {};
    chartData.forEach(day => {
      if (day.volumeByPlatform) {
        Object.entries(day.volumeByPlatform).forEach(([p, v]) => {
          if (!data[p]) data[p] = { volume: 0, sales: 0, royalties: 0, brokerFees: 0 };
          data[p].volume += v;
        });
      }
      if (day.salesByPlatform) {
        Object.entries(day.salesByPlatform).forEach(([p, s]) => {
          if (!data[p]) data[p] = { volume: 0, sales: 0, royalties: 0, brokerFees: 0 };
          data[p].sales += s;
        });
      }
      if (day.feesByPlatform) {
        Object.entries(day.feesByPlatform).forEach(([p, f]) => {
          if (!data[p]) data[p] = { volume: 0, sales: 0, royalties: 0, brokerFees: 0 };
          data[p].royalties += f.royalties || 0;
          data[p].brokerFees += f.brokerFees || 0;
        });
      }
    });
    return Object.entries(data)
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 8);
  }, [chartData]);

  const allTimePlatformData = useMemo(() => {
    const platformStats = stats?.platformStatsAll || {};
    return Object.entries(platformStats).map(([name, d]) => ({
      name,
      volume: d.volume || 0,
      sales: d.sales || 0,
      avgPrice: d.avgPrice || 0,
      royalties: d.royalties || 0,
      brokerFees: d.brokerFees || 0
    }));
  }, [stats?.platformStatsAll]);

  const sortedPlatformData = useMemo(() => {
    return [...allTimePlatformData].sort((a, b) => b[platformSort] - a[platformSort]);
  }, [allTimePlatformData, platformSort]);

  const maxPeriodPlatformVol = periodPlatformData[0]?.volume || 1;
  const maxSortedValue = sortedPlatformData[0]?.[platformSort] || 1;

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

  const metricConfig = ALL_METRICS.find(m => m.key === metric);

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
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em', color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)', marginBottom: 2 }}>
                    {TIME_RANGES.find(r => r.key === timeRange)?.label} Total
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: darkMode ? '#fff' : '#212B36' }}>
                    {metricConfig.format(periodTotal)}
                  </div>
                </div>
                <MetricSelect ref={dropdownRef}>
                  <MetricButton darkMode={darkMode} onClick={() => setMetricDropdownOpen(!metricDropdownOpen)}>
                    {metricConfig.label}
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
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
                  </linearGradient>
                  {platformNames.map(p => (
                    <linearGradient key={p} id={`grad-${p.replace(/[^a-zA-Z]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={PLATFORM_COLORS[p] || '#6b7280'} stopOpacity="0.6" />
                      <stop offset="100%" stopColor={PLATFORM_COLORS[p] || '#6b7280'} stopOpacity="0.1" />
                    </linearGradient>
                  ))}
                </defs>
                {metric === 'volume' ? (
                  platformNames.slice().reverse().map((platform, pIdx) => {
                    const stackedPoints = chartData.map((d, i) => {
                      const x = padding.left + (i / (chartData.length - 1 || 1)) * chartWidth;
                      let cumulative = 0;
                      platformNames.slice(0, platformNames.length - pIdx).forEach(p => {
                        cumulative += d.volumeByPlatform?.[p] || 0;
                      });
                      const y = padding.top + chartHeight - (cumulative / stackedMax) * chartHeight;
                      return { x, y };
                    });
                    const pathD = stackedPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                    const areaD = `${pathD} L ${stackedPoints[stackedPoints.length - 1]?.x || 0} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`;
                    return (
                      <path key={platform} d={areaD} fill={`url(#grad-${platform.replace(/[^a-zA-Z]/g, '')})`} />
                    );
                  })
                ) : (
                  <>
                    <path d={areaPath} fill="url(#areaGradient)" />
                    <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
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
                    {metric === 'volume' ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 6 }}>
                          <span style={{ opacity: 0.6 }}>Total</span>
                          <span style={{ fontWeight: 600 }}>{fVolume(hoverData.volume || 0)}</span>
                        </div>
                        {platformNames.map(p => {
                          const val = hoverData.volumeByPlatform?.[p] || 0;
                          if (val === 0) return null;
                          return (
                            <div key={p} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 11 }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ width: 8, height: 8, borderRadius: 2, background: PLATFORM_COLORS[p] || '#6b7280' }} />
                                {p}
                              </span>
                              <span>{fVolume(val)}</span>
                            </div>
                          );
                        })}
                      </>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 4 }}>
                          <span style={{ opacity: 0.6 }}>{metricConfig.label}</span>
                          <span style={{ fontWeight: 600, color: '#3b82f6' }}>{metricConfig.format(hoverData[metric] || 0)}</span>
                        </div>
                        {metric !== 'volume' && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
                            <span style={{ opacity: 0.6 }}>Volume</span>
                            <span>{fVolume(hoverData.volume || 0)}</span>
                          </div>
                        )}
                        {metric !== 'sales' && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
                            <span style={{ opacity: 0.6 }}>Sales</span>
                            <span>{fNumber(hoverData.sales || 0)}</span>
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
            {metric === 'volume' && (
              <div style={{ padding: '12px 16px', borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
                {platformNames.map(p => (
                  <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: PLATFORM_COLORS[p] || '#6b7280' }} />
                    {p}
                  </div>
                ))}
              </div>
            )}
          </ChartCard>
        </Section>

        {/* All-Time Platforms - Full Width */}
        <Section>
          <TableContainer darkMode={darkMode}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: darkMode ? '#fff' : '#212B36' }}>All-Time Platform Stats</span>
              <ButtonGroup>
                {[
                  { key: 'volume', label: 'Volume' },
                  { key: 'sales', label: 'Sales' },
                  { key: 'royalties', label: 'Royalties' }
                ].map(s => (
                  <ToggleBtn key={s.key} active={platformSort === s.key} darkMode={darkMode} onClick={() => setPlatformSort(s.key)}>
                    {s.label}
                  </ToggleBtn>
                ))}
              </ButtonGroup>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <Table style={{ minWidth: 600 }}>
                <thead>
                  <tr>
                    <Th darkMode={darkMode}>Platform</Th>
                    <Th darkMode={darkMode} align="right">Volume</Th>
                    <Th darkMode={darkMode} align="right">Sales</Th>
                    <Th darkMode={darkMode} align="right">Avg Price</Th>
                    <Th darkMode={darkMode} align="right">Royalties</Th>
                    <Th darkMode={darkMode} align="right">Broker Fees</Th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPlatformData.map((p) => (
                    <tr key={p.name}>
                      <Td darkMode={darkMode} style={{ minWidth: 140 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 2, background: PLATFORM_COLORS[p.name] || '#6b7280', flexShrink: 0 }} />
                          <span style={{ fontWeight: 500 }}>{p.name}</span>
                        </div>
                        <PlatformBar darkMode={darkMode} style={{ marginTop: 6 }}>
                          <PlatformFill style={{ width: `${(p[platformSort] / maxSortedValue) * 100}%`, background: PLATFORM_COLORS[p.name] || '#6b7280' }} />
                        </PlatformBar>
                      </Td>
                      <Td darkMode={darkMode} align="right" style={{ fontWeight: platformSort === 'volume' ? 600 : 400 }}>{fVolume(p.volume)}</Td>
                      <Td darkMode={darkMode} align="right" style={{ fontWeight: platformSort === 'sales' ? 600 : 400 }}>{fNumber(p.sales)}</Td>
                      <Td darkMode={darkMode} align="right" style={{ color: darkMode ? 'rgba(255,255,255,0.6)' : '#637381' }}>{p.avgPrice.toFixed(1)} XRP</Td>
                      <Td darkMode={darkMode} align="right" style={{ fontWeight: platformSort === 'royalties' ? 600 : 400 }}>{fVolume(p.royalties)}</Td>
                      <Td darkMode={darkMode} align="right" style={{ color: darkMode ? 'rgba(255,255,255,0.6)' : '#637381' }}>{fVolume(p.brokerFees)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </TableContainer>
        </Section>

        {/* Two Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {/* Period Platforms */}
          {timeRange !== 'all' && (
            <Section style={{ marginBottom: 0 }}>
              <TableContainer darkMode={darkMode}>
                <div style={{ padding: '12px 16px', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: darkMode ? '#fff' : '#212B36' }}>
                    Platform Activity ({TIME_RANGES.find(r => r.key === timeRange)?.label})
                  </span>
                </div>
                <Table>
                  <thead>
                    <tr>
                      <Th darkMode={darkMode}>Platform</Th>
                      <Th darkMode={darkMode} align="right">Volume</Th>
                      <Th darkMode={darkMode} align="right">Sales</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {periodPlatformData.map((p) => (
                      <tr key={p.name}>
                        <Td darkMode={darkMode}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 8, height: 8, borderRadius: 2, background: PLATFORM_COLORS[p.name] || '#6b7280', flexShrink: 0 }} />
                            {p.name}
                          </div>
                        </Td>
                        <Td darkMode={darkMode} align="right" style={{ fontWeight: 500 }}>{fVolume(p.volume)}</Td>
                        <Td darkMode={darkMode} align="right">{fNumber(p.sales)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableContainer>
            </Section>
          )}

          {/* Market Summary - Combined */}
          <Section style={{ marginBottom: 0 }}>
            <TableContainer darkMode={darkMode}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: darkMode ? '#fff' : '#212B36' }}>Market Summary</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` }}>
                <div style={{ padding: '12px 16px', borderRight: `1px solid ${darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em', color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)', marginBottom: 4 }}>Total Volume</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: darkMode ? '#fff' : '#212B36' }}>{fVolume(stats.totalVolume || 0)}</div>
                </div>
                <div style={{ padding: '12px 16px' }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em', color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)', marginBottom: 4 }}>Total Sales</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: darkMode ? '#fff' : '#212B36' }}>{fNumber(stats.totalSales || 0)}</div>
                </div>
              </div>
              <Table>
                <tbody>
                  <tr>
                    <Td darkMode={darkMode} style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>Collections</Td>
                    <Td darkMode={darkMode} align="right" style={{ fontWeight: 500 }}>{fNumber(stats.totalCollections || 0)}</Td>
                    <Td darkMode={darkMode} style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>Active (24h)</Td>
                    <Td darkMode={darkMode} align="right" style={{ fontWeight: 500 }}>{fNumber(stats.activeCollections24h || 0)}</Td>
                  </tr>
                  <tr>
                    <Td darkMode={darkMode} style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>Total Traders</Td>
                    <Td darkMode={darkMode} align="right" style={{ fontWeight: 500 }}>{fNumber(stats.totalTraders || 0)}</Td>
                    <Td darkMode={darkMode} style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>7d / 30d</Td>
                    <Td darkMode={darkMode} align="right" style={{ fontWeight: 500 }}>{fNumber(stats.activeTraders7d || 0)} / {fNumber(stats.activeTraders30d || 0)}</Td>
                  </tr>
                  <tr>
                    <Td darkMode={darkMode} style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>Buyers (24h)</Td>
                    <Td darkMode={darkMode} align="right" style={{ fontWeight: 500 }}>{fNumber(stats.uniqueBuyers24h || 0)}</Td>
                    <Td darkMode={darkMode} style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>Sellers (24h)</Td>
                    <Td darkMode={darkMode} align="right" style={{ fontWeight: 500 }}>{fNumber(stats.uniqueSellers24h || 0)}</Td>
                  </tr>
                  <tr>
                    <Td darkMode={darkMode} style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>Royalties (24h)</Td>
                    <Td darkMode={darkMode} align="right" style={{ fontWeight: 500 }}>{fVolume(stats.total24hRoyalties || 0)}</Td>
                    <Td darkMode={darkMode} style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : '#637381' }}>Fees (24h)</Td>
                    <Td darkMode={darkMode} align="right" style={{ fontWeight: 500 }}>{fVolume(stats.total24hBrokerFees || 0)}</Td>
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
