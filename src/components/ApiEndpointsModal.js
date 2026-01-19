import { memo, useState, useContext, useEffect } from 'react';
import { Code2, Copy, Check, X, ChevronDown, ChevronRight, Zap } from 'lucide-react';
import { AppContext } from 'src/AppContext';
import { cn } from 'src/utils/cn';
import axios from 'axios';

// Global store for tracked API calls
if (typeof window !== 'undefined') {
  window.__apiCallsStore = window.__apiCallsStore || new Set();
  window.__apiListeners = window.__apiListeners || [];

  if (!window.__apiInterceptorInstalled) {
    window.__apiInterceptorInstalled = true;
    axios.interceptors.request.use((config) => {
      const url = config.url || '';
      if (url.includes('api.xrpl.to/api/')) {
        const baseUrl = url.split('?')[0];
        window.__apiCallsStore.add(baseUrl);
        window.__apiListeners.forEach(l => l());
      }
      return config;
    });
  }
}

const getApiCalls = () => typeof window !== 'undefined' ? Array.from(window.__apiCallsStore || []) : [];
const subscribe = (listener) => {
  if (typeof window === 'undefined') return () => {};
  window.__apiListeners.push(listener);
  return () => { window.__apiListeners = window.__apiListeners.filter(l => l !== listener); };
};

// Comprehensive API Reference
const API_REFERENCE = {
  tokens: {
    label: 'Tokens',
    endpoints: [
      { method: 'GET', path: '/tokens', desc: 'List tokens with metrics, filtering, sorting' },
      { method: 'GET', path: '/tokens/slugs', desc: 'Get all token slugs' },
      { method: 'GET', path: '/token/:slug', desc: 'Token details by md5/slug/issuer_currency' },
      { method: 'POST', path: '/search', desc: 'Search tokens, NFTs, collections, accounts' },
      { method: 'GET', path: '/tags', desc: 'List all token tags/categories' },
    ]
  },
  charts: {
    label: 'Charts & Analytics',
    endpoints: [
      { method: 'GET', path: '/ohlc/:id', desc: 'OHLC candlestick data' },
      { method: 'GET', path: '/sparkline/:id', desc: 'Price sparkline for mini-charts' },
      { method: 'GET', path: '/rsi', desc: 'RSI indicator data' },
      { method: 'GET', path: '/stats', desc: 'Platform metrics (token count, volume)' },
      { method: 'GET', path: '/holders/info/:id', desc: 'Top holder concentration %' },
      { method: 'GET', path: '/holders/graph/:id', desc: 'Holder count history' },
      { method: 'GET', path: '/holders/list/:id', desc: 'Paginated richlist' },
    ]
  },
  trading: {
    label: 'Trading',
    endpoints: [
      { method: 'GET', path: '/history', desc: 'Trade history by token/account' },
      { method: 'GET', path: '/orderbook', desc: 'Live DEX orderbook (bids/asks)' },
      { method: 'GET', path: '/pairs', desc: 'Trading pairs for a token' },
      { method: 'POST', path: '/dex/quote', desc: 'Swap quote via ripple_path_find' },
    ]
  },
  amm: {
    label: 'AMM Pools',
    endpoints: [
      { method: 'GET', path: '/amm', desc: 'List AMM pools with metrics' },
      { method: 'GET', path: '/amm/info', desc: 'Live AMM pool info from XRPL' },
      { method: 'GET', path: '/amm/liquidity-chart', desc: 'Historical TVL chart data' },
    ]
  },
  account: {
    label: 'Account',
    endpoints: [
      { method: 'GET', path: '/account/balance/:account', desc: 'XRP balance with reserves' },
      { method: 'POST', path: '/account/balance', desc: 'Batch balance lookup (max 100)' },
      { method: 'GET', path: '/account/offers/:account', desc: 'Open DEX offers' },
      { method: 'GET', path: '/account/tx/:account', desc: 'Full transaction history' },
      { method: 'GET', path: '/account/trustlines/:account', desc: 'Live trustlines from XRPL' },
      { method: 'GET', path: '/account/nfts/:account', desc: 'NFTs owned by account' },
      { method: 'GET', path: '/trustlines/:account', desc: 'Trustlines with token values' },
    ]
  },
  ledger: {
    label: 'Ledger & Transactions',
    endpoints: [
      { method: 'GET', path: '/ledger', desc: 'Current validated ledger info' },
      { method: 'GET', path: '/ledger/:index', desc: 'Ledger by index with transactions' },
      { method: 'GET', path: '/tx/:hash', desc: 'Transaction by hash' },
      { method: 'POST', path: '/submit', desc: 'Submit signed transaction' },
      { method: 'POST', path: '/submit/simulate', desc: 'Dry-run transaction simulation' },
      { method: 'GET', path: '/submit/fee', desc: 'Current network fees' },
    ]
  },
  ai: {
    label: 'AI Analysis',
    endpoints: [
      { method: 'GET', path: '/tx-explain/:hash', desc: 'AI transaction explanation' },
      { method: 'GET', path: '/ai/token/:md5', desc: 'AI token risk analysis' },
      { method: 'GET', path: '/account-tx-explain/:account', desc: 'AI wallet activity analysis' },
    ]
  },
  traders: {
    label: 'Traders',
    endpoints: [
      { method: 'GET', path: '/traders/:address', desc: 'Full trader profile' },
      { method: 'GET', path: '/traders/token-traders/:id', desc: 'Top traders for token' },
      { method: 'GET', path: '/token/analytics/traders', desc: 'All traders with stats' },
      { method: 'GET', path: '/token/analytics/market', desc: 'Daily market metrics' },
    ]
  },
  nft: {
    label: 'NFTs',
    endpoints: [
      { method: 'GET', path: '/nft', desc: 'List NFTs' },
      { method: 'GET', path: '/nft/:nftId', desc: 'NFT by NFTokenID' },
      { method: 'GET', path: '/nft/:nftId/offers', desc: 'Buy/sell offers for NFT' },
      { method: 'GET', path: '/nft/collections', desc: 'List NFT collections' },
      { method: 'GET', path: '/nft/collections/:slug', desc: 'Collection details' },
      { method: 'GET', path: '/nft/collections/:slug/nfts', desc: 'NFTs in collection' },
      { method: 'GET', path: '/nft/collections/:slug/floor/history', desc: 'Floor price history' },
      { method: 'GET', path: '/nft/account/:address/nfts', desc: 'NFTs owned with portfolio value' },
      { method: 'GET', path: '/nft/analytics/traders', desc: 'NFT trader leaderboard' },
      { method: 'GET', path: '/nft/analytics/market', desc: 'NFT market analytics' },
    ]
  },
  news: {
    label: 'News',
    endpoints: [
      { method: 'GET', path: '/news', desc: 'Latest news with sentiment' },
      { method: 'GET', path: '/news/search', desc: 'Search news articles' },
      { method: 'GET', path: '/news/sentiment-chart', desc: 'Sentiment chart data' },
    ]
  },
  bridge: {
    label: 'Bridge',
    endpoints: [
      { method: 'GET', path: '/bridge/currencies', desc: 'Available currencies' },
      { method: 'GET', path: '/bridge/estimate', desc: 'Exchange rate estimate' },
      { method: 'POST', path: '/bridge/create', desc: 'Create exchange transaction' },
      { method: 'GET', path: '/bridge/status', desc: 'Exchange status by ID' },
    ]
  },
};

const ApiEndpointsModal = memo(({ open, onClose }) => {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [copiedPath, setCopiedPath] = useState(null);
  const [detectedEndpoints, setDetectedEndpoints] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [view, setView] = useState('detected'); // 'detected' or 'all'

  useEffect(() => {
    if (!open) return;
    setDetectedEndpoints(getApiCalls());
    const unsub = subscribe(() => setDetectedEndpoints(getApiCalls()));
    return unsub;
  }, [open]);

  if (!open) return null;

  const handleCopy = (path) => {
    navigator.clipboard.writeText(`https://api.xrpl.to/api${path}`);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 1500);
  };

  const toggleCategory = (key) => {
    setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isDetected = (path) => {
    return detectedEndpoints.some(url => {
      const urlPath = url.replace('https://api.xrpl.to/api', '').split('?')[0];
      const pattern = path.replace(/:[^/]+/g, '[^/]+');
      return new RegExp(`^${pattern}$`).test(urlPath);
    });
  };

  const getDetectedLabel = (url) => {
    const path = url.replace('https://api.xrpl.to/api/', '').split('?')[0];
    const parts = path.split('/');
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className={cn("fixed inset-0", isDark ? "bg-black/70" : "bg-black/30")} />
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative rounded-xl border w-full max-w-[420px] max-h-[85vh] overflow-hidden flex flex-col',
          isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-gray-200'
        )}
      >
        {/* Header */}
        <div className={cn("px-4 py-3 border-b shrink-0", isDark ? "border-white/10" : "border-gray-100")}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 size={14} className={isDark ? "text-[#3f96fe]" : "text-cyan-600"} />
              <span className={cn("text-[13px] font-medium", isDark ? "text-white" : "text-gray-900")}>
                API Reference
              </span>
              <span className="px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider rounded bg-amber-500/15 text-amber-500">
                For Developers
              </span>
            </div>
            <button onClick={onClose} className={cn("p-1.5 rounded-lg", isDark ? "hover:bg-white/10" : "hover:bg-gray-100")}>
              <X size={14} className={isDark ? "text-white/40" : "text-gray-400"} />
            </button>
          </div>

          {/* Tab Toggle */}
          <div className={cn("flex mt-3 p-0.5 rounded-lg", isDark ? "bg-white/5" : "bg-gray-100")}>
            <button
              onClick={() => setView('detected')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-medium transition-colors",
                view === 'detected'
                  ? (isDark ? "bg-[#3f96fe] text-white" : "bg-white text-gray-900 shadow-sm")
                  : (isDark ? "text-white/50 hover:text-white/70" : "text-gray-500 hover:text-gray-700")
              )}
            >
              <Zap size={11} />
              This Page ({detectedEndpoints.length})
            </button>
            <button
              onClick={() => setView('all')}
              className={cn(
                "flex-1 py-1.5 rounded-md text-[11px] font-medium transition-colors",
                view === 'all'
                  ? (isDark ? "bg-[#3f96fe] text-white" : "bg-white text-gray-900 shadow-sm")
                  : (isDark ? "text-white/50 hover:text-white/70" : "text-gray-500 hover:text-gray-700")
              )}
            >
              All Endpoints
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {view === 'detected' ? (
            <div className="p-3 space-y-2">
              {detectedEndpoints.length === 0 ? (
                <div className={cn("text-center py-8", isDark ? "text-white/40" : "text-gray-400")}>
                  <Code2 size={24} className="mx-auto mb-2 opacity-50" />
                  <div className="text-[12px]">No API calls detected yet</div>
                  <div className="text-[10px] mt-1 opacity-70">Interact with the page to see endpoints</div>
                </div>
              ) : (
                detectedEndpoints.map((url) => (
                  <div key={url} className={cn("p-2.5 rounded-lg", isDark ? "bg-white/5" : "bg-gray-50")}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 text-[9px] font-medium rounded bg-emerald-500/15 text-emerald-500">GET</span>
                        <span className={cn("text-[11px] font-medium", isDark ? "text-white" : "text-gray-900")}>
                          {getDetectedLabel(url)}
                        </span>
                      </div>
                      <button
                        onClick={() => { navigator.clipboard.writeText(url); setCopiedPath(url); setTimeout(() => setCopiedPath(null), 1500); }}
                        className={cn("p-1", copiedPath === url ? "text-emerald-500" : (isDark ? "text-white/40 hover:text-white/60" : "text-gray-400 hover:text-gray-600"))}
                      >
                        {copiedPath === url ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </div>
                    <code className={cn("text-[10px] break-all block", isDark ? "text-[#3f96fe]" : "text-cyan-600")}>
                      {url.replace('https://api.xrpl.to', '')}
                    </code>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="p-2">
              {Object.entries(API_REFERENCE).map(([key, category]) => {
                const isExpanded = expandedCategories[key];
                const detectedCount = category.endpoints.filter(ep => isDetected(ep.path)).length;

                return (
                  <div key={key} className="mb-1">
                    <button
                      onClick={() => toggleCategory(key)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-colors",
                        isDark ? "hover:bg-white/5" : "hover:bg-gray-50"
                      )}
                    >
                      {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      <span className={cn("text-[11px] font-medium flex-1", isDark ? "text-white" : "text-gray-900")}>
                        {category.label}
                      </span>
                      <span className={cn("text-[10px]", isDark ? "text-white/40" : "text-gray-400")}>
                        {category.endpoints.length}
                      </span>
                      {detectedCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[9px] font-medium rounded bg-emerald-500/15 text-emerald-500">
                          {detectedCount} used
                        </span>
                      )}
                    </button>

                    {isExpanded && (
                      <div className="ml-4 mt-1 space-y-1">
                        {category.endpoints.map((ep) => {
                          const detected = isDetected(ep.path);
                          return (
                            <div
                              key={ep.path}
                              className={cn(
                                "flex items-start gap-2 px-2.5 py-2 rounded-lg group",
                                detected ? (isDark ? "bg-emerald-500/10" : "bg-emerald-50") : (isDark ? "bg-white/[0.02]" : "bg-gray-50/50")
                              )}
                            >
                              <span className={cn(
                                "px-1.5 py-0.5 text-[9px] font-medium rounded shrink-0 mt-0.5",
                                ep.method === 'GET' ? "bg-emerald-500/15 text-emerald-500" : "bg-amber-500/15 text-amber-500"
                              )}>
                                {ep.method}
                              </span>
                              <div className="flex-1 min-w-0">
                                <code className={cn(
                                  "text-[10px] block",
                                  detected ? "text-emerald-400" : (isDark ? "text-[#3f96fe]" : "text-cyan-600")
                                )}>
                                  {ep.path}
                                </code>
                                <div className={cn("text-[10px] mt-0.5", isDark ? "text-white/40" : "text-gray-500")}>
                                  {ep.desc}
                                </div>
                              </div>
                              <button
                                onClick={() => handleCopy(ep.path)}
                                className={cn(
                                  "p-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0",
                                  copiedPath === ep.path ? "text-emerald-500 opacity-100" : (isDark ? "text-white/40" : "text-gray-400")
                                )}
                              >
                                {copiedPath === ep.path ? <Check size={11} /> : <Copy size={11} />}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={cn("px-4 py-3 border-t shrink-0", isDark ? "border-white/10" : "border-gray-100")}>
          <div className="flex items-center gap-2">
            <code className={cn("flex-1 text-[10px] px-2 py-1.5 rounded", isDark ? "bg-white/5 text-white/60" : "bg-gray-100 text-gray-600")}>
              https://api.xrpl.to/api/...
            </code>
            <a
              href="https://xrpl.to/docs"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-colors",
                isDark ? "text-[#3f96fe] border-[#3f96fe]/20 hover:bg-[#3f96fe]/10" : "text-cyan-600 border-cyan-200 hover:bg-cyan-50"
              )}
            >
              Full Docs
            </a>
          </div>
        </div>
      </div>
    </div>
  );
});

// Standalone button + modal combo
export const ApiButton = memo(({ className = '' }) => {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "group relative flex h-8 items-center gap-1.5 rounded-lg px-3 text-[11px] font-medium transition-all duration-300 overflow-hidden",
          isDark
            ? "bg-[#0d0d1a] text-blue-300 border border-blue-500/30 hover:border-blue-400/50 hover:text-white hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
            : "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-600 border border-blue-200 hover:from-blue-100 hover:to-cyan-100 hover:border-blue-300",
          className
        )}
      >
        {isDark && (
          <>
            <span className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-cyan-500/20 to-blue-400/20 animate-[shimmer_3s_ease-in-out_infinite]" />
            <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.15),transparent_50%)]" />
          </>
        )}
        <Code2 size={12} className="relative z-10" />
        <span className="relative z-10">API</span>
      </button>
      <ApiEndpointsModal open={open} onClose={() => setOpen(false)} />
    </>
  );
});

export const clearApiCalls = () => {
  if (typeof window !== 'undefined') {
    window.__apiCallsStore?.clear();
    window.__apiListeners?.forEach(l => l());
  }
};

ApiEndpointsModal.displayName = 'ApiEndpointsModal';
ApiButton.displayName = 'ApiButton';

export default ApiEndpointsModal;
export { getApiCalls };
