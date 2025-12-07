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
import dynamic from 'next/dynamic';
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
  Layers,
  CheckCircle,
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

// Native debounce implementation
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

// Lazy load heavy components
const InfiniteScroll = dynamic(() => import('react-infinite-scroll-component'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center py-4">
      <Loader2 className="animate-spin text-primary" size={30} />
    </div>
  )
});

// Inline Tab Components
const TabContextProvider = createContext();

const TabContext = ({ value, children }) => {
  return <TabContextProvider.Provider value={value}>{children}</TabContextProvider.Provider>;
};

const TabPanel = ({ value, children, className }) => {
  const currentValue = useContext(TabContextProvider);
  if (currentValue !== value) return null;
  return <div className={className || ''}>{children}</div>;
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

// AttributeFilter Component
function AttributeFilter({ attrs, setFilterAttrs }) {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [attrFilter, setAttrFilter] = useState([]);

  useEffect(() => {
    setAttrFilter(attrs.map(attr => ({ trait_type: attr.title, value: [] })));
  }, [attrs]);

  const handleAttrChange = (title, key) => {
    const tempAttrs = [...attrFilter];
    const found = tempAttrs.find((elem) => elem.trait_type === title);
    if (found) {
      found.value = found.value.includes(key) ? found.value.filter(v => v !== key) : [...found.value, key];
      setAttrFilter(tempAttrs);
      setFilterAttrs(tempAttrs);
    }
  };

  const totalSelected = attrFilter.reduce((sum, attr) => sum + attr.value.length, 0);

  return (
    <div>
      {totalSelected > 0 && (
        <div className="mb-2">
          <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium', 'bg-primary/10 text-primary')}>
            <CheckCircle size={10} />{totalSelected} selected
          </span>
        </div>
      )}

      <div className="space-y-1">
        {attrs.map((attr, idx) => {
          const title = attr.title;
          const items = attr.items;
          const count = Object.keys(items).length;
          const selectedCount = attrFilter.find((elem) => elem.trait_type === title)?.value?.length || 0;
          const maxValue = Math.max(...Object.values(items).map((item) => item.count || item));

          return (
            <details key={title} className={cn('group rounded-lg border-[1.5px] overflow-hidden', isDark ? 'border-white/[0.08]' : 'border-gray-200')} open={idx === 0}>
              <summary className={cn('flex items-center justify-between px-2.5 py-2 cursor-pointer list-none', isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50')}>
                <div className="flex items-center gap-2">
                  <Layers size={12} className="text-blue-500" />
                  <span className={cn('text-[11px] font-medium', isDark ? 'text-white' : 'text-gray-900')}>{title}</span>
                  {selectedCount > 0 && <span className="text-[9px] text-primary">({selectedCount})</span>}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={cn('px-1 py-0.5 rounded text-[9px]', isDark ? 'bg-white/5 text-white/50' : 'bg-gray-100 text-gray-500')}>{count}</span>
                  <ChevronDown size={12} className="text-primary transition-transform group-open:rotate-180" />
                </div>
              </summary>
              <div className={cn('px-2 pb-2 pt-1 border-t space-y-0.5', isDark ? 'border-white/5' : 'border-gray-100')}>
                {Object.keys(items).map((key) => {
                  const data = items[key];
                  const itemCount = data.count || data;
                  const isChecked = attrFilter.find((elem) => elem.trait_type === title)?.value?.includes(key);
                  const percentage = (itemCount / maxValue) * 100;

                  return (
                    <div key={title + key} onClick={() => handleAttrChange(title, key)}
                      className={cn('px-2 py-1.5 rounded-md cursor-pointer transition-all flex items-center gap-2',
                        isChecked ? 'bg-primary/10' : isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50')}>
                      <input type="checkbox" checked={isChecked || false} onChange={() => {}} className="w-3 h-3 rounded border-gray-300 text-primary" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={cn('text-[10px] truncate', isDark ? 'text-white' : 'text-gray-900')}>{key}</span>
                          <span className={cn('text-[9px] ml-1', isDark ? 'text-white/40' : 'text-gray-500')}>{fIntNumber(itemCount)}</span>
                        </div>
                        <div className={cn('h-0.5 rounded-full mt-0.5', isDark ? 'bg-white/10' : 'bg-gray-200')}>
                          <div className="h-full rounded-full bg-primary/50" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </details>
          );
        })}
      </div>
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

// NFT Card Component - Matches watchlist card style
const NFTCard = React.memo(({ nft, collection, onRemove, likedNfts, onToggleLike }) => {
  const { themeName, accountProfile } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const isAdmin = accountProfile?.admin;
  const [loadingImg, setLoadingImg] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [liking, setLiking] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const { cost, costb, meta, NFTokenID, rarity_rank, amount, MasterSequence } = nft;
  const imgUrl = getNftCoverUrl(nft, 'large');
  const name = nft.meta?.name || meta?.Name || 'No Name';
  const isVideo = nft?.meta?.video;
  const isLiked = likedNfts?.includes(NFTokenID);

  let videoUrl = null;
  if (isVideo) {
    const videoFiles = getNftFilesUrls(nft, 'video');
    videoUrl = videoFiles?.[0]?.cachedUrl || null;
  }

  // Format prices
  const listPrice = cost?.amount && cost.currency === 'XRP' ? cost.amount : null;
  const bestOffer = costb?.amount && costb.currency === 'XRP' ? costb.amount : null;

  const handleImageLoad = () => setLoadingImg(false);
  const handleImageError = () => { setLoadingImg(false); setImageError(true); };

  const handleRemoveNft = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAdmin) return;
    if (!confirm(`Are you sure you want to remove "${name}"?`)) return;
    onRemove(NFTokenID);
  };

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (liking) return;
    setLiking(true);
    await onToggleLike(NFTokenID);
    setLiking(false);
  };

  return (
    <Link href={`/nft/${NFTokenID}`} className="block group">
      <div
        className="rounded-xl overflow-hidden transition-all"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative aspect-square overflow-hidden rounded-xl">
          {loadingImg && !imageError && (
            <div className={cn('absolute inset-0 animate-pulse', isDark ? 'bg-white/10' : 'bg-gray-200')} />
          )}
          {!imageError ? (
            isVideo && videoUrl && isHovered ? (
              <video src={videoUrl} poster={imgUrl} muted autoPlay loop playsInline preload="none" onLoadedData={handleImageLoad} onError={handleImageError}
                className={cn('w-full h-full object-cover transition-transform group-hover:scale-105', loadingImg && 'opacity-0')} />
            ) : (
              <img src={imgUrl} alt={name} loading="lazy" onLoad={handleImageLoad} onError={handleImageError}
                className={cn('w-full h-full object-cover transition-transform group-hover:scale-105', loadingImg && 'opacity-0')} />
            )
          ) : (
            <div className={cn('w-full h-full flex items-center justify-center', isDark ? 'bg-white/10' : 'bg-gray-200')}>
              <span className={cn('text-[11px]', isDark ? 'text-white/30' : 'text-gray-400')}>No image</span>
            </div>
          )}

          {/* Rarity badge - top left */}
          {rarity_rank > 0 && (
            <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-black/60 text-white backdrop-blur-sm">
              #{fIntNumber(rarity_rank)}
            </div>
          )}

          {/* Price badges - bottom left */}
          {(listPrice || bestOffer) && (
            <div className="absolute bottom-2 left-2 flex flex-col gap-1">
              {listPrice && (
                <div className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-primary/90 text-white backdrop-blur-sm">
                  {fNumber(listPrice)} XRP
                </div>
              )}
              {bestOffer && (
                <div className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-black/70 text-green-400 backdrop-blur-sm">
                  Offer: {fNumber(bestOffer)}
                </div>
              )}
            </div>
          )}

          {/* Like button - top right */}
          <button onClick={handleLike} disabled={liking} className={cn(
            'absolute top-2 right-2 p-1.5 rounded-md transition-all backdrop-blur-sm',
            isLiked ? 'opacity-100 bg-black/60' : 'opacity-0 group-hover:opacity-100 bg-black/40 hover:bg-black/60'
          )}>
            {liking ? (
              <Loader2 size={14} className="animate-spin text-white" />
            ) : (
              <Heart size={14} className={cn(isLiked ? 'fill-red-500 text-red-500' : 'text-white')} />
            )}
          </button>

          {/* Admin remove button */}
          {isAdmin && (
            <button onClick={handleRemoveNft} className={cn(
              'absolute bottom-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all',
              'bg-black/60 hover:bg-red-500 text-white backdrop-blur-sm'
            )}>
              <X size={14} />
            </button>
          )}
        </div>
        <div className="px-1 pt-2 pb-1">
          <p className={cn('text-[12px] font-medium truncate', isDark ? 'text-white/90' : 'text-gray-800')}>
            {name}
          </p>
        </div>
      </div>
    </Link>
  );
});

// NFT Grid Component
const NFTGrid = React.memo(({ collection }) => {
  const BASE_URL = 'https://api.xrpl.to/api';
  const router = useRouter();
  const { themeName, accountProfile, openSnackbar, setOpenWalletModal } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const dropdownRef = useRef(null);

  const slug = collection?.collection?.slug || collection?.slug;

  const [nfts, setNfts] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [sortBy, setSortBy] = useState('price-low');
  const [filterAttrs, setFilterAttrs] = useState([]);
  const [likedNfts, setLikedNfts] = useState([]);
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

  // Fetch traits for filtering
  useEffect(() => {
    if (!slug) return;
    axios.get(`${BASE_URL}/nft/collections/${slug}/traits`)
      .then(res => {
        if (res.data?.traits) {
          const formatted = res.data.traits.map(t => ({
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

  // Sync filters to URL (debounced)
  useEffect(() => {
    if (!router.isReady || !slug) return;

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
      router.replace({ pathname: `/collection/${slug}`, query }, undefined, { shallow: true });
    }
  }, [sortBy, listed, filterAttrs, slug, router.isReady]);

  // Fetch liked NFTs
  useEffect(() => {
    const account = accountProfile?.account;
    if (!account) { setLikedNfts([]); return; }
    axios.get(`${BASE_URL}/watchlist/nft?account=${account}`)
      .then(res => {
        if (res.data?.result === 'success') {
          const ids = Object.values(res.data.watchlist || {}).flatMap(col => (col.items || []).map(item => item.nftokenId));
          setLikedNfts(ids);
        }
      })
      .catch(() => {});
  }, [accountProfile]);

  const handleToggleLike = useCallback(async (nftokenId) => {
    const account = accountProfile?.account;
    if (!account) { setOpenWalletModal(true); return; }

    // Use functional update to avoid stale closure
    setLikedNfts(prev => {
      const isLiked = prev.includes(nftokenId);
      const action = isLiked ? 'remove' : 'add';

      // Fire API call async (don't await to keep UI responsive)
      axios.post(`${BASE_URL}/watchlist/nft`, { account, nftokenId, action })
        .then(res => {
          if (res.data?.result === 'success') {
            openSnackbar?.(action === 'add' ? 'Added to watchlist' : 'Removed from watchlist', 'success');
          }
        })
        .catch(() => openSnackbar?.('Failed to update', 'error'));

      // Optimistic update
      return isLiked ? prev.filter(id => id !== nftokenId) : [...prev, nftokenId];
    });
  }, [accountProfile?.account, openSnackbar, setOpenWalletModal]);

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

    const params = new URLSearchParams({ page: page.toString(), limit: '100', sortBy });
    if (listed) params.append('listed', listed);
    const activeTraits = filterAttrs.filter(a => a.value?.length > 0);
    if (activeTraits.length > 0) {
      params.append('traits', activeTraits.flatMap(a => a.value.map(v => `${a.trait_type}:${v}`)).join(','));
    }

    axios.get(`${BASE_URL}/nft/collections/${slug}/nfts?${params}`)
      .then(res => {
        const newNfts = res.data.nfts || [];
        const pagination = res.data.pagination;
        setHasMore(pagination ? (page + 1) < pagination.totalPages : newNfts.length === 100);
        setTotalCount(pagination?.total || 0);
        setNfts(prev => page === 0 ? newNfts : [...prev, ...newNfts]);

        // Prefetch images for smoother experience
        newNfts.slice(0, 20).forEach(nft => {
          const img = new window.Image();
          img.src = getNftCoverUrl(nft, 'large');
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
                'absolute top-full right-0 mt-1 min-w-[160px] rounded-lg border-[1.5px] p-1 z-50',
                isDark ? 'bg-black/95 border-white/[0.08]' : 'bg-white border-gray-200 shadow-lg'
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
                'absolute top-full right-0 mt-1 min-w-[140px] rounded-lg border-[1.5px] p-1 z-50',
                isDark ? 'bg-black/95 border-white/[0.08]' : 'bg-white border-gray-200 shadow-lg'
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
            <AttributeFilter attrs={traits} setFilterAttrs={setFilterAttrs} />
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

      {/* NFT Grid */}
      <InfiniteScroll
        dataLength={nfts.length}
        next={() => !loading && setPage((prev) => prev + 1)}
        hasMore={hasMore}
        scrollThreshold="200px"
        style={{ overflow: 'visible' }}
        loader={<div className="flex justify-center py-4"><Loader2 className="animate-spin text-primary" size={20} /></div>}
        endMessage={
          nfts.length > 0 && (
            <div className="text-center py-6">
              <p className={cn('text-[11px]', isDark ? 'text-white/30' : 'text-gray-400')}>End of collection</p>
            </div>
          )
        }
      >
        <div className={cn('grid gap-3', GRID_OPTIONS.find(o => o.value === gridCols)?.cols || 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7')}>
          {loading && nfts.length === 0
            ? Array.from({ length: gridCols * 3 }).map((_, i) => <NFTSkeleton key={`skeleton-${i}`} isDark={isDark} />)
            : nfts.map((nft) => (
                <NFTCard key={nft.NFTokenID} nft={nft} collection={collection} onRemove={handleRemove} likedNfts={likedNfts} onToggleLike={handleToggleLike} />
              ))
          }
        </div>
      </InfiniteScroll>
    </div>
  );
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
  const name = collection.name || 'No Name';
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

  const [openShare, setOpenShare] = useState(false);
  const [openInfo, setOpenInfo] = useState(false);
  const [value, setValue] = useState('tab-nfts');
  const [debugInfo, setDebugInfo] = useState(null);
  const infoDropdownRef = useRef(null);

  const BASE_URL = 'https://api.xrpl.to/api';

  // Debug info loader
  useEffect(() => {
    const loadDebugInfo = async () => {
      if (!accountProfile) { setDebugInfo(null); return; }
      const walletKeyId = accountProfile.walletKeyId ||
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
    name,
    slug,
    items,
    description,
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
    floor1dPercent
  } = collection?.collection || collection || {};

  // Royalty fee: API may return as transferFee (basis points 0-50000) or royaltyFee (percentage)
  const royaltyPercent = royaltyFee ?? (transferFee ? (transferFee / 1000).toFixed(2) : null);

  const shareUrl = `https://xrpl.to/collection/${slug}`;
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
      {/* Collection Header - OpenSea Style */}
      <div
        className="rounded-[10px] px-4 py-3 mb-4"
        style={{ border: `1px solid ${isDark ? 'rgba(59,130,246,0.1)' : 'rgba(0,0,0,0.08)'}` }}
      >
        {/* Top Row: Logo + Name + Actions */}
        <div className="flex items-center gap-3 mb-3">
          <Image src={`https://s1.xrpl.to/nft-collection/${logoImage}`} alt={name} width={40} height={40} className="rounded-lg" />
          <div className="flex items-center gap-2">
            <span className={cn("text-base font-semibold", isDark ? "text-white" : "text-gray-900")}>{name}</span>
            {(verified === true || verified === 'yes') && <span className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold uppercase rounded bg-green-500/20 text-green-500">✓ Verified</span>}
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
          </div>
          <div className="flex items-center gap-2 ml-auto">
            {/* Info */}
            <div className="relative" ref={infoDropdownRef}>
              <button onClick={() => setOpenInfo(!openInfo)} className={cn("px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors", isDark ? "bg-white/5 text-white/70 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>Info</button>
              {openInfo && (
                <div className={cn('absolute top-full right-0 mt-2 p-3 rounded-lg border z-50 w-[280px]', isDark ? 'bg-black/95 border-white/10' : 'bg-white border-gray-200 shadow-lg')}>
                  {description && <p className={cn("text-[11px] mb-2", isDark ? "text-white/70" : "text-gray-600")}>{description}</p>}
                  <div className="space-y-1 text-[10px]">
                    {royaltyPercent !== null && <div className="flex justify-between"><span className={isDark ? "text-white/40" : "text-gray-500"}>Royalty</span><span className="text-primary font-medium">{royaltyPercent}%</span></div>}
                    {category && <div className="flex justify-between"><span className={isDark ? "text-white/40" : "text-gray-500"}>Category</span><span>{category}</span></div>}
                    {taxon !== undefined && <div className="flex justify-between"><span className={isDark ? "text-white/40" : "text-gray-500"}>Taxon</span><span className="font-mono">{taxon}</span></div>}
                    <div className="flex justify-between"><span className={isDark ? "text-white/40" : "text-gray-500"}>Issuer</span><span className="font-mono truncate max-w-[140px]">{account}</span></div>
                    <div className="flex justify-between"><span className={isDark ? "text-white/40" : "text-gray-500"}>Created</span><span>{formatMonthYear(created)}</span></div>
                  </div>
                </div>
              )}
            </div>
            {/* Share */}
            <div className="relative" ref={shareDropdownRef}>
              <button onClick={() => setOpenShare(!openShare)} className={cn("px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors", isDark ? "bg-white/5 text-white/70 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>Share</button>
              {openShare && (
                <div className={cn('absolute top-full right-0 mt-2 p-2 rounded-lg border z-50 flex gap-2', isDark ? 'bg-black/95 border-white/10' : 'bg-white border-gray-200 shadow-lg')}>
                  <FacebookShareButton url={shareUrl} quote={shareTitle}><FacebookIcon size={24} round /></FacebookShareButton>
                  <TwitterShareButton title={`Check out ${shareTitle} on XRPNFT`} url={shareUrl}><TwitterIcon size={24} round /></TwitterShareButton>
                </div>
              )}
            </div>
            {accountLogin === collection.account && (
              <Link href={`/collection/${slug}/edit`} className={cn("px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors", isDark ? "bg-white/5 text-white/70 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>Edit</Link>
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

      {/* NFTs and Activity Tabs */}
      <div
        className="rounded-[10px] overflow-hidden"
        style={{ border: `1px solid ${isDark ? 'rgba(59,130,246,0.1)' : 'rgba(0,0,0,0.08)'}` }}
      >
        <TabContext value={value}>
          <div className="flex justify-between items-center px-2.5 pt-2 pb-1">
            <div
              className="inline-flex overflow-hidden rounded-[10px]"
              style={{ border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}
            >
              {[
                { id: 'tab-nfts', label: 'NFTs', icon: <Package size={14} /> },
                { id: 'tab-creator-transactions', label: 'Activity', icon: <Activity size={14} /> }
              ].map((tab, idx, arr) => (
                <button
                  key={tab.id}
                  onClick={() => setValue(tab.id)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-[13px] font-medium uppercase tracking-wide transition-all"
                  style={{
                    background: value === tab.id ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)') : 'transparent',
                    color: value === tab.id ? '#3b82f6' : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'),
                    borderRight: idx < arr.length - 1 ? `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` : 'none',
                    letterSpacing: '0.02em'
                  }}
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
            <NFTGrid collection={collection} />
          </TabPanel>
          <TabPanel value="tab-creator-transactions" className="px-2.5 pb-2.5">
            <AccountTransactions collectionSlug={slug} />
          </TabPanel>
        </TabContext>
      </div>
    </div>
  );
}
