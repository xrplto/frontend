import { useState, useEffect, useContext } from 'react';

// Context
import { WalletContext } from 'src/context/AppContext';

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
  const { accountProfile } = useContext(WalletContext);

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

  return (
    <div className="flex flex-col h-dvh overflow-hidden fixed top-0 left-0 right-0 bottom-0" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <Header
        notificationPanelOpen={notificationPanelOpen}
        onNotificationPanelToggle={setNotificationPanelOpen}
      />
      <h1
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          whiteSpace: 'nowrap',
          border: 0
        }}
      >
        Swap XRPL Tokens
      </h1>

      {/* Spacer for fixed header (52px) */}
      <div className="flex-shrink-0 h-[52px]" />

      <div className="flex-1 flex items-start justify-center overflow-y-auto overflow-x-hidden px-4 py-2 sm:py-4">
        <Swap pair={pair} setPair={setPair} revert={revert} setRevert={setRevert} />
      </div>

      <Footer />
      <ScrollToTop />
    </div>
  );
}

export default SwapPage;

export async function getServerSideProps({ res }) {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  const BASE_URL = 'https://api.xrpl.to/v1';

  let metrics = null;

  try {
    const metricsResponse = await api.get(
      `${BASE_URL}/tokens?start=0&limit=50&sortBy=vol24hxrp&sortType=desc&filter=`,
      { timeout: 8000 }
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
    }
  };

  const ogp = {
    canonical: 'https://xrpl.to/swap',
    title: 'Easily Swap XRP for Any Token on the XRPL',
    url: 'https://xrpl.to/swap/',
    imgUrl: 'https://xrpl.to/api/og/swap',
    imgType: 'image/png',
    desc: 'Effortlessly Exchange Tokens on the XRP Ledger with Our Seamless Swap Tool.'
  };

  return {
    props: { data, ogp }
  };
}
