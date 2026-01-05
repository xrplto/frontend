import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
  useRef,
  createContext
} from 'react';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import PropTypes from 'prop-types';

// Lucide Icons
import {
  Search,
  Filter,
  X,
  Send,
  BarChart3,
  Share2,
  Pencil,
  BadgeCheck,
  TrendingUp,
  Wallet,
  Package,
  Users,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Bookmark,
  Settings2,
  Target,
  MoreVertical,
  Info,
  Loader2,
  Heart,
  Activity,
  Grid2X2,
  Grid3X3,
  LayoutGrid
} from 'lucide-react';

// Utils & Context
import { cn } from 'src/utils/cn';
import { AppContext } from 'src/AppContext';
import AccountTransactions from 'src/components/CollectionActivity';
import { fNumber, fIntNumber, fVolume, formatMonthYear, isEqual } from 'src/utils/formatters';
import { getNftCoverUrl, getNftFilesUrls, normalizeCurrencyCode } from 'src/utils/parseUtils';
import { FacebookShareButton, TwitterShareButton, FacebookIcon, TwitterIcon } from '../components/ShareButtons';
import TokenTabs from 'src/TokenDetail/components/TokenTabs';
import { addTokenToTabs } from 'src/hooks/useTokenTabs';

// Native debounce implementation
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};


// Inline Tab Components
const TabContextProvider = createContext();

const TabContext = ({ value, children }) => {
  return <TabContextProvider.Provider value={value}>{children}</TabContextProvider.Provider>;
};

const TabPanel = ({ value, children, className }) => {
  const currentValue = useContext(TabContextProvider);
  if (currentValue !== value) return null;
  return <div className={cn('w-full', className)}>{children}</div>;
};

// Constants
const getMinterName = (account) => {
  const minterMap = {
    'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH': 'XLS-20d',
    'rNH4g2bh86BQBKrW8bEiN8xLwKvF9YB4U1': 'OnXRP',
    'rUL2FGRkkPqR5yjPH8C7X8zE6djZcX9X6t': 'XRPunks'
  };
  return minterMap[account] || null;
};

// Static options (defined outside component to prevent recreation)
const SORT_OPTIONS = [
  { value: 'activity', label: 'Latest Activity' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'offer-high', label: 'Offer: High to Low' },
  { value: 'offer-low', label: 'Offer: Low to High' },
  { value: 'rarity-rare', label: 'Rarest First' },
  { value: 'rarity-common', label: 'Common First' },
  { value: 'volume-high', label: 'Most Traded' },
  { value: 'volume-low', label: 'Least Traded' },
  { value: 'recent-sale', label: 'Recently Sold' },
  { value: 'recent-listed', label: 'Recently Listed' },
  { value: 'minted-latest', label: 'Recently Minted' },
  { value: 'minted-earliest', label: 'First Minted' }
];

const LISTING_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'true', label: 'Listed Only' },
  { value: 'false', label: 'Unlisted Only' },
  { value: 'xrp', label: 'Listed for XRP' },
  { value: 'non-xrp', label: 'Listed for Tokens' }
];

const GRID_OPTIONS = [
  { value: 10, label: 'Large', cols: 'grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10' },
  { value: 12, label: 'Medium', cols: 'grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 xl:grid-cols-12' },
  { value: 18, label: 'Small', cols: 'grid-cols-4 sm:grid-cols-6 md:grid-cols-9 lg:grid-cols-12 xl:[grid-template-columns:repeat(18,minmax(0,1fr))]' }
];

// Alpha utility for colors
const alpha = (color, opacity) => {
  if (!color) return `rgba(0,0,0,${opacity})`;
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
};

// Label Component
function Label({ color = 'default', variant = 'ghost', children, className = '' }) {
  const colorStyles = {
    default: variant === 'ghost' ? 'bg-gray-500/10 text-gray-500' : 'border-gray-500/20 text-gray-500',
    primary: variant === 'ghost' ? 'bg-primary/10 text-primary' : 'border-primary/20 text-primary',
    success: variant === 'ghost' ? 'bg-green-500/10 text-green-500' : 'border-green-500/20 text-green-500',
    warning: variant === 'ghost' ? 'bg-yellow-500/10 text-yellow-500' : 'border-yellow-500/20 text-yellow-500',
    error: variant === 'ghost' ? 'bg-red-500/10 text-red-500' : 'border-red-500/20 text-red-500',
    info: variant === 'ghost' ? 'bg-blue-500/10 text-blue-500' : 'border-blue-500/20 text-blue-500'
  };

  return (
    <span className={cn(
      'inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap',
      variant === 'outlined' && 'border bg-transparent',
      colorStyles[color] || colorStyles.default,
      className
    )}>
      {children}
    </span>
  );
}

Label.propTypes = {
  children: PropTypes.node,
  color: PropTypes.oneOf(['default', 'primary', 'secondary', 'info', 'success', 'warning', 'error']),
  variant: PropTypes.oneOf(['filled', 'outlined', 'ghost'])
};

// AttributeFilter Component - Compact horizontal layout
function AttributeFilter({ attrs, setFilterAttrs, activeFilters = [] }) {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [attrFilter, setAttrFilter] = useState([]);
  const [expandedTrait, setExpandedTrait] = useState(null);

  // Initialize and sync with activeFilters
  useEffect(() => {
    const initial = attrs.map(attr => {
      const existing = activeFilters.find(f => f.trait_type === attr.title);
      return { trait_type: attr.title, value: existing?.value || [] };
    });
    setAttrFilter(initial);

    // Auto-expand first trait that has selections
    const firstWithSelection = initial.find(f => f.value?.length > 0);
    if (firstWithSelection) {
      setExpandedTrait(firstWithSelection.trait_type);
    }
  }, [attrs, activeFilters]);

  const handleAttrChange = (title, key) => {
    const tempAttrs = [...attrFilter];
    const found = tempAttrs.find((elem) => elem.trait_type === title);
    if (found) {
      found.value = found.value.includes(key) ? found.value.filter(v => v !== key) : [...found.value, key];
      setAttrFilter(tempAttrs);
      setFilterAttrs(tempAttrs);
    }
  };

  const toggleTrait = (title) => {
    setExpandedTrait(expandedTrait === title ? null : title);
  };

  return (
    <div className="space-y-2">
      {/* Trait pills row */}
      <div className="flex flex-wrap gap-1.5">
        {attrs.map((attr) => {
          const title = attr.title;
          const selectedCount = attrFilter.find((elem) => elem.trait_type === title)?.value?.length || 0;
          const isExpanded = expandedTrait === title;

          return (
            <button
              key={title}
              onClick={() => toggleTrait(title)}
              className={cn(
                'inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium transition-all',
                isExpanded
                  ? 'bg-primary text-white'
                  : selectedCount > 0
                    ? 'bg-primary/15 text-primary border border-primary/30'
                    : isDark
                      ? 'bg-white/5 text-white/70 hover:bg-white/10'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {title}
              {selectedCount > 0 && (
                <span className={cn(
                  'w-4 h-4 rounded-full text-[9px] flex items-center justify-center',
                  isExpanded ? 'bg-white/20' : 'bg-primary text-white'
                )}>
                  {selectedCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Expanded trait values */}
      {expandedTrait && (
        <div className={cn(
          'p-2 rounded-lg border-[1.5px]',
          isDark ? 'border-white/[0.08] bg-white/[0.02]' : 'border-gray-200 bg-gray-50'
        )}>
          <div className="flex flex-wrap gap-1">
            {(() => {
              const attr = attrs.find(a => a.title === expandedTrait);
              if (!attr) return null;
              const items = attr.items;
              const sortedKeys = Object.keys(items).sort((a, b) => (items[b].count || items[b]) - (items[a].count || items[a]));

              return sortedKeys.map((key) => {
                const data = items[key];
                const itemCount = data.count || data;
                const isChecked = attrFilter.find((elem) => elem.trait_type === expandedTrait)?.value?.includes(key);

                return (
                  <button
                    key={key}
                    onClick={() => handleAttrChange(expandedTrait, key)}
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] transition-all',
                      isChecked
                        ? 'bg-primary text-white'
                        : isDark
                          ? 'bg-white/5 text-white/70 hover:bg-white/10'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    )}
                  >
                    {key}
                    <span className={cn('text-[9px]', isChecked ? 'text-white/70' : isDark ? 'text-white/40' : 'text-gray-400')}>
                      {fIntNumber(itemCount)}
                    </span>
                  </button>
                );
              });
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

// NFT Skeleton Component for loading state
const NFTSkeleton = React.memo(({ isDark }) => (
  <div className={cn('rounded-lg overflow-hidden', isDark ? 'bg-white/[0.03]' : 'bg-gray-50')}>
    <div className={cn('aspect-square animate-pulse', isDark ? 'bg-white/5' : 'bg-gray-200')} />
    <div className="px-2 py-1.5 space-y-1.5">
      <div className={cn('h-3 rounded animate-pulse', isDark ? 'bg-white/5' : 'bg-gray-200')} style={{ width: '70%' }} />
      <div className={cn('h-2.5 rounded animate-pulse', isDark ? 'bg-white/5' : 'bg-gray-200')} style={{ width: '40%' }} />
    </div>
  </div>
));

// Ultra-light NFT Card - hover effects + listed badge
const NFTCard = React.memo(({ nft, isDark, priority }) => {
  const { cost, meta, NFTokenID, rarity_rank, is_burned } = nft;
  const imgUrl = getNftCoverUrl(nft, 'large');
  const name = meta?.name || meta?.Name || 'No Name';
  const listPrice = cost?.amount && cost.currency === 'XRP' ? cost.amount : null;

  return (
    <a href={`/nft/${NFTokenID}`} className="block group" style={{ contain: 'layout style paint' }}>
      <div className={cn(
        "rounded-xl overflow-hidden border-[1.5px] transition-all duration-200",
        isDark
          ? "border-white/[0.06] group-hover:border-primary/40 group-hover:shadow-[0_0_20px_rgba(66,133,244,0.15)]"
          : "border-gray-200 group-hover:border-primary/40 group-hover:shadow-[0_4px_20px_rgba(66,133,244,0.12)]"
      )}>
        <div
          className="relative aspect-square overflow-hidden"
          style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6' }}
        >
          {imgUrl ? (
            <Image
              src={imgUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 10vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              loading={priority ? 'eager' : 'lazy'}
              priority={priority}
              unoptimized
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-[11px]" style={{ color: isDark ? 'rgba(255,255,255,0.3)' : '#9ca3af' }}>No image</span>
          )}

          {/* Top badges row */}
          <div className="absolute top-2 left-2 right-2 flex justify-between items-start z-10">
            {rarity_rank > 0 ? (
              <div className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-black/70 backdrop-blur-sm text-white">
                #{rarity_rank}
              </div>
            ) : <div />}

            {/* Listed or Burned badge */}
            {is_burned ? (
              <div className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold backdrop-blur-sm bg-red-500/90 text-white">
                Burned
              </div>
            ) : listPrice ? (
              <div className={cn(
                "px-1.5 py-0.5 rounded-md text-[10px] font-semibold backdrop-blur-sm",
                "bg-emerald-500/90 text-white"
              )}>
                Listed
              </div>
            ) : null}
          </div>

          {/* Price overlay on hover */}
          {listPrice && (
            <div className={cn(
              "absolute bottom-0 left-0 right-0 p-2 transition-opacity duration-200",
              "bg-gradient-to-t from-black/80 via-black/40 to-transparent",
              "opacity-0 group-hover:opacity-100"
            )}>
              <span className="text-[13px] font-semibold text-white drop-shadow-sm">
                {fNumber(listPrice)} XRP
              </span>
            </div>
          )}
        </div>

        {/* Card footer */}
        <div className={cn(
          "px-2 py-2",
          isDark ? "bg-white/[0.02]" : "bg-gray-50/50"
        )}>
          <p className={cn(
            "text-[11px] font-medium truncate",
            isDark ? "text-white/80" : "text-gray-700"
          )}>{name}</p>
          {listPrice ? (
            <span className="text-[11px] font-semibold text-primary">{fNumber(listPrice)} XRP</span>
          ) : (
            <span className={cn("text-[10px]", isDark ? "text-white/30" : "text-gray-400")}>Not listed</span>
          )}
        </div>
      </div>
    </a>
  );
}, (prev, next) => prev.nft.NFTokenID === next.nft.NFTokenID && prev.priority === next.priority);

// Virtualized Grid - only renders visible items
const VirtualGrid = React.memo(({ nfts, loading, hasMore, onLoadMore, gridCols, isDark }) => {
  const containerRef = useRef(null);
  const sentinelRef = useRef(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 60 });
  const ITEM_HEIGHT = 180; // Approximate card height
  const BUFFER = 24; // Extra items to render above/below

  // Load more when sentinel is visible
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !loading) onLoadMore(); },
      { rootMargin: '200px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  // Update visible range on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const scrollTop = window.scrollY - (containerRef.current.offsetTop || 0);
      const viewportHeight = window.innerHeight;
      const rowHeight = ITEM_HEIGHT;
      const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - BUFFER / gridCols);
      const endRow = Math.ceil((scrollTop + viewportHeight) / rowHeight) + BUFFER / gridCols;
      const start = Math.max(0, startRow * gridCols);
      const end = Math.min(nfts.length, endRow * gridCols);
      setVisibleRange(prev => (prev.start === start && prev.end === end) ? prev : { start, end });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [nfts.length, gridCols]);

  const gridClass = GRID_OPTIONS.find(o => o.value === gridCols)?.cols || 'grid-cols-6';
  const totalRows = Math.ceil(nfts.length / gridCols);
  const totalHeight = totalRows * ITEM_HEIGHT;

  if (loading && nfts.length === 0) {
    return (
      <div className={cn('grid gap-3', gridClass)}>
        {Array.from({ length: gridCols * 3 }).map((_, i) => <NFTSkeleton key={i} isDark={isDark} />)}
      </div>
    );
  }

  const visibleNfts = nfts.slice(visibleRange.start, visibleRange.end);
  const topPadding = Math.floor(visibleRange.start / gridCols) * ITEM_HEIGHT;

  return (
    <div ref={containerRef} style={{ minHeight: totalHeight, position: 'relative' }}>
      <div style={{ paddingTop: topPadding }}>
        <div className={cn('grid gap-3', gridClass)}>
          {visibleNfts.map((nft, i) => (
            <NFTCard key={nft.NFTokenID} nft={nft} isDark={isDark} priority={visibleRange.start + i < 12} />
          ))}
        </div>
      </div>
      {hasMore && <div ref={sentinelRef} className="h-10" />}
      {loading && <div className="flex justify-center py-4"><Loader2 className="animate-spin text-primary" size={20} /></div>}
      {!hasMore && nfts.length > 0 && (
        <p className={cn('text-center py-6 text-[11px]', isDark ? 'text-white/30' : 'text-gray-400')}>End of collection</p>
      )}
    </div>
  );
});

// NFT Grid Component
const NFTGrid = React.memo(({ collection, isDark }) => {
  const BASE_URL = 'https://api.xrpl.to/api';
  const router = useRouter();
  const dropdownRef = useRef(null);

  const slug = collection?.collection?.slug || collection?.slug;

  const [nfts, setNfts] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [sortBy, setSortBy] = useState('price-low');
  const [filterAttrs, setFilterAttrs] = useState([]);
  const [traits, setTraits] = useState([]);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [listed, setListed] = useState('');
  const [showListedDropdown, setShowListedDropdown] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [gridCols, setGridCols] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nft_grid_cols');
      return saved ? parseInt(saved, 10) : 12;
    }
    return 12;
  });
  const listedDropdownRef = useRef(null);

  // Persist grid columns preference
  useEffect(() => {
    localStorage.setItem('nft_grid_cols', gridCols.toString());
  }, [gridCols]);

  // Fetch traits for filtering (limit to useful traits with <100 values)
  useEffect(() => {
    if (!slug) return;
    axios.get(`${BASE_URL}/nft/collections/${slug}/traits`)
      .then(res => {
        if (res.data?.traits) {
          // Skip traits with too many values (performance killer)
          const usableTraits = res.data.traits.filter(t => t.values.length <= 100);
          const formatted = usableTraits.slice(0, 10).map(t => ({
            title: t.type,
            items: t.values.reduce((acc, v) => ({ ...acc, [v.value]: { count: v.count } }), {})
          }));
          setTraits(formatted);
        }
      })
      .catch(() => {});
  }, [slug]);

  // Apply URL filters on load
  useEffect(() => {
    if (!router.isReady) return;

    // Apply sortBy from URL
    if (router.query.sortBy && SORT_OPTIONS.some(o => o.value === router.query.sortBy)) {
      setSortBy(router.query.sortBy);
    }

    // Apply listed from URL
    if (router.query.listed && LISTING_OPTIONS.some(o => o.value === router.query.listed)) {
      setListed(router.query.listed);
    }

    // Apply traits from URL
    if (traits.length > 0 && router.query.traits) {
      const parsed = router.query.traits.split(',').map(t => {
        const [type, value] = t.split(':');
        return { type, value };
      });
      setFilterAttrs(traits.map(t => ({
        trait_type: t.title,
        value: parsed.filter(p => p.type === t.title).map(p => p.value)
      })));
      setShowFilter(true);
    }
  }, [traits, router.isReady, router.query.traits, router.query.sortBy, router.query.listed]);

  // Sync filters to URL (debounced) - wait for traits to load first to avoid clearing URL params
  useEffect(() => {
    if (!router.isReady || !slug || traits.length === 0) return;

    const query = {};
    if (sortBy !== 'price-low') query.sortBy = sortBy;
    if (listed) query.listed = listed;

    const activeTraits = filterAttrs.filter(a => a.value?.length > 0);
    if (activeTraits.length > 0) {
      query.traits = activeTraits.flatMap(a => a.value.map(v => `${a.trait_type}:${v}`)).join(',');
    }

    const currentQuery = { ...router.query };
    delete currentQuery.slug;

    const hasChanged = JSON.stringify(query) !== JSON.stringify(currentQuery);
    if (hasChanged) {
      router.replace({ pathname: `/nfts/${slug}`, query }, undefined, { shallow: true });
    }
  }, [sortBy, listed, filterAttrs, slug, router.isReady, traits.length]);

  const currentSort = SORT_OPTIONS.find(opt => opt.value === sortBy) || SORT_OPTIONS[0];

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowSortDropdown(false);
      if (listedDropdownRef.current && !listedDropdownRef.current.contains(e.target)) setShowListedDropdown(false);
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowSortDropdown(false);
        setShowListedDropdown(false);
        setShowFilter(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Fetch NFTs
  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    const params = new URLSearchParams({ page: page.toString(), limit: '48', sortBy });
    if (listed) params.append('listed', listed);
    const activeTraits = filterAttrs.filter(a => a.value?.length > 0);
    if (activeTraits.length > 0) {
      params.append('traits', activeTraits.flatMap(a => a.value.map(v => `${a.trait_type}:${v}`)).join(','));
    }

    axios.get(`${BASE_URL}/nft/collections/${slug}/nfts?${params}`)
      .then(res => {
        const newNfts = res.data.nfts || [];
        const pagination = res.data.pagination;
        setHasMore(pagination ? (page + 1) < pagination.totalPages : newNfts.length === 48);
        setTotalCount(pagination?.total || 0);
        setNfts(prev => {
          if (page === 0) return newNfts;
          const existingIds = new Set(prev.map(n => n.NFTokenID));
          const unique = newNfts.filter(n => !existingIds.has(n.NFTokenID));
          return [...prev, ...unique];
        });

        // Prefetch first 12 images (skip empty URLs)
        newNfts.slice(0, 12).forEach(nft => {
          const url = getNftCoverUrl(nft, 'large');
          if (url) {
            const img = new window.Image();
            img.src = url;
          }
        });
      })
      .catch(err => console.error('Error fetching NFTs:', err))
      .finally(() => setLoading(false));
  }, [page, slug, sortBy, listed, filterAttrs]);

  // Reset on filter/sort change
  useEffect(() => {
    setNfts([]);
    setPage(0);
    setHasMore(true);
  }, [sortBy, listed, filterAttrs]);

  const handleRemove = useCallback((NFTokenID) => {
    if (!collection) return;
    setLoading(true);
    axios
      .delete(`${BASE_URL}/nfts`, {
        data: {
          issuer: collection.account,
          taxon: collection.taxon,
          cid: collection.uuid,
          idsToDelete: NFTokenID
        }
      })
      .then(() => location.reload())
      .catch((err) => console.error('Error removing NFT:', err))
      .finally(() => setLoading(false));
  }, [collection]);

  return (
    <div className="bg-transparent">
      {/* Filter Header */}
      <div className="mb-4">
        <div className="flex gap-2 items-center justify-end">
          {/* Filter Button */}
          {traits.length > 0 && (
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border-[1.5px] text-[11px] font-medium transition-all',
                showFilter ? 'border-primary bg-primary/10 text-primary' : isDark ? 'border-white/[0.08] text-white/50 hover:border-primary/30' : 'border-gray-200 text-gray-500 hover:border-primary/30'
              )}
            >
              <Filter size={12} />
              {filterAttrs.filter(a => a.value?.length > 0).length > 0 && (
                <span className="w-4 h-4 rounded-full bg-primary text-white text-[9px] flex items-center justify-center">
                  {filterAttrs.reduce((sum, a) => sum + (a.value?.length || 0), 0)}
                </span>
              )}
            </button>
          )}

          {/* Sort Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border-[1.5px] text-[11px] font-medium transition-all',
                isDark ? 'border-white/[0.08] text-white/50 hover:border-primary/30' : 'border-gray-200 text-gray-500 hover:border-primary/30'
              )}
            >
              {currentSort.label}
              <ChevronDown size={12} />
            </button>

            {showSortDropdown && (
              <div className={cn(
                'absolute top-full right-0 mt-1 min-w-[160px] rounded-2xl border p-1 z-50',
                isDark ? 'bg-black/90 backdrop-blur-2xl border-[#3f96fe]/10 shadow-[0_8px_40px_rgba(0,0,0,0.6)]' : 'bg-white/98 backdrop-blur-2xl border-gray-200 shadow-[0_8px_32px_rgba(0,0,0,0.08)]'
              )}>
                {SORT_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => { setSortBy(option.value); setShowSortDropdown(false); }}
                    className={cn(
                      'px-2 py-1.5 rounded-md cursor-pointer text-[11px] transition-all',
                      sortBy === option.value
                        ? 'bg-primary/10 text-primary font-medium'
                        : isDark ? 'text-white/70 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Listed Dropdown */}
          <div className="relative" ref={listedDropdownRef}>
            <button
              onClick={() => setShowListedDropdown(!showListedDropdown)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border-[1.5px] text-[11px] font-medium transition-all',
                listed ? 'border-primary bg-primary/10 text-primary' : isDark ? 'border-white/[0.08] text-white/50 hover:border-primary/30' : 'border-gray-200 text-gray-500 hover:border-primary/30'
              )}
            >
              {LISTING_OPTIONS.find(o => o.value === listed)?.label || 'All'}
              <ChevronDown size={12} />
            </button>

            {showListedDropdown && (
              <div className={cn(
                'absolute top-full right-0 mt-1 min-w-[140px] rounded-2xl border p-1 z-50',
                isDark ? 'bg-black/90 backdrop-blur-2xl border-[#3f96fe]/10 shadow-[0_8px_40px_rgba(0,0,0,0.6)]' : 'bg-white/98 backdrop-blur-2xl border-gray-200 shadow-[0_8px_32px_rgba(0,0,0,0.08)]'
              )}>
                {LISTING_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => { setListed(option.value); setShowListedDropdown(false); }}
                    className={cn(
                      'px-2 py-1.5 rounded-md cursor-pointer text-[11px] transition-all',
                      listed === option.value
                        ? 'bg-primary/10 text-primary font-medium'
                        : isDark ? 'text-white/70 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Grid Size Selector */}
          <div className="flex items-center gap-0.5 ml-1">
            {GRID_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setGridCols(opt.value)}
                className={cn(
                  'w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-medium transition-all',
                  gridCols === opt.value
                    ? 'bg-primary/10 text-primary border border-primary/30'
                    : isDark ? 'text-white/40 hover:bg-white/5 border border-transparent' : 'text-gray-400 hover:bg-gray-100 border border-transparent'
                )}
                title={`${opt.value} per row`}
              >
                {opt.value === 10 && <Grid2X2 size={14} />}
                {opt.value === 12 && <Grid3X3 size={14} />}
                {opt.value === 18 && <LayoutGrid size={14} />}
              </button>
            ))}
          </div>

          {loading && <Loader2 size={14} className="animate-spin text-primary ml-1" />}

          {/* Results Count */}
          {totalCount > 0 && (
            <span className={cn('text-[10px] ml-auto', isDark ? 'text-white/30' : 'text-gray-400')}>
              {nfts.length} of {fIntNumber(totalCount)}
            </span>
          )}
        </div>

        {/* Trait Filter Panel */}
        {showFilter && traits.length > 0 && (
          <div className={cn('mt-3 p-3 rounded-lg border-[1.5px]', isDark ? 'border-white/[0.08] bg-white/[0.02]' : 'border-gray-200 bg-gray-50')}>
            <AttributeFilter attrs={traits} setFilterAttrs={setFilterAttrs} activeFilters={filterAttrs} />
          </div>
        )}

        {/* Quick Filter Pills */}
        {!showFilter && filterAttrs.some(a => a.value?.length > 0) && (
          <div className="flex flex-wrap gap-1 mt-2">
            {filterAttrs.filter(a => a.value?.length > 0).map(attr =>
              attr.value.map(v => (
                <span key={`${attr.trait_type}-${v}`} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-500">
                  {attr.trait_type}: {v}
                  <button onClick={() => {
                    const updated = filterAttrs.map(a =>
                      a.trait_type === attr.trait_type ? { ...a, value: a.value.filter(val => val !== v) } : a
                    );
                    setFilterAttrs(updated);
                  }}><X size={10} /></button>
                </span>
              ))
            )}
            <button onClick={() => { setFilterAttrs(filterAttrs.map(a => ({ ...a, value: [] }))); setSortBy('price-low'); setListed(''); }} className="text-[10px] text-red-500 hover:text-red-400 px-1">
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Virtualized NFT Grid */}
      <VirtualGrid
        nfts={nfts}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={() => !loading && setPage((prev) => prev + 1)}
        gridCols={gridCols}
        isDark={isDark}
      />
    </div>
  );
}, (prev, next) => {
  const prevSlug = prev.collection?.collection?.slug || prev.collection?.slug;
  const nextSlug = next.collection?.collection?.slug || next.collection?.slug;
  return prevSlug === nextSlug && prev.isDark === next.isDark;
});

// Collection Card Component
function CollectionCard({ collectionData, type, account, handleRemove }) {
  const collection = collectionData.collection;
  const { themeName, accountProfile } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const isAdmin = accountProfile?.admin;
  const [loadingImg, setLoadingImg] = useState(true);

  const { NFTokenID } = collection;
  const imgUrl = `https://s1.xrpl.to/nft-collection/${collection.logoImage}`;
  const rawName = collection.name;
  const name = typeof rawName === 'object' && rawName !== null
    ? rawName.collection_name || 'No Name'
    : rawName || 'No Name';
  const collectionType = type.charAt(0).toUpperCase() + type.slice(1);

  const handleRemoveNft = (e) => {
    e.preventDefault();
    if (!isAdmin || !confirm(`Remove "${name}"?`)) return;
    handleRemove(NFTokenID);
  };

  return (
    <Link href={`/account/${account}/collection${collectionType}/${collectionData.collection.id}`} className="block">
      <div className={cn(
        'rounded-lg border-[1.5px] overflow-hidden cursor-pointer transition-all w-full',
        isDark ? 'border-white/[0.08] hover:border-primary/30' : 'border-gray-200 hover:border-primary/30'
      )} style={{ aspectRatio: '1 / 1.3' }}>
        <div className="relative h-[70%]">
          {isAdmin && (
            <button onClick={handleRemoveNft} className={cn(
              'absolute top-1 right-1 z-10 w-5 h-5 rounded flex items-center justify-center',
              isDark ? 'bg-black/60 text-white/70 hover:text-red-500' : 'bg-white/80 text-gray-500 hover:text-red-500'
            )}>
              <X size={12} />
            </button>
          )}
          {loadingImg && <div className={cn('w-full h-full animate-pulse', isDark ? 'bg-white/5' : 'bg-gray-100')} />}
          <img src={imgUrl} alt={collection.uuid} onLoad={() => setLoadingImg(false)} className={cn('w-full h-full object-cover', loadingImg && 'hidden')} />
        </div>
        <div className={cn('p-2 h-[30%] border-t', isDark ? 'border-white/5' : 'border-gray-100')}>
          <h3 className={cn('text-[11px] font-medium truncate', isDark ? 'text-white' : 'text-gray-900')}>{name}</h3>
          <div className="flex items-center justify-between mt-1">
            <span className={cn('text-[9px]', isDark ? 'text-white/40' : 'text-gray-500')}>{collectionData.nftCount} items</span>
            {collectionData.nftsForSale > 0 && (
              <span className={cn('text-[9px]', isDark ? 'text-green-400' : 'text-green-600')}>{collectionData.nftsForSale} listed</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// Wallet tier SVG icons (consistent with TradingHistory)
const TierIconBox = ({ children, isDark }) => (
  <span style={{
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2px 4px',
    borderRadius: '4px',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`,
    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'
  }}>{children}</span>
);

const ShrimpIcon = ({ size = 18, isDark }) => (
  <TierIconBox isDark={isDark}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 823.528 795.746" width={size} height={size * 0.97} style={{ display: 'block' }}>
      <g transform="translate(-808.445 -84.967)" fill="none" stroke="#6b7280" strokeLinecap="round" strokeWidth="30">
        <line x2="247" y2="100" transform="translate(1011.5 104.5)" /><line x1="144" y2="34" transform="translate(867.5 104.5)" /><line y1="88" x2="13" transform="translate(854.5 138.5)" /><line x2="157" y2="125" transform="translate(854.5 226.5)" /><line x2="170" y2="106" transform="translate(829.5 279.5)" /><line y1="75" x2="96" transform="translate(829.5 204.5)" /><line x1="270" y1="19" transform="translate(925.5 204.5)" /><line x1="98" y1="11" transform="translate(1288.5 286.5)" /><line y1="55" x2="204" transform="translate(1084.5 286.5)" /><line x1="43" y2="38" transform="translate(1041.5 341.5)" /><line x1="48" y1="42" transform="translate(1041.5 379.5)" /><line y1="47" x2="236" transform="translate(1089.5 374.5)" /><line x2="72" y2="154" transform="translate(1288.5 292.5)" /><line x2="271" y2="25" transform="translate(1089.5 421.5)" /><line x1="30" y2="146" transform="translate(1360.5 300.5)" /><line x2="153" y2="90" transform="translate(1390.5 300.5)" /><line x1="69" y1="174" transform="translate(1543.5 390.5)" /><line x1="45" y2="164" transform="translate(1567.5 564.5)" /><line y1="76" x2="82" transform="translate(1485.5 728.5)" /><line x1="113" y2="55" transform="translate(1372.5 804.5)" /><line x2="76" y2="75" transform="translate(1296.5 784.5)" /><line x2="110" y2="13" transform="translate(1296.5 784.5)" /><line x1="37" y2="26" transform="translate(1406.5 771.5)" /><line y1="38" x2="35" transform="translate(1443.5 733.5)" /><line x1="24" y2="102" transform="translate(1478.5 631.5)" /><line x1="48" y1="130" transform="translate(1454.5 501.5)" /><line x2="99" y2="62" transform="translate(1355.5 439.5)" /><line y1="49" x2="178" transform="translate(1355.5 390.5)" /><line y1="114" x2="75" transform="translate(1458.5 390.5)" /><line x2="148" y2="60" transform="translate(1458.5 504.5)" /><line y1="65" x2="101" transform="translate(1505.5 564.5)" /><line x2="55" y2="88" transform="translate(1505.5 629.5)" /><line x2="79" y2="2" transform="translate(1481.5 728.5)" /><line x2="43" y2="16" transform="translate(1411.5 800.5)" /><line x1="14" y2="36" transform="translate(1411.5 693.5)" /><line y1="18" x2="27" transform="translate(1425.5 675.5)" /><line y1="3" x2="38" transform="translate(1409.5 616.5)" /><line y1="4" x2="53" transform="translate(1375.5 550.5)" /><line x2="46.5" transform="translate(1331.5 501.5)" /><line x1="27" y2="61" transform="translate(1304.5 501.5)" /><line x1="27" y2="58" transform="translate(1348.5 554.5)" /><line x1="36" y2="54" transform="translate(1373.5 619.5)" /><line x1="47" y2="55" transform="translate(1216.5 473.5)" /><line x2="158" y2="60" transform="translate(1058.5 468.5)" /><line x1="44" y2="71" transform="translate(1014.5 468.5)" />
      </g>
    </svg>
  </TierIconBox>
);

const FishIcon2 = ({ size = 18, isDark }) => (
  <TierIconBox isDark={isDark}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 999.334 735.299" width={size} height={size * 0.74} style={{ display: 'block' }}>
      <g transform="translate(-649.816 -154.867)" fill="none" stroke="#60a5fa" strokeLinecap="round" strokeWidth="38">
        <line x2="189" y2="44" transform="translate(1073.5 227.5)" /><line x1="139" y1="42" transform="translate(1266.5 262.5)" /><line y1="123" x2="161" transform="translate(1405.5 181.5)" /><line x2="384" transform="translate(1182.5 181.5)" /><line x1="109" y2="46" transform="translate(1073.5 181.5)" /><line x1="306" y2="64" transform="translate(1221.5 195.5)" /><line y1="27" x2="190" transform="translate(883.5 227.5)" /><line x2="60" y2="216" transform="translate(883.5 259.5)" /><line x1="119" y2="74" transform="translate(764.5 254.5)" /><line y1="168" x2="89" transform="translate(675.5 328.5)" /><line x2="80" y2="166" transform="translate(675.5 496.5)" /><line x1="123" y1="68" transform="translate(755.5 662.5)" /><line x2="75" y2="93" transform="translate(856.5 722.5)" /><line x1="116" y1="48" transform="translate(931.5 815.5)" /><line x1="92" y1="118" transform="translate(955.5 745.5)" /><line x1="683" y1="71" transform="translate(883.5 733.5)" /><line y1="49" x2="54" transform="translate(1001.5 755.5)" /><line x1="144" y2="192" transform="translate(1105.5 563.5)" /><line x1="132" y2="8" transform="translate(1117.5 563.5)" /><line x2="3" y2="79" transform="translate(1114.5 492.5)" /><line x1="171" y1="13" transform="translate(943.5 479.5)" /><line y1="95" x2="40" transform="translate(898.5 479.5)" /><line x1="81" y2="45" transform="translate(817.5 574.5)" /><line y1="40" x2="28" transform="translate(782.5 622.5)" /><line x1="249" y2="39" transform="translate(689.5 463.5)" /><line x1="152" y2="42" transform="translate(931.5 385.5)" /><line y1="102" x2="149" transform="translate(1091.5 283.5)" /><line x1="178" y1="114" transform="translate(913.5 271.5)" /><line x2="170" y2="172" transform="translate(1079.5 385.5)" /><line y1="43" transform="translate(1117.5 571.5)" /><line x1="84" y2="65" transform="translate(1033.5 614.5)" /><line x2="131" y2="108" transform="translate(902.5 571.5)" /><line x2="179" y2="86" transform="translate(926.5 522.5)" /><line y1="67" x2="119" transform="translate(870.5 655.5)" /><line x2="156" y2="41" transform="translate(1249.5 567.5)" /><line y1="94" x2="123" transform="translate(1266.5 608.5)" /><line x1="111" y2="43" transform="translate(1155.5 702.5)" /><line x1="41" y2="32" transform="translate(1397.5 571.5)" /><line x1="49" y2="91" transform="translate(1389.5 571.5)" /><line x1="177" y1="142" transform="translate(1389.5 662.5)" /><line x1="251" y1="74" transform="translate(1275.5 706.5)" /><line x2="27" y2="123" transform="translate(1405.5 304.5)" /><line x1="193" y2="45" transform="translate(1432.5 382.5)" /><line x1="41" y2="137" transform="translate(1584.5 382.5)" /><line x1="33" y1="89" transform="translate(1584.5 519.5)" /><line x1="175" y1="37" transform="translate(1442.5 571.5)" /><line x2="28" y2="57" transform="translate(1410.5 514.5)" /><line x1="140" y2="43" transform="translate(1270.5 514.5)" /><line y1="87" x2="22" transform="translate(1410.5 427.5)" /><line x2="315" y2="41" transform="translate(1117.5 393.5)" /><line x2="176" y2="148" transform="translate(1257 272)" /><line x1="182" y2="96" transform="translate(1429.5 406.5)" /><line x1="149" y1="17" transform="translate(1429.5 502.5)" />
      </g>
    </svg>
  </TierIconBox>
);

const DolphinIcon = ({ size = 18, isDark }) => (
  <TierIconBox isDark={isDark}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1322.431 487.538" width={size} height={size * 0.37} style={{ display: 'block' }}>
      <g transform="translate(-268.911 -233.804)" fill="none" stroke="#3b82f6" strokeLinecap="round" strokeWidth="34">
        <line x2="806" y2="98.204" transform="translate(652.5 417.296)" /><line x1="122" y2="74.204" transform="translate(530.5 417.296)" /><line y1="24" x2="243" transform="translate(287.5 491.5)" /><line x2="175" y2="49" transform="translate(403.5 504.5)" /><line y1="23" x2="69" transform="translate(437.5 540.5)" /><line x2="247" y2="63" transform="translate(437.5 563.5)" /><line x1="132" y1="8" transform="translate(684.5 626.5)" /><line y1="20" x2="239" transform="translate(816.5 614.5)" /><line x1="339" y2="86" transform="translate(1055.5 528.5)" /><line x1="126" y1="45" transform="translate(1055.5 614.5)" /><line x1="14" y1="29" transform="translate(1167.5 630.5)" /><line x1="48" y2="49" transform="translate(1167.5 581.5)" /><line x2="62" y2="10" transform="translate(1215.5 581.5)" /><line x1="68" y2="45" transform="translate(1277.5 546.5)" /><line y1="48" x2="141" transform="translate(1317.5 515.5)" /><line x1="104" y1="182" transform="translate(1463.5 515.5)" /><line x1="196" y1="151" transform="translate(1371.5 546.5)" /><line x1="104" y2="204" transform="translate(1463.5 311.5)" /><line x1="81" y2="45" transform="translate(1486.5 311.5)" /><line y1="133" x2="119" transform="translate(1367.5 356.5)" /><line y1="81" x2="140" transform="translate(1375.5 408.5)" /><line x1="73" y1="11" transform="translate(1302.5 466.5)" /><line x2="37" y2="26" transform="translate(1265.5 440.5)" /><line x1="50" y2="32" transform="translate(1215.5 440.5)" /><line x2="395" y2="76" transform="translate(840.5 380.5)" /><line x1="51" y1="48" transform="translate(789.5 332.5)" /><line x1="4" y2="75" transform="translate(789.5 257.5)" /><line x1="82" y2="58" transform="translate(711.5 257.5)" /><line y1="93" x2="54" transform="translate(657.5 315.5)" /><line y1="73" x2="117" transform="translate(669.5 335.5)" /><line y1="37" x2="144" transform="translate(716.5 386.5)" /><line x2="71" y2="106" transform="translate(657.5 423.5)" /><line x1="49" y2="9" transform="translate(728.5 520.5)" /><line y1="80" x2="14" transform="translate(777.5 440.5)" /><line x1="180" y1="106" transform="translate(791.5 440.5)" /><line y1="26" x2="378" transform="translate(971.5 520.5)" /><line y1="53" x2="204" transform="translate(956.5 480.5)" /><line x2="143" y2="67" transform="translate(912.5 539.5)" /><line x1="142" y1="19" transform="translate(770.5 520.5)" /><line x1="135" y2="45" transform="translate(777.5 546.5)" /><line x2="77" transform="translate(700.5 591.5)" /><line y1="83" x2="39" transform="translate(684.5 539.5)" />
      </g>
    </svg>
  </TierIconBox>
);

const OrcaIcon = ({ size = 18, isDark }) => (
  <TierIconBox isDark={isDark}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1185.935 605.365" width={size} height={size * 0.51} style={{ display: 'block' }}>
      <g transform="translate(-431.545 -170.466)" fill="none" stroke="#2563eb" strokeLinecap="round" strokeWidth="34">
        <line y1="69" x2="301" transform="translate(498.5 400.5)" /><line x1="43" y2="51" transform="translate(455.5 469.5)" /><line x1="15" y1="39" transform="translate(455.5 520.5)" /><line x2="183" y2="72" transform="translate(470.5 559.5)" /><line x2="20" y2="88" transform="translate(646.5 577.5)" /><line x1="42" y1="41" transform="translate(604.5 536.5)" /><line y1="4" x2="134" transform="translate(470.5 536.5)" /><line x1="126" y2="53" transform="translate(604.5 483.5)" /><line y1="66" x2="22" transform="translate(730.5 417.5)" /><line x2="398" y2="37" transform="translate(739.5 469.5)" /><line x2="51" y2="86" transform="translate(730.5 480.5)" /><line y1="8" x2="125" transform="translate(656.5 566.5)" /><line x1="59" y1="44" transform="translate(781.5 566.5)" /><line x2="11" y2="101" transform="translate(840.5 610.5)" /><line y1="40" x2="35" transform="translate(816.5 711.5)" /><line x1="72" transform="translate(744.5 751.5)" /><line x2="74" y2="77" transform="translate(670.5 674.5)" /><line x1="139" y2="19" transform="translate(799.5 381.5)" /><line y1="95" x2="97" transform="translate(938.5 286.5)" /><line x2="8" y2="92" transform="translate(1027.5 194.5)" /><line x1="60" y2="57" transform="translate(967.5 194.5)" /><line y1="117" x2="40" transform="translate(927.5 251.5)" /><line x2="164" y2="16" transform="translate(914.5 384.5)" /><line x2="43" y2="117" transform="translate(1035.5 283.5)" /><line x1="237" y1="88" transform="translate(1078.5 400.5)" /><line x2="154" y2="87" transform="translate(1315.5 488.5)" /><line x1="59" y1="79" transform="translate(1469.5 575.5)" /><line x2="79" y2="5" transform="translate(1518.5 641.5)" /><line y1="106" x2="21" transform="translate(1576.5 646.5)" /><line x1="113" y1="68" transform="translate(1463.5 684.5)" /><line x1="51" y2="38" transform="translate(1463.5 646.5)" /><line x1="94" y1="7" transform="translate(1489.5 665.5)" /><line x1="365" y1="148" transform="translate(1140.5 506.5)" /><line y1="36" x2="55" transform="translate(1414.5 575.5)" /><line x2="14" y2="69" transform="translate(1406.5 611.5)" /><line x1="49" y1="4" transform="translate(1420.5 680.5)" /><line x2="17" y2="80" transform="translate(1306.5 488.5)" /><line y1="61" x2="59" transform="translate(1264.5 580.5)" /><line x1="62" y1="103" transform="translate(1078.5 400.5)" /><line x1="11" y2="62" transform="translate(1129.5 510.5)" /><line x1="40" y2="105" transform="translate(978.5 506.5)" /><line x1="207" y1="95" transform="translate(811.5 402.5)" /><line x1="119" y2="111" transform="translate(837.5 488.5)" /><line x2="233" y2="98" transform="translate(1131.5 572.5)" /><line x1="56" y1="10" transform="translate(1364.5 670.5)" /><line x1="285" y2="20" transform="translate(1011.5 646.5)" /><line x1="97" y1="24" transform="translate(1267.5 646.5)" /><line x2="160" y2="8" transform="translate(851.5 658.5)" /><line y1="3" x2="120" transform="translate(858.5 611.5)" /><line x1="157" y2="45" transform="translate(978.5 566.5)" />
      </g>
    </svg>
  </TierIconBox>
);

const WhaleIcon = ({ size = 18, isDark }) => (
  <TierIconBox isDark={isDark}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1329.594 627.908" width={size} height={size * 0.47} style={{ display: 'block' }}>
      <g transform="translate(-312.905 -143.901)" fill="none" stroke="#22c55e" strokeLinecap="round" strokeWidth="32">
        <line x2="512" y2="100" transform="translate(570.5 371.5)" /><line x1="230" y2="44" transform="translate(1082.5 427.5)" /><line y1="93" x2="95" transform="translate(1303.5 328.5)" /><line x2="15" y2="67" transform="translate(1383.5 261.5)" /><line x1="86" y1="95" transform="translate(1297.5 166.5)" /><line x1="43" y1="205" transform="translate(1297.5 166.5)" /><line x1="101" y1="18" transform="translate(1398.5 328.5)" /><line x2="19" transform="translate(1499.5 346.5)" /><line x1="103" y1="44" transform="translate(1518.5 346.5)" /><line x1="240" y2="51" transform="translate(1381.5 390.5)" /><line x2="94" y2="5" transform="translate(1297.5 432.5)" /><line y1="74" x2="83" transform="translate(1312.5 441.5)" /><line x1="167" y1="46" transform="translate(1154.5 461.5)" /><line x1="389" y2="204" transform="translate(923.5 515.5)" /><line x1="428" y2="136" transform="translate(884.5 515.5)" /><line x1="17" y1="54" transform="translate(878.5 651.5)" /><line x2="62" y2="44" transform="translate(895.5 705.5)" /><line y1="3" x2="131" transform="translate(826.5 749.5)" /><line x2="128" transform="translate(694.5 745.5)" /><line x2="110" y2="108" transform="translate(712.5 637.5)" /><line x1="104" y1="137" transform="translate(608.5 500.5)" /><line x1="197" y2="61" transform="translate(895.5 628.5)" /><line y1="114" x2="15" transform="translate(1067.5 474.5)" /><line x1="248" y1="3" transform="translate(819.5 585.5)" /><line x1="54" y1="60" transform="translate(819.5 585.5)" /><line x2="207" y2="85" transform="translate(612.5 500.5)" /><line y1="61" x2="283" transform="translate(612.5 439.5)" /><line x1="115" y2="7" transform="translate(497.5 500.5)" /><line x2="163" y2="74" transform="translate(334.5 433.5)" /><line y1="56" x2="107" transform="translate(334.5 377.5)" /><line x1="129" y2="6" transform="translate(441.5 371.5)" /><line x2="21" y2="67" transform="translate(334.5 433.5)" /><line x1="147" y1="165" transform="translate(355.5 500.5)" /><line x2="192" y2="80" transform="translate(502.5 665.5)" /><line x2="192" y2="8" transform="translate(588.5 697.5)" /><line x1="206" y1="235" transform="translate(388.5 462.5)" /><line x1="130" y1="138" transform="translate(491.5 507.5)" /><line x2="102" y2="14" transform="translate(621.5 645.5)" /><line x2="53" y2="6" transform="translate(612.5 574.5)" /><line x1="50" y1="56" transform="translate(562.5 518.5)" /><line x1="43" y1="49" transform="translate(605.5 507.5)" />
      </g>
    </svg>
  </TierIconBox>
);

// Price Chart Component using lightweight-charts
const PriceChart = React.memo(({ slug }) => {
  const BASE_URL = 'https://api.xrpl.to/api';
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const dataMapRef = useRef({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [legend, setLegend] = useState(null);

  useEffect(() => {
    if (!slug || !chartContainerRef.current) return;
    let chart = null;

    const initChart = async () => {
      try {
        setLoading(true);
        setError(null);
        const { createChart, CandlestickSeries, HistogramSeries, AreaSeries } = await import('lightweight-charts');
        const res = await axios.get(`${BASE_URL}/nft/collections/${slug}/ohlc`);
        const rawData = (res.data?.ohlc || []).filter(d => d.o != null && d.h != null && d.l != null && d.c != null);

        // Store data map for legend lookup
        dataMapRef.current = {};
        rawData.forEach(d => { dataMapRef.current[d.t] = d; });

        const ohlcData = rawData.map(d => ({ time: d.t, open: d.o, high: d.h, low: d.l, close: d.c }));
        const volumeData = rawData.map(d => ({
          time: d.t,
          value: d.v || 0,
          color: d.c >= d.o ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'
        }));
        const salesData = rawData.map(d => ({ time: d.t, value: d.s || 0 }));
        const listingsData = rawData.map(d => ({ time: d.t, value: d.lo || 0 }));
        const bidsData = rawData.map(d => ({ time: d.t, value: d.bo || 0 }));

        if (ohlcData.length === 0) {
          setError('No price data available');
          setLoading(false);
          return;
        }

        // Set initial legend to latest data
        if (rawData.length > 0) setLegend(rawData[rawData.length - 1]);

        chart = createChart(chartContainerRef.current, {
          width: chartContainerRef.current.clientWidth,
          height: 350,
          layout: {
            background: { type: 'solid', color: 'transparent' },
            textColor: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'
          },
          grid: {
            vertLines: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
            horzLines: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
          },
          crosshair: { mode: 1 },
          rightPriceScale: { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
          timeScale: { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', timeVisible: true }
        });

        const candleSeries = chart.addSeries(CandlestickSeries, {
          upColor: '#22c55e',
          downColor: '#ef4444',
          borderUpColor: '#22c55e',
          borderDownColor: '#ef4444',
          wickUpColor: '#22c55e',
          wickDownColor: '#ef4444'
        });
        candleSeries.setData(ohlcData);
        candleSeries.priceScale().applyOptions({
          scaleMargins: { top: 0.02, bottom: 0.3 }
        });

        // Volume histogram - subtle background
        const volumeSeries = chart.addSeries(HistogramSeries, {
          priceFormat: { type: 'volume' },
          priceScaleId: 'volume',
          lastValueVisible: false,
          priceLineVisible: false
        });
        volumeSeries.setData(volumeData);
        chart.priceScale('volume').applyOptions({
          scaleMargins: { top: 0.75, bottom: 0.02 },
          visible: false
        });

        // Activity area series - stacked visual
        const areaOpts = (lineColor, topColor, bottomColor) => ({
          priceScaleId: 'activity',
          lineColor,
          topColor,
          bottomColor,
          lineWidth: 1,
          priceFormat: { type: 'volume' },
          lastValueVisible: false,
          priceLineVisible: false,
          crosshairMarkerVisible: false
        });

        chart.addSeries(AreaSeries, areaOpts('#3b82f6', 'rgba(59,130,246,0.4)', 'rgba(59,130,246,0)')).setData(salesData);
        chart.addSeries(AreaSeries, areaOpts('#eab308', 'rgba(234,179,8,0.3)', 'rgba(234,179,8,0)')).setData(listingsData);
        chart.addSeries(AreaSeries, areaOpts('#a855f7', 'rgba(168,85,247,0.3)', 'rgba(168,85,247,0)')).setData(bidsData);

        chart.priceScale('activity').applyOptions({
          scaleMargins: { top: 0.72, bottom: 0.02 },
          visible: false
        });

        // Crosshair move handler for legend
        chart.subscribeCrosshairMove(param => {
          if (param.time) {
            const d = dataMapRef.current[param.time];
            if (d) setLegend(d);
          }
        });

        chart.timeScale().fitContent();
        chartRef.current = chart;

        const handleResize = () => chart?.applyOptions({ width: chartContainerRef.current?.clientWidth || 0 });
        window.addEventListener('resize', handleResize);
        chartRef.current.resizeHandler = handleResize;
      } catch (err) {
        setError('Failed to load chart');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    initChart();
    return () => {
      if (chartRef.current?.resizeHandler) window.removeEventListener('resize', chartRef.current.resizeHandler);
      chartRef.current?.remove();
      chartRef.current = null;
    };
  }, [slug, isDark]);

  return (
    <div className="w-full">
      {legend && (
        <div className={cn("flex flex-wrap gap-x-3 gap-y-1.5 px-3 py-2", isDark ? "text-white/80" : "text-gray-700")}>
          <span className={cn("text-[11px] font-medium", isDark ? "text-white/50" : "text-gray-500")}>{legend.t}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-green-500">▲ High</span>
            <span className="text-[12px] font-medium text-green-500">{legend.h?.toFixed(2)} XRP</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-red-500">▼ Low</span>
            <span className="text-[12px] font-medium text-red-500">{legend.l?.toFixed(2)} XRP</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={cn("text-[10px]", isDark ? "text-white/40" : "text-gray-400")}>Close</span>
            <span className={cn("text-[12px] font-medium", legend.c >= legend.o ? "text-green-500" : "text-red-500")}>{legend.c?.toFixed(2)}</span>
          </div>
          <span className={cn("text-[10px] px-1.5 py-0.5 rounded", isDark ? "bg-white/5" : "bg-gray-100")}>Vol <span className="font-medium">{(legend.v || 0).toFixed(0)} XRP</span></span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500">Sales <span className="font-medium">{legend.s || 0}</span></span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-500">Listings <span className="font-medium">{legend.lo || 0}</span></span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-500">Bids <span className="font-medium">{legend.bo || 0}</span></span>
          {legend.ho > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-500">Holders <span className="font-medium">{legend.ho}</span></span>}
        </div>
      )}
      <div className="relative w-full h-[350px]">
        <div ref={chartContainerRef} className="w-full h-full" />
        {loading && <div className="absolute inset-0 flex justify-center items-center"><Loader2 className="animate-spin text-primary" size={32} /></div>}
        {error && <div className={cn("absolute inset-0 flex justify-center items-center text-sm", isDark ? "text-white/40" : "text-gray-400")}>{error}</div>}
      </div>
    </div>
  );
});

// Holders Tab Component
const HoldersTab = React.memo(({ slug }) => {
  const BASE_URL = 'https://api.xrpl.to/api';
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  const [loading, setLoading] = useState(true);
  const [holdersData, setHoldersData] = useState(null);
  const [distribution, setDistribution] = useState(null);
  const [searchAddress, setSearchAddress] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 20;

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    Promise.all([
      axios.get(`${BASE_URL}/nft/holders/${slug}?page=${page}&limit=${LIMIT}`),
      axios.get(`${BASE_URL}/nft/holders/${slug}/distribution`)
    ])
      .then(([holdersRes, distRes]) => {
        setHoldersData(holdersRes.data);
        setDistribution(distRes.data?.distribution);
        setTotalPages(holdersRes.data?.pagination?.pages || Math.ceil((holdersRes.data?.stats?.totalOwners || 0) / LIMIT));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug, page]);

  // Search for specific address across all collections they hold
  const handleSearch = async () => {
    if (!searchAddress.trim() || !slug) return;
    setSearching(true);
    setSearchResult(null);
    try {
      const res = await axios.get(`${BASE_URL}/nft/holders/address/${searchAddress.trim()}?limit=100`);
      const holdings = res.data.holdings || [];
      // Find if address holds NFTs in current collection
      const match = holdings.find(h => h.slug === slug);
      if (match) {
        setSearchResult({
          address: searchAddress.trim(),
          count: match.count,
          rank: match.rank,
          percentage: match.percentage,
          collectionName: match.name
        });
      } else {
        setSearchResult({
          error: 'Address does not hold NFTs in this collection',
          totalCollections: res.data.totalCollections
        });
      }
    } catch (err) {
      setSearchResult({ error: err.response?.status === 404 ? 'Address not found' : 'Search failed' });
    } finally {
      setSearching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  if (!holdersData) {
    return <div className={cn('text-center py-8 text-[12px]', isDark ? 'text-white/40' : 'text-gray-500')}>No holder data available</div>;
  }

  const { stats, topHolders = [], changes, name: collectionName, account, taxon } = holdersData;
  const tierIcons = {
    whales: WhaleIcon,
    orcas: OrcaIcon,
    dolphins: DolphinIcon,
    fish: FishIcon2,
    shrimp: ShrimpIcon
  };

  // Calculate concentration
  const total = stats?.totalNFTs || 0;
  const top1Pct = total > 0 ? ((topHolders[0]?.count || 0) / total * 100).toFixed(1) : '0';
  const top5Pct = total > 0 ? (topHolders.slice(0, 5).reduce((s, h) => s + h.count, 0) / total * 100).toFixed(1) : '0';
  const top10Pct = total > 0 ? (topHolders.slice(0, 10).reduce((s, h) => s + h.count, 0) / total * 100).toFixed(1) : '0';
  const top20Pct = total > 0 ? (topHolders.slice(0, 20).reduce((s, h) => s + h.count, 0) / total * 100).toFixed(1) : '0';

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className={cn('grid gap-3', changes?.ownersChange !== undefined ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4')}>
        <div className={cn('rounded-lg p-3', isDark ? 'bg-white/[0.03]' : 'bg-gray-50')}>
          <div className={cn('text-[10px] uppercase tracking-wide', isDark ? 'text-white/40' : 'text-gray-500')}>Supply</div>
          <div className={cn('text-[18px] font-medium', isDark ? 'text-white' : 'text-gray-900')}>{fIntNumber(total)}</div>
        </div>
        <div className={cn('rounded-lg p-3', isDark ? 'bg-white/[0.03]' : 'bg-gray-50')}>
          <div className={cn('text-[10px] uppercase tracking-wide', isDark ? 'text-white/40' : 'text-gray-500')}>Owners</div>
          <div className={cn('text-[18px] font-medium', isDark ? 'text-white' : 'text-gray-900')}>{fIntNumber(stats?.totalOwners || 0)}</div>
        </div>
        <div className={cn('rounded-lg p-3', isDark ? 'bg-white/[0.03]' : 'bg-gray-50')}>
          <div className={cn('text-[10px] uppercase tracking-wide', isDark ? 'text-white/40' : 'text-gray-500')}>Unique %</div>
          <div className={cn('text-[18px] font-medium', isDark ? 'text-white' : 'text-gray-900')}>{total > 0 ? ((stats?.totalOwners || 0) / total * 100).toFixed(1) : 0}%</div>
        </div>
        <div className={cn('rounded-lg p-3', isDark ? 'bg-white/[0.03]' : 'bg-gray-50')}>
          <div className={cn('text-[10px] uppercase tracking-wide', isDark ? 'text-white/40' : 'text-gray-500')}>Top 10 Hold</div>
          <div className={cn('text-[18px] font-medium', parseFloat(top10Pct) > 50 ? 'text-orange-500' : isDark ? 'text-white' : 'text-gray-900')}>{top10Pct}%</div>
        </div>
        {changes?.ownersChange !== undefined && (
          <div className={cn('rounded-lg p-3', isDark ? 'bg-white/[0.03]' : 'bg-gray-50')}>
            <div className={cn('text-[10px] uppercase tracking-wide', isDark ? 'text-white/40' : 'text-gray-500')}>Owner Δ</div>
            <div className={cn('text-[18px] font-medium', changes.ownersChange > 0 ? 'text-green-500' : changes.ownersChange < 0 ? 'text-red-500' : isDark ? 'text-white/50' : 'text-gray-500')}>
              {changes.ownersChange > 0 ? '+' : ''}{changes.ownersChange}
            </div>
          </div>
        )}
      </div>

      {/* Ownership Changes */}
      {changes && (changes.gainers?.length > 0 || changes.losers?.length > 0 || changes.newOwners?.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Gainers */}
          {changes.gainers?.length > 0 && (
            <div className={cn('rounded-lg p-3', isDark ? 'bg-green-500/5 border border-green-500/10' : 'bg-green-50 border border-green-100')}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-500 text-[10px] font-medium uppercase tracking-wide">Gainers</span>
                <span className={cn('text-[9px]', isDark ? 'text-white/30' : 'text-gray-400')}>{changes.summary?.gainers || changes.gainers.length}</span>
              </div>
              <div className="space-y-1">
                {changes.gainers.slice(0, 5).map((g, i) => (
                  <Link key={g.address} href={`/address/${g.address}`} className="flex items-center gap-2 group">
                    <span className={cn('flex-1 text-[10px] font-mono truncate', isDark ? 'text-white/60 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900')}>
                      {g.address.slice(0, 6)}...{g.address.slice(-4)}
                    </span>
                    <span className="text-[10px] font-medium text-green-500">{g.change}</span>
                    <span className={cn('text-[9px]', isDark ? 'text-white/30' : 'text-gray-400')}>→{g.now}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {/* Losers */}
          {changes.losers?.length > 0 && (
            <div className={cn('rounded-lg p-3', isDark ? 'bg-red-500/5 border border-red-500/10' : 'bg-red-50 border border-red-100')}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-red-500 text-[10px] font-medium uppercase tracking-wide">Losers</span>
                <span className={cn('text-[9px]', isDark ? 'text-white/30' : 'text-gray-400')}>{changes.summary?.losers || changes.losers.length}</span>
              </div>
              <div className="space-y-1">
                {changes.losers.slice(0, 5).map((l, i) => (
                  <Link key={l.address} href={`/address/${l.address}`} className="flex items-center gap-2 group">
                    <span className={cn('flex-1 text-[10px] font-mono truncate', isDark ? 'text-white/60 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900')}>
                      {l.address.slice(0, 6)}...{l.address.slice(-4)}
                    </span>
                    <span className="text-[10px] font-medium text-red-500">{l.change}</span>
                    <span className={cn('text-[9px]', isDark ? 'text-white/30' : 'text-gray-400')}>→{l.now}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {/* New Owners */}
          {changes.newOwners?.length > 0 && (
            <div className={cn('rounded-lg p-3', isDark ? 'bg-blue-500/5 border border-blue-500/10' : 'bg-blue-50 border border-blue-100')}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-500 text-[10px] font-medium uppercase tracking-wide">New Owners</span>
                <span className={cn('text-[9px]', isDark ? 'text-white/30' : 'text-gray-400')}>{changes.summary?.newOwners || changes.newOwners.length}</span>
              </div>
              <div className="space-y-1">
                {changes.newOwners.slice(0, 5).map((n, i) => (
                  <Link key={n.address} href={`/address/${n.address}`} className="flex items-center gap-2 group">
                    <span className={cn('flex-1 text-[10px] font-mono truncate', isDark ? 'text-white/60 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900')}>
                      {n.address.slice(0, 6)}...{n.address.slice(-4)}
                    </span>
                    <span className="text-[10px] font-medium text-blue-500">+{n.count}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {/* Exited Owners */}
          {changes.exitedOwners?.length > 0 && (
            <div className={cn('rounded-lg p-3', isDark ? 'bg-orange-500/5 border border-orange-500/10' : 'bg-orange-50 border border-orange-100')}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-orange-500 text-[10px] font-medium uppercase tracking-wide">Exited</span>
                <span className={cn('text-[9px]', isDark ? 'text-white/30' : 'text-gray-400')}>{changes.summary?.exitedOwners || changes.exitedOwners.length}</span>
              </div>
              <div className="space-y-1">
                {changes.exitedOwners.slice(0, 5).map((e, i) => (
                  <Link key={e.address} href={`/address/${e.address}`} className="flex items-center gap-2 group">
                    <span className={cn('flex-1 text-[10px] font-mono truncate', isDark ? 'text-white/60 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900')}>
                      {e.address.slice(0, 6)}...{e.address.slice(-4)}
                    </span>
                    <span className="text-[10px] font-medium text-orange-500">had {e.had}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {changes?.since && (
        <div className={cn('text-[9px] text-right', isDark ? 'text-white/20' : 'text-gray-400')}>
          Changes since {new Date(changes.since).toLocaleDateString()}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Distribution */}
        <div className={cn('lg:col-span-4 rounded-lg p-4', isDark ? 'bg-white/[0.02] border border-white/[0.06]' : 'bg-gray-50 border border-gray-100')}>
          {/* Concentration */}
          <h3 className={cn('text-[10px] font-medium uppercase tracking-wide mb-3', isDark ? 'text-white/40' : 'text-gray-500')}>Concentration</h3>
          <div className="space-y-2.5">
            {[
              { label: 'Top 1', pct: top1Pct },
              { label: 'Top 5', pct: top5Pct },
              { label: 'Top 10', pct: top10Pct },
              { label: 'Top 20', pct: top20Pct }
            ].map(row => (
              <div key={row.label} className="flex items-center gap-2">
                <span className={cn('text-[11px] w-11', isDark ? 'text-white/50' : 'text-gray-500')}>{row.label}</span>
                <div className={cn('flex-1 h-1.5 rounded-full overflow-hidden', isDark ? 'bg-white/10' : 'bg-gray-200')}>
                  <div className={cn('h-full rounded-full', parseFloat(row.pct) > 50 ? 'bg-orange-500' : 'bg-primary')} style={{ width: `${Math.min(parseFloat(row.pct), 100)}%` }} />
                </div>
                <span className={cn('text-[11px] w-11 text-right font-medium', isDark ? 'text-white' : 'text-gray-900')}>{row.pct}%</span>
              </div>
            ))}
          </div>

          {/* Tier Distribution */}
          {distribution && (
            <div className={cn('mt-4 pt-4 border-t', isDark ? 'border-white/[0.06]' : 'border-gray-200')}>
              <h4 className={cn('text-[10px] font-medium uppercase tracking-wide mb-3', isDark ? 'text-white/40' : 'text-gray-500')}>NFTs by Holder Size</h4>
              <div className="space-y-2.5">
                {Object.entries(distribution).map(([tier, data]) => {
                  const TierIcon = tierIcons[tier] || tierIcons.fish;
                  const nftPct = data.nftsPct || '0';
                  return (
                    <div key={tier} className="flex items-center gap-2">
                      <TierIcon size={18} isDark={isDark} />
                      <div className="w-20">
                        <span className={cn('text-[10px] capitalize block', isDark ? 'text-white/70' : 'text-gray-700')}>{tier}</span>
                        <span className={cn('text-[9px]', isDark ? 'text-white/30' : 'text-gray-400')}>{data.threshold}</span>
                      </div>
                      <div className={cn('flex-1 h-1.5 rounded-full overflow-hidden', isDark ? 'bg-white/10' : 'bg-gray-200')}>
                        <div className="h-full rounded-full bg-primary/70" style={{ width: `${Math.min(parseFloat(nftPct), 100)}%` }} />
                      </div>
                      <span className={cn('text-[10px] w-11 text-right font-medium', isDark ? 'text-white' : 'text-gray-900')}>{nftPct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Top Holders */}
        <div className="lg:col-span-8 space-y-3">
          {/* Address Search */}
          <div className="flex gap-2">
            <input
              type="text"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search address..."
              className={cn(
                'flex-1 px-3 py-1.5 rounded-lg border-[1.5px] text-[11px] font-mono outline-none',
                isDark
                  ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30 focus:border-primary/50'
                  : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-primary/50'
              )}
            />
            <button
              onClick={handleSearch}
              disabled={searching || !searchAddress.trim()}
              className={cn(
                'px-3 py-1.5 rounded-lg border-[1.5px] text-[11px] font-medium transition-colors',
                searching || !searchAddress.trim()
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-primary/10 hover:border-primary/50',
                isDark ? 'border-white/15 text-white/70' : 'border-gray-300 text-gray-600'
              )}
            >
              {searching ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
            </button>
          </div>

          {/* Search Result */}
          {searchResult && (
            <div className={cn(
              'rounded-lg border-[1.5px] p-3',
              searchResult.error
                ? isDark ? 'bg-red-500/5 border-red-500/20' : 'bg-red-50 border-red-200'
                : isDark ? 'bg-primary/5 border-primary/20' : 'bg-blue-50 border-blue-200'
            )}>
              {searchResult.error ? (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-red-500">{searchResult.error}</span>
                    {searchResult.totalCollections > 0 && (
                      <span className={cn('text-[10px] ml-2', isDark ? 'text-white/30' : 'text-gray-400')}>
                        (holds NFTs in {searchResult.totalCollections} other collection{searchResult.totalCollections > 1 ? 's' : ''})
                      </span>
                    )}
                  </div>
                  <button onClick={() => setSearchResult(null)} className="text-red-500 hover:text-red-400">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Link href={`/address/${searchResult.address}`} className={cn('text-[11px] font-mono hover:text-primary', isDark ? 'text-white/70' : 'text-gray-600')}>
                      <span className="hidden sm:inline">{searchResult.address}</span>
                      <span className="sm:hidden">{searchResult.address?.slice(0, 6)}...{searchResult.address?.slice(-4)}</span>
                    </Link>
                    <span className={cn('text-[11px] font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                      {fIntNumber(searchResult.count)} NFTs
                    </span>
                    <span className={cn('text-[10px]', isDark ? 'text-white/40' : 'text-gray-500')}>
                      Rank #{searchResult.rank} • {searchResult.percentage}%
                    </span>
                  </div>
                  <button onClick={() => setSearchResult(null)} className={cn('hover:text-primary', isDark ? 'text-white/40' : 'text-gray-400')}>
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Holders Table */}
          <div className={cn('overflow-x-auto rounded-xl border-[1.5px]', isDark ? 'border-white/[0.08]' : 'border-gray-200')}>
            <table className="w-full min-w-[500px]">
              <thead className={cn('sticky top-0 z-10', isDark ? 'bg-black/50 backdrop-blur-lg' : 'bg-gray-50/50 backdrop-blur-lg')}>
                <tr>
                  <th className={cn('px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide w-12', isDark ? 'text-gray-400 border-b border-white/5' : 'text-gray-600 border-b border-gray-200')}>Rank</th>
                  <th className={cn('px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide', isDark ? 'text-gray-400 border-b border-white/5' : 'text-gray-600 border-b border-gray-200')}>Address</th>
                  <th className={cn('px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wide', isDark ? 'text-gray-400 border-b border-white/5' : 'text-gray-600 border-b border-gray-200')}>NFTs</th>
                  <th className={cn('px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wide w-20', isDark ? 'text-gray-400 border-b border-white/5' : 'text-gray-600 border-b border-gray-200')}>Share</th>
                </tr>
              </thead>
              <tbody>
                {topHolders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className={cn('px-4 py-8 text-center text-[11px]', isDark ? 'text-white/40' : 'text-gray-500')}>
                      No holders found
                    </td>
                  </tr>
                ) : (
                  topHolders.map((holder, idx) => {
                    const rank = holder.rank || (page - 1) * LIMIT + idx + 1;
                    return (
                    <tr key={holder.address} className={cn('transition-colors', isDark ? 'border-b border-white/5 hover:bg-white/5' : 'border-b border-gray-100 hover:bg-gray-50')}>
                      <td className="px-4 py-2.5">
                        <span className={cn(
                          'w-6 h-6 rounded flex items-center justify-center text-[10px] font-medium',
                          rank === 1 ? 'bg-yellow-500/20 text-yellow-500' :
                          rank === 2 ? 'bg-gray-400/20 text-gray-400' :
                          rank === 3 ? 'bg-amber-600/20 text-amber-600' :
                          isDark ? 'text-white/30' : 'text-gray-400'
                        )}>{rank}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <Link href={`/address/${holder.address}`} className={cn('text-[11px] font-mono hover:text-primary', isDark ? 'text-white/70' : 'text-gray-600')}>
                          <span className="hidden sm:inline">{holder.address}</span>
                          <span className="sm:hidden">{holder.address.slice(0, 6)}...{holder.address.slice(-4)}</span>
                        </Link>
                      </td>
                      <td className={cn('px-4 py-2.5 text-right text-[11px] font-medium tabular-nums', isDark ? 'text-white' : 'text-gray-900')}>{fIntNumber(holder.count)}</td>
                      <td className={cn('px-4 py-2.5 text-right text-[10px] tabular-nums', isDark ? 'text-white/40' : 'text-gray-500')}>{holder.percentage}%</td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 pt-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  page === 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-primary/10",
                  isDark ? "text-white/50" : "text-gray-500"
                )}
              >
                <ChevronLeft size={14} />
              </button>
              <span className={cn("text-[11px] px-2 tabular-nums", isDark ? "text-white/40" : "text-gray-500")}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  page >= totalPages ? "opacity-30 cursor-not-allowed" : "hover:bg-primary/10",
                  isDark ? "text-white/50" : "text-gray-500"
                )}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// Export components for external use
export { AttributeFilter, CollectionCard, NFTCard };

// Main Collection View Component
export default function CollectionView({ collection }) {
  const anchorRef = useRef(null);
  const shareDropdownRef = useRef(null);
  const { themeName, accountProfile, deletingNfts } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const accountLogin = accountProfile?.account;
  const isAdmin = accountProfile?.admin;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 960;

  const [openShare, setOpenShare] = useState(false);
  const [openInfo, setOpenInfo] = useState(false);
  const [value, setValue] = useState('tab-nfts');
  const [debugInfo, setDebugInfo] = useState(null);
  const [showChart, setShowChart] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nft_show_chart');
      return saved !== 'false';
    }
    return true;
  });
  const infoDropdownRef = useRef(null);

  const BASE_URL = 'https://api.xrpl.to/api';

  // Persist chart visibility
  useEffect(() => {
    localStorage.setItem('nft_show_chart', showChart.toString());
  }, [showChart]);

  // Add current collection to tabs on mount
  const collectionData = collection?.collection || collection;

  // DEBUG: Log collection data to find object rendering issues
  useEffect(() => {
    if (collectionData) {
      console.log('[CollectionView] Raw collection data:', {
        name: collectionData.name,
        nameType: typeof collectionData.name,
        description: collectionData.description,
        descType: typeof collectionData.description
      });
    }
  }, [collectionData]);

  useEffect(() => {
    if (collectionData?.slug && collectionData?.name) {
      // Normalize name before passing to addTokenToTabs
      const normalizedName = typeof collectionData.name === 'object' && collectionData.name !== null
        ? collectionData.name.collection_name || ''
        : collectionData.name || '';
      addTokenToTabs({
        slug: collectionData.slug,
        name: normalizedName,
        type: 'collection',
        logoImage: collectionData.logoImage
      });
    }
  }, [collectionData?.slug, collectionData?.name, collectionData?.logoImage]);

  // Debug info loader
  useEffect(() => {
    const loadDebugInfo = async () => {
      if (!accountProfile) { setDebugInfo(null); return; }
      let walletKeyId = accountProfile.walletKeyId ||
        (accountProfile.wallet_type === 'device' ? accountProfile.deviceKeyId : null) ||
        (accountProfile.provider && accountProfile.provider_id ? `${accountProfile.provider}_${accountProfile.provider_id}` : null);
      let seed = accountProfile.seed || null;
      if (!seed && (accountProfile.wallet_type === 'oauth' || accountProfile.wallet_type === 'social')) {
        try {
          const { EncryptedWalletStorage } = await import('src/utils/encryptedWalletStorage');
          const walletStorage = new EncryptedWalletStorage();
          const walletId = `${accountProfile.provider}_${accountProfile.provider_id}`;
          const storedPassword = await walletStorage.getSecureItem(`wallet_pwd_${walletId}`);
          if (storedPassword) {
            const walletData = await walletStorage.getWallet(accountProfile.account, storedPassword);
            seed = walletData?.seed || 'encrypted';
          }
        } catch (e) { seed = 'error: ' + e.message; }
      }
      // Handle device wallets
      if (!seed && accountProfile.wallet_type === 'device') {
        try {
          const { EncryptedWalletStorage, deviceFingerprint } = await import('src/utils/encryptedWalletStorage');
          const walletStorage = new EncryptedWalletStorage();
          const deviceKeyId = await deviceFingerprint.getDeviceId();
          walletKeyId = deviceKeyId;
          if (deviceKeyId) {
            const storedPassword = await walletStorage.getWalletCredential(deviceKeyId);
            if (storedPassword) {
              const walletData = await walletStorage.getWallet(accountProfile.account, storedPassword);
              seed = walletData?.seed || 'encrypted';
            }
          }
        } catch (e) { seed = 'error: ' + e.message; }
      }
      setDebugInfo({ wallet_type: accountProfile.wallet_type, account: accountProfile.account, walletKeyId, seed: seed || 'N/A' });
    };
    loadDebugInfo();
  }, [accountProfile]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (shareDropdownRef.current && !shareDropdownRef.current.contains(e.target)) {
        setOpenShare(false);
      }
      if (infoDropdownRef.current && !infoDropdownRef.current.contains(e.target)) {
        setOpenInfo(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!collection) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const {
    account,
    accountName,
    name: rawName,
    slug,
    items,
    description: rawDescription,
    logoImage,
    verified,
    created,
    volume,
    totalVolume,
    floor,
    floor7dPercent,
    totalVol24h,
    owners,
    listedCount,
    totalSales,
    burnedItems,
    topOffer,
    category,
    transferFee,
    royaltyFee,
    taxon,
    issuer,
    twitter,
    website,
    floor1dPercent,
    linkedToken,
    tokenMatchType
  } = collection?.collection || collection || {};

  // Royalty fee: API may return as transferFee (basis points 0-50000) or royaltyFee (percentage)
  const royaltyPercent = royaltyFee ?? (transferFee ? (transferFee / 1000).toFixed(2) : null);

  // Normalize name/description: API may return object {collection_name, collection_description} or string
  const name = typeof rawName === 'object' && rawName !== null
    ? rawName.collection_name || ''
    : rawName || '';
  const descriptionText = typeof rawDescription === 'object' && rawDescription !== null
    ? rawDescription.collection_description || ''
    : rawDescription || '';

  const shareUrl = `https://xrpl.to/nfts/${slug}`;
  const shareTitle = name;
  const totalVol = totalVolume || volume || 0;

  const marketcapData = collection?.collection?.marketcap || collection?.marketcap;
  const marketcap = typeof marketcapData === 'object' ? marketcapData?.amount : marketcapData || 0;
  const sales24h = collection?.collection?.sales24h || collection?.sales24h || 0;
  const topOfferData = collection?.collection?.topOffer || collection?.topOffer;
  const topOfferAmount = topOfferData?.amount || 0;

  const statsData = [
    { label: 'Floor', value: fNumber(floor?.amount || 0), prefix: '✕', color: 'text-green-500' },
    floor7dPercent !== undefined && floor7dPercent !== 0 && {
      label: '7d',
      value: `${floor7dPercent > 0 ? '+' : ''}${floor7dPercent.toFixed(1)}%`,
      color: floor7dPercent > 0 ? 'text-green-500' : 'text-red-500'
    },
    topOfferAmount > 0 && { label: 'Top Offer', value: fNumber(topOfferAmount), prefix: '✕', color: 'text-emerald-500' },
    marketcap > 0 && { label: 'Mkt Cap', value: fVolume(marketcap), prefix: '✕', color: 'text-yellow-500' },
    totalVol24h > 0 && { label: '24h Vol', value: fVolume(totalVol24h), prefix: '✕', color: 'text-red-500' },
    sales24h > 0 && { label: '24h Sales', value: fIntNumber(sales24h), color: 'text-pink-500' },
    totalVol > 0 && { label: 'Total Vol', value: fVolume(totalVol), prefix: '✕', color: 'text-blue-500' },
    { label: 'Supply', value: fIntNumber(items || 0), color: 'text-orange-500' },
    owners > 0 && { label: 'Owners', value: fIntNumber(owners), color: 'text-purple-500' },
    listedCount > 0 && { label: 'Listed', value: fIntNumber(listedCount), color: 'text-cyan-500' }
  ].filter(Boolean);

  const handleRemoveAll = () => {
    if (deletingNfts.length === 0 || !isAdmin) return;
    const nftNames = deletingNfts?.map((nft) => `"${nft.meta?.name}"` || `"${nft.meta?.Name}"` || `"No Name"`)?.join(', ');
    const idsToDelete = deletingNfts?.map((nft) => nft._id);
    if (!confirm(`You're about to delete the following NFTs ${nftNames}?`)) return;

    axios
      .delete(`${BASE_URL}/nfts`, {
        data: {
          issuer: collection?.account,
          taxon: collection?.taxon,
          cid: collection?.uuid,
          idsToDelete
        }
      })
      .then(() => location.reload())
      .catch((err) => console.error(err));
  };

  const truncate = (str, n) => {
    if (!str) return '';
    return str.length > n ? str.substr(0, n - 1) + ' ...' : str;
  };

  return (
    <div className="w-full relative animate-fadeIn">
      {/* Token/Collection Tabs - Same as TokenDetail */}
      {!isMobile && <TokenTabs currentMd5={collectionData?.slug} />}

      {/* Collection Header - OpenSea Style */}
      <div
        className="rounded-[10px] px-4 py-3 mb-4 mt-3"
        style={{ border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }}
      >
        {/* Top Row: Logo + Name + Actions */}
        <div className="flex items-center gap-3 mb-3">
          <Image src={`https://s1.xrpl.to/nft-collection/${logoImage}`} alt={name} width={40} height={40} className="rounded-lg" />
          <div className="flex items-center gap-2">
            <span className={cn("text-base font-semibold", isDark ? "text-white" : "text-gray-900")}>{name}</span>
            {verified >= 1 && <span className={cn("px-2 py-1 text-[10px] font-semibold uppercase rounded", isDark ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-600")}>Verified</span>}
            {twitter && (
              <a href={`https://x.com/${twitter}`} target="_blank" rel="noopener noreferrer" className={cn("p-1 rounded transition-colors", isDark ? "text-white/40 hover:text-primary" : "text-gray-400 hover:text-primary")}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            )}
            {website && (
              <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noopener noreferrer" className={cn("p-1 rounded transition-colors", isDark ? "text-white/40 hover:text-primary" : "text-gray-400 hover:text-primary")}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              </a>
            )}
            {/* Related Token - Prominent Display */}
            {linkedToken && (
              <Link
                href={`/token/${linkedToken}`}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ml-2",
                  isDark
                    ? "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                    : "bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100"
                )}
              >
                <img
                  src={`https://s1.xrpl.to/token/${linkedToken}`}
                  alt=""
                  className="w-4 h-4 rounded-full"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <span>Related Token</span>
                {tokenMatchType && (
                  <span className={cn("px-1 py-0.5 rounded text-[9px]", isDark ? "bg-white/10 text-white/60" : "bg-blue-100 text-blue-500")}>
                    {tokenMatchType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </span>
                )}
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            {/* Info */}
            <div className="relative" ref={infoDropdownRef}>
              <button onClick={() => setOpenInfo(!openInfo)} className={cn("px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors", isDark ? "bg-white/5 text-white/70 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>Info</button>
              {openInfo && (
                <div className={cn('absolute top-full right-0 mt-2 p-3 rounded-2xl border z-50 w-[280px]', isDark ? 'bg-black/90 backdrop-blur-2xl border-[#3f96fe]/10 shadow-[0_8px_40px_rgba(0,0,0,0.6)]' : 'bg-white/98 backdrop-blur-2xl border-gray-200 shadow-[0_8px_32px_rgba(0,0,0,0.08)]')}>
                  {descriptionText && <p className={cn("text-[11px] mb-2", isDark ? "text-white/70" : "text-gray-600")}>{descriptionText}</p>}
                  <div className="space-y-1 text-[10px]">
                    {royaltyPercent !== null && <div className="flex justify-between"><span className={isDark ? "text-white/40" : "text-gray-500"}>Royalty</span><span className="text-primary font-medium">{royaltyPercent}%</span></div>}
                    {category && <div className="flex justify-between"><span className={isDark ? "text-white/40" : "text-gray-500"}>Category</span><span>{category}</span></div>}
                    {taxon !== undefined && <div className="flex justify-between"><span className={isDark ? "text-white/40" : "text-gray-500"}>Taxon</span><span className="font-mono">{taxon}</span></div>}
                    <div className="flex justify-between"><span className={isDark ? "text-white/40" : "text-gray-500"}>Issuer</span><span className="font-mono truncate max-w-[140px]">{account}</span></div>
                    <div className="flex justify-between"><span className={isDark ? "text-white/40" : "text-gray-500"}>Created</span><span>{formatMonthYear(created)}</span></div>
                    {linkedToken && (
                      <div className="flex justify-between items-center">
                        <span className={isDark ? "text-white/40" : "text-gray-500"}>Token</span>
                        <div className="flex items-center gap-1.5">
                          {tokenMatchType && (
                            <span className={cn("px-1 py-0.5 rounded text-[9px]", isDark ? "bg-white/5 text-white/50" : "bg-gray-100 text-gray-500")}>
                              {tokenMatchType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                            </span>
                          )}
                          <Link href={`/token/${linkedToken}`} className="text-primary hover:underline font-medium" onClick={() => setOpenInfo(false)}>View →</Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Share */}
            <div className="relative" ref={shareDropdownRef}>
              <button onClick={() => setOpenShare(!openShare)} className={cn("px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors", isDark ? "bg-white/5 text-white/70 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>Share</button>
              {openShare && (
                <div className={cn('absolute top-full right-0 mt-2 p-2 rounded-2xl border z-50 flex gap-2', isDark ? 'bg-black/90 backdrop-blur-2xl border-[#3f96fe]/10 shadow-[0_8px_40px_rgba(0,0,0,0.6)]' : 'bg-white/98 backdrop-blur-2xl border-gray-200 shadow-[0_8px_32px_rgba(0,0,0,0.08)]')}>
                  <FacebookShareButton url={shareUrl} quote={shareTitle}><FacebookIcon size={24} round /></FacebookShareButton>
                  <TwitterShareButton title={`Check out ${shareTitle} on XRPNFT`} url={shareUrl}><TwitterIcon size={24} round /></TwitterShareButton>
                </div>
              )}
            </div>
            {accountLogin === collection.account && (
              <Link href={`/nfts/${slug}/edit`} className={cn("px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors", isDark ? "bg-white/5 text-white/70 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>Edit</Link>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-6 overflow-x-auto pb-1 scrollbar-hide">
          {/* Floor Price */}
          <div className="flex-shrink-0">
            <div className={cn("text-[10px] uppercase tracking-wide mb-0.5", isDark ? "text-white/40" : "text-gray-500")}>Floor Price</div>
            <div className="flex items-center gap-1.5">
              <span className={cn("text-[15px] font-medium", isDark ? "text-white" : "text-gray-900")}>{fNumber(floor?.amount || 0)} <span className={isDark ? "text-white/30" : "text-gray-400"}>XRP</span></span>
              {floor1dPercent !== undefined && floor1dPercent !== 0 && (
                <span className={cn("text-[11px]", floor1dPercent >= 0 ? "text-green-500" : "text-red-500")}>
                  {floor1dPercent > 0 ? '+' : ''}{floor1dPercent.toFixed(1)}%
                </span>
              )}
            </div>
          </div>

          {/* Top Offer */}
          {topOfferAmount > 0 && (
            <div className="flex-shrink-0">
              <div className={cn("text-[10px] uppercase tracking-wide mb-0.5", isDark ? "text-white/40" : "text-gray-500")}>Top Offer</div>
              <span className={cn("text-[15px] font-medium", isDark ? "text-white" : "text-gray-900")}>{fNumber(topOfferAmount)} <span className={isDark ? "text-white/30" : "text-gray-400"}>XRP</span></span>
            </div>
          )}

          {/* 24h Vol */}
          <div className="flex-shrink-0">
            <div className={cn("text-[10px] uppercase tracking-wide mb-0.5", isDark ? "text-white/40" : "text-gray-500")}>24h Vol</div>
            <span className={cn("text-[15px] font-medium", isDark ? "text-white" : "text-gray-900")}>{fVolume(totalVol24h)} <span className={isDark ? "text-white/30" : "text-gray-400"}>XRP</span></span>
          </div>

          {/* 24h Sales */}
          {sales24h > 0 && (
            <div className="flex-shrink-0">
              <div className={cn("text-[10px] uppercase tracking-wide mb-0.5", isDark ? "text-white/40" : "text-gray-500")}>24h Sales</div>
              <span className={cn("text-[15px] font-medium", isDark ? "text-white" : "text-gray-900")}>{fIntNumber(sales24h)}</span>
            </div>
          )}

          {/* Total Sales */}
          {totalSales > 0 && (
            <div className="flex-shrink-0">
              <div className={cn("text-[10px] uppercase tracking-wide mb-0.5", isDark ? "text-white/40" : "text-gray-500")}>All Sales</div>
              <span className={cn("text-[15px] font-medium", isDark ? "text-white" : "text-gray-900")}>{fIntNumber(totalSales)}</span>
            </div>
          )}

          {/* All Vol */}
          <div className="flex-shrink-0">
            <div className={cn("text-[10px] uppercase tracking-wide mb-0.5", isDark ? "text-white/40" : "text-gray-500")}>All Vol</div>
            <span className={cn("text-[15px] font-medium", isDark ? "text-white" : "text-gray-900")}>{fVolume(totalVol)} <span className={isDark ? "text-white/30" : "text-gray-400"}>XRP</span></span>
          </div>

          {/* Market Cap */}
          {marketcap > 0 && (
            <div className="flex-shrink-0">
              <div className={cn("text-[10px] uppercase tracking-wide mb-0.5", isDark ? "text-white/40" : "text-gray-500")}>Market Cap</div>
              <span className={cn("text-[15px] font-medium", isDark ? "text-white" : "text-gray-900")}>${fVolume(marketcap)}</span>
            </div>
          )}

          {/* Listed / Supply */}
          <div className="flex-shrink-0">
            <div className={cn("text-[10px] uppercase tracking-wide mb-0.5", isDark ? "text-white/40" : "text-gray-500")}>Listed / Supply</div>
            <span className={cn("text-[15px] font-medium", isDark ? "text-white" : "text-gray-900")}>
              {fIntNumber(listedCount || 0)} / {fIntNumber(items || 0)}
              <span className={cn("text-[11px] ml-1", isDark ? "text-white/40" : "text-gray-400")}>
                {items > 0 ? `${((listedCount || 0) / items * 100).toFixed(1)}%` : '0%'}
              </span>
            </span>
          </div>

          {/* Owners */}
          <div className="flex-shrink-0">
            <div className={cn("text-[10px] uppercase tracking-wide mb-0.5", isDark ? "text-white/40" : "text-gray-500")}>Owners</div>
            <span className={cn("text-[15px] font-medium", isDark ? "text-white" : "text-gray-900")}>
              {fIntNumber(owners || 0)}
              {items > 0 && owners > 0 && (
                <span className={cn("text-[11px] ml-1", isDark ? "text-white/40" : "text-gray-400")}>
                  {((owners / items) * 100).toFixed(1)}%
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Price Chart */}
      <div className="mb-4">
        <button
          onClick={() => setShowChart(!showChart)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium mb-2 transition-colors',
            isDark ? 'bg-white/5 hover:bg-white/10 text-white/70' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
          )}
        >
          <BarChart3 size={14} />
          {showChart ? 'Hide Chart' : 'Show Chart'}
        </button>
        {showChart && (
          <div
            className="rounded-[10px] overflow-hidden"
            style={{ border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }}
          >
            <PriceChart slug={slug} />
          </div>
        )}
      </div>

      {/* NFTs and Activity Tabs */}
      <div
        className="rounded-[10px] overflow-hidden"
        style={{ border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }}
      >
        <TabContext value={value}>
          <div className="flex justify-between items-center px-2.5 pt-2 pb-1">
            <div className="flex items-center gap-2">
              {[
                { id: 'tab-nfts', label: 'NFTS', icon: <Package size={15} /> },
                { id: 'tab-holders', label: 'HOLDERS', icon: <Users size={15} /> },
                { id: 'tab-creator-transactions', label: 'ACTIVITY', icon: <Activity size={15} /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setValue(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 text-[12px] font-medium tracking-wider rounded-md border transition-all",
                    value === tab.id
                      ? isDark ? "border-white/20 text-white" : "border-gray-300 text-gray-900"
                      : isDark ? "border-white/10 text-white/40 hover:text-white/60 hover:border-white/15" : "border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  )}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {isAdmin && value === 'tab-nfts' && (
              <button
                onClick={handleRemoveAll}
                disabled={deletingNfts.length === 0}
                className="px-2 py-1 rounded-[6px] text-[11px] font-normal transition-all"
                style={{
                  border: '1.5px solid rgba(244, 67, 54, 0.3)',
                  background: deletingNfts.length === 0 ? 'transparent' : 'rgba(244, 67, 54, 0.1)',
                  color: '#f44336',
                  opacity: deletingNfts.length === 0 ? 0.4 : 1,
                  cursor: deletingNfts.length === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                Delete All
              </button>
            )}
          </div>

          <TabPanel value="tab-nfts" className="px-2.5 pb-2.5">
            <NFTGrid collection={collection} isDark={isDark} />
          </TabPanel>
          <TabPanel value="tab-holders" className="px-2.5 pb-2.5">
            <HoldersTab slug={slug} />
          </TabPanel>
          <TabPanel value="tab-creator-transactions" className="px-2.5 pb-2.5">
            <AccountTransactions collectionSlug={slug} />
          </TabPanel>
        </TabContext>
      </div>
    </div>
  );
}
