import React, { useState, useEffect, useContext, useRef } from 'react';
import { ThemeContext, WalletContext } from 'src/context/AppContext';
import { cn } from 'src/utils/cn';
import { Loader2, ChevronLeft, ChevronRight, Search, X, Wifi, WifiOff, MessageCircle, Tag, Trash2 } from 'lucide-react';
import api, { getWalletAuthHeaders } from 'src/utils/api';
import Link from 'next/link';
import { MD5 } from 'crypto-js';

const BearEmptyState = ({ isDark, title, subtitle }) => (
  <div className={cn('rounded-xl', isDark ? 'border-[1.5px] border-dashed border-white/10 bg-white/[0.02]' : 'border-[1.5px] border-dashed border-black/10 bg-black/[0.02]')}>
    <div className="flex flex-col items-center justify-center p-6">
      <div className="relative w-12 h-12 mb-3">
      <div className={cn('absolute -top-[3px] left-0 w-4 h-4 rounded-full', isDark ? 'bg-white/[0.15]' : 'bg-gray-300')}>
        <div className={cn('absolute top-[3px] left-[3px] w-[10px] h-[10px] rounded-full', isDark ? 'bg-white/10' : 'bg-gray-200')} />
      </div>
      <div className={cn('absolute -top-[3px] right-0 w-4 h-4 rounded-full', isDark ? 'bg-white/[0.15]' : 'bg-gray-300')}>
        <div className={cn('absolute top-[3px] right-[3px] w-[10px] h-[10px] rounded-full', isDark ? 'bg-white/10' : 'bg-gray-200')} />
      </div>
      <div className={cn('absolute top-1.5 left-1/2 -translate-x-1/2 w-10 h-9 rounded-full overflow-hidden', isDark ? 'bg-white/[0.15]' : 'bg-gray-300')}>
        {[0,1,2,3,4].map(i => (
          <div key={i} className={cn('h-0.5 w-full', isDark ? 'bg-white/[0.15]' : 'bg-gray-200')} style={{ marginTop: i * 2.5 + 2 }} />
        ))}
        <div className="absolute top-[10px] left-1.5 w-[10px] h-[10px]">
          <div className={cn('absolute w-2 h-0.5 rotate-45 top-1', isDark ? 'bg-white/40' : 'bg-gray-500')} />
          <div className={cn('absolute w-2 h-0.5 -rotate-45 top-1', isDark ? 'bg-white/40' : 'bg-gray-500')} />
        </div>
        <div className="absolute top-[10px] right-1.5 w-[10px] h-[10px]">
          <div className={cn('absolute w-2 h-0.5 rotate-45 top-1', isDark ? 'bg-white/40' : 'bg-gray-500')} />
          <div className={cn('absolute w-2 h-0.5 -rotate-45 top-1', isDark ? 'bg-white/40' : 'bg-gray-500')} />
        </div>
        <div className={cn('absolute bottom-[5px] left-1/2 -translate-x-1/2 w-[18px] h-3 rounded-full', isDark ? 'bg-white/10' : 'bg-gray-200')}>
          <div className={cn('absolute top-0.5 left-1/2 -translate-x-1/2 w-2 h-1.5 rounded-full', isDark ? 'bg-white/25' : 'bg-gray-400')} />
        </div>
      </div>
    </div>
      <span className={cn('text-[11px] font-medium tracking-[0.05em] uppercase mb-1', isDark ? 'text-white/50' : 'text-black/50')}>{title}</span>
      <span className={cn('text-[10px]', isDark ? 'text-white/30' : 'text-black/30')}>{subtitle}</span>
    </div>
  </div>
);

// Constants
const getTokenImageUrl = (issuer, currency) => {
  if (currency === 'XRP') {
    return 'https://s1.xrpl.to/thumb/84e5efeb89c4eae8f68188982dc290d8_32';
  }
  const tokenIdentifier = issuer + '_' + currency;
  const md5Hash = MD5(tokenIdentifier).toString();
  return `https://s1.xrpl.to/thumb/${md5Hash}_32`;
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

const RichList = ({ token, walletLabels: walletLabelsProp = {}, onLabelsChange }) => {
  const { themeName } = useContext(ThemeContext);
  const { accountProfile } = useContext(WalletContext);
  const accountLogin = accountProfile?.account;
  const isDark = themeName === 'XrplToDarkTheme';
  const [isMobile, setIsMobile] = useState(false);
  const [mobileChecked, setMobileChecked] = useState(false);

  // Local wallet labels state (synced from prop)
  const [walletLabels, setWalletLabels] = useState(walletLabelsProp);
  const [editingLabel, setEditingLabel] = useState(null); // wallet address being edited
  const [labelInput, setLabelInput] = useState('');
  const [labelSaving, setLabelSaving] = useState(false);

  // Sync from prop
  useEffect(() => { setWalletLabels(walletLabelsProp); }, [walletLabelsProp]);

  const handleSaveLabel = async (wallet) => {
    if (!accountLogin || !labelInput.trim()) return;
    setLabelSaving(true);
    try {
      const authHeaders = await getWalletAuthHeaders(accountProfile);
      if (walletLabels[wallet]) {
        await api.delete(`https://api.xrpl.to/api/user/${accountLogin}/labels/${wallet}`, { headers: authHeaders });
      }
      const res = await api.post(`https://api.xrpl.to/api/user/${accountLogin}/labels`, {
        wallet,
        label: labelInput.trim()
      }, { headers: authHeaders });
      const newLabels = { ...walletLabels, [wallet]: res.data?.label || labelInput.trim() };
      setWalletLabels(newLabels);
      onLabelsChange?.(newLabels);
      setEditingLabel(null);
      setLabelInput('');
    } catch (e) { console.error('[RichList] Label save failed:', e.message); }
    setLabelSaving(false);
  };

  const handleDeleteLabel = async (wallet) => {
    if (!accountLogin) return;
    setLabelSaving(true);
    try {
      const authHeaders = await getWalletAuthHeaders(accountProfile);
      await api.delete(`https://api.xrpl.to/api/user/${accountLogin}/labels/${wallet}`, { headers: authHeaders });
      const newLabels = { ...walletLabels };
      delete newLabels[wallet];
      setWalletLabels(newLabels);
      onLabelsChange?.(newLabels);
      setEditingLabel(null);
      setLabelInput('');
    } catch (e) { console.error('[RichList] Label delete failed:', e.message); }
    setLabelSaving(false);
  };

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

    let unmounted = false;
    let reconnectTimeout = null;
    let retryCount = 0;

    const connect = async () => {
      if (unmounted) return;
      try {
        const { getSessionWsUrl } = await import('src/utils/wsToken');
        const wsUrl = await getSessionWsUrl('holders', token.md5, { limit: rowsPerPage });
        if (unmounted || !wsUrl) return;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => { setWsConnected(true); retryCount = 0; };
        ws.onclose = () => {
          if (!unmounted) {
            setWsConnected(false);
            if (retryCount < 5) {
              reconnectTimeout = setTimeout(() => { retryCount++; connect(); }, Math.min(3000 * Math.pow(2, retryCount), 60000));
            }
          }
        };
        ws.onerror = () => {};

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'initial' || msg.e === 'update') {
              if (msg.holders?.length) {
                setRichList(msg.holders);
              }
              if (msg.summary) setSummary(msg.summary);
              if (msg.total) {
                setTotalHolders(msg.total);
                setTotalPages(Math.ceil(msg.total / rowsPerPage));
              }
              setLoading(false);
            }
          } catch {}
        };

        if (unmounted) { ws.close(); wsRef.current = null; }
      } catch {}
    };
    connect();

    return () => {
      unmounted = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) wsRef.current.close();
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
        let url = `https://api.xrpl.to/v1/holders/list/${token.md5}?start=${(page - 1) * rowsPerPage}&limit=${rowsPerPage}`;
        if (searchTerm.length >= 3) {
          url += `&search=${encodeURIComponent(searchTerm)}`;
        }
        const response = await fetch(url, { signal: controller.signal });

        if (!mounted || controller.signal.aborted) return;

        const data = await response.json();

        if (data.success && mounted) {
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
        <div
          className={cn(
            'flex items-center justify-center gap-1 rounded-md px-2 py-1 text-[10px] min-w-[54px]',
            wsConnected ? 'bg-green-500/10 text-green-500' : 'bg-white/5 text-white/30'
          )}
        >
          {wsConnected ? <Wifi size={10} /> : <WifiOff size={10} />}
          <span className="hidden sm:inline">{wsConnected ? 'Live' : 'Offline'}</span>
        </div>
      )}
      <div
        className={cn(
          'flex flex-1 items-center gap-2 rounded-lg border px-3 py-1.5',
          isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-gray-50'
        )}
      >
        <Search size={14} className={isDark ? 'text-white/40' : 'text-gray-400'} />
        <input
          type="text"
          value={searchInput}
          onChange={handleInputChange}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search by address (min 3 chars)"
          className={cn(
            'flex-1 bg-transparent text-[13px] outline-none placeholder:text-[12px]',
            isDark
              ? 'text-white placeholder:text-white/30'
              : 'text-gray-900 placeholder:text-gray-400'
          )}
        />
        {searchInput && (
          <button
            onClick={clearSearch}
            aria-label="Clear search"
            className={cn('hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE] rounded', isDark ? 'text-white/40' : 'text-gray-400')}
          >
            <X size={14} />
          </button>
        )}
      </div>
      <button
        onClick={handleSearch}
        disabled={searchInput.length > 0 && searchInput.length < 3}
        className={cn(
          'rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-[background-color,border-color] disabled:opacity-40',
          isDark
            ? 'border-white/10 hover:border-primary hover:bg-primary/5'
            : 'border-gray-200 hover:border-primary hover:bg-primary/5'
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
        <BearEmptyState
          isDark={isDark}
          title={searchTerm ? 'No Matching Holders' : 'No Holder Data Available'}
          subtitle={searchTerm ? 'Try a different address' : 'Rich list data will appear here when available'}
        />
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
              <div
                key={label}
                className={cn(
                  'rounded-lg border px-3 py-2',
                  isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-gray-50'
                )}
              >
                <div
                  className={cn(
                    'text-[10px] uppercase tracking-wide',
                    isDark ? 'text-white/40' : 'text-gray-400'
                  )}
                >
                  {label}
                </div>
                <div
                  className={cn(
                    'text-[14px] font-medium',
                    hasValue && value > 70
                      ? 'text-red-400'
                      : hasValue && value > 50
                        ? 'text-yellow-500'
                        : isDark
                          ? 'text-white'
                          : 'text-gray-900'
                  )}
                >
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
        <div
          className={cn(
            'flex items-center gap-2 text-[11px]',
            isDark ? 'text-white/50' : 'text-gray-500'
          )}
        >
          Showing results for "{searchTerm}" ({totalHolders} found)
          {loading && <Loader2 size={12} className="animate-spin" />}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={cn('border-b', isDark ? 'border-white/5' : 'border-gray-200')}>
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
                Address
              </th>
              <th
                className={cn(
                  'py-2 px-2 text-right text-[10px] font-medium uppercase tracking-wider',
                  isDark ? 'text-white/40' : 'text-gray-400'
                )}
              >
                Balance
              </th>
              {!isMobile && (
                <th
                  className={cn(
                    'py-2 px-2 text-right text-[10px] font-medium uppercase tracking-wider',
                    isDark ? 'text-white/40' : 'text-gray-400'
                  )}
                >
                  Acquisition
                </th>
              )}
              {!isMobile && (
                <th
                  className={cn(
                    'py-2 px-2 text-right text-[10px] font-medium uppercase tracking-wider',
                    isDark ? 'text-white/40' : 'text-gray-400'
                  )}
                >
                  24h %
                </th>
              )}
              <th
                className={cn(
                  'py-2 pl-2 text-right text-[10px] font-medium uppercase tracking-wider',
                  isDark ? 'text-white/40' : 'text-gray-400'
                )}
              >
                Share
              </th>
            </tr>
          </thead>
          <tbody>
            {richList.map((holder, index) => {
              const rank = holder.id || (page - 1) * rowsPerPage + index + 1;
              const percentOfSupply = holder.holding || 0;
              const isAMM = holder.isAMM;
              const isCreator = holder.isCreator;
              const isFrozen = holder.freeze;
              const change24h = holder.balance24h
                ? ((holder.balance - holder.balance24h) / holder.balance24h) * 100
                : null;

              return (
                <tr
                  key={holder.account || index}
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
                        'inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-medium',
                        getRankStyle(rank)
                      )}
                    >
                      {rank}
                    </span>
                  </td>
                  <td className="py-2.5 px-2">
                    <div className="flex items-center gap-2">
                      {editingLabel === holder.account ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={labelInput}
                            onChange={(e) => setLabelInput(e.target.value.slice(0, 30))}
                            placeholder="Label"
                            autoFocus
                            className={cn('w-20 px-1.5 py-0.5 rounded text-[11px] outline-none', isDark ? 'bg-white/10 text-white border border-white/20' : 'bg-gray-100 text-gray-900 border border-gray-300')}
                          />
                          <button onClick={() => handleSaveLabel(holder.account)} disabled={labelSaving || !labelInput.trim()} className="px-1.5 py-0.5 rounded text-[10px] bg-primary text-white disabled:opacity-50">Save</button>
                          {walletLabels[holder.account] && <button onClick={() => handleDeleteLabel(holder.account)} disabled={labelSaving} className="p-0.5 rounded text-red-400 hover:bg-red-500/10"><Trash2 size={10} /></button>}
                          <button onClick={() => { setEditingLabel(null); setLabelInput(''); }} className={cn('text-[10px]', isDark ? 'text-white/40' : 'text-gray-400')}>✕</button>
                        </div>
                      ) : (
                        <>
                          <Link
                            href={`/address/${holder.account}`}
                            className={cn(
                              'text-[12px] font-mono hover:text-primary transition-[background-color,border-color] min-w-[80px]',
                              walletLabels[holder.account] ? 'text-primary' : isDark ? 'text-white/80' : 'text-gray-700'
                            )}
                            title={holder.account}
                          >
                            {walletLabels[holder.account] || (holder.account
                              ? `${holder.account.slice(0, isMobile ? 4 : 6)}...${holder.account.slice(isMobile ? -4 : -6)}`
                              : 'Unknown')}
                          </Link>
                          {holder.account && holder.account !== accountLogin && accountLogin && (
                            <button
                              onClick={() => { setEditingLabel(holder.account); setLabelInput(walletLabels[holder.account] || ''); }}
                              className={cn('p-0.5 rounded hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]', walletLabels[holder.account] ? 'text-primary' : isDark ? 'text-white/20 hover:text-primary' : 'text-gray-300 hover:text-primary')}
                              title={walletLabels[holder.account] ? 'Edit label' : 'Add label'}
                              aria-label={walletLabels[holder.account] ? 'Edit label' : 'Add label'}
                            >
                              <Tag size={11} />
                            </button>
                          )}
                          {holder.account && holder.account !== accountLogin && (
                            <button
                              onClick={() => window.dispatchEvent(new CustomEvent('openDm', { detail: { user: holder.account } }))}
                              className={cn('p-0.5 rounded hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]', isDark ? 'text-white/30 hover:text-[#650CD4]' : 'text-gray-300 hover:text-[#650CD4]')}
                              title="Message"
                              aria-label="Send direct message"
                            >
                              <MessageCircle size={12} />
                            </button>
                          )}
                        </>
                      )}
                      {(isAMM || isCreator || isFrozen || holder.tradedPct > 0 || holder.tradeCount > 0) && (
                        <div className="flex items-center gap-1 flex-wrap">
                          {isAMM && (
                            <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[9px] font-medium text-primary">
                              AMM
                            </span>
                          )}
                          {isCreator && (
                            <span className="rounded bg-purple-500/15 px-1.5 py-0.5 text-[9px] font-medium text-purple-400">
                              Creator
                            </span>
                          )}
                          {isFrozen && (
                            <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[9px] font-medium text-red-400">
                              Frozen
                            </span>
                          )}
                          {holder.source && holder.source !== 'transfer' && (
                            <span
                              className={cn(
                                'rounded px-1.5 py-0.5 text-[9px] font-medium',
                                holder.source === 'traded'
                                  ? 'bg-emerald-500/15 text-emerald-400'
                                  : 'bg-amber-500/15 text-amber-400'
                              )}
                            >
                              {holder.source === 'traded' ? 'Trader' : 'Mixed'}
                            </span>
                          )}
                          {holder.tradeCount > 0 && (
                            <span
                              className={cn(
                                'text-[9px]',
                                isDark ? 'text-white/30' : 'text-gray-400'
                              )}
                            >
                              {holder.tradeCount} trades
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td
                    className={cn(
                      'py-2.5 px-2 text-right text-[12px] font-medium tabular-nums',
                      isDark ? 'text-white' : 'text-gray-900'
                    )}
                  >
                    {formatNumber(holder.balance)}
                  </td>
                  {!isMobile && (
                    <td className="py-2.5 px-2">
                      {holder.acquisition ? (
                        <div className="flex items-center justify-end gap-2">
                          <div
                            className={cn(
                              'flex h-1.5 w-12 overflow-hidden rounded-full',
                              isDark ? 'bg-white/10' : 'bg-gray-200'
                            )}
                          >
                            {holder.acquisition.dexPct > 0 && (
                              <div
                                className="h-full bg-emerald-500"
                                style={{ width: `${holder.acquisition.dexPct}%` }}
                                title={`DEX ${holder.acquisition.dexPct}%`}
                              />
                            )}
                            {holder.acquisition.ammPct > 0 && (
                              <div
                                className="h-full bg-primary"
                                style={{ width: `${holder.acquisition.ammPct}%` }}
                                title={`AMM ${holder.acquisition.ammPct}%`}
                              />
                            )}
                            {holder.acquisition.lpPct > 0 && (
                              <div
                                className="h-full bg-purple-500"
                                style={{ width: `${holder.acquisition.lpPct}%` }}
                                title={`LP ${holder.acquisition.lpPct}%`}
                              />
                            )}
                            {holder.acquisition.transferPct > 0 && (
                              <div
                                className="h-full bg-gray-500"
                                style={{ width: `${holder.acquisition.transferPct}%` }}
                                title={`Transfer ${holder.acquisition.transferPct}%`}
                              />
                            )}
                          </div>
                          <div className="flex items-center justify-end gap-1 text-[10px] font-medium tabular-nums min-w-[75px]">
                            {(() => {
                              const sources = [
                                { label: 'DEX', pct: holder.acquisition.dexPct, color: 'text-emerald-500' },
                                { label: 'AMM', pct: holder.acquisition.ammPct, color: 'text-primary' },
                                { label: 'LP', pct: holder.acquisition.lpPct, color: 'text-purple-400' },
                                { label: 'Transfer', pct: holder.acquisition.transferPct, color: isDark ? 'text-white/25' : 'text-gray-400' }
                              ].filter(s => s.pct > 0).sort((a, b) => b.pct - a.pct);

                              if (sources.length === 0) return null;
                              const top = sources[0];
                              return (
                                <span className={top.color}>
                                  {top.pct}% {top.label}{sources.length > 1 ? '+' : ''}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end">
                          <span
                            className={cn('text-[9px]', isDark ? 'text-white/20' : 'text-gray-300')}
                          >
                            —
                          </span>
                        </div>
                      )}
                    </td>
                  )}
                  {!isMobile && (
                    <td className="py-2.5 px-2 text-right">
                      {change24h !== null ? (
                        <span
                          className={cn(
                            'text-[12px] tabular-nums',
                            change24h >= 0 ? 'text-green-500' : 'text-red-500'
                          )}
                        >
                          {Math.abs(change24h) < 0.01
                            ? '~0'
                            : `${change24h >= 0 ? '+' : ''}${Math.abs(change24h) < 0.1 ? change24h.toFixed(2) : change24h.toFixed(1)}`}
                          %
                        </span>
                      ) : (
                        <span
                          className={cn('text-[10px]', isDark ? 'text-white/20' : 'text-gray-300')}
                        >
                          —
                        </span>
                      )}
                    </td>
                  )}
                  <td className="py-2.5 pl-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div
                        className={cn(
                          'h-1.5 w-12 overflow-hidden rounded-full',
                          isDark ? 'bg-white/10' : 'bg-gray-200'
                        )}
                      >
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.min(percentOfSupply * 2, 100)}%` }}
                        />
                      </div>
                      <span
                        className={cn(
                          'text-[12px] font-medium tabular-nums min-w-[40px]',
                          percentOfSupply > 5
                            ? 'text-yellow-500'
                            : isDark
                              ? 'text-white/70'
                              : 'text-gray-600'
                        )}
                      >
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
            aria-label="Previous page"
            className={cn(
              'p-1.5 rounded-md transition-[background-color,border-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
              page === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10',
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
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            aria-label="Next page"
            className={cn(
              'p-1.5 rounded-md transition-[background-color,border-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
              page === totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10',
              isDark ? 'text-white/50' : 'text-gray-500'
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
