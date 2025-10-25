import axios from 'axios';
import React, { memo, useCallback, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useState, useEffect, useContext } from 'react';

// Material
import { Grid, Stack, useTheme, useMediaQuery, Typography, Paper, Box } from '@mui/material';

// Context
import { AppContext } from 'src/AppContext';


// Markdown editor removed for build simplicity

const PriceChart = dynamic(() => import('./PriceChartAdvanced'), {
  loading: () => <div style={{ height: '400px' }} />,
  ssr: false
});

const TradingHistory = dynamic(() => import('./TradingHistory'), {
  loading: () => <div style={{ height: '400px' }} />,
  ssr: false
});

const PriceStatistics = dynamic(() => import('./PriceStatistics'), {
  ssr: false
});

const Description = dynamic(() => import('./Description'), {
  ssr: false
});

const TrendingTokens = dynamic(() => import('./TrendingTokens'), {
  ssr: false
});

const Swap = dynamic(() => import('./Swap'), {
  ssr: false
});

// Markdown parser removed for build simplicity

// Performance: Intersection Observer for lazy loading
const useIntersectionObserver = (ref, options = {}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref?.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px', threshold: 0.1, ...options }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [ref, options]);

  return isVisible;
};

// ----------------------------------------------------------------------

const Overview = memo(
  ({ token, onTransactionClick, onOrderBookToggle, orderBookOpen, onOrderBookData }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));
    const BASE_URL = process.env.API_URL;
    const { accountProfile, setLoading, openSnackbar } = useContext(AppContext);

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
      <>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'flex-start',
            gap: { xs: 0.3, md: 1 }
          }}
        >
          <Box sx={{ flex: { md: '0 0 72%' }, maxWidth: { md: '72%' }, width: '100%' }}>
            <PriceChart token={token} />
            {!isMobile && !isTablet && (
              <Box sx={{ mt: 0.5 }}>
                <TradingHistory
                  tokenId={token.md5}
                  amm={token.AMM}
                  token={token}
                  pairs={pairs}
                  onTransactionClick={onTransactionClick}
                />
              </Box>
            )}
          </Box>
          <Box
            sx={{
              flex: { md: '0 0 28%' },
              maxWidth: { md: '28%' },
              width: '100%',
              pr: orderBookOpen ? { md: 0.5 } : { md: 0.75 }
            }}
          >
            <Swap
              token={token}
              onOrderBookToggle={onOrderBookToggle}
              orderBookOpen={orderBookOpen}
              onOrderBookData={onOrderBookData}
            />
            <PriceStatistics token={token} />
            <Description
              token={token}
              showEditor={showEditor}
              setShowEditor={setShowEditor}
              description={description}
              onApplyDescription={onApplyDescription}
              mdEditor={
                showEditor ? (
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{
                      width: '100%',
                      height: '300px',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ccc',
                      fontFamily: 'monospace',
                      fontSize: '12px'
                    }}
                    placeholder="Enter description..."
                  />
                ) : null
              }
            />
            <TrendingTokens />
          </Box>
        </Box>
      </>
    );
  }
);

Overview.displayName = 'Overview';

export default Overview;
