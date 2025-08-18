import axios from 'axios';
import { useState, useEffect } from 'react';
import useWebSocket from 'react-use-websocket';

// Material
import { Box, Container, styled, Toolbar } from '@mui/material';

// Redux
import { useDispatch } from 'react-redux';
import { update_metrics } from 'src/redux/statusSlice';

// Components
import Topbar from 'src/components/Topbar';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
import TrustSetDialog from 'src/components/TrustSetDialog';

import TokenDetail from 'src/TokenDetail';

// overflow: hidden;
const OverviewWrapper = styled(Box)(
  () => `
    overflow: hidden;
    flex: 1;
`
);

function Detail({ data }) {
  const dispatch = useDispatch();
  const [token, setToken] = useState(data.token);
  const [trustsetToken, setTrustsetToken] = useState(null);
  const [hasClosedTrustset, setHasClosedTrustset] = useState(false);
  const [creatorPanelOpen, setCreatorPanelOpen] = useState(false);
  const [transactionPanelOpen, setTransactionPanelOpen] = useState(false);
  const WSS_FEED_URL = `wss://api.xrpl.to/ws/token/${token.md5}`;

  useWebSocket(WSS_FEED_URL, {
    onOpen: () => {},
    onClose: () => {},
    shouldReconnect: () => true,
    onMessage: (event) => processMessages(event)
    // reconnectAttempts: 10,
    // reconnectInterval: 3000,
  });

  // Handle trustset modal - only open on initial load, not after manual close
  useEffect(() => {
    if (data.tab === 'trustset' && !hasClosedTrustset) {
      setTrustsetToken(token);
    }
  }, [data.tab, token, hasClosedTrustset]);

  // Handle trustset modal close
  const handleTrustsetClose = () => {
    setTrustsetToken(null);
    setHasClosedTrustset(true);
  };

  const processMessages = (event) => {
    try {
      var t1 = Date.now();

      const json = JSON.parse(event.data);

      dispatch(update_metrics(json));

      setToken({ ...token, ...json.token });

      var t2 = Date.now();
      var dt = (t2 - t1).toFixed(2);

      // console.log(`${dt} ms`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <OverviewWrapper>
      <Toolbar id="back-to-top-anchor" />
      <Topbar />
      <Header />

      {creatorPanelOpen || transactionPanelOpen ? (
        <Box sx={{ width: '100%', px: 2 }}>
          <TokenDetail 
            token={token} 
            tab={data.tab} 
            onCreatorPanelToggle={(open) => setCreatorPanelOpen(open)}
            creatorPanelOpen={creatorPanelOpen}
            onTransactionPanelToggle={(open) => setTransactionPanelOpen(open)}
            transactionPanelOpen={transactionPanelOpen}
          />
        </Box>
      ) : (
        <Container maxWidth="xl">
          <TokenDetail 
            token={token} 
            tab={data.tab} 
            onCreatorPanelToggle={(open) => setCreatorPanelOpen(open)}
            creatorPanelOpen={creatorPanelOpen}
            onTransactionPanelToggle={(open) => setTransactionPanelOpen(open)}
            transactionPanelOpen={transactionPanelOpen}
          />
        </Container>
      )}

      <ScrollToTop />

      <Footer />

      {trustsetToken && (
        <TrustSetDialog token={trustsetToken} setToken={handleTrustsetClose} balance={0} />
      )}
    </OverviewWrapper>
  );
}

export default Detail;

export async function getServerSideProps(ctx) {
  const BASE_URL = process.env.API_URL;

  let data = null;
  let tab = null;
  let slug = null;

  try {
    const params = ctx.params.slug;

    slug = params[0];
    tab = params[1];

    // Use performance API if available (Node.js 16+ has it globally)
    const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();

    // https://api.xrpl.to/api/token/bitstamp-usd
    const res = await axios.get(`${BASE_URL}/token/${slug}?desc=yes`);

    data = res.data;
    if (tab) data.tab = tab;

    const t2 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const dt = (t2 - t1).toFixed(2);

    console.log(`2. getServerSideProps slug: ${slug}${tab ? `/${tab}` : ''} took: ${dt}ms`);
  } catch (e) {
    console.log(e);
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

    // Override meta data for trustset pages
    if (tab === 'trustset') {
      ogp.canonical = `https://xrpl.to/token/${slug}/trustset`;
      ogp.title = `Establish a ${name} Trustline on the XRP Ledger`;
      ogp.url = `https://xrpl.to/token/${slug}/trustset`;
      ogp.desc = `Easily set up a ${name} Trustline on the XRPL for secure and streamlined transactions.`;
    } else {
      ogp.canonical = `https://xrpl.to/token/${slug}`;
      ogp.title = seoTitle;
      ogp.url = `https://xrpl.to/token/${slug}`;
      ogp.desc = metaDesc;
    }

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

    ret = { data, ogp };
    return {
      props: ret // will be passed to the page component as props
    };
  } else {
    return {
      redirect: {
        permanent: false,
        destination: '/404'
      }
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
