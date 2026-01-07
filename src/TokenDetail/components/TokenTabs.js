import { memo, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { X, Plus, Search, Trash2, ChevronLeft } from 'lucide-react';
import axios from 'axios';
import { AppContext } from 'src/AppContext';
import { useTokenTabs, addTokenToTabs } from 'src/hooks/useTokenTabs';
import { cn } from 'src/utils/cn';
import { getHashIcon } from 'src/utils/formatters';

const BASE_URL = 'https://api.xrpl.to/api';

const TokenTabs = memo(({ currentMd5 }) => {
  const { themeName } = useContext(AppContext);
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
    axios.post(`${BASE_URL}/search`, { search: '' })
      .then(res => setSuggested({
        tokens: res.data?.tokens?.slice(0, 4) || [],
        collections: res.data?.collections?.slice(0, 3) || []
      }))
      .catch(() => {});
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
        const res = await axios.post(`${BASE_URL}/search`, { search: query }, { signal: controller.signal });
        setResults({
          tokens: res.data?.tokens?.slice(0, 5) || [],
          collections: res.data?.collections?.slice(0, 3) || []
        });
      } catch {}
      setLoading(false);
    })();
    return () => controller.abort();
  }, [query, searchOpen]);

  const handleSelectToken = useCallback((token) => {
    addTokenToTabs({ md5: token.md5, slug: token.slug, name: token.name, user: token.user, type: 'token' });
    setSearchOpen(false);
    setQuery('');
    window.location.href = `/token/${token.slug}`;
  }, []);

  const handleSelectCollection = useCallback((col) => {
    // Normalize name: API may return object {collection_name, collection_description}
    const normalizedName = typeof col.name === 'object' && col.name !== null
      ? col.name.collection_name || ''
      : col.name || '';
    addTokenToTabs({ slug: col.slug, name: normalizedName, type: 'collection', logoImage: col.logoImage });
    setSearchOpen(false);
    setQuery('');
    window.location.href = `/nfts/${col.slug}`;
  }, []);

  const openSearch = useCallback(() => {
    setSearchOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  return (
    <div
      className={cn(
        'flex items-center gap-1 px-2 h-[32px] overflow-x-auto scrollbar-hide -mx-2 sm:-mx-4 mb-3',
        isDark ? 'bg-transparent' : 'bg-transparent'
      )}
    >
      {/* Back navigation */}
      {(isNftWithCollection || isCollection || isToken) && (
        <>
          <a
            href={isNftWithCollection ? `/nfts/${currentTab.collectionSlug}` : isCollection ? '/nfts' : '/'}
            className={cn(
              'flex items-center gap-0.5 px-2 h-6 rounded text-[11px] font-medium transition-all shrink-0',
              isDark ? 'text-white/50 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            )}
          >
            <ChevronLeft size={12} />
            <span className="max-w-[80px] truncate">
              {isNftWithCollection ? currentTab.collectionName || 'Collection' : isCollection ? 'Collections' : 'Tokens'}
            </span>
          </a>
          <div className={cn('w-px h-3.5 shrink-0', isDark ? 'bg-white/10' : 'bg-gray-200')} />
        </>
      )}

      {[...tabs]
        .filter((t) => !(isNftWithCollection && t.type === 'collection' && t.slug === currentTab.collectionSlug))
        .sort((a, b) => {
          const aMatch = a.md5 === currentMd5 || a.slug === currentMd5;
          const bMatch = b.md5 === currentMd5 || b.slug === currentMd5;
          return aMatch ? -1 : bMatch ? 1 : 0;
        }).slice(0, 6).map((tab) => {
        const isCollection = tab.type === 'collection';
        const isNft = tab.type === 'nft';
        const isAccount = tab.type === 'account';
        const tabId = tab.md5 || tab.slug;
        const isActive = tab.md5 === currentMd5 || tab.slug === currentMd5;
        const href = isAccount ? `/address/${tab.slug}` : isNft ? `/nft/${tab.slug}` : isCollection ? `/nfts/${tab.slug}` : `/token/${tab.slug}`;
        const imgSrc = isAccount
          ? getHashIcon(tab.slug)
          : isNft
            ? `https://s1.xrpl.to/nft/${tab.thumbnail || tab.slug}`
            : isCollection
              ? (tab.logoImage ? `https://s1.xrpl.to/nft-collection/${tab.logoImage}` : '/static/alt.webp')
              : `https://s1.xrpl.to/token/${tab.md5}`;
        // Normalize tab.name: could be object {collection_name, collection_description}
        const tabName = typeof tab.name === 'object' && tab.name !== null
          ? tab.name.collection_name || tab.name.name || ''
          : tab.name || '';
        const label = isAccount ? tabName : isNft ? tabName : isCollection ? tabName : `${tabName}/XRP`;

        return (
          <a
            key={tabId}
            href={href}
            onClick={(e) => isActive && e.preventDefault()}
            className={cn(
              'group flex items-center gap-1.5 px-2 h-6 rounded text-[11px] font-medium transition-all shrink-0 border',
              isActive
                ? isDark
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                : isDark
                  ? 'text-white/50 hover:text-white/80 bg-white/[0.02] border-white/10 hover:border-white/20'
                  : 'text-gray-500 hover:text-gray-700 bg-gray-50 border-gray-200 hover:border-gray-300'
            )}
          >
            <img
              src={imgSrc}
              alt=""
              className={cn('w-3.5 h-3.5 shrink-0 object-cover', isCollection || isNft ? 'rounded' : 'rounded-full')}
              onError={(e) => (e.target.src = '/static/alt.webp')}
            />
            <span className="max-w-[90px] truncate">{label}</span>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                removeTab(tabId);
              }}
              className={cn(
                'transition-all opacity-0 group-hover:opacity-50 hover:!opacity-100',
                isActive ? 'opacity-50' : ''
              )}
            >
              <X size={10} />
            </button>
          </a>
        );
      })}

      <div className="flex-1" />

      {/* Right side actions */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onClick={openSearch}
          title="Add tab"
          className={cn(
            'p-1 rounded transition-colors',
            isDark ? 'text-white/40 hover:text-white/70' : 'text-gray-400 hover:text-gray-600'
          )}
        >
          <Plus size={14} />
        </button>

        {tabs.length > 1 && (
          <button
            onClick={clearOthers}
            title="Clear other tabs"
            className={cn(
              'p-1 rounded transition-colors',
              isDark ? 'text-white/40 hover:text-red-400' : 'text-gray-400 hover:text-red-500'
            )}
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {/* Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[12vh]" onClick={() => { setSearchOpen(false); setQuery(''); }}>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            ref={searchRef}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'relative w-full max-w-md mx-4 rounded-xl border overflow-hidden',
              isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-gray-200 shadow-xl'
            )}
          >
            <div className={cn('flex items-center gap-3 px-4 py-3 border-b', isDark ? 'border-white/10' : 'border-gray-100')}>
              <Search size={16} className={isDark ? 'text-white/40' : 'text-gray-400'} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tokens..."
                className={cn('flex-1 bg-transparent text-[14px] outline-none', isDark ? 'text-white placeholder:text-white/30' : 'text-gray-900 placeholder:text-gray-400')}
              />
              <button onClick={() => { setSearchOpen(false); setQuery(''); }} className={cn('p-1 rounded', isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100')}>
                <X size={14} className={isDark ? 'text-white/40' : 'text-gray-400'} />
              </button>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {/* Tokens Section */}
              {(query ? results.tokens : suggested.tokens).length > 0 && (
                <>
                  <div className={cn('px-3 py-2 text-[10px] font-medium uppercase tracking-wider', isDark ? 'text-white/30' : 'text-gray-400')}>Tokens</div>
                  {(query ? results.tokens : suggested.tokens).map((token) => (
                    <div
                      key={token.md5}
                      onClick={() => handleSelectToken(token)}
                      className={cn('flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors', isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50')}
                    >
                      <img src={`https://s1.xrpl.to/token/${token.md5}`} className="w-8 h-8 rounded-full object-cover" alt="" onError={(e) => (e.target.src = '/static/alt.webp')} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={cn('text-[13px] font-medium', isDark ? 'text-white/90' : 'text-gray-900')}>{token.user}</span>
                          <span className={cn('text-[11px]', isDark ? 'text-white/30' : 'text-gray-400')}>({token.name})</span>
                        </div>
                        <p className={cn('text-[10px] font-mono truncate', isDark ? 'text-white/20' : 'text-gray-400')}>{token.issuer}</p>
                      </div>
                      {token.verified && <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-[9px]">✓</span>}
                    </div>
                  ))}
                </>
              )}

              {/* NFTs Section */}
              {(query ? results.collections : suggested.collections).length > 0 && (
                <>
                  <div className={cn('px-3 py-2 text-[10px] font-medium uppercase tracking-wider', isDark ? 'text-white/30 border-t border-white/5' : 'text-gray-400 border-t border-gray-100')}>Collections</div>
                  {(query ? results.collections : suggested.collections).map((col) => (
                    <div
                      key={col.slug}
                      onClick={() => handleSelectCollection(col)}
                      className={cn('flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors', isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50')}
                    >
                      <img src={`https://s1.xrpl.to/nft-collection/${col.logoImage}`} className="w-8 h-8 rounded object-cover" alt="" onError={(e) => (e.target.src = '/static/alt.webp')} />
                      <div className="flex-1 min-w-0">
                        <span className={cn('text-[13px] font-medium', isDark ? 'text-white/90' : 'text-gray-900')}>{typeof col.name === 'object' ? col.name?.collection_name || '' : col.name || ''}</span>
                        <p className={cn('text-[10px] font-mono truncate', isDark ? 'text-white/20' : 'text-gray-400')}>{col.account}</p>
                      </div>
                      {col.verified === 'yes' && <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-[9px]">✓</span>}
                    </div>
                  ))}
                </>
              )}

              {query && !loading && results.tokens.length === 0 && results.collections.length === 0 && (
                <p className={cn('px-4 py-6 text-[12px] text-center', isDark ? 'text-white/30' : 'text-gray-400')}>No results found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

TokenTabs.displayName = 'TokenTabs';

export default TokenTabs;
