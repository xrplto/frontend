import axios from 'axios';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ExternalLink, TrendingUp, Users, Zap, Award, DollarSign, Sparkles, ArrowUpRight, Flame, Tag, List, X } from 'lucide-react';
import { fNumber } from 'src/utils/formatters';
import { cn } from 'src/utils/cn';

const TYPE_CONFIG = {
  SALE: { label: 'Sale', color: '#e5e5e5', Icon: DollarSign },
  MINT: { label: 'Mint', color: '#a3a3a3', Icon: Sparkles },
  TRANSFER: { label: 'Transfer', color: '#a3a3a3', Icon: ArrowUpRight },
  BURN: { label: 'Burn', color: '#737373', Icon: Flame },
  CREATE_BUY_OFFER: { label: 'Bid', color: '#a3a3a3', Icon: Tag },
  CREATE_SELL_OFFER: { label: 'List', color: '#a3a3a3', Icon: List },
  CANCEL_BUY_OFFER: { label: 'Cancel', color: '#525252', Icon: X },
  CANCEL_SELL_OFFER: { label: 'Delist', color: '#525252', Icon: X }
};

const formatAddr = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

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
    if (!nft?.NFTokenID) return;
    setLoading(true);
    axios.get(`https://api.xrpl.to/api/nft/history?NFTokenID=${nft.NFTokenID}&limit=200`)
      .then(res => {
        if (res.data?.result === 'success') setHistory(res.data.histories || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [nft?.NFTokenID]);

  // Calculate stats
  const stats = useMemo(() => {
    const sales = history.filter(h => h.type === 'SALE');
    const totalVolume = sales.reduce((sum, h) => sum + (h.costXRP || 0), 0);
    const highestSale = Math.max(...sales.map(h => h.costXRP || 0), 0);

    // Count unique owners - only people who actually held the NFT
    const owners = new Set();
    history.forEach(h => {
      if (h.type === 'MINT' && h.account) {
        owners.add(h.account); // Minter is first owner
      } else if (h.type === 'SALE' && h.buyer) {
        owners.add(h.buyer); // Sale buyer becomes owner
      } else if (h.type === 'TRANSFER' && h.buyer) {
        owners.add(h.buyer); // Transfer recipient becomes owner
      }
    });

    // Current owner is from most recent SALE/TRANSFER, or minter if never sold
    let currentOwner = null;
    for (const h of history) {
      if ((h.type === 'SALE' || h.type === 'TRANSFER') && h.buyer) {
        currentOwner = h.buyer;
        break;
      }
      if (h.type === 'MINT') currentOwner = h.account;
    }

    // Last list price vs last sale
    const lastList = history.find(h => h.type === 'CREATE_SELL_OFFER');
    const lastSale = history.find(h => h.type === 'SALE');
    const listPrice = lastList?.costXRP || lastList?.amountXRP || 0;
    const salePrice = lastSale?.costXRP || 0;
    const priceDiff = salePrice > 0 ? ((listPrice - salePrice) / salePrice) * 100 : 0;

    // Mint date
    const mintEvent = [...history].reverse().find(h => h.type === 'MINT');
    const mintDate = mintEvent?.time || null;

    return { salesCount: sales.length, totalVolume, highestSale, uniqueOwners: owners.size, currentOwner, listPrice, salePrice, priceDiff, mintDate };
  }, [history]);

  // Get unique event types present in history
  const availableTypes = useMemo(() => {
    const types = new Set(history.map(h => h.type));
    return Array.from(types);
  }, [history]);

  // Filter and group history
  const { filtered, grouped } = useMemo(() => {
    const filteredItems = activeFilter === 'all' ? history : history.filter(h => h.type === activeFilter);

    const groups = {};
    filteredItems.forEach(item => {
      const group = getDateGroup(item.time);
      if (!groups[group]) groups[group] = [];
      groups[group].push(item);
    });

    return { filtered: filteredItems, grouped: groups };
  }, [history, activeFilter]);

  const groupOrder = ['Today', 'Yesterday', 'This Week', 'This Month', 'Last 3 Months', 'Older'];

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-800/60 overflow-hidden bg-gradient-to-b from-gray-900/50 to-black/50">
        <div className="p-4">
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 rounded-xl bg-white/[0.03] animate-pulse" />
            ))}
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 rounded-xl animate-pulse bg-white/[0.02]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!history.length) {
    return (
      <div className="rounded-2xl border border-gray-800/60 overflow-hidden bg-gradient-to-b from-gray-900/50 to-black/50">
        <div className="py-12 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center">
            <Zap size={20} className="text-gray-600" />
          </div>
          <p className="text-sm text-gray-500">No activity yet</p>
          <p className="text-xs text-gray-600 mt-1">History will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-800 overflow-hidden bg-neutral-950">
      {/* Stats Summary */}
      {stats.salesCount > 0 && (
        <div className="p-3 border-b border-neutral-800">
          <div className="grid grid-cols-4 gap-1.5">
            <div className="text-center p-2 rounded-lg bg-neutral-900">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Zap size={11} className="text-neutral-500" />
                <span className="text-sm font-medium text-white tabular-nums">{stats.salesCount}</span>
              </div>
              <p className="text-[9px] uppercase tracking-wide text-neutral-600">Sales</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-neutral-900">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <TrendingUp size={11} className="text-neutral-500" />
                <span className="text-sm font-medium text-white tabular-nums">{fNumber(stats.totalVolume)}</span>
              </div>
              <p className="text-[9px] uppercase tracking-wide text-neutral-600">Volume</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-neutral-900">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Award size={11} className="text-neutral-500" />
                <span className="text-sm font-medium text-white tabular-nums">{fNumber(stats.highestSale)}</span>
              </div>
              <p className="text-[9px] uppercase tracking-wide text-neutral-600">ATH</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-neutral-900">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Users size={11} className="text-neutral-500" />
                <span className="text-sm font-medium text-white tabular-nums">{stats.uniqueOwners}</span>
              </div>
              <p className="text-[9px] uppercase tracking-wide text-neutral-600">Owners</p>
            </div>
          </div>
          {/* List vs Last Sale + Mint Date */}
          <div className="mt-2 flex items-center gap-2">
            {stats.listPrice > 0 && stats.salePrice > 0 && (
              <div className="flex-1 flex items-center justify-between px-2 py-1.5 rounded-lg bg-neutral-900">
                <span className="text-[10px] text-neutral-500">List vs Sale</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-neutral-400 tabular-nums">{fNumber(stats.listPrice)} / {fNumber(stats.salePrice)}</span>
                  <span className={cn(
                    "text-[10px] font-medium tabular-nums px-1.5 py-0.5 rounded",
                    stats.priceDiff >= 0 ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"
                  )}>
                    {stats.priceDiff >= 0 ? '+' : ''}{stats.priceDiff.toFixed(0)}%
                  </span>
                </div>
              </div>
            )}
            {stats.mintDate && (
              <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-neutral-900">
                <span className="text-[10px] text-neutral-500 mr-2">Minted</span>
                <span className="text-[11px] text-neutral-400">{new Date(stats.mintDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filter Pills */}
      <div className="px-3 py-2 border-b border-neutral-800">
        <div className="flex items-center gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setActiveFilter('all')}
            className={cn(
              "px-2.5 py-1 rounded text-[10px] font-medium transition-all whitespace-nowrap border",
              activeFilter === 'all'
                ? "bg-white/10 text-white/90 border-white/15"
                : "text-white/50 border-white/10 hover:text-white/70 hover:bg-white/[0.06]"
            )}
          >
            All {history.length}
          </button>
          {availableTypes.map(type => {
            const config = TYPE_CONFIG[type] || { label: type, color: '#737373' };
            const count = history.filter(h => h.type === type).length;
            return (
              <button
                key={type}
                onClick={() => setActiveFilter(activeFilter === type ? 'all' : type)}
                className={cn(
                  "px-2.5 py-1 rounded text-[10px] font-medium transition-all whitespace-nowrap border",
                  activeFilter === type ? "bg-white/10 text-white/90 border-white/15" : "text-white/50 border-white/10 hover:text-white/70 hover:bg-white/[0.06]"
                )}
              >
                {config.label} {count}
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline List */}
      <div className="max-h-[420px] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {filtered.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-gray-500">No {TYPE_CONFIG[activeFilter]?.label || activeFilter} events</p>
            <button
              onClick={() => setActiveFilter('all')}
              className="mt-2 text-[11px] text-primary hover:underline"
            >
              Show all events
            </button>
          </div>
        ) : (
          <div className="p-3 space-y-3">
            {groupOrder.map(groupName => {
              const items = grouped[groupName];
              if (!items || items.length === 0) return null;

              return (
                <div key={groupName}>
                  {/* Date Group Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[9px] font-medium uppercase tracking-wider text-neutral-600">{groupName}</span>
                    <div className="flex-1 h-px bg-neutral-800" />
                  </div>

                  {/* Items */}
                  <div className="space-y-1">
                    {items.map((item, idx) => {
                      const config = TYPE_CONFIG[item.type] || { label: item.type, color: '#6b7280', Icon: Zap };
                      const from = item.seller || item.account;
                      const to = item.buyer;
                      const price = item.costXRP || item.amountXRP;
                      const isCancelled = item.type === 'CANCEL_BUY_OFFER' || item.type === 'CANCEL_SELL_OFFER';
                      const isOwnershipChange = item.type === 'SALE' || item.type === 'TRANSFER' || item.type === 'MINT';

                      return (
                        <div
                          key={item._id || item.hash || idx}
                          className={cn(
                            "group relative flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all",
                            isOwnershipChange
                              ? "bg-neutral-900/50 border-l-2 border-l-neutral-600 hover:bg-neutral-800/50"
                              : "hover:bg-neutral-900/50"
                          )}
                        >
                          {/* Icon */}
                          <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 bg-neutral-800">
                            <config.Icon size={14} className="text-neutral-400" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              {/* Event + Price */}
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-medium text-neutral-400">
                                  {config.label}
                                </span>
                                {price > 0 && (
                                  <span className={cn(
                                    "text-[12px] font-medium tabular-nums",
                                    isCancelled ? "text-neutral-600 line-through" : "text-white"
                                  )}>
                                    {fNumber(price)} XRP
                                  </span>
                                )}
                              </div>
                              {/* Address */}
                              <div className="flex items-center gap-1 text-[10px] mt-0.5">
                                {from && (
                                  <Link
                                    href={`/address/${from}`}
                                    className={cn(
                                      "hover:text-white transition-colors font-mono",
                                      from === stats.currentOwner ? "text-white" : "text-neutral-500"
                                    )}
                                  >
                                    {formatAddr(from)}{from === stats.currentOwner && ' ·owner'}
                                  </Link>
                                )}
                                {to && (
                                  <>
                                    <span className="text-neutral-700">→</span>
                                    <Link
                                      href={`/address/${to}`}
                                      className={cn(
                                        "hover:text-white transition-colors font-mono",
                                        to === stats.currentOwner ? "text-white" : "text-neutral-500"
                                      )}
                                    >
                                      {formatAddr(to)}{to === stats.currentOwner && ' ·owner'}
                                    </Link>
                                  </>
                                )}
                              </div>
                            </div>
                            {/* Time */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] text-neutral-600 tabular-nums">
                                {formatRelativeTime(item.time)}
                              </span>
                              {item.hash && (
                                <Link
                                  href={`/tx/${item.hash}`}
                                  target="_blank"
                                  className="p-1 rounded text-neutral-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                >
                                  <ExternalLink size={11} />
                                </Link>
                              )}
                            </div>
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
