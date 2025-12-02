import { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Zap
} from 'lucide-react';

// Context
import { AppContext } from 'src/AppContext';

// Utils
import { cn } from 'src/utils/cn';
import { fNumber, fPercent } from 'src/utils/formatters';

function formatDuration(seconds) {
  if (seconds === 0 || seconds === null || seconds === undefined) return '-';
  const hours = Math.floor(seconds / 3600);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);

  if (months > 0) {
    return `${months}mo`;
  } else if (days > 0) {
    return `${days}d`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    const minutes = Math.floor((seconds % 3600) / 60);
    if (minutes > 0) {
      return `${minutes}min`;
    } else {
      return `<1min`;
    }
  }
}

function formatDate(dateString) {
  if (!dateString) return '-';
  try {
    return format(new Date(dateString), 'MMM d');
  } catch (error) {
    return '-';
  }
}

function formatCompactNumber(num) {
  if (num === 0 || num === null || num === undefined) return '0';
  const absNum = Math.abs(num);
  if (absNum >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (absNum >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  } else if (absNum >= 1) {
    return num.toFixed(0);
  } else {
    return num.toFixed(2);
  }
}

function descendingComparator(a, b, orderBy) {
  let aValue = a[orderBy];
  let bValue = b[orderBy];

  if (orderBy === 'firstTradeDate' || orderBy === 'lastTradeDate') {
    aValue = aValue ? new Date(aValue).getTime() : 0;
    bValue = bValue ? new Date(bValue).getTime() : 0;
  }

  if (bValue < aValue) {
    return -1;
  }
  if (bValue > aValue) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

// Win rate bar component
function WinRateBar({ winRate, isDark }) {
  if (winRate === null || winRate === undefined) return <span className={cn('text-[11px]', isDark ? 'text-white/40' : 'text-gray-400')}>-</span>;

  return (
    <div className="flex items-center gap-1.5">
      <div className={cn('h-1.5 w-12 rounded-full overflow-hidden', isDark ? 'bg-white/10' : 'bg-gray-200')}>
        <div
          className="h-full bg-green-500 rounded-full transition-all"
          style={{ width: `${winRate}%` }}
        />
      </div>
      <span className={cn('text-[10px] font-medium', winRate >= 50 ? 'text-green-500' : 'text-red-400')}>
        {winRate.toFixed(0)}%
      </span>
    </div>
  );
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
  const rowsPerPage = 20;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const tokenMd5 = token?.md5;

  // Check if XRP token page
  const isXRPToken = token?.currency === 'XRP';

  useEffect(() => {
    if (!tokenMd5 && !isXRPToken) {
      setLoading(false);
      return;
    }

    const fetchTopTraders = async () => {
      setLoading(true);
      try {
        let response;
        if (isXRPToken) {
          // XRP page: use cumulative-stats endpoint - valid: volume24h, winRate, buyVolume, sellVolume
          const sortMap = { profit: 'buyVolume', volume: 'volume24h', roi: 'sellVolume', winRate: 'winRate' };
          const sortBy = sortMap[sortType] || 'volume24h';
          response = await axios.get(
            `${BASE_URL}/analytics/cumulative-stats?page=${page}&limit=${rowsPerPage}&sortBy=${sortBy}&sortOrder=desc&includeAMM=false`
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
          response = await axios.get(
            `${BASE_URL}/analytics/top-traders/${tokenMd5}?page=${page}&limit=${rowsPerPage}&sortBy=${sortBy}`
          );
          if (response.status === 200) {
            const tradersArray = Array.isArray(response.data) ? response.data : [];
            setTraders(tradersArray);
            setTotalCount(tradersArray.length < rowsPerPage ? (page - 1) * rowsPerPage + tradersArray.length : page * rowsPerPage + 1);
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
  }, [tokenMd5, isXRPToken, sortType, timePeriod, page]);

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
          <Activity className={cn('w-8 h-8 mx-auto mb-3', isDark ? 'text-white/20' : 'text-gray-300')} />
          <h3 className={cn('text-sm font-medium mb-1', isDark ? 'text-white/60' : 'text-gray-500')}>
            No Traders Found
          </h3>
          <p className={cn('text-[12px]', isDark ? 'text-white/40' : 'text-gray-400')}>
            Trading data will appear here when available
          </p>
        </div>
      ) : (
        <>
          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Time Period - only for time-based sorts */}
            <div className="flex items-center gap-1">
              {SORT_OPTIONS.find(o => o.key === sortType)?.timeBased ? (
                TIME_PERIODS.map((period) => (
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
                ))
              ) : (
                <span className={cn('text-[11px]', isDark ? 'text-white/40' : 'text-gray-400')}>All time</span>
              )}
            </div>

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
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={cn('border-b', isDark ? 'border-white/5' : 'border-gray-100')}>
                  <th className={cn('py-2 pr-2 text-left text-[10px] font-medium uppercase tracking-wider w-8', isDark ? 'text-white/40' : 'text-gray-400')}>#</th>
                  <th className={cn('py-2 px-2 text-left text-[10px] font-medium uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>Trader</th>
                  <th className={cn('py-2 px-2 text-right text-[10px] font-medium uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>P&L</th>
                  <th className={cn('hidden md:table-cell py-2 px-2 text-right text-[10px] font-medium uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>Bought</th>
                  <th className={cn('hidden md:table-cell py-2 px-2 text-right text-[10px] font-medium uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>Sold</th>
                  <th className={cn('hidden lg:table-cell py-2 px-2 text-right text-[10px] font-medium uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>Balance</th>
                  <th className={cn('py-2 px-2 text-right text-[10px] font-medium uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>Trades</th>
                  <th className={cn('hidden lg:table-cell py-2 px-2 text-right text-[10px] font-medium uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>ROI</th>
                  <th className={cn('hidden md:table-cell py-2 px-2 text-center text-[10px] font-medium uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>Win Rate</th>
                  <th className={cn('hidden sm:table-cell py-2 pl-2 text-right text-[10px] font-medium uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>Last Trade</th>
                </tr>
              </thead>
              <tbody>
                {processedTraders.map((trader, index) => {
                  const rank = (page - 1) * rowsPerPage + index + 1;
                  const isTopTrader = rank <= 3;

                  return (
                    <tr
                      key={trader.address + '-' + index}
                      className={cn(
                        'border-b transition-colors',
                        isDark ? 'border-white/[0.03] hover:bg-white/[0.02]' : 'border-gray-50 hover:bg-gray-50/50'
                      )}
                    >
                      {/* Rank */}
                      <td className="py-2.5 pr-2">
                        <span className={cn(
                          'text-[11px] font-medium',
                          isTopTrader
                            ? rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-gray-400' : 'text-amber-600'
                            : isDark ? 'text-white/30' : 'text-gray-400'
                        )}>
                          {rank}
                        </span>
                      </td>

                      {/* Trader Address */}
                      <td className="py-2.5 px-2">
                        <Link
                          href={`/profile/${trader.address}`}
                          className={cn(
                            'text-[12px] font-mono hover:text-primary transition-colors',
                            isDark ? 'text-white/90' : 'text-gray-700'
                          )}
                        >
                          {isMobile
                            ? `${trader.address.slice(0, 4)}...${trader.address.slice(-4)}`
                            : `${trader.address.slice(0, 6)}...${trader.address.slice(-6)}`
                          }
                        </Link>
                      </td>

                      {/* P&L */}
                      <td className="py-2.5 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {trader.profit >= 0 ? (
                            <TrendingUp size={12} className="text-green-500" />
                          ) : (
                            <TrendingDown size={12} className="text-red-500" />
                          )}
                          <span className={cn(
                            'text-[12px] font-medium tabular-nums',
                            trader.profit >= 0 ? 'text-green-500' : 'text-red-500'
                          )}>
                            {trader.profit >= 0 ? '+' : ''}{formatCompactNumber(trader.profit)}
                          </span>
                        </div>
                      </td>

                      {/* Bought */}
                      <td className="hidden md:table-cell py-2.5 px-2 text-right">
                        <span className={cn('text-[11px] tabular-nums text-green-500')}>
                          {formatCompactNumber(trader.buyVolume || 0)}
                        </span>
                      </td>

                      {/* Sold */}
                      <td className="hidden md:table-cell py-2.5 px-2 text-right">
                        <span className={cn('text-[11px] tabular-nums text-red-500')}>
                          {formatCompactNumber(trader.sellVolume || 0)}
                        </span>
                      </td>

                      {/* Balance */}
                      <td className="hidden lg:table-cell py-2.5 px-2 text-right">
                        <span className={cn('text-[11px] tabular-nums', isDark ? 'text-white/70' : 'text-gray-600')}>
                          {formatCompactNumber(trader.actualBalance || 0)}
                        </span>
                      </td>

                      {/* Trades */}
                      <td className="py-2.5 px-2 text-right">
                        <span className={cn('text-[11px] tabular-nums', isDark ? 'text-white/70' : 'text-gray-600')}>
                          {fNumber(trader.totalTrades || trader.trades)}
                        </span>
                      </td>

                      {/* ROI */}
                      <td className="hidden lg:table-cell py-2.5 px-2 text-right">
                        <span className={cn(
                          'text-[11px] font-medium tabular-nums',
                          (trader.roi || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                        )}>
                          {fPercent(trader.roi || 0)}
                        </span>
                      </td>

                      {/* Win Rate */}
                      <td className="hidden md:table-cell py-2.5 px-2">
                        <div className="flex justify-center">
                          <WinRateBar winRate={trader.winRate} isDark={isDark} />
                        </div>
                      </td>

                      {/* Last Trade */}
                      <td className="hidden sm:table-cell py-2.5 pl-2 text-right">
                        <span className={cn('text-[11px]', isDark ? 'text-white/40' : 'text-gray-400')}>
                          {formatDate(trader.lastTradeDate)}
                        </span>
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
                Showing {(page - 1) * rowsPerPage + 1}-{Math.min(page * rowsPerPage, totalCount)} of {totalCount}
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
                  {page} / {totalPages}
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
