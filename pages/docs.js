import React, { useState, useContext } from 'react';
import Head from 'next/head';
import axios from 'axios';
import {
  Copy,
  Menu,
  X,
  CheckCircle,
  Code,
  Search,
  Loader2,
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
  Play
} from 'lucide-react';
import { AppContext } from 'src/AppContext';
import { cn } from 'src/utils/cn';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
import { API_REFERENCE, getTotalEndpointCount, ApiButton } from 'src/components/ApiEndpointsModal';

const ApiDocsPage = ({ apiDocs, ogp }) => {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [currentSection, setCurrentSection] = useState('overview');
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
    index: '101738551'
  };

  const [expandedGroups, setExpandedGroups] = useState({
    'Get Started': true,
    'Token APIs': true,
    'Account & NFT': true,
    Advanced: true,
    Authentication: true
  });

  // Dynamic data from API with fallbacks
  const docs = {
    version: apiDocs?.version || '2.0',
    baseUrl: apiDocs?.baseUrl || 'https://api.xrpl.to/v1',
    tiers: apiDocs?.tiers || [
      { name: 'Free', price: '$0/mo', credits: '1M', rate: '10 req/sec' },
      { name: 'Developer', price: '$49/mo', credits: '10M', rate: '50 req/sec' },
      { name: 'Business', price: '$499/mo', credits: '100M', rate: '200 req/sec' },
      { name: 'Professional', price: '$999/mo', credits: '200M', rate: '500 req/sec' }
    ],
    creditPacks: apiDocs?.keys?.creditPacks || [
      { pack: 'starter', price: '$5', credits: '1M' },
      { pack: 'standard', price: '$20', credits: '5M' },
      { pack: 'bulk', price: '$75', credits: '25M' },
      { pack: 'mega', price: '$250', credits: '100M' }
    ],
    caching: apiDocs?.reference?.caching || {
      default: '5 seconds',
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
      { method: 'GET', path: '/boost/verify/{invoiceId}', desc: 'Verify payment and activate boost' },
      { method: 'GET', path: '/boost/active', desc: 'List currently boosted tokens' }
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
      name: 'Get Started',
      items: [
        { id: 'overview', title: 'Overview', icon: BookOpen },
        { id: 'reference', title: 'Reference (md5)', icon: Hash },
        { id: 'endpoint-reference', title: 'All Endpoints', icon: List },
        { id: 'fees', title: 'Fees', icon: Zap },
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
        { id: 'tools', title: 'Tools', icon: Wrench }
      ]
    }
  ];

  const toggleGroup = (name) => {
    setExpandedGroups((prev) => ({ ...prev, [name]: !prev[name] }));
  };

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
    fees: [
      { id: 'trading-fees', label: 'Trading Fees' },
      { id: 'token-launch-fees', label: 'Token Launch Fees' }
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
    errors: [{ id: 'error-codes', label: 'HTTP Status Codes' }]
  };

  const copyToClipboard = (text, blockId) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedBlock(blockId);
      setTimeout(() => setCopiedBlock(null), 2000);
    });
  };

  // Build sample URL by replacing path parameters with sample values
  const buildSampleUrl = (path) => {
    return path
      .replace(/:md5/g, SAMPLE_DATA.md5)
      .replace(/:id/g, SAMPLE_DATA.md5)
      .replace(/:account/g, SAMPLE_DATA.account)
      .replace(/:address/g, SAMPLE_DATA.account)
      .replace(/:issuer/g, SAMPLE_DATA.issuer)
      .replace(/:nftId/g, SAMPLE_DATA.nftId)
      .replace(/:slug/g, SAMPLE_DATA.slug)
      .replace(/:date/g, SAMPLE_DATA.date)
      .replace(/:hash/g, SAMPLE_DATA.hash)
      .replace(/:index/g, SAMPLE_DATA.index);
  };

  // Check if endpoint can be tried
  const canTryEndpoint = (ep) => {
    if (ep.method === 'POST' && ['/search', '/dex/quote'].includes(ep.path)) return true;
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
      const url = `https://api.xrpl.to/v1${samplePath}`;
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
          }
        };
        res = await axios.post(url, bodies[ep.path] || {}, { timeout: 10000 });
      } else {
        res = await axios.get(url, { timeout: 10000 });
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
Params: start (int, default:0), limit (int, max:100), sortBy (vol24hxrp|marketcap|p24h|trustlines|trendingScore), sort (alias), sortType (asc|desc), order (alias), filter (OMCF|AMM|search), filterNe (negative filter), tag, tags (comma-separated OR filter), watchlist (comma-separated md5), showNew, showSlug, showDate, skipMetrics
Example: GET /v1/tokens?limit=20&sortBy=vol24hxrp&sortType=desc
Response: { result, took, count, tokens[], exch, H24, global }

GET /token/{id} - Get single token by md5 (recommended), slug (issuer-currency), or issuer_currency
Params: id (required), desc ("yes" for description)
Formats: md5 (0413ca7cfc258dfaf698c02fe304e607), slug (rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz-SOLO), issuer_currency (issuer_hexCurrency)
Example: GET /v1/token/0413ca7cfc258dfaf698c02fe304e607

POST /search - Search tokens by name/symbol/issuer
Body: { search: string, page: int, limit: int (max:100) }
Response: { result, tokens[], pagination: { page, limit, total, hasMore } }

GET /slugs - Get all token slugs
GET /tags - Get all token tags with counts
GET /issuer/{issuer} - Get other tokens from same issuer (md5, page, limit)
GET /traders/token-traders/{tokenId} - Get top traders with P&L stats (sortBy: volume|pnl|trades, minVolume)`,

    market: `## Market Data API
Base URL: https://api.xrpl.to/v1

GET /ohlc/{md5} - OHLC candlestick data from ohlc_v1 database
Params: range (1D|5D|1M|3M|1Y|5Y|ALL), interval (1m|5m|15m|30m|1h|4h|1d|1w - auto-selected if omitted), vs_currency (XRP|USD|EUR|JPY|CNH)
Default intervals: 1D→5m, 5D→15m, 1M→1h, 3M→4h, 1Y→1d, 5Y/ALL→1w
Cache: 1D→5s, 7D→1min, 1M→2min, 3M→5min, 1Y+→10min
Example: GET /v1/ohlc/0413ca7cfc258dfaf698c02fe304e607?range=1M&vs_currency=USD
Response: { result, source, took, length, range, interval, interval_seconds, vs_currency, ohlc: [[time, o, h, l, c, vol]] }

GET /sparkline/{md5} - Sparkline price data for mini charts
Params: period (24h|7d, default:7d), lightweight (bool, default:false), maxPoints (int, default:20)

GET /holders/list/{md5} - Top token holders (start, limit)
GET /holders/info/{md5} - Holder distribution statistics
GET /holders/graph/{md5} - Holder distribution graph data

GET /rsi - RSI technical indicators with filtering
Params: start, limit (max:100), sortBy (rsi15m|rsi1h|rsi4h|rsi24h|rsi7d), sortType, timeframe, filter, tag, origin, minMarketCap, maxMarketCap, minVolume24h, maxVolume24h, minPriceChange24h, maxPriceChange24h, minRsi15m, maxRsi15m, minRsi1h, maxRsi1h, minRsi4h, maxRsi4h, minRsi24h, maxRsi24h, minRsi7d, maxRsi7d
Example: GET /v1/rsi?minRsi24h=70&sortBy=rsi24h&limit=20

POST /metrics - Get historical token metrics (body: { md5, range })
GET /news - XRPL news with sentiment (Live, page, limit, source filter)
GET /news/search?q={query} - Search news articles by title/summary/body
GET /stats - Global platform metrics (30s)`,

    trading: `## Trading API
Base URL: https://api.xrpl.to/v1
Token identifiers: All endpoints accept md5 (recommended), slug, or issuer_currency format

GET /history - Trade history for a token
Params: md5 (required unless account), account, page, limit (max:5000), startTime, endTime (Unix ms), xrpOnly, xrpAmount
Example: GET /v1/history?md5=0413ca7cfc258dfaf698c02fe304e607&limit=50

GET /amm - AMM liquidity pools with metrics
Params: token (md5/slug/issuer_currency to filter), page, limit, sortBy (fees|apy|liquidity|volume|created)
Example: GET /v1/amm?token=0413ca7cfc258dfaf698c02fe304e607

GET /amm/info - Live AMM pool info
Params: asset, asset2 (md5/slug/issuer_currency or "XRP")
Example: GET /v1/amm/info?asset=XRP&asset2=0413ca7cfc258dfaf698c02fe304e607

GET /amm/liquidity-chart - Historical TVL chart
Params: token (md5/slug/issuer_currency)

POST /dex/quote - Swap quote via ripple_path_find
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

GET /traders/{address} - Trader profile with stats
GET /watchlist?account={account} - User watchlist
POST /watchlist - Add/remove token (body: { account, md5, action: "add"|"remove" })

POST /oauth/twitter/oauth1/request - Twitter OAuth request token (body: { callbackUrl })
POST /oauth/twitter/oauth1/access - Twitter OAuth access token (body: { oauth_token, oauth_verifier, oauth_token_secret })`,

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
GET /nft/traders/active - Active traders (sortBy: balance|buyVolume|sellVolume|totalVolume, includeGlobalMetrics)
GET /nft/traders/{account}/volume - Trader volume stats
GET /nft/accounts/{address}/nfts - NFTs owned by account (limit, skip)
GET /nft/stats/global - Global NFT stats
GET /nft/brokers/stats - Broker fees and volumes

POST /nft/mint - Create NFT mint transaction payload
POST /nft/pin - Pin NFT metadata to IPFS (body: { metadata })
GET /nft/pin/status/{hash} - Get IPFS pin status`,

    xrpl: `## XRPL Node API
Base URL: https://api.xrpl.to/v1
Token identifiers: Orderbook accepts md5/slug/issuer_currency via base/quote params

GET /orderbook - Live orderbook (rippled: book_offers)
Params (recommended): base, quote (md5/slug/issuer_currency or "XRP"), limit (default:20, max:400)
Params (legacy): base_currency, base_issuer, quote_currency, quote_issuer
Example: GET /v1/orderbook?base=XRP&quote=0413ca7cfc258dfaf698c02fe304e607
Response: { success, pair, base, quote, bids[], asks[], ledger_index }

GET /tx/{account} - Paginated transaction history (rippled: tx)
Params: limit (default:200, max:400), marker (JSON string), ledger_index_min/max, tx_type, forward (bool)

GET /trustlines/{account} - Account trustlines with token info (rippled: account_lines)
Params: page, limit (default:10, max:50), format (raw|default|full), sortByValue (bool)

GET /tx/{hash} - Transaction by hash (rippled: tx)
POST /pathfinding/pathfind - Find payment paths (rippled: path_find)
POST /pathfinding/ripplepathfind - Ripple path find (rippled: ripple_path_find)`,

    analytics: `## Analytics API
Base URL: https://api.xrpl.to/v1

GET /analytics/token/{md5} - Token analytics (OMCF)
GET /analytics/trader/{address}/{md5} - Trader metrics for specific token
GET /traders/token-traders/{md5} - Top traders (page, limit, sortBy: pnl|trades|volume)
GET /analytics/trader-stats/{address} - Cumulative trader stats

GET /analytics/cumulative-stats - All traders stats (Live)
Params: page (default:1), limit (default:10), sortBy (default:volume24h), sortOrder (asc|desc), minVolume, address, includeAMM (default:true), minTrades, minProfit, minROI, minTokens, startDate, endDate, activePeriod

GET /analytics/market-metrics - Daily market metrics (startDate required, endDate default:now)
GET /analytics/trader/{address}/volume-history - Volume chart data (startDate, endDate, page, limit)
GET /analytics/trader/{address}/trade-history - Trade count history
GET /analytics/trader/{address}/roi-history - ROI history`,

    launch: `## Token Launch API
Base URL: https://api.xrpl.to/v1

POST /launch-token - Initialize token launch
Body: { currencyCode (1-20 chars, not "XRP"), tokenSupply (max ~10^16), ammXrpAmount (min 1), name, origin, user, userAddress (required if userCheckAmount>0), userCheckAmount (max 95%), antiSnipe (bool), domain, description, telegram, twitter, imageData (base64) }
Costs: platformFee 5-30 XRP (0-30% dev → 5-20 XRP, 30-95% dev → 20-30 XRP), baseReserve 1 XRP, ownerReserve 0.2 XRP/object
Typical: 10-50 XRP (breakdown: issuer(1) + fee(5-30) + holder(1) + AMM liquidity + tx fees(~1.8))
Response: { success, sessionId, status, issuerAddress, holderAddress, requiredFunding, fundingBreakdown }

GET /launch-token/status/{sessionId} - Poll status (every 3s)
Statuses: initializing → awaiting_funding → partial_funding → funded → configuring_issuer → registering_token → creating_trustline → sending_tokens → creating_checks → creating_amm → scheduling_blackhole → success/completed/failed/cancelled

DELETE /launch-token/{sessionId} - Cancel and refund (allowed before creating_amm)
POST /launch-token/{sessionId}/cancel - Cancel alternative
POST /launch-token/authorize - Request trustline auth (anti-snipe: issuer, currency, account)
GET /launch-token/queue-status/{sessionId} - Auth queue status
GET /launch-token/auth-info/{issuer}/{currency} - Token auth info
GET /launch-token/check-auth/{issuer}/{currency}/{address} - Check authorization
GET /launch-token/calculate-funding - Calculate XRP required (ticketCount, antiSnipeMode)

Anti-Snipe Mode: Enables RequireAuth flag, 250 pre-created tickets, 5min auth window after AMM created, then RequireAuth removed and issuer blackholed
Final State: issuer ~1 XRP locked (blackholed), holder ~1.4 XRP locked (base + LP token reserve, blackholed)`,

    tools: `## Tools API
Base URL: https://api.xrpl.to/v1

GET /health - API health check (returns "success")
GET /testnet/{address} - Get XRP balance on testnet
GET /integrations/xrpnft/tokens - Get tokens in XRPNFT format (filter param)
GET /integrations/xrpnft/filter-by-account/{account} - Get NFTs owned by account (XRPNFT format)`,

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

Caching: Default Live (5s), platformStatus 30s, News Live (5min), Cumulative Stats Live (10min), OHLC varies by range
Rate Limits: No Key (10/min, 500/day), Free (10/min, 2K/day), Basic (100/min, 30K/day), Pro (400/min, 120K/day), Enterprise (1K/min, 300K/day)`
  };

  const CopyButton = ({ text, id, label = 'Copy for LLM' }) => (
    <button
      onClick={() => copyToClipboard(text, id)}
      className={cn(
        'flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] font-medium',
        copiedBlock === id
          ? 'bg-emerald-500/10 text-emerald-500'
          : isDark
            ? 'bg-white/5 hover:bg-white/10 text-white/60'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
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
      const response = await axios.get(`https://api.xrpl.to${apiPath}`);
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
                <p className={cn('text-[14px]', isDark ? 'text-white/60' : 'text-gray-600')}>
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
                  isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
                )}
              >
                <div
                  className={cn(
                    'text-[11px] font-medium uppercase tracking-wide mb-4',
                    isDark ? 'text-white/40' : 'text-gray-500'
                  )}
                >
                  {category.label} ({category.endpoints.length})
                </div>
                <div className="space-y-3 text-[13px]">
                  {category.endpoints.map((ep) => (
                    <div key={ep.path} className={cn(
                      'rounded-lg p-3',
                      isDark ? 'bg-white/[0.02]' : 'bg-gray-50/50'
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
                                isDark ? 'text-[#3f96fe]' : 'text-cyan-600'
                              )}
                            >
                              /v1{ep.path}
                            </code>
                            <p className={cn('text-[11px] mt-1', isDark ? 'text-white/50' : 'text-gray-500')}>
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
                              isDark
                                ? 'bg-primary/10 text-primary hover:bg-primary/20'
                                : 'bg-primary/10 text-primary hover:bg-primary/15'
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
                          isDark ? 'border-white/10' : 'border-gray-200'
                        )}>
                          <div className={cn(
                            'flex items-center justify-between px-3 py-2 text-[10px]',
                            isDark ? 'bg-white/5' : 'bg-gray-100'
                          )}>
                            <code className={cn(
                              'font-mono truncate',
                              isDark ? 'text-white/60' : 'text-gray-600'
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
                                  isDark ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                                )}
                              >
                                {copiedBlock === `resp-${ep.path}` ? <CheckCircle size={10} /> : <Copy size={10} />}
                                {copiedBlock === `resp-${ep.path}` ? 'Copied' : 'Copy'}
                              </button>
                              <button
                                onClick={() => setEndpointResponse(null)}
                                className={cn(
                                  'p-1 rounded',
                                  isDark ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                                )}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                          <pre className={cn(
                            'p-3 text-[10px] leading-relaxed max-h-[200px] overflow-auto font-mono',
                            endpointResponse.error
                              ? 'text-red-400'
                              : isDark ? 'text-white/70' : 'text-gray-700'
                          )}>
                            {JSON.stringify(endpointResponse.data || endpointResponse.error, null, 2)}
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
                  isDark ? 'text-white/60' : 'text-gray-600'
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
                isDark ? 'border-primary/30 bg-primary/5' : 'border-primary/20 bg-primary/5'
              )}
            >
              <div className="flex items-center gap-2 mb-3">
                <Server size={16} className="text-primary" />
                <h3 className="text-[15px] font-medium">Base URL</h3>
              </div>
              <div
                className={cn(
                  'p-3 rounded-lg font-mono text-[13px]',
                  isDark
                    ? 'bg-[rgba(59,130,246,0.02)]'
                    : 'bg-[rgba(59,130,246,0.02)] border border-[rgba(59,130,246,0.15)]'
                )}
              >
                {docs.baseUrl}
              </div>
            </div>

            {/* Feature Cards */}
            <div id="start-building">
              <h2 className="text-xl font-normal mb-4">Start Building</h2>
              <p className={cn('text-[14px] mb-5', isDark ? 'text-white/60' : 'text-gray-600')}>
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
                    desc: 'Free: 10/min. Pro: 400/min. See API Keys for all tiers.',
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
                      isDark
                        ? 'border-[rgba(59,130,246,0.1)] hover:border-[rgba(59,130,246,0.2)] bg-[rgba(59,130,246,0.02)]'
                        : 'border-[rgba(59,130,246,0.15)] hover:border-[rgba(59,130,246,0.25)] bg-[rgba(59,130,246,0.02)]'
                    )}
                    onClick={() => card.action && setCurrentSection(card.action)}
                  >
                    <card.icon size={20} className="text-primary mb-3" />
                    <h3 className="text-[14px] font-medium mb-1">{card.title}</h3>
                    <p className={cn('text-[13px]', isDark ? 'text-white/50' : 'text-gray-500')}>
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
                isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
              )}
            >
              <h3 className="text-[15px] font-medium mb-3">Quick Start Example</h3>
              <p className={cn('text-[13px] mb-3', isDark ? 'text-white/60' : 'text-gray-600')}>
                Get top tokens by 24h volume:
              </p>
              <div
                className={cn(
                  'p-3 rounded-lg font-mono text-[13px] overflow-x-auto',
                  isDark
                    ? 'bg-[rgba(59,130,246,0.02)]'
                    : 'bg-[rgba(59,130,246,0.02)] border border-[rgba(59,130,246,0.15)]'
                )}
              >
                <span className="text-primary">curl</span> -X GET
                "https://api.xrpl.to/v1/tokens?limit=10&sortBy=vol24hxrp"
              </div>
              <button
                onClick={() => handleTryApi('/v1/tokens?limit=5&sortBy=vol24hxrp')}
                className={cn(
                  'mt-3 flex items-center gap-2 rounded-lg border-[1.5px] px-3 py-1.5 text-[12px] font-medium text-primary',
                  isDark
                    ? 'border-primary/30 bg-primary/5 hover:bg-primary/10'
                    : 'border-primary/30 bg-primary/5 hover:bg-primary/10'
                )}
              >
                <Code size={12} /> Try It
              </button>
            </div>
          </div>
        );

      case 'fees':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-normal text-primary mb-2">Fees</h2>
              <p className={cn('text-[14px]', isDark ? 'text-white/60' : 'text-gray-600')}>
                Transparent fee structure for trading and token launches on XRPL.to
              </p>
            </div>

            {/* Trading Fees */}
            <div
              id="trading-fees"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
              )}
            >
              <div
                className={cn(
                  'text-[11px] font-medium uppercase tracking-wide mb-4',
                  isDark ? 'text-white/40' : 'text-gray-500'
                )}
              >
                Trading Fees
              </div>
              <div
                className={cn(
                  'rounded-xl border-[1.5px] p-4 mb-4',
                  isDark ? 'border-primary/30 bg-primary/5' : 'border-primary/20 bg-primary/5'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-medium">Platform Trading Fee</span>
                  <span className="text-2xl font-medium text-primary">1.5%</span>
                </div>
              </div>
              <div
                className={cn('space-y-3 text-[13px]', isDark ? 'text-white/60' : 'text-gray-600')}
              >
                <p>
                  A <span className="text-primary font-medium">1.5% fee</span> is applied to all
                  trades executed through the XRPL.to swap interface. This fee helps maintain and
                  improve the platform.
                </p>
                <div className={cn('rounded-lg p-3', isDark ? 'bg-white/5' : 'bg-gray-50')}>
                  <div className="font-medium mb-2">Example</div>
                  <div>Swapping 1,000 XRP worth of tokens:</div>
                  <div className="mt-1">
                    Fee: <span className="text-primary">15 XRP</span> (1.5% of 1,000)
                  </div>
                </div>
                <p className={cn('text-[12px]', isDark ? 'text-white/40' : 'text-gray-500')}>
                  Note: This fee is separate from any AMM pool fees or network transaction costs.
                </p>
              </div>
            </div>

            {/* Token Launch Fees */}
            <div
              id="token-launch-fees"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
              )}
            >
              <div
                className={cn(
                  'text-[11px] font-medium uppercase tracking-wide mb-4',
                  isDark ? 'text-white/40' : 'text-gray-500'
                )}
              >
                Token Launch Fees
              </div>
              <p className={cn('text-[13px] mb-4', isDark ? 'text-white/60' : 'text-gray-600')}>
                Launch your token on the XRP Ledger with our streamlined token creation service.
              </p>

              <div
                className={cn(
                  'rounded-lg overflow-hidden border-[1.5px] mb-4',
                  isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
                )}
              >
                <table className="w-full text-[13px]">
                  <thead className={isDark ? 'bg-white/5' : 'bg-gray-50'}>
                    <tr>
                      <th
                        className={cn(
                          'text-left px-4 py-3 font-medium',
                          isDark ? 'text-white/60' : 'text-gray-600'
                        )}
                      >
                        Fee Type
                      </th>
                      <th
                        className={cn(
                          'text-left px-4 py-3 font-medium',
                          isDark ? 'text-white/60' : 'text-gray-600'
                        )}
                      >
                        Amount
                      </th>
                      <th
                        className={cn(
                          'text-left px-4 py-3 font-medium',
                          isDark ? 'text-white/60' : 'text-gray-600'
                        )}
                      >
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      className={
                        isDark
                          ? 'border-t border-[rgba(59,130,246,0.1)]'
                          : 'border-t border-[rgba(59,130,246,0.15)]'
                      }
                    >
                      <td className="px-4 py-3 font-medium">Platform Fee</td>
                      <td className="px-4 py-3 text-primary">5 - 30 XRP</td>
                      <td className={cn('px-4 py-3', isDark ? 'text-white/60' : 'text-gray-600')}>
                        Scales with developer allocation %
                      </td>
                    </tr>
                    <tr
                      className={
                        isDark
                          ? 'border-t border-[rgba(59,130,246,0.1)]'
                          : 'border-t border-[rgba(59,130,246,0.15)]'
                      }
                    >
                      <td className="px-4 py-3 font-medium">Base Reserve</td>
                      <td className="px-4 py-3 text-primary">1 XRP</td>
                      <td className={cn('px-4 py-3', isDark ? 'text-white/60' : 'text-gray-600')}>
                        XRPL account reserve requirement
                      </td>
                    </tr>
                    <tr
                      className={
                        isDark
                          ? 'border-t border-[rgba(59,130,246,0.1)]'
                          : 'border-t border-[rgba(59,130,246,0.15)]'
                      }
                    >
                      <td className="px-4 py-3 font-medium">AMM Pool</td>
                      <td className="px-4 py-3 text-primary">Min 1 XRP</td>
                      <td className={cn('px-4 py-3', isDark ? 'text-white/60' : 'text-gray-600')}>
                        Initial liquidity for AMM pool
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className={cn('rounded-lg p-4', isDark ? 'bg-white/5' : 'bg-gray-50')}>
                <div className="font-medium mb-2 text-[13px]">Typical Total Cost</div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-medium text-primary">10 - 50 XRP</span>
                  <span className={cn('text-[12px]', isDark ? 'text-white/40' : 'text-gray-500')}>
                    depending on configuration
                  </span>
                </div>
              </div>

              <div
                className={cn(
                  'mt-4 space-y-2 text-[13px]',
                  isDark ? 'text-white/60' : 'text-gray-600'
                )}
              >
                <div className="font-medium">What's included:</div>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Token creation and configuration</li>
                  <li>Issuer account setup</li>
                  <li>Trustline creation</li>
                  <li>AMM pool initialization</li>
                  <li>Optional anti-snipe protection</li>
                  <li>Optional developer token allocation (up to 95%)</li>
                </ul>
              </div>
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
                isDark
                  ? 'bg-primary/5 border border-primary/20'
                  : 'bg-primary/5 border border-primary/20'
              )}
            >
              <span className="text-primary font-medium">Identifier:</span>{' '}
              <span className={isDark ? 'text-white/70' : 'text-gray-600'}>
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
                isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-emerald-500/10 text-emerald-500 uppercase tracking-wide">
                  GET
                </span>
                <code className="text-[15px] font-mono">/v1/tokens</code>
              </div>
              <p className={cn('text-[13px] mb-4', isDark ? 'text-white/60' : 'text-gray-600')}>
                List all tokens with filtering and sorting
              </p>
              <div
                className={cn(
                  'rounded-lg overflow-hidden border-[1.5px] mb-4',
                  isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
                )}
              >
                <table className="w-full text-[12px]">
                  <thead className={isDark ? 'bg-white/5' : 'bg-gray-50'}>
                    <tr>
                      <th
                        className={cn(
                          'text-left px-3 py-2 font-medium',
                          isDark ? 'text-white/60' : 'text-gray-600'
                        )}
                      >
                        Param
                      </th>
                      <th
                        className={cn(
                          'text-left px-3 py-2 font-medium',
                          isDark ? 'text-white/60' : 'text-gray-600'
                        )}
                      >
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['start', 'int (default: 0) - Pagination offset'],
                      ['limit', 'int (default: 20, max: 100) - Results per page'],
                      ['sortBy', 'vol24hxrp | marketcap | p24h | trustlines | trendingScore'],
                      ['sortType', 'asc | desc (default: desc)'],
                      ['filter', 'OMCF | AMM | search term'],
                      ['filterNe', 'Negative filter (exclude matches)'],
                      ['tag', 'Filter by single category tag'],
                      ['tags', 'Comma-separated tags for multi-filter'],
                      ['watchlist', 'Comma-separated md5 IDs for watchlist'],
                      ['showNew', 'bool - Include new tokens'],
                      ['showSlug', 'bool - Include slug in response'],
                      ['showDate', 'bool - Include date fields'],
                      ['skipMetrics', 'bool - Skip global metrics for faster response']
                    ].map(([param, desc]) => (
                      <tr
                        key={param}
                        className={
                          isDark
                            ? 'border-t border-[rgba(59,130,246,0.1)]'
                            : 'border-t border-[rgba(59,130,246,0.15)]'
                        }
                      >
                        <td className="px-3 py-2">
                          <code className="text-primary">{param}</code>
                        </td>
                        <td className={cn('px-3 py-2', isDark ? 'text-white/60' : 'text-gray-600')}>
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
                  isDark
                    ? 'bg-[rgba(59,130,246,0.02)]'
                    : 'bg-[rgba(59,130,246,0.02)] border border-[rgba(59,130,246,0.15)]'
                )}
              >
                <pre className="p-3 font-mono text-[12px] overflow-x-auto m-0">
                  <span className="text-emerald-500">GET</span>{' '}
                  /v1/tokens?limit=20&sortBy=vol24hxrp&sortType=desc
                </pre>
              </div>
              <button
                onClick={() => handleTryApi('/v1/tokens?limit=10&sortBy=vol24hxrp')}
                className={cn(
                  'mt-3 flex items-center gap-2 rounded-lg border-[1.5px] px-3 py-1.5 text-[12px] font-medium text-primary',
                  isDark
                    ? 'border-primary/30 bg-primary/5 hover:bg-primary/10'
                    : 'border-primary/30 bg-primary/5 hover:bg-primary/10'
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
                isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-emerald-500/10 text-emerald-500 uppercase tracking-wide">
                  GET
                </span>
                <code className="text-[15px] font-mono">/v1/token/{'{id}'}</code>
              </div>
              <p className={cn('text-[13px] mb-3', isDark ? 'text-white/60' : 'text-gray-600')}>
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
                  isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
                )}
              >
                <table className="w-full text-[12px]">
                  <thead className={isDark ? 'bg-white/5' : 'bg-gray-50'}>
                    <tr>
                      <th
                        className={cn(
                          'text-left px-3 py-2 font-medium',
                          isDark ? 'text-white/60' : 'text-gray-600'
                        )}
                      >
                        Format
                      </th>
                      <th
                        className={cn(
                          'text-left px-3 py-2 font-medium',
                          isDark ? 'text-white/60' : 'text-gray-600'
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
                          isDark
                            ? 'border-t border-[rgba(59,130,246,0.1)]'
                            : 'border-t border-[rgba(59,130,246,0.15)]'
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
                            isDark ? 'text-white/60' : 'text-gray-600'
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
                  isDark
                    ? 'bg-[rgba(59,130,246,0.02)]'
                    : 'bg-[rgba(59,130,246,0.02)] border border-[rgba(59,130,246,0.15)]'
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
                  isDark
                    ? 'border-primary/30 bg-primary/5 hover:bg-primary/10'
                    : 'border-primary/30 bg-primary/5 hover:bg-primary/10'
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
                isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-amber-500/10 text-amber-500 uppercase tracking-wide">
                  POST
                </span>
                <code className="text-[15px] font-mono">/v1/search</code>
              </div>
              <p className={cn('text-[13px] mb-3', isDark ? 'text-white/60' : 'text-gray-600')}>
                Search tokens by name/symbol/issuer
              </p>
              <div
                className={cn(
                  'relative group rounded-lg overflow-hidden',
                  isDark
                    ? 'bg-[rgba(59,130,246,0.02)]'
                    : 'bg-[rgba(59,130,246,0.02)] border border-[rgba(59,130,246,0.15)]'
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
                isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
              )}
            >
              <div
                className={cn(
                  'text-[11px] font-medium uppercase tracking-wide mb-3',
                  isDark ? 'text-white/40' : 'text-gray-500'
                )}
              >
                Other Endpoints
              </div>
              <div className="space-y-2 text-[13px]">
                {[
                  ['GET', '/v1/slugs', 'Get all token slugs'],
                  ['GET', '/v1/tags', 'Get all token tags with counts'],
                  ['GET', '/v1/issuer/{address}', 'Get tokens from same issuer'],
                  [
                    'GET',
                    '/v1/traders/token-traders/{md5}',
                    'Top traders with P&L (sortBy: volume|pnl|trades)'
                  ]
                ].map(([method, path, desc]) => (
                  <div key={path} className="flex items-center gap-3">
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
                    <span className={isDark ? 'text-white/40' : 'text-gray-500'}>- {desc}</span>
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
                isDark
                  ? 'bg-primary/5 border border-primary/20'
                  : 'bg-primary/5 border border-primary/20'
              )}
            >
              <span className="text-primary font-medium">Identifier:</span>{' '}
              <span className={isDark ? 'text-white/70' : 'text-gray-600'}>
                Use <code className="text-primary">md5</code> (32-char hex) to identify tokens in
                chart/holder endpoints.
              </span>
            </div>

            {/* OHLC */}
            <div
              id="ohlc"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-emerald-500/10 text-emerald-500 uppercase tracking-wide">
                  GET
                </span>
                <code className="text-[15px] font-mono">/v1/ohlc/{'{md5}'}</code>
              </div>
              <p className={cn('text-[13px] mb-3', isDark ? 'text-white/60' : 'text-gray-600')}>
                Get OHLC candlestick chart data
              </p>
              <div
                className={cn(
                  'rounded-lg overflow-hidden border-[1.5px] mb-4',
                  isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
                )}
              >
                <table className="w-full text-[12px]">
                  <thead className={isDark ? 'bg-white/5' : 'bg-gray-50'}>
                    <tr>
                      <th
                        className={cn(
                          'text-left px-3 py-2 font-medium',
                          isDark ? 'text-white/60' : 'text-gray-600'
                        )}
                      >
                        Param
                      </th>
                      <th
                        className={cn(
                          'text-left px-3 py-2 font-medium',
                          isDark ? 'text-white/60' : 'text-gray-600'
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
                          isDark
                            ? 'border-t border-[rgba(59,130,246,0.1)]'
                            : 'border-t border-[rgba(59,130,246,0.15)]'
                        }
                      >
                        <td className="px-3 py-2">
                          <code className="text-primary">{param}</code>
                        </td>
                        <td className={cn('px-3 py-2', isDark ? 'text-white/60' : 'text-gray-600')}>
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
                  isDark
                    ? 'bg-[rgba(59,130,246,0.02)]'
                    : 'bg-[rgba(59,130,246,0.02)] border border-[rgba(59,130,246,0.15)]'
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
                isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
              )}
            >
              <div
                className={cn(
                  'text-[11px] font-medium uppercase tracking-wide mb-3',
                  isDark ? 'text-white/40' : 'text-gray-500'
                )}
              >
                Other Endpoints
              </div>
              <div className="space-y-2 text-[13px]">
                {[
                  [
                    'GET',
                    '/v1/sparkline/{md5}',
                    'Sparkline data (period: 24h|7d, lightweight, maxPoints)'
                  ],
                  ['GET', '/v1/holders/list/{md5}', 'Top token holders (start, limit)'],
                  ['GET', '/v1/holders/info/{md5}', 'Holder distribution statistics'],
                  ['GET', '/v1/holders/graph/{md5}', 'Holder distribution graph'],
                  [
                    'GET',
                    '/v1/rsi',
                    'RSI indicators with filtering (all timeframes, market/volume/price filters)'
                  ],
                  ['POST', '/v1/metrics', 'Historical token metrics (body: { md5, range })'],
                  ['GET', '/v1/stats', 'Global platform metrics (30s)'],
                  ['GET', '/v1/news', 'XRPL news with sentiment (Live)'],
                  ['GET', '/v1/news/search?q={query}', 'Search news by title/summary/body']
                ].map(([method, path, desc]) => (
                  <div key={path} className="flex items-center gap-3">
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
                    <span className={isDark ? 'text-white/40' : 'text-gray-500'}>- {desc}</span>
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
                isDark
                  ? 'bg-primary/5 border border-primary/20'
                  : 'bg-primary/5 border border-primary/20'
              )}
            >
              <span className="text-primary font-medium">Identifier:</span>{' '}
              <span className={isDark ? 'text-white/70' : 'text-gray-600'}>
                Use <code className="text-primary">md5</code> for tokens,{' '}
                <code className="text-primary">account</code> (r-address) for wallets.
              </span>
            </div>

            {/* GET /history */}
            <div
              id="history"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-emerald-500/10 text-emerald-500 uppercase tracking-wide">
                  GET
                </span>
                <code className="text-[15px] font-mono">/v1/history</code>
              </div>
              <p className={cn('text-[13px] mb-3', isDark ? 'text-white/60' : 'text-gray-600')}>
                Get trade history for a token
              </p>
              <div
                className={cn(
                  'rounded-lg overflow-hidden border-[1.5px] mb-4',
                  isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
                )}
              >
                <table className="w-full text-[12px]">
                  <thead className={isDark ? 'bg-white/5' : 'bg-gray-50'}>
                    <tr>
                      <th
                        className={cn(
                          'text-left px-3 py-2 font-medium',
                          isDark ? 'text-white/60' : 'text-gray-600'
                        )}
                      >
                        Param
                      </th>
                      <th
                        className={cn(
                          'text-left px-3 py-2 font-medium',
                          isDark ? 'text-white/60' : 'text-gray-600'
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
                      ['page', 'int (default: 0)'],
                      ['limit', 'int (default: 20, max: 5000)'],
                      ['startTime', 'Unix timestamp ms'],
                      ['endTime', 'Unix timestamp ms'],
                      ['xrpOnly', 'bool - Only XRP trades'],
                      ['xrpAmount', 'Minimum XRP amount filter']
                    ].map(([param, desc]) => (
                      <tr
                        key={param}
                        className={
                          isDark
                            ? 'border-t border-[rgba(59,130,246,0.1)]'
                            : 'border-t border-[rgba(59,130,246,0.15)]'
                        }
                      >
                        <td className="px-3 py-2">
                          <code className="text-primary">{param}</code>
                        </td>
                        <td className={cn('px-3 py-2', isDark ? 'text-white/60' : 'text-gray-600')}>
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
                  isDark
                    ? 'bg-[rgba(59,130,246,0.02)]'
                    : 'bg-[rgba(59,130,246,0.02)] border border-[rgba(59,130,246,0.15)]'
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
                isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
              )}
            >
              <div
                className={cn(
                  'text-[11px] font-medium uppercase tracking-wide mb-3',
                  isDark ? 'text-white/40' : 'text-gray-500'
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
                  <div key={path} className="flex items-start gap-3">
                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-500/10 text-emerald-500 shrink-0 mt-0.5">
                      {method}
                    </span>
                    <code className="font-mono text-[12px] shrink-0">{path}</code>
                    <span className={isDark ? 'text-white/40' : 'text-gray-500'}>- {desc}</span>
                  </div>
                ))}
              </div>
              <div
                className={cn(
                  'relative group rounded-lg overflow-hidden mt-3',
                  isDark
                    ? 'bg-[rgba(59,130,246,0.02)]'
                    : 'bg-[rgba(59,130,246,0.02)] border border-[rgba(59,130,246,0.15)]'
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
                isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-amber-500/10 text-amber-500 uppercase tracking-wide">
                  POST
                </span>
                <code className="text-[15px] font-mono">/v1/dex/quote</code>
              </div>
              <p className={cn('text-[13px] mb-3', isDark ? 'text-white/60' : 'text-gray-600')}>
                Get swap quote via ripple_path_find. Supports md5/slug/issuer_currency for tokens.
              </p>
              <div
                className={cn(
                  'rounded-lg overflow-hidden border-[1.5px] mb-3',
                  isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
                )}
              >
                <table className="w-full text-[12px]">
                  <thead className={isDark ? 'bg-white/5' : 'bg-gray-50'}>
                    <tr>
                      <th
                        className={cn(
                          'text-left px-3 py-2 font-medium',
                          isDark ? 'text-white/60' : 'text-gray-600'
                        )}
                      >
                        Body Param
                      </th>
                      <th
                        className={cn(
                          'text-left px-3 py-2 font-medium',
                          isDark ? 'text-white/60' : 'text-gray-600'
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
                          isDark
                            ? 'border-t border-[rgba(59,130,246,0.1)]'
                            : 'border-t border-[rgba(59,130,246,0.15)]'
                        }
                      >
                        <td className="px-3 py-2">
                          <code className="text-primary">{param}</code>
                        </td>
                        <td className={cn('px-3 py-2', isDark ? 'text-white/60' : 'text-gray-600')}>
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
                isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
              )}
            >
              <div
                className={cn(
                  'text-[11px] font-medium uppercase tracking-wide mb-3',
                  isDark ? 'text-white/40' : 'text-gray-500'
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
                  <div key={path} className="flex items-center gap-3">
                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-500/10 text-emerald-500">
                      {method}
                    </span>
                    <code className="font-mono text-[12px]">{path}</code>
                    <span className={isDark ? 'text-white/40' : 'text-gray-500'}>- {desc}</span>
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
                isDark
                  ? 'bg-primary/5 border border-primary/20'
                  : 'bg-primary/5 border border-primary/20'
              )}
            >
              <span className="text-primary font-medium">Identifier:</span>{' '}
              <span className={isDark ? 'text-white/70' : 'text-gray-600'}>
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
                isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
              )}
            >
              <div className="space-y-2 text-[13px]">
                {[
                  ['GET', '/v1/account/balance/{account}', 'Detailed XRP balance with reserves'],
                  ['POST', '/v1/account/balance', 'Batch balances (body: { accounts[] max 100 })'],
                  [
                    'GET',
                    '/v1/account/info/{account}',
                    'Pair balance info (curr1, issuer1, curr2, issuer2)'
                  ],
                  [
                    'GET',
                    '/v1/account/tx/{account}',
                    'Trade history by pair (curr1, issuer1, curr2, issuer2)'
                  ],
                  [
                    'GET',
                    '/v1/account/offers/{account}',
                    'Open DEX offers (pair, page, limit max:50)'
                  ],
                  ['GET', '/v1/traders/{address}', 'Trader profile with stats'],
                  ['GET', '/v1/watchlist?account={account}', 'User watchlist'],
                  ['POST', '/v1/watchlist', 'Add/remove token (body: { account, md5, action })'],
                  [
                    'POST',
                    '/v1/oauth/twitter/oauth1/request',
                    'Twitter OAuth request token (body: { callbackUrl })'
                  ],
                  ['POST', '/v1/oauth/twitter/oauth1/access', 'Twitter OAuth access token']
                ].map(([method, path, desc]) => (
                  <div key={path} className="flex items-center gap-3">
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
                    <span className={isDark ? 'text-white/40' : 'text-gray-500'}>- {desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* tx detail */}
            <div
              id="account-tx"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-emerald-500/10 text-emerald-500 uppercase tracking-wide">
                  GET
                </span>
                <code className="text-[15px] font-mono">/v1/tx/{'{account}'}</code>
              </div>
              <p className={cn('text-[13px] mb-3', isDark ? 'text-white/60' : 'text-gray-600')}>
                Get paginated transaction history (rippled: tx)
              </p>
              <div
                className={cn(
                  'rounded-lg overflow-hidden border-[1.5px]',
                  isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
                )}
              >
                <table className="w-full text-[12px]">
                  <thead className={isDark ? 'bg-white/5' : 'bg-gray-50'}>
                    <tr>
                      <th
                        className={cn(
                          'text-left px-3 py-2 font-medium',
                          isDark ? 'text-white/60' : 'text-gray-600'
                        )}
                      >
                        Param
                      </th>
                      <th
                        className={cn(
                          'text-left px-3 py-2 font-medium',
                          isDark ? 'text-white/60' : 'text-gray-600'
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
                          isDark
                            ? 'border-t border-[rgba(59,130,246,0.1)]'
                            : 'border-t border-[rgba(59,130,246,0.15)]'
                        }
                      >
                        <td className="px-3 py-2">
                          <code className="text-primary">{param}</code>
                        </td>
                        <td className={cn('px-3 py-2', isDark ? 'text-white/60' : 'text-gray-600')}>
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
                isDark
                  ? 'bg-primary/5 border border-primary/20'
                  : 'bg-primary/5 border border-primary/20'
              )}
            >
              <span className="text-primary font-medium">Identifiers:</span>{' '}
              <span className={isDark ? 'text-white/70' : 'text-gray-600'}>
                <code className="text-primary">NFTokenID</code> (64-char hex) for NFTs,{' '}
                <code className="text-primary">slug</code> for collections.
              </span>
            </div>

            {/* NFT endpoints */}
            <div
              id="single-nft"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
              )}
            >
              <div
                className={cn(
                  'text-[11px] font-medium uppercase tracking-wide mb-3',
                  isDark ? 'text-white/40' : 'text-gray-500'
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
                  <div key={path} className="flex items-center gap-3">
                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-500/10 text-emerald-500">
                      {method}
                    </span>
                    <code className="font-mono text-[12px]">{path}</code>
                    <span className={isDark ? 'text-white/40' : 'text-gray-500'}>- {desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              id="collections"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
              )}
            >
              <div
                className={cn(
                  'text-[11px] font-medium uppercase tracking-wide mb-3',
                  isDark ? 'text-white/40' : 'text-gray-500'
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
                  <div key={path} className="flex items-center gap-3">
                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-500/10 text-emerald-500">
                      {method}
                    </span>
                    <code className="font-mono text-[12px]">{path}</code>
                    <span className={isDark ? 'text-white/40' : 'text-gray-500'}>- {desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              id="activity"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
              )}
            >
              <div
                className={cn(
                  'text-[11px] font-medium uppercase tracking-wide mb-3',
                  isDark ? 'text-white/40' : 'text-gray-500'
                )}
              >
                Activity & Traders
              </div>
              <div className="space-y-2 text-[13px]">
                {[
                  ['GET', '/v1/nft/activity', 'Recent NFT activity'],
                  ['GET', '/v1/nft/history', 'NFT transaction history'],
                  [
                    'GET',
                    '/v1/nft/traders/active',
                    'Active traders (sortBy: balance|buyVolume|sellVolume|totalVolume)'
                  ],
                  ['GET', '/v1/nft/traders/{account}/volume', 'Trader volume stats'],
                  ['GET', '/v1/nft/accounts/{address}/nfts', 'NFTs owned by account (limit, skip)'],
                  ['GET', '/v1/nft/stats/global', 'Global NFT stats'],
                  ['GET', '/v1/nft/brokers/stats', 'Broker fees and volumes'],
                  ['POST', '/v1/nft/mint', 'Create NFT mint transaction payload'],
                  ['POST', '/v1/nft/pin', 'Pin NFT metadata to IPFS'],
                  ['GET', '/v1/nft/pin/status/{hash}', 'Get IPFS pin status']
                ].map(([method, path, desc]) => (
                  <div key={path} className="flex items-center gap-3">
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
                    <span className={isDark ? 'text-white/40' : 'text-gray-500'}>- {desc}</span>
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
                isDark
                  ? 'bg-primary/5 border border-primary/20'
                  : 'bg-primary/5 border border-primary/20'
              )}
            >
              <span className="text-primary font-medium">Identifiers:</span>{' '}
              <span className={isDark ? 'text-white/70' : 'text-gray-600'}>
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
                isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-emerald-500/10 text-emerald-500 uppercase tracking-wide">
                  GET
                </span>
                <code className="text-[15px] font-mono">/v1/orderbook</code>
              </div>
              <p className={cn('text-[13px] mb-3', isDark ? 'text-white/60' : 'text-gray-600')}>
                Live orderbook (rippled: book_offers). Supports{' '}
                <span className="text-primary">md5/slug/issuer_currency</span> for tokens.
              </p>
              <div
                className={cn(
                  'rounded-lg overflow-hidden border-[1.5px] mb-4',
                  isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
                )}
              >
                <table className="w-full text-[12px]">
                  <thead className={isDark ? 'bg-white/5' : 'bg-gray-50'}>
                    <tr>
                      <th
                        className={cn(
                          'text-left px-3 py-2 font-medium',
                          isDark ? 'text-white/60' : 'text-gray-600'
                        )}
                      >
                        Param
                      </th>
                      <th
                        className={cn(
                          'text-left px-3 py-2 font-medium',
                          isDark ? 'text-white/60' : 'text-gray-600'
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
                          isDark
                            ? 'border-t border-[rgba(59,130,246,0.1)]'
                            : 'border-t border-[rgba(59,130,246,0.15)]'
                        }
                      >
                        <td className="px-3 py-2">
                          <code
                            className={param === 'base' || param === 'quote' ? 'text-primary' : ''}
                          >
                            {param}
                          </code>
                        </td>
                        <td className={cn('px-3 py-2', isDark ? 'text-white/60' : 'text-gray-600')}>
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
                  isDark
                    ? 'bg-[rgba(59,130,246,0.02)]'
                    : 'bg-[rgba(59,130,246,0.02)] border border-[rgba(59,130,246,0.15)]'
                )}
              >
                <pre className="p-3 font-mono text-[11px] overflow-x-auto m-0">
                  <span className={isDark ? 'text-white/40' : 'text-gray-500'}>
                    # Using md5 (recommended)
                  </span>
                  {'\n'}
                  <span className="text-emerald-500">GET</span>{' '}
                  /v1/orderbook?base=XRP&quote=0413ca7cfc258dfaf698c02fe304e607{'\n'}
                  <span className={isDark ? 'text-white/40' : 'text-gray-500'}>
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
                isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
              )}
            >
              <div
                className={cn(
                  'text-[11px] font-medium uppercase tracking-wide mb-3',
                  isDark ? 'text-white/40' : 'text-gray-500'
                )}
              >
                Other Endpoints
              </div>
              <div className="space-y-2 text-[13px]">
                {[
                  ['GET', '/v1/tx/{hash}', 'Transaction by hash (rippled: tx)'],
                  ['POST', '/v1/pathfinding/pathfind', 'Find payment paths'],
                  ['POST', '/v1/pathfinding/ripplepathfind', 'Ripple path find']
                ].map(([method, path, desc]) => (
                  <div key={path} className="flex items-center gap-3">
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
                    <span className={isDark ? 'text-white/40' : 'text-gray-500'}>- {desc}</span>
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
                isDark
                  ? 'bg-primary/5 border border-primary/20'
                  : 'bg-primary/5 border border-primary/20'
              )}
            >
              <span className="text-primary font-medium">Identifiers:</span>{' '}
              <span className={isDark ? 'text-white/70' : 'text-gray-600'}>
                Use <code className="text-primary">md5</code> for tokens,{' '}
                <code className="text-primary">address</code> (r-address) for traders.
              </span>
            </div>

            <div
              id="analytics-endpoints"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
              )}
            >
              <div className="space-y-2 text-[13px]">
                {[
                  ['GET', '/v1/analytics/token/{md5}', 'Token analytics (OMCF)'],
                  [
                    'GET',
                    '/v1/analytics/trader/{address}/{md5}',
                    'Trader metrics for specific token'
                  ],
                  [
                    'GET',
                    '/v1/traders/token-traders/{md5}',
                    'Top traders (sortBy: pnl|trades|volume)'
                  ],
                  ['GET', '/v1/analytics/trader-stats/{address}', 'Cumulative trader stats'],
                  ['GET', '/v1/analytics/cumulative-stats', 'All traders (Live)'],
                  [
                    'GET',
                    '/v1/analytics/market-metrics',
                    'Daily market metrics (startDate required)'
                  ],
                  ['GET', '/v1/analytics/trader/{address}/volume-history', 'Volume chart data'],
                  ['GET', '/v1/analytics/trader/{address}/trade-history', 'Trade count history'],
                  ['GET', '/v1/analytics/trader/{address}/roi-history', 'ROI history']
                ].map(([method, path, desc]) => (
                  <div key={path} className="flex items-center gap-3">
                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-500/10 text-emerald-500">
                      {method}
                    </span>
                    <code className="font-mono text-[12px]">{path}</code>
                    <span className={isDark ? 'text-white/40' : 'text-gray-500'}>- {desc}</span>
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
                isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-amber-500/10 text-amber-500 uppercase tracking-wide">
                  POST
                </span>
                <code className="text-[15px] font-mono">/v1/launch-token</code>
              </div>
              <p className={cn('text-[13px] mb-3', isDark ? 'text-white/60' : 'text-gray-600')}>
                Initialize token launch with optional anti-snipe mode
              </p>
              <div
                className={cn(
                  'rounded-lg overflow-hidden border-[1.5px] mb-4',
                  isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
                )}
              >
                <table className="w-full text-[12px]">
                  <thead className={isDark ? 'bg-white/5' : 'bg-gray-50'}>
                    <tr>
                      <th
                        className={cn(
                          'text-left px-3 py-2 font-medium',
                          isDark ? 'text-white/60' : 'text-gray-600'
                        )}
                      >
                        Body Param
                      </th>
                      <th
                        className={cn(
                          'text-left px-3 py-2 font-medium',
                          isDark ? 'text-white/60' : 'text-gray-600'
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
                      ['telegram', 'Telegram link'],
                      ['twitter', 'Twitter handle'],
                      ['imageData', 'Base64 token image']
                    ].map(([param, desc]) => (
                      <tr
                        key={param}
                        className={
                          isDark
                            ? 'border-t border-[rgba(59,130,246,0.1)]'
                            : 'border-t border-[rgba(59,130,246,0.15)]'
                        }
                      >
                        <td className="px-3 py-2">
                          <code className="text-primary">{param}</code>
                        </td>
                        <td className={cn('px-3 py-2', isDark ? 'text-white/60' : 'text-gray-600')}>
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
                  isDark ? 'bg-white/5' : 'bg-gray-50'
                )}
              >
                <div className="font-medium mb-2">Costs</div>
                <div className={cn('space-y-1', isDark ? 'text-white/60' : 'text-gray-600')}>
                  <div>
                    Platform fee: <span className="text-primary">5-30 XRP</span> (0-30% dev → 5-20
                    XRP, 30-95% dev → 20-30 XRP)
                  </div>
                  <div>
                    Base reserve: <span className="text-primary">1 XRP</span>, Owner reserve:{' '}
                    <span className="text-primary">0.2 XRP</span>/object
                  </div>
                  <div>
                    Breakdown: issuer(1) + fee(5-30) + holder(1) + AMM liquidity + tx fees(~1.8)
                  </div>
                  <div className="mt-2">
                    Typical total: <span className="text-primary font-medium">10-50 XRP</span>
                  </div>
                </div>
              </div>
              <div
                className={cn(
                  'mt-3 p-3 rounded-lg text-[12px]',
                  isDark ? 'bg-white/5' : 'bg-gray-50'
                )}
              >
                <div className="font-medium mb-2">Status Flow</div>
                <div
                  className={cn(
                    'font-mono text-[10px] leading-relaxed',
                    isDark ? 'text-white/60' : 'text-gray-600'
                  )}
                >
                  initializing → awaiting_funding → partial_funding → funded → configuring_issuer →
                  registering_token → creating_trustline → sending_tokens → creating_checks →
                  creating_amm → scheduling_blackhole → success/completed
                </div>
              </div>
              <div
                className={cn(
                  'mt-3 p-3 rounded-lg text-[12px]',
                  isDark ? 'bg-white/5' : 'bg-gray-50'
                )}
              >
                <div className="font-medium mb-2">Anti-Snipe Mode</div>
                <div className={cn('space-y-1', isDark ? 'text-white/60' : 'text-gray-600')}>
                  <div>Enables RequireAuth flag preventing unauthorized trustlines</div>
                  <div>250 pre-created tickets (XRPL max) for fast parallel authorization</div>
                  <div>5-minute auth window after AMM created</div>
                  <div>After window: RequireAuth removed → issuer blackholed</div>
                </div>
              </div>
              <div
                className={cn(
                  'mt-3 p-3 rounded-lg text-[12px]',
                  isDark ? 'bg-white/5' : 'bg-gray-50'
                )}
              >
                <div className="font-medium mb-2">Final State</div>
                <div className={isDark ? 'text-white/60' : 'text-gray-600'}>
                  Issuer: ~1 XRP locked (blackholed) | Holder: ~1.4 XRP locked (base + LP token
                  reserve, blackholed)
                </div>
              </div>
            </div>

            {/* Other launch endpoints */}
            <div
              id="other-launch"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
              )}
            >
              <div
                className={cn(
                  'text-[11px] font-medium uppercase tracking-wide mb-3',
                  isDark ? 'text-white/40' : 'text-gray-500'
                )}
              >
                Other Endpoints
              </div>
              <div className="space-y-2 text-[13px]">
                {[
                  [
                    'GET',
                    '/v1/launch-token/status/{sessionId}',
                    'Poll status (every 3s recommended)'
                  ],
                  [
                    'DELETE',
                    '/v1/launch-token/{sessionId}',
                    'Cancel and refund (allowed before creating_amm)'
                  ],
                  ['POST', '/v1/launch-token/{sessionId}/cancel', 'Cancel alternative'],
                  [
                    'POST',
                    '/v1/launch-token/authorize',
                    'Request trustline auth (anti-snipe: issuer, currency, account)'
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
                    'Calculate XRP required (ticketCount, antiSnipeMode)'
                  ]
                ].map(([method, path, desc]) => (
                  <div key={path} className="flex items-center gap-3">
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
                    <span className={isDark ? 'text-white/40' : 'text-gray-500'}>- {desc}</span>
                  </div>
                ))}
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
                isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
              )}
            >
              <div className="space-y-2 text-[13px]">
                {[
                  ['GET', '/v1/health', 'API health check (returns "success")'],
                  ['GET', '/v1/testnet/{address}', 'Get XRP balance on testnet'],
                  [
                    'GET',
                    '/v1/integrations/xrpnft/tokens',
                    'Get tokens in XRPNFT format (filter param)'
                  ],
                  [
                    'GET',
                    '/v1/integrations/xrpnft/filter-by-account/{account}',
                    'Get NFTs owned by account (XRPNFT format)'
                  ]
                ].map(([method, path, desc]) => (
                  <div key={path} className="flex items-center gap-3">
                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-500/10 text-emerald-500">
                      {method}
                    </span>
                    <code className="font-mono text-[12px]">{path}</code>
                    <span className={isDark ? 'text-white/40' : 'text-gray-500'}>- {desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'bridge':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-normal text-primary">Bridge</h2>
            <p className={cn('text-[14px]', isDark ? 'text-white/60' : 'text-gray-600')}>
              Cross-chain currency exchange endpoints for converting between XRP and other currencies.
            </p>
            <div
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
              )}
            >
              <div className="space-y-2 text-[13px]">
                {docs.bridge.map((ep) => (
                  <div key={ep.path} className="flex items-center gap-3">
                    <span
                      className={cn(
                        'px-1.5 py-0.5 text-[10px] font-medium rounded',
                        ep.method === 'GET' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                      )}
                    >
                      {ep.method}
                    </span>
                    <code className="font-mono text-[12px]">/v1{ep.path}</code>
                    <span className={isDark ? 'text-white/40' : 'text-gray-500'}>- {ep.desc}</span>
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
            <p className={cn('text-[14px]', isDark ? 'text-white/60' : 'text-gray-600')}>
              Request and manage verification badges for tokens and NFT collections.
            </p>
            <div
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
              )}
            >
              <div className="space-y-2 text-[13px]">
                {docs.verify.map((ep) => (
                  <div key={ep.path} className="flex items-center gap-3">
                    <span
                      className={cn(
                        'px-1.5 py-0.5 text-[10px] font-medium rounded',
                        ep.method === 'GET' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                      )}
                    >
                      {ep.method}
                    </span>
                    <code className="font-mono text-[12px]">/v1{ep.path}</code>
                    <span className={isDark ? 'text-white/40' : 'text-gray-500'}>- {ep.desc}</span>
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
            <p className={cn('text-[14px]', isDark ? 'text-white/60' : 'text-gray-600')}>
              Boost token visibility and ranking with promotional placements.
            </p>
            <div
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
              )}
            >
              <div className="space-y-2 text-[13px]">
                {docs.boost.map((ep) => (
                  <div key={ep.path} className="flex items-center gap-3">
                    <span
                      className={cn(
                        'px-1.5 py-0.5 text-[10px] font-medium rounded',
                        ep.method === 'GET' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                      )}
                    >
                      {ep.method}
                    </span>
                    <code className="font-mono text-[12px]">/v1{ep.path}</code>
                    <span className={isDark ? 'text-white/40' : 'text-gray-500'}>- {ep.desc}</span>
                  </div>
                ))}
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
                isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
              )}
            >
              <div
                className={cn(
                  'text-[11px] font-medium uppercase tracking-wide mb-3',
                  isDark ? 'text-white/40' : 'text-gray-500'
                )}
              >
                Token Identifiers
              </div>
              <div className="space-y-2 text-[13px]">
                <div>
                  <code className="text-primary">md5</code>{' '}
                  <span className={isDark ? 'text-white/60' : 'text-gray-600'}>
                    - 32-char hex, e.g., 0413ca7cfc258dfaf698c02fe304e607
                  </span>
                </div>
                <div>
                  <code className="text-primary">slug</code>{' '}
                  <span className={isDark ? 'text-white/60' : 'text-gray-600'}>
                    - issuer-currencyHex, e.g., rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz-534F4C4F00...
                  </span>
                </div>
                <div>
                  <code className="text-primary">issuer_currency</code>{' '}
                  <span className={isDark ? 'text-white/60' : 'text-gray-600'}>
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
                isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
              )}
            >
              <div
                className={cn(
                  'text-[11px] font-medium uppercase tracking-wide mb-3',
                  isDark ? 'text-white/40' : 'text-gray-500'
                )}
              >
                MD5 Generation
              </div>
              <div
                className={cn(
                  'rounded-lg p-3 font-mono text-[12px]',
                  isDark ? 'bg-black/40' : 'bg-gray-50'
                )}
              >
                <div className={isDark ? 'text-white/60' : 'text-gray-600'}>// Input</div>
                <div>
                  rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz_534F4C4F00000000000000000000000000000000
                </div>
                <div className={cn('mt-2', isDark ? 'text-white/60' : 'text-gray-600')}>
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
                isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
              )}
            >
              <div
                className={cn(
                  'text-[11px] font-medium uppercase tracking-wide mb-3',
                  isDark ? 'text-white/40' : 'text-gray-500'
                )}
              >
                Currency Hex (codes {'>'}3 chars)
              </div>
              <div
                className={cn(
                  'rounded-lg p-3 font-mono text-[12px]',
                  isDark ? 'bg-black/40' : 'bg-gray-50'
                )}
              >
                <div>
                  SOLO ={' '}
                  <span className="text-primary">534F4C4F00000000000000000000000000000000</span>
                </div>
                <div className={cn('mt-2 text-[11px]', isDark ? 'text-white/40' : 'text-gray-500')}>
                  Buffer.from('SOLO').toString('hex').toUpperCase().padEnd(40, '0')
                </div>
              </div>
            </div>

            {/* Patterns */}
            <div
              id="patterns"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
              )}
            >
              <div
                className={cn(
                  'text-[11px] font-medium uppercase tracking-wide mb-3',
                  isDark ? 'text-white/40' : 'text-gray-500'
                )}
              >
                Regex Patterns
              </div>
              <div className="space-y-2 text-[12px] font-mono">
                {Object.entries(docs.patterns).map(([key, pattern]) => (
                  <div key={key}>
                    <span className="text-primary">{key}:</span>{' '}
                    <span className={isDark ? 'text-white/60' : 'text-gray-600'}>{pattern}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Caching */}
            <div
              id="caching"
              className={cn(
                'rounded-xl border-[1.5px] p-5',
                isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
              )}
            >
              <div
                className={cn(
                  'text-[11px] font-medium uppercase tracking-wide mb-3',
                  isDark ? 'text-white/40' : 'text-gray-500'
                )}
              >
                Caching
              </div>
              <div className="space-y-2 text-[12px]">
                {Object.entries(docs.caching).map(([key, value]) => (
                  <div key={key}>
                    <span className="text-primary font-medium">{key}:</span>{' '}
                    <span className={isDark ? 'text-white/60' : 'text-gray-600'}>{value}</span>
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
              <p className={cn('text-[14px] mb-4', isDark ? 'text-white/60' : 'text-gray-600')}>
                Authenticate your requests with API keys for higher rate limits and usage tracking.
              </p>
              <a
                href="/dashboard"
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg border-[1.5px] px-4 py-2 text-[13px] font-medium transition-colors',
                  isDark
                    ? 'border-primary/50 bg-primary/10 text-primary hover:bg-primary/20'
                    : 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
                )}
              >
                <Key size={14} />
                Manage Your API Keys
                <ExternalLink size={12} className="opacity-60" />
              </a>
            </div>

            <div id="create-key" className="space-y-4">
              <h3 className={cn('text-lg font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                Create API Key
              </h3>
              <p className={cn('text-[13px]', isDark ? 'text-white/60' : 'text-gray-600')}>
                Create a free API key to get started. Requires JWT authentication.
              </p>
              <div
                className={cn(
                  'rounded-xl border-[1.5px] overflow-hidden',
                  isDark
                    ? 'border-[rgba(59,130,246,0.1)] bg-[rgba(59,130,246,0.02)]'
                    : 'border-[rgba(59,130,246,0.15)] bg-[rgba(59,130,246,0.02)]'
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-between px-4 py-2 border-b',
                    isDark
                      ? 'border-[rgba(59,130,246,0.1)] bg-[rgba(59,130,246,0.05)]'
                      : 'border-[rgba(59,130,246,0.15)] bg-[rgba(59,130,246,0.04)]'
                  )}
                >
                  <span
                    className={cn(
                      'text-[11px] font-medium uppercase tracking-wide',
                      isDark ? 'text-white/40' : 'text-gray-500'
                    )}
                  >
                    POST /v1/keys
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `const response = await fetch('https://api.xrpl.to/v1/keys', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${jwt}\`,
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
                    isDark ? 'text-white/80' : 'text-gray-800'
                  )}
                >
                  {`const response = await fetch('https://api.xrpl.to/v1/keys', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${jwt}\`,
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
              <h3 className={cn('text-lg font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                Using API Keys
              </h3>
              <div className="grid gap-4">
                <div
                  className={cn(
                    'rounded-xl border-[1.5px] p-4',
                    isDark
                      ? 'border-[rgba(59,130,246,0.1)] bg-[rgba(59,130,246,0.02)]'
                      : 'border-[rgba(59,130,246,0.15)] bg-[rgba(59,130,246,0.02)]'
                  )}
                >
                  <div
                    className={cn(
                      'text-[11px] font-medium uppercase tracking-wide mb-3',
                      isDark ? 'text-white/40' : 'text-gray-500'
                    )}
                  >
                    Header (Recommended)
                  </div>
                  <code
                    className={cn(
                      'text-[13px] font-mono',
                      isDark ? 'text-white/80' : 'text-gray-800'
                    )}
                  >
                    X-API-Key: xrpl_abc123...
                  </code>
                </div>
                <div
                  className={cn(
                    'rounded-xl border-[1.5px] p-4',
                    isDark
                      ? 'border-[rgba(59,130,246,0.1)] bg-[rgba(59,130,246,0.02)]'
                      : 'border-[rgba(59,130,246,0.15)] bg-[rgba(59,130,246,0.02)]'
                  )}
                >
                  <div
                    className={cn(
                      'text-[11px] font-medium uppercase tracking-wide mb-3',
                      isDark ? 'text-white/40' : 'text-gray-500'
                    )}
                  >
                    Query Parameter
                  </div>
                  <code
                    className={cn(
                      'text-[13px] font-mono',
                      isDark ? 'text-white/80' : 'text-gray-800'
                    )}
                  >
                    ?apiKey=xrpl_abc123...
                  </code>
                </div>
                <div
                  className={cn(
                    'rounded-xl border-[1.5px] p-4',
                    isDark
                      ? 'border-[rgba(59,130,246,0.1)] bg-[rgba(59,130,246,0.02)]'
                      : 'border-[rgba(59,130,246,0.15)] bg-[rgba(59,130,246,0.02)]'
                  )}
                >
                  <div
                    className={cn(
                      'text-[11px] font-medium uppercase tracking-wide mb-3',
                      isDark ? 'text-white/40' : 'text-gray-500'
                    )}
                  >
                    WebSocket
                  </div>
                  <code
                    className={cn(
                      'text-[13px] font-mono',
                      isDark ? 'text-white/80' : 'text-gray-800'
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
              <p className={cn('text-[14px] mb-4', isDark ? 'text-white/60' : 'text-gray-600')}>
                Pay with XRP or credit card. Yearly billing saves 2 months (16.7% off).
              </p>
              <a
                href="/dashboard"
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg border-[1.5px] px-4 py-2 text-[13px] font-medium transition-colors',
                  isDark
                    ? 'border-primary/50 bg-primary/10 text-primary hover:bg-primary/20'
                    : 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
                )}
              >
                <CreditCard size={14} />
                Manage Subscription
                <ExternalLink size={12} className="opacity-60" />
              </a>
            </div>

            <div id="pricing" className="space-y-4">
              <h3 className={cn('text-lg font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                Subscription Tiers
              </h3>
              <div
                className={cn(
                  'rounded-xl border-[1.5px] overflow-hidden',
                  isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
                )}
              >
                <table className="w-full text-[13px]">
                  <thead className={isDark ? 'bg-white/5' : 'bg-gray-50'}>
                    <tr>
                      <th className={cn('text-left px-4 py-3 font-medium', isDark ? 'text-white/60' : 'text-gray-600')}>
                        Tier
                      </th>
                      <th className={cn('text-left px-4 py-3 font-medium', isDark ? 'text-white/60' : 'text-gray-600')}>
                        Price
                      </th>
                      <th className={cn('text-left px-4 py-3 font-medium', isDark ? 'text-white/60' : 'text-gray-600')}>
                        Credits
                      </th>
                      <th className={cn('text-left px-4 py-3 font-medium', isDark ? 'text-white/60' : 'text-gray-600')}>
                        Rate Limit
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {docs.tiers.map((row) => (
                      <tr
                        key={row.name}
                        className={isDark ? 'border-t border-[rgba(59,130,246,0.1)]' : 'border-t border-[rgba(59,130,246,0.15)]'}
                      >
                        <td className={cn('px-4 py-3 font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                          {row.name}
                        </td>
                        <td className={cn('px-4 py-3', isDark ? 'text-white/60' : 'text-gray-600')}>
                          {row.price}
                        </td>
                        <td className={cn('px-4 py-3', isDark ? 'text-white/60' : 'text-gray-600')}>
                          {row.credits}
                        </td>
                        <td className={cn('px-4 py-3', isDark ? 'text-white/60' : 'text-gray-600')}>
                          {row.rate}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div id="credits" className="space-y-4">
              <h3 className={cn('text-lg font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                Credit Packs (One-time, Never Expire)
              </h3>
              <div
                className={cn(
                  'rounded-xl border-[1.5px] overflow-hidden',
                  isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
                )}
              >
                <table className="w-full text-[13px]">
                  <thead className={isDark ? 'bg-white/5' : 'bg-gray-50'}>
                    <tr>
                      <th
                        className={cn(
                          'text-left px-4 py-3 font-medium',
                          isDark ? 'text-white/60' : 'text-gray-600'
                        )}
                      >
                        Pack
                      </th>
                      <th
                        className={cn(
                          'text-left px-4 py-3 font-medium',
                          isDark ? 'text-white/60' : 'text-gray-600'
                        )}
                      >
                        Price
                      </th>
                      <th
                        className={cn(
                          'text-left px-4 py-3 font-medium',
                          isDark ? 'text-white/60' : 'text-gray-600'
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
                          isDark
                            ? 'border-t border-[rgba(59,130,246,0.1)]'
                            : 'border-t border-[rgba(59,130,246,0.15)]'
                        }
                      >
                        <td
                          className={cn(
                            'px-4 py-3 font-medium',
                            isDark ? 'text-white' : 'text-gray-900'
                          )}
                        >
                          {row.pack}
                        </td>
                        <td className={cn('px-4 py-3', isDark ? 'text-white/60' : 'text-gray-600')}>
                          {row.price}
                        </td>
                        <td className={cn('px-4 py-3', isDark ? 'text-white/60' : 'text-gray-600')}>
                          {row.credits}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div id="xrp-payment" className="space-y-4">
              <h3 className={cn('text-lg font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                Pay with XRP
              </h3>
              <div
                className={cn(
                  'rounded-xl border-[1.5px] overflow-hidden',
                  isDark
                    ? 'border-[rgba(59,130,246,0.1)] bg-[rgba(59,130,246,0.02)]'
                    : 'border-[rgba(59,130,246,0.15)] bg-[rgba(59,130,246,0.02)]'
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-between px-4 py-2 border-b',
                    isDark
                      ? 'border-[rgba(59,130,246,0.1)] bg-[rgba(59,130,246,0.05)]'
                      : 'border-[rgba(59,130,246,0.15)] bg-[rgba(59,130,246,0.04)]'
                  )}
                >
                  <span
                    className={cn(
                      'text-[11px] font-medium uppercase tracking-wide',
                      isDark ? 'text-white/40' : 'text-gray-500'
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
                    isDark ? 'text-white/80' : 'text-gray-800'
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
              <h3 className={cn('text-lg font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                Pay with Card (Stripe)
              </h3>
              <div
                className={cn(
                  'rounded-xl border-[1.5px] overflow-hidden',
                  isDark
                    ? 'border-[rgba(59,130,246,0.1)] bg-[rgba(59,130,246,0.02)]'
                    : 'border-[rgba(59,130,246,0.15)] bg-[rgba(59,130,246,0.02)]'
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-between px-4 py-2 border-b',
                    isDark
                      ? 'border-[rgba(59,130,246,0.1)] bg-[rgba(59,130,246,0.05)]'
                      : 'border-[rgba(59,130,246,0.15)] bg-[rgba(59,130,246,0.04)]'
                  )}
                >
                  <span
                    className={cn(
                      'text-[11px] font-medium uppercase tracking-wide',
                      isDark ? 'text-white/40' : 'text-gray-500'
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
                    isDark ? 'text-white/80' : 'text-gray-800'
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
              <h3 className={cn('text-lg font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                Billing Cycle
              </h3>
              <div
                className={cn(
                  'rounded-xl border-[1.5px] overflow-hidden',
                  isDark
                    ? 'border-[rgba(59,130,246,0.1)] bg-[rgba(59,130,246,0.02)]'
                    : 'border-[rgba(59,130,246,0.15)] bg-[rgba(59,130,246,0.02)]'
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-between px-4 py-2 border-b',
                    isDark
                      ? 'border-[rgba(59,130,246,0.1)] bg-[rgba(59,130,246,0.05)]'
                      : 'border-[rgba(59,130,246,0.15)] bg-[rgba(59,130,246,0.04)]'
                  )}
                >
                  <span
                    className={cn(
                      'text-[11px] font-medium uppercase tracking-wide',
                      isDark ? 'text-white/40' : 'text-gray-500'
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
                    isDark ? 'text-white/80' : 'text-gray-800'
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

      case 'errors':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-normal text-primary">Error Codes</h2>
            <div
              id="error-codes"
              className={cn(
                'rounded-xl border-[1.5px] overflow-hidden',
                isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
              )}
            >
              <table className="w-full text-[13px]">
                <thead className={isDark ? 'bg-white/5' : 'bg-gray-50'}>
                  <tr>
                    <th
                      className={cn(
                        'text-left px-4 py-3 font-medium',
                        isDark ? 'text-white/60' : 'text-gray-600'
                      )}
                    >
                      Code
                    </th>
                    <th
                      className={cn(
                        'text-left px-4 py-3 font-medium',
                        isDark ? 'text-white/60' : 'text-gray-600'
                      )}
                    >
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { code: '200', desc: 'Success', color: 'text-emerald-500' },
                    { code: '400', desc: 'Bad Request', color: 'text-amber-500' },
                    { code: '404', desc: 'Not Found', color: 'text-amber-500' },
                    { code: '429', desc: 'Too Many Requests', color: 'text-amber-500' },
                    { code: '500', desc: 'Internal Server Error', color: 'text-red-500' }
                  ].map((err) => (
                    <tr
                      key={err.code}
                      className={
                        isDark
                          ? 'border-t border-[rgba(59,130,246,0.1)]'
                          : 'border-t border-[rgba(59,130,246,0.15)]'
                      }
                    >
                      <td className="px-4 py-3">
                        <code className={cn('font-mono', err.color)}>{err.code}</code>
                      </td>
                      <td className={cn('px-4 py-3', isDark ? 'text-white/60' : 'text-gray-600')}>
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

      <div className={cn('min-h-screen', isDark ? 'bg-black' : 'bg-white')}>
        <div className="flex">
          {/* Mobile menu button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={cn(
              'md:hidden fixed top-20 right-4 z-50 p-2 rounded-lg',
              isDark
                ? 'bg-[rgba(59,130,246,0.02)] border border-[rgba(59,130,246,0.1)]'
                : 'bg-[rgba(59,130,246,0.02)] border border-[rgba(59,130,246,0.15)]'
            )}
          >
            {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* Sidebar */}
          <div
            className={cn(
              'w-[240px] border-r overflow-y-auto transition-all duration-300 pt-16',
              'fixed md:sticky top-0 h-screen z-40',
              isDark
                ? 'bg-[rgba(59,130,246,0.01)] border-[rgba(59,130,246,0.08)]'
                : 'bg-[rgba(59,130,246,0.02)] border-[rgba(59,130,246,0.15)]',
              isSidebarOpen ? 'block' : 'hidden md:block'
            )}
          >
            <div className="p-4">
              {/* Search */}
              <div className="relative mb-5">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
                <input
                  type="text"
                  placeholder="Search... ⌘K"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={cn(
                    'w-full pl-9 pr-3 py-2 rounded-lg border-[1.5px] text-[13px]',
                    isDark
                      ? 'bg-[rgba(59,130,246,0.02)] border-[rgba(59,130,246,0.1)] placeholder:text-white/30'
                      : 'bg-[rgba(59,130,246,0.02)] border-[rgba(59,130,246,0.15)]'
                  )}
                />
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
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px]',
                    currentSection === 'overview'
                      ? 'text-primary bg-primary/10'
                      : isDark
                        ? 'text-white/70 hover:text-white hover:bg-white/5'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  <FileText size={14} className="opacity-60" />
                  Documentation
                </a>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentSection('endpoint-reference');
                  }}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px]',
                    currentSection === 'endpoint-reference'
                      ? 'text-primary bg-primary/10'
                      : isDark
                        ? 'text-white/70 hover:text-white hover:bg-white/5'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  <Code size={14} className="opacity-60" />
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
                          'w-full flex items-center justify-between text-[11px] font-medium uppercase tracking-wide mb-2 px-1',
                          isDark
                            ? 'text-white/40 hover:text-white/60'
                            : 'text-gray-500 hover:text-gray-700'
                        )}
                      >
                        {group.name}
                        <ChevronDown
                          size={12}
                          className={cn(
                            'transition-transform',
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
                                  'w-full text-left px-3 py-2 rounded-lg text-[13px] flex items-center gap-2.5 transition-colors',
                                  isActive
                                    ? 'text-primary bg-primary/10'
                                    : isDark
                                      ? 'text-white/60 hover:text-white hover:bg-white/5'
                                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                )}
                              >
                                <Icon
                                  size={14}
                                  className={isActive ? 'text-primary' : 'opacity-40'}
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
                  'mt-6 pt-6 border-t',
                  isDark ? 'border-[rgba(59,130,246,0.1)]' : 'border-[rgba(59,130,246,0.15)]'
                )}
              >
                <div
                  className={cn(
                    'text-[11px] font-medium uppercase tracking-wide mb-3 px-1',
                    isDark ? 'text-white/40' : 'text-gray-500'
                  )}
                >
                  Support
                </div>
                <div className="space-y-1">
                  <a
                    href="https://x.com/xrplto"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px]',
                      isDark
                        ? 'text-white/60 hover:text-white hover:bg-white/5'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    )}
                  >
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 opacity-60" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    @xrplto
                    <ExternalLink size={10} className="ml-auto opacity-40" />
                  </a>
                  <a
                    href="mailto:hello@xrpl.to"
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px]',
                      isDark
                        ? 'text-white/60 hover:text-white hover:bg-white/5'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    )}
                  >
                    <Mail size={14} className="opacity-60" />
                    hello@xrpl.to
                  </a>
                  <a
                    href="https://discord.gg/RmjPmVcMeY"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px]',
                      isDark
                        ? 'text-white/60 hover:text-white hover:bg-white/5'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    )}
                  >
                    <MessageCircle size={14} className="opacity-60" />
                    Discord
                    <ExternalLink size={10} className="ml-auto opacity-40" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-h-screen">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-8">
              {/* Copy page button */}
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => copyToClipboard(window.location.href, 'page-url')}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px]',
                    isDark
                      ? 'text-white/50 hover:text-white/70 hover:bg-white/5'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  )}
                >
                  {copiedBlock === 'page-url' ? (
                    <>
                      <CheckCircle size={12} /> Copied
                    </>
                  ) : (
                    <>
                      <Copy size={12} /> Copy page
                    </>
                  )}
                </button>
              </div>
              {renderContent()}
            </div>
          </div>

          {/* On this page - Right sidebar (desktop only) */}
          <div
            className={cn(
              'hidden xl:block w-[200px] pt-20 pr-4',
              isDark ? 'border-white/[0.05]' : 'border-gray-100'
            )}
          >
            <div className="sticky top-20">
              <div
                className={cn(
                  'text-[11px] font-medium uppercase tracking-wide mb-3',
                  isDark ? 'text-white/40' : 'text-gray-500'
                )}
              >
                On this page
              </div>
              <nav className="space-y-1">
                {(pageAnchors[currentSection] || []).map((anchor) => (
                  <a
                    key={anchor.id}
                    href={`#${anchor.id}`}
                    className={cn(
                      'block text-left text-[12px] py-1 transition-colors',
                      isDark
                        ? 'text-white/40 hover:text-white/70'
                        : 'text-gray-400 hover:text-gray-600'
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <div className={cn('fixed inset-0', isDark ? 'bg-black/70' : 'bg-black/30')} />
            <div
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'relative rounded-xl border w-full max-w-[900px] max-h-[85vh] overflow-hidden flex flex-col',
                isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-gray-200'
              )}
            >
              <div
                className={cn(
                  'px-4 py-3 border-b shrink-0',
                  isDark ? 'border-white/10' : 'border-gray-100'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code size={14} className={isDark ? 'text-[#3f96fe]' : 'text-cyan-600'} />
                    <span
                      className={cn(
                        'text-[13px] font-medium',
                        isDark ? 'text-white' : 'text-gray-900'
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
                        isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                      )}
                    >
                      <Copy size={14} className={isDark ? 'text-white/40' : 'text-gray-400'} />
                    </button>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className={cn(
                        'p-1.5 rounded-lg',
                        isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                      )}
                    >
                      <X size={14} className={isDark ? 'text-white/40' : 'text-gray-400'} />
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
                      isDark ? 'text-white/80' : 'text-gray-800'
                    )}
                  >
                    {JSON.stringify(apiResponse, null, 2)
                      .split('\n')
                      .map((line, i) => (
                        <div
                          key={i}
                          dangerouslySetInnerHTML={{
                            __html: line
                              .replace(
                                /"([^"]+)":/g,
                                `<span class="${isDark ? 'text-[#7dd3fc]' : 'text-cyan-600'}">"$1"</span>:`
                              )
                              .replace(
                                /: "([^"]*)"/g,
                                `: <span class="${isDark ? 'text-[#fde047]' : 'text-amber-600'}">"$1"</span>`
                              )
                              .replace(
                                /: (\d+\.?\d*)/g,
                                `: <span class="${isDark ? 'text-[#a78bfa]' : 'text-purple-600'}">$1</span>`
                              )
                              .replace(
                                /: (true|false|null)/g,
                                `: <span class="${isDark ? 'text-[#f472b6]' : 'text-pink-600'}">$1</span>`
                              )
                          }}
                        />
                      ))}
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

export async function getStaticProps() {
  const BASE_URL = 'https://api.xrpl.to/v1';
  let apiDocs = null;

  try {
    const res = await axios.get(`${BASE_URL}/docs`);
    apiDocs = res.data;
  } catch (e) {
    console.error('Failed to fetch API docs:', e.message);
  }

  const ogp = {
    canonical: 'https://xrpl.to/docs',
    title: 'API Documentation - XRPL.to',
    desc: 'Complete API reference for XRPL.to - Access XRP Ledger token data, trading, NFT, and analytics endpoints.',
    url: 'https://xrpl.to/docs'
  };

  return {
    props: {
      apiDocs,
      ogp
    },
    revalidate: 300
  };
}
