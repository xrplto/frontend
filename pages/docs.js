import React, { useState, useContext, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';
import { Copy, Menu, X, CheckCircle, Code, Search, Loader2, ChevronRight, ChevronDown, Zap, Clock, BookOpen, Server, Users, AlertTriangle, FileText, Database, BarChart3, Rocket, Hash, Mail, MessageCircle, ExternalLink, Wrench } from 'lucide-react';
import { AppContext } from 'src/AppContext';
import { cn } from 'src/utils/cn';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';

const ApiDocsPage = () => {
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

  const [expandedGroups, setExpandedGroups] = useState({ 'Get Started': true, 'Token APIs': true, 'Account & NFT': true, 'Advanced': true });

  const sidebarGroups = [
    {
      name: 'Get Started',
      items: [
        { id: 'overview', title: 'Overview', icon: BookOpen },
        { id: 'fees', title: 'Fees', icon: Zap },
        { id: 'reference', title: 'Reference', icon: Hash },
        { id: 'errors', title: 'Error Codes', icon: AlertTriangle }
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
        { id: 'tools', title: 'Tools', icon: Wrench }
      ]
    }
  ];

  const sections = sidebarGroups.flatMap(g => g.items);

  const toggleGroup = (name) => {
    setExpandedGroups(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const pageAnchors = {
    overview: [
      { id: 'base-url', label: 'Base URL' },
      { id: 'start-building', label: 'Start Building' },
      { id: 'quick-start', label: 'Quick Start Example' }
    ],
    fees: [
      { id: 'trading-fees', label: 'Trading Fees' },
      { id: 'token-launch-fees', label: 'Token Launch Fees' }
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
    analytics: [
      { id: 'analytics-endpoints', label: 'All Endpoints' }
    ],
    launch: [
      { id: 'launch-token', label: 'Launch Token' },
      { id: 'other-launch', label: 'Other Endpoints' }
    ],
    reference: [
      { id: 'token-ids', label: 'Token Identifiers' },
      { id: 'md5-gen', label: 'MD5 Generation' },
      { id: 'currency-hex', label: 'Currency Hex' },
      { id: 'patterns', label: 'Regex Patterns' },
      { id: 'caching', label: 'Caching' },
      { id: 'rate-limits', label: 'Rate Limits' }
    ],
    tools: [
      { id: 'tools-endpoints', label: 'All Endpoints' }
    ],
    errors: [
      { id: 'error-codes', label: 'HTTP Status Codes' }
    ]
  };

  const copyToClipboard = (text, blockId) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedBlock(blockId);
      setTimeout(() => setCopiedBlock(null), 2000);
    });
  };

  const llmSnippets = {
    tokens: `## Tokens API
Base URL: https://api.xrpl.to/api

GET /tokens - List all tokens with filtering and sorting
Params: start (int, default:0), limit (int, max:100), sortBy (vol24hxrp|marketcap|p24h|trustlines|trendingScore), sort (alias), sortType (asc|desc), order (alias), filter (OMCF|AMM|search), filterNe (negative filter), tag, tags (comma-separated OR filter), watchlist (comma-separated md5), showNew, showSlug, showDate, skipMetrics
Example: GET /api/tokens?limit=20&sortBy=vol24hxrp&sortType=desc
Response: { result, took, count, tokens[], exch, H24, global }

GET /token/{slug} - Get single token by slug, md5, or issuer_currency
Params: slug (required), desc ("yes" for description)
Example: GET /api/token/SOLO or /api/token/rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz_534F4C4F00000000000000000000000000000000

POST /search - Search tokens by name/symbol/issuer
Body: { search: string, page: int, limit: int (max:100) }
Response: { result, tokens[], pagination: { page, limit, total, hasMore } }

GET /slugs - Get all token slugs
GET /tags - Get all token tags with counts
GET /other-tokens/{issuer} - Get other tokens from same issuer (md5, page, limit)
GET /token-traders/{tokenId} - Get top traders with P&L stats (sortBy: volume|pnl|trades, minVolume)`,

    market: `## Market Data API
Base URL: https://api.xrpl.to/api

GET /graph-ohlc-v2/{md5} - OHLC candlestick data from ohlc_v1 database
Params: range (1D|5D|1M|3M|1Y|5Y|ALL), interval (1m|5m|15m|30m|1h|4h|1d|1w - auto-selected if omitted), vs_currency (XRP|USD|EUR|JPY|CNH)
Default intervals: 1D→5m, 5D→15m, 1M→1h, 3M→4h, 1Y→1d, 5Y/ALL→1w
Cache: 1D→5s, 7D→1min, 1M→2min, 3M→5min, 1Y+→10min
Example: GET /api/graph-ohlc-v2/0413ca7cfc258dfaf698c02fe304e607?range=1M&vs_currency=USD
Response: { result, source, took, length, range, interval, interval_seconds, vs_currency, ohlc: [[time, o, h, l, c, vol]] }

GET /sparkline/{md5} - Sparkline price data for mini charts
Params: period (24h|7d, default:7d), lightweight (bool, default:false), maxPoints (int, default:20)

GET /rich-list/{md5} - Top token holders (start, limit)
GET /rich-info/{md5} - Holder distribution statistics
GET /graph-rich/{md5} - Holder distribution graph data

GET /rsi - RSI technical indicators with filtering
Params: start, limit (max:100), sortBy (rsi15m|rsi1h|rsi4h|rsi24h|rsi7d), sortType, timeframe, filter, tag, origin, minMarketCap, maxMarketCap, minVolume24h, maxVolume24h, minPriceChange24h, maxPriceChange24h, minRsi15m, maxRsi15m, minRsi1h, maxRsi1h, minRsi4h, maxRsi4h, minRsi24h, maxRsi24h, minRsi7d, maxRsi7d
Example: GET /api/rsi?minRsi24h=70&sortBy=rsi24h&limit=20

POST /historical-metrics - Get historical token metrics (body: { md5, range })
GET /news - XRPL news with sentiment (5min cache, page, limit, source filter)
GET /news/search?q={query} - Search news articles by title/summary/body
GET /platform-status - Global platform metrics (30s cache)`,

    trading: `## Trading API
Base URL: https://api.xrpl.to/api

GET /history - Trade history for a token
Params: md5 (required unless account), account, page, limit (max:5000, defaults vary by query), startTime, endTime (Unix ms), xrpOnly (bool), xrpAmount (min XRP filter - cached for 100|500)
Notes: Limit defaults: 10 (no filter), 20 (md5/account), 50 (both), 100 (time range)
Example: GET /api/history?md5=0413ca7cfc258dfaf698c02fe304e607&xrpAmount=100&limit=50
Response: { result, took, hists[], recordsReturned, totalRecords, page, limit, timeRange }

GET /amm-pools - AMM liquidity pools with metrics
Params: page, limit (default:25, max:100), status (active|all), issuer, currency, sortBy (fees|apy|liquidity|volume|created)
Response: { result, took, summary: { totalLiquidity, totalVolume24h, totalFees7d, avgFee }, pools[], page, limit, totalCount, totalPages }

GET /pairs/{md5} - Trading pairs for token
GET /pair-rates - Exchange rates (base, quote)`,

    account: `## Account API
Base URL: https://api.xrpl.to/api

GET /account/balance/{account} - Detailed XRP balance with reserves
Response: { result, took, account, balance, total, balanceDrops, spendableDrops, ownerCount, reserve }

POST /account/balance - Batch balances (body: { accounts: string[] max 100 })
Response: { result, took, count, data: [{ account, balance, total }] }

GET /account/info/{account} - Pair balance info (curr1, issuer1, curr2, issuer2)
GET /account/tx/{account} - Trade history by pair (curr1, issuer1, curr2, issuer2)
GET /account/offers/{account} - Open DEX offers (pair, page, limit max:50)

GET /trader/{address} - Trader profile with stats
GET /watchlist?account={account} - User watchlist
POST /watchlist - Add/remove token (body: { account, md5, action: "add"|"remove" })

POST /oauth/twitter/oauth1/request - Twitter OAuth request token (body: { callbackUrl })
POST /oauth/twitter/oauth1/access - Twitter OAuth access token (body: { oauth_token, oauth_verifier, oauth_token_secret })`,

    nft: `## NFT API
Base URL: https://api.xrpl.to/api

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
Base URL: https://api.xrpl.to/api

GET /orderbook - Live orderbook (5s cache, rippled: book_offers)
Params: base_currency (required), base_issuer, quote_currency (required), quote_issuer, limit (default:20, max:400)
Note: XRP auto-normalized to quote side. Returns simplified offers with price, amount, total, account, funded
Example: GET /api/orderbook?base_currency=534F4C4F&base_issuer=rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz&quote_currency=XRP
Response: { success, pair, base, quote, bids[], asks[], ledger_index }

GET /account_tx/{account} - Paginated transaction history (rippled: account_tx)
Params: limit (default:200, max:400), marker (JSON string), ledger_index_min/max, tx_type, forward (bool)

GET /trustlines/{account} - Account trustlines with token info (rippled: account_lines)
Params: page, limit (default:10, max:50), format (raw|default|full), sortByValue (bool)
Formats: raw (trustline data only), default (parsed currency/issuer/balance/limit/flags), full (includes token info, value, percentOwned - auto-sorted by value)
Response: { result, took, account, accountActive, accountData: { balance, total, reserve, ownerCount }, total, lines[], tokenCount?, totalValue? }

GET /tx/{hash} - Transaction by hash (rippled: tx)
POST /pathfinding/pathfind - Find payment paths (rippled: path_find)
POST /pathfinding/ripplepathfind - Ripple path find (rippled: ripple_path_find)`,

    analytics: `## Analytics API
Base URL: https://api.xrpl.to/api

GET /analytics/token/{tokenId} - Token analytics (OMCF)
GET /analytics/trader/{address}/{tokenId} - Trader metrics for token
GET /analytics/top-traders/{tokenId} - Top traders (page, limit, sortBy: volume24h)
GET /analytics/trader-stats/{address} - Cumulative trader stats

GET /analytics/cumulative-stats - All traders stats (10min cache)
Params: page (default:1), limit (default:10), sortBy (default:volume24h), sortOrder (asc|desc), minVolume, address, includeAMM (default:true), minTrades, minProfit, minROI, minTokens, startDate, endDate, activePeriod

GET /analytics/market-metrics - Daily market metrics (startDate required, endDate default:now)
GET /analytics/trader/{address}/volume-history - Volume chart data (startDate, endDate, page, limit)
GET /analytics/trader/{address}/trade-history - Trade count history
GET /analytics/trader/{address}/roi-history - ROI history`,

    launch: `## Token Launch API
Base URL: https://api.xrpl.to/api

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
Base URL: https://api.xrpl.to/api

GET /health - API health check (returns "success")
GET /testnet-balance/{address} - Get XRP balance on testnet
GET /xrpnft/tokens - Get tokens in XRPNFT format (filter param)
GET /xrpnft/filter-by-account/{account} - Get NFTs owned by account (XRPNFT format)`,

    reference: `## Reference
Token Identifiers:
- slug: e.g., SOLO
- md5: 32-char hex (MD5 of issuer_currencyHex)
- issuer_currency: {issuer}_{currencyHex} (underscore separator)

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

Caching: default 5s, platformStatus 30s, news 5min, cumulativeStats 10min, OHLC varies (5s-10min by range)
Rate Limits: 100 req/min (default), 300 req/min (authenticated)`
  };

  const CopyButton = ({ text, id, label = "Copy for LLM" }) => (
    <button
      onClick={() => copyToClipboard(text, id)}
      className={cn(
        "flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] font-medium",
        copiedBlock === id
          ? "bg-emerald-500/10 text-emerald-500"
          : isDark ? "bg-white/5 hover:bg-white/10 text-white/60" : "bg-gray-100 hover:bg-gray-200 text-gray-600"
      )}
    >
      {copiedBlock === id ? <><CheckCircle size={12} /> Copied!</> : <><Copy size={12} /> {label}</>}
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
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Hero */}
            <div>
              <p className="text-primary text-[13px] font-medium mb-2">Get Started</p>
              <h1 className="text-3xl font-normal mb-3">Welcome to XRPL.to API</h1>
              <p className={cn("text-[15px] leading-relaxed", isDark ? "text-white/60" : "text-gray-600")}>
                The comprehensive XRP Ledger API for builders who demand excellence. Fast, reliable infrastructure that scales with your ambitions.
              </p>
            </div>

            {/* Base URL */}
            <div id="base-url" className={cn("rounded-xl border-[1.5px] p-5", isDark ? "border-primary/30 bg-primary/5" : "border-primary/20 bg-primary/5")}>
              <div className="flex items-center gap-2 mb-3">
                <Server size={16} className="text-primary" />
                <h3 className="text-[15px] font-medium">Base URL</h3>
              </div>
              <div className={cn("p-3 rounded-lg font-mono text-[13px]", isDark ? "bg-black/40" : "bg-white border border-gray-200")}>
                https://api.xrpl.to
              </div>
            </div>

            {/* Feature Cards */}
            <div id="start-building">
              <h2 className="text-xl font-normal mb-4">Start Building</h2>
              <p className={cn("text-[14px] mb-5", isDark ? "text-white/60" : "text-gray-600")}>
                Everything you need to build world-class applications on XRP Ledger.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon: Zap, title: 'Quick Start', desc: 'Make your first API call in minutes and start building.' },
                  { icon: Clock, title: 'Rate Limits', desc: 'Free: 1,000 req/hr. Authenticated: 5,000 req/hr.' },
                  { icon: Code, title: 'API Reference', desc: 'Complete documentation for all endpoints.' }
                ].map((card) => (
                  <div
                    key={card.title}
                    className={cn(
                      "rounded-xl border-[1.5px] p-5 cursor-pointer transition-colors",
                      isDark ? "border-white/10 hover:border-white/20 bg-white/[0.02]" : "border-gray-200 hover:border-gray-300 bg-gray-50/50"
                    )}
                    onClick={() => card.title === 'API Reference' && setCurrentSection('tokens')}
                  >
                    <card.icon size={20} className="text-primary mb-3" />
                    <h3 className="text-[14px] font-medium mb-1">{card.title}</h3>
                    <p className={cn("text-[13px]", isDark ? "text-white/50" : "text-gray-500")}>{card.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Start Example */}
            <div id="quick-start" className={cn("rounded-xl border-[1.5px] p-5", isDark ? "border-white/10" : "border-gray-200")}>
              <h3 className="text-[15px] font-medium mb-3">Quick Start Example</h3>
              <p className={cn("text-[13px] mb-3", isDark ? "text-white/60" : "text-gray-600")}>
                Get top tokens by 24h volume:
              </p>
              <div className={cn("p-3 rounded-lg font-mono text-[13px] overflow-x-auto", isDark ? "bg-black/40" : "bg-gray-50 border border-gray-200")}>
                <span className="text-primary">curl</span> -X GET "https://api.xrpl.to/api/tokens?limit=10&sortBy=vol24hxrp"
              </div>
              <button onClick={() => handleTryApi('/api/tokens?limit=5&sortBy=vol24hxrp')} className={cn("mt-3 flex items-center gap-2 rounded-lg border-[1.5px] px-3 py-1.5 text-[12px] font-medium text-primary", isDark ? "border-primary/30 bg-primary/5 hover:bg-primary/10" : "border-primary/30 bg-primary/5 hover:bg-primary/10")}>
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
              <p className={cn("text-[14px]", isDark ? "text-white/60" : "text-gray-600")}>
                Transparent fee structure for trading and token launches on XRPL.to
              </p>
            </div>

            {/* Trading Fees */}
            <div id="trading-fees" className={cn("rounded-xl border-[1.5px] p-5", isDark ? "border-white/10" : "border-gray-200")}>
              <div className={cn("text-[11px] font-medium uppercase tracking-wide mb-4", isDark ? "text-white/40" : "text-gray-500")}>
                Trading Fees
              </div>
              <div className={cn("rounded-xl border-[1.5px] p-4 mb-4", isDark ? "border-primary/30 bg-primary/5" : "border-primary/20 bg-primary/5")}>
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-medium">Platform Trading Fee</span>
                  <span className="text-2xl font-medium text-primary">1.5%</span>
                </div>
              </div>
              <div className={cn("space-y-3 text-[13px]", isDark ? "text-white/60" : "text-gray-600")}>
                <p>
                  A <span className="text-primary font-medium">1.5% fee</span> is applied to all trades executed through the XRPL.to swap interface. This fee helps maintain and improve the platform.
                </p>
                <div className={cn("rounded-lg p-3", isDark ? "bg-white/5" : "bg-gray-50")}>
                  <div className="font-medium mb-2">Example</div>
                  <div>Swapping 1,000 XRP worth of tokens:</div>
                  <div className="mt-1">Fee: <span className="text-primary">15 XRP</span> (1.5% of 1,000)</div>
                </div>
                <p className={cn("text-[12px]", isDark ? "text-white/40" : "text-gray-500")}>
                  Note: This fee is separate from any AMM pool fees or network transaction costs.
                </p>
              </div>
            </div>

            {/* Token Launch Fees */}
            <div id="token-launch-fees" className={cn("rounded-xl border-[1.5px] p-5", isDark ? "border-white/10" : "border-gray-200")}>
              <div className={cn("text-[11px] font-medium uppercase tracking-wide mb-4", isDark ? "text-white/40" : "text-gray-500")}>
                Token Launch Fees
              </div>
              <p className={cn("text-[13px] mb-4", isDark ? "text-white/60" : "text-gray-600")}>
                Launch your token on the XRP Ledger with our streamlined token creation service.
              </p>

              <div className={cn("rounded-lg overflow-hidden border-[1.5px] mb-4", isDark ? "border-white/10" : "border-gray-200")}>
                <table className="w-full text-[13px]">
                  <thead className={isDark ? "bg-white/5" : "bg-gray-50"}>
                    <tr>
                      <th className={cn("text-left px-4 py-3 font-medium", isDark ? "text-white/60" : "text-gray-600")}>Fee Type</th>
                      <th className={cn("text-left px-4 py-3 font-medium", isDark ? "text-white/60" : "text-gray-600")}>Amount</th>
                      <th className={cn("text-left px-4 py-3 font-medium", isDark ? "text-white/60" : "text-gray-600")}>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className={isDark ? "border-t border-white/10" : "border-t border-gray-200"}>
                      <td className="px-4 py-3 font-medium">Platform Fee</td>
                      <td className="px-4 py-3 text-primary">5 - 30 XRP</td>
                      <td className={cn("px-4 py-3", isDark ? "text-white/60" : "text-gray-600")}>Scales with developer allocation %</td>
                    </tr>
                    <tr className={isDark ? "border-t border-white/10" : "border-t border-gray-200"}>
                      <td className="px-4 py-3 font-medium">Base Reserve</td>
                      <td className="px-4 py-3 text-primary">1 XRP</td>
                      <td className={cn("px-4 py-3", isDark ? "text-white/60" : "text-gray-600")}>XRPL account reserve requirement</td>
                    </tr>
                    <tr className={isDark ? "border-t border-white/10" : "border-t border-gray-200"}>
                      <td className="px-4 py-3 font-medium">AMM Pool</td>
                      <td className="px-4 py-3 text-primary">Min 1 XRP</td>
                      <td className={cn("px-4 py-3", isDark ? "text-white/60" : "text-gray-600")}>Initial liquidity for AMM pool</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className={cn("rounded-lg p-4", isDark ? "bg-white/5" : "bg-gray-50")}>
                <div className="font-medium mb-2 text-[13px]">Typical Total Cost</div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-medium text-primary">10 - 50 XRP</span>
                  <span className={cn("text-[12px]", isDark ? "text-white/40" : "text-gray-500")}>depending on configuration</span>
                </div>
              </div>

              <div className={cn("mt-4 space-y-2 text-[13px]", isDark ? "text-white/60" : "text-gray-600")}>
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

            {/* GET /tokens */}
            <div id="get-tokens" className={cn("rounded-xl border-[1.5px] p-5", isDark ? "border-white/10" : "border-gray-200")}>
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-emerald-500/10 text-emerald-500 uppercase tracking-wide">GET</span>
                <code className="text-[15px] font-mono">/api/tokens</code>
              </div>
              <p className={cn("text-[13px] mb-4", isDark ? "text-white/60" : "text-gray-600")}>
                List all tokens with filtering and sorting
              </p>
              <div className={cn("rounded-lg overflow-hidden border-[1.5px] mb-4", isDark ? "border-white/10" : "border-gray-200")}>
                <table className="w-full text-[12px]">
                  <thead className={isDark ? "bg-white/5" : "bg-gray-50"}>
                    <tr>
                      <th className={cn("text-left px-3 py-2 font-medium", isDark ? "text-white/60" : "text-gray-600")}>Param</th>
                      <th className={cn("text-left px-3 py-2 font-medium", isDark ? "text-white/60" : "text-gray-600")}>Description</th>
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
                      <tr key={param} className={isDark ? "border-t border-white/10" : "border-t border-gray-200"}>
                        <td className="px-3 py-2"><code className="text-primary">{param}</code></td>
                        <td className={cn("px-3 py-2", isDark ? "text-white/60" : "text-gray-600")}>{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={cn("relative group rounded-lg overflow-hidden", isDark ? "bg-black/40" : "bg-gray-50 border border-gray-200")}>
                <pre className="p-3 font-mono text-[12px] overflow-x-auto m-0">
                  <span className="text-emerald-500">GET</span> /api/tokens?limit=20&sortBy=vol24hxrp&sortType=desc
                </pre>
              </div>
              <button onClick={() => handleTryApi('/api/tokens?limit=10&sortBy=vol24hxrp')} className={cn("mt-3 flex items-center gap-2 rounded-lg border-[1.5px] px-3 py-1.5 text-[12px] font-medium text-primary", isDark ? "border-primary/30 bg-primary/5 hover:bg-primary/10" : "border-primary/30 bg-primary/5 hover:bg-primary/10")}>
                <Code size={12} /> Try It
              </button>
            </div>

            {/* GET /token/{slug} */}
            <div id="get-token" className={cn("rounded-xl border-[1.5px] p-5", isDark ? "border-white/10" : "border-gray-200")}>
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-emerald-500/10 text-emerald-500 uppercase tracking-wide">GET</span>
                <code className="text-[15px] font-mono">/api/token/{'{slug}'}</code>
              </div>
              <p className={cn("text-[13px] mb-3", isDark ? "text-white/60" : "text-gray-600")}>
                Get single token by slug, md5, or issuer_currency format
              </p>
              <div className={cn("relative group rounded-lg overflow-hidden", isDark ? "bg-black/40" : "bg-gray-50 border border-gray-200")}>
                <pre className="p-3 font-mono text-[12px] overflow-x-auto m-0">
                  <span className="text-emerald-500">GET</span> /api/token/SOLO
                </pre>
              </div>
              <button onClick={() => handleTryApi('/api/token/SOLO')} className={cn("mt-3 flex items-center gap-2 rounded-lg border-[1.5px] px-3 py-1.5 text-[12px] font-medium text-primary", isDark ? "border-primary/30 bg-primary/5 hover:bg-primary/10" : "border-primary/30 bg-primary/5 hover:bg-primary/10")}>
                <Code size={12} /> Try It
              </button>
            </div>

            {/* POST /search */}
            <div id="post-search" className={cn("rounded-xl border-[1.5px] p-5", isDark ? "border-white/10" : "border-gray-200")}>
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-amber-500/10 text-amber-500 uppercase tracking-wide">POST</span>
                <code className="text-[15px] font-mono">/api/search</code>
              </div>
              <p className={cn("text-[13px] mb-3", isDark ? "text-white/60" : "text-gray-600")}>
                Search tokens by name/symbol/issuer
              </p>
              <div className={cn("relative group rounded-lg overflow-hidden", isDark ? "bg-black/40" : "bg-gray-50 border border-gray-200")}>
                <pre className="p-3 font-mono text-[12px] overflow-x-auto m-0">
{`Body: { "search": "solo", "page": 0, "limit": 20 }`}
                </pre>
              </div>
            </div>

            {/* Other endpoints */}
            <div id="other-endpoints" className={cn("rounded-xl border-[1.5px] p-5", isDark ? "border-white/10" : "border-gray-200")}>
              <div className={cn("text-[11px] font-medium uppercase tracking-wide mb-3", isDark ? "text-white/40" : "text-gray-500")}>
                Other Endpoints
              </div>
              <div className="space-y-2 text-[13px]">
                {[
                  ['GET', '/api/slugs', 'Get all token slugs'],
                  ['GET', '/api/tags', 'Get all token tags with counts'],
                  ['GET', '/api/other-tokens/{issuer}', 'Get tokens from same issuer (md5, page, limit)'],
                  ['GET', '/api/token-traders/{tokenId}', 'Top traders with P&L (sortBy: volume|pnl|trades, minVolume)']
                ].map(([method, path, desc]) => (
                  <div key={path} className="flex items-center gap-3">
                    <span className={cn("px-1.5 py-0.5 text-[10px] font-medium rounded", method === 'GET' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500")}>{method}</span>
                    <code className="font-mono text-[12px]">{path}</code>
                    <span className={isDark ? "text-white/40" : "text-gray-500"}>- {desc}</span>
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

            {/* OHLC */}
            <div id="ohlc" className={cn("rounded-xl border-[1.5px] p-5", isDark ? "border-white/10" : "border-gray-200")}>
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-emerald-500/10 text-emerald-500 uppercase tracking-wide">GET</span>
                <code className="text-[15px] font-mono">/api/graph-ohlc-v2/{'{md5}'}</code>
              </div>
              <p className={cn("text-[13px] mb-3", isDark ? "text-white/60" : "text-gray-600")}>
                Get OHLC candlestick chart data
              </p>
              <div className={cn("rounded-lg overflow-hidden border-[1.5px] mb-4", isDark ? "border-white/10" : "border-gray-200")}>
                <table className="w-full text-[12px]">
                  <thead className={isDark ? "bg-white/5" : "bg-gray-50"}>
                    <tr>
                      <th className={cn("text-left px-3 py-2 font-medium", isDark ? "text-white/60" : "text-gray-600")}>Param</th>
                      <th className={cn("text-left px-3 py-2 font-medium", isDark ? "text-white/60" : "text-gray-600")}>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['md5', '32-char token md5 (required)'],
                      ['range', '1D | 5D | 1M | 3M | 1Y | 5Y | ALL (default: 1D)'],
                      ['interval', '1m | 5m | 15m | 30m | 1h | 4h | 1d | 1w'],
                      ['vs_currency', 'XRP | USD | EUR | JPY | CNH (default: XRP)']
                    ].map(([param, desc]) => (
                      <tr key={param} className={isDark ? "border-t border-white/10" : "border-t border-gray-200"}>
                        <td className="px-3 py-2"><code className="text-primary">{param}</code></td>
                        <td className={cn("px-3 py-2", isDark ? "text-white/60" : "text-gray-600")}>{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={cn("relative group rounded-lg overflow-hidden", isDark ? "bg-black/40" : "bg-gray-50 border border-gray-200")}>
                <pre className="p-3 font-mono text-[12px] overflow-x-auto m-0">
                  <span className="text-emerald-500">GET</span> /api/graph-ohlc-v2/0413ca7cfc258dfaf698c02fe304e607?range=1D
                </pre>
              </div>
            </div>

            {/* Other market endpoints */}
            <div id="other-market" className={cn("rounded-xl border-[1.5px] p-5", isDark ? "border-white/10" : "border-gray-200")}>
              <div className={cn("text-[11px] font-medium uppercase tracking-wide mb-3", isDark ? "text-white/40" : "text-gray-500")}>
                Other Endpoints
              </div>
              <div className="space-y-2 text-[13px]">
                {[
                  ['GET', '/api/sparkline/{md5}', 'Sparkline data (period: 24h|7d, lightweight, maxPoints)'],
                  ['GET', '/api/rich-list/{md5}', 'Top token holders (start, limit)'],
                  ['GET', '/api/rich-info/{md5}', 'Holder distribution statistics'],
                  ['GET', '/api/graph-rich/{md5}', 'Holder distribution graph'],
                  ['GET', '/api/rsi', 'RSI indicators with filtering (all timeframes, market/volume/price filters)'],
                  ['POST', '/api/historical-metrics', 'Historical token metrics (body: { md5, range })'],
                  ['GET', '/api/platform-status', 'Global platform metrics (30s cache)'],
                  ['GET', '/api/news', 'XRPL news with sentiment (5min cache, source filter)'],
                  ['GET', '/api/news/search?q={query}', 'Search news by title/summary/body']
                ].map(([method, path, desc]) => (
                  <div key={path} className="flex items-center gap-3">
                    <span className={cn("px-1.5 py-0.5 text-[10px] font-medium rounded", method === 'GET' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500")}>{method}</span>
                    <code className="font-mono text-[12px]">{path}</code>
                    <span className={isDark ? "text-white/40" : "text-gray-500"}>- {desc}</span>
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

            {/* GET /history */}
            <div id="history" className={cn("rounded-xl border-[1.5px] p-5", isDark ? "border-white/10" : "border-gray-200")}>
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-emerald-500/10 text-emerald-500 uppercase tracking-wide">GET</span>
                <code className="text-[15px] font-mono">/api/history</code>
              </div>
              <p className={cn("text-[13px] mb-3", isDark ? "text-white/60" : "text-gray-600")}>
                Get trade history for a token
              </p>
              <div className={cn("rounded-lg overflow-hidden border-[1.5px] mb-4", isDark ? "border-white/10" : "border-gray-200")}>
                <table className="w-full text-[12px]">
                  <thead className={isDark ? "bg-white/5" : "bg-gray-50"}>
                    <tr>
                      <th className={cn("text-left px-3 py-2 font-medium", isDark ? "text-white/60" : "text-gray-600")}>Param</th>
                      <th className={cn("text-left px-3 py-2 font-medium", isDark ? "text-white/60" : "text-gray-600")}>Description</th>
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
                      <tr key={param} className={isDark ? "border-t border-white/10" : "border-t border-gray-200"}>
                        <td className="px-3 py-2"><code className="text-primary">{param}</code></td>
                        <td className={cn("px-3 py-2", isDark ? "text-white/60" : "text-gray-600")}>{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={cn("relative group rounded-lg overflow-hidden", isDark ? "bg-black/40" : "bg-gray-50 border border-gray-200")}>
                <pre className="p-3 font-mono text-[12px] overflow-x-auto m-0">
                  <span className="text-emerald-500">GET</span> /api/history?md5=0413ca7cfc258dfaf698c02fe304e607&limit=50
                </pre>
              </div>
            </div>

            {/* Other trading endpoints */}
            <div id="other-trading" className={cn("rounded-xl border-[1.5px] p-5", isDark ? "border-white/10" : "border-gray-200")}>
              <div className={cn("text-[11px] font-medium uppercase tracking-wide mb-3", isDark ? "text-white/40" : "text-gray-500")}>
                Other Endpoints
              </div>
              <div className="space-y-2 text-[13px]">
                {[
                  ['GET', '/api/amm-pools', 'AMM pools with metrics (sortBy: fees|apy|liquidity|volume|created)'],
                  ['GET', '/api/pairs/{md5}', 'Trading pairs for token'],
                  ['GET', '/api/pair_rates', 'Exchange rates (base, quote)']
                ].map(([method, path, desc]) => (
                  <div key={path} className="flex items-center gap-3">
                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-500/10 text-emerald-500">{method}</span>
                    <code className="font-mono text-[12px]">{path}</code>
                    <span className={isDark ? "text-white/40" : "text-gray-500"}>- {desc}</span>
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

            {/* Account endpoints list */}
            <div id="account-endpoints" className={cn("rounded-xl border-[1.5px] p-5", isDark ? "border-white/10" : "border-gray-200")}>
              <div className="space-y-2 text-[13px]">
                {[
                  ['GET', '/api/account/balance/{account}', 'Detailed XRP balance with reserves'],
                  ['POST', '/api/account/balance', 'Batch balances (body: { accounts[] max 100 })'],
                  ['GET', '/api/account/info/{account}', 'Pair balance info (curr1, issuer1, curr2, issuer2)'],
                  ['GET', '/api/account/tx/{account}', 'Trade history by pair (curr1, issuer1, curr2, issuer2)'],
                  ['GET', '/api/account/offers/{account}', 'Open DEX offers (pair, page, limit max:50)'],
                  ['GET', '/api/trader/{address}', 'Trader profile with stats'],
                  ['GET', '/api/watchlist?account={account}', 'User watchlist'],
                  ['POST', '/api/watchlist', 'Add/remove token (body: { account, md5, action })'],
                  ['POST', '/api/oauth/twitter/oauth1/request', 'Twitter OAuth request token (body: { callbackUrl })'],
                  ['POST', '/api/oauth/twitter/oauth1/access', 'Twitter OAuth access token']
                ].map(([method, path, desc]) => (
                  <div key={path} className="flex items-center gap-3">
                    <span className={cn("px-1.5 py-0.5 text-[10px] font-medium rounded", method === 'GET' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500")}>{method}</span>
                    <code className="font-mono text-[12px]">{path}</code>
                    <span className={isDark ? "text-white/40" : "text-gray-500"}>- {desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* account_tx detail */}
            <div id="account-tx" className={cn("rounded-xl border-[1.5px] p-5", isDark ? "border-white/10" : "border-gray-200")}>
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-emerald-500/10 text-emerald-500 uppercase tracking-wide">GET</span>
                <code className="text-[15px] font-mono">/api/account_tx/{'{account}'}</code>
              </div>
              <p className={cn("text-[13px] mb-3", isDark ? "text-white/60" : "text-gray-600")}>
                Get paginated transaction history (rippled: account_tx)
              </p>
              <div className={cn("rounded-lg overflow-hidden border-[1.5px]", isDark ? "border-white/10" : "border-gray-200")}>
                <table className="w-full text-[12px]">
                  <thead className={isDark ? "bg-white/5" : "bg-gray-50"}>
                    <tr>
                      <th className={cn("text-left px-3 py-2 font-medium", isDark ? "text-white/60" : "text-gray-600")}>Param</th>
                      <th className={cn("text-left px-3 py-2 font-medium", isDark ? "text-white/60" : "text-gray-600")}>Description</th>
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
                      <tr key={param} className={isDark ? "border-t border-white/10" : "border-t border-gray-200"}>
                        <td className="px-3 py-2"><code className="text-primary">{param}</code></td>
                        <td className={cn("px-3 py-2", isDark ? "text-white/60" : "text-gray-600")}>{desc}</td>
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

            {/* NFT endpoints */}
            <div id="single-nft" className={cn("rounded-xl border-[1.5px] p-5", isDark ? "border-white/10" : "border-gray-200")}>
              <div className={cn("text-[11px] font-medium uppercase tracking-wide mb-3", isDark ? "text-white/40" : "text-gray-500")}>
                Single NFT
              </div>
              <div className="space-y-2 text-[13px]">
                {[
                  ['GET', '/api/nft/{NFTokenID}', 'Get NFT by 64-char ID'],
                  ['GET', '/api/nft/{NFTokenID}/offers', 'Buy/sell offers for NFT'],
                  ['GET', '/api/nft', 'List NFTs (cid, issuer, page, limit, sort)']
                ].map(([method, path, desc]) => (
                  <div key={path} className="flex items-center gap-3">
                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-500/10 text-emerald-500">{method}</span>
                    <code className="font-mono text-[12px]">{path}</code>
                    <span className={isDark ? "text-white/40" : "text-gray-500"}>- {desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div id="collections" className={cn("rounded-xl border-[1.5px] p-5", isDark ? "border-white/10" : "border-gray-200")}>
              <div className={cn("text-[11px] font-medium uppercase tracking-wide mb-3", isDark ? "text-white/40" : "text-gray-500")}>
                Collections
              </div>
              <div className="space-y-2 text-[13px]">
                {[
                  ['GET', '/api/nft/collections', 'List collections (sortBy, order)'],
                  ['GET', '/api/nft/collections/{slug}', 'Collection by slug'],
                  ['GET', '/api/nft/collections/{slug}/nfts', 'NFTs in collection'],
                  ['GET', '/api/nft/collections/{slug}/traders', 'Top traders'],
                  ['GET', '/api/nft/collections/{slug}/orderbook', 'Collection orderbook'],
                  ['GET', '/api/nft/collections/{slug}/history', 'Activity history'],
                  ['GET', '/api/nft/collections/{slug}/floor/history', 'Floor price history'],
                  ['GET', '/api/nft/collections/{slug}/metrics', 'Collection metrics'],
                  ['GET', '/api/nft/collections/{slug}/ownership', 'Ownership distribution']
                ].map(([method, path, desc]) => (
                  <div key={path} className="flex items-center gap-3">
                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-500/10 text-emerald-500">{method}</span>
                    <code className="font-mono text-[12px]">{path}</code>
                    <span className={isDark ? "text-white/40" : "text-gray-500"}>- {desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div id="activity" className={cn("rounded-xl border-[1.5px] p-5", isDark ? "border-white/10" : "border-gray-200")}>
              <div className={cn("text-[11px] font-medium uppercase tracking-wide mb-3", isDark ? "text-white/40" : "text-gray-500")}>
                Activity & Traders
              </div>
              <div className="space-y-2 text-[13px]">
                {[
                  ['GET', '/api/nft/activity', 'Recent NFT activity'],
                  ['GET', '/api/nft/history', 'NFT transaction history'],
                  ['GET', '/api/nft/traders/active', 'Active traders (sortBy: balance|buyVolume|sellVolume|totalVolume)'],
                  ['GET', '/api/nft/traders/{account}/volume', 'Trader volume stats'],
                  ['GET', '/api/nft/accounts/{address}/nfts', 'NFTs owned by account (limit, skip)'],
                  ['GET', '/api/nft/stats/global', 'Global NFT stats'],
                  ['GET', '/api/nft/brokers/stats', 'Broker fees and volumes'],
                  ['POST', '/api/nft/mint', 'Create NFT mint transaction payload'],
                  ['POST', '/api/nft/pin', 'Pin NFT metadata to IPFS'],
                  ['GET', '/api/nft/pin/status/{hash}', 'Get IPFS pin status']
                ].map(([method, path, desc]) => (
                  <div key={path} className="flex items-center gap-3">
                    <span className={cn("px-1.5 py-0.5 text-[10px] font-medium rounded", method === 'GET' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500")}>{method}</span>
                    <code className="font-mono text-[12px]">{path}</code>
                    <span className={isDark ? "text-white/40" : "text-gray-500"}>- {desc}</span>
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

            {/* Orderbook detail */}
            <div id="orderbook" className={cn("rounded-xl border-[1.5px] p-5", isDark ? "border-white/10" : "border-gray-200")}>
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-emerald-500/10 text-emerald-500 uppercase tracking-wide">GET</span>
                <code className="text-[15px] font-mono">/api/orderbook</code>
              </div>
              <p className={cn("text-[13px] mb-3", isDark ? "text-white/60" : "text-gray-600")}>
                Get live orderbook (rippled: book_offers)
              </p>
              <div className={cn("rounded-lg overflow-hidden border-[1.5px] mb-4", isDark ? "border-white/10" : "border-gray-200")}>
                <table className="w-full text-[12px]">
                  <thead className={isDark ? "bg-white/5" : "bg-gray-50"}>
                    <tr>
                      <th className={cn("text-left px-3 py-2 font-medium", isDark ? "text-white/60" : "text-gray-600")}>Param</th>
                      <th className={cn("text-left px-3 py-2 font-medium", isDark ? "text-white/60" : "text-gray-600")}>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['base_currency', 'Base currency (XRP or hex) - required'],
                      ['base_issuer', 'Base issuer (if not XRP)'],
                      ['quote_currency', 'Quote currency - required'],
                      ['quote_issuer', 'Quote issuer (if not XRP)'],
                      ['limit', 'int (default: 20, max: 400)']
                    ].map(([param, desc]) => (
                      <tr key={param} className={isDark ? "border-t border-white/10" : "border-t border-gray-200"}>
                        <td className="px-3 py-2"><code className="text-primary">{param}</code></td>
                        <td className={cn("px-3 py-2", isDark ? "text-white/60" : "text-gray-600")}>{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={cn("relative group rounded-lg overflow-hidden", isDark ? "bg-black/40" : "bg-gray-50 border border-gray-200")}>
                <pre className="p-3 font-mono text-[11px] overflow-x-auto m-0">
                  <span className="text-emerald-500">GET</span> /api/orderbook?base_currency=XRP&quote_currency=534F4C4F&quote_issuer=rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz
                </pre>
              </div>
            </div>

            {/* Other XRPL endpoints */}
            <div id="other-xrpl" className={cn("rounded-xl border-[1.5px] p-5", isDark ? "border-white/10" : "border-gray-200")}>
              <div className={cn("text-[11px] font-medium uppercase tracking-wide mb-3", isDark ? "text-white/40" : "text-gray-500")}>
                Other Endpoints
              </div>
              <div className="space-y-2 text-[13px]">
                {[
                  ['GET', '/api/tx/{hash}', 'Transaction by hash (rippled: tx)'],
                  ['POST', '/api/pathfinding/pathfind', 'Find payment paths'],
                  ['POST', '/api/pathfinding/ripplepathfind', 'Ripple path find']
                ].map(([method, path, desc]) => (
                  <div key={path} className="flex items-center gap-3">
                    <span className={cn("px-1.5 py-0.5 text-[10px] font-medium rounded", method === 'GET' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500")}>{method}</span>
                    <code className="font-mono text-[12px]">{path}</code>
                    <span className={isDark ? "text-white/40" : "text-gray-500"}>- {desc}</span>
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

            <div id="analytics-endpoints" className={cn("rounded-xl border-[1.5px] p-5", isDark ? "border-white/10" : "border-gray-200")}>
              <div className="space-y-2 text-[13px]">
                {[
                  ['GET', '/api/analytics/token/{tokenId}', 'Token analytics (OMCF)'],
                  ['GET', '/api/analytics/trader/{address}/{tokenId}', 'Trader metrics for token'],
                  ['GET', '/api/analytics/top-traders/{tokenId}', 'Top traders (sortBy: volume24h)'],
                  ['GET', '/api/analytics/trader-stats/{address}', 'Cumulative trader stats'],
                  ['GET', '/api/analytics/cumulative-stats', 'All traders (10min cache, minTrades, minProfit, minROI, minTokens, activePeriod)'],
                  ['GET', '/api/analytics/market-metrics', 'Daily market metrics (startDate required)'],
                  ['GET', '/api/analytics/trader/{address}/volume-history', 'Volume chart data'],
                  ['GET', '/api/analytics/trader/{address}/trade-history', 'Trade count history'],
                  ['GET', '/api/analytics/trader/{address}/roi-history', 'ROI history']
                ].map(([method, path, desc]) => (
                  <div key={path} className="flex items-center gap-3">
                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-500/10 text-emerald-500">{method}</span>
                    <code className="font-mono text-[12px]">{path}</code>
                    <span className={isDark ? "text-white/40" : "text-gray-500"}>- {desc}</span>
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
            <div id="launch-token" className={cn("rounded-xl border-[1.5px] p-5", isDark ? "border-white/10" : "border-gray-200")}>
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-amber-500/10 text-amber-500 uppercase tracking-wide">POST</span>
                <code className="text-[15px] font-mono">/api/launch-token</code>
              </div>
              <p className={cn("text-[13px] mb-3", isDark ? "text-white/60" : "text-gray-600")}>
                Initialize token launch with optional anti-snipe mode
              </p>
              <div className={cn("rounded-lg overflow-hidden border-[1.5px] mb-4", isDark ? "border-white/10" : "border-gray-200")}>
                <table className="w-full text-[12px]">
                  <thead className={isDark ? "bg-white/5" : "bg-gray-50"}>
                    <tr>
                      <th className={cn("text-left px-3 py-2 font-medium", isDark ? "text-white/60" : "text-gray-600")}>Body Param</th>
                      <th className={cn("text-left px-3 py-2 font-medium", isDark ? "text-white/60" : "text-gray-600")}>Description</th>
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
                      <tr key={param} className={isDark ? "border-t border-white/10" : "border-t border-gray-200"}>
                        <td className="px-3 py-2"><code className="text-primary">{param}</code></td>
                        <td className={cn("px-3 py-2", isDark ? "text-white/60" : "text-gray-600")}>{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={cn("mt-4 p-3 rounded-lg text-[12px]", isDark ? "bg-white/5" : "bg-gray-50")}>
                <div className="font-medium mb-2">Costs</div>
                <div className={cn("space-y-1", isDark ? "text-white/60" : "text-gray-600")}>
                  <div>Platform fee: <span className="text-primary">5-30 XRP</span> (0-30% dev → 5-20 XRP, 30-95% dev → 20-30 XRP)</div>
                  <div>Base reserve: <span className="text-primary">1 XRP</span>, Owner reserve: <span className="text-primary">0.2 XRP</span>/object</div>
                  <div>Breakdown: issuer(1) + fee(5-30) + holder(1) + AMM liquidity + tx fees(~1.8)</div>
                  <div className="mt-2">Typical total: <span className="text-primary font-medium">10-50 XRP</span></div>
                </div>
              </div>
              <div className={cn("mt-3 p-3 rounded-lg text-[12px]", isDark ? "bg-white/5" : "bg-gray-50")}>
                <div className="font-medium mb-2">Status Flow</div>
                <div className={cn("font-mono text-[10px] leading-relaxed", isDark ? "text-white/60" : "text-gray-600")}>
                  initializing → awaiting_funding → partial_funding → funded → configuring_issuer → registering_token → creating_trustline → sending_tokens → creating_checks → creating_amm → scheduling_blackhole → success/completed
                </div>
              </div>
              <div className={cn("mt-3 p-3 rounded-lg text-[12px]", isDark ? "bg-white/5" : "bg-gray-50")}>
                <div className="font-medium mb-2">Anti-Snipe Mode</div>
                <div className={cn("space-y-1", isDark ? "text-white/60" : "text-gray-600")}>
                  <div>Enables RequireAuth flag preventing unauthorized trustlines</div>
                  <div>250 pre-created tickets (XRPL max) for fast parallel authorization</div>
                  <div>5-minute auth window after AMM created</div>
                  <div>After window: RequireAuth removed → issuer blackholed</div>
                </div>
              </div>
              <div className={cn("mt-3 p-3 rounded-lg text-[12px]", isDark ? "bg-white/5" : "bg-gray-50")}>
                <div className="font-medium mb-2">Final State</div>
                <div className={isDark ? "text-white/60" : "text-gray-600"}>
                  Issuer: ~1 XRP locked (blackholed) | Holder: ~1.4 XRP locked (base + LP token reserve, blackholed)
                </div>
              </div>
            </div>

            {/* Other launch endpoints */}
            <div id="other-launch" className={cn("rounded-xl border-[1.5px] p-5", isDark ? "border-white/10" : "border-gray-200")}>
              <div className={cn("text-[11px] font-medium uppercase tracking-wide mb-3", isDark ? "text-white/40" : "text-gray-500")}>
                Other Endpoints
              </div>
              <div className="space-y-2 text-[13px]">
                {[
                  ['GET', '/api/launch-token/status/{sessionId}', 'Poll status (every 3s recommended)'],
                  ['DELETE', '/api/launch-token/{sessionId}', 'Cancel and refund (allowed before creating_amm)'],
                  ['POST', '/api/launch-token/{sessionId}/cancel', 'Cancel alternative'],
                  ['POST', '/api/launch-token/authorize', 'Request trustline auth (anti-snipe: issuer, currency, account)'],
                  ['GET', '/api/launch-token/queue-status/{sessionId}', 'Auth queue status'],
                  ['GET', '/api/launch-token/auth-info/{issuer}/{currency}', 'Token auth info'],
                  ['GET', '/api/launch-token/check-auth/{issuer}/{currency}/{address}', 'Check authorization'],
                  ['GET', '/api/launch-token/calculate-funding', 'Calculate XRP required (ticketCount, antiSnipeMode)']
                ].map(([method, path, desc]) => (
                  <div key={path} className="flex items-center gap-3">
                    <span className={cn("px-1.5 py-0.5 text-[10px] font-medium rounded", method === 'GET' ? "bg-emerald-500/10 text-emerald-500" : method === 'DELETE' ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500")}>{method}</span>
                    <code className="font-mono text-[12px]">{path}</code>
                    <span className={isDark ? "text-white/40" : "text-gray-500"}>- {desc}</span>
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

            <div id="tools-endpoints" className={cn("rounded-xl border-[1.5px] p-5", isDark ? "border-white/10" : "border-gray-200")}>
              <div className="space-y-2 text-[13px]">
                {[
                  ['GET', '/api/health', 'API health check (returns "success")'],
                  ['GET', '/api/testnet-balance/{address}', 'Get XRP balance on testnet'],
                  ['GET', '/api/xrpnft/tokens', 'Get tokens in XRPNFT format (filter param)'],
                  ['GET', '/api/xrpnft/filter-by-account/{account}', 'Get NFTs owned by account (XRPNFT format)']
                ].map(([method, path, desc]) => (
                  <div key={path} className="flex items-center gap-3">
                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-500/10 text-emerald-500">{method}</span>
                    <code className="font-mono text-[12px]">{path}</code>
                    <span className={isDark ? "text-white/40" : "text-gray-500"}>- {desc}</span>
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
            <div id="token-ids" className={cn("rounded-xl border-[1.5px] p-5", isDark ? "border-white/10" : "border-gray-200")}>
              <div className={cn("text-[11px] font-medium uppercase tracking-wide mb-3", isDark ? "text-white/40" : "text-gray-500")}>
                Token Identifiers
              </div>
              <div className="space-y-2 text-[13px]">
                <div><code className="text-primary">slug</code> <span className={isDark ? "text-white/60" : "text-gray-600"}>- e.g., SOLO</span></div>
                <div><code className="text-primary">md5</code> <span className={isDark ? "text-white/60" : "text-gray-600"}>- 32-char hex (MD5 of issuer_currencyHex)</span></div>
                <div><code className="text-primary">issuer_currency</code> <span className={isDark ? "text-white/60" : "text-gray-600"}>- issuer_currencyHex format</span></div>
              </div>
            </div>

            {/* MD5 Generation */}
            <div id="md5-gen" className={cn("rounded-xl border-[1.5px] p-5", isDark ? "border-white/10" : "border-gray-200")}>
              <div className={cn("text-[11px] font-medium uppercase tracking-wide mb-3", isDark ? "text-white/40" : "text-gray-500")}>
                MD5 Generation
              </div>
              <div className={cn("rounded-lg p-3 font-mono text-[12px]", isDark ? "bg-black/40" : "bg-gray-50")}>
                <div className={isDark ? "text-white/60" : "text-gray-600"}>// Input</div>
                <div>rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz_534F4C4F00000000000000000000000000000000</div>
                <div className={cn("mt-2", isDark ? "text-white/60" : "text-gray-600")}>// Output</div>
                <div className="text-primary">0413ca7cfc258dfaf698c02fe304e607</div>
              </div>
            </div>

            {/* Currency Hex */}
            <div id="currency-hex" className={cn("rounded-xl border-[1.5px] p-5", isDark ? "border-white/10" : "border-gray-200")}>
              <div className={cn("text-[11px] font-medium uppercase tracking-wide mb-3", isDark ? "text-white/40" : "text-gray-500")}>
                Currency Hex (codes {'>'}3 chars)
              </div>
              <div className={cn("rounded-lg p-3 font-mono text-[12px]", isDark ? "bg-black/40" : "bg-gray-50")}>
                <div>SOLO = <span className="text-primary">534F4C4F00000000000000000000000000000000</span></div>
                <div className={cn("mt-2 text-[11px]", isDark ? "text-white/40" : "text-gray-500")}>
                  Buffer.from('SOLO').toString('hex').toUpperCase().padEnd(40, '0')
                </div>
              </div>
            </div>

            {/* Patterns */}
            <div id="patterns" className={cn("rounded-xl border-[1.5px] p-5", isDark ? "border-white/10" : "border-gray-200")}>
              <div className={cn("text-[11px] font-medium uppercase tracking-wide mb-3", isDark ? "text-white/40" : "text-gray-500")}>
                Regex Patterns
              </div>
              <div className="space-y-2 text-[12px] font-mono">
                <div><span className="text-primary">Account:</span> <span className={isDark ? "text-white/60" : "text-gray-600"}>^r[1-9A-HJ-NP-Za-km-z]{'{24,34}'}$</span></div>
                <div><span className="text-primary">NFTokenID:</span> <span className={isDark ? "text-white/60" : "text-gray-600"}>^[A-Fa-f0-9]{'{64}'}$</span></div>
                <div><span className="text-primary">txHash:</span> <span className={isDark ? "text-white/60" : "text-gray-600"}>^[A-Fa-f0-9]{'{64}'}$</span></div>
                <div><span className="text-primary">md5:</span> <span className={isDark ? "text-white/60" : "text-gray-600"}>^[a-f0-9]{'{32}'}$</span></div>
              </div>
            </div>

            {/* Caching */}
            <div id="caching" className={cn("rounded-xl border-[1.5px] p-5", isDark ? "border-white/10" : "border-gray-200")}>
              <div className={cn("text-[11px] font-medium uppercase tracking-wide mb-3", isDark ? "text-white/40" : "text-gray-500")}>
                Caching
              </div>
              <div className="space-y-2 text-[12px]">
                <div><span className="text-primary font-medium">Default:</span> <span className={isDark ? "text-white/60" : "text-gray-600"}>5 seconds</span></div>
                <div><span className="text-primary font-medium">platformStatus:</span> <span className={isDark ? "text-white/60" : "text-gray-600"}>30 seconds</span></div>
                <div><span className="text-primary font-medium">news:</span> <span className={isDark ? "text-white/60" : "text-gray-600"}>5 minutes</span></div>
                <div><span className="text-primary font-medium">cumulativeStats:</span> <span className={isDark ? "text-white/60" : "text-gray-600"}>10 minutes</span></div>
              </div>
            </div>

            {/* Rate Limits */}
            <div id="rate-limits" className={cn("rounded-xl border-[1.5px] p-5", isDark ? "border-white/10" : "border-gray-200")}>
              <div className={cn("text-[11px] font-medium uppercase tracking-wide mb-3", isDark ? "text-white/40" : "text-gray-500")}>
                Rate Limits
              </div>
              <div className="space-y-2 text-[12px]">
                <div><span className="text-primary font-medium">Default:</span> <span className={isDark ? "text-white/60" : "text-gray-600"}>100 requests/minute</span></div>
                <div><span className="text-primary font-medium">Authenticated:</span> <span className={isDark ? "text-white/60" : "text-gray-600"}>300 requests/minute</span></div>
              </div>
            </div>
          </div>
        );

      case 'errors':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-normal text-primary">Error Codes</h2>
            <div id="error-codes" className={cn(
              "rounded-xl border-[1.5px] overflow-hidden",
              isDark ? "border-white/10" : "border-gray-200"
            )}>
              <table className="w-full text-[13px]">
                <thead className={isDark ? "bg-white/5" : "bg-gray-50"}>
                  <tr>
                    <th className={cn("text-left px-4 py-3 font-medium", isDark ? "text-white/60" : "text-gray-600")}>Code</th>
                    <th className={cn("text-left px-4 py-3 font-medium", isDark ? "text-white/60" : "text-gray-600")}>Description</th>
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
                    <tr key={err.code} className={isDark ? "border-t border-white/10" : "border-t border-gray-200"}>
                      <td className="px-4 py-3"><code className={cn("font-mono", err.color)}>{err.code}</code></td>
                      <td className={cn("px-4 py-3", isDark ? "text-white/60" : "text-gray-600")}>{err.desc}</td>
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
        <title>XRPL.to API Documentation</title>
        <meta
          name="description"
          content="Complete API documentation for XRPL.to - XRP Ledger token data and analytics"
        />
      </Head>

      <Header />

      <div className={cn("min-h-screen flex flex-col", isDark ? "bg-black" : "bg-white")}>
        <div className="flex flex-1">
          {/* Mobile menu button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={cn(
              "md:hidden fixed top-20 right-4 z-50 p-2 rounded-lg",
              isDark ? "bg-gray-900 border border-white/10" : "bg-white border border-gray-200"
            )}
          >
            {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* Sidebar */}
          <div
            className={cn(
              "w-[240px] border-r overflow-y-auto transition-all duration-300 pt-16",
              "fixed md:sticky top-0 h-screen z-40",
              isDark ? "bg-black border-white/[0.08]" : "bg-gray-50/50 border-gray-200",
              isSidebarOpen ? "block" : "hidden md:block"
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
                    "w-full pl-9 pr-3 py-2 rounded-lg border-[1.5px] text-[13px]",
                    isDark ? "bg-white/[0.02] border-white/10 placeholder:text-white/30" : "bg-white border-gray-200"
                  )}
                />
              </div>

              {/* Top-level links */}
              <div className="space-y-1 mb-6">
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); setCurrentSection('overview'); }}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px]",
                    currentSection === 'overview'
                      ? "text-primary bg-primary/10"
                      : isDark ? "text-white/70 hover:text-white hover:bg-white/5" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  )}
                >
                  <FileText size={14} className="opacity-60" />
                  Documentation
                </a>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); setCurrentSection('tokens'); }}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px]",
                    isDark ? "text-white/70 hover:text-white hover:bg-white/5" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
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
                          "w-full flex items-center justify-between text-[11px] font-medium uppercase tracking-wide mb-2 px-1",
                          isDark ? "text-white/40 hover:text-white/60" : "text-gray-500 hover:text-gray-700"
                        )}
                      >
                        {group.name}
                        <ChevronDown size={12} className={cn("transition-transform", !expandedGroups[group.name] && "-rotate-90")} />
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
                                  "w-full text-left px-3 py-2 rounded-lg text-[13px] flex items-center gap-2.5 transition-colors",
                                  isActive
                                    ? "text-primary bg-primary/10"
                                    : isDark
                                      ? "text-white/60 hover:text-white hover:bg-white/5"
                                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                )}
                              >
                                <Icon size={14} className={isActive ? "text-primary" : "opacity-40"} />
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
              <div className={cn("mt-6 pt-6 border-t", isDark ? "border-white/10" : "border-gray-200")}>
                <div className={cn("text-[11px] font-medium uppercase tracking-wide mb-3 px-1", isDark ? "text-white/40" : "text-gray-500")}>
                  Support
                </div>
                <div className="space-y-1">
                  <a
                    href="https://x.com/xrplto"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px]",
                      isDark ? "text-white/60 hover:text-white hover:bg-white/5" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    )}
                  >
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 opacity-60" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    @xrplto
                    <ExternalLink size={10} className="ml-auto opacity-40" />
                  </a>
                  <a
                    href="mailto:hello@xrpl.to"
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px]",
                      isDark ? "text-white/60 hover:text-white hover:bg-white/5" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
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
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px]",
                      isDark ? "text-white/60 hover:text-white hover:bg-white/5" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
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
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-8">
              {/* Copy page button */}
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => copyToClipboard(window.location.href, 'page-url')}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px]",
                    isDark ? "text-white/50 hover:text-white/70 hover:bg-white/5" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  )}
                >
                  {copiedBlock === 'page-url' ? <><CheckCircle size={12} /> Copied</> : <><Copy size={12} /> Copy page</>}
                </button>
              </div>
              {renderContent()}
            </div>
          </div>

          {/* On this page - Right sidebar (desktop only) */}
          <div className={cn(
            "hidden xl:block w-[200px] pt-20 pr-4",
            isDark ? "border-white/[0.05]" : "border-gray-100"
          )}>
            <div className="sticky top-20">
              <div className={cn("text-[11px] font-medium uppercase tracking-wide mb-3", isDark ? "text-white/40" : "text-gray-500")}>
                On this page
              </div>
              <nav className="space-y-1">
                {(pageAnchors[currentSection] || []).map((anchor) => (
                  <a
                    key={anchor.id}
                    href={`#${anchor.id}`}
                    className={cn(
                      "block text-left text-[12px] py-1 transition-colors",
                      isDark ? "text-white/40 hover:text-white/70" : "text-gray-400 hover:text-gray-600"
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          >
            <div
              className={cn(
                "w-[90%] max-w-[800px] max-h-[80vh] overflow-hidden rounded-xl border-[1.5px]",
                isDark ? "bg-gray-900 border-white/10" : "bg-white border-gray-200"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={cn(
                "flex justify-between items-center px-4 py-3 border-b",
                isDark ? "border-white/10" : "border-gray-200"
              )}>
                <h3 className="text-[15px] font-medium">API Response</h3>
                <div className="flex items-center gap-1">
                  {copySuccess && (
                    <span className="flex items-center gap-1 text-emerald-500 text-[12px] mr-2">
                      <CheckCircle size={12} /> Copied
                    </span>
                  )}
                  <button
                    onClick={handleCopyResponse}
                    className={cn(
                      "p-2 rounded-lg",
                      isDark ? "hover:bg-white/10" : "hover:bg-gray-100"
                    )}
                  >
                    <Copy size={14} className="opacity-60" />
                  </button>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className={cn(
                      "p-2 rounded-lg",
                      isDark ? "hover:bg-white/10" : "hover:bg-gray-100"
                    )}
                  >
                    <X size={14} className="opacity-60" />
                  </button>
                </div>
              </div>

              <div className="overflow-auto max-h-[calc(80vh-56px)]">
                {isLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 size={20} className="animate-spin text-primary" />
                  </div>
                ) : apiResponse ? (
                  <pre
                    className={cn(
                      "text-[12px] font-mono p-4 m-0",
                      isDark ? "bg-black/40" : "bg-gray-50"
                    )}
                  >
                    {JSON.stringify(apiResponse, null, 2)}
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
