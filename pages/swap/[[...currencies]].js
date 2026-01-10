import { useState, useEffect, useContext } from 'react';
import { Code2, Copy, Check } from 'lucide-react';

// Context
import { AppContext } from 'src/AppContext';

// Utils
import { cn } from 'src/utils/cn';

// Components
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
import Swap from 'src/components/SwapInterface';

const SWAP_API_ENDPOINTS = [
  { label: 'Token List', url: 'https://api.xrpl.to/api/tokens', params: 'start, limit, sortBy, sortType, filter' },
  { label: 'Token Detail', url: 'https://api.xrpl.to/api/token/{md5}' },
  { label: 'Orderbook', url: 'https://api.xrpl.to/api/orderbook/{base}/{quote}', params: 'limit' },
  { label: 'Rates', url: 'https://api.xrpl.to/api/rates' }
];

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
  const [showApi, setShowApi] = useState(false);
  const [copiedApiIdx, setCopiedApiIdx] = useState(null);

  return (
    <div className="flex flex-col h-screen overflow-hidden fixed top-0 left-0 right-0 bottom-0">
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
        <div className="relative">
          <Swap
            pair={pair}
            setPair={setPair}
            revert={revert}
            setRevert={setRevert}
          />
          {/* API Button */}
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
            <div className="relative">
              <button
                onClick={() => setShowApi(!showApi)}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-colors", isDark ? "text-[#3f96fe] border-[#3f96fe]/20 hover:bg-[#3f96fe]/10 bg-black/50" : "text-cyan-600 border-cyan-200 hover:bg-cyan-50 bg-white/80")}
              >
                <Code2 size={12} />
                API
              </button>
              {showApi && (
                <div className={cn('absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 rounded-xl border z-50 w-[300px]', isDark ? 'bg-black/95 backdrop-blur-xl border-[#3f96fe]/10 shadow-lg' : 'bg-white border-gray-200 shadow-lg')}>
                  <div className="text-[10px] uppercase tracking-wide mb-2" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>Swap API Endpoints</div>
                  {SWAP_API_ENDPOINTS.map((ep, idx) => (
                    <div key={ep.label} className={cn("mb-2 p-2 rounded-lg", isDark ? "bg-white/5" : "bg-gray-50")}>
                      <div className="flex justify-between items-center mb-1">
                        <span className={cn("text-[11px] font-medium", isDark ? "text-white" : "text-gray-900")}>{ep.label}</span>
                        <button onClick={() => { navigator.clipboard.writeText(ep.url); setCopiedApiIdx(idx); setTimeout(() => setCopiedApiIdx(null), 1500); }} className={cn("p-1", copiedApiIdx === idx ? "text-emerald-500" : (isDark ? "text-white/40" : "text-gray-400"))}>
                          {copiedApiIdx === idx ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      </div>
                      <code className={cn("text-[10px] break-all block", isDark ? "text-[#3f96fe]" : "text-cyan-600")}>{ep.url}</code>
                      {ep.params && <div className="text-[9px] mt-1" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>Params: {ep.params}</div>}
                    </div>
                  ))}
                  <a href="https://docs.xrpl.to" target="_blank" rel="noopener noreferrer" className={cn("block text-center text-[11px] mt-1", isDark ? "text-[#3f96fe]" : "text-cyan-600")}>Full API Docs →</a>
                </div>
              )}
            </div>
          </div>
        </div>
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