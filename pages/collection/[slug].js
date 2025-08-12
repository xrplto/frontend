import axios from 'axios';
import { performance } from 'perf_hooks';

// Material
import { Box, Container, styled, Toolbar } from '@mui/material';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Components
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import Collection from 'src/collection';
import ScrollToTop from 'src/components/ScrollToTop';
import Topbar from 'src/components/Topbar';
import CollectionBreadcrumb from 'src/collection/CollectionBreadcrumb';
import useWebSocket from 'react-use-websocket';
import { useDispatch } from 'react-redux';
import { update_metrics } from 'src/redux/statusSlice';

const OverviewWrapper = styled(Box)(
  ({ theme }) => `
        // overflow: hidden;
        flex: 1;
`
);

export default function Overview({ collection }) {
  const { darkMode } = useContext(AppContext);
  const dispatch = useDispatch();

  // Add WebSocket connection
  const WSS_FEED_URL = 'wss://api.xrpl.to/ws/sync';
  const { sendJsonMessage } = useWebSocket(WSS_FEED_URL, {
    shouldReconnect: (closeEvent) => true,
    onMessage: (event) => {
      try {
        const json = JSON.parse(event.data);
        dispatch(update_metrics(json));
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    }
  });

  // "collection": {
  //     "_id": "6310c27cf81fe46884ef89ba",
  //     "account": "rpcmZhxthTeWoLMpro5dfRAsAmwZCrsxGK",
  //     "name": "collection1",
  //     "slug": "collection-1",
  //     "description": "",
  //     "logoImage": "1662042748001_12e8a38273134f0e87f1039958d5b132.png",
  //     "featuredImage": "1662042748001_70910cc4c6134845bf84cf262e696d05.png",
  //     "bannerImage": "1662042748002_b32b442dea454998aa29ab61c8fa0887.jpg",
  //     "created": 1662042748016,
  //     "creator": "xrpnft.com",
  //     "uuid": "bc80f29343bb43f09f73d8e5e290ee4a"
  // }
  // const collection = collection.collection;

  let default_banner = darkMode ? '/static/banner_black.png' : '/static/banner_white.png';

  // const bannerImage = collection.bannerImage?`https://s1.xrpnft.com/collection/${collection.bannerImage}`:default_banner;
  const bannerImage = collection.collection.logoImage
    ? `https://s1.xrpnft.com/collection/${collection.collection.logoImage}`
    : darkMode
    ? '/static/banner_black.png'
    : '/static/banner_white.png'; //added default banner. Disable custom banner images above for now.
  return (
    <OverviewWrapper>
      <Toolbar id="back-to-top-anchor" />

      <Topbar />

      <Header />

      <Container maxWidth="xl">
        <CollectionBreadcrumb collection={collection} />
      </Container>

      <Container maxWidth="xl">
        <Collection data={collection} />
      </Container>

      <ScrollToTop />

      <Footer />
    </OverviewWrapper>
  );
}

export async function getServerSideProps(ctx) {
  const BASE_URL = 'https://api.xrpnft.com/api';
  
  // Set cache headers for better performance
  ctx.res.setHeader(
    'Cache-Control',
    'public, s-maxage=60, stale-while-revalidate=120'
  );

  let data = null;
  let initialNfts = null;
  
  try {
    const slug = ctx.params.slug;
    const t1 = performance.now();

    // Fetch collection data and initial NFTs in parallel
    const [collectionRes, nftsRes] = await Promise.all([
      axios.get(`${BASE_URL}/collection/getextra/${slug}`, {
        timeout: 5000,
        headers: {
          'Accept-Encoding': 'gzip, deflate',
          'Accept': 'application/json'
        }
      }),
      axios.post(`${BASE_URL}/nfts`, {
        page: 0,
        limit: 24,
        flag: 0,
        cid: null,
        search: '',
        filter: 0,
        subFilter: 'default',
        filterAttrs: []
      }, {
        timeout: 5000,
        headers: {
          'Accept-Encoding': 'gzip, deflate',
          'Accept': 'application/json'
        }
      }).catch(() => null) // Don't fail if NFTs can't be loaded
    ]);

    data = collectionRes.data;
    initialNfts = nftsRes?.data?.nfts || [];

    const t2 = performance.now();
    const dt = (t2 - t1).toFixed(2);
    console.log(`SSR: Collection ${slug} loaded in ${dt}ms with ${initialNfts.length} NFTs`);
    
  } catch (error) {
    console.error('SSR Error:', error.message);
    
    // Try fallback API if primary fails
    try {
      const res = await axios.get(`http://65.109.54.46/api/collection/getextra/${ctx.params.slug}`, {
        timeout: 3000
      });
      data = res.data;
    } catch (fallbackError) {
      console.error('Fallback API also failed:', fallbackError.message);
    }
  }

  if (data && data.collection) {
    const { name, featuredImage, logoImage, bannerImage, slug, uuid, description } =
      data.collection;

    // Enhanced OGP metadata
    const ogp = {
      canonical: `https://xrpnft.com/collection/${slug}`,
      title: `${name} | XRPL NFT Collection`,
      url: `https://xrpnft.com/collection/${slug}`,
      imgUrl: logoImage ? `https://s1.xrpnft.com/collection/${logoImage}` : '/logo/xrpl-to-logo-black.svg',
      desc: description || `Explore ${name} on XRPL's largest NFT marketplace. Buy, sell, and trade unique digital assets.`,
      type: 'website',
      siteName: 'XRPL.to',
      locale: 'en_US'
    };

    // Add initial NFTs to data for faster first paint
    if (initialNfts) {
      data.initialNfts = initialNfts;
    }

    return {
      props: { 
        collection: data, 
        ogp,
        timestamp: Date.now() // For cache validation
      }
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
