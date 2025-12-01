import axios from 'axios';
import { performance } from 'perf_hooks';
import { useState, useEffect, useContext } from 'react';

// Context
import { AppContext } from 'src/AppContext';

// Utils
import { cn } from 'src/utils/cn';

// Components
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
import Swap from 'src/components/SwapInterface';

// Default tokens with correct md5 hashes
const XRP_TOKEN = {
  currency: 'XRP',
  issuer: 'XRPL',
  md5: '84e5efeb89c4eae8f68188982dc290d8',
  name: 'XRP'
};
const RLUSD_TOKEN = {
  currency: '524C555344000000000000000000000000000000',
  issuer: 'rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De',
  md5: '0dd550278b74cb6690fdae351e8e0df3',
  name: 'RLUSD'
};
const DEFAULT_PAIR = {
  curr1: XRP_TOKEN,
  curr2: RLUSD_TOKEN
};

function SwapPage({ data }) {
  const { accountProfile, themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const [revert, setRevert] = useState(false);
  const [pair, setPair] = useState(DEFAULT_PAIR);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [bids, setBids] = useState([]);
  const [asks, setAsks] = useState([]);

  // Orderbook REST API polling
  useEffect(() => {
    const controller = new AbortController();

    async function fetchOrderbook() {
      const curr1 = pair.curr1;
      const curr2 = pair.curr2;

      // Determine base/quote - XRP is typically the base
      const isXrpBase = curr1.currency === 'XRP';
      const base = isXrpBase ? curr1 : curr2;
      const quote = isXrpBase ? curr2 : curr1;

      try {
        const params = new URLSearchParams({
          base_currency: base.currency,
          quote_currency: quote.currency,
          limit: '60'
        });
        if (base.issuer) params.append('base_issuer', base.issuer);
        if (quote.issuer) params.append('quote_issuer', quote.issuer);

        const res = await axios.get(`https://api.xrpl.to/api/orderbook?${params}`, {
          signal: controller.signal
        });

        if (res.data?.success) {
          const parsedBids = (res.data.bids || []).map(o => ({
            price: parseFloat(o.price),
            amount: parseFloat(o.amount),
            total: parseFloat(o.total),
            account: o.account
          })).filter(o => !isNaN(o.price) && o.price > 0);

          const parsedAsks = (res.data.asks || []).map(o => ({
            price: parseFloat(o.price),
            amount: parseFloat(o.amount),
            total: parseFloat(o.total),
            account: o.account
          })).filter(o => !isNaN(o.price) && o.price > 0);

          setBids(isXrpBase ? parsedBids : parsedAsks);
          setAsks(isXrpBase ? parsedAsks : parsedBids);
        }
      } catch (err) {
        if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
          console.error('Orderbook fetch error:', err);
        }
      }
    }

    fetchOrderbook();
    const timer = setInterval(fetchOrderbook, 4000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [pair, revert]);

  return (
    <div className="flex flex-col h-screen overflow-hidden fixed top-0 left-0 right-0 bottom-0">
      <div id="back-to-top-anchor" className="h-16" />
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

      <div className="flex-1 flex items-center justify-center overflow-hidden px-4">
        <Swap
          pair={pair}
          setPair={setPair}
          revert={revert}
          setRevert={setRevert}
          bids={bids}
          asks={asks}
        />
      </div>

      <Footer />
      <ScrollToTop />
    </div>
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