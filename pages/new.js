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

function NewTokensPage({ data }) {
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
    <div className="flex-1 overflow-hidden m-0 p-0">
      <Header
        notificationPanelOpen={notificationPanelOpen}
        onNotificationPanelToggle={setNotificationPanelOpen}
      />
      <h1 style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
        New XRPL Tokens
      </h1>

      <div id="back-to-top-anchor" className={notificationPanelOpen ? "mx-auto w-full px-4 mt-4" : "mx-auto max-w-[1920px] px-4 mt-4"}>
        <div className="w-full px-0 py-0">
          <Summary />
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
                initialOrderBy="dateon"
                autoAddNewTokens
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

export default NewTokensPage;

export async function getStaticProps() {
  const data = await getTokens('dateon', 'desc');

  let ret = {};
  if (data) {
    let ogp = {};

    // Enhanced SEO metadata for new tokens page
    ogp.canonical = 'https://xrpl.to/new';
    ogp.title = 'New XRPL Tokens | Latest Launches | XRP Ledger';
    ogp.url = 'https://xrpl.to/new';
    ogp.imgUrl = 'https://xrpl.to/static/ogp.webp';
    ogp.desc =
      'Discover the newest XRPL tokens and latest launches on the XRP Ledger. Stay updated with fresh token listings and emerging projects in the XRP ecosystem.';

    // Additional structured metadata for better SEO
      'new XRPL tokens, latest XRP launches, token launches, new cryptocurrency, fresh tokens, DEX tokens, XRP ecosystem new';
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
    props: ret,
    revalidate: 5 // Revalidate every 5 seconds
  };
}
