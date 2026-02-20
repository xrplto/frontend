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
  BarChart3,
  Coins,
  Users,
  DollarSign,
  Layers,
  ArrowLeftRight,
  ChevronDown,
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
            'font-medium tracking-[0.02em]',
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
const Title = ({ darkMode, className, children, ...p }) => <h1 className={cn('text-[22px] font-semibold tracking-[-0.02em] mb-1', darkMode ? 'text-white/95' : 'text-[#1a1a2e]', className)} {...p}>{children}</h1>;
const Subtitle = ({ darkMode, className, children, ...p }) => <p className={cn('text-[13px] tracking-[0.01em] mb-6', darkMode ? 'text-white/60' : 'text-[#637381]', className)} {...p}>{children}</p>;
const Grid = ({ className, children, ...p }) => <div className={cn('grid grid-cols-2 gap-3 mb-6 md:grid-cols-4 lg:grid-cols-6', className)} {...p}>{children}</div>;
const StatCard = ({ darkMode, className, children, ...p }) => <div className={cn('p-4 rounded-xl border', darkMode ? 'border-white/[0.08] bg-white/[0.02]' : 'border-black/[0.06] bg-white', className)} {...p}>{children}</div>;
const StatLabel = ({ darkMode, className, children, ...p }) => <p className={cn('text-[10px] uppercase tracking-[0.06em] font-semibold mb-[6px] flex items-center gap-[6px]', darkMode ? 'text-white/60' : 'text-[#919EAB]', className)} {...p}>{children}</p>;
const StatValue = ({ darkMode, className, children, ...p }) => <p className={cn('text-lg font-bold tracking-[-0.01em] mb-1', darkMode ? 'text-white/95' : 'text-[#1a1a2e]', className)} {...p}>{children}</p>;
const StatChange = ({ positive, className, children, ...p }) => <span className={cn('text-[11px] font-medium flex items-center gap-[2px]', positive ? 'text-[#10b981]' : 'text-[#ef4444]', className)} {...p}>{children}</span>;
const Section = ({ className, children, ...p }) => <div className={cn('mb-6', className)} {...p}>{children}</div>;
const ChartCard = ({ darkMode, className, children, ...p }) => <div className={cn('rounded-xl border', darkMode ? 'border-white/[0.08] bg-white/[0.02]' : 'border-black/[0.06] bg-white', className)} {...p}>{children}</div>;
const ChartHeader = ({ darkMode, className, children, ...p }) => <div className={cn('relative p-4 flex flex-wrap items-center justify-between gap-3 border-b z-10', darkMode ? 'border-white/[0.06]' : 'border-black/[0.06]', className)} {...p}>{children}</div>;
const MetricSelect = ({ className, children, ...p }) => <div className={cn('relative inline-block', className)} {...p}>{children}</div>;
const MetricButton = ({ darkMode, className, children, ...p }) => (
  <button className={cn('flex items-center gap-[6px] py-2 px-[14px] text-[13px] font-medium rounded-lg border cursor-pointer transition-[border-color,background-color] duration-150 hover:border-[#3b82f6]', darkMode ? 'border-white/10 bg-white/[0.03] text-white' : 'border-black/10 bg-white text-[#212B36]', className)} {...p}>{children}</button>
);
const MetricDropdown = ({ darkMode, className, children, ...p }) => (
  <div className={cn('absolute top-[calc(100%+4px)] left-0 min-w-[200px] p-[6px] rounded-[10px] border shadow-[0_8px_24px_rgba(0,0,0,0.15)] z-50', darkMode ? 'border-white/10 bg-[#1a1a1a]' : 'border-black/10 bg-white', className)} {...p}>{children}</div>
);
const MetricGroup = ({ darkMode, className, children, ...p }) => <div className={cn('[&:not(:last-child)]:border-b [&:not(:last-child)]:pb-[6px] [&:not(:last-child)]:mb-[6px]', darkMode ? '[&:not(:last-child)]:border-white/[0.06]' : '[&:not(:last-child)]:border-black/[0.06]', className)} {...p}>{children}</div>;
const MetricGroupLabel = ({ darkMode, className, children, ...p }) => <div className={cn('text-[9px] font-bold uppercase tracking-[0.06em] py-1 px-[10px]', darkMode ? 'text-white/50' : 'text-black/30', className)} {...p}>{children}</div>;
const MetricOption = ({ active, darkMode, className, children, ...p }) => (
  <button className={cn('block w-full py-2 px-[10px] text-xs text-left border-none rounded-md cursor-pointer transition-[background-color] duration-100', active ? 'bg-[rgba(59,130,246,0.15)] text-[#3b82f6] hover:bg-[rgba(59,130,246,0.2)]' : cn(darkMode ? 'text-white' : 'text-[#212B36]', 'bg-transparent hover:bg-[rgba(59,130,246,0.08)]'), className)} {...p}>{children}</button>
);
const ChartTitle = ({ darkMode, className, children, ...p }) => <h3 className={cn('text-sm font-semibold tracking-[-0.01em]', darkMode ? 'text-white/90' : 'text-[#1a1a2e]', className)} {...p}>{children}</h3>;
const ButtonGroup = ({ className, children, ...p }) => <div className={cn('flex gap-1', className)} {...p}>{children}</div>;
const ToggleBtn = ({ active, darkMode, className, children, ...p }) => (
  <button className={cn('py-[6px] px-3 text-[11px] font-medium rounded-md border-none cursor-pointer transition-[background-color] duration-150', active ? 'bg-[#3b82f6] text-white hover:bg-[#2563eb]' : darkMode ? 'bg-white/[0.05] text-white hover:bg-[rgba(59,130,246,0.1)]' : 'bg-black/[0.05] text-black/60 hover:bg-[rgba(59,130,246,0.1)]', className)} {...p}>{children}</button>
);
const ChartArea = ({ className, children, ...p }) => <div className={cn('relative h-[280px] pt-5 px-4 pb-10', className)} {...p}>{children}</div>;
const ChartSvg = ({ className, children, ...p }) => <svg className={cn('w-full h-full overflow-visible', className)} {...p}>{children}</svg>;
const Tooltip = ({ darkMode, className, children, ...p }) => (
  <div className={cn('absolute py-[10px] px-[14px] rounded-lg text-xs pointer-events-none z-20 shadow-[0_4px_12px_rgba(0,0,0,0.15)]', darkMode ? 'bg-black/90 border border-white/10 text-white' : 'bg-white/95 border border-black/10 text-[#212B36]', className)} {...p}>{children}</div>
);
const TableContainer = ({ darkMode, className, children, ...p }) => <div className={cn('rounded-xl border overflow-hidden', darkMode ? 'border-white/[0.08] bg-white/[0.02]' : 'border-black/[0.06] bg-white', className)} {...p}>{children}</div>;
const Table = ({ className, children, ...p }) => <table className={cn('w-full border-collapse', className)} {...p}>{children}</table>;
const Th = ({ darkMode, align, className, children, ...p }) => <th className={cn('text-[10px] font-semibold uppercase tracking-[0.06em] py-3 px-4', darkMode ? 'text-white/60 border-b border-white/[0.06]' : 'text-[#919EAB] border-b border-black/[0.06]', className)} style={{ textAlign: align || 'left' }} {...p}>{children}</th>;
const Td = ({ darkMode, align, className, children, ...p }) => <td className={cn('text-xs tracking-[0.005em] py-3 px-4', darkMode ? 'text-white/88 border-b border-white/[0.04]' : 'text-[#1a1a2e] border-b border-black/[0.04]', className)} style={{ textAlign: align || 'left' }} {...p}>{children}</td>;
const VolumeBar = ({ darkMode, className, children, ...p }) => <div className={cn('h-[6px] rounded-[3px] overflow-hidden mt-1', darkMode ? 'bg-white/10' : 'bg-black/10', className)} {...p}>{children}</div>;
const VolumeFill = ({ className, ...p }) => <div className={cn('h-full bg-[#3b82f6] rounded-[3px]', className)} {...p} />;

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
      { key: 'marketcap', label: 'Marketcap', format: fVolume }
    ]
  },
  {
    label: 'Platforms',
    icon: Layers,
    metrics: [{ key: 'platformVolume', label: 'By Platform', format: fVolume, platform: true }]
  },
  {
    label: 'AMM vs DEX',
    icon: ArrowLeftRight,
    metrics: [
      { key: 'volumeSplit', label: 'Volume Split', format: fVolume, dual: true },
      { key: 'tradesSplit', label: 'Trades Split', format: fNumber, dual: true }
    ]
  },
  {
    label: 'Pool Activity',
    icon: Activity,
    metrics: [
      { key: 'ammDeposits', label: 'Deposits', format: fVolume },
      { key: 'ammWithdraws', label: 'Withdrawals', format: fVolume },
      { key: 'ammNetFlow', label: 'Net Flow', format: fVolume }
    ]
  }
];

const ALL_METRICS = METRIC_GROUPS.flatMap((g) => g.metrics);

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
  const { themeName } = useContext(ThemeContext);
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

  const history = stats?.history || [];

  const chartData = useMemo(() => {
    const range = TIME_RANGES.find((r) => r.key === timeRange);
    return history.slice(-range.days);
  }, [history, timeRange]);

  const isDualChart = metric === 'volumeSplit' || metric === 'tradesSplit';
  const isPlatformChart = metric === 'platformVolume';
  const isPoolMetric = ['ammDeposits', 'ammWithdraws', 'ammNetFlow'].includes(metric);
  const platformNames = stats?.platformNames || [];

  const maxValue = useMemo(() => {
    if (isDualChart) {
      if (metric === 'tradesSplit') {
        return Math.max(
          ...chartData.map((d) => Math.max(d.tradesAMM || 0, d.tradesNonAMM || 0)),
          1
        );
      }
      return Math.max(...chartData.map((d) => Math.max(d.volumeAMM || 0, d.volumeNonAMM || 0)), 1);
    }
    if (isPlatformChart) {
      return Math.max(
        ...chartData.flatMap((d) => platformNames.map((p) => d.platformVolume?.[p]?.volume || 0)),
        1
      );
    }
    if (metric === 'ammNetFlow') {
      const vals = chartData.map((d) => Math.abs(d.ammNetFlow || 0));
      return Math.max(...vals, 1);
    }
    return Math.max(...chartData.map((d) => d[metric] || 0), 1);
  }, [chartData, metric, isDualChart, isPlatformChart, platformNames]);

  const stackedMax = useMemo(() => {
    return Math.max(
      ...chartData.map((d) => {
        let total = 0;
        platformNames.forEach((p) => {
          total += d.platformVolume?.[p]?.volume || 0;
        });
        return total;
      }),
      1
    );
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

  const metricConfig = ALL_METRICS.find((m) => m.key === metric);

  // AMM vs DEX aggregates based on selected time range
  const ammStats = useMemo(() => {
    const rangeDays =
      ammTimeRange === '24h' ? 1 : ammTimeRange === '7d' ? 7 : ammTimeRange === '30d' ? 30 : 9999;
    const data = history.slice(-rangeDays);
    return {
      volumeAMM: data.reduce((s, d) => s + (d.volumeAMM || 0), 0),
      volumeNonAMM: data.reduce((s, d) => s + (d.volumeNonAMM || 0), 0),
      tradesAMM: data.reduce((s, d) => s + (d.tradesAMM || 0), 0),
      tradesNonAMM: data.reduce((s, d) => s + (d.tradesNonAMM || 0), 0),
      ammDeposits: data.reduce((s, d) => s + (d.ammDeposits || 0), 0),
      ammWithdraws: data.reduce((s, d) => s + (d.ammWithdraws || 0), 0),
      ammNetFlow: data.reduce((s, d) => s + (d.ammNetFlow || 0), 0)
    };
  }, [history, ammTimeRange]);

  // Platform stats aggregates based on selected time range
  const platformStats = useMemo(() => {
    if (platformTimeRange === 'all') {
      // Use the all-time stats from API
      return Object.entries(stats?.platformStatsAll || {}).map(([name, d]) => ({
        name,
        volume: d.volume || 0,
        trades: d.trades || 0,
        fees: d.fees || 0
      }));
    }
    const rangeDays = platformTimeRange === '24h' ? 1 : platformTimeRange === '7d' ? 7 : 30;
    const data = history.slice(-rangeDays);
    const aggregated = {};
    data.forEach((day) => {
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
      .filter((p) => p.volume > 0 || p.trades > 0);
  }, [history, platformTimeRange, stats?.platformStatsAll]);

  // Market summary stats based on selected time range
  const summaryStats = useMemo(() => {
    const rangeDays =
      summaryTimeRange === '24h'
        ? 1
        : summaryTimeRange === '7d'
          ? 7
          : summaryTimeRange === '30d'
            ? 30
            : history.length;
    const data = history.slice(-rangeDays);
    const volume = data.reduce((s, d) => s + (d.volume || 0), 0);
    const trades = data.reduce((s, d) => s + (d.trades || 0), 0);
    const fees = data.reduce(
      (s, d) =>
        s +
        (d.platformVolume
          ? Object.values(d.platformVolume).reduce((sum, p) => sum + (p.fees || 0), 0)
          : 0),
      0
    );
    const avgTrade = trades > 0 ? volume / trades : 0;
    const volumeAMM = data.reduce((s, d) => s + (d.volumeAMM || 0), 0);
    const volumeNonAMM = data.reduce((s, d) => s + (d.volumeNonAMM || 0), 0);
    const tradesAMM = data.reduce((s, d) => s + (d.tradesAMM || 0), 0);
    const tradesNonAMM = data.reduce((s, d) => s + (d.tradesNonAMM || 0), 0);
    return {
      volume,
      trades,
      fees,
      avgTrade,
      volumeAMM,
      volumeNonAMM,
      tradesAMM,
      tradesNonAMM,
      days: data.length
    };
  }, [history, summaryTimeRange]);

  if (!stats) {
    return (
      <div className="min-h-screen">
        <div id="back-to-top-anchor" className="h-[24px]" />
        <Header
          notificationPanelOpen={notificationPanelOpen}
          onNotificationPanelToggle={setNotificationPanelOpen}
        />
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

  const ammPoints = isDualChart
    ? chartData.map((d, i) => {
        const x = padding.left + (i / (chartData.length - 1 || 1)) * chartWidth;
        const val = metric === 'tradesSplit' ? d.tradesAMM || 0 : d.volumeAMM || 0;
        const y = padding.top + chartHeight - (val / maxValue) * chartHeight;
        return { x, y, data: d };
      })
    : [];

  const dexPoints = isDualChart
    ? chartData.map((d, i) => {
        const x = padding.left + (i / (chartData.length - 1 || 1)) * chartWidth;
        const val = metric === 'tradesSplit' ? d.tradesNonAMM || 0 : d.volumeNonAMM || 0;
        const y = padding.top + chartHeight - (val / maxValue) * chartHeight;
        return { x, y, data: d };
      })
    : [];

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1]?.x || 0} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`;

  const ammLinePath = ammPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const ammAreaPath = isDualChart
    ? `${ammLinePath} L ${ammPoints[ammPoints.length - 1]?.x || 0} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`
    : '';

  const dexLinePath = dexPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const dexAreaPath = isDualChart
    ? `${dexLinePath} L ${dexPoints[dexPoints.length - 1]?.x || 0} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`
    : '';

  const platformPaths = useMemo(() => {
    if (!isPlatformChart) return {};
    const paths = {};
    platformNames.forEach((platform) => {
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
    <div className="min-h-screen overflow-hidden">
      <div id="back-to-top-anchor" className="h-[24px]" />
      <Header
        notificationPanelOpen={notificationPanelOpen}
        onNotificationPanelToggle={setNotificationPanelOpen}
      />

      <Container>
        <div className="flex justify-between items-start flex-wrap gap-[8px]">
          <div>
            <Title darkMode={darkMode}>Token Market Stats</Title>
            <Subtitle darkMode={darkMode}>XRPL DEX token trading analytics</Subtitle>
          </div>
          {stats.lastUpdated && (
            <div
              className={cn('text-[11px] mt-[4px]', darkMode ? 'text-white/60' : 'text-black/40')}
              suppressHydrationWarning
            >
              Updated {new Date(stats.lastUpdated).toLocaleString()}
            </div>
          )}
        </div>

        <Grid>
          <StatCard darkMode={darkMode}>
            <StatLabel darkMode={darkMode}>
              <Activity size={12} /> 24h Volume
            </StatLabel>
            <StatValue darkMode={darkMode}>
              <XrpValue value={stats.volume24h || 0} size="large" />
            </StatValue>
            <div className="flex items-center justify-between gap-[8px]">
              <StatChange positive={stats.volumePct >= 0}>
                {stats.volumePct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {Math.abs(stats.volumePct || 0).toFixed(1)}%
              </StatChange>
              <span
                className={cn('text-[10px]', darkMode ? 'text-white/60' : 'text-black/40')}
              >
                7d: <XrpValue value={stats.volume7d || 0} size="small" showSymbol={false} />
              </span>
            </div>
          </StatCard>

          <StatCard darkMode={darkMode}>
            <StatLabel darkMode={darkMode}>
              <BarChart3 size={12} /> 24h Trades
            </StatLabel>
            <StatValue darkMode={darkMode}>{fNumber(stats.trades24h || 0)}</StatValue>
            <div className="flex items-center justify-between gap-[8px]">
              <StatChange positive={stats.tradesPct >= 0}>
                {stats.tradesPct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {Math.abs(stats.tradesPct || 0).toFixed(1)}%
              </StatChange>
              <span
                className={cn('text-[10px]', darkMode ? 'text-white/60' : 'text-black/40')}
              >
                Avg: <XrpValue value={stats.avgTradeSize || 0} size="small" />
              </span>
            </div>
          </StatCard>

          <StatCard darkMode={darkMode}>
            <StatLabel darkMode={darkMode}>
              <Coins size={12} /> Total Marketcap
            </StatLabel>
            <StatValue darkMode={darkMode}>
              <XrpValue value={stats.totalMarketcap || 0} size="large" />
            </StatValue>
            <div className="flex items-center justify-between gap-[8px]">
              <StatChange positive={stats.marketcapPct >= 0}>
                {stats.marketcapPct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {Math.abs(stats.marketcapPct || 0).toFixed(1)}%
              </StatChange>
              <span
                className={cn('text-[10px]', darkMode ? 'text-white/60' : 'text-black/40')}
              >
                {fNumber(stats.tokenCount || 0)} tokens
              </span>
            </div>
          </StatCard>

          <StatCard darkMode={darkMode}>
            <StatLabel darkMode={darkMode}>
              <Layers size={12} /> Top Platform
            </StatLabel>
            {(() => {
              const platforms = Object.entries(stats.platformStatsAll || {});
              const sorted = platforms.sort((a, b) => (b[1].volume || 0) - (a[1].volume || 0));
              const top = sorted[0];
              const totalVol = platforms.reduce((s, [, d]) => s + (d.volume || 0), 0);
              if (!top) return <StatValue darkMode={darkMode}>-</StatValue>;
              return (
                <>
                  <StatValue
                    darkMode={darkMode}
                    className="flex items-center gap-[6px]"
                  >
                    <span
                      className="w-[10px] h-[10px] rounded-[2px]"
                      style={{ background: PLATFORM_COLORS[top[0]] || PLATFORM_COLORS.default }}
                    />
                    {top[0]}
                  </StatValue>
                  <div className="flex items-center justify-between gap-[8px]">
                    <span
                      className={cn('text-[11px]', darkMode ? 'text-white/50' : 'text-black/50')}
                    >
                      <XrpValue value={top[1].volume || 0} size="small" />
                    </span>
                    <span className="text-[10px] text-[#3b82f6] font-medium">
                      {totalVol > 0 ? ((top[1].volume / totalVol) * 100).toFixed(1) : 0}% share
                    </span>
                  </div>
                </>
              );
            })()}
          </StatCard>

          <StatCard darkMode={darkMode}>
            <StatLabel darkMode={darkMode}>
              <Users size={12} /> Unique Traders (24h)
            </StatLabel>
            <StatValue darkMode={darkMode}>
              {fNumber((stats.uniqueTradersAMM || 0) + (stats.uniqueTradersNonAMM || 0))}
            </StatValue>
            <div className="flex items-center gap-[8px] text-[10px]">
              <span className="flex items-center gap-[3px] text-[#8b5cf6]">
                <span className="w-[6px] h-[6px] rounded-[1px] bg-[#8b5cf6]" />
                AMM {fNumber(stats.uniqueTradersAMM || 0)}
              </span>
              <span className="flex items-center gap-[3px] text-[#10b981]">
                <span className="w-[6px] h-[6px] rounded-[1px] bg-[#10b981]" />
                DEX {fNumber(stats.uniqueTradersNonAMM || 0)}
              </span>
            </div>
          </StatCard>

          <StatCard darkMode={darkMode}>
            <StatLabel darkMode={darkMode}>
              <ArrowLeftRight size={12} /> AMM vs DEX (24h)
            </StatLabel>
            <StatValue darkMode={darkMode}>
              {stats.volume24h > 0 ? ((stats.volumeAMM / stats.volume24h) * 100).toFixed(1) : 0}%
              AMM
            </StatValue>
            <div className="mt-[4px]">
              <div
                className={cn('h-[6px] rounded-[3px] overflow-hidden flex', darkMode ? 'bg-white/10' : 'bg-black/10')}
              >
                <div
                  className="h-full bg-[#8b5cf6]"
                  style={{ width: `${stats.volume24h > 0 ? (stats.volumeAMM / stats.volume24h) * 100 : 0}%` }}
                />
                <div className="h-full bg-[#10b981] flex-1" />
              </div>
              <div
                className={cn('flex justify-between mt-[4px] text-[10px]', darkMode ? 'text-white/60' : 'text-black/40')}
              >
                <XrpValue value={stats.volumeAMM || 0} size="small" />
                <XrpValue value={stats.volumeNonAMM || 0} size="small" />
              </div>
            </div>
          </StatCard>
        </Grid>

        <Section>
          <ChartCard darkMode={darkMode}>
            <ChartHeader darkMode={darkMode}>
              <div className="flex items-center gap-[16px] flex-wrap">
                <div>
                  <div
                    className={cn('text-[10px] uppercase tracking-[0.06em] font-semibold mb-[2px]', darkMode ? 'text-white/60' : 'text-[#919EAB]')}
                  >
                    {TIME_RANGES.find((r) => r.key === timeRange)?.label} Total
                  </div>
                  <div
                    className={cn('text-[20px] font-bold tracking-[-0.01em]',
                      metric === 'ammNetFlow'
                        ? periodTotal >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
                        : metric === 'ammDeposits'
                          ? 'text-[#10b981]'
                          : metric === 'ammWithdraws'
                            ? 'text-[#ef4444]'
                            : darkMode ? 'text-white' : 'text-[#212B36]'
                    )}
                  >
                    {metric === 'ammNetFlow' && periodTotal >= 0 ? '+' : ''}
                    {[
                      'volume',
                      'marketcap',
                      'platformVolume',
                      'volumeSplit',
                      'ammDeposits',
                      'ammWithdraws',
                      'ammNetFlow'
                    ].includes(metric) ? (
                      <XrpValue value={periodTotal} size="large" />
                    ) : (
                      metricConfig?.format(periodTotal) || fVolume(periodTotal)
                    )}
                  </div>
                </div>
                <MetricSelect ref={dropdownRef}>
                  <MetricButton
                    darkMode={darkMode}
                    onClick={() => setMetricDropdownOpen(!metricDropdownOpen)}
                  >
                    {metricConfig?.label || 'Volume'}
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
                {isPlatformChart ? (
                  platformNames
                    .slice()
                    .reverse()
                    .map((platform, pIdx) => {
                      const stackedPoints = chartData.map((d, i) => {
                        const x = padding.left + (i / (chartData.length - 1 || 1)) * chartWidth;
                        let cumulative = 0;
                        platformNames.slice(0, platformNames.length - pIdx).forEach((p) => {
                          cumulative += d.platformVolume?.[p]?.volume || 0;
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
                ) : isDualChart ? (
                  <>
                    <path d={ammAreaPath} fill="url(#ammAreaGradient)" />
                    <path d={dexAreaPath} fill="url(#dexAreaGradient)" />
                    <path
                      d={ammLinePath}
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="0.6"
                      vectorEffect="non-scaling-stroke"
                    />
                    <path
                      d={dexLinePath}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="0.6"
                      vectorEffect="non-scaling-stroke"
                    />
                  </>
                ) : (
                  <>
                    <path
                      d={areaPath}
                      fill={`url(#${metric === 'ammDeposits' ? 'depositsGradient' : metric === 'ammWithdraws' ? 'withdrawsGradient' : 'tokenAreaGradient'})`}
                    />
                    <path
                      d={linePath}
                      fill="none"
                      stroke={
                        metric === 'ammDeposits'
                          ? '#10b981'
                          : metric === 'ammWithdraws'
                            ? '#ef4444'
                            : '#3b82f6'
                      }
                      strokeWidth="0.6"
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
                    {isPlatformChart ? (
                      <>
                        <div className="flex justify-between gap-[20px] mb-[6px]">
                          <span className="opacity-60">Total</span>
                          <span className="font-semibold">
                            <XrpValue value={hoverData.volume || 0} size="small" />
                          </span>
                        </div>
                        {platformNames.map((platform) => {
                          const vol = hoverData.platformVolume?.[platform]?.volume || 0;
                          if (vol === 0) return null;
                          const color = PLATFORM_COLORS[platform] || PLATFORM_COLORS.default;
                          return (
                            <div
                              key={platform}
                              className="flex justify-between gap-[16px] text-[11px]"
                            >
                              <span className="flex items-center gap-[6px]">
                                <span
                                  className="w-[8px] h-[8px] rounded-[2px]"
                                  style={{ background: color }}
                                />
                                {platform}
                              </span>
                              <span>
                                <XrpValue value={vol} size="small" showSymbol={false} />
                              </span>
                            </div>
                          );
                        })}
                      </>
                    ) : isDualChart ? (
                      <>
                        <div className="flex justify-between gap-[16px] items-center">
                          <span className="flex items-center gap-[6px]">
                            <span className="w-[8px] h-[8px] rounded-[2px] bg-[#8b5cf6]" />
                            <span className="opacity-60">AMM:</span>
                          </span>
                          <span className="font-medium">
                            {metric === 'tradesSplit' ? (
                              fNumber(hoverData.tradesAMM || 0)
                            ) : (
                              <XrpValue value={hoverData.volumeAMM || 0} size="small" />
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between gap-[16px] items-center">
                          <span className="flex items-center gap-[6px]">
                            <span className="w-[8px] h-[8px] rounded-[2px] bg-[#10b981]" />
                            <span className="opacity-60">DEX:</span>
                          </span>
                          <span className="font-medium">
                            {metric === 'tradesSplit' ? (
                              fNumber(hoverData.tradesNonAMM || 0)
                            ) : (
                              <XrpValue value={hoverData.volumeNonAMM || 0} size="small" />
                            )}
                          </span>
                        </div>
                        <div
                          className={cn('flex justify-between gap-[16px] mt-[4px] pt-[4px] border-t', darkMode ? 'border-white/10' : 'border-black/10')}
                        >
                          <span className="opacity-60">Total:</span>
                          <span className="font-medium">
                            {metric === 'tradesSplit' ? (
                              fNumber((hoverData.tradesAMM || 0) + (hoverData.tradesNonAMM || 0))
                            ) : (
                              <XrpValue
                                value={(hoverData.volumeAMM || 0) + (hoverData.volumeNonAMM || 0)}
                                size="small"
                              />
                            )}
                          </span>
                        </div>
                      </>
                    ) : isPoolMetric ? (
                      <>
                        <div className="flex justify-between gap-[20px] mb-[4px]">
                          <span className="opacity-60">{metricConfig?.label}</span>
                          <span
                            className={cn('font-semibold', metric === 'ammNetFlow' ? (hoverData.ammNetFlow || 0) >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]' : 'text-[#3b82f6]')}
                          >
                            {metric === 'ammNetFlow' && (hoverData.ammNetFlow || 0) >= 0 ? '+' : ''}
                            <XrpValue value={hoverData[metric] || 0} size="small" />
                          </span>
                        </div>
                        <div className="flex justify-between gap-[20px]">
                          <span className="opacity-60">Deposits</span>
                          <span className="text-[#10b981]">
                            <XrpValue value={hoverData.ammDeposits || 0} size="small" />
                          </span>
                        </div>
                        <div className="flex justify-between gap-[20px]">
                          <span className="opacity-60">Withdrawals</span>
                          <span className="text-[#ef4444]">
                            <XrpValue value={hoverData.ammWithdraws || 0} size="small" />
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between gap-[20px] mb-[4px]">
                          <span className="opacity-60">{metricConfig?.label}</span>
                          <span className="font-semibold text-[#3b82f6]">
                            {metric === 'volume' || metric === 'marketcap' ? (
                              <XrpValue value={hoverData[metric] || 0} size="small" />
                            ) : (
                              metricConfig?.format(hoverData[metric] || 0)
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
                        {metric !== 'trades' && (
                          <div className="flex justify-between gap-[20px]">
                            <span className="opacity-60">Trades</span>
                            <span>{fNumber(hoverData.trades || 0)}</span>
                          </div>
                        )}
                      </>
                    )}
                  </Tooltip>
                </>
              )}
              <div
                className={cn('absolute bottom-[8px] left-[16px] right-[16px] flex justify-between text-[10px]', darkMode ? 'text-white/50' : 'text-black/30')}
              >
                <span>{chartData[0]?.date}</span>
                <span>{chartData[chartData.length - 1]?.date}</span>
              </div>
            </ChartArea>
            {isPlatformChart && (
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
            {isDualChart && (
              <div
                className={cn('py-[12px] px-[16px] flex flex-wrap gap-[8px_16px] border-t', darkMode ? 'border-white/[0.06]' : 'border-black/[0.06]')}
              >
                <div
                  className={cn('flex items-center gap-[6px] text-[11px]', darkMode ? 'text-white/70' : 'text-black/70')}
                >
                  <span className="w-[10px] h-[10px] rounded-[2px] bg-[#8b5cf6]" />
                  AMM
                </div>
                <div
                  className={cn('flex items-center gap-[6px] text-[11px]', darkMode ? 'text-white/70' : 'text-black/70')}
                >
                  <span className="w-[10px] h-[10px] rounded-[2px] bg-[#10b981]" />
                  DEX
                </div>
              </div>
            )}
            {isPoolMetric && (
              <div
                className={cn('py-[12px] px-[16px] flex flex-wrap gap-[8px_16px] border-t', darkMode ? 'border-white/[0.06]' : 'border-black/[0.06]')}
              >
                <div
                  className={cn('flex items-center gap-[6px] text-[11px]', darkMode ? 'text-white/70' : 'text-black/70')}
                >
                  <span
                    className={cn('w-[10px] h-[10px] rounded-[2px]', metric === 'ammDeposits' ? 'bg-[#10b981]' : metric === 'ammWithdraws' ? 'bg-[#ef4444]' : 'bg-[#3b82f6]')}
                  />
                  {metricConfig?.label}
                </div>
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
              <span className={cn('text-[12px] font-semibold tracking-[-0.01em]', darkMode ? 'text-white/90' : 'text-[#1a1a2e]')}>
                Trading Platform Stats
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
                    { key: 'trades', label: 'Trades' },
                    { key: 'fees', label: 'Fees' }
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
              <Table style={{ minWidth: 500 }}>
                <thead>
                  <tr>
                    <Th darkMode={darkMode}>Platform</Th>
                    <Th darkMode={darkMode} align="right">
                      Volume
                    </Th>
                    <Th darkMode={darkMode} align="right">
                      Trades
                    </Th>
                    <Th darkMode={darkMode} align="right">
                      Fees
                    </Th>
                    <Th darkMode={darkMode} align="right">
                      Share
                    </Th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const sortedPlatforms = [...platformStats].sort(
                      (a, b) => b[platformSort] - a[platformSort]
                    );
                    const totalVol = sortedPlatforms.reduce((s, p) => s + p.volume, 0);
                    const maxVal = sortedPlatforms[0]?.[platformSort] || 1;
                    const displayPlatforms = platformExpanded
                      ? sortedPlatforms
                      : sortedPlatforms.slice(0, 10);
                    if (sortedPlatforms.length === 0) {
                      return (
                        <tr>
                          <Td
                            darkMode={darkMode}
                            colSpan={5}
                            className={cn('text-center p-[24px]', darkMode ? 'text-white/60' : 'text-black/40')}
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
                              style={{ background: PLATFORM_COLORS[p.name] || PLATFORM_COLORS.default }}
                            />
                            <span className="font-medium">{p.name}</span>
                          </div>
                          <div
                            className={cn('h-[4px] rounded-[2px] mt-[6px]', darkMode ? 'bg-white/10' : 'bg-black/10')}
                          >
                            <div
                              className="h-full rounded-[2px] transition-[width] duration-300 ease-in-out"
                              style={{
                                background: PLATFORM_COLORS[p.name] || PLATFORM_COLORS.default,
                                width: `${(p[platformSort] / maxVal) * 100}%`
                              }}
                            />
                          </div>
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
                          className={platformSort === 'trades' ? 'font-semibold' : 'font-normal'}
                        >
                          {fNumber(p.trades)}
                        </Td>
                        <Td
                          darkMode={darkMode}
                          align="right"
                          className={platformSort === 'fees' ? 'font-semibold' : 'font-normal'}
                        >
                          <XrpValue value={p.fees} size="small" />
                        </Td>
                        <Td
                          darkMode={darkMode}
                          align="right"
                          className={darkMode ? 'text-white/50' : 'text-[#637381]'}
                        >
                          {totalVol > 0 ? ((p.volume / totalVol) * 100).toFixed(1) : 0}%
                        </Td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </Table>
            </div>
            {/* Show more button */}
            {platformStats.length > 10 && (
              <div
                className={cn('py-[12px] px-[16px] text-center border-t', darkMode ? 'border-white/[0.06]' : 'border-black/[0.06]')}
              >
                <button
                  onClick={() => setPlatformExpanded(!platformExpanded)}
                  className="bg-transparent border-none text-[#3b82f6] text-[12px] font-medium cursor-pointer py-[6px] px-[12px] rounded-[6px] transition-colors duration-150 hover:bg-[rgba(59,130,246,0.1)]"
                >
                  {platformExpanded ? 'Show less' : `Show ${platformStats.length - 10} more`}
                </button>
              </div>
            )}
            {/* Period summary */}
            <div
              className={cn('py-[12px] px-[16px] flex justify-between flex-wrap gap-[16px] text-[12px] border-t', darkMode ? 'border-white/[0.06]' : 'border-black/[0.06]')}
            >
              <div className="flex gap-[24px] flex-wrap">
                <div>
                  <span className={darkMode ? 'text-white/50' : 'text-black/35'}>
                    Total Volume:{' '}
                  </span>
                  <span className={cn('font-bold', darkMode ? 'text-white/95' : 'text-[#1a1a2e]')}>
                    <XrpValue value={platformStats.reduce((s, p) => s + p.volume, 0)} />
                  </span>
                </div>
                <div>
                  <span className={darkMode ? 'text-white/50' : 'text-black/35'}>
                    Total Trades:{' '}
                  </span>
                  <span className={cn('font-bold', darkMode ? 'text-white/95' : 'text-[#1a1a2e]')}>
                    {fNumber(platformStats.reduce((s, p) => s + p.trades, 0))}
                  </span>
                </div>
                <div>
                  <span className={darkMode ? 'text-white/50' : 'text-black/35'}>
                    Total Fees:{' '}
                  </span>
                  <span className={cn('font-bold', darkMode ? 'text-white/95' : 'text-[#1a1a2e]')}>
                    <XrpValue value={platformStats.reduce((s, p) => s + p.fees, 0)} />
                  </span>
                </div>
                <div>
                  <span className={darkMode ? 'text-white/50' : 'text-black/35'}>
                    Platforms:{' '}
                  </span>
                  <span className={cn('font-bold', darkMode ? 'text-white/95' : 'text-[#1a1a2e]')}>
                    {platformStats.length}
                  </span>
                </div>
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
                  className={cn('text-[12px] font-semibold tracking-[-0.01em]', darkMode ? 'text-white/90' : 'text-[#1a1a2e]')}
                >
                  Trader Balances
                </span>
              </div>
              <div className="grid grid-cols-4">
                <div
                  className={cn('py-[14px] px-[16px] border-r', darkMode ? 'border-white/[0.04]' : 'border-black/[0.04]')}
                >
                  <div
                    className={cn('text-[10px] uppercase tracking-[0.06em] font-semibold mb-[4px]', darkMode ? 'text-white/60' : 'text-[#919EAB]')}
                  >
                    24h Active
                  </div>
                  <div
                    className={cn('text-[16px] font-bold tracking-[-0.01em]', darkMode ? 'text-white/95' : 'text-[#1a1a2e]')}
                  >
                    <XrpValue value={stats.traderBalances.balance24h || 0} />
                  </div>
                  <div
                    className={cn('text-[10px] tracking-[0.01em] mt-[2px]', darkMode ? 'text-white/50' : 'text-black/30')}
                  >
                    {fNumber(stats.traderBalances.traders24h || 0)} traders
                  </div>
                </div>
                <div
                  className={cn('py-[14px] px-[16px] border-r', darkMode ? 'border-white/[0.04]' : 'border-black/[0.04]')}
                >
                  <div
                    className={cn('text-[10px] uppercase tracking-[0.06em] font-semibold mb-[4px]', darkMode ? 'text-white/60' : 'text-[#919EAB]')}
                  >
                    7d Active
                  </div>
                  <div
                    className={cn('text-[16px] font-bold tracking-[-0.01em]', darkMode ? 'text-white/95' : 'text-[#1a1a2e]')}
                  >
                    <XrpValue value={stats.traderBalances.balance7d || 0} />
                  </div>
                  <div
                    className={cn('text-[10px] tracking-[0.01em] mt-[2px]', darkMode ? 'text-white/50' : 'text-black/30')}
                  >
                    {fNumber(stats.traderBalances.traders7d || 0)} traders
                  </div>
                </div>
                <div
                  className={cn('py-[14px] px-[16px] border-r', darkMode ? 'border-white/[0.04]' : 'border-black/[0.04]')}
                >
                  <div
                    className={cn('text-[10px] uppercase tracking-[0.06em] font-semibold mb-[4px]', darkMode ? 'text-white/60' : 'text-[#919EAB]')}
                  >
                    30d Active
                  </div>
                  <div
                    className={cn('text-[16px] font-bold tracking-[-0.01em]', darkMode ? 'text-white/95' : 'text-[#1a1a2e]')}
                  >
                    <XrpValue value={stats.traderBalances.balance30d || 0} />
                  </div>
                  <div
                    className={cn('text-[10px] tracking-[0.01em] mt-[2px]', darkMode ? 'text-white/50' : 'text-black/30')}
                  >
                    {fNumber(stats.traderBalances.traders30d || 0)} traders
                  </div>
                </div>
                <div className="py-[14px] px-[16px]">
                  <div
                    className={cn('text-[10px] uppercase tracking-[0.06em] font-semibold mb-[4px]', darkMode ? 'text-white/60' : 'text-[#919EAB]')}
                  >
                    All Time
                  </div>
                  <div
                    className={cn('text-[16px] font-bold tracking-[-0.01em]', darkMode ? 'text-white/95' : 'text-[#1a1a2e]')}
                  >
                    <XrpValue value={stats.traderBalances.balanceAll || 0} />
                  </div>
                  <div
                    className={cn('text-[10px] tracking-[0.01em] mt-[2px]', darkMode ? 'text-white/50' : 'text-black/30')}
                  >
                    {fNumber(stats.traderBalances.tradersAll || 0)} traders
                  </div>
                </div>
              </div>
            </TableContainer>
          </Section>
        )}

        {/* Market Summary - Full Width */}
        <Section>
          <TableContainer darkMode={darkMode}>
            <div
              className={cn('py-[12px] px-[16px] flex justify-between items-center flex-wrap gap-[8px] border-b', darkMode ? 'border-white/[0.06]' : 'border-black/[0.06]')}
            >
              <span className={cn('text-[12px] font-semibold tracking-[-0.01em]', darkMode ? 'text-white/90' : 'text-[#1a1a2e]')}>
                Market Summary
              </span>
              <ButtonGroup>
                {[
                  { key: '24h', label: '24H' },
                  { key: '7d', label: '7D' },
                  { key: '30d', label: '30D' },
                  { key: 'all', label: 'All Time' }
                ].map((r) => (
                  <ToggleBtn
                    key={r.key}
                    active={summaryTimeRange === r.key}
                    darkMode={darkMode}
                    onClick={() => setSummaryTimeRange(r.key)}
                  >
                    {r.label}
                  </ToggleBtn>
                ))}
              </ButtonGroup>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
              <div
                className={cn('py-[14px] px-[16px] border-r border-b', darkMode ? 'border-white/[0.04]' : 'border-black/[0.04]')}
              >
                <div className={cn('text-[10px] uppercase tracking-[0.06em] font-semibold mb-[4px]', darkMode ? 'text-white/60' : 'text-[#919EAB]')}>
                  Volume
                </div>
                <div className={cn('text-[18px] font-bold tracking-[-0.01em]', darkMode ? 'text-white/95' : 'text-[#1a1a2e]')}>
                  <XrpValue value={summaryStats.volume} />
                </div>
              </div>
              <div
                className={cn('py-[14px] px-[16px] border-r border-b', darkMode ? 'border-white/[0.04]' : 'border-black/[0.04]')}
              >
                <div className={cn('text-[10px] uppercase tracking-[0.06em] font-semibold mb-[4px]', darkMode ? 'text-white/60' : 'text-[#919EAB]')}>
                  Trades
                </div>
                <div className={cn('text-[18px] font-bold tracking-[-0.01em]', darkMode ? 'text-white/95' : 'text-[#1a1a2e]')}>
                  {fNumber(summaryStats.trades)}
                </div>
              </div>
              <div
                className={cn('py-[14px] px-[16px] border-r border-b', darkMode ? 'border-white/[0.04]' : 'border-black/[0.04]')}
              >
                <div className={cn('text-[10px] uppercase tracking-[0.06em] font-semibold mb-[4px]', darkMode ? 'text-white/60' : 'text-[#919EAB]')}>
                  Avg Trade Size
                </div>
                <div className={cn('text-[18px] font-bold tracking-[-0.01em]', darkMode ? 'text-white/95' : 'text-[#1a1a2e]')}>
                  <XrpValue value={summaryStats.avgTrade} format={(v) => (v || 0).toFixed(0)} />
                </div>
                <div className={cn('text-[10px] tracking-[0.01em] mt-[2px]', darkMode ? 'text-white/50' : 'text-black/30')}>
                  Volume / Trades
                </div>
              </div>
              <div
                className={cn('py-[14px] px-[16px] border-r border-b', darkMode ? 'border-white/[0.04]' : 'border-black/[0.04]')}
              >
                <div className={cn('text-[10px] uppercase tracking-[0.06em] font-semibold mb-[4px]', darkMode ? 'text-white/60' : 'text-[#919EAB]')}>
                  Fees Collected
                </div>
                <div className={cn('text-[18px] font-bold tracking-[-0.01em]', darkMode ? 'text-white/95' : 'text-[#1a1a2e]')}>
                  <XrpValue value={summaryStats.fees} />
                </div>
              </div>
              <div
                className={cn('py-[14px] px-[16px] border-r border-b', darkMode ? 'border-white/[0.04]' : 'border-black/[0.04]')}
              >
                <div className={cn('text-[10px] uppercase tracking-[0.06em] font-semibold mb-[4px]', darkMode ? 'text-white/60' : 'text-[#919EAB]')}>
                  AMM Volume
                </div>
                <div className="text-[18px] font-bold tracking-[-0.01em] text-[#8b5cf6]">
                  <XrpValue value={summaryStats.volumeAMM} />
                </div>
                <div className={cn('text-[10px] tracking-[0.01em] mt-[2px]', darkMode ? 'text-white/50' : 'text-black/30')}>
                  {summaryStats.volume > 0
                    ? ((summaryStats.volumeAMM / summaryStats.volume) * 100).toFixed(1)
                    : 0}
                  % of total
                </div>
              </div>
              <div
                className={cn('py-[14px] px-[16px] border-b', darkMode ? 'border-white/[0.04]' : 'border-black/[0.04]')}
              >
                <div className={cn('text-[10px] uppercase tracking-[0.06em] font-semibold mb-[4px]', darkMode ? 'text-white/60' : 'text-[#919EAB]')}>
                  DEX Volume
                </div>
                <div className="text-[18px] font-bold tracking-[-0.01em] text-[#10b981]">
                  <XrpValue value={summaryStats.volumeNonAMM} />
                </div>
                <div className={cn('text-[10px] tracking-[0.01em] mt-[2px]', darkMode ? 'text-white/50' : 'text-black/30')}>
                  {summaryStats.volume > 0
                    ? ((summaryStats.volumeNonAMM / summaryStats.volume) * 100).toFixed(1)
                    : 0}
                  % of total
                </div>
              </div>
            </div>
            {/* Period indicator */}
            <div
              className={cn('py-[10px] px-[16px] text-[11px] border-t', darkMode ? 'border-white/[0.04] text-white/60' : 'border-black/[0.04] text-black/40')}
            >
              {summaryTimeRange === 'all'
                ? `Based on ${summaryStats.days} days of data`
                : `Based on last ${summaryTimeRange === '24h' ? '24 hours' : summaryTimeRange === '7d' ? '7 days' : '30 days'}`}
            </div>
          </TableContainer>
        </Section>

        {/* AMM vs DEX - Token Specific */}
        <Section>
          <TableContainer darkMode={darkMode}>
            <div
              className={cn('py-[12px] px-[16px] flex justify-between items-center flex-wrap gap-[8px] border-b', darkMode ? 'border-white/[0.06]' : 'border-black/[0.06]')}
            >
              <span className={cn('text-[12px] font-semibold tracking-[-0.01em]', darkMode ? 'text-white/90' : 'text-[#1a1a2e]')}>
                AMM vs DEX
              </span>
              <ButtonGroup>
                {[
                  { key: '24h', label: '24H' },
                  { key: '7d', label: '7D' },
                  { key: '30d', label: '30D' },
                  { key: 'all', label: 'All' }
                ].map((r) => (
                  <ToggleBtn
                    key={r.key}
                    active={ammTimeRange === r.key}
                    darkMode={darkMode}
                    onClick={() => setAmmTimeRange(r.key)}
                  >
                    {r.label}
                  </ToggleBtn>
                ))}
              </ButtonGroup>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              <div
                className={cn('border-r', darkMode ? 'border-white/[0.04]' : 'border-black/[0.04]')}
              >
                <Table>
                  <thead>
                    <tr>
                      <Th darkMode={darkMode}>Metric</Th>
                      <Th darkMode={darkMode} align="right">
                        AMM
                      </Th>
                      <Th darkMode={darkMode} align="right">
                        DEX
                      </Th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <Td
                        darkMode={darkMode}
                        className={darkMode ? 'text-white/50' : 'text-[#637381]'}
                      >
                        Volume
                      </Td>
                      <Td darkMode={darkMode} align="right" className="font-medium">
                        <XrpValue value={ammStats.volumeAMM} size="small" />
                      </Td>
                      <Td darkMode={darkMode} align="right" className="font-medium">
                        <XrpValue value={ammStats.volumeNonAMM} size="small" />
                      </Td>
                    </tr>
                    <tr>
                      <Td
                        darkMode={darkMode}
                        className={darkMode ? 'text-white/50' : 'text-[#637381]'}
                      >
                        Trades
                      </Td>
                      <Td darkMode={darkMode} align="right">
                        {fNumber(ammStats.tradesAMM)}
                      </Td>
                      <Td darkMode={darkMode} align="right">
                        {fNumber(ammStats.tradesNonAMM)}
                      </Td>
                    </tr>
                    {ammTimeRange === '24h' && (
                      <tr>
                        <Td
                          darkMode={darkMode}
                          className={darkMode ? 'text-white/50' : 'text-[#637381]'}
                        >
                          Traders
                        </Td>
                        <Td darkMode={darkMode} align="right">
                          {fNumber(stats.uniqueTradersAMM || 0)}
                        </Td>
                        <Td darkMode={darkMode} align="right">
                          {fNumber(stats.uniqueTradersNonAMM || 0)}
                        </Td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
              <div className="p-[16px]">
                <div
                  className={cn('text-[10px] uppercase tracking-[0.06em] font-semibold mb-[16px]', darkMode ? 'text-white/60' : 'text-[#919EAB]')}
                >
                  Pool Activity
                </div>
                <div className="grid grid-cols-3 gap-[16px]">
                  <div>
                    <div
                      className={cn('text-[11px] font-medium tracking-[0.01em] mb-[4px]', darkMode ? 'text-white/60' : 'text-[#919EAB]')}
                    >
                      Deposits
                    </div>
                    <div className="text-[16px] font-bold tracking-[-0.01em] text-[#10b981]">
                      <XrpValue value={ammStats.ammDeposits} />
                    </div>
                  </div>
                  <div>
                    <div
                      className={cn('text-[11px] font-medium tracking-[0.01em] mb-[4px]', darkMode ? 'text-white/60' : 'text-[#919EAB]')}
                    >
                      Withdrawals
                    </div>
                    <div className="text-[16px] font-bold tracking-[-0.01em] text-[#ef4444]">
                      <XrpValue value={ammStats.ammWithdraws} />
                    </div>
                  </div>
                  <div>
                    <div
                      className={cn('text-[11px] font-medium tracking-[0.01em] mb-[4px]', darkMode ? 'text-white/60' : 'text-[#919EAB]')}
                    >
                      Net Flow
                    </div>
                    <div
                      className={cn('text-[16px] font-bold tracking-[-0.01em]', ammStats.ammNetFlow >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]')}
                    >
                      {ammStats.ammNetFlow >= 0 ? '+' : ''}
                      <XrpValue value={ammStats.ammNetFlow} showSymbol={true} />
                    </div>
                  </div>
                </div>
                {/* Visual comparison bar */}
                <div className="mt-[16px]">
                  <div
                    className={cn('flex justify-between text-[10px] mb-[4px]', darkMode ? 'text-white/60' : 'text-black/40')}
                  >
                    <span>AMM vs DEX Volume Share</span>
                    <span>
                      {ammStats.volumeAMM + ammStats.volumeNonAMM > 0
                        ? (
                            (ammStats.volumeAMM / (ammStats.volumeAMM + ammStats.volumeNonAMM)) *
                            100
                          ).toFixed(1)
                        : 0}
                      % AMM
                    </span>
                  </div>
                  <div
                    className={cn('h-[8px] rounded-[4px] overflow-hidden flex', darkMode ? 'bg-white/10' : 'bg-black/10')}
                  >
                    <div
                      className="h-full bg-[#8b5cf6] transition-[width] duration-300 ease-in-out"
                      style={{ width: `${ammStats.volumeAMM + ammStats.volumeNonAMM > 0 ? (ammStats.volumeAMM / (ammStats.volumeAMM + ammStats.volumeNonAMM)) * 100 : 0}%` }}
                    />
                    <div className="h-full bg-[#10b981] flex-1" />
                  </div>
                  <div className="flex justify-between mt-[6px] text-[10px]">
                    <span
                      className={cn('flex items-center gap-[4px]', darkMode ? 'text-white/50' : 'text-black/50')}
                    >
                      <span className="w-[8px] h-[8px] rounded-[2px] bg-[#8b5cf6]" />{' '}
                      AMM
                    </span>
                    <span
                      className={cn('flex items-center gap-[4px]', darkMode ? 'text-white/50' : 'text-black/50')}
                    >
                      <span className="w-[8px] h-[8px] rounded-[2px] bg-[#10b981]" />{' '}
                      DEX
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

export async function getServerSideProps({ res }) {
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  try {
    // Fetch all available data
    const startDate = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const response = await api.get(`${BASE_URL}/token/analytics/market?startDate=${startDate}`);
    const data = response.data;

    // Extract from new API structure
    const days = data.daily || [];
    const aggregates = data.aggregates || {};
    const percentChanges = data.percentChanges || {};
    const platformStatsAll = data.platformStatsAll || {};

    // Sort and format history for charts
    const sortedDays = [...days].sort((a, b) => new Date(a.date) - new Date(b.date));
    const history = sortedDays.map((day) => {
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
    const dailyPlatformNames = [
      ...new Set(days.flatMap((d) => Object.keys(d.volumeByPlatform || {})))
    ].filter(Boolean);
    const platformNames =
      dailyPlatformNames.length > 0 ? dailyPlatformNames : Object.keys(platformStatsAll);

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

      // Trader balances
      traderBalances: data.traderBalances || {},

      // Meta
      lastUpdated: data.lastUpdated || null
    };

    return { props: { stats, ogp: {
      canonical: 'https://xrpl.to/token-market',
      title: 'Token Market | XRPL Token Market Analytics',
      url: 'https://xrpl.to/token-market',
      imgUrl: 'https://xrpl.to/api/og/token-market',
      imgType: 'image/png',
      desc: 'XRPL token market analytics with volume, trades, and market cap data.'
    } } };
  } catch (error) {
    console.error('Failed to fetch token market stats:', error.message);
    return { props: { stats: null, ogp: {
      canonical: 'https://xrpl.to/token-market',
      title: 'Token Market | XRPL Token Market Analytics',
      url: 'https://xrpl.to/token-market',
      imgUrl: 'https://xrpl.to/api/og/token-market',
      imgType: 'image/png',
      desc: 'XRPL token market analytics with volume, trades, and market cap data.'
    } } };
  }
}
