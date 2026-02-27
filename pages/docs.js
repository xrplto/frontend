import React, { useState, useContext, useEffect } from 'react';
import Head from 'next/head';
import api from 'src/utils/api';
import {
  Copy,
  Menu,
  X,
  CheckCircle,
  Code,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Zap,
  Clock,
  BookOpen,
  Server,
  Users,
  AlertTriangle,
  FileText,
  Database,
  BarChart3,
  Rocket,
  Hash,
  Mail,
  MessageCircle,
  ExternalLink,
  Wrench,
  Key,
  CreditCard,
  List,
  TrendingUp,
  ArrowLeftRight,
  BadgeCheck,
  Play,
  Droplets,
  Radio,
  Shield,
  Info,
  Flame
} from 'lucide-react';
import { ThemeContext } from 'src/context/AppContext';
import { cn } from 'src/utils/cn';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
import { API_REFERENCE, getTotalEndpointCount, ApiButton } from 'src/components/ApiEndpointsModal';

const ApiDocsPage = ({ apiDocs, ogp }) => {
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [currentSection, setCurrentSection] = useState('info');
  const [searchTerm, setSearchTerm] = useState('');

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const [copiedBlock, setCopiedBlock] = useState(null);

  // Try endpoint state
  const [tryingEndpoint, setTryingEndpoint] = useState(null);
  const [endpointResponse, setEndpointResponse] = useState(null);

  // Sample data for RLUSD token + NFT
  const SAMPLE_DATA = {
    md5: '0dd550278b74cb6690fdae351e8e0df3',
    issuer: 'rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De',
    currency: '524C555344000000000000000000000000000000',
    creator: 'rJqiMb94hyz41SBTNr2AyPNW8AzELa8nE',
    account: 'rJqiMb94hyz41SBTNr2AyPNW8AzELa8nE',
    nftId: '00080BB86C429EE66CE731CAA492445DFF564F9CB8A46A3030EC43B005A84416',
    slug: 'fuzzybears',
    date: '2025-07-07',
    hash: '88E788684079F52181D18848C3E2EE70C07FD31ED8045A7C03E070F3B69C46C9',
    index: '101738551',
    nftAccount: 'rhsxg4xH8FtYc3eR53XDSjTGfKQsaAGaqm'
  };

  const [expandedGroups, setExpandedGroups] = useState({
    'User Guide': true,
    'Get Started': true,
    'Token APIs': true,
    'Account & NFT': true,
    Advanced: true,
    Authentication: true
  });

  // Dynamic data from API with fallbacks
  const docs = {
    version: apiDocs?.version || '1.0',
    baseUrl: apiDocs?.baseUrl || 'https://api.xrpl.to/v1',
    tiers: apiDocs?.tiers || [
      { name: 'Free', price: '$0/mo', credits: '1M', rate: '10 req/sec', submit: '1 tx/sec', support: 'Community' },
      { name: 'Developer', price: '$49/mo', credits: '10M', rate: '50 req/sec', submit: '5 tx/sec', support: 'Chat' },
      { name: 'Business', price: '$499/mo', credits: '100M', rate: '200 req/sec', submit: '50 tx/sec', support: 'Priority chat' },
      { name: 'Professional', price: '$999/mo', credits: '200M', rate: '500 req/sec', submit: '100 tx/sec', support: 'Telegram + Slack' }
    ],
    creditPacks: apiDocs?.keys?.creditPacks || [
      { pack: 'starter', price: '$5', credits: '1M' },
      { pack: 'standard', price: '$20', credits: '5M' },
      { pack: 'bulk', price: '$75', credits: '25M' },
      { pack: 'mega', price: '$250', credits: '100M' }
    ],
    caching: apiDocs?.reference?.caching || {
      default: 'Live (no caching)',
      platformStatus: '30 seconds',
      news: '5 minutes',
      cumulativeStats: '10 minutes'
    },
    patterns: apiDocs?.reference?.patterns || {
      account: '^r[1-9A-HJ-NP-Za-km-z]{24,34}$',
      nftokenId: '^[A-Fa-f0-9]{64}$',
      txHash: '^[A-Fa-f0-9]{64}$',
      md5: '^[a-f0-9]{32}$'
    },
    verify: apiDocs?.verify || [
      { method: 'GET', path: '/verify/pricing', desc: 'Get verification tier pricing' },
      { method: 'POST', path: '/verify/request', desc: 'Submit verification request' },
      { method: 'POST', path: '/verify/confirm', desc: 'Confirm payment via tx hash' }
    ],
    boost: apiDocs?.boost || [
      { method: 'GET', path: '/boost/quote/{md5}', desc: 'Get quote for token ranking boost' },
      { method: 'POST', path: '/boost/purchase', desc: 'Create payment request for boost' },
      { method: 'GET', path: '/boost/verify/{invoiceId}', desc: 'Verify payment and activate boost' }
    ],
    bridge: apiDocs?.bridge || [
      { method: 'GET', path: '/bridge/currencies', desc: 'List supported exchange currencies' },
      { method: 'GET', path: '/bridge/estimate', desc: 'Calculate exchange rate' },
      { method: 'GET', path: '/bridge/min-amount', desc: 'Get minimum exchange amount' },
      { method: 'POST', path: '/bridge/create', desc: 'Initiate exchange transaction' },
      { method: 'GET', path: '/bridge/status', desc: 'Query exchange status' },
      { method: 'GET', path: '/bridge/validate-address', desc: 'Verify destination address' }
    ]
  };

  const sidebarGroups = [
    {
      name: 'User Guide',
      items: [
        { id: 'info', title: 'What is xrpl.to', icon: Info },
        { id: 'handshake', title: 'Handshake', icon: Shield },
        { id: 'platform-fees', title: 'Platform Fees', icon: Zap },
        { id: 'trending-guide', title: 'Trending', icon: TrendingUp },
        { id: 'boost-guide', title: 'Boost', icon: Flame },
        { id: 'security', title: 'Security', icon: Key },
        { id: 'chat', title: 'Chat', icon: MessageCircle },
        { id: 'terms', title: 'Terms of Service', icon: FileText }
      ]
    },
    {
      name: 'Get Started',
      items: [
        { id: 'overview', title: 'Overview', icon: BookOpen },
        { id: 'reference', title: 'Reference (md5)', icon: Hash },
        { id: 'endpoint-reference', title: 'All Endpoints', icon: List },
        { id: 'errors', title: 'Error Codes', icon: AlertTriangle }
      ]
    },
    {
      name: 'Authentication',
      items: [
        { id: 'api-keys', title: 'API Keys', icon: Key },
        { id: 'subscriptions', title: 'Subscriptions', icon: CreditCard }
      ]
    },
    {
      name: 'Token APIs',
      items: [
        { id: 'tokens', title: 'Tokens', icon: Zap },
        { id: 'market', title: 'Market Data', icon: BarChart3 },
        { id: 'trading', title: 'Trading', icon: ChevronRight }
      ]
    },
    {
      name: 'Account & NFT',
      items: [
        { id: 'accounts', title: 'Accounts', icon: Users },
        { id: 'nft', title: 'NFT', icon: FileText }
      ]
    },
    {
      name: 'Advanced',
      items: [
        { id: 'xrpl', title: 'XRPL Node', icon: Server },
        { id: 'analytics', title: 'Analytics', icon: Database },
        { id: 'launch', title: 'Token Launch', icon: Rocket },
        { id: 'bridge', title: 'Bridge', icon: ArrowLeftRight },
        { id: 'verify', title: 'Verification', icon: BadgeCheck },
        { id: 'boost', title: 'Boost', icon: TrendingUp },
        { id: 'tweet-verify', title: 'Tweet Verify', icon: BadgeCheck },
        { id: 'tools', title: 'Tools', icon: Wrench },
        { id: 'faucet', title: 'Faucet', icon: Droplets },
        { id: 'websocket', title: 'WebSocket', icon: Radio }
      ]
    }
  ];

  const toggleGroup = (name) => {
    setExpandedGroups((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  // Navigate to section from URL hash (e.g. /docs#trending-guide)
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const validIds = sidebarGroups.flatMap(g => g.items.map(i => i.id));
      if (validIds.includes(hash)) setCurrentSection(hash);
    }
  }, []);

  // Flat list of all sections for prev/next navigation
  const allSections = sidebarGroups.flatMap((group) => group.items);
  const currentIndex = allSections.findIndex((s) => s.id === currentSection);
  const prevSection = currentIndex > 0 ? allSections[currentIndex - 1] : null;
  const nextSection = currentIndex < allSections.length - 1 ? allSections[currentIndex + 1] : null;

  const pageAnchors = {
    overview: [
      { id: 'base-url', label: 'Base URL' },
      { id: 'start-building', label: 'Start Building' },
      { id: 'quick-start', label: 'Quick Start Example' }
    ],
    'endpoint-reference': Object.entries(API_REFERENCE).map(([key, cat]) => ({
      id: `ref-${key}`,
      label: cat.label
    })),
    info: [
      { id: 'info-platform', label: 'The Platform' },
      { id: 'info-api', label: 'API & Data' },
      { id: 'info-build', label: 'Build with xrpl.to' }
    ],
    handshake: [
      { id: 'what-is-handshake', label: 'What is Handshake?' },
      { id: 'how-it-works', label: 'How It Works' },
      { id: 'handshake-faq', label: 'FAQ' }
    ],
    'platform-fees': [
      { id: 'pf-trading', label: 'Trading Fee' },
      { id: 'pf-launch', label: 'Token Launch' }
    ],
    security: [
      { id: 'self-custody', label: 'Self Custody' },
      { id: 'seed-safety', label: 'Seed Safety' },
      { id: 'cross-contamination', label: 'Cross Contamination' },
      { id: 'verify-domain', label: 'Verify Domain' },
      { id: 'backup', label: 'Backup' },
      { id: 'user-responsibility', label: 'Your Responsibility' }
    ],
    chat: [
      { id: 'chat-overview', label: 'Overview' },
      { id: 'chat-commands', label: 'Commands' },
      { id: 'chat-emotes', label: 'Emotes' },
      { id: 'chat-dm', label: 'Direct Messages' },
      { id: 'chat-attachments', label: 'Attachments' },
      { id: 'chat-support', label: 'Support Tickets' }
    ],
    'api-keys': [
      { id: 'create-key', label: 'Create API Key' },
      { id: 'use-key', label: 'Using API Keys' }
    ],
    subscriptions: [
      { id: 'pricing', label: 'Pricing' },
      { id: 'credits', label: 'Credit Packs' },
      { id: 'xrp-payment', label: 'Pay with XRP' },
      { id: 'stripe-payment', label: 'Pay with Card' },
      { id: 'billing-cycle', label: 'Billing Cycle' }
    ],
    tokens: [
      { id: 'get-tokens', label: 'GET /tokens' },
      { id: 'get-token', label: 'GET /token/{slug}' },
      { id: 'post-search', label: 'POST /search' },
      { id: 'other-endpoints', label: 'Other Endpoints' }
    ],
    market: [
      { id: 'ohlc', label: 'OHLC Chart Data' },
      { id: 'other-market', label: 'Other Endpoints' }
    ],
    trading: [
      { id: 'history', label: 'Trade History' },
      { id: 'other-trading', label: 'Other Endpoints' }
    ],
    accounts: [
      { id: 'account-endpoints', label: 'Account Endpoints' },
      { id: 'account-tx', label: 'Transaction History' }
    ],
    nft: [
      { id: 'single-nft', label: 'Single NFT' },
      { id: 'collections', label: 'Collections' },
      { id: 'activity', label: 'Activity & Traders' }
    ],
    xrpl: [
      { id: 'orderbook', label: 'Orderbook' },
      { id: 'other-xrpl', label: 'Other Endpoints' }
    ],
    analytics: [{ id: 'analytics-endpoints', label: 'All Endpoints' }],
    launch: [
      { id: 'launch-token', label: 'Launch Token' },
      { id: 'other-launch', label: 'Other Endpoints' }
    ],
    reference: [
      { id: 'token-ids', label: 'Token Identifiers' },
      { id: 'md5-gen', label: 'MD5 Generation' },
      { id: 'currency-hex', label: 'Currency Hex' },
      { id: 'patterns', label: 'Regex Patterns' },
      { id: 'caching', label: 'Caching' }
    ],
    tools: [{ id: 'tools-endpoints', label: 'All Endpoints' }],
    errors: [{ id: 'error-codes', label: 'HTTP Status Codes' }],
    websocket: [
      { id: 'ws-overview', label: 'Overview' },
      { id: 'ws-endpoints', label: 'All Endpoints' },
      { id: 'ws-example', label: 'Example' }
    ]
  };

  const copyToClipboard = (text, blockId) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedBlock(blockId);
      setTimeout(() => setCopiedBlock(null), 2000);
    });
  };

  // JSON syntax highlighter
  const highlightJson = (data) => {
    const str = JSON.stringify(data, null, 2);
    const parts = str.split(/("(?:[^"\\]|\\.)*"|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g);
    return parts.map((part, i) => {
      if (!part) return null;
      if (/^".*"$/.test(part)) {
        const isKey = parts[i + 1]?.trim().startsWith(':');
        return <span key={i} style={{ color: isKey ? '#60a5fa' : '#22c55e' }}>{part}</span>;
      }
      if (/^(true|false)$/.test(part)) return <span key={i} style={{ color: '#f59e0b' }}>{part}</span>;
      if (/^null$/.test(part)) return <span key={i} style={{ color: '#ef4444' }}>{part}</span>;
      if (/^-?\d/.test(part)) return <span key={i} style={{ color: '#a78bfa' }}>{part}</span>;
      return <span key={i}>{part}</span>;
    });
  };

  // Build sample URL by replacing path parameters with sample values
  const buildSampleUrl = (path) => {
    const acct = path.includes('/nft/') || path.includes('/nfts/') ? SAMPLE_DATA.nftAccount : SAMPLE_DATA.account;
    return path
      .replace(/:md5/g, SAMPLE_DATA.md5)
      .replace(/:id/g, SAMPLE_DATA.md5)
      .replace(/:account/g, acct)
      .replace(/:address/g, acct)
      .replace(/:issuer/g, SAMPLE_DATA.issuer)
      .replace(/:nftId/g, SAMPLE_DATA.nftId)
      .replace(/:slug/g, SAMPLE_DATA.slug)
      .replace(/:date/g, SAMPLE_DATA.date)
      .replace(/:hash/g, SAMPLE_DATA.hash)
      .replace(/:index/g, SAMPLE_DATA.index);
  };

  // Check if endpoint can be tried
  const canTryEndpoint = (ep) => {
    if (ep.method === 'POST' && ['/search', '/dex/quote', '/account/path-find'].includes(ep.path)) return true;
    if (ep.method !== 'GET') return false;
    return true;
  };

  // Try endpoint and show response
  const tryEndpoint = async (ep) => {
    const key = ep.path;
    setTryingEndpoint(key);
    setEndpointResponse(null);
    try {
      const samplePath = buildSampleUrl(ep.path);
      let url = `https://api.xrpl.to/v1${samplePath}`;

      // Add query params for endpoints that need them
      if (ep.path === '/orderbook') {
        url += `?base=${SAMPLE_DATA.md5}&quote=XRP&limit=5`;
      } else if (ep.path === '/amm/info') {
        url += `?asset=${SAMPLE_DATA.md5}&asset2=XRP`;
      } else if (ep.path === '/amm/liquidity-chart') {
        url += `?token=${SAMPLE_DATA.md5}`;
      } else if (ep.path === '/account/deposit-authorized') {
        url += `?source=${SAMPLE_DATA.nftAccount}&destination=${SAMPLE_DATA.account}`;
      } else if (ep.path === '/watchlist') {
        url += `?account=${SAMPLE_DATA.nftAccount}`;
      }

      let res;
      if (ep.method === 'POST') {
        const bodies = {
          '/search': { search: 'fuzzy', limit: 5 },
          '/dex/quote': {
            source_account: 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe',
            destination_amount: {
              currency: SAMPLE_DATA.currency,
              issuer: SAMPLE_DATA.issuer,
              value: '100'
            },
            source_currencies: [{ currency: 'XRP' }],
            slippage: 0.02
          },
          '/account/path-find': {
            source: SAMPLE_DATA.nftAccount,
            destination: SAMPLE_DATA.account,
            amount: '10000000'
          }
        };
        res = await api.post(url, bodies[ep.path] || {}, { timeout: 10000 });
      } else {
        res = await api.get(url, { timeout: 10000 });
      }
      setEndpointResponse({ path: key, data: res.data, url });
    } catch (e) {
      setEndpointResponse({ path: key, error: e.response?.data || e.message, url: `https://api.xrpl.to/v1${buildSampleUrl(ep.path)}` });
    }
    setTryingEndpoint(null);
  };

  const llmSnippets = {
    tokens: `## Tokens API
Base URL: https://api.xrpl.to/v1

GET /tokens - List all tokens with filtering and sorting
Params: offset (int, default:0), limit (int, max:100), sort (volume|marketcap|change24h|change5m|trending|assessment), order (asc|desc), filter (text search), tag, watchlist (comma-separated ids), show_new (alias: showNew), show_slug (alias: showSlug), token_type (trustline|lp|mpt, alias: tokenType), skip_metrics (alias: skipMetrics)
Example: GET /v1/tokens?limit=20&sort=volume&order=desc
Response: { success, took, total, exch, H24, global, tokens[] }

GET /token/{id} - Get single token by md5 (recommended), slug, issuer_currency, name, or mptIssuanceID
Params: id (required), desc ("yes" for description)
Example: GET /v1/token/0413ca7cfc258dfaf698c02fe304e607

POST /search - Search tokens, NFTs, collections, and accounts
Body: { search: string, offset: int, limit: int }
Response: { success, took, tokens[], collections[], nfts[], account?, pagination }

GET /tokens/slugs - Get all token slugs
GET /tags - Get all token tags with counts
GET /creator-activity/{id} - Creator activity by md5 or address
GET /traders/token-traders/{id} - Get top traders with P&L stats (sort: volume|pnl|trades, minVolume)`,

    market: `## Market Data API
Base URL: https://api.xrpl.to/v1

GET /ohlc/{md5} - OHLC candlestick data
Params: range (1D|5D|1M|3M|1Y|5Y|ALL), interval (1m|5m|15m|30m|1h|4h|1d|1w - auto-selected if omitted), vs_currency (XRP|USD|EUR|JPY|CNH)
Example: GET /v1/ohlc/0413ca7cfc258dfaf698c02fe304e607?range=1M&vs_currency=USD
Response: { result, took, length, range, interval, interval_seconds, vs_currency, ohlc: [[time, o, h, l, c, vol]] }

GET /sparkline/{id} - Sparkline price data for mini charts
Params: period (24h|7d, default:7d), lightweight (bool), max_points (int, default:20, alias: maxPoints)

GET /holders/list/{id} - Top token holders (offset, limit)
GET /holders/info/{id} - Holder distribution statistics
GET /holders/graph/{id} - Holder distribution graph data

GET /rsi - RSI technical indicators with filtering
Params: start, limit (max:100), sortBy (rsi15m|rsi1h|rsi4h|rsi24h|rsi7d), sortType, timeframe, filter, tag, origin, minMarketCap, maxMarketCap, minVolume24h, maxVolume24h, minPriceChange24h, maxPriceChange24h, minRsi15m, maxRsi15m, minRsi1h, maxRsi1h, minRsi4h, maxRsi4h, minRsi24h, maxRsi24h, minRsi7d, maxRsi7d
Example: GET /v1/rsi?minRsi24h=70&sortBy=rsi24h&limit=20

POST /stats/metrics - Historical metrics by timestamps (body: { timestamps[] })
GET /news - XRPL news with sentiment (offset, limit, source filter)
GET /news/search?q={query} - Search news articles
GET /stats - Global platform metrics
GET /stats/rates - Exchange rates between tokens (token1, token2)`,

    trading: `## Trading API
Base URL: https://api.xrpl.to/v1
Token identifiers: All endpoints accept md5 (recommended), slug, or issuer_currency format

GET /history - Trade history for a token
Params: md5 (required unless account), account, offset, limit (max:5000), start_time/startTime, end_time/endTime (Unix ms), pair_type/pairType, xrp_only/xrpOnly, xrp_amount/xrpAmount
Example: GET /v1/history?md5=0413ca7cfc258dfaf698c02fe304e607&limit=50

GET /amm - AMM liquidity pools with metrics
Params: token (md5/slug/issuer_currency to filter), page, limit, sortBy (fees|apy|liquidity|volume|created)
Example: GET /v1/amm?token=0413ca7cfc258dfaf698c02fe304e607

GET /amm/info - Live AMM pool info
Params: asset, asset2 (md5/slug/issuer_currency or "XRP")
Example: GET /v1/amm/info?asset=XRP&asset2=0413ca7cfc258dfaf698c02fe304e607

GET /amm/liquidity-chart - Historical TVL chart
Params: token (md5/slug/issuer_currency)

POST /dex/quote - Get swap quote for token exchange
Body: { source_token, destination_token (md5/slug/issuer_currency), source_amount, destination_account }

GET /pairs/{md5} - Trading pairs for token
GET /stats/rates - Exchange rates (token1, token2: md5/slug/issuer_currency)`,

    account: `## Account API
Base URL: https://api.xrpl.to/v1

GET /account/balance/{account} - Detailed XRP balance with reserves
Response: { result, took, account, balance, total, balanceDrops, spendableDrops, ownerCount, reserve }

POST /account/balance - Batch balances (body: { accounts: string[] max 100 })
Response: { result, took, count, data: [{ account, balance, total }] }

GET /account/info/{account} - Pair balance info (curr1, issuer1, curr2, issuer2)
GET /account/tx/{account} - Trade history by pair (curr1, issuer1, curr2, issuer2)
GET /account/offers/{account} - Open DEX offers (pair, page, limit max:50)

GET /traders/{account} - Trader profile with stats
GET /watchlist?account={account} - User watchlist
POST /watchlist - Add/remove token (body: { account, md5, action: "add"|"remove" })`,

    nft: `## NFT API
Base URL: https://api.xrpl.to/v1

GET /nft/{NFTokenID} - Get NFT by 64-char ID
GET /nft/{NFTokenID}/offers - Buy/sell offers
GET /nft - List NFTs (cid, issuer, page, limit, sort, order)

GET /nft/collections - List collections (sortBy: vol24h|totalVol24h|volume, includeGlobalMetrics)
GET /nft/collections/{slug} - Collection by slug (includeNFTs, nftLimit)
GET /nft/collections/{slug}/nfts - NFTs in collection (sortBy: activity|price-low|price-high|minted-latest|minted-earliest, listed: true|false|xrp|non-xrp)
GET /nft/collections/{slug}/traders - Top traders (sort: volume7d|all, limit)
GET /nft/collections/{slug}/orderbook - Collection orderbook (limit)
GET /nft/collections/{slug}/metrics - Collection metrics
GET /nft/collections/{slug}/history - Activity history (page, limit, type filter)
GET /nft/collections/{slug}/floor/history - Floor price history (limit)
GET /nft/collections/{slug}/ownership - Ownership distribution (limit)

GET /nft/activity - Recent NFT activity (limit, cid filter)
GET /nft/history - NFT transaction history (NFTokenID, account, limit)
GET /nft/traders/{account}/volume - Trader volume stats
GET /nft/account/{account}/nfts - NFTs owned by account (limit, offset)
GET /nft/stats/global - Global NFT stats
GET /nft/brokers/stats - Broker fees and volumes`,

    xrpl: `## XRPL Node API
Base URL: https://api.xrpl.to/v1
Token identifiers: Orderbook accepts md5/slug/issuer_currency via base/quote params

GET /orderbook - Live DEX orderbook
Params (recommended): base, quote (md5/slug/issuer_currency or "XRP"), limit (default:20, max:400)
Params (legacy): base_currency, base_issuer, quote_currency, quote_issuer
Example: GET /v1/orderbook?base=XRP&quote=0413ca7cfc258dfaf698c02fe304e607
Response: { success, pair, base, quote, bids[], asks[], ledger_index }

GET /account/tx/{account} - Full transaction history
Params: limit (default:200, max:5000), marker (JSON string), types, forward (bool)

GET /trustlines/{account} - Account trustlines with token values
Params: offset, limit (default:10, max:50), format (raw|default|full), sort_by_value (bool)

GET /tx/{hash} - Transaction by hash
POST /account/path-find - Find payment paths`,

    analytics: `## Analytics API
Base URL: https://api.xrpl.to/v1

GET /token/analytics/token/{id} - Token analytics (id: md5/slug/issuer_currency)
GET /token/analytics/token/{id}/traders - Top traders for token (offset, limit, sort, address)
GET /token/analytics/trader/{account} - Trader cumulative stats
GET /token/analytics/trader/{account}/tokens - Trader per-token metrics (token param to filter)
GET /traders/token-traders/{id} - Top traders (interval, sort, limit, offset, minVolume, search)

GET /token/analytics/traders - All traders with cumulative stats
Params: offset, limit (default:50), sort (volume24h|pnl|trades|roi), order (asc|desc), minVolume, address, includeAMM (default:true), minTrades, minProfit, minROI, minTokens, startDate, endDate, period (24h|7d|30d|all), compact (bool)

GET /token/analytics/market - Daily market metrics (startDate required, endDate default:now)
GET /token/analytics/trader/{account}/history - Trader volume history (startDate, endDate, offset, limit)
GET /token/analytics/trader/{account}/trades - Trader trade history (startDate, endDate, offset, limit)
GET /token/analytics/traders/summary - Trader balance snapshots summary`,

    launch: `## Token Launch API
Base URL: https://api.xrpl.to/v1

POST /launch-token - Initialize token launch
Body: { currencyCode (1-20 chars, not "XRP"), tokenSupply (max ~10^16), ammXrpAmount (min 1), name, origin, user, userAddress (required if userCheckAmount>0), userCheckAmount (max 95%), antiSnipe (bool), platformRetentionPercent (0-10%, social rewards), bundleRecipients ([{address, percent}]), domain, description, telegram, twitter, imageData (base64) }
Typical cost: 6-20 XRP depending on configuration
Platform token share: optional 0-10% of supply allocated to reward up to 100 users who tweet about the token. xrpl.to receives no tokens from this allocation.
Response: { success, sessionId, status, issuerAddress, requiredFunding, fundingBreakdown }

GET /launch-token/status/{sessionId} - Poll launch status (every 3s recommended)
POST /launch-token/authorize - Request trustline authorization (anti-snipe mode)
GET /launch-token/queue-status/{sessionId} - Auth queue status
GET /launch-token/auth-info/{issuer}/{currency} - Token auth info
GET /launch-token/check-auth/{issuer}/{currency}/{address} - Check authorization
GET /launch-token/calculate-funding - Calculate required XRP funding
GET /launch-token/my-launches - User launch history (API key required)
POST /launch-token/{sessionId}/image - Upload token image (base64, max 500KB)

Revenue Sharing: Partner platforms earn 50% of launch fees (platform fee + bundle fees) for every token launched through their API key. Contact us for a partner key.`,

    tools: `## Tools API
Base URL: https://api.xrpl.to/v1

GET /health - API health check
GET /docs - API documentation JSON
GET /testnet/{address} - Get XRP balance on testnet`,

    reference: `## Reference
Token Identifiers:
- md5: 32-char hex, e.g., 0413ca7cfc258dfaf698c02fe304e607
- slug: issuer-currencyHex (dash separator), e.g., rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz-534F4C4F00...
- issuer_currency: issuer_currencyHex (underscore separator), e.g., rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz_534F4C4F00...

MD5 Generation:
MD5("rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz_534F4C4F00000000000000000000000000000000")
= 0413ca7cfc258dfaf698c02fe304e607
JavaScript: CryptoJS.MD5('issuer_currencyHex').toString()
Python: hashlib.md5(b'issuer_currencyHex').hexdigest()

Currency Hex (>3 chars): Buffer.from('SOLO').toString('hex').toUpperCase().padEnd(40, '0')
SOLO = 534F4C4F00000000000000000000000000000000

Patterns:
- md5: ^[a-f0-9]{32}$
- account: ^r[1-9A-HJ-NP-Za-km-z]{24,34}$
- NFTokenID: ^[A-Fa-f0-9]{64}$
- txHash: ^[A-Fa-f0-9]{64}$

Caching: Default Live (no caching), platformStatus 30s, News 5min, Cumulative Stats 10min, OHLC varies by range
Rate Limits: Anonymous (100 req/sec, 1 tx/sec, unlimited credits), Free (10 req/sec, 1 tx/sec, 1M credits/mo), Developer (50 req/sec, 5 tx/sec, 10M credits/mo), Business (200 req/sec, 50 tx/sec, 100M credits/mo), Professional (500 req/sec, 100 tx/sec, 200M credits/mo)`
  };

  const CopyButton = ({ text, id, label = 'Copy for LLM' }) => (
    <button
      onClick={() => copyToClipboard(text, id)}
      className={cn(
        'flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] font-medium',
        copiedBlock === id
          ? 'bg-emerald-500/10 text-emerald-500'
          : 'bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white/60'
      )}
    >
      {copiedBlock === id ? (
        <>
          <CheckCircle size={12} /> Copied!
        </>
      ) : (
        <>
          <Copy size={12} /> {label}
        </>
      )}
    </button>
  );

  const handleTryApi = async (apiPath) => {
    setIsLoading(true);
    setIsModalOpen(true);
    setApiResponse(null);

    try {
      const response = await api.get(`https://api.xrpl.to${apiPath}`);
      setApiResponse(response.data);
    } catch (error) {
      setApiResponse({
        error: 'Failed to fetch data',
        message: error.message,
        status: error.response?.status || 'Network Error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyResponse = () => {
    navigator.clipboard
      .writeText(JSON.stringify(apiResponse, null, 2))
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch((err) => console.error('Failed to copy:', err));
  };

  const renderContent = () => {
    switch (currentSection) {
      case 'endpoint-reference':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-normal text-primary mb-2">All Endpoints</h2>
                <p className={cn('text-[14px]', 'text-gray-600 dark:text-white/60')}>
                  Complete reference of all {getTotalEndpointCount()} API endpoints organized by
                  category.
                </p>
              </div>
              <ApiButton />
            </div>

            {Object.entries(API_REFERENCE).map(([key, category]) => (
              <div
                key={key}
                id={`ref-${key}`}
                className={cn(
                  'rounded-xl border-[1.5px] p-5',
                  'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
                )}
              >
                <div
                  className={cn(
                    'text-[11px] font-medium uppercase tracking-wide mb-4',
                    'text-gray-500 dark:text-white/40'
                  )}
                >
                  {category.label} ({category.endpoints.length})
                </div>
                <div className="space-y-3 text-[13px]">
                  {category.endpoints.map((ep) => (
                    <div key={ep.path} className={cn(
                      'rounded-lg p-3',
                      'bg-gray-50/50 dark:bg-white/[0.02]'
                    )}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <span
                            className={cn(
                              'px-1.5 py-0.5 text-[10px] font-medium rounded shrink-0 mt-0.5',
                              ep.method === 'GET'
                                ? 'bg-emerald-500/10 text-emerald-500'
                                : 'bg-amber-500/10 text-amber-500'
                            )}
                          >
                            {ep.method}
                          </span>
                          <div className="min-w-0">
                            <code
                              className={cn(
                                'font-mono text-[12px] break-all',
                                'text-cyan-600 dark:text-[#3f96fe]'
                              )}
                            >
                              /v1{ep.path}
                            </code>
                            <p className={cn('text-[11px] mt-1', 'text-gray-500 dark:text-white/50')}>
                              {ep.desc}
                            </p>
                          </div>
                        </div>
                        {canTryEndpoint(ep) && (
                          <button
                            onClick={() => tryEndpoint(ep)}
                            disabled={tryingEndpoint === ep.path}
                            className={cn(
                              'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium shrink-0 transition-colors',
                              'bg-primary/10 text-primary hover:bg-primary/15 dark:bg-primary/10 dark:text-primary dark:hover:bg-primary/20'
                            )}
                          >
                            {tryingEndpoint === ep.path ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Play size={12} />
                            )}
                            Try
                          </button>
                        )}
                      </div>
                      {endpointResponse?.path === ep.path && (
                        <div className={cn(
                          'mt-3 rounded-lg border overflow-hidden',
                          'border-gray-200 dark:border-white/10'
                        )}>
                          <div className={cn(
                            'flex items-center justify-between px-3 py-2 text-[10px]',
                            'bg-gray-100 dark:bg-white/5'
                          )}>
                            <code className={cn(
                              'font-mono truncate',
                              'text-gray-600 dark:text-white/60'
                            )}>
                              {endpointResponse.url}
                            </code>
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(JSON.stringify(endpointResponse.data || endpointResponse.error, null, 2));
                                  setCopiedBlock(`resp-${ep.path}`);
                                  setTimeout(() => setCopiedBlock(null), 2000);
                                }}
                                className={cn(
                                  'flex items-center gap-1 px-2 py-0.5 rounded text-[10px]',
                                  'hover:bg-gray-200 dark:hover:bg-white/10'
                                )}
                              >
                                {copiedBlock === `resp-${ep.path}` ? <CheckCircle size={10} /> : <Copy size={10} />}
                                {copiedBlock === `resp-${ep.path}` ? 'Copied' : 'Copy'}
                              </button>
                              <button
                                onClick={() => setEndpointResponse(null)}
                                className={cn(
                                  'p-1 rounded',
                                  'hover:bg-gray-200 dark:hover:bg-white/10'
                                )}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                          <pre className={cn(
                            'p-3 text-[10px] leading-relaxed max-h-[200px] overflow-auto font-mono',
                            endpointResponse.error ? 'text-red-400' : ''
                          )}>
                            {endpointResponse.error
                              ? JSON.stringify(endpointResponse.error, null, 2)
                              : highlightJson(endpointResponse.data)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case 'overview':
        return (
          <div className="space-y-8">
            {/* Hero */}
            <div>
              <p className="text-primary text-[13px] font-medium mb-2">Get Started</p>
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl font-normal">Welcome to XRPL.to API</h1>
                <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-primary/10 text-primary">
                  v{docs.version}
                </span>
              </div>
              <p
                className={cn(
                  'text-[15px] leading-relaxed',
                  'text-gray-600 dark:text-white/60'
                )}
              >
                The comprehensive XRP Ledger API for builders who demand excellence. Fast, reliable
                infrastructure that scales with your ambitions.
              </p>
            </div>

            {/* Base URL */}
            <div
              id="base-url"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                'border-primary/20 bg-primary/5 dark:border-primary/30 dark:bg-primary/5'
              )}
            >
              <div className="flex items-center gap-2 mb-3">
                <Server size={16} className="text-primary" />
                <h2 className="text-[15px] font-medium">Base URL</h2>
              </div>
              <div
                className={cn(
                  'p-3 rounded-lg font-mono text-[13px]',
                  'bg-[rgba(59,130,246,0.02)] border border-[rgba(59,130,246,0.15)] dark:bg-[rgba(59,130,246,0.02)]'
                )}
              >
                {docs.baseUrl}
              </div>
            </div>

            {/* Feature Cards */}
            <div id="start-building">
              <h2 className="text-xl font-normal mb-4">Start Building</h2>
              <p className={cn('text-[14px] mb-5', 'text-gray-600 dark:text-white/60')}>
                Everything you need to build world-class applications on XRP Ledger.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    icon: Zap,
                    title: 'Quick Start',
                    desc: 'Make your first API call in minutes and start building.',
                    action: null
                  },
                  {
                    icon: Clock,
                    title: 'Rate Limits',
                    desc: 'Free: 10 req/sec, 1 tx/sec. Professional: 500 req/sec, 100 tx/sec. See API Keys for tiers.',
                    action: 'api-keys'
                  },
                  {
                    icon: Code,
                    title: 'API Reference',
                    desc: `${getTotalEndpointCount()} endpoints with full documentation.`,
                    action: 'endpoint-reference'
                  }
                ].map((card) => (
                  <div
                    key={card.title}
                    className={cn(
                      'rounded-xl border-[1.5px] p-5 cursor-pointer transition-colors',
                      'border-[rgba(59,130,246,0.15)] hover:border-[rgba(59,130,246,0.25)] bg-[rgba(59,130,246,0.02)] dark:border-[rgba(59,130,246,0.1)] dark:hover:border-[rgba(59,130,246,0.2)] dark:bg-[rgba(59,130,246,0.02)]'
                    )}
                    onClick={() => card.action && setCurrentSection(card.action)}
                  >
                    <card.icon size={20} className="text-primary mb-3" />
                    <h3 className="text-[14px] font-medium mb-1">{card.title}</h3>
                    <p className={cn('text-[13px]', 'text-gray-500 dark:text-white/50')}>
                      {card.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Start Example */}
            <div
              id="quick-start"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
              )}
            >
              <h3 className="text-[15px] font-medium mb-3">Quick Start Example</h3>
              <p className={cn('text-[13px] mb-3', 'text-gray-600 dark:text-white/60')}>
                Get top tokens by 24h volume:
              </p>
              <div
                className={cn(
                  'p-3 rounded-lg font-mono text-[13px] overflow-x-auto',
                  'bg-[rgba(59,130,246,0.02)] border border-[rgba(59,130,246,0.15)] dark:bg-[rgba(59,130,246,0.02)]'
                )}
              >
                <span className="text-primary">curl</span> -X GET
                "https://api.xrpl.to/v1/tokens?limit=10&sort=volume"
              </div>
              <button
                onClick={() => handleTryApi('/v1/tokens?limit=5&sort=volume')}
                className={cn(
                  'mt-3 flex items-center gap-2 rounded-lg border-[1.5px] px-3 py-1.5 text-[12px] font-medium text-primary',
                  'border-primary/30 bg-primary/5 hover:bg-primary/10 dark:border-primary/30 dark:bg-primary/5 dark:hover:bg-primary/10'
                )}
              >
                <Code size={12} /> Try It
              </button>
            </div>
          </div>
        );


      case 'tokens':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-normal text-primary">Tokens</h2>
              <CopyButton text={llmSnippets.tokens} id="llm-tokens-section" />
            </div>

            <div
              className={cn(
                'rounded-lg p-3 text-[12px]',
                'bg-primary/5 border border-primary/20 dark:bg-primary/5 dark:border dark:border-primary/20'
              )}
            >
              <span className="text-primary font-medium">Identifier:</span>{' '}
              <span className={'text-gray-600 dark:text-white/70'}>
                Use <code className="text-primary">md5</code> (32-char hex) to identify tokens.
                <button
                  onClick={() => setCurrentSection('reference')}
                  className="text-primary hover:underline ml-1"
                >
                  Learn how to generate md5 →
                </button>
              </span>
            </div>

            {/* GET /tokens */}
            <div
              id="get-tokens"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-emerald-500/10 text-emerald-500 uppercase tracking-wide">
                  GET
                </span>
                <code className="text-[15px] font-mono">/v1/tokens</code>
              </div>
              <p className={cn('text-[13px] mb-4', 'text-gray-600 dark:text-white/60')}>
                List all tokens with filtering and sorting
              </p>
              <div
                className={cn(
                  'rounded-lg overflow-hidden border-[1.5px] mb-4',
                  'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
                )}
              >
                <table className="w-full text-[12px]">
                  <thead className={'bg-gray-50 dark:bg-white/5'}>
                    <tr>
                      <th
                        className={cn(
                          'text-left px-3 py-2 font-medium',
                          'text-gray-600 dark:text-white/60'
                        )}
                      >
                        Param
                      </th>
                      <th
                        className={cn(
                          'text-left px-3 py-2 font-medium',
                          'text-gray-600 dark:text-white/60'
                        )}
                      >
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['offset', 'int (default: 0) - Pagination offset'],
                      ['limit', 'int (default: 100, max: 100) - Results per page'],
                      ['sort', 'volume | marketcap | change24h | change5m | trending | assessment'],
                      ['order', 'asc | desc (default: desc)'],
                      ['filter', 'text search'],
                      ['tag', 'Filter by category tag'],
                      ['watchlist', 'Comma-separated token ids'],
                      ['show_new', 'bool - Include new tokens (alias: showNew)'],
                      ['show_slug', 'bool - Include slug in response (alias: showSlug)'],
                      ['token_type', 'trustline | lp | mpt (alias: tokenType)'],
                      ['skip_metrics', 'bool - Skip global metrics (alias: skipMetrics)']
                    ].map(([param, desc]) => (
                      <tr
                        key={param}
                        className={
                          'border-t border-[rgba(59,130,246,0.15)] dark:border-t dark:border-[rgba(59,130,246,0.1)]'
                        }
                      >
                        <td className="px-3 py-2">
                          <code className="text-primary">{param}</code>
                        </td>
                        <td className={cn('px-3 py-2', 'text-gray-600 dark:text-white/60')}>
                          {desc}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div
                className={cn(
                  'relative group rounded-lg overflow-hidden',
                  'bg-[rgba(59,130,246,0.02)] border border-[rgba(59,130,246,0.15)] dark:bg-[rgba(59,130,246,0.02)]'
                )}
              >
                <pre className="p-3 font-mono text-[12px] overflow-x-auto m-0">
                  <span className="text-emerald-500">GET</span>{' '}
                  /v1/tokens?limit=20&sort=volume&order=desc
                </pre>
              </div>
              <button
                onClick={() => handleTryApi('/v1/tokens?limit=10&sort=volume')}
                className={cn(
                  'mt-3 flex items-center gap-2 rounded-lg border-[1.5px] px-3 py-1.5 text-[12px] font-medium text-primary',
                  'border-primary/30 bg-primary/5 hover:bg-primary/10 dark:border-primary/30 dark:bg-primary/5 dark:hover:bg-primary/10'
                )}
              >
                <Code size={12} /> Try It
              </button>
            </div>

            {/* GET /token/{id} */}
            <div
              id="get-token"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-emerald-500/10 text-emerald-500 uppercase tracking-wide">
                  GET
                </span>
                <code className="text-[15px] font-mono">/v1/token/{'{id}'}</code>
              </div>
              <p className={cn('text-[13px] mb-3', 'text-gray-600 dark:text-white/60')}>
                Get single token by <span className="text-primary font-medium">md5</span>{' '}
                (recommended), slug, or issuer_currency format.
                <button
                  onClick={() => setCurrentSection('reference')}
                  className="text-primary hover:underline ml-1"
                >
                  See Reference →
                </button>
              </p>
              <div
                className={cn(
                  'rounded-lg overflow-hidden border-[1.5px] mb-3',
                  'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
                )}
              >
                <table className="w-full text-[12px]">
                  <thead className={'bg-gray-50 dark:bg-white/5'}>
                    <tr>
                      <th
                        className={cn(
                          'text-left px-3 py-2 font-medium',
                          'text-gray-600 dark:text-white/60'
                        )}
                      >
                        Format
                      </th>
                      <th
                        className={cn(
                          'text-left px-3 py-2 font-medium',
                          'text-gray-600 dark:text-white/60'
                        )}
                      >
                        Example
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['md5 (recommended)', '0413ca7cfc258dfaf698c02fe304e607'],
                      ['slug', 'rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz-SOLO'],
                      ['issuer_currency', 'rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz_534F4C4F00...']
                    ].map(([format, example]) => (
                      <tr
                        key={format}
                        className={
                          'border-t border-[rgba(59,130,246,0.15)] dark:border-t dark:border-[rgba(59,130,246,0.1)]'
                        }
                      >
                        <td className="px-3 py-2">
                          <code className={format.includes('recommended') ? 'text-primary' : ''}>
                            {format}
                          </code>
                        </td>
                        <td
                          className={cn(
                            'px-3 py-2 font-mono text-[11px]',
                            'text-gray-600 dark:text-white/60'
                          )}
                        >
                          {example}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div
                className={cn(
                  'relative group rounded-lg overflow-hidden',
                  'bg-[rgba(59,130,246,0.02)] border border-[rgba(59,130,246,0.15)] dark:bg-[rgba(59,130,246,0.02)]'
                )}
              >
                <pre className="p-3 font-mono text-[12px] overflow-x-auto m-0">
                  <span className="text-emerald-500">GET</span>{' '}
                  /v1/token/0413ca7cfc258dfaf698c02fe304e607
                </pre>
              </div>
              <button
                onClick={() => handleTryApi('/v1/token/0413ca7cfc258dfaf698c02fe304e607')}
                className={cn(
                  'mt-3 flex items-center gap-2 rounded-lg border-[1.5px] px-3 py-1.5 text-[12px] font-medium text-primary',
                  'border-primary/30 bg-primary/5 hover:bg-primary/10 dark:border-primary/30 dark:bg-primary/5 dark:hover:bg-primary/10'
                )}
              >
                <Code size={12} /> Try It
              </button>
            </div>

            {/* POST /search */}
            <div
              id="post-search"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-amber-500/10 text-amber-500 uppercase tracking-wide">
                  POST
                </span>
                <code className="text-[15px] font-mono">/v1/search</code>
              </div>
              <p className={cn('text-[13px] mb-3', 'text-gray-600 dark:text-white/60')}>
                Search tokens by name/symbol/issuer
              </p>
              <div
                className={cn(
                  'relative group rounded-lg overflow-hidden',
                  'bg-[rgba(59,130,246,0.02)] border border-[rgba(59,130,246,0.15)] dark:bg-[rgba(59,130,246,0.02)]'
                )}
              >
                <pre className="p-3 font-mono text-[12px] overflow-x-auto m-0">
                  {`Body: { "search": "solo", "page": 0, "limit": 20 }`}
                </pre>
              </div>
            </div>

            {/* Other endpoints */}
            <div
              id="other-endpoints"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
              )}
            >
              <div
                className={cn(
                  'text-[11px] font-medium uppercase tracking-wide mb-3',
                  'text-gray-500 dark:text-white/40'
                )}
              >
                Other Endpoints
              </div>
              <div className="space-y-2 text-[13px]">
                {[
                  ['GET', '/v1/tokens/slugs', 'Get all token slugs'],
                  ['GET', '/v1/tags', 'Get all token tags with counts'],
                  ['GET', '/v1/creator-activity/{id}', 'Creator activity by md5 or address'],
                  [
                    'GET',
                    '/v1/traders/token-traders/{md5}',
                    'Top traders with P&L (sortBy: volume|pnl|trades)'
                  ]
                ].map(([method, path, desc]) => (
                  <div key={path} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span
                      className={cn(
                        'px-1.5 py-0.5 text-[10px] font-medium rounded',
                        method === 'GET'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-amber-500/10 text-amber-500'
                      )}
                    >
                      {method}
                    </span>
                    <code className="font-mono text-[12px]">{path}</code>
                    <span className={'text-gray-500 dark:text-white/40'}>- {desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'market':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-normal text-primary">Market Data</h2>
              <CopyButton text={llmSnippets.market} id="llm-market-section" />
            </div>

            <div
              className={cn(
                'rounded-lg p-3 text-[12px]',
                'bg-primary/5 border border-primary/20 dark:bg-primary/5 dark:border dark:border-primary/20'
              )}
            >
              <span className="text-primary font-medium">Identifier:</span>{' '}
              <span className={'text-gray-600 dark:text-white/70'}>
                Use <code className="text-primary">md5</code> (32-char hex) to identify tokens in
                chart/holder endpoints.
              </span>
            </div>

            {/* OHLC */}
            <div
              id="ohlc"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-emerald-500/10 text-emerald-500 uppercase tracking-wide">
                  GET
                </span>
                <code className="text-[15px] font-mono">/v1/ohlc/{'{md5}'}</code>
              </div>
              <p className={cn('text-[13px] mb-3', 'text-gray-600 dark:text-white/60')}>
                Get OHLC candlestick chart data
              </p>
              <div
                className={cn(
                  'rounded-lg overflow-hidden border-[1.5px] mb-4',
                  'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
                )}
              >
                <table className="w-full text-[12px]">
                  <thead className={'bg-gray-50 dark:bg-white/5'}>
                    <tr>
                      <th
                        className={cn(
                          'text-left px-3 py-2 font-medium',
                          'text-gray-600 dark:text-white/60'
                        )}
                      >
                        Param
                      </th>
                      <th
                        className={cn(
                          'text-left px-3 py-2 font-medium',
                          'text-gray-600 dark:text-white/60'
                        )}
                      >
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['md5', '32-char token md5 (required)'],
                      ['range', '1D | 5D | 1M | 3M | 1Y | 5Y | ALL (default: 1D)'],
                      ['interval', '1m | 5m | 15m | 30m | 1h | 4h | 1d | 1w'],
                      ['vs_currency', 'XRP | USD | EUR | JPY | CNH (default: XRP)']
                    ].map(([param, desc]) => (
                      <tr
                        key={param}
                        className={
                          'border-t border-[rgba(59,130,246,0.15)] dark:border-t dark:border-[rgba(59,130,246,0.1)]'
                        }
                      >
                        <td className="px-3 py-2">
                          <code className="text-primary">{param}</code>
                        </td>
                        <td className={cn('px-3 py-2', 'text-gray-600 dark:text-white/60')}>
                          {desc}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div
                className={cn(
                  'relative group rounded-lg overflow-hidden',
                  'bg-[rgba(59,130,246,0.02)] border border-[rgba(59,130,246,0.15)] dark:bg-[rgba(59,130,246,0.02)]'
                )}
              >
                <pre className="p-3 font-mono text-[12px] overflow-x-auto m-0">
                  <span className="text-emerald-500">GET</span>{' '}
                  /v1/ohlc/0413ca7cfc258dfaf698c02fe304e607?range=1D
                </pre>
              </div>
            </div>

            {/* Other market endpoints */}
            <div
              id="other-market"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
              )}
            >
              <div
                className={cn(
                  'text-[11px] font-medium uppercase tracking-wide mb-3',
                  'text-gray-500 dark:text-white/40'
                )}
              >
                Other Endpoints
              </div>
              <div className="space-y-2 text-[13px]">
                {[
                  [
                    'GET',
                    '/v1/sparkline/{id}',
                    'Sparkline data (period: 24h|7d, lightweight, max_points)'
                  ],
                  ['GET', '/v1/holders/list/{id}', 'Token holder richlist (offset, limit)'],
                  ['GET', '/v1/holders/info/{id}', 'Holder concentration stats'],
                  ['GET', '/v1/holders/graph/{id}', 'Holder count history'],
                  [
                    'GET',
                    '/v1/rsi',
                    'RSI indicators with filtering (all timeframes, market/volume/price filters)'
                  ],
                  ['POST', '/v1/stats/metrics', 'Historical metrics by timestamps'],
                  ['GET', '/v1/stats', 'Global platform metrics'],
                  ['GET', '/v1/stats/rates', 'Exchange rates (token1, token2)'],
                  ['GET', '/v1/news', 'XRPL news with sentiment'],
                  ['GET', '/v1/news/search?q={query}', 'Search news articles']
                ].map(([method, path, desc]) => (
                  <div key={path} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span
                      className={cn(
                        'px-1.5 py-0.5 text-[10px] font-medium rounded',
                        method === 'GET'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-amber-500/10 text-amber-500'
                      )}
                    >
                      {method}
                    </span>
                    <code className="font-mono text-[12px]">{path}</code>
                    <span className={'text-gray-500 dark:text-white/40'}>- {desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'trading':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-normal text-primary">Trading</h2>
              <CopyButton text={llmSnippets.trading} id="llm-trading-section" />
            </div>

            <div
              className={cn(
                'rounded-lg p-3 text-[12px]',
                'bg-primary/5 border border-primary/20 dark:bg-primary/5 dark:border dark:border-primary/20'
              )}
            >
              <span className="text-primary font-medium">Identifier:</span>{' '}
              <span className={'text-gray-600 dark:text-white/70'}>
                Use <code className="text-primary">md5</code> for tokens,{' '}
                <code className="text-primary">account</code> (r-address) for wallets.
              </span>
            </div>

            {/* GET /history */}
            <div
              id="history"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-emerald-500/10 text-emerald-500 uppercase tracking-wide">
                  GET
                </span>
                <code className="text-[15px] font-mono">/v1/history</code>
              </div>
              <p className={cn('text-[13px] mb-3', 'text-gray-600 dark:text-white/60')}>
                Get trade history for a token
              </p>
              <div
                className={cn(
                  'rounded-lg overflow-hidden border-[1.5px] mb-4',
                  'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
                )}
              >
                <table className="w-full text-[12px]">
                  <thead className={'bg-gray-50 dark:bg-white/5'}>
                    <tr>
                      <th
                        className={cn(
                          'text-left px-3 py-2 font-medium',
                          'text-gray-600 dark:text-white/60'
                        )}
                      >
                        Param
                      </th>
                      <th
                        className={cn(
                          'text-left px-3 py-2 font-medium',
                          'text-gray-600 dark:text-white/60'
                        )}
                      >
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['md5', 'Token md5 (required unless account provided)'],
                      ['account', 'Filter by account address'],
                      ['offset', 'int (default: 0)'],
                      ['limit', 'int (default: 20, max: 5000)'],
                      ['start_time', 'Unix timestamp ms (alias: startTime)'],
                      ['end_time', 'Unix timestamp ms (alias: endTime)'],
                      ['pair_type', 'xrp|token - filter by pair type (alias: pairType)'],
                      ['xrp_only', 'bool - Only XRP trades (alias: xrpOnly)'],
                      ['xrp_amount', 'Minimum XRP amount filter (alias: xrpAmount)']
                    ].map(([param, desc]) => (
                      <tr
                        key={param}
                        className={
                          'border-t border-[rgba(59,130,246,0.15)] dark:border-t dark:border-[rgba(59,130,246,0.1)]'
                        }
                      >
                        <td className="px-3 py-2">
                          <code className="text-primary">{param}</code>
                        </td>
                        <td className={cn('px-3 py-2', 'text-gray-600 dark:text-white/60')}>
                          {desc}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div
                className={cn(
                  'relative group rounded-lg overflow-hidden',
                  'bg-[rgba(59,130,246,0.02)] border border-[rgba(59,130,246,0.15)] dark:bg-[rgba(59,130,246,0.02)]'
                )}
              >
                <pre className="p-3 font-mono text-[12px] overflow-x-auto m-0">
                  <span className="text-emerald-500">GET</span>{' '}
                  /v1/history?md5=0413ca7cfc258dfaf698c02fe304e607&limit=50
                </pre>
              </div>
            </div>

            {/* AMM Endpoints */}
            <div
              id="amm-endpoints"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
              )}
            >
              <div
                className={cn(
                  'text-[11px] font-medium uppercase tracking-wide mb-3',
                  'text-gray-500 dark:text-white/40'
                )}
              >
                AMM Pools
              </div>
              <div className="space-y-2 text-[13px]">
                {[
                  [
                    'GET',
                    '/v1/amm',
                    'List AMM pools (token: md5 to filter, sortBy: fees|apy|liquidity|volume)'
                  ],
                  [
                    'GET',
                    '/v1/amm/info',
                    'Pool info (asset, asset2: md5/slug/issuer_currency or XRP)'
                  ],
                  [
                    'GET',
                    '/v1/amm/liquidity-chart',
                    'TVL history (token: md5/slug/issuer_currency)'
                  ]
                ].map(([method, path, desc]) => (
                  <div key={path} className="flex flex-wrap items-start gap-x-2 gap-y-0.5">
                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-500/10 text-emerald-500 shrink-0 mt-0.5">
                      {method}
                    </span>
                    <code className="font-mono text-[12px]">{path}</code>
                    <span className={'text-gray-500 dark:text-white/40'}>- {desc}</span>
                  </div>
                ))}
              </div>
              <div
                className={cn(
                  'relative group rounded-lg overflow-hidden mt-3',
                  'bg-[rgba(59,130,246,0.02)] border border-[rgba(59,130,246,0.15)] dark:bg-[rgba(59,130,246,0.02)]'
                )}
              >
                <pre className="p-3 font-mono text-[11px] overflow-x-auto m-0">
                  <span className="text-emerald-500">GET</span>{' '}
                  /v1/amm?token=0413ca7cfc258dfaf698c02fe304e607{'\n'}
                  <span className="text-emerald-500">GET</span>{' '}
                  /v1/amm/info?asset=XRP&asset2=0413ca7cfc258dfaf698c02fe304e607
                </pre>
              </div>
            </div>

            {/* DEX Quote */}
            <div
              id="dex-quote"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-amber-500/10 text-amber-500 uppercase tracking-wide">
                  POST
                </span>
                <code className="text-[15px] font-mono">/v1/dex/quote</code>
              </div>
              <p className={cn('text-[13px] mb-3', 'text-gray-600 dark:text-white/60')}>
                Get swap quote for token exchange. Supports md5/slug/issuer_currency for tokens.
              </p>
              <div
                className={cn(
                  'rounded-lg overflow-hidden border-[1.5px] mb-3',
                  'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
                )}
              >
                <table className="w-full text-[12px]">
                  <thead className={'bg-gray-50 dark:bg-white/5'}>
                    <tr>
                      <th
                        className={cn(
                          'text-left px-3 py-2 font-medium',
                          'text-gray-600 dark:text-white/60'
                        )}
                      >
                        Body Param
                      </th>
                      <th
                        className={cn(
                          'text-left px-3 py-2 font-medium',
                          'text-gray-600 dark:text-white/60'
                        )}
                      >
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['source_token', 'md5/slug/issuer_currency (or omit for XRP)'],
                      ['destination_token', 'md5/slug/issuer_currency (or omit for XRP)'],
                      ['source_amount', 'Amount to swap'],
                      ['destination_account', 'Recipient address']
                    ].map(([param, desc]) => (
                      <tr
                        key={param}
                        className={
                          'border-t border-[rgba(59,130,246,0.15)] dark:border-t dark:border-[rgba(59,130,246,0.1)]'
                        }
                      >
                        <td className="px-3 py-2">
                          <code className="text-primary">{param}</code>
                        </td>
                        <td className={cn('px-3 py-2', 'text-gray-600 dark:text-white/60')}>
                          {desc}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Other trading endpoints */}
            <div
              id="other-trading"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
              )}
            >
              <div
                className={cn(
                  'text-[11px] font-medium uppercase tracking-wide mb-3',
                  'text-gray-500 dark:text-white/40'
                )}
              >
                Other Endpoints
              </div>
              <div className="space-y-2 text-[13px]">
                {[
                  ['GET', '/v1/pairs/{md5}', 'Trading pairs for token'],
                  [
                    'GET',
                    '/v1/stats/rates',
                    'Exchange rates (token1, token2: md5/slug/issuer_currency)'
                  ]
                ].map(([method, path, desc]) => (
                  <div key={path} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-500/10 text-emerald-500">
                      {method}
                    </span>
                    <code className="font-mono text-[12px]">{path}</code>
                    <span className={'text-gray-500 dark:text-white/40'}>- {desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'accounts':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-normal text-primary">Accounts</h2>
              <CopyButton text={llmSnippets.account} id="llm-account-section" />
            </div>

            <div
              className={cn(
                'rounded-lg p-3 text-[12px]',
                'bg-primary/5 border border-primary/20 dark:bg-primary/5 dark:border dark:border-primary/20'
              )}
            >
              <span className="text-primary font-medium">Identifier:</span>{' '}
              <span className={'text-gray-600 dark:text-white/70'}>
                Use <code className="text-primary">account</code> or{' '}
                <code className="text-primary">address</code> (r-address format, e.g.,
                rN7n3473SaZBCG4dFL83w7a1RXtXtbk2D9).
              </span>
            </div>

            {/* Account endpoints list */}
            <div
              id="account-endpoints"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
              )}
            >
              <div className="space-y-2 text-[13px]">
                {[
                  ['GET', '/v1/account/balance/{account}', 'Detailed XRP balance with reserves'],
                  ['POST', '/v1/account/balance', 'Batch balances (body: { accounts[] max 100 })'],
                  [
                    'GET',
                    '/v1/account/info/{account}',
                    'Account info (balance, reserves, domain, inception)'
                  ],
                  [
                    'GET',
                    '/v1/account/tx/{account}',
                    'Full transaction history (limit, marker, types, forward)'
                  ],
                  [
                    'GET',
                    '/v1/account/offers/{account}',
                    'Open DEX offers (pair, page, limit max:50)'
                  ],
                  ['GET', '/v1/traders/{account}', 'Trader profile with stats'],
                  ['GET', '/v1/watchlist?account={account}', 'User watchlist'],
                  ['POST', '/v1/watchlist', 'Add/remove token (body: { account, md5, action })']
                ].map(([method, path, desc]) => (
                  <div key={path} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span
                      className={cn(
                        'px-1.5 py-0.5 text-[10px] font-medium rounded',
                        method === 'GET'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-amber-500/10 text-amber-500'
                      )}
                    >
                      {method}
                    </span>
                    <code className="font-mono text-[12px]">{path}</code>
                    <span className={'text-gray-500 dark:text-white/40'}>- {desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* tx detail */}
            <div
              id="account-tx"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-emerald-500/10 text-emerald-500 uppercase tracking-wide">
                  GET
                </span>
                <code className="text-[15px] font-mono">/v1/tx/{'{account}'}</code>
              </div>
              <p className={cn('text-[13px] mb-3', 'text-gray-600 dark:text-white/60')}>
                Full transaction history with pagination
              </p>
              <div
                className={cn(
                  'rounded-lg overflow-hidden border-[1.5px]',
                  'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
                )}
              >
                <table className="w-full text-[12px]">
                  <thead className={'bg-gray-50 dark:bg-white/5'}>
                    <tr>
                      <th
                        className={cn(
                          'text-left px-3 py-2 font-medium',
                          'text-gray-600 dark:text-white/60'
                        )}
                      >
                        Param
                      </th>
                      <th
                        className={cn(
                          'text-left px-3 py-2 font-medium',
                          'text-gray-600 dark:text-white/60'
                        )}
                      >
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['limit', 'int (default: 200, max: 400)'],
                      ['marker', 'Pagination marker (JSON string)'],
                      ['ledger_index_min', 'Start ledger'],
                      ['ledger_index_max', 'End ledger'],
                      ['tx_type', 'Filter by transaction type'],
                      ['forward', 'bool - Chronological order']
                    ].map(([param, desc]) => (
                      <tr
                        key={param}
                        className={
                          'border-t border-[rgba(59,130,246,0.15)] dark:border-t dark:border-[rgba(59,130,246,0.1)]'
                        }
                      >
                        <td className="px-3 py-2">
                          <code className="text-primary">{param}</code>
                        </td>
                        <td className={cn('px-3 py-2', 'text-gray-600 dark:text-white/60')}>
                          {desc}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'nft':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-normal text-primary">NFT</h2>
              <CopyButton text={llmSnippets.nft} id="llm-nft-section" />
            </div>

            <div
              className={cn(
                'rounded-lg p-3 text-[12px]',
                'bg-primary/5 border border-primary/20 dark:bg-primary/5 dark:border dark:border-primary/20'
              )}
            >
              <span className="text-primary font-medium">Identifiers:</span>{' '}
              <span className={'text-gray-600 dark:text-white/70'}>
                <code className="text-primary">NFTokenID</code> (64-char hex) for NFTs,{' '}
                <code className="text-primary">slug</code> for collections.
              </span>
            </div>

            {/* NFT endpoints */}
            <div
              id="single-nft"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
              )}
            >
              <div
                className={cn(
                  'text-[11px] font-medium uppercase tracking-wide mb-3',
                  'text-gray-500 dark:text-white/40'
                )}
              >
                Single NFT
              </div>
              <div className="space-y-2 text-[13px]">
                {[
                  ['GET', '/v1/nft/{NFTokenID}', 'Get NFT by 64-char ID'],
                  ['GET', '/v1/nft/{NFTokenID}/offers', 'Buy/sell offers for NFT'],
                  ['GET', '/v1/nft', 'List NFTs (cid, issuer, page, limit, sort)']
                ].map(([method, path, desc]) => (
                  <div key={path} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-500/10 text-emerald-500">
                      {method}
                    </span>
                    <code className="font-mono text-[12px]">{path}</code>
                    <span className={'text-gray-500 dark:text-white/40'}>- {desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              id="collections"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
              )}
            >
              <div
                className={cn(
                  'text-[11px] font-medium uppercase tracking-wide mb-3',
                  'text-gray-500 dark:text-white/40'
                )}
              >
                Collections
              </div>
              <div className="space-y-2 text-[13px]">
                {[
                  ['GET', '/v1/nft/collections', 'List collections (sortBy, order)'],
                  ['GET', '/v1/nft/collections/{slug}', 'Collection by slug'],
                  ['GET', '/v1/nft/collections/{slug}/nfts', 'NFTs in collection'],
                  ['GET', '/v1/nft/collections/{slug}/traders', 'Top traders'],
                  ['GET', '/v1/nft/collections/{slug}/orderbook', 'Collection orderbook'],
                  ['GET', '/v1/nft/collections/{slug}/history', 'Activity history'],
                  ['GET', '/v1/nft/collections/{slug}/floor/history', 'Floor price history'],
                  ['GET', '/v1/nft/collections/{slug}/metrics', 'Collection metrics'],
                  ['GET', '/v1/nft/collections/{slug}/ownership', 'Ownership distribution']
                ].map(([method, path, desc]) => (
                  <div key={path} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-500/10 text-emerald-500">
                      {method}
                    </span>
                    <code className="font-mono text-[12px]">{path}</code>
                    <span className={'text-gray-500 dark:text-white/40'}>- {desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              id="activity"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
              )}
            >
              <div
                className={cn(
                  'text-[11px] font-medium uppercase tracking-wide mb-3',
                  'text-gray-500 dark:text-white/40'
                )}
              >
                Activity & Traders
              </div>
              <div className="space-y-2 text-[13px]">
                {[
                  ['GET', '/v1/nft/activity', 'Recent NFT activity'],
                  ['GET', '/v1/nft/history', 'NFT transaction history'],
                  ['GET', '/v1/nft/traders/{account}/volume', 'Trader volume stats'],
                  ['GET', '/v1/nft/account/{account}/nfts', 'NFTs owned by account (limit, offset)'],
                  ['GET', '/v1/nft/stats/global', 'Global NFT stats'],
                  ['GET', '/v1/nft/brokers/stats', 'Broker fees and volumes']
                ].map(([method, path, desc]) => (
                  <div key={path} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span
                      className={cn(
                        'px-1.5 py-0.5 text-[10px] font-medium rounded',
                        method === 'GET'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-amber-500/10 text-amber-500'
                      )}
                    >
                      {method}
                    </span>
                    <code className="font-mono text-[12px]">{path}</code>
                    <span className={'text-gray-500 dark:text-white/40'}>- {desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'xrpl':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-normal text-primary">XRPL Node</h2>
              <CopyButton text={llmSnippets.xrpl} id="llm-xrpl-section" />
            </div>

            <div
              className={cn(
                'rounded-lg p-3 text-[12px]',
                'bg-primary/5 border border-primary/20 dark:bg-primary/5 dark:border dark:border-primary/20'
              )}
            >
              <span className="text-primary font-medium">Identifiers:</span>{' '}
              <span className={'text-gray-600 dark:text-white/70'}>
                <code className="text-primary">currency</code> (3-char or 40-char hex),{' '}
                <code className="text-primary">issuer</code> (r-address),{' '}
                <code className="text-primary">hash</code> (64-char tx hash).
              </span>
            </div>

            {/* Orderbook detail */}
            <div
              id="orderbook"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-emerald-500/10 text-emerald-500 uppercase tracking-wide">
                  GET
                </span>
                <code className="text-[15px] font-mono">/v1/orderbook</code>
              </div>
              <p className={cn('text-[13px] mb-3', 'text-gray-600 dark:text-white/60')}>
                Live DEX orderbook. Supports{' '}
                <span className="text-primary">md5/slug/issuer_currency</span> for tokens.
              </p>
              <div
                className={cn(
                  'rounded-lg overflow-hidden border-[1.5px] mb-4',
                  'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
                )}
              >
                <table className="w-full text-[12px]">
                  <thead className={'bg-gray-50 dark:bg-white/5'}>
                    <tr>
                      <th
                        className={cn(
                          'text-left px-3 py-2 font-medium',
                          'text-gray-600 dark:text-white/60'
                        )}
                      >
                        Param
                      </th>
                      <th
                        className={cn(
                          'text-left px-3 py-2 font-medium',
                          'text-gray-600 dark:text-white/60'
                        )}
                      >
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['base', 'md5/slug/issuer_currency or "XRP" (recommended)'],
                      ['quote', 'md5/slug/issuer_currency or "XRP" (recommended)'],
                      ['base_currency', 'Legacy: currency hex or 3-char code'],
                      ['base_issuer', 'Legacy: issuer r-address'],
                      ['quote_currency', 'Legacy: currency hex or 3-char code'],
                      ['quote_issuer', 'Legacy: issuer r-address'],
                      ['limit', 'int (default: 20, max: 400)']
                    ].map(([param, desc]) => (
                      <tr
                        key={param}
                        className={
                          'border-t border-[rgba(59,130,246,0.15)] dark:border-t dark:border-[rgba(59,130,246,0.1)]'
                        }
                      >
                        <td className="px-3 py-2">
                          <code
                            className={param === 'base' || param === 'quote' ? 'text-primary' : ''}
                          >
                            {param}
                          </code>
                        </td>
                        <td className={cn('px-3 py-2', 'text-gray-600 dark:text-white/60')}>
                          {desc}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div
                className={cn(
                  'relative group rounded-lg overflow-hidden',
                  'bg-[rgba(59,130,246,0.02)] border border-[rgba(59,130,246,0.15)] dark:bg-[rgba(59,130,246,0.02)]'
                )}
              >
                <pre className="p-3 font-mono text-[11px] overflow-x-auto m-0">
                  <span className={'text-gray-500 dark:text-white/40'}>
                    # Using md5 (recommended)
                  </span>
                  {'\n'}
                  <span className="text-emerald-500">GET</span>{' '}
                  /v1/orderbook?base=XRP&quote=0413ca7cfc258dfaf698c02fe304e607{'\n'}
                  <span className={'text-gray-500 dark:text-white/40'}>
                    # Legacy format still works
                  </span>
                  {'\n'}
                  <span className="text-emerald-500">GET</span>{' '}
                  /v1/orderbook?base_currency=XRP&quote_currency=534F4C4F...&quote_issuer=rsoLo...
                </pre>
              </div>
            </div>

            {/* Other XRPL endpoints */}
            <div
              id="other-xrpl"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
              )}
            >
              <div
                className={cn(
                  'text-[11px] font-medium uppercase tracking-wide mb-3',
                  'text-gray-500 dark:text-white/40'
                )}
              >
                Other Endpoints
              </div>
              <div className="space-y-2 text-[13px]">
                {[
                  ['GET', '/v1/tx/{hash}', 'Transaction by hash'],
                  ['POST', '/v1/account/path-find', 'Find payment paths']
                ].map(([method, path, desc]) => (
                  <div key={path} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span
                      className={cn(
                        'px-1.5 py-0.5 text-[10px] font-medium rounded',
                        method === 'GET'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-amber-500/10 text-amber-500'
                      )}
                    >
                      {method}
                    </span>
                    <code className="font-mono text-[12px]">{path}</code>
                    <span className={'text-gray-500 dark:text-white/40'}>- {desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-normal text-primary">Analytics</h2>
              <CopyButton text={llmSnippets.analytics} id="llm-analytics-section" />
            </div>

            <div
              className={cn(
                'rounded-lg p-3 text-[12px]',
                'bg-primary/5 border border-primary/20 dark:bg-primary/5 dark:border dark:border-primary/20'
              )}
            >
              <span className="text-primary font-medium">Identifiers:</span>{' '}
              <span className={'text-gray-600 dark:text-white/70'}>
                Use <code className="text-primary">md5</code> for tokens,{' '}
                <code className="text-primary">address</code> (r-address) for traders.
              </span>
            </div>

            <div
              id="analytics-endpoints"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
              )}
            >
              <div className="space-y-2 text-[13px]">
                {[
                  ['GET', '/v1/token/analytics/token/{id}', 'Token analytics'],
                  ['GET', '/v1/token/analytics/token/{id}/traders', 'Top traders for token'],
                  ['GET', '/v1/token/analytics/trader/{account}', 'Trader cumulative stats'],
                  ['GET', '/v1/token/analytics/trader/{account}/tokens', 'Trader per-token metrics'],
                  ['GET', '/v1/token/analytics/traders', 'All traders with stats'],
                  ['GET', '/v1/token/analytics/market', 'Daily market metrics'],
                  ['GET', '/v1/token/analytics/trader/{account}/history', 'Trader volume history'],
                  ['GET', '/v1/token/analytics/trader/{account}/trades', 'Trader trade history'],
                  ['GET', '/v1/token/analytics/traders/summary', 'Trader balance summary']
                ].map(([method, path, desc]) => (
                  <div key={path} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-500/10 text-emerald-500">
                      {method}
                    </span>
                    <code className="font-mono text-[12px]">{path}</code>
                    <span className={'text-gray-500 dark:text-white/40'}>- {desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'launch':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-normal text-primary">Token Launch</h2>
              <CopyButton text={llmSnippets.launch} id="llm-launch-section" />
            </div>

            {/* POST /launch-token */}
            <div
              id="launch-token"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-amber-500/10 text-amber-500 uppercase tracking-wide">
                  POST
                </span>
                <code className="text-[15px] font-mono">/v1/launch-token</code>
              </div>
              <p className={cn('text-[13px] mb-3', 'text-gray-600 dark:text-white/60')}>
                Initialize token launch with optional anti-snipe mode
              </p>
              <div
                className={cn(
                  'rounded-lg overflow-hidden border-[1.5px] mb-4',
                  'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
                )}
              >
                <table className="w-full text-[12px]">
                  <thead className={'bg-gray-50 dark:bg-white/5'}>
                    <tr>
                      <th
                        className={cn(
                          'text-left px-3 py-2 font-medium',
                          'text-gray-600 dark:text-white/60'
                        )}
                      >
                        Body Param
                      </th>
                      <th
                        className={cn(
                          'text-left px-3 py-2 font-medium',
                          'text-gray-600 dark:text-white/60'
                        )}
                      >
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['currencyCode', 'Token currency (1-20 chars) - required'],
                      ['tokenSupply', 'Max supply (up to ~10^16) - required'],
                      ['ammXrpAmount', 'XRP for AMM pool (min 1) - required'],
                      ['name', 'Token name - required'],
                      ['origin', 'Origin identifier - required'],
                      ['user', 'User identifier - required'],
                      ['userAddress', 'Optional holder address'],
                      ['userCheckAmount', 'Dev allocation % (max 95%)'],
                      ['antiSnipe', 'bool - Enable trustline authorization'],
                      ['domain', 'Optional domain'],
                      ['description', 'Token description'],
                      ['platformRetentionPercent', 'Social reward allocation (0-10% of supply)'],
                      ['bundleRecipients', 'Array of { address, percent } for bundle distribution'],
                      ['telegram', 'Telegram link'],
                      ['twitter', 'Twitter handle'],
                      ['imageData', 'Base64 token image']
                    ].map(([param, desc]) => (
                      <tr
                        key={param}
                        className={
                          'border-t border-[rgba(59,130,246,0.15)] dark:border-t dark:border-[rgba(59,130,246,0.1)]'
                        }
                      >
                        <td className="px-3 py-2">
                          <code className="text-primary">{param}</code>
                        </td>
                        <td className={cn('px-3 py-2', 'text-gray-600 dark:text-white/60')}>
                          {desc}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div
                className={cn(
                  'mt-4 p-3 rounded-lg text-[12px]',
                  'bg-gray-50 dark:bg-white/5'
                )}
              >
                <div className="font-medium mb-2">Costs</div>
                <div className={cn('space-y-1', 'text-gray-600 dark:text-white/60')}>
                  <div>AMM liquidity: <span className="text-primary">min 10 XRP</span> (you choose)</div>
                  <div>Platform fee: <span className="text-primary">2-12 XRP</span> (scales with dev allocation %)</div>
                  <div>Reserves + fees: <span className="text-primary">~3 XRP</span> (XRPL accounts + tx fees)</div>
                  <div>Anti-snipe: <span className="text-primary">~2 XRP</span> (optional)</div>
                  <div>Bundle: <span className="text-primary">1 XRP/recipient</span> (optional)</div>
                  <div>Platform token share: <span className="text-primary">0 XRP</span> (0-10% of supply for social rewards, no XRP cost)</div>
                  <div className="mt-2">
                    Typical total: <span className="text-primary font-medium">15-25 XRP</span>
                  </div>
                  <div className={cn('text-[11px] mt-1', 'text-gray-400 dark:text-white/40')}>
                    Use <code>/calculate-funding</code> for exact cost breakdown
                  </div>
                </div>
              </div>
              <div
                className={cn(
                  'mt-3 p-3 rounded-lg text-[12px]',
                  'bg-gray-50 dark:bg-white/5'
                )}
              >
                <div className="font-medium mb-2">Status Flow</div>
                <div
                  className={cn(
                    'font-mono text-[10px] leading-relaxed',
                    'text-gray-600 dark:text-white/60'
                  )}
                >
                  initializing → awaiting_funding → funded → configuring → creating_amm → success/completed
                </div>
              </div>
              <div
                className={cn(
                  'mt-3 p-3 rounded-lg text-[12px]',
                  'bg-gray-50 dark:bg-white/5'
                )}
              >
                <div className="font-medium mb-2">Anti-Snipe Mode</div>
                <div className={cn('space-y-1', 'text-gray-600 dark:text-white/60')}>
                  <div>Prevents unauthorized trustlines during launch</div>
                  <div>Controlled authorization window after AMM pool is created</div>
                  <div>Issuer account is permanently locked after launch completes</div>
                </div>
              </div>
              <div
                className={cn(
                  'mt-3 p-3 rounded-lg text-[12px]',
                  'bg-gray-50 dark:bg-white/5'
                )}
              >
                <div className="font-medium mb-2">Final State</div>
                <div className={'text-gray-600 dark:text-white/60'}>
                  Issuer account is permanently locked after launch, ensuring token supply cannot be modified.
                </div>
              </div>
              <div
                className={cn(
                  'mt-3 p-3 rounded-lg text-[12px]',
                  'bg-gray-50 dark:bg-white/5'
                )}
              >
                <div className="font-medium mb-2">Platform Token Share (Social Rewards)</div>
                <div className={cn('space-y-1', 'text-gray-600 dark:text-white/60')}>
                  <div>Optional 0-10% of total supply allocated via <code className="text-primary">platformRetentionPercent</code></div>
                  <div>Distributed to up to <strong>100 users</strong> who tweet about your token</div>
                  <div>Each user receives a small equal share of the allocated supply</div>
                  <div>xrpl.to receives <strong>no tokens</strong> from this allocation, 100% goes to users</div>
                  <div>No additional XRP cost, only affects token supply distribution</div>
                </div>
              </div>
            </div>

            {/* Other launch endpoints */}
            <div
              id="other-launch"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
              )}
            >
              <div
                className={cn(
                  'text-[11px] font-medium uppercase tracking-wide mb-3',
                  'text-gray-500 dark:text-white/40'
                )}
              >
                Other Endpoints
              </div>
              <div className="space-y-2 text-[13px]">
                {[
                  [
                    'GET',
                    '/v1/launch-token/status/{sessionId}',
                    'Poll launch status (every 3s recommended)'
                  ],
                  [
                    'POST',
                    '/v1/launch-token/authorize',
                    'Request trustline authorization (anti-snipe mode)'
                  ],
                  ['GET', '/v1/launch-token/queue-status/{sessionId}', 'Auth queue status'],
                  ['GET', '/v1/launch-token/auth-info/{issuer}/{currency}', 'Token auth info'],
                  [
                    'GET',
                    '/v1/launch-token/check-auth/{issuer}/{currency}/{address}',
                    'Check authorization'
                  ],
                  [
                    'GET',
                    '/v1/launch-token/calculate-funding',
                    'Calculate required XRP funding'
                  ],
                  [
                    'GET',
                    '/v1/launch-token/my-launches',
                    'User launch history (API key required)'
                  ],
                  [
                    'POST',
                    '/v1/launch-token/{sessionId}/image',
                    'Upload token image (base64, max 500KB)'
                  ]
                ].map(([method, path, desc]) => (
                  <div key={path} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span
                      className={cn(
                        'px-1.5 py-0.5 text-[10px] font-medium rounded',
                        method === 'GET'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : method === 'DELETE'
                            ? 'bg-red-500/10 text-red-500'
                            : 'bg-amber-500/10 text-amber-500'
                      )}
                    >
                      {method}
                    </span>
                    <code className="font-mono text-[12px]">{path}</code>
                    <span className={'text-gray-500 dark:text-white/40'}>- {desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue Sharing */}
            <div
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
              )}
            >
              <div
                className={cn(
                  'text-[11px] font-medium uppercase tracking-wide mb-3',
                  'text-gray-500 dark:text-white/40'
                )}
              >
                Revenue Sharing
              </div>
              <p className={cn('text-[13px] leading-relaxed mb-3', 'text-gray-600 dark:text-white/60')}>
                Integrate the Token Launch API into your platform and earn <span className="text-primary font-medium">50% of launch fees</span> for every token launched through your API key.
              </p>
              <div className="space-y-2 text-[13px]">
                <div className={cn('flex items-start gap-2', 'text-gray-500 dark:text-white/50')}>
                  <span className="text-primary mt-0.5">1.</span>
                  <span>Apply for a <span className={'text-gray-800 dark:text-white/80'}>Partner API key</span> with your platform name</span>
                </div>
                <div className={cn('flex items-start gap-2', 'text-gray-500 dark:text-white/50')}>
                  <span className="text-primary mt-0.5">2.</span>
                  <span>Use your API key when calling <code className="font-mono text-[12px]">/v1/launch-token</code></span>
                </div>
                <div className={cn('flex items-start gap-2', 'text-gray-500 dark:text-white/50')}>
                  <span className="text-primary mt-0.5">3.</span>
                  <span>Every successful launch is tracked with your platform identity and revenue is split automatically</span>
                </div>
              </div>
              <div
                className={cn(
                  'mt-4 rounded-lg p-3 text-[12px]',
                  'bg-gray-50 text-gray-500 dark:bg-white/5 dark:text-white/40'
                )}
              >
                Revenue share applies to platform fees and bundle fees. Contact us to set up a partner key.
              </div>
            </div>
          </div>
        );

      case 'tools':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-normal text-primary">Tools</h2>
              <CopyButton text={llmSnippets.tools} id="llm-tools-section" />
            </div>

            <div
              id="tools-endpoints"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
              )}
            >
              <div className="space-y-2 text-[13px]">
                {[
                  ['GET', '/v1/health', 'API health check'],
                  ['GET', '/v1/docs', 'API documentation JSON'],
                  ['GET', '/v1/testnet/{address}', 'Get XRP balance on testnet']
                ].map(([method, path, desc]) => (
                  <div key={path} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-500/10 text-emerald-500">
                      {method}
                    </span>
                    <code className="font-mono text-[12px]">{path}</code>
                    <span className={'text-gray-500 dark:text-white/40'}>- {desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'faucet':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-normal text-primary">Testnet Faucet</h2>
            <p className={cn('text-[14px]', 'text-gray-600 dark:text-white/60')}>
              Get free XRP for development and testing on XRPL Testnet.
            </p>

            {/* Endpoints */}
            <div
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
              )}
            >
              <h3 className={cn('text-[14px] font-medium mb-3', 'text-gray-900 dark:text-white')}>Endpoints</h3>
              <div className="space-y-2 text-[13px]">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-500/10 text-emerald-500">GET</span>
                  <code className="font-mono text-[12px]">/v1/faucet</code>
                  <span className={'text-gray-500 dark:text-white/40'}>- Get faucet status & balance</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-500/10 text-amber-500">POST</span>
                  <code className="font-mono text-[12px]">/v1/faucet</code>
                  <span className={'text-gray-500 dark:text-white/40'}>- Request testnet XRP</span>
                </div>
              </div>
            </div>

            {/* GET Response */}
            <div
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
              )}
            >
              <h3 className={cn('text-[14px] font-medium mb-3', 'text-gray-900 dark:text-white')}>GET /v1/faucet</h3>
              <p className={cn('text-[13px] mb-3', 'text-gray-600 dark:text-white/60')}>Returns faucet wallet status.</p>
              <pre className={cn('text-[12px] p-3 rounded-lg overflow-x-auto', 'bg-gray-100 dark:bg-black/30')}>
{`// Response
{
  "address": "rLvm2sMyvqHbnBG21m5YXx3VSmZqfE2Do5",
  "balance": 9850.5,
  "defaultAmount": 200,
  "maxAmount": 200
}`}
              </pre>
            </div>

            {/* POST Request */}
            <div
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
              )}
            >
              <h3 className={cn('text-[14px] font-medium mb-3', 'text-gray-900 dark:text-white')}>POST /v1/faucet</h3>
              <p className={cn('text-[13px] mb-3', 'text-gray-600 dark:text-white/60')}>Request testnet XRP to your wallet.</p>
              <pre className={cn('text-[12px] p-3 rounded-lg overflow-x-auto mb-4', 'bg-gray-100 dark:bg-black/30')}>
{`// Request
curl -X POST https://api.xrpl.to/v1/faucet \\
  -H "Content-Type: application/json" \\
  -d '{"destination": "rYourTestnetAddress..."}'

// Success Response (200)
{
  "success": true,
  "hash": "88E788684079F52181D18848C3E2EE70C07FD31ED8045A7C03E070F3B69C46C9",
  "destination": "rYourTestnetAddress...",
  "amount": 200,
  "cooldownHours": 24
}`}
              </pre>
            </div>

            {/* Error Codes */}
            <div
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
              )}
            >
              <h3 className={cn('text-[14px] font-medium mb-3', 'text-gray-900 dark:text-white')}>Error Responses</h3>
              <div className="space-y-3 text-[13px]">
                <div>
                  <code className={cn('text-[12px] px-1.5 py-0.5 rounded', 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400')}>400</code>
                  <span className={cn('ml-2', 'text-gray-600 dark:text-white/60')}>"destination address required" or "invalid XRP address"</span>
                </div>
                <div>
                  <code className={cn('text-[12px] px-1.5 py-0.5 rounded', 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400')}>429</code>
                  <span className={cn('ml-2', 'text-gray-600 dark:text-white/60')}>"cooldown active" - includes <code>retryAfterSeconds</code></span>
                </div>
                <div>
                  <code className={cn('text-[12px] px-1.5 py-0.5 rounded', 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400')}>503</code>
                  <span className={cn('ml-2', 'text-gray-600 dark:text-white/60')}>"faucet depleted" - insufficient balance</span>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className={cn('text-[13px] space-y-2 p-4 rounded-lg', 'bg-primary/5 dark:bg-primary/5')}>
              <p><strong>Network:</strong> <code className="text-[12px]">wss://s.altnet.rippletest.net:51233</code></p>
              <p><strong>Amount:</strong> 200 XRP per request</p>
              <p><strong>Rate Limit:</strong> 1 request per address every 24 hours</p>
            </div>

            <a
              href="/faucet"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-[13px] font-medium hover:bg-primary/90 transition-colors"
            >
              <Droplets size={16} />
              Open Faucet UI
            </a>
          </div>
        );

      case 'bridge':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-normal text-primary">Bridge</h2>
            <p className={cn('text-[14px]', 'text-gray-600 dark:text-white/60')}>
              Cross-chain currency exchange endpoints for converting between XRP and other currencies.
            </p>
            <div
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
              )}
            >
              <div className="space-y-2 text-[13px]">
                {docs.bridge.map((ep) => (
                  <div key={ep.path} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span
                      className={cn(
                        'px-1.5 py-0.5 text-[10px] font-medium rounded',
                        ep.method === 'GET' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                      )}
                    >
                      {ep.method}
                    </span>
                    <code className="font-mono text-[12px]">/v1{ep.path}</code>
                    <span className={'text-gray-500 dark:text-white/40'}>- {ep.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'verify':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-normal text-primary">Verification</h2>
            <p className={cn('text-[14px]', 'text-gray-600 dark:text-white/60')}>
              Request and manage verification badges for tokens and NFT collections.
            </p>
            <div
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
              )}
            >
              <div className="space-y-2 text-[13px]">
                {docs.verify.map((ep) => (
                  <div key={ep.path} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span
                      className={cn(
                        'px-1.5 py-0.5 text-[10px] font-medium rounded',
                        ep.method === 'GET' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                      )}
                    >
                      {ep.method}
                    </span>
                    <code className="font-mono text-[12px]">/v1{ep.path}</code>
                    <span className={'text-gray-500 dark:text-white/40'}>- {ep.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'boost':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-normal text-primary">Boost</h2>
            <p className={cn('text-[14px]', 'text-gray-600 dark:text-white/60')}>
              Boost token visibility and ranking with promotional placements.
            </p>
            <div
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
              )}
            >
              <div className="space-y-2 text-[13px]">
                {docs.boost.map((ep) => (
                  <div key={ep.path} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span
                      className={cn(
                        'px-1.5 py-0.5 text-[10px] font-medium rounded',
                        ep.method === 'GET' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                      )}
                    >
                      {ep.method}
                    </span>
                    <code className="font-mono text-[12px]">/v1{ep.path}</code>
                    <span className={'text-gray-500 dark:text-white/40'}>- {ep.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'tweet-verify':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-normal text-primary">Tweet Verify</h2>
            <p className={cn('text-[14px]', 'text-gray-600 dark:text-white/60')}>
              Social verification for tokens. Submit tweet URLs to verify promotions and earn rewards.
            </p>
            <div
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
              )}
            >
              <div className="space-y-3 text-[13px]">
                <div className="flex flex-wrap items-start gap-x-2 gap-y-0.5">
                  <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-500/10 text-amber-500 shrink-0 mt-0.5">POST</span>
                  <div>
                    <code className="font-mono text-[12px]">/v1/tweet/verify</code>
                    <span className={cn('ml-2', 'text-gray-500 dark:text-white/40')}>- Submit tweet for token verification</span>
                    <div className={cn('mt-1 text-[11px]', 'text-gray-400 dark:text-white/30')}>
                      Body: {'{ account, md5, tweetUrl }'} &middot; Rate limit: 5/hour per account, 3 tokens/day per Twitter account
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-start gap-x-2 gap-y-0.5">
                  <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-500/10 text-emerald-500 shrink-0 mt-0.5">GET</span>
                  <div>
                    <code className="font-mono text-[12px]">/v1/tweet/token/{'{id}'}</code>
                    <span className={cn('ml-2', 'text-gray-500 dark:text-white/40')}>- Get tweet verifications for a token</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-start gap-x-2 gap-y-0.5">
                  <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-500/10 text-emerald-500 shrink-0 mt-0.5">GET</span>
                  <div>
                    <code className="font-mono text-[12px]">/v1/tweet/account/{'{account}'}</code>
                    <span className={cn('ml-2', 'text-gray-500 dark:text-white/40')}>- Get tweet verifications by account</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'reference':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-normal text-primary">Reference</h2>
              <CopyButton text={llmSnippets.reference} id="llm-reference-section" />
            </div>

            {/* Token Identifiers */}
            <div
              id="token-ids"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
              )}
            >
              <div
                className={cn(
                  'text-[11px] font-medium uppercase tracking-wide mb-3',
                  'text-gray-500 dark:text-white/40'
                )}
              >
                Token Identifiers
              </div>
              <div className="space-y-2 text-[13px] break-all">
                <div>
                  <code className="text-primary">md5</code>{' '}
                  <span className={'text-gray-600 dark:text-white/60'}>
                    - 32-char hex, e.g., 0413ca7cfc258dfaf698c02fe304e607
                  </span>
                </div>
                <div>
                  <code className="text-primary">slug</code>{' '}
                  <span className={'text-gray-600 dark:text-white/60'}>
                    - issuer-currencyHex, e.g., rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz-534F4C4F00...
                  </span>
                </div>
                <div>
                  <code className="text-primary">issuer_currency</code>{' '}
                  <span className={'text-gray-600 dark:text-white/60'}>
                    - issuer_currencyHex, e.g., rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz_534F4C4F00...
                  </span>
                </div>
              </div>
            </div>

            {/* MD5 Generation */}
            <div
              id="md5-gen"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
              )}
            >
              <div
                className={cn(
                  'text-[11px] font-medium uppercase tracking-wide mb-3',
                  'text-gray-500 dark:text-white/40'
                )}
              >
                MD5 Generation
              </div>
              <div
                className={cn(
                  'rounded-lg p-3 font-mono text-[12px] break-all',
                  'bg-gray-50 dark:bg-black/40'
                )}
              >
                <div className={'text-gray-600 dark:text-white/60'}>// Input</div>
                <div>
                  rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz_534F4C4F00000000000000000000000000000000
                </div>
                <div className={cn('mt-2', 'text-gray-600 dark:text-white/60')}>
                  // Output
                </div>
                <div className="text-primary">0413ca7cfc258dfaf698c02fe304e607</div>
              </div>
            </div>

            {/* Currency Hex */}
            <div
              id="currency-hex"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
              )}
            >
              <div
                className={cn(
                  'text-[11px] font-medium uppercase tracking-wide mb-3',
                  'text-gray-500 dark:text-white/40'
                )}
              >
                Currency Hex (codes {'>'}3 chars)
              </div>
              <div
                className={cn(
                  'rounded-lg p-3 font-mono text-[12px] break-all',
                  'bg-gray-50 dark:bg-black/40'
                )}
              >
                <div>
                  SOLO ={' '}
                  <span className="text-primary">534F4C4F00000000000000000000000000000000</span>
                </div>
                <div className={cn('mt-2 text-[11px]', 'text-gray-500 dark:text-white/40')}>
                  Buffer.from('SOLO').toString('hex').toUpperCase().padEnd(40, '0')
                </div>
              </div>
            </div>

            {/* Patterns */}
            <div
              id="patterns"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
              )}
            >
              <div
                className={cn(
                  'text-[11px] font-medium uppercase tracking-wide mb-3',
                  'text-gray-500 dark:text-white/40'
                )}
              >
                Regex Patterns
              </div>
              <div className="space-y-2 text-[12px] font-mono">
                {Object.entries(docs.patterns).map(([key, pattern]) => (
                  <div key={key}>
                    <span className="text-primary">{key}:</span>{' '}
                    <span className={'text-gray-600 dark:text-white/60'}>{pattern}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Caching */}
            <div
              id="caching"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
              )}
            >
              <div
                className={cn(
                  'text-[11px] font-medium uppercase tracking-wide mb-3',
                  'text-gray-500 dark:text-white/40'
                )}
              >
                Caching
              </div>
              <div className="space-y-2 text-[12px]">
                {Object.entries(docs.caching).map(([key, value]) => (
                  <div key={key}>
                    <span className="text-primary font-medium">{key}:</span>{' '}
                    <span className={'text-gray-600 dark:text-white/60'}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'info':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-normal text-primary mb-2">What is xrpl.to</h2>
              <p className={cn('text-[14px] mb-4', 'text-gray-600 dark:text-white/60')}>
                A high-performance SocialFi trading platform built entirely on the XRP Ledger.
              </p>
            </div>

            <div id="info-platform" className="space-y-4">
              <h3 className={cn('text-lg font-medium', 'text-gray-900 dark:text-white')}>
                The Platform
              </h3>
              <div
                className={cn(
                  'p-4 rounded-xl border-[1.5px]',
                  'border-primary/20 bg-blue-50/50 dark:border-primary/20 dark:bg-primary/5'
                )}
              >
                <p className={cn('text-[13px] leading-relaxed', 'text-gray-700 dark:text-white/70')}>
                  xrpl.to is a high-speed decentralized exchange (DEX) on the XRP Ledger with APIs optimized for performance. It is a fully standalone SocialFi platform where users can trade tokens and NFTs, communicate through a built-in social layer, and interact with a comprehensive API. All data is sourced directly from the xrpl.to API and the XRP Ledger itself. There are no third-party dependencies. The platform also hosts and serves all token and NFT images directly, optimized for speed.
                </p>
              </div>
            </div>

            <div id="info-api" className="space-y-4">
              <h3 className={cn('text-lg font-medium', 'text-gray-900 dark:text-white')}>
                API & Data
              </h3>
              <div className="space-y-3">
                {[
                  { title: '140+ custom endpoints', desc: 'Comprehensive data coverage for tokens, NFTs, AMM pools, trader analytics, market history, and more.' },
                  { title: 'Transaction submission', desc: 'Stream-based transaction submission capable of handling 3,000+ transactions per second with lightning-fast confirmation responses.' },
                  { title: 'Live trading data', desc: 'High-speed real-time data feeds designed for live trading systems, bots, and algorithmic strategies.' },
                  { title: 'LLM and AI friendly', desc: 'Structured, well-documented API responses designed for easy consumption by large language models and AI agents.' }
                ].map((item, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex gap-3 p-3 rounded-xl border-[1.5px]',
                      'border-gray-100 bg-gray-50/50 dark:border-white/5 dark:bg-white/[0.02]'
                    )}
                  >
                    <div
                      className={cn(
                        'flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0 mt-0.5',
                        'bg-blue-50 dark:bg-primary/10'
                      )}
                    >
                      <Zap size={12} className="text-primary" />
                    </div>
                    <div>
                      <div className={cn('text-[13px] font-medium', 'text-gray-900 dark:text-white/90')}>
                        {item.title}
                      </div>
                      <div className={cn('text-[12px] mt-0.5', 'text-gray-500 dark:text-white/50')}>
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div id="info-build" className="space-y-4">
              <h3 className={cn('text-lg font-medium', 'text-gray-900 dark:text-white')}>
                Build with xrpl.to
              </h3>
              <div
                className={cn(
                  'p-4 rounded-xl border-[1.5px]',
                  'border-primary/20 bg-blue-50/50 dark:border-primary/20 dark:bg-primary/5'
                )}
              >
                <p className={cn('text-[13px] leading-relaxed', 'text-gray-700 dark:text-white/70')}>
                  xrpl.to is a complete toolkit for building decentralized applications on the XRP Ledger. Developers can build full applications such as NFT marketplaces or trading platforms using xrpl.to entirely on its own. The platform takes the complexity out of building on the ledger so you can focus on managing your business. From real-time market data to transaction submission, everything you need is available through a single, unified API.
                </p>
              </div>
            </div>
          </div>
        );

      case 'handshake':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-normal text-primary mb-2">Handshake</h2>
              <p className={cn('text-[14px] mb-4', 'text-gray-600 dark:text-white/60')}>
                Anti-phishing protection that verifies you are on the real xrpl.to before you enter your password.
              </p>
            </div>

            <div id="what-is-handshake" className="space-y-4">
              <h3 className={cn('text-lg font-medium', 'text-gray-900 dark:text-white')}>
                What is Handshake?
              </h3>
              <p className={cn('text-[13px] leading-relaxed', 'text-gray-600 dark:text-white/60')}>
                Handshake is a unique 4-emoji security code assigned to your wallet when you create it. Every time you open the login screen, your Handshake is displayed <strong>before</strong> you type your password. If the emojis match what you remember, you know you are on the real site.
              </p>
              <div
                className={cn(
                  'flex items-center gap-3 py-3 px-4 rounded-xl border-[1.5px]',
                  'border-emerald-500/20 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/5'
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0',
                    'bg-emerald-100 dark:bg-emerald-500/10'
                  )}
                >
                  <Shield size={16} className="text-emerald-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[20px] leading-tight tracking-[0.15em]">{'🐶🌈💎🚀'}</span>
                  <span className={cn('text-[9px] font-medium uppercase tracking-wider mt-0.5', 'text-gray-400 dark:text-white/25')}>
                    Handshake
                  </span>
                </div>
              </div>
              <p className={cn('text-[12px]', 'text-gray-500 dark:text-white/40')}>
                Example only. Your actual Handshake will be different.
              </p>
            </div>

            <div id="how-it-works" className="space-y-4">
              <h3 className={cn('text-lg font-medium', 'text-gray-900 dark:text-white')}>
                How It Works
              </h3>
              <div className="space-y-3">
                {[
                  { step: '1', title: 'Generated on wallet creation', desc: 'A random 4-emoji sequence is created from a set of 64 emojis (over 16 million possible combinations).' },
                  { step: '2', title: 'Encrypted and stored locally', desc: 'Your Handshake is encrypted with a non-extractable key and stored in your browser\'s IndexedDB. No server involved.' },
                  { step: '3', title: 'Origin-bound protection', desc: 'IndexedDB is scoped to the site\'s domain. A phishing site on a different domain cannot access your data, so it can never show your Handshake.' },
                  { step: '4', title: 'Shown before password entry', desc: 'When you open the wallet unlock screen, your Handshake appears above the password field. Verify it matches before typing.' }
                ].map((item) => (
                  <div
                    key={item.step}
                    className={cn(
                      'flex gap-3 p-3 rounded-xl border-[1.5px]',
                      'border-gray-100 bg-gray-50/50 dark:border-white/5 dark:bg-white/[0.02]'
                    )}
                  >
                    <div
                      className={cn(
                        'flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold flex-shrink-0 mt-0.5',
                        'bg-primary/10 text-primary dark:bg-primary/10 dark:text-primary'
                      )}
                    >
                      {item.step}
                    </div>
                    <div>
                      <div className={cn('text-[13px] font-medium', 'text-gray-900 dark:text-white/90')}>
                        {item.title}
                      </div>
                      <div className={cn('text-[12px] mt-0.5', 'text-gray-500 dark:text-white/50')}>
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div id="handshake-faq" className="space-y-4">
              <h3 className={cn('text-lg font-medium', 'text-gray-900 dark:text-white')}>
                FAQ
              </h3>
              <div className="space-y-4">
                {[
                  { q: 'I don\'t see my Handshake on the unlock screen', a: 'If you cleared your browser data or are using a new browser, your Handshake will be regenerated on your next login. Memorize the new one.' },
                  { q: 'The emojis look wrong or different', a: 'Do NOT enter your password. You may be on a phishing site. Check the URL carefully, it should be xrpl.to.' },
                  { q: 'Can I change my Handshake?', a: 'Your Handshake is tied to your encrypted wallet. If you re-import your wallet, a new Handshake will be generated.' },
                  { q: 'Does Handshake work across devices?', a: 'Each device has its own Handshake since the encryption key is device-specific. When you sync via QR code, the Handshake transfers to the new device.' }
                ].map((item, i) => (
                  <div key={i} className="space-y-1">
                    <div className={cn('text-[13px] font-medium', 'text-gray-900 dark:text-white/90')}>
                      {item.q}
                    </div>
                    <div className={cn('text-[12px]', 'text-gray-500 dark:text-white/50')}>
                      {item.a}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'platform-fees':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-normal text-primary mb-2">Platform Fees</h2>
              <p className={cn('text-[14px]', 'text-gray-600 dark:text-white/60')}>
                Transparent fee structure for trading and launching tokens on xrpl.to.
              </p>
            </div>

            <div id="pf-trading" className="space-y-4">
              <h3 className={cn('text-lg font-medium', 'text-gray-900 dark:text-white')}>
                Trading Fee
              </h3>
              <div
                className={cn(
                  'rounded-xl border-[1.5px] p-4',
                  'border-primary/20 bg-blue-50/50 dark:border-primary/20 dark:bg-primary/5'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn('text-[14px] font-medium', 'text-gray-800 dark:text-white/80')}>Swap Fee</span>
                  <span className="text-2xl font-medium text-primary">0.08%</span>
                </div>
              </div>
              <p className={cn('text-[13px] leading-relaxed', 'text-gray-600 dark:text-white/60')}>
                A 0.08% fee is applied to all trades executed through the xrpl.to swap interface. This fee helps maintain and improve the platform.
              </p>
              <div className={cn('rounded-xl p-3', 'bg-gray-50 dark:bg-white/5')}>
                <div className={cn('text-[12px] font-medium mb-1.5', 'text-gray-700 dark:text-white/70')}>Example</div>
                <div className={cn('text-[13px]', 'text-gray-600 dark:text-white/60')}>
                  Swapping 1,000 XRP worth of tokens:
                </div>
                <div className={cn('text-[13px] mt-1', 'text-gray-600 dark:text-white/60')}>
                  Fee: <span className="text-primary font-medium">0.8 XRP</span> (0.08% of 1,000)
                </div>
              </div>
              <p className={cn('text-[12px]', 'text-gray-500 dark:text-white/40')}>
                This fee is separate from any AMM pool fees or network transaction costs on the XRP Ledger.
              </p>
            </div>

            <div id="pf-launch" className="space-y-4">
              <h3 className={cn('text-lg font-medium', 'text-gray-900 dark:text-white')}>
                Token Launch
              </h3>
              <p className={cn('text-[13px] leading-relaxed', 'text-gray-600 dark:text-white/60')}>
                Launch your own token on the XRP Ledger. The total cost depends on your configuration.
              </p>
              <div
                className={cn(
                  'rounded-xl border-[1.5px] overflow-hidden',
                  'border-gray-100 dark:border-white/5'
                )}
              >
                <table className="w-full text-[13px]">
                  <thead className={'bg-gray-50 dark:bg-white/5'}>
                    <tr>
                      <th className={cn('text-left px-4 py-2.5 font-medium', 'text-gray-600 dark:text-white/60')}>Fee</th>
                      <th className={cn('text-left px-4 py-2.5 font-medium', 'text-gray-600 dark:text-white/60')}>Amount</th>
                      <th className={cn('text-left px-4 py-2.5 font-medium', 'text-gray-600 dark:text-white/60')}>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['AMM Liquidity', 'Min 10 XRP', 'Initial XRP paired with your tokens in the AMM pool. You choose the amount.'],
                      ['Platform Fee', '2 - 12 XRP', 'Scales with developer allocation %. Higher dev allocation = higher fee.'],
                      ['Reserves + Fees', '~3 XRP', 'XRPL account reserves (issuer + holder) and on-ledger transaction fees.'],
                      ['Anti-Snipe', '~2 XRP', 'Optional. 2-minute authorization window preventing bot sniping at launch.'],
                      ['Bundle Distribution', '1 XRP per recipient', 'Optional. Distributes tokens to additional wallets at launch.'],
                      ['Platform Token Share', '0 XRP', 'Optional 0-10% of token supply for social rewards. No XRP cost.']
                    ].map(([fee, amount, details]) => (
                      <tr key={fee} className={'border-t border-gray-100 dark:border-t dark:border-white/5'}>
                        <td className={cn('px-4 py-2.5 font-medium', 'text-gray-800 dark:text-white/80')}>{fee}</td>
                        <td className="px-4 py-2.5 text-primary whitespace-nowrap">{amount}</td>
                        <td className={cn('px-4 py-2.5', 'text-gray-500 dark:text-white/50')}>{details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div
                className={cn(
                  'flex items-center gap-3 rounded-xl p-4 border-[1.5px]',
                  'border-emerald-500/20 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/5'
                )}
              >
                <div>
                  <div className={cn('text-[12px] font-medium mb-0.5', 'text-gray-700 dark:text-white/70')}>Typical Total Cost</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-medium text-primary">6 - 20 XRP</span>
                    <span className={cn('text-[12px]', 'text-gray-500 dark:text-white/40')}>depending on configuration</span>
                  </div>
                </div>
              </div>
              <div className={cn('text-[13px] leading-relaxed', 'text-gray-600 dark:text-white/60')}>
                <div className={cn('font-medium mb-2', 'text-gray-800 dark:text-white/80')}>Included with every launch:</div>
                <ul className="list-disc list-inside space-y-1 ml-1">
                  <li>Token creation and configuration</li>
                  <li>Issuer account setup</li>
                  <li>Trustline creation</li>
                  <li>AMM pool initialization</li>
                  <li>Optional anti-snipe protection</li>
                  <li>Optional developer token allocation (up to 95%)</li>
                  <li>Optional platform token share for social rewards</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'trending-guide':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-normal text-primary mb-2">Trending</h2>
              <p className={cn('text-[14px] leading-relaxed', 'text-gray-600 dark:text-white/60')}>
                Every token and NFT collection on xrpl.to is assigned a Trending Score based on recent market activity and community engagement. This score determines ranking on the trending page and homepage.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { title: 'Market Activity', desc: 'Trading volume, liquidity, and number of unique traders all contribute to the score.' },
                { title: 'Community Engagement', desc: 'Page views and watchlist activity signal interest from the community.' },
                { title: 'Verification', desc: 'Tokens with verified info receive a scoring advantage.' },
                { title: 'Boosts', desc: 'Active Boosts apply a multiplier to the base trending score.' },
                { title: 'Proprietary Algorithm', desc: 'The exact formula and weighting are not disclosed to prevent gaming and exploitation of the ranking system.' }
              ].map((item) => (
                <div
                  key={item.title}
                  className={cn(
                    'p-4 rounded-xl border-[1.5px]',
                    'border-gray-100 bg-gray-50/50 dark:border-white/5 dark:bg-white/[0.02]'
                  )}
                >
                  <div className={cn('text-[13px] font-medium mb-1', 'text-gray-800 dark:text-white/80')}>{item.title}</div>
                  <div className={cn('text-[12px] leading-relaxed', 'text-gray-500 dark:text-white/50')}>{item.desc}</div>
                </div>
              ))}
            </div>

            <p className={cn('text-[12px]', 'text-gray-500 dark:text-white/40')}>
              Scores are recalculated continuously. A token with zero activity will naturally fall off the trending page.
            </p>
          </div>
        );

      case 'boost-guide':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-normal text-primary mb-2">Boost</h2>
              <p className={cn('text-[14px] leading-relaxed', 'text-gray-600 dark:text-white/60')}>
                Boosts are a powerful way to amplify a token or NFT collection's presence on xrpl.to. By purchasing a Boost pack you temporarily increase a token's Trending Score, helping it gain more visibility. The number of active Boosts is displayed next to the token across the platform. The more Boosts, the higher the score.
              </p>
            </div>

            <div
              className={cn(
                'flex items-center gap-3 rounded-xl p-4 border-[1.5px]',
                'border-amber-300/40 bg-amber-50 dark:border-[#FFD700]/20 dark:bg-[#FFD700]/5'
              )}
            >
              <Flame size={18} className="text-[#FFD700] shrink-0" />
              <div>
                <div className={cn('text-[13px] font-medium mb-0.5', 'text-amber-700 dark:text-[#FFD700]')}>Golden Ticker</div>
                <div className={cn('text-[12px] leading-relaxed', 'text-gray-600 dark:text-white/50')}>
                  The ultimate flex for any token. Unlocked when 500+ Boosts are active, it changes the token's symbol to a striking golden color on the screener and token pages. Lasts as long as there are 500+ active Boosts.
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className={cn('text-lg font-medium', 'text-gray-900 dark:text-white')}>
                How to Boost
              </h3>
              <ol className={cn('text-[13px] leading-relaxed space-y-2 list-decimal list-inside ml-1', 'text-gray-600 dark:text-white/60')}>
                <li>Click the <span className="inline-flex items-center align-middle"><Flame size={12} className="text-orange-500 mx-0.5" /></span> icon next to any token or collection in the Trending or New panels.</li>
                <li>Select a boost pack with a multiplier and duration (12-24h).</li>
                <li>Pay with XRP from your wallet or by card/crypto via Stripe.</li>
                <li>Your boost is applied immediately. Multiple boosts stack on top of each other.</li>
              </ol>
            </div>

            <div className="space-y-4">
              <h3 className={cn('text-lg font-medium', 'text-gray-900 dark:text-white')}>
                Boost Packs
              </h3>
              <div className={cn('rounded-xl border-[1.5px] overflow-hidden', 'border-gray-100 dark:border-white/5')}>
                <table className="w-full text-[13px]">
                  <thead className={'bg-gray-50 dark:bg-white/5'}>
                    <tr>
                      <th className={cn('text-left px-4 py-2.5 font-medium', 'text-gray-600 dark:text-white/60')}>Tier</th>
                      <th className={cn('text-left px-4 py-2.5 font-medium', 'text-gray-600 dark:text-white/60')}>Multiplier</th>
                      <th className={cn('text-left px-4 py-2.5 font-medium', 'text-gray-600 dark:text-white/60')}>Effect</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Starter', '10x', 'Entry-level visibility bump'],
                      ['Power', '30x', 'Noticeable ranking increase'],
                      ['Mega', '50x', 'Strong push up the trending page'],
                      ['Ultra', '100x', 'Dominant trending position'],
                      ['Legendary', '500x', 'Activates Golden Ticker']
                    ].map(([tier, mult, effect]) => (
                      <tr key={tier} className={'border-t border-gray-100 dark:border-t dark:border-white/5'}>
                        <td className={cn('px-4 py-2.5 font-medium', 'text-gray-800 dark:text-white/80')}>{tier}</td>
                        <td className="px-4 py-2.5 text-primary">{mult}</td>
                        <td className={cn('px-4 py-2.5', 'text-gray-500 dark:text-white/50')}>{effect}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className={cn('text-lg font-medium', 'text-gray-900 dark:text-white')}>
                FAQ
              </h3>
              <div className="space-y-4">
                {[
                  ['Do Boosts guarantee that a token will trend?', 'No. Boosts enhance a token\'s existing Trending Score by applying a multiplier, but they don\'t replace the other on-chain and off-chain metrics in the ranking algorithm. A token with weak fundamentals won\'t automatically rank #1 just by using Boosts.'],
                  ['Can any token be boosted?', 'Most tokens and NFT collections on xrpl.to can be boosted. Tokens that have been inactive for over 24 hours or those flagged with potential security risks are ineligible.'],
                  ['Are Boosts refundable?', 'No, Boosts are non-refundable. Boosts may be removed from a token if it is flagged as malicious by our moderators.'],
                  ['What payment methods are accepted?', 'XRP (direct from your wallet) or card/crypto via Stripe.']
                ].map(([q, a]) => (
                  <div key={q} className={cn('rounded-xl p-4', 'bg-gray-50 dark:bg-white/[0.03]')}>
                    <div className={cn('text-[13px] font-medium mb-1.5', 'text-gray-800 dark:text-white/80')}>{q}</div>
                    <div className={cn('text-[12px] leading-relaxed', 'text-gray-500 dark:text-white/50')}>{a}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-normal text-primary mb-2">Security</h2>
              <p className={cn('text-[14px] mb-4', 'text-gray-600 dark:text-white/60')}>
                Your wallet, your responsibility. xrpl.to is a fully self-custody platform where only you control your funds.
              </p>
            </div>

            <div id="self-custody" className="space-y-4">
              <h3 className={cn('text-lg font-medium', 'text-gray-900 dark:text-white')}>
                Self Custody
              </h3>
              <div
                className={cn(
                  'p-4 rounded-xl border-[1.5px]',
                  'border-primary/20 bg-blue-50/50 dark:border-primary/20 dark:bg-primary/5'
                )}
              >
                <p className={cn('text-[13px] leading-relaxed', 'text-gray-700 dark:text-white/70')}>
                  xrpl.to is a decentralized platform. Its architecture is designed for full self-custody and user control. There are no custodial accounts, no recovery mechanisms, and no way for anyone, including the xrpl.to team, to access your funds. It is up to you to be your own bank and keep your private key safe, since it gives full access to your funds.
                </p>
              </div>
            </div>

            <div id="device-binding" className="space-y-4">
              <h3 className={cn('text-lg font-medium', 'text-gray-900 dark:text-white')}>
                Device Binding & Encryption
              </h3>
              <div
                className={cn(
                  'p-4 rounded-xl border-[1.5px]',
                  'border-primary/20 bg-blue-50/50 dark:border-primary/20 dark:bg-primary/5'
                )}
              >
                <p className={cn('text-[13px] leading-relaxed', 'text-gray-700 dark:text-white/70')}>
                  xrpl.to uses device binding and password protection to secure your wallet. All encryption and decryption happens entirely client-side using industry-standard encryption methods. Your private keys are encrypted with AES-GCM and stored in IndexedDB, bound to your device. They never leave your browser and are never transmitted to any server.
                </p>
              </div>
            </div>

            <div id="seed-safety" className="space-y-4">
              <h3 className={cn('text-lg font-medium', 'text-gray-900 dark:text-white')}>
                Seed Safety
              </h3>
              <div className="space-y-3">
                {[
                  { title: 'Store offline only', desc: 'If backing up your seed, always store it offline. Write it on paper or engrave it on metal. Never save it in a text file, screenshot, cloud storage, or password manager connected to the internet.' },
                  { title: 'Never share your seed', desc: 'No one from xrpl.to will ever ask for your private seed. Anyone claiming to be xrpl.to support staff requesting your seed is a scammer. There are no exceptions.' },
                  { title: 'Your seed = your funds', desc: 'Anyone with your seed has complete, irreversible access to your wallet. There is no recovery process, no dispute resolution, and no way to reverse transactions on the XRP Ledger.' }
                ].map((item, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex gap-3 p-3 rounded-xl border-[1.5px]',
                      'border-gray-100 bg-gray-50/50 dark:border-white/5 dark:bg-white/[0.02]'
                    )}
                  >
                    <div
                      className={cn(
                        'flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0 mt-0.5',
                        'bg-red-50 dark:bg-red-500/10'
                      )}
                    >
                      <AlertTriangle size={12} className="text-red-500" />
                    </div>
                    <div>
                      <div className={cn('text-[13px] font-medium', 'text-gray-900 dark:text-white/90')}>
                        {item.title}
                      </div>
                      <div className={cn('text-[12px] mt-0.5', 'text-gray-500 dark:text-white/50')}>
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div id="cross-contamination" className="space-y-4">
              <h3 className={cn('text-lg font-medium', 'text-gray-900 dark:text-white')}>
                Cross Contamination
              </h3>
              <div
                className={cn(
                  'p-4 rounded-xl border-[1.5px]',
                  'border-amber-500/20 bg-amber-50/50 dark:border-amber-500/20 dark:bg-amber-500/5'
                )}
              >
                <p className={cn('text-[13px] leading-relaxed', 'text-gray-700 dark:text-white/70')}>
                  <strong>Not recommended:</strong> importing wallet private keys generated on xrpl.to into other platforms, or vice versa. Each platform has its own security model, storage methods, and potential vulnerabilities. Reusing the same seed across multiple platforms increases the attack surface. If any one platform is compromised, all platforms sharing that seed are compromised. Generate a separate wallet for each platform you use.
                </p>
              </div>
            </div>

            <div id="verify-domain" className="space-y-4">
              <h3 className={cn('text-lg font-medium', 'text-gray-900 dark:text-white')}>
                Verify Domain
              </h3>
              <p className={cn('text-[13px] leading-relaxed', 'text-gray-600 dark:text-white/60')}>
                Always verify you are on the correct domain before entering your password or interacting with your wallet.
              </p>
              <div className="space-y-2">
                {[
                  { label: 'Correct', value: 'xrpl.to', ok: true },
                  { label: 'Suspicious', value: 'xrpl-to.com, xrpI.to, xrpl.to.xyz', ok: false }
                ].map((item, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2.5 rounded-xl border-[1.5px]',
                      item.ok
                        ? 'border-emerald-500/20 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/5'
                        : 'border-red-500/20 bg-red-50 dark:border-red-500/20 dark:bg-red-500/5'
                    )}
                  >
                    <span className={cn('text-[11px] font-medium uppercase tracking-wider w-20', item.ok ? 'text-emerald-500' : 'text-red-500')}>
                      {item.label}
                    </span>
                    <code className={cn('text-[13px] font-mono', 'text-gray-800 dark:text-white/80')}>
                      {item.value}
                    </code>
                  </div>
                ))}
              </div>
              <p className={cn('text-[13px] leading-relaxed mt-3', 'text-gray-600 dark:text-white/60')}>
                Use your <a href="/docs?section=handshake" className="text-primary hover:underline">Handshake</a> emoji code as an additional verification. If it does not appear or looks wrong, do not enter any information. Never enter your seed anywhere if you have already set up your account. If you have any questions, reach out to <a href="https://x.com/xrplto" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@xrplto on X</a>, but never provide your private seed to anyone under any circumstances.
              </p>
            </div>

            <div id="backup" className="space-y-4">
              <h3 className={cn('text-lg font-medium', 'text-gray-900 dark:text-white')}>
                Backup
              </h3>
              <div
                className={cn(
                  'p-4 rounded-xl border-[1.5px]',
                  'border-primary/20 bg-blue-50/50 dark:border-primary/20 dark:bg-primary/5'
                )}
              >
                <p className={cn('text-[13px] leading-relaxed', 'text-gray-700 dark:text-white/70')}>
                  Backup was added for your own control and ownership of your XRP Ledger account. You are your own bank. xrpl.to provides a way to back up your seed natively on the XRP Ledger, not through some platform-specific method that could be exploited. It is your responsibility to back up your seed. If you ever have issues logging in, you can use your seed to recreate your account. xrpl.to does not use keystores, mnemonics, or any other backup method, only your seed.
                </p>
              </div>
              <div className="space-y-3">
                <p className={cn('text-[13px] font-medium', 'text-gray-800 dark:text-white/80')}>
                  Your seed is a short string that looks like this:
                </p>
                <div
                  className={cn(
                    'px-4 py-3 rounded-xl border-[1.5px] font-mono text-[13px]',
                    'border-gray-200 bg-gray-50 text-gray-700 dark:border-white/10 dark:bg-white/[0.02] dark:text-white/70'
                  )}
                >
                  sEdxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
                </div>
                <p className={cn('text-[12px]', 'text-gray-400 dark:text-white/40')}>
                  Example format only. This is not a real seed.
                </p>
              </div>
              <div
                className={cn(
                  'flex gap-3 p-3 rounded-xl border-[1.5px]',
                  'border-red-100 bg-red-50/50 dark:border-red-500/20 dark:bg-red-500/5'
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0 mt-0.5',
                    'bg-red-50 dark:bg-red-500/10'
                  )}
                >
                  <AlertTriangle size={12} className="text-red-500" />
                </div>
                <p className={cn('text-[13px] leading-relaxed', 'text-gray-700 dark:text-white/70')}>
                  Keep your seed safe. Anyone with access to it has full control of your funds. Store it offline, never share it, and never enter it on any site other than xrpl.to.
                </p>
              </div>
            </div>

            <div id="user-responsibility" className="space-y-4">
              <h3 className={cn('text-lg font-medium', 'text-gray-900 dark:text-white')}>
                Your Responsibility
              </h3>
              <div
                className={cn(
                  'p-4 rounded-xl border-[1.5px]',
                  'border-primary/20 bg-blue-50/50 dark:border-primary/20 dark:bg-primary/5'
                )}
              >
                <p className={cn('text-[13px] leading-relaxed', 'text-gray-700 dark:text-white/70')}>
                  xrpl.to has taken extensive measures to create a secure platform. However, the security of the platform is often irrelevant if a user is deceived into providing their private keys. It is important to understand your responsibility in guarding your key. Use the proper security measures described above: store your seed offline, never share it with anyone, verify you are on the correct domain, and check your Handshake code before entering any information. Never enter your seed anywhere if you have already set up your account. If you need help, contact <a href="https://x.com/xrplto" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@xrplto on X</a>.
                </p>
              </div>
            </div>
          </div>
        );

      case 'chat':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-normal text-primary mb-2">Chat</h2>
              <p className={cn('text-[14px] leading-relaxed', 'text-gray-600 dark:text-white/60')}>
                xrpl.to has a built-in live chat where you can talk with other traders, send direct messages, share tokens and NFTs, and use emotes.
              </p>
            </div>

            <div id="chat-overview" className="space-y-4">
              <h3 className={cn('text-lg font-medium', 'text-gray-900 dark:text-white')}>Overview</h3>
              <div className="space-y-3">
                {[
                  'Click the chat icon in the bottom-right corner to open the chat panel.',
                  'Connect your wallet to send messages. Your wallet address is your identity.',
                  'The chat shows a live online user count and typing indicators.',
                  'Your tier badge is displayed next to your name.'
                ].map((item, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex items-start gap-2.5 px-4 py-2.5 rounded-xl border-[1.5px]',
                      'border-gray-100 bg-gray-50/50 dark:border-white/5 dark:bg-white/[0.02]'
                    )}
                  >
                    <span className={cn('text-[13px] leading-relaxed', 'text-gray-600 dark:text-white/60')}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div id="chat-commands" className="space-y-4">
              <h3 className={cn('text-lg font-medium', 'text-gray-900 dark:text-white')}>Commands</h3>
              <p className={cn('text-[13px] leading-relaxed mb-3', 'text-gray-600 dark:text-white/60')}>
                Type these commands directly in the chat input and press Enter.
              </p>
              <div className="space-y-2">
                {[
                  { cmd: '/whisper rAddress message', desc: 'Open a DM conversation with the specified wallet and optionally send a message.' },
                  { cmd: '/mute rAddress [minutes]', desc: 'Mute a user. Requires moderator privileges. If abused, this privilege will be removed.' }
                ].map((item, i) => (
                  <div
                    key={i}
                    className={cn(
                      'p-3 rounded-xl border-[1.5px]',
                      'border-gray-100 bg-gray-50/50 dark:border-white/5 dark:bg-white/[0.02]'
                    )}
                  >
                    <code className="text-[12px] font-mono text-primary">{item.cmd}</code>
                    <p className={cn('text-[12px] leading-relaxed mt-1', 'text-gray-500 dark:text-white/50')}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div id="chat-emotes" className="space-y-4">
              <h3 className={cn('text-lg font-medium', 'text-gray-900 dark:text-white')}>Emotes</h3>
              <div className="space-y-3">
                {[
                  { label: 'Emote picker', text: 'Click the smiley face icon next to the input to open the emote grid. Search emotes by name.' },
                  { label: 'Inline autocomplete', text: 'Type : followed by at least 2 characters (e.g. :pepe) to get autocomplete suggestions. Use arrow keys to navigate and Tab or Enter to select.' }
                ].map((item, i) => (
                  <div
                    key={i}
                    className={cn(
                      'p-3 rounded-xl border-[1.5px]',
                      'border-gray-100 bg-gray-50/50 dark:border-white/5 dark:bg-white/[0.02]'
                    )}
                  >
                    <span className={cn('text-[13px] font-medium', 'text-gray-900 dark:text-white')}>{item.label}</span>
                    <p className={cn('text-[12px] leading-relaxed mt-1', 'text-gray-500 dark:text-white/50')}>{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div id="chat-dm" className="space-y-4">
              <h3 className={cn('text-lg font-medium', 'text-gray-900 dark:text-white')}>Direct Messages</h3>
              <div className="space-y-3">
                {[
                  'Click on any username in chat to open a DM tab with that user.',
                  'Use /whisper rAddress to start a DM from the command line.',
                  'DM tabs appear in the tab bar next to the General tab. Unread DMs are highlighted.',
                  'Close a DM tab by clicking the X on the tab. You can reopen it from the inbox.',
                  'The inbox icon shows all your conversations. Use the search bar to filter by address.',
                  'Online status is shown with a green dot next to DM usernames.'
                ].map((item, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex items-start gap-2.5 px-4 py-2.5 rounded-xl border-[1.5px]',
                      'border-gray-100 bg-gray-50/50 dark:border-white/5 dark:bg-white/[0.02]'
                    )}
                  >
                    <span className={cn('text-[13px] leading-relaxed', 'text-gray-600 dark:text-white/60')}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div id="chat-attachments" className="space-y-4">
              <h3 className={cn('text-lg font-medium', 'text-gray-900 dark:text-white')}>Attachments</h3>
              <p className={cn('text-[13px] leading-relaxed', 'text-gray-600 dark:text-white/60')}>
                You can attach tokens and NFTs to your chat messages. Attachments appear as rich previews inline with your message.
              </p>
              <div className="space-y-3">
                {[
                  'Token attachments show a preview card with the token name and price.',
                  'NFT attachments show a preview of the NFT image.',
                  'Remove an attachment by clicking the X on the attachment preview before sending.',
                  'Attachments can be combined with text in the same message.'
                ].map((item, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex items-start gap-2.5 px-4 py-2.5 rounded-xl border-[1.5px]',
                      'border-gray-100 bg-gray-50/50 dark:border-white/5 dark:bg-white/[0.02]'
                    )}
                  >
                    <span className={cn('text-[13px] leading-relaxed', 'text-gray-600 dark:text-white/60')}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div id="chat-support" className="space-y-4">
              <h3 className={cn('text-lg font-medium', 'text-gray-900 dark:text-white')}>Support Tickets</h3>
              <div
                className={cn(
                  'p-4 rounded-xl border-[1.5px]',
                  'border-primary/20 bg-blue-50/50 dark:border-primary/20 dark:bg-primary/5'
                )}
              >
                <p className={cn('text-[13px] leading-relaxed', 'text-gray-700 dark:text-white/70')}>
                  Support tickets are available for VIP, Nova, Diamond, and Verified tier users. Click the shield icon in the chat header to open the support panel where you can create and track tickets.
                </p>
              </div>
            </div>

            <div id="chat-moderation" className="space-y-4">
              <h3 className={cn('text-lg font-medium', 'text-gray-900 dark:text-white')}>Moderation</h3>
              <div className="space-y-3">
                {[
                  'The chat is actively moderated. Users who violate the rules may be muted or banned.',
                  'You can delete your own messages by clicking on them and confirming the delete action.'
                ].map((item, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex items-start gap-2.5 px-4 py-2.5 rounded-xl border-[1.5px]',
                      'border-gray-100 bg-gray-50/50 dark:border-white/5 dark:bg-white/[0.02]'
                    )}
                  >
                    <span className={cn('text-[13px] leading-relaxed', 'text-gray-600 dark:text-white/60')}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'terms':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-normal text-primary mb-2">Terms of Service</h2>
              <p className={cn('text-[14px] leading-relaxed', 'text-gray-600 dark:text-white/60')}>
                By using xrpl.to you agree to the following terms.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className={cn('text-lg font-medium', 'text-gray-900 dark:text-white')}>
                Non-Refundable Services
              </h3>
              <div
                className={cn(
                  'p-4 rounded-xl border-[1.5px]',
                  'border-primary/20 bg-blue-50/50 dark:border-primary/20 dark:bg-primary/5'
                )}
              >
                <p className={cn('text-[13px] leading-relaxed', 'text-gray-700 dark:text-white/70')}>
                  All services sold by xrpl.to are non-refundable. This includes Boosts, API key subscriptions, token launches, and any other paid features on the platform.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className={cn('text-lg font-medium', 'text-gray-900 dark:text-white')}>
                Irreversible Trades
              </h3>
              <div
                className={cn(
                  'p-4 rounded-xl border-[1.5px]',
                  'border-amber-500/20 bg-amber-50/50 dark:border-amber-500/20 dark:bg-amber-500/5'
                )}
              >
                <p className={cn('text-[13px] leading-relaxed', 'text-gray-700 dark:text-white/70')}>
                  Trades on the XRP Ledger DEX are irreversible. Once a trade is executed it cannot be undone due to the fully decentralized nature of the XRP Ledger. There is no central authority that can reverse, cancel, or modify any transaction.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className={cn('text-lg font-medium', 'text-gray-900 dark:text-white')}>
                What xrpl.to Is
              </h3>
              <p className={cn('text-[13px] leading-relaxed', 'text-gray-600 dark:text-white/60')}>
                xrpl.to is a trading interface and data aggregator for the XRP Ledger. It does not custody funds, execute trades on your behalf, or control the underlying ledger. All trades happen directly on the decentralized XRP Ledger DEX. xrpl.to simply provides the UI to interact with it.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className={cn('text-lg font-medium', 'text-gray-900 dark:text-white')}>
                User Responsibility
              </h3>
              <div className="space-y-3">
                {[
                  'You are solely responsible for your trading decisions and their outcomes.',
                  'You are responsible for securing your wallet and private keys.',
                  'xrpl.to is not liable for any losses resulting from trades, market conditions, or user error.',
                  'Token listings on xrpl.to do not constitute an endorsement. Always do your own research.'
                ].map((item, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex items-start gap-2.5 px-4 py-2.5 rounded-xl border-[1.5px]',
                      'border-gray-100 bg-gray-50/50 dark:border-white/5 dark:bg-white/[0.02]'
                    )}
                  >
                    <span className={cn('text-[13px] leading-relaxed', 'text-gray-600 dark:text-white/60')}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'api-keys':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-normal text-primary mb-2">API Keys</h2>
              <p className={cn('text-[14px] mb-4', 'text-gray-600 dark:text-white/60')}>
                Authenticate your requests with API keys for higher rate limits and usage tracking.
              </p>
              <a
                href="/dashboard"
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg border-[1.5px] px-4 py-2 text-[13px] font-medium transition-colors',
                  'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 dark:border-primary/50 dark:bg-primary/10 dark:text-primary dark:hover:bg-primary/20'
                )}
              >
                <Key size={14} />
                Manage Your API Keys
                <ExternalLink size={12} className="opacity-60" />
              </a>
            </div>

            <div id="create-key" className="space-y-4">
              <h3 className={cn('text-lg font-medium', 'text-gray-900 dark:text-white')}>
                Create API Key
              </h3>
              <p className={cn('text-[13px]', 'text-gray-600 dark:text-white/60')}>
                Create a free API key to get started. Requires XRPL wallet signature.
              </p>
              <div
                className={cn(
                  'rounded-xl border-[1.5px] overflow-hidden',
                  'border-[rgba(59,130,246,0.15)] bg-[rgba(59,130,246,0.02)] dark:border-[rgba(59,130,246,0.1)] dark:bg-[rgba(59,130,246,0.02)]'
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-between px-4 py-2 border-b',
                    'border-[rgba(59,130,246,0.15)] bg-[rgba(59,130,246,0.04)] dark:border-[rgba(59,130,246,0.1)] dark:bg-[rgba(59,130,246,0.05)]'
                  )}
                >
                  <span
                    className={cn(
                      'text-[11px] font-medium uppercase tracking-wide',
                      'text-gray-500 dark:text-white/40'
                    )}
                  >
                    POST /v1/keys
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `const timestamp = Date.now().toString();
const message = \`\${wallet.address}:\${timestamp}\`;
const signature = wallet.sign(message); // hex signature

const response = await fetch('https://api.xrpl.to/v1/keys', {
  method: 'POST',
  headers: {
    'X-Wallet': wallet.address,
    'X-Signature': signature,
    'X-Timestamp': timestamp,
    'X-Public-Key': wallet.publicKey,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ name: 'My App' })
});
const { apiKey, keyPrefix } = await response.json();
// Save apiKey - shown only once!`,
                        'create-key-code'
                      )
                    }
                    className="p-1.5 rounded hover:bg-white/10"
                  >
                    {copiedBlock === 'create-key-code' ? (
                      <CheckCircle size={14} className="text-emerald-500" />
                    ) : (
                      <Copy size={14} className="opacity-40" />
                    )}
                  </button>
                </div>
                <pre
                  className={cn(
                    'p-4 text-[12px] font-mono overflow-x-auto',
                    'text-gray-800 dark:text-white/80'
                  )}
                >
                  {`const timestamp = Date.now().toString();
const message = \`\${wallet.address}:\${timestamp}\`;
const signature = wallet.sign(message); // hex signature

const response = await fetch('https://api.xrpl.to/v1/keys', {
  method: 'POST',
  headers: {
    'X-Wallet': wallet.address,
    'X-Signature': signature,
    'X-Timestamp': timestamp,
    'X-Public-Key': wallet.publicKey,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ name: 'My App' })
});
const { apiKey, keyPrefix } = await response.json();
// Save apiKey - shown only once!`}
                </pre>
              </div>
            </div>

            <div id="use-key" className="space-y-4">
              <h3 className={cn('text-lg font-medium', 'text-gray-900 dark:text-white')}>
                Using API Keys
              </h3>
              <div className="grid gap-4">
                <div
                  className={cn(
                    'rounded-xl border-[1.5px] p-4',
                    'border-[rgba(59,130,246,0.15)] bg-[rgba(59,130,246,0.02)] dark:border-[rgba(59,130,246,0.1)] dark:bg-[rgba(59,130,246,0.02)]'
                  )}
                >
                  <div
                    className={cn(
                      'text-[11px] font-medium uppercase tracking-wide mb-3',
                      'text-gray-500 dark:text-white/40'
                    )}
                  >
                    Header (Recommended)
                  </div>
                  <code
                    className={cn(
                      'text-[13px] font-mono',
                      'text-gray-800 dark:text-white/80'
                    )}
                  >
                    X-Api-Key: xrpl_abc123...
                  </code>
                </div>
                <div
                  className={cn(
                    'rounded-xl border-[1.5px] p-4',
                    'border-[rgba(59,130,246,0.15)] bg-[rgba(59,130,246,0.02)] dark:border-[rgba(59,130,246,0.1)] dark:bg-[rgba(59,130,246,0.02)]'
                  )}
                >
                  <div
                    className={cn(
                      'text-[11px] font-medium uppercase tracking-wide mb-3',
                      'text-gray-500 dark:text-white/40'
                    )}
                  >
                    Query Parameter
                  </div>
                  <code
                    className={cn(
                      'text-[13px] font-mono',
                      'text-gray-800 dark:text-white/80'
                    )}
                  >
                    ?apiKey=xrpl_abc123...
                  </code>
                </div>
                <div
                  className={cn(
                    'rounded-xl border-[1.5px] p-4',
                    'border-[rgba(59,130,246,0.15)] bg-[rgba(59,130,246,0.02)] dark:border-[rgba(59,130,246,0.1)] dark:bg-[rgba(59,130,246,0.02)]'
                  )}
                >
                  <div
                    className={cn(
                      'text-[11px] font-medium uppercase tracking-wide mb-3',
                      'text-gray-500 dark:text-white/40'
                    )}
                  >
                    WebSocket
                  </div>
                  <code
                    className={cn(
                      'text-[13px] font-mono',
                      'text-gray-800 dark:text-white/80'
                    )}
                  >
                    wss://api.xrpl.to/ws/sync?apiKey=xrpl_abc123...
                  </code>
                </div>
              </div>
            </div>

          </div>
        );

      case 'subscriptions':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-normal text-primary mb-2">Subscriptions & Credits</h2>
              <p className={cn('text-[14px] mb-4', 'text-gray-600 dark:text-white/60')}>
                Pay with XRP or credit card. Yearly billing saves 2 months (16.7% off).
              </p>
              <a
                href="/dashboard"
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg border-[1.5px] px-4 py-2 text-[13px] font-medium transition-colors',
                  'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 dark:border-primary/50 dark:bg-primary/10 dark:text-primary dark:hover:bg-primary/20'
                )}
              >
                <CreditCard size={14} />
                Manage Subscription
                <ExternalLink size={12} className="opacity-60" />
              </a>
            </div>

            <div id="pricing" className="space-y-4">
              <h3 className={cn('text-lg font-medium', 'text-gray-900 dark:text-white')}>
                Subscription Tiers
              </h3>
              <div
                className={cn(
                  'rounded-xl border-[1.5px] overflow-hidden',
                  'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
                )}
              >
                <table className="w-full text-[13px]">
                  <thead className={'bg-gray-50 dark:bg-white/5'}>
                    <tr>
                      <th className={cn('text-left px-4 py-3 font-medium', 'text-gray-600 dark:text-white/60')}>
                        Tier
                      </th>
                      <th className={cn('text-left px-4 py-3 font-medium', 'text-gray-600 dark:text-white/60')}>
                        Price
                      </th>
                      <th className={cn('text-left px-4 py-3 font-medium', 'text-gray-600 dark:text-white/60')}>
                        Credits
                      </th>
                      <th className={cn('text-left px-4 py-3 font-medium', 'text-gray-600 dark:text-white/60')}>
                        Requests
                      </th>
                      <th className={cn('text-left px-4 py-3 font-medium', 'text-gray-600 dark:text-white/60')}>
                        Submit TX
                      </th>
                      <th className={cn('text-left px-4 py-3 font-medium', 'text-gray-600 dark:text-white/60')}>
                        Support
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {docs.tiers.map((row) => (
                      <tr
                        key={row.name}
                        className={'border-t border-[rgba(59,130,246,0.15)] dark:border-t dark:border-[rgba(59,130,246,0.1)]'}
                      >
                        <td className={cn('px-4 py-3 font-medium', 'text-gray-900 dark:text-white')}>
                          {row.name}
                        </td>
                        <td className={cn('px-4 py-3', 'text-gray-600 dark:text-white/60')}>
                          {row.price}
                        </td>
                        <td className={cn('px-4 py-3', 'text-gray-600 dark:text-white/60')}>
                          {row.credits}
                        </td>
                        <td className={cn('px-4 py-3', 'text-gray-600 dark:text-white/60')}>
                          {row.rate}
                        </td>
                        <td className={cn('px-4 py-3', 'text-gray-600 dark:text-white/60')}>
                          {row.submit || '-'}
                        </td>
                        <td className={cn('px-4 py-3', 'text-gray-600 dark:text-white/60')}>
                          {row.support || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div id="credits" className="space-y-4">
              <h3 className={cn('text-lg font-medium', 'text-gray-900 dark:text-white')}>
                Credit Packs (One-time, Never Expire)
              </h3>
              <div
                className={cn(
                  'rounded-xl border-[1.5px] overflow-hidden',
                  'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
                )}
              >
                <table className="w-full text-[13px]">
                  <thead className={'bg-gray-50 dark:bg-white/5'}>
                    <tr>
                      <th
                        className={cn(
                          'text-left px-4 py-3 font-medium',
                          'text-gray-600 dark:text-white/60'
                        )}
                      >
                        Pack
                      </th>
                      <th
                        className={cn(
                          'text-left px-4 py-3 font-medium',
                          'text-gray-600 dark:text-white/60'
                        )}
                      >
                        Price
                      </th>
                      <th
                        className={cn(
                          'text-left px-4 py-3 font-medium',
                          'text-gray-600 dark:text-white/60'
                        )}
                      >
                        Credits
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {docs.creditPacks.map((row) => (
                      <tr
                        key={row.pack}
                        className={
                          'border-t border-[rgba(59,130,246,0.15)] dark:border-t dark:border-[rgba(59,130,246,0.1)]'
                        }
                      >
                        <td
                          className={cn(
                            'px-4 py-3 font-medium',
                            'text-gray-900 dark:text-white'
                          )}
                        >
                          {row.pack}
                        </td>
                        <td className={cn('px-4 py-3', 'text-gray-600 dark:text-white/60')}>
                          {row.price}
                        </td>
                        <td className={cn('px-4 py-3', 'text-gray-600 dark:text-white/60')}>
                          {row.credits}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div id="xrp-payment" className="space-y-4">
              <h3 className={cn('text-lg font-medium', 'text-gray-900 dark:text-white')}>
                Pay with XRP
              </h3>
              <div
                className={cn(
                  'rounded-xl border-[1.5px] overflow-hidden',
                  'border-[rgba(59,130,246,0.15)] bg-[rgba(59,130,246,0.02)] dark:border-[rgba(59,130,246,0.1)] dark:bg-[rgba(59,130,246,0.02)]'
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-between px-4 py-2 border-b',
                    'border-[rgba(59,130,246,0.15)] bg-[rgba(59,130,246,0.04)] dark:border-[rgba(59,130,246,0.1)] dark:bg-[rgba(59,130,246,0.05)]'
                  )}
                >
                  <span
                    className={cn(
                      'text-[11px] font-medium uppercase tracking-wide',
                      'text-gray-500 dark:text-white/40'
                    )}
                  >
                    XRP Payment Flow
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `// 1. Get payment details
const res = await fetch('https://api.xrpl.to/v1/keys/purchase', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    wallet: 'rYourWallet...',
    type: 'credits',      // or 'tier'
    package: 'starter'    // or tier: 'developer', billing: 'monthly'
  })
}).then(r => r.json());
// res.payment = { destination, amount, destinationTag }

// 2. Send XRP payment
const payment = {
  TransactionType: 'Payment',
  Account: wallet.address,
  Destination: res.payment.destination,
  DestinationTag: res.payment.destinationTag,
  Amount: xrpl.xrpToDrops(res.payment.amount)
};
const result = await client.submitAndWait(wallet.sign(payment).tx_blob);

// 3. Verify (auto-polls for 30s)
await fetch('https://api.xrpl.to/v1/keys/verify-payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ txHash: result.result.hash })
});`,
                        'xrp-code'
                      )
                    }
                    className="p-1.5 rounded hover:bg-white/10"
                  >
                    {copiedBlock === 'xrp-code' ? (
                      <CheckCircle size={14} className="text-emerald-500" />
                    ) : (
                      <Copy size={14} className="opacity-40" />
                    )}
                  </button>
                </div>
                <pre
                  className={cn(
                    'p-4 text-[12px] font-mono overflow-x-auto',
                    'text-gray-800 dark:text-white/80'
                  )}
                >
                  {`// 1. Get payment details
const res = await fetch('https://api.xrpl.to/v1/keys/purchase', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    wallet: 'rYourWallet...',
    type: 'credits',      // or 'tier'
    package: 'starter'    // or tier: 'developer', billing: 'monthly'
  })
}).then(r => r.json());
// res.payment = { destination, amount, destinationTag }

// 2. Send XRP payment
const payment = {
  TransactionType: 'Payment',
  Account: wallet.address,
  Destination: res.payment.destination,
  DestinationTag: res.payment.destinationTag,
  Amount: xrpl.xrpToDrops(res.payment.amount)
};
const result = await client.submitAndWait(wallet.sign(payment).tx_blob);

// 3. Verify (auto-polls for 30s)
await fetch('https://api.xrpl.to/v1/keys/verify-payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ txHash: result.result.hash })
});`}
                </pre>
              </div>
            </div>

            <div id="stripe-payment" className="space-y-4">
              <h3 className={cn('text-lg font-medium', 'text-gray-900 dark:text-white')}>
                Pay with Card (Stripe)
              </h3>
              <div
                className={cn(
                  'rounded-xl border-[1.5px] overflow-hidden',
                  'border-[rgba(59,130,246,0.15)] bg-[rgba(59,130,246,0.02)] dark:border-[rgba(59,130,246,0.1)] dark:bg-[rgba(59,130,246,0.02)]'
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-between px-4 py-2 border-b',
                    'border-[rgba(59,130,246,0.15)] bg-[rgba(59,130,246,0.04)] dark:border-[rgba(59,130,246,0.1)] dark:bg-[rgba(59,130,246,0.05)]'
                  )}
                >
                  <span
                    className={cn(
                      'text-[11px] font-medium uppercase tracking-wide',
                      'text-gray-500 dark:text-white/40'
                    )}
                  >
                    Stripe Checkout
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `// 1. Create checkout session
const res = await fetch('https://api.xrpl.to/v1/keys/stripe/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    wallet: 'rYourWallet...',
    type: 'tier',
    tier: 'developer',
    billing: 'yearly'  // or 'monthly'
  })
}).then(r => r.json());

// 2. Redirect to Stripe
window.location.href = res.checkoutUrl;

// 3. Check status (after redirect back)
const status = await fetch(
  \`https://api.xrpl.to/v1/keys/stripe/status/\${sessionId}\`
).then(r => r.json());
// status: 'unpaid' | 'paid' | 'completed'`,
                        'stripe-code'
                      )
                    }
                    className="p-1.5 rounded hover:bg-white/10"
                  >
                    {copiedBlock === 'stripe-code' ? (
                      <CheckCircle size={14} className="text-emerald-500" />
                    ) : (
                      <Copy size={14} className="opacity-40" />
                    )}
                  </button>
                </div>
                <pre
                  className={cn(
                    'p-4 text-[12px] font-mono overflow-x-auto',
                    'text-gray-800 dark:text-white/80'
                  )}
                >
                  {`// 1. Create checkout session
const res = await fetch('https://api.xrpl.to/v1/keys/stripe/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    wallet: 'rYourWallet...',
    type: 'tier',
    tier: 'developer',
    billing: 'yearly'  // or 'monthly'
  })
}).then(r => r.json());

// 2. Redirect to Stripe
window.location.href = res.checkoutUrl;

// 3. Check status (after redirect back)
const status = await fetch(
  \`https://api.xrpl.to/v1/keys/stripe/status/\${sessionId}\`
).then(r => r.json());
// status: 'unpaid' | 'paid' | 'completed'`}
                </pre>
              </div>
            </div>

            <div id="billing-cycle" className="space-y-4">
              <h3 className={cn('text-lg font-medium', 'text-gray-900 dark:text-white')}>
                Billing Cycle
              </h3>
              <div
                className={cn(
                  'rounded-xl border-[1.5px] overflow-hidden',
                  'border-[rgba(59,130,246,0.15)] bg-[rgba(59,130,246,0.02)] dark:border-[rgba(59,130,246,0.1)] dark:bg-[rgba(59,130,246,0.02)]'
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-between px-4 py-2 border-b',
                    'border-[rgba(59,130,246,0.15)] bg-[rgba(59,130,246,0.04)] dark:border-[rgba(59,130,246,0.1)] dark:bg-[rgba(59,130,246,0.05)]'
                  )}
                >
                  <span
                    className={cn(
                      'text-[11px] font-medium uppercase tracking-wide',
                      'text-gray-500 dark:text-white/40'
                    )}
                  >
                    GET /:wallet/credits & /:wallet/subscription
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `// Get credits with billing cycle
GET /v1/keys/:wallet/credits
{
  "balance": 1000000,
  "billingCycle": {
    "start": "2025-12-07",
    "end": "2026-01-06",
    "daysRemaining": 30,
    "cycleProgress": 0,
    "billing": "monthly"
  }
}

// Get subscription details
GET /v1/keys/:wallet/subscription
{
  "subscription": {
    "tier": "developer",
    "billing": "yearly",
    "billingCycle": {
      "start": "2025-12-07",
      "end": "2026-12-07",
      "daysRemaining": 365,
      "renewalDate": "2026-12-07"
    }
  }
}`,
                        'billing-code'
                      )
                    }
                    className="p-1.5 rounded hover:bg-white/10"
                  >
                    {copiedBlock === 'billing-code' ? (
                      <CheckCircle size={14} className="text-emerald-500" />
                    ) : (
                      <Copy size={14} className="opacity-40" />
                    )}
                  </button>
                </div>
                <pre
                  className={cn(
                    'p-4 text-[12px] font-mono overflow-x-auto',
                    'text-gray-800 dark:text-white/80'
                  )}
                >
                  {`// Get credits with billing cycle
GET /v1/keys/:wallet/credits
{
  "balance": 1000000,
  "billingCycle": {
    "start": "2025-12-07",
    "end": "2026-01-06",
    "daysRemaining": 30,
    "cycleProgress": 0,
    "billing": "monthly"
  }
}

// Get subscription details
GET /v1/keys/:wallet/subscription
{
  "subscription": {
    "tier": "developer",
    "billing": "yearly",
    "billingCycle": {
      "start": "2025-12-07",
      "end": "2026-12-07",
      "daysRemaining": 365,
      "renewalDate": "2026-12-07"
    }
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        );

      case 'websocket':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-normal text-primary">WebSocket</h2>
            <p className={cn('text-[14px]', 'text-gray-600 dark:text-white/60')}>
              Real-time streaming endpoints for live market data, account updates, and more.
            </p>

            {/* Overview */}
            <div
              id="ws-overview"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
              )}
            >
              <h3 className={cn('text-[14px] font-medium mb-3', 'text-gray-900 dark:text-white')}>Connection</h3>
              <div className={cn('text-[13px] space-y-2', 'text-gray-600 dark:text-white/60')}>
                <p><strong>Base URL:</strong> <code className="text-primary">wss://api.xrpl.to/ws/</code></p>
                <p><strong>Authentication:</strong> Pass API key via query param <code>?apiKey=xrpl_...</code></p>
                <p><strong>Compression:</strong> permessage-deflate enabled (threshold 512 bytes)</p>
              </div>
            </div>

            {/* Endpoints */}
            <div
              id="ws-endpoints"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
              )}
            >
              <h3 className={cn('text-[14px] font-medium mb-4', 'text-gray-900 dark:text-white')}>All Endpoints</h3>
              <div className="space-y-3 text-[13px]">
                {[
                  ['sync', '/ws/sync', 'Multi-token market sync stream'],
                  ['token', '/ws/token/:md5', 'Single token real-time updates'],
                  ['ohlc', '/ws/ohlc/:md5', 'OHLC candlestick stream'],
                  ['history', '/ws/history/:md5', 'Trade history stream'],
                  ['richlist', '/ws/holders/:id', 'Token holder updates'],
                  ['orderbook', '/ws/orderbook?base&quote', 'Live orderbook depth'],
                  ['ledger', '/ws/ledger', 'Ledger close stream'],
                  ['trustlines', '/ws/trustlines/:account', 'Account trustline updates'],
                  ['news', '/ws/news', 'Real-time news feed'],
                  ['balance', '/ws/account/balance/:account', 'Account XRP balance stream'],
                  ['pair', '/ws/account/balance/pair/:account?curr1&issuer1&curr2&issuer2', 'Token pair balance stream'],
                  ['offers', '/ws/account/offers/:account?pair&md5&page&limit', 'Account open DEX offers stream'],
                  ['amm', '/ws/amm/info?asset&asset2', 'Live AMM pool info'],
                  ['creator', '/ws/creator/:identifier', 'Creator activity stream (md5 or address)'],
                  ['chat', '/ws/chat', 'Real-time chat messages']
                ].map(([name, path, desc]) => (
                  <div key={name} className="flex flex-wrap items-start gap-x-2 gap-y-0.5">
                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-purple-500/10 text-purple-500 shrink-0">WS</span>
                    <div>
                      <code className="font-mono text-[12px] text-primary break-all">{path}</code>
                      <span className={cn('ml-2', 'text-gray-500 dark:text-white/40')}>- {desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Example */}
            <div
              id="ws-example"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
              )}
            >
              <h3 className={cn('text-[14px] font-medium mb-3', 'text-gray-900 dark:text-white')}>Example: Token Stream</h3>
              <pre className={cn('text-[12px] p-3 rounded-lg overflow-x-auto', 'bg-gray-100 dark:bg-black/30')}>
{`// Connect to single token stream
const ws = new WebSocket('wss://api.xrpl.to/ws/token/0413ca7cfc258dfaf698c02fe304e607');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // data contains: price, vol24h, priceChange24h, etc.
  // Process token update data here
};

// Sync stream for multiple tokens
const syncWs = new WebSocket('wss://api.xrpl.to/ws/sync');
syncWs.onopen = () => {
  // Subscribe to specific tokens
  syncWs.send(JSON.stringify({
    type: 'subscribe',
    tokens: ['md5_1', 'md5_2']
  }));
};`}
              </pre>
            </div>

            {/* Info */}
            <div className={cn('text-[13px] space-y-2 p-4 rounded-lg', 'bg-primary/5 dark:bg-primary/5')}>
              <p><strong>Rate Limits:</strong> WebSocket connections follow the same tier limits as REST API</p>
              <p><strong>Heartbeat:</strong> Send ping frames every 30s to keep connection alive</p>
              <p><strong>Info endpoint:</strong> <code>GET /ws/info</code> returns all available WS endpoints and stats</p>
            </div>
          </div>
        );

      case 'errors':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-normal text-primary">Error Codes</h2>
            <div
              id="error-codes"
              className={cn(
                'rounded-xl border-[1.5px] overflow-hidden',
                'border-[rgba(59,130,246,0.15)] dark:border-[rgba(59,130,246,0.1)]'
              )}
            >
              <table className="w-full text-[13px]">
                <thead className={'bg-gray-50 dark:bg-white/5'}>
                  <tr>
                    <th
                      className={cn(
                        'text-left px-4 py-3 font-medium',
                        'text-gray-600 dark:text-white/60'
                      )}
                    >
                      Code
                    </th>
                    <th
                      className={cn(
                        'text-left px-4 py-3 font-medium',
                        'text-gray-600 dark:text-white/60'
                      )}
                    >
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { code: '200', desc: 'Success', color: 'text-emerald-500' },
                    { code: '400', desc: 'Bad Request - Invalid parameters', color: 'text-amber-500' },
                    { code: '401', desc: 'Unauthorized - Missing or invalid API key', color: 'text-amber-500' },
                    { code: '404', desc: 'Not Found - Resource does not exist', color: 'text-amber-500' },
                    { code: '429', desc: 'Too Many Requests - Rate limit exceeded', color: 'text-amber-500' },
                    { code: '500', desc: 'Internal Server Error', color: 'text-red-500' }
                  ].map((err) => (
                    <tr
                      key={err.code}
                      className={
                        'border-t border-[rgba(59,130,246,0.15)] dark:border-t dark:border-[rgba(59,130,246,0.1)]'
                      }
                    >
                      <td className="px-4 py-3">
                        <code className={cn('font-mono', err.color)}>{err.code}</code>
                      </td>
                      <td className={cn('px-4 py-3', 'text-gray-600 dark:text-white/60')}>
                        {err.desc}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex-1">
      <Head>
        <title>{ogp?.title || 'XRPL.to API Documentation'}</title>
        <meta
          name="description"
          content={ogp?.desc || 'Complete API documentation for XRPL.to - XRP Ledger token data and analytics'}
        />
        {ogp?.canonical && <link rel="canonical" href={ogp.canonical} />}
        <meta property="og:title" content={ogp?.title || 'XRPL.to API Documentation'} />
        <meta property="og:description" content={ogp?.desc || 'Complete API documentation for XRPL.to - XRP Ledger token data and analytics'} />
        <meta property="og:url" content={ogp?.url || 'https://xrpl.to/docs'} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={ogp?.title || 'XRPL.to API Documentation'} />
        <meta name="twitter:description" content={ogp?.desc || 'Complete API documentation for XRPL.to - XRP Ledger token data and analytics'} />
      </Head>

      <Header />

      <div className={cn('min-h-dvh scroll-smooth overflow-x-hidden', 'bg-white dark:bg-black')}>
        {/* Mobile top bar */}
        <div className={cn(
          'md:hidden sticky top-0 z-50 flex items-center justify-between px-4 py-2.5 border-b mt-0',
          'bg-white/95 backdrop-blur-md border-black/10 dark:bg-black/95 dark:backdrop-blur-md dark:border-white/10'
        )}>
          <div className="flex items-center gap-2 min-w-0">
            <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', 'bg-primary')} />
            <span className={cn('text-[13px] font-medium truncate', 'text-gray-700 dark:text-white/80')}>
              {allSections.find(s => s.id === currentSection)?.title || 'Documentation'}
            </span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium shrink-0',
              isSidebarOpen
                ? 'bg-primary/10 text-primary'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/5'
            )}
          >
            {isSidebarOpen ? <X size={15} /> : <Menu size={15} />}
            {isSidebarOpen ? 'Close' : 'Menu'}
          </button>
        </div>

        <div className="flex">
          {/* Mobile sidebar overlay */}
          {isSidebarOpen && (
            <div
              className="md:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <div
            className={cn(
              'w-[240px] border-r overflow-y-auto scrollbar-hide transition-all duration-300 pt-4',
              'fixed md:sticky top-0 h-dvh z-40',
              'bg-white border-[rgba(59,130,246,0.15)] dark:bg-black dark:border-white/10',
              isSidebarOpen ? 'block' : 'hidden md:block'
            )}
          >
            <div className="px-4 pb-4">
              {/* Search */}
              <div className="relative mb-6">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                <input
                  type="text"
                  placeholder="Search docs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={cn(
                    'w-full pl-9 pr-12 py-2.5 rounded-xl border-[1.5px] text-[13px] transition-[border-color] duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-primary/20',
                    'bg-black/[0.02] border-black/10 placeholder:text-black/50 focus:border-primary/40 dark:bg-white/[0.02] dark:border-white/10 dark:placeholder:text-white/50 dark:focus:border-primary/40'
                  )}
                />
                <kbd className={cn(
                  'absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] font-medium',
                  'bg-black/5 text-black/60 dark:bg-white/10 dark:text-white/60'
                )}>
                  ⌘K
                </kbd>
              </div>

              {/* Top-level links */}
              <div className="space-y-1 mb-6">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentSection('overview');
                  }}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] transition-[background-color] duration-200 relative',
                    currentSection === 'overview'
                      ? 'text-primary bg-primary/10 font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-white/70 dark:hover:text-white dark:hover:bg-white/5'
                  )}
                >
                  {currentSection === 'overview' && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-primary rounded-r-full" />
                  )}
                  <FileText size={14} className={currentSection === 'overview' ? 'text-primary' : 'opacity-60'} />
                  Documentation
                </a>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentSection('endpoint-reference');
                  }}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] transition-[background-color] duration-200 relative',
                    currentSection === 'endpoint-reference'
                      ? 'text-primary bg-primary/10 font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-white/70 dark:hover:text-white dark:hover:bg-white/5'
                  )}
                >
                  {currentSection === 'endpoint-reference' && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-primary rounded-r-full" />
                  )}
                  <Code size={14} className={currentSection === 'endpoint-reference' ? 'text-primary' : 'opacity-60'} />
                  API Reference
                </a>
              </div>

              {/* Grouped Navigation */}
              <nav className="space-y-5">
                {sidebarGroups.map((group) => {
                  const filteredItems = group.items.filter((s) =>
                    s.title.toLowerCase().includes(searchTerm.toLowerCase())
                  );
                  if (filteredItems.length === 0) return null;

                  return (
                    <div key={group.name}>
                      <button
                        onClick={() => toggleGroup(group.name)}
                        className={cn(
                          'w-full flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider mb-2 px-1 py-1 rounded',
                          'text-gray-600 hover:text-gray-700 dark:text-white/60 dark:hover:text-white/80'
                        )}
                      >
                        {group.name}
                        <ChevronDown
                          size={12}
                          className={cn(
                            'transition-transform duration-200',
                            !expandedGroups[group.name] && '-rotate-90'
                          )}
                        />
                      </button>
                      {expandedGroups[group.name] && (
                        <div className="space-y-0.5">
                          {filteredItems.map((section) => {
                            const Icon = section.icon;
                            const isActive = currentSection === section.id;
                            return (
                              <button
                                key={section.id}
                                onClick={() => {
                                  setCurrentSection(section.id);
                                  setIsSidebarOpen(false);
                                }}
                                className={cn(
                                  'w-full text-left px-3 py-2 rounded-xl text-[13px] flex items-center gap-2.5 transition-[background-color] duration-200 relative',
                                  isActive
                                    ? 'text-primary bg-primary/10 font-medium'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/5'
                                )}
                              >
                                {isActive && (
                                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-primary rounded-r-full" />
                                )}
                                <Icon
                                  size={14}
                                  className={cn(isActive ? 'text-primary' : 'opacity-40')}
                                />
                                {section.title}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>

              {/* Support Section */}
              <div
                className={cn(
                  'mt-8 pt-6 border-t',
                  'border-black/5 dark:border-white/5'
                )}
              >
                <div
                  className={cn(
                    'text-[10px] font-semibold uppercase tracking-wider mb-3 px-1',
                    'text-gray-600 dark:text-white/60'
                  )}
                >
                  Support
                </div>
                <div className="space-y-0.5">
                  <a
                    href="https://x.com/xrplto"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-[background-color] duration-200',
                      'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/5'
                    )}
                  >
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 opacity-50" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    @xrplto
                    <ExternalLink size={10} className="ml-auto opacity-30" />
                  </a>
                  <a
                    href="mailto:hello@xrpl.to"
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-[background-color] duration-200',
                      'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/5'
                    )}
                  >
                    <Mail size={14} className="opacity-50" />
                    hello@xrpl.to
                  </a>
                  <a
                    href="https://discord.gg/RmjPmVcMeY"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-[background-color] duration-200',
                      'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/5'
                    )}
                  >
                    <MessageCircle size={14} className="opacity-50" />
                    Discord
                    <ExternalLink size={10} className="ml-auto opacity-30" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0 min-h-dvh">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
              {renderContent()}

              {/* Prev/next navigation */}
              <div className={cn(
                'mt-12 pt-6 border-t flex items-stretch gap-2 sm:gap-3',
                'border-black/10 dark:border-white/10'
              )}>
                {prevSection ? (
                  <button
                    onClick={() => { setCurrentSection(prevSection.id); window.scrollTo(0, 0); }}
                    className={cn(
                      'flex-1 min-w-0 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 sm:py-4 rounded-xl border-[1.5px] text-left transition-[border-color,background-color] duration-200',
                      'border-black/10 hover:border-primary/40 hover:bg-primary/5 dark:border-white/10 dark:hover:border-primary/40 dark:hover:bg-primary/5'
                    )}
                  >
                    <ChevronLeft size={14} className="text-primary shrink-0" />
                    <div className="min-w-0">
                      <div className={cn('text-[10px] sm:text-[11px] uppercase tracking-wider mb-0.5', 'text-gray-500 dark:text-white/60')}>Prev</div>
                      <div className={cn('text-[12px] sm:text-[13px] font-medium truncate', 'text-gray-700 dark:text-white/80')}>{prevSection.title}</div>
                    </div>
                  </button>
                ) : <div className="flex-1" />}
                {nextSection ? (
                  <button
                    onClick={() => { setCurrentSection(nextSection.id); window.scrollTo(0, 0); }}
                    className={cn(
                      'flex-1 min-w-0 flex items-center justify-end gap-2 sm:gap-3 px-3 sm:px-4 py-3 sm:py-4 rounded-xl border-[1.5px] text-right transition-[border-color,background-color] duration-200',
                      'border-black/10 hover:border-primary/40 hover:bg-primary/5 dark:border-white/10 dark:hover:border-primary/40 dark:hover:bg-primary/5'
                    )}
                  >
                    <div className="min-w-0">
                      <div className={cn('text-[10px] sm:text-[11px] uppercase tracking-wider mb-0.5', 'text-gray-500 dark:text-white/60')}>Next</div>
                      <div className={cn('text-[12px] sm:text-[13px] font-medium truncate', 'text-gray-700 dark:text-white/80')}>{nextSection.title}</div>
                    </div>
                    <ChevronRight size={14} className="text-primary shrink-0" />
                  </button>
                ) : <div className="flex-1" />}
              </div>
            </div>
          </div>

          {/* On this page - Right sidebar (desktop only) */}
          <div
            className={cn(
              'hidden xl:block w-[200px] pt-6 pr-4',
              'border-gray-100 dark:border-white/[0.05]'
            )}
          >
            <div className="sticky top-[68px]">
              <div
                className={cn(
                  'text-[11px] font-semibold uppercase tracking-wider mb-4 flex items-center gap-2',
                  'text-gray-500 dark:text-white/60'
                )}
              >
                <div className={cn('w-1 h-3 rounded-full', 'bg-primary/40 dark:bg-primary/60')} />
                On this page
              </div>
              <nav className="space-y-0.5 border-l border-white/10 pl-3">
                {(pageAnchors[currentSection] || []).map((anchor) => (
                  <a
                    key={anchor.id}
                    href={`#${anchor.id}`}
                    className={cn(
                      'block text-left text-[12px] py-1.5 transition-transform duration-200 hover:translate-x-0.5',
                      'text-gray-500 hover:text-primary dark:text-white/60 dark:hover:text-primary'
                    )}
                  >
                    {anchor.label}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 max-sm:h-dvh"
            onClick={() => setIsModalOpen(false)}
          >
            <div className={cn('fixed inset-0', 'bg-black/30 dark:bg-black/70')} />
            <div
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'relative rounded-xl border w-full max-w-[900px] max-h-[85dvh] overflow-hidden flex flex-col',
                'bg-white border-gray-200 dark:bg-[#0a0a0a] dark:border-white/10'
              )}
            >
              <div
                className={cn(
                  'px-4 py-3 border-b shrink-0',
                  'border-gray-100 dark:border-white/10'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code size={14} className={'text-cyan-600 dark:text-[#3f96fe]'} />
                    <span
                      className={cn(
                        'text-[13px] font-medium',
                        'text-gray-900 dark:text-white'
                      )}
                    >
                      API Response
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {copySuccess && (
                      <span className="flex items-center gap-1 text-emerald-500 text-[11px] mr-2">
                        <CheckCircle size={12} /> Copied
                      </span>
                    )}
                    <button
                      onClick={handleCopyResponse}
                      className={cn(
                        'p-1.5 rounded-lg',
                        'hover:bg-gray-100 dark:hover:bg-white/10'
                      )}
                    >
                      <Copy size={14} className={'text-gray-400 dark:text-white/40'} />
                    </button>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className={cn(
                        'p-1.5 rounded-lg',
                        'hover:bg-gray-100 dark:hover:bg-white/10'
                      )}
                    >
                      <X size={14} className={'text-gray-400 dark:text-white/40'} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 size={20} className="animate-spin text-primary" />
                  </div>
                ) : apiResponse ? (
                  <pre
                    className={cn(
                      'text-[11px] font-mono p-4 m-0 leading-relaxed',
                      'text-gray-800 dark:text-white/80'
                    )}
                  >
                    {JSON.stringify(apiResponse, null, 2)
                      .split('\n')
                      .map((line, i) => {
                        // Escape HTML entities first to prevent XSS from API response data
                        const escaped = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                        return (
                          <div
                            key={i}
                            dangerouslySetInnerHTML={{
                              __html: escaped
                                .replace(
                                  /"([^"]+)":/g,
                                  `<span class="${'text-cyan-600 dark:text-[#7dd3fc]'}">"$1"</span>:`
                                )
                                .replace(
                                  /: "([^"]*)"/g,
                                  `: <span class="${'text-amber-600 dark:text-[#fde047]'}">"$1"</span>`
                                )
                                .replace(
                                  /: (\d+\.?\d*)/g,
                                  `: <span class="${'text-purple-600 dark:text-[#a78bfa]'}">$1</span>`
                                )
                                .replace(
                                  /: (true|false|null)/g,
                                  `: <span class="${'text-pink-600 dark:text-[#f472b6]'}">$1</span>`
                                )
                            }}
                          />
                        );
                      })}
                  </pre>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>

      <ScrollToTop />
      <Footer />
    </div>
  );
};

export default ApiDocsPage;

export async function getServerSideProps({ res }) {
  res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300');

  const BASE_URL = 'https://api.xrpl.to/v1';
  let apiDocs = null;

  try {
    const docsRes = await api.get(`${BASE_URL}/docs`, { timeout: 8000 });
    apiDocs = docsRes.data;
  } catch (e) {
    console.error('Failed to fetch API docs:', e.message);
  }

  const ogp = {
    canonical: 'https://xrpl.to/docs',
    title: 'API Documentation - XRPL.to',
    desc: 'Complete API reference for XRPL.to - Access XRP Ledger token data, trading, NFT, and analytics endpoints.',
    url: 'https://xrpl.to/docs',
    imgUrl: 'https://xrpl.to/api/og/docs',
    imgType: 'image/png'
  };

  return {
    props: {
      apiDocs,
      ogp
    }
  };
}
