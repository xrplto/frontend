import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
import { useRouter } from 'next/router';
import api from 'src/utils/api';
import { ThemeContext, AppContext } from 'src/context/AppContext';
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';
import { cn } from 'src/utils/cn';
// Constants
const currencySymbols = {
  USD: '$ ',
  EUR: '€ ',
  JPY: '¥ ',
  CNH: '¥ ',
  XRP: '✕ '
};
import { fNumber, fCurrency5 } from 'src/utils/formatters';
import Decimal from 'decimal.js-light';

const Controls = ({ darkMode, className, children, ...p }) => <div className={cn('flex flex-col gap-[14px] mb-4 py-4 px-5 rounded-xl border w-full transition-[border-color] duration-200', darkMode ? 'bg-white/[0.02] border-white/[0.08] hover:border-white/[0.15]' : 'bg-black/[0.02] border-black/[0.08] hover:border-black/[0.15]', className)} {...p}>{children}</div>;

const ControlRow = ({ darkMode, className, children, ...p }) => <div className={cn('flex gap-3 items-center flex-wrap w-full max-md:flex-col max-md:items-stretch max-md:gap-3', className)} {...p}>{children}</div>;

const MobileSection = ({ className, children, ...p }) => <div className={cn('max-md:w-full max-md:flex max-md:flex-col max-md:gap-2', className)} {...p}>{children}</div>;

const MobileButtonGrid = ({ className, children, ...p }) => <div className={cn('contents max-md:!grid max-md:grid-cols-[repeat(auto-fit,minmax(80px,1fr))] max-md:gap-2 max-md:w-full', className)} {...p}>{children}</div>;

const MobileFilterGrid = ({ className, children, ...p }) => <div className={cn('contents max-md:!grid max-md:grid-cols-[repeat(auto-fit,minmax(120px,1fr))] max-md:gap-2 max-md:w-full', className)} {...p}>{children}</div>;

const ActiveFilters = ({ className, children, ...p }) => <div className={cn('flex gap-2 flex-wrap items-center min-h-[24px] max-md:w-full', className)} {...p}>{children}</div>;

const FilterChip = ({ darkMode, className, children, ...p }) => (
  <div
    className={cn(
      'inline-flex items-center gap-1 py-1 px-[10px] text-[#3b82f6] rounded-md text-[11px] font-normal cursor-pointer transition-all duration-150 after:content-["\\00d7"] after:text-xs after:font-medium after:opacity-60 after:ml-[2px] max-md:py-[5px]',
      darkMode ? 'bg-[rgba(59,130,246,0.1)] hover:bg-[rgba(59,130,246,0.18)]' : 'bg-[rgba(59,130,246,0.08)] hover:bg-[rgba(59,130,246,0.15)]',
      className
    )}
    {...p}
  >
    {children}
  </div>
);

const SearchInput = ({ darkMode, className, ...p }) => (
  <input
    className={cn(
      'py-[10px] px-4 border-[1.5px] rounded-xl text-sm min-w-[200px] flex-1 max-w-[300px] focus:outline-none focus:border-[rgba(59,130,246,0.5)]',
      darkMode ? 'border-white/[0.15] bg-[rgba(17,24,39,0.8)] text-white placeholder:text-white/50' : 'border-[rgba(145,158,171,0.2)] bg-[rgba(255,255,255,0.95)] text-[#333] placeholder:text-black/50',
      className
    )}
    {...p}
  />
);

const Button = ({ selected, darkMode, className, children, ...p }) => (
  <button
    className={cn(
      'py-2 px-[14px] border-[1.5px] rounded-lg cursor-pointer text-[13px] font-normal transition-[border-color,background-color] duration-150',
      selected
        ? 'border-[rgba(59,130,246,0.25)] bg-[rgba(59,130,246,0.08)] text-[#3b82f6] hover:border-[rgba(59,130,246,0.35)] hover:bg-[rgba(59,130,246,0.12)]'
        : darkMode
          ? 'border-white/10 bg-transparent text-white/80 hover:border-white/20 hover:bg-white/[0.05]'
          : 'border-black/10 bg-transparent text-black/70 hover:border-black/20 hover:bg-black/[0.03]',
      className
    )}
    {...p}
  >
    {children}
  </button>
);

const Select = ({ selected, darkMode, className, children, ...p }) => (
  <select
    className={cn(
      'py-2 pl-[14px] pr-[30px] border-[1.5px] rounded-lg text-[13px] font-normal cursor-pointer appearance-none bg-no-repeat bg-[length:14px] bg-[position:right_8px_center] transition-[border-color] duration-150',
      selected
        ? 'border-[rgba(59,130,246,0.25)] bg-[rgba(59,130,246,0.08)] text-[#3b82f6] hover:border-[rgba(59,130,246,0.35)]'
        : darkMode
          ? 'border-white/10 bg-white/[0.04] text-white/80 hover:border-white/20'
          : 'border-black/10 bg-[rgba(255,255,255,0.95)] text-black/70 hover:border-black/20',
      className
    )}
    style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")` }}
    {...p}
  >
    {children}
  </select>
);

const FilterInput = ({ darkMode, className, ...p }) => (
  <input
    className={cn(
      'py-2 px-3 border-[1.5px] rounded-lg text-[13px] w-[100px] transition-[border-color] duration-150 focus:outline-none focus:border-[rgba(59,130,246,0.35)]',
      darkMode ? 'border-white/10 bg-white/[0.04] text-white/90 placeholder:text-white/[0.35]' : 'border-black/10 bg-[rgba(255,255,255,0.95)] text-black/80 placeholder:text-black/[0.35]',
      className
    )}
    {...p}
  />
);

const Label = ({ darkMode, className, children, ...p }) => <span className={cn('text-[11px] font-semibold uppercase tracking-[0.06em] whitespace-nowrap', darkMode ? 'text-white/60' : 'text-[#919EAB]', className)} {...p}>{children}</span>;

const HeatMap = ({ darkMode, className, children, ...p }) => <div className={cn('w-full h-[320px] rounded-xl border mb-5 relative overflow-hidden transition-[border-color] duration-200', darkMode ? 'bg-white/[0.02] border-white/[0.08] hover:border-white/[0.15]' : 'bg-black/[0.02] border-black/[0.08] hover:border-black/[0.15]', className)} {...p}>{children}</div>;

const Canvas = ({ className, ...p }) => <canvas className={cn('w-full h-full cursor-crosshair', className)} {...p} />;

const CustomTooltip = ({ darkMode, className, children, ...p }) => <div className={cn('fixed rounded-lg py-[10px] px-[14px] text-xs pointer-events-none z-[1000] backdrop-blur-[8px] whitespace-nowrap translate-x-[12px] -translate-y-1/2', darkMode ? 'bg-black/90 border border-white/[0.15] text-white' : 'bg-white/95 border border-black/10 text-[#333]', className)} {...p}>{children}</div>;

const TableWrapper = ({ darkMode, className, children, ...p }) => <div className={cn('overflow-x-auto rounded-xl border w-full', darkMode ? 'border-white/[0.08] bg-white/[0.02]' : 'border-black/[0.08] bg-black/[0.02]', className)} {...p}>{children}</div>;

const Table = ({ className, children, ...p }) => <table className={cn('w-full border-collapse min-w-full table-auto hidden md:table', className)} {...p}>{children}</table>;

const Th = ({ darkMode, align, sortable, className, children, ...p }) => (
  <th
    className={cn(
      'py-[14px] px-4 font-semibold text-[10px] uppercase tracking-[0.06em] whitespace-nowrap',
      darkMode ? 'text-white/60 bg-white/[0.02] border-b border-white/[0.06]' : 'text-[#919EAB] bg-black/[0.02] border-b border-black/[0.06]',
      sortable ? 'cursor-pointer' : 'cursor-default',
      sortable && (darkMode ? 'hover:text-white/80' : 'hover:text-black/80'),
      className
    )}
    style={{ textAlign: align || 'left' }}
    {...p}
  >
    {children}
  </th>
);

const Tr = ({ darkMode, className, children, ...p }) => (
  <tr
    className={cn(
      'border-b cursor-pointer transition-[border-color,background-color] duration-200 last:border-b-0',
      darkMode ? 'border-white/[0.05] hover:bg-white/[0.04]' : 'border-black/[0.05] hover:bg-black/[0.02]',
      className
    )}
    {...p}
  >
    {children}
  </tr>
);

const Td = ({ darkMode, align, className, children, ...p }) => (
  <td
    className={cn('py-[14px] px-4 text-sm tracking-[0.005em]', darkMode ? 'text-white/88' : 'text-[#1a1a2e]', className)}
    style={{ textAlign: align || 'left' }}
    {...p}
  >
    {children}
  </td>
);

const TokenInfo = ({ className, children, ...p }) => <div className={cn('flex items-center gap-3', className)} {...p}>{children}</div>;

const TokenImage = ({ darkMode, className, ...p }) => <img className={cn('w-8 h-8 rounded-full border-2 object-cover', darkMode ? 'border-white/10' : 'border-black/10', className)} loading="lazy" decoding="async" width={32} height={32} {...p} />;

const TokenDetails = ({ className, children, ...p }) => <div className={cn('flex flex-col', className)} {...p}>{children}</div>;

const TokenName = ({ darkMode, className, children, ...p }) => <div className={cn('font-semibold text-sm tracking-[-0.01em]', darkMode ? 'text-white/95' : 'text-[#1a1a2e]', className)} {...p}>{children}</div>;

const TokenSymbol = ({ darkMode, className, children, ...p }) => <div className={cn('text-[11px] uppercase font-medium tracking-[0.02em]', darkMode ? 'text-white/60' : 'text-black/40', className)} {...p}>{children}</div>;

const RSIBadge = ({ bg, color, className, children, ...p }) => (
  <span
    className={cn('inline-flex items-center justify-center py-[5px] px-[10px] rounded-md font-medium text-[13px] min-w-[48px]', className)}
    style={{ background: bg, color }}
    {...p}
  >
    {children}
  </span>
);

const PriceChange = ({ positive, className, children, ...p }) => <span className={cn('font-semibold text-[13px]', positive ? 'text-[#22c55e]' : 'text-[#ef4444]', className)} {...p}>{children}</span>;

function RSIAnalysisPage({ data }) {
  const { themeName } = useContext(ThemeContext);
  const { activeFiatCurrency } = useContext(AppContext);
  const darkMode = themeName === 'XrplToDarkTheme';
  const metrics = useSelector(selectMetrics);
  const exchRate = metrics[activeFiatCurrency] || 1;
  const canvasRef = useRef(null);
  const router = useRouter();

  const [tokens, setTokens] = useState(data?.tokens || []);
  const [loading, setLoading] = useState(false);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, data: null });

  // API parameters
  const [params, setParams] = useState({
    start: 0,
    limit: 50,
    sortBy: 'rsi24h',
    sortType: 'desc',
    timeframe: '24h',
    origin: '',
    tag: '',
    filter: '',
    activeOnly: true,
    excludeNeutral: true,
    minMarketCap: '',
    maxMarketCap: '',
    minVolume24h: '',
    maxVolume24h: '',
    minRsi24h: '',
    maxRsi24h: ''
  });

  const BASE_URL = 'https://api.xrpl.to/v1';

  const timeframes = [
    { value: '15m', label: '15M' },
    { value: '1h', label: '1H' },
    { value: '4h', label: '4H' },
    { value: '24h', label: '24H' },
    { value: '7d', label: '7D' },
    { value: '30d', label: '30D' },
    { value: '90d', label: '90D' }
  ];

  const presets = [
    {
      label: 'Reset',
      filter: {
        origin: '',
        tag: '',
        minMarketCap: '',
        maxMarketCap: '',
        minVolume24h: '',
        maxVolume24h: '',
        minRsi24h: '',
        maxRsi24h: ''
      }
    },
    { label: 'Overbought', filter: { minRsi24h: '70', maxRsi24h: '' } },
    { label: 'Oversold', filter: { maxRsi24h: '30', minRsi24h: '' } },
    { label: 'Extreme OB', filter: { minRsi24h: '80', maxRsi24h: '' } },
    { label: 'Extreme OS', filter: { maxRsi24h: '20', minRsi24h: '' } },
    { label: 'Memes', filter: { tag: 'Memes' } },
    { label: 'DeFi', filter: { tag: 'DeFi' } }
  ];

  const loadTokens = useCallback(async () => {
    setLoading(true);
    try {
      const cleanParams = Object.entries(params).reduce((acc, [key, val]) => {
        if (val !== '' && val !== null && val !== undefined && val !== false) {
          acc[key] = val;
        }
        return acc;
      }, {});

      const response = await api.get(`${BASE_URL}/rsi`, { params: cleanParams });

      if (response.data?.tokens) {
        setTokens(response.data.tokens);
      }
    } catch (error) {
      console.error('Error loading RSI data:', error);
      setTokens([]);
    } finally {
      setLoading(false);
    }
  }, [params, BASE_URL]);

  useEffect(() => {
    loadTokens();
  }, [params]);

  const updateParam = (key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const setTimeframe = (tf) => {
    if (tf === params.timeframe) return;
    setTokens([]); // Clear stale data to prevent flash during API fetch
    setParams((prev) => ({
      ...prev,
      timeframe: tf,
      sortBy: `rsi${tf}`,
      [`minRsi${tf}`]: prev[`minRsi${prev.timeframe}`] || '',
      [`maxRsi${tf}`]: prev[`maxRsi${prev.timeframe}`] || '',
      [`minRsi${prev.timeframe}`]: '',
      [`maxRsi${prev.timeframe}`]: ''
    }));
  };

  const applyPreset = (preset) => {
    const rsiField = `minRsi${params.timeframe}`;
    const maxRsiField = `maxRsi${params.timeframe}`;

    // Map generic RSI filters to current timeframe
    const mappedFilter = { ...preset.filter };
    if ('minRsi24h' in preset.filter) {
      mappedFilter[rsiField] = preset.filter.minRsi24h;
      delete mappedFilter.minRsi24h;
    }
    if ('maxRsi24h' in preset.filter) {
      mappedFilter[maxRsiField] = preset.filter.maxRsi24h;
      delete mappedFilter.maxRsi24h;
    }

    setParams((prev) => ({
      ...prev,
      ...mappedFilter,
      start: 0
    }));
  };

  const removeFilter = (filterKey) => {
    setParams((prev) => ({
      ...prev,
      [filterKey]: '',
      start: 0
    }));
  };

  const getActiveFilters = () => {
    const filters = [];
    const rsiField = `minRsi${params.timeframe}`;
    const maxRsiField = `maxRsi${params.timeframe}`;

    if (params.origin)
      filters.push({ key: 'origin', label: `Origin: ${params.origin}`, value: params.origin });
    if (params.tag) filters.push({ key: 'tag', label: `Tag: ${params.tag}`, value: params.tag });
    if (params.filter)
      filters.push({ key: 'filter', label: `Search: ${params.filter}`, value: params.filter });
    if (params.minMarketCap)
      filters.push({
        key: 'minMarketCap',
        label: `Min MC: $${params.minMarketCap}`,
        value: params.minMarketCap
      });
    if (params.maxMarketCap)
      filters.push({
        key: 'maxMarketCap',
        label: `Max MC: $${params.maxMarketCap}`,
        value: params.maxMarketCap
      });
    if (params.minVolume24h)
      filters.push({
        key: 'minVolume24h',
        label: `Min Vol: $${params.minVolume24h}`,
        value: params.minVolume24h
      });
    if (params.maxVolume24h)
      filters.push({
        key: 'maxVolume24h',
        label: `Max Vol: $${params.maxVolume24h}`,
        value: params.maxVolume24h
      });
    if (params[rsiField])
      filters.push({
        key: rsiField,
        label: `Min RSI: ${params[rsiField]}`,
        value: params[rsiField]
      });
    if (params[maxRsiField])
      filters.push({
        key: maxRsiField,
        label: `Max RSI: ${params[maxRsiField]}`,
        value: params[maxRsiField]
      });

    return filters;
  };

  const handleSort = (field) => {
    setParams((prev) => ({
      ...prev,
      sortBy: field,
      sortType: prev.sortBy === field && prev.sortType === 'desc' ? 'asc' : 'desc',
      start: 0
    }));
  };

  const getSortIndicator = (field) => {
    if (params.sortBy !== field) return '';
    return params.sortType === 'desc' ? ' ↓' : ' ↑';
  };

  const getRSIValue = (token) => {
    const field = `rsi${params.timeframe}`;
    return token[field];
  };

  const getMarketCapColor = (mcap) => {
    if (!mcap || isNaN(mcap)) return darkMode ? '#FFFFFF' : '#000000';
    if (mcap >= 5e6) return darkMode ? '#2E7D32' : '#1B5E20';
    if (mcap >= 1e6) return darkMode ? '#4CAF50' : '#2E7D32';
    if (mcap >= 1e5) return darkMode ? '#42A5F5' : '#1976D2';
    if (mcap >= 1e4) return darkMode ? '#FFC107' : '#F57F17';
    if (mcap >= 1e3) return darkMode ? '#FF9800' : '#E65100';
    return darkMode ? '#EF5350' : '#C62828';
  };

  const getRSIColor = (rsi) => {
    if (!rsi || isNaN(rsi))
      return {
        bg: 'transparent',
        color: darkMode ? '#666' : '#999',
        border: 'transparent'
      };

    if (rsi >= 80)
      return {
        bg: 'rgba(244,67,54,0.2)',
        color: '#ff4444',
        border: 'rgba(244,67,54,0.3)'
      };

    if (rsi >= 70)
      return {
        bg: 'rgba(244,67,54,0.15)',
        color: '#ff8844',
        border: 'rgba(244,67,54,0.25)'
      };

    if (rsi <= 20)
      return {
        bg: 'rgba(138,68,255,0.2)',
        color: '#8844ff',
        border: 'rgba(138,68,255,0.3)'
      };

    if (rsi <= 30)
      return {
        bg: 'rgba(68,138,255,0.15)',
        color: '#4488ff',
        border: 'rgba(68,138,255,0.25)'
      };

    return {
      bg: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      color: darkMode ? '#fff' : '#000',
      border: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
    };
  };

  const handleCanvasMouseMove = useCallback(
    (e) => {
      const canvas = canvasRef.current;
      if (!canvas || !tokens.length) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const padding = 60;

      const validTokens = tokens
        .filter((token) => {
          const rsi = getRSIValue(token);
          return rsi && token.marketcap && rsi >= 0 && rsi <= 100;
        })
        .slice(0, 100);

      let hoveredToken = null;
      let minDistance = Infinity;

      if (validTokens.length > 0) {
        const marketCaps = validTokens.map((t) => t.marketcap);
        const minMC = Math.min(...marketCaps);
        const maxMC = Math.max(...marketCaps);
        const logMinMC = Math.log10(Math.max(minMC, 1));
        const logMaxMC = Math.log10(Math.max(maxMC, 1));

        validTokens.forEach((token, index) => {
          const rsi = getRSIValue(token);
          const marketCap = token.marketcap || 1;
          const logMC = Math.log10(Math.max(marketCap, 1));
          const xNormalized =
            logMaxMC > logMinMC ? (logMC - logMinMC) / (logMaxMC - logMinMC) : 0.5;
          const baseX = padding + xNormalized * (rect.width - padding * 1.5);
          const baseY = rect.height - padding - (rsi / 100) * (rect.height - padding * 2);

          // Add same jitter as in drawHeatMap
          const jitterX = ((index % 7) - 3) * 8;
          const jitterY = ((Math.floor(index / 7) % 5) - 2) * 6;
          const tokenX = baseX + jitterX;
          const tokenY = baseY + jitterY;

          const distance = Math.sqrt((x - tokenX) ** 2 + (y - tokenY) ** 2);
          const size = Math.max(4, Math.min(20, Math.sqrt(marketCap / 1000000) * 3 + 3));

          if (distance <= size + 8 && distance < minDistance) {
            minDistance = distance;
            hoveredToken = token;
          }
        });
      }

      if (hoveredToken) {
        setTooltip({
          visible: true,
          x: e.clientX,
          y: e.clientY,
          data: hoveredToken
        });
      } else {
        setTooltip({ visible: false, x: 0, y: 0, data: null });
      }
    },
    [tokens, getRSIValue]
  );

  const handleCanvasMouseLeave = useCallback(() => {
    setTooltip({ visible: false, x: 0, y: 0, data: null });
  }, []);

  const drawHeatMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = 60;

    ctx.fillStyle = darkMode ? '#1a1a1a' : '#fff';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    [20, 30, 50, 70, 80].forEach((level) => {
      const y = height - padding - (level / 100) * (height - padding * 2);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding / 2, y);
      ctx.stroke();
    });

    ctx.setLineDash([]);

    ctx.fillStyle = darkMode ? 'rgba(244,67,54,0.08)' : 'rgba(244,67,54,0.05)';
    const overboughtY = height - padding - (70 / 100) * (height - padding * 2);
    ctx.fillRect(padding, padding, width - padding * 1.5, overboughtY - padding);

    ctx.fillStyle = darkMode ? 'rgba(76,175,80,0.08)' : 'rgba(76,175,80,0.05)';
    const oversoldY = height - padding - (30 / 100) * (height - padding * 2);
    ctx.fillRect(padding, oversoldY, width - padding * 1.5, height - padding - oversoldY);

    const validTokens = tokens
      .filter((token) => {
        const rsi = getRSIValue(token);
        return rsi && token.marketcap && rsi >= 0 && rsi <= 100;
      })
      .slice(0, 100);

    if (validTokens.length > 0) {
      const marketCaps = validTokens.map((t) => t.marketcap);
      const minMC = Math.min(...marketCaps);
      const maxMC = Math.max(...marketCaps);
      const logMinMC = Math.log10(Math.max(minMC, 1));
      const logMaxMC = Math.log10(Math.max(maxMC, 1));

      validTokens.forEach((token, index) => {
        const rsi = getRSIValue(token);
        const marketCap = token.marketcap || 1;

        const logMC = Math.log10(Math.max(marketCap, 1));
        const xNormalized = logMaxMC > logMinMC ? (logMC - logMinMC) / (logMaxMC - logMinMC) : 0.5;
        const baseX = padding + xNormalized * (width - padding * 1.5);
        const baseY = height - padding - (rsi / 100) * (height - padding * 2);

        // Add slight jitter to prevent overlap
        const jitterX = ((index % 7) - 3) * 8;
        const jitterY = ((Math.floor(index / 7) % 5) - 2) * 6;
        const x = baseX + jitterX;
        const y = baseY + jitterY;

        const size = Math.max(4, Math.min(20, Math.sqrt(marketCap / 1000000) * 3 + 3));

        let color;
        if (rsi >= 80) color = '#ff4444';
        else if (rsi >= 70) color = '#ff8844';
        else if (rsi <= 20) color = '#8844ff';
        else if (rsi <= 30) color = '#4488ff';
        else color = '#44ff44';

        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();

        ctx.strokeStyle = darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }

    ctx.fillStyle = darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';
    ctx.font = '12px -apple-system, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    [0, 20, 30, 50, 70, 80, 100].forEach((level) => {
      const y = height - padding - (level / 100) * (height - padding * 2);
      ctx.fillText(level.toString(), padding - 10, y);
    });

    ctx.save();
    ctx.translate(20, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px -apple-system, system-ui, sans-serif';
    ctx.fillText(`RSI ${params.timeframe.toUpperCase()}`, 0, 0);
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.font = 'bold 12px -apple-system, system-ui, sans-serif';
    ctx.fillText(`Market Cap (${activeFiatCurrency})`, width / 2, height - 20);
  }, [tokens, params.timeframe, darkMode, activeFiatCurrency, getRSIValue]);

  useEffect(() => {
    const timer = setTimeout(drawHeatMap, 100);
    return () => clearTimeout(timer);
  }, [drawHeatMap]);

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
    <div className="min-h-screen overflow-hidden m-0 p-0">
      <Header />
      <h1
        className="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0"
        style={{ clip: 'rect(0,0,0,0)' }}
      >
        RSI Analysis for XRPL Tokens
      </h1>

      <div id="back-to-top-anchor" className="mx-auto max-w-[1920px] px-2.5 md:px-4 mt-4">
        <Controls darkMode={darkMode}>
          <ControlRow>
            <MobileButtonGrid>
              {timeframes.map((tf) => (
                <Button
                  key={tf.value}
                  darkMode={darkMode}
                  selected={params.timeframe === tf.value}
                  onClick={() => setTimeframe(tf.value)}
                >
                  {tf.label}
                </Button>
              ))}
            </MobileButtonGrid>
            <div className="flex gap-2 ml-auto items-center">
              {presets.map((preset) => (
                <Button key={preset.label} darkMode={darkMode} onClick={() => applyPreset(preset)}>
                  {preset.label}
                </Button>
              ))}
              <Select
                darkMode={darkMode}
                value={params.limit}
                onChange={(e) => updateParam('limit', e.target.value)}
                aria-label="Results per page"
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </Select>
            </div>
          </ControlRow>

          <ControlRow>
            <MobileFilterGrid>
              <SearchInput
                darkMode={darkMode}
                placeholder="Search..."
                value={params.filter}
                onChange={(e) => updateParam('filter', e.target.value)}
                className="!min-w-[120px] !max-w-[160px]"
              />
              <Select
                darkMode={darkMode}
                selected={!!params.tag}
                value={params.tag}
                onChange={(e) => updateParam('tag', e.target.value)}
                aria-label="Filter by tag"
              >
                <option value="">All Tags</option>
                <option value="Memes">Memes</option>
                <option value="DeFi">DeFi</option>
                <option value="Gaming">Gaming</option>
                <option value="NFT">NFT</option>
                <option value="Stablecoin">Stablecoin</option>
              </Select>
              <Select
                darkMode={darkMode}
                selected={!!params.origin}
                value={params.origin}
                onChange={(e) => updateParam('origin', e.target.value)}
                aria-label="Filter by origin"
              >
                <option value="">All Origins</option>
                <option value="FirstLedger">FirstLedger</option>
              </Select>
              <FilterInput
                darkMode={darkMode}
                placeholder="Min MC"
                value={params.minMarketCap}
                onChange={(e) => updateParam('minMarketCap', e.target.value)}
              />
              <FilterInput
                darkMode={darkMode}
                placeholder="Min Vol"
                value={params.minVolume24h}
                onChange={(e) => updateParam('minVolume24h', e.target.value)}
              />
              <FilterInput
                darkMode={darkMode}
                placeholder="Min RSI"
                value={params[`minRsi${params.timeframe}`] || ''}
                onChange={(e) => updateParam(`minRsi${params.timeframe}`, e.target.value)}
              />
              <FilterInput
                darkMode={darkMode}
                placeholder="Max RSI"
                value={params[`maxRsi${params.timeframe}`] || ''}
                onChange={(e) => updateParam(`maxRsi${params.timeframe}`, e.target.value)}
              />
              <Button
                darkMode={darkMode}
                selected={params.activeOnly}
                onClick={() => updateParam('activeOnly', !params.activeOnly)}
                title="Only tokens with 24h volume"
              >
                Active
              </Button>
              <Button
                darkMode={darkMode}
                selected={params.excludeNeutral}
                onClick={() => updateParam('excludeNeutral', !params.excludeNeutral)}
                title="Exclude RSI=50 (no data)"
              >
                Valid RSI
              </Button>
            </MobileFilterGrid>
          </ControlRow>

          {getActiveFilters().length > 0 && (
            <ActiveFilters>
              {getActiveFilters().map((filter) => (
                <FilterChip
                  key={filter.key}
                  darkMode={darkMode}
                  onClick={() => removeFilter(filter.key)}
                  title="Click to remove"
                >
                  {filter.label}
                </FilterChip>
              ))}
            </ActiveFilters>
          )}
        </Controls>

        <HeatMap darkMode={darkMode}>
          <Canvas
            ref={canvasRef}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={handleCanvasMouseLeave}
            style={{ opacity: loading ? 0.3 : 1, transition: 'opacity 0.2s' }}
          />
          <div className="absolute top-3 left-5 right-5 flex justify-between items-center">
            <span
              className={cn('text-sm font-semibold tracking-[-0.01em]', darkMode ? 'text-white/60' : 'text-black/60')}
            >
              RSI Heatmap · {params.timeframe.toUpperCase()}
            </span>
            <div className="flex gap-3 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#ff4444]" />
                <span className={darkMode ? 'text-white/50' : 'text-black/50'}>≥80</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#ff8844]" />
                <span className={darkMode ? 'text-white/50' : 'text-black/50'}>≥70</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#44ff44]" />
                <span className={darkMode ? 'text-white/50' : 'text-black/50'}>30-70</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#4488ff]" />
                <span className={darkMode ? 'text-white/50' : 'text-black/50'}>≤30</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#8844ff]" />
                <span className={darkMode ? 'text-white/50' : 'text-black/50'}>≤20</span>
              </span>
            </div>
          </div>
          {loading && (
            <div
              className={cn('absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[13px]', darkMode ? 'text-white/60' : 'text-black/50')}
            >
              Loading...
            </div>
          )}
          {tooltip.visible && tooltip.data && (
            <CustomTooltip darkMode={darkMode} style={{ left: tooltip.x, top: tooltip.y }}>
              <div className="font-semibold mb-1">{tooltip.data.name}</div>
              <div>RSI: {getRSIValue(tooltip.data)?.toFixed(1) || 'N/A'}</div>
              <div>MC: ${(tooltip.data.marketcap / 1000000).toFixed(2)}M</div>
              <div>
                24h: {tooltip.data.pro24h >= 0 ? '+' : ''}
                {tooltip.data.pro24h?.toFixed(2) || '0.00'}%
              </div>
            </CustomTooltip>
          )}
        </HeatMap>

        <TableWrapper darkMode={darkMode}>
          <Table>
            <thead>
              <tr>
                <Th darkMode={darkMode}>#</Th>
                <Th darkMode={darkMode}>Token</Th>
                <Th darkMode={darkMode} align="right" sortable onClick={() => handleSort('exch')}>
                  Price{getSortIndicator('exch')}
                </Th>
                <Th darkMode={darkMode} align="right" sortable onClick={() => handleSort('pro24h')}>
                  24h{getSortIndicator('pro24h')}
                </Th>
                <Th
                  darkMode={darkMode}
                  align="right"
                  sortable
                  onClick={() => handleSort('vol24hxrp')}
                >
                  Volume{getSortIndicator('vol24hxrp')}
                </Th>
                <Th
                  darkMode={darkMode}
                  align="right"
                  sortable
                  onClick={() => handleSort('marketcap')}
                >
                  MCap{getSortIndicator('marketcap')}
                </Th>
                <Th
                  darkMode={darkMode}
                  align="right"
                  sortable
                  onClick={() => handleSort('holders')}
                >
                  Holders{getSortIndicator('holders')}
                </Th>
                <Th
                  darkMode={darkMode}
                  align="center"
                  sortable
                  onClick={() => handleSort(`rsi${params.timeframe}`)}
                >
                  RSI{getSortIndicator(`rsi${params.timeframe}`)}
                </Th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((token, idx) => {
                const rsi = getRSIValue(token);
                const rsiColors = getRSIColor(rsi);
                const marketCapFiat = new Decimal(token.marketcap || 0).div(exchRate).toNumber();
                const volumeFiat = new Decimal(token.vol24hxrp || 0).div(exchRate).toNumber();
                const priceFiat = new Decimal(token.exch || 0).div(exchRate).toNumber();

                return (
                  <Tr
                    key={token.md5}
                    darkMode={darkMode}
                    onClick={() => router.push(`/token/${token.slug}`)}
                  >
                    <Td darkMode={darkMode}>{params.start + idx + 1}</Td>
                    <Td darkMode={darkMode}>
                      <TokenInfo>
                        <TokenImage
                          darkMode={darkMode}
                          src={`https://s1.xrpl.to/thumb/${token.md5}_48`}
                          alt=""
                          onError={(e) => (e.target.style.display = 'none')}
                        />
                        <TokenDetails>
                          <TokenName darkMode={darkMode}>{token.name}</TokenName>
                          <TokenSymbol darkMode={darkMode}>{token.user}</TokenSymbol>
                        </TokenDetails>
                      </TokenInfo>
                    </Td>
                    <Td darkMode={darkMode} align="right">
                      <span>
                        {currencySymbols[activeFiatCurrency]}
                        {fCurrency5(priceFiat)}
                      </span>
                    </Td>
                    <Td darkMode={darkMode} align="right">
                      <PriceChange positive={token.pro24h >= 0}>
                        {token.pro24h >= 0 ? '+' : ''}
                        {token.pro24h?.toFixed(2) || '0.00'}%
                      </PriceChange>
                    </Td>
                    <Td darkMode={darkMode} align="right">
                      <span>
                        {currencySymbols[activeFiatCurrency]}
                        {volumeFiat >= 1e6
                          ? `${(volumeFiat / 1e6).toFixed(1)}M`
                          : volumeFiat >= 1e3
                            ? `${(volumeFiat / 1e3).toFixed(1)}K`
                            : fNumber(volumeFiat)}
                      </span>
                    </Td>
                    <Td darkMode={darkMode} align="right">
                      <span style={{ color: getMarketCapColor(marketCapFiat) }}>
                        {currencySymbols[activeFiatCurrency]}
                        {marketCapFiat >= 1e6
                          ? `${(marketCapFiat / 1e6).toFixed(1)}M`
                          : marketCapFiat >= 1e3
                            ? `${(marketCapFiat / 1e3).toFixed(1)}K`
                            : fNumber(marketCapFiat)}
                      </span>
                    </Td>
                    <Td darkMode={darkMode} align="right">
                      <span
                        className={darkMode ? 'text-white/70' : 'text-black/70'}
                      >
                        {token.holders ? fNumber(token.holders) : '-'}
                      </span>
                    </Td>
                    <Td darkMode={darkMode} align="center">
                      <RSIBadge {...rsiColors}>{rsi ? rsi.toFixed(1) : '-'}</RSIBadge>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>

          {/* Mobile card layout */}
          <div className="md:hidden divide-y divide-white/10">
            {tokens.map((token, idx) => {
              const rsi = getRSIValue(token);
              const rsiColors = getRSIColor(rsi);
              const marketCapFiat = new Decimal(token.marketcap || 0).div(exchRate).toNumber();
              const volumeFiat = new Decimal(token.vol24hxrp || 0).div(exchRate).toNumber();
              const priceFiat = new Decimal(token.exch || 0).div(exchRate).toNumber();

              return (
                <div
                  key={token.md5}
                  onClick={() => router.push(`/token/${token.slug}`)}
                  className={cn('px-3 py-3 cursor-pointer transition-colors duration-150', darkMode ? 'border-white/[0.05] hover:bg-white/[0.04]' : 'border-black/[0.05] hover:bg-black/[0.02]', idx > 0 && 'border-t-[1.5px]')}
                >
                  {/* Row 1: Rank + Token + RSI badge */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn('text-[11px] w-5 text-center shrink-0', darkMode ? 'text-white/60' : 'text-[#919EAB]')}>{params.start + idx + 1}</span>
                      <TokenImage
                        darkMode={darkMode}
                        src={`https://s1.xrpl.to/thumb/${token.md5}_32`}
                        alt=""
                        onError={(e) => (e.target.style.display = 'none')}
                        className="!w-6 !h-6"
                      />
                      <div className="min-w-0">
                        <div className={cn('text-[13px] font-semibold tracking-[-0.01em] truncate', darkMode ? 'text-white/95' : 'text-[#1a1a2e]')}>{token.name}</div>
                        <div className={cn('text-[10px] uppercase font-medium tracking-[0.02em]', darkMode ? 'text-white/60' : 'text-black/40')}>{token.user}</div>
                      </div>
                    </div>
                    <RSIBadge {...rsiColors} className="shrink-0 ml-2 text-[11px] py-1 px-2 min-w-0">
                      {rsi ? rsi.toFixed(1) : '-'}
                    </RSIBadge>
                  </div>

                  {/* Row 2: Key stats grid */}
                  <div className="grid grid-cols-4 gap-x-3 gap-y-1.5 ml-7">
                    <div>
                      <div className={cn('text-[9px] uppercase tracking-[0.06em] font-semibold', darkMode ? 'text-white/50' : 'text-black/30')}>Price</div>
                      <div className={cn('text-[12px] font-medium', darkMode ? 'text-white/85' : 'text-[#1a1a2e]')}>
                        {currencySymbols[activeFiatCurrency]}{fCurrency5(priceFiat)}
                      </div>
                    </div>
                    <div>
                      <div className={cn('text-[9px] uppercase tracking-[0.06em] font-semibold', darkMode ? 'text-white/50' : 'text-black/30')}>24h</div>
                      <div className="text-[12px] font-semibold" style={{ color: token.pro24h >= 0 ? '#22c55e' : '#ef4444' }}>
                        {token.pro24h >= 0 ? '+' : ''}{token.pro24h?.toFixed(2) || '0.00'}%
                      </div>
                    </div>
                    <div>
                      <div className={cn('text-[9px] uppercase tracking-[0.06em] font-semibold', darkMode ? 'text-white/50' : 'text-black/30')}>MCap</div>
                      <div className={cn('text-[12px] font-medium', darkMode ? 'text-white/85' : 'text-[#1a1a2e]')}>
                        {marketCapFiat >= 1e6 ? `${(marketCapFiat / 1e6).toFixed(1)}M` : marketCapFiat >= 1e3 ? `${(marketCapFiat / 1e3).toFixed(1)}K` : fNumber(marketCapFiat)}
                      </div>
                    </div>
                    <div>
                      <div className={cn('text-[9px] uppercase tracking-[0.06em] font-semibold', darkMode ? 'text-white/50' : 'text-black/30')}>Vol</div>
                      <div className={cn('text-[12px] font-medium', darkMode ? 'text-white/85' : 'text-[#1a1a2e]')}>
                        {volumeFiat >= 1e6 ? `${(volumeFiat / 1e6).toFixed(1)}M` : volumeFiat >= 1e3 ? `${(volumeFiat / 1e3).toFixed(1)}K` : fNumber(volumeFiat)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </TableWrapper>

        {tokens.length > 0 && (
          <div className="mt-5 flex gap-[10px] justify-center">
            <Button
              darkMode={darkMode}
              onClick={() => updateParam('start', Math.max(0, params.start - params.limit))}
              disabled={params.start === 0}
            >
              Previous
            </Button>
            <span className={cn('p-[10px]', darkMode ? 'text-white' : 'text-[#333]')}>
              Page {Math.floor(params.start / params.limit) + 1}
            </span>
            <Button
              darkMode={darkMode}
              onClick={() => updateParam('start', params.start + params.limit)}
              disabled={tokens.length < params.limit}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      <ScrollToTop />
      <Footer />
    </div>
  );
}

export default RSIAnalysisPage;

export async function getServerSideProps({ res }) {
  res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=120');

  const BASE_URL = 'https://api.xrpl.to/v1';

  try {
    const rsiRes = await api.get(`${BASE_URL}/rsi`, {
      params: {
        sortBy: 'rsi24h',
        sortType: 'desc',
        limit: 50,
        timeframe: '24h',
        activeOnly: true,
        excludeNeutral: true
      },
      timeout: 8000
    });

    return {
      props: {
        data: {
          tokens: rsiRes.data?.tokens || []
        },
        ogp: {
          canonical: 'https://xrpl.to/rsi-analysis',
          title: 'RSI Analysis | XRPL Token Technical Indicators',
          url: 'https://xrpl.to/rsi-analysis',
          imgUrl: 'https://xrpl.to/api/og/rsi-analysis',
          imgType: 'image/png',
          desc: 'Advanced RSI analysis for XRPL tokens with overbought/oversold detection',
          keywords: 'RSI analysis, XRPL tokens, technical indicators, crypto RSI'
        }
      }
    };
  } catch (error) {
    console.error('Error fetching RSI data:', error);
    return {
      props: { data: { tokens: [] } }
    };
  }
}
