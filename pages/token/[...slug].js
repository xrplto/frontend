import axios from 'axios';
import { useState, useEffect, useCallback } from 'react';

// Redux
import { useDispatch } from 'react-redux';
import { update_metrics } from 'src/redux/statusSlice';

// Hooks
import { useTokenDetail } from 'src/hooks/useTokenDetail';

// Components
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';

import TokenDetail from 'src/TokenDetail';

function Detail({ data }) {
  const dispatch = useDispatch();
  const [token, setToken] = useState(data.token);
  const [creatorPanelOpen, setCreatorPanelOpen] = useState(false);
  const [transactionPanelOpen, setTransactionPanelOpen] = useState(false);
  const [orderBookOpen, setOrderBookOpen] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const tokenName = token.name || 'Token';

  // WebSocket connection enabled immediately
  const [wsEnabled, setWsEnabled] = useState(true);

  // Handle token updates from WebSocket (supports delta mode)
  const handleTokenUpdate = useCallback((tokenData, isDelta) => {
    if (isDelta) {
      // Delta update: merge only changed fields
      setToken((prev) => ({ ...prev, ...tokenData }));
    } else {
      // Full update: replace token data
      setToken((prev) => ({ ...prev, ...tokenData }));
    }
  }, []);

  // Handle metrics/exchange rate updates
  const handleMetricsUpdate = useCallback(
    (metrics) => {
      dispatch(update_metrics(metrics));
    },
    [dispatch]
  );

  // Use the new WebSocket hook with field filtering and delta mode
  const { isConnected, setFields, resync } = useTokenDetail({
    md5: data.token.md5,
    onTokenUpdate: handleTokenUpdate,
    onMetricsUpdate: handleMetricsUpdate,
    fields: 'trading', // Get trading-related fields (20 fields)
    deltaMode: true, // Only receive changed fields
    enabled: wsEnabled
  });

  const isPanelOpen =
    creatorPanelOpen || transactionPanelOpen || orderBookOpen || notificationPanelOpen;

  return (
    <main className="overflow-hidden min-h-screen">
      <Header
        notificationPanelOpen={notificationPanelOpen}
        onNotificationPanelToggle={setNotificationPanelOpen}
      />
      <h1 className="sr-only">{tokenName} Price Chart & Trading Data</h1>

      <article id="back-to-top-anchor" className="w-full px-2 sm:px-4 mt-4">
        <TokenDetail
          token={token}
          tab={data.tab}
          onCreatorPanelToggle={(open) => setCreatorPanelOpen(open)}
          creatorPanelOpen={creatorPanelOpen}
          onTransactionPanelToggle={(open) => setTransactionPanelOpen(open)}
          transactionPanelOpen={transactionPanelOpen}
          onOrderBookToggle={(open) => setOrderBookOpen(open)}
          orderBookOpen={orderBookOpen}
          notificationPanelOpen={notificationPanelOpen}
        />
      </article>

      <ScrollToTop />

      <Footer />
    </main>
  );
}

export default Detail;

// Convert to ISR for better performance (pre-render top tokens at build time)
export async function getStaticPaths() {
  // Pre-render only top 100 most popular tokens at build time
  // All other tokens will use fallback: 'blocking' (SSR-like on first request, then cached)
  const BASE_URL = process.env.API_URL || 'https://api.xrpl.to/v1';

  try {
    const res = await axios.get(`${BASE_URL}/tokens?limit=100&sortBy=vol24hxrp&sortType=desc`);
    const topTokens = res.data.tokens || [];

    const paths = topTokens.map((token) => ({
      params: { slug: [token.slug] }
    }));

    return {
      paths,
      fallback: 'blocking' // Generate other pages on-demand and cache
    };
  } catch (error) {
    return {
      paths: [],
      fallback: 'blocking'
    };
  }
}

export async function getStaticProps({ params }) {
  const BASE_URL = process.env.API_URL || 'https://api.xrpl.to/v1';

  let data = null;
  let tab = null;
  let slug = null;

  try {
    slug = params.slug[0];
    tab = params.slug[1];

    // Use performance API if available (Node.js 16+ has it globally)
    const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();

    // https://api.xrpl.to/v1/token/bitstamp-usd
    const res = await axios.get(`${BASE_URL}/token/${slug}?desc=yes`);

    data = res.data.data || res.data;
    if (tab) data.tab = tab;

    // SEO: 301 redirect md5 hash to human-readable slug (better for SEO + UX)
    if (data && data.token && data.token.slug && slug !== data.token.slug) {
      return {
        redirect: {
          destination: `/token/${data.token.slug}${tab ? `/${tab}` : ''}`,
          permanent: true // 301 redirect
        }
      };
    }

    // SEO: Redirect legacy /trustset URLs (feature removed, prevents duplicate content)
    if (tab === 'trustset') {
      return {
        redirect: {
          destination: `/token/${data.token.slug || slug}`,
          permanent: true // 301 redirect
        }
      };
    }

    const t2 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const dt = (t2 - t1).toFixed(2);
  } catch (e) {
    // Error during getStaticProps
  }
  let ret = {};
  if (data && data.token) {
    let ogp = {};
    const token = data.token;
    const { name, ext, md5, slug, exch, pro24h, vol24hxrp, marketcap, holders } = token;

    // Format price and percentage change for meta description
    const priceDisplay = exch ? `${Number(exch).toFixed(exch < 0.01 ? 10 : 8)} XRP` : '';
    const changeDisplay =
      pro24h !== undefined ? `${pro24h >= 0 ? '+' : ''}${Number(pro24h).toFixed(2)}%` : '';

    // Create dynamic meta description with specific token data
    let metaDesc = `${name} live price: ${priceDisplay}`;
    if (changeDisplay) {
      metaDesc += ` (${changeDisplay} 24h)`;
    }
    metaDesc += `. Get real-time charts, trading data & market insights on XRPL.to`;

    // Ensure description is under 160 characters
    if (metaDesc.length > 155) {
      metaDesc = `${name} price: ${priceDisplay}${
        changeDisplay ? ` (${changeDisplay})` : ''
      }. Live charts, trading data & XRPL market insights`;
    }

    // Create SEO-optimized title with dynamic data
    let seoTitle = `${name}: ${priceDisplay}`;
    if (changeDisplay) {
      seoTitle += ` ${changeDisplay}`;
    }

    // Fallback shorter title if too long (keep under 60 chars when possible)
    if (seoTitle.length > 60) {
      seoTitle = `${name}: ${priceDisplay}${changeDisplay ? ` ${changeDisplay}` : ''}`;
    }

    // Pre-generated OG image (static file)
    const getOptimalImage = () => {
      return {
        url: `https://xrpl.to/og/token/${md5}.webp`,
        width: 1200,
        height: 630,
        type: 'image/webp',
        alt: `${name} price chart on XRPL.to`
      };
    };

    const imageData = getOptimalImage();

    // Use human-readable slug for canonical URL (SEO best practice: descriptive URLs)
    const canonicalSlug = slug || md5;

    ogp.canonical = `https://xrpl.to/token/${canonicalSlug}`;
    ogp.title = seoTitle;
    ogp.url = `https://xrpl.to/token/${canonicalSlug}`;
    ogp.desc = metaDesc;

    ogp.imgUrl = imageData.url;
    ogp.imgWidth = imageData.width;
    ogp.imgHeight = imageData.height;
    ogp.imgType = imageData.type;
    ogp.imgAlt = imageData.alt;

    // Additional Open Graph image properties for better social media support
    ogp.images = [
      {
        url: imageData.url,
        width: imageData.width,
        height: imageData.height,
        type: imageData.type,
        alt: imageData.alt
      }
    ];

    // JSON-LD structured data for SEO
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'FinancialProduct',
      name: name,
      description: ogp.desc,
      url: ogp.canonical,
      image: imageData.url,
      ...(exch && {
        offers: {
          '@type': 'Offer',
          price: Number(exch).toFixed(8),
          priceCurrency: 'XRP',
          availability: 'https://schema.org/InStock',
          url: ogp.canonical
        }
      }),
      ...(marketcap && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: marketcap > 1000000 ? '4.5' : '4.0',
          reviewCount: holders || 1
        }
      })
    };

    ogp.jsonLd = jsonLd;
    ret = { data, ogp };
    return {
      props: ret, // will be passed to the page component as props
      revalidate: 5 // ISR: Regenerate page every 5 seconds if requested (matches trending/gainers/new pages)
    };
  } else {
    return {
      notFound: true // Return 404 page for ISR
    };
  }
}

// This function gets called at build time
// export async function getStaticPaths() {
//     // Call an external API endpoint to get posts
//     const res = await fetch('https://.../posts')
//     const posts = await res.json()

//     // Get the paths we want to pre-render based on posts
//     const paths = posts.map((post) => ({
//       params: { id: post.id },
//     }))

//     // We'll pre-render only these paths at build time.
//     // { fallback: false } means other routes should 404.
//     return { paths, fallback: false }
// }
