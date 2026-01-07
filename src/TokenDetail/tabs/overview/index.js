import axios from 'axios';
import React, { memo, useCallback } from 'react';
import { useState, useEffect, useContext } from 'react';
import dynamic from 'next/dynamic';

// Context
import { AppContext } from 'src/AppContext';
import { cn } from 'src/utils/cn';

// Dynamic imports for heavy components (code splitting)
const PriceChart = dynamic(() => import('./ohlc'), {
  loading: () => (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3.5">
      <div className="flex justify-between mb-2">
        <div className="h-4 w-32 animate-pulse bg-white/10 rounded" />
        <div className="flex gap-1">
          <div className="h-6 w-20 animate-pulse bg-white/10 rounded" />
          <div className="h-6 w-28 animate-pulse bg-white/10 rounded" />
        </div>
      </div>
      <div className="h-[360px] md:h-[570px] animate-pulse bg-white/5 rounded-lg" />
    </div>
  ),
  ssr: false
});
const TradingHistory = dynamic(() => import('./TradingHistory'), {
  loading: () => <div className="h-[300px] animate-pulse bg-white/5 rounded-xl" />,
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
    const [description, setDescription] = useState(token.description || '');
    const [pairs, setPairs] = useState([]);

    // Markdown parser removed for build simplicity

    const handleEditorChange = useCallback(({ html, text }) => {
      setDescription(text);
    }, []);

    // Fetch pairs data immediately
    useEffect(() => {
      if (!token.md5) return;

      const controller = new AbortController();

      (async () => {
        try {
          const response = await fetch(`${BASE_URL}/pairs?md5=${token.md5}`, {
            signal: controller.signal
          });

          if (controller.signal.aborted) return;

          const data = await response.json();
          if (data.pairs) {
            setPairs(data.pairs);
          }
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error('Error fetching pairs:', error);
          }
        }
      })();

      return () => {
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
          <PriceStatistics token={token} isDark={isDark} linkedCollections={token.linkedCollections} />
          <TradingHistory tokenId={token.md5} amm={token.AMM} token={token} pairs={pairs} onTransactionClick={onTransactionClick} isDark={isDark} isMobile={true} />
          <TrendingTokens />
          <Description token={token} showEditor={showEditor} setShowEditor={setShowEditor} description={description} onApplyDescription={onApplyDescription} isDark={isDark} mdEditor={showEditor ? <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={cn("w-full h-[300px] p-2 rounded-xl border-[1.5px] font-mono text-xs resize-none focus:outline-none focus:border-primary", isDark ? "border-white/20 bg-white/5 text-white placeholder-white/40" : "border-gray-300 bg-white text-gray-900 placeholder-gray-400")} placeholder="Enter description..." /> : null} />
        </div>
      );
    }

    return (
      <div className="flex flex-col">
        {/* Main content row */}
        <div className="flex flex-col md:flex-row items-stretch gap-2 mb-2">
          {/* Left column: Chart + Trading History + Trending */}
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
                isMobile={isTablet}
              />
            </section>
            <TrendingTokens horizontal />
          </div>

          {/* Right sidebar: TokenSummary, Swap, Stats, Description */}
          <aside className="w-full md:w-[560px] md:flex-shrink-0 flex flex-col gap-2" aria-label="Trading Tools">
            <TokenSummary token={token} />
            <h2 className="sr-only">Swap</h2>
            <Swap
              token={token}
              onOrderBookToggle={onOrderBookToggle}
              orderBookOpen={orderBookOpen}
              onOrderBookData={onOrderBookData}
            />
            <h2 className="sr-only">Price Statistics</h2>
            <PriceStatistics token={token} isDark={isDark} linkedCollections={token.linkedCollections} />
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
      </div>
    );
  }
);

Overview.displayName = 'Overview';

export default Overview;
