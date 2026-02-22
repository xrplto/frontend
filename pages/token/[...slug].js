import api from 'src/utils/api';
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

const PAGE_LOAD_START = typeof performance !== 'undefined' ? performance.now() : Date.now();

function Detail({ data }) {
  const dispatch = useDispatch();
  const [token, setToken] = useState(data.token);
  const [creatorPanelOpen, setCreatorPanelOpen] = useState(false);
  const [transactionPanelOpen, setTransactionPanelOpen] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const tokenName = token.name || 'Token';

  // Page load timing
  useEffect(() => {
    const mountTime = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - PAGE_LOAD_START;

    // Log when page is fully interactive
    if (typeof window !== 'undefined') {
      const cb = () => {
        const idleTime = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - PAGE_LOAD_START;
        // fully interactive
      };
      typeof requestIdleCallback === 'function' ? requestIdleCallback(cb) : setTimeout(cb, 1);
    }
  }, []);

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
    creatorPanelOpen || transactionPanelOpen || notificationPanelOpen;

  return (
    <main className="overflow-x-clip w-full max-w-[100vw] min-h-screen">
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
          notificationPanelOpen={notificationPanelOpen}
        />
      </article>

      <ScrollToTop />

      <Footer />
    </main>
  );
}

export default Detail;

// SSR: fetch fresh data on every request - no cached 404s
export async function getServerSideProps({ params, res }) {
  const BASE_URL = process.env.API_URL || 'https://api.xrpl.to/v1';

  let data = null;
  let tab = null;
  let slug = null;

  slug = params.slug[0];
  tab = params.slug[1];

  const apiUrl = `${BASE_URL}/token/${slug}?desc=yes`;

  // Retry up to 2 times on transient failures
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const reqRes = await api.get(apiUrl, {
        timeout: attempt === 0 ? 8000 : 12000,
        validateStatus: (status) => status === 200
      });
      if (reqRes.data && typeof reqRes.data === 'object') {
        data = reqRes.data.data || reqRes.data;
        if (tab && data) data.tab = tab;
      }
      break;
    } catch (e) {
      if (attempt === 1) {
        console.error('[getServerSideProps] Error after retries:', e.message, 'slug:', slug);
      }
    }
  }

  // SEO: 301 redirect md5 hash to human-readable slug
  if (data && data.token && data.token.slug && slug !== data.token.slug) {
    return {
      redirect: {
        destination: `/token/${data.token.slug}${tab ? `/${tab}` : ''}`,
        permanent: true
      }
    };
  }

  if (data && data.token) {
    // Set cache headers for successful responses
    res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=59');

    let ogp = {};
    const token = data.token;
    const { name, ext, md5, slug, exch, pro24h, vol24hxrp, marketcap, holders, issuer } = token;

    const priceDisplay = exch ? `${Number(exch).toFixed(exch < 0.01 ? 10 : 8)} XRP` : '';
    const changeDisplay =
      pro24h !== undefined ? `${pro24h >= 0 ? '+' : ''}${Number(pro24h).toFixed(2)}%` : '';

    let metaDesc = `${name} live price: ${priceDisplay}`;
    if (changeDisplay) {
      metaDesc += ` (${changeDisplay} 24h)`;
    }
    metaDesc += `. Get real-time charts, trading data & market insights on XRPL.to`;

    if (metaDesc.length > 155) {
      metaDesc = `${name} price: ${priceDisplay}${
        changeDisplay ? ` (${changeDisplay})` : ''
      }. Live charts, trading data & XRPL market insights`;
    }

    let seoTitle = `${name}: ${priceDisplay}`;
    if (changeDisplay) {
      seoTitle += ` ${changeDisplay}`;
    }

    if (seoTitle.length > 60) {
      seoTitle = `${name}: ${priceDisplay}${changeDisplay ? ` ${changeDisplay}` : ''}`;
    }

    const imageData = {
      url: `https://xrpl.to/api/og/token/${slug || md5}`,
      width: 1200,
      height: 630,
      type: 'image/png',
      alt: `${name} price chart on XRPL.to`
    };

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

    ogp.images = [
      {
        url: imageData.url,
        width: imageData.width,
        height: imageData.height,
        type: imageData.type,
        alt: imageData.alt
      }
    ];

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
      ...(issuer && {
        provider: {
          '@type': 'Organization',
          name: issuer
        }
      })
    };

    ogp.jsonLd = jsonLd;
    return {
      props: { data, ogp }
    };
  } else {
    return {
      notFound: true
    };
  }
}
