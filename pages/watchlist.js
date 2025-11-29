import axios from 'axios';
import { performance } from 'perf_hooks';
import { useState } from 'react';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Components
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';

import TokenList from 'src/TokenList';
import NFTWatchList from 'src/components/NFTWatchList';
import { Coins, Image, Star } from 'lucide-react';
import { cn } from 'src/utils/cn';

function Overview({ data }) {
  const [tokens, setTokens] = useState([]);
  const [activeTab, setActiveTab] = useState('tokens');

  const tMap = new Map();
  for (var t of tokens) {
    tMap.set(t.md5, t);
  }

  const { accountProfile, themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const account = accountProfile?.account;

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
              'flex rounded-lg p-1',
              isDark ? 'bg-white/5' : 'bg-gray-100'
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
            'rounded-xl border-[1.5px] p-12 text-center',
            isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-gray-50'
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
              <TokenList
                showWatchList={true}
                hideFilters={true}
                tags={data.tags}
                tokens={tokens}
                tMap={tMap}
                setTokens={setTokens}
              />
            )}
            {activeTab === 'nfts' && (
              <NFTWatchList account={account} />
            )}
          </>
        )}
      </div>

      <ScrollToTop />
      <Footer />
    </div>
  );
}

export default Overview;

const BASE_URL = process.env.API_URL;

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
