import { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Loader2, Activity, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { AppContext } from 'src/AppContext';
import { cn } from 'src/utils/cn';
import { fNumber, formatDistanceToNowStrict } from 'src/utils/formatters';

function formatCompactNumber(num) {
  if (num === 0 || num === null || num === undefined) return '0';
  const absNum = Math.abs(num);
  if (absNum >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (absNum >= 1000) return (num / 1000).toFixed(1) + 'K';
  if (absNum >= 1) return num.toFixed(0);
  return num.toFixed(2);
}

// Time period options - maps to API interval param
const TIME_PERIODS = [
  { key: '24h', label: '24H' },
  { key: '7d', label: '7D' },
  { key: '30d', label: '30D' },
  { key: 'all', label: 'All' }
];

// Sort options - maps to API sortBy param
const SORT_OPTIONS = [
  { key: 'volume', label: 'Volume' },
  { key: 'trades', label: 'Trades' },
  { key: 'pnl', label: 'PNL' },
  { key: 'roi', label: 'ROI' }
];

export default function TopTraders({ token }) {
  const BASE_URL = 'https://api.xrpl.to/v1';
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  const BearIcon = () => (
    <div className="relative w-14 h-14 mx-auto mb-4">
      <div className={cn('absolute -top-1 left-0 w-5 h-5 rounded-full', isDark ? 'bg-white/15' : 'bg-gray-300')}>
        <div className={cn('absolute top-1 left-1 w-3 h-3 rounded-full', isDark ? 'bg-white/10' : 'bg-gray-200')} />
      </div>
      <div className={cn('absolute -top-1 right-0 w-5 h-5 rounded-full', isDark ? 'bg-white/15' : 'bg-gray-300')}>
        <div className={cn('absolute top-1 right-1 w-3 h-3 rounded-full', isDark ? 'bg-white/10' : 'bg-gray-200')} />
      </div>
      <div className={cn('absolute top-2 left-1/2 -translate-x-1/2 w-12 h-11 rounded-full', isDark ? 'bg-white/15' : 'bg-gray-300')}>
        <div className="absolute inset-0 rounded-full overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={cn('h-[2px] w-full', isDark ? 'bg-white/15' : 'bg-gray-200')} style={{ marginTop: i * 3 + 2, transform: `translateX(${i % 2 === 0 ? '1px' : '-1px'})` }} />
          ))}
        </div>
        <div className="absolute top-3 left-2 w-3 h-3 flex items-center justify-center">
          <div className={cn('absolute w-2.5 h-[2px] rotate-45', isDark ? 'bg-white/40' : 'bg-gray-500')} />
          <div className={cn('absolute w-2.5 h-[2px] -rotate-45', isDark ? 'bg-white/40' : 'bg-gray-500')} />
        </div>
        <div className="absolute top-3 right-2 w-3 h-3 flex items-center justify-center">
          <div className={cn('absolute w-2.5 h-[2px] rotate-45', isDark ? 'bg-white/40' : 'bg-gray-500')} />
          <div className={cn('absolute w-2.5 h-[2px] -rotate-45', isDark ? 'bg-white/40' : 'bg-gray-500')} />
        </div>
        <div className={cn('absolute bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-4 rounded-full', isDark ? 'bg-white/10' : 'bg-gray-200')}>
          <div className={cn('absolute top-0.5 left-1/2 -translate-x-1/2 w-2.5 h-2 rounded-full', isDark ? 'bg-white/25' : 'bg-gray-400')} />
        </div>
      </div>
    </div>
  );

  const [isMobile, setIsMobile] = useState(false);

  const [traders, setTraders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortType, setSortType] = useState('volume');
  const [timePeriod, setTimePeriod] = useState('7d');
  const [mobileChecked, setMobileChecked] = useState(false);
  const [searchAddress, setSearchAddress] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchAddress), 300);
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

    const fetchLimit = 20;
    const fetchTopTraders = async () => {
      setLoading(true);
      try {
        let response;
        if (isXRPToken) {
          // XRP page: use cumulative-stats endpoint - valid: volume24h, winRate, buyVolume, sellVolume
          const sortMap = {
            profit: 'buyVolume',
            volume: 'volume24h',
            roi: 'sellVolume',
            winRate: 'winRate'
          };
          const sortBy = sortMap[sortType] || 'volume24h';
          response = await axios.get(
            `${BASE_URL}/analytics/cumulative-stats?limit=${fetchLimit}&sortBy=${sortBy}&sortOrder=desc&includeAMM=false`
          );
          if (response.status === 200) {
            const tradersArray = Array.isArray(response.data.data) ? response.data.data : [];
            setTraders(tradersArray);
            setTotalCount(tradersArray.length);
          }
        } else {
          // Token-specific traders - sortBy: volume, trades, pnl, roi, bought, sold, wash
          const sortBy = sortType || 'volume';
          const interval = timePeriod || '7d';
          const searchParam = debouncedSearch
            ? `&search=${encodeURIComponent(debouncedSearch)}`
            : '';
          response = await axios.get(
            `${BASE_URL}/traders/token-traders/${tokenMd5}?interval=${interval}&limit=${fetchLimit}&offset=${offset}&sortBy=${sortBy}${searchParam}`
          );
          if (response.status === 200) {
            const tradersArray = Array.isArray(response.data.traders) ? response.data.traders : [];
            setTraders(tradersArray);
            setTotalCount(response.data.count || 0);
          }
        }
      } catch (error) {
        setTraders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopTraders();
  }, [
    tokenMd5,
    isXRPToken,
    sortType,
    timePeriod,
    isMobile,
    mobileChecked,
    debouncedSearch,
    offset
  ]);

  const processedTraders = useMemo(() => {
    if (!Array.isArray(traders) || traders.length === 0) return [];
    return traders.map((trader) => ({
      ...trader,
      address: trader.address || 'Unknown',
      profit: trader.profit || 0,
      volume: trader.volume || 0,
      trades: trader.trades || 0,
      roi: trader.roi || 0,
      xrpBought: trader.xrpBought || 0,
      xrpSold: trader.xrpSold || 0,
      avgBuyPrice: trader.avgBuyPrice || 0,
      avgSellPrice: trader.avgSellPrice || 0
    }));
  }, [traders]);

  const limit = 20;

  const handleSortChange = (newSortType) => {
    if (sortType !== newSortType) {
      setSortType(newSortType);
      setOffset(0);
    }
  };

  const handlePeriodChange = (newPeriod) => {
    if (timePeriod !== newPeriod) {
      setTimePeriod(newPeriod);
      setOffset(0);
    }
  };

  // Reset offset when search changes
  useEffect(() => {
    setOffset(0);
  }, [debouncedSearch]);

  const currentPage = Math.floor(offset / limit) + 1;
  const hasPrev = offset > 0;
  // API count returns page count, not total - detect hasNext by checking if we got a full page
  const hasNext = processedTraders.length === limit;

  const handlePrevPage = () => {
    if (hasPrev) {
      setOffset(Math.max(0, offset - limit));
    }
  };

  const handleNextPage = () => {
    if (hasNext) {
      setOffset(offset + limit);
    }
  };

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
        <div className={cn('text-center py-12 px-8 rounded-xl border-[1.5px] border-dashed', isDark ? 'border-white/20 bg-white/[0.02]' : 'border-gray-300 bg-gray-50')}>
          <BearIcon />
          <p className={cn('text-xs font-medium tracking-widest mb-1', isDark ? 'text-white/80' : 'text-gray-600')}>
            NO TRADERS
          </p>
          <p className={cn('text-[11px]', isDark ? 'text-white/30' : 'text-gray-400')}>
            Trading data will appear here when available
          </p>
        </div>
      ) : (
        <>
          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Time Period */}
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

            {/* Right side: Sort Options + Search */}
            <div className="flex items-center gap-3 ml-auto">
              {/* Sort Options */}
              <div className="flex items-center gap-1">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => handleSortChange(option.key)}
                    className={cn(
                      'px-2 py-1 text-[11px] font-medium rounded-md transition-all',
                      sortType === option.key
                        ? isDark
                          ? 'bg-white/10 text-white'
                          : 'bg-gray-100 text-gray-800'
                        : isDark
                          ? 'text-white/50 hover:text-white/80 hover:bg-white/5'
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {/* Search */}
              {!isXRPToken && (
                <div className="relative">
                  <Search
                    size={14}
                    className={cn(
                      'absolute left-2.5 top-1/2 -translate-y-1/2',
                      isDark ? 'text-white/40' : 'text-gray-400'
                    )}
                  />
                  <input
                    type="text"
                    placeholder="Search address..."
                    value={searchAddress}
                    onChange={(e) => setSearchAddress(e.target.value)}
                    className={cn(
                      'h-7 w-40 rounded-md border pl-8 pr-7 text-[12px] outline-none transition-colors',
                      isDark
                        ? 'border-white/10 bg-white/5 text-white placeholder-white/40 focus:border-primary'
                        : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:border-primary'
                    )}
                  />
                  {searchAddress && (
                    <button
                      onClick={() => setSearchAddress('')}
                      className={cn(
                        'absolute right-2 top-1/2 -translate-y-1/2',
                        isDark
                          ? 'text-white/40 hover:text-white'
                          : 'text-gray-400 hover:text-gray-600'
                      )}
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
                  <th
                    className={cn(
                      'py-2 pr-2 text-left text-[10px] font-medium uppercase tracking-wider',
                      isDark ? 'text-white/40' : 'text-gray-400'
                    )}
                  >
                    #
                  </th>
                  <th
                    className={cn(
                      'py-2 px-2 text-left text-[10px] font-medium uppercase tracking-wider',
                      isDark ? 'text-white/40' : 'text-gray-400'
                    )}
                  >
                    Trader
                  </th>
                  {!isMobile && (
                    <>
                      <th
                        className={cn(
                          'py-2 px-2 text-right text-[10px] font-medium uppercase tracking-wider',
                          isDark ? 'text-white/40' : 'text-gray-400'
                        )}
                      >
                        Volume
                      </th>
                      <th
                        className={cn(
                          'py-2 px-2 text-right text-[10px] font-medium uppercase tracking-wider',
                          isDark ? 'text-white/40' : 'text-gray-400'
                        )}
                      >
                        Trades
                      </th>
                      <th
                        className={cn(
                          'py-2 px-2 text-right text-[10px] font-medium uppercase tracking-wider text-green-500/70'
                        )}
                      >
                        Bought (XRP)
                      </th>
                      <th
                        className={cn(
                          'py-2 px-2 text-right text-[10px] font-medium uppercase tracking-wider text-red-500/70'
                        )}
                      >
                        Sold (XRP)
                      </th>
                    </>
                  )}
                  <th
                    className={cn(
                      'py-2 px-2 text-right text-[10px] font-medium uppercase tracking-wider',
                      isDark ? 'text-white/40' : 'text-gray-400'
                    )}
                  >
                    PNL
                  </th>
                  <th
                    className={cn(
                      'py-2 px-2 text-right text-[10px] font-medium uppercase tracking-wider',
                      isDark ? 'text-white/40' : 'text-gray-400'
                    )}
                  >
                    ROI
                  </th>
                  {!isMobile && (
                    <>
                      <th
                        className={cn(
                          'py-2 px-2 text-right text-[10px] font-medium uppercase tracking-wider text-amber-500/70'
                        )}
                      >
                        Wash
                      </th>
                      <th
                        className={cn(
                          'py-2 pl-2 text-right text-[10px] font-medium uppercase tracking-wider',
                          isDark ? 'text-white/40' : 'text-gray-400'
                        )}
                      >
                        Last Active
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {processedTraders.map((trader, index) => {
                  const rank = offset + index + 1;
                  const isTopTrader = rank <= 3;
                  const pnl = trader.profit ?? 0;
                  const roi = trader.roi ?? 0;
                  const bought = trader.xrpBought ?? 0;
                  const sold = trader.xrpSold ?? 0;
                  const volume = trader.volume ?? 0;
                  const trades = trader.trades ?? 0;
                  return (
                    <tr
                      key={trader.address + '-' + index}
                      className={cn(
                        'border-b',
                        isDark
                          ? 'border-white/5 hover:bg-white/[0.02]'
                          : 'border-gray-100 hover:bg-gray-50'
                      )}
                    >
                      <td className="py-2.5 pr-2">
                        <span
                          className={cn(
                            'text-[11px] font-medium',
                            isTopTrader
                              ? rank === 1
                                ? 'text-yellow-500'
                                : rank === 2
                                  ? 'text-gray-400'
                                  : 'text-amber-600'
                              : isDark
                                ? 'text-white/30'
                                : 'text-gray-400'
                          )}
                        >
                          {rank}
                        </span>
                      </td>
                      <td className="py-2.5 px-2">
                        <Link
                          href={`/address/${trader.address}`}
                          target="_blank"
                          className={cn(
                            'text-[12px] font-mono hover:text-primary transition-colors',
                            isDark ? 'text-white/80' : 'text-gray-700'
                          )}
                        >
                          {`${trader.address.slice(0, isMobile ? 4 : 6)}...${trader.address.slice(isMobile ? -4 : -6)}`}
                        </Link>
                      </td>
                      {!isMobile && (
                        <>
                          <td
                            className={cn(
                              'py-2.5 px-2 text-right text-[12px] tabular-nums',
                              isDark ? 'text-white/70' : 'text-gray-600'
                            )}
                          >
                            {formatCompactNumber(volume)}
                          </td>
                          <td
                            className={cn(
                              'py-2.5 px-2 text-right text-[12px] tabular-nums',
                              isDark ? 'text-white/70' : 'text-gray-600'
                            )}
                          >
                            {fNumber(trades)}
                          </td>
                          <td className="py-2.5 px-2 text-right">
                            <span className="text-[12px] tabular-nums text-green-500">
                              {formatCompactNumber(bought)}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-right">
                            <span className="text-[12px] tabular-nums text-red-500">
                              {formatCompactNumber(sold)}
                            </span>
                          </td>
                        </>
                      )}
                      <td className="py-2.5 px-2 text-right">
                        <span
                          className={cn(
                            'text-[12px] font-medium tabular-nums',
                            pnl >= 0 ? 'text-green-500' : 'text-red-500'
                          )}
                        >
                          {pnl >= 0 ? '+' : ''}
                          {formatCompactNumber(pnl)}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <span
                          className={cn(
                            'text-[12px] tabular-nums',
                            roi >= 0 ? 'text-green-500' : 'text-red-500'
                          )}
                        >
                          {roi >= 0 ? '+' : ''}
                          {roi.toFixed(1)}%
                        </span>
                      </td>
                      {!isMobile && (
                        <>
                          <td className="py-2.5 px-2 text-right">
                            <span
                              className={cn(
                                'text-[12px] tabular-nums',
                                trader.washTradingScore > 0
                                  ? 'text-amber-500'
                                  : isDark
                                    ? 'text-white/30'
                                    : 'text-gray-300'
                              )}
                            >
                              {trader.washTradingScore > 0
                                ? formatCompactNumber(trader.washTradingScore)
                                : '-'}
                            </span>
                          </td>
                          <td
                            className={cn(
                              'py-2.5 pl-2 text-right text-[11px] tabular-nums',
                              isDark ? 'text-white/50' : 'text-gray-500'
                            )}
                          >
                            {trader.lastTradeDate
                              ? formatDistanceToNowStrict(new Date(trader.lastTradeDate))
                              : '-'}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-1 pt-3">
            <button
              type="button"
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={!hasPrev}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                !hasPrev ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10',
                isDark ? 'text-white/50' : 'text-gray-500'
              )}
            >
              <ChevronLeft size={14} />
            </button>
            <span
              className={cn(
                'text-[11px] px-2 tabular-nums',
                isDark ? 'text-white/40' : 'text-gray-500'
              )}
            >
              Page {currentPage}
            </span>
            <button
              type="button"
              onClick={() => setOffset(offset + limit)}
              disabled={!hasNext}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                !hasNext ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10',
                isDark ? 'text-white/50' : 'text-gray-500'
              )}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
