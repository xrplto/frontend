import { memo, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { X, Plus, Search, Trash2 } from 'lucide-react';
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

  const clearOthers = useCallback(() => {
    const currentTab = tabs.find((t) => t.md5 === currentMd5 || t.slug === currentMd5);
    if (currentTab) {
      clearTabs();
      addTokenToTabs({ ...currentTab });
    }
  }, [tabs, currentMd5, clearTabs]);

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
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await axios.post(`${BASE_URL}/search`, { search: query }, { signal: controller.signal });
        setResults({
          tokens: res.data?.tokens?.slice(0, 5) || [],
          collections: res.data?.collections?.slice(0, 3) || []
        });
      } catch {}
      setLoading(false);
    }, 150);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, searchOpen]);

  const handleSelectToken = useCallback((token) => {
    addTokenToTabs({ md5: token.md5, slug: token.slug, name: token.name, user: token.user, type: 'token' });
    setSearchOpen(false);
    setQuery('');
    window.location.href = `/token/${token.slug}`;
  }, []);

  const handleSelectCollection = useCallback((col) => {
    addTokenToTabs({ slug: col.slug, name: col.name, type: 'collection', logoImage: col.logoImage });
    setSearchOpen(false);
    setQuery('');
    window.location.href = `/collection/${col.slug}`;
  }, []);

  const openSearch = useCallback(() => {
    setSearchOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  return (
    <div
      className={cn(
        'flex items-center justify-start gap-1.5 px-4 h-[36px] overflow-x-auto scrollbar-hide border-b -mx-2 sm:-mx-4 -mt-1',
        isDark ? 'border-b-white/10 bg-[#131313]' : 'border-b-gray-200 bg-gray-50'
      )}
    >
      {[...tabs].sort((a, b) => {
        const aMatch = a.md5 === currentMd5 || a.slug === currentMd5;
        const bMatch = b.md5 === currentMd5 || b.slug === currentMd5;
        return aMatch ? -1 : bMatch ? 1 : 0;
      }).map((tab) => {
        const isCollection = tab.type === 'collection';
        const isNft = tab.type === 'nft';
        const isAccount = tab.type === 'account';
        const tabId = tab.md5 || tab.slug;
        const isActive = tab.md5 === currentMd5 || tab.slug === currentMd5;
        const href = isAccount ? `/profile/${tab.slug}` : isNft ? `/nft/${tab.slug}` : isCollection ? `/collection/${tab.slug}` : `/token/${tab.slug}`;
        const imgSrc = isAccount
          ? getHashIcon(tab.slug)
          : isNft
            ? `https://s1.xrpl.to/nft/${tab.thumbnail || tab.slug}`
            : isCollection
              ? `https://s1.xrpl.to/nft-collection/${tab.logoImage || tab.slug}`
              : `https://s1.xrpl.to/token/${tab.md5}`;
        const label = isAccount ? tab.name : isNft ? tab.name : isCollection ? tab.name : `${tab.name}/XRP`;

        return (
          <a
            key={tabId}
            href={href}
            onClick={(e) => isActive && e.preventDefault()}
            className={cn(
              'flex items-center gap-1.5 px-2.5 h-6 rounded text-[11px] font-medium transition-all shrink-0',
              isActive
                ? 'bg-primary/15 text-primary border border-primary/30'
                : isDark
                  ? 'text-white/50 hover:text-white/80 hover:bg-white/5'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            )}
          >
            <img
              src={imgSrc}
              alt=""
              className={cn('w-3.5 h-3.5 shrink-0 object-cover', isCollection || isNft ? 'rounded' : 'rounded-full')}
              onError={(e) => (e.target.src = '/static/alt.webp')}
            />
            <span className="max-w-[120px] truncate">{label}</span>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                removeTab(tabId);
              }}
              className={cn(
                'ml-0.5 transition-colors opacity-50 hover:opacity-100',
                isActive ? 'text-primary' : isDark ? 'hover:text-white' : 'hover:text-gray-600'
              )}
            >
              <X size={11} />
            </button>
          </a>
        );
      })}

      <div className="flex-1" />

      {/* Right side actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={openSearch}
          title="Add tab"
          className={cn(
            'p-1.5 rounded transition-colors',
            isDark ? 'text-white/50 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
          )}
        >
          <Plus size={14} />
        </button>

        {tabs.length > 1 && (
          <button
            onClick={clearOthers}
            title="Clear other tabs"
            className={cn(
              'p-1.5 rounded transition-colors',
              isDark ? 'text-white/50 hover:text-red-400 hover:bg-white/10' : 'text-gray-400 hover:text-red-500 hover:bg-gray-200'
            )}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]" onClick={() => { setSearchOpen(false); setQuery(''); }}>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            ref={searchRef}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'relative w-full max-w-lg rounded-xl border overflow-hidden',
              isDark ? 'bg-[#0a0f1a] border-blue-500/20 shadow-2xl' : 'bg-white border-gray-200 shadow-2xl'
            )}
          >
            <div className={cn('flex items-center gap-3 px-4 py-3 border-b', isDark ? 'border-blue-500/10' : 'border-gray-100')}>
              <Search size={18} className={isDark ? 'text-white/40' : 'text-gray-400'} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tokens to add..."
                className={cn('flex-1 bg-transparent text-[15px] outline-none', isDark ? 'text-white placeholder:text-white/40' : 'text-gray-900 placeholder:text-gray-400')}
              />
              <button onClick={() => { setSearchOpen(false); setQuery(''); }} className={cn('p-1 rounded', isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100')}>
                <X size={16} className={isDark ? 'text-white/40' : 'text-gray-400'} />
              </button>
            </div>
            <div className="max-h-[480px] overflow-y-auto p-2">
              {/* Tokens Section */}
              {(query ? results.tokens : suggested.tokens).length > 0 && (
                <>
                  <div className="flex items-center gap-3 px-2 py-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap text-primary">Tokens</span>
                    <div className="flex-1 h-[14px]" style={{ backgroundImage: 'radial-gradient(circle, rgba(66,133,244,0.5) 1px, transparent 1px)', backgroundSize: '8px 5px' }} />
                  </div>
                  {(query ? results.tokens : suggested.tokens).map((token) => (
                    <div
                      key={token.md5}
                      onClick={() => handleSelectToken(token)}
                      className={cn('flex items-center gap-3 px-2 py-2.5 rounded-lg cursor-pointer transition-colors', isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-gray-50')}
                    >
                      <img src={`https://s1.xrpl.to/token/${token.md5}`} className="w-9 h-9 rounded-full object-cover" alt="" onError={(e) => (e.target.src = '/static/alt.webp')} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={cn('text-[14px] font-medium', isDark ? 'text-white' : 'text-gray-900')}>{token.user}</span>
                          <span className={cn('text-[12px]', isDark ? 'text-white/30' : 'text-gray-400')}>•</span>
                          <span className={cn('text-[12px]', isDark ? 'text-white/40' : 'text-gray-500')}>({token.name})</span>
                        </div>
                        <p className={cn('text-[11px] font-mono truncate mt-0.5', isDark ? 'text-white/25' : 'text-gray-400')}>{token.issuer}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn('px-2 py-1 text-[10px] font-semibold uppercase rounded', isDark ? 'bg-white/10 text-white/60' : 'bg-gray-100 text-gray-500')}>Token</span>
                        {token.verified && <span className="px-2 py-1 text-[10px] font-semibold uppercase rounded bg-green-500/20 text-green-500">✓</span>}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* NFTs Section */}
              {(query ? results.collections : suggested.collections).length > 0 && (
                <>
                  <div className="flex items-center gap-3 px-2 py-2 mt-1">
                    <span className="text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap text-primary">NFTs</span>
                    <div className="flex-1 h-[14px]" style={{ backgroundImage: 'radial-gradient(circle, rgba(66,133,244,0.5) 1px, transparent 1px)', backgroundSize: '8px 5px' }} />
                  </div>
                  {(query ? results.collections : suggested.collections).map((col) => (
                    <div
                      key={col.slug}
                      onClick={() => handleSelectCollection(col)}
                      className={cn('flex items-center gap-3 px-2 py-2.5 rounded-lg cursor-pointer transition-colors', isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-gray-50')}
                    >
                      <img src={`https://s1.xrpl.to/nft-collection/${col.logoImage}`} className="w-9 h-9 rounded-lg object-cover" alt="" onError={(e) => (e.target.src = '/static/alt.webp')} />
                      <div className="flex-1 min-w-0">
                        <span className={cn('text-[14px] font-medium', isDark ? 'text-white' : 'text-gray-900')}>{col.name}</span>
                        <p className={cn('text-[11px] font-mono truncate mt-0.5', isDark ? 'text-white/25' : 'text-gray-400')}>{col.account}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn('px-2 py-1 text-[10px] font-semibold uppercase rounded', isDark ? 'bg-white/10 text-white/60' : 'bg-gray-100 text-gray-500')}>NFT</span>
                        {col.verified === 'yes' && <span className="px-2 py-1 text-[10px] font-semibold uppercase rounded bg-green-500/20 text-green-500">✓</span>}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {query && !loading && results.tokens.length === 0 && results.collections.length === 0 && (
                <p className={cn('px-4 py-8 text-[13px] text-center', isDark ? 'text-white/40' : 'text-gray-400')}>No results found</p>
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
