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
  const BASE_URL = 'http://65.109.54.46/api';

  let data = null;
  try {
    const slug = ctx.params.slug;

    var t1 = performance.now();

    // https://api.xrpnft.com/api/collection/test1
    const res = await axios.get(`${BASE_URL}/collection/getextra/${slug}`);

    data = res.data;

    var t2 = performance.now();
    var dt = (t2 - t1).toFixed(2);

    console.log(`3. getServerSideProps(collection) slug: ${slug} took: ${dt}ms`);
  } catch (e) {
    console.log(e);
  }

  if (data && data.collection) {
    /*{
            "result": "success",
            "took": "1.02",
            "slug": "collection-1",
            "collection": {
                "_id": "6310c27cf81fe46884ef89ba",
                "account": "rpcmZhxthTeWoLMpro5dfRAsAmwZCrsxGK",
                "name": "collection1",
                "slug": "collection-1",
                "description": "",
                "logoImage": "1662042748001_12e8a38273134f0e87f1039958d5b132.png",
                "featuredImage": "1662042748001_70910cc4c6134845bf84cf262e696d05.png",
                "bannerImage": "1662042748002_b32b442dea454998aa29ab61c8fa0887.jpg",
                "created": 1662042748016,
                "creator": "xrpnft.com",
                "uuid": "bc80f29343bb43f09f73d8e5e290ee4a"
            }
        } */

    const { name, featuredImage, logoImage, bannerImage, slug, uuid, description } =
      data.collection;

    let ogp = {};
    ogp.canonical = `https://xrpnft.com/collection/${slug}`;
    ogp.title = `${name}`;
    ogp.url = `https://xrpnft.com/collection/${slug}`;
    ogp.imgUrl = `https://s1.xrpnft.com/collection/${logoImage}`;
    ogp.desc = description
      ? description
      : `XRPL's largest NFT marketplace: Buy, sell, mint with ease. Experience exclusive NFT creation and trade.`;

    return {
      props: { collection: data, ogp } // will be passed to the page component as props
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
