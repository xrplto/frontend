import React, { useState, useEffect, useContext, useRef } from 'react';
import { AppContext } from 'src/context/AppContext';
import { cn } from 'src/utils/cn';
import { Loader2, ChevronLeft, ChevronRight, Search, X, Wifi, WifiOff, MessageCircle, Tag, Trash2 } from 'lucide-react';
import api from 'src/utils/api';
import Link from 'next/link';
import { MD5 } from 'crypto-js';

const BearEmptyState = ({ isDark, title, subtitle }) => (
  <div style={{ border: isDark ? '1.5px dashed rgba(255,255,255,0.1)' : '1.5px dashed rgba(0,0,0,0.1)', borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ position: 'relative', width: 48, height: 48, marginBottom: 12 }}>
      <div style={{ position: 'absolute', top: -3, left: 0, width: 16, height: 16, borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.15)' : '#d1d5db' }}>
        <div style={{ position: 'absolute', top: 3, left: 3, width: 10, height: 10, borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb' }} />
      </div>
      <div style={{ position: 'absolute', top: -3, right: 0, width: 16, height: 16, borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.15)' : '#d1d5db' }}>
        <div style={{ position: 'absolute', top: 3, right: 3, width: 10, height: 10, borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb' }} />
      </div>
      <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', width: 40, height: 36, borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.15)' : '#d1d5db', overflow: 'hidden' }}>
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{ height: 2, width: '100%', background: isDark ? 'rgba(255,255,255,0.15)' : '#e5e7eb', marginTop: i * 2.5 + 2 }} />
        ))}
        <div style={{ position: 'absolute', top: 10, left: 6, width: 10, height: 10 }}>
          <div style={{ position: 'absolute', width: 8, height: 2, background: isDark ? 'rgba(255,255,255,0.4)' : '#6b7280', transform: 'rotate(45deg)', top: 4 }} />
          <div style={{ position: 'absolute', width: 8, height: 2, background: isDark ? 'rgba(255,255,255,0.4)' : '#6b7280', transform: 'rotate(-45deg)', top: 4 }} />
        </div>
        <div style={{ position: 'absolute', top: 10, right: 6, width: 10, height: 10 }}>
          <div style={{ position: 'absolute', width: 8, height: 2, background: isDark ? 'rgba(255,255,255,0.4)' : '#6b7280', transform: 'rotate(45deg)', top: 4 }} />
          <div style={{ position: 'absolute', width: 8, height: 2, background: isDark ? 'rgba(255,255,255,0.4)' : '#6b7280', transform: 'rotate(-45deg)', top: 4 }} />
        </div>
        <div style={{ position: 'absolute', bottom: 5, left: '50%', transform: 'translateX(-50%)', width: 18, height: 12, borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb' }}>
          <div style={{ position: 'absolute', top: 2, left: '50%', transform: 'translateX(-50%)', width: 8, height: 6, borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.25)' : '#9ca3af' }} />
        </div>
      </div>
    </div>
      <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', textTransform: 'uppercase', marginBottom: 4 }}>{title}</span>
      <span style={{ fontSize: 10, color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}>{subtitle}</span>
    </div>
  </div>
);

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

const RichList = ({ token, walletLabels: walletLabelsProp = {}, onLabelsChange }) => {
  const { themeName, accountProfile } = useContext(AppContext);
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
      if (walletLabels[wallet]) {
        await api.delete(`https://api.xrpl.to/api/user/${accountLogin}/labels/${wallet}`);
      }
      const res = await api.post(`https://api.xrpl.to/api/user/${accountLogin}/labels`, {
        wallet,
        label: labelInput.trim()
      });
      const newLabels = { ...walletLabels, [wallet]: res.data?.label || labelInput.trim() };
      setWalletLabels(newLabels);
      onLabelsChange?.(newLabels);
      setEditingLabel(null);
      setLabelInput('');
    } catch (e) {}
    setLabelSaving(false);
  };

  const handleDeleteLabel = async (wallet) => {
    if (!accountLogin) return;
    setLabelSaving(true);
    try {
      await api.delete(`https://api.xrpl.to/api/user/${accountLogin}/labels/${wallet}`);
      const newLabels = { ...walletLabels };
      delete newLabels[wallet];
      setWalletLabels(newLabels);
      onLabelsChange?.(newLabels);
      setEditingLabel(null);
      setLabelInput('');
    } catch (e) {}
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

    let ws = null;
    (async () => {
      try {
        const res = await fetch(`/api/ws/session?type=holders&id=${token.md5}&limit=${rowsPerPage}`);
        const { wsUrl } = await res.json();
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => setWsConnected(true);
        ws.onclose = () => setWsConnected(false);
        ws.onerror = () => setWsConnected(false);

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
          } catch (e) {
            console.error('WS parse error:', e);
          }
        };
      } catch (e) {
        console.error('[Holders WS] Session error:', e);
      }
    })();

    return () => {
      if (ws) ws.close();
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
            'flex items-center gap-1 rounded-md px-2 py-1 text-[10px]',
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
            className={cn('hover:text-primary', isDark ? 'text-white/40' : 'text-gray-400')}
          >
            <X size={14} />
          </button>
        )}
      </div>
      <button
        onClick={handleSearch}
        disabled={searchInput.length > 0 && searchInput.length < 3}
        className={cn(
          'rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors disabled:opacity-40',
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
                    'py-2 px-2 text-center text-[10px] font-medium uppercase tracking-wider',
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
                              'text-[12px] font-mono hover:text-primary transition-colors min-w-[80px]',
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
                              className={cn('p-0.5 rounded hover:bg-white/10', walletLabels[holder.account] ? 'text-primary' : isDark ? 'text-white/20 hover:text-primary' : 'text-gray-300 hover:text-primary')}
                              title={walletLabels[holder.account] ? 'Edit label' : 'Add label'}
                            >
                              <Tag size={11} />
                            </button>
                          )}
                          {holder.account && holder.account !== accountLogin && (
                            <button
                              onClick={() => window.dispatchEvent(new CustomEvent('openDm', { detail: { user: holder.account } }))}
                              className={cn('p-0.5 rounded hover:bg-white/10', isDark ? 'text-white/30 hover:text-[#650CD4]' : 'text-gray-300 hover:text-[#650CD4]')}
                              title="Message"
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
                        <div className="flex items-center justify-center gap-1">
                          <div
                            className={cn(
                              'flex h-1.5 w-16 overflow-hidden rounded-full',
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
                          <div className="flex items-center gap-1 text-[9px] tabular-nums">
                            {holder.acquisition.dexPct > 0 && (
                              <span className="text-emerald-500">{holder.acquisition.dexPct}% DEX</span>
                            )}
                            {holder.acquisition.ammPct > 0 && (
                              <span className="text-primary">{holder.acquisition.ammPct}% AMM</span>
                            )}
                            {holder.acquisition.lpPct > 0 && (
                              <span className="text-purple-400">{holder.acquisition.lpPct}% LP</span>
                            )}
                            {holder.tradedPct === 0 && (
                              <span className={isDark ? 'text-white/25' : 'text-gray-400'}>Transfer</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-center">
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
            className={cn(
              'p-1.5 rounded-md transition-colors',
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
            className={cn(
              'p-1.5 rounded-md transition-colors',
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
