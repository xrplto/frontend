import { useState, useMemo, useContext, useEffect } from 'react';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import TokenList from 'src/TokenList';
import ScrollToTop from 'src/components/ScrollToTop';
import Summary from 'src/TokenList/Summary';
import { useRouter } from 'next/router';
import { getTokens } from 'src/utils/formatters';
import { ThemeContext } from 'src/context/AppContext';

function getInitialTokens(data) {
  if (data) return data.tokens;
  return [];
}

function MostViewedPage({ data }) {
  const { themeName } = useContext(ThemeContext);
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
      <Header
        notificationPanelOpen={notificationPanelOpen}
        onNotificationPanelToggle={setNotificationPanelOpen}
      />
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
        Most Viewed XRPL Tokens
      </h1>

      <div
        id="back-to-top-anchor"
        className={
          notificationPanelOpen ? 'mx-auto w-full px-4 mt-4' : 'mx-auto max-w-[1920px] px-4 mt-4'
        }
      >
        <div className="w-full px-0 py-0">
          <Summary mostViewedTokens={data?.tokens?.slice(0, 5)} />
        </div>
      </div>

      <div className="mx-auto max-w-[1920px] px-4">
        <div>
          {data && data.tags ? (
            <>
              <TokenList
                tags={data.tags}
                tokens={tokens}
                tMap={tMap}
                setTokens={setTokens}
                initialOrderBy="nginxScore"
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

export default MostViewedPage;

export async function getServerSideProps({ res }) {
  res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=120');
  const data = await getTokens('nginxScore', 'desc');

  let ret = {};
  if (data) {
    let ogp = {};

    // Enhanced SEO metadata for most viewed page
    ogp.canonical = 'https://xrpl.to/most-viewed';
    ogp.title = 'Most Viewed XRPL Tokens | Popular & Trending | XRP Ledger';
    ogp.url = 'https://xrpl.to/most-viewed';
    ogp.imgUrl = 'https://xrpl.to/api/og/most-viewed';
    ogp.imgType = 'image/png';
    ogp.desc =
      'Explore the most viewed XRPL tokens with highest community interest. Discover popular tokens getting the most attention on the XRP Ledger ecosystem.';

    // Additional structured metadata for better SEO
    ('most viewed XRPL tokens, popular XRP tokens, community interest, token popularity, crypto views, DEX tokens, XRP ecosystem popular');
    ogp.type = 'website';
    ogp.siteName = 'XRPL.to';
    ogp.locale = 'en_US';

    // Twitter card metadata
    ogp.twitterCard = 'summary_large_image';
    ogp.twitterCreator = '@xrplto';

    // ItemList structured data
    const itemListSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: (data.tokens || []).slice(0, 20).map((token, index) => {
        const item = {
          '@type': 'FinancialProduct',
          name: token.name,
          url: `https://xrpl.to/token/${token.slug}`
        };
        if (token.exch) {
          item.offers = {
            '@type': 'Offer',
            price: token.exch,
            priceCurrency: 'XRP'
          };
        }
        return {
          '@type': 'ListItem',
          position: index + 1,
          item
        };
      })
    };
    ogp.jsonLd = itemListSchema;

    ret = { data, ogp };
  }

  return {
    props: ret
  };
}
