import axios from 'axios';
import { performance } from 'perf_hooks';
import { useState, useEffect } from 'react';
import useWebSocket from 'react-use-websocket';
import dynamic from 'next/dynamic';

// Material UI imports
import {
  styled,
  Container,
  Box,
  Toolbar,
  CircularProgress
} from '@mui/material';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Utils
import { processOrderbookOffers } from 'src/utils/parseUtils';

// Components
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';

// Lazy load the heavy swap component
const Swap = dynamic(() => import('src/components/SwapInterface'), {
  loading: () => (
    <Box display="flex" justifyContent="center" p={4}>
      <CircularProgress />
    </Box>
  ),
  ssr: false
});

const Root = styled('div')(({ theme }) => ({
  overflowX: 'hidden',
  flex: 1,
  minHeight: '100vh'
}));

// Default tokens with correct md5 hashes
const XRP_TOKEN = {
  currency: 'XRP',
  issuer: 'XRPL',
  md5: '84e5efeb89c4eae8f68188982dc290d8',
  name: 'XRP'
};
const RLUSD_TOKEN = {
  currency: 'RLUSD',
  issuer: 'rMxCAmhYd3xnE55fCrZKaPZS7rZwqX7LJD',
  md5: '0dd550278b74cb6690fdae351e8e0df3',
  name: 'RLUSD'
};
const DEFAULT_PAIR = {
  curr1: XRP_TOKEN,
  curr2: RLUSD_TOKEN
};

function SwapPage({ data }) {
  const WSS_URL = 'wss://xrplcluster.com';
  const { accountProfile } = useContext(AppContext);

  const [revert, setRevert] = useState(false);
  const [pair, setPair] = useState(DEFAULT_PAIR);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [bids, setBids] = useState([]);
  const [asks, setAsks] = useState([]);
  const [wsReady, setWsReady] = useState(false);

  const { sendJsonMessage } = useWebSocket(WSS_URL, {
    onOpen: () => setWsReady(true),
    onClose: () => setWsReady(false),
    shouldReconnect: () => true,
    onMessage: (event) => processMessages(event)
  });

  // Orderbook WebSocket updates
  useEffect(() => {
    let reqID = 1;
    function sendRequest() {
      if (!wsReady) return;

      const curr1 = pair.curr1;
      const curr2 = pair.curr2;

      const cmdAsk = {
        id: reqID,
        command: 'book_offers',
        taker_gets: {
          currency: curr1.currency,
          issuer: curr1.currency === 'XRP' ? undefined : curr1.issuer
        },
        taker_pays: {
          currency: curr2.currency,
          issuer: curr2.currency === 'XRP' ? undefined : curr2.issuer
        },
        ledger_index: 'validated',
        limit: 60
      };

      const cmdBid = {
        id: reqID + 1,
        command: 'book_offers',
        taker_gets: {
          currency: curr2.currency,
          issuer: curr2.currency === 'XRP' ? undefined : curr2.issuer
        },
        taker_pays: {
          currency: curr1.currency,
          issuer: curr1.currency === 'XRP' ? undefined : curr1.issuer
        },
        ledger_index: 'validated',
        limit: 60
      };

      sendJsonMessage(cmdAsk);
      sendJsonMessage(cmdBid);
      reqID += 2;
    }

    sendRequest();
    const timer = setInterval(() => sendRequest(), 4000);
    return () => clearInterval(timer);
  }, [wsReady, pair, revert, sendJsonMessage]);

  // Process orderbook messages
  const processMessages = (event) => {
    const orderBook = JSON.parse(event.data);
    if (orderBook.hasOwnProperty('result') && orderBook.status === 'success') {
      const req = orderBook.id % 2;
      if (req === 1) {
        const parsed = processOrderbookOffers(orderBook.result.offers, 'asks');
        setAsks(parsed);
      }
      if (req === 0) {
        const parsed = processOrderbookOffers(orderBook.result.offers, 'bids');
        setBids(parsed);
      }
    }
  };

  return (
    <Root>
      <Toolbar id="back-to-top-anchor" />
      <Header
        notificationPanelOpen={notificationPanelOpen}
        onNotificationPanelToggle={setNotificationPanelOpen}
      />
      <h1 style={{
        position: 'absolute',
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: 'hidden',
        clip: 'rect(0,0,0,0)',
        whiteSpace: 'nowrap',
        border: 0
      }}>
        Swap XRPL Tokens
      </h1>

      <Container maxWidth={notificationPanelOpen ? false : "lg"} sx={{ py: { xs: 0.5, sm: 1, md: 2 }, px: { xs: 1, sm: 2 } }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: { xs: 1, sm: 2, md: 3 },
            minHeight: 'calc(100vh - 160px)',
            pt: { xs: 0.5, sm: 1, md: 2 }
          }}
        >
          <Box sx={{ width: '100%', maxWidth: '1200px' }}>
            <Swap
              pair={pair}
              setPair={setPair}
              revert={revert}
              setRevert={setRevert}
              bids={bids}
              asks={asks}
            />
          </Box>
        </Box>
      </Container>

      <Footer />
      <ScrollToTop />
    </Root>
  );
}

export default SwapPage;

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: 'blocking'
  };
}

export async function getStaticProps({ params }) {
  const startTime = performance.now();
  const BASE_URL = 'https://api.xrpl.to/api';

  let metrics = null;

  try {
    const metricsResponse = await axios.get(
      `${BASE_URL}/tokens?start=0&limit=50&sortBy=vol24hxrp&sortType=desc&filter=`
    );

    if (metricsResponse.status === 200) {
      metrics = metricsResponse.data;
      const time = Date.now();
      for (var token of metrics.tokens) {
        token.bearbull = token.pro24h < 0 ? -1 : 1;
        token.time = time;
      }
    }
  } catch (error) {}

  const duration = Math.round(performance.now() - startTime);

  const data = metrics || {
    tokens: [],
    total: 0,
    count: 0,
    exch: { USD: 100, EUR: 100, JPY: 100, CNY: 100 },
    H24: {
      transactions24H: 0,
      tradedXRP24H: 0,
      tradedTokens24H: 0,
      activeAddresses24H: 0,
      totalAddresses: 0,
      totalOffers: 0,
      totalTrustLines: 0
    },
    global: {
      gMarketcap: 0,
      gMarketcapPro: 0,
      gDexVolume: 0,
      gDexVolumePro: 0,
      gScamVolume: 0,
      gScamVolumePro: 0,
      gStableVolume: 0,
      gStableVolumePro: 0,
      gXRPdominance: 0,
      gXRPdominancePro: 0
    },
    duration
  };

  const ogp = {
    canonical: 'https://xrpl.to/swap',
    title: 'Easily Swap XRP for Any Token on the XRPL',
    url: 'https://xrpl.to/swap/',
    imgUrl: 'https://xrpl.to/static/ogp.webp',
    desc: 'Effortlessly Exchange Tokens on the XRP Ledger with Our Seamless Swap Tool.'
  };

  return {
    props: { data, ogp },
    revalidate: 300
  };
}