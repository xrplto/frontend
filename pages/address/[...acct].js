import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import styled from '@emotion/styled';
import { AppContext } from 'src/AppContext';
import { cn } from 'src/utils/cn';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
import TokenTabs from 'src/TokenDetail/components/TokenTabs';
import { addTokenToTabs } from 'src/hooks/useTokenTabs';
import { isValidClassicAddress } from 'ripple-address-codec';
import { fCurrency5, fDateTime } from 'src/utils/formatters';
import { getNftCoverUrl } from 'src/utils/parseUtils';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Wallet, Copy, ExternalLink, Coins, Image, Clock, ArrowDownLeft, ArrowUpRight, Code2, Check, AlertTriangle, ArrowLeftRight, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Filter } from 'lucide-react';

const ADDRESS_API_ENDPOINTS = [
  { label: 'Profile', url: 'https://api.xrpl.to/api/traders/{account}' },
  { label: 'Trustlines', url: 'https://api.xrpl.to/api/trustlines/{account}', params: 'limit, page, format' },
  { label: 'NFT Stats', url: 'https://api.xrpl.to/api/account/{account}/nfts', params: 'limit, page' },
  { label: 'Transactions', url: 'https://api.xrpl.to/api/account/{account}/transactions', params: 'limit, marker' }
];
import CryptoJS from 'crypto-js';

// Same wrapper as index.js for consistent width
const PageWrapper = styled.div`
  overflow: hidden;
  min-height: 100vh;
  margin: 0;
  padding: 0;
`;

const OverView = ({ account }) => {
  const { themeName, accountProfile, setOpenWalletModal } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const isOwnAccount = accountProfile?.account === account;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 960;
  const [data, setData] = useState(null);
  const [txHistory, setTxHistory] = useState([]);
  const [filteredTxHistory, setFilteredTxHistory] = useState([]);
  const [txFilter, setTxFilter] = useState('all');
  const [holdings, setHoldings] = useState(null);
  const [holdingsPage, setHoldingsPage] = useState(0);
  const [txPage, setTxPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedTx, setExpandedTx] = useState(null);
  const [aiExplanation, setAiExplanation] = useState({});
  const [aiLoading, setAiLoading] = useState({});
  const [showAllTokens, setShowAllTokens] = useState(false);
  const [tokenSearch, setTokenSearch] = useState('');
  const [hideZeroHoldings, setHideZeroHoldings] = useState(true);
  const [txSearch, setTxSearch] = useState('');
  const [activeTab, setActiveTab] = useState('tokens');
  const [xrpPrice, setXrpPrice] = useState(null);
  const [accountAI, setAccountAI] = useState(null);
  const [accountAILoading, setAccountAILoading] = useState(false);
  const [nftStats, setNftStats] = useState(null);
  const [accountInfo, setAccountInfo] = useState(null);
  const [nftCollections, setNftCollections] = useState([]);
  const [nftCollectionsLoading, setNftCollectionsLoading] = useState(false);
  const [selectedNftCollection, setSelectedNftCollection] = useState(null);
  const [collectionNfts, setCollectionNfts] = useState([]);
  const [collectionNftsLoading, setCollectionNftsLoading] = useState(false);
  const [nftTrades, setNftTrades] = useState([]);
  const [nftTradesLoading, setNftTradesLoading] = useState(false);
  const [historyView, setHistoryView] = useState('tokens');
  const [tokenHistory, setTokenHistory] = useState([]);
  const [tokenHistoryLoading, setTokenHistoryLoading] = useState(false);
  const [tokenHistoryCursor, setTokenHistoryCursor] = useState(null);
  const [tokenHistoryHasMore, setTokenHistoryHasMore] = useState(false);
  const [tokenHistoryType, setTokenHistoryType] = useState('all');
  const [tokenHistoryPairType, setTokenHistoryPairType] = useState('');
  const [nftCollectionStats, setNftCollectionStats] = useState([]);
  const [nftCollectionStatsLoading, setNftCollectionStatsLoading] = useState(false);
  const [nftHistory, setNftHistory] = useState([]);
  const [showApi, setShowApi] = useState(false);
  const [copiedApiIdx, setCopiedApiIdx] = useState(null);
    const [tokenHistoryPage, setTokenHistoryPage] = useState(0);
  const [nftTradesPage, setNftTradesPage] = useState(0);
  const ITEMS_PER_PAGE = 10;

  // Set XRP price from holdings data
  useEffect(() => {
    if (holdings?.xrp?.usd) {
      setXrpPrice(parseFloat(holdings.xrp.usd));
    }
  }, [holdings]);

  useEffect(() => {
    // Reset data and loading state when account changes
    setData(null);
    setTxHistory([]);
    setHoldings(null);
    setHoldingsPage(0);
    setTxPage(0);
    setTxSearch('');
    setTxFilter('all');
    setLoading(true);
    setAccountAI(null);
    setAccountAILoading(false);
    setNftStats(null);
    setNftCollections([]);
    setSelectedNftCollection(null);
    setCollectionNfts([]);
    setNftTrades([]);
    setNftCollectionStats([]);
    setNftHistory([]);

    const fetchData = async () => {
      try {
        // Fetch profile data, holdings, and NFT stats
        const [profileRes, holdingsRes, nftRes, balanceRes] = await Promise.all([
          axios.get(`https://api.xrpl.to/api/traders/${account}`).catch(() => ({ data: null })),
          axios.get(`https://api.xrpl.to/api/trustlines/${account}?limit=20&page=0&format=full`)
            .catch(() => axios.get(`https://api.xrpl.to/api/trustlines/${account}?limit=20&page=0`))
            .catch(() => ({ data: null })),
          axios.get(`https://api.xrpl.to/api/nft/analytics/trader/${account}`).catch(() => ({ data: null })),
          axios.get(`https://api.xrpl.to/api/account/balance/${account}`).catch(() => ({ data: null }))
        ]);

        const profile = profileRes.data || {};
        if (!profile.rank && balanceRes.data?.rank) profile.rank = balanceRes.data.rank;
        setData(profile.error ? { ...profile, rank: balanceRes.data?.rank } : profile);
        setHoldings(holdingsRes.data);
        setNftStats(nftRes.data);
        setAccountInfo(balanceRes.data);

      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [account]);

  // Add account to tabs
  useEffect(() => {
    if (account) {
      addTokenToTabs({
        slug: account,
        name: account.slice(0, 8) + '...',
        type: 'account'
      });
    }
  }, [account]);

  useEffect(() => {
    if (!account) return;
    const isInitialLoad = holdingsPage === 0 && !holdings;
    if (isInitialLoad) return;

    axios.get(`https://api.xrpl.to/api/trustlines/${account}?limit=20&page=${holdingsPage}&format=full`)
      .then(res => setHoldings(res.data))
      .catch(err => console.error('Failed to fetch holdings page:', err));
  }, [holdingsPage]);

  // Fetch NFT collections when tab changes to 'nfts'
  useEffect(() => {
    if (activeTab !== 'nfts' || !account || nftCollections.length > 0) return;
    setNftCollectionsLoading(true);
    axios.get(`https://api.xrpl.to/api/nft/account/${account}/nfts`)
      .then(res => {
        const cols = res.data?.collections || [];
        setNftCollections(cols.map(c => ({
          id: c._id || c.cid || c.id,
          name: c.name,
          slug: c.slug,
          logo: c.logoImage ? `https://s1.xrpl.to/nft-collection/${c.logoImage}` : '',
          count: c.count || 0,
          value: c.value || 0
        })));
      })
      .catch(err => console.error('Failed to fetch NFT collections:', err))
      .finally(() => setNftCollectionsLoading(false));
  }, [activeTab, account]);

  // Fetch NFT collection trading stats when NFTs tab is viewed
  useEffect(() => {
    if (activeTab !== 'nfts' || !account || nftCollectionStats.length > 0) return;
    setNftCollectionStatsLoading(true);
    axios.get(`https://api.xrpl.to/api/nft/analytics/trader/${account}/collections`)
      .then(res => setNftCollectionStats(res.data?.collections || []))
      .catch(() => setNftCollectionStats([]))
      .finally(() => setNftCollectionStatsLoading(false));
  }, [activeTab, account]);

  // Fetch NFT trading history when NFTs tab is viewed
  useEffect(() => {
    if (activeTab !== 'nfts' || !account || nftHistory.length > 0) return;
    axios.get(`https://api.xrpl.to/api/nft/analytics/trader/${account}/history?limit=90`)
      .then(res => setNftHistory(res.data?.history || []))
      .catch(() => setNftHistory([]));
  }, [activeTab, account]);

  // Fetch NFTs when a collection is selected
  useEffect(() => {
    if (!selectedNftCollection || !account) return;
    setCollectionNftsLoading(true);
    axios.get(`https://api.xrpl.to/api/nft/collections/${selectedNftCollection.slug}/nfts?limit=50&skip=0&owner=${account}`)
      .then(res => {
        const nfts = res.data?.nfts || [];
        setCollectionNfts(nfts.map(nft => ({
          id: nft._id || nft.NFTokenID,
          nftId: nft.NFTokenID || nft._id,
          name: nft.name || nft.meta?.name || 'Unnamed NFT',
          image: getNftCoverUrl(nft, 'large') || '',
          rarity: nft.rarity_rank || 0
        })));
      })
      .catch(err => console.error('Failed to fetch collection NFTs:', err))
      .finally(() => setCollectionNftsLoading(false));
  }, [selectedNftCollection, account]);

  // Fetch onchain history when onchain view is selected
  useEffect(() => {
    if (activeTab !== 'activity' || historyView !== 'onchain' || !account || txHistory.length > 0) return;
    axios.get(`https://api.xrpl.to/api/account/tx/${account}?limit=200`)
      .then(res => {
        if (res.data?.result === 'success' || res.data?.txs || res.data?.transactions) {
          const txs = res.data.txs || res.data.transactions || [];
          setTxHistory(txs);
          setFilteredTxHistory(txs);
        }
      })
      .catch(err => console.error('TX history fetch failed:', err));
  }, [activeTab, historyView, account]);

  // Fetch NFT trades when activity tab is viewed
  useEffect(() => {
    if (activeTab !== 'activity' || !account || nftTrades.length > 0) return;
    setNftTradesLoading(true);
    axios.get(`https://api.xrpl.to/api/nft/analytics/trader/${account}/trades?limit=50`)
      .then(res => setNftTrades(res.data?.trades || []))
      .catch(() => setNftTrades([]))
      .finally(() => setNftTradesLoading(false));
  }, [activeTab, account]);

  // Build token history URL with filters
  const buildTokenHistoryUrl = (cursor = null) => {
    let url = `https://api.xrpl.to/api/history?account=${account}&limit=50`;
    if (tokenHistoryType && tokenHistoryType !== 'all') url += `&type=${tokenHistoryType}`;
    if (tokenHistoryPairType) url += `&pairType=${tokenHistoryPairType}`;
    if (cursor) url += `&cursor=${cursor}`;
    return url;
  };

  // Fetch token history when tokens view is selected or filters change
  useEffect(() => {
    if (activeTab !== 'activity' || historyView !== 'tokens' || !account) return;
    setTokenHistoryLoading(true);
    axios.get(buildTokenHistoryUrl())
      .then(res => {
        setTokenHistory(res.data?.hists || []);
        setTokenHistoryCursor(res.data?.nextCursor || null);
        setTokenHistoryHasMore(!!res.data?.nextCursor);
      })
      .catch(err => console.error('Failed to fetch token history:', err))
      .finally(() => setTokenHistoryLoading(false));
  }, [activeTab, historyView, account, tokenHistoryType, tokenHistoryPairType]);

  const loadMoreTokenHistory = () => {
    if (!tokenHistoryCursor || tokenHistoryLoading) return;
    setTokenHistoryLoading(true);
    axios.get(buildTokenHistoryUrl(tokenHistoryCursor))
      .then(res => {
        setTokenHistory(prev => [...prev, ...(res.data?.hists || [])]);
        setTokenHistoryCursor(res.data?.nextCursor || null);
        setTokenHistoryHasMore(!!res.data?.nextCursor);
      })
      .catch(err => console.error('Failed to fetch more token history:', err))
      .finally(() => setTokenHistoryLoading(false));
  };

  useEffect(() => {
    let filtered = txHistory;

    // Filter by transaction type
    if (txFilter !== 'all') {
      filtered = filtered.filter(tx => {
        const txData = tx.tx_json || tx.tx || tx;
        return txData.TransactionType === txFilter;
      });
    }

    // Filter by search term
    if (txSearch.trim()) {
      const search = txSearch.toLowerCase().trim();
      filtered = filtered.filter(tx => {
        const txData = tx.tx_json || tx.tx || tx;
        const hash = (txData.hash || tx.hash || '').toLowerCase();
        const account = (txData.Account || '').toLowerCase();
        const destination = (txData.Destination || '').toLowerCase();
        const txType = (txData.TransactionType || '').toLowerCase();

        // Check amounts for currency
        const getCurrency = (amt) => {
          if (!amt) return '';
          if (typeof amt === 'string') return 'xrp';
          return (amt.currency || '').toLowerCase();
        };
        const amountCurr = getCurrency(txData.Amount);
        const sendMaxCurr = getCurrency(txData.SendMax);
        const takerGetsCurr = getCurrency(txData.TakerGets);
        const takerPaysCurr = getCurrency(txData.TakerPays);

        return hash.includes(search) ||
          account.includes(search) ||
          destination.includes(search) ||
          txType.includes(search) ||
          amountCurr.includes(search) ||
          sendMaxCurr.includes(search) ||
          takerGetsCurr.includes(search) ||
          takerPaysCurr.includes(search);
      });
    }

    setFilteredTxHistory(filtered);
    setTxPage(0);
  }, [txFilter, txSearch, txHistory]);

  const getAvailableTxTypes = () => {
    const types = new Set(['all']);
    txHistory.forEach(tx => {
      const txData = tx.tx_json || tx.tx || tx;
      if (txData.TransactionType) {
        types.add(txData.TransactionType);
      }
    });
    return Array.from(types);
  };

  // Decode hex currency
  const decodeCurrency = (code) => {
    if (!code || code === 'XRP') return 'XRP';
    if (code.length === 3) return code;
    try {
      const hex = code.replace(/0+$/, '');
      const decoded = Buffer.from(hex, 'hex').toString('utf8').replace(/\0/g, '');
      return decoded.match(/^[A-Za-z0-9]+$/) ? decoded : code.substring(0, 6);
    } catch { return code.substring(0, 6); }
  };

  // Parse transaction for simple list display (wallet.js style)
  const parseTx = (tx) => {
    const txData = tx.tx_json || tx.tx || tx;
    const meta = tx.meta;
    const type = txData.TransactionType;
    const isOutgoing = txData.Account === account;
    let label = type;
    let amount = '';
    let isDust = false;

    if (type === 'Payment') {
      const delivered = meta?.delivered_amount || txData.DeliverMax || txData.Amount;
      if (typeof delivered === 'string') {
        const xrpAmt = parseInt(delivered) / 1000000;
        amount = xrpAmt < 0.01 ? `${xrpAmt.toFixed(6)} XRP` : `${xrpAmt.toFixed(2)} XRP`;
        isDust = !isOutgoing && xrpAmt < 0.001;
      } else if (delivered?.value) {
        const val = parseFloat(delivered.value);
        const valStr = val >= 1 ? val.toFixed(2) : val >= 0.01 ? val.toFixed(4) : String(val);
        amount = `${valStr} ${decodeCurrency(delivered.currency)}`;
      }
      label = isOutgoing ? 'Sent' : 'Received';
    } else if (type === 'OfferCreate') {
      // Parse trade amounts from TakerGets/TakerPays
      const takerGets = txData.TakerGets;
      const takerPays = txData.TakerPays;

      // Format amount helper
      const formatAmt = (amt) => {
        if (!amt) return null;
        if (typeof amt === 'string') {
          const xrpAmt = parseInt(amt) / 1000000;
          return { value: xrpAmt, currency: 'XRP' };
        }
        return { value: parseFloat(amt.value), currency: decodeCurrency(amt.currency) };
      };

      const gets = formatAmt(takerGets);
      const pays = formatAmt(takerPays);

      if (gets && pays) {
        // Show what they're trading: selling gets for pays
        const fmtVal = (v) => v >= 1 ? v.toFixed(2) : v >= 0.01 ? v.toFixed(4) : String(v);
        label = `Trade`;
        amount = `${fmtVal(gets.value)} ${gets.currency} → ${fmtVal(pays.value)} ${pays.currency}`;
      } else {
        label = 'Trade';
      }
    } else if (type === 'NFTokenAcceptOffer') {
      const offerNode = meta?.AffectedNodes?.find(n => (n.DeletedNode || n.ModifiedNode)?.LedgerEntryType === 'NFTokenOffer');
      const offer = offerNode?.DeletedNode?.FinalFields || offerNode?.ModifiedNode?.FinalFields;
      const offerAmt = offer?.Amount;
      const isZeroAmount = !offerAmt || offerAmt === '0' || (typeof offerAmt === 'string' && parseInt(offerAmt) === 0);
      if (isZeroAmount) {
        const isSender = offer?.Owner === account;
        label = isSender ? 'Sent NFT' : 'Received NFT';
        amount = 'FREE';
      } else {
        const fmtVal = (v) => v >= 1 ? v.toFixed(2) : v >= 0.01 ? v.toFixed(4) : String(v);
        if (typeof offerAmt === 'string') {
          const xrpAmt = parseInt(offerAmt) / 1000000;
          amount = `${fmtVal(xrpAmt)} XRP`;
        } else if (offerAmt?.value) {
          amount = `${fmtVal(parseFloat(offerAmt.value))} ${decodeCurrency(offerAmt.currency)}`;
        }
        const isSeller = offer?.Owner === account;
        label = isSeller ? 'Sold NFT' : 'Bought NFT';
      }
    } else if (type === 'TrustSet') {
      label = 'Trustline';
    } else if (type === 'NFTokenMint') {
      label = 'Mint NFT';
    } else if (type === 'NFTokenCreateOffer') {
      label = 'NFT Offer';
    } else if (type === 'NFTokenCancelOffer') {
      label = 'Cancel Offer';
    } else if (type === 'NFTokenBurn') {
      label = 'Burn NFT';
    }

    const txId = txData.hash || tx.hash || txData.ctid || tx.ctid;
    return {
      id: txId,
      type: isOutgoing ? 'out' : 'in',
      label,
      amount,
      isDust,
      time: txData.date ? new Date((txData.date + 946684800) * 1000).toISOString() : '',
      hash: txId
    };
  };

  const handleAccountAI = async () => {
    if (accountAILoading || accountAI) return;
    setAccountAILoading(true);
    try {
      const res = await axios.get(`https://api.xrpl.to/api/account-tx-explain/${account}?limit=200`);
      setAccountAI(res.data);
    } catch (err) {
      setAccountAI({ error: 'Failed to analyze account activity' });
    } finally {
      setAccountAILoading(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="h-0" id="back-to-top-anchor" />
        <Header />
        {!isMobile && <TokenTabs currentMd5={account} />}
        <div className="mx-auto max-w-[1920px] px-4 mt-4">
          <div className="flex flex-col gap-4">
            {/* Header skeleton */}
            <div className="flex items-center gap-3">
              <div className={cn("h-6 w-48 rounded animate-pulse", isDark ? "bg-white/10" : "bg-gray-200")} />
              <div className={cn("h-5 w-5 rounded animate-pulse", isDark ? "bg-white/5" : "bg-gray-100")} />
            </div>
            {/* Metrics skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="space-y-2">
                  <div className={cn("h-3 w-16 rounded animate-pulse", isDark ? "bg-white/5" : "bg-gray-100")} />
                  <div className={cn("h-7 w-24 rounded animate-pulse", isDark ? "bg-white/10" : "bg-gray-200")} />
                  <div className={cn("h-3 w-20 rounded animate-pulse", isDark ? "bg-white/5" : "bg-gray-100")} />
                </div>
              ))}
            </div>
            {/* Holdings skeleton */}
            <div className={cn("rounded-xl border p-4", isDark ? "border-white/10" : "border-gray-200")}>
              <div className={cn("h-4 w-32 rounded animate-pulse mb-3", isDark ? "bg-white/10" : "bg-gray-200")} />
              {[1, 2, 3].map(i => (
                <div key={i} className={cn("h-10 rounded animate-pulse mb-2", isDark ? "bg-white/5" : "bg-gray-100")} />
              ))}
            </div>
          </div>
        </div>
        <ScrollToTop />
        <Footer />
      </PageWrapper>
    );
  }

  const winRate = data?.totalTrades > 0 ? ((data.winningTrades || 0) / data.totalTrades * 100) : 0;
  const totalPnL = data?.totalProfit || data?.profit || 0;
  const hasNoTradingData = !data || data.error;

  return (
    <PageWrapper>
      <div className="h-0" id="back-to-top-anchor" />
      <Header />
      {!isMobile && <TokenTabs currentMd5={account} />}
      <h1 style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
        {account} Profile on XRPL
      </h1>

      <div className="mx-auto max-w-[1920px] px-4 mt-4">
        <div className="flex flex-col">
          <div className="w-full">
            {/* Account Header */}
            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={cn("text-lg md:text-xl font-normal", isDark ? "text-white" : "text-gray-900")}>
                  <span className="hidden md:inline">{account}</span>
                  <span className="md:hidden">{account.substring(0, 6)}...{account.substring(account.length - 4)}</span>
                </h2>
                <button
                  onClick={() => navigator.clipboard.writeText(account)}
                  className={cn("p-1.5 rounded-lg transition-colors", isDark ? "text-white/40 hover:text-white/70 hover:bg-white/5" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100")}
                  title="Copy address"
                >
                  <Copy size={14} />
                </button>
                {typeof data?.washTradingScore === 'number' && (
                  <div className={cn("flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium border", data.washTradingScore > 50 ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : (isDark ? "bg-white/[0.03] text-white/60 border-white/10" : "bg-gray-100 text-gray-600 border-gray-200"))} title="Wash Trading Score - Higher values indicate potential wash trading activity">
                    {data.washTradingScore > 50 && <AlertTriangle size={10} />}
                    <span>Wash {data.washTradingScore}</span>
                  </div>
                )}
                {/* API Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowApi(!showApi)}
                    className={cn("flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors", isDark ? "text-[#3f96fe] border-[#3f96fe]/20 hover:bg-[#3f96fe]/10" : "text-cyan-600 border-cyan-200 hover:bg-cyan-50")}
                  >
                    <Code2 size={12} />
                    API
                  </button>
                  {showApi && (
                    <div className={cn('absolute top-full left-0 mt-2 p-3 rounded-xl border z-50 w-[300px]', isDark ? 'bg-black/95 backdrop-blur-xl border-[#3f96fe]/10 shadow-lg' : 'bg-white border-gray-200 shadow-lg')}>
                      <div className="text-[10px] uppercase tracking-wide mb-2" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>Address API Endpoints</div>
                      {ADDRESS_API_ENDPOINTS.map((ep, idx) => (
                        <div key={ep.label} className={cn("mb-2 p-2 rounded-lg", isDark ? "bg-white/[0.04]" : "bg-gray-100/50")}>
                          <div className="flex justify-between items-center mb-1">
                            <span className={cn("text-[11px] font-medium", isDark ? "text-white" : "text-gray-900")}>{ep.label}</span>
                            <button onClick={() => { navigator.clipboard.writeText(ep.url.replace('{account}', account)); setCopiedApiIdx(idx); setTimeout(() => setCopiedApiIdx(null), 1500); }} className={cn("p-1", copiedApiIdx === idx ? "text-emerald-500" : (isDark ? "text-white/40" : "text-gray-400"))}>
                              {copiedApiIdx === idx ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                          </div>
                          <code className={cn("text-[10px] break-all block", isDark ? "text-[#3f96fe]" : "text-cyan-600")}>{ep.url.replace('{account}', account)}</code>
                          {ep.params && <div className="text-[9px] mt-1" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>Params: {ep.params}</div>}
                        </div>
                      ))}
                      <a href="https://docs.xrpl.to" target="_blank" rel="noopener noreferrer" className={cn("block text-center text-[11px] mt-1", isDark ? "text-[#3f96fe]" : "text-cyan-600")}>Full API Docs →</a>
                    </div>
                  )}
                </div>
                <a
                  href={`https://xrpscan.com/account/${account}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn("p-1.5 rounded-lg transition-colors", isDark ? "text-white/40 hover:text-white/70 hover:bg-white/5" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100")}
                  title="View on XRPScan"
                >
                  <ExternalLink size={14} />
                </a>
                {data?.isAMM && (
                  <span className="text-[11px] h-5 px-2 rounded bg-[#3b82f6]/10 text-[#3b82f6] font-normal flex items-center">
                    AMM
                  </span>
                )}
                                {isOwnAccount && (
                  <button
                    onClick={() => setOpenWalletModal(true)}
                    className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <Wallet size={14} />
                    Manage
                  </button>
                )}
                {!accountAI && !accountAILoading && (
                  <button
                    onClick={handleAccountAI}
                    className="group flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#8b5cf6]/25 hover:border-[#8b5cf6]/40 bg-[#8b5cf6]/10 hover:bg-[#8b5cf6]/15 transition-all duration-200"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="text-[#a78bfa] group-hover:text-[#c4b5fd] transition-colors">
                      <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill="currentColor"/>
                      <path d="M19 16L19.5 18.5L22 19L19.5 19.5L19 22L18.5 19.5L16 19L18.5 18.5L19 16Z" fill="currentColor"/>
                    </svg>
                    <span className="text-[12px] text-[#c4b5fd] group-hover:text-[#ddd6fe] transition-colors">Explain with AI</span>
                  </button>
                )}
                {accountAILoading && (
                  <span className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#8b5cf6]/25 bg-[#8b5cf6]/10 text-[12px] text-[#c4b5fd]">
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Analyzing...
                  </span>
                )}
              </div>
              {data?.firstTradeDate && (
                <span className={cn("text-[12px] md:text-[13px] md:ml-auto", isDark ? "text-white/40" : "text-gray-400")}>
                  {fDateTime(data.firstTradeDate)} → {fDateTime(data.lastTradeDate)}
                </span>
              )}
            </div>

            {/* AI Analysis Panel */}
            {(accountAILoading || accountAI) && (
              <div className={cn("mb-4 p-4 rounded-xl border-[1.5px]", isDark ? "border-white/10" : "border-gray-200")}>
                {accountAILoading ? (
                  <div className="space-y-2.5">
                    {[95, 80, 88, 65, 92, 100, 70].map((w, i) => (
                      <div key={i} className="h-[6px] rounded-sm overflow-hidden relative" style={{ width: `${w}%` }}>
                        <div className="absolute inset-0 rounded-sm animate-pulse" style={{ background: i === 5 ? 'rgba(139,92,246,0.4)' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />
                      </div>
                    ))}
                    <p className={cn("mt-3 text-[12px]", isDark ? "text-white/50" : "text-gray-500")}>Analyzing account activity...</p>
                  </div>
                ) : accountAI?.error ? (
                  <p className="text-[13px] text-[#ef4444]">{accountAI.error}</p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={cn("px-2 py-1 rounded text-[11px] font-medium uppercase", accountAI.analysis?.profile === 'trader' ? "bg-[#3b82f6]/10 text-[#60a5fa]" : accountAI.analysis?.profile === 'bot' ? "bg-[#f59e0b]/10 text-[#fbbf24]" : accountAI.analysis?.profile === 'holder' ? "bg-[#22c55e]/10 text-[#4ade80]" : "bg-white/10 text-white/60")}>
                          {accountAI.analysis?.profile || 'User'}
                        </span>
                        <span className={cn("px-2 py-1 rounded text-[11px]", accountAI.analysis?.riskLevel === 'low' ? "bg-[#22c55e]/10 text-[#4ade80]" : accountAI.analysis?.riskLevel === 'medium' ? "bg-[#f59e0b]/10 text-[#fbbf24]" : "bg-[#ef4444]/10 text-[#f87171]")}>
                          {accountAI.analysis?.riskLevel || 'unknown'} risk
                        </span>
                        <span className={cn("text-[11px]", isDark ? "text-white/30" : "text-gray-400")}>{accountAI.period}</span>
                      </div>
                      <button onClick={() => setAccountAI(null)} className={cn("p-1.5 rounded-lg transition-colors", isDark ? "hover:bg-white/5 text-white/30" : "hover:bg-gray-100 text-gray-400")}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
                    </div>
                    <p className={cn("text-[14px] leading-relaxed", isDark ? "text-white/80" : "text-gray-700")}>{accountAI.analysis?.headline}</p>
                    {accountAI.analysis?.riskReason && (
                      <p className={cn("text-[12px]", isDark ? "text-white/50" : "text-gray-500")}>{accountAI.analysis.riskReason}</p>
                    )}
                    {accountAI.stats && (
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px]">
                        <div><span className={isDark ? "text-white/40" : "text-gray-400"}>Txns:</span> <span className={isDark ? "text-white/70" : "text-gray-600"}>{accountAI.txCount}</span></div>
                        <div><span className={isDark ? "text-white/40" : "text-gray-400"}>Success:</span> <span className="text-[#22c55e]">{accountAI.stats.successRate}%</span></div>
                        {accountAI.stats.tradeCount > 0 && <div><span className={isDark ? "text-white/40" : "text-gray-400"}>Trades:</span> <span className={isDark ? "text-white/70" : "text-gray-600"}>{accountAI.stats.tradeCount}</span></div>}
                        {accountAI.stats.swapCount > 0 && <div><span className={isDark ? "text-white/40" : "text-gray-400"}>Swaps:</span> <span className={isDark ? "text-white/70" : "text-gray-600"}>{accountAI.stats.swapCount}</span></div>}
                        <div><span className={isDark ? "text-white/40" : "text-gray-400"}>Fees:</span> <span className={isDark ? "text-white/70" : "text-gray-600"}>{accountAI.stats.totalFees} XRP</span></div>
                        {accountAI.stats.xrpNet !== 0 && <div><span className={isDark ? "text-white/40" : "text-gray-400"}>XRP Net:</span> <span className={accountAI.stats.xrpNet >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}>{accountAI.stats.xrpNet >= 0 ? '+' : ''}{accountAI.stats.xrpNet}</span></div>}
                        {accountAI.stats.tokens?.length > 0 && <div><span className={isDark ? "text-white/40" : "text-gray-400"}>Tokens:</span> <span className={isDark ? "text-white/70" : "text-gray-600"}>{accountAI.stats.tokens.slice(0, 5).join(', ')}{accountAI.stats.tokens.length > 5 ? ` +${accountAI.stats.tokens.length - 5}` : ''}</span></div>}
                      </div>
                    )}
                    {accountAI.analysis?.keyFindings?.length > 0 && (
                      <ul className="space-y-1.5">
                        {accountAI.analysis.keyFindings.map((f, i) => (
                          <li key={i} className={cn("text-[12px] flex items-start gap-2", isDark ? "text-white/60" : "text-gray-500")}>
                            <span className="text-[#8b5cf6]">•</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {accountAI.topAddresses?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <span className={cn("text-[11px]", isDark ? "text-white/30" : "text-gray-400")}>Top:</span>
                        {accountAI.topAddresses.slice(0, 3).map((a, i) => (
                          <Link key={i} href={`/address/${a.address}`} className={cn("text-[11px] px-2 py-0.5 rounded", isDark ? "bg-white/5 text-white/50 hover:text-white/70" : "bg-gray-100 text-gray-500 hover:text-gray-700")}>
                            {a.label || `${a.address.slice(0, 6)}...`} ({a.interactions})
                          </Link>
                        ))}
                      </div>
                    )}
                    <p className={cn("text-[10px] pt-2 border-t", isDark ? "border-white/5 text-white/30" : "border-gray-100 text-gray-400")}>{accountAI.disclaimer}</p>
                  </div>
                )}
              </div>
            )}

            {/* Account Not Activated */}
            {holdings?.accountActive === false && (
              <div className={cn("text-center py-10 mb-4 rounded-xl border", isDark ? "border-[#ef4444]/20 bg-[#ef4444]/5" : "border-red-200 bg-red-50")}>
                <div className={cn("w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center", isDark ? "bg-[#ef4444]/10" : "bg-red-100")}>
                  <Wallet size={20} className="text-[#ef4444]" />
                </div>
                <p className={cn("text-[15px] font-medium", "text-[#ef4444]")}>
                  Account not activated
                </p>
                <p className={cn("text-[13px] mt-1", isDark ? "text-white/40" : "text-gray-500")}>
                  This account has been deleted or was never funded
                </p>
              </div>
            )}

            {/* XRP Balance for accounts with no trading data */}
            {hasNoTradingData && holdings?.accountActive !== false && holdings?.accountData && (
              <div className={cn("mb-4 pb-4 border-b", isDark ? "border-white/10" : "border-gray-200")}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className={cn("text-[11px] uppercase tracking-wide mb-1", isDark ? "text-white/40" : "text-gray-400")}>XRP Balance</p>
                    <p className={cn("text-[1.3rem] font-medium", isDark ? "text-white" : "text-gray-900")}>
                      {fCurrency5(accountInfo?.total || holdings.accountData.balanceDrops / 1000000)}
                    </p>
                    <span className={cn("text-[12px]", isDark ? "text-white/40" : "text-gray-400")}>
                      {fCurrency5(accountInfo?.balance || holdings.accountData.spendableDrops / 1000000)} spendable
                    </span>
                  </div>
                  {accountInfo?.rank && (
                    <div className="text-right">
                      <p className={cn("text-[11px] uppercase tracking-wide mb-1", isDark ? "text-white/40" : "text-gray-400")}>XRP Rank</p>
                      <p className={cn("text-[1.3rem] font-medium", isDark ? "text-white" : "text-gray-900")}>#{accountInfo.rank.toLocaleString()}</p>
                    </div>
                  )}
                </div>
                <div className={cn("flex flex-wrap gap-x-4 gap-y-1 text-[11px]", isDark ? "text-white/40" : "text-gray-500")}>
                  {accountInfo?.reserve > 0 && <span>Reserve: {accountInfo.reserve} XRP</span>}
                  {accountInfo?.ownerCount > 0 && <span>Objects: {accountInfo.ownerCount}</span>}
                  {accountInfo?.inception && <span>Created: {new Date(accountInfo.inception).toLocaleDateString()}</span>}
                  {accountInfo?.domain && <a href={`https://${accountInfo.domain}`} target="_blank" rel="noopener noreferrer" className="text-[#3b82f6] hover:underline">{accountInfo.domain}</a>}
                </div>
              </div>
            )}

            {/* No Trading Data Message */}
            {hasNoTradingData && holdings?.accountActive !== false && (
              <div className={cn("text-center py-8 mb-4 rounded-xl border-[1.5px]", isDark ? "border-white/10" : "border-gray-200")}>
                <div className={cn("w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center", isDark ? "bg-white/5" : "bg-gray-100")}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isDark ? "text-white/30" : "text-gray-400"}>
                    <path d="M3 3v18h18M7 16l4-4 4 4 6-6" />
                  </svg>
                </div>
                <p className={cn("text-[14px]", isDark ? "text-white/50" : "text-gray-500")}>
                  No trading history
                </p>
              </div>
            )}

            {/* Summary Stats - Clean 4-box layout */}
            {(data || nftStats) && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className={cn("p-4 rounded-lg col-span-2 border-[1.5px]", isDark ? "border-white/10" : "border-gray-200")}>
                  <div className="flex items-center justify-between mb-1">
                    <p className={cn("text-[10px] uppercase tracking-wider", isDark ? "text-white/40" : "text-gray-500")}>Balance</p>
                    {accountInfo?.rank && <p className={cn("text-[10px] tabular-nums", isDark ? "text-white/30" : "text-gray-400")}>#{accountInfo.rank.toLocaleString()}</p>}
                  </div>
                  <div className="flex items-baseline gap-3">
                    <p className={cn("text-[22px] font-medium tabular-nums", isDark ? "text-white" : "text-gray-900")}>
                      {accountInfo?.total ?? (holdings?.accountData ? fCurrency5(holdings.accountData.balanceDrops / 1000000) : '—')} <span className={cn("text-[14px]", isDark ? "text-white/40" : "text-gray-400")}>XRP</span>
                    </p>
                    <div className={cn("flex items-center gap-2 text-[10px] flex-wrap", isDark ? "text-white/30" : "text-gray-400")}>
                      {accountInfo?.balance != null && <span>{fCurrency5(accountInfo.balance)} spendable</span>}
                      {accountInfo?.reserve > 0 && <span>· {Math.round(accountInfo.reserve * 100) / 100} reserved</span>}
                      {accountInfo?.inception && <span>· {new Date(accountInfo.inception).toLocaleDateString()}</span>}
                      {accountInfo?.domain && <a href={`https://${accountInfo.domain}`} target="_blank" rel="noopener noreferrer" className="text-[#3b82f6] hover:underline">· {accountInfo.domain}</a>}
                      {accountInfo?.parent && <span>· Activated: <a href={`/address/${accountInfo.parent}`} className="text-[#3b82f6] hover:underline">{accountInfo.parent.slice(0,6)}...</a></span>}
                    </div>
                  </div>
                </div>
                <div className={cn("p-4 rounded-lg border-[1.5px]", isDark ? "border-white/10" : "border-gray-200")}>
                  <p className={cn("text-[10px] uppercase tracking-wider mb-1", isDark ? "text-white/40" : "text-gray-500")}>Total P&L</p>
                  <p className={cn("text-[22px] font-medium tabular-nums", (totalPnL + (nftStats?.combinedProfit || 0)) >= 0 ? "text-[#22c55e]" : "text-[#ef4444]")}>
                    {(totalPnL + (nftStats?.combinedProfit || 0)) >= 0 ? '+' : ''}{fCurrency5(totalPnL + (nftStats?.combinedProfit || 0))} <span className="text-[14px] opacity-60">XRP</span>
                  </p>
                </div>
                <div className={cn("p-4 rounded-lg border-[1.5px]", isDark ? "border-white/10" : "border-gray-200")}>
                  <p className={cn("text-[10px] uppercase tracking-wider mb-1", isDark ? "text-white/40" : "text-gray-500")}>Total Trades</p>
                  <p className={cn("text-[22px] font-medium tabular-nums", isDark ? "text-white" : "text-gray-900")}>
                    {fCurrency5((data?.totalTrades || 0) + (nftStats?.totalTrades || 0))}
                  </p>
                </div>
                <div className={cn("p-4 rounded-lg border-[1.5px]", isDark ? "border-white/10" : "border-gray-200")}>
                  <p className={cn("text-[10px] uppercase tracking-wider mb-1", isDark ? "text-white/40" : "text-gray-500")}>Total Volume</p>
                  <p className={cn("text-[22px] font-medium tabular-nums", isDark ? "text-white" : "text-gray-900")}>
                    {fCurrency5((data?.dexVolume || 0) + (data?.ammVolume || 0) + (nftStats?.totalVolume || 0))} <span className={cn("text-[14px]", isDark ? "text-white/40" : "text-gray-400")}>XRP</span>
                  </p>
                </div>
              </div>
            )}

            {/* Two-column trading breakdown */}
            {(data || nftStats) && (
              <div className={cn("grid md:grid-cols-2 gap-4 mb-6")}>
                {/* Token Trading */}
                <div className={cn("p-5 rounded-xl border-[1.5px] h-full", isDark ? "border-white/10" : "border-gray-200")}>
                  {data && !data.error ? (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", isDark ? "bg-emerald-500/10" : "bg-emerald-50")}>
                            <Coins size={14} className="text-emerald-500" />
                          </div>
                          <span className={cn("text-[12px] font-semibold", isDark ? "text-white" : "text-gray-900")}>Token Trading</span>
                        </div>
                        <div className={cn("flex items-center gap-2 px-2 py-1 rounded-lg text-[10px]", isDark ? "bg-white/[0.05]" : "bg-gray-100/50")}>
                          <span className="text-emerald-500 tabular-nums">{fCurrency5(data.buyCount || 0)}</span>
                          <span className={isDark ? "text-white/20" : "text-gray-300"}>|</span>
                          <span className="text-red-500 tabular-nums">{fCurrency5(data.sellCount || 0)}</span>
                        </div>
                      </div>
                      <div className="flex items-center mb-4">
                        {[
                          { label: 'P&L', value: fCurrency5(totalPnL), color: totalPnL >= 0 ? 'text-emerald-500' : 'text-red-500' },
                          { label: 'ROI', value: `${(data.roi || 0).toFixed(1)}%`, color: (data.roi || 0) >= 0 ? 'text-emerald-500' : 'text-red-500' },
                          { label: 'WIN', value: `${winRate.toFixed(0)}%`, color: isDark ? 'text-white' : 'text-gray-900' },
                          { label: 'VOL', value: fCurrency5((data.dexVolume || 0) + (data.ammVolume || 0)), color: isDark ? 'text-white' : 'text-gray-900' }
                        ].map((s, i, arr) => (
                          <div key={s.label} className="flex items-center flex-1">
                            <div className="p-2.5 text-center flex-1">
                              <p className={cn("text-[9px] uppercase tracking-wider mb-0.5", isDark ? "text-white/30" : "text-gray-400")}>{s.label}</p>
                              <p className={cn("text-[15px] font-semibold tabular-nums", s.color)}>{s.value}</p>
                            </div>
                            {i < arr.length - 1 && <div className={cn("w-px h-8", isDark ? "bg-white/10" : "bg-gray-200")} />}
                          </div>
                        ))}
                      </div>
                      <div className={cn("flex items-center justify-between pt-3 text-[10px]", isDark ? "border-t border-white/[0.06]" : "border-t border-gray-100")}>
                        <div className="flex items-center gap-3">
                          <span><span className={isDark ? "text-white/30" : "text-gray-400"}>DEX</span> <span className={cn("tabular-nums font-medium", (data.dexProfit || 0) >= 0 ? "text-emerald-500" : "text-red-500")}>{(data.dexProfit || 0) >= 0 ? '+' : ''}{fCurrency5(data.dexProfit || 0)}</span></span>
                          <span><span className={isDark ? "text-white/30" : "text-gray-400"}>AMM</span> <span className={cn("tabular-nums font-medium", (data.ammProfit || 0) >= 0 ? "text-emerald-500" : "text-red-500")}>{(data.ammProfit || 0) >= 0 ? '+' : ''}{fCurrency5(data.ammProfit || 0)}</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                          {[
                            { label: '24H', value: data.profit24h || 0 },
                            { label: '7D', value: data.profit7d || 0 },
                            { label: '30D', value: data.profit30d || 0 },
                            { label: 'ALL', value: data.profit || 0 }
                          ].map(p => (
                            <span key={p.label}><span className={isDark ? "text-white/25" : "text-gray-300"}>{p.label}</span> <span className={cn("tabular-nums", p.value >= 0 ? "text-emerald-500" : "text-red-500")}>{p.value >= 0 ? '+' : ''}{fCurrency5(p.value)}</span></span>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full min-h-[180px]">
                      <div className={cn("w-10 h-10 mb-3 rounded-xl flex items-center justify-center", isDark ? "bg-emerald-500/10" : "bg-emerald-50")}>
                        <Coins size={18} className={isDark ? "text-emerald-500/50" : "text-emerald-400"} />
                      </div>
                      <p className={cn("text-[11px] font-semibold tracking-wide mb-0.5", isDark ? "text-white/60" : "text-gray-600")}>No Token Trades</p>
                      <p className={cn("text-[10px]", isDark ? "text-white/25" : "text-gray-400")}>Activity will appear here</p>
                    </div>
                  )}
                </div>

                {/* NFT Trading */}
                <div className={cn("p-5 rounded-xl border-[1.5px] h-full", isDark ? "border-white/10" : "border-gray-200")}>
                  {nftStats && (nftStats.totalVolume > 0 || nftStats.holdingsCount > 0) ? (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", isDark ? "bg-violet-500/10" : "bg-violet-50")}>
                            <Image size={14} className="text-violet-500" />
                          </div>
                          <span className={cn("text-[12px] font-semibold", isDark ? "text-white" : "text-gray-900")}>NFT Trading</span>
                          {nftStats.holdingsCount > 0 && <span className={cn("text-[9px] px-1.5 py-0.5 rounded-md font-medium", isDark ? "bg-violet-500/10 text-violet-400" : "bg-violet-50 text-violet-500")}>{nftStats.holdingsCount} held</span>}
                        </div>
                        <div className={cn("flex items-center gap-2 px-2 py-1 rounded-lg text-[10px]", isDark ? "bg-white/[0.05]" : "bg-gray-100/50")}>
                          <span className="text-emerald-500 tabular-nums">{fCurrency5(nftStats.buyCount || 0)}</span>
                          <span className={isDark ? "text-white/20" : "text-gray-300"}>|</span>
                          <span className="text-red-500 tabular-nums">{fCurrency5(nftStats.sellCount || 0)}</span>
                        </div>
                      </div>
                      <div className="flex items-center mb-4">
                        {[
                          { label: 'REALIZED', value: fCurrency5(nftStats.profit || 0), color: (nftStats.profit || 0) >= 0 ? 'text-emerald-500' : 'text-red-500' },
                          { label: 'UNREAL', value: fCurrency5(nftStats.unrealizedProfit || 0), color: (nftStats.unrealizedProfit || 0) === 0 ? (isDark ? 'text-white' : 'text-gray-900') : (nftStats.unrealizedProfit || 0) > 0 ? 'text-emerald-500' : 'text-amber-500' },
                          { label: 'ROI', value: `${(nftStats.roi || 0).toFixed(1)}%`, color: (nftStats.roi || 0) >= 0 ? 'text-emerald-500' : 'text-red-500' },
                          { label: 'WIN', value: `${(nftStats.winRate || 0).toFixed(0)}%`, color: isDark ? 'text-white' : 'text-gray-900' },
                          { label: 'VOL', value: fCurrency5(nftStats.totalVolume || 0), color: isDark ? 'text-white' : 'text-gray-900' },
                          ...(nftStats.holdingsCount > 0 ? [{ label: 'VALUE', value: fCurrency5(nftStats.holdingsValue || 0), color: isDark ? 'text-white' : 'text-gray-900', subLabel: 'COST', subValue: fCurrency5(nftStats.holdingsCost || 0) }] : [])
                        ].map((s, i, arr) => (
                          <div key={s.label} className="flex items-center flex-1">
                            <div className="p-2.5 text-center flex-1">
                              <p className={cn("text-[9px] uppercase tracking-wider mb-0.5", isDark ? "text-white/30" : "text-gray-400")}>{s.label}</p>
                              <p className={cn("text-[15px] font-semibold tabular-nums", s.color)}>{s.value}</p>
                              {s.subLabel && <p className={cn("text-[8px] uppercase tracking-wider mt-1", isDark ? "text-white/20" : "text-gray-300")}>{s.subLabel} <span className={cn("tabular-nums", isDark ? "text-white/40" : "text-gray-500")}>{s.subValue}</span></p>}
                            </div>
                            {i < arr.length - 1 && <div className={cn("w-px h-8", isDark ? "bg-white/10" : "bg-gray-200")} />}
                          </div>
                        ))}
                      </div>
                      <div className={cn("flex items-center justify-between pt-3 text-[10px]", isDark ? "border-t border-white/[0.06]" : "border-t border-gray-100")}>
                        <div className="flex items-center gap-3">
                          <span><span className={isDark ? "text-white/30" : "text-gray-400"}>FLIPS</span> <span className={cn("tabular-nums font-medium", isDark ? "text-white/70" : "text-gray-600")}>{nftStats.flips || 0}</span></span>
                          <span><span className={isDark ? "text-white/30" : "text-gray-400"}>HOLD</span> <span className={cn("tabular-nums font-medium", isDark ? "text-white/70" : "text-gray-600")}>{(nftStats.avgHoldingDays || 0).toFixed(0)}d</span></span>
                          {nftStats.collections?.slice(0, 2).map(c => (
                            <a key={c.slug} href={`/collection/${c.slug}`} className={cn("flex items-center gap-1 transition-colors", isDark ? "text-white/40 hover:text-white/60" : "text-gray-400 hover:text-gray-600")}>
                              {c.logo && <img src={`https://s1.xrpl.to/nft-collection/${c.logo}`} className="w-3 h-3 rounded" alt="" />}
                              <span className={isDark ? "text-white/40" : "text-gray-500"}>{c.name?.slice(0, 6)}</span>
                              <span className={cn("tabular-nums", (c.profit || 0) >= 0 ? "text-emerald-500" : "text-red-500")}>{(c.profit || 0) >= 0 ? '+' : ''}{fCurrency5(c.profit || 0)}</span>
                            </a>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          {[
                            { label: '24H', value: nftStats.profit24h || 0 },
                            { label: '7D', value: nftStats.profit7d || 0 },
                            { label: '30D', value: nftStats.profit30d || 0 },
                            { label: 'ALL', value: nftStats.profitAll || nftStats.profit || 0 }
                          ].map(p => (
                            <span key={p.label}><span className={isDark ? "text-white/25" : "text-gray-300"}>{p.label}</span> <span className={cn("tabular-nums", p.value >= 0 ? "text-emerald-500" : "text-red-500")}>{p.value >= 0 ? '+' : ''}{fCurrency5(p.value)}</span></span>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="relative w-14 h-14 mb-4">
                        {/* Ears */}
                        <div className={cn("absolute -top-0.5 left-0.5 w-4 h-4 rounded-full", isDark ? "bg-[#4285f4]" : "bg-blue-400")} />
                        <div className={cn("absolute -top-0.5 right-0.5 w-4 h-4 rounded-full", isDark ? "bg-[#4285f4]" : "bg-blue-400")} />
                        <div className={cn("absolute top-0.5 left-1.5 w-2 h-2 rounded-full", isDark ? "bg-[#3b78e7]" : "bg-blue-500")} />
                        <div className={cn("absolute top-0.5 right-1.5 w-2 h-2 rounded-full", isDark ? "bg-[#3b78e7]" : "bg-blue-500")} />
                        {/* Face */}
                        <div className={cn("absolute top-2 left-1/2 -translate-x-1/2 w-11 h-11 rounded-full", isDark ? "bg-[#4285f4]" : "bg-blue-400")}>
                          {/* Eyes */}
                          <div className="absolute top-3 left-2 w-1.5 h-1.5 rounded-full bg-[#0a0a0a] rotate-[-10deg]" />
                          <div className="absolute top-3 right-2 w-1.5 h-1.5 rounded-full bg-[#0a0a0a] rotate-[10deg]" />
                          {/* Snout */}
                          <div className={cn("absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-2.5 rounded-full", isDark ? "bg-[#5a9fff]" : "bg-blue-300")}>
                            <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1 rounded-full bg-[#0a0a0a]" />
                          </div>
                          {/* Frown */}
                          <div className={cn("absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-1 rounded-t-full border-t border-l border-r", isDark ? "border-[#0a0a0a]" : "border-blue-600")} />
                        </div>
                        {/* Scanlines */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-11 h-11 flex flex-col justify-start gap-[2px] pointer-events-none overflow-hidden rounded-full">
                          {[...Array(10)].map((_, i) => (
                            <div key={i} className={cn("h-[2px] w-full", isDark ? "bg-[#0a0a0a]/40" : "bg-white/40")} />
                          ))}
                        </div>
                      </div>
                      <p className={cn("text-xs font-medium tracking-widest mb-1", isDark ? "text-white/80" : "text-gray-600")}>NO NFT TRADES</p>
                      <p className={cn("text-[10px]", isDark ? "text-white/30" : "text-gray-400")}>NFT trading activity will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-2 mb-6">
              {[
                { id: 'tokens', label: 'TOKENS', icon: Coins, count: holdings?.total || 0 },
                { id: 'nfts', label: 'NFTS', icon: Image, count: nftStats?.holdingsCount || 0 },
                { id: 'activity', label: 'HISTORY', icon: Clock }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 text-[12px] font-medium tracking-wider rounded-md border transition-all",
                    activeTab === tab.id
                      ? cn(isDark ? "border-white/20 text-white" : "border-gray-300 text-gray-900")
                      : cn(isDark ? "border-white/10 text-white/40 hover:text-white/60 hover:border-white/15" : "border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300")
                  )}
                >
                  <tab.icon size={15} strokeWidth={1.5} />
                  {tab.label}
                  <span className={cn("text-[11px]", activeTab === tab.id ? (isDark ? "text-white/50" : "text-gray-500") : (isDark ? "text-white/20" : "text-gray-400"))}>{tab.count}</span>
                </button>
              ))}
            </div>

            {/* Tokens Tab */}
            {activeTab === 'tokens' && (
              <>
                {/* Holdings */}
                {holdings && holdings.accountActive !== false && (() => {
                  const filteredLines = hideZeroHoldings
                    ? holdings.lines?.filter(l => parseFloat(l.balance) !== 0) || []
                    : holdings.lines || [];
                  const zeroCount = (holdings.lines?.length || 0) - filteredLines.length;
                  const totalValue = filteredLines.reduce((sum, l) => sum + (l.value || 0), 0);

                  return (
                    <div className={cn("rounded-xl border-[1.5px] mb-6 overflow-hidden", isDark ? "border-white/10" : "border-gray-200")}>
                      <div className={cn("flex items-center justify-between px-4 py-3", isDark ? "border-b border-white/10" : "border-b border-gray-100")}>
                        <div className="flex items-center gap-3">
                          <span className={cn("text-[13px] font-medium", isDark ? "text-white" : "text-gray-900")}>
                            Holdings <span className={cn("font-normal ml-1", isDark ? "text-white/30" : "text-gray-400")}>{holdings.total}</span>
                          </span>
                          {zeroCount > 0 && (
                            <button
                              onClick={() => setHideZeroHoldings(!hideZeroHoldings)}
                              className={cn("text-[10px] px-2.5 py-1 rounded-full transition-all duration-200", hideZeroHoldings ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" : (isDark ? "bg-white/[0.04] text-white/40 hover:bg-white/[0.08]" : "bg-gray-100 text-gray-500 hover:bg-gray-200"))}
                            >
                              {hideZeroHoldings ? `+${zeroCount} hidden` : 'Hide empty'}
                            </button>
                          )}
                        </div>
                        {filteredLines.length > 0 && (
                          <div className="flex items-baseline gap-1.5">
                              <span className={cn("text-[20px] font-semibold tabular-nums tracking-tight", isDark ? "text-white" : "text-gray-900")}>{fCurrency5(totalValue + (holdings.accountData?.balanceDrops || 0) / 1000000)}</span>
                              <span className={cn("text-[11px] font-medium", isDark ? "text-white/30" : "text-gray-400")}>XRP</span>
                            </div>
                        )}
                      </div>
                      <div className="px-4 py-4">
                      {filteredLines.length > 0 ? (
                        <div className="space-y-0">
                          {/* Table Header */}
                          <div className="grid px-3 py-2.5 mb-1" style={{ gridTemplateColumns: '2fr 1.1fr 0.7fr 1.1fr 1.1fr' }}>
                            <span className={cn("text-[10px] uppercase tracking-wider font-medium", isDark ? "text-white/40" : "text-gray-500")}>Token</span>
                            <span className={cn("text-[10px] uppercase tracking-wider font-medium text-right", isDark ? "text-white/40" : "text-gray-500")}>Price</span>
                            <span className={cn("text-[10px] uppercase tracking-wider font-medium text-right", isDark ? "text-white/40" : "text-gray-500")}>24h</span>
                            <span className={cn("text-[10px] uppercase tracking-wider font-medium text-right", isDark ? "text-white/40" : "text-gray-500")}>Balance</span>
                            <span className={cn("text-[10px] uppercase tracking-wider font-medium text-right", isDark ? "text-white/40" : "text-gray-500")}>Value</span>
                          </div>
                          {/* XRP Row */}
                          {holdings.accountData?.balanceDrops > 0 && (
                            <Link href="/token/xrpl-xrp" className={cn("grid px-3 py-3.5 items-center rounded-lg transition-all duration-200 group border-b", isDark ? "hover:bg-white/[0.03] border-white/[0.04]" : "hover:bg-gray-50 border-gray-100")} style={{ gridTemplateColumns: '2fr 1.1fr 0.7fr 1.1fr 1.1fr' }}>
                              <div className="flex items-center gap-3">
                                <div className={cn("w-8 h-8 rounded-full overflow-hidden ring-2 transition-all duration-200", isDark ? "ring-white/[0.06] group-hover:ring-white/[0.12]" : "ring-gray-100 group-hover:ring-gray-200")}>
                                  <img src="https://s1.xrpl.to/token/84e5efeb89c4eae8f68188982dc290d8" className="w-full h-full object-cover" alt="" />
                                </div>
                                <span className={cn("text-[13px] font-medium group-hover:text-[#4285f4] transition-colors", isDark ? "text-white" : "text-gray-900")}>XRP</span>
                              </div>
                              <span className={cn("text-[13px] text-right tabular-nums", isDark ? "text-white/50" : "text-gray-500")}>{xrpPrice ? `$${parseFloat(xrpPrice).toFixed(4)}` : '—'}</span>
                              <span className={cn("text-[12px] text-right tabular-nums font-medium", holdings?.xrp?.pro24h >= 0 ? "text-emerald-400" : "text-red-400")}>{holdings?.xrp?.pro24h ? `${holdings.xrp.pro24h >= 0 ? '+' : ''}${holdings.xrp.pro24h.toFixed(1)}%` : '—'}</span>
                              <span className={cn("text-[13px] text-right tabular-nums", isDark ? "text-white/50" : "text-gray-500")}>{fCurrency5(holdings.accountData.balanceDrops / 1000000)}</span>
                              <span className={cn("text-[13px] text-right tabular-nums font-semibold", isDark ? "text-white" : "text-gray-900")}>{xrpPrice ? `$${fCurrency5((holdings.accountData.balanceDrops / 1000000) * xrpPrice)}` : `${fCurrency5(holdings.accountData.balanceDrops / 1000000)} XRP`}</span>
                            </Link>
                          )}
                          {/* Table Rows */}
                          {filteredLines.map((line, idx) => {
                            const priceInXrp = line.token?.exch || 0;
                            const change24h = line.token?.pro24h || 0;
                            const pctOwned = line.percentOwned || 0;
                            return (
                              <div key={idx} className={cn("grid px-3 py-3.5 items-center rounded-lg transition-all duration-200 group", isDark ? "hover:bg-white/[0.03]" : "hover:bg-gray-50", idx < filteredLines.length - 1 && (isDark ? "border-b border-white/[0.04]" : "border-b border-gray-100"))} style={{ gridTemplateColumns: '2fr 1.1fr 0.7fr 1.1fr 1.1fr' }}>
                                <Link href={`/token/${line.token?.md5}`} className="flex items-center gap-3">
                                  <div className={cn("w-8 h-8 rounded-full overflow-hidden ring-2 transition-all duration-200 flex-shrink-0", isDark ? "ring-white/[0.06] group-hover:ring-white/[0.12]" : "ring-gray-100 group-hover:ring-gray-200")}>
                                    <img src={`https://s1.xrpl.to/token/${line.token?.md5}`} className="w-full h-full object-cover" onError={(e) => { e.target.parentElement.style.display = 'none'; }} alt="" />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className={cn("text-[13px] font-medium group-hover:text-[#4285f4] transition-colors truncate", isDark ? "text-white" : "text-gray-900")}>{line.token?.name || line.currency}</span>
                                      {line.token?.verified >= 1 && <span className={cn("px-1.5 py-0.5 rounded-md text-[9px] font-medium flex-shrink-0", isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600")}>Verified</span>}
                                    </div>
                                    {pctOwned > 0.01 && <span className={cn("text-[10px]", isDark ? "text-white/30" : "text-gray-400")}>{pctOwned.toFixed(2)}% supply</span>}
                                  </div>
                                </Link>
                                <span className={cn("text-[13px] text-right tabular-nums", isDark ? "text-white/50" : "text-gray-500")}>{priceInXrp ? `${fCurrency5(priceInXrp)}` : '—'}</span>
                                <span className={cn("text-[12px] text-right tabular-nums font-medium", change24h >= 0 ? "text-emerald-400" : "text-red-400")}>{change24h ? `${change24h >= 0 ? '+' : ''}${change24h.toFixed(1)}%` : '—'}</span>
                                <span className={cn("text-[13px] text-right tabular-nums", isDark ? "text-white/50" : "text-gray-500")}>{fCurrency5(Math.abs(parseFloat(line.balance)))}</span>
                                <span className={cn("text-[13px] text-right tabular-nums font-semibold", isDark ? "text-white" : "text-gray-900")}>{fCurrency5(line.value)} XRP</span>
                              </div>
                            );
                          })}
                          {/* Pagination */}
                          <div className={cn("flex items-center justify-end gap-1 mt-4 pt-4 border-t", isDark ? "border-white/[0.04]" : "border-gray-100")}>
                            <button onClick={() => setHoldingsPage(Math.max(0, holdingsPage - 1))} disabled={holdingsPage === 0} className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-[14px] transition-all duration-200", holdingsPage === 0 ? (isDark ? "text-white/10" : "text-gray-200") : (isDark ? "text-white/40 hover:bg-white/[0.04] hover:text-white/70" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"))}>‹</button>
                            <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-[12px] tabular-nums font-medium", isDark ? "bg-white/[0.04] text-white/60" : "bg-gray-100 text-gray-600")}>{holdingsPage + 1}</span>
                            <button onClick={() => setHoldingsPage(holdingsPage + 1)} disabled={holdingsPage >= Math.ceil(holdings.total / 20) - 1} className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-[14px] transition-all duration-200", holdingsPage >= Math.ceil(holdings.total / 20) - 1 ? (isDark ? "text-white/10" : "text-gray-200") : (isDark ? "text-white/40 hover:bg-white/[0.04] hover:text-white/70" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"))}>›</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8">
                          <div className="relative w-14 h-14 mb-4">
                            <div className={cn("absolute -top-0.5 left-0.5 w-4 h-4 rounded-full", isDark ? "bg-[#4285f4]" : "bg-blue-400")} />
                            <div className={cn("absolute -top-0.5 right-0.5 w-4 h-4 rounded-full", isDark ? "bg-[#4285f4]" : "bg-blue-400")} />
                            <div className={cn("absolute top-0.5 left-1.5 w-2 h-2 rounded-full", isDark ? "bg-[#3b78e7]" : "bg-blue-500")} />
                            <div className={cn("absolute top-0.5 right-1.5 w-2 h-2 rounded-full", isDark ? "bg-[#3b78e7]" : "bg-blue-500")} />
                            <div className={cn("absolute top-2 left-1/2 -translate-x-1/2 w-11 h-11 rounded-full", isDark ? "bg-[#4285f4]" : "bg-blue-400")}>
                              <div className="absolute top-3 left-2 w-1.5 h-1.5 rounded-full bg-[#0a0a0a] rotate-[-10deg]" />
                              <div className="absolute top-3 right-2 w-1.5 h-1.5 rounded-full bg-[#0a0a0a] rotate-[10deg]" />
                              <div className={cn("absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-2.5 rounded-full", isDark ? "bg-[#5a9fff]" : "bg-blue-300")}>
                                <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1 rounded-full bg-[#0a0a0a]" />
                              </div>
                              <div className={cn("absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-1 rounded-t-full border-t border-l border-r", isDark ? "border-[#0a0a0a]" : "border-blue-600")} />
                            </div>
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-11 h-11 flex flex-col justify-start gap-[2px] pointer-events-none overflow-hidden rounded-full">
                              {[...Array(10)].map((_, i) => (
                                <div key={i} className={cn("h-[2px] w-full", isDark ? "bg-[#0a0a0a]/40" : "bg-white/40")} />
                              ))}
                            </div>
                          </div>
                          <p className={cn("text-xs font-medium tracking-widest mb-1", isDark ? "text-white/80" : "text-gray-600")}>{hideZeroHoldings ? 'NO TOKENS WITH BALANCE' : 'NO TOKEN HOLDINGS'}</p>
                          <p className={cn("text-[10px]", isDark ? "text-white/30" : "text-gray-400")}>Token holdings will appear here</p>
                        </div>
                      )}
                      </div>
                    </div>
                  );
                })()}

                {/* Trading Performance */}
                {data?.tokenPerformance?.length > 0 && (() => {
                  const filteredTokens = data.tokenPerformance.filter(t =>
                    !tokenSearch || t.name?.toLowerCase().includes(tokenSearch.toLowerCase())
                  );
                  const displayTokens = showAllTokens ? filteredTokens : filteredTokens.slice(0, 10);
                  const totalCount = data.totalTokensTraded || data.tokenPerformance.length;
                  const maxRoi = Math.max(...filteredTokens.map(t => Math.abs(t.roi || 0)), 100);
                  const maxProfit = Math.max(...filteredTokens.map(t => Math.abs(t.profit || 0)), 1);

                  return (
                    <div className={cn("rounded-xl border-[1.5px] mb-6 overflow-hidden", isDark ? "border-white/10" : "border-gray-200")}>
                      <div className={cn("flex items-center justify-between px-4 py-3", isDark ? "border-b border-white/10" : "border-b border-gray-100")}>
                        <span className={cn("text-[13px] font-medium", isDark ? "text-white" : "text-gray-900")}>
                          Trading Performance <span className={cn("font-normal ml-1", isDark ? "text-white/30" : "text-gray-400")}>{totalCount}</span>
                        </span>
                        <div className={cn("flex items-center rounded-lg overflow-hidden", isDark ? "bg-white/[0.04]" : "bg-gray-100")}>
                          <input
                            type="text"
                            placeholder="Search tokens..."
                            value={tokenSearch}
                            onChange={(e) => setTokenSearch(e.target.value)}
                            className={cn(
                              "text-[12px] px-3 py-2 bg-transparent border-none outline-none w-36",
                              isDark ? "text-white/70 placeholder:text-white/30" : "text-gray-600 placeholder:text-gray-400"
                            )}
                          />
                        </div>
                      </div>
                      {/* Table */}
                      <div className="px-5 py-4 overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr>
                              <th className={cn("py-2.5 pr-3 text-left text-[10px] font-medium uppercase tracking-wider rounded-l-lg", isDark ? "text-white/40 bg-white/[0.02]" : "text-gray-500 bg-gray-50")}>Token</th>
                              <th className={cn("py-2.5 px-3 text-right text-[10px] font-medium uppercase tracking-wider", isDark ? "text-white/40 bg-white/[0.02]" : "text-gray-500 bg-gray-50")}>Volume</th>
                              <th className={cn("py-2.5 px-3 text-right text-[10px] font-medium uppercase tracking-wider", isDark ? "text-white/40 bg-white/[0.02]" : "text-gray-500 bg-gray-50")}>Trades</th>
                              <th className={cn("py-2.5 px-3 text-right text-[10px] font-medium uppercase tracking-wider", isDark ? "text-emerald-400/60 bg-white/[0.02]" : "text-emerald-600/70 bg-gray-50")}>Bought</th>
                              <th className={cn("py-2.5 px-3 text-right text-[10px] font-medium uppercase tracking-wider", isDark ? "text-red-400/60 bg-white/[0.02]" : "text-red-600/70 bg-gray-50")}>Sold</th>
                              <th className={cn("py-2.5 px-3 text-right text-[10px] font-medium uppercase tracking-wider", isDark ? "text-white/40 bg-white/[0.02]" : "text-gray-500 bg-gray-50")}>ROI</th>
                              <th className={cn("py-2.5 px-3 text-right text-[10px] font-medium uppercase tracking-wider", isDark ? "text-white/40 bg-white/[0.02]" : "text-gray-500 bg-gray-50")}>PNL</th>
                              <th className={cn("py-2.5 pl-3 text-right text-[10px] font-medium uppercase tracking-wider rounded-r-lg", isDark ? "text-white/40 bg-white/[0.02]" : "text-gray-500 bg-gray-50")}>Period</th>
                            </tr>
                          </thead>
                          <tbody>
                            {displayTokens.map((token, idx) => {
                              const roi = token.roi || 0;
                              const profit = token.profit || 0;
                              const bought = token.xrpBought || 0;
                              const sold = token.xrpSold || 0;
                              return (
                                <tr key={idx} className={cn("group transition-all duration-200 border-b", isDark ? "hover:bg-white/[0.02] border-white/[0.04] last:border-transparent" : "hover:bg-gray-50 border-gray-100 last:border-transparent")}>
                                  <td className="py-3.5 pr-3">
                                    <Link href={`/token/${token.tokenId}`} className="flex items-center gap-2.5">
                                      <div className={cn("w-7 h-7 rounded-full overflow-hidden ring-2 transition-all duration-200 flex-shrink-0", isDark ? "ring-white/[0.06] group-hover:ring-white/[0.12]" : "ring-gray-100 group-hover:ring-gray-200")}>
                                        <img src={`https://s1.xrpl.to/token/${token.tokenId}`} className="w-full h-full object-cover" onError={(e) => { e.target.parentElement.style.display = 'none'; }} alt="" />
                                      </div>
                                      <span className={cn("text-[12px] font-medium group-hover:text-[#4285f4] transition-colors", isDark ? "text-white/80" : "text-gray-700")}>{token.name}</span>
                                    </Link>
                                  </td>
                                  <td className={cn("py-3.5 px-3 text-right text-[12px] tabular-nums", isDark ? "text-white/50" : "text-gray-500")}>{fCurrency5(token.volume || 0)}</td>
                                  <td className={cn("py-3.5 px-3 text-right text-[12px] tabular-nums", isDark ? "text-white/50" : "text-gray-500")}>{fCurrency5(token.trades || 0)}</td>
                                  <td className="py-3.5 px-3 text-right">
                                    <span className="text-[12px] tabular-nums font-medium text-emerald-400">{fCurrency5(bought)}</span>
                                    {token.avgBuyPrice > 0 && <span className={cn("text-[9px] ml-1", isDark ? "text-white/25" : "text-gray-400")}>@{token.avgBuyPrice < 0.001 ? token.avgBuyPrice.toExponential(1) : fCurrency5(token.avgBuyPrice)}</span>}
                                  </td>
                                  <td className="py-3.5 px-3 text-right">
                                    <span className="text-[12px] tabular-nums font-medium text-red-400">{fCurrency5(sold)}</span>
                                    {token.avgSellPrice > 0 && <span className={cn("text-[9px] ml-1", isDark ? "text-white/25" : "text-gray-400")}>@{token.avgSellPrice < 0.001 ? token.avgSellPrice.toExponential(1) : fCurrency5(token.avgSellPrice)}</span>}
                                  </td>
                                  <td className="py-3.5 px-3 text-right">
                                    <span className={cn("text-[12px] tabular-nums font-medium px-2 py-0.5 rounded-md", roi >= 0 ? (isDark ? "text-emerald-400 bg-emerald-500/10" : "text-emerald-600 bg-emerald-50") : (isDark ? "text-red-400 bg-red-500/10" : "text-red-600 bg-red-50"))}>
                                      {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-3 text-right">
                                    <span className={cn("text-[12px] font-semibold tabular-nums", profit >= 0 ? "text-emerald-400" : "text-red-400")}>
                                      {profit >= 0 ? '+' : ''}{fCurrency5(profit)}
                                    </span>
                                  </td>
                                  <td className="py-3.5 pl-3 text-right">
                                    <span className={cn("text-[10px] tabular-nums whitespace-nowrap", isDark ? "text-white/30" : "text-gray-400")}>
                                      {token.firstTradeDate ? new Date(token.firstTradeDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                                      {token.lastTradeDate && token.firstTradeDate !== token.lastTradeDate && (
                                        <> → {new Date(token.lastTradeDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}</>
                                      )}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {filteredTokens.length > 10 && (
                        <button onClick={() => setShowAllTokens(!showAllTokens)} className={cn("w-full text-center py-3.5 text-[12px] font-medium border-t transition-all duration-200", isDark ? "border-white/[0.04] text-white/40 hover:text-white/70 hover:bg-white/[0.02]" : "border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-50")}>
                          {showAllTokens ? 'Show less' : `Show all ${filteredTokens.length} tokens`}
                        </button>
                      )}
                    </div>
                  );
                })()}
              </>
            )}

            {/* NFTs Tab */}
            {activeTab === 'nfts' && (
              <div>
                {selectedNftCollection ? (
                  <>
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 mb-4">
                      <button onClick={() => { setSelectedNftCollection(null); setCollectionNfts([]); }} className={cn("text-[11px] transition-colors", isDark ? "text-white/35 hover:text-white/70" : "text-gray-400 hover:text-gray-600")}>
                        All Collections
                      </button>
                      <span className={isDark ? "text-white/20" : "text-gray-300"}>/</span>
                      <span className={cn("text-[13px] font-medium", isDark ? "text-white/90" : "text-gray-900")}>{selectedNftCollection.name}</span>
                      <button onClick={() => { setSelectedNftCollection(null); setCollectionNfts([]); }} className={cn("ml-auto text-[11px] px-2 py-1 rounded-lg transition-colors", isDark ? "bg-white/[0.04] text-white/50 hover:bg-white/10" : "bg-gray-100 text-gray-500 hover:bg-gray-200")}>
                        Clear
                      </button>
                    </div>
                    {/* NFTs Grid */}
                    {collectionNftsLoading ? (
                      <div className={cn("p-12 text-center text-[13px]", isDark ? "text-white/40" : "text-gray-400")}>Loading NFTs...</div>
                    ) : collectionNfts.length === 0 ? (
                      <div className={cn("rounded-xl p-12 text-center border", isDark ? "bg-white/[0.02] border-white/10" : "bg-gray-50 border-gray-200")}>
                        <Image size={32} className={cn("mx-auto mb-3", isDark ? "text-white/20" : "text-gray-300")} />
                        <p className={cn("text-[13px]", isDark ? "text-white/50" : "text-gray-500")}>No NFTs found in this collection</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {collectionNfts.map(nft => (
                          <Link key={nft.id} href={`/nft/${nft.nftId}`} className={cn("rounded-xl border overflow-hidden group transition-colors", isDark ? "border-white/[0.06] bg-white/[0.015] hover:border-white/15" : "border-gray-200 bg-white hover:border-gray-300")}>
                            <div className="relative">
                              {nft.image ? (
                                <img src={nft.image} alt={nft.name} className="w-full aspect-square object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                              ) : (
                                <div className={cn("w-full aspect-square flex items-center justify-center text-[10px]", isDark ? "bg-white/5 text-white/30" : "bg-gray-100 text-gray-400")}>No image</div>
                              )}
                            </div>
                            <div className="p-3">
                              <p className={cn("text-[12px] font-medium truncate", isDark ? "text-white/90" : "text-gray-900")}>{nft.name}</p>
                              {nft.rarity > 0 && <p className={cn("text-[10px]", isDark ? "text-white/40" : "text-gray-500")}>Rank #{nft.rarity}</p>}
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : nftCollectionsLoading ? (
                  <div className={cn("p-12 text-center text-[13px]", isDark ? "text-white/40" : "text-gray-400")}>Loading collections...</div>
                ) : nftCollections.length === 0 ? (
                  <div className={cn("rounded-xl py-16 px-8 text-center", isDark ? "bg-[#0a0a0a]" : "bg-gray-50")}>
                    <div className="relative w-20 h-20 mx-auto mb-6">
                      {/* Ears */}
                      <div className={cn("absolute -top-1 left-1 w-6 h-6 rounded-full", isDark ? "bg-[#4285f4]" : "bg-blue-400")} />
                      <div className={cn("absolute -top-1 right-1 w-6 h-6 rounded-full", isDark ? "bg-[#4285f4]" : "bg-blue-400")} />
                      <div className={cn("absolute top-0.5 left-2 w-3 h-3 rounded-full", isDark ? "bg-[#3b78e7]" : "bg-blue-500")} />
                      <div className={cn("absolute top-0.5 right-2 w-3 h-3 rounded-full", isDark ? "bg-[#3b78e7]" : "bg-blue-500")} />
                      {/* Face */}
                      <div className={cn("absolute top-3 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full", isDark ? "bg-[#4285f4]" : "bg-blue-400")}>
                        {/* Eyes - sad droopy */}
                        <div className="absolute top-5 left-3 w-2.5 h-2 rounded-full bg-[#0a0a0a] rotate-[-10deg]" />
                        <div className="absolute top-5 right-3 w-2.5 h-2 rounded-full bg-[#0a0a0a] rotate-[10deg]" />
                        {/* Snout */}
                        <div className={cn("absolute bottom-3 left-1/2 -translate-x-1/2 w-6 h-4 rounded-full", isDark ? "bg-[#5a9fff]" : "bg-blue-300")}>
                          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-2 h-1.5 rounded-full bg-[#0a0a0a]" />
                        </div>
                        {/* Frown */}
                        <div className={cn("absolute bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-1.5 rounded-t-full border-t-[1.5px] border-l-[1.5px] border-r-[1.5px]", isDark ? "border-[#0a0a0a]" : "border-blue-600")} />
                      </div>
                      {/* Scanlines */}
                      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-16 flex flex-col justify-start gap-[3px] pointer-events-none overflow-hidden rounded-full">
                        {[...Array(12)].map((_, i) => (
                          <div key={i} className={cn("h-[3px] w-full", isDark ? "bg-[#0a0a0a]/40" : "bg-white/40")} />
                        ))}
                      </div>
                    </div>
                    <p className={cn("text-sm font-medium tracking-widest mb-2", isDark ? "text-white/80" : "text-gray-600")}>NO NFTS FOUND</p>
                    <p className={cn("text-xs", isDark ? "text-white/30" : "text-gray-400")}>Once this wallet has NFTs, you'll be able to see them here</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {nftCollections.map(col => (
                      <button key={col.id} onClick={() => setSelectedNftCollection(col)} className={cn("rounded-xl border overflow-hidden text-left group transition-colors", isDark ? "border-white/[0.06] bg-white/[0.015] hover:border-white/15" : "border-gray-200 bg-white hover:border-gray-300")}>
                        <div className="relative">
                          {col.logo ? (
                            <img src={col.logo} alt={col.name} className="w-full aspect-square object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                          ) : (
                            <div className={cn("w-full aspect-square flex items-center justify-center text-[10px]", isDark ? "bg-white/5 text-white/30" : "bg-gray-100 text-gray-400")}>No image</div>
                          )}
                        </div>
                        <div className="p-3">
                          <p className={cn("text-[12px] font-medium truncate", isDark ? "text-white/90" : "text-gray-900")}>{col.name}</p>
                          <p className={cn("text-[10px]", isDark ? "text-white/40" : "text-gray-500")}>{col.count} item{col.count !== 1 ? 's' : ''}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* NFT Trading History Chart */}
                {nftHistory.length > 0 && !selectedNftCollection && (
                  <div className={cn("rounded-xl border mt-4 overflow-hidden", isDark ? "bg-white/[0.02] border-white/10" : "bg-white border-gray-200")}>
                    <div className={cn("p-4 border-b flex items-center justify-between", isDark ? "border-white/10" : "border-gray-100")}>
                      <p className={cn("text-[11px] font-medium uppercase tracking-wider", isDark ? "text-white/50" : "text-gray-500")}>Trading Activity (90d)</p>
                      <span className={cn("text-[10px]", isDark ? "text-white/30" : "text-gray-400")}>{nftHistory.length} days</span>
                    </div>
                    <div className="p-4">
                      <div className="flex items-end gap-[2px] h-[80px]">
                        {(() => {
                          const maxVol = Math.max(...nftHistory.map(d => d.volume || 0), 1);
                          return nftHistory.map((d, i) => (
                            <div
                              key={d.date}
                              className="flex-1 flex flex-col justify-end gap-[1px] group relative"
                              title={`${d.date}\nVol: ${(d.volume || 0).toFixed(1)} XRP\nTrades: ${d.trades || 0}`}
                            >
                              {d.sellVolume > 0 && (
                                <div
                                  className="w-full bg-red-400/60 rounded-t-sm"
                                  style={{ height: `${(d.sellVolume / maxVol) * 100}%`, minHeight: d.sellVolume > 0 ? 2 : 0 }}
                                />
                              )}
                              {d.buyVolume > 0 && (
                                <div
                                  className="w-full bg-emerald-400/60 rounded-t-sm"
                                  style={{ height: `${(d.buyVolume / maxVol) * 100}%`, minHeight: d.buyVolume > 0 ? 2 : 0 }}
                                />
                              )}
                            </div>
                          ));
                        })()}
                      </div>
                      <div className={cn("flex justify-between mt-2 text-[9px]", isDark ? "text-white/25" : "text-gray-300")}>
                        <span>{nftHistory[0]?.date}</span>
                        <div className="flex gap-3">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-400/60" /> Buy</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-400/60" /> Sell</span>
                        </div>
                        <span>{nftHistory[nftHistory.length - 1]?.date}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Collection Trading Stats */}
                {nftCollectionStats.length > 0 && !selectedNftCollection && (
                  <div className={cn("rounded-xl border-[1.5px] mt-4 overflow-hidden", isDark ? "border-white/10" : "border-gray-200")}>
                    <div className={cn("px-4 py-3 flex items-center justify-between", isDark ? "border-b border-white/10" : "border-b border-gray-100")}>
                      <span className={cn("text-[13px] font-medium", isDark ? "text-white" : "text-gray-900")}>Trading Stats by Collection</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className={cn(isDark ? "border-b border-white/10" : "border-b border-gray-100")}>
                            <th className={cn("text-left text-[11px] font-medium uppercase tracking-wider px-4 py-3", isDark ? "text-white/40" : "text-gray-500")}>Collection</th>
                            <th className={cn("text-right text-[11px] font-medium uppercase tracking-wider px-4 py-3", isDark ? "text-white/40" : "text-gray-500")}>Volume</th>
                            <th className={cn("text-right text-[11px] font-medium uppercase tracking-wider px-4 py-3", isDark ? "text-white/40" : "text-gray-500")}>P/L</th>
                            <th className={cn("text-right text-[11px] font-medium uppercase tracking-wider px-4 py-3", isDark ? "text-white/40" : "text-gray-500")}>ROI</th>
                            <th className={cn("text-right text-[11px] font-medium uppercase tracking-wider px-4 py-3", isDark ? "text-white/40" : "text-gray-500")}>Trades</th>
                          </tr>
                        </thead>
                        <tbody className={cn("divide-y", isDark ? "divide-white/[0.06]" : "divide-gray-100")}>
                          {nftCollectionStats.slice(0, 15).map(c => (
                            <tr key={c.cid} className={cn("transition-colors", isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50")}>
                              <td className="px-4 py-3">
                                <Link href={`/collection/${c.slug}`} className="flex items-center gap-2 group">
                                  {c.logo && <img src={`https://s1.xrpl.to/nft-collection/${c.logo}`} alt="" className="w-6 h-6 rounded object-cover" />}
                                  <span className={cn("text-[13px] group-hover:text-[#4285f4] truncate max-w-[120px]", isDark ? "text-white" : "text-gray-900")}>{c.name}</span>
                                </Link>
                              </td>
                              <td className={cn("px-4 py-3 text-right text-[12px] tabular-nums", isDark ? "text-white/70" : "text-gray-700")}>{c.volume?.toFixed(1) || 0} XRP</td>
                              <td className={cn("px-4 py-3 text-right text-[12px] tabular-nums font-medium", c.profit >= 0 ? "text-emerald-400" : "text-red-400")}>{c.profit >= 0 ? '+' : ''}{c.profit?.toFixed(1) || 0}</td>
                              <td className={cn("px-4 py-3 text-right text-[12px] tabular-nums", c.roi >= 0 ? "text-emerald-400" : "text-red-400")}>{c.roi?.toFixed(1) || 0}%</td>
                              <td className={cn("px-4 py-3 text-right text-[12px] tabular-nums", isDark ? "text-white/50" : "text-gray-500")}>{c.trades || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <>
              {/* History View Toggle - Styled like screenshot */}
              <div className={cn("flex items-center border-b mb-4", isDark ? "border-white/10" : "border-gray-200")}>
                {[
                  { id: 'tokens', label: 'TOKENS', icon: Coins },
                  { id: 'onchain', label: 'ONCHAIN', icon: Code2 }
                ].map((view) => (
                  <button
                    key={view.id}
                    onClick={() => setHistoryView(view.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 text-[12px] font-medium tracking-wide transition-colors border-b-2 -mb-px",
                      historyView === view.id
                        ? cn("border-white", isDark ? "text-white" : "text-gray-900 border-gray-900")
                        : cn("border-transparent", isDark ? "text-white/40 hover:text-white/60" : "text-gray-500 hover:text-gray-700")
                    )}
                  >
                    <view.icon size={14} />
                    {view.label}
                  </button>
                ))}
              </div>

              {/* Onchain History - Styled like screenshot */}
              {historyView === 'onchain' && (
              <div className={cn("rounded-xl border-[1.5px] overflow-hidden", isDark ? "border-white/10" : "border-gray-200")}>
                {/* Header */}
                <div className={cn("px-4 py-3 flex items-center justify-between", isDark ? "border-b border-white/10" : "border-b border-gray-100")}>
                  <span className={cn("text-[13px] font-medium", isDark ? "text-white" : "text-gray-900")}>Onchain transactions</span>
                  <button className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-colors", isDark ? "text-white/60 hover:bg-white/5" : "text-gray-600 hover:bg-gray-50")}>
                    <span>Filters</span>
                    <Filter size={14} />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={cn(isDark ? "border-b border-white/10" : "border-b border-gray-100")}>
                        <th className={cn("text-left text-[11px] font-medium uppercase tracking-wider px-4 py-3", isDark ? "text-white/40" : "text-gray-500")}>Type</th>
                        <th className={cn("text-left text-[11px] font-medium uppercase tracking-wider px-4 py-3", isDark ? "text-white/40" : "text-gray-500")}>Info</th>
                        <th className={cn("text-left text-[11px] font-medium uppercase tracking-wider px-4 py-3", isDark ? "text-white/40" : "text-gray-500")}>Time</th>
                        <th className={cn("text-right text-[11px] font-medium uppercase tracking-wider px-4 py-3", isDark ? "text-white/40" : "text-gray-500")}>Signature</th>
                      </tr>
                    </thead>
                    <tbody className={cn("divide-y", isDark ? "divide-white/[0.06]" : "divide-gray-100")}>
                      {txHistory.length === 0 ? (
                        <tr>
                          <td colSpan={4} className={cn("px-4 py-8 text-center text-[13px]", isDark ? "text-white/35" : "text-gray-400")}>No transactions found</td>
                        </tr>
                      ) : txHistory.slice(0, 50).map((tx) => {
                        const parsed = parseTx(tx);
                        return (
                          <tr key={parsed.id} className={cn("transition-colors", isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50")}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {parsed.type === 'in' ? (
                                  <ArrowDownLeft size={14} className="text-emerald-400" />
                                ) : (
                                  <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", isDark ? "bg-white/5" : "bg-gray-100")}>
                                    <Clock size={12} className={isDark ? "text-white/40" : "text-gray-400"} />
                                  </div>
                                )}
                                <span className={cn("text-[13px] font-medium", isDark ? "text-white" : "text-gray-900")}>{parsed.label}</span>
                                {parsed.isDust && <span className={cn("text-[9px] px-1.5 py-0.5 rounded", isDark ? "bg-amber-500/10 text-amber-400" : "bg-amber-100 text-amber-600")}>Dust</span>}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {parsed.amount ? (
                                <div className="flex items-center gap-2">
                                  {parsed.type === 'in' ? (
                                    <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">+</span>
                                  ) : (
                                    <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-red-500/20 text-red-400 text-[10px] font-bold">-</span>
                                  )}
                                  <span className={cn("text-[12px] tabular-nums", isDark ? "text-white" : "text-gray-900")}>{parsed.amount}</span>
                                </div>
                              ) : (
                                <span className={cn("text-[12px]", isDark ? "text-white/40" : "text-gray-400")}>See more details</span>
                              )}
                            </td>
                            <td className={cn("px-4 py-3 text-[12px]", isDark ? "text-white/50" : "text-gray-500")}>
                              {parsed.time ? (() => {
                                const diff = Date.now() - new Date(parsed.time).getTime();
                                const mins = Math.floor(diff / 60000);
                                const hrs = Math.floor(diff / 3600000);
                                const days = Math.floor(diff / 86400000);
                                if (mins < 1) return 'Just now';
                                if (mins < 60) return `${mins} min ago`;
                                if (hrs < 24) return `${hrs} hr ago`;
                                if (days < 7) return `${days} day ago`;
                                return new Date(parsed.time).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                              })() : '-'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Link href={`/tx/${parsed.hash}`} target="_blank" className={cn("text-[12px] font-mono hover:underline", isDark ? "text-white/50 hover:text-white/70" : "text-gray-500 hover:text-gray-700")}>
                                  {parsed.hash?.slice(0, 4)}...{parsed.hash?.slice(-4)}
                                </Link>
                                <button onClick={() => navigator.clipboard.writeText(parsed.hash)} className={cn("p-1 rounded transition-colors", isDark ? "text-white/30 hover:text-white/50" : "text-gray-400 hover:text-gray-600")}>
                                  <Copy size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              )}

              {/* Token History - Styled like screenshot */}
              {historyView === 'tokens' && (() => {
                const fmtVal = (v) => {
                  const n = parseFloat(v);
                  return n >= 1 ? n.toFixed(2) : n >= 0.01 ? n.toFixed(4) : String(n);
                };
                const fmtCurrency = (c) => {
                  if (!c || c === 'XRP') return 'XRP';
                  if (c.length === 3) return c;
                  if (c.length === 40) {
                    try {
                      const hex = c.replace(/0+$/, '');
                      let decoded = '';
                      for (let i = 0; i < hex.length; i += 2) {
                        const char = parseInt(hex.substr(i, 2), 16);
                        if (char) decoded += String.fromCharCode(char);
                      }
                      return decoded.match(/^[A-Za-z0-9]+$/) ? decoded : c.slice(0, 6);
                    } catch { return c.slice(0, 6); }
                  }
                  return c;
                };
                const getTokenMd5 = (t) => t?.currency === 'XRP' ? '84e5efeb89c4eae8f68188982dc290d8' : t?.issuer ? CryptoJS.MD5(`${t.issuer}_${t.currency}`).toString() : null;

                const totalPages = Math.ceil(tokenHistory.length / ITEMS_PER_PAGE);
                const paginatedHistory = tokenHistory.slice(tokenHistoryPage * ITEMS_PER_PAGE, (tokenHistoryPage + 1) * ITEMS_PER_PAGE);

                return (
              <div className={cn("rounded-xl border-[1.5px] overflow-hidden", isDark ? "border-white/10" : "border-gray-200")}>
                {/* Header with filters */}
                <div className={cn("px-4 py-3 flex items-center justify-between", isDark ? "border-b border-white/10" : "border-b border-gray-100")}>
                  <div className="flex items-center gap-4">
                    <span className={cn("text-[13px] font-medium", isDark ? "text-white" : "text-gray-900")}>Token Trades</span>
                    <div className="flex gap-1">
                      {['all', 'trades', 'liquidity'].map((t) => (
                        <button key={t} onClick={() => { setTokenHistoryType(t); setTokenHistoryPage(0); }} className={cn("px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors capitalize", tokenHistoryType === t ? (isDark ? "bg-white/10 text-white" : "bg-gray-200 text-gray-900") : (isDark ? "text-white/40 hover:text-white/60" : "text-gray-500 hover:text-gray-700"))}>{t}</button>
                      ))}
                    </div>
                  </div>
                  <button className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-colors", isDark ? "text-white/60 hover:bg-white/5" : "text-gray-600 hover:bg-gray-50")}>
                    <span>Filters</span>
                    <Filter size={14} />
                  </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={cn(isDark ? "border-b border-white/10" : "border-b border-gray-100")}>
                        <th className={cn("text-left text-[11px] font-medium uppercase tracking-wider px-4 py-3", isDark ? "text-white/40" : "text-gray-500")} style={{width: '15%'}}>Type</th>
                        <th className={cn("text-left text-[11px] font-medium uppercase tracking-wider px-4 py-3", isDark ? "text-white/40" : "text-gray-500")} style={{width: '40%'}}>Info</th>
                        <th className={cn("text-left text-[11px] font-medium uppercase tracking-wider px-4 py-3", isDark ? "text-white/40" : "text-gray-500")} style={{width: '20%'}}>Time</th>
                        <th className={cn("text-right text-[11px] font-medium uppercase tracking-wider px-4 py-3", isDark ? "text-white/40" : "text-gray-500")} style={{width: '25%'}}>Signature</th>
                      </tr>
                    </thead>
                    <tbody className={cn("divide-y", isDark ? "divide-white/[0.06]" : "divide-gray-100")}>
                      {tokenHistoryLoading && tokenHistory.length === 0 ? (
                        <tr>
                          <td colSpan={4} className={cn("px-4 py-8 text-center text-[13px]", isDark ? "text-white/35" : "text-gray-400")}>Loading...</td>
                        </tr>
                      ) : paginatedHistory.length === 0 ? (
                        <tr>
                          <td colSpan={4} className={cn("px-4 py-8 text-center text-[13px]", isDark ? "text-white/35" : "text-gray-400")}>No transactions found</td>
                        </tr>
                      ) : paginatedHistory.map((trade) => {
                        const paidIsXRP = trade.paid?.currency === 'XRP';
                        const gotIsXRP = trade.got?.currency === 'XRP';
                        const isTokenToToken = !paidIsXRP && !gotIsXRP;
                        const isBuy = paidIsXRP;
                        const tradeType = trade.isLiquidity ? 'Transaction' : isTokenToToken ? 'Swap' : isBuy ? 'Transaction' : 'Transaction';
                        const paidMd5 = getTokenMd5(trade.paid);
                        const gotMd5 = getTokenMd5(trade.got);

                        return (
                          <tr key={trade._id} className={cn("transition-colors", isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50")}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {isTokenToToken ? (
                                  <ArrowLeftRight size={14} className={isDark ? "text-white/40" : "text-gray-400"} />
                                ) : (
                                  <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", isDark ? "bg-white/5" : "bg-gray-100")}>
                                    <Clock size={12} className={isDark ? "text-white/40" : "text-gray-400"} />
                                  </div>
                                )}
                                <span className={cn("text-[13px] font-medium", isDark ? "text-white" : "text-gray-900")}>{isTokenToToken ? 'Swap' : 'Transaction'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {isTokenToToken || trade.paid || trade.got ? (
                                <div className="flex items-center gap-2 flex-wrap">
                                  {/* Paid amount */}
                                  <div className="flex items-center gap-1">
                                    <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-red-500/20 text-red-400 text-[10px] font-bold">-</span>
                                    {paidMd5 && <img src={`https://s1.xrpl.to/token/${paidMd5}`} className="w-4 h-4 rounded-full" onError={(e) => { e.target.style.display = 'none'; }} alt="" />}
                                    <span className={cn("text-[12px] tabular-nums", isDark ? "text-white" : "text-gray-900")}>{fmtVal(trade.paid?.value)}</span>
                                    <span className={cn("text-[11px]", isDark ? "text-white/50" : "text-gray-500")}>{fmtCurrency(trade.paid?.currency)}</span>
                                  </div>
                                  {/* Plus sign */}
                                  <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">+</span>
                                  {/* Got amount */}
                                  <div className="flex items-center gap-1">
                                    {gotMd5 && <img src={`https://s1.xrpl.to/token/${gotMd5}`} className="w-4 h-4 rounded-full" onError={(e) => { e.target.style.display = 'none'; }} alt="" />}
                                    <span className={cn("text-[12px] tabular-nums", isDark ? "text-white" : "text-gray-900")}>{fmtVal(trade.got?.value)}</span>
                                    <span className={cn("text-[11px]", isDark ? "text-white/50" : "text-gray-500")}>{fmtCurrency(trade.got?.currency)}</span>
                                  </div>
                                </div>
                              ) : (
                                <span className={cn("text-[12px]", isDark ? "text-white/40" : "text-gray-400")}>See more details</span>
                              )}
                            </td>
                            <td className={cn("px-4 py-3 text-[12px]", isDark ? "text-white/50" : "text-gray-500")}>
                              {trade.time ? (() => {
                                const diff = Date.now() - trade.time;
                                const mins = Math.floor(diff / 60000);
                                const hrs = Math.floor(diff / 3600000);
                                const days = Math.floor(diff / 86400000);
                                if (mins < 1) return 'Just now';
                                if (mins < 60) return `${mins} min ago`;
                                if (hrs < 24) return `${hrs} hr ago`;
                                if (days < 7) return `${days} day ago`;
                                return new Date(trade.time).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                              })() : '-'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Link href={`/tx/${trade.hash}`} target="_blank" className={cn("text-[12px] font-mono hover:underline", isDark ? "text-white/50 hover:text-white/70" : "text-gray-500 hover:text-gray-700")}>
                                  {trade.hash?.slice(0, 4)}...{trade.hash?.slice(-4)}
                                </Link>
                                <button onClick={() => navigator.clipboard.writeText(trade.hash)} className={cn("p-1 rounded transition-colors", isDark ? "text-white/30 hover:text-white/50" : "text-gray-400 hover:text-gray-600")}>
                                  <Copy size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className={cn("px-4 py-3 flex items-center justify-between border-t", isDark ? "border-white/10" : "border-gray-100")}>
                  <div className="flex items-center gap-3">
                    <span className={cn("text-[13px]", isDark ? "text-white/50" : "text-gray-500")}>Transactions per page</span>
                    <div className={cn("flex items-center gap-1 px-2 py-1 rounded border", isDark ? "border-white/10" : "border-gray-200")}>
                      <span className={cn("text-[13px] tabular-nums min-w-[20px] text-center", isDark ? "text-white" : "text-gray-900")}>{ITEMS_PER_PAGE}</span>
                      <div className="flex flex-col">
                        <ChevronUp size={10} className={cn(isDark ? "text-white/40" : "text-gray-400")} />
                        <ChevronDown size={10} className={cn(isDark ? "text-white/40" : "text-gray-400")} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setTokenHistoryPage(0)} disabled={tokenHistoryPage === 0} className={cn("text-[14px] px-1 transition-colors disabled:opacity-30", isDark ? "text-white/50 hover:text-white disabled:hover:text-white/50" : "text-gray-400 hover:text-gray-600")}>
                      &laquo;
                    </button>
                    <button onClick={() => setTokenHistoryPage(p => Math.max(0, p - 1))} disabled={tokenHistoryPage === 0} className={cn("text-[14px] px-1 transition-colors disabled:opacity-30", isDark ? "text-white/50 hover:text-white disabled:hover:text-white/50" : "text-gray-400 hover:text-gray-600")}>
                      &lsaquo;
                    </button>
                    <span className={cn("text-[13px] px-2", isDark ? "text-white/70" : "text-gray-600")}>Page {tokenHistoryPage + 1}</span>
                    <button onClick={() => { setTokenHistoryPage(p => p + 1); if ((tokenHistoryPage + 2) * ITEMS_PER_PAGE >= filteredHistory.length && tokenHistoryHasMore) loadMoreTokenHistory(); }} disabled={!tokenHistoryHasMore && tokenHistoryPage >= totalPages - 1} className={cn("text-[14px] px-1 transition-colors disabled:opacity-30", isDark ? "text-white/50 hover:text-white disabled:hover:text-white/50" : "text-gray-400 hover:text-gray-600")}>
                      &rsaquo;
                    </button>
                    <button onClick={() => { if (tokenHistoryHasMore) loadMoreTokenHistory(); setTokenHistoryPage(totalPages - 1); }} disabled={!tokenHistoryHasMore && tokenHistoryPage >= totalPages - 1} className={cn("text-[14px] px-1 transition-colors disabled:opacity-30", isDark ? "text-white/50 hover:text-white disabled:hover:text-white/50" : "text-gray-400 hover:text-gray-600")}>
                      &raquo;
                    </button>
                  </div>
                </div>
              </div>
                );
              })()}

              {/* NFT Trades Section - Styled like screenshot */}
              {nftTrades.length > 0 && (() => {
                const nftTotalPages = Math.ceil(nftTrades.length / ITEMS_PER_PAGE);
                const paginatedNftTrades = nftTrades.slice(nftTradesPage * ITEMS_PER_PAGE, (nftTradesPage + 1) * ITEMS_PER_PAGE);
                return (
              <div className={cn("rounded-xl border-[1.5px] mt-4 overflow-hidden", isDark ? "border-white/10" : "border-gray-200")}>
                <div className={cn("px-4 py-3 flex items-center justify-between", isDark ? "border-b border-white/10" : "border-b border-gray-100")}>
                  <div className="flex items-center gap-2">
                    <Image size={14} className={isDark ? "text-white/50" : "text-gray-500"} />
                    <span className={cn("text-[13px] font-medium", isDark ? "text-white" : "text-gray-900")}>NFT Trades</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={cn(isDark ? "border-b border-white/10" : "border-b border-gray-100")}>
                        <th className={cn("text-left text-[11px] font-medium uppercase tracking-wider px-4 py-3", isDark ? "text-white/40" : "text-gray-500")} style={{width: '15%'}}>Type</th>
                        <th className={cn("text-left text-[11px] font-medium uppercase tracking-wider px-4 py-3", isDark ? "text-white/40" : "text-gray-500")} style={{width: '40%'}}>Info</th>
                        <th className={cn("text-left text-[11px] font-medium uppercase tracking-wider px-4 py-3", isDark ? "text-white/40" : "text-gray-500")} style={{width: '20%'}}>Time</th>
                        <th className={cn("text-right text-[11px] font-medium uppercase tracking-wider px-4 py-3", isDark ? "text-white/40" : "text-gray-500")} style={{width: '25%'}}>Signature</th>
                      </tr>
                    </thead>
                    <tbody className={cn("divide-y", isDark ? "divide-white/[0.06]" : "divide-gray-100")}>
                      {paginatedNftTrades.map((trade) => {
                        const isSeller = trade.seller === account;
                        const label = isSeller ? 'Sold NFT' : 'Bought NFT';
                        const amt = trade.costXRP ?? trade.cost ?? 0;
                        const currency = trade.currency || 'XRP';
                        const amtStr = amt >= 1 ? amt.toFixed(2) : amt >= 0.01 ? amt.toFixed(4) : String(amt);
                        return (
                          <tr key={trade._id} className={cn("transition-colors", isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50")}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {isSeller ? (
                                  <ArrowUpRight size={14} className="text-emerald-400" />
                                ) : (
                                  <ArrowDownLeft size={14} className={isDark ? "text-white/40" : "text-gray-400"} />
                                )}
                                <span className={cn("text-[13px] font-medium", isDark ? "text-white" : "text-gray-900")}>{label}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {isSeller ? (
                                  <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">+</span>
                                ) : (
                                  <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-red-500/20 text-red-400 text-[10px] font-bold">-</span>
                                )}
                                <span className={cn("text-[12px] tabular-nums", isDark ? "text-white" : "text-gray-900")}>{amtStr} {currency}</span>
                              </div>
                            </td>
                            <td className={cn("px-4 py-3 text-[12px]", isDark ? "text-white/50" : "text-gray-500")}>
                              {trade.time ? (() => {
                                const diff = Date.now() - trade.time;
                                const mins = Math.floor(diff / 60000);
                                const hrs = Math.floor(diff / 3600000);
                                const days = Math.floor(diff / 86400000);
                                if (mins < 1) return 'Just now';
                                if (mins < 60) return `${mins} min ago`;
                                if (hrs < 24) return `${hrs} hr ago`;
                                if (days < 7) return `${days} day ago`;
                                return new Date(trade.time).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                              })() : '-'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Link href={`/tx/${trade.hash}`} target="_blank" className={cn("text-[12px] font-mono hover:underline", isDark ? "text-white/50 hover:text-white/70" : "text-gray-500 hover:text-gray-700")}>
                                  {trade.hash?.slice(0, 4)}...{trade.hash?.slice(-4)}
                                </Link>
                                <button onClick={() => navigator.clipboard.writeText(trade.hash)} className={cn("p-1 rounded transition-colors", isDark ? "text-white/30 hover:text-white/50" : "text-gray-400 hover:text-gray-600")}>
                                  <Copy size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                <div className={cn("px-4 py-3 flex items-center justify-between border-t", isDark ? "border-white/10" : "border-gray-100")}>
                  <div className="flex items-center gap-3">
                    <span className={cn("text-[13px]", isDark ? "text-white/50" : "text-gray-500")}>Transactions per page</span>
                    <div className={cn("flex items-center gap-1 px-2 py-1 rounded border", isDark ? "border-white/10" : "border-gray-200")}>
                      <span className={cn("text-[13px] tabular-nums min-w-[20px] text-center", isDark ? "text-white" : "text-gray-900")}>{ITEMS_PER_PAGE}</span>
                      <div className="flex flex-col">
                        <ChevronUp size={10} className={cn(isDark ? "text-white/40" : "text-gray-400")} />
                        <ChevronDown size={10} className={cn(isDark ? "text-white/40" : "text-gray-400")} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setNftTradesPage(0)} disabled={nftTradesPage === 0} className={cn("text-[14px] px-1 transition-colors disabled:opacity-30", isDark ? "text-white/50 hover:text-white disabled:hover:text-white/50" : "text-gray-400 hover:text-gray-600")}>
                      &laquo;
                    </button>
                    <button onClick={() => setNftTradesPage(p => Math.max(0, p - 1))} disabled={nftTradesPage === 0} className={cn("text-[14px] px-1 transition-colors disabled:opacity-30", isDark ? "text-white/50 hover:text-white disabled:hover:text-white/50" : "text-gray-400 hover:text-gray-600")}>
                      &lsaquo;
                    </button>
                    <span className={cn("text-[13px] px-2", isDark ? "text-white/70" : "text-gray-600")}>Page {nftTradesPage + 1}</span>
                    <button onClick={() => setNftTradesPage(p => Math.min(nftTotalPages - 1, p + 1))} disabled={nftTradesPage >= nftTotalPages - 1} className={cn("text-[14px] px-1 transition-colors disabled:opacity-30", isDark ? "text-white/50 hover:text-white disabled:hover:text-white/50" : "text-gray-400 hover:text-gray-600")}>
                      &rsaquo;
                    </button>
                    <button onClick={() => setNftTradesPage(nftTotalPages - 1)} disabled={nftTradesPage >= nftTotalPages - 1} className={cn("text-[14px] px-1 transition-colors disabled:opacity-30", isDark ? "text-white/50 hover:text-white disabled:hover:text-white/50" : "text-gray-400 hover:text-gray-600")}>
                      &raquo;
                    </button>
                  </div>
                </div>
              </div>
                );
              })()}
              </>
            )}

          </div>
        </div>
      </div>

      <ScrollToTop />
      <Footer />
    </PageWrapper>
  );
};

export default OverView;

export async function getServerSideProps(ctx) {
  try {
    const params = ctx.params.acct;
    const account = params[0];
    const tab = params[1] || 'overview';

    // Validate XRP address
    const isValid = isValidClassicAddress(account);
    if (!isValid) {
      return {
        redirect: {
          destination: '/404',
          permanent: false
        }
      };
    }

    // Build data object
    let data = {
      account,
      tab,
      limit: 32
    };

    // Handle collection-specific tabs
    if (tab?.includes('collection')) {
      data.collection = params[2];
      data.type = tab.replace('collection', '').toLowerCase();
    }

    // Add OGP metadata for better SEO and social sharing
    const ogp = {
      canonical: `https://xrpl.to/address/${account}`,
      title: `Profile - ${account.substring(0, 8)}...${account.substring(account.length - 6)}`,
      url: `https://xrpl.to/address/${account}`,
      imgUrl: 'https://xrpl.to/static/ogp.png',
      desc: `View portfolio, NFT collections, and trading activity for XRP Ledger account ${account.substring(0, 12)}...`
    };

    return {
      props: {
        ...data,
        ogp
      }
    };
  } catch (err) {
    console.error('Error in profile getServerSideProps:', err);
    return {
      redirect: {
        destination: '/404',
        permanent: false
      }
    };
  }
}
