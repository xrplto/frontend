import axios from 'axios';
import { useState, useEffect, useCallback, useRef, useMemo, useDeferredValue } from 'react';
import useWebSocket from 'react-use-websocket';
import { Box, Table, TableBody, useTheme, useMediaQuery } from '@mui/material';
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';
import { useDispatch, useSelector } from 'react-redux';
import { update_metrics, update_filteredCount, selectMetrics } from 'src/redux/statusSlice';
import TokenListHead from './TokenListHead';
import TokenListToolbar from './TokenListToolbar';
import SearchToolbar from './SearchToolbar';
import { TokenRow } from './TokenRow';
import EditTokenDialog from 'src/components/EditTokenDialog';
import TrustSetDialog from 'src/components/TrustSetDialog';
import React, { memo, lazy, Suspense } from 'react';
import { debounce } from 'lodash';
import { throttle } from 'lodash';
import { useRouter } from 'next/router';

// Optimized memoization with custom comparison
const MemoizedTokenRow = memo(TokenRow, (prevProps, nextProps) => {
  // Only re-render if specific props change
  const prev = prevProps.token;
  const next = nextProps.token;
  
  // Check critical fields that affect display
  if (prev.md5 !== next.md5) return false;
  if (prev.exch !== next.exch) return false;
  if (prev.pro5m !== next.pro5m) return false;
  if (prev.pro1h !== next.pro1h) return false;
  if (prev.pro24h !== next.pro24h) return false;
  if (prev.pro7d !== next.pro7d) return false;
  if (prev.vol24hxrp !== next.vol24hxrp) return false;
  if (prev.marketcap !== next.marketcap) return false;
  if (prev.time !== next.time) return false;
  
  // Check other props
  if (prevProps.scrollLeft !== nextProps.scrollLeft) return false;
  if (prevProps.exchRate !== nextProps.exchRate) return false;
  if (prevProps.activeFiatCurrency !== nextProps.activeFiatCurrency) return false;
  
  // Check watchlist
  const prevInWatchlist = prevProps.watchList.includes(prev.md5);
  const nextInWatchlist = nextProps.watchList.includes(next.md5);
  if (prevInWatchlist !== nextInWatchlist) return false;
  
  return true; // Props are equal, skip re-render
});
const LazyEditTokenDialog = lazy(() => import('src/components/EditTokenDialog'));
const LazyTrustSetDialog = lazy(() => import('src/components/TrustSetDialog'));

export default function TokenList({ showWatchList, tag, tagName, tags, tokens, setTokens, tMap, initialOrderBy }) {
  const { accountProfile, openSnackbar, setLoading, darkMode, activeFiatCurrency } =
    useContext(AppContext);
  const theme = useTheme();
  const dispatch = useDispatch();
  const metrics = useSelector(selectMetrics);
  const exchRate = metrics[activeFiatCurrency];
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();

  const WSS_FEED_URL = 'wss://api.xrpl.to/ws/sync';
  const BASE_URL = process.env.API_URL;

  const [filterName, setFilterName] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState(initialOrderBy || 'vol24hxrp');
  const [sync, setSync] = useState(showWatchList ? 1 : 0);
  const [editToken, setEditToken] = useState(null);
  const [trustToken, setTrustToken] = useState(null);
  const [rows, setRows] = useState(100);
  const [showNew, setShowNew] = useState(false);
  const [showSlug, setShowSlug] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const [viewType, setViewType] = useState('row');

  // Removed URL query parameter handling - now using direct state management

  const tableContainerRef = useRef(null);
  const tableRef = useRef(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTopLength, setScrollTopLength] = useState(0);

  const handleScrollX = useMemo(
    () => debounce(() => {
      if (tableContainerRef.current) {
        const scrollLeft = tableContainerRef.current.scrollLeft;
        setScrollLeft(scrollLeft > 0);
      }
    }, 150),
    []
  );

  const handleScrollY = useMemo(
    () => debounce(() => {
      if (tableRef.current) {
        const rect = tableRef.current.getBoundingClientRect();
        const scrollTop = window.scrollY;
        const tableOffsetTop = rect.top + scrollTop;
        const tableHeight = rect.height;
        const anchorTop = tableOffsetTop;
        const anchorBottom = tableOffsetTop + tableHeight;

        if (scrollTop > anchorTop && scrollTop < anchorBottom) {
          setScrollTopLength(scrollTop - anchorTop);
        } else {
          setScrollTopLength(0);
        }
      }
    }, 150),
    []
  );

  useEffect(() => {
    const tableContainer = tableContainerRef.current;
    if (tableContainer) {
      tableContainer.addEventListener('scroll', handleScrollX, { passive: true });
    }
    window.addEventListener('scroll', handleScrollY, { passive: true });

    return () => {
      if (tableContainer) {
        tableContainer.removeEventListener('scroll', handleScrollX);
      }
      window.removeEventListener('scroll', handleScrollY);
    };
  }, [handleScrollX, handleScrollY]);

  const [watchList, setWatchList] = useState([]);

  const [lastJsonMessage, setLastJsonMessage] = useState(null);
  
  // Optimized WebSocket handler with React 18 features
  const wsMessageQueue = useRef([]);
  const wsProcessTimer = useRef(null);
  
  // Process WebSocket messages in batches for better performance
  const processWebSocketQueue = useCallback(() => {
    if (wsMessageQueue.current.length === 0) return;
    
    // Use React 18's automatic batching
    const messages = [...wsMessageQueue.current];
    wsMessageQueue.current = [];
    
    // Process all messages at once
    const aggregatedTokens = new Map();
    let latestMetrics = null;
    
    messages.forEach(msg => {
      if (msg.metrics) {
        latestMetrics = msg.metrics;
      }
      if (msg.tokens) {
        msg.tokens.forEach(token => {
          aggregatedTokens.set(token.md5, token);
        });
      }
    });
    
    // Apply updates in a single batch
    if (latestMetrics) {
      dispatch(update_metrics(latestMetrics));
    }
    
    if (aggregatedTokens.size > 0) {
      setTokens(prevTokens => {
        const tokenMap = new Map(prevTokens.map(t => [t.md5, t]));
        let hasChanges = false;
        
        aggregatedTokens.forEach((newToken, md5) => {
          const existing = tokenMap.get(md5);
          if (existing) {
            // Quick check for changes
            const needsUpdate = Object.keys(newToken).some(
              key => newToken[key] !== existing[key]
            );
            
            if (needsUpdate) {
              tokenMap.set(md5, {
                ...existing,
                ...newToken,
                time: Date.now(),
                bearbull: existing.exch > newToken.exch ? -1 : 1
              });
              hasChanges = true;
            }
          }
        });
        
        return hasChanges ? Array.from(tokenMap.values()) : prevTokens;
      });
    }
  }, [dispatch, setTokens]);

  const { sendJsonMessage, readyState } = useWebSocket(WSS_FEED_URL, {
    shouldReconnect: () => true,
    reconnectAttempts: 10,
    reconnectInterval: 3000,
    onMessage: useCallback((event) => {
      try {
        const json = JSON.parse(event.data);
        
        // Queue the message
        wsMessageQueue.current.push(json);
        
        // Process queue with a small delay to batch multiple messages
        if (wsProcessTimer.current) {
          clearTimeout(wsProcessTimer.current);
        }
        
        wsProcessTimer.current = setTimeout(() => {
          processWebSocketQueue();
        }, 500); // Process every 580ms - 8 updates per 4s ledger cycle
        
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    }, [processWebSocketQueue]),
    onOpen: () => {
      console.log('WebSocket connected to', WSS_FEED_URL);
    },
    onClose: () => {
      console.log('WebSocket disconnected');
    }
  });

  // Add a state to track if metrics have been loaded
  const [metricsLoaded, setMetricsLoaded] = useState(false);

  // Fallback to REST API for metrics if not loaded via WebSocket
  useEffect(() => {
    // Only fetch if metrics are not yet loaded and we have a BASE_URL
    if (!metricsLoaded && BASE_URL) {
      const fetchMetrics = async () => {
        try {
          const metricsResponse = await axios.get(
            `${BASE_URL}/tokens?start=0&limit=100&sortBy=vol24hxrp&sortType=desc&filter=`
          );
          if (metricsResponse.status === 200 && metricsResponse.data) {
            dispatch(update_metrics(metricsResponse.data));
            setMetricsLoaded(true); // Mark metrics as loaded
          }
        } catch (error) {
          console.error('Error fetching metrics via REST API:', error);
        }
      };
      // Check if metrics are already in Redux state from SSR or previous WS update
      if (
        metrics.global &&
        metrics[activeFiatCurrency] &&
        metrics.tokenCreation &&
        metrics.tokenCreation.length > 0
      ) {
        setMetricsLoaded(true);
      } else {
        fetchMetrics();
      }
    }
  }, [metricsLoaded, BASE_URL, dispatch, metrics, activeFiatCurrency]);

  // Optimized token change detector using shallow comparison
  const applyTokenChanges = useCallback(
    (newTokens) => {
      setTokens((prevTokens) => {
        // Use a single pass with early exit optimization
        const tokenMap = new Map();
        const changedTokens = new Set();
        
        // Build map and track existing tokens
        prevTokens.forEach(token => {
          tokenMap.set(token.md5, token);
        });
        
        // Apply updates and track changes
        newTokens.forEach((newToken) => {
          const existing = tokenMap.get(newToken.md5);
          if (existing) {
            // Fast shallow comparison of critical fields only
            const criticalFields = ['exch', 'pro5m', 'pro1h', 'pro24h', 'pro7d', 'vol24hxrp', 'marketcap'];
            const hasChanged = criticalFields.some(field => existing[field] !== newToken[field]);
            
            if (hasChanged) {
              const updated = {
                ...existing,
                ...newToken,
                time: Date.now(),
                bearbull: existing.exch > newToken.exch ? -1 : 1
              };
              tokenMap.set(newToken.md5, updated);
              changedTokens.add(newToken.md5);
            }
          }
        });
        
        // Only recreate array if changes detected
        return changedTokens.size > 0 ? Array.from(tokenMap.values()) : prevTokens;
      });
    },
    [setTokens]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (wsProcessTimer.current) {
        clearTimeout(wsProcessTimer.current);
      }
    };
  }, []);

  const debouncedLoadTokens = useMemo(
    () => debounce(() => {
      const start = page * rows;
      const ntag = tag || '';
      const watchAccount = showWatchList ? accountProfile?.account || '' : '';

      axios
        .get(
          `${BASE_URL}/tokens?tag=${ntag}&watchlist=${watchAccount}&start=${start}&limit=${rows}&sortBy=${orderBy}&sortType=${order}&filter=${filterName}&showNew=${showNew}&showSlug=${showSlug}&showDate=${showDate}&skipMetrics=true`
        )
        .then((res) => {
          if (res.status === 200 && res.data) {
            const ret = res.data;
            dispatch(update_filteredCount(ret));
            setTokens(ret.tokens);
          }
        })
        .catch((err) => console.log('err->>', err))
        .finally(() => setSearch(filterName));
    }, 500),
    [
      accountProfile,
      filterName,
      order,
      orderBy,
      page,
      rows,
      showDate,
      showNew,
      showSlug,
      showWatchList,
      tag,
      dispatch,
      setTokens
    ]
  );

  useEffect(() => {
    if (sync > 0) debouncedLoadTokens();
  }, [debouncedLoadTokens, sync]);

  useEffect(() => {
    const getWatchList = () => {
      const account = accountProfile?.account;
      if (!account) {
        setWatchList([]);
        return;
      }

      axios
        .get(`${BASE_URL}/watchlist/get_list?account=${account}`)
        .then((res) => {
          if (res.status === 200) {
            setWatchList(res.data.watchlist);
          }
        })
        .catch((err) => console.log('Error on getting watchlist!', err));
    };
    getWatchList();
  }, [accountProfile, sync]);

  const onChangeWatchList = useCallback(
    async (md5) => {
      const account = accountProfile?.account;
      const accountToken = accountProfile?.token;

      if (!account || !accountToken) {
        openSnackbar('Please login!', 'error');
        return;
      }

      // Optimistically update the local state
      const newWatchList = watchList.includes(md5)
        ? watchList.filter((item) => item !== md5)
        : [...watchList, md5];
      setWatchList(newWatchList);

      // If in watchlist view, update the tokens list immediately
      if (showWatchList) {
        setTokens((prevTokens) => prevTokens.filter((token) => newWatchList.includes(token.md5)));
      }

      try {
        const action = watchList.includes(md5) ? 'remove' : 'add';
        const body = { md5, account, action };

        const res = await axios.post(`${BASE_URL}/watchlist/update_watchlist`, body, {
          headers: { 'x-access-token': accountToken }
        });

        if (res.status === 200) {
          const ret = res.data;
          if (ret.status) {
            // Server confirmed the change, no need to update state again
            openSnackbar('Watchlist updated successfully!', 'success');
          } else {
            // Revert the local change if server update failed
            setWatchList(watchList);
            if (showWatchList) {
              setSync((prev) => prev + 1); // Trigger a re-fetch of tokens
            }
            openSnackbar(ret.err || 'Failed to update watchlist', 'error');
          }
        }
      } catch (err) {
        console.error(err);
        // Revert the local change if request failed
        setWatchList(watchList);
        if (showWatchList) {
          setSync((prev) => prev + 1); // Trigger a re-fetch of tokens
        }
        openSnackbar('Failed to update watchlist', 'error');
      }
    },
    [accountProfile, watchList, showWatchList, setTokens, openSnackbar, setSync]
  );

  const handleRequestSort = (event, id) => {
    if (orderBy === id) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setOrderBy(id);
      setOrder('desc');
    }
    setPage(0);
    setSync((prev) => prev + 1);
  };

  const updatePage = (newPage) => {
    if (newPage !== page) {
      setPage(newPage);
      setSync(sync + 1);
    }
  };

  const updateRows = (newRows) => {
    if (newRows !== rows) {
      setRows(newRows);
      if (tokens.length < newRows) setSync(sync + 1);
    }
  };

  const updateShowNew = (val) => {
    setShowNew(val);
    setPage(0);
    setSync(sync + 1);
  };

  const updateShowSlug = (val) => {
    setShowSlug(val);
    setPage(0);
    setSync(sync + 1);
  };

  const updateShowDate = (val) => {
    setShowDate(val);
    setPage(0);
    setSync(sync + 1);
  };

  const handleFilterByName = useCallback((event) => {
    setFilterName(event.target.value);
    setPage(0);
    setSync(prev => prev + 1);
  }, []);

  // Performance optimization: limit initial render to 50 rows
  const [renderCount, setRenderCount] = useState(50);
  
  useEffect(() => {
    if (rows > 50) {
      // Progressively render more rows after initial mount
      const timer = setTimeout(() => {
        setRenderCount(rows);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setRenderCount(rows);
    }
  }, [rows]);
  
  const visibleTokens = useMemo(() => {
    return tokens.slice(0, Math.min(renderCount, rows));
  }, [tokens, rows, renderCount]);
  
  // Use deferred value for smoother updates during rapid WebSocket messages
  const deferredTokens = useDeferredValue(visibleTokens);
  const isDeferring = deferredTokens !== visibleTokens;

  // Preload TokenRow component properties to avoid layout calculations
  useEffect(() => {
    if (visibleTokens.length > 0) {
      requestAnimationFrame(() => {
        // Force browser to calculate styles ahead of time
        const container = tableContainerRef.current;
        if (container) {
          container.style.willChange = 'scroll-position';
          setTimeout(() => {
            container.style.willChange = 'auto';
          }, 1000);
        }
      });
    }
  }, [visibleTokens.length]);

  return (
    <>
      {editToken && (
        <Suspense fallback={<div />}>
          <LazyEditTokenDialog token={editToken} setToken={setEditToken} />
        </Suspense>
      )}

      {trustToken && (
        <Suspense fallback={<div />}>
          <LazyTrustSetDialog token={trustToken} setToken={setTrustToken} />
        </Suspense>
      )}

      <Box sx={{ mb: 0.5 }}>
        <SearchToolbar
          tags={tags}
          tagName={tagName}
          filterName={filterName}
          onFilterName={handleFilterByName}
          rows={rows}
          setRows={updateRows}
          showNew={showNew}
          setShowNew={updateShowNew}
          showSlug={showSlug}
          setShowSlug={updateShowSlug}
          showDate={showDate}
          setShowDate={updateShowDate}
          viewType={viewType}
          setViewType={setViewType}
          setTokens={setTokens}
          setPage={setPage}
          setSync={setSync}
          sync={sync}
          currentOrderBy={orderBy}
          setOrderBy={setOrderBy}
        />
      </Box>

      <Box
        sx={{
          display: 'flex',
          gap: 0,
          paddingTop: '2px',
          paddingBottom: '2px',
          overflowX: 'auto',
          overflowY: 'visible',
          width: '100%',
          minWidth: 0,
          '& > *': {
            scrollSnapAlign: 'center'
          },
          '::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
          '& .MuiTableCell-root': {
            padding: '2px 6px',
            height: '32px',
            contain: 'layout style paint'
          },
          '& .MuiTableRow-root': {
            willChange: 'transform',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            }
          }
        }}
        ref={tableContainerRef}
      >
        <Table ref={tableRef} size="small" sx={{ 
          tableLayout: isMobile ? 'auto' : 'fixed',
          opacity: isDeferring ? 0.95 : 1,
          transition: 'opacity 0.1s ease'
        }}>
          <TokenListHead
            order={order}
            orderBy={orderBy}
            onRequestSort={handleRequestSort}
            scrollLeft={scrollLeft}
            tokens={tokens}
            scrollTopLength={scrollTopLength}
          />
          <TableBody>
            {deferredTokens.map((row, idx) => (
              <MemoizedTokenRow
                key={row.md5}
                time={row.time}
                idx={idx + page * rows}
                token={row}
                setEditToken={setEditToken}
                setTrustToken={setTrustToken}
                watchList={watchList}
                onChangeWatchList={onChangeWatchList}
                scrollLeft={scrollLeft}
                activeFiatCurrency={activeFiatCurrency}
                exchRate={exchRate}
              />
            ))}
          </TableBody>
        </Table>
      </Box>
      <Box
        sx={{
          mt: 0.25,
          display: isMobile ? 'block' : 'flex',
          justifyContent: isMobile ? 'flex-start' : 'center',
          width: '100%'
        }}
      >
        <TokenListToolbar
          rows={rows}
          setRows={updateRows}
          page={page}
          setPage={updatePage}
          tokens={tokens}
        />
      </Box>
    </>
  );
}
