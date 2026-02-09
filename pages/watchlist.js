import api from 'src/utils/api';
import { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { AppContext } from 'src/context/AppContext';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
import TokenList from 'src/TokenList';
import NFTWatchList from 'src/components/NFTWatchList';
import { Coins, Image, Bookmark, Plus, Search, X, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { cn } from 'src/utils/cn';

const BASE_URL = 'https://api.xrpl.to/v1';

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
    api
      .post(`${BASE_URL}/search`, { search: '' })
      .then((res) => setPopularTokens(res.data?.tokens?.slice(0, 6) || []))
      .catch(() => { });
  }, []);

  // Auto-populate watchlist with user's held tokens when account loads and watchlist is empty
  useEffect(() => {
    if (!account || !setWatchList || (watchList && watchList.length > 0)) return;
    api
      .get(`${BASE_URL}/account/${account}/assets`)
      .then((res) => {
        const heldTokens = res.data?.tokens || [];
        if (heldTokens.length > 0) {
          setWatchList(heldTokens.map((t) => ({ md5: t.md5, slug: t.slug })));
        }
      })
      .catch(() => { });
  }, [account, watchList, setWatchList]);

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
        const res = await api.post(
          `${BASE_URL}/search`,
          { search: searchQuery },
          { signal: controller.signal }
        );
        setSearchResults(res.data?.tokens?.slice(0, 8) || []);
      } catch { }
      setSearchLoading(false);
    }, 150);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, searchOpen]);

  // Click outside + ESC to close
  useEffect(() => {
    if (!searchOpen) return;
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSearchOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [searchOpen]);

  const openSearch = useCallback(() => {
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  }, []);

  const addToWatchlist = useCallback(
    (token) => {
      if (!watchList || !setWatchList) return;
      const exists = watchList.some((w) => w.md5 === token.md5);
      if (!exists) {
        setWatchList([...watchList, { md5: token.md5, slug: token.slug }]);
      }
      setSearchOpen(false);
      setSearchQuery('');
    },
    [watchList, setWatchList]
  );

  const isInWatchlist = useCallback(
    (md5) => {
      return watchList?.some((w) => w.md5 === md5) || false;
    },
    [watchList]
  );

  return (
    <div className="flex min-h-screen flex-col overflow-hidden">
      <div id="back-to-top-anchor" />
      <Header />
      <h1
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          whiteSpace: 'nowrap',
          border: 0
        }}
      >
        Watchlist XRPL Tokens and NFTs
      </h1>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
        }
      `}</style>

      <div className="mx-auto w-full max-w-[1920px] px-6 py-6 flex-1">
        {/* Header with tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Bookmark size={18} className="text-primary fill-primary/20" />
              <span className={cn('text-[12px] font-semibold uppercase tracking-[0.15em]', isDark ? 'text-primary' : 'text-primary')}>
                Personalized
              </span>
            </div>
            <h1 className={cn('text-3xl font-bold tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>
              Your Watchlist
            </h1>
          </div>

          {account && (
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('tokens')}
                  className={cn(
                    'inline-flex items-center gap-2 px-4 py-2.5 rounded-md border text-[12px] font-medium tracking-[0.05em] uppercase transition-all',
                    activeTab === 'tokens'
                      ? isDark
                        ? 'border-white/20 text-white'
                        : 'border-black/20 text-gray-900'
                      : isDark
                        ? 'border-white/10 text-white/40 hover:border-white/15 hover:text-white/70'
                        : 'border-black/10 text-black/40 hover:border-black/15 hover:text-black/60'
                  )}
                >
                  <Coins size={16} />
                  Tokens
                </button>
                <button
                  onClick={() => setActiveTab('nfts')}
                  className={cn(
                    'inline-flex items-center gap-2 px-4 py-2.5 rounded-md border text-[12px] font-medium tracking-[0.05em] uppercase transition-all',
                    activeTab === 'nfts'
                      ? isDark
                        ? 'border-white/20 text-white'
                        : 'border-black/20 text-gray-900'
                      : isDark
                        ? 'border-white/10 text-white/40 hover:border-white/15 hover:text-white/70'
                        : 'border-black/10 text-black/40 hover:border-black/15 hover:text-black/60'
                  )}
                >
                  <Image size={16} />
                  NFTs
                </button>
              </div>
              {activeTab === 'tokens' && watchList?.length > 0 && (
                <button
                  onClick={openSearch}
                  className={cn(
                    'inline-flex items-center gap-2 px-4 py-2.5 rounded-md border text-[12px] font-medium tracking-[0.05em] uppercase transition-all',
                    isDark
                      ? 'border-white/10 text-white/40 hover:border-white/15 hover:text-white/70'
                      : 'border-black/10 text-black/40 hover:border-black/15 hover:text-black/60'
                  )}
                >
                  <Plus size={16} />
                  Add
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        {!account ? (
          <div
            className={cn(
              'relative overflow-hidden rounded-3xl border-[1.5px] p-16 text-center group',
              isDark ? 'border-white/10 bg-white/[0.02]' : 'border-black/[0.08] bg-black/[0.02]'
            )}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-primary/10 blur-[120px] -z-10" />

            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 mb-8 border border-primary/20 shadow-[0_0_40px_rgba(var(--primary-rgb),0.1)]">
              <Bookmark
                size={40}
                className="text-primary"
                fill="currentColor"
                fillOpacity={0.2}
              />
            </div>
            <h2 className={cn('text-2xl font-bold mb-3 tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>
              Track Your Assets
            </h2>
            <p className={cn('text-[16px] mb-8 max-w-sm mx-auto leading-relaxed', isDark ? 'text-white/50' : 'text-gray-600')}>
              Connect your wallet to start building a personalized watchlist of XRPL tokens and NFT collections.
            </p>
            <div className="flex justify-center">
              {/* We assume there's a login button in the Header or a global login trigger */}
              <p className={cn('text-[13px] font-medium px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20')}>
                Please connect your wallet to continue
              </p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'tokens' && (
              <>
                {/* Empty state with Add Assets */}
                {!watchList || watchList.length === 0 ? (
                  <div
                    className={cn(
                      'relative overflow-hidden rounded-3xl border-[1.5px] py-20 px-6 text-center group',
                      isDark
                        ? 'border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent'
                        : 'border-black/[0.08] bg-gradient-to-b from-black/[0.02] to-transparent'
                    )}
                  >
                    {/* Decorative elements */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-primary/20 blur-[100px] -z-10 group-hover:bg-primary/30 transition-all duration-700" />

                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6 group-hover:scale-110 transition-transform duration-500">
                      <Bookmark size={32} className="text-primary" fill="currentColor" fillOpacity={0.2} />
                    </div>
                    <h2
                      className={cn(
                        'text-2xl font-bold mb-3 tracking-tight',
                        isDark ? 'text-white' : 'text-gray-900'
                      )}
                    >
                      Build Your Watchlist
                    </h2>
                    <p
                      className={cn('text-[15px] mb-8 max-w-sm mx-auto leading-relaxed', isDark ? 'text-white/50' : 'text-gray-500')}
                    >
                      Keep track of your favorite XRPL assets in one place. Add tokens and NFTs to monitor their latest updates.
                    </p>
                    <button
                      onClick={openSearch}
                      className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-white text-[15px] font-bold hover:bg-primary/90 shadow-[0_8px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.3)] transition-all active:scale-95"
                    >
                      <Plus size={18} strokeWidth={2.5} />
                      Add Assets
                    </button>

                    {/* Popular Assets */}
                    {popularTokens.length > 0 && (
                      <div className="mt-16">
                        <div className="flex items-center justify-center gap-3 mb-6">
                          <div className={cn('h-[1px] w-8', isDark ? 'bg-white/10' : 'bg-black/10')} />
                          <p className={cn('text-[11px] font-bold uppercase tracking-[0.2em]', isDark ? 'text-white/30' : 'text-gray-400')}>
                            Suggested Assets
                          </p>
                          <div className={cn('h-[1px] w-8', isDark ? 'bg-white/10' : 'bg-black/10')} />
                        </div>
                        <div className="flex flex-wrap justify-center gap-3">
                          {popularTokens.map((token) => (
                            <button
                              key={token.md5}
                              onClick={() => addToWatchlist(token)}
                              disabled={isInWatchlist(token.md5)}
                              className={cn(
                                'group/btn inline-flex items-center gap-3 px-4 py-2 rounded-xl border-[1.5px] text-[14px] font-semibold transition-all duration-300',
                                isInWatchlist(token.md5)
                                  ? isDark
                                    ? 'border-white/5 bg-white/5 text-white/30 cursor-not-allowed'
                                    : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : isDark
                                    ? 'border-white/10 bg-white/[0.02] hover:border-primary/50 hover:bg-primary/5 text-white/70 hover:text-primary'
                                    : 'border-black/[0.05] bg-black/[0.01] hover:border-primary/50 hover:bg-primary/5 text-gray-700 hover:text-primary'
                              )}
                            >
                              <img
                                src={`https://s1.xrpl.to/token/${token.md5}`}
                                className="w-6 h-6 rounded-full ring-2 ring-transparent group-hover/btn:ring-primary/20 transition-all"
                                alt=""
                              />
                              <span>{token.user || token.name}</span>
                              {!isInWatchlist(token.md5) && (
                                <Plus size={14} className="opacity-40 group-hover/btn:opacity-100 transition-opacity" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className={cn(
                      'rounded-3xl border overflow-hidden',
                      isDark ? 'border-white/10 bg-black/20' : 'border-black/[0.05] bg-white shadow-xl shadow-black/[0.02]'
                    )}>
                      <TokenList
                        showWatchList={true}
                        hideFilters={true}
                        tags={data?.tags}
                        tokens={tokens}
                        tMap={tMap}
                        setTokens={setTokens}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
            {activeTab === 'nfts' && (
              <div className="space-y-6">
                <NFTWatchList account={account} />
              </div>
            )}
          </>
        )}

        {/* Search Modal */}
        {searchOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
              onClick={() => setSearchOpen(false)}
            />
            <div
              ref={searchRef}
              className={cn(
                'relative w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden transform transition-all duration-300 scale-100',
                isDark ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-black/5'
              )}
            >
              {/* Search Header */}
              <div
                className={cn(
                  'flex items-center gap-4 px-6 py-5 border-b',
                  isDark ? 'border-white/10' : 'border-black/5'
                )}
              >
                <div className="p-2 rounded-xl bg-primary/10">
                  <Search size={22} className="text-primary" strokeWidth={2.5} />
                </div>
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for tokens (e.g. XRP, SOLO...)"
                  className={cn(
                    'flex-1 bg-transparent text-[16px] font-medium outline-none',
                    isDark
                      ? 'text-white placeholder:text-white/20'
                      : 'text-gray-900 placeholder:text-gray-400'
                  )}
                />
                <button
                  onClick={() => setSearchOpen(false)}
                  className={cn('p-2.5 rounded-xl transition-all', isDark ? 'bg-white/5 hover:bg-white/10 text-white/40' : 'bg-black/5 hover:bg-black/10 text-gray-500')}
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>

              {/* Results Container */}
              <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                {searchLoading && (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
                    <p className={cn('text-[13px] font-medium', isDark ? 'text-white/40' : 'text-gray-400')}>
                      Scanning XRPL...
                    </p>
                  </div>
                )}

                {!searchLoading && searchQuery && searchResults.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                    <div className={cn('w-12 h-12 rounded-full flex items-center justify-center mb-4', isDark ? 'bg-white/5' : 'bg-black/5')}>
                      <Search size={24} className={isDark ? 'text-white/20' : 'text-gray-300'} />
                    </div>
                    <p className={cn('text-[15px] font-bold mb-1', isDark ? 'text-white' : 'text-gray-900')}>
                      No results found
                    </p>
                    <p className={cn('text-[13px]', isDark ? 'text-white/40' : 'text-gray-500')}>
                      Try searching for a different token name or symbol
                    </p>
                  </div>
                )}

                {!searchLoading && searchResults.length > 0 && (
                  <div className="p-2">
                    <p className={cn('px-4 py-2 text-[11px] font-bold uppercase tracking-[0.15em] mb-1', isDark ? 'text-white/20' : 'text-gray-400')}>
                      Search Results
                    </p>
                    {searchResults.map((token) => (
                      <button
                        key={token.md5}
                        onClick={() => addToWatchlist(token)}
                        disabled={isInWatchlist(token.md5)}
                        className={cn(
                          'w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all mb-1 group',
                          isInWatchlist(token.md5)
                            ? 'opacity-60 cursor-not-allowed'
                            : isDark
                              ? 'hover:bg-white/5'
                              : 'hover:bg-gray-50'
                        )}
                      >
                        <div className="relative">
                          <img
                            src={`https://s1.xrpl.to/token/${token.md5}`}
                            className="w-11 h-11 rounded-full ring-2 ring-transparent group-hover:ring-primary/20 transition-all"
                            alt=""
                          />
                          {isInWatchlist(token.md5) && (
                            <div className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5 border-2 border-[#0A0A0A]">
                              <Bookmark size={8} className="text-white fill-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className={cn('text-[15px] font-bold', isDark ? 'text-white' : 'text-gray-900')}>
                              {token.user || token.name}
                            </span>
                            <span className={cn('text-[11px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider', isDark ? 'bg-white/10 text-white/50' : 'bg-black/5 text-gray-500')}>
                              {token.name}
                            </span>
                          </div>
                          <p className={cn('text-[12px] mt-0.5', isDark ? 'text-white/40' : 'text-gray-500')}>
                            {token.issuer || 'Verified Issuer'}
                          </p>
                        </div>
                        {!isInWatchlist(token.md5) && (
                          <div className={cn('p-2 rounded-xl transition-all group-hover:bg-primary/10 group-hover:text-primary', isDark ? 'bg-white/5 text-white/20' : 'bg-black/5 text-gray-400')}>
                            <Plus size={18} strokeWidth={2.5} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Show popular when no query */}
                {!searchQuery && popularTokens.length > 0 && (
                  <div className="p-2">
                    <p className={cn('px-4 py-2 text-[11px] font-bold uppercase tracking-[0.15em] mb-1 flex items-center gap-2', isDark ? 'text-white/20' : 'text-gray-400')}>
                      <TrendingUp size={14} className="text-primary" />
                      Trending on XRPL
                    </p>
                    {popularTokens.map((token) => (
                      <button
                        key={token.md5}
                        onClick={() => addToWatchlist(token)}
                        disabled={isInWatchlist(token.md5)}
                        className={cn(
                          'w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all mb-1 group',
                          isInWatchlist(token.md5)
                            ? 'opacity-60 cursor-not-allowed'
                            : isDark
                              ? 'hover:bg-white/5'
                              : 'hover:bg-gray-50'
                        )}
                      >
                        <div className="relative">
                          <img
                            src={`https://s1.xrpl.to/token/${token.md5}`}
                            className="w-11 h-11 rounded-full ring-2 ring-transparent group-hover:ring-primary/20 transition-all"
                            alt=""
                          />
                          {isInWatchlist(token.md5) && (
                            <div className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5 border-2 border-[#0A0A0A]">
                              <Bookmark size={8} className="text-white fill-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className={cn('text-[15px] font-bold', isDark ? 'text-white' : 'text-gray-900')}>
                              {token.user || token.name}
                            </span>
                            <span className={cn('text-[11px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider', isDark ? 'bg-white/10 text-white/50' : 'bg-black/5 text-gray-500')}>
                              {token.name}
                            </span>
                          </div>
                          <p className={cn('text-[12px] mt-0.5', isDark ? 'text-white/40' : 'text-gray-500')}>
                            Suggested for you
                          </p>
                        </div>
                        {!isInWatchlist(token.md5) && (
                          <div className={cn('p-2 rounded-xl transition-all group-hover:bg-primary/10 group-hover:text-primary', isDark ? 'bg-white/5 text-white/20' : 'bg-black/5 text-gray-400')}>
                            <Plus size={18} strokeWidth={2.5} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Search Footer */}
              <div className={cn(
                'px-6 py-4 flex items-center justify-between border-t',
                isDark ? 'border-white/10 bg-white/[0.02]' : 'border-black/5 bg-black/[0.01]'
              )}>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <kbd className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold', isDark ? 'bg-white/10 text-white/50' : 'bg-black/5 text-gray-500')}>ESC</kbd>
                    <span className={cn('text-[11px]', isDark ? 'text-white/30' : 'text-gray-400')}>to close</span>
                  </div>
                </div>
                <div className={cn('text-[11px] italic', isDark ? 'text-white/20' : 'text-gray-400')}>
                  Data provided by XRPL.to API
                </div>
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
  let data = null;
  try {
    const res = await api.get(`${BASE_URL}/tags`);
    data = res.data;
  } catch { }
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
