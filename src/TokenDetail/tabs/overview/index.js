import axios from 'axios';
import React, { memo, useCallback, useMemo, useRef } from 'react';
import { useState, useEffect, useContext } from 'react';
import dynamic from 'next/dynamic';

// Context
import { AppContext } from 'src/AppContext';
import { cn } from 'src/utils/cn';
import { ChevronRight, BookOpen } from 'lucide-react';

// Dynamic imports for heavy components (code splitting)
const PriceChart = dynamic(() => import('./ohlc'), {
  loading: () => <div className="h-[400px] animate-pulse bg-white/5 rounded-xl" />,
  ssr: false
});
const TradingHistory = dynamic(() => import('./TradingHistory'), {
  loading: () => <div className="h-[300px] animate-pulse bg-white/5 rounded-xl" />,
  ssr: false
});
const OrderBook = dynamic(() => import('./OrderBook'), {
  loading: () => <div className="h-[200px] animate-pulse bg-white/5 rounded-xl" />,
  ssr: false
});

// Lighter components - static imports
import PriceStatistics from './PriceStatistics';
import Description from './Description';
import TrendingTokens from './TrendingTokens';
import Swap from './Swap';
import TokenSummary from '../../components/TokenSummary';

const Overview = memo(
  ({ token, onTransactionClick, onOrderBookToggle, orderBookOpen, onOrderBookData }) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const isTablet = typeof window !== 'undefined' && window.innerWidth < 960;
    const BASE_URL = 'https://api.xrpl.to/api';
    const { accountProfile, setLoading, openSnackbar, themeName } = useContext(AppContext);
    const isDark = themeName === 'XrplToDarkTheme';

    const [showEditor, setShowEditor] = useState(false);
    const [orderBookCollapsed, setOrderBookCollapsed] = useState(() => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('orderBookCollapsed');
        return stored === null ? true : stored === 'true';
      }
      return true;
    });

    // Persist collapse state
    useEffect(() => {
      localStorage.setItem('orderBookCollapsed', orderBookCollapsed);
    }, [orderBookCollapsed]);
    const [description, setDescription] = useState(token.description || '');
    const [pairs, setPairs] = useState([]);
    // LRU cache with max 50 entries to prevent unbounded memory growth
    const pairsCache = useRef(new Map());
    const CACHE_MAX_SIZE = 50;

    // Markdown parser removed for build simplicity

    const handleEditorChange = useCallback(({ html, text }) => {
      setDescription(text);
    }, []);

    // Fetch pairs data with caching and debouncing
    useEffect(() => {
      if (!token.md5) return;

      // Check cache first (LRU: move to end on access)
      if (pairsCache.current.has(token.md5)) {
        const cachedPairs = pairsCache.current.get(token.md5);
        // Move to end for LRU
        pairsCache.current.delete(token.md5);
        pairsCache.current.set(token.md5, cachedPairs);
        requestAnimationFrame(() => setPairs(cachedPairs));
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(async () => {
        try {
          const response = await fetch(`${BASE_URL}/pairs?md5=${token.md5}`, {
            signal: controller.signal
          });

          if (controller.signal.aborted) return;

          const data = await response.json();
          if (data.pairs) {
            // LRU eviction: remove oldest entries if cache is full
            while (pairsCache.current.size >= CACHE_MAX_SIZE) {
              const oldestKey = pairsCache.current.keys().next().value;
              pairsCache.current.delete(oldestKey);
            }
            pairsCache.current.set(token.md5, data.pairs);
            requestAnimationFrame(() => setPairs(data.pairs));
          }
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error('Error fetching pairs:', error);
          }
        }
      }, 300);

      return () => {
        clearTimeout(timeoutId);
        controller.abort();
      };
    }, [token.md5, BASE_URL]);

    const onApplyDescription = useCallback(async () => {
      if (token.description === description) return;

      let finish = false;
      setLoading(true);
      try {
        let res;

        const accountAdmin = accountProfile.account;
        const accountToken = accountProfile.token;

        const body = { md5: token.md5, description };

        res = await axios.post(`${BASE_URL}/admin/update_description`, body, {
          headers: { 'x-access-account': accountAdmin, 'x-access-token': accountToken }
        });

        if (res.status === 200) {
          const ret = res.data;
          if (ret.status) {
            requestAnimationFrame(() => {
              token.description = description;
              openSnackbar('Successful!', 'success');
              finish = true;
              if (finish) setShowEditor(false);
            });
          } else {
            const err = ret.err;
            openSnackbar(err, 'error');
          }
        }
      } catch (err) {
        console.error('Update description failed:', err);
      }
      requestAnimationFrame(() => setLoading(false));
    }, [token, description, accountProfile, BASE_URL, setLoading, openSnackbar]);

    let user = token.user;
    if (!user) user = token.name;

    // Mobile layout: Summary > Swap > Chart > Stats > History > Trending > Description
    if (isMobile) {
      return (
        <div className="flex flex-col gap-3">
          <TokenSummary token={token} />
          <Swap token={token} onOrderBookToggle={onOrderBookToggle} orderBookOpen={orderBookOpen} onOrderBookData={onOrderBookData} />
          <PriceChart token={token} />
          <PriceStatistics token={token} isDark={isDark} />
          <TradingHistory tokenId={token.md5} amm={token.AMM} token={token} pairs={pairs} onTransactionClick={onTransactionClick} isDark={isDark} isMobile={true} />
          <TrendingTokens />
          <Description token={token} showEditor={showEditor} setShowEditor={setShowEditor} description={description} onApplyDescription={onApplyDescription} isDark={isDark} mdEditor={showEditor ? <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={cn("w-full h-[300px] p-2 rounded-xl border-[1.5px] font-mono text-xs resize-none focus:outline-none focus:border-primary", isDark ? "border-white/20 bg-white/5 text-white placeholder-white/40" : "border-gray-300 bg-white text-gray-900 placeholder-gray-400")} placeholder="Enter description..." /> : null} />
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2">
        {/* Main content row */}
        <div className="flex flex-col md:flex-row items-stretch gap-2">
          {/* Left column: Chart + Trading History */}
          <div className="w-full md:flex-1 min-w-0 flex flex-col gap-2">
            <section aria-label="Price Chart" style={{ position: 'relative', zIndex: 10 }}>
              <h2 className="sr-only">Price Chart</h2>
              <PriceChart token={token} />
            </section>
            <section aria-label="Trading History" className="flex-1" style={{ position: 'relative', zIndex: 0 }}>
              <h2 className="sr-only">Trading History</h2>
              <TradingHistory
                tokenId={token.md5}
                amm={token.AMM}
                token={token}
                pairs={pairs}
                onTransactionClick={onTransactionClick}
                isDark={isDark}
                isMobile={isTablet}
              />
            </section>
          </div>

          {/* Middle: OrderBook - collapsible */}
          {!isTablet && (
            <aside
              className={cn(
                "flex-shrink-0 transition-all duration-300 ease-in-out",
                orderBookCollapsed ? "w-[36px]" : "w-[280px]"
              )}
              aria-label="Order Book"
            >
              <h2 className="sr-only">Order Book</h2>
              {orderBookCollapsed ? (
                <div
                  onClick={() => setOrderBookCollapsed(false)}
                  className={cn(
                    "w-[36px] rounded-xl border cursor-pointer flex flex-col items-center justify-center gap-2 transition-all",
                    isDark ? "bg-white/[0.02] hover:border-blue-500" : "bg-black/[0.02] hover:border-blue-500"
                  )}
                  style={{ borderWidth: '1.5px', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', height: 'calc(100% - 24px)' }}
                  title="Expand Order Book"
                >
                  <ChevronRight size={16} className={isDark ? "text-white/50" : "text-black/50"} />
                  <BookOpen size={14} className={isDark ? "text-white/60" : "text-black/60"} />
                  <span className={cn("writing-mode-vertical text-[11px] font-medium tracking-wide", isDark ? "text-white/70" : "text-black/70")} style={{ writingMode: 'vertical-rl' }}>ORDER BOOK</span>
                </div>
              ) : (
                <OrderBook
                  token={token}
                  collapsed={false}
                  onToggleCollapse={() => setOrderBookCollapsed(true)}
                />
              )}
            </aside>
          )}

          {/* Right sidebar: TokenSummary, Swap, Stats, Description */}
          <aside className="w-full md:w-[520px] md:flex-shrink-0 flex flex-col gap-2" aria-label="Trading Tools">
            <TokenSummary token={token} />
            <h2 className="sr-only">Swap</h2>
            <Swap
              token={token}
              onOrderBookToggle={onOrderBookToggle}
              orderBookOpen={orderBookOpen}
              onOrderBookData={onOrderBookData}
            />
            <h2 className="sr-only">Price Statistics</h2>
            <PriceStatistics token={token} isDark={isDark} />
            <Description
              token={token}
              showEditor={showEditor}
              setShowEditor={setShowEditor}
              description={description}
              onApplyDescription={onApplyDescription}
              isDark={isDark}
              mdEditor={
                showEditor ? (
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={cn(
                      "w-full h-[300px] p-2 rounded-xl border-[1.5px] font-mono text-xs resize-none focus:outline-none focus:border-primary",
                      isDark
                        ? "border-white/20 bg-white/5 text-white placeholder-white/40"
                        : "border-gray-300 bg-white text-gray-900 placeholder-gray-400"
                    )}
                    placeholder="Enter description..."
                  />
                ) : null
              }
            />
          </aside>
        </div>

        {/* Trending Tokens - Full width horizontal section */}
        <TrendingTokens horizontal />
      </div>
    );
  }
);

Overview.displayName = 'Overview';

export default Overview;
