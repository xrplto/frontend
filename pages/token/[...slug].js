import axios from 'axios';
import { performance } from 'perf_hooks';
import { useState } from 'react';
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
  const WSS_FEED_URL = `wss://api.xrpl.to/ws/token/${token.md5}`;

  useWebSocket(WSS_FEED_URL, {
    onOpen: () => {},
    onClose: () => {},
    shouldReconnect: () => true,
    onMessage: (event) => processMessages(event)
    // reconnectAttempts: 10,
    // reconnectInterval: 3000,
  });

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

      <Container maxWidth="xl">
        <TokenDetail token={token} tab={data.tab} />
      </Container>

      <ScrollToTop />

      <Footer />
    </OverviewWrapper>
  );
}

export default Detail;

export async function getServerSideProps(ctx) {
  const BASE_URL = process.env.API_URL;

  let data = null;
  try {
    const params = ctx.params.slug;

    const slug = params[0];
    const tab = params[1];

    var t1 = performance.now();

    // https://api.xrpl.to/api/token/bitstamp-usd
    const res = await axios.get(`${BASE_URL}/token/${slug}?desc=yes`);

    data = res.data;
    if (tab) data.tab = tab;

    var t2 = performance.now();
    var dt = (t2 - t1).toFixed(2);

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
    const priceDisplay = exch ? `${Number(exch).toFixed(exch < 0.01 ? 6 : 4)} XRP` : '';
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
    let seoTitle = `${name} Price: ${priceDisplay}`;
    if (changeDisplay) {
      seoTitle += ` ${changeDisplay}`;
    }
    seoTitle += ` | Live Chart & Trading Data`;

    // Fallback shorter title if too long (keep under 60 chars when possible)
    if (seoTitle.length > 55) {
      seoTitle = `${name}: ${priceDisplay}${changeDisplay ? ` ${changeDisplay}` : ''} | XRPL.to`;
    }

    // Enhanced Open Graph image handling with fallbacks
    const getOptimalImage = () => {
      // Primary: Token-specific image from CDN
      if (md5) {
        return {
          url: `https://s1.xrpl.to/token/${md5}`,
          width: 400,
          height: 400,
          type: 'image/webp',
          alt: `${name} token logo`
        };
      }

      // Secondary: Legacy token image if ext is available
      if (md5 && ext) {
        return {
          url: `https://xrpl.to/static/tokens/${md5}.${ext}`,
          width: 400,
          height: 400,
          type:
            ext === 'png'
              ? 'image/png'
              : ext === 'jpg' || ext === 'jpeg'
              ? 'image/jpeg'
              : 'image/webp',
          alt: `${name} token logo`
        };
      }

      // Fallback: XRPL.to logo
      return {
        url: 'https://xrpl.to/logo/xrpl-to-logo-white.svg',
        width: 1200,
        height: 630,
        type: 'image/svg+xml',
        alt: 'XRPL.to - XRPL Token Trading Platform'
      };
    };

    const imageData = getOptimalImage();

    ogp.canonical = `https://xrpl.to/token/${slug}`;
    ogp.title = seoTitle;
    ogp.url = `https://xrpl.to/token/${slug}`;
    ogp.imgUrl = imageData.url;
    ogp.imgWidth = imageData.width;
    ogp.imgHeight = imageData.height;
    ogp.imgType = imageData.type;
    ogp.imgAlt = imageData.alt;
    ogp.desc = metaDesc;

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

    // If we have a token image, also provide the logo as a secondary option
    if (md5) {
      ogp.images.push({
        url: 'https://xrpl.to/logo/xrpl-to-logo-white.svg',
        width: 1200,
        height: 630,
        type: 'image/svg+xml',
        alt: 'XRPL.to - XRPL Token Trading Platform'
      });
    }

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
