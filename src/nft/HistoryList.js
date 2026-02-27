import api from 'src/utils/api';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ExternalLink,
  TrendingUp,
  Users,
  Zap,
  Award,
  DollarSign,
  Sparkles,
  ArrowUpRight,
  Flame,
  Tag,
  List,
  X,
  MessageCircle
} from 'lucide-react';
import { fNumber } from 'src/utils/formatters';
import { cn } from 'src/utils/cn';

const TYPE_CONFIG = {
  SALE: { label: 'Sale', Icon: DollarSign },
  MINT: { label: 'Mint', Icon: Sparkles },
  TRANSFER: { label: 'Transfer', Icon: ArrowUpRight },
  BURN: { label: 'Burn', Icon: Flame },
  CREATE_BUY_OFFER: { label: 'Bid', Icon: Tag },
  CREATE_SELL_OFFER: { label: 'List', Icon: List },
  CANCEL_BUY_OFFER: { label: 'Cancel', Icon: X },
  CANCEL_SELL_OFFER: { label: 'Delist', Icon: X }
};

const formatAddr = (addr) => (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '');

const getDateGroup = (timestamp) => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return 'This Week';
  if (diffDays < 30) return 'This Month';
  if (diffDays < 90) return 'Last 3 Months';
  return 'Older';
};

const formatRelativeTime = (ts) => {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function HistoryList({ nft }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    if (!nft?.NFTokenID) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .get(`https://api.xrpl.to/v1/nft/history?NFTokenID=${nft.NFTokenID}&limit=200`)
      .then((res) => {
        if (res.data?.histories) {
          setHistory(res.data.histories);
        }
      })
      .catch((err) => {
        console.error('[HistoryList] Failed to fetch history:', err);
      })
      .finally(() => setLoading(false));
  }, [nft?.NFTokenID]);

  const stats = useMemo(() => {
    const sales = history.filter((h) => h.type === 'SALE');
    const totalVolume = sales.reduce((sum, h) => sum + (h.costXRP || 0), 0);
    const highestSale = Math.max(...sales.map((h) => h.costXRP || 0), 0);

    const owners = new Set();
    history.forEach((h) => {
      if (h.type === 'MINT' && h.account) owners.add(h.account);
      else if (h.type === 'SALE' && h.buyer) owners.add(h.buyer);
      else if (h.type === 'TRANSFER' && h.buyer) owners.add(h.buyer);
    });

    let currentOwner = null;
    for (const h of history) {
      if ((h.type === 'SALE' || h.type === 'TRANSFER') && h.buyer) {
        currentOwner = h.buyer;
        break;
      }
      if (h.type === 'MINT') currentOwner = h.account;
    }

    const lastList = history.find((h) => h.type === 'CREATE_SELL_OFFER');
    const lastSale = history.find((h) => h.type === 'SALE');
    const listPrice = lastList?.costXRP || lastList?.amountXRP || 0;
    const salePrice = lastSale?.costXRP || 0;
    const priceDiff = salePrice > 0 ? ((listPrice - salePrice) / salePrice) * 100 : 0;

    const mintEvent = [...history].reverse().find((h) => h.type === 'MINT');
    const mintDate = mintEvent?.time || null;

    return {
      salesCount: sales.length,
      totalVolume,
      highestSale,
      uniqueOwners: owners.size,
      currentOwner,
      listPrice,
      salePrice,
      priceDiff,
      mintDate
    };
  }, [history]);

  const availableTypes = useMemo(() => {
    const types = new Set(history.map((h) => h.type));
    return Array.from(types);
  }, [history]);

  const { filtered, grouped } = useMemo(() => {
    const filteredItems =
      activeFilter === 'all' ? history : history.filter((h) => h.type === activeFilter);

    const groups = {};
    filteredItems.forEach((item) => {
      const group = getDateGroup(item.time);
      if (!groups[group]) groups[group] = [];
      groups[group].push(item);
    });

    return { filtered: filteredItems, grouped: groups };
  }, [history, activeFilter]);

  const groupOrder = ['Today', 'Yesterday', 'This Week', 'This Month', 'Last 3 Months', 'Older'];

  if (loading) {
    return (
      <div
        className={cn(
          'rounded-xl border-[1.5px] overflow-hidden',
          'border-gray-200 bg-white dark:border-white/10 dark:bg-black'
        )}
      >
        <div className="p-4">
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(
                  'h-14 rounded-lg animate-pulse',
                  'bg-gray-100 dark:bg-white/[0.03]'
                )}
              />
            ))}
          </div>
          <div className="space-y-1.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  'h-12 rounded-lg animate-pulse',
                  'bg-gray-50 dark:bg-white/[0.02]'
                )}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!history.length) {
    return (
      <div
        className={cn(
          'rounded-xl border-[1.5px] overflow-hidden',
          'border-gray-200 bg-white dark:border-white/10 dark:bg-black'
        )}
      >
        <div className="py-12 text-center">
          <div
            className={cn(
              'w-10 h-10 mx-auto mb-3 rounded-lg flex items-center justify-center',
              'bg-gray-100 dark:bg-white/5'
            )}
          >
            <Zap size={18} className="text-gray-500 dark:text-white/60" />
          </div>
          <p className={cn('text-sm', 'text-gray-500 dark:text-white/60')}>
            No activity yet
          </p>
          <p className={cn('text-xs mt-1', 'text-gray-400 dark:text-white/60')}>
            History will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl border-[1.5px] overflow-hidden',
        'border-gray-200 bg-white dark:border-white/10 dark:bg-black'
      )}
    >
      {/* Stats Grid */}
      {stats.salesCount > 0 && (
        <div className={cn('p-3 border-b', 'border-gray-200 dark:border-white/10')}>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Zap, label: 'Sales', value: stats.salesCount },
              { icon: TrendingUp, label: 'Volume', value: fNumber(stats.totalVolume), suffix: 'XRP' },
              { icon: Award, label: 'Highest', value: fNumber(stats.highestSale), suffix: 'XRP' },
              { icon: Users, label: 'Owners', value: stats.uniqueOwners }
            ].map(({ icon: Icon, label, value, suffix }) => (
              <div
                key={label}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg',
                  'bg-gray-50 dark:bg-white/[0.03]'
                )}
              >
                <div
                  className={cn(
                    'w-7 h-7 rounded-md flex items-center justify-center shrink-0',
                    'bg-gray-200 dark:bg-white/[0.06]'
                  )}
                >
                  <Icon size={13} className="text-gray-500 dark:text-white/60" />
                </div>
                <div className="min-w-0">
                  <p
                    className={cn(
                      'text-xs font-semibold tabular-nums leading-tight',
                      'text-gray-900 dark:text-white'
                    )}
                  >
                    {value}
                    {suffix && (
                      <span className={cn('ml-1 font-normal', 'text-gray-400 dark:text-white/60')}>
                        {suffix}
                      </span>
                    )}
                  </p>
                  <p className={cn('text-[10px] leading-tight', 'text-gray-500 dark:text-white/60')}>
                    {label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Secondary stats row */}
          {(stats.salePrice > 0 || stats.listPrice > 0 || stats.mintDate) && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {stats.salePrice > 0 && (
                <div
                  className={cn(
                    'flex items-center justify-between px-3 py-2 rounded-lg',
                    'bg-gray-50 dark:bg-white/[0.03]'
                  )}
                >
                  <span className={cn('text-[10px]', 'text-gray-500 dark:text-white/60')}>
                    Last Sale
                  </span>
                  <span
                    className={cn(
                      'text-[11px] tabular-nums font-semibold',
                      'text-gray-900 dark:text-white'
                    )}
                  >
                    {fNumber(stats.salePrice)} XRP
                  </span>
                </div>
              )}
              {stats.listPrice > 0 && (
                <div
                  className={cn(
                    'flex items-center justify-between px-3 py-2 rounded-lg',
                    'bg-gray-50 dark:bg-white/[0.03]'
                  )}
                >
                  <span className={cn('text-[10px]', 'text-gray-500 dark:text-white/60')}>
                    Last List
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'text-[11px] tabular-nums font-semibold',
                        'text-gray-900 dark:text-white'
                      )}
                    >
                      {fNumber(stats.listPrice)} XRP
                    </span>
                    {stats.salePrice > 0 && (
                      <span
                        className={cn(
                          'text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded',
                          stats.priceDiff >= 0
                            ? 'text-emerald-400 bg-emerald-500/10'
                            : 'text-red-400 bg-red-500/10'
                        )}
                      >
                        {stats.priceDiff >= 0 ? '+' : ''}
                        {stats.priceDiff.toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
              )}
              {stats.mintDate && (
                <div
                  className={cn(
                    'flex items-center justify-between px-3 py-2 rounded-lg',
                    'bg-gray-50 dark:bg-white/[0.03]'
                  )}
                >
                  <span className={cn('text-[10px]', 'text-gray-500 dark:text-white/60')}>
                    Minted
                  </span>
                  <span
                    className={cn(
                      'text-[11px] tabular-nums font-medium',
                      'text-gray-700 dark:text-white/60'
                    )}
                  >
                    {new Date(stats.mintDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Filter Pills */}
      <div className={cn('px-3 py-2 border-b', 'border-gray-200 dark:border-white/10')}>
        <div className="flex items-center gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setActiveFilter('all')}
            className={cn(
              'px-2.5 py-1 rounded-md text-[11px] font-medium transition-[border-color,color,background-color] whitespace-nowrap',
              activeFilter === 'all'
                ? 'bg-gray-900 text-white dark:bg-white/10 dark:text-white'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-white/60 dark:hover:text-white/70 dark:hover:bg-white/[0.04]'
            )}
          >
            All {history.length}
          </button>
          {availableTypes.map((type) => {
            const config = TYPE_CONFIG[type] || { label: type };
            const count = history.filter((h) => h.type === type).length;
            return (
              <button
                key={type}
                onClick={() => setActiveFilter(activeFilter === type ? 'all' : type)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[11px] font-medium transition-[border-color,color,background-color] whitespace-nowrap',
                  activeFilter === type
                    ? 'bg-gray-900 text-white dark:bg-white/10 dark:text-white'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-white/60 dark:hover:text-white/70 dark:hover:bg-white/[0.04]'
                )}
              >
                {config.label} {count}
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      <div className="max-h-[420px] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {filtered.length === 0 ? (
          <div className="py-10 text-center">
            <p className={cn('text-sm', 'text-gray-500 dark:text-white/60')}>
              No {TYPE_CONFIG[activeFilter]?.label || activeFilter} events
            </p>
            <button
              onClick={() => setActiveFilter('all')}
              className="mt-2 text-[11px] text-[#137DFE] hover:underline"
            >
              Show all events
            </button>
          </div>
        ) : (
          <div className="p-2">
            {groupOrder.map((groupName) => {
              const items = grouped[groupName];
              if (!items || items.length === 0) return null;

              return (
                <div key={groupName} className="mb-2 last:mb-0">
                  {/* Date Group Header */}
                  <div className="flex items-center gap-2 px-2 py-1.5">
                    <span
                      className={cn(
                        'text-[10px] font-medium uppercase tracking-wider',
                        'text-gray-400 dark:text-white/60'
                      )}
                    >
                      {groupName}
                    </span>
                    <div className={cn('flex-1 h-px', 'bg-gray-100 dark:bg-white/5')} />
                    <span
                      className={cn(
                        'text-[10px] tabular-nums',
                        'text-gray-300 dark:text-white/60'
                      )}
                    >
                      {items.length}
                    </span>
                  </div>

                  {/* Items - Table-like rows */}
                  <div className="space-y-px">
                    {items.map((item, idx) => {
                      const config = TYPE_CONFIG[item.type] || {
                        label: item.type,
                        Icon: Zap
                      };
                      const from = item.seller || item.account;
                      const to = item.buyer;
                      const price = item.costXRP || item.amountXRP;
                      const isCancelled =
                        item.type === 'CANCEL_BUY_OFFER' || item.type === 'CANCEL_SELL_OFFER';
                      const isSpend = item.type === 'SALE' || item.type === 'CREATE_BUY_OFFER';
                      const isReceive = item.type === 'CREATE_SELL_OFFER';
                      const isOwnershipChange =
                        item.type === 'SALE' || item.type === 'TRANSFER' || item.type === 'MINT';

                      return (
                        <div
                          key={item._id || item.hash || idx}
                          className={cn(
                            'group grid grid-cols-[28px_1fr_1fr_1fr_auto] items-center gap-2 px-2 py-2 rounded-lg transition-[background-color]',
                            isOwnershipChange
                              ? 'bg-gray-50 hover:bg-gray-100 dark:bg-white/[0.02] dark:hover:bg-white/[0.05]'
                              : 'hover:bg-gray-50 dark:hover:bg-white/[0.03]'
                          )}
                        >
                          {/* Col 1: Icon */}
                          <div
                            className={cn(
                              'w-7 h-7 rounded-md flex items-center justify-center',
                              'bg-gray-100 dark:bg-white/[0.06]'
                            )}
                          >
                            <config.Icon
                              size={13}
                              className="text-gray-500 dark:text-white/60"
                            />
                          </div>

                          {/* Col 2: Event label */}
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className={cn(
                                'text-[11px] font-semibold',
                                'text-gray-700 dark:text-white/70'
                              )}
                            >
                              {config.label}
                            </span>
                            {isOwnershipChange && (
                              <div
                                className={cn(
                                  'w-1.5 h-1.5 rounded-full shrink-0',
                                  'bg-gray-400 dark:bg-white/20'
                                )}
                              />
                            )}
                          </div>

                          {/* Col 3: Price */}
                          <div className="flex items-center justify-center">
                            {price > 0 ? (
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold tabular-nums',
                                  isCancelled
                                    ? 'text-gray-400 line-through dark:text-white/60'
                                    : isSpend
                                      ? 'text-emerald-400'
                                      : isReceive
                                        ? 'text-[#137DFE]'
                                        : 'text-gray-800 dark:text-white/70'
                                )}
                              >
                                {fNumber(price)} XRP
                              </span>
                            ) : (
                              <span className={cn('text-[11px]', 'text-gray-300 dark:text-white/10')}>
                                --
                              </span>
                            )}
                          </div>

                          {/* Col 4: Addresses */}
                          <div className="flex items-center gap-1 text-[10px] min-w-0 justify-center">
                            {from && (
                              <Link
                                href={`/address/${from}`}
                                className={cn(
                                  'font-mono transition-[background-color] truncate',
                                  from === stats.currentOwner
                                    ? 'text-gray-900 font-semibold dark:text-white dark:font-semibold'
                                    : 'text-gray-400 hover:text-gray-700 dark:text-white/60 dark:hover:text-white/70'
                                )}
                              >
                                {formatAddr(from)}
                              </Link>
                            )}
                            {to && (
                              <>
                                <span className="text-gray-300 dark:text-white/60">
                                  {'->'}
                                </span>
                                <Link
                                  href={`/address/${to}`}
                                  className={cn(
                                    'font-mono transition-[background-color] truncate',
                                    to === stats.currentOwner
                                      ? 'text-gray-900 font-semibold dark:text-white dark:font-semibold'
                                      : 'text-gray-400 hover:text-gray-700 dark:text-white/60 dark:hover:text-white/70'
                                  )}
                                >
                                  {formatAddr(to)}
                                </Link>
                              </>
                            )}
                            {!from && !to && (
                              <span className={cn('text-[10px]', 'text-gray-300 dark:text-white/10')}>
                                --
                              </span>
                            )}
                            {(from || to) && (
                              <button
                                onClick={() => window.dispatchEvent(new CustomEvent('openDm', { detail: { user: to || from } }))}
                                className={cn('p-0.5 rounded hover:bg-white/10 hover:text-[#650CD4] transition-[background-color] opacity-0 group-hover:opacity-100', 'text-gray-500 dark:text-white/60')}
                                title="Message"
                              >
                                <MessageCircle size={11} />
                              </button>
                            )}
                          </div>

                          {/* Col 5: Time + Link */}
                          <div className="flex items-center gap-1 shrink-0 justify-end min-w-[70px]">
                            <span
                              className={cn(
                                'text-[10px] tabular-nums',
                                'text-gray-400 dark:text-white/60'
                              )}
                            >
                              {formatRelativeTime(item.time)}
                            </span>
                            {item.hash && (
                              <Link
                                href={`/tx/${item.hash}`}
                                target="_blank"
                                aria-label={`View transaction ${item.hash.slice(0, 8)}`}
                                className={cn(
                                  'p-0.5 rounded transition-[border-color,color,background-color] opacity-0 group-hover:opacity-100',
                                  'text-gray-300 hover:text-gray-600 dark:text-white/60 dark:hover:text-white/60'
                                )}
                              >
                                <ExternalLink size={10} />
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
