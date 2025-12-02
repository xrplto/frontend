import axios from 'axios';
import { useState, useEffect, useContext } from 'react';
import { ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from 'src/utils/cn';
import { AppContext } from 'src/AppContext';
import { fNumber } from 'src/utils/formatters';

// Compact Pagination Component
function Pagination({ total, page, setPage, isDark }) {
  const pageCount = Math.ceil(total / 20);
  if (pageCount <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-1 pt-4">
      <button
        onClick={() => setPage(Math.max(0, page - 1))}
        disabled={page === 0}
        className={cn(
          "p-1.5 rounded-md transition-colors",
          page === 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-primary/10",
          isDark ? "text-white/50" : "text-gray-500"
        )}
      >
        <ChevronLeft size={14} />
      </button>
      <span className={cn("text-[11px] px-2", isDark ? "text-white/40" : "text-gray-500")}>
        {page + 1} / {pageCount}
      </span>
      <button
        onClick={() => setPage(Math.min(pageCount - 1, page + 1))}
        disabled={page >= pageCount - 1}
        className={cn(
          "p-1.5 rounded-md transition-colors",
          page >= pageCount - 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-primary/10",
          isDark ? "text-white/50" : "text-gray-500"
        )}
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

// Filter type labels
const FILTER_TYPES = [
  { value: '', label: 'All' },
  { value: 'SALE', label: 'Sale' },
  { value: 'CREATE_BUY_OFFER', label: 'Buy Offer' },
  { value: 'CREATE_SELL_OFFER', label: 'Sell Offer' },
  { value: 'CANCEL_BUY_OFFER', label: 'Cancel' },
  { value: 'TRANSFER', label: 'Transfer' }
];

// Main AccountTransactions Component
export default function AccountTransactions({ creatorAccount, collectionSlug }) {
  const { openSnackbar, themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [filterType, setFilterType] = useState('');

  const fetchHistory = async () => {
    if (!collectionSlug) return;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (filterType) params.append('type', filterType);

      const res = await axios.get(`https://api.xrpl.to/api/nft/collections/${collectionSlug}/history?${params}`);

      setTransactions(res.data.history || []);
      setTotal(res.data.pagination?.total || 0);
      setHasMore(res.data.pagination?.hasMore || false);
    } catch (err) {
      console.error('Error fetching history:', err);
      setError('Failed to fetch collection history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [collectionSlug, page, filterType]);

  const getTransactionColor = (type) => {
    if (type === 'SALE') return 'text-green-500 border-green-500/30 bg-green-500/10';
    if (type.includes('BUY')) return 'text-blue-500 border-blue-500/30 bg-blue-500/10';
    if (type.includes('SELL')) return 'text-cyan-500 border-cyan-500/30 bg-cyan-500/10';
    if (type.includes('CANCEL')) return 'text-orange-500 border-orange-500/30 bg-orange-500/10';
    if (type === 'TRANSFER') return 'text-gray-500 border-gray-500/30 bg-gray-500/10';
    return 'text-gray-500 border-gray-500/30 bg-gray-500/10';
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (!collectionSlug) {
    return (
      <div className="max-w-[2000px] mx-auto px-4 sm:px-0">
        <div className={cn(
          "rounded-xl border-[1.5px] p-8 mb-6 text-center",
          isDark ? "bg-black/20 border-white/[0.08]" : "bg-white border-gray-200"
        )}>
          <p className="text-[15px] text-gray-500">No creator account available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[2000px] mx-auto px-4 sm:px-0">
      <div className="mb-6">
        {/* Filter Chips */}
        <div className="mb-4 px-4">
          <div className="flex flex-wrap gap-2">
            {['ALL', 'SALE', 'CREATE_BUY_OFFER', 'CREATE_SELL_OFFER', 'CANCEL_BUY_OFFER', 'TRANSFER'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type === 'ALL' ? '' : type)}
                className={cn(
                  "rounded-lg border-[1.5px] px-3 py-1 text-[11px] font-normal capitalize transition-colors",
                  (type === 'ALL' && !filterType) || filterType === type
                    ? "border-primary/50 text-primary bg-primary/10"
                    : isDark
                    ? "border-white/15 text-gray-400 hover:bg-white/5 hover:border-primary/30"
                    : "border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-primary/30"
                )}
              >
                {type === 'ALL' ? 'All' : type.replace(/_/g, ' ').toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div>
          {loading ? (
            <div className="p-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "mb-2 h-12 rounded-lg animate-pulse",
                    isDark ? "bg-white/5" : "bg-gray-200"
                  )}
                />
              ))}
            </div>
          ) : error ? (
            <div className={cn(
              "rounded-xl border-[1.5px] p-12 text-center",
              isDark ? "bg-black/20 border-white/[0.08]" : "bg-white border-gray-200"
            )}>
              <p className="text-[15px] font-medium text-red-500 mb-2">{error}</p>
              <p className="text-[13px] text-gray-500">
                Please try refreshing the page or check back later
              </p>
            </div>
          ) : transactions.length === 0 ? (
            <div className={cn(
              "rounded-xl border-[1.5px] p-12 text-center",
              isDark ? "bg-black/20 border-white/[0.08]" : "bg-white border-gray-200"
            )}>
              <p className="text-[15px] font-medium mb-2">No Transactions Found</p>
              <p className="text-[13px] text-gray-500">
                This collection hasn't had any recent activity
              </p>
            </div>
          ) : (
            <>
              <div className={cn(
                "overflow-x-auto rounded-xl border-[1.5px]",
                isDark ? "border-white/[0.08]" : "border-gray-200"
              )}>
                <table className="w-full min-w-[700px]">
                  <thead className={cn(
                    "sticky top-0 z-10",
                    isDark ? "bg-black/50 backdrop-blur-lg" : "bg-gray-50/50 backdrop-blur-lg"
                  )}>
                    <tr>
                      <th className={cn(
                        "px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide",
                        isDark ? "text-gray-400 border-b border-white/5" : "text-gray-600 border-b border-gray-200"
                      )}>Type</th>
                      <th className={cn(
                        "px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide",
                        isDark ? "text-gray-400 border-b border-white/5" : "text-gray-600 border-b border-gray-200"
                      )}>NFT</th>
                      <th className={cn(
                        "px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide",
                        isDark ? "text-gray-400 border-b border-white/5" : "text-gray-600 border-b border-gray-200"
                      )}>Price</th>
                      <th className={cn(
                        "px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide",
                        isDark ? "text-gray-400 border-b border-white/5" : "text-gray-600 border-b border-gray-200"
                      )}>Fees</th>
                      <th className={cn(
                        "px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide",
                        isDark ? "text-gray-400 border-b border-white/5" : "text-gray-600 border-b border-gray-200"
                      )}>From</th>
                      <th className={cn(
                        "px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide",
                        isDark ? "text-gray-400 border-b border-white/5" : "text-gray-600 border-b border-gray-200"
                      )}>To</th>
                      <th className={cn(
                        "px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide",
                        isDark ? "text-gray-400 border-b border-white/5" : "text-gray-600 border-b border-gray-200"
                      )}>Origin</th>
                      <th className={cn(
                        "px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide",
                        isDark ? "text-gray-400 border-b border-white/5" : "text-gray-600 border-b border-gray-200"
                      )}>Date</th>
                      <th className={cn(
                        "px-4 py-3 text-center text-[11px] font-medium uppercase tracking-wide",
                        isDark ? "text-gray-400 border-b border-white/5" : "text-gray-600 border-b border-gray-200"
                      )}>Tx</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((item, idx) => (
                      <tr
                        key={item.hash || idx}
                        className={cn(
                          "transition-colors",
                          isDark
                            ? "border-b border-white/5 hover:bg-white/5"
                            : "border-b border-gray-100 hover:bg-gray-50"
                        )}
                      >
                        <td className="px-4 py-3">
                          <span className={cn(
                            "inline-block rounded-lg border-[1.5px] px-2 py-1 text-[10px] font-normal capitalize",
                            getTransactionColor(item.type)
                          )}>
                            {item.type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {item.NFTokenID ? (
                            <a
                              href={`/nft/${item.NFTokenID}`}
                              className="text-[11px] text-gray-500 hover:text-primary"
                            >
                              {item.NFTokenID.slice(0,8)}...{item.NFTokenID.slice(-6)}
                            </a>
                          ) : (
                            <span className="text-[11px] text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {item.costXRP || item.amountXRP ? (
                            <span className="text-[11px] text-green-500 font-medium">
                              ✕{item.costXRP || item.amountXRP}
                            </span>
                          ) : (
                            <span className="text-[11px] text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {item.brokerFeeXRP || item.royaltyAmountXRP ? (
                            <div className="flex flex-col gap-0.5">
                              {item.brokerFeeXRP && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] text-orange-400 uppercase tracking-wide w-12">Broker</span>
                                  <span className="text-[10px] text-gray-400">✕{item.brokerFeeXRP}</span>
                                </div>
                              )}
                              {item.royaltyAmountXRP && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] text-blue-400 uppercase tracking-wide w-12">Royalty</span>
                                  <span className="text-[10px] text-gray-400">✕{item.royaltyAmountXRP}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {item.seller || item.account ? (
                            <a
                              href={`/profile/${item.seller || item.account}`}
                              className="text-[11px] text-gray-500 hover:text-primary"
                            >
                              {(item.seller || item.account).slice(0,6)}...{(item.seller || item.account).slice(-4)}
                            </a>
                          ) : (
                            <span className="text-[11px] text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {item.buyer || item.destination ? (
                            <a
                              href={`/profile/${item.buyer || item.destination}`}
                              className="text-[11px] text-gray-500 hover:text-primary"
                            >
                              {(item.buyer || item.destination).slice(0,6)}...{(item.buyer || item.destination).slice(-4)}
                            </a>
                          ) : (
                            <span className="text-[11px] text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {item.origin ? (
                            <span className="text-[11px] text-gray-500">
                              {item.origin === 'XRPL' && (item.broker === 'rpx9JThQ2y37FaGeeJP7PXDUVEXY3PHZSC' || item.SourceTag === 101102979) ? 'XRP Cafe' : item.origin}
                            </span>
                          ) : (
                            <span className="text-[11px] text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] text-gray-500">
                            {formatDate(item.time)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => window.open(`/tx/${item.hash}`, '_blank')}
                            className="p-1 hover:text-primary transition-colors"
                          >
                            <ExternalLink size={13} className="text-gray-500" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <Pagination total={total} page={page} setPage={setPage} isDark={isDark} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

