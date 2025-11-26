import { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import Link from 'next/link';
import { Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

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

export default function TopTraders({ token }) {
  const BASE_URL = 'https://api.xrpl.to/api';
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [isMobile, setIsMobile] = useState(false);

  const [traders, setTraders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('profit24h');
  const [page, setPage] = useState(0);
  const rowsPerPage = 20;

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
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className={cn('py-2 pr-3 text-left text-[10px] font-medium uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>#</th>
                  <th className={cn('py-2 px-3 text-left text-[10px] font-medium uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>Trader</th>
                  <th className={cn('py-2 px-3 text-right text-[10px] font-medium uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>P&L 24h</th>
                  <th className={cn('hidden md:table-cell py-2 px-3 text-right text-[10px] font-medium uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>P&L 7d</th>
                  <th className={cn('hidden lg:table-cell py-2 px-3 text-right text-[10px] font-medium uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>Volume</th>
                  <th className={cn('py-2 px-3 text-right text-[10px] font-medium uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>Trades</th>
                  <th className={cn('py-2 px-3 text-right text-[10px] font-medium uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>ROI</th>
                  <th className={cn('hidden md:table-cell py-2 pl-3 text-right text-[10px] font-medium uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>Last Trade</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTraders.map((trader, index) => (
                  <tr
                    key={trader.address + '-' + index}
                    className={cn(
                      isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50'
                    )}
                  >
                    <td className="py-2.5 pr-3">
                      <span className={cn('text-[12px]', isDark ? 'text-white/40' : 'text-gray-400')}>
                        {page * rowsPerPage + index + 1}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <Link href={`/profile/${trader.address}`} className={cn('text-[12px] font-mono hover:text-primary', isDark ? 'text-primary' : 'text-primary')}>
                        {`${trader.address.slice(0, 6)}...${trader.address.slice(-6)}`}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={cn('text-[12px] font-medium', trader.profit24h >= 0 ? 'text-green-500' : 'text-red-500')}>
                        {trader.profit24h >= 0 ? '▲' : '▼'} {fNumber(Math.abs(trader.profit24h))}
                      </span>
                    </td>
                    <td className="hidden md:table-cell py-2.5 px-3 text-right">
                      <span className={cn('text-[12px] font-medium', trader.profit7d >= 0 ? 'text-green-500' : 'text-red-500')}>
                        {trader.profit7d >= 0 ? '▲' : '▼'} {fNumber(Math.abs(trader.profit7d))}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell py-2.5 px-3 text-right">
                      <span className={cn('text-[12px]', isDark ? 'text-white/80' : 'text-gray-700')}>
                        {fNumber(trader.totalVolume)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={cn('text-[12px]', isDark ? 'text-white/80' : 'text-gray-700')}>
                        {fNumber(trader.totalTrades)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={cn('text-[12px] font-medium', trader.roi >= 0 ? 'text-green-500' : 'text-red-500')}>
                        {fPercent(trader.roi)}
                      </span>
                    </td>
                    <td className="hidden md:table-cell py-2.5 pl-3 text-right">
                      <span className={cn('text-[12px]', isDark ? 'text-white/50' : 'text-gray-500')}>
                        {formatDate(trader.lastTradeDate)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 pt-3">
              <button
                onClick={() => setPage(0)}
                disabled={page === 0}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-md border transition-colors disabled:opacity-30',
                  isDark ? 'border-white/10 hover:border-primary' : 'border-gray-200 hover:border-primary'
                )}
              >
                <ChevronsLeft size={14} />
              </button>
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-md border transition-colors disabled:opacity-30',
                  isDark ? 'border-white/10 hover:border-primary' : 'border-gray-200 hover:border-primary'
                )}
              >
                <ChevronLeft size={14} />
              </button>
              <span className={cn('px-3 text-[11px]', isDark ? 'text-white/50' : 'text-gray-500')}>
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages - 1}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-md border transition-colors disabled:opacity-30',
                  isDark ? 'border-white/10 hover:border-primary' : 'border-gray-200 hover:border-primary'
                )}
              >
                <ChevronRight size={14} />
              </button>
              <button
                onClick={() => setPage(totalPages - 1)}
                disabled={page === totalPages - 1}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-md border transition-colors disabled:opacity-30',
                  isDark ? 'border-white/10 hover:border-primary' : 'border-gray-200 hover:border-primary'
                )}
              >
                <ChevronsRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
