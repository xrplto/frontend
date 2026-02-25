import api from 'src/utils/api';
import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  useDeferredValue,
  useTransition
} from 'react';
import { cn } from 'src/utils/cn';
import { useContext } from 'react';
import { ThemeContext, WalletContext, AppContext } from 'src/context/AppContext';
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
const LazySearchToolbar = lazy(
  () => import(/* webpackChunkName: "search-toolbar" */ './SearchToolbar')
);

const Container = ({ className, children, ...p }) => (
  <div
    className={cn('flex flex-col w-full p-0 m-0 overflow-visible [contain:layout_style_paint]', className)}
    {...p}
  >
    {children}
  </div>
);

const TableWrapper = ({ className, children, darkMode, ...p }) => (
  <div
    className={cn(
      'rounded-xl overflow-clip border-[1.5px] backdrop-blur-[4px]',
      darkMode ? 'border-white/[0.08] bg-white/[0.02]' : 'border-black/[0.06] bg-black/[0.01]',
      className
    )}
    style={{ minHeight: '680px', contain: 'content', ...p.style }}
    {...(({ style, ...rest }) => rest)(p)}
  >
    {children}
  </div>
);

const TableContainer = React.forwardRef(({ className, children, isMobile, ...p }, ref) => (
  <div
    ref={ref}
    className={cn('flex justify-start gap-0 py-0.5 px-0 overflow-x-auto overflow-y-visible w-full min-w-0 box-border', className)}
    style={{ scrollbarWidth: 'none' }}
    {...p}
  >
    {children}
  </div>
));

const StyledTable = React.forwardRef(({ className, children, isMobile, ...p }, ref) => (
  <table
    ref={ref}
    className={cn('w-full border-collapse m-0 p-0', className)}
    style={{ tableLayout: 'fixed', contain: 'layout style' }}
    {...p}
  >
    {children}
  </table>
));

const StyledTableBody = ({ className, children, isMobile, darkMode, ...p }) => (
  <tbody className={cn('m-0 p-0', className)} {...p}>
    {children}
  </tbody>
);

const ToolbarContainer = ({ className, children, isMobile, ...p }) => (
  <div
    className={cn(
      'mt-1 w-full',
      isMobile ? 'block justify-start' : 'flex justify-center',
      className
    )}
    {...p}
  >
    {children}
  </div>
);

const SearchContainer = ({ className, children, ...p }) => (
  <div className={cn('mb-2 overflow-visible', className)} {...p}>
    {children}
  </div>
);

const CustomColumnsPanel = ({ className, children, darkMode, ...p }) => (
  <div
    className={cn(
      'w-full rounded-xl p-6 my-5 backdrop-blur-[16px] border-[1.5px]',
      darkMode ? 'bg-black/50 border-white/10' : 'bg-white/80 border-black/[0.06]',
      className
    )}
    style={{ ...p.style }}
    {...(({ style, ...rest }) => rest)(p)}
  >
    {children}
  </div>
);

const ColumnsGrid = ({ className, children, ...p }) => (
  <div
    className={cn('grid gap-2.5 my-5 grid-cols-[repeat(auto-fill,minmax(200px,1fr))]', className)}
    {...p}
  >
    {children}
  </div>
);

const ColumnItem = ({ className, children, darkMode, ...p }) => (
  <label
    className={cn(
      'flex items-center gap-2.5 p-3 bg-transparent rounded-lg cursor-pointer border-[1.5px]',
      darkMode ? 'border-white/10' : 'border-black/10',
      className
    )}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = darkMode ? 'rgba(66, 133, 244, 0.04)' : 'rgba(66, 133, 244, 0.02)';
      e.currentTarget.style.borderColor = '#4285f4';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'transparent';
      e.currentTarget.style.borderColor = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    }}
    {...p}
  >
    {children}
  </label>
);

const ButtonRow = ({ className, children, ...p }) => (
  <div className={cn('flex gap-2.5 justify-end mt-5', className)} {...p}>
    {children}
  </div>
);

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
  autoAddNewTokens = false,
  tokenType = ''
}) {
  const { darkMode } = useContext(ThemeContext);
  const { accountProfile } = useContext(WalletContext);
  const {
    openSnackbar,
    setLoading,
    activeFiatCurrency,
    watchList,
    updateWatchList
  } = useContext(AppContext);
  const dispatch = useDispatch();
  const metrics = useSelector(selectMetrics);
  const exchRate =
    metrics[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics.CNY : null) || 1;
  const [isMobile, setIsMobile] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 960);
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
  // When a page explicitly sets initialOrderBy (e.g. /new uses "dateon"),
  // always use it — don't let localStorage override page-specific sort.
  const hasExplicitSort = initialOrderBy && initialOrderBy !== 'vol24hxrp';
  const [orderBy, setOrderBy] = useState(() => {
    if (hasExplicitSort) return initialOrderBy;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tokenListSortBy');
      if (saved) return saved;
    }
    return 'vol24hxrp';
  });
  const [sync, setSync] = useState(() => {
    if (!tokens?.length) return 1;
    // If no explicit sort and saved sort differs from default, force a re-fetch
    if (!hasExplicitSort && typeof window !== 'undefined' && localStorage.getItem('tokenListSortBy') && localStorage.getItem('tokenListSortBy') !== 'vol24hxrp') return 1;
    return 0;
  });

  // Clear SSR tokens immediately if user's saved sort differs from SSR sort
  // (only applies when there's no explicit page-level sort override)
  useEffect(() => {
    if (hasExplicitSort) return;
    const saved = localStorage.getItem('tokenListSortBy');
    if (saved && saved !== (initialOrderBy || 'vol24hxrp') && tokens?.length) {
      setTokens([]);
    }
  }, []);
  const [editToken, setEditToken] = useState(null);
  const [trustToken, setTrustToken] = useState(null);
  const [rows, setRows] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tokenListRows');
      if (saved) return parseInt(saved);
    }
    return 50;
  });

  // Lower default rows on mobile after hydration
  useEffect(() => {
    if (!localStorage.getItem('tokenListRows') && window.innerWidth < 768) {
      setRows(25);
    }
  }, []);
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
        if (mobile && parsed.length >= 3) {
          return [parsed[0], parsed[1], parsed[2]];
        } else if (mobile && parsed.length >= 2) {
          return [parsed[0], parsed[1], 'volume24h'];
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
      // On mobile, ensure we have 3 columns selected
      if (isMobile) {
        // Use existing mobile columns or defaults
        if (customColumns && customColumns.length >= 3) {
          setTempCustomColumns([customColumns[0], customColumns[1], customColumns[2]]);
        } else {
          setTempCustomColumns(['price', 'pro24h', 'volume24h']);
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
      classic: ['price', 'pro24h', 'volume24h'],
      priceChange: ['pro5m', 'pro24h', 'volume24h'],
      marketData: ['marketCap', 'volume24h', 'holders'],
      topGainers: ['price', 'pro5m', 'volume24h'],
      trader: ['pro5m', 'pro1h', 'volume24h']
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

    // Defer initial measurement to avoid forced reflow during hydration
    const id = requestAnimationFrame(updateDimensions);

    // Update dimensions on resize
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (tableRef.current) {
      resizeObserver.observe(tableRef.current);
    }

    return () => {
      cancelAnimationFrame(id);
      resizeObserver.disconnect();
    };
  }, []);

  // Sticky desktop header: direct DOM update via rAF for smooth 60fps tracking
  useEffect(() => {
    if (isMobile) return;
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const thead = tableRef.current?.querySelector('thead');
          if (thead) {
            const { top: tableTop, height: tableHeight } = tableDimensionsRef.current;
            if (tableHeight > 0) {
              const scrollTop = window.scrollY;
              if (scrollTop > tableTop && scrollTop < tableTop + tableHeight - 60) {
                thead.style.top = `${scrollTop - tableTop}px`;
              } else {
                thead.style.top = '0px';
              }
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isMobile]);

  useEffect(() => {
    const tableContainer = tableContainerRef.current;
    const scrollOptions = { passive: true, capture: false };

    if (tableContainer) {
      tableContainer.addEventListener('scroll', handleScrollX, scrollOptions);
    }

    return () => {
      if (tableContainer) {
        tableContainer.removeEventListener('scroll', handleScrollX, scrollOptions);
      }
    };
  }, [handleScrollX]);

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
                slug: existing.slug,
                name: existing.name,
                user: existing.user,
                md5: existing.md5,
                time: Date.now(),
                bearbull: existing.exch > update.exch ? -1 : 1,
                bearbullTime: Date.now()
              });
            }
          } else if (autoAddNewTokens && update.name && update.dateon && update.isOMCF === 'yes') {
            // Add new token if autoAddNewTokens enabled, has required fields, and is OMCF verified
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
    };
  }, [handleScrollX]);

  const debouncedLoadTokens = useMemo(
    () =>
      throttle(() => {
        const start = page * rows;
        const ntag = tag || '';
        const watchAccount = showWatchList ? accountProfile?.account || '' : '';
        const limit = rows;

        api
          .get(
            `${BASE_URL}/tokens?tag=${ntag}&watchlist=${watchAccount}&start=${start}&limit=${limit}&sortBy=${orderBy}&sortType=${order}&filter=${filterName}&showNew=${showNew}&showSlug=${showSlug}&showDate=${showDate}&skipMetrics=true${tokenType ? `&tokenType=${tokenType}` : ''}`
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
      tokenType,
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
    return tokens.slice(0, rows);
  }, [tokens, rows]);

  const deferredTokens = useDeferredValue(visibleTokens);
  const isDeferring = deferredTokens !== visibleTokens;

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
          <Suspense fallback={<div style={{ height: 91 }} />}>
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
              skipSortPersist={hasExplicitSort}
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
        <CustomColumnsPanel
          darkMode={darkMode}
          role="dialog"
          aria-label="Customize table columns"
          style={isMobile ? { padding: '16px', margin: '8px 0', borderRadius: '8px' } : {}}
        >
          <div className="flex items-center justify-between mb-4">
            <h3
              className={cn(
                'm-0 font-medium',
                isMobile ? 'text-[15px]' : 'text-[18px]',
                darkMode ? 'text-white' : 'text-black'
              )}
            >
              {isMobile ? 'Custom Columns' : 'Customize Table Columns'}
            </h3>
            {isMobile && (
              <button
                onClick={() => {
                  setTempCustomColumns(customColumns);
                  setCustomSettingsOpen(false);
                }}
                aria-label="Close custom columns settings"
                className={cn(
                  'bg-transparent border-none text-xl cursor-pointer p-1 outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE] rounded',
                  darkMode ? 'text-white/50' : 'text-black/50'
                )}
              >
                {'\u00D7'}
              </button>
            )}
          </div>

          {isMobile ? (
            <div className="flex flex-col gap-3">
              <div>
                <label
                  htmlFor="column-2-select"
                  className={cn(
                    'block mb-[6px] text-[11px] font-medium uppercase tracking-[0.5px]',
                    darkMode ? 'text-white/40' : 'text-black/40'
                  )}
                >
                  Middle Column
                </label>
                <select
                  id="column-2-select"
                  value={tempCustomColumns[0] || 'price'}
                  onChange={(e) =>
                    setTempCustomColumns([e.target.value, tempCustomColumns[1] || 'pro24h'])
                  }
                  className={cn(
                    'w-full p-3 rounded-lg border-[1.5px] text-[13px] cursor-pointer appearance-none bg-no-repeat bg-[position:right_12px_center] outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
                    darkMode ? 'border-[#f59e0b] bg-[#1a1a1a] text-white' : 'border-black/10 bg-white text-black'
                  )}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${darkMode ? '%23fff' : '%23000'}' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`
                  }}
                >
                  <option value="price" className={cn(darkMode ? 'bg-[#1a1a1a] text-white' : 'bg-white text-black')}>Price</option>
                  <option value="volume24h" className={cn(darkMode ? 'bg-[#1a1a1a] text-white' : 'bg-white text-black')}>Volume 24h</option>
                  <option value="volume7d" className={cn(darkMode ? 'bg-[#1a1a1a] text-white' : 'bg-white text-black')}>Volume 7d</option>
                  <option value="marketCap" className={cn(darkMode ? 'bg-[#1a1a1a] text-white' : 'bg-white text-black')}>Market Cap</option>
                  <option value="tvl" className={cn(darkMode ? 'bg-[#1a1a1a] text-white' : 'bg-white text-black')}>TVL</option>
                  <option value="holders" className={cn(darkMode ? 'bg-[#1a1a1a] text-white' : 'bg-white text-black')}>Holders</option>
                  <option value="trades" className={cn(darkMode ? 'bg-[#1a1a1a] text-white' : 'bg-white text-black')}>Trades</option>
                  <option value="created" className={cn(darkMode ? 'bg-[#1a1a1a] text-white' : 'bg-white text-black')}>Age</option>
                  <option value="supply" className={cn(darkMode ? 'bg-[#1a1a1a] text-white' : 'bg-white text-black')}>Supply</option>
                  <option value="pro5m" className={cn(darkMode ? 'bg-[#1a1a1a] text-white' : 'bg-white text-black')}>5m %</option>
                  <option value="pro1h" className={cn(darkMode ? 'bg-[#1a1a1a] text-white' : 'bg-white text-black')}>1h %</option>
                  <option value="pro24h" className={cn(darkMode ? 'bg-[#1a1a1a] text-white' : 'bg-white text-black')}>24h %</option>
                  <option value="pro7d" className={cn(darkMode ? 'bg-[#1a1a1a] text-white' : 'bg-white text-black')}>7d %</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="column-3-select"
                  className={cn(
                    'block mb-[6px] text-[11px] font-medium uppercase tracking-[0.5px]',
                    darkMode ? 'text-white/40' : 'text-black/40'
                  )}
                >
                  Right Column
                </label>
                <select
                  id="column-3-select"
                  value={tempCustomColumns[1] || 'pro24h'}
                  onChange={(e) =>
                    setTempCustomColumns([tempCustomColumns[0] || 'price', e.target.value])
                  }
                  className={cn(
                    'w-full p-3 rounded-lg border-[1.5px] text-[13px] cursor-pointer appearance-none bg-no-repeat bg-[position:right_12px_center] outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
                    darkMode ? 'border-[#f59e0b] bg-[#1a1a1a] text-white' : 'border-black/10 bg-white text-black'
                  )}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${darkMode ? '%23fff' : '%23000'}' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`
                  }}
                >
                  <option value="pro5m" className={cn(darkMode ? 'bg-[#1a1a1a] text-white' : 'bg-white text-black')}>5m %</option>
                  <option value="pro1h" className={cn(darkMode ? 'bg-[#1a1a1a] text-white' : 'bg-white text-black')}>1h %</option>
                  <option value="pro24h" className={cn(darkMode ? 'bg-[#1a1a1a] text-white' : 'bg-white text-black')}>24h %</option>
                  <option value="pro7d" className={cn(darkMode ? 'bg-[#1a1a1a] text-white' : 'bg-white text-black')}>7d %</option>
                  <option value="price" className={cn(darkMode ? 'bg-[#1a1a1a] text-white' : 'bg-white text-black')}>Price</option>
                  <option value="volume24h" className={cn(darkMode ? 'bg-[#1a1a1a] text-white' : 'bg-white text-black')}>Volume 24h</option>
                  <option value="volume7d" className={cn(darkMode ? 'bg-[#1a1a1a] text-white' : 'bg-white text-black')}>Volume 7d</option>
                  <option value="marketCap" className={cn(darkMode ? 'bg-[#1a1a1a] text-white' : 'bg-white text-black')}>Market Cap</option>
                  <option value="tvl" className={cn(darkMode ? 'bg-[#1a1a1a] text-white' : 'bg-white text-black')}>TVL</option>
                  <option value="holders" className={cn(darkMode ? 'bg-[#1a1a1a] text-white' : 'bg-white text-black')}>Holders</option>
                  <option value="trades" className={cn(darkMode ? 'bg-[#1a1a1a] text-white' : 'bg-white text-black')}>Trades</option>
                  <option value="created" className={cn(darkMode ? 'bg-[#1a1a1a] text-white' : 'bg-white text-black')}>Age</option>
                  <option value="supply" className={cn(darkMode ? 'bg-[#1a1a1a] text-white' : 'bg-white text-black')}>Supply</option>
                </select>
              </div>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => {
                    setTempCustomColumns([]);
                    setCustomColumns([]);
                    localStorage.removeItem('customTokenColumns');
                    setCustomSettingsOpen(false);
                  }}
                  className={cn(
                    'flex-1 p-[10px] rounded-lg border-[1.5px] bg-transparent text-xs font-medium cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
                    darkMode ? 'border-white/10 text-white/70' : 'border-black/10 text-black/70'
                  )}
                >
                  Reset
                </button>
                <button
                  onClick={() => {
                    setCustomColumns(tempCustomColumns);
                    localStorage.setItem('customTokenColumns', JSON.stringify(tempCustomColumns));
                    setCustomSettingsOpen(false);
                  }}
                  className="flex-[2] p-[10px] rounded-lg border-none bg-[#2196f3] text-white text-xs font-medium cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]"
                >
                  Apply
                </button>
              </div>
            </div>
          ) : (
            <>
              <p
                className={cn(
                  'text-sm mb-5 mt-0 mx-0',
                  darkMode ? 'text-[#999]' : 'text-[#666]'
                )}
              >
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
                      className="w-4 h-4 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE] rounded"
                    />
                    <div className="flex-1">
                      <div
                        className={cn('text-sm font-normal', darkMode ? 'text-white' : 'text-black')}
                      >
                        {column.label}
                      </div>
                      <div className={cn('text-xs', darkMode ? 'text-[#999]' : 'text-[#666]')}>
                        {column.description}
                      </div>
                    </div>
                  </ColumnItem>
                ))}
              </ColumnsGrid>
              <ButtonRow>
                <button
                  onClick={() => {
                    setTempCustomColumns([]);
                    setCustomColumns([]);
                    localStorage.removeItem('customTokenColumns');
                    setCustomSettingsOpen(false);
                  }}
                  className={cn(
                    'py-[10px] px-5 rounded-lg border-[1.5px] bg-transparent cursor-pointer text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
                    darkMode ? 'border-white/10 text-white' : 'border-black/10 text-black'
                  )}
                >
                  Reset
                </button>
                <button
                  onClick={() => {
                    setCustomColumns(tempCustomColumns);
                    localStorage.setItem('customTokenColumns', JSON.stringify(tempCustomColumns));
                    setCustomSettingsOpen(false);
                  }}
                  className="py-[10px] px-5 rounded-lg border-none bg-[#2196f3] text-white cursor-pointer text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]"
                >
                  Apply
                </button>
                <button
                  onClick={() => {
                    setTempCustomColumns(customColumns);
                    setCustomSettingsOpen(false);
                  }}
                  className="py-[10px] px-5 rounded-lg border-[1.5px] border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.1)] text-[#ef4444] cursor-pointer text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]"
                >
                  Cancel
                </button>
              </ButtonRow>
            </>
          )}
        </CustomColumnsPanel>
      ) : isMobile ? (
        <TableWrapper darkMode={darkMode}>
          <MobileContainer>
            <MobileHeader isDark={darkMode} role="row">
              <HeaderCell
                flex={2}
                align="left"
                isDark={darkMode}
                sortable
                onClick={() => handleRequestSort(null, 'name')}
              >
                Token
              </HeaderCell>
              <HeaderCell
                flex={1}
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
                flex={0.8}
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
              <HeaderCell
                flex={0.8}
                align="right"
                isDark={darkMode}
                sortable
                onClick={() => {
                  const col = customColumns && customColumns[2] ? customColumns[2] : 'volume24h';
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
                  const col = customColumns && customColumns[2] ? customColumns[2] : 'volume24h';
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
                  return labels[col] || 'VOL';
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
                isLoggedIn={hasMounted && !!accountProfile?.account}
                viewMode={viewMode}
                rows={rows}
                customColumns={customColumns}
                noImageCache={autoAddNewTokens}
              />
            ))}
          </MobileContainer>
        </TableWrapper>
      ) : (
        <TableWrapper darkMode={darkMode}>
          <TableContainer ref={tableContainerRef} isMobile={isMobile} className="table-container-hide-scrollbar">
            <StyledTable ref={tableRef} isMobile={isMobile}>
              {viewMode === 'classic' && (
                <colgroup>
                  {hasMounted && !!accountProfile?.account && <col style={{ width: '2%' }} />}
                  <col style={{ width: '2.5%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '7%' }} />
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '5%' }} />
                  <col style={{ width: '5%' }} />
                  <col style={{ width: '5%' }} />
                  <col style={{ width: '5%' }} />
                  <col style={{ width: '7%' }} />
                  <col style={{ width: '6%' }} />
                  <col style={{ width: '5.5%' }} />
                  <col style={{ width: '7%' }} />
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '5.5%' }} />
                  <col style={{ width: '6%' }} />
                </colgroup>
              )}
              <TokenListHead
                order={order}
                orderBy={orderBy}
                onRequestSort={handleRequestSort}
                scrollLeft={scrollLeft}
                tokens={tokens}
                darkMode={darkMode}
                isMobile={isMobile}
                isLoggedIn={hasMounted && !!accountProfile?.account}
                viewMode={viewMode}
                customColumns={customColumns}
              />
              <StyledTableBody isMobile={isMobile} darkMode={darkMode} className="token-tbody">
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
                    isLoggedIn={hasMounted && !!accountProfile?.account}
                    viewMode={viewMode}
                    customColumns={customColumns}
                    rows={rows}
                    noImageCache={autoAddNewTokens}
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
  return <TokenListComponent {...props} />;
}
