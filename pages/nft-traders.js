import { useState, useContext } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { AppContext } from 'src/AppContext';
import { cn } from 'src/utils/cn';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
import { TrendingUp, TrendingDown, ArrowDown, Loader2 } from 'lucide-react';
import { fNumber, formatDistanceToNowStrict } from 'src/utils/formatters';
import Link from 'next/link';

const BASE_URL = 'https://api.xrpl.to/api';

// Simple Pagination Component
function SimplePagination({ currentPage, totalPages, onPageChange, isDark }) {
  const pages = [];
  const maxVisible = 7;

  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className={cn(
          "px-3 py-2 rounded-lg border-[1.5px] text-[13px] font-normal min-w-[32px] h-[32px]",
          isDark ? "border-white/15" : "border-gray-300",
          currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:border-primary hover:bg-primary/5"
        )}
      >
        First
      </button>

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={cn(
            "px-3 py-2 rounded-lg border-[1.5px] text-[13px] font-normal min-w-[32px] h-[32px]",
            page === currentPage
              ? "bg-primary text-white border-primary"
              : isDark
              ? "border-white/15 hover:border-primary hover:bg-primary/5"
              : "border-gray-300 hover:bg-gray-100"
          )}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className={cn(
          "px-3 py-2 rounded-lg border-[1.5px] text-[13px] font-normal min-w-[32px] h-[32px]",
          isDark ? "border-white/15" : "border-gray-300",
          currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "hover:border-primary hover:bg-primary/5"
        )}
      >
        Last
      </button>
    </div>
  );
}

export default function TradersPage({ traders = [], sortBy = 'balance', globalMetrics = null }) {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const rowsPerPage = 20;

  const handleSortChange = (newSortBy) => {
    setPage(0);
    router.push(`/nft-traders?sortBy=${newSortBy}`);
  };

  const paginatedTraders = traders.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  const totalPages = Math.ceil(traders.length / rowsPerPage);
  const loading = false;

  return (
    <div className="overflow-hidden flex-1">
      <div id="back-to-top-anchor" className="h-6" />
      <Header
        notificationPanelOpen={notificationPanelOpen}
        onNotificationPanelToggle={setNotificationPanelOpen}
      />

      <div className="max-w-screen-2xl mx-auto w-full px-4 py-8">
        <h1 className={cn(
          "text-[28px] font-normal mb-2",
          isDark ? "text-white" : "text-gray-900"
        )}>
          NFT Traders
        </h1>
        <p className={cn(
          "text-[15px] mb-4",
          isDark ? "text-white/60" : "text-gray-600"
        )}>
          Active NFT traders (24h) - Click column headers to sort
        </p>

        {globalMetrics && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-8">
            <div className={cn(
              "p-4 rounded-xl border-[1.5px]",
              isDark ? "border-white/10" : "border-gray-200"
            )}>
              <div className={cn("text-[11px] font-medium uppercase tracking-wide", isDark ? "text-white/60" : "text-gray-600")}>
                Active Traders
              </div>
              <div className="text-[17px] font-normal mt-1">{fNumber(globalMetrics.activeTraders24h)}</div>
            </div>

            <div className={cn(
              "p-4 rounded-xl border-[1.5px]",
              isDark ? "border-white/10" : "border-gray-200"
            )}>
              <div className={cn("text-[11px] font-medium uppercase tracking-wide", isDark ? "text-white/60" : "text-gray-600")}>
                Total Balance
              </div>
              <div className="text-[17px] font-normal mt-1">{fNumber(globalMetrics.totalLiquidity24h)} XRP</div>
            </div>

            <div className={cn(
              "p-4 rounded-xl border-[1.5px]",
              isDark ? "border-white/10" : "border-gray-200"
            )}>
              <div className={cn("text-[11px] font-medium uppercase tracking-wide", isDark ? "text-white/60" : "text-gray-600")}>
                24h Volume
              </div>
              <div className="text-[17px] font-normal mt-1">{fNumber(globalMetrics.total24hVolume)} XRP</div>
            </div>

            <div className={cn(
              "p-4 rounded-xl border-[1.5px]",
              isDark ? "border-white/10" : "border-gray-200"
            )}>
              <div className={cn("text-[11px] font-medium uppercase tracking-wide", isDark ? "text-white/60" : "text-gray-600")}>
                24h Trades
              </div>
              <div className="text-[17px] font-normal mt-1">{fNumber(globalMetrics.total24hSales)}</div>
            </div>

            <div className={cn(
              "p-4 rounded-xl border-[1.5px]",
              isDark ? "border-white/10" : "border-gray-200"
            )}>
              <div className={cn("text-[11px] font-medium uppercase tracking-wide", isDark ? "text-white/60" : "text-gray-600")}>
                24h Mints
              </div>
              <div className="text-[17px] font-normal mt-1">{fNumber(globalMetrics.total24hMints)}</div>
            </div>

            <div className={cn(
              "p-4 rounded-xl border-[1.5px]",
              isDark ? "border-white/10" : "border-gray-200"
            )}>
              <div className={cn("text-[11px] font-medium uppercase tracking-wide", isDark ? "text-white/60" : "text-gray-600")}>
                24h Burns
              </div>
              <div className="text-[17px] font-normal mt-1">{fNumber(globalMetrics.total24hBurns)}</div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin" size={40} />
          </div>
        ) : traders.length === 0 ? (
          <div className={cn(
            "text-center py-16 rounded-xl border-[1.5px] border-dashed",
            isDark ? "border-white/20" : "border-gray-300"
          )}>
            <h3 className={cn("text-lg font-normal mb-2", isDark ? "text-white/60" : "text-gray-600")}>
              No Traders Data
            </h3>
            <p className={cn("text-[13px]", isDark ? "text-white/60" : "text-gray-600")}>
              Trader data will appear here when available
            </p>
          </div>
        ) : (
          <>
            {/* Header Row */}
            <div className={cn(
              "hidden md:grid grid-cols-[0.5fr_2fr_1.5fr_1.5fr_1.5fr_1.5fr_1fr_1.2fr_2fr] gap-4 p-4 mb-2 rounded-xl border-[1.5px]",
              isDark ? "border-white/10" : "border-gray-200"
            )}>
              <div className={cn("text-[11px] font-medium uppercase tracking-wide", isDark ? "text-white/60" : "text-gray-600")}>#</div>
              <div className={cn("text-[11px] font-medium uppercase tracking-wide", isDark ? "text-white/60" : "text-gray-600")}>Trader</div>

              <div
                onClick={() => handleSortChange('balance')}
                className={cn(
                  "flex items-center justify-end gap-1 cursor-pointer text-[11px] font-medium uppercase tracking-wide",
                  sortBy === 'balance' ? "text-primary" : isDark ? "text-white/60 hover:text-primary" : "text-gray-600 hover:text-primary"
                )}
              >
                XRP Balance
                {sortBy === 'balance' && <ArrowDown size={14} className="text-primary" />}
              </div>

              <div
                onClick={() => handleSortChange('buyVolume')}
                className={cn(
                  "flex items-center justify-end gap-1 cursor-pointer text-[11px] font-medium uppercase tracking-wide",
                  sortBy === 'buyVolume' ? "text-primary" : isDark ? "text-white/60 hover:text-primary" : "text-gray-600 hover:text-primary"
                )}
              >
                Buy Volume
                {sortBy === 'buyVolume' && <ArrowDown size={14} className="text-primary" />}
              </div>

              <div
                onClick={() => handleSortChange('sellVolume')}
                className={cn(
                  "flex items-center justify-end gap-1 cursor-pointer text-[11px] font-medium uppercase tracking-wide",
                  sortBy === 'sellVolume' ? "text-primary" : isDark ? "text-white/60 hover:text-primary" : "text-gray-600 hover:text-primary"
                )}
              >
                Sell Volume
                {sortBy === 'sellVolume' && <ArrowDown size={14} className="text-primary" />}
              </div>

              <div
                onClick={() => handleSortChange('totalVolume')}
                className={cn(
                  "flex items-center justify-end gap-1 cursor-pointer text-[11px] font-medium uppercase tracking-wide",
                  sortBy === 'totalVolume' ? "text-primary" : isDark ? "text-white/60 hover:text-primary" : "text-gray-600 hover:text-primary"
                )}
              >
                Total Volume
                {sortBy === 'totalVolume' && <ArrowDown size={14} className="text-primary" />}
              </div>

              <div className={cn("text-[11px] font-medium uppercase tracking-wide text-right", isDark ? "text-white/60" : "text-gray-600")}>Collections</div>
              <div className={cn("text-[11px] font-medium uppercase tracking-wide text-right", isDark ? "text-white/60" : "text-gray-600")}>Last Active</div>
              <div className={cn("text-[11px] font-medium uppercase tracking-wide text-right", isDark ? "text-white/60" : "text-gray-600")}>Marketplaces</div>
            </div>

            {/* Trader Cards */}
            <div className="space-y-3">
              {paginatedTraders.map((trader, index) => (
                <div
                  key={trader._id || trader.address || index}
                  className={cn(
                    "p-4 rounded-xl border-[1.5px] transition-all",
                    isDark
                      ? "border-white/10 hover:border-primary/30 hover:bg-primary/[0.02]"
                      : "border-gray-200 hover:border-primary/30 hover:bg-gray-50"
                  )}
                >
                  <div className="grid grid-cols-1 md:grid-cols-[0.5fr_2fr_1.5fr_1.5fr_1.5fr_1.5fr_1fr_1.2fr_2fr] gap-4 items-center">
                    {/* Rank */}
                    <div className="hidden md:block text-[13px] font-normal">
                      {page * rowsPerPage + index + 1}
                    </div>

                    {/* Address */}
                    <div>
                      <Link
                        href={`/profile/${trader._id || trader.address}`}
                        className="text-primary text-[15px] font-normal hover:underline"
                      >
                        {(trader._id || trader.address)
                          ? `${(trader._id || trader.address).slice(0, 6)}...${(trader._id || trader.address).slice(-4)}`
                          : 'Unknown'}
                      </Link>
                    </div>

                    {/* XRP Balance */}
                    <div className="text-left md:text-right">
                      <div className="md:hidden text-[11px] font-medium uppercase tracking-wide text-white/60 mb-1">XRP Balance</div>
                      <div className="flex items-center gap-2 md:justify-end">
                        <span className="text-[13px] font-normal">{fNumber(trader.balance || 0)}</span>
                        {trader.traderType && (
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[11px] font-normal border",
                            trader.traderType === 'buyer'
                              ? "bg-primary/10 text-primary border-primary/30"
                              : trader.traderType === 'seller'
                              ? "bg-red-500/10 text-red-500 border-red-500/30"
                              : "bg-yellow-500/10 text-yellow-500 border-yellow-500/30"
                          )}>
                            {trader.traderType}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Buy Volume */}
                    <div className="text-left md:text-right">
                      <div className="md:hidden text-[11px] font-medium uppercase tracking-wide text-white/60 mb-1">Buy Volume</div>
                      <div className="flex items-center gap-2 md:justify-end">
                        <TrendingUp size={14} className="text-primary" />
                        <span className="text-[13px] font-normal">{fNumber(trader.buyVolume || 0)}</span>
                        <span className={cn("text-[11px]", isDark ? "text-white/60" : "text-gray-600")}>
                          ({trader.buyCount || 0})
                        </span>
                      </div>
                    </div>

                    {/* Sell Volume */}
                    <div className="text-left md:text-right">
                      <div className="md:hidden text-[11px] font-medium uppercase tracking-wide text-white/60 mb-1">Sell Volume</div>
                      <div className="flex items-center gap-2 md:justify-end">
                        <TrendingDown size={14} className="text-red-500" />
                        <span className="text-[13px] font-normal">{fNumber(trader.sellVolume || 0)}</span>
                        <span className={cn("text-[11px]", isDark ? "text-white/60" : "text-gray-600")}>
                          ({trader.sellCount || 0})
                        </span>
                      </div>
                    </div>

                    {/* Total Volume */}
                    <div className="text-left md:text-right">
                      <div className="md:hidden text-[11px] font-medium uppercase tracking-wide text-white/60 mb-1">Total Volume</div>
                      <span className="text-[13px] font-normal">{fNumber(trader.totalVolume || 0)}</span>
                    </div>

                    {/* Collections */}
                    <div className="text-left md:text-right">
                      <div className="md:hidden text-[11px] font-medium uppercase tracking-wide text-white/60 mb-1">Collections</div>
                      {Array.isArray(trader.collectionsInfo) && trader.collectionsInfo.length > 0 ? (
                        <div className="flex items-center gap-2 md:justify-end">
                          <div className="flex -space-x-2">
                            {trader.collectionsInfo.slice(0, 3).map((col) => (
                              <img
                                key={col._id}
                                src={`https://s1.xrpl.to/nft-collection/${col.logoImage}`}
                                alt={col.name}
                                title={col.name}
                                className="w-6 h-6 rounded-full border-2 border-current"
                              />
                            ))}
                          </div>
                          <span className={cn("text-[11px]", isDark ? "text-white/60" : "text-gray-600")}>
                            {trader.collectionsInfo.length}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[13px] font-normal">{trader.collectionsTraded || 0}</span>
                      )}
                    </div>

                    {/* Last Active */}
                    <div className="text-left md:text-right">
                      <div className="md:hidden text-[11px] font-medium uppercase tracking-wide text-white/60 mb-1">Last Active</div>
                      <span className={cn("text-[13px]", isDark ? "text-white/60" : "text-gray-600")}>
                        {trader.lastActive ? formatDistanceToNowStrict(new Date(trader.lastActive), { addSuffix: true }) : '-'}
                      </span>
                    </div>

                    {/* Marketplaces */}
                    <div className="text-left md:text-right">
                      <div className="md:hidden text-[11px] font-medium uppercase tracking-wide text-white/60 mb-1">Marketplaces</div>
                      {Array.isArray(trader.marketplaces) && trader.marketplaces.length > 0 ? (
                        <div className="flex flex-wrap gap-1 md:justify-end">
                          {trader.marketplaces.map((mp, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md text-[11px] font-normal bg-primary/10 text-primary border border-primary/30"
                            >
                              {mp}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className={cn("text-[13px]", isDark ? "text-white/60" : "text-gray-600")}>-</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8">
                <SimplePagination
                  currentPage={page + 1}
                  totalPages={totalPages}
                  onPageChange={(newPage) => setPage(newPage - 1)}
                  isDark={isDark}
                />
              </div>
            )}
          </>
        )}
      </div>

      <ScrollToTop />
      <Footer />
    </div>
  );
}

export async function getServerSideProps(context) {
  const { sortBy = 'totalVolume' } = context.query;

  try {
    const response = await axios.get(`${BASE_URL}/nft/traders/active?sortBy=${sortBy}&limit=100&includeGlobalMetrics=true`);
    const traders = response.data.traders || response.data || [];
    const globalMetrics = response.data.globalMetrics || null;

    return {
      props: {
        traders,
        sortBy,
        globalMetrics
      }
    };
  } catch (error) {
    console.error('Failed to fetch traders:', error.message);
    return {
      props: {
        traders: [],
        sortBy,
        globalMetrics: null
      }
    };
  }
}
