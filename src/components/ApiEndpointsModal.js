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
  Loader2,
  Terminal,
  Layers
} from 'lucide-react';
import { ThemeContext } from 'src/context/AppContext';
import { cn } from 'src/utils/cn';
import api from 'src/utils/api';

const StyledApiButton = ({ className, ...props }) => (
  <button
    className={cn(
      'flex items-center font-medium transition-[background-color,border-color,opacity] duration-300 overflow-hidden relative',
      className
    )}
    {...props}
  />
);


// JSON syntax highlighter
const JsonHighlight = ({ data, maxLen = 800 }) => {
  const str = JSON.stringify(data, null, 2);
  const truncated = str.slice(0, maxLen);
  const parts = truncated.split(/("(?:[^"\\]|\\.)*"|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g);

  return (
    <span className="font-mono leading-relaxed">
      {parts.map((part, i) => {
        if (!part) return null;
        if (/^".*":?$/.test(part)) {
          const isKey = part.endsWith(':') || (parts[i + 1] && parts[i + 1].trim().startsWith(':'));
          return <span key={i} className={isKey ? 'text-blue-400' : 'text-emerald-400'}>{part}</span>;
        }
        if (/^(true|false)$/.test(part)) return <span key={i} className="text-orange-400">{part}</span>;
        if (/^null$/.test(part)) return <span key={i} className="text-red-400">{part}</span>;
        if (/^-?\d/.test(part)) return <span key={i} className="text-purple-400">{part}</span>;
        return <span key={i}>{part}</span>;
      })}
      {str.length > maxLen && <span className="text-white/30 italic"> ... continued</span>}
    </span>
  );
};

// Global store for tracked API calls
if (typeof window !== 'undefined') {
  window.__apiCallsStore = window.__apiCallsStore || new Set();
  window.__apiListeners = window.__apiListeners || [];

  if (!window.__apiInterceptorInstalled) {
    window.__apiInterceptorInstalled = true;
    api.interceptors.request.use((config) => {
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
  if (typeof window === 'undefined') return () => { };
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
      { method: 'GET', path: '/creator-activity/:id', desc: 'Creator activity by md5 or address' }
    ]
  },
  charts: {
    label: 'Charts & Analytics',
    endpoints: [
      { method: 'GET', path: '/ohlc/:md5', desc: 'OHLC candlestick data' },
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
      { method: 'GET', path: '/traders/:account', desc: 'Full trader profile with all tokens' },
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
      { method: 'GET', path: '/token/analytics/trader/:account', desc: 'Trader cumulative stats' },
      {
        method: 'GET',
        path: '/token/analytics/trader/:account/tokens',
        desc: 'Trader token-specific metrics'
      },
      {
        method: 'GET',
        path: '/token/analytics/trader/:account/history',
        desc: 'Trader volume history'
      },
      {
        method: 'GET',
        path: '/token/analytics/trader/:account/trades',
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
      { method: 'GET', path: '/nft/holders/address/:account', desc: 'NFT holdings for specific address' },
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
        path: '/nft/account/:account/nfts',
        desc: 'NFTs/collections owned with portfolio value'
      },
      { method: 'GET', path: '/nft/account/:account/offers', desc: "Account's NFT offers" },
      { method: 'GET', path: '/nft/stats/global', desc: 'Global NFT market stats' },
      { method: 'GET', path: '/nft/global-metrics', desc: 'Global NFT metrics' },
      { method: 'GET', path: '/nft/brokers/stats', desc: 'Broker fee statistics' }
    ]
  },
  nftAnalytics: {
    label: 'NFT Analytics',
    endpoints: [
      { method: 'GET', path: '/nft/analytics/traders', desc: 'NFT trader leaderboard' },
      { method: 'GET', path: '/nft/analytics/trader/:account', desc: 'NFT trader profile' },
      {
        method: 'GET',
        path: '/nft/analytics/trader/:account/history',
        desc: 'NFT trader daily history'
      },
      {
        method: 'GET',
        path: '/nft/analytics/trader/:account/collections',
        desc: 'NFT trader collection breakdown'
      },
      {
        method: 'GET',
        path: '/nft/analytics/trader/:account/trades',
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
  },
  creatorActivity: {
    label: 'Creator Activity',
    endpoints: [
      { method: 'GET', path: '/creator-activity/:identifier', desc: 'Creator activity by md5 or address' }
    ]
  },
  faucet: {
    label: 'Faucet (Testnet)',
    endpoints: [
      { method: 'GET', path: '/faucet', desc: 'Faucet status and balance' },
      { method: 'POST', path: '/faucet', desc: 'Request testnet XRP (200 XRP, 24h cooldown)' }
    ]
  },
  chat: {
    label: 'Chat',
    endpoints: [
      { method: 'GET', path: '/chat/session', desc: 'Create chat session token' },
      { method: 'GET', path: '/chat/status', desc: 'Get online user count' },
      { method: 'GET', path: '/chat/messages', desc: 'Get recent chat messages' },
      { method: 'GET', path: '/chat/access', desc: 'Check chat access tier' }
    ]
  },
  websocket: {
    label: 'WebSocket',
    endpoints: [
      { method: 'WS', path: '/ws/sync', desc: 'Multi-token market sync stream' },
      { method: 'WS', path: '/ws/token/:md5', desc: 'Single token real-time updates' },
      { method: 'WS', path: '/ws/ohlc/:md5', desc: 'OHLC candlestick stream' },
      { method: 'WS', path: '/ws/history/:md5', desc: 'Trade history stream' },
      { method: 'WS', path: '/ws/holders/:id', desc: 'Token holder updates' },
      { method: 'WS', path: '/ws/orderbook', desc: 'Live orderbook depth (base, quote params)' },
      { method: 'WS', path: '/ws/ledger', desc: 'Ledger close stream' },
      { method: 'WS', path: '/ws/trustlines/:account', desc: 'Account trustline updates' },
      { method: 'WS', path: '/ws/news', desc: 'Real-time news feed' },
      { method: 'WS', path: '/ws/account/balance/:account', desc: 'Account XRP balance stream' },
      { method: 'WS', path: '/ws/account/balance/pair/:account', desc: 'Token pair balance stream' },
      { method: 'WS', path: '/ws/account/offers/:account', desc: 'Account open DEX offers stream' },
      { method: 'WS', path: '/ws/amm/info', desc: 'Live AMM pool info (asset, asset2 params)' },
      { method: 'WS', path: '/ws/creator/:identifier', desc: 'Creator activity stream (md5 or address)' },
      { method: 'WS', path: '/ws/chat', desc: 'Real-time chat messages' }
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
  '/token/[slug]': ['/token/:id', '/ohlc/:md5', '/sparkline/:md5', '/holders/info/:md5', '/holders/graph/:md5', '/holders/list/:id', '/history', '/pairs/:md5', '/orderbook', '/traders/token-traders/:md5', '/amm', '/ai/token/:md5', '/dex/quote', '/stats/rates'],
  '/amm': ['/amm', '/amm/info', '/amm/liquidity-chart'],
  '/nfts': ['/nft/collections', '/nft/stats/global'],
  '/nfts/[slug]': ['/nft/collections/:slug', '/nft/collections/:slug/nfts', '/nft/collections/:slug/traits', '/nft/collections/:slug/ohlc', '/nft/collections/:slug/ohlc/:date/sales', '/nft/holders/:slug', '/nft/holders/:slug/distribution', '/nft/analytics/collection/:slug/traders'],
  '/address/[...acct]': ['/account/balance/:account', '/account/info/live/:account', '/trustlines/:account', '/traders/:account', '/history', '/nft/account/:account/nfts', '/nft/analytics/trader/:account', '/nft/analytics/trader/:account/collections', '/nft/analytics/trader/:account/history', '/nft/analytics/trader/:account/trades', '/account-tx-explain/:account'],
  '/traders': ['/token/analytics/traders', '/token/analytics/market'],
  '/trader/[address]': ['/traders/:account', '/token/analytics/trader/:account', '/token/analytics/trader/:account/tokens', '/token/analytics/trader/:account/history'],
  '/news': ['/news', '/news/search', '/news/sentiment-chart'],
  '/nft/[...nftokenid]': ['/nft/:nftId', '/nft/:nftId/offers', '/nft/history/:nftId', '/nft/offers/buy/:nftId', '/nft/offers/sell/:nftId', '/watchlist'],
  '/nfts/[slug]': ['/nft/collections/:slug', '/nft/collections/:slug/nfts', '/nft/collections/:slug/traits', '/nft/collections/:slug/ohlc', '/nft/collections/:slug/ohlc/:date/sales', '/nft/holders/:slug', '/nft/holders/:slug/distribution', '/nft/analytics/collection/:slug/traders', '/nft/collections/:slug/sparkline', '/nft/collections/:slug/floor/history']
};

const ApiEndpointsModal = memo(({ open, onClose, token = null }) => {
  const { themeName } = useContext(ThemeContext);
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
  const [copiedField, setCopiedField] = useState(null);
  const [copiedCurl, setCopiedCurl] = useState(null);

  const getFullUrl = (path) => {
    let url = path;
    if (path.includes(':') && token) {
      url = url
        .replace(':md5', token.md5 || '')
        .replace(':id', token.md5 || '')
        .replace(':address', token.issuer || '')
        .replace(':account', token.issuer || '')
        .replace(':slug', token.slug || token.md5 || '');
    }
    return `https://api.xrpl.to/v1${url}`;
  };

  const copyCurl = (ep) => {
    const fullUrl = getFullUrl(ep.path);
    const curl = `curl -X ${ep.method} "${fullUrl}"`;
    navigator.clipboard.writeText(curl);
    setCopiedCurl(ep.path);
    setTimeout(() => setCopiedCurl(null), 1500);
  };

  const copyField = (value, field) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1200);
  };

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
    if (ep.method !== 'GET') return;
    // Build URL, replacing params with token data
    let url = ep.path;
    if (ep.path.includes(':') && token) {
      url = url
        .replace(':md5', token.md5 || '')
        .replace(':id', token.md5 || '')
        .replace(':address', token.issuer || '')
        .replace(':account', token.issuer || '')
        .replace(':slug', token.slug || token.md5 || '');
      if (url.includes(':')) return; // Still has unresolved params
    } else if (ep.path.includes(':')) {
      return; // No token data for params
    }
    setLoadingPath(ep.path);
    try {
      const res = await api.get(`https://api.xrpl.to/v1${url}`);
      await navigator.clipboard.writeText(JSON.stringify(res.data, null, 2));
      setCopiedResponse(ep.path);
      setResponsePreview({ url: ep.path, data: res.data });
      setTimeout(() => setCopiedResponse(null), 3000);
    } catch (e) {
      console.error(e);
    }
    setLoadingPath(null);
  };

  const canTry = (ep) => {
    if (ep.method !== 'GET') return false;
    if (!ep.path.includes(':')) return true;
    if (!token) return false;
    const resolved = ep.path
      .replace(':md5', token.md5 || '')
      .replace(':id', token.md5 || '')
      .replace(':address', token.issuer || '')
      .replace(':account', token.issuer || '')
      .replace(':slug', token.slug || token.md5 || '');
    return !resolved.includes(':');
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
    <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4 max-sm:h-dvh" onClick={onClose}>
      <div className={cn('fixed inset-0 z-[1400]', isDark ? 'bg-black/80' : 'bg-black/40')} />
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative z-[1401] rounded-2xl border-[1.5px] w-full max-w-[480px] max-h-[85dvh] overflow-hidden flex flex-col',
          isDark ? 'bg-black border-white/[0.08]' : 'bg-white border-black/[0.06]'
        )}
      >
        {/* Header */}
        <div
          className={cn(
            'px-4 py-4 border-b shrink-0',
            isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className={cn(
                'p-1.5 rounded-lg',
                isDark ? 'bg-blue-500/10' : 'bg-blue-500/[0.06]'
              )}>
                <Code2 size={16} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
              </div>
              <div className="flex flex-col">
                <span className={cn('text-sm font-bold tracking-tight', isDark ? 'text-white' : 'text-[#0F172A]')}>
                  Developer API
                </span>
                <span className={cn('text-[10px]', isDark ? 'text-white/40' : 'text-[#64748B]')}>
                  Interact with real-time XRPL data
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 text-[8px] sm:text-[9px] sm:px-2 font-bold uppercase tracking-wider rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                {getTotalEndpointCount()} <span className="hidden sm:inline">Core </span>Endpoints
              </span>
              <button
                onClick={onClose}
                className={cn('p-1.5 rounded-lg transition-colors', isDark ? 'hover:bg-white/[0.06] text-white/40 hover:text-white' : 'hover:bg-black/[0.04] text-black/30 hover:text-black')}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Tab Toggle */}
          <div className={cn('flex p-1 rounded-[10px]', isDark ? 'bg-white/[0.025] border border-white/[0.06]' : 'bg-black/[0.02] border border-black/[0.06]')}>
            <button
              onClick={() => setView('detected')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-semibold transition-all duration-200',
                view === 'detected'
                  ? 'bg-blue-500 text-white'
                  : isDark
                    ? 'text-white/40 hover:text-white/60'
                    : 'text-black/40 hover:text-black/60'
              )}
            >
              <Zap size={12} />
              Current View
              <span className={cn(
                'ml-1 px-1.5 py-0.5 rounded-full text-[9px]',
                view === 'detected' ? 'bg-white/20 text-white' : isDark ? 'bg-white/[0.06] text-white/40' : 'bg-black/[0.06] text-black/40'
              )}>
                {pageEndpointDetails.length}
              </span>
            </button>
            <button
              onClick={() => setView('all')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-semibold transition-all duration-200',
                view === 'all'
                  ? 'bg-blue-500 text-white'
                  : isDark
                    ? 'text-white/40 hover:text-white/60'
                    : 'text-black/40 hover:text-black/60'
              )}
            >
              <Layers size={12} />
              All Endpoints
            </button>
          </div>

          {/* Search */}
          <div className="relative mt-3">
            <input
              type="text"
              placeholder="Search by path, name, or description..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (e.target.value.trim() && view === 'detected') setView('all');
              }}
              className={cn(
                'w-full pl-3 pr-10 py-2 rounded-[10px] text-[11px] border-[1.5px] outline-none transition-all duration-200',
                isDark
                  ? 'bg-white/[0.025] border-white/[0.06] text-white placeholder:text-white/20 focus:border-blue-500/40 focus:bg-blue-500/[0.03]'
                  : 'bg-black/[0.02] border-black/[0.06] text-[#0F172A] placeholder:text-black/30 focus:border-blue-500/50 focus:bg-blue-500/[0.03]'
              )}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-white/10"
              >
                <X size={12} className={isDark ? 'text-white/30' : 'text-gray-400'} />
              </button>
            )}
          </div>
        </div>

        {/* Token Info Section */}
        {token && (
          <div className={cn(
            'mx-4 mt-3 mb-2 p-3 rounded-[10px] border-[1.5px] flex flex-col gap-2.5 transition-all duration-200',
            isDark ? 'bg-white/[0.025] border-white/[0.06]' : 'bg-black/[0.02] border-black/[0.06]'
          )}>
            <div className="flex items-center justify-between">
              <span className={cn('text-[10px] font-bold uppercase tracking-[0.1em]', isDark ? 'text-white/30' : 'text-gray-400')}>
                Active Context
              </span>
              <div className="flex items-center gap-1.5 grayscale opacity-50">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-medium text-emerald-500">Auto-injecting Params</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'MD5', value: token.md5, field: 'md5' },
                { label: 'Issue', value: token.issuer, field: 'issuer' }
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => copyField(item.value, item.field)}
                  className={cn(
                    'group relative p-2 rounded-lg border-[1.5px] text-left transition-all duration-200',
                    isDark ? 'bg-white/[0.025] border-white/[0.06] hover:border-blue-500/40' : 'bg-black/[0.02] border-black/[0.06] hover:border-blue-500/50'
                  )}
                >
                  <div className={cn('text-[8px] font-bold mb-0.5', isDark ? 'text-white/30' : 'text-gray-400')}>
                    {item.label}
                  </div>
                  <div className={cn('font-mono text-[10px] truncate', isDark ? 'text-blue-400' : 'text-blue-600')}>
                    {item.value}
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {copiedField === item.field ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} className={isDark ? 'text-white/20' : 'text-gray-300'} />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
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
                    className={cn('rounded-[10px] group border-[1.5px]', isDark ? 'bg-white/[0.025] border-white/[0.06]' : 'bg-black/[0.02] border-black/[0.06]')}
                  >
                    <div className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'px-1.5 py-0.5 text-[8px] font-bold rounded border',
                                ep.method === 'GET'
                                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                  : ep.method === 'WS'
                                    ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                                    : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                              )}
                            >
                              {ep.method}
                            </span>
                            <code
                              className={cn(
                                'text-[10px] font-mono font-medium truncate',
                                isDark ? 'text-blue-400' : 'text-blue-600'
                              )}
                            >
                              {ep.path}
                            </code>
                          </div>
                          <div
                            className={cn(
                              'text-[10px] line-clamp-1',
                              isDark ? 'text-white/40' : 'text-[#64748B]'
                            )}
                          >
                            {ep.desc}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2 shrink-0">
                          {canTry(ep) && (
                            <button
                              onClick={() => tryAndCopy(ep)}
                              className={cn(
                                'p-1.5 rounded-lg transition-all duration-200',
                                copiedResponse === ep.path
                                  ? 'text-emerald-500 bg-emerald-500/10'
                                  : isDark
                                    ? 'text-white/30 hover:text-white hover:bg-white/[0.06]'
                                    : 'text-black/30 hover:text-black hover:bg-black/[0.04]'
                              )}
                              title="Fetch Example JSON"
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
                            onClick={() => copyCurl(ep)}
                            className={cn(
                              'p-1.5 rounded-lg transition-all duration-200',
                              copiedCurl === ep.path
                                ? 'text-blue-500 bg-blue-500/10'
                                : isDark
                                  ? 'text-white/30 hover:text-blue-400 hover:bg-white/[0.06]'
                                  : 'text-black/30 hover:text-blue-600 hover:bg-black/[0.04]'
                            )}
                            title="Copy cURL"
                          >
                            {copiedCurl === ep.path ? <Check size={12} /> : <Terminal size={12} />}
                          </button>
                          <button
                            onClick={() => handleCopy(ep.path)}
                            className={cn(
                              'p-1.5 rounded-lg transition-all duration-200',
                              copiedPath === ep.path
                                ? 'text-emerald-500 bg-emerald-500/10'
                                : isDark
                                  ? 'text-white/30 hover:text-white hover:bg-white/[0.06]'
                                  : 'text-black/30 hover:text-black hover:bg-black/[0.04]'
                            )}
                            title="Copy API URL"
                          >
                            {copiedPath === ep.path ? <Check size={12} /> : <Copy size={12} />}
                          </button>
                        </div>
                      </div>
                    </div>
                    {responsePreview?.url === ep.path && (
                      <div
                        className={cn('border-t', isDark ? 'border-white/[0.06]' : 'border-black/[0.06]')}
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
                              isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.04]'
                            )}
                          >
                            <X size={10} className={isDark ? 'text-white/40' : 'text-black/30'} />
                          </button>
                        </div>
                        <pre
                          className={cn(
                            'p-2.5 text-[9px] leading-relaxed max-h-[120px] overflow-auto',
                            isDark ? 'text-white/70' : 'text-[#64748B]'
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
                        'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-colors duration-200',
                        isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.02]'
                      )}
                    >
                      {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      <span
                        className={cn(
                          'text-[11px] font-medium flex-1',
                          isDark ? 'text-white' : 'text-[#0F172A]'
                        )}
                      >
                        {category.label}
                      </span>
                      <span
                        className={cn('text-[10px]', isDark ? 'text-white/40' : 'text-[#64748B]')}
                      >
                        {category.endpoints.length}
                      </span>
                      {detectedCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[9px] font-medium rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
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
                                  ? 'bg-emerald-500/[0.08] border border-emerald-500/20'
                                  : isDark
                                    ? 'bg-white/[0.02]'
                                    : 'bg-black/[0.015]'
                              )}
                            >
                              <div className="flex items-start gap-2 px-2.5 py-2 group">
                                <span
                                  className={cn(
                                    'px-1.5 py-0.5 text-[9px] font-medium rounded shrink-0 mt-0.5 border',
                                    ep.method === 'GET'
                                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                      : ep.method === 'WS'
                                        ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
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
                                          ? 'text-blue-400'
                                          : 'text-blue-600'
                                    )}
                                  >
                                    {ep.path}
                                  </code>
                                  <div
                                    className={cn(
                                      'text-[10px] mt-0.5',
                                      isDark ? 'text-white/40' : 'text-[#64748B]'
                                    )}
                                  >
                                    {ep.desc}
                                  </div>
                                </div>
                                <div className="flex items-center gap-0.5 shrink-0">
                                  {canTry(ep) && (
                                    <button
                                      onClick={() => tryAndCopy(ep)}
                                      className={cn(
                                        'p-1 opacity-0 group-hover:opacity-100 transition-opacity',
                                        copiedResponse === ep.path
                                          ? 'text-emerald-500 opacity-100'
                                          : isDark
                                            ? 'text-white/30'
                                            : 'text-black/30'
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
                                          ? 'text-white/30'
                                          : 'text-black/30'
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
                                    isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'
                                  )}
                                >
                                  <div
                                    className={cn(
                                      'flex items-center justify-between px-2.5 py-1.5',
                                      isDark ? 'bg-emerald-500/[0.08]' : 'bg-emerald-50'
                                    )}
                                  >
                                    <span className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-medium">
                                      <Check size={10} /> Copied to clipboard
                                    </span>
                                    <button
                                      onClick={() => setResponsePreview(null)}
                                      className={cn(
                                        'p-0.5 rounded',
                                        isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.04]'
                                      )}
                                    >
                                      <X
                                        size={10}
                                        className={isDark ? 'text-white/40' : 'text-black/30'}
                                      />
                                    </button>
                                  </div>
                                  <pre
                                    className={cn(
                                      'p-2.5 text-[9px] leading-relaxed max-h-[120px] overflow-auto',
                                      isDark ? 'text-white/70' : 'text-[#64748B]'
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
            isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'
          )}
        >
          <div className="flex items-center gap-2">
            <code
              className={cn(
                'flex-1 text-[10px] px-2 py-1.5 rounded-lg',
                isDark ? 'bg-white/[0.025] text-white/50' : 'bg-black/[0.02] text-[#64748B]'
              )}
            >
              https://api.xrpl.to/v1/...
            </code>
            <a
              href="/docs"
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-medium border-[1.5px] transition-colors duration-200',
                isDark
                  ? 'text-blue-400 border-blue-500/20 hover:bg-blue-500/[0.08]'
                  : 'text-blue-600 border-blue-500/20 hover:bg-blue-500/[0.04]'
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
export const ApiButton = memo(({ className = '', token = null }) => {
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [open, setOpen] = useState(false);

  return (
    <>
      <StyledApiButton
        onClick={() => setOpen(true)}
        className={cn(
          'group border-[1.5px] gap-1 rounded-md px-2 h-6 sm:h-7 text-[9px]',
          isDark
            ? 'border-white/[0.08] bg-white/[0.025] hover:bg-white/[0.05] text-white/50 hover:text-white/70'
            : 'border-black/[0.06] bg-black/[0.02] hover:bg-black/[0.04] text-black/40 hover:text-black/60',
          className
        )}
      >
        <Code2 size={11} />
        <span className="uppercase tracking-wide font-bold">API</span>
      </StyledApiButton>
      <ApiEndpointsModal open={open} onClose={() => setOpen(false)} token={token} />
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
