import axios from 'axios';
import { performance } from 'perf_hooks';
import { useState, useEffect } from 'react';
import useWebSocket from 'react-use-websocket';

// Material UI imports
import { Toolbar } from '@mui/material';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Utils
import { XRP_TOKEN, USD_TOKEN } from 'src/utils/constants';

// Components
import Logo from 'src/components/Logo';
import dynamic from 'next/dynamic';

const Swap = dynamic(() => import('src/components/SwapInterface'), {
  loading: () => <div>Loading swap interface...</div>,
  ssr: false
});

import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';

// Removed Material UI styled component - using Tailwind classes directly

const DEFAULT_PAIR = {
  curr1: XRP_TOKEN,
  curr2: USD_TOKEN
};

const ORDER_TYPE_BIDS = 'bids';
const ORDER_TYPE_ASKS = 'asks';

function Overview({ data }) {
  const WSS_URL = 'wss://xrplcluster.com';

  const { accountProfile, openSnackbar } = useContext(AppContext);

  const tokens = data && data.tokens ? data.tokens : [];

  const [revert, setRevert] = useState(false);
  const [pair, setPair] = useState(DEFAULT_PAIR);

  const [bids, setBids] = useState([]); // Orderbook Bids
  const [asks, setAsks] = useState([]); // Orderbook Asks

  const [wsReady, setWsReady] = useState(false);
  const { sendJsonMessage /*, getWebSocket*/ } = useWebSocket(WSS_URL, {
    onOpen: () => {
      setWsReady(true);
    },
    onClose: () => {
      setWsReady(false);
    },
    shouldReconnect: (closeEvent) => true,
    onMessage: (event) => processMessages(event)
  });

  // Orderbook related useEffect - Start
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

    return () => {
      clearInterval(timer);
    };
  }, [wsReady, pair, revert, sendJsonMessage]);
  // Orderbook related useEffect - END

  // web socket process messages for orderbook
  const processMessages = (event) => {
    const orderBook = JSON.parse(event.data);

    if (orderBook.hasOwnProperty('result') && orderBook.status === 'success') {
      const req = orderBook.id % 2;
      if (req === 1) {
        const parsed = formatOrderBook(orderBook.result.offers, ORDER_TYPE_ASKS);
        setAsks(parsed);
      }
      if (req === 0) {
        const parsed = formatOrderBook(orderBook.result.offers, ORDER_TYPE_BIDS);
        setBids(parsed);
      }
    }
  };

  return (
    <div className="overflow-x-hidden flex-1 min-h-screen">
      <Toolbar id="back-to-top-anchor" />
      <Header />

      <div className="max-w-7xl mx-auto py-2 sm:py-3 md:py-4 px-4">
        <div className="flex flex-col items-center justify-center gap-3 min-h-[calc(100vh-180px)] pt-1 sm:pt-0">
          <h1 className="text-3xl sm:text-4xl font-medium text-foreground mb-1">Swap</h1>
          <div className="w-full max-w-[800px]">
            <Swap pair={pair} setPair={setPair} revert={revert} setRevert={setRevert} />
          </div>
        </div>
      </div>
      <Footer />
      <ScrollToTop />
    </div>
  );
}

const formatOrderBook = (offers, orderType = ORDER_TYPE_BIDS) => {
  const data = [];
  if (offers && offers.length > 0)
    offers.forEach((offer) => {
      const direction = offer.Direction === 'sell' ? 'sell' : 'buy';
      let price = parseFloat(offer.quality) || 1;
      let quantity = parseFloat(offer.TakerGets) || 1;
      let total = parseFloat(offer.TakerPays) || 1;

      if (orderType === ORDER_TYPE_ASKS) {
        if (direction === 'sell') {
          if (typeof offer.TakerGets === 'object') {
            quantity = parseFloat(offer.TakerGets.value) || 0;
          }

          if (typeof offer.TakerPays === 'object') {
            total = parseFloat(offer.TakerPays.value) || 0;
          }

          price = total / quantity;
        }
      } else {
        if (direction === 'buy') {
          if (typeof offer.TakerGets === 'object') {
            total = parseFloat(offer.TakerGets.value) || 0;
          }

          if (typeof offer.TakerPays === 'object') {
            quantity = parseFloat(offer.TakerPays.value) || 0;
          }

          price = total / quantity;
        }
      }

      data.push({
        price: isNaN(price) ? 0 : price,
        quantity: isNaN(quantity) ? 0 : quantity,
        total: isNaN(total) ? 0 : total
      });
    });

  return data;
};

export default Overview;

export async function getStaticPaths() {
  // Return empty paths for now - we'll generate them on demand
  return {
    paths: [],
    fallback: 'blocking'
  };
}

export async function getStaticProps({ params }) {
  const startTime = performance.now();
  const BASE_URL = 'https://api.xrpl.to/api';

  let tokens = [];
  let metrics = null;

  try {
    // Fetch both tokens and metrics data
    const [tokensResponse, metricsResponse] = await Promise.all([
      axios.get(`${BASE_URL}/tokens?limit=100&offset=0`),
      axios.get(`${BASE_URL}/tokens?start=0&limit=100&sortBy=vol24hxrp&sortType=desc&filter=`)
    ]);

    if (tokensResponse.status === 200) {
      tokens = tokensResponse.data;
    }

    if (metricsResponse.status === 200) {
      metrics = metricsResponse.data;
      // Add bearbull calculation for tokens
      const time = Date.now();
      for (var token of metrics.tokens) {
        token.bearbull = token.pro24h < 0 ? -1 : 1;
        token.time = time;
      }
    }
  } catch (error) {
    console.log('Error fetching data:', error);
  }

  const duration = Math.round(performance.now() - startTime);

  // Provide the data structure that configureRedux expects
  const data = metrics || {
    tokens,
    total: 0,
    count: 0,
    exch: {
      USD: 100,
      EUR: 100,
      JPY: 100,
      CNY: 100
    },
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

  // Add OGP data for SEO
  const ogp = {
    canonical: 'https://xrpl.to/swap',
    title: 'Easily Swap XRP for Any Token on the XRPL',
    url: 'https://xrpl.to/swap/',
    imgUrl: 'https://xrpl.to/static/ogp.webp',
    desc: 'Effortlessly Exchange Tokens on the XRP Ledger with Our Seamless Swap Tool.'
  };

  return {
    props: {
      data,
      ogp
    },
    revalidate: 300 // revalidate every 5 minutes
  };
}
