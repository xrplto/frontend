import axios from 'axios';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { fNumber } from 'src/utils/formatters';
import { cn } from 'src/utils/cn';

const TYPE_CONFIG = {
  SALE: { label: 'Sale', color: '#10b981' },
  MINT: { label: 'Mint', color: '#8b5cf6' },
  TRANSFER: { label: 'Transfer', color: '#3b82f6' },
  BURN: { label: 'Burn', color: '#ef4444' },
  CREATE_BUY_OFFER: { label: 'Bid', color: '#f59e0b' },
  CREATE_SELL_OFFER: { label: 'List', color: '#06b6d4' },
  CANCEL_BUY_OFFER: { label: 'Cancel Bid', color: '#6b7280' },
  CANCEL_SELL_OFFER: { label: 'Delist', color: '#6b7280' }
};

const formatAddr = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

const formatTime = (ts) => {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
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

  // Get unique event types present in history
  const availableTypes = useMemo(() => {
    const types = new Set(history.map(h => h.type));
    return Array.from(types);
  }, [history]);

  // Filter history based on active filter
  const filtered = useMemo(() => {
    if (activeFilter === 'all') return history;
    return history.filter(h => h.type === activeFilter);
  }, [history, activeFilter]);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-700/50 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-700/30 bg-white/[0.02]">
          <div className="h-4 w-16 rounded bg-white/5 animate-pulse" />
        </div>
        <div className="p-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 rounded-lg animate-pulse bg-white/[0.03] mb-1 last:mb-0" />
          ))}
        </div>
      </div>
    );
  }

  if (!history.length) {
    return (
      <div className="rounded-xl border border-gray-700/50 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-700/30 bg-white/[0.02]">
          <span className="text-[11px] text-gray-500">0 events</span>
        </div>
        <div className="py-6 text-center">
          <p className="text-sm text-gray-500">No history yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-700/50 overflow-hidden">
      {/* Header with Filter Chips */}
      <div className="px-4 py-2.5 border-b border-gray-700/30 bg-white/[0.02]">
        <div className="mb-2">
          <span className="text-[11px] text-gray-500">{filtered.length} of {history.length} events</span>
        </div>
        {/* Filter Chips */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveFilter('all')}
            className={cn(
              "px-2 py-0.5 rounded text-[10px] font-normal transition-colors",
              activeFilter === 'all'
                ? "bg-white/10 text-white"
                : "bg-white/5 text-gray-500 hover:text-gray-400"
            )}
          >
            All
          </button>
          {availableTypes.map(type => {
            const config = TYPE_CONFIG[type] || { label: type, color: '#6b7280' };
            const count = history.filter(h => h.type === type).length;
            return (
              <button
                key={type}
                onClick={() => setActiveFilter(activeFilter === type ? 'all' : type)}
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-normal transition-colors flex items-center gap-1",
                  activeFilter === type
                    ? "text-white"
                    : "text-gray-500 hover:text-gray-400"
                )}
                style={{
                  backgroundColor: activeFilter === type ? `${config.color}30` : 'rgba(255,255,255,0.03)'
                }}
              >
                <span style={{ color: activeFilter === type ? config.color : undefined }}>{config.label}</span>
                <span className="text-gray-600">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* List View */}
      <div className="max-h-[400px] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {filtered.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-gray-500">No {TYPE_CONFIG[activeFilter]?.label || activeFilter} events</p>
            <button
              onClick={() => setActiveFilter('all')}
              className="mt-2 text-[11px] text-gray-400 hover:text-gray-300"
            >
              Show all events
            </button>
          </div>
        ) : filtered.map((item) => {
          const config = TYPE_CONFIG[item.type] || { label: item.type, color: '#6b7280' };
          const from = item.seller || item.account;
          const to = item.buyer;

          return (
            <div
              key={item._id || item.hash}
              className="px-4 py-2.5 border-b last:border-b-0 border-gray-700/30"
            >
              <div className="flex items-center justify-between gap-3">
                {/* Left: Type + Address */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span
                    className="text-[10px] px-2 py-0.5 rounded shrink-0 font-normal min-w-[48px] text-center"
                    style={{ backgroundColor: `${config.color}20`, color: config.color }}
                  >
                    {config.label}
                  </span>
                  <span className="text-[12px] font-mono text-gray-400 truncate">
                    {from && formatAddr(from)}
                    {to && <span className="text-gray-600"> → {formatAddr(to)}</span>}
                  </span>
                </div>

                {/* Right: Price + Time + Link */}
                <div className="flex items-center gap-3 shrink-0">
                  {item.type === 'SALE' && item.costXRP > 0 && (
                    <span className="text-[13px] font-mono text-white tabular-nums">
                      {fNumber(item.costXRP)} XRP
                    </span>
                  )}
                  {(item.type === 'CREATE_BUY_OFFER' || item.type === 'CREATE_SELL_OFFER') && item.amountXRP > 0 && (
                    <span className="text-[13px] font-mono text-gray-400 tabular-nums">
                      {fNumber(item.amountXRP)} XRP
                    </span>
                  )}
                  {(item.type === 'CANCEL_BUY_OFFER' || item.type === 'CANCEL_SELL_OFFER') && item.amountXRP > 0 && (
                    <span className="text-[12px] font-mono line-through text-gray-600 tabular-nums">
                      {fNumber(item.amountXRP)} XRP
                    </span>
                  )}
                  <span className="text-[11px] w-8 text-right text-gray-500 tabular-nums">
                    {formatTime(item.time)}
                  </span>
                  {item.hash && (
                    <Link href={`/tx/${item.hash}`} className="text-gray-600 hover:text-gray-400 transition-colors">
                      <ExternalLink size={12} />
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
}
