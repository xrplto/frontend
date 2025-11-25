import axios from 'axios';
import React, { memo, useCallback, useMemo, useRef } from 'react';
import { useState, useEffect, useContext } from 'react';

// Context
import { AppContext } from 'src/AppContext';
import PriceChart from './PriceChartAdvanced';
import TradingHistory from './TradingHistory';
import PriceStatistics from './PriceStatistics';
import Description from './Description';
import TrendingTokens from './TrendingTokens';
import Swap from './Swap';
import { cn } from 'src/utils/cn';

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
      <div className={cn(
        "flex flex-col md:flex-row items-start",
        isMobile ? "gap-1" : "gap-2"
      )}>
        <div className="w-full md:flex-[0_0_68%] md:max-w-[68%]">
          <PriceChart token={token} />
          {!isMobile && !isTablet && (
            <div className="mt-1">
              <TradingHistory
                tokenId={token.md5}
                amm={token.AMM}
                token={token}
                pairs={pairs}
                onTransactionClick={onTransactionClick}
                isDark={isDark}
              />
            </div>
          )}
        </div>
        <div className={cn(
          "w-full md:flex-[0_0_32%] md:max-w-[32%]",
          orderBookOpen ? "md:pr-1" : "md:pr-2"
        )}>
          <Swap
            token={token}
            onOrderBookToggle={onOrderBookToggle}
            orderBookOpen={orderBookOpen}
            onOrderBookData={onOrderBookData}
          />
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
          <TrendingTokens />
        </div>
      </div>
    );
  }
);

Overview.displayName = 'Overview';

export default Overview;
