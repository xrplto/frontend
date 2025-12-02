import * as Dialog from '@radix-ui/react-dialog';
import * as Avatar from '@radix-ui/react-avatar';
import { useState, useEffect, useRef, useCallback, useContext } from 'react';
import axios from 'axios';
import { AppContext } from 'src/AppContext';
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';
import { cn } from 'src/utils/cn';
import { AlertTriangle, BadgeCheck, Search, X, TrendingUp, Layers, Clock, Image } from 'lucide-react';

const API_URL = 'https://api.xrpl.to';

const getThemeClasses = (isDark) => ({
  overlay: isDark ? 'bg-black/60' : 'bg-black/40',
  modal: isDark
    ? 'border-white/[0.08] bg-[#0d0d0d] shadow-2xl shadow-black/70'
    : 'border-gray-200 bg-white shadow-xl shadow-black/[0.08]',
  text: isDark ? 'text-white' : 'text-gray-900',
  textSecondary: isDark ? 'text-white/50' : 'text-gray-500',
  border: isDark ? 'border-white/[0.08]' : 'border-gray-200',
  hover: isDark ? 'hover:bg-white/[0.05]' : 'hover:bg-gray-50',
  bg: isDark ? 'bg-white/[0.05]' : 'bg-gray-100',
  divider: isDark ? 'bg-white/[0.06]' : 'bg-gray-100',
  item: isDark ? 'hover:bg-white/[0.05]' : 'hover:bg-gray-50'
});

const currencySymbols = {
  USD: '$',
  EUR: '€',
  JPY: '¥',
  CNH: '¥',
  XRP: ''
};

const formatPrice = (price) => {
  if (price === 0) return '0.00';
  if (price < 0.00000001) return parseFloat(price).toFixed(12);
  if (price < 0.0000001) return parseFloat(price).toFixed(10);
  if (price < 0.000001) return parseFloat(price).toFixed(8);
  if (price < 0.0001) return parseFloat(price).toFixed(6);
  if (price < 1) return parseFloat(price).toFixed(4);
  return parseFloat(price).toFixed(2);
};

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

function SearchModal({ open, onClose }) {
  const inputRef = useRef(null);
  const { activeFiatCurrency, themeName } = useContext(AppContext);
  const metrics = useSelector(selectMetrics);
  const exchRate = metrics[activeFiatCurrency] || 1;
  const isDark = themeName === 'XrplToDarkTheme';
  const theme = getThemeClasses(isDark);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ tokens: [], collections: [], nfts: [] });
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [trendingTokens, setTrendingTokens] = useState([]);
  const [trendingCollections, setTrendingCollections] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 200);

  const convertPrice = useCallback(
    (xrpPrice) => {
      if (activeFiatCurrency === 'XRP') return xrpPrice;
      return xrpPrice / exchRate;
    },
    [activeFiatCurrency, exchRate]
  );

  const currencySymbol = currencySymbols[activeFiatCurrency] || '$';

  useEffect(() => {
    if (!open) return;
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse recent searches', e);
      }
    }
  }, [open]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const loadTrending = async () => {
      setLoadingTrending(true);
      try {
        const res = await axios.post(`${API_URL}/api/search`, { search: '' });

        setTrendingTokens(res.data?.tokens?.slice(0, 3) || []);
        setTrendingCollections(res.data?.collections?.slice(0, 4) || []);
      } catch (error) {
        console.error('Error loading trending data:', error);
      } finally {
        setLoadingTrending(false);
      }
    };

    loadTrending();
  }, [open]);

  useEffect(() => {
    if (!debouncedSearchQuery || !open) {
      setSearchResults({ tokens: [], collections: [], nfts: [] });
      return;
    }

    const controller = new AbortController();

    const performSearch = async () => {
      setLoading(true);
      try {
        const res = await axios.post(
          `${API_URL}/api/search`,
          { search: debouncedSearchQuery },
          { signal: controller.signal }
        );

        setSearchResults({
          tokens: res.data?.tokens?.slice(0, 4) || [],
          collections: res.data?.collections?.slice(0, 4) || [],
          nfts: res.data?.nfts?.slice(0, 6) || []
        });
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error('Search error:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    performSearch();
    return () => controller.abort();
  }, [debouncedSearchQuery, open]);

  const handleClose = useCallback(() => {
    setSearchQuery('');
    setSearchResults({ tokens: [], collections: [], nfts: [] });
    onClose();
  }, [onClose]);

  const handleResultClick = useCallback(
    (item, type) => {
      const itemId = type === 'nft' ? item._id : item.slug;
      const newRecent = {
        ...item,
        type,
        timestamp: Date.now(),
        slug: item.slug,
        md5: item.md5,
        user: item.user,
        name: item.name,
        logoImage: item.logoImage,
        _id: item._id,
        cslug: item.cslug,
        collection: item.collection,
        files: item.files
      };

      const updated = [newRecent, ...recentSearches.filter((r) => {
        if (type === 'nft') return r._id !== item._id || r.type !== type;
        return r.slug !== item.slug || r.type !== type;
      })].slice(0, 5);

      setRecentSearches(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));

      handleClose();

      setTimeout(() => {
        if (type === 'token') {
          window.location.href = `/token/${item.slug}`;
        } else if (type === 'collection') {
          window.location.href = `/collection/${item.slug}`;
        } else if (type === 'nft') {
          window.location.href = `/nft/${item._id}`;
        }
      }, 0);
    },
    [recentSearches, handleClose]
  );

  if (!open) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className={cn("fixed inset-0 z-50", theme.overlay)} />
        <Dialog.Content
          onKeyDown={(e) => e.key === 'Escape' && handleClose()}
          className={cn("fixed left-1/2 top-[12vh] z-50 w-full max-w-[440px] -translate-x-1/2 rounded-xl border", theme.modal)}
        >
          {/* Search Header */}
          <div className={cn("border-b px-4 py-3", theme.border)}>
            <div className="flex items-center gap-3">
              <Search size={16} className={theme.textSecondary} />
              <input
                ref={inputRef}
                placeholder="Search tokens, collections, NFTs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
                className={cn("flex-1 bg-transparent text-[15px] font-normal focus:outline-none", theme.text, isDark ? "placeholder:text-gray-500" : "placeholder:text-gray-400")}
              />
              {loading && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              )}
              <button onClick={handleClose} className={cn("rounded-md p-1 transition-colors", theme.textSecondary, isDark ? "hover:bg-white/10 hover:text-white" : "hover:bg-gray-100 hover:text-gray-900")}>
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div>
            {!searchQuery && (
              <>
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="px-4 pt-3 pb-1">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Clock size={12} className="text-gray-500" />
                      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">Recent</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {recentSearches.slice(0, 4).map((item, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            handleClose();
                            setTimeout(() => {
                              if (item.type === 'token') {
                                window.location.href = `/token/${item.slug}`;
                              } else if (item.type === 'collection') {
                                window.location.href = `/collection/${item.slug}`;
                              } else if (item.type === 'nft') {
                                window.location.href = `/nft/${item._id}`;
                              }
                            }, 0);
                          }}
                          className={cn("flex items-center gap-1.5 rounded-full px-2 py-1", isDark ? "bg-white/[0.06] hover:bg-white/10" : "bg-gray-100 hover:bg-gray-200")}
                        >
                          <Avatar.Root className="h-4 w-4">
                            <Avatar.Image
                              src={
                                item.type === 'collection'
                                  ? `https://s1.xrpl.to/nft-collection/${item.logoImage}`
                                  : item.type === 'nft'
                                  ? (item.files?.[0]?.thumbnail?.small
                                      ? `https://s1.xrpl.to/nft/${item.files[0].thumbnail.small}`
                                      : `https://s1.xrpl.to/nft-collection/${item.cslug}`)
                                  : `https://s1.xrpl.to/token/${item.md5}`
                              }
                              className="h-full w-full rounded-full object-cover"
                            />
                            <Avatar.Fallback className={cn("flex h-full w-full items-center justify-center rounded-full text-[8px]", isDark ? "bg-white/10" : "bg-gray-300")}>
                              {item.user?.[0] || item.name?.[0]}
                            </Avatar.Fallback>
                          </Avatar.Root>
                          <span className={cn("text-[11px] font-normal", theme.text)}>{item.user || item.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending Tokens */}
                {!loadingTrending && trendingTokens.length > 0 && (
                  <>
                    <div className="flex items-center gap-1.5 px-4 pb-1.5 pt-3">
                      <TrendingUp size={12} className="text-primary" />
                      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">Trending</p>
                    </div>
                    <div>
                      {trendingTokens.map((token, index) => {
                        const isCopycat = token.warning === 'copycat';
                        return (
                          <button
                            key={index}
                            onClick={() => handleResultClick(token, 'token')}
                            className={cn(
                              "flex w-full items-center gap-3 px-4 py-2.5 transition-colors",
                              theme.item,
                              isCopycat && (isDark ? 'bg-red-500/5' : 'bg-red-50')
                            )}
                          >
                            <div className="relative">
                              <Avatar.Root className="h-9 w-9">
                                <Avatar.Image src={`https://s1.xrpl.to/token/${token.md5}`} className="h-9 w-9 rounded-full object-cover" />
                                <Avatar.Fallback className={cn("flex h-full w-full items-center justify-center rounded-full text-xs", isDark ? "bg-white/10" : "bg-gray-200")}>{token.user?.[0]}</Avatar.Fallback>
                              </Avatar.Root>
                              {isCopycat && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                  <AlertTriangle size={10} className="text-white" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className={cn(
                                  "truncate text-[13px] font-normal",
                                  theme.text,
                                  isCopycat && 'text-red-500'
                                )}>{token.user}</p>
                                {token.verified && (
                                  <BadgeCheck size={14} className="text-primary flex-shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <p className="truncate text-[11px] text-gray-500">{token.name}</p>
                                {isCopycat && (
                                  <span className="text-[9px] font-medium uppercase tracking-wide text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded flex-shrink-0">
                                    Copycat
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              {token.exch !== undefined && token.exch !== null && (
                                <p className={cn("text-[12px] font-normal", theme.text)}>
                                  {activeFiatCurrency === 'XRP' ? `${formatPrice(convertPrice(token.exch))} XRP` : `${currencySymbol}${formatPrice(convertPrice(token.exch))}`}
                                </p>
                              )}
                              {token.pro24h !== undefined && token.pro24h !== null && (
                                <p className={cn('text-[10px] font-normal', parseFloat(token.pro24h) >= 0 ? 'text-green-500' : 'text-red-500')}>
                                  {parseFloat(token.pro24h) >= 0 ? '+' : ''}
                                  {parseFloat(token.pro24h).toFixed(2)}%
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Trending Collections */}
                {!loadingTrending && trendingCollections.length > 0 && (
                  <>
                    <div className={cn("mx-4 my-2 h-px", theme.divider)} />
                    <div className="flex items-center gap-1.5 px-4 pb-1.5 pt-1">
                      <Layers size={12} className="text-green-500" />
                      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">Trending Collections</p>
                    </div>
                    <div>
                      {trendingCollections.map((collection, index) => (
                        <button
                          key={index}
                          onClick={() => handleResultClick(collection, 'collection')}
                          className={cn("flex w-full items-center gap-3 px-4 py-2.5 transition-colors", theme.item)}
                        >
                          <Avatar.Root className="h-9 w-9">
                            <Avatar.Image src={`https://s1.xrpl.to/nft-collection/${collection.logoImage}`} className="h-9 w-9 rounded-full object-cover" />
                            <Avatar.Fallback className={cn("flex h-full w-full items-center justify-center rounded-full text-xs", isDark ? "bg-white/10" : "bg-gray-200")}>{collection.name?.[0]}</Avatar.Fallback>
                          </Avatar.Root>
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className={cn("truncate text-[13px] font-normal", theme.text)}>{collection.name}</p>
                              {collection.verified === 'yes' && (
                                <BadgeCheck size={14} className="text-primary flex-shrink-0" />
                              )}
                            </div>
                            <p className="truncate text-[11px] text-gray-500">{collection.items ? `${collection.items.toLocaleString()} items` : 'Collection'}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            {collection.floor?.amount && (
                              <p className={cn("text-[12px] font-normal", theme.text)}>
                                {Number(collection.floor.amount) >= 1 ? Math.round(collection.floor.amount) : collection.floor.amount} XRP
                              </p>
                            )}
                            {collection.sales24h > 0 && (
                              <p className="text-[10px] text-gray-500">
                                {collection.sales24h} sale{collection.sales24h !== 1 ? 's' : ''} today
                              </p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {loadingTrending && (
                  <div className="flex justify-center py-6">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                )}
              </>
            )}

            {/* Search Results */}
            {(searchResults.tokens.length > 0 || searchResults.collections.length > 0 || searchResults.nfts.length > 0) && (
              <>
                {searchResults.tokens.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 px-4 pb-2 pt-4">
                      <TrendingUp size={14} className="text-primary/50" />
                      <p className="text-xs font-normal text-gray-400/60">Tokens</p>
                    </div>
                    <div>
                      {searchResults.tokens.map((token, index) => {
                        const shouldHighlight = index === 0 && searchResults.tokens.length > 1 && token.verified && !token.warning;
                        const isCopycat = token.warning === 'copycat';
                        return (
                          <button
                            key={index}
                            onClick={() => handleResultClick(token, 'token')}
                            className={cn(
                              'flex w-full items-center gap-3 px-4 py-2.5 transition-colors',
                              theme.item,
                              shouldHighlight && 'bg-primary/5',
                              isCopycat && (isDark ? 'bg-red-500/5' : 'bg-red-50')
                            )}
                          >
                            <div className="relative">
                              <Avatar.Root className="h-9 w-9">
                                <Avatar.Image src={`https://s1.xrpl.to/token/${token.md5}`} className="h-9 w-9 rounded-full object-cover" />
                                <Avatar.Fallback className={cn("flex h-full w-full items-center justify-center rounded-full text-xs", isDark ? "bg-white/10" : "bg-gray-200")}>{token.user?.[0]}</Avatar.Fallback>
                              </Avatar.Root>
                              {isCopycat && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                  <AlertTriangle size={10} className="text-white" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className={cn(
                                  'truncate text-[13px] font-normal',
                                  shouldHighlight ? 'text-primary' : theme.text,
                                  isCopycat && 'text-red-500'
                                )}>{token.user}</p>
                                {token.verified && (
                                  <BadgeCheck size={14} className="text-primary flex-shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <p className="truncate text-[11px] text-gray-500">{token.name}</p>
                                {isCopycat && (
                                  <span className="text-[9px] font-medium uppercase tracking-wide text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded flex-shrink-0">
                                    Copycat
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              {token.exch !== undefined && token.exch !== null && (
                                <p className={cn("text-[13px] font-normal", theme.text)}>
                                  {activeFiatCurrency === 'XRP' ? `${formatPrice(convertPrice(token.exch))} XRP` : `${currencySymbol}${formatPrice(convertPrice(token.exch))}`}
                                </p>
                              )}
                              {token.pro24h !== undefined && token.pro24h !== null && (
                                <p className={cn('text-[11px] font-normal', parseFloat(token.pro24h) >= 0 ? 'text-green-500' : 'text-red-500')}>
                                  {parseFloat(token.pro24h) >= 0 ? '+' : ''}
                                  {parseFloat(token.pro24h).toFixed(2)}%
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {searchResults.collections.length > 0 && (
                  <>
                    {searchResults.tokens.length > 0 && <div className={cn("mx-4 my-2 h-px", theme.divider)} />}
                    <div className="flex items-center gap-2 px-4 pb-2 pt-3">
                      <Layers size={14} className="text-gray-500" />
                      <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500">Collections</p>
                    </div>
                    <div>
                      {searchResults.collections.map((collection, index) => {
                        const isCopycat = collection.warning === 'copycat';
                        return (
                          <button
                            key={index}
                            onClick={() => handleResultClick(collection, 'collection')}
                            className={cn(
                              "flex w-full items-center gap-3 px-4 py-2.5 transition-colors",
                              theme.item,
                              isCopycat && (isDark ? 'bg-red-500/5' : 'bg-red-50')
                            )}
                          >
                            <div className="relative">
                              <Avatar.Root className="h-9 w-9">
                                <Avatar.Image src={`https://s1.xrpl.to/nft-collection/${collection.logoImage}`} className="h-9 w-9 rounded-full object-cover" />
                                <Avatar.Fallback className={cn("flex h-full w-full items-center justify-center rounded-full text-xs", isDark ? "bg-white/10" : "bg-gray-200")}>{collection.name?.[0]}</Avatar.Fallback>
                              </Avatar.Root>
                              {isCopycat && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                  <AlertTriangle size={10} className="text-white" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className={cn("truncate text-[13px] font-normal", theme.text, isCopycat && 'text-red-500')}>{collection.name}</p>
                                {collection.verified === 'yes' && (
                                  <BadgeCheck size={14} className="text-primary flex-shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <p className="truncate text-[11px] text-gray-500">{collection.items ? `${collection.items.toLocaleString()} items` : 'Collection'}</p>
                                {isCopycat && (
                                  <span className="text-[9px] font-medium uppercase tracking-wide text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded flex-shrink-0">Copycat</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              {collection.floor?.amount && (
                                <p className={cn("text-[13px] font-normal", theme.text)}>
                                  {Number(collection.floor.amount) >= 1 ? Math.round(collection.floor.amount) : collection.floor.amount} XRP
                                </p>
                              )}
                              {collection.sales24h > 0 && <p className="text-[10px] text-gray-500">{collection.sales24h} sale{collection.sales24h !== 1 ? 's' : ''} today</p>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {searchResults.nfts.length > 0 && (
                  <>
                    {(searchResults.tokens.length > 0 || searchResults.collections.length > 0) && <div className={cn("mx-4 my-2 h-px", theme.divider)} />}
                    <div className="flex items-center gap-2 px-4 pb-2 pt-3">
                      <Image size={14} className="text-purple-500" />
                      <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500">NFTs</p>
                    </div>
                    <div>
                      {searchResults.nfts.map((nft, index) => {
                        const thumbnail = nft.files?.[0]?.thumbnail?.small || nft.files?.[0]?.thumbnail?.medium;
                        const imgSrc = thumbnail
                          ? `https://s1.xrpl.to/nft/${thumbnail}`
                          : `https://s1.xrpl.to/nft-collection/${nft.cslug}`;
                        return (
                          <button
                            key={index}
                            onClick={() => handleResultClick(nft, 'nft')}
                            className={cn("flex w-full items-center gap-3 px-4 py-2.5 transition-colors", theme.item)}
                          >
                            <Avatar.Root className="h-9 w-9">
                              <Avatar.Image src={imgSrc} className="h-9 w-9 rounded-lg object-cover" />
                              <Avatar.Fallback className={cn("flex h-full w-full items-center justify-center rounded-lg text-xs", isDark ? "bg-white/10" : "bg-gray-200")}>{nft.name?.[0]}</Avatar.Fallback>
                            </Avatar.Root>
                            <div className="flex-1 text-left min-w-0">
                              <p className={cn("truncate text-[13px] font-normal", theme.text)}>{nft.name}</p>
                              <p className="truncate text-[11px] text-gray-500">{nft.collection || nft.cslug}</p>
                            </div>
                            {nft.rarity_rank && nft.total && (
                              <div className="text-right flex-shrink-0">
                                <p className={cn("text-[12px] font-normal", theme.text)}>#{nft.rarity_rank}</p>
                                <p className="text-[10px] text-gray-500">of {nft.total.toLocaleString()}</p>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            )}

            {/* No Results */}
            {searchQuery && !loading && searchResults.tokens.length === 0 && searchResults.collections.length === 0 && searchResults.nfts.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-[13px] text-gray-500">No results found for "{searchQuery}"</p>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default SearchModal;
