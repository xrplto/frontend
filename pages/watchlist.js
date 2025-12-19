import axios from 'axios';
import { performance } from 'perf_hooks';
import { useState, useEffect, useRef, useCallback } from 'react';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Components
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';

import TokenList from 'src/TokenList';
import NFTWatchList from 'src/components/NFTWatchList';
import { Coins, Image, Star, Compass, Plus, Search, X, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { cn } from 'src/utils/cn';

const BASE_URL = 'https://api.xrpl.to/api';

function Overview({ data }) {
  const [tokens, setTokens] = useState([]);
  const [activeTab, setActiveTab] = useState('tokens');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [popularTokens, setPopularTokens] = useState([]);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  const tMap = new Map();
  for (var t of tokens) {
    tMap.set(t.md5, t);
  }

  const { accountProfile, themeName, watchList, setWatchList } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const account = accountProfile?.account;

  // Load popular/trending tokens
  useEffect(() => {
    axios.post(`${BASE_URL}/search`, { search: '' })
      .then(res => setPopularTokens(res.data?.tokens?.slice(0, 6) || []))
      .catch(() => {});
  }, []);

  // Search effect
  useEffect(() => {
    if (!searchQuery || !searchOpen) {
      setSearchResults([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await axios.post(`${BASE_URL}/search`, { search: searchQuery }, { signal: controller.signal });
        setSearchResults(res.data?.tokens?.slice(0, 8) || []);
      } catch {}
      setSearchLoading(false);
    }, 150);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [searchQuery, searchOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    };
    if (searchOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchOpen]);

  const openSearch = useCallback(() => {
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  }, []);

  const addToWatchlist = useCallback((token) => {
    if (!watchList || !setWatchList) return;
    const exists = watchList.some(w => w.md5 === token.md5);
    if (!exists) {
      setWatchList([...watchList, { md5: token.md5, slug: token.slug }]);
    }
    setSearchOpen(false);
    setSearchQuery('');
  }, [watchList, setWatchList]);

  const isInWatchlist = useCallback((md5) => {
    return watchList?.some(w => w.md5 === md5) || false;
  }, [watchList]);

  return (
    <div className="flex min-h-screen flex-col overflow-hidden">
      <div id="back-to-top-anchor" />
      <Header />
      <h1 style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
        Watchlist XRPL Tokens and NFTs
      </h1>

      <div className="mx-auto w-full max-w-[1920px] px-6 py-6">
        {/* Header with tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Star size={20} className="text-primary" />
            <h1 className={cn('text-xl font-medium', isDark ? 'text-white' : 'text-gray-900')}>
              Watchlist
            </h1>
          </div>
          {account && (
            <div className={cn(
              'flex rounded-lg p-1 border-[1.5px]',
              isDark ? 'bg-white/[0.02] border-white/10' : 'bg-black/[0.02] border-black/[0.08]'
            )}>
              <button
                onClick={() => setActiveTab('tokens')}
                className={cn(
                  'flex items-center gap-2 px-4 py-1.5 rounded-md text-[13px] font-normal transition-all',
                  activeTab === 'tokens'
                    ? isDark ? 'bg-white/10 text-white' : 'bg-white text-gray-900 shadow-sm'
                    : isDark ? 'text-white/50 hover:text-white/70' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <Coins size={14} />
                Tokens
              </button>
              <button
                onClick={() => setActiveTab('nfts')}
                className={cn(
                  'flex items-center gap-2 px-4 py-1.5 rounded-md text-[13px] font-normal transition-all',
                  activeTab === 'nfts'
                    ? isDark ? 'bg-white/10 text-white' : 'bg-white text-gray-900 shadow-sm'
                    : isDark ? 'text-white/50 hover:text-white/70' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <Image size={14} />
                NFTs
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        {!account ? (
          <div className={cn(
            'rounded-xl border-[1.5px] p-12 text-center transition-all duration-200 hover:border-primary/30',
            isDark ? 'border-white/10 bg-white/[0.02]' : 'border-black/[0.08] bg-black/[0.02]'
          )}>
            <Star size={32} className={cn('mx-auto mb-3', isDark ? 'text-white/20' : 'text-gray-300')} />
            <p className={cn('text-[15px] mb-1', isDark ? 'text-white/60' : 'text-gray-600')}>
              Track your favorite tokens and NFTs
            </p>
            <p className={cn('text-[13px]', isDark ? 'text-white/40' : 'text-gray-400')}>
              Connect your wallet to manage your watchlist
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'tokens' && (
              <>
                {/* Empty state with Add Assets */}
                {(!watchList || watchList.length === 0) ? (
                  <div className={cn(
                    'rounded-xl border-[1.5px] py-16 px-6 text-center',
                    isDark ? 'border-white/10 bg-white/[0.02]' : 'border-black/[0.08] bg-black/[0.02]'
                  )}>
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                      <Star size={24} className="text-primary" fill="currentColor" />
                    </div>
                    <h2 className={cn('text-lg font-medium mb-2', isDark ? 'text-white' : 'text-gray-900')}>
                      Build your watchlist
                    </h2>
                    <p className={cn('text-[14px] mb-6', isDark ? 'text-white/50' : 'text-gray-500')}>
                      Add assets to your watchlist for a personalized view.
                    </p>
                    <button
                      onClick={openSearch}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-white text-[14px] font-medium hover:bg-primary/90 transition-colors"
                    >
                      Add Assets
                    </button>

                    {/* Popular Assets */}
                    {popularTokens.length > 0 && (
                      <div className="mt-8">
                        <p className={cn('text-[12px] font-medium uppercase tracking-wide mb-3', isDark ? 'text-white/40' : 'text-gray-400')}>
                          Popular Assets
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                          {popularTokens.map((token) => (
                            <button
                              key={token.md5}
                              onClick={() => addToWatchlist(token)}
                              disabled={isInWatchlist(token.md5)}
                              className={cn(
                                'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border-[1.5px] text-[13px] transition-all',
                                isInWatchlist(token.md5)
                                  ? isDark ? 'border-white/5 bg-white/5 text-white/30 cursor-not-allowed' : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : isDark ? 'border-white/10 hover:border-primary/50 hover:bg-primary/5 text-white/70' : 'border-gray-200 hover:border-primary/50 hover:bg-primary/5 text-gray-700'
                              )}
                            >
                              <Plus size={14} className={isInWatchlist(token.md5) ? 'opacity-30' : ''} />
                              <img src={`https://s1.xrpl.to/token/${token.md5}`} className="w-5 h-5 rounded-full" alt="" />
                              <span>{token.user || token.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <button
                        onClick={openSearch}
                        className={cn(
                          'flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-normal transition-all',
                          isDark
                            ? 'text-white/50 hover:text-white hover:bg-white/5'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        )}
                      >
                        <Plus size={14} />
                        Add Assets
                      </button>
                    </div>
                    <TokenList
                      showWatchList={true}
                      hideFilters={true}
                      tags={data?.tags}
                      tokens={tokens}
                      tMap={tMap}
                      setTokens={setTokens}
                    />
                  </div>
                )}
              </>
            )}
            {activeTab === 'nfts' && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Link
                    href="/collections"
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-normal transition-all',
                      isDark
                        ? 'text-white/50 hover:text-white hover:bg-white/5'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <Compass size={14} />
                    Explore Collections
                  </Link>
                </div>
                <NFTWatchList account={account} />
              </div>
            )}
          </>
        )}

        {/* Search Modal */}
        {searchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
            <div
              ref={searchRef}
              className={cn(
                'relative w-full max-w-lg mx-4 rounded-xl border-[1.5px] overflow-hidden',
                isDark ? 'bg-black border-white/10' : 'bg-white border-gray-200 shadow-xl'
              )}
            >
              {/* Search Input */}
              <div className={cn('flex items-center gap-3 px-4 py-3 border-b', isDark ? 'border-white/10' : 'border-gray-200')}>
                <Search size={18} className={isDark ? 'text-white/40' : 'text-gray-400'} />
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tokens..."
                  className={cn(
                    'flex-1 bg-transparent text-[15px] outline-none',
                    isDark ? 'text-white placeholder:text-white/40' : 'text-gray-900 placeholder:text-gray-400'
                  )}
                />
                <button onClick={() => setSearchOpen(false)} className={cn('p-1 rounded', isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100')}>
                  <X size={18} className={isDark ? 'text-white/40' : 'text-gray-400'} />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-[400px] overflow-y-auto">
                {searchLoading && (
                  <div className={cn('px-4 py-8 text-center text-[13px]', isDark ? 'text-white/40' : 'text-gray-400')}>
                    Searching...
                  </div>
                )}

                {!searchLoading && searchQuery && searchResults.length === 0 && (
                  <div className={cn('px-4 py-8 text-center text-[13px]', isDark ? 'text-white/40' : 'text-gray-400')}>
                    No tokens found
                  </div>
                )}

                {!searchLoading && searchResults.length > 0 && (
                  <div className="py-2">
                    {searchResults.map((token) => (
                      <button
                        key={token.md5}
                        onClick={() => addToWatchlist(token)}
                        disabled={isInWatchlist(token.md5)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-3 transition-colors',
                          isInWatchlist(token.md5)
                            ? isDark ? 'bg-white/5 cursor-not-allowed' : 'bg-gray-50 cursor-not-allowed'
                            : isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                        )}
                      >
                        <img src={`https://s1.xrpl.to/token/${token.md5}`} className="w-10 h-10 rounded-full" alt="" />
                        <div className="flex-1 text-left">
                          <p className={cn('text-[14px] font-medium', isDark ? 'text-white' : 'text-gray-900')}>{token.user || token.name}</p>
                          <p className={cn('text-[12px]', isDark ? 'text-white/40' : 'text-gray-500')}>{token.name}</p>
                        </div>
                        {isInWatchlist(token.md5) ? (
                          <span className={cn('text-[11px] px-2 py-1 rounded', isDark ? 'bg-white/10 text-white/50' : 'bg-gray-200 text-gray-500')}>
                            Added
                          </span>
                        ) : (
                          <Plus size={18} className={isDark ? 'text-white/40' : 'text-gray-400'} />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Show popular when no query */}
                {!searchQuery && popularTokens.length > 0 && (
                  <div className="py-2">
                    <p className={cn('px-4 py-2 text-[11px] font-medium uppercase tracking-wide', isDark ? 'text-white/30' : 'text-gray-400')}>
                      <TrendingUp size={12} className="inline mr-1" />
                      Popular
                    </p>
                    {popularTokens.map((token) => (
                      <button
                        key={token.md5}
                        onClick={() => addToWatchlist(token)}
                        disabled={isInWatchlist(token.md5)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-3 transition-colors',
                          isInWatchlist(token.md5)
                            ? isDark ? 'bg-white/5 cursor-not-allowed' : 'bg-gray-50 cursor-not-allowed'
                            : isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                        )}
                      >
                        <img src={`https://s1.xrpl.to/token/${token.md5}`} className="w-10 h-10 rounded-full" alt="" />
                        <div className="flex-1 text-left">
                          <p className={cn('text-[14px] font-medium', isDark ? 'text-white' : 'text-gray-900')}>{token.user || token.name}</p>
                          <p className={cn('text-[12px]', isDark ? 'text-white/40' : 'text-gray-500')}>{token.name}</p>
                        </div>
                        {isInWatchlist(token.md5) ? (
                          <span className={cn('text-[11px] px-2 py-1 rounded', isDark ? 'bg-white/10 text-white/50' : 'bg-gray-200 text-gray-500')}>
                            Added
                          </span>
                        ) : (
                          <Plus size={18} className={isDark ? 'text-white/40' : 'text-gray-400'} />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <ScrollToTop />
      <Footer />
    </div>
  );
}

export default Overview;

// This function gets called at build time on server-side.
// It may be called again, on a serverless function, if
// revalidation is enabled and a new request comes in
export async function getStaticProps() {
  // https://api.xrpl.to/api/tags

  let data = null;
  try {
    var t1 = performance.now();

    const res = await axios.get(`${BASE_URL}/tags`);

    data = res.data;

    var t2 = performance.now();
    var dt = (t2 - t1).toFixed(2);

  } catch (e) {
  }
  let ret = {};
  if (data) {
    let ogp = {};

    ogp.canonical = 'https://xrpl.to/watchlist';
    ogp.title = 'Create a Watchlist: Track Your Favorite XRPL Tokens and NFTs';
    ogp.url = 'https://xrpl.to/watchlist';
    ogp.imgUrl = 'https://xrpl.to/static/ogp.webp';
    ogp.desc =
      'Create a custom XRPL watchlist: Track your favorite tokens and NFT collections, monitor the latest prices, and stay updated on popular XRPL assets.';

    ret = { data, ogp };
  }

  return {
    props: ret, // will be passed to the page component as props
    // Next.js will attempt to re-generate the page:
    // - When a request comes in
    // - At most once every 10 seconds
    revalidate: 10 // In seconds
  };
}
