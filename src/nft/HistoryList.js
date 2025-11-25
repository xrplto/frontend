import axios from 'axios';
import { useState, useEffect, useContext } from 'react';
import { Loader2 } from 'lucide-react';

// Context
import { AppContext } from 'src/AppContext';

// Utils
import { cn } from 'src/utils/cn';

// Utils
import { normalizeCurrencyCode } from 'src/utils/parseUtils';
import { fNumber } from 'src/utils/formatters';

// Helper functions
const getTypeColor = (type) => {
  const colors = {
    SALE: '#10b981',
    MINT: '#8b5cf6',
    TRANSFER: '#3b82f6',
    CREATE_BUY_OFFER: 'rgb(156, 163, 175)',
    CREATE_SELL_OFFER: 'rgb(156, 163, 175)',
    CANCEL_BUY_OFFER: 'rgb(156, 163, 175)',
    CANCEL_SELL_OFFER: 'rgb(156, 163, 175)'
  };
  return colors[type] || 'rgb(156, 163, 175)';
};

const getTypeLabel = (type) => {
  const labels = {
    SALE: 'Sale',
    MINT: 'Mint',
    TRANSFER: 'Transfer',
    CREATE_BUY_OFFER: 'Buy Offer',
    CREATE_SELL_OFFER: 'Sell Offer',
    CANCEL_BUY_OFFER: 'Cancel Buy',
    CANCEL_SELL_OFFER: 'Cancel Sell'
  };
  return labels[type] || type;
};

function formatAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now - date;
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    if (diffInHours === 0) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMinutes}m`;
    }
    return `${diffInHours}h`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }
}

// Components extracted to avoid nested component definitions
const LoadingSkeleton = ({ isDark }) => (
  <div className="p-4 space-y-4">
    {[1, 2, 3].map((item) => (
      <div
        key={item}
        className={cn(
          "h-16 rounded-lg animate-pulse",
          isDark ? "bg-white/5" : "bg-gray-200"
        )}
      />
    ))}
  </div>
);

const EmptyState = ({ isDark }) => (
  <div className="flex items-center justify-center py-12">
    <p className={cn(
      "text-[13px]",
      isDark ? "text-white/60" : "text-gray-500"
    )}>
      No transaction history
    </p>
  </div>
);

export default function HistoryList({ nft }) {
  const BASE_URL = 'https://api.xrpl.to/api';
  const { sync, themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [hists, setHists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    function getHistories() {
      setLoading(true);
      axios
        .get(`${BASE_URL}/nft/history?NFTokenID=${nft.NFTokenID}&limit=50`)
        .then((res) => {
          let ret = res.status === 200 ? res.data : undefined;
          if (ret && ret.result === 'success') {
            setHists(ret.histories);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error on getting nft history list!!!', err);
          setLoading(false);
        });
    }
    getHistories();
  }, [sync, nft.NFTokenID]);

  // Filter out noisy transactions unless showAll is true
  const importantTypes = ['SALE', 'MINT', 'TRANSFER'];
  const filteredHists = showAll
    ? hists
    : hists.filter(h => importantTypes.includes(h.type));

  // Deduplicate by creating unique key from type + time + account/seller/buyer
  const uniqueHists = filteredHists.filter((hist, index, self) => {
    const key = `${hist.type}_${hist.time}_${hist.seller || hist.buyer || hist.account}`;
    return index === self.findIndex(h =>
      `${h.type}_${h.time}_${h.seller || h.buyer || h.account}` === key
    );
  });

  if (loading) {
    return (
      <div className={cn(
        "rounded-xl border-[1.5px] overflow-hidden",
        isDark ? "border-white/10 bg-transparent" : "border-gray-200 bg-transparent"
      )}>
        <LoadingSkeleton isDark={isDark} />
      </div>
    );
  }

  if (!hists || hists.length === 0) {
    return (
      <div className={cn(
        "rounded-xl border-[1.5px] overflow-hidden",
        isDark ? "border-white/10 bg-transparent" : "border-gray-200 bg-transparent"
      )}>
        <EmptyState isDark={isDark} />
      </div>
    );
  }

  const sortedHists = uniqueHists.slice().reverse();
  const hasMoreTransactions = hists.length > filteredHists.length;

  return (
    <div className="space-y-3">
      {hasMoreTransactions && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowAll(!showAll)}
            className={cn(
              "py-1 px-3 text-[13px] font-normal rounded-lg border-[1.5px]",
              isDark
                ? "border-white/15 text-white/60 hover:border-primary hover:bg-primary/5"
                : "border-gray-300 text-gray-600 hover:bg-gray-100"
            )}
          >
            {showAll ? 'Show Key Events' : 'Show All'}
          </button>
        </div>
      )}
      <div className={cn(
        "rounded-xl border-[1.5px] overflow-hidden",
        isDark ? "border-white/10 bg-transparent" : "border-gray-200 bg-transparent"
      )}>
      {isMobile ? (
        // Mobile view - Cards
        <div className="p-3 space-y-2">
          {sortedHists.map((row) => (
            <div
              key={row.uuid}
              className={cn(
                "p-3 rounded-xl border-[1.5px]",
                isDark ? "border-white/10 bg-transparent" : "border-gray-200 bg-transparent"
              )}
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span
                    className="text-[12px] font-normal px-2 py-1 rounded-lg"
                    style={{
                      backgroundColor: `${getTypeColor(row.type)}15`,
                      color: getTypeColor(row.type)
                    }}
                  >
                    {getTypeLabel(row.type)}
                  </span>
                  <span className={cn(
                    "text-[12px]",
                    isDark ? "text-white/60" : "text-gray-500"
                  )}>
                    {formatDate(row.time)}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {row.seller && row.buyer ? (
                    <div className="text-[13px]">
                      <a
                        href={`/profile/${row.seller}`}
                        className={cn(
                          "font-mono hover:underline",
                          isDark ? "text-white/80" : "text-gray-700"
                        )}
                      >
                        {formatAddress(row.seller)}
                      </a>
                      <span className={cn(
                        "mx-1",
                        isDark ? "text-white/40" : "text-gray-400"
                      )}>→</span>
                      <a
                        href={`/profile/${row.buyer}`}
                        className={cn(
                          "font-mono hover:underline",
                          isDark ? "text-white/80" : "text-gray-700"
                        )}
                      >
                        {formatAddress(row.buyer)}
                      </a>
                    </div>
                  ) : (
                    <a
                      href={`/profile/${row.account}`}
                      className={cn(
                        "font-mono text-[13px] hover:underline",
                        isDark ? "text-white/80" : "text-gray-700"
                      )}
                    >
                      {formatAddress(row.account)}
                    </a>
                  )}

                  {row.type === 'SALE' && (row.cost || row.costXRP) && (
                    <div className="font-mono text-[14px]">
                      {row.costXRP ? (
                        <>{fNumber(row.costXRP)} XRP</>
                      ) : (
                        <>
                          {fNumber(row.cost.amount)} {normalizeCurrencyCode(row.cost.currency)}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Desktop view - Table
        <div className="overflow-x-auto w-full">
          <table className="w-full">
            <thead>
              <tr className={cn(
                "border-b-[1.5px]",
                isDark ? "border-white/10" : "border-gray-200"
              )}>
                <th className={cn(
                  "text-left py-2.5 px-3 text-[11px] font-medium uppercase tracking-wide w-[100px]",
                  isDark ? "text-white/60" : "text-gray-500"
                )}>Type</th>
                <th className={cn(
                  "text-left py-2.5 px-3 text-[11px] font-medium uppercase tracking-wide min-w-[280px]",
                  isDark ? "text-white/60" : "text-gray-500"
                )}>From / To</th>
                <th className={cn(
                  "text-right py-2.5 px-3 text-[11px] font-medium uppercase tracking-wide w-[140px]",
                  isDark ? "text-white/60" : "text-gray-500"
                )}>Price</th>
                <th className={cn(
                  "text-right py-2.5 px-3 text-[11px] font-medium uppercase tracking-wide w-[90px]",
                  isDark ? "text-white/60" : "text-gray-500"
                )}>Date</th>
              </tr>
            </thead>
            <tbody>
              {sortedHists.map((row) => (
                <tr
                  key={row.uuid}
                  className={cn(
                    "border-b-[1.5px]",
                    isDark ? "border-white/5" : "border-gray-100"
                  )}
                >
                  <td className="py-2.5 px-3">
                    <span
                      className="text-[12px] font-normal px-2 py-1 rounded-lg inline-block"
                      style={{
                        backgroundColor: `${getTypeColor(row.type)}15`,
                        color: getTypeColor(row.type)
                      }}
                    >
                      {getTypeLabel(row.type)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    {row.seller && row.buyer ? (
                      <div>
                        <a
                          href={`/profile/${row.seller}`}
                          className={cn(
                            "font-mono text-[13px] hover:underline",
                            isDark ? "text-white/80" : "text-gray-700"
                          )}
                        >
                          {formatAddress(row.seller)}
                        </a>
                        <span className={cn(
                          "mx-1 text-[12px]",
                          isDark ? "text-white/40" : "text-gray-400"
                        )}>→</span>
                        <a
                          href={`/profile/${row.buyer}`}
                          className={cn(
                            "font-mono text-[13px] hover:underline",
                            isDark ? "text-white/80" : "text-gray-700"
                          )}
                        >
                          {formatAddress(row.buyer)}
                        </a>
                      </div>
                    ) : (
                      <a
                        href={`/profile/${row.account}`}
                        className={cn(
                          "font-mono text-[13px] hover:underline",
                          isDark ? "text-white/80" : "text-gray-700"
                        )}
                      >
                        {formatAddress(row.account)}
                      </a>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {row.type === 'SALE' && (row.cost || row.costXRP) ? (
                      <div className="font-mono text-[14px]">
                        {row.costXRP ? (
                          <>{fNumber(row.costXRP)} XRP</>
                        ) : (
                          <>
                            {fNumber(row.cost.amount)} {normalizeCurrencyCode(row.cost.currency)}
                          </>
                        )}
                      </div>
                    ) : (
                      <span className={cn(
                        "text-[13px]",
                        isDark ? "text-white/60" : "text-gray-500"
                      )}>
                        —
                      </span>
                    )}
                  </td>
                  <td className={cn(
                    "py-2.5 px-3 text-right text-[13px]",
                    isDark ? "text-white/60" : "text-gray-500"
                  )}>
                    {formatDate(row.time)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </div>
  );
}
