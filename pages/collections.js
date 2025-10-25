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

export default function Overview() {
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
        <AllCollections />
      </Container>

      <ScrollToTop />

      <Footer />
    </OverviewWrapper>
  );
}

// This function gets called at build time on server-side.
// It may be called again, on a serverless function, if
// revalidation is enabled and a new request comes in
export async function getStaticProps() {
  let ret = {};

  const ogp = {};
  ogp.canonical = 'https://xrpl.to/collections';
  ogp.title = 'NFT Collections | XRPL.to';
  ogp.url = 'https://xrpl.to/collections';
  ogp.imgUrl = 'https://xrpl.to/static/ogp.webp';
  ogp.desc =
    'Browse NFT collections on the XRP Ledger. Discover, trade, and collect digital art and collectibles. Community-centered marketplace for XRPL NFTs.';

  ret = { ogp };

  return {
    props: ret, // will be passed to the page component as props
    revalidate: 3600 // ISR: Regenerate page every hour
  };
}
