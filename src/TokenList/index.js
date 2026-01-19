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
import styled from '@emotion/styled';
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';
import { useDispatch, useSelector } from 'react-redux';
import { update_metrics, update_filteredCount, selectMetrics } from 'src/redux/statusSlice';
import { TokenListHead } from './TokenListControls';
import { TokenRow, MobileContainer, MobileHeader, HeaderCell } from './TokenRow';
import React, { memo, lazy, Suspense } from 'react';
import { throttle } from 'src/utils/formatters';
import { useRouter } from 'next/router';
import { TokenListToolbar } from './TokenListControls';
import { useTokenSync } from 'src/hooks/useTokenSync';

// TokenRow is already memoized in TokenRow.js
const MemoizedTokenRow = TokenRow;
const LazyEditTokenDialog = lazy(
  () => import(/* webpackChunkName: "edit-token-dialog" */ 'src/components/EditTokenDialog')
);
// TrustSetDialog removed - Xaman no longer used
const LazyTrustSetDialog = () => null;
const LazySearchToolbar = lazy(
  () => import(/* webpackChunkName: "search-toolbar" */ './SearchToolbar')
);

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 0;
  margin: 0;
  contain: layout style;
  overflow: visible;
`;

const TableWrapper = styled.div`
  border-radius: 12px;
  background: transparent;
  border: 1.5px solid ${(props) => props.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'};
  overflow: hidden;
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
  table-layout: auto;
  width: auto;
  min-width: 100%;
  border-collapse: collapse;
  margin: 0;
  padding: 0;
`;

const StyledTableBody = styled.tbody`
  margin: 0;
  padding: 0;

  tr {
    margin: 0;
    padding: 0;

    &:hover {
      background: ${(props) => props.darkMode
        ? 'rgba(255, 255, 255, 0.02)'
        : 'rgba(0, 0, 0, 0.015)'};
    }
  }

  td {
    padding: ${(props) => (props.isMobile ? '16px 8px' : '2px 6px')};
    height: ${(props) => (props.isMobile ? 'auto' : '32px')};
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
  overflow: visible;
`;

const CustomColumnsPanel = styled.div`
  width: 100%;
  background: ${(props) => (props.darkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.8)')};
  backdrop-filter: blur(16px);
  border: 1.5px solid ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)')};
  border-radius: 12px;
  padding: 24px;
  margin: 20px 0;
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
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  border: 1.5px solid ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')};

  &:hover {
    background: ${(props) => (props.darkMode ? 'rgba(66, 133, 244, 0.04)' : 'rgba(66, 133, 244, 0.02)')};
    border-color: #4285f4;
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
  hideFilters,
  tag,
  tagName,
  tags,
  tokens,
  setTokens,
  tMap,
  initialOrderBy,
  autoAddNewTokens = false
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

  const BASE_URL = 'https://api.xrpl.to/v1';

  const [filterName, setFilterName] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState(initialOrderBy || 'vol24hxrp');
  const [sync, setSync] = useState(tokens?.length > 0 ? 0 : 1);
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
  const [liveTags, setLiveTags] = useState(tags);
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tokenListViewMode') || 'classic';
    }
    return 'classic';
  });

  const [customColumns, setCustomColumns] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('customTokenColumns');
      if (saved) {
        const parsed = JSON.parse(saved);
        const mobile = window.innerWidth < 960;
        // On mobile, allow any combination of fields
        if (mobile && parsed.length >= 2) {
          return [parsed[0], parsed[1]];
        }
        return parsed;
      }
    }
    // No saved columns - return empty to fall through to classic view
    return [];
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
    // Update customColumns for mobile based on view mode
    const mobileColumnPresets = {
      classic: ['price', 'pro24h'],
      priceChange: ['price', 'pro1h'],
      marketData: ['marketCap', 'volume24h'],
      topGainers: ['price', 'pro5m'],
      trader: ['volume24h', 'pro24h']
    };
    const preset = mobileColumnPresets[newMode];
    if (preset) {
      setCustomColumns(preset);
      if (typeof window !== 'undefined') {
        localStorage.setItem('customTokenColumns', JSON.stringify(preset));
      }
    } else if (newMode === 'custom') {
      // Open custom settings dialog
      setCustomSettingsOpen(true);
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

  // React 18 transition hook
  const [isPending, startTransition] = useTransition();

  // WebSocket connection enabled immediately
  const [wsEnabled, setWsEnabled] = useState(true);

  // Handle token updates from WebSocket
  const handleTokensUpdate = useCallback(
    (updatedTokens) => {
      setTokens((prevTokens) => {
        if (!updatedTokens || updatedTokens.length === 0) return prevTokens;

        let hasChanges = false;
        const tokenMap = new Map(prevTokens.map((t) => [t.md5, t]));

        updatedTokens.forEach((update) => {
          const existing = tokenMap.get(update.md5);
          if (existing) {
            // Update existing token if price changed
            if (existing.exch !== update.exch) {
              hasChanges = true;
              tokenMap.set(update.md5, {
                ...existing,
                ...update,
                time: Date.now(),
                bearbull: existing.exch > update.exch ? -1 : 1,
                bearbullTime: Date.now()
              });
            }
          } else if (autoAddNewTokens && update.name && update.dateon) {
            // Add new token if autoAddNewTokens enabled and has required fields
            hasChanges = true;
            tokenMap.set(update.md5, { ...update, time: Date.now(), isNew: true });
          }
        });

        if (!hasChanges) return prevTokens;

        let result = Array.from(tokenMap.values());
        // Sort by dateon desc if adding new tokens
        if (autoAddNewTokens) {
          result.sort((a, b) => new Date(b.dateon) - new Date(a.dateon));
        }
        return result;
      });
    },
    [setTokens, autoAddNewTokens]
  );

  // Handle metrics updates from WebSocket
  const handleMetricsUpdate = useCallback(
    (metrics) => {
      dispatch(update_metrics(metrics));
    },
    [dispatch]
  );

  // Handle tags updates from WebSocket
  const handleTagsUpdate = useCallback((newTags) => {
    setLiveTags(newTags);
  }, []);

  // Use the new WebSocket hook with subscription filtering
  const { subscribe, resync } = useTokenSync({
    onTokensUpdate: handleTokensUpdate,
    onMetricsUpdate: handleMetricsUpdate,
    onTagsUpdate: handleTagsUpdate,
    enabled: wsEnabled
  });

  // Cleanup scroll handlers on unmount
  useEffect(() => {
    return () => {
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

      {!hideFilters && (
        <SearchContainer>
          <Suspense fallback={<div style={{ height: '56px' }} />}>
            <LazySearchToolbar
              tags={liveTags || tags}
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
      )}

      {customSettingsOpen && viewMode === 'custom' ? (
        <CustomColumnsPanel darkMode={darkMode} style={isMobile ? { padding: '16px', margin: '8px 0', borderRadius: '8px' } : {}}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, color: darkMode ? '#fff' : '#000', fontSize: isMobile ? '15px' : '18px', fontWeight: 500 }}>
              {isMobile ? 'Custom Columns' : 'Customize Table Columns'}
            </h3>
            {isMobile && (
              <button
                onClick={() => { setTempCustomColumns(customColumns); setCustomSettingsOpen(false); }}
                style={{ background: 'none', border: 'none', color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', fontSize: '20px', cursor: 'pointer', padding: '4px' }}
              >
                ×
              </button>
            )}
          </div>

          {isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label htmlFor="column-2-select" style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: 500, color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Middle Column
                </label>
                <select
                  id="column-2-select"
                  value={tempCustomColumns[0] || 'price'}
                  onChange={(e) => setTempCustomColumns([e.target.value, tempCustomColumns[1] || 'pro24h'])}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1.5px solid ${darkMode ? '#f59e0b' : 'rgba(0,0,0,0.1)'}`, background: darkMode ? '#1a1a1a' : '#fff', color: darkMode ? '#fff' : '#000', fontSize: '13px', cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${darkMode ? '%23fff' : '%23000'}' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                >
                  <option value="price" style={{ background: darkMode ? '#1a1a1a' : '#fff', color: darkMode ? '#fff' : '#000' }}>Price</option>
                  <option value="volume24h" style={{ background: darkMode ? '#1a1a1a' : '#fff', color: darkMode ? '#fff' : '#000' }}>Volume 24h</option>
                  <option value="volume7d" style={{ background: darkMode ? '#1a1a1a' : '#fff', color: darkMode ? '#fff' : '#000' }}>Volume 7d</option>
                  <option value="marketCap" style={{ background: darkMode ? '#1a1a1a' : '#fff', color: darkMode ? '#fff' : '#000' }}>Market Cap</option>
                  <option value="tvl" style={{ background: darkMode ? '#1a1a1a' : '#fff', color: darkMode ? '#fff' : '#000' }}>TVL</option>
                  <option value="holders" style={{ background: darkMode ? '#1a1a1a' : '#fff', color: darkMode ? '#fff' : '#000' }}>Holders</option>
                  <option value="trades" style={{ background: darkMode ? '#1a1a1a' : '#fff', color: darkMode ? '#fff' : '#000' }}>Trades</option>
                  <option value="created" style={{ background: darkMode ? '#1a1a1a' : '#fff', color: darkMode ? '#fff' : '#000' }}>Age</option>
                  <option value="supply" style={{ background: darkMode ? '#1a1a1a' : '#fff', color: darkMode ? '#fff' : '#000' }}>Supply</option>
                  <option value="pro5m" style={{ background: darkMode ? '#1a1a1a' : '#fff', color: darkMode ? '#fff' : '#000' }}>5m %</option>
                  <option value="pro1h" style={{ background: darkMode ? '#1a1a1a' : '#fff', color: darkMode ? '#fff' : '#000' }}>1h %</option>
                  <option value="pro24h" style={{ background: darkMode ? '#1a1a1a' : '#fff', color: darkMode ? '#fff' : '#000' }}>24h %</option>
                  <option value="pro7d" style={{ background: darkMode ? '#1a1a1a' : '#fff', color: darkMode ? '#fff' : '#000' }}>7d %</option>
                </select>
              </div>
              <div>
                <label htmlFor="column-3-select" style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: 500, color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Right Column
                </label>
                <select
                  id="column-3-select"
                  value={tempCustomColumns[1] || 'pro24h'}
                  onChange={(e) => setTempCustomColumns([tempCustomColumns[0] || 'price', e.target.value])}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1.5px solid ${darkMode ? '#f59e0b' : 'rgba(0,0,0,0.1)'}`, background: darkMode ? '#1a1a1a' : '#fff', color: darkMode ? '#fff' : '#000', fontSize: '13px', cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${darkMode ? '%23fff' : '%23000'}' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                >
                  <option value="pro5m" style={{ background: darkMode ? '#1a1a1a' : '#fff', color: darkMode ? '#fff' : '#000' }}>5m %</option>
                  <option value="pro1h" style={{ background: darkMode ? '#1a1a1a' : '#fff', color: darkMode ? '#fff' : '#000' }}>1h %</option>
                  <option value="pro24h" style={{ background: darkMode ? '#1a1a1a' : '#fff', color: darkMode ? '#fff' : '#000' }}>24h %</option>
                  <option value="pro7d" style={{ background: darkMode ? '#1a1a1a' : '#fff', color: darkMode ? '#fff' : '#000' }}>7d %</option>
                  <option value="price" style={{ background: darkMode ? '#1a1a1a' : '#fff', color: darkMode ? '#fff' : '#000' }}>Price</option>
                  <option value="volume24h" style={{ background: darkMode ? '#1a1a1a' : '#fff', color: darkMode ? '#fff' : '#000' }}>Volume 24h</option>
                  <option value="volume7d" style={{ background: darkMode ? '#1a1a1a' : '#fff', color: darkMode ? '#fff' : '#000' }}>Volume 7d</option>
                  <option value="marketCap" style={{ background: darkMode ? '#1a1a1a' : '#fff', color: darkMode ? '#fff' : '#000' }}>Market Cap</option>
                  <option value="tvl" style={{ background: darkMode ? '#1a1a1a' : '#fff', color: darkMode ? '#fff' : '#000' }}>TVL</option>
                  <option value="holders" style={{ background: darkMode ? '#1a1a1a' : '#fff', color: darkMode ? '#fff' : '#000' }}>Holders</option>
                  <option value="trades" style={{ background: darkMode ? '#1a1a1a' : '#fff', color: darkMode ? '#fff' : '#000' }}>Trades</option>
                  <option value="created" style={{ background: darkMode ? '#1a1a1a' : '#fff', color: darkMode ? '#fff' : '#000' }}>Age</option>
                  <option value="supply" style={{ background: darkMode ? '#1a1a1a' : '#fff', color: darkMode ? '#fff' : '#000' }}>Supply</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  onClick={() => { setTempCustomColumns([]); setCustomColumns([]); localStorage.removeItem('customTokenColumns'); setCustomSettingsOpen(false); }}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1.5px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, background: 'transparent', color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
                >
                  Reset
                </button>
                <button
                  onClick={() => { setCustomColumns(tempCustomColumns); localStorage.setItem('customTokenColumns', JSON.stringify(tempCustomColumns)); setCustomSettingsOpen(false); }}
                  style={{ flex: 2, padding: '10px', borderRadius: '8px', border: 'none', background: '#2196f3', color: '#fff', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
                >
                  Apply
                </button>
              </div>
            </div>
          ) : (
            <>
              <p style={{ color: darkMode ? '#999' : '#666', fontSize: '14px', margin: '0 0 20px 0' }}>
                Select the columns you want to display in the token list
              </p>
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
                      <div style={{ color: darkMode ? '#fff' : '#000', fontSize: '14px', fontWeight: 400 }}>{column.label}</div>
                      <div style={{ color: darkMode ? '#999' : '#666', fontSize: '12px' }}>{column.description}</div>
                    </div>
                  </ColumnItem>
                ))}
              </ColumnsGrid>
              <ButtonRow>
                <button
                  onClick={() => { setTempCustomColumns([]); setCustomColumns([]); localStorage.removeItem('customTokenColumns'); setCustomSettingsOpen(false); }}
                  style={{ padding: '10px 20px', borderRadius: '8px', border: `1.5px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, background: 'transparent', color: darkMode ? '#fff' : '#000', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
                >
                  Reset
                </button>
                <button
                  onClick={() => { setCustomColumns(tempCustomColumns); localStorage.setItem('customTokenColumns', JSON.stringify(tempCustomColumns)); setCustomSettingsOpen(false); }}
                  style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#2196f3', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
                >
                  Apply
                </button>
                <button
                  onClick={() => { setTempCustomColumns(customColumns); setCustomSettingsOpen(false); }}
                  style={{ padding: '10px 20px', borderRadius: '8px', border: `1.5px solid rgba(239,68,68,0.2)`, background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
                >
                  Cancel
                </button>
              </ButtonRow>
            </>
          )}
        </CustomColumnsPanel>
      ) : isMobile ? (
        <TableWrapper darkMode={darkMode}>
        <MobileContainer isDark={darkMode}>
          <MobileHeader isDark={darkMode}>
            <HeaderCell
              flex={2}
              align="left"
              isDark={darkMode}
              sortable
              onClick={() => handleRequestSort(null, 'name')}
              debugColor="cyan"
            >
              Token
            </HeaderCell>
            <HeaderCell
              flex={1.2}
              align="right"
              isDark={darkMode}
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
                  trades: 'TXS',
                  supply: 'SUPPLY',
                  created: 'AGE',
                  origin: 'SRC',
                  pro5m: '5M',
                  pro1h: '1H',
                  pro24h: '24H',
                  pro7d: '7D',
                  pro30d: '30D'
                };
                return labels[col] || 'DATA';
              })()}
            </HeaderCell>
            <HeaderCell
              flex={0.7}
              align="right"
              isDark={darkMode}
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
                  trades: 'TXS',
                  supply: 'SUPPLY',
                  created: 'AGE',
                  origin: 'SRC',
                  pro5m: '5M',
                  pro1h: '1H',
                  pro24h: '24H',
                  pro7d: '7D',
                  pro30d: '30D'
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
        </TableWrapper>
      ) : (
        <TableWrapper darkMode={darkMode}>
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
            <StyledTableBody isMobile={isMobile} darkMode={darkMode}>
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
        </TableWrapper>
      )}
      <ToolbarContainer isMobile={isMobile}>
        <TokenListToolbar
          rows={rows}
          setRows={updateRows}
          page={page}
          setPage={updatePage}
          tokens={tokens}
        />
      </ToolbarContainer>
    </>
  );
}

// Export with performance profiler
export default function TokenList(props) {
  return (
      <TokenListComponent {...props} />
  );
}
