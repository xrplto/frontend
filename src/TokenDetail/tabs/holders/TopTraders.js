import { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import Link from 'next/link';
import { Loader2, TrendingUp, TrendingDown, BarChart2, ExternalLink, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

// Context
import { AppContext } from 'src/AppContext';

// Utils
import { cn } from 'src/utils/cn';
import { fNumber, fPercent } from 'src/utils/formatters';

function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.substr(0, n - 1) + ' ...' : str;
}

function formatDuration(seconds) {
  if (seconds === 0 || seconds === null || seconds === undefined) return '-';
  const hours = Math.floor(seconds / 3600);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);

  if (months > 0) {
    return `${months}m`;
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
    return format(new Date(dateString), 'MMM d, yyyy');
  } catch (error) {
    return 'Invalid Date';
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

function ProfitCell({ value, isDark }) {
  const isPositive = value >= 0;
  return (
    <div className="flex items-center justify-end gap-1">
      {isPositive ? (
        <TrendingUp size={14} className="text-green-500" />
      ) : (
        <TrendingDown size={14} className="text-red-500" />
      )}
      <span className={cn('text-[14px] font-normal', isPositive ? 'text-green-500' : 'text-red-500')}>
        {fNumber(Math.abs(value))}
      </span>
    </div>
  );
}

export default function TopTraders({ token }) {
  const BASE_URL = process.env.API_URL;
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [isMobile, setIsMobile] = useState(false);

  const [traders, setTraders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrader, setSelectedTrader] = useState(null);
  const [traderStats, setTraderStats] = useState({});
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('profit24h');
  const [copiedTrader, setCopiedTrader] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchTopTraders = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/analytics/top-traders/${token.md5}?limit=1000`
        );
        if (response.status === 200) {
          const tradersData = response.data.data || response.data;
          const tradersArray = Array.isArray(tradersData) ? tradersData : [];
          setTraders(tradersArray);
        }
      } catch (error) {
        setTraders([]);
      } finally {
        setLoading(false);
      }
    };

    if (token && token.md5) {
      fetchTopTraders();
    } else {
      setLoading(false);
    }
  }, [token, BASE_URL]);

  const sortedTraders = useMemo(() => {
    if (!Array.isArray(traders) || traders.length === 0) {
      return [];
    }

    try {
      const tradersWithDefaults = traders.map((trader) => ({
        address: trader.address || 'Unknown',
        profit24h: trader.profit24h || 0,
        profit7d: trader.profit7d || 0,
        profit1m: trader.profit1m || 0,
        profit2m: trader.profit2m || 0,
        profit3m: trader.profit3m || 0,
        volume24h: trader.volume24h || 0,
        volume7d: trader.volume7d || 0,
        volume1m: trader.volume1m || 0,
        volume2m: trader.volume2m || 0,
        volume3m: trader.volume3m || 0,
        totalVolume: trader.totalVolume || 0,
        tradePercentage: trader.tradePercentage || 0,
        roi: trader.roi || 0,
        profitableTrades: trader.profitableTrades || 0,
        losingTrades: trader.losingTrades || 0,
        trades24h: trader.trades24h || 0,
        trades7d: trader.trades7d || 0,
        trades1m: trader.trades1m || 0,
        trades2m: trader.trades2m || 0,
        trades3m: trader.trades3m || 0,
        totalTrades: trader.totalTrades || 0,
        avgHoldingTime: trader.avgHoldingTime || 0,
        maxProfitTrade: trader.maxProfitTrade || 0,
        maxLossTrade: trader.maxLossTrade || 0,
        firstTradeDate: trader.firstTradeDate || null,
        lastTradeDate: trader.lastTradeDate || null,
        AMM: trader.AMM || false,
        ...trader
      }));
      return [...tradersWithDefaults].sort(getComparator(order, orderBy));
    } catch (error) {
      return traders.map((trader) => ({
        address: trader.address || 'Unknown',
        profit24h: trader.profit24h || 0,
        profit7d: trader.profit7d || 0,
        totalVolume: trader.totalVolume || 0,
        roi: trader.roi || 0,
        totalTrades: trader.totalTrades || 0,
        lastTradeDate: trader.lastTradeDate || null,
        AMM: trader.AMM || false,
        ...trader
      }));
    }
  }, [traders, order, orderBy]);

  const handleOpenStats = (trader) => {
    setSelectedTrader(trader);
    setTraderStats((prev) => ({
      ...prev,
      [trader.address]: trader
    }));
  };

  const handleCloseStats = () => {
    setSelectedTrader(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const paginatedTraders = sortedTraders.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const totalPages = Math.ceil(sortedTraders.length / rowsPerPage);

  return (
    <div className="space-y-2">
      {sortedTraders.length === 0 ? (
        <div className={cn(
          'text-center py-12 rounded-xl border-[1.5px] border-dashed',
          isDark ? 'border-white/20 bg-white/[0.02]' : 'border-gray-300 bg-gray-50'
        )}>
          <h3 className={cn('text-base font-medium mb-2', isDark ? 'text-white/60' : 'text-gray-500')}>
            No Top Traders Data
          </h3>
          <p className={cn('text-sm', isDark ? 'text-white/40' : 'text-gray-400')}>
            Trading data will appear here when available
          </p>
        </div>
      ) : (
        <>
          {/* Table Headers */}
          <div className={cn(
            'hidden md:grid grid-cols-[0.5fr_2fr_1.5fr_1.5fr_1.5fr_1.5fr_1fr_1fr_1.5fr_1fr] gap-4 p-4 rounded-t-xl border-[1.5px]',
            isDark ? 'border-white/10' : 'border-gray-200'
          )}>
            <span className={cn('text-[12px] font-medium uppercase tracking-wide', isDark ? 'text-white/60' : 'text-gray-500')}>#</span>
            <span className={cn('text-[12px] font-medium uppercase tracking-wide', isDark ? 'text-white/60' : 'text-gray-500')}>Trader</span>
            <span className={cn('text-[12px] font-medium uppercase tracking-wide', isDark ? 'text-white/60' : 'text-gray-500')}>P&L (24h)</span>
            <span className={cn('text-[12px] font-medium uppercase tracking-wide', isDark ? 'text-white/60' : 'text-gray-500')}>P&L (7d)</span>
            <span className={cn('text-[12px] font-medium uppercase tracking-wide', isDark ? 'text-white/60' : 'text-gray-500')}>Vol (24h)</span>
            <span className={cn('text-[12px] font-medium uppercase tracking-wide', isDark ? 'text-white/60' : 'text-gray-500')}>Total Vol</span>
            <span className={cn('text-[12px] font-medium uppercase tracking-wide', isDark ? 'text-white/60' : 'text-gray-500')}>Trades</span>
            <span className={cn('text-[12px] font-medium uppercase tracking-wide', isDark ? 'text-white/60' : 'text-gray-500')}>ROI</span>
            <span className={cn('text-[12px] font-medium uppercase tracking-wide', isDark ? 'text-white/60' : 'text-gray-500')}>Last Trade</span>
            <span></span>
          </div>

          <div className="space-y-1">
            {paginatedTraders.map((trader, index) => {
              const volumePercentage = Math.min(
                100,
                Math.max(5, (trader.totalVolume / 1000000) * 100)
              );

              return (
                <div
                  key={trader.address + '-' + index}
                  className={cn(
                    'relative rounded-xl border-[1.5px] overflow-hidden transition-all hover:-translate-y-0.5',
                    isDark
                      ? 'border-white/10 hover:border-primary/30'
                      : 'border-gray-200 hover:border-primary/30'
                  )}
                >
                  {/* Volume Indicator */}
                  <div
                    className={cn(
                      'absolute left-0 top-0 h-full rounded-xl transition-all',
                      isDark ? 'bg-primary/5' : 'bg-primary/3'
                    )}
                    style={{ width: `${volumePercentage}%` }}
                  />

                  <div className="relative p-3">
                    <div className={cn(
                      'grid gap-3 items-center',
                      'grid-cols-1 sm:grid-cols-2',
                      'md:grid-cols-[0.5fr_2fr_1.5fr_1.5fr_1.5fr_1.5fr_1fr_1fr_1.5fr_1fr]'
                    )}>
                      {/* Rank */}
                      <div className="hidden md:block">
                        <span className={cn('text-[14px] font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                          {page * rowsPerPage + index + 1}
                        </span>
                      </div>

                      {/* Trader Address */}
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/profile/${trader.address}`}
                          className="text-[13px] font-normal text-primary hover:underline"
                        >
                          {`${trader.address.slice(0, 4)}...${trader.address.slice(-4)}`}
                        </Link>
                        {trader.AMM && (
                          <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] text-purple-500">
                            AMM
                          </span>
                        )}
                      </div>

                      {/* P&L 24h */}
                      <div className="text-left md:text-right">
                        <span className={cn('text-[11px] block md:hidden', isDark ? 'text-white/60' : 'text-gray-500')}>
                          P&L (24h)
                        </span>
                        <ProfitCell value={trader.profit24h} isDark={isDark} />
                      </div>

                      {/* P&L 7d */}
                      <div className="hidden md:block text-right">
                        <ProfitCell value={trader.profit7d} isDark={isDark} />
                      </div>

                      {/* Volume 24h */}
                      <div className="text-left md:text-right">
                        <span className={cn('text-[11px] block md:hidden', isDark ? 'text-white/60' : 'text-gray-500')}>
                          Vol (24h)
                        </span>
                        <span className={cn('text-[14px] font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                          {fNumber(trader.volume24h)}
                        </span>
                      </div>

                      {/* Total Volume */}
                      <div className="hidden md:block text-right">
                        <span className={cn('text-[14px] font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                          {fNumber(trader.totalVolume)}
                        </span>
                      </div>

                      {/* Trades */}
                      <div className="text-left md:text-right">
                        <span className={cn('text-[11px] block md:hidden', isDark ? 'text-white/60' : 'text-gray-500')}>
                          Trades
                        </span>
                        <span className={cn('text-[14px] font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                          {fNumber(trader.totalTrades)}
                        </span>
                      </div>

                      {/* ROI */}
                      <div className="flex items-center gap-1 justify-start md:justify-end">
                        {trader.roi >= 0 ? (
                          <TrendingUp size={14} className="text-green-500" />
                        ) : (
                          <TrendingDown size={14} className="text-red-500" />
                        )}
                        <span className={cn('text-[14px] font-normal', trader.roi >= 0 ? 'text-green-500' : 'text-red-500')}>
                          {fPercent(trader.roi)}
                        </span>
                      </div>

                      {/* Last Trade */}
                      <div className="text-left md:text-right">
                        <span className={cn('text-[11px] block md:hidden', isDark ? 'text-white/60' : 'text-gray-500')}>
                          Last Trade
                        </span>
                        <span className={cn('text-[13px] font-normal', isDark ? 'text-white/60' : 'text-gray-500')}>
                          {formatDate(trader.lastTradeDate)}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleOpenStats(trader)}
                          className={cn(
                            'p-1 rounded-lg transition-colors',
                            isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                          )}
                          title="View Trader Statistics"
                        >
                          <BarChart2 size={16} className="text-primary" />
                        </button>
                        <Link
                          href={`/profile/${trader.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            'p-1 rounded-lg transition-colors',
                            isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                          )}
                          title="View Profile"
                        >
                          <ExternalLink size={16} className="text-primary" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage(0)}
                disabled={page === 0}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-xl border-[1.5px] transition-colors disabled:opacity-30',
                  isDark ? 'border-white/10 hover:border-primary hover:bg-primary/5' : 'border-gray-200 hover:border-primary hover:bg-primary/5'
                )}
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-xl border-[1.5px] transition-colors disabled:opacity-30',
                  isDark ? 'border-white/10 hover:border-primary hover:bg-primary/5' : 'border-gray-200 hover:border-primary hover:bg-primary/5'
                )}
              >
                <ChevronLeft size={16} />
              </button>
              <span className={cn('px-4 text-[13px]', isDark ? 'text-white/60' : 'text-gray-600')}>
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages - 1}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-xl border-[1.5px] transition-colors disabled:opacity-30',
                  isDark ? 'border-white/10 hover:border-primary hover:bg-primary/5' : 'border-gray-200 hover:border-primary hover:bg-primary/5'
                )}
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => setPage(totalPages - 1)}
                disabled={page === totalPages - 1}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-xl border-[1.5px] transition-colors disabled:opacity-30',
                  isDark ? 'border-white/10 hover:border-primary hover:bg-primary/5' : 'border-gray-200 hover:border-primary hover:bg-primary/5'
                )}
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
