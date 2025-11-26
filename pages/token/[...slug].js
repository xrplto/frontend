import axios from 'axios';
import { useState, useEffect } from 'react';
import useWebSocket from 'react-use-websocket';

// Redux
import { useDispatch } from 'react-redux';
import { update_metrics } from 'src/redux/statusSlice';

// Components
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
// TrustSetDialog removed - Xaman no longer used

import TokenDetail from 'src/TokenDetail';

function Detail({ data }) {
  const dispatch = useDispatch();
  const [token, setToken] = useState(data.token);
  const [creatorPanelOpen, setCreatorPanelOpen] = useState(false);
  const [transactionPanelOpen, setTransactionPanelOpen] = useState(false);
  const [orderBookOpen, setOrderBookOpen] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const WSS_FEED_URL = `wss://api.xrpl.to/ws/token/${data.token.md5}`;
  const tokenName = token.name || 'Token';

  const { lastMessage } = useWebSocket(WSS_FEED_URL, {
    onOpen: () => {},
    onClose: () => {},
    shouldReconnect: () => true,
    reconnectAttempts: 10,
    reconnectInterval: 3000
  });

  useEffect(() => {
    if (!lastMessage?.data) return;

    try {
      const json = JSON.parse(lastMessage.data);
      dispatch(update_metrics(json));

      // Use functional update to avoid stale closure
      setToken(prev => ({ ...prev, ...json.token }));
    } catch (err) {
      console.error(err);
    }
  }, [lastMessage, dispatch]);

  const isPanelOpen = creatorPanelOpen || transactionPanelOpen || orderBookOpen || notificationPanelOpen;

  return (
    <div className="overflow-hidden flex-1">
      <div id="back-to-top-anchor" className="h-6" />
      <Header
        notificationPanelOpen={notificationPanelOpen}
        onNotificationPanelToggle={setNotificationPanelOpen}
      />
      <h1 style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
        {tokenName} Price Chart & Trading Data
      </h1>

      <div className={isPanelOpen ? "w-full px-4" : "max-w-[1920px] mx-auto w-full px-4"}>
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
      </div>

      <ScrollToTop />

      <Footer />

    </div>
  );
}

export default Detail;

// Convert to ISR for better performance (pre-render top tokens at build time)
export async function getStaticPaths() {
  // Pre-render only top 100 most popular tokens at build time
  // All other tokens will use fallback: 'blocking' (SSR-like on first request, then cached)
  const BASE_URL = process.env.API_URL || 'https://api.xrpl.to/api';

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
  const BASE_URL = process.env.API_URL || 'https://api.xrpl.to/api';

  let data = null;
  let tab = null;
  let slug = null;

  try {
    slug = params.slug[0];
    tab = params.slug[1];

    // Use performance API if available (Node.js 16+ has it globally)
    const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();

    // https://api.xrpl.to/api/token/bitstamp-usd
    const res = await axios.get(`${BASE_URL}/token/${slug}?desc=yes`);

    data = res.data;
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

    // Enhanced Open Graph image handling with optimized dimensions
    const getOptimalImage = () => {
      // Optimal dimensions for social media (1.91:1 ratio, smaller for performance)
      const width = 300;
      const height = 157;

      // Primary: Token image if md5 is available
      if (md5) {
        return {
          url: `https://s1.xrpl.to/ogp/${md5}`,
          width,
          height,
          type: 'image/webp',
          alt: `${name} token logo`
        };
      }

      // Fallback: XRPL.to logo when no md5r
      return {
        url: 'https://xrpl.to/logo/xrpl-to-logo-white.svg',
        width,
        height,
        type: 'image/svg+xml',
        alt: 'XRPL.to - XRPL Token Trading Platform'
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
