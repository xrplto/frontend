import React, { useState, useEffect, useContext, useRef } from 'react';
import { AppContext } from 'src/AppContext';
import { cn } from 'src/utils/cn';
import { Loader2, ChevronLeft, ChevronRight, Search, X, Wifi, WifiOff } from 'lucide-react';
import Link from 'next/link';
import { MD5 } from 'crypto-js';

// Constants
const getTokenImageUrl = (issuer, currency) => {
  if (currency === 'XRP') {
    return 'https://s1.xrpl.to/token/84e5efeb89c4eae8f68188982dc290d8';
  }
  const tokenIdentifier = issuer + '_' + currency;
  const md5Hash = MD5(tokenIdentifier).toString();
  return `https://s1.xrpl.to/token/${md5Hash}`;
};
const decodeCurrency = (currency) => {
  if (currency === 'XRP') return 'XRP';
  try {
    return Buffer.from(currency, 'hex').toString('utf8').replace(/\x00/g, '');
  } catch {
    return currency;
  }
};

const formatNumber = (num) => {
  if (!num || num === 0) return '0';
  const value = parseFloat(num);
  if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B';
  if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M';
  if (value >= 1e3) return (value / 1e3).toFixed(2) + 'K';
  if (value < 1) return value.toFixed(4);
  return value.toFixed(2);
};

const RichList = ({ token }) => {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [isMobile, setIsMobile] = useState(false);
  const [mobileChecked, setMobileChecked] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    setMobileChecked(true);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [richList, setRichList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalHolders, setTotalHolders] = useState(0);
  const [summary, setSummary] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);
  const rowsPerPage = 20;

  // WebSocket for real-time updates (only on page 1, no search)
  useEffect(() => {
    if (!token?.md5 || !mobileChecked || page !== 1 || searchTerm) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
        setWsConnected(false);
      }
      return;
    }

    const wsUrl = `wss://api.xrpl.to/ws/holders/list/${token.md5}?limit=${rowsPerPage}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setWsConnected(true);
    ws.onclose = () => setWsConnected(false);
    ws.onerror = () => setWsConnected(false);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'initial' || msg.e === 'update') {
          // Only use WS data if it includes acquisition fields
          if (msg.holders?.length && msg.holders[0].acquisition !== undefined) {
            setRichList(msg.holders);
          }
          if (msg.summary) setSummary(msg.summary);
          if (msg.total) {
            setTotalHolders(msg.total);
            setTotalPages(Math.ceil(msg.total / rowsPerPage));
          }
          setLoading(false);
        }
      } catch (e) {
        console.error('WS parse error:', e);
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
      setWsConnected(false);
    };
  }, [token?.md5, mobileChecked, page, searchTerm, rowsPerPage]);

  // HTTP fetch for pagination/search (skip when WS handles page 1)
  useEffect(() => {
    if (!mobileChecked) return;
    // Skip HTTP fetch if WebSocket is connected and handles page 1 without search
    if (page === 1 && !searchTerm && wsConnected) return;

    const controller = new AbortController();
    let mounted = true;

    const fetchRichList = async () => {
      if (!token || !token.md5) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        let url = `https://api.xrpl.to/api/holders/list/${token.md5}?start=${(page - 1) * rowsPerPage}&limit=${rowsPerPage}`;
        if (searchTerm.length >= 3) {
          url += `&search=${encodeURIComponent(searchTerm)}`;
        }
        const response = await fetch(url, { signal: controller.signal });

        if (!mounted || controller.signal.aborted) return;

        const data = await response.json();

        if (data.result === 'success' && mounted) {
          // Skip if WebSocket took over (race condition)
          if (page === 1 && !searchTerm && wsRef.current?.readyState === WebSocket.OPEN) return;
          setRichList(data.richList || []);
          if (data.summary) setSummary(data.summary);
          const actualHolders = data.length || data.richList?.length || 0;
          setTotalHolders(actualHolders);
          setTotalPages(Math.ceil((actualHolders || 100) / rowsPerPage));
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching rich list:', error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchRichList();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [token?.md5, page, rowsPerPage, mobileChecked, searchTerm, wsConnected]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleSearch = () => {
    if (searchInput.length >= 3 || searchInput.length === 0) {
      setSearchTerm(searchInput);
      setPage(1);
    }
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchTerm('');
    setPage(1);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    // Auto-clear search when input is emptied
    if (!value && searchTerm) {
      setSearchTerm('');
      setPage(1);
    }
  };

  const renderSearchBar = () => (
    <div className="flex items-center gap-2">
      {/* WS Status */}
      {page === 1 && !searchTerm && (
        <div className={cn(
          'flex items-center gap-1 rounded-md px-2 py-1 text-[10px]',
          wsConnected ? 'bg-green-500/10 text-green-500' : 'bg-white/5 text-white/30'
        )}>
          {wsConnected ? <Wifi size={10} /> : <WifiOff size={10} />}
          <span className="hidden sm:inline">{wsConnected ? 'Live' : 'Offline'}</span>
        </div>
      )}
      <div className={cn(
        'flex flex-1 items-center gap-2 rounded-lg border px-3 py-1.5',
        isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-gray-50'
      )}>
        <Search size={14} className={isDark ? 'text-white/40' : 'text-gray-400'} />
        <input
          type="text"
          value={searchInput}
          onChange={handleInputChange}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search by address (min 3 chars)"
          className={cn(
            'flex-1 bg-transparent text-[13px] outline-none placeholder:text-[12px]',
            isDark ? 'text-white placeholder:text-white/30' : 'text-gray-900 placeholder:text-gray-400'
          )}
        />
        {searchInput && (
          <button onClick={clearSearch} className={cn('hover:text-primary', isDark ? 'text-white/40' : 'text-gray-400')}>
            <X size={14} />
          </button>
        )}
      </div>
      <button
        onClick={handleSearch}
        disabled={searchInput.length > 0 && searchInput.length < 3}
        className={cn(
          'rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors disabled:opacity-40',
          isDark ? 'border-white/10 hover:border-primary hover:bg-primary/5' : 'border-gray-200 hover:border-primary hover:bg-primary/5'
        )}
      >
        Search
      </button>
    </div>
  );

  if (loading && !richList.length) {
    return (
      <div className="space-y-4">
        {renderSearchBar()}
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!richList || richList.length === 0) {
    return (
      <div className="space-y-4">
        {renderSearchBar()}
        {searchTerm && (
          <div className={cn('text-[11px]', isDark ? 'text-white/50' : 'text-gray-500')}>
            No results for "{searchTerm}"
          </div>
        )}
        <div className={cn(
          'rounded-xl border-[1.5px] border-dashed py-12 text-center',
          isDark ? 'border-white/15 bg-white/[0.02]' : 'border-gray-300 bg-gray-50'
        )}>
          <h3 className={cn('mb-2 text-base font-medium', isDark ? 'text-white/60' : 'text-gray-500')}>
            {searchTerm ? 'No Matching Holders' : 'No Holder Data Available'}
          </h3>
          <p className={cn('text-sm', isDark ? 'text-white/40' : 'text-gray-400')}>
            {searchTerm ? 'Try a different address' : 'Rich list data will appear here when available'}
          </p>
        </div>
      </div>
    );
  }

  const getRankStyle = (rank) => {
    if (rank === 1) return 'bg-yellow-500/15 text-yellow-500';
    if (rank === 2) return 'bg-gray-400/15 text-gray-400';
    if (rank === 3) return 'bg-orange-600/15 text-orange-500';
    return isDark ? 'bg-white/[0.06] text-white/50' : 'bg-gray-100 text-gray-500';
  };

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Top 10', value: summary.top10Hold },
            { label: 'Top 20', value: summary.top20Hold },
            { label: 'Top 50', value: summary.top50Hold },
            { label: 'Top 100', value: summary.top100Hold }
          ].map(({ label, value }) => {
            const hasValue = value !== undefined && value !== null;
            return (
              <div key={label} className={cn(
                'rounded-lg border px-3 py-2',
                isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-gray-50'
              )}>
                <div className={cn('text-[10px] uppercase tracking-wide', isDark ? 'text-white/40' : 'text-gray-400')}>{label}</div>
                <div className={cn(
                  'text-[14px] font-medium',
                  hasValue && value > 70 ? 'text-red-400' : hasValue && value > 50 ? 'text-yellow-500' : isDark ? 'text-white' : 'text-gray-900'
                )}>
                  {hasValue ? `${value}%` : '—'}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Search */}
      {renderSearchBar()}
      {searchTerm && (
        <div className={cn('flex items-center gap-2 text-[11px]', isDark ? 'text-white/50' : 'text-gray-500')}>
          Showing results for "{searchTerm}" ({totalHolders} found)
          {loading && <Loader2 size={12} className="animate-spin" />}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={cn('border-b', isDark ? 'border-white/5' : 'border-gray-200')}>
              <th className={cn('py-2 pr-2 text-left text-[10px] font-medium uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>#</th>
              <th className={cn('py-2 px-2 text-left text-[10px] font-medium uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>Address</th>
              <th className={cn('py-2 px-2 text-right text-[10px] font-medium uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>Balance</th>
              {!isMobile && (
                <th className={cn('py-2 px-2 text-center text-[10px] font-medium uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>Acquisition</th>
              )}
              {!isMobile && (
                <th className={cn('py-2 px-2 text-right text-[10px] font-medium uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>24h %</th>
              )}
              <th className={cn('py-2 pl-2 text-right text-[10px] font-medium uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>Share</th>
            </tr>
          </thead>
          <tbody>
            {richList.map((holder, index) => {
              const rank = holder.id || (page - 1) * rowsPerPage + index + 1;
              const percentOfSupply = holder.holding || 0;
              const isAMM = holder.isAMM;
              const isCreator = holder.isCreator;
              const isFrozen = holder.freeze;
              const change24h = holder.balance24h ? ((holder.balance - holder.balance24h) / holder.balance24h) * 100 : null;

              return (
                <tr
                  key={holder.account || index}
                  className={cn(
                    'border-b',
                    isDark ? 'border-white/5 hover:bg-white/[0.02]' : 'border-gray-100 hover:bg-gray-50'
                  )}
                >
                  <td className="py-2.5 pr-2">
                    <span className={cn(
                      'inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-medium',
                      getRankStyle(rank)
                    )}>
                      {rank}
                    </span>
                  </td>
                  <td className="py-2.5 px-2">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/address/${holder.account}`}
                        className={cn(
                          'text-[12px] font-mono hover:text-primary transition-colors min-w-[120px]',
                          isDark ? 'text-white/80' : 'text-gray-700'
                        )}
                      >
                        {holder.account ? `${holder.account.slice(0, isMobile ? 4 : 6)}...${holder.account.slice(isMobile ? -4 : -6)}` : 'Unknown'}
                      </Link>
                      {(isAMM || isCreator || isFrozen || holder.source) && (
                        <div className="flex items-center gap-1 flex-wrap">
                          {isAMM && <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[9px] font-medium text-primary">AMM</span>}
                          {isCreator && <span className="rounded bg-purple-500/15 px-1.5 py-0.5 text-[9px] font-medium text-purple-400">Creator</span>}
                          {isFrozen && <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[9px] font-medium text-red-400">Frozen</span>}
                          {holder.source && (
                            <span className={cn(
                              'rounded px-1.5 py-0.5 text-[9px] font-medium',
                              holder.source === 'traded' ? 'bg-emerald-500/15 text-emerald-400' :
                              holder.source === 'mixed' ? 'bg-amber-500/15 text-amber-400' :
                              'bg-white/10 text-white/50'
                            )}>
                              {holder.source === 'traded' ? 'Trader' : holder.source === 'mixed' ? 'Mixed' : 'Transfer'}
                            </span>
                          )}
                          {holder.tradeCount > 0 && (
                            <span className={cn('text-[9px]', isDark ? 'text-white/30' : 'text-gray-400')}>
                              {holder.tradeCount} trades
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className={cn('py-2.5 px-2 text-right text-[12px] font-medium tabular-nums', isDark ? 'text-white' : 'text-gray-900')}>
                    {formatNumber(holder.balance)}
                  </td>
                  {!isMobile && (
                    <td className="py-2.5 px-2">
                      {holder.acquisition ? (
                        <div className="flex items-center justify-center gap-1">
                          <div className={cn('flex h-1.5 w-16 overflow-hidden rounded-full', isDark ? 'bg-white/10' : 'bg-gray-200')}>
                            {holder.acquisition.dexPct > 0 && (
                              <div className="h-full bg-emerald-500" style={{ width: `${holder.acquisition.dexPct}%` }} title={`DEX ${holder.acquisition.dexPct}%`} />
                            )}
                            {holder.acquisition.ammPct > 0 && (
                              <div className="h-full bg-primary" style={{ width: `${holder.acquisition.ammPct}%` }} title={`AMM ${holder.acquisition.ammPct}%`} />
                            )}
                            {holder.acquisition.lpPct > 0 && (
                              <div className="h-full bg-purple-500" style={{ width: `${holder.acquisition.lpPct}%` }} title={`LP ${holder.acquisition.lpPct}%`} />
                            )}
                            {holder.acquisition.transferPct > 0 && (
                              <div className="h-full bg-gray-500" style={{ width: `${holder.acquisition.transferPct}%` }} title={`Transfer ${holder.acquisition.transferPct}%`} />
                            )}
                          </div>
                          <span className={cn('text-[9px] tabular-nums min-w-[28px]', isDark ? 'text-white/40' : 'text-gray-400')}>
                            {holder.tradedPct > 0 ? `${holder.tradedPct}%` : 'T'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <span className={cn('text-[9px]', isDark ? 'text-white/20' : 'text-gray-300')}>—</span>
                        </div>
                      )}
                    </td>
                  )}
                  {!isMobile && (
                    <td className="py-2.5 px-2 text-right">
                      {change24h !== null ? (
                        <span className={cn('text-[12px] tabular-nums', change24h >= 0 ? 'text-green-500' : 'text-red-500')}>
                          {Math.abs(change24h) < 0.01 ? '~0' : `${change24h >= 0 ? '+' : ''}${Math.abs(change24h) < 0.1 ? change24h.toFixed(2) : change24h.toFixed(1)}`}%
                        </span>
                      ) : (
                        <span className={cn('text-[10px]', isDark ? 'text-white/20' : 'text-gray-300')}>—</span>
                      )}
                    </td>
                  )}
                  <td className="py-2.5 pl-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className={cn('h-1.5 w-12 overflow-hidden rounded-full', isDark ? 'bg-white/10' : 'bg-gray-200')}>
                        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(percentOfSupply * 2, 100)}%` }} />
                      </div>
                      <span className={cn(
                        'text-[12px] font-medium tabular-nums min-w-[40px]',
                        percentOfSupply > 5 ? 'text-yellow-500' : isDark ? 'text-white/70' : 'text-gray-600'
                      )}>
                        {percentOfSupply}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-3">
          <button
            type="button"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              page === 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-white/10",
              isDark ? "text-white/50" : "text-gray-500"
            )}
          >
            <ChevronLeft size={14} />
          </button>
          <span className={cn("text-[11px] px-2 tabular-nums", isDark ? "text-white/40" : "text-gray-500")}>
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              page === totalPages ? "opacity-30 cursor-not-allowed" : "hover:bg-white/10",
              isDark ? "text-white/50" : "text-gray-500"
            )}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default RichList;
