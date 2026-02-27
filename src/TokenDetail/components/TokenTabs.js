import { memo, useContext, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { X, Plus, Search, Trash2, ChevronLeft } from 'lucide-react';
import api from 'src/utils/api';
import VerificationBadge from 'src/components/VerificationBadge';
import { ThemeContext } from 'src/context/AppContext';
import { useTokenTabs, addTokenToTabs } from 'src/hooks/useTokenTabs';
import { cn } from 'src/utils/cn';
import { getHashIcon } from 'src/utils/formatters';

const BASE_URL = 'https://api.xrpl.to/v1';

const TokenTabs = memo(({ currentMd5 }) => {
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const { tabs, removeTab, clearTabs } = useTokenTabs();

  const currentTab = tabs.find((t) => t.md5 === currentMd5 || t.slug === currentMd5);
  const isNftWithCollection = currentTab?.type === 'nft' && currentTab?.collectionSlug;
  const isCollection = currentTab?.type === 'collection';
  const isToken = currentTab?.type === 'token';

  const clearOthers = useCallback(() => {
    if (currentTab) {
      clearTabs();
      addTokenToTabs({ ...currentTab });
    }
  }, [currentTab, clearTabs]);

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ tokens: [], collections: [] });
  const [suggested, setSuggested] = useState({ tokens: [], collections: [] });
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setQuery('');
    setActiveIndex(-1);
  }, []);

  // Cmd+K global shortcut
  useEffect(() => {
    const handleGlobalKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (searchOpen) {
          closeSearch();
        } else {
          setSearchOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [searchOpen, closeSearch]);

  // Load suggested when modal opens
  useEffect(() => {
    if (!searchOpen) return;
    api
      .post(`${BASE_URL}/search`, { search: '' })
      .then((res) =>
        setSuggested({
          tokens: res.data?.tokens?.slice(0, 4) || [],
          collections: res.data?.collections?.slice(0, 3) || []
        })
      )
      .catch(err => { console.warn('[TokenTabs] Suggested search failed:', err.message); });
  }, [searchOpen]);

  // Debounced search API
  useEffect(() => {
    if (!query || !searchOpen) {
      setResults({ tokens: [], collections: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    setActiveIndex(-1);
    clearTimeout(debounceRef.current);
    const controller = new AbortController();
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.post(
          `${BASE_URL}/search`,
          { search: query },
          { signal: controller.signal }
        );
        setResults({
          tokens: res.data?.tokens?.slice(0, 5) || [],
          collections: res.data?.collections?.slice(0, 3) || []
        });
      } catch {}
      setLoading(false);
    }, 250);
    return () => {
      clearTimeout(debounceRef.current);
      controller.abort();
    };
  }, [query, searchOpen]);

  // Flat list of all selectable items for keyboard nav
  const flatItems = useMemo(() => {
    const tokens = (query ? results.tokens : suggested.tokens).map((t) => ({ type: 'token', data: t }));
    const collections = (query ? results.collections : suggested.collections).map((c) => ({ type: 'collection', data: c }));
    return [...tokens, ...collections];
  }, [query, results, suggested]);

  const handleSelectToken = useCallback((token) => {
    addTokenToTabs({
      md5: token.md5,
      slug: token.slug,
      name: token.name,
      user: token.user,
      type: 'token'
    });
    setSearchOpen(false);
    setQuery('');
    setActiveIndex(-1);
    window.location.href = `/token/${token.slug}`;
  }, []);

  const handleSelectCollection = useCallback((col) => {
    const normalizedName =
      typeof col.name === 'object' && col.name !== null
        ? col.name.collection_name || ''
        : col.name || '';
    addTokenToTabs({
      slug: col.slug,
      name: normalizedName,
      type: 'collection',
      logoImage: col.logoImage
    });
    setSearchOpen(false);
    setQuery('');
    setActiveIndex(-1);
    window.location.href = `/nfts/${col.slug}`;
  }, []);

  // Keyboard navigation inside search modal
  const handleSearchKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        closeSearch();
        return;
      }
      if (flatItems.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % flatItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => (i <= 0 ? flatItems.length - 1 : i - 1));
      } else if (e.key === 'Enter' && activeIndex >= 0 && activeIndex < flatItems.length) {
        e.preventDefault();
        const item = flatItems[activeIndex];
        if (item.type === 'token') handleSelectToken(item.data);
        else handleSelectCollection(item.data);
      }
    },
    [flatItems, activeIndex, closeSearch, handleSelectToken, handleSelectCollection]
  );

  const openSearch = useCallback(() => {
    setSearchOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  // Track flat index offset for collections
  const tokenCount = (query ? results.tokens : suggested.tokens).length;

  return (
    <div className="flex items-center gap-1 px-2 h-8 overflow-x-auto scrollbar-hide -mx-2 sm:-mx-4 mb-1 select-none">
      {/* Back navigation / Context breadcrumb */}
      {(isNftWithCollection || isCollection || isToken) && (
        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href={
              isNftWithCollection
                ? `/nfts/${currentTab.collectionSlug}`
                : isCollection
                  ? '/nfts'
                  : '/'
            }
            className={cn(
              'group flex items-center gap-1 px-2 h-9 rounded-md text-[10px] font-bold uppercase tracking-wider transition-[opacity,transform,background-color,border-color] border',
              'text-gray-400 border-black/[0.05] hover:text-gray-700 hover:bg-gray-100/50 dark:text-white/60 dark:border-white/[0.05] dark:hover:text-white dark:hover:bg-white/[0.05] dark:hover:border-white/10'
            )}
          >
            <ChevronLeft size={12} strokeWidth={3} className="transition-transform group-hover:-translate-x-0.5" />
            <span className="max-w-[90px] truncate">
              {isNftWithCollection
                ? currentTab.collectionName || 'Collection'
                : isCollection
                  ? 'Collections'
                  : 'Tokens'}
            </span>
          </a>
          <div className={cn('w-px h-4 opacity-20', 'bg-black dark:bg-white')} />
        </div>
      )}

      <div className="flex items-center gap-1" role="tablist" aria-label="Token tabs">
        {[...tabs]
          .filter(
            (t) =>
              !(
                isNftWithCollection &&
                t.type === 'collection' &&
                t.slug === currentTab.collectionSlug
              )
          )
          .sort((a, b) => {
            const aMatch = a.md5 === currentMd5 || a.slug === currentMd5;
            const bMatch = b.md5 === currentMd5 || b.slug === currentMd5;
            return aMatch ? -1 : bMatch ? 1 : 0;
          })
          .slice(0, 6)
          .map((tab) => {
            const isCollection = tab.type === 'collection';
            const isNft = tab.type === 'nft';
            const isAccount = tab.type === 'account';
            const tabId = tab.md5 || tab.slug;
            const isActive = tab.md5 === currentMd5 || tab.slug === currentMd5;
            const href = isAccount
              ? `/address/${tab.slug}`
              : isNft
                ? `/nft/${tab.slug}`
                : isCollection
                  ? `/nfts/${tab.slug}`
                  : `/token/${tab.slug}`;
            const imgSrc = isAccount
              ? getHashIcon(tab.slug)
              : isNft
                ? tab.coverUrl || (tab.thumbnail ? `https://s1.xrpl.to/nft/${tab.thumbnail}` : '/static/alt.webp')
                : isCollection
                  ? tab.logoImage
                    ? `https://s1.xrpl.to/nft-collection/${tab.logoImage}`
                    : '/static/alt.webp'
                  : `https://s1.xrpl.to/thumb/${tab.md5}_48`;

            const tabName =
              typeof tab.name === 'object' && tab.name !== null
                ? tab.name.collection_name || tab.name.name || ''
                : tab.name || '';
            const label = isAccount
              ? tabName
              : isNft
                ? tabName
                : isCollection
                  ? tabName
                  : `${tabName}/XRP`;

            return (
              <a
                key={tabId}
                href={href}
                role="tab"
                aria-selected={isActive}
                onClick={(e) => isActive && e.preventDefault()}
                className={cn(
                  'group flex items-center gap-1 px-1.5 h-9 rounded-md text-[10px] font-bold transition-[opacity,transform,background-color,border-color] shrink-0 border relative outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
                  isActive
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30'
                    : 'text-gray-500 hover:text-gray-900 bg-white border-black/[0.04] hover:border-black/10 dark:text-white/60 dark:hover:text-white/80 dark:bg-white/[0.02] dark:border-white/10 dark:hover:border-white/20'
                )}
              >
                <img
                  src={imgSrc}
                  alt=""
                  className={cn(
                    'w-3.5 h-3.5 shrink-0 object-cover shadow-sm',
                    isCollection || isNft ? 'rounded' : 'rounded-full'
                  )}
                  onError={(e) => (e.target.src = '/static/alt.webp')}
                  suppressHydrationWarning={isAccount}
                />
                <span className="max-w-[68px] truncate tracking-tight">{label}</span>
                <button
                  aria-label="Close tab"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeTab(tabId);
                  }}
                  className={cn(
                    'flex items-center justify-center w-4 h-4 rounded transition-[opacity,transform,background-color,border-color] outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
                    isActive
                      ? 'hover:bg-emerald-100 text-emerald-600/50 hover:text-emerald-600 dark:hover:bg-emerald-500/20 dark:text-emerald-400/50 dark:hover:text-emerald-400'
                      : 'opacity-0 group-hover:opacity-100 hover:bg-black/5 text-gray-400 hover:text-gray-900 dark:opacity-0 dark:group-hover:opacity-100 dark:hover:bg-white/10 dark:text-white/60 dark:hover:text-white'
                  )}
                >
                  <X size={10} strokeWidth={3} />
                </button>
              </a>
            );
          })}
      </div>

      <div className="flex-1" />

      {/* Right side actions */}
      <div className="flex items-center gap-1 shrink-0 ml-2">
        <button
          onClick={openSearch}
          title="Search tokens (Cmd+K)"
          aria-label="Search tokens"
          className={cn(
            'flex items-center gap-1.5 px-2 h-9 rounded-md transition-[opacity,transform,background-color,border-color] border font-bold text-[10px] uppercase tracking-widest outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
            'bg-gray-50 border-black/[0.05] text-gray-400 hover:text-gray-700 hover:border-black/10 dark:bg-white/[0.05] dark:border-white/10 dark:text-white/55 dark:hover:text-white dark:hover:border-white/20'
          )}
        >
          <Search size={12} strokeWidth={3} />
          <span className="hidden sm:inline">Add</span>
          <kbd className={cn(
            'hidden sm:inline-flex items-center px-1 py-0.5 rounded text-[9px] font-bold border ml-1',
            'border-black/5 text-gray-300 dark:border-white/10 dark:text-white/30'
          )}>
            {typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent) ? '\u2318' : 'Ctrl+'}K
          </kbd>
        </button>

        {tabs.length > 1 && (
          <button
            onClick={clearOthers}
            title="Clear other tabs"
            aria-label="Clear other tabs"
            className={cn(
              'flex items-center justify-center w-9 h-9 rounded-md transition-[opacity,transform,background-color,border-color] border outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
              'bg-white border-black/[0.05] text-gray-400 hover:text-red-500 hover:border-red-200 dark:bg-white/[0.02] dark:border-white/10 dark:text-white/55 dark:hover:text-red-400 dark:hover:border-red-400/30'
            )}
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {/* Search Modal */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[10000] flex items-start justify-center pt-[10dvh] px-4 max-sm:h-dvh"
          onClick={closeSearch}
          onKeyDown={handleSearchKeyDown}
        >
          <div
            className={cn(
              'fixed inset-0 backdrop-blur-xl transition-opacity animate-in fade-in duration-300',
              'bg-white/60 dark:bg-[#0a0a0a]/80'
            )}
          />
          <div
            ref={searchRef}
            role="dialog"
            aria-modal="true"
            aria-label="Search tokens and collections"
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'relative w-full max-w-xl rounded-2xl border transition-[opacity,transform,background-color,border-color] animate-in slide-in-from-top-4 duration-300 overflow-hidden shadow-2xl',
              'bg-white/90 border-black/[0.06] shadow-gray-200 dark:bg-[#111111]/90 dark:border-white/[0.08] dark:shadow-black/80'
            )}
          >
            <div
              className={cn(
                'flex items-center gap-4 px-5 py-4 border-b',
                'border-gray-100 dark:border-white/10'
              )}
            >
              <Search size={20} strokeWidth={2.5} className="text-emerald-500" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search tokens, collections, or addresses..."
                aria-label="Search tokens, collections, or addresses"
                className={cn(
                  'flex-1 bg-transparent text-[16px] font-medium outline-none',
                  'text-gray-900 placeholder:text-gray-400 dark:text-white dark:placeholder:text-white/20'
                )}
              />
              <div className="flex items-center gap-2">
                <span className={cn(
                  'hidden sm:flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-tighter',
                  'border-black/5 text-gray-400 dark:border-white/10 dark:text-white/55'
                )}>
                  ESC
                </span>
                <button
                  onClick={closeSearch}
                  aria-label="Close search"
                  className={cn('p-1.5 rounded-lg transition-[background-color,border-color] outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]', 'hover:bg-gray-100 text-gray-400 dark:hover:bg-white/10 dark:text-white/55')}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto overscroll-contain custom-scrollbar py-2">
              {loading && (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span className={cn('text-[12px] font-medium', 'text-gray-400 dark:text-white/20')}>Searching XRPL...</span>
                </div>
              )}

              {/* Tokens Section */}
              {!loading && (query ? results.tokens : suggested.tokens).length > 0 && (
                <div className="mb-2">
                  <div className={cn(
                    'px-5 py-2 text-[10px] font-black uppercase tracking-[0.15em]',
                    'text-gray-400 dark:text-white/55'
                  )}>
                    Top Tokens
                  </div>
                  {(query ? results.tokens : suggested.tokens).map((token, idx) => (
                    <div
                      key={token.md5}
                      onClick={() => handleSelectToken(token)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={cn(
                        'flex items-center gap-4 px-5 py-3 cursor-pointer transition-[opacity,transform,background-color,border-color] mx-2 rounded-xl group',
                        activeIndex === idx
                          ? 'bg-gray-100/80 dark:bg-white/[0.06]'
                          : 'hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                      )}
                    >
                      <div className="relative">
                        <img
                          src={`https://s1.xrpl.to/thumb/${token.md5}_48`}
                          className="w-10 h-10 rounded-full object-cover shadow-sm bg-black/5"
                          alt=""
                          onError={(e) => (e.target.src = '/static/alt.webp')}
                        />
                        <VerificationBadge verified={token.verified} size="sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn('text-[15px] font-bold', 'text-gray-900 dark:text-white')}>
                            {token.user}
                          </span>
                          <span className={cn('text-[12px] font-medium opacity-40', 'text-gray-500 dark:text-white')}>
                            {token.name}
                          </span>
                        </div>
                        <p className={cn('text-[11px] font-mono opacity-30 truncate', 'text-gray-500 dark:text-white')}>
                          {token.issuer}
                        </p>
                      </div>
                      <div className={cn(
                        'transition-opacity flex items-center gap-1 text-[11px] font-bold',
                        activeIndex === idx ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                        'text-emerald-600 dark:text-emerald-400'
                      )}>
                        VIEW <Plus size={12} strokeWidth={3} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Collections Section */}
              {!loading && (query ? results.collections : suggested.collections).length > 0 && (
                <div className="mb-2">
                  <div className={cn(
                    'px-5 py-2 text-[10px] font-black uppercase tracking-[0.15em] border-t mt-2 pt-4',
                    'text-gray-400 border-gray-100 dark:text-white/55 dark:border-white/5'
                  )}>
                    NFT Collections
                  </div>
                  {(query ? results.collections : suggested.collections).map((col, idx) => {
                    const flatIdx = tokenCount + idx;
                    return (
                      <div
                        key={col.slug}
                        onClick={() => handleSelectCollection(col)}
                        onMouseEnter={() => setActiveIndex(flatIdx)}
                        className={cn(
                          'flex items-center gap-4 px-5 py-3 cursor-pointer transition-[opacity,transform,background-color,border-color] mx-2 rounded-xl group',
                          activeIndex === flatIdx
                            ? 'bg-gray-100/80 dark:bg-white/[0.06]'
                            : 'hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                        )}
                      >
                        <div className="relative">
                          <img
                            src={`https://s1.xrpl.to/nft-collection/${col.logoImage}`}
                            className="w-10 h-10 rounded-xl object-cover shadow-sm bg-black/5"
                            alt=""
                            onError={(e) => { e.target.onerror = null; e.target.style.opacity = '0'; }}
                          />
                          <VerificationBadge verified={col.verified === 'yes' ? 4 : col.verified} size="sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn('text-[15px] font-bold', 'text-gray-900 dark:text-white')}>
                              {typeof col.name === 'object' ? col.name?.collection_name : col.name}
                            </span>
                          </div>
                          <p className={cn('text-[11px] font-mono opacity-30 truncate', 'text-gray-500 dark:text-white')}>
                            {col.account}
                          </p>
                        </div>
                        <div className={cn(
                          'transition-opacity flex items-center gap-1 text-[11px] font-bold',
                          activeIndex === flatIdx ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                          'text-emerald-600 dark:text-emerald-400'
                        )}>
                          VIEW <Plus size={12} strokeWidth={3} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {query &&
                !loading &&
                results.tokens.length === 0 &&
                results.collections.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className={cn('w-12 h-12 rounded-full flex items-center justify-center border-2 border-dashed', 'border-black/5 text-black/5 dark:border-white/10 dark:text-white/10')}>
                      <Search size={24} />
                    </div>
                    <p className={cn('text-[14px] font-medium', 'text-gray-400 dark:text-white/55')}>
                      No results found for &ldquo;{query}&rdquo;
                    </p>
                  </div>
                )}
            </div>

            {/* Modal Footer */}
            <div className={cn(
              'px-5 py-3 border-t flex items-center justify-between text-[10px] font-bold uppercase tracking-widest',
              'border-gray-100 bg-gray-50 text-gray-400 dark:border-white/10 dark:bg-white/[0.02] dark:text-white/20'
            )}>
              <div className="flex gap-4">
                <span className="flex items-center gap-1"><span className={cn('px-1 rounded border', 'border-black/5 dark:border-white/10')}>↑↓</span> Navigate</span>
                <span className="flex items-center gap-1"><span className={cn('px-1 rounded border', 'border-black/5 dark:border-white/10')}>ENTER</span> Select</span>
              </div>
              <span>Search Powered by XRPL.to</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

TokenTabs.displayName = 'TokenTabs';

export default TokenTabs;
