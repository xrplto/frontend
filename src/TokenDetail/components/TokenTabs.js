import { memo, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { X, Plus, Search, Trash2, ChevronLeft, Check, Star, Sparkles } from 'lucide-react';
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
  const searchRef = useRef(null);
  const inputRef = useRef(null);

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
      .catch(() => { });
  }, [searchOpen]);

  // Search API
  useEffect(() => {
    if (!query || !searchOpen) {
      setResults({ tokens: [], collections: [] });
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    (async () => {
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
      } catch { }
      setLoading(false);
    })();
    return () => controller.abort();
  }, [query, searchOpen]);

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
    window.location.href = `/nfts/${col.slug}`;
  }, []);

  const openSearch = useCallback(() => {
    setSearchOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  return (
    <div className="flex items-center gap-1.5 px-2 h-9 overflow-x-auto scrollbar-hide -mx-2 sm:-mx-4 mb-4 select-none">
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
              'group flex items-center gap-1 px-2.5 h-7 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all border',
              isDark
                ? 'text-white/40 border-white/[0.05] hover:text-white hover:bg-white/[0.05] hover:border-white/10'
                : 'text-gray-400 border-black/[0.05] hover:text-gray-700 hover:bg-gray-100/50'
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
          <div className={cn('w-px h-4 opacity-20', isDark ? 'bg-white' : 'bg-black')} />
        </div>
      )}

      <div className="flex items-center gap-1.5">
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
                ? `https://s1.xrpl.to/nft/${tab.thumbnail || tab.slug}`
                : isCollection
                  ? tab.logoImage
                    ? `https://s1.xrpl.to/nft-collection/${tab.logoImage}`
                    : '/static/alt.webp'
                  : `https://s1.xrpl.to/token/${tab.md5}`;

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
                onClick={(e) => isActive && e.preventDefault()}
                className={cn(
                  'group flex items-center gap-2 px-2.5 h-7 rounded-lg text-[11px] font-bold transition-all shrink-0 border relative',
                  isActive
                    ? isDark
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    : isDark
                      ? 'text-white/40 hover:text-white/80 bg-white/[0.02] border-white/10 hover:border-white/20'
                      : 'text-gray-500 hover:text-gray-900 bg-white border-black/[0.04] hover:border-black/10'
                )}
              >
                <img
                  src={imgSrc}
                  alt=""
                  className={cn(
                    'w-4 h-4 shrink-0 object-cover shadow-sm',
                    isCollection || isNft ? 'rounded' : 'rounded-full'
                  )}
                  onError={(e) => (e.target.src = '/static/alt.webp')}
                  suppressHydrationWarning={isAccount}
                />
                <span className="max-w-[100px] truncate tracking-tight">{label}</span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeTab(tabId);
                  }}
                  className={cn(
                    'flex items-center justify-center w-4 h-4 rounded-md transition-all ml-0.5',
                    isActive
                      ? isDark ? 'hover:bg-emerald-500/20 text-emerald-400/50 hover:text-emerald-400' : 'hover:bg-emerald-100 text-emerald-600/50 hover:text-emerald-600'
                      : isDark ? 'opacity-0 group-hover:opacity-100 hover:bg-white/10 text-white/40 hover:text-white' : 'opacity-0 group-hover:opacity-100 hover:bg-black/5 text-gray-400 hover:text-gray-900'
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
          className={cn(
            'flex items-center gap-1.5 px-2.5 h-7 rounded-lg transition-all border font-bold text-[10px] uppercase tracking-widest',
            isDark
              ? 'bg-white/[0.05] border-white/10 text-white/40 hover:text-white hover:border-white/20'
              : 'bg-gray-50 border-black/[0.05] text-gray-400 hover:text-gray-700 hover:border-black/10'
          )}
        >
          <Search size={12} strokeWidth={3} />
          <span className="hidden sm:inline">Add</span>
        </button>

        {tabs.length > 1 && (
          <button
            onClick={clearOthers}
            title="Clear other tabs"
            className={cn(
              'flex items-center justify-center w-7 h-7 rounded-lg transition-all border',
              isDark
                ? 'bg-white/[0.02] border-white/10 text-white/30 hover:text-red-400 hover:border-red-400/30'
                : 'bg-white border-black/[0.05] text-gray-400 hover:text-red-500 hover:border-red-200'
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
          onClick={() => {
            setSearchOpen(false);
            setQuery('');
          }}
        >
          <div
            className={cn(
              'fixed inset-0 backdrop-blur-xl transition-opacity animate-in fade-in duration-300',
              isDark ? 'bg-[#0a0a0a]/80' : 'bg-white/60'
            )}
          />
          <div
            ref={searchRef}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'relative w-full max-w-xl rounded-2xl border transition-all animate-in slide-in-from-top-4 duration-300 overflow-hidden shadow-2xl',
              isDark
                ? 'bg-[#111111]/90 border-white/[0.08] shadow-black/80'
                : 'bg-white/90 border-black/[0.06] shadow-gray-200'
            )}
          >
            <div
              className={cn(
                'flex items-center gap-4 px-5 py-4 border-b',
                isDark ? 'border-white/10' : 'border-gray-100'
              )}
            >
              <Search size={20} strokeWidth={2.5} className={isDark ? 'text-emerald-500' : 'text-emerald-500'} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tokens, collections, or addresses..."
                className={cn(
                  'flex-1 bg-transparent text-[16px] font-medium outline-none',
                  isDark
                    ? 'text-white placeholder:text-white/20'
                    : 'text-gray-900 placeholder:text-gray-400'
                )}
              />
              <div className="flex items-center gap-2">
                <span className={cn(
                  'hidden sm:flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-tighter',
                  isDark ? 'border-white/10 text-white/30' : 'border-black/5 text-gray-400'
                )}>
                  ESC
                </span>
                <button
                  onClick={() => {
                    setSearchOpen(false);
                    setQuery('');
                  }}
                  className={cn('p-1.5 rounded-lg transition-colors', isDark ? 'hover:bg-white/10 text-white/40' : 'hover:bg-gray-100 text-gray-400')}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto overscroll-contain custom-scrollbar py-2">
              {loading && (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span className={cn('text-[12px] font-medium', isDark ? 'text-white/20' : 'text-gray-400')}>Searching XRPL...</span>
                </div>
              )}

              {/* Tokens Section */}
              {!loading && (query ? results.tokens : suggested.tokens).length > 0 && (
                <div className="mb-2">
                  <div className={cn(
                    'px-5 py-2 text-[10px] font-black uppercase tracking-[0.15em]',
                    isDark ? 'text-white/30' : 'text-gray-400'
                  )}>
                    Top Tokens
                  </div>
                  {(query ? results.tokens : suggested.tokens).map((token) => (
                    <div
                      key={token.md5}
                      onClick={() => handleSelectToken(token)}
                      className={cn(
                        'flex items-center gap-4 px-5 py-3 cursor-pointer transition-all mx-2 rounded-xl group hover:scale-[1.01]',
                        isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50'
                      )}
                    >
                      <div className="relative">
                        <img
                          src={`https://s1.xrpl.to/token/${token.md5}`}
                          className="w-10 h-10 rounded-full object-cover shadow-sm bg-black/5"
                          alt=""
                          onError={(e) => (e.target.src = '/static/alt.webp')}
                        />
                        <VerificationBadge verified={token.verified} size="sm" isDark={isDark} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn('text-[15px] font-bold', isDark ? 'text-white' : 'text-gray-900')}>
                            {token.user}
                          </span>
                          <span className={cn('text-[12px] font-medium opacity-40', isDark ? 'text-white' : 'text-gray-500')}>
                            {token.name}
                          </span>
                        </div>
                        <p className={cn('text-[11px] font-mono opacity-30 truncate', isDark ? 'text-white' : 'text-gray-500')}>
                          {token.issuer}
                        </p>
                      </div>
                      <div className={cn(
                        'opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[11px] font-bold',
                        isDark ? 'text-emerald-400' : 'text-emerald-600'
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
                    isDark ? 'text-white/30 border-white/5' : 'text-gray-400 border-gray-100'
                  )}>
                    NFT Collections
                  </div>
                  {(query ? results.collections : suggested.collections).map((col) => (
                    <div
                      key={col.slug}
                      onClick={() => handleSelectCollection(col)}
                      className={cn(
                        'flex items-center gap-4 px-5 py-3 cursor-pointer transition-all mx-2 rounded-xl group hover:scale-[1.01]',
                        isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50'
                      )}
                    >
                      <div className="relative">
                        <img
                          src={`https://s1.xrpl.to/nft-collection/${col.logoImage}`}
                          className="w-10 h-10 rounded-xl object-cover shadow-sm bg-black/5"
                          alt=""
                          onError={(e) => (e.target.src = '/static/alt.webp')}
                        />
                        <VerificationBadge verified={col.verified === 'yes' ? 4 : col.verified} size="sm" isDark={isDark} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn('text-[15px] font-bold', isDark ? 'text-white' : 'text-gray-900')}>
                            {typeof col.name === 'object' ? col.name?.collection_name : col.name}
                          </span>
                        </div>
                        <p className={cn('text-[11px] font-mono opacity-30 truncate', isDark ? 'text-white' : 'text-gray-500')}>
                          {col.account}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {query &&
                !loading &&
                results.tokens.length === 0 &&
                results.collections.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className={cn('w-12 h-12 rounded-full flex items-center justify-center border-2 border-dashed', isDark ? 'border-white/10 text-white/10' : 'border-black/5 text-black/5')}>
                      <Search size={24} />
                    </div>
                    <p className={cn('text-[14px] font-medium', isDark ? 'text-white/30' : 'text-gray-400')}>
                      No results found for "{query}"
                    </p>
                  </div>
                )}
            </div>

            {/* Modal Footer */}
            <div className={cn(
              'px-5 py-3 border-t flex items-center justify-between text-[10px] font-bold uppercase tracking-widest',
              isDark ? 'border-white/10 bg-white/[0.02] text-white/20' : 'border-gray-100 bg-gray-50 text-gray-400'
            )}>
              <div className="flex gap-4">
                <span className="flex items-center gap-1"><span className={cn('px-1 rounded border', isDark ? 'border-white/10' : 'border-black/5')}>↑↓</span> Navigate</span>
                <span className="flex items-center gap-1"><span className={cn('px-1 rounded border', isDark ? 'border-white/10' : 'border-black/5')}>ENTER</span> Select</span>
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
