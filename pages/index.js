import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getTokens, getSummaryTokens } from 'src/utils/formatters';
import { cn } from 'src/utils/cn';

// Import all components directly
import Header from 'src/components/Header';
import TokenList from 'src/TokenList';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
import Summary from 'src/TokenList/Summary';
import Logo from 'src/components/Logo';
import { useContext } from 'react';
import { ThemeContext } from 'src/context/AppContext';

const OverviewWrapper = ({ className, ...props }) => (
  <div className={cn('overflow-x-clip w-full max-w-[100vw] min-h-screen m-0 p-0', className)} {...props} />
);

function getInitialTokens(data) {
  if (data) return data.tokens;
  return [];
}

function MaintenanceView({ isDark }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <Logo style={{ width: '120px', height: '42px', margin: '0 auto' }} />
        <div className="text-center mt-6">
          <h1
            className={cn('text-3xl font-normal mb-4', isDark ? 'text-primary' : 'text-blue-600')}
          >
            Under Maintenance
          </h1>
          <p className={cn('text-base mb-2', isDark ? 'text-white/70' : 'text-gray-600')}>
            We're currently performing some updates to improve our service.
          </p>
          <p className={cn('text-base', isDark ? 'text-white/70' : 'text-gray-600')}>
            Please check back soon.
          </p>
        </div>
      </div>
    </div>
  );
}

function Overview({ data, summaryTokens }) {
  const [tokens, setTokens] = useState(() => getInitialTokens(data));
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const tMap = useMemo(() => {
    const map = new Map();
    for (const t of tokens) {
      map.set(t.md5, t);
    }
    return map;
  }, [tokens]);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 600);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const MAINTENANCE_MODE = false; // Set to false to show normal view

  // Add this function to handle safe navigation
  const handleNavigation = (path) => {
    if (router.asPath !== path) {
      router.push(path);
    }
  };

  if (MAINTENANCE_MODE) {
    return <MaintenanceView isDark={isDark} />;
  }

  return (
    <OverviewWrapper>
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
        XRPL Tokens Analytics & Trading Platform
      </h1>

      <main role="main">
      <div
        id="back-to-top-anchor"
        className="mx-auto max-w-[1920px] px-4 mt-4"
      >
        <Summary tokens={tokens} trendingTokens={summaryTokens?.trendingTokens} newTokens={summaryTokens?.newTokens} />
      </div>

      <section aria-label="Token list" className="mx-auto max-w-[1920px] px-4">
        <div className="flex flex-col">
          <div className="w-full">
            {data && data.tags ? (
              <>
                <TokenList tags={data.tags} tokens={tokens} tMap={tMap} setTokens={setTokens} />
              </>
            ) : (
              <></>
            )}
          </div>
        </div>
      </section>
      </main>

      <ScrollToTop />
      <Footer />
    </OverviewWrapper>
  );
}

export default Overview;

export async function getServerSideProps({ req, res }) {
  const isDataReq = req.url?.includes('/_next/data/');
  res.setHeader(
    'Cache-Control',
    isDataReq
      ? 'private, no-cache, no-store, must-revalidate'
      : 'public, s-maxage=30, stale-while-revalidate=120'
  );

  // Fetch only 50 tokens initially to reduce page data size
  const [data, summaryTokens] = await Promise.all([
    getTokens('vol24hxrp', 'desc', 'yes', false, false, 50),
    getSummaryTokens()
  ]);

  let ret = {};
  if (data) {
    let ogp = {};

    ogp.canonical = 'https://xrpl.to';
    ogp.title = 'XRP Ledger Tokens - Live Prices, Charts & Trading Data | XRPL.to';
    ogp.url = 'https://xrpl.to/';
    ogp.imgUrl = 'https://xrpl.to/api/og/index';
    ogp.imgType = 'image/png';
    ogp.desc =
      'Discover XRP Ledger tokens with live prices, market cap, 24h volume & trading charts. Track XRPL DeFi tokens, compare performance & find new opportunities on XRP Ledger.';

    ogp.keywords =
      'XRP Ledger, XRPL tokens, XRP tokens, cryptocurrency prices, DeFi tokens, crypto charts, market cap, trading volume, XRP ecosystem, digital assets, blockchain tokens, altcoins';
    ogp.type = 'website';
    ogp.siteName = 'XRPL.to';
    ogp.locale = 'en_US';

    ogp.twitterCard = 'summary_large_image';
    ogp.twitterCreator = '@xrplto';

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

    ret = { data, ogp, summaryTokens };
  }

  return {
    props: ret
  };
}
