import { useState, useContext, useMemo, useRef, useCallback, useEffect } from 'react';
import api from 'src/utils/api';
import { ThemeContext } from 'src/context/AppContext';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
import { fNumber, fVolume } from 'src/utils/formatters';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Flame,
  Image,
  ShoppingCart,
  ArrowRightLeft,
  ChevronDown,
  BarChart3,
  DollarSign,
  Wallet,
  PiggyBank
} from 'lucide-react';
import { cn } from 'src/utils/cn';

// XRP value display component
const XrpValue = ({ value, format = fVolume, size = 'normal', showSymbol = true, color }) => {
  const formatted = format(value);
  return (
    <span
      className={cn('inline-flex items-center', size === 'small' ? 'gap-[3px]' : 'gap-[4px]')}
      style={{ color }}
    >
      <span>{formatted}</span>
      {showSymbol && (
        <span
          className={cn(
            'font-medium opacity-60 tracking-[0.02em]',
            size === 'small' ? 'text-[9px]' : size === 'large' ? 'text-[12px]' : 'text-[10px]'
          )}
        >
          XRP
        </span>
      )}
    </span>
  );
};

const BASE_URL = 'https://api.xrpl.to/v1';

const Container = ({ className, children, ...p }) => <div className={cn('max-w-[1920px] mx-auto px-4 py-6', className)} {...p}>{children}</div>;
const Title = ({ darkMode, className, children, ...p }) => <h1 className={cn('text-[22px] font-normal mb-1', darkMode ? 'text-white' : 'text-[#212B36]', className)} {...p}>{children}</h1>;
const Subtitle = ({ darkMode, className, children, ...p }) => <p className={cn('text-[13px] mb-6', darkMode ? 'text-white/50' : 'text-[#637381]', className)} {...p}>{children}</p>;
const Grid = ({ className, children, ...p }) => <div className={cn('grid grid-cols-2 gap-[10px] mb-5 sm:grid-cols-3 lg:grid-cols-6', className)} {...p}>{children}</div>;
const StatCard = ({ darkMode, className, children, ...p }) => <div className={cn('p-4 rounded-xl border', darkMode ? 'border-white/[0.08] bg-white/[0.02]' : 'border-black/[0.06] bg-white', className)} {...p}>{children}</div>;
const StatLabel = ({ darkMode, className, children, ...p }) => <p className={cn('text-[10px] uppercase tracking-[0.04em] mb-[6px] flex items-center gap-[6px]', darkMode ? 'text-white/40' : 'text-black/[0.45]', className)} {...p}>{children}</p>;
const StatValue = ({ darkMode, className, children, ...p }) => <p className={cn('text-lg font-semibold mb-1', darkMode ? 'text-white' : 'text-[#212B36]', className)} {...p}>{children}</p>;
const StatChange = ({ positive, className, children, ...p }) => <span className={cn('text-[11px] flex items-center gap-[2px]', positive ? 'text-[#10b981]' : 'text-[#ef4444]', className)} {...p}>{children}</span>;
const Section = ({ className, children, ...p }) => <div className={cn('mb-6', className)} {...p}>{children}</div>;
const ChartCard = ({ darkMode, className, children, ...p }) => <div className={cn('rounded-xl border', darkMode ? 'border-white/[0.08] bg-white/[0.02]' : 'border-black/[0.06] bg-white', className)} {...p}>{children}</div>;
const ChartHeader = ({ darkMode, className, children, ...p }) => <div className={cn('relative p-4 flex flex-wrap items-center justify-between gap-3 border-b z-10', darkMode ? 'border-white/[0.06]' : 'border-black/[0.06]', className)} {...p}>{children}</div>;
const ChartTitle = ({ darkMode, className, children, ...p }) => <h3 className={cn('text-sm font-medium', darkMode ? 'text-white' : 'text-[#212B36]', className)} {...p}>{children}</h3>;
const ButtonGroup = ({ className, children, ...p }) => <div className={cn('flex gap-1', className)} {...p}>{children}</div>;
const ToggleBtn = ({ active, darkMode, className, children, ...p }) => (
  <button className={cn('py-[6px] px-3 text-[11px] font-medium rounded-md border-none cursor-pointer transition-all duration-150', active ? 'bg-[#3b82f6] text-white hover:bg-[#2563eb]' : darkMode ? 'bg-white/[0.05] text-white/60 hover:bg-[rgba(59,130,246,0.1)]' : 'bg-black/[0.05] text-black/60 hover:bg-[rgba(59,130,246,0.1)]', className)} {...p}>{children}</button>
);
const MetricSelect = ({ className, children, ...p }) => <div className={cn('relative inline-block', className)} {...p}>{children}</div>;
const MetricButton = ({ darkMode, className, children, ...p }) => (
  <button className={cn('flex items-center gap-[6px] py-2 px-[14px] text-[13px] font-medium rounded-lg border cursor-pointer transition-all duration-150 hover:border-[#3b82f6]', darkMode ? 'border-white/10 bg-white/[0.03] text-white' : 'border-black/10 bg-white text-[#212B36]', className)} {...p}>{children}</button>
);
const MetricDropdown = ({ darkMode, className, children, ...p }) => (
  <div className={cn('absolute top-[calc(100%+4px)] left-0 min-w-[200px] p-[6px] rounded-[10px] border shadow-[0_8px_24px_rgba(0,0,0,0.15)] z-50', darkMode ? 'border-white/10 bg-[#1a1a1a]' : 'border-black/10 bg-white', className)} {...p}>{children}</div>
);
const MetricGroup = ({ darkMode, className, children, ...p }) => <div className={cn('[&:not(:last-child)]:border-b [&:not(:last-child)]:pb-[6px] [&:not(:last-child)]:mb-[6px]', darkMode ? '[&:not(:last-child)]:border-white/[0.06]' : '[&:not(:last-child)]:border-black/[0.06]', className)} {...p}>{children}</div>;
const MetricGroupLabel = ({ darkMode, className, children, ...p }) => <div className={cn('text-[9px] font-semibold uppercase tracking-[0.05em] py-1 px-[10px]', darkMode ? 'text-white/[0.35]' : 'text-black/[0.35]', className)} {...p}>{children}</div>;
const MetricOption = ({ active, darkMode, className, children, ...p }) => (
  <button className={cn('block w-full py-2 px-[10px] text-xs text-left border-none rounded-md cursor-pointer transition-all duration-100', active ? 'bg-[rgba(59,130,246,0.15)] text-[#3b82f6] hover:bg-[rgba(59,130,246,0.2)]' : cn(darkMode ? 'text-white' : 'text-[#212B36]', 'bg-transparent hover:bg-[rgba(59,130,246,0.08)]'), className)} {...p}>{children}</button>
);
const ChartArea = ({ className, children, ...p }) => <div className={cn('relative h-[280px] pt-5 px-4 pb-10', className)} {...p}>{children}</div>;
const ChartSvg = ({ className, children, ...p }) => <svg className={cn('w-full h-full overflow-visible', className)} {...p}>{children}</svg>;
const Tooltip = ({ darkMode, className, children, ...p }) => (
  <div className={cn('absolute py-[10px] px-[14px] rounded-lg text-xs pointer-events-none z-20 shadow-[0_4px_12px_rgba(0,0,0,0.15)]', darkMode ? 'bg-black/90 border border-white/10 text-white' : 'bg-white/95 border border-black/10 text-[#212B36]', className)} {...p}>{children}</div>
);
const TableContainer = ({ darkMode, className, children, ...p }) => <div className={cn('rounded-xl border overflow-hidden', darkMode ? 'border-white/[0.08] bg-white/[0.02]' : 'border-black/[0.06] bg-white', className)} {...p}>{children}</div>;
const Table = ({ className, children, ...p }) => <table className={cn('w-full border-collapse', className)} {...p}>{children}</table>;
const Th = ({ darkMode, align, className, children, ...p }) => <th className={cn('text-[10px] font-medium uppercase tracking-[0.04em] py-3 px-4', darkMode ? 'text-white/40 border-b border-white/[0.06]' : 'text-black/[0.45] border-b border-black/[0.06]', className)} style={{ textAlign: align || 'left' }} {...p}>{children}</th>;
const Td = ({ darkMode, align, className, children, ...p }) => <td className={cn('text-xs py-3 px-4', darkMode ? 'text-white border-b border-white/[0.04]' : 'text-[#212B36] border-b border-black/[0.04]', className)} style={{ textAlign: align || 'left' }} {...p}>{children}</td>;
const PlatformBar = ({ darkMode, className, children, ...p }) => <div className={cn('h-[6px] rounded-[3px] overflow-hidden mt-1', darkMode ? 'bg-white/10' : 'bg-black/10', className)} {...p}>{children}</div>;
const PlatformFill = ({ className, ...p }) => <div className={cn('h-full bg-[#3b82f6] rounded-[3px]', className)} {...p} />;

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
      { key: 'avgPrice', label: 'Avg Price', format: (v) => (v || 0).toFixed(2) + ' XRP' }
    ]
  },
  {
    label: 'Users',
    icon: Users,
    metrics: [
      { key: 'uniqueBuyers', label: 'Buyers', format: fNumber },
      { key: 'uniqueSellers', label: 'Sellers', format: fNumber },
      { key: 'uniqueCollections', label: 'Active Collections', format: fNumber }
    ]
  },
  {
    label: 'Activity',
    icon: Activity,
    metrics: [
      { key: 'mints', label: 'Mints', format: fNumber },
      { key: 'burns', label: 'Burns', format: fNumber },
      { key: 'transfers', label: 'Transfers', format: fNumber }
    ]
  },
  {
    label: 'Offers',
    icon: BarChart3,
    metrics: [
      { key: 'buyOffers', label: 'Buy Offers', format: fNumber },
      { key: 'sellOffers', label: 'Sell Offers', format: fNumber },
      { key: 'cancelledOffers', label: 'Cancelled', format: fNumber }
    ]
  },
  {
    label: 'Fees',
    icon: Wallet,
    metrics: [
      { key: 'royalties', label: 'Royalties', format: fVolume },
      { key: 'brokerFees', label: 'Broker Fees', format: fVolume }
    ]
  }
];

const ALL_METRICS = METRIC_GROUPS.flatMap((g) => g.metrics);

const PLATFORM_COLORS = {
  'xrp.cafe': '#3b82f6',
  BIDDS: '#10b981',
  Direct: '#f59e0b',
  XPMarket: '#8b5cf6',
  OpulenceX: '#ec4899',
  Other: '#6b7280',
  'Art Dept Fun': '#06b6d4'
};

export default function NFTMarketPage({ stats }) {
  const { themeName } = useContext(ThemeContext);
  const darkMode = themeName === 'XrplToDarkTheme';
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [timeRange, setTimeRange] = useState('90d');
  const [metric, setMetric] = useState('volume');
  const [hoverData, setHoverData] = useState(null);
  const [metricDropdownOpen, setMetricDropdownOpen] = useState(false);
  const [platformSort, setPlatformSort] = useState('volume');
  const [platformTimeRange, setPlatformTimeRange] = useState('all');
  const [platformExpanded, setPlatformExpanded] = useState(false);
  const [summaryTimeRange, setSummaryTimeRange] = useState('all');
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
    const range = TIME_RANGES.find((r) => r.key === timeRange);
    return volumeHistory.slice(-range.days);
  }, [volumeHistory, timeRange]);

  const maxValue = useMemo(
    () => Math.max(...chartData.map((d) => d[metric] || 0), 1),
    [chartData, metric]
  );

  const platformNames = useMemo(() => {
    const names = new Set();
    chartData.forEach((d) => {
      if (d.volumeByPlatform) Object.keys(d.volumeByPlatform).forEach((p) => names.add(p));
    });
    return Array.from(names).sort((a, b) => {
      const aTotal = chartData.reduce(
        (sum, d) => sum + (d.volumeByPlatform?.[a]?.volume || d.volumeByPlatformFlat?.[a] || 0),
        0
      );
      const bTotal = chartData.reduce(
        (sum, d) => sum + (d.volumeByPlatform?.[b]?.volume || d.volumeByPlatformFlat?.[b] || 0),
        0
      );
      return bTotal - aTotal;
    });
  }, [chartData]);

  const stackedMax = useMemo(() => {
    return Math.max(...chartData.map((d) => d.volume || 0), 1);
  }, [chartData]);

  const periodTotal = useMemo(() => {
    return chartData.reduce((sum, d) => sum + (d[metric] || 0), 0);
  }, [chartData, metric]);

  const periodPlatformData = useMemo(() => {
    const data = {};
    chartData.forEach((day) => {
      if (day.volumeByPlatform) {
        Object.entries(day.volumeByPlatform).forEach(([p, v]) => {
          if (!data[p]) data[p] = { volume: 0, sales: 0, royalties: 0, brokerFees: 0 };
          // Handle both new {volume, sales} and old number format
          data[p].volume += v?.volume || v || 0;
          data[p].sales += v?.sales || 0;
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

  // Platform stats based on selected time range
  const platformStats = useMemo(() => {
    if (platformTimeRange === 'all') {
      return Object.entries(stats?.platformStatsAll || {}).map(([name, d]) => ({
        name,
        volume: d.volume || 0,
        sales: d.sales || 0,
        avgPrice: d.avgPrice || 0,
        royalties: d.royalties || 0,
        brokerFees: d.brokerFees || 0
      }));
    }
    const rangeDays =
      platformTimeRange === '24h'
        ? 1
        : platformTimeRange === '7d'
          ? 7
          : platformTimeRange === '30d'
            ? 30
            : 90;
    const data = volumeHistory.slice(-rangeDays);
    const aggregated = {};
    data.forEach((day) => {
      if (day.volumeByPlatform) {
        Object.entries(day.volumeByPlatform).forEach(([p, v]) => {
          if (!aggregated[p]) aggregated[p] = { volume: 0, sales: 0, royalties: 0, brokerFees: 0 };
          aggregated[p].volume += v?.volume || v || 0;
          aggregated[p].sales += v?.sales || 0;
        });
      }
      if (day.feesByPlatform) {
        Object.entries(day.feesByPlatform).forEach(([p, f]) => {
          if (!aggregated[p]) aggregated[p] = { volume: 0, sales: 0, royalties: 0, brokerFees: 0 };
          aggregated[p].royalties += f.royalties || 0;
          aggregated[p].brokerFees += f.brokerFees || 0;
        });
      }
    });
    return Object.entries(aggregated)
      .map(([name, d]) => ({ name, ...d, avgPrice: d.sales > 0 ? d.volume / d.sales : 0 }))
      .filter((p) => p.volume > 0 || p.sales > 0);
  }, [volumeHistory, platformTimeRange, stats?.platformStatsAll]);

  const summaryStats = useMemo(() => {
    const rangeDays =
      summaryTimeRange === '24h'
        ? 1
        : summaryTimeRange === '7d'
          ? 7
          : summaryTimeRange === '30d'
            ? 30
            : volumeHistory.length;
    const data = volumeHistory.slice(-rangeDays);
    return data.reduce(
      (acc, d) => {
        acc.volume += d.volume || 0;
        acc.sales += d.sales || 0;
        acc.royalties += d.royalties || 0;
        acc.brokerFees += d.brokerFees || 0;
        acc.mints += d.mints || 0;
        acc.burns += d.burns || 0;
        acc.transfers += d.transfers || 0;
        acc.buyers += d.uniqueBuyers || 0;
        acc.sellers += d.uniqueSellers || 0;
        return acc;
      },
      {
        volume: 0,
        sales: 0,
        royalties: 0,
        brokerFees: 0,
        mints: 0,
        burns: 0,
        transfers: 0,
        buyers: 0,
        sellers: 0,
        collections: stats?.totalCollections || 0
      }
    );
  }, [volumeHistory, summaryTimeRange, stats?.totalCollections]);

  const sortedPlatformData = useMemo(() => {
    return [...platformStats].sort((a, b) => b[platformSort] - a[platformSort]);
  }, [platformStats, platformSort]);

  const maxPeriodPlatformVol = periodPlatformData[0]?.volume || 1;
  const maxSortedValue = sortedPlatformData[0]?.[platformSort] || 1;

  if (!stats) {
    return (
      <div className="min-h-screen">
        <div id="back-to-top-anchor" className="h-[24px]" />
        <Header
          notificationPanelOpen={notificationPanelOpen}
          onNotificationPanelToggle={setNotificationPanelOpen}
        />
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

  const metricConfig = ALL_METRICS.find((m) => m.key === metric);

  return (
    <div className="min-h-screen overflow-hidden">
      <div id="back-to-top-anchor" className="h-[24px]" />
      <Header
        notificationPanelOpen={notificationPanelOpen}
        onNotificationPanelToggle={setNotificationPanelOpen}
      />

      <Container>
        <Title darkMode={darkMode}>NFT Market Stats</Title>
        <Subtitle darkMode={darkMode}>Real-time XRPL NFT market analytics</Subtitle>

        <Grid>
          <StatCard darkMode={darkMode}>
            <StatLabel darkMode={darkMode}>
              <Activity size={12} /> 24h Volume
            </StatLabel>
            <StatValue darkMode={darkMode}>
              <XrpValue value={stats.total24hVolume || 0} size="large" />
            </StatValue>
            <StatChange positive={stats.volumePct >= 0}>
              {stats.volumePct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(stats.volumePct || 0).toFixed(1)}%
            </StatChange>
          </StatCard>

          <StatCard darkMode={darkMode}>
            <StatLabel darkMode={darkMode}>
              <ShoppingCart size={12} /> 24h Sales
            </StatLabel>
            <StatValue darkMode={darkMode}>{fNumber(stats.total24hSales || 0)}</StatValue>
            <StatChange positive={stats.salesPct >= 0}>
              {stats.salesPct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(stats.salesPct || 0).toFixed(1)}%
            </StatChange>
          </StatCard>

          <StatCard darkMode={darkMode}>
            <StatLabel darkMode={darkMode}>
              <Users size={12} /> Active Traders
            </StatLabel>
            <StatValue darkMode={darkMode}>{fNumber(stats.activeTraders24h || 0)}</StatValue>
            <StatChange positive={stats.activeTradersPct >= 0}>
              {stats.activeTradersPct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(stats.activeTradersPct || 0).toFixed(1)}%
            </StatChange>
          </StatCard>

          <StatCard darkMode={darkMode}>
            <StatLabel darkMode={darkMode}>
              <Image size={12} /> 24h Mints
            </StatLabel>
            <StatValue darkMode={darkMode}>{fNumber(stats.total24hMints || 0)}</StatValue>
            <StatChange positive={stats.mintsPct >= 0}>
              {stats.mintsPct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(stats.mintsPct || 0).toFixed(1)}%
            </StatChange>
          </StatCard>

          <StatCard darkMode={darkMode}>
            <StatLabel darkMode={darkMode}>
              <Flame size={12} /> 24h Burns
            </StatLabel>
            <StatValue darkMode={darkMode}>{fNumber(stats.total24hBurns || 0)}</StatValue>
            <StatChange positive={stats.burnsPct >= 0}>
              {stats.burnsPct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(stats.burnsPct || 0).toFixed(1)}%
            </StatChange>
          </StatCard>

          <StatCard darkMode={darkMode}>
            <StatLabel darkMode={darkMode}>
              <ArrowRightLeft size={12} /> 24h Transfers
            </StatLabel>
            <StatValue darkMode={darkMode}>{fNumber(stats.total24hTransfers || 0)}</StatValue>
            <StatChange positive={stats.transfersPct >= 0}>
              {stats.transfersPct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(stats.transfersPct || 0).toFixed(1)}%
            </StatChange>
          </StatCard>
        </Grid>

        <Section>
          <ChartCard darkMode={darkMode}>
            <ChartHeader darkMode={darkMode}>
              <div className="flex items-center gap-[16px] flex-wrap">
                <div>
                  <div
                    className={cn('text-[10px] uppercase tracking-[0.04em] mb-[2px]', darkMode ? 'text-white/40' : 'text-black/[0.45]')}
                  >
                    {TIME_RANGES.find((r) => r.key === timeRange)?.label} Total
                  </div>
                  <div
                    className={cn('text-[20px] font-semibold', darkMode ? 'text-white' : 'text-[#212B36]')}
                  >
                    {['volume', 'royalties', 'brokerFees'].includes(metric) ? (
                      <XrpValue value={periodTotal} size="large" />
                    ) : metric === 'avgPrice' ? (
                      <XrpValue
                        value={periodTotal}
                        size="large"
                        format={(v) => (v || 0).toFixed(2)}
                      />
                    ) : (
                      metricConfig.format(periodTotal)
                    )}
                  </div>
                </div>
                <MetricSelect ref={dropdownRef}>
                  <MetricButton
                    darkMode={darkMode}
                    onClick={() => setMetricDropdownOpen(!metricDropdownOpen)}
                  >
                    {metricConfig.label}
                    <ChevronDown
                      size={14}
                      className={cn('opacity-50 transition-transform duration-150', metricDropdownOpen && 'rotate-180')}
                    />
                  </MetricButton>
                  {metricDropdownOpen && (
                    <MetricDropdown darkMode={darkMode}>
                      {METRIC_GROUPS.map((group) => (
                        <MetricGroup key={group.label} darkMode={darkMode}>
                          <MetricGroupLabel darkMode={darkMode}>{group.label}</MetricGroupLabel>
                          {group.metrics.map((m) => (
                            <MetricOption
                              key={m.key}
                              active={metric === m.key}
                              darkMode={darkMode}
                              onClick={() => handleMetricSelect(m.key)}
                            >
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
                {TIME_RANGES.map((r) => (
                  <ToggleBtn
                    key={r.key}
                    active={timeRange === r.key}
                    darkMode={darkMode}
                    onClick={() => setTimeRange(r.key)}
                  >
                    {r.label}
                  </ToggleBtn>
                ))}
              </ButtonGroup>
            </ChartHeader>
            <ChartArea
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = (e.clientX - rect.left - 16) / (rect.width - 32);
                const idx = Math.min(
                  Math.max(Math.round(x * (chartData.length - 1)), 0),
                  chartData.length - 1
                );
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
                  {platformNames.map((p) => (
                    <linearGradient
                      key={p}
                      id={`grad-${p.replace(/[^a-zA-Z]/g, '')}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={PLATFORM_COLORS[p] || '#6b7280'}
                        stopOpacity="0.6"
                      />
                      <stop
                        offset="100%"
                        stopColor={PLATFORM_COLORS[p] || '#6b7280'}
                        stopOpacity="0.1"
                      />
                    </linearGradient>
                  ))}
                </defs>
                {metric === 'volume' ? (
                  platformNames
                    .slice()
                    .reverse()
                    .map((platform, pIdx) => {
                      const stackedPoints = chartData.map((d, i) => {
                        const x = padding.left + (i / (chartData.length - 1 || 1)) * chartWidth;
                        let cumulative = 0;
                        platformNames.slice(0, platformNames.length - pIdx).forEach((p) => {
                          cumulative +=
                            d.volumeByPlatform?.[p]?.volume || d.volumeByPlatformFlat?.[p] || 0;
                        });
                        const y =
                          padding.top + chartHeight - (cumulative / stackedMax) * chartHeight;
                        return { x, y };
                      });
                      const pathD = stackedPoints
                        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                        .join(' ');
                      const areaD = `${pathD} L ${stackedPoints[stackedPoints.length - 1]?.x || 0} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`;
                      return (
                        <path
                          key={platform}
                          d={areaD}
                          fill={`url(#grad-${platform.replace(/[^a-zA-Z]/g, '')})`}
                        />
                      );
                    })
                ) : (
                  <>
                    <path d={areaPath} fill="url(#areaGradient)" />
                    <path
                      d={linePath}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="0.4"
                      vectorEffect="non-scaling-stroke"
                    />
                  </>
                )}
              </ChartSvg>
              {hoverData && (
                <>
                  <div
                    className={cn('absolute top-0 bottom-[40px] w-[1px] pointer-events-none', darkMode ? 'bg-white/15' : 'bg-black/10')}
                    style={{ left: hoverData.x }}
                  />
                  <Tooltip
                    darkMode={darkMode}
                    style={{ left: Math.min(Math.max(hoverData.x - 80, 10), 300), top: 10 }}
                  >
                    <div className="font-semibold mb-[6px] text-[11px] opacity-70">
                      {hoverData.date}
                    </div>
                    {metric === 'volume' ? (
                      <>
                        <div className="flex justify-between gap-[20px] mb-[6px]">
                          <span className="opacity-60">Total</span>
                          <span className="font-semibold">
                            <XrpValue value={hoverData.volume || 0} size="small" />
                          </span>
                        </div>
                        {platformNames.map((p) => {
                          const val =
                            hoverData.volumeByPlatform?.[p]?.volume ||
                            hoverData.volumeByPlatformFlat?.[p] ||
                            0;
                          if (val === 0) return null;
                          return (
                            <div
                              key={p}
                              className="flex justify-between gap-[16px] text-[11px]"
                            >
                              <span className="flex items-center gap-[6px]">
                                <span
                                  className="w-[8px] h-[8px] rounded-[2px]"
                                  style={{ background: PLATFORM_COLORS[p] || '#6b7280' }}
                                />
                                {p}
                              </span>
                              <span>
                                <XrpValue value={val} size="small" showSymbol={false} />
                              </span>
                            </div>
                          );
                        })}
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between gap-[20px] mb-[4px]">
                          <span className="opacity-60">{metricConfig.label}</span>
                          <span className="font-semibold text-[#3b82f6]">
                            {['royalties', 'brokerFees', 'avgPrice'].includes(metric) ? (
                              <XrpValue
                                value={hoverData[metric] || 0}
                                size="small"
                                format={
                                  metric === 'avgPrice' ? (v) => (v || 0).toFixed(2) : fVolume
                                }
                              />
                            ) : (
                              metricConfig.format(hoverData[metric] || 0)
                            )}
                          </span>
                        </div>
                        {metric !== 'volume' && (
                          <div className="flex justify-between gap-[20px]">
                            <span className="opacity-60">Volume</span>
                            <span>
                              <XrpValue value={hoverData.volume || 0} size="small" />
                            </span>
                          </div>
                        )}
                        {metric !== 'sales' && (
                          <div className="flex justify-between gap-[20px]">
                            <span className="opacity-60">Sales</span>
                            <span>{fNumber(hoverData.sales || 0)}</span>
                          </div>
                        )}
                      </>
                    )}
                  </Tooltip>
                </>
              )}
              <div
                className={cn('absolute bottom-[8px] left-[16px] right-[16px] flex justify-between text-[10px]', darkMode ? 'text-white/30' : 'text-black/30')}
              >
                <span>{chartData[0]?.date}</span>
                <span>{chartData[chartData.length - 1]?.date}</span>
              </div>
            </ChartArea>
            {metric === 'volume' && (
              <div
                className={cn('py-[12px] px-[16px] flex flex-wrap gap-[8px_16px] border-t', darkMode ? 'border-white/[0.06]' : 'border-black/[0.06]')}
              >
                {platformNames.map((p) => (
                  <div
                    key={p}
                    className={cn('flex items-center gap-[6px] text-[11px]', darkMode ? 'text-white/70' : 'text-black/70')}
                  >
                    <span
                      className="w-[10px] h-[10px] rounded-[2px]"
                      style={{ background: PLATFORM_COLORS[p] || '#6b7280' }}
                    />
                    {p}
                  </div>
                ))}
              </div>
            )}
          </ChartCard>
        </Section>

        {/* Platform Stats - Full Width */}
        <Section>
          <TableContainer darkMode={darkMode}>
            <div
              className={cn('py-[12px] px-[16px] flex justify-between items-center flex-wrap gap-[8px] border-b', darkMode ? 'border-white/[0.06]' : 'border-black/[0.06]')}
            >
              <span className={cn('text-[12px] font-medium', darkMode ? 'text-white' : 'text-[#212B36]')}>
                Platform Stats
              </span>
              <div className="flex gap-[8px] flex-wrap">
                <ButtonGroup>
                  {[
                    { key: '24h', label: '24H' },
                    { key: '7d', label: '7D' },
                    { key: '30d', label: '30D' },
                    { key: 'all', label: 'All' }
                  ].map((r) => (
                    <ToggleBtn
                      key={r.key}
                      active={platformTimeRange === r.key}
                      darkMode={darkMode}
                      onClick={() => setPlatformTimeRange(r.key)}
                    >
                      {r.label}
                    </ToggleBtn>
                  ))}
                </ButtonGroup>
                <ButtonGroup>
                  {[
                    { key: 'volume', label: 'Volume' },
                    { key: 'sales', label: 'Sales' },
                    { key: 'royalties', label: 'Royalties' }
                  ].map((s) => (
                    <ToggleBtn
                      key={s.key}
                      active={platformSort === s.key}
                      darkMode={darkMode}
                      onClick={() => setPlatformSort(s.key)}
                    >
                      {s.label}
                    </ToggleBtn>
                  ))}
                </ButtonGroup>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table style={{ minWidth: 600 }}>
                <thead>
                  <tr>
                    <Th darkMode={darkMode}>Platform</Th>
                    <Th darkMode={darkMode} align="right">
                      Volume
                    </Th>
                    <Th darkMode={darkMode} align="right">
                      Sales
                    </Th>
                    <Th darkMode={darkMode} align="right">
                      Avg Price
                    </Th>
                    <Th darkMode={darkMode} align="right">
                      Royalties
                    </Th>
                    <Th darkMode={darkMode} align="right">
                      Broker Fees
                    </Th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const displayPlatforms = platformExpanded
                      ? sortedPlatformData
                      : sortedPlatformData.slice(0, 10);
                    if (displayPlatforms.length === 0) {
                      return (
                        <tr>
                          <Td
                            darkMode={darkMode}
                            colSpan={6}
                            className={cn('text-center p-[24px]', darkMode ? 'text-white/40' : 'text-black/40')}
                          >
                            No platform data available for this period
                          </Td>
                        </tr>
                      );
                    }
                    return displayPlatforms.map((p) => (
                      <tr key={p.name}>
                        <Td darkMode={darkMode} className="min-w-[140px]">
                          <div className="flex items-center gap-[8px]">
                            <span
                              className="w-[10px] h-[10px] rounded-[2px] shrink-0"
                              style={{ background: PLATFORM_COLORS[p.name] || '#6b7280' }}
                            />
                            <span className="font-medium">{p.name}</span>
                          </div>
                          <PlatformBar darkMode={darkMode} className="mt-[6px]">
                            <PlatformFill
                              className="transition-[width] duration-300 ease-in-out"
                              style={{
                                width: `${(p[platformSort] / maxSortedValue) * 100}%`,
                                background: PLATFORM_COLORS[p.name] || '#6b7280'
                              }}
                            />
                          </PlatformBar>
                        </Td>
                        <Td
                          darkMode={darkMode}
                          align="right"
                          className={platformSort === 'volume' ? 'font-semibold' : 'font-normal'}
                        >
                          <XrpValue value={p.volume} size="small" />
                        </Td>
                        <Td
                          darkMode={darkMode}
                          align="right"
                          className={platformSort === 'sales' ? 'font-semibold' : 'font-normal'}
                        >
                          {fNumber(p.sales)}
                        </Td>
                        <Td
                          darkMode={darkMode}
                          align="right"
                          className={darkMode ? 'text-white/60' : 'text-[#637381]'}
                        >
                          <XrpValue
                            value={p.avgPrice || 0}
                            format={(v) => (v || 0).toFixed(1)}
                            size="small"
                          />
                        </Td>
                        <Td
                          darkMode={darkMode}
                          align="right"
                          className={platformSort === 'royalties' ? 'font-semibold' : 'font-normal'}
                        >
                          <XrpValue value={p.royalties} size="small" />
                        </Td>
                        <Td
                          darkMode={darkMode}
                          align="right"
                          className={darkMode ? 'text-white/60' : 'text-[#637381]'}
                        >
                          <XrpValue value={p.brokerFees} size="small" />
                        </Td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </Table>
            </div>
            {/* Show more button */}
            {sortedPlatformData.length > 10 && (
              <div
                className={cn('py-[12px] px-[16px] text-center border-t', darkMode ? 'border-white/[0.06]' : 'border-black/[0.06]')}
              >
                <button
                  onClick={() => setPlatformExpanded(!platformExpanded)}
                  className="bg-transparent border-none text-[#3b82f6] text-[12px] font-medium cursor-pointer py-[6px] px-[12px] rounded-[6px] hover:bg-[rgba(59,130,246,0.1)]"
                >
                  {platformExpanded ? 'Show less' : `Show ${sortedPlatformData.length - 10} more`}
                </button>
              </div>
            )}
            {/* Period summary */}
            <div
              className={cn('py-[12px] px-[16px] flex flex-wrap gap-[24px] text-[12px] border-t', darkMode ? 'border-white/[0.06]' : 'border-black/[0.06]')}
            >
              <div>
                <span className={darkMode ? 'text-white/40' : 'text-black/40'}>
                  Total Volume:{' '}
                </span>
                <span className={cn('font-semibold', darkMode ? 'text-white' : 'text-[#212B36]')}>
                  <XrpValue value={platformStats.reduce((s, p) => s + p.volume, 0)} />
                </span>
              </div>
              <div>
                <span className={darkMode ? 'text-white/40' : 'text-black/40'}>
                  Total Sales:{' '}
                </span>
                <span className={cn('font-semibold', darkMode ? 'text-white' : 'text-[#212B36]')}>
                  {fNumber(platformStats.reduce((s, p) => s + p.sales, 0))}
                </span>
              </div>
              <div>
                <span className={darkMode ? 'text-white/40' : 'text-black/40'}>
                  Platforms:{' '}
                </span>
                <span className={cn('font-semibold', darkMode ? 'text-white' : 'text-[#212B36]')}>
                  {platformStats.length}
                </span>
              </div>
            </div>
          </TableContainer>
        </Section>

        {/* Trader Balances */}
        {stats.traderBalances?.balanceAll > 0 && (
          <Section>
            <TableContainer darkMode={darkMode}>
              <div
                className={cn('py-[12px] px-[16px] flex items-center gap-[8px] border-b', darkMode ? 'border-white/[0.06]' : 'border-black/[0.06]')}
              >
                <PiggyBank size={14} className="text-[#3b82f6]" />
                <span
                  className={cn('text-[12px] font-medium', darkMode ? 'text-white' : 'text-[#212B36]')}
                >
                  Trader Balances
                </span>
              </div>
              <div className="grid grid-cols-4">
                <div
                  className={cn('py-[14px] px-[16px] border-r', darkMode ? 'border-white/[0.04]' : 'border-black/[0.04]')}
                >
                  <div
                    className={cn('text-[10px] uppercase tracking-[0.04em] mb-[4px]', darkMode ? 'text-white/40' : 'text-black/[0.45]')}
                  >
                    24h Active
                  </div>
                  <div
                    className={cn('text-[16px] font-semibold', darkMode ? 'text-white' : 'text-[#212B36]')}
                  >
                    <XrpValue value={stats.traderBalances.balance24h || 0} />
                  </div>
                  <div
                    className={cn('text-[10px] mt-[2px]', darkMode ? 'text-white/[0.35]' : 'text-black/[0.35]')}
                  >
                    {fNumber(stats.traderBalances.traders24h || 0)} traders
                  </div>
                </div>
                <div
                  className={cn('py-[14px] px-[16px] border-r', darkMode ? 'border-white/[0.04]' : 'border-black/[0.04]')}
                >
                  <div
                    className={cn('text-[10px] uppercase tracking-[0.04em] mb-[4px]', darkMode ? 'text-white/40' : 'text-black/[0.45]')}
                  >
                    7d Active
                  </div>
                  <div
                    className={cn('text-[16px] font-semibold', darkMode ? 'text-white' : 'text-[#212B36]')}
                  >
                    <XrpValue value={stats.traderBalances.balance7d || 0} />
                  </div>
                  <div
                    className={cn('text-[10px] mt-[2px]', darkMode ? 'text-white/[0.35]' : 'text-black/[0.35]')}
                  >
                    {fNumber(stats.traderBalances.traders7d || 0)} traders
                  </div>
                </div>
                <div
                  className={cn('py-[14px] px-[16px] border-r', darkMode ? 'border-white/[0.04]' : 'border-black/[0.04]')}
                >
                  <div
                    className={cn('text-[10px] uppercase tracking-[0.04em] mb-[4px]', darkMode ? 'text-white/40' : 'text-black/[0.45]')}
                  >
                    30d Active
                  </div>
                  <div
                    className={cn('text-[16px] font-semibold', darkMode ? 'text-white' : 'text-[#212B36]')}
                  >
                    <XrpValue value={stats.traderBalances.balance30d || 0} />
                  </div>
                  <div
                    className={cn('text-[10px] mt-[2px]', darkMode ? 'text-white/[0.35]' : 'text-black/[0.35]')}
                  >
                    {fNumber(stats.traderBalances.traders30d || 0)} traders
                  </div>
                </div>
                <div className="py-[14px] px-[16px]">
                  <div
                    className={cn('text-[10px] uppercase tracking-[0.04em] mb-[4px]', darkMode ? 'text-white/40' : 'text-black/[0.45]')}
                  >
                    All Time
                  </div>
                  <div
                    className={cn('text-[16px] font-semibold', darkMode ? 'text-white' : 'text-[#212B36]')}
                  >
                    <XrpValue value={stats.traderBalances.balanceAll || 0} />
                  </div>
                  <div
                    className={cn('text-[10px] mt-[2px]', darkMode ? 'text-white/[0.35]' : 'text-black/[0.35]')}
                  >
                    {fNumber(stats.traderBalances.tradersAll || 0)} traders
                  </div>
                </div>
              </div>
            </TableContainer>
          </Section>
        )}

        {/* Market Summary */}
        <Section>
          <TableContainer darkMode={darkMode}>
            <div
              className={cn('py-[12px] px-[16px] flex justify-between items-center border-b', darkMode ? 'border-white/[0.06]' : 'border-black/[0.06]')}
            >
              <span className={cn('text-[12px] font-medium', darkMode ? 'text-white' : 'text-[#212B36]')}>
                Market Summary
              </span>
              <div className="flex gap-[4px]">
                {['24h', '7d', '30d', 'all'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setSummaryTimeRange(range)}
                    className={cn(
                      'py-[4px] px-[8px] text-[10px] font-medium rounded-[4px] border-none cursor-pointer',
                      summaryTimeRange === range
                        ? 'bg-[#3b82f6] text-white'
                        : darkMode
                          ? 'bg-white/[0.06] text-white/60'
                          : 'bg-black/[0.04] text-black/50'
                    )}
                  >
                    {range === 'all' ? 'All' : range.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div
              className={cn('grid grid-cols-2 border-b', darkMode ? 'border-white/[0.04]' : 'border-black/[0.04]')}
            >
              <div
                className={cn('py-[12px] px-[16px] border-r', darkMode ? 'border-white/[0.04]' : 'border-black/[0.04]')}
              >
                <div
                  className={cn('text-[10px] uppercase tracking-[0.04em] mb-[4px]', darkMode ? 'text-white/40' : 'text-black/[0.45]')}
                >
                  Volume
                </div>
                <div
                  className={cn('text-[16px] font-semibold', darkMode ? 'text-white' : 'text-[#212B36]')}
                >
                  <XrpValue value={summaryStats.volume} />
                </div>
              </div>
              <div className="py-[12px] px-[16px]">
                <div
                  className={cn('text-[10px] uppercase tracking-[0.04em] mb-[4px]', darkMode ? 'text-white/40' : 'text-black/[0.45]')}
                >
                  Sales
                </div>
                <div
                  className={cn('text-[16px] font-semibold', darkMode ? 'text-white' : 'text-[#212B36]')}
                >
                  {fNumber(summaryStats.sales)}
                </div>
              </div>
            </div>
            <Table>
              <tbody>
                <tr>
                  <Td
                    darkMode={darkMode}
                    className={darkMode ? 'text-white/50' : 'text-[#637381]'}
                  >
                    Buyers
                  </Td>
                  <Td darkMode={darkMode} align="right" className="font-medium">
                    {fNumber(summaryStats.buyers)}
                  </Td>
                  <Td
                    darkMode={darkMode}
                    className={darkMode ? 'text-white/50' : 'text-[#637381]'}
                  >
                    Sellers
                  </Td>
                  <Td darkMode={darkMode} align="right" className="font-medium">
                    {fNumber(summaryStats.sellers)}
                  </Td>
                </tr>
                <tr>
                  <Td
                    darkMode={darkMode}
                    className={darkMode ? 'text-white/50' : 'text-[#637381]'}
                  >
                    Royalties
                  </Td>
                  <Td darkMode={darkMode} align="right" className="font-medium">
                    <XrpValue value={summaryStats.royalties} size="small" />
                  </Td>
                  <Td
                    darkMode={darkMode}
                    className={darkMode ? 'text-white/50' : 'text-[#637381]'}
                  >
                    Broker Fees
                  </Td>
                  <Td darkMode={darkMode} align="right" className="font-medium">
                    <XrpValue value={summaryStats.brokerFees} size="small" />
                  </Td>
                </tr>
                <tr>
                  <Td
                    darkMode={darkMode}
                    className={darkMode ? 'text-white/50' : 'text-[#637381]'}
                  >
                    Mints
                  </Td>
                  <Td darkMode={darkMode} align="right" className="font-medium">
                    {fNumber(summaryStats.mints)}
                  </Td>
                  <Td
                    darkMode={darkMode}
                    className={darkMode ? 'text-white/50' : 'text-[#637381]'}
                  >
                    Burns
                  </Td>
                  <Td darkMode={darkMode} align="right" className="font-medium">
                    {fNumber(summaryStats.burns)}
                  </Td>
                </tr>
                <tr>
                  <Td
                    darkMode={darkMode}
                    className={darkMode ? 'text-white/50' : 'text-[#637381]'}
                  >
                    Transfers
                  </Td>
                  <Td darkMode={darkMode} align="right" className="font-medium">
                    {fNumber(summaryStats.transfers)}
                  </Td>
                  <Td
                    darkMode={darkMode}
                    className={darkMode ? 'text-white/50' : 'text-[#637381]'}
                  >
                    Collections
                  </Td>
                  <Td darkMode={darkMode} align="right" className="font-medium">
                    {fNumber(summaryStats.collections)}
                  </Td>
                </tr>
              </tbody>
            </Table>
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
    const response = await api.get(`${BASE_URL}/nft/analytics/market`);
    const data = response.data;

    // Map new API structure
    const summary = data.summary || {};
    const percentChanges = data.percentChanges || {};
    const aggregates = data.aggregates || {};

    const stats = {
      // Daily history for charts
      volumeHistory: (data.daily || []).map((d) => ({
        ...d,
        // Flatten volumeByPlatform for chart compatibility
        volumeByPlatformFlat: Object.fromEntries(
          Object.entries(d.volumeByPlatform || {}).map(([k, v]) => [k, v?.volume || v || 0])
        )
      })),

      // 24h stats from summary
      total24hVolume: summary.total24hVolume || aggregates['24h']?.volume || 0,
      total24hSales: summary.total24hSales || aggregates['24h']?.sales || 0,
      activeTraders24h: summary.activeTraders24h || 0,
      total24hMints: summary.mints24h || aggregates['24h']?.mints || 0,
      total24hBurns: summary.burns24h || aggregates['24h']?.burns || 0,
      total24hTransfers: summary.transfers24h || aggregates['24h']?.transfers || 0,
      total24hRoyalties: aggregates['24h']?.royalties || 0,
      total24hBrokerFees: aggregates['24h']?.brokerFees || 0,
      uniqueBuyers24h: aggregates['24h']?.uniqueBuyers || 0,
      uniqueSellers24h: aggregates['24h']?.uniqueSellers || 0,

      // Percent changes
      volumePct: percentChanges.volume24hPct || 0,
      salesPct: percentChanges.sales24hPct || 0,
      activeTradersPct: percentChanges.traders24hPct || 0,
      mintsPct: percentChanges.mints24hPct || 0,
      burnsPct: percentChanges.burns24hPct || 0,
      transfersPct: percentChanges.transfers24hPct || 0,

      // Totals
      totalVolume: summary.totalVolume || aggregates['all']?.volume || 0,
      totalSales: summary.totalSales || aggregates['all']?.sales || 0,
      totalCollections: data.summary?.totalCollections || 0,
      activeCollections24h: data.summary?.activeCollections24h || 0,
      totalTraders: data.uniqueTraderCount || 0,
      activeTraders7d: aggregates['7d']?.uniqueBuyers || 0,
      activeTraders30d: aggregates['30d']?.uniqueBuyers || 0,

      // Platform stats
      platformStatsAll: data.platformStatsAll || {},

      // Trader balances
      traderBalances: data.traderBalances || {},

      // Meta
      lastUpdated: data.lastUpdated
    };

    return { props: { stats } };
  } catch (error) {
    console.error('Failed to fetch NFT market stats:', error.message);
    return { props: { stats: null } };
  }
}
