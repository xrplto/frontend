import axios from 'axios';
import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  useDeferredValue,
  useTransition
} from 'react';
import useWebSocket from 'react-use-websocket';
import styled from '@emotion/styled';
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';
import { useDispatch, useSelector } from 'react-redux';
import { update_metrics, update_filteredCount, selectMetrics } from 'src/redux/statusSlice';
import TokenListHead from './TokenListHead';
import { TokenRow, MobileContainer, MobileHeader, HeaderCell } from './TokenRow';
import VirtualizedTokenList from './VirtualizedTokenList';
import React, { memo, lazy, Suspense } from 'react';
import { debounce, throttle } from 'src/utils/lodashLite';
import { useRouter } from 'next/router';
import { TokenListProfiler, memoryMonitor, performanceTracker, tokenListPerformance } from 'src/performance/setup';

// Simple memoization
const MemoizedTokenRow = memo(TokenRow);
const LazyEditTokenDialog = lazy(
  () => import(/* webpackChunkName: "edit-token-dialog" */ 'src/components/EditTokenDialog')
);
const LazyTrustSetDialog = lazy(
  () => import(/* webpackChunkName: "trust-set-dialog" */ 'src/components/TrustSetDialog')
);
const LazySearchToolbar = lazy(
  () => import(/* webpackChunkName: "search-toolbar" */ './SearchToolbar')
);
const LazyTokenListToolbar = lazy(
  () => import(/* webpackChunkName: "token-list-toolbar" */ './TokenListToolbar')
);

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 0; /* Ensure no padding */
  margin: 0; /* Ensure no margin */
  contain: layout style;
`;

const TableContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  gap: 0;
  padding-top: 2px;
  padding-bottom: 2px;
  padding-left: ${(props) => (props.isMobile ? '0' : '0')}; /* No left padding */
  padding-right: ${(props) => (props.isMobile ? '0' : '0')}; /* No right padding */
  overflow-x: auto;
  overflow-y: visible;
  width: 100%;
  min-width: 0;
  scrollbar-width: none;
  box-sizing: border-box;

  &::-webkit-scrollbar {
    display: none;
  }

  & > * {
    scroll-snap-align: center;
  }
`;

const StyledTable = styled.table`
  table-layout: fixed; /* Fixed layout for consistent spacing */
  width: 100%;
  border-collapse: collapse;
  contain: layout style paint;
  margin: 0;
  padding: 0;
  will-change: auto;
`;

const StyledTableBody = styled.tbody`
  margin: 0;
  padding: 0;

  tr {
    will-change: auto;
    contain: layout style paint;
    margin: 0;
    padding: 0;

    &:hover {
      background: ${(props) => props.darkMode
        ? 'linear-gradient(90deg, rgba(66, 133, 244, 0.02) 0%, transparent 100%)'
        : 'linear-gradient(90deg, rgba(66, 133, 244, 0.015) 0%, transparent 100%)'};
    }
  }

  td {
    padding: ${(props) => (props.isMobile ? '16px 8px' : '2px 6px')};
    height: ${(props) => (props.isMobile ? 'auto' : '32px')};
    contain: layout style paint;
    will-change: auto;
  }
`;

const ToolbarContainer = styled.div`
  margin-top: 0.25rem;
  display: ${(props) => (props.isMobile ? 'block' : 'flex')};
  justify-content: ${(props) => (props.isMobile ? 'flex-start' : 'center')};
  width: 100%;
`;

const SearchContainer = styled.div`
  margin-bottom: 0.5rem;
`;

const CustomColumnsPanel = styled.div`
  width: 100%;
  background: ${(props) => (props.darkMode
    ? 'linear-gradient(135deg, rgba(18, 18, 18, 0.95) 0%, rgba(25, 25, 25, 0.95) 100%)'
    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 250, 250, 0.98) 100%)')};
  border: 1px solid
    ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)')};
  border-radius: 16px;
  box-shadow: ${(props) => (props.darkMode
    ? '0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
    : '0 4px 20px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 1)')};
  padding: 24px;
  margin: 20px 0;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
`;

const ColumnsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  margin: 20px 0;
`;

const ColumnItem = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: ${(props) => (props.darkMode
    ? 'linear-gradient(135deg, rgba(66, 133, 244, 0.03) 0%, rgba(66, 133, 244, 0.01) 100%)'
    : 'linear-gradient(135deg, rgba(66, 133, 244, 0.02) 0%, rgba(66, 133, 244, 0.005) 100%)')};
  border-radius: 12px;
  cursor: pointer;
  border: 1px solid ${(props) => (props.darkMode ? 'rgba(66, 133, 244, 0.1)' : 'rgba(66, 133, 244, 0.08)')};

  &:hover {
    background: ${(props) =>
      props.darkMode
        ? 'linear-gradient(135deg, rgba(66, 133, 244, 0.06) 0%, rgba(66, 133, 244, 0.02) 100%)'
        : 'linear-gradient(135deg, rgba(66, 133, 244, 0.04) 0%, rgba(66, 133, 244, 0.01) 100%)'};
    border-color: ${(props) =>
      props.darkMode ? 'rgba(66, 133, 244, 0.2)' : 'rgba(66, 133, 244, 0.15)'};
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
`;

function TokenListComponent({
  showWatchList,
  tag,
  tagName,
  tags,
  tokens,
  setTokens,
  tMap,
  initialOrderBy
}) {
  const {
    accountProfile,
    openSnackbar,
    setLoading,
    darkMode,
    activeFiatCurrency,
    watchList,
    updateWatchList
  } = useContext(AppContext);
  const dispatch = useDispatch();
  const metrics = useSelector(selectMetrics);
  const exchRate = metrics[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics.CNY : null) || 1;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 960;
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const router = useRouter();

  // Disable WebSocket in development to avoid connection errors
  const WSS_FEED_URL = process.env.RUN_ENV === 'development' ? null : 'wss://api.xrpl.to/ws/sync';
  const BASE_URL = process.env.API_URL;

  const [filterName, setFilterName] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState(initialOrderBy || 'vol24hxrp');
  const [sync, setSync] = useState(1);
  const [editToken, setEditToken] = useState(null);
  const [trustToken, setTrustToken] = useState(null);
  const [rows, setRows] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tokenListRows');
      return saved ? parseInt(saved) : 50;
    }
    return 50;
  });
  const [showNew, setShowNew] = useState(false);
  const [showSlug, setShowSlug] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const [viewType, setViewType] = useState('row');
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tokenListViewMode') || 'classic';
    }
    return 'classic';
  });

  const [customColumns, setCustomColumns] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('customTokenColumns');
      const mobile = window.innerWidth < 960;
      if (saved) {
        const parsed = JSON.parse(saved);
        // On mobile, allow any combination of fields
        if (mobile && parsed.length >= 2) {
          return [parsed[0], parsed[1]];
        }
        return parsed;
      }
      // Default columns
      return mobile
        ? ['price', 'pro24h']
        : ['price', 'pro24h', 'volume24h', 'marketCap', 'sparkline'];
    }
    return ['price', 'pro24h', 'volume24h', 'marketCap', 'sparkline'];
  });

  const [customSettingsOpen, setCustomSettingsOpen] = useState(false);
  const [tempCustomColumns, setTempCustomColumns] = useState(customColumns);

  // Sync temp columns when opening settings
  useEffect(() => {
    if (customSettingsOpen) {
      // On mobile, ensure we have 2 columns selected
      if (isMobile) {
        // Use existing mobile columns or defaults
        if (customColumns && customColumns.length >= 2) {
          setTempCustomColumns([customColumns[0], customColumns[1]]);
        } else {
          setTempCustomColumns(['price', 'pro24h']);
        }
      } else {
        setTempCustomColumns(customColumns);
      }
    }
  }, [customSettingsOpen, customColumns, isMobile]);

  // Available columns configuration
  const AVAILABLE_COLUMNS = [
    { id: 'price', label: 'Price', description: 'Current token price' },
    { id: 'pro5m', label: '5M %', description: '5 minute change' },
    { id: 'pro1h', label: '1H %', description: '1 hour change' },
    { id: 'pro24h', label: '24H %', description: '24 hour change' },
    { id: 'pro7d', label: '7D %', description: '7 day change' },
    { id: 'pro30d', label: '30D %', description: '30 day estimate' },
    { id: 'volume24h', label: 'Volume 24H', description: '24 hour volume' },
    { id: 'volume7d', label: 'Volume 7D', description: '7 day volume' },
    { id: 'marketCap', label: 'Market Cap', description: 'Market capitalization' },
    { id: 'tvl', label: 'TVL', description: 'Total Value Locked' },
    { id: 'holders', label: 'Holders', description: 'Number of holders' },
    { id: 'trades', label: 'Trades', description: '24h trade count' },
    { id: 'created', label: 'Created', description: 'Token creation date' },
    { id: 'supply', label: 'Supply', description: 'Total supply' },
    { id: 'origin', label: 'Origin', description: 'Token origin' },
    { id: 'sparkline', label: 'Chart', description: '24h price chart' }
  ];

  // Save view mode to localStorage when it changes
  const handleViewModeChange = useCallback((newMode) => {
    setViewMode(newMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tokenListViewMode', newMode);
    }
  }, []);

  // Save custom columns to localStorage when they change
  const handleCustomColumnsChange = useCallback(
    (newColumns) => {
      setCustomColumns(newColumns);
      if (typeof window !== 'undefined') {
        localStorage.setItem('customTokenColumns', JSON.stringify(newColumns));
      }
      // Mobile header will update automatically via customColumns prop
    },
    [isMobile]
  );

  // Removed URL query parameter handling - now using direct state management

  const tableContainerRef = useRef(null);
  const tableRef = useRef(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTopLength, setScrollTopLength] = useState(0);

  const handleScrollX = useMemo(
    () =>
      throttle(() => {
        if (tableContainerRef.current) {
          const scrollLeft = tableContainerRef.current.scrollLeft;
          setScrollLeft(scrollLeft > 0);
        }
      }, 150), // Increased throttle time for smoother scrolling
    []
  );

  // Cache table dimensions to avoid repeated DOM queries
  const tableDimensionsRef = useRef({ top: 0, height: 0 });

  // Update cached dimensions when table mounts or resizes
  useEffect(() => {
    const updateDimensions = () => {
      if (tableRef.current) {
        const rect = tableRef.current.getBoundingClientRect();
        tableDimensionsRef.current = {
          top: rect.top + window.scrollY,
          height: rect.height
        };
      }
    };

    updateDimensions();

    // Update dimensions on resize
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (tableRef.current) {
      resizeObserver.observe(tableRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  const handleScrollY = useMemo(
    () =>
      throttle(() => {
        // Use cached dimensions instead of querying DOM
        const scrollTop = window.scrollY;
        const { top: tableOffsetTop, height: tableHeight } = tableDimensionsRef.current;

        if (tableHeight > 0) {
          const anchorTop = tableOffsetTop;
          const anchorBottom = tableOffsetTop + tableHeight;

          if (scrollTop > anchorTop && scrollTop < anchorBottom) {
            setScrollTopLength(scrollTop - anchorTop);
          } else {
            setScrollTopLength(0);
          }
        }
      }, 150), // Increased throttle time
    []
  );

  useEffect(() => {
    const tableContainer = tableContainerRef.current;
    const scrollOptions = { passive: true, capture: false };

    if (tableContainer) {
      tableContainer.addEventListener('scroll', handleScrollX, scrollOptions);
    }
    window.addEventListener('scroll', handleScrollY, scrollOptions);

    return () => {
      if (tableContainer) {
        tableContainer.removeEventListener('scroll', handleScrollX, scrollOptions);
      }
      window.removeEventListener('scroll', handleScrollY, scrollOptions);
    };
  }, [handleScrollX, handleScrollY]);

  const [lastJsonMessage, setLastJsonMessage] = useState(null);

  // React 18 transition hook
  const [isPending, startTransition] = useTransition();

  // Optimized WebSocket handler with React 18 features
  const wsMessageQueue = useRef([]);
  const wsProcessTimer = useRef(null);
  const wsProcessing = useRef(false);

  // Process WebSocket messages in batches using Web Worker pattern
  const processWebSocketQueue = useCallback(() => {
    if (wsProcessing.current || wsMessageQueue.current.length === 0) return;
    wsProcessing.current = true;

    const messages = wsMessageQueue.current.splice(0, 50); // Reduced batch size for smoother updates

    // Use requestAnimationFrame for smoother visual updates
    requestAnimationFrame(() => {
      const aggregatedTokens = new Map();
      let latestMetrics = null;

      messages.forEach((msg) => {
        if (msg.metrics) latestMetrics = msg.metrics;
        if (msg.tokens) {
          msg.tokens.forEach((token) => {
            // Only keep latest update per token
            const existing = aggregatedTokens.get(token.md5);
            if (!existing || token.time > existing.time) {
              aggregatedTokens.set(token.md5, token);
            }
          });
        }
      });

      // Batch updates without startTransition to reduce overhead
      if (latestMetrics) {
        requestAnimationFrame(() => dispatch(update_metrics(latestMetrics)));
      }

      if (aggregatedTokens.size > 0) {
        setTokens((prevTokens) => {
          // Only update if we have actual changes
          if (aggregatedTokens.size === 0) return prevTokens;

          // Use faster array iteration
          let hasChanges = false;
          const result = prevTokens.map(token => {
            const update = aggregatedTokens.get(token.md5);
            if (update && (
              token.exch !== update.exch ||
              token.pro24h !== update.pro24h ||
              token.vol24hxrp !== update.vol24hxrp
            )) {
              hasChanges = true;
              return {
                ...token,
                ...update,
                time: Date.now(),
                bearbull: token.exch > update.exch ? -1 : 1
              };
            }
            return token;
          });

          return hasChanges ? result : prevTokens;
        });
      }

      wsProcessing.current = false;
      // Continue processing if more messages
      if (wsMessageQueue.current.length > 0) {
        requestIdleCallback(() => processWebSocketQueue(), { timeout: 100 });
      }
    });
  }, [dispatch, setTokens, startTransition]);

  // Only use WebSocket if URL is provided (not in development mode)
  const { sendJsonMessage, readyState } = useWebSocket(
    WSS_FEED_URL,
    {
      shouldReconnect: () => !!WSS_FEED_URL,
      reconnectAttempts: 10,
      reconnectInterval: 3000,
      onMessage: useCallback(
        (event) => {
          try {
            const json = JSON.parse(event.data);

            // Track WebSocket message
            tokenListPerformance.onWSMessage();

            // Queue the message
            wsMessageQueue.current.push(json);

            // Process queue with a small delay to batch multiple messages
            if (wsProcessTimer.current) {
              clearTimeout(wsProcessTimer.current);
            }

            wsProcessTimer.current = setTimeout(() => {
              requestIdleCallback(() => processWebSocketQueue(), { timeout: 100 });
            }, 32); // Batch messages with 32ms delay (30fps for smoother updates)
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
          }
        },
        [processWebSocketQueue]
      ),
      onOpen: () => {
        if (WSS_FEED_URL) {
        }
      },
      onClose: () => {
        if (WSS_FEED_URL) {
        }
      }
    },
    !WSS_FEED_URL
  ); // Skip WebSocket connection if URL is null

  // Optimized token change detector using shallow comparison
  const applyTokenChanges = useCallback(
    (newTokens) => {
      setTokens((prevTokens) => {
        // Use a single pass with early exit optimization
        const tokenMap = new Map();
        const changedTokens = new Set();

        // Build map and track existing tokens
        prevTokens.forEach((token) => {
          tokenMap.set(token.md5, token);
        });

        // Apply updates and track changes
        newTokens.forEach((newToken) => {
          const existing = tokenMap.get(newToken.md5);
          if (existing) {
            // Fast shallow comparison of critical fields only
            const criticalFields = [
              'exch',
              'pro5m',
              'pro1h',
              'pro24h',
              'pro7d',
              'vol24hxrp',
              'marketcap'
            ];
            const hasChanged = criticalFields.some((field) => existing[field] !== newToken[field]);

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
        wsProcessTimer.current = null;
      }
      wsMessageQueue.current = [];
      wsProcessing.current = false;
      // Clean up any pending animations
      if (handleScrollX.cancel) handleScrollX.cancel();
      if (handleScrollY.cancel) handleScrollY.cancel();
    };
  }, [handleScrollX, handleScrollY]);

  const debouncedLoadTokens = useMemo(
    () =>
      throttle(() => {
        const start = page * rows;
        const ntag = tag || '';
        const watchAccount = showWatchList ? accountProfile?.account || '' : '';
        const limit = rows;

        axios
          .get(
            `${BASE_URL}/tokens?tag=${ntag}&watchlist=${watchAccount}&start=${start}&limit=${limit}&sortBy=${orderBy}&sortType=${order}&filter=${filterName}&showNew=${showNew}&showSlug=${showSlug}&showDate=${showDate}&skipMetrics=true`
          )
          .then((res) => {
            if (res.status === 200 && res.data) {
              const ret = res.data;
              dispatch(update_filteredCount(ret));
              // Use all tokens returned by API
              setTokens(ret.tokens || []);
            }
          })
          .catch((err) => {})
          .finally(() => setSearch(filterName));
      }, 500), // Increased throttle time
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
    if (sync > 0) {
      debouncedLoadTokens();
    }
  }, [debouncedLoadTokens, sync]);

  const onChangeWatchList = useCallback(
    async (md5) => {
      const success = await updateWatchList(md5);

      // If in watchlist view and update was successful, trigger re-fetch
      if (showWatchList && success) {
        setSync((prev) => prev + 1);
      }
    },
    [updateWatchList, showWatchList, setSync]
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
      if (typeof window !== 'undefined') {
        localStorage.setItem('tokenListRows', newRows);
      }
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
    setSync((prev) => prev + 1);
  }, []);

  // Performance optimization: use virtualization for large lists
  const [enableVirtualization, setEnableVirtualization] = useState(false);

  useEffect(() => {
    // Disable virtualization to prevent UI issues
    setEnableVirtualization(false);
  }, [rows, tokens.length, isMobile]);

  const visibleTokens = useMemo(() => {
    // Display tokens based on rows setting
    const maxRows = rows;
    return tokens.slice(0, maxRows);
  }, [tokens, rows]);

  // Skip deferred value to reduce re-renders
  const deferredTokens = visibleTokens;
  const isDeferring = false;

  // Remove DOM manipulation effect entirely to reduce overhead

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

      <SearchContainer>
        <Suspense fallback={<div style={{ height: '56px' }} />}>
          <LazySearchToolbar
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
            viewMode={viewMode}
            setViewMode={handleViewModeChange}
            customColumns={customColumns}
            setCustomColumns={handleCustomColumnsChange}
            setCustomSettingsOpen={setCustomSettingsOpen}
          />
        </Suspense>
      </SearchContainer>

      {customSettingsOpen && viewMode === 'custom' ? (
        <CustomColumnsPanel darkMode={darkMode}>
          <h3
            style={{
              margin: '0 0 10px 0',
              color: darkMode ? '#fff' : '#000',
              fontSize: '1.1rem'
            }}
          >
            Customize Table Columns
          </h3>
          <p
            style={{
              color: darkMode ? '#999' : '#666',
              fontSize: '14px',
              margin: '0 0 20px 0'
            }}
          >
            {isMobile
              ? 'Choose any data field for each column position'
              : 'Select the columns you want to display in the token list'}
          </p>

          {isMobile ? (
            // Mobile: Two dropdowns for selecting any column
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label
                  htmlFor="column-2-select"
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: darkMode ? '#999' : '#666',
                    textTransform: 'uppercase'
                  }}
                >
                  Column 2 (Middle)
                </label>
                <select
                  id="column-2-select"
                  value={tempCustomColumns[0] || 'price'}
                  onChange={(e) =>
                    setTempCustomColumns([e.target.value, tempCustomColumns[1] || 'pro24h'])
                  }
                  aria-label="Select data for column 2"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}`,
                    background: darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                    color: darkMode ? '#fff' : '#000',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  <optgroup label="Data Fields">
                    <option value="price">Price - Current token price</option>
                    <option value="volume24h">Vol - 24 hour volume</option>
                    <option value="volume7d">V7D - 7 day volume</option>
                    <option value="marketCap">MCap - Market capitalization</option>
                    <option value="tvl">TVL - Total Value Locked</option>
                    <option value="holders">Hldr - Number of holders</option>
                    <option value="trades">Trds - 24h trade count</option>
                    <option value="created">Age - Token creation date</option>
                    <option value="supply">Supp - Total supply</option>
                    <option value="origin">Orig - Token origin</option>
                  </optgroup>
                  <optgroup label="Percent Changes">
                    <option value="pro5m">5M - 5 minute change</option>
                    <option value="pro1h">1H - 1 hour change</option>
                    <option value="pro24h">24H - 24 hour change</option>
                    <option value="pro7d">7D - 7 day change</option>
                    <option value="pro30d">30D - 30 day estimate</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label
                  htmlFor="column-3-select"
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: darkMode ? '#999' : '#666',
                    textTransform: 'uppercase'
                  }}
                >
                  Column 3 (Right)
                </label>
                <select
                  id="column-3-select"
                  value={tempCustomColumns[1] || 'pro24h'}
                  onChange={(e) =>
                    setTempCustomColumns([tempCustomColumns[0] || 'price', e.target.value])
                  }
                  aria-label="Select data for column 3"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}`,
                    background: darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                    color: darkMode ? '#fff' : '#000',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  <optgroup label="Percent Changes">
                    <option value="pro5m">5M - 5 minute change</option>
                    <option value="pro1h">1H - 1 hour change</option>
                    <option value="pro24h">24H - 24 hour change</option>
                    <option value="pro7d">7D - 7 day change</option>
                    <option value="pro30d">30D - 30 day estimate</option>
                  </optgroup>
                  <optgroup label="Data Fields">
                    <option value="price">Price - Current token price</option>
                    <option value="volume24h">Vol - 24 hour volume</option>
                    <option value="volume7d">V7D - 7 day volume</option>
                    <option value="marketCap">MCap - Market capitalization</option>
                    <option value="tvl">TVL - Total Value Locked</option>
                    <option value="holders">Hldr - Number of holders</option>
                    <option value="trades">Trds - 24h trade count</option>
                    <option value="created">Age - Token creation date</option>
                    <option value="supply">Supp - Total supply</option>
                    <option value="origin">Orig - Token origin</option>
                  </optgroup>
                </select>
              </div>
            </div>
          ) : (
            // Desktop: Checkbox grid
            <ColumnsGrid>
              {AVAILABLE_COLUMNS.map((column) => (
                <ColumnItem key={column.id} darkMode={darkMode}>
                  <input
                    type="checkbox"
                    checked={tempCustomColumns.includes(column.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setTempCustomColumns([...tempCustomColumns, column.id]);
                      } else {
                        setTempCustomColumns(tempCustomColumns.filter((id) => id !== column.id));
                      }
                    }}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        color: darkMode ? '#fff' : '#000',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      {column.label}
                    </div>
                    <div
                      style={{
                        color: darkMode ? '#999' : '#666',
                        fontSize: '12px'
                      }}
                    >
                      {column.description}
                    </div>
                  </div>
                </ColumnItem>
              ))}
            </ColumnsGrid>
          )}

          <ButtonRow>
            <button
              onClick={() => {
                setTempCustomColumns(
                  isMobile
                    ? ['price', 'pro24h']
                    : ['price', 'pro24h', 'volume24h', 'marketCap', 'sparkline']
                );
              }}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}`,
                background: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                color: darkMode ? '#fff' : '#000',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Reset Default
            </button>
            <button
              onClick={() => {
                setCustomColumns(tempCustomColumns);
                if (typeof window !== 'undefined') {
                  localStorage.setItem('customTokenColumns', JSON.stringify(tempCustomColumns));
                }
                setCustomSettingsOpen(false);
              }}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                background: '#2196f3',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Apply Changes
            </button>
            <button
              onClick={() => {
                setTempCustomColumns(customColumns);
                setCustomSettingsOpen(false);
              }}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: `1px solid ${darkMode ? 'rgba(255, 100, 100, 0.2)' : 'rgba(255, 50, 50, 0.2)'}`,
                background: darkMode ? 'rgba(255, 100, 100, 0.1)' : 'rgba(255, 50, 50, 0.1)',
                color: darkMode ? '#ff6666' : '#cc0000',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
          </ButtonRow>
        </CustomColumnsPanel>
      ) : isMobile ? (
        <MobileContainer darkMode={darkMode}>
          <MobileHeader darkMode={darkMode}>
            <HeaderCell
              flex={2}
              align="left"
              darkMode={darkMode}
              sortable
              onClick={() => handleRequestSort(null, 'name')}
              debugColor="cyan"
            >
              Token
            </HeaderCell>
            <HeaderCell
              flex={1.2}
              align="right"
              darkMode={darkMode}
              sortable
              onClick={() => {
                const col = customColumns && customColumns[0] ? customColumns[0] : 'price';
                const sortCol =
                  col === 'price'
                    ? 'exch'
                    : col === 'volume24h'
                      ? 'vol24hxrp'
                      : col === 'volume7d'
                        ? 'vol7d'
                        : col === 'marketCap'
                          ? 'marketcap'
                          : col === 'holders'
                            ? 'holders'
                            : col === 'trades'
                              ? 'vol24htx'
                              : col === 'created'
                                ? 'dateon'
                                : col === 'supply'
                                  ? 'supply'
                                  : col === 'origin'
                                    ? 'origin'
                                    : col === 'tvl'
                                      ? 'tvl'
                                      : col;
                handleRequestSort(null, sortCol);
              }}
              debugColor="yellow"
            >
              {(() => {
                const col = customColumns && customColumns[0] ? customColumns[0] : 'price';
                const labels = {
                  price: 'PRICE',
                  volume24h: 'VOL',
                  volume7d: 'V7D',
                  marketCap: 'MCAP',
                  tvl: 'TVL',
                  holders: 'HLDR',
                  trades: 'TRDS',
                  supply: 'SUPP',
                  created: 'AGE',
                  origin: 'ORIG',
                  pro5m: '5M%',
                  pro1h: '1H%',
                  pro24h: '24H%',
                  pro7d: '7D%',
                  pro30d: '30D%'
                };
                return labels[col] || 'DATA';
              })()}
            </HeaderCell>
            <HeaderCell
              flex={0.7}
              align="right"
              darkMode={darkMode}
              sortable
              onClick={() => {
                const col = customColumns && customColumns[1] ? customColumns[1] : 'pro24h';
                const sortCol =
                  col === 'price'
                    ? 'exch'
                    : col === 'volume24h'
                      ? 'vol24hxrp'
                      : col === 'volume7d'
                        ? 'vol7d'
                        : col === 'marketCap'
                          ? 'marketcap'
                          : col === 'holders'
                            ? 'holders'
                            : col === 'trades'
                              ? 'vol24htx'
                              : col === 'created'
                                ? 'dateon'
                                : col === 'supply'
                                  ? 'supply'
                                  : col === 'origin'
                                    ? 'origin'
                                    : col === 'tvl'
                                      ? 'tvl'
                                      : col;
                handleRequestSort(null, sortCol);
              }}
              debugColor="magenta"
            >
              {(() => {
                const col = customColumns && customColumns[1] ? customColumns[1] : 'pro24h';
                const labels = {
                  price: 'PRICE',
                  volume24h: 'VOL',
                  volume7d: 'V7D',
                  marketCap: 'MCAP',
                  tvl: 'TVL',
                  holders: 'HLDR',
                  trades: 'TRDS',
                  supply: 'SUPP',
                  created: 'AGE',
                  origin: 'ORIG',
                  pro5m: '5M%',
                  pro1h: '1H%',
                  pro24h: '24H%',
                  pro7d: '7D%',
                  pro30d: '30D%'
                };
                return labels[col] || 'VALUE';
              })()}
            </HeaderCell>
          </MobileHeader>
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
              darkMode={darkMode}
              isMobile={true}
              isLoggedIn={!!accountProfile?.account}
              viewMode={viewMode}
              rows={rows}
              customColumns={customColumns}
            />
          ))}
        </MobileContainer>
      ) : enableVirtualization ? (
        <div style={{ width: '100%', height: 'calc(100vh - 300px)' }}>
          <VirtualizedTokenList
            tokens={deferredTokens}
            height={Math.min(window.innerHeight - 300, 800)}
            itemHeight={viewMode === 'compact' ? 36 : 48}
            setEditToken={setEditToken}
            setTrustToken={setTrustToken}
            watchList={watchList}
            onChangeWatchList={onChangeWatchList}
            scrollLeft={scrollLeft}
            activeFiatCurrency={activeFiatCurrency}
            exchRate={exchRate}
            darkMode={darkMode}
            page={page}
            rows={rows}
            isLoggedIn={!!accountProfile?.account}
            viewMode={viewMode}
            customColumns={customColumns}
          />
        </div>
      ) : (
        <TableContainer ref={tableContainerRef} isMobile={isMobile}>
          <StyledTable ref={tableRef} isMobile={isMobile}>
            <TokenListHead
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
              scrollLeft={scrollLeft}
              tokens={tokens}
              scrollTopLength={scrollTopLength}
              darkMode={darkMode}
              isMobile={isMobile}
              isLoggedIn={!!accountProfile?.account}
              viewMode={viewMode}
              customColumns={customColumns}
            />
            <StyledTableBody isMobile={isMobile}>
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
                  darkMode={darkMode}
                  isMobile={isMobile}
                  isLoggedIn={!!accountProfile?.account}
                  viewMode={viewMode}
                  customColumns={customColumns}
                  rows={rows}
                />
              ))}
            </StyledTableBody>
          </StyledTable>
        </TableContainer>
      )}
      <ToolbarContainer isMobile={isMobile}>
        <Suspense fallback={<div style={{ height: '52px' }} />}>
          <LazyTokenListToolbar
            rows={rows}
            setRows={updateRows}
            page={page}
            setPage={updatePage}
            tokens={tokens}
          />
        </Suspense>
      </ToolbarContainer>
    </>
  );
}

// Export with performance profiler
export default function TokenList(props) {
  return (
    <TokenListProfiler>
      <TokenListComponent {...props} />
    </TokenListProfiler>
  );
}
