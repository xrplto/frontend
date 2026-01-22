import { memo, useState, useContext, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/router';
import {
  Code2,
  Copy,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Zap,
  ExternalLink,
  Play,
  Loader2
} from 'lucide-react';
import { AppContext } from 'src/AppContext';
import { cn } from 'src/utils/cn';
import axios from 'axios';

// JSON syntax highlighter
const JsonHighlight = ({ data, maxLen = 500 }) => {
  const str = JSON.stringify(data, null, 2);
  const truncated = str.slice(0, maxLen);
  const parts = truncated.split(/("(?:[^"\\]|\\.)*"|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;
        if (/^".*":?$/.test(part)) {
          const isKey = part.endsWith(':') || (parts[i + 1] && parts[i + 1].trim().startsWith(':'));
          return <span key={i} style={{ color: isKey ? '#60a5fa' : '#22c55e' }}>{part}</span>;
        }
        if (/^(true|false)$/.test(part)) return <span key={i} style={{ color: '#f59e0b' }}>{part}</span>;
        if (/^null$/.test(part)) return <span key={i} style={{ color: '#ef4444' }}>{part}</span>;
        if (/^-?\d/.test(part)) return <span key={i} style={{ color: '#a78bfa' }}>{part}</span>;
        return <span key={i}>{part}</span>;
      })}
      {str.length > maxLen && '...'}
    </>
  );
};

// Global store for tracked API calls
if (typeof window !== 'undefined') {
  window.__apiCallsStore = window.__apiCallsStore || new Set();
  window.__apiListeners = window.__apiListeners || [];

  if (!window.__apiInterceptorInstalled) {
    window.__apiInterceptorInstalled = true;
    axios.interceptors.request.use((config) => {
      const url = config.url || '';
      if (url.includes('api.xrpl.to/v1/')) {
        const baseUrl = url.split('?')[0];
        window.__apiCallsStore.add(baseUrl);
        window.__apiListeners.forEach((l) => l());
      }
      return config;
    });
  }
}

const getApiCalls = () =>
  typeof window !== 'undefined' ? Array.from(window.__apiCallsStore || []) : [];
const subscribe = (listener) => {
  if (typeof window === 'undefined') return () => {};
  window.__apiListeners.push(listener);
  return () => {
    window.__apiListeners = window.__apiListeners.filter((l) => l !== listener);
  };
};

// Register API calls manually (for server-side fetched endpoints)
export const registerApiCalls = (urls) => {
  if (typeof window === 'undefined') return;
  const arr = Array.isArray(urls) ? urls : [urls];
  arr.forEach((url) => {
    if (url.includes('api.xrpl.to/v1/')) {
      window.__apiCallsStore.add(url.split('?')[0]);
    }
  });
  window.__apiListeners.forEach((l) => l());
};

// Comprehensive API Reference - Single source of truth
export const API_REFERENCE = {
  health: {
    label: 'Health & Docs',
    endpoints: [
      { method: 'GET', path: '/health', desc: 'Service health check' },
      { method: 'GET', path: '/docs', desc: 'API documentation JSON' }
    ]
  },
  tokens: {
    label: 'Tokens',
    endpoints: [
      { method: 'GET', path: '/tokens', desc: 'List tokens with metrics, filtering, sorting' },
      { method: 'GET', path: '/tokens/slugs', desc: 'Get all token slugs' },
      {
        method: 'GET',
        path: '/token/:id',
        desc: 'Token details by md5, slug (issuer-currency), or issuer_currency'
      },
      { method: 'POST', path: '/search', desc: 'Search tokens, NFTs, collections, accounts' },
      { method: 'GET', path: '/tags', desc: 'List all token tags' },
      { method: 'GET', path: '/creators/:address', desc: 'Token creator profile and tokens' }
    ]
  },
  charts: {
    label: 'Charts & Analytics',
    endpoints: [
      { method: 'GET', path: '/ohlc/:md5', desc: 'OHLC candlestick data (DexScreener compatible)' },
      { method: 'GET', path: '/sparkline/:md5', desc: 'Price sparkline for mini-charts' },
      { method: 'GET', path: '/rsi', desc: 'RSI indicator data for tokens' },
      { method: 'GET', path: '/stats', desc: 'Platform metrics (token count, 24h volume)' },
      { method: 'GET', path: '/holders/info/:md5', desc: 'Top holder concentration percentages' },
      { method: 'GET', path: '/holders/graph/:md5', desc: 'Holder count history graph' },
      {
        method: 'GET',
        path: '/holders/list/:md5',
        desc: 'Paginated richlist with acquisition source'
      }
    ]
  },
  trading: {
    label: 'Trading',
    endpoints: [
      { method: 'GET', path: '/history', desc: 'Trade history by token/account' },
      {
        method: 'GET',
        path: '/orderbook',
        desc: 'Live orderbook (base, quote: md5/slug/issuer_currency)'
      },
      { method: 'GET', path: '/pairs/:md5', desc: 'Trading pairs for a token' },
      {
        method: 'POST',
        path: '/dex/quote',
        desc: 'Swap quote (source_token, destination_token: md5/slug/issuer_currency)'
      },
      {
        method: 'GET',
        path: '/stats/rates',
        desc: 'Exchange rates (token1, token2: md5/slug/issuer_currency)'
      }
    ]
  },
  amm: {
    label: 'AMM Pools',
    endpoints: [
      { method: 'GET', path: '/amm', desc: 'List AMM pools (token: md5 to filter)' },
      {
        method: 'GET',
        path: '/amm/info',
        desc: 'Pool info (asset, asset2: md5/slug/issuer_currency)'
      },
      {
        method: 'GET',
        path: '/amm/liquidity-chart',
        desc: 'TVL history (token: md5/slug/issuer_currency)'
      }
    ]
  },
  account: {
    label: 'Account',
    endpoints: [
      {
        method: 'GET',
        path: '/account/balance/:account',
        desc: 'XRP balance with reserves and rank'
      },
      { method: 'POST', path: '/account/balance', desc: 'Batch balance lookup (max 100)' },
      { method: 'GET', path: '/account/offers/:account', desc: 'Open DEX offers' },
      { method: 'GET', path: '/account/tx/:account', desc: 'Full tx history via Clio' },
      { method: 'GET', path: '/account/trustlines/:account', desc: 'Live trustlines from XRPL' },
      {
        method: 'GET',
        path: '/account/objects/:account',
        desc: 'Account objects (escrows, checks, etc.)'
      },
      {
        method: 'GET',
        path: '/account/currencies/:account',
        desc: 'Sendable/receivable currencies'
      },
      { method: 'GET', path: '/account/nfts/:account', desc: 'NFTs owned by account' },
      {
        method: 'GET',
        path: '/account/gateway/:account',
        desc: 'Gateway balances (issuer totals)'
      },
      { method: 'GET', path: '/account/noripple/:account', desc: 'NoRipple check for trustlines' },
      { method: 'GET', path: '/account/channels/:account', desc: 'Payment channels' },
      { method: 'GET', path: '/account/info/live/:account', desc: 'Live account info from XRPL' },
      { method: 'GET', path: '/account/deposit-authorized', desc: 'Check deposit authorization' },
      { method: 'POST', path: '/account/path-find', desc: 'Find payment paths' },
      { method: 'GET', path: '/trustlines/:account', desc: 'Trustlines with token values' },
      { method: 'GET', path: '/watchlist', desc: 'User watchlist tokens' }
    ]
  },
  ledger: {
    label: 'Ledger & Transactions',
    endpoints: [
      { method: 'GET', path: '/ledger', desc: 'Current validated ledger info' },
      { method: 'GET', path: '/ledger/:index', desc: 'Ledger by index with transactions' },
      { method: 'GET', path: '/ledger/entry', desc: 'Fetch specific ledger object' },
      { method: 'GET', path: '/tx/:hash', desc: 'Transaction by hash (with fallback nodes)' },
      { method: 'POST', path: '/submit', desc: 'Submit signed transaction' },
      { method: 'POST', path: '/submit/simulate', desc: 'Dry-run transaction simulation' },
      { method: 'GET', path: '/submit/types', desc: 'List valid transaction types' },
      { method: 'GET', path: '/submit/fee', desc: 'Current network fees' },
      { method: 'GET', path: '/submit/account/:address/sequence', desc: 'Account sequence number' }
    ]
  },
  ai: {
    label: 'AI Analysis',
    endpoints: [
      { method: 'GET', path: '/tx-explain/:hash', desc: 'AI-generated transaction explanation' },
      {
        method: 'GET',
        path: '/tx-explain/stats',
        desc: 'AI provider stats and circuit breaker status'
      },
      { method: 'GET', path: '/ai/token/:md5', desc: 'AI token risk analysis (safety score)' },
      { method: 'GET', path: '/account-tx-explain/:account', desc: 'AI wallet activity analysis' }
    ]
  },
  traders: {
    label: 'Traders',
    endpoints: [
      { method: 'GET', path: '/traders/:address', desc: 'Full trader profile with all tokens' },
      {
        method: 'GET',
        path: '/traders/token-traders/:md5',
        desc: 'Top traders for a specific token'
      }
    ]
  },
  tokenAnalytics: {
    label: 'Token Analytics',
    endpoints: [
      {
        method: 'GET',
        path: '/token/analytics/traders',
        desc: 'All traders with cumulative stats'
      },
      { method: 'GET', path: '/token/analytics/trader/:address', desc: 'Trader cumulative stats' },
      {
        method: 'GET',
        path: '/token/analytics/trader/:address/tokens',
        desc: 'Trader token-specific metrics'
      },
      {
        method: 'GET',
        path: '/token/analytics/trader/:address/history',
        desc: 'Trader volume history'
      },
      {
        method: 'GET',
        path: '/token/analytics/trader/:address/trades',
        desc: 'Trader trade history'
      },
      { method: 'GET', path: '/token/analytics/token/:md5', desc: 'Token analytics' },
      { method: 'GET', path: '/token/analytics/token/:md5/traders', desc: 'Top traders for token' },
      { method: 'GET', path: '/token/analytics/traders/summary', desc: 'Trader balance snapshots' },
      {
        method: 'GET',
        path: '/token/analytics/market',
        desc: 'Daily market metrics with platform breakdown'
      }
    ]
  },
  nft: {
    label: 'NFTs',
    endpoints: [
      { method: 'GET', path: '/nft', desc: 'List NFTs' },
      { method: 'GET', path: '/nft/:nftId', desc: 'NFT by NFTokenID' },
      { method: 'GET', path: '/nft/:nftId/offers', desc: 'Buy/sell offers for NFT' },
      { method: 'GET', path: '/nft/history', desc: 'NFT history from database' },
      { method: 'GET', path: '/nft/history/:nftId', desc: 'Live NFT history from Clio' },
      { method: 'GET', path: '/nft/activity', desc: 'Recent NFT activity feed' },
      { method: 'GET', path: '/nft/transactions/:hash', desc: 'NFT transaction by hash' },
      { method: 'GET', path: '/nft/offers/buy/:nftId', desc: 'Live buy offers from XRPL' },
      { method: 'GET', path: '/nft/offers/sell/:nftId', desc: 'Live sell offers from XRPL' },
      { method: 'GET', path: '/nft/collections', desc: 'List NFT collections' },
      { method: 'GET', path: '/nft/collections/:slug', desc: 'Collection details' },
      {
        method: 'GET',
        path: '/nft/collections/:slug/nfts',
        desc: 'NFTs in collection (with trait filters)'
      },
      { method: 'GET', path: '/nft/collections/:slug/traits', desc: 'Collection trait breakdown' },
      { method: 'GET', path: '/nft/collections/:slug/traders', desc: 'Top traders for collection' },
      { method: 'GET', path: '/nft/collections/:slug/orderbook', desc: 'Collection orderbook' },
      {
        method: 'GET',
        path: '/nft/collections/:slug/metrics',
        desc: 'Collection historical metrics'
      },
      {
        method: 'GET',
        path: '/nft/collections/:slug/history',
        desc: 'Collection activity history'
      },
      { method: 'GET', path: '/nft/collections/:slug/floor/history', desc: 'Floor price history' },
      { method: 'GET', path: '/nft/collections/:slug/ohlc', desc: 'Collection OHLC chart data' },
      { method: 'GET', path: '/nft/collections/:slug/ohlc/:date/sales', desc: 'Collection sales for specific date' },
      { method: 'GET', path: '/nft/holders/:slug', desc: 'Collection holder list with pagination' },
      { method: 'GET', path: '/nft/holders/:slug/distribution', desc: 'Collection holder distribution stats' },
      { method: 'GET', path: '/nft/holders/address/:address', desc: 'NFT holdings for specific address' },
      { method: 'GET', path: '/nft/analytics/collection/:slug/traders', desc: 'Collection top traders analytics' },
      {
        method: 'GET',
        path: '/nft/collections/:slug/sparkline',
        desc: 'Collection floor sparkline'
      },
      { method: 'GET', path: '/nft/collections/:slug/ownership', desc: 'Ownership distribution' },
      { method: 'GET', path: '/nft/traders/:account/volume', desc: 'Trader volume stats' },
      {
        method: 'GET',
        path: '/nft/account/:address/nfts',
        desc: 'NFTs/collections owned with portfolio value'
      },
      { method: 'GET', path: '/nft/account/:address/offers', desc: "Account's NFT offers" },
      { method: 'GET', path: '/nft/stats/global', desc: 'Global NFT market stats' },
      { method: 'GET', path: '/nft/global-metrics', desc: 'Global NFT metrics' },
      { method: 'GET', path: '/nft/brokers/stats', desc: 'Broker fee statistics' }
    ]
  },
  nftAnalytics: {
    label: 'NFT Analytics',
    endpoints: [
      { method: 'GET', path: '/nft/analytics/traders', desc: 'NFT trader leaderboard' },
      { method: 'GET', path: '/nft/analytics/trader/:address', desc: 'NFT trader profile' },
      {
        method: 'GET',
        path: '/nft/analytics/trader/:address/history',
        desc: 'NFT trader daily history'
      },
      {
        method: 'GET',
        path: '/nft/analytics/trader/:address/collections',
        desc: 'NFT trader collection breakdown'
      },
      {
        method: 'GET',
        path: '/nft/analytics/trader/:address/trades',
        desc: 'NFT trader trade history'
      },
      {
        method: 'GET',
        path: '/nft/analytics/collection/:slug/traders',
        desc: 'Collection trader analytics'
      },
      {
        method: 'GET',
        path: '/nft/analytics/market',
        desc: 'NFT market analytics with platform breakdown'
      }
    ]
  },
  bridge: {
    label: 'Bridge',
    endpoints: [
      { method: 'GET', path: '/bridge/currencies', desc: 'Available currencies for exchange' },
      { method: 'GET', path: '/bridge/estimate', desc: 'Exchange rate estimate' },
      { method: 'GET', path: '/bridge/min-amount', desc: 'Minimum exchange amount' },
      { method: 'POST', path: '/bridge/create', desc: 'Create exchange transaction' },
      { method: 'GET', path: '/bridge/status', desc: 'Exchange status by ID' },
      { method: 'GET', path: '/bridge/validate-address', desc: 'Validate crypto address' }
    ]
  },
  news: {
    label: 'News',
    endpoints: [
      { method: 'GET', path: '/news', desc: 'Latest XRP news with sentiment analysis' },
      { method: 'GET', path: '/news/search', desc: 'Search news articles' },
      { method: 'GET', path: '/news/unapproved-sources', desc: 'List unapproved news sources' },
      { method: 'GET', path: '/news/sentiment-chart', desc: 'Sentiment chart data' }
    ]
  }
};

// Get total endpoint count
export const getTotalEndpointCount = () => {
  return Object.values(API_REFERENCE).reduce((sum, cat) => sum + cat.endpoints.length, 0);
};

// Page-based endpoint mapping for reliable "This Page" display
export const PAGE_ENDPOINTS = {
  '/': ['/tokens', '/sparkline/:md5', '/tags', '/stats'],
  '/new': ['/tokens', '/sparkline/:md5', '/tags'],
  '/trending': ['/tokens', '/sparkline/:md5', '/tags'],
  '/gainers': ['/tokens', '/sparkline/:md5', '/tags'],
  '/spotlight': ['/tokens', '/sparkline/:md5', '/tags'],
  '/watchlist': ['/tokens', '/watchlist', '/sparkline/:md5'],
  '/token/[slug]': ['/token/:id', '/ohlc/:md5', '/sparkline/:md5', '/holders/info/:md5', '/holders/graph/:md5', '/holders/list/:md5', '/history', '/pairs/:md5', '/orderbook', '/traders/token-traders/:md5', '/amm', '/ai/token/:md5', '/dex/quote', '/stats/rates'],
  '/amm': ['/amm', '/amm/info', '/amm/liquidity-chart'],
  '/nfts': ['/nft/collections', '/nft/stats/global'],
  '/nfts/[slug]': ['/nft/collections/:slug', '/nft/collections/:slug/nfts', '/nft/collections/:slug/traits', '/nft/collections/:slug/ohlc', '/nft/collections/:slug/ohlc/:date/sales', '/nft/holders/:slug', '/nft/holders/:slug/distribution', '/nft/analytics/collection/:slug/traders'],
  '/address/[...acct]': ['/account/balance/:account', '/account/info/live/:account', '/trustlines/:account', '/traders/:address', '/history', '/nft/account/:address/nfts', '/nft/analytics/trader/:address', '/nft/analytics/trader/:address/collections', '/nft/analytics/trader/:address/history', '/nft/analytics/trader/:address/trades', '/account-tx-explain/:account'],
  '/traders': ['/token/analytics/traders', '/token/analytics/market'],
  '/trader/[address]': ['/traders/:address', '/token/analytics/trader/:address', '/token/analytics/trader/:address/tokens', '/token/analytics/trader/:address/history'],
  '/news': ['/news', '/news/search', '/news/sentiment-chart']
};

const ApiEndpointsModal = memo(({ open, onClose }) => {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const router = useRouter();
  const [copiedPath, setCopiedPath] = useState(null);
  const [detectedEndpoints, setDetectedEndpoints] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [view, setView] = useState('detected');
  const [search, setSearch] = useState('');
  const [loadingPath, setLoadingPath] = useState(null);
  const [copiedResponse, setCopiedResponse] = useState(null);
  const [responsePreview, setResponsePreview] = useState(null);

  // Get page-specific endpoints based on current route
  const pageEndpoints = useMemo(() => {
    const pathname = router.pathname;
    // Direct match
    if (PAGE_ENDPOINTS[pathname]) return PAGE_ENDPOINTS[pathname];
    // Pattern match for dynamic routes
    const patterns = Object.keys(PAGE_ENDPOINTS);
    for (const pattern of patterns) {
      const regex = new RegExp('^' + pattern.replace(/\[.*?\]/g, '[^/]+') + '$');
      if (regex.test(pathname)) return PAGE_ENDPOINTS[pattern];
    }
    return PAGE_ENDPOINTS['/'] || [];
  }, [router.pathname]);

  // Get endpoint details from API_REFERENCE
  const pageEndpointDetails = useMemo(() => {
    const details = [];
    for (const path of pageEndpoints) {
      for (const cat of Object.values(API_REFERENCE)) {
        const ep = cat.endpoints.find((e) => e.path === path);
        if (ep) {
          details.push(ep);
          break;
        }
      }
    }
    return details;
  }, [pageEndpoints]);

  useEffect(() => {
    if (!open) return;
    setDetectedEndpoints(getApiCalls());
    const unsub = subscribe(() => setDetectedEndpoints(getApiCalls()));
    return unsub;
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  const handleCopy = (path) => {
    navigator.clipboard.writeText(`https://api.xrpl.to/v1${path}`);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 1500);
  };

  const tryAndCopy = async (ep) => {
    if (ep.method !== 'GET' || ep.path.includes(':')) return;
    setLoadingPath(ep.path);
    try {
      const res = await axios.get(`https://api.xrpl.to/v1${ep.path}`);
      await navigator.clipboard.writeText(JSON.stringify(res.data, null, 2));
      setCopiedResponse(ep.path);
      setResponsePreview({ url: ep.path, data: res.data });
      setTimeout(() => setCopiedResponse(null), 3000);
    } catch (e) {
      console.error(e);
    }
    setLoadingPath(null);
  };

  const toggleCategory = (key) => {
    setExpandedCategories((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isDetected = (path) => {
    return detectedEndpoints.some((url) => {
      const urlPath = url.replace('https://api.xrpl.to/v1', '').split('?')[0];
      const pattern = path.replace(/:[^/]+/g, '[^/]+');
      return new RegExp(`^${pattern}$`).test(urlPath);
    });
  };

  const getDetectedLabel = (url) => {
    const path = url.replace('https://api.xrpl.to/v1/', '').split('?')[0];
    const parts = path.split('/');
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  };

  // Filter endpoints by search
  const filteredReference = search.trim()
    ? Object.entries(API_REFERENCE).reduce((acc, [key, cat]) => {
        const filtered = cat.endpoints.filter(
          (ep) =>
            ep.path.toLowerCase().includes(search.toLowerCase()) ||
            ep.desc.toLowerCase().includes(search.toLowerCase())
        );
        if (filtered.length > 0) acc[key] = { ...cat, endpoints: filtered };
        return acc;
      }, {})
    : API_REFERENCE;

  return createPortal(
    <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4" onClick={onClose}>
      <div className={cn('fixed inset-0 z-[1400]', isDark ? 'bg-black/70' : 'bg-black/30')} />
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative z-[1401] rounded-xl border w-full max-w-[480px] max-h-[85vh] overflow-hidden flex flex-col',
          isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-gray-200'
        )}
      >
        {/* Header */}
        <div
          className={cn(
            'px-4 py-3 border-b shrink-0',
            isDark ? 'border-white/10' : 'border-gray-100'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 size={14} className={isDark ? 'text-[#3f96fe]' : 'text-cyan-600'} />
              <span
                className={cn('text-[13px] font-medium', isDark ? 'text-white' : 'text-gray-900')}
              >
                API Reference
              </span>
              <span className="px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider rounded bg-amber-500/15 text-amber-500">
                {getTotalEndpointCount()} endpoints
              </span>
            </div>
            <button
              onClick={onClose}
              className={cn('p-1.5 rounded-lg', isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100')}
            >
              <X size={14} className={isDark ? 'text-white/40' : 'text-gray-400'} />
            </button>
          </div>

          {/* Tab Toggle */}
          <div className={cn('flex mt-3 p-0.5 rounded-lg', isDark ? 'bg-white/5' : 'bg-gray-100')}>
            <button
              onClick={() => setView('detected')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-medium transition-colors',
                view === 'detected'
                  ? isDark
                    ? 'bg-[#3f96fe] text-white'
                    : 'bg-white text-gray-900 shadow-sm'
                  : isDark
                    ? 'text-white/50 hover:text-white/70'
                    : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Zap size={11} />
              This Page ({pageEndpointDetails.length})
            </button>
            <button
              onClick={() => setView('all')}
              className={cn(
                'flex-1 py-1.5 rounded-md text-[11px] font-medium transition-colors',
                view === 'all'
                  ? isDark
                    ? 'bg-[#3f96fe] text-white'
                    : 'bg-white text-gray-900 shadow-sm'
                  : isDark
                    ? 'text-white/50 hover:text-white/70'
                    : 'text-gray-500 hover:text-gray-700'
              )}
            >
              All Endpoints
            </button>
          </div>

          {/* Search (only in all view) */}
          {view === 'all' && (
            <input
              type="text"
              placeholder="Search endpoints..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                'w-full mt-2 px-3 py-1.5 rounded-lg text-[11px] border outline-none',
                isDark
                  ? 'bg-white/5 border-white/10 text-white placeholder:text-white/30'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400'
              )}
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {view === 'detected' ? (
            <div className="p-3 space-y-2">
              {pageEndpointDetails.length === 0 ? (
                <div className={cn('text-center py-8', isDark ? 'text-white/40' : 'text-gray-400')}>
                  <Code2 size={24} className="mx-auto mb-2 opacity-50" />
                  <div className="text-[12px]">No endpoints mapped for this page</div>
                </div>
              ) : (
                pageEndpointDetails.map((ep) => (
                  <div
                    key={ep.path}
                    className={cn('rounded-lg group', isDark ? 'bg-white/5' : 'bg-gray-50')}
                  >
                    <div className="p-2.5">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'px-1.5 py-0.5 text-[9px] font-medium rounded',
                              ep.method === 'GET'
                                ? 'bg-emerald-500/15 text-emerald-500'
                                : 'bg-amber-500/15 text-amber-500'
                            )}
                          >
                            {ep.method}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {ep.method === 'GET' && !ep.path.includes(':') && (
                            <button
                              onClick={() => tryAndCopy(ep)}
                              className={cn(
                                'p-1 opacity-0 group-hover:opacity-100 transition-opacity',
                                copiedResponse === ep.path
                                  ? 'text-emerald-500 opacity-100'
                                  : isDark
                                    ? 'text-white/40'
                                    : 'text-gray-400'
                              )}
                              title="Try & copy response"
                            >
                              {loadingPath === ep.path ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : copiedResponse === ep.path ? (
                                <Check size={12} />
                              ) : (
                                <Play size={12} />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => handleCopy(ep.path)}
                            className={cn(
                              'p-1 opacity-0 group-hover:opacity-100 transition-opacity',
                              copiedPath === ep.path
                                ? 'text-emerald-500 opacity-100'
                                : isDark
                                  ? 'text-white/40 hover:text-white/60'
                                  : 'text-gray-400 hover:text-gray-600'
                            )}
                            title="Copy URL"
                          >
                            {copiedPath === ep.path ? <Check size={12} /> : <Copy size={12} />}
                          </button>
                        </div>
                      </div>
                      <code
                        className={cn(
                          'text-[10px] break-all block',
                          isDark ? 'text-[#3f96fe]' : 'text-cyan-600'
                        )}
                      >
                        {ep.path}
                      </code>
                      <div
                        className={cn(
                          'text-[10px] mt-1',
                          isDark ? 'text-white/40' : 'text-gray-500'
                        )}
                      >
                        {ep.desc}
                      </div>
                    </div>
                    {responsePreview?.url === ep.path && (
                      <div
                        className={cn('border-t', isDark ? 'border-white/10' : 'border-gray-200')}
                      >
                        <div
                          className={cn(
                            'flex items-center justify-between px-2.5 py-1.5',
                            isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'
                          )}
                        >
                          <span className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-medium">
                            <Check size={10} /> Copied to clipboard
                          </span>
                          <button
                            onClick={() => setResponsePreview(null)}
                            className={cn(
                              'p-0.5 rounded',
                              isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
                            )}
                          >
                            <X size={10} className={isDark ? 'text-white/40' : 'text-gray-400'} />
                          </button>
                        </div>
                        <pre
                          className={cn(
                            'p-2.5 text-[9px] leading-relaxed max-h-[120px] overflow-auto',
                            isDark ? 'text-white/70' : 'text-gray-600'
                          )}
                        >
                          <JsonHighlight data={responsePreview.data} />
                        </pre>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="p-2">
              {Object.entries(filteredReference).map(([key, category]) => {
                const isExpanded = expandedCategories[key];
                const detectedCount = category.endpoints.filter((ep) => isDetected(ep.path)).length;

                return (
                  <div key={key} className="mb-1">
                    <button
                      onClick={() => toggleCategory(key)}
                      className={cn(
                        'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-colors',
                        isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                      )}
                    >
                      {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      <span
                        className={cn(
                          'text-[11px] font-medium flex-1',
                          isDark ? 'text-white' : 'text-gray-900'
                        )}
                      >
                        {category.label}
                      </span>
                      <span
                        className={cn('text-[10px]', isDark ? 'text-white/40' : 'text-gray-400')}
                      >
                        {category.endpoints.length}
                      </span>
                      {detectedCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[9px] font-medium rounded bg-emerald-500/15 text-emerald-500">
                          {detectedCount} active
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
                                'rounded-lg overflow-hidden',
                                detected
                                  ? isDark
                                    ? 'bg-emerald-500/10'
                                    : 'bg-emerald-50'
                                  : isDark
                                    ? 'bg-white/[0.02]'
                                    : 'bg-gray-50/50'
                              )}
                            >
                              <div className="flex items-start gap-2 px-2.5 py-2 group">
                                <span
                                  className={cn(
                                    'px-1.5 py-0.5 text-[9px] font-medium rounded shrink-0 mt-0.5',
                                    ep.method === 'GET'
                                      ? 'bg-emerald-500/15 text-emerald-500'
                                      : 'bg-amber-500/15 text-amber-500'
                                  )}
                                >
                                  {ep.method}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <code
                                    className={cn(
                                      'text-[10px] block',
                                      detected
                                        ? 'text-emerald-400'
                                        : isDark
                                          ? 'text-[#3f96fe]'
                                          : 'text-cyan-600'
                                    )}
                                  >
                                    {ep.path}
                                  </code>
                                  <div
                                    className={cn(
                                      'text-[10px] mt-0.5',
                                      isDark ? 'text-white/40' : 'text-gray-500'
                                    )}
                                  >
                                    {ep.desc}
                                  </div>
                                </div>
                                <div className="flex items-center gap-0.5 shrink-0">
                                  {ep.method === 'GET' && !ep.path.includes(':') && (
                                    <button
                                      onClick={() => tryAndCopy(ep)}
                                      className={cn(
                                        'p-1 opacity-0 group-hover:opacity-100 transition-opacity',
                                        copiedResponse === ep.path
                                          ? 'text-emerald-500 opacity-100'
                                          : isDark
                                            ? 'text-white/40'
                                            : 'text-gray-400'
                                      )}
                                      title="Try & copy response"
                                    >
                                      {loadingPath === ep.path ? (
                                        <Loader2 size={11} className="animate-spin" />
                                      ) : copiedResponse === ep.path ? (
                                        <Check size={11} />
                                      ) : (
                                        <Play size={11} />
                                      )}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleCopy(ep.path)}
                                    className={cn(
                                      'p-1 opacity-0 group-hover:opacity-100 transition-opacity',
                                      copiedPath === ep.path
                                        ? 'text-emerald-500 opacity-100'
                                        : isDark
                                          ? 'text-white/40'
                                          : 'text-gray-400'
                                    )}
                                    title="Copy URL"
                                  >
                                    {copiedPath === ep.path ? (
                                      <Check size={11} />
                                    ) : (
                                      <Copy size={11} />
                                    )}
                                  </button>
                                </div>
                              </div>
                              {responsePreview?.url === ep.path && (
                                <div
                                  className={cn(
                                    'border-t',
                                    isDark ? 'border-white/10' : 'border-gray-200'
                                  )}
                                >
                                  <div
                                    className={cn(
                                      'flex items-center justify-between px-2.5 py-1.5',
                                      isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'
                                    )}
                                  >
                                    <span className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-medium">
                                      <Check size={10} /> Copied to clipboard
                                    </span>
                                    <button
                                      onClick={() => setResponsePreview(null)}
                                      className={cn(
                                        'p-0.5 rounded',
                                        isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
                                      )}
                                    >
                                      <X
                                        size={10}
                                        className={isDark ? 'text-white/40' : 'text-gray-400'}
                                      />
                                    </button>
                                  </div>
                                  <pre
                                    className={cn(
                                      'p-2.5 text-[9px] leading-relaxed max-h-[120px] overflow-auto',
                                      isDark ? 'text-white/70' : 'text-gray-600'
                                    )}
                                  >
                                    <JsonHighlight data={responsePreview.data} />
                                  </pre>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              {Object.keys(filteredReference).length === 0 && (
                <div className={cn('text-center py-8', isDark ? 'text-white/40' : 'text-gray-400')}>
                  <div className="text-[12px]">No endpoints match "{search}"</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={cn(
            'px-4 py-3 border-t shrink-0',
            isDark ? 'border-white/10' : 'border-gray-100'
          )}
        >
          <div className="flex items-center gap-2">
            <code
              className={cn(
                'flex-1 text-[10px] px-2 py-1.5 rounded',
                isDark ? 'bg-white/5 text-white/60' : 'bg-gray-100 text-gray-600'
              )}
            >
              https://api.xrpl.to/v1/...
            </code>
            <a
              href="/docs"
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-colors',
                isDark
                  ? 'text-[#3f96fe] border-[#3f96fe]/20 hover:bg-[#3f96fe]/10'
                  : 'text-cyan-600 border-cyan-200 hover:bg-cyan-50'
              )}
            >
              Full Docs
              <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body
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
          'group relative flex h-8 items-center gap-1.5 rounded-lg px-3 text-[11px] font-medium transition-all duration-300 overflow-hidden',
          isDark
            ? 'bg-[#0d0d1a] text-blue-300 border border-blue-500/30 hover:border-blue-400/50 hover:text-white hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]'
            : 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-600 border border-blue-200 hover:from-blue-100 hover:to-cyan-100 hover:border-blue-300',
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
    window.__apiListeners?.forEach((l) => l());
  }
};

ApiEndpointsModal.displayName = 'ApiEndpointsModal';
ApiButton.displayName = 'ApiButton';

export default ApiEndpointsModal;
export { getApiCalls };
