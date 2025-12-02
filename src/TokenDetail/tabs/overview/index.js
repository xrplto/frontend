import axios from 'axios';
import React, { memo, useCallback, useMemo, useRef } from 'react';
import { useState, useEffect, useContext } from 'react';
import dynamic from 'next/dynamic';

// Context
import { AppContext } from 'src/AppContext';
import { cn } from 'src/utils/cn';

// Dynamic imports for heavy components (code splitting)
const PriceChart = dynamic(() => import('./PriceChartAdvanced'), {
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

const Overview = memo(
  ({ token, onTransactionClick, onOrderBookToggle, orderBookOpen, onOrderBookData }) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const isTablet = typeof window !== 'undefined' && window.innerWidth < 960;
    const BASE_URL = 'https://api.xrpl.to/api';
    const { accountProfile, setLoading, openSnackbar, themeName } = useContext(AppContext);
    const isDark = themeName === 'XrplToDarkTheme';

    const [showEditor, setShowEditor] = useState(false);
    const [description, setDescription] = useState(token.description || '');
    const [pairs, setPairs] = useState([]);
    const pairsCache = useRef(new Map());

    // Markdown parser removed for build simplicity

    const handleEditorChange = useCallback(({ html, text }) => {
      setDescription(text);
    }, []);

    // Fetch pairs data with caching and debouncing
    useEffect(() => {
      if (!token.md5) return;

      // Check cache first
      if (pairsCache.current.has(token.md5)) {
        requestAnimationFrame(() => setPairs(pairsCache.current.get(token.md5)));
        return;
      }

      const timeoutId = setTimeout(async () => {
        try {
          const controller = new AbortController();
          const fetchTimeoutId = setTimeout(() => controller.abort(), 5000);

          const response = await fetch(`${BASE_URL}/pairs?md5=${token.md5}`, {
            signal: controller.signal
          });
          clearTimeout(fetchTimeoutId);

          const data = await response.json();
          if (data.pairs) {
            pairsCache.current.set(token.md5, data.pairs);
            requestAnimationFrame(() => setPairs(data.pairs));
          }
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error('Error fetching pairs:', error);
          }
        }
      }, 300);

      return () => clearTimeout(timeoutId);
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

    return (
      <div className="flex flex-col gap-2">
        {/* Main row: Chart+TradingHistory | OrderBook | Swap sidebar */}
        <div className={cn(
          "flex flex-col md:flex-row items-stretch",
          isMobile ? "gap-3" : "gap-2"
        )}>
          {/* Left: Chart + TradingHistory stacked */}
          <div className="w-full md:flex-1 min-w-0 flex flex-col gap-2">
            <section aria-label="Price Chart" style={{ position: 'relative', zIndex: 10 }}>
              <h2 className="sr-only">Price Chart</h2>
              <PriceChart token={token} />
            </section>
            <section aria-label="Trading History" style={{ position: 'relative', zIndex: 0 }}>
              <h2 className="sr-only">Trading History</h2>
              <TradingHistory
                tokenId={token.md5}
                amm={token.AMM}
                token={token}
                pairs={pairs}
                onTransactionClick={onTransactionClick}
                isDark={isDark}
                isMobile={isMobile || isTablet}
              />
            </section>
          </div>

          {/* Middle: OrderBook - fixed width, stretch height */}
          {!isMobile && !isTablet && (
            <aside className="w-[280px] flex-shrink-0 self-start" style={{ height: '1300px' }} aria-label="Order Book">
              <h2 className="sr-only">Order Book</h2>
              <OrderBook token={token} />
            </aside>
          )}

          {/* Right sidebar: Swap, Stats, Trending - fills remaining space */}
          <aside className="w-full md:w-[520px] md:flex-shrink-0 flex flex-col gap-2" aria-label="Trading Tools">
            <h2 className="sr-only">Swap</h2>
            <Swap
              token={token}
              onOrderBookToggle={onOrderBookToggle}
              orderBookOpen={orderBookOpen}
              onOrderBookData={onOrderBookData}
            />
            <h2 className="sr-only">Price Statistics</h2>
            <PriceStatistics token={token} isDark={isDark} />
            <TrendingTokens />
          </aside>
        </div>

        {/* Description below */}
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
      </div>
    );
  }
);

Overview.displayName = 'Overview';

export default Overview;
