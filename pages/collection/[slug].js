import axios from 'axios';
import { performance } from 'perf_hooks';
import styled from '@emotion/styled';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Components
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import Collection from 'src/NFTCollection/CollectionView';
import ScrollToTop from 'src/components/ScrollToTop';
import CollectionBreadcrumb from 'src/NFTCollection/CollectionBreadcrumb';
import useWebSocket from 'react-use-websocket';
import { useDispatch } from 'react-redux';
import { update_metrics } from 'src/redux/statusSlice';

const OverviewWrapper = styled.div`
  flex: 1;
`;

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

  if (!collection) {
    return <div>Loading...</div>;
  }

  const collectionName = collection.name || 'NFT Collection';

  return (
    <OverviewWrapper>
      <div className="h-4" id="back-to-top-anchor" />

      <Header />
      <h1 style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
        {collectionName} NFT Collection
      </h1>

      <div className="mx-auto max-w-[1920px] px-4">
        <CollectionBreadcrumb collection={collection} />
      </div>

      <div className="mx-auto max-w-[1920px] px-4">
        <Collection collection={collection} />
      </div>

      <ScrollToTop />

      <Footer />
    </OverviewWrapper>
  );
}

export async function getServerSideProps(ctx) {
  const BASE_URL = 'https://api.xrpl.to/api';

  // Set cache headers for better performance
  ctx.res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

  let data = null;

  try {
    const slug = ctx.params.slug;
    const t1 = performance.now();

    // Fetch collection with NFTs in single request
    const res = await axios.get(`${BASE_URL}/nft/collections/${slug}?includeNFTs=true&nftLimit=20`, {
      timeout: 5000,
      headers: {
        'Accept-Encoding': 'gzip, deflate',
        Accept: 'application/json'
      }
    });

    data = {
      collection: res.data,
      initialNfts: res.data.nfts || [],
      name: res.data.name
    };

    const t2 = performance.now();
    const dt = (t2 - t1).toFixed(2);
    console.log(`SSR: Collection ${slug} loaded in ${dt}ms with ${data.initialNfts.length} NFTs`);
  } catch (error) {
    console.error('SSR Error:', error.message, error.response?.data);
    return {
      redirect: {
        permanent: false,
        destination: '/404'
      }
    };
  }

  if (data && data.collection) {
    const { name, featuredImage, logoImage, bannerImage, slug, uuid, description } =
      data.collection;

    // Enhanced OGP metadata
    const ogp = {
      canonical: `https://xrpl.to/collection/${slug}`,
      title: `${name} | XRPL NFT Collection`,
      url: `https://xrpl.to/collection/${slug}`,
      imgUrl: logoImage
        ? `https://s1.xrpl.to/nft-collection/${logoImage}`
        : '/logo/xrpl-to-logo-black.svg',
      desc:
        description ||
        `Explore ${name} on XRPL's largest NFT marketplace. Buy, sell, and trade unique digital assets.`,
      type: 'website',
      siteName: 'XRPL.to',
      locale: 'en_US'
    };

    return {
      props: {
        collection: data,
        ogp,
        timestamp: Date.now()
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
