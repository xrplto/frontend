import api from 'src/utils/api';
import { performance } from 'perf_hooks';
import { useState, useEffect, useContext } from 'react';

// Components
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
import { ThemeContext } from 'src/context/AppContext';

import TokenList from 'src/TokenList';
import { SummaryTag } from 'src/TokenList/Summary';

function getInitialTokens(data) {
  if (data) return data.tokens;
  return [];
}

function Overview({ data }) {
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [tokens, setTokens] = useState(() => getInitialTokens(data));

  const tMap = new Map();
  for (var t of tokens) {
    tMap.set(t.md5, t);
  }

  return (
    <div className="min-h-screen overflow-hidden">
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
        {data?.tagName || 'Tagged'} XRPL Tokens
      </h1>

      <div id="back-to-top-anchor" className="mx-auto max-w-[1920px] px-4 mt-4">
        <div className="mb-6">
          <SummaryTag tagName={data.tagName} />
        </div>
        <TokenList
          tag={data.tag}
          tagName={data.tagName}
          tags={data.tags}
          tokens={tokens}
          tMap={tMap}
          setTokens={setTokens}
        />
      </div>

      <ScrollToTop />

      <Footer />
    </div>
  );
}

export default Overview;

const BASE_URL = 'https://api.xrpl.to/v1';

export async function getServerSideProps(ctx) {
  // https://api.xrpl.to/v1/tokens?tag=collectables-and-nfts&start=0&limit=20&sortBy=vol24hxrp&sortType=desc&filter=
  let data = null;
  const tag = ctx.params.tag; // Move tag definition outside try block

  try {
    var t1 = performance.now();

    const res = await api.get(
      `${BASE_URL}/tokens?tag=${tag}&start=0&limit=100&sortBy=vol24hxrp&sortType=desc&filter=&tags=yes`
    );

    data = res.data;

    data.tag = tag;

    const time = Date.now();
    for (var token of data.tokens) {
      token.bearbull = token.pro24h < 0 ? -1 : 1;
      token.time = time;
    }
  } catch (e) {
    // Error during getStaticProps
  }
  let ret = {};
  if (data) {
    let ogp = {};

    ogp.canonical = `https://xrpl.to/view/${tag}`;
    ogp.title = `Discover the Most Traded ${data.tagName} XRPL Tokens by Volume`;
    ogp.url = `https://xrpl.to/view/${tag}`;
    ogp.imgUrl = `https://xrpl.to/api/og/view/${tag}`;
    ogp.imgType = 'image/png';
    ogp.desc = `Access today's ${data.tagName} token prices ranked by volume, featuring 24-hour price changes, trading volume, and much more for an insightful overview.`;

    // JSON-LD structured data for tag/category pages
    ogp.jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: ogp.title,
      itemListElement: (data.tokens || []).slice(0, 20).map((token, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'FinancialProduct',
          name: token.name,
          url: `https://xrpl.to/token/${token.slug}`,
          ...(token.exch
            ? {
                offers: {
                  '@type': 'Offer',
                  price: token.exch,
                  priceCurrency: 'XRP'
                }
              }
            : {})
        }
      }))
    };

    ret = { data, ogp };
  }

  return {
    props: ret // will be passed to the page component as props
  };
}

// export async function getServerSideProps(ctx) {
//     // https://api.xrpl.to/v1/tokens?start=0&limit=20&sortBy=vol24hxrp&sortType=desc&filter=&showNew=false&showSlug=false
//     let data = null;
//     try {
//         var t1 = performance.now();

//         const res = await api.get(`${BASE_URL}/tokens?start=0&limit=100&sortBy=vol24hxrp&sortType=desc&filter=&showNew=false&showSlug=false`);

//         data = res.data;

//         var t2 = performance.now();
//         var dt = (t2 - t1).toFixed(2);

//         console.log(`1. getServerSideProps tokens: ${data.tokens.length} took: ${dt}ms`);
//     } catch (e) {
//         console.log(e);
//     }
//     let ret = {};
//     if (data) {
//         let ogp = {};

//         ogp.title = 'XRPL Token Prices, Charts, Market Volume And Activity';
//         ogp.url = 'https://xrpl.to/';
//         ogp.imgUrl = 'https://xrpl.to/og/view.webp';
//         ogp.desc = 'Top XRPL DEX tokens prices and charts, listed by 24h volume. Access to current and historic data for XRP ecosystem. All XRPL tokens automatically listed.';

//         ret = {data, ogp};
//     }

//     return {
//         props: ret, // will be passed to the page component as props
//     }
// }
