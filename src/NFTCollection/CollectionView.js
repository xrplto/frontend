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
  Heart
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

const TabPanel = ({ value, children, className = '' }) => {
  const currentValue = useContext(TabContextProvider);
  if (currentValue !== value) return null;
  return <div className={className}>{children}</div>;
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
            <details key={title} className={cn('group rounded-lg border-[1.5px] overflow-hidden', isDark ? 'border-white/10' : 'border-gray-200')} open={idx === 0}>
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

// NFT Card Component - Matches watchlist card style
const NFTCard = React.memo(({ nft, collection, onRemove, likedNfts, onToggleLike }) => {
  const { themeName, accountProfile } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const isAdmin = accountProfile?.admin;
  const [loadingImg, setLoadingImg] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [liking, setLiking] = useState(false);

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

  // Format price
  const price = cost?.amount ? (cost.currency === 'XRP' ? cost.amount : null) : (amount || null);

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
      <div className={cn(
        'rounded-lg overflow-hidden transition-all',
        isDark ? 'bg-white/[0.03] hover:bg-white/[0.06]' : 'bg-gray-50 hover:bg-gray-100'
      )}>
        <div className="relative aspect-square overflow-hidden">
          {loadingImg && !imageError && (
            <div className={cn('absolute inset-0 animate-pulse', isDark ? 'bg-white/5' : 'bg-gray-200')} />
          )}
          {!imageError ? (
            isVideo && videoUrl ? (
              <video src={videoUrl} poster={imgUrl} muted autoPlay loop playsInline onLoadedData={handleImageLoad} onError={handleImageError}
                className={cn('w-full h-full object-cover transition-transform group-hover:scale-105', loadingImg && 'opacity-0')} />
            ) : (
              <img src={imgUrl} alt={name} loading="lazy" onLoad={handleImageLoad} onError={handleImageError}
                className={cn('w-full h-full object-cover transition-transform group-hover:scale-105', loadingImg && 'opacity-0')} />
            )
          ) : (
            <div className={cn('w-full h-full flex items-center justify-center', isDark ? 'bg-white/5' : 'bg-gray-200')}>
              <span className={cn('text-[11px]', isDark ? 'text-white/30' : 'text-gray-400')}>No image</span>
            </div>
          )}

          {/* Rarity badge */}
          {rarity_rank > 0 && (
            <div className={cn(
              'absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-medium',
              isDark ? 'bg-black/70 text-white/80' : 'bg-white/90 text-gray-700'
            )}>
              #{fIntNumber(rarity_rank)}
            </div>
          )}

          {/* Like button */}
          <button onClick={handleLike} disabled={liking} className={cn(
            'absolute top-1.5 right-1.5 p-1 rounded-md transition-all',
            isLiked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
            isDark ? 'bg-black/70 hover:bg-black/90' : 'bg-white/90 hover:bg-white'
          )}>
            {liking ? (
              <Loader2 size={12} className="animate-spin text-red-500" />
            ) : (
              <Heart size={12} className={cn(isLiked ? 'fill-red-500 text-red-500' : isDark ? 'text-white/70' : 'text-gray-500')} />
            )}
          </button>

          {/* Admin remove button */}
          {isAdmin && (
            <button onClick={handleRemoveNft} className={cn(
              'absolute bottom-1.5 right-1.5 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all',
              isDark ? 'bg-black/70 hover:bg-red-500' : 'bg-white/90 hover:bg-red-500 hover:text-white',
              'text-white/70 hover:text-white'
            )}>
              <X size={12} />
            </button>
          )}
        </div>
        <div className="px-2 py-1.5">
          <p className={cn('text-[11px] font-normal truncate', isDark ? 'text-white/80' : 'text-gray-700')}>
            {name}
          </p>
          {price && (
            <p className={cn('text-[10px] font-medium', 'text-primary')}>
              {fNumber(price)} XRP
            </p>
          )}
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
  const listedDropdownRef = useRef(null);

  const listingOptions = [
    { value: '', label: 'All' },
    { value: 'true', label: 'Listed Only' },
    { value: 'false', label: 'Unlisted Only' },
    { value: 'xrp', label: 'Listed for XRP' },
    { value: 'non-xrp', label: 'Listed for Tokens' }
  ];

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

  // Apply URL traits filter on load
  useEffect(() => {
    if (traits.length === 0 || !router.isReady || !router.query.traits) return;
    const parsed = router.query.traits.split(',').map(t => {
      const [type, value] = t.split(':');
      return { type, value };
    });
    setFilterAttrs(traits.map(t => ({
      trait_type: t.title,
      value: parsed.filter(p => p.type === t.title).map(p => p.value)
    })));
    setShowFilter(true);
  }, [traits, router.isReady, router.query.traits]);

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
    const action = likedNfts.includes(nftokenId) ? 'remove' : 'add';
    try {
      const res = await axios.post(`${BASE_URL}/watchlist/nft`, { account, nftokenId, action });
      if (res.data?.result === 'success') {
        setLikedNfts(prev => action === 'add' ? [...prev, nftokenId] : prev.filter(id => id !== nftokenId));
        openSnackbar?.(action === 'add' ? 'Added to watchlist' : 'Removed from watchlist', 'success');
      }
    } catch {
      openSnackbar?.('Failed to update', 'error');
    }
  }, [accountProfile, likedNfts, openSnackbar, setOpenWalletModal]);

  const sortOptions = [
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

  const currentSort = sortOptions.find(opt => opt.value === sortBy) || sortOptions[0];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowSortDropdown(false);
      if (listedDropdownRef.current && !listedDropdownRef.current.contains(e.target)) setShowListedDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch NFTs
  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    const params = new URLSearchParams({ page: page.toString(), limit: '24', sortBy });
    if (listed) params.append('listed', listed);
    const activeTraits = filterAttrs.filter(a => a.value?.length > 0);
    if (activeTraits.length > 0) {
      params.append('traits', activeTraits.flatMap(a => a.value.map(v => `${a.trait_type}:${v}`)).join(','));
    }

    axios.get(`${BASE_URL}/nft/collections/${slug}/nfts?${params}`)
      .then(res => {
        const newNfts = res.data.nfts || [];
        const pagination = res.data.pagination;
        setHasMore(pagination ? (page + 1) < pagination.totalPages : newNfts.length === 24);
        setNfts(prev => page === 0 ? newNfts : [...prev, ...newNfts]);
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
                showFilter ? 'border-primary bg-primary/10 text-primary' : isDark ? 'border-white/10 text-white/50 hover:border-primary/30' : 'border-gray-200 text-gray-500 hover:border-primary/30'
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
                isDark ? 'border-white/10 text-white/50 hover:border-primary/30' : 'border-gray-200 text-gray-500 hover:border-primary/30'
              )}
            >
              {currentSort.label}
              <ChevronDown size={12} />
            </button>

            {showSortDropdown && (
              <div className={cn(
                'absolute top-full right-0 mt-1 min-w-[160px] rounded-lg border-[1.5px] p-1 z-50',
                isDark ? 'bg-black/95 border-white/10' : 'bg-white border-gray-200 shadow-lg'
              )}>
                {sortOptions.map((option) => (
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
                listed ? 'border-primary bg-primary/10 text-primary' : isDark ? 'border-white/10 text-white/50 hover:border-primary/30' : 'border-gray-200 text-gray-500 hover:border-primary/30'
              )}
            >
              {listingOptions.find(o => o.value === listed)?.label || 'All'}
              <ChevronDown size={12} />
            </button>

            {showListedDropdown && (
              <div className={cn(
                'absolute top-full right-0 mt-1 min-w-[140px] rounded-lg border-[1.5px] p-1 z-50',
                isDark ? 'bg-black/95 border-white/10' : 'bg-white border-gray-200 shadow-lg'
              )}>
                {listingOptions.map((option) => (
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

          {loading && <Loader2 size={14} className="animate-spin text-primary" />}
        </div>

        {/* Trait Filter Panel */}
        {showFilter && traits.length > 0 && (
          <div className={cn('mt-3 p-3 rounded-lg border-[1.5px]', isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-gray-50')}>
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
        <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {nfts.map((nft) => (
            <NFTCard key={nft.NFTokenID} nft={nft} collection={collection} onRemove={handleRemove} likedNfts={likedNfts} onToggleLike={handleToggleLike} />
          ))}
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
        isDark ? 'border-white/10 hover:border-primary/30' : 'border-gray-200 hover:border-primary/30'
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
  const [value, setValue] = useState('tab-nfts');

  const BASE_URL = 'https://api.xrpl.to/api';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (shareDropdownRef.current && !shareDropdownRef.current.contains(e.target)) {
        setOpenShare(false);
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
    category
  } = collection?.collection || collection || {};

  const shareUrl = `https://xrpl.to/collection/${slug}`;
  const shareTitle = name;
  const totalVol = totalVolume || volume || 0;

  const statsData = [
    { label: 'Floor', value: fNumber(floor?.amount || 0), prefix: '✕', color: 'text-green-500' },
    floor7dPercent !== undefined && floor7dPercent !== 0 && {
      label: '7d',
      value: `${floor7dPercent > 0 ? '+' : ''}${floor7dPercent.toFixed(1)}%`,
      color: floor7dPercent > 0 ? 'text-green-500' : 'text-red-500'
    },
    totalVol24h > 0 && { label: '24h Vol', value: fVolume(totalVol24h), prefix: '✕', color: 'text-red-500' },
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
      {/* Collection Header - TokenSummary style */}
      <div className={cn("rounded-xl border-[1.5px] px-4 py-2.5 mb-4", isDark ? "border-white/10" : "border-gray-200")}>
        {/* Main Row */}
        <div className="flex items-center">
          {/* Left: Logo + Info */}
          <div className="flex items-center gap-3 min-w-[200px] flex-shrink-0">
            <div className="relative">
              <Image
                src={`https://s1.xrpl.to/nft-collection/${logoImage}`}
                alt={name}
                width={36}
                height={36}
                priority
                className="rounded-lg object-cover border border-primary/20"
              />
              {verified === 'yes' && (
                <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-primary rounded-full flex items-center justify-center text-[8px] text-white font-medium">✓</div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={cn("text-sm font-semibold truncate", isDark ? "text-white" : "text-gray-900")}>{name}</span>
                {category && (
                  <span className={cn("px-1 rounded text-[9px] font-medium", isDark ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600")}>
                    {category}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={cn("text-[10px] truncate", isDark ? "text-white/40" : "text-gray-400")}>
                  {accountName || account?.slice(0, 4) + '...' + account?.slice(-4)}
                </span>
                <span className={cn("text-[9px]", isDark ? "text-white/20" : "text-gray-300")}>•</span>
                <span className={cn("text-[9px]", isDark ? "text-white/30" : "text-gray-400")}>
                  {formatMonthYear(created)}
                </span>
              </div>
            </div>
          </div>

          {/* Center: Stats Grid */}
          <div className="hidden md:grid grid-cols-4 lg:grid-cols-7 gap-4 flex-1 mx-6">
            {statsData.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className={cn("text-[9px] uppercase tracking-wider", isDark ? "text-white/30" : "text-gray-400")}>{stat.label}</div>
                <div className={cn("text-[13px] font-medium", stat.color)}>
                  {stat.prefix && <span className={isDark ? "text-white/30" : "text-gray-400"}>{stat.prefix}</span>}
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1 ml-auto pl-2 border-l border-white/10">
            {accountLogin === collection.account && (
              <Link href={`/collection/${slug}/edit`} className={cn(
                "w-7 h-7 rounded-lg border-[1.5px] flex items-center justify-center transition-all",
                isDark ? "border-white/10 hover:border-primary hover:bg-primary/10" : "border-gray-200 hover:border-primary hover:bg-primary/5"
              )}>
                <Pencil size={14} className={isDark ? "text-white/70" : "text-gray-600"} />
              </Link>
            )}
            <div className="relative" ref={shareDropdownRef}>
              <button
                onClick={() => setOpenShare(!openShare)}
                className={cn(
                  "w-7 h-7 rounded-lg border-[1.5px] flex items-center justify-center transition-all",
                  isDark ? "border-white/10 hover:border-primary hover:bg-primary/10" : "border-gray-200 hover:border-primary hover:bg-primary/5"
                )}
              >
                <Share2 size={14} className={isDark ? "text-white/70" : "text-gray-600"} />
              </button>

              {openShare && (
                <div className={cn(
                  'absolute top-full right-0 mt-2 p-3 rounded-xl border z-50 min-w-[180px]',
                  isDark ? 'bg-black/95 border-white/10 backdrop-blur-lg' : 'bg-white border-gray-200 shadow-lg'
                )}>
                  <p className={cn('text-[11px] font-medium mb-2 text-center uppercase tracking-wider', isDark ? 'text-white/50' : 'text-gray-500')}>
                    Share
                  </p>
                  <div className="flex justify-center gap-2">
                    <FacebookShareButton url={shareUrl} quote={shareTitle}>
                      <FacebookIcon size={32} round />
                    </FacebookShareButton>
                    <TwitterShareButton title={`Check out ${shareTitle} on XRPNFT`} url={shareUrl}>
                      <TwitterIcon size={32} round />
                    </TwitterShareButton>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description Row */}
        {description && (
          <div className="mt-2 pt-2 border-t border-white/5">
            <p className={cn('text-[11px]', isDark ? 'text-white/40' : 'text-gray-500')}>
              {truncate(description, 120)}
            </p>
          </div>
        )}

        {/* Mobile Stats */}
        <div className="md:hidden grid grid-cols-4 gap-2 mt-2 pt-2 border-t border-white/5">
          {statsData.slice(0, 4).map((stat) => (
            <div key={stat.label} className="text-center">
              <div className={cn("text-[8px] uppercase", isDark ? "text-white/30" : "text-gray-400")}>{stat.label}</div>
              <div className={cn("text-[11px] font-medium", stat.color)}>
                {stat.prefix && <span className={isDark ? "text-white/30" : "text-gray-400"}>{stat.prefix}</span>}
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* NFTs and Activity Tabs */}
      <div className={cn('rounded-xl border-[1.5px] p-4', isDark ? 'border-white/10' : 'border-gray-200')}>
        <TabContext value={value}>
          <div className={cn('flex justify-between items-center mb-4 pb-2 border-b', isDark ? 'border-white/5' : 'border-gray-100')}>
            <div className="flex gap-1">
              {['tab-nfts', 'tab-creator-transactions'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setValue(tab)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all',
                    value === tab
                      ? 'bg-primary/10 text-primary'
                      : isDark ? 'text-white/50 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  )}
                >
                  {tab === 'tab-nfts' ? 'NFTs' : 'Activity'}
                </button>
              ))}
            </div>

            {isAdmin && value === 'tab-nfts' && (
              <button
                onClick={handleRemoveAll}
                disabled={deletingNfts.length === 0}
                className={cn(
                  'px-2 py-1 rounded-lg text-[11px] font-medium border-[1.5px] transition-all',
                  deletingNfts.length === 0
                    ? 'opacity-40 cursor-not-allowed border-gray-300 text-gray-400'
                    : 'border-red-500/20 text-red-500 hover:bg-red-500/10'
                )}
              >
                Delete All
              </button>
            )}
          </div>

          <TabPanel value="tab-nfts">
            <NFTGrid collection={collection} />
          </TabPanel>
          <TabPanel value="tab-creator-transactions">
            <AccountTransactions collectionSlug={slug} />
          </TabPanel>
        </TabContext>
      </div>
    </div>
  );
}
