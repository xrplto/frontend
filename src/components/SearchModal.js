import * as Dialog from '@radix-ui/react-dialog';
import * as Avatar from '@radix-ui/react-avatar';
import { useState, useEffect, useRef, useCallback, useContext } from 'react';
import axios from 'axios';
import { AppContext } from 'src/AppContext';
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';
import { cn } from 'src/utils/cn';

const API_URL = 'https://api.xrpl.to/api';

const getThemeClasses = (isDark) => ({
  overlay: isDark ? 'bg-black/40' : 'bg-black/20',
  modal: isDark
    ? 'border-white/5 bg-gradient-to-br from-black/90 via-black/60 to-black/95'
    : 'border-gray-200 bg-white',
  text: isDark ? 'text-white' : 'text-gray-900',
  textSecondary: isDark ? 'text-gray-400' : 'text-gray-600',
  border: isDark ? 'border-gray-700' : 'border-gray-300',
  hover: isDark ? 'hover:bg-primary/5' : 'hover:bg-gray-100',
  bg: isDark ? 'bg-gray-800' : 'bg-gray-100'
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
  const [searchResults, setSearchResults] = useState({ tokens: [], collections: [] });
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
        const [tokensRes, collectionsRes] = await Promise.all([
          axios.post(`${API_URL}/search`, { search: '' }),
          axios.post(`${API_URL}/nft/search`, { search: '' })
        ]);

        setTrendingTokens(tokensRes.data?.tokens?.slice(0, 3) || []);
        setTrendingCollections(collectionsRes.data?.collections?.slice(0, 4) || []);
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
      setSearchResults({ tokens: [], collections: [] });
      return;
    }

    const controller = new AbortController();

    const performSearch = async () => {
      setLoading(true);
      try {
        const [tokensRes, collectionsRes] = await Promise.all([
          axios.post(`${API_URL}/search`, { search: debouncedSearchQuery }, { signal: controller.signal }),
          axios.post(`${API_URL}/nft/search`, { search: debouncedSearchQuery }, { signal: controller.signal })
        ]);

        setSearchResults({
          tokens: tokensRes.data?.tokens?.slice(0, 4) || [],
          collections: collectionsRes.data?.collections?.slice(0, 4) || []
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
    setSearchResults({ tokens: [], collections: [] });
    onClose();
  }, [onClose]);

  const handleResultClick = useCallback(
    (item, type) => {
      const newRecent = {
        ...item,
        type,
        timestamp: Date.now(),
        slug: item.slug,
        md5: item.md5,
        user: item.user,
        name: item.name,
        logoImage: item.logoImage
      };

      const updated = [newRecent, ...recentSearches.filter((r) => r.slug !== item.slug || r.type !== type)].slice(0, 5);

      setRecentSearches(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));

      handleClose();

      setTimeout(() => {
        if (type === 'token') {
          window.location.href = `/token/${item.slug}`;
        } else if (type === 'collection') {
          window.location.href = `/collection/${item.slug}`;
        }
      }, 0);
    },
    [recentSearches, handleClose]
  );

  if (!open) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className={cn("fixed inset-0 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", theme.overlay)} />
        <Dialog.Content
          onKeyDown={(e) => e.key === 'Escape' && handleClose()}
          className={cn("fixed left-1/2 top-[12vh] max-h-[65vh] w-full max-w-[650px] -translate-x-1/2 overflow-hidden rounded-xl border shadow-2xl backdrop-blur-[40px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95", theme.modal)}
        >
          {/* Search Header */}
          <div className="p-4">
            <div className="flex items-center gap-3">
              <svg className={cn("h-5 w-5", theme.textSecondary)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                placeholder="Search tokens and collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
                className={cn("flex-1 bg-transparent text-sm font-normal focus:outline-none", theme.text, isDark ? "placeholder:text-white/50" : "placeholder:text-gray-400")}
              />
              {loading && (
                <svg className="h-4 w-4 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              <button onClick={handleClose} className={theme.textSecondary}>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[calc(65vh-80px)] overflow-y-auto">
            {!searchQuery && (
              <>
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <>
                    <div className="px-4 pb-1 pt-2">
                      <p className="text-[10px] font-normal text-gray-400/50">Recent</p>
                    </div>
                    <div className="space-y-1">
                      {recentSearches.slice(0, 3).map((item, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            handleClose();
                            setTimeout(() => {
                              if (item.type === 'token') {
                                window.location.href = `/token/${item.slug}`;
                              } else if (item.type === 'collection') {
                                window.location.href = `/collection/${item.slug}`;
                              }
                            }, 0);
                          }}
                          className="mx-2 flex w-[calc(100%-16px)] items-center gap-2 rounded-lg px-3 py-2 hover:bg-primary/5"
                        >
                          <Avatar.Root className="h-6 w-6">
                            <Avatar.Image
                              src={
                                item.type === 'collection'
                                  ? `https://s1.xrpl.to/nft-collection/${item.logoImage}`
                                  : `https://s1.xrpl.to/token/${item.md5}`
                              }
                              className="h-full w-full rounded-full object-cover"
                            />
                            <Avatar.Fallback className="flex h-full w-full items-center justify-center rounded-full bg-gray-800 text-xs">
                              {item.user?.[0] || item.name?.[0]}
                            </Avatar.Fallback>
                          </Avatar.Root>
                          <div className="flex-1 text-left">
                            <p className="text-xs font-normal text-white">{item.user || item.name}</p>
                            <p className="text-[11px] text-gray-400/50">{item.name}</p>
                          </div>
                          <span className="rounded border border-gray-700 px-2 py-0.5 text-[9px] font-normal text-gray-400">{item.type}</span>
                        </button>
                      ))}
                    </div>
                    <div className="my-2 h-px bg-gray-800" />
                  </>
                )}

                {/* Trending Tokens */}
                {!loadingTrending && trendingTokens.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 px-4 pb-3 pt-4">
                      <svg className="h-4 w-4 text-primary/60" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                      </svg>
                      <p className="text-[11px] font-normal text-gray-400/60">Trending</p>
                    </div>
                    <div className="space-y-2">
                      {trendingTokens.map((token, index) => (
                        <button
                          key={index}
                          onClick={() => handleResultClick(token, 'token')}
                          className="mx-2 flex w-[calc(100%-16px)] items-center gap-3 rounded-xl px-4 py-3 hover:bg-primary/5"
                        >
                          <Avatar.Root className="h-9 w-9">
                            <Avatar.Image src={`https://s1.xrpl.to/token/${token.md5}`} className="h-full w-full rounded-full object-cover" />
                            <Avatar.Fallback className="flex h-full w-full items-center justify-center rounded-full bg-gray-800 text-sm">{token.user?.[0]}</Avatar.Fallback>
                          </Avatar.Root>
                          <div className="flex-1 text-left">
                            <p className="truncate text-sm font-normal text-white">{token.user}</p>
                            <p className="truncate text-[13px] text-gray-400/60">{token.name}</p>
                          </div>
                          <div className="text-right">
                            {token.exch !== undefined && token.exch !== null && (
                              <p className="text-sm font-normal text-white">
                                {activeFiatCurrency === 'XRP' ? `${formatPrice(convertPrice(token.exch))} XRP` : `${currencySymbol}${formatPrice(convertPrice(token.exch))}`}
                              </p>
                            )}
                            {token.pro24h !== undefined && token.pro24h !== null && (
                              <p className={cn('text-xs font-normal', parseFloat(token.pro24h) >= 0 ? 'text-green-500' : 'text-red-500')}>
                                {parseFloat(token.pro24h) >= 0 ? '+' : ''}
                                {parseFloat(token.pro24h).toFixed(2)}%
                              </p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Trending Collections */}
                {!loadingTrending && trendingCollections.length > 0 && (
                  <>
                    <div className="my-2 h-px bg-gray-800" />
                    <div className="flex items-center gap-2 px-4 pb-2 pt-4">
                      <svg className="h-4 w-4 text-green-500/60" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                      </svg>
                      <p className="text-[11px] font-normal text-gray-400/60">Trending Collections</p>
                    </div>
                    <div className="space-y-2">
                      {trendingCollections.map((collection, index) => (
                        <button
                          key={index}
                          onClick={() => handleResultClick(collection, 'collection')}
                          className="mx-2 flex w-[calc(100%-16px)] items-center gap-3 rounded-xl px-4 py-2.5 hover:bg-primary/5"
                        >
                          <Avatar.Root className="h-8 w-8">
                            <Avatar.Image src={`https://s1.xrpl.to/nft-collection/${collection.logoImage}`} className="h-full w-full rounded-full object-cover" />
                            <Avatar.Fallback className="flex h-full w-full items-center justify-center rounded-full bg-gray-800 text-sm">{collection.name?.[0]}</Avatar.Fallback>
                          </Avatar.Root>
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-[13px] font-normal text-white">{collection.name}</p>
                              {collection.verified === 'yes' && <span className="rounded bg-primary px-2 py-0.5 text-[10px] font-normal text-white">Verified</span>}
                            </div>
                            <p className="truncate text-xs text-gray-400/60">{collection.items ? `${collection.items.toLocaleString()} items` : 'Collection'}</p>
                          </div>
                          <div className="text-right">
                            {collection.floor?.amount && (
                              <p className="text-[13px] font-normal text-white">
                                {Number(collection.floor.amount) >= 1 ? Math.round(collection.floor.amount) : collection.floor.amount} XRP
                              </p>
                            )}
                            {collection.sales24h > 0 && (
                              <p className="text-[11px] text-gray-400/60">
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
                  <div className="flex justify-center p-4">
                    <svg className="h-6 w-6 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                )}
              </>
            )}

            {/* Search Results */}
            {(searchResults.tokens.length > 0 || searchResults.collections.length > 0) && (
              <>
                {searchResults.tokens.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 px-4 pb-2 pt-4">
                      <svg className="h-3.5 w-3.5 text-primary/50" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                      </svg>
                      <p className="text-xs font-normal text-gray-400/60">Tokens</p>
                    </div>
                    <div className="space-y-2">
                      {searchResults.tokens.map((token, index) => {
                        const shouldHighlight = index === 0 && searchResults.tokens.length > 1;
                        return (
                          <button
                            key={index}
                            onClick={() => handleResultClick(token, 'token')}
                            className={cn('mx-2 flex w-[calc(100%-16px)] items-center gap-3 rounded-xl px-4 py-3 hover:bg-primary/8', shouldHighlight && 'bg-primary/5')}
                          >
                            <Avatar.Root className="h-9 w-9">
                              <Avatar.Image src={`https://s1.xrpl.to/token/${token.md5}`} className="h-full w-full rounded-full object-cover" />
                              <Avatar.Fallback className="flex h-full w-full items-center justify-center rounded-full bg-gray-800 text-sm">{token.user?.[0]}</Avatar.Fallback>
                            </Avatar.Root>
                            <div className="flex-1 text-left">
                              <div className="flex items-center gap-2">
                                <p className={cn('truncate text-[15px] font-normal', shouldHighlight ? 'text-primary' : 'text-white')}>{token.user}</p>
                                {token.verified && <span className="rounded bg-primary px-2 py-0.5 text-[13px] font-normal text-white">Verified</span>}
                              </div>
                              <p className="truncate text-[13px] text-gray-400/60">{token.name}</p>
                            </div>
                            <div className="text-right">
                              {token.exch !== undefined && token.exch !== null && (
                                <p className="text-sm font-normal text-white">
                                  {activeFiatCurrency === 'XRP' ? `${formatPrice(convertPrice(token.exch))} XRP` : `${currencySymbol}${formatPrice(convertPrice(token.exch))}`}
                                </p>
                              )}
                              {token.pro24h !== undefined && token.pro24h !== null && (
                                <p className={cn('text-xs font-normal', parseFloat(token.pro24h) >= 0 ? 'text-green-500' : 'text-red-500')}>
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
                    {searchResults.tokens.length > 0 && <div className="my-2 h-px bg-gray-800" />}
                    <div className="flex items-center gap-2 px-4 pb-2 pt-4">
                      <svg className="h-3.5 w-3.5 text-gray-400/50" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                      </svg>
                      <p className="text-xs font-normal text-gray-400/60">Collections</p>
                    </div>
                    <div className="space-y-2">
                      {searchResults.collections.map((collection, index) => (
                        <button
                          key={index}
                          onClick={() => handleResultClick(collection, 'collection')}
                          className="mx-2 flex w-[calc(100%-16px)] items-center gap-3 rounded-xl px-4 py-2.5 hover:bg-primary/5"
                        >
                          <Avatar.Root className="h-8 w-8">
                            <Avatar.Image src={`https://s1.xrpl.to/nft-collection/${collection.logoImage}`} className="h-full w-full rounded-full object-cover" />
                            <Avatar.Fallback className="flex h-full w-full items-center justify-center rounded-full bg-gray-800 text-sm">{collection.name?.[0]}</Avatar.Fallback>
                          </Avatar.Root>
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-[13px] font-normal text-white">{collection.name}</p>
                              {collection.verified === 'yes' && <span className="rounded bg-primary px-2 py-0.5 text-[10px] font-normal text-white">Verified</span>}
                            </div>
                            <p className="truncate text-xs text-gray-400/60">{collection.items ? `${collection.items.toLocaleString()} items` : 'Collection'}</p>
                          </div>
                          <div className="text-right">
                            {collection.floor?.amount && (
                              <p className="text-[13px] font-normal text-white">
                                {Number(collection.floor.amount) >= 1 ? Math.round(collection.floor.amount) : collection.floor.amount} XRP
                              </p>
                            )}
                            {collection.sales24h > 0 && <p className="text-[11px] text-gray-400/60">{collection.sales24h} sale{collection.sales24h !== 1 ? 's' : ''} today</p>}
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {/* No Results */}
            {searchQuery && !loading && searchResults.tokens.length === 0 && searchResults.collections.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-sm text-gray-400/60">No results found for "{searchQuery}"</p>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default SearchModal;
