import axios from 'axios';
import { performance } from 'perf_hooks';
import { useState, useEffect } from 'react';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Components
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';

import TokenList from 'src/TokenList';
import { SummaryWatchList } from 'src/TokenList/Summary';

function Overview({ data }) {
  const [tokens, setTokens] = useState([]);

  const tMap = new Map();
  for (var t of tokens) {
    tMap.set(t.md5, t);
  }

  const { accountProfile, openSnackbar, setLoading } = useContext(AppContext);

  const account = accountProfile?.account;

  return (
    <div className="flex min-h-screen flex-col overflow-hidden">
      <div id="back-to-top-anchor" />
      <Header />
      <h1 style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
        Watchlist XRPL Tokens
      </h1>

      <div className="mx-auto w-full max-w-[1920px] px-6">
        <div className="flex flex-col gap-6">
          <div className="w-full lg:w-2/3">
            <SummaryWatchList />
          </div>
          <div className="w-full">
            {account && (
              <TokenList
                showWatchList={true}
                tags={data.tags}
                tokens={tokens}
                tMap={tMap}
                setTokens={setTokens}
              />
            )}
          </div>
        </div>
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
    ogp.title = 'Create a Watchlist: Track Your Favorite XRPL Tokens with Ease';
    ogp.url = 'https://xrpl.to/watchlist';
    ogp.imgUrl = 'https://xrpl.to/static/ogp.webp';
    ogp.desc =
      'Create a custom XRPL token watchlist: Choose from all XRP Ledger tokens, track the latest prices, and stay updated on popular tokens like SOLO, CORE, CSC, and xSPECTAR.';

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
