import { useState, useMemo, useEffect } from 'react';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import TokenList from 'src/TokenList';
import ScrollToTop from 'src/components/ScrollToTop';
import Summary from 'src/TokenList/Summary';
import { getTokens } from 'src/utils/formatters';
import { cn } from 'src/utils/cn';

const OverviewWrapper = ({ className, ...props }) => (
  <div className={cn('overflow-x-clip w-full max-w-[100vw] min-h-screen m-0 p-0', className)} {...props} />
);

function getInitialTokens(data) {
  if (data) return data.tokens;
  return [];
}

function GainersPage({ data, period, sortBy }) {
  const [tokens, setTokens] = useState(() => getInitialTokens(data));
  const tMap = useMemo(() => {
    const map = new Map();
    for (const t of tokens) {
      map.set(t.md5, t);
    }
    return map;
  }, [tokens]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 600);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <OverviewWrapper>
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
        Top Gaining XRPL Tokens
      </h1>

      <div id="back-to-top-anchor" className="mx-auto max-w-[1920px] px-0 md:px-4 mt-4">
        <div className="w-full px-0 py-0">
          <Summary />
        </div>
      </div>

      <div className="mx-auto max-w-[1920px] px-4">
        <div className="flex flex-col">
          <div className="w-full">
            {data && data.tags ? (
              <>
                <TokenList tags={data.tags} tokens={tokens} tMap={tMap} setTokens={setTokens} initialOrderBy={sortBy} />
              </>
            ) : (
              <></>
            )}
          </div>
        </div>
      </div>

      <ScrollToTop />
      <Footer />
    </OverviewWrapper>
  );
}

export default GainersPage;

export async function getStaticPaths() {
  return {
    paths: [
      { params: { period: '5m' } },
      { params: { period: '1h' } },
      { params: { period: '24h' } },
      { params: { period: '7d' } }
    ],
    fallback: false
  };
}

export async function getStaticProps({ params }) {
  // Map URL periods to API sortBy parameters
  const periodMap = {
    '5m': 'pro5m',
    '1h': 'pro1h',
    '24h': 'pro24h',
    '7d': 'pro7d'
  };

  const sortBy = periodMap[params.period];
  if (!sortBy) {
    return { notFound: true };
  }

  const data = await getTokens(sortBy, 'desc');

  let ret = {};
  if (data) {
    let ogp = {};

    ogp.canonical = `https://xrpl.to/gainers/${params.period}`;
    ogp.title = `${params.period.toUpperCase()} Gainers XRPL Tokens | Top Performers | XRP Ledger`;
    ogp.url = `https://xrpl.to/gainers/${params.period}`;
    ogp.imgUrl = `https://xrpl.to/api/og/gainers/${params.period}`;
    ogp.imgType = 'image/png';
    ogp.desc = `Discover the top performing XRPL tokens over the last ${params.period}. Track the biggest gainers and price increases on the XRP Ledger ecosystem.`;

    ogp.type = 'website';
    ogp.siteName = 'XRPL.to';
    ogp.locale = 'en_US';

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

    ret = { data, ogp, period: params.period, sortBy };
  }

  return {
    props: ret,
    revalidate: 5
  };
}
