import { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, TrendingUp, TrendingDown, Activity, Target, Zap, Search, X } from 'lucide-react';
import { AppContext } from 'src/AppContext';
import { cn } from 'src/utils/cn';
import { fNumber } from 'src/utils/formatters';

function formatCompactNumber(num) {
  if (num === 0 || num === null || num === undefined) return '0';
  const absNum = Math.abs(num);
  if (absNum >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (absNum >= 1000) return (num / 1000).toFixed(1) + 'K';
  if (absNum >= 1) return num.toFixed(0);
  return num.toFixed(2);
}

// Time period options
const TIME_PERIODS = [
  { key: '24h', label: '24H' },
  { key: '7d', label: '7D' },
  { key: '1m', label: '1M' },
  { key: '3m', label: '3M' }
];

// Sort options - grouped by category
const SORT_OPTIONS = [
  { key: 'profit', label: 'Profit', icon: TrendingUp, timeBased: true },
  { key: 'volume', label: 'Volume', icon: Activity, timeBased: true },
  { key: 'roi', label: 'ROI', icon: Target, timeBased: false },
  { key: 'winRate', label: 'Win%', icon: Zap, timeBased: false }
];

export default function TopTraders({ token }) {
  const BASE_URL = 'https://api.xrpl.to/api';
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [isMobile, setIsMobile] = useState(false);

  const [traders, setTraders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortType, setSortType] = useState('profit');
  const [timePeriod, setTimePeriod] = useState('7d');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [mobileChecked, setMobileChecked] = useState(false);
  const [searchAddress, setSearchAddress] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const rowsPerPage = isMobile ? 10 : 20;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchAddress);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchAddress]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    setMobileChecked(true);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const tokenMd5 = token?.md5;

  // Check if XRP token page
  const isXRPToken = token?.currency === 'XRP';

  useEffect(() => {
    if (!mobileChecked) return;
    if (!tokenMd5 && !isXRPToken) {
      setLoading(false);
      return;
    }

    const limit = isMobile ? 10 : 20;
    const fetchTopTraders = async () => {
      setLoading(true);
      try {
        let response;
        if (isXRPToken) {
          // XRP page: use cumulative-stats endpoint - valid: volume24h, winRate, buyVolume, sellVolume
          const sortMap = { profit: 'buyVolume', volume: 'volume24h', roi: 'sellVolume', winRate: 'winRate' };
          const sortBy = sortMap[sortType] || 'volume24h';
          response = await axios.get(
            `${BASE_URL}/analytics/cumulative-stats?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=desc&includeAMM=false`
          );
          if (response.status === 200) {
            const tradersArray = Array.isArray(response.data.data) ? response.data.data : [];
            setTraders(tradersArray);
            setTotalCount(response.data.pagination?.total || tradersArray.length);
          }
        } else {
          // Token-specific traders
          const sortOption = SORT_OPTIONS.find(o => o.key === sortType);
          const sortBy = sortOption?.timeBased ? `${sortType}${timePeriod}` : sortType;
          const addressParam = debouncedSearch ? `&address=${encodeURIComponent(debouncedSearch)}` : '';
          response = await axios.get(
            `${BASE_URL}/analytics/top-traders/${tokenMd5}?page=${page}&limit=${limit}&sortBy=${sortBy}${addressParam}`
          );
          if (response.status === 200) {
            // API returns { traders, total, page, limit, totalPages }
            const tradersArray = Array.isArray(response.data.traders) ? response.data.traders : [];
            setTraders(tradersArray);
            setTotalCount(response.data.total || tradersArray.length);
          }
        }
      } catch (error) {
        setTraders([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchTopTraders();
  }, [tokenMd5, isXRPToken, sortType, timePeriod, page, isMobile, mobileChecked, debouncedSearch]);

  const processedTraders = useMemo(() => {
    if (!Array.isArray(traders) || traders.length === 0) return [];
    return traders.map((trader) => ({
      ...trader,
      address: trader.address || 'Unknown',
      profit: trader.totalProfit || trader.profit || 0,
      volume: trader.totalVolume || 0,
      trades: trader.totalTrades || 0
    }));
  }, [traders]);

  const handleSortChange = (newSortType) => {
    if (sortType !== newSortType) {
      setSortType(newSortType);
      setPage(1);
    }
  };

  const handlePeriodChange = (newPeriod) => {
    if (timePeriod !== newPeriod) {
      setTimePeriod(newPeriod);
      setPage(1);
    }
  };

  const totalPages = Math.ceil(totalCount / rowsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {processedTraders.length === 0 ? (
        <div className={cn(
          'text-center py-12 rounded-xl border-[1.5px] border-dashed',
          isDark ? 'border-white/20 bg-white/[0.02]' : 'border-gray-300 bg-gray-50'
        )}>
          {debouncedSearch ? (
            <>
              <Search className={cn('w-8 h-8 mx-auto mb-3', isDark ? 'text-white/20' : 'text-gray-300')} />
              <h3 className={cn('text-sm font-medium mb-1', isDark ? 'text-white/60' : 'text-gray-500')}>
                No Results
              </h3>
              <p className={cn('text-[12px]', isDark ? 'text-white/40' : 'text-gray-400')}>
                No traders found for "{debouncedSearch}"
              </p>
            </>
          ) : (
            <>
              <Activity className={cn('w-8 h-8 mx-auto mb-3', isDark ? 'text-white/20' : 'text-gray-300')} />
              <h3 className={cn('text-sm font-medium mb-1', isDark ? 'text-white/60' : 'text-gray-500')}>
                No Traders Found
              </h3>
              <p className={cn('text-[12px]', isDark ? 'text-white/40' : 'text-gray-400')}>
                Trading data will appear here when available
              </p>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Time Period - only for time-based sorts */}
            {SORT_OPTIONS.find(o => o.key === sortType)?.timeBased && (
              <div className="flex items-center gap-1">
                {TIME_PERIODS.map((period) => (
                  <button
                    key={period.key}
                    onClick={() => handlePeriodChange(period.key)}
                    className={cn(
                      'px-2.5 py-1 text-[11px] font-medium rounded-md transition-all',
                      timePeriod === period.key
                        ? 'bg-primary text-white'
                        : isDark
                          ? 'text-white/60 hover:text-white hover:bg-white/5'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            )}

            {/* Right side: Sort Options + Search */}
            <div className="flex items-center gap-3 ml-auto">
              {/* Sort Options */}
              <div className="flex items-center gap-1">
                {SORT_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isActive = sortType === option.key;
                  return (
                    <button
                      key={option.key}
                      onClick={() => handleSortChange(option.key)}
                      className={cn(
                        'flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md transition-all',
                        isActive
                          ? isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-800'
                          : isDark
                            ? 'text-white/50 hover:text-white/80 hover:bg-white/5'
                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      <Icon size={12} />
                      <span className="hidden sm:inline">{option.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Search by address */}
              {!isXRPToken && (
                <div className="relative">
                  <Search size={14} className={cn('absolute left-2.5 top-1/2 -translate-y-1/2', isDark ? 'text-white/40' : 'text-gray-400')} />
                  <input
                    type="text"
                    placeholder="Search address..."
                    value={searchAddress}
                    onChange={(e) => setSearchAddress(e.target.value)}
                    className={cn(
                      'h-7 w-36 rounded-md border pl-8 pr-7 text-[12px] outline-none transition-colors',
                      isDark
                        ? 'border-white/10 bg-white/5 text-white placeholder-white/40 focus:border-primary'
                        : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:border-primary'
                    )}
                  />
                  {searchAddress && (
                    <button
                      onClick={() => setSearchAddress('')}
                      className={cn('absolute right-2 top-1/2 -translate-y-1/2', isDark ? 'text-white/40 hover:text-white' : 'text-gray-400 hover:text-gray-600')}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={cn('border-b', isDark ? 'border-white/5' : 'border-gray-100')}>
                  <th className={cn('py-2 pr-2 text-left text-[10px] font-medium uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>#</th>
                  <th className={cn('py-2 px-2 text-left text-[10px] font-medium uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>Trader</th>
                  <th className={cn('py-2 px-2 text-right text-[10px] font-medium uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>PNL</th>
                  {!isMobile && (
                    <>
                      <th className={cn('py-2 px-2 text-right text-[10px] font-medium uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>ROI</th>
                      <th className={cn('py-2 px-2 text-right text-[10px] font-medium uppercase tracking-wider text-green-500/70')}>Bought</th>
                      <th className={cn('py-2 px-2 text-right text-[10px] font-medium uppercase tracking-wider text-red-500/70')}>Sold</th>
                      <th className={cn('py-2 px-2 text-right text-[10px] font-medium uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>Volume</th>
                    </>
                  )}
                  <th className={cn('py-2 pl-2 text-right text-[10px] font-medium uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>Trades</th>
                </tr>
              </thead>
              <tbody>
                {processedTraders.map((trader, index) => {
                  const rank = (page - 1) * rowsPerPage + index + 1;
                  const isTopTrader = rank <= 3;
                  const pnl = trader.totalProfit ?? trader.profit ?? 0;
                  const roi = trader.roi ?? 0;
                  const bought = trader.buyVolume ?? 0;
                  const sold = trader.sellVolume ?? 0;
                  const volume = trader.totalVolume ?? 0;
                  const trades = trader.totalTrades ?? trader.trades ?? 0;
                  return (
                    <tr key={trader.address + '-' + index} className={cn('border-b', isDark ? 'border-white/5 hover:bg-white/[0.02]' : 'border-gray-100 hover:bg-gray-50')}>
                      <td className="py-2.5 pr-2">
                        <span className={cn(
                          'text-[11px] font-medium',
                          isTopTrader ? rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-gray-400' : 'text-amber-600' : isDark ? 'text-white/30' : 'text-gray-400'
                        )}>{rank}</span>
                      </td>
                      <td className="py-2.5 px-2">
                        <Link href={`/address/${trader.address}`} className={cn('text-[12px] font-mono hover:text-primary transition-colors', isDark ? 'text-white/80' : 'text-gray-700')}>
                          {`${trader.address.slice(0, isMobile ? 4 : 6)}...${trader.address.slice(isMobile ? -4 : -6)}`}
                        </Link>
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {pnl >= 0 ? <TrendingUp size={10} className="text-green-500" /> : <TrendingDown size={10} className="text-red-500" />}
                          <span className={cn('text-[12px] font-medium tabular-nums', pnl >= 0 ? 'text-green-500' : 'text-red-500')}>
                            {pnl >= 0 ? '+' : ''}{formatCompactNumber(pnl)}
                          </span>
                        </div>
                      </td>
                      {!isMobile && (
                        <>
                          <td className="py-2.5 px-2 text-right">
                            <span className={cn('text-[12px] tabular-nums', roi >= 0 ? 'text-green-500' : 'text-red-500')}>
                              {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-right">
                            <span className="text-[12px] tabular-nums text-green-500">{formatCompactNumber(bought)}</span>
                          </td>
                          <td className="py-2.5 px-2 text-right">
                            <span className="text-[12px] tabular-nums text-red-500">{formatCompactNumber(sold)}</span>
                          </td>
                          <td className={cn('py-2.5 px-2 text-right text-[12px] tabular-nums', isDark ? 'text-white/70' : 'text-gray-600')}>
                            {formatCompactNumber(volume)}
                          </td>
                        </>
                      )}
                      <td className={cn('py-2.5 pl-2 text-right text-[12px] tabular-nums', isDark ? 'text-white/70' : 'text-gray-600')}>
                        {fNumber(trades)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className={cn('text-[11px]', isDark ? 'text-white/40' : 'text-gray-400')}>
                Showing {(page - 1) * rowsPerPage + 1}-{Math.min(page * rowsPerPage, totalCount)} of {totalCount.toLocaleString()}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-md border transition-colors disabled:opacity-30',
                    isDark ? 'border-white/[0.08] hover:border-primary' : 'border-gray-200 hover:border-primary'
                  )}
                >
                  <ChevronsLeft size={14} />
                </button>
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-md border transition-colors disabled:opacity-30',
                    isDark ? 'border-white/[0.08] hover:border-primary' : 'border-gray-200 hover:border-primary'
                  )}
                >
                  <ChevronLeft size={14} />
                </button>
                <span className={cn('px-3 text-[11px] font-medium', isDark ? 'text-white/70' : 'text-gray-600')}>
                  {page} / {totalPages.toLocaleString()}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-md border transition-colors disabled:opacity-30',
                    isDark ? 'border-white/[0.08] hover:border-primary' : 'border-gray-200 hover:border-primary'
                  )}
                >
                  <ChevronRight size={14} />
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-md border transition-colors disabled:opacity-30',
                    isDark ? 'border-white/[0.08] hover:border-primary' : 'border-gray-200 hover:border-primary'
                  )}
                >
                  <ChevronsRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
