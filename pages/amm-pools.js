import { useState, useEffect, useContext, useCallback, useMemo, memo, useRef } from 'react';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
import { useRouter } from 'next/router';
import api from 'src/utils/api';
import { ThemeContext, AppContext } from 'src/context/AppContext';
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';
import { fNumber } from 'src/utils/formatters';
import Decimal from 'decimal.js-light';
import { ArrowDownUp } from 'lucide-react';
import { cn } from 'src/utils/cn';

const currencySymbols = {
  USD: '$ ',
  EUR: '€ ',
  JPY: '¥ ',
  CNH: '¥ ',
  XRP: '✕ '
};

const Wrapper = ({ className, children, ...p }) => <div className={cn('overflow-x-clip w-full max-w-[100vw] min-h-screen', className)} {...p}>{children}</div>;

const Controls = ({ darkMode, className, children, ...p }) => <div className={cn('flex flex-col gap-3 mb-4 p-[14px] rounded-xl border w-full transition-[border-color] duration-150', darkMode ? 'bg-white/[0.015] border-white/[0.06] hover:border-white/10' : 'bg-black/[0.01] border-black/[0.06] hover:border-black/10', className)} {...p}>{children}</div>;

const ControlRow = ({ darkMode, className, children, ...p }) => <div className={cn('flex gap-4 items-center flex-wrap w-full max-md:flex-col max-md:items-stretch max-md:gap-3', className)} {...p}>{children}</div>;

const MobileSection = ({ className, children, ...p }) => <div className={cn('max-md:w-full max-md:flex max-md:flex-col max-md:gap-2', className)} {...p}>{children}</div>;

const MobileButtonGrid = ({ className, children, ...p }) => <div className={cn('flex gap-4 max-md:grid max-md:grid-cols-[repeat(auto-fit,minmax(80px,1fr))] max-md:gap-2 max-md:w-full', className)} {...p}>{children}</div>;

const Button = ({ darkMode, className, children, ...p }) => (
  <button
    className={cn(
      'py-2 px-4 border-none rounded-lg cursor-pointer text-[13px] font-normal transition-[background-color] duration-150 disabled:opacity-40 disabled:cursor-not-allowed',
      darkMode ? 'bg-white/[0.06] text-white/70 hover:not-disabled:bg-white/10 hover:not-disabled:text-white' : 'bg-black/[0.04] text-black/60 hover:not-disabled:bg-black/[0.08] hover:not-disabled:text-[#333]',
      className
    )}
    {...p}
  >
    {children}
  </button>
);

const Select = ({ darkMode, className, children, ...p }) => (
  <select
    className={cn(
      'py-2 pl-[14px] pr-[30px] rounded-lg border text-[13px] font-normal cursor-pointer appearance-none bg-no-repeat bg-[length:14px] bg-[position:right_8px_center] transition-[border-color] duration-150 focus:outline-none focus:border-[#3b82f6]',
      darkMode ? 'border-white/[0.08] bg-white/[0.03] text-white/80 hover:border-white/[0.15]' : 'border-black/[0.08] bg-black/[0.02] text-black/70 hover:border-black/[0.15]',
      className
    )}
    style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")` }}
    {...p}
  >
    {children}
  </select>
);

const Label = ({ darkMode, className, children, ...p }) => <span className={cn('text-[13px] font-medium tracking-[0.01em] whitespace-nowrap', darkMode ? 'text-white/40' : 'text-black/40', className)} {...p}>{children}</span>;

const SummaryGrid = ({ className, children, ...p }) => <div className={cn('grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mt-5 mb-5 max-md:mt-4', className)} {...p}>{children}</div>;

const SummaryCard = ({ darkMode, className, children, ...p }) => <div className={cn('p-4 rounded-xl border transition-[border-color,background-color] duration-200', darkMode ? 'bg-white/[0.02] border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.04]' : 'bg-black/[0.02] border-black/[0.08] hover:border-black/[0.15] hover:bg-black/[0.04]', className)} {...p}>{children}</div>;

const SummaryLabel = ({ darkMode, className, children, ...p }) => <div className={cn('text-[10px] mb-2 font-semibold uppercase tracking-[0.06em]', darkMode ? 'text-white/60' : 'text-[#919EAB]', className)} {...p}>{children}</div>;

const SummaryValue = ({ darkMode, className, children, ...p }) => <div className={cn('text-xl font-bold tracking-[-0.01em]', darkMode ? 'text-white/95' : 'text-[#1a1a2e]', className)} {...p}>{children}</div>;

const TableWrapper = ({ darkMode, className, children, ...p }) => <div className={cn('overflow-x-auto rounded-xl border w-full', darkMode ? 'border-white/[0.08] bg-white/[0.02]' : 'border-black/[0.08] bg-black/[0.02]', className)} {...p}>{children}</div>;

const Table = ({ className, children, ...p }) => <table className={cn('w-full border-collapse min-w-full table-auto hidden md:table', className)} {...p}>{children}</table>;

const Th = ({ darkMode, align, sortable, className, children, ...p }) => (
  <th
    className={cn(
      'py-[10px] px-2 font-semibold text-[10px] uppercase tracking-[0.06em] whitespace-nowrap font-[inherit]',
      darkMode ? 'text-white/60 bg-white/[0.02] border-b border-white/[0.05]' : 'text-[#919EAB] bg-black/[0.01] border-b border-black/[0.05]',
      sortable ? 'cursor-pointer' : 'cursor-default',
      sortable && (darkMode ? 'hover:text-white/70' : 'hover:text-black/60'),
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
    className={cn('py-[14px] px-4 text-sm tracking-[0.005em]', darkMode ? 'text-white/[0.88]' : 'text-[#1a1a2e]', className)}
    style={{ textAlign: align || 'left' }}
    {...p}
  >
    {children}
  </td>
);

const PoolInfo = ({ className, children, ...p }) => <div className={cn('flex flex-col gap-1', className)} {...p}>{children}</div>;

const PoolPair = ({ darkMode, className, children, ...p }) => <div className={cn('flex items-center gap-2 font-semibold text-sm tracking-[-0.01em]', darkMode ? 'text-white/95' : 'text-[#1a1a2e]', className)} {...p}>{children}</div>;

const TokenIconPair = ({ className, children, ...p }) => <div className={cn('flex mr-2', className)} {...p}>{children}</div>;

const TokenImage = ({ darkMode, className, ...p }) => (
  <img
    className={cn('w-6 h-6 rounded-full object-cover border-2 last:-ml-2', darkMode ? 'border-[#1a1a1a]' : 'border-white', className)}
    width={24}
    height={24}
    decoding="async"
    {...p}
  />
);

const PoolAccount = ({ darkMode, className, children, ...p }) => <div className={cn('text-[11px] font-mono tracking-[0.02em]', darkMode ? 'text-white/60' : 'text-black/40', className)} {...p}>{children}</div>;

const APYBadge = ({ bg, color, border, className, children, ...p }) => (
  <span
    className={cn('inline-flex items-center justify-center py-[6px] px-3 rounded-lg font-semibold text-[13px] min-w-[50px] border-[1.5px]', className)}
    style={{ background: bg, color, borderColor: border }}
    {...p}
  >
    {children}
  </span>
);

const StatusBadge = ({ active, className, children, ...p }) => (
  <span
    className={cn(
      'inline-flex items-center justify-center py-1 px-[10px] rounded-md font-bold text-[9px] uppercase tracking-[0.05em] border-[1.5px]',
      active ? 'bg-[rgba(76,175,80,0.1)] text-[#4caf50] border-[rgba(76,175,80,0.3)]' : 'bg-[rgba(158,158,158,0.1)] text-[#9e9e9e] border-[rgba(158,158,158,0.3)]',
      className
    )}
    {...p}
  >
    {children}
  </span>
);

function AMMPoolsPage({ data, initialQuery }) {
  const { darkMode } = useContext(ThemeContext);
  const { activeFiatCurrency } = useContext(AppContext);
  const metrics = useSelector(selectMetrics);
  const exchRate = metrics[activeFiatCurrency] || 1;
  const router = useRouter();

  const [pools, setPools] = useState(data?.pools || []);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(data?.totalPages || 0);
  const [currentPage, setCurrentPage] = useState(initialQuery?.page || 0);
  const [summary, setSummary] = useState(data?.summary || null);

  const [params, setParams] = useState({
    sortBy: initialQuery?.sortBy || 'fees',
    status: initialQuery?.status || 'active',
    page: initialQuery?.page || 0,
    limit: initialQuery?.limit || 50,
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

      const response = await api.get(`${BASE_URL}/api/amm`, { params: cleanParams });

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

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    loadPools();
    const query = {};
    if (params.sortBy !== 'fees') query.sortBy = params.sortBy;
    if (params.status !== 'active') query.status = params.status;
    if (params.page > 0) query.page = params.page;
    if (params.limit !== 50) query.limit = params.limit;
    router.push({ pathname: '/amm-pools', query }, undefined, { shallow: true });
  }, [params.sortBy, params.status, params.limit, params.page]);

  const updateParam = (key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const getAPYColor = (apy) => {
    if (!apy || isNaN(apy))
      return {
        bg: 'transparent',
        color: darkMode ? '#666' : '#999',
        border: 'transparent'
      };

    if (apy >= 100)
      return {
        bg: 'rgba(76,175,80,0.2)',
        color: '#4caf50',
        border: 'rgba(76,175,80,0.3)'
      };

    if (apy >= 50)
      return {
        bg: 'rgba(139,195,74,0.15)',
        color: '#8bc34a',
        border: 'rgba(139,195,74,0.25)'
      };

    if (apy >= 20)
      return {
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

  const formatPair = useMemo(
    () => (pool) => {
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
    },
    []
  );

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
      <h1 className="sr-only">
        AMM Pools - XRPL Automated Market Maker Analytics
      </h1>

      <div id="back-to-top-anchor" className="mx-auto max-w-[1920px] px-2.5 md:px-4 mt-4">
        {summary && (
          <SummaryGrid>
            <SummaryCard darkMode={darkMode}>
              <SummaryLabel darkMode={darkMode}>Total Liquidity</SummaryLabel>
              <SummaryValue darkMode={darkMode}>
                {formatCurrency(summary.totalLiquidity)} XRP
              </SummaryValue>
              {(summary.xrpTokenLiquidity || summary.tokenTokenLiquidity) && (
                <div className={cn('text-[11px] mt-1 tracking-[0.01em]', darkMode ? 'text-white/50' : 'text-black/35')}>
                  {summary.xrpTokenLiquidity && (
                    <span>XRP Pools: {formatCurrency(summary.xrpTokenLiquidity)}</span>
                  )}
                  {summary.xrpTokenLiquidity && summary.tokenTokenLiquidity && <span> · </span>}
                  {summary.tokenTokenLiquidity && (
                    <span>Token Pools: {formatCurrency(summary.tokenTokenLiquidity)}</span>
                  )}
                </div>
              )}
            </SummaryCard>
            <SummaryCard darkMode={darkMode}>
              <SummaryLabel darkMode={darkMode}>Volume (24h)</SummaryLabel>
              <SummaryValue darkMode={darkMode}>
                {formatCurrency(summary.totalVolume24h)} XRP
              </SummaryValue>
            </SummaryCard>
            <SummaryCard darkMode={darkMode}>
              <SummaryLabel darkMode={darkMode}>Volume (7d)</SummaryLabel>
              <SummaryValue darkMode={darkMode}>
                {formatCurrency(summary.totalVolume7d)} XRP
              </SummaryValue>
            </SummaryCard>
            <SummaryCard darkMode={darkMode}>
              <SummaryLabel darkMode={darkMode}>Fees Earned (24h)</SummaryLabel>
              <SummaryValue darkMode={darkMode}>
                {formatCurrency(summary.totalFees24h)} XRP
              </SummaryValue>
            </SummaryCard>
            <SummaryCard darkMode={darkMode}>
              <SummaryLabel darkMode={darkMode}>Fees Earned (7d)</SummaryLabel>
              <SummaryValue darkMode={darkMode}>
                {formatCurrency(summary.totalFees7d)} XRP
              </SummaryValue>
            </SummaryCard>
            <SummaryCard darkMode={darkMode}>
              <SummaryLabel darkMode={darkMode}>Avg Trade Fee</SummaryLabel>
              <SummaryValue darkMode={darkMode}>{(summary.avgFee / 10).toFixed(4)}%</SummaryValue>
            </SummaryCard>
          </SummaryGrid>
        )}

        {/* Mobile sort chips */}
        <div className="md:hidden mb-3 flex items-center gap-2 overflow-x-auto scrollbar-none pb-1" style={{ scrollbarWidth: 'none' }}>
          <div className={cn('flex items-center gap-1 shrink-0 pl-0.5', darkMode ? 'text-white/40' : 'text-black/[0.45]')}>
            <ArrowDownUp size={12} />
          </div>
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateParam('sortBy', opt.value)}
              className={cn(
                'shrink-0 text-[11px] tracking-[0.02em] py-[5px] px-2.5 rounded-full border-[1.5px] transition-[border-color,background-color] duration-150 cursor-pointer whitespace-nowrap',
                params.sortBy === opt.value
                  ? 'border-[#3b82f6] bg-[#3b82f6]/10 text-[#3b82f6] font-medium'
                  : darkMode
                    ? 'border-white/10 bg-transparent text-white/50 hover:border-white/20 hover:text-white/70'
                    : 'border-black/[0.06] bg-transparent text-black/40 hover:border-black/10 hover:text-black/60'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Desktop sort controls */}
        <div className="hidden md:flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateParam('sortBy', opt.value)}
                className={cn(
                  'py-2 px-[14px] rounded-lg border-[1.5px] text-[13px] cursor-pointer',
                  params.sortBy === opt.value
                    ? 'border-blue-500/40 bg-blue-500/10 text-blue-500 font-medium'
                    : cn('bg-transparent font-normal', darkMode ? 'border-white/10 text-white' : 'border-black/10 text-[#333]')
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <select
            value={params.limit}
            aria-label="Results per page"
            onChange={(e) => updateParam('limit', e.target.value)}
            className={cn(
              'py-2 pl-3 pr-8 rounded-lg border-[1.5px] text-[13px] cursor-pointer appearance-none bg-no-repeat bg-[length:14px] bg-[position:right_8px_center]',
              darkMode ? 'border-white/10 bg-white/5 text-white' : 'border-black/10 bg-white text-[#333]'
            )}
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${darkMode ? '%23fff' : '%23333'}' stroke-width='2'%3e%3cpolyline points='6 9 12 15 18 9'/%3e%3c/svg%3e")` }}
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
                <Th darkMode={darkMode} align="right">
                  TRADE FEE
                </Th>
                <Th darkMode={darkMode} align="right">
                  LIQUIDITY
                </Th>
                <Th darkMode={darkMode} align="right">
                  VOL (24H)
                </Th>
                <Th darkMode={darkMode} align="right">
                  VOL (7D)
                </Th>
                <Th darkMode={darkMode} align="right">
                  FEES (24H)
                </Th>
                <Th darkMode={darkMode} align="right">
                  FEES (7D)
                </Th>
                <Th darkMode={darkMode} align="center">
                  APY (24H)
                </Th>
                <Th darkMode={darkMode} align="center">
                  APY (7D)
                </Th>
              </tr>
            </thead>
            <tbody>
              {pools.map((pool, idx) => {
                const apy24h = pool.apy24h?.apy || 0;
                const apy7d = pool.apy7d?.apy || 0;
                const apyColors24h = getAPYColor(apy24h);
                const apyColors7d = getAPYColor(apy7d);
                const liquidityXRP =
                  pool.apy7d?.liquidity || pool.currentLiquidity?.asset1Amount || 0;
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
                            <TokenImage
                              src={`https://s1.xrpl.to/thumb/${pool.asset1.md5 || '84e5efeb89c4eae8f68188982dc290d8'}_32`}
                              alt=""
                              loading="lazy"
                              darkMode={darkMode}
                            />
                            <TokenImage
                              src={`https://s1.xrpl.to/thumb/${pool.asset2.md5}_32`}
                              alt=""
                              loading="lazy"
                              darkMode={darkMode}
                            />
                          </TokenIconPair>
                          {formatPair(pool)}
                        </PoolPair>
                        <PoolAccount darkMode={darkMode}>
                          {pool.ammAccount.substring(0, 20)}...
                        </PoolAccount>
                      </PoolInfo>
                    </Td>
                    <Td darkMode={darkMode} align="right">
                      <span>
                        {pool.tradingFee ? `${(pool.tradingFee / 1000).toFixed(2)}%` : '-'}
                      </span>
                    </Td>
                    <Td darkMode={darkMode} align="right">
                      <span>
                        {currencySymbols[activeFiatCurrency]}
                        {formatCurrency(liquidityFiat)}
                      </span>
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

          {/* Mobile card layout */}
          <div className="md:hidden divide-y divide-white/10">
            {pools.map((pool, idx) => {
              const apy24h = pool.apy24h?.apy || 0;
              const apy7d = pool.apy7d?.apy || 0;
              const apyColors7d = getAPYColor(apy7d);
              const liquidityXRP = pool.apy7d?.liquidity || pool.currentLiquidity?.asset1Amount || 0;
              const liquidityFiat = new Decimal(liquidityXRP).div(exchRate).toNumber();

              return (
                <div
                  key={pool._id}
                  onClick={() => router.push(`/amm/${pool.ammAccount}`)}
                  className={cn('px-3 py-3 cursor-pointer transition-[background-color] duration-150', darkMode ? 'border-white/[0.05] hover:bg-white/[0.04]' : 'border-black/[0.05] hover:bg-black/[0.02]', idx > 0 && 'border-t-[1.5px]')}
                >
                  {/* Row 1: Rank + Pool pair + APY badge */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn('text-[11px] w-5 text-center shrink-0', darkMode ? 'text-white/60' : 'text-[#919EAB]')}>{idx + 1}</span>
                      <TokenIconPair>
                        <TokenImage
                          src={`https://s1.xrpl.to/thumb/${pool.asset1.md5 || '84e5efeb89c4eae8f68188982dc290d8'}_32`}
                          alt="" loading="lazy" darkMode={darkMode}
                        />
                        <TokenImage
                          src={`https://s1.xrpl.to/thumb/${pool.asset2.md5}_32`}
                          alt="" loading="lazy" darkMode={darkMode}
                        />
                      </TokenIconPair>
                      <span className={cn('text-[13px] font-semibold tracking-[-0.01em]', darkMode ? 'text-white/95' : 'text-[#1a1a2e]')}>
                        {formatPair(pool)}
                      </span>
                    </div>
                    <APYBadge {...apyColors7d} className="text-[11px] py-1 px-2 min-w-0">
                      {apy7d > 0 ? `${apy7d.toFixed(1)}%` : '-'}
                    </APYBadge>
                  </div>

                  {/* Row 2: Key stats grid */}
                  <div className="grid grid-cols-4 gap-x-3 gap-y-1.5 ml-7">
                    <div>
                      <div className={cn('text-[9px] uppercase tracking-[0.06em] font-semibold', darkMode ? 'text-white/50' : 'text-black/30')}>Liq</div>
                      <div className={cn('text-[12px] font-medium', darkMode ? 'text-white/85' : 'text-[#1a1a2e]')}>
                        {currencySymbols[activeFiatCurrency]}{formatCurrency(liquidityFiat)}
                      </div>
                    </div>
                    <div>
                      <div className={cn('text-[9px] uppercase tracking-[0.06em] font-semibold', darkMode ? 'text-white/50' : 'text-black/30')}>Vol 7d</div>
                      <div className={cn('text-[12px] font-medium', darkMode ? 'text-white/85' : 'text-[#1a1a2e]')}>{formatCurrency(pool.apy7d?.volume || 0)}</div>
                    </div>
                    <div>
                      <div className={cn('text-[9px] uppercase tracking-[0.06em] font-semibold', darkMode ? 'text-white/50' : 'text-black/30')}>Fees 7d</div>
                      <div className={cn('text-[12px] font-medium', darkMode ? 'text-white/85' : 'text-[#1a1a2e]')}>{formatCurrency(pool.apy7d?.fees || 0)}</div>
                    </div>
                    <div>
                      <div className={cn('text-[9px] uppercase tracking-[0.06em] font-semibold', darkMode ? 'text-white/50' : 'text-black/30')}>Fee</div>
                      <div className={cn('text-[12px] font-medium', darkMode ? 'text-white/85' : 'text-[#1a1a2e]')}>
                        {pool.tradingFee ? `${(pool.tradingFee / 1000).toFixed(2)}%` : '-'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
            <span className={cn('py-[10px] px-[18px] font-medium tracking-[0.02em]', darkMode ? 'text-white/60' : 'text-black/35')}>
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

export async function getServerSideProps({ query }) {
  const BASE_URL = 'https://api.xrpl.to';
  const sortBy = query.sortBy || 'fees';
  const status = query.status || 'active';
  const page = parseInt(query.page) || 0;
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 50));

  try {
    const res = await api.get(`${BASE_URL}/api/amm`, {
      params: { sortBy, status, page, limit, includeAPY: true },
      timeout: 8000
    });

    return {
      props: {
        data: {
          pools: res.data?.pools || [],
          summary: res.data?.summary || null,
          totalPages: res.data?.totalPages || 0
        },
        initialQuery: { sortBy, status, page, limit },
        ogp: {
          canonical: 'https://xrpl.to/amm-pools',
          title: 'AMM Pools | XRPL Automated Market Maker Analytics',
          url: 'https://xrpl.to/amm-pools',
          imgUrl: 'https://xrpl.to/api/og/amm-pools',
          imgType: 'image/png',
          desc: 'Explore XRPL AMM pools with real-time liquidity, volume, fees, and APY analytics',
          keywords: 'AMM pools, XRPL, automated market maker, liquidity pools, DEX, APY'
        }
      }
    };
  } catch (error) {
    console.error('Error fetching AMM pools:', error);
    return {
      props: {
        data: { pools: [], summary: null, totalPages: 0 },
        initialQuery: { sortBy: 'fees', status: 'active', page: 0, limit: 50 },
        ogp: {
          canonical: 'https://xrpl.to/amm-pools',
          title: 'AMM Pools | XRPL Automated Market Maker Analytics',
          url: 'https://xrpl.to/amm-pools',
          imgUrl: 'https://xrpl.to/api/og/amm-pools',
          imgType: 'image/png',
          desc: 'Explore XRPL AMM pools with real-time liquidity, volume, fees, and APY analytics',
          keywords: 'AMM pools, XRPL, automated market maker, liquidity pools, DEX, APY'
        }
      }
    };
  }
}
