import axios from 'axios';
import { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { AppContext } from 'src/AppContext';
import { cn } from 'src/utils/cn';
import { fNumber } from 'src/utils/formatters';

const TYPE_CONFIG = {
  SALE: { label: 'Sale', color: '#10b981' },
  MINT: { label: 'Mint', color: '#8b5cf6' },
  TRANSFER: { label: 'Transfer', color: '#3b82f6' },
  BURN: { label: 'Burn', color: '#ef4444' },
  CREATE_BUY_OFFER: { label: 'Bid', color: '#6b7280' },
  CREATE_SELL_OFFER: { label: 'List', color: '#6b7280' },
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
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!nft?.NFTokenID) return;
    setLoading(true);
    axios.get(`https://api.xrpl.to/api/nft/history?NFTokenID=${nft.NFTokenID}&limit=50`)
      .then(res => {
        if (res.data?.result === 'success') setHistory(res.data.histories || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [nft?.NFTokenID]);

  const keyEvents = ['SALE', 'MINT', 'TRANSFER', 'BURN'];
  const filtered = showAll ? history : history.filter(h => keyEvents.includes(h.type));
  const hasHidden = history.length > filtered.length;

  if (loading) {
    return (
      <div className={cn('rounded-xl border p-4', isDark ? 'border-white/10' : 'border-gray-200')}>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className={cn('h-12 rounded-lg animate-pulse', isDark ? 'bg-white/5' : 'bg-gray-100')} />
          ))}
        </div>
      </div>
    );
  }

  if (!history.length) {
    return (
      <div className={cn('rounded-xl border py-8 text-center', isDark ? 'border-white/10' : 'border-gray-200')}>
        <p className={cn('text-sm', isDark ? 'text-gray-500' : 'text-gray-400')}>No history yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {hasHidden && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowAll(!showAll)}
            className={cn(
              'text-[12px] px-2.5 py-1 rounded-lg border',
              isDark ? 'border-white/10 text-gray-400 hover:text-white' : 'border-gray-200 text-gray-500 hover:text-gray-900'
            )}
          >
            {showAll ? 'Key Events' : 'Show All'}
          </button>
        </div>
      )}

      <div className={cn('rounded-xl border overflow-hidden', isDark ? 'border-white/10' : 'border-gray-200')}>
        <div className="max-h-[320px] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          {filtered.map((item) => {
            const config = TYPE_CONFIG[item.type] || { label: item.type, color: '#6b7280' };
            const from = item.seller || item.account;
            const to = item.buyer;

            return (
              <div
                key={item._id || item.hash}
                className={cn('px-3 py-2.5 border-b last:border-b-0', isDark ? 'border-white/5' : 'border-gray-100')}
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Left: Type + Addresses */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-md shrink-0"
                      style={{ backgroundColor: `${config.color}15`, color: config.color }}
                    >
                      {config.label}
                    </span>

                    <div className="flex items-center gap-1 text-[12px] font-mono truncate">
                      {from && (
                        <Link href={`/profile/${from}`} className={cn('hover:underline', isDark ? 'text-gray-400' : 'text-gray-600')}>
                          {formatAddr(from)}
                        </Link>
                      )}
                      {to && (
                        <>
                          <span className={isDark ? 'text-gray-600' : 'text-gray-300'}>→</span>
                          <Link href={`/profile/${to}`} className={cn('hover:underline', isDark ? 'text-gray-400' : 'text-gray-600')}>
                            {formatAddr(to)}
                          </Link>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: Price + Time + Link */}
                  <div className="flex items-center gap-3 shrink-0">
                    {/* Sale with breakdown */}
                    {item.type === 'SALE' && item.costXRP > 0 && (
                      <div className="text-right">
                        <span className={cn('text-[13px] font-mono', isDark ? 'text-white' : 'text-gray-900')}>
                          {fNumber(item.costXRP)} XRP
                        </span>
                        <div className={cn('text-[10px] space-x-2', isDark ? 'text-gray-600' : 'text-gray-400')}>
                          {item.royaltyAmountXRP > 0 && <span>Royalty: {fNumber(item.royaltyAmountXRP)}</span>}
                          {item.brokerFeeXRP > 0 && <span>Fee: {fNumber(item.brokerFeeXRP)}</span>}
                          {item.origin && <span>via {item.origin}</span>}
                        </div>
                      </div>
                    )}

                    {/* Offer amounts for Bid/List */}
                    {(item.type === 'CREATE_BUY_OFFER' || item.type === 'CREATE_SELL_OFFER') && item.amountXRP > 0 && (
                      <span className={cn('text-[13px] font-mono', isDark ? 'text-gray-400' : 'text-gray-600')}>
                        {fNumber(item.amountXRP)} XRP
                      </span>
                    )}

                    {/* Cancel offers - show cancelled amount with strikethrough */}
                    {(item.type === 'CANCEL_BUY_OFFER' || item.type === 'CANCEL_SELL_OFFER') && item.amountXRP > 0 && (
                      <span className={cn('text-[12px] font-mono line-through', isDark ? 'text-gray-600' : 'text-gray-400')}>
                        {fNumber(item.amountXRP)} XRP
                      </span>
                    )}

                    <span className={cn('text-[11px] w-10 text-right', isDark ? 'text-gray-600' : 'text-gray-400')}>
                      {formatTime(item.time)}
                    </span>

                    {item.hash && (
                      <a
                        href={`https://xrpscan.com/tx/${item.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn('p-1 rounded hover:bg-white/5', isDark ? 'text-gray-600 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600')}
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
