// Material
import { styled, Box, Container, Toolbar } from '@mui/material';

// Components
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import AllCollections from 'src/NFTCollection/AllCollections';
import ScrollToTop from 'src/components/ScrollToTop';
import useWebSocket from 'react-use-websocket';
import { useDispatch } from 'react-redux';
import { update_metrics } from 'src/redux/statusSlice';

// overflow: scroll;
// overflow: auto;
// overflow: hidden;

const OverviewWrapper = styled(Box)(
  ({ theme }) => `
        // overflow: hidden;
        flex: 1;
`
);

export default function Overview({ collections, total, globalMetrics }) {
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

  return (
    <OverviewWrapper>
      <Toolbar id="back-to-top-anchor" />
      <Header />
      <h1 style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
        NFT Collections on XRPL
      </h1>

      <Container maxWidth="xl">
        <AllCollections
          initialCollections={collections}
          initialTotal={total}
          initialGlobalMetrics={globalMetrics}
        />
      </Container>

      <ScrollToTop />

      <Footer />
    </OverviewWrapper>
  );
}

export async function getStaticProps() {
  const BASE_URL = 'https://api.xrpl.to/api';

  let collections = [];
  let total = 0;
  let globalMetrics = null;

  try {
    const response = await fetch(
      `${BASE_URL}/nft/collections?page=0&limit=50&sortBy=totalVol24h&order=desc&includeGlobalMetrics=true`
    );
    const data = await response.json();

    collections = data.collections || [];
    total = data.pagination?.total || data.count || 0;
    globalMetrics = data.globalMetrics || null;
  } catch (error) {
    console.error('Failed to fetch collections:', error);
  }

  const ogp = {
    canonical: 'https://xrpl.to/collections',
    title: 'NFT Collections | XRPL.to',
    url: 'https://xrpl.to/collections',
    imgUrl: 'https://xrpl.to/static/ogp.webp',
    desc: 'Browse NFT collections on the XRP Ledger. Discover, trade, and collect digital art and collectibles. Community-centered marketplace for XRPL NFTs.'
  };

  return {
    props: {
      ogp,
      collections,
      total,
      globalMetrics
    },
    revalidate: 300 // Regenerate every 5 minutes
  };
}
