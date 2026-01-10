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
import { Wallet, Copy, ExternalLink, Coins, Image, Clock, ArrowDownLeft, ArrowUpRight, Code2, Check } from 'lucide-react';

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
  const [nftCollections, setNftCollections] = useState([]);
  const [nftCollectionsLoading, setNftCollectionsLoading] = useState(false);
  const [selectedNftCollection, setSelectedNftCollection] = useState(null);
  const [collectionNfts, setCollectionNfts] = useState([]);
  const [collectionNftsLoading, setCollectionNftsLoading] = useState(false);
  const [nftTrades, setNftTrades] = useState([]);
  const [nftTradesLoading, setNftTradesLoading] = useState(false);
  const [nftCollectionStats, setNftCollectionStats] = useState([]);
  const [nftCollectionStatsLoading, setNftCollectionStatsLoading] = useState(false);
  const [nftHistory, setNftHistory] = useState([]);
  const [showApi, setShowApi] = useState(false);
  const [copiedApiIdx, setCopiedApiIdx] = useState(null);

  // Fetch XRP price from /api/rates
  useEffect(() => {
    axios.get('https://api.xrpl.to/api/rates')
      .then(res => {
        // exch.USD is the conversion rate (USD per XRP)
        if (res.data?.exch?.USD) {
          setXrpPrice(1 / res.data.exch.USD);
        }
      })
      .catch(() => { });
  }, []);

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
        const [profileRes, holdingsRes, nftRes] = await Promise.all([
          axios.get(`https://api.xrpl.to/api/traders/${account}`).catch(() => ({ data: null })),
          axios.get(`https://api.xrpl.to/api/trustlines/${account}?limit=20&page=0&format=full`)
            .catch(() => axios.get(`https://api.xrpl.to/api/trustlines/${account}?limit=20&page=0`))
            .catch(() => ({ data: null })),
          axios.get(`https://api.xrpl.to/api/nft/analytics/trader/${account}`).catch(() => ({ data: null }))
        ]);

        setData(profileRes.data);
        setHoldings(holdingsRes.data);
        setNftStats(nftRes.data);

        // Fetch transaction history via xrpl.to API
        axios.get(`https://api.xrpl.to/api/account/tx/${account}?limit=200`)
          .then(res => {
            if (res.data?.result === 'success' || res.data?.txs || res.data?.transactions) {
              const txs = res.data.txs || res.data.transactions || [];
              setTxHistory(txs);
              setFilteredTxHistory(txs);
            }
          })
          .catch(err => console.error('TX history fetch failed:', err));
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
      .catch(err => console.error('Failed to fetch NFT collection stats:', err))
      .finally(() => setNftCollectionStatsLoading(false));
  }, [activeTab, account]);

  // Fetch NFT trading history when NFTs tab is viewed
  useEffect(() => {
    if (activeTab !== 'nfts' || !account || nftHistory.length > 0) return;
    axios.get(`https://api.xrpl.to/api/nft/analytics/trader/${account}/history?limit=90`)
      .then(res => setNftHistory(res.data?.history || []))
      .catch(err => console.error('Failed to fetch NFT history:', err));
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

  // Fetch NFT trades when activity tab is viewed
  useEffect(() => {
    if (activeTab !== 'activity' || !account || nftTrades.length > 0) return;
    setNftTradesLoading(true);
    axios.get(`https://api.xrpl.to/api/nft/analytics/trader/${account}/trades?limit=50`)
      .then(res => setNftTrades(res.data?.trades || []))
      .catch(err => console.error('Failed to fetch NFT trades:', err))
      .finally(() => setNftTradesLoading(false));
  }, [activeTab, account]);

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
        amount = `${parseFloat(delivered.value).toFixed(2)} ${decodeCurrency(delivered.currency)}`;
      }
      label = isOutgoing ? 'Sent' : 'Received';
    } else if (type === 'OfferCreate') {
      label = 'Trade';
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
        if (typeof offerAmt === 'string') {
          const xrpAmt = parseInt(offerAmt) / 1000000;
          amount = xrpAmt < 0.01 ? `${xrpAmt.toFixed(6)} XRP` : `${xrpAmt.toFixed(2)} XRP`;
        } else if (offerAmt?.value) {
          amount = `${parseFloat(offerAmt.value).toFixed(2)} ${decodeCurrency(offerAmt.currency)}`;
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
                  <span className="hidden md:inline">{account.substring(0, 10)}...{account.substring(account.length - 8)}</span>
                  <span className="md:hidden">{account.substring(0, 6)}...{account.substring(account.length - 4)}</span>
                </h2>
                <button
                  onClick={() => navigator.clipboard.writeText(account)}
                  className={cn("p-1.5 rounded-lg transition-colors", isDark ? "text-white/40 hover:text-white/70 hover:bg-white/5" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100")}
                  title="Copy address"
                >
                  <Copy size={14} />
                </button>
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
                        <div key={ep.label} className={cn("mb-2 p-2 rounded-lg", isDark ? "bg-white/5" : "bg-gray-50")}>
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
              <div className={cn("mb-4 p-4 rounded-xl border", isDark ? "bg-[#0d0d0d] border-white/[0.06]" : "bg-white border-gray-200")}>
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
                <p className={cn("text-[11px] uppercase tracking-wide mb-1", isDark ? "text-white/40" : "text-gray-400")}>XRP Balance</p>
                <p className={cn("text-[1.3rem] font-medium", isDark ? "text-white" : "text-gray-900")}>
                  {fCurrency5(holdings.accountData.balanceDrops / 1000000)}
                </p>
                <span className={cn("text-[12px]", isDark ? "text-white/40" : "text-gray-400")}>
                  {fCurrency5(holdings.accountData.spendableDrops / 1000000)} spendable
                </span>
              </div>
            )}

            {/* No Trading Data Message */}
            {hasNoTradingData && holdings?.accountActive !== false && (
              <div className={cn("text-center py-8 mb-4 rounded-xl border", isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-gray-50")}>
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className={cn("p-4 rounded-lg", isDark ? "bg-white/[0.03]" : "bg-gray-50")}>
                  <p className={cn("text-[10px] uppercase tracking-wider mb-1", isDark ? "text-white/40" : "text-gray-500")}>Balance</p>
                  <p className={cn("text-[22px] font-medium tabular-nums", isDark ? "text-white" : "text-gray-900")}>
                    {holdings?.accountData ? fCurrency5(holdings.accountData.balanceDrops / 1000000) : '—'}
                  </p>
                </div>
                <div className={cn("p-4 rounded-lg", isDark ? "bg-white/[0.03]" : "bg-gray-50")}>
                  <p className={cn("text-[10px] uppercase tracking-wider mb-1", isDark ? "text-white/40" : "text-gray-500")}>Total P&L</p>
                  <p className={cn("text-[22px] font-medium tabular-nums", (totalPnL + (nftStats?.combinedProfit || 0)) >= 0 ? "text-[#22c55e]" : "text-[#ef4444]")}>
                    {(totalPnL + (nftStats?.combinedProfit || 0)) >= 0 ? '+' : ''}{fCurrency5(totalPnL + (nftStats?.combinedProfit || 0))}
                  </p>
                </div>
                <div className={cn("p-4 rounded-lg", isDark ? "bg-white/[0.03]" : "bg-gray-50")}>
                  <p className={cn("text-[10px] uppercase tracking-wider mb-1", isDark ? "text-white/40" : "text-gray-500")}>Total Trades</p>
                  <p className={cn("text-[22px] font-medium tabular-nums", isDark ? "text-white" : "text-gray-900")}>
                    {fCurrency5((data?.totalTrades || 0) + (nftStats?.totalTrades || 0))}
                  </p>
                </div>
                <div className={cn("p-4 rounded-lg", isDark ? "bg-white/[0.03]" : "bg-gray-50")}>
                  <p className={cn("text-[10px] uppercase tracking-wider mb-1", isDark ? "text-white/40" : "text-gray-500")}>Total Volume</p>
                  <p className={cn("text-[22px] font-medium tabular-nums", isDark ? "text-white" : "text-gray-900")}>
                    {fCurrency5((data?.totalVolume || 0) + (nftStats?.totalVolume || 0))}
                  </p>
                </div>
              </div>
            )}

            {/* Two-column trading breakdown */}
            {(data || nftStats) && (
              <div className={cn("grid md:grid-cols-2 gap-4 mb-6")}>
                {/* Token Trading */}
                {data && (
                  <div className={cn("p-4 rounded-lg border", isDark ? "bg-white/[0.02] border-white/10" : "bg-white border-gray-200")}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Coins size={14} className="text-[#3b82f6]" />
                        <span className={cn("text-[11px] font-medium uppercase tracking-wider", isDark ? "text-[#60a5fa]" : "text-[#3b82f6]")}>Token Trading</span>
                      </div>
                      <div className={cn("flex items-center gap-2 text-[10px]", isDark ? "text-white/40" : "text-gray-400")}>
                        <span className="text-[#22c55e]">{data.buyCount || 0} buys</span>
                        <span>/</span>
                        <span className="text-[#ef4444]">{data.sellCount || 0} sells</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3 mb-3">
                      {[
                        { label: 'P&L', value: fCurrency5(totalPnL), color: totalPnL >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]' },
                        { label: 'ROI', value: `${(data.roi || 0).toFixed(1)}%`, color: (data.roi || 0) >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]' },
                        { label: 'WIN', value: `${winRate.toFixed(0)}%`, color: winRate >= 50 ? 'text-[#22c55e]' : 'text-[#ef4444]' },
                        { label: 'VOLUME', value: fCurrency5(data.totalVolume || 0), color: isDark ? 'text-white' : 'text-gray-900' }
                      ].map(s => (
                        <div key={s.label}>
                          <p className={cn("text-[9px] uppercase tracking-wider", isDark ? "text-white/30" : "text-gray-400")}>{s.label}</p>
                          <p className={cn("text-[13px] font-medium tabular-nums", s.color)}>{s.value}</p>
                        </div>
                      ))}
                    </div>
                    {/* DEX vs AMM breakdown */}
                    {(data.dexProfit || data.ammProfit) && (
                      <div className={cn("flex items-center gap-4 pb-3 mb-3 text-[10px]", isDark ? "border-b border-white/10" : "border-b border-gray-100")}>
                        <span className={isDark ? "text-white/30" : "text-gray-400"}>DEX</span>
                        <span className={cn("tabular-nums", (data.dexProfit || 0) >= 0 ? "text-[#22c55e]" : "text-[#ef4444]")}>{(data.dexProfit || 0) >= 0 ? '+' : ''}{fCurrency5(data.dexProfit || 0)}</span>
                        <span className={isDark ? "text-white/30" : "text-gray-400"}>AMM</span>
                        <span className={cn("tabular-nums", (data.ammProfit || 0) >= 0 ? "text-[#22c55e]" : "text-[#ef4444]")}>{(data.ammProfit || 0) >= 0 ? '+' : ''}{fCurrency5(data.ammProfit || 0)}</span>
                      </div>
                    )}
                    <div className={cn("flex items-center gap-3 text-[11px]", !data.dexProfit && !data.ammProfit ? "pt-3 border-t border-white/10" : "")}>
                      <span className={isDark ? "text-white/30" : "text-gray-400"}>7D</span>
                      <span className={cn("tabular-nums", (data.profit7d || 0) >= 0 ? "text-[#22c55e]" : "text-[#ef4444]")}>{(data.profit7d || 0) >= 0 ? '+' : ''}{fCurrency5(data.profit7d || 0)}</span>
                      <span className={isDark ? "text-white/30" : "text-gray-400"}>30D</span>
                      <span className={cn("tabular-nums", (data.profit1m || 0) >= 0 ? "text-[#22c55e]" : "text-[#ef4444]")}>{(data.profit1m || 0) >= 0 ? '+' : ''}{fCurrency5(data.profit1m || 0)}</span>
                      <span className={isDark ? "text-white/30" : "text-gray-400"}>90D</span>
                      <span className={cn("tabular-nums", (data.profit3m || 0) >= 0 ? "text-[#22c55e]" : "text-[#ef4444]")}>{(data.profit3m || 0) >= 0 ? '+' : ''}{fCurrency5(data.profit3m || 0)}</span>
                    </div>
                  </div>
                )}

                {/* NFT Trading */}
                {nftStats && (nftStats.totalVolume > 0 || nftStats.holdingsCount > 0) && (
                  <div className={cn("p-4 rounded-lg border", isDark ? "bg-white/[0.02] border-white/10" : "bg-white border-gray-200")}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Image size={14} className="text-[#a855f7]" />
                        <span className={cn("text-[11px] font-medium uppercase tracking-wider", isDark ? "text-[#c084fc]" : "text-[#9333ea]")}>NFT Trading</span>
                        {nftStats.holdingsCount > 0 && <span className={cn("text-[10px] px-1.5 py-0.5 rounded", isDark ? "bg-white/10 text-white/50" : "bg-gray-100 text-gray-500")}>{nftStats.holdingsCount} held</span>}
                      </div>
                      <div className={cn("flex items-center gap-2 text-[10px]", isDark ? "text-white/40" : "text-gray-400")}>
                        <span className="text-[#22c55e]">{nftStats.buyCount || 0} buys</span>
                        <span>/</span>
                        <span className="text-[#ef4444]">{nftStats.sellCount || 0} sells</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3 mb-3">
                      {[
                        { label: 'P&L', value: fCurrency5(nftStats.combinedProfit || 0), color: (nftStats.combinedProfit || 0) >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]' },
                        { label: 'ROI', value: `${(nftStats.roi || 0).toFixed(1)}%`, color: (nftStats.roi || 0) >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]' },
                        { label: 'WIN', value: `${(nftStats.winRate || 0).toFixed(0)}%`, color: (nftStats.winRate || 0) >= 50 ? 'text-[#22c55e]' : 'text-[#ef4444]' },
                        { label: 'VOLUME', value: fCurrency5(nftStats.totalVolume || 0), color: isDark ? 'text-white' : 'text-gray-900' }
                      ].map(s => (
                        <div key={s.label}>
                          <p className={cn("text-[9px] uppercase tracking-wider", isDark ? "text-white/30" : "text-gray-400")}>{s.label}</p>
                          <p className={cn("text-[13px] font-medium tabular-nums", s.color)}>{s.value}</p>
                        </div>
                      ))}
                    </div>
                    {/* Flips & Hold Time */}
                    {(nftStats.flips || nftStats.avgHoldingDays) && (
                      <div className={cn("flex items-center gap-4 pb-3 mb-3 text-[10px]", isDark ? "border-b border-white/10" : "border-b border-gray-100")}>
                        {nftStats.flips > 0 && (
                          <>
                            <span className={isDark ? "text-white/30" : "text-gray-400"}>FLIPS</span>
                            <span className={isDark ? "text-white/70" : "text-gray-600"}>{nftStats.flips}</span>
                          </>
                        )}
                        {nftStats.avgHoldingDays > 0 && (
                          <>
                            <span className={isDark ? "text-white/30" : "text-gray-400"}>AVG HOLD</span>
                            <span className={isDark ? "text-white/70" : "text-gray-600"}>{nftStats.avgHoldingDays.toFixed(0)}d</span>
                          </>
                        )}
                      </div>
                    )}
                    <div className={cn("flex items-center gap-3 text-[11px]", !nftStats.flips && !nftStats.avgHoldingDays ? "pt-3 border-t border-white/10" : "")}>
                      <span className={isDark ? "text-white/30" : "text-gray-400"}>7D</span>
                      <span className={cn("tabular-nums", (nftStats.profit7d || 0) >= 0 ? "text-[#22c55e]" : "text-[#ef4444]")}>{(nftStats.profit7d || 0) >= 0 ? '+' : ''}{fCurrency5(nftStats.profit7d || 0)}</span>
                      <span className={isDark ? "text-white/30" : "text-gray-400"}>30D</span>
                      <span className={cn("tabular-nums", (nftStats.profit30d || 0) >= 0 ? "text-[#22c55e]" : "text-[#ef4444]")}>{(nftStats.profit30d || 0) >= 0 ? '+' : ''}{fCurrency5(nftStats.profit30d || 0)}</span>
                      <span className={isDark ? "text-white/30" : "text-gray-400"}>90D</span>
                      <span className={cn("tabular-nums", (nftStats.profit90d || 0) >= 0 ? "text-[#22c55e]" : "text-[#ef4444]")}>{(nftStats.profit90d || 0) >= 0 ? '+' : ''}{fCurrency5(nftStats.profit90d || 0)}</span>
                    </div>
                    {/* Top Collections */}
                    {nftStats.collections?.length > 0 && (
                      <div className={cn("flex flex-wrap gap-1.5 pt-3 mt-3", isDark ? "border-t border-white/10" : "border-t border-gray-100")}>
                        {nftStats.collections.slice(0, 3).map(c => (
                          <a key={c.slug} href={`/collection/${c.slug}`} className={cn("flex items-center gap-1.5 px-2 py-1 rounded text-[10px] transition-colors", isDark ? "bg-white/5 hover:bg-white/10" : "bg-gray-50 hover:bg-gray-100")}>
                            {c.logo && <img src={`https://s1.xrpl.to/nft-collection/${c.logo}`} className="w-4 h-4 rounded" alt="" />}
                            <span className={isDark ? "text-white/60" : "text-gray-600"}>{c.name?.slice(0, 10)}</span>
                            <span className={cn("tabular-nums", (c.profit || 0) >= 0 ? "text-[#22c55e]" : "text-[#ef4444]")}>{(c.profit || 0) >= 0 ? '+' : ''}{fCurrency5(c.profit || 0)}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-2 mb-6">
              {[
                { id: 'tokens', label: 'TOKENS', icon: Coins, count: holdings?.total || 0 },
                { id: 'nfts', label: 'NFTS', icon: Image, count: nftStats?.holdingsCount || 0 },
                { id: 'activity', label: 'HISTORY', icon: Clock, count: txHistory.length }
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
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <p className={cn("text-[11px] uppercase tracking-wider", isDark ? "text-white/40" : "text-gray-400")}>
                            HOLDINGS <span className={isDark ? "text-white/20" : "text-gray-300"}>({holdings.total})</span>
                          </p>
                          {zeroCount > 0 && (
                            <button
                              onClick={() => setHideZeroHoldings(!hideZeroHoldings)}
                              className={cn("text-[10px] px-2 py-0.5 rounded transition-colors", hideZeroHoldings ? "text-[#22c55e]" : (isDark ? "text-white/30" : "text-gray-400"))}
                            >
                              {hideZeroHoldings ? `+${zeroCount} hidden` : 'Hide empty'}
                            </button>
                          )}
                        </div>
                        {filteredLines.length > 0 && (
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <span className={cn("text-[18px] font-medium tabular-nums", isDark ? "text-white" : "text-gray-900")}>{fCurrency5(totalValue + (holdings.accountData?.balanceDrops || 0) / 1000000)}</span>
                              <span className={cn("text-[12px] uppercase tracking-wider", isDark ? "text-white/30" : "text-gray-400")}>XRP</span>
                            </div>
                            {xrpPrice && (
                              <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded text-[11px]", isDark ? "bg-white/5" : "bg-gray-100")}>
                                <span className={isDark ? "text-white/40" : "text-gray-400"}>XRP</span>
                                <span className={cn("font-medium tabular-nums", isDark ? "text-white/70" : "text-gray-600")}>${parseFloat(xrpPrice).toFixed(4)}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {filteredLines.length > 0 ? (
                        <>
                          {/* Table Header */}
                          <div className={cn("grid px-0 py-2 border-b", isDark ? "border-white/10" : "border-gray-200")} style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
                            <span className={cn("text-[10px] uppercase tracking-wider", isDark ? "text-white/30" : "text-gray-400")}>TOKEN</span>
                            <span className={cn("text-[10px] uppercase tracking-wider text-right", isDark ? "text-white/30" : "text-gray-400")}>PRICE</span>
                            <span className={cn("text-[10px] uppercase tracking-wider text-right", isDark ? "text-white/30" : "text-gray-400")}>BALANCE</span>
                            <span className={cn("text-[10px] uppercase tracking-wider text-right", isDark ? "text-white/30" : "text-gray-400")}>VALUE</span>
                          </div>
                          {/* XRP Row */}
                          {holdings.accountData?.balanceDrops > 0 && (
                            <div className={cn("grid py-3 items-center transition-colors", isDark ? "border-b border-white/[0.04] hover:bg-white/[0.02]" : "border-b border-gray-100 hover:bg-gray-50")} style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
                              <div className="flex items-center gap-3">
                                <img src="https://s1.xrpl.to/token/84e5efeb89c4eae8f68188982dc290d8" className="w-6 h-6 rounded-full" alt="" />
                                <span className={cn("text-[14px] font-medium", isDark ? "text-white" : "text-gray-900")}>XRP</span>
                              </div>
                              <span className={cn("text-[14px] text-right tabular-nums", isDark ? "text-white/60" : "text-gray-500")}>{xrpPrice ? `$${parseFloat(xrpPrice).toFixed(4)}` : '—'}</span>
                              <span className={cn("text-[14px] text-right tabular-nums", isDark ? "text-white/60" : "text-gray-500")}>{fCurrency5(holdings.accountData.balanceDrops / 1000000)}</span>
                              <span className={cn("text-[14px] text-right tabular-nums font-medium", isDark ? "text-white" : "text-gray-900")}>{xrpPrice ? `$${fCurrency5((holdings.accountData.balanceDrops / 1000000) * xrpPrice)}` : `${fCurrency5(holdings.accountData.balanceDrops / 1000000)} XRP`}</span>
                            </div>
                          )}
                          {/* Table Rows */}
                          {filteredLines.map((line, idx) => {
                            const balance = Math.abs(parseFloat(line.balance) || 0);
                            const xrpValue = line.value || 0;
                            const priceInXrp = balance > 0 ? xrpValue / balance : 0;
                            const usdPrice = priceInXrp && xrpPrice ? priceInXrp * xrpPrice : 0;
                            return (
                              <div key={idx} className={cn("grid py-3 items-center transition-colors", isDark ? "border-b border-white/[0.04] hover:bg-white/[0.02]" : "border-b border-gray-100 hover:bg-gray-50")} style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
                                <div className="flex items-center gap-3">
                                  <img src={`https://s1.xrpl.to/token/${line.token?.md5}`} className="w-6 h-6 rounded-full" onError={(e) => { e.target.style.display = 'none'; }} alt="" />
                                  <span className={cn("text-[14px]", isDark ? "text-white" : "text-gray-900")}>{line.token?.name || line.currency}</span>
                                </div>
                                <span className={cn("text-[14px] text-right tabular-nums", isDark ? "text-white/60" : "text-gray-500")}>{usdPrice ? `$${fCurrency5(usdPrice)}` : '—'}</span>
                                <span className={cn("text-[14px] text-right tabular-nums", isDark ? "text-white/60" : "text-gray-500")}>{fCurrency5(Math.abs(parseFloat(line.balance)))}</span>
                                <span className={cn("text-[14px] text-right tabular-nums font-medium", isDark ? "text-white" : "text-gray-900")}>{line.value && xrpPrice ? `$${fCurrency5(line.value * xrpPrice)}` : `${fCurrency5(line.value)} XRP`}</span>
                              </div>
                            );
                          })}
                          {/* Pagination */}
                          <div className="flex items-center justify-end gap-2 mt-4">
                            <button onClick={() => setHoldingsPage(Math.max(0, holdingsPage - 1))} disabled={holdingsPage === 0} className={cn("text-[12px] transition-colors", holdingsPage === 0 ? (isDark ? "text-white/10" : "text-gray-200") : (isDark ? "text-white/40 hover:text-white/60" : "text-gray-400 hover:text-gray-600"))}>‹</button>
                            <span className={cn("text-[12px] tabular-nums", isDark ? "text-white/40" : "text-gray-400")}>{holdingsPage + 1}</span>
                            <button onClick={() => setHoldingsPage(holdingsPage + 1)} disabled={holdingsPage >= Math.ceil(holdings.total / 20) - 1} className={cn("text-[12px] transition-colors", holdingsPage >= Math.ceil(holdings.total / 20) - 1 ? (isDark ? "text-white/10" : "text-gray-200") : (isDark ? "text-white/40 hover:text-white/60" : "text-gray-400 hover:text-gray-600"))}>›</button>
                          </div>
                        </>
                      ) : (
                        <p className={cn("text-[13px] py-8 text-center", isDark ? "text-white/30" : "text-gray-400")}>
                          {hideZeroHoldings ? 'No tokens with balance' : 'No token holdings'}
                        </p>
                      )}
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
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <p className={cn("text-[11px] uppercase tracking-wider", isDark ? "text-white/40" : "text-gray-400")}>
                          TRADING PERFORMANCE ({totalCount})
                        </p>
                        <input
                          type="text"
                          placeholder="Search..."
                          value={tokenSearch}
                          onChange={(e) => setTokenSearch(e.target.value)}
                          className={cn(
                            "text-[12px] px-3 py-1.5 rounded border-none outline-none w-32",
                            isDark ? "bg-white/[0.05] text-white/70 placeholder:text-white/30" : "bg-gray-100 text-gray-600 placeholder:text-gray-400"
                          )}
                        />
                      </div>
                      {/* Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className={cn("border-b", isDark ? "border-white/5" : "border-gray-100")}>
                              <th className={cn("py-2 pr-2 text-left text-[10px] font-medium uppercase tracking-wider", isDark ? "text-white/40" : "text-gray-400")}>Token</th>
                              <th className={cn("py-2 px-2 text-right text-[10px] font-medium uppercase tracking-wider", isDark ? "text-white/40" : "text-gray-400")}>Volume</th>
                              <th className={cn("py-2 px-2 text-right text-[10px] font-medium uppercase tracking-wider", isDark ? "text-white/40" : "text-gray-400")}>Trades</th>
                              <th className={cn("py-2 px-2 text-right text-[10px] font-medium uppercase tracking-wider text-green-500/70")}>Bought</th>
                              <th className={cn("py-2 px-2 text-right text-[10px] font-medium uppercase tracking-wider text-red-500/70")}>Sold</th>
                              <th className={cn("py-2 px-2 text-right text-[10px] font-medium uppercase tracking-wider", isDark ? "text-white/40" : "text-gray-400")}>ROI</th>
                              <th className={cn("py-2 pl-2 text-right text-[10px] font-medium uppercase tracking-wider", isDark ? "text-white/40" : "text-gray-400")}>PNL</th>
                            </tr>
                          </thead>
                          <tbody>
                            {displayTokens.map((token, idx) => {
                              const roi = token.roi || 0;
                              const profit = token.profit || 0;
                              const bought = token.xrpBought || 0;
                              const sold = token.xrpSold || 0;
                              return (
                                <tr key={idx} className={cn("border-b", isDark ? "border-white/5 hover:bg-white/[0.02]" : "border-gray-100 hover:bg-gray-50")}>
                                  <td className="py-2.5 pr-2">
                                    <Link href={`/token/${token.tokenId}`} className="flex items-center gap-2">
                                      <img src={`https://s1.xrpl.to/token/${token.tokenId}`} className="w-5 h-5 rounded-full" onError={(e) => { e.target.style.display = 'none'; }} alt="" />
                                      <span className={cn("text-[12px] hover:text-primary transition-colors", isDark ? "text-white/80" : "text-gray-700")}>{token.name}</span>
                                    </Link>
                                  </td>
                                  <td className={cn("py-2.5 px-2 text-right text-[12px] tabular-nums", isDark ? "text-white/70" : "text-gray-600")}>{fCurrency5(token.volume || 0)}</td>
                                  <td className={cn("py-2.5 px-2 text-right text-[12px] tabular-nums", isDark ? "text-white/70" : "text-gray-600")}>{fCurrency5(token.trades || 0)}</td>
                                  <td className="py-2.5 px-2 text-right"><span className="text-[12px] tabular-nums text-green-500">{fCurrency5(bought)}</span></td>
                                  <td className="py-2.5 px-2 text-right"><span className="text-[12px] tabular-nums text-red-500">{fCurrency5(sold)}</span></td>
                                  <td className="py-2.5 px-2 text-right">
                                    <span className={cn("text-[12px] tabular-nums", roi >= 0 ? "text-green-500" : "text-red-500")}>
                                      {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                                    </span>
                                  </td>
                                  <td className="py-2.5 pl-2 text-right">
                                    <span className={cn("text-[12px] font-medium tabular-nums", profit >= 0 ? "text-green-500" : "text-red-500")}>
                                      {profit >= 0 ? '+' : ''}{fCurrency5(profit)}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {filteredTokens.length > 10 && (
                        <button onClick={() => setShowAllTokens(!showAllTokens)} className={cn("w-full text-center py-3 text-[12px] mt-4 transition-colors", isDark ? "text-white/40 hover:text-white/60" : "text-gray-400 hover:text-gray-600")}>
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
                  <div className={cn("rounded-xl p-12 text-center border", isDark ? "bg-white/[0.02] border-white/10" : "bg-gray-50 border-gray-200")}>
                    <Image size={32} className={cn("mx-auto mb-3", isDark ? "text-white/20" : "text-gray-300")} />
                    <p className={cn("text-[13px] mb-1", isDark ? "text-white/50" : "text-gray-500")}>No NFTs found</p>
                    <p className={cn("text-[11px]", isDark ? "text-white/30" : "text-gray-400")}>NFTs owned by this account will appear here</p>
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
                  <div className={cn("rounded-xl border mt-4", isDark ? "bg-white/[0.02] border-white/10" : "bg-white border-gray-200")}>
                    <div className={cn("p-4 border-b", isDark ? "border-white/10" : "border-gray-100")}>
                      <p className={cn("text-[11px] font-medium uppercase tracking-wider", isDark ? "text-white/50" : "text-gray-500")}>Trading Stats by Collection</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[12px]">
                        <thead>
                          <tr className={cn("text-left text-[10px] uppercase", isDark ? "text-white/40" : "text-gray-400")}>
                            <th className="px-4 py-3">Collection</th>
                            <th className="px-4 py-3 text-right">Volume</th>
                            <th className="px-4 py-3 text-right">P/L</th>
                            <th className="px-4 py-3 text-right">ROI</th>
                            <th className="px-4 py-3 text-right">Trades</th>
                          </tr>
                        </thead>
                        <tbody className={cn("divide-y", isDark ? "divide-white/[0.06]" : "divide-gray-100")}>
                          {nftCollectionStats.slice(0, 15).map(c => (
                            <tr key={c.cid} className={cn("transition-colors", isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50")}>
                              <td className="px-4 py-3">
                                <Link href={`/collection/${c.slug}`} className="flex items-center gap-2 group">
                                  {c.logo && <img src={`https://s1.xrpl.to/nft-collection/${c.logo}`} alt="" className="w-6 h-6 rounded object-cover" />}
                                  <span className={cn("group-hover:text-blue-500 truncate max-w-[120px]", isDark ? "text-white/90" : "text-gray-900")}>{c.name}</span>
                                </Link>
                              </td>
                              <td className={cn("px-4 py-3 text-right tabular-nums", isDark ? "text-white/70" : "text-gray-700")}>{c.volume?.toFixed(1) || 0} XRP</td>
                              <td className={cn("px-4 py-3 text-right tabular-nums font-medium", c.profit >= 0 ? "text-emerald-500" : "text-red-400")}>{c.profit >= 0 ? '+' : ''}{c.profit?.toFixed(1) || 0}</td>
                              <td className={cn("px-4 py-3 text-right tabular-nums", c.roi >= 0 ? "text-emerald-500" : "text-red-400")}>{c.roi?.toFixed(1) || 0}%</td>
                              <td className={cn("px-4 py-3 text-right tabular-nums", isDark ? "text-white/50" : "text-gray-500")}>{c.trades || 0}</td>
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
              <div className={cn("rounded-xl border", isDark ? "bg-white/[0.02] border-white/10" : "bg-white border-gray-200")}>
                <div className={cn("p-4 border-b flex items-center justify-between", isDark ? "border-white/10" : "border-gray-100")}>
                  <p className={cn("text-[11px] font-medium uppercase tracking-wider", isDark ? "text-white/50" : "text-gray-500")}>Transaction History</p>
                  <span className={cn("text-[10px] px-2 py-0.5 rounded", isDark ? "bg-white/5 text-white/40" : "bg-gray-100 text-gray-500")}>{txHistory.length}</span>
                </div>
                {txHistory.length === 0 ? (
                  <div className={cn("p-8 text-center", isDark ? "text-white/35" : "text-gray-400")}>
                    <p className="text-[13px]">No transactions found</p>
                  </div>
                ) : (
                  <div className={cn("divide-y", isDark ? "divide-white/[0.06]" : "divide-gray-100")}>
                    {txHistory.slice(0, 50).map((tx) => {
                      const parsed = parseTx(tx);
                      return (
                        <Link key={parsed.id} href={`/tx/${parsed.hash}`} className={cn("flex items-center gap-3 px-4 py-3 transition-colors", isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50")}>
                          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", parsed.type === 'in' ? "bg-emerald-500/10" : "bg-red-500/10")}>
                            {parsed.type === 'in' ? <ArrowDownLeft size={16} className="text-emerald-500" /> : <ArrowUpRight size={16} className="text-red-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className={cn("text-[13px] font-medium", isDark ? "text-white/90" : "text-gray-900")}>{parsed.label}</p>
                              {parsed.isDust && <span className={cn("text-[9px] px-1 py-0.5 rounded font-medium", isDark ? "bg-amber-500/10 text-amber-400" : "bg-amber-100 text-amber-600")}>Dust</span>}
                            </div>
                            <p className={cn("text-[10px]", isDark ? "text-white/35" : "text-gray-400")}>{parsed.time ? new Date(parsed.time).toLocaleString() : ''}</p>
                          </div>
                          <div className="text-right shrink-0">
                            {parsed.amount && <p className={cn("text-[12px] font-medium tabular-nums whitespace-nowrap", isDark ? "text-white/70" : "text-gray-700")}>{parsed.amount}</p>}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* NFT Trades Section */}
              <div className={cn("rounded-xl border mt-4", isDark ? "bg-white/[0.02] border-white/10" : "bg-white border-gray-200")}>
                <div className={cn("p-4 border-b flex items-center justify-between", isDark ? "border-white/10" : "border-gray-100")}>
                  <div className="flex items-center gap-2">
                    <Image size={14} className={isDark ? "text-white/50" : "text-gray-500"} />
                    <p className={cn("text-[11px] font-medium uppercase tracking-wider", isDark ? "text-white/50" : "text-gray-500")}>NFT Trades</p>
                  </div>
                  <span className={cn("text-[10px] px-2 py-0.5 rounded", isDark ? "bg-white/5 text-white/40" : "bg-gray-100 text-gray-500")}>{nftTrades.length}</span>
                </div>
                {nftTradesLoading ? (
                  <div className={cn("p-8 text-center", isDark ? "text-white/35" : "text-gray-400")}>
                    <p className="text-[13px]">Loading NFT trades...</p>
                  </div>
                ) : nftTrades.length === 0 ? (
                  <div className={cn("p-8 text-center", isDark ? "text-white/35" : "text-gray-400")}>
                    <p className="text-[13px]">No NFT trades found</p>
                  </div>
                ) : (
                  <div className={cn("divide-y", isDark ? "divide-white/[0.06]" : "divide-gray-100")}>
                    {nftTrades.slice(0, 20).map((trade) => {
                      const isSeller = trade.seller === account;
                      const label = isSeller ? 'Sold NFT' : 'Bought NFT';
                      const amt = trade.costXRP || 0;
                      return (
                        <Link key={trade._id} href={`/tx/${trade.hash}`} className={cn("flex items-center gap-3 px-4 py-3 transition-colors", isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50")}>
                          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", isSeller ? "bg-emerald-500/10" : "bg-red-500/10")}>
                            {isSeller ? <ArrowDownLeft size={16} className="text-emerald-500" /> : <ArrowUpRight size={16} className="text-red-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-[13px] font-medium", isDark ? "text-white/90" : "text-gray-900")}>{label}</p>
                            <p className={cn("text-[10px]", isDark ? "text-white/35" : "text-gray-400")}>{trade.time ? new Date(trade.time).toLocaleString() : ''}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={cn("text-[12px] font-medium tabular-nums", isSeller ? "text-emerald-500" : "text-red-400")}>{isSeller ? '+' : '-'}{amt.toFixed(2)} XRP</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
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
