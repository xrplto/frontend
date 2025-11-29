import { useState, useMemo, useContext, useEffect } from 'react';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import TokenList from 'src/TokenList';
import ScrollToTop from 'src/components/ScrollToTop';
import Summary from 'src/TokenList/Summary';
import { useRouter } from 'next/router';
import { getTokens } from 'src/utils/formatters';
import { AppContext } from 'src/AppContext';

function getInitialTokens(data) {
  if (data) return data.tokens;
  return [];
}

function TrendingPage({ data }) {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [tokens, setTokens] = useState(() => getInitialTokens(data));
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const tMap = useMemo(() => {
    const map = new Map();
    for (const t of tokens) {
      map.set(t.md5, t);
    }
    return map;
  }, [tokens]);

  const router = useRouter();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 600);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen overflow-hidden m-0 p-0">
      {!isMobile && <div id="back-to-top-anchor" className="h-6" />}
      <Header
        notificationPanelOpen={notificationPanelOpen}
        onNotificationPanelToggle={setNotificationPanelOpen}
      />
      <h1 style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
        Trending XRPL Tokens
      </h1>

      <div className={notificationPanelOpen ? "mx-auto w-full px-4" : "mx-auto max-w-7xl px-4"}>
        <div className="w-full px-0 py-0 mt-0 mb-0 md:-mt-px">
          <Summary />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4">
        <div>
          {data && data.tags ? (
            <>
              <TokenList
                tags={data.tags}
                tokens={tokens}
                tMap={tMap}
                setTokens={setTokens}
                initialOrderBy="trendingScore"
              />
            </>
          ) : (
            <></>
          )}
        </div>
      </div>

      <ScrollToTop />
      <Footer />
    </div>
  );
}

export default TrendingPage;

export async function getStaticProps() {
  const data = await getTokens('trendingScore', 'desc');

  let ret = {};
  if (data) {
    let ogp = {};

    // Enhanced SEO metadata for trending page
    ogp.canonical = 'https://xrpl.to/trending';
    ogp.title = 'Trending XRPL Tokens | Real-Time Charts & Market Data | XRP Ledger';
    ogp.url = 'https://xrpl.to/trending';
    ogp.imgUrl = 'https://s1.xrpl.to/ogp/trending.webp';
    ogp.desc =
      'Discover trending XRPL tokens with real-time price charts and market activity. Track the hottest tokens by trending score on the XRP Ledger ecosystem updated in real-time.';

    // ItemList structured data
    const itemListSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: (data.tokens || []).slice(0, 20).map((token, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'FinancialProduct',
          name: token.name,
          url: `https://xrpl.to/token/${token.slug}`,
          offers: token.exch ? {
            '@type': 'Offer',
            price: token.exch,
            priceCurrency: 'XRP'
          } : undefined
        }
      }))
    };
    ogp.jsonLd = itemListSchema;

    ret = { data, ogp };
  }

  return {
    props: ret,
    revalidate: 5 // Revalidate every 5 seconds
  };
}
