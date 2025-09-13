import axios from 'axios';
import React, { memo, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useState, useEffect, useContext } from 'react';

// Material
import { Grid, Stack, useTheme, useMediaQuery, Typography, Paper, Button, Box } from '@mui/material';

// Context
import { AppContext } from 'src/AppContext';

// Lazy load heavy components
const MDEditor = dynamic(() => import('react-markdown-editor-lite'), {
  ssr: false,
  loading: () => <div style={{ height: '500px' }} />
});

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

// Import markdown parser lazily
let MarkdownIt = null;
const getMarkdownParser = () => {
  if (!MarkdownIt) {
    MarkdownIt = require('markdown-it');
  }
  return new MarkdownIt();
};

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

const Overview = memo(({ token, onTransactionClick, onOrderBookToggle, orderBookOpen, onOrderBookData }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const BASE_URL = process.env.API_URL;
  const { accountProfile, setLoading, openSnackbar } = useContext(AppContext);

  const [showEditor, setShowEditor] = useState(false);
  const [description, setDescription] = useState(token.description || '');
  const [pairs, setPairs] = useState([]);

  // Lazy initialize markdown parser
  const mdParser = useMemo(() => {
    if (showEditor) {
      return getMarkdownParser();
    }
    return null;
  }, [showEditor]);

  const handleEditorChange = useCallback(({ html, text }) => {
    setDescription(text);
  }, []);

  // Fetch pairs data
  useEffect(() => {
    const fetchPairs = async () => {
      try {
        const response = await fetch(`${BASE_URL}/pairs?md5=${token.md5}`);
        const data = await response.json();
        if (data.pairs) {
          setPairs(data.pairs);
        }
      } catch (error) {
        console.error('Error fetching pairs:', error);
      }
    };

    if (token.md5) {
      fetchPairs();
    }
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
          token.description = description;
          openSnackbar('Successful!', 'success');
          finish = true;
        } else {
          // { status: false, data: null, err: 'ERR_URL_SLUG' }
          const err = ret.err;
          openSnackbar(err, 'error');
        }
      }
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
    if (finish) setShowEditor(false);
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
          gap: { xs: 0, md: 3 }
        }}
      >
        <Box sx={{ flex: { md: '0 0 70%' }, maxWidth: { md: '70%' }, width: '100%' }}>
          <PriceChart token={token} />
          {!isMobile && !isTablet && (
            <Box sx={{ mt: 3 }}>
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
        <Box sx={{ flex: { md: '0 0 30%' }, maxWidth: { md: '30%' }, width: '100%', pr: { md: 1.5, lg: 2 } }}>
          <Swap 
            token={token}
            onOrderBookToggle={onOrderBookToggle}
            orderBookOpen={orderBookOpen}
            onOrderBookData={onOrderBookData}
          />
          <PriceStatistics token={token} sx={{ mt: 3 }} />
          <Description
            token={token}
            showEditor={showEditor}
            setShowEditor={setShowEditor}
            description={description}
            onApplyDescription={onApplyDescription}
            mdEditor={showEditor ? (
              <MDEditor
                value={description}
                renderHTML={(text) => mdParser.render(text)}
                onChange={handleEditorChange}
                style={{ height: '400px' }}
                view={{ menu: true, md: true, html: true, fullScreen: false, hideMenu: false }}
                canView={{ menu: true, md: true, html: true, fullScreen: false, hideMenu: true }}
              />
            ) : null}
          />
          <Box sx={{ mt: 1.5 }}>
            <TrendingTokens />
          </Box>
          
          {/* Test OrderBook Panel Button */}
          {onOrderBookToggle && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button 
                variant="contained" 
                onClick={onOrderBookToggle}
                color="primary"
              >
                {orderBookOpen ? 'Close OrderBook' : 'Show OrderBook'}
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      
    </>
  );
});

Overview.displayName = 'Overview';

export default Overview;
