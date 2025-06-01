import dynamic from 'next/dynamic';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef, useContext, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';

// Material
import { Box, Divider, Tab, Tabs, useTheme, useMediaQuery } from '@mui/material';

// Components
import LinkCascade from './LinkCascade';
import Common from './common';
import { AppContext } from 'src/AppContext';

// Lazy load components
const Overview = dynamic(() => import('./overview'));
const Market = dynamic(() => import('./market'));
const Trade = dynamic(() => import('./trade'));
const RichList = dynamic(() => import('./richlist'));
const TopTraders = dynamic(() => import('./toptraders'));

// ---------------------------------------------------

function TabPanel(props) {
  const { children, value, id, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== id}
      id={`simple-tabpanel-${id}`}
      aria-labelledby={`simple-tab-${id}`}
      {...other}
    >
      {value === id && (
        <Box
          sx={{
            p: { xs: 0, md: 3 },
            pt: { xs: 3 }
          }}
        >
          {children}
        </Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  id: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired
};

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`
  };
}

const tabValues = ['', 'markets', 'orderbook', 'holders', 'traders'];
const tabLabels = ['Overview', 'Markets', 'Orderbook', 'Holders', 'Top Traders'];

function getTabID(tab) {
  if (!tab) return 0;
  const idx = tabValues.indexOf(tab);
  if (idx < 0) return 0;
  return idx;
}

export default function TokenDetail({ token, tab }) {
  const { darkMode } = useContext(AppContext);

  const [tabID, setTabID] = useState(getTabID(tab));
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [isFixed, setIsFixed] = useState(false);
  const tabRef = useRef(null);

  const gotoTabView = useCallback((event) => {
    const anchor = (event.target.ownerDocument || document).querySelector(
      '#back-to-top-tab-anchor'
    );

    if (anchor) {
      anchor.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, []);

  const handleChangeTab = useCallback(
    (event, newID) => {
      let url = '';
      if (newID > 0) url = `/token/${token.slug}/${tabValues[newID]}`;
      else url = `/token/${token.slug}/`;
      window.history.pushState({}, null, url);
      setTabID(newID);
      gotoTabView(event);
    },
    [token.slug, gotoTabView]
  );

  const tabStyle = useMemo(
    () =>
      isFixed
        ? {
            position: 'sticky',
            top: 0,
            backgroundColor: !darkMode ? '#fff' : '#000000',
            width: '100%',
            zIndex: 1100,
            boxShadow: `0px 2px 4px ${
              !darkMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'
            }`,
            transition: 'all 0.3s ease'
          }
        : {
            width: '100%',
            backgroundColor: !darkMode ? '#fff' : '#000000',
            transition: 'all 0.3s ease'
          },
    [isFixed, darkMode]
  );

  useEffect(() => {
    const handleScroll = () => {
      if (tabRef.current) {
        const { offsetTop } = tabRef.current;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        setIsFixed(scrollTop > offsetTop);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <Box sx={{ position: 'relative' }}>
      {!isMobile && <LinkCascade token={token} tabID={tabID} tabLabels={tabLabels} />}

      <Common token={token} />

      {!isMobile && (
        <Divider orientation="horizontal" sx={{ mt: 2, mb: 2 }} variant="middle" flexItem />
      )}

      <div id="back-to-top-tab-anchor" />

      <Box
        ref={tabRef}
        sx={{
          position: 'sticky',
          top: 0,
          backgroundColor: !darkMode ? '#fff' : '#000000',
          zIndex: 1100
        }}
      >
        <Tabs
          value={tabID}
          onChange={handleChangeTab}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="token-tabs"
          sx={{
            minHeight: '40px',
            '& .MuiTabs-flexContainer': {
              height: '40px'
            },
            '& .MuiTabs-indicator': {
              height: '2px'
            }
          }}
        >
          {tabLabels.map((label, index) => (
            <Tab
              key={index}
              value={index}
              label={label}
              {...a11yProps(index)}
              sx={{
                minHeight: '40px',
                padding: '6px 16px',
                textTransform: 'none'
              }}
            />
          ))}
        </Tabs>
      </Box>

      <TabPanel value={tabID} id={0}>
        <Overview token={token} />
      </TabPanel>
      <TabPanel value={tabID} id={1}>
        <Market token={token} />
      </TabPanel>
      <TabPanel value={tabID} id={2}>
        <Trade token={token} />
      </TabPanel>
      <TabPanel value={tabID} id={3}>
        <RichList token={token} />
      </TabPanel>
      <TabPanel value={tabID} id={4}>
        <TopTraders token={token} />
      </TabPanel>
    </Box>
  );
}

// Utility function for throttling
function throttle(func, limit) {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
